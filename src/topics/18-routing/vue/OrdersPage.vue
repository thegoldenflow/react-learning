<script setup lang="ts">
/**
 * 订单列表（/orders）：筛选条件和页码存在 URL 的 query 里。
 *
 * Vue 的取数方式【最常用】（频率：工程经验）：导航完成后在组件里请求，watch 跟着 query 变化重新请求，
 * onWatcherCleanup（Vue 3.5 起）在下一次触发前取消上一个请求（27 题）。
 * React Data 模式对照：路由的 loader 在导航提交前取数，组件用 useLoaderData 读；
 * vue-router 5 的 vue-router/experimental 数据加载器【尝鲜】才是 Vue 这边的同类写法。
 */
import { computed, onWatcherCleanup, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { fetchOrders, isAbortError } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type Order, type OrderStatus } from '@/shared/types'

const PAGE_SIZE = 5

const route = useRoute()
const router = useRouter()

// route.query 的值来自 URL，是外部输入，读出来要收窄成合法值（React 侧 searchParams.get() 同理）
const status = computed<OrderStatus | 'all'>(() => {
  const raw = route.query.status
  return raw === 'pending' || raw === 'paid' || raw === 'cancelled' ? raw : 'all'
})
const page = computed(() => {
  const n = Number(route.query.page)
  return Number.isInteger(n) && n > 0 ? n : 1
})

const orders = ref<Order[]>([])
const total = ref(0)
const loading = ref(true)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

watch(
  [status, page],
  async ([nextStatus, nextPage]) => {
    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort())
    loading.value = true
    try {
      const result = await fetchOrders(
        { status: nextStatus, page: nextPage, pageSize: PAGE_SIZE },
        { signal: controller.signal },
      )
      orders.value = result.items
      total.value = result.total
      loading.value = false
    } catch (err) {
      // 被取消不是失败：新的请求已经在路上，保持 loading
      if (!isAbortError(err)) {
        loading.value = false
        throw err
      }
    }
  },
  { immediate: true },
)

/**
 * router.push({ query }) 会用你给的对象整体替换 query，写 { status } 会把 page 等其它参数丢掉，
 * 所以先展开 route.query 再改。React 对照：setSearchParams 的函数形式。
 * 默认 push【最常用】（后退能回到上一个筛选条件）；高频变化（逐字输入的搜索词）用 router.replace【常用】。
 */
function updateQuery(patch: Record<string, string | undefined>) {
  const query: LocationQueryRaw = { ...route.query }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete query[key]
    else query[key] = value
  }
  void router.push({ query })
}

const FILTERS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: ORDER_STATUS_TEXT.pending },
  { value: 'paid', label: ORDER_STATUS_TEXT.paid },
  { value: 'cancelled', label: ORDER_STATUS_TEXT.cancelled },
]

function changeStatus(next: OrderStatus | 'all') {
  // 换筛选条件就回到第 1 页
  updateQuery({ status: next === 'all' ? undefined : next, page: undefined })
}

function goToPage(nextPage: number) {
  updateQuery({ page: nextPage === 1 ? undefined : String(nextPage) })
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <button
        v-for="f in FILTERS"
        :key="f.value"
        type="button"
        :class="{ 'btn-primary': status === f.value }"
        @click="changeStatus(f.value)"
      >
        {{ f.label }}
      </button>
      <span
        v-if="loading"
        class="muted"
      >加载中……</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>订单号</th>
          <th>客户</th>
          <th>金额</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="o in orders"
          :key="o.id"
        >
          <td>
            <RouterLink :to="`/orders/${o.id}`">
              {{ o.orderNo }}
            </RouterLink>
          </td>
          <td>{{ o.customer }}</td>
          <td>¥{{ o.amount }}</td>
          <td>
            <span :class="`badge badge-${o.status}`">{{ ORDER_STATUS_TEXT[o.status] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row">
      <button
        type="button"
        :disabled="page <= 1"
        @click="goToPage(page - 1)"
      >
        上一页
      </button>
      <span class="muted">第 {{ page }} / {{ pageCount }} 页，共 {{ total }} 条</span>
      <button
        type="button"
        :disabled="page >= pageCount"
        @click="goToPage(page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>
