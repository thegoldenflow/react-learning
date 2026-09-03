<script setup lang="ts">
/**
 * 用同一个 key 再写一次 useQuery：不会多发请求（对照 React 侧 Example.tsx 里的 OrdersCountBadge 函数组件；
 * SFC 一文件一组件，所以 Vue 侧拆成这个文件）。
 *
 * 同一个 QueryClient 里，key 相同的查询共用同一份缓存与同一个在途请求（去重）：
 * 看日志，切换筛选时 queryFn 只执行一次，这个徽标和列表却同时更新。
 * 「共享」靠的是 key + 缓存，不是父组件把 data 通过 props 传下来（08 题），也不是塞进 Pinia（16 题）。
 *
 * queryFn 通过 props 传进来：TanStack 只按 key 认缓存、不比较 queryFn，两处若写了不同的函数，
 * 实际执行哪一个取决于谁触发了这次请求 —— 所以两处必须用同一个函数（React 侧同样是 props 传下来）。
 */
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import type { Paged } from '@/shared/mockApi'
import type { Order, OrderStatus } from '@/shared/types'

/** 与 Example.vue 里的两个类型相同；<script setup> 不能 export 类型，这里各写一份 */
type StatusFilter = OrderStatus | 'all'
type LoadOrders = (ctx: { signal: AbortSignal }) => Promise<Paged<Order>>

const props = defineProps<{
  status: StatusFilter
  loadOrders: LoadOrders
}>()

// key 里放一个 computed：props.status 一变，key 跟着变，库自动去找对应的缓存条目
// （Example.vue 里直接放 ref；React 侧 status 是渲染快照，下一次渲染传入新 key —— 同一件事的不同触发方式）
const { data, isFetching } = useQuery({
  queryKey: computed(() => ['orders', props.status]),
  queryFn: (ctx) => props.loadOrders(ctx),
})
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
