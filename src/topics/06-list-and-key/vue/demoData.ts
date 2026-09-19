/**
 * 本题 Vue 侧区块二、三共用的订单数据（和 react/demoData.ts 内容一样，两边各放一份，互不依赖）。
 */
import type { Order } from '@/shared/types'

export const INITIAL_ORDERS: Order[] = [
  { id: 'o1', orderNo: 'SO-1001', customer: '张伟', amount: 528, status: 'pending', createdAt: '2026-08-21', items: [] },
  { id: 'o2', orderNo: 'SO-1002', customer: '李娜', amount: 129, status: 'paid', createdAt: '2026-08-22', items: [] },
  { id: 'o3', orderNo: 'SO-1003', customer: '王强', amount: 2680, status: 'paid', createdAt: '2026-08-23', items: [] },
  { id: 'o4', orderNo: 'SO-1004', customer: '赵敏', amount: 88, status: 'cancelled', createdAt: '2026-08-24', items: [] },
]

/**
 * 【常用】本地新建的订单：id 在「创建数据的时候」生成并存进数据，而不是渲染时生成（react.dev「when creating items」；Vue 文档没单独讲 key 从哪来，道理相同）。
 * crypto.randomUUID() 只在安全上下文（HTTPS、localhost）里可用（MDN ③），没有时退回计数器。
 */
let localCounter = 0
export function createLocalOrder(label: string): Order {
  localCounter += 1
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? `local-${crypto.randomUUID()}` : `local-${localCounter}`
  return { id, orderNo: `NEW-${localCounter}`, customer: label, amount: 0, status: 'pending', createdAt: '2026-09-18', items: [] }
}
