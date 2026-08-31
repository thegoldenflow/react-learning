/**
 * 题 18 的登录态与权限（模块级 reactive，不引 Pinia，保持简单）。
 *
 * React 版对照：Example.tsx 顶层的 useState + 一个极简 AuthContext（createContext + useAuth）。
 * 两边差异有三处值得注意：
 * 1) Vue 这边可以直接 auth.loggedIn = true 就地改，改完所有读过它的地方自动更新；
 *    React 必须 setLoggedIn(true) 换新值，靠重新渲染把新值带下去（03 题的不可变更新）。
 * 2) Vue 的响应式对象可以放在模块顶层、import 就用，组件树里不需要任何 Provider；
 *    React 的 useState 必须住在某个组件里，跨层传递要么 props、要么 Context（15 题）。
 * 3) 正因为如此，React 的守卫组件 RequireAuth 才需要 useAuth() 去 Context 里取登录态；
 *    Vue 的 beforeEach 是普通函数，直接 import 这个模块读就行。
 */
import { reactive } from 'vue'

/** 当前用户拥有的权限码 —— 真实项目里由登录接口返回，这里写死，用于演示按钮级权限 */
const PERMISSIONS = ['order:read', 'order:delete']

export const auth = reactive({ loggedIn: false })

export function login() {
  auth.loggedIn = true
}

export function logout() {
  auth.loggedIn = false
}

/** 按钮级权限判断：未登录一律 false（与 React 版 AuthValue.can 逻辑完全一致） */
export function can(code: string): boolean {
  return auth.loggedIn && PERMISSIONS.includes(code)
}
