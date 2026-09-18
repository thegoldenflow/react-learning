<script setup lang="ts">
/**
 * 区块六（只读，Vue 对照 react/LoaderVsQueryCard.tsx）：导航阶段取数与 vue-query 的分工。
 *
 * - vue-router 官方 data-fetching 指南给了两种时机（原文已在 11 题引过）：「Fetching After Navigation」（进入页面后在组件里取数、显示 loading）
 *   和「Fetching Before Navigation」（在导航守卫里取数，数据到之前用户停在上一页）。后者对应 React Router 的 loader。
 * - vue-query 在组件里按 key 缓存、跨路由存活；两者可以并用：导航守卫里预取，组件里 useQuery 读缓存。
 *   下面骨架里的 QueryClient 方法与 React 侧是同一个 API（ensureQueryData 在 5.102.0 起标了 @deprecated，
 *   新写法 queryClient.query({ ...options, staleTime: 'static' }) 标【尝鲜】，见 React 侧文件头「九」）。
 * - vue-router 5 的 vue-router/experimental 数据加载器最接近 React Router 的 loader，仍是实验性的【尝鲜】。
 */
const ROWS = [
  {
    aspect: '什么时候取数',
    router: '导航守卫里（导航前）或组件里（导航后）',
    query: '组件 setup 时按 key 订阅；过期数据在挂载 / 聚焦 / 重连时后台重取',
  },
  {
    aspect: 'pending 归谁',
    router: '导航前取数：停在上一页，自己做进度条；导航后取数：组件里自己的 ref',
    query: 'status × fetchStatus（isLoading、isRefetching…）',
  },
  {
    aspect: '缓存与去重',
    router: '路由本身不缓存数据',
    query: '按 key 缓存、同 key 去重，staleTime / gcTime',
  },
  {
    aspect: '写之后怎么更新',
    router: '自己重新请求或改本地数据',
    query: 'useMutation + invalidateQueries（或乐观更新）',
  },
]

const SKELETON = `// 并用（示意）：QueryClient 在 main.ts 里建一个，路由守卫和 VueQueryPlugin 共用
const queryClient = new QueryClient()
app.use(VueQueryPlugin, { queryClient })

const routes = [{
  path: '/orders/:id',
  component: OrderPage,
  beforeEnter: async (to) => {
    await queryClient.ensureQueryData(orderDetailOptions(String(to.params.id)))
  },
}]

// OrderPage.vue：缓存里已经有了，不会先显示 loading
const route = useRoute()
const { data } = useQuery(orderDetailOptions(() => String(route.params.id)))`
</script>

<template>
  <div class="card stack">
    <h3>区块六：导航取数与 vue-query 的分工（只读）</h3>
    <p class="muted">
      和 React 侧一样：交给路由、交给 Query、或者两者并用。四种取数方案的 Vue 对应物见 11 题。
    </p>
    <table>
      <thead>
        <tr>
          <th>对比项</th>
          <th>vue-router 导航阶段取数</th>
          <th>@tanstack/vue-query</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in ROWS"
          :key="row.aspect"
        >
          <td>{{ row.aspect }}</td>
          <td>{{ row.router }}</td>
          <td>{{ row.query }}</td>
        </tr>
      </tbody>
    </table>
    <details>
      <summary>并用的最小骨架（只读，不可运行）</summary>
      <pre
        class="log"
        style="white-space: pre-wrap"
      >{{ SKELETON }}</pre>
    </details>
  </div>
</template>
