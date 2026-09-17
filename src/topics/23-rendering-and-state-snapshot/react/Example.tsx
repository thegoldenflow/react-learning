/**
 * 学习主题：渲染模型与 state 快照 ——「一次渲染 = 一次函数执行」与 UI = f(props, state)
 *
 * React 核心概念：
 * - 组件就是函数：每次渲染 React 都【重新调用】它，函数体从头到尾跑一遍，返回这一帧的 JSX（区块一）
 * - state 和 props 都属于当前 render 的 snapshot：useState 解构出的 count、函数参数里的 props，
 *   在这一次函数执行期间是不会变的常量（区块二、区块四）
 * - 事件处理器是在某一次渲染里创建的闭包，捕获的是那一次渲染的快照值，不是「最新值」（区块二）
 * - 调用 setter 不会改当前函数里的局部变量：setCount(count + 1) 之后再读 count，还是旧值（区块二）
 * - setter 做的事是「排队一次新渲染」：state 更新后 React 再次执行组件函数，新 UI 来自新一次函数执行
 * - 直接改变量（localCopy += 1，或直接改 state 里的对象）什么都不会发生：没有 setter 就没有新渲染（区块三）
 * - UI = f(props, state)：渲染必须是纯函数，同样的 props 与 state 必得同样的 UI（区块四）
 *
 * Vue 对应概念：
 * - setup 只执行一次；重跑的只有模板编译出来的渲染函数（组件的 render effect），由它读过的响应式数据变化触发
 * - ref / reactive 是长期存活的响应式容器（reactive 是 Proxy，ref 靠 .value 的 getter / setter），count.value 每次都是现读现取 —— 没有「快照」这回事
 * - count.value++ 之后立刻就能读到新值；改一个不是 ref / reactive 的普通变量同样不更新视图，
 *   但原因不同：不是「没有 setter」，而是「脱离了依赖追踪」
 * - onUpdated：组件因响应式变化重新渲染之后触发，可以拿来观察「渲染函数重跑了」
 * - 「渲染快照」「setter 不改局部变量」「函数式更新」这些在 Vue 里都没有一一对应关系
 *
 * 最重要的区别：
 * - Vue 依靠响应式系统追踪依赖：渲染时读到谁就依赖谁，改 ref / reactive 里的数据 → 读过它的组件重新执行渲染函数；
 *   React 不追踪任何东西：调用 setter → 重新执行整个组件函数 → 用返回的新 JSX 与旧的 diff，得到新 UI。
 * - 所以千万不要把 React 解释成「直接修改变量后自动刷新」—— 改变量什么都不会发生。
 *   React 里 UI 变化的唯一入口是「调用 setter → 新一轮函数执行」。
 * - state snapshot 思维 vs 响应式变量思维：Vue 的 count 是一个会自己变新的「容器」；
 *   React 的 count 是本次渲染的「定格照片」。带着 Vue 的直觉写 React，会在 03 / 24 / 26 题的坑里反复摔倒。
 * - 与邻题的分工：03 题区块一是「连写两次 setCount 只加 1」的最小复现；本题从不连写两次 setCount，
 *   讲的是那个现象背后的四条机制 + UI = f(props, state)。更新队列与批处理见 24 题，过期闭包的各种修法见 26 题。
 */
import { useEffect, useRef, useState } from 'react'

interface SummaryProps {
  /** 父组件的 count，作为 props 传下来 */
  count: number
  /** 达标阈值，同样来自父组件 */
  threshold: number
  /** 往父组件的页面日志里写一行；函数式更新保证它即使「过期」也能正确追加 */
  onLog: (message: string) => void
}

/**
 * ★ 区块四的子组件：UI = f(props, state) 的「f」。
 *
 * 它是一个纯函数：给同样的 count 与 threshold，必定返回同样的 JSX —— 这就是「UI = f(props, state)」。
 * 父组件每次重渲染，React 也会重新调用它（控制台能看到「Summary 函数执行」），
 * 这一次调用拿到的 props 是【本次渲染的快照】：函数参数就是普通的参数，调用完就定格了。
 *
 * 「1 秒后记录本次渲染收到的 props」按钮是本区块的关键实验：
 * 点它之后立刻回到父组件再点几次 +1。1 秒后日志里记的仍是【点击那一刻那次渲染】的 count ——
 * 父组件已经换了好几帧、Summary 也被重新调用了好几次，但定时器回调是旧那一帧创建的闭包，
 * 它捕获的 props 早就定格了。结论：props 和 state 一样，都属于当前 render 的 snapshot（spec 明写）。
 *
 * Vue 老手最容易想错的地方：Vue 子组件的 props 是一个响应式 Proxy 对象，setTimeout 里读 props.count
 * 读到的永远是父组件当下的最新值；React 的 props 只是函数参数，每帧一份、过帧即旧 ——
 * 这一点没有一一对应关系。
 */
function Summary({ count, threshold, onLog }: SummaryProps) {
  console.log('[23-React] Summary 函数执行，props =', { count, threshold })

  /**
   * 定时器 id 存在 ref 里：ref 是跨渲染保存可变值的盒子（12 题），改 .current 不会触发重渲染，
   * 也不应该触发 —— 它只是「记账」，与 UI 无关。id 存起来是为了 cleanup：
   * 组件卸载（切题、StrictMode 的假卸载）时必须 clearTimeout，否则回调会对已卸载的组件写日志。
   */
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    // 依赖 []：这个 effect 只负责「卸载时清掉还没触发的定时器」，本身不读任何 props / state
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  const recordPropsLater = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      // 这里读到的 count / threshold / onLog 都是「点击那一刻那次渲染」的快照。
      // 顺带说明 onLog 为什么过期了也没事：它内部是 setLogs(prev => [...prev, message])，
      // setter 引用永远稳定、prev 由 React 在处理更新时传入 —— 这正是 24 / 26 题会展开讲的函数式更新。
      onLog(
        `1 秒前那次渲染收到的 props：count=${count}、threshold=${threshold}（父组件此刻的 count 可能已经不是它了）`,
      )
    }, 1000)
  }

  // 派生值直接在渲染期算：同样的输入必得同样的输出，不需要（也不该）再开一个 state（09 题）
  const reached = count >= threshold

  return (
    <div className="stack">
      <p className="row">
        <span>
          Summary 收到的 props：count=<strong>{count}</strong>，threshold=<strong>{threshold}</strong>
        </span>
        <span className={reached ? 'badge badge-paid' : 'badge badge-pending'}>
          {reached ? '已达阈值' : '未达阈值'}
        </span>
      </p>
      <div className="row">
        <button onClick={recordPropsLater}>1 秒后记录本次渲染收到的 props</button>
        <span className="muted">点完立刻回上面再点几次 +1，看 1 秒后日志记的是哪个 count</span>
      </div>
    </div>
  )
}

export default function Example() {
  /**
   * useState 返回 [值, setter]。注意 count 被声明成 const：它在这一次函数执行期间就是一个常量，
   * 这不是代码风格，而是 React 的模型 —— 「本次渲染的 count」永远不会变，变的是下一次渲染的 count。
   * Vue 对应的 const count = ref(0) 也是 const，但 .value 是可写的容器；两边的 const 含义完全不同。
   */
  const [count, setCount] = useState(0)
  const [threshold, setThreshold] = useState(5)
  const [logs, setLogs] = useState<string[]>([])

  /**
   * ★ 区块一：一次渲染 = 一次函数执行。
   *
   * 这行 console.log 放在函数体顶部，每次 React 调用 Example 它就打印一次。
   * 点任何会改 state 的按钮，控制台都会多出一条 —— 这就是「state 更新后 React 会再次执行组件函数」的直接证据。
   * 开发环境 StrictMode 会把每次渲染调用两遍（装了 React DevTools 时第二条显示为灰色，没装则两条一样），
   * 生产环境只调用一次；这是 React 用来暴露「不纯的渲染」的手段（main.tsx 有说明）。
   *
   * 故意不在页面上放一个「渲染次数」计数：要做到这一点得在渲染期间改 ref（renderCount.current++），
   * 渲染期间改 ref 是不纯的，StrictMode 下还会 +2，反而教坏。看控制台是最诚实的观察方式。
   *
   * Vue 侧的 setup 只在挂载时执行一次，「组件函数重跑」这件事在 Vue 里不存在；
   * Vue 重跑的是模板编译出的渲染函数，触发者是响应式系统 —— Vue 侧用 onUpdated 观察它。
   */
  console.log('[23-React] Example 函数执行，count =', count)

  /**
   * 页面日志：存在组件 state 里（不是模块级变量，切题 / StrictMode 重挂载都不会串）。
   * 用函数式更新 setLogs(prev => ...)：日志经常从异步回调里追加（区块四的定时器），
   * 那些回调捕获的 log 可能是旧渲染的闭包，但 prev 由 React 在处理更新时传入，永远是最新的 —— 稳赢。
   */
  const log = (message: string) => setLogs(prev => [...prev, message])

  /**
   * ★ 区块三：直接改变量无效。
   *
   * let localCopy = count 写在函数体里：每次渲染都会重新执行这一行，也就是每帧都被【重新初始化】。
   * 点「localCopy += 1」只改了这一帧闭包里的局部变量：没有调用任何 setter，React 根本不知道发生了什么，
   * 页面纹丝不动，控制台也不会多出「Example 函数执行」—— 连渲染都没有发生；
   * 等下一次重渲染（比如点区块一的「+1」），这行再跑一遍，你加的那些 1 全没了。
   *
   * 这个按钮故意【只写控制台、不写页面日志】：页面日志是 state，log() 会调用 setLogs → 排队一次新渲染 →
   * localCopy 立刻被重新初始化，实验就被「写日志」这个动作污染了（你会看到每次都是 count+1，而不是 1、2、3）。
   * 只有让这次点击不碰任何 setter，才能看到「改变量 = 什么都不发生」。
   *
   * 这正是「不要把 React 解释成『直接修改变量后自动刷新』」的可点击版本 ——
   * 直接改 state 里的对象（items[0].quantity++，见 03 题）无效也是同一个道理：React 不做依赖追踪，
   * 它得知变化的唯一途径是你调用 setter。
   *
   * Vue 侧 let localCopy = count.value 写在 setup 里，只执行一次：改它同样不更新视图，
   * 但原因是「普通变量不是 ref / reactive、脱离了依赖追踪」，而且它不会被重置（setup 不重跑）——
   * 现象相似、机制不同，没有一一对应关系。
   */
  let localCopy = count

  /**
   * ★ 区块二：事件处理器捕获快照，setter 不会改当前函数里的局部变量。
   *
   * handleAdd 是在【本次渲染】里创建的闭包，它捕获的 count 就是本次渲染那个常量。
   * setCount(count + 1) 之后紧接着读 count，读到的还是旧值 —— setter 没有「修改变量」，
   * 它只是告诉 React「下一次渲染请把 state 设成这个值」，然后排队一次新渲染。
   * 新的 count 要等 React 再次调用 Example、useState 返回新值时才存在，而那已经是另一个函数作用域了。
   *
   * 页面上「本次渲染看到的 count」显示的是新一帧的 count；日志里那行写的是旧一帧的 count。
   * 两个数字差 1，就是「新 UI 来自新一次函数执行」最直观的证据。
   *
   * 顺带一个事实：这里连着调用了 setCount 和 setLogs，但 React 18+ 会把同一个事件里的多次 setter
   * 合并成【一次】重渲染（批处理，24 题详讲）—— 所以控制台每点一次只多一条「Example 函数执行」（StrictMode 下两条）。
   *
   * 面试怎么答「setState 是同步还是异步」：setter 调用本身是同步的，但它不会同步改本次渲染的变量；
   * 它排队一次更新，React 在事件结束后统一处理并重新执行组件函数 —— 用「快照」而不是「异步」来解释才准确。
   *
   * Vue 侧：count.value++ 之后立刻读 count.value 就是新值。setup 只跑一次、渲染函数从 ref 现读，
   * Vue 根本没有「本次渲染的 count」这个概念 —— 没有一一对应关系。
   */
  const handleAdd = () => {
    setCount(count + 1)
    // 下一行读到的 count 仍然是旧值：setter 改的是「下一次渲染的 state」，不是这个常量
    log(`调用 setCount(${count + 1}) 之后，count 仍然是 ${count}`)
  }

  const mutateLocalCopy = () => {
    localCopy += 1
    // 只写控制台：写页面日志会调用 setter、触发重渲染，localCopy 就被重置了（见上方注释）
    console.log(
      `[23-React] localCopy += 1 → 这一帧闭包里的 localCopy 现在是 ${localCopy}，页面仍显示 ${count}：没有 setter 就没有新渲染`,
    )
  }

  return (
    <div className="stack">
      {/* ---------------- 区块一 ---------------- */}
      <div className="card stack">
        <h3>区块一：一次渲染 = 一次函数执行</h3>
        <p className="muted">
          打开浏览器控制台再点按钮：每次 state 变化都会多一条「[23-React] Example 函数执行」——
          React 得到新 UI 的方式是【重新调用组件函数】。开发环境 StrictMode 每次渲染调用两遍
          （装了 React DevTools 时第二条显示为灰色，没装则两条一样），生产环境只一次。
        </p>
        <p>
          当前 count：<strong>{count}</strong>
        </p>
        <div className="row">
          <button className="btn-primary" onClick={handleAdd}>
            +1
          </button>
          <button onClick={() => setCount(5)}>设为 5</button>
          <button className="btn-ghost" onClick={() => setCount(0)}>
            归零
          </button>
        </div>
        <p className="muted">
          试试连点两次「设为 5」：第二次 Object.is(5, 5) 为 true，React 跳过这次更新 ——
          通常连组件函数都不会再调用（个别情况会调用一次再丢弃结果），子组件与 DOM 一定不动。
          同样的 state 没有理由产生不同的 UI。
        </p>
      </div>

      {/* ---------------- 运行日志 ---------------- */}
      <div className="card stack">
        <div className="row">
          <h3>运行日志（各区块的按钮都写到这里）</h3>
          <button className="btn-ghost" onClick={() => setLogs([])}>
            清空日志
          </button>
        </div>
        {/*
          只追加、从不重排的列表用 index 当 key 是可以接受的 —— 这是 06 题「key 用稳定 id」规则的例外：
          index 出问题的前提是列表会插入 / 删除 / 重排，日志三者都不会发生。
        */}
        <ul className="log">
          {logs.length === 0 ? (
            <li className="log-empty">（还没有日志 —— 点上面或下面的按钮）</li>
          ) : (
            logs.map((line, index) => <li key={index}>{line}</li>)
          )}
        </ul>
      </div>

      {/* ---------------- 区块二 ---------------- */}
      <div className="card stack">
        <h3>区块二：事件处理器捕获的是快照，setter 不会改局部变量</h3>
        <p className="muted">
          点「+1 并记录」：日志里写「count 仍然是 N」，而下面显示的却是 N+1 ——
          日志是旧一帧闭包里读到的常量，页面是新一次函数执行的结果。两个数字差 1 就是证据。
        </p>
        <p>
          本次渲染看到的 count：<strong>{count}</strong>
        </p>
        <div className="row">
          <button className="btn-primary" onClick={handleAdd}>
            +1 并记录 setCount 之后的 count
          </button>
        </div>
      </div>

      {/* ---------------- 区块三 ---------------- */}
      <div className="card stack">
        <h3>区块三：直接改变量无效</h3>
        <p className="muted">
          打开控制台，连点几次「localCopy += 1」：控制台里的 localCopy 在涨（1、2、3…），
          但没有新的「Example 函数执行」、页面上的数字也不动 —— 没有 setter，没有新渲染。
          然后点区块一的「+1」让组件重渲染：localCopy 被那行 let localCopy = count 重新初始化，你加的全没了
          （再点「localCopy += 1」又从 count+1 开始数）。这个按钮故意不写页面日志：写日志就是调 setter，会把实验搅乱。
        </p>
        <p>
          页面上的 localCopy：<strong>{localCopy}</strong>
          <span className="muted">（渲染期从 count 拷出来：let localCopy = count）</span>
        </p>
        <div className="row">
          <button onClick={mutateLocalCopy}>localCopy += 1（像 Vue 那样直接改）</button>
        </div>
      </div>

      {/* ---------------- 区块四 ---------------- */}
      <div className="card stack">
        <h3>区块四：UI = f(props, state)</h3>
        <p className="muted">
          Summary 是纯函数：同样的 props 必得同样的 UI。点「设为 5」「设为 0」看控制台：父组件重跑，
          Summary 也被重新调用、拿到新的 props。切换阈值只改 props 不改 count，Summary 同样重跑 ——
          props 和 state 是 f 的两个入参，缺一不可。
        </p>
        <div className="row">
          <button onClick={() => setCount(5)}>设为 5</button>
          <button onClick={() => setCount(0)}>设为 0</button>
          <button className="btn-ghost" onClick={() => setThreshold(t => (t === 5 ? 3 : 5))}>
            切换阈值（3 ↔ 5）
          </button>
          <button className="btn-ghost" onClick={handleAdd}>
            +1
          </button>
        </div>
        {/*
          Summary 没有用 memo 包：父组件每次重渲染，React 默认会重新调用所有子组件函数（17 题讲怎么跳过）。
          这不是浪费 —— 这就是「UI = f(props, state)」的字面实现：整棵子树都是 f 的一部分。
        */}
        <Summary count={count} threshold={threshold} onLog={log} />
      </div>
    </div>
  )
}
