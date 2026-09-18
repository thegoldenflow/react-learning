<script setup lang="ts">
/**
 * 区块一的订单卡。对照 react/OrderCards.tsx 里的 OrderCard。
 * Vue 一个 SFC 只有一个模板组件（sfc-spec：「at most one top-level <template> block」），所以拆成单独的文件；
 * React 的组件只是函数，一个 .tsx 里放几个都行。
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

// defineProps 是编译器宏（不用 import，编译期展开）；React 没有宏，props 就是函数参数。
// 响应式 props 解构【主流·3.5 起】：默认值直接用 JS 解构默认值写，和 React 的参数解构默认值写法一样。
// 编译器会把后面对 amount / discount 的访问改写成 __props.amount / __props.discount，所以它们仍然是响应式的（不是普通局部变量）。
// 3.4 及以前没有这个特性，要写 const props = withDefaults(defineProps<Props>(), { discount: 0 })【旧写法】。
const { orderNo, customer, amount, status, discount = 0 } = defineProps<Props>()

// 派生值用 computed：setup 只执行一次，要让它跟着 props 变就得放进 computed（React 里是渲染时的普通 const，09 题）。
const payable = computed(() => amount * (1 - discount))
</script>

<template>
  <div class="card">
    <div class="row">
      <strong>{{ orderNo }}</strong>
      <span
        class="badge"
        :class="`badge-${status}`"
      >{{ ORDER_STATUS_TEXT[status] }}</span>
    </div>
    <p>客户：{{ customer }}</p>
    <p>
      金额：￥{{ amount.toFixed(2) }}
      <span
        v-if="discount > 0"
        class="success-text"
      >
        （立减 {{ Math.round(discount * 100) }}%，应付 ￥{{ payable.toFixed(2) }}）
      </span>
    </p>
  </div>
</template>
