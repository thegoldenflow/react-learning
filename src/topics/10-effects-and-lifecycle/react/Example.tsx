/**
 * 学习主题：useEffect 与生命周期 —— 副作用、依赖数组、cleanup 与请求竞态
 *
 * React 核心概念：
 * - useEffect(setup, deps)：渲染提交到屏幕后执行 setup，用来「让组件与外部系统保持同步」（请求/订阅/定时器/DOM）
 * - 依赖数组：[] = 只在挂载后执行一次；[keyword] = 挂载后 + keyword 每次变化后执行；不传 = 每次渲染后都执行
 * - setup 可以返回 cleanup 函数：下一次 setup 执行前 + 组件卸载前各执行一次 —— 一个函数覆盖两个时机
 * - StrictMode 开发期故意把组件「挂载→卸载→重挂载」，effect 双跑一遍，专门检验 cleanup 写没写对
 * - 请求竞态：先发的慢请求可能后返回、覆盖后发的快请求的正确结果；在 cleanup 里 abort 旧请求即可根治
 * - 定时器与过期闭包（面试高频）：setInterval 回调里写 setCount(count + 1)、依赖数组写 []，
 *   计数会永远停在 1 —— effect 只在挂载后跑过一次，它闭包里的 count 被永久冻结在首次渲染的 0。
 *   三种修法：① 函数式更新 setCount(c => c + 1)；② 把 count 写进依赖数组（代价是每次计数都销毁重建定时器）；
 *   ③ latest ref（用 ref 存最新的回调，effect 依赖仍写 []）
 * - 定时器的 cleanup 不是可选项：不 clearInterval，组件卸载后定时器还在跑 —— 内存泄漏 + 对已卸载组件 setState
 *
 * Vue 对应概念：
 * - [keyword] ≈ watch(keyword, cb, { immediate: true })—— immediate 必须有：React 的 effect 首次渲染后就会执行一次
 * - [] ≈ onMounted，但语义不同：不是「生命周期钩子」，而是「依赖为空，所以永远不需要重跑」
 * - cleanup ≈ watch 回调的 onCleanup 参数 + onUnmounted 两个 API 的合体
 * - 定时器：onMounted 里 setInterval(() => count.value++)、onUnmounted 里 clearInterval。
 *   「必须清理」这条纪律两边完全一致；但 React 那个「坏版本」在 Vue 里根本不存在
 *   （setup 只跑一次，count.value 是现读现取），所以那三种修法在 Vue 里没有一一对应关系
 *
 * 最重要的区别：
 * - Vue 给你一排按「时机」命名的生命周期钩子；React 只有一个 useEffect，思维模型不是生命周期，
 *   而是「声明式同步」：你声明如何与外部系统同步、如何清理，何时执行由 React 根据依赖决定。
 *   「useEffect(fn, []) 就是 onMounted」是最常见的误解 —— 行为恰好像，出发点完全不同，
 *   useEffect 不是 onMounted 的替代品。
 * - 「过期闭包」是 React 渲染快照模型的独有陷阱：每次渲染都重跑组件函数，那一帧里创建的每个闭包
 *   捕获的都是那一帧的 state；异步回调（定时器 / 订阅 / 网络回调）活得比那一帧长，就会读到过期值。
 *   Vue 的 ref 是一个一直存活的容器、.value 现读现取，压根没有这个概念，没有一一对应关系。
 */
import { useEffect, useRef, useState } from 'react'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'

/* ============================================================================
 * 场景二用到的常量与子组件：定时器 —— 过期闭包的经典现场
 * 四种实现各写成一个独立组件，父组件按下拉框的选择渲染其中一个。
 * 本场景聚焦「定时器里 setState 读到旧值」；延迟回调 / 手动事件监听 / 轮询读旧参数等更多现场
 * 与 useEffectEvent 修法见 26 题。
 * ========================================================================== */

/** 下拉框选项；as const 让下面的 TimerMode 直接从这里推导出字面量联合类型，不用手写两遍 */
const TIMER_MODES = [
  { value: 'broken', label: '【坏】setInterval 里 setCount(count + 1)，依赖 []' },
  { value: 'updater', label: '【修法一】函数式更新 setCount(c => c + 1)，依赖 []' },
  { value: 'deps', label: '【修法二】依赖数组写 [count]' },
  { value: 'ref', label: '【修法三】latest ref（进阶写法）' },
] as const

type TimerMode = (typeof TIMER_MODES)[number]['value']

/** 计数间隔；单独抽出来，是为了让四个实现里的「1 秒」一眼看出是同一个东西 */
const TICK_MS = 1000

interface CounterReadoutProps {
  /** 被演示的那个计数值 */
  count: number
  /** 这一种实现「应该看到什么现象」的说明 */
  hint: string
}

/**
 * 四个演示组件共用的展示部分。
 *
 * 它自己还跑了一个秒表 —— 秒表用的正是「修法一」的正确写法，并且和被演示的计数器同时挂载、
 * 同时卸载，于是成了一个完美的参照系：秒表一路在涨、上面的计数却停在 1，过期闭包当场现形
 * （而不是让你怀疑「是不是定时器根本没启动」）。
 */
function CounterReadout({ count, hint }: CounterReadoutProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    // 函数式更新：回调不读任何外部 state，所以依赖 [] 是诚实的「真的没有依赖」，不会过期
    const id = setInterval(() => setSeconds((s) => s + 1), TICK_MS)
    // cleanup 必写：卸载后这个 interval 若还活着，就是内存泄漏 + 对已卸载组件 setState
    return () => clearInterval(id)
  }, [])

  return (
    <div className="stack">
      <p className="row">
        <span>计数：</span>
        <strong>{count}</strong>
        <span className="badge">秒表参照：已过 {seconds} 秒</span>
      </p>
      <p className="muted">{hint}</p>
    </div>
  )
}

/**
 * 【坏】依赖数组 []、回调里写 setCount(count + 1) —— 计数永远停在 1。
 *
 * 为什么会坏（务必读透，这是 React 心智模型的核心）：
 * 1. effect 的依赖是 []，所以 setup 只在挂载后执行过【一次】；
 * 2. 那一次执行时，组件正处在「第一次渲染」，此时 count === 0。传给 setInterval 的箭头函数是个闭包，
 *    它捕获的不是「count 这个变量的最新值」，而是第一次渲染那一帧里的常量 0；
 * 3. 于是它每秒都在执行 setCount(0 + 1)，也就是 setCount(1)。第一次生效（0 → 1），
 *    之后 React 用 Object.is 一比「新值 1 === 旧值 1」，直接跳过渲染 —— 界面就定死在 1 了。
 *
 * 这与 03 题「同一个事件里 setCount(count + 1) 连写两次却只加 1」是同一个根因：渲染快照。
 * 每次渲染拿到的 count 都是那一帧的常量，不是一个会自己变新的变量。定时器只是把这个坑放大了 ——
 * 事件处理器的闭包只活一瞬间，定时器回调的闭包要活几百帧，越活越过期。
 *
 * Vue 老手最容易想错的地方：Vue 里 setInterval(() => count.value++) 天生就是对的，
 * 因为 count 是一个一直存活的容器、.value 每次现读现取；React 没有这个容器，每一帧的 count
 * 都是新的局部常量 —— 这个差异没有一一对应关系，只能重建心智模型，不能靠类比。
 *
 * 补充：ESLint 的 react-hooks/exhaustive-deps 会准确地警告「缺少依赖 count」。
 * 本例是刻意保留的错误示范，所以下面显式关掉了这条规则 —— 正式代码里千万别学这个 disable，
 * 看到这条警告，就说明你多半正踩在过期闭包上。
 */
function BrokenIntervalCounter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      // 这里的 count 恒为 0（首次渲染的快照）→ 每秒都在执行 setCount(1)
      setCount(count + 1)
    }, TICK_MS)
    // 即使实现是错的，cleanup 照样必须写：「清理干不干净」和「读到的值对不对」是两件独立的事
    return () => clearInterval(id)
    // 下面这个 [] 正是 exhaustive-deps 要报「缺少依赖 count」的地方。本例刻意保留错误示范，
    // 所以在此关掉规则 —— 正式代码里千万别学这个 disable：看到那条警告，多半就是踩了过期闭包。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <CounterReadout
      count={count}
      hint="计数停在 1，而右边的秒表一直在涨 —— 定时器每秒都在跑，只是它闭包里的 count 永远是首次渲染的 0，每次都在 setCount(1)。"
    />
  )
}

/**
 * 【修法一】函数式更新 setCount(c => c + 1)。工业界的默认答案，面试也答这个。
 *
 * 关键在于「回调不再读外部的 count」：c 由 React 在更新时传入，保证是最新值。
 * 于是这个 effect 真的没有依赖，[] 写得诚实，定时器在整个组件生命周期里只创建一次、平稳地跑。
 *
 * 判断口诀：新状态只依赖旧状态 → 一律用函数式更新。
 * 这条口诀和 03 题（连点两次只加 1）是同一条，只是场景从「同一批更新」换成了「跨时间的回调」。
 */
function UpdaterIntervalCounter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), TICK_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <CounterReadout
      count={count}
      hint="每秒 +1，正常工作。定时器自始至终只创建了一次 —— 因为回调不读 count，effect 真的没有依赖。"
    />
  )
}

/**
 * 【修法二】把 count 写进依赖数组 [count]：能工作，但有代价。
 *
 * 执行链路：count 变化 → 组件重渲染 → React 先跑上一轮的 cleanup（clearInterval 掉旧定时器）
 * → 再跑新一轮 setup（setInterval 新定时器，闭包里是最新的 count）。所以值永远不过期。
 *
 * 代价（面试追问点）：
 * 1. 每计数一次就销毁重建一次定时器 —— 白白的开销；
 * 2. 更要命的是「计时被重置」：如果依赖变化得比间隔还频繁（比如依赖里还有用户输入的 keyword），
 *    定时器会在每次到点之前就被清掉重来，结果是【永远不触发】—— 真实业务里非常隐蔽的 bug；
 * 3. 定时器 id 会变、订阅会重连，对「不该被打断的外部连接」（WebSocket、播放器）尤其糟糕。
 *
 * 结论：它是「正确但不推荐」的写法。除非你确实希望依赖变化时重启定时器，否则优先用修法一。
 * 这也是 React 的通用取舍：依赖写全永远是对的，但依赖太活跃时要反过来想「怎样让 effect 不依赖它」。
 */
function DepsIntervalCounter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // 这里故意保留 setCount(count + 1) 这个「非函数式」写法：
    // 它能对，靠的不是写法变好了，而是依赖数组让 effect 每一轮都重新拿到了新的 count 快照。
    const id = setInterval(() => setCount(count + 1), TICK_MS)
    // cleanup 在这里承担双重职责：既是卸载清理，也是「下一轮 setup 前先掐掉上一个定时器」。
    // 少了它，每次 count 变化都会多挂一个定时器、旧的一个都不停，组件卸载后它们还在后台跑。
    // （别记成「计数会翻倍加速」，但也别以为旧定时器无害：每个残留闭包各持一份不同的旧 count，
    //  它们发出的 setCount(旧值 + 1) 会真的落地、把计数往回打；每次回写又算一次 count 变化，
    //  再触发 effect 挂一个新定时器 —— 泄漏是复利式增长，不是一秒一个。界面上之所以大致仍像每秒 +1，
    //  只是因为同一秒内最新的那个定时器最后写入、盖掉了前面的回退 —— 错误全藏在
    //  「定时器越攒越多」这件看不见的事里，比数字跑飞更难被发现，这才是漏写 cleanup 真正可怕的地方。）
    return () => clearInterval(id)
  }, [count])

  return (
    <CounterReadout
      count={count}
      hint="每秒 +1，正常工作 —— 但每计数一次就销毁重建一次定时器。依赖变化比间隔还快时，定时器会永远等不到触发。"
    />
  )
}

/**
 * 【修法三】latest ref：用 ref 存「最新的回调」，effect 依赖仍写 []，定时器只建一次。
 *
 * 套路（社区经典的 useInterval，Dan Abramov 专门写过一篇文章讲它）：
 * 1. 一个不带依赖数组的 effect：每次渲染后都把「本帧最新的回调」写进 ref.current；
 * 2. 一个依赖 [] 的 effect：只创建一次定时器，回调体里通过 ref.current() 间接调用 ——
 *    ref 对象本身跨渲染恒定（所以不必写进依赖数组，exhaustive-deps 也认这一点），
 *    但 .current 里装的那个函数每帧都被换成新的。
 *
 * 注意下面那行：latestTick.current = () => setCount(count + 1)，写的是和【坏版本】一模一样的表达式，
 * 结果却完全正确 —— 差别只在于这个闭包每帧都被重新创建。这恰好说明「过期闭包」的病根不在 setCount 的写法，
 * 而在「闭包被创建的那一帧」离「闭包被执行的那一刻」太远。
 *
 * 为什么写 ref 要放进 effect，而不是直接写在组件函数体里？因为渲染必须是纯的：
 * 渲染期间改 ref 属于副作用（并发渲染下 React 可能重跑或丢弃某次渲染）。放进 effect 才安全。
 *
 * 什么时候真的需要它？当回调里要读的不止 count，还有别的会变的值（可调节的步长、最新的 props 回调），
 * 而你又不希望这些值一变就重建定时器时 —— 修法一救不了（它只解决「读旧 state」），修法二代价太大。
 *
 * 进阶提示：React 官方已经把这个模式内置为 useEffectEvent（早期提案里叫 useEvent）。
 * 它在 React 19.2 里正式随 react 包发布 —— 本项目装的就是 19.2，可以直接 import { useEffectEvent } from 'react'。
 * 它要解决的正是这里的问题：「effect 里要读最新值、但不想把它算作依赖」不必再手写 ref
 * （exhaustive-deps 也认它：useEffectEvent 返回的函数不用写进依赖数组）。
 * 这里仍然手写一遍 ref，是为了让你看清它内部到底在做什么 —— 面试被问「useEffectEvent 解决什么问题」，
 * 答的就是这段 latest ref 套路。
 *
 * 顺带回看 12 题：useRef 的用途二是「跨渲染保存任意可变值」。这里存进盒子的是一个函数；
 * 如果要做一个「暂停」按钮、需要在事件处理器里手动 clearInterval，那就把定时器 id 存进 ref ——
 * 同一个用途，只是被存的东西换了而已。
 */
function LatestRefIntervalCounter() {
  const [count, setCount] = useState(0)

  // 初始值给一个空函数：万一定时器比第一个 effect 更早触发也不会炸（这里不会，但类型与运行都更稳）
  const latestTick = useRef<() => void>(() => {})

  // 没有依赖数组 = 每次渲染后都执行：这正是「让 ref 始终装着最新一帧的闭包」所需要的
  useEffect(() => {
    latestTick.current = () => setCount(count + 1)
  })

  useEffect(() => {
    // 回调体里读 ref.current：ref 对象恒定，读出来的却永远是最新那一帧的函数
    const id = setInterval(() => latestTick.current(), TICK_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <CounterReadout
      count={count}
      hint="每秒 +1，且定时器只创建一次。回调里写的是和「坏版本」一模一样的 setCount(count + 1)，靠 ref 每帧刷新闭包才得以正确。"
    />
  )
}

export default function Example() {
  const [keyword, setKeyword] = useState('')
  const [users, setUsers] = useState<User[]>([])
  // 初始就是 true：挂载后 effect 必然发起首次请求，若初始 false 首帧会闪一下「没有匹配的用户」
  const [loading, setLoading] = useState(true)

  // 场景二用：当前选中的定时器实现 + 计数器是否挂载（后者用来现场演示 cleanup 的「卸载」时机）
  const [timerMode, setTimerMode] = useState<TimerMode>('broken')
  const [counterMounted, setCounterMounted] = useState(true)

  /**
   * 网络请求是「副作用」：它和渲染本身无关、要跟 React 之外的系统（网络）打交道，所以放进 useEffect。
   *
   * 依赖数组写 [keyword]：挂载后执行一次（自动完成初始加载）+ keyword 每次变化后再执行。
   * 对应 Vue 的 watch(keyword, cb, { immediate: true })—— immediate 这点必须注意：
   * Vue 的 watch 默认懒执行（变化才跑），而 React 的 effect 首次渲染后必然会跑一次。
   *
   * 如果这里写 []，行为上像 onMounted（只跑一次），但那是因为「依赖为空、永远不需要重跑」，
   * 不是因为它是生命周期钩子 —— 后果就是 keyword 变化不会重新请求，effect 里读到的永远是
   * 首次渲染的旧 keyword（过期闭包）。eslint-plugin-react-hooks 的 exhaustive-deps 规则
   * 就是专门查「effect 用了却没写进依赖」的，面试常考。
   *
   * 竞态（面试高频）：keyword 从「a」变「ab」时会连发两个请求，若「a」的响应更慢、
   * 反而更晚到达，就会覆盖「ab」的正确结果。React 的解法优雅在于：每轮 effect 重跑前
   * 先执行上一轮的 cleanup —— 在 cleanup 里取消旧请求，旧响应根本没机会回来。
   * 这里只展示「cleanup 里 abort」这一种解法；竞态本身的可复现演示、ignore 标志 vs AbortController、
   * 过期响应的处理见 27 题。
   * （本题故意不做防抖 —— 每个字符都发请求；防抖优化是 14 题。）
   */
  useEffect(() => {
    // 每轮 effect 创建属于自己的 controller；cleanup 是闭包，恰好能拿到「这一轮」的它
    const controller = new AbortController()

    setLoading(true)
    // 注意：effect 回调本身不能写成 async —— async 函数返回 Promise，
    // 而 React 规定 effect 的返回值只能是 cleanup 函数（或不返回）。
    // 想用 await 就在 effect 内部另外定义一个 async 函数再调用；这里用 .then 链保持精简。
    fetchUsers(keyword, { signal: controller.signal })
      .then((list) => {
        setUsers(list)
        setLoading(false)
      })
      .catch((err: unknown) => {
        // 「被取消」不是失败：切换关键词 / 卸载导致的 abort 会走到这里，必须忽略，
        // 否则每敲一个字符都会闪一次错误。
        if (isAbortError(err)) return
        // 完整的错误处理（error 状态 + 重试按钮）是 11 题的主角，这里只收起 loading
        setLoading(false)
      })

    /**
     * cleanup 函数：React 在「下一轮 effect 执行前」和「组件卸载前」都会调用它，
     * 一个函数覆盖两个时机 —— Vue 里对应两个 API：watch 回调的 onCleanup（下一次回调前）
     * 和 onUnmounted（卸载前）。
     *
     * StrictMode：开发环境 React 会故意把组件「挂载→卸载→重挂载」，effect 因此跑两遍
     * （第一次的请求被 cleanup 立即取消，第二次正常完成）。这不是 bug，是刻意的检查：
     * cleanup 写对了，双跑的净效果等于跑一次；写漏了，双跑立刻暴露重复请求/重复订阅。
     * 生产构建只跑一次。Vue 没有对应机制 —— 这一点没有一一对应关系。
     *
     * 补充：React 官方文档还有个更简的方案 —— let ignore = false 布尔位，cleanup 里置 true、
     * 回调里判断后丢弃过期结果。AbortController 更彻底：真的取消了网络请求，而不只是丢弃响应。
     */
    return () => {
      controller.abort()
    }
  }, [keyword])

  /**
   * 面试高频：哪些逻辑【不该】放进 useEffect？
   * 1. 响应用户事件 —— 点按钮提交、弹提示：直接写在事件处理器里，
   *    不要「setState 之后再用 effect 监听那个 state」绕一圈；
   * 2. 能在渲染期间算出来的派生值 —— 如「过滤后的列表」「合计金额」：渲染时直接算（09 题），
   *    用 effect 把它同步进另一个 state 是反模式（多一次渲染，且两份状态迟早不同步）；
   * 3. 「props 变化时重置 state」—— 不要用 effect 手动同步，给组件加 key 让它整棵重建。
   * 只有「与 React 之外的系统同步」（网络、订阅、定时器、非受控 DOM）才需要 effect ——
   * 本题的两块演示恰好是这份清单里最常见的两种正当用法：场景一是网络请求，场景二是定时器。
   */

  return (
    <div className="stack">
      <div className="card stack">
        <h3>场景一：实时搜索（请求副作用 + 竞态取消）</h3>
        <p className="muted">输入关键词实时搜索用户；快速连续输入时旧请求会被取消，结果不会错乱</p>

        {/* 受控输入框：value + onChange（对应 Vue 的 v-model）。
            注意分工：事件处理器只负责「改状态」（setKeyword），
            「发请求」这个副作用由 effect 响应 keyword 的变化 —— 副作用统一由状态驱动。 */}
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索姓名或邮箱，如「张」或 example"
        />

        {loading && <p className="muted">加载中…</p>}
        {!loading && users.length === 0 && <p className="muted">没有匹配的用户</p>}

        <ul>
          {users.map((u) => (
            <li key={u.id}>
              {u.name}（{u.email}）<span className="badge">{u.role}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card stack">
        <h3>场景二：定时器（过期闭包的经典现场，面试高频）</h3>
        <p className="muted">
          切换实现方式，盯着计数值看：第一种（坏）永远停在 1，后三种每秒 +1。
          「秒表参照」用的是正确写法，它一直在涨，证明定时器确实在跑、坏的只是那个计数。
        </p>

        <div className="row">
          <label className="row">
            <span>实现方式：</span>
            {/* 受控 select：value + onChange，与受控 input 完全同构（对应 Vue 的 v-model）。
                e.target.value 的静态类型只是 string，所以用 as TimerMode 收窄 ——
                选项全部来自 TIMER_MODES，这个断言是安全的（断言不是 any：它只影响类型，不改运行时）。 */}
            <select value={timerMode} onChange={(e) => setTimerMode(e.target.value as TimerMode)}>
              {TIMER_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>

          <button onClick={() => setCounterMounted((v) => !v)}>
            {counterMounted ? '卸载计数器' : '重新挂载计数器'}
          </button>
        </div>

        {/*
          切换实现时旧定时器一定会被清掉。看清楚下面写的是【四个各自独立的条件槽位】：
          timerMode 一变，原先那一槽的表达式就从 <BrokenIntervalCounter /> 变成 false，
          React 把那个组件整个卸载掉（跑它的 cleanup → clearInterval）；新选中的那一槽从 false 变成元素，
          于是挂载一个全新实例（state 也从 0 重来）。
          同一个槽位上把【组件类型】换掉（A → B）结果一样：类型不同就不是同一个实例，
          React 照样是「卸载旧的、挂载新的」，不会复用 —— 这是 diff 的基本规则，值得记住。

          如果把四种实现塞进同一个组件、靠 props 切换，那就【不会】卸载 —— 必须写成
          <IntervalCounter key={timerMode} mode={timerMode} />，用 key 变化强制 React 重建实例。
          这就是 06 题 key 的另一副面孔：key 不只用于列表，它是「这还是不是同一个组件实例」的身份证。

          「卸载计数器」按钮则演示 cleanup 的另一个时机：组件消失时 clearInterval 被调用。
          想象一下漏写 cleanup 的后果：计数器已经从界面上消失了，定时器却还在后台每秒跑一次 setCount，
          内存泄漏 + 对已卸载组件更新状态（React 18 起不再打那条警告，但错误依旧存在，只是更难被发现）。
        */}
        {counterMounted ? (
          <>
            {timerMode === 'broken' && <BrokenIntervalCounter />}
            {timerMode === 'updater' && <UpdaterIntervalCounter />}
            {timerMode === 'deps' && <DepsIntervalCounter />}
            {timerMode === 'ref' && <LatestRefIntervalCounter />}
          </>
        ) : (
          <p className="muted">
            计数器已卸载 —— cleanup 里的 clearInterval 已经执行，后台不再有定时器在跑。
            重新挂载后计数从 0 重新开始（state 随组件一起被销毁了）。
          </p>
        )}
      </div>
    </div>
  )
}
