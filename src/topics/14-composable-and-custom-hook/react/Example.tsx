/**
 * 主题：14. 自定义 Hook 与 Composable（逻辑复用、订阅外部数据源、接收回调、防抖）
 * 适用版本：React 19.2 · @types/react 19.2 · eslint-plugin-react-hooks 7 · Vue 3.5
 * 最后核对：2026-09-17
 * 前置主题：10 useEffect 与生命周期、12 useRef、09 派生值、11 请求状态
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 入口）· useWindowWidth.ts【主线：useSyncExternalStore】· useWindowWidthEffect.ts（并排）·
 *          WindowWidthDemo.tsx（区块一）· useInterval.ts + IntervalDemo.tsx（区块二）·
 *          useDebouncedValue.ts + DebouncedSearchDemo.tsx（区块三）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 自定义 Hook 是名字以 use 开头、内部调用其他 Hook 的普通函数；共享的是有状态的逻辑，不是状态本身，每次调用完全独立【主流】。
 * - Hooks 规则：只在组件或自定义 Hook 的顶层调用，不放进条件、循环、事件处理函数、try / catch 里；React 按调用顺序把 Hook 对应到内部的状态槽，
 *   顺序一变就报「Rendered more / fewer hooks」。use 前缀是 lint 识别 Hook 的依据【主流】。
 * - 订阅 React 之外的可变数据源（窗口尺寸、在线状态、第三方 store）官方首选 useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
 *   【主流·18.0 起】：subscribe 引用要稳定，getSnapshot 在数据没变时要返回同一个值；useEffect + setState 手写订阅是 18 之前的写法。
 * - 手写防抖：useEffect 里 setTimeout、cleanup 里 clearTimeout，依赖 [value, delay]；请求只依赖防抖后的值【主流】。
 * - 自定义 Hook 接收回调时，用 useEffectEvent 包一层再在 Effect 里调用，回调就不必进依赖【较新·19.2 起】。
 *
 * 二、核心概念（React）
 * 1. 定义【主流】（reusing-logic-with-custom-hooks 页）：「Custom Hooks let you share stateful logic, not state itself」，
 *    「Each call to a Hook is completely independent from every other call to the same Hook.」要共享状态本身，就提升状态再往下传。
 *    命名：「Hook names must start with use followed by a capital letter」（eslint-plugin-react-hooks 7.1.1 的 isHookName 实际是
 *    /^use[A-Z0-9]/，单独一个 use 也算）；不调用 Hook 的函数不要用 use 开头（官方示例把 useSorted 改名 getSorted）。
 *    「The code inside your custom Hooks will re-run during every re-render of your component」，所以 Hook 也必须是纯的。
 * 2. Hooks 规则【主流】（rules-of-hooks 页，6 条不允许）：条件或循环里、条件 return 之后、事件处理函数里、class 组件里、
 *    传给 useMemo / useReducer / useEffect 的函数里、try / catch / finally 里。违反时的报错（react-dom 19.2.8，本课测试断言过）：
 *    多调用一个 Hook →「Rendered more hooks than during the previous render.」；少一个 →「Rendered fewer hooks than expected.
 *    This may be caused by an accidental early return statement.」。例外是 use()（React 19，32 题待新增）：use 页原文
 *    「Despite its name, use is not a Hook. Unlike Hooks, it can be called inside loops and conditional statements like if.」
 * 3. 订阅外部数据源 → useSyncExternalStore【主流·18.0 起】（区块一主线）。you-might-not-need-an-effect 页原文：
 *    「Although it's common to use Effects for this, React has a purpose-built Hook for subscribing to an external store that is preferred
 *    instead. Delete the Effect and replace it with a call to useSyncExternalStore」。useSyncExternalStore 页把它的场景写成两类：
 *    「Third-party state management libraries that hold state outside of React」和「Browser APIs that expose a mutable value and events to
 *    subscribe to its changes」，并提醒「When possible, we recommend using built-in React state」—— 不是外部数据源就别用它。
 *    React 18 发布博客的说法：「It removes the need for useEffect when implementing subscriptions to external data sources」，
 *    同一篇还注明它「is intended to be used by libraries, not application code」；learn 页和参考页又都用应用里的 useOnlineStatus 示范它。
 *    两层意思都要说：库作者必用；应用里订阅浏览器 API 也是官方示范的写法。zustand 5 与 TanStack Query 5 内部都直接调用它（16 / 30 题）。
 * 4. 三个参数的要求【主流】（useSyncExternalStore 页 + react-dom 19.2.8 源码）：
 *    - getSnapshot：「While the store has not changed, repeated calls to getSnapshot must return the same value.」开发环境 React 会连调两次比较，
 *      不同就 console.error「The result of getSnapshot should be cached to avoid an infinite loop」；每次返回新对象还会不停重渲染，
 *      最后抛「Maximum update depth exceeded」（测试覆盖）。快照要不可变：数据变了返回新快照，没变返回缓存的旧快照。
 *    - subscribe：「If a different subscribe function is passed during a re-render, React will re-subscribe to the store」，写在组件外，
 *      或者用 useCallback 包住（区块一实验 + 测试）。
 *    - getServerSnapshot：只在服务端渲染和 hydration 时用，「If you omit this argument, rendering the component on the server will throw
 *      an error」（报「Missing getServerSnapshot」，测试覆盖）；服务端给不出有意义的值时也可以故意省略，让这部分在客户端渲染。
 * 5. 为什么不用 useEffect + setState 订阅（并排【18 之前的写法 · 简单场景仍可用】）：并发渲染（startTransition 等非阻塞更新）时，
 *    useSyncExternalStore 会在提交前再调一次 getSnapshot，值变了就改成阻塞更新从头再渲染一次，保证「every component on screen is reflecting the
 *    same version of the store」（Caveats 原文；react-dom 源码里是 isRenderConsistentWithExternalStores 这道检查），社区把「同一屏读到不同版本」
 *    叫 tearing；Effect 版没有这道检查，也没法提供服务端快照。纯同步更新的普通页面上两者表现一样（区块一两个数字始终相同）。
 *    官方迁移示范：useOnlineStatus 内部从 Effect 换成 useSyncExternalStore 时「you didn't need to change any of the components」—— 这正是抽成
 *    自定义 Hook 的价值。
 * 6. 接收回调【较新·19.2 起】（区块二）：官方原文「Wrap event handlers received by custom Hooks into Effect Events」（示例 useChatRoom）。
 *    useEffectEvent 的约束（参考页 Caveats）：只能在 Effect 或别的 Effect Event 里调用，不要在渲染时调用、不要传给别的组件或 Hook；
 *    「Do not use useEffectEvent to avoid specifying dependencies」；它的函数身份每次渲染都会变。React 18 项目用 latest ref 模式（26 题）。
 * 7. 返回值约定【主流】：返回函数时包 useCallback（useCallback 页「Optimizing a custom Hook」：「it's recommended to wrap any functions that it
 *    returns into useCallback」，让调用方能做优化，17 题）；返回元组模仿 useState，返回对象方便以后加字段。
 *    useDebugValue(value, format?) 给 DevTools 显示标签，官方建议只给共享库里、内部结构复杂的 Hook 加（useWindowWidth 里有一行示范）。
 * 8. 防抖（区块三）：useDebouncedValue 是自己实现的（react 包没有内置防抖 Hook），它同步的是「一个定时器」这种副作用，所以用 useEffect。
 *    请求在 Effect 里发、setState 都在 Promise 回调里，loading 从「结果属于哪个关键词」派生 —— 不在 Effect 体里同步 setLoading(true)
 *    （set-state-in-effect 规则页把「Setting loading state synchronously」列为常见违例，推荐「calculate it during rendering」）。
 * 9. 不要造「生命周期」Hook：官方原文「Avoid creating and using custom "lifecycle" Hooks」，点名 useMount / useEffectOnce / useUpdateEffect ——
 *    lint 只检查直接的 useEffect 调用，包一层之后漏写的依赖就查不出来了。
 *
 * 三、Vue 对照
 * - composable：「a function that leverages Vue's Composition API to encapsulate and reuse stateful logic」；以 use 开头是约定
 *   （「It is a convention to name composable functions with camelCase names that start with "use"」），不是 lint 的依据。
 *   同样「共享逻辑、不共享状态」：每个组件调用 useMouse() 都得到自己的一份 x / y。
 * - 调用限制不同：Vue 官方 FAQ 原文「Invokes setup() or <script setup> code only once」「Composition API calls are also not sensitive to call order
 *   and can be conditional」；但 composable「should only be called in <script setup> or the setup() hook. They should also be called
 *   synchronously」—— 原因是要找到当前组件实例来注册生命周期钩子、绑定 watcher。在 setTimeout 里调用会被警告
 *   「onMounted is called when there is no active component instance」（Vue 侧测试覆盖）；<script setup> 里 await 之后例外，编译器会恢复实例。
 * - 订阅外部数据源：Vue 没有 useSyncExternalStore 这类 API，官方 useMouse 示例就是 onMounted 加监听、onUnmounted 移除、值写进 ref；
 *   服务端渲染时「perform DOM-specific side effects in post-mount lifecycle hooks, e.g. onMounted()」。
 * - 入参：MaybeRefOrGetter + toValue()（「toValue() is an API added in 3.3」）；要对入参做响应式副作用，就 watch 它或在 watchEffect 里调用 toValue。
 * - 清理：watch 回调里的 onWatcherCleanup（3.5 起）或第三个参数 onCleanup；setup 里同步创建的 watcher 随组件卸载自动停止，停止时清理函数也会执行
 *   （@vue/reactivity 3.5.42 的 effect.onStop），不用另写 onUnmounted（Vue 侧测试覆盖）。
 * - 回调不会过期：setup 只执行一次，回调读 ref 总是当前值，不需要 useEffectEvent；定时器 id 放 setup 里的 let 变量就行。
 * - 返回值：「return a plain, non-reactive object containing multiple refs」，方便解构；useDebugValue 没有对应物（Vue DevTools 直接显示 setup 的状态）。
 * - 生态：VueUse 的 useWindowSize、useEventListener、refDebounced / watchDebounced / useDebounceFn。
 *
 * 四、关键区别（每条写明前提）
 * 1. 「顶层、顺序稳定」是 React Hooks 的限制（16.8 起至今）；Vue composable 不受调用顺序限制，限制来自「要有活跃的组件实例」。
 * 2. 重复执行：React 组件和 Hook 每次渲染都重新执行（依赖数组、过期闭包、useEffectEvent 都由此而来）；Vue 的 setup 只执行一次，返回 Ref 容器。
 * 3. 订阅外部数据源：React 18+ 主线 useSyncExternalStore（并发渲染下保证一致、支持服务端快照）；Vue 用 ref + onMounted，响应式系统本身就是订阅。
 * 4. 服务端渲染：React 靠 getServerSnapshot；Vue 靠「DOM 副作用放 onMounted」。代价不同：Vue 这种写法纯客户端也会先渲染一次「未知」（测试覆盖），
 *    React 的 useSyncExternalStore 在纯客户端渲染时直接读 getSnapshot。
 * 5. 定时器 id 放哪：React 放 Effect 闭包（配 cleanup）或 useRef；Vue 放 setup 作用域的 let。Vue 写法原样搬进 React 组件函数体会失效（区块三 + 测试），
 *    eslint-plugin-react-hooks 7 的 react-hooks/immutability 会拦下来（2026-09-17 实测）。
 *
 * 五、常见追问与回答要点
 * - 两个组件调同一个 Hook，state 互通吗？不互通，各自一份（区块一卸载面板 B 的实验）。要共享就提升状态或用 Context / store（15 / 16 题）。
 * - 为什么不能在条件里调 Hook？状态槽按调用顺序对应，顺序变了就对错位；React 会报「Rendered more / fewer hooks」。use() 不是 Hook，可以条件调用。
 * - useSyncExternalStore 和 useEffect 订阅有什么区别？前者专为外部数据源设计：并发渲染下保证同一屏读到同一个快照、支持服务端快照、订阅时机由 React 管；
 *   后者要自己同步到 state。
 * - getSnapshot 为什么必须稳定？每次返回新对象，React 就认为数据一直在变，开发环境先警告「should be cached」，然后无限重渲染。
 * - 服务端快照是什么？服务端渲染和 hydration 时用的值，客户端与服务端必须一致；省略会让服务端渲染报错。
 * - 自定义 Hook 接收回调怎么处理依赖？useEffectEvent 包一层（19.2 起）；18 用 latest ref（26 题）。返回的函数要不要 useCallback？官方建议包。
 * - 为什么不写 useMount / useEffectOnce？它们绕开了 lint 的依赖检查，也不符合「Effect 是同步」的思路。
 * - 防抖和节流？防抖是停手 delay 后执行一次（搜索联想、校验）；节流是每 delay 最多执行一次（滚动、拖拽）。真实项目常用 ahooks（useDebounce / useDebounceFn）、
 *   lodash.debounce；面试仍考手写。
 * - React 17 项目能用 useSyncExternalStore 吗？装 use-sync-external-store，从 'use-sync-external-store/shim' 导入（该包的开发版提示原文：
 *   「If you wish to support React 16 and 17, import from 'use-sync-external-store/shim' instead.」）。
 *
 * 六、易错点
 * - 把 Vue 的 let timer 搬进 React 组件函数体：每次渲染都是新变量，防抖失效（区块三）。
 * - 防抖忘了 clearTimeout：只是整体延后，请求一次没少。
 * - getSnapshot 每次返回新对象（例如 () => ({ width: window.innerWidth })）：死循环。要么返回原始值，要么缓存快照。
 * - subscribe 写成组件里的内联函数：每次渲染都退订再重订。
 * - 在 Effect 体里同步 setLoading(true)：set-state-in-effect 报错，还多一轮渲染；改成派生。
 * - 自定义 Hook 把收到的回调放进依赖：父组件每次渲染都重建订阅 / 定时器（区块二的「干扰」）。
 * - 以为依赖写 [] 就只跑一次：开发环境 StrictMode 会多跑一轮 setup + cleanup（区块一实验里计数从 2 开始）。
 * - 不调用 Hook 的工具函数也起名 useXxx。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 服务端渲染 / RSC 项目里订阅浏览器 API 必须提供 getServerSnapshot（本课返回 null，组件显示「未知」）；Effect 版的 useState(() => window.innerWidth)
 *   在服务端直接报错（33 题，待新增）。
 * - resize 这类高频事件在真实项目里常配合节流；本课没有做。
 * - 请求类 Hook 生产用 TanStack Query：防抖后的关键词放进 queryKey，缓存、竞态、重试由库处理（30 题）；手写至少要派生 loading、abort 过期请求（11 / 27 题）。
 * - 演示简化：搜索用共享 mockApi（直接 throw，没有 HTTP 状态码）；区块二的计数器、区块一的订阅计数只为演示。
 * - 测试自定义 Hook：Testing Library 的 renderHook，或像本课这样写一个小组件；定时器用 fake timers（34 题，待新增）。
 * - 现成库：ahooks、usehooks-ts（useEventListener 等）、VueUse；自己写的通用 Hook 加类型、加 useDebugValue、返回函数包 useCallback。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - useEffect + setState 手写订阅：React 18 之前只有这一种写法，存量代码最多。本课放在并排（useWindowWidthEffect.ts），标「18 之前的写法 · 简单场景仍可用」，不算错误写法。
 * - React 16 / 17 里用 use-sync-external-store/shim（npm 包 use-sync-external-store，peer 支持 react ^16.8 到 ^19；有原生 API 时 shim 直接用原生的）。
 * - 18 之前接收回调：latest ref 模式（渲染后在 Effect 里 ref.current = callback，26 题）；19.2 起用 useEffectEvent。
 * - Vue 3.3 之前没有 toValue，composable 入参要手写 unref / isRef 判断。
 *
 * 九、新动向【尝鲜】
 * - 本题没有专属的尝鲜项。React Compiler 对自定义 Hook 的自动记忆化见 17 题；use(promise) 作为内置数据获取的方向见 32 题（待新增），
 *   官方原话是「We're still working out the details」。
 *
 * 十、动手练习
 * 1. 仿照 useWindowWidth 写 useOnlineStatus（navigator.onLine + online / offline 事件，服务端快照返回 true）。
 *    可断言：派发 offline 事件后返回 false；重渲染多次 subscribe 只调用一次。
 * 2. 给 useDebouncedValue 加一个 leading 选项（第一次立即生效，之后防抖）。可断言：fake timers 下首个值立刻出现，后续值停手 delay 后才出现。
 *
 * 参考（2026-09-17 核对，react.dev / vuejs.org 取自官方文档仓库原文）：
 * - react.dev：learn/reusing-logic-with-custom-hooks、learn/you-might-not-need-an-effect#subscribing-to-an-external-store、
 *   reference/react/useSyncExternalStore、reference/rules/rules-of-hooks、reference/react/use、reference/react/useEffectEvent、
 *   reference/react/useDebugValue、reference/react/useCallback#optimizing-a-custom-hook、
 *   reference/eslint-plugin-react-hooks/lints/set-state-in-effect、blog/2022/03/29/react-v18、blog/2025/10/01/react-19-2
 * - vuejs.org：guide/reusability/composables、guide/extras/composition-api-faq（Comparison with React Hooks，Vue 方视角）、
 *   guide/essentials/watchers、api/reactivity-utilities#tovalue、api/reactivity-core#onwatchercleanup
 * - 源码：react-dom 19.2.8 cjs/react-dom-client.development.js（mountSyncExternalStore、checkIfSnapshotChanged、isRenderConsistentWithExternalStores、
 *   Rendered more / fewer hooks）、cjs/react-dom-server*.js（Missing getServerSnapshot）；eslint-plugin-react-hooks 7.1.1（isHookName）；
 *   @vue/reactivity 3.5.42（watch 的 onStop 清理）
 * - ③ npm：use-sync-external-store 1.7.0；生态：ahooks.js.org、vueuse.org、usehooks-ts.com（只作线索）
 */
import { DebouncedSearchDemo } from './DebouncedSearchDemo'
import { IntervalDemo } from './IntervalDemo'
import { WindowWidthDemo } from './WindowWidthDemo'

export default function Example() {
  return (
    <div className="stack">
      {/* 三类最常见的自定义 Hook：订阅外部数据源、接收回调的定时器、跨时间的防抖 */}
      <WindowWidthDemo />
      <IntervalDemo />
      <DebouncedSearchDemo />
    </div>
  )
}
