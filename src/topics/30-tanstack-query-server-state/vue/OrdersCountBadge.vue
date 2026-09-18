<script setup lang="ts">
/**
 * 同一个 queryOptions 在另一个组件里再用一次：不会多发请求（对应 React 侧 OrdersListPanel.tsx 里的 OrdersCountBadge；
 * SFC 一个文件一个组件，所以 Vue 侧拆成这个文件）。
 * key 相同的查询共用同一份缓存和同一个在途请求（去重）；「共享」靠的是 key + 缓存，
 * 不是父组件把 data 通过 props 传下来（08 题），也不是塞进 Pinia（16 题）。
 * 两处都用 ordersDemo.ts 的 listOptions()，所以不会出现「同一个 key 两份不同 queryFn」的问题。
 */
import { useQuery } from '@tanstack/vue-query'
import type { ListFilters, OrdersDemo } from './ordersDemo'

const props = defineProps<{ demo: OrdersDemo; filters: ListFilters }>()

// 传 getter 进 key（官方 reactivity 指南推荐的 () => props.x 写法）：props.filters 换了，key 跟着换
const { data, isFetching } = useQuery(props.demo.listOptions(() => props.filters))
</script>

<template>
  <!-- data / isFetching 是顶层 ref，模板里自动解包 -->
  <span
    class="badge"
    title="同一个 key 的第二个 useQuery：共享缓存，不多发请求"
  >
    {{ data ? `共 ${data.total} 条` : '…' }}{{ isFetching ? ' ⟳' : '' }}
  </span>
</template>
