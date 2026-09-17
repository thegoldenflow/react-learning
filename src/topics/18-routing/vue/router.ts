/**
 * 18 题的 Vue Router 配置（vue-router 5.x，本文件用到的 API 与 4.x 相同）。
 *
 * 路由表是配置数组，先 createRouter 再由应用 app.use() 安装 ——
 * React Router 的 Data 模式（react/dataRouter.tsx）同样是配置数组 + <RouterProvider router>，
 * 「React 的路由表是组件树、Vue 的是配置」只是 React 声明式模式的表象，不是框架差异。
 *
 * 壳应用挂载本题 Vue 示例时调用 createTopic18Router() 并 app.use() 安装
 * （每次挂载新建实例；函数名是壳应用约定的入口，不能改）。
 * 用 createMemoryHistory：历史记录放内存、不碰地址栏，避免和壳应用自己的路由冲突
 * （对应 React 侧的 createMemoryRouter）；真实应用用 createWebHistory（对应 createBrowserRouter）。
 */
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import OrdersPage from './OrdersPage.vue'
import OrderDetailPage from './OrderDetailPage.vue'
import LoginPage from './LoginPage.vue'
import { checkSession, resetAuth } from './auth'
import { trackInAppNavigation } from './navigationHistory'

/**
 * 给 meta 加类型：RouteMeta 默认是 Record<PropertyKey, unknown>，不声明的话 to.meta.requiresAuth 是 unknown。
 * 写法来自 vue-router 类型声明里 RouteMeta 的注释示例。
 */
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

export function createTopic18Router(options: { authDelayMs?: number } = {}): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      // memory history 初始地址是 '/'，重定向到列表页（React 侧用 initialEntries 指定初始地址）
      { path: '/', redirect: '/orders' },
      { path: '/orders', component: OrdersPage },
      // 动态参数 :id —— 与 React Router 的 path: ':id' 语法一致
      { path: '/orders/:id', component: OrderDetailPage },
      { path: '/login', component: LoginPage },
      {
        path: '/settings',
        // 路由级懒加载【主流】：component 写成 () => import()，进入时才加载。
        // 官方懒加载文档提醒：路由组件本身不要用 defineAsyncComponent 包装，直接写动态 import。
        // React 对照：路由对象上的 lazy（react/dataRouter.tsx 的「报表」）。
        component: () => import('./SettingsPage.vue'),
        // 标记「这一组要登录」：子路由匹配时，父路由的 meta 会合并进 to.meta。
        // React Data 模式对照：无 path 的分组路由上挂 loader / middleware，把一批子路由包住。
        meta: { requiresAuth: true },
        children: [
          { path: '', redirect: '/settings/profile' },
          { path: 'profile', component: () => import('./SettingsProfilePage.vue') },
          { path: 'notifications', component: () => import('./SettingsNotificationsPage.vue') },
        ],
      },
    ],
  })

  // 每次挂载都重置登录态，便于反复演示（壳应用每次进入本题都会新建 router）。
  resetAuth({ delayMs: options.authDelayMs })

  /**
   * 全局前置守卫【主流】：返回值写法。
   * - 返回 undefined 或 true：放行；返回 false：取消导航；返回一个路由地址：重定向；
   * - 可以是 async 函数，await 完成之前导航不会提交，页面不会先渲染出来，被拦的地址也不会进历史记录；
   * - 第三个参数 next 的写法是【旧写法】：官方称它「a common source of mistakes」，
   *   vue-router 5 在开发环境使用它时会警告（VUE_ROUTER_R0025）。
   * React Data 模式对照：loader 里 throw redirect(...) / middleware，同样在导航提交前执行。
   * 这个守卫只在导航时执行：登录态在别处变化（例如点「退出登录」）不会自动把人送走，
   * 所以 Example.vue 的退出按钮自己跳转到登录页。React 声明式的 RequireAuth 是渲染条件，才会自动弹回。
   */
  router.beforeEach(async (to) => {
    if (!to.meta.requiresAuth) return
    const loggedIn = await checkSession()
    if (!loggedIn) {
      // to.fullPath 自带 query；React 侧要自己拼 pathname + search
      return { path: '/login', query: { redirectTo: to.fullPath } }
    }
  })

  // 给详情页「返回」按钮的兜底提供依据（见 navigationHistory.ts）
  trackInAppNavigation(router)

  return router
}
