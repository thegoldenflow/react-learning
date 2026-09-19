<script setup lang="ts">
/**
 * 主题：05. 条件渲染（Vue 对照：v-if / v-else、v-show、<KeepAlive>）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：01、02、03
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时按项目里的使用频率标【最常用】【常用】【少用】（规则与依据见 react/Example.tsx 文件头）。
 *          Vue 这一侧的演示（v-if、v-show、KeepAlive、:key）都是 Vue 项目里常用的写法，没有注释掉的部分；React 那一侧【少用】的演示已注释。
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - 分支：v-if / v-else-if / v-else【最常用】（区块一）：按表达式的 truthy 渲染；v-else / v-else-if 必须紧跟前一个分支；一次切换好几个元素写 <template v-if>（最终 DOM 里没有 template 这一层，测试覆盖）。
 *   React 没有指令，用 JS 的 && / 三元 / 提前 return 写同样的分支。
 * - 0 陷阱【主流】（区块二）：v-if 对 0、NaN 都不渲染；插值 {{ count && '…' }} 的值就是 0，会显示「0」，false 更会显示成「false」（React 不渲染 false）——
 *   插值里的条件写三元（cond ? '…' : ''）或改用 v-if（依据是 @vue/shared 的 toDisplayString 源码，文档没写，测试覆盖）。
 * - 模板里的 v-if / v-else 切换时换一个实例【主流】（区块三）：编译器给每个分支注入不同的 key（测试覆盖），所以两边即使是同一个组件，没包 <KeepAlive> 时切换也会销毁重建 ——
 *   React 的三元两边同类型时会复用实例、保留 state。模板里只写一个组件、换 prop 时 Vue 也会复用，同样用 :key 强制换实例（测试覆盖），和 React 的 key={userId} 是同一个做法。
 * - 隐藏：v-show【常用】（区块四）：只切 display，组件一直在，不走挂载 / 卸载钩子；不能用在 <template> 上，也不能配 v-else。
 *   频繁切换用 v-show，很少变用 v-if（官方的取舍原文见 HideVsUnmountDemo.vue）。
 * - 缓存：<KeepAlive>【常用】（区块四）：缓存实例，停用 / 激活走 onDeactivated / onActivated（首次挂载后也会调一次 onActivated）；项目里最常见的是包住 <router-view> 做后台多标签页（工程经验）。
 *   和 React 19.2 的 <Activity> 一样保留 state，不同在于 Activity 由 React 清理 Effect，KeepAlive 停用期间 watch 照样触发、组件照样重新渲染，要停订阅得自己在 onDeactivated 里做（测试覆盖）。
 * - v-if 与 v-for 同一元素：v-if 先求值、读不到循环变量，官方不推荐同用；先用 computed 过滤，或把 v-if 挪到外层容器（06 题改写时补）。
 *
 * 附：细节（了解即可，完整出处见 react/Example.tsx 的附 4）
 * - 编译器注入的 key 是 key: 0、key: 1（@vue/compiler-core 3.5.42）。这是模板编译器的行为：Vue 的渲染函数里写三元没有这个 key，两边同一个组件时和 React 一样复用（测试覆盖）。
 * - 组件上的 v-show 每次切换都会让组件被父组件强制更新一次，onBeforeUpdate / onUpdated 照常调用（测试覆盖）。v-if 是惰性的（初始为假时什么都不渲染），v-show 先渲染再藏。
 * - KeepAlive 停用时 DOM 被移出文档、激活时插回同一个元素；React 的 <Activity> 用 display: none 把 DOM 留在原地（测试覆盖）。
 * - Vue 2 相反，是 v-for 先求值（v3 迁移指南 breaking-changes/v-if-v-for）。
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
