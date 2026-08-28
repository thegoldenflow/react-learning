<script setup lang="ts">
/**
 * 学习主题：全局状态管理（Zustand vs Pinia）
 *
 * React 核心概念：
 * - Zustand：create<T>()((set, get) => ({...})) 创建 store，返回值本身就是 Hook（useCartStore），
 *   不需要任何 Provider，import 即用
 * - selector 用法 useCartStore(s => s.items)：组件只订阅选出来的切片，切片不变（Object.is 对比）
 *   就不重渲染——不传 selector 则订阅整个 store，任何字段变化都会让组件重渲染
 * - set 是浅合并 + 必须不可变更新（和 useState 一样的规矩）
 * - 派生值：store 里放函数（get() 现算，无缓存）或组件内直接算——Zustand 没有 Pinia getter
 *   那种「自动缓存的派生值」概念
 * - 选型：Zustand 是 React 社区目前最主流的轻量方案之一（Redux Toolkit 更重、样板多；
 *   Context + useReducer 无外部库但样板多且有整体重渲染问题）——本项目选 Zustand
 * - 什么时候不用全局状态：只被一个组件树用的状态放局部；服务端数据交给请求层（如 TanStack Query）；
 *   只有跨页面 / 跨互不嵌套组件共享的客户端状态才进全局 store
 *
 * Vue 对应概念：
 * - Pinia defineStore 的 setup store 写法与 composable 完全一致：ref = state、computed = getter、
 *   function = action
 * - 组件里 useCartStore() 拿 store；解构 state/getter 必须 storeToRefs，action 可直接解构
 * - getter（computed）自动依赖追踪 + 自动缓存
 *
 * 最重要的区别：
 * - Pinia 的 store 是响应式对象，组件按「实际读了哪个属性」自动精准订阅；
 *   Zustand 的 store 是不可变快照，订阅粒度靠你手写的 selector 决定——
 *   「订阅粒度自动 vs 手动」是两者最大的心智差异
 * - Pinia 里可以直接改 state（响应式可变更新），Zustand 必须 set + 不可变更新
 */
import ProductList from './ProductList.vue'
import CartPanel from './CartPanel.vue'

// 两个互不嵌套的兄弟组件，零 props 往来——共享状态全走全局 store（与 React 版结构一致）。
// 没有全局 store 的话，就得把购物车状态提升到这里再层层下发（8 题的方案）；
// 组件隔得越远，提升方案越痛苦，这正是全局状态管理要解决的问题。
</script>

<template>
  <div class="stack">
    <ProductList />
    <CartPanel />
  </div>
</template>
