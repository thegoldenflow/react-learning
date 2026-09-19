/**
 * 区块三：key 不只用于列表 —— 给同一个组件换一个 key，就是换了一个实例：state 从头初始化、Effect 重新建立。
 * 【最常用】选中的对象变了、组件内部 state 要跟着重置时，<OrderNoteEditor key={selectedOrder.id} … />（02 题区块三、05 题区块三用的是同一个办法）。
 * ❌ 在 Effect 里监听 prop、再 setState 清空：官方「🔴 Avoid: Resetting state on prop change in an Effect」，先用旧值渲染一次再重来（10 题）。
 * Vue 对照：vue/KeyResetDemo.vue + vue/OrderNoteEditor.vue（:key 同样强制替换组件）。
 */
import { useState } from 'react'
import type { Order } from '@/shared/types'
import { INITIAL_ORDERS } from './demoData'

/**
 * 带内部 state 的子组件：草稿存在它自己的 state 里。它对「自己会不会被重置」一无所知，重置与否由父组件给不给 key 决定。
 * useState 的初始值只在这个实例挂载时算（StrictMode 开发环境会调两次初始化函数、其中一次的结果被忽略，03 题区块四），之后 props.order 再怎么变，draft 都不跟着变。
 */
function OrderNoteEditor({ order }: { order: Order }) {
  const [draft, setDraft] = useState(() => `${order.customer}的备注：`)
  // 只读的 state，当作「实例身份证」：记下这个实例是为哪个订单挂载的
  const [mountedFor] = useState(order.orderNo)
  const isFresh = mountedFor === order.orderNo

  return (
    <div className="stack">
      <span className="muted">
        当前 props.order：{order.orderNo}（{order.customer}）· 本实例挂载时的订单：{mountedFor}
      </span>
      <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="草稿备注" />
      <span className={isFresh ? 'success-text' : 'error-text'} data-testid="instance-status">
        {isFresh ? '新实例：草稿按新订单重新初始化' : `被复用的实例：草稿还是 ${mountedFor} 的`}
      </span>
    </div>
  )
}

export function KeyResetDemo() {
  const [selectedId, setSelectedId] = useState(INITIAL_ORDERS[0].id)
  // 选中的订单由 id 算出来，不另存一份（03 题区块五、09 题）
  const selectedOrder = INITIAL_ORDERS.find((o) => o.id === selectedId) ?? INITIAL_ORDERS[0]

  return (
    <div className="card stack">
      <h3>区块三：换 key = 换一个实例，内部 state 重置</h3>
      <p className="muted">在两个草稿框里都改点内容，再切换订单：左边还是上一个订单的草稿，右边重新初始化。</p>
      <p className="muted">【最常用】prop 变了、组件内部 state 要从头来：给组件换 key。</p>
      <div className="row">
        {INITIAL_ORDERS.map((o) => (
          <button key={o.id} className={o.id === selectedId ? 'btn-primary' : undefined} onClick={() => setSelectedId(o.id)}>
            {o.orderNo}
          </button>
        ))}
      </div>
      <div className="row" style={{ alignItems: 'stretch' }}>
        <div className="card stack" style={{ flex: '1 1 280px' }} data-testid="without-key">
          <strong className="error-text">❌ 不换 key：同一位置、同一类型 → 复用实例，state 残留</strong>
          <code>{'<OrderNoteEditor order={selectedOrder} />'}</code>
          <OrderNoteEditor order={selectedOrder} />
        </div>
        <div className="card stack" style={{ flex: '1 1 280px' }} data-testid="with-key">
          <strong className="success-text">✅ 换 key：key 变了 → 卸载旧实例、挂载新实例</strong>
          <code>{'<OrderNoteEditor key={selectedOrder.id} order={selectedOrder} />'}</code>
          <OrderNoteEditor key={selectedOrder.id} order={selectedOrder} />
        </div>
      </div>
      <p className="muted">
        别滥用：key 一变整棵子树都重建 —— 滚动位置、焦点、子组件里的 Effect（重新请求）都会重来。只在「它确实该变成另一个东西」时用；
        如果那份 state 能由 props 算出来，干脆不存（09 题）；父组件也要读它，就提升到父组件（25 题）。
      </p>
    </div>
  )
}
