<script setup lang="ts">
/**
 * 学习主题：TanStack Query 与服务端状态 —— 缓存、同步、重新请求与 mutation
 *
 * React 核心概念：
 * - TanStack Query（@tanstack/react-query）不是 React 核心 API：React 本身只有 useState / useEffect，
 *   没有「服务端状态」这个概念。React 侧所有 useQuery / useMutation 都来自这个第三方库，
 *   它与本文件用的 @tanstack/vue-query 共用同一个 @tanstack/query-core —— 两边逻辑几乎逐行同构
 * - 它主要解决的是【服务端状态】：远端数据在前端的缓存、与服务端保持同步、什么时候重新请求、
 *   以及 mutation（写操作）之后让缓存失效重取。「怎么发请求」不归它管（queryFn 里随便用 fetch / axios / mock）
 * - query key：一个数组 ['orders', status]，既是缓存的主键，也是「参数变了就重新请求」的依赖声明 ——
 *   对应 React 侧 10 / 11 题手写的依赖数组 [keyword, reloadFlag]，只是不必再自己写 effect
 * - 查询函数 queryFn：返回 Promise 的普通函数。参数里的 signal 就是 27 题手工 new 的 AbortController.signal 的
 *   自动版：key 切换、最后一个订阅者离开时，库自动 abort 在途请求
 * - useQuery 返回一台状态机：isPending / isError + error / data；isFetching 是「正在请求」（含后台刷新）；
 *   refetch() 手动重新请求；dataUpdatedAt 是数据落地的时间戳。11 题手写的判别联合在这里就是这几个字段
 * - cache 的基本概念：同一个 QueryClient 里一个 key 只存一份数据；staleTime（本题 5 秒）内再次用到直接给缓存不发请求；
 *   过了 staleTime 先给缓存再后台刷新；gcTime（默认 5 分钟）内没人用的缓存被回收；同 key 的两处 useQuery 只发一次请求（去重）
 * - mutation：useMutation({ mutationFn }) 管「写」；成功后 queryClient.invalidateQueries({ queryKey: ['orders'] })
 *   把所有 ['orders', *] 标记过期（前缀匹配），正在被使用的立即重取 —— 「改完之后列表自动更新」的标准套路
 * - 服务端状态 vs 本地 UI state：订单列表是服务端状态（归 Query 管）；筛选、选中高亮是本地 UI state（归 useState 管）。
 *   useState 不等于完整的服务端状态管理：它只是一个值容器，没有缓存 key、过期、去重、失效重取、后台刷新这些能力
 * - Pinia、Context、Zustand 与 TanStack Query 解决的问题不完全相同：前三者管「客户端状态怎么跨组件共享」（15 / 16 题），
 *   TanStack Query 管「服务端数据的缓存与同步」。把接口数据塞进 store 再手写 loading / error，是把两类问题混在一起
 * - 不要把 loading、error、server cache 全部手写成大量本地 state：11 / 22 题为了讲清状态机而手写；
 *   真实业务的列表页应交给 TanStack Query（或同类：SWR / RTK Query），组件里只剩本地 UI state
 *
 * Vue 对应概念：
 * - @tanstack/vue-query：useQuery / useMutation / useQueryClient / invalidateQueries 与 React 侧同名同义（同一个 core），
 *   本文件与 react/Example.tsx 可以逐段对照着读
 * - QueryClient 用 app.use(VueQueryPlugin, { queryClient }) 装成插件（本目录 queryPlugin.ts，壳应用自动安装），
 *   本质是 provide/inject；React 用 <QueryClientProvider client={queryClient}>，本质是 Context —— 都是依赖注入。
 *   组件里两边都用 useQueryClient() 取回它
 * - key 里可以直接放 ref：queryKey: ['orders', status]，库会解包并 watch 它，status.value 一变自动换 key ——
 *   相当于库替你写了 10 题的 watch(status, …, { immediate: true })；React 侧 status 是渲染快照，下次渲染把新 key 传进去
 * - useQuery / useMutation 返回的是「装满 ref 的对象」：必须解构成顶层 ref，模板才会自动解包；script 里读 .value。
 *   直接 const q = useQuery(...) 再在模板里写 q.isPending —— 那是一个 ref 对象，永远为真，这是 vue-query 第一大坑
 * - Pinia 与 Zustand 一样只管客户端状态：Vue 生态同样不该把接口数据塞进 Pinia 再手写 loading / error（16 题的 cartStore 注释）
 * - 11 题的 Vue 版把请求写成命令式 load() 函数、22 题用 watch 触发 —— 本题两种都不用写：请求由 key 驱动
 *
 * 最重要的区别：
 * - 本题最重要的收获是一个框架无关的分类：状态先分「服务端的」还是「客户端的」，再决定用什么工具 ——
 *   服务端状态交给 Query 库，客户端状态才轮到 ref / Pinia（Vue）或 useState / Zustand（React）
 * - 两侧的 Query 用法几乎逐行同构；差异只在响应式接口：Vue 侧参数可以是 ref、返回值是 ref，
 *   React 侧参数是每次渲染的快照、返回值是普通值 —— 这是两套响应式模型的差异，不是 Query 库的差异
 * - 与邻题的分工：11 题 = 手写请求状态机；27 题 = 手写竞态取消（queryFn 的 signal 是它的自动版）；
 *   16 题 = 客户端全局状态（Pinia / Zustand）；22 题 = 手写综合页；30 题 = 把请求层交给库，看组件里还剩下什么
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchOrders, isAbortError, updateOrder, type Paged } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type Order, type OrderStatus } from '@/shared/types'
import OrdersCountBadge from './OrdersCountBadge.vue'

/** 筛选下拉的取值：接口支持的三种状态 + 'all'（与 fetchOrders 的 status 参数一致） */
type StatusFilter = OrderStatus | 'all'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: ORDER_STATUS_TEXT.pending },
  { value: 'paid', label: ORDER_STATUS_TEXT.paid },
  { value: 'cancelled', label: ORDER_STATUS_TEXT.cancelled },
]

/** 本题的 staleTime（与 queryPlugin.ts 里的配置一致）：5 秒内视为「新鲜」，再次用到直接给缓存 */
const STALE_TIME_MS = 5_000

/** queryFn 的类型：只关心库传进来的 signal（27 题手工 new 的 AbortController.signal 的自动版） */
type LoadOrders = (ctx: { signal: AbortSignal }) => Promise<Paged<Order>>

const timeStamp = () => new Date().toLocaleTimeString('zh-CN', { hour12: false })
const formatTime = (ms: number) => new Date(ms).toLocaleTimeString('zh-CN', { hour12: false })

// 取回 queryPlugin.ts 里 provide 的 QueryClient（React 侧 useQueryClient() 读的是 Context）。
// 本项目每次进入本题都会新建一个（切题 = 全新空缓存）；真实应用在 main.ts 只建一次、全局唯一。
const queryClient = useQueryClient()

/* ---------------- 本地 UI state：真相就在这个组件里，归 ref 管 ---------------- */
const status = ref<StatusFilter>('all') // 筛选条件：进 queryKey，变了就换缓存条目
const selectedId = ref<string | null>(null) // 选中高亮：和服务器毫无关系
// 页面日志：放 ref，直接 push（React 侧必须 setLog(prev => [...prev, line]) 造新数组）；不放模块级变量，切题不串
const log = ref<string[]>([])
function addLog(line: string) {
  log.value.push(`${timeStamp()}  ${line}`)
}
// 调试开关：下一次 queryFn 必定失败。setup 只跑一次，一个普通变量就够（React 侧要用 useRef 才能跨渲染保存）；
// 故意不进 queryKey —— 否则「模拟失败」会被当成另一个缓存条目
let failNext = false

/**
 * 查询函数：一个返回 Promise 的普通 async 函数。
 * 它读 status.value —— 现读现取（Vue 没有渲染快照）；React 侧读的是本次渲染的快照，两边都与 key 里的 status 一致。
 * 里面的 addLog 只是为了让你在页面上看见「queryFn 真的执行了几次」—— 观察缓存与去重最直接的证据。
 */
const loadOrders: LoadOrders = async ({ signal }) => {
  const failRate = failNext ? 1 : 0
  failNext = false
  addLog(`queryFn 执行：key = ["orders","${status.value}"]${failRate ? '（本次模拟失败）' : ''}`)
  try {
    const page = await fetchOrders(
      { status: status.value, pageSize: 20 },
      { signal, delayMs: 800, failRate },
    )
    addLog(`  ↳ 返回 ${page.items.length} 条，写入缓存`)
    return page
  } catch (err) {
    // 「被取消」不是失败（10 / 27 题）：库 abort 了 signal，这里只记一笔再原样抛出
    addLog(
      isAbortError(err)
        ? '  ↳ 被取消（signal 触发：key 切换或订阅者离开）'
        : `  ↳ 失败：${err instanceof Error ? err.message : String(err)}`,
    )
    throw err
  }
}

/**
 * ★ useQuery：本题的主角。对象参数是 v5 唯一的写法。
 *
 * - queryKey: ['orders', status] —— 注意这里放的是 ref 本身，不是 status.value：库会解包并 watch 它，
 *   status.value 一变，useQuery 就去找 ['orders', 'paid'] 这条缓存：有且新鲜 → 直接给 data、不发请求；
 *   有但过期 → 先给旧 data、后台 refetch（isFetching 为 true）；没有 → isPending 为 true、执行 queryFn。
 *   React 侧写 ['orders', status] 的 status 是快照值，靠「下次渲染传新 key」触发 —— 同一件事，两种触发方式
 * - queryFn: 见上。库会给它传 signal，切换筛选时上一条在途请求自动被 abort（看日志里的「被取消」）
 * - 返回值必须【解构】：data / error / isPending / isError / isFetching / dataUpdatedAt 都是 ref，
 *   解构成顶层变量后模板自动解包，script 里用 .value；refetch 是普通函数。
 *   isPending = 还没有任何数据（首次加载）；isFetching = 正在请求（包括后台刷新）——「后台刷新中」= isFetching && !isPending
 * - 没有 watch、没有 onMounted、没有 AbortController、没有判别联合 —— 这些全在库里
 *
 * 关于 retry：本题在 queryPlugin.ts 里关掉了（retry: false）；生产默认失败后自动重试 3 次、指数退避。
 */
const { data, error, isPending, isError, isFetching, dataUpdatedAt, refetch } = useQuery({
  queryKey: ['orders', status],
  queryFn: loadOrders,
})

/**
 * ★ useMutation：管「写」。mutationFn 收到 mutate(id) 传进来的参数，返回 Promise。
 *
 * - 返回值同样是 ref 对象，这里解构并改名：mutate → markPaid（普通函数），isPending → markingPaid，
 *   variables → markingId（这次传入的 id，用来只禁用被点的那一行），isError / error → 失败信息。
 *   19 题手写的 submitting / errorMessage 两个 ref，在这里是现成的字段
 * - onSuccess 里 invalidateQueries({ queryKey: ['orders'] })：这就是「mutation 成功后的 query invalidation」——
 *   前缀匹配，所有 ['orders', *] 都被标记为过期；当前正在被组件使用的那条立即重取，没人在用的等下次用到时再取。
 *   这里 return 了它的 Promise，于是 markingPaid 会一直等到列表重取完成才变回 false
 * - 对比 22 题的做法：保存成功后手工把新订单塞回本地列表。那种「手工同步一份副本」正是服务端状态难写的地方；
 *   TanStack 的答案是「别维护副本，让缓存失效、重新拉真相」（乐观更新 / setQueryData 本题不展开）
 * - mockApi 的 ORDERS 是模块级可变数组：这里标记的「已支付」在 22 题也看得到，刷新页面才恢复
 */
const {
  mutate: markPaid,
  isPending: markingPaid,
  variables: markingId,
  isError: markPaidFailed,
  error: markPaidError,
} = useMutation({
  mutationFn: (id: string) => updateOrder(id, { status: 'paid' }, { delayMs: 600 }),
  onMutate: (id) => {
    addLog(`mutation 开始：${id} → paid`)
  },
  onSuccess: (updated) => {
    addLog(`mutation 成功：${updated.orderNo} 已支付 → invalidateQueries(['orders'])，所有 ['orders', *] 标记过期`)
    return queryClient.invalidateQueries({ queryKey: ['orders'] })
  },
  onError: (err) => {
    addLog(`mutation 失败：${err.message}`)
  },
})

/**
 * 缓存观察窗：订阅 QueryCache 的变化，把所有 ['orders', *] 条目列出来（只服务于教学；真实项目用 devtools）。
 * React 侧用 useSyncExternalStore 订阅（还得用 notifyManager.batchCalls 把通知推迟到渲染之外）；
 * Vue 侧没有对应的 API（没有一一对应关系）：onMounted 里 subscribe、onUnmounted 里退订，把结果写进 ref —— 没有「渲染期间不能更新」的限制。
 * 「每秒刷一次 now」只为把「数据落地已过几秒 / 是否仍新鲜」画出来 —— 定时器 id 存在 setup 作用域，卸载时清掉。
 * 「已失效」= isInvalidated：invalidateQueries 标记的，或某次请求失败后库自动标记的，都表示「下次用到时必须重取」。
 */
const cache = queryClient.getQueryCache()
const cacheLines = ref<string[]>([])
function refreshCacheView() {
  cacheLines.value = cache.findAll({ queryKey: ['orders'] }).map(
    (q) =>
      `${JSON.stringify(q.queryKey)}  ${q.state.status}` +
      `  更新于 ${q.state.dataUpdatedAt ? formatTime(q.state.dataUpdatedAt) : '—'}` +
      `  订阅者 ${q.getObserversCount()}` +
      (q.state.isInvalidated ? '  已失效' : ''),
  )
}
const now = ref(Date.now())
let unsubscribeCache: (() => void) | undefined
let tickTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  refreshCacheView()
  unsubscribeCache = cache.subscribe(refreshCacheView)
  tickTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => {
  unsubscribeCache?.()
  if (tickTimer !== undefined) clearInterval(tickTimer)
})

// 派生值用 computed（React 侧是渲染时直接算的 const，09 题）
const updatedAtText = computed(() => (dataUpdatedAt.value ? formatTime(dataUpdatedAt.value) : '—'))
const ageSec = computed(() =>
  dataUpdatedAt.value ? Math.max(0, Math.floor((now.value - dataUpdatedAt.value) / 1000)) : null,
)
const fresh = computed(() => ageSec.value !== null && ageSec.value * 1000 < STALE_TIME_MS)
const refreshing = computed(() => isFetching.value && !isPending.value) // 有数据、且正在后台重新请求

function refetchWithFailure() {
  failNext = true
  refetch()
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      订单列表由 TanStack Query 管理：筛选、刷新、模拟失败、标记已支付，盯着「数据更新于」「后台刷新中」和最下面的日志看。
    </p>

    <!-- ===================== 区块一：query key + 缓存（staleTime）+ refetch ===================== -->
    <div class="card stack">
      <h3>区块一：筛选就是换 query key —— 5 秒内切回来不发请求</h3>
      <p class="muted">
        切到「已支付」再切回「全部」：5 秒内日志里没有新的 queryFn、数据瞬间出现（缓存命中）；
        等 5 秒后再切，会先显示旧数据、同时出现「后台刷新中」（stale-while-revalidate）。
        右边的徽标用同一个 key 又写了一次 useQuery，但每次只发一次请求（去重）。
      </p>

      <div class="row">
        <label class="row">
          <span>状态筛选：</span>
          <!-- v-model 绑定本地 UI state；它进了 queryKey，所以改它就是「换一条缓存」（库替你 watch 了它） -->
          <select v-model="status">
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
          :status="status"
          :load-orders="loadOrders"
        />
        <!-- refetch()：手动重新请求，不管新不新鲜。对应 11 题 Vue 版的「再调一次 load()」 -->
        <button
          :disabled="isFetching"
          @click="refetch()"
        >
          {{ isFetching ? '请求中…' : '刷新' }}
        </button>
        <button
          class="btn-danger"
          :disabled="isFetching"
          @click="refetchWithFailure"
        >
          刷新（模拟失败）
        </button>
      </div>

      <p class="muted">
        数据更新于：{{ updatedAtText }}
        <template v-if="ageSec !== null">
          （{{ ageSec }} 秒前，{{ fresh ? '新鲜' : '已过期' }}，staleTime = {{ STALE_TIME_MS / 1000 }} 秒）
        </template>
        <strong v-if="refreshing"> · 后台刷新中…</strong>
      </p>
    </div>

    <!-- ===================== 区块二：loading / error / data / mutation ===================== -->
    <div class="card stack">
      <h3>区块二：isPending / isError / data，以及 mutation 后失效重取</h3>
      <p class="muted">
        点某一行「标记为已支付」：按钮变「提交中…」→ mutation 成功 → invalidateQueries → 列表自动重取（日志可见）。
        点行可选中（本地 UI state）：列表重取后选中不丢。「刷新（模拟失败）」后看错误分支与「重试」。
      </p>

      <!-- isPending：缓存里没有这个 key 的数据、正在首次加载。有缓存时哪怕在刷新也不会走到这里 -->
      <p
        v-if="isPending"
        class="muted"
      >
        加载中…（isPending：这个 key 还没有任何缓存）
      </p>

      <!-- isError：请求失败。上一次成功的 data 仍在（缓存不会因为一次失败被清空），所以下面的表格照常显示 -->
      <div
        v-if="isError"
        class="row"
      >
        <span class="error-text">加载失败：{{ error?.message }}</span>
        <!-- 重试 = refetch()，对应 11 题的 retry() 再调一次 load() -->
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

      <!-- 空态不是错误：请求成功、恰好没有数据（11 题）。v-if="data" 守卫：data 在首次加载完成前是 undefined -->
      <p
        v-if="data && data.items.length === 0"
        class="muted"
      >
        没有符合条件的订单
      </p>

      <table v-if="data && data.items.length > 0">
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
            @click="selectedId = o.id"
          >
            <td>{{ o.orderNo }}</td>
            <td>{{ o.customer }}</td>
            <td>￥{{ o.amount }}</td>
            <td>
              <span :class="`badge badge-${o.status}`">{{ ORDER_STATUS_TEXT[o.status] }}</span>
            </td>
            <td>
              <!-- 只禁用被点的那一行：markingId 就是这次 markPaid(id) 传进去的 id；.stop 别顺带触发行的选中 -->
              <button
                v-if="o.status === 'pending'"
                class="btn-primary"
                :disabled="markingPaid && markingId === o.id"
                @click.stop="markPaid(o.id)"
              >
                {{ markingPaid && markingId === o.id ? '提交中…' : '标记为已支付' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p
        v-if="markPaidFailed"
        class="error-text"
      >
        更新失败：{{ markPaidError?.message }}
      </p>
    </div>

    <!-- ===================== 区块三：服务端状态 vs 本地 UI state + 日志 ===================== -->
    <div class="card stack">
      <h3>区块三：谁管什么 —— 服务端状态 vs 本地 UI state</h3>
      <p class="muted">
        左边是这个组件里仅剩的本地 ref；右边是 QueryClient 缓存里的条目（切过几个筛选就有几条，5 分钟没人用会被回收）。
        离开本题再进来：左边归零，右边也是空的 —— 因为本项目每次进入都新建 QueryClient；真实应用只建一次，缓存跨页面存活。
      </p>

      <div
        class="row"
        style="align-items: flex-start"
      >
        <div
          class="stack"
          style="flex: 1; min-width: 220px"
        >
          <strong>本地 UI state（ref）</strong>
          <ul>
            <li>筛选 status：{{ status }}</li>
            <li>选中行 selectedId：{{ selectedId ?? '无' }}</li>
          </ul>
          <span class="muted">只属于这个组件，不需要和服务器同步 —— 这才是 ref / Pinia 该管的东西。</span>
        </div>
        <div
          class="stack"
          style="flex: 2; min-width: 280px"
        >
          <strong>服务端状态（QueryClient 缓存里的 ['orders', *]）</strong>
          <ul class="log">
            <li
              v-if="cacheLines.length === 0"
              class="log-empty"
            >
              （空）
            </li>
            <li
              v-for="line in cacheLines"
              :key="line"
            >
              {{ line }}
            </li>
          </ul>
          <span class="muted">
            真相在服务器，这里只是一份可能过期的副本：有主键（key）、有时间戳、有订阅者计数、会失效 ——
            这些概念 ref / Pinia / useState 一个都没有，这就是「服务端状态需要专门的工具」的意思。
          </span>
        </div>
      </div>

      <p class="muted">
        一句话总结：TanStack Query 不是 Vue 核心 API（也不是 React 核心 API），它只管服务端数据的缓存、同步、重新请求和 mutation；
        ref / useState 不等于完整的服务端状态管理；Pinia / Context / Zustand 管的是客户端状态的跨组件共享，和它解决的问题不完全相同；
        所以不要把 loading、error、server cache 全部手写成大量本地 state（11 / 22 题那样手写只是为了讲清原理）。
      </p>

      <div class="row">
        <strong>运行日志</strong>
        <button
          class="btn-ghost"
          @click="log = []"
        >
          清空
        </button>
      </div>
      <ul class="log">
        <li
          v-if="log.length === 0"
          class="log-empty"
        >
          （暂无）
        </li>
        <li
          v-for="(line, i) in log"
          :key="i"
        >
          {{ line }}
        </li>
      </ul>
      <span class="muted">
        Vue 侧没有 StrictMode 双跑：壳应用重新挂载时是整个 Vue 应用连同 QueryClient 一起新建，
        所以这里的首条请求不会像 React 侧那样先「被取消」再重发一次（没有一一对应关系）。
      </span>
    </div>
  </div>
</template>
