/**
 * 学习主题：过期闭包（stale closure）—— 延迟回调、手动事件监听、轮询读到旧 state 的现场、观察与修法
 *
 * React 核心概念：
 * - 每次渲染都是一次新的函数执行：本帧的 count 是常量，本帧创建的每一个闭包（onClick、setTimeout 的回调、
 *   addEventListener 的 handler、effect 里的 setInterval 回调、fetch 的 .then）捕获的都是本帧的值
 * - 闭包活得比创建它的那一帧长，就会「过期」：setTimeout 2 秒后读到的仍是点击那一帧的 count（区块一）；
 *   依赖 [] 的 effect 只在挂载后跑一次，它注册的监听器 / 定时器永远读挂载那一帧的值（区块二、三）
 * - 依赖数组为什么影响闭包：依赖变化 → 先跑上一轮的 cleanup → 再跑新一轮 setup，用【新一帧的闭包】重新注册。
 *   [] = 永远用挂载那一帧的闭包；[count] = count 每变一次就换一个新闭包（代价：监听器 / 定时器销毁重建）
 * - 函数式更新 setCount(c => c + 1) 只解决「由旧值算新值」这一类问题：c 由 React 传入，回调不再读闭包里的 count；
 *   但回调若要读最新值去做别的事（保存、上报、当请求参数），函数式更新帮不上忙（区块一）
 * - useRef 保存最新值（latest ref）：ref 对象跨渲染恒定，每次渲染后把最新值写进 .current，
 *   任何时刻读 .current 都是最新的；代价是它不参与渲染、改它不触发更新（12 题）—— 所以只用于「读」，不用于「显示」
 * - useEffectEvent（React 19.2 内置）：把「要读最新值、但不想让它触发 effect 重跑」的逻辑包起来，
 *   返回的函数被声明为「非响应式」、不算依赖（exhaustive-deps 认得它，也禁止把它写进数组），effect 的依赖数组可以诚实地写 []
 *   （区块三；10 题手写的 latest ref 就是它的原理。注意它靠的不是引用稳定：19.2 的实现每次渲染都返回一个新的包装函数，
 *   包装内部永远转发到最新一帧的回调 —— 所以也不能把它传给子组件或写进依赖数组）
 * - cleanup 为什么重要：每一轮 effect 注册的监听器 / 定时器都是一个独立闭包，不在 cleanup 里注销，
 *   换新闭包时旧的还活着 —— 监听器堆积（一次 Enter 记多行）、过期定时器往回写、迟到的响应写进已卸载的组件（区块二、三）
 *
 * Vue 对应概念：
 * - setup 只执行一次，ref 是长期存活的容器：任何回调里的 count.value / status.value 都是现读现取，永远新鲜
 * - Vue 里唯一会「过期」的东西是你手动拷出来的普通值：const snapshot = count.value（Vue 侧每个区块都放了一个对照按钮）
 * - onMounted 里注册一次监听器、回调里读 count.value，永远正确；仍要在卸载时移除 —— 清理纪律两边完全一致
 * - 依赖数组 / 函数式更新 / latest ref / useEffectEvent 在 Vue 里都没有一一对应关系：它们修的是 React 渲染模型独有的坑
 *
 * 最重要的区别：
 * - React 函数组件每次渲染都会产生新的变量和闭包；Vue 的 setup 只跑一次、ref 是长期存活的容器。
 *   所以 React 里「这个闭包是哪一帧创建的」决定它读到什么；Vue 里回调什么时候执行、就读到什么时候的值
 * - 由此：React 的每个异步回调都要问一句「它执行时，我想读的是创建那一帧的值，还是最新值？」——
 *   前者什么都不用做（快照本来就是这样），后者要挑一种修法：函数式更新 / 依赖数组 / latest ref / useEffectEvent。
 *   Vue 没有这道选择题：现读 .value 就是最新值，想要旧值反而得手动拷贝
 * - 与邻题的分工：10 题只讲「setInterval 里 setState 读旧值」这一个案例的三种修法；本题讲更普遍的现场
 *   （根本没有 effect 的延迟回调、手动 DOM 监听、轮询读旧参数）+ 通过日志观察 + cleanup 的后果 + 官方的 useEffectEvent。
 *   快照本身见 03 / 23 题，更新队列见 24 题，异步竞态与取消见 27 题
 */
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { fetchOrders } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type OrderStatus } from '@/shared/types'

/* ============================================================================
 * 公共小件：页面日志面板 + 会在卸载时自动清理的 setTimeout
 * ========================================================================== */

interface LogPanelProps {
  lines: string[]
  onClear: () => void
  /** 空日志时的提示：告诉学习者该点哪里（区块一是按钮、区块二是输入框、区块三是「开始轮询」） */
  emptyHint?: string
}

/**
 * 只追加的运行日志。key 用 index 是 06 题「key 必须是稳定唯一 id」规则里被允许的例外：
 * 条目只会追加到末尾、从不重排或删除，index 在这里就是稳定身份。
 * 日志放在各区块组件的 state 里而不是模块级变量里 —— StrictMode 双挂载 + 切题重进都不会串台。
 */
function LogPanel({ lines, onClear, emptyHint = '（还没有记录，点上面的按钮）' }: LogPanelProps) {
  return (
    <div className="stack">
      <ul className="log">
        {lines.length === 0 && <li className="log-empty">{emptyHint}</li>}
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
 * 区块一的「坏」按钮也走这里 —— 坏的是「回调读到的值」，不是「清理纪律」：切题之后不允许还有回调往已卸载的组件里写日志。
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
 * ★ 区块一：事件处理器里的 setTimeout —— 根本没有 effect，闭包照样过期
 * ========================================================================== */

/** 延迟保存的等待时间：长到足够你在中间多点几次 +1 */
const SAVE_DELAY_MS = 2000

/**
 * 很多人以为过期闭包是 useEffect 的专属问题 —— 不是。它是「闭包 + 渲染快照」的产物，
 * 只要一个回调【晚于创建它的那一帧】执行，就可能读到旧值。这个区块里一个 useEffect 都没有（除了给 ref 同步值的那个）。
 *
 * 四个按钮，两组对照：
 * 1）「保存」这组：回调要读最新的 count 去做别的事（这里是写日志，真实业务里是发请求 / 上报）。
 *    坏版本读闭包里的 count —— 点击那一帧的快照；
 *    好版本读 latestCount.current —— 一个跨渲染恒定的盒子，每次渲染后都被同步成最新值。
 *    注意函数式更新在这组【帮不上忙】：setCount(c => c + 1) 的 c 只在 setter 内部可用，你没法拿它去发请求。
 * 2）「+1」这组：回调要「由旧值算新值」。坏版本 setCount(count + 1) 用的是点击那一帧的 count，
 *    中间加过的全被它盖回去（数字会倒退）；好版本 setCount(c => c + 1)，c 由 React 在处理更新时传入，永远最新。
 *
 * 一个常被问到的对比：JSX 里的 onClick 为什么不会过期？因为它每次渲染都被重新创建、重新绑定 ——
 * React 在 diff 时把新一帧的函数换上去了。会过期的永远是那些「创建之后被交给外部世界保管」的闭包：
 * 交给 setTimeout、交给 addEventListener、交给 setInterval、交给 Promise。
 *
 * Vue 老手最容易想错的地方：Vue 里 setTimeout(() => save(count.value)) 天生就对 —— count 是长期存活的容器，
 * .value 现读现取。Vue 侧唯一能做出「旧值」的方法，是你在点击那一刻手动拷一份 const snapshot = count.value。
 * 所以 latest ref 的对应物在 Vue 里就是 ref 本身 —— 但那是「Vue 的 ref 天然就是 latest」，
 * 不是「Vue 有一个叫 latest ref 的技巧」，没有一一对应关系。
 */
function DelayedSave() {
  const [count, setCount] = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const later = useTimeouts()

  /**
   * 日志用函数式更新追加：2 秒后执行的回调里，log 是旧一帧的闭包，但 setLines 的引用永远稳定、
   * prev 由 React 传入永远最新 —— 所以「过期的 log」照样能正确追加。这本身就是函数式更新的典型用法。
   */
  const log = (line: string) => setLines((prev) => [...prev, line])

  /**
   * latest ref：useRef 返回的对象在组件整个生命周期里是同一个，每次渲染后把最新的 count 写进 .current。
   * 这个 effect 故意不写依赖数组（每次渲染后都跑）：它的职责就是「每帧同步一次」。
   * 为什么不直接在函数体里写 latestCount.current = count？渲染必须是纯的 —— 渲染期间改 ref 是副作用
   * （并发渲染下某次渲染可能被丢弃），放进 effect 才安全（10 题修法三、12 题用途二）。
   * 什么时候该用它：回调需要「读」最新值、但这个值不需要触发重渲染、也不想让它成为 effect 的依赖。
   */
  const latestCount = useRef(count)
  useEffect(() => {
    latestCount.current = count
  })

  /** ❌ 读闭包里的 count：这是点击那一帧的快照，2 秒后早就不是页面上的数字了 */
  const saveStale = () => {
    log(`已安排：${SAVE_DELAY_MS / 1000} 秒后保存（读快照）。此刻 count=${count}，现在快去点几次 +1`)
    later(() => {
      log(`【坏】保存了 count=${count} —— 这是点击那一帧的快照，页面上的 count 已经不是它了`)
    }, SAVE_DELAY_MS)
  }

  /** ✅ 读 latestCount.current：ref 对象没过期（跨渲染同一个），里面装的值每帧都被刷新 */
  const saveLatest = () => {
    log(`已安排：${SAVE_DELAY_MS / 1000} 秒后保存（读 latest ref）。此刻 count=${count}，现在快去点几次 +1`)
    later(() => {
      log(`【好】保存了 count=${latestCount.current} —— 读的是 ref 里的最新值，和页面一致`)
    }, SAVE_DELAY_MS)
  }

  /** ❌ setCount(count + 1)：用点击那一帧的 count 算，中间加的全被盖回去，数字倒退 */
  const addStale = () => {
    log(`已安排：${SAVE_DELAY_MS / 1000} 秒后 setCount(${count} + 1)。现在快去点几次 +1，看数字会不会倒退`)
    later(() => {
      setCount(count + 1)
      log(`【坏】执行了 setCount(${count} + 1)：用的是点击那一帧的 ${count}，页面被打回 ${count + 1}`)
    }, SAVE_DELAY_MS)
  }

  /** ✅ setCount(c => c + 1)：c 由 React 传入，在「此刻的最新值」上 +1，中间加的都保住 */
  const addUpdater = () => {
    log(`已安排：${SAVE_DELAY_MS / 1000} 秒后 setCount(c => c + 1)。现在快去点几次 +1，看会不会正确地 +1`)
    later(() => {
      setCount((c) => c + 1)
      // updater 必须是纯函数，日志不能写在它里面；这里写在 setter 之外
      log('【好】执行了 setCount(c => c + 1)：c 由 React 传入，在此刻的最新值上 +1，中间加的都保住了')
    }, SAVE_DELAY_MS)
  }

  return (
    <div className="card stack">
      <h3>区块一：事件处理器里的 setTimeout —— 没有 effect，闭包照样过期</h3>
      <p className="muted">
        点任意一个「2 秒后…」按钮，然后在 2 秒内连点几次 +1，再看日志：
        「坏」的两个读到 / 算出的是点击那一帧的旧值（+1 那个还会把数字倒退回去），
        「好」的两个和页面一致。函数式更新只救「由旧算新」；要读最新值做别的事，得用 latest ref。
      </p>
      <p>
        当前 count：<strong>{count}</strong>
      </p>
      <div className="row">
        <button className="btn-primary" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
        <button className="btn-ghost" onClick={() => setCount(0)}>
          归零
        </button>
      </div>
      <div className="row">
        <button onClick={saveStale}>2 秒后保存（坏：读快照 count）</button>
        <button onClick={saveLatest}>2 秒后保存（好：读 latestCount.current）</button>
      </div>
      <div className="row">
        <button onClick={addStale}>2 秒后 +1（坏：setCount(count + 1)）</button>
        <button onClick={addUpdater}>{'2 秒后 +1（好：setCount(c => c + 1)）'}</button>
      </div>
      <LogPanel lines={lines} onClear={() => setLines([])} />
    </div>
  )
}

/* ============================================================================
 * ★ 区块二：手动 addEventListener —— 依赖数组决定「监听器里的闭包是哪一帧的」
 * ========================================================================== */

interface EnterListenerProps {
  /** 父组件的计数，每次渲染都是最新的 —— 但监听器闭包里的那份未必是 */
  count: number
  /** 往父组件的日志里写一行；父组件用 useCallback 固定了引用，写进依赖数组不会触发重跑 */
  onLog: (line: string) => void
}

/**
 * 【坏】依赖 []：监听器在挂载后注册一次，它的 handler 是挂载那一帧创建的闭包，count 永远是 0。
 *
 * 为什么会这样：effect 的 setup 只跑一次 → addEventListener 只调一次 → 交给浏览器保管的永远是第一帧的 handler。
 * 之后 count 变了、组件重渲染了无数次，每次渲染都创建了新的 handleKeyDown 函数 —— 但没人把它们交给浏览器。
 * 这和 10 题「setInterval 里读旧 count」是同一个病根，只是「外部世界」从定时器换成了 DOM 事件系统。
 *
 * ESLint 的 react-hooks/exhaustive-deps 会准确地警告「缺少依赖 count 和 onLog」。
 * 本例是刻意保留的错误示范，所以下面显式关掉了这条规则 —— 正式代码里千万别学这个 disable，
 * 看到这条警告，就说明你多半正踩在过期闭包上。
 *
 * 注意 cleanup 仍然写了：错误示范只允许错在「读到的值」，不允许错在「清理」。
 */
function BrokenEnterListener({ count, onLog }: EnterListenerProps) {
  // DOM ref（12 题用途一）：拿到真实的 <input> 元素去 addEventListener
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (el === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      // 这里的 count 恒为挂载那一帧的值（0）：这个闭包只被创建过一次
      onLog(`【坏】监听器读到 count=${count}（挂载那一帧的快照，页面上的 count 早就不是它了）`)
    }
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
    // 下面这个 [] 正是 exhaustive-deps 要报「缺少依赖 count、onLog」的地方。本例刻意保留错误示范，
    // 所以在此关掉规则 —— 正式代码里千万别学这个 disable：看到那条警告，多半就是踩了过期闭包。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="row">
      <input ref={inputRef} placeholder="在这里按 Enter（坏：依赖 []）" />
      <span className="muted">props 里的 count={count}，监听器闭包里的永远是 0</span>
    </div>
  )
}

/**
 * 【好】依赖 [count, onLog]：count 每变一次，React 先跑上一轮的 cleanup（removeEventListener 掉旧 handler），
 * 再跑新一轮 setup（addEventListener 新一帧的 handler）。交给浏览器的永远是最新一帧的闭包。
 *
 * 这就是「依赖数组为什么会影响闭包」的完整答案：依赖数组不是「什么时候执行」的开关那么简单，
 * 它决定的是「effect 里那些闭包被【重新创建并重新交出去】的时机」。
 *
 * ★ 请动手试一次：把下面的 return () => el.removeEventListener(...) 那行删掉再按 Enter ——
 * 每次 count 变化都会再挂一个新 handler，旧的一个都不走，一次 Enter 会记出好几行（各自读着不同的旧 count）。
 * 这就是「cleanup 为什么重要」最直观的版本：不清理 = 旧闭包全部活着 + 各干各的。
 * （试完记得改回来。）
 *
 * 代价与取舍：count 每变一次都要注销 / 重挂一次监听器。对 DOM 事件来说这点开销可以忽略；
 * 但若「外部资源」是 WebSocket 连接、播放器、第三方 SDK 实例，重建就不可接受 —— 那时要换 latest ref 或 useEffectEvent（区块三）。
 */
function FixedEnterListener({ count, onLog }: EnterListenerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (el === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      // 这一轮 effect 的闭包里，count 就是让它重跑的那个新值
      onLog(`【好】监听器读到 count=${count}（依赖数组让 effect 重跑，换上了新一帧的 handler）`)
    }
    el.addEventListener('keydown', handleKeyDown)
    // cleanup 承担双重职责：既是卸载清理，也是「下一轮 setup 前先注销上一轮的 handler」。删掉它试试看会发生什么（见上面的注释）
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [count, onLog])

  return (
    <div className="row">
      <input ref={inputRef} placeholder="在这里按 Enter（好：依赖 [count]）" />
      <span className="muted">props 里的 count={count}，监听器闭包里也是它</span>
    </div>
  )
}

/**
 * 区块二的容器：拥有 count 与日志，把两个监听器组件并排渲染。
 * 第三个输入框用 JSX 的 onKeyDown 作对照：它不会过期 —— 每次渲染都被重新创建、由 React 重新绑定，
 * 所以「手动 addEventListener 才需要操心闭包，React 合成事件不用」。
 * 真正需要手动监听的场景是 window / document 级事件（resize、全局快捷键）和第三方库的事件。
 */
function ListenerDemo() {
  const [count, setCount] = useState(0)
  const [lines, setLines] = useState<string[]>([])

  /**
   * useCallback + []：让 onLog 的引用在整个生命周期里稳定（17 题）。
   * 这样 FixedEnterListener 可以诚实地把它写进依赖数组，而不会因为「每次渲染都是新函数」被迫重跑。
   * 函数体里只用 setLines 的函数式更新，不读任何会变的值 —— 所以它本身不会过期，[] 是诚实的。
   */
  const appendLog = useCallback((line: string) => setLines((prev) => [...prev, line]), [])

  return (
    <div className="card stack">
      <h3>区块二：手动 addEventListener —— 依赖数组决定监听器里的闭包是哪一帧的</h3>
      <p className="muted">
        先点几次 +1，再分别在三个输入框里按 Enter：第一个永远记 count=0（挂载那一帧的闭包），
        后两个记的是当前值。想看「不写 cleanup」的后果：把 FixedEnterListener 里的 removeEventListener 删掉，
        一次 Enter 会记出好几行。
      </p>
      <p>
        当前 count：<strong>{count}</strong>
      </p>
      <div className="row">
        <button className="btn-primary" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
        <button className="btn-ghost" onClick={() => setCount(0)}>
          归零
        </button>
      </div>
      <BrokenEnterListener count={count} onLog={appendLog} />
      <FixedEnterListener count={count} onLog={appendLog} />
      <div className="row">
        {/* JSX 事件：这个箭头函数每次渲染都是新的，React 会把新的绑上去 —— 永远读到本帧的 count，不需要任何修法 */}
        <input
          placeholder="在这里按 Enter（对照：JSX onKeyDown）"
          onKeyDown={(e) => {
            if (e.key === 'Enter') appendLog(`【对照】JSX onKeyDown 读到 count=${count}（每次渲染重建，从不过期）`)
          }}
        />
        <span className="muted">React 合成事件不会过期</span>
      </div>
      <LogPanel lines={lines} onClear={() => setLines([])} emptyHint="（还没有记录，在上面的输入框里按 Enter）" />
    </div>
  )
}

/* ============================================================================
 * ★ 区块三：轮询读旧的筛选参数 —— [] / [status] / useEffectEvent 三种写法并排
 * ========================================================================== */

type StatusFilter = OrderStatus | 'all'

/** 下拉框选项；顺序固定，label 复用共享的中文文案 */
const STATUS_OPTIONS: StatusFilter[] = ['all', 'pending', 'paid', 'cancelled']
const STATUS_LABEL: Record<StatusFilter, string> = { all: '全部', ...ORDER_STATUS_TEXT }

/** as const 让 PollMode 直接从这里推导出字面量联合类型，不用手写两遍（10 题同款） */
const POLL_MODES = [
  { value: 'broken', label: '【坏】依赖 []：定时器闭包里的 status 停在挂载那一帧' },
  { value: 'restart', label: '【修法一】依赖 [status]：status 一变就销毁重建定时器' },
  { value: 'effectEvent', label: '【修法二】useEffectEvent：定时器只建一次，status 永远最新' },
] as const

type PollMode = (typeof POLL_MODES)[number]['value']

/** 轮询间隔与模拟延迟：间隔要长到你来得及切换下拉框，延迟要短到日志不用等 */
const POLL_MS = 2000
const POLL_DELAY_MS = 300

interface PollerProps {
  /** 当前筛选状态：每次渲染都是最新的 props，但定时器闭包里的那份取决于写法 */
  status: StatusFilter
  /** 稳定引用（父组件 useCallback）；写进依赖数组不会引起重跑 */
  onLog: (line: string) => void
}

/**
 * 【坏】依赖 []：effect 只在挂载后跑一次，setInterval 的回调是挂载那一帧的闭包，status 永远是当时的值。
 * 用户把下拉框切到「已支付」，页面上的 props.status 已经是 paid，定时器却每 2 秒仍然用 status=all 发请求 ——
 * 列表永远刷不出正确的数据。真实业务里这类 bug 很隐蔽：接口没报错、定时器在跑、只是参数一直是旧的。
 *
 * 日志里的「第 n 次」是【这一轮 effect 内部】的计数：坏版本只有一轮 effect，所以数字一直往上涨；
 * 对照修法一（数字会从 1 重来 —— 定时器被销毁重建）和修法二（数字连续、status 却是新的 —— 定时器没重建）。
 *
 * alive 标志 + clearInterval 是每一轮 effect 的「身份证」：cleanup 把 alive 置 false 之后，
 * 已经发出去、还没回来的请求即使返回也不再写日志 —— 否则停止轮询 / 切题之后还会冒出几行迟到的记录。
 * 这里只丢弃响应、不真的取消请求（真正的取消 AbortController 是 27 题的主角）。
 */
function BrokenPoller({ status, onLog }: PollerProps) {
  useEffect(() => {
    let alive = true
    let tickNo = 0
    const tick = () => {
      tickNo += 1
      const seq = tickNo
      // 这里的 status 恒为挂载那一帧的值：整个 effect 只跑过一次，这个闭包也只创建过一次
      fetchOrders({ status, pageSize: 20 }, { delayMs: POLL_DELAY_MS }).then((page) => {
        if (!alive) return
        onLog(`【坏】第 ${seq} 次轮询：status=${status} → ${page.total} 条`)
      })
    }
    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
    // 下面这个 [] 正是 exhaustive-deps 要报「缺少依赖 status、onLog」的地方。本例刻意保留错误示范，
    // 所以在此关掉规则 —— 正式代码里千万别学这个 disable：看到那条警告，多半就是踩了过期闭包。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <p className="muted">
      轮询中（依赖 []）。props 里的 status={status}，但定时器闭包里的 status 停在挂载那一帧 —— 看日志。
    </p>
  )
}

/**
 * 【修法一】依赖 [status]：status 一变，先 cleanup（alive=false + clearInterval）再 setup（新闭包、新定时器）。
 * 参数永远正确，日志里的「第 n 次」会从 1 重来 —— 那就是定时器被销毁重建的痕迹。
 *
 * 10 题警告过这种写法：依赖变化得比间隔还频繁时，定时器会在到点之前被反复清掉、永远不触发。
 * 但在这里它是【可接受的】，甚至是合理的：用户切换筛选条件后，「立刻按新条件查一次」本来就是想要的行为，
 * 重启定时器顺便做到了这一点。取舍的标准不是「依赖数组好不好」，而是「重建这个外部资源的代价能不能接受」——
 * 定时器可以，WebSocket 连接 / 播放器实例往往不行。
 */
function RestartingPoller({ status, onLog }: PollerProps) {
  useEffect(() => {
    let alive = true
    let tickNo = 0
    const tick = () => {
      tickNo += 1
      const seq = tickNo
      // 这一轮 effect 的闭包里，status 就是让它重跑的那个新值
      fetchOrders({ status, pageSize: 20 }, { delayMs: POLL_DELAY_MS }).then((page) => {
        if (!alive) return
        onLog(`【重启】第 ${seq} 次轮询（本轮 effect 内计数）：status=${status} → ${page.total} 条`)
      })
    }
    tick()
    const id = setInterval(tick, POLL_MS)
    // cleanup 在 status 变化前 + 卸载前各执行一次：掐掉旧定时器，并让旧一轮的迟到响应作废
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [status, onLog])

  return (
    <p className="muted">
      轮询中（依赖 [status]）。props 里的 status={status}，切换后定时器销毁重建，日志里的计数从 1 重来。
    </p>
  )
}

/**
 * 【修法二】useEffectEvent（React 19.2 正式内置，import { useEffectEvent } from 'react'）。
 *
 * 它做的事和 10 题手写的 latest ref 是同一个原理：React 在内部留了一个跨渲染恒定的槽位，每次渲染的提交阶段把
 * 「本帧最新的那个回调」换进去，pollOnce 只是转发到这个槽位的薄包装 —— 所以它内部读到的 status / onLog 永远是最新一帧的。
 * 别把它记成「引用稳定的函数」：19.2 的实现每次渲染都返回一个新的包装函数，它能不写进依赖数组，
 * 靠的是「被声明为非响应式」而不是「引用没变」（这也是它不能传给子组件、不能写进依赖数组的原因）。
 * 于是 effect 只依赖 pollOnce（而它不算依赖 —— exhaustive-deps 明确知道 useEffectEvent 的返回值不需要写进数组），
 * 依赖数组可以诚实地写 []：定时器只创建一次，参数却永远新鲜。日志里「第 n 次」连续递增、status 跟着下拉框变。
 *
 * 规则（面试会问）：
 * 1）Effect Event 只能在 effect 内部调用（包括 effect 里注册的定时器 / 监听器回调里），不能在渲染期调用、
 *    不能传给子组件、不能当普通事件处理器用 —— 它是 effect 的「非响应式部分」，不是通用工具；
 * 2）它读到的是「调用那一刻」的最新值，所以非常适合「effect 想读最新值但不想因此重跑」的场景：
 *    轮询参数、埋点上报里的当前页面、WebSocket 消息处理里的最新 state。
 *
 * 为什么把 isAlive 传进去而不是让 pollOnce 自己判断？alive 是【这一轮 effect】的私有变量，
 * 而 pollOnce 是组件级的函数，看不见 effect 闭包里的东西。谁发起的请求，谁负责判断自己还活着 ——
 * 闭包的作用域边界在这里反而成了教学素材：Effect Event 负责「读最新值」，effect 负责「生命周期」。
 *
 * Vue 侧没有任何对应物（没有一一对应关系）：Vue 的轮询回调里 status.value 天生就是最新的，
 * 「不想让它触发重跑」这个需求也不存在 —— setInterval 又不是 watch，没人会因为 status 变了而重跑它。
 */
function EffectEventPoller({ status, onLog }: PollerProps) {
  const pollOnce = useEffectEvent((seq: number, isAlive: () => boolean) => {
    // 这里的 status 是调用那一刻最新一帧的值 —— 尽管 effect 从来没有因为它重跑过
    const requested = status
    fetchOrders({ status: requested, pageSize: 20 }, { delayMs: POLL_DELAY_MS }).then((page) => {
      if (!isAlive()) return
      onLog(`【Effect Event】第 ${seq} 次轮询：status=${requested} → ${page.total} 条`)
    })
  })

  useEffect(() => {
    let alive = true
    let tickNo = 0
    const isAlive = () => alive
    const tick = () => {
      tickNo += 1
      pollOnce(tickNo, isAlive)
    }
    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return (
    <p className="muted">
      轮询中（useEffectEvent，依赖 []）。props 里的 status={status}，定时器只建了一次，日志里的 status 却跟着变。
    </p>
  )
}

/**
 * 区块三的容器：拥有筛选状态、模式、是否轮询、日志。
 * 三种 poller 是三个独立组件，切换模式时旧的整个卸载（跑它的 cleanup）、新的重新挂载（10 题讲过的「换组件类型 = 换实例」）。
 */
function PollingDemo() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [mode, setMode] = useState<PollMode>('broken')
  const [polling, setPolling] = useState(false)
  const [lines, setLines] = useState<string[]>([])

  /** 同区块二：引用稳定，子组件可以诚实地把它写进依赖数组 */
  const appendLog = useCallback((line: string) => setLines((prev) => [...prev, line]), [])

  const changeStatus = (next: StatusFilter) => {
    setStatus(next)
    appendLog(`—— 下拉框切到 status=${next}，接下来的轮询该用它 ——`)
  }

  const changeMode = (next: PollMode) => {
    setMode(next)
    if (polling) appendLog(`—— 切换写法：旧 poller 卸载（cleanup），新 poller 挂载，计数从 1 开始 ——`)
  }

  const togglePolling = () => {
    setPolling((p) => !p)
    appendLog(polling ? '—— 停止轮询：cleanup 已执行，之后不会再有新日志 ——' : `—— 开始轮询（status=${status}）——`)
  }

  return (
    <div className="card stack">
      <h3>区块三：轮询读旧的筛选参数 —— [] / [status] / useEffectEvent</h3>
      <p className="muted">
        点「开始轮询」，等一两条日志后把状态切到「已支付」：坏例子每 2 秒仍记 status=all；
        重启版立刻按新状态查一次、计数从第 1 次重来（定时器销毁重建）；Effect Event 版计数连续、status 立刻跟上（定时器只建了一次）。
        停止轮询 / 切题之后不再有新日志（alive 标志 + clearInterval）。
        默认数据里 all=15、pending=6、paid=6、cancelled=3 条（在 19 / 22 / 30 题改过订单的话数字会不同）。
      </p>
      <div className="row">
        <label className="row">
          <span>筛选状态：</span>
          {/* 受控 select（07 题）。e.target.value 的静态类型只是 string，用 as 收窄 —— 选项全部来自 STATUS_OPTIONS，这个断言是安全的 */}
          <select value={status} onChange={(e) => changeStatus(e.target.value as StatusFilter)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <button className={polling ? 'btn-danger' : 'btn-primary'} onClick={togglePolling}>
          {polling ? '停止轮询' : '开始轮询'}
        </button>
      </div>
      <div className="row">
        <label className="row">
          <span>写法：</span>
          <select value={mode} onChange={(e) => changeMode(e.target.value as PollMode)}>
            {POLL_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/*
        三个各自独立的条件槽位：polling 变 false 或 mode 变化时，原先那一槽从元素变成 false，
        React 把那个组件整个卸载（跑它的 cleanup：alive=false + clearInterval）；新选中的一槽挂载全新实例。
        这就是「切题 / 停止后不再有新日志」的保证 —— 不靠运气，靠 cleanup。
      */}
      {polling && mode === 'broken' && <BrokenPoller status={status} onLog={appendLog} />}
      {polling && mode === 'restart' && <RestartingPoller status={status} onLog={appendLog} />}
      {polling && mode === 'effectEvent' && <EffectEventPoller status={status} onLog={appendLog} />}
      {!polling && <p className="muted">未在轮询 —— 没有任何定时器在跑。</p>}

      <LogPanel lines={lines} onClear={() => setLines([])} emptyHint="（还没有记录，点「开始轮询」）" />
    </div>
  )
}

export default function Example() {
  /**
   * 三个区块彼此独立，各自拥有自己的 state 和日志 —— 每个区块只演示一种「闭包被交给外部世界」的方式：
   * 区块一 setTimeout（没有 effect）、区块二 addEventListener（依赖数组）、区块三 setInterval + 请求（useEffectEvent）。
   * 通用判断口诀：回调执行时，我想读的是「创建那一帧的值」还是「最新值」？
   * 想读最新值 → 由旧算新用函数式更新；读来做别的事用 latest ref / useEffectEvent；愿意重建外部资源就写依赖数组。
   * 无论选哪种，cleanup 都不是可选项。
   */
  return (
    <div className="stack">
      <DelayedSave />
      <ListenerDemo />
      <PollingDemo />
    </div>
  )
}
