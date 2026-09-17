/**
 * 主题：11. API 请求状态（pending / success / error 与空态、竞态、重试）
 * 适用版本：React 19.2 · @types/react 19.2 · Vue 3.5 · TanStack Query 5（只作对照，代码在 30 题）
 * 最后核对：2026-09-17
 * 前置主题：10 useEffect 与生命周期、07 表单、29 判别联合
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 两个区块）· EffectRequestPanel.tsx【主线：Effect 手写】·
 *          ApproachesCard.tsx（四种方案速查）· Example.test.tsx（本课结论的自动化测试）
 *
 * 本课定位：**手写是教学写法，生产用缓存层（30 题）或路由 loader（18 题）。**
 * 官方在 useEffect 页写得很直接：在 Effect 里取数「is, however, a very manual approach and it has significant downsides」，
 * 并且「This list of downsides is not specific to React. It applies to fetching data on mount with any library.」
 *
 * 一、30 秒面试速答
 * - 请求态是三值枚举 pending / error / success，用判别联合建模，让「又成功又失败」这种组合无法表示；
 *   「空」不是第四种请求态，而是 success 下 data.length === 0 的派生展示，文案是引导换关键词而不是报错。
 * - 手写 Effect 取数要做四件事：cleanup 里 abort 或 ignore（竞态）、参数变化时的旧结果不能覆盖新结果、
 *   真实 fetch 要检查 response.ok、取消（AbortError）不算失败。
 * - 请求态尽量派生不要存：本课把「结果属于哪一次参数」记在结果里，pending 由它算出来 ——
 *   这样 Effect 体里不用同步 setState（那会命中 react-hooks 的 set-state-in-effect，还多一轮渲染）。
 * - 官方不推荐生产里裸写 Effect 取数：不在服务端跑、容易网络瀑布、没有预载和缓存、样板多；
 *   有框架就用框架的机制，否则用 TanStack Query / useSWR / React Router，都不合适才继续写 Effect。
 * - TanStack Query v5：status 回答「有没有数据」，fetchStatus 回答「queryFn 在不在跑」；默认失败静默重试 3 次、指数退避。
 *   React 19 的 use(promise) + Suspense 把 loading / error 交给 fallback 和错误边界，但 promise 必须缓存（32 题，待新增）。
 *
 * 二、核心概念（React）
 * 1. 状态建模【主流】：判别联合（29 题）。三个独立布尔会出现 isLoading && isError 这类非法组合，判别联合让它们无法表示。
 *    错误也要分层：HTTP 错误（4xx / 5xx）、网络错误、取消是三类东西，展示方式不同（19 题、27 题）。
 * 2. 请求态能派生就不要存【主流】：官方 lint 规则 set-state-in-effect 的原话是
 *    「Validates against calling setState synchronously in an effect, which can lead to re-renders that degrade performance.」
 *    本课把参数指纹（keyword + 重试次数）记进结果，pending = 结果的指纹 ≠ 当前指纹。顺带两个好处：
 *    过期响应写进来也不会被当成当前结果（等价于官方 ignore 标记）；切换关键词时旧数据能继续显示（不闪 loading）。
 *    注意：官方 useEffect 页自己的 Fetching data 示例里有一行同步 setBio(null)，在本项目的 recommended 预设下会被这条规则报错
 *    （2026-09-17 实测）。官方示例重在讲 ignore，不代表这行必须这么写。
 * 3. 取消与竞态【主流】：cleanup 里 controller.abort()；官方的等价做法是 ignore 标记，
 *    「This ensures your code doesn't suffer from "race conditions": network responses may arrive in a different order than you sent them.」
 *    取消不是失败，catch 里先判断 AbortError（27 题细讲）。
 * 4. 重试与「搜同一个词」【主流】：把 reloadFlag 计数器放进参数指纹，+1 就重跑同一段逻辑；
 *    只调 setKeyword(相同值) 不会触发 Effect。同一个事件里的两次 setState 会被批处理成一次重渲染（24 题）。
 * 5. 真实 fetch 的坑【主流】（③ MDN）：「A fetch() promise only rejects when the request fails, for example, because of a
 *    badly-formed request URL or a network error. A fetch() promise does not reject if the server responds with HTTP status codes
 *    that indicate errors (404, 504, etc.). Instead, a then() handler must check the Response.ok and/or Response.status properties.」
 *    本课的模拟接口直接 throw，是演示简化；照搬到真实 fetch 时 error 分支永远不会触发。
 * 6. 开发环境两次请求【主流】：StrictMode 会挂载两次，所以网络面板里会看到两次请求，生产只有一次（10 题）。
 * 7. 官方给的替代方案与选型【主流】（引文见 ApproachesCard.tsx）：框架机制 → 客户端缓存层（TanStack Query / useSWR /
 *    React Router）→ 都不合适才继续写 Effect；无框架又要手写时，官方建议至少抽成自定义 Hook（14 题），
 *    以后整体替换成缓存层也只改一处。
 * 8. 并排【主流】TanStack Query v5（30 题）：useQuery({ queryKey, queryFn }) 返回 data / error / status / fetchStatus /
 *    isPending / refetch。官方原文：「The status gives information about the data: Do we have any or not? The fetchStatus gives
 *    information about the queryFn: Is it running or not?」；默认行为「Queries that fail are silently retried 3 times, with
 *    exponential backoff delay」「'inactive' queries are garbage collected after 5 minutes」，缓存数据默认按 stale 处理。
 * 9. 并排【主流】路由 loader（18 题）：取数发生在渲染之前，组件里 useLoaderData 直接拿数据，pending 看 useNavigation().state。
 * 10. 并排【较新·19.0 起】use(promise) + Suspense + 错误边界（32 题，待新增）：
 *    「Promises passed to use must be cached so the same Promise instance is reused across re-renders」；
 *    「use cannot be called inside a try-catch block. Instead, wrap your component in an Error Boundary」。
 *    Suspense 只对「支持 Suspense 的数据源」生效，看不见 Effect 里的请求。
 *
 * 三、Vue 对照
 * - 官方 composable 写法（vuejs.org/guide/reusability/composables 的 Async State Example）：useFetch(url) 用
 *   watchEffect + toValue，url 可以是字符串、ref 或 getter；「Notice that toValue(url) is called inside the watchEffect callback.」
 *   官方示例没做取消，需要自己补 onWatcherCleanup（Vue 3.5【主流】，本课 Vue 侧就是这么写的）。
 * - 本课 Vue 侧用 watch(参数指纹, …, { immediate: true }) + onWatcherCleanup，和 React 的 Effect 依赖驱动一一对应；
 *   命令式的 load() 也是 Vue 常见写法（区别只是触发方式）。
 * - 路由取数（router.vuejs.org/guide/advanced/data-fetching）：「Fetching After Navigation」（导航后在组件里取数、显示 loading）
 *   ↔ 本课写法；「Fetching Before Navigation」（在 beforeRouteEnter 里取数，「The user will stay on the previous view while the
 *   resource is being fetched for the incoming view.」）↔ React Router 的 loader。vue-router 5 的 vue-router/experimental
 *   数据加载器最接近 loader【尝鲜】。
 * - TanStack ↔ @tanstack/vue-query（同一个 query-core，返回 ref，30 题）。
 * - use(promise) + Suspense ↔ Vue 的 <Suspense>：等 async setup() 的组件或异步组件，用 #fallback 插槽；
 *   官方原话「<Suspense> is an experimental feature. It is not guaranteed to reach stable status and the API may change before it does.」
 *   错误要用父组件的 onErrorCaptured 接（19 题已验证 async 错误也能接到）。
 * - fetch 不因 HTTP 错误 reject 是浏览器行为，两边一样；StrictMode 的双请求 Vue 没有对应物。
 *
 * 四、关键区别（每条写明适用范围）
 * 1. 状态建模与框架无关，两边的类型可以逐字相同；差别在更新方式：React 必须 setState 换新对象，Vue 可以整体替换 ref.value。
 * 2. 触发方式（本课两侧都用「依赖 / 参数驱动」）：React 的 Effect 依赖数组 ↔ Vue 的 watch + immediate；
 *    Vue 另一种常见写法是命令式 load()，React 里对应的是把请求写进事件处理函数（但初始加载仍要 Effect）。
 * 3. 取消的写法：React 在 cleanup 里 abort ↔ Vue 3.5 用 onWatcherCleanup（Vue 3.4 及以前在 watch 回调的 onCleanup 参数里）。
 * 4. pending 的归属随方案变：手写自己建模；TanStack 在 status × fetchStatus；loader 在 useNavigation().state；
 *    use(promise) 在 Suspense 的 fallback。
 * 5. 开发期两次请求只出现在 React 18+ 的 StrictMode。
 *
 * 五、常见追问与回答要点
 * - 一个请求组件要哪些状态？pending / success / error 三态 + 空态是 success 的派生；不用三个布尔是为了消灭非法组合。
 * - 「空」算状态吗？不算请求态；文案和交互都与错误态分开（不给「重试」，给「换个关键词」）。
 * - fetch 拿到 404 会进 catch 吗？不会，只有请求本身失败（网络错误、URL 非法）才 reject，要自己查 response.ok。
 * - 为什么开发环境请求两次？StrictMode 挂载两次（10 题）。
 * - 官方为什么不推荐在 Effect 里取数？四条：不在服务端执行、网络瀑布、没有预载 / 缓存、样板多容易出竞态。
 * - TanStack 的 status 和 fetchStatus 有什么区别？前者说「有没有数据」，后者说「queryFn 在不在跑」；isPending 就是「还没有数据」。
 * - TanStack 和路由 loader 能一起用吗？能：loader 里预取（prefetchQuery），组件里 useQuery 读缓存；也可以留在声明式路由 + TanStack。
 * - 为什么不能 use(fetch(url))？客户端每次渲染都会新建 promise，必须传缓存里的同一个实例；错误交给错误边界。
 * - 切换关键词时表格闪一下怎么治？保留上一次数据 + 一个「刷新中」标记（本课做法），TanStack 里是 placeholderData: keepPreviousData。
 *
 * 六、易错点
 * - 三个布尔并存，出现 isLoading && isError。
 * - 忘了检查 response.ok，error 分支永远不触发（本课模拟接口直接 throw，属演示简化）。
 * - 把取消当失败：每切换一次关键词就闪一次错误（27 题）。
 * - Effect 体里同步 setState 重置 loading：多一轮渲染，还会被 set-state-in-effect 报错；能派生就派生。
 * - 过期响应覆盖新结果：要么 ignore 标记，要么像本课一样让结果带上参数指纹。
 * - 搜同一个词不重新请求：setKeyword 传相同值不会触发 Effect，要用 reloadFlag 或 refetch。
 * - 切换参数时先清空再加载，表格闪一下。
 * - 把「手写这一套」当成生产标准：官方明确列了缺点并给了替代方案。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：共用的模拟接口直接 throw Error、没有 HTTP 状态码、失败用开关模拟。真实项目要封装 fetch：
 *   检查 response.ok、统一错误类型（HTTP / 网络 / 取消）、用 AbortSignal.timeout() 做超时（27 题）。
 * - 生产默认：TanStack Query v5（30 题）或路由 loader（18 题）。手写只留给「无框架、无缓存需求」的场景，而且至少抽成自定义 Hook（14 题）。
 * - 加载体验：延迟显示骨架屏 / spinner，切换参数保留旧数据；错误信息脱敏后再展示。
 * - 无障碍：错误提示用 role="alert"（19 题、35 题待新增）。
 * - 测试：请求组件用 mock 接口（本课用注入的 delayMs + 失败开关）或 MSW，断言三态渲染（34 题，待新增）。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - 裸 Effect 请求（没有 ignore / abort）：切换参数时旧响应可能覆盖新结果；组件级 isMounted 标记只能挡卸载（27 题）。
 * - TanStack Query v4 → v5 的改名（存量项目里很常见）：loading → pending、isLoading → isPending、
 *   isInitialLoading → isLoading、cacheTime → gcTime、keepPreviousData → placeholderData、useErrorBoundary → throwOnError，
 *   query 上的 onSuccess / onError 回调被移除（30 题）。本课手写版用的是 pending / success / error 三个词，和 v5 对齐。
 * - React Router 6.4 的 defer() → v7 里 loader 直接返回 promise（18 题）。
 *
 * 九、新动向【尝鲜】
 * - Server Component 里直接 async / await 取数，再把 promise 传给客户端组件 use（需要 RSC 框架，33 题，待新增）。
 * - vue-router 5 的 vue-router/experimental 数据加载器（官方标注仍在变化）。
 *
 * 十、动手练习
 * 1. 把主线面板里的请求逻辑抽成自定义 Hook useUsers(keyword, reloadFlag)（14 题）。
 *    可断言：组件里不再出现 AbortController，行为不变（把本课的测试原样跑通）。
 * 2. 给面板加一个「延迟 2 秒」的开关，连续搜索两个关键词，观察旧请求被取消。
 *    可断言：只会渲染后一个关键词的结果，控制台没有错误。
 *
 * 参考（2026-09-17 核对）：
 * - react.dev：reference/react/useEffect（Deep Dive「What are good alternatives to data fetching in Effects?」）；
 *   learn/you-might-not-need-an-effect#fetching-data；reference/react/use；reference/react/Suspense；
 *   reference/eslint-plugin-react-hooks/lints/set-state-in-effect
 * - tanstack.com/query/v5：guides/queries、guides/important-defaults、guides/migrating-to-v5、guides/paginated-queries
 * - reactrouter.com/7.18.4：start/data/data-loading、start/data/pending-ui
 * - vuejs.org：guide/reusability/composables（Async State Example）、guide/built-ins/suspense；
 *   router.vuejs.org/guide/advanced/data-fetching
 * - ③ MDN：developer.mozilla.org/en-US/docs/Web/API/Window/fetch
 */
import { ApproachesCard } from './ApproachesCard'
import { EffectRequestPanel } from './EffectRequestPanel'

export default function Example() {
  return (
    <div className="stack">
      <EffectRequestPanel />
      <ApproachesCard />
    </div>
  )
}
