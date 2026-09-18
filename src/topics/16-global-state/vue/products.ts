/** 16 题 Vue 侧的演示商品（与 react/CartDemo.tsx 的 DEMO_PRODUCTS 相同；两侧各放一份，互不 import） */
import type { Product } from '@/shared/types'

export const DEMO_PRODUCTS: Product[] = [
  { id: 'p1', name: '机械键盘', price: 399, category: '外设', stock: 12 },
  { id: 'p2', name: '无线鼠标', price: 149, category: '外设', stock: 20 },
  { id: 'p3', name: '降噪耳机', price: 899, category: '音频', stock: 8 },
  { id: 'p4', name: '4K 显示器', price: 1999, category: '显示', stock: 5 },
]
