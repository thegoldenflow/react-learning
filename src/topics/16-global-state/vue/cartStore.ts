/**
 * 16 题 Vue 侧的 Pinia store（setup store 写法），对照 react/cartStore.ts（Zustand）。
 *
 * - setup store：ref() 成为 state、computed() 成为 getter、function 成为 action；state 必须全部 return 出去
 *   （Pinia 要靠它做 devtools、服务端渲染序列化和插件），所以 setup store 里不能有「私有 state」。
 *   另一种写法 option store（{ state, getters, actions }）更好上手；setup store 更灵活、更强（官方：「more flexible and powerful」，
 *   能用 watch、composable），代价是 state 必须全部 return。本课用 setup store（和 composable 写法一致）。
 * - Pinia 实例由壳应用的 VueMount 每次挂载时 app.use(createPinia()) 创建：state 挂在 pinia 实例上，
 *   离开本题再回来就是新的 pinia —— 购物车还在，是因为本题的 persistPlugin 从 localStorage 读回来了。
 *   Zustand 的 state 挂在模块上（模块级单例），不刷新页面就一直在。
 * - setup store 没有自带的 $reset()：Pinia 只给 option store 实现了（按 state() 重新生成），
 *   setup store 调用会报错「does not implement $reset()」（开发环境）。要用就自己写一个（下面最后一个函数）。
 * - 更新方式：直接改 ref / reactive（可变更新），依赖它的组件在下一个 tick 重新渲染；Zustand 必须 set + 不可变更新。
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CartItem, Product } from '@/shared/types'

export type CheckoutState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; orderNo: string }
  | { status: 'error'; message: string }

export interface CheckoutOptions {
  delayMs?: number
  fail?: boolean
}

export const CART_STORAGE_KEY = 'topic16-cart-vue'

/* ------------------------- 模拟结算接口（演示简化，与 React 侧相同） ------------------------- */

let checkoutRequestCount = 0

export function getCheckoutRequestCount() {
  return checkoutRequestCount
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function mockCheckoutApi(itemCount: number, { delayMs = 600, fail = false }: CheckoutOptions = {}) {
  checkoutRequestCount += 1
  const requestNo = checkoutRequestCount
  await wait(delayMs)
  if (fail) throw new Error('网络错误：结算失败，请重试')
  return { orderNo: `CO-${String(requestNo).padStart(4, '0')}（${itemCount} 件）` }
}

/* -------------------------------- store -------------------------------- */

export const useCartStore = defineStore(
  'topic16-cart',
  () => {
    // state
    const items = ref<CartItem[]>([])
    const giftWrap = ref(false)
    const checkout = ref<CheckoutState>({ status: 'idle' })

    // getter：computed，有缓存，依赖没变就不重算（Zustand 的选择器函数每次 store 变化都会重算）
    const totalCount = computed(() => items.value.reduce((sum, it) => sum + it.quantity, 0))
    const totalPrice = computed(() => items.value.reduce((sum, it) => sum + it.price * it.quantity, 0))

    // action：普通函数，直接改
    function addToCart(product: Product) {
      const exists = items.value.find((it) => it.id === product.id)
      if (exists) exists.quantity += 1
      else items.value.push({ id: product.id, name: product.name, price: product.price, quantity: 1 })
    }

    function increase(id: string) {
      const target = items.value.find((it) => it.id === id)
      if (target) target.quantity += 1
    }

    // 下限是 1（与 React 侧一致）。已经是 1 时什么都不写，不会触发任何更新
    function decrease(id: string) {
      const target = items.value.find((it) => it.id === id)
      if (target && target.quantity > 1) target.quantity -= 1
    }

    function remove(id: string) {
      items.value = items.value.filter((it) => it.id !== id)
    }

    function clear() {
      items.value = []
    }

    function setGiftWrap(value: boolean) {
      giftWrap.value = value
    }

    /**
     * 异步 action：async 函数直接写（pinia.vuejs.org core-concepts/actions）。
     * ref 的读写是同步的，同一轮里连调两次，第二次就能读到 'pending' —— 和 React 侧 get() 守卫一样。
     */
    async function checkoutCart(options?: CheckoutOptions) {
      if (checkout.value.status === 'pending' || items.value.length === 0) return
      checkout.value = { status: 'pending' }
      try {
        const { orderNo } = await mockCheckoutApi(totalCount.value, options)
        items.value = []
        checkout.value = { status: 'success', orderNo }
      } catch (err) {
        // 错误已经变成 state，不再往外抛（与 React 侧一致）。要是抛出去，$onAction 的 onError 能收到，
        // 但模板里 @click 调用时 Vue 会把这个被拒绝的 Promise 当成未处理错误报出来（19 题讲过 onErrorCaptured 的捕获面）
        checkout.value = { status: 'error', message: err instanceof Error ? err.message : String(err) }
      }
    }

    // setup store 要自己写 $reset：把每个 state 设回初始值
    function $reset() {
      items.value = []
      giftWrap.value = false
      checkout.value = { status: 'idle' }
    }

    return {
      items,
      giftWrap,
      checkout,
      totalCount,
      totalPrice,
      addToCart,
      increase,
      decrease,
      remove,
      clear,
      setGiftWrap,
      checkoutCart,
      $reset,
    }
  },
  {
    // 第三个参数：自定义选项，给 persistPlugin 读（类型由 persistPlugin.ts 的 declare module 提供）
    persist: {
      key: CART_STORAGE_KEY,
      pick: ['items', 'giftWrap'],
      version: 1,
      // 与 React 侧同一个演示：v0 的条目字段叫 qty，v1 改名 quantity
      migrate: (persisted, fromVersion) => {
        if (fromVersion !== 0) return {}
        const old = persisted as { items?: Array<Omit<CartItem, 'quantity'> & { qty?: number }> }
        return { items: (old.items ?? []).map(({ qty, ...rest }) => ({ ...rest, quantity: qty ?? 1 })) }
      },
    },
  },
)
