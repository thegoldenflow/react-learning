/**
 * 学习主题：路由 —— React Router 的参数、query、嵌套路由与导航
 *
 * React 核心概念：
 * - 路由即组件：Route 就是 JSX 组件，路由表直接写在渲染输出里，和普通组件树长在一起
 * - useParams 读路径参数（/orders/:id）、useSearchParams 读写 query（?status=paid）、
 *   useNavigate 命令式跳转（navigate(-1) 后退）
 * - 嵌套路由：父 Route 的 element 里放 <Outlet />，命中的子 Route 渲染到 Outlet 位置
 * - Link 声明式跳转；NavLink 是 Link 的增强版，把 isActive 交给回调用于高亮当前项
 *
 * Vue 对应概念：
 * - 集中式路由表：createRouter({ routes: [...] }) 的配置对象，独立于组件树，还要 app.use() 安装
 * - useRoute().params / useRoute().query 读参数；useRouter().push() / back() 跳转
 * - 嵌套路由：children 配置 + 父组件模板里的 <RouterView />
 * - RouterLink 自动给激活链接加 router-link-active 类，用 CSS 命中即可
 *
 * 最重要的区别：
 * - 组织方式的思维差异：React Router 把「URL → UI」也当作渲染逻辑的一部分——
 *   路由表就是一段 JSX，可以放进任何组件、可以条件渲染、可以拆分组合；
 *   Vue Router 的路由表是集中式的配置数据（数组对象），与组件树分离，先配置后安装。
 *   React 这边没有「安装路由插件」这一步：Router 只是包在最外层的一个普通 Provider 组件。
 */
import { useState, type CSSProperties } from 'react'
import {
  Link,
  MemoryRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
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
        </nav>

        {/* 路由表本身就是 JSX：URL 命中哪个 Route，它的 element 就渲染在这里。
            Vue 对照：这些映射关系写在 router.ts 的 routes 数组里，模板里只留一个 <RouterView /> */}
        <Routes>
          <Route path="/orders" element={<OrderListPage />} />
          {/* :id 是动态段，详情页里用 useParams 读取 */}
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          {/* 嵌套路由：子 Route 写在父 Route 标签内部，渲染进父 element 的 <Outlet /> */}
          <Route path="/settings" element={<SettingsLayout />}>
            {/* index route = 父路径被精确访问时的默认内容；这里重定向到 profile。
                Vue 对照：children 里配 { path: '', redirect: '/settings/profile' } */}
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<SettingsProfilePage />} />
            <Route path="notifications" element={<SettingsNotificationsPage />} />
          </Route>
        </Routes>
      </div>
    </MemoryRouter>
  )
}
