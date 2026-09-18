/**
 * 区块四【主流·19.0 起】：根节点的错误回调 createRoot(container, { onCaughtError, onUncaughtError, onRecoverableError })。
 * createRoot 页原文：
 * - onCaughtError「Callback called when React catches an error in an Error Boundary.」
 * - onUncaughtError「Callback called when an error is thrown and not caught by an Error Boundary.」
 * - onRecoverableError「Callback called when React automatically recovers from errors.」（18.0 起就有；前两个 19.0 起）
 * 「By default, React will log all errors to the console.」—— react-dom 19.2.8 的默认实现：被边界接住的 → console.error；
 * 没接住的 → reportError（window 的 error 事件），开发环境再加一条「Consider adding an error boundary」的 console.warn。
 * 传了回调就替换掉默认实现，所以生产上在这里统一上报监控（Sentry 等）。
 *
 * 演示需要：真实项目在入口文件 createRoot 时传这些选项（本站 src/main.tsx 没传，用的是默认行为）。
 * 这里在卡片里另建一棵「小根」来观察回调；每次建根都用新的容器 div，卸载放进微任务（和 src/bridge/ReactIsolatedMount.tsx 同一个原因：
 * 外层 React 提交期间同步卸载另一棵根会报错）。
 * 同时演示「没有边界时 React 会把整棵根的界面移除」：react.dev Component 页「By default, if your application throws an error during rendering,
 * React will remove its UI from the screen.」—— 所以生产上要有根边界（或路由级边界）兜底。
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary, { errorMessage } from './ErrorBoundary'
import { createErrorLog, type ErrorLog } from './errorLog'

function CrashButton({ label }: { label: string }) {
  const [crash, setCrash] = useState(false)
  if (crash) throw new Error(label)
  return (
    <button className="btn-danger" onClick={() => setCrash(true)}>
      {label}
    </button>
  )
}

function MiniApp() {
  return (
    <div className="stack">
      <p className="muted">这是一棵独立的小根（createRoot 传了 onCaughtError / onUncaughtError）。</p>
      <ErrorBoundary
        fallback={({ error }) => (
          <p className="error-text" role="alert">
            边界接住了：{errorMessage(error)}
          </p>
        )}
      >
        <CrashButton label="边界里的组件崩溃" />
      </ErrorBoundary>
      <CrashButton label="没有边界的组件崩溃" />
    </div>
  )
}

function LogView({ log }: { log: ErrorLog }) {
  const lines = useSyncExternalStore(log.subscribe, log.getSnapshot)
  return (
    <pre className="log" aria-label="根回调日志">
      {lines.length === 0 ? '（回调还没被调用）' : lines.join('\n')}
    </pre>
  )
}

export function RootOptionsDemo() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [log] = useState(createErrorLog)
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const container = document.createElement('div')
    host.appendChild(container)
    const root = createRoot(container, {
      onCaughtError: (error, info) => {
        const boundary = info.errorBoundary?.constructor.name ?? '未知'
        log.push(`onCaughtError：${errorMessage(error)}（接住它的边界：${boundary}）`)
      },
      onUncaughtError: (error) => {
        log.push(`onUncaughtError：${errorMessage(error)} —— 没有边界，整棵小根的界面被移除`)
      },
    })
    root.render(<MiniApp />)
    return () => {
      queueMicrotask(() => {
        root.unmount()
        container.remove()
      })
    }
  }, [generation, log])

  return (
    <div className="card stack">
      <h3>区块四：createRoot 的错误回调（React 19 起）与根级兜底</h3>
      <div className="card" ref={hostRef} />
      <div className="row">
        <button onClick={() => setGeneration((g) => g + 1)}>重建小根</button>
        <span className="muted">点「没有边界的组件崩溃」后小根变成空白，用这个按钮重建。</span>
      </div>
      <LogView log={log} />
      <strong>生产项目的分层（从外到内）</strong>
      <ul className="muted">
        <li>根：createRoot 的 onCaughtError / onUncaughtError 统一上报；最外层包一个根边界，不让整页白屏。</li>
        <li>路由级：React Router 的路由 ErrorBoundary 接 loader / action / 页面渲染的错误（18 题）；上报用 RouterProvider 的 onError。</li>
        <li>局部：弹窗、卡片、第三方组件各包一个边界，带「重试」和 resetKeys（区块一、三）。</li>
        <li>可预期的失败（表单校验、请求失败提示）不靠边界：转成 state 显示，或像 Actions 那样把错误作为返回值（31 题，待新增）。例外是 404：React Router 推荐 loader 里 throw data(..., {'{ status: 404 }'}) 交给路由级边界。</li>
      </ul>
    </div>
  )
}
