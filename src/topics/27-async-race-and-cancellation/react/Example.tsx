/**
 * 学习主题：异步竞态、取消与过期响应 —— 先发的慢请求后返回时，怎样不让它覆盖正确结果
 *
 * React 核心概念：
 * - 竞态（race condition）：keyword 从 a 打到 angf 会连发 4 个请求，而网络不保证按发出顺序返回。
 *   本题用确定性延迟（a=1100ms、an=800ms、ang=500ms、angf=200ms）让「后发先至」100% 复现：
 *   请求 A（#1「a」）先发出、请求 B（#4「angf」）后发出，B 先返回、A 最后返回（三个面板的时间线都能看到）
 * - 过期响应（stale response）：响应回来时，它对应的关键词已经不是当前关键词。不处理就会覆盖新结果 ——
 *   面板一会亮出红字「当前关键词 angf ／ 列表来自请求「a」」：UI 与数据悄悄对不上、不报错，是最难发现的一类 bug
 * - effect 的 cleanup 就是天然的「你已过期」信号：keyword 一变，React 先跑上一轮的 cleanup、再跑新一轮 setup。
 *   在 cleanup 里做两件事之一即可根治：① let ignore = true，响应回来后丢弃（官方文档模式，面板二）；
 *   ② controller.abort()，真正取消请求（面板三）
 * - AbortController：new 一个 → 把 signal 交给 fetch / mock API → cleanup 里 abort() → promise 以 AbortError 拒绝。
 *   取消不是失败：catch 里必须先 isAbortError → return，否则每敲一个字符都会闪一次错误
 * - ignore vs abort：ignore 只是「不用这个响应」，网络传输和服务端计算照做；abort 连网络都省了。
 *   拿得到 signal 就 abort；拿不到（第三方 SDK、不接受 signal 的库函数）就 ignore；
 *   没有 cleanup 可挂的命令式代码用「请求序号 / latest ref」做同一个判断（面板三注释）
 * - 每个面板都用判别联合建模 idle | loading | success | error（11 题的建模方式），success 里多存一个 forKeyword：
 *   「这份结果属于哪个关键词」是可核对的数据，页面据此判断列表有没有过期，而不是靠信任
 *
 * Vue 对应概念：
 * - watch([keyword, …], ([kw], _prev, onCleanup) => …)：onCleanup 与 effect cleanup 一一对应（下一次回调前 + watcher 停止时都执行），
 *   三种策略逐字同构：不注册 onCleanup（坏）／ onCleanup(() => { ignore = true }) ／ onCleanup(() => controller.abort())
 * - watch 默认懒执行，恰好对应本题的「初始 idle、'' 不发请求」；React 的 effect 首次渲染后必然执行一次，
 *   所以要在 effect 里显式判断 keyword === '' 再 return（useEffect 既不是 onMounted 也不是 watch，
 *   它的模型是「与外部系统保持同步」，10 题）
 * - 11 题那种命令式 load() 没有 cleanup 可挂：在函数开头 abort 上一个 controller，或比对请求序号
 * - 竞态是异步本身的问题，与框架无关：Vue 侧不处理同样会被覆盖，面板一在 Vue 里一样坏
 * - 「重置」：React 侧换 key 让三个面板销毁重建，旧实例迟到的 setState 是 no-op；Vue 侧状态就在 setup 里，
 *   直接赋回初始值，但 ref 长期存活、坏面板迟到的响应照样落地 —— 这一点没有一一对应关系
 *
 * 最重要的区别：
 * - 两边的「病」完全一样、「药」也一样（ignore / abort），区别只在「挂药的位置」：
 *   React 挂在 effect 的返回值上，Vue 挂在 watch 回调的 onCleanup 参数上。
 *   React 的 StrictMode 会在开发期把 effect「挂载→卸载→重挂载」一遍来检验 cleanup 写没写对，
 *   Vue 没有对应机制（没有一一对应关系）
 * - 与邻题的分工：10 题 = effect 基础与依赖数组，只顺带展示了「cleanup 里 abort」这一种修法；
 *   11 题 = 请求状态怎么建模（loading / success / error / empty 与重试）；
 *   27 题 = 竞态本身：可复现的乱序、三种策略并排对比、过期响应的语义，以及每个面板各自的 loading / error / empty
 */
import { useEffect, useRef, useState } from 'react'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'

/**
 * 确定性延迟：关键词越长、响应越快 —— a=1100ms、an=800ms、ang=500ms、angf=200ms。
 * 真实网络里「先发后至」是概率事件，靠运气复现不了 bug；把延迟做成关键词长度的函数，
 * 正常速度打出 angf，四个请求就【一定】逆序返回 —— 这是本题所有演示的前提。
 * 结果集也刻意不同：「a」匹配全部 8 个用户（每个邮箱的 example 里都有 a）、「angf」只匹配 1 个（王芳），
 * 列表被过期响应覆盖时一眼就能看出来。
 */
const delayFor = (keyword: string) => Math.max(200, 1400 - keyword.length * 300)

/** 自动演示的输入序列与间隔：a → an → ang → angf，每 150ms 敲一个字符（比最快的响应 200ms 还快） */
const DEMO_STEPS = ['a', 'an', 'ang', 'angf'] as const
const DEMO_STEP_GAP_MS = 150

/** 页面上的延迟表文案，让学习者知道每个关键词会等多久 */
const DELAY_TABLE = DEMO_STEPS.map((step) => `${step} = ${delayFor(step)}ms`).join('，')

/** 把 unknown 异常转成可展示的文案；真实失败信息来自 mock API 抛出的 Error */
const toMessage = (err: unknown) => (err instanceof Error ? err.message : '未知错误')

/**
 * 面板状态：判别联合（11 题的建模方式），比 loading / error / data 三个独立变量更不容易出现非法组合。
 * 本题额外在 success 里记录 forKeyword ——「这份列表是哪个关键词的结果」。
 * 有了它，页面才能用【数据】而不是靠信任来判断列表是否过期：forKeyword !== 当前 keyword，就是过期响应落地了。
 * idle 是本题特有的一档：关键词为空时不发请求，也就没有 loading。
 */
type PanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; users: User[]; forKeyword: string }
  | { status: 'error'; message: string }

/** 三个搜索面板共用的输入：都由父组件的同一个 keyword 驱动，才能公平对比三种策略 */
interface SearchPanelProps {
  keyword: string
  /** 勾选后所有请求必定失败（failRate: 1，确定性的），用来看 error 分支与重试 */
  shouldFail: boolean
  /** 父组件的重试计数：+1 即让面板用同样参数重新请求（11 题的 reloadFlag 模式） */
  reloadFlag: number
  /** 点面板里的「重试」时通知父组件 */
  onRetry: () => void
}

interface ResultPanelProps {
  title: string
  /** 告诉学习者在这个面板里该看什么 */
  hint: string
  /** 当前关键词：用来核对 success 结果有没有过期 */
  keyword: string
  state: PanelState
  /** 时间线日志：→ 发出、← 返回、✂ 取消 */
  lines: string[]
  onRetry: () => void
  onClearLog: () => void
}

/**
 * 纯展示组件：三个面板长得一模一样，差别全在各自的 effect 里，所以「怎么画」只写一遍。
 * 它不拥有任何 state（25 题：state 归属于真正需要它的地方 —— 这里是各个搜索面板）。
 *
 * 五种 UI 一一对应：idle / loading / error（带重试）/ success 且为空 / success 有数据。
 * 注意 empty 不是 error：请求成功、数据恰好为空，文案是引导换关键词而不是报错重试（11 题）。
 * success 时还要核对 forKeyword 与当前 keyword：不一致就用红字标出「列表来自哪个请求」——
 * 这一行是本题的「检测仪」，面板一会亮红，面板二、三永远不会。
 */
function ResultPanel({ title, hint, keyword, state, lines, onRetry, onClearLog }: ResultPanelProps) {
  return (
    <div className="card stack">
      <h3>{title}</h3>
      <p className="muted">{hint}</p>

      {state.status === 'idle' && <p className="muted">空闲 —— 关键词为空时不发请求</p>}
      {state.status === 'loading' && <p className="muted">加载中…</p>}

      {state.status === 'error' && (
        <div className="row">
          {/* 收窄到 error 分支后 TS 保证 state.message 存在；重试按钮只在这里出现 */}
          <span className="error-text">{state.message}</span>
          <button className="btn-primary" onClick={onRetry}>
            重试
          </button>
        </div>
      )}

      {state.status === 'success' && (
        <>
          {state.forKeyword === keyword ? (
            <p className="success-text">列表来自请求「{state.forKeyword}」，与当前关键词一致</p>
          ) : (
            <p className="error-text">
              当前关键词「{keyword}」／ 列表来自请求「{state.forKeyword}」—— 过期响应覆盖了正确结果
            </p>
          )}
          {state.users.length === 0 ? (
            <p className="muted">没有找到与「{state.forKeyword}」匹配的用户，换个关键词试试</p>
          ) : (
            <ul>
              {state.users.map((u) => (
                <li key={u.id}>
                  {u.name}（{u.email}）<span className="badge">{u.role}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="row">
        <span className="muted">时间线（→ 发出，← 返回，✂ 取消）</span>
        <button className="btn-ghost" onClick={onClearLog}>
          清空日志
        </button>
      </div>
      {/* 只追加、从不重排的列表用 index 当 key 可以接受（06 题规则的例外） */}
      <ul className="log">
        {lines.length === 0 ? (
          <li className="log-empty">（还没有日志 —— 在上方输入关键词，或点「自动演示」）</li>
        ) : (
          lines.map((line, index) => <li key={index}>{line}</li>)
        )}
      </ul>
    </div>
  )
}

/**
 * ★ 面板一【坏】：什么都不做 —— 谁最后返回谁说了算。
 *
 * effect 每次 keyword 变化都会重跑并发出新请求，这没错；错在「响应回来就 setState」，
 * 不问这个响应是不是当前关键词的。用自动演示复现（请求 A = #1，请求 B = #4）：
 *   → #1 发出「a」（1100ms）  → #2「an」（800ms）  → #3「ang」（500ms）  → #4「angf」（200ms）
 *   ← #4「angf」返回 1 条            ← 正确结果先到，页面短暂正确
 *   ← #3「ang」返回 4 条（覆盖！） ← #2「an」返回 4 条（覆盖！） ← #1「a」返回 8 条（覆盖！）
 * 最终页面停在「a」的 8 个人，而输入框里明明是 angf —— 上方红字会一直亮着。
 *
 * 这个面板没有 cleanup，也正因为没有 cleanup 才坏：对一个请求来说，cleanup 能做的只有两件事 ——
 * 丢弃响应（面板二）或取消请求（面板三），写了任何一种就不坏了。
 * 顺带说明它不会「炸」：切题后迟到的响应仍会调用 setState，React 18+ 对已卸载组件的 setState 是无声 no-op，
 * 控制台没有任何报错 —— 这恰恰是竞态可怕的地方：不报错，只是数据悄悄错了。
 *
 * 日志里的「覆盖！」旁白只是观察辅助：借用了请求序号判断「这不是最新一个请求」，
 * 而 setState 那一行不做任何判断 —— 坏就坏在这里。
 *
 * Vue 老手注意：这不是 React 特有的坑。Vue 侧 watch 回调里不注册 onCleanup 是一模一样的结果 ——
 * 竞态是「异步 + 可变的当前状态」这对组合的固有问题，跟框架无关。
 */
function BrokenSearch({ keyword, shouldFail, reloadFlag, onRetry }: SearchPanelProps) {
  const [state, setState] = useState<PanelState>({ status: 'idle' })
  const [lines, setLines] = useState<string[]>([])
  // 请求序号：跨渲染累加的计数器，改它不该触发渲染，所以放 ref 而不是 state（12 题）；在 effect 里递增
  const seqRef = useRef(0)

  useEffect(() => {
    // 关键词为空 → idle，不发请求。React 的 effect 首次渲染后必然执行（不像 watch 默认懒执行），
    // 所以要显式 return；顺带也保证 StrictMode 的「挂载→卸载→重挂载」不会发出任何请求污染时间线
    if (keyword === '') {
      setState({ status: 'idle' })
      return
    }
    // 日志写在 effect 里定义：每条日志都来自某一轮 effect，函数式更新保证异步追加也不会互相覆盖（24 题）
    const log = (line: string) => setLines((prev) => [...prev, line])
    const seq = ++seqRef.current
    const delayMs = delayFor(keyword)
    setState({ status: 'loading' })
    log(`→ #${seq} 发出「${keyword}」（预计 ${delayMs}ms）`)

    fetchUsers(keyword, { delayMs, failRate: shouldFail ? 1 : 0 })
      .then((users) => {
        // ❌ 不管这个响应属于哪个关键词，回来就写 —— 最后返回的那个请求决定页面
        setState({ status: 'success', users, forKeyword: keyword })
        const stale = seq !== seqRef.current ? `（覆盖！最新请求已是 #${seqRef.current}）` : ''
        log(`← #${seq}「${keyword}」返回 ${users.length} 条${stale}`)
      })
      .catch((err: unknown) => {
        // 错误同样会乱序落地：勾选「模拟请求失败」时，最后返回的错误也会盖掉前面的
        setState({ status: 'error', message: toMessage(err) })
        log(`← #${seq}「${keyword}」失败：${toMessage(err)}`)
      })
    // 这里没有 return cleanup —— 这就是「坏」的全部原因
  }, [keyword, shouldFail, reloadFlag])

  return (
    <ResultPanel
      title="面板一【坏】响应回来就写，没有 cleanup"
      hint="看时间线：#4「angf」最先返回后，#3、#2、#1 依次返回并各覆盖一次；最终列表是「a」的 8 人，上方亮红字。"
      keyword={keyword}
      state={state}
      lines={lines}
      onRetry={onRetry}
      onClearLog={() => setLines([])}
    />
  )
}

/**
 * ★ 面板二【修法一】ignore 标志 —— React 官方文档的写法（Learn → Synchronizing with Effects → Fetching data）。
 *
 * 每一轮 effect 都有自己的 let ignore = false；cleanup 把它置成 true。
 * cleanup 恰好在「下一轮 setup 之前」和「组件卸载前」执行，所以 ignore === true 就等价于
 * 「这一轮已经过期：keyword 又变了，或者组件没了」。响应回来时先看一眼 ignore，过期就丢。
 *
 * 为什么它能工作 —— 靠的是闭包：这一轮 effect 里的 then 回调和这一轮的 cleanup 捕获的是【同一个】ignore 变量，
 * 下一轮 effect 有它自己的另一个 ignore。React 每轮 setup 都是一次新的函数调用，天然把「轮次」隔离开了 ——
 * 这正是 23 / 26 题反复讲的「每次渲染都有自己的闭包」，在这里从陷阱变成了优点。
 *
 * 代价：请求并没有被取消。看日志：#1「a」在 1100ms 后照样回来（「已过期，丢弃」），
 * 网络流量和服务端计算一分没省，只是没让它污染页面。拿不到 AbortSignal 的场景（第三方 SDK、
 * 不接受 signal 的库函数）这是唯一选择，其余情况优先面板三。
 *
 * 卸载后的响应也会走到这里：ignore 已是 true，它只会去写一条日志 —— 对已卸载组件的 setState 是 no-op，
 * 不会报错。这一点也说明 ignore 的本质：它管住的是「结果落不落地」，管不住「请求跑不跑」。
 */
function IgnoreFlagSearch({ keyword, shouldFail, reloadFlag, onRetry }: SearchPanelProps) {
  const [state, setState] = useState<PanelState>({ status: 'idle' })
  const [lines, setLines] = useState<string[]>([])
  const seqRef = useRef(0)

  useEffect(() => {
    if (keyword === '') {
      setState({ status: 'idle' })
      return
    }
    // 这一轮 effect 专属的过期标记：then 回调与下面的 cleanup 共享同一个变量
    let ignore = false
    const log = (line: string) => setLines((prev) => [...prev, line])
    const seq = ++seqRef.current
    const delayMs = delayFor(keyword)
    setState({ status: 'loading' })
    log(`→ #${seq} 发出「${keyword}」（预计 ${delayMs}ms）`)

    fetchUsers(keyword, { delayMs, failRate: shouldFail ? 1 : 0 })
      .then((users) => {
        if (ignore) {
          // 响应真的回来了（网络没省），只是不再采用
          log(`← #${seq}「${keyword}」返回 ${users.length} 条 —— 已过期，丢弃`)
          return
        }
        setState({ status: 'success', users, forKeyword: keyword })
        log(`← #${seq}「${keyword}」返回 ${users.length} 条 —— 采用`)
      })
      .catch((err: unknown) => {
        if (ignore) {
          log(`← #${seq}「${keyword}」失败 —— 已过期，丢弃`)
          return
        }
        setState({ status: 'error', message: toMessage(err) })
        log(`← #${seq}「${keyword}」失败：${toMessage(err)}`)
      })

    return () => {
      // 下一轮 setup 之前 / 卸载前执行：给这一轮打上「过期」标记，响应回来时自己会丢弃
      ignore = true
    }
  }, [keyword, shouldFail, reloadFlag])

  return (
    <ResultPanel
      title="面板二【修法一】cleanup 里 ignore = true，丢弃过期响应"
      hint="四个请求照样都会返回（网络没省），但过期轮次的响应被丢弃；列表始终属于最新关键词，最终只剩王芳 1 人。"
      keyword={keyword}
      state={state}
      lines={lines}
      onRetry={onRetry}
      onClearLog={() => setLines([])}
    />
  )
}

/**
 * ★ 面板三【修法二】AbortController —— 真正取消请求。
 *
 * 每一轮 effect new 一个 AbortController，把 controller.signal 交给请求；cleanup 里 controller.abort()。
 * abort() 之后：fetch（以及这里的 mock API）会让 promise 以一个 name === 'AbortError' 的 DOMException 拒绝，
 * 浏览器会真的断掉这条连接 —— 看日志：#1「a」不会再有「返回」那一行，只有「✂ 已取消」。
 *
 * 两条纪律：
 * 1）取消不是失败：catch 里必须先 isAbortError(err) → return。漏了这一步，每敲一个字符都会闪一次错误 ——
 *    因为每次 keyword 变化都会 abort 上一轮，每次 abort 都会走到 catch。
 * 2）controller 必须是「这一轮 effect 的」局部变量：cleanup 是闭包，拿到的正是自己这一轮的 controller，
 *    不会误伤新一轮的请求（和面板二的 ignore 是同一个闭包原理）。
 *
 * 日志顺序的小细节：「✂ #1 已取消」写在 catch 里，而 promise 回调是微任务，所以它会出现在
 * 下一轮 setup 打出的「→ #2 发出」之后 —— 顺序反了不是 bug，是 JS 事件循环的时序。
 *
 * 没有 cleanup 可挂的命令式代码怎么办（11 题的 load() 函数、按钮点击触发的请求）：
 * 把「上一个 controller」存在 ref 里，函数开头先 abort 它；或者存一个递增的请求序号，
 * 响应回来时比对「我的序号 === 最新序号」才采用 —— 那就是 ignore 标志的命令式版本（latest ref，26 题）。
 * TanStack Query 的 queryFn({ signal }) 把这一整套自动化了（30 题）。
 *
 * 面试怎么考：「怎么处理搜索框的请求竞态？」标准答案就是这三档 —— abort（首选）、ignore / 请求序号（拿不到 signal 时）、
 * 直接用 TanStack Query / SWR（生产默认）。能顺带说出「取消不是失败」和「StrictMode 双跑正好检验 cleanup」是加分项。
 */
function AbortSearch({ keyword, shouldFail, reloadFlag, onRetry }: SearchPanelProps) {
  const [state, setState] = useState<PanelState>({ status: 'idle' })
  const [lines, setLines] = useState<string[]>([])
  const seqRef = useRef(0)

  useEffect(() => {
    if (keyword === '') {
      setState({ status: 'idle' })
      return
    }
    // 每轮 effect 创建属于自己的 controller；cleanup 是闭包，恰好能拿到「这一轮」的它
    const controller = new AbortController()
    const log = (line: string) => setLines((prev) => [...prev, line])
    const seq = ++seqRef.current
    const delayMs = delayFor(keyword)
    setState({ status: 'loading' })
    log(`→ #${seq} 发出「${keyword}」（预计 ${delayMs}ms）`)

    fetchUsers(keyword, { signal: controller.signal, delayMs, failRate: shouldFail ? 1 : 0 })
      .then((users) => {
        // 能走到这里的一定是「没被取消」的请求 —— 被 abort 的 promise 不会 resolve
        setState({ status: 'success', users, forKeyword: keyword })
        log(`← #${seq}「${keyword}」返回 ${users.length} 条 —— 采用`)
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) {
          // 「被取消」不是失败：不进 error 状态，只记一笔
          log(`✂ #${seq}「${keyword}」已取消（AbortError，不算失败；响应不会再回来）`)
          return
        }
        setState({ status: 'error', message: toMessage(err) })
        log(`← #${seq}「${keyword}」失败：${toMessage(err)}`)
      })

    // 下一轮 setup 之前 / 卸载前：取消这一轮的请求。10 题只展示了这一种修法，本题把它和另外两种并排
    return () => controller.abort()
  }, [keyword, shouldFail, reloadFlag])

  return (
    <ResultPanel
      title="面板三【修法二】cleanup 里 controller.abort()，真正取消"
      hint="过期请求在 cleanup 里被 abort：时间线里只有「✂ 已取消」，永远等不到它们的「返回」；只有 #4 返回并被采用。"
      keyword={keyword}
      state={state}
      lines={lines}
      onRetry={onRetry}
      onClearLog={() => setLines([])}
    />
  )
}

export default function Example() {
  /** 三个面板共享的输入：一个关键词同时驱动三种策略，才看得出差别 */
  const [keyword, setKeyword] = useState('')
  const [shouldFail, setShouldFail] = useState(false)
  /** 重试计数：+1 即让三个面板用同样参数重新请求（11 题的 reloadFlag 模式；三个面板共享一个关键词，所以一起重试） */
  const [reloadFlag, setReloadFlag] = useState(0)
  /**
   * 每次「重置」+1，作为三个面板外层容器的 key：key 一变，React 就把里面的三个面板【销毁重建】——
   * state、日志、请求序号全部归零。这是 06 题那条规则的另一面：key 不只是列表语法，也能重置组件状态。
   * 旧实例的 cleanup 会照常执行（abort / ignore），它们迟到的 setState 落在已卸载的实例上，是 no-op。
   * Vue 侧没有这一招（没有一一对应关系）：状态就在 setup 里，重置就是逐个赋回初始值。
   */
  const [round, setRound] = useState(0)
  const [demoRunning, setDemoRunning] = useState(false)
  /** 自动演示的定时器 id：存 ref 不存 state（改它不需要重渲染，12 题），卸载时必须全部 clearTimeout */
  const demoTimersRef = useRef<number[]>([])

  const clearDemoTimers = () => {
    demoTimersRef.current.forEach((id) => window.clearTimeout(id))
    demoTimersRef.current = []
  }

  // 卸载（切题 / StrictMode 的假卸载）时清掉还没触发的演示定时器，否则它们会对已卸载的组件 setKeyword
  useEffect(() => {
    return () => {
      demoTimersRef.current.forEach((id) => window.clearTimeout(id))
      demoTimersRef.current = []
    }
  }, [])

  /** 清空并重置：停掉演示、关键词归空（三个面板回到 idle）、换 key 让面板重建 */
  const reset = () => {
    clearDemoTimers()
    setDemoRunning(false)
    setKeyword('')
    setRound((r) => r + 1)
  }

  /**
   * 一键复现：a → an → ang → angf，每 150ms 一步。
   * 先 reset（同一事件里的几次 setState 通常会被批处理成一次渲染，24 题），再用 setTimeout 链逐步改 keyword。
   * 第一个字符也延后 150ms 而不是同步敲：若和上面的重置写在同一个事件里，三个面板会带着 keyword='a' 挂载，
   * StrictMode 的「挂载→卸载→重挂载」会让没有 cleanup 的面板一多发一个「a」请求，污染时间线。
   */
  const runDemo = () => {
    reset()
    setDemoRunning(true)
    DEMO_STEPS.forEach((step, index) => {
      const id = window.setTimeout(() => {
        setKeyword(step)
        if (index === DEMO_STEPS.length - 1) setDemoRunning(false)
      }, (index + 1) * DEMO_STEP_GAP_MS)
      demoTimersRef.current.push(id)
    })
  }

  const retry = () => setReloadFlag((n) => n + 1)

  return (
    <div className="stack">
      <div className="card stack">
        <h3>一个输入框驱动三个面板：同一个关键词、三种处理方式</h3>
        <p className="muted">
          延迟由关键词长度决定：{DELAY_TABLE}。正常速度打出 angf，四个请求一定逆序返回。
          也可以搜「zzz」看空态，勾选「模拟请求失败」看错误分支与重试。
        </p>

        <div className="row">
          {/* 受控输入框（07 题）：事件处理器只改 keyword，「发请求」由三个面板各自的 effect 响应 keyword 变化 */}
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="试试依次输入 a、an、ang、angf"
            disabled={demoRunning}
          />
          <button className="btn-primary" onClick={runDemo} disabled={demoRunning}>
            {demoRunning ? '演示中…' : '自动演示：依次输入 a → an → ang → angf（间隔 150ms）'}
          </button>
          <button className="btn-ghost" onClick={reset}>
            清空并重置
          </button>
        </div>

        <label className="row">
          {/* shouldFail 进了三个 effect 的依赖数组：勾选 / 取消都会让它们用新的 failRate 重新请求 */}
          <input type="checkbox" checked={shouldFail} onChange={(e) => setShouldFail(e.target.checked)} />
          <span>
            模拟请求失败（勾选期间所有请求必定失败；点面板里的「重试」会重新请求 —— 时间线多一轮、仍然失败；
            取消勾选会自动重新请求并恢复，不必再点「重试」）
          </span>
        </label>

        <p className="muted">
          观察顺序：先看面板一的红字和 8 人列表，再看面板二的「已过期，丢弃」、面板三的「✂ 已取消」——
          后两者最终都只剩王芳 1 人。切到别的题再回来，一切从 idle 重新开始，没有残留请求会报错。
        </p>
      </div>

      {/* key={round}：重置时整块销毁重建，三个面板的 state / 日志 / 序号一起归零 */}
      <div key={round} className="stack">
        <BrokenSearch keyword={keyword} shouldFail={shouldFail} reloadFlag={reloadFlag} onRetry={retry} />
        <IgnoreFlagSearch keyword={keyword} shouldFail={shouldFail} reloadFlag={reloadFlag} onRetry={retry} />
        <AbortSearch keyword={keyword} shouldFail={shouldFail} reloadFlag={reloadFlag} onRetry={retry} />
      </div>
    </div>
  )
}
