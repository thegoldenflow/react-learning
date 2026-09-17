/**
 * 18 题 Vue 侧的模拟登录态（模块级 reactive，不引 Pinia，保持简单）。
 *
 * 和 React 侧 demoAuth.ts 一样是异步的：刷新页面后要先问后端「我登录了吗」。
 * - checking：还没问完；guest：未登录；authed：已登录。
 * - Vue 的 beforeEach 在导航提交前执行，可以直接 await checkSession()（和 React Data 模式的 loader / middleware 同一个时机）；
 *   React 声明式模式的 RequireAuth 只能在渲染时判断，所以那边要把 checking 渲染出来。
 *
 * 两个框架写法上的差异：Vue 可以直接改 auth.status，读过它的地方自动更新；
 * React 要通过 setState 或 useSyncExternalStore 订阅，才能让组件重新渲染。
 * 前端登录态只影响界面，真正的鉴权在后端（35 题，待新增）。
 */
import { reactive } from 'vue'

export type AuthStatus = 'checking' | 'authed' | 'guest'

/** 当前用户拥有的权限码 —— 真实项目里由登录接口返回，这里写死，用于演示按钮级权限 */
const PERMISSIONS = ['order:read', 'order:delete']

export const auth = reactive({
  status: 'checking' as AuthStatus,
  userName: '',
})

/** 模拟后端的会话：只有 login / logout 能改它 */
let sessionUser: string | null = null
let delayMs = 300

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function applySession() {
  auth.status = sessionUser ? 'authed' : 'guest'
  auth.userName = sessionUser ?? ''
}

/** 每次挂载本题时重置（壳应用每次进入都会新建 router，见 router.ts） */
export function resetAuth(options: { delayMs?: number } = {}) {
  sessionUser = null
  delayMs = options.delayMs ?? 300
  auth.status = 'checking'
  auth.userName = ''
}

/** 模拟「向后端确认会话」，返回是否已登录 */
export async function checkSession(): Promise<boolean> {
  await wait(delayMs)
  applySession()
  return sessionUser !== null
}

export async function login(): Promise<void> {
  await wait(delayMs)
  sessionUser = '张伟'
  applySession()
}

export async function logout(): Promise<void> {
  await wait(delayMs)
  sessionUser = null
  applySession()
}

/** 按钮级权限判断：未登录一律 false（与 React 侧 can() 一致）。只影响界面，不是安全措施 */
export function can(code: string): boolean {
  return auth.status === 'authed' && PERMISSIONS.includes(code)
}
