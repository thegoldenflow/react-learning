<script setup lang="ts">
/**
 * 区块一 + 区块二（Vue 对照，逐段对应 react/OrdersListPanel.tsx）。
 *
 * 和 React 侧不同的地方：
 * - 把 getter 放进 queryKey（listOptions(() => filters.value)），库自动追踪、值一变就换 key；
 *   React 侧靠「每次渲染把新选项传进去」。vue-query 5 的类型还允许把整个选项写成 getter（useQuery(() => ({ … }))），
 *   官方 reactivity 指南以 queryKey / enabled 为主，本课照指南写。
 * - 返回值是一组 ref，必须解构成顶层变量模板才会自动解包；区块一最后一行演示了不解构的坑。
 * - 筛选和页码用 defineModel（父组件 v-model:filters）；React 侧是 value + onChange 两个 props。
 */
import { computed, onMounted, onUnmounted, onWatcherCleanup, ref, watch } from 'vue'
import { keepPreviousData, onlineManager, useMutation, useQuery } from '@tanstack/vue-query'
import { ORDER_STATUS_TEXT, type Order } from '@/shared/types'
import OrdersCountBadge from './OrdersCountBadge.vue'
import QueryStatusTable from './QueryStatusTable.vue'
import {
  PAGE_SIZE,
  STALE_TIME_MS,
  STATUS_OPTIONS,
  orderKeys,
  type ListFilters,
  type ListPage,
  type OrdersDemo,
  type StatusFilter,
} from './ordersDemo'

type MutationMode = 'invalidate' | 'variables' | 'cache'

const MODE_TEXT: Record<MutationMode, string> = {
  invalidate: '不做乐观更新：等失效重取',
  variables: '乐观 · 用 variables 渲染',
  cache: '乐观 · onMutate 改缓存 + 失败回滚',
}
const MODES = Object.keys(MODE_TEXT) as MutationMode[]

const props = defineProps<{
  demo: OrdersDemo
  selectedId: string | null
  /** 每秒更新一次的时间戳，只用来算「数据落地几秒了」 */
  now: number
}>()
const emit = defineEmits<{ select: [id: string] }>()
const filters = defineModel<ListFilters>('filters', { required: true })
const keepPrevious = defineModel<boolean>('keepPrevious', { required: true })

const formatTime = (ms: number) => new Date(ms).toLocaleTimeString('zh-CN', { hour12: false })

/**
 * ★ useQuery：queryKey 里是读 filters 的 getter；placeholderData 传一个 computed ——
 * 其它选项里的 ref 也会被库解开（vue-query 5.102.8 的 cloneDeepUnref），所以开关一变就生效。
 * listQuery 先整体存下来只是为了演示下面那个坑；真正使用时一律解构成顶层 ref。
 */
const listQuery = useQuery({
  ...props.demo.listOptions(() => filters.value),
  placeholderData: computed(() => (keepPrevious.value ? keepPreviousData : undefined)),
})
const {
  data,
  error,
  status,
  fetchStatus,
  isPending,
  isFetching,
  isLoading,
  isRefetching,
  isPaused,
  isPlaceholderData,
  isError,
  isStale,
  dataUpdatedAt,
  refetch,
} = listQuery

// v-model 绑定到 option 的 :value 原值（StatusFilter），不需要像 React 侧那样对字符串做类型守卫；
// 写回时顺带把页码重置为 1
const statusFilter = computed<StatusFilter>({
  get: () => filters.value.status,
  set: (status) => {
    filters.value = { status, page: 1 }
  },
})
const goPage = (page: number) => {
  filters.value = { ...filters.value, page }
}

/* ---------------------- 演示开关 ---------------------- */
const mode = ref<MutationMode>('invalidate')
const failMutation = ref(false)

// 模拟断网：watch 把本地开关同步到全局的 onlineManager；取消勾选或组件卸载时 onWatcherCleanup 恢复在线
const simulateOffline = ref(false)
watch(simulateOffline, (offline) => {
  if (!offline) return
  onlineManager.setOnline(false)
  onWatcherCleanup(() => onlineManager.setOnline(true))
})
const online = ref(onlineManager.isOnline())
let unsubscribeOnline: (() => void) | undefined
onMounted(() => {
  online.value = onlineManager.isOnline()
  unsubscribeOnline = onlineManager.subscribe((value) => {
    online.value = value
  })
})
onUnmounted(() => unsubscribeOnline?.())

/**
 * ★ useMutation：与 React 侧同一套回调（签名、先后顺序都来自 query-core）。
 * 差别只在读演示开关：mode.value 是「调用时」的当前值（Vue 没有渲染快照）。
 */
const {
  mutate,
  status: mutationStatus,
  isPending: marking,
  variables: markingId,
  isError: markFailed,
  error: markError,
} = useMutation({
  mutationFn: (id: string) => props.demo.markPaid(id),
  onMutate: async (id, context) => {
    props.demo.log.add(`mutation 开始：${id} → 已支付（${MODE_TEXT[mode.value]}）`)
    if (mode.value !== 'cache') return undefined
    await context.client.cancelQueries({ queryKey: orderKeys.lists() })
    const snapshots = context.client.getQueriesData<ListPage>({ queryKey: orderKeys.lists() })
    context.client.setQueriesData<ListPage>({ queryKey: orderKeys.lists() }, (old) =>
      old ? { ...old, items: old.items.map((o) => (o.id === id ? { ...o, status: 'paid' } : o)) } : old,
    )
    props.demo.log.add(`  ↳ onMutate：取消在途列表请求、存了 ${snapshots.length} 份快照、直接改了缓存`)
    return { snapshots }
  },
  onError: (err, _id, onMutateResult, context) => {
    props.demo.log.add(`useMutation 级 onError：${err.message}`)
    if (onMutateResult) {
      for (const [key, snapshot] of onMutateResult.snapshots) context.client.setQueryData(key, snapshot)
      props.demo.log.add('  ↳ 用快照把缓存回滚了')
    }
  },
  onSuccess: (updated) => {
    props.demo.log.add(`useMutation 级 onSuccess：${updated.orderNo} 已支付`)
  },
  onSettled: (_data, _error, _id, _onMutateResult, context) => {
    props.demo.log.add("useMutation 级 onSettled：invalidateQueries({ queryKey: ['orders'] })，列表、详情、统计都标记过期")
    return context.client.invalidateQueries({ queryKey: orderKeys.all })
  },
})

function handleMarkPaid(order: Order) {
  if (failMutation.value) props.demo.failNext('mutation')
  mutate(order.id, {
    onSuccess: () => props.demo.log.add(`mutate 级 onSuccess：${order.orderNo}（组件还挂载着才会执行）`),
    onError: () => props.demo.log.add(`mutate 级 onError：${order.orderNo}`),
  })
}

// 派生值用 computed（React 侧是渲染时直接算的 const）
const optimisticPaidId = computed(() => (mode.value === 'variables' && marking.value ? markingId.value : undefined))
const totalPages = computed(() => (data.value ? Math.max(1, Math.ceil(data.value.total / PAGE_SIZE)) : 1))
const ageSec = computed(() =>
  dataUpdatedAt.value ? Math.max(0, Math.floor((props.now - dataUpdatedAt.value) / 1000)) : null,
)
const rowStatus = (o: Order) => (o.id === optimisticPaidId.value ? 'paid' : o.status)
</script>

<template>
  <!-- ===================== 区块一 ===================== -->
  <div class="card stack">
    <h3>区块一：queryKey 与缓存 —— status 回答「有没有数据」，fetchStatus 回答「在不在请求」</h3>
    <p class="muted">
      操作与 React 侧相同：切筛选再切回（5 秒内不发请求）、翻页对比「保留上一页」、模拟断网后刷新看 paused。
    </p>

    <div class="row">
      <label class="row">
        <span>状态筛选：</span>
        <select v-model="statusFilter">
          <option
            v-for="opt in STATUS_OPTIONS"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </label>
      <OrdersCountBadge
        :demo="demo"
        :filters="filters"
      />
      <button
        :disabled="isFetching"
        @click="refetch()"
      >
        {{ isFetching ? '请求中…' : '刷新' }}
      </button>
      <button
        class="btn-danger"
        :disabled="isFetching"
        @click="demo.failNext('list'); refetch()"
      >
        刷新（模拟失败）
      </button>
      <label class="row">
        <input
          v-model="simulateOffline"
          type="checkbox"
        >
        <span>模拟断网（onlineManager 当前：{{ online ? '在线' : '离线' }}）</span>
      </label>
    </div>

    <div class="row">
      <button
        :disabled="filters.page <= 1"
        @click="goPage(filters.page - 1)"
      >
        上一页
      </button>
      <span>第 {{ filters.page }} / {{ totalPages }} 页</span>
      <button
        :disabled="isPlaceholderData || filters.page >= totalPages"
        @click="goPage(filters.page + 1)"
      >
        下一页
      </button>
      <label class="row">
        <input
          v-model="keepPrevious"
          type="checkbox"
        >
        <span>保留上一页（placeholderData: keepPreviousData）</span>
      </label>
    </div>

    <QueryStatusTable
      label="列表查询的状态"
      :fields="{ status, fetchStatus, isPending, isFetching, isLoading, isRefetching, isPaused, isPlaceholderData, isError, isStale }"
    />
    <p class="muted">
      数据更新于：{{ dataUpdatedAt ? formatTime(dataUpdatedAt) : '—' }}
      <template v-if="ageSec !== null">
        （{{ ageSec }} 秒前；staleTime = {{ STALE_TIME_MS / 1000 }} 秒）
      </template>
    </p>
    <!-- 不解构的坑：listQuery.isFetching 是 ref 对象，在三元表达式里总按真值处理（模板只自动解包顶层 ref） -->
    <p class="muted">
      Vue 专属的坑 —— 不解构：<code>listQuery.isFetching ? … : …</code> 得到「{{ listQuery.isFetching ? '请求中' : '空闲' }}」；
      解构后的 <code>isFetching</code> 得到「{{ isFetching ? '请求中' : '空闲' }}」。
    </p>

    <p
      v-if="isLoading"
      class="muted"
    >
      加载中…（isLoading：没有数据、正在请求）
    </p>
    <p
      v-if="isPending && isPaused"
      class="muted"
    >
      已离线，请求暂停，恢复网络后自动继续（pending + paused）
    </p>

    <div
      v-if="isError"
      class="row"
      role="alert"
    >
      <span class="error-text">加载失败：{{ error?.message }}</span>
      <button
        class="btn-primary"
        :disabled="isFetching"
        @click="refetch()"
      >
        重试
      </button>
      <span
        v-if="data"
        class="muted"
      >（下面仍是上一次成功的缓存数据）</span>
    </div>

    <p
      v-if="data && data.items.length === 0"
      class="muted"
    >
      没有符合条件的订单
    </p>

    <table
      v-if="data && data.items.length > 0"
      aria-label="订单列表"
      :style="{ opacity: isPlaceholderData ? 0.55 : 1 }"
    >
      <thead>
        <tr>
          <th>订单号</th>
          <th>客户</th>
          <th>金额</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="o in data.items"
          :key="o.id"
          :style="{ cursor: 'pointer', background: o.id === selectedId ? '#eef6ff' : undefined }"
          @click="emit('select', o.id)"
        >
          <td>{{ o.orderNo }}</td>
          <td>{{ o.customer }}</td>
          <td>￥{{ o.amount }}</td>
          <td :style="{ opacity: o.id === optimisticPaidId ? 0.6 : 1 }">
            <span :class="`badge badge-${rowStatus(o)}`">{{ ORDER_STATUS_TEXT[rowStatus(o)] }}</span>
            <span
              v-if="o.id === optimisticPaidId"
              class="muted"
            >（待确认）</span>
          </td>
          <td>
            <button
              v-if="o.status === 'pending' && o.id !== optimisticPaidId"
              class="btn-primary"
              :disabled="marking"
              @click.stop="handleMarkPaid(o)"
            >
              {{ marking && markingId === o.id ? '提交中…' : '标记为已支付' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <p
      v-if="isPlaceholderData"
      class="muted"
    >
      （半透明的是上一页的数据，新的一页正在加载）
    </p>
  </div>

  <!-- ===================== 区块二 ===================== -->
  <div class="card stack">
    <h3>区块二：mutation 之后怎么更新 —— 失效重取、两种乐观更新</h3>
    <p class="muted">
      选一种做法，再点上面表格里的「标记为已支付」，对照最下面的日志。
    </p>
    <fieldset class="row">
      <legend>写完之后怎么更新界面</legend>
      <label
        v-for="m in MODES"
        :key="m"
        class="row"
      >
        <input
          v-model="mode"
          type="radio"
          name="vue-mutation-mode"
          :value="m"
        >
        <span>{{ MODE_TEXT[m] }}</span>
      </label>
    </fieldset>
    <label class="row">
      <input
        v-model="failMutation"
        type="checkbox"
      >
      <span>让 mutation 失败（看回滚）</span>
    </label>
    <QueryStatusTable
      label="mutation 的状态"
      :fields="{ status: mutationStatus, isPending: marking, variables: markingId ?? '—', isError: markFailed }"
    />
    <p
      v-if="markFailed"
      class="error-text"
      role="alert"
    >
      更新失败：{{ markError?.message }}
    </p>
  </div>
</template>
