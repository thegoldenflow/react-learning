/**
 * 区块四【主流】：createStore（不带 Hook 的 vanilla store）+ Context —— 每个组件实例 / 每个请求各一份 store。
 *
 * 什么时候不用模块级的 create()，改用这种写法：
 * 1. 服务端渲染（Next.js 等）：模块级 store 在同一个 Node 进程里被所有请求共享，A 用户的数据会漏给 B 用户；
 *    要在组件树里为每个请求创建一份（33 题，待新增）。Pinia 同理：服务端每个请求 createPinia()。
 * 2. 要用 props 初始化 store（初始值来自服务端数据或父组件）。
 * 3. 同一个组件在页面上出现多次，每份要有自己的状态（下面两个「清单」就是这种情况）。
 * 写法：createStore 建 store；用 useState(() => createStore(...)) 保证每个实例只建一次；放进 Context；
 * 读的时候用 zustand 导出的 useStore(store, selector)。create() 返回的 Hook 内部调用的就是它（zustand esm/react.mjs:16），
 * 所以 selector、useShallow 的规矩两边相同。
 */
import { createContext, useContext, useState, type ReactNode } from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'
import type { CartItem, Product } from '@/shared/types'
import { DEMO_PRODUCTS } from './CartDemo'

interface ListState {
  items: CartItem[]
  add: (product: Product) => void
  clear: () => void
}

/** 工厂函数：每调用一次就是一份新的 store（createStore 返回 StoreApi，没有 Hook） */
function createListStore(initialItems: CartItem[]) {
  return createStore<ListState>()((set) => ({
    items: initialItems,
    add: (product) =>
      set((state) => {
        if (state.items.some((it) => it.id === product.id)) {
          return { items: state.items.map((it) => (it.id === product.id ? { ...it, quantity: it.quantity + 1 } : it)) }
        }
        return { items: [...state.items, { id: product.id, name: product.name, price: product.price, quantity: 1 }] }
      }),
    clear: () => set({ items: [] }),
  }))
}

const ListStoreContext = createContext<StoreApi<ListState> | null>(null)

function ListScope({ initialItems, children }: { initialItems: CartItem[]; children: ReactNode }) {
  // 惰性初始化：只在第一次渲染时建 store。之后 initialItems 再变也不会重建（和 useState 的初始值同一个规矩）；
  // 真要按新 props 重置，就在外面换 key（换 key 重置 state 见 06 题，18 题的路由参数也用到）
  const [store] = useState(() => createListStore(initialItems))
  return <ListStoreContext value={store}>{children}</ListStoreContext>
}

function useListStore<T>(selector: (state: ListState) => T): T {
  const store = useContext(ListStoreContext)
  if (!store) throw new Error('useListStore 必须在 <ListScope> 里面使用')
  return useStore(store, selector)
}

function ListView({ title }: { title: string }) {
  const items = useListStore((s) => s.items)
  const add = useListStore((s) => s.add)
  const clear = useListStore((s) => s.clear)
  const count = items.reduce((sum, it) => sum + it.quantity, 0)
  return (
    <div className="card stack" aria-label={title}>
      <div className="row">
        <strong>{title}</strong>
        <span className="badge">{count} 件</span>
        <button onClick={clear} disabled={count === 0}>
          清空
        </button>
      </div>
      <div className="row">
        {DEMO_PRODUCTS.slice(2).map((p) => (
          <button key={p.id} onClick={() => add(p)}>
            + {p.name}
          </button>
        ))}
      </div>
      <p className="muted">{items.length === 0 ? '（空）' : items.map((it) => `${it.name} × ${it.quantity}`).join('、')}</p>
    </div>
  )
}

const WISHLIST_INITIAL: CartItem[] = [{ id: 'p3', name: '降噪耳机', price: 899, quantity: 1 }]

export function ScopedStoreDemo() {
  return (
    <div className="card stack">
      <h3>区块四：createStore + Context —— 每个实例一份 store（服务端渲染、按 props 初始化）</h3>
      <p className="muted">
        两个清单用的是同一段组件代码，但各自 useState 建了一份 store：在一个里加东西，另一个不受影响。
        「稍后再买」的初始内容来自 props。区块一的 useCartStore 是模块级单例，整个页面只有一份。
      </p>
      <div className="row">
        <ListScope initialItems={[]}>
          <ListView title="清单 A（初始为空）" />
        </ListScope>
        <ListScope initialItems={WISHLIST_INITIAL}>
          <ListView title="清单 B：稍后再买（props 初始化）" />
        </ListScope>
      </div>
    </div>
  )
}
