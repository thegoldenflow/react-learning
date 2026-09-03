<script setup lang="ts">
/**
 * 订单卡片（对照 React 侧 Example.tsx 里的 OrderCard 函数组件）。
 *
 * React 侧的 interface OrderCardProps { order; selected?; onSelect?; children? } 在 Vue 里拆成三部分：
 * - order / selected?  → defineProps。selected?: boolean 不需要 withDefaults：Vue 对布尔 prop 有特殊处理，缺省自动是 false
 *   （eslint 的 vue/require-default-prop 也豁免布尔），React 侧要靠解构默认值 selected = false
 * - onSelect?          → defineEmits<{ select: [id: string, e: MouseEvent] }>()。注意这个 MouseEvent 是【DOM 全局类型】，
 *   父组件拿到的就是浏览器原生事件；React 侧的参数类型是从 'react' 导入的合成事件 MouseEvent<HTMLButtonElement>
 *   （为了不遮蔽 DOM 的同名类型，那边起了别名 ReactMouseEvent）
 * - children?          → 默认 <slot />。React 的 children 是一个 ReactNode 类型的 prop（值）；插槽是模板机制 —— 没有一一对应关系
 */
import { ORDER_STATUS_TEXT, type Order } from '@/shared/types'

interface Props {
  order: Order
  /** 可选布尔：缺省为 false，不需要默认值声明 */
  selected?: boolean
}

// 模板里直接用 order / selected，脚本里不需要 props 对象，所以不接返回值
defineProps<Props>()

// 具名元组声明事件参数：id 与原生 MouseEvent。父组件 @select="handleSelect" 时，handleSelect 的两个参数类型由此推断。
const emit = defineEmits<{
  select: [id: string, e: MouseEvent]
}>()
</script>

<template>
  <div class="card stack">
    <div class="row">
      <strong>{{ order.orderNo }}</strong>
      <!-- order.status 是 OrderStatus 联合类型：既能拼类名，又能当 Record 的键 -->
      <span
        class="badge"
        :class="`badge-${order.status}`"
      >{{ ORDER_STATUS_TEXT[order.status] }}</span>
      <span
        v-if="selected"
        class="badge"
      >已选中</span>
    </div>
    <div class="row">
      <span>客户：{{ order.customer }}</span>
      <span class="muted">￥{{ order.amount.toFixed(2) }} · {{ order.createdAt }}</span>
    </div>
    <!-- 默认插槽 = React 的 children；$slots.default 判断父组件有没有传内容 -->
    <div v-if="$slots.default">
      <slot />
    </div>
    <div class="row">
      <!-- 内联箭头函数里的 e 由模板编译器推断为 MouseEvent（悬停可见），与 React 侧 onClick={(e) => onSelect(order.id, e)} 的推断同构。
           Vue 没有惯用的「父组件没监听就不渲染按钮」写法（emit 不知道有没有人在听），React 侧是 onSelect && <button> -->
      <button
        :class="{ 'btn-primary': selected }"
        @click="(e) => emit('select', order.id, e)"
      >
        {{ selected ? '取消选择' : '选择' }}
      </button>
    </div>
  </div>
</template>
