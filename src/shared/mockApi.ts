/**
 * 共享模拟 API —— Vue 示例和 React 示例使用同一份数据源，
 * 方便对比两个框架处理同一个请求的方式（10 / 11 / 18 / 19 / 22 / 27 / 30 题使用）。
 *
 * 特性：
 * - 模拟网络延迟（默认 600ms）
 * - 支持 AbortSignal 取消（与 fetch 的标准取消机制一致）
 * - 可配置失败率 failRate，用来演示 error / retry
 * - 订单数据保存在模块级内存里，删除 / 编辑在页面刷新前会一直生效
 */
import type { Order, OrderStatus, User } from './types'

const USERS: User[] = [
  { id: 'u1', name: '张伟', email: 'zhangwei@example.com', role: 'admin' },
  { id: 'u2', name: '王芳', email: 'wangfang@example.com', role: 'editor' },
  { id: 'u3', name: '李娜', email: 'lina@example.com', role: 'viewer' },
  { id: 'u4', name: '刘强', email: 'liuqiang@example.com', role: 'editor' },
  { id: 'u5', name: '陈静', email: 'chenjing@example.com', role: 'viewer' },
  { id: 'u6', name: '杨洋', email: 'yangyang@example.com', role: 'viewer' },
  { id: 'u7', name: '赵敏', email: 'zhaomin@example.com', role: 'admin' },
  { id: 'u8', name: '孙丽', email: 'sunli@example.com', role: 'editor' },
]

let nextOrderSeq = 100
function makeOrder(
  seq: number,
  customer: string,
  amount: number,
  status: OrderStatus,
  createdAt: string,
): Order {
  return {
    id: `o${seq}`,
    orderNo: `SO-2026-${String(seq).padStart(4, '0')}`,
    customer,
    amount,
    status,
    createdAt,
    items: [
      { id: `o${seq}-1`, name: '机械键盘', price: 299, quantity: 1 },
      { id: `o${seq}-2`, name: '无线鼠标', price: 129, quantity: 2 },
    ],
  }
}

const ORDERS: Order[] = [
  makeOrder(1, '张伟', 557, 'paid', '2026-08-01'),
  makeOrder(2, '王芳', 1299, 'pending', '2026-08-03'),
  makeOrder(3, '李娜', 89, 'cancelled', '2026-08-05'),
  makeOrder(4, '刘强', 2458, 'paid', '2026-08-08'),
  makeOrder(5, '陈静', 668, 'pending', '2026-08-10'),
  makeOrder(6, '杨洋', 320, 'paid', '2026-08-12'),
  makeOrder(7, '赵敏', 1780, 'pending', '2026-08-15'),
  makeOrder(8, '孙丽', 455, 'cancelled', '2026-08-17'),
  makeOrder(9, '周杰', 999, 'paid', '2026-08-19'),
  makeOrder(10, '吴磊', 76, 'pending', '2026-08-21'),
  makeOrder(11, '徐涛', 3200, 'paid', '2026-08-23'),
  makeOrder(12, '朱琳', 540, 'pending', '2026-08-25'),
  makeOrder(13, '马超', 158, 'paid', '2026-08-26'),
  makeOrder(14, '胡歌', 2100, 'cancelled', '2026-08-27'),
  makeOrder(15, '林霞', 860, 'pending', '2026-08-28'),
]

function createAbortError(): DOMException {
  return new DOMException('请求已取消', 'AbortError')
}

/**
 * 服务端校验失败（相当于 HTTP 400 / 422 带字段信息）：前端应该把 message 显示在 field 对应的输入框旁边。
 * 和网络错误不同，原样重试没有意义，要用户改了输入再提交（19 题的错误分层）。
 */
export class ApiFieldError extends Error {
  readonly field: string

  constructor(field: string, message: string) {
    super(message)
    this.name = 'ApiFieldError'
    this.field = field
  }
}

/** 判断一个异常是否是「请求被取消」——取消不是失败，UI 不应把它当错误展示 */
export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError())
      return
    }
    const onAbort = () => {
      clearTimeout(timer)
      reject(createAbortError())
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export interface RequestOptions {
  /** 传入 AbortSignal 即可取消请求（对应 fetch 的同名参数） */
  signal?: AbortSignal
  /** 0~1，本次请求随机失败的概率，默认 0 */
  failRate?: number
  /** 模拟延迟毫秒数，默认 600 */
  delayMs?: number
}

async function simulate(options: RequestOptions = {}): Promise<void> {
  const { signal, failRate = 0, delayMs = 600 } = options
  await delay(delayMs, signal)
  if (Math.random() < failRate) {
    throw new Error('网络错误：请求失败，请重试')
  }
}

/** 按关键词搜索用户（10 / 11 / 14 / 27 题使用）。keyword 为空时返回全部用户。 */
export async function fetchUsers(keyword: string, options?: RequestOptions): Promise<User[]> {
  await simulate(options)
  const kw = keyword.trim().toLowerCase()
  if (!kw) return [...USERS]
  return USERS.filter(
    (u) => u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw),
  )
}

export interface FetchOrdersParams {
  keyword?: string
  status?: OrderStatus | 'all'
  page?: number
  pageSize?: number
}

export interface Paged<T> {
  items: T[]
  total: number
}

/** 查询订单列表，支持关键词 / 状态筛选 / 分页（22 / 30 题使用）。 */
export async function fetchOrders(
  params: FetchOrdersParams = {},
  options?: RequestOptions,
): Promise<Paged<Order>> {
  await simulate(options)
  const { keyword = '', status = 'all', page = 1, pageSize = 5 } = params
  const kw = keyword.trim().toLowerCase()
  const list = ORDERS.filter(
    (o) =>
      (status === 'all' || o.status === status) &&
      (!kw || o.orderNo.toLowerCase().includes(kw) || o.customer.toLowerCase().includes(kw)),
  )
  const start = (page - 1) * pageSize
  return {
    items: list.slice(start, start + pageSize).map((o) => structuredClone(o)),
    total: list.length,
  }
}

/**
 * 按 id 查询单个订单（18 题详情页使用）。
 * 找不到时返回 null，由调用方决定怎么处理（例如 18 题的 loader 抛 404）。
 */
export async function fetchOrder(id: string, options?: RequestOptions): Promise<Order | null> {
  await simulate(options)
  const order = ORDERS.find((o) => o.id === id)
  return order ? structuredClone(order) : null
}

/** 更新订单（22 题编辑、30 题 mutation 使用）。返回更新后的订单副本。 */
export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, 'customer' | 'amount' | 'status'>>,
  options?: RequestOptions,
): Promise<Order> {
  await simulate(options)
  const order = ORDERS.find((o) => o.id === id)
  if (!order) throw new Error(`订单不存在：${id}`)
  Object.assign(order, patch)
  return structuredClone(order)
}

/** 删除订单（22 题使用）。 */
export async function deleteOrder(id: string, options?: RequestOptions): Promise<void> {
  await simulate(options)
  const index = ORDERS.findIndex((o) => o.id === id)
  if (index === -1) throw new Error(`订单不存在：${id}`)
  ORDERS.splice(index, 1)
}

export interface SubmitOrderPayload {
  customer: string
  amount: number
}

/**
 * 创建订单（19 题提交表单使用）。
 * 客户名称为空、金额不是正数时模拟服务端校验失败，抛 ApiFieldError；failRate 命中时抛普通 Error（网络错误，可重试）。
 */
export async function submitOrder(
  payload: SubmitOrderPayload,
  options?: RequestOptions,
): Promise<Order> {
  await simulate(options)
  if (!payload.customer.trim()) throw new ApiFieldError('customer', '服务端校验失败：客户名称不能为空')
  if (!(payload.amount > 0)) throw new ApiFieldError('amount', '服务端校验失败：金额必须大于 0')
  const seq = nextOrderSeq++
  const order = makeOrder(seq, payload.customer.trim(), payload.amount, 'pending', '2026-08-28')
  ORDERS.unshift(order)
  return structuredClone(order)
}
