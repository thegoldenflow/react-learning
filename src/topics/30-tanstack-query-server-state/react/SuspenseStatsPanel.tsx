/**
 * 区块四：useSuspenseQuery —— 「还没数据」交给 Suspense 的 fallback，「首次就失败」交给错误边界。
 *
 * 和 useQuery 的区别（区块一的状态表对照着看）：
 * - 组件里拿到的 data 类型不含 undefined：没数据时组件根本不会渲染，而是挂起（throw 一个 Promise）；
 * - 没有 enabled / placeholderData 选项：挂起模式下「不请求」和「先用占位数据」都说不通；
 * - 错误：默认只有「缓存里没有数据」时才抛给最近的错误边界；已经有数据的后台重取失败不会把界面换成错误页；
 * - 重试要配合 QueryErrorResetBoundary：错误边界 reset 时顺带告诉 Query「下次挂载时可以重新请求」。
 *
 * 这里自带 Suspense 与错误边界，不让外面的壳应用接管。错误边界用的是已安装的 react-error-boundary（20 题细讲），
 * Suspense 与 use(promise) 的完整内容在 32 题（待新增）。
 *
 * Vue 对照：vue/SuspenseStatsPanel.vue（Vue 的 <Suspense> 仍是实验性功能 + vue-query 的 suspense()）。
 */
import { Suspense } from 'react'
import { QueryErrorResetBoundary, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { ORDER_STATUS_TEXT } from '@/shared/types'
import { orderKeys, type OrdersDemo } from './ordersDemo'

export function SuspenseStatsPanel({ demo }: { demo: OrdersDemo }) {
  const queryClient = useQueryClient()

  // resetQueries：把这条查询恢复成「从没取过数据」的初始状态，并让正在使用它的组件重新请求 ——
  // 因为缓存里没有数据了，useSuspenseQuery 会再次挂起（看 fallback）；配合失败开关就能走到错误边界
  const resetStats = (fail: boolean) => {
    if (fail) demo.failNext('stats')
    void queryClient.resetQueries({ queryKey: orderKeys.stats() })
  }

  return (
    <div className="card stack">
      <h3>区块四：useSuspenseQuery —— pending 交给 Suspense，首次失败交给错误边界</h3>
      <p className="muted">
        「清空缓存重新加载」会先看到 fallback；「清空缓存并让请求失败」会走到错误边界，点「重试」恢复。
        标记订单为已支付后，这里的数字会在后台更新，但不会再闪 fallback（已经有数据了）。
        开发环境下，错误边界接住错误时 React 会用 console.error 报告一次（React 19 可以用 createRoot 的 onCaughtError 改写，20 题），这是预期的。
      </p>
      <div className="row">
        <button onClick={() => resetStats(false)}>清空缓存重新加载</button>
        <button className="btn-danger" onClick={() => resetStats(true)}>
          清空缓存并让请求失败
        </button>
      </div>

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ error, resetErrorBoundary }) => (
              <div className="row" role="alert">
                <span className="error-text">
                  统计加载失败（错误边界接住）：{error instanceof Error ? error.message : String(error)}
                </span>
                <button className="btn-primary" onClick={resetErrorBoundary}>
                  重试
                </button>
              </div>
            )}
          >
            <Suspense fallback={<p className="muted">统计加载中…（Suspense fallback）</p>}>
              <OrderStatsView demo={demo} />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </div>
  )
}

function OrderStatsView({ demo }: { demo: OrdersDemo }) {
  // data 的类型是 OrderStats（不含 undefined）：这里不需要 if (!data) return … 的分支
  const { data, isFetching } = useSuspenseQuery(demo.statsOptions())
  return (
    <p aria-label="订单统计">
      共 {data.total} 单：{ORDER_STATUS_TEXT.pending} {data.pending} · {ORDER_STATUS_TEXT.paid} {data.paid} ·{' '}
      {ORDER_STATUS_TEXT.cancelled} {data.cancelled}
      {isFetching && <span className="muted"> ⟳ 后台更新中</span>}
    </p>
  )
}
