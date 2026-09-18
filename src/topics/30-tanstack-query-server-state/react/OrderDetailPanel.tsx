/**
 * 区块三：依赖查询（enabled）—— 选中一行才请求详情。
 *
 * 官方 dependent-queries 页的写法就是 enabled：条件不满足时查询「挂着」不执行。
 * 这时 status 是 'pending'（还没有数据），fetchStatus 是 'idle'（没在请求）——
 * 所以 isPending 为 true、isLoading 为 false：拿 isPending 当「正在加载」会一直转圈，
 * 这正是 v5 把「首次加载中」单独叫 isLoading（= isPending && isFetching）的原因。
 *
 * Vue 对照：vue/OrderDetailPanel.vue（enabled 可以传 getter / computed，库自动追踪）。
 */
import { useQuery } from '@tanstack/react-query'
import { ORDER_STATUS_TEXT } from '@/shared/types'
import { QueryStatusTable } from './OrdersListPanel'
import type { OrdersDemo } from './ordersDemo'

interface Props {
  demo: OrdersDemo
  selectedId: string | null
  onClear: () => void
}

export function OrderDetailPanel({ demo, selectedId, onClear }: Props) {
  // detailOptions 里已经写了 enabled: id !== null；key 里带着 id，选中别的行就是换一条缓存
  const detail = useQuery(demo.detailOptions(selectedId))

  return (
    <div className="card stack">
      <h3>区块三：依赖查询 —— enabled 为 false 时是 pending + idle</h3>
      <p className="muted">
        先看没选中时的状态：pending 但 idle，isLoading 为 false。点上面表格里的任意一行，这里才发请求；
        标记为已支付之后，失效 ['orders'] 也会让这条详情重取。
      </p>
      <QueryStatusTable
        label="详情查询的状态"
        fields={{
          selectedId: selectedId ?? 'null',
          status: detail.status,
          fetchStatus: detail.fetchStatus,
          isPending: detail.isPending,
          isLoading: detail.isLoading,
          isFetching: detail.isFetching,
        }}
      />

      {selectedId === null && <p className="muted">还没有选中订单（查询没有执行）</p>}
      {detail.isLoading && <p className="muted">详情加载中…</p>}
      {detail.isError && (
        <p className="error-text" role="alert">
          详情加载失败：{detail.error.message}
        </p>
      )}
      {detail.data && (
        <div className="stack">
          <div className="row">
            <strong>{detail.data.orderNo}</strong>
            <span>{detail.data.customer}</span>
            <span>￥{detail.data.amount}</span>
            <span className={`badge badge-${detail.data.status}`}>{ORDER_STATUS_TEXT[detail.data.status]}</span>
            {detail.isFetching && <span className="muted">⟳ 后台重取中</span>}
          </div>
          <ul>
            {detail.data.items.map((item) => (
              <li key={item.id}>
                {item.name} × {item.quantity}（￥{item.price}）
              </li>
            ))}
          </ul>
          <button className="btn-ghost" onClick={onClear}>
            取消选中
          </button>
        </div>
      )}
    </div>
  )
}
