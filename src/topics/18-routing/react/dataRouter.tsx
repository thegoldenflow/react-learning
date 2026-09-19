/**
 * 【主线】Data 模式的路由配置 —— react-router 7.x，写法兼容 8.x。
 * 阅读顺序：Example.tsx 文件头 → 本文件（路由表、loader、action、守卫）→ dataPages.tsx（页面组件）。
 *
 * Data 模式【主流·v6.4 起】的核心：路由表是在 React 渲染之外创建的配置数组，
 * 每条路由除了 path 和组件，还能挂：
 * - loader：进入前取数，组件里用 useLoaderData 读；
 * - action：处理 <Form method="post"> 与 fetcher.Form / fetcher.submit 的提交；
 * - errorElement：本路由（及子路由）的 loader / action / 渲染出错时显示；
 * - handle：任意元数据，useMatches 读（本例做面包屑）；
 * - lazy：按需加载路由模块；
 * - middleware【较新·7.9 起】：导航时包在 loader 外面执行的拦截链。
 * 导航时 React Router 先跑 middleware 和 loader，全部完成后才提交导航、渲染新页面 ——
 * 这就是「渲染前拦截」，Vue Router 的 beforeEach 也在这个时机（见 vue/router.ts）。
 *
 * 使用频率（依据见 Example.tsx 文件头）：守卫用 loader 里 redirect【最常用】、middleware【较新·7.9 起】【常用】；
 * 提交后跳转用 action 里 redirect【最常用】；不跳转页面的提交用 useFetcher【最常用】（星标 action）；函数式 lazy【常用】。
 */
import {
  createContext,
  createMemoryRouter,
  data,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MiddlewareFunction,
  type RouteObject,
} from 'react-router'
import { fetchOrder, fetchOrders } from '@/shared/mockApi'
import { safeRedirect } from '@/shared/safeRedirect'
import type { Order, OrderStatus } from '@/shared/types'
import type { DemoAuth, DemoUser } from './demoAuth'
import type { DemoLog } from './demoLog'
import {
  DataHydrateFallback,
  DataRootError,
  DataRootLayout,
  LoginPage,
  OrderDetailPage,
  OrderErrorPage,
  OrderListPage,
  SettingsLayout,
  SettingsNotificationsPage,
  SettingsProfilePage,
} from './dataPages'

/**
 * 类型开关：让 loader / action / middleware 参数里的 context 带上 RouterContextProvider 的类型。
 * Data 模式运行时不需要任何 future flag：7.8.2 起 createBrowserRouter 去掉了 middleware 的开关，
 * 7.9 起 middleware 稳定；这段 declare module 只影响类型（官方 how-to/middleware：
 * 「Without this, context stays loosely typed even when middleware is enabled at runtime」）。
 * Framework 模式在 v7 仍要在 react-router.config.ts 里开 future.v8_middleware；v8 起两者都不再需要。
 */
declare module 'react-router' {
  interface Future {
    v8_middleware: true
  }
}

/** createDataRouter 需要的外部依赖：每个 router 实例一份，测试里可以换成零延迟的版本 */
export interface DataRouterDeps {
  auth: DemoAuth
  log: DemoLog
  /** 模拟接口延迟（毫秒） */
  delayMs: number
}

/** 路由 handle 的形状：面包屑文字由各路由自己决定（详情页用 loader 返回的订单号） */
export interface CrumbHandle {
  crumb: (loaderData: unknown) => string
}

export const PAGE_SIZE = 5

export interface OrdersLoaderData {
  status: OrderStatus | 'all'
  page: number
  pageCount: number
  total: number
  orders: Order[]
}

export interface OrderLoaderData {
  order: Order
  /** 是否已星标：由详情页的 useFetcher 提交给 :id 路由的 action 修改 */
  starred: boolean
}

export interface ProfileLoaderData {
  email: string
}

export interface LoginActionData {
  error: string
}

/** 路由上下文（React Router 的 createContext，不是 React 的）：middleware 写入，下游 loader 读取 */
export const userContext = createContext<DemoUser | null>(null)

/** URL 是用户可改的外部输入，读出来要收窄成合法值 */
function parseStatus(raw: string | null): OrderStatus | 'all' {
  return raw === 'pending' || raw === 'paid' || raw === 'cancelled' ? raw : 'all'
}

function parsePage(raw: string | null): number {
  const page = Number(raw)
  return Number.isInteger(page) && page > 0 ? page : 1
}

/** 日志里显示的「这次导航去哪」：pathname + search */
function target(request: Request): string {
  const url = new URL(request.url)
  return url.pathname + url.search
}

/**
 * 被守卫拦下时去登录页，并把原地址（含 query）带上。
 * 用 new URL(request.url) 取地址：v6.4 起就能这么写；7.15 起 loader 参数里另有 url 字段【较新】。
 */
function loginPathFor(request: Request): string {
  return `/login?${new URLSearchParams({ redirectTo: target(request) })}`
}

/* ───────────────────────── middleware【较新·7.9 起】 ───────────────────────── */

/**
 * 根路由上的日志 middleware：演示 middleware 的两个特点。
 * 1) 客户端 middleware 每次导航都会执行，不管这次有没有 loader 要跑
 *    （官方原文：「Client middlewares will run on every client navigation, regardless of
 *    whether there are loaders to run」）；
 * 2) 父路由的 middleware 先于子路由执行；await next() 之后的代码在所有 loader 跑完后才执行。
 */
function createNavigationLogMiddleware(log: DemoLog): MiddlewareFunction {
  return async ({ request }, next) => {
    log.add(`${target(request)} · 根 middleware：开始`)
    await next()
    log.add(`${target(request)} · 根 middleware：下游全部完成`)
  }
}

/**
 * 守卫写法二【较新·7.9 起】【常用】：挂在无 path 分组路由上的 middleware（频率：工程经验 —— 7.9 才稳定，存量代码里少）。
 * - 未登录时在调用 next() 之前 throw redirect：下游的 loader 根本不会执行，不会白发请求；
 * - 登录了就把用户写进路由上下文，下游 loader 用 context.get(userContext) 读，不必再查一遍；
 * - 不调用 next() 也可以：函数返回后 React Router 会自动继续（next 最多只能调用一次）。
 */
function createRequireAuthMiddleware({ auth, log }: DataRouterDeps): MiddlewareFunction {
  return async ({ request, context }) => {
    const user = await auth.getUser() // 可以直接 await：检查完成之前导航不会提交
    if (!user) {
      log.add(`${target(request)} · 守卫 middleware：未登录 → redirect（下游 loader 不执行）`)
      throw redirect(loginPathFor(request))
    }
    context.set(userContext, user)
    log.add(`${target(request)} · 守卫 middleware：已登录，放行`)
  }
}

/* ───────────────────────────────── loader ───────────────────────────────── */

/**
 * 守卫写法一【最常用】（v6.4 起）：无 path 分组路由的 loader 里 throw redirect。
 * 官方 navigating 页讲 redirect 的第一个示例就是它：loader 里查用户，没有就 redirect('/login')。
 * 面试要能说出它的两个坑（看日志面板）：
 * 1) 同一次导航里父子路由的 loader 是并行执行的（官方 createBrowserRouter 文档：「running loaders in parallel」），
 *    父级这里 redirect 时，子路由的 loader 往往已经发出请求了；
 * 2) 子路由的 loader 自己也 redirect 时（例如 /settings 的 index 路由转去 /settings/profile），
 *    React Router 采用最深一层的那个 redirect（源码 findRedirect 从最后一个匹配往前找），
 *    守卫的 redirect 要等下一次导航才生效 —— 所以日志里是 /settings → /settings/profile → /login。
 * 用 middleware 守卫就没有这两个问题：它在所有 loader 之前执行。
 */
function createRequireAuthLoader({ auth, log }: DataRouterDeps) {
  return async ({ request }: LoaderFunctionArgs) => {
    const user = await auth.getUser()
    if (!user) {
      log.add(`${target(request)} · 守卫 loader：未登录 → throw redirect`)
      throw redirect(loginPathFor(request))
    }
    log.add(`${target(request)} · 守卫 loader：已登录，放行`)
    return null
  }
}

/** 订单列表：筛选条件和页码都来自 URL，所以刷新、分享、后退都能还原同一页 */
function createOrdersLoader({ log, delayMs }: DataRouterDeps) {
  return async ({ request }: LoaderFunctionArgs): Promise<OrdersLoaderData> => {
    const url = new URL(request.url)
    const status = parseStatus(url.searchParams.get('status'))
    const page = parsePage(url.searchParams.get('page'))
    log.add(`${target(request)} · 订单列表 loader：请求第 ${page} 页`)
    // request.signal：导航被新的导航打断时会 abort，顺手传给请求函数取消掉（27 题）
    const result = await fetchOrders(
      { status, page, pageSize: PAGE_SIZE },
      { signal: request.signal, delayMs },
    )
    return {
      status,
      page,
      total: result.total,
      pageCount: Math.max(1, Math.ceil(result.total / PAGE_SIZE)),
      orders: result.items,
    }
  }
}

/**
 * 订单详情：找不到就 throw data(…, { status: 404 })。
 * 抛出的是「响应」而不是 Error，errorElement 里用 isRouteErrorResponse 区分出来，显示 404 文案。
 */
function createOrderLoader({ log, delayMs }: DataRouterDeps, starredIds: ReadonlySet<string>) {
  return async ({ request, params }: LoaderFunctionArgs): Promise<OrderLoaderData> => {
    log.add(`${target(request)} · 订单详情 loader：请求 ${params.id}`)
    const order = await fetchOrder(params.id ?? '', { signal: request.signal, delayMs })
    if (!order) {
      throw data(`订单 ${params.id} 不存在`, { status: 404 })
    }
    return { order, starred: starredIds.has(order.id) }
  }
}

/** 设置子页的 loader：只用来在日志里证明「它有没有被执行」 */
function createProfileLoader({ log, delayMs }: DataRouterDeps) {
  return async ({ request }: LoaderFunctionArgs): Promise<ProfileLoaderData> => {
    log.add(`${target(request)} · 个人资料 loader：已发出请求`)
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return { email: 'zhangwei@example.com' }
  }
}

/** 已登录的人再打开登录页，直接送回目标页（同样要过 safeRedirect） */
function createLoginLoader({ auth }: DataRouterDeps) {
  return async ({ request }: LoaderFunctionArgs) => {
    if (auth.peekUser()) {
      const redirectTo = new URL(request.url).searchParams.get('redirectTo')
      throw redirect(safeRedirect(redirectTo, '/orders'))
    }
    return null
  }
}

/* ───────────────────────────────── action ───────────────────────────────── */

/**
 * 星标 action：详情页用 useFetcher 提交到这里（不跳转页面的提交，useFetcher【最常用】）。
 * - fetcher.Form 不写 action 时提交给「它所在的路由」，也就是 :id 这条路由；
 * - action 成功后（没有抛错，状态码也不是 4xx / 5xx），React Router 自动重新执行页面上的 loader（「triggering a revalidation of route data」），
 *   所以详情页的 loader 会再跑一次、拿到新的 starred，不用手动刷新；
 * - 地址不变、历史栈不变，useNavigation 也不会变成 submitting（fetcher 有自己的 state）。
 * 演示简化：星标存在这个 router 实例的内存里（starredIds），真实项目是调接口。
 */
function createStarAction({ log, delayMs }: DataRouterDeps, starredIds: Set<string>) {
  return async ({ request, params }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const starred = formData.get('starred') === 'true'
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    if (starred) starredIds.add(params.id ?? '')
    else starredIds.delete(params.id ?? '')
    log.add(`${target(request)} · 星标 action：starred=${starred}（结束后页面上的 loader 重新执行）`)
    return { ok: true }
  }
}

/**
 * 登录 action：处理 <Form method="post"> 的提交。
 * - 回跳地址来自表单（最初来自 URL），先过 safeRedirect 再 redirect：
 *   redirect 收到跨域的绝对地址会在浏览器里整页跳过去，所以校验必须做；
 * - 失败时 return data({ error }, { status: 401 })，页面用 useActionData 读出来显示；
 * - 成功后 throw redirect(...)；action 结束后 React Router 会自动重新执行页面上的 loader，
 *   不用手动刷新数据。
 */
function createLoginAction({ auth, log }: DataRouterDeps) {
  return async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const redirectTo = safeRedirect(formData.get('redirectTo'), '/orders')
    if (formData.get('simulateError') === 'on') {
      log.add('/login · 登录 action：模拟账号或密码错误 → 401')
      return data<LoginActionData>({ error: '账号或密码错误（模拟）' }, { status: 401 })
    }
    await auth.login()
    log.add(`/login · 登录 action：成功 → redirect ${redirectTo}`)
    throw redirect(redirectTo)
  }
}

function createLogoutAction({ auth, log }: DataRouterDeps) {
  return async () => {
    await auth.logout()
    log.add('/logout · 登出 action → redirect /login')
    throw redirect('/login')
  }
}

/* ─────────────────────────────── 路由表 ─────────────────────────────── */

/**
 * 路由表：一个普通数组。和 vue/router.ts 的 routes 是同一种「配置」形态 ——
 * 「React 的路由表是组件树、Vue 的是配置」只是声明式模式的表象，不是框架差异。
 *
 * Component 与 element 二选一，两种都常见：v7 官方文档的示例大多写 Component（6.9 起），
 * 存量的 6.4+ 代码多是 element（工程经验）。要传 props 时写 element（根路由要把 auth / log 交给布局组件）。
 */
export function createDataRoutes(deps: DataRouterDeps): RouteObject[] {
  const settingsCrumb: CrumbHandle = { crumb: () => '设置' }
  // 模拟后端存的星标（每个 router 实例一份，测试之间互不影响）
  const starredIds = new Set<string>()

  return [
    {
      id: 'root',
      path: '/',
      element: <DataRootLayout auth={deps.auth} log={deps.log} />,
      // 首次加载时 loader 还没跑完，先渲染它；不提供的话开发环境会警告
      HydrateFallback: DataHydrateFallback,
      // 根错误边界：子路由没有自己的 errorElement 时，错误冒泡到这里
      errorElement: <DataRootError />,
      middleware: [createNavigationLogMiddleware(deps.log)],
      children: [
        { index: true, loader: () => redirect('/orders') },
        {
          path: 'orders',
          handle: { crumb: () => '订单' } satisfies CrumbHandle,
          children: [
            { index: true, loader: createOrdersLoader(deps), Component: OrderListPage },
            {
              // 动态段 :id —— loader 的 params.id 和组件里的 useParams().id 读到同一个值
              path: ':id',
              loader: createOrderLoader(deps, starredIds),
              // 详情页的 useFetcher（星标）提交到这里
              action: createStarAction(deps, starredIds),
              Component: OrderDetailPage,
              // 详情页自己的错误边界：404 只替换这一块，上面的导航和面包屑还在
              errorElement: <OrderErrorPage />,
              handle: {
                crumb: (loaderData) => (loaderData as OrderLoaderData | undefined)?.order.orderNo ?? '订单详情',
              } satisfies CrumbHandle,
            },
          ],
        },
        { path: 'login', loader: createLoginLoader(deps), action: createLoginAction(deps), Component: LoginPage },
        // 只有 action 没有组件的路由：<Form method="post" action="/logout"> 提交到这里
        { path: 'logout', action: createLogoutAction(deps) },
        {
          // 守卫写法一【最常用】：无 path 的分组路由 + loader。
          // 没有组件的路由默认渲染 <Outlet />，所以它只负责拦截，不影响页面结构。
          id: 'guard-by-loader',
          loader: createRequireAuthLoader(deps),
          children: [
            {
              path: 'settings',
              Component: SettingsLayout,
              handle: settingsCrumb,
              children: [
                // 访问 /settings 时转去个人资料页。未登录时它和上面的守卫 loader 同时 redirect，最深一层的这个先生效
                { index: true, loader: () => redirect('/settings/profile') },
                {
                  path: 'profile',
                  loader: createProfileLoader(deps),
                  Component: SettingsProfilePage,
                  handle: { crumb: () => '个人资料' } satisfies CrumbHandle,
                },
                {
                  path: 'notifications',
                  Component: SettingsNotificationsPage,
                  handle: { crumb: () => '通知设置' } satisfies CrumbHandle,
                },
              ],
            },
          ],
        },
        {
          // 守卫写法二【较新·7.9 起】【常用】：无 path 的分组路由 + middleware
          id: 'guard-by-middleware',
          middleware: [createRequireAuthMiddleware(deps)],
          children: [
            {
              path: 'reports',
              handle: { crumb: () => '报表' } satisfies CrumbHandle,
              // 路由级懒加载【常用】（6.9 起）：函数返回路由的非匹配字段（Component、loader、action、errorElement……），
              // 第一次导航到这里时才下载 ReportsPage 的代码。path / index / children 不能懒加载
              // （匹配路由时就要用到），函数式写法也不能懒加载 middleware；7.5 起另有按字段拆开的对象式 lazy【较新】【少用】（Example.tsx 附 3）。
              // Vue 对照：component: () => import('./ReportsPage.vue')
              lazy: async () => {
                const { ReportsPage, createReportsLoader } = await import('./ReportsPage')
                return { Component: ReportsPage, loader: createReportsLoader(deps.log, deps.delayMs) }
              },
            },
          ],
        },
      ],
    },
  ]
}

/**
 * 创建路由器。生产环境用 createBrowserRouter(routes)（地址栏同步），
 * 嵌入演示和测试用 createMemoryRouter（历史记录放在内存里，不碰地址栏）。
 * 官方要求 router 在 React 组件树之外只创建一次（「Data Routers should not be held in React state」），
 * 所以 Example.tsx 在模块顶层调用它，而不是放进 useState。
 */
export function createDataRouter(
  deps: DataRouterDeps,
  { initialEntries = ['/orders'] }: { initialEntries?: string[] } = {},
) {
  return createMemoryRouter(createDataRoutes(deps), { initialEntries })
}
