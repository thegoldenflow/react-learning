<script setup lang="ts">
/**
 * 带内部状态的子组件：草稿存在它自己的 ref 里（对照 react/KeyResetDemo.tsx 里的 OrderNoteEditor）。
 * 它对「自己会不会被重置」一无所知，重置与否由父组件给不给 :key 决定。
 * ref 的初始值只在这个实例的 setup 执行时算一次，之后 props.order 变了 draft 也不跟着变 —— 和 React 的 useState 初始值同理（它不是 computed，也不是带 immediate 的 watch）。
 * （一个 SFC 只有一个模板组件，所以它单独一个文件；React 那边和父组件写在同一个 .tsx 里。）
 */
import { computed, ref } from 'vue'
import type { Order } from '@/shared/types'

const props = defineProps<{ order: Order }>()

const draft = ref(`${props.order.customer}的备注：`)
// 「实例身份证」：记下这个实例是为哪个订单创建的（setup 只执行一次，普通常量就够）
const mountedFor = props.order.orderNo
const isFresh = computed(() => mountedFor === props.order.orderNo)
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
      :class="isFresh ? 'success-text' : 'error-text'"
      data-testid="instance-status"
    >
      {{ isFresh ? '新实例：草稿按新订单重新初始化' : `被复用的实例：草稿还是 ${mountedFor} 的` }}
    </span>
  </div>
</template>
