/**
 * 30 题的查询定义与演示工具（React 侧；Vue 侧 vue/ordersDemo.ts 逐段对应）。
 *
 * 一、查询定义（生产写法【主流】）
 * - key 分层：['orders'] → ['orders', 'list', { status, page }] / ['orders', 'detail', id] / ['orders', 'stats']。
 *   失效时按前缀选范围：invalidateQueries({ queryKey: ['orders'] }) 命中全部，['orders', 'list'] 只命中列表。
 * - queryOptions()：把 queryKey 和 queryFn 绑在一起定义一次，useQuery / useSuspenseQuery / prefetchQuery /
 *   ensureQueryData 都引用同一份。官方 query-options 页原文：「One of the best ways to share queryKey and queryFn
 *   between multiple places, yet keep them co-located to one another, is to use the queryOptions helper.」
 *   这样两个组件用同一个 key 时不可能写出两份不同的 queryFn（「同 key 不同 queryFn」的问题见 Example.tsx 五）。
 * - queryFn 从 QueryFunctionContext 里取 queryKey 和 signal，不依赖组件闭包：参数只从 key 来，
 *   「queryFn 用到的变量都在 key 里」这条规则就不会被违反。
 *
 * 二、演示工具（createOrdersDemo，每次进入本题新建一份）
 * - 日志、失败开关、延迟都在里面，所以 queryFn 能写在组件外；日志是外部 store，组件用 useSyncExternalStore 读
 *   （queryFn / mutation 回调都不在组件渲染里执行，写 React state 也行，但外部 store 更直接，19 题同款做法）。
 * - 演示简化：共用的 mockApi 直接 throw Error、没有 HTTP 状态码；真实项目的 queryFn 要自己检查 response.ok
 *   （fetch 遇到 404 / 500 不会 reject，Example.tsx 七）。
 */
import { QueryClient, queryOptions } from '@tanstack/react-query'
import { fetchOrder, fetchOrders, isAbortError, updateOrder } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type Order, type OrderStatus } from '@/shared/types'

/** 筛选下拉的取值：接口支持的三种状态 + 'all'（与 fetchOrders 的 status 参数一致） */
export type StatusFilter = OrderStatus | 'all'

export const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: ORDER_STATUS_TEXT.pending },
  { value: 'paid', label: ORDER_STATUS_TEXT.paid },
  { value: 'cancelled', label: ORDER_STATUS_TEXT.cancelled },
]

/** 类型守卫：select 的 value 是 string，用守卫收窄而不是 as 断言（28 题） */
export function isStatusFilter(value: string): value is StatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value)
}

/** 本课的 staleTime：数据落地后 5 秒内算「新鲜」，再次用到直接给缓存、不发请求（默认是 0） */
export const STALE_TIME_MS = 5_000
export const PAGE_SIZE = 5

export interface ListFilters {
  status: StatusFilter
  page: number
}

export interface ListPage {
  items: Order[]
  total: number
}

export type OrderStats = Record<OrderStatus, number> & { total: number }

/**
 * query key 工厂：所有 key 都从这里拿，失效时的前缀也从这里拿，拼写不会对不上。
 * 对象放在 key 里没问题：key 会被确定性地哈希，对象的键顺序不影响命中（区块五能看到哈希结果）。
 */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: ListFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string | null) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, 'stats'] as const,
}

/**
 * 本课的 QueryClient 配置（与 vue/queryPlugin.ts 逐字一致，两边的缓存行为才可对照）。演示简化：
 * - retry: false —— 默认失败后静默重试 3 次、指数退避，演示「错误 + 重试」时不想等它；
 * - staleTime: 5 秒 —— 默认 0，也就是「数据一落地就算过期」；生产通常也会设一个非 0 的全局值；
 * - refetchOnWindowFocus: false —— 默认 true：切回窗口时 stale 的查询会后台重取，演示时会干扰观察。
 * 测试里会把 staleTime 调短，所以做成参数。
 */
export function createDemoQueryClient({ staleTime = STALE_TIME_MS }: { staleTime?: number } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime, refetchOnWindowFocus: false },
    },
  })
}

/* ------------------------------ 演示工具 ------------------------------ */

export interface DemoLog {
  add(line: string): void
  clear(): void
  /** 返回不可变数组：内容不变时引用不变，满足 useSyncExternalStore 对快照的要求（14 题） */
  getSnapshot(): readonly string[]
  subscribe(listener: () => void): () => void
}

const timeStamp = () => new Date().toLocaleTimeString('zh-CN', { hour12: false })

function createDemoLog(maxLines = 40): DemoLog {
  let lines: readonly string[] = []
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  return {
    add(line) {
      lines = [...lines, `${timeStamp()}  ${line}`].slice(-maxLines)
      emit()
    },
    clear() {
      lines = []
      emit()
    },
    getSnapshot: () => lines,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** 可以让「下一次」失败的请求种类（只生效一次，用完自动复位） */
export type FailTarget = 'list' | 'detail' | 'stats' | 'mutation'

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

/**
 * 每次进入本题新建一份：日志、失败开关、延迟都在这里。
 * delayMs：页面上 800ms 方便观察，测试里传 20ms（要断言中间态时 300ms）。
 */
export function createOrdersDemo({ delayMs = 800 }: { delayMs?: number } = {}) {
  const log = createDemoLog()
  const failFlags = new Set<FailTarget>()

  /** 读一次失败开关并复位：返回本次请求的 failRate（1 = 必定失败） */
  const takeFailRate = (target: FailTarget) => (failFlags.delete(target) ? 1 : 0)

  /** 给 queryFn 加日志：执行、成功、被取消、失败各记一行。页面上靠它数「queryFn 到底执行了几次」 */
  async function traced<T>(label: string, run: () => Promise<T>, describe: (data: T) => string): Promise<T> {
    log.add(`queryFn 执行：${label}`)
    try {
      const data = await run()
      log.add(`  ↳ ${label} ${describe(data)}`)
      return data
    } catch (err) {
      // 取消不是失败（27 题）：库 abort 了 signal，这里只记一笔再原样抛出，库自己知道怎么处理
      log.add(isAbortError(err) ? `  ↳ ${label} 被取消（signal 触发）` : `  ↳ ${label} 失败：${errorMessage(err)}`)
      throw err
    }
  }

  return {
    log,
    delayMs,

    /** 让下一次某类请求必定失败（演示开关，代替随机失败，结果可复现） */
    failNext(target: FailTarget) {
      failFlags.add(target)
    },

    /** 列表查询：key 里带筛选和页码。queryFn 从 context 取 queryKey 和 signal */
    listOptions(filters: ListFilters) {
      return queryOptions({
        queryKey: orderKeys.list(filters),
        queryFn: ({ queryKey, signal }): Promise<ListPage> => {
          const [, , { status, page }] = queryKey
          const failRate = takeFailRate('list')
          return traced(
            `列表 ${status} 第 ${page} 页${failRate ? '（本次模拟失败）' : ''}`,
            () => fetchOrders({ status, page, pageSize: PAGE_SIZE }, { signal, delayMs, failRate }),
            (data) => `返回 ${data.items.length} 条（共 ${data.total} 条），写入缓存`,
          )
        },
      })
    },

    /**
     * 详情查询 = 依赖查询（区块三）：要等列表里选中一行才有 id。
     * enabled: false 时这条查询照样进缓存，只是不执行 queryFn（status: 'pending' + fetchStatus: 'idle'）。
     * 找不到订单时 throw —— queryFn 不能 resolve 成 undefined。
     */
    detailOptions(id: string | null) {
      return queryOptions({
        queryKey: orderKeys.detail(id),
        enabled: id !== null,
        queryFn: ({ queryKey, signal }): Promise<Order> => {
          const [, , orderId] = queryKey
          if (orderId === null) throw new Error('没有选中订单') // enabled 为 false 时不会走到这里
          const failRate = takeFailRate('detail')
          return traced(
            `详情 ${orderId}${failRate ? '（本次模拟失败）' : ''}`,
            async () => {
              const order = await fetchOrder(orderId, { signal, delayMs, failRate })
              if (!order) throw new Error(`订单不存在：${orderId}`)
              return order
            },
            (order) => `返回 ${order.orderNo}（${ORDER_STATUS_TEXT[order.status]}）`,
          )
        },
      })
    },

    /** 统计查询：给区块四的 useSuspenseQuery 用 */
    statsOptions() {
      return queryOptions({
        queryKey: orderKeys.stats(),
        queryFn: ({ signal }): Promise<OrderStats> => {
          const failRate = takeFailRate('stats')
          return traced(
            `统计${failRate ? '（本次模拟失败）' : ''}`,
            async () => {
              const { items } = await fetchOrders({ pageSize: 100 }, { signal, delayMs, failRate })
              const stats: OrderStats = { total: items.length, pending: 0, paid: 0, cancelled: 0 }
              for (const order of items) stats[order.status] += 1
              return stats
            },
            (stats) => `返回 共 ${stats.total} 单`,
          )
        },
      })
    },

    /**
     * 写操作：标记已支付。演示简化 —— mockApi 的 ORDERS 是模块级可变数组，这里改的「已支付」
     * 在 22 题也看得到，刷新页面才恢复；真实项目里它是一个 PATCH 请求。
     */
    markPaid(id: string): Promise<Order> {
      const failRate = takeFailRate('mutation')
      return updateOrder(id, { status: 'paid' }, { delayMs, failRate })
    },
  }
}

export type OrdersDemo = ReturnType<typeof createOrdersDemo>
