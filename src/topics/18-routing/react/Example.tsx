/**
 * 主题：18. 路由（React Router）
 * 适用版本：React 19.2 · react-router 7.x（写法兼容 8.x）· Vue 3.5 · vue-router 5.x（本课用到的 API 与 4.x 相同）
 * 最后核对：2026-09-17
 * 前置主题：05 条件渲染、09 派生状态、13 children 组合、16 全局状态、27 异步竞态与取消
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 模式切换）· dataRouter.tsx【主线：路由表 / loader / action / 守卫】·
 *          dataPages.tsx【主线：页面】· ReportsPage.tsx（路由级 lazy）· DeclarativeDemo.tsx【并排：声明式】·
 *          demoAuth.ts · demoLog.ts · Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - React Router 7 有三种模式：声明式（<BrowserRouter> + <Routes>）、Data（createBrowserRouter 配置数组 +
 *   loader / action / pending 状态）、Framework（Data 模式 + Vite 插件）。本课主线是 Data 模式：
 *   从 react-router 导入，RouterProvider 从 react-router/dom 导入，写法兼容 v8。
 * - 登录守卫：Data 模式在无 path 的分组路由上用 loader 里 throw redirect【主流】，或用 middleware【较新·7.9 起】。
 *   两者都在导航提交之前执行、可以 await 异步检查。loader 写法的坑是父子 loader 并行，被拦时子路由的请求可能已经发出；
 *   middleware 在 loader 之前执行，没有这个问题。声明式模式只能在渲染时用 RequireAuth 包 element，刷新时要有 checking 态。
 * - 「React 的路由表是组件树、Vue 的是配置」不是框架差异：<Routes> 内部把 <Route> 转成配置对象，Data 模式本身就是数组。
 *   真正的区别是拦截时机：渲染之前（Data 模式、Vue 的 beforeEach），还是渲染之中（声明式的 RequireAuth）。
 * - /orders/o1 → /orders/o2 命中同一条路由，组件实例被复用，state 保留；要重置就加 key={id}，或把 id 写进 effect 依赖。
 * - setSearchParams 会整体替换查询串，要用函数形式在旧参数上改；navigate(-1) 用 location.key === 'default' 兜底；
 *   回跳地址要做站内校验；前端守卫和隐藏按钮只影响体验，鉴权必须由后端完成。
 *
 * 二、核心概念（React）
 * 1. 三种模式【主流】（reactrouter.com/start/modes）：
 *    - 声明式：「enables basic routing features like matching URLs to components, navigating around the app,
 *      and providing active states」；
 *    - Data：「By moving route configuration outside of React rendering, Data Mode adds data loading, actions,
 *      pending states and more」，v6.4 起就有（当时叫 data router）；
 *    - Framework：「wraps Data Mode with a Vite plugin」，再加上类型安全的路由模块、代码拆分、SSR 等，本课不展开。
 * 2. Data 模式启动【主流】：createBrowserRouter(routes)（生产）或 createMemoryRouter(routes, { initialEntries })
 *    （嵌入演示、测试），再渲染 <RouterProvider router={router} />。router 在组件树之外只创建一次
 *    （官方：「Data Routers should not be held in React state」），见本文件底部。
 * 3. 路由对象字段【主流】：path / index / children；Component（6.9 起）或 element；loader / action；
 *    errorElement；handle；lazy（6.9 起）；HydrateFallback；middleware【较新·7.9 起】。
 *    两种模式共有：嵌套 children + <Outlet />、index 路由、动态段 :id + useParams、通配 *。
 * 4. loader【主流】：「the loaders are called before the route component is rendered」，组件里用 useLoaderData 读，
 *    父路由的数据用 useRouteLoaderData(路由 id) 读。同一次导航里父子 loader 并行执行（「running loaders in parallel」）。
 *    loader 收到的 request.signal 会在导航被打断时 abort，可以直接传给请求函数（27 题）。
 * 5. 守卫（本课主线，代码在 dataRouter.tsx）：
 *    - 写法一【主流】：无 path 分组路由的 loader 里 await 检查登录态，未登录 throw redirect('/login?redirectTo=…')。
 *      坑有两个：父子 loader 并行，子路由请求可能已发出；子路由 loader 也 redirect 时，最深一层的 redirect 先生效；
 *    - 写法二【较新·7.9 起】：分组路由上的 middleware。父路由的 middleware 先执行；在调用 next() 之前 throw redirect，
 *      下游的 loader 就不会执行；客户端 middleware 每次导航都执行（「regardless of whether there are loaders to run」）。
 *      Data 模式运行时不需要 future flag，只需一段 declare module 打开 context 的类型。
 *    - 两种写法都在导航提交前完成：检查完之前页面不会渲染，被拦下的地址也不会进历史栈（Example.test.tsx 里有断言）。
 * 6. 提交与 pending【主流】：action 处理 <Form method="post">，useActionData 读 action 的返回值；
 *    「When the action completes, all loader data on the page is revalidated」；
 *    useNavigation().state（idle / loading / submitting）做加载提示；不跳转页面的提交用 useFetcher（19 题、31 题待新增）。
 * 7. 错误处理【主流】：errorElement + useRouteError；loader 里 throw data('…', { status: 404 })，
 *    用 isRouteErrorResponse 判断；至少给根路由配一个 errorElement。
 * 8. 其它 Data 模式工具：useBlocker + useBeforeUnload 离开确认【主流】；handle + useMatches 做面包屑【主流】
 *    （读 loaderData，UIMatch.data 已弃用）；路由级 lazy【主流·6.9 起】，按字段拆开的对象式 lazy【较新·7.5 起】；
 *    loader 返回未 await 的 Promise 配合 <Await> 流式渲染【主流】（32 题，待新增）。
 *    这些 hook 只能在 Data 路由下使用，在 <MemoryRouter> / <BrowserRouter> 里调用会报「must be used within a data router」。
 * 9. 两种模式通用【主流】：NavLink 激活时默认 class="active" + aria-current="page"（按 URL 前缀判断，end 要求精确匹配）；
 *    useSearchParams 的 setter 整体替换查询串；useNavigate；<Navigate replace />；相对路径 to="profile" 按路由层级解析。
 * 10. 并排：声明式模式 + RequireAuth 三态【主流】（DeclarativeDemo.tsx）。v6 存量项目和面试最常见，
 *    官方也认可「已有自己的数据层（如 TanStack Query，30 题）」时使用。<Routes> 的子元素只能是 <Route> 或 Fragment，
 *    所以守卫包在 element 上；它在渲染时拦截，刷新后登录态要异步确认，必须有 checking 态。
 *
 * 三、Vue 对照
 * - createRouter({ history, routes }) 的配置数组 ↔ createBrowserRouter(routes)；createMemoryHistory() ↔ createMemoryRouter；
 *   app.use(router) ↔ <RouterProvider router>。两边都是「先配置，再挂到应用上」。
 * - router.beforeEach((to, from) => 返回值)【主流】↔ loader 里 throw redirect / middleware：都在导航提交之前执行、都能 await。
 *   返回 false 取消，返回路由地址重定向，返回 undefined / true 放行；第三个参数 next() 是【旧写法】，
 *   vue-router 5 在开发环境会警告（VUE_ROUTER_R0025）。meta.requiresAuth 会被子路由继承 ↔ 无 path 分组路由包住一批子路由。
 * - 组件内取数 watch(() => route.params.id, 取数, { immediate: true }) ↔ loader + useLoaderData；
 *   vue-router 5 的 vue-router/experimental 数据加载器【尝鲜】才和 loader 一样在导航之前取数。
 * - <RouterLink> 默认加 router-link-active / router-link-exact-active（按路由记录判断）↔ NavLink 默认 active + aria-current（按 URL 前缀）。
 * - useRouter().push / replace / back ↔ useNavigate；两边都没有「应用内没有上一页」的内置兜底。
 * - onBeforeRouteLeave(() => false) ↔ useBlocker；component: () => import('./X.vue') ↔ 路由级 lazy；
 *   同一个 <RouterView> 复用组件实例，要 watch 参数或加 :key ↔ 同位置复用，要加 key={id}；
 *   <KeepAlive> ↔ <Activity>【较新·19.2 起】（32 题，待新增）。
 * - 相对路径：vue-router 按「URL 路径」解析 to="notifications"，React Router 按「路由层级」解析。
 *
 * 四、关键区别（每条写明适用范围）
 * 1. 拦截时机（最重要）：Data 模式（v6.4 起）的 loader / middleware 与 Vue Router 4 / 5 的 beforeEach 都在导航提交前执行，
 *    可以 await、被拦的地址不进历史栈；声明式模式的 RequireAuth 在渲染中拦截，只能按当前状态判断，
 *    跳走时要 replace，刷新时要 checking 态。
 * 2. 「全局导航钩子」：Data 模式有 middleware（7.9 起；Data 模式无需 flag，Framework 模式在 v7 需开 future.v8_middleware，v8 默认开启）；
 *    声明式模式没有对应物。
 * 3. 守卫什么时候生效：Data 模式的 loader / middleware 与 Vue 的 beforeEach 只在导航时（Data 模式还包括 action 之后的重新验证）执行，
 *    登录态在别处变化不会自动把人送走；声明式的 RequireAuth 是渲染条件，登录态一变，下一次渲染就跳走。
 * 4. 组件实例复用两边一致：同一条路由、同一位置的组件会被复用。React 用 key={id} 或写对依赖，Vue 用 watch 或 :key。
 * 5. 激活样式两边都默认加类名：React Router 按 URL 前缀（end 精确匹配），Vue Router 按路由记录。
 * 6. 更新 query 两边都是整体替换：setSearchParams(对象) 与 router.push({ query }) 都要自己合并旧参数。
 * 7. 路由表形态：声明式模式的 JSX 路由表只是写法，v6 起内部同样转成配置对象；这不是 React 与 Vue 的差异。
 *
 * 五、常见追问与回答要点
 * - 三种模式怎么选？需要数据加载、pending 状态、离开确认这些能力，用 Data 或 Framework；
 *   已有数据层（TanStack Query）又不需要这些能力时，声明式也是官方认可的选择。
 * - loader 里 throw redirect 有什么坑？父子 loader 并行，父级拦截时子级的请求可能已经发出；
 *   子路由的 loader 也 redirect 时，React Router 用最深一层的 redirect，守卫要多跳一次才生效（都能在日志面板里看到）。
 *   middleware 在 next() 之前拦截，下游 loader 不会执行。
 * - RequireAuth 为什么要三态？刷新时登录态要异步恢复，只有两态会把已登录的用户先当成未登录，送去登录页。
 * - 路由参数变化时 state 会保留吗？会，同位置复用；要重置就加 key，或把参数写进 effect 依赖。
 * - setSearchParams 为什么把参数弄丢了？它整体替换查询串；用函数形式在旧参数上改；同一次事件里连续调用不会叠加；
 *   换筛选条件时记得重置 page。
 * - redirect 和 navigate 有什么区别？redirect 返回一个带 Location 头的 Response，在 loader / action 里用；
 *   navigate 是组件里的命令式跳转函数。
 * - v6 → v7 → v8 的导入变化？v6 从 react-router-dom 导入【旧写法】；v7 推荐从 react-router 导入（react-router-dom 7.x 只是转发）；
 *   v8 删除了 react-router-dom，RouterProvider 这类 DOM 相关导出从 react-router/dom 取；v6 已被官方宣布 EOL。
 *
 * 六、易错点
 * - 在组件函数体里直接调用 navigate()：这是渲染期副作用。用 <Navigate />，或放进事件处理函数 / effect。
 * - 渲染中跳走却忘了加 replace：用户在登录页按后退，又被推回登录页，来回弹。
 * - 回跳地址只拼 pathname，把用户原本带的 query 丢了。
 * - 把 router 放进 useState，或在组件里调用 createBrowserRouter。
 * - setSearchParams({ status }) 把 page 等其它参数一起清掉。
 * - 读 useMatches() 的 data（已弃用），应读 loaderData。
 * - 以为「React 没有组件实例复用的问题」：参数变化时组件不会重新挂载。
 * - 以为隐藏按钮、前端守卫就等于权限控制。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：用 createMemoryRouter 嵌进学习站点，生产环境用 createBrowserRouter。RouterProvider 内部同样渲染一个 <Router>，
 *   一棵组件树里不能嵌套两个 Router，所以本示例挂在独立的 React 根上（src/bridge/ReactIsolatedMount.tsx）。
 * - 演示简化：登录态是内存里的模拟服务（demoAuth.ts）。真实项目在 loader / middleware 里 await 会话接口，
 *   前端的登录态放在全局 store（16 题）或 TanStack Query（30 题）里。
 * - 回跳地址必须校验：@/shared/safeRedirect 只放行站内路径；redirect() 遇到跨域的绝对地址会在浏览器里整页跳过去。
 * - 前端权限只影响体验，后端要对每个请求鉴权（35 题，待新增）。
 * - 至少配一个根 errorElement；找不到资源时 throw data(…, { status: 404 })。
 * - 表单页用 useBlocker + useBeforeUnload；提交用 <Form> / useFetcher 拿 pending 状态，不再手写 submitting（19 题）。
 * - 页面多了以后用路由级 lazy 拆包。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - 导入：v6 写 import { … } from 'react-router-dom'；v7 起从 'react-router' 导入（react-router-dom 7.x 只是转发）；v8 删除了这个包。
 * - v5 的 <Switch>、把自定义 <PrivateRoute> 组件直接放进路由表：v6 起 <Routes> 的子元素只能是 <Route>，会直接报错。
 * - v6.4 之前只有声明式模式；v6.4–6.x 做流式渲染要用 defer() 包一层，v7 起 loader 直接返回 Promise。
 * - Framework 模式在 v7 要开 future.v8_middleware 才能用 middleware。
 * - useMatches() 的 match.data → match.loaderData（v7 弃用，v8 删除）。
 * - Vue：beforeEach(to, from, next) 三参数写法 → 返回值写法（vue-router 4 起推荐，5 在开发环境警告）。
 *
 * 九、新动向【尝鲜】
 * - React Router v8（2026-06-17）：要求 Node 22.22+、React 19.2.7+；删除 react-router-dom；middleware 默认开启，
 *   不再需要 Future 类型开关；官方同时宣布 v6 与 Remix v2 EOL。从 v7 升级前先开启 v8_* 系列 future flag。
 * - <Link viewTransition> / navigate(to, { viewTransition: true }) 使用浏览器的 View Transitions API；
 *   React 19.3 的 <ViewTransition> 也可做切换动画（19.2.8 不导出，本课代码不依赖；32 题，待新增）。
 * - vue-router 5：文件路由并入核心（vue-router/vite）【较新】；vue-router/experimental 数据加载器【尝鲜】。
 *
 * 十、动手练习
 * 1. 把「设置」的守卫从 loader 改成 middleware（参考「报表」）。可断言：未登录导航到 /settings/profile 后
 *    router.state.location.pathname === '/login'，而且日志里没有「个人资料 loader」这一行。
 * 2. 去掉 NoteDraft 上的 key 开关，改成在 OrderDetailPage 里用 useEffect 按订单 id 清空草稿，
 *    对比两种写法：effect 版多一次渲染，并且会被 react-hooks/set-state-in-effect 规则拦下。
 *
 * 参考（2026-09-17 核对）：
 * - reactrouter.com/7.18.4：start/modes、start/data/installation、start/data/route-object、start/data/data-loading、
 *   start/data/actions、how-to/middleware、how-to/error-boundary、how-to/navigation-blocking、
 *   api/data-routers/createBrowserRouter、api/data-routers/RouterProvider、api/hooks/useSearchParams、
 *   api/hooks/useNavigate、api/components/NavLink、api/utils/redirect
 * - remix.run/blog/react-router-v8；react-router CHANGELOG（6.9.0 lazy、7.5.0 对象式 lazy、7.8.2 / 7.9.0 middleware）
 * - react.dev/learn/preserving-and-resetting-state
 * - router.vuejs.org：guide/advanced/navigation-guards、guide/advanced/data-fetching、guide/advanced/lazy-loading
 */
import { useState } from 'react'
import { RouterProvider } from 'react-router/dom'
import { createDemoAuth } from './demoAuth'
import { createDemoLog } from './demoLog'
import { createDataRouter } from './dataRouter'
import { DeclarativeDemo } from './DeclarativeDemo'

/**
 * 主线的 router 在模块顶层创建：它不属于任何组件的 state，切到「并排」再切回来，
 * 当前地址和登录态都还在 —— 这正是「router 在 React 之外」的表现。
 * 声明式并排版的 <MemoryRouter> 是组件，卸载后状态就没了。
 */
const dataRouter = createDataRouter({ auth: createDemoAuth(), log: createDemoLog(), delayMs: 400 })

type Mode = 'data' | 'declarative'

export default function Example() {
  const [mode, setMode] = useState<Mode>('data')

  return (
    <div className="stack">
      <div className="row" role="tablist" aria-label="路由模式">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'data'}
          className={mode === 'data' ? 'btn-primary' : ''}
          onClick={() => setMode('data')}
        >
          主线：Data 模式
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'declarative'}
          className={mode === 'declarative' ? 'btn-primary' : ''}
          onClick={() => setMode('declarative')}
        >
          并排：声明式模式
        </button>
      </div>

      {mode === 'data' ? <RouterProvider router={dataRouter} /> : <DeclarativeDemo />}
    </div>
  )
}
