/**
 * 区块二：手动 addEventListener —— 依赖数组决定「交给浏览器的是哪次渲染的闭包」。
 * Vue 对照：vue/ListenerDemo.vue。
 *
 * 五个输入框，同一个 count：
 * ❌ 依赖 []                 ：监听器在挂载后注册一次，handler 是挂载那次渲染的闭包，count 一直是 0。
 * ② 写对依赖 [count, log]    ：count 每变一次，先 cleanup 注销旧 handler、再注册新一次渲染的 handler。读得对，代价是反复重注册。
 * ③ useEffectEvent【较新·19.2 起】：react.dev useEffectEvent 页的用法「Using an event listener with latest values」——
 *    监听器只注册一次，handler 里调用的 Effect Event 读到的是最新提交的 count。
 * 对照 JSX onKeyDown         ：React 在根节点统一派发事件，派发时从 DOM 节点上读「最近一次提交的 props」里的处理函数，读到的就是最新一次渲染的 count。
 * ❌ useCallback(fn, [])      ：JSX 事件也会过期 —— 前提是你把旧闭包缓存了起来（useCallback 页：依赖没变时返回上一次存下的函数）。
 */
import { useCallback, useEffect, useEffectEvent, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createDemoLog, type DemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

interface ListenerProps {
  /** 父组件的计数：每次渲染都是最新的，但监听器闭包里的那份取决于写法 */
  count: number
  /** 父组件 useState 里建的日志 store，引用稳定，写进依赖数组不会引起重跑 */
  log: DemoLog
}

/**
 * ❌ 依赖 []：Effect 的 setup 只执行一次 → addEventListener 只调用一次 → 交给浏览器的一直是第一次渲染的 handler。
 * 之后 count 变了、组件重渲染了很多次，每次渲染都创建了新的 handleKeyDown，但没有谁把它们交给浏览器。
 * 和 10 题「setInterval 里读旧 count」是同一个病根，只是「外部世界」从定时器换成了 DOM 事件系统。
 * cleanup 照样写：错误示范只允许错在「读到的值」，不允许错在「清理」。
 */
function BrokenEnterListener({ count, log }: ListenerProps) {
  const inputRef = useRef<HTMLInputElement>(null) // DOM ref（12 题）

  useEffect(() => {
    const el = inputRef.current
    if (el === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      log.add(`【坏 · 依赖 []】监听器读到 count=${count}（挂载那次渲染的快照）`)
    }
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
    // 教学反例：这里的 [] 正是 exhaustive-deps 报「missing dependencies: 'count' and 'log'」的地方（2026-09-18 实测文案见 Example.tsx 六）。
    // 19.2 博客：「most users just disable the lint rule and exclude the dependency. But that can lead to bugs」—— 正式代码别学这个 disable。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="row">
      <input ref={inputRef} placeholder="按 Enter（坏：依赖 []）" />
      <span className="muted">监听器闭包里的 count 停在挂载那次渲染</span>
    </div>
  )
}

/**
 * ② 写对依赖 [count, log]：count 每变一次，React 先执行上一轮的 cleanup（removeEventListener 旧 handler），
 * 再执行新一轮 setup（addEventListener 新一次渲染的 handler）。
 * 依赖数组决定的是「Effect 里的闭包什么时候被重新创建、重新交出去」。
 * 代价：count 每变一次就注销 / 重注册一次。对 DOM 事件可以忽略；外部资源是 WebSocket 连接、播放器、第三方 SDK 实例时往往不能接受 ——
 * 那时把「读最新值」的部分交给 useEffectEvent（下一个组件）。
 * 试一次：把 return 那一行删掉再按 Enter —— 每次 count 变化都多挂一个 handler、旧的一个都没走，一次 Enter 记出好几行（各自读着不同的旧 count）。
 */
function DepsEnterListener({ count, log }: ListenerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const setupNo = useRef(0)

  useEffect(() => {
    const el = inputRef.current
    if (el === null) return
    setupNo.current += 1
    log.add(`【写对依赖】第 ${setupNo.current} 次注册监听器（count=${count}）`)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      log.add(`【写对依赖】监听器读到 count=${count}`)
    }
    el.addEventListener('keydown', handleKeyDown)
    // cleanup 两个时机：下一轮 setup 之前、卸载之前
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [count, log])

  return (
    <div className="row">
      <input ref={inputRef} placeholder="按 Enter（写对依赖 [count, log]）" />
      <span className="muted">count 每变一次重注册一次</span>
    </div>
  )
}

/**
 * ③ useEffectEvent：把「读最新值」的那部分逻辑抽成 Effect Event，Effect 本身只负责注册 / 注销。
 * onEnter 读的 count 是调用那一刻最新提交的那次渲染的；它不是响应式值，不写进依赖（写了 exhaustive-deps 会报 warn，本项目 --max-warnings=0，lint 直接失败）。
 * Effect 的依赖只剩 log（引用稳定）→ 监听器只注册一次。
 * 规矩：onEnter 只能在 Effect 里（包括 Effect 注册的监听器 / 定时器回调里）调用，不能在渲染时调用、不能传给子组件或别的 Hook。
 */
function EffectEventEnterListener({ count, log }: ListenerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const setupNo = useRef(0)

  const onEnter = useEffectEvent(() => {
    log.add(`【useEffectEvent】监听器读到 count=${count}（调用那一刻最新提交的值）`)
  })

  useEffect(() => {
    const el = inputRef.current
    if (el === null) return
    setupNo.current += 1
    log.add(`【useEffectEvent】第 ${setupNo.current} 次注册监听器`)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onEnter()
    }
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [log])

  return (
    <div className="row">
      <input ref={inputRef} placeholder="按 Enter（useEffectEvent）" />
      <span className="muted">只注册一次，读到的是最新值</span>
    </div>
  )
}

/**
 * ❌ 被 useCallback 缓存的 JSX 事件处理函数：依赖写 []，useCallback 一直返回第一次渲染存下的那个函数 —— 它读到的 count 停在 0。
 * 「JSX 事件不会过期」的前提是每次渲染都把新函数交给 React；缓存了旧闭包，就又回到依赖数组的问题（17 题讲 useCallback 何时值得用）。
 * 开启 React Compiler【较新·1.0（2025-10）起】后通常不用手写 useCallback（useCallback 页「React Compiler automatically memoizes values and functions, reducing
 * the need for manual useCallback calls」；本项目未启用，17 题）。
 */
function CachedJsxHandler({ count, log }: ListenerProps) {
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') log.add(`【坏 · useCallback []】JSX 处理函数读到 count=${count}（缓存住的是第一次渲染的闭包）`)
    },
    // 教学反例：exhaustive-deps 报「missing dependencies: 'count' and 'log'」。正式代码写 [count, log]，或者干脆不包 useCallback。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  return (
    <div className="row">
      <input placeholder="按 Enter（坏：useCallback 缓存的 onKeyDown）" onKeyDown={handleKeyDown} />
      <span className="muted">JSX 事件被缓存后一样会过期</span>
    </div>
  )
}

export function ListenerDemo() {
  const [count, setCount] = useState(0)
  const [log] = useState(() => createDemoLog(20))

  return (
    <div className="card stack">
      <h3>区块二：手动 addEventListener —— 依赖数组决定监听器里的闭包是哪次渲染的</h3>
      <p className="muted">
        先点几次 +1，再分别在各个输入框里按 Enter。「写对依赖」那一行每次 +1 都会重新注册监听器（看日志里的「第 n 次注册」），
        useEffectEvent 版只注册一次却读到最新值。开发环境的 StrictMode 会让每个 Effect 在挂载时多跑一轮 setup + cleanup，
        所以页面上一开始就能看到「第 2 次注册」；自动化测试不开 StrictMode，是第 1 次。
      </p>
      <p>
        当前 count：<strong aria-label="区块二 count">{count}</strong>
      </p>
      <div className="row">
        <button className="btn-primary" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
        <button className="btn-ghost" onClick={() => setCount(0)}>
          归零
        </button>
      </div>
      <BrokenEnterListener count={count} log={log} />
      <DepsEnterListener count={count} log={log} />
      <EffectEventEnterListener count={count} log={log} />
      <div className="row">
        {/* JSX 事件：这个箭头函数每次渲染都是新的，React 会换上新的 —— 读到的是本次渲染的 count */}
        <input
          placeholder="按 Enter（对照：JSX onKeyDown）"
          onKeyDown={(e) => {
            if (e.key === 'Enter') log.add(`【对照 · JSX】onKeyDown 读到 count=${count}（每次渲染都换成新函数）`)
          }}
        />
        <span className="muted">没被缓存的 JSX 事件读到本次渲染的值</span>
      </div>
      <CachedJsxHandler count={count} log={log} />
      <LogPanel log={log} label="区块二日志" emptyHint="（还没有记录，在上面的输入框里按 Enter）" />
    </div>
  )
}
