<script setup lang="ts">
/** 区块三的编辑器：草稿存在组件自己的 ref 里（对照 react/PositionDemo.tsx 的 DraftEditor） */
import { ref } from 'vue'

const { customer } = defineProps<{ customer: string }>()
const draft = ref('')
</script>

<template>
  <label class="row">
    给 {{ customer }} 的备注：
    <input
      v-model="draft"
      :aria-label="`${customer} 的备注`"
    >
  </label>
</template>
