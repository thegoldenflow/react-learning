<script setup lang="ts">
/**
 * 备注草稿：用来观察「路由参数变了，组件实例还是同一个」。
 * React 对照：react/dataPages.tsx 里的 NoteDraft（useState）。
 */
import { ref } from 'vue'

defineProps<{ orderNo: string }>()

const draft = ref('')
</script>

<template>
  <label class="stack">
    <span>给 {{ orderNo }} 写备注（这是组件自己的 ref）：</span>
    <input
      v-model="draft"
      placeholder="先输入几个字，再点「下一个订单」"
    >
  </label>
</template>
