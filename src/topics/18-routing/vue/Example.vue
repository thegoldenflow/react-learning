<script setup lang="ts">
/**
 * 主题：18. 路由（Vue 对照：vue-router）
 * 适用版本：Vue 3.5 · vue-router 5.x（本课用到的 API 与 4.x 相同）
 * 最后核对：2026-09-17
 * 前置主题：05、09、13、16、27（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解（30 秒速答、核心概念、关键区别、追问、易错点、生产注意、旧写法、新动向、练习、参考）
 * 在 react/Example.tsx；本文件列出 Vue 这一侧的要点，和 React 的对应关系写在各文件的注释里。
 *
 * Vue 这一侧的要点：
 * - 路由表：router.ts 里的 routes 配置数组 + app.use(router)【主流】。
 *   React Router 的 Data 模式同样是配置数组，「配置 vs 组件树」不是框架差异。
 * - 守卫：router.beforeEach 的返回值写法【主流】，在导航提交前执行、可以 await；
 *   第三个参数 next() 是【旧写法】，vue-router 5 在开发环境会警告（VUE_ROUTER_R0025）。
 * - 取数：组件内 watch 路由参数 / query，onWatcherCleanup 取消过期请求【主流】；
 *   vue-router/experimental 的数据加载器【尝鲜】才和 React Router 的 loader 一样在导航前取数。
 * - 离开确认 onBeforeRouteLeave【主流】；路由级懒加载 component: () => import()【主流】。
 * - 组件复用：同一个 RouterView 在参数变化时复用组件实例，setup 不重跑（OrderDetailPage.vue）。
 * - 回跳地址用 @/shared/safeRedirect 校验；前端权限只影响界面，鉴权在后端。
 */
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth, checkSession, logout } from './auth'

const route = useRoute()
const router = useRouter()

// 应用启动时先问一次会话，界面才知道显示「已登录」还是「未登录」；守卫里每次导航到受保护页面还会再确认。
onMounted(() => {
  void checkSession()
})

const statusText = computed(() => {
  if (auth.status === 'authed') return `已登录（${auth.userName}）`
  return auth.status === 'guest' ? '未登录' : '确认登录状态中……'
})

async function handleLogout() {
  await logout()
  // beforeEach 只在导航时执行，登出后不主动跳转的话，人会继续停在受保护页面。
  // React Data 模式同理（登出 action 里 redirect）；React 声明式的 RequireAuth 才会在渲染时自动弹回。
  await router.push('/login')
}
</script>

<template>
  <div class="stack">
    <nav class="row">
      <!-- RouterLink 默认加 router-link-active / router-link-exact-active，按「路由记录」判断：
           /orders/:id 和 /orders 是两条兄弟记录，所以在详情页里「订单」不高亮。
           React 的 NavLink 默认加 class="active" + aria-current="page"，按 URL 前缀判断，详情页里「订单」仍高亮。 -->
      <RouterLink to="/orders">
        订单
      </RouterLink>
      <RouterLink to="/settings">
        设置（beforeEach 守卫）
      </RouterLink>
      <span class="muted">当前：{{ statusText }}</span>
      <button
        v-if="auth.status === 'authed'"
        type="button"
        class="btn-ghost"
        @click="handleLogout"
      >
        退出登录
      </button>
    </nav>
    <p class="muted">
      地址：<code>{{ route.fullPath }}</code>（内存路由没有地址栏，这里显示给你看）
    </p>

    <RouterView />
  </div>
</template>

<style scoped>
.router-link-active {
  font-weight: 700;
}
</style>
