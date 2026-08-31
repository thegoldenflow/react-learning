<script setup lang="ts">
/**
 * 子组件 OrderNoteEditor：演示「换 :key 强制重置组件内部状态」。
 * （React 版的 OrderNoteEditor 与父组件同在一个 .tsx 文件里；Vue 一文件一组件，必须单独拆出来。）
 *
 * 它对「自己会不会被重置」一无所知——重置与否完全由父组件给不给 :key 决定，这点和 React 一致。
 */
import { computed, ref } from 'vue'
import type { Order } from '@/shared/types'

const props = defineProps<{ order: Order }>()

// ref 的初始值只在「本实例 setup 执行的那一次」求值，之后 props 变了它不会自动同步。
// 这一条和 React 的 useState 完全同理：它不是 computed，也不是带 immediate 的 watch
const draft = ref(`${props.order.customer}的备注：`)
// 只读不改的 ref，当作「实例身份证」：它 !== 当前 props.order.orderNo 就说明实例被复用了
const mountedFor = ref(props.order.orderNo)
const isFresh = computed(() => mountedFor.value === props.order.orderNo)
</script>

<template>
  <div class="stack">
    <span class="muted">当前 props.order：{{ order.orderNo }}（{{ order.customer }}）</span>
    <span class="muted">本实例创建时对应的订单：{{ mountedFor }}</span>
    <!-- v-model 的草稿存在组件自己的 ref 里，正是这次要观察的「内部状态」；
         React 那边是受控 textarea + useState，两边现象完全一致 -->
    <textarea
      v-model="draft"
      rows="2"
    />
    <span :class="isFresh ? 'success-text' : 'error-text'">
      {{ isFresh ? '实例是新创建的：draft 已按新订单重新初始化' : `实例被复用：draft 还停留在 ${mountedFor} 的草稿上` }}
    </span>
  </div>
</template>
