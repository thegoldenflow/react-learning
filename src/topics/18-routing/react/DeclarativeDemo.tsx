/**
 * 【并排】声明式模式：<MemoryRouter> / <BrowserRouter> + <Routes> + RequireAuth 三态【主流】。
 *
 * 什么时候会遇到它：v6 的存量项目大多是这种写法，面试也最常问；
 * 官方 modes 页也认可「已经有自己的数据层（例如 TanStack Query，30 题）」时使用声明式模式。
 * 它提供匹配、导航、激活状态这些基础能力，没有 loader / action / useNavigation / useBlocker，
 * 所以守卫只能在渲染时做：用 RequireAuth 包住要保护的 element。
 *
 * 本文件只演示守卫相关的差异；参数、query、NavLink、返回兜底在两种模式里写法相同，看主线 dataPages.tsx。
 */
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  MemoryRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router'
import { safeRedirect } from '@/shared/safeRedirect'
import { createDemoAuth, type DemoAuth } from './demoAuth'

type AuthStatus = 'checking' | 'authed' | 'guest'

/**
 * RequireAuth 三态：
 * - checking：刷新后还没问完后端。这时既不能放行也不能踢去登录页 ——
 *   只有 true / false 两态的话，已登录的用户会先被当成未登录送去登录页；
 * - guest：渲染 <Navigate replace />，把原地址（pathname + search）带给登录页；
 * - authed：原样返回 children。
 *
 * 「return children」可以直接返回 ReactNode：@types/react 18.2.8 起配合 TypeScript 5.1 允许函数组件返回 ReactNode，
 * 更早的类型版本要写成 <>{children}</>（与 React 19 本身无关）。
 */
function RequireAuth({ status, children }: { status: AuthStatus; children: ReactNode }) {
  const location = useLocation()

  if (status === 'checking') {
    return <p className="muted">正在确认登录状态……（checking）</p>
  }

  if (status === 'guest') {
    // 渲染一个跳转组件，而不是在函数体里调用 navigate()：渲染期间不能有副作用。
    // replace 必须加：声明式模式里 /settings 这条记录已经进了历史栈，
    // 不替换掉的话，用户在登录页按后退会回到 /settings，又被推回登录页，来回弹。
    const redirectTo = location.pathname + location.search
    return <Navigate to={`/login?${new URLSearchParams({ redirectTo })}`} replace />
  }

  return children
}

function CurrentAddress() {
  const location = useLocation()
  return (
    <p className="muted">
      地址：<code>{location.pathname + location.search}</code>
    </p>
  )
}

function DeclLoginPage({ auth }: { auth: DemoAuth }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // 声明式模式没有 <Form> / useNavigation，提交中的状态只能自己管（19 题）
  const [submitting, setSubmitting] = useState(false)
  const redirectTo = safeRedirect(searchParams.get('redirectTo'), '/orders')

  const handleLogin = async () => {
    setSubmitting(true)
    await auth.login()
    // replace：登录页不留在历史里；redirectTo 已经过 safeRedirect 校验
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="card stack">
      <h3>登录（声明式）</h3>
      <p className="muted">
        登录后跳转到：<code>{redirectTo}</code>
      </p>
      <div className="row">
        <button type="button" className="btn-primary" disabled={submitting} onClick={() => void handleLogin()}>
          {submitting ? '登录中……' : '模拟登录'}
        </button>
      </div>
    </div>
  )
}

function DeclSettingsLayout() {
  return (
    <div className="stack">
      <nav className="row nav-links">
        <NavLink to="profile">个人资料</NavLink>
        <NavLink to="notifications">通知设置</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}

function DeclarativeApp({ auth }: { auth: DemoAuth }) {
  const user = useSyncExternalStore(auth.subscribe, auth.peekUser)

  // 模拟「刷新后先问一次后端」：请求回来之前是 checking。
  // 声明式模式没有 loader，只能在组件里发起检查（真实项目常用 TanStack Query 的 useQuery 查会话，30 题）。
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    let cancelled = false
    void auth.getUser().then(() => {
      if (!cancelled) setChecked(true)
    })
    return () => {
      cancelled = true
    }
  }, [auth])

  const status: AuthStatus = !checked ? 'checking' : user ? 'authed' : 'guest'

  return (
    <MemoryRouter initialEntries={['/settings/profile']}>
      <div className="stack">
        <nav className="row nav-links">
          <NavLink to="/orders">订单</NavLink>
          <NavLink to="/settings">设置（RequireAuth）</NavLink>
          <span className="muted">登录态：{status}</span>
          {/* 登录后停在「设置」页点退出：RequireAuth 在下一次渲染就把你送回登录页 ——
              它是持续生效的渲染条件。Data 模式的 loader / middleware 只在导航（以及 action 后的重新验证）时执行。 */}
          {user && (
            <button type="button" className="btn-ghost" onClick={() => void auth.logout()}>
              退出登录
            </button>
          )}
        </nav>
        <CurrentAddress />

        {/* <Routes> 在渲染时把子元素转换成路由配置对象（createRoutesFromChildren），<Route> 本身不会被渲染，
            所以它的子元素只能是 <Route> 或 <React.Fragment>，放别的组件会直接报错。
            这就是守卫只能包在 element 上的原因；v5 时代把自定义 <PrivateRoute> 直接放进路由表的写法，v6 起不再可用【旧写法】。 */}
        <Routes>
          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route
            path="/orders"
            element={<p className="muted">订单列表（演示简化：这里只演示守卫，列表写法看主线）</p>}
          />
          <Route path="/login" element={<DeclLoginPage auth={auth} />} />
          <Route
            path="/settings"
            element={
              <RequireAuth status={status}>
                <DeclSettingsLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<p>个人资料：zhangwei@example.com</p>} />
            <Route
              path="notifications"
              element={<p className="muted">通知设置（useBlocker 是 Data 模式专有的，声明式模式里拿不到）</p>}
            />
          </Route>
        </Routes>
      </div>
    </MemoryRouter>
  )
}

/**
 * 并排演示的入口。
 * 初始地址是受保护的 /settings/profile，相当于用户直接刷新了这个页面：先 checking，再根据结果放行或去登录页。
 * 「模拟刷新」用 key 重新挂载整个应用：登录态（demoAuth 里的会话）还在，但前端要重新确认一遍。
 */
export function DeclarativeDemo({ authDelayMs = 300 }: { authDelayMs?: number }) {
  const [auth] = useState(() => createDemoAuth({ delayMs: authDelayMs }))
  const [refreshCount, setRefreshCount] = useState(0)

  return (
    <div className="stack">
      <div className="row">
        <button type="button" onClick={() => setRefreshCount((n) => n + 1)}>
          模拟刷新页面
        </button>
        <span className="muted">登录后点它：会话还在，但刷新后要先经过 checking 才放行</span>
      </div>
      <DeclarativeApp key={refreshCount} auth={auth} />
    </div>
  )
}
