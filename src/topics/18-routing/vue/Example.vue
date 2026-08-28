<script setup lang="ts">
/**
 * 学习主题：路由 —— React Router 的参数、query、嵌套路由与导航
 *
 * React 核心概念：
 * - 路由即组件：Route 就是 JSX 组件，路由表直接写在渲染输出里，和普通组件树长在一起
 * - useParams 读路径参数（/orders/:id）、useSearchParams 读写 query（?status=paid）、
 *   useNavigate 命令式跳转（navigate(-1) 后退）
 * - 嵌套路由：父 Route 的 element 里放 <Outlet />，命中的子 Route 渲染到 Outlet 位置
 * - Link 声明式跳转；NavLink 是 Link 的增强版，把 isActive 交给回调用于高亮当前项
 *
 * Vue 对应概念：
 * - 集中式路由表：createRouter({ routes: [...] }) 的配置对象，独立于组件树，还要 app.use() 安装
 * - useRoute().params / useRoute().query 读参数；useRouter().push() / back() 跳转
 * - 嵌套路由：children 配置 + 父组件模板里的 <RouterView />
 * - RouterLink 自动给激活链接加 router-link-active 类，用 CSS 命中即可
 *
 * 最重要的区别：
 * - 组织方式的思维差异：React Router 把「URL → UI」也当作渲染逻辑的一部分——
 *   路由表就是一段 JSX，可以放进任何组件、可以条件渲染、可以拆分组合；
 *   Vue Router 的路由表是集中式的配置数据（数组对象），与组件树分离，先配置后安装。
 *   React 这边没有「安装路由插件」这一步：Router 只是包在最外层的一个普通 Provider 组件。
 */

// 本组件只是布局：顶部导航 + RouterView 出口。
// 路由器实例由壳应用挂载本题时调用 router.ts 的 createTopic18Router() 自动安装（vue-router 是插件）；
// React 版没有「安装」这一步 —— <MemoryRouter> 只是包在最外层的普通组件，
// 而且路由表 <Routes> 就写在它的 JSX 里，本文件对照的 routes 配置在 router.ts。
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
