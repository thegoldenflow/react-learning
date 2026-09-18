<script setup lang="ts">
/**
 * 商品列表：模板里只调用了 cart.addToCart，没有读任何 state ——
 * 依赖是「渲染时实际读了什么」记下来的，所以购物车怎么变，这个组件都不重新渲染。
 * React 侧要手写 selector useCartStore(s => s.addToCart) 才能做到同样的效果（react/CartDemo.tsx）。
 */
import { useCartStore } from './cartStore'
import { DEMO_PRODUCTS } from './products'
import { useRenderCount } from './renderCounts'

const cart = useCartStore()
useRenderCount('ProductList')
</script>

<template>
  <div class="stack">
    <strong>商品列表（只调用 action）</strong>
    <div
      v-for="p in DEMO_PRODUCTS"
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
