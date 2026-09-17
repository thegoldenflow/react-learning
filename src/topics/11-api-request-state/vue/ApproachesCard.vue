<script setup lang="ts">
/**
 * 四种取数方案在 Vue 里的对应物（只给骨架和归属，可运行示例在各自的题里）。
 * React 侧对照：react/ApproachesCard.tsx。
 */
const ROWS = [
  {
    name: 'watch / watchEffect 手写（本课主线）',
    maturity: '【主流·教学与兜底】',
    trigger: '参数（ref / computed）变化',
    pending: '自己建模（本课用「结果的参数指纹 ≠ 当前指纹」派生）',
    solves: '把状态机讲透；缓存 / 去重 / 预载都要自己做。官方 composable 示例 useFetch 用 watchEffect + toValue，也没做取消',
    where: '本课；取消与竞态细讲在 27 题',
  },
  {
    name: '@tanstack/vue-query',
    maturity: '【主流·生产默认】',
    trigger: 'queryKey 变化（带缓存、去重）',
    pending: 'status（有没有数据）× fetchStatus（queryFn 在不在跑），返回的是 ref',
    solves: '和 React 侧同一个 query-core：缓存、去重、失效重取、默认失败重试 3 次指数退避',
    where: '30 题',
  },
  {
    name: 'vue-router 导航前取数',
    maturity: '【主流】',
    trigger: '导航（beforeRouteEnter / beforeRouteUpdate）',
    pending: '停留在上一个视图（官方：The user will stay on the previous view while the resource is being fetched）',
    solves: '进页面就有数据；对应 React Router 的 loader。导航后取数（watch route.params + immediate）就是本课写法',
    where: '18 题；vue-router 5 的 vue-router/experimental 数据加载器最接近 loader【尝鲜】',
  },
  {
    name: '<Suspense>（async setup）',
    maturity: '【尝鲜·官方标注实验性】',
    trigger: '组件的 async setup / 异步组件',
    pending: '#fallback 插槽；错误用父组件的 onErrorCaptured 接',
    solves: '把 loading 提到边界上；官方原话「It is not guaranteed to reach stable status and the API may change before it does」',
    where: '对应 React 的 use(promise) + Suspense（32 题，待新增）',
  },
]
</script>

<template>
  <div class="card stack">
    <h3>区块二：四种取数方案在 Vue 里的对应物</h3>
    <p class="muted">
      React 侧列的是官方对「在 Effect 里取数」的四条缺点与替代方案；Vue 官方没有同样的表态，但对应物一一存在，取舍一样：
      要缓存就上 TanStack Query，要「进页面就有数据」就在导航阶段取数，手写只适合简单场景。
    </p>
    <table>
      <thead>
        <tr>
          <th>方案</th>
          <th>触发方式</th>
          <th>pending 归谁管</th>
          <th>解决什么 / 代价</th>
          <th>在哪一题</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in ROWS"
          :key="row.name"
        >
          <td>
            {{ row.name }}<br>
            <span class="muted">{{ row.maturity }}</span>
          </td>
          <td>{{ row.trigger }}</td>
          <td>{{ row.pending }}</td>
          <td>{{ row.solves }}</td>
          <td>{{ row.where }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
