<script setup lang="ts">
/**
 * 主题：11. API 请求状态（Vue 对照）
 * 适用版本：Vue 3.5 · vue-router 5.x（只作对照）· TanStack Query 5（代码在 30 题）
 * 最后核对：2026-09-17
 * 前置主题：10、07、29（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - 状态建模和 React 一样是判别联合；请求态用 computed 派生（结果带参数指纹），不另存一份【主流】。
 * - 触发方式：watch(参数指纹, …, { immediate: true }) ↔ React 的 useEffect + 依赖数组；
 *   取消用 onWatcherCleanup【主流·3.5 起】（3.4 及以前是 watch 回调的 onCleanup 参数）。
 * - 官方 composable 示例 useFetch(url) 用 watchEffect + toValue（3.3 起），可以接字符串、ref 或 getter；
 *   官方那段示例没做取消和竞态处理，要自己补（27 题）。
 * - 命令式 load()（onMounted 调一次 + 事件里再调）也是常见写法，差别只在触发方式。
 * - 导航阶段取数（beforeRouteEnter「导航前」/ watch route.params「导航后」）对照 React Router 的 loader（18 题）；
 *   vue-router 5 的 vue-router/experimental 数据加载器【尝鲜】。
 * - `<Suspense>` 对照 use(promise) + Suspense，官方标注实验性（区块二表格里有原文）。
 * - 生产默认同样是缓存层：@tanstack/vue-query 和 React 侧共用一个 query-core（30 题）。
 */
import ApproachesCard from './ApproachesCard.vue'
import WatchRequestPanel from './WatchRequestPanel.vue'
</script>

<template>
  <div class="stack">
    <WatchRequestPanel />
    <ApproachesCard />
  </div>
</template>
