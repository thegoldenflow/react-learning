/**
 * 主题：03. State 与 useState —— 组件的记忆：为什么需要 state、setter 只影响下一次渲染、整体替换、惰性初始化、state 的结构与 useReducer
 * 适用版本：React 19.2 · @types/react 19.2 · TypeScript 5.9 · eslint-plugin-react-hooks 7.1 · react-error-boundary 6.1 · Vue 3.5
 * 最后核对：2026-09-19
 * 前置主题：01、02（渲染模型的完整讲解在 23 题，推荐顺序里排在本题之前）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时，按项目里的使用频率标【最常用】【常用】【少用】，并写出依据（官方原文、官方示例的写法；没有出处的写「工程经验」）。
 *          正文和运行中的演示只有【最常用】【常用】的写法；【少用】的写法没有删，演示代码里注释着（删掉注释块的第一行和最后一行就能运行），讲解集中在文末「附」。
 *          30 秒速答只用【最常用】。带频率标签的写法，成熟度是【主流】时不再重复标。
 * 本课文件：Example.tsx（讲解 + 入口）· WhyStateDemo.tsx（区块一）· SnapshotDemo.tsx（区块二）· CartDemo.tsx（区块三）· LazyInitDemo.tsx（区块四）·
 *          StateStructureDemo.tsx（区块五）· QuantityEditor.tsx + quantityReducer.ts（区块六）· TroubleshootingDemo.tsx（区块七）·
 *          demoKit.ts + LogPanel.tsx（演示用的日志 store 与面板）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 普通局部变量不跨渲染保留、改了也不触发渲染；useState 给两样东西：一个跨渲染保留的 state 变量，一个请求 React 用新值重新渲染的 setter。
 *   state 属于组件实例，同一个组件渲染两次就是两份互不影响的 state【主流】。
 * - setter 不会改这次渲染里的变量，只影响下一次渲染：set 之后立刻读还是旧值；要用新值做别的事就先算好存进变量。新值和当前值 Object.is 相同时，React 跳过这次重渲染【主流】。
 * - 对象 / 数组 state 要整体替换：用展开、map、filter 造新对象交给 setter；原地改再把同一个引用传回去，React 认为没变【主流】。
 * - 同一个事件里多次更新同一个 state、或者在异步回调里基于旧值更新，用更新函数 setX(prev => …)【主流】。
 * - state 的结构：能算出来的不存、不存重复的数据（存 id 不存对象）、多个互相矛盾的布尔值合成一个 status【主流】。
 *
 * 二、核心概念（React）
 * 1. 为什么需要 state【主流】（区块一）：state-a-components-memory 列了局部变量的两个问题 ——「Local variables don't persist between renders.」
 *    「Changes to local variables won't trigger renders.」要更新组件，需要「Retain the data between renders.」和「Trigger React to render the component with new data」，
 *    「The useState Hook provides those two things」。命名约定「const [something, setSomething]」。区块一的局部变量点 3 下，日志里是 1、2、3，界面一直是 0；
 *    让区块重渲染一次再点，日志又从 1 开始（测试覆盖）。lint 会拦下这种写法：react-hooks/immutability「Cannot reassign variable after render completes」（7.1.1 实测）。
 *    渲染机制本身（组件函数每次渲染从头执行）见 23 题。
 * 2. state 属于组件实例【主流】（区块一）：「if you render the same component twice, each copy will have completely isolated state! Changing one of them will not affect the other.」
 *    「Unlike props, state is fully private to the component declaring it. The parent component can't change it.」—— 父组件想读或改，就把 state 提升到父组件（25 题）。
 * 3. Hooks 规则【主流】：「Hooks—functions starting with use—can only be called at the top level of your components or your own Hooks. You can't call Hooks inside conditions,
 *    loops, or other nested functions.」原因在 deep dive：「Hooks rely on a stable call order on every render of the same component.」「Internally, React holds an array of state pairs
 *    for every component.」—— 第几次调用 useState 就对应第几份 state，顺序一乱就对错位。完整清单（条件 return 之后、事件处理函数、try / catch 里都不行）见 rules-of-hooks 页；
 *    lint 的 rules-of-hooks 规则会报错，自定义 Hook 的命名与规则见 14 题。
 * 4. 签名与类型【主流】：@types/react 19.2.18 index.d.ts:1689 function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]；
 *    :1639 type SetStateAction<S> = S | ((prevState: S) => S)。TypeScript 从初始值推断类型；learn/typescript：「a common case where you may want to provide a type is when you
 *    have a union type」—— 字面量联合（useState<SendStatus>('typing')）、可能为 null（useState<Product | null>(null)）、空数组（useState<CartItem[]>([])，不写推断成 never[]）
 *    都要显式写泛型（28 题）。
 * 5. setter 只影响下一次渲染【主流】（区块二）：useState 页 Caveats「The set function only updates the state variable for the next render. If you read the state variable after calling
 *    the set function, you will still get the old value that was on the screen before your call.」state-as-a-snapshot：「A state variable's value never changes within a render, even if
 *    its event handler's code is asynchronous.」所以 setCount(count + 1) 连写两次，两次读到的都是这次渲染的 count，只加 1；更新函数 setCount(c => c + 1) 拿到的是
 *    「队列里前一条更新算出的结果」，加 2（区块二，测试覆盖）。
 *    要用新值做别的事（写日志、发请求）：【最常用】先算好存进变量 const next = count + 1; setCount(next); use(next)（区块二「先算好 next 再用」，测试覆盖）——
 *    useState 页 Troubleshooting：「If you need to use the next state, you can save it in a variable before passing it to the set function」。
 *    React 批处理：「It updates the screen after all the event handlers have run and have called their set functions.」更新队列、批处理与 flushSync 见 24 题，异步回调里读到旧值的各种修法见 26 题。
 * 6. 基于旧值更新【主流】：按要做的事选写法（更新函数的参数「must be pure」）。
 *    - 一次事件只更新一次：【最常用】直接传新值 setCount(count + 1)（区块一的 StateCounter）。queueing 页：「It is an uncommon use case, but if you would like to update the same
 *      state variable multiple times before the next render, … you can pass a function that calculates the next state based on the previous one in the queue」—— 需要更新函数的场景本身不常见；
 *      两种写法结果相同：「In most cases, there is no difference between these two approaches.」—— 因为「React always makes sure that for intentional user actions, like clicks, the age state
 *      variable would be updated before the next click」（react.dev 示例的粗略统计见附 4）。
 *    - 同一事件里多次更新同一个 state：【最常用】更新函数 setCount(c => c + 1)。官方 deep dive「Is using an updater always preferred?」：「However, if you do multiple updates within the same event,
 *      updaters can be helpful.」在 Effect、定时器这类回调里基于旧值更新同样用它（useEffect 页「Updating state based on previous state from an Effect」的示例写
 *      setCount(c => c + 1); // ✅ Pass a state updater，这样 count 不用写进依赖；26 题）。官方还提到第三种用途：「They're also helpful if accessing the state variable itself is inconvenient
 *      (you might run into this when optimizing re-renders).」（17 题）
 *    - 【常用】为了统一风格，凡是基于旧值都写更新函数：官方承认这种建议很常见 ——「You might hear a recommendation to always write code like setAge(a => a + 1) if the state you're setting is
 *      calculated from the previous state. There is no harm in it, but it is also not always necessary.」，也说这样写「it's reasonable」（工程经验；区块三的 changeQuantity 就是这样写的）。
 *    - 更新函数参数的命名：【最常用】取 state 名首字母（c 对应 count、a 对应 age）——「It's common to name the updater function argument by the first letters of the corresponding state variable」；
 *      【常用】全名或 prev 前缀 ——「another common convention is to repeat the full state variable name, like setEnabled(enabled => !enabled), or to use a prefix like setEnabled(prevEnabled => !prevEnabled)」。
 * 7. Object.is 相同就跳过【主流】（区块二、三）：「If the new value you provide is identical to the current state, as determined by an Object.is comparison, React will skip re-rendering
 *    the component and its children. … Although in some cases React may still need to call your component before skipping the children, it shouldn't affect your code.」
 *    react-dom 19.2.8 实测（测试覆盖）：没有待处理的更新时当场比较，相同就连组件函数都不调用；组件刚因为自己的 state 更新重渲染过时，React 可能先调用一次组件函数、
 *    算出 state 没变再跳过子组件（源码位置见附 4）。所以组件函数被调用几次不能当逻辑依据。
 * 8. 对象 / 数组要整体替换【主流】（区块三）：「In React, state is considered read-only, so you should replace it rather than mutate your existing objects.」
 *    updating-objects-in-state：「without using the state setting function, React has no idea that object has changed.」
 *    - 【最常用】展开、map、filter 造新对象 / 新数组交给 setter（区块三的 +、-、移除）。
 *    - 【常用】嵌套很深、展开写起来太长时用 Immer：updating-objects-in-state「Immer is a popular library that lets you write using the convenient but mutating syntax and takes care of
 *      producing the copies for you.」（Immer 的用法 21 题改写时补，本项目没装 immer）
 *    原地改 + setItems(items) 是同一个引用 → 被跳过、界面不动，之后任何一次别的重渲染又把改过的值带出来（区块三「❌ 原地 +1」，测试覆盖）。另一个坑是 Hooks 的 setter 整体替换、不合并：
 *    state 是 { quantity, note } 时 setState({ quantity: 2 }) 之后 note 就没了（测试覆盖，choosing-the-state-structure「you can't do setPosition({ x: 100 }) … because it would not have
 *    the y property at all!」）。五种不可变更新模式、Immer 见 21 题。
 * 9. 初始值【主流】（区块四）：「React saves the initial state once and ignores it on the next renders.」
 *    - 【最常用】直接给值：useState(0)、useState<CartItem[]>([])（工程经验：绝大多数初始值是字面量）。
 *    - 【常用】初始值算起来昂贵（读 localStorage、生成大数组）时惰性初始化（工程经验；官方给的条件是「This can be wasteful if it's creating large arrays or performing expensive calculations.」）：useState(createInitialRows(…)) 这个表达式每次渲染都会执行、结果扔掉；初始化函数不需要参数时
 *      传函数本身 useState(createX)，需要参数时包一层 useState(() => createInitialRows(counter, 'lazy'))（区块四就是这种），「React will only call it during initialization」。
 *    初始化函数「should be pure, should take no arguments」，StrictMode 开发环境调用两次、其中一次的结果被忽略（区块四页面上是 2 次，测试覆盖；源码细节见附 4）。
 *    useReducer 的第三个参数 init 同理。
 * 10. state 的结构【主流】（区块五）：choosing-the-state-structure 五条原则 —— Group related state、Avoid contradictions in state、Avoid redundant state、Avoid duplication in state、
 *    Avoid deeply nested state；「The goal behind these principles is to make state easy to update without introducing mistakes.」本课演示最常踩的两条：
 *    - 不存重复的数据：选中项存对象，items 更新后它还指着旧对象，详情停在选中那一刻；「For UI patterns like selection, keep ID or index in state instead of the object itself.」（测试覆盖）
 *    - 不让 state 互相矛盾：isSending + isSent「leaves the door open for "impossible" states」，「replace them with one status state variable that may take one of three valid states」；
 *      需要布尔值时从 status 派生（测试覆盖：两个布尔值出现「发送中」和「已发送」同时成立）。
 *    另外三条：
 *    - 【常用】Group related state（工程经验）：「If you always update two or more state variables at the same time, consider merging them into a single state variable.」例如坐标的 x / y 放进一个对象；
 *      合并之后要记得整体替换时带上其他字段（二-8 引的 setPosition({ x: 100 }) 就出自这一节）。
 *    - 【最常用】Avoid redundant state，能算出来的不存（区块三的合计就是渲染时算的）：「If you can calculate some information from the component's props or its existing state variables during rendering, you should not put that information into that
 *      component's state.」—— 区块三的合计、09 题；这一节下面的「Don't mirror props in state」见 02 题区块三。
 *    - Avoid deeply nested state：「When possible, prefer to structure state in a flat way.」Recap：「If updating deeply nested state is complicated, try flattening it.」两种做法都【常用】：
 *      【常用】拍平（官方首选；store 里也一样，Redux 风格指南「Prefer storing that data in a "normalized" form in the store」），具体形状见附 3；
 *      【常用】不想改结构时用 Immer（updating-objects-in-state 原文是「if you don't want to change your state structure, you might prefer a shortcut to nested spreads」，二-8）。
 * 11. useState 还是 useReducer【主流】（区块六）：单个独立的值【最常用】useState（工程经验；官方「You don't have to use reducers for everything: feel free to mix and match!」）；
 *    几个字段互相牵制、同一条规则散在多个事件处理函数里时【常用】收进 useReducer（频率是工程经验）—— 什么时候用：extracting-state-logic-into-a-reducer「We recommend using a reducer if
 *    you often encounter bugs due to incorrect state updates in some component, and want to introduce more structure to its code.」对比五条（Code size / Readability / Debugging / Testing / Personal preference），其中 Testing：「A reducer is a pure function that doesn't depend on
 *    your component. This means that you can export and test it separately in isolation.」（quantityReducer.ts 导出、测试里直接调用）；Personal preference：「You can always convert between
 *    useState and useReducer back and forth: they are equivalent!」reducer「must be pure」，「Each action describes a single user interaction」。判别联合与 never 穷尽检查、日志与撤销重放见 29 题。
 * 12. setter / dispatch 的引用稳定【主流】：「The set function has a stable identity, so you will often see it omitted from Effect dependencies, but including it will not cause the Effect to fire.」
 *    传给 memo 子组件不会破坏浅比较（17 题；源码位置见附 4）。
 * 13. 常见报错【主流】（区块七）：「Too many re-renders. React limits the number of renders to prevent an infinite loop.」—— 渲染时无条件调用 setter，最常见的是 onClick={handleClick()}
 *    （「Very often, this is caused by a mistake in specifying an event handler」）。运行时报错测试覆盖（重跑上限见附 4）；TypeScript（void 不能当 onClick，@ts-expect-error 由 typecheck
 *    验证）和 lint（set-state-in-render，7.1.1 实测）都会拦。
 *    【少用】要把函数存进 state：这件事本身少用，它的坑（被当成初始化函数 / 更新函数调用，useState 页 Troubleshooting 的另一条）连同演示一起注释，见附 1。
 * 14. prop 变了要调整 state【主流】：【最常用】能算的在渲染时直接算、要整体重来就换 key（02 题区块三、09 题）；【少用】渲染期间有条件地 set 自己的 state（记住上一次的 prop）是允许的，
 *    但官方说「This pattern is rarely needed」，独立测试覆盖，见附 2。
 *
 * 三、Vue 对照（Vue 这一侧的演示都是 Vue 项目里常用的写法，没有注释掉的部分）
 * - const [x, setX] = useState(v) ↔ const x = ref(v)，改 x.value = …：【最常用】ref —— reactivity-fundamentals「In Composition API, the recommended way to declare reactive state is using the ref() function」；
 *   【常用】reactive（工程经验：一组相关的表单字段放进一个对象、原地改，vue/QuantityEditor.vue；官方 reactivity-fundamentals 仍有 reactive() 一节）。
 *   Vue 不需要 setter：「Under the hood, Vue performs the tracking in its getter, and performs triggering in its setter.」reactivity-in-depth：「In Vue 3, Proxies are used for reactive objects and
 *   getter / setters are used for refs.」ref 装对象时内部用 reactive() 转成 Proxy，所以 item.quantity += 1 也能被拦截。
 * - 更新单位【主流】：依赖追踪记到具体属性，被触发重新执行的是读过它的组件的 render effect（每个组件实例一个），setup 不重跑（runtime-core.cjs.js:8231 setup 只在挂载时调用，更新走 :6272
 *   renderComponentRoot）；React 的组件函数每次渲染都从头执行。逐个绑定直接更新 DOM 是 Vapor Mode 的方向（九）。
 * - 普通变量【主流】（vue/WhyStateDemo.vue）：Vue 文档没有「普通变量不是响应式」的原句，相关说法是「Reactive state needs to be explicitly created using Reactivity APIs.」（sfc-script-setup）和
 *   「In standard JavaScript, there is no way to detect the access or mutation of plain variables.」和 React 不同的是：<script setup> 只执行一次，普通变量一直活着、跨渲染保留，只是改了不触发渲染；
 *   等别的数据让组件重渲染，界面才跳到它的当前值（测试覆盖：点 3 次显示 0，重渲染后显示 3；React 重渲染后是 0）。
 * - state 属于实例【主流】：每个组件实例执行一次自己的 setup、各有一份 ref；ref 定义在组件外的模块顶层，就是所有实例共享的全局状态（16 题）。
 * - 没有渲染快照【主流】（vue/SnapshotDemo.vue）：count.value 每次现读，改完下一行就是新值，两个按钮都加 2；Vue 没有「更新函数」这种写法，也不需要（26 题：把值拷出来的时候 Vue 也会过期）。
 *   但 DOM 不是立刻变：「Vue buffers them until the "next tick" in the update cycle to ensure that each component updates only once no matter how many state changes you have made.」
 *   要读更新后的 DOM 就 await nextTick()（测试覆盖）。赋相同的值：ref 的 setter 用 hasChanged（!Object.is）比较，没变就不触发（reactivity.cjs.js:1536-1552，测试覆盖）。
 * - 直接改【主流】（vue/CartDemo.vue）：item.quantity += 1 就更新；reactive() 的限制（Limitations of reactive()）：「Limited value types」、「Cannot replace entire object」、
 *   「Not destructure-friendly」（解构出原始类型的属性会断开追踪），所以「we recommend using ref() as the primary API for declaring reactive state」。方向和 React 相反：React 只认新引用，Vue 靠原地改被拦截（两边的不可变 / 可变写法对照见 21 题）。
 * - 没有「惰性初始化」【主流】（vue/LazyInitDemo.vue）：setup 只执行一次，ref(createInitialRows()) 天然只算一次；也没有 StrictMode 那样的开发期双调用（测试覆盖：1 次）。
 * - state 的结构【主流】（vue/StateStructureDemo.vue）：存同一个响应式对象，原地修改时会跟着变（改的是同一个对象），存副本会过期；列表被整体换成新对象（例如重新请求接口）后，
 *   存下来的对象就和列表脱节了 —— 所以 Vue 里同样推荐存 id、用 computed 查找：只要 id 稳定，原地修改和整体换新两种情况都对得上（选中项被删掉时查到 null）（测试覆盖三种存法）。多个布尔值 → 一个 status 是建模原则，和框架无关。
 * - useReducer 没有内置对应物【主流】（vue/QuantityEditor.vue）：reactive 对象 + 直接改它的函数；复杂时把修改集中到 composable（14 题）或 Pinia action（16 题）。
 *   「别让修改散落在各个事件处理函数里」是和框架无关的组织方式，React 用 reducer（纯函数、只暴露 dispatch）来做，Vue 可以原地改，所以不需要「返回新对象」的 reducer 形式
 *   （想用也能用，29 题 Vue 侧）。Pinia action 可以直接改 store、可以是异步的，reducer 是同步纯函数。
 * - 常见报错在 Vue 里【主流】（vue/Example.vue 区块七）：渲染时改自己读过的数据，开发构建在同一个更新任务重复排队超过 100 次时报「Maximum recursive updates exceeded in component <X>. This means you
 *   have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. …」（runtime-core.cjs.js:283、:435-449；生产构建没有这项检查），开发环境先警告、再抛出这段字符串，
 *   变成未处理的 Promise 拒绝，app.config.errorHandler 接不到（开发构建的行为测试覆盖）；ref(fn) 存的就是函数，不会被调用（测试覆盖）。
 * - 不要把 prop 拷进本地 ref【主流】：props 页「define a local data property that uses the prop as its initial value」只用于「当初始值用」，要转换就用 computed（02 题）。
 *
 * 四、关键区别（每条写明前提）
 * 1. 更新怎么被发现：React 19.2（不启用 Compiler）不追踪数据，只认 setter 调用，再用 Object.is 比新旧值；Vue 3.5 在读写时由 getter / setter / Proxy 追踪。react.dev 自己的说法：React
 *    「does not need to hijack their properties, always wrap them into Proxies, or do other work at initialization as many "reactive" solutions do」（updating-objects-in-state）。
 * 2. 重跑什么：React 19.2（不启用 Compiler）从调用 setter 的组件开始重新执行组件函数，默认连同它渲染出的子组件（memo 可跳过；启用 Compiler 后会自动记忆化，17 题）；Vue 只重跑读过这份数据的组件的渲染函数，setup 不重跑，props 没变的子组件不跟着重渲染。
 * 3. 快照：React 函数组件里 state 是每次渲染的常量，set 之后立刻读还是旧值；class 组件的 this.state 在 React 事件处理函数里（以及 18 起 createRoot 下的任何地方）set 之后同步读还是旧值，但定时器里读到的是最新值（八，测试覆盖）；Vue 没有快照，改完立刻读到新值，只有 DOM 延后到下一个 tick。
 * 4. 普通变量：React 的局部变量每次渲染重来（两个问题都有）；Vue <script setup> 的普通变量一直活着（只剩「不触发渲染」一个问题）。
 * 5. 相同的值：两边都用 Object.is 判断「没变」；React 在刚因自己的 state 更新重渲染过的组件上可能还会调用一次组件函数（二-7），Vue 的 ref setter 直接不触发。
 * 6. 初始值：React 函数体每次渲染都执行，才有惰性初始化；Vue setup 只执行一次，没有这个问题。StrictMode 的开发期双调用是 React 独有的检查。
 * 7. 存对象：React 里存下来的对象，在列表用不可变更新改过之后就过期了（更新时造的是新对象）；Vue 里存同一个响应式对象在原地修改时不过期，列表整体换新时同样过期 —— 两边都推荐存 id。
 *
 * 五、常见追问与回答要点
 * - setState 是同步还是异步？调用本身是同步的，但不会改这次渲染里的变量，只安排下一次渲染；同一事件里的多次 set 合并成一次渲染（React 18 起 createRoot 下 setTimeout / Promise 里也批处理，24 题）。
 * - 怎么拿到更新后的值？下一次渲染里直接读；要在当前事件里用，先算好存进变量再 set；派生值在渲染时算（09 题）；不要为了「拿到新值」再开一个 Effect（10 题）。
 * - 连写两次 setCount(count + 1) 为什么只加 1？两次读到同一个快照，排的都是「替换成 1」；改成 setCount(c => c + 1)。
 * - 一定要用函数式更新吗？官方：多数情况没区别（每次点击前 state 都已更新）；同一事件里多次更新、异步回调里基于旧值更新时要用；想统一风格一律写也可以。
 * - 设成和原来一样的值会重渲染吗？Object.is 相同就跳过重渲染与子组件；组件刚因自己的 state 更新重渲染过时，React 可能先调用一次组件函数再跳过子组件。对象「内容一样」但是新引用，会重渲染。
 * - Hooks 为什么不能写在 if 里？React 按调用顺序把每次 useState 对应到那一份 state，条件调用会让顺序在两次渲染之间变化，对错位（14 题）。
 * - 同一个组件渲染两次 state 会串吗？不会，state 属于组件实例；位置不变的同一个组件在重渲染之间保留 state，key 或类型变了就重置（06 题）。
 * - useState 和 useReducer 怎么选？单个独立值用 useState；一个操作要同时改好几个字段、同一条规则在多个事件处理函数里重复出现、想单独测试更新逻辑 → useReducer；跨组件共享 → 状态提升（25）、
 *   Context（15）、store（16）；服务端数据交给 TanStack Query（30）。
 * - useState(expensive()) 有什么问题？每次渲染都执行 expensive()，结果只在第一次被采用；改成 useState(expensive) 或 useState(() => expensive(arg))。追问「和 useState(props.x) 之后 props 变了 state 不跟着变是同一个原因吗」：是，
 *   都是「React saves the initial state once and ignores it on the next renders」（02 题区块三）。
 * - 两个布尔值 isTyping、isSubmitting 有什么问题？四种组合里只有三种合法，某处忘了同步改就出现「不可能的状态」；合成一个 status 字面量联合。
 * - class 的 setState 和 Hooks 的 setter 有什么区别？class 是浅合并（this.setState({ a }) 保留其他字段），Hooks 是整体替换；class 默认从 this 现读，定时器里读到最新值，函数组件读到的是那次渲染的快照；17 及以前在定时器 / Promise 里 this.setState 不批处理、同步生效（八）。
 * - useState(fn) 会怎样？fn 被当成初始化函数调用，state 是它的返回值；要存函数本身写 useState(() => fn)（附 1）。
 *
 * 六、易错点
 * - 用普通局部变量存「会变的数据」：改了不渲染，下次渲染又重来（区块一）。
 * - 原地改 state 再 setX(同一个引用)：界面不动，下次别的重渲染才「突然」变（区块三）；lint 拦得住 items[0].quantity++、user.age = 2，拦不住经 find() 拿到的对象再改、items.push()（7.1.1 实测）。
 * - 以为 set 之后能立刻读到新值；以为 setCount(count + 1) 写两次能加 2（区块二）。
 * - 只传一个字段 setState({ quantity: 2 })，以为会像 class 那样合并，结果其他字段没了（二-8）。
 * - useState(expensive())：每次渲染白算一遍（区块四）。
 * - onClick={handleClick()}：渲染时就调用了，setter 在渲染里触发 → Too many re-renders（区块七）。
 * - 把函数传给 useState / setter 想存起来，结果被调用了（附 1）。
 * - 选中项存成对象、多个布尔值描述同一件事（区块五）；把 props 复制进 state（02 题）。
 * - 在 if / 循环 / 事件处理函数里调用 useState（rules-of-hooks）。
 * - 更新函数、初始化函数、reducer 里有副作用（发请求、改外部变量）：StrictMode 开发环境调两次就露馅（区块四的计数是故意的演示简化）。
 * - 以为 && 左边的空串会被渲染出来：不会，React 不为空字符串创建文本节点（react-dom-client.development.js:6318 等处的 "" !== newChild 判断，测试覆盖）；会渲染出来的是数字 0（05 题）。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：购物车、选中项、发送状态都是组件内的本地 state。真实项目里购物车通常是服务端数据（30 题）或全局 state（16 题）；能写进 URL 的筛选、分页放路由参数（18 题）。
 * - 演示简化：区块四为了数调用次数，初始化函数里有副作用（计数）；真实的初始化函数应当是纯函数。惰性初始化常见用途是读 localStorage：要 try / catch —— 访问 localStorage 本身就可能抛 SecurityError（MDN ③：例如「the user has configured the browsers to
 *   prevent the page from persisting data」），存的 JSON 可能解析失败、形状可能是旧版本的；写入时还要防配额超限（setItem 抛 QuotaExceededError）。
 *   服务端渲染时初始化函数里不能碰 window / localStorage（33 题，待新增）。
 * - 演示简化：区块五的「模拟服务器返回」是按钮；真实的提交状态还要处理失败、重试、防重复提交（19 题），React 19 的 Actions 写法见 31 题（待新增）。
 * - 类型写全：对象 / 数组 state 显式写泛型，字面量联合代替多个布尔值（28 题）；表单类多字段状态用 useReducer 或表单方案（07 题）。
 * - 「state 只读」靠什么保证：react-hooks 的 recommended 预设（本项目已启用，immutability / set-state-in-render 都是 error）+ code review；lint 有盲区（六）。
 *   想在类型层面拦住，可以把 state 的类型写成只读：readonly CartItem[] 拦下 push / 下标赋值，Readonly<CartItem> 拦下字段赋值；两者都是浅的，
 *   readonly CartItem[] 里的元素照样能改字段（测试覆盖类型层）。
 * - reducer 放在独立文件并导出、写单元测试；复杂的更新逻辑优先测 reducer，页面交互用组件测试（34 题，待新增）。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - class 组件（Hooks 在 16.8.0 引入，2019-02；函数组件 + Hooks 是主线）：Component 页「Class components are still supported by React, but we don't recommend using them in new code.」
 *   state 是 this.state，更新用 this.setState：「If you pass an object as nextState, it will be shallowly merged into this.state.」（react-dom-client.development.js:7368 assign({}, newState, partialState)）
 *   —— 只传一个字段，其他字段保留；Hooks 的 setter 是整体替换（测试覆盖两者对比）。
 * - class 的 this.state 不是快照：「Calling setState does not change the current state in the already executing code」—— 在 React 事件处理函数里（18 起 createRoot 下任何地方）
 *   set 之后同步读还是旧值；但它是实例上的字段，定时器回调里读到的是最新值（测试覆盖，React 19）。17 及以前（或 18 里仍用 ReactDOM.render），setTimeout / Promise / 原生事件里的
 *   this.setState 不批处理、同步渲染完，紧接着读 this.state 就是新值（下面升级指南的原文；本仓库是 19，没有 legacy root，无法实测）—— 这就是「setState 同步还是异步」的经典考法。
 *   class 默认从 this 现读，所以不容易读到旧 state；但把 this.state 的值拷进局部变量再在回调里用，同样会过期。函数组件的 state 本身就是每次渲染的常量，过期闭包在函数组件里是默认行为（26 题）。
 * - React 17 及以前的批处理：React 18 升级指南「Before React 18, we only batched updates inside React event handlers. Updates inside of promises, setTimeout, native event handlers,
 *   or any other event were not batched in React by default」；「Starting in React 18 with createRoot, all updates will be automatically batched, no matter where they originate from.」
 *   还在用 ReactDOM.render 的 18 项目，开发环境报错（console.error）里写着「Until you switch to the new API, your app will behave as if it's running React 17.」（同一篇升级指南；24 题）。
 *
 * 九、新动向【较新】【尝鲜】
 * - eslint-plugin-react-hooks 7【较新】：recommended 预设带上了 React Compiler 的诊断规则（immutability、set-state-in-render、globals、purity 等），插件文档：「React Compiler diagnostics are
 *   automatically surfaced by this ESLint plugin, and can be used even if your app hasn't adopted the compiler yet.」本项目已启用，7.1.1 的 recommended 实际是 16 条规则
 *   （插件文档列了 17 条，多出的 component-hook-factories 在 7.1.1 的预设里没有）。
 * - React Compiler 1.0【较新】（本项目不启用）：「understands the Rules of React」，按规则自动记忆化；lint 报错的组件，编译器会跳过不优化（「When the ESLint rule reports an error, it means the compiler
 *   will skip optimizing that specific component or hook.」）。本课的「state 只读、渲染纯」正是它的前提；原理与对手写 memo 的影响 17 题改写时补。
 * - Vue Vapor Mode【尝鲜】（Vue 3.6 RC）：逐个绑定直接更新 DOM、不经过组件级虚拟 DOM；Vue 3.5 仍是组件级 render effect。
 *
 * 十、动手练习
 * 1. 把 SnapshotDemo.tsx 的 addTwiceByValue 改成先算好新值：const next = count + 1; 然后 setCount(next) 两次。可断言：区块二的测试不用改、照样通过（点一次「A」仍只加 1）——
 *    先算好变量解决的是「这次事件里要用新值」，解决不了「同一事件里多次基于旧值更新」，后者要用更新函数。
 * 2. 把 quantityReducer.ts 的 isEditing + draft 两个字段合成一个 mode: { kind: 'view' } | { kind: 'editing'; draft: string }（判别联合的 state）。可断言：「不在编辑却有草稿」在类型上写不出来 ——
 *    在 kind 为 'view' 的分支里读 state.mode.draft 编译报错；reducer 的单元测试改完断言后照样通过。
 * 3. 取消 TroubleshootingDemo.tsx 里 FormatterBlock 的两处【少用】注释，再取消 Example.test.tsx 里对应那条测试的注释。可断言：测试通过 —— 点「❌ setFormatter(addBang)」后预览显示
 *    「state 已经不是函数了（typeof = string）」，点「✅ setFormatter(() => addBang)」后显示「hello state!」。
 *
 * 附：少用的写法与细节（演示代码里对应的部分已注释，删掉注释块的第一行和最后一行就能运行；读别人的代码时认得出来就行）
 * 1. 【少用】把函数存进 state（TroubleshootingDemo.tsx 的 FormatterBlock，已注释；结论由 Example.test.tsx 里的独立组件验证）：useState 页 Troubleshooting
 *    「I'm trying to set state to a function, but it gets called instead」：useState(fn) 把 fn 当初始化函数、setFn(fn) 把 fn 当更新函数（basicStateReducer：action 是函数就调用它，
 *    react-dom-client.development.js:7934-7936）；要存函数得写 useState(() => fn)、setFn(() => fn)（测试覆盖；setFn(fn) 这种写法 TypeScript 拦不住 —— fn 的类型也满足
 *    SetStateAction 里「新值」那一支）。项目里很少把函数放进 state（工程经验），遇到时多半是想存回调，放 ref 或直接在渲染时选函数更常见。
 * 2. 【少用】渲染期间有条件地 set 自己的 state（记住上一次的 prop）：「Calling the set function during rendering is only allowed from within the currently rendering component. React will
 *    discard its output and immediately attempt to render it again with the new state. This pattern is rarely needed, but you can use it to store information from the previous renders.」
 *    条件和 setPrevX 缺一不可；lint 不报这种写法（set-state-in-render 规则页把它列为 Valid），
 *    运行时 React 丢掉这次输出、马上重新渲染（测试覆盖）。官方说它「usually best avoided」（但比在 Effect 里同步好），
 *    更好的是像区块五那样存 id、在渲染时算 —— you-might-not-need-an-effect 的「✅ Best: Calculate everything during rendering」。
 * 3. 拍平的具体形状（细节，二-10 的【常用】做法）：原文的做法是把树拍平：「you can have each place hold an array of its child place IDs. Then store
 *    a mapping from each place ID to the corresponding place.」—— 形状是 { byId: Record<string, Item>, 每项只存 childIds }，改一项只需换掉 byId 里那一项。
 *    也可以把嵌套的 state 下放到子组件（同页：适合「是否悬停」这类不需要存下来的临时 UI 状态）。深嵌套时的不可变更新写法与 Immer 见 21 题（21 题目前没有讲拍平，21 题改写时补一句指回这里）。
 * 4. 细节（了解即可）：
 *    - Object.is 跳过的源码：setter 被调用时，如果这个组件的 fiber 和它的另一份副本（alternate）上都没有待处理的更新，就当场算出新值比较（react-dom-client.development.js:9143-9161
 *      的急切比较），相同就连组件函数都不调用；刚因为自己的 state 更新重渲染过的组件，alternate 上还留着那次的更新标记，当场比较的前提不成立，React 先调用一次组件函数，
 *      算出 state 没变再跳过子组件（:8070-8072、:10174-10179）；只是因为父组件重渲染而跟着重渲染的子组件，没有这个标记（复核实测）。
 *    - 重跑上限：19.2.8 里同一个组件渲染期的重跑上限是 25 次（RE_RENDER_LIMIT，:26131、:7746-7749），超过就抛 Too many re-renders。
 *    - 初始化函数在 StrictMode 下调两次，19.2.8 的 mountStateImpl 采用第一次调用的结果（:8264-8276）。
 *    - setter 引用稳定：react-dom 在首次渲染时把 dispatchSetState.bind(...) 存进 queue.dispatch，之后每次渲染都返回同一个（:8288-8293、:8083）。
 *    - 「只更新一次时直接传新值」的粗略统计（2026-09-19，范围是本次从 react.dev 仓库抓取的 39 个 learn / reference / blog 页面，只算 ±1 的简单写法）：按用途分类后，
 *      「一次事件只更新一次」的正确示例里直接传新值约 40 处、更新函数约 5 处；未分类的原始计数（73 : 32）混着说明文字、故意演示的错误和「同一事件多次更新」的教学代码，不能直接用。
 *
 * 参考（2026-09-19 核对，react.dev / vuejs.org 文档取自官方仓库原文）：
 * - react.dev：learn/state-a-components-memory、learn/state-as-a-snapshot、learn/queueing-a-series-of-state-updates、learn/updating-objects-in-state、learn/choosing-the-state-structure、
 *   learn/reacting-to-input-with-state、learn/extracting-state-logic-into-a-reducer、learn/you-might-not-need-an-effect、learn/conditional-rendering、learn/typescript、
 *   learn/react-compiler/introduction、learn/react-compiler/installation、reference/react/useState、reference/react/useReducer、reference/react/useEffect、reference/react/Component、reference/rules/rules-of-hooks、
 *   reference/eslint-plugin-react-hooks（index、lints/immutability、lints/set-state-in-render）、blog/2022/03/08/react-18-upgrade-guide
 * - vuejs.org：guide/essentials/reactivity-fundamentals、guide/extras/reactivity-in-depth、guide/components/props、api/sfc-script-setup
 * - 使用频率的依据：Redux 风格指南（redux.js.org/style-guide，Normalize Complex Nested/Relational State）
 * - 源码 / 工具：react-dom 19.2.8（cjs/react-dom-client.development.js）、react 19.2.8、@types/react 19.2.18 index.d.ts、eslint-plugin-react-hooks 7.1.1、@vue/reactivity 与 @vue/runtime-core 3.5.42；
 *   npm view react time（16.8.0 2019-02-06、18.0.0 2022-03-29）
 */
import { CartDemo } from './CartDemo'
import { LazyInitDemo } from './LazyInitDemo'
import { QuantityEditor } from './QuantityEditor'
import { SnapshotDemo } from './SnapshotDemo'
import { StateStructureDemo } from './StateStructureDemo'
import { TroubleshootingDemo } from './TroubleshootingDemo'
import { WhyStateDemo } from './WhyStateDemo'

export default function Example() {
  return (
    <div className="stack">
      <WhyStateDemo />
      <SnapshotDemo />
      <CartDemo />
      <LazyInitDemo />
      <StateStructureDemo />
      <QuantityEditor />
      <TroubleshootingDemo />
    </div>
  )
}
