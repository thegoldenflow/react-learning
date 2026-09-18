/**
 * 主题：05. 条件渲染 —— 分支就是 JavaScript、&& 的 0 陷阱、UI 树里的位置决定 state 的去留、隐藏还是卸载（hidden 与 <Activity>）
 * 适用版本：React 19.2 · @types/react 19.2 · TypeScript 5.9 · Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：01、02、03（06 题的 key 与本题区块三互为补充）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 入口）· BranchStylesDemo.tsx（区块一）· ZeroPitfallDemo.tsx（区块二）· PositionDemo.tsx（区块三）· HideVsUnmountDemo.tsx（区块四）·
 *          demoKit.ts + LogPanel.tsx（演示日志）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - React 没有 v-if 这类指令，分支就是 JavaScript：if / switch 里提前 return、三元 ? :、&&、把 JSX 存进变量、查表都行；嵌套的三元多了就拆子组件或提前 return【主流】。
 * - 左边是假值时，&& 返回的就是左边这个值本身（不是 false）：左边是 0 或 NaN，React 会把它渲染出来，所以左边写成布尔值（count > 0 &&）【主流】。
 * - state 跟着「UI 树里的位置」走，不跟着 JSX 标签走：三元两边是同一个组件时切换不会重置 state；要重置就给不同的 key，或者渲染到不同位置【主流】。
 * - 条件渲染把组件从树上去掉（&& 变成 false、三元换成别的类型或别的 key）就是卸载，state 和 DOM 都没了；想保留就用 CSS / hidden 属性隐藏、把 state 提升到父组件，或者用 19.2 的 <Activity mode="hidden">（保留 state 和 DOM、清理 Effect）【主流】/【较新·19.2 起】。
 *
 * 二、核心概念（React）
 * 1. 分支就是 JavaScript【主流】（区块一）：「In React, you can conditionally render JSX using JavaScript syntax like if statements, &&, and ? : operators.」
 *    「In React, control flow (like conditions) is handled by JavaScript.」Recap：「The shortcuts are common, but you don't have to use them if you prefer plain if.」
 *    - if / switch 里各自 return 一棵 JSX 树（区块一的 StatusPanel）；Hooks 要写在所有提前 return 之前（rules-of-hooks「before any early returns」，14 题）。
 *    - return null：组件什么都不渲染 ——「In practice, returning null from a component isn't common because it might surprise a developer trying to render it. More often, you would conditionally
 *      include or exclude the component in the parent component's JSX.」（区块一的 RestoreHint 只为演示）。
 *    - 把 JSX 存进变量：「This style is the most verbose, but it's also the most flexible.」变量类型写 ReactNode（28 题）。
 *    - 三元：二选一。和 if 写法「completely equivalent」——「JSX elements aren't "instances" because they don't hold any internal state and aren't real DOM nodes. They're lightweight descriptions,
 *      like blueprints.」这句话的后果见 4。嵌套太多：「If your components get messy with too much nested conditional markup, consider extracting child components to clean things up.」
 *    - &&：「React considers false as a "hole" in the JSX tree, just like null or undefined, and doesn't render anything in its place.」
 *    - 查表：多分支只取不同文案 / 样式时，Record<状态, 文案> 比 if 链清楚（这是工程惯例，不是官方原文）。
 *    每种写法的效果测试覆盖。
 * 2. 0 陷阱【主流】（区块二）：「Don't put numbers on the left side of &&.」「if the left side is 0, then the whole expression gets that value (0), and React will happily render 0 rather than nothing.」
 *    官方修法：「make the left side a boolean: messageCount > 0 && …」。NaN 同样会被渲染成「NaN」（0 / 0 就是 NaN）；区块二测试覆盖 0 与 NaN。
 *    一次说全：true / false / null / undefined / 空字符串 / 空数组都不产生节点；数字（包括 0、NaN）和 bigint（包括 0n，渲染成「0」）当作文本渲染（测试覆盖）。
 *    !!x、Boolean(x)、三元 … : null 也能把左边变成布尔值 / 明确的 null（这几种是补充写法，官方原文只给了 > 0）。
 *    TypeScript 拦不住：ReactNode 本来就包含 number / bigint / boolean / null / undefined（@types/react 19.2.18 index.d.ts:436-449），count && <X /> 的类型检查照样通过。
 *    lint 能拦：eslint-plugin-react 7.30.0 起有 jsx-no-leaked-render 规则（不在它的 recommended 配置里）；本项目没装 eslint-plugin-react，react-hooks 插件不管这件事，所以本项目的 lint 不拦。
 * 3. 多个互斥布尔值 → 一个 status【主流】：分支由一个字面量联合驱动（区块一的 OrderStatus），比 isLoading / isError / isEmpty 几个布尔值组合清楚 —— 「Avoid contradictions in state」（03 题区块五）；
 *    请求状态怎么建模（pending / error / success 三值判别联合，pending 能派生就不存）见 11 题。
 * 4. state 跟着位置走【主流】（区块三）：「State is not kept in JSX tags. It's associated with the tree position in which you put that JSX.」
 *    「Remember that it's the position in the UI tree—not in the JSX markup—that matters to React!」「React doesn't know where you place the conditions in your function. All it "sees" is the tree you return.」
 *    - 同一位置、同一组件：state 保留 ——「It's the same component at the same position, so from React's perspective, it's the same counter.」区块三第一行：{isTaylor ? <DraftEditor customer="Taylor" /> :
 *      <DraftEditor customer="Sarah" />} 切换后，Taylor 的草稿出现在 Sarah 的编辑器里（测试覆盖）—— 真实项目里「切换查看的用户，表单里还是上一个人的数据」就是这个原因。
 *    - 同一位置、换了组件类型：整个子树的 state 被重置 ——「when you render a different component in the same position, it resets the state of its entire subtree.」（react-dom 19.2.8 实测）
 *    - 重置的两种办法：「1. Render components in different positions 2. Give each component an explicit identity with key」（区块三第二、三行，测试覆盖）；
 *      「Specifying a key tells React to use the key itself as part of the position」，「Keys aren't just for lists!」（key 的完整讲解在 06 题）。
 *    - 组件被移除时 state 立刻销毁：「when React removes a component, it destroys its state」。所以条件渲染切走再切回来，是一个全新的实例。
 * 5. 隐藏还是卸载【主流】（区块四）：官方「Preserving state for removed components」列了三种保留 state 的办法 —— CSS 隐藏（「This solution works great for simple UIs. But it can get very slow if the hidden
 *    trees are large」）、把 state 提升到父组件（「This is the most common solution.」，25 题）、存进 React 之外的数据源（localStorage）。区块四对比三种「看不见」（测试覆盖）：
 *    - {visible && <Panel />}：卸载。点赞数（React state）和输入框里的字（DOM 状态）都没了；Effect 被清理，再显示时重新建立。
 *    - <div hidden={!visible}>：组件一直在树里，state、DOM 都在，Effect 一直在跑（订阅、定时器照常工作）。hidden 是 HTML 属性（MDN ③：「Web browsers may implement the hidden state using
 *      display: none」，给元素设了 CSS display 会覆盖它；「elements that are descendants of a hidden element are still active」）。用 style={{ display: 'none' }} 效果相同。
 *    - <Activity mode="hidden">【较新·19.2 起】：「<Activity> lets you hide and restore the UI and internal state of its children.」「When an Activity boundary is hidden, React will visually hide its children using
 *      the display: "none" CSS property. It will also destroy their Effects, cleaning up any active subscriptions.」「While hidden, children still re-render in response to new props, albeit at a lower priority」。
 *      19.2 发布博客（2025-10-01）：「You can use Activity as an alternative to conditionally rendering parts of your app」；参考页没有标起始版本，版本依据是这篇博客、@types/react 19.2.18 的
 *      @version 19.2.0 标注（index.d.ts:2013）与 react 19.2.8 的导出（react.development.js:795 exports.Activity）。实测：隐藏时子元素加上 style="display: none !important;"，Effect 清理，
 *      state 与 DOM 保留；再显示时 style 变回空、Effect 重新建立（测试覆盖）。首次渲染就是 hidden 时：「they will _still be rendered_, albeit at a lower priority than the visible content,
 *      and without mounting their Effects.」
 *      Troubleshooting：隐藏的 <video>、<audio>、<iframe> 还在 DOM 里，要在清理函数里暂停。官方示例用的是 useLayoutEffect：「We call useLayoutEffect instead of useEffect because
 *      conceptually the clean-up code is tied to the component's UI being visually hidden.」「you should think of "hidden" Activities as being unmounted」。
 *      Caveats：只渲染纯文本的组件放在 hidden 的 Activity 里什么都不输出（没有 DOM 元素可以加 display: none）。
 *
 * 三、Vue 对照
 * - v-if / v-else-if / v-else【主流】（vue/BranchStylesDemo.vue）：「The block will only be rendered if the directive's expression returns a truthy value.」v-else / v-else-if「must immediately follow」前一个分支；
 *   一次切好几个元素写 <template v-if>（「serves as an invisible wrapper」）。React 没有指令，同样的事用 JS 表达式写。
 * - 0 陷阱【主流】（vue/ZeroPitfallDemo.vue）：v-if 按 truthy 判断，0、NaN 都不渲染（测试覆盖）；但插值 {{ count && '…' }} 的值就是 0，会显示「0」；
 *   false 也会显示成「false」（{{ isVip && '会员价' }}，React 不渲染 false，这一点 Vue 更容易踩），插值里的条件写三元（cond ? '…' : ''）或改用 v-if（测试覆盖）。
 *   文档没有写插值怎么显示各种值，依据是源码 @vue/shared 3.5.42 的 toDisplayString（shared.cjs.js:518-520：null / undefined 显示空串，其他原始值 String(val)）。
 * - 模板里的 v-if / v-else 切换时换一个实例【主流】（vue/PositionDemo.vue；前提是没包 <KeepAlive>，包了就是区块四的缓存）：API 页「When a v-if element is toggled, the element and its contained directives / components are destroyed and re-constructed.」
 *   原因是编译器给每个分支注入了不同的 key（key: 0、key: 1，@vue/compiler-core 3.5.42 compiler-core.cjs.js:4702-4732 按分支序号算 key、4837-4883 生成 key 属性并注入 vnode，
 *   测试覆盖）。所以 React 区块三第一行的「state 串到另一分支」在 Vue 模板的 v-if / v-else 里不会发生。这是模板编译器的行为，不是框架的差别：Vue 的渲染函数 / JSX 里写三元
 *   （ok ? h(Editor, …) : h(Editor, …)；guide/extras/render-function 的 v-if 一节给的等价写法就是三元）没有编译器注入的 key，两边同一个组件时和 React 一样复用实例（测试覆盖）。
 *   Vue 模板里只写一个组件、把变化的部分做成 prop（<DraftEditor :customer="customer" />）才会出现同样的现象，同样用 :key 解决
 *   （「It can also be used to force replacement of an element/component instead of reusing it.」，测试覆盖）。
 * - v-show【主流】（vue/HideVsUnmountDemo.vue）：「an element with v-show will always be rendered and remain in the DOM; v-show only toggles the display CSS property of the element.」
 *   相当于 React 用 hidden / CSS 隐藏；「v-show doesn't support the <template> element, nor does it work with v-else.」组件上的 v-show 不走挂载 / 卸载（也不走停用 / 激活）钩子，
 *   但每次切换组件都会被父组件强制更新一次，onBeforeUpdate / onUpdated 照常调用（@vue/runtime-core 3.5.42 runtime-core.cjs.js:4842：vnode 带指令就强制更新，测试覆盖）。
 *   惰性：「v-if is also lazy: if the condition is false on initial render, it will not do anything - the conditional block won't be rendered until the condition becomes true for the first time.」
 *   React 同理：&& / 三元在条件为真之前什么都不渲染；hidden / CSS 隐藏和 <Activity mode="hidden"> 会先把内容渲染出来（Activity 以较低优先级渲染、不挂 Effect）。
 *   怎么选：「v-if has higher toggle costs while v-show has higher initial render costs. So prefer v-show if you need to toggle something very often, and prefer v-if if the condition is unlikely to change at runtime.」
 * - <KeepAlive>【主流】：缓存组件实例 ——「it goes into a deactivated state instead of being unmounted」，走 onDeactivated / onActivated（首次挂载时 onMounted 之后也会调一次 onActivated，测试覆盖）。
 *   和 React 的 <Activity> 相同的是都保留 state 和 DOM、都给了一个「被藏起来」的时机；不同有两点：① Activity 由 React 清理 Effect，KeepAlive 停用只是把 DOM 移进
 *   存储容器、调 onDeactivated（runtime-core.cjs.js:2919-2936，没有停组件的 effect），watch / watchEffect 照样触发，缓存里的组件照样随数据重新渲染，要停订阅得自己在
 *   onDeactivated 里做（测试覆盖 watch 与重新渲染）；② KeepAlive 把缓存的组件 DOM 移出文档、激活时插回同一个元素，
 *   Activity 用 display: none 把 DOM 留在原地（两侧测试覆盖）。
 * - v-if 与 v-for 同一元素【主流】：「v-if will be evaluated first」，v-if 里读不到循环变量，官方不推荐同用 —— 列表先过滤（computed）或把 v-if 挪到外层容器（06 题改写时补）。
 *   Vue 2 相反（v3 迁移指南）：「In 2.x, when using v-if and v-for on the same element, v-for would take precedence.」React 没有指令优先级的问题：先 filter 再 map。
 *
 * 四、关键区别（每条写明前提）
 * 1. 写法：Vue 模板用指令（Vue 的渲染函数 / JSX 同样用 JS 表达式）；React 只有 JSX，任何版本都用 JS 表达式，JSX 里不能直接写 if 语句（要写在 return 之前，或存进变量）。
 * 2. 假值：React 的 && 会把 0 / NaN 渲染出来，false 不渲染；Vue 的 v-if 按 truthy 判断，都不渲染；Vue 插值里的 && 会把 0 / NaN 显示出来，连 false 也显示成「false」。
 * 3. 分支切换时的实例：React 按「位置 + 类型 + key」决定复用还是重建，三元两边同类型就复用；Vue 模板里的 v-if / v-else 编译时给分支加了不同的 key，没包 <KeepAlive> 时
 *    切换就重建；Vue 用渲染函数 / JSX 写三元时没有这个 key，同类型同样复用（测试覆盖）。
 * 4. 保留状态的隐藏：Vue 有内置的 v-show 和 <KeepAlive>；React 用 CSS / hidden 属性、状态提升，19.2 起有 <Activity>。副作用的处理不同：CSS / hidden 和 v-show 什么都不停；
 *    Activity 由 React 清理 Effect；KeepAlive 停用时 watch 和重新渲染都不停，只多调一次 onDeactivated，要停得自己写。
 *
 * 五、常见追问与回答要点
 * - count && <List /> 为什么出现 0？怎么修？&& 返回左边的值，0 是数字会被渲染；改成 count > 0 &&。NaN 同理，空字符串不渲染；TypeScript 拦不住（ReactNode 含 number）。
 * - return null 和用 CSS 隐藏有什么区别？return null 的组件自己还在树里（它的 state 和 Effect 都在），只是不输出 DOM，但它原来渲染的子组件被卸载了（子组件的 state 丢了，
 *   测试覆盖）；父组件用 && 把它去掉才是它自己被卸载。CSS 隐藏时 DOM 和 state 都在、Effect 照跑。
 * - 三元两个分支都是 <Counter>，切换时 state 会重置吗？不会，同一位置同一类型就是同一个组件；要重置就给不同的 key，或者渲染到不同位置（区块三）。
 * - 为什么说是「树中的位置」而不是 JSX 结构决定？React 只看组件函数返回的树，看不到你的 if 写在哪；两个 return 里同一位置的 <Counter> 对 React 来说是同一个。
 * - React 为什么没有 v-if？JSX 就是 JavaScript，分支交给 JS 的 if / 三元 / &&；复杂分支拆子组件或存进变量。
 * - React 里有 v-show 吗？没有同名 API；用 hidden 属性或 CSS 隐藏（state、DOM、Effect 都保留），或者 19.2 的 <Activity>（保留 state 和 DOM，清理 Effect，隐藏期间低优先级更新）。
 * - 多个状态用什么建模？一个字面量联合的 status，比几个布尔值组合清楚（03 题区块五，11 题）。
 * - Vue 模板里的 v-if / v-else 切换会销毁重建（没包 KeepAlive 时），React 同类型同位置默认复用，这会带来什么 bug？从 Vue 迁到 React 时，以为切换分支就是新组件，结果上一个分支的 state（表单、滚动位置）被带到了下一个分支。
 *
 * 六、易错点
 * - {count && …}、{items.length && …}：0 被渲染出来（区块二）。
 * - 三元两边是同一个组件，以为切换会重置 state（区块三）；切换「查看的是谁」时忘了加 key（06 题、18 题的实例复用）。
 * - 想保留输入内容的 Tab 用 && 切换，切回来输入没了（区块四）。
 * - 在提前 return 之后调用 Hook（「Do not call Hooks after a conditional return statement.」）。
 * - 以为 return null 就卸载了组件：它自己还在，只是不输出 DOM，它的 state 和 Effect 都还在；反过来，它原来渲染的子组件确实被卸载了（五，测试覆盖）。
 * - 用 hidden 属性时又给元素写了 display: flex 之类的 CSS：hidden 被覆盖，元素照样显示（MDN）。
 * - 以为 hidden 属性 / CSS 隐藏就是卸载：组件还在，Effect、定时器、订阅照样在跑（区块四）。
 * - 以为 <Activity mode="hidden"> 和 v-show 一样什么都不停：Effect 会被清理（区块四）。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：区块四的面板是本地 state；真实的多 Tab 表单通常把数据提升到父组件或表单库里，切 Tab 用 && 卸载也不怕丢（25 题）；需要跨刷新保留的草稿存进 localStorage（03 题七的 try / catch）。
 * - 演示简化：区块一的 status 在前端切换；真实页面里状态来自接口，请求中 / 失败 / 空列表各有分支，要区分「空列表」和「还没加载」（11、30 题）。
 * - 大的隐藏子树用 CSS 隐藏会一直占着 DOM、Effect 一直跑；用 <Activity> 时记得处理隐藏后还在播放的媒体（在 useLayoutEffect 的清理函数里暂停，见二-5）。
 * - 按权限隐藏按钮只是体验，鉴权必须在后端（18 题；35 题，待新增）。
 * - 嵌套三元超过两层时，通常拆成子组件或提前 return（工程惯例；官方原文只说「consider extracting child components」），code review 里常见的可读性问题。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - class 组件：分支写在 render() 里（if / 三元），或者拆成 renderHeader()、renderEmpty() 这类辅助方法；函数组件里对应的是拆子组件或普通函数。class 组件同样遵守「位置决定 state」。
 * - React 19.2 之前（18、19.0、19.1）的稳定版没有 <Activity>，保留隐藏内容的 state 主要靠 CSS 隐藏、状态提升、存进 React 之外的数据源，或者第三方的 keep-alive 库。
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
 * 2. 把 HideVsUnmountDemo.tsx 的 hidden 面板改成 <div style={{ display: visible ? undefined : 'none' }}>。可断言：隐藏再显示后点赞数和输入内容都在，日志里这块面板没有「Effect 清理」。
 *
 * 参考（2026-09-18 核对，react.dev / vuejs.org / MDN 文档取自官方仓库原文）：
 * - react.dev：learn/conditional-rendering、learn/preserving-and-resetting-state、learn/choosing-the-state-structure、reference/react/Activity、reference/react/ViewTransition、
 *   reference/rules/rules-of-hooks、reference/react-dom/components/common（hidden）、blog/2025/10/01/react-19-2、blog/2026/09/09/react-19-3
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
