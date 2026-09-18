/**
 * 主题：16. 全局状态（Zustand 5 主线 · Context + useReducer 并排 · Redux Toolkit 对照）
 * 适用版本：React 19.2 · zustand 5.0 · Vue 3.5 · pinia 3.0（Redux Toolkit 2.x / react-redux 9.x 只作对照，本仓库未安装）
 * 最后核对：2026-09-17
 * 前置主题：15 Context、29 useReducer、21 不可变更新、25 状态提升、14 useSyncExternalStore、30 服务端状态
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 入口）· cartStore.ts【主线 store】· CartDemo.tsx（区块一）· StoreApiDemo.tsx（区块二）·
 *          ContextReducerCart.tsx（区块三 · 并排）· ScopedStoreDemo.tsx（区块四）· ReduxToolkitCard.tsx（区块五 · 只读）·
 *          renderCounts.tsx（渲染计数工具）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 先分类再选工具：服务端数据交给 TanStack Query（30 题）；筛选、分页、tab 这类能放进 URL 的放路由（18 题）；表单草稿留在表单里（07 题）；
 *   只被一棵子树用的提升到共同父组件（25 题）；剩下「跨页面 / 跨互不嵌套组件共享的客户端状态」（购物车、登录用户、偏好）才进全局 store【主流】。
 * - Zustand 5【主流】：create<T>()(...) 返回的 store 本身就是 Hook，不需要 Provider；组件用 selector 只订阅一小块，结果用 Object.is 比较，
 *   没变就不重渲染；selector 返回新对象 / 数组要包 useShallow，否则 v5 会无限更新。底层是 useSyncExternalStore（14 题）。
 * - Context 是「传值」机制，不是状态库：value 变了，读它的组件全部重渲染，没有 selector，memo 也挡不住；适合低频的全局值和依赖注入【主流】。
 * - Redux Toolkit【主流·存量】是 Redux 官方的标准写法：configureStore + createSlice（内置 Immer，可以「直接改」）+ useSelector / useDispatch，
 *   需要 Provider；存量项目很多，面试常问它和 Zustand 的取舍。
 * - Vue 对照：Pinia 是 Vue 官方推荐的状态库，setup store 里 ref / computed / function 就是 state / getter / action；依赖自动追踪，
 *   不需要 selector，解构 state 用 storeToRefs。
 *
 * 二、核心概念（React）
 * 1. 状态放哪【主流】。react.dev passing-data-deeply-with-context：「Start by passing props.」「Extract components and pass JSX as children to them.」
 *    「If neither of these approaches works well for you, consider context.」Context 的四个典型用途里有一条「Managing state: ... It is common to use a
 *    reducer together with context」。服务端数据不进 store 的依据见 30 题（does-this-replace-client-state 页），这里不重复。
 * 2. Zustand 的定位【主流】。官方 introduction 页：「A small, fast, and scalable bearbones state management solution」「You can use the hook anywhere,
 *    without the need of providers. Select your state and the consuming component will re-render when that state changes.」
 *    README「Why zustand over context?」三条：「Less boilerplate」「Renders components only on changes」「Centralized, action-based state management」。
 *    采用情况（③ npm，2026-09-10 至 09-16 周下载，含传递依赖，只作流行度参考）：zustand 5034 万、react-redux 3360 万、@reduxjs/toolkit 2721 万、
 *    jotai 534 万、mobx 345 万、valtio 186 万；zustand 里 v5 占 55.3%、v4 占 39.5%（单个版本下载最多的仍是 4.5.7）。
 * 3. 创建 store【主流】（cartStore.ts）：create<CartState>()((set, get) => ({ ... }))。多一对括号的原因，官方 advanced-typescript 指南：
 *    「Because state generic T is invariant」（没法从创建函数里推断）和「It is a workaround for microsoft/TypeScript#10571」（只指定第一个类型参数、
 *    其余让 TS 推断）。state 和 actions 写在同一个接口里：flux-inspired-practice 指南「Your applications global state should be located in a single
 *    Zustand store」「If you have a large application, Zustand supports splitting the store into slices」，并建议把 actions 和 state 放在一起。
 * 4. set 与 get【主流】：
 *    - 浅合并一层（immutable-state-and-merging 指南「The set function merges state at only one level」）；set(x, true) 整体替换，
 *      README 原文「Be careful not to wipe out parts you rely on, like actions」（测试覆盖：替换后 action 变成 undefined）。v5 起类型上要求 replace 时传完整 state。
 *    - set 先用 Object.is 比较（zustand esm/vanilla.mjs:6）：函数返回原来的 state 对象，就不会通知订阅者（测试覆盖）。store 里仍要不可变更新（21 题）。
 *    - get() 读调用这一刻的最新 state。异步 action：README「Just call set when you're ready, zustand doesn't care if your actions are async or not」（区块二）。
 *      set 是同步生效的，所以 checkoutCart 开头用 get() 判断 pending 就能挡住同一轮里的第二次调用，不需要 19 题那样的 useRef 锁（测试覆盖）。
 * 5. selector 决定谁重渲染【主流】（区块一）：
 *    - useCartStore(selector) 只订阅选出来的值。useShallow 指南：「The computed selector will cause a rerender if the output has changed according to
 *      Object.is.」（README 的说法是 strict-equality）。不传 selector 就订阅整个 store，任何字段变化都重渲染（区块一的反例徽标，测试覆盖）。
 *    - selector 返回对象 / 数组时包 useShallow（从 zustand/react/shallow 导入，zustand/shallow 也导出了它）：只比较第一层，每个值用 Object.is，
 *      嵌套对象按引用比（esm/vanilla/shallow.mjs，测试覆盖）。
 *    - 不包会怎样：v5 迁移指南「If a selector returns a new reference, it may cause infinite loops」「To fix it, use the useShallow hook」。本仓库实测
 *      （react-dom 19.2.8）：开发环境先 console.error「The result of getSnapshot should be cached to avoid an infinite loop」，随后抛
 *      「Maximum update depth exceeded」（测试覆盖）。这就是 14 题「getSnapshot 必须稳定」在 Zustand 上的表现。
 *    - 派生值在 selector 里算：beginner-typescript 指南「You can derive values using selectors」。本课导出 selectTotalCount / selectTotalPrice，
 *      返回数字，Object.is 天然稳定。旧课件「store 里放 totalPrice 函数、selector 里调用 s.totalPrice()」：文档推荐在 selector 里派生，没有示范过在 selector 里调
 *      store 上的函数（advanced-typescript 的 slices 例子在 store 里放过 getBoth 这类派生函数，但没在 selector 里调用），已改成选择器函数。
 * 6. 底层【主流】：zustand 5.0.15 的 useStore 就是 React.useSyncExternalStore(api.subscribe, useCallback(() => selector(api.getState()), [api, selector]),
 *    useCallback(() => selector(api.getInitialState()), [api, selector])) + useDebugValue（esm/react.mjs:5-13）。第三个参数意味着服务端渲染读的是 getInitialState()：
 *    服务端拿不到客户端内存里的购物车（测试覆盖），这也是服务端渲染要换写法的原因之一（第 9 条）。
 * 7. 在组件外读写【主流】（区块二）：README「Reading/writing state and reacting to changes outside of components」—— Hook 上挂着
 *    getState / setState / subscribe / getInitialState。事件处理函数里用 getState() 读最新值（不订阅）；请求拦截器、WebSocket 回调这类非 React 代码
 *    用 getState().clear() 调 action；组件里用 subscribe 要放进 Effect，并把它返回的取消函数当 cleanup（测试覆盖）。
 *    需要「只在某个字段变化时回调」用 subscribeWithSelector 中间件。
 * 8. 中间件【主流】（cartStore.ts 用了前两个）：
 *    - devtools：连接 Redux DevTools 浏览器扩展；enabled「Defaults to true when is on development mode, and defaults to false when is on production mode」；
 *      set 的第三个参数是 action 名；不写时 5.0.15 先从调用栈推断调用者的函数名，推断不出来才是 "anonymous"（esm/middleware.mjs:75-77；
 *      本课 devtools 和 set 之间隔着 persist，推断不出来，所以每个 set 都写了名字）；没装扩展时不包装 setState，直接 return fn(set, get, api)（:67-68）。
 *    - persist：name（存储键，必须唯一）、storage（默认 createJSONStorage(() => localStorage)）、partialize（白名单）、version + migrate（结构升级）、
 *      merge（默认浅合并）、skipHydration（服务端渲染时手动 rehydrate）。localStorage 这类同步存储在 create 返回时就水合完，异步存储在之后的微任务里；
 *      版本号不一致又没写 migrate 会 console.error 并丢弃旧数据（测试覆盖）。
 *    - subscribeWithSelector、combine（自动推断 state 类型；指南说用 combine 时不推荐柯里化写法）、redux（reducer 风格）、
 *      immer（要另装 immer，本仓库没装，只作介绍）。
 *    - 顺序：advanced-typescript 指南「we recommend using devtools middleware as last as possible」，所以写成 devtools(persist(...))。
 * 9. createStore + Context【主流】（区块四）：README「Because the normal store is a hook, passing it as a normal context value may violate the rules
 *    of hooks. The recommended method available since v4 is to use the vanilla store.」initialize-state-with-props 指南的写法：
 *    useState(() => createStore(...)) 放进 Context，读的时候 useStore(store, selector)。用在三种场合：服务端渲染每个请求一份（Next.js 指南
 *    「the store should be created per request and should not be shared across requests」）、用 props 初始化、同一组件在页面上出现多次。
 * 10. Context + useReducer【主流 · React 内置】（区块三，并排）：scaling-up-with-reducer-and-context 教程——两个 Context（state / dispatch）加
 *    自定义 Hook（useTasks / useTasksDispatch），适合一棵子树内部的复杂状态、低频全局值和依赖注入。它没有 selector：useContext 参考页
 *    「Skipping re-renders with memo does not prevent the children receiving fresh context values」（测试覆盖：只改礼品包装，memo 包着的件数徽标照样渲染）。
 *    只读 dispatch 的组件不重渲染，是因为 dispatch「has a stable identity」（useReducer 参考页；测试覆盖）。React 19 起直接写 <Context value>。
 * 11. Redux Toolkit【主流·存量】（区块五，只读）：官方 getting-started「The Redux Toolkit package is intended to be the standard way to write Redux
 *    logic」，它最初是为了减轻（原文「help address」）三个常见抱怨：「Configuring a Redux store is too complicated」「I have to add a lot of packages
 *    to get Redux to do anything useful」「Redux requires too much boilerplate code」。所以说「Redux 样板多」要分清对象：经典写法样板最多，RTK 少了很多，
 *    但和 Zustand 比仍要 Provider、configureStore、带类型的 Hook。createSlice 内部用 Immer，reducer「may safely "mutate" the
 *    state they are given」；异步用 createAsyncThunk，服务端数据用 RTK Query。react-redux 的 useSelector「uses strict === reference equality checks by
 *    default」，多个字段可传 shallowEqual。Redux FAQ 说它最适合：大量状态在很多地方用、更新频繁、更新逻辑复杂、代码库大且多人协作、需要看到状态随时间怎么变。
 *
 * 三、Vue 对照
 * - 定位：vuejs.org scaling-up/state-management：Pinia「is maintained by the Vue core team」；「Vuex is now in maintenance mode. It still works, but will
 *   no longer receive new features. It is recommended to use Pinia for new applications.」（同页「works with both Vue 2 and Vue 3」已过时：Pinia 3 起只支持 Vue 3。）
 *   React 官方不指定状态库：内置的是 Context（+ reducer）和给外部 store 用的 useSyncExternalStore —— 这是两边生态最大的不同。
 * - setup store（vue/cartStore.ts）：「ref()s become state properties」「computed()s become getters」「function()s become actions」；
 *   「you must return all state properties in setup stores」。option store 与 setup store：「Options stores are easier to work with while Setup stores
 *   are more flexible and powerful」。
 * - 订阅：依赖按渲染时实际读取的属性记录，读了才依赖，不需要 selector（Vue 区块一，测试覆盖）；store 是 reactive 对象，「we cannot destructure it」，
 *   要用 storeToRefs（只转 state 和 getter，跳过 action），action 直接解构（测试覆盖）。
 * - 派生：getter「are exactly the equivalent of computed values」，依赖没变不重算；而且 Vue 3.4 起 computed 结果没变就不通知下游
 *   （blog.vuejs.org/posts/vue-3-4：「the callback now only fires if the computed result has actually changed」），作用相当于 selector 的 Object.is（测试覆盖）。
 * - 更新：直接改；或 $patch(对象)（普通对象深合并、数组整体替换）/ $patch(函数)（适合 push、一次改多处）；「You cannot exactly replace the state」，
 *   给 $state 赋值内部也是 $patch。setup store「you need to create your own $reset() method」—— 默认实现在开发环境抛错（测试覆盖），生产环境什么也不做（pinia.mjs:1357-1363 的 noop 分支）。
 * - 监听：$subscribe（「subscriptions will trigger only once after patches」；底层是 deep watch，默认 flush 'pre'；在组件里调用会随组件卸载取消，
 *   { detached: true } 保留）；$onAction（action 调用前触发，after / onError；它的 detached 是第二个参数 true）。
 *   坑：Pinia 4 文档的提示「a direct mutation ... happening synchronously right after a $patch() in the same tick won't trigger a non-sync subscription on
 *   its own」，要每次都通知就用 flush: 'sync'（3.0.4 实测同样如此，测试覆盖；本课 persistPlugin 因此用 sync）。
 *   pinia.d.ts 里 onError「Return false to catch the error」的注释在 3.0.4 没有实现（错误照样抛出），不要依赖。
 * - 扩展：插件 pinia.use()（「Plugins are only applied to stores created after the plugins themselves, and after pinia is passed to the app」），
 *   对应 Zustand 的中间件。官方没有持久化插件，本课 vue/persistPlugin.ts 是演示实现（读 defineStore 第三个参数里的自定义选项）；
 *   devtools、HMR（acceptHMRUpdate）、服务端渲染支持在 Pinia 核心里（introduction「Why should I use Pinia?」）。
 * - 最小方案：模块级 reactive（「Simple State Management with Reactivity API」，Vue 区块三）。服务端渲染时「the store being a singleton shared across
 *   multiple requests」；ssr 指南把这叫「cross-request state pollution」，推荐「create a new instance of the entire application - including the router and
 *   global stores - on each request」。Pinia 的 state 挂在 pinia 实例上，每个 app 一份。
 * - 组件外：「any call of useStore() after installing the pinia plugin with app.use(pinia) will work」；服务端渲染要把 pinia 传进 useStore(pinia)，
 *   「This prevents pinia from sharing global state between different application instances.」
 * - 对应 RTK 的 createSlice + Immer：Pinia 本来就能直接改，也没有 mutations（「mutations no longer exist」）。
 *
 * 四、关键区别（每条写明前提）
 * 1. 订阅粒度：Zustand 5 手写 selector + Object.is（v5 的 create / useStore 不再接受自定义相等函数）；Pinia 3 + Vue 3.5 依赖追踪自动完成；
 *    Context 没有 selector；react-redux 9 的 useSelector 默认 ===、可传 shallowEqual。
 * 2. selector 每次返回新引用：Zustand 5 可能无限更新（迁移指南说这是「to match React default behavior」的行为变化）；react-redux 是每次都多一次重渲染，
 *    8.1.0 起开发期的 stabilityCheck 会在控制台警告。
 * 3. Provider：Zustand 模块级 store 不需要（服务端渲染 / 多实例时才用 createStore + Context）；Context、react-redux 需要；Pinia 需要 app.use(createPinia())。
 *    本站里的表现：离开 16 题再回来，React 的购物车还在内存里（模块级单例）；Vue 侧是新建的 pinia，购物车靠 persistPlugin 从 localStorage 读回来。
 * 4. 更新方式：Zustand、Context + useReducer、RTK 都是不可变更新（RTK 借 Immer 写成可变的样子）；Pinia 直接改（21 题）。
 * 5. 派生值：Zustand 没有带缓存的 getter，在 selector 里算，每次 store 变化都重算、按结果决定是否重渲染；Pinia getter 是 computed，依赖没变不重算。
 * 6. 生态：React 官方不指定状态库；Vue 官方推荐 Pinia。
 *
 * 五、常见追问与回答要点
 * - Context 能不能当全局状态管理？能传，不擅长高频更新：没有 selector，value 一变所有消费者重渲染。拆 Context、value 用 useMemo 能缓解（useContext 页
 *   「Optimizing re-renders when passing objects and functions」），但复杂起来就是在手写一个 store。
 * - Zustand 为什么不需要 Provider？store 是模块里的普通对象，组件通过 useSyncExternalStore 订阅它。代价：服务端渲染时模块级单例会跨请求共享。
 * - useStore(s => ({ a: s.a, b: s.b })) 有什么问题？每次返回新对象，v5 下 getSnapshot 不稳定 → 无限更新；包 useShallow（比较一层），或拆成两个原子 selector。
 * - v5 去掉了 equalityFn 参数怎么办？迁移指南只说「The create function in v5 does not support customizing equality function」，没有给理由；
 *   多字段用 useShallow，要 v4 的行为用 zustand/traditional 的 createWithEqualityFn（要另装 use-sync-external-store）。
 *   （同一份指南里「to match React default behavior」说的是另一件事：selector 必须返回稳定引用。）
 * - 什么时候选 Redux Toolkit？已有 Redux 的项目；Redux FAQ 列的五种情况；团队要强约定、要 Redux DevTools 看时间线。RTK 为什么能「直接改」？Immer。
 *   RTK Query 和 TanStack Query 怎么选？RTK 的对比页原话「If you're using one of them, you're happy with it, and it solves the problems you are facing in
 *   your app, keep using that tool」；已经用 Redux 选 RTK Query，否则 TanStack Query（30 题）。
 * - 组件外怎么读写？getState / setState / subscribe；调 action 用 getState().xxx()。
 * - 服务端渲染要注意什么？每个请求一个 store（createStore + Context）；React Server Components 不读写 store（Next.js 指南「React Server Components should not
 *   read from or write to the store」）；persist 用 skipHydration 手动水合（33 题，待新增）。
 * - persist 改了数据结构怎么办？version + 1，写 migrate；partialize 只存需要的字段；createJSONStorage「does not perform any runtime validation」，生产里读出来要校验。
 * - 用了 React Compiler 还要写 selector 吗？要。编译器自动记忆化组件内部的计算和 JSX，订阅粒度仍由 selector 决定（推论，官方未见原文，待核实，见 17 题）。
 * - Pinia setup store 为什么调 $reset 报错？只有 option store 能按 state() 重新生成初始值，setup store 要自己写。
 *
 * 六、易错点
 * - 不传 selector，订阅了整个 store。
 * - selector 返回新对象 / 数组不包 useShallow；在 selector 里写 `s.action ?? (() => {})` 这种每次新建的兜底（迁移指南的第二个例子，改成模块级常量）。
 * - set(x, true) 把 actions 一起换掉；在 set 里原地修改嵌套对象（引用没变，selector 认为没变）。
 * - 在渲染里调用 getState() 读值：没有订阅，界面不会跟着变。
 * - 组件里 subscribe 了不 cleanup；StrictMode 下会多订一份。
 * - 把服务端数据塞进 store（30 题）；把 token、提交中这类状态也持久化；改了数据结构不升 version。
 * - Context 的 value 每次渲染都新建对象；一个大 Context 装所有东西。
 * - Pinia：直接解构 state；setup store 没写 $reset 就调用；依赖 onError 返回 false 吞错误。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：结算接口是模拟的（真实服务端要重新计价、保证幂等，19 题）；提交请求本身常交给 useMutation（30 题），store 只在成功后 clear()；
 *   渲染次数靠 <Profiler> 统计，生产构建不会调用 onRender。
 * - 按领域拆 slices：const createCartSlice: StateCreator<CartSlice & PrefSlice, [], [], CartSlice> = (set) => ({ ... })，再在 create 里合并；
 *   slices-pattern 指南：「you should only apply middlewares in the combined store」（有中间件时第二个类型参数写 mutators，例如 [['zustand/devtools', never]]）。
 * - persist：只存白名单字段；结构变化升 version + migrate；读出来的数据不可信，用 zod 之类校验；token 等敏感数据不要放 localStorage（35 题，待新增）；
 *   React Native 的 AsyncStorage 这类异步存储会先渲染初始值，要看 hasHydrated() / onFinishHydration 再决定显示什么。
 * - 服务端渲染的写法还在调整：zustand 的 Next.js 指南从 2025-10 起开头就注明「We will be updating this guide soon」，照做前先看最新版本。
 * - devtools 只在开发环境开启（默认如此）；action 名按「领域/动作」命名，方便在 DevTools 里查。
 * - 服务端渲染 / RSC：模块级单例会把 A 用户的数据漏给 B 用户，改用 createStore + Context 每个请求一份（区块四，33 题，待新增）。
 * - 测试：官方测试指南在 __mocks__/zustand.ts 里记下每个 store 的 getInitialState()，每个测试后 setState(initialState, true)；本课在 beforeEach 里做同样的事
 *   并清空 localStorage。persist 下 getInitialState() 返回水合前的初始值（esm/middleware.mjs:378，测试覆盖）（34 题，待新增）。
 * - Vue 侧的 persistPlugin 是演示实现：生产用社区插件（如 pinia-plugin-persistedstate，本仓库未安装）；服务端渲染每个请求 createPinia()，
 *   把 state 序列化进页面时要转义（Pinia SSR 页「you should escape the state for security reasons」）。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - zustand v4：useStore(selector, shallow) 第二个参数传相等函数；v5 迁移指南「The create function in v5 does not support customizing equality function」，
 *   改用 useShallow，或 zustand/traditional 的 createWithEqualityFn。v4 还有默认导出（v5「Drop default exports」）。v4 persist 会在创建 store 时把初始 state
 *   写进存储，v5（以及 4.5.5）起不再这样。zustand 5.0.0 发布于 2024-10-14，4.5.7 至今仍是下载最多的单个版本。
 * - 经典 Redux：手写 action 常量 + switch reducer + combineReducers + createStore + connect(mapStateToProps)。createStore 从 redux 4.2.0 起标 @deprecated
 *   （只有编辑器里的删除线，不会被移除，legacy_createStore 是没有删除线的别名）；react-redux 官方「We recommend using the React-Redux hooks API as the default
 *   approach」，connect 仍然支持。react-redux 9.1.0 起有 useSelector.withTypes<RootState>()，之前要自己声明带类型的 Hook。
 * - React 19 之前用 <Context.Provider value>（createContext 页：「SomeContext.Provider is a legacy way to provide the context value before React 19」）；
 *   更早的 class 组件 legacy context（contextTypes / getChildContext）在 React 19 已移除（React 19 升级指南）。
 * - Vue：Vuex（维护模式）→ Pinia；Pinia 2 → 3「is a boring major release with no new features. It drops deprecated APIs」，只支持 Vue 3。
 *
 * 九、新动向【尝鲜】
 * - pinia 4：2026-07-14 首发（最新 4.0.3），发布说明「Pinia 4 contains only technically breaking changes: ESM only and upgrading @vue/devtools-api which now must
 *   be installed alongside pinia」（另要求 TypeScript ≥ 5.6），store 的写法不变；已占 pinia 下载的 18.6%。发布不满 3 个月，本课仍用 3.0.4（规格 §4）。
 * - zustand 的 unstable_ssrSafe 中间件：服务端渲染时调用 set 直接抛错（「Cannot set state of Zustand store in SSR」），名字带 unstable_，只作了解。
 *
 * 十、动手练习
 * 1. 去掉 CartSummary 的 useShallow，观察开发环境控制台的两条报错；再改成两个原子 selector（件数、金额各一个）。
 *    可断言：改完后只勾选礼品包装，合计组件的渲染次数不变（与 useShallow 版相同）。
 * 2. 把 cartStore 拆成 cartSlice + prefSlice（giftWrap 放进 prefSlice），devtools / persist 只包在合并后的 store 外面。
 *    可断言：Example.test.tsx 全部通过；localStorage 里的内容与拆分前一致。
 *
 * 参考（2026-09-17 核对；zustand / pinia / Redux / react.dev / vuejs.org 取自各自文档仓库的原文）：
 * - zustand（docs 5.x）：learn/getting-started/introduction、learn/guides/prevent-rerenders-with-use-shallow、learn/guides/advanced-typescript、
 *   learn/guides/beginner-typescript、learn/guides/flux-inspired-practice、learn/guides/slices-pattern、learn/guides/immutable-state-and-merging、
 *   learn/guides/initialize-state-with-props、learn/guides/nextjs、learn/guides/testing、reference/migrations/migrating-to-v5、
 *   reference/middlewares/persist、reference/middlewares/devtools、reference/integrations/persisting-store-data；README（node_modules/zustand/README.md）
 * - react.dev：learn/passing-data-deeply-with-context、learn/scaling-up-with-reducer-and-context、reference/react/useContext、reference/react/createContext、
 *   reference/react/useReducer、reference/react/Profiler、blog/2024/04/25/react-19-upgrade-guide
 * - redux-toolkit.js.org：introduction/getting-started、api/createSlice、rtk-query/comparison；react-redux.js.org：api/hooks、using-react-redux/usage-with-typescript；
 *   redux.js.org：faq/General、api/createStore
 * - pinia.vuejs.org（3.x 文档）：introduction、core-concepts、core-concepts/state、actions、getters、plugins、outside-component-usage、ssr、
 *   cookbook/migration-v2-v3；4.x 文档 core-concepts/state（flush 的提示）；pinia 4 CHANGELOG
 * - vuejs.org：guide/scaling-up/state-management、guide/scaling-up/ssr；blog.vuejs.org/posts/vue-3-4
 * - 源码：zustand 5.0.15 esm/vanilla.mjs、esm/react.mjs、esm/react/shallow.mjs、esm/vanilla/shallow.mjs、esm/middleware.mjs；pinia 3.0.4 dist/pinia.mjs、pinia.d.ts；
 *   react-dom 19.2.8 cjs/react-dom-client.development.js（getSnapshot should be cached :8130、Maximum update depth exceeded :4625、commitProfiler :13539）
 * - ③ npm：api.npmjs.org 周下载与分版本下载（2026-09-10 至 09-16）、npm view zustand / pinia / @reduxjs/toolkit / react-redux / redux time
 */
import { CartDemo } from './CartDemo'
import { ContextReducerCart } from './ContextReducerCart'
import { ReduxToolkitCard } from './ReduxToolkitCard'
import { ScopedStoreDemo } from './ScopedStoreDemo'
import { StoreApiDemo } from './StoreApiDemo'

export default function Example() {
  // 五个区块：主线 store（一、二）→ 并排的 React 内置方案（三）→ 每实例一份 store（四）→ Redux Toolkit 对照（五）
  return (
    <div className="stack">
      <CartDemo />
      <StoreApiDemo />
      <ContextReducerCart />
      <ScopedStoreDemo />
      <ReduxToolkitCard />
    </div>
  )
}
