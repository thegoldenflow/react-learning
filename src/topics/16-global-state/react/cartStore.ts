/**
 * 16 题【主线】Zustand 5 的购物车 store（React 侧全局状态）。
 * 区块一、二都用它；Vue 对照是 vue/cartStore.ts（Pinia setup store）。
 *
 * 这个 store 按「生产形态」写，但仍有演示简化（Example.tsx 七）：
 * - devtools 中间件：装了 Redux DevTools 浏览器扩展就能看到每个 action；没装时它什么也不做
 *   （zustand 5.0.15 esm/middleware.mjs:67-68 直接 return fn(set, get, api)），开发环境默认开启、生产构建默认关闭（:64）。
 * - persist 中间件：只持久化白名单字段（partialize），带 version + migrate。actions 与结算状态不落盘。
 * - 异步 action：checkout 里 await 之后再 set；「正在结算时再调一次」用 get() 读当前值挡住。
 * - 单 store：业务变大后按领域拆 slices（Example.tsx 七有写法）。
 *
 * 【主流】写法要点（依据见 Example.tsx 二）：
 * - create<CartState>()(...)：先固定类型、再传创建函数的「柯里化」两层调用；返回值 useCartStore 本身就是 Hook，
 *   同时挂着 getState / setState / subscribe / getInitialState（zustand esm/react.mjs:14-18 用 Object.assign 挂上去）。
 * - set 默认浅合并：返回 { items } 只替换 items，其余字段保留（esm/vanilla.mjs:8 的 Object.assign({}, state, nextState)）；
 *   set(x, true) 是整体替换，会连 actions 一起换掉（README 原文见 Example.tsx 二-4）。
 * - set 前先用 Object.is 比较（esm/vanilla.mjs:6）：函数返回原来的 state 对象，就不会通知任何订阅者。
 * - state 仍要不可变更新（新数组 / 新对象）：selector 靠 Object.is 判断「变没变」，原地修改的对象引用不变，组件不会更新（21 题）。
 */
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/shared/types'

/** 结算请求的状态：判别联合，和 11 / 19 题的请求状态建模同一个思路 */
export type CheckoutState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; orderNo: string }
  | { status: 'error'; message: string }

export interface CheckoutOptions {
  /** 模拟接口延迟（页面上几百毫秒方便观察，测试里很短） */
  delayMs?: number
  /** 演示开关：这一次结算必定失败（代替随机失败，结果可复现） */
  fail?: boolean
}

/** store 的完整类型：state 和 actions 写在同一个接口里（Zustand 惯例，actions 也是 state 的一部分） */
export interface CartState {
  items: CartItem[]
  /** 是否礼品包装：和购物车条目无关的另一个字段，用来观察「只改它时，谁会重渲染」 */
  giftWrap: boolean
  checkout: CheckoutState
  addToCart: (product: Product) => void
  increase: (id: string) => void
  decrease: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  setGiftWrap: (value: boolean) => void
  checkoutCart: (options?: CheckoutOptions) => Promise<void>
}

/** 持久化的白名单：只存这两个字段 */
export type PersistedCart = Pick<CartState, 'items' | 'giftWrap'>

/** localStorage 的键。Vue 侧用另一个键（topic16-cart-vue），两边互不干扰 */
export const CART_STORAGE_KEY = 'topic16-cart'
/** 持久化数据的版本号：数据结构有破坏性变化时加 1，并在 migrate 里把旧数据转成新结构 */
export const CART_STORAGE_VERSION = 1

/* ------------------------- 模拟结算接口（演示简化） ------------------------- */

let checkoutRequestCount = 0

/** 服务端累计收到几次结算请求：页面和测试用它证明「同一轮调用两次只发一次请求」 */
export function getCheckoutRequestCount() {
  return checkoutRequestCount
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** 演示简化：真实项目是 POST /api/orders，服务端按购物车重新计价并做幂等（19 题） */
async function mockCheckoutApi(itemCount: number, { delayMs = 600, fail = false }: CheckoutOptions = {}) {
  checkoutRequestCount += 1
  const requestNo = checkoutRequestCount
  await wait(delayMs)
  if (fail) throw new Error('网络错误：结算失败，请重试')
  return { orderNo: `CO-${String(requestNo).padStart(4, '0')}（${itemCount} 件）` }
}

/* ------------------------------- 选择器 ------------------------------- */

/**
 * 派生值写成 store 外的「选择器函数」：组件里 useCartStore(selectTotalCount)。
 * 返回原始值（number），Object.is 比较稳定：礼品包装这类无关字段变化时，结果相同，组件不重渲染。
 * 和 Pinia getter 的区别：Pinia getter 是 computed，有缓存；这里每次 store 变化都会重算一遍（便宜的计算无所谓，
 * 昂贵的计算可以在组件里 useMemo，或者把结果本身存进 store）。
 */
export const selectTotalCount = (s: CartState) => s.items.reduce((sum, it) => sum + it.quantity, 0)
export const selectTotalPrice = (s: CartState) => s.items.reduce((sum, it) => sum + it.price * it.quantity, 0)

/* -------------------------------- store -------------------------------- */

export const useCartStore = create<CartState>()(
  // 中间件从外到内：devtools 放最外层（官方 TypeScript 指南建议最后套 devtools，见 Example.tsx 二-8）
  devtools(
    persist(
      (set, get) => ({
        items: [],
        giftWrap: false,
        checkout: { status: 'idle' },

        // set 的第三个参数是 devtools 里显示的 action 名（只有套了 devtools 才有这个参数）
        addToCart: (product) =>
          set(
            (state) => {
              const exists = state.items.some((it) => it.id === product.id)
              if (exists) {
                return {
                  items: state.items.map((it) => (it.id === product.id ? { ...it, quantity: it.quantity + 1 } : it)),
                }
              }
              const item: CartItem = { id: product.id, name: product.name, price: product.price, quantity: 1 }
              return { items: [...state.items, item] }
            },
            undefined,
            'cart/addToCart',
          ),

        increase: (id) =>
          set(
            (state) => ({
              items: state.items.map((it) => (it.id === id ? { ...it, quantity: it.quantity + 1 } : it)),
            }),
            undefined,
            'cart/increase',
          ),

        // 数量下限是 1（移除走 remove）。已经是 1 时返回原 state 对象：set 发现 Object.is 相同，不通知任何订阅者
        decrease: (id) =>
          set(
            (state) => {
              const target = state.items.find((it) => it.id === id)
              if (!target || target.quantity <= 1) return state
              return { items: state.items.map((it) => (it.id === id ? { ...it, quantity: it.quantity - 1 } : it)) }
            },
            undefined,
            'cart/decrease',
          ),

        remove: (id) => set((state) => ({ items: state.items.filter((it) => it.id !== id) }), undefined, 'cart/remove'),

        clear: () => set({ items: [] }, undefined, 'cart/clear'),

        setGiftWrap: (value) => set({ giftWrap: value }, undefined, 'cart/setGiftWrap'),

        /**
         * 异步 action【主流】：Zustand 不区分同步 / 异步，await 之后再 set 就行（README「Async actions」）。
         * get() 读的是调用这一刻的最新 state（不是某次渲染的快照）：set 是同步生效的，
         * 所以同一轮里连调两次，第二次就能看到 'pending' 并直接返回 —— 不需要 19 题那样的 useRef 锁。
         * 演示简化：提交请求本身在生产里常交给 TanStack Query 的 useMutation（30 题），store 只在成功后 clear()。
         */
        checkoutCart: async (options) => {
          const { items, checkout } = get()
          if (checkout.status === 'pending' || items.length === 0) return
          set({ checkout: { status: 'pending' } }, undefined, 'cart/checkout/pending')
          try {
            const { orderNo } = await mockCheckoutApi(selectTotalCount(get()), options)
            set({ items: [], checkout: { status: 'success', orderNo } }, undefined, 'cart/checkout/success')
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            set({ checkout: { status: 'error', message } }, undefined, 'cart/checkout/error')
          }
        },
      }),
      {
        name: CART_STORAGE_KEY,
        // 不写 storage 时默认就是 createJSONStorage(() => localStorage)；写出来是为了看清楚存在哪（换 sessionStorage 改这里）
        storage: createJSONStorage(() => localStorage),
        // 白名单：结算状态是一次性的界面状态，刷新后不该还显示「结算中」；actions 是函数，本来也序列化不了
        partialize: (state): PersistedCart => ({ items: state.items, giftWrap: state.giftWrap }),
        version: CART_STORAGE_VERSION,
        /**
         * 存储里的版本号和 version 不一致时调用（没写 migrate 的话，旧数据直接不用，并 console.error）。
         * 演示：假设 v0 的条目字段叫 qty、没有 giftWrap，v1 改成 quantity。
         * 生产注意：localStorage 里的东西不可信（旧版本写的、用户手改的），反序列化后最好用 zod 之类校验一遍。
         */
        migrate: (persisted, version): PersistedCart => {
          if (version === 0) {
            const old = persisted as { items?: Array<Omit<CartItem, 'quantity'> & { qty?: number }> }
            return {
              items: (old.items ?? []).map(({ qty, ...rest }) => ({ ...rest, quantity: qty ?? 1 })),
              giftWrap: false,
            }
          }
          return persisted as PersistedCart
        },
      },
    ),
    { name: 'topic16-cart' },
  ),
)
