/**
 * 题 16 的 Pinia store（Vue 侧全局状态，setup store 写法）。
 *
 * 注意：Pinia 实例由桥接组件在挂载 Vue 示例时自动安装，这里只管 defineStore / useCartStore；
 * React 侧对照 cartStore.ts——Zustand 连 Provider / 安装这一步都没有，create 出来直接用。
 *
 * setup store 写法与 composable 完全一致（也可用 Options 风格的 { state, getters, actions }，
 * 二者等价）：ref = state、computed = getter、function = action。
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CartItem, Product } from '@/shared/types'

export const useCartStore = defineStore('topic16-cart', () => {
  // state：React 侧对应 create<CartState>()((set, get) => ({ items: [], ... })) 里的 items
  const items = ref<CartItem[]>([])

  // getter：computed 自动依赖追踪 + 自动缓存。
  // Zustand 没有「带缓存的 getter」概念：React 侧 totalPrice 是 store 里的函数（get() 现算、
  // 无缓存），totalCount 则是组件内直接算——两者没有一一对应关系。
  const totalPrice = computed(() =>
    items.value.reduce((sum, it) => sum + it.price * it.quantity, 0),
  )
  const totalCount = computed(() => items.value.reduce((sum, it) => sum + it.quantity, 0))

  // action：普通函数，直接改响应式 state（可变更新）。
  // Zustand 那边每一步都必须 set(...) + 不可变更新（新数组 / 新对象），
  // 和 useState 同一套规矩——这是两边最大的手感差异。
  function addToCart(product: Product) {
    const exists = items.value.find((it) => it.id === product.id)
    if (exists) {
      exists.quantity += 1
    } else {
      items.value.push({ id: product.id, name: product.name, price: product.price, quantity: 1 })
    }
  }

  function increase(id: string) {
    const target = items.value.find((it) => it.id === id)
    if (target) target.quantity += 1
  }

  // 数量下限钳在 1：减到 1 后按钮会禁用，移除走单独的 remove（与 React 版一致）
  function decrease(id: string) {
    const target = items.value.find((it) => it.id === id)
    if (target) target.quantity = Math.max(1, target.quantity - 1)
  }

  function remove(id: string) {
    items.value = items.value.filter((it) => it.id !== id)
  }

  function clear() {
    items.value = []
  }

  return { items, totalPrice, totalCount, addToCart, increase, decrease, remove, clear }
})
