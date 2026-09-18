<script setup lang="ts">
/**
 * 本课的页面主体（对应 react/Example.tsx 里的 OrdersWorkbench）。这里的 ref 全是本地 UI state ——
 * 服务端数据一份都不存，都在 QueryClient 的缓存里。测试直接挂载它，配零延迟的 demo 和自己的 QueryClient。
 */
import { onMounted, onUnmounted, ref } from 'vue'
import CacheInspector from './CacheInspector.vue'
import LoaderVsQueryCard from './LoaderVsQueryCard.vue'
import OrderDetailPanel from './OrderDetailPanel.vue'
import OrdersListPanel from './OrdersListPanel.vue'
import SuspenseStatsPanel from './SuspenseStatsPanel.vue'
import type { ListFilters, OrdersDemo } from './ordersDemo'

defineProps<{ demo: OrdersDemo }>()

const filters = ref<ListFilters>({ status: 'all', page: 1 })
const keepPrevious = ref(false)
const selectedId = ref<string | null>(null)

// 每秒更新一次，只为把「数据落地几秒了」画出来；定时器在卸载时清掉
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="stack">
    <p class="muted">
      订单数据全部交给 @tanstack/vue-query：换筛选、翻页、刷新、模拟失败 / 断网、标记已支付，对照各区块的状态表和最下面的日志看。
    </p>
    <OrdersListPanel
      v-model:filters="filters"
      v-model:keep-previous="keepPrevious"
      :demo="demo"
      :selected-id="selectedId"
      :now="now"
      @select="selectedId = $event"
    />
    <OrderDetailPanel
      :demo="demo"
      :selected-id="selectedId"
      @clear="selectedId = null"
    />
    <SuspenseStatsPanel :demo="demo" />
    <CacheInspector
      :demo="demo"
      :filters="filters"
      :keep-previous="keepPrevious"
      :selected-id="selectedId"
      :now="now"
    />
    <LoaderVsQueryCard />
  </div>
</template>
