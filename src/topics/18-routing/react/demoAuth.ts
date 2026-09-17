/**
 * 18 题的模拟登录态。Data 模式主线与声明式并排各自创建一份，互不影响。
 *
 * 为什么做成异步：真实项目刷新页面后，前端并不知道自己是否已登录，要先问后端
 * （例如 GET /api/session，或校验本地 token）。这段「检查中」的时间：
 * - Data 模式的 loader / middleware 可以直接 await，检查完成之前导航不会提交，页面不会先渲染出来；
 * - 声明式模式没有「渲染前」这个时机，RequireAuth 只能在渲染时判断，所以要有 checking 第三态。
 *
 * 安全边界【主流】：这里的登录态和权限码只决定「界面显示什么」。前端判断可以被绕过
 * （直接调接口、改本地状态），真正的鉴权必须由后端对每个请求完成（35 题，待新增）。
 * 真实项目里登录态一般放在全局 store（16 题 Zustand / Pinia）或 TanStack Query 的会话查询里（30 题）。
 */

export interface DemoUser {
  name: string
  /** 权限码：由后端下发，前端只用来决定显示哪些按钮 */
  permissions: readonly string[]
}

export interface DemoAuth {
  /** 模拟「向后端确认当前会话」：延迟后返回当前用户，未登录返回 null */
  getUser(): Promise<DemoUser | null>
  /** 模拟登录接口 */
  login(): Promise<DemoUser>
  /** 模拟登出接口 */
  logout(): Promise<void>
  /** 同步读取最近一次已知的用户，只用于界面展示（不代表后端刚确认过） */
  peekUser(): DemoUser | null
  /** 订阅登录态变化（配合 useSyncExternalStore 使用） */
  subscribe(listener: () => void): () => void
}

const DEMO_USER: DemoUser = { name: '张伟', permissions: ['order:read', 'order:delete'] }

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createDemoAuth({ delayMs = 300 }: { delayMs?: number } = {}): DemoAuth {
  let user: DemoUser | null = null
  const listeners = new Set<() => void>()
  const setUser = (next: DemoUser | null) => {
    user = next
    listeners.forEach((listener) => listener())
  }

  return {
    async getUser() {
      await wait(delayMs)
      return user
    },
    async login() {
      await wait(delayMs)
      setUser(DEMO_USER)
      return DEMO_USER
    },
    async logout() {
      await wait(delayMs)
      setUser(null)
    },
    peekUser: () => user,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** 按钮级权限判断：未登录一律 false。只影响界面，不是安全措施（见文件头） */
export function can(user: DemoUser | null, code: string): boolean {
  return user !== null && user.permissions.includes(code)
}
