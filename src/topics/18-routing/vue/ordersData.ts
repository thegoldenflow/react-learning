/**
 * 题 18 的常量订单数据（与 React 版 Example.tsx 顶部的 ORDERS 完全相同，不发请求，聚焦路由）。
 * React 版把数据、五个页面组件、路由表全写在一个 .tsx 文件里；
 * Vue 惯例一文件一组件，页面拆成多个 .vue 之后，共享数据就单独抽成这个模块。
 */
import type { Order } from '@/shared/types'

export const ORDERS: Order[] = [
  {
    id: 'o1',
    orderNo: 'SO-2026-0001',
    customer: '张伟',
    amount: 557,
    status: 'paid',
    createdAt: '2026-08-01',
    items: [
      { id: 'o1-1', name: '机械键盘', price: 299, quantity: 1 },
      { id: 'o1-2', name: '无线鼠标', price: 129, quantity: 2 },
    ],
  },
  {
    id: 'o2',
    orderNo: 'SO-2026-0002',
    customer: '王芳',
    amount: 1299,
    status: 'pending',
    createdAt: '2026-08-03',
    items: [{ id: 'o2-1', name: '人体工学椅', price: 1299, quantity: 1 }],
  },
  {
    id: 'o3',
    orderNo: 'SO-2026-0003',
    customer: '李娜',
    amount: 89,
    status: 'cancelled',
    createdAt: '2026-08-05',
    items: [{ id: 'o3-1', name: '鼠标垫', price: 89, quantity: 1 }],
  },
  {
    id: 'o4',
    orderNo: 'SO-2026-0004',
    customer: '刘强',
    amount: 2458,
    status: 'paid',
    createdAt: '2026-08-08',
    items: [
      { id: 'o4-1', name: '4K 显示器', price: 2199, quantity: 1 },
      { id: 'o4-2', name: 'HDMI 线', price: 259, quantity: 1 },
    ],
  },
  {
    id: 'o5',
    orderNo: 'SO-2026-0005',
    customer: '陈静',
    amount: 668,
    status: 'pending',
    createdAt: '2026-08-10',
    items: [{ id: 'o5-1', name: '降噪耳机', price: 668, quantity: 1 }],
  },
]
