<script setup lang="ts">
/**
 * 子路由一（/settings/profile）：静态内容页。
 * React 版对照：SettingsProfilePage 函数组件（与父组件写在同一个 .tsx 文件里）。
 */
</script>

<template>
  <div class="card stack">
    <h3>个人资料</h3>
    <p>用户名：张伟</p>
    <p>邮箱：zhangwei@example.com</p>
    <p class="muted">
      这是 /settings/profile 子路由的内容，渲染在父路由的 RouterView 位置
    </p>
  </div>
</template>
