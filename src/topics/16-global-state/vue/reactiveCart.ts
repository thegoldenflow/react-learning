/**
 * Vue 内置的最小方案：模块级 reactive（vuejs.org guide/scaling-up/state-management「Simple State Management with Reactivity API」）。
 * 对照 React 侧的 Context + useReducer（react/ContextReducerCart.tsx）—— 两边都是「不装库、框架自带」的做法，但差别很大：
 * - Vue 的响应式对象可以脱离组件存在，放在模块里 import 就能共享，也不需要 Provider；
 *   React 的 state 属于组件，不装库时跨组件共享要么提升到共同祖先再经 props / Context 往下传，
 *   要么自己在模块里写一个外部 store、用 useSyncExternalStore 订阅（本课的渲染计数和演示日志就是这样，14 题）。
 * - Vue 这里照样是「读了什么就依赖什么」；React Context 没有 selector，读 value 的组件全部重渲染。
 * 局限（官方文档原文见 react/Example.tsx 三）：服务端渲染时模块级单例会在请求之间共享（cross-request state pollution）；
 * 没有 devtools 时间线、插件、HMR —— 这些正是 Pinia 补上的。
 * 官方建议把修改写成 store 上的方法（「methods ... that express the intention of the actions」），而不是在组件里到处直接改。
 */
import { reactive } from 'vue'
import type { CartItem, Product } from '@/shared/types'

export const reactiveCart = reactive({
  items: [] as CartItem[],
  giftWrap: false,
  add(product: Product) {
    const exists = this.items.find((it) => it.id === product.id)
    if (exists) exists.quantity += 1
    else this.items.push({ id: product.id, name: product.name, price: product.price, quantity: 1 })
  },
  remove(id: string) {
    this.items = this.items.filter((it) => it.id !== id)
  },
  toggleGiftWrap() {
    this.giftWrap = !this.giftWrap
  },
  /** 演示 / 测试用：清空（模块级单例不会随组件卸载重置） */
  reset() {
    this.items = []
    this.giftWrap = false
  },
})
