/**
 * 学习主题：State batching 与函数式更新 —— 更新队列、自动批处理、flushSync 与「什么时候必须函数式更新」
 *
 * React 核心概念：
 * - setter 不会立刻改本次渲染里的 state，只是往这个 state 的【更新队列】里排一条更新；
 *   事件处理器整个执行完之后，React 才在下一次渲染里按顺序处理队列 —— 03 题「连写两次只加 1」的底层机制就是它
 * - 队列里有两种更新：传值 setCount(5) = 「替换成 5」；传函数 setCount(c => c + 1) = updater（更新函数），
 *   「把队列里前一条算出的结果当 c 传进来，用返回值替换掉」。区块一用一个 applyQueue 模拟器把这条规则跑给你看
 * - 批处理（batching）：同一个事件里的多次 setState 合并成【一次】渲染、一次提交（commit），
 *   中间状态永远不会画到屏幕上。React 18+ 的 createRoot 在 setTimeout / Promise / 原生监听器里也自动批处理
 *   （React 17 只在 React 自己的事件处理器里批，这是面试常问的版本差异）
 * - flushSync（来自 react-dom，不是 react）：强制 React 立刻同步渲染并提交，把批处理拆开；
 *   只有「setState 之后必须马上读 DOM」（量尺寸、滚到刚插入的元素）才用，代价是多一次渲染
 * - 什么时候必须函数式更新：新值由旧值算出来，且读到的旧值可能已经过期 —— 同一事件里多次更新、
 *   异步回调里更新、更新逻辑要脱离当前渲染复用（区块三的清单）；updater 必须是纯函数（StrictMode 开发期会调它两次）
 *
 * Vue 对应概念：
 * - 赋值即生效：count.value++ 连写两次真的加 2，改完下一行就能读到新值；
 *   Vue 没有「更新队列」也没有「函数式更新」——没有一一对应关系
 * - Vue 批的是【DOM 刷新】不是数据：同一个 tick 里改再多 ref，调度器也只在微任务里刷新一次 DOM；
 *   无论在事件处理器里还是 setTimeout 里都是如此，没有「17 vs 18」的版本故事
 * - nextTick：等这次 DOM 刷新完成再读；与 flushSync 方向相反（一个「等它刷完」，一个「逼它现在刷」）
 *
 * 最重要的区别：
 * - React 批的是「state 更新」（数据层）：处理器执行期间 state 是冻结的快照，所有改动排队等下一次渲染，
 *   所以才需要 updater 去拿「排队之后的最新值」；
 *   Vue 批的是「DOM 更新」（视图层）：数据立刻改、立刻可读，只有 DOM 是延迟到微任务里刷新的。
 *   两边都在「批」，批的东西不同 —— 这是本题最容易被类比带偏的地方
 * - 由此：React 里「setState 后立刻读 DOM 还是旧的」要用 flushSync 逼一次同步渲染；
 *   Vue 里「改 ref 后立刻读 DOM 还是旧的」要 await nextTick() 等一次刷新。同一个现象，工具方向相反
 * - 与相邻题的区别：03 题只做最小的 +1 / +2 复现；23 题讲「一次渲染 = 一次函数执行」与快照本身；
 *   本题讲快照之上「多个更新怎么排队、怎么合并、怎么拆开、何时必须用 updater」；26 题继续讲异步回调里的过期闭包
 */
import { useEffect, useRef, useState, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'

/* ============================================================================
 * 公共小件：页面日志面板 + 会在卸载时自动清理的 setTimeout
 * ========================================================================== */

interface LogPanelProps {
  lines: string[]
  onClear: () => void
}

/**
 * 只追加的运行日志。
 * key 用 index 是 06 题「key 必须是稳定唯一 id」规则里被允许的例外：条目只会追加到末尾、从不重排或删除，
 * index 在这里就是稳定身份。日志放在组件 state 里而不是模块级变量里 —— StrictMode 双挂载 + 切题重进都不会串台。
 */
function LogPanel({ lines, onClear }: LogPanelProps) {
  return (
    <div className="stack">
      <ul className="log">
        {lines.length === 0 && <li className="log-empty">（还没有记录，点上面的按钮）</li>}
        {lines.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
      <div className="row">
        <button className="btn-ghost" onClick={onClear}>
          清空日志
        </button>
      </div>
    </div>
  )
}

type TimerId = ReturnType<typeof setTimeout>

/**
 * 「会自己收拾的 setTimeout」：返回一个 later(fn, ms)，登记过的定时器在组件卸载时全部 clearTimeout。
 * 定时器 id 存在 useRef 里（12 题：跨渲染保存、不触发渲染的可变值），普通变量活不过一次渲染。
 * 区块二、三都用它 —— 演示「坏写法」时也不许漏 cleanup：坏的是「读到的值」，不是「清理纪律」。
 */
function useTimeouts() {
  const idsRef = useRef<TimerId[]>([])

  useEffect(() => {
    // 先把数组本身拷到局部变量再交给 cleanup：exhaustive-deps 会提醒「cleanup 里的 ref.current 可能已经变了」，
    // 这里数组引用从不更换（只原地增删），拿住它就够了。StrictMode 的挂载→卸载→重挂载也走这条 cleanup。
    const ids = idsRef.current
    return () => {
      ids.forEach((id) => clearTimeout(id))
      ids.length = 0
    }
  }, [])

  return (callback: () => void, ms: number) => {
    const id = setTimeout(() => {
      const ids = idsRef.current
      ids.splice(ids.indexOf(id), 1)
      callback()
    }, ms)
    idsRef.current.push(id)
  }
}

/* ============================================================================
 * ★ 区块一：更新队列 —— 传值是「替换」，传函数是「由前值算新值」
 * ========================================================================== */

/**
 * 队列里的一条更新。SetStateAction<number> 正是 setCount 的参数类型：
 * number | ((prevState: number) => number) —— 要么一个值，要么一个 updater 函数。
 */
type QueuedUpdate = SetStateAction<number>

/**
 * React 处理更新队列的规则（对应官方文档 "Queueing a series of state updates" 那一章）：
 * 从「上一次渲染的 state」出发，按排队顺序逐条处理 ——
 * - 遇到值：直接替换（前面累计出来的结果被丢掉）；
 * - 遇到 updater 函数：把当前累计结果传给它，用返回值替换累计结果。
 * 全部处理完的结果就是下一次渲染的 state。
 *
 * 这就是「updater function 如何依次接收最新的排队状态」的答案：它接收的不是「屏幕上的 count」，
 * 而是「队列里排在它前面的更新算完之后的中间结果」。这个函数和 React 内部做的事等价
 * （React 的实现当然复杂得多：优先级、跳过、重放……但语义就是这一个 reduce），
 * 用来在页面上给出「预测值」，下一次渲染再和实际值对照。
 *
 * 顺带一条铁律：updater 必须是纯函数 —— 只拿 c 算新值，不发请求、不改外部变量。
 * StrictMode 开发期会把每个 updater 调用两次（只采用其中一次的结果）来暴露副作用。
 */
function applyQueue(base: number, queue: QueuedUpdate[]): number {
  return queue.reduce<number>(
    (acc, update) => (typeof update === 'function' ? update(acc) : update),
    base,
  )
}

/** 日志里一条更新怎么显示 + 它本身 */
interface QueueEntry {
  label: string
  update: QueuedUpdate
}

const replaceWith = (value: number): QueueEntry => ({ label: `替换成 ${value}`, update: value })
const PLUS_ONE: QueueEntry = { label: 'c => c + 1', update: (c) => c + 1 }

/**
 * 四个按钮各排一个不同的队列。看清楚每个处理器都写了「真的 setCount」和「把同一队列交给模拟器」两部分 ——
 * 前者是 React 真实执行的，后者只是把预测写进日志，下一次渲染页面会显示两者是否一致。
 *
 * 为什么 A 通常只加 1？两行 setCount(count + 1) 读到的 count 是同一个快照 N（23 题），
 * 队列是 [替换成 N+1, 替换成 N+1]，两条都在说「设成 N+1」。
 * 「通常」两个字的含义：这个结果和批不批处理【无关】—— 哪怕退回 React 17 不批处理的场景，
 * 第二行读到的 count 仍然是闭包里的 N。批处理决定的是「渲染几次」，不是「count 加几」。
 *
 * 为什么 B 能加 2？两条都是 updater：第一条拿到 N 返回 N+1，第二条拿到的是「前一条算完的 N+1」返回 N+2。
 * 把 updater 想成「排队的指令」而不是「立刻执行的赋值」，一切就通了。
 *
 * Vue 老手最容易想错的地方：Vue 里 count.value = count.value + 1 写两次真的加 2，因为赋值即生效、
 * 下一行读到的就是新值；Vue 没有队列、没有 updater —— 没有一一对应关系，只能重建心智模型。
 */
function UpdateQueueBlock() {
  const [count, setCount] = useState(0)
  const [lines, setLines] = useState<string[]>([])
  /** 模拟器对「上一次点击」的预测；下一次渲染时和实际 count 对照 */
  const [prediction, setPrediction] = useState<number | null>(null)

  const record = (button: string, queue: QueueEntry[]) => {
    // 这里读到的 count 也是本次渲染的快照 —— 和 React 处理队列时的起点（上一次渲染的 state）正好相同
    const predicted = applyQueue(count, queue.map((entry) => entry.update))
    setPrediction(predicted)
    setLines((prev) => [
      ...prev,
      `点 ${button}｜本次渲染的 count = ${count}｜队列 [${queue.map((entry) => entry.label).join(', ')}]｜模拟器算出 ${predicted}`,
    ])
  }

  /** A：两次都传值。两行读到同一个快照 N → 队列 [替换成 N+1, 替换成 N+1] → 只加 1 */
  const addTwiceByValue = () => {
    setCount(count + 1)
    setCount(count + 1)
    record('A', [replaceWith(count + 1), replaceWith(count + 1)])
  }

  /** B：两次都传 updater。第二条拿到的是第一条算完的结果 → 加 2 */
  const addTwiceByUpdater = () => {
    setCount((current) => current + 1)
    setCount((current) => current + 1)
    record('B', [PLUS_ONE, PLUS_ONE])
  }

  /** C：先值后函数。队列 [替换成 N+5, c => c + 1]：替换后再由 N+5 算出 N+6 → 加 6 */
  const addFiveThenOne = () => {
    setCount(count + 5)
    setCount((current) => current + 1)
    record('C', [replaceWith(count + 5), PLUS_ONE])
  }

  /** D：最后一条是值。前两条算得再热闹，最后「替换成 42」把累计结果整个丢掉 → 等于 42 */
  const addFiveThenOneThenSet42 = () => {
    setCount(count + 5)
    setCount((current) => current + 1)
    setCount(42)
    record('D', [replaceWith(count + 5), PLUS_ONE, replaceWith(42)])
  }

  const reset = () => {
    setCount(0)
    setPrediction(null)
  }

  return (
    <div className="card stack">
      <h3>区块一：更新队列 —— 传值是「替换」，传函数是「由前值算新值」</h3>
      <p className="muted">
        依次点 A / B / C / D，对照按钮上的预期看 count 变了多少；日志里是这次点击排进队列的内容和模拟器算出的预测，
        页面上会显示它和实际值是否一致。
      </p>
      <p>
        当前 count：<strong>{count}</strong>
      </p>
      <div className="row">
        <button onClick={addTwiceByValue}>{'A：setCount(count + 1) ×2 → 只 +1'}</button>
        <button className="btn-primary" onClick={addTwiceByUpdater}>
          {'B：setCount(current => current + 1) ×2 → +2'}
        </button>
        <button onClick={addFiveThenOne}>{'C：setCount(count + 5); setCount(c => c + 1) → +6'}</button>
        <button onClick={addFiveThenOneThenSet42}>{'D：C 之后再 setCount(42) → 等于 42'}</button>
        <button className="btn-ghost" onClick={reset}>
          归零
        </button>
      </div>
      {/* 派生值直接在渲染期算（09 题）：这一行本身就是「新 UI 来自新一次渲染」的证据 —— 点击时预测的数字，要到这次渲染才和实际 count 见面 */}
      {prediction !== null && (
        <p className={prediction === count ? 'success-text' : 'error-text'}>
          上一次点击：模拟器预测 {prediction}，实际 count = {count}
          {prediction === count ? ' ✓ 一致' : ' ✗ 不一致'}
        </p>
      )}
      <LogPanel lines={lines} onClear={() => setLines([])} />
    </div>
  )
}

/* ============================================================================
 * ★ 区块二：批处理 —— 一次事件只提交一次渲染；flushSync 拆开它
 * ========================================================================== */

/** setTimeout 演示用的延迟；短到不用等、长到能看出「不是同步发生的」 */
const TIMEOUT_MS = 200

/**
 * 「提交次数」怎么数才诚实：用一个依赖 [count, flag] 的 effect 当探针 ——
 * 它在每一次「count 或 flag 落地到屏幕」的提交之后跑一次。同一个事件里改两个 state 若合并成一次提交，
 * 它就只跑一次；flushSync 把两次更新拆成两次提交，它就跑两次。数字不会撒谎。
 *
 * 两点说明：
 * 1）挂载时 StrictMode 会把 effect 「跑 → 清理 → 再跑」一遍（10 题），所以页面一打开就是 2 次、日志里就有 2 行；
 *    生产构建只有 1 次。
 * 2）这是「探针」用法，不是业务代码该有的模式 —— 用 effect 把一个 state 同步到另一个 state 是 10 题清单里的反模式。
 *
 * 批处理为什么重要（面试题「setState 是同步还是异步」的完整答案）：
 * - 同一个事件里的多次 setState 会被合并，处理器跑完才统一渲染一次 —— 所以处理器里读 state 永远是旧值，
 *   看起来像「异步」；实际上它既不是 Promise 也不是 setTimeout，只是「延后到事件结束」；
 * - 好处一是性能（不会改一个 state 画一次），好处二是【一致性】：永远不会画出「count 已变、flag 还没变」的半成品 UI；
 * - React 18 之前，setTimeout / Promise.then / 原生 addEventListener 里的 setState 【不】批处理，每调一次画一次；
 *   React 18 起 createRoot 下一律自动批处理（automatic batching）。本项目 main.tsx 用的就是 createRoot。
 *
 * flushSync（import { flushSync } from 'react-dom'）：
 * - 把回调里排的更新立刻同步渲染并提交，然后才返回 —— 它是「逼 React 现在就画」；
 * - 正当用途极少：setState 之后马上要读 DOM 布局（scrollIntoView 到刚插入的行、量高度）；
 *   与第三方命令式库对接时需要 DOM 已就绪。绝大多数「读最新 DOM」的需求用 useLayoutEffect / useEffect 更合适；
 * - 代价：每次 flushSync 都是一次完整的同步渲染，滥用等于自己关掉批处理。
 *
 * Vue 对照：Vue 批的是 DOM 刷新（同一 tick 内改再多 ref，DOM 只刷一次），数据本身改完立刻可读；
 * 想读新 DOM 用 await nextTick() ——「等它刷完」，与 flushSync 的「逼它现在刷」方向相反。
 */
function BatchingBlock() {
  const [count, setCount] = useState(0)
  const [flag, setFlag] = useState(false)
  const [commits, setCommits] = useState(0)
  const [lines, setLines] = useState<string[]>([])
  /** DOM ref（12 题）：用来在事件处理器里「立刻读 DOM 文本」，验证渲染到底发生了没有 */
  const countElRef = useRef<HTMLElement>(null)
  const later = useTimeouts()

  // 探针 effect：count / flag 每落地一次（一次提交），这里跑一次。日志行以「↳」开头，方便和点击行区分。
  useEffect(() => {
    setCommits((c) => c + 1)
    setLines((prev) => [...prev, `↳ 提交落地（count = ${count}, flag = ${String(flag)}）`])
  }, [count, flag])

  const append = (line: string) => setLines((prev) => [...prev, line])

  /** 同一个事件里改两个 state：合并成一次渲染、一次提交 → 提交次数 +1，日志里只多一行「↳」 */
  const updateBothInEvent = () => {
    append('点「同一事件改两个 state」→ 期待只落地 1 次')
    setCount((c) => c + 1)
    setFlag((f) => !f)
  }

  /** setTimeout 里改两个 state：React 18+ 自动批处理，仍然只提交一次（React 17 这里会是 2 次） */
  const updateBothInTimeout = () => {
    append(`点「setTimeout 里改两个 state」→ ${TIMEOUT_MS}ms 后改，期待仍只落地 1 次（自动批处理）`)
    later(() => {
      setCount((c) => c + 1)
      setFlag((f) => !f)
    }, TIMEOUT_MS)
  }

  /** 用 flushSync 把两次更新拆开：每个 flushSync 都同步渲染 + 提交 → 提交次数 +2，日志里多两行「↳」 */
  const updateBothWithFlushSync = () => {
    append('点「flushSync 拆开」→ 期待落地 2 次')
    flushSync(() => setCount((c) => c + 1))
    flushSync(() => setFlag((f) => !f))
  }

  /** setCount 之后立刻读 DOM：渲染还排在事件之后，读到的是旧文本 */
  const readDomAfterSetState = () => {
    setCount((c) => c + 1)
    append(`setCount 之后立刻读 DOM：「${countElRef.current?.textContent ?? '?'}」—— 还是旧值，渲染要等这个事件处理完`)
  }

  /** flushSync 之后读 DOM：React 已经同步渲染并提交，读到的是新文本 */
  const readDomAfterFlushSync = () => {
    flushSync(() => setCount((c) => c + 1))
    append(`flushSync 之后读 DOM：「${countElRef.current?.textContent ?? '?'}」—— 已是新值，flushSync 返回前就画完了`)
  }

  return (
    <div className="card stack">
      <h3>区块二：批处理 —— 一次事件只提交一次；flushSync 才能拆开</h3>
      <p className="muted">
        先记住「落地的提交次数」，再点前三个按钮，看它 +1 还是 +2（页面刚打开就是 2：StrictMode 把探针 effect 跑了两遍，生产环境是
        1）。后两个按钮对照「setState 后立刻读 DOM」是旧是新。
      </p>
      <p className="row">
        <span>count：</span>
        <strong ref={countElRef}>{count}</strong>
        <span className="badge">flag = {String(flag)}</span>
        <span className="badge">count / flag 落地的提交次数：{commits}</span>
      </p>
      <div className="row">
        <button onClick={updateBothInEvent}>同一事件改两个 state（+1 次）</button>
        <button onClick={updateBothInTimeout}>setTimeout 里改两个 state（仍 +1 次）</button>
        <button className="btn-primary" onClick={updateBothWithFlushSync}>
          flushSync 拆开（+2 次）
        </button>
      </div>
      <div className="row">
        <button onClick={readDomAfterSetState}>setCount 后立刻读 DOM（旧文本）</button>
        <button onClick={readDomAfterFlushSync}>flushSync 后立刻读 DOM（新文本）</button>
      </div>
      <LogPanel lines={lines} onClear={() => setLines([])} />
    </div>
  )
}

/* ============================================================================
 * ★ 区块三：什么时候【必须】用函数式更新
 * ========================================================================== */

/** 给你留出连点三次的时间 */
const DELAY_MS = 1500

/**
 * 判断口诀：新值要由旧值算出来，而且「你手里的旧值」可能已经不是最新的 —— 就必须用 updater。
 * 具体清单（面试可以直接背）：
 * 1）同一个事件里对同一个 state 更新多次：区块一的 A vs B；
 * 2）在异步回调里更新：setTimeout / setInterval / Promise.then / await 之后 / 手动 addEventListener 的回调。
 *    回调创建时捕获的 count 是那一帧的快照，等它真正执行时可能已经过了好几次渲染（本区块；26 题深挖）；
 * 3）更新逻辑要脱离「当前渲染」复用：传给子组件的 onIncrement={() => setCount(c => c + 1)}，
 *    子组件根本不知道父组件的 count 是多少；用 useCallback 包时也不必把 count 写进依赖（17 题）；
 * 4）自定义 Hook 里对外暴露的 increment()：调用方在什么时候调、调几次你都不知道（14 题）。
 * 反过来，新值【不依赖】旧值的场景用值就好：setCount(0)、setKeyword(e.target.value)、setOpen(true)。
 *
 * 一条重要的边界：函数式更新只解决「由旧算新」这一件事。如果异步回调里要读最新值去做【别的事】
 * （发请求、打日志、判断条件），updater 帮不上忙 —— 那要用 ref 存最新值（10 题的 latest ref、26 题详讲）。
 *
 * 这个区块演示第 2 条：1.5 秒内连点 3 次「坏」按钮，三个定时器回调捕获的都是同一个快照 N，
 * 三次都在 setCount(N + 1)，最终只 +1；换成 updater，三次各自拿「前一次算完的结果」，+3。
 * 在 Vue 里根本没有这个坑：setTimeout(() => count.value++) 里的 .value 永远现读现取，没有一一对应关系。
 */
function WhenUpdaterBlock() {
  const [count, setCount] = useState(0)
  const [pending, setPending] = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const later = useTimeouts()

  const append = (line: string) => setLines((prev) => [...prev, line])

  /** ❌ 回调里读的 count 是点击那一刻的快照；三个回调都用同一个 N 算，最终只 +1 */
  const scheduleByValue = () => {
    append(`坏：${DELAY_MS}ms 后执行 setCount(count + 1)，此刻闭包里的 count = ${count}`)
    setPending((p) => p + 1)
    later(() => {
      setPending((p) => p - 1)
      setCount(count + 1)
      append(`  坏按钮的定时器触发：setCount(${count} + 1) —— 用的是点击时的快照 ${count}`)
    }, DELAY_MS)
  }

  /** ✅ updater 由 React 在处理队列时传入最新值，三个回调依次 +1，最终 +3 */
  const scheduleByUpdater = () => {
    append(`好：${DELAY_MS}ms 后执行 setCount(c => c + 1)，不读闭包里的 count`)
    setPending((p) => p + 1)
    later(() => {
      setPending((p) => p - 1)
      setCount((c) => c + 1)
      append('  好按钮的定时器触发：setCount(c => c + 1) —— c 由 React 传入，永远是最新值')
    }, DELAY_MS)
  }

  return (
    <div className="card stack">
      <h3>区块三：什么时候必须函数式更新 —— 异步回调里由旧算新</h3>
      <p className="muted">
        1.5 秒内连点 3 次「坏」按钮，等定时器全部触发后 count 只 +1；再连点 3 次「好」按钮，+3。
        完整清单在这个区块的注释里。
      </p>
      <p className="row">
        <span>count：</span>
        <strong>{count}</strong>
        <span className="badge">在途定时器：{pending} 个</span>
      </p>
      <div className="row">
        <button onClick={scheduleByValue}>{'坏：1.5 秒后 setCount(count + 1)（连点 3 次只 +1）'}</button>
        <button className="btn-primary" onClick={scheduleByUpdater}>
          {'好：1.5 秒后 setCount(c => c + 1)（连点 3 次 +3）'}
        </button>
        <button className="btn-ghost" onClick={() => setCount(0)}>
          归零
        </button>
      </div>
      <LogPanel lines={lines} onClear={() => setLines([])} />
    </div>
  )
}

export default function Example() {
  return (
    <div className="stack">
      <UpdateQueueBlock />
      <BatchingBlock />
      <WhenUpdaterBlock />
    </div>
  )
}
