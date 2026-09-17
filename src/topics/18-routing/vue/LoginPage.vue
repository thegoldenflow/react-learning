<script setup lang="ts">
/**
 * 登录页（/login）：模拟登录后，按 query 里的 redirectTo 跳回原来想去的页面。
 *
 * React 对照：
 * - Data 模式（主线）：<Form method="post"> 提交给路由 action，action 里 safeRedirect 后 throw redirect，
 *   提交中的状态来自 useNavigation；
 * - 声明式模式（并排）：和这里一样在组件里调用登录接口，再 navigate(redirectTo, { replace: true })。
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { safeRedirect } from '@/shared/safeRedirect'
import { login } from './auth'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)

// route.query.redirectTo 的类型是 LocationQueryValue | LocationQueryValue[]，先收窄成字符串；
// 它来自 URL，是用户可控的输入，必须过 safeRedirect：只接受站内路径，否则回到 /orders。
const requested = computed(() => (typeof route.query.redirectTo === 'string' ? route.query.redirectTo : null))
const redirectTo = computed(() => safeRedirect(requested.value, '/orders'))

async function handleLogin() {
  submitting.value = true
  await login()
  // replace 而不是 push：登录页不该留在历史里，否则登录成功后按后退又回到登录页
  await router.replace(redirectTo.value)
}
</script>

<template>
  <div class="card stack">
    <h3>登录</h3>
    <p class="muted">
      登录后跳转到：<code>{{ redirectTo }}</code>
      <template v-if="requested !== null && requested !== redirectTo">
        （URL 里请求的是 <code>{{ requested }}</code>，没有通过 safeRedirect 校验）
      </template>
    </p>
    <div class="row">
      <button
        type="button"
        class="btn-primary"
        :disabled="submitting"
        @click="handleLogin"
      >
        {{ submitting ? '登录中……' : '模拟登录' }}
      </button>
    </div>
  </div>
</template>
