<script setup lang="ts">
/**
 * 默认值实验用的组件。对照 react/OrderCards.tsx 里的 NoteText。
 * - 默认值只在「没传 / 传 undefined」时生效，null、空串原样收到 —— 和 React 一样（props 页「resolved prop value is undefined」）。
 * - 不一样的是布尔 prop：Vue 把声明成 boolean 的 prop 做「布尔转型」，不传是 false、只写属性名是 true；React 不传就是 undefined。
 */
const { note = '（无备注）', emphasis } = defineProps<{
  note?: string | null
  emphasis?: boolean
}>()

function show(value: unknown) {
  return value === undefined ? 'undefined' : JSON.stringify(value)
}
</script>

<template>
  <code>note = {{ show(note) }} · emphasis = {{ show(emphasis) }}</code>
</template>
