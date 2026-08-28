<script setup lang="ts">
/**
 * 设置页布局（/settings）：演示嵌套路由的「父组件」。
 * 路由表里本组件配了 children，模板里的 <RouterView /> 就是子路由的渲染出口。
 * React 版对照：SettingsLayout 组件里的 <Outlet /> —— Outlet 就是 React 版的 RouterView。
 */
</script>

<template>
  <div class="stack">
    <div class="row">
      <!-- Vue 的 RouterLink 惯用绝对路径（或命名路由）；
           React 版这里用的是相对路径 to="profile"（相对当前路由 /settings 解析）——
           Vue 没有一一对应的「相对 to」体验，相对路径支持有限 -->
      <RouterLink to="/settings/profile">
        个人资料
      </RouterLink>
      <RouterLink to="/settings/notifications">
        通知设置
      </RouterLink>
    </div>
    <!-- 子路由内容的渲染出口（对应 React 的 <Outlet />） -->
    <RouterView />
  </div>
</template>

<style scoped>
/* 子导航的激活高亮：同样靠自动添加的 router-link-active 类。
   React 版对照：NavLink 的 style 回调读 isActive */
.router-link-active {
  font-weight: 700;
}
</style>
