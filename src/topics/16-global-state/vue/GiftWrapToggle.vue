<script setup lang="ts">
/**
 * 礼品包装：v-model 直接绑 storeToRefs 出来的 ref —— Pinia 允许在组件里直接改 state（Zustand 只能通过 set）。
 * 能改不等于该这么改：多人协作的项目常约定「state 只在 action 里改」，方便在 $onAction 里统一记录（StoreApiDemo.vue）。
 */
import { storeToRefs } from 'pinia'
import { useCartStore } from './cartStore'
import { useRenderCount } from './renderCounts'

const { giftWrap } = storeToRefs(useCartStore())
useRenderCount('GiftWrapToggle')
</script>

<template>
  <label class="row">
    <input
      v-model="giftWrap"
      type="checkbox"
    >
    礼品包装（和购物车条目无关的字段）
  </label>
</template>
