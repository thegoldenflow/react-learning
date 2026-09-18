/**
 * 主题：04. 事件处理 —— 传函数不要调用、合成事件与 nativeEvent、捕获与冒泡、preventDefault 与 stopPropagation、Vue 修饰符的 JS 写法、被动监听
 * 适用版本：React 19.2 · @types/react 19.2 · TypeScript 5.9 · eslint-plugin-react-hooks 7.1 · Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：01、02、03
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 入口）· BindingDemo.tsx（区块一）· EventObjectDemo.tsx（区块二）· PropagationDemo.tsx（区块三）· DefaultActionDemo.tsx（区块四）·
 *          ModifiersDemo.tsx（区块五）· PassiveWheelDemo.tsx（区块六）· demoKit.ts + LogPanel.tsx（演示日志）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 事件是 camelCase 属性，传的是函数本身：onClick={handleClick}；要传参就包一层箭头函数 onClick={() => remove(id)}。写成 onClick={remove(id)} 会在渲染时就执行【主流】。
 * - 处理函数收到的是 React 的合成事件（synthetic event）：接口基本遵循同一套 DOM 标准（少数属性没有，例如 KeyboardEvent 的 isComposing 要从 e.nativeEvent 读），e.nativeEvent 是原生事件。
 *   React 17 起把大多数事件的监听器挂在 root 容器上（16 及以前挂在 document 上），所以以 onClick 为例：e.currentTarget 是挂着 onClick 的那个元素，e.nativeEvent.currentTarget 是 root 容器【主流】。
 * - 多数 React 事件都会传播：先向下走一遍 onXxxCapture，再从目标向上走 onXxx（onScroll / onScrollEnd 只在目标上，onMouseEnter / onMouseLeave 另算，见二-7）；
 *   e.stopPropagation() 停传播，e.preventDefault() 停浏览器默认动作，两件事互不相干【主流】。
 * - React 没有 Vue 那样的修饰符，.stop / .prevent / .self / .once / .enter 都在处理函数里用一两行 JS 写【主流】。
 * - 处理函数是放副作用的地方，不必是纯函数；它读到的是这次渲染的 state（23、26 题）【主流】。
 *
 * 二、核心概念（React）
 * 1. 绑定【主流】（区块一）：「Functions passed to event handlers must be passed, not called.」「the () at the end of handleClick() fires the function immediately during rendering,
 *    without any clicks. This is because JavaScript inside the JSX { and } executes right away.」传参：onClick={() => remove(id)}；既要参数又要事件对象：onClick={(e) => remove(id, e)}。
 *    区块一的 ❌ 列表：onClick={removeItem(item.id)} 在渲染每一行时就调用了 removeItem、在渲染期间改自己的 state；这个更新会收敛（删光就不再删），所以不报错，列表一出现就空了（测试覆盖）。
 *    不收敛的写法（onClick={setCount(count + 1)}）会抛「Too many re-renders」（03 题区块七）。TypeScript 会拦（void 不能当 onClick）；lint 的 set-state-in-render 只认组件体里
 *    无条件执行的 setState，写在 items.map 回调里的这一种它没报（eslint-plugin-react-hooks 7.1.1 实测）。
 * 2. 命名约定【主流】：处理函数「Have names that start with handle, followed by the name of the event」（By convention）；回调 prop「By convention, event handler props should start with
 *    on, followed by a capital letter.」自定义组件的回调 prop 按业务含义起名（onRemove、onPlayMovie）：「Naming props after app-specific interactions like onPlayMovie gives you the flexibility
 *    to change how they're used later.」只有 <button>、<div> 这类内置组件的事件名必须是 onClick 这些浏览器事件名。
 * 3. 处理函数与副作用、快照【主流】：「Because event handlers are declared inside of a component, they have access to the component's props.」「Absolutely! Event handlers are the best place for
 *    side effects.」「Unlike rendering functions, event handlers don't need to be pure」—— 改 state、发请求、导航都写在这里（01 题：渲染必须纯）。读到的是创建它的那次渲染的值：
 *    「Event handlers created in the past have the state values from the render in which they were created.」（23 题；定时器 / 订阅里读到旧值的修法见 26 题）。
 * 4. 合成事件【主流】（区块二）：「Your event handlers will receive a React event object. It is also sometimes known as a "synthetic event".」「It conforms to the same standard as the underlying DOM
 *    events, but fixes some browser inconsistencies.」nativeEvent：「The original browser event object.」common 页 Caveats：「Under the hood, React attaches event handlers at the root, but this is not
 *    reflected in React event objects. For example, e.currentTarget may not be the same as the underlying e.nativeEvent.currentTarget.」
 *    源码（react-dom 19.2.8）：createRoot / hydrateRoot 对容器调用 listenToAllSupportedEvents(container)（react-dom-client.development.js:28057、:28113），它在容器上给大多数原生事件各挂一个捕获、
 *    一个冒泡监听；scroll、scrollend、load、媒体事件这类不冒泡的事件在容器上只挂捕获，冒泡监听挂在元素自己身上（:19209-19226、:19179-19192、:27450 nonDelegatedEvents）；
 *    portal 的容器也会挂一份（:12907-12913）。原生事件到达 root 容器时，React 沿组件树收集 onXxx，逐个调用，调用前把 e.currentTarget 设成那个元素、调用后置 null（executeDispatch，:19113-19120）。
 *    实测（onClick，测试覆盖）：e.target 是被点中的 <span>、e.currentTarget 是 <button>、e.nativeEvent.currentTarget 是 root 容器（onScroll、onLoad 这类挂在元素上的，是元素本身）；setTimeout 里 type、target 照样能读（17 起没有事件池），
 *    currentTarget 已是 null —— 异步里要用就先存进局部变量。有些 React 事件不是一对一映射：「For example in onMouseLeave, e.nativeEvent will point to a mouseout event.」
 * 5. 传播三阶段【主流】（区块三）：「Each event propagates in three phases: 1. It travels down, calling all onClickCapture handlers. 2. It runs the clicked element's onClick handler.
 *    3. It travels upwards, calling all onClick handlers.」「Capture events are useful for code like routers or analytics, but you probably won't use them in app code.」
 *    17 起捕获事件用真正的浏览器捕获监听（17 RC 博客「Capture phase events (e.g. onClickCapture) now use real browser capture phase listeners.」）。
 *    和原生监听器混用时的顺序（区块三，测试覆盖）：React 外层 / 中层 onClickCapture（root 容器的捕获监听比容器里面的原生监听器都早；window / document 上的原生捕获监听更早）→ 外层 div 的原生捕获监听 → 按钮、外层 div 的原生冒泡监听 →
 *    React 按钮 / 中层 / 外层 onClick（原生事件冒泡到 root 容器时集中派发）→ document 的原生监听。
 * 6. stopPropagation 与 preventDefault【主流】（区块三、四）：「Don't confuse e.stopPropagation() and e.preventDefault(). They are both useful, but are unrelated」；「e.stopPropagation() stops the event
 *    handlers attached to the tags above from firing.」「e.preventDefault() prevents the default browser behavior for the few events that have it.」
 *    合成事件的 stopPropagation 同时调用了原生事件的 stopPropagation（:3381-3404），但这时原生事件已经冒泡到 root 容器：DOM 里比 root 更深的原生监听器早就执行过了，
 *    挡住的是 React 树里后面的 onClick 和 document / window 上的监听器（测试覆盖）。如果是在 onClickCapture 里调用，原生事件在 root 容器的捕获阶段就被停住，
 *    root 里面的原生监听器、document 全都收不到（测试覆盖；练习 1 让你在区块三里亲手改一次）。
 *    stopPropagation 不挡「同一个节点上的其他监听器」：root 容器上别的库后来挂的原生监听器照样执行，要挡住得用 e.nativeEvent.stopImmediatePropagation()（测试覆盖；16 时代挡 document 监听器也常见这种写法）。17 RC 博客：「In React 16 and earlier, even if you call e.stopPropagation() in a React event handler, your custom document listeners would
 *    still receive them because the native event is already at the document level. With React 17, the propagation would stop (as requested!)」
 *    表单：在 <form> 上监听 onSubmit + preventDefault（「a <form> submit event … will reload the whole page by default」），不要靠提交按钮的 onClick —— 表单里有提交按钮时，输入框里回车
 *    会先对这个按钮派发一次 click（隐式提交），onClick 本身不会漏，问题在于它太早：onClick 在浏览器的约束校验（required、pattern）之前就执行，必填项为空时 onClick 照样触发、onSubmit 不触发
 *    （测试覆盖）；form.requestSubmit() 这类不经过按钮的提交它也管不到。表单完整写法见 07 题，React 19 的 <form action> 见 31 题（待新增）。
 * 7. 哪些事件不按常规传播【主流】（区块三）：「All events propagate in React except onScroll, which only works on the JSX tag you attach it to.」（common 页：「This event does not bubble.」，
 *    源码 :19411-19413 scroll / scrollend 只派发给目标）；onFocus / onBlur 在 React 里冒泡：「Unlike the built-in browser focus event, in React the onFocus event bubbles.」（17 起底层是 focusin /
 *    focusout，:27405-27406）；「Some events (like onAbort and onLoad) don't bubble in the browser, but bubble in React.」onMouseEnter / onMouseLeave：「Does not have a capture phase. Instead,
 *    onMouseLeave and onMouseEnter propagate from the element being left to the one being entered.」（测试覆盖 scroll、focus、load 三种）。外层想知道里面在滚动，用 onScrollCapture：捕获阶段不限定只派发给目标（:19411-19413 的判断只在冒泡阶段），测试覆盖；Vue 对应 @scroll.capture。
 * 8. 用对标签【主流】：「to handle clicks, use <button onClick={handleClick}> instead of <div onClick={handleClick}>. Using a real browser <button> enables built-in browser behaviors like keyboard
 *    navigation.」本课区块三、四里可点击的 div 只用来观察传播和 .self，标了「演示简化」（七）。
 * 9. 事件类型【主流】（@types/react 19.2.18）：事件类型从 react 导入（import { type MouseEvent } from 'react'，会遮蔽浏览器全局的同名类型；要用全局的写 globalThis.WheelEvent 或 window.MouseEvent，
 *    区块二、六）。MouseEvent<T>（index.d.ts:2155）、KeyboardEvent<T>（:2130）、ChangeEvent<T>（:2104，把 target 收窄成表单元素）、SubmitEvent<T>（:2177，07 题）、WheelEvent<T>（:2203）；
 *    列表之外的事件用 SyntheticEvent<T>（:2054）兜底 —— learn/typescript：「you can use the React.SyntheticEvent type, which is the base type for all events.」
 *    处理函数整体的类型：MouseEventHandler<T>（:2250）等。currentTarget 带元素类型（EventTarget & HTMLButtonElement），target 一般只是 EventTarget（事件可能来自子元素，:2047-2053 的 JSDoc；ChangeEvent、SubmitEvent 例外，SubmitEvent 的 target 是
 *    EventTarget & HTMLFormElement，:2177-2182）。
 *    FormEvent 已 @deprecated（:2086-2092「FormEvent doesn't actually exist.」，07 题）。类型层测试覆盖（expectTypeOf 由 typecheck 验证）；组件 props 里的事件类型见 28 题。
 * 10. 内联箭头与 useCallback【主流】：内联箭头每次渲染都是新函数，一般没有问题。useCallback 页：「Caching a function with useCallback is only valuable in a few cases」—— 传给 memo 组件、
 *    或作为其他 Hook 的依赖（17 题）。
 *
 * 三、Vue 对照
 * - @click="handler"（方法处理器）/ @click="remove(id)"（内联处理器）【主流】：「The template compiler detects method handlers by checking whether the v-on value string is a valid JavaScript
 *   identifier or property access path.」内联处理器会被编译器包成函数，所以模板里写「调用」是对的；JSX 只是普通 JS 表达式，没有这层编译。
 * - 事件对象【主流】：「A method handler automatically receives the native DOM Event object」；内联处理器里用 $event 或箭头函数（「You can pass it into a method using the special $event variable,
 *   or use an inline arrow function」）。$event 只在原生元素上是 DOM 事件；在组件上监听自定义事件时，它是 emit 的第一个参数（v-on API 页示例 <MyComponent @my-event="handleThis(123, $event)" />）。
 * - 没有委托【主流】（vue/PropagationDemo.vue）：v-on 在元素上直接 addEventListener（runtime-dom.cjs.js:634-636），currentTarget 就是绑定的元素；Vue 的监听器和原生监听器按 DOM 顺序交错执行，
 *   同一元素上先注册的先执行（测试覆盖）。原生 scroll、focus 不冒泡，Vue 也不模拟：外层要知道里面获得焦点就用 @focusin（测试覆盖）。
 * - 修饰符【主流】（vue/DefaultActionDemo.vue、vue/ModifiersDemo.vue）：.stop / .prevent / .self / .capture / .once / .passive，按键 .enter / .esc 等，系统键 .ctrl / .alt / .shift / .meta，
 *   .exact，鼠标 .left / .right / .middle。实现：.stop / .prevent / .self / 系统键 / 鼠标键 / .exact 是守卫函数（runtime-dom.cjs.js，按书写顺序执行（modifierGuards :1818-1831 + withModifiers :1832-1843）——
 *   「Order matters when using modifiers」），.capture / .once / .passive 变成 addEventListener 的选项（parseName，:660-672），按键修饰符比较 event.key（withKeys，:1853-1867）。
 *   @click.right / @click.middle 会被编译器改写成 contextmenu / mouseup 事件（@vue/compiler-dom 3.5.42 compiler-dom.cjs.js:362-370）。
 * - 滚轮【主流】（vue/PassiveWheelDemo.vue）：Vue 不给元素上的 wheel 加 passive，@wheel.prevent 直接生效（测试覆盖）；.passive 是显式声明「attaches a DOM event with { passive: true }」，
 *   「Do not use .passive and .prevent together」。
 * - 组件事件【主流】：「Unlike native DOM events, component emitted events do not bubble. You can only listen to the events emitted by a direct child component.」（测试覆盖）React 的回调 prop
 *   同样不会冒泡，也不会自动透传（02 题）。没在 emits 里声明的监听器是透传属性：单根组件把它加到根元素上（attrs 页「v-on Listener Inheritance」），根节点是另一个组件时继续往下透传 ——
 *   所以隔一层也可能「收到」孙组件的事件，这是透传，不是冒泡（测试覆盖两种情况）。组件通信见 08 题。
 * - 文本框的 v-model 默认监听 input 事件、.lazy 改成 change（checkbox / radio / select 监听 change）；React 的 onChange 行为像原生 input 事件（「Behaves like the browser input event.」）—— 07 题【主流】。
 *
 * 四、关键区别（每条写明前提）
 * 1. 「调用」写法：Vue 模板（编译器包成函数）里 @click="remove(id)" 是对的；JSX（任何 React 版本）里 onClick={remove(id)} 在渲染时就执行。
 * 2. 事件对象：React 是合成事件（nativeEvent 才是原生的），currentTarget 由 React 按组件树设置；Vue 3 直接给原生事件。
 * 3. 委托：React 17 起委托到 root 容器（16 及以前是 document）；Vue 3 不委托、直接绑在元素上。和原生 addEventListener 混用时，React 委托事件（onClick 等）的处理函数在原生事件到达 root 容器时才执行，Vue 的按 DOM 顺序交错。
 * 4. 修饰符：Vue 3.5 声明式修饰符；React 任何版本都没有，靠处理函数里的 JS。
 * 5. 冒泡差异：React 让 focus / blur / load / abort 冒泡、让 scroll 不冒泡（17 起）；Vue 在原生元素上不模拟冒泡，行为与原生相同（focus / scroll 不冒泡，要用 focusin）。
 * 6. 被动监听：React 的 onWheel / onTouchStart / onTouchMove 注册成 passive（浏览器支持时），处理函数里 preventDefault 无效；Vue 默认不 passive，.passive 要显式写。
 *
 * 五、常见追问与回答要点
 * - onClick={handleClick} 和 onClick={handleClick()} 有什么区别？前者传函数，点击时调用；后者渲染时就调用，把返回值（通常 undefined）交给 onClick。
 * - 内联箭头函数每次渲染都是新函数，有问题吗？一般没有；子组件用了 memo、或者它是 Effect / useMemo 的依赖时才用 useCallback（17 题）。启用 React Compiler 后会自动记忆化（17 题改写时补）。
 * - React 的事件是原生事件吗？不是，是合成事件，e.nativeEvent 是原生事件；大多数事件的监听器挂在 root 容器上（17 起），所以 onClick 里 e.nativeEvent.currentTarget 是 root 容器
 *   （onScroll、onLoad 这类挂在元素本身，portal 里的事件挂在 portal 容器）。
 * - React 17 的事件系统改了什么？委托从 document 改到 root 容器（官方理由是逐步升级：「makes it safer to embed a tree managed by one version of React inside a tree managed by a different version of React」，也方便嵌进 jQuery 这类别的技术写的页面）、去掉事件池（e.persist() 不再需要）、onScroll 不再冒泡、onFocus / onBlur 底层用
 *   focusin / focusout、捕获事件用真正的捕获阶段。
 * - 怎么只在点到元素本身时触发（Vue 的 .self）？if (e.target !== e.currentTarget) return。
 * - 捕获和冒泡谁先执行？所有 onXxxCapture 自上而下，然后目标上的 onXxx，再自下而上的 onXxx；和原生监听器混用时 React 的捕获处理函数比 root 容器里面的原生监听器都早，冒泡处理函数都晚。
 * - 在 React 里 stopPropagation 能挡住 document.addEventListener 的监听吗？能（17 起），因为原生事件在 root 容器上被停住；在 onClick 里调用时挡不住 root 容器里面元素上的原生监听器（它们已经执行过了），
 *   在 onClickCapture 里调用时连它们也挡住（原生事件还在捕获阶段）。16 及以前挡不住 document 上的监听器。
 * - React 的 onChange 和原生 change 一样吗？不一样：行为像原生 input 事件，值每变一次触发一次，输入法拼写期间也触发；受控输入必须配 onChange（07 题）。
 * - 同一个节点上的其他原生监听器怎么挡？stopPropagation 不挡同一节点的监听器，要用 e.nativeEvent.stopImmediatePropagation()（二-6）。
 * - 怎么阻止 onWheel 的默认滚动？onWheel 是被动监听，preventDefault 无效；用 ref + addEventListener('wheel', fn, { passive: false })（区块六）。
 * - 中文输入法按回车确认候选词，怎么不被当成提交？判断 e.nativeEvent.isComposing || e.keyCode === 229（MDN ③，区块五）。
 * - 子组件的事件怎么让父组件知道？传回调 prop（onRemove），子组件调用它 —— 官方说这比依赖冒泡更好追踪：「you can clearly follow the whole chain of code that executes as a result of some event」（08 题）。
 *
 * 六、易错点
 * - onClick={remove(id)}：渲染时就执行（区块一）；onclick 小写（01 题）；照 HTML 写成字符串 onClick="fn()"：开发环境报错「Expected `onClick` listener to be a function, instead got a value of
 *   `string` type.」（测试覆盖），点击没反应。
 * - 以为 preventDefault 会停止冒泡、以为 stopPropagation 会阻止默认动作（区块四的勾选框：只 stopPropagation，照样勾上）。
 * - 用提交按钮的 onClick 代替 form 的 onSubmit：它跑在浏览器校验之前（必填为空也执行），requestSubmit() 之类不经过按钮的提交也管不到；忘了 preventDefault 整页刷新（二-6、区块四）。
 * - 在 setTimeout / await 之后读 e.currentTarget：已经是 null（区块二）；读 e.target、e.type 没问题（17 起）。
 * - 在 onWheel / onTouchMove 里 preventDefault 以为能拦住滚动（区块六）。
 * - 用 document.addEventListener 监听 React 里的点击，又在 React 处理函数里 stopPropagation：document 收不到（区块三）。
 * - 把 <div onClick> 当按钮：键盘用户用 Tab 到不了、按回车 / 空格不触发，读屏软件也不知道它能点（二-8、七；35 题，待新增）。
 * - 判断回车提交时没排除输入法组字（区块五）。
 * - 以为 onMouseEnter 会像 onClick 一样冒泡：它没有捕获阶段，从离开的元素传到进入的元素（二-7）。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：区块三、四的外层 / 中层 div 和 .self 区域绑了 onClick，只用来观察传播；真实项目里可点击的东西用 <button>，非用 div 不可时补 role="button"、tabIndex={0} 和 onKeyDown（回车 / 空格），
 *   可访问性细节见 35 题（待新增）。
 * - 演示简化：区块四的链接用 preventDefault 拦截，应用内跳转要用路由的 <Link>：它内部就是 preventDefault + 前端导航，并且只处理「没按修饰键的左键点击、target 为 _self」，
 *   Ctrl / Cmd / Shift / Alt 点击和中键交给浏览器去开新标签页（react-router 7.18.3 shouldProcessLinkClick，dist/development/chunk-BV7QT456.mjs:7428-7435；路由见 18 题）。
 * - 演示简化：日志、计数都是演示用的副作用；真实处理函数里是 setState、发请求、导航，提交类操作要处理防重复与错误（19 题）。
 * - 需要拦截滚轮 / 触摸（自定义缩放、横向轮播、拖拽）时用 ref + addEventListener(…, { passive: false })，并在 Effect 的清理函数里 removeEventListener（区块六；10、12 题）。
 * - 和第三方库、微前端混用时注意委托位置：React 17+ 在 onClick 里 stopPropagation，挡住的是 root 容器之外的监听器；React 16 的项目连 document 上的都挡不住（八）。
 * - 键盘快捷键：判断组合键时把不想要的修饰键也排除（.exact 的做法），并排除输入法组字（区块五）。
 * - 表单优先用 onSubmit（或 React 19 的 <form action>，31 题，待新增），不要靠按钮的 onClick。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - React 16 及以前大多数事件委托在 document 上：「In React 16 and earlier, React would do document.addEventListener() for most events. React 17 will call rootNode.addEventListener() under the hood instead.」
 *   存量代码里「在 document 上监听、再在 React 里 stopPropagation」的写法，升级到 17 后行为会变。
 * - 事件池与 e.persist()：「With React 16 and earlier, you have to call e.persist() to properly use the event, or read the property you need earlier.」17 起「The old event pooling optimization has been
 *   fully removed」「e.persist() is still available on the React event object, but now it doesn't do anything.」common 页：「persist(): Not used with React DOM.」（19.2.8 里 persist 是空函数，:3403）。
 * - onScroll 在 16 及以前会冒泡：17 changelog「Don't emulate bubbling of the onScroll event.」；onFocus / onBlur 在 16 底层用 focus / blur（React 自己让它冒泡），17 改用 focusin / focusout（「this has not affected the bubbling behavior」）。
 * - class 组件的处理函数：this.handleClick = this.handleClick.bind(this)（在 constructor 里绑定）或类字段箭头函数 handleClick = () => { … }，否则 this 是 undefined；函数组件没有 this 的问题（class 组件的其他写法见 03 题八）。
 * - e.charCode / e.keyCode / e.which：@types/react 里标了 @deprecated（:2132-2133、:2144-2145、:2151-2152），用 e.key / e.code；只有输入法组字判断里仍建议带上 keyCode === 229（区块五）。
 * - FormEvent：@types/react 19.2 标了 @deprecated，onSubmit 用 SubmitEvent、onChange 用 ChangeEvent（07 题）。
 *
 * 九、新动向【较新】【尝鲜】
 * - React Compiler【较新】（本项目不启用）：useCallback 页「React Compiler automatically memoizes values and functions, reducing the need for manual useCallback calls.」内联处理函数也会被记忆化（17 题改写时补）。
 * - React 19.3【尝鲜·19.3.0】（2026-09-09 发布，未满 30 天，本课不用）：发布博客 Changelog「Add support for onFullscreenChange and onFullscreenError events」「Include the submitter in submit events」
 *   「Batch updates from resize events until the next frame」「Fire onReset when React automatically resets a form after a Server Action」；common 参考页暂时还没列出 onFullscreenChange。
 *
 * 十、动手练习
 * 1. 把 PropagationDemo.tsx 里外层 div 的 onClickCapture 改成同时调用 e.stopPropagation()。先猜日志里还剩几行，再改测试验证。可断言：只剩「React 外层 onClickCapture」一行 ——
 *    原生事件在 root 容器的捕获阶段就被停住，中层的捕获、所有 onClick、root 里面的原生监听器、document 全都收不到（react-dom 19.2.8 实测）。
 * 2. 在 ModifiersDemo.tsx 里加一个 Shift + Enter 换行、Enter 提交的 textarea（聊天框常见写法）。可断言：fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true }) 不写「提交」日志，
 *    fireEvent.keyDown(textarea, { key: 'Enter' }) 写一条，且对后者调用了 preventDefault（fireEvent 返回 false）；fireEvent.keyDown(textarea, { key: 'Enter', keyCode: 229 }) 不写「提交」（输入法组字，区块五）。
 *
 * 参考（2026-09-18 核对，react.dev / vuejs.org / legacy.reactjs.org / MDN 文档取自官方仓库原文）：
 * - react.dev：learn/responding-to-events、learn/state-as-a-snapshot、learn/typescript、reference/react-dom/components/common（React event object、Common components）、
 *   reference/react-dom/components/input、reference/react/useCallback、blog/2026/09/09/react-19-3
 * - legacy.reactjs.org：blog/2020/08/10/react-v17-rc（Changes to Event Delegation、Aligning with Browsers、No Event Pooling）、blog/2020/10/20/react-v17（Changelog）
 * - vuejs.org：guide/essentials/event-handling、guide/components/events、guide/components/attrs、api/built-in-directives（v-on）
 * - MDN（③）：EventTarget.addEventListener（passive）、Event.currentTarget、Element: keydown event（IME composition）、KeyboardEvent.isComposing、Element: auxclick event
 * - react-router 7.18.3（shouldProcessLinkClick）
 * - 源码 / 工具：react-dom 19.2.8（cjs/react-dom-client.development.js）、@types/react 19.2.18 index.d.ts、eslint-plugin-react-hooks 7.1.1、@vue/runtime-dom 与 @vue/compiler-dom 3.5.42
 */
import { BindingDemo } from './BindingDemo'
import { DefaultActionDemo } from './DefaultActionDemo'
import { EventObjectDemo } from './EventObjectDemo'
import { ModifiersDemo } from './ModifiersDemo'
import { PassiveWheelDemo } from './PassiveWheelDemo'
import { PropagationDemo } from './PropagationDemo'

export default function Example() {
  return (
    <div className="stack">
      <BindingDemo />
      <EventObjectDemo />
      <PropagationDemo />
      <DefaultActionDemo />
      <ModifiersDemo />
      <PassiveWheelDemo />
    </div>
  )
}
