/**
 * 【主线】Data 模式的页面组件。路由表、loader、action、守卫在 dataRouter.tsx。
 *
 * 和声明式模式相比，这里的组件多了几件「只有 Data 模式才有」的工具（在 <MemoryRouter> /
 * <BrowserRouter> 下调用会直接报错，因为它们依赖路由器实例）：
 * useLoaderData / useActionData / useRouteError / useNavigation / useBlocker / useMatches / useFetcher，以及 <Form>。
 * useParams / useSearchParams / useNavigate / useLocation / Link / NavLink / Outlet 两种模式通用。
 */
import { useState, useSyncExternalStore } from 'react'
import {
  Form,
  isRouteErrorResponse,
  Link,
  NavLink,
  Outlet,
  useActionData,
  useBeforeUnload,
  useBlocker,
  useFetcher,
  useLoaderData,
  useLocation,
  useMatches,
  useNavigate,
  useNavigation,
  useOutletContext,
  useParams,
  useRouteError,
  useSearchParams,
} from 'react-router'
import { safeRedirect } from '@/shared/safeRedirect'
import { ORDER_STATUS_TEXT, type OrderStatus } from '@/shared/types'
import { can, type DemoAuth, type DemoUser } from './demoAuth'
import type { DemoLog } from './demoLog'
import type {
  CrumbHandle,
  LoginActionData,
  OrderLoaderData,
  OrdersLoaderData,
  ProfileLoaderData,
} from './dataRouter'

/** 根布局通过 <Outlet context> 传给子页面的数据，子页面用 useOutletContext 读 */
export interface RootOutletContext {
  user: DemoUser | null
}

const FILTERS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: ORDER_STATUS_TEXT.pending },
  { value: 'paid', label: ORDER_STATUS_TEXT.paid },
  { value: 'cancelled', label: ORDER_STATUS_TEXT.cancelled },
]

function isCrumbHandle(handle: unknown): handle is CrumbHandle {
  return typeof handle === 'object' && handle !== null && 'crumb' in handle
}

/** 首次加载时 loader 还在跑，RouterProvider 先渲染根路由的 HydrateFallback */
export function DataHydrateFallback() {
  return <p className="muted">首次加载：loader 还在执行，先显示 HydrateFallback……</p>
}

/**
 * 根路由的 errorElement：loader / action / 渲染里抛出的错误，子路由没接住就冒泡到这里。
 * 错误边界会替换掉整个根布局（导航也不见了），所以留一个回到列表的链接。
 */
export function DataRootError() {
  const error = useRouteError()
  return (
    <div className="card stack">
      <h3>出错了</h3>
      <p className="error-text">
        {isRouteErrorResponse(error)
          ? `${error.status}：${String(error.data)}`
          : error instanceof Error
            ? error.message
            : '未知错误'}
      </p>
      <Link to="/orders">回到订单列表</Link>
    </div>
  )
}

/** 根布局：导航、地址、面包屑、加载状态、日志面板，页面内容渲染在 <Outlet /> 的位置 */
export function DataRootLayout({ auth, log }: { auth: DemoAuth; log: DemoLog }) {
  // 登录态只用来显示；真正的拦截发生在 loader / middleware 里（渲染之前）
  const user = useSyncExternalStore(auth.subscribe, auth.peekUser)
  const logLines = useSyncExternalStore(log.subscribe, log.getSnapshot)

  // useNavigation【最常用】（Data 模式专有）：idle / loading / submitting（官方 Pending UI 页「Global Pending Navigation」的写法）。
  // 导航期间旧页面保持显示，直到新页面的 loader 全部完成 —— 用它显示「加载中」提示。
  const navigation = useNavigation()
  const location = useLocation()

  // useMatches + handle【常用】：每个命中的路由都能贡献一段面包屑（频率：工程经验，后台系统的布局常见）。
  // 读 loaderData，不要读 data：UIMatch.data 在 7.x 已标 @deprecated（v8 删除）。
  const crumbs = useMatches().flatMap((match) =>
    isCrumbHandle(match.handle) ? [match.handle.crumb(match.loaderData)] : [],
  )

  return (
    <div className="stack">
      {/* NavLink 激活时默认加 class="active" 和 aria-current="page"（aria-current 的值可以用同名属性改掉），
          样式靠 CSS 命中 .active 即可（见 shared/styles.css 的 .nav-links）；
          className / style 也接受函数 ({ isActive, isPending }) => ...，给 Tailwind、CSS-in-JS 用。
          默认按 URL 前缀判定激活（end 属性要求精确匹配），所以在 /orders/o1 时「订单」仍然高亮。
          Vue 对照：RouterLink 默认加 router-link-active / router-link-exact-active，
          但它按「路由记录」判定，/orders/:id 与 /orders 是兄弟记录，详情页里「订单」不高亮。 */}
      <nav className="row nav-links">
        <NavLink to="/orders">订单</NavLink>
        <NavLink to="/settings">设置（loader 守卫）</NavLink>
        <NavLink to="/reports">报表（middleware 守卫）</NavLink>
        <span className="muted">当前：{user ? `已登录（${user.name}）` : '未登录'}</span>
        {user && (
          // 登出也是一次提交：交给 /logout 路由的 action 处理，结束后 redirect 到登录页
          <Form method="post" action="/logout">
            <button type="submit" className="btn-ghost">
              退出登录
            </button>
          </Form>
        )}
      </nav>
      <p className="muted">
        登录守卫两种写法：「设置」用 loader 里 redirect【最常用】，「报表」用 middleware【较新·7.9 起】【常用】。
      </p>

      <p className="muted">
        地址：<code>{location.pathname + location.search}</code>（内存路由没有地址栏，这里显示给你看）
        ｜ 面包屑：{crumbs.join(' / ') || '—'}
        {navigation.state !== 'idle' && (
          <strong>（{navigation.state === 'submitting' ? '提交中' : '加载中'}……）</strong>
        )}
      </p>

      {/* 子路由渲染出口。context 传给子页面：详情页用它判断按钮权限。
          useOutletContext【常用】：官方原文「this is such a common situation that it's built-into <Outlet>」；
          值要在很多层以外用到时，放 Context 或全局 store（15、16 题）。 */}
      <Outlet context={{ user } satisfies RootOutletContext} />

      <div className="stack">
        <div className="row">
          <strong>导航日志</strong>
          <span className="muted">（middleware / loader / action 执行了什么）</span>
          <button type="button" className="btn-ghost" onClick={() => log.clear()}>
            清空
          </button>
        </div>
        <ul className="log" aria-label="导航日志">
          {logLines.length === 0 ? <li>（空）</li> : logLines.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      </div>
    </div>
  )
}

/** 订单列表（/orders）：数据来自 loader，筛选和页码存在 URL 的 query 里 */
export function OrderListPage() {
  // useLoaderData 读的是本路由 loader 的返回值。泛型可以写 typeof loader 让它推断，
  // 也可以直接写数据类型；本例的 loader 由工厂函数生成，直接写数据接口更清楚。
  const { status, page, pageCount, total, orders } = useLoaderData<OrdersLoaderData>()
  const [, setSearchParams] = useSearchParams()

  /**
   * setSearchParams 会用你给的值「整体替换」查询串（内部相当于 navigate('?' + 新参数)），
   * 写成 setSearchParams({ status }) 会把 page 等其它参数一起丢掉。
   * 要在旧参数上改，用函数形式：回调收到的是当前参数的副本，改完返回即可。
   * 注意它和 useState 不同：官方文档说明函数形式「does not support the queueing logic that
   * React's setState implements」，同一次事件里连续调用两次不会叠加，要改就在一个回调里一起改。
   *
   * 默认 push【最常用】（后退能回到上一个筛选条件）；像搜索框逐字输入这种高频变化，
   * 传第二个参数 { replace: true }【常用】替换当前记录，免得用户要按很多次后退（频率：工程经验）。
   * Vue 对照：router.push({ query: { ...route.query, status } }) —— 同样要自己合并旧 query。
   */
  const changeStatus = (next: OrderStatus | 'all') => {
    setSearchParams((params) => {
      if (next === 'all') params.delete('status')
      else params.set('status', next)
      params.delete('page') // 换筛选条件就回到第 1 页
      return params
    })
  }

  const goToPage = (nextPage: number) => {
    setSearchParams((params) => {
      if (nextPage === 1) params.delete('page')
      else params.set('page', String(nextPage))
      return params
    })
  }

  return (
    <div className="stack">
      <div className="row">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
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
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
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
      <div className="row">
        <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
          上一页
        </button>
        <span className="muted">
          第 {page} / {pageCount} 页，共 {total} 条
        </span>
        <button type="button" disabled={page >= pageCount} onClick={() => goToPage(page + 1)}>
          下一页
        </button>
      </div>
      <p className="muted">
        试一试：先翻到第 2 页再点「已支付」，page 参数被清掉、status 保留；
        <Link to="/orders/o999">打开一个不存在的订单</Link>（看 404 错误边界）；
        <Link to="/login?redirectTo=https://evil.example">带外部回跳地址的登录链接</Link>
        （登录后会被 safeRedirect 送回订单列表，而不是外部网站）。
      </p>
    </div>
  )
}

/** 备注草稿：用来观察「路由参数变了，组件实例还是同一个」 */
function NoteDraft({ orderNo }: { orderNo: string }) {
  const [draft, setDraft] = useState('')
  return (
    <label className="stack">
      <span>给 {orderNo} 写备注（这是组件自己的 useState）：</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="先输入几个字，再点「下一个订单」"
      />
    </label>
  )
}

/** 订单详情（/orders/:id） */
export function OrderDetailPage() {
  const { order, starred: savedStarred } = useLoaderData<OrderLoaderData>()
  const { user } = useOutletContext<RootOutletContext>()
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * 路由参数变化时组件会不会重新挂载？不会。
   * /orders/o1 → /orders/o2 命中的是同一条路由，OrderDetailPage 在树里的位置和类型都没变，
   * React 复用这个实例：useState 保留、依赖里没有 id 的 effect 也不会重跑
   * （react.dev：「Same component at the same position preserves state」）。
   * loader 会随参数重新执行、拿到新订单，但组件自己的 state 仍是上一个订单留下的。
   * 两种解法：
   * 1) 给需要重置的部分加 key={order.id}（「You can force a subtree to reset its state by giving it a
   *    different key」）—— 下面的勾选框就是在切换这一点；
   * 2) 依赖 id 的 effect 把 id 写进依赖数组，让它随参数重跑。
   * Vue 对照：同一个 <RouterView> 也会复用组件实例，要 watch(() => route.params.id) 或给 RouterView 加 :key。
   * 两边是同一类问题，不是「只有 Vue 才有的坑」。
   */
  const [resetDraftById, setResetDraftById] = useState(false)

  /**
   * 返回上一页的兜底：location.key === 'default' 表示当前是历史栈里的第一条
   * （例如用户直接打开了详情页链接），这时应用内没有「上一页」：
   * 浏览器路由里 navigate(-1) 会离开本站，内存路由则停在原地。所以改为跳转到列表页。
   * 官方 useNavigate 文档也提醒：「there may not be a History entry to go back or forward to」。
   */
  const goBack = () => {
    if (location.key === 'default') navigate('/orders')
    else navigate(-1)
  }

  /**
   * 不跳转页面的提交：useFetcher【最常用】。
   * 官方原文：「However, it is more common to useFetcher() to POST form data.」
   * 「The most common case for a fetcher is to submit data to an action, triggering a revalidation of route data.」
   * - fetcher.Form 不写 action，提交给当前路由（:id）的 action；地址和历史栈不变；action 成功后 loader 重新执行；
   * - fetcher.state（idle / submitting / loading）是这个 fetcher 自己的，不影响根布局的 useNavigation；
   * - 乐观显示：提交进行中 fetcher.formData 里就是要提交的值，先按它显示，action 结束、loader 重新执行后换成服务器的结果。
   * 声明式模式没有 fetcher：在事件处理函数里调接口、自己管 submitting（19 题），或用 TanStack Query 的 useMutation（30 题）。
   */
  const starFetcher = useFetcher()
  const starred = starFetcher.formData ? starFetcher.formData.get('starred') === 'true' : savedStarred

  const nextId = `o${Number(order.id.slice(1)) + 1}`

  return (
    <div className="stack">
      <div className="row">
        <button type="button" onClick={goBack}>
          ← 返回
        </button>
        <Link to={`/orders/${nextId}`}>下一个订单 →</Link>
        {/* 按钮级权限：就是条件渲染（05 题）。它只决定界面上显示什么 ——
            隐藏按钮、disabled、从 DOM 里删掉，都拦不住用户直接调用删除接口，
            真正的权限校验必须由后端对每个请求完成（35 题，待新增）。
            Vue 对照：v-if，或者封装成自定义指令 v-permission；React 想复用就抽成组件 <Can code="…">。 */}
        {can(user, 'order:delete') ? (
          <button type="button" className="btn-danger" title="演示用，不会真的删除">
            删除
          </button>
        ) : (
          <span className="muted">（未登录，界面上不显示删除按钮 —— 这只是体验层面的处理）</span>
        )}
      </div>

      <div className="card stack">
        <h3>
          {order.orderNo} <span className={`badge badge-${order.status}`}>{ORDER_STATUS_TEXT[order.status]}</span>
        </h3>
        <p>
          客户：{order.customer} ｜ 金额：¥{order.amount} ｜ 下单日期：{order.createdAt}
        </p>
        <starFetcher.Form method="post" className="row">
          <input type="hidden" name="starred" value={String(!starred)} />
          <button type="submit">{starred ? '★ 已星标（点击取消）' : '☆ 星标'}</button>
          <span className="muted">
            useFetcher【最常用】：不跳转页面地提交{starFetcher.state !== 'idle' && '（保存中……）'}
          </span>
        </starFetcher.Form>
      </div>

      <label>
        <input
          type="checkbox"
          checked={resetDraftById}
          onChange={(e) => setResetDraftById(e.target.checked)}
        />{' '}
        给备注组件加 key={'{order.id}'}（勾上后，切换订单时草稿会清空）
      </label>
      <NoteDraft key={resetDraftById ? order.id : 'same-instance'} orderNo={order.orderNo} />
    </div>
  )
}

/** 详情页的 errorElement：loader 抛出的 404 在这里显示，页面其余部分不受影响 */
export function OrderErrorPage() {
  const error = useRouteError()
  const { id } = useParams()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <div className="card stack">
      <h3>{notFound ? '404：订单不存在' : '加载订单时出错'}</h3>
      <p className="error-text">
        {notFound ? `找不到订单 ${id}（loader 里 throw data(…, { status: 404 })）` : String(error)}
      </p>
      <Link to="/orders">回到订单列表</Link>
    </div>
  )
}

/** 登录页（/login）：<Form method="post"> 提交给本路由的 action */
export function LoginPage() {
  const [searchParams] = useSearchParams()
  const actionData = useActionData<LoginActionData>()
  const navigation = useNavigation()
  const submitting = navigation.state === 'submitting' && navigation.formAction === '/login'

  // URL 里请求的回跳地址原样放进表单，由 action 再用 safeRedirect 校验一次：
  // 表单字段同样是用户可控的输入，处理提交的一方不能依赖页面上做过的检查。
  // 页面上只显示校验后的实际去向，免得把外部地址展示成「登录后要去的地方」。
  const requested = searchParams.get('redirectTo')
  const target = safeRedirect(requested, '/orders')

  return (
    // <Form method="post"> + action【常用】：会跳转页面的提交（登录后 redirect 回原页面）。
    // 不跳转的提交官方说用 fetcher 更常见（「it is more common to useFetcher() to POST form data」，见详情页的星标）。
    // <Form> 会拦截原生提交，改为调用路由的 action，并自动管理 pending 状态（不用手写 submitting，19 题）。
    // replace：登录页这条历史记录被登录后的目标页替换，登录成功后按后退不会再回到登录页。
    <Form method="post" replace className="card stack">
      <h3>登录</h3>
      <p className="muted">
        登录后跳转到：<code>{target}</code>
        {requested !== null && requested !== target && (
          <>
            （URL 里请求的是 <code>{requested}</code>，没有通过 safeRedirect 校验）
          </>
        )}
      </p>
      <input type="hidden" name="redirectTo" value={requested ?? ''} />
      <label>
        <input type="checkbox" name="simulateError" /> 模拟账号或密码错误
      </label>
      <div className="row">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '登录中……' : '模拟登录'}
        </button>
      </div>
      {actionData && <p className="error-text">{actionData.error}</p>}
    </Form>
  )
}

/**
 * 设置布局（/settings）：嵌套路由的父组件，子路由渲染在 <Outlet /> 的位置。
 * Vue 对照：父组件模板里的 <RouterView />。
 */
export function SettingsLayout() {
  return (
    <div className="stack">
      {/* 相对路径 to="profile"：按「路由层级」相对当前路由（/settings）解析成 /settings/profile。
          Vue 的 RouterLink 也支持相对路径，但按「URL 路径」解析：在 /settings/profile 页面写 to="notifications"
          得到 /settings/notifications，在 /settings 页面写却得到 /notifications。
          差别是「相对路由」和「相对路径」，不是有没有。 */}
      <nav className="row nav-links">
        <NavLink to="profile">个人资料</NavLink>
        <NavLink to="notifications">通知设置</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}

export function SettingsProfilePage() {
  const { email } = useLoaderData<ProfileLoaderData>()
  return (
    <div className="card stack">
      <h3>个人资料</h3>
      <p>邮箱：{email}</p>
      <p className="muted">
        未登录时直接点「设置」，看日志：分组路由的 loader 已经 redirect 了，
        这个页面的 loader 还是发出了请求 —— 同一次导航里父子 loader 并行执行。
      </p>
    </div>
  )
}

/**
 * 通知设置：有未保存修改时拦住离开。
 * 离开确认【常用】（频率：工程经验；官方说它「Mostly used to avoid using half-filled form data」，讲的是用途）：
 * - useBlocker【主流·Data 模式专有】拦应用内导航（点链接、后退），blocker.state === 'blocked' 时让用户选择；
 * - useBeforeUnload 拦刷新 / 关闭标签页（浏览器自己的确认框，内容不能自定义）。
 * Vue 对照：onBeforeRouteLeave(() => window.confirm('…'))，返回 false 取消导航。
 */
export function SettingsNotificationsPage() {
  const [savedValue, setSavedValue] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const dirty = emailEnabled !== savedValue

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useBeforeUnload((event) => {
    if (dirty) event.preventDefault()
  })

  return (
    <div className="card stack">
      <h3>通知设置</h3>
      <label>
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(e) => setEmailEnabled(e.target.checked)}
        />{' '}
        接收邮件通知{dirty && '（未保存）'}
      </label>
      <div className="row">
        <button type="button" className="btn-primary" disabled={!dirty} onClick={() => setSavedValue(emailEnabled)}>
          保存
        </button>
      </div>
      {blocker.state === 'blocked' && (
        <div className="row" role="alertdialog" aria-label="离开确认">
          <span className="error-text">有未保存的修改，确定离开吗？</span>
          <button type="button" onClick={() => blocker.proceed()}>
            离开
          </button>
          <button type="button" className="btn-primary" onClick={() => blocker.reset()}>
            留下
          </button>
        </div>
      )}
      <p className="muted">
        改一下勾选再点别的链接试试。切到「个人资料」再切回来，未保存的勾选会丢失：子路由切换就是卸载再挂载，两个框架一致。
        Vue 可以在 RouterView 的插槽里用 KeepAlive 包住路由组件、缓存页面；React 19.2 的 &lt;Activity&gt;【较新】能隐藏子树并保留 state，
        但路由层没有现成封装（32 题，待新增）。
      </p>
    </div>
  )
}
