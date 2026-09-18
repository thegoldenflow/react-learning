<script setup lang="ts">
/**
 * 各区块共用的日志列表（对照 react/LogPanel.tsx）。
 * Vue 这边日志放在各区块的 ref<string[]> / reactive 数组里：push 会触发更新（本身不登记依赖），定时器、监听器、watch 回调里写都一样，不需要组件外的 store。
 * key 用了 index：条目是纯文本 <li>，没有子组件 state，用 index 最多多几次文本更新，不会出现 06 题演示的「状态串到别的行」。
 */
const { lines, label, emptyHint = '（还没有记录，点上面的按钮）' } = defineProps<{
  lines: readonly string[]
  label: string
  emptyHint?: string
}>()
const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <div class="stack">
    <ul
      class="log"
      :aria-label="label"
    >
      <li
        v-if="lines.length === 0"
        class="log-empty"
      >
        {{ emptyHint }}
      </li>
      <li
        v-for="(line, index) in lines"
        :key="index"
      >
        {{ line }}
      </li>
    </ul>
    <div class="row">
      <button
        class="btn-ghost"
        @click="emit('clear')"
      >
        清空日志
      </button>
    </div>
  </div>
</template>
