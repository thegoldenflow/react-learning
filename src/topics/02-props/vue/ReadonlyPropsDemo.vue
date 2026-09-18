<script setup lang="ts">
/**
 * 区块二：props 只读，改动靠事件上浮。对照 react/ReadonlyPropsDemo.tsx。
 */
import { ref } from 'vue'
import AmountEditor from './AmountEditor.vue'

const { delayMs = 1500 } = defineProps<{ delayMs?: number }>()

// 数据的主人是父组件
const amount = ref(100)
</script>

<template>
  <div class="card stack">
    <h3>区块二：props 只读，改动靠事件上浮</h3>
    <div class="row">
      <span>父组件的 ref：amount = <strong>{{ amount }}</strong></span>
      <button @click="amount += 100">
        父组件 +100
      </button>
    </div>
    <p class="muted">
      试试：先点「稍后读取」，再马上点「父组件 +100」—— Vue 这边读到的是新值（React 那边读到的是点击时的旧值）。
    </p>
    <AmountEditor
      :amount="amount"
      :delay-ms="delayMs"
      @amount-change="amount = $event"
    />
  </div>
</template>
