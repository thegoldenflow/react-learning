<script setup lang="ts">
/**
 * 子组件 OrderCard（对照 React 版：React 的 OrderCard 与父组件写在同一个 .tsx 文件里，
 * 因为组件只是函数；Vue 的 SFC 一个文件只能有一个组件，所以拆成这个单独的 .vue 文件）。
 */
import { computed } from 'vue'
import type { OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

// 对应 React 的 interface OrderCardProps
interface Props {
  orderNo: string
  customer: string
  amount: number
  status: OrderStatus
  /** 折扣率 0~1，可选；不传按 0 处理 */
  discount?: number
}

// defineProps 是编译器宏（无需 import、编译期展开）；React 没有宏，props 就是函数参数。
// withDefaults 给可选 props 默认值，对应 React 的参数解构默认值 { discount = 0 }。
// Vue 3.5 起也可以写 const { discount = 0 } = defineProps<Props>()（响应式 props 解构），
// 与 React 的参数解构默认值逐字对应；本文件保留 withDefaults 写法。
const props = withDefaults(defineProps<Props>(), { discount: 0 })

// props 只读：这里写 props.amount = 0 开发期会收到警告；
// React 里改 props 不会警告，纯靠单向数据流约定（两边都不允许，改动应通过回调上浮）。
// 派生值用 computed —— React 里 payable 只是普通 const，因为组件函数每次渲染都会重跑。
const payable = computed(() => props.amount * (1 - props.discount))
</script>

<template>
  <div class="card">
    <div class="row">
      <strong>{{ orderNo }}</strong>
      <!-- React 里这一步是模板字符串手拼 className：`badge badge-${status}` -->
      <span
        class="badge"
        :class="`badge-${status}`"
      >{{ ORDER_STATUS_TEXT[status] }}</span>
    </div>
    <p>客户：{{ customer }}</p>
    <p>
      金额：￥{{ amount.toFixed(2) }}
      <!-- React 里这一步是 {discount > 0 && <span>...</span>} -->
      <span
        v-if="discount > 0"
        class="success-text"
      >
        （立减 {{ Math.round(discount * 100) }}%，应付 ￥{{ payable.toFixed(2) }}）
      </span>
    </p>
  </div>
</template>
