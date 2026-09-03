<script setup lang="ts">
/**
 * ✅ 正确的列表组件（对照 React 侧 Example.tsx 里的 ProductList 函数组件）。
 *
 * 归属：本组件【什么 state 都不拥有】。它只接收父组件已经过滤好的 products，负责画表；
 * 它连 keyword / category 的存在都不知道 —— 过滤是父组件的事（09 题：派生值用 computed，不另开 state）。
 * 组件越「笨」越好复用：这张表同样可以拿去画购物车、画搜索结果、画任何 Product[]。
 */
import type { Product } from '@/shared/types'

defineProps<{
  /** 已经由父组件过滤好的列表 */
  products: Product[]
}>()
</script>

<template>
  <p
    v-if="products.length === 0"
    class="muted"
  >
    没有匹配的商品
  </p>
  <table v-else>
    <thead>
      <tr>
        <th>商品</th>
        <th>分类</th>
        <th>单价</th>
        <th>库存</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="p in products"
        :key="p.id"
      >
        <td>{{ p.name }}</td>
        <td><span class="badge">{{ p.category }}</span></td>
        <td>￥{{ p.price }}</td>
        <td>{{ p.stock }}</td>
      </tr>
    </tbody>
  </table>
</template>
