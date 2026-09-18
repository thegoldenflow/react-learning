/**
 * 主题：26. 过期闭包（stale closure）—— 修法优先级：函数式更新 → 写对依赖 → useEffectEvent（主线）→ latest ref（并排）
 * 适用版本：React 19.2（useEffectEvent 19.2.0 起）· eslint-plugin-react-hooks 7.1（6.1.0 起识别 useEffectEvent）· Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：03 state、10 useEffect（场景二：setInterval 的三种修法）、12 useRef、14 自定义 Hook（useInterval 用 useEffectEvent 接收回调）、
 *          23 渲染与快照、24 批处理与函数式更新
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注；latest ref 按 AUDIT-ROUND2 §3.7 标「社区惯用法」，作并排、不作主线
 * 本课文件：Example.tsx（讲解 + 入口）· DelayedSaveDemo.tsx（区块一）· ListenerDemo.tsx（区块二）· PollingDemo.tsx（区块三，主线 useEffectEvent）·
 *          DependencyLabs.tsx（区块四）· LogPanel.tsx（日志面板）· demoKit.ts（日志 store、自动清理的 setTimeout、时间常量）·
 *          Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 过期闭包：每次渲染的 props、state 都是那次渲染的常量，回调被交给 setTimeout / addEventListener / setInterval / Promise、执行得比那次渲染晚，
 *   读到的就是旧值。这是快照设计，不是 bug（「Event handlers created in the past have the state values from the render in which they were created」）【主流】。
 * - 修法按顺序想：① 由旧算新 → 函数式更新 setX(x => …)；② 值变了就该重跑 → 老实写进依赖；③ 要读最新值、又不想因为它重跑 Effect → useEffectEvent
 *   【较新·19.2 起】；④ React 18 / 19.0 / 19.1，或 Effect 之外的延迟回调 → latest ref（社区惯用法）。还有两条让依赖合法消失的路：交互逻辑搬回事件处理函数，
 *   对象 / 函数移进 Effect 或只依赖原始值【主流】。
 * - useEffectEvent 的规矩：只能在 Effect（含 useLayoutEffect、useInsertionEffect）或其他 Effect Event 里调用，不能渲染时调用、不能传给组件或 Hook；
 *   不能拿来逃避依赖；身份每次渲染都变；它不是响应式值、不写进依赖。lint 要 eslint-plugin-react-hooks 6.1.0 起才认识（本项目 7.1.1）【较新·19.2 起】。
 * - exhaustive-deps 报「缺少依赖」时，说的就是过期闭包；关掉它等于隐藏 bug，官方建议把这条 lint 当编译错误对待【主流】。
 * - Vue：setup 只执行一次，回调里现读 .value，默认不会过期；但手动拷出来的值、解构 reactive 得到的值一样会过期。
 *   watch 只追踪 source，回调里读到的值不触发重跑 —— 概念上对应 useEffectEvent【主流】。
 *
 * 二、核心概念（React）
 * 1. 根因：渲染快照【主流】。state-as-a-snapshot：「A state variable's value never changes within a render, even if its event handler's code is asynchronous.」
 *    「The state stored in React may have changed by the time the alert runs, but it was scheduled using a snapshot of the state at the time the user
 *    interacted with it!」useState 页 Troubleshooting：「Calling the set function does not change state in the running code」。props 同理。
 *    闭包活得比创建它的那次渲染长，就会「过期」；react.dev 上 stale closures 这个词出自 exhaustive-deps lint 页：「When a value referenced inside these hooks
 *    isn't included in the dependency array, React won't re-run the effect or recalculate the value when that dependency changes. This causes stale closures
 *    where the hook uses outdated values.」
 * 2. 四个现场【主流】：事件处理函数里的 setTimeout（区块一，没有 Effect 参与）；Effect 注册的监听器（区块二）；Effect 里的 setInterval / 轮询（区块三）；
 *    同一个事件里多次 setX(x + 1)（24 题）。
 *    JSX 事件为什么不过期：React 在根节点统一派发，派发时从 DOM 节点上读最近一次提交的 props 里的处理函数（react-dom 19.2.8 getListener，
 *    react-dom-client.development.js:3274-3279；提交时 commitUpdate 写入，:22167-22170）。前提是没被缓存 —— useCallback 页：「During subsequent renders,
 *    it will either return an already stored fn function from the last render (if the dependencies haven't changed)」，漏写依赖的 useCallback 一样过期（区块二最后一行）。
 * 3. 依赖数组决定闭包什么时候换新【主流】：依赖变了 → 先执行上一轮 cleanup → 再用新一次渲染的闭包执行 setup；[] 一直用挂载那次渲染的闭包，直到卸载。
 *    依赖不是挑出来的：lifecycle-of-reactive-effects「All values inside the component (including props, state, and variables in your component's body) are
 *    reactive.」removing-effect-dependencies「You don't choose what to put on that list. The list describes your code. To change the dependency list, change the code.」
 * 4. 修法 ① 函数式更新【主流】：Effect 不再读 state，依赖自然消失（removing-effect-dependencies「Notice how your Effect does not read the messages variable at all
 *    now.」）。只解决「由旧算新」：更新函数的参数拿不出来发请求（区块一「保存」组）。也不是万能药 —— useState 页「In most cases, there is no difference between these
 *    two approaches.」「However, if you do multiple updates within the same event, updaters can be helpful. They're also helpful if accessing the state variable
 *    itself is inconvenient」。
 * 5. 修法 ② 写对依赖【主流】：读到的总是新值，代价是每次变化都 cleanup + setup。useEffect 页的计数器例子：「specifying count as a dependency always resets the interval」。
 *    定时器、DOM 监听器可以接受（区块二 ②、区块三 ②）；WebSocket 连接、播放器、第三方 SDK 实例往往不行。
 * 6. 让依赖合法消失【主流】（区块四，removing-effect-dependencies 的几个小节）：
 *    - 该不该是 Effect：「The problem here is that this shouldn't be an Effect in the first place.」交互触发的逻辑放进事件处理函数（4a）；
 *    - 一个 Effect 做了两件事：拆开，「Each Effect should represent an independent synchronization process.」；
 *    - 对象 / 函数依赖：「This problem only affects objects and functions. In JavaScript, each newly created object and function is considered distinct from all the
 *      others.」把它移进 Effect，或者只依赖从中读出的原始值（4b）；
 *    - 可变值不能当依赖：lifecycle-of-reactive-effects「A mutable value like ref.current or things you read from it also can't be a dependency.」「The ref object
 *      returned by useRef itself can be a dependency, but its current property is intentionally mutable.」改 ref 不触发渲染，React 没有新的依赖数组可比（4c）。
 * 7. 修法 ③ useEffectEvent【较新·19.2.0 起】（本课主线示例：区块二 ③、区块三 ③）。
 *    - 定位：「useEffectEvent is a React Hook that lets you separate events from Effects.」回调「always accesses the latest committed values from render at the time
 *      of the call」；learn 页「Effect Events are not reactive and must be omitted from dependencies.」「Effect Events let you "break the chain" between the reactivity
 *      of Effects and code that should not be reactive.」
 *    - 在哪调用：「You can call this function inside useEffect, useLayoutEffect, useInsertionEffect, or from within other Effect Events in the same component.」
 *    - 参考页 Caveats 四条：「useEffectEvent is a Hook, so you can only call it at the top level of your component or your own Hooks.」
 *      「Effect Events can only be called from inside Effects or other Effect Events. Do not call them during rendering or pass them to other components or Hooks.」
 *      「Do not use useEffectEvent to avoid specifying dependencies in your Effect's dependency array. This hides bugs and makes your code harder to understand.」
 *      「Effect Event functions do not have a stable identity. Their identity intentionally changes on every render.」
 *      为什么故意不稳定：「The non-stable identity acts as a runtime assertion: if your code incorrectly depends on the function identity, you'll see the Effect
 *      re-running on every render, making the bug obvious.」
 *    - 什么时候用：19.2 博客「You should use useEffectEvent for functions that are conceptually "events" that happen to be fired from an Effect instead of a user
 *      event」。本课的轮询 tick、监听器回调都属于这一类；Effect 真正要同步的东西（连接、定时器本身）仍留在 Effect 的依赖里。
 *    - 实现（react-dom 19.2.8）：mountEvent / updateEvent（react-dom-client.development.js:8676-8698）每次渲染返回一个新的包装函数，所有包装函数共用
 *      一个 ref、调用时执行 ref.impl（测试：身份每次都变，旧的包装函数也转发到最新回调）；更新渲染时新回调先排队，这次提交的第一步
 *      （commitBeforeMutationEffects，:13874-13889）才写进 ref.impl —— 早于这次提交里的 useInsertionEffect、useLayoutEffect、useEffect（测试：insertion / layout
 *      effect 里读到的已是新值）；渲染被丢弃就不会写入（源码：写入只发生在提交阶段）。渲染期调用抛「A function wrapped in useEffectEvent can't be called during
 *      rendering.」（:8680-8684，生产环境是错误码 440，测试覆盖）；运行时只拦渲染期，在 onClick 里调用照样执行（测试覆盖；lint 会报 error，见六）。
 *    - 【已知 bug · 19.2.x】memo()（不带比较函数）与 forwardRef 组件在那一步被跳过（:13890-13892），Effect Event 一直调用第一次渲染的回调（测试覆盖）。
 *      19.3.0 修复（CHANGELOG「Ensure useEffectEvent reads latest values in forwardRef and memo() components」#34831；issue #34818 的标题就是
 *      「Bug: Stale closures with useEffectEvent」）。19.2 项目里：把 Effect Event 放在普通函数组件里（memo 组件可以拆一个内层组件），或者暂用 latest ref。
 *    - 自定义 Hook 接收回调时包一层：reusing-logic-with-custom-hooks 的 const onMessage = useEffectEvent(onReceiveMessage)（14 题 useInterval）。
 *    - TS：useEffectEvent<T extends Function>(callback: T): T（@types/react 19.2.18 index.d.ts:1786-1791，@version 19.2.0），返回值和回调同类型，没有 deps 参数。
 *    - 和 useCallback 的分工：useCallback 缓存一个函数（依赖没变就返回同一个），用来传给子组件、放进依赖；useEffectEvent 返回的函数读最新值、身份不稳定、只在本组件的
 *      Effect 里用。Troubleshooting：「If you need a callback for event handlers or to pass to children, use a regular function or useCallback instead.」
 * 8. 并排 ④ latest ref【社区惯用法】（区块一、区块三 ④，10 题场景二的修法三）。
 *    - 官方态度：react.dev 没有给这个模式命名（全站没有 useLatest / latestRef）；最接近的是 referencing-values-with-refs 的挑战题「Read the latest state」：
 *      「Usually, this behavior is what you want in an app. However, there may be occasional cases where you want some asynchronous code to read the latest version of
 *      some state.」答案「you can keep the latest input text in a ref」，在事件处理函数里 setText 的同时写 textRef.current。
 *    - 同步写在哪：a）事件处理函数里跟 setState 一起写（官方挑战题；没有窗口期，前提是值只在少数几个你控制的处理函数里变）；b）不写依赖数组的 useEffect（本课；lint 干净；
 *      有窗口期 —— 本组件的 layout effect、子组件的 Effect 都先于它执行，读到旧值，测试覆盖；同一个处理函数里 setX 之后立刻读 ref 也还是旧值，除非用 flushSync ——
 *      离散事件里 flushSync 包住的更新会同步跑完被动 Effect，测试覆盖）；c）useLayoutEffect（缩小窗口）；d）渲染期直接写 ref.current = value（不要这样写，见六、八）。
 *    - 19.2 之后还需要吗：Effect 里的场景交给 useEffectEvent；仍需要它的是 React 18 / 19.0 / 19.1（③ npm 2026-09-18 抓取的上周下载：这三者合计 30.45%，其中 18.x 24.71%；
 *      连同 17 及更早，没有 useEffectEvent 的共 34.18%；npm 下载量含 CI 与传递依赖，只作参考）、Effect 之外的延迟回调（区块一：useEffectEvent 不能在事件处理函数里用）、19.2.x 的 memo / forwardRef 组件。
 *    - 代价：ref 不参与渲染，改了不重渲染 —— 只能拿来「读」，不能拿来「显示」；同步那一步要自己维护。
 * 9. cleanup 不可省【主流】：每一轮 Effect 注册的监听器 / 定时器都是独立的闭包，不注销就一直活着 —— 监听器堆积（一次 Enter 记好几行）、过期定时器往回写、
 *    迟到的响应写进已卸载的组件。本课用 alive 标志丢弃迟到响应，真正的取消见 27 题。StrictMode 开发环境挂载时多跑一轮 setup + cleanup，专门检查这件事。
 *
 * 三、Vue 对照
 * - 为什么默认不过期【主流】：composition-api-faq 对比 React Hooks 时写「Variables declared in a React component can be captured by a hook closure and become "stale"
 *   if the developer fails to pass in the correct dependencies array.」Vue 这边「Invokes setup() or <script setup> code only once. This makes the code align better
 *   with the intuitions of idiomatic JavaScript usage as there are no stale closures to worry about.」ref 的原理（Why Refs?）：「you can pass refs into functions
 *   while retaining access to the latest value and the reactivity connection」。同一节的 Note「some of the above issues that are related to memoization can be resolved
 *   by the upcoming React Compiler」—— 这句写于编译器发布前（1.0 已于 2025-10 发布），而且只说记忆化相关的问题。
 * - Vue 也会「过期」【主流】（Vue 区块一，测试覆盖）：手动 const snapshot = x.value；解构 reactive —— Limitations of reactive() 第 3 条「Not destructure-friendly: when we
 *   destructure a reactive object's primitive type property into local variables, or when we pass that property into a function, we will lose the reactivity connection」，
 *   修法是 toRefs；3.4 及以前解构 props —— 「In version 3.4 and below, foo is an actual constant and will never change.」3.5 起编译器把解构变量的访问改写成 props.foo，
 *   回调里读到的是那一刻的 prop。把解构出来的 prop 直接传给 watch：文档说「Vue's compiler will catch such cases and throw a warning」，3.5.42 实测 compileScript 直接抛错
 *   「"count" is a destructured prop and should not be passed directly to watch(). Pass a getter () => count instead.」，编译失败。
 * - watch 与 watchEffect【主流】（Vue 区块四）：「watch only tracks the explicitly watched source. It won't track anything accessed inside the callback.」——
 *   回调里读最新值、不因为它重跑，概念上对应 useEffectEvent（@vue/reactivity 3.5.42 reactivity.cjs.js:1913-1931 先 effect.run() 再调用 cb；:263-277 run 结束时已恢复 activeSub，
 *   所以回调里的读取不登记依赖）；
 *   「watchEffect … automatically tracks every reactive property accessed during its synchronous execution.」—— 对应「读到的都写进依赖」。
 * - 清理【主流】：onWatcherCleanup（3.5 起，「must be called during the synchronous execution」）或回调第三个参数 onCleanup；「Watchers declared synchronously inside
 *   setup() or <script setup> are bound to the owner component instance, and will be automatically stopped when the owner component is unmounted.」（Vue 区块三）。
 * - 事件监听【主流】：onMounted 注册一次、onBeforeUnmount 移除（「When this hook is called, the component instance is still fully functional.」）。模板事件 Vue 直接绑在
 *   元素上（一个 invoker 函数）；编译器通常把处理函数缓存起来（17 题），缓存的函数执行时现读 .value，所以不会过期；处理函数真的换了时，patchEvent 只把
 *   invoker.value 换成新的、不重新注册（runtime-dom.cjs.js:641-659）—— 相当于框架替你做了 latest ref。
 * - 概念对应（不是 API 对应）：count.value++ ↔ 函数式更新；watch(source) ↔ 写对依赖；watch 回调里现读 ↔ useEffectEvent；ref 本身 ↔ latest ref。
 *   exhaustive-deps 在 Vue 没有对应物，原因是依赖自动收集：「there's no need to manually declare dependencies」。
 *
 * 四、关键区别（每条写明前提）
 * 1. 执行模型：React 函数组件每次渲染都重新执行函数体（Hooks 自 16.8 起一直如此）；Vue 3 的 setup 只执行一次，回调捕获的是 ref / reactive 本身。
 * 2. 修法：React 要在四种修法里选（useEffectEvent 19.2.0 起，18 / 19.0 / 19.1 用 latest ref）；Vue 默认现读，只有把值拷出来时才会过期。
 * 3. 依赖：React 手写依赖数组 + exhaustive-deps；Vue 的 watch 写显式 source、watchEffect 自动收集。
 * 4. 事件处理函数：两边的 JSX / 模板事件都用到最新的处理函数（React 派发时读 DOM 节点上的当前 props；Vue 换 invoker.value）。缓存：React 里被 useCallback 缓存且漏写依赖
 *    的处理函数会过期；Vue 编译器也缓存模板处理函数，但缓存的函数执行时现读 .value，不会过期。
 * 5. 可变值当依赖：React 写 ref.current 进依赖，改它不会重跑，别的原因重渲染时才补跑；Vue 用非响应式的值当 watch 的 source，一次都不会触发（两边都有测试）。
 * 6. 「读最新值但不当依赖」：React 19.2 用 useEffectEvent，只能在本组件的 Effect 里用；Vue 在 watch 回调、事件处理函数、定时器 / Promise 回调里读 .value
 *    不登记依赖，在 watchEffect、computed、模板里读就会成为依赖（本课 watchEffect 的坑，测试覆盖）。
 *
 * 五、常见追问与回答要点
 * - 是 bug 还是设计？设计。state-as-a-snapshot：「React keeps the state values "fixed" within one render's event handlers. You don't need to worry whether the state has
 *   changed while the code is running.」要读最新值是少数情况（referencing-values-with-refs 的挑战题称之为 occasional cases）。
 * - 函数式更新为什么能让依赖消失？Effect 不再读 count；更新函数排进队列，React 处理时把前面的更新都生效之后的值传进来。
 * - [count] 的代价？每次变化都 cleanup + setup：定时器被重置、监听器重注册；依赖变得比间隔还勤时定时器一直等不到触发（10 题）。
 * - useEffectEvent 和 useCallback 各管什么？见二-7。一句话：useCallback 为了「稳定」，useEffectEvent 为了「读最新且不当依赖」。
 * - 为什么不能传给子组件、为什么身份不稳定？它只属于同一个组件里的 Effect；DeepDive「Since you can only call them locally and cannot pass them to other components or include
 *   them in dependency arrays, a stable identity would serve no purpose, and would actually mask bugs.」
 * - 为什么 ref.current 写进依赖没用？见二-6，区块四 4c 能看到「改了不跑、别的原因重渲染时才补跑」。
 * - 19.2 之后还需要 latest ref 吗？Effect 里不需要；Effect 之外的延迟回调、React 18 / 19.0 / 19.1、19.2.x 的 memo / forwardRef 组件仍需要（二-8）。
 * - exhaustive-deps 报「缺少依赖」按什么顺序处理？① 这段逻辑该不该在 Effect 里（搬回事件处理函数）→ ② 由旧算新（函数式更新）→ ③ 对象 / 函数依赖（移进 Effect、
 *   依赖原始值）→ ④ 两件不相关的事（拆成两个 Effect）→ ⑤ 其余读到的值，变了就该重新同步的，老实写进依赖 → ⑥ 只有确认「不该触发重跑」的那部分逻辑，才抽成 useEffectEvent。
 *   不要 disable。
 * - React Compiler 能解决过期闭包吗？编译器文档没有这么说。它要求代码遵守 Rules of React（「The compiler relies on your code following these rules」），依赖照样要写对；
 *   「编译器自动插入 Effect 依赖」只在 2025-04 的 React Labs 博客里作为开发中的功能出现过（见九）。
 *
 * 六、易错点（lint 文案为 eslint-plugin-react-hooks 7.1.1 recommended 实测，2026-09-18）
 * - 以为只有 useEffect 才会过期：区块一没有 Effect 参与，照样过期。
 * - 关掉 exhaustive-deps 省依赖（见八）。它的提示还会顺手建议修法：「React Hook useEffect has a missing dependency: 'count'. … You can also do a functional update
 *   'setCount(c => ...)' if you only need 'count' in the 'setCount' call.」
 * - Effect Event 写进依赖：warn「Functions returned from useEffectEvent must not be included in the dependency array. Remove onTick from the list.」
 * - 在事件处理函数里调用、或传给子组件：rules-of-hooks error「onTick is a function created with React Hook "useEffectEvent", and can only be called from Effects and
 *   Effect Events in the same component.」（传下去时多一句「It cannot be assigned to a variable or passed down.」；插件 7.0.1 起连 <Child cb={useEffectEvent(…)} /> 这种内联写法也拦：
 *   CHANGELOG「Disallowed passing inline useEffectEvent values as JSX props to guard against accidental propagation.」）。运行时不拦，会照常执行 —— 所以更要靠 lint。
 * - 以为 useEffectEvent 返回稳定的函数（像当年 RFC useEvent 承诺的那样），拿去当 useCallback 用、传给 memo 子组件：它每次渲染都是新函数；
 *   需要稳定引用用 useCallback（17 题）。
 * - 用 useEffectEvent 逃避依赖：参考页 Pitfall 的例子，logVisit 里读 pageUrl、依赖写 []，「Missing pageUrl means you miss logs」。
 * - ref.current 写进依赖：warn「… Mutable values like 'clicks.current' aren't valid dependencies because mutating them doesn't re-render the component.」，
 *   同一处还有 refs error「Cannot access refs during render」。
 * - 渲染期写 latest ref（latestRef.current = value 写在函数体里）：refs error「Cannot access refs during render」—— 渲染要保持纯，放进 Effect 或事件处理函数。
 * - 每次渲染新建的对象当依赖：warn「The 'options' object makes the dependencies of useEffect Hook (at line …) change on every render. Move it inside the useEffect
 *   callback. Alternatively, wrap the initialization of 'options' in its own useMemo() Hook.」
 * - 以为 JSX 事件处理函数一定不会过期：被 useCallback(fn, []) 缓存后一样过期（区块二）。
 * - 忘了 cleanup：监听器堆积、切走之后还在往日志里写。
 * - 以为函数式更新总是更好：官方「In most cases, there is no difference between these two approaches.」
 * - 19.2.x 在 memo / forwardRef 组件里用 useEffectEvent：读到第一次渲染的值（二-7 已知 bug）。
 * - Vue：以为 Vue 里不会过期（解构 reactive、手动快照会）；watchEffect 里写 logRef.value.push(...) 会把 logRef 也收成依赖，给它赋新数组就会重跑（Vue 侧测试覆盖）。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：区块三手写 setInterval + 请求只为观察闭包。生产交给 TanStack Query（基础见 30 题），轮询用 refetchInterval：UseQueryOptions 里「refetchInterval: number | false |
 *   (query) => number | false | undefined」「If set to a number, the query will continuously refetch at this frequency in milliseconds.」默认 false；
 *   refetchIntervalInBackground「If set to true, the query will continue to refetch while their tab/window is in the background. Defaults to false.」；
 *   另有专门的 guides/polling 页。（TanStack 的 React 参考文档 2026-09 改成 TypeDoc 生成，旧的 reference/useQuery 路径已经 404。）
 * - 演示简化：alive 标志只丢弃迟到的响应、不取消请求；生产用 AbortController（27 题），或交给 TanStack Query：结果按 queryKey 分开缓存，迟到的响应不会覆盖
 *   当前条件；要真正中止请求，queryFn 要把 signal 传给 fetch（30 题）。
 * - WebSocket / 第三方 SDK：Effect 只管连接与断开（依赖 roomId 这类真正要重连的值），消息回调里「读最新状态」的部分放进 useEffectEvent；React 18 项目用 latest ref。
 * - lint：用 eslint-plugin-react-hooks 6.1.0 以上的 recommended（本项目 7.1.1）。exhaustive-deps 在预设里是 warn，removing-effect-dependencies 建议「We recommend treating
 *   the dependency lint error as a compilation error.」—— CI 里用 --max-warnings=0（本项目的 npm run lint 就是）。
 * - 19.2.x 注意 memo / forwardRef 的已知 bug；升级到 19.3 后解除（按规格 §4，19.3 满 30 天后再评估升级）。
 * - 测试：fake timers 精确推进（本课测试的注意点：Vitest 的 fake-timers 把推进过程中新排进来的 0ms 定时器记成 1ms 之后）；测试写法在 34 题（待新增）。
 * - 自定义 Hook 接收回调：内部用 useEffectEvent 包一层（14 题）；Hook 对外返回的函数要稳定时用 useCallback（17 题）。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - `// eslint-disable-next-line react-hooks/exhaustive-deps` 省依赖：19.2 博客「To solve this, most users just disable the lint rule and exclude the dependency. But that
 *   can lead to bugs since the linter can no longer help you keep the dependencies up to date if you need to update the Effect later.」
 *   （react.dev 有三处 Pitfall 示例 —— lifecycle-of-reactive-effects、removing-effect-dependencies、useEffect 参考页 —— 写成了 eslint-ignore-next-line；
 *   ESLint 没有这个指令，照抄不会生效。）本课区块二、三的 ❌ 保留了这个写法作反例。
 * - 渲染期写 ref 的 useLatest（const ref = useRef(value); ref.current = value）：旧代码里可能遇到；eslint-plugin-react-hooks 7 的 refs 规则（recommended）报 error，
 *   refs lint 页把它列为 Invalid（「// Don't modify during render」）。改成 Effect / 事件处理函数里同步，或者 19.2 起改用 useEffectEvent。
 * - useEffectEvent 的前身：RFC「useEvent」（reactjs/rfcs#220，2022-05 提出，承诺「always stable function identity」，2022-09 搁置）→ 实验通道的 experimental_useEvent →
 *   experimental_useEffectEvent → 19.2.0（2025-10-01）稳定导出 useEffectEvent。react 18.3.1 / 19.0.0 / 19.1.x 的稳定版都没有导出（npm pack 核对）。
 *   最终 API 和 RFC 相反：身份不稳定、只能在 Effect 里调用。
 * - eslint-plugin-react-hooks 5.x 和误发的 6.0.0 不识别 useEffectEvent（会把它当普通函数、要求写进依赖）；6.1.0（2025-10-01，与 React 19.2 同一天）起识别，
 *   19.2 博客「You'll need to upgrade to eslint-plugin-react-hooks@latest so that the linter doesn't try to insert them as dependencies.」
 *
 * 九、新动向【尝鲜】
 * - React 19.3.0（2026-09-09 发布，未满 30 天，本课不用）：修复 memo / forwardRef 组件里 useEffectEvent 读旧值（#34831）；和 Effect 相关的还有 StrictMode 双调用 Effect
 *   的几处调整（Fast Refresh 之后、hydration 期间双调用，移动位置的子元素不再双调用）。
 * - 编译器自动插入 Effect 依赖：2025-04-23 React Labs 博客「For Effects, the compiler can insert the dependencies for you」，列在「new features currently in development」下，
 *   至今没有进入正式文档。
 *
 * 十、动手练习
 * 1. 把区块三的 ❌ BrokenPoller 改成 useEffectEvent，再照 Example.test.tsx 写一条 fake timers 测试。可断言：切到 paid 之后下一次 tick 的日志是 status=paid，
 *    setInterval 只被调用 1 次。
 * 2. 把区块二 EffectEventEnterListener 的 onEnter 写进依赖数组，跑 npx eslint。可断言：exhaustive-deps 报「Functions returned from useEffectEvent must not be included in
 *    the dependency array. Remove onEnter from the list.」
 *
 * 参考（2026-09-18 核对，react.dev / vuejs.org / TanStack 文档取自官方仓库原文）：
 * - react.dev：reference/react/useEffectEvent、learn/separating-events-from-effects、learn/removing-effect-dependencies、learn/lifecycle-of-reactive-effects、
 *   learn/state-as-a-snapshot、learn/referencing-values-with-refs（挑战题 Read the latest state）、learn/reusing-logic-with-custom-hooks、reference/react/useState、
 *   reference/react/useEffect、reference/react/useRef、reference/react/useCallback、reference/eslint-plugin-react-hooks/lints/exhaustive-deps、…/lints/refs、
 *   learn/react-compiler/introduction、learn/react-compiler/debugging、blog/2025/10/01/react-19-2、blog/2025/04/23/react-labs-view-transitions-activity-and-more、
 *   blog/2026/09/09/react-19-3
 * - GitHub：facebook/react CHANGELOG（19.2.0、19.3.0）、packages/eslint-plugin-react-hooks/CHANGELOG（6.1.0、7.0.1）、issue #34818、PR #34831、reactjs/rfcs#220
 * - vuejs.org：guide/extras/composition-api-faq（Comparison with React Hooks）、guide/essentials/reactivity-fundamentals、guide/essentials/watchers、
 *   guide/components/props（Reactive Props Destructure）、api/reactivity-utilities#torefs、api/composition-api-lifecycle
 * - tanstack.com：query/v5 docs/framework/react/reference/interfaces/UseQueryOptions、guides/polling
 * - 源码：react-dom 19.2.8 cjs/react-dom-client.development.js（mountEvent / updateEvent、commitBeforeMutationEffects、getListener、commitUpdate）；
 *   @types/react 19.2.18 index.d.ts；eslint-plugin-react-hooks 7.1.1 cjs；@vue/runtime-dom 3.5.42（patchEvent）、@vue/compiler-sfc 3.5.42、@vue/reactivity 3.5.42（toRefs、watch）
 * - ③ npm：api.npmjs.org/versions/react/last-week（2026-09-18 抓取）、npm view react / eslint-plugin-react-hooks time
 */
import { DelayedSaveDemo } from './DelayedSaveDemo'
import { DependencyLabs } from './DependencyLabs'
import { ListenerDemo } from './ListenerDemo'
import { PollingDemo } from './PollingDemo'

export default function Example() {
  /**
   * 四个区块彼此独立，各自拥有自己的 state 和日志；每个区块演示一种「闭包被交给外部世界」的方式和它的修法：
   * 区块一 setTimeout（没有 Effect 参与）、区块二 addEventListener、区块三 setInterval + 请求（主线 useEffectEvent）、区块四 依赖数组本身。
   * 通用判断：回调执行时，要的是「创建那次渲染的值」还是「最新值」？前者什么都不用做，后者按二里的顺序选修法；cleanup 都不是可选项。
   */
  return (
    <div className="stack">
      <DelayedSaveDemo />
      <ListenerDemo />
      <PollingDemo />
      <DependencyLabs />
    </div>
  )
}
