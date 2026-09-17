<script setup lang="ts">
/**
 * 设置布局（/settings）：嵌套路由的父组件，模板里的 <RouterView /> 是子路由的渲染出口。
 * React 对照：SettingsLayout 里的 <Outlet />。
 */
</script>

<template>
  <div class="stack">
    <nav class="row">
      <!-- 这里写的是绝对路径。RouterLink 也支持相对路径，但按「URL 路径」相对当前地址解析：
           在 /settings/profile 页面写 to="notifications" 得到 /settings/notifications，
           在 /settings 页面写却得到 /notifications。
           React Router 的相对路径按「路由层级」解析（react/dataPages.tsx 的 SettingsLayout）。 -->
      <RouterLink to="/settings/profile">
        个人资料
      </RouterLink>
      <RouterLink to="/settings/notifications">
        通知设置
      </RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
/* RouterLink 激活时默认加 router-link-active（React 的 NavLink 对应默认 class="active"） */
.router-link-active {
  font-weight: 700;
}
</style>
