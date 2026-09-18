<script setup lang="ts">
/**
 * 区块五（Vue 对照，对应 react/CacheInspector.tsx）：本地 UI state 与 QueryClient 缓存并排，外加运行日志。
 *
 * 订阅 QueryCache：onMounted 里 subscribe、onUnmounted 里退订，每次事件把条目重新算一遍写进 ref。
 * React 侧要用 useSyncExternalStore + 稳定的 subscribe + notifyManager.batchCalls；
 * Vue 这边没有「渲染期间不能更新别的组件」这条限制 —— useQuery 在子组件 setup 里登记新 key 时同步触发的事件，
 * 在这里只是改了一个 ref，Vue 把更新排进下一个 tick。真实项目看缓存用 devtools（@tanstack/vue-query-devtools）。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import type { ListFilters, OrdersDemo } from './ordersDemo'

const props = defineProps<{
  demo: OrdersDemo
  filters: ListFilters
  keepPrevious: boolean
  selectedId: string | null
  now: number
}>()

interface CacheRow {
  hash: string
  status: string
  fetchStatus: string
  observers: number
  invalidated: boolean
  updatedAt: number
}

const cache = useQueryClient().getQueryCache()
const rows = ref<CacheRow[]>([])
function refresh() {
  rows.value = cache.getAll().map((q) => ({
    hash: q.queryHash,
    status: q.state.status,
    fetchStatus: q.state.fetchStatus,
    observers: q.getObserversCount(),
    invalidated: q.state.isInvalidated,
    updatedAt: q.state.dataUpdatedAt,
  }))
}
let unsubscribe: (() => void) | undefined
onMounted(() => {
  refresh()
  unsubscribe = cache.subscribe(refresh)
})
onUnmounted(() => unsubscribe?.())

const ageText = (updatedAt: number) =>
  updatedAt ? `${Math.max(0, Math.floor((props.now - updatedAt) / 1000))} 秒前` : '—'
const logLines = computed(() => props.demo.log.lines.value)
</script>

<template>
  <div class="card stack">
    <h3>区块五：谁管什么 —— 本地 UI state vs 服务端状态的缓存</h3>
    <p class="muted">
      左边是本地 UI state（ref）；右边是 QueryClient 缓存里的全部条目。第一列是 key 哈希后的结果：对象的键被排过序，
      和 React 侧一致（同一个 query-core）。离开本题再进来两边都是空的：每次进入都新建 QueryClient。
    </p>

    <div
      class="row"
      style="align-items: flex-start"
    >
      <div
        class="stack"
        style="flex: 1; min-width: 200px"
      >
        <strong>本地 UI state（ref）</strong>
        <ul>
          <li>筛选 status：{{ filters.status }}</li>
          <li>页码 page：{{ filters.page }}</li>
          <li>保留上一页：{{ keepPrevious }}</li>
          <li>选中行 selectedId：{{ selectedId ?? 'null' }}</li>
        </ul>
        <span class="muted">只属于这个页面，不需要和服务器同步 —— 这才是 ref / Pinia 该管的东西。</span>
      </div>
      <div
        class="stack"
        style="flex: 3; min-width: 320px"
      >
        <strong>服务端状态（QueryClient 缓存）</strong>
        <p
          v-if="rows.length === 0"
          class="log-empty"
        >
          （空）
        </p>
        <table
          v-else
          aria-label="缓存条目"
        >
          <thead>
            <tr>
              <th>queryHash</th>
              <th>status</th>
              <th>fetchStatus</th>
              <th>观察者</th>
              <th>更新于</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.hash"
            >
              <td><code style="word-break: break-all">{{ row.hash }}</code></td>
              <td>{{ row.status }}</td>
              <td>{{ row.fetchStatus }}</td>
              <td>{{ row.observers }}</td>
              <td>
                {{ ageText(row.updatedAt) }}
                <strong v-if="row.invalidated"> 已失效</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <span class="muted">
          有主键、有时间戳、有观察者计数、会失效、没人用 5 分钟（gcTime）后被回收 —— 这些概念 ref / Pinia 都没有。
        </span>
      </div>
    </div>

    <div class="row">
      <strong>运行日志</strong>
      <button
        class="btn-ghost"
        @click="demo.log.clear()"
      >
        清空
      </button>
    </div>
    <ul
      class="log"
      aria-label="运行日志"
    >
      <li
        v-if="logLines.length === 0"
        class="log-empty"
      >
        （暂无）
      </li>
      <li
        v-for="(line, i) in logLines"
        :key="i"
      >
        {{ line }}
      </li>
    </ul>
    <span class="muted">
      Vue 没有 StrictMode 双跑：刚进入本题时列表的 queryFn 只执行一次，不会先「被取消」再重发（React 侧开发环境会）。
    </span>
  </div>
</template>
