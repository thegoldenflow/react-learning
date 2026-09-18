/**
 * 区块五：state 的结构 —— 别存重复的数据（存 id，不存对象副本）、别让几个 state 互相矛盾（多个布尔值 → 一个 status）。
 * react.dev choosing-the-state-structure 五条原则里最常踩的两条（Avoid duplication、Avoid contradictions）；另外三条（Group related state、Avoid redundant state、
 * Avoid deeply nested state）见 Example.tsx 二-10。
 * Vue 对照：vue/StateStructureDemo.vue（Vue 里存同一个响应式对象，原地修改时不会过期，列表整体换新时同样过期，所以照样推荐存 id）。
 */
import { useState } from 'react'

interface Product {
  id: string
  name: string
  quantity: number
}

const PRODUCTS: Product[] = [
  { id: 'p1', name: '机械键盘', quantity: 1 },
  { id: 'p2', name: '无线鼠标', quantity: 2 },
]

/**
 * 同一份「选中了哪件商品」，两种存法：
 * - ❌ selectedItem：把对象本身存进另一个 state。items 更新时造的是新对象，selectedItem 还指着旧的那个 —— 详情停在选中那一刻；
 * - ✅ selectedId：只存 id，详情在渲染时从 items 里找（派生）。数据只有一份，只要 id 稳定，改了哪里都对得上（选中项被删掉时查到 null，显示未选中）。
 * react.dev：「the contents of the selectedItem is the same object as one of the items inside the items list. This means that the information about the item itself
 * is duplicated in two places.」（出自 choosing-the-state-structure 的 Avoid duplication in state 一节；结论见 Example.tsx 二-10）
 */
function SelectionDemo() {
  const [items, setItems] = useState(PRODUCTS)
  const [selectedItem, setSelectedItem] = useState<Product | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((item) => item.id === selectedId) ?? null

  function select(item: Product) {
    setSelectedItem(item)
    setSelectedId(item.id)
  }

  function addOne(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)))
  }

  return (
    <div className="stack">
      <h4>1）别存重复的数据：存 id，不存对象</h4>
      {items.map((item) => (
        <div key={item.id} className="row">
          <span>
            {item.name} × {item.quantity}
          </span>
          <button onClick={() => select(item)}>选中</button>
          <button onClick={() => addOne(item.id)}>+1</button>
        </div>
      ))}
      <ul className="stack">
        <li data-testid="selected-by-object">
          ❌ 存对象 selectedItem：{selectedItem ? `${selectedItem.name} × ${selectedItem.quantity}` : '（未选中）'}
        </li>
        <li data-testid="selected-by-id">✅ 存 id、渲染时查找：{selected ? `${selected.name} × ${selected.quantity}` : '（未选中）'}</li>
      </ul>
    </div>
  )
}

/**
 * ❌ 两个布尔值描述一件事：isSending 和 isSent 本不该同时为 true，但结构上允许，只要某处忘了同步改另一个，界面就出现「不可能的状态」。
 * 这里的 bug 很典型：再次发送时只设了 isSending = true，忘了把 isSent 改回 false。
 */
function SendWithBooleans() {
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  function send() {
    setIsSending(true) // 忘了 setIsSent(false)
  }

  function serverReplied() {
    setIsSending(false)
    setIsSent(true)
  }

  return (
    <div className="row" data-testid="send-booleans">
      <strong>❌ 两个布尔值</strong>
      <button onClick={send}>发送</button>
      <button disabled={!isSending} onClick={serverReplied}>
        模拟服务器返回
      </button>
      {isSending && <span>发送中…</span>}
      {isSent && <span className="success-text">已发送 ✓</span>}
    </div>
  )
}

/**
 * ✅ 一个 status：取值只有三种合法组合，「发送中且已发送」在类型上就写不出来。
 * 需要布尔值时从 status 派生（const isSending = status === 'sending'），不另外存。
 * 这种字面量联合在 TypeScript 里要显式写泛型：useState<SendStatus>('typing')，否则会被推断成 string。
 */
type SendStatus = 'typing' | 'sending' | 'sent'

function SendWithStatus() {
  const [status, setStatus] = useState<SendStatus>('typing')
  const isSending = status === 'sending'
  const isSent = status === 'sent'

  return (
    <div className="row" data-testid="send-status">
      <strong>✅ 一个 status</strong>
      <button onClick={() => setStatus('sending')}>发送</button>
      <button disabled={!isSending} onClick={() => setStatus('sent')}>
        模拟服务器返回
      </button>
      {isSending && <span>发送中…</span>}
      {isSent && <span className="success-text">已发送 ✓</span>}
    </div>
  )
}

export function StateStructureDemo() {
  return (
    <div className="card stack">
      <h3>区块五：state 的结构 —— 别重复、别矛盾</h3>
      <SelectionDemo />
      <div className="stack">
        <h4>2）别让几个 state 互相矛盾：多个布尔值 → 一个 status</h4>
        <p className="muted">两边都按「发送 → 模拟服务器返回 → 发送」点一遍。</p>
        <SendWithBooleans />
        <SendWithStatus />
      </div>
    </div>
  )
}
