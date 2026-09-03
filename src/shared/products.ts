/**
 * 全项目共享的商品目录（25 / 29 题使用）。
 * Vue 示例和 React 示例 import 同一份数据，保证两边场景完全一致；
 * 08 / 16 / 17 题各自保留题内的小数据集，不改动。
 */
import type { Product } from './types'

export const PRODUCTS: Product[] = [
  { id: 'p1', name: '机械键盘', price: 399, category: '键鼠', stock: 12 },
  { id: 'p2', name: '无线鼠标', price: 129, category: '键鼠', stock: 30 },
  { id: 'p3', name: '4K 显示器', price: 1999, category: '显示器', stock: 8 },
  { id: 'p4', name: '便携显示器', price: 899, category: '显示器', stock: 5 },
  { id: 'p5', name: '人体工学椅', price: 1299, category: '家具', stock: 6 },
  { id: 'p6', name: '电动升降桌', price: 2199, category: '家具', stock: 3 },
  { id: 'p7', name: '降噪耳机', price: 699, category: '音频', stock: 15 },
  { id: 'p8', name: '桌面音箱', price: 459, category: '音频', stock: 9 },
]

/** 分类列表（去重、保持首次出现的顺序），供筛选下拉使用 */
export const PRODUCT_CATEGORIES: string[] = [...new Set(PRODUCTS.map((p) => p.category))]
