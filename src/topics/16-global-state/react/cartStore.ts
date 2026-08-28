/**
 * 题 16 的 Zustand store（React 侧全局状态）。
 *
 * 选型说明：Zustand 是目前 React 社区最主流的轻量全局状态方案之一——
 * Redux Toolkit 功能更全但更重（样板代码多、概念多），Context + useReducer 不用装库
 * 但样板多且有 Context 的整体重渲染问题（见 15 题）；本项目选 Zustand：API 极小、无 Provider、
 * 天生配 TypeScript，最贴近 Pinia 的使用手感。
 *
 * 什么时候不该用全局状态（判断标准，两个框架通用）：
 * 1) 只被一个组件树用的状态 → 放局部（useState / 状态提升到共同父组件就够了）；
 * 2) 服务端数据（列表、详情这类「远端的缓存」）→ 交给请求层（如 TanStack Query），不要塞进 store；
 * 3) 只有「跨页面 / 跨互不嵌套组件共享的客户端状态」（购物车、登录用户、全局偏好）才值得进全局 store。
 */
import { create } from 'zustand'
import type { CartItem, Product } from '@/shared/types'

/** store 的完整类型：state 和 actions 写在同一个接口里（Zustand 惯例） */
interface CartState {
  items: CartItem[]
  addToCart: (product: Product) => void
  increase: (id: string) => void
  decrease: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  /** 派生值：函数形式，调用时用 get() 现算（无缓存）——对比 Pinia 的 getter 见下方注释 */
  totalPrice: () => number
}

/**
 * create<CartState>()((set, get) => ({...}))：注意是「柯里化」的两层调用——
 * create<CartState>() 先固定 store 类型，再传创建函数；这是 Zustand 官方推荐写法，
 * 为了绕开 TypeScript 的推断限制（部分泛型参数无法只指定一个）。
 * 返回值 useCartStore 本身就是一个 Hook：不需要任何 Provider 包裹，import 即用——
 * Pinia 里对应 defineStore('cart', () => {...}) 返回的 useCartStore（但 Pinia 需要
 * app.use(createPinia())，本项目由桥接组件提供；Zustand 连这一步都没有）。
 */
export const useCartStore = create<CartState>()((set, get) => ({
  items: [],

  // set 的规矩和 useState 一样：必须不可变更新（新数组 / 新对象），
  // 且 set 是「浅合并」——返回 { items: ... } 只覆盖 items 字段，其余字段保留。
  // Pinia 里对应可以直接 exists.quantity += 1 / items.value.push(...)（响应式可变更新），
  // 这是两边最大的手感差异。
  addToCart: (product) =>
    set((state) => {
      const exists = state.items.find((it) => it.id === product.id)
      if (exists) {
        // 已在购物车：数量 +1（map 出新数组 + 新对象）
        return {
          items: state.items.map((it) =>
            it.id === product.id ? { ...it, quantity: it.quantity + 1 } : it,
          ),
        }
      }
      return {
        items: [
          ...state.items,
          { id: product.id, name: product.name, price: product.price, quantity: 1 },
        ],
      }
    }),

  increase: (id) =>
    set((state) => ({
      items: state.items.map((it) => (it.id === id ? { ...it, quantity: it.quantity + 1 } : it)),
    })),

  // 数量下限钳在 1：减到 1 后按钮会禁用，移除走单独的 remove
  decrease: (id) =>
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it,
      ),
    })),

  remove: (id) => set((state) => ({ items: state.items.filter((it) => it.id !== id) })),

  clear: () => set({ items: [] }),

  /**
   * 派生值的 Zustand 写法之一：store 里放函数，用 get() 拿最新 state 现算。
   * 注意它没有缓存——每次调用都重算（本例数据量小，无所谓）。
   * 另一种更常见的写法是「组件内直接算」（CartPanel 里的 totalCount 就是，见 Example.tsx）。
   * Pinia 里对应 getter（computed），自动依赖追踪 + 自动缓存——
   * Zustand 没有「带缓存的 getter」这个概念，两者没有一一对应关系。
   */
  totalPrice: () => get().items.reduce((sum, it) => sum + it.price * it.quantity, 0),
}))
