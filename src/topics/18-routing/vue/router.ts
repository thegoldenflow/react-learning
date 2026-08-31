/**
 * 题 18 的 Vue Router 配置 —— 集中式路由表。
 *
 * 这正是与 React Router 最大的组织方式差异：
 * - Vue：路由表是「配置数据」（下面这个 routes 数组），独立于组件树，
 *   先 createRouter 再由应用 app.use() 安装成插件；
 * - React：路由表是「一段 JSX」（<Routes><Route …/></Routes>），直接写在组件的渲染输出里，
 *   没有「安装插件」这一步。
 *
 * 壳应用挂载本题 Vue 示例时会调用 createTopic18Router() 并自动 app.use() 安装
 * （每次挂载新建实例，函数名是壳应用约定的入口，不能改）。
 *
 * 用 createMemoryHistory：路由状态放内存、不碰浏览器地址栏，避免与壳应用自身路由冲突
 * （对应 React 版的 MemoryRouter）；真实应用用 createWebHistory（对应 BrowserRouter）。
 *
 * 【本题第二个核心考点：路由守卫】本文件下半部分的 router.beforeEach 就是 Vue 的答案 ——
 * 守卫是一个挂在 router 实例上的全局钩子，写在这份集中式配置里，和组件树没有任何关系。
 * React 那边根本没有全局导航钩子这种东西（没有一一对应关系）：
 * 它的守卫就是路由表里的一个普通组件 <RequireAuth>，把要保护的 element 包一层
 * —— 因为 React 的路由表本身就是组件树。这条差异是本题最重要的思维差异，
 * 对照着 react/Example.tsx 的「路由守卫」小节一起看。
 */
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import OrdersPage from './OrdersPage.vue'
import OrderDetailPage from './OrderDetailPage.vue'
import SettingsPage from './SettingsPage.vue'
import SettingsProfilePage from './SettingsProfilePage.vue'
import SettingsNotificationsPage from './SettingsNotificationsPage.vue'
import LoginPage from './LoginPage.vue'
import { auth, logout } from './auth'

export function createTopic18Router(): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      // memory history 初始地址是 '/'，重定向到列表页
      // （React 版用 <MemoryRouter initialEntries={['/orders']}> 直接指定初始地址）
      { path: '/', redirect: '/orders' },
      { path: '/orders', component: OrdersPage },
      // 登录页：一条再普通不过的路由，下面的守卫把人往这儿送
      //（React 版同样是路由表里的一条 <Route path="/login" element={<LoginPage />} />）
      { path: '/login', component: LoginPage },
      // 动态参数 :id —— 路径语法与 React 的 path="/orders/:id" 一致
      { path: '/orders/:id', component: OrderDetailPage },
      {
        path: '/settings',
        component: SettingsPage,
        // 真实项目的惯例：把「这条路由要不要登录」写进 meta，守卫里统一读 meta 判断，
        // 这样守卫逻辑只有一处、路由声明只负责打标记（子路由自动继承父路由的 meta）。
        // React 没有 meta 这一层（没有一一对应关系）：要保护哪条路由，就在路由表里
        // 直接把那条的 element 用 <RequireAuth> 包起来 —— 声明和拦截写在同一处。
        meta: { requiresAuth: true },
        // 嵌套路由：children 配置 + 父组件模板里的 <RouterView />
        // （对应 React 的「子 Route 写在父 Route 标签内部 + 父 element 里放 <Outlet />」）
        children: [
          // 空路径子路由 = 访问 /settings 时的默认内容，这里重定向到 profile
          // （对应 React 的 <Route index element={<Navigate to="profile" replace />} />）
          { path: '', redirect: '/settings/profile' },
          { path: 'profile', component: SettingsProfilePage },
          { path: 'notifications', component: SettingsNotificationsPage },
        ],
      },
    ],
  })

  // 每次挂载都重置登录态，便于反复演示（壳应用每次进入本题都会新建一个 router 实例）。
  // React 版不需要这一步：登录态是 Example 里的 useState，组件重新挂载天然就是初始值。
  logout()

  /**
   * 全局前置守卫 —— Vue 做登录态拦截的标准答案，也是中文面试最常问的那段代码。
   *
   * 三个参数：to（要去哪）、from（从哪来）、next（放行 / 改道 / 中断）。
   * - next() 放行；
   * - next({ path, query }) 改道到别处（对应 React 那边渲染出一个 <Navigate replace />）；
   *   注意这边不用写 replace：改道发生在导航「落地」之前，被拦下的 /settings 压根没进过历史；
   *   React 的守卫是在渲染时才拦，/settings 早已入栈，所以那边必须显式加 replace；
   * - 什么都不调用会让导航一直挂起 —— 这是 beforeEach 的经典坑，React 的组件式守卫没有这个坑
   *   （组件要么返回 <Navigate />，要么返回 children，不存在「忘了收尾」的中间态）。
   * 注：_from 用下划线开头，因为本例用不到它，而 tsconfig 开了 noUnusedParameters。
   * 另外 vue-router 4 也支持「直接 return 一个 location 对象或 true」的新写法，
   * 这里保留经典的 next(...) 三参数写法，因为面试和存量代码里见到的都是它。
   *
   * 再强调一次本题最重要的思维差异：
   * Vue 的守卫是集中式配置外挂的钩子（router.beforeEach），
   * React 的守卫就是路由表里的一个普通组件 —— 因为 React 的路由表本身就是组件树。
   */
  router.beforeEach((to, _from, next) => {
    // to.meta.requiresAuth 由上面的路由配置打标记；React 那边没有这一层，
    // 「哪条路由要守卫」直接体现在 JSX 结构上（谁被 <RequireAuth> 包着谁就要）。
    if (to.meta.requiresAuth && !auth.loggedIn) {
      // to.fullPath 自带 query（React 对照：location.pathname + location.search 自己拼），
      // 登录页读到它就能跳回用户原本想去的地方。
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
    next()
  })

  return router
}
