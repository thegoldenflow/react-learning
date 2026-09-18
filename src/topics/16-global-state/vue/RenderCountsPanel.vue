<script setup lang="ts">
/** 显示渲染次数（对照 react/renderCounts.tsx 的 RenderCountsPanel）。只有这个面板读计数，被计数的组件不读 */
import type { RenderCounts } from './renderCounts'

defineProps<{
  counts: RenderCounts
  entries: Array<[id: string, label: string]>
  label: string
}>()
</script>

<template>
  <div
    class="row"
    :aria-label="label"
  >
    <span class="muted">渲染次数：</span>
    <span
      v-for="[id, name] in entries"
      :key="id"
      class="badge"
      :data-testid="`renders-${id}`"
    >{{ name }} {{ counts.counts[id] ?? 0 }}</span>
    <button @click="counts.reset()">
      计数清零
    </button>
  </div>
</template>
