/**
 * 区块四：依赖数组的三个实验 —— 「写对依赖」之后 Effect 反而跑多了怎么办、ref.current 能不能当依赖。
 * Vue 对照：vue/WatchSourceDemo.vue。
 *
 * react.dev removing-effect-dependencies 的思路：依赖不是你挑的，是 Effect 里读到的响应式值决定的（「prove that it's not a dependency」）。
 * 想让某个依赖消失，不能删掉它或关掉 lint，要改代码让 Effect 不再读它。本区块演示其中三件事：
 * 4a 修法：本该由交互触发的逻辑，搬回事件处理函数（不再是 Effect，自然没有依赖）；
 * 4b 修法：每次渲染新建的对象当依赖 → Effect 每次渲染都重跑。把对象移进 Effect，或者只依赖原始值；
 * 4c 反例：ref.current 写进依赖数组没用 —— 改 ref 不触发渲染，React 没机会比较依赖。
 * 修法 ①「由旧算新用函数式更新」见区块一的 +1 按钮与 10 题的计数器，这里不重复。
 */
import { useEffect, useRef, useState } from 'react'
import { createDemoLog, type DemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

type Theme = 'light' | 'dark'

/* ---------------------------------------------------------------------------
 * 4a：该搬进事件处理函数的逻辑
 * ------------------------------------------------------------------------- */

/**
 * ❌ 用 state + Effect 响应「提交」：提交后 submitted 变 true，Effect 发请求并按当前主题弹通知。
 * 通知要用 theme，诚实地把 theme 写进依赖 —— 结果提交之后每切一次主题，Effect 重跑，又发一次请求。
 * 问题不在依赖写错，而在这段逻辑本来就不该放进 Effect：它是对「点了提交」这个交互的响应，不是「和外部系统保持同步」。
 */
function SubmitViaEffect({ theme, log }: { theme: Theme; log: DemoLog }) {
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => {
    if (!submitted) return
    log.add('【Effect 版】POST /api/register')
    log.add(`【Effect 版】弹出通知「注册成功」（${theme} 主题）`)
  }, [submitted, theme, log])
  return (
    <button onClick={() => setSubmitted(true)} disabled={submitted}>
      {submitted ? '已提交（Effect 版）' : '提交（Effect 版）'}
    </button>
  )
}

/** ✅ 事件处理函数里直接做：只在点击时执行一次，读到的就是点击那次渲染的 theme（这里要的正是它） */
function SubmitViaHandler({ theme, log }: { theme: Theme; log: DemoLog }) {
  const [submitted, setSubmitted] = useState(false)
  const handleSubmit = () => {
    setSubmitted(true)
    log.add('【事件版】POST /api/register')
    log.add(`【事件版】弹出通知「注册成功」（${theme} 主题）`)
  }
  return (
    <button onClick={handleSubmit} disabled={submitted}>
      {submitted ? '已提交（事件版）' : '提交（事件版）'}
    </button>
  )
}

function MoveToHandlerLab() {
  const [theme, setTheme] = useState<Theme>('light')
  const [log] = useState(() => createDemoLog())
  return (
    <div className="card stack">
      <h4>4a · 本该由交互触发的逻辑，搬回事件处理函数</h4>
      <p className="muted">两个按钮各点一次提交，再切几次主题：Effect 版每切一次就多发一次请求；事件版只发了一次。</p>
      <div className="row">
        <button className="btn-ghost" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
          切换主题（当前 {theme}）
        </button>
        <SubmitViaEffect theme={theme} log={log} />
        <SubmitViaHandler theme={theme} log={log} />
      </div>
      <LogPanel log={log} label="4a 日志" />
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * 4b：每次渲染新建的对象当依赖
 * ------------------------------------------------------------------------- */

/** 模拟一个连接：connect / disconnect 都写日志（外部系统，就是 Effect 该同步的东西） */
function createConnection(options: { serverUrl: string; roomId: string }, log: DemoLog, tag: string) {
  return {
    connect: () => log.add(`${tag}连接 ${options.serverUrl}/${options.roomId}`),
    disconnect: () => log.add(`${tag}断开 ${options.roomId}`),
  }
}

const SERVER_URL = 'wss://chat.example'

/**
 * ❌ options 在组件体里创建：每次渲染都是一个新对象，依赖比较用 Object.is，新对象每次都判定为「变了」→ 每次渲染都断开重连。
 * 在草稿框里打字（和连接毫无关系的 state）就能看到一串「断开 / 连接」。
 */
function ObjectDepRoom({ roomId, log }: { roomId: string; log: DemoLog }) {
  const [draft, setDraft] = useState('')
  // 教学反例：exhaustive-deps 在这一行报「The 'options' object makes the dependencies of useEffect Hook (at line …) change on every render.
  // Move it inside the useEffect callback. Alternatively, wrap the initialization of 'options' in its own useMemo() Hook.」（2026-09-18 实测）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = { serverUrl: SERVER_URL, roomId }
  useEffect(() => {
    const connection = createConnection(options, log, '【对象依赖】')
    connection.connect()
    return () => connection.disconnect()
  }, [options, log])
  return <input placeholder="草稿（对象依赖版）" value={draft} onChange={(e) => setDraft(e.target.value)} />
}

/** ✅ 对象在 Effect 里面创建，依赖只剩原始值 roomId：打字不影响连接，换房间才重连 */
function PrimitiveDepRoom({ roomId, log }: { roomId: string; log: DemoLog }) {
  const [draft, setDraft] = useState('')
  useEffect(() => {
    const options = { serverUrl: SERVER_URL, roomId }
    const connection = createConnection(options, log, '【原始值依赖】')
    connection.connect()
    return () => connection.disconnect()
  }, [roomId, log])
  return <input placeholder="草稿（原始值依赖版）" value={draft} onChange={(e) => setDraft(e.target.value)} />
}

function ObjectDepLab() {
  const [roomId, setRoomId] = useState('general')
  const [log] = useState(() => createDemoLog())
  return (
    <div className="card stack">
      <h4>4b · 每次渲染新建的对象当依赖 → 每次渲染都重跑</h4>
      <p className="muted">
        在两个草稿框里各打几个字：对象依赖版每个字都「断开 + 连接」一次，原始值依赖版不动；换房间时两个都重连一次。
        开发环境的 StrictMode 会在挂载时多一轮「连接 → 断开」，测试里没有。
      </p>
      <div className="row">
        <label className="row">
          <span>房间：</span>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="general">general</option>
            <option value="travel">travel</option>
          </select>
        </label>
      </div>
      <div className="row">
        <ObjectDepRoom roomId={roomId} log={log} />
        <PrimitiveDepRoom roomId={roomId} log={log} />
      </div>
      <LogPanel log={log} label="4b 日志" />
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * 4c：ref.current 写进依赖数组没用
 * ------------------------------------------------------------------------- */

/**
 * 依赖数组在渲染时求值，并与上一次渲染的依赖逐项比较（Object.is，react-dom updateEffectImpl）；有变化才给这个 Effect 打标记，提交后执行。
 * 改 ref.current 不会触发渲染 → 没有这一次比较 → Effect 不跑；等别的原因让组件重渲染时，React 才看到 ref.current 变了、补跑一次 ——
 * 时机取决于下一次由别的原因触发的渲染，不由 ref 控制。
 * lifecycle-of-reactive-effects 页：可变值（包括 ref.current）不能当依赖；useRef 返回的 ref 对象本身可以，但它身份不变，写了等于没写。
 * 真需要「值变了就执行」，这个值就该是 state；只是想在回调里读最新值，就不需要它当依赖（区块三 ④）。
 */
function RefCurrentDepLab() {
  const clicks = useRef(0)
  const [renders, setRenders] = useState(0)
  const [log] = useState(() => createDemoLog())

  useEffect(() => {
    log.add(`Effect 执行了（此刻 ref.current=${clicks.current}）`)
    // 教学反例。exhaustive-deps：「Mutable values like 'clicks.current' aren't valid dependencies because mutating them doesn't re-render
    // the component.」；refs 规则也会拦下「渲染期读 ref.current」（依赖数组在渲染时求值）。两条都关掉才能保留这个反例（2026-09-18 实测）。
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/refs
  }, [clicks.current, log])

  return (
    <div className="card stack">
      <h4>4c · ref.current 写进依赖数组没用</h4>
      <p className="muted">
        点几次「ref.current + 1」：Effect 一次都不跑（改 ref 不触发渲染）。再点「让组件重渲染」：Effect 才补跑一次，读到累计的值。
        （开发环境的 StrictMode 会让它在挂载时先多执行一次，测试里没有。）
      </p>
      <div className="row">
        <button
          onClick={() => {
            clicks.current += 1
            log.add(`ref.current 改成了 ${clicks.current}（没有触发渲染）`)
          }}
        >
          ref.current + 1
        </button>
        <button className="btn-ghost" onClick={() => setRenders((n) => n + 1)}>
          让组件重渲染（已 {renders} 次）
        </button>
      </div>
      <LogPanel log={log} label="4c 日志" />
    </div>
  )
}

export function DependencyLabs() {
  return (
    <div className="card stack">
      <h3>区块四：让依赖「合法地」消失 —— 搬进事件、对象移进 Effect、ref.current 不能当依赖</h3>
      <MoveToHandlerLab />
      <ObjectDepLab />
      <RefCurrentDepLab />
    </div>
  )
}
