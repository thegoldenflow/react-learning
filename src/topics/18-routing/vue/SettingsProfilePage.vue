<script setup lang="ts">
/**
 * 子路由（/settings/profile）：懒加载的路由组件（见 router.ts 的 () => import()）。
 * React 对照：SettingsProfilePage，数据来自路由 loader。
 */
</script>

<template>
  <div class="card stack">
    <h3>个人资料</h3>
    <p>邮箱：zhangwei@example.com</p>
    <p class="muted">
      这是 /settings/profile 子路由的内容，渲染在父路由的 RouterView 位置
    </p>
  </div>
</template>
