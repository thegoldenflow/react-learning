/**
 * 区块二【主线】：边界能接住什么、接不住什么 —— 每个按钮用一种方式抛错，看外层边界有没有显示兜底界面。
 * 结论（React 19.2.8 实测，Example.test.tsx 逐条覆盖）：
 * - 接得住：渲染中 throw；useTransition 返回的 startTransition 里 throw（同步或 async 都算）；lazy 组件加载失败。
 * - 接不住：事件处理函数里 throw；async 事件处理函数 await 之后 throw；setTimeout 回调里 throw；
 *   从 react 直接导入的顶层 startTransition 里 throw（官方例外只说了 useTransition 返回的那个）。
 * 接不住的错误去哪了：事件处理函数里的错误被 React 捕获后交给 reportError（浏览器派发 window 的 error 事件，react-dom
 * executeDispatch）；setTimeout 里的是普通未捕获异常（同样是 window 的 error 事件）；async 函数里的是未处理的 Promise 拒绝
 * （window 的 unhandledrejection 事件）。本区块在 Effect 里监听这两个事件写进日志 —— 真实项目在这里上报监控。
 * Vue 对照：vue/CatchScopeDemo.vue（事件处理函数、async 处理函数的错误 Vue 都能交给 onErrorCaptured）。
 */
import { lazy, startTransition, Suspense, useEffect, useState, useSyncExternalStore, useTransition } from 'react'
import ErrorBoundary, { errorMessage } from './ErrorBoundary'
import { createErrorLog, type ErrorLog } from './errorLog'

// 模拟「代码分割的 chunk 下载失败」（发版后旧页面请求已删除的文件、网络断开）：lazy 的 Promise 被拒绝
const BrokenChunk = lazy(() => Promise.reject(new Error('chunk 加载失败（模拟网络错误）')))

function Triggers({ log }: { log: ErrorLog }) {
  const [renderCrash, setRenderCrash] = useState(false)
  const [showLazy, setShowLazy] = useState(false)
  const [caught, setCaught] = useState<string | null>(null)
  const [isPending, startHookTransition] = useTransition()

  if (renderCrash) throw new Error('渲染中 throw')

  return (
    <div className="stack">
      <strong>接得住（外层边界会显示兜底界面）</strong>
      <div className="row">
        <button className="btn-danger" onClick={() => setRenderCrash(true)}>
          1. 渲染中 throw
        </button>
        <button
          className="btn-danger"
          onClick={() =>
            startHookTransition(async () => {
              await Promise.resolve()
              throw new Error('useTransition 的 startTransition 里 throw（React 19 起进边界）')
            })
          }
        >
          2. useTransition 的 startTransition 里 throw{isPending ? '…' : ''}
        </button>
        <button className="btn-danger" onClick={() => setShowLazy(true)}>
          3. 渲染一个加载失败的 lazy 组件
        </button>
      </div>
      {showLazy && (
        <Suspense fallback={<p className="muted">加载中…</p>}>
          <BrokenChunk />
        </Suspense>
      )}

      <strong>接不住（边界没反应，错误去了 window 的 error / unhandledrejection 事件）</strong>
      <div className="row">
        <button
          onClick={() => {
            throw new Error('事件处理函数里 throw')
          }}
        >
          4. 事件处理函数里 throw
        </button>
        <button
          onClick={async () => {
            await Promise.resolve()
            throw new Error('async 事件处理函数 await 之后 throw')
          }}
        >
          5. async 处理函数里 throw
        </button>
        <button
          onClick={() =>
            setTimeout(() => {
              throw new Error('setTimeout 回调里 throw')
            }, 0)
          }
        >
          6. setTimeout 里 throw
        </button>
        <button
          onClick={() =>
            startTransition(() => {
              throw new Error('顶层 startTransition 里 throw')
            })
          }
        >
          7. 顶层 startTransition 里 throw
        </button>
      </div>

      <strong>接不住的错误怎么处理：自己 try / catch，转成 state</strong>
      <div className="row">
        <button
          onClick={() => {
            try {
              throw new Error('保存失败（已被 try / catch 接住）')
            } catch (err) {
              setCaught(errorMessage(err))
              log.push(`try / catch：${errorMessage(err)}`)
            }
          }}
        >
          8. try / catch 后显示
        </button>
        {caught && <span className="error-text">{caught}</span>}
      </div>
      <p className="muted">另一种做法是把错误交给边界：react-error-boundary 的 useErrorBoundary().showBoundary(error)（区块三）。</p>
    </div>
  )
}

function LogView({ log }: { log: ErrorLog }) {
  const lines = useSyncExternalStore(log.subscribe, log.getSnapshot)
  return (
    <pre className="log" aria-label="区块二错误日志">
      {lines.length === 0 ? '（还没有错误）' : lines.join('\n')}
    </pre>
  )
}

export function CatchScopeDemo() {
  const [log] = useState(createErrorLog)
  const [boundaryKey, setBoundaryKey] = useState(0)

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      log.push(`window error 事件：${event.message}`)
      // 演示里阻止浏览器再打印一遍「Uncaught Error」，控制台保持干净；删掉这一行就能在控制台看到原始报错
      event.preventDefault()
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      log.push(`window unhandledrejection 事件：${errorMessage(event.reason)}`)
      event.preventDefault()
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [log])

  return (
    <div className="card stack">
      <h3>区块二：边界接得住什么、接不住什么（主线）</h3>
      <ErrorBoundary
        key={boundaryKey}
        onError={(error) => log.push(`边界 onError：${errorMessage(error)}`)}
        fallback={({ error }) => (
          <div className="stack" role="alert">
            <p className="error-text">边界接住了：{errorMessage(error)}</p>
            {/* 换 key 重新挂载整个边界 —— 另一种重置方式（等价于卸载再挂载） */}
            <button className="btn-primary" onClick={() => setBoundaryKey((k) => k + 1)}>
              换 key 重新挂载
            </button>
          </div>
        )}
      >
        <Triggers log={log} />
      </ErrorBoundary>
      <LogView log={log} />
      <p className="muted">window 的 error / unhandledrejection 事件是整个页面共享的：右边 Vue 侧触发的同类错误也会出现在这个日志里。</p>
    </div>
  )
}
