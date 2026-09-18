<script setup lang="ts">
/**
 * 购物车：解构 state / getter 要用 storeToRefs，action 可以直接解构。
 * 对照 React 侧：useCartStore(s => s.items) + useShallow 取三个 action（react/CartDemo.tsx）。
 */
import { storeToRefs } from 'pinia'
import { useCartStore } from './cartStore'
import { useRenderCount } from './renderCounts'

const cart = useCartStore()
// storeToRefs 只把 state 和 getter 转成 ref（跳过 action）；直接 const { items } = cart 拿到的是解构那一刻的值，之后不再更新
const { items } = storeToRefs(cart)
// action 是绑定好的普通函数，直接解构没问题
const { increase, decrease, remove } = cart
useRenderCount('CartPanel')
</script>

<template>
  <div class="stack">
    <strong>购物车（读了 items）</strong>
    <p
      v-if="items.length === 0"
      class="muted"
    >
      购物车是空的，从上面加点什么吧。
    </p>
    <div
      v-for="it in items"
      v-else
      :key="it.id"
      class="row"
    >
      <span>{{ it.name }}</span>
      <span class="muted">￥{{ it.price.toFixed(2) }}</span>
      <button
        :disabled="it.quantity <= 1"
        :aria-label="`${it.name} 数量减一`"
        @click="decrease(it.id)"
      >
        -
      </button>
      <span>{{ it.quantity }}</span>
      <button
        :aria-label="`${it.name} 数量加一`"
        @click="increase(it.id)"
      >
        +
      </button>
      <button
        class="btn-danger"
        @click="remove(it.id)"
      >
        移除
      </button>
    </div>
  </div>
</template>
