<script setup lang="ts">
/** 商品详情：数据损坏时在渲染期间 throw（对照 react/BoundaryBasicsDemo.tsx 的 ProductDetail） */
import { computed } from 'vue'

const props = defineProps<{ id: string }>()

const PRODUCTS: Record<string, { name: string; price: number } | null> = {
  p1: { name: '机械键盘', price: 399 },
  p2: { name: '无线鼠标', price: 149 },
  p3: null,
}

const text = computed(() => {
  const product = PRODUCTS[props.id]
  if (!product) throw new Error(`商品 ${props.id} 的数据损坏，无法渲染`)
  return `${product.name}：￥${product.price.toFixed(2)}`
})
</script>

<template>
  <p>{{ text }}</p>
</template>
