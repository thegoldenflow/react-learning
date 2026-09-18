<script setup lang="ts">
/**
 * 区块一的计数器：每个组件实例执行一次自己的 setup，各有一个 count，互不影响（对照 react/WhyStateDemo.tsx 的 StateCounter）。
 * 反过来，把 ref 定义在组件外（普通 .ts 模块的顶层），所有实例共用同一份 —— 那就是全局状态了（16 题）。
 */
import { ref } from 'vue'

const { label } = defineProps<{ label: string }>()
const count = ref(0)
</script>

<template>
  <div class="row">
    <span>✅ 计数器 {{ label }}：<strong :data-testid="`state-count-${label}`">{{ count }}</strong></span>
    <button @click="count++">
      {{ label }} +1
    </button>
  </div>
</template>
