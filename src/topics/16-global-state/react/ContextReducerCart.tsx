/**
 * 区块三【并排 · React 内置方案】：Context + useReducer 做一个同样的小购物车，和区块一比「谁会重渲染」。
 * 写法照 react.dev「Scaling Up with Reducer and Context」：state 和 dispatch 放进两个 Context，再各包一个自定义 Hook。
 * 前置：15 题（Context）、29 题（useReducer 与 action 类型）。
 * Vue 对照：vue/ReactiveStoreDemo.vue（Vue 内置的最小方案：模块级 reactive）。
 */
import { createContext, memo, useContext, useReducer, useState, type Dispatch, type ReactNode } from 'react'
import type { CartItem, Product } from '@/shared/types'
import { DEMO_PRODUCTS } from './CartDemo'
import { Counted, createRenderCounts, RenderCountsPanel } from './renderCounts'

interface LocalCartState {
  items: CartItem[]
  giftWrap: boolean
}

type CartAction =
  | { type: 'added'; product: Product }
  | { type: 'removed'; id: string }
  | { type: 'giftWrapToggled' }

function cartReducer(state: LocalCartState, action: CartAction): LocalCartState {
  switch (action.type) {
    case 'added': {
      const exists = state.items.some((it) => it.id === action.product.id)
      const items = exists
        ? state.items.map((it) => (it.id === action.product.id ? { ...it, quantity: it.quantity + 1 } : it))
        : [...state.items, { id: action.product.id, name: action.product.name, price: action.product.price, quantity: 1 }]
      return { ...state, items }
    }
    case 'removed':
      return { ...state, items: state.items.filter((it) => it.id !== action.id) }
    case 'giftWrapToggled':
      return { ...state, giftWrap: !state.giftWrap }
  }
}

// 两个 Context（官方教程的结构：一个放 state、一个放 dispatch）。顺带的好处：只读 dispatch 的组件（商品按钮）
// 不会因为 state 变化而重渲染 —— useReducer 参考页：「The dispatch function has a stable identity」，这个 Context 的 value
// 在 Provider 存活期间一直是同一个函数。注意教程本身是把拆分当成结构讲的，「省渲染」是由此推出的结论（测试覆盖）
const CartStateContext = createContext<LocalCartState | null>(null)
const CartDispatchContext = createContext<Dispatch<CartAction> | null>(null)

function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], giftWrap: false })
  // React 19 起直接渲染 <Context value>【主流·19.0 起】；<Context.Provider> 是旧写法（八）
  return (
    <CartStateContext value={state}>
      <CartDispatchContext value={dispatch}>{children}</CartDispatchContext>
    </CartStateContext>
  )
}

// 包成自定义 Hook：调用方不用知道有两个 Context，漏了 Provider 时给出清楚的报错
function useCartState() {
  const state = useContext(CartStateContext)
  if (!state) throw new Error('useCartState 必须在 <CartProvider> 里面使用')
  return state
}

function useCartDispatch() {
  const dispatch = useContext(CartDispatchContext)
  if (!dispatch) throw new Error('useCartDispatch 必须在 <CartProvider> 里面使用')
  return dispatch
}

function CtxProductList() {
  const dispatch = useCartDispatch()
  return (
    <div className="row">
      {DEMO_PRODUCTS.slice(0, 2).map((p) => (
        <button key={p.id} className="btn-primary" onClick={() => dispatch({ type: 'added', product: p })}>
          加入「{p.name}」
        </button>
      ))}
    </div>
  )
}

/**
 * 包了 memo 也没用：只要 CartStateContext 的 value 变了（哪怕只改了 giftWrap），读它的组件都会重渲染。
 * useContext 页原文：「Skipping re-renders with memo does not prevent the children receiving fresh context values」。
 * Context 没有 selector —— 这是它和 Zustand / Redux 最大的差别。
 */
const CtxCountBadge = memo(function CtxCountBadge() {
  const { items } = useCartState()
  const count = items.reduce((sum, it) => sum + it.quantity, 0)
  return <span className="badge">件数（memo 包着）：{count}</span>
})

function CtxGiftWrap() {
  const { giftWrap } = useCartState()
  const dispatch = useCartDispatch()
  return (
    <label className="row">
      <input type="checkbox" checked={giftWrap} onChange={() => dispatch({ type: 'giftWrapToggled' })} />
      礼品包装
    </label>
  )
}

function CtxCartList() {
  const { items } = useCartState()
  const dispatch = useCartDispatch()
  if (items.length === 0) return <p className="muted">（这个购物车是 CartProvider 里的局部 state，和区块一的 store 无关）</p>
  return (
    <div className="row">
      {items.map((it) => (
        <span key={it.id} className="badge">
          {it.name} × {it.quantity}{' '}
          <button onClick={() => dispatch({ type: 'removed', id: it.id })} aria-label={`从 Context 购物车移除${it.name}`}>
            ×
          </button>
        </span>
      ))}
    </div>
  )
}

const COUNT_ENTRIES: Array<[string, string]> = [
  ['CtxProductList', '商品按钮（只读 dispatch）'],
  ['CtxCountBadge', '件数（memo）'],
  ['CtxGiftWrap', '礼品包装'],
  ['CtxCartList', '购物车列表'],
]

export function ContextReducerCart() {
  const [counts] = useState(createRenderCounts)
  return (
    <div className="card stack">
      <h3>区块三：Context + useReducer（React 内置方案，并排）</h3>
      <p className="muted">
        勾选「礼品包装」：件数徽标没变，却照样重渲染（memo 也挡不住）；只读 dispatch 的商品按钮始终不动。
        对照区块一：Zustand 的合计组件用 selector 只订阅件数和金额，礼品包装变化时不重渲染。
      </p>
      <CartProvider>
        <Counted id="CtxProductList" counts={counts}>
          <CtxProductList />
        </Counted>
        <div className="row">
          <Counted id="CtxCountBadge" counts={counts}>
            <CtxCountBadge />
          </Counted>
          <Counted id="CtxGiftWrap" counts={counts}>
            <CtxGiftWrap />
          </Counted>
        </div>
        <Counted id="CtxCartList" counts={counts}>
          <CtxCartList />
        </Counted>
      </CartProvider>
      <RenderCountsPanel counts={counts} entries={COUNT_ENTRIES} label="区块三渲染次数" />
    </div>
  )
}
