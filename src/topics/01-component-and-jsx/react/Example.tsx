/**
 * 主题：01. 组件与 JSX —— 组件是返回 JSX 的函数，JSX 是会被编译成函数调用的值
 * 适用版本：React 19.2 · @vitejs/plugin-react 5.2（automatic JSX runtime）· Vite 7.3（CSS Modules）· eslint-plugin-react-hooks 7.1 · Vue 3.5
 * 最后核对：2026-09-19
 * 前置主题：无（第一题）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时，按项目里的使用频率标【最常用】【常用】【少用】，并写出依据（官方原文、官方示例的写法、npm 下载量；没有出处的写「工程经验」）。
 *          正文和运行中的演示只有【最常用】【常用】的写法；【少用】的写法没有删，讲解集中在文末「附」（本题的少用写法本来就没有单独的演示，返回数组那条由测试覆盖）。
 *          30 秒速答只用【最常用】。带频率标签的写法，成熟度是【主流】时不再重复标。
 * 本课文件：Example.tsx（讲解 + 入口）· ProfileCards.tsx + ProfileCards.module.css（区块一）· JsxRulesDemo.tsx（区块二）· PurityDemo.tsx（区块三）·
 *          NestedDefinitionDemo.tsx（区块四）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 组件就是返回 JSX 的普通 JavaScript 函数，名字必须大写开头；JSX 不是模板，是 JavaScript 的语法扩展，编译成 react/jsx-runtime 的 jsx() / jsxs() 调用
 *   （React 17 起的新转换，19 起必须用它）【主流】。
 * - JSX 的结果是值（React 元素，一个普通对象）：能存变量、当参数传、被 return；花括号里只能放表达式；多个节点用 <>…</> 包成一个返回值【主流】。
 * - 组件必须是纯函数：同样的输入得到同样的 JSX，渲染时不改渲染之前就存在的东西；副作用放事件处理函数。开发环境的 <StrictMode> 把组件调用两次来暴露不纯【主流】。
 * - 一次更新 = 触发 → 渲染（调用组件函数，算出界面）→ 提交（只改有变化的 DOM）；调用组件函数不等于改 DOM【主流】。
 * - 不要在组件里面定义组件：每次渲染都是一个新的组件类型，子树被卸载重建、state 丢光【主流】。
 * - 样式：静态样式写在样式表里用 className 挂上，style 只放依赖运行时数据的值【主流】。
 *
 * 二、核心概念（React）
 * 1. 组件【主流】：your-first-component「React components are regular JavaScript functions, but their names must start with a capital letter or they won't
 *    work!」【最常用】写成函数：Component 参考页「We recommend defining components as functions instead of classes.」（class 组件见八）。
 *    JSX 编译时按首字母区分：小写编译成字符串（'div'，当 HTML 标签），大写编译成变量引用（UserCard，React 去调用它）（带点的写法见附 5）。
 *    写成 <vipBadge /> 会渲染出一个叫 vipbadge 的未知元素，开发环境报错「<vipBadge /> is using incorrect casing. Use PascalCase for React components, or lowercase
 *    for HTML elements.」「The tag <vipBadge> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.」
 *    （react-dom 19.2.8 实测，测试覆盖；TypeScript 在编译期就会拦下未知的小写标签）。
 * 2. JSX 编译成什么【主流】（区块二）：【最常用】automatic runtime（React 17 起，19 起必须）把 <span className="badge">VIP</span> 编译成 jsx("span", { className: "badge", children: "VIP" })，
 *    多个子节点用 jsxs、children 是数组，并按需自动加上 import { Fragment, jsx, jsxs } from "react/jsx-runtime"（用到 <> 才有 Fragment；esbuild 0.28.2 实测）。
 *    这是生产构建的形态；开发环境编译成 jsxDEV()，多带源码位置用来给报错定位（见附 5）。
 *    所以组件文件不需要 import React（2020 年的发布博客：「With the new transform, you can use JSX without importing React.」）。
 *    本项目的 @vitejs/plugin-react 5.2 默认就是它（README「By default, the plugin uses the automatic JSX runtime」）。classic runtime（React.createElement）是【旧写法】，见八。
 * 3. JSX 的几条硬规则【主流】（writing-markup-with-jsx）：只能返回一个根 ——「JSX looks like HTML, but under the hood it is transformed into plain JavaScript objects.
 *    You can't return two objects from a function without wrapping them into an array.」多个节点按要做的事选写法：
 *    - 【最常用】<>…</> 包起来：Fragment 参考页开头「<Fragment>, often used via <>...</> syntax, lets you group elements without a wrapper node.」（区块一的 ProfileCards）。
 *    - 【常用】列表里一次返回多个节点、要带 key：写 <Fragment key={…}>（见 6）。
 *    - 【少用】返回带 key 的数组：合法，见附 1。
 *    所有标签都要闭合（<img />、<br />）；属性名用 camelCase（className、htmlFor、tabIndex、onClick），
 *    「For historical reasons, aria-* and data-* attributes are written as in HTML with dashes.」
 *    写成 HTML 的名字开发环境会报错并提示正确写法：「Invalid DOM property `class`. Did you mean `className`?」、onclick →「Invalid event handler property `onclick`.
 *    Did you mean `onClick`?」、ariaLabel →「Invalid ARIA attribute `ariaLabel`. Did you mean `aria-label`?」（实测，测试覆盖）。
 *    多行 JSX 用括号包起来：「Without parentheses, any code on the lines after return will be ignored!」—— 自动分号插入让函数返回 undefined，
 *    组件什么都不渲染，也不报错（测试覆盖，版本细节见附 5）。
 * 4. 花括号【主流】：「You can only use curly braces in two ways inside JSX」—— 标签之间的文本位置、紧跟在属性的 = 后面；里面放表达式（取值、调用、三元、模板字符串），不能放 if / for 语句。
 *    style={{ … }}：「it's nothing more than an object inside the JSX curlies!」
 * 5. 写样式【主流】（区块一）：按要做的事选写法。
 *    - 静态样式：【最常用】写在样式表里，用 className 挂上。花括号页：「React does not require you to use inline styles (CSS classes work great for most cases).」
 *      common 组件页：「React does not prescribe how you add CSS files.」用哪种样式表按项目选型：普通 CSS 文件、CSS Modules、Tailwind、CSS-in-JS（styled-components / Emotion）等。
 *      区块一用 Vite 内置的 CSS Modules（vite.dev features「Any CSS file ending with .module.css is considered a CSS modules file.」）：
 *      import styles from './ProfileCards.module.css'，写 className={styles.avatar}；类名被改写成带哈希的唯一名字（开发和构建都会），别的文件里同名的类不会冲突。
 *    - 依赖运行时数据的值（区块一的头像底色、VIP 边框颜色）：【最常用】放进 style。「We recommend only using the style attribute when your styles depend on JavaScript variables.」
 *      style 接收对象（传字符串直接抛错「The `style` prop expects a mapping from style properties to values, not a string.」）；属性名 camelCase；对象的类型是 CSSProperties
 *      （React 和 Vue 都导出这个类型，02 题 UiButton 有演示）；
 *      「If you pass a number, like width: 100, React will automatically append px ("pixels") to the value unless it's a unitless property.」
 *      0 和 lineHeight、opacity、zIndex、fontWeight、flexGrow 这类无单位属性不补（区块二实测，测试覆盖；文档没列清单，源码位置见附 5）。
 *    - 按条件拼 className：一两个条件时【最常用】三元 / 模板字符串（区块一）；条件多时【最常用】交给 clsx 这类小工具函数（工程经验）。这类工具里 clsx 下载量最高
 *      （npm 周下载 2026-09-11～17：clsx 约 8812 万、classnames 约 2302 万，都含作为别的库依赖被装上的次数，只能说明工具之间的差距；用 Tailwind 的项目常再配
 *      tailwind-merge，约 6091 万）。本项目没装 clsx，不为此新增依赖（02 题用 filter(Boolean).join(' ') 演示简化）。
 * 6. Fragment【主流】：「Fragments let you group things without leaving any trace in the browser HTML tree.」「The empty JSX tag <></> is shorthand for <Fragment></Fragment> in most cases.」
 *    唯一的差别是 key，简写不能带 key ——「If you want to pass key to a
 *    Fragment, you can't use the <>...</> syntax.」【常用】列表里一次返回多个节点要写 <Fragment key={…}>（区块二，测试覆盖）：
 *    Fragment 参考页说显式的 <Fragment>「Usually you won't need this unless you need to pass a key to your Fragment.」
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
 * 11. 模块约定【主流】：default export 和 named export 两种都常见，按团队约定统一 ——「A file can have no more than one default export, but it can have as many named exports as you like.」
 *    「People often use default exports if the file exports only one component, and use named exports if it exports multiple components and values.」
 *    「some teams choose to only stick to one style (default or named), or avoid mixing them in a single file. Do what works best for you!」
 *    本课的入口 Example 用 default export（壳应用按 default 导入），其余组件用 named export（20 题的 ErrorBoundary 是 default export）。
 *    另外 @vitejs/plugin-react README：「For React refresh to work correctly, your file should only export React components.」—— 本课的 .tsx 文件只导出组件。
 *    组件的类型签名见附 5；ReactNode 类型见 28 题。
 *
 * 三、Vue 对照（Vue 这一侧的演示都是 Vue 项目里常用的写法，没有注释掉的部分）
 * - 【最常用】SFC（<script setup> + <template> + <style>）+ 模板 vs 一个函数：sfc 页「SFC is a defining feature of Vue as a framework, and is the recommended approach for using Vue
 *   in the following scenarios」（SPA、SSG、值得上构建的前端）；Vue 的立场是「separation of concerns is not equal to the separation of file types」。
 *   模板同样要编译 ——「Vue templates are compiled into render functions」（rendering-mechanism），Vue 区块二给了 @vue/compiler-sfc 3.5.42 的实际输出。
 *   【少用】渲染函数 h() / JSX：见附 2。
 * - 插值【主流】：{{ }} 与 JSX 的 { } 一样只能放表达式：「Each binding can only contain one single expression.」Vue 的模板表达式「are sandboxed and only have access to a restricted
 *   list of globals」；JSX 的花括号就是普通 JS 作用域。
 * - class 与 style【主流】：class / for 原样写 vs className / htmlFor。按条件挂类名【最常用】:class 对象语法（vue/UserCard.vue 的 { vip: highlight }），React 只有字符串（三元 / clsx）；
 *   :class 数组语法、:style 数组语法【少用】，见附 3（React 合并两个 style 对象用对象展开，02 题 UiButton 有演示）。
 *   静态样式【最常用】写在 <style scoped> 里（vue/UserCard.vue）：create-vue 脚手架生成的组件（HelloWorld.vue、WelcomeItem.vue）默认就是 <style scoped>；
 *   风格指南 Essential 要求组件样式有作用域 ——「For applications, styles in a top-level App component and in layout components may be global, but all other components should always
 *   be scoped.」（它不限定手段：scoped、CSS Modules、BEM 都算，组件库更推荐类名方案）。React 这边对应 CSS Modules 这类构建工具提供的方案。Vue 不给数字补 px：width: 48 在 Vue 侧测试（jsdom）
 *   和 Chrome（标准模式，本项目 index.html 有 doctype）里都被当成无效值丢掉（Vue 区块二）。
 * - Fragment vs 多根【主流】：Vue 3 的组件可以有多个根节点，不需要 Fragment；但「components with multiple root nodes do not have an automatic attribute fallthrough
 *   behavior」，class 也要自己用 $attrs.class 指定落在哪个根上（透传机制与多根组件见 02 题区块四）；一次渲染多个节点用 <template v-for> / <template v-if> 做无痕包裹，v-for 的 key 写在 <template> 上。
 * - JSX 是值 vs 模板片段【主流】：React 把 JSX 存进变量、当参数传；Vue 模板片段不能存进变量，习惯做法是插槽（区块一的 #badge，13 题）；
 *   渲染函数 h() 返回的 vnode 同样可以存变量、当参数传（Vue 项目里少用，见附 2）。
 * - 纯渲染【主流】：Vue 的模板 / 渲染函数同样不该有副作用，但 Vue 的 setup 只执行一次、更新时重跑的是渲染函数，没有 StrictMode 这类双调用检查（23 题讲渲染模型的差异）。
 *   「在组件里定义组件」：在 setup 里定义的只创建一次，不会出问题（在渲染函数里现场创建组件对象会怎样，见附 2）。
 * - 组件命名【主流】：「In SFCs, it's recommended to use PascalCase tag names for child components」（直接写在 HTML 里的模板另有限制，见附 4）。
 * - dangerouslySetInnerHTML={{ __html }} ↔ v-html【主流】：两边都把字符串当 HTML 插入。Vue 文档「Only use v-html on trusted content and never on user-provided content.」
 *   React 的属性名本身就在提醒危险；内容不可信就是 XSS，必须先消毒（35 题，待新增）。
 * - 【少用】v-once / v-memo：模板级的「跳过更新」，见附 3。
 *
 * 四、关键区别（每条写明前提）
 * 1. 描述 UI 的方式：Vue 默认用模板 DSL + 指令（v-if / v-for / v-bind）；React 用 JSX，条件用三元 / &&，循环用 map，拼 class 用字符串。Vue 也能写 JSX，区别是默认路径，不是能力上限。
 * 2. 编译产物：两边都编译成函数调用；Vue 编译器给动态节点打补丁标记（patch flags）、用 block 收集动态后代（tree flattening）、把静态节点缓存起来，
 *    更新时只遍历、比对动态部分；JSX 编译结果没有这层信息（React 这边的编译期优化是 React Compiler，17 题改写时补 Compiler 小节）。
 * 3. 更新时执行什么：React 每次渲染重新执行整个组件函数（React 19.2）；Vue 3.5 的 setup 只执行一次，读过变化数据的组件重新执行渲染函数（统一措辞见 PROGRESS）。
 * 4. style 数字：React 自动补 px（0 与无单位属性除外）；Vue 不补。组件级样式隔离：React 本身不管，常用构建工具提供的 CSS Modules（Vite 内置，改写类名）或 Tailwind；
 *    Vue 的 SFC 内置 <style scoped>（加属性选择器），也支持 <style module>（同样是 CSS Modules）。
 * 5. 多个节点：React 返回多个节点要包 Fragment（返回带 key 的数组也合法，少用，见附 1），简写 <> 不能带 key；Vue 3 组件可以多根。
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
 * - 样式写 style 还是 className？静态的写样式表、用 className 挂上（官方「CSS classes work great for most cases」）；style 只放依赖运行时数据的值；多条件拼类名用 clsx。
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
 * - 演示简化：数据写成文件内常量；各区块的布局微调（flex 宽度、对齐）直接写在 style 里，这是全站示例的共同简化（共用的工具类在 src/shared/styles.css）。
 *   区块一的头像和 VIP 边框按生产写法：静态样式在 ProfileCards.module.css，style 只放 accent 决定的颜色（二-5）。
 * - 根组件包 <StrictMode>（本项目 main.tsx 已包）：它只在开发环境工作，不影响生产。
 * - 对外导出的组件一个文件一个，小而紧密相关的辅助组件可以放同一个文件（your-first-component「This is convenient when components are relatively small or tightly
 *   related to each other」）；default / named export 按团队约定统一；不要在组件里定义组件（static-components 会报 error）。
 * - 富文本只能在消毒之后才交给 dangerouslySetInnerHTML（35 题，待新增）。
 * - lint 用 eslint-plugin-react-hooks 7 的 recommended（含 purity、globals、immutability、static-components 等编译器规则，本项目 7.1.1）；
 *   TypeScript 里写 React.JSX.Element，不用全局 JSX 命名空间（见八）。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - classic runtime：「The old JSX transform turned JSX into React.createElement(...) calls.」每个用到 JSX 的文件顶部都要 import React from 'react'（区块二右栏；
 *   编译结果是面试常问的点，演示照样显示）。
 *   新转换随 React 17（2020）发布，并回移植到 16.14.0 / 15.7.0 / 0.14.10；当时博客说「This upgrade will not change the JSX syntax and is not required.」
 *   React 19 升级指南改成「New JSX Transform is now required」，没启用时控制台报「Your app (or one of its dependencies) is using an outdated JSX transform.」
 *   @vitejs/plugin-react 仍可用 jsxRuntime: 'classic' 回退（只为兼容老代码）。
 * - class 组件的 render() / this.props：存量代码里常见，函数组件是现在的主流写法（class 组件没有被移除；Component 参考页「We recommend defining components as functions instead of classes.」）；
 *   错误边界目前没有函数组件写法，要自己写 class 或用 react-error-boundary（20 题）。
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
 * 3. 在 ProfileCards.module.css 里加一个 .offline 类（opacity: 0.6），离线的卡用 className 挂上（和 card、VIP 类拼在一起：两三个条件可以用模板字符串，
 *    或者照 02 题 UiButton 写 [a, b, c].filter(Boolean).join(' ')）。可断言：第二张卡有匹配 /^_offline_/ 的类名（Vitest 里 CSS Modules 的类名是 _offline_ 加文件路径的哈希）、
 *    style 属性里没有 opacity —— 按条件切换的静态样式也走 className，不走 style。
 *
 * 附：少用的写法与细节（读别人的代码时认得出来就行；本题没有需要注释掉的演示）
 * 1. 【少用】组件返回带 key 的数组（测试覆盖）：return [<dt key="t">…</dt>, <dd key="d">…</dd>] 合法，开发环境也不报错（没有 console.error）—— 类型 ReactNode 包含 Iterable<ReactNode>。
 *    官方教的是用标签或 Fragment 包起来（writing-markup-with-jsx：「This explains why you also can't return two JSX tags without wrapping them into another tag or a Fragment.」），
 *    数组写法每个元素都要手写 key，日常写 Fragment 更清楚（工程经验）。
 * 2. 【少用】Vue 的渲染函数 h() / JSX：官方「Vue recommends using templates to build applications in the vast majority of cases.」h() 返回的 vnode 同样是普通对象，能存变量、当参数传；
 *    「Vue JSX transform is different from React's JSX transform, so you can't use React's JSX transform in Vue applications」（Vue 的 JSX 里可以直接写 class、for，插槽的传法也不同）。
 *    在渲染函数 / JSX 里现场创建组件对象，Vue 同样按 vnode 的 type 判断能否复用，每次更新都卸载重建（复核实测）—— 规则和 React 区块四一样，差别只在 setup 只执行一次。
 * 3. 【少用】Vue 的几种写法：
 *    - v-once / v-memo【v-memo 3.2 起】：模板级的「跳过更新」（v-once「Render the element and component once only, and skip future updates.」），
 *      v-memo 的 API 页：「v-memo is provided solely for micro optimizations in performance-critical scenarios and should be rarely needed.」（v-once 少用是工程经验，官方没有频率说法）。
 *      对应 React 的 memo 与 React Compiler（17 题）。
 *    - :class / :style 的数组语法：:class="['card', { vip: highlight }]"、:style="[baseStyle, { background: accent }]"（合并多个样式对象）。本课改写前的 UserCard.vue 用过
 *      :style="[avatarStyle, { background: accent }]"，React 版对应 style={{ ...avatarStyle, background: accent }}；静态样式挪进样式表之后就用不上了（工程经验：数组语法多见于合并组件内外两份样式）。
 * 4. 【少用】直接写在 HTML 里的模板（in-DOM template）：有构建步骤的项目用 SFC（introduction 页「SFC is a defining feature of Vue and is the recommended way to author Vue components if
 *    your use case warrants a build setup.」），in-DOM 模板只出现在不经构建、直接在 HTML 里写 Vue 的场景。它的限制：大小写不敏感，组件要用 kebab-case、必须写闭合标签
 *    （这些限制「only apply if you are writing your templates directly in the DOM」）。Vue 也能不经构建，写成对象 + template 字符串。
 * 5. 细节（了解即可）：
 *    - 带点的成员表达式（<ui.button />、<motion.div />）不看首字母，一律编译成变量引用（esbuild 实测）。
 *    - 开发环境（vite dev、Vitest）的 JSX 编译成 react/jsx-dev-runtime 的 jsxDEV()（vite 的 esbuild 配置 jsxDev: !isProduction，node_modules/vite/dist/node/chunks/config.js:35692），
 *      生产构建才是 jsx() / jsxs()。
 *    - 组件返回 undefined 从 React 18 起不报错（CHANGELOG 18.0.0「Components can now render undefined」），之前会报错。
 *    - style 无单位属性的清单在源码里：react-dom 19.2.8 的 unitlessNumbers，0 走单独的分支（react-dom-client.development.js:2727-2735）；aspectRatio、lineClamp、scale 等也在里面。
 *    - 组件的类型：@types/react 19.2.18 的 FunctionComponent<P> 签名是 (props: P): ReactNode | Promise<ReactNode>（index.d.ts:1060-1061）；项目里通常直接给参数写 props 类型（28 题）。
 *    - Vue 的 :style 会自动加厂商前缀（class-and-style「Vue will automatically add the appropriate prefix」）；React 的 style 不加：react-dom 19.2.8 的 setValueForStyle
 *      原样写入（react-dom-client.development.js:2675 起，写值的分支 :2721-2735），需要前缀时自己写 WebkitXxx，或交给 PostCSS autoprefixer 处理样式表。
 *
 * 参考（2026-09-19 核对，react.dev / vuejs.org / vite.dev 文档取自官方仓库原文）：
 * - react.dev：learn/your-first-component、learn/importing-and-exporting-components、learn/writing-markup-with-jsx、learn/javascript-in-jsx-with-curly-braces、
 *   learn/keeping-components-pure、learn/render-and-commit、learn/state-a-components-memory、learn/preserving-and-resetting-state、learn/react-compiler/introduction、
 *   reference/react/StrictMode、reference/react/Fragment、reference/react/Component、reference/react-dom/components/common、reference/eslint-plugin-react-hooks（globals、static-components、
 *   immutability）、blog/2024/04/25/react-19-upgrade-guide、blog/2026/09/09/react-19-3
 * - legacy.reactjs.org：blog/2020/09/22/introducing-the-new-jsx-transform；facebook/react CHANGELOG.md（18.0.0「Components can now render undefined」、19.3.0）
 * - vuejs.org：guide/scaling-up/sfc、guide/essentials/template-syntax、guide/essentials/class-and-style、guide/extras/render-function、guide/extras/rendering-mechanism、
 *   guide/components/attrs、guide/essentials/component-basics、guide/best-practices/performance（v-once）、api/built-in-directives（v-html、v-once、v-memo）、
 *   style-guide/rules-essential（Use component-scoped styling）、guide/introduction（SFC）
 * - 使用频率的依据：vite.dev guide/features（CSS Modules）；vuejs/create-vue template/code/default/src/components（HelloWorld.vue、WelcomeItem.vue 的 <style scoped>）；
 *   npm 下载量 api.npmjs.org/downloads/point/2026-09-11:2026-09-17/<包名>（clsx、classnames、tailwind-merge）
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
