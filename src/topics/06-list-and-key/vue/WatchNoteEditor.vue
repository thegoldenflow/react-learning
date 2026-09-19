<script setup lang="ts">
/**
 * Vue 里重置内部状态的另一种常见写法：实例不换，watch 到 props.order 变了就手动把草稿改回初始值。
 * - watch 的回调默认在组件更新之前执行（「before the owner component's DOM updates」），所以不会先用旧草稿渲染一次（Example.test.ts 用探针验证）。
 *   React 在 Effect 里 setState 做同一件事时会先用旧值渲染一次，官方明确要避免（react/KeyResetDemo.tsx）。
 * - 代价：每个要重置的 ref 都要自己写一遍，子组件里的状态也管不到；:key 会把整棵子树一起重来。
 */
import { ref, watch } from 'vue'
import type { Order } from '@/shared/types'

const props = defineProps<{ order: Order }>()

const initialDraft = () => `${props.order.customer}的备注：`
const draft = ref(initialDraft())
const mountedFor = props.order.orderNo
watch(
  () => props.order.id,
  () => {
    draft.value = initialDraft()
  },
)
</script>

<template>
  <div class="stack">
    <span class="muted">当前 props.order：{{ order.orderNo }}（{{ order.customer }}）· 本实例创建时的订单：{{ mountedFor }}</span>
    <textarea
      v-model="draft"
      rows="2"
      aria-label="草稿备注"
    />
    <span
      class="success-text"
      data-testid="instance-status"
    >
      {{ mountedFor === order.orderNo ? '实例还没换过订单' : `同一个实例（创建时是 ${mountedFor}），草稿由 watch 重置` }}
    </span>
  </div>
</template>
