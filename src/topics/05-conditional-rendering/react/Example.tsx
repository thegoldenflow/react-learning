/**
 * 主题：05. 条件渲染 —— 分支就是 JavaScript、&& 的 0 陷阱、UI 树里的位置决定 state 的去留、隐藏还是卸载
 * 适用版本：React 19.2 · @types/react 19.2 · TypeScript 5.9 · Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：01、02、03（06 题的 key 与本题区块三互为补充）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时，按项目里的使用频率标【最常用】【常用】【少用】，并写出依据（官方原文、官方示例的写法；没有出处的写「工程经验」）。
 *          正文和运行中的演示只有【最常用】【常用】的写法；【少用】的写法没有删，演示代码里注释着（删掉注释块的第一行和最后一行就能运行），讲解集中在文末「附」。
 *          30 秒速答只用【最常用】。带频率标签的写法，成熟度是【主流】时不再重复标。
 * 本课文件：Example.tsx（讲解 + 入口）· BranchStylesDemo.tsx（区块一）· ZeroPitfallDemo.tsx（区块二）· PositionDemo.tsx（区块三）· HideVsUnmountDemo.tsx（区块四）·
 *          demoKit.ts + LogPanel.tsx（演示日志）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - React 没有 v-if，分支就是 JavaScript。项目里最常用的是：JSX 里用 && 决定「有没有」、用三元「二选一」；整个组件要换成加载中 / 出错 / 空状态时，在组件顶部提前 return【主流】。
 * - && 左边是 0 或 NaN 时，React 会把它渲染出来（&& 返回的是左边的值本身），所以左边写成比较表达式：count > 0 &&、list.length > 0 &&【主流】。
 * - state 跟着「UI 树里的位置」走：三元两边是同一个组件时切换不会重置 state；要重置就给不同的 key，例如 key={userId}【主流】。
 * - 条件渲染去掉组件就是卸载，state 和 DOM 都没了；要保留，最常用的是把 state 提升到父组件（或表单库、store）【主流】。
 *
 * 二、核心概念（React）
 * 1. 分支就是 JavaScript【主流】（区块一）：「In React, you can conditionally render JSX using JavaScript syntax like if statements, &&, and ? : operators.」按要做的事选写法：
 *    - 【最常用】有 / 没有用 &&，二选一用三元。官方 Recap：「The shortcuts are common, but you don't have to use them if you prefer plain if.」
 *      &&：「React considers false as a "hole" in the JSX tree, just like null or undefined, and doesn't render anything in its place.」左边要是布尔值（见 2）。
 *    - 【最常用】整个组件换成加载中 / 出错 / 没数据：在组件顶部提前 return。TanStack Query 官方 Overview 的示例就是这样写的：
 *      if (isPending) return 'Loading...'、if (error) return 'An error has occurred: ' + error.message（30 题）。Hooks 要写在所有提前 return 之前（rules-of-hooks「before any early returns」，14 题）。
 *      区块一的 StatusPanel 用 switch 给每个状态各 return 一棵树，是同一种写法。
 *    - 【最常用】几个状态只是文案 / 样式不同：查表，Record<状态, 文案> 比 if 链清楚（区块一的状态徽标；工程经验，不是官方原文）。
 *    - 【常用】只替换页面的一部分、标题这类外框不变：把 JSX 存进变量、用 if 赋值。官方：「This style is the most verbose, but it's also the most flexible.」
 *      Redux 官方教程 Essentials 第 5 章的 PostsList 就是 let content: React.ReactNode 加 if / else if。变量类型写 ReactNode（28 题）。
 *    - 避免两层以上的嵌套三元：「If your components get messy with too much nested conditional markup, consider extracting child components to clean things up.」
 *      拆子组件或改成提前 return（code review 里常见的可读性问题）。
 *    - 【少用】组件自己 return null：演示已注释，见附 1。
 *    三元和 if 写法「completely equivalent」——「JSX elements aren't "instances" because they don't hold any internal state and aren't real DOM nodes. They're lightweight descriptions,
 *    like blueprints.」这句话的后果见 4。每种写法的效果测试覆盖。
 * 2. 0 陷阱【主流】（区块二）：「Don't put numbers on the left side of &&.」「if the left side is 0, then the whole expression gets that value (0), and React will happily render 0 rather than nothing.」
 *    - 【最常用】左边写成比较表达式（官方修法）：「make the left side a boolean: messageCount > 0 && …」；列表写 items.length > 0 &&。
 *    - 【常用】!!count && 或三元 count ? <X /> : null，效果一样（工程经验，官方原文只给了 > 0；区块二的均价一行用的是三元）。
 *    NaN 同样会被渲染成「NaN」（0 / 0 就是 NaN）；true / false / null / undefined / 空字符串 / 空数组都不产生节点（测试覆盖）。
 *    TypeScript 拦不住：ReactNode 本来就包含 number / bigint / boolean / null / undefined（@types/react 19.2.18 index.d.ts:436-449），count && <X /> 的类型检查照样通过。
 *    lint 能拦：eslint-plugin-react 7.30.0 起有 jsx-no-leaked-render 规则（不在它的 recommended 配置里）；本项目没装 eslint-plugin-react，react-hooks 插件不管这件事，所以本项目的 lint 不拦。
 * 3. 多个互斥布尔值 → 一个 status【主流】：分支由一个字面量联合驱动（区块一的 OrderStatus），比 isLoading / isError / isEmpty 几个布尔值组合清楚 —— 「Avoid contradictions in state」（03 题区块五）；
 *    请求状态怎么建模（pending / error / success 三值判别联合，pending 能派生就不存）见 11 题。
 * 4. state 跟着位置走【主流】（区块三）：「State is not kept in JSX tags. It's associated with the tree position in which you put that JSX.」
 *    「Remember that it's the position in the UI tree—not in the JSX markup—that matters to React!」「React doesn't know where you place the conditions in your function. All it "sees" is the tree you return.」
 *    - 同一位置、同一组件：state 保留 ——「It's the same component at the same position, so from React's perspective, it's the same counter.」区块三第一行：{isTaylor ? <DraftEditor customer="Taylor" /> :
 *      <DraftEditor customer="Sarah" />} 切换后，Taylor 的草稿出现在 Sarah 的编辑器里（测试覆盖）—— 真实项目里「切换查看的用户，表单里还是上一个人的数据」就是这个原因。
 *    - 同一位置、换了组件类型：整个子树的 state 被重置 ——「when you render a different component in the same position, it resets the state of its entire subtree.」（react-dom 19.2.8 实测）
 *    - 【最常用】要重置 state 就给不同的 key，例如 <ProfilePage key={userId} />（区块三第二行，测试覆盖）：「Specifying a key tells React to use the key itself as part of the position」，
 *      「Keys aren't just for lists!」官方在 You Might Not Need an Effect 里也用 key 代替「在 Effect 里监听 userId 手动清空 state」：「Instead, you can tell React that each user's profile is
 *      conceptually a different profile by giving it an explicit key.」（key 的完整讲解在 06 题）
 *    - 【少用】渲染到不同位置：演示已注释，见附 2。
 *    - 组件被移除时 state 立刻销毁：「when React removes a component, it destroys its state」。所以条件渲染切走再切回来，是一个全新的实例。
 * 5. 隐藏还是卸载【主流】（区块四）：官方「Preserving state for removed components」列了三种保留 state 的办法。连同「不保留」一起：
 *    - 【最常用】不需要保留就直接卸载：{visible && <Panel />}。state 和 DOM 都没了，Effect 被清理，再显示时重新建立。弹窗、下拉、折叠块大多这样写（工程经验）。
 *    - 【最常用】需要保留时把 state 提升到父组件（或表单库、store）：「This is the most common solution.」子组件照样用 && 卸载，数据在父组件手里，不会丢（区块四的「状态提升」面板，测试覆盖；25 题）。
 *    - 【常用】CSS / hidden 隐藏：<div hidden={!visible}> 或 style={{ display: 'none' }}。组件一直在树里，state、DOM 都在，Effect 一直在跑（订阅、定时器照常工作，测试覆盖）。
 *      官方：「This solution works great for simple UIs. But it can get very slow if the hidden trees are large and contain a lot of DOM nodes.」
 *      hidden 是 HTML 属性（MDN ③：「Web browsers may implement the hidden state using display: none」，给元素设了 CSS display 会覆盖它；「elements that are descendants of a hidden element are still active」）。
 *    - 【少用】<Activity mode="hidden">【较新·19.2 起】、存进 localStorage：演示已注释，见附 3。
 *
 * 三、Vue 对照（Vue 这一侧的演示都是 Vue 项目里常用的写法，没有注释掉的部分）
 * - 分支：v-if / v-else-if / v-else【最常用】（vue/BranchStylesDemo.vue）：「The block will only be rendered if the directive's expression returns a truthy value.」v-else / v-else-if
 *   「must immediately follow」前一个分支；一次切好几个元素写 <template v-if>（「serves as an invisible wrapper」）。React 没有指令，同样的事用 JS 表达式写。
 * - 0 陷阱【主流】（vue/ZeroPitfallDemo.vue）：v-if 按 truthy 判断，0、NaN 都不渲染（测试覆盖）；但插值 {{ count && '…' }} 的值就是 0，会显示「0」；
 *   false 也会显示成「false」（{{ isVip && '会员价' }}，React 不渲染 false，这一点 Vue 更容易踩），插值里的条件写三元（cond ? '…' : ''）或改用 v-if（测试覆盖）。
 *   文档没有写插值怎么显示各种值，依据是源码 @vue/shared 3.5.42 的 toDisplayString（shared.cjs.js:518-520：null / undefined 显示空串，其他原始值 String(val)）。
 * - 模板里的 v-if / v-else 切换时换一个实例【主流】（vue/PositionDemo.vue；前提是没包 <KeepAlive>）：API 页「When a v-if element is toggled, the element and its contained directives / components are destroyed and re-constructed.」
 *   原因是编译器给每个分支注入了不同的 key（测试覆盖，源码位置见附 4），所以 React 区块三第一行的「state 串到另一分支」在 Vue 模板的 v-if / v-else 里不会发生。
 *   Vue 模板里只写一个组件、把变化的部分做成 prop（<DraftEditor :customer="customer" />）时一样会复用实例，同样用 :key 解决
 *   （「It can also be used to force replacement of an element/component instead of reusing it.」，测试覆盖）—— 和 React 的 key={userId} 是同一个做法。
 * - 隐藏：v-show【常用】（vue/HideVsUnmountDemo.vue）：「an element with v-show will always be rendered and remain in the DOM; v-show only toggles the display CSS property of the element.」
 *   相当于 React 用 hidden / CSS 隐藏；「v-show doesn't support the <template> element, nor does it work with v-else.」
 *   惰性：「v-if is also lazy: if the condition is false on initial render, it will not do anything - the conditional block won't be rendered until the condition becomes true for the first time.」
 *   React 同理：&& / 三元在条件为真之前什么都不渲染；hidden / CSS 隐藏会先把内容渲染出来（首次就是 hidden 的 <Activity> 也会先渲染，只是优先级低、不挂 Effect，见附 3）。
 *   怎么选：「v-if has higher toggle costs while v-show has higher initial render costs. So prefer v-show if you need to toggle something very often, and prefer v-if if the condition is unlikely to change at runtime.」
 * - 缓存：<KeepAlive>【常用】：缓存组件实例 ——「it goes into a deactivated state instead of being unmounted」，走 onDeactivated / onActivated（首次挂载时 onMounted 之后也会调一次 onActivated，测试覆盖）；
 *   项目里最常见的是包住 <router-view> 做后台多标签页（工程经验）。React 这边对应的是 <Activity>（少用，见附 3）；两者都保留 state 和 DOM，
 *   不同在于 Activity 由 React 清理 Effect，KeepAlive 停用期间 watch 照样触发、组件照样重新渲染，要停订阅得自己在 onDeactivated 里做（测试覆盖）。
 * - v-if 与 v-for 同一元素【主流】：「v-if will be evaluated first」，v-if 里读不到循环变量，官方不推荐同用 —— 列表先过滤（computed）或把 v-if 挪到外层容器（见 06 题三，编译结果有测试）。
 *   React 没有指令优先级的问题：先 filter 再 map。
 *
 * 四、关键区别（每条写明前提）
 * 1. 写法：Vue 模板用指令（Vue 的渲染函数 / JSX 同样用 JS 表达式）；React 只有 JSX，任何版本都用 JS 表达式，JSX 里不能直接写 if 语句（要写在 return 之前，或存进变量）。
 * 2. 假值：React 的 && 会把 0 / NaN 渲染出来，false 不渲染；Vue 的 v-if 按 truthy 判断，都不渲染；Vue 插值里的 && 会把 0 / NaN 显示出来，连 false 也显示成「false」。
 * 3. 分支切换时的实例：React 按「位置 + 类型 + key」决定复用还是重建，三元两边同类型就复用；Vue 模板里的 v-if / v-else 编译时给分支加了不同的 key，没包 <KeepAlive> 时
 *    切换就重建（Vue 用渲染函数写三元时的情况见附 4）。
 * 4. 保留状态的隐藏：Vue 有内置的 v-show 和 <KeepAlive>；React 最常用的是状态提升，也常用 CSS / hidden 属性，19.2 起有 <Activity>。副作用的处理不同：CSS / hidden 和 v-show 什么都不停；
 *    Activity 由 React 清理 Effect；KeepAlive 停用时 watch 和重新渲染都不停，只多调一次 onDeactivated，要停得自己写。
 *
 * 五、常见追问与回答要点
 * - count && <List /> 为什么出现 0？怎么修？&& 返回左边的值，0 是数字会被渲染；改成 count > 0 &&。NaN 同理，空字符串不渲染；TypeScript 拦不住（ReactNode 含 number）。
 * - 三元两个分支都是 <Counter>，切换时 state 会重置吗？不会，同一位置同一类型就是同一个组件；要重置就给不同的 key（区块三）。
 * - 切换查看的用户，表单里还是上一个人的数据，怎么修？给表单组件加 key={userId}；不要在 Effect 里监听 userId 手动清空（官方 You Might Not Need an Effect）。
 * - 为什么说是「树中的位置」而不是 JSX 结构决定？React 只看组件函数返回的树，看不到你的 if 写在哪；两个 return 里同一位置的 <Counter> 对 React 来说是同一个。
 * - Tab 切走再切回来，输入的内容没了，怎么办？最常用的是把数据提升到父组件或表单库；内容少、切换频繁时用 CSS 隐藏。
 * - React 为什么没有 v-if？JSX 就是 JavaScript，分支交给 JS 的 if / 三元 / &&；复杂分支拆子组件或存进变量。
 * - React 里有 v-show 吗？没有同名 API；用 hidden 属性或 CSS 隐藏（state、DOM、Effect 都保留），或者 19.2 的 <Activity>（保留 state 和 DOM，清理 Effect，隐藏期间低优先级更新）。
 * - return null 和用 CSS 隐藏有什么区别？return null 的组件自己还在树里（它的 state 和 Effect 都在），只是不输出 DOM，但它原来渲染的子组件被卸载了（子组件的 state 丢了，
 *   测试覆盖）；父组件用 && 把它去掉才是它自己被卸载。CSS 隐藏时 DOM 和 state 都在、Effect 照跑。
 * - 多个状态用什么建模？一个字面量联合的 status，比几个布尔值组合清楚（03 题区块五，11 题）。
 * - Vue 模板里的 v-if / v-else 切换会销毁重建（没包 KeepAlive 时），React 同类型同位置默认复用，这会带来什么 bug？从 Vue 迁到 React 时，以为切换分支就是新组件，结果上一个分支的 state（表单、滚动位置）被带到了下一个分支。
 *
 * 六、易错点
 * - {count && …}、{items.length && …}：0 被渲染出来（区块二）。
 * - 三元两边是同一个组件，以为切换会重置 state（区块三）；切换「查看的是谁」时忘了加 key（06 题、18 题的实例复用）。
 * - 想保留输入内容的 Tab 用 && 切换、state 又放在 Tab 自己里面，切回来输入没了（区块四）。
 * - 在提前 return 之后调用 Hook（「Do not call Hooks after a conditional return statement.」）。
 * - 以为 hidden 属性 / CSS 隐藏就是卸载：组件还在，Effect、定时器、订阅照样在跑（区块四）。
 * - 用 hidden 属性时又给元素写了 display: flex 之类的 CSS：hidden 被覆盖，元素照样显示（MDN）。
 * - 以为 return null 就卸载了组件：它自己还在，只是不输出 DOM，它的 state 和 Effect 都还在；反过来，它原来渲染的子组件确实被卸载了（五，测试覆盖）。
 * - 以为 <Activity mode="hidden"> 和 v-show 一样什么都不停：Effect 会被清理（附 3）。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：区块一的 status 在前端切换；真实页面里状态来自接口，请求中 / 失败 / 空列表各有分支，要区分「空列表」和「还没加载」（11、30 题）。
 * - 演示简化：区块四「状态提升」面板把数据放在区块自己的 state 里；真实的多 Tab 表单通常交给表单库或放到 store（25、16 题），需要跨刷新保留的草稿存进 localStorage（03 题七）。
 * - 大的隐藏子树用 CSS 隐藏会一直占着 DOM、Effect 一直跑；用 <Activity> 时记得处理隐藏后还在播放的媒体（附 3）。
 * - 按权限隐藏按钮只是体验，鉴权必须在后端（18 题；35 题，待新增）。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - class 组件：分支写在 render() 里（if / 三元），或者拆成 renderHeader()、renderEmpty() 这类辅助方法；函数组件里对应的是拆子组件或普通函数。class 组件同样遵守「位置决定 state」。
 * - React 19.2 之前（18、19.0、19.1）的稳定版没有 <Activity>，保留隐藏内容的 state 主要靠状态提升、CSS 隐藏、存进 React 之外的数据源，或者第三方的 keep-alive 库。
 *
 * 九、新动向【尝鲜】
 * - React 19.3【尝鲜·19.3.0】（2026-09-09 发布，未满 30 天，本课不用；本仓库的 react 19.2.8 没有导出它）：<ViewTransition> 转为稳定 ——「The new <ViewTransition> component lets you animate elements
 *   as they enter, exit, move, or resize using the browser's View Transition API.」把 <ViewTransition> 放在条件里面、直接包住要进出的内容
 *   （{show && <ViewTransition><X /></ViewTransition>}），它随内容一起挂载 / 卸载时触发动画（19.3 博客：「enter: the <ViewTransition> is added.」「exit: the <ViewTransition> is removed.」），
 *   但只有 Transition 更新才会触发：「Note that updates not marked as
 *   Transitions don't trigger animations」；「<ViewTransition> only activates exit/enter if it is placed before any DOM nodes.」（ViewTransition 参考页）。和 <Activity> 配合时，显示 / 隐藏也会触发进入 / 退出动画。
 * - 19.2 博客：「In the future, we plan to add more modes to Activity for different use cases.」
 *
 * 十、动手练习
 * 1. 把 PositionDemo.tsx 第一行的三元改成 {isTaylor ? <DraftEditor customer="Taylor" /> : <p>Sarah 暂无备注</p>}。可断言：在 Taylor 的输入框里打字、切到 Sarah、再切回 Taylor，输入框是空的
 *    （中间换成了 <p>，同一位置换了类型，DraftEditor 被卸载）。
 * 2. 把 HideVsUnmountDemo.tsx 里 LiftedPanel 的输入框改回非受控（去掉 value 和 onChange，草稿不再提升）。可断言：隐藏再显示后点赞数还在、输入框是空的 —— 只有提升到父组件的数据才留得住。
 * 3. 取消 HideVsUnmountDemo.tsx 里 <Activity> 面板和文件顶部 import 的注释，再取消 Example.test.tsx 区块四测试里两处【少用】注释。可断言：测试通过，
 *    隐藏时 Activity 面板的 style 是 display: none !important，日志里它有「Effect 清理」，再显示时点赞数和输入内容都在。
 *
 * 附：少用的写法与细节（演示代码里对应的部分已注释，删掉注释块的第一行和最后一行就能运行；读别人的代码时认得出来就行）
 * 1. 【少用】组件自己 return null（BranchStylesDemo.tsx 的 RestoreHint，已注释）：「In practice, returning null from a component isn't common because it might surprise a developer trying to
 *    render it. More often, you would conditionally include or exclude the component in the parent component's JSX.」return null 的组件自己还在树里（state、Effect 都在），只是不输出 DOM；
 *    它原来渲染的子组件被卸载（测试用独立组件覆盖）。
 * 2. 【少用】渲染到不同位置来重置 state（PositionDemo.tsx 第三行，已注释）：官方列的两种重置办法是「1. Render components in different positions 2. Give each component an explicit identity with key」；
 *    第一种「is convenient when you only have a few independent components rendered in the same place」，官方示例正好是两个 &&（「Each Counter's state gets destroyed each time it's
 *    removed from the DOM.」）。分支一多就不好维护，项目里重置 state 基本用 key。
 * 3. 【少用】<Activity mode="hidden">【较新·19.2 起】（HideVsUnmountDemo.tsx 的 Activity 面板，已注释；结论由 Example.test.tsx 里的独立组件验证）：19.2（2025-10-01）才有，18 / 19.0 / 19.1 的项目用不了。
 *    「<Activity> lets you hide and restore the UI and internal state of its children.」「When an Activity boundary is hidden, React will visually hide its children using the display: "none" CSS property.
 *    It will also destroy their Effects, cleaning up any active subscriptions.」「While hidden, children still re-render in response to new props, albeit at a lower priority」。
 *    19.2 发布博客（2025-10-01）：「You can use Activity as an alternative to conditionally rendering parts of your app」；参考页没有标起始版本，版本依据是这篇博客、@types/react 19.2.18 的
 *    @version 19.2.0 标注（index.d.ts:2013）与 react 19.2.8 的导出（react.development.js:795 exports.Activity）。实测：隐藏时子元素加上 style="display: none !important;"，Effect 清理，
 *    state 与 DOM 保留；再显示时 style 变回空、Effect 重新建立（测试覆盖）。首次渲染就是 hidden 时：「they will _still be rendered_, albeit at a lower priority than the visible content,
 *    and without mounting their Effects.」
 *    Troubleshooting：隐藏的 <video>、<audio>、<iframe> 还在 DOM 里，要在清理函数里暂停。官方示例用的是 useLayoutEffect：「We call useLayoutEffect instead of useEffect because
 *    conceptually the clean-up code is tied to the component's UI being visually hidden.」「you should think of "hidden" Activities as being unmounted」。
 *    Caveats：只渲染纯文本的组件放在 hidden 的 Activity 里什么都不输出（没有 DOM 元素可以加 display: none）。
 *    【少用】存进 React 之外的数据源（localStorage）：官方列的第三种保留办法，草稿要跨刷新保留时才用（03 题七的 try / catch）。
 * 4. 细节（了解即可）：
 *    - bigint 也当文本渲染：0n 渲染成「0」（测试覆盖）。
 *    - Vue 模板 v-if / v-else 注入 key 的源码位置：@vue/compiler-core 3.5.42 compiler-core.cjs.js:4702-4732 按分支序号算 key（key: 0、key: 1），4837-4883 生成 key 属性并注入 vnode。
 *    - 这是模板编译器的行为，不是框架的差别：Vue 的渲染函数 / JSX 里写三元（ok ? h(Editor, …) : h(Editor, …)；guide/extras/render-function 的 v-if 一节给的等价写法就是三元）
 *      没有编译器注入的 key，两边同一个组件时和 React 一样复用实例（测试覆盖）。
 *    - 组件上的 v-show 不走挂载 / 卸载（也不走停用 / 激活）钩子，但每次切换组件都会被父组件强制更新一次，onBeforeUpdate / onUpdated 照常调用
 *      （@vue/runtime-core 3.5.42 runtime-core.cjs.js:4842：vnode 带指令就强制更新，测试覆盖）。
 *    - KeepAlive 停用时把缓存的组件 DOM 移进存储容器、激活时插回同一个元素（runtime-core.cjs.js:2919-2936，没有停组件的 effect）；Activity 用 display: none 把 DOM 留在原地（两侧测试覆盖）。
 *    - Vue 2 的 v-if 与 v-for 优先级相反（v3 迁移指南）：「In 2.x, when using v-if and v-for on the same element, v-for would take precedence.」
 *
 * 参考（2026-09-18 核对，react.dev / vuejs.org / MDN 文档取自官方仓库原文）：
 * - react.dev：learn/conditional-rendering、learn/preserving-and-resetting-state、learn/you-might-not-need-an-effect、learn/choosing-the-state-structure、reference/react/Activity、
 *   reference/react/ViewTransition、reference/rules/rules-of-hooks、reference/react-dom/components/common（hidden）、blog/2025/10/01/react-19-2、blog/2026/09/09/react-19-3
 * - 使用频率的依据：TanStack Query docs/framework/react/overview.md（提前 return）、Redux docs/tutorials/essentials/part-5-async-logic.md（let content 加 if / else if）
 * - vuejs.org：guide/essentials/conditional、guide/essentials/list（v-for with v-if）、guide/built-ins/keep-alive、api/built-in-directives（v-if、v-show、v-else）、api/built-in-special-attributes（key）、
 *   api/built-in-components（KeepAlive）、guide/essentials/template-syntax、guide/extras/render-function（v-if）；v3-migration.vuejs.org：breaking-changes/v-if-v-for
 * - MDN（③）：Global attributes / hidden
 * - 源码 / 工具：react 19.2.8、react-dom 19.2.8、@types/react 19.2.18 index.d.ts、@vue/compiler-core、@vue/runtime-core 与 @vue/shared 3.5.42；
 *   eslint-plugin-react 仓库 docs/rules/jsx-no-leaked-render.md 与 CHANGELOG（7.30.0，2022-05-18）
 */
import { BranchStylesDemo } from './BranchStylesDemo'
import { HideVsUnmountDemo } from './HideVsUnmountDemo'
import { PositionDemo } from './PositionDemo'
import { ZeroPitfallDemo } from './ZeroPitfallDemo'

export default function Example() {
  return (
    <div className="stack">
      <BranchStylesDemo />
      <ZeroPitfallDemo />
      <PositionDemo />
      <HideVsUnmountDemo />
    </div>
  )
}
