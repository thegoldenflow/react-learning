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
 */
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import OrdersPage from './OrdersPage.vue'
import OrderDetailPage from './OrderDetailPage.vue'
import SettingsPage from './SettingsPage.vue'
import SettingsProfilePage from './SettingsProfilePage.vue'
import SettingsNotificationsPage from './SettingsNotificationsPage.vue'

export function createTopic18Router(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      // memory history 初始地址是 '/'，重定向到列表页
      // （React 版用 <MemoryRouter initialEntries={['/orders']}> 直接指定初始地址）
      { path: '/', redirect: '/orders' },
      { path: '/orders', component: OrdersPage },
      // 动态参数 :id —— 路径语法与 React 的 path="/orders/:id" 一致
      { path: '/orders/:id', component: OrderDetailPage },
      {
        path: '/settings',
        component: SettingsPage,
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
}
