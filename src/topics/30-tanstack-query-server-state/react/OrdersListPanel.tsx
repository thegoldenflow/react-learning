/**
 * 区块一 + 区块二：列表查询（queryKey、缓存、status × fetchStatus、分页保留上一页）与写操作（mutation、失效、乐观更新）。
 *
 * 读组件体时数一数：除了几个演示开关，这里没有 loading / error / data 的 useState，也没有 useEffect 取数、
 * AbortController、reloadFlag —— 11 题手写的那一套都在库里。剩下的都是本地 UI state。
 *
 * Vue 对照：vue/OrdersListPanel.vue（同一个 query-core，差别只在响应式接口）。
 */
import { useEffect, useState, useSyncExternalStore } from 'react'
import { keepPreviousData, onlineManager, useMutation, useQuery } from '@tanstack/react-query'
import { ORDER_STATUS_TEXT, type Order } from '@/shared/types'
import {
  PAGE_SIZE,
  STALE_TIME_MS,
  STATUS_OPTIONS,
  isStatusFilter,
  orderKeys,
  type ListFilters,
  type ListPage,
  type OrdersDemo,
} from './ordersDemo'

/** 写操作之后怎么让界面反映新数据：三种做法并排（官方 optimistic-updates 页的两种乐观写法 + 不做乐观） */
type MutationMode = 'invalidate' | 'variables' | 'cache'

const MODE_TEXT: Record<MutationMode, string> = {
  invalidate: '不做乐观更新：等失效重取',
  variables: '乐观 · 用 variables 渲染',
  cache: '乐观 · onMutate 改缓存 + 失败回滚',
}

const formatTime = (ms: number) => new Date(ms).toLocaleTimeString('zh-CN', { hour12: false })

interface Props {
  demo: OrdersDemo
  filters: ListFilters
  onFiltersChange: (next: ListFilters) => void
  keepPrevious: boolean
  onKeepPreviousChange: (next: boolean) => void
  selectedId: string | null
  onSelect: (id: string) => void
  /** 每秒更新一次的时间戳，只用来算「数据落地几秒了」 */
  now: number
}

export function OrdersListPanel({
  demo,
  filters,
  onFiltersChange,
  keepPrevious,
  onKeepPreviousChange,
  selectedId,
  onSelect,
  now,
}: Props) {
  /**
   * ★ useQuery：对象参数是 v5 唯一的签名。queryKey / queryFn 来自 ordersDemo.ts 的 queryOptions()，
   * 这里只叠加一个本组件自己的选项 placeholderData。
   *
   * key 一变（换筛选、翻页），useQuery 就去找那一条缓存：
   * - 有且新鲜（staleTime 内）→ 直接给 data，不发请求；
   * - 有但过期 → 先给旧 data，后台重取（status 仍是 success，fetchStatus 是 fetching）；
   * - 没有 → status 是 pending，执行 queryFn；打开「保留上一页」时先拿上一个 key 的数据垫着（isPlaceholderData）。
   *
   * 这里把返回值整个存成 query 再按属性读，没有用 ...rest 展开：v5 默认只在「渲染时读过的属性」变化时重新渲染
   * （tracked properties），展开会把所有属性都读一遍，追踪就失效了（Example.tsx 五）。
   */
  const query = useQuery({
    ...demo.listOptions(filters),
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  })
  const { data } = query

  /* ---------------------- 演示开关（本地 UI state） ---------------------- */
  const [mode, setMode] = useState<MutationMode>('invalidate')
  const [failMutation, setFailMutation] = useState(false)

  /**
   * 模拟断网：onlineManager 是 query-core 的全局单例（整个页面共用一个）。
   * 离线时发起的请求不会执行 queryFn，而是 fetchStatus: 'paused'，恢复在线且页面可见时自动继续（networkMode 默认 'online'）。
   * 用 Effect 把「本地开关」同步到这个外部系统上（Effect 的本职，10 题）；取消勾选或离开本题时 cleanup 恢复在线。
   * 显示用的 online 直接订阅 onlineManager（useSyncExternalStore，14 题），反映的是全局的真实值。
   */
  const [simulateOffline, setSimulateOffline] = useState(false)
  useEffect(() => {
    if (!simulateOffline) return
    onlineManager.setOnline(false)
    return () => onlineManager.setOnline(true)
  }, [simulateOffline])
  const online = useSyncExternalStore(onlineManager.subscribe, () => onlineManager.isOnline())

  /**
   * ★ useMutation：管「写」。三种「写完之后怎么更新界面」按 mode 切换，失效（invalidateQueries）三种都做。
   *
   * 回调分两层：写在 useMutation 里的（这里）和写在 mutate(id, {...}) 里的（下面按钮上）。
   * useMutation 级的先执行、只要 mutation 结束就会执行；mutate 级的后执行，组件已经卸载时不会执行。
   * onSettled 返回了 invalidateQueries 的 Promise：mutation 会等它完成才算结束，
   * 于是按钮的「提交中…」和列表重取在同一时刻结束。
   */
  const markPaid = useMutation({
    mutationFn: (id: string) => demo.markPaid(id),
    // 回调的最后一个参数 context 里有 client（就是 Provider 上的那个 QueryClient），官方示例现在都这样取
    onMutate: async (id, context) => {
      demo.log.add(`mutation 开始：${id} → 已支付（${MODE_TEXT[mode]}）`)
      if (mode !== 'cache') return undefined
      // 乐观更新 · 改缓存：① 先取消在途的列表请求，免得旧响应回来盖掉乐观值；② 存快照；③ 直接改缓存。
      // 用 setQueriesData 按前缀改：同一订单可能出现在好几页 / 好几个筛选的缓存里
      await context.client.cancelQueries({ queryKey: orderKeys.lists() })
      const snapshots = context.client.getQueriesData<ListPage>({ queryKey: orderKeys.lists() })
      context.client.setQueriesData<ListPage>({ queryKey: orderKeys.lists() }, (old) =>
        old ? { ...old, items: old.items.map((o) => (o.id === id ? { ...o, status: 'paid' } : o)) } : old,
      )
      demo.log.add(`  ↳ onMutate：取消在途列表请求、存了 ${snapshots.length} 份快照、直接改了缓存`)
      // 返回值会传给 onError / onSuccess / onSettled 的 onMutateResult 参数
      return { snapshots }
    },
    onError: (err, _id, onMutateResult, context) => {
      demo.log.add(`useMutation 级 onError：${err.message}`)
      if (onMutateResult) {
        for (const [key, snapshot] of onMutateResult.snapshots) context.client.setQueryData(key, snapshot)
        demo.log.add('  ↳ 用快照把缓存回滚了')
      }
    },
    onSuccess: (updated) => {
      demo.log.add(`useMutation 级 onSuccess：${updated.orderNo} 已支付`)
    },
    // 成功失败都失效重取（官方乐观更新示例的写法）：乐观值只是猜测，最后以服务器为准
    onSettled: (_data, _error, _id, _onMutateResult, context) => {
      demo.log.add("useMutation 级 onSettled：invalidateQueries({ queryKey: ['orders'] })，列表、详情、统计都标记过期")
      return context.client.invalidateQueries({ queryKey: orderKeys.all })
    },
  })

  function handleMarkPaid(order: Order) {
    if (failMutation) demo.failNext('mutation')
    markPaid.mutate(order.id, {
      onSuccess: () => demo.log.add(`mutate 级 onSuccess：${order.orderNo}（组件还挂载着才会执行）`),
      onError: () => demo.log.add(`mutate 级 onError：${order.orderNo}`),
    })
  }

  // 乐观 · variables：mutation 在途时，把「正在标记的那一行」直接画成已支付；失败或结束后自然回到缓存里的真实值
  const optimisticPaidId = mode === 'variables' && markPaid.isPending ? markPaid.variables : undefined

  // 派生值：渲染时直接算（09 题），不需要 state
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const ageSec = query.dataUpdatedAt ? Math.max(0, Math.floor((now - query.dataUpdatedAt) / 1000)) : null

  return (
    <>
      {/* ===================== 区块一 ===================== */}
      <div className="card stack">
        <h3>区块一：queryKey 与缓存 —— status 回答「有没有数据」，fetchStatus 回答「在不在请求」</h3>
        <p className="muted">
          切到「已支付」再切回「全部」：5 秒内日志里没有新的 queryFn（缓存命中）；过了 5 秒再切，先显示旧数据、同时
          fetchStatus 变成 fetching（后台重取）。右边的徽标用同一个 queryOptions 又调了一次 useQuery，但只发一次请求（去重）。
          翻页时勾上「保留上一页」对比 isPlaceholderData；「模拟断网」后点刷新看 paused。
        </p>

        <div className="row">
          <label className="row">
            <span>状态筛选：</span>
            <select
              value={filters.status}
              onChange={(e) => {
                // 换筛选时页码回到 1：新条件下原来的页码可能根本不存在
                if (isStatusFilter(e.target.value)) onFiltersChange({ status: e.target.value, page: 1 })
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <OrdersCountBadge demo={demo} filters={filters} />
          {/* refetch()：不管新不新鲜都重新请求（11 题的 reloadFlag + 1） */}
          <button onClick={() => query.refetch()} disabled={query.isFetching}>
            {query.isFetching ? '请求中…' : '刷新'}
          </button>
          <button
            className="btn-danger"
            disabled={query.isFetching}
            onClick={() => {
              demo.failNext('list')
              query.refetch()
            }}
          >
            刷新（模拟失败）
          </button>
          <label className="row">
            <input type="checkbox" checked={simulateOffline} onChange={(e) => setSimulateOffline(e.target.checked)} />
            <span>模拟断网（onlineManager 当前：{online ? '在线' : '离线'}）</span>
          </label>
        </div>

        <div className="row">
          <button
            onClick={() => onFiltersChange({ ...filters, page: filters.page - 1 })}
            disabled={filters.page <= 1}
          >
            上一页
          </button>
          <span>
            第 {filters.page} / {totalPages} 页
          </span>
          {/* 官方分页示例：占位数据期间禁用「下一页」，免得在旧数据上连续翻页 */}
          <button
            onClick={() => onFiltersChange({ ...filters, page: filters.page + 1 })}
            disabled={query.isPlaceholderData || filters.page >= totalPages}
          >
            下一页
          </button>
          <label className="row">
            <input type="checkbox" checked={keepPrevious} onChange={(e) => onKeepPreviousChange(e.target.checked)} />
            <span>保留上一页（placeholderData: keepPreviousData）</span>
          </label>
        </div>

        <QueryStatusTable
          label="列表查询的状态"
          fields={{
            status: query.status,
            fetchStatus: query.fetchStatus,
            isPending: query.isPending,
            isFetching: query.isFetching,
            isLoading: query.isLoading,
            isRefetching: query.isRefetching,
            isPaused: query.isPaused,
            isPlaceholderData: query.isPlaceholderData,
            isError: query.isError,
            isStale: query.isStale,
          }}
        />
        <p className="muted">
          数据更新于：{query.dataUpdatedAt ? formatTime(query.dataUpdatedAt) : '—'}
          {ageSec !== null && `（${ageSec} 秒前；staleTime = ${STALE_TIME_MS / 1000} 秒）`}
        </p>

        {/* isLoading = 首次加载且正在请求：这时才显示「加载中」。离线时首次加载是 pending + paused，isLoading 为 false */}
        {query.isLoading && <p className="muted">加载中…（isLoading：没有数据、正在请求）</p>}
        {query.isPending && query.isPaused && <p className="muted">已离线，请求暂停，恢复网络后自动继续（pending + paused）</p>}

        {/* isError：请求失败。上一次成功的 data 仍在缓存里（一次失败不会清空缓存），表格照常显示 */}
        {query.isError && (
          <div className="row" role="alert">
            <span className="error-text">加载失败：{query.error.message}</span>
            <button className="btn-primary" onClick={() => query.refetch()} disabled={query.isFetching}>
              重试
            </button>
            {data && <span className="muted">（下面仍是上一次成功的缓存数据）</span>}
          </div>
        )}

        {/* 空态不是错误：请求成功、恰好没有数据（11 题） */}
        {data && data.items.length === 0 && <p className="muted">没有符合条件的订单</p>}

        {data && data.items.length > 0 && (
          <table aria-label="订单列表" style={{ opacity: query.isPlaceholderData ? 0.55 : 1 }}>
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
              {data.items.map((o) => {
                const showPaid = o.id === optimisticPaidId
                const status = showPaid ? 'paid' : o.status
                return (
                  <tr
                    key={o.id}
                    onClick={() => onSelect(o.id)}
                    style={{ cursor: 'pointer', background: o.id === selectedId ? '#eef6ff' : undefined }}
                  >
                    <td>{o.orderNo}</td>
                    <td>{o.customer}</td>
                    <td>￥{o.amount}</td>
                    <td style={{ opacity: showPaid ? 0.6 : 1 }}>
                      <span className={`badge badge-${status}`}>{ORDER_STATUS_TEXT[status]}</span>
                      {showPaid && <span className="muted">（待确认）</span>}
                    </td>
                    <td>
                      {o.status === 'pending' && !showPaid && (
                        <button
                          className="btn-primary"
                          disabled={markPaid.isPending}
                          onClick={(e) => {
                            e.stopPropagation() // 别顺带触发行的选中
                            handleMarkPaid(o)
                          }}
                        >
                          {markPaid.isPending && markPaid.variables === o.id ? '提交中…' : '标记为已支付'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {query.isPlaceholderData && <p className="muted">（半透明的是上一页的数据，新的一页正在加载）</p>}
      </div>

      {/* ===================== 区块二 ===================== */}
      <div className="card stack">
        <h3>区块二：mutation 之后怎么更新 —— 失效重取、两种乐观更新</h3>
        <p className="muted">
          选一种做法，再点上面表格里的「标记为已支付」，对照最下面的日志：两层回调的先后、失效之后谁被重取、失败时怎么回滚。
        </p>
        <fieldset className="row">
          <legend>写完之后怎么更新界面</legend>
          {(Object.keys(MODE_TEXT) as MutationMode[]).map((m) => (
            <label key={m} className="row">
              <input type="radio" name="mutation-mode" checked={mode === m} onChange={() => setMode(m)} />
              <span>{MODE_TEXT[m]}</span>
            </label>
          ))}
        </fieldset>
        <label className="row">
          <input type="checkbox" checked={failMutation} onChange={(e) => setFailMutation(e.target.checked)} />
          <span>让 mutation 失败（看回滚）</span>
        </label>
        <QueryStatusTable
          label="mutation 的状态"
          fields={{
            status: markPaid.status,
            isPending: markPaid.isPending,
            variables: markPaid.variables ?? '—',
            isError: markPaid.isError,
          }}
        />
        {markPaid.isError && (
          <p className="error-text" role="alert">
            更新失败：{markPaid.error.message}
          </p>
        )}
      </div>
    </>
  )
}

/**
 * 同一个 queryOptions 在另一个组件里再用一次：不会多发请求。
 * key 相同的查询共用同一份缓存和同一个在途请求（去重）；「共享」靠的是 key + 缓存，
 * 不是把 data 通过 props 往下传（08 题），也不是塞进全局 store（16 题）。
 */
function OrdersCountBadge({ demo, filters }: { demo: OrdersDemo; filters: ListFilters }) {
  const { data, isFetching } = useQuery(demo.listOptions(filters))
  return (
    <span className="badge" title="同一个 key 的第二个 useQuery：共享缓存，不多发请求">
      {data ? `共 ${data.total} 条` : '…'}
      {isFetching ? ' ⟳' : ''}
    </span>
  )
}

/** 把查询 / mutation 的状态字段画成一张小表（布尔值显示成 true / false） */
export function QueryStatusTable({ label, fields }: { label: string; fields: Record<string, string | boolean> }) {
  return (
    <table aria-label={label}>
      <tbody>
        <tr>
          {Object.keys(fields).map((name) => (
            <th key={name}>
              <code>{name}</code>
            </th>
          ))}
        </tr>
        <tr>
          {Object.entries(fields).map(([name, value]) => (
            <td key={name} data-field={name}>
              {String(value)}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}
