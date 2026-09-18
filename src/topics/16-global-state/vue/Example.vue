<script setup lang="ts">
/**
 * 主题：16. 全局状态（Vue 对照：Pinia）
 * 适用版本：Vue 3.5 · pinia 3.0（4.x 见下）
 * 最后核对：2026-09-17
 * 前置主题：15、29、21、25、14、30（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - 定位【主流】：Pinia 由 Vue 核心团队维护，Vuex 已进入维护模式，新项目推荐 Pinia（vuejs.org scaling-up/state-management）。
 *   React 官方不指定状态库，内置的是 Context（+ reducer）和给外部 store 用的 useSyncExternalStore；这是两边生态最大的不同。
 * - setup store：ref() → state、computed() → getter、function → action；state 要全部 return（cartStore.ts）。
 *   option store（{ state, getters, actions }）更好上手，setup store 更灵活、更强（官方原文「Options stores are easier to work with while Setup stores are more flexible and powerful」：
 *   能在 store 里用 watch、composable），代价是 state 必须全部 return、服务端渲染时用 composable 更复杂。
 * - 订阅是自动的：组件渲染时读了哪些响应式数据，就只在这些数据变化时重新渲染，不需要 selector（区块一，测试覆盖）；
 *   读了整个 $state 就依赖整个 store（WholeStoreBadge.vue）。
 * - 解构 state / getter 用 storeToRefs，action 直接解构；直接解构 state 会丢失响应性（区块二，测试覆盖）。
 * - 更新：直接改（可变），也可以 $patch(对象) / $patch(函数) 批量改；setup store 没有自带 $reset()，要自己写（测试覆盖默认会报错）。
 * - 监听：$subscribe（state 变化，组件卸载时自动取消，{ detached: true } 保留）、$onAction（action 调用前后，after / onError）。
 * - 扩展：插件 pinia.use()（本题 persistPlugin.ts 做了一个迷你持久化），对应 Zustand 的中间件；devtools、HMR（acceptHMRUpdate）、
 *   服务端渲染支持在 Pinia 核心里。生产常用社区插件 pinia-plugin-persistedstate（本仓库未安装）。
 * - 实例：state 挂在 pinia 实例上，每个 app 一个 pinia；服务端渲染每个请求 createPinia()。Zustand 模块级 store 是整个页面一份。
 * - 最小方案：模块级 reactive（区块三），服务端渲染会跨请求共享，官方原文见 react/Example.tsx 三。
 * - pinia 4【尝鲜】：2026-07-14 首发，破坏性变更只涉及打包（只发 ESM、@vue/devtools-api 要单独安装、TypeScript ≥ 5.6），
 *   另外重写了错误与开发提示、加了几项小功能；store 的写法不变。发布不满 3 个月，本课仍用 3.0.4。
 */
import CartDemo from './CartDemo.vue'
import ReactiveStoreDemo from './ReactiveStoreDemo.vue'
import StoreApiDemo from './StoreApiDemo.vue'
</script>

<template>
  <div class="stack">
    <CartDemo />
    <StoreApiDemo />
    <ReactiveStoreDemo />
    <div class="card stack">
      <h3>区块四、五在 Vue 里</h3>
      <p class="muted">
        React 区块四（createStore + Context，每个实例一份 store）：Pinia 的 state 本来就挂在 pinia 实例上，服务端渲染时每个请求
        createPinia() 一次即可；组件实例级别的共享状态用 provide / inject 注入一个 composable 创建的对象（15 题）。
        React 区块五（Redux Toolkit）：Vue 这边对应 Vuex（已进入维护模式），新项目用 Pinia，没有 mutations、没有 action 类型字符串。
      </p>
    </div>
  </div>
</template>
