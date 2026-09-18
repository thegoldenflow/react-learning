/**
 * 区块一【主线】：Zustand 5 购物车 —— selector 决定谁重渲染。
 * 五个组件互不嵌套、没有任何 props 往来，只通过 useCartStore 打交道；每个组件套一个 <Profiler> 数渲染次数。
 * Vue 对照：vue/ProductList.vue、CartPanel.vue、CartSummary.vue、GiftWrapToggle.vue、WholeStoreBadge.vue。
 */
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { Product } from '@/shared/types'
import { selectTotalCount, selectTotalPrice, useCartStore } from './cartStore'
import { Counted, createRenderCounts, RenderCountsPanel } from './renderCounts'

export const DEMO_PRODUCTS: Product[] = [
  { id: 'p1', name: '机械键盘', price: 399, category: '外设', stock: 12 },
  { id: 'p2', name: '无线鼠标', price: 149, category: '外设', stock: 20 },
  { id: 'p3', name: '降噪耳机', price: 899, category: '音频', stock: 8 },
  { id: 'p4', name: '4K 显示器', price: 1999, category: '显示', stock: 5 },
]

function ProductList() {
  // 只选 addToCart：action 在创建 store 时定义，之后引用不变（前提：没人用 set(x, true) / setState 把它换掉），
  // 所以购物车怎么变，这个组件都不重渲染。Vue 侧不需要这一步：模板没读 state，就不依赖 state。
  const addToCart = useCartStore((s) => s.addToCart)
  return (
    <div className="stack">
      <strong>商品列表（只选了 addToCart）</strong>
      {DEMO_PRODUCTS.map((p) => (
        <div key={p.id} className="row">
          <span>{p.name}</span>
          <span className="muted">￥{p.price.toFixed(2)}</span>
          <button className="btn-primary" onClick={() => addToCart(p)}>
            加入购物车
          </button>
        </div>
      ))}
    </div>
  )
}

function CartPanel() {
  // 选原子值：items 变了才重渲染（礼品包装变化时 items 引用不变，本组件不动）
  const items = useCartStore((s) => s.items)
  // 一次取多个值时 selector 返回新对象：必须包 useShallow（逐个比较对象的第一层属性）。
  // 不包的话，每次 getSnapshot 都是新对象，zustand 5 会陷入无限更新（Example.test.tsx 有这条的测试）
  const { increase, decrease, remove } = useCartStore(
    useShallow((s) => ({ increase: s.increase, decrease: s.decrease, remove: s.remove })),
  )

  return (
    <div className="stack">
      <strong>购物车（选了 items + 三个 action）</strong>
      {items.length === 0 ? (
        <p className="muted">购物车是空的，从上面加点什么吧。</p>
      ) : (
        items.map((it) => (
          <div key={it.id} className="row">
            <span>{it.name}</span>
            <span className="muted">￥{it.price.toFixed(2)}</span>
            <button onClick={() => decrease(it.id)} disabled={it.quantity <= 1} aria-label={`${it.name} 数量减一`}>
              -
            </button>
            <span>{it.quantity}</span>
            <button onClick={() => increase(it.id)} aria-label={`${it.name} 数量加一`}>
              +
            </button>
            <button className="btn-danger" onClick={() => remove(it.id)}>
              移除
            </button>
          </div>
        ))
      )}
    </div>
  )
}

function CartSummary() {
  // 派生值用 store 外的选择器函数算；两个数字放进一个对象返回，所以同样要 useShallow。
  // 只改礼品包装时两个数字都没变，useShallow 返回上一次的对象，组件不重渲染
  const { count, total } = useCartStore(
    useShallow((s) => ({ count: selectTotalCount(s), total: selectTotalPrice(s) })),
  )
  const clear = useCartStore((s) => s.clear)
  return (
    <div className="row">
      <span>
        合计 {count} 件，<strong>￥{total.toFixed(2)}</strong>
      </span>
      <button className="btn-danger" onClick={clear} disabled={count === 0}>
        清空
      </button>
    </div>
  )
}

function GiftWrapToggle() {
  const giftWrap = useCartStore((s) => s.giftWrap)
  const setGiftWrap = useCartStore((s) => s.setGiftWrap)
  return (
    <label className="row">
      <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} />
      礼品包装（和购物车条目无关的字段）
    </label>
  )
}

function WholeStoreBadge() {
  // ❌ 反例：不传 selector 就订阅整个 store。任何字段变化（包括礼品包装、结算状态）都会让它重渲染，
  // 哪怕它只用到了件数。Vue 里对应「模板读了整个 $state」（vue/WholeStoreBadge.vue）
  const state = useCartStore()
  return <span className="badge">徽标（订阅整个 store）：{selectTotalCount(state)} 件</span>
}

const COUNT_ENTRIES: Array<[string, string]> = [
  ['ProductList', '商品列表'],
  ['CartPanel', '购物车'],
  ['CartSummary', '合计'],
  ['GiftWrapToggle', '礼品包装'],
  ['WholeStoreBadge', '整店徽标（反例）'],
]

export function CartDemo() {
  // 计数器随本区块创建一次；本组件自己没有别的 state，所以不会因为父组件重渲染而连带子组件
  const [counts] = useState(createRenderCounts)
  return (
    <div className="card stack">
      <h3>区块一：Zustand 5 购物车 —— selector 决定谁重渲染（主线）</h3>
      <p className="muted">
        先点「计数清零」，再分别试：加入购物车（商品列表不动）、勾选礼品包装（只有它自己和「订阅整个 store」的徽标会动）、
        在数量为 1 时点不了「-」（action 返回原 state 时 set 不通知任何人）。离开本题再回来，购物车还在：store 是模块级单例；
        刷新页面也还在：persist 中间件存进了 localStorage（区块二可以查看和清除）。
      </p>
      <Counted id="ProductList" counts={counts}>
        <ProductList />
      </Counted>
      <Counted id="CartPanel" counts={counts}>
        <CartPanel />
      </Counted>
      <Counted id="CartSummary" counts={counts}>
        <CartSummary />
      </Counted>
      <div className="row">
        <Counted id="GiftWrapToggle" counts={counts}>
          <GiftWrapToggle />
        </Counted>
        <Counted id="WholeStoreBadge" counts={counts}>
          <WholeStoreBadge />
        </Counted>
      </div>
      <RenderCountsPanel counts={counts} entries={COUNT_ENTRIES} label="区块一渲染次数" />
    </div>
  )
}
