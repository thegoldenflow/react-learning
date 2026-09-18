/**
 * 30 题的查询定义与演示工具（Vue 侧；与 react/ordersDemo.ts 逐段对应，讲解以 React 侧为准）。
 *
 * 和 React 侧的差别：
 * - queryOptions / QueryClient 从 @tanstack/vue-query 导入（它在 query-core 外面包了一层 Vue 的响应式，
 *   返回值是 ref）；缓存规则、key 哈希、默认值都来自同一个 @tanstack/query-core。
 * - 参数收「普通值或 getter」：调用方传 () => props.x 这样的 getter，直接放进 queryKey，
 *   库会自动追踪，值一变就换 key；enabled 同理。这是官方 Vue reactivity 指南的写法，原文：
 *   「In vue query any reactive properties within a query key are tracked for changes automatically.」
 *   「enabled and queryKey are the two query options that can accept reactive values.」
 *   queryFn 里用 toValue() 读当前值（指南示例同样如此）。React 侧不需要这些：每次渲染把新的值传进来就是新 key。
 * - 日志直接用 ref 存，组件模板里读它就会更新（React 侧用外部 store + useSyncExternalStore）。
 */
import { ref, toValue, type Ref } from 'vue'
import { QueryClient, queryOptions } from '@tanstack/vue-query'
import { fetchOrder, fetchOrders, isAbortError, updateOrder } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type Order, type OrderStatus } from '@/shared/types'

export type StatusFilter = OrderStatus | 'all'

export const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: ORDER_STATUS_TEXT.pending },
  { value: 'paid', label: ORDER_STATUS_TEXT.paid },
  { value: 'cancelled', label: ORDER_STATUS_TEXT.cancelled },
]

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
 * 普通值或 getter。指南也允许直接放 ref，但 vue-query 5.102.8 的类型在「queryOptions() + key 里放 ref」
 * 这个组合下推断不出来（vue-tsc 报 No overload matches，2026-09-17 实测），getter 没有这个问题，
 * 而且指南本来就推荐简单取值用 getter、不必包 computed。
 */
export type MaybeGetter<T> = T | (() => T)

/**
 * key 工厂：结构与 React 侧相同（key 的设计与框架无关）。list / detail 的参数可以是 getter，
 * 库在算哈希之前会把它们解开，所以缓存里的 key 与 React 侧逐字一样。
 */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: MaybeGetter<ListFilters>) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: MaybeGetter<string | null>) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, 'stats'] as const,
}

/** 与 React 侧同样的演示配置（retry: false、staleTime 5 秒、关掉窗口聚焦重取），测试里可以把 staleTime 调短 */
export function createDemoQueryClient({ staleTime = STALE_TIME_MS }: { staleTime?: number } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime, refetchOnWindowFocus: false },
    },
  })
}

export interface DemoLog {
  lines: Readonly<Ref<readonly string[]>>
  add(line: string): void
  clear(): void
}

const timeStamp = () => new Date().toLocaleTimeString('zh-CN', { hour12: false })

function createDemoLog(maxLines = 40): DemoLog {
  const lines = ref<string[]>([])
  return {
    lines,
    add(line) {
      lines.value.push(`${timeStamp()}  ${line}`)
      if (lines.value.length > maxLines) lines.value.splice(0, lines.value.length - maxLines)
    },
    clear() {
      lines.value = []
    },
  }
}

export type FailTarget = 'list' | 'detail' | 'stats' | 'mutation'

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

export function createOrdersDemo({ delayMs = 800 }: { delayMs?: number } = {}) {
  const log = createDemoLog()
  const failFlags = new Set<FailTarget>()
  const takeFailRate = (target: FailTarget) => (failFlags.delete(target) ? 1 : 0)

  async function traced<T>(label: string, run: () => Promise<T>, describe: (data: T) => string): Promise<T> {
    log.add(`queryFn 执行：${label}`)
    try {
      const data = await run()
      log.add(`  ↳ ${label} ${describe(data)}`)
      return data
    } catch (err) {
      log.add(isAbortError(err) ? `  ↳ ${label} 被取消（signal 触发）` : `  ↳ ${label} 失败：${errorMessage(err)}`)
      throw err
    }
  }

  return {
    log,
    delayMs,

    failNext(target: FailTarget) {
      failFlags.add(target)
    },

    listOptions(filters: MaybeGetter<ListFilters>) {
      return queryOptions({
        queryKey: orderKeys.list(filters),
        queryFn: ({ signal }): Promise<ListPage> => {
          const { status, page } = toValue(filters)
          const failRate = takeFailRate('list')
          return traced(
            `列表 ${status} 第 ${page} 页${failRate ? '（本次模拟失败）' : ''}`,
            () => fetchOrders({ status, page, pageSize: PAGE_SIZE }, { signal, delayMs, failRate }),
            (data) => `返回 ${data.items.length} 条（共 ${data.total} 条），写入缓存`,
          )
        },
      })
    },

    detailOptions(id: MaybeGetter<string | null>) {
      return queryOptions({
        queryKey: orderKeys.detail(id),
        // enabled 也接受 getter：选中的 id 一变，库重新判断要不要请求
        enabled: () => toValue(id) !== null,
        queryFn: ({ signal }): Promise<Order> => {
          const orderId = toValue(id)
          if (orderId === null) throw new Error('没有选中订单')
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

    markPaid(id: string): Promise<Order> {
      const failRate = takeFailRate('mutation')
      return updateOrder(id, { status: 'paid' }, { delayMs, failRate })
    },
  }
}

export type OrdersDemo = ReturnType<typeof createOrdersDemo>
