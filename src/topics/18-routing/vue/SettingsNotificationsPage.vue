<script setup lang="ts">
/**
 * 通知设置（/settings/notifications）：有未保存的修改时拦住离开。
 * - onBeforeRouteLeave：拦应用内导航，返回 false 取消（官方文档示例同样用 window.confirm）；
 * - beforeunload 事件：拦刷新 / 关闭标签页。
 * React 对照：useBlocker（Data 模式专有）+ useBeforeUnload。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const savedValue = ref(true)
const emailEnabled = ref(true)
const dirty = computed(() => emailEnabled.value !== savedValue.value)

onBeforeRouteLeave(() => {
  if (!dirty.value) return
  const answer = window.confirm('有未保存的修改，确定离开吗？')
  if (!answer) return false
})

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) event.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))

function save() {
  savedValue.value = emailEnabled.value
}
</script>

<template>
  <div class="card stack">
    <h3>通知设置</h3>
    <label>
      <input
        v-model="emailEnabled"
        type="checkbox"
      >
      接收邮件通知{{ dirty ? '（未保存）' : '' }}
    </label>
    <div class="row">
      <button
        type="button"
        class="btn-primary"
        :disabled="!dirty"
        @click="save"
      >
        保存
      </button>
    </div>
    <p class="muted">
      改一下勾选再点别的链接试试。切到「个人资料」再切回来，未保存的勾选会丢失：子路由切换就是卸载再挂载，两个框架一致。
      Vue 可以用 KeepAlive 包住 RouterView 缓存页面；React 19.2 的 &lt;Activity&gt;【较新】能隐藏子树并保留 state，
      但路由层没有现成封装（32 题，待新增）。
    </p>
  </div>
</template>
