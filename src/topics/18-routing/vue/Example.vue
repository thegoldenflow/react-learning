<script setup lang="ts">
/**
 * 学习主题：路由 —— React Router 的参数、query、嵌套路由、导航与登录态守卫
 *
 * React 核心概念：
 * - 路由即组件：Route 就是 JSX 组件，路由表直接写在渲染输出里，和普通组件树长在一起
 * - useParams 读路径参数（/orders/:id）、useSearchParams 读写 query（?status=paid）、
 *   useNavigate 命令式跳转（navigate(-1) 后退）
 * - 嵌套路由：父 Route 的 element 里放 <Outlet />，命中的子 Route 渲染到 Outlet 位置
 * - Link 声明式跳转；NavLink 是 Link 的增强版，把 isActive 交给回调用于高亮当前项
 * - 路由守卫（登录态拦截）= 一个普通包装组件：RequireAuth 里读登录态，未登录就
 *   return <Navigate to={`/login?redirect=…`} replace />，已登录就 return children；
 *   用 useLocation() 拿当前路径当回跳地址，登录页用 useSearchParams 把它读回来
 * - 按钮级权限 = 普通条件渲染：{can('order:delete') && <button>删除</button>}
 *
 * Vue 对应概念：
 * - 集中式路由表：createRouter({ routes: [...] }) 的配置对象，独立于组件树，还要 app.use() 安装
 * - useRoute().params / useRoute().query 读参数；useRouter().push() / back() 跳转
 * - 嵌套路由：children 配置 + 父组件模板里的 <RouterView />
 * - RouterLink 自动给激活链接加 router-link-active 类，用 CSS 命中即可
 * - 路由守卫 = 挂在 router 实例上的全局钩子 router.beforeEach((to, from, next) => …)，
 *   写在路由配置文件里，与组件树无关；按钮级权限常封装成自定义指令 v-permission
 *
 * 最重要的区别：
 * - 组织方式的思维差异：React Router 把「URL → UI」也当作渲染逻辑的一部分——
 *   路由表就是一段 JSX，可以放进任何组件、可以条件渲染、可以拆分组合；
 *   Vue Router 的路由表是集中式的配置数据（数组对象），与组件树分离，先配置后安装。
 *   React 这边没有「安装路由插件」这一步：Router 只是包在最外层的一个普通 Provider 组件。
 * - 守卫的思维差异（面试高频题「React 里怎么做路由守卫」）：
 *   Vue 的守卫是集中式配置外挂的钩子（router.beforeEach），
 *   React 的守卫就是路由表里的一个普通组件 —— 因为 React 的路由表本身就是组件树。
 *   React Router 根本没有「全局导航钩子」这种东西（没有一一对应关系），
 *   别去找 beforeEach 的等价物：要拦哪条路由，就把哪条路由的 element 用 <RequireAuth> 包一层。
 */

// 本组件只是布局：顶部导航 + RouterView 出口。
// 路由器实例由壳应用挂载本题时调用 router.ts 的 createTopic18Router() 自动安装（vue-router 是插件）；
// React 版没有「安装」这一步 —— <MemoryRouter> 只是包在最外层的普通组件，
// 而且路由表 <Routes> 就写在它的 JSX 里，本文件对照的 routes 配置在 router.ts。

// 登录态放在模块级的 reactive 里（见 auth.ts），import 就能读、就能改，组件树里不需要任何 Provider。
// React 对照：登录态是 Example 顶层的 useState，再用一个极简 Context 送给 RequireAuth / 详情页。
import { auth, logout } from './auth'
</script>

<template>
  <div class="stack">
    <nav class="row">
      <!-- RouterLink 自动给激活项加 router-link-active 类（见下方 style）；
           React 的 NavLink 则把 isActive 传给 style/className 回调，高亮逻辑写在 JS 里。
           注意激活判定的差异：Vue 基于「路由记录」匹配，/orders/:id 是兄弟路由，
           进入详情页后「订单」不会保持高亮；React 的 NavLink 默认按 URL 前缀匹配，
           详情页里「订单」仍然高亮 -->
      <RouterLink to="/orders">
        订单
      </RouterLink>
      <RouterLink to="/settings">
        设置
      </RouterLink>

      <!-- 登录态显示 + 退出登录：方便反复演示守卫。
           未登录时点「设置」→ 被 router.beforeEach 拦到 /login；登录后再点「设置」→ 正常进入。
           注意一个实质差异：此时点「退出登录」，人如果正停在 /settings，Vue 这边并不会被踢出去 ——
           beforeEach 是「导航发生时跑一次的钩子」，登录态变了但没有导航，钩子就不会再跑
           （真要踢人得自己 watch(auth) 再手动 router.push）。
           React 那边的 RequireAuth 是「持续生效的渲染条件」，登录态一变就立刻重渲染并弹回登录页。 -->
      <span class="muted">当前：{{ auth.loggedIn ? '已登录' : '未登录' }}</span>
      <button
        v-if="auth.loggedIn"
        class="btn-ghost"
        @click="logout"
      >
        退出登录
      </button>
    </nav>

    <!-- 路由出口：URL 命中的页面组件渲染在这里，映射关系在 router.ts 的 routes 数组里。
         React 版对照：<Routes> 里逐条写 <Route path element>，路由表本身就是 JSX -->
    <RouterView />
  </div>
</template>

<style scoped>
/* Vue 的激活高亮：RouterLink 自动加 router-link-active 类，CSS 命中即可。
   React 版对照：navStyle = ({ isActive }) => ({ fontWeight: isActive ? 700 : 400 }) */
.router-link-active {
  font-weight: 700;
}
</style>
