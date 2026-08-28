<script setup lang="ts">
/**
 * 商品列表组件：与 CartPanel 互不嵌套、没有任何 props 往来，只通过全局 store 打交道。
 * （React 版的 ProductList 与父组件同在一个 .tsx 文件里；Vue 的 SFC 一文件一组件，拆成本文件。）
 */
import type { Product } from '@/shared/types'
import { useCartStore } from './cartStore'

const PRODUCTS: Product[] = [
  { id: 'p1', name: '机械键盘', price: 399, category: '外设', stock: 12 },
  { id: 'p2', name: '无线鼠标', price: 149, category: '外设', stock: 20 },
  { id: 'p3', name: '降噪耳机', price: 899, category: '音频', stock: 8 },
  { id: 'p4', name: '4K 显示器', price: 1999, category: '显示', stock: 5 },
]

// useCartStore() 拿到响应式 store。本组件模板里只调用了 addToCart 这个 action，
// 没有读 items 等任何 state——Pinia 的依赖收集是「读了才依赖」，购物车怎么变本组件都不会更新。
// React 侧要靠手写 selector useCartStore(s => s.addToCart) 才能做到同样的效果
// （不写 selector 就订阅整个 store，购物车一变这个组件也跟着重渲染）——那边是手动挡，这里是自动挡。
const cart = useCartStore()
</script>

<template>
  <div class="card stack">
    <strong>商品列表（组件 A）</strong>
    <div
      v-for="p in PRODUCTS"
      :key="p.id"
      class="row"
    >
      <span>{{ p.name }}</span>
      <span class="muted">￥{{ p.price.toFixed(2) }}</span>
      <button
        class="btn-primary"
        @click="cart.addToCart(p)"
      >
        加入购物车
      </button>
    </div>
  </div>
</template>
