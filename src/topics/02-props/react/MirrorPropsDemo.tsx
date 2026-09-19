/**
 * 区块三：不要把 props 复制进 state（「镜像」props）。
 * Vue 对照：vue/MirrorPropsDemo.vue、vue/PriceViews.vue、vue/PriceDraft.vue。
 */
import { useState } from 'react'

/**
 * 同一个 price，两种用法并排：
 * - ❌ useState(price)：初始值只在第一次渲染时读一次，之后父组件传来新的 price，这份 state 纹丝不动；
 * - ✅【最常用】直接用 price，要换算就在渲染时算（派生值，09 题）。
 */
function PriceViews({ price }: { price: number }) {
  // react.dev「Don't mirror props in state」：「The state is only initialized during the first render.」
  const [mirrored] = useState(price)
  const withTax = Math.round(price * 1.06)

  return (
    <ul className="stack">
      <li>
        ❌ useState(price) 镜像的值：<strong data-testid="mirrored">{mirrored}</strong>（停在第一次渲染时的值）
      </li>
      <li>
        ✅【最常用】直接读 price：<strong data-testid="direct">{price}</strong>；含税价在渲染时算：<strong data-testid="with-tax">{withTax}</strong>
      </li>
    </ul>
  )
}

/**
 * 【常用】真想「只取初始值、之后自己改」（例如编辑草稿）时，就是有意忽略后续更新 —— 把 prop 命名成 initialX / defaultX 说明意图。
 * react.dev：「By convention, start the prop name with initial or default to clarify that its new values are ignored」。
 * 需要按新的初始值重来时，父组件给它换一个 key：key 变了就是另一个组件实例，state 从头初始化（06 题）。
 */
function PriceDraft({ initialPrice }: { initialPrice: number }) {
  const [draft, setDraft] = useState(initialPrice)

  return (
    <div className="row">
      <span>
        【常用】草稿价（initialPrice 只取初始值）：<strong data-testid="draft">{draft}</strong>
      </span>
      <button onClick={() => setDraft((d) => d - 10)}>草稿 −10</button>
      <button onClick={() => setDraft((d) => d + 10)}>草稿 +10</button>
    </div>
  )
}

export function MirrorPropsDemo() {
  const [price, setPrice] = useState(100)
  const [draftKey, setDraftKey] = useState(0)

  return (
    <div className="card stack">
      <h3>区块三：不要把 props 复制进 state</h3>
      <div className="row">
        <span>
          父组件的 price：<strong>{price}</strong>
        </span>
        <button onClick={() => setPrice((p) => p + 10)}>父组件 price +10</button>
        <button onClick={() => setDraftKey((k) => k + 1)}>按当前 price 重开草稿（换 key）</button>
      </div>
      <PriceViews price={price} />
      <PriceDraft key={draftKey} initialPrice={price} />
    </div>
  )
}
