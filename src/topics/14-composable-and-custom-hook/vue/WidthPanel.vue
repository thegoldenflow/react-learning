<script setup lang="ts">
/**
 * WidthPanel（对照 React 版：React 的 WidthPanel 和根组件写在同一个 Example.tsx 里，
 * 组件只是函数；Vue 一文件一组件，拆成本文件）。
 * 每个 WidthPanel 实例调用 useWindowWidth 都得到独立的 ref 与独立的 resize 订阅。
 */
import { computed } from 'vue'
import { useWindowWidth } from './useWindowWidth'

const props = defineProps<{
  title: string
  /** 宽窄分界线（px）：两个面板用不同阈值，对同一宽度得出不同的「窄/宽」结论 */
  threshold: number
}>()

// composable 的调用姿势与 React 一致；拿到的是 Ref<number>，脚本里要 .value
const width = useWindowWidth()

// React 版 isNarrow 是渲染期间的普通 const（组件函数每次渲染重算）；
// Vue 的 setup 只跑一次，跨更新的派生值用 computed
const isNarrow = computed(() => width.value < props.threshold)
</script>

<template>
  <div class="card">
    <div class="row">
      <strong>{{ title }}</strong>
      <span class="badge">{{ isNarrow ? '窄' : '宽' }}（阈值 {{ threshold }}px）</span>
    </div>
    <p>
      当前窗口宽度：<strong>{{ width }}px</strong>
    </p>
  </div>
</template>
