<script setup lang="ts">
/**
 * 主题：05. 条件渲染（Vue 对照：v-if / v-else、v-show、<KeepAlive>）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：01、02、03
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - v-if / v-else-if / v-else【主流】（区块一）：按表达式的 truthy 渲染；v-else / v-else-if 必须紧跟前一个分支；一次切换好几个元素写 <template v-if>（最终 DOM 里没有 template 这一层，测试覆盖）。
 *   React 没有指令，用 JS 的 if / 三元 / && 写同样的分支。
 * - 0 陷阱【主流】（区块二）：v-if 对 0、NaN 都不渲染；插值 {{ count && '…' }} 的值就是 0，会显示「0」，false 更会显示成「false」（React 不渲染 false）——
 *   插值里的条件写三元（cond ? '…' : ''）或改用 v-if（依据是 @vue/shared 的 toDisplayString 源码，文档没写，测试覆盖）。
 * - 模板里的 v-if / v-else 切换时换一个实例【主流】（区块三）：编译器给每个分支注入不同的 key（key: 0、key: 1，测试覆盖），所以两边即使是同一个组件，
 *   没包 <KeepAlive> 时切换也会销毁重建 —— React 的三元两边同类型时会复用实例、保留 state。这是模板编译器的行为：Vue 的渲染函数里写三元没有这个 key，
 *   同类型同样复用（测试覆盖）。模板里只写一个组件、换 prop 时也会复用，同样用 :key 强制换实例（测试覆盖）。
 * - v-show【主流】（区块四）：只切 display，组件一直在，不走挂载 / 卸载（也不走停用 / 激活）钩子；但组件上的 v-show 每次切换都会让组件被父组件强制更新一次，
 *   onBeforeUpdate / onUpdated 照常调用（测试覆盖）。不能用在 <template> 上，也不能配 v-else。v-if 是惰性的（初始为假时什么都不渲染），v-show 先渲染再藏；
 *   频繁切换用 v-show，很少变用 v-if（官方的取舍原文见 HideVsUnmountDemo.vue）。
 * - <KeepAlive>【主流】（区块四）：缓存实例，停用 / 激活走 onDeactivated / onActivated（首次挂载后也会调一次 onActivated），DOM 被移出文档、激活时插回同一个元素；
 *   和 React 19.2 的 <Activity> 一样保留 state，不同在于 Activity 用 display: none 把 DOM 留在原地、由 React 清理 Effect，
 *   KeepAlive 停用期间 watch 照样触发、组件照样重新渲染，要停订阅得自己在 onDeactivated 里做（测试覆盖）。
 * - v-if 与 v-for 同一元素【主流】：v-if 先求值、读不到循环变量，官方不推荐同用；先用 computed 过滤，或把 v-if 挪到外层容器（06 题改写时补）。
 *   Vue 2 相反，是 v-for 先求值（v3 迁移指南 breaking-changes/v-if-v-for）。
 */
import BranchStylesDemo from './BranchStylesDemo.vue'
import HideVsUnmountDemo from './HideVsUnmountDemo.vue'
import PositionDemo from './PositionDemo.vue'
import ZeroPitfallDemo from './ZeroPitfallDemo.vue'
</script>

<template>
  <div class="stack">
    <BranchStylesDemo />
    <ZeroPitfallDemo />
    <PositionDemo />
    <HideVsUnmountDemo />
  </div>
</template>
