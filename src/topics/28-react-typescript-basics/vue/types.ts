/**
 * 28 题 Vue 侧共享的类型与常量（Example.vue / OrderFilterForm.vue / OrderCard.vue 三个组件共用）。
 *
 * 为什么要单独一个 .ts 文件：<script setup> 不能 export 类型（它编译成组件的 setup 函数，模块导出被占用了），
 * 跨组件共享的 interface / type / 常量只能放进普通 .ts 模块再各自 import（27 题的 panelTypes.ts 是同一做法）。
 * React 侧这些定义全部写在 Example.tsx 里 —— .tsx 就是普通 TS 模块，想 export 什么都行，子组件也和父组件同文件。
 *
 * 注意：这里没有任何 Vue / React 的 API —— 联合类型、as const + satisfies、Record、类型守卫都是 TypeScript 本身的东西。
 * 「TypeScript 类型不是 React 独有」这句话，看这个文件最直观。
 */
import { ORDER_STATUS_TEXT, type OrderStatus } from '@/shared/types'

/** 字符串联合类型的扩展：筛选条件比订单状态多一个 'all'（不限状态）。React 侧同一行在 Example.tsx 顶部 */
export type StatusFilter = OrderStatus | 'all'

/**
 * 「类型 → 值」：模板里 v-for 需要一个数组，联合类型在运行时不存在。
 * as const 冻结成只读元组保留字面量；satisfies 检查每个成员合法但不拓宽类型。
 * satisfies 只保证「都合法」不保证「都出现」；「一个都不能少」的检查靠下面的 Record。
 */
export const STATUS_FILTER_OPTIONS = ['all', 'pending', 'paid', 'cancelled'] as const satisfies readonly StatusFilter[]

/** Record<K, V>：键必须覆盖 StatusFilter 全部成员，将来加状态忘了补文案会在这里编译报错 */
export const STATUS_FILTER_LABEL: Record<StatusFilter, string> = { all: '全部', ...ORDER_STATUS_TEXT }

/**
 * 类型守卫：value is StatusFilter —— 通过后调用处的 string 自动收窄成 StatusFilter。
 * 用它代替 (value as StatusFilter)：<select> 的值静态类型只是 string，来自外部（URL / JSON / localStorage）时断言等于自欺。
 */
export function isStatusFilter(value: string): value is StatusFilter {
  return STATUS_FILTER_OPTIONS.some((option) => option === value)
}

/** 对象类型：筛选条件的形状。minAmount 可选 —— 不筛金额时干脆没有这个字段，比 0 / -1 哨兵值清楚 */
export interface OrderFilter {
  keyword: string
  status: StatusFilter
  /** 最低金额（含）；不限制时省略 */
  minAmount?: number
}

export const DEFAULT_FILTER: OrderFilter = { keyword: '', status: 'all' }
