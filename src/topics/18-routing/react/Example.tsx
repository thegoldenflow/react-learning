/**
 * 学习主题：路由 —— React Router 的参数、query、嵌套路由、导航与登录态守卫
 *
 * React 核心概念：
 * - 路由即组件：Route 就是 JSX 组件，路由表直接写在渲染输出里，和普通组件树长在一起
 * - useParams 读路径参数（/orders/:id）、useSearchParams 读写 query（?status=paid）、
 *   useNavigate 命令式跳转（navigate(-1) 后退）
 * - 嵌套路由：父 Route 的 element 里放 <Outlet />，命中的子 Route 渲染到 Outlet 位置
 * - Link 声明式跳转；NavLink 是 Link 的增强版，把 isActive 交给回调用于高亮当前项
 * - 路由守卫（登录态拦截）= 一个普通包装组件：RequireAuth 里读登录态，未登录就
 *   return <Navigate to={`/login?redirect=…`} replace />，已登录就 return children；
 *   用 useLocation() 拿当前路径当回跳地址，登录页用 useSearchParams 把它读回来
 * - 按钮级权限 = 普通条件渲染：{can('order:delete') && <button>删除</button>}
 *
 * Vue 对应概念：
 * - 集中式路由表：createRouter({ routes: [...] }) 的配置对象，独立于组件树，还要 app.use() 安装
 * - useRoute().params / useRoute().query 读参数；useRouter().push() / back() 跳转
 * - 嵌套路由：children 配置 + 父组件模板里的 <RouterView />
 * - RouterLink 自动给激活链接加 router-link-active 类，用 CSS 命中即可
 * - 路由守卫 = 挂在 router 实例上的全局钩子 router.beforeEach((to, from, next) => …)，
 *   写在路由配置文件里，与组件树无关；按钮级权限常封装成自定义指令 v-permission
 *
 * 最重要的区别：
 * - 组织方式的思维差异：React Router 把「URL → UI」也当作渲染逻辑的一部分——
 *   路由表就是一段 JSX，可以放进任何组件、可以条件渲染、可以拆分组合；
 *   Vue Router 的路由表是集中式的配置数据（数组对象），与组件树分离，先配置后安装。
 *   React 这边没有「安装路由插件」这一步：Router 只是包在最外层的一个普通 Provider 组件。
 * - 守卫的思维差异（面试高频题「React 里怎么做路由守卫」）：
 *   Vue 的守卫是集中式配置外挂的钩子（router.beforeEach），
 *   React 的守卫就是路由表里的一个普通组件 —— 因为 React 的路由表本身就是组件树。
 *   React Router 根本没有「全局导航钩子」这种东西（没有一一对应关系），
 *   别去找 beforeEach 的等价物：要拦哪条路由，就把哪条路由的 element 用 <RequireAuth> 包一层。
 */
// verbatimModuleSyntax：只做类型用的导入必须带 type 关键字（这里用内联的 `type X` 写法）
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  Link,
  MemoryRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import type { Order, OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

/**
 * 本页使用的常量订单数据（不发请求，聚焦路由本身）。
 * 注意：数据、五个页面组件、路由表全写在这一个 .tsx 文件里 —— React 组件就是函数，
 * 一个文件放多个组件很常见；Vue 惯例一文件一组件，对照版把页面拆成了多个 .vue 文件。
 */
const ORDERS: Order[] = [
  {
    id: 'o1',
    orderNo: 'SO-2026-0001',
    customer: '张伟',
    amount: 557,
    status: 'paid',
    createdAt: '2026-08-01',
    items: [
      { id: 'o1-1', name: '机械键盘', price: 299, quantity: 1 },
      { id: 'o1-2', name: '无线鼠标', price: 129, quantity: 2 },
    ],
  },
  {
    id: 'o2',
    orderNo: 'SO-2026-0002',
    customer: '王芳',
    amount: 1299,
    status: 'pending',
    createdAt: '2026-08-03',
    items: [{ id: 'o2-1', name: '人体工学椅', price: 1299, quantity: 1 }],
  },
  {
    id: 'o3',
    orderNo: 'SO-2026-0003',
    customer: '李娜',
    amount: 89,
    status: 'cancelled',
    createdAt: '2026-08-05',
    items: [{ id: 'o3-1', name: '鼠标垫', price: 89, quantity: 1 }],
  },
  {
    id: 'o4',
    orderNo: 'SO-2026-0004',
    customer: '刘强',
    amount: 2458,
    status: 'paid',
    createdAt: '2026-08-08',
    items: [
      { id: 'o4-1', name: '4K 显示器', price: 2199, quantity: 1 },
      { id: 'o4-2', name: 'HDMI 线', price: 259, quantity: 1 },
    ],
  },
  {
    id: 'o5',
    orderNo: 'SO-2026-0005',
    customer: '陈静',
    amount: 668,
    status: 'pending',
    createdAt: '2026-08-10',
    items: [{ id: 'o5-1', name: '降噪耳机', price: 668, quantity: 1 }],
  },
]

/**
 * NavLink 的 style / className 都支持「函数形式」，参数里有 isActive ——
 * 高亮逻辑写在 JS 里，这是 React「一切都是 JavaScript」的典型体现。
 * Vue 的 RouterLink 则是自动加 router-link-active 类，高亮逻辑写在 CSS 里。
 */
const navStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
  fontWeight: isActive ? 700 : 400,
})

/** 列表页的状态筛选项（query 参数 ?status=xxx 的合法取值） */
const FILTERS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: ORDER_STATUS_TEXT.pending },
  { value: 'paid', label: ORDER_STATUS_TEXT.paid },
  { value: 'cancelled', label: ORDER_STATUS_TEXT.cancelled },
]

/* ══════════ 以下是「路由守卫（登录态拦截）+ 按钮级权限」小节 ══════════ */

/**
 * 【本题第二个核心考点】React 里怎么做路由守卫？
 *
 * 先把这句话记死：
 *   Vue 的守卫是集中式配置外挂的钩子（router.beforeEach），
 *   React 的守卫就是路由表里的一个普通组件 —— 因为 React 的路由表本身就是组件树。
 *
 * Vue 老手最容易犯的错：满世界翻文档找 React Router 的 beforeEach / beforeEnter。
 * 它不存在，也不会有（没有一一对应关系）。原因不是 React Router 偷懒，而是模型不同：
 * 在 React 里「导航」不是一个可被拦截的独立事件，而是一次普通的重新渲染 ——
 * URL 变了 → <Routes> 重新匹配 → 渲染命中的 element。
 * 既然拦截点落在渲染这条链路上，做法自然就是：给 element 外面套一层普通组件，
 * 这层组件先判断登录态，不通过就渲染一个 <Navigate />（声明式地「跳走」），而不是渲染页面。
 *
 * 面试话术（两种主流做法，答出第二条是加分项）：
 * 1) 包装组件 RequireAuth（本例）—— v6/v7 声明式路由的标准答案，中后台最常见的写法；
 * 2) 数据路由 createBrowserRouter（v6.4+/v7）在 loader 里判断，未登录就 throw redirect('/login')，
 *    好处是跳转发生在渲染之前、不会先闪一下受保护页面
 *    （与文件底部注释提到的是同一套数据路由 API，本课不展开）。
 */

/** 当前用户拥有的权限码 —— 真实项目里由登录接口返回，这里写死，用于演示按钮级权限 */
const PERMISSIONS = ['order:read', 'order:delete']

interface AuthValue {
  loggedIn: boolean
  login: () => void
  logout: () => void
  /** 按钮级权限判断：未登录一律 false */
  can: (code: string) => boolean
}

/**
 * 登录态本身只是 Example 顶层的一个 useState（见文件底部），这里用一个极简 Context 把它送下去
 * （15 题讲过的工业惯例：createContext + 自定义 Hook + 缺 Provider 就 throw）。
 * 为什么不用 props 一层层传？因为 RequireAuth 要能包住任意 element，
 * 它的签名必须干净到只剩 children —— 这正是 Context 的经典用途。
 * Vue 对照：provide/inject，或者干脆一个模块级 reactive（Vue 版就是这么写的，见 vue/auth.ts）。
 */
const AuthContext = createContext<AuthValue | null>(null)

function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() 必须在 <AuthContext value={...}> 内部使用')
  }
  return ctx
}

/**
 * 守卫组件：未登录渲染 <Navigate /> 跳登录页，已登录原样渲染被包住的内容。
 * 整个「守卫」就这几行 —— 它是一个再普通不过的组件，没有任何框架级的注册/安装动作。
 *
 * 四个细节都能在面试里展开讲：
 * - children 的类型是 ReactNode（13 题）；「已登录就 return children」——
 *   React 19 的类型允许函数组件直接返回 ReactNode；@types/react 18 及更早要写成 <>{children}</>。
 * - useLocation() 拿到当前 location（pathname / search / hash），把来路拼进 ?redirect=，
 *   登录成功后才跳得回用户原本想去的页面。Vue 对照：守卫回调参数 to.fullPath（自带 query）；
 *   React 这边想完全等价就写 location.pathname + location.search。
 * - replace 必须加：不加的话历史里会留下「未登录时的 /settings」，用户在登录页按后退会回到
 *   /settings，守卫又立刻把他推回 /login，来回弹跳、退不出去。Vue 对照：beforeEach 的改道发生在
 *   导航「落地」之前，被拦下的 /settings 压根没进过历史，那边不需要显式写 replace ——
 *   守卫时机不同（导航前 vs 渲染时）带来的又一处差异。
 * - 没有「忘了收尾」的中间态：Vue 的 beforeEach 必须调用 next()（或 return 一个值），
 *   忘了调导航就一直挂起，是那边的经典坑；守卫既然是普通组件，就不存在这个坑 ——
 *   它要么返回 <Navigate />，要么返回 children，函数总得返回点什么（没有一一对应关系）。
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { loggedIn } = useAuth()
  const location = useLocation()

  if (!loggedIn) {
    // 注意这是「渲染出一个跳转组件」，不是调用跳转函数：
    // 声明式跳转天然满足「渲染期不能有副作用」的约束
    // （在组件函数体里直接调 navigate() 是错的，那属于渲染期副作用，只能放事件回调或 useEffect）。
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}

/** 登录页（/login）：模拟登录后，按 query 里的 redirect 跳回原来想去的页面 */
function LoginPage() {
  const { loggedIn, login } = useAuth()
  // 回跳地址就是一条普通 query 参数，读法和列表页筛选的 ?status= 一模一样
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const redirect = searchParams.get('redirect') ?? '/orders'

  const handleLogin = () => {
    login()
    // replace: true —— 登录页不该留在历史里（理由同 RequireAuth 里那条）。
    // Vue 对照：router.replace(redirect)。
    // 安全提示（面试加分项）：redirect 来自 URL，是用户可控输入，
    // 真实项目必须校验它是站内相对路径，否则就是典型的「开放重定向」漏洞。
    navigate(redirect, { replace: true })
  }

  return (
    <div className="card stack">
      <h3>登录</h3>
      <p className="muted">
        你被 RequireAuth 拦到了这里。登录成功后会跳回：<code>{redirect}</code>
      </p>
      <div className="row">
        <button className="btn-primary" onClick={handleLogin}>
          模拟登录
        </button>
      </div>
      {loggedIn && <p className="success-text">已登录，现在可以进「设置」了</p>}
    </div>
  )
}

/* ══════════════════ 守卫小节结束 ══════════════════ */

/** 订单列表页（/orders）：演示 useSearchParams 读写 query 参数 */
function OrderListPage() {
  // useSearchParams 返回 [当前 URLSearchParams, 更新函数]，签名风格与 useState 一致。
  // Vue 对照：读 query 用 useRoute().query，改 query 用 useRouter().push({ query })——读写分离在两个对象上。
  const [searchParams, setSearchParams] = useSearchParams()

  // searchParams.get() 返回 string | null，URL 是用户可改的外部输入，必须自己收窄成合法值。
  // Vue 的 route.query.status 类型更宽（string | string[] | null | undefined），同样要收窄。
  const raw = searchParams.get('status')
  const status: OrderStatus | 'all' =
    raw === 'pending' || raw === 'paid' || raw === 'cancelled' ? raw : 'all'

  // 派生数据直接在渲染时算（09 题讲过），不需要额外 state
  const filtered = status === 'all' ? ORDERS : ORDERS.filter((o) => o.status === status)

  // setSearchParams 会向 history 压入一条新记录（可后退），等价于点了 <Link to="/orders?status=paid">。
  // Vue 对照：router.push({ path: '/orders', query: { status } })——用对象描述目标地址。
  const changeStatus = (next: OrderStatus | 'all') => {
    if (next === 'all') {
      setSearchParams({}) // 清掉 query，回到 /orders
    } else {
      setSearchParams({ status: next })
    }
  }

  return (
    <div className="stack">
      <p className="muted">
        点筛选按钮观察 query 参数变化（当前 status=
        {status}）；筛选状态存在 URL 里，刷新 / 分享 / 后退都不丢 —— 这是 query 优于组件 state 的场景
      </p>
      <div className="row">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={status === f.value ? 'btn-primary' : ''}
            onClick={() => changeStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>金额</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((o) => (
            <tr key={o.id}>
              <td>
                {/* Link 生成 <a> 但拦截点击、走客户端路由（不刷新页面）；
                    to 是字符串路径，路径参数直接拼进 URL。Vue 对照：<RouterLink :to="`/orders/${o.id}`"> */}
                <Link to={`/orders/${o.id}`}>{o.orderNo}</Link>
              </td>
              <td>{o.customer}</td>
              <td>¥{o.amount}</td>
              <td>
                <span className={`badge badge-${o.status}`}>{ORDER_STATUS_TEXT[o.status]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 订单详情页（/orders/:id）：演示 useParams 读路径参数 + useNavigate 后退 */
function OrderDetailPage() {
  // useParams 返回 Record<string, string | undefined>：路径里的 :id 段就是 params.id。
  // 每次渲染都读到最新参数 —— /orders/o1 → /orders/o2 时组件重新渲染即可拿到新 id。
  // Vue 对照：useRoute().params.id；但 Vue 复用组件实例、setup 不会重跑，
  // 要用 computed / watch 跟踪参数变化 —— React 没有这个「实例复用坑」。
  const { id } = useParams()

  // useNavigate 返回命令式跳转函数：navigate('/orders') 去指定地址，navigate(-1) 后退一步。
  // Vue 对照：useRouter().back() / router.push()。
  const navigate = useNavigate()

  // 按钮级权限用的判断函数（定义见上方「路由守卫」小节的 AuthValue / useAuth）
  const { can } = useAuth()

  const order = ORDERS.find((o) => o.id === id)

  // URL 是外部输入，参数对应的数据可能不存在，详情页必须处理「找不到」分支
  if (!order) {
    return (
      <div className="stack">
        <p className="error-text">订单不存在：{id}</p>
        <div className="row">
          <button onClick={() => navigate(-1)}>← 返回上一页</button>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="row">
        {/* navigate(-1) = 浏览器后退一步（等价 history.back()），带着列表页的筛选 query 一起回去 */}
        <button onClick={() => navigate(-1)}>← 返回上一页</button>

        {/* 按钮级权限：在 React 里它压根不是一个「新知识点」，
            就是 05 题的条件渲染 —— 条件不成立时按钮根本不进 DOM
            （比 disabled 更安全，也比用 CSS 隐藏更彻底，F12 里都翻不出来）。
            Vue 对照：v-if="can('order:delete')"；真实 Vue 项目更常把它封装成自定义指令
            v-permission="'order:delete'"，在指令的 mounted 钩子里 el.remove()。
            React 没有「指令」这个概念（没有一一对应关系），要复用就抽成组件 ——
            13 题的包装组件思路，写成 <Can code="order:delete">…</Can>。
            于是：React 的路由守卫 = 包装组件，React 的按钮权限 = 条件渲染（+ 想复用时的包装组件），
            同一套「组件即一切」的心智模型贯穿两端。 */}
        {can('order:delete') && (
          <button className="btn-danger" title="演示用，不真的删除">
            删除
          </button>
        )}
        {!can('order:delete') && (
          <span className="muted">（未登录 → 没有 order:delete 权限，删除按钮整个不渲染）</span>
        )}
      </div>
      <div className="card stack">
        <h3>
          {order.orderNo}{' '}
          <span className={`badge badge-${order.status}`}>{ORDER_STATUS_TEXT[order.status]}</span>
        </h3>
        <p>
          客户：{order.customer} ｜ 金额：¥{order.amount} ｜ 下单日期：{order.createdAt}
        </p>
        <table>
          <thead>
            <tr>
              <th>商品</th>
              <th>单价</th>
              <th>数量</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}>
                <td>{it.name}</td>
                <td>¥{it.price}</td>
                <td>{it.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * 设置页布局（/settings）：演示嵌套路由。
 * 父路由的 element 渲染公共部分（子导航），命中的子路由渲染到 <Outlet /> 的位置。
 * Vue 对照：路由表里配 children，父组件模板里放 <RouterView /> —— Outlet 就是 React 版的 RouterView。
 */
function SettingsLayout() {
  return (
    <div className="stack">
      <div className="row">
        {/* 嵌套路由里可以用相对路径：to="profile" 相对当前路由（/settings）解析成 /settings/profile。
            Vue 的 RouterLink 惯用绝对路径或命名路由（相对路径支持有限）——没有一一对应的「相对 to」体验 */}
        <NavLink to="profile" style={navStyle}>
          个人资料
        </NavLink>
        <NavLink to="notifications" style={navStyle}>
          通知设置
        </NavLink>
      </div>
      {/* 子路由内容的渲染出口 */}
      <Outlet />
    </div>
  )
}

/** 子路由一（/settings/profile） */
function SettingsProfilePage() {
  return (
    <div className="card stack">
      <h3>个人资料</h3>
      <p>用户名：张伟</p>
      <p>邮箱：zhangwei@example.com</p>
      <p className="muted">这是 /settings/profile 子路由的内容，渲染在父路由的 Outlet 位置</p>
    </div>
  )
}

/** 子路由二（/settings/notifications） */
function SettingsNotificationsPage() {
  const [emailEnabled, setEmailEnabled] = useState(true)
  return (
    <div className="card stack">
      <h3>通知设置</h3>
      <label>
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(e) => setEmailEnabled(e.target.checked)}
        />{' '}
        接收邮件通知（当前：{emailEnabled ? '开' : '关'}）
      </label>
      <p className="muted">
        切到「个人资料」再切回来，勾选状态会重置 —— 子路由切换 = 组件卸载再挂载，两框架一致。
        Vue 可以用 KeepAlive 缓存被切走的组件；React 没有内置对应物（没有一一对应关系，
        只能状态提升或用社区方案）。
      </p>
    </div>
  )
}

export default function Example() {
  /**
   * 登录态：最简单的做法就是 Example 顶层一个 useState，再用上面那个极简 Context 送下去。
   * 真实中后台里它一般住在全局 store（16 题 Zustand / Pinia）里，本题不为它引入 Zustand。
   * Vue 对照：vue/auth.ts 里模块级的 reactive({ loggedIn: false })——
   * Vue 可以 auth.loggedIn = true 就地改；React 必须走 setState 换新值（03 题的不可变更新）。
   */
  const [loggedIn, setLoggedIn] = useState(false)

  /**
   * Context 的 value 用 useMemo 保持引用稳定（17 题）：
   * 不包 useMemo 的话，每次 Example 重渲染都会造一个新对象，
   * 所有 useAuth() 的组件都跟着重渲染 —— 这是 Context 的经典性能坑。
   * Vue 那边没有这个问题：注入的 reactive 是精准依赖追踪的（没有一一对应关系）。
   */
  const auth = useMemo<AuthValue>(
    () => ({
      loggedIn,
      login: () => setLoggedIn(true),
      logout: () => setLoggedIn(false),
      can: (code) => loggedIn && PERMISSIONS.includes(code),
    }),
    [loggedIn],
  )

  return (
    /**
     * 本示例嵌在学习站点里，用 MemoryRouter 把路由状态放在内存（不碰浏览器地址栏，
     * 避免与壳应用自身的路由冲突）；真实应用用 BrowserRouter —— 除了最外层容器不同，
     * 其余 API（Routes/Route/Link/各种 hook）完全一样。initialEntries 指定初始地址。
     *
     * 版本说明：react-router v7 的声明式 API 与 v6 完全相同（面试主流问的就是这套）；
     * v6.4+ 另有 createBrowserRouter 的「数据路由」（loader/action），是另一种组织方式，本课不展开。
     *
     * 补充一个硬规则：React Router 规定一棵组件树里只能有一个 <Router>，嵌套会直接报错
     * "You cannot render a <Router> inside another <Router>"。学习站点的壳本身是 BrowserRouter，
     * 所以本示例被挂进了一棵独立的 React 树（见 src/bridge/ReactIsolatedMount.tsx）。
     * Vue Router 是 app 级插件（app.use(router)），同样是一个应用一个 router 实例。
     */
    <MemoryRouter initialEntries={['/orders']}>
      {/* React 19 起 Context 本身就能当 Provider 用（15 题）；React 18 及更早写 <AuthContext.Provider value={...}>。
          Provider 放在 <MemoryRouter> 内部：RequireAuth 同时要用 useAuth() 和 useLocation()，
          两者的包裹顺序在这里可以任意，习惯上写成「路由在外、业务 Context 在内」 */}
      <AuthContext value={auth}>
        <div className="stack">
          <nav className="row">
            {/* NavLink 默认按「URL 前缀」判定激活（加 end 属性才要求精确匹配），
                所以进入 /orders/o1 详情页时「订单」仍保持高亮；
                Vue 的 router-link-active 基于路由记录匹配，/orders/:id 是兄弟路由，
                详情页里「订单」不会高亮 —— 两边判定规则略有差异 */}
            <NavLink to="/orders" style={navStyle}>
              订单
            </NavLink>
            <NavLink to="/settings" style={navStyle}>
              设置
            </NavLink>

            {/* 登录态显示 + 退出登录：方便反复演示守卫。
                未登录时点上面的「设置」→ 被 RequireAuth 拦到 /login；
                登录后再点「设置」→ 正常进入；此时点「退出登录」，如果人正停在 /settings，
                RequireAuth 会在这次重渲染里立刻把你弹回登录页 ——
                守卫是「持续生效的渲染条件」，不是「进入路由时跑一次的钩子」，
                这是它与 beforeEach 的又一个实质差异（Vue 那边得自己 watch 登录态再手动 push）。 */}
            <span className="muted">当前：{loggedIn ? '已登录' : '未登录'}</span>
            {loggedIn && (
              <button className="btn-ghost" onClick={() => setLoggedIn(false)}>
                退出登录
              </button>
            )}
          </nav>

          {/* 路由表本身就是 JSX：URL 命中哪个 Route，它的 element 就渲染在这里。
              Vue 对照：这些映射关系写在 router.ts 的 routes 数组里，模板里只留一个 <RouterView /> */}
          <Routes>
            <Route path="/orders" element={<OrderListPage />} />
            {/* :id 是动态段，详情页里用 useParams 读取 */}
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            {/* 登录页：一条再普通不过的路由，守卫把人往这儿送 */}
            <Route path="/login" element={<LoginPage />} />
            {/* 嵌套路由：子 Route 写在父 Route 标签内部，渲染进父 element 的 <Outlet />。
                ★ 加守卫的全部动作就是下面这一处：把 element 用 <RequireAuth> 包一层。
                  - 保护整个子树：包在父路由的 element 上（本例），/settings 及其所有子路由一起被拦；
                  - 只保护某一个子页面：把 <RequireAuth> 挪到那个子 Route 的 element 上即可；
                  - 守卫本身也能复用/组合：它就是个组件，可以再套 <RequireRole role="admin">，
                    也可以做成布局路由 <Route element={<RequireAuth><Outlet /></RequireAuth>}> 一次罩住一批路由。
                这种「拦截粒度随手可调」正是「路由表即组件树」带来的好处；
                Vue 那边的对应做法是在集中式配置里给路由加 meta: { requiresAuth: true }，
                再由全局 beforeEach 统一读 meta 判断 —— 守卫逻辑与路由声明分居两处。
                另外注意 <RequireAuth> 是完全透明的一层：SettingsLayout 里的 <Outlet /> 照常工作，
                子路由匹配由 <Route> 的结构决定，与 element 里额外夹了几层普通组件无关。 */}
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <SettingsLayout />
                </RequireAuth>
              }
            >
              {/* index route = 父路径被精确访问时的默认内容；这里重定向到 profile。
                  Vue 对照：children 里配 { path: '', redirect: '/settings/profile' } */}
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<SettingsProfilePage />} />
              <Route path="notifications" element={<SettingsNotificationsPage />} />
            </Route>
          </Routes>
        </div>
      </AuthContext>
    </MemoryRouter>
  )
}
