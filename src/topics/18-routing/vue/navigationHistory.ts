/**
 * 「返回上一页」前先判断应用内有没有上一页（用户直接打开详情页链接时没有）。
 *
 * - 生产常用的 createWebHistory：vue-router 在 window.history.state 里记录 back 字段，
 *   第一条应用内记录的 back 是 null（node_modules/vue-router/dist/vue-router.js 的 buildState）。
 *   这是源码层面的行为，官方文档没有把它列为公开 API，升级时要复核；
 * - 本演示用的 createMemoryHistory 不记录 back，这里退化为「挂载后发生过应用内导航」（演示简化）。
 *
 * React 对照：location.key === 'default' 表示当前是第一条记录（react/dataPages.tsx 的 goBack）。
 */
import { START_LOCATION, type Router } from 'vue-router'

const navigatedRouters = new WeakSet<Router>()

/** 在 router.ts 里调用一次：记录「发生过应用内导航」 */
export function trackInAppNavigation(router: Router): void {
  router.afterEach((_to, from, failure) => {
    if (!failure && from !== START_LOCATION) navigatedRouters.add(router)
  })
}

export function hasInAppHistory(router: Router): boolean {
  return navigatedRouters.has(router)
}
