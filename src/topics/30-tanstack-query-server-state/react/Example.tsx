/**
 * 主题：30. TanStack Query 与服务端状态（缓存、status × fetchStatus、失效、乐观更新、Suspense）
 * 适用版本：React 19.2 · @tanstack/react-query 5.102.8 与 @tanstack/vue-query 5.102.8（共用 @tanstack/query-core 5.102.8）·
 *          Vue 3.5 · react-error-boundary 6 · React Router 7（只作对照）
 * 最后核对：2026-09-17
 * 前置主题：11 API 请求状态、10 useEffect 与 StrictMode、14 useSyncExternalStore、27 取消与竞态、18 路由（loader 对照）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 入口）· ordersDemo.ts（key 工厂 + queryOptions + 演示工具）·
 *          OrdersListPanel.tsx（区块一、二）· OrderDetailPanel.tsx（区块三）· SuspenseStatsPanel.tsx（区块四）·
 *          CacheInspector.tsx（区块五）· LoaderVsQueryCard.tsx（区块六）· Example.test.tsx（本课结论的自动化测试）
 *
 * 本课定位：TanStack Query v5【主流】是 React 生产项目里服务端状态的默认方案；11 题的 Effect 手写是教学写法。
 * React 官方在 useEffect 页推荐「客户端缓存」时点了它的名：「Popular open source solutions include TanStack Query, useSWR,
 * and React Router 6.4+.」它不是 React 核心 API；旧名 React Query（官方 overview：「TanStack Query (formerly known as React Query)」）。
 *
 * 一、30 秒面试速答
 * - TanStack Query 管的是服务端状态：数据在远端、要异步取、别人也能改、放着会过期。它负责缓存、去重、后台重取、失效，
 *   不管「怎么发请求」（queryFn 里用 fetch / axios 都行），也不替代客户端状态库。
 * - queryKey 是缓存主键 + 依赖声明：queryFn 用到的变量都放进 key；key 确定性哈希（对象键顺序无关、数组顺序有关）；失效按前缀匹配。
 * - 默认值：staleTime 0（一落地就算过期）、gcTime 5 分钟、失败静默重试 3 次指数退避、过期数据在挂载 / 窗口聚焦 / 网络重连时后台重取；
 *   生产通常在 QueryClient 的 defaultOptions 里统一设一个非 0 的 staleTime。
 * - 两个维度：status 回答「有没有数据」（pending / error / success），fetchStatus 回答「queryFn 在不在跑」（fetching / paused / idle）；
 *   v5 的 isLoading = isPending && isFetching，表示首次加载中。
 * - 写操作用 useMutation，结束后 invalidateQueries 让相关缓存失效并重取（或做乐观更新），不在组件里手工维护一份副本。
 *
 * 二、核心概念（React）
 * 1. 定位【主流】：官方 overview 列的服务端状态四个特征 ——「Is persisted remotely in a location you may not control or own」
 *    「Requires asynchronous APIs for fetching and updating」「Implies shared ownership and can be changed by other people without your
 *    knowledge」「Can potentially become "out of date" in your applications if you're not careful」。和客户端状态的关系
 *    （does-this-replace-client-state 页）：「TanStack Query is not a replacement for local/client state management」，两类状态分开管（15 / 16 题）。
 * 2. 接入【主流】：QueryClient（缓存本体 + defaultOptions）+ QueryClientProvider（Context，只对子树可见）；组件里 useQueryClient() 取实例；
 *    useQuery 只有单对象签名。queryOptions()【主流】把 key 和 queryFn 绑在一起定义一次（ordersDemo.ts 有原文）。
 * 3. queryKey【主流】（query-keys 页）：顶层必须是数组；「Query Keys are hashed deterministically!」—— 对象键顺序不影响相等，
 *    「Array item order matters!」；「If your query function depends on a variable, include it in your query key」。
 *    区块五显示哈希结果（对象的键被排序，query-core 的 hashKey 用排序后的键重建对象再 JSON.stringify），有测试。
 * 4. queryFn 的约定【主流】（query-functions 页）：返回 Promise，失败要「throw or return a rejected Promise」；不能 resolve 成 undefined
 *    （5.102.8 在 query.js 里直接当成错误，没数据用 null）；fetch 不会因为 HTTP 错误 reject，要自己检查 response.ok。
 *    QueryFunctionContext 带 queryKey / client / signal / meta。
 * 5. 重要默认值【主流】（important-defaults 页 + query-core 5.102.8 源码）：staleTime 0；过期的查询在
 *    「New instances of the query mount / The window is refocused / The network is reconnected」时后台重取
 *    （refetchOnMount / refetchOnWindowFocus / refetchOnReconnect，只对过期数据生效，设成 'always' 才不看新旧）；
 *    gcTime 5 分钟（服务端默认 Infinity）；失败「silently retried 3 times, with exponential backoff delay」（retryer.js：浏览器 3 次、
 *    服务端 0 次，间隔 1s、2s、4s…上限 30s）；refetchInterval 默认 false；结构共享默认开。本课为了演示改了其中三项（七）。
 * 6. status × fetchStatus【主流】（queries 页）：「The status gives information about the data: Do we have any or not?」
 *    「The fetchStatus gives information about the queryFn: Is it running or not?」组合都可能出现：
 *    首次加载 = pending + fetching（isLoading）；后台重取 = success + fetching（isRefetching）；
 *    enabled: false = pending + idle（区块三）；离线时首次加载 = pending + paused（默认 networkMode: 'online' 下断网会暂停，
 *    重试等待期间页面不可见也会暂停）。暂停的请求要「在线且页面可见」才继续（retryer.js:51 的 canContinue 同时检查
 *    focusManager.isFocused() 和 onlineManager.isOnline()）—— Chrome 实测：页面不可见时恢复网络仍停在 paused，页面一可见就继续。请求失败时旧数据还在（isRefetchError），并被自动标记为已失效（query.js 的 'error' 分支）。
 *    派生布尔：isPending = status === 'pending'；isFetching；isLoading = isPending && isFetching；isRefetching = isFetching && !isPending；isPaused。
 * 7. 失效【主流】（query-invalidation 页）：invalidateQueries 做两件事 ——「It is marked as stale. This stale state overrides any staleTime
 *    configurations」「If the query is currently being rendered via useQuery or related hooks, it will also be refetched in the background」；
 *    默认按前缀匹配，exact / predicate 可以收窄。没人用的缓存只打标记，下次用到再取（区块五的「已失效」）。
 * 8. useMutation【主流】（mutations 页）：状态 idle / pending / error / success，variables 是这次传入的参数；
 *    默认不重试（「TanStack Query will not retry a mutation on error」）。回调分两层：useMutation 上的先执行、每次都执行；
 *    mutate(v, { onSuccess }) 上的后执行，「won't run if your component unmounts before the mutation finishes」，连续 mutate 只对最后一次生效。
 *    mutate 吞掉错误、不返回 Promise；mutateAsync 返回 Promise，要自己 try / catch，适合串联几步操作。
 *    回调 return 的 Promise 会被等待：「isPending is true until onSuccess is fulfilled」—— 区块二用 onSettled return 失效，按钮的「提交中」和列表重取同时结束。
 * 9. 乐观更新【主流】（optimistic-updates 页）：「You can either use the onMutate option to update your cache directly, or leverage the
 *    returned variables to update your UI」。改缓存：onMutate 里 cancelQueries → 快照 → setQueryData，onError 用快照回滚，onSettled 失效重取；
 *    variables：在途时把这一行直接画成新值，失败后自然消失，不用写回滚。官方建议：只有一处显示时用 variables，多处显示时改缓存。
 *    区块二三种做法并排，都有测试。React 19 的 useOptimistic 在 Actions 里做同样的事（31 题，待新增）。
 * 10. 取消【主流】（query-cancellation 页）：默认「queries that unmount or become unused before their promises are resolved are not cancelled」，
 *    queryFn 读了 signal 才会真的 abort（query.js 的 #abortSignalConsumed）。没读 signal 时请求照样跑完、结果写进原来那个 key 的缓存 ——
 *    结果按 key 归位保证了不串数据，但不等于取消。27 题手写的 AbortController，在这里由库在合适的时机 abort。
 * 11. 常用选项：enabled【主流】做依赖查询（「Dependent (or serial) queries」，本质是请求瀑布，能让后端合并接口更好）；
 *    placeholderData: keepPreviousData【主流】让翻页不闪（「each new page is treated like a brand new query」，isPlaceholderData 标出占位数据）；
 *    select + 结构共享 + tracked properties【主流】做渲染优化（五）；throwOnError 把错误交给错误边界（20 题）。
 * 12. useSuspenseQuery【较新·v5 起】（区块四；Suspense 与 use() 在 32 题，待新增）：迁移页原文「With v5, suspense for data fetching finally
 *    becomes "stable"」。data 的类型不含 undefined（没数据时组件挂起，不会渲染）；「you therefore can't conditionally enable / disable the Query」，没有 placeholderData；
 *    「Cancellation does not work」；错误默认只在缓存里没有数据时抛给错误边界，重试要配 QueryErrorResetBoundary。
 *    Suspense 模式下 staleTime 至少按 1 秒算（react-query 的 suspense.js），免得挂起结束马上又判定过期。
 * 13. React 侧的实现（只作引用，14 题）：useQuery 用 useSyncExternalStore 订阅观察者，渲染期用 getOptimisticResult 算出结果，
 *    选项在 effect 里 setOptions 同步给观察者；QueryClientProvider 在 effect 里 mount / unmount client。
 *
 * 三、Vue 对照（@tanstack/vue-query 5.102.8，与 react-query 共用同一个 query-core）
 * - 接入：app.use(VueQueryPlugin, { queryClient })（本课 vue/queryPlugin.ts），install 里 client.mount() + app.provide +
 *   app.onUnmount(unmount)；组件里同样用 useQueryClient()（inject）。
 * - 响应式参数（官方 Vue reactivity 指南原文）：「In vue query any reactive properties within a query key are tracked for changes
 *   automatically.」「enabled and queryKey are the two query options that can accept reactive values.」—— 把 ref 或 getter（() => props.x）
 *   放进 queryKey / enabled，库自动重取；React 侧靠「每次渲染把新 key 传进去」。
 * - 返回值：toRefs(readonly(state))，一组 ref，要解构成顶层变量模板才会自动解包；不解构写 q.isFetching ? … 拿到的是 ref 对象，条件判断里总按真值处理
 *   （vuejs.org「Ref unwrapping in templates only applies if the ref is a top-level property」，Vue 侧区块一有演示和测试）。
 * - 订阅缓存：Vue 在 onMounted 里 subscribe，没有「渲染期间不能更新别的组件」这条限制；React 要 useSyncExternalStore + batchCalls。
 * - Suspense：Vue 的 <Suspense>「is an experimental feature」【尝鲜】；vue-query 的 suspense() 配合异步 setup，错误用父组件的
 *   onErrorCaptured 接（Vue 文档原文「you can use … onErrorCaptured() hook to capture and handle async errors」）。
 *   默认设置下 suspense() 遇到错误不 reject，本课把 throwOnError 写成和 React 默认值相同的规则。
 * - Pinia 与 Zustand 一样只管客户端状态；devtools 是 @tanstack/vue-query-devtools（版本号走 6.x，6.1.48 对应 vue-query 5.102.8）；
 *   Vue 没有 StrictMode 双跑。
 *
 * 四、关键区别（每条写明前提）
 * 1. 「服务端状态 vs 客户端状态」是框架无关的分类：两侧同一个 query-core（5.102.8），缓存规则、key 哈希、默认值、回调顺序一样（两侧测试都覆盖）。
 * 2. 响应式接口（react-query 5 / vue-query 5）：React 传本次渲染的快照、返回普通值（外面包一层 Proxy，读了哪些属性就只追踪哪些）；
 *    Vue 传 ref / getter、返回 ref —— 这是两套响应式模型的差异，不是 Query 库的差异。
 * 3. 与路由 loader（React Router 7 Data 模式，18 题）：loader 在导航前取数，pending 归 useNavigation，错误归 errorElement，action 后自动重新验证；
 *    Query 在组件里按 key 缓存、跨路由存活、失效靠 invalidateQueries。两种组合都是【主流】，也能并用（区块六）。
 * 4. 与 use(promise) + Suspense（React 19 起【较新】，32 题待新增）：use 要求 promise 被缓存，useSuspenseQuery 就是一个现成的缓存来源。
 * 5. StrictMode（仅开发环境，React 18 起）：effect 多跑一轮 setup + cleanup；最后一个观察者离开时，读过 signal 的在途请求被取消后重发
 *    （列表日志里两条「queryFn 执行」加一条「被取消」），不读 signal 则只执行一次（都有测试）。Vue 没有这个现象。
 *
 * 五、常见追问与回答要点
 * - staleTime 和 gcTime 的区别？staleTime 决定多久之后算过期（过期才会在挂载 / 聚焦 / 重连时重取），默认 0；gcTime 决定没人用多久之后从缓存删掉，
 *   默认 5 分钟。迁移页解释旧名 cacheTime 为什么改：「cacheTime does nothing as long as a query is still in use. It only kicks in as soon as
 *   the query becomes unused.」
 * - invalidateQueries 和 staleTime 谁优先？失效覆盖 staleTime，正在被渲染的查询立即重取。例外是 staleTime: 'static'（九）。
 * - 窗口聚焦重取怎么关？refetchOnWindowFocus: false（defaultOptions 全局关，或单个查询关）；focusManager 默认监听的是 visibilitychange。
 * - onSuccess 写在 useMutation 还是 mutate 上？见二-8；要按顺序做几件事用 mutateAsync。本课测试证明了组件卸载后 mutate 级回调不执行、mutateAsync 照常完成。
 * - 为什么 v5 删掉了 useQuery 的 onSuccess？迁移页链接的 RFC（GitHub Discussion #5279）指向维护者博客：这些回调行为不一致 ——
 *   每个用到这个查询的组件各触发一次，数据直接从缓存读时又不触发，拿来同步状态会失步。替代：能派生就派生；「每个查询只提示一次」
 *   的副作用（比如错误提示）放到 QueryCache 的全局回调；实在要同步再在组件里用 useEffect。
 * - 同一个 key 两处 useQuery 写了不同的 queryFn？只按 key 认缓存，执行的是发起这次请求那一方的选项（普通 useQuery 用的是最近一次提交后在
 *   effect 里同步给观察者的选项；Suspense 模式在渲染期就用这次渲染的选项发请求），另一份不会被调用（测试覆盖）。所以用 queryOptions() 共用一份定义。
 * - 为什么 data 引用没变、组件没重渲染？结构共享（render-optimizations 页）：「React Query will keep the original reference if nothing changed
 *   in the data」；tracked properties：「React Query will only trigger a re-render if one of the properties returned from useQuery is
 *   actually "used"」，「If you use object rest destructuring, you will disable this optimization」（两条都有测试）。
 *   select 只在函数引用或 data 变化时重跑，内联的 select 每次渲染都会执行，要提到组件外或用 useCallback。
 * - 请求失败后旧数据还在吗？在：status 是 error，data 还是上一次的，缓存条目已标记失效，下次用到必定重取。
 * - TanStack Query 能替代 Zustand / Redux 吗？只替代「把接口数据当全局状态存」那部分；主题、侧栏开关、表单草稿这类客户端状态仍归客户端状态库（16 题）。
 *
 * 六、易错点
 * - queryFn 用到的变量没放进 key：参数变了不重取，或者不同参数共用了同一份缓存。
 * - 以为库会自动取消请求：queryFn 不读 signal 就不会 abort。
 * - 拿 isPending 当「正在请求」：有缓存时后台重取 isPending 是 false；enabled: false 时它一直是 true。要看 isFetching / isLoading。
 * - 用 ...rest 展开 useQuery 的返回值，关掉了属性追踪。
 * - 在 QueryClientProvider 同一层调用 useQuery：报「No QueryClient set, use QueryClientProvider to set one」（测试覆盖）。
 * - 把接口数据再复制进 useState / Zustand / Pinia，再手写 loading / error。
 * - fetch 拿到 404 / 500 没有 throw，查询不会进入 error；queryFn resolve 了 undefined。
 * - Vue：不解构返回值，在模板的条件里直接写 q.isPending（ref 对象总按真值处理）。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：retry: false、staleTime 5 秒、refetchOnWindowFocus: false；每次进入本题新建 QueryClient；mockApi 直接 throw、没有 HTTP 状态码；
 *   失败 / 断网用开关模拟；订单数据是模块级可变数组（这里改成「已支付」，22 题也看得到，刷新页面才恢复）。
 * - QueryClient 放哪：纯客户端应用在入口建一个；服务端渲染时绝不能放模块顶层 —— 官方 SSR 页原文：「Creating the queryClient at the file root
 *   level makes the cache shared between all requests and means all data gets passed to all users.」推荐在组件里
 *   useState(() => new QueryClient())，每个请求一份；服务端 gcTime 默认 Infinity；服务端预取后 dehydrate，客户端用 <HydrationBoundary> 接住（33 题，待新增）。
 *   Suspense 页还提醒：创建 client 的组件与会挂起的代码之间没有 Suspense 边界时，初次渲染一挂起 React 就会丢掉这个 client ——
 *   本课的 Suspense 边界在区块四内部，所以没问题。
 * - defaultOptions 统一设 staleTime（非 0）、retry、throwOnError，不在每个 useQuery 里重复；key 工厂 + queryOptions() 集中定义。
 * - queryFn 封装 fetch：检查 response.ok、透传 signal、统一错误类型。
 * - 写操作按前缀失效；乐观更新先考虑 variables，多处显示再改缓存。
 * - 开发期装 devtools 看缓存（官方原文「By default, React Query Devtools are only included in bundles when process.env.NODE_ENV === 'development'」）：
 *   React 是 @tanstack/react-query-devtools（与主包同版本号），Vue 是 @tanstack/vue-query-devtools（6.x）。本课没装，区块五的观察窗只为教学。
 * - 测试：每个用例一个新的 QueryClient、关掉重试（本课测试就是这样写的；34 题，待新增）。
 * - 22 题综合页仍是 Effect 手写，按已定决定在它的「七」里写生产改写方式。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - 包名：v4 起 react-query → @tanstack/react-query（v4 迁移页「react-query is now @tanstack/react-query」）；
 *   import { useQuery } from 'react-query' 是 v3 及以前的代码。
 * - v4 → v5（5.0 起，迁移页）：只剩单对象签名（useQuery(key, fn, options) 移除）；status 'loading' → 'pending'、isLoading → isPending、
 *   isInitialLoading → isLoading；cacheTime → gcTime；keepPreviousData: true → placeholderData: keepPreviousData（isPreviousData → isPlaceholderData）；
 *   useQuery 上的 onSuccess / onError / onSettled 移除（mutation 上的保留）；useErrorBoundary → throwOnError；Hydrate → HydrationBoundary；
 *   返回值的 remove() 移除（改用 queryClient.removeQueries）；suspense: true 选项换成专用的 useSuspenseQuery；最低 React 18.0（用了 useSyncExternalStore）。
 * - mutation 回调的参数：5.102.8 是 onError(err, variables, onMutateResult, context)，context.client 就是 QueryClient；旧教程写
 *   onError(err, variables, context)，那个 context 是 onMutate 的返回值 —— 位置没变，只是改了名、多了第四个参数（从哪个 5.x 起：待核实）。
 * - 11 / 22 题的 Effect 手写（loading / error / data + AbortController + reloadFlag）不算旧写法，官方仍允许，是教学写法。
 *
 * 九、新动向【尝鲜】
 * - queryClient.query()（5.102.0 起，2026-08-22 发布，不满一个月）：取代 fetchQuery，配 staleTime: 'static' 取代 ensureQueryData；
 *   5.102.8 的 .d.ts 已把 fetchQuery / prefetchQuery / ensureQueryData 标为 @deprecated，迁移页说它们「will be removed in v6」。v5 里旧方法照常可用。
 * - staleTime: 'static'【较新·5.79.0 起】：「never trigger a refetch, even if the Query is invalidated manually」。它看的是观察者（useQuery 等）上的
 *   staleTime；只在 queryClient.query() 里传 'static'，只影响这一次调用用缓存还是去取。
 * - npm 上 @tanstack/react-query 没有任何 6.x（2026-09-17，latest 5.103.1）；v6 目前只有 Solid 适配发了预发布版。
 *
 * 十、动手练习
 * 1. 给统计卡片加 select，只取「待支付」数量；select 分别写成内联函数和模块级函数，数一数 select 被调用的次数。
 *    可断言：模块级 select 在 data 不变时不会重跑。
 * 2. 用 mutateAsync 实现「把本页待支付订单全部标记为已支付」（依次 await），中途失败就停下并提示。
 *    可断言：失败那一单之后的订单都没有被请求。
 *
 * 参考（2026-09-17 核对；TanStack 文档取自 GitHub 仓库 docs 原文，与 5.102.8 tag 有差异处已注明）：
 * - tanstack.com/query/v5/docs/framework/react：overview、guides/important-defaults、queries、query-keys、query-functions、query-options、
 *   network-mode、disabling-queries、dependent-queries、paginated-queries、mutations、invalidations-from-mutations、query-invalidation、
 *   optimistic-updates、query-cancellation、render-optimizations、suspense、ssr、prefetching、migrating-to-v5、does-this-replace-client-state；devtools
 * - tanstack.com/query/v5/docs/framework/vue：installation、reactivity、devtools；tanstack.com/query/v4 的 migrating-to-react-query-4
 * - react.dev/reference/react/useEffect（Deep Dive「What are good alternatives to data fetching in Effects?」）
 * - vuejs.org：guide/built-ins/suspense、guide/essentials/reactivity-fundamentals
 * - ③ github.com/TanStack/query/discussions/5279 → tkdodo.eu/blog/breaking-react-querys-api-on-purpose（维护者博客）；
 *   GitHub release v5.79.0（staleTime: 'static'）；packages/query-core/CHANGELOG.md 5.102.0（query() 与弃用旧方法）
 * - 源码（5.102.8）：@tanstack/query-core/build/modern/ 的 query.js、queryObserver.js、queryClient.js、retryer.js、utils.js、mutation.js、
 *   mutationObserver.js；@tanstack/react-query/build/modern/ 的 useBaseQuery.js、useMutation.js、useSuspenseQuery.js、suspense.js、
 *   QueryClientProvider.js；@tanstack/vue-query/build/modern/ 的 useBaseQuery.js、vueQueryPlugin.js、useQueryClient.js
 */
import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { CacheInspector } from './CacheInspector'
import { LoaderVsQueryCard } from './LoaderVsQueryCard'
import { OrderDetailPanel } from './OrderDetailPanel'
import { OrdersListPanel } from './OrdersListPanel'
import { SuspenseStatsPanel } from './SuspenseStatsPanel'
import { createDemoQueryClient, createOrdersDemo, type ListFilters, type OrdersDemo } from './ordersDemo'

export default function Example() {
  /**
   * QueryClient = 缓存本体 + 默认配置。用 useState 的初始化函数创建（官方 SSR 页推荐的写法之一）：
   * - 本项目切换知识点就是卸载 / 重新挂载 Example，每次进入本题都拿到一份全新的空缓存，「首次加载」才演示得出来；
   * - 真实的纯客户端应用通常在 main.tsx 里建一次、全局唯一，缓存跨页面存活才是它的价值；
   * - 服务端渲染时恰恰不能写在模块顶层：模块级的 client 会被所有请求、所有用户共用（七）。
   * StrictMode 会把初始化函数调用两次并丢弃一次结果；被丢弃的 client 从没被 Provider mount 过（mount 在 effect 里），不留监听。
   */
  const [queryClient] = useState(() => createDemoQueryClient())
  const [demo] = useState(() => createOrdersDemo())

  // useQuery / useMutation 必须写在 Provider【之下】的组件里：写在 Example 这一层会报
  // 「No QueryClient set, use QueryClientProvider to set one」—— Context 只对子树可见（15 题）
  return (
    <QueryClientProvider client={queryClient}>
      <OrdersWorkbench demo={demo} />
    </QueryClientProvider>
  )
}

/**
 * 本课的页面主体。这里的 state 全是本地 UI state（筛选、页码、开关、选中行）——
 * 服务端数据一份都不存，都在 QueryClient 的缓存里。测试直接渲染它，配零延迟的 demo 和自己的 QueryClient。
 */
export function OrdersWorkbench({ demo }: { demo: OrdersDemo }) {
  const [filters, setFilters] = useState<ListFilters>({ status: 'all', page: 1 })
  const [keepPrevious, setKeepPrevious] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 每秒重渲染一次，只为把「数据落地几秒了」画出来（interval 在 cleanup 里清掉，10 题）
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="stack">
      <p className="muted">
        订单数据全部交给 TanStack Query：换筛选、翻页、刷新、模拟失败 / 断网、标记已支付，对照各区块的状态表和最下面的日志看。
      </p>
      <OrdersListPanel
        demo={demo}
        filters={filters}
        onFiltersChange={setFilters}
        keepPrevious={keepPrevious}
        onKeepPreviousChange={setKeepPrevious}
        selectedId={selectedId}
        onSelect={setSelectedId}
        now={now}
      />
      <OrderDetailPanel demo={demo} selectedId={selectedId} onClear={() => setSelectedId(null)} />
      <SuspenseStatsPanel demo={demo} />
      <CacheInspector
        demo={demo}
        filters={filters}
        keepPrevious={keepPrevious}
        selectedId={selectedId}
        now={now}
      />
      <LoaderVsQueryCard />
    </div>
  )
}
