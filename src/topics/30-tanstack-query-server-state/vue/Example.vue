<script setup lang="ts">
/**
 * 主题：30. TanStack Query 与服务端状态（Vue 对照）
 * 适用版本：Vue 3.5 · @tanstack/vue-query 5.102.8（与 React 侧共用 @tanstack/query-core 5.102.8）
 * 最后核对：2026-09-17
 * 前置主题：11、10、14、27、18（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - 缓存规则、key 哈希、默认值、mutation 回调顺序和 React 侧完全来自同一个 query-core，两边测试断言的是同一批结论【主流】。
 * - 接入：queryPlugin.ts 里 app.use(VueQueryPlugin, { queryClient })（install 里 client.mount() + app.provide），组件里 useQueryClient()；
 *   对应 React 的 <QueryClientProvider>。没装插件时 useQueryClient 报「No 'queryClient' found in Vue context」（测试覆盖）。
 * - 响应式参数【主流】：把 getter（() => props.x）或 ref 放进 queryKey / enabled，库自动重取（官方 reactivity 指南）；
 *   本课的 listOptions / detailOptions 收 getter。vue-query 5 的类型也允许把整个选项写成 getter，指南没有展开，本课不用。
 * - 返回值是一组 ref：解构成顶层变量模板才自动解包；不解构写 q.isFetching ? … 总按真值处理（区块一演示 + 测试）。
 * - placeholderData 等其它选项里放 computed，也会被库解开（vue-query 的 cloneDeepUnref），开关一变就生效。
 * - 订阅 QueryCache：onMounted subscribe / onUnmounted 退订，没有 React 那条「渲染期间不能更新别的组件」的限制。
 * - 模拟断网：watch + onWatcherCleanup【主流·3.5 起】把本地开关同步到全局的 onlineManager，组件卸载时 cleanup 也会执行（测试覆盖）。
 * - Suspense【尝鲜】：<Suspense> 是实验性功能；OrderStatsView 里顶层 await suspense()；错误由父组件 onErrorCaptured 接住；
 *   已显示过内容后，只有 #default 根节点被替换才回到 pending，所以「重新加载」要换 key，:timeout="0" 让 fallback 立刻出现。
 * - 没有 StrictMode 双跑：进入本题时列表的 queryFn 只执行一次。
 * - devtools：@tanstack/vue-query-devtools（6.x），或给 VueQueryPlugin 传 enableDevtoolsV6Plugin: true 接入 Vue Devtools。
 */
import OrdersWorkbench from './OrdersWorkbench.vue'
import { createOrdersDemo } from './ordersDemo'

// 每次进入本题新建一份演示工具（日志、失败开关）；QueryClient 由 queryPlugin.ts 装好
const demo = createOrdersDemo()
</script>

<template>
  <OrdersWorkbench :demo="demo" />
</template>
