/**
 * 主题：02. Props —— 组件函数唯一的参数：类型与默认值、只读快照与回调上浮、接收原生属性与 ref
 * 适用版本：React 19.2 · @types/react 19.2 · TypeScript 5.9 · eslint-plugin-react-hooks 7.1 · Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：01
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 入口）· OrderCards.tsx（区块一）· ReadonlyPropsDemo.tsx（区块二）· MirrorPropsDemo.tsx（区块三）·
 *          UiButton.tsx + UiButtonDemo.tsx（区块四）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - props 是组件函数唯一的参数（一个对象），在参数里解构读取、用 TypeScript 的 interface / type 描述形状；默认值用 JS 的解构默认值 { discount = 0 }，
 *   只在没传或传 undefined 时生效，传 null、0 都不用默认值【主流】。
 * - props 是每次渲染的只读快照：子组件不改它，要变化就调用父组件传下来的 onXxx 回调，由父组件更新 state、传新的 props 下来（单向数据流）。
 *   开发构建里 React 会冻结 props 对象，直接赋值会抛 TypeError【主流】。
 * - 不要把 props 复制进 state：useState(props.x) 只在第一次渲染时取值；直接用 prop 或在渲染时计算。有意只取初始值时把 prop 命名成 initialX，要重来就换 key【主流】。
 * - React 没有自动透传：自定义组件想接收原生属性，就在类型上继承 ComponentPropsWithRef<'button'> 这类类型，运行时把 {...rest} 展开到真实元素上，className / style 自己合并；
 *   key 不是 prop，组件收不到【主流】。
 * - React 19 起 ref 对函数组件来说是普通 prop，forwardRef 不再必需；函数组件的 defaultProps 已移除（日常 JSX 写法下被忽略），所有组件的 propTypes 检查也已移除，
 *   改用参数默认值和 TypeScript【主流·19.0 起】。
 *
 * 二、核心概念（React）
 * 1. props 是唯一的参数【主流】（区块一）：passing-props「props are the only argument to your component! React component functions accept a single argument,
 *    a props object」；「Usually you don't need the whole props object itself, so you destructure it into individual props.」和 state 的分工 —— thinking-in-react：
 *    「Props are like arguments you pass to a function.」「State is like a component's memory.」（03 题）。
 *    传 props 就是写 JSX 属性：字符串可以直接用引号，其他 JS 值用花括号；属性名原样传给组件，JSX 不做大小写转换。
 *    只写属性名不写值等于传 true：<UiButton disabled> 编译成 jsx(UiButton, { disabled: true })（esbuild 0.28.2 实测）。react.dev 没有写这条，出处是旧文档
 *    legacy.reactjs.org 的 JSX In Depth：「If you pass no value for a prop, it defaults to true.」同一段也说「we don't recommend not passing a value for a prop,
 *    because it can be confused with the ES6 object shorthand {foo}」；两种写法结果相同，按团队约定统一即可（区块一的 emphasis 一行，测试覆盖）。
 * 2. 默认值【主流】（区块一）：「The default value is only used if the size prop is missing or if you pass size={undefined}. But if you pass size={null} or size={0},
 *    the default value will not be used.」空串同理（测试覆盖）。TypeScript 里可选属性 discount?: number 解构出默认值之后，函数体里的类型就是 number。
 *    对象 / 数组 / 函数当默认值（{ items = [] }）每次渲染都是新的引用，传给 memo 子组件或当 Effect 依赖时会造成多余的更新（17 题）；
 *    需要稳定引用就把默认值提到模块顶层常量：const EMPTY_ITEMS: Item[] = []，参数里写 { items = EMPTY_ITEMS }。
 * 3. props 只读、是快照【主流】（区块二）：passing-props「props are immutable」「When a component needs to change its props … it will have to "ask" its parent component
 *    to pass it different props—a new object!」「Don't try to "change props".」Recap：「Props are read-only snapshots in time: every render receives a new version of props.」
 *    Rules of React：「A component's props and state are immutable snapshots. Never mutate them directly.」
 *    - 开发构建：createElement 页 Caveats「In development, React will freeze the returned element and its props property shallowly to enforce this.」
 *      （react/cjs/react-jsx-dev-runtime.development.js:193 Object.freeze(type.props)，开发环境的 jsxDEV；react-jsx-runtime.development.js 同一行号）。函数组件拿到的 props
 *      就是 element.props 这个对象（react-dom-client.development.js:5035-5042 createFiberFromElement 把 element.props 存成 pendingProps，:10130 updateFunctionComponent →
 *      :7662 renderWithHooks 里的 callComponentInDEV(Component, props) 原样传给组件函数），ES 模块是严格模式，所以 props.amount = 0 抛
 *      「TypeError: Cannot assign to read only property 'amount' of object '#<Object>'」—— 这是 JS 引擎的错误，不是 React 的提示（测试覆盖）。
 *      冻结是浅的：父组件传进来的对象 / 数组 prop（例如 items）本身没有被冻结，改它们的内部不会抛错，但同样是在改别人的数据（21 题）。
 *    - 生产构建不冻结（react-jsx-runtime.production.js 里没有 freeze）：赋值「成功」、不触发重渲染；这个组件之后因为自己的 state 重渲染时，读到的是改过的值
 *      （它拿到的还是同一个 props 对象）；父组件一重渲染，又换成新的 props 对象 —— 界面和数据源对不上（node + react-dom 19.2.8 生产构建 + jsdom 实测）。
 *    - 拦截手段：eslint-plugin-react-hooks 7 的 immutability 规则报「This value cannot be modified」「Modifying component props or hook arguments is not allowed.
 *      Consider using a local variable instead.」（7.1.1 实测）；TypeScript 默认不拦（interface 的字段可写），要在编译期拦就把类型写成 Readonly<Props>。
 *    - 快照：事件处理函数、定时器回调里读到的 props 是那一次渲染的值（区块二「稍后读取」，测试覆盖；机制见 23 题，定时器 / 订阅里读到旧值的问题见 26 题）。
 * 4. 单向数据流与回调上浮【主流】（区块二）：数据的主人（父组件）持有 state，把值和 onXxx 回调一起传下去；子组件调用回调「报告」想改成什么，改不改、怎么改由父组件决定（08 题）。
 * 5. 不要把 props 复制进 state【主流】（区块三）：choosing-the-state-structure 的「Don't mirror props in state」——「The state is only initialized during the first render.」
 *    「"Mirroring" props into state only makes sense when you want to ignore all updates for a specific prop. By convention, start the prop name with initial or default
 *    to clarify that its new values are ignored」。直接用 prop，派生值在渲染时算（09 题）；有意只取初始值时命名 initialX，要按新的初始值重来就换 key（06 题）（测试覆盖）。
 * 6. key 不是 prop【主流】：rendering-lists「Note that your components won't receive key as a prop. It's only used as a hint by React itself. If your component needs an ID,
 *    you have to pass it as a separate prop: <Profile key={id} userId={id} />.」开发环境读 props.key 得到 undefined，并报错「Row: `key` is not a prop. Trying to access it will
 *    result in `undefined` being returned. …」（整个页面只报一次；测试覆盖）。key 的作用见 06 题；ref 从 React 19 起是函数组件的普通 prop（见 8）。
 * 7. 接收原生属性【主流】（区块四）：react.dev 没有讲这组工具类型，依据是 @types/react 19.2.18 —— ComponentPropsWithRef（index.d.ts:1480-1484）、ComponentPropsWithoutRef
 *    （:1530）；ComponentProps 的 JSDoc：「It's usually better to use ComponentPropsWithRef or ComponentPropsWithoutRef instead of this type, as they let you be explicit about
 *    whether or not to include the `ref` prop.」（:1430-1432）。对 DOM 元素，ComponentProps<'button'> 就是 JSX.IntrinsicElements['button'] = ClassAttributes & ButtonHTMLAttributes，
 *    里面有 ref?: Ref<HTMLButtonElement> 和 key；WithoutRef 只去掉 ref（测试覆盖类型层）。
 *    运行时：function UiButton({ variant = 'primary', className, style, ref, children, ...rest }) → <button type="button" {...rest} ref={ref} className={…} style={…}>。
 *    JSX 属性按书写顺序合并，后写的覆盖先写的：写在 {...rest} 前面的是默认值（外部能覆盖），写在后面的是组件说了算。className / style 要单独解构出来再合并：
 *    不接住的话，外部的和组件自己的只能留一个 —— 组件的写在 {...rest} 后面，外部传的被丢掉；写在前面，组件自己的被覆盖（测试覆盖合并结果）。
 *    展开要克制：passing-props「Use spread syntax with restraint. If you're using it in every other component, something is wrong. Often, it indicates that you should split your
 *    components and pass children as JSX.」—— 「包一层原生元素」的组件（按钮、输入框）用 rest 是正当用法；业务组件之间层层 {...props} 会让数据从哪来变得看不清（children 组合见 13 题）。
 *    把带 key 的对象展开进 JSX，开发环境报错「A props object containing a "key" prop is being spread into JSX … React keys must be passed directly to JSX without using spread」（测试覆盖）。
 * 8. ref 作为 prop【主流·19.0 起】（区块四）：react-19 博客「Starting in React 19, you can now access ref as a prop for function components」；「New function components will no longer
 *    need forwardRef … In future versions we will deprecate and remove forwardRef.」class 组件不一样：「refs passed to classes are not passed as props since they reference the component
 *    instance.」区块四父组件的 ref 经 UiButton 转交，拿到的是真实的 <button>，可以直接 focus()（测试覆盖）。ref 回调可以返回清理函数（19.0 起），升级指南：「Due to the
 *    introduction of ref cleanup functions, returning anything else from a ref callback will now be rejected by TypeScript.」（@types/react 19.2.18 index.d.ts:176-184 RefCallback
 *    的返回类型是 void 或清理函数）；ref 回调与清理函数、useImperativeHandle 12 题改写时补。
 * 9. children【主流】：嵌套在标签里的内容 ——「the parent component will receive that content in a prop called children」，类型写 ReactNode（13、28 题）。learn/typescript 还给了
 *    第二种写法 ReactElement：「which is only JSX elements and not JavaScript primitives like strings or numbers」（两者的取舍 28 题改写时补）。
 * 10. 类型【主流】：learn/typescript「you can use an interface or type to describe the component's props」；style 用 CSSProperties（「you can use React.CSSProperties to describe
 *    the object passed to the style prop」）。自定义 prop 和原生属性同名、类型又不兼容时先 Omit：<input> 自带 size?: number，想要 size?: 'sm' | 'md' 就写
 *    Omit<ComponentPropsWithRef<'input'>, 'size'> & { size?: 'sm' | 'md' }；直接用 & 拼不报错，但 size 的类型变成 undefined，用 interface 继承则直接报错（测试覆盖类型层）。
 *
 * 三、Vue 对照
 * - defineProps<Props>()【主流】：编译器宏，不用 import；React 的 props 就是函数参数，没有宏。
 * - 默认值【主流·3.5 起】：响应式 props 解构 const { discount = 0 } = defineProps<Props>()。props 页：「In version 3.5 and above, Vue's compiler automatically prepends props. when code
 *   in the same <script setup> block accesses variables destructured from defineProps.」@vue/compiler-sfc 3.5.42 实测：默认值被编进运行时 props 选项（discount: { type: Number,
 *   required: false, default: 0 }），后面对 discount 的访问改写成 __props.discount；propsDestructure 在 3.5 默认开启（compiler-sfc.d.ts:119-124「@default true」，本项目
 *   @vitejs/plugin-vue 6.0.8 没有另外配置）。解构出默认值之后，类型里的 undefined 也去掉了（vue-tsc 3.3.11 实测：OrderCard.vue 模板里的 discount > 0 能通过类型检查）。
 *   给解构出来的 prop 赋值，编译时直接报错「Cannot assign to destructured props as they are readonly.」。
 *   把解构出来的 prop 传给 watch / composable 要包成 getter：「we can watch a destructured prop also by wrapping it in a getter」、useComposable(() => foo)（26 题）。
 *   3.4 及以前：「In 3.5 and above, default values can be naturally declared when using Reactive Props Destructure. But in 3.4 and below … the withDefaults compiler macro is needed」
 *   【旧写法】；withDefaults 里对象 / 数组默认值要写成函数，「This is not necessary when using default values with destructure.」
 * - 默认值与 null【主流】：「If a default value is specified, it will be used if the resolved prop value is undefined - this includes both when the prop is absent, or an explicit undefined
 *   value is passed.」—— null 原样收到，和 React 一样。布尔 prop 不一样：「The Boolean absent props will be cast to false.」、只写属性名是 true（Boolean Casting）；React 不传就是
 *   undefined（区块一两侧的 emphasis 一列，测试覆盖）。同时允许 String 和 Boolean 时看顺序：「the Boolean casting rule only applies if Boolean appears before String」。
 * - 单向数据流【主流】：「All props form a one-way-down binding between the child property and the parent one」；「you should not attempt to mutate a prop inside a child component.
 *   If you do, Vue will warn you in the console」。Vue 3.5.42 开发环境 setup 拿到的是 shallowReadonly(props)（runtime-core.cjs.js:8231-8239），赋值不抛错、值不变，
 *   警告「[Vue warn] Set operation on key "amount" failed: target is readonly.」（测试覆盖）；生产构建直接是可写的 props 对象（runtime-core.cjs.prod.js:6613），赋值会成功并触发重渲染。
 *   TypeScript 也拦：defineProps 的返回类型是只读的（vue/AmountEditor.vue 里要写 @ts-expect-error 才能演示）。想改就 emit，交给父组件改（08 题）。
 *   两种「想改 prop」的正当情形（props 页原文）：只当初始值用 → const counter = ref(props.initialCounter)；需要转换 → computed(() => props.size.trim().toLowerCase())（区块三）。
 *   对象 / 数组 prop 的内部 Vue 拦不住（「it is unreasonably expensive for Vue to prevent such mutations」），同样应该 emit 给父组件改。
 * - props 是响应式对象【主流】：instance.props 是 shallowReactive（runtime-core.cjs.js:4939-4940），整个组件生命周期都是同一个对象。父组件重新渲染、把新值 patch 进来之后
 *   （下一个 tick），读 props.x 就是新值 —— 定时器里读到的是最新值，不是 React 那样「每次渲染一份快照」（区块二，测试覆盖）。
 * - 透传属性（fallthrough attributes）【主流】（区块四）：「A "fallthrough attribute" is an attribute or v-on event listener that is passed to a component, but is not explicitly declared in
 *   the receiving component's props or emits.」「When a component renders a single root element, fallthrough attributes will be automatically added to the root element's attributes.」
 *   class / style 与根元素已有的合并，监听器「both listeners will trigger」。defineOptions({ inheritAttrs: false })【主流·3.3 起】+ useAttrs() / $attrs 手动接管，才相当于 React 的 {...rest}。
 *   关了 inheritAttrs 又没手动绑，属性就丢了；没关 inheritAttrs 又手动 v-bind="attrs"，属性绑两遍：class 变成「btn-primary btn-ghost btn-ghost」，同一个监听器被 mergeProps 按引用去重、
 *   只触发一次（runtime-core.cjs.js:8012-8036，测试覆盖）。
 * - 多根组件【主流】：「components with multiple root nodes do not have an automatic attribute fallthrough behavior. If $attrs are not bound explicitly, a runtime warning will be issued.」
 *   警告原文「Extraneous non-props attributes (placeholder) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.」
 *   （vue/LabeledInput.vue 显式把 $attrs 绑到 <input> 上；测试覆盖）。React 没有这个问题：它从不自动透传，Fragment 包几个节点都一样要自己展开 rest。
 * - useAttrs()【主流】：文档「it isn't reactive (for performance reasons). You cannot use watchers to observe its changes. If you need reactivity, use a prop.」或在 onUpdated 里读。
 *   实测 3.5.42：watch(() => attrs.title) 其实会触发 —— attrs 代理读的时候整体追踪（runtime-core.cjs.js:8365-8369 track(target, "get", "")），属性变化时 updateProps 统一触发（:5042），
 *   这套追踪是 3.2 为修「插槽里用 attrs 不更新」加的（3.2 CHANGELOG「ensure setupContext.attrs reactivity when used in child slots」#4161）；但 isReactive(attrs) 为 false，
 *   文档也没承诺这种行为，按文档写（测试记录了这个现状）。
 * - 组件 ref【主流】：「ref can also be used on a child component. In this case the reference will be that of a component instance」；<script setup> 组件「are private by default」，
 *   要 defineExpose（组件 ref 与 defineExpose 12 题改写时补）；useTemplateRef【主流·3.5 起】（区块四）。React 19 的 ref 是 prop，组件把它转交给 DOM 元素，父组件拿到的是 DOM 节点。
 * - 运行时校验【主流】：对象形式的 defineProps({ amount: { type: Number, required: true, validator } })，「When prop validation fails, Vue will produce a console warning (if using the
 *   development build).」类型形式的 defineProps<Props>() 由编译器生成等价的运行时声明。React 19 删掉了 propTypes 检查，组件之间的 props 靠 TypeScript 这类静态类型检查
 *   （外部数据在边界用 schema 校验，见七）。
 * - prop 名与整体传入【主流】：defineProps 里用 camelCase 声明，模板里「the convention is using kebab-case in all cases to align with HTML attributes」，Vue 自动对应；JSX 没有这层转换。
 *   <BlogPost v-bind="post" /> 对应 <BlogPost {...post} />。
 * - 一个文件一个模板组件【主流】：sfc-spec「Each *.vue file can contain at most one top-level <template> block.」所以 Vue 侧 OrderCard、NoteText 各一个文件；同一个文件写多个组件要用
 *   defineComponent + 渲染函数 / JSX（01 题）。React 的组件只是函数，一个 .tsx 放几个都行。
 * - 泛型组件【主流】：<script setup lang="ts" generic="T"> 对应 React 的 function List<T>(props: ListProps<T>)（28 题改写时补）。
 *
 * 四、关键区别（每条写明前提）
 * 1. 默认值写法：React 函数组件用参数解构默认值（任何版本都能用；18 及以前还有 defaultProps【旧写法】，19 起函数组件不再支持）；Vue 3.5+ 用解构默认值
 *    （编译器改写成 props 选项），3.4 及以前用 withDefaults。两边都只对 undefined 生效。
 * 2. 布尔 prop：Vue 声明成 boolean 的 prop 缺省是 false、只写属性名是 true（布尔转型）；React 缺省就是 undefined，只写属性名是 JSX 语法层面的 true，没有按类型转换。
 * 3. 改 props 的后果：开发构建下 React 19.2 抛 TypeError（冻结 + 严格模式），Vue 3.5 警告、值不变；生产构建两边都不拦 —— React 赋值成功但不重渲染，
 *    Vue 赋值成功并重渲染，父组件之后传的值没变的话子组件不会被更新，界面一直停在改过的值（两边都是 node + 生产构建实测）。
 * 4. 快照 vs 响应式对象：React 每次渲染传一个新的 props 对象，闭包里读到的是那次渲染的值；Vue 的 props 是同一个响应式对象，定时器里读到的是最新值（3.5 解构后也一样，因为编译成了 props.x）。
 * 5. 透传：Vue 单根组件默认自动透传（class / style 合并、监听器都触发）；React 任何版本都只有显式的 {...rest}，className / style 的合并也要自己写。
 * 6. ref：React 19 起函数组件把 ref 当普通 prop 转交给 DOM 元素，18 及以前要 forwardRef；Vue 组件上的 ref 拿到组件实例，<script setup> 默认封闭、要 defineExpose。
 * 7. 校验：Vue 保留开发期运行时校验；React 19 删掉了 propTypes 检查，组件 props 靠 TypeScript 这类静态检查（升级指南「TypeScript or another type-checking solution」）。
 * 8. 一个文件几个组件：React 随意；Vue 一个 SFC 只有一个模板组件。
 *
 * 五、常见追问与回答要点
 * - 传 null 会用默认值吗？不会，只有没传和 undefined 才用；0、空串也原样传入。想让 null 也走默认值，就在函数体里写 note ?? '默认'（练习 2）。
 * - 直接改 props 会怎样？开发构建抛 TypeError（props 被冻结）；生产构建赋值「成功」但不重渲染，之后被父组件的新 props 覆盖，界面和数据对不上。lint 的 immutability 规则会报错。
 * - 为什么 props 要只读？数据只有一个主人，所有改动都经过父组件的 state，好追踪；组件保持纯函数，React 才能放心地跳过输入没变的组件（keeping-components-pure「skipping rendering
 *   components whose inputs have not changed」，17 题）。
 * - 子组件想改父组件的数据怎么办？父组件传一个 onXxx 回调，子组件调用它（08 题）；状态放哪由谁拥有见 25 题。
 * - 什么时候可以把 props 放进 state？只想取初始值、有意忽略后续更新的时候（编辑草稿、表单初始值），并把 prop 命名成 initialX / defaultX；要重来就换 key。
 * - ComponentProps、ComponentPropsWithRef、ComponentPropsWithoutRef 有什么区别？对 DOM 元素前两个相同（都带 ref），WithoutRef 去掉 ref；@types/react 建议用后两个把「带不带 ref」写明白。
 *   纯 React 19 的组件用 WithRef 并解构 ref；要兼容 React 18 的组件库用 forwardRef + WithoutRef。
 * - 为什么 rest 通常展开在具名属性后面？看需求：写在默认值后面 = 外部可以覆盖默认值；写在强制值前面 = 组件说了算。className / style 单独解构、合并后放在最后。
 * - forwardRef 还能用吗？19.2 里照常工作（测试覆盖）；文档说「forwardRef will be deprecated in a future release」，@types/react 19.2.18、19.3.0 都还没有标 @deprecated（npm 实测）。
 * - React 19 为什么删函数组件的 defaultProps？升级指南「in place of ES6 default parameters」；class 组件保留，「since there is no ES6 alternative」。
 * - key、ref 是 prop 吗？key 不是，组件收不到；ref 在 React 19 起对函数组件是普通 prop，对 class 组件不是（指向实例）。
 *
 * 六、易错点
 * - 在子组件里改 props，或改 props 里的对象 / 数组（冻结是浅的，改内部不报错但同样错）。
 * - 改解构出来的局部变量（amount = 0）：只改了这次渲染的局部变量，父组件和 React 都不知道，不会重渲染，下次渲染又是父组件传的值；但同一次渲染里的其他闭包
 *   （例如已经排队的定时器回调）会读到改过的值，界面和逻辑对不上。在事件处理函数里这样写，react-hooks/immutability 同样报错（复核实测）。
 * - useState(props.x) 镜像 props，之后父组件传新值也不更新。
 * - className / style 留在 rest 里被外部值整个覆盖；{...rest} 放错位置，默认值被锁死或强制值被外部改掉。
 * - 忘了把 rest 展开到 DOM 上：外部传的 disabled、onClick、aria-* 全都不生效，而且不报错。
 * - <button> 不写 type：放进 <form> 里就是提交按钮，点一下就提交（UiButton 默认给 type="button"）。MDN <button>：「This is the default if the attribute is not specified for buttons
 *   associated with a <form>」（③）；HTML 标准现在把缺省状态叫 Auto，没有 command / commandfor 属性时按提交按钮处理。
 * - 在子组件里读 props.key；把带 key 的对象展开进 JSX（key 要直接写在 JSX 上，写在展开前面）。
 * - 对象 / 函数当默认值，每次渲染都是新引用，让下游的 memo 失效（17 题）。
 * - Vue 3.5：把解构出来的 prop 直接传给 watch（编译报错，要写 () => discount）。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：UiButton 的尺寸写成行内样式、className 用 filter(Boolean).join(' ') 拼接；真实组件库把尺寸写成 CSS 类（CSS Modules / Tailwind），类名用 clsx / cn 之类的工具函数合并。
 * - 组件库 API 的常见 review 点：className 和 style 都要合并；按钮给 type="button" 默认值；和原生属性同名的自定义 prop 先 Omit；可访问名称（只有图标的按钮要 aria-label，35 题，待新增）。
 * - 同时支持 React 18 的组件库：forwardRef + ComponentPropsWithoutRef；只支持 19 的项目：ComponentPropsWithRef + 在参数里解构 ref。
 * - 默认值要稳定引用时提到模块顶层常量；配合 memo 的列表项组件要检查 props 的引用（17 题）。
 * - 运行时校验放在数据边界（接口响应、表单输入、URL 参数），用 schema 校验库（如 zod）；组件之间的 props 靠 TypeScript。不要为新代码引入 propTypes ——
 *   升级指南「If you're using propTypes, we recommend migrating to TypeScript or another type-checking solution.」
 * - 「props 只读」靠什么保证：开发构建的冻结 + react-hooks/immutability lint + 可选的 Readonly<Props> + code review；生产构建没有任何保护。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - 函数组件的 defaultProps：React 19.0 移除 ——「We're also removing defaultProps from function components in place of ES6 default parameters. Class components will continue to support
 *   defaultProps since there is no ES6 alternative.」19.2.8 实测：日常 JSX（编译成 jsx()）下被静默忽略、没有任何提示；但 React.createElement 仍会合并 type.defaultProps
 *   （react/cjs/react.development.js:1037-1039，不分函数和 class），而 <C {...p} key="k" />（key 写在展开后面）会被编译成 createElement（esbuild 实测）—— 存量代码里的 defaultProps
 *   因此时灵时不灵（测试覆盖：<Greeting {...p} key="k" /> 拿到了 defaultProps，<Greeting key="k" {...p} /> 没拿到），迁移时统一改成参数默认值。@types/react 19 的 FunctionComponent 已经没有 defaultProps 字段（index.d.ts:1060-1086）。
 * - class 组件的 static defaultProps：仍然支持 ——「They will be used for undefined and missing props, but not for null props.」（Component 页；测试覆盖没传、undefined、null 三种）；
 *   读 props 用 this.props。
 * - propTypes：「PropTypes were deprecated in April 2017 (v15.5.0). In React 19, we're removing the propType checks from the React package, and using them will be silently ignored.」
 *   （测试覆盖：校验函数返回错误也不报）。@types/react 里 propTypes 标了 @deprecated「Ignored by React」。官方 codemod：npx codemod@latest react/prop-types-typescript。
 * - forwardRef：React 18 及以前函数组件接收 ref 的写法，forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'>>((props, ref) => …)（forwardRef 自己会加上 RefAttributes）。
 *   forwardRef 页：「In React 19, forwardRef is no longer necessary. Pass ref as a prop instead.」「forwardRef will be deprecated in a future release.」19.2.8 仍可用（测试覆盖）。
 * - element.ref：「React 19 supports ref as a prop, so we're deprecating the element.ref in place of element.props.ref.」19.2.8 读 element.ref 报「Accessing element.ref was removed in
 *   React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release.」（升级指南里写的是「is no longer supported」，以实测文案为准；测试覆盖）。
 * - 字符串 ref（class 组件里 ref="input"）：「String refs were deprecated in March, 2018 (v16.3.0).」React 19 移除。
 * - Vue：withDefaults(defineProps<Props>(), { … }) 是 3.4 及以前给类型形式 props 写默认值的写法。
 *
 * 九、新动向【较新】【尝鲜】
 * - @types/react 19 的类型变化【较新·19.0 起】：「The props of React elements now default to unknown instead of any if the element is typed as ReactElement.」
 *   「useRef now requires an argument」（RefObject 不再只读，MutableRefObject 弃用；12 题改写时补）；全局 JSX 命名空间改用 React.JSX（01 题；28 题改写时补）。
 * - forwardRef 未来会被弃用【尝鲜·还没发生】：文档写了计划；@types/react 19.2.18、19.3.0 都没有标 @deprecated，react 19.2.8 运行时用它也没有任何提示（测试覆盖）。
 * - React 19.3【尝鲜·19.3.0】（2026-09-09 发布，未满 30 天，本课不用）：@types/react 19.3.0 相对 19.2.18 新增的是 FragmentInstance / Fragment 的 ref、ViewTransition 与
 *   addTransitionType 的类型、SubmitEvent.submitter，本课用到的类型没有变化（diff 实测）。
 *
 * 十、动手练习
 * 1. 把 UiButton.tsx 里的 {...rest} 挪到 <button> 的最前面（type="button" 前面），再跑测试。可断言：「type 被覆盖为 submit」那个按钮的 type 变回 button（默认值被锁死，测试失败）。
 * 2. 把 NoteText 的默认值改成在函数体里算：const text = note ?? '（无备注）'。可断言：<NoteText note={null} /> 那一行也显示「（无备注）」（?? 对 null 和 undefined 都生效，解构默认值只对 undefined）。
 *
 * 参考（2026-09-18 核对，react.dev / vuejs.org 文档取自官方仓库原文）：
 * - react.dev：learn/passing-props-to-a-component、learn/thinking-in-react、learn/choosing-the-state-structure、learn/rendering-lists、learn/typescript、
 *   learn/keeping-components-pure、reference/rules/components-and-hooks-must-be-pure、reference/react/createElement、reference/react/forwardRef、reference/react/Component、
 *   reference/eslint-plugin-react-hooks（immutability）、blog/2024/12/05/react-19、blog/2024/04/25/react-19-upgrade-guide
 * - legacy.reactjs.org：docs/jsx-in-depth（Props Default to "True"）；MDN：Web/HTML/Reference/Elements/button（③）
 * - vuejs.org：guide/components/props、guide/components/attrs、api/sfc-script-setup、api/sfc-spec、guide/typescript/composition-api、guide/essentials/template-refs；
 *   vuejs/core changelogs/CHANGELOG-3.2.md（#4161）
 * - 源码 / 工具：react 19.2.8（cjs/react-jsx-runtime.*.js、cjs/react.*.js）、react-dom 19.2.8（cjs/react-dom-client.development.js）、@types/react 19.2.18 index.d.ts、
 *   esbuild 0.28.2、@vue/runtime-core / @vue/reactivity / @vue/compiler-sfc 3.5.42、@vitejs/plugin-vue 6.0.8；npm view @types/react（19.3.0）
 */
import { MirrorPropsDemo } from './MirrorPropsDemo'
import { OrderCards } from './OrderCards'
import { ReadonlyPropsDemo } from './ReadonlyPropsDemo'
import { UiButtonDemo } from './UiButtonDemo'

export default function Example() {
  return (
    <div className="stack">
      <OrderCards />
      <ReadonlyPropsDemo />
      <MirrorPropsDemo />
      <UiButtonDemo />
    </div>
  )
}
