/**
 * 主题：18. 路由（React Router）
 * 适用版本：React 19.2 · react-router 7.x（写法兼容 8.x）· Vue 3.5 · vue-router 5.x（本课用到的 API 与 4.x 相同）
 * 最后核对：2026-09-19
 * 前置主题：05 条件渲染、09 派生状态、13 children 组合、16 全局状态、27 异步竞态与取消
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时，按项目里的使用频率标【最常用】【常用】【少用】，并写出依据（官方原文、官方示例的写法；没有出处的写「工程经验」）。
 *          正文和运行中的演示只有【最常用】【常用】的写法；【少用】的写法和只为说全的细节集中在文末「附」。本题没有需要注释的演示：
 *          声明式并排是行业里最常用的模式，照常运行；NoteDraft 的 key 开关、根路由的日志 middleware 是观察机制用的，不是一种写法。
 *          路由模式这件事，行业存量最常用、官方给新项目的推荐、本课主线是三个不同的答案，分开写（二-1）。
 *          30 秒速答只用【最常用】。带频率标签的写法，成熟度是【主流】时不再重复标。
 * 本课文件：Example.tsx（讲解 + 模式切换）· dataRouter.tsx【主线：路由表 / loader / action / 守卫】·
 *          dataPages.tsx【主线：页面】· ReportsPage.tsx（路由级 lazy）· DeclarativeDemo.tsx【并排：声明式】·
 *          demoAuth.ts · demoLog.ts · Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - React Router 7 有三种模式：声明式（<BrowserRouter> + <Routes>）、Data（createBrowserRouter 配置数组 +
 *   loader / action / pending 状态）、Framework（Data 模式 + Vite 插件）。存量项目里最常见的是声明式，
 *   官方给新项目推荐 Framework，本课主线是 Data（不上框架也能用 loader / action，见二-1）。
 *   从 react-router 导入，RouterProvider 从 react-router/dom 导入，写法兼容 v8。
 * - 登录守卫：Data 模式在无 path 的分组路由上用 loader 里 throw redirect；声明式模式用 RequireAuth 包 element，
 *   刷新时要有 checking 态。区别在拦截时机：loader 在渲染之前（和 Vue 的 beforeEach 一样），RequireAuth 在渲染之中。
 * - 「React 的路由表是组件树、Vue 的是配置」不是框架差异：<Routes> 内部把 <Route> 转成配置对象，Data 模式本身就是数组。
 * - /orders/o1 → /orders/o2 命中同一条路由，组件实例被复用，state 保留；要重置就加 key={id}，或把 id 写进 effect 依赖。
 * - 跳转用 <Link> / <NavLink>，提交后的跳转在 action 里 redirect；setSearchParams 会整体替换查询串，要用函数形式在旧参数上改；
 *   navigate(-1) 用 location.key === 'default' 兜底；回跳地址要做站内校验；前端守卫和隐藏按钮只影响体验，鉴权必须由后端完成。
 *
 * 二、核心概念（React）
 * 1. 三种模式【主流】（reactrouter.com/start/modes）：
 *    - 声明式：「enables basic routing features like matching URLs to components, navigating around the app,
 *      and providing active states」；
 *    - Data：「By moving route configuration outside of React rendering, Data Mode adds data loading, actions,
 *      pending states and more」，v6.4 起就有（当时叫 data router）；
 *    - Framework：「wraps Data Mode with a Vite plugin」，再加上类型安全的路由模块、代码拆分、SSR 等，本课不展开。
 *    用哪个 —— 三个答案要分开说：
 *    - 行业存量最常用：声明式（工程经验：v6.4 之前只有这一种 —— v5 是 <BrowserRouter> + <Switch>，v6 是 <BrowserRouter> + <Routes>）。
 *      官方也把它列给「are coming from v6 and are happy with the <BrowserRouter>」和「have a data layer that either skips pending states
 *      (like local first, background data replication/sync) or has its own abstractions for them」的项目 —— 后者就是已有自己的数据层
 *      （如 TanStack Query，30 题），pending 状态交给数据层管的组合。
 *    - 官方给新项目的推荐：Framework（「Use Framework Mode if you:」下面列的有「are too new to have an opinion」「just want to build something with React」）。
 *    - 本课主线：Data（AUDIT-ROUND2 §3.1 定的）：它是 Framework 的底座，loader / action / useFetcher / useBlocker 这些能力在 Vite SPA 里
 *      不上框架也能用；声明式作为并排照常运行（DeclarativeDemo.tsx），两边的守卫可以直接对比。
 * 2. Data 模式启动【主流】：createBrowserRouter(routes)（生产）或 createMemoryRouter(routes, { initialEntries })
 *    （嵌入演示、测试），再渲染 <RouterProvider router={router} />。router 在组件树之外只创建一次
 *    （官方：「Data Routers should not be held in React state」），见本文件底部。
 * 3. 路由对象字段【主流】：path / index / children；loader / action；errorElement；handle；lazy（6.9 起）；HydrateFallback；middleware【较新·7.9 起】。
 *    组件写 Component（6.9 起）或 element，两种都常见：v7 官方文档的示例大多写 Component（Data 模式安装页的第一个示例是 element），
 *    存量的 6.4+ 代码多是 element（工程经验）；要给组件传 props 时只能写 element（本课根路由把 auth / log 交给布局组件）。
 *    错误页同理：errorElement 与 ErrorBoundary 字段两种都常见（v7 官方 how-to/error-boundary 页的示例写 ErrorBoundary，存量代码多是 errorElement，
 *    工程经验）；本课用 errorElement。
 *    两种模式共有：嵌套 children + <Outlet />、index 路由、动态段 :id + useParams、通配 *。
 * 4. 取数【主流】：Data 模式用 loader + useLoaderData【最常用】（官方 data-loading 页的写法）：
 *    「the loaders are called before the route component is rendered」，父路由的数据用 useRouteLoaderData(路由 id) 读。
 *    同一次导航里父子 loader 并行执行（「running loaders in parallel」）。loader 收到的 request.signal 会在导航被打断时 abort，
 *    可以直接传给请求函数（27 题）。声明式模式没有 loader，数据在组件里取：TanStack Query（30 题）或 Effect（11 题）。
 * 5. 登录守卫（代码在 dataRouter.tsx；「设置」「报表」两组路由各用一种，看日志面板对比）：
 *    - 【最常用】无 path 分组路由的 loader 里 await 检查登录态，未登录 throw redirect('/login?redirectTo=…')。
 *      官方 navigating 页讲 redirect 的第一个示例就是它（loader 里查用户，没有就 return redirect("/login")）。
 *      return 和 throw 两种都常见：官方示例写 return；把检查抽成 requireUser() 这类辅助函数、在别的 loader 里调用时只能 throw（本课写 throw）。
 *      坑有两个：父子 loader 并行，子路由请求可能已发出；子路由 loader 也 redirect 时，最深一层的 redirect 先生效（五）；
 *    - 【较新·7.9 起】【常用】分组路由上的 middleware（频率：工程经验 —— 新写的 Data / Framework 项目里常用，7.9 才稳定，存量代码里仍以 loader 守卫为主。
 *      官方 how-to/middleware 页说它「enables common patterns like authentication, logging, error handling, and data preprocessing」，
 *      route-object 页说它是「a singular place to do things like logging and authentication」，讲的都是用途）。父路由的 middleware 先执行；在调用 next() 之前
 *      throw redirect，下游的 loader 就不会执行；客户端 middleware 每次导航都执行（「regardless of whether there are loaders to run」）。
 *      Data 模式运行时不需要 future flag，只需一段 declare module 打开 context 的类型。
 *    - 两种写法都在导航提交前完成：检查完之前目标页面不会渲染，被拦下的地址也不会进历史栈（两种写法各有一条「后退回到拦截前的页面」的断言）。
 *    - 声明式模式只能在渲染时拦（见 10）：RequireAuth 包住 element（本课的写法），或者写成布局路由 <Route element={<RequireAuth />}> 里渲染 <Outlet />
 *      一次包住一组子路由，两种都常见（工程经验）。
 * 6. 跳转与提交【主流】：
 *    - 链接：<Link> / <NavLink>【最常用】。NavLink 激活时默认 class="active" + aria-current="page"（按 URL 前缀判断，end 要求精确匹配）。
 *    - 提交后跳转：action 里 redirect【最常用】（「It is common to redirect to a new record after it has been created」）。
 *    - 不跳转页面的提交（切开关、星标、行内保存）：useFetcher【最常用】（详情页的「星标」，测试覆盖）——
 *      「However, it is more common to useFetcher() to POST form data.」
 *      「The most common case for a fetcher is to submit data to an action, triggering a revalidation of route data.」
 *      fetcher.Form 不写 action 时提交给所在路由的 action，地址不变；action 成功后页面上的 loader 自动重新执行
 *      （action 抛错、或返回 4xx / 5xx 时默认不重新执行，见七）；
 *      提交进行中 fetcher.formData 里是要提交的值，可以先按它显示（乐观更新）。
 *    - 会跳转的表单提交（登录）：<Form method="post"> + action【常用】（官方说 POST 更常用 fetcher，见上一条）；
 *      「When the action completes, all loader data on the page is revalidated」；useActionData 读 action 返回的错误。
 *    - 命令式跳转 useNavigate【常用】（频率：工程经验，跨模式的判断 —— 声明式项目里返回按钮、异步提交后跳转都靠它，用得多）。
 *      Data / Framework 模式里官方要它少用：「Usage of this hook should be uncommon.」（原文举的是超时登出、限时答题这类「用户没有操作」的跳转），
 *      能用 Link / redirect 的就不用它；本课的 Data 模式只在返回兜底 navigate(-1) 里用。
 *    - 显示导航中：useNavigation().state（idle / loading / submitting）【最常用】（官方 Pending UI 页「Global Pending Navigation」的写法）。
 * 7. 错误处理【主流】：errorElement + useRouteError；loader 里 throw data('…', { status: 404 })，
 *    用 isRouteErrorResponse 判断；至少给根路由配一个 errorElement。
 * 8. 其它 Data 模式工具：
 *    - 父路由把值交给子路由：<Outlet context> + useOutletContext【常用】（官方「this is such a common situation that it's built-into <Outlet>」；
 *      详情页用它拿登录用户判断按钮权限）；
 *    - 离开确认：useBlocker + useBeforeUnload【常用】（官方说 useBlocker「Mostly used to avoid using half-filled form data」，讲的是用途）；
 *    - 面包屑：handle + useMatches【常用】（频率：工程经验；读 loaderData，UIMatch.data 已弃用）；
 *    - 按页拆包：路由级 lazy（函数式，6.9 起）【常用】（频率：工程经验；官方 route-object 页的示例是函数式，
 *      「Most properties can be lazily imported to reduce the initial bundle size.」讲的是哪些字段能懒加载）；按字段拆开的对象式 lazy 见附 3。
 *      声明式模式的按页拆包是 element 里放 React.lazy 组件、外面包 <Suspense>（React.lazy 见 32 题，待新增）；
 *      Data 模式用 route.lazy，代码和 loader 一起并行下载，避免「先下完组件代码才开始跑 loader」的瀑布；
 *    - loader 返回未 await 的 Promise 配合 <Await> 流式渲染【主流】（32 题，待新增）。
 *    这些 hook 只能在 Data 路由下使用，在 <MemoryRouter> / <BrowserRouter> 里调用会报「must be used within a data router」。
 * 9. 两种模式通用【主流】：NavLink 的激活样式用默认的 .active 类写 CSS，或者给 className / style 传函数 ({ isActive }) => …，
 *    两种都常见，按团队约定（工程经验；Tailwind 项目多用函数形式）。useSearchParams 的 setter 整体替换查询串（✅ 函数形式在旧参数上改；有别的参数时传对象 ❌）；
 *    默认 push【最常用】，逐字输入这类高频变化 replace【常用】（工程经验）；<Navigate replace />；相对路径 to="profile" 按路由层级解析。
 * 10. 并排：声明式模式 + RequireAuth 三态【主流】（DeclarativeDemo.tsx）：行业存量最常用的模式（见 1）。<Routes> 的子元素只能是 <Route> 或 Fragment，
 *    所以守卫包在 element 上；它在渲染时拦截，刷新后登录态要异步确认，必须有 checking 态。
 *
 * 三、Vue 对照（按 Vue 项目里的频率标）
 * - createRouter({ history, routes }) 的配置数组 ↔ createBrowserRouter(routes)；createMemoryHistory() ↔ createMemoryRouter；
 *   app.use(router) ↔ <RouterProvider router>。两边都是「先配置，再挂到应用上」。
 * - 登录守卫：router.beforeEach((to, from) => 返回值) + meta.requiresAuth【最常用】（官方 meta 页的示例就是这样查登录）↔ loader 里 throw redirect / middleware：
 *   都在导航提交之前执行、都能 await。返回 false 取消，返回路由地址重定向，返回 undefined / true 放行；第三个参数 next() 是【旧写法】，
 *   vue-router 5 在开发环境会警告（VUE_ROUTER_R0025）。meta.requiresAuth 会被子路由继承 ↔ 无 path 分组路由包住一批子路由。
 *   路由配置上的 beforeEnter【常用】（频率：工程经验；只在进入这条路由时触发，参数变化不触发；本课没有演示）。
 * - 取数：导航完成后在组件里 watch(() => route.params.id, 取数, { immediate: true })【最常用】（官方 data-fetching 页两种都给、
 *   「Technically, both are valid choices」，频率是工程经验）↔ loader + useLoaderData；导航前取数的写法见附 5。
 * - <RouterLink> 默认加 router-link-active / router-link-exact-active（按路由记录判断）↔ NavLink 默认 active + aria-current（按 URL 前缀）。
 * - useRouter().push / replace / back ↔ useNavigate；两边都没有「应用内没有上一页」的内置兜底。
 * - 离开确认 onBeforeRouteLeave【常用】（频率：工程经验；官方「The leave guard is usually used to prevent the user from accidentally leaving the route
 *   with unsaved edits.」讲的是用途）↔ useBlocker；component: () => import('./X.vue')【常用】（频率：工程经验）↔ 路由级 lazy；不跳转页面的提交：在事件处理函数里调接口（19 题）↔ useFetcher（Vue Router 没有对应物）。
 * - 同一个 <RouterView> 复用组件实例 ↔ 同位置复用，要加 key={id}。重新取数：watch 参数【最常用】；清空组件自己的状态：加 :key 或在 watch 里
 *   手动重置，两种都常见（06 题统一措辞）。缓存页面：<KeepAlive> 放进 RouterView 的插槽（<RouterView v-slot="{ Component }"><KeepAlive><component :is="Component" />…）
 *   【常用】（频率：工程经验；直接用 KeepAlive 包住 RouterView 在 Vue Router 4 起会警告）↔ <Activity>【较新·19.2 起】（32 题，待新增）。
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
 * 8. 不跳转页面的提交：React Router 的 Data 模式有 useFetcher（自带 pending、action 成功后自动重新执行 loader）；Vue Router 没有，
 *    在组件里调接口，数据要不要刷新自己决定（或交给 TanStack Query，30 题）。
 *
 * 五、常见追问与回答要点
 * - 三种模式怎么选？存量项目大多是声明式；新项目官方推荐 Framework；要数据加载、pending 状态、离开确认又不想上框架，用 Data；
 *   已有数据层（TanStack Query）又不需要这些能力时，声明式也是官方认可的选择。
 * - loader 里 throw redirect 有什么坑？父子 loader 并行，父级拦截时子级的请求可能已经发出；
 *   子路由的 loader 也 redirect 时，React Router 用最深一层的 redirect，守卫要多跳一次才生效（都能在日志面板里看到）。
 *   middleware 在 next() 之前拦截，下游 loader 不会执行。
 * - RequireAuth 为什么要三态？刷新时登录态要异步恢复，只有两态会把已登录的用户先当成未登录，送去登录页。
 * - 路由参数变化时 state 会保留吗？会，同位置复用；要重置就加 key，或把参数写进 effect 依赖。
 * - setSearchParams 为什么把参数弄丢了？它整体替换查询串；用函数形式在旧参数上改；同一次事件里连续调用不会叠加；
 *   换筛选条件时记得重置 page。
 * - redirect 和 navigate 有什么区别？redirect 返回一个带 Location 头的 Response，在 loader / action 里用；
 *   navigate 是组件里的命令式跳转函数。Data 模式里官方建议能用 redirect 就用 redirect（「It's often better to use redirect in action/loader functions than this hook.」）。
 * - <Form> 和 useFetcher 有什么区别？<Form> 提交是一次导航：全局的 useNavigation 变成 submitting，提交到别的地址时进历史栈
 *   （提交到当前地址时默认 REPLACE，不多一条记录）；fetcher 不导航，有自己的 state，适合一个页面里好几处独立的提交。
 *   两者的 action 成功后都会重新执行页面上的 loader。
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
 * - 不跳转的提交用了 <Form>：提交变成一次导航，全局的 useNavigation 跟着变成 submitting（根布局显示「提交中」），
 *   同一页好几处提交的 pending 状态混在一起；该用 useFetcher。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：用 createMemoryRouter 嵌进学习站点，生产环境用 createBrowserRouter。RouterProvider 内部同样渲染一个 <Router>，
 *   一棵组件树里不能嵌套两个 Router，所以本示例挂在独立的 React 根上（src/bridge/ReactIsolatedMount.tsx）。
 * - 演示简化：登录态是内存里的模拟服务（demoAuth.ts），星标存在 router 实例的内存里（dataRouter.tsx）。真实项目在 loader / middleware 里 await 会话接口，
 *   前端的登录态放在全局 store（16 题）或 TanStack Query（30 题）里。
 * - 回跳地址必须校验：@/shared/safeRedirect 只放行站内路径；redirect() 遇到跨域的绝对地址会在浏览器里整页跳过去。
 * - 前端权限只影响体验，后端要对每个请求鉴权（35 题，待新增）。
 * - 至少配一个根 errorElement；找不到资源时 throw data(…, { status: 404 })。
 * - 表单页用 useBlocker + useBeforeUnload；提交用 <Form> / useFetcher 拿 pending 状态，不再手写 submitting（19 题）。
 *   乐观显示只是先按提交的值画出来：action 抛错时交给 errorElement；返回 4xx / 5xx 时默认不重新执行 loader，fetcher 回到 idle 后
 *   界面用回原来的 loader 数据（看起来「改回去了」）；失败提示要自己做（读 fetcher.data，或 useRouteError）。
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
 * 3. 把详情页的星标从 starFetcher.Form 换成 <Form method="post">（从 react-router 导入）。可断言：星标测试里
 *    提交完 router.state.historyAction 变成 'REPLACE'（提交到当前地址的导航默认替换当前记录），提交进行中 router.state.navigation.state 是 'submitting'。
 *    注意：原来按 fetcher.formData / fetcher.state 写的乐观显示和「保存中」要改成读 useNavigation()，星标测试里对应的断言（保存中、提交中不显示、
 *    historyAction 'POP'）一并改掉；根布局会显示「提交中」（六的易错点）。
 *
 * 附：少用的写法与细节（读别人的代码时认得出来就行；本题没有注释掉的演示）
 * 1. 细节：拦截的实现
 *    - 最深一层 redirect 优先：React Router 的 findRedirect 从最后一个匹配往前找（dataRouter.tsx 的注释）。
 *    - 7.8.2 起 createBrowserRouter 去掉了 middleware 的运行时开关，7.9 起 middleware 稳定（dataRouter.tsx 的 declare module 说明）。
 *    - 7.15 起 loader 参数里另有 url 字段【较新】；本课用 new URL(request.url)，v6.4 起就能这么写。
 * 2. 【少用】NavLink 的 isPending：className / style / children 可以写成函数，拿到 isPending 给这个链接单独显示加载中
 *    （官方 Pending UI 页「Local Pending Navigation」）。全局提示用 useNavigation 更常见（工程经验），本课没有演示。
 * 3. 【较新·7.5 起】【少用】对象式 lazy：lazy: { Component: async () => …, loader: async () => … } 按字段分别加载（CHANGELOG 7.5.0）。
 *    官方 route-object 页的示例是函数式；本课的「报表」用函数式。
 * 4. 细节：声明式的 RequireAuth 直接 return children —— @types/react 18.2.8 起配合 TypeScript 5.1 允许函数组件返回 ReactNode，
 *    更早的类型版本要写成 <>{children}</>（与 React 19 本身无关，DeclarativeDemo.tsx 的注释）。
 * 5. 【少用】Vue 在导航前取数：beforeRouteEnter / 路由配置里的 beforeEnter 里请求，数据回来才进入页面（官方 data-fetching 页「Fetching Before Navigation」）；
 *    参数变化时用 onBeforeRouteUpdate 取数（dynamic-matching 页在 watch 之后给的另一种写法：「Or, use the beforeRouteUpdate navigation guard」）；
 *    vue-router 5 的 vue-router/experimental 数据加载器【尝鲜】才和 loader 一样有一套约定。Vue 项目里一般是导航后 watch 取数（工程经验）。
 * 6. 【少用】Data 模式也能用 JSX 写路由表：createBrowserRouter(createRoutesFromElements(<Route …>…</Route>))。项目里 Data 模式基本写配置数组（工程经验）；
 *    它也说明「路由表是组件树还是配置」只是写法（四-7）。
 * 7. 细节：vue-router 的 memory history 不记录 back，「应用内有无上一页」只能自己跟踪（vue/navigationHistory.ts）；createWebHistory 在 history.state 里记 back，
 *    但那是源码行为，不是公开 API。
 *
 * 参考（2026-09-19 核对，reactrouter.com 文档取自 remix-run/react-router 仓库 react-router@7.18.3 标签的 docs 原文）：
 * - reactrouter.com：start/modes、start/data/installation、start/data/route-object、start/data/data-loading、
 *   start/data/actions、start/framework/navigating（Data 模式的 navigating 页指向它）、start/framework/pending-ui、how-to/fetchers、
 *   how-to/middleware、how-to/error-boundary、how-to/navigation-blocking、api/data-routers/createBrowserRouter、api/data-routers/RouterProvider、
 *   api/hooks/useSearchParams、api/hooks/useNavigate、api/hooks/useOutletContext、api/hooks/useBlocker、api/components/NavLink、api/utils/redirect
 * - remix.run/blog/react-router-v8；react-router CHANGELOG（6.9.0 lazy、7.5.0 对象式 lazy、7.8.2 / 7.9.0 middleware）
 * - react.dev/learn/preserving-and-resetting-state
 * - router.vuejs.org：guide/advanced/navigation-guards、guide/advanced/meta、guide/advanced/data-fetching、guide/essentials/dynamic-matching、
 *   guide/advanced/lazy-loading、guide/advanced/router-view-slot
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
      <p className="muted">
        选哪种模式：存量项目里最常见的是声明式（工程经验），官方给新项目推荐 Framework（本课不演示），
        本课主线是 Data —— 不上框架也能用 loader / action / useFetcher。
      </p>

      {mode === 'data' ? <RouterProvider router={dataRouter} /> : <DeclarativeDemo />}
    </div>
  )
}
