/**
 * 全项目共享的业务类型：订单、用户、商品、购物车。
 * Vue 示例和 React 示例 import 同一份类型，保证两边场景完全一致。
 */

export type OrderStatus = 'pending' | 'paid' | 'cancelled'

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  orderNo: string
  customer: string
  amount: number
  status: OrderStatus
  createdAt: string
  items: OrderItem[]
}

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

/** 订单状态的中文展示文案，多处示例共用 */
export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  cancelled: '已取消',
}
