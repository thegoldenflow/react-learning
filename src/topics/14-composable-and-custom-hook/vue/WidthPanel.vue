<script setup lang="ts">
/**
 * WidthPanel（对照 React 版 react/WindowWidthDemo.tsx 里的 WidthPanel；SFC 一个文件一个组件）。
 * 每个实例调用 useWindowWidth 都得到独立的 ref 与独立的 resize 监听。
 */
import { computed } from 'vue'
import { useWindowWidth } from './useWindowWidth'

const props = defineProps<{
  title: string
  /** 宽窄分界线（px）：两个面板用不同阈值，对同一宽度得出不同的「窄 / 宽」结论 */
  threshold: number
}>()

// composable 可以在 if 里调用（不受调用顺序限制），但这里没有理由那样做
const width = useWindowWidth()

// 派生值用 computed（React 版是渲染时直接算的 const）
const label = computed(() => (width.value === null ? '未知' : width.value < props.threshold ? '窄' : '宽'))
</script>

<template>
  <div class="card">
    <div class="row">
      <strong>{{ title }}</strong>
      <span class="badge">{{ label }}（阈值 {{ threshold }}px）</span>
    </div>
    <p>
      当前窗口宽度：<strong>{{ width === null ? '（挂载前未知）' : `${width}px` }}</strong>
    </p>
  </div>
</template>
