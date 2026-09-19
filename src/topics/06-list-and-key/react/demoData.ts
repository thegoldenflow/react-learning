/**
 * 本题区块二、三共用的订单数据（组件文件只导出组件，常量放在 .ts 里，01 题二-11）。
 */
import type { Order } from '@/shared/types'

export const INITIAL_ORDERS: Order[] = [
  { id: 'o1', orderNo: 'SO-1001', customer: '张伟', amount: 528, status: 'pending', createdAt: '2026-08-21', items: [] },
  { id: 'o2', orderNo: 'SO-1002', customer: '李娜', amount: 129, status: 'paid', createdAt: '2026-08-22', items: [] },
  { id: 'o3', orderNo: 'SO-1003', customer: '王强', amount: 2680, status: 'paid', createdAt: '2026-08-23', items: [] },
  { id: 'o4', orderNo: 'SO-1004', customer: '赵敏', amount: 88, status: 'cancelled', createdAt: '2026-08-24', items: [] },
]

/**
 * 本地新建的订单：id 在「创建数据的时候」生成并写进数据，而不是渲染时生成（「when creating items」）。
 * crypto.randomUUID() 只在安全上下文（HTTPS、localhost）里可用（MDN ③）；用 http + 局域网 IP 打开开发服务器时没有它，这里退回计数器。
 * id 带 local- 前缀：本地临时项和后端数据合在一个列表里时，后端的 key 用 server-…，免得撞（Example.tsx 七）。
 */
let localCounter = 0
export function createLocalOrder(label: string): Order {
  localCounter += 1
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? `local-${crypto.randomUUID()}` : `local-${localCounter}`
  return { id, orderNo: `NEW-${localCounter}`, customer: label, amount: 0, status: 'pending', createdAt: '2026-09-18', items: [] }
}
