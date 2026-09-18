<script setup lang="ts">
/**
 * 区块一 Vue 对照：同样五个互不嵌套的组件，只通过 Pinia store 打交道。
 * 不需要 selector：每个组件渲染时实际读了哪些响应式数据，就只在这些数据变化时重新渲染（依赖追踪到属性，
 * 被触发的是组件的渲染函数，见 PROGRESS「统一措辞 · Vue 响应式」）。对照 react/CartDemo.tsx。
 */
import CartPanel from './CartPanel.vue'
import CartSummary from './CartSummary.vue'
import GiftWrapToggle from './GiftWrapToggle.vue'
import ProductList from './ProductList.vue'
import RenderCountsPanel from './RenderCountsPanel.vue'
import WholeStoreBadge from './WholeStoreBadge.vue'
import { createRenderCounts, provideRenderCounts } from './renderCounts'

const counts = createRenderCounts()
provideRenderCounts(counts)

const entries: Array<[string, string]> = [
  ['ProductList', '商品列表'],
  ['CartPanel', '购物车'],
  ['CartSummary', '合计'],
  ['GiftWrapToggle', '礼品包装'],
  ['WholeStoreBadge', '整店徽标（反例）'],
]
</script>

<template>
  <div class="card stack">
    <h3>区块一：Pinia 购物车 —— 读了什么就依赖什么</h3>
    <p class="muted">
      和 React 侧做同样的操作：加入购物车（商品列表不动）、勾选礼品包装（只有它自己和读了整个 $state 的徽标会动）。
      离开本题再回来：壳应用会新建一个 pinia，购物车靠 persistPlugin 从 localStorage 读回来。
    </p>
    <ProductList />
    <CartPanel />
    <CartSummary />
    <div class="row">
      <GiftWrapToggle />
      <WholeStoreBadge />
    </div>
    <RenderCountsPanel
      :counts="counts"
      :entries="entries"
      label="区块一渲染次数"
    />
  </div>
</template>
