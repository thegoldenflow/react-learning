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
      Vue 可以用 KeepAlive 缓存被切走的组件；React 没有内置对应物（没有一一对应关系，
      只能状态提升或用社区方案）。
    </p>
  </div>
</template>
