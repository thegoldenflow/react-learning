<script setup lang="ts">
/**
 * 合计：读两个 getter（computed，有缓存）。只改礼品包装时 items 没变，两个 getter 不重算、本组件不重新渲染。
 * 对照 React 侧：useShallow((s) => ({ count: selectTotalCount(s), total: selectTotalPrice(s) }))。
 */
import { storeToRefs } from 'pinia'
import { useCartStore } from './cartStore'
import { useRenderCount } from './renderCounts'

const cart = useCartStore()
const { totalCount, totalPrice } = storeToRefs(cart)
useRenderCount('CartSummary')
</script>

<template>
  <div class="row">
    <span>
      合计 {{ totalCount }} 件，<strong>￥{{ totalPrice.toFixed(2) }}</strong>
    </span>
    <button
      class="btn-danger"
      :disabled="totalCount === 0"
      @click="cart.clear()"
    >
      清空
    </button>
  </div>
</template>
