/**
 * 区块三【并排 · 主流】：react-error-boundary（已安装 6.1.3，peer react ^18 || ^19）。
 * react.dev Component 页原文：「you don't have to write the Error Boundary class yourself. For example, you can use react-error-boundary instead.」
 * 它提供的东西和主线手写版一一对应（手写版的 props 就是照它设计的）：
 * - <ErrorBoundary>：fallback（静态内容）/ fallbackRender（渲染函数）/ FallbackComponent（组件）三选一；
 *   onError(error, info) 上报；onReset(details) 重置时通知，details.reason 是 'imperative-api'（调用了 resetErrorBoundary）或 'keys'（resetKeys 变了）；
 *   resetKeys 数组逐项 Object.is 比较。
 * - useErrorBoundary()：返回 { error, showBoundary, resetBoundary }。showBoundary(error) 把事件处理函数 / 异步代码里 catch 到的错误交给最近的边界 ——
 *   实现方式是先 setState 记下错误、下一次渲染时在这个 Hook 里 throw（dist/react-error-boundary.js:84-92），所以对「渲染中的错误」才生效的边界也能接住。
 * - withErrorBoundary(Component, props)：高阶组件写法，存量代码里常见。getErrorMessage(thrown)：从任意 throw 出来的值里取 message。
 * Vue 对照：Vue 的 onErrorCaptured 本身就接事件处理函数和 async 处理函数的错误，不需要 showBoundary 这一步（vue/CatchScopeDemo.vue）。
 */
import { useState, useSyncExternalStore } from 'react'
import { ErrorBoundary, getErrorMessage, useErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { fetchOrder } from '@/shared/mockApi'
import { createErrorLog, type ErrorLog } from './errorLog'

function OrderFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="row" role="alert">
      <span className="error-text">加载失败：{getErrorMessage(error) ?? '未知错误'}</span>
      <button className="btn-primary" onClick={() => resetErrorBoundary()}>
        重试
      </button>
    </div>
  )
}

function OrderLoader({ orderId, fail, delayMs }: { orderId: string; fail: boolean; delayMs: number }) {
  const { showBoundary } = useErrorBoundary()
  const [text, setText] = useState('（点「加载订单」）')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const order = await fetchOrder(orderId, { delayMs, failRate: fail ? 1 : 0 })
      setText(order ? `${order.orderNo} · ${order.customer} · ￥${order.amount}` : `订单 ${orderId} 不存在`)
    } catch (err) {
      // 事件处理函数 / await 之后的错误，边界本来接不住；showBoundary 把它交给最近的边界
      showBoundary(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row">
      <button onClick={() => void load()} disabled={loading}>
        {loading ? '加载中…' : '加载订单'}
      </button>
      <span>{text}</span>
    </div>
  )
}

function LogView({ log }: { log: ErrorLog }) {
  const lines = useSyncExternalStore(log.subscribe, log.getSnapshot)
  return (
    <pre className="log" aria-label="区块三日志">
      {lines.length === 0 ? '（还没有事件）' : lines.join('\n')}
    </pre>
  )
}

export function LibraryBoundaryDemo({ delayMs = 400 }: { delayMs?: number }) {
  const [log] = useState(createErrorLog)
  const [orderId, setOrderId] = useState('o1')
  const [fail, setFail] = useState(true)

  return (
    <div className="card stack">
      <h3>区块三：react-error-boundary（并排）</h3>
      <div className="row">
        <label className="row">
          订单
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)} aria-label="订单 id">
            <option value="o1">o1</option>
            <option value="o2">o2</option>
          </select>
        </label>
        <label className="row">
          <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />
          模拟请求失败
        </label>
      </div>
      <ErrorBoundary
        FallbackComponent={OrderFallback}
        onError={(error) => log.push(`onError：${getErrorMessage(error)}`)}
        onReset={(details) => log.push(`onReset：reason = ${details.reason}`)}
        resetKeys={[orderId]}
      >
        <OrderLoader orderId={orderId} fail={fail} delayMs={delayMs} />
      </ErrorBoundary>
      <p className="muted">
        勾着「模拟请求失败」点加载 → 兜底界面；点「重试」（reason = imperative-api）或换一个订单（resetKeys 变化，reason = keys）都会重置。
      </p>
      <LogView log={log} />
    </div>
  )
}
