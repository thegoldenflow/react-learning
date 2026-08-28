<script setup lang="ts">
/**
 * 学习主题：Props（类型声明、默认值与单向数据流）
 *
 * React 核心概念：
 * - props 就是组件函数的第一个参数（一个普通对象），用 TS interface 描述形状
 * - 默认值用「参数解构默认值」：function OrderCard({ discount = 0 }: Props) —— 工业主流写法
 * - defaultProps / PropTypes 是过时写法，TypeScript 时代不再使用
 * - props 只读：子组件不能改，要改就调用父组件传下来的回调把修改「上浮」（08 题详讲）
 * - 组件只是函数，多个组件写在同一个 .tsx 文件里很常见
 *
 * Vue 对应概念：
 * - defineProps<{ ... }>() 声明类型；默认值要包一层 withDefaults(defineProps<...>(), { ... })
 * - Vue 的 props 同样单向：子组件里改 props，开发期会收到运行时警告
 * - SFC 一个文件只能有一个组件，子组件必须放单独的 .vue 文件
 *
 * 最重要的区别：
 * - defineProps 是「编译器宏」（编译期展开、无需 import）；React 没有任何宏，
 *   props 就是函数参数，类型、默认值全部用 TypeScript + JS 原生语法（解构默认值）表达
 * - 「子组件不能改 props」两边一致，但 Vue 有运行时警告兜底，React 不警告、
 *   纯靠约定与单向数据流——改 props 往往不报错，却会造成 UI 与数据源不一致（面试常问）
 */
// 子组件必须是单独的 .vue 文件再 import 进来；React 版的 OrderCard 与父组件同文件
import OrderCard from './OrderCard.vue'
</script>

<template>
  <div class="stack">
    <p class="muted">
      父组件渲染三张订单卡；第二张传了可选的 discount，其余两张走默认值 0
    </p>
    <!-- 静态字符串属性直接写；数字等 JS 值要用 v-bind（:amount="1280"）。
         React 里这一步是：字符串用引号、其余值一律花括号 amount={1280}。
         Vue 模板惯用 kebab-case（order-no），JSX 属性保持 camelCase（orderNo）。 -->
    <OrderCard
      order-no="SO-20260801"
      customer="林小满"
      :amount="1280"
      status="pending"
    />
    <OrderCard
      order-no="SO-20260802"
      customer="陈北洋"
      :amount="5600"
      status="paid"
      :discount="0.15"
    />
    <OrderCard
      order-no="SO-20260803"
      customer="赵四方"
      :amount="899"
      status="cancelled"
    />
  </div>
</template>
