/**
 * 区块一【主线】：手写边界的基本行为 —— 隔离、重置、resetKeys。
 * Vue 对照：vue/BoundaryBasicsDemo.vue。
 */
import { useState, useSyncExternalStore } from 'react'
import ErrorBoundary, { errorMessage } from './ErrorBoundary'
import { createErrorLog, type ErrorLog } from './errorLog'

/** 易碎计数器：count 到 3 时在【渲染期间】throw —— 边界能接住的正是这类错误 */
function BuggyCounter() {
  const [count, setCount] = useState(0)
  if (count === 3) {
    throw new Error('计数到 3，BuggyCounter 渲染崩溃了')
  }
  return (
    <div className="row">
      <span>
        易碎计数器：<strong>{count}</strong>（加到 3 会在渲染中 throw）
      </span>
      <button className="btn-primary" onClick={() => setCount((c) => c + 1)}>
        +1
      </button>
    </div>
  )
}

/** 边界外面的计数器：证明崩溃被隔离在边界里面，旁边的组件不受影响 */
function SafeCounter() {
  const [count, setCount] = useState(0)
  return (
    <div className="row">
      <span>
        边界外的计数器：<strong>{count}</strong>
      </span>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  )
}

const PRODUCTS: Record<string, { name: string; price: number } | null> = {
  p1: { name: '机械键盘', price: 399 },
  p2: { name: '无线鼠标', price: 149 },
  p3: null, // 模拟一条损坏的数据：渲染时读 price 会报错
}

function ProductDetail({ id }: { id: string }) {
  const product = PRODUCTS[id]
  if (!product) throw new Error(`商品 ${id} 的数据损坏，无法渲染`)
  return (
    <p>
      {product.name}：￥{product.price.toFixed(2)}
    </p>
  )
}

function LogView({ log }: { log: ErrorLog }) {
  const lines = useSyncExternalStore(log.subscribe, log.getSnapshot)
  return (
    <pre className="log" aria-label="区块一 onError 日志">
      {lines.length === 0 ? '（还没有捕获到错误）' : lines.join('\n')}
    </pre>
  )
}

export function BoundaryBasicsDemo() {
  const [log] = useState(createErrorLog)
  const [productId, setProductId] = useState('p1')
  const [useResetKeys, setUseResetKeys] = useState(true)

  return (
    <div className="card stack">
      <h3>区块一：手写边界 —— 隔离、重置、resetKeys（主线）</h3>
      <p className="muted">
        把易碎计数器加到 3：只有边界里面变成兜底界面，边界外的计数器不受影响；点「重试」后子树以全新实例挂载（计数归零）。
      </p>
      <div className="row">
        <div className="card">
          <ErrorBoundary
            onError={(error) => log.push(`onError：${errorMessage(error)}`)}
            fallback={({ error, reset }) => (
              <div className="stack" role="alert">
                <p className="error-text">这块区域崩溃了：{errorMessage(error)}</p>
                <button className="btn-primary" onClick={reset}>
                  重试
                </button>
              </div>
            )}
          >
            <BuggyCounter />
          </ErrorBoundary>
        </div>
        <div className="card">
          <SafeCounter />
        </div>
      </div>

      <strong>resetKeys：出错的原因变了就自动重置</strong>
      <div className="row">
        {Object.keys(PRODUCTS).map((id) => (
          <label key={id} className="row">
            <input type="radio" name="topic20-product" checked={productId === id} onChange={() => setProductId(id)} />
            {id === 'p3' ? `${id}（数据损坏）` : id}
          </label>
        ))}
        <label className="row">
          <input type="checkbox" checked={useResetKeys} onChange={(e) => setUseResetKeys(e.target.checked)} />
          传 resetKeys={'{[productId]}'}
        </label>
      </div>
      <ErrorBoundary
        resetKeys={useResetKeys ? [productId] : undefined}
        onError={(error) => log.push(`onError：${errorMessage(error)}`)}
        onReset={() => log.push('onReset：边界已重置')}
        fallback={({ error, reset }) => (
          <div className="row" role="alert">
            <span className="error-text">{errorMessage(error)}</span>
            <button onClick={reset}>重试</button>
          </div>
        )}
      >
        <ProductDetail id={productId} />
      </ErrorBoundary>
      <p className="muted">
        选 p3 → 兜底界面。传了 resetKeys 时，再选 p1 边界自动重置；不传时要手动点「重试」（而且还停在 p3 就会再崩一次）。
      </p>
      <LogView log={log} />
    </div>
  )
}
