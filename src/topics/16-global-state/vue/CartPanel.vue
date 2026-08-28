<script setup lang="ts">
/**
 * 购物车面板组件：与 ProductList 是兄弟组件，同样只通过全局 store 拿数据。
 * （对应 React 版 Example.tsx 里的 CartPanel 函数组件。）
 */
import { storeToRefs } from 'pinia'
import { useCartStore } from './cartStore'

const cart = useCartStore()

// 解构 state / getter 必须用 storeToRefs：直接 const { items } = cart 拿到的是
// 解构那一刻的普通值，响应性会丢。React 侧对应「每个字段各写一个 selector」——
// useCartStore(s => s.items) / useCartStore(s => s.totalPrice())。
// totalPrice / totalCount 是 getter（computed，自动缓存）；React 侧一个是 store 函数现算、
// 一个是组件内直接算，Zustand 没有带缓存的 getter 概念。
const { items, totalPrice, totalCount } = storeToRefs(cart)

// action 是普通（已绑定的）函数，直接解构不丢任何东西
const { increase, decrease, remove, clear } = cart
</script>

<template>
  <div class="card stack">
    <div class="row">
      <strong>购物车面板（组件 B）</strong>
      <button
        class="btn-danger"
        :disabled="items.length === 0"
        @click="clear"
      >
        清空
      </button>
    </div>

    <p
      v-if="items.length === 0"
      class="muted"
    >
      购物车是空的，从上面的商品列表加点什么吧。
    </p>
    <template v-else>
      <div
        v-for="it in items"
        :key="it.id"
        class="row"
      >
        <span>{{ it.name }}</span>
        <span class="muted">￥{{ it.price.toFixed(2) }}</span>
        <button
          :disabled="it.quantity <= 1"
          @click="decrease(it.id)"
        >
          -
        </button>
        <span>{{ it.quantity }}</span>
        <button @click="increase(it.id)">
          +
        </button>
        <button
          class="btn-danger"
          @click="remove(it.id)"
        >
          移除
        </button>
      </div>
      <p>
        共 {{ totalCount }} 件，合计 <strong>￥{{ totalPrice.toFixed(2) }}</strong>
      </p>
    </template>
  </div>
</template>
