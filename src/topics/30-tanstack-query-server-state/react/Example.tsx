/**
 * 学习主题：TanStack Query 与服务端状态 —— 缓存、同步、重新请求与 mutation
 *
 * React 核心概念：
 * - TanStack Query（@tanstack/react-query）不是 React 核心 API：React 本身只有 useState / useEffect，
 *   没有「服务端状态」这个概念。本题所有 useQuery / useMutation 都来自这个第三方库，
 *   它与 Vue 侧的 @tanstack/vue-query 共用同一个 @tanstack/query-core —— 两边逻辑几乎逐行同构
 * - 它主要解决的是【服务端状态】：远端数据在前端的缓存、与服务端保持同步、什么时候重新请求、
 *   以及 mutation（写操作）之后让缓存失效重取。「怎么发请求」不归它管（queryFn 里随便用 fetch / axios / mock）
 * - query key：一个数组 ['orders', status]，既是缓存的主键，也是「参数变了就重新请求」的依赖声明 ——
 *   对应 10 / 11 题手写的依赖数组 [keyword, reloadFlag]，只是不必再自己写 effect
 * - 查询函数 queryFn：返回 Promise 的普通函数。参数里的 signal 就是 27 题手工 new 的 AbortController.signal 的
 *   自动版：key 切换、最后一个订阅者离开时，库自动 abort 在途请求（竞态与取消都不用自己写了）
 * - useQuery 返回一台状态机：isPending（首次加载、缓存里还没有这份数据）/ isError + error / data；
 *   isFetching 是「正在请求」（含有缓存时的后台刷新），与 isPending 不是一回事；refetch() 手动重新请求；
 *   dataUpdatedAt 是这份数据落地的时间戳。11 题手写的 status: 'loading' | 'success' | 'error' 判别联合，
 *   在这里就是 isPending / isError / data 这几个字段
 * - cache 的基本概念：同一个 QueryClient 里，一个 key 的数据全局只存一份；staleTime（本题 5 秒）内再次用到
 *   直接给缓存、不发请求；过了 staleTime 先给缓存、再后台刷新（stale-while-revalidate）；gcTime（默认 5 分钟）内
 *   没人用的缓存会被回收。两个组件用同一个 key 各写一次 useQuery，只发一次请求（去重），数据自动共享
 * - mutation：useMutation({ mutationFn }) 管「写」，返回 mutate / isPending / variables / error；
 *   写成功后 queryClient.invalidateQueries({ queryKey: ['orders'] }) 把所有 ['orders', *] 标记为过期（前缀匹配），
 *   正在被使用的那条立即重取 —— 这就是「改完之后列表自动更新」的标准套路（query invalidation）
 * - 服务端状态 vs 本地 UI state：订单列表是服务端状态（真相在服务器，前端只是一份可能过期的缓存，归 Query 管）；
 *   筛选下拉、选中高亮是本地 UI state（真相就在这个组件里，归 useState 管）。useState 不等于完整的服务端状态管理：
 *   它只是一个值容器，没有缓存 key、过期、去重、失效重取、后台刷新这些能力 —— 11 / 22 题手写的那套
 *   loading / error / data + AbortController + reloadFlag，就是在用大量本地 state 模拟这些能力的一小部分
 * - Pinia、Context、Zustand 与 TanStack Query 解决的问题不完全相同：前三者管的是「客户端状态怎么跨组件共享」
 *   （15 / 16 题），TanStack Query 管的是「服务端数据的缓存与同步」。把接口数据塞进 store 再手写 loading / error，
 *   是把两类问题混在一起 —— 本题的 OrdersCountBadge 与列表共享数据，靠的是 key + 缓存，不是 store
 * - 不要把 loading、error、server cache 全部手写成大量本地 state：11 题为了讲清状态机而手写，22 题综合页也手写，
 *   真实业务的列表页应交给 TanStack Query（或同类：SWR / RTK Query），组件里只剩本地 UI state
 *
 * Vue 对应概念：
 * - @tanstack/vue-query：useQuery / useMutation / useQueryClient / invalidateQueries 同名同义（同一个 core）
 * - QueryClient 用 app.use(VueQueryPlugin, { queryClient }) 装成插件（vue/queryPlugin.ts），本质是 provide/inject；
 *   React 用 <QueryClientProvider client={queryClient}>，本质是 Context —— 都是依赖注入，只是注入机制不同
 * - Vue 侧 key 里可以直接放 ref：['orders', status]，库会解包并 watch 它，status.value 一变自动换 key；
 *   React 侧 status 是本次渲染的快照值，下次渲染把新 key 传进 useQuery —— 同一件事的两种触发方式
 * - Vue 侧返回值是一个装满 ref 的对象，要解构成顶层 ref 模板才会自动解包；React 侧返回的是普通值，直接用
 * - Pinia 与 Zustand 一样只管客户端状态：Vue 生态同样不该把接口数据塞进 Pinia 再手写 loading / error
 *
 * 最重要的区别：
 * - 本题最重要的收获是一个框架无关的分类：状态先分「服务端的」还是「客户端的」，再决定用什么工具 ——
 *   服务端状态交给 Query 库，客户端状态才轮到 useState / Zustand（React）或 ref / Pinia（Vue）
 * - 两侧的 Query 用法几乎逐行同构；差异只在响应式接口：React 侧参数是每次渲染的快照、返回值是普通值，
 *   Vue 侧参数可以是 ref、返回值是 ref —— 这是两套响应式模型的差异，不是 Query 库的差异
 * - 与邻题的分工：11 题 = 手写请求状态机（让你知道库替你管了什么）；27 题 = 手写竞态取消（queryFn 的 signal 是它的自动版）；
 *   16 题 = 客户端全局状态（Zustand / Pinia）；22 题 = 手写综合页；30 题 = 把请求层交给库，看组件里还剩下什么
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  notifyManager,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { fetchOrders, isAbortError, updateOrder, type Paged } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type Order, type OrderStatus } from '@/shared/types'

/** 筛选下拉的取值：接口支持的三种状态 + 'all'（与 fetchOrders 的 status 参数一致） */
type StatusFilter = OrderStatus | 'all'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: ORDER_STATUS_TEXT.pending },
  { value: 'paid', label: ORDER_STATUS_TEXT.paid },
  { value: 'cancelled', label: ORDER_STATUS_TEXT.cancelled },
]

/** 本题的 staleTime：数据落地后 5 秒内视为「新鲜」，再次用到直接给缓存、不发请求 */
const STALE_TIME_MS = 5_000

/**
 * queryFn 的类型。TanStack 调用它时会传一个 context（signal / queryKey / meta / client），
 * 本题只关心 signal —— 它就是 27 题里手工 new AbortController() 再传给 fetch 的那个 signal，
 * 只不过现在由库来决定何时 abort（key 切换、最后一个订阅者离开）。
 */
type LoadOrders = (ctx: { signal: AbortSignal }) => Promise<Paged<Order>>

const timeStamp = () => new Date().toLocaleTimeString('zh-CN', { hour12: false })
const formatTime = (ms: number) => new Date(ms).toLocaleTimeString('zh-CN', { hour12: false })

export default function Example() {
  /**
   * QueryClient = 缓存本体 + 默认配置，整棵树共用一个。
   *
   * 用 useState 的初始化函数创建，而不是写在组件外的模块级常量：本项目切换知识点就是卸载 / 重新挂载 Example，
   * 每次进入本题都应该拿到一份全新的空缓存，否则上一次留下的缓存会让「首次 loading」演示不出来。
   * 真实应用恰恰相反 —— 在 main.tsx 里只建一次、全局唯一，缓存跨页面存活才是它的价值。
   *
   * StrictMode 细节：开发期 React 会把 useState 的初始化函数调用两次并丢弃一次结果，被丢弃的那个 client
   * 从未被 Provider mount，不会留下任何监听 —— 所以这样写是安全的。
   *
   * 三个默认配置（与 Vue 侧 queryPlugin.ts 逐字一致，两边的缓存行为才可对照）：
   * - retry: false —— 生产默认失败后自动重试 3 次（指数退避）；演示「错误 + 重试」时不想等它；
   * - staleTime: 5 秒 —— 默认 0，即「数据一落地就算过期，每次挂载都后台刷新」；
   * - refetchOnWindowFocus: false —— 默认 true：切回浏览器窗口自动后台刷新，演示时会干扰观察。
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: STALE_TIME_MS, refetchOnWindowFocus: false },
        },
      }),
  )

  // 所有 useQuery / useMutation 必须写在 Provider【之下】的组件里（OrdersPanel），
  // 写在 Example 自己这一层会在运行时报「No QueryClient set」—— Context 只对子树可见（15 题）。
  return (
    <QueryClientProvider client={queryClient}>
      <OrdersPanel />
    </QueryClientProvider>
  )
}

/**
 * 订单面板：本题所有的 Query 逻辑都在这里。
 * 读一遍组件体，数一数还剩几个 useState —— 全都是本地 UI state；
 * 11 / 22 题里那一整套 loading / error / data / AbortController / reloadFlag 一个都不用写了。
 */
function OrdersPanel() {
  // 从 Context 取回 Example 里创建的 QueryClient（Vue 侧 useQueryClient() 走的是 inject）
  const queryClient = useQueryClient()

  /* ---------------- 本地 UI state：真相就在这个组件里，归 useState 管 ---------------- */
  const [status, setStatus] = useState<StatusFilter>('all') // 筛选条件：进 queryKey，变了就换缓存条目
  const [selectedId, setSelectedId] = useState<string | null>(null) // 选中高亮：和服务器毫无关系
  // 页面日志：放 state（React 里必须 setLog(prev => [...prev, line]) 造新数组，03 题），不放模块级变量，切题不串
  const [log, setLog] = useState<string[]>([])
  const addLog = (line: string) => setLog((prev) => [...prev, `${timeStamp()}  ${line}`])
  // 调试开关：下一次 queryFn 必定失败。用 ref 而不是 state —— 它不参与渲染；
  // 也故意不进 queryKey —— 否则「模拟失败」会被当成另一个缓存条目
  const failNextRef = useRef(false)
  // 每秒重渲染一次，只为把「数据落地已过几秒 / 是否仍新鲜」画出来（interval 在 cleanup 里清掉，10 题的纪律）
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  /**
   * 查询函数：一个返回 Promise 的普通 async 函数，签名见 LoadOrders。
   * 它读的 status 是本次渲染的快照 —— 没问题：queryKey 和 queryFn 来自同一次渲染，key 里的 status 和闭包里的一定一致；
   * TanStack 每次发请求都用「最新一次渲染传入的」queryFn。
   * 里面的 addLog 只是为了让你在页面上看见「queryFn 真的执行了几次」—— 这是观察缓存与去重最直接的证据。
   */
  const loadOrders: LoadOrders = async ({ signal }) => {
    const failRate = failNextRef.current ? 1 : 0
    failNextRef.current = false
    addLog(`queryFn 执行：key = ["orders","${status}"]${failRate ? '（本次模拟失败）' : ''}`)
    try {
      const page = await fetchOrders({ status, pageSize: 20 }, { signal, delayMs: 800, failRate })
      addLog(`  ↳ 返回 ${page.items.length} 条，写入缓存`)
      return page
    } catch (err) {
      // 「被取消」不是失败（10 / 27 题）：库 abort 了 signal，这里只记一笔再原样抛出，库自己知道怎么处理
      addLog(
        isAbortError(err)
          ? '  ↳ 被取消（signal 触发：key 切换或订阅者离开）'
          : `  ↳ 失败：${err instanceof Error ? err.message : String(err)}`,
      )
      throw err
    }
  }

  /**
   * ★ useQuery：本题的主角。对象参数是 v5 唯一的写法（v4 的 useQuery(key, fn) 位置参数已移除）。
   *
   * - queryKey: ['orders', status] —— 缓存主键 + 依赖声明。status 一变，useQuery 就去找 ['orders', 'paid'] 这条缓存：
   *   有且新鲜 → 直接给 data、不发请求；有但过期 → 先给旧 data、后台 refetch（isFetching 为 true）；
   *   没有 → isPending 为 true、执行 queryFn。这三种分支 11 题要手写十几行 state 才能覆盖一种
   * - queryFn: 见上。库会给它传 signal，切换筛选时上一条在途请求自动被 abort（看日志里的「被取消」）
   * - 返回值解构：data / error / isPending / isError / isFetching / dataUpdatedAt / refetch。
   *   注意 isPending 与 isFetching 的区别：isPending = 还没有任何数据（首次加载）；isFetching = 正在请求（包括后台刷新）。
   *   「后台刷新中」的判定就是 isFetching && !isPending
   * - 没有 useEffect、没有 AbortController、没有 reloadFlag、没有判别联合 —— 这些全在库里
   *
   * 关于 retry：本题在 QueryClient 里关掉了（retry: false）；生产默认失败后自动重试 3 次、指数退避，
   * 所以你在真实项目里看到 error 时，往往已经是重试 3 次都失败之后的事了。
   */
  const { data, error, isPending, isError, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['orders', status],
    queryFn: loadOrders,
  })

  /**
   * ★ useMutation：管「写」。mutationFn 收到 mutate(id) 传进来的参数，返回 Promise。
   *
   * - markPaid.mutate(id) 触发；markPaid.isPending 表示在途；markPaid.variables 是这次传入的参数（用来只禁用被点的那一行）；
   *   markPaid.isError / error 是失败信息 —— 19 题手写的 submitting / errorMessage 两个 state，在这里是现成的字段
   * - onSuccess 里 invalidateQueries({ queryKey: ['orders'] })：这就是「mutation 成功后的 query invalidation」——
   *   前缀匹配，所有 ['orders', *] 都被标记为过期；当前正在被组件使用的那条（比如 ['orders','all']）立即重取，
   *   没人在用的（比如切换过的 ['orders','pending']）等下次用到时再取。这里 return 了它的 Promise，
   *   于是 isPending 会一直等到列表重取完成才变回 false —— 按钮的「提交中…」和列表刷新同一时刻结束
   * - 对比 22 题的做法：保存成功后用 map 手工把新订单塞回本地列表。那种「手工同步一份副本」正是服务端状态难写的地方：
   *   副本越多越容易和服务器对不上。TanStack 的答案是「别维护副本，让缓存失效、重新拉真相」
   *   （进阶写法 —— 乐观更新 / setQueryData 直接改缓存 —— 本题不展开）
   * - mockApi 的 ORDERS 是模块级可变数组：这里标记的「已支付」在 22 题也看得到，刷新页面才恢复
   */
  const markPaid = useMutation({
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
   * 缓存观察窗：订阅 QueryCache 的变化，把所有 ['orders', *] 条目列出来。
   * useSyncExternalStore 是 React 订阅外部可变数据源的标准 API（TanStack 内部的 useQuery 也是靠它把缓存变化变成重渲染）；
   * Vue 侧没有对应的 API（没有一一对应关系）：onMounted 里 subscribe、把结果写进 ref 就够了，响应式系统接手剩下的事。
   * 这段只服务于教学 —— 真实项目里看缓存用 @tanstack/react-query-devtools，本题为了保持两侧对称没有装它。
   * 快照必须是「内容不变则引用不变」的值，所以拼成一个字符串再在渲染时 split。
   *
   * 订阅回调要用 notifyManager.batchCalls 包一层：TanStack 在【渲染期间】就会往缓存里登记新 key
   * （useQuery 换 key 时先 build 一条空 query，发出 'added' 事件），若回调同步触发重渲染，
   * React 会警告「渲染另一个组件时更新了 OrdersPanel」；batchCalls 把通知推迟到渲染之外 —— 库内部的 useQuery 也是这样订阅的。
   *
   * 「已失效」= isInvalidated：invalidateQueries 标记的，或某次请求失败后库自动标记的，都表示「下次用到时必须重取」。
   */
  const cache = queryClient.getQueryCache()
  const cacheSummary = useSyncExternalStore(
    (onChange) => cache.subscribe(notifyManager.batchCalls(onChange)),
    () =>
      cache
        .findAll({ queryKey: ['orders'] })
        .map(
          (q) =>
            `${JSON.stringify(q.queryKey)}  ${q.state.status}` +
            `  更新于 ${q.state.dataUpdatedAt ? formatTime(q.state.dataUpdatedAt) : '—'}` +
            `  订阅者 ${q.getObserversCount()}` +
            (q.state.isInvalidated ? '  已失效' : ''),
        )
        .join('\n'),
  )

  // 派生值：渲染时直接算（09 题），不需要 state
  const ageSec = dataUpdatedAt ? Math.max(0, Math.floor((now - dataUpdatedAt) / 1000)) : null
  const fresh = ageSec !== null && ageSec * 1000 < STALE_TIME_MS
  const refreshing = isFetching && !isPending // 有数据、且正在后台重新请求

  return (
    <div className="stack">
      <p className="muted">
        订单列表由 TanStack Query 管理：筛选、刷新、模拟失败、标记已支付，盯着「数据更新于」「后台刷新中」和最下面的日志看。
      </p>

      {/* ===================== 区块一：query key + 缓存（staleTime）+ refetch ===================== */}
      <div className="card stack">
        <h3>区块一：筛选就是换 query key —— 5 秒内切回来不发请求</h3>
        <p className="muted">
          切到「已支付」再切回「全部」：5 秒内日志里没有新的 queryFn、数据瞬间出现（缓存命中）；
          等 5 秒后再切，会先显示旧数据、同时出现「后台刷新中」（stale-while-revalidate）。
          右边的徽标用同一个 key 又写了一次 useQuery，但每次只发一次请求（去重）。
        </p>

        <div className="row">
          <label className="row">
            <span>状态筛选：</span>
            {/* 受控 select：本地 UI state；它进了 queryKey，所以改它就是「换一条缓存」 */}
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <OrdersCountBadge status={status} loadOrders={loadOrders} />
          {/* refetch()：手动重新请求，不管新不新鲜。对应 11 题的 reloadFlag + 1 */}
          <button onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? '请求中…' : '刷新'}
          </button>
          <button
            className="btn-danger"
            disabled={isFetching}
            onClick={() => {
              failNextRef.current = true
              refetch()
            }}
          >
            刷新（模拟失败）
          </button>
        </div>

        <p className="muted">
          数据更新于：{dataUpdatedAt ? formatTime(dataUpdatedAt) : '—'}
          {ageSec !== null && (
            <>
              （{ageSec} 秒前，{fresh ? '新鲜' : '已过期'}，staleTime = {STALE_TIME_MS / 1000} 秒）
            </>
          )}
          {refreshing && <strong> · 后台刷新中…</strong>}
        </p>
      </div>

      {/* ===================== 区块二：loading / error / data / mutation ===================== */}
      <div className="card stack">
        <h3>区块二：isPending / isError / data，以及 mutation 后失效重取</h3>
        <p className="muted">
          点某一行「标记为已支付」：按钮变「提交中…」→ mutation 成功 → invalidateQueries → 列表自动重取（日志可见）。
          点行可选中（本地 UI state）：列表重取后选中不丢。「刷新（模拟失败）」后看错误分支与「重试」。
        </p>

        {/* isPending：缓存里没有这个 key 的数据、正在首次加载。有缓存时哪怕在刷新也不会走到这里 */}
        {isPending && <p className="muted">加载中…（isPending：这个 key 还没有任何缓存）</p>}

        {/* isError：请求失败。注意上一次成功的 data 仍在（缓存不会因为一次失败被清空），所以下面的表格照常显示 */}
        {isError && (
          <div className="row">
            <span className="error-text">加载失败：{error.message}</span>
            {/* 重试 = refetch()，对应 11 题「reloadFlag + 1 让 effect 重跑」 */}
            <button className="btn-primary" onClick={() => refetch()} disabled={isFetching}>
              重试
            </button>
            {data && <span className="muted">（下面仍是上一次成功的缓存数据）</span>}
          </div>
        )}

        {/* 空态不是错误：请求成功、恰好没有数据（11 题） */}
        {data && data.items.length === 0 && <p className="muted">没有符合条件的订单</p>}

        {data && data.items.length > 0 && (
          <table>
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
              {data.items.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  style={{ cursor: 'pointer', background: o.id === selectedId ? '#eef6ff' : undefined }}
                >
                  <td>{o.orderNo}</td>
                  <td>{o.customer}</td>
                  <td>￥{o.amount}</td>
                  <td>
                    <span className={`badge badge-${o.status}`}>{ORDER_STATUS_TEXT[o.status]}</span>
                  </td>
                  <td>
                    {o.status === 'pending' && (
                      <button
                        className="btn-primary"
                        // 只禁用被点的那一行：variables 就是这次 mutate(id) 传进去的 id
                        disabled={markPaid.isPending && markPaid.variables === o.id}
                        onClick={(e) => {
                          e.stopPropagation() // 别顺带触发行的选中
                          markPaid.mutate(o.id)
                        }}
                      >
                        {markPaid.isPending && markPaid.variables === o.id ? '提交中…' : '标记为已支付'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {markPaid.isError && <p className="error-text">更新失败：{markPaid.error.message}</p>}
      </div>

      {/* ===================== 区块三：服务端状态 vs 本地 UI state + 日志 ===================== */}
      <div className="card stack">
        <h3>区块三：谁管什么 —— 服务端状态 vs 本地 UI state</h3>
        <p className="muted">
          左边是这个组件里仅剩的 useState；右边是 QueryClient 缓存里的条目（切过几个筛选就有几条，5 分钟没人用会被回收）。
          离开本题再进来：左边归零，右边也是空的 —— 因为本项目每次进入都新建 QueryClient；真实应用只建一次，缓存跨页面存活。
        </p>

        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="stack" style={{ flex: 1, minWidth: 220 }}>
            <strong>本地 UI state（useState）</strong>
            <ul>
              <li>筛选 status：{status}</li>
              <li>选中行 selectedId：{selectedId ?? '无'}</li>
            </ul>
            <span className="muted">只属于这个组件，不需要和服务器同步 —— 这才是 useState 该管的东西。</span>
          </div>
          <div className="stack" style={{ flex: 2, minWidth: 280 }}>
            <strong>服务端状态（QueryClient 缓存里的 ['orders', *]）</strong>
            <ul className="log">
              {cacheSummary === '' ? (
                <li className="log-empty">（空）</li>
              ) : (
                cacheSummary.split('\n').map((line) => <li key={line}>{line}</li>)
              )}
            </ul>
            <span className="muted">
              真相在服务器，这里只是一份可能过期的副本：有主键（key）、有时间戳、有订阅者计数、会失效 ——
              这些概念 useState / Zustand / Pinia 一个都没有，这就是「服务端状态需要专门的工具」的意思。
            </span>
          </div>
        </div>

        <p className="muted">
          一句话总结：TanStack Query 不是 React 核心 API，它只管服务端数据的缓存、同步、重新请求和 mutation；
          useState 不等于完整的服务端状态管理；Context / Zustand / Pinia 管的是客户端状态的跨组件共享，和它解决的问题不完全相同；
          所以不要把 loading、error、server cache 全部手写成大量本地 state（11 / 22 题那样手写只是为了讲清原理）。
        </p>

        <div className="row">
          <strong>运行日志</strong>
          <button className="btn-ghost" onClick={() => setLog([])}>
            清空
          </button>
        </div>
        <ul className="log">
          {log.length === 0 && <li className="log-empty">（暂无）</li>}
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <span className="muted">
          开发环境 StrictMode 下日志开头会是两条「queryFn 执行」加一条「被取消」：壳把组件挂载→卸载→重挂载，
          最后一个订阅者离开时 TanStack 会 abort 在途请求、重挂载后再发一次 —— 正是 queryFn 那个 signal 在起作用（10 题讲过的双跑）。
          Vue 侧没有 StrictMode 双跑（没有一一对应关系），那边的日志开头只有一条。
        </span>
      </div>
    </div>
  )
}

/**
 * 用同一个 key 再写一次 useQuery：不会多发请求。
 *
 * 同一个 QueryClient 里，key 相同的查询共用同一份缓存与同一个在途请求（去重）：
 * 看日志，切换筛选时 queryFn 只执行一次，这个徽标和列表却同时更新。
 * 「共享」靠的是 key + 缓存，不是把 data 通过 props 往下传（08 题），也不是塞进全局 store（16 题）——
 * 这就是「服务端状态归 Query 管，组件想用就用 key 去取」的含义。
 *
 * 注意：TanStack 只按 key 认缓存，不比较 queryFn；两处若写了不同的 queryFn，实际执行哪一个取决于谁触发了这次请求。
 * 官方建议用 queryOptions() 工厂把 key 与 queryFn 绑在一起复用；本题直接把同一个函数通过 props 传下来，效果一样。
 */
function OrdersCountBadge({ status, loadOrders }: { status: StatusFilter; loadOrders: LoadOrders }) {
  const { data, isFetching } = useQuery({ queryKey: ['orders', status], queryFn: loadOrders })
  return (
    <span className="badge" title="同一个 key 的第二个 useQuery：共享缓存，不多发请求">
      {data ? `共 ${data.total} 条` : '…'}
      {isFetching ? ' ⟳' : ''}
    </span>
  )
}
