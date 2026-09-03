<script setup lang="ts">
/**
 * 子路由二（/settings/notifications）：带本地状态的页面。
 * React 版对照：SettingsNotificationsPage 里的 useState —— 这里用 ref。
 */
import { ref } from 'vue'

const emailEnabled = ref(true)
</script>

<template>
  <div class="card stack">
    <h3>通知设置</h3>
    <label>
      <input
        v-model="emailEnabled"
        type="checkbox"
      >
      接收邮件通知（当前：{{ emailEnabled ? '开' : '关' }}）
    </label>
    <p class="muted">
      切到「个人资料」再切回来，勾选状态会重置 —— 子路由切换 = 组件卸载再挂载，两框架一致。
      Vue 可以直接用 KeepAlive 包住 RouterView 缓存被切走的路由组件；React 19.2 内置了 Activity 组件
      （mode 为 hidden 时卸载 effect、保留 state），是最接近 KeepAlive 的官方原语，
      差别是 React 路由层没有开箱封装（本页保持普通的卸载重挂演示）。
    </p>
  </div>
</template>
