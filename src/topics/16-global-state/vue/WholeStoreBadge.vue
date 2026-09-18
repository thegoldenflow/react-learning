<script setup lang="ts">
/**
 * 反例对照：React 侧不传 selector 的 useCartStore() 会订阅整个 store。
 * Vue 里没有「订阅整个 store」这个动作 —— 依赖按实际读取记录。这里的 all 用 { ...cart.$state } 把每个顶层字段都读了一遍，
 * 模板又直接读 all，于是任何一个字段变化（包括礼品包装、结算状态）都会让它重新渲染，效果和 React 的反例一样。
 * 实际代码里常见的同类写法：模板里 {{ cart.$state }} 调试输出、把整个 store 展开再传给子组件。
 *
 * 反过来：如果再包一层 computed 只算出件数、模板只读这个数字，就不会因为礼品包装重新渲染了 ——
 * Vue 3.4 起 computed 的结果没变就不通知下游（blog.vuejs.org/posts/vue-3-4：「the callback now only fires if the computed
 * result has actually changed」），computed 在这里起的作用和 Zustand selector 的 Object.is 比较一样（Example.test.ts 有对比）。
 */
import { computed } from 'vue'
import { useCartStore } from './cartStore'
import { useRenderCount } from './renderCounts'

const cart = useCartStore()
const all = computed(() => ({ ...cart.$state }))
const countOf = (items: typeof cart.items) => items.reduce((sum, it) => sum + it.quantity, 0)
useRenderCount('WholeStoreBadge')
</script>

<template>
  <span class="badge">徽标（读了整个 $state）：{{ countOf(all.items) }} 件</span>
</template>
