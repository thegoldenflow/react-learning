/**
 * 主题：01. 组件与 JSX —— 组件是返回 JSX 的函数，JSX 是会被编译成函数调用的值
 * 适用版本：React 19.2 · @vitejs/plugin-react 5.2（automatic JSX runtime）· eslint-plugin-react-hooks 7.1 · Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：无（第一题）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 入口）· ProfileCards.tsx（区块一）· JsxRulesDemo.tsx（区块二）· PurityDemo.tsx（区块三）·
 *          NestedDefinitionDemo.tsx（区块四）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 组件就是返回 JSX 的普通 JavaScript 函数，名字必须大写开头；JSX 不是模板，是 JavaScript 的语法扩展，编译成 react/jsx-runtime 的 jsx() / jsxs() 调用
 *   （React 17 起的新转换，19 起必须用它）【主流】。
 * - JSX 的结果是值（React 元素，一个普通对象）：能存变量、当参数传、被 return；花括号里只能放表达式；多个节点用 <>…</> 包成一个返回值【主流】。
 * - 组件必须是纯函数：同样的输入得到同样的 JSX，渲染时不改渲染之前就存在的东西；副作用放事件处理函数。开发环境的 <StrictMode> 把组件调用两次来暴露不纯【主流】。
 * - 一次更新 = 触发 → 渲染（调用组件函数，算出界面）→ 提交（只改有变化的 DOM）；调用组件函数不等于改 DOM【主流】。
 * - 不要在组件里面定义组件：每次渲染都是一个新的组件类型，子树被卸载重建、state 丢光【主流】。
 *
 * 二、核心概念（React）
 * 1. 组件【主流】：your-first-component「React components are regular JavaScript functions, but their names must start with a capital letter or they won't
 *    work!」JSX 编译时按首字母区分：小写编译成字符串（'div'，当 HTML 标签），大写编译成变量引用（UserCard，React 去调用它）；
 *    带点的成员表达式（<ui.button />、<motion.div />）不看首字母，一律编译成变量引用（esbuild 实测）。
 *    写成 <vipBadge /> 会渲染出一个叫 vipbadge 的未知元素，开发环境报错「<vipBadge /> is using incorrect casing. Use PascalCase for React components, or lowercase
 *    for HTML elements.」「The tag <vipBadge> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.」
 *    （react-dom 19.2.8 实测，测试覆盖；TypeScript 在编译期就会拦下未知的小写标签）。
 * 2. JSX 编译成什么【主流】（区块二）：automatic runtime 把 <span className="badge">VIP</span> 编译成 jsx("span", { className: "badge", children: "VIP" })，
 *    多个子节点用 jsxs、children 是数组，并按需自动加上 import { Fragment, jsx, jsxs } from "react/jsx-runtime"（用到 <> 才有 Fragment；esbuild 0.28.2 实测）。
 *    这是生产构建的形态；开发环境（vite dev、Vitest）编译成 react/jsx-dev-runtime 的 jsxDEV()，多带源码位置用来给报错定位
 *    （vite 的 esbuild 配置 jsxDev: !isProduction，node_modules/vite/dist/node/chunks/config.js:35692）。
 *    所以组件文件不需要 import React（2020 年的发布博客：「With the new transform, you can use JSX without importing React.」）。
 *    本项目的 @vitejs/plugin-react 5.2 默认就是它（README「By default, the plugin uses the automatic JSX runtime」）。
 * 3. JSX 的几条硬规则【主流】（writing-markup-with-jsx）：只能返回一个根 ——「JSX looks like HTML, but under the hood it is transformed into plain JavaScript objects.
 *    You can't return two objects from a function without wrapping them into an array.」（多个节点用 Fragment 包起来，或者返回带 key 的数组 —— 类型 ReactNode 包含 Iterable<ReactNode>，测试覆盖，但日常写 Fragment 更清楚）；
 *    所有标签都要闭合（<img />、<br />）；属性名用 camelCase（className、htmlFor、tabIndex、onClick），
 *    「For historical reasons, aria-* and data-* attributes are written as in HTML with dashes.」
 *    写成 HTML 的名字开发环境会报错并提示正确写法：「Invalid DOM property `class`. Did you mean `className`?」、onclick →「Invalid event handler property `onclick`.
 *    Did you mean `onClick`?」、ariaLabel →「Invalid ARIA attribute `ariaLabel`. Did you mean `aria-label`?」（实测，测试覆盖）。
 *    多行 JSX 用括号包起来：「Without parentheses, any code on the lines after return will be ignored!」—— 自动分号插入让函数返回 undefined，
 *    组件什么都不渲染（React 18 起不报错，测试覆盖）。
 * 4. 花括号【主流】：「You can only use curly braces in two ways inside JSX」—— 标签之间的文本位置、紧跟在属性的 = 后面；里面放表达式（取值、调用、三元、模板字符串），不能放 if / for 语句。
 *    style={{ … }}：「it's nothing more than an object inside the JSX curlies!」
 * 5. style【主流】：接收对象（传字符串直接抛错「The `style` prop expects a mapping from style properties to values, not a string.」）；属性名 camelCase；
 *    common 组件页「If you pass a number, like width: 100, React will automatically append px ("pixels") to the value unless it's a unitless property.」
 *    文档没有列出哪些属性无单位，要看源码：react-dom 19.2.8 里 0 和 unitlessNumbers 里的属性（lineHeight、opacity、zIndex、fontWeight、flexGrow 等）不补
 *    （react-dom-client.development.js:2727-2735，测试覆盖）。
 * 6. Fragment【主流】：「Fragments let you group things without leaving any trace in the browser HTML tree.」简写不能带 key ——「If you want to pass key to a
 *    Fragment, you can't use the <>...</> syntax.」列表里一次返回多个节点要写 <Fragment key={…}>（区块二，测试覆盖）。
 * 7. 纯函数【主流】（区块三，keeping-components-pure）：「It minds its own business. It does not change any objects or variables that existed before it was called.」
 *    「Same inputs, same output.」局部突变允许：「it's completely fine to change variables and objects that you've just created while rendering.」
 *    好处（原文三条）：组件可以在服务端运行（「one component can serve many user requests」，33 题，待新增）；可以跳过输入没变的组件（「skipping rendering components whose inputs have
 *    not changed」，17 题）；「React can restart rendering without wasting time to finish the outdated render」（32 题，待新增）。
 *    「Every new React feature we're building takes advantage of purity.」
 *    eslint-plugin-react-hooks 7 的 recommended 能拦下一部分：给外部变量重新赋值报 globals「Cannot reassign variables declared outside of the component/hook」，
 *    改外部对象的属性报 immutability；arr.push() 这类方法调用拦不住（复核实测），要靠 StrictMode 的双调用暴露。
 * 8. <StrictMode>【主流】：StrictMode 参考页列了四项开发期行为 —— 组件多渲染一次（找不纯的渲染）、Effect 多跑一轮（找漏写的 cleanup）、ref 回调多跑一轮
 *    （找漏写的 ref 清理）、检查已废弃的 API；「All of these checks are development-only and do not impact the production build.」调用两次的范围：组件函数体，
 *    以及「Functions that you pass to useState, set functions, useMemo, or useReducer」（更新函数也会被调两次，所以它们也要纯）。
 *    本项目的 main.tsx 就包了 StrictMode，所以区块三的不纯茶杯第一次打开本页时是 #2、#4、#6（测试覆盖开 / 不开两种情况）。
 * 9. 渲染与提交【主流】（render-and-commit）：触发（首次挂载或 state 变化）→ 渲染（「"Rendering" is React calling your components.」递归算出新的界面）→
 *    提交（「React only changes the DOM nodes if there's a difference between renders.」）→ 浏览器绘制。同一个组件用在两个地方就是两个实例：state-a-components-memory
 *    「if you render the same component twice, each copy will have completely isolated state!」（区块一两张卡各有一个「关注」按钮，互不影响，测试覆盖；
 *    state 细节见 03 题，渲染快照见 23 题）。
 * 10. 不要在组件里面定义组件【主流】（区块四）：「Components can render other components, but you must never nest their definitions」。原因在 preserving-and-resetting-state：
 *    「a different MyTextField function is created for every render of MyComponent. You're rendering a different component in the same position, so React resets all state
 *    below.」your-first-component 也说这种写法「very slow and causes bugs」。eslint-plugin-react-hooks 7 的 static-components 规则报「Cannot create components during
 *    render」（实测）。定义挪到模块顶层，数据用 props 传。
 * 11. 模块约定【主流】：「A file can have no more than one default export, but it can have as many named exports as you like.」「People often use default exports if the
 *    file exports only one component, and use named exports if it exports multiple components and values.」本课的入口 Example 用 default export（壳应用按 default 导入），
 *    其余组件用 named export（20 题的 ErrorBoundary 是 default export，按团队约定统一即可）。另外 @vitejs/plugin-react README：「For React refresh to work correctly,
 *    your file should only export React components.」—— 本课的 .tsx 文件只导出组件。类型：@types/react 19.2.18 的 FunctionComponent<P> 签名是
 *    (props: P): ReactNode | Promise<ReactNode>（index.d.ts:1060-1061）；ReactNode 类型见 28 题。
 *
 * 三、Vue 对照
 * - SFC（<script setup> + <template> + <style>）vs 一个函数【主流】：Vue 的立场是「separation of concerns is not equal to the separation of file types」。
 *   模板同样要编译 ——「Vue templates are compiled into render functions」（rendering-mechanism），Vue 区块二给了 @vue/compiler-dom 3.5.42 的实际输出。
 * - 插值【主流】：{{ }} 与 JSX 的 { } 一样只能放表达式：「Each binding can only contain one single expression.」Vue 的模板表达式「are sandboxed and only have access to a restricted
 *   list of globals」；JSX 的花括号就是普通 JS 作用域。
 * - class 与 style【主流】：class / for 原样写 vs className / htmlFor；:class 有对象 / 数组语法，React 只有字符串（多条件用 clsx）；:style 有数组语法，
 *   React 用对象展开合并；:style 会自动加厂商前缀（class-and-style「Vue will automatically add the appropriate prefix」）。Vue 不给数字补 px：width: 48 在 Vue 侧测试（jsdom）
 *   和 Chrome（标准模式，本项目 index.html 有 doctype）里都被当成无效值丢掉。
 * - Fragment vs 多根【主流】：Vue 3 的组件可以有多个根节点，不需要 Fragment；但「components with multiple root nodes do not have an automatic attribute fallthrough
 *   behavior」，class 也要自己用 $attrs.class 指定落在哪个根上（透传机制见 02 题，多根的情况 02 题改写时补）；一次渲染多个节点用 <template v-for> / <template v-if> 做无痕包裹，v-for 的 key 写在 <template> 上。
 * - JSX 是值 vs 模板片段【主流】：React 把 JSX 存进变量、当参数传；Vue 模板片段不能存进变量，习惯做法是插槽（区块一的 #badge，13 题）。Vue 也支持渲染函数 h() 和 JSX / TSX，
 *   h() 返回的 vnode 同样是普通对象；但官方「Vue recommends using templates to build applications in the vast majority of cases.」，而且「Vue JSX transform is different from
 *   React's JSX transform, so you can't use React's JSX transform in Vue applications」（Vue 的 JSX 里可以直接写 class、for，插槽的传法也不同）。
 * - 纯渲染【主流】：Vue 的模板 / 渲染函数同样不该有副作用，但 Vue 的 setup 只执行一次、更新时重跑的是渲染函数，没有 StrictMode 这类双调用检查（23 题讲渲染模型的差异）。
 *   「在组件里定义组件」：在 setup 里定义的只创建一次，不会出问题；但在渲染函数 / JSX 里现场创建组件对象，Vue 同样按 vnode 的 type 判断能否复用，
 *   每次更新都卸载重建（复核实测）—— 规则和 React 一样，差别只在 setup 只执行一次。
 * - v-once / v-memo【主流·v-memo 3.2 起】：模板级的「跳过更新」（v-once「Render the element and component once only, and skip future updates.」），
 *   对应 React 的 memo 与 React Compiler（17 题）。本项目用 SFC；Vue 也能不经构建，写成对象 + template 字符串。
 * - 组件命名【主流】：「In SFCs, it's recommended to use PascalCase tag names for child components」；直接写在 HTML 里的模板（in-DOM template）大小写不敏感，要用 kebab-case、
 *   必须写闭合标签（这些限制「only apply if you are writing your templates directly in the DOM」）。
 * - dangerouslySetInnerHTML={{ __html }} ↔ v-html【主流】：两边都把字符串当 HTML 插入。Vue 文档「Only use v-html on trusted content and never on user-provided content.」
 *   React 的属性名本身就在提醒危险；内容不可信就是 XSS，必须先消毒（35 题，待新增）。
 *
 * 四、关键区别（每条写明前提）
 * 1. 描述 UI 的方式：Vue 默认用模板 DSL + 指令（v-if / v-for / v-bind）；React 用 JSX，条件用三元 / &&，循环用 map，拼 class 用字符串。Vue 也能写 JSX，区别是默认路径，不是能力上限。
 * 2. 编译产物：两边都编译成函数调用；Vue 编译器给动态节点打补丁标记（patch flags）、用 block 收集动态后代（tree flattening）、把静态节点缓存起来，
 *    更新时只遍历、比对动态部分；JSX 编译结果没有这层信息（React 这边的编译期优化是 React Compiler，17 题改写时补 Compiler 小节）。
 * 3. 更新时执行什么：React 每次渲染重新执行整个组件函数（React 19.2）；Vue 3.5 的 setup 只执行一次，读过变化数据的组件重新执行渲染函数（统一措辞见 PROGRESS）。
 * 4. style 数字：React 自动补 px（0 与无单位属性除外）；Vue 不补。
 * 5. 多个节点：React 返回多个节点要包 Fragment（或返回带 key 的数组），简写 <> 不能带 key；Vue 3 组件可以多根。
 * 6. 组件名大写：JSX 编译期的硬规则；Vue SFC 里 PascalCase 只是推荐（in-DOM 模板另有限制）。
 *
 * 五、常见追问与回答要点
 * - 浏览器能直接运行 JSX 吗？不能，要由构建工具（Babel / esbuild / SWC / TypeScript）编译。
 * - 为什么 React 17 之后不用 import React？新 JSX 转换由编译器自动引入 react/jsx-runtime；React 19 起必须用新转换（见八）。
 * - <div> 和 <Div> 差在哪一步？编译期：小写编译成字符串 'div'、大写编译成变量 Div 的引用。
 * - 局部突变算不纯吗？不算：改的是这次渲染自己新建的对象。改 props、改外部变量才算。
 * - StrictMode 会让生产环境也调用两次吗？不会，检查只在开发环境。
 * - 调用组件函数等于更新 DOM 吗？不等于：渲染只算出要什么样的界面，提交阶段才改 DOM，而且只改有差异的节点。
 * - 在组件里定义组件会怎样？每次渲染都是新类型，子树卸载重建、state 丢失；加 key 也没用，要挪到模块顶层。
 *
 * 六、易错点（lint 文案为 eslint-plugin-react-hooks 7.1.1 recommended 实测，2026-09-18）
 * - 组件名小写（<vipBadge />）：被当成 HTML 标签。
 * - class、for、onclick、tabindex、style="color:red" 这些 HTML 写法（见二-3、二-5 的报错原文）。
 * - 花括号里写 if / for 语句；忘了 lineHeight 这类无单位属性不补 px。
 * - return 后面直接换行不加括号 → 返回 undefined，什么都不渲染。
 * - 在组件里面定义组件：static-components 报「Cannot create components during render」，说明「Components created during render will reset their state each time they are
 *   created. Declare components outside of render.」
 * - 渲染时改外部变量：globals 报「Cannot reassign variables declared outside of the component/hook」；改外部对象 / 数组也是不纯（属性赋值 immutability 会报，
 *   push 这类方法调用 lint 拦不住）。
 * - 列表里用 <> 包多个节点：写不了 key，报「Each child in a list should have a unique "key" prop.」
 * - 开发环境看到组件打了两次日志就以为是 bug：那是 StrictMode。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：数据写成文件内常量；头像、边框用行内 style 对象和写死的色值。common 组件页：「React does not prescribe how you add CSS files.」
 *   「We recommend only using the style attribute when your styles depend on JavaScript variables.」真实项目的样式放在 CSS 文件 / CSS Modules / Tailwind / CSS-in-JS 里，
 *   style 只放依赖运行时数据的少量动态值；多条件 className 用 clsx 或 classnames。
 * - 根组件包 <StrictMode>（本项目 main.tsx 已包）：它只在开发环境工作，不影响生产。
 * - 对外导出的组件一个文件一个，小而紧密相关的辅助组件可以放同一个文件（your-first-component「This is convenient when components are relatively small or tightly
 *   related to each other」）；default / named export 按团队约定统一；不要在组件里定义组件（static-components 会报 error）。
 * - 富文本只能在消毒之后才交给 dangerouslySetInnerHTML（35 题，待新增）。
 * - lint 用 eslint-plugin-react-hooks 7 的 recommended（含 purity、globals、immutability、static-components 等编译器规则，本项目 7.1.1）；
 *   TypeScript 里写 React.JSX.Element，不用全局 JSX 命名空间（见八）。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - classic runtime：「The old JSX transform turned JSX into React.createElement(...) calls.」每个用到 JSX 的文件顶部都要 import React from 'react'（区块二右栏）。
 *   新转换随 React 17（2020）发布，并回移植到 16.14.0 / 15.7.0 / 0.14.10；当时博客说「This upgrade will not change the JSX syntax and is not required.」
 *   React 19 升级指南改成「New JSX Transform is now required」，没启用时控制台报「Your app (or one of its dependencies) is using an outdated JSX transform.」
 *   @vitejs/plugin-react 仍可用 jsxRuntime: 'classic' 回退（只为兼容老代码）。
 * - class 组件的 render() / this.props：存量代码里常见，函数组件是现在的主流写法（class 组件没有被移除）；错误边界目前没有函数组件写法，要自己写 class 或用
 *   react-error-boundary（20 题）。
 * - 挂载：ReactDOM.render（18.0 起弃用）→ createRoot（react-dom/client）；ReactDOM.render、hydrate、unmountComponentAtNode、findDOMNode（16.6 起弃用）、
 *   class 组件的字符串 ref 在 React 19 移除（升级指南各有一节）。函数组件的 defaultProps 也在 19 移除，改用参数默认值（02 题）。
 * - 全局 JSX 命名空间：@types/react 19 起改用 React.JSX。
 *
 * 九、新动向【尝鲜】
 * - React Compiler 1.0【较新】：自动记忆化；introduction 页「rolling out the compiler to production for your app will depend on the health of your codebase and how well
 *   you've followed the Rules of React」—— 纯函数是前提。本项目不启用（17 题改写时补 Compiler 小节）。
 * - React 19.3（2026-09-09，未满 30 天，本课不用；本仓库锁 19.2.8，没有 FragmentInstance）：Fragment Refs 转正（「both of these are now stable in React 19.3」，
 *   指 View Transitions 与 Fragment Refs），<Fragment ref> 拿到 FragmentInstance，同样只能写显式的 <Fragment>；「React 19.3 integrates with the browser Trusted Types API」，
 *   Trusted Types 对象可以直接交给 dangerouslySetInnerHTML；19.3 发布博客的 Changelog「Double invoke Effects in Strict Mode during hydration, matching client-rendered
 *   roots」（CHANGELOG.md 里是「Double invoke effects in Strict Mode during hydration」，#35961）。
 *
 * 十、动手练习
 * 1. 把区块四的 NestedNote 挪到模块顶层（owner 改成 props 传进去），再跑一次测试。可断言：父组件重渲染后两个输入框都保留「草稿」。
 * 2. 给区块二的 NUMERIC_STYLE 加一个 marginTop: 8 和 flexShrink: 2。可断言：读出的 style 里有 margin-top: 8px、flex-shrink: 2（无单位属性不补 px）。
 *
 * 参考（2026-09-18 核对，react.dev / vuejs.org 文档取自官方仓库原文）：
 * - react.dev：learn/your-first-component、learn/importing-and-exporting-components、learn/writing-markup-with-jsx、learn/javascript-in-jsx-with-curly-braces、
 *   learn/keeping-components-pure、learn/render-and-commit、learn/state-a-components-memory、learn/preserving-and-resetting-state、learn/react-compiler/introduction、
 *   reference/react/StrictMode、reference/react/Fragment、reference/react-dom/components/common、reference/eslint-plugin-react-hooks（globals、static-components、
 *   immutability）、blog/2024/04/25/react-19-upgrade-guide、blog/2026/09/09/react-19-3
 * - legacy.reactjs.org：blog/2020/09/22/introducing-the-new-jsx-transform；facebook/react CHANGELOG.md（18.0.0「Components can now render undefined」、19.3.0）
 * - vuejs.org：guide/scaling-up/sfc、guide/essentials/template-syntax、guide/essentials/class-and-style、guide/extras/render-function、guide/extras/rendering-mechanism、
 *   guide/components/attrs、guide/essentials/component-basics、api/built-in-directives（v-html、v-once、v-memo）
 * - 源码 / 工具：react-dom 19.2.8 cjs/react-dom-client.development.js（setValueForStyle、unitlessNumbers）；@types/react 19.2.18 index.d.ts；
 *   @vitejs/plugin-react 5.2.0 README（jsxRuntime）；vite dist/node/chunks/config.js（jsxDev）；esbuild 0.28.2；@vue/compiler-sfc 3.5.42（compileTemplate）；
 *   @vue/runtime-dom 3.5.42（setStyle）
 */
import { JsxRulesDemo } from './JsxRulesDemo'
import { NestedDefinitionDemo } from './NestedDefinitionDemo'
import { ProfileCards } from './ProfileCards'
import { PurityDemo } from './PurityDemo'

export default function Example() {
  return (
    <div className="stack">
      <ProfileCards />
      <JsxRulesDemo />
      <PurityDemo />
      <NestedDefinitionDemo />
    </div>
  )
}
