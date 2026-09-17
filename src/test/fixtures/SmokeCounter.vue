<script setup lang="ts">
// 冒烟测试用的最小 SFC：验证 plugin-vue 能在 Vitest 里编译 <script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <button
    type="button"
    @click="count++"
  >
    点击 {{ count }} 次
  </button>
</template>
