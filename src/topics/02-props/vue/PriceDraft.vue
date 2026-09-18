<script setup lang="ts">
/**
 * 区块三：有意「只取初始值」的草稿。对照 react/MirrorPropsDemo.tsx 里的 PriceDraft。
 * 这就是 props 页 One-Way Data Flow 的第一种情形：「The prop is used to pass in an initial value」→ const counter = ref(props.initialCounter)。
 * 命名成 initialPrice 说明意图；要按新的初始值重来，父组件换 :key（06 题）。
 */
import { ref } from 'vue'

const { initialPrice } = defineProps<{ initialPrice: number }>()

const draft = ref(initialPrice)
</script>

<template>
  <div class="row">
    <span>草稿价（initialPrice 只取初始值）：<strong data-testid="draft">{{ draft }}</strong></span>
    <button @click="draft -= 10">
      草稿 −10
    </button>
    <button @click="draft += 10">
      草稿 +10
    </button>
  </div>
</template>
