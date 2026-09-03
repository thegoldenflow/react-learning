<script setup lang="ts">
/**
 * 登录页（/login）：模拟登录后按 query 里的 redirect 跳回原来想去的页面。
 *
 * React 版对照：LoginPage 函数组件 —— useSearchParams() 读 redirect，
 * navigate(redirect, { replace: true }) 跳回去。页面本身两边几乎一模一样，
 * 真正的差异在「谁把用户送到这里来的」：
 * Vue 是 router.ts 里的全局钩子 router.beforeEach（集中式配置外挂的钩子），
 * React 是路由表里包在 element 外面的 <RequireAuth> 普通组件（路由表本身就是组件树）。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth, login } from './auth'

const route = useRoute()
const router = useRouter()

// route.query.redirect 的类型是 string | null | (string | null)[]，同样要收窄成合法值
//（和列表页收窄 ?status= 是同一件事）。React 对照：searchParams.get('redirect') ?? '/orders'
const redirect = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/orders',
)

function handleLogin() {
  login()
  // 用 replace 而不是 push：登录页不该留在历史里，否则登录成功后按后退又回到登录页。
  // React 对照：navigate(redirect, { replace: true })。
  // 安全提示（面试加分项）：redirect 来自 URL，是用户可控输入，
  // 真实项目必须校验它是站内相对路径，否则就是典型的「开放重定向」漏洞。
  router.replace(redirect.value)
}
</script>

<template>
  <div class="card stack">
    <h3>登录</h3>
    <p class="muted">
      你被 router.beforeEach 拦到了这里。登录成功后会跳回：<code>{{ redirect }}</code>
    </p>
    <div class="row">
      <button
        class="btn-primary"
        @click="handleLogin"
      >
        模拟登录
      </button>
    </div>
    <p
      v-if="auth.loggedIn"
      class="success-text"
    >
      已登录，现在可以进「设置」了
    </p>
  </div>
</template>
