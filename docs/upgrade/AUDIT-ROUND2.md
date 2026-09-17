# 第二轮审计：学习完整性（2026-09-16）

> 本文件由会话 scratchpad 的 build.js 从各题 parts 自动重建（生成时间 2026-09-17T12:49:07.868Z），请勿手工编辑。已产出对照的题：35/35。

## 0. 方法与来源清单

> 交付物由会话 scratchpad 的 `build.js` 从各题 parts 自动重建；§1/§2/§5/附录 为脚本拼装，§0/§3/§4/§6 为主会话手写。行号以 2026-09-16 的工作树（commit d550e27，`src/` 无改动）为准。

**任务**：按 `docs/upgrade/REAUDIT-PROMPT.md`，先不看课件、从官方文档写出每题「应该教什么」的目标大纲，再对照课件把缺失当成与错误同级的问题定级，然后做主线判定、与第一轮（`AUDIT.md`）对比，并给出阶段 2 可直接执行的每题重写大纲。全程只读仓库；本文件与 `PROGRESS.md` 是仅有的两个写入点。

**版本基线**：直接采用 `AUDIT.md` §2.2 与附录 A（react 19.2.8 主线，19.3【尝鲜】，React 18 差异【旧写法】；react-router 7.18.3 主线、从 `react-router` 导入、v8【尝鲜】、v6【旧写法】，Data 模式 middleware 不需要 future flag；vue 3.5.42、vue-router 将升 5.3.1、pinia 3.0.4、zustand 5、TanStack Query 5；React Compiler 不启用但要讲；eslint-plugin-react-hooks 7.1.1 的 `recommended` 已含编译器规则）。未重做版本调查。

**来源优先级**（任务书 §1 第 2 条 + 用户 2026-09-16 补充决定）：
1. ① `node_modules` 中已安装包的 `.d.ts` / 源码（引用形如 `node_modules/@types/react/index.d.ts:1791`）；
2. ② 官方文档：react.dev、reactrouter.com（v7 内容取自 `reactrouter.com/7.18.4/`，站点默认已是 8.4.0）、vuejs.org、router.vuejs.org、pinia.vuejs.org、tanstack.com、vite.dev、vitest.dev、testing-library.com；**各包自己的官方文档同为 ②**（zustand、Redux Toolkit、react-error-boundary README、nextjs.org）；
3. ③ 官方博客 / 发布说明；**MDN、OWASP、W3C WAI 按 ③ 引用并标明**（用于 35 题安全与可访问性）。
查不到的一律标「待核实」并汇总在附录。WebFetch 返回的是摘要而非原文：凡「定位原文」类引用要求逐字摘录并标「逐字 / 摘要」，API 签名一律回 `.d.ts` 核对。

**独立性**：第 1、2 步的子代理不读 `AUDIT.md` 任何部分（只读从 §2.2 与附录 A 逐字摘录的事实卡）；大纲阶段的子代理禁止打开 `src/topics`；主会话在第 4 步之前未读 `AUDIT.md` §3/§4/§5（计划阶段曾读过附录 B 的待核实清单一次，未传给任何子代理）。

**工作方式**：
- 大纲阶段 5 批（按文档域分组，每批 5–8 题，不读课件）：O1 01 02 04 05 06 13 08 09 · O2 03 21 23 24 25 29 15 16 · O3 10 11 27 30 12 14 17 26 · O4 07 19 31 32 20 18 · O5 28 22 33 34 35。
- 对照阶段 10 批（按代码体量分组 ≤ 125 KB，读课件全部文件并带行号）：A 01 02 04 05 06 13 · B 03 21 23 · C 24 29 · D 08 09 25 15 16 · E 10 11 27 · F 07 19 20 + 31 32 · G 18 + 35 · H 12 14 17 26 · I 30 22 · J 28 + 33 34。新题 31–35 的「现状」= grep 现有 30 题的零散提及。
- 2 并发（4 核机器）；每题四份 part（outline / audit / rewrite / pending），每批结束由脚本重建本文件并做机械校验（`file:line` 存在、原文片段命中、`grep0` 复跑为 0、枚举与编号合法、无残留「待主线判定」）。
- 定级（任务书第 2 步）：**严重** = 题目标题或文件头承诺的【主流】知识点未讲或讲错；**概念** = 【主流】加分点、【较新】内容、【旧写法】对照缺失，绝对化或过时表述；**生产** = 演示写法未标「演示简化」且没有生产做法；**小问题** = 措辞、标签、交叉引用。「未讲」与「讲错」同等定级。
- 盲点归属：任务书 §3 的十组盲点各指定主责题（Router → 18；Actions → 31；并发 → 32；useId → 07；useSyncExternalStore → 14；useImperativeHandle / ref 清理 → 12；use(Context) → 15；Profiler / 虚拟化 / Compiler 规则 → 17；测试 → 34；安全与 a11y → 35；服务端 → 33；Vue 现行写法与 TS 19 变化 → 各题 / 28），避免各批互相假设。

**文档版本与抓取日期**：全部官方页面于 2026-09-16 抓取；react.dev 当前描述 React 19.3，reactrouter.com 默认 8.4.0，router.vuejs.org 为 v4/v5 合并文档，tanstack.com 为 v5。

**执行记录（2026-09-17）**：大纲阶段 5 批（O1–O5，每批 17–30 分钟）、对照阶段 10 批（A–J，每批 15–33 分钟）、主线回填 1 批、与第一轮对比 3 批，全部 2 并发；35 题 × 4 份 part 齐全。机械校验（`build.js --check`）最终结果：1,680 处 `file:line` 全部存在且行号在范围内；141 处「原文片段」在所引行 ±2 行内命中；171 条「未讲」依据的 `grep0` 正则在该题目录复跑均为 0 命中；十段标题 35 × 11 齐全；学习者测试 35 × 5 行；无残留「待主线判定」。校验器为兼容子代理写法做了三处放宽（同文件后续位置的 `:行` 简写继承前一路径；无法编译的正则按字面量交替匹配；`[[:space:]]` 视为 `\s`），均不降低校验强度。子代理越界抽查：19 个子代理的结束报告均列出读过的文件，无一读取 `AUDIT.md`（对比阶段除外）或修改仓库；批次 A 曾误写到一个错误的临时目录，已删除。

## 1. 逐题目标大纲 vs 现状（30 + 5 题）

> 每题：目标大纲 vs 现状（层级 / 知识点 / 官方来源 / 现状 / 位置）· 面试 5 问 · 生产写法要点 · Vue 对照 · 缺失问题表 · 学习者测试。现状枚举：已讲对 / 讲了但错 / 缺标签 / 未讲。

### 01. 组件与 JSX

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 函数组件 = 返回 JSX 的普通函数，UI = f(props/state)（文件头承诺） | https://react.dev/learn/your-first-component | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:5; src/topics/01-component-and-jsx/react/Example.tsx:57; src/topics/01-component-and-jsx/react/Example.tsx:67 | — |
| 主流 | 组件名必须大写开头，小写会被当作 HTML 标签 | https://react.dev/learn/your-first-component | 未讲 | — | R2-01-1 |
| 主流 | 绝不在组件内部定义组件（每次渲染新函数 → state 重置且慢） | https://react.dev/learn/your-first-component + https://react.dev/learn/preserving-and-resetting-state | 未讲 | — | R2-01-2 |
| 主流 | JSX 是表达式：编译成函数调用，可赋值 / 传参 / return（文件头承诺） | https://react.dev/learn/writing-markup-with-jsx + node_modules/@types/react/jsx-runtime.d.ts:9,20 | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:6-7; src/topics/01-component-and-jsx/react/Example.tsx:59-63; src/topics/01-component-and-jsx/react/Example.tsx:70 | — |
| 主流 | 单根元素 + Fragment `<>`（文件头承诺） | https://react.dev/learn/writing-markup-with-jsx | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:7; src/topics/01-component-and-jsx/react/Example.tsx:64-65 | 「只能返回单个根节点」措辞见 R2-01-11 |
| 主流 | 所有标签必须闭合；`aria-*` / `data-*` 保留连字符；多行 return 要加括号 | https://react.dev/learn/writing-markup-with-jsx + https://react.dev/learn/your-first-component | 未讲 | — | R2-01-8 |
| 主流 | 属性 camelCase：className / htmlFor / tabIndex（文件头承诺） | https://react.dev/learn/writing-markup-with-jsx | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:8; src/topics/01-component-and-jsx/react/Example.tsx:89-90 | — |
| 主流 | 花括号只放表达式不放语句；`{{ }}` 只是对象字面量（文件头承诺） | https://react.dev/learn/javascript-in-jsx-with-curly-braces | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:9; src/topics/01-component-and-jsx/react/Example.tsx:79; src/topics/01-component-and-jsx/react/Example.tsx:87 | — |
| 主流 | style 对象 camelCase、数字自动补 px、unitless 属性除外（文件头承诺） | https://react.dev/reference/react-dom/components/common#style | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:10; src/topics/01-component-and-jsx/react/Example.tsx:40-43; src/topics/01-component-and-jsx/react/Example.tsx:79-80 | — |
| 主流 | JSX 编译目标 `jsx()/jsxs()` 自动运行时；React 17 起不需 `import React`；19 要求新 transform | https://react.dev/learn/writing-markup-with-jsx + node_modules/@types/react/jsx-runtime.d.ts:9,20 + node_modules/@vitejs/plugin-react/README.md:65 | 未讲 | — | R2-01-6；react/Example.tsx:60 只给出 `jsx('div', …)` 形式 |
| 主流 | 组件必须纯：同输入同输出、不改渲染前已存在对象；局部突变允许；副作用放事件处理器 | https://react.dev/learn/keeping-components-pure | 未讲 | — | R2-01-3 |
| 主流 | 纯性的收益：服务端运行、跳过未变输入的渲染、可中断重启 | https://react.dev/learn/keeping-components-pure | 未讲 | — | R2-01-3 |
| 主流 | `<StrictMode>` 开发期双调组件 / 初始化函数 / Effect，生产零成本 | https://react.dev/reference/react/StrictMode | 未讲 | — | R2-01-4 |
| 主流 | 渲染三步 Trigger → Render → Commit；commit 只改有差异的 DOM | https://react.dev/learn/render-and-commit | 未讲 | — | R2-01-5 |
| 主流 | UI 是树；同一组件多次使用各自独立实例、state 隔离 | https://react.dev/learn/understanding-your-ui-as-a-tree + https://react.dev/learn/state-a-components-memory | 未讲 | — | R2-01-5 |
| 主流 | 一文件至多一个 default export、任意 named export；单组件 default 约定 | https://react.dev/learn/importing-and-exporting-components | 未讲 | — | R2-01-8；react/Example.tsx:67 用了 export default 但无说明 |
| 主流 | Fragment `<>` 不能带 key / ref；循环里用 `<Fragment key>` | https://react.dev/reference/react/Fragment | 未讲 | — | R2-01-8 |
| 主流 | 组件返回类型 ReactNode；`FunctionComponent<P>` 签名 `(props: P): ReactNode \| Promise<ReactNode>` | node_modules/@types/react/index.d.ts:436-449, 1060-1061 | 未讲 | — | R2-01-8 |
| 主流 | `dangerouslySetInnerHTML={{ __html }}` ↔ `v-html`，XSS 一句，主责 35 | https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html | 未讲 | — | R2-01-7 |
| 较新 | React Compiler 依赖纯性；react-hooks 7.1.1 `recommended` 含 `purity` / `static-components` 等规则 | facts-versions F + https://react.dev/reference/eslint-plugin-react-hooks | 未讲 | — | R2-01-9 |
| 尝鲜 | 19.3 `<Fragment ref>` 得 FragmentInstance；Trusted Types 透传 | https://react.dev/blog/2026/09/09/react-19-3 | 未讲 | — | R2-01-9 |
| 旧写法 | classic runtime 需 `import React`；plugin-react `jsxRuntime: 'classic'` 回退 | node_modules/@vitejs/plugin-react/README.md:63-68 | 未讲 | — | R2-01-6 |
| 旧写法 | class 组件 `render()`、`ReactDOM.render`、`findDOMNode`、字符串 ref 19 已移除 | https://react.dev/blog/2024/04/25/react-19-upgrade-guide | 未讲 | — | R2-01-6 |
| 主流 | Vue 对照：SFC 三块 vs 一个函数；模板是 DSL（文件头承诺） | https://vuejs.org/guide/scaling-up/sfc.html | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:13; src/topics/01-component-and-jsx/react/Example.tsx:18-20; src/topics/01-component-and-jsx/vue/Example.vue:14 | — |
| 主流 | Vue 插值 `{{ }}` 只能放表达式，与 JSX 花括号一致（文件头承诺） | https://vuejs.org/guide/essentials/template-syntax.html | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:14; src/topics/01-component-and-jsx/vue/Example.vue:73 | — |
| 主流 | `:class` / `:style` 对象数组语法 vs className 字符串拼接、对象展开（文件头承诺） | https://vuejs.org/guide/essentials/class-and-style.html | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:15; src/topics/01-component-and-jsx/react/Example.tsx:83; src/topics/01-component-and-jsx/react/Example.tsx:97-99; src/topics/01-component-and-jsx/vue/Example.vue:67; src/topics/01-component-and-jsx/vue/Example.vue:84 | 大纲未列：react:98 提到 clsx / classnames |
| 主流 | Vue `:style` 数字不自动补 px，React 自动补 | https://vuejs.org/guide/essentials/class-and-style.html + https://react.dev/reference/react-dom/components/common#style | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:43; src/topics/01-component-and-jsx/vue/Example.vue:39 | — |
| 主流 | Vue 亦支持 JSX / TSX（transform 与 React 不同） | https://vuejs.org/guide/extras/render-function.html | 未讲 | — | R2-01-11；react:69「Vue 模板里没有等价写法」只对模板成立 |
| 主流 | JSX 注释 `{/* */}` vs HTML 注释 | — | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:76; src/topics/01-component-and-jsx/vue/Example.vue:58 | 大纲未列 |
| 主流 | 「最重要的区别」：模板 DSL + 指令 vs 纯 JS 表达 UI（文件头承诺） | https://vuejs.org/guide/scaling-up/sfc.html | 已讲对 | src/topics/01-component-and-jsx/react/Example.tsx:17-20 | 「没有任何模板语法」绝对化见 R2-01-11 |

#### 面试 5 问

1. JSX 是什么？浏览器能直接运行吗？（追问：编译成什么调用？为什么 React 17 之后不用 `import React`？React 19 对 transform 有什么要求？）
2. 为什么组件名必须大写开头？（追问：写成 `<mybutton />` 会发生什么？JSX 里 `<div>` 与 `<Div>` 的区别在哪一步产生？）
3. 「组件必须是纯函数」是什么意思？（追问：局部突变算不算违反？StrictMode 为什么双调组件？生产环境会双调吗？）
4. 一次渲染发生了什么？render 和 commit 有什么区别？（追问：调用组件函数等于更新 DOM 吗？为什么说渲染是递归的？浏览器 paint 在哪一步？）
5. 为什么不能在组件内部定义另一个组件？（追问：现象是什么？和「同位置同组件保留 state」规则有什么关系？用 key 能解决吗？）

#### 生产写法要点

- 根组件包 `<StrictMode>`，开发期暴露不纯与缺 cleanup，生产零成本；演示若省略需标「演示简化」。
- 一文件一组件 default export + 类型导出；工具函数、常量放 named export；避免在组件体内创建组件或 hooks 工厂（`static-components` 规则会报错）。
- 样式方案（CSS Modules / Tailwind / CSS-in-JS）由项目决定；演示用内联 `style` 对象要标「演示简化」，并提示 `className` 拼接由字符串完成、React 无内置对象语法。
- 富文本必须经服务端或客户端消毒后才能进 `dangerouslySetInnerHTML`；不要把「注释里提醒」当作实现（主责 35）。
- ESLint 使用 eslint-plugin-react-hooks 7.1.1 `recommended`（含编译器规则），TS 用 `React.JSX` 命名空间而非全局 `JSX`（facts-versions A）。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| 函数组件（函数 + JSX） | SFC `.vue`（`<script setup>` + `<template>` + `<style>`）；也可无构建的对象 + `template` 字符串 | https://vuejs.org/guide/scaling-up/sfc.html + https://vuejs.org/guide/essentials/component-basics.html（2026-09-16） | Vue 亦支持 JSX/TSX 但 "Vue JSX transform is different from React's"：可用 `class`/`for`，slots 传递方式不同（https://vuejs.org/guide/extras/render-function.html） |
| JSX `{expr}` 任意表达式 | `{{ }}` 插值 + 指令；每个绑定只能一个表达式，沙箱且只能访问受限全局 | https://vuejs.org/guide/essentials/template-syntax.html（2026-09-16，逐字） | 插值按纯文本解释，与 JSX 文本自动转义一致 |
| `className` / `htmlFor` / camelCase 属性 | `class` / `for` 原样；`:id` 同名简写（3.4+） | https://react.dev/learn/writing-markup-with-jsx + https://vuejs.org/guide/essentials/template-syntax.html（2026-09-16） | React 用 DOM 属性名，Vue 用 HTML 属性名 |
| `className` 字符串拼接 | `:class` 对象 / 数组语法；多根组件需手动 `$attrs.class` | https://vuejs.org/guide/essentials/class-and-style.html（2026-09-16，逐字） | React 无内置对象语法，靠 JS 拼接 |
| `style={{ fontWeight: 'bold', width: 100 }}` 数字自动 px | `:style` 对象支持 camelCase 或 kebab，自动补厂商前缀；文档示例手动拼 `'px'` | https://react.dev/reference/react-dom/components/common#style + https://vuejs.org/guide/essentials/class-and-style.html（2026-09-16） | 自动加 px 是 React 特有行为 |
| Fragment `<>...</>` | 组件可多根（3.x）；`<template v-if/v-for>` 做无痕包裹 | https://react.dev/reference/react/Fragment + https://vuejs.org/guide/components/attrs.html（2026-09-16） | Vue 多根时 attrs 不再自动透传（见 02） |
| 纯渲染 + StrictMode 双调 | 模板 / render 函数亦应无副作用；无 StrictMode 等价物 | https://react.dev/learn/keeping-components-pure（2026-09-16） | Vue `setup` 只执行一次、模板按依赖重跑，「重跑整个函数」的心智模型不适用（深入见 23） |
| 组件名大写；JSX 大小写敏感 | 推荐 PascalCase；in-DOM 模板大小写不敏感须 kebab-case、不能自闭合 | https://vuejs.org/guide/essentials/component-basics.html#in-dom-template-parsing-caveats（2026-09-16） | 此差异仅限 in-DOM 模板，SFC 不受影响 |
| `dangerouslySetInnerHTML` | `v-html`（scoped 样式不作用于其内容） | https://vuejs.org/api/built-in-directives.html#v-html（2026-09-16，逐字） | 两边都警告 XSS；主责 35 |
| 无对应（memo/useMemo 见 17） | `v-once` / `v-memo`（3.2+） | https://vuejs.org/api/built-in-directives.html（2026-09-16） | Vue 编译器做模板级静态优化；React 靠 Compiler 或手动 memo |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-01-1 | 严重 | 未讲 | 其它 | 组件名必须大写开头，小写会被当作 HTML 标签 | — | — | 文件头承诺「函数组件」，但 your-first-component 的第一条规则（"their names must start with a capital letter or they won't work!"）没讲；`<mybutton />` 会被当原生标签 | grep0:大写 | 二、核心概念 |
| R2-01-2 | 严重 | 未讲 | 其它 | 绝不在组件内部定义组件：每次渲染产生新函数 → 同位置视为不同组件 → state 重置且慢 | — | — | 承诺「组件就是普通函数」却没讲这条最常踩的规则（"you must never nest their definitions"） | grep0:嵌套\|内部定义 | 六、易错点 |
| R2-01-3 | 严重 | 未讲 | 其它 | 组件必须是纯函数：同输入同输出、不改渲染前已存在的对象；局部突变允许；副作用放事件处理器 | — | — | 文件头 `UI = f(props/state)` 依赖纯性却没讲；纯性收益（memo 跳过 / 并发中断 / 服务端）也没提 | grep0:纯函数\|副作用\|pure | 二、核心概念 |
| R2-01-4 | 概念 | 未讲 | 其它 | `<StrictMode>` 开发期双调组件、初始化函数与 Effect，生产零成本 | — | — | 主流加分点；学习者在 dev 里看到 console 打两次会困惑 | grep0:StrictMode | 五、常见追问与回答要点 |
| R2-01-5 | 概念 | 未讲 | 其它 | 渲染三步 Trigger → Render → Commit；同一组件多次使用各自独立实例 | — | — | 至少一句并指向 23 / 03，否则「调用组件函数 = 更新 DOM」的误解无从纠正 | grep0:commit\|提交\|实例 | 二、核心概念 |
| R2-01-6 | 概念 | 未讲 | 旧写法 | 八、旧写法对照整段缺失：classic runtime 需 `import React`（17 起 automatic，19 必须新 transform）；class 组件、`ReactDOM.render` / `findDOMNode` / string ref 19 已移除 | — | — | react/Example.tsx:60 只给出 `jsx('div', …)` 形式，没说自动运行时、`react/jsx-runtime` 与历史；存量 React 18 代码读不懂 | grep0:import React\|jsx-runtime\|createElement\|ReactDOM.render\|findDOMNode\|类组件 | 八、旧写法对照 |
| R2-01-7 | 概念 | 未讲 | 安全a11y | `dangerouslySetInnerHTML={{ __html }}` ↔ `v-html` 与 XSS 一句，指向 35 | — | — | course-map §2 指定 01 只作引用；两边都有官方 XSS 警告 | grep0:dangerouslySetInnerHTML\|v-html | 三、Vue 对照 |
| R2-01-8 | 概念 | 未讲 | 其它 | JSX / 模块细节：标签必须闭合、`aria-*` / `data-*` 保留连字符、多行 return 加括号、`<>` 不能带 key、default / named export 约定、返回类型 ReactNode | — | — | 大纲主流项均未提；`export default` 在 react/Example.tsx:67 出现但无说明 | grep0:闭合\|aria-\|data-\|圆括号\|命名导出\|ReactNode | 二、核心概念 |
| R2-01-9 | 概念 | 未讲 | 性能 | 新动向缺失：React Compiler 依赖纯性、react-hooks 7.1.1 `recommended` 含 `purity` / `static-components`【较新】；19.3 `<Fragment ref>`、Trusted Types【尝鲜】 | — | — | 九段整段缺失；Compiler 不启用但要讲（course-map §12） | grep0:Compiler\|Trusted\|19\.3 | 九、新动向 |
| R2-01-10 | 生产 | 未标简化 | 生产简化 | 内联 `style` 对象与硬编码色值未标「演示简化」，未提 CSS Modules / Tailwind / CSS-in-JS 等项目级方案 | src/topics/01-component-and-jsx/react/Example.tsx:45-54; src/topics/01-component-and-jsx/react/Example.tsx:81 | const avatarStyle: CSSProperties | 学习者会把 `style={{ }}` 当默认样式方案；大纲生产要点要求标注 | grep0:演示简化 | 七、生产环境注意 |
| R2-01-11 | 小问题 | 措辞 | 绝对化 | 「没有一一对应关系」模板残留；「React 没有任何模板语法」「一次只能返回单个根节点」绝对化（返回带 key 的数组也合法）；「Vue 模板里没有等价写法」应补一句 Vue 也支持 JSX | src/topics/01-component-and-jsx/react/Example.tsx:63; src/topics/01-component-and-jsx/react/Example.tsx:19; src/topics/01-component-and-jsx/react/Example.tsx:7; src/topics/01-component-and-jsx/react/Example.tsx:69; src/topics/01-component-and-jsx/vue/Example.vue:78; src/topics/01-component-and-jsx/vue/Example.vue:20 | 没有一一对应关系 | ReactNode 联合含 `Iterable<ReactNode>`；Vue 官方文档有 JSX/TSX 章节（"Vue JSX transform is different from React's"） | node_modules/@types/react/index.d.ts:436-449; https://vuejs.org/guide/extras/render-function.html（2026-09-16，逐字） | 四、关键区别 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | JSX 是什么？浏览器能直接运行吗？（编译成什么调用？为什么 17 后不用 `import React`？19 对 transform 的要求？） | 部分 | src/topics/01-component-and-jsx/react/Example.tsx:59-63 | 只知道「编译成 jsx() 调用」；自动运行时、`import React` 历史、19 必须新 transform 全无 |
| 2 | 为什么组件名必须大写开头？（`<mybutton />` 会怎样？`<div>` 与 `<Div>` 的区别在哪一步产生？） | 不能 | — | 大写规则一字未提 |
| 3 | 「组件必须是纯函数」是什么意思？（局部突变算不算？StrictMode 为什么双调？生产会双调吗？） | 不能 | — | 纯性、局部突变、StrictMode 均未讲 |
| 4 | 一次渲染发生了什么？render 和 commit 有什么区别？（调用组件函数等于更新 DOM 吗？paint 在哪一步？） | 不能 | — | 渲染三步未讲，也没指向 23 |
| 5 | 为什么不能在组件内部定义另一个组件？（现象？与「同位置同组件保留 state」的关系？key 能解决吗？） | 不能 | — | 嵌套定义规则未讲 |

### 02. Props

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | props = 组件函数唯一参数，用解构读取（文件头承诺） | https://react.dev/learn/passing-props-to-a-component | 已讲对 | src/topics/02-props/react/Example.tsx:5; src/topics/02-props/react/Example.tsx:61 | — |
| 主流 | 参数解构默认值 `{ discount = 0 }`（文件头承诺） | https://react.dev/learn/passing-props-to-a-component | 已讲对 | src/topics/02-props/react/Example.tsx:6; src/topics/02-props/react/Example.tsx:57-61 | — |
| 主流 | 默认值只在缺失 / `undefined` 时生效；传 `null` / `0` 不走默认值 | https://react.dev/learn/passing-props-to-a-component | 未讲 | — | R2-02-3 |
| 主流 | props 只读，改动通过回调上浮（文件头承诺，指向 08） | https://react.dev/learn/passing-props-to-a-component | 已讲对 | src/topics/02-props/react/Example.tsx:8; src/topics/02-props/react/Example.tsx:62-66 | — |
| 主流 | 「React 不警告」：开发构建下 element.props 被 `Object.freeze`，严格模式赋值抛 TypeError（文件头「最重要的区别」） | node_modules/react/cjs/react-jsx-runtime.development.js:193 | 讲了但错 | src/topics/02-props/react/Example.tsx:28-29; src/topics/02-props/react/Example.tsx:65; src/topics/02-props/vue/OrderCard.vue:27 | R2-02-1 |
| 主流 | Props 是每次渲染的只读快照；props 像参数、state 是记忆 | https://react.dev/learn/passing-props-to-a-component + https://react.dev/learn/state-a-components-memory | 未讲 | — | R2-02-5 |
| 主流 | 单向数据流：父 → 子；子影响父靠 `onX` 回调（文件头承诺） | https://react.dev/learn/passing-props-to-a-component | 已讲对 | src/topics/02-props/react/Example.tsx:8; src/topics/02-props/react/Example.tsx:66 | — |
| 主流 | `{...rest}` 展开转发；"Use spread syntax with restraint" | https://react.dev/learn/passing-props-to-a-component | 已讲对 | src/topics/02-props/react/Example.tsx:10-11; src/topics/02-props/react/Example.tsx:133; src/topics/02-props/react/Example.tsx:148 | 「克制」提示未讲，见 R2-02-8 |
| 主流 | 嵌套 JSX 进入 `children`（主责 13） | https://react.dev/learn/passing-props-to-a-component | 已讲对 | src/topics/02-props/react/Example.tsx:133; src/topics/02-props/react/Example.tsx:149; src/topics/02-props/vue/UiButton.vue:47 | 仅 Vue 侧指向 13 |
| 主流 | 不把 props 镜像进 state；刻意忽略更新时命名 `initialX` | https://react.dev/learn/choosing-the-state-structure#dont-mirror-props-in-state | 未讲 | — | R2-02-4 |
| 主流 | TS：interface + 可选 `?` + 字符串联合（文件头承诺，指向 28） | https://react.dev/learn/typescript | 已讲对 | src/topics/02-props/react/Example.tsx:43-50; src/topics/02-props/react/Example.tsx:122-125; src/topics/02-props/react/Example.tsx:14 | — |
| 主流 | 继承原生属性 `ComponentPropsWithoutRef<'button'>` + `...rest`（文件头承诺） | node_modules/@types/react/index.d.ts:1452, 1530 | 已讲对 | src/topics/02-props/react/Example.tsx:12-13; src/topics/02-props/react/Example.tsx:111-125; src/topics/02-props/react/Example.tsx:148 | 大纲未列：rest 展开位置决定外部能否覆盖默认值（react:143-147） |
| 主流 | 外部 `className` 与内部类名合并而非覆盖 | — | 已讲对 | src/topics/02-props/react/Example.tsx:134-140; src/topics/02-props/react/Example.tsx:208-214 | 大纲未列（大纲生产要点） |
| 主流 | `ref` 作为普通 prop（19），forwardRef 不再必需（主责 12） | https://react.dev/blog/2024/12/05/react-19 + node_modules/@types/react/index.d.ts:293-302 | 已讲对 | src/topics/02-props/react/Example.tsx:118-120 | 交叉引用见 R2-02-7 |
| 主流 | ref 回调可返回清理函数（19，主责 12） | https://react.dev/blog/2024/12/05/react-19 + node_modules/@types/react/index.d.ts:176-185 | 未讲 | — | R2-02-9 |
| 主流 | `key` / `ref` 不是普通 props；组件收不到 `key` | https://react.dev/learn/rendering-lists + node_modules/@types/react/index.d.ts:258-260 | 未讲 | — | R2-02-8 |
| 主流 | JSX 无值属性即 `true`（`<UiButton disabled>`） | 见 P-02-1 | 未讲 | — | R2-02-8；react:196 用了未说明 |
| 较新 | @types/react 19 类型变化：`ReactElement` props 为 unknown、`useRef` 必传初始值 | node_modules/@types/react/index.d.ts:325-332, 1480-1484 + facts-versions B | 未讲 | — | R2-02-9 |
| 旧写法 | 函数组件 `defaultProps` 19 移除，改参数默认值（文件头承诺） | node_modules/@types/react/index.d.ts:1060-1075 | 已讲对 | src/topics/02-props/react/Example.tsx:7; src/topics/02-props/react/Example.tsx:59 | 类组件仍有 `defaultProps` 未提，见 R2-02-6 |
| 旧写法 | `propTypes` 19 起不再校验，类型标 `@deprecated` | node_modules/@types/react/index.d.ts:1063-1066 | 缺标签 | src/topics/02-props/react/Example.tsx:7 | R2-02-6：只说「过时」无版本 |
| 旧写法 | `forwardRef`：19 语义弃用；兼容 React 18 的库仍需 | https://react.dev/reference/react/forwardRef + node_modules/@types/react/index.d.ts:1403 | 缺标签 | src/topics/02-props/react/Example.tsx:119-120 | R2-02-6 |
| 旧写法 | 类组件 `this.props` / 字符串 ref / `element.ref`（19 移除 / 弃用） | https://react.dev/blog/2024/04/25/react-19-upgrade-guide | 未讲 | — | R2-02-6 |
| 主流 | Vue：`defineProps` 类型式声明、编译器宏（文件头承诺） | https://vuejs.org/guide/components/props.html | 已讲对 | src/topics/02-props/react/Example.tsx:17; src/topics/02-props/react/Example.tsx:26; src/topics/02-props/vue/OrderCard.vue:20-24 | — |
| 主流 | Vue 3.5 响应式 props 解构为默认值主线；`withDefaults` 为 3.4 及以下写法 | https://vuejs.org/api/sfc-script-setup.html | 讲了但错 | src/topics/02-props/react/Example.tsx:17; src/topics/02-props/vue/OrderCard.vue:22-24; src/topics/02-props/vue/UiButton.vue:26 | R2-02-2 |
| 主流 | Vue props 单向；改 props 开发期警告（文件头承诺） | https://vuejs.org/guide/components/props.html | 已讲对 | src/topics/02-props/react/Example.tsx:18; src/topics/02-props/vue/OrderCard.vue:26 | — |
| 主流 | Vue fallthrough attrs 自动落根元素，class / style 合并（文件头承诺） | https://vuejs.org/guide/components/attrs.html | 已讲对 | src/topics/02-props/react/Example.tsx:20-21; src/topics/02-props/vue/UiButton.vue:7-12; src/topics/02-props/vue/Example.vue:115-119 | — |
| 主流 | `inheritAttrs: false` + `useAttrs()` 手动接管 = React 的 rest（文件头承诺） | https://vuejs.org/guide/components/attrs.html | 已讲对 | src/topics/02-props/react/Example.tsx:22-23; src/topics/02-props/vue/UiButton.vue:14-16; src/topics/02-props/vue/UiButton.vue:33-37 | — |
| 主流 | `useAttrs()` 非响应式；多根组件不自动透传并警告 | https://vuejs.org/guide/components/attrs.html | 未讲 | — | R2-02-12 |
| 主流 | Vue `v-bind` 合并顺序：后写覆盖前写，class / style 总是合并 | https://vuejs.org/guide/components/attrs.html | 已讲对 | src/topics/02-props/vue/Example.vue:105-107; src/topics/02-props/vue/UiButton.vue:44-46 | 大纲未列 |
| 主流 | prop 名 camelCase 声明、模板 kebab-case；JSX 无转换 | https://vuejs.org/guide/components/props.html | 已讲对 | src/topics/02-props/react/Example.tsx:159; src/topics/02-props/vue/Example.vue:53 | — |

#### 面试 5 问

1. 为什么 props 是只读的？子组件想改数据怎么办？（追问：直接给 `props.x = 1` 赋值会怎样？「快照」指什么？和 Vue 改 props 的警告有何不同？）
2. props 默认值怎么写？传 `null` 和 `undefined` 有什么区别？（追问：React 19 为什么移除函数组件的 `defaultProps`？类组件呢？）
3. 自定义 `Button` 如何接受所有原生 `<button>` 属性并透传？（追问：`ComponentProps<'button'>` 与 `ComponentPropsWithoutRef` 的区别；`...rest` 里的 `className` 会覆盖内部的怎么办？）
4. React 19 的「ref 作为 prop」是什么？（追问：`forwardRef` 还能用吗？要兼容 React 18 的组件库怎么写？ref 回调返回值有什么新规则？）
5. 为什么不建议把 props 复制进 state？（追问：什么情况下可以？命名约定 `initialX` 的含义；对照 Vue `ref(props.initialCounter)` 与 `computed(() => props.size)`）

#### 生产写法要点

- 透传原生属性时显式合并 `className` / `style`，并用 `Omit<ComponentPropsWithoutRef<'button'>, 'onClick'>` 之类解决与自定义 prop 的冲突；按钮组件给 `type` 明确默认值。
- 组件库要同时支持 React 18 时仍需 `forwardRef`；纯 19 项目直接 `{ ref }` 解构；类型层不要再用 `MutableRefObject`（facts-versions B）。
- 对象 / 数组 / 函数类型的 props 默认值在每次渲染产生新引用，会击穿 `memo`（指向 17）；需要稳定引用时提到模块级常量。
- 运行时校验放在数据边界（API 响应、表单输入），组件 props 只靠 TS；不要为新代码引入 `propTypes`。
- 演示里「props 只读」如果靠 `Object.freeze` 或注释说明，要标「演示简化」，真实约束来自 TS `Readonly` 与代码审查。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| 解构参数 + 默认值 `({ size = 100 })` | `defineProps<{ foo?: string }>()`；3.5 响应式解构 `const { foo = 'hello' } = defineProps()`，编译器自动前缀 `props.`；3.4 及以前 `withDefaults`（对象/数组默认值需工厂函数） | https://vuejs.org/guide/components/props.html + https://vuejs.org/api/sfc-script-setup.html（2026-09-16，逐字） | 解构后的 prop 传给 `watch` / composable 要包 getter `() => foo` |
| props 只读快照 | "All props form a one-way-down binding"；改 prop 触发警告；对象/数组内部可变但不推荐，应 emit | https://vuejs.org/guide/components/props.html（2026-09-16，逐字） | Vue 的 props 是响应式代理，不是每次渲染的新对象 |
| 默认值仅对 `undefined` 生效；无 Boolean 转型 | `default` 同样对缺失/undefined；Boolean 转型：无值即 `true`，`[Boolean, String]` 顺序决定 | https://vuejs.org/guide/components/props.html（2026-09-16） | JSX 无值属性是否默认 `true` 见待核实 |
| `{...rest}` 显式透传 | fallthrough attributes 自动落到单根元素（class/style 合并、v-on 双触发）；`defineOptions({ inheritAttrs: false })` + `v-bind="$attrs"`；`useAttrs()` 非响应式；多根组件不自动透传并警告 | https://vuejs.org/guide/components/attrs.html（2026-09-16，逐字） | React 没有自动透传，所有转发都显式 |
| `ComponentProps<'button'>` 类型继承 | 无内置等价类型；透传靠运行时 `$attrs` | `node_modules/@types/react/index.d.ts:1452` | Vue 的透传是运行时机制，类型层不表达 |
| `propTypes`（19 不再校验） | `defineProps({ type, required, validator })` 运行时校验，仅开发期警告 | https://vuejs.org/guide/components/props.html（2026-09-16） | Vue 保留运行时校验，React 交给 TS |
| `ref` 作 prop / `forwardRef` | 模板 ref 指向子组件实例；`<script setup>` 默认封闭，需 `defineExpose`；3.5 `useTemplateRef` | https://vuejs.org/api/sfc-script-setup.html + https://vuejs.org/guide/typescript/composition-api.html（2026-09-16） | 主责 12 |
| prop 名原样 camelCase | 声明 camelCase、模板 kebab-case，自动转换 | https://vuejs.org/guide/components/props.html（2026-09-16） | JSX 无大小写转换 |
| `<Avatar {...props} />` | `<BlogPost v-bind="post" />` | https://vuejs.org/guide/components/props.html（2026-09-16） | 同为整体展开 |
| 泛型组件（主责 28） | `<script setup lang="ts" generic="T">` | https://vuejs.org/api/sfc-script-setup.html（2026-09-16） | — |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-02-1 | 严重 | 讲错 | 其它 | 「React 不警告、纯靠约定」讲反：开发构建下 jsx 运行时对 element.props 调用 `Object.freeze`，ESM 严格模式里 `props.amount = 0` 直接抛 TypeError；生产构建不冻结、赋值静默无效且不重渲染 | src/topics/02-props/react/Example.tsx:28; src/topics/02-props/react/Example.tsx:65; src/topics/02-props/vue/OrderCard.vue:27 | Vue 有运行时警告兜底，React 不警告 | 文件头「最重要的区别」把 React 说成零兜底；react:63 改解构局部变量不报错是对的，但大纲面试 1 问追问的 `props.x = 1` 行为讲错 | node_modules/react/cjs/react-jsx-runtime.development.js:193（`Object.freeze(type.props)`）；https://react.dev/learn/passing-props-to-a-component（2026-09-16，逐字 "Props are read-only snapshots in time"） | 四、关键区别 |
| R2-02-2 | 概念 | 讲错 | Vue现行写法 | 「默认值要包一层 withDefaults」已过时：3.5 主线是响应式 props 解构 `const { discount = 0 } = defineProps<Props>()`，`withDefaults` 只是 3.4 及以下的写法；两份 .vue 主线代码仍用 withDefaults，且未提解构 prop 传 composable / watch 要包 getter | src/topics/02-props/react/Example.tsx:17; src/topics/02-props/vue/OrderCard.vue:24; src/topics/02-props/vue/UiButton.vue:26 | 默认值要包一层 withDefaults | 02 是 course-map §2「响应式 props 解构」主责题；OrderCard.vue:22-23 只在注释里提了一句就「保留 withDefaults」 | https://vuejs.org/api/sfc-script-setup.html（2026-09-17，逐字 "In 3.5 and above, default values can be naturally declared when using Reactive Props Destructure. But in 3.4 and below, Reactive Props Destructure is not enabled by default."）；https://vuejs.org/guide/components/props.html（2026-09-17，逐字 "useComposable(() => foo)"） | 三、Vue 对照 |
| R2-02-3 | 概念 | 未讲 | 其它 | 参数默认值只在缺失或 `undefined` 时生效；传 `null` / `0` 不会用默认值 | — | — | 承诺「默认值」但没讲边界；大纲面试 2 问 | grep0:undefined\|null | 六、易错点 |
| R2-02-4 | 概念 | 未讲 | 其它 | 不要把 props 镜像进 state（`useState(props.x)` 后父组件更新被忽略）；刻意忽略更新时命名 `initialX` / `defaultX`，指向 09 | — | — | 大纲面试 5 问整问答不上 | grep0:镜像\|initialX\|复制进 state\|复制到 state | 六、易错点 |
| R2-02-5 | 概念 | 未讲 | 其它 | Props 是每次渲染的只读快照（"every render receives a new version of props"）；props 像函数参数、state 是组件记忆 | — | — | 与 03 / 23 的「快照」心智模型接不上 | grep0:快照 | 二、核心概念 |
| R2-02-6 | 概念 | 缺标签 | 旧写法 | 旧写法对照不完整：PropTypes 只说「过时」未注明 19 起不再校验；类组件 `ComponentClass` 仍有 `defaultProps`；`forwardRef` 仍可用、要兼容 React 18 的组件库仍需要它；string ref / `element.ref` 19 移除 / 弃用 | src/topics/02-props/react/Example.tsx:7; src/topics/02-props/react/Example.tsx:59; src/topics/02-props/react/Example.tsx:118-120 | defaultProps / PropTypes 是过时写法 | 规格要求「很多公司仍在用 18」的对照面；大纲面试 2 / 4 问追问 | node_modules/@types/react/index.d.ts:1063-1066; node_modules/@types/react/index.d.ts:1152; https://react.dev/reference/react/forwardRef（2026-09-16，逐字 "In React 19, forwardRef is no longer necessary. Pass ref as a prop instead."） | 八、旧写法对照 |
| R2-02-7 | 小问题 | 措辞 | 交叉引用 | react:120「12 题…不展开 ref 透传」与主责冲突：ref 透传 / useImperativeHandle / ref 回调清理主责 12，`ComponentProps` 与 ref-as-prop 类型主责 28；应改成一句「详见 12 / 28」 | src/topics/02-props/react/Example.tsx:120 | 不展开 ref 透传 | 学习者会以为全站没有讲 ref 透传的地方 | course-map.md §2 盲点归属表（useImperativeHandle、ref 回调清理 → 12；ComponentProps 与 ref-as-prop → 28） | 二、核心概念 |
| R2-02-8 | 概念 | 未讲 | 其它 | `key` 不是 prop（组件收不到，需要 id 另传）；`{...props}` 展开要克制（"Use spread syntax with restraint"）；JSX 无值属性 `disabled` 即 `true`（react:196 用了未说明） | — | — | 三条都是 passing-props / rendering-lists 页的主流内容 | grep0:key\|克制\|restraint\|即 true\|等于 true | 六、易错点 |
| R2-02-9 | 概念 | 未讲 | TS19 | @types/react 19 类型变化（`ReactElement` props 为 unknown、`useRef` 必传初始值、不再用 `MutableRefObject`）与 ref 回调清理函数：本题至少一句并指向 28 / 12 | — | — | 【较新】内容整体缺失 | grep0:unknown\|清理函数\|cleanup\|MutableRefObject | 九、新动向 |
| R2-02-10 | 生产 | 未讲 | 生产简化 | 生产段缺：`style` 也要合并；用 `Omit<ComponentPropsWithoutRef<'button'>, 'x'>` 解决与自定义 prop 同名冲突；对象 / 函数型默认值每次渲染新引用会击穿 `memo`（17）；运行时校验放数据边界（zod 等）而非 props | — | — | 演示只合并 className，其余组件库 API 的常见 review 点没提 | grep0:Omit\|style 合并\|memo\|zod\|运行时校验 | 七、生产环境注意 |
| R2-02-11 | 小问题 | 措辞 | 绝对化 | 「没有一一对应关系」模板残留 ×4；「根本不存在」「唯一手段」「永远」等绝对化；「SFC…子组件必须放单独的 .vue 文件」可放宽（`defineComponent` + `h` 亦可内联） | src/topics/02-props/react/Example.tsx:31; src/topics/02-props/react/Example.tsx:106; src/topics/02-props/vue/UiButton.vue:32; src/topics/02-props/react/Example.tsx:32; src/topics/02-props/react/Example.tsx:104; src/topics/02-props/react/Example.tsx:146; src/topics/02-props/react/Example.tsx:19 | 没有一一对应关系 | 规格 §5 H / B 模式 | https://vuejs.org/guide/extras/render-function.html（2026-09-16，摘要） | 四、关键区别 |
| R2-02-12 | 概念 | 未讲 | Vue现行写法 | Vue 侧：`useAttrs()` 返回对象非响应式（不能 watch）；多根组件不自动透传并警告，需手动绑 `$attrs` | — | — | 演示恰好是单根，学习者换成多根就踩坑 | grep0:非响应式\|不是响应式\|多根 | 三、Vue 对照 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 为什么 props 是只读的？子组件想改数据怎么办？（`props.x = 1` 会怎样？「快照」指什么？和 Vue 的警告有何不同？） | 部分 | src/topics/02-props/react/Example.tsx:8; src/topics/02-props/react/Example.tsx:62-66; src/topics/02-props/react/Example.tsx:28-29 | 缺「快照」表述；dev 下 props 被冻结这一点讲反 |
| 2 | props 默认值怎么写？传 `null` 和 `undefined` 有什么区别？（19 为什么移除函数组件 `defaultProps`？类组件呢？） | 部分 | src/topics/02-props/react/Example.tsx:57-59 | 缺 null vs undefined、类组件仍有 defaultProps、移除原因 |
| 3 | 自定义 Button 如何接受所有原生 `<button>` 属性并透传？（`ComponentProps` 与 `WithoutRef` 区别；`className` 覆盖怎么办？） | 能 | src/topics/02-props/react/Example.tsx:111-152 | — |
| 4 | React 19 的「ref 作为 prop」是什么？（`forwardRef` 还能用吗？兼容 18 的库怎么写？ref 回调返回值新规则？） | 部分 | src/topics/02-props/react/Example.tsx:118-120 | 缺 forwardRef 仍可用 / 18 兼容、ref 回调清理规则 |
| 5 | 为什么不建议把 props 复制进 state？（什么情况可以？`initialX` 命名；对照 Vue `ref(props.x)` 与 `computed`） | 不能 | — | 整问未讲 |

### 03. State 与 useState

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 文件头承诺：useState 二元组、绝不直接改 state、setter 传新引用、两种 setter 用法、Object.is、渲染快照 | https://react.dev/reference/react/useState | 已讲对 | src/topics/03-state/react/Example.tsx:5-11 | 承诺全部在正文兑现 |
| 主流 | 文件头承诺：useReducer 收敛互相牵制的多状态（→29） | https://react.dev/learn/extracting-state-logic-into-a-reducer | 已讲对 | src/topics/03-state/react/Example.tsx:217-250 | 取舍四条 + 「单个独立值别上 reducer」 |
| 主流 | 为什么普通局部变量不行（不跨渲染、不触发渲染）+ state 每实例私有 | https://react.dev/learn/state-a-components-memory | 未讲 | — | R2-03-3 |
| 主流 | 签名 `useState<S>(initialState)`、泛型显式标注 | node_modules/@types/react/index.d.ts:1689 | 已讲对 | src/topics/03-state/react/Example.tsx:315 | `SetStateAction` 类型名与无参重载归 28 |
| 主流 | Hooks 规则：顶层调用、按调用顺序匹配 | https://react.dev/learn/state-a-components-memory | 未讲 | — | R2-03-2（主责 14，本题首用 Hook 应带一句） |
| 主流 | setter 只对下一次渲染生效；set 后立刻读仍是旧值 | https://react.dev/reference/react/useState | 已讲对 | src/topics/03-state/react/Example.tsx:46-60 | 区块一可点击验证 |
| 主流 | `Object.is` 相等则跳过重渲染 | https://react.dev/reference/react/useState | 已讲对 | src/topics/03-state/react/Example.tsx:9; src/topics/03-state/react/Example.tsx:202; src/topics/03-state/react/Example.tsx:326-327 | 「可能仍调一次组件再跳过子树」细节在 23 |
| 主流 | 函数式更新 `setX(prev => …)` 与何时必须用 | https://react.dev/reference/react/useState | 已讲对 | src/topics/03-state/react/Example.tsx:76-86; src/topics/03-state/react/Example.tsx:333-338 | 判定规则归 24；措辞见 R2-03-9 |
| 主流 | 惰性初始化 `useState(() => init())` | https://react.dev/reference/react/useState | 未讲 | — | R2-03-1（只在 useReducer 处提「本课不展开」） |
| 主流 | 对象 / 数组 state 整体替换、不能原地改 | https://react.dev/learn/updating-objects-in-state | 已讲对 | src/topics/03-state/react/Example.tsx:317-346 | 系统化归 21 |
| 主流 | 状态结构五原则；不镜像 props | https://react.dev/learn/choosing-the-state-structure | 未讲 | — | R2-03-4 |
| 主流 | `status` 联合替代多个 boolean（impossible states） | https://react.dev/learn/reacting-to-input-with-state | 未讲 | — | R2-03-4 |
| 主流 | TS：从初始值推断 / 显式泛型 | https://react.dev/learn/typescript | 已讲对 | src/topics/03-state/react/Example.tsx:315 | 联合类型 `useState<Status>` 示例归 28 |
| 主流 | 「Too many re-renders」；把函数存进 state | https://react.dev/reference/react/useState | 未讲 | — | R2-03-5 |
| 主流 | 跨组件共享 → 状态提升 25 / Context 15 / store 16 | https://react.dev/learn/sharing-state-between-components | 已讲对 | src/topics/03-state/react/Example.tsx:231-232 | 只指向 16，见 R2-03-10 |
| 主流 | StrictMode 开发期双调初始化 / 更新函数（机制归 23） | https://react.dev/reference/react/useState | 已讲对 | src/topics/03-state/react/Example.tsx:155-156 | 只在 reducer 处说；useState 的初始化 / 更新函数未提 |
| 较新 | lint `set-state-in-render` / `immutability`（recommended 预设）与 React Compiler | https://react.dev/reference/eslint-plugin-react-hooks | 未讲 | — | R2-03-7；本项目 eslint.config.js 未启用 recommended（见 pending） |
| 旧写法 | class `this.setState(partial)` 浅合并 vs Hooks setter 整体替换 | https://react.dev/reference/react/Component#setstate（2026-09-17，逐字） | 未讲 | — | R2-03-6 |
| 主流 | 判别联合 Action + `never` 穷尽检查（大纲未列，29 主责） | https://react.dev/reference/react/useReducer | 已讲对 | src/topics/03-state/react/Example.tsx:127-142; src/topics/03-state/react/Example.tsx:204-213 | 大纲未列 |
| 主流 | dispatch / setter 引用稳定，可直接传给 memo 子组件（大纲未列） | https://react.dev/reference/react/useReducer | 已讲对 | src/topics/03-state/react/Example.tsx:228-229 | 大纲未列 |
| 主流 | 派生值渲染时直接算，不另开 state（大纲未列，→09） | https://react.dev/learn/you-might-not-need-an-effect | 已讲对 | src/topics/03-state/react/Example.tsx:353-360 | 大纲未列 |
| 主流 | 「setState 同步还是异步」面试答法 + React 18+ 批处理（大纲未列，→24） | https://react.dev/reference/react/useState | 已讲对 | src/topics/03-state/react/Example.tsx:58-64 | 大纲未列 |
| 主流 | Vue `ref` / `reactive` 直接改即更新；`reactive` 装互相牵制的多字段 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/03-state/vue/Example.vue:41-59; src/topics/03-state/vue/Example.vue:114-121 | 3.5 现行写法，无过时 API |
| 主流 | Vue 改完立刻读到新值（DOM 延后到 nextTick） | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing | 已讲对 | src/topics/03-state/vue/Example.vue:76-91 | nextTick 未提，归 24 |
| 主流 | Vue 响应式原理对照：reactive 用 Proxy、ref 用 getter/setter；依赖追踪精确到组件 render effect | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-17，逐字） | 讲了但错 | src/topics/03-state/react/Example.tsx:17; src/topics/03-state/react/Example.tsx:312-313 | R2-03-8 |
| 主流 | Vue 不镜像 props（prop 作初始值要定义本地 ref） | https://vuejs.org/guide/components/props.html#one-way-data-flow | 未讲 | — | R2-03-4（合并） |
| 主流 | 惰性初始化在 Vue 无对应物（setup 只跑一次） | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 未讲 | — | R2-03-1（合并） |
| 主流 | 模板残留「（没有一一对应关系）」与绝对化措辞 | course-map §6 B / H | 讲了但错 | src/topics/03-state/react/Example.tsx:19-20; src/topics/03-state/react/Example.tsx:239; src/topics/03-state/vue/Example.vue:20-21; src/topics/03-state/vue/Example.vue:86; src/topics/03-state/vue/Example.vue:102 | R2-03-9 |

#### 面试 5 问

1. 为什么 `setCount(count + 1)` 之后立刻 `console.log(count)` 还是旧值？（追问：那怎样拿到「更新后」的值——下一次渲染 / 用 effect / 用函数式更新算出来）
2. useState 的初始值只在第一次渲染生效，那 `useState(expensive())` 有什么问题、怎么改？（追问：惰性初始化和「props 镜像进 state 不更新」是同一个原因吗？）
3. Hooks 为什么不能写在 if 里？（追问：React 靠什么把第二个 useState 和第二次渲染的第二个 useState 对上？）
4. 一个表单同时有 isTyping / isSubmitting / isSuccess 三个布尔值，有什么问题、怎么重构？（追问：什么时候该把几个 state 合成一个对象、什么时候该拆开？）
5. setState 的值和上次一样，会重渲染吗？（追问：对象 state 为什么「一样的内容」也会重渲染——`Object.is` 比的是引用）

#### 生产写法要点

- 对象 / 数组 state 用 TS 把类型写全（`useState<Order[]>([])`），联合状态用字面量联合而不是多个 boolean；表单类多字段状态优先 useReducer 或表单库（31 题 Actions）。
- 惰性初始化只用于真的昂贵的计算（读 localStorage、建大数组）；读 localStorage 要 try/catch，SSR 场景初始化函数里不能碰 `window`（33 题）。
- 演示里「set 后打印」是教学；生产里派生值直接在渲染时算（09），不要为了「拿到新值」再开一个 effect（10 题「you might not need an effect」）。
- 服务端数据不要塞进 useState 手动同步（30 题 TanStack Query）；URL 可表达的筛选 / 分页放路由 query（18 题）。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `const [x, setX] = useState(v)` | `const x = ref(v)`；改 `x.value = ...` | node_modules/@vue/reactivity/dist/reactivity.d.ts:441-442；https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，逐字：推荐 `ref()` 为声明响应式状态的首选 API） | React 通过 setter「请求重渲染」，Vue 通过 Proxy / getter-setter 依赖追踪自动更新，不需要 setter |
| 对象 state 整体替换 `setUser({...user, name})` | `reactive({})` 可原地 `user.name = ...`；但 `reactive` 不能整体替换、不能解构 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，逐字「Limitations of reactive()」三条） | 方向相反：React 禁止原地改、Vue 依赖原地改；详见 21 |
| 「set 后立刻读还是旧值」 | Vue 改完立刻能读到新值，但 DOM 更新缓冲到 next tick，要 `await nextTick()` | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing（2026-09-16，逐字）；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:61-62 | React 是「值」也是快照；Vue 只是 DOM 延后 → 24 题 |
| 「Don't mirror props in state」 | Vue 同样警告：props 单向向下，要用 prop 做初始值就定义本地 `ref`，要变换就用 `computed` | https://vuejs.org/guide/components/props.html#one-way-data-flow（2026-09-16，逐字） | 两边规则一致，Vue 文档说得更直接 |
| status 联合类型代替多个 boolean | 同一思路：`ref<'typing' \| 'submitting' \| 'success'>('typing')` | https://react.dev/learn/reacting-to-input-with-state（2026-09-16，逐字） | 建模原则与框架无关 |
| 惰性初始化 `useState(() => init())` | 无对应物：`<script setup>` 只在实例创建时执行一次，`ref(init())` 天然只算一次 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，摘要） | 原因：Vue 的 setup 不会随更新重跑，React 的函数体每次渲染都重跑 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-03-1 | 概念 | 未讲 | 其它 | 惰性初始化 `useState(() => init())` 未讲 | — | — | 标题承诺 useState，却没讲它的第二种入参；`useState(expensive())` 每次渲染都白算一遍；21 题已在用 `useState(() => structuredClone(…))` 但无人解释；Vue 侧 `ref(init())` 天然只算一次、无对应物 | grep0:useState(() =>\|初始化函数\|initializer | 二、核心概念 |
| R2-03-2 | 概念 | 未讲 | 其它 | Hooks 规则（只在顶层调用、React 按调用顺序匹配）未提 | — | — | 本题是学习者第一次写 Hook，一句「不能进 if / 循环、顺序即身份」都没有；主责 14，本题应带一句并指向 | grep0:顶层\|调用顺序\|Hooks 规则 | 六、易错点 |
| R2-03-3 | 概念 | 未讲 | 其它 | 为什么局部变量不能当 state（不跨渲染、不触发渲染）+ state 每实例私有 | — | — | 官方 useState 入门的动机段完全缺席；「同一组件渲染两次各有独立 state」是面试常见追问 | grep0:局部变量\|私有\|隔离 | 二、核心概念 |
| R2-03-4 | 概念 | 未讲 | 其它 | 状态结构原则（避免冗余 / 矛盾 / 深嵌套、不镜像 props）与 `status` 联合替代多 boolean | — | — | 区块二用 `isEditing: boolean + error: string` 建模，却没讲「impossible states」和 `status: 'idle' \| 'editing'` 这条主流建模法；Vue 侧同样有「不镜像 props」规则 | grep0:冗余\|镜像\|矛盾\|impossible | 二、核心概念 |
| R2-03-5 | 概念 | 未讲 | 其它 | useState 两大排错：渲染期无条件 setState → Too many re-renders；把函数存进 state 会被当初始化器调用 | — | — | 官方 Troubleshooting 两条主流坑一条没有；`onClick={handleClick()}` 是新手高频错误 | grep0:Too many\|无限循环\|渲染期 | 六、易错点 |
| R2-03-6 | 概念 | 未讲 | 旧写法 | class `this.setState(partial)` 浅合并 vs Hooks 整体替换；`this.state` 非快照 | — | — | 存量项目大量 class 组件；官方原文「If you pass an object as nextState, it will be shallowly merged into this.state」（https://react.dev/reference/react/Component#setstate，2026-09-17，逐字）；注明 16.8 起函数组件为主线 | grep0:浅合并\|this\.setState\|类组件 | 八、旧写法对照 |
| R2-03-7 | 概念 | 未讲 | 性能 | eslint-plugin-react-hooks 7 的 `set-state-in-render` / `immutability` 与 React Compiler 未提 | — | — | 规格要求讲 Compiler 及其 lint；注意本项目 eslint.config.js:33-39 只开了 rules-of-hooks / exhaustive-deps，recommended 预设的编译器规则并未生效 | grep0:lint\|immutability\|Compiler | 九、新动向 |
| R2-03-8 | 概念 | 讲错 | 其它 | Vue 响应式对照两处失准：`ref` 不是 Proxy；「粒度精细得多」夸大 | src/topics/03-state/react/Example.tsx:312-313; src/topics/03-state/react/Example.tsx:17 | 只有依赖那个属性的渲染副作用会重新执行 | 官方：「In Vue 3, Proxies are used for reactive objects and getter / setters are used for refs」「each component instance creates a reactive effect to render and update the DOM」（逐字）——粒度是「组件级 render effect」，不是属性级 DOM 更新；Vapor Mode（3.6 rc）才是更细粒度 | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-17，逐字） | 三、Vue 对照 |
| R2-03-9 | 小问题 | 措辞 | 绝对化 | 模板残留「（没有一一对应关系）」7 处；「统一解法都是函数式更新」「稳赢」「根本不存在」 | src/topics/03-state/react/Example.tsx:63; src/topics/03-state/react/Example.tsx:19-20; src/topics/03-state/react/Example.tsx:68; src/topics/03-state/react/Example.tsx:239; src/topics/03-state/react/Example.tsx:336; src/topics/03-state/vue/Example.vue:20-21; src/topics/03-state/vue/Example.vue:86; src/topics/03-state/vue/Example.vue:102 | 统一解法都是函数式更新 | 63 行说「统一解法」64 行又说「解决不了得用 ref」自相矛盾；模板句机械贴在句尾 | course-map §6 B / H | 六、易错点 |
| R2-03-10 | 小问题 | 措辞 | 交叉引用 | 跨组件状态只指向 16，漏 25（状态提升）/ 15（Context）；reducer 未 export 却说可单测 | src/topics/03-state/react/Example.tsx:159; src/topics/03-state/react/Example.tsx:232 | 可以单独 import 出去写单元测试 | `quantityReducer` 未 export；「跨组件状态用 Zustand/Redux Toolkit（16 题）」跳过了官方首选的状态提升 | https://react.dev/learn/sharing-state-between-components | 五、常见追问 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 为什么 `setCount(count + 1)` 之后立刻 `console.log(count)` 还是旧值？追问：怎样拿到更新后的值 | 能 | src/topics/03-state/react/Example.tsx:46-64 | — |
| 2 | `useState(expensive())` 有什么问题、怎么改？追问：惰性初始化与「props 镜像进 state」是同一原因吗 | 部分 | src/topics/03-state/react/Example.tsx:34 | 只说「初始值只在首次渲染被采用」，没讲表达式每次仍执行、`useState(() => …)` 写法，也没讲 props 镜像 |
| 3 | Hooks 为什么不能写在 if 里？追问：React 靠什么把第二个 useState 对上 | 不能 | — | Hooks 规则与「按调用顺序匹配」一字未提 |
| 4 | 三个布尔 isTyping / isSubmitting / isSuccess 有什么问题、怎么重构？追问：何时合成对象、何时拆开 | 部分 | src/topics/03-state/react/Example.tsx:217-226 | 会答「互相牵制收进 reducer」，答不出 `status` 联合消灭 impossible states 与结构原则 |
| 5 | setState 的值和上次一样会重渲染吗？追问：对象 state 为何「内容一样」也重渲染 | 能 | src/topics/03-state/react/Example.tsx:202; src/topics/03-state/react/Example.tsx:326-327 | — |

### 04. 事件处理

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | camelCase 属性绑定函数引用；`onClick={handler()}` 渲染期立即执行（文件头承诺） | https://react.dev/learn/responding-to-events | 已讲对 | src/topics/04-events/react/Example.tsx:5; src/topics/04-events/react/Example.tsx:19-20; src/topics/04-events/react/Example.tsx:84-86; src/topics/04-events/react/Example.tsx:101-106 | — |
| 主流 | 传参包箭头函数 `() => f(id)`；要事件对象写 `(e) => f(id, e)`（文件头承诺） | https://react.dev/learn/responding-to-events | 已讲对 | src/topics/04-events/react/Example.tsx:6; src/topics/04-events/react/Example.tsx:101-111 | — |
| 主流 | 命名约定：处理函数 `handleX`、回调 prop `onX` | https://react.dev/learn/responding-to-events | 未讲 | — | R2-04-4；代码用了 handleX 但无说明 |
| 主流 | 处理器定义在组件内、闭包读 props / state；读到的是本次渲染快照（指向 23 / 26） | https://react.dev/learn/responding-to-events | 未讲 | — | R2-04-3；react:47-71 定义在组件内但未讲闭包与快照 |
| 主流 | 事件对象是合成事件，跨浏览器包装（文件头承诺） | https://react.dev/reference/react-dom/components/common#react-event-object | 已讲对 | src/topics/04-events/react/Example.tsx:7-8; src/topics/04-events/react/Example.tsx:23-24; src/topics/04-events/react/Example.tsx:44-46 | 「与原生一致」需限定 currentTarget，见 R2-04-11 |
| 主流 | 事件委托到 root 容器（17 起，不再是 document）；`e.nativeEvent`；`e.currentTarget` ≠ `nativeEvent.currentTarget` | https://react.dev/reference/react-dom/components/common#react-event-object + node_modules/react-dom/cjs/react-dom-client.development.js:19209, 28057 | 未讲 | — | R2-04-1 |
| 主流 | 冒泡与 `e.stopPropagation()`（文件头承诺） | https://react.dev/learn/responding-to-events | 已讲对 | src/topics/04-events/react/Example.tsx:9-10; src/topics/04-events/react/Example.tsx:56-61; src/topics/04-events/react/Example.tsx:74-76; src/topics/04-events/react/Example.tsx:120 | — |
| 主流 | 捕获阶段 `onClickCapture`；三阶段顺序（先 Capture 向下、目标、再冒泡） | https://react.dev/learn/responding-to-events | 未讲 | — | R2-04-2 |
| 主流 | `onScroll` 不冒泡（17 起）；原生不冒泡的 onLoad / onAbort 在 React 冒泡；onFocus / onBlur 底层 focusin / focusout | https://react.dev/reference/react-dom/components/common + node_modules/react-dom/cjs/react-dom-client.development.js:5328 | 未讲 | — | R2-04-2 |
| 主流 | `e.preventDefault()` 阻止默认行为，与 stopPropagation 是两件事（文件头承诺） | https://react.dev/learn/responding-to-events | 已讲对 | src/topics/04-events/react/Example.tsx:63-67; src/topics/04-events/react/Example.tsx:129-132 | — |
| 主流 | 表单 `onSubmit` + preventDefault；主线见 07 / 31 | https://react.dev/learn/responding-to-events | 未讲 | — | R2-04-6 |
| 主流 | 事件处理器是副作用的最佳位置，不必纯 | https://react.dev/learn/responding-to-events | 未讲 | — | R2-04-3 |
| 主流 | 回调 prop 代替事件传播（指向 08） | https://react.dev/learn/responding-to-events | 未讲 | — | R2-04-4 |
| 主流 | `onChange` 每次击键触发，像原生 input 事件（主责 07） | https://react.dev/reference/react-dom/components/input | 未讲 | — | R2-04-6 |
| 主流 | TS：`MouseEvent<HTMLButtonElement>`；从 react 导入会遮蔽全局 DOM MouseEvent（文件头承诺） | https://react.dev/learn/typescript + node_modules/@types/react/index.d.ts:2155 | 已讲对 | src/topics/04-events/react/Example.tsx:8; src/topics/04-events/react/Example.tsx:23-26; src/topics/04-events/react/Example.tsx:47; src/topics/04-events/react/Example.tsx:64 | 大纲未列：遮蔽全局类型的提示 |
| 主流 | TS：ChangeEvent / FormEvent / KeyboardEvent / `SyntheticEvent` 兜底 / `MouseEventHandler<T>`（主责 28） | node_modules/@types/react/index.d.ts:2054, 2091, 2104, 2130, 2250 | 未讲 | — | R2-04-8 |
| 主流 | 无修饰符：.stop / .prevent 手写（文件头承诺） | https://vuejs.org/guide/essentials/event-handling.html | 已讲对 | src/topics/04-events/react/Example.tsx:9-10; src/topics/04-events/react/Example.tsx:21; src/topics/04-events/react/Example.tsx:56-57; src/topics/04-events/react/Example.tsx:63 | — |
| 主流 | .self / .once / .enter / .ctrl / .exact 的 JS 等价写法 | https://vuejs.org/guide/essentials/event-handling.html | 未讲 | — | R2-04-5 |
| 主流 | `e.persist()` "Not used with React DOM"；事件池 17 移除 | https://react.dev/reference/react-dom/components/common | 未讲 | — | R2-04-7 |
| 主流 | 被动监听：onWheel / onTouchStart / onTouchMove passive，需 ref + addEventListener | ③ https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html | 未讲 | — | R2-04-7；见 P-04-1 |
| 主流 | 内联箭头每次渲染新函数；只有 memo 子组件 / Effect 依赖才 useCallback（17） | https://react.dev/learn/responding-to-events | 未讲 | — | R2-04-4 |
| 尝鲜 | 19.3：onFullscreenChange / onFullscreenError、submit 带 submitter、resize 批处理 | https://react.dev/blog/2026/09/09/react-19-3 | 未讲 | — | R2-04-9 |
| 旧写法 | 类组件 `bind(this)` / 箭头类字段；`e.persist()` 应对事件池 | https://react.dev/reference/react-dom/components/common + ③ v17 RC 博客 | 未讲 | — | R2-04-7 |
| 主流 | Vue：方法 vs 内联处理器，编译器包成内联函数；`$event`（文件头承诺） | https://vuejs.org/guide/essentials/event-handling.html | 已讲对 | src/topics/04-events/react/Example.tsx:13-15; src/topics/04-events/react/Example.tsx:105-108; src/topics/04-events/vue/Example.vue:82-83; src/topics/04-events/vue/Example.vue:98-101 | — |
| 主流 | Vue：.stop / .prevent / .once / .self 修饰符（文件头承诺） | https://vuejs.org/guide/essentials/event-handling.html | 已讲对 | src/topics/04-events/react/Example.tsx:16; src/topics/04-events/vue/Example.vue:118; src/topics/04-events/vue/Example.vue:131 | 只演示了 .stop / .prevent |
| 主流 | Vue：按键 / 系统 / 鼠标修饰符、`.exact`；组件 `emit` 不冒泡 | https://vuejs.org/guide/essentials/event-handling.html + https://vuejs.org/guide/components/events.html | 未讲 | — | R2-04-5 |
| 主流 | Vue：`v-on` 直接绑在元素上，无委托层，`event.currentTarget` 即元素 | https://vuejs.org/api/built-in-directives.html#v-on | 未讲 | — | R2-04-1 |
| 主流 | 「最重要的区别」：模板编译 vs JSX 普通表达式（文件头承诺） | https://vuejs.org/guide/essentials/event-handling.html | 已讲对 | src/topics/04-events/react/Example.tsx:19-21; src/topics/04-events/react/Example.tsx:105-106 | 「没有一一对应关系」残留见 R2-04-11 |
| 主流 | 渲染期调用 setState 的后果 | — | 讲了但错 | src/topics/04-events/react/Example.tsx:104 | R2-04-11：写成「死循环警告」，实际抛 "Too many re-renders" 错误，见 P-04-3 |

#### 面试 5 问

1. `onClick={handleClick}` 和 `onClick={handleClick()}` 有什么区别？（追问：要传参数怎么写？内联箭头函数每次渲染都是新函数有问题吗？什么时候才需要 `useCallback`？）
2. React 的事件是原生事件吗？（追问：合成事件挂在哪里？`e.currentTarget` 与 `e.nativeEvent.currentTarget` 为什么可能不同？React 17 改了什么？）
3. 怎么阻止冒泡、阻止默认行为、只在目标元素触发？（追问：`onClickCapture` 的执行顺序；Vue 的 `.stop/.prevent/.self` 在 React 怎么写？）
4. 事件处理器里能做副作用吗？和渲染期的要求有何不同？（追问：处理器里读到的 state 是最新的吗——快照与过期闭包）
5. React 的 `onChange` 和原生 `change` 事件一样吗？（追问：受控输入为什么必须给 `onChange`？Vue 的 `v-model` 默认监听什么事件、`.lazy` 改成什么？）

#### 生产写法要点

- 表单一律 `onSubmit` + `preventDefault()`（或 19 的 `<form action>`，主责 31），不要只绑按钮 `onClick`，否则回车提交与可访问性丢失。
- 需要 `preventDefault` 的滚轮 / 触摸事件（如自定义缩放）必须用 ref + `addEventListener(..., { passive: false })`，React 的 `onWheel` 是被动的。
- 处理器传参 `() => f(id)` 是主流写法；只有子组件被 `memo` 或作为 Effect 依赖时才 `useCallback`（17）。
- 键盘交互补齐 a11y：可点击的非按钮元素要有 `role`、`tabIndex`、`onKeyDown`（主责 35）。
- 演示里的 `alert` / `console.log` 副作用要标「演示简化」，真实项目为 setState、请求、导航。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `onClick={handler}` / `onClick={() => f(id)}` | `@click="handler"`（方法处理器）/ `@click="f(id)"`（内联处理器），Vue 按表达式形态自动区分 | https://vuejs.org/guide/essentials/event-handling.html（2026-09-16，逐字） | React 内联只能是函数表达式，`onClick={f(id)}` 会立即执行 |
| 处理器参数 `e`（合成事件） | 方法处理器收原生 `event`；内联用 `$event` 或 `(event) => warn('x', event)` | https://vuejs.org/guide/essentials/event-handling.html + https://vuejs.org/api/built-in-directives.html#v-on（2026-09-16，逐字） | Vue 给的是原生事件，无合成层 |
| `e.stopPropagation()` / `e.preventDefault()` / `e.target === e.currentTarget` / `onClickCapture` / 自行去重 | `.stop` / `.prevent` / `.self` / `.capture` / `.once` / `.passive`；顺序有意义；`.passive` 与 `.prevent` 不能同用 | https://vuejs.org/guide/essentials/event-handling.html（2026-09-16，逐字） | React 无修饰符，靠 JS |
| `e.key === 'Enter'`、`e.ctrlKey`、`e.button` | `.enter/.tab/.esc/...`、`.ctrl/.alt/.shift/.meta`、`.exact`、`.left/.right/.middle` | https://vuejs.org/guide/essentials/event-handling.html（2026-09-16，逐字） | — |
| 自定义组件回调 prop `onX`，不冒泡也不自动透传 | 组件 `emit('x')`，"component emitted events do not bubble"；未声明的 `@click` 作为 fallthrough 落到根元素 | https://vuejs.org/guide/components/events.html + https://vuejs.org/guide/components/attrs.html（2026-09-16，逐字） | 主责 08 |
| `onChange` = 原生 `input` 事件 | `v-model` 默认 `input`，`.lazy` 改为 `change` | https://react.dev/reference/react-dom/components/input + https://vuejs.org/api/built-in-directives.html#v-model（2026-09-16，逐字） | 主责 07 |
| 事件委托到 root 容器 | 直接 `addEventListener` 在元素上（`v-on` 编译为原生监听） | https://vuejs.org/api/built-in-directives.html#v-on（2026-09-16，摘要） | Vue 无委托层，`event.currentTarget` 即元素 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-04-1 | 严重 | 未讲 | 其它 | 合成事件是委托在 root 容器上的（React 17 起，之前是 document）；`e.nativeEvent` 可拿原生事件；`e.currentTarget` 与 `nativeEvent.currentTarget` 可能不同 | — | — | 标题承诺「事件对象、冒泡」，文件头承诺「SyntheticEvent」，但委托位置这个面试必问点一字未提；一手依据 node_modules/react-dom/cjs/react-dom-client.development.js:19209（`function listenToAllSupportedEvents(rootContainerElement)`）与 :28057（createRoot 时对 container 调用）；官方原文 "React attaches event handlers at the root" | grep0:nativeEvent\|委托\|根容器\|document | 二、核心概念 |
| R2-04-2 | 概念 | 未讲 | 其它 | 传播模型不完整：捕获阶段 `onClickCapture` 与三阶段顺序；`onScroll` 不冒泡（17 起）；原生不冒泡的 onLoad / onAbort 在 React 冒泡；onFocus / onBlur 底层用 focusin / focusout | — | — | react:81 的「捕获」只是口语，不是捕获阶段；一手依据 node_modules/react-dom/cjs/react-dom-client.development.js:5328（`listenToNonDelegatedEvent("scroll"`） | grep0:Capture\|捕获阶段\|onScroll\|focusin | 二、核心概念 |
| R2-04-3 | 概念 | 未讲 | 其它 | 事件处理器是副作用的最佳位置（"Event handlers are the best place for side effects."），不必纯；处理器闭包读到的是本次渲染快照（指向 23 / 26） | — | — | 代码在处理器里 setState 但从未说明「为什么可以」；与 01 的纯性、23 的快照接不上 | grep0:副作用\|快照 | 二、核心概念 |
| R2-04-4 | 概念 | 未讲 | 其它 | 命名约定 `handleX` / `onX`；回调 prop 代替事件传播（指向 08）；内联箭头每次渲染新函数、只有子组件 `memo` 或作 Effect 依赖时才 `useCallback`（指向 17） | — | — | 大纲面试 1 问追问「内联新函数有问题吗」答不上 | grep0:约定\|useCallback\|回调 prop | 五、常见追问与回答要点 |
| R2-04-5 | 概念 | 未讲 | 其它 | Vue 修饰符对照不全：`.self` → `e.target === e.currentTarget`、`.once` → 自行去重或 `addEventListener(…, { once: true })`、`.enter` / `.ctrl` / `.exact` → `e.key` / `e.ctrlKey`；Vue 侧按键 / 系统修饰符与组件 `emit` 不冒泡 | — | — | 文件头列了 .once / .self 却只给了 .stop / .prevent 的等价写法 | grep0:target === \|e\.key\|ctrlKey\|\.enter\|\.exact\|emit | 三、Vue 对照 |
| R2-04-6 | 概念 | 未讲 | 其它 | `onChange` 每次击键触发、行为像原生 input 事件而非 change（主责 07）；表单一律 `onSubmit` + `preventDefault()` 或 19 的 `<form action>`（指向 07 / 31） | — | — | 大纲面试 5 问整问答不上；preventDefault 只用 `<a>` 演示 | grep0:onChange\|onSubmit\|表单 | 五、常见追问与回答要点 |
| R2-04-7 | 概念 | 未讲 | 旧写法 | 旧写法段缺失：`e.persist()` / 事件池（17 移除，"Not used with React DOM"）、类组件 `this.handleClick.bind(this)`；被动监听 onWheel / onTouch* 为 passive、要 preventDefault 需 ref + `addEventListener(..., { passive: false })` | — | — | 存量 18 代码里 persist / bind 常见；passive 是自定义缩放等场景的真实坑 | grep0:persist\|事件池\|bind(this)\|passive\|被动 | 八、旧写法对照 |
| R2-04-8 | 概念 | 未讲 | 其它 | TS 事件类型只讲了 `MouseEvent<T>`；`ChangeEvent` / `FormEvent` / `KeyboardEvent`、`SyntheticEvent` 兜底、`MouseEventHandler<T>` 未提，也没指向 28 | — | — | 类型定义 node_modules/@types/react/index.d.ts:2054, 2091, 2104, 2130, 2250 | grep0:SyntheticEvent<\|ChangeEvent\|FormEvent\|KeyboardEvent\|EventHandler\|28 | 二、核心概念 |
| R2-04-9 | 概念 | 未讲 | 其它 | 九段缺失：19.3 新增 onFullscreenChange / onFullscreenError、submit 事件带 `submitter`、resize 事件批处理【尝鲜】 | — | — | 19.3.0 于 2026-09-09 发布，19.2.8 不含，只需一句 | grep0:19\.3\|submitter\|onFullscreen | 九、新动向 |
| R2-04-10 | 生产 | 未标简化 | 安全a11y | 可点击 `<div onClick>` 卡片与用 `<a href>` 当按钮，都没有 role / tabIndex / onKeyDown，未标「演示简化」，也没说真实项目用 `<button>`（主责 35） | src/topics/04-events/react/Example.tsx:76; src/topics/04-events/react/Example.tsx:130 | onClick={handleCardClick} | 学习者会把「div 加 onClick」当正常写法；键盘用户无法触发 | grep0:演示简化\|tabIndex\|onKeyDown\|role | 七、生产环境注意 |
| R2-04-11 | 小问题 | 措辞 | 绝对化 | 「没有一一对应关系」模板残留 ×3；react:46「常用属性…与原生一致」应限定 currentTarget（委托下可能不同）；react:104「死循环警告」实际是抛出 "Too many re-renders" 错误 | src/topics/04-events/react/Example.tsx:21; src/topics/04-events/react/Example.tsx:57; src/topics/04-events/vue/Example.vue:22; src/topics/04-events/react/Example.tsx:46; src/topics/04-events/react/Example.tsx:104 | 没有一一对应关系 | 规格 §5 H 模式；currentTarget 差异与官方原文冲突；抛错文案待 P-04-3 验证 | https://react.dev/reference/react-dom/components/common#react-event-object（2026-09-16，逐字 "React attaches event handlers at the root"） | 四、关键区别 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | `onClick={handleClick}` 和 `onClick={handleClick()}` 有什么区别？（传参怎么写？内联箭头每次渲染新函数有问题吗？何时才 useCallback？） | 部分 | src/topics/04-events/react/Example.tsx:84-86; src/topics/04-events/react/Example.tsx:101-108 | 缺内联新函数 / useCallback 的取舍 |
| 2 | React 的事件是原生事件吗？（合成事件挂在哪？currentTarget 差异？React 17 改了什么？） | 部分 | src/topics/04-events/react/Example.tsx:7-8; src/topics/04-events/react/Example.tsx:44-46 | 只知道「合成事件包装」；委托位置、17 变化、nativeEvent 全无 |
| 3 | 怎么阻止冒泡、阻止默认行为、只在目标元素触发？（onClickCapture 顺序；.stop / .prevent / .self 在 React 怎么写？） | 部分 | src/topics/04-events/react/Example.tsx:56-67 | 缺 .self 等价写法、捕获阶段顺序 |
| 4 | 事件处理器里能做副作用吗？和渲染期的要求有何不同？（读到的 state 是最新的吗——快照与过期闭包） | 不能 | — | 副作用定位、快照均未讲 |
| 5 | React 的 `onChange` 和原生 change 一样吗？（受控输入为什么必须给 onChange？Vue v-model 默认事件、.lazy？） | 不能 | — | onChange 一字未提 |

### 05. 条件渲染

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 分支就是 JavaScript：三元、&&、if / switch 提前 return（文件头承诺） | https://react.dev/learn/conditional-rendering | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:5; src/topics/05-conditional-rendering/react/Example.tsx:22-51; src/topics/05-conditional-rendering/react/Example.tsx:84-96 | — |
| 主流 | `return null` 渲染空，但 "isn't common because it might surprise a developer" | https://react.dev/learn/conditional-rendering | 未讲 | — | R2-05-4 |
| 主流 | 把 JSX 赋给变量再插入（`let content; if (...)`）："the most verbose, but it's also the most flexible" | https://react.dev/learn/conditional-rendering | 未讲 | — | R2-05-4 |
| 主流 | 三元 `{cond ? <A/> : <B/>}`；元素只是描述不是实例，if/else 与三元 "completely equivalent" | https://react.dev/learn/conditional-rendering | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:87-88 | 「描述 vs 实例」一句未讲，并入 R2-05-4 |
| 主流 | `{cond && <A/>}`：布尔 / null / undefined 是「洞」不渲染（文件头承诺） | https://react.dev/learn/conditional-rendering | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:7; src/topics/05-conditional-rendering/react/Example.tsx:90-96; src/topics/05-conditional-rendering/react/Example.tsx:109 | 文件头 react:7 漏了 `true`，react:109 已补全，见 R2-05-10 |
| 主流 | 0 陷阱与修法 `count > 0 &&`（文件头承诺） | https://react.dev/learn/conditional-rendering#pitfall | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:15; src/topics/05-conditional-rendering/react/Example.tsx:106-118 | 大纲未列：NaN 也会渲染、`!!x` / `Boolean(x)` 修法（react:109, 116） |
| 主流 | 「映射对象」查表代替 if 链（文件头承诺） | — | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:6; src/topics/05-conditional-rendering/react/Example.tsx:63-68 | 大纲未列 |
| 主流 | 分支多时抽 switch 子组件 / 辅助函数，比嵌套三元清晰（文件头承诺） | https://react.dev/learn/conditional-rendering | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:22-28 | — |
| 主流 | 类型依据：ReactNode 含 boolean / null / undefined 所以 `&&` 合法，含 number 所以 0 会渲染 | node_modules/@types/react/index.d.ts:436-449 | 未讲 | — | R2-05-5 |
| 主流 | State 与树中位置绑定：三元两分支都是 `<Counter>` 时切换 state 保留 | https://react.dev/learn/preserving-and-resetting-state | 讲了但错 | src/topics/05-conditional-rendering/react/Example.tsx:134-135; src/topics/05-conditional-rendering/vue/Example.vue:135 | R2-05-1：说成「三元 / && = v-if，会真正卸载 / 挂载」 |
| 主流 | 同位置换成不同组件会销毁 state；同组件间强制重置用 key（主责 06） | https://react.dev/learn/preserving-and-resetting-state | 未讲 | — | R2-05-2 |
| 主流 | 隐藏 vs 卸载：React 无 v-show，用 CSS 隐藏保留 DOM（文件头承诺） | https://react.dev/learn/preserving-and-resetting-state#preserving-state-for-removed-components | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:16; src/topics/05-conditional-rendering/react/Example.tsx:127-142 | 「只能手动控制 display」绝对化，见 R2-05-3 / R2-05-10 |
| 主流 | 多个互斥布尔易矛盾，用单一 `status` 联合驱动分支 | https://react.dev/learn/choosing-the-state-structure | 未讲 | — | R2-05-6；react:54 用了联合但未说理由 |
| 较新 | `<Activity mode="hidden">`：隐藏子树保留 state、卸载 Effect（19.2 稳定，主责 32） | node_modules/@types/react/index.d.ts:1995-2015 + https://react.dev/reference/react/Activity | 未讲 | — | R2-05-3 |
| 尝鲜 | 19.3 `<ViewTransition>` 给条件切换加动画 | https://react.dev/blog/2026/09/09/react-19-3 | 未讲 | — | R2-05-3 |
| 旧写法 | 类组件 `render()` 里 if/else 或 `renderX()` 辅助方法拆分支 | https://react.dev/learn/conditional-rendering | 未讲 | — | R2-05-7 |
| 主流 | Vue：`v-if` / `v-else-if` / `v-else` 描述分支（文件头承诺） | https://vuejs.org/guide/essentials/conditional.html | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:10; src/topics/05-conditional-rendering/vue/Example.vue:59-91 | — |
| 主流 | Vue：`v-if` 对任何 falsy 不渲染、无 0 陷阱；插值里 `x && '…'` 仍会渲染 0（文件头承诺） | https://vuejs.org/guide/essentials/conditional.html | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:11; src/topics/05-conditional-rendering/react/Example.tsx:120-124; src/topics/05-conditional-rendering/vue/Example.vue:116-121 | 大纲未列：插值里 `&&` 仍渲染 0 的补充 |
| 主流 | Vue：`v-show` 只切 display，DOM 一直在（文件头承诺） | https://vuejs.org/api/built-in-directives.html#v-show | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:10; src/topics/05-conditional-rendering/vue/Example.vue:133-142 | — |
| 主流 | Vue：`<template v-if>` 包多元素；v-show 不支持 `<template>` 与 `v-else`；v-if 惰性 / 切换成本高，v-show 初始成本高 | https://vuejs.org/guide/essentials/conditional.html | 未讲 | — | R2-05-8；react:136「频繁切换…适合」只覆盖一半 |
| 主流 | Vue：`v-if` 与 `v-for` 同元素时 v-if 优先且拿不到循环变量（指向 06） | https://vuejs.org/guide/essentials/list.html | 未讲 | — | R2-05-8 |
| 主流 | Vue `v-if` 切换总是销毁重建；保留用 v-show 或 `<KeepAlive>`；React 同类型同位置默认复用 | https://vuejs.org/api/built-in-directives.html#v-if | 讲了但错 | src/topics/05-conditional-rendering/vue/Example.vue:135 | R2-05-1 |
| 主流 | 「最重要的区别」：模板指令 vs JS 控制流（文件头承诺） | https://react.dev/learn/conditional-rendering | 已讲对 | src/topics/05-conditional-rendering/react/Example.tsx:13-14; src/topics/05-conditional-rendering/react/Example.tsx:25-26 | — |

#### 面试 5 问

1. `count && <List />` 为什么会在页面上出现 `0`？怎么修？（追问：`''`、`NaN` 呢？TS 能不能提前拦住？三元写法有没有这个问题？）
2. `return null` 和用 CSS 隐藏有什么区别？（追问：哪种会保留 state 与 DOM？React 19.2 的 `<Activity>` 解决什么？）
3. 三元两个分支都渲染 `<Counter>`，切换时 state 会重置吗？（追问：怎样强制重置？为什么说是「树中位置」而不是 JSX 结构决定？）
4. React 为什么没有 `v-if` 指令？复杂分支怎么组织？（追问：JSX 里能写 `if` 语句吗？多状态用什么建模避免布尔矛盾？）
5. Vue 的 `v-if` 与 `v-show` 怎么选？React 里对应的取舍是什么？（追问：Vue `v-if` 一定销毁重建，React 同类型同位置默认复用——这个差异会带来什么 bug？）

#### 生产写法要点

- 请求 / 提交状态用判别联合 `status: 'idle' \| 'loading' \| 'success' \| 'error'` 驱动分支，区分「空列表」和「未加载」；`items.length && ...` 一律改为 `> 0`。
- 需要保留表单、滚动位置的 Tab 用 CSS 隐藏或 `<Activity>`【较新】，否则切回来会丢失输入；演示里若直接卸载要标「演示简化」。
- 基于权限隐藏按钮只是体验，鉴权必须由后端完成（主责 35 / 18）。
- 三层以上嵌套三元拆成子组件或提前 `return`；早返回前不能有条件调用的 Hook（Hooks 规则，指向 14）。
- 同类型组件在同位置切换实体（用户 A → 用户 B）时加 `key`，否则旧 state 会串到新实体（06 / 18 的实例复用坑）。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `if` + `return null` / 三元 / `&&` | `v-if` / `v-else-if` / `v-else`（必须紧邻）、`<template v-if>` 包多元素 | https://vuejs.org/guide/essentials/conditional.html（2026-09-16，逐字） | React 用 JS 表达式，没有指令 |
| 无 v-show：CSS 隐藏 / `hidden` 属性；`<Activity>`【较新】 | `v-show`（切 `display`、触发 transition；不支持 `<template>` / `v-else`） | https://vuejs.org/api/built-in-directives.html#v-show（2026-09-16，逐字） | Vue 内置「保留 DOM 的隐藏」，React 19.2 才有 Activity |
| `cond && <A/>` 的 `0` 陷阱 | `v-if="count"` 按 truthy 判断，`0` 不渲染 | https://vuejs.org/guide/essentials/conditional.html（2026-09-16） | 差异原因：React 把表达式的值当子节点渲染 |
| 同类型同位置默认复用、state 保留 | `v-if` 切换 "the element and its contained directives / components are destroyed and re-constructed"；保留用 `v-show` 或 `<KeepAlive>` | https://vuejs.org/api/built-in-directives.html#v-if + https://vuejs.org/guide/essentials/component-basics.html（2026-09-16，逐字） | Vue 的 v-if 总是销毁；React 复用是「位置」规则的结果 |
| 分支间强制重置用 `key` | `:key` 强制替换元素/组件（触发生命周期、transition） | https://vuejs.org/api/built-in-special-attributes.html#key（2026-09-16，逐字） | 主责 06 |
| `v-if` + `v-for` 无对应（列表先 `filter` 再 `map`） | 同元素 `v-if` 优先于 `v-for`，不推荐同用 | https://vuejs.org/guide/essentials/list.html（2026-09-16，逐字） | React 没有指令优先级问题 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-05-1 | 严重 | 讲错 | 绝对化 | 「条件渲染（三元 / &&）= v-if，会真正卸载 / 挂载节点」只在分支类型不同或切到 null 时成立；三元两分支是同类型组件时 React 按「树中位置」复用实例、state 保留，Vue 的 v-if 则总是销毁重建；要重置得加 key（06） | src/topics/05-conditional-rendering/react/Example.tsx:135; src/topics/05-conditional-rendering/vue/Example.vue:135 | = v-if，会真正卸载/挂载节点 | 标题承诺「三元」，这条等号把 React 最常见的 state 串位 bug 讲反；大纲面试 3 / 5 问都答不上 | https://react.dev/learn/preserving-and-resetting-state（2026-09-16，逐字 "It's the position in the UI tree—not in the JSX markup—that matters"）；https://vuejs.org/api/built-in-directives.html#v-if（2026-09-16，逐字 "the element and its contained directives / components are destroyed and re-constructed"） | 四、关键区别 |
| R2-05-2 | 概念 | 未讲 | 其它 | 同位置换成不同组件（`<p>` ↔ `<Counter>`）会销毁 state；同组件间强制重置用 `key` 或渲染到不同位置（主责 06）；「隐藏 vs 卸载」还可把 state 提升到父级保留 | — | — | 与 R2-05-1 配套，没有这条就无法给出修法 | grep0:key\|位置 | 六、易错点 |
| R2-05-3 | 概念 | 未讲 | 并发 | `<Activity mode="hidden">`（19.2 起稳定导出）隐藏子树保留 state 并卸载 Effect，对应 v-show「保留状态」的需求（主责 32，本题一句）；`hidden` 属性也是替代；19.3 `<ViewTransition>` 一句【尝鲜】；「只能手动控制 display」应放宽 | — | — | 类型见 node_modules/@types/react/index.d.ts:1995-2015；文件头 react:16「没有指令对应物」在 19.2 后已不完整 | grep0:Activity\|hidden\|ViewTransition | 九、新动向 |
| R2-05-4 | 概念 | 未讲 | 其它 | `return null` 渲染空及其可读性提醒；把 JSX 赋给变量 `let content; if (...)` 是最灵活的写法；JSX 元素是描述不是实例，所以 if/else 与三元 "completely equivalent" | — | — | 标题承诺「提前 return」但没讲 `return null`；变量赋值写法是官方列的第五种 | grep0:return null\|let content\|存进变量\|赋给变量 | 二、核心概念 |
| R2-05-5 | 概念 | 未讲 | 其它 | 类型依据：`ReactNode` 联合含 boolean / null / undefined 所以 `cond && <A/>` 通过类型检查，含 number 所以 `0` 会渲染——TS 拦不住 0 陷阱，要靠 `> 0` 或 lint（指向 28） | — | — | 大纲面试 1 问追问「TS 能不能提前拦住」 | grep0:ReactNode\|类型 | 五、常见追问与回答要点 |
| R2-05-6 | 概念 | 未讲 | 其它 | 多个互斥布尔（isLoading / isError）易矛盾，用单一 `status` 联合驱动分支（"Avoid contradictions in state"）；本题 `status` 联合是实践但未说理由（落点 11 / 29） | — | — | 大纲面试 4 问追问「多状态用什么建模」 | grep0:矛盾\|互斥 | 二、核心概念 |
| R2-05-7 | 概念 | 未讲 | 旧写法 | 八段缺失：类组件 `render()` 里 if/else 或 `renderX()` 辅助方法拆分支；函数组件同理拆子组件 | — | — | 存量类组件代码里最常见的分支写法 | grep0:类组件\|class 组件\|render() | 八、旧写法对照 |
| R2-05-8 | 概念 | 未讲 | 其它 | Vue 侧细节缺：`<template v-if>` 包多元素；v-show 不支持 `<template>` 与 `v-else`；v-if 惰性 / 切换成本高 vs v-show 初始成本高的取舍；v-if 与 v-for 同元素 v-if 优先且拿不到循环变量（指向 06） | — | — | react:136 只说了「频繁切换适合 display」一半 | grep0:template v-if\|惰性\|v-for | 三、Vue 对照 |
| R2-05-9 | 生产 | 未标简化 | 生产简化 | `style={{ display }}` 演示未标「演示简化」（真实项目用 className / `hidden` 属性 / Activity）；提前 return 之前不能有条件调用的 Hook（Hooks 规则，14）；按权限隐藏按钮只是体验，鉴权在后端（35） | src/topics/05-conditional-rendering/react/Example.tsx:138 | display: showDetail ? 'block' | StatusPanel 的 switch-return 一旦加 Hook 就会踩 Hooks 规则，课件没提醒 | grep0:演示简化\|Hooks 规则\|鉴权\|Hook | 七、生产环境注意 |
| R2-05-10 | 小问题 | 措辞 | 绝对化 | 「没有一一对应关系」模板残留 ×6；react:7「false/null/undefined 才不渲染」漏了 `true`（react:109 已补全，两处应一致）；react:134「只能手动控制 style 的 display」绝对化 | src/topics/05-conditional-rendering/react/Example.tsx:16; src/topics/05-conditional-rendering/react/Example.tsx:122; src/topics/05-conditional-rendering/react/Example.tsx:133; src/topics/05-conditional-rendering/vue/Example.vue:17; src/topics/05-conditional-rendering/vue/Example.vue:118; src/topics/05-conditional-rendering/vue/Example.vue:133; src/topics/05-conditional-rendering/react/Example.tsx:7; src/topics/05-conditional-rendering/react/Example.tsx:134 | 没有一一对应关系 | 规格 §5 H / B 模式 | node_modules/@types/react/index.d.ts:436-449（ReactNode 含 boolean） | 四、关键区别 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | `count && <List />` 为什么会出现 `0`？怎么修？（`''`、`NaN` 呢？TS 能不能提前拦住？三元有没有这个问题？） | 能 | src/topics/05-conditional-rendering/react/Example.tsx:106-118 | `''` 与 TS 角度未提，主答案完整 |
| 2 | `return null` 和用 CSS 隐藏有什么区别？（哪种保留 state 与 DOM？19.2 的 `<Activity>` 解决什么？） | 部分 | src/topics/05-conditional-rendering/react/Example.tsx:132-142 | 只说 DOM 保留，没说 state 保留；`return null` 与 Activity 未提 |
| 3 | 三元两个分支都渲染 `<Counter>`，切换时 state 会重置吗？（怎样强制重置？为什么是「树中位置」决定？） | 不能 | — | 位置规则未讲，且 react:135 讲反 |
| 4 | React 为什么没有 `v-if` 指令？复杂分支怎么组织？（JSX 里能写 if 吗？多状态用什么建模？） | 能 | src/topics/05-conditional-rendering/react/Example.tsx:5-6; src/topics/05-conditional-rendering/react/Example.tsx:22-51; src/topics/05-conditional-rendering/react/Example.tsx:63-68 | 「避免布尔矛盾」的理由未说 |
| 5 | Vue 的 `v-if` 与 `v-show` 怎么选？React 里对应的取舍是什么？（Vue v-if 一定销毁重建、React 同类型同位置复用会带来什么 bug？） | 部分 | src/topics/05-conditional-rendering/react/Example.tsx:132-136; src/topics/05-conditional-rendering/vue/Example.vue:133-135 | 缺 React 复用 vs Vue 销毁的差异及其 bug |

### 06. 列表渲染与 key

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 列表 = `array.map()` 返回 JSX；key 写在 map 返回的最外层元素上（文件头承诺） | https://react.dev/learn/rendering-lists | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:5; src/topics/06-list-and-key/react/Example.tsx:136-141 | — |
| 主流 | 先 `filter` 再 `map`；块体箭头函数 `=> {` 必须显式 `return` | https://react.dev/learn/rendering-lists | 未讲 | — | R2-06-2；react:97 只用 filter 做删除 |
| 主流 | 缺 key 时警告并按 index 匹配 | https://react.dev/learn/rendering-lists | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:24 | 措辞见 R2-06-9 |
| 主流 | key 规则：兄弟之间唯一、不能变化（文件头承诺） | https://react.dev/learn/rendering-lists#rules-of-keys | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:148-149 | — |
| 主流 | "Don't generate them while rendering"：`key={Math.random()}` 每次全部重建、丢失输入 | https://react.dev/learn/rendering-lists#pitfall | 未讲 | — | R2-06-1 |
| 主流 | key 从哪来：后端 id；本地数据用 `crypto.randomUUID()` / 计数器并在创建时写进数据 | https://react.dev/learn/rendering-lists#where-to-get-your-key | 未讲 | — | R2-06-1 |
| 主流 | 为什么要 key：标识「身份」而非「位置」（文件头承诺） | https://react.dev/learn/rendering-lists#why-does-react-need-keys | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:6-7; src/topics/06-list-and-key/react/Example.tsx:142-147 | — |
| 主流 | index 作 key：插入 / 删除 / 重排后节点错位（文件头承诺） | https://react.dev/learn/rendering-lists#pitfall | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:8-9; src/topics/06-list-and-key/react/Example.tsx:103-107; src/topics/06-list-and-key/react/Example.tsx:145-147 | — |
| 旧写法 | index 勉强可用的条件：纯展示、不增删重排、无内部 state | https://react.dev/learn/rendering-lists#pitfall | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:10; src/topics/06-list-and-key/react/Example.tsx:149 | 「永不增删」过严见 R2-06-9；官方无正面原文见 P-06-1 |
| 主流 | key 不是 prop，组件收不到（文件头承诺） | https://react.dev/learn/rendering-lists + node_modules/@types/react/index.d.ts:258-260 | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:22; src/topics/06-list-and-key/react/Example.tsx:139 | — |
| 主流 | key 类型 `Key = string \| number \| bigint` | node_modules/@types/react/index.d.ts:236-239 | 未讲 | — | R2-06-3 |
| 主流 | 每项多个 DOM 节点用 `<Fragment key={id}>`，`<>` 不能带 key | https://react.dev/learn/rendering-lists + https://react.dev/reference/react/Fragment | 未讲 | — | R2-06-2 |
| 主流 | key 决定位置，只在同一父级范围内比较 | https://react.dev/learn/preserving-and-resetting-state | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:209-212 | — |
| 主流 | key 强制重置：`<Editor key={id}>` 代替 Effect 里 `setState`（文件头承诺） | https://react.dev/learn/preserving-and-resetting-state + https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:11-13; src/topics/06-list-and-key/react/Example.tsx:181-247 | 路由参数变化实例复用未指向 18，见 R2-06-8 |
| 主流 | `useState` 初始值只在挂载时求值一次 | https://react.dev/learn/state-a-components-memory | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:53-57 | 大纲未列；StrictMode 双调见 P-06-5 |
| 主流 | key 重置的代价：整棵子树卸载重建（滚动、焦点、Effect 重跑） | https://react.dev/learn/preserving-and-resetting-state | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:241-242; src/topics/06-list-and-key/vue/Example.vue:205 | 大纲未列（大纲生产要点） |
| 主流 | 派生列表在渲染期算或 `useMemo`；`sort` / `reverse` 先拷贝（主责 21） | https://react.dev/learn/you-might-not-need-an-effect + https://react.dev/reference/react/useMemo | 未讲 | — | R2-06-4；react:93-94 只有派生对象 |
| 主流 | 列表项内 state 时 key 就是 state 身份；同 key 换位置 state 跟着走 | https://react.dev/learn/preserving-and-resetting-state | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:164; src/topics/06-list-and-key/react/Example.tsx:209-212 | — |
| 较新 | 长列表虚拟化与 `useMemo` 缓存 caveat（主责 17） | https://react.dev/reference/react/useMemo#caveats | 未讲 | — | R2-06-6 |
| 尝鲜 | 19.3 `<Fragment ref>` 得到 FragmentInstance | https://react.dev/blog/2026/09/09/react-19-3 | 未讲 | — | R2-06-6 |
| 旧写法 | `React.Children.map` / `toArray` 自动合成 key 的遍历写法（主责 13） | https://react.dev/reference/react/Children | 未讲 | — | R2-06-7 |
| 主流 | Vue：`v-for` + `:key`，diff 靠 key 匹配（文件头承诺） | https://vuejs.org/guide/essentials/list.html | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:16; src/topics/06-list-and-key/vue/Example.vue:100-107 | — |
| 主流 | Vue：index 作 key 同样出错（文件头承诺） | https://vuejs.org/guide/essentials/list.html | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:17; src/topics/06-list-and-key/vue/Example.vue:43; src/topics/06-list-and-key/vue/Example.vue:102-104 | — |
| 主流 | Vue：不写 key 用就地更新策略（文件头承诺） | https://vuejs.org/guide/essentials/list.html | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:24; src/topics/06-list-and-key/vue/Example.vue:25 | — |
| 主流 | Vue：`:key` 强制替换组件、`<router-view :key="$route.fullPath">`（文件头承诺） | https://vuejs.org/api/built-in-special-attributes.html#key | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:18-19; src/topics/06-list-and-key/vue/Example.vue:186-191 | — |
| 主流 | Vue：`v-for` 语法家族（`of`、对象、范围、解构）、`<template v-for>` 的 key 位置、组件 `v-for` 需显式传 props | https://vuejs.org/guide/essentials/list.html | 未讲 | — | R2-06-5 |
| 主流 | Vue：key 期望 `number \| string \| symbol`、必须原始值、重复 key 渲染报错 | https://vuejs.org/api/built-in-special-attributes.html#key | 未讲 | — | R2-06-3 |
| 主流 | Vue：数组变更侦测 vs 新数组替换；`computed` 过滤；`v-if` / `v-for` 优先级 | https://vuejs.org/guide/essentials/list.html | 未讲 | — | R2-06-4 / R2-06-5；vue:55 用 filter 但未说明 |
| 主流 | Vue：`watch` 同步 props 是反模式，换 key 更好 | — | 已讲对 | src/topics/06-list-and-key/vue/Example.vue:199-202 | 大纲未列 |
| 主流 | 「最重要的区别」：机制一致、写法不同（文件头承诺） | https://react.dev/learn/rendering-lists + https://vuejs.org/guide/essentials/list.html | 已讲对 | src/topics/06-list-and-key/react/Example.tsx:21-25 | 绝对化措辞见 R2-06-9 |

#### 面试 5 问

1. key 是干什么的？为什么不推荐用 index？（追问：什么情况下 index 勉强可以？向列表头部插入一项会发生什么？输入框内容为什么错位？）
2. `key={Math.random()}` 有什么问题？（追问：本地新建的数据 key 从哪来？为什么要在创建时生成而不是渲染时？）
3. key 在什么范围内要唯一？组件里能读到 key 吗？（追问：两个列表用同一批 id 会冲突吗？需要 id 怎么传？key 的类型是什么？）
4. key 除了列表还能干什么？（追问：切换用户时重置表单；路由 `/orders/1 → /orders/2` 为什么 state 不重置、怎么修；和在 `useEffect` 里 `setState` 重置相比好在哪？）
5. Vue 不写 key 的 in-place patch 和 React 不写 key 的行为一样吗？（追问：Vue 的 key 为什么不能是对象？`<template v-for>` 的 key 放哪？`v-for` 与 `v-if` 的优先级？）

#### 生产写法要点

- key 用后端 id；本地临时项在创建时 `crypto.randomUUID()` 写入数据；跨来源合并列表时加前缀（`server-${id}` / `local-${uuid}`）避免碰撞。
- 过滤 / 排序在渲染期（或 `useMemo`）做，不复制到 state；`sort` / `reverse` 先拷贝；分页 / 搜索切换时保持 key 稳定，避免整表重建。
- 千级以上列表用虚拟化（主责 17）；每项组件按需 `memo`，并保证传入的 props 引用稳定。
- key 重置的代价是整棵子树卸载重建（DOM、state、滚动、焦点全丢），不要拿高频变化的值当 key。
- 演示若用 `index` 或时间戳作 key 必须标「演示简化」并说明何时会出错。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `items.map(item => <li key={item.id}>…</li>)` | `<li v-for="item in items" :key="item.id">`；`(item, index)`、`of`、解构、遍历对象 `(value, key, index)`、范围 `n in 10`（从 1 开始）、`<template v-for>` | https://vuejs.org/guide/essentials/list.html（2026-09-16，逐字） | React 用 JS 方法，无对象 / 范围语法糖 |
| `Key = string \| number \| bigint`；不写 key 默认按 index | key 期望 `number \| string \| symbol`，必须原始值，重复 key 渲染报错；不写 key 用 in-place patch 尽量原地复用 | `node_modules/@types/react/index.d.ts:236-239` + https://vuejs.org/api/built-in-special-attributes.html#key（2026-09-16，逐字） | 两边默认行为都按位置复用，都会把 state 串位 |
| `<Fragment key={id}>` | `<template v-for="todo in todos" :key="todo.name">`（key 放在 template 上） | https://vuejs.org/guide/essentials/list.html（2026-09-16，逐字） | — |
| `filter` 后 `map`；不能在 map 里「跳过」 | `computed` 过滤；嵌套循环用方法；`v-if` 不要与 `v-for` 同元素（v-if 优先、拿不到循环变量） | https://vuejs.org/guide/essentials/list.html（2026-09-16，逐字） | React 没有指令优先级问题 |
| 新数组替换 state（不可变，主责 21） | 突变方法 `push/pop/shift/unshift/splice/sort/reverse` 被侦测；`filter/concat/slice` 返回新数组时整体替换，Vue "smart heuristics" 复用 DOM | https://vuejs.org/guide/essentials/list.html（2026-09-16，逐字） | React 必须新引用；Vue 两种都行 |
| key 强制重置子树 | `:key` 强制替换（触发生命周期、transition），`<transition><span :key="text">` | https://vuejs.org/api/built-in-special-attributes.html#key（2026-09-16，逐字） | 同一机制 |
| 无对应（`memo` 子组件，主责 17） | `v-memo`（3.2+）需与 `v-for` 在同一元素 | https://vuejs.org/api/built-in-directives.html#v-memo（2026-09-16，逐字） | Vue 模板级记忆；React 组件级 |
| `<Item key={id} item={item} />` | `<MyComponent v-for="item in items" :item="item" :key="item.id" />` props 必须显式传 | https://vuejs.org/guide/essentials/list.html（2026-09-16，逐字） | 两边组件作用域都隔离 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-06-1 | 概念 | 未讲 | 其它 | `key={Math.random()}` / 渲染期生成 key：每次渲染都对不上 → 所有组件与 DOM 重建、丢失用户输入；key 从哪来：后端 id、本地数据用 `crypto.randomUUID()` 或计数器并在**创建时**写进数据 | — | — | 大纲面试 2 问整问只能从「key 变化 = 销毁重建」间接推出；本地临时项的 key 来源是真实项目必踩点 | grep0:Math.random\|随机\|randomUUID\|uuid\|创建时生成 | 六、易错点 |
| R2-06-2 | 概念 | 未讲 | 其它 | 每项多个 DOM 节点时 `<>` 不能带 key，要写 `<Fragment key={id}>`；块体箭头函数 `=> {` 必须显式 `return` 否则什么都不渲染；先 `filter` 再 `map` | — | — | 三条都是 rendering-lists 页的主流内容；演示只有 `<tr>` 单节点 | grep0:Fragment\|显式 return\|<> | 二、核心概念 |
| R2-06-3 | 概念 | 未讲 | 其它 | key 的类型 `Key = string \| number \| bigint`（位于 `Attributes.key`）；Vue key 期望 `number \| string \| symbol`、必须原始值、重复 key 渲染报错 | — | — | 类型见 node_modules/@types/react/index.d.ts:236-239, 258-260；大纲面试 3 / 5 问追问 | grep0:bigint\|symbol\|原始值\|Key 类型 | 五、常见追问与回答要点 |
| R2-06-4 | 概念 | 未讲 | 其它 | 派生列表（过滤 / 排序）在渲染期计算或 `useMemo`，不复制进 state；`sort` / `reverse` 原地突变要先拷贝 `[...arr].sort()`（主责 21）；Vue 侧突变方法被侦测 vs `filter` 返回新数组整体替换 | — | — | 演示的 `filter` 删除（react:97、vue:55）恰好绕开了突变陷阱，没说为什么 | grep0:sort\|reverse\|拷贝\|toSorted\|useMemo | 六、易错点 |
| R2-06-5 | 概念 | 未讲 | 其它 | Vue 侧细节：`v-for` 语法家族（`of`、对象 `(value, key, index)`、范围 `n in 10`、解构）；`<template v-for>` 的 key 放 template 上；组件 `v-for` 需显式传 props；`v-if` 与 `v-for` 同元素 v-if 优先；`v-memo` 一句 | — | — | 大纲面试 5 问追问 | grep0:template v-for\|v-for 与 v-if\|v-if 与 v-for\|n in 10\|v-memo | 三、Vue 对照 |
| R2-06-6 | 概念 | 未讲 | 性能 | 九段缺失：千级以上列表虚拟化与 `useMemo` caveat（主责 17）【较新】；React Compiler 对手写 memo 的影响一句；19.3 `<Fragment ref>`【尝鲜】 | — | — | 只需各一句并指向 17 / 32 | grep0:虚拟化\|virtual\|19\.3\|Compiler | 九、新动向 |
| R2-06-7 | 概念 | 未讲 | 旧写法 | 八段缺失：`React.Children.map` / `toArray` 自动合成 key 的遍历写法（"uncommon and can lead to fragile code"，主责 13）；存量代码 `key={index}` 标【旧写法】并给准确条件 | — | — | 读第三方旧组件库时会遇到 | grep0:Children\|toArray | 八、旧写法对照 |
| R2-06-8 | 小问题 | 措辞 | 交叉引用 | 「第 N 题」未补零 ×10；「把 state 提升到父组件（第 8 题）」应指向 25（08 自己也把状态提升指向 25）；路由参数 `/orders/o1 → /orders/o2` 实例复用未指向 18；第 10 题引用成立 | src/topics/06-list-and-key/react/Example.tsx:93; src/topics/06-list-and-key/react/Example.tsx:169; src/topics/06-list-and-key/react/Example.tsx:236; src/topics/06-list-and-key/react/Example.tsx:239-240; src/topics/06-list-and-key/vue/Example.vue:49; src/topics/06-list-and-key/vue/Example.vue:123; src/topics/06-list-and-key/vue/Example.vue:201; src/topics/06-list-and-key/vue/Example.vue:203-204 | （第 9 题：派生状态） | 全站唯一不补零的题；08 是 callback props，状态提升主责 25 | src/topics/08-parent-child-communication/react/Example.tsx:25（「何时留在子组件——见 25 题（状态提升与 state 归属）」）; src/topics/10-effects-and-lifecycle/react/Example.tsx:331-332（反模式清单成立） | 二、核心概念 |
| R2-06-9 | 小问题 | 措辞 | 绝对化 | react:24 把「退化为按 index 匹配」与 Vue「就地更新」写成差异，实际两边默认都按位置复用；react:25 / vue:190「一模一样」「完全一致」绝对化；react:10「永不增删」过严（只在末尾追加 / 删除时 index 不错位） | src/topics/06-list-and-key/react/Example.tsx:24; src/topics/06-list-and-key/react/Example.tsx:25; src/topics/06-list-and-key/vue/Example.vue:190; src/topics/06-list-and-key/react/Example.tsx:10 | 退化为按 index 匹配 | 规格 §5 B / D 模式；末尾追加的安全性见 P-06-3 | https://react.dev/learn/rendering-lists#pitfall（2026-09-16，逐字 "that's what React will use if you don't specify a key at all"）；https://vuejs.org/guide/essentials/list.html（2026-09-16，逐字 in-place patch） | 四、关键区别 |
| R2-06-10 | 生产 | 未讲 | 生产简化 | 生产段缺：跨来源合并列表时 key 加前缀（`server-${id}` / `local-${uuid}`）避免碰撞；分页 / 搜索切换保持 key 稳定避免整表重建；每项组件 `memo` 时保证 props 引用稳定 | — | — | react:161-164 已说明「非受控 input 是演示、实际受控」，这点做得好；其余生产要点没有 | grep0:前缀\|分页\|碰撞\|memo | 七、生产环境注意 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | key 是干什么的？为什么不推荐用 index？（什么情况下 index 勉强可以？头部插入会发生什么？输入框为什么错位？） | 能 | src/topics/06-list-and-key/react/Example.tsx:6-10; src/topics/06-list-and-key/react/Example.tsx:142-149 | — |
| 2 | `key={Math.random()}` 有什么问题？（本地新建数据的 key 从哪来？为什么创建时生成而不是渲染时？） | 部分 | src/topics/06-list-and-key/react/Example.tsx:148 | 随机 key、创建时生成、`randomUUID` 均未讲，只能靠「key 变化 = 销毁重建」推 |
| 3 | key 在什么范围内要唯一？组件里能读到 key 吗？（两个列表同一批 id 冲突吗？需要 id 怎么传？key 的类型？） | 部分 | src/topics/06-list-and-key/react/Example.tsx:22; src/topics/06-list-and-key/react/Example.tsx:139; src/topics/06-list-and-key/react/Example.tsx:149 | 缺「不同数组可重复」的明确表述与 key 类型 |
| 4 | key 除了列表还能干什么？（切换用户重置表单；路由参数变化为什么 state 不重置、怎么修；比 useEffect 里 setState 好在哪？） | 能 | src/topics/06-list-and-key/react/Example.tsx:11-13; src/topics/06-list-and-key/react/Example.tsx:181-247 | 路由场景未指向 18 |
| 5 | Vue 不写 key 的 in-place patch 和 React 不写 key 的行为一样吗？（Vue key 为什么不能是对象？`<template v-for>` 的 key 放哪？v-for 与 v-if 优先级？） | 部分 | src/topics/06-list-and-key/react/Example.tsx:24-25; src/topics/06-list-and-key/vue/Example.vue:25 | 缺「两边本质相同」的结论、Vue key 原始值、template v-for、优先级 |

### 07. 表单与受控组件

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 文件头承诺：受控 = `value` + `onChange`，显示完全由 state 决定，每击键 setState → 重渲染 | https://react.dev/reference/react-dom/components/input | 已讲对 | src/topics/07-forms/react/Example.tsx:5-6; :302-307 | — |
| 主流 | 文件头承诺：checkbox 绑 `checked`、读 `e.target.checked` | https://react.dev/reference/react-dom/components/input | 已讲对 | src/topics/07-forms/react/Example.tsx:7; :267-272; :327 | — |
| 主流 | 文件头承诺：对象 state + `name` 分发 + 函数式不可变更新 | https://react.dev/learn/updating-objects-in-state | 已讲对 | src/topics/07-forms/react/Example.tsx:8-9; :265-277 | 大纲未列 |
| 主流 | 文件头承诺：`<form onSubmit>` + `preventDefault()`；Enter 与 `<button type="submit">` 触发；`<form>` 内按钮默认 submit | https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form | 已讲对 | src/topics/07-forms/react/Example.tsx:10; :280-285; :188 | — |
| 主流 | 文件头承诺：非受控 `defaultValue` / `defaultChecked`；`FormData` / `ref` 两种取值 | https://react.dev/reference/react-dom/components/input | 已讲对 | src/topics/07-forms/react/Example.tsx:12-15; :133-140; :146; :168-181 | — |
| 主流 | 文件头承诺：受控 vs 非受控取舍 | https://react.dev/reference/react-dom/components/input | 已讲对 | src/topics/07-forms/react/Example.tsx:16-17; :100-106 | — |
| 主流 | 文件头承诺：`value` 不配 `onChange` 打不进字 + 控制台警告；只读用 `readOnly` | https://react.dev/reference/react-dom/components/input | 已讲对 | src/topics/07-forms/react/Example.tsx:41; :218-227 | — |
| 主流 | 受控 ↔ 非受控不可中途切换：初始值须 `''`，`undefined` 触发警告 | https://react.dev/reference/react-dom/components/input | 未讲 | — | R2-07-2 |
| 主流 | `onChange` 每击键触发、语义 ≈ 原生 `input` 事件（≠ 原生 `change`） | https://react.dev/reference/react-dom/components/input | 缺标签 | src/topics/07-forms/react/Example.tsx:6; :303 | R2-07-3（「每击键」已讲，与原生 change 的差别未点明） |
| 主流 | `value` 恒为字符串；`type="number"` 需 `Number()` | https://react.dev/reference/react-dom/components/input | 未讲 | — | R2-07-4（19 题 :36-39 讲了，07 主责未讲） |
| 主流 | `<select value>`（`<option selected>` 不支持）；`<textarea value>`（不接 children） | https://react.dev/reference/react-dom/components/select；/textarea | 缺标签 | src/topics/07-forms/react/Example.tsx:315-317 | R2-07-4（select 有、textarea 无） |
| 主流 | 事件类型 `ChangeEvent` / `FormEvent`（→28） | https://react.dev/learn/typescript#dom-events | 已讲对 | src/topics/07-forms/react/Example.tsx:46; :265; :284 | — |
| 主流 | `useId`：label / `aria-describedby` 关联、SSR 一致、禁作 key、`identifierPrefix` | https://react.dev/reference/react/useId；node_modules/@types/react/index.d.ts:1907 | 未讲 | — | R2-07-1 |
| 较新 | `useId` 前缀 19.2 起 `_r_` | https://react.dev/blog/2025/10/01/react-19-2 | 未讲 | — | R2-07-1 |
| 主流 | `key` 重置表单 / 让 `defaultValue` 重新生效 | https://react.dev/learn/preserving-and-resetting-state | 已讲对 | src/topics/07-forms/react/Example.tsx:157-161; :203-210 | 用计数器 key 而非 `record.id`；未提「勿用 effect 同步 props→state」 |
| 主流 | a11y 只作引用→35：label 关联、`aria-describedby`、placeholder 不当 label、错误后焦点 | https://vuejs.org/guide/best-practices/accessibility.html#forms | 未讲 | — | R2-07-5 |
| 主流 | 文件头承诺 + Actions 对照：受控 + 手写提交仍【主流】；`<form action>` 成功后自动 reset 非受控字段；配 `useActionState` / `useFormStatus`（→31） | https://react.dev/reference/react-dom/components/form | 缺标签 | src/topics/07-forms/react/Example.tsx:19-21; :244-246; src/topics/07-forms/vue/Example.vue:20-22 | R2-07-6 |
| 旧写法 | 18 → 19：自定义输入组件透传 `ref` 不再必需 `forwardRef`（→02 / 12） | https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-07-7 |
| 主流 | Vue：`v-model` = `:value` + `@input` 语法糖；按元素展开；忽略初始 `value` / `checked` / `selected` | https://vuejs.org/guide/essentials/forms.html | 已讲对 | src/topics/07-forms/react/Example.tsx:34-35; src/topics/07-forms/vue/Example.vue:144-145; :172-173 | 「忽略初始属性 = JS 为真相源」未讲 |
| 主流 | Vue 修饰符 `.lazy` / `.number` / `.trim`；IME 合成期间 `v-model` 不更新 | https://vuejs.org/guide/essentials/forms.html | 未讲 | — | R2-07-3 |
| 较新 | Vue `defineModel()`（3.4 起推荐）编译为 `modelValue` + `update:modelValue`；3.4 前 props + emits 手写【旧写法】 | https://vuejs.org/guide/components/v-model.html | 未讲 | — | R2-07-3 |
| 主流 | 大纲未列：`FormData.get()` 返回 `string \| File \| null` 需收窄 | node_modules/typescript/lib/lib.dom.d.ts:12239, 39187 | 已讲对 | src/topics/07-forms/react/Example.tsx:84-91 | 大纲未列（生产要点有） |
| 主流 | 大纲未列：`e.currentTarget` 派发后被置 `null`，异步前先存局部变量 | node_modules/react-dom/cjs/react-dom-client.development.js:19120 | 已讲对 | src/topics/07-forms/react/Example.tsx:130-132 | 大纲未列；源码 `event.currentTarget = null` 一致 |
| 主流 | 大纲未列：checkbox 未勾选时 FormData 无该 key、勾选无 value 时为 `'on'` | ③ MDN FormData（未抓取） | 已讲对 | src/topics/07-forms/react/Example.tsx:137-139 | 大纲未列 |
| 主流 | 大纲未列：`defaultValue` 与 HTML dirty value flag（用户碰过后与属性脱钩） | ③ WHATWG HTML（未抓取） | 已讲对 | src/topics/07-forms/react/Example.tsx:196-204 | 大纲未列 |
| 主流 | 文件头承诺：Vue `:value` 不配 `@input` 是持续绑定，绑定值变会冲掉输入（与 `defaultValue` 语义相反） | https://vuejs.org/guide/essentials/forms.html | 已讲对 | src/topics/07-forms/react/Example.tsx:42; src/topics/07-forms/vue/Example.vue:232-236 | 大纲未列 |
| 主流 | 措辞：「没有一一对应关系」模板残留；react-hook-form「输入时根本不 setState」绝对化 | 规格 §5 H | 讲了但错 | src/topics/07-forms/react/Example.tsx:35; :18; :106; src/topics/07-forms/vue/Example.vue:36; :145 | R2-07-8 |

#### 面试 5 问

1. 受控组件和非受控组件的区别是什么，各自什么时候用？（追问：`value` 不配 `onChange` 会怎样？初始值给 `undefined` 会报什么警告？）
2. React 的 `onChange` 和原生 `change` 事件一样吗？（追问：中文输入法合成期间会触发吗？Vue 的 `v-model` 呢？）
3. `useId` 解决什么问题，为什么不用自增计数器或 `Math.random()`？（追问：能当列表 key 吗？多个 React root 怎么避免冲突？19.2 前缀为什么改成 `_r_`？）
4. 切换到另一条记录编辑时表单里残留上一条的值，怎么修？（追问：为什么不用 `useEffect` 同步 props 到 state？）
5. Vue 的 `v-model` 和 React 受控组件本质上一样吗？（追问：`defineModel` 编译成什么？为什么 Vue 也说「以 JS 状态为真相源」？）

#### 生产写法要点

- 表单 state 用一个对象 + 函数式更新，字段用 `name` 区分；数字字段在 `onChange` 里 `Number()`，空串单独处理。
- `<label htmlFor={id}>` 用 `useId`；错误信息用 `aria-describedby` 关联并在提交失败后把焦点移到第一个错误字段（→35）。
- 非受控 + `FormData` 时对 `get()` 做类型收窄（可能是 `File` / `null`），并用 schema 校验（zod 等只作引用）。
- 编辑不同记录时给表单 `key={record.id}`；大表单考虑拆子组件或非受控以减少重渲染。
- 提交按钮在提交中禁用、防重复与错误提示→19；React 19 项目可改 `<form action>` + `useActionState`（→31），注意受控字段不会自动 reset。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `value` + `onChange` 受控 | `v-model`（`:value` + `@input` 语法糖） | https://vuejs.org/guide/essentials/forms.html（2026-09-16） | 两者都以 JS 状态为真相源；React 需手写事件 |
| `defaultValue` / `FormData` 非受控 | 无专门概念；不绑 `v-model` 的原生表单 + `FormData` | https://vuejs.org/guide/essentials/forms.html（2026-09-16） | Vue 无「受控 / 非受控」二分，但文档说 `v-model` 忽略 DOM 初始属性 |
| `checked` / `<select value>` / `<textarea value>` | `v-model` 自动按元素类型选属性与事件 | https://vuejs.org/guide/essentials/forms.html（2026-09-16） | React 要自己选 `checked` vs `value` |
| 自定义输入组件 `value` + `onChange` props | `defineModel()`（3.4+）/ `modelValue` + `update:modelValue` | https://vuejs.org/guide/components/v-model.html（2026-09-16） | React 无 v-model 语法糖 |
| `useId` | 无内置；`useId` 无对应物（SSR 下用 `useSSRContext` 或手写前缀） | https://react.dev/reference/react/useId（2026-09-16） | Vue 无并发 / hydration 顺序问题的同类 API，原因是模板编译期 id 由开发者提供 |
| `key={id}` 重置表单 | `<Form :key="record.id">` | https://react.dev/learn/preserving-and-resetting-state（2026-09-16） | 同为「换 key 重建实例」 |
| `.lazy` / `.number` / `.trim` | — | https://vuejs.org/guide/essentials/forms.html（2026-09-16） | React 无修饰符，需在 `onChange` 里手写 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-07-1 | 严重 | 未讲 | 散点Hook | `useId` 零覆盖：label / aria 关联、为何不用计数器（SSR hydration 一致）、后缀派生多 id、禁作 key / cache key、`identifierPrefix`、19.2 前缀 `_r_`【较新】 | — | — | course-map §2 把 useId 主责定给 07，全课程 0 处（facts-inventory 已记）；按「盲点归属 = 承诺」定严重 | https://react.dev/reference/react/useId（逐字「useId should not be used to generate keys in a list」「The primary benefit of useId is that React ensures that it works with server rendering」）；node_modules/@types/react/index.d.ts:1907；grep0:useId | 二、核心概念 |
| R2-07-2 | 概念 | 未讲 | 其它 | 受控 ↔ 非受控切换警告：初始值给 `undefined` / `null` 再给字符串会报「changing an uncontrolled input to be controlled」，受控值须始终为字符串 | — | — | 大纲主流；面试第 1 问追问点；课件所有初始值恰好都是字符串但没说为什么 | https://react.dev/reference/react-dom/components/input（逐字「A controlled component should always receive a string value, not null or undefined」）；grep0:undefined\|受控切换\|uncontrolled[[:space:]]input[[:space:]]to[[:space:]]be[[:space:]]controlled | 六、易错点 |
| R2-07-3 | 概念 | 缺标签 | Vue现行写法 | `onChange` 只讲「每击键」，未点明 ≈ 原生 `input` 事件且 IME 合成期间也触发；Vue 侧缺 `.lazy` / `.number` / `.trim` 修饰符、IME 期间 `v-model` 不更新、`defineModel()`（3.4 起推荐【较新】）与 3.4 前手写【旧写法】 | src/topics/07-forms/react/Example.tsx:6 | 每次按键都 setState | 大纲主流 + 较新；Vue 对照仍停在「v-model 只是语法糖」，没有 3.4 现行组件写法 | https://react.dev/reference/react-dom/components/input（逐字「Behaves like the browser input event」）；https://vuejs.org/guide/essentials/forms.html（逐字「v-model doesn't get updated during IME composition」）；https://vuejs.org/guide/components/v-model.html（逐字「Starting in Vue 3.4, the recommended approach to achieve this is using the defineModel() macro」）；grep0:defineModel\|v-model\.lazy\|v-model\.number\|v-model\.trim\|IME\|输入法\|composition | 三、Vue 对照 |
| R2-07-4 | 概念 | 缺标签 | 其它 | 元素差异只讲了 checkbox / select：`value` 恒为字符串、`type="number"` 需 `Number()`、`<option selected>` 在 React 不支持、`<textarea>` 不接 children 均未讲 | src/topics/07-forms/react/Example.tsx:315-316 | 靠 option 的 selected 属性 | 大纲主流；number 在 19 题 :36-39 讲了但 07 是主责；textarea 0 命中 | https://react.dev/reference/react-dom/components/select（逐字「passing a selected attribute to <option> is not supported」）；https://react.dev/reference/react-dom/components/textarea（逐字「Passing children to <textarea> is not supported. Use defaultValue」）；grep0:textarea\|type="number" | 二、核心概念 |
| R2-07-5 | 概念 | 未讲 | 安全a11y | 无 a11y 引用：`<label htmlFor>` / `useId` 关联、错误信息 `aria-describedby`、placeholder 不当 label、提交失败后焦点管理（→35）；课件用隐式 label 包裹但未说明 | — | — | 大纲主流（只作引用，07 是 aria / 焦点的引用题） | https://vuejs.org/guide/best-practices/accessibility.html#forms（逐字「Avoid using placeholders as they can confuse many users」）；grep0:aria-\|htmlFor\|35[[:space:]]题 | 七、生产环境注意 |
| R2-07-6 | 概念 | 缺标签 | Actions | React 19 `<form action>` 只作一句「延伸」且说「本项目没有实现」：无【主流】/ 19.0 标签，未讲「在 Transition 中执行、成功后只 reset 非受控字段、受控字段不自动 reset」，指向 19 题而非 31 | src/topics/07-forms/react/Example.tsx:19-21; :244-246; src/topics/07-forms/vue/Example.vue:20-22 | 本项目没有实现 form actions | 规格 §7 Actions 19.0 起【主流】；evidence 标签判定「受控 + onSubmit 与 Actions 并列」；主线判定后 07 保留一句指向 31 | https://react.dev/reference/react-dom/components/form（逐字「After the action function succeeds, all uncontrolled field elements in the form are reset」） | 八、旧写法对照 |
| R2-07-7 | 概念 | 未讲 | 旧写法 | 无【旧写法】段：自定义输入组件透传 `ref` 在 18 需 `forwardRef`、19.0 起 `ref` 是普通 prop（→02 / 12）；React 18 无 `<form action>` | — | — | 大纲旧写法；07 无任何 18 → 19 对照 | https://react.dev/blog/2024/12/05/react-19（逐字「In future versions we will deprecate and remove forwardRef」）；grep0:forwardRef\|React[[:space:]]18 | 八、旧写法对照 |
| R2-07-8 | 小问题 | 措辞 | 绝对化 | 「没有一一对应关系」贴在已给出对应关系（`v-model` ↔ `value` + `onChange`）的句后；react-hook-form「输入时根本不 setState」绝对化（订阅到 formState 时仍重渲染） | src/topics/07-forms/react/Example.tsx:35; :18; :106; src/topics/07-forms/vue/Example.vue:36; :145; :19 | 没有一一对应关系 | 规格 §5 H 模板残留；§5 B 绝对化 | react-hook-form 表述待核实 P-07-2 | 六、易错点 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 受控组件和非受控组件的区别是什么，各自什么时候用？（追问：`value` 不配 `onChange` 会怎样？初始值给 `undefined` 会报什么警告？） | 部分 | src/topics/07-forms/react/Example.tsx:94-106; :218-222 | 缺「初始值 `undefined` → 受控 / 非受控切换警告」 |
| 2 | React 的 `onChange` 和原生 `change` 事件一样吗？（追问：中文输入法合成期间会触发吗？Vue 的 `v-model` 呢？） | 部分 | src/topics/07-forms/react/Example.tsx:6; :303 | 缺「≈ 原生 input 事件」的明说、IME 合成行为、`v-model` 在 IME 期间不更新 |
| 3 | `useId` 解决什么问题，为什么不用自增计数器或 `Math.random()`？（追问：能当列表 key 吗？多个 React root 怎么避免冲突？19.2 前缀为什么改成 `_r_`？） | 不能 | — | 全缺 |
| 4 | 切换到另一条记录编辑时表单里残留上一条的值，怎么修？（追问：为什么不用 `useEffect` 同步 props 到 state？） | 部分 | src/topics/07-forms/react/Example.tsx:157-161; :203-210 | 主答（换 `key`）有；缺「为何不用 effect 同步」 |
| 5 | Vue 的 `v-model` 和 React 受控组件本质上一样吗？（追问：`defineModel` 编译成什么？为什么 Vue 也说「以 JS 状态为真相源」？） | 部分 | src/topics/07-forms/react/Example.tsx:34-36; src/topics/07-forms/vue/Example.vue:144-145 | 缺 `defineModel` 编译产物、`v-model` 忽略初始属性 |

### 08. 父子组件通信

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 数据向下 props、事件向上回调 prop；`on` + 大写命名 / `handleX` 实现 | https://react.dev/learn/responding-to-events#naming-event-handler-props | 已讲对 | src/topics/08-parent-child-communication/react/Example.tsx:5-8; src/topics/08-parent-child-communication/react/Example.tsx:114 | 文件头承诺 |
| 主流 | 子组件不能改 props，要变化只能请父组件 setState | https://react.dev/learn/passing-props-to-a-component | 已讲对 | src/topics/08-parent-child-communication/react/Example.tsx:10-11; src/topics/08-parent-child-communication/react/Example.tsx:67-77 | 「React 根本不知道」措辞见 R2-08-10 |
| 主流 | React 没有独立事件系统：callback prop 就是普通函数 | https://react.dev/learn/responding-to-events | 已讲对 | src/topics/08-parent-child-communication/react/Example.tsx:12; src/topics/08-parent-child-communication/react/Example.tsx:21-22 | 文件头承诺；模板残留见 R2-08-10 |
| 主流 | 单一事实来源：列表数据只存在父组件 | https://react.dev/learn/sharing-state-between-components#a-single-source-of-truth-for-each-state | 已讲对 | src/topics/08-parent-child-communication/react/Example.tsx:9; src/topics/08-parent-child-communication/react/Example.tsx:127 | 深入归 25 |
| 主流 | 状态提升三步 / 兄弟通信 = 提升到最近共同父组件 | https://react.dev/learn/sharing-state-between-components | 未讲 | — | R2-08-2（只有一句指向 25） |
| 主流 | 受控 / 非受控组件（设计层：driven by props vs local state） | https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components | 未讲 | — | R2-08-2 |
| 主流 | 回调 prop 代替事件传播（stopPropagation 后调 onClick）；多层回调 vs 提升 | https://react.dev/learn/responding-to-events#passing-handlers-as-alternative-to-propagation | 未讲 | — | R2-08-5 |
| 主流 | 通知父组件不用 Effect：同一事件处理器里 setState + onChange（批处理） | https://react.dev/learn/you-might-not-need-an-effect#notifying-parent-components-about-state-changes | 未讲 | — | R2-08-1 |
| 主流 | 更进一步去掉子组件 state：fully controlled `Toggle({ isOn, onChange })` | https://react.dev/learn/you-might-not-need-an-effect | 未讲 | — | R2-08-1 |
| 主流 | 「把数据传给父组件」反模式（子在 Effect 里 onFetched） | https://react.dev/learn/you-might-not-need-an-effect#passing-data-to-the-parent | 未讲 | — | R2-08-1 |
| 主流 | 跨多层先 props / 组合 children，再 context | https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context | 未讲 | — | R2-08-5 |
| 主流 | 回调 prop 每次渲染新函数属正常；只有 memo 子组件 / Hook 依赖才 useCallback | https://react.dev/reference/react/memo；node_modules/@types/react/index.d.ts:1813 | 未讲 | — | R2-08-4 |
| 主流 | TS 回调 prop 类型；把 DOM 事件翻译成领域值再上报 | https://react.dev/learn/typescript | 已讲对 | src/topics/08-parent-child-communication/react/Example.tsx:42-46; src/topics/08-parent-child-communication/react/Example.tsx:100-103 | 可选回调 `onX?.()` 未示 |
| 主流 | React 无 v-model：`value + onChange` ↔ `modelValue + update:modelValue` | https://vuejs.org/guide/components/v-model.html#under-the-hood | 未讲 | — | R2-08-3 |
| 主流 | 不把 props 复制进 state；确需缓冲用 initialX 并接受不同步 | https://react.dev/learn/choosing-the-state-structure#dont-mirror-props-in-state | 已讲对 | src/topics/08-parent-child-communication/react/Example.tsx:55-57; src/topics/08-parent-child-communication/vue/ProductItem.vue:22-24 | draftName 是合法草稿；未点名反模式、未指向 09（R2-08-11） |
| 较新 | React 19 Actions：子组件 `action` prop 接父组件 async 函数 | https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-08-7；主责 31 |
| 旧写法 | ref + useImperativeHandle 调子组件方法；类组件 `this.props.onX` | https://react.dev/reference/react/cloneElement#alternatives | 未讲 | — | R2-08-8 |
| 旧写法 | 子组件在 Effect 里回调父组件同步 state | https://react.dev/learn/you-might-not-need-an-effect | 未讲 | — | R2-08-1 |
| 主流 | Vue：`defineEmits` 类型化声明 + `emit` + `@x` 监听 | https://vuejs.org/guide/components/events.html | 已讲对 | src/topics/08-parent-child-communication/vue/ProductItem.vue:13-18; src/topics/08-parent-child-communication/vue/ProductItem.vue:37; src/topics/08-parent-child-communication/vue/Example.vue:66-72 | 文件头承诺 |
| 主流 | Vue：组件事件不冒泡、camelCase 发出 / kebab-case 监听、emit 运行时校验、未声明的 `@x` 成为 fallthrough | https://vuejs.org/guide/components/events.html；https://vuejs.org/guide/components/attrs.html | 未讲 | — | R2-08-6（额外参数转发已隐含于 ProductItem.vue:17） |
| 主流 | Vue：`v-model` / `defineModel`（3.4+）是 props + emit 语法糖 | https://vuejs.org/guide/components/v-model.html | 未讲 | — | R2-08-3；主责 07 |
| 主流 | Vue props 只读；深层对象改动会穿透但违反单向流 | https://vuejs.org/guide/components/props.html#one-way-data-flow | 已讲对 | src/topics/08-parent-child-communication/react/Example.tsx:74-75; src/topics/08-parent-child-communication/vue/ProductItem.vue:34-35 | 大纲未列 |
| 主流 | Vue 可变 vs React 不可变更新（改名 map vs `target.name =`） | https://react.dev/learn/updating-arrays-in-state | 已讲对 | src/topics/08-parent-child-communication/react/Example.tsx:119-122; src/topics/08-parent-child-communication/vue/Example.vue:41-56 | 大纲未列；主责 21 |
| 主流 | 同文件多组件 vs SFC 一文件一组件 | — | 已讲对 | src/topics/08-parent-child-communication/react/Example.tsx:48-51; src/topics/08-parent-child-communication/vue/Example.vue:30-32 | 大纲未列 |

#### 面试 5 问

1. 子组件怎么把数据传给父组件？（追问：为什么不能直接改 props？回调 prop 命名约定；和 Vue `emit` 的本质差异——回调是普通函数还是事件系统？）
2. 什么是状态提升？什么时候该提升、什么时候不该？（追问：兄弟组件通信怎么做；提升太高有什么代价；何时改用 context 或 store？）
3. 「受控组件」和「非受控组件」在组件设计层面指什么？（追问：和表单里受控 `<input>` 是同一个概念吗？各自的取舍？）
4. 子组件 state 变了要通知父组件，能在 `useEffect` 里调 `onChange` 吗？（追问：为什么会多一轮渲染？正确做法？能不能干脆去掉子组件 state？）
5. Vue 的 `v-model` 在 React 里怎么实现？（追问：`defineModel` 编译成哪个 prop 和哪个事件？React 为什么没有语法糖？多个 `v-model` 对应什么？）

#### 生产写法要点

- 回调 prop 语义化：`onSelect(id)` 而非透传事件对象，子组件负责把 DOM 事件翻译成领域事件。
- 受控组件不在内部复制 props 到 state；确需本地缓冲用 `initialValue` 命名并接受不再同步（02 / 09）。
- 兄弟共享状态提升到最近共同父级；提升到根之前先用组合（13）与 context（15）；跨页面用 store（16）或 URL（18）。
- 父组件传下的异步回调（`onSubmit` 返回 Promise）要在子组件处理 pending / 错误 / 防重复（19 / 31）。
- 演示里子组件 Effect 回调父组件、或 `useImperativeHandle` 调子组件方法，要标「演示简化 / 逃生舱」并给出数据流版本。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| 回调 prop `onX={fn}`，可任意层转发 | `emit('x', payload)` + `defineEmits`；父 `@x="handler"`；"component emitted events do not bubble"，只能直接子级监听 | https://vuejs.org/guide/components/events.html（2026-09-16，逐字） | React 的回调是普通函数值，没有事件系统 |
| 直接传参 `onSelect(id)` | `$emit('increaseBy', 1)` 额外参数全部转发给监听器 | https://vuejs.org/guide/components/events.html（2026-09-16，逐字） | — |
| TS `onChange?: (id: number) => void` | `defineEmits<{ change: [id: number] }>()`（3.3+ 具名元组）或调用签名 | https://vuejs.org/guide/typescript/composition-api.html（2026-09-16）+ `node_modules/@vue/runtime-core/dist/runtime-core.d.ts:226-228` | — |
| 无声明；未知回调 prop 只是普通 prop | 未声明的 `@click` 作为 fallthrough 落到根元素；声明为 emit 后不再响应原生同名事件 | https://vuejs.org/guide/components/events.html + https://vuejs.org/guide/components/attrs.html（2026-09-16，逐字） | — |
| 无运行时校验，靠 TS | `defineEmits({ submit: (payload) => boolean })` 运行时校验 | https://vuejs.org/guide/components/events.html（2026-09-16，逐字） | — |
| `value` + `onChange` 受控约定 | `v-model` = `modelValue` + `update:modelValue`；`defineModel()`（3.4+）返回 ref；`v-model:title`、多个 v-model、修饰符 `[model, modifiers]` | https://vuejs.org/guide/components/v-model.html（2026-09-16，逐字）+ `runtime-core.d.ts:334-345` | 主责 07 |
| 状态提升到共同父级 | 同样提升；或 `provide` / `inject`、Pinia | https://react.dev/learn/sharing-state-between-components + https://vuejs.org/guide/essentials/component-basics.html（2026-09-16） | 指向 15 / 16 |
| 受控 / 非受控组件设计 | Vue 组件默认自持状态 + 可选 `v-model`；`defineModel` 设了 `default` 而父组件不传时父子会失同步 | https://vuejs.org/guide/components/v-model.html（2026-09-16，逐字） | — |
| Effect 里回调父组件（反模式） | `watch` 里 emit 同样是反模式；应在事件处理器里 emit | https://react.dev/learn/you-might-not-need-an-effect（2026-09-16） | Vue 侧无官方原文，属推论 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-08-1 | 概念 | 未讲 | 其它 | 「通知父组件」的 Effect 反模式与正解全部未讲：Effect 里 onChange「runs too late」多一轮渲染；同一处理器 setState + onChange 批处理；去掉子 state 全受控；Effect 里 onFetched 上抛数据 | — | — | 大纲主流 3 条 + 旧写法 1 条，08 是回调 prop 主责题却一字未提；面试问 4 整问答不出 | grep0:useEffect\|runs too late\|多一轮渲染 | 二、核心概念 / 六、易错点 |
| R2-08-2 | 概念 | 未讲 | 其它 | 状态提升三步法、兄弟通信、受控 / 非受控组件的设计层定义只剩一句指向 25 | — | — | 文件头把设计判断推给 25 可以，但本题至少要给三步法与「受控 = driven by props / 非受控 = 自持 local state」一句，否则面试问 2 / 3 只读本题答不出 | grep0:受控\|非受控\|最近的公共父\|共同父 | 二、核心概念 |
| R2-08-3 | 概念 | 未讲 | Vue现行写法 | React 无 v-model：`value + onChange` ↔ `modelValue + update:modelValue` / `defineModel()`（3.4+） | — | — | 面试问 5 直接考；课件 :87 已用 `value + onChange` 却没点破它就是 v-model 脱糖后的形态（主责 07，本题一句对照） | grep0:defineModel\|modelValue\|update: | 三、Vue 对照 |
| R2-08-4 | 概念 | 未讲 | 性能 | 回调 prop 每次渲染都是新函数属正常；只有 memo 子组件 / Hook 依赖才 useCallback | — | — | Vue 老手常问「每次渲染新建 handleDelete 有没有性能问题」；官方 memo 页「Objects and functions created during render will always be considered new」（主责 17） | grep0:useCallback\|memo\|新函数 | 五、常见追问与回答要点 |
| R2-08-5 | 概念 | 未讲 | 其它 | 回调 prop 代替事件传播（先 stopPropagation 再调 onClick prop）；多层回调层层转发 vs 提升 / 组合 children / context 阶梯 | — | — | 「事件冒泡式多层回调」是 Vue 老手最直觉的写法，课件没给 React 的对照答案，也没给阶梯（props → 13 children → 15 / 16） | grep0:stopPropagation\|冒泡\|多层\|逐层 | 二、核心概念 |
| R2-08-6 | 概念 | 未讲 | Vue现行写法 | Vue emit 细则未对照：组件事件不冒泡、camelCase 发出 / kebab-case 监听、`defineEmits({ x: p => boolean })` 运行时校验、未声明的 `@x` 落到根元素 | — | — | 大纲 Vue 对照总纲 4 条课件只有 defineEmits 声明；「事件不冒泡」正是与 React 回调「可任意层转发」的关键差异 | grep0:kebab\|camelCase\|运行时校验\|fallthrough | 三、Vue 对照 |
| R2-08-7 | 概念 | 未讲 | Actions | 【较新】React 19 子组件 `action` prop 可接父组件传下的 async 函数（回调 prop 的异步化） | — | — | 只需一句指向 31；facts-versions B（19.0 Actions） | grep0:action=\|useActionState\|Actions\|async | 九、新动向 |
| R2-08-8 | 概念 | 未讲 | 旧写法 | 【旧写法】ref + useImperativeHandle 调子组件方法、类组件 `this.props.onX` + bind 未作对照 | — | — | 存量代码常见的「命令式子传父」逃生舱没有标注（主责 12） | grep0:useImperativeHandle\|forwardRef\|this\.props\|类组件 | 八、旧写法对照 |
| R2-08-9 | 生产 | 未标简化 | 生产简化 | 回调全是同步本地更新；生产 onRename 通常 async 提交，要处理 pending / 错误 / 防重复 | src/topics/08-parent-child-communication/react/Example.tsx:120 | 不可变更新：map 出新数组 | 未标「演示简化」，也没说异步回调该由谁处理 pending（19 / 31） | https://react.dev/blog/2024/12/05/react-19（摘要：Actions 自动处理 pending / error） | 七、生产环境注意 |
| R2-08-10 | 小问题 | 措辞 | 绝对化 | 模板残留「没有一一对应关系」与「React 根本不知道 / 完全没有对应物」 | src/topics/08-parent-child-communication/react/Example.tsx:22; src/topics/08-parent-child-communication/vue/Example.vue:23; src/topics/08-parent-child-communication/vue/ProductItem.vue:14; src/topics/08-parent-child-communication/react/Example.tsx:11; src/topics/08-parent-child-communication/vue/Example.vue:12 | 没有一一对应关系 | 「改了也白改」不准确：直接改 props 对象后子组件因别的原因重渲染会显示改后值，真正问题是数据源被污染（课件 :71 自己说得更准）；对应关系其实明确（回调 ↔ emit） | https://react.dev/learn/passing-props-to-a-component（逐字「Don't try to change props」） | 二、核心概念 |
| R2-08-11 | 小问题 | 措辞 | 交叉引用 | 交叉引用只有 25；应加 02（props 只读）、04（事件）、07（v-model / 受控 input）、09（不镜像 props）、17（useCallback）、24（批处理）、31（Actions） | src/topics/08-parent-child-communication/react/Example.tsx:24-25 | 见 25 题（状态提升与 state 归属） | 大纲各条版本说明列出的指向未落地 | course-map §1 | 参考 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 子组件怎么把数据传给父组件？为什么不能直接改 props？回调 prop 命名约定；和 Vue emit 的本质差异 | 能 | src/topics/08-parent-child-communication/react/Example.tsx:5-12; src/topics/08-parent-child-communication/react/Example.tsx:67-77; src/topics/08-parent-child-communication/react/Example.tsx:114 | — |
| 2 | 什么是状态提升？什么时候该 / 不该？兄弟通信；提升太高的代价；何时改用 context / store | 部分 | src/topics/08-parent-child-communication/react/Example.tsx:24-25 | 只有一句指向 25；无定义、无代价、无阶梯 |
| 3 | 「受控 / 非受控组件」在组件设计层指什么？与表单受控 input 是同一概念吗？ | 不能 | — | 全文无「受控」一词 |
| 4 | 子 state 变了要通知父组件，能在 useEffect 里调 onChange 吗？为什么多一轮渲染？ | 不能 | — | 无任何 Effect 通知父组件的讨论 |
| 5 | Vue 的 v-model 在 React 里怎么实现？defineModel 编译成哪个 prop 和事件？ | 不能 | src/topics/08-parent-child-communication/react/Example.tsx:87 | 只有 `value + onChange` 代码，未与 modelValue / defineModel 对照 |

### 09. 派生状态

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 渲染期直接算派生值，不用 Effect（"You don't need Effects to transform data for rendering"） | https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state | 已讲对 | src/topics/09-derived-state/react/Example.tsx:46-57 | 文件头承诺 |
| 主流 | 冗余 state 原则：能算出来的不放 state | https://react.dev/learn/choosing-the-state-structure#avoid-redundant-state | 已讲对 | src/topics/09-derived-state/react/Example.tsx:11; src/topics/09-derived-state/react/Example.tsx:36; src/topics/09-derived-state/react/Example.tsx:87 | 文件头承诺 |
| 主流 | 避免重复：存 `selectedId` 而非对象，渲染期 `find` | https://react.dev/learn/choosing-the-state-structure#avoid-duplication-in-state | 未讲 | — | R2-09-1 |
| 主流 | 不镜像 props 进 state；例外命名 `initialX` / `defaultX` | https://react.dev/learn/choosing-the-state-structure#dont-mirror-props-in-state | 未讲 | — | R2-09-1 |
| 主流 | Effect 派生的代价：先渲染旧值再级联一次渲染 | https://react.dev/learn/you-might-not-need-an-effect | 已讲对 | src/topics/09-derived-state/react/Example.tsx:76-89 | 文件头承诺 |
| 主流 | lint `react-hooks/set-state-in-effect`（7.x `recommended`，error） | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect | 未讲 | — | R2-09-2 |
| 主流 | 只有昂贵计算才 useMemo；它只是性能优化 | https://react.dev/reference/react/useMemo | 已讲对 | src/topics/09-derived-state/react/Example.tsx:7-9; src/topics/09-derived-state/react/Example.tsx:59-67 | 文件头承诺 |
| 主流 | React 可能丢弃 useMemo 缓存，不能当语义保证 | https://react.dev/reference/react/useMemo | 未讲 | — | R2-09-3 |
| 主流 | 怎么判断昂贵：`console.time` / ≥1ms / CPU throttling / StrictMode 双调偏大 | https://react.dev/learn/you-might-not-need-an-effect#how-to-tell-if-a-calculation-is-expensive | 未讲 | — | R2-09-3 |
| 主流 | useMemo 三种有价值场景（慢计算 / memo 子组件 prop / Hook 依赖） | https://react.dev/reference/react/useMemo#should-you-add-usememo-everywhere | 已讲对 | src/topics/09-derived-state/react/Example.tsx:62-65 | 主责 17 |
| 主流 | 让记忆化不必要的五原则 | https://react.dev/reference/react/useMemo | 未讲 | — | R2-09-4；主责 17 |
| 主流 | prop 变化时重置（key）/ 调整部分 state（渲染期 setState 的限制） | https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes | 未讲 | — | R2-09-5 |
| 主流 | 事件间共享逻辑抽函数不放 Effect；不用 Effect 链 | https://react.dev/learn/you-might-not-need-an-effect | 未讲 | — | R2-09-5 |
| 主流 | 签名 `useMemo<T>(factory, deps)`；Object.is；StrictMode 双调 factory；`() => ({})`；不能循环调用 | node_modules/@types/react/index.d.ts:1821；https://react.dev/reference/react/useMemo#troubleshooting | 已讲对 | src/topics/09-derived-state/react/Example.tsx:61; src/topics/09-derived-state/react/Example.tsx:71-74 | Object.is 已讲；StrictMode 与 troubleshooting 未讲，并入 R2-09-3 |
| 主流 | 纯性：派生计算无副作用、结果不突变 | https://react.dev/learn/keeping-components-pure | 未讲 | — | 并入 R2-09-6 |
| 较新 | React Compiler 自动记忆化减少手写 useMemo；`preserve-manual-memoization` | https://react.dev/reference/react/useMemo；facts-versions G / F | 未讲 | — | R2-09-4 |
| 较新 | `no-deriving-state-in-effects` 已注册默认 Off | facts-versions F | 未讲 | — | R2-09-2 |
| 旧写法 | Effect 派生 / 类组件 `getDerivedStateFromProps`、`componentWillReceiveProps` | https://react.dev/learn/you-might-not-need-an-effect | 缺标签 | src/topics/09-derived-state/react/Example.tsx:77-82 | R2-09-8（反例已讲，缺【旧写法】标签与类组件 API） |
| 旧写法 | 「全包 useMemo / memo」无大害但可读性差 | https://react.dev/reference/react/memo | 未讲 | — | R2-09-8 |
| 主流 | Vue computed 按响应式依赖缓存 vs 方法每次执行 | https://vuejs.org/guide/essentials/computed.html | 讲了但错 | src/topics/09-derived-state/react/Example.tsx:14; src/topics/09-derived-state/vue/Example.vue:60 | R2-09-7（「唯一惯用写法」否定了官方的方法写法） |
| 主流 | Vue：非响应式依赖不更新、可写 computed、previous value（3.4+）、getter 无副作用 / 返回值只读 | https://vuejs.org/guide/essentials/computed.html；node_modules/@vue/reactivity/dist/reactivity.d.ts:359,361-364 | 未讲 | — | R2-09-6 |
| 主流 | Vue `ref + watch` 同步派生值反模式 | https://vuejs.org/guide/essentials/computed.html（摘要） | 已讲对 | src/topics/09-derived-state/vue/Example.vue:62-71; src/topics/09-derived-state/react/Example.tsx:15 | 文件头承诺 |
| 主流 | 「setup 只执行一次 vs 组件函数每次重跑」解释 React 为何不需包装 | https://react.dev/learn/render-and-commit | 已讲对 | src/topics/09-derived-state/react/Example.tsx:17-19; src/topics/09-derived-state/react/Example.tsx:48-51 | 文件头承诺；大纲未列 |
| 主流 | useMemo ≠ computed：手写依赖、只是性能优化 | https://react.dev/reference/react/useMemo | 已讲对 | src/topics/09-derived-state/react/Example.tsx:20-21; src/topics/09-derived-state/react/Example.tsx:66-69 | 模板残留见 R2-09-9 |
| 主流 | 派生值可继续派生（computed 链） | https://vuejs.org/guide/essentials/computed.html | 已讲对 | src/topics/09-derived-state/vue/Example.vue:54-55 | 大纲未列 |

#### 面试 5 问

1. 哪些值该放 state、哪些值该渲染时算？（追问：`fullName` 用 Effect 同步有什么问题？lint 会报什么规则？）
2. `useMemo` 什么时候才值得用？怎么判断「昂贵」？（追问：1ms 经验值从哪来；开发期测量为什么偏大；「React 可能丢弃缓存」意味着不能拿它当语义保证）
3. React 的派生值和 Vue 的 `computed` 本质区别是什么？（追问：computed 靠什么缓存？React 不用 useMemo 每次渲染都算会怎样？React Compiler 之后呢？）
4. 父组件传的 `items` 变了要重置选中项，怎么做？（追问：`key` / 渲染期 setState / 存 id 三种方案取舍；渲染期 setState 的限制条件）
5. `selectedItem` 应该存对象还是存 id？（追问：编辑 item 后选中项不同步怎么办；「避免重复」原则；Vue 里怎么写等价 computed）

#### 生产写法要点

- 默认渲染期计算；`useMemo` 只在测量后加；未启用 Compiler 时，传给 `memo` 子组件的对象 / 数组 prop 才需要 `useMemo`（17）。
- 服务端数据的派生（过滤、分页、汇总）用 TanStack Query 的 `select` 或渲染期计算（30），不复制进 state。
- 多字段联动的复杂派生用 `useReducer` 在事件里一次算好（29），不用 Effect 链；跨组件同步先考虑状态提升（25）。
- ESLint 用 `recommended`（已含 `set-state-in-effect`），可选开启 `no-deriving-state-in-effects`。
- 演示里若保留 Effect 派生作反例，必须并排给出渲染期版本，并标「反例 / 演示简化」。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `const full = a + b`（每次渲染重算） | `computed(() => ...)`："cached based on their reactive dependencies"，方法则每次重跑 | https://vuejs.org/guide/essentials/computed.html（2026-09-16，逐字） | React 无自动依赖追踪；便宜计算直接算即可 |
| `useMemo(fn, deps)` 手写依赖 | computed 自动收集依赖；非响应式依赖（`Date.now()`）永不更新 | https://vuejs.org/guide/essentials/computed.html + https://react.dev/reference/react/useMemo（2026-09-16，逐字） | deps 漏写 → 过期值；Vue 无此坑但有「非响应式依赖」坑 |
| 派生值不可写；要改就改源 state | 可写 computed `{ get, set }`（`WritableComputedOptions<T, S>`） | https://vuejs.org/guide/essentials/computed.html（逐字）+ `node_modules/@vue/reactivity/dist/reactivity.d.ts:361-364` | React 无对应物：派生值就是普通变量 |
| 无「上一次值」 | `computed((previous) => ...)`（3.4+），`ComputedGetter<T> = (oldValue?: T) => T` | https://vuejs.org/guide/essentials/computed.html（逐字）+ `reactivity.d.ts:359` | React 需 ref 自己存（12 / 26） |
| 计算必须纯、结果不突变 | "Getters should be side-effect free"、"Avoid mutating computed value" | https://vuejs.org/guide/essentials/computed.html（2026-09-16，逐字） | 一致 |
| 存 id、渲染期 `find` | 同样存 id 用 computed 派生 | https://react.dev/learn/choosing-the-state-structure + https://vuejs.org/guide/essentials/computed.html（2026-09-16） | — |
| Compiler 自动记忆化【较新】（17） | 模板编译期优化 + computed 缓存 | facts-versions G | — |
| lint `set-state-in-effect` | 无对应规则；`watch` 里同步派生同样是反模式，应用 computed | https://vuejs.org/guide/essentials/computed.html（2026-09-16，摘要） | 指向 10 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-09-1 | 概念 | 未讲 | 其它 | choosing-the-state-structure 三原则未讲：避免重复（存 id 不存对象）、不镜像 props 进 state（`initialX`）、避免矛盾 state | — | — | 面试问 5 直接考「selectedItem 存对象还是 id」；文件头「判断标准」只覆盖冗余一条 | grep0:selectedId\|镜像\|mirror\|矛盾\|initialX\|重复.*state | 二、核心概念 |
| R2-09-2 | 概念 | 未讲 | 其它 | 未提 eslint-plugin-react-hooks 7 `recommended` 会以 error 报 `set-state-in-effect`；`no-deriving-state-in-effects` 默认 Off | — | — | 反例写在注释里所以不会命中，但学习者真写出来会被 lint 拦，应给出规则名与预设 | grep0:set-state-in-effect\|eslint\|lint | 六、易错点 |
| R2-09-3 | 概念 | 未讲 | 性能 | useMemo 判定方法与语义边界：`console.time` 包住、≥1ms 才考虑、CPU throttling、StrictMode 双调导致开发期偏大；React 可能丢弃缓存不能当语义保证；`() => ({})`、不能在循环里调用 | — | — | 课件只说「量测到瓶颈再加」（:67）没给量法；官方原文「You should only rely on useMemo as a performance optimization」 | grep0:console\.time\|1ms\|throttl\|丢弃\|StrictMode\|严格模式 | 五、常见追问与回答要点 |
| R2-09-4 | 概念 | 未讲 | 性能 | 【较新】React Compiler 自动记忆化后手写 useMemo 的定位与 `preserve-manual-memoization`；让记忆化不必要的五原则——只作一句引用指向 17 | — | — | 面试问 3 追问「React Compiler 之后呢」；Compiler 1.0【较新】不启用但要讲 | grep0:Compiler\|编译器\|children\|Profiler | 九、新动向 |
| R2-09-5 | 概念 | 未讲 | 其它 | you-might-not-need-an-effect 其余派生场景：prop 变化时重置（key）/ 调整部分 state（渲染期比较 prev 再 setState，限同组件、须有条件）、事件间共享逻辑抽函数、不用 Effect 链 | — | — | 面试问 4「items 变了要重置选中项」三方案取舍课件无一提及 | grep0:重置\|prevItems\|上一次的 props\|Effect 链\|事件处理器 | 二、核心概念 |
| R2-09-6 | 概念 | 未讲 | Vue现行写法 | Vue computed 细则未对照：非响应式依赖（`Date.now()`）不更新、可写 computed `{ get, set }`、previous value 参数（3.4+）、getter 无副作用 / 不突变返回值；React 侧纯性要求 | — | — | 大纲 Vue 对照 5 条只讲了「自动缓存」；两边「派生计算必须纯」的共同纪律没写 | grep0:可写\|WritableComputed\|previous\|Date\.now\|副作用 | 三、Vue 对照 |
| R2-09-7 | 概念 | 讲错 | 绝对化 | 「computed 是 Vue 派生值的唯一惯用写法」「必须用 computed」「Vue 里也不存在非缓存的直接算」 | src/topics/09-derived-state/react/Example.tsx:14; src/topics/09-derived-state/react/Example.tsx:18-19; src/topics/09-derived-state/vue/Example.vue:15; src/topics/09-derived-state/vue/Example.vue:19; src/topics/09-derived-state/vue/Example.vue:60 | 是 Vue 派生值的唯一惯用写法 | 官方 computed 页专设「Computed Caching vs. Methods」：方法 / 模板内联表达式同样合法，区别只是不缓存；准确对照是「React 直接算 ≈ Vue 方法，useMemo ≈ computed 的缓存面」 | https://vuejs.org/guide/essentials/computed.html（逐字「cached based on their reactive dependencies」，方法则每次重跑） | 四、关键区别 |
| R2-09-8 | 概念 | 缺标签 | 旧写法 | Effect 派生反例未标【旧写法】；类组件 `getDerivedStateFromProps` / `componentWillReceiveProps`、「全包 useMemo」旧建议未作对照 | src/topics/09-derived-state/react/Example.tsx:77 | 最典型的反模式：把派生值放进 state | 存量代码最常见形态，规格要求移到「旧写法对照」并注明 Hooks 起改渲染期计算 | https://react.dev/learn/you-might-not-need-an-effect（逐字反例）；https://react.dev/reference/react/memo（逐字「There is no significant harm to doing that either」） | 八、旧写法对照 |
| R2-09-9 | 小问题 | 措辞 | 绝对化 | 模板残留「没有一一对应关系」4 处 | src/topics/09-derived-state/react/Example.tsx:21; src/topics/09-derived-state/react/Example.tsx:69; src/topics/09-derived-state/vue/Example.vue:22; src/topics/09-derived-state/vue/Example.vue:59 | 两者没有一一对应关系 | 规格 §5 H 模板残留；这里其实有对应（computed 的缓存面 ↔ useMemo），应改写为准确对照 | course-map §6 H | 四、关键区别 |
| R2-09-10 | 小问题 | 措辞 | 交叉引用 | 全题零交叉引用；应指向 17（memo / useCallback / Compiler）、06（key 重置）、02（props）、25（提升）、29（reducer 事件里算）、30（Query `select`） | src/topics/09-derived-state/react/Example.tsx:7-8 | useMemo 只有两种情况才需要 | 大纲版本说明列出的指向未落地；facts-inventory 记录 09 交叉引用为「—」 | facts-inventory §1 | 参考 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 哪些值该放 state、哪些渲染时算？fullName 用 Effect 同步有什么问题？lint 报什么规则？ | 部分 | src/topics/09-derived-state/react/Example.tsx:11; src/topics/09-derived-state/react/Example.tsx:46-57; src/topics/09-derived-state/react/Example.tsx:76-89 | lint 规则名与预设未提 |
| 2 | useMemo 何时值得？怎么判断昂贵？1ms 从哪来；开发期为何偏大；缓存可丢弃意味着什么 | 部分 | src/topics/09-derived-state/react/Example.tsx:59-69 | 量法、1ms、StrictMode、缓存不保证均无 |
| 3 | React 派生值 vs computed 本质区别？computed 靠什么缓存？不用 useMemo 每次算会怎样？Compiler 后呢？ | 部分 | src/topics/09-derived-state/react/Example.tsx:17-21; src/topics/09-derived-state/react/Example.tsx:46-53; src/topics/09-derived-state/react/Example.tsx:66-69 | 缓存机制（响应式依赖）与 Compiler 未讲；「唯一写法」说法有误 |
| 4 | 父组件 items 变了要重置选中项怎么做？key / 渲染期 setState / 存 id 取舍 | 不能 | — | 三方案全无 |
| 5 | selectedItem 存对象还是存 id？编辑后不同步怎么办？ | 不能 | — | 「避免重复」原则未讲 |

### 10. useEffect 与生命周期

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | Effect 定位：渲染后与外部系统同步；不是 onMounted 替代品（文件头承诺） | https://react.dev/learn/synchronizing-with-effects | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:5; src/topics/10-effects-and-lifecycle/react/Example.tsx:25-28; src/topics/10-effects-and-lifecycle/react/Example.tsx:269; src/topics/10-effects-and-lifecycle/react/Example.tsx:333-334 | — |
| 主流 | 执行时机：commit 后、屏幕更新后运行（文件头承诺「渲染提交到屏幕后」） | https://react.dev/reference/react/useEffect#caveats | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:5 | 「非交互引起的 Effect 浏览器先绘制再跑」未细讲 |
| 主流 | 只在客户端运行、SSR 不跑；SSR 下 didMount 模式（→ 33） | https://react.dev/reference/react/useEffect#displaying-different-content-on-the-server-and-the-client | 未讲 | — | R2-10-6 |
| 主流 | 依赖数组三形态；`[]` = 挂载而非「初始化一次」；EffectCallback 不能 async（文件头承诺） | https://react.dev/learn/synchronizing-with-effects#step-2-specify-the-effect-dependencies；node_modules/@types/react/index.d.ts:1785 | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:6; src/topics/10-effects-and-lifecycle/react/Example.tsx:275-278; src/topics/10-effects-and-lifecycle/react/Example.tsx:292-294 | Object.is 只在 :101 讲 setState 跳过渲染，未说依赖比较也用 Object.is |
| 主流 | 「不能挑选依赖」；ref / setState 稳定身份可省略；lint 报的都是真问题 | https://react.dev/learn/lifecycle-of-reactive-effects；https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:111-113; src/topics/10-effects-and-lifecycle/react/Example.tsx:125-128; src/topics/10-effects-and-lifecycle/react/Example.tsx:209; src/topics/10-effects-and-lifecycle/react/Example.tsx:277-278 | setState 可省略这一条未点名；eslint.config.js:37 已启用 exhaustive-deps=warn |
| 主流 | cleanup：重跑前 + 卸载时；setup / cleanup 镜像（文件头承诺） | https://react.dev/learn/synchronizing-with-effects#step-3-add-cleanup-if-needed | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:7; src/topics/10-effects-and-lifecycle/react/Example.tsx:77-78; src/topics/10-effects-and-lifecycle/react/Example.tsx:185-192; src/topics/10-effects-and-lifecycle/react/Example.tsx:309-311 | — |
| 主流 | StrictMode 开发期 setup→cleanup→setup、生产不受影响、判据（文件头承诺） | https://react.dev/reference/react/StrictMode；https://react.dev/reference/react/useEffect#my-effect-runs-twice-when-the-component-mounts | 缺标签 | src/topics/10-effects-and-lifecycle/react/Example.tsx:8; src/topics/10-effects-and-lifecycle/react/Example.tsx:313-316 | R2-10-7（未写「18.0 起」） |
| 主流 | Effect 生命周期 ≠ 组件生命周期（文件头承诺） | https://react.dev/learn/lifecycle-of-reactive-effects | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:25-28; src/topics/10-effects-and-lifecycle/vue/Example.vue:26-29 | — |
| 主流 | 每个 Effect 一个同步过程；不相关的事拆成多个 Effect | https://react.dev/learn/removing-effect-dependencies#is-your-effect-doing-several-unrelated-things | 未讲 | — | R2-10-3（:240-248 用了两个 effect 但没讲原则） |
| 主流 | 可变值（ref.current、location.pathname）写进依赖也不触发重跑 | https://react.dev/learn/lifecycle-of-reactive-effects#all-variables-declared-in-the-component-body-are-reactive | 未讲 | — | R2-10-3 |
| 主流 | 对象 / 函数依赖每次 commit 重跑：静态移组件外、动态移进 Effect、只读原始值 | https://react.dev/reference/react/useEffect#removing-unnecessary-object-dependencies | 未讲 | — | R2-10-3 |
| 主流 | 定时器与过期闭包 → 函数式更新去掉依赖（文件头承诺；细讲 → 26） | https://react.dev/reference/react/useEffect#updating-state-based-on-previous-state-from-an-effect | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:10-13; src/topics/10-effects-and-lifecycle/react/Example.tsx:93-201 | 修法二代价 :169-176 与修法三 latest ref :203-256 比大纲深（大纲未列） |
| 主流 | 请求与竞态：cleanup 里 abort 或 ignore；细讲 → 27（文件头承诺） | https://react.dev/learn/synchronizing-with-effects#fetching-data | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:9; src/topics/10-effects-and-lifecycle/react/Example.tsx:280-284; src/topics/10-effects-and-lifecycle/react/Example.tsx:287-324 | — |
| 主流 | 在 Effect 里请求的四个缺点与官方替代（框架机制 / TanStack / useSWR / Router loader）→ 11 / 30 | https://react.dev/reference/react/useEffect#what-are-good-alternatives-to-data-fetching-in-effects | 未讲 | — | R2-10-1 |
| 主流 | 不该用 Effect：派生数据、响应事件、按 prop 重置用 key | https://react.dev/learn/you-might-not-need-an-effect | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:326-335; src/topics/10-effects-and-lifecycle/vue/Example.vue:92-94 | — |
| 主流 | 不该用 Effect：链式 setState、初始化应用、通知父组件、订阅外部 store（useSyncExternalStore → 14） | https://react.dev/learn/you-might-not-need-an-effect | 未讲 | — | R2-10-4 |
| 主流 | Effect 内同步 setState 的代价；lint `set-state-in-effect`（recommended 为 error）；值来自 ref 时允许 | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect | 未讲 | — | R2-10-2（:291 正是该规则命中的写法） |
| 主流 | 抑制 lint = 对 React 撒谎；改代码不改依赖数组 | https://react.dev/learn/removing-effect-dependencies | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:111-113; src/topics/10-effects-and-lifecycle/react/Example.tsx:125-128 | 刻意保留的 eslint-disable 已标「千万别学」 |
| 主流 | useLayoutEffect：绘制前、阻塞绘制、量布局；服务端报错 | https://react.dev/reference/react/useLayoutEffect；node_modules/@types/react/index.d.ts:1775 | 未讲 | — | R2-10-5（:25「React 只有一个 useEffect」与之相悖） |
| 主流 | useInsertionEffect 一句：CSS-in-JS 库作者用 | https://react.dev/reference/react/useInsertionEffect | 未讲 | — | R2-10-5 |
| 较新 | useEffectEvent：读最新值不进依赖，19.2 起稳定（细讲 → 26） | https://react.dev/reference/react/useEffect#reading-the-latest-props-and-state-from-an-effect；node_modules/@types/react/index.d.ts:1791 | 缺标签 | src/topics/10-effects-and-lifecycle/react/Example.tsx:222-227 | R2-10-7（版本 19.2 已写，缺【较新】） |
| 旧写法 | class 生命周期心智（componentDidMount / DidUpdate / WillUnmount）与「三合一」错误类比 | https://react.dev/learn/lifecycle-of-reactive-effects | 未讲 | — | R2-10-8 |
| 旧写法 | 靠 eslint-disable 省依赖的存量写法 → 19.2 用 useEffectEvent | https://react.dev/blog/2025/10/01/react-19-2 | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:111-113; src/topics/10-effects-and-lifecycle/react/Example.tsx:222-227 | 未标【旧写法】 |
| 主流 | React 18 起卸载后 setState 不再警告（大纲未列） | https://github.com/facebook/react/pull/22114（③） | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:405 | 版本落点见 P-10-2 |
| 主流 | Vue：watch 显式源 / watchEffect 自动追踪 vs 依赖数组 + lint | https://vuejs.org/guide/essentials/watchers.html | 已讲对 | src/topics/10-effects-and-lifecycle/vue/Example.vue:52-53; src/topics/10-effects-and-lifecycle/vue/IntervalCounter.vue:33-35 | — |
| 主流 | Vue：cleanup ≈ 回调第三参 onCleanup + onUnmounted；同步创建的 watcher 随组件停止（文件头承诺） | https://vuejs.org/guide/essentials/watchers.html#stopping-a-watcher | 已讲对 | src/topics/10-effects-and-lifecycle/vue/Example.vue:56-66; src/topics/10-effects-and-lifecycle/vue/Example.vue:84-87 | — |
| 主流 | Vue：`onWatcherCleanup()`（3.5+，须在同步段调用） | https://vuejs.org/api/reactivity-core.html#onwatchercleanup；node_modules/@vue/reactivity/dist/reactivity.d.ts:753 | 未讲 | — | R2-10-9 |
| 主流 | Vue：`[]` ≈ onMounted 只是最接近写法；`immediate: true` 对应首跑 | https://vuejs.org/api/composition-api-lifecycle.html#onmounted；https://vuejs.org/api/reactivity-core.html#watch | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:17-18; src/topics/10-effects-and-lifecycle/react/Example.tsx:271-276; src/topics/10-effects-and-lifecycle/vue/Example.vue:49-53 | — |
| 主流 | Vue：flush 'pre' / 'post' / 'sync' 时机轴 vs React 以绘制为参照 | https://vuejs.org/guide/essentials/watchers.html#callback-flush-timing | 未讲 | — | R2-10-9 |
| 主流 | Vue：StrictMode 无对应物；watcher 里改状态 vs computed | https://react.dev/reference/react/StrictMode；https://vuejs.org/guide/essentials/watchers.html | 已讲对 | src/topics/10-effects-and-lifecycle/react/Example.tsx:316; src/topics/10-effects-and-lifecycle/vue/Example.vue:89-94 | — |

#### 面试 5 问

1. useEffect 的依赖数组三种写法分别什么时候跑？为什么说「不能挑选依赖」？（追问：为什么 `ref` 对象和 `setState` 可以不写进依赖？`ref.current` 写进去有用吗？）
2. cleanup 什么时候执行？为什么开发环境 Effect 会跑两次、生产会吗？（追问：怎么判断 cleanup 写对了？请求 / 定时器 / 订阅各自的 cleanup 是什么？）
3. useEffect 和 useLayoutEffect 的区别？什么时候必须用后者？（追问：SSR 下为什么 useLayoutEffect 会警告，怎么处理？）
4. 在 Effect 里 fetch 有什么坑？怎么处理竞态？（追问：官方推荐的替代方案是什么，什么情况下仍可以在 Effect 里请求？）
5. useEffect 是不是 Vue 的 onMounted？哪些场景不该用 Effect？（追问：把派生状态放在 Effect 里 setState，lint 会报哪条规则、多付出了什么？）

#### 生产写法要点

- 请求必须带取消 / 忽略（AbortController 或 `ignore`）+ 错误态 + 空态；真实项目优先用路由 loader 或 TanStack Query（→ 11 / 30），Effect 手写只留给无框架且无缓存需求的场景
- 定时器 `clearInterval`、事件监听 `removeEventListener`、第三方 widget `destroy()` 都要在 cleanup 里做，且 cleanup 必须幂等（StrictMode 会跑两遍）
- 开发环境保持 `<StrictMode>` 开启，用它当竞态 / 泄漏探测器，不要为了「少跑一次」关掉
- 不禁用 `exhaustive-deps`：用函数式更新、把对象 / 函数移进 Effect、拆多个 Effect、`useEffectEvent`（19.2+）来「证明」依赖不需要
- `set-state-in-effect` 为 error：派生数据在渲染期算，或用 `useMemo`；「按 prop 重置」用 `key`
- TS 层：`EffectCallback` 不接受返回 Promise 的 async 函数，异步逻辑写成 Effect 内部的 async 函数再调用
- SSR / RSC 场景：Effect 不在服务端运行，仅浏览器逻辑放 Effect；避免 `didMount` 模式导致的内容闪烁

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `useEffect(fn, [a, b])` 显式依赖 + `Object.is` | `watch([a, b], cb)` 显式源 / `watchEffect(fn)` 自动追踪同步访问的响应式属性 | https://vuejs.org/guide/essentials/watchers.html（2026-09-16，逐字）；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:1517,1521 | Vue 靠 getter 追踪，无「依赖数组写漏」问题；React 靠 lint 校验 |
| Effect 返回 cleanup（重跑前 + 卸载时调用） | `onWatcherCleanup()`（3.5+，须在 watch 回调 / watchEffect 同步段内调用，不能在 await 之后）或回调第三参 `onCleanup` | https://vuejs.org/api/reactivity-core.html#onwatchercleanup（2026-09-16，逐字）；node_modules/@vue/reactivity/dist/reactivity.d.ts:753 | 语义相同：watcher 将要重跑或停止时调用 |
| `useEffect(fn, [])` | `onMounted()`（「组件挂载后调用」，SSR 不调用） | https://vuejs.org/api/composition-api-lifecycle.html#onmounted（2026-09-16，逐字） | 只是最接近的写法：`[]` 表示「无响应式依赖」，且 StrictMode 会 setup→cleanup→setup；Vue 无双调 |
| cleanup 的「卸载」分支 | `onUnmounted()`；`setup()` / `<script setup>` 内同步创建的 watcher 随组件自动停止 | https://vuejs.org/guide/essentials/watchers.html#stopping-a-watcher（2026-09-16，逐字） | Vue 里异步创建的 watcher 不会自动停止，需手动 `unwatch()` |
| Effect 默认在 paint 后跑；`useLayoutEffect` 在 paint 前 | watcher 默认 `flush: 'pre'`（父组件更新后、本组件 DOM 更新前）；`flush: 'post'` / `watchPostEffect` 在 DOM 更新后；`flush: 'sync'` / `watchSyncEffect` 同步 | https://vuejs.org/guide/essentials/watchers.html#callback-flush-timing（2026-09-16，逐字） | 两者的「时机轴」不同：Vue 以组件 DOM 更新为参照，React 以浏览器绘制为参照 |
| Effect 首次挂载即运行 | `watch(..., { immediate: true })`；`once: true`（3.4+）只触发一次 | https://vuejs.org/api/reactivity-core.html#watch（2026-09-16，逐字） | `watch` 默认惰性，`watchEffect` 立即运行 |
| Effect 只在客户端运行 | `onMounted` / `onUnmounted`「不在服务端渲染时调用」；`onServerPrefetch` 服务端预取 | https://vuejs.org/api/composition-api-lifecycle.html（2026-09-16，逐字） | — |
| StrictMode 开发期双调 Effect | 无对应物 | https://react.dev/reference/react/StrictMode（2026-09-16） | Vue 无「模拟卸载重挂」检查；React 为未来 `<Activity>` 隐藏 / 恢复做的健壮性要求 |
| Effect 内 `setState` 触发新一轮渲染（lint 报 set-state-in-effect） | watcher 里改响应式状态是常规写法，但派生值应改用 `computed` | https://vuejs.org/guide/essentials/watchers.html（2026-09-16，摘要） | 两边同一原则：能算出来的不要存 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-10-1 | 生产 | 未标简化 | 生产简化 | Effect 手写请求被当成正当默认写法，未说明官方列出的四个缺点与生产替代（框架机制 / TanStack Query / Router loader，→ 11 / 30） | src/topics/10-effects-and-lifecycle/react/Example.tsx:269 | 网络请求是「副作用」 | :333-334 把网络请求列为 Effect「正当用法」却没有一句「生产不这么写」；官方原文称其为 very manual approach 且有 significant downsides | https://react.dev/reference/react/useEffect#what-are-good-alternatives-to-data-fetching-in-effects（逐字 "This is, however, a very manual approach and it has significant downsides"） | 七、生产环境注意 |
| R2-10-2 | 生产 | 未标简化 | 其它 | Effect 内同步 `setLoading(true)` 会命中 react-hooks 7 `recommended` 的 `set-state-in-effect`（error），课件未提该规则、多一轮 render 的代价与例外（值来自 ref） | src/topics/10-effects-and-lifecycle/react/Example.tsx:291 | setLoading(true) | 当前 eslint.config.js:35-38 只手动开了 rules-of-hooks / exhaustive-deps 所以不报；一旦按 facts-versions §F 切到 recommended 即 error；官方 Fetching data 示例也有同步 setBio(null)，取舍要讲清（见 P-10-1） | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（逐字 "Validates against calling setState synchronously in an effect, which can lead to re-renders that degrade performance."） | 六、易错点 |
| R2-10-3 | 概念 | 未讲 | 散点Hook | 依赖数组进阶三条未讲：对象 / 函数依赖导致每次 commit 重跑及三种解法；可变值 ref.current 写进依赖无效；不相关的事拆成多个 Effect | — | — | 三条都是 useEffect / lifecycle 官方页主流内容；面试第 1 问追问「ref.current 写进去有用吗」答不上 | grep0:current 写进\|数据流之外\|对象依赖\|移到组件外\|独立的同步\|不相关的事 | 二、核心概念 |
| R2-10-4 | 概念 | 未讲 | 散点Hook | 「不需要 Effect」清单缺链式 setState、初始化应用（模块顶层 / didInit）、通知父组件、订阅外部 store（useSyncExternalStore → 14） | — | — | :326-335 只列三类；官方页七类，其中订阅外部 store 直接对应 14 题 useWindowWidth 的写法 | grep0:useSyncExternalStore\|链式\|didInit | 二、核心概念 |
| R2-10-5 | 概念 | 未讲 | 散点Hook | useLayoutEffect（绘制前、阻塞绘制、量布局后同步重渲染）与 useInsertionEffect 一句都没有 | — | — | 面试第 3 问整问答不上；:25「React 只有一个 useEffect」会让学习者以为不存在 useLayoutEffect | grep0:useLayoutEffect\|useInsertionEffect | 二、核心概念 |
| R2-10-6 | 概念 | 未讲 | 服务端 | Effect 只在客户端运行、SSR 不跑；useLayoutEffect 服务端报错；didMount 模式与内容闪烁（→ 33） | — | — | 大纲主流项；RSC / SSR 概念课 33 需要本题先埋一句 | grep0:SSR\|服务端\|didMount | 七、生产环境注意 |
| R2-10-7 | 概念 | 缺标签 | 旧写法 | StrictMode 双调 Effect 未写「18.0 起」（17 及以前不双调）；useEffectEvent 未标【较新】 | src/topics/10-effects-and-lifecycle/react/Example.tsx:313; src/topics/10-effects-and-lifecycle/react/Example.tsx:222 | StrictMode：开发环境 React 会故意 | 读 17 时代老项目时看不到双跑不是「没开 StrictMode」；19.3 起 hydration 也双调【尝鲜】 | https://react.dev/blog/2022/03/29/react-v18（逐字 "React will simulate unmounting and remounting the component in development mode"，见大纲）；node_modules/@types/react/index.d.ts:1791 | 八、旧写法对照 |
| R2-10-8 | 概念 | 未讲 | 旧写法 | class 生命周期（componentDidMount / DidUpdate / WillUnmount）对照与「Effect = 三合一」错误类比未讲 | — | — | 存量项目与面试常拿 class 生命周期类比 Effect，官方明确反对这种心智；d.ts 注释本身就拿 componentDidMount 作参照 | grep0:componentDidMount\|class 组件 | 八、旧写法对照 |
| R2-10-9 | 概念 | 未讲 | Vue现行写法 | Vue 3.5 `onWatcherCleanup` 与 flush 时机（pre / post / sync ↔ React 以绘制为参照）未讲 | — | — | 课件只用回调第三参 onCleanup（vue/Example.vue:56-66）；基线 vue 3.5.42，官方 3.5 起推荐 onWatcherCleanup；两边「时机轴」参照物不同 | grep0:onWatcherCleanup\|flush\|watchPostEffect | 三、Vue 对照 |
| R2-10-10 | 小问题 | 措辞 | 绝对化 | 「在 Vue 里根本不存在 / 压根没有这个概念 / 依赖写全永远是对的」与模板残留「没有一一对应关系」9 处 | src/topics/10-effects-and-lifecycle/react/Example.tsx:21; src/topics/10-effects-and-lifecycle/react/Example.tsx:31; src/topics/10-effects-and-lifecycle/react/Example.tsx:176; src/topics/10-effects-and-lifecycle/react/Example.tsx:316; src/topics/10-effects-and-lifecycle/vue/IntervalCounter.vue:9 | 在 Vue 里根本不存在 | Vue 里把 count.value 先读进局部变量再放进定时器同样过期，「根本不存在」过强；:316 同一句重复两遍；对象依赖「写全」会无限重跑，「永远是对的」需限定 | https://react.dev/reference/react/useEffect#removing-unnecessary-object-dependencies（逐字，见大纲） | 六、易错点 |
| R2-10-11 | 小问题 | 措辞 | 交叉引用 | 新增题落点未指：数据获取替代 → 11 / 30、订阅外部 store → 14、SSR → 33、Suspense / use → 32；「Dan Abramov 文章」非官方来源 | src/topics/10-effects-and-lifecycle/react/Example.tsx:206 | Dan Abramov 专门写过一篇文章 | 现有 03 / 06 / 09 / 11 / 12 / 14 / 26 / 27 编号逐条核对无误 | https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store（逐字 "useSyncExternalStore"） | 参考 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | useEffect 的依赖数组三种写法分别什么时候跑？为什么说「不能挑选依赖」？（追问：为什么 ref 对象和 setState 可以不写进依赖？ref.current 写进去有用吗？） | 部分 | src/topics/10-effects-and-lifecycle/react/Example.tsx:6; src/topics/10-effects-and-lifecycle/react/Example.tsx:111-113; src/topics/10-effects-and-lifecycle/react/Example.tsx:209; src/topics/10-effects-and-lifecycle/react/Example.tsx:277-278 | setState 稳定身份可省略、ref.current 作依赖无效、对象依赖处理未讲 |
| 2 | cleanup 什么时候执行？为什么开发环境 Effect 会跑两次、生产会吗？（追问：怎么判断 cleanup 写对了？请求 / 定时器 / 订阅各自的 cleanup 是什么？） | 能 | src/topics/10-effects-and-lifecycle/react/Example.tsx:7-8; src/topics/10-effects-and-lifecycle/react/Example.tsx:77-78; src/topics/10-effects-and-lifecycle/react/Example.tsx:309-316; src/topics/10-effects-and-lifecycle/react/Example.tsx:321-323 | — |
| 3 | useEffect 和 useLayoutEffect 的区别？什么时候必须用后者？（追问：SSR 下为什么 useLayoutEffect 会警告，怎么处理？） | 不能 | — | useLayoutEffect、useInsertionEffect、SSR 一句都没有 |
| 4 | 在 Effect 里 fetch 有什么坑？怎么处理竞态？（追问：官方推荐的替代方案是什么，什么情况下仍可以在 Effect 里请求？） | 部分 | src/topics/10-effects-and-lifecycle/react/Example.tsx:280-284; src/topics/10-effects-and-lifecycle/react/Example.tsx:287-324 | 四个缺点、框架机制 / TanStack / loader 替代与「何时仍可用 Effect」未讲 |
| 5 | useEffect 是不是 Vue 的 onMounted？哪些场景不该用 Effect？（追问：把派生状态放在 Effect 里 setState，lint 会报哪条规则、多付出了什么？） | 部分 | src/topics/10-effects-and-lifecycle/react/Example.tsx:25-28; src/topics/10-effects-and-lifecycle/react/Example.tsx:326-335 | set-state-in-effect 规则名与「多一轮 render→commit→effect」代价未讲 |

### 11. API 请求状态

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 请求态三值枚举，「空」是 success 下的派生展示；判别联合而非多布尔（文件头承诺） | https://tanstack.com/query/v5/docs/framework/react/guides/queries | 已讲对 | src/topics/11-api-request-state/react/Example.tsx:5-7; src/topics/11-api-request-state/react/Example.tsx:24-40; src/topics/11-api-request-state/react/Example.tsx:124-128 | 命名用 loading（TanStack v5 为 pending），见 R2-11-7 |
| 主流 | empty ≠ error：文案与交互分开（文件头承诺） | 同上 | 已讲对 | src/topics/11-api-request-state/react/Example.tsx:109-110; src/topics/11-api-request-state/react/Example.tsx:124-126; src/topics/11-api-request-state/vue/Example.vue:106-107 | — |
| 主流 | 重试 = reloadFlag 进依赖让 Effect 重跑；搜同一个词也重跑（文件头承诺） | https://react.dev/learn/synchronizing-with-effects | 已讲对 | src/topics/11-api-request-state/react/Example.tsx:8; src/topics/11-api-request-state/react/Example.tsx:45-53; src/topics/11-api-request-state/react/Example.tsx:76-88 | 大纲未列此手写模式，官方无专门段落 |
| 主流 | 手写 Effect 请求标准形：cleanup 取消 / 忽略 + 切换参数重置 | https://react.dev/reference/react/useEffect#fetching-data-with-effects | 已讲对 | src/topics/11-api-request-state/react/Example.tsx:59-72 | 用 AbortController 替代官方 ignore；ignore 细讲在 27 |
| 主流 | fetch 不因 HTTP 错误 reject，必须查 response.ok 再 throw；错误类型统一 | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch（③ MDN） | 未讲 | — | R2-11-2（mockApi 直接 throw Error：src/shared/mockApi.ts:103-105） |
| 主流 | 官方对 Effect 取数的态度：四个缺点、推荐替代、「都不合适可继续用 Effect」 | https://react.dev/reference/react/useEffect#what-are-good-alternatives-to-data-fetching-in-effects | 未讲 | — | R2-11-1（:9 / :33-35 只有「真实业务多用 TanStack」） |
| 主流 | 「适用于任何 UI 库」；无框架时抽自定义 Hook 便于日后整体替换 | https://react.dev/learn/you-might-not-need-an-effect#fetching-data | 讲了但错 | src/topics/11-api-request-state/react/Example.tsx:9; src/topics/11-api-request-state/react/Example.tsx:55-56 | R2-11-3 |
| 主流 | 方案 B TanStack `useQuery` 返回字段；isLoading = isFetching && isPending（→ 30） | https://tanstack.com/query/v5/docs/framework/react/reference/useQuery | 未讲 | — | R2-11-4（:33-35 只指向 30） |
| 主流 | 重试默认：失败静默重试 3 次指数退避（服务端 0）；手写要自己做 | https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults | 未讲 | — | R2-11-4 |
| 主流 | 方案 C 路由 loader + useLoaderData；pending 用 useNavigation().state（→ 18） | https://reactrouter.com/7.18.4/start/data/data-loading；https://reactrouter.com/7.18.4/start/data/pending-ui | 未讲 | — | R2-11-4 |
| 主流 | loader 流式：返回未 await 的 promise + `<Await>` / React.use | https://reactrouter.com/7.18.4/how-to/suspense | 未讲 | — | R2-11-4 |
| 主流 | 选型判据：Data 模式 vs 声明式 + 自带 pending 抽象的数据层 | https://reactrouter.com/7.18.4/start/modes | 未讲 | — | R2-11-1 |
| 较新 | 方案 D `use(promise)` + Suspense + 错误边界；promise 须缓存；不能 try/catch（19.0 起） | https://react.dev/reference/react/use；node_modules/@types/react/index.d.ts:1973 | 未讲 | — | R2-11-5 |
| 主流 | Suspense 只被 Suspense-enabled 数据源激活，看不见 Effect 里的请求 | https://react.dev/reference/react/Suspense | 未讲 | — | R2-11-5 |
| 主流 | useSuspenseQuery 下 status / error 由 Suspense 与边界接管 | https://tanstack.com/query/v5/docs/framework/react/guides/suspense | 未讲 | — | R2-11-5 |
| 主流 | 切换参数闪 loading → `placeholderData: keepPreviousData`（→ 22） | https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries | 未讲 | — | R2-11-6（:61 每次搜索先整体换成「加载中」） |
| 主流 | StrictMode 开发期两次请求是预期，生产一次（→ 10） | https://react.dev/learn/synchronizing-with-effects#fetching-data | 未讲 | — | R2-11-9（10 题讲了，本题未指向） |
| 主流 | 错误进边界：throwOnError / use 的 rejection → 20 | https://tanstack.com/query/v5/docs/framework/react/reference/useQuery；https://react.dev/reference/react/use | 未讲 | — | R2-11-5 |
| 主流 | 依赖 / 串行请求：`enabled` 与网络瀑布 | https://tanstack.com/query/v5/docs/framework/react/guides/dependent-queries | 未讲 | — | R2-11-4 |
| 旧写法 | 无 ignore / abort 的裸 Effect 请求（竞态 + 卸载后 setState） | https://react.dev/learn/synchronizing-with-effects#fetching-data | 已讲对 | src/topics/11-api-request-state/react/Example.tsx:56; src/topics/11-api-request-state/react/Example.tsx:65; src/topics/11-api-request-state/react/Example.tsx:71 | 细讲在 27，本题却指向 10（R2-11-9） |
| 旧写法 | TanStack v4 → v5 改名（loading→pending、cacheTime→gcTime、keepPreviousData→placeholderData 等） | https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5 | 未讲 | — | R2-11-7 |
| 尝鲜 | Server Component 里 async/await 取数（→ 33） | https://react.dev/reference/react/use | 未讲 | — | R2-11-5 |
| 主流 | Effect 内同步 setState → `set-state-in-effect`（recommended 为 error） | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect | 未讲 | — | R2-11-10（:61） |
| 主流 | 同一事件两次 setState 批处理 → Effect 只重跑一次（大纲未列，→ 24） | https://react.dev/learn/queueing-a-series-of-state-updates | 已讲对 | src/topics/11-api-request-state/react/Example.tsx:76-79 | — |
| 主流 | 加载中禁用输入 / 按钮防重复提交（大纲未列，→ 19） | https://react.dev/reference/react-dom/components/form | 已讲对 | src/topics/11-api-request-state/react/Example.tsx:97-105 | 与 19 题分工应注明；19 起可用 `<form action>`（→ 31） |
| 主流 | Vue：同一判别联合放 ref 整体替换；命令式 load() + onUnmounted abort（文件头承诺） | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/11-api-request-state/vue/Example.vue:29-65 | 大纲未列 |
| 主流 | Vue：`@tanstack/vue-query` 同一 query-core | https://tanstack.com/query/v5/docs/framework/vue/quick-start | 已讲对 | src/topics/11-api-request-state/vue/Example.vue:28 | 只一句引用 → 30 |
| 主流 | Vue：官方 `useFetch` composable（watchEffect + toValue） | https://vuejs.org/guide/reusability/composables.html#async-state-example | 未讲 | — | R2-11-8 |
| 主流 | Vue：vue-router 导航前 / 导航后取数 ↔ loader；v5 数据加载器【尝鲜】 | https://router.vuejs.org/guide/advanced/data-fetching.html | 未讲 | — | R2-11-8 |
| 主流 | Vue：`<Suspense>`（async setup）↔ use + Suspense，实验性 | https://vuejs.org/guide/built-ins/suspense.html | 未讲 | — | R2-11-8 |

#### 面试 5 问

1. 一个请求组件需要哪些状态？为什么不用 `loading / error / data` 三个布尔？（追问：「空」算不算独立状态？怎么用判别联合建模？）
2. 在 `useEffect` 里 fetch 要注意什么？（追问：为什么开发环境会请求两次？`fetch` 404 会进 catch 吗？）
3. 官方为什么不推荐在 Effect 里请求数据？替代方案有哪些、各解决什么？（追问：TanStack Query 与路由 loader 能同时用吗？什么情况仍在 Effect 里请求？）
4. TanStack Query 的 `status` 和 `fetchStatus` 为什么分开？`isLoading` 与 `isPending` 的区别？（追问：默认 `staleTime`、`gcTime`、`retry` 是多少？）
5. React 19 的 `use(promise)` 怎么取数？（追问：为什么不能 `use(fetch(url))`？错误怎么处理？Suspense 为什么看不见 Effect 里的请求？）

#### 生产写法要点

- `fetch` 封装：检查 `response.ok`、统一错误类型（HTTP 错误 / 网络错误 / 取消）、超时 `AbortSignal.timeout()`（→ 27）
- 请求态用判别联合建模；错误信息脱敏后再展示；空态与错误态分开渲染
- 取消与竞态：Effect 手写必须 `ignore` 或 `AbortController`；TanStack 用 queryFn 的 `signal`（→ 27）
- 缓存 / 去重 / 重试 / 窗口聚焦重取交给 TanStack Query 或 loader，不要自己造轮子；本题演示的共用 mockApi 要标「演示简化」
- 加载态：延迟显示 spinner 或骨架屏；分页 / 筛选切换用 `placeholderData: keepPreviousData` 避免闪烁
- 类型：`queryFn` 返回类型显式声明；响应用 zod 等校验（→ 28）；`useLoaderData` 类型来自 loader 返回值
- 测试：请求组件用 MSW 或 mock `fetch`，断言三态渲染（→ 34）

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| Effect 手写 / 自定义 `useData` | composable `useFetch(url)`：`watchEffect` + `toValue(url)`，返回 `{ data, error }` refs | https://vuejs.org/guide/reusability/composables.html#async-state-example（2026-09-16，逐字） | 官方示例同样未做取消 / 竞态处理，需自行加 `onWatcherCleanup`（→ 27） |
| TanStack Query（`@tanstack/react-query`） | `@tanstack/vue-query`：同一 query-core，`useQuery` 返回 refs、`VueQueryPlugin` 安装 | node_modules/@tanstack/vue-query（已安装，行号见 30 题）；https://tanstack.com/query/v5/docs/framework/vue/quick-start（2026-09-16，摘要） | 同一缓存语义，差异只在响应式包装 |
| 路由 loader（渲染前取数） | vue-router「导航前获取」：`beforeRouteEnter` / `beforeRouteUpdate` 里取数，「用户停留在上一视图直到资源取回」；「导航后获取」：`watch(() => route.params.id, fetchData, { immediate: true })` | https://router.vuejs.org/guide/advanced/data-fetching.html（2026-09-16，逐字） | vue-router 5 的 `vue-router/experimental` 数据加载器与 loader 最接近，标【尝鲜】（facts-versions §D） |
| `use(promise)` + `<Suspense>` | Vue `<Suspense>` 等待「async `setup()` 组件（含 `<script setup>` 顶层 `await`）」与「异步组件」；`#fallback` 插槽；错误用 `onErrorCaptured` | https://vuejs.org/guide/built-ins/suspense.html（2026-09-16，逐字） | Vue 侧原话「实验性特性，不保证达到稳定，API 可能变化」；React 侧 `use` 已稳定但无框架时的数据源约定「不稳定、未文档化」 |
| `fetch` 不因 HTTP 错误 reject | 同（浏览器 API，与框架无关） | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch（2026-09-16，逐字，③ MDN） | — |
| StrictMode 双请求 | 无对应物 | https://react.dev/reference/react/StrictMode（2026-09-16） | Vue 无模拟重挂 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-11-1 | 概念 | 未讲 | 生产简化 | 官方对「在 Effect 里请求」的态度（四个缺点、推荐框架机制 / TanStack / useSWR / Router loader、何时仍可用 Effect）与路由模式选型判据未讲 | — | — | 数据获取主线题只有「真实业务多用 TanStack Query」一句（:9、:33-35），学习者答不出「为什么不推荐、替代方案各解决什么」；主线判定要靠这段 | grep0:瀑布\|waterfall\|不在服务端\|useSWR\|React Router | 二、核心概念 |
| R2-11-2 | 生产 | 未标简化 | 生产简化 | mockApi 直接 throw Error；真实 fetch 不因 404 / 500 reject，必须检查 response.ok 再 throw；错误对象类型（HTTP / 网络 / 取消）未统一 | src/topics/11-api-request-state/react/Example.tsx:62 | fetchUsers(keyword, { signal: | 未标「演示简化」；照搬到真实 fetch 时 error 分支永远不触发；:68 只把 unknown 转成 message | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch（③ MDN，逐字 "The fetch() promise only rejects when the request fails, for example, because of a badly-formed request URL or a network error."） | 七、生产环境注意 |
| R2-11-3 | 概念 | 讲错 | 其它 | 把自定义 Hook 抽象称为「半吊子抽象」，与官方「无框架时把请求逻辑移进自定义 Hook 便于日后整体替换」相反 | src/topics/11-api-request-state/react/Example.tsx:9; src/topics/11-api-request-state/react/Example.tsx:55 | 不做半吊子抽象 | 14 题正是讲自定义 Hook / composable；这句会让学习者以为「要么裸写要么上库」 | https://react.dev/learn/you-might-not-need-an-effect#fetching-data（逐字 "These issues apply to any UI library, not just React."；抽 useData 为摘要，见 11-evidence.md） | 二、核心概念 |
| R2-11-4 | 概念 | 未讲 | Router | 方案 B / C 最小形未给：useQuery 返回字段（status / fetchStatus / isPending / isLoading）、默认 retry 3 次退避、loader + useLoaderData + useNavigation().state、流式 promise + Await、依赖查询与瀑布 | — | — | 面试第 4 问整问答不上；主线题至少要给候选写法骨架并指向 30 / 18 | grep0:fetchStatus\|isPending\|useLoaderData\|useNavigation | 二、核心概念 |
| R2-11-5 | 概念 | 未讲 | 并发 | 方案 D `use(promise)` + Suspense + 错误边界（promise 须缓存、不能 try/catch）、Suspense 看不见 Effect 里的请求、useSuspenseQuery、throwOnError、RSC async/await【尝鲜】 | — | — | React 19.0 起 use 稳定（node_modules/@types/react/index.d.ts:1973）；这是「Effect 手写 vs Suspense 数据源」的分水岭，面试第 5 问答不上 | grep0:Suspense\|throwOnError\|useSuspenseQuery | 二、核心概念 |
| R2-11-6 | 生产 | 未标简化 | 性能 | 每次搜索先把整张表换成「加载中」再加载，是切换参数闪烁的现场；TanStack `placeholderData: keepPreviousData` / isPlaceholderData 与手写「保留旧 data + isRefreshing」未讲（→ 22） | src/topics/11-api-request-state/react/Example.tsx:61 | setState({ status: 'loading' }) | 官方分页指南明确「UI 在 success 与 pending 间跳动」是问题并给解法 | https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries（逐字，见大纲） | 七、生产环境注意 |
| R2-11-7 | 概念 | 未讲 | 旧写法 | TanStack v4 → v5 改名（loading→pending、isLoading→isPending、cacheTime→gcTime、keepPreviousData→placeholderData、useErrorBoundary→throwOnError、query 回调移除）未讲；本题 status 用 'loading' 与 v5 'pending' 不一致未说明 | — | — | 存量项目大量 v4 代码；对照 30 题时会困惑 loading / pending 含义 | grep0:isPending\|pending\|gcTime | 八、旧写法对照 |
| R2-11-8 | 概念 | 未讲 | Vue现行写法 | Vue 侧缺官方 `useFetch` composable（watchEffect + toValue）、vue-router 导航前 / 后取数 ↔ loader、`<Suspense>`（async setup）↔ use + Suspense、vue-router 5 数据加载器【尝鲜】 | — | — | Vue 侧只给命令式 load()；主线各候选在 Vue 里的对应物一个都没列 | grep0:composable\|watchEffect\|toValue\|beforeRouteEnter\|导航前 | 三、Vue 对照 |
| R2-11-9 | 小问题 | 措辞 | 交叉引用 | 竞态处理指向 10 而非主责题 27；StrictMode 双请求未指向 10；防重复提交（disabled）未指向 19；批处理未指向 24；`<form>` 提交未指向 31 | src/topics/11-api-request-state/react/Example.tsx:56; src/topics/11-api-request-state/react/Example.tsx:65 | 竞态处理与 10 题相同 | 现有交叉引用只有 10 / 30；27 是竞态主责题、31 是 Actions 主责题 | https://react.dev/learn/synchronizing-with-effects#fetching-data（逐字 "In development, you will see two fetches in the Network tab."） | 参考 |
| R2-11-10 | 生产 | 未标简化 | 其它 | Effect 内同步 `setState({ status: 'loading' })` 会命中 react-hooks 7 `recommended` 的 `set-state-in-effect`（error），课件未提 | src/topics/11-api-request-state/react/Example.tsx:61 | setState({ status: 'loading' }) | 当前 eslint.config.js:35-38 未启用 recommended 所以不报；切换后即 error；需讲清代价与取舍（官方 Fetching data 示例也含同步 setBio(null)，见 P-11-2） | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（逐字 "Validates against calling setState synchronously in an effect, which can lead to re-renders that degrade performance."） | 六、易错点 |
| R2-11-11 | 小问题 | 措辞 | 绝对化 | 「两边一模一样 / 完全一致」等绝对化措辞 | src/topics/11-api-request-state/react/Example.tsx:16; src/topics/11-api-request-state/vue/Example.vue:25 | 两边一模一样 | 类型定义相同成立，但 Vue 的 ref 可原地改、React 必须换引用，「一模一样」应限定为「状态类型」 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-17） | 四、关键区别 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 一个请求组件需要哪些状态？为什么不用 loading / error / data 三个布尔？（追问：「空」算不算独立状态？怎么用判别联合建模？） | 能 | src/topics/11-api-request-state/react/Example.tsx:24-40; src/topics/11-api-request-state/react/Example.tsx:109-110; src/topics/11-api-request-state/react/Example.tsx:124-128 | — |
| 2 | 在 useEffect 里 fetch 要注意什么？（追问：为什么开发环境会请求两次？fetch 404 会进 catch 吗？） | 部分 | src/topics/11-api-request-state/react/Example.tsx:59-72 | StrictMode 双请求未指向 10；fetch 不因 404 reject / response.ok 未讲 |
| 3 | 官方为什么不推荐在 Effect 里请求数据？替代方案有哪些、各解决什么？（追问：TanStack Query 与路由 loader 能同时用吗？什么情况仍在 Effect 里请求？） | 部分 | src/topics/11-api-request-state/react/Example.tsx:9; src/topics/11-api-request-state/react/Example.tsx:33-35 | 四个缺点、loader / use 替代、选型判据、「何时仍可用 Effect」全部未讲 |
| 4 | TanStack Query 的 status 和 fetchStatus 为什么分开？isLoading 与 isPending 的区别？（追问：默认 staleTime、gcTime、retry 是多少？） | 不能 | — | 本题对 TanStack 只有一句「30 题会重做」 |
| 5 | React 19 的 use(promise) 怎么取数？（追问：为什么不能 use(fetch(url))？错误怎么处理？Suspense 为什么看不见 Effect 里的请求？） | 不能 | — | use / Suspense / 错误边界一句都没有 |

### 12. useRef 与 DOM

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 承诺：用途一 DOM ref `useRef<HTMLInputElement>(null)` + `ref={inputRef}`，命令式 `focus()` | https://react.dev/learn/manipulating-the-dom-with-refs | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:30; src/topics/12-dom-ref/react/Example.tsx:52; src/topics/12-dom-ref/react/Example.tsx:71 | 文件头承诺 |
| 主流 | 承诺：用途二 跨渲染保存可变值，改 `.current` 不触发重渲染 | https://react.dev/reference/react/useRef#caveats | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:42-46; src/topics/12-dom-ref/react/Example.tsx:97-107 | 文件头承诺 |
| 主流 | 承诺：`useRef` 返回每次渲染相同的普通对象 `{ current }`，React 不追踪 | https://react.dev/reference/react/useRef | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:8; src/topics/12-dom-ref/react/Example.tsx:38-39 | 「initialValue 首轮后忽略」「内部 ≈ useState({current})」未提 → R2-12-9 |
| 主流 | 承诺：选择标准 state vs ref（需反映到界面 → state；只记录 → ref） | https://react.dev/learn/referencing-values-with-refs#differences-between-refs-and-state | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:9; src/topics/12-dom-ref/react/Example.tsx:36-41; src/topics/12-dom-ref/react/Example.tsx:109-112 | 四行对照缺「渲染期不应读写」一行 |
| 主流 | 「渲染期间不要读写 `ref.current`，初始化除外」+ lint `refs` 规则 + 懒初始化例外 | https://react.dev/reference/react/useRef；https://react.dev/reference/eslint-plugin-react-hooks/lints/refs | 缺标签 | src/topics/12-dom-ref/react/Example.tsx:81-86; src/topics/12-dom-ref/react/Example.tsx:93 | R2-12-4（演示违反且只标了一处） |
| 主流 | 何时用 ref：timeout ID、DOM、不参与 JSX 的对象；ref 是 escape hatch | https://react.dev/learn/referencing-values-with-refs#when-to-use-refs | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:36-39; src/topics/12-dom-ref/react/Example.tsx:49-51 | — |
| 主流 | DOM ref 时机：渲染期 `null`，commit 后赋值，只在事件 / effect 里访问 | https://react.dev/learn/manipulating-the-dom-with-refs#when-react-attaches-the-refs | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:25-26 | 「节点移除时置回 null」未提 |
| 主流 | `flushSync(() => setState())` 同步提交后再 `scrollIntoView` | https://react.dev/learn/manipulating-the-dom-with-refs#flushing-state-updates-synchronously-with-flush-sync | 未讲 | — | R2-12-5 |
| 主流 | 「避免修改 React 管理的 DOM」，用途限于聚焦 / 滚动 / 测量 / 浏览器 API | https://react.dev/learn/manipulating-the-dom-with-refs#best-practices-for-dom-manipulation-with-refs | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:50-51 | — |
| 主流 | ref 回调 `ref={node => …}`：19 起可返回 cleanup；不返回则以 `null` 再调一次；每次传不同函数会先 cleanup 再重建 | https://react.dev/reference/react-dom/components/common#ref-callback；https://react.dev/blog/2024/12/05/react-19#cleanup-functions-for-refs | 未讲 | — | R2-12-2（本题主责） |
| 主流 | 列表 refs：不能在 `map` 里 `useRef`；ref 回调维护 `Map`，cleanup 里 delete | https://react.dev/learn/manipulating-the-dom-with-refs#how-to-manage-a-list-of-refs-using-a-ref-callback | 未讲 | — | R2-12-2 |
| 主流 | StrictMode 开发期对 ref 回调多跑一次 setup + cleanup | https://react.dev/reference/react/StrictMode | 未讲 | — | R2-12-2 |
| 主流 | ref 作为 prop（本题主责展开）：`function MyInput({ ref })`；新组件不需要 `forwardRef`；class 的 ref 不作 prop | https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop | 缺标签 | src/topics/12-dom-ref/react/Example.tsx:28-29 | R2-12-3（仅一句且声明「不展开」） |
| 主流 | 「组件默认不暴露内部 DOM 节点」，要暴露就把 `ref` prop 转交内部元素 | https://react.dev/reference/react/useRef#i-cant-get-a-ref-to-a-custom-component | 未讲 | — | R2-12-3 |
| 主流 | `useImperativeHandle(ref, createHandle, deps?)`（本题主责）：只暴露 `focus` 等子集 | https://react.dev/reference/react/useImperativeHandle；node_modules/@types/react/index.d.ts:1800 | 未讲 | — | R2-12-1 |
| 主流 | 「不要滥用 ref：只用于无法用 props 表达的命令式行为」 | https://react.dev/reference/react/useImperativeHandle#pitfall | 未讲 | — | R2-12-1 |
| 旧写法 | `forwardRef(render)`：19 已不需要、将来弃用；React 18 项目仍必须用 | https://react.dev/reference/react/forwardRef；node_modules/@types/react/index.d.ts:1403 | 缺标签 | src/topics/12-dom-ref/react/Example.tsx:28 | R2-12-3（提到但无【旧写法】与 18 对照） |
| 旧写法 | `useRef()` 无参：19 类型要求初始值；`MutableRefObject` 并入 `RefObject` | facts-versions §B；node_modules/@types/react/index.d.ts:1737-1761 | 未讲 | — | R2-12-7（代码本身已全部传参） |
| 旧写法 | 字符串 ref / `createRef`（class）：19 移除 string refs；`element.ref` 弃用 | facts-versions §B | 未讲 | — | R2-12-7 |
| 尝鲜 | Fragment refs（19.3）一句 | facts-versions §B | 未讲 | — | R2-12-10 |
| 主流 | Vue：`useTemplateRef('key')`（3.5）为现行写法；同名 `ref(null)` 为【旧写法】 | https://vuejs.org/guide/essentials/template-refs.html；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:1563 | 缺标签 | src/topics/12-dom-ref/vue/Example.vue:26-27; src/topics/12-dom-ref/vue/Example.vue:65 | R2-12-6 |
| 主流 | Vue：挂载后才能访问，首轮为 null | https://vuejs.org/guide/essentials/template-refs.html#accessing-the-refs | 已讲对 | src/topics/12-dom-ref/vue/Example.vue:26; src/topics/12-dom-ref/vue/Example.vue:47-48 | — |
| 主流 | Vue：函数 ref `:ref="(el) => …"`，卸载时参数为 null（对应 React 19 前的 null 再调） | https://vuejs.org/guide/essentials/template-refs.html#function-refs | 未讲 | — | R2-12-2 |
| 主流 | Vue：`defineExpose` ↔ `useImperativeHandle`（方向相反：Vue 默认私有） | https://vuejs.org/guide/essentials/template-refs.html#ref-on-component；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:248 | 未讲 | — | R2-12-1 |
| 主流 | Vue：跨渲染可变值 = 普通变量 / 非响应式对象 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/12-dom-ref/vue/Example.vue:41-44 | 文件头承诺 |
| 主流 | Vue：`await nextTick()` ↔ `flushSync`（方向不同） | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing | 未讲 | — | R2-12-5 |
| 主流 | 承诺：「Vue 的 ref ≠ React 的 useRef」同名不同物；根源是组件函数每次重跑 | https://vuejs.org/guide/extras/composition-api-faq.html | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:16-19; src/topics/12-dom-ref/vue/Example.vue:39-44 | 文件头承诺；vue:103「永远不会」见 R2-12-8 |
| 主流 | 大纲未列：「渲染期读 ref 属于不纯，正式代码要展示的值应是 state」 | https://react.dev/reference/react/useRef#caveats | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:81-83; src/topics/12-dom-ref/react/Example.tsx:111 | 大纲未列 |
| 主流 | 大纲未列：与 26 题 latest ref 的分工（用途二的完整应用） | — | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:7 | 大纲未列；交叉引用成立（26:146-155） |

#### 面试 5 问

1. `useRef` 和 `useState` 的区别？什么时候该用 ref？（追问：为什么渲染期不能读写 `ref.current`？懒初始化为什么是例外？）
2. DOM ref 什么时候被赋值？为什么渲染期是 `null`？（追问：setState 之后马上 `scrollIntoView` 拿到的是旧 DOM，怎么办？）
3. React 19 之后怎么把 ref 传给自定义组件？`forwardRef` 还需要吗？（追问：class 组件呢？`useImperativeHandle` 解决什么、什么时候不该用？）
4. ref 回调函数怎么用？React 19 的 cleanup 函数改了什么？（追问：不返回 cleanup 时会发生什么？为什么 `ref={el => (x = el)}` 在 19 的 TS 下报错？）
5. 怎么给列表里每一项拿 ref？（追问：为什么不能在 `map` 里 `useRef`？StrictMode 下 ref 回调为什么跑两次？）

#### 生产写法要点

- DOM 操作限于聚焦 / 滚动 / 测量 / 第三方库挂载；不要 `ref.current.innerHTML =` 改 React 管理的内容（→ 35 XSS）
- ref 回调返回 cleanup 释放第三方实例（图表、地图、播放器）；cleanup 必须幂等（StrictMode 双调）
- 暴露句柄用 `useImperativeHandle` 限定方法集并写 `deps`；能用 props 表达就不暴露句柄
- TS：`useRef<HTMLInputElement>(null)`；组件 props 类型里 `ref?: Ref<HTMLInputElement>`（→ 28 `ComponentProps` 与 ref-as-prop）；ref 回调不要隐式返回值
- 仍在 React 18 的库 / 组件保留 `forwardRef` 并标【旧写法】，升级时用官方 codemod
- 测量布局（tooltip）用 `useLayoutEffect`（→ 10）；不要在渲染期读 `getBoundingClientRect`

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `const r = useRef<HTMLInputElement>(null)` + `<input ref={r}>` | `const r = useTemplateRef('my-input')`（3.5+）+ `<input ref="my-input">`；返回 `Readonly<ShallowRef<T \| null>>` | https://vuejs.org/guide/essentials/template-refs.html（2026-09-16，逐字）；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:1563 | 【旧写法】3.5 前：声明同名 `const input = ref(null)` |
| 渲染期 `ref.current === null`，commit 后可用 | 「只能在组件挂载后访问；首轮渲染时为 null / undefined」，在 `onMounted` 内用，或 `watchEffect` 里判空 | https://vuejs.org/guide/essentials/template-refs.html#accessing-the-refs（2026-09-16，逐字） | 时机语义一致 |
| ref 回调 `ref={node => …}` + cleanup | 函数 ref `:ref="(el) => …"`，「每次组件更新都调用」，「元素卸载时参数为 null」 | https://vuejs.org/guide/essentials/template-refs.html#function-refs（2026-09-16，逐字） | Vue 无 cleanup 返回值，靠 null 分支清理（对应 React 19 前的行为） |
| 列表 refs 用 Map | `v-for` 内 `ref` 得到数组（挂载后填充，「不保证与源数组顺序一致」） | https://vuejs.org/guide/essentials/template-refs.html#refs-inside-v-for（2026-09-16，逐字） | — |
| `useImperativeHandle` 限定暴露面 | `defineExpose({ … })`：「`<script setup>` 组件默认私有」，须在 `await` 之前调用 | https://vuejs.org/guide/essentials/template-refs.html#ref-on-component（2026-09-16，逐字）；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:248 | 方向相反：React 默认暴露 DOM 需显式收窄；Vue 默认全私有需显式暴露 |
| ref 存可变值、不触发渲染 | 普通变量 / 非响应式对象（不 `ref()` 即可）；需要响应式时用 `ref` / `shallowRef` | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，摘要） | Vue 里「不触发渲染的可变值」就是普通 JS 变量 |
| `flushSync` 后操作 DOM | `await nextTick()`「DOM 更新不是同步的……等待下一 tick」 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing（2026-09-16，逐字） | 方向不同：React 强制同步提交，Vue 等待异步刷新 |
| TS 类型 `useRef<HTMLInputElement>(null)` | 「vue-tsc 会根据 ref 属性所在元素 / 组件自动推断 `input.value` 类型」 | https://vuejs.org/guide/essentials/template-refs.html（2026-09-16，逐字） | — |
| StrictMode 双调 ref 回调 | 无对应物 | https://react.dev/reference/react/StrictMode（2026-09-16） | Vue 无模拟重挂检查 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-12-1 | 概念 | 未讲 | 散点Hook | `useImperativeHandle`（本题主责）、「不滥用句柄」与 Vue `defineExpose` 对照全缺 | — | — | 课程地图把 useImperativeHandle 归本题主责，30 题中无其它落点；面试第 3 问追问答不上 | grep0:useImperativeHandle\|defineExpose | 二、核心概念；三、Vue 对照 |
| R2-12-2 | 概念 | 未讲 | 散点Hook | ref 回调与 React 19 cleanup（本题主责）、不返回则以 null 再调、列表 refs 用 Map、StrictMode 双调、Vue 函数 ref 对照 | — | — | 课件只有 `ref={inputRef}` 对象写法；19 新行为、列表 refs 与 cleanup 幂等要求全缺（面试第 4、5 问） | grep0:cleanup\|清理函数\|:ref=\|Map[(] | 二、核心概念；六、易错点 |
| R2-12-3 | 概念 | 缺标签 | 旧写法 | ref 作为 prop 只有一句且声明「不展开」，02 题同样声明「不展开」→ 无人展开；`forwardRef` 未标【旧写法】、无 React 18 对照；「组件默认不暴露 DOM」未讲 | src/topics/12-dom-ref/react/Example.tsx:28-29 | 不展开 ref 透传 | 大纲定本题主责展开（02 只作引用）；src/topics/02-props/react/Example.tsx:118-120 反过来指向本题「不展开」，形成互推 | https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop（逐字「In future versions we will deprecate and remove forwardRef.」，facts-versions §A） | 二、核心概念；八、旧写法对照 |
| R2-12-4 | 生产 | 未标简化 | 散点Hook | 演示在渲染期读 `ref.current` 两处，切换 `recommended` 后命中 `react-hooks/refs`（error）；:93 处无任何说明；懒初始化例外与规则名未讲 | src/topics/12-dom-ref/react/Example.tsx:86; src/topics/12-dom-ref/react/Example.tsx:93 | {countRef.current} | 实测 recommended 预设于 :86、:93 报 `refs`「Cannot access refs during render」；:81-83 只为 lastKeywordRef 标了「为演示而为之」 | node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:18236-18238（`refs`: not reading/writing during render）；https://react.dev/reference/react/useRef（大纲逐字「渲染期间不要读或写 ref.current，初始化除外」） | 六、易错点；七、生产环境注意 |
| R2-12-5 | 概念 | 未讲 | 其它 | `flushSync` 让 DOM 同步更新后再 `scrollIntoView`；Vue `await nextTick()` 对照 | — | — | 面试第 2 问追问「setState 后马上 scrollIntoView 拿到旧 DOM」答不上 | grep0:flushSync\|nextTick | 五、常见追问；三、Vue 对照 |
| R2-12-6 | 概念 | 缺标签 | Vue现行写法 | Vue 侧代码仍用同名 `ref(null)` + `ref="inputEl"`，`useTemplateRef`（3.5）只在括号里一句、未标现行 / 旧写法 | src/topics/12-dom-ref/vue/Example.vue:26 | Vue 3.5 另有 useTemplateRef | 课程地图把 useTemplateRef 归本题；基线 vue 3.5.42 应以它为主、同名 ref 标【旧写法】 | https://vuejs.org/guide/essentials/template-refs.html（大纲逐字）；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:1563 | 三、Vue 对照；八、旧写法对照 |
| R2-12-7 | 概念 | 未讲 | TS19 | React 19 类型 / 移除项对照：`useRef()` 无参不通过类型检查、`MutableRefObject` 并入 `RefObject`、string refs 移除、`element.ref` 弃用 | — | — | 代码全部传了初始值但没解释 19 起为什么必须传；18 → 19 差异是面试常问 | grep0:MutableRefObject\|createRef\|字符串 ref\|string ref\|element\.ref | 八、旧写法对照 |
| R2-12-8 | 概念 | 措辞 | 绝对化 | 「Vue 的 ref …永远不会给你『改了不更新』的体验」过于绝对（`shallowRef` 深层改动、`markRaw` 对象、解构 reactive 都会「改了不更新」） | src/topics/12-dom-ref/vue/Example.vue:103 | 永远不会给你「改了不更新」的体验 | 与 26 题大纲「Vue 侧同样有失去响应式连接的坑」口径不一致 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive（26 题大纲逐字「会失去响应式连接」） | 四、关键区别 |
| R2-12-9 | 概念 | 未讲 | 其它 | 加分点：`initialValue` 首轮后被忽略、「useRef 概念上 = useState({current})[0]」解释为何跨渲染同一对象、懒初始化 `if (ref.current === null)` 例外 | — | — | 面试第 1 问追问「懒初始化为什么是例外」答不上 | grep0:initialValue\|首轮\|懒初始化\|useState[(][{] | 二、核心概念；五、常见追问 |
| R2-12-10 | 小问题 | 缺标签 | 其它 | 无成熟度标签：ref-as-prop 未标 19.0 起【主流】、Fragment refs（19.3）【尝鲜】一句缺失、useTemplateRef 缺 3.5 版本标签 | — | — | 规格要求逐知识点标注【主流】【较新】【尝鲜】【旧写法】 | grep0:【主流】\|【较新】\|【尝鲜】\|【旧写法】\|Fragment | 九、新动向；文件头 |
| R2-12-11 | 小问题 | 措辞 | 其它 | 模板残留「没有一一对应关系」4 处，其中 :41 / vue:34 贴在「选择题是 React 特有的」之后属机械套用 | src/topics/12-dom-ref/react/Example.tsx:13; src/topics/12-dom-ref/react/Example.tsx:41; src/topics/12-dom-ref/vue/Example.vue:14; src/topics/12-dom-ref/vue/Example.vue:34 | 没有一一对应关系 | 规格 §5-H 模板残留 | course-map §6-H | 三、Vue 对照 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | `useRef` 和 `useState` 的区别？什么时候该用 ref？（追问：为什么渲染期不能读写 `ref.current`？懒初始化为什么是例外？） | 部分 | src/topics/12-dom-ref/react/Example.tsx:9; src/topics/12-dom-ref/react/Example.tsx:36-41; src/topics/12-dom-ref/react/Example.tsx:81-83 | 追问「懒初始化例外」无内容；lint `refs` 规则未提 |
| 2 | DOM ref 什么时候被赋值？为什么渲染期是 `null`？（追问：setState 之后马上 `scrollIntoView` 拿到的是旧 DOM，怎么办？） | 部分 | src/topics/12-dom-ref/react/Example.tsx:25-26 | `flushSync` 与卸载置 null 未讲 |
| 3 | React 19 之后怎么把 ref 传给自定义组件？`forwardRef` 还需要吗？（追问：class 组件呢？`useImperativeHandle` 解决什么、什么时候不该用？） | 部分 | src/topics/12-dom-ref/react/Example.tsx:28-29 | 只有一句「不再需要 forwardRef」；class 组件、`useImperativeHandle`、默认不暴露 DOM 全无 |
| 4 | ref 回调函数怎么用？React 19 的 cleanup 函数改了什么？（追问：不返回 cleanup 时会发生什么？为什么 `ref={el => (x = el)}` 在 19 的 TS 下报错？） | 不能 | — | ref 回调完全未讲 |
| 5 | 怎么给列表里每一项拿 ref？（追问：为什么不能在 `map` 里 `useRef`？StrictMode 下 ref 回调为什么跑两次？） | 不能 | — | 列表 refs、Map 写法、StrictMode 双调全未讲 |

### 13. children 与组件组合

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 标签之间的 JSX 进入 `children` prop，类型 ReactNode，就是普通 prop（文件头承诺） | https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children + https://react.dev/reference/react-dom/components/common#children | 已讲对 | src/topics/13-slots-and-children/react/Example.tsx:5; src/topics/13-slots-and-children/react/Example.tsx:29-30; src/topics/13-slots-and-children/react/Example.tsx:112-116 | — |
| 主流 | 「具名插槽」= 任意 prop 传 JSX（文件头承诺） | https://react.dev/learn/javascript-in-jsx-with-curly-braces + https://react.dev/learn/passing-props-to-a-component | 已讲对 | src/topics/13-slots-and-children/react/Example.tsx:6; src/topics/13-slots-and-children/react/Example.tsx:32-40; src/topics/13-slots-and-children/react/Example.tsx:94-110 | — |
| 主流 | 「作用域插槽」= render prop，子组件用自己的数据调用（文件头承诺） | https://react.dev/reference/react/Children#alternatives | 已讲对 | src/topics/13-slots-and-children/react/Example.tsx:7; src/topics/13-slots-and-children/react/Example.tsx:53-77; src/topics/13-slots-and-children/react/Example.tsx:121-130 | — |
| 主流 | `children` 也可以是函数 | https://react.dev/reference/react/Children#alternatives | 未讲 | — | R2-13-4 |
| 主流 | 组合减少 prop drilling："Extract components and pass JSX as children to them"；先组合再 context（指向 15） | https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context | 未讲 | — | R2-13-1 |
| 主流 | 组合与性能：wrapper 自己 setState 时 children 不重渲染（指向 17） | https://react.dev/reference/react/useMemo#should-you-add-usememo-everywhere | 未讲 | — | R2-13-1 |
| 主流 | `{...props}` 展开要克制、多用 children（指向 02） | https://react.dev/learn/passing-props-to-a-component | 未讲 | — | R2-13-1 |
| 主流 | TS：`children: ReactNode`（文件头承诺） | https://react.dev/learn/typescript + node_modules/@types/react/index.d.ts:436-449 | 已讲对 | src/topics/13-slots-and-children/react/Example.tsx:5; src/topics/13-slots-and-children/react/Example.tsx:30; src/topics/13-slots-and-children/react/Example.tsx:36-39; src/topics/13-slots-and-children/react/Example.tsx:64 | — |
| 主流 | TS：`ReactNode` vs `ReactElement`；`PropsWithChildren<P>`；render prop 类型显式声明（主责 28） | https://react.dev/learn/typescript + node_modules/@types/react/index.d.ts:1423, 325-332 | 未讲 | — | R2-13-4 |
| 主流 | `children` 结构不透明；`Children.count/map/toArray` "uncommon and can lead to fragile code"；不进入元素内部与 Fragment | https://react.dev/reference/react/Children | 未讲 | — | R2-13-2 |
| 主流 | `cloneElement` 注入 props："makes it harder to trace the data flow"；替代 render prop / context / Hook | https://react.dev/reference/react/cloneElement | 未讲 | — | R2-13-3 |
| 主流 | 替代 `Children` 的三种 API 设计：多个子组件 / 对象数组 prop / render prop | https://react.dev/reference/react/Children#alternatives | 未讲 | — | R2-13-2 |
| 主流 | 组合 ≠ 在父组件内定义子组件（指向 01） | https://react.dev/learn/your-first-component | 未讲 | — | R2-13-5 |
| 主流 | `isValidElement`；元素只有 `type` / `props` / `key` | node_modules/@types/react/index.d.ts:722, 325-332 | 未讲 | — | R2-13-2 |
| 主流 | 组合组件转发 ref：19 起 ref 是普通 prop，`{ ref, ...rest }` 透传（主责 02 / 12） | https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-13-5 |
| 较新 | React Compiler 下组合仍是首选；`static-components` 规则禁止渲染期创建组件 | facts-versions F（eslint-plugin-react-hooks 7.1.1） | 未讲 | — | R2-13-11 |
| 旧写法 | `React.FC<Props>` 隐式 `children`（现已移除，须显式声明） | node_modules/@types/react/index.d.ts:1060-1061 | 未讲 | — | R2-13-6 |
| 旧写法 | HOC `withX(Component)` 与 `cloneElement` 注入的复用模式 → 自定义 Hook + 组合（指向 14） | https://react.dev/reference/react/cloneElement#alternatives | 未讲 | — | R2-13-6 |
| 旧写法 | `forwardRef` 包装组合组件以转发 ref | https://react.dev/reference/react/forwardRef | 未讲 | — | R2-13-5 |
| 主流 | 可选 `footer` 判空 ≈ Vue `$slots.footer`（文件头承诺） | https://vuejs.org/guide/components/slots.html | 已讲对 | src/topics/13-slots-and-children/react/Example.tsx:13; src/topics/13-slots-and-children/react/Example.tsx:38-39; src/topics/13-slots-and-children/react/Example.tsx:47-48; src/topics/13-slots-and-children/vue/Card.vue:18-24 | `footer &&` 的 0 陷阱见 R2-13-9 |
| 主流 | Render scope：插槽内容 / JSX 只访问父作用域 | https://vuejs.org/guide/components/slots.html | 已讲对 | src/topics/13-slots-and-children/react/Example.tsx:91-93; src/topics/13-slots-and-children/vue/Example.vue:39-41 | — |
| 主流 | 列表壳负责 key，每项由 render prop 决定 | https://react.dev/learn/rendering-lists | 已讲对 | src/topics/13-slots-and-children/react/Example.tsx:54-57; src/topics/13-slots-and-children/react/Example.tsx:70-74; src/topics/13-slots-and-children/vue/UserList.vue:13-22 | 大纲未列 |
| 主流 | Vue：默认 / 具名 / 作用域插槽（文件头承诺） | https://vuejs.org/guide/components/slots.html | 已讲对 | src/topics/13-slots-and-children/react/Example.tsx:11-12; src/topics/13-slots-and-children/vue/Example.vue:42-99; src/topics/13-slots-and-children/vue/Card.vue:12-26; src/topics/13-slots-and-children/vue/UserList.vue:20 | — |
| 主流 | Vue：`<slot>` fallback 内容 | https://vuejs.org/guide/components/slots.html | 未讲 | — | R2-13-7 |
| 主流 | Vue：动态插槽名 `#[name]`；混用时默认插槽须显式 `<template #default>` | https://vuejs.org/guide/components/slots.html | 未讲 | — | R2-13-7 |
| 主流 | Vue：`defineSlots`（3.3+）/ `useSlots()` 类型化 | https://vuejs.org/api/sfc-script-setup.html + node_modules/@vue/runtime-core/dist/runtime-core.d.ts:290, 381 | 未讲 | — | R2-13-7 |
| 主流 | Vue：renderless 组件 vs composable（"Composables are more efficient than renderless components"，指向 14） | https://vuejs.org/guide/components/slots.html#renderless-components | 未讲 | — | R2-13-7 |
| 主流 | Vue：插槽本身是函数，渲染函数 / JSX 里可作为值传递 | https://vuejs.org/guide/extras/render-function.html | 讲了但错 | src/topics/13-slots-and-children/react/Example.tsx:16-18; src/topics/13-slots-and-children/vue/Example.vue:17-19; src/topics/13-slots-and-children/vue/Example.vue:82-83 | R2-13-8：说成「本质差异，Vue 模板做不到」 |
| 主流 | 「最重要的区别」：JSX 是值，无需插槽专门概念（文件头承诺） | https://react.dev/learn/passing-props-to-a-component | 已讲对 | src/topics/13-slots-and-children/react/Example.tsx:15-18 | 绝对化措辞见 R2-13-8 |

#### 面试 5 问

1. React 怎么实现 Vue 的具名插槽和作用域插槽？（追问：具名 = 传 JSX 的 prop，作用域 = render prop——`children` 是函数时类型怎么写？子组件什么时候调用它？）
2. `children` 的类型是什么？`ReactNode` 和 `ReactElement` 的区别？（追问：`children` 可能是数组、`null`、字符串，怎么安全处理？为什么官方说 `Children` API "fragile"？）
3. 为什么说「组合」能减少 context 和 memo 的使用？（追问：`<Layout>{children}</Layout>` 里 Layout 自己 setState 时 children 会重渲染吗？为什么？）
4. `cloneElement` 用来做什么？现在为什么不推荐？（追问：替代方案有哪些？数据流为什么难追踪？）
5. Vue 作用域插槽的 render scope 规则在 React 对应什么？（追问：插槽内容只能访问父作用域；render prop 的参数由谁提供？renderless 组件 vs 自定义 Hook / composable）

#### 生产写法要点

- 组件 API 优先「多个子组件」（`<Card.Header>`）或具名 JSX prop，不解析 `children` 结构；`Children` / `cloneElement` 只为读懂第三方旧代码。
- render prop 参数类型显式声明；列表 render prop 每项都会调用，配合 `memo` 子组件时注意引用稳定（17）。
- 布局 / 容器组件一律接受 `children`，不要把数据 props 穿过不使用它的层（passing-data-deeply）。
- 处理 `children` 为空的 fallback：`children ?? <Default />`，注意 `0` / `''` 边界（05）。
- 逻辑复用优先自定义 Hook（14），不用 renderless 组件或 HOC；演示里若用 `cloneElement` 注入 props 要标「演示简化 / 不推荐」。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `{children}` | `<slot />` 默认插槽；fallback 写在 `<slot>` 标签内 | https://vuejs.org/guide/components/slots.html（2026-09-16，逐字） | React 的 fallback 用 `children ?? <Default/>` |
| 具名 JSX prop `header={<h1/>}` | 具名插槽 `<template #header>`；动态名 `#[dynamicSlotName]`；混用时默认插槽须显式 `<template #default>` | https://vuejs.org/guide/components/slots.html（2026-09-16，逐字） | React 里 JSX 是值，不需要专门语法 |
| render prop `renderItem={(item) => ...}` / 函数 `children` | 作用域插槽 `<slot name="item" v-bind="item" />` + `#item="{ body, username }"` 解构 | https://vuejs.org/guide/components/slots.html（2026-09-16，逐字） | 都是子组件提供数据、父组件决定渲染 |
| 父组件闭包读取自己的 state | Render scope："Slot content has access only to the parent component's data scope" | https://vuejs.org/guide/components/slots.html（2026-09-16，逐字） | 一致 |
| `children != null` 判断后再渲染容器 | `$slots.header` + `v-if` 条件插槽 | https://vuejs.org/guide/components/slots.html（2026-09-16，逐字） | — |
| TS `children?: ReactNode` / `(x: T) => ReactNode` | `defineSlots<{ default(props: { msg: string }): any }>()`（3.3+）；`useSlots()` | https://vuejs.org/api/sfc-script-setup.html（2026-09-16）+ `node_modules/@vue/runtime-core/dist/runtime-core.d.ts:290, 381` | — |
| 自定义 Hook 代替 renderless 组件 | "Composables are more efficient than renderless components" | https://vuejs.org/guide/components/slots.html#renderless-components（2026-09-16，逐字） | 指向 14 |
| `Children` / `cloneElement` | 无直接对应；`useSlots()` 拿到插槽函数，`h()` 渲染函数里手动调用 | https://vuejs.org/guide/extras/render-function.html（2026-09-16，摘要） | 两边都不作主线 |
| 组合避免 prop drilling；深层用 context | 同样用 slot；深层用 `provide` / `inject` | https://react.dev/learn/passing-data-deeply-with-context（2026-09-16） | 指向 15 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-13-1 | 严重 | 未讲 | 其它 | 组合的两大理由全无：① 减少 prop drilling——"Extract components and pass JSX as children to them"，先试组合再考虑 context（指向 15）；② 性能——wrapper 自己 setState 时 children 元素引用不变、不重渲染（指向 17）；顺带「`{...props}` 用得多说明该拆组件并传 children」（02） | — | — | 文件头承诺「组件组合是 React 复用 UI 的主要手段」，却只演示了怎么写、没讲为什么；大纲面试 3 问整问答不上 | grep0:drilling\|Context\|context\|重渲染\|re-render\|memo | 二、核心概念 |
| R2-13-2 | 概念 | 未讲 | 其它 | `children` 结构不透明（单节点 / 数组 / null）；`Children.count/map/toArray` 与 `isValidElement` 可遍历但 "uncommon and can lead to fragile code"，遍历不进入元素内部与 Fragment；替代方案：多个子组件、对象数组 prop、render prop | — | — | 大纲面试 2 问追问；读第三方旧组件库必遇 | grep0:Children\.\|Children API\|toArray\|isValidElement\|fragile | 五、常见追问与回答要点 |
| R2-13-3 | 概念 | 未讲 | 其它 | `cloneElement(element, props)` 注入 props："makes it harder to trace the data flow"；替代：render prop、context、自定义 Hook | — | — | 大纲面试 4 问整问答不上 | grep0:cloneElement | 五、常见追问与回答要点 |
| R2-13-4 | 概念 | 未讲 | 其它 | `children` 也可以是函数（function as children）；TS：`ReactNode`（"a union of all the possible types"）vs `ReactElement`（只元素）、`PropsWithChildren<P>`、render prop 参数类型显式声明（主责 28） | — | — | 类型见 node_modules/@types/react/index.d.ts:1423, 325-332；大纲面试 1 / 2 问追问 | grep0:ReactElement\|PropsWithChildren\|函数 children\|children 也可以\|28 | 二、核心概念 |
| R2-13-5 | 概念 | 未讲 | 其它 | 组合组件转发 ref：19 起 ref 是普通 prop，包装组件直接 `{ ref, ...rest }` 透传，`forwardRef`【旧写法】不再必需（主责 02 / 12）；组合 ≠ 在父组件内定义子组件——每次渲染重建（指向 01） | — | — | Card / UserList 这类包装组件在真实项目里几乎都要透传 ref | grep0:forwardRef\|ref 透传\|嵌套定义\|内部定义 | 六、易错点 |
| R2-13-6 | 概念 | 未讲 | 旧写法 | 八段缺失：`React.FC<Props>` 隐式 `children`（当前 `FunctionComponent<P>` 签名 `(props: P)` 无隐式 children，须显式声明）；HOC `withX(Component)` 与 `cloneElement` 注入的复用模式 → 现用自定义 Hook + 组合（指向 14） | — | — | 存量代码里 `React.FC` 与 HOC 极常见；移除版本见 P-13-1 | grep0:React.FC\|FC<\|HOC\|高阶组件\|withX | 八、旧写法对照 |
| R2-13-7 | 概念 | 未讲 | 其它 | Vue 侧细节缺：`<slot>` fallback 内容（React 用 `children ?? <Default/>`）；动态插槽名 `#[name]`；混用具名与默认时默认插槽须显式 `<template #default>`；`defineSlots`（3.3+）/ `useSlots()` 类型化；renderless 组件 vs composable（"Composables are more efficient than renderless components"，指向 14） | — | — | 大纲面试 5 问追问 renderless vs 自定义 Hook 答不上 | grep0:fallback\|后备\|defineSlots\|useSlots\|renderless\|动态插槽\|#default | 三、Vue 对照 |
| R2-13-8 | 概念 | 措辞 | 绝对化 | 「这是两个框架的本质差异，Vue 模板做不到」把「模板 vs JSX 的默认路径」讲成框架能力差异：Vue 的插槽本身就是函数，渲染函数 / JSX 里以 `h(Card, null, { header: () => … })` 作为值传递、`useSlots()` 可当函数调用；应限定为「模板语法下」 | src/topics/13-slots-and-children/react/Example.tsx:18; src/topics/13-slots-and-children/react/Example.tsx:16-17; src/topics/13-slots-and-children/vue/Example.vue:17-19; src/topics/13-slots-and-children/vue/Example.vue:82-83 | 这是两个框架的本质差异，Vue 模板做不到 | 规格 §5 C「把模式差异讲成框架差异」；「根本不需要」亦绝对化 | https://vuejs.org/guide/extras/render-function.html（2026-09-17，逐字 "Instead of an array, we need to pass either a slot function, or an object of slot functions." / "Each slot on the slots object is a function that returns an array of vnodes"） | 四、关键区别 |
| R2-13-9 | 小问题 | 讲错 | 其它 | `{footer && …}` 对 `ReactNode` 类型判空有 0 陷阱：`footer={0}` 会在容器外渲染 "0"，应 `footer != null &&` 或 `footer ?? null`（05 已讲） | src/topics/13-slots-and-children/react/Example.tsx:48 | footer && <div className="row"> | 与 05 的教学自相矛盾；演示传 JSX 不触发，但作为「组件库写法」示范不严谨 | node_modules/@types/react/index.d.ts:436-449（ReactNode 含 number） | 六、易错点 |
| R2-13-10 | 生产 | 未讲 | 生产简化 | 生产段缺：组件 API 优先复合组件 `<Card.Header>` 或具名 JSX prop，不解析 children 结构；render prop 每项都会调用，配合 `memo` 子项注意引用稳定（17）；布局 / 容器组件一律接受 children；逻辑复用优先自定义 Hook（14）而非 renderless / HOC | — | — | 七段整段缺失 | grep0:Card\.Header\|compound\|复合组件\|自定义 Hook | 七、生产环境注意 |
| R2-13-11 | 概念 | 未讲 | 性能 | 九段缺失：React Compiler 下组合仍是首选（memo 页原则不变）；eslint-plugin-react-hooks 7.1.1 `recommended` 的 `static-components` 规则禁止渲染期创建组件【较新】 | — | — | Compiler 不启用但要讲，一句指向 17 | grep0:Compiler\|static-components | 九、新动向 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | React 怎么实现 Vue 的具名插槽和作用域插槽？（`children` 是函数时类型怎么写？子组件什么时候调用它？） | 能 | src/topics/13-slots-and-children/react/Example.tsx:6-7; src/topics/13-slots-and-children/react/Example.tsx:32-33; src/topics/13-slots-and-children/react/Example.tsx:53-77 | `children` 作函数未提，主答案完整 |
| 2 | `children` 的类型是什么？`ReactNode` 和 `ReactElement` 的区别？（数组 / null / 字符串怎么安全处理？为什么官方说 `Children` API fragile？） | 部分 | src/topics/13-slots-and-children/react/Example.tsx:5; src/topics/13-slots-and-children/react/Example.tsx:30; src/topics/13-slots-and-children/react/Example.tsx:36-39 | 缺 ReactElement 对比、Children API 及其脆弱原因 |
| 3 | 为什么说「组合」能减少 context 和 memo 的使用？（`<Layout>{children}</Layout>` 里 Layout setState 时 children 会重渲染吗？） | 不能 | — | prop drilling 与性能理由全无 |
| 4 | `cloneElement` 用来做什么？现在为什么不推荐？（替代方案？数据流为什么难追踪？） | 不能 | — | 一字未提 |
| 5 | Vue 作用域插槽的 render scope 规则在 React 对应什么？（插槽内容只能访问父作用域；render prop 参数由谁提供；renderless vs 自定义 Hook / composable） | 部分 | src/topics/13-slots-and-children/react/Example.tsx:91-93; src/topics/13-slots-and-children/react/Example.tsx:56-60; src/topics/13-slots-and-children/vue/Example.vue:39-41 | 缺 renderless 组件 vs composable / 自定义 Hook |

### 14. 自定义 Hook

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 承诺：自定义 Hook = `use` 开头、内部调 Hook 的普通函数；共享逻辑不共享 state，每次调用独立 | https://react.dev/learn/reusing-logic-with-custom-hooks#custom-hooks-let-you-share-stateful-logic-not-state-itself | 已讲对 | src/topics/14-composable-and-custom-hook/react/Example.tsx:5; src/topics/14-composable-and-custom-hook/react/Example.tsx:33-36; src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:5-6 | 文件头承诺 |
| 主流 | 承诺：`useState + useEffect` 是订阅外部系统的「标准组合」 | https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store | 讲了但错 | src/topics/14-composable-and-custom-hook/react/Example.tsx:6; src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:18-29 | R2-14-1【待主线判定】 |
| 主流 | `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`（本题主责）：订阅第三方 store / 浏览器 API | https://react.dev/reference/react/useSyncExternalStore；node_modules/@types/react/index.d.ts:1924 | 未讲 | — | R2-14-1 |
| 主流 | 何时用：能用 useState / useReducer 就用内置；主要用于集成非 React 代码 | https://react.dev/reference/react/useSyncExternalStore#subscribing-to-an-external-store | 未讲 | — | R2-14-1 |
| 主流 | 与 `useEffect + setState` 的区别：官方「删除 Effect 改用 useSyncExternalStore」；18 起支持并发读（tearing） | https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store；https://react.dev/blog/2022/03/29/react-v18 | 未讲 | — | R2-14-1 |
| 主流 | `getSnapshot` 稳定性（Object.is 相同、不可变快照）与 `subscribe` 稳定性（模块级 / useCallback） | https://react.dev/reference/react/useSyncExternalStore#caveats | 未讲 | — | R2-14-1 |
| 主流 | `getServerSnapshot`：只在 SSR / hydration 用，省略则服务端报错 | https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering | 未讲 | — | R2-14-2 |
| 主流 | 迁移示范 `useOnlineStatus`：Hook 内部换实现，组件一行不改 | https://react.dev/learn/reusing-logic-with-custom-hooks#custom-hooks-help-you-migrate-to-better-patterns | 未讲 | — | R2-14-1 |
| 主流 | 生态引用：TanStack Query / Zustand 内部用 useSyncExternalStore（→ 30 / 16） | node_modules/@tanstack/react-query/build/modern/useBaseQuery.js:30；node_modules/zustand/esm/react.mjs:6 | 未讲 | — | R2-14-1 |
| 主流 | 承诺：Hooks 规则——只在顶层调用；React 按调用顺序对应状态槽 | https://react.dev/reference/rules/rules-of-hooks；https://react.dev/reference/eslint-plugin-react-hooks/lints/rules-of-hooks | 已讲对 | src/topics/14-composable-and-custom-hook/react/Example.tsx:7-8; src/topics/14-composable-and-custom-hook/react/Example.tsx:45-58; src/topics/14-composable-and-custom-hook/react/useDebouncedValue.ts:59-60 | 文件头承诺；清单不全见 R2-14-7 |
| 主流 | 规则清单：不在条件 return 之后 / 事件处理器 / class / useMemo 等回调 / try-catch-finally 内；报错「Rendered fewer/more hooks」；`use()` 例外 | https://react.dev/reference/rules/rules-of-hooks | 未讲 | — | R2-14-7 |
| 主流 | 承诺：`use` 前缀是 lint 识别 Hook 的硬规则 | https://react.dev/learn/reusing-logic-with-custom-hooks | 已讲对 | src/topics/14-composable-and-custom-hook/react/Example.tsx:9; src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:7-8 | 「不调 Hook 的函数不要加 use」未提 → R2-14-7 |
| 主流 | 「Hook 里的代码每次重渲染重跑；响应式值在 Hook 间传递并保持最新」 | https://react.dev/learn/reusing-logic-with-custom-hooks#passing-reactive-values-between-hooks | 已讲对 | src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:31-34; src/topics/14-composable-and-custom-hook/react/useDebouncedValue.ts:67-69; src/topics/14-composable-and-custom-hook/react/Example.tsx:100-101 | — |
| 主流 | 不要造生命周期 Hook（useMount / useEffectOnce）；不必为每一点重复抽 Hook | https://react.dev/learn/reusing-logic-with-custom-hooks#when-to-use-custom-hooks | 未讲 | — | R2-14-6 |
| 主流 | 承诺：手写 `useDebouncedValue`：Effect + setTimeout + cleanup clearTimeout，依赖 `[value, delay]`；请求依赖防抖后的值 | https://react.dev/learn/synchronizing-with-effects#step-3-add-cleanup-if-needed | 已讲对 | src/topics/14-composable-and-custom-hook/react/useDebouncedValue.ts:19-69; src/topics/14-composable-and-custom-hook/react/Example.tsx:99-127 | 文件头承诺；未标「自实现」见 R2-14-11 |
| 主流 | 自定义 Hook 接收事件回调时用 `useEffectEvent` 包装（→ 26） | https://react.dev/learn/reusing-logic-with-custom-hooks#passing-event-handlers-to-custom-hooks | 未讲 | — | R2-14-4 |
| 主流 | 返回的函数建议包 `useCallback`（→ 17） | https://react.dev/reference/react/useCallback#optimizing-a-custom-hook | 未讲 | — | R2-14-5 |
| 主流 | `useDebugValue(value, format?)` | https://react.dev/reference/react/useDebugValue；node_modules/@types/react/index.d.ts:1833 | 未讲 | — | R2-14-5 |
| 主流 | 「React 会提供内置数据获取吗」→ `use(promise)`（→ 11 / 32） | https://react.dev/learn/reusing-logic-with-custom-hooks | 未讲 | — | R2-14-7 |
| 旧写法 | `useEffect + setState` 手写订阅（18 前唯一方式）→ 应标【旧写法】并提 tearing | https://react.dev/blog/2022/03/29/react-v18 | 缺标签 | src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:21-29 | R2-14-1 |
| 旧写法 | React 17 用 `use-sync-external-store/shim` | 待核实（P-14-1） | 未讲 | — | R2-14-1（一句） |
| 主流 | 承诺：组件函数每次重跑，定时器 id 只能留在 effect 闭包或 useRef（12 题） | https://react.dev/learn/synchronizing-with-effects | 已讲对 | src/topics/14-composable-and-custom-hook/react/Example.tsx:12-13; src/topics/14-composable-and-custom-hook/react/useDebouncedValue.ts:36-47 | 文件头承诺 |
| 主流 | 承诺 Vue：composable（use 前缀社区约定）、`onMounted` / `onUnmounted` 挂卸监听、`watch` + 定时器 + `onUnmounted` 防抖 | https://vuejs.org/guide/reusability/composables.html | 已讲对 | src/topics/14-composable-and-custom-hook/vue/useWindowWidth.ts:4-26; src/topics/14-composable-and-custom-hook/vue/useDebouncedValue.ts:26-43 | 文件头承诺 |
| 主流 | 承诺 Vue：composable 无顶层限制但生命周期钩子须在 setup 同步期注册；setup 只跑一次、返回 Ref 容器 | https://vuejs.org/guide/reusability/composables.html#usage-restrictions；https://vuejs.org/guide/extras/composition-api-faq.html#comparison-with-react-hooks | 已讲对 | src/topics/14-composable-and-custom-hook/react/Example.tsx:20-25; src/topics/14-composable-and-custom-hook/vue/Example.vue:34-37; src/topics/14-composable-and-custom-hook/vue/useWindowWidth.ts:20-23 | 文件头承诺；同一句重复 4 处见 R2-14-9 |
| 主流 | Vue：composable 入参可为 ref / getter，用 `toValue()`（3.3+）规范化 | https://vuejs.org/guide/reusability/composables.html#input-arguments | 未讲 | — | R2-14-8 |
| 主流 | Vue：SSR 时 DOM 副作用放 onMounted；`useSyncExternalStore` 的 Vue 对应 = ref + onMounted 订阅（无 tearing） | https://vuejs.org/guide/reusability/composables.html#side-effects；https://vuejs.org/guide/reusability/composables.html#mouse-tracker-example | 未讲 | — | R2-14-2 |
| 主流 | 大纲未列：防抖 vs 节流一句；工业界现状（lodash / ahooks / TanStack Query / VueUse） | — | 已讲对 | src/topics/14-composable-and-custom-hook/react/useDebouncedValue.ts:49-57; src/topics/14-composable-and-custom-hook/vue/useDebouncedValue.ts:45-47 | 大纲未列；VueUse `useWindowSize` 未提 |
| 主流 | 大纲未列：防抖之后仍需 AbortController，两层 cleanup 各管各的 | — | 已讲对 | src/topics/14-composable-and-custom-hook/react/Example.tsx:103-109; src/topics/14-composable-and-custom-hook/vue/DebouncedUserSearch.vue:32-41 | 大纲未列；交叉引用 10 / 27 成立 |
| 主流 | 大纲未列：`useState(() => window.innerWidth)` 惰性初始化 | https://react.dev/reference/react/useState | 已讲对 | src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:13-16 | 大纲未列；SSR 不安全见 R2-14-2 |

#### 面试 5 问

1. 什么是自定义 Hook？它共享的是什么、不共享什么？（追问：两个组件调同一个 Hook，state 会互通吗？为什么名字必须 use 开头？）
2. Hooks 规则是什么、为什么有这些规则？（追问：为什么不能在条件里调用？`use()` 为什么可以在条件里？）
3. 手写一个 `useDebouncedValue`；它和直接在 Effect 里 setTimeout 有什么区别？（追问：依赖数组写什么？为什么要 cleanup？）
4. `useSyncExternalStore` 是什么、和 `useEffect + setState` 订阅有什么区别？（追问：`getSnapshot` 为什么必须返回稳定值？服务端快照是什么？）
5. 为什么官方不建议写 `useMount` / `useEffectOnce`？（追问：自定义 Hook 里接收回调该怎么处理依赖？返回的函数要不要 `useCallback`？）

#### 生产写法要点

- Hook 返回值用对象（可扩展）或元组（模仿 useState），返回函数包 `useCallback`；回调参数用 `useEffectEvent` 包装
- 订阅浏览器 API（在线状态、媒体查询、`localStorage` 事件）统一用 `useSyncExternalStore` 并提供 `getServerSnapshot`（SSR / RSC 项目必需）
- `getSnapshot` 返回原始值或缓存对象；不要每次 `new`；`subscribe` 定义在模块级
- 防抖 Hook 要处理 `delay` 变化与卸载 cleanup；输入即搜的请求还要取消（→ 27）
- 通用 Hook 加 `useDebugValue`；类型上用泛型 `useDebouncedValue<T>(value: T, delay: number): T`
- 测试：`renderHook` + fake timers（→ 34）

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| 自定义 Hook（use 前缀，共享有状态逻辑） | composable：「利用 Composition API 封装并复用有状态逻辑的函数」，camelCase + `use` 前缀；返回「非响应式普通对象包多个 ref」以便解构 | https://vuejs.org/guide/reusability/composables.html（2026-09-16，逐字） | 两边都「共享逻辑不共享状态」 |
| Rules of Hooks（顶层、顺序敏感、不可条件） | 「composable 只能在 `<script setup>` 或 `setup()` 里同步调用」（也可在 `onMounted` 内）；「不受调用顺序限制，可以条件调用」 | https://vuejs.org/guide/reusability/composables.html#usage-restrictions（2026-09-16，逐字）；https://vuejs.org/guide/extras/composition-api-faq.html（2026-09-16，逐字） | 限制原因相同（找到当前组件实例），但 Vue 无顺序约束 |
| Hook 代码每次渲染重跑 | 「`setup()` 只执行一次」 | https://vuejs.org/guide/extras/composition-api-faq.html#comparison-with-react-hooks（2026-09-16，逐字） | 这是 Hook 需要依赖数组、Vue 不需要的根本原因 |
| Hook 参数是当次渲染的值 | composable 参数可为 ref / getter，用 `toValue()`（3.3+）规范化；「若据此创建响应式副作用，要 `watch` 该 ref 或在 `watchEffect` 内调用 `toValue()`」 | https://vuejs.org/guide/reusability/composables.html#input-arguments（2026-09-16，逐字） | — |
| Effect cleanup / SSR 下 Effect 不跑 | 「在 `onUnmounted` 清理副作用」；「SSR 时 DOM 相关副作用放 `onMounted` 等挂载后钩子」 | https://vuejs.org/guide/reusability/composables.html#side-effects（2026-09-16，逐字） | — |
| `useSyncExternalStore` 订阅外部 store | 无专用 API：`useMouse` 示例用 `onMounted(addEventListener)` + `onUnmounted(removeEventListener)` 写入 ref | https://vuejs.org/guide/reusability/composables.html#mouse-tracker-example（2026-09-16，逐字） | Vue 的 ref 本身就是「外部可变源 + 订阅」，无 tearing 问题 |
| `useDebugValue` | 无对应物 | https://react.dev/reference/react/useDebugValue（2026-09-16） | Vue DevTools 直接显示 setup 返回的 refs |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-14-1 | 严重 | 讲错 | 散点Hook | 【待主线判定】文件头把 `useState + useEffect` 讲成订阅外部系统的「标准组合」，官方在该场景明确「删除 Effect 改用 useSyncExternalStore」；本题主责的 `useSyncExternalStore` 全目录 0 次（定位 / 两类场景 / getSnapshot 与 subscribe 稳定性 / tearing / 迁移示范 / 生态引用） | src/topics/14-composable-and-custom-hook/react/Example.tsx:6; src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:18 | 是订阅外部系统的标准组合 | `useWindowWidth` 与官方 `useOnlineStatus` 同属「浏览器 API 订阅」；无论主线选 Effect 还是 uSES，官方首选写法必须出现并标注，`useEffect + setState` 至少标「18 前写法」 | https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store（逐字「React has a purpose-built Hook for subscribing to an external store that is preferred instead. Delete the Effect and replace it with a call to useSyncExternalStore」）；https://react.dev/blog/2022/03/29/react-v18（逐字「It removes the need for useEffect when implementing subscriptions to external data sources」）；node_modules/@types/react/index.d.ts:1924 | 二、核心概念；八、旧写法对照 |
| R2-14-2 | 生产 | 未标简化 | 服务端 | `useWindowWidth` 直接读 `window.innerWidth`，无「仅客户端」说明、无 `getServerSnapshot` / SSR 对照；Vue 侧也未提 SSR 时放 onMounted | src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:16 | window.innerWidth | 33 题讲 SSR / RSC 后学习者会把这个 Hook 搬进服务端渲染的组件；官方：uSES 省略 getServerSnapshot「服务端渲染报错」 | https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering（大纲逐字「省略则服务端渲染报错」）；https://vuejs.org/guide/reusability/composables.html#side-effects（大纲逐字） | 七、生产环境注意 |
| R2-14-3 | 生产 | 未标简化 | 其它 | 切换 `recommended` 后 `setLoading(true)` 命中 `react-hooks/set-state-in-effect`（error）；课件未说明这是演示写法及生产替代 | src/topics/14-composable-and-custom-hook/react/Example.tsx:114 | setLoading(true) | 实测报「Calling setState synchronously within an effect can trigger cascading renders」；生产替代：请求状态交给 TanStack Query（→ 30），或 loading 派生自「请求中的 key ≠ 已加载的 key」 | node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:18141-18145（`set-state-in-effect` 描述，Recommended / Error） | 七、生产环境注意 |
| R2-14-4 | 概念 | 未讲 | 散点Hook | 自定义 Hook 接收事件回调时用 `useEffectEvent`（19.2 起【较新】）包一层再放进 Effect、去掉回调依赖（→ 26） | — | — | 面试第 5 问追问「Hook 里接收回调怎么处理依赖」答不上 | grep0:useEffectEvent | 二、核心概念；五、常见追问 |
| R2-14-5 | 概念 | 未讲 | 散点Hook | 返回值约定：返回函数建议包 `useCallback`；`useDebugValue` 给共享 Hook 加 DevTools 标签；对象 vs 元组返回 | — | — | 大纲主流加分点；面试第 5 问追问 | grep0:useCallback\|useDebugValue | 二、核心概念；七、生产环境注意 |
| R2-14-6 | 概念 | 未讲 | 其它 | 官方反模式：不要造 `useMount` / `useEffectOnce` / `useUpdateEffect`（绕过依赖检查）；「不必为每一点重复抽 Hook」 | — | — | 面试第 5 问主问答不上 | grep0:useMount\|useEffectOnce\|useUpdateEffect | 六、易错点 |
| R2-14-7 | 概念 | 未讲 | 其它 | Hooks 规则清单不全（条件 return 之后、try/catch、class、传给 useMemo 的回调）；报错文案「Rendered more/fewer hooks than expected」；`use()` 可条件调用的例外；「不调 Hook 的函数不要加 use」 | — | — | 面试第 2 问追问「use() 为什么可以在条件里」答不上 | grep0:Rendered more\|Rendered fewer\|try\b\|条件 return\|\buse[(] | 二、核心概念；五、常见追问 |
| R2-14-8 | 概念 | 未讲 | Vue现行写法 | composable 入参 `MaybeRefOrGetter` + `toValue()`（3.3+）规范化；VueUse `useWindowSize` 一句对照（防抖侧已提 VueUse） | — | — | vue/useDebouncedValue.ts 只接受 `Ref<T>`，传普通值或 getter 会报类型错 | grep0:toValue\|MaybeRefOrGetter\|useWindowSize | 三、Vue 对照 |
| R2-14-9 | 小问题 | 措辞 | 其它 | 「两个约束不同源，没有一一对应关系」同一句逐字重复 4 处，模板残留共 6 处 | src/topics/14-composable-and-custom-hook/react/Example.tsx:22; src/topics/14-composable-and-custom-hook/react/Example.tsx:58; src/topics/14-composable-and-custom-hook/vue/Example.vue:23; src/topics/14-composable-and-custom-hook/vue/Example.vue:37; src/topics/14-composable-and-custom-hook/vue/useDebouncedValue.ts:25; src/topics/14-composable-and-custom-hook/vue/useWindowWidth.ts:23 | 没有一一对应关系 | 规格 §5-H 模板残留 | course-map §6-H | 三、Vue 对照 |
| R2-14-10 | 小问题 | 措辞 | 绝对化 | 「依赖 []：订阅一次即可，永远不需要重跑」与同文件 :26-27「StrictMode 会跑两遍」自相矛盾；「调用姿势与 React 完全一致」忽略了 Hooks 规则 | src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:19; src/topics/14-composable-and-custom-hook/vue/DebouncedUserSearch.vue:18 | 永远不需要重跑 | 收敛为「依赖不变就不重跑；StrictMode 开发期除外」 | https://react.dev/reference/react/StrictMode | 六、易错点 |
| R2-14-11 | 小问题 | 缺标签 | 其它 | 无成熟度标签；`useDebouncedValue` 未标「自实现（react.dev 无官方防抖 Hook）」；`useSyncExternalStore` 应标 18 起【主流】 | — | — | 规格标签体系 | grep0:【主流】\|【较新】\|【尝鲜】\|【旧写法】 | 文件头 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 什么是自定义 Hook？它共享的是什么、不共享什么？（追问：两个组件调同一个 Hook，state 会互通吗？为什么名字必须 use 开头？） | 能 | src/topics/14-composable-and-custom-hook/react/Example.tsx:5; src/topics/14-composable-and-custom-hook/react/Example.tsx:33-36; src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:5-8 | — |
| 2 | Hooks 规则是什么、为什么有这些规则？（追问：为什么不能在条件里调用？`use()` 为什么可以在条件里？） | 部分 | src/topics/14-composable-and-custom-hook/react/Example.tsx:48-58 | 规则清单不全；`use()` 例外未讲 |
| 3 | 手写一个 `useDebouncedValue`；它和直接在 Effect 里 setTimeout 有什么区别？（追问：依赖数组写什么？为什么要 cleanup？） | 能 | src/topics/14-composable-and-custom-hook/react/useDebouncedValue.ts:19-65; src/topics/14-composable-and-custom-hook/react/Example.tsx:99-127 | — |
| 4 | `useSyncExternalStore` 是什么、和 `useEffect + setState` 订阅有什么区别？（追问：`getSnapshot` 为什么必须返回稳定值？服务端快照是什么？） | 不能 | — | 完全未讲 |
| 5 | 为什么官方不建议写 `useMount` / `useEffectOnce`？（追问：自定义 Hook 里接收回调该怎么处理依赖？返回的函数要不要 `useCallback`？） | 不能 | — | 反模式、`useEffectEvent`、`useCallback` 全未讲 |

### 15. Context 跨层传值

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | prop drilling 问题定义；Context 穿过任意中间层 | https://react.dev/learn/passing-data-deeply-with-context | 已讲对 | src/topics/15-context/react/Example.tsx:5; src/topics/15-context/react/Example.tsx:74-89 | 文件头承诺 |
| 主流 | 三步 createContext → useContext → `<Ctx value>`；签名 | https://react.dev/learn/passing-data-deeply-with-context；node_modules/@types/react/index.d.ts:716-720,1682 | 已讲对 | src/topics/15-context/react/Example.tsx:49; src/topics/15-context/react/Example.tsx:61; src/topics/15-context/react/Example.tsx:143 | 文件头承诺 |
| 主流 | `<Ctx value>` 直接当 Provider（19 起）；旧版 `.Provider` | https://react.dev/reference/react/createContext | 缺标签 | src/topics/15-context/react/Example.tsx:141-143 | R2-15-6（缺【旧写法】标签与版本） |
| 主流 | defaultValue 只在无 Provider 时生效、静态不变；无合理默认传 null | https://react.dev/reference/react/createContext | 未讲 | — | R2-15-3（:43-45 只讲为何 null） |
| 主流 | 让 context 随时间变：Provider 组件放 state 作 value | https://react.dev/reference/react/useContext | 已讲对 | src/topics/15-context/react/Example.tsx:118-119; src/topics/15-context/react/Example.tsx:143 | 文件头承诺 |
| 主流 | 重渲染规则：value 变（Object.is）→ 所有消费者重渲染 | https://react.dev/reference/react/useContext | 已讲对 | src/topics/15-context/react/Example.tsx:11-12; src/topics/15-context/react/Example.tsx:20-21; src/topics/15-context/react/Example.tsx:127-132 | 文件头承诺 |
| 主流 | memo 挡不住 context；修法是拆组件、把值当 prop 传给 memo 子组件 | https://react.dev/reference/react/memo | 讲了但错 | src/topics/15-context/react/Example.tsx:133-134 | R2-15-1 |
| 主流 | useMemo + useCallback 稳定 value | https://react.dev/reference/react/useContext | 已讲对 | src/topics/15-context/react/Example.tsx:121-138 | 文件头承诺 |
| 主流 | 拆 state / dispatch 两个 context；Provider + useX 收进一个模块 | https://react.dev/learn/scaling-up-with-reducer-and-context | 未讲 | — | R2-15-4（:134 仅「按变化频率拆分」一语） |
| 主流 | 查找上方最近 Provider；嵌套 Provider 局部覆盖 | https://react.dev/reference/react/useContext | 未讲 | — | R2-15-3 |
| 主流 | 用之前先 props、再抽组件传 JSX 作 children | https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context | 未讲 | — | R2-15-5 |
| 主流 | 适用场景四类：主题 / 当前用户 / 路由 / reducer + context | https://react.dev/learn/passing-data-deeply-with-context | 已讲对 | src/topics/15-context/react/Example.tsx:9-10 | 路由与 reducer + context 未列，并入 R2-15-4 |
| 主流 | TS：`createContext<T \| null>(null)` + `useX()` 抛错 | https://react.dev/learn/typescript | 已讲对 | src/topics/15-context/react/Example.tsx:42-66 | 文件头承诺；讲得最充分 |
| 主流 | 坑：重复模块导致 provide / read 不是同一对象；undefined 多为漏 Provider / 漏 value | https://react.dev/reference/react/useContext | 未讲 | — | 并入 R2-15-3 |
| 主流 | `use(Context)`：签名、可条件 / 循环 / early return 后调用、仍须在组件 / Hook 内、Server Components 不支持、19.0 起 | node_modules/@types/react/index.d.ts:1971-1973；https://react.dev/reference/react/use | 未讲 | — | R2-15-2（盲点主责题） |
| 较新 | 存量项目仍用 `.Provider`；官方称将来弃用 `.Provider` | https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-15-6 |
| 尝鲜 | 19.3：`<Context>` 可在 Server Components 里渲染 | facts-versions B | 未讲 | — | R2-15-6 |
| 旧写法 | `<Ctx.Consumer>` render prop；class `static contextType` | https://react.dev/reference/react/createContext | 未讲 | — | R2-15-6 |
| 旧写法 | Legacy Context（contextTypes / getChildContext）19.0 移除 | facts-versions B | 未讲 | — | R2-15-6 |
| 主流 | Vue：provide / inject + `InjectionKey<T>` | https://vuejs.org/guide/components/provide-inject.html；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:994-997 | 已讲对 | src/topics/15-context/vue/theme.ts:4-18; src/topics/15-context/vue/Example.vue:45 | 文件头承诺 |
| 主流 | Vue：`inject(key, default)` / 工厂形式；`app.provide()` 应用级 | https://vuejs.org/guide/components/provide-inject.html | 未讲 | — | R2-15-7 |
| 主流 | Vue：provide `ref` 属性级更新；`readonly` 防子改 | https://vuejs.org/guide/components/provide-inject.html | 已讲对 | src/topics/15-context/vue/Example.vue:39-45; src/topics/15-context/vue/theme.ts:13-14 | 文件头承诺 |
| 主流 | Vue：`useTheme()` composable + throw | https://vuejs.org/guide/typescript/composition-api.html | 已讲对 | src/topics/15-context/vue/theme.ts:26-37 | 文件头承诺 |
| 主流 | Vue：inject 只能在 setup 同步阶段调用 vs `use(Context)` 可条件调用 | https://vuejs.org/api/composition-api-dependency-injection.html（摘要） | 未讲 | — | R2-15-7 |
| 主流 | 从注入对象解构 `ref` 不丢响应（reactive 才需 toRefs） | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/15-context/vue/ThemedCard.vue:10-11 | 大纲未列 |

#### 面试 5 问

1. Context 解决什么问题、不解决什么问题？（追问：官方说用 context 之前先试哪两招；Context 是「全局状态管理」吗？）
2. Provider 的 `value` 变了，哪些组件会重渲染？`memo` 能挡住吗？（追问：`value={{ user, setUser }}` 每次渲染都是新对象，怎么修？）
3. React 19 里 `<Ctx value>` 和 `<Ctx.Provider value>` 有什么区别？（追问：`use(Ctx)` 和 `useContext(Ctx)` 的区别是什么，什么场景只能用 `use`？）
4. `createContext` 的默认值什么时候生效？为什么 TS 里常写 `createContext<T | null>(null)`？（追问：怎么让消费者不用到处判 null？）
5. 为什么官方示例把 state 和 dispatch 拆成两个 context？（追问：这和 Zustand 的 selector 订阅比，重渲染粒度差在哪？）

#### 生产写法要点

- 演示的主题切换是「低频、全局、值小」的典型场景；高频更新（输入框每次击键、滚动位置）不要走 context，会让所有消费者重渲染。
- Provider 封装成组件并只接收 `children`：`children` 元素由上层创建、引用不变，不随 Provider 内部 state 更新而重渲染（原文位置见待核实）。
- `useX()` 自定义 Hook 里做 null 检查并 throw，错误信息写明「must be used within XProvider」；测试时用 wrapper 提供 Provider（34）。
- value 用 `useMemo` 包、回调用 `useCallback`；或直接把「读写分离」做成两个 context；再往上就换 store（16）。
- 多 Provider 嵌套时抽一个 `AppProviders` 组件；SSR / RSC 场景 context 只在客户端组件里可用（33）。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `createContext` + `<Ctx value>` + `useContext` | `provide(key, value)` + `inject(key)`；`app.provide()` 为应用级 | https://vuejs.org/guide/components/provide-inject.html（2026-09-16，逐字）；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:994-997（①） | Vue 用 key 查找（string / Symbol），React 用 context 对象身份 |
| 默认值 `createContext(default)` | `inject(key, default)`；工厂形式 `inject(key, () => new X(), true)` | 同上（逐字） | 一致；Vue 默认值在没有 provider 时返回 `undefined`（类型 `T \| undefined`） |
| TS：`createContext<T \| null>(null)` + 检查 | `InjectionKey<T>`：`const key = Symbol() as InjectionKey<string>`；string key 时是 `unknown` 需 `inject<string>()` | https://vuejs.org/guide/typescript/composition-api.html（2026-09-16，逐字「Typing Provide / Inject」） | Vue 用 Symbol 键携带类型，React 用 context 对象泛型 |
| value 随 state 变 → 所有消费者重渲染 | provide 一个 `ref`「will be injected as-is and will not be automatically unwrapped」，只有读了 `.value` 的组件精确更新 | https://vuejs.org/guide/components/provide-inject.html（2026-09-16，逐字） | Vue 无「memo 挡不住 context」问题，因为依赖追踪到属性级 |
| 拆 state / dispatch 两个 context | 「provide a function responsible for mutating the state」，把 `{ location, updateLocation }` 一起 provide；`readonly(count)` 防子组件改 | 同上（逐字「Working with Reactivity」） | Vue 建议「mutations 留在 provider 内」，与 React 拆 dispatch 思路同源 |
| `use(Ctx)` 可条件调用 | `inject()` 也必须在 `setup()` 同步阶段调用，无条件调用版本 | https://vuejs.org/api/composition-api-dependency-injection.html（未抓取，摘要） | Vue 没有「Hooks 规则」，但 inject 依赖当前实例，条件调用可行、异步后不行 |
| Context 用作路由 / 主题 / 当前用户 | Vue Router / Pinia 内部同样用 `app.provide` 注入 | https://vuejs.org/guide/components/provide-inject.html（2026-09-16，摘要） | 一致 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-15-1 | 严重 | 讲错 | 性能 | 把「消费组件配合 React.memo」列为 Context 性能优化的面试标准答案 | src/topics/15-context/react/Example.tsx:133-134 | 消费组件配合 React.memo | 官方明确 memo 只与 props 有关，用了 context 的 memo 组件在 context 变化时照样重渲染；正确修法是「拆组件」——外层读 context、把值当 prop 传给 memo 子组件。文件头承诺的「重渲染问题」核心点讲反 | https://react.dev/reference/react/memo（逐字「Even when a component is memoized, it will still re-render when a context that it's using changes. Memoization only has to do with props that are passed to the component from its parent.」） | 二、核心概念 / 六、易错点 |
| R2-15-2 | 概念 | 未讲 | 散点Hook | `use(Context)` 全部未讲（本题为盲点主责）：签名 `use<T>(usable: Usable<T>): T`、可在条件 / 循环 / early return 后调用、仍须在组件或 Hook 内、Server Components 不支持、19.0 起 | — | — | course-map §2 指定 15 主责；面试问 3 追问直接考；主流（19.0，2024-12） | grep0:条件调用\|early return\|提前 return\|Usable | 二、核心概念 |
| R2-15-3 | 概念 | 未讲 | 其它 | defaultValue 语义（只在树上无 Provider 时生效、静态不变）、useContext 只找「上方最近的 Provider」、嵌套 Provider 局部覆盖、重复模块 / 漏 value 排错 | — | — | :43-45 只说明为何给 null，没说默认值何时生效；面试问 4 主问答不全 | grep0:最近的 Provider\|嵌套\|覆盖\|never changes\|静态 | 二、核心概念 / 六、易错点 |
| R2-15-4 | 概念 | 未讲 | 其它 | 拆 state / dispatch（或 setter）两个 context、Provider + useX 收进一个模块；官方四类场景中的「路由」「reducer + context 管理 state」 | — | — | :134 只有「按变化频率拆分」六个字；面试问 5 整问未覆盖；scaling-up 教程是官方「Context 做状态管理」的上限写法（→29） | grep0:dispatch\|两个 Context\|读写分离\|useReducer | 二、核心概念 / 五、常见追问与回答要点 |
| R2-15-5 | 概念 | 未讲 | 其它 | 「Before you use context」：先传 props，再抽组件把 JSX 当 children 传，两者不行才 context | — | — | MiddleLayer 已用 children（:82-88）却没点破这正是官方第二招；面试问 1 追问答不出 | grep0:Start by passing\|先试\|先用 props\|JSX 作为 children\|传 JSX | 二、核心概念 |
| R2-15-6 | 概念 | 缺标签 | 旧写法 | `.Provider` 未标【旧写法】且未注明 19.0 起可省、官方将弃用；`<Ctx.Consumer>` render prop、class `static contextType`、Legacy Context 19 移除、19.3 RSC 内可渲染 `<Context>`【尝鲜】均未列 | src/topics/15-context/react/Example.tsx:141 | React 18 及更早写 <ThemeContext.Provider | 八 / 九段素材缺失；规格要求旧写法移到对照段并注明版本 | https://react.dev/reference/react/createContext（逐字「Starting in React 19, you can render `<SomeContext>` as a provider. In older versions of React, use `<SomeContext.Provider>`」）；https://react.dev/blog/2024/12/05/react-19（逐字「In future versions we will deprecate `<Context.Provider>`」） | 八、旧写法对照 / 九、新动向 |
| R2-15-7 | 概念 | 未讲 | Vue现行写法 | Vue 对照缺：`inject(key, default)` / 工厂形式第三参 `true`、`app.provide()` 应用级、inject 必须在 setup 同步阶段调用（与 `use(Context)` 可条件调用对照）、string key 时需 `inject<T>()` | — | — | 大纲 Vue 对照 7 行只落地 4 行 | grep0:app\.provide\|工厂\|同步阶段\|inject 的第二 | 三、Vue 对照 |
| R2-15-8 | 生产 | 未标简化 | 生产简化 | Provider 直接写在 Example 里，未组件化为 `ThemeProvider({ children })`（children 元素由上层创建，Provider 内 state 变化不会重渲染它们）；未提 AppProviders 聚合、测试 wrapper 提供 Provider（→34）、高频值不走 context 的替代（拆 context / store） | src/topics/15-context/react/Example.tsx:143 | <ThemeContext value={value}> | 演示未标简化；真实项目 Provider / useX 同模块导出、Context 对象不导出（:56 已提原则但代码没这么做） | https://react.dev/learn/scaling-up-with-reducer-and-context（逐字：TasksProvider + useTasks / useTasksDispatch 收进一个文件） | 七、生产环境注意 |
| R2-15-9 | 小问题 | 措辞 | 绝对化 | 模板残留「没有一一对应关系」；「根本不存在这个问题」「组件永远不直接 useContext」 | src/topics/15-context/react/Example.tsx:23; src/topics/15-context/vue/Example.vue:24; src/topics/15-context/react/Example.tsx:136; src/topics/15-context/react/Example.tsx:52 | 两边的更新粒度模型没有一一对应关系 | 规格 §5 H；这里两边对应关系明确（Object.is 引用 vs 属性级依赖追踪），应直接写对照 | course-map §6 H | 四、关键区别 |
| R2-15-10 | 小问题 | 措辞 | 交叉引用 | 只指向 16；应加 13（children 组合）、17（memo 边界）、29（reducer + context）、33（RSC 里 context 只在 client）、34（测试 wrapper） | src/topics/15-context/react/Example.tsx:9-10 | 高频复杂共享状态见 16 题 Zustand | 大纲版本说明与生产要点的指向未落地 | course-map §1 | 参考 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | Context 解决什么、不解决什么？用之前先试哪两招？是「全局状态管理」吗？ | 部分 | src/topics/15-context/react/Example.tsx:5-10; src/topics/15-context/react/Example.tsx:74-89 | 「先 props、再 children」两招未讲 |
| 2 | value 变了哪些组件重渲染？memo 能挡吗？`value={{ user, setUser }}` 怎么修？ | 部分 | src/topics/15-context/react/Example.tsx:11-12; src/topics/15-context/react/Example.tsx:127-138 | memo 边界讲反（R2-15-1） |
| 3 | `<Ctx value>` 和 `.Provider` 区别？`use(Ctx)` 和 `useContext` 区别、什么场景只能用 use？ | 部分 | src/topics/15-context/react/Example.tsx:141-143 | use(Context) 未讲 |
| 4 | defaultValue 何时生效？为何 `createContext<T \| null>(null)`？怎么让消费者不判 null？ | 能 | src/topics/15-context/react/Example.tsx:42-66 | 「只在无 Provider 时生效、静态」未明说但可推出 |
| 5 | 为什么官方把 state 和 dispatch 拆成两个 context？和 Zustand selector 比粒度差在哪？ | 不能 | src/topics/15-context/react/Example.tsx:134 | 只有「按变化频率拆分」一语，无原因、无对比 |

### 16. 全局状态（Zustand）

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 先分类再选工具：服务端数据 / URL / 表单草稿 / 客户端全局状态 | https://react.dev/learn/passing-data-deeply-with-context | 已讲对 | src/topics/16-global-state/react/cartStore.ts:9-12; src/topics/16-global-state/react/Example.tsx:14-15 | 服务端已分；URL / 表单缺 → R2-16-9 |
| 主流 | 三条路线官方定位：Context 内置第三选择 / Zustand「small, fast, and scalable bearbones」/ RTK「official, opinionated, batteries-included」 | https://zustand.docs.pmnd.rs/learn/getting-started/introduction；https://redux-toolkit.js.org/ | 讲了但错 | src/topics/16-global-state/react/Example.tsx:12-13; src/topics/16-global-state/react/cartStore.ts:4-7 | R2-16-3【待主线判定】 |
| 主流 | 何时 Context 够 / 何时上 store（「Why zustand over context」三条） | https://react.dev/reference/react/useContext；node_modules/zustand/README.md:66-70 | 已讲对 | src/topics/16-global-state/react/cartStore.ts:5-6; src/topics/16-global-state/react/Example.tsx:12-13 | 官方三条未引用 |
| 主流 | `create<T>()((set, get) => ...)`；store 即 Hook；`set` 浅合并；`replace: true` | node_modules/zustand/react.d.ts:9-13；node_modules/zustand/vanilla.d.ts:1-8；node_modules/zustand/README.md:131 | 已讲对 | src/topics/16-global-state/react/cartStore.ts:29-43 | `replace: true` 未讲 → R2-16-4 |
| 主流 | 无 Provider；selector 选原子值最稳 | https://zustand.docs.pmnd.rs/learn/getting-started/introduction | 已讲对 | src/topics/16-global-state/react/Example.tsx:5-8; src/topics/16-global-state/react/Example.tsx:45-54; src/topics/16-global-state/react/Example.tsx:74-81 | 文件头承诺 |
| 主流 | Object.is 判变；selector 返回新对象 → `useShallow`；自定义 equalityFn → `createWithEqualityFn` | https://zustand.docs.pmnd.rs/learn/guides/prevent-rerenders-with-use-shallow；node_modules/zustand/react/shallow.d.ts:1；node_modules/zustand/traditional.d.ts:13 | 未讲 | — | R2-16-1（Object.is 已讲 :49-50，反面情形与修法无） |
| 主流 | 底层 `useSyncExternalStore`；`subscribe` 组件外监听 | node_modules/zustand/react.js:8；node_modules/zustand/vanilla.d.ts:9-14 | 未讲 | — | R2-16-2 |
| 主流 | TS 双括号原因（T 不变型 / 无部分推断）；`combine` 免类型 | https://zustand.docs.pmnd.rs/learn/guides/advanced-typescript；node_modules/zustand/README.md:469 | 已讲对 | src/topics/16-global-state/react/cartStore.ts:29-32 | 解释为「部分泛型参数无法只指定一个」与官方一致；`combine` 未提 |
| 主流 | actions 放 store；异步 action；`get()` 读当前值；slices 模式 | node_modules/zustand/README.md:142-166 | 已讲对 | src/topics/16-global-state/react/cartStore.ts:17-27; src/topics/16-global-state/react/cartStore.ts:87 | 异步 action 与 slices 未讲 → R2-16-5 |
| 主流 | 中间件 devtools / persist / subscribeWithSelector / combine / immer | node_modules/zustand/middleware.d.ts:1-6 | 未讲 | — | R2-16-4 |
| 主流 | `createStore` + Context 注入（按 props 初始化 / SSR 每请求实例） | node_modules/zustand/README.md:441-465 | 未讲 | — | R2-16-6 |
| 主流 | RTK 对照：configureStore / createSlice（Immer）/ createAsyncThunk / RTK Query；`useSelector` / `useDispatch` | https://redux-toolkit.js.org/introduction/getting-started | 未讲 | — | R2-16-3【待主线判定】 |
| 主流 | Redux 何时值得（三条）+「You Might Not Need Redux」 | https://redux.js.org/introduction/getting-started | 未讲 | — | R2-16-3 |
| 主流 | 不该进 store 的：服务端缓存 / URL / 局部瞬态；store 内仍不可变 | node_modules/zustand/README.md:269-291 | 已讲对 | src/topics/16-global-state/react/cartStore.ts:9-12; src/topics/16-global-state/react/cartStore.ts:40-43 | URL 缺 → R2-16-9 |
| 主流 | 测试：`getState` / `setState` / `getInitialState` 读写重置 | node_modules/zustand/vanilla.d.ts:9-14 | 未讲 | — | R2-16-2 |
| 较新 | React Compiler 下 selector / useShallow 仍需要（推论） | https://react.dev/reference/react/memo | 未讲 | — | 并入 R2-16-1 一句；P-16-2 |
| 尝鲜 | `unstable_ssrSafe` 中间件 | node_modules/zustand/middleware.d.ts:6 | 未讲 | — | 九段一句 |
| 旧写法 | Redux 手写 store / combineReducers / connect HOC | https://redux-toolkit.js.org/ | 未讲 | — | R2-16-7 |
| 旧写法 | zustand v4 `useStore(sel, shallow)` 第二参；v5 改 useShallow / createWithEqualityFn | node_modules/zustand/README.md:120 | 未讲 | — | R2-16-7 |
| 旧写法 | useContext + useReducer 手搓 store：无 selector 全体重渲染 | https://react.dev/learn/scaling-up-with-reducer-and-context | 缺标签 | src/topics/16-global-state/react/cartStore.ts:5-6 | R2-16-7 |
| 主流 | Vue：pinia setup store（ref = state / computed = getter / function = action）；须 return 全部 state | https://pinia.vuejs.org/core-concepts/；node_modules/pinia/dist/pinia.d.ts:76 | 已讲对 | src/topics/16-global-state/vue/cartStore.ts:7-8; src/topics/16-global-state/vue/cartStore.ts:14-58 | 文件头承诺；现行写法 |
| 主流 | Vue：`storeToRefs` 解构 state / getter；action 直接解构 | https://pinia.vuejs.org/core-concepts/；node_modules/pinia/dist/pinia.d.ts:763 | 已讲对 | src/topics/16-global-state/vue/CartPanel.vue:11-19 | 文件头承诺 |
| 主流 | Vue：Pinia 定位（核心团队、Vuex 维护模式、新项目推荐） | https://vuejs.org/guide/scaling-up/state-management.html；https://pinia.vuejs.org/introduction.html | 未讲 | — | R2-16-8 |
| 主流 | Vue：模块级 reactive 最小方案 + SSR cross-request 警告 | 同上 | 未讲 | — | R2-16-8 |
| 主流 | Vue：`$patch` / `$state` / setup store 需自写 `$reset`；`$subscribe` / `$onAction` | https://pinia.vuejs.org/core-concepts/state.html | 未讲 | — | R2-16-8 |
| 主流 | Vue：Pinia 插件 / devtools / HMR / SSR 内置 vs Zustand 中间件 | https://pinia.vuejs.org/introduction.html | 未讲 | — | R2-16-8 |
| 主流 | 订阅粒度自动（依赖追踪）vs 手动（selector）；可变 vs 不可变 | https://pinia.vuejs.org/introduction.html | 已讲对 | src/topics/16-global-state/react/Example.tsx:23-27; src/topics/16-global-state/vue/ProductList.vue:16-19 | 文件头承诺 |
| 主流 | 派生值：store 内函数 `get()` 现算 / 组件内直接算；Zustand 无缓存 getter | — | 已讲对 | src/topics/16-global-state/react/cartStore.ts:80-87; src/topics/16-global-state/react/Example.tsx:83-90 | 大纲未列；更惯用的 selector 内派生 `s => s.items.reduce(...)` 未示（P-16-6） |

#### 面试 5 问

1. Context 和 Zustand / Redux 的本质区别是什么？（追问：Context 是状态管理工具吗；为什么 Provider 的 value 变了所有消费者都重渲染，而 Zustand 只重渲染选中的？）
2. Zustand 为什么不需要 Provider？它是怎么让组件订阅更新的？（追问：`useSyncExternalStore` 起什么作用；在组件外怎么读写 store？）
3. `useStore(s => ({ a: s.a, b: s.b }))` 有什么问题、怎么修？（追问：`useShallow` 比较到几层；v5 为什么去掉了第二个 equalityFn 参数？）
4. 什么情况下你会选 Redux Toolkit 而不是 Zustand？（追问：RTK 的 `createSlice` 为什么可以「直接改」state；RTK Query 和 TanStack Query 怎么选？）
5. 哪些状态不应该放全局 store？（追问：服务端数据、URL 状态、表单草稿分别该放哪；Pinia 的 setup store 里 `ref` / `computed` / `function` 分别对应什么？）

#### 生产写法要点

- 演示的购物车 store 是「单 store、同步 action」；生产要：按领域拆 slices、异步 action 里处理 loading / error（或交给 Query）、`persist` 只持久化白名单字段并写 `version` + `migrate`。
- TS：`create<State>()(...)` 双括号 + 显式 `State` 接口（含 actions 类型）；导出 selector 常量避免内联新对象；跨 store 读取用 `otherStore.getState()`。
- SSR / RSC：模块级单例会跨请求共享 → 用 `createStore` + Context 每请求一个实例（33）；Vue 侧 Pinia 同样警告 cross-request state pollution。
- devtools 中间件只在开发期启用；`subscribe` 在组件外用要记得取消订阅；测试里 `beforeEach(() => useStore.setState(useStore.getInitialState(), true))` 重置。
- 安全：token 之类敏感数据不要随 `persist` 落到 localStorage（35）。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| Zustand `create()` 单例 store，hook 即 store | Pinia `defineStore('id', setupFn)`：「ref()s become state properties」「computed()s become getters」「function()s become actions」；「you must return all state properties in setup stores」 | https://pinia.vuejs.org/core-concepts/（2026-09-16，逐字）；node_modules/pinia/dist/pinia.d.ts:67,76（① 两个重载） | pinia 3.0.4 已安装；setup store 是本课 Vue 主线写法（v4【较新】见 facts E） |
| `useStore(s => s.x)` selector 订阅 | `const { x } = storeToRefs(store)`；直接解构会「break reactivity」；actions 可直接解构 | https://pinia.vuejs.org/core-concepts/（2026-09-16，逐字）；pinia.d.ts:763（①） | Vue 靠依赖追踪天然「只渲染用到的」，不需要 selector |
| Pinia 定位 | 「It is maintained by the Vue core team」「Vuex is now in maintenance mode」「It is recommended to use Pinia for new applications」；「Pinia is a store library for Vue, it allows you to share a state across components/pages」 | https://vuejs.org/guide/scaling-up/state-management.html（逐字）；https://pinia.vuejs.org/introduction.html（逐字）（均 2026-09-16） | Vue 有唯一官方推荐；React 官方不指定 store 库，只给 Context |
| Context 手搓 store | 「Simple State Management with Reactivity API」：模块级 `reactive()` / `ref()` 即可共享；「recommended to define methods on the store with names that express the intention of the actions」 | https://vuejs.org/guide/scaling-up/state-management.html（2026-09-16，逐字） | Vue 的「最小方案」比 React 的 Context 方案更轻，因为响应式对象可脱离组件 |
| `set()` 浅合并 / `replace: true` | `store.$patch({...})` / `$patch(fn)`；「You cannot exactly replace the state」但可赋 `$state`；setup store 里 `$reset()` 需「create your own $reset() method」 | https://pinia.vuejs.org/core-concepts/state.html（2026-09-16，逐字）；pinia.d.ts:806,814,818（①） | setup store 的 `$reset` 缺省是常见坑 |
| `subscribe` / `subscribeWithSelector` | `store.$subscribe(cb, { detached })`：「subscriptions will trigger only once after patches」；`$onAction` | https://pinia.vuejs.org/core-concepts/state.html（2026-09-16，逐字）；pinia.d.ts:829,844（①） | 一致 |
| `persist` / `devtools` 中间件 | Pinia 插件体系（`pinia.use()`）+ 内置 devtools / HMR（`acceptHMRUpdate`）/ SSR 支持 | https://pinia.vuejs.org/introduction.html（2026-09-16，逐字「Why should I use Pinia?」）；pinia.d.ts:26（①） | Pinia 把 devtools / SSR 做进核心，Zustand 靠中间件 |
| RTK `createSlice` + Immer | 无对应物：Pinia 的 state 本就是 reactive，直接改 | https://pinia.vuejs.org/introduction.html（2026-09-16，逐字「mutations no longer exist」） | 原因：Vue 不需要不可变更新（21） |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-16-1 | 概念 | 未讲 | 性能 | selector 返回新对象 / 数组每次都重渲染；`useShallow`（`zustand/react/shallow`）浅比较；自定义 equalityFn 需 `createWithEqualityFn`（`zustand/traditional`）；Compiler 不改变订阅粒度 | — | — | 面试问 3 整问；文件头承诺 selector + Object.is，却没讲最常踩的反面情形 | grep0:useShallow\|shallow\|equalityFn\|createWithEqualityFn | 二、核心概念 / 六、易错点 |
| R2-16-2 | 概念 | 未讲 | 散点Hook | 底层机制：`useStore` 基于 `useSyncExternalStore`（→14）；vanilla API `getState / setState / subscribe / getInitialState` 组件外读写与测试重置（→34） | — | — | 面试问 2 追问；「不需要 Provider 为什么能订阅」课件只说 import 即用 | grep0:useSyncExternalStore\|subscribe\|getState\|setState\|getInitialState | 二、核心概念 / 五、常见追问与回答要点 |
| R2-16-3 | 概念 | 措辞 | 其它 | 【待主线判定】选型段无官方定位原文与采用数据；「Redux Toolkit 更重、样板多」与 RTK 自述相悖（RTK 正是为解决「too much boilerplate」而生）；「最主流之一」无来源 | src/topics/16-global-state/react/Example.tsx:12-13; src/topics/16-global-state/react/cartStore.ts:4-7 | Redux Toolkit 更重、样板多 | 主线（Zustand vs Context vs RTK）待主会话判定；无论结果，RTK 作【主流】存量对照至少要给 configureStore / createSlice（Immer）/ useSelector 一句 | https://redux-toolkit.js.org/introduction/getting-started（逐字：RTK 要解决的三个问题之一「Redux requires too much boilerplate code」；「intended to be the standard way to write Redux logic」）；16-evidence.md | 二、核心概念 / 四、关键区别 |
| R2-16-4 | 概念 | 未讲 | 其它 | 中间件（`devtools`、`persist` + `createJSONStorage`、`subscribeWithSelector`、`combine`、`immer` 需另装）与 `set(partial, true)` 整体替换会清掉 actions | — | — | 大纲主流；持久化购物车是本题场景最自然的追问 | grep0:persist\|devtools\|immer\|中间件\|replace | 二、核心概念 / 七、生产环境注意 |
| R2-16-5 | 概念 | 未讲 | 其它 | 异步 action（`async` + `await` 后 `set`）、slices 模式 `StateCreator<A & B, [], [], A>`、`combine` 免手写类型 | — | — | 大纲主流；生产 store 几乎必有异步与拆分 | grep0:async\|await\|slice\|loading | 二、核心概念 / 七、生产环境注意 |
| R2-16-6 | 概念 | 未讲 | 服务端 | `createStore`（vanilla）+ React Context 注入 store：按 props 初始化、SSR / RSC 每请求一个实例；模块级单例跨请求共享的风险（Pinia 文档同样警告） | — | — | 大纲主流；33 题概念课的落点 | grep0:createStore\|SSR\|服务端渲染\|每请求 | 七、生产环境注意 |
| R2-16-7 | 概念 | 缺标签 | 旧写法 | 八段素材：Redux 经典写法（手写 store / combineReducers / action 常量 / connect HOC）；zustand v4 `useStore(sel, shallow)` 第二参；Context + useReducer 手搓 store 已提但未标【旧写法】 | src/topics/16-global-state/react/cartStore.ts:5-6 | Context + useReducer 不用装库 | 存量项目 RTK / v4 zustand 大量存在，规格要求放对照段并注明版本 | node_modules/zustand/README.md:120（指向 migrating-to-v5「using custom equality functions such as shallow」）；https://redux-toolkit.js.org/ | 八、旧写法对照 |
| R2-16-8 | 概念 | 未讲 | Vue现行写法 | Pinia 对照缺：官方定位（核心团队、Vuex 维护模式、新项目推荐）、模块级 reactive 最小方案与 SSR 警告、`$patch` / `$state`、setup store 需自写 `$reset`、`$subscribe` / `$onAction`、插件体系 vs 中间件 | — | — | 大纲 Vue 对照 8 行只落地 3 行；「setup store 没有 $reset」是常见坑 | grep0:\$patch\|\$reset\|\$subscribe\|Vuex\|核心团队 | 三、Vue 对照 |
| R2-16-9 | 概念 | 未讲 | 交叉引用 | 「先分类」少两类：URL 状态（筛选 / 分页 / tab → 18）、表单草稿（→07 / 31） | — | — | 面试问 5 追问；课件只分「局部 / 服务端 / 全局」三类 | grep0:URL\|路由\|表单\|18 题 | 二、核心概念 |
| R2-16-10 | 生产 | 未标简化 | 生产简化 | 演示 store 为单 store、同步 action、无持久化 / devtools、totalPrice 用 store 内函数现算；未标「演示简化」也没给生产形态（按领域拆 slices、persist 白名单 + version / migrate、devtools 仅开发期、token 不落 localStorage → 35、selector 内派生） | src/topics/16-global-state/react/cartStore.ts:37 | create<CartState>()((set | 七段缺失；购物车持久化是真实需求 | https://zustand.docs.pmnd.rs/learn/getting-started/introduction；node_modules/zustand/middleware.d.ts:5 | 七、生产环境注意 |
| R2-16-11 | 小问题 | 措辞 | 绝对化 | 模板残留「没有一一对应关系」；「action 引用永远稳定 / 永远不会触发更新」在 `set(x, true)` 或 `setState` 覆盖 actions 时不成立 | src/topics/16-global-state/react/cartStore.ts:85; src/topics/16-global-state/vue/cartStore.ts:20; src/topics/16-global-state/react/Example.tsx:50-51 | 两者没有一一对应关系 | 规格 §5 H；README:131 明示 replace 会「wipe out … actions」 | node_modules/zustand/README.md:131 | 二、核心概念 |
| R2-16-12 | 小问题 | 措辞 | 交叉引用 | 已有 08 / 09 / 15 / 25 / 30 均成立；缺 14（useSyncExternalStore）、18（URL）、21（不可变）、33（SSR）、34（测试）、35（persist 与 token） | src/topics/16-global-state/react/Example.tsx:14 | 如 TanStack Query，见 30 题 | 大纲版本说明与盲点归属表的指向未落地 | course-map §1 / §2 | 参考 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | Context 和 Zustand / Redux 本质区别？Context 是状态管理工具吗？为何 Provider 变全体重渲染而 Zustand 只重渲染选中的？ | 部分 | src/topics/16-global-state/react/Example.tsx:12-13; src/topics/16-global-state/react/Example.tsx:45-52; src/topics/16-global-state/react/cartStore.ts:5-6 | Context 重渲染原理在 15；Zustand 订阅机制未讲 |
| 2 | Zustand 为什么不需要 Provider？怎么让组件订阅？useSyncExternalStore 起什么作用？组件外怎么读写？ | 部分 | src/topics/16-global-state/react/Example.tsx:5-6; src/topics/16-global-state/react/cartStore.ts:33-35 | 机制与 vanilla API 全无 |
| 3 | `useStore(s => ({ a, b }))` 有什么问题、怎么修？useShallow 比较几层？v5 为何去掉 equalityFn？ | 部分 | src/topics/16-global-state/react/Example.tsx:47-51 | 能推出「新对象每次重渲染」，修法 useShallow / v5 变化无 |
| 4 | 什么情况选 RTK 而不是 Zustand？createSlice 为何可「直接改」？RTK Query vs TanStack Query？ | 不能 | src/topics/16-global-state/react/Example.tsx:12 | 只有「更重、样板多」一句且不准确 |
| 5 | 哪些状态不进 store？服务端 / URL / 表单各放哪？Pinia setup store 里 ref / computed / function 对应什么？ | 部分 | src/topics/16-global-state/react/cartStore.ts:9-12; src/topics/16-global-state/vue/cartStore.ts:7-8 | URL / 表单去向未讲 |

### 17. useMemo 与 useCallback

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 承诺：父组件 state 一变默认整棵子树重跑；子组件不管 props 变没变都重渲染 | https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:5-6; src/topics/17-performance-hooks/react/Example.tsx:57 | 文件头承诺 |
| 主流 | 承诺：`memo(Component)` props 浅比较 Object.is，前提是引用稳定 | https://react.dev/reference/react/memo；node_modules/@types/react/index.d.ts:1576 | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:7-8; src/topics/17-performance-hooks/react/Example.tsx:54-68 | 文件头承诺 |
| 主流 | `memo`「是性能优化，不是保证」；自身 state / 所用 context 变化仍重渲染 | https://react.dev/reference/react/memo | 未讲 | — | R2-17-5 |
| 主流 | 承诺：`useCallback` 稳定引用 → memo 浅比较通过（因果链）；不配 memo 单独用没意义 | https://react.dev/reference/react/useCallback | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:9-10; src/topics/17-performance-hooks/react/Example.tsx:122-137 | 文件头承诺 |
| 主流 | `useCallback(fn, deps) = useMemo(() => fn, deps)`；缓存函数本身 vs 缓存调用结果 | https://react.dev/reference/react/useCallback#how-is-usecallback-related-to-usememo；node_modules/@types/react/index.d.ts:1813 | 未讲 | — | R2-17-6 |
| 主流 | 承诺：`useMemo` 缓存昂贵计算（200 条 filter + sort），依赖不变复用 | https://react.dev/reference/react/useMemo；node_modules/@types/react/index.d.ts:1821 | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:11; src/topics/17-performance-hooks/react/Example.tsx:94-120 | 文件头承诺 |
| 主流 | `useMemo` 三种有价值情况（昂贵 / 传给 memo 子组件 / 作另一个 Hook 的依赖） | https://react.dev/reference/react/useMemo#should-you-add-usememo-everywhere | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:97-100 | 「作 Hook 依赖」只在 :100 一句带过 |
| 主流 | 承诺：不要无脑用——内存与心智成本；绝大多数组件不需要 | https://react.dev/reference/react/useCallback#should-you-add-usecallback-everywhere | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:12-13; src/topics/17-performance-hooks/react/Example.tsx:171-175 | 文件头承诺 |
| 主流 | 五原则减少记忆化需求（children 传 JSX、state 就近、纯渲染、去掉无谓 Effect / 依赖）；「典型网站粗粒度交互不需要」 | https://react.dev/reference/react/useCallback#should-you-add-usecallback-everywhere；https://react.dev/reference/react/memo#should-you-add-memo-everywhere | 未讲 | — | R2-17-6 |
| 主流 | 判断昂贵：`console.time` 包住计算，≥ 1ms 才值得；仍卡再用 Profiler 看谁受益 | https://react.dev/reference/react/useMemo#how-to-tell-if-a-calculation-is-expensive | 未讲 | — | R2-17-6 |
| 主流 | 「只能当性能优化」：没有 useMemo 代码也必须正确；React 可能丢弃缓存 | https://react.dev/reference/react/useMemo#caveats | 未讲 | — | R2-17-5 |
| 主流 | 不该记忆化的场景：为 Effect 造稳定对象 → 移进 Effect；列表项 useCallback → 抽成子组件 | https://react.dev/reference/react/useMemo#preventing-an-effect-from-firing-too-often；https://react.dev/reference/react/useCallback#i-need-to-call-usecallback-for-each-list-item-in-a-loop-but-its-not-allowed | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:54-81 | ProductRow 已抽成 memo 子组件但未点明这条原则；「对象移进 Effect」未提 |
| 主流 | 常见坑：忘写 deps、箭头返回对象忘括号、StrictMode 双调计算函数、lint `use-memo` | https://react.dev/reference/react/useMemo#troubleshooting；https://react.dev/reference/eslint-plugin-react-hooks/lints/use-memo | 缺标签 | src/topics/17-performance-hooks/react/Example.tsx:63-64; src/topics/17-performance-hooks/react/Example.tsx:103-104; src/topics/17-performance-hooks/react/Example.tsx:168 | R2-17-4（只提 exhaustive-deps，`use-memo` 规则名未提） |
| 主流 | `arePropsEqual` 自定义比较：必须比较每个 prop 含函数；深比较可能让应用冻结 | https://react.dev/reference/react/memo#specifying-a-custom-comparison-function | 未讲 | — | R2-17-7 |
| 主流 | 承诺：先用 React DevTools Profiler 量测再优化（本题主责：面板 / 火焰图 / Ranked / profiling 构建） | https://react.dev/learn/react-developer-tools | 缺标签 | src/topics/17-performance-hooks/react/Example.tsx:13; src/topics/17-performance-hooks/react/Example.tsx:174 | R2-17-1（只有一句建议，无用法） |
| 主流 | `<Profiler id onRender>` 编程式测量：phase / actualDuration / baseDuration；生产需 profiling 构建 | https://react.dev/reference/react/Profiler；node_modules/@types/react/index.d.ts:825-900 | 未讲 | — | R2-17-1 |
| 主流 | 列表虚拟化（本题主责）：只渲染视口内项；`@tanstack/react-virtual` / react-window | https://github.com/TanStack/virtual；https://github.com/bvaughn/react-window | 未讲 | — | R2-17-2 |
| 较新 | 承诺：React Compiler 一句（自动记忆化原理、1.0 于 2025-10 稳定、17+ 支持） | https://react.dev/learn/react-compiler/introduction；https://react.dev/blog/2025/10/07/react-compiler-1 | 缺标签 | src/topics/17-performance-hooks/react/Example.tsx:14; src/topics/17-performance-hooks/react/Example.tsx:175; src/topics/17-performance-hooks/vue/Example.vue:131 | R2-17-3（一句且声明「不展开」，本题主责） |
| 较新 | 对手写记忆化的态度：编译器「保留」现有 useMemo / useCallback / memo；新代码靠编译器、存量保留 | https://react.dev/learn/react-compiler/introduction#what-should-i-do-about-usememo-usecallback-and-reactmemo | 未讲 | — | R2-17-3 |
| 较新 | 本项目不启用的理由（方案 A）；`compilationMode` 启发式；plugin-react 5.2 需走 `babel.plugins` 接入 | https://react.dev/reference/react-compiler/compilationMode；facts-versions §G | 未讲 | — | R2-17-3 |
| 较新 | lint `preserve-manual-memoization`：手写记忆化漏依赖会阻止编译；`recommended` 已含 | https://react.dev/reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization；node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:18216-18220 | 未讲 | — | R2-17-4 |
| 较新 | 其它编译器规则一览（`use-memo` / `refs` / `set-state-in-effect` / `purity` / `immutability` / `static-components` …）；「linter 不需要安装编译器」 | https://react.dev/reference/eslint-plugin-react-hooks；facts-versions §F | 未讲 | — | R2-17-4 |
| 较新 | 指令 `"use memo"` / `"use no memo"`（临时、配 TODO） | https://react.dev/reference/react-compiler/directives | 未讲 | — | R2-17-3 |
| 主流 | Vue 官方对 React 记忆化的评价（面试可引） | https://vuejs.org/guide/extras/composition-api-faq.html#comparison-with-react-hooks | 未讲 | — | R2-17-8 |
| 旧写法 | `PureComponent` / `shouldComponentUpdate` ↔ `memo` / `arePropsEqual` | facts-versions §A（运行时仍导出 PureComponent） | 未讲 | — | R2-17-7 |
| 主流 | 承诺 Vue：`computed` 自动依赖 + 缓存 ≈「不用手写依赖的 useMemo」；getter 须纯 | https://vuejs.org/guide/essentials/computed.html#computed-caching-vs-methods | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:17; src/topics/17-performance-hooks/react/Example.tsx:101-102; src/topics/17-performance-hooks/vue/Example.vue:58-63 | 文件头承诺 |
| 主流 | 承诺 Vue：子组件只在 props 变化时更新，memo / useCallback 无对应物；编译器缓存内联 handler | https://vuejs.org/guide/best-practices/performance.html#update-optimizations | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:18-20; src/topics/17-performance-hooks/vue/Example.vue:79-84; src/topics/17-performance-hooks/vue/ProductRow.vue:22-24 | 文件头承诺；「编译器缓存内联事件处理函数」官方原文待核实 P-17-1 |
| 主流 | Vue：`v-memo` / `v-once`；3.4 起 computed 只在值变化时触发副作用；`shallowRef` 降低大数据开销 | https://vuejs.org/guide/best-practices/performance.html#update-optimizations；#computed-stability；#reduce-reactivity-overhead-for-large-immutable-structures | 未讲 | — | R2-17-8 |
| 主流 | Vue：DevTools 性能面板 / `app.config.performance`；官方推荐的虚拟化库 | https://vuejs.org/guide/best-practices/performance.html#profiling-options；https://vuejs.org/guide/best-practices/performance.html#virtualize-large-lists | 未讲 | — | R2-17-1 |
| 主流 | 大纲未列：StrictMode 开发期双调渲染函数，console 计数约翻倍；`console.count` 观察法 | https://react.dev/reference/react/StrictMode | 已讲对 | src/topics/17-performance-hooks/react/Example.tsx:63-64; src/topics/17-performance-hooks/react/Example.tsx:168 | 大纲未列；计算函数内 console.count 未标演示 → R2-17-10 |

#### 面试 5 问

1. `useMemo`、`useCallback`、`memo` 各缓存什么？三者是什么关系？（追问：`useCallback` 怎么用 `useMemo` 实现？为什么只用 `useCallback` 不配 `memo` 没意义？）
2. 什么时候值得用 `useMemo`？为什么不能无脑用？（追问：怎么判断计算「昂贵」？React 会不会丢弃缓存？没有 `useMemo` 代码就错了说明什么？）
3. 父组件重渲染时子组件为什么会跟着渲染？`memo` 为什么常常「不生效」？（追问：对象 / 函数 prop 怎么办？`children` 传 JSX 为什么能减少渲染？）
4. React Compiler 做了什么？开了之后还要写 `useMemo` 吗？（追问：为什么这个项目不启用？`preserve-manual-memoization` 报错说明什么？`"use no memo"` 什么时候用？）
5. 怎么定位性能问题？（追问：Profiler 火焰图怎么读？`actualDuration` 与 `baseDuration` 的差别？万行列表怎么办——虚拟化的原理与库选择？）

#### 生产写法要点

- 先 Profiler 再优化：录一次交互、看 Ranked 图找最贵组件，记录 `actualDuration` 基线再改
- `memo` 子组件 + 稳定 props（`useCallback` / `useMemo` / 原始值）必须成套；只 `memo` 不稳定 props 等于没做
- 列表 > 数百行且每行有布局成本时用 `@tanstack/react-virtual`（headless，自定义 markup）或 react-window（现成组件）；固定高度优先，动态高度用测量
- 若将来启用编译器：先让 `recommended` lint 全绿，用 `annotation` 模式 + `"use memo"` 渐进，`"use no memo"` 排查；保留现有记忆化不要一刀切删除
- 不用 `useMemo` 保证语义（如生成稳定 ID 用 `useId` / `useRef`）；真正昂贵的纯计算考虑 Web Worker 或服务端
- 类型：`useCallback<T extends Function>` 推断回调类型；`memo` 包泛型组件的类型写法（→ 28）

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `useMemo(() => expensive(a), [a])` | `computed(() => expensive(a.value))`：「基于响应式依赖缓存，只有依赖变化才重新求值」；「方法调用每次渲染都会执行」 | https://vuejs.org/guide/essentials/computed.html#computed-caching-vs-methods（2026-09-16，逐字） | 目的相同（缓存派生值），差别在依赖声明方式 |
| 依赖数组手写 | 自动依赖收集，「无需手动声明依赖」 | https://vuejs.org/guide/extras/composition-api-faq.html（2026-09-16，逐字） | 这是 Vue 不需要 `exhaustive-deps` 的原因 |
| `useCallback` 稳定回调 | 无需：「不必手动缓存回调函数来避免子组件无谓更新」 | https://vuejs.org/guide/extras/composition-api-faq.html（2026-09-16，逐字） | Vue 子组件按 props 变化更新，不按父组件渲染 |
| `memo` | 内置行为：「子组件只在收到的 props 至少一个变化时更新」→ 保持 props 稳定；`v-memo` / `v-once` 跳过子树更新 | https://vuejs.org/guide/best-practices/performance.html#update-optimizations（2026-09-16，逐字） | `v-memo` 是显式的、按表达式数组比较，类似 `memo` + deps |
| `useMemo` 返回同引用避免下游重跑 | 3.4 起「computed 只在计算值变化时才触发副作用」 | https://vuejs.org/guide/best-practices/performance.html#computed-stability（2026-09-16，逐字） | — |
| `computed` getter 纯函数 | 「getter 应无副作用；computed 返回值是派生快照，不要修改」 | https://vuejs.org/guide/essentials/computed.html#best-practices（2026-09-16，逐字） | 与 `useMemo` 的 `calculateValue` 必须纯一致 |
| React DevTools Profiler / `<Profiler>` | Vue DevTools 性能面板；`app.config.performance` 打开浏览器 Performance 面板里的 Vue 标记 | https://vuejs.org/guide/best-practices/performance.html#profiling-options（2026-09-16，逐字） | — |
| 列表虚拟化 | 官方推荐 vue-virtual-scroller / vue-virtual-scroll-grid / vueuc VVirtualList；`@tanstack/vue-virtual` 同源 | https://vuejs.org/guide/best-practices/performance.html#virtualize-large-lists（2026-09-16，逐字） | — |
| 大不可变数据的记忆化开销 | `shallowRef` / `shallowReactive` 降低深层响应式开销 | https://vuejs.org/guide/best-practices/performance.html#reduce-reactivity-overhead-for-large-immutable-structures（2026-09-16，逐字） | React 侧无对应：state 本来就是不可变快照 |
| React Compiler 自动记忆化 | 无对应物 | https://vuejs.org/guide/extras/composition-api-faq.html（2026-09-16，逐字） | Vue 细粒度响应式使子组件默认只在需要时更新，无需编译期记忆化 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-17-1 | 概念 | 未讲 | 性能 | React DevTools Profiler 用法（本题主责）：录制 → commit → 火焰图 / Ranked；`<Profiler onRender>` 的 actualDuration / baseDuration；19.2 Performance Tracks【较新】；Vue DevTools 对照 | — | — | 文件头两次说「先用 Profiler 量测」但没有任何用法；面试第 5 问追问答不上 | grep0:onRender\|火焰图\|actualDuration\|Ranked | 二、核心概念；七、生产环境注意 |
| R2-17-2 | 概念 | 未讲 | 性能 | 列表虚拟化（本题主责）：原理 + `@tanstack/react-virtual`（headless）/ react-window 一句 + Vue 对照库 | — | — | 200 行表格是天然引子；万行列表是面试第 5 问追问 | grep0:虚拟化\|virtual\|react-window | 二、核心概念；七、生产环境注意 |
| R2-17-3 | 概念 | 未讲 | 性能 | React Compiler（本题主责，【较新】）：自动记忆化原理、对手写记忆化「保留」的态度、本项目不启用理由（方案 A）、`"use memo"` / `"use no memo"` | — | — | 课件只有「正在自动化，知道有这回事即可」；面试第 4 问答不上 | grep0:自动记忆化\|use no memo\|babel-plugin-react-compiler\|compilationMode | 二、核心概念；九、新动向 |
| R2-17-4 | 概念 | 未讲 | 性能 | lint 规则逐条：`preserve-manual-memoization`（漏依赖阻止编译）、`use-memo`（不放副作用、必须返回值）、`static-components`、`purity`、`immutability`；「linter 不需要安装编译器」；`recommended` 已含 | — | — | 课件只提 `exhaustive-deps`；阶段 1 切 recommended 后这些规则即生效 | grep0:preserve-manual-memoization\|use-memo | 六、易错点；七、生产环境注意 |
| R2-17-5 | 概念 | 未讲 | 性能 | `memo` / `useMemo`「只是性能优化不是保证」：memo 组件自身 state / context 变化仍重渲染；React 可能丢弃 useMemo 缓存，没有它代码也必须正确 | — | — | 面试第 2 问追问「React 会不会丢弃缓存」「没有 useMemo 就错说明什么」答不上 | grep0:不是保证\|语义\|context\|Context | 二、核心概念；五、常见追问 |
| R2-17-6 | 概念 | 未讲 | 性能 | 加分点：减少记忆化需求的五原则（children 传 JSX 等）、判断昂贵的 `console.time` ≥ 1ms 阈值、`useCallback = useMemo(() => fn)` | — | — | 面试第 1 / 2 / 3 问的追问点 | grep0:children\|console\.time\|1ms | 二、核心概念；五、常见追问 |
| R2-17-7 | 概念 | 未讲 | 旧写法 | `memo` 第二参数 `arePropsEqual`（深比较可能冻结）；class 时代 `PureComponent` / `shouldComponentUpdate` 对照 | — | — | 存量 class 代码仍常见；面试可能追问 | grep0:arePropsEqual\|PureComponent\|shouldComponentUpdate | 二、核心概念；八、旧写法对照 |
| R2-17-8 | 概念 | 未讲 | Vue现行写法 | `v-memo` / `v-once`（显式跳过子树，最接近 memo + deps）、3.4 起 computed 稳定性、`shallowRef` 对照、Vue 官方对 React 记忆化的评价句 | — | — | 文件头说「memo 在 Vue 没有对应物」，而 `v-memo` 正是显式对应物 | grep0:v-memo\|v-once\|shallowRef | 三、Vue 对照 |
| R2-17-9 | 小问题 | 措辞 | 其它 | 文件头「知道有这回事即可，不展开」与本题主责冲突；模板残留「没有一一对应关系」；无成熟度标签 | src/topics/17-performance-hooks/react/Example.tsx:14; src/topics/17-performance-hooks/vue/Example.vue:15; src/topics/17-performance-hooks/react/Example.tsx:25; src/topics/17-performance-hooks/vue/Example.vue:26 | 知道有这回事即可，不展开 | 重写时改为「本题展开」并给 Compiler 标【较新】 | course-map §2（性能盲点主责 17）；course-map §6-H | 文件头 |
| R2-17-10 | 生产 | 未标简化 | 生产简化 | `useMemo` 计算函数与 `ProductRow` 渲染体里的 `console.count` 是观察手段，未标注「计算函数必须纯、生产不写副作用」；200 条 filter+sort 是否达 1ms 阈值未说明 | src/topics/17-performance-hooks/react/Example.tsx:107; src/topics/17-performance-hooks/react/Example.tsx:69 | filter+sort 计算次数 | 官方：calculateValue 必须是纯函数；`use-memo` 规则「不是放副作用的地方」 | https://react.dev/reference/react/useMemo（大纲逐字「calculateValue 必须是纯函数」）；https://react.dev/reference/eslint-plugin-react-hooks/lints/use-memo（大纲逐字） | 七、生产环境注意 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | `useMemo`、`useCallback`、`memo` 各缓存什么？三者是什么关系？（追问：`useCallback` 怎么用 `useMemo` 实现？为什么只用 `useCallback` 不配 `memo` 没意义？） | 部分 | src/topics/17-performance-hooks/react/Example.tsx:7-11; src/topics/17-performance-hooks/react/Example.tsx:122-137 | `useCallback = useMemo(() => fn, deps)` 未讲 |
| 2 | 什么时候值得用 `useMemo`？为什么不能无脑用？（追问：怎么判断计算「昂贵」？React 会不会丢弃缓存？没有 `useMemo` 代码就错了说明什么？） | 部分 | src/topics/17-performance-hooks/react/Example.tsx:94-104; src/topics/17-performance-hooks/react/Example.tsx:171-175 | `console.time` 阈值、缓存可丢弃、「只能当性能优化」未讲 |
| 3 | 父组件重渲染时子组件为什么会跟着渲染？`memo` 为什么常常「不生效」？（追问：对象 / 函数 prop 怎么办？`children` 传 JSX 为什么能减少渲染？） | 部分 | src/topics/17-performance-hooks/react/Example.tsx:5-10; src/topics/17-performance-hooks/react/Example.tsx:54-67; src/topics/17-performance-hooks/react/Example.tsx:122-131 | children 传 JSX 原则未讲；memo 自身 state / context 例外未讲 |
| 4 | React Compiler 做了什么？开了之后还要写 `useMemo` 吗？（追问：为什么这个项目不启用？`preserve-manual-memoization` 报错说明什么？`"use no memo"` 什么时候用？） | 不能 | src/topics/17-performance-hooks/react/Example.tsx:14; src/topics/17-performance-hooks/react/Example.tsx:175 | 只有一句「正在自动化」 |
| 5 | 怎么定位性能问题？（追问：Profiler 火焰图怎么读？`actualDuration` 与 `baseDuration` 的差别？万行列表怎么办——虚拟化的原理与库选择？） | 不能 | src/topics/17-performance-hooks/react/Example.tsx:13; src/topics/17-performance-hooks/react/Example.tsx:174 | 只有一句「先跑 Profiler」；虚拟化未提 |

### 18. 路由（React Router）

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 文件头承诺：「路由即组件：Route 就是 JSX 组件，路由表直接写在渲染输出里」 | https://reactrouter.com/7.18.4/start/modes | 讲了但错 | src/topics/18-routing/react/Example.tsx:5; src/topics/18-routing/react/Example.tsx:24-27 | R2-18-2 |
| 主流 | 文件头承诺：useParams / useSearchParams / useNavigate / Link / Outlet 嵌套 / index 路由 / 动态段 | https://reactrouter.com/7.18.4/start/data/routing | 已讲对 | src/topics/18-routing/react/Example.tsx:264-283; src/topics/18-routing/react/Example.tsx:338; src/topics/18-routing/react/Example.tsx:421-438; src/topics/18-routing/react/Example.tsx:549-580 | 声明式写法；setSearchParams 语义见 R2-18-10 |
| 主流 | 文件头承诺：RequireAuth 包 element + useLocation 回跳 + 登录页读 redirect | https://reactrouter.com/7.18.4/start/declarative/routing | 已讲对 | src/topics/18-routing/react/Example.tsx:205-222; src/topics/18-routing/react/Example.tsx:225-240 | 声明式并排版可保留；三态见 R2-18-10 |
| 主流 | 文件头承诺：「React Router 根本没有全局导航钩子」 | https://reactrouter.com/7.18.4/how-to/middleware | 讲了但错 | src/topics/18-routing/react/Example.tsx:31; src/topics/18-routing/react/Example.tsx:144-147 | R2-18-1 |
| 主流 | 文件头承诺：按钮级权限 = 条件渲染 | ③ OWASP https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html | 讲了但错 | src/topics/18-routing/react/Example.tsx:367-369 | R2-18-5（安全表述错） |
| 主流 | 三种模式官方定位；主线 Data，声明式 + RequireAuth 并排 | https://reactrouter.com/7.18.4/start/modes | 未讲 | — | R2-18-3；:153、:508 仅一句「本课不展开」 |
| 主流 | Data 标准启动 createBrowserRouter（react-router）+ RouterProvider（react-router/dom，两处导出、flushSync）；演示 / 测试用 createMemoryRouter | https://reactrouter.com/7.18.4/start/data/installation；https://reactrouter.com/7.18.4/api/data-routers/RouterProvider；node_modules/react-router/dist/development/index-react-server-client-BjY-eKuf.d.ts:371 | 未讲 | — | R2-18-3 |
| 主流 | 路由对象字段 path / index / children / Component vs element / loader / action / errorElement / handle / lazy / middleware | https://reactrouter.com/7.18.4/start/data/route-object；node_modules/react-router/dist/development/data-CjO11-hU.d.ts:733-803 | 未讲 | — | R2-18-3 |
| 主流 | loader 在渲染前调用 + useLoaderData / useRouteLoaderData | https://reactrouter.com/7.18.4/start/data/data-loading；node_modules/react-router/dist/development/index.d.ts:632 | 未讲 | — | R2-18-3 |
| 主流 | 父子 loader 并行（dataStrategy）→ 父 loader 拦截时子请求可能已发出 | https://reactrouter.com/7.18.4/api/data-routers/createBrowserRouter | 未讲 | — | R2-18-8 |
| 主流 | 守卫经典写法 loader 里 throw redirect；redirect 接受绝对 URL 需校验 | https://reactrouter.com/7.18.4/api/utils/redirect；node_modules/react-router/dist/development/data-CjO11-hU.d.ts:1134 | 讲了但错 | src/topics/18-routing/react/Example.tsx:153-155 | R2-18-6（好处讲错、无代码） |
| 较新 | middleware 守卫（Data 模式无需 flag；createContext + RouterContextProvider）+ 父→子依次 / 未登录子 loader 不跑 / 每次客户端导航都跑 | https://reactrouter.com/7.18.4/how-to/middleware；node_modules/react-router/dist/development/data-CjO11-hU.d.ts:496; node_modules/react-router/dist/development/data-CjO11-hU.d.ts:747 | 未讲 | — | R2-18-8 |
| 主流 | errorElement / ErrorBoundary + useRouteError + isRouteErrorResponse + throw data(…, { status: 404 }) | https://reactrouter.com/7.18.4/how-to/error-boundary；node_modules/react-router/dist/development/index.d.ts:719 | 未讲 | — | R2-18-8 |
| 主流 | action + `<Form method="post">` + useActionData；提交后 loader 重新验证 | https://reactrouter.com/7.18.4/start/data/actions；node_modules/react-router/dist/development/index.d.ts:698 | 未讲 | — | R2-18-8 |
| 主流 | useFetcher 非导航提交 / 加载、state 三态、key 共享 | https://reactrouter.com/7.18.4/how-to/fetchers；node_modules/react-router/dist/development/index-react-server-client-BjY-eKuf.d.ts:3379 | 未讲 | — | R2-18-8 |
| 主流 | useNavigation().state pending；NavLink isPending | https://reactrouter.com/7.18.4/api/hooks/useNavigation；node_modules/react-router/dist/development/index.d.ts:557 | 未讲 | — | R2-18-8 |
| 主流 | 流式：loader 返回未 await 的 promise（须为对象字段）+ Suspense + `<Await>`；React 19 可 use()（→32） | https://reactrouter.com/7.18.4/how-to/suspense | 未讲 | — | R2-18-8；v7 无需 defer【旧写法】 |
| 较新 | 路由级 lazy 属性（函数式 / 对象式；不能懒加载 path / index / children / middleware） | https://reactrouter.com/7.18.4/start/data/route-object；node_modules/react-router/dist/development/data-CjO11-hU.d.ts:773 | 未讲 | — | R2-18-8 |
| 主流 | useBlocker + useBeforeUnload 离开前确认（仅 Data 路由） | https://reactrouter.com/7.18.4/how-to/navigation-blocking；node_modules/react-router/dist/development/index.d.ts:876 | 未讲 | — | R2-18-8 |
| 主流 | handle + useMatches 面包屑（UIMatch.data 弃用 → loaderData） | https://reactrouter.com/7.18.4/api/hooks/useMatches；node_modules/react-router/dist/development/index.d.ts:608 | 未讲 | — | R2-18-8 |
| 主流 | NavLink 默认 active 类 + aria-current="page"；函数式 className / style 为可选；end 默认 false | https://reactrouter.com/7.18.4/api/components/NavLink；node_modules/react-router/dist/development/chunk-BV7QT456.mjs:10678 | 讲了但错 | src/topics/18-routing/react/Example.tsx:9; src/topics/18-routing/react/Example.tsx:118-125; src/topics/18-routing/react/Example.tsx:522-526 | R2-18-7；前缀匹配与 end 已讲对 |
| 主流 | useSearchParams setter 整体替换；函数式更新；筛选变更重置页码；push vs replace | https://reactrouter.com/7.18.4/api/hooks/useSearchParams | 缺标签 | src/topics/18-routing/react/Example.tsx:275-283 | R2-18-10 |
| 主流 | useNavigate：navigate(-1) 用 location.key === "default" 兜底；loader / action 里优先 redirect | https://reactrouter.com/7.18.4/api/hooks/useNavigate | 缺标签 | src/topics/18-routing/react/Example.tsx:340-342; src/topics/18-routing/react/Example.tsx:355; src/topics/18-routing/react/Example.tsx:365 | R2-18-10 |
| 主流 | useLocation 字段；`<Navigate replace>` 防后退弹跳；渲染期不能调 navigate() | https://reactrouter.com/7.18.4/start/declarative/url-values；https://reactrouter.com/7.18.4/api/components/Navigate | 已讲对 | src/topics/18-routing/react/Example.tsx:193-200; src/topics/18-routing/react/Example.tsx:210-218 | — |
| 主流 | 声明式 `<Routes>` 子元素只能是 `<Route>` / Fragment → 守卫只能包 element；v5 `<PrivateRoute>`【旧写法】v6 起报错 | https://reactrouter.com/7.18.4/start/declarative/routing；node_modules/react-router/dist/development/chunk-BV7QT456.mjs:7314 | 缺标签 | src/topics/18-routing/react/Example.tsx:556-565 | 「包 element」已讲对；invariant 与 v5 旧写法未提，并入 R2-18-2 |
| 主流 | 真区别：渲染中拦截（声明式）vs 渲染前拦截（Data loader / middleware / Vue beforeEach），而非「组件树 vs 配置」 | node_modules/react-router/dist/development/chunk-BV7QT456.mjs:7298（createRoutesFromChildren）；https://reactrouter.com/7.18.4/start/data/data-loading | 讲了但错 | src/topics/18-routing/react/Example.tsx:28-32; src/topics/18-routing/react/Example.tsx:198-200 | R2-18-2；:200「导航前 vs 渲染时」一句已触及 |
| 主流 | RequireAuth 三态 checking / authed / guest（刷新时异步恢复） | 课程设计（outline 第 26 行） | 缺标签 | src/topics/18-routing/react/Example.tsx:162; src/topics/18-routing/react/Example.tsx:483 | R2-18-10 |
| 主流 | 参数变化 /orders/o1 → o2 同位置实例复用，state / effect 保留；key={id} 或依赖数组 | https://react.dev/learn/preserving-and-resetting-state | 讲了但错 | src/topics/18-routing/react/Example.tsx:335-337; src/topics/18-routing/vue/OrderDetailPage.vue:18-20 | R2-18-4 |
| 主流 | 安全：前端权限只影响体验；开放重定向校验 safeRedirect（→35） | https://reactrouter.com/7.18.4/api/utils/redirect | 缺标签 | src/topics/18-routing/react/Example.tsx:237-239; src/topics/18-routing/vue/LoginPage.vue:28-29 | R2-18-10；注释正确但未实现，应迁入 35 |
| 旧写法 | 导入路径 v6 react-router-dom → v7 react-router（dom 包仅转发）→ v8 删除 | https://reactrouter.com/8.4.0/upgrading/v7；facts-versions.md C | 讲了但错 | src/topics/18-routing/react/Example.tsx:55; src/topics/18-routing/react/Example.tsx:507-508 | R2-18-9 |
| 尝鲜 | v8 要求与 5 个 flag；v6 官方 EOL；`<Link viewTransition>` / React 19.3 ViewTransition（→32） | https://remix.run/blog/react-router-v8；https://reactrouter.com/7.18.4/api/components/NavLink | 未讲 | — | R2-18-9；viewTransition 为可选项不计问题 |
| 主流 | Vue 守卫返回值写法（false / 路由位置 / undefined·true）；next() 为旧写法仍支持；meta 父到子合并 | https://router.vuejs.org/guide/advanced/navigation-guards.html | 缺标签 | src/topics/18-routing/vue/router.ts:81-82; src/topics/18-routing/vue/router.ts:88-98 | R2-18-11；meta 已讲对 router.ts:48-52 |
| 主流 | Vue 取数 watch / computed 跟 params；路由懒加载 () => import()；router.go(-1) 无兜底；createMemoryHistory | https://router.vuejs.org/guide/advanced/data-fetching.html；https://router.vuejs.org/guide/advanced/lazy-loading.html；node_modules/vue-router/dist/vue-router.d.mts:25 | 缺标签 | src/topics/18-routing/vue/OrderDetailPage.vue:18-21; src/topics/18-routing/vue/OrderDetailPage.vue:34; src/topics/18-routing/vue/router.ts:13-14 | computed 跟参数、createMemoryHistory 已讲对；懒加载未讲；back() 无兜底并入 R2-18-10 |
| 较新 | vue-router 5 文件路由（vue-router/vite）【较新】与 vue-router/experimental 数据加载器【尝鲜】 | https://router.vuejs.org/file-based-routing/；https://router.vuejs.org/data-loaders/ | 未讲 | — | R2-18-11 |
| 主流 | 大纲未列：单 Router 限制与 ReactIsolatedMount；相对 to="profile"；退出登录即弹回（守卫持续生效）；replace 防弹跳；KeepAlive vs Activity【较新】；Vue 激活基于路由记录 | node_modules/react-router/dist/development/chunk-BV7QT456.mjs:7143-7145；node_modules/vue-router/dist/vue-router.mjs:923-928 | 已讲对 | src/topics/18-routing/react/Example.tsx:510-513; src/topics/18-routing/react/Example.tsx:425-426; src/topics/18-routing/react/Example.tsx:533-538; src/topics/18-routing/react/Example.tsx:466-470; src/topics/18-routing/vue/Example.vue:51-53 | 大纲未列；Activity 交叉引用 →32 见 R2-18-12 |

#### 面试 5 问

1. React Router 三种模式怎么选，你项目用哪种？（追问：声明式模式为什么没有 `useNavigation` / `useBlocker`？Data 模式和 v6.4 的 data router 是什么关系？）
2. 登录守卫怎么做？（追问：RequireAuth 包 `element` 的写法为什么要三态？loader 里 `throw redirect` 有什么坑，middleware 怎么解决？Data 模式要开 flag 吗？）
3. 路由参数从 `/orders/o1` 变成 `/orders/o2`，组件里的 state 会不会重置？（追问：怎么强制重置？effect 依赖该怎么写？Vue 里同样的坑叫什么？）
4. `useSearchParams` 更新一个筛选条件时其他参数丢了，为什么？（追问：函数式更新和同一 tick 多次调用的限制；什么时候用 `replace: true`？）
5. v6 → v7 → v8 导入路径变了什么，`react-router-dom` 还能用吗？（追问：v6 还维护吗？v8 升级前要开哪些 flag？为什么写 `react-router` + `react-router/dom` 同时兼容 v7 / v8？）

#### 生产写法要点

- 登录态用三态（`checking / authed / guest`），刷新时异步恢复；受保护分组路由用 `middleware: [requireAuth]`（Data 模式）或 loader `throw redirect`，并说明父子 loader 并行的后果。
- `redirect` 目标来自 URL 参数时必须做 `safeRedirect` 校验（只允许站内路径），因为 `redirect` 接受绝对 URL 会整页跳转外域。
- `navigate(-1)` 用 `location.key === "default"` 兜底；`setSearchParams` 用函数式更新并在筛选变更时重置 `page`。
- 每个路由树至少一个根 `errorElement`；loader 里 `throw data(…, { status: 404 })` 并用 `isRouteErrorResponse` 区分。
- 表单页离开前确认用 `useBlocker` + `useBeforeUnload`；提交用 `<Form>` / `useFetcher` 拿 pending 状态，而不是手写 `submitting`。
- 前端权限只是体验，后端必须鉴权；按钮「不渲染」不等于「更安全」。
- 大页面用路由级 `lazy`；类型上 `useLoaderData<typeof loader>()`。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| Data 模式 loader / middleware（渲染前拦截） | `router.beforeEach` 返回值写法 + `meta.requiresAuth` | https://router.vuejs.org/guide/advanced/navigation-guards.html（2026-09-16） | 两者都在导航提交前运行；Vue 的 `next()` 仍可用但官方称是错误来源 |
| 声明式 RequireAuth（渲染中拦截） | 无直接对应 | — | Vue Router 守卫都在导航前；组件内 `onBeforeRouteUpdate` 也在导航前 |
| loader + `useLoaderData` | 导航后 `watch(route.params.id)` / 导航前 `beforeRouteEnter`；v5 `defineBasicLoader`【尝鲜】 | https://router.vuejs.org/guide/advanced/data-fetching.html、/data-loaders/（2026-09-16） | Vue 主流仍是组件内取数 |
| `useBlocker` | `onBeforeRouteLeave(() => false)` | https://router.vuejs.org/guide/advanced/composition-api.html（2026-09-16） | Vue 返回 `false` 取消导航即可 |
| `NavLink` `active` + `aria-current` | `<RouterLink>` `router-link-active` / `router-link-exact-active`；`useLink` | https://router.vuejs.org/guide/advanced/composition-api.html（2026-09-16） | 两者都默认加类名 |
| `useNavigate` / `navigate(-1)` | `useRouter().push / replace / go(-1)`，返回 Promise | https://router.vuejs.org/guide/essentials/navigation.html（2026-09-16） | Vue 同样没有「无上一页」兜底 |
| 路由级 `lazy` | `component: () => import()` | https://router.vuejs.org/guide/advanced/lazy-loading.html（2026-09-16） | Vue 明确不要用 `defineAsyncComponent` 作路由组件 |
| 同位置同组件实例复用 | 同 `<RouterView>` 复用实例，需 `watch` params 或 `:key="route.fullPath"` | https://router.vuejs.org/guide/advanced/data-fetching.html（2026-09-16） | 两边都是「同位置复用」 |
| `createBrowserRouter` 配置数组 | `createRouter({ routes })`；v5 文件路由【较新】 | https://router.vuejs.org/file-based-routing/（2026-09-16） | 「配置 vs 组件树」不是框架差异 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-18-1 | 严重 | 讲错 | 绝对化 | 「根本没有全局导航钩子」「不存在，也不会有」「导航不是可被拦截的独立事件」 | src/topics/18-routing/react/Example.tsx:31; src/topics/18-routing/react/Example.tsx:145-147; src/topics/18-routing/vue/router.ts:18; src/topics/18-routing/vue/Example.vue:32 | 根本没有「全局导航钩子」这种东西 | 只对声明式模式成立：Data 模式 7.9 起有 middleware（父→子依次执行、每次客户端导航都跑、可 throw redirect），loader 与 useBlocker 也都在渲染前拦截；v8 默认开启 | https://reactrouter.com/7.18.4/how-to/middleware（逐字「Client middlewares will run on every client navigation, regardless of whether there are loaders to run」）；node_modules/react-router/dist/development/data-CjO11-hU.d.ts:747 | 二、核心概念 |
| R2-18-2 | 严重 | 讲错 | 绝对化 | 「路由表是组件树 vs 配置」被讲成框架差异 | src/topics/18-routing/react/Example.tsx:30; src/topics/18-routing/react/Example.tsx:5; src/topics/18-routing/react/Example.tsx:24-27; src/topics/18-routing/vue/router.ts:4-8 | React 的路由表本身就是组件树 | v6 起 `<Routes>` 用 createRoutesFromChildren 把子元素转成配置对象，子元素只能是 `<Route>` / Fragment（invariant）；Data 模式本身就是配置数组；真区别是渲染中拦截 vs 渲染前拦截；v5 自定义 `<PrivateRoute>` 应标【旧写法】 | node_modules/react-router/dist/development/chunk-BV7QT456.mjs:7298; node_modules/react-router/dist/development/chunk-BV7QT456.mjs:7314; https://reactrouter.com/7.18.4/start/data/data-loading（逐字「loaders are called before the route component is rendered」） | 四、关键区别 |
| R2-18-3 | 严重 | 未讲 | Router | 已定主线 Data 模式的启动代码与 loader 守卫一处都没有 | — | — | createMemoryRouter / createBrowserRouter + RouterProvider（react-router/dom）+ loader + useLoaderData + Component 全缺；文件头承诺的「登录态守卫」在主线模式下的写法（分组路由 loader 里 throw redirect）只有 :153 一句「本课不展开」 | grep0:createMemoryRouter\|RouterProvider\|useLoaderData | 二、核心概念 |
| R2-18-4 | 严重 | 讲错 | Router | 「React 没有这个实例复用坑」 | src/topics/18-routing/react/Example.tsx:337; src/topics/18-routing/react/Example.tsx:335-336; src/topics/18-routing/vue/OrderDetailPage.vue:20 | React 没有这个「实例复用坑」 | 同一 Component 在同一位置 → 实例复用，useState / effect 保留；useParams 拿到新 id 不等于组件重挂；解法 key={id} 强制重挂或写对 effect 依赖 | https://react.dev/learn/preserving-and-resetting-state（逐字「Same component at the same position preserves state.」「You can force a subtree to reset its state by giving it a different key.」） | 六、易错点 |
| R2-18-5 | 严重 | 讲错 | 安全a11y | 「按钮不渲染比 disabled 更安全、F12 里都翻不出来」 | src/topics/18-routing/react/Example.tsx:369; src/topics/18-routing/vue/OrderDetailPage.vue:55 | 比 disabled 更安全 | 前端权限只影响体验，请求可绕过 UI 直接发；鉴权必须由后端逐请求完成；应改口并指向 35（应迁入） | ③ OWASP https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html（逐字「Developers must never rely on client-side access control checks」）；course-map §6 F | 七、生产环境注意 |
| R2-18-6 | 概念 | 讲错 | Router | loader 守卫「好处是不会先闪一下受保护页面」 | src/topics/18-routing/react/Example.tsx:154; src/topics/18-routing/react/Example.tsx:151-155 | 不会先闪一下受保护页面 | RequireAuth 未登录时本来就不渲染 children；渲染前拦截的真正优势是可 await 异步检查、检查完成前不提交导航、子路由 loader 不发请求；父子 loader 并行的坑也未提 | https://reactrouter.com/7.18.4/start/data/data-loading（逐字「loaders are called before the route component is rendered」）；https://reactrouter.com/7.18.4/api/data-routers/createBrowserRouter（逐字「running loaders in parallel」） | 四、关键区别 |
| R2-18-7 | 概念 | 讲错 | Router | 「NavLink 高亮逻辑写在 JS 里」漏掉默认 active 类与 aria-current | src/topics/18-routing/react/Example.tsx:120; src/topics/18-routing/react/Example.tsx:9; src/topics/18-routing/vue/Example.vue:50 | 高亮逻辑写在 JS 里 | NavLink 激活时默认加 className "active" 与 aria-current="page"，CSS 命中即可；函数式 style / className 只是 Tailwind / CSS-in-JS 场景的可选项，与 Vue 的 router-link-active 同型 | node_modules/react-router/dist/development/chunk-BV7QT456.mjs:10678; node_modules/react-router/dist/development/chunk-BV7QT456.mjs:10721; node_modules/react-router/dist/development/chunk-BV7QT456.mjs:10731；https://reactrouter.com/7.18.4/api/components/NavLink | 三、Vue 对照 |
| R2-18-8 | 概念 | 未讲 | Router | Data 模式加分点整组缺失：errorElement / useRouteError、action + Form + useFetcher、useNavigation、Await 流式、lazy、useBlocker、handle / useMatches、middleware【较新】、父子 loader 并行 | — | — | 18 是 Router 盲点主责题；声明式模式没有 useNavigation / useBlocker / loader，这些只能在 Data 主线里讲；middleware 在 Data 模式无需 flag | grep0:errorElement\|useRouteError\|useFetcher\|useNavigation\|useBlocker\|useMatches\|middleware\|<Await\|lazy\|dataStrategy | 二、核心概念 |
| R2-18-9 | 概念 | 讲错 | 旧写法 | 从 react-router-dom 导入；「v7 声明式 API 与 v6 完全相同」；v6 EOL 与 v8 未提 | src/topics/18-routing/react/Example.tsx:507; src/topics/18-routing/react/Example.tsx:55; src/topics/18-routing/react/Example.tsx:508 | 声明式 API 与 v6 完全相同 | v7 推荐从 react-router 导入（react-router-dom 7.x 仅 2 行转发），v8 删除该包；v6 与 Remix v2 官方 EOL；版本说明应为「主线 v7，写法兼容 v8；v6 已 EOL」 | facts-versions.md C（react-router-dom/dist/index.mjs）；https://reactrouter.com/8.4.0/upgrading/v7（逐字「React Router v8 removes the react-router-dom re-export package」）；https://remix.run/blog/react-router-v8（逐字「officially marking React Router v6 and Remix v2 as End of Life」） | 八、旧写法对照 |
| R2-18-10 | 生产 | 未标简化 | 生产简化 | 登录态二态无 checking；navigate(-1) / router.back() 无兜底；setSearchParams 整体替换未说明；safeRedirect 只有注释无实现 | src/topics/18-routing/react/Example.tsx:162; src/topics/18-routing/react/Example.tsx:355; src/topics/18-routing/react/Example.tsx:365; src/topics/18-routing/react/Example.tsx:277-283; src/topics/18-routing/react/Example.tsx:237-239; src/topics/18-routing/vue/OrderDetailPage.vue:34; src/topics/18-routing/vue/LoginPage.vue:28-30 | loggedIn: boolean | 刷新时登录态需异步恢复，同步布尔会误判为 guest；location.key === "default" 表示无上一页应跳列表页；setter 内部 navigate("?" + params) 整体替换，需函数式更新并在筛选变更时重置页码；redirect / navigate 目标来自 URL 必须校验站内路径 | facts-versions.md C（chunk-BV7QT456.mjs:44, 144, 10949-10956）；https://reactrouter.com/7.18.4/api/hooks/useNavigate（逐字「there may not be a History entry to go back or forward to」）；https://reactrouter.com/7.18.4/api/utils/redirect（逐字「the application should validate any user-supplied inputs to redirects」） | 七、生产环境注意 |
| R2-18-11 | 概念 | 缺标签 | Vue现行写法 | beforeEach 保留 next() 三参数并把返回值写法说成次要；「忘调 next 就挂起」被当成 Vue 通病；vue-router 5 文件路由与实验数据加载器未提 | src/topics/18-routing/vue/router.ts:82; src/topics/18-routing/vue/router.ts:88-98; src/topics/18-routing/react/Example.tsx:201-203 | 保留经典的 next(...) 三参数写法 | 官方：next 是「previous versions … common source of mistakes」，推荐返回值（false / 路由位置 / undefined·true）；「挂起」只属于三参数【旧写法】；v5 文件路由【较新】、`vue-router/experimental` defineBasicLoader【尝鲜】可与 loader 对照 | https://router.vuejs.org/guide/advanced/navigation-guards.html（逐字「this was a common source of mistakes and went through an RFC to remove it」）；facts-versions.md D；https://router.vuejs.org/data-loaders/ | 三、Vue 对照 |
| R2-18-12 | 小问题 | 措辞 | 其它 | 模板残留「（没有一一对应关系）」11 处；交叉引用需补 32 / 35，且 :486 的「（17 题）」应为 15 题（Context value 用 useMemo 的内容在 src/topics/15-context/react/Example.tsx:128-138，17 题无 Context 内容；本轮首版误记为核对无误，第 4 步对比时纠正）；Activity 缺【较新】标签 | src/topics/18-routing/react/Example.tsx:31; src/topics/18-routing/react/Example.tsx:145; src/topics/18-routing/react/Example.tsx:203; src/topics/18-routing/react/Example.tsx:372; src/topics/18-routing/react/Example.tsx:426; src/topics/18-routing/react/Example.tsx:489; src/topics/18-routing/vue/router.ts:18; src/topics/18-routing/vue/router.ts:50; src/topics/18-routing/vue/OrderDetailPage.vue:54; src/topics/18-routing/vue/SettingsPage.vue:14; src/topics/18-routing/vue/Example.vue:32; src/topics/18-routing/react/Example.tsx:468; src/topics/18-routing/react/Example.tsx:486 | （没有一一对应关系） | 机械贴在不相关句后；开放重定向 :237 与权限 :369 应指向 35，Activity :468 与路由级 lazy 应指向 32；现有 03 / 05 / 09 / 13 / 15 / 16 / 17 引用逐条核对无误 | course-map §6 H；course-map §6 I | 六、易错点 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | React Router 三种模式怎么选，你项目用哪种？（追问：声明式为何没有 useNavigation / useBlocker；Data 模式与 v6.4 data router 的关系） | 部分 | src/topics/18-routing/react/Example.tsx:151-155; src/topics/18-routing/react/Example.tsx:507-508 | 只知道「另有 createBrowserRouter 数据路由」；三种模式定位、哪些 hook 仅 Data 可用、Framework 模式全无 |
| 2 | 登录守卫怎么做？（追问：RequireAuth 为何要三态；loader throw redirect 有什么坑、middleware 怎么解决；Data 模式要开 flag 吗） | 部分 | src/topics/18-routing/react/Example.tsx:137-222 | 能答 RequireAuth 包 element；三态、父子 loader 并行、middleware 及 flag 全无 |
| 3 | 路由参数从 /orders/o1 变成 /orders/o2，组件里的 state 会不会重置？（追问：怎么强制重置；effect 依赖怎么写；Vue 里同样的坑） | 不能 | src/topics/18-routing/react/Example.tsx:335-337 | 课件给出相反答案「React 没有这个坑」；key={id} 与依赖数组解法缺失；Vue 侧 computed 跟参数已讲对 |
| 4 | useSearchParams 更新一个筛选条件时其他参数丢了，为什么？（追问：函数式更新与同 tick 多次调用的限制；何时用 replace: true） | 不能 | — | setter 整体替换、函数式更新、同 tick 不累积、筛选变更重置页码、replace 取舍全无 |
| 5 | v6 → v7 → v8 导入路径变了什么，react-router-dom 还能用吗？（追问：v6 还维护吗；v8 升级前要开哪些 flag；为何写 react-router + react-router/dom） | 不能 | src/topics/18-routing/react/Example.tsx:55; src/topics/18-routing/react/Example.tsx:507 | 课件自己从 react-router-dom 导入且称「与 v6 完全相同」；v6 EOL、v8 flag、react-router/dom 全无 |

#### 18 题样板修改点核对

| # | 规格修改点（缩写） | 现状（file:line） | 随 Data 主线是否要调整 | 调整为 |
|---|---|---|---|---|
| 1 | 导入统一 react-router，RouterProvider 从 react-router/dom；演示用 createMemoryRouter；讲导入演变 | src/topics/18-routing/react/Example.tsx:43-55 全部从 react-router-dom 导入；RouterProvider / createMemoryRouter 0 处 | 是 | 主线代码 `import { createMemoryRouter, redirect } from 'react-router'` + `import { RouterProvider } from 'react-router/dom'`（dom-export.d.ts:7-8, 173）；并排声明式版的 MemoryRouter / Routes / Route 也改从 react-router 导入；演变说明照做。壳应用挂载方式不变：RouterProvider 内部同样渲染 `<Router>`（chunk-BV7QT456.mjs:6991）并受 :7143 invariant 约束，仍需 topicRegistry.ts:138 `isolateReactRoot` + ReactIsolatedMount |
| 2 | 重写「最重要的区别」为渲染中拦截 vs 渲染前拦截；`<Routes>` 子元素限制；v5 PrivateRoute【旧写法】 | src/topics/18-routing/react/Example.tsx:23-33 仍是「组件树 vs 配置」「没有全局钩子」 | 是 | 主线换位：先讲 Data 模式 loader / middleware 与 Vue beforeEach 同属「渲染前拦截」（导航提交前、可 await、被拦 URL 不入栈），再讲声明式 RequireAuth 属「渲染中拦截」作并排；`<Routes>` 子元素限制（chunk-BV7QT456.mjs:7314）与 v5 PrivateRoute 放到并排段 |
| 3 | 守卫加分点：loader throw redirect【主流】+ 父子并行坑；middleware【较新】三点；useBlocker | src/topics/18-routing/react/Example.tsx:151-155 一句带过、无代码；middleware / useBlocker 0 处 | 是 | 升为主线写法：受保护分组路由（无 path）的 loader 里 `throw redirect('/login?redirect=…')` 作主线代码并说明父子 loader 并行；middleware（Data 模式无需 flag，data-CjO11-hU.d.ts:747）作【较新】并排；useBlocker 照做 |
| 4 | RequireAuth 三态 checking / authed / guest；修正「loader 不闪」；渲染前拦截真正优势 | src/topics/18-routing/react/Example.tsx:161-167 `loggedIn: boolean` 二态；:153-155「不会先闪一下」 | 是 | 主线：loader / middleware 里 `await auth.check()`，天然没有 checking 态，讲清「检查完成前不提交导航、子 loader 不发出」；RequireAuth 三态放并排版，解释声明式无 pending API 所以刷新时需要 checking；「不闪」修正照做 |
| 5 | 修正「React 没有实例复用坑」；两种解法；测试证明 | src/topics/18-routing/react/Example.tsx:335-337; src/topics/18-routing/vue/OrderDetailPage.vue:20 | 否 | 照做：`key={id}` 或写对依赖；补一句「Data 主线下 loader 随 params 重跑，但组件 state 仍保留」；测试交 34 题 |
| 6 | 修正 NavLink 对比：默认 active + aria-current；函数式 style / className 用于 Tailwind 等 | src/topics/18-routing/react/Example.tsx:118-125; src/topics/18-routing/react/Example.tsx:522-526 | 否 | 照做（chunk-BV7QT456.mjs:10678, 10721, 10731）；与模式无关 |
| 7 | 修正按钮权限安全表述 | src/topics/18-routing/react/Example.tsx:367-369; src/topics/18-routing/vue/OrderDetailPage.vue:55 | 否 | 照做并指向 35；与模式无关 |
| 8 | navigate(-1) 兜底 location.key === 'default' | src/topics/18-routing/react/Example.tsx:355; src/topics/18-routing/react/Example.tsx:365; src/topics/18-routing/vue/OrderDetailPage.vue:34; src/topics/18-routing/vue/OrderDetailPage.vue:47 | 否 | 照做；memory history 首条 key 同为 "default"（chunk-BV7QT456.mjs:44, 144），Data 模式下 useNavigate / useLocation 用法不变；Vue 侧 router.back() 同样加兜底 |
| 9 | setSearchParams 在旧参数基础上修改；重置页码；push vs replace | src/topics/18-routing/react/Example.tsx:277-283 | 否 | 照做：`setSearchParams(prev => { … })`（chunk-BV7QT456.mjs:10949-10956）；与模式无关 |
| 10 | 实现 safeRedirect；说明 throw redirect 会整页跳外站 | src/topics/18-routing/react/Example.tsx:237-239; src/topics/18-routing/vue/LoginPage.vue:28-30 仅注释 | 是 | 主线：登录 action / loader 里 `throw redirect(safeRedirect(returnTo))`，因 redirect 接受绝对 URL（api/utils/redirect 逐字）；声明式版 `navigate(safeRedirect(…), { replace: true })` 并排；函数实现与单测归 35 题、18 引用 |
| 11 | 清理模板残留；版本说明改「主线 v7，兼容 v8；v6 EOL」 | 「没有一一对应关系」11 处（见 R2-18-12）；src/topics/18-routing/react/Example.tsx:507-508 | 否 | 照做；版本说明措辞加「主线 Data 模式」即可 |
| 12 | Vue：beforeEach 用返回值；v5 数据加载器对照【尝鲜】 | src/topics/18-routing/vue/router.ts:81-82; src/topics/18-routing/vue/router.ts:88-98 用 next() | 否 | 照做；Data 主线下 defineBasicLoader 与 loader 的对照更直接，仍标【尝鲜】 |
| 13 | 可选：React 19.3 `<ViewTransition>`【尝鲜】 | 0 处 | 否 | 照做为可选一句（19.2.8 不导出，facts A）；另可提 `<Link viewTransition>` 选项 |

### 19. 异步提交与防重复

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 文件头承诺：`submitting` 布尔，`try / finally` 恢复 | https://react.dev/reference/react-dom/components/form#handle-form-submission-with-an-event-handler | 已讲对 | src/topics/19-async-submit/react/Example.tsx:5; :42; :56-77 | — |
| 主流 | 文件头承诺：两层防重复 `disabled` + 处理函数 guard；Enter / 测试可绕过 disabled | https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form | 已讲对 | src/topics/19-async-submit/react/Example.tsx:6; :48-54; :107-111 | — |
| 主流 | 文件头承诺：`result: { type, message } \| null` 判别建模 | https://react.dev/learn/typescript | 已讲对 | src/topics/19-async-submit/react/Example.tsx:7-8; :29-32; :116-120 | 大纲建议单一 `status` 联合；课件用 `submitting` + `result`，无非法组合，可接受 |
| 主流 | 文件头承诺：成功清空、失败保留 | https://react.dev/reference/react-dom/components/input | 已讲对 | src/topics/19-async-submit/react/Example.tsx:9; :63-69 | 未提非受控 `form.reset()`、成功后导航（→18） |
| 主流 | 文件头承诺：React 19 `useActionState` / `useTransition` 是「新趋势」 | https://react.dev/reference/react/useActionState | 缺标签 | src/topics/19-async-submit/react/Example.tsx:10-11; src/topics/19-async-submit/vue/Example.vue:11-12 | R2-19-4 |
| 主流 | 文件头承诺：Vue `ref(false)` + `try / finally`、`v-model` | https://vuejs.org/guide/essentials/forms.html | 已讲对 | src/topics/19-async-submit/vue/Example.vue:38-41; :44-67 | — |
| 主流 | 文件头承诺：流程控制框架无关，差异只在状态 API 与绑定 | — | 已讲对 | src/topics/19-async-submit/react/Example.tsx:18-19 | 大纲未列 |
| 主流 | 手写骨架：`onSubmit` + `preventDefault` + `async` + `try / catch / finally` | https://react.dev/reference/react-dom/components/form#handle-form-submission-with-an-event-handler | 已讲对 | src/topics/19-async-submit/react/Example.tsx:45-46; :58-77 | — |
| 主流 | 事件类型 `FormEvent<HTMLFormElement>`（→28） | https://react.dev/learn/typescript | 已讲对 | src/topics/19-async-submit/react/Example.tsx:21; :45 | — |
| 主流 | 渲染快照：state guard 在同一渲染内读旧值；`useRef` 锁 | https://react.dev/learn/state-as-a-snapshot | 未讲 | — | R2-19-1 |
| 主流 | 过期响应 / 卸载后回写：`ignore` / `AbortController`（→27） | https://react.dev/learn/state-as-a-snapshot | 未讲 | — | R2-19-2 |
| 主流 | 错误分层（网络可重试 vs 4xx 字段错误）；错误进 state 不 throw 到边界（→20） | https://react.dev/reference/react/Component | 未讲 | — | R2-19-3 |
| 主流 | 错误对象类型收窄 `err instanceof Error` | — | 已讲对 | src/topics/19-async-submit/react/Example.tsx:69 | 大纲未列 |
| 主流 | Actions 对照：`useActionState` 的 `isPending` 与串行排队、`useFormStatus().pending`、`useOptimistic`（→31） | https://react.dev/reference/react/useActionState；/reference/react-dom/hooks/useFormStatus | 未讲 | — | R2-19-4 |
| 主流 | 非表单按钮：`startTransition(async)` + `isPending`；`await` 后再包；抛错进边界 | https://react.dev/reference/react/useTransition；node_modules/@types/react/index.d.ts:1835 | 未讲 | — | R2-19-4 |
| 主流 | 只作引用：`useMutation.isPending`（→30）、`useFetcher` / `useNavigation`（→18） | https://reactrouter.com/7.18.4/how-to/fetchers | 未讲 | — | R2-19-5 |
| 主流 | 前端防重复 ≠ 幂等：服务端幂等键 / 唯一约束 | 课程结论 | 未讲 | — | R2-19-6 |
| 旧写法 | React 18 → 19：18 无 Actions、`startTransition` 只同步；19 两条路并存 | https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-19-4 |
| 主流 | Vue：`@submit.prevent` + `ref(false)` + `:disabled` | https://vuejs.org/guide/essentials/forms.html | 已讲对 | src/topics/19-async-submit/vue/Example.vue:44-47; :77-79; :104 | — |
| 主流 | Vue：`async` handler 的错误（含 Promise 拒绝）由 `onErrorCaptured` / `errorHandler` 接住 | https://vuejs.org/api/composition-api-lifecycle.html；node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:205-213 | 未讲 | — | R2-19-7 |
| 主流 | Vue：`router.push()` 返回 Promise 可 `await`；无 Actions 对应物 | https://router.vuejs.org/guide/essentials/navigation.html | 未讲 | — | R2-19-7 |
| 主流 | 大纲未列：`type="number"` 受控值为字符串、`"12."` 被规范成空串、`inputMode="decimal"`；Vue 自动 `.number` | https://react.dev/reference/react-dom/components/input；https://vuejs.org/guide/essentials/forms.html | 已讲对 | src/topics/19-async-submit/react/Example.tsx:36-39; src/topics/19-async-submit/vue/Example.vue:33-37 | 大纲未列；Vue 句逐字「The number modifier is applied automatically if the input has type="number"」核实一致；属 07 主责 |
| 主流 | 大纲未列：提交中同时禁用输入框 | — | 已讲对 | src/topics/19-async-submit/react/Example.tsx:93; :103 | 大纲未列；UX 取舍未说明 |
| 主流 | a11y：错误提示 `role="alert"`、字段错误 `aria-describedby`（→35） | https://vuejs.org/guide/best-practices/accessibility.html#forms | 未讲 | — | R2-19-6 |

#### 面试 5 问

1. 怎么防止用户双击提交按钮导致重复请求？（追问：只靠 `disabled` 为什么不够？为什么连续两次点击都读到 `submitting === false`？`useRef` 锁为什么不会重渲染？）
2. 提交中、成功、失败三种状态你怎么建模？（追问：为什么用判别联合而不是多个布尔？TS 里 `useState` 怎么标类型？）
3. 请求返回时用户已经离开页面或改了输入，怎么处理？（追问：`ignore` 标志和 `AbortController` 的区别？成功回调该不该覆盖表单？）
4. React 19 的 `useActionState` / `useFormStatus` 怎么替代手写 `submitting`？（追问：重复提交在 Action 里会怎样？`useFormStatus` 为什么要放子组件？还要手写 `submitting` 吗？）
5. 提交出错时该 throw 给 Error Boundary 还是放进 state？（追问：事件处理器里的错误边界能捕到吗？`startTransition` 里呢？）

#### 生产写法要点

- `submitting` 用 state（驱动 UI）+ `useRef` 锁（防快照期重入）双保险；handler 顶部提前返回。
- 提交请求带 `AbortController`，组件卸载 / 重新提交时取消旧请求；成功回调前检查是否已被取代（→27）。
- 错误分类展示：字段级错误映射到 `aria-describedby`，全局错误用 `role="alert"`（→35）；网络错误给「重试」。
- React 19 项目优先 `<form action>` + `useActionState` + `useFormStatus`（→31）；非表单按钮用 `startTransition(async)` + `isPending`。
- 有服务端状态层时用 `useMutation`（→30）或路由 `action` / `useFetcher`（→18）承接 pending 与失效重取，不重复造轮子。
- 服务端幂等键 / 唯一约束是最终防线，前端防重复只是体验。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `onSubmit` + `e.preventDefault()` | `@submit.prevent` | https://vuejs.org/guide/essentials/forms.html（2026-09-16） | Vue 修饰符替代手写 preventDefault |
| `useState` 的 `submitting` + `useRef` 锁 | `ref(false)`，同步读到最新值，无快照问题 | https://vuejs.org/guide/essentials/forms.html（2026-09-16） | Vue 响应式对象即时更新，无需 ref 锁 |
| `useActionState` / `useFormStatus` / `useOptimistic` | 无对应物 | — | Vue 无并发渲染层与表单 Action 原语 |
| `startTransition(async)` + `isPending` | 无对应物；`async` 函数自管 loading | — | 同上 |
| 事件处理器错误需 `try/catch` | `onErrorCaptured` 可捕获事件处理器错误 | https://vuejs.org/api/composition-api-lifecycle.html（2026-09-16） | 真实差异 |
| `navigate()` 成功后跳转 | `await router.push()` | https://router.vuejs.org/guide/essentials/navigation.html（2026-09-16） | Vue 导航返回 Promise |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-19-1 | 概念 | 未讲 | 并发 | state guard 受渲染快照限制：同一渲染内重入（程序化 `requestSubmit` / 循环）读到旧 `submitting`；生产加 `useRef` 锁（改 ref 不触发渲染→12） | — | — | 大纲主流；课件 :49-52 把 state guard 称为「兜底」却未说明快照限制；真实用户双击是否复现见 P-19-1 | https://react.dev/learn/state-as-a-snapshot（逐字「A state variable's value never changes within a render, even if its event handler's code is asynchronous」）；grep0:useRef\|快照\|snapshot | 六、易错点 |
| R2-19-2 | 生产 | 未标简化 | 生产简化 | `await` 后无条件 `setResult` / 清空输入：组件卸载或请求被取代时回写；未标「演示简化」，mockApi 支持 `signal` 却未用 `AbortController` / `ignore`（→27） | src/topics/19-async-submit/react/Example.tsx:63-66; src/topics/19-async-submit/vue/Example.vue:56-59 | setResult({ type: 'success' | 大纲主流；生产做法缺失 | https://react.dev/learn/state-as-a-snapshot（逐字「Event handlers created in the past have the state values from the render in which they were created」）；src/shared/mockApi.ts:91-93；grep0:AbortController\|ignore\|卸载\|27[[:space:]]题 | 七、生产环境注意 |
| R2-19-3 | 概念 | 未讲 | 其它 | 错误未分层：网络错误与服务端校验错误同样处理，无「可重试 vs 字段错误」；未说明提交错误应进 state 而非 throw 给边界（边界不捕获事件处理器→20） | — | — | 大纲主流；20 题无人引用 | https://react.dev/reference/react/Component（逐字「Error boundaries do not catch errors for: Event handlers」）；grep0:4xx\|5xx\|分类\|重试\|错误边界\|20[[:space:]]题 | 五、常见追问与回答要点 |
| R2-19-4 | 概念 | 缺标签 | Actions | Actions 家族只剩一句名词：无【主流】/ 19.0 标签；未讲 `useActionState` 的 `isPending` 与串行排队、`useFormStatus` 须在 `<form>` 子组件、`useOptimistic`、`startTransition(async)` + `isPending`、React 18 只接同步函数【旧写法】；未指向 31 | src/topics/19-async-submit/react/Example.tsx:10-11; src/topics/19-async-submit/vue/Example.vue:11-12 | React 19 的 useActionState / useTransition | 规格 §7 19.0 核心【主流】；evidence 标签判定：手写与 Actions 并列 | https://react.dev/reference/react/useActionState（逐字「React queues and executes multiple calls to formAction sequentially」）；https://react.dev/reference/react-dom/hooks/useFormStatus（逐字「must be called from a component that is rendered inside a <form>」）；https://react.dev/reference/react/useTransition（逐字「You must wrap any state updates after any async requests in another startTransition」）；grep0:useFormStatus\|useOptimistic\|isPending\|startTransition\|31[[:space:]]题 | 二、核心概念 |
| R2-19-5 | 概念 | 未讲 | 交叉引用 | 无一句指向服务端状态层 / 路由层替代：`useMutation.isPending`（→30）、`useFetcher.state` / `useNavigation`（→18） | — | — | 大纲主流只作引用；30 题 :21 已讲 mutation `isPending` 但 19 未回指 | https://reactrouter.com/7.18.4/how-to/fetchers（逐字「fetcher.state !== "idle"」）；grep0:useMutation\|useFetcher\|useNavigation\|30[[:space:]]题\|18[[:space:]]题 | 五、常见追问与回答要点 |
| R2-19-6 | 生产 | 未讲 | 生产简化 | 无「前端防重复 ≠ 幂等」：服务端幂等键 / 唯一约束是最终防线；错误提示无 `role="alert"` / `aria-describedby`（→35） | — | — | 大纲主流 + 生产要点；与 18 题「前端权限只影响体验」同理 | 课程结论（无单一官方页）；grep0:幂等\|aria-\|role="alert"\|35[[:space:]]题 | 七、生产环境注意 |
| R2-19-7 | 概念 | 未讲 | Vue现行写法 | Vue 对照缺两点：`async` handler 的 Promise 拒绝也进 `onErrorCaptured` / `errorHandler`（React 事件处理器必须自己 `try / catch`）；`await router.push()` 后再结束 submitting | — | — | 大纲主流 Vue 对照；源码证实 Promise 拒绝被接住（大纲待核实项可关闭，见 P-19-4） | node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:205-213（`callWithAsyncErrorHandling` 对 Promise 结果 `.catch` → `handleError`）；https://router.vuejs.org/guide/essentials/navigation.html（逐字「return a Promise that allows us to wait till the navigation is finished」）；grep0:onErrorCaptured\|errorHandler\|router\.push | 三、Vue 对照 |
| R2-19-8 | 小问题 | 措辞 | 交叉引用 | 只引用 07，未引用 20 / 27 / 30 / 31；标题「工业界标准写法」在 19 有 Actions 后宜改为「手写写法【主流】，与 Actions 并列」 | src/topics/19-async-submit/react/Example.tsx:2 | submitting 状态的工业界标准写法 | 规格 §5 I | course-map §2（Actions 主责 31） | 参考 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 怎么防止用户双击提交按钮导致重复请求？（追问：只靠 `disabled` 为什么不够？为什么连续两次点击都读到 `submitting === false`？`useRef` 锁为什么不会重渲染？） | 部分 | src/topics/19-async-submit/react/Example.tsx:48-54; :107-111 | 缺渲染快照与 `useRef` 锁 |
| 2 | 提交中、成功、失败三种状态你怎么建模？（追问：为什么用判别联合而不是多个布尔？TS 里 `useState` 怎么标类型？） | 能 | src/topics/19-async-submit/react/Example.tsx:24-32; :43 | — |
| 3 | 请求返回时用户已经离开页面或改了输入，怎么处理？（追问：`ignore` 标志和 `AbortController` 的区别？成功回调该不该覆盖表单？） | 不能 | — | 全缺（→27 亦未引用） |
| 4 | React 19 的 `useActionState` / `useFormStatus` 怎么替代手写 `submitting`？（追问：重复提交在 Action 里会怎样？`useFormStatus` 为什么要放子组件？还要手写 `submitting` 吗？） | 不能 | — | 只有名词（:10-11），无 `isPending` / 排队 / 子组件约束 |
| 5 | 提交出错时该 throw 给 Error Boundary 还是放进 state？（追问：事件处理器里的错误边界能捕到吗？`startTransition` 里呢？） | 部分 | src/topics/19-async-submit/react/Example.tsx:67-69 | 课件做法是进 state，但没说边界不捕获事件处理器、`startTransition` 例外 |

### 20. 错误边界

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 定义：渲染抛错默认移除整棵 UI，边界隔离子树 | https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary | 已讲对 | src/topics/20-error-handling/react/Example.tsx:108-110; src/topics/20-error-handling/react/ErrorBoundary.tsx:75-76 | 「默认移除整棵 UI」未明说 |
| 主流 | 文件头承诺：只能 class；`static getDerivedStateFromError` / `componentDidCatch` | https://react.dev/reference/react/Component；node_modules/@types/react/index.d.ts:1219, 1225 | 已讲对 | src/topics/20-error-handling/react/Example.tsx:5-7; src/topics/20-error-handling/react/ErrorBoundary.tsx:41-51 | 「唯一」措辞见 R2-20-6 |
| 主流 | 文件头承诺：能捕获渲染 / 生命周期 / 构造函数 | https://react.dev/reference/react/Component | 已讲对 | src/topics/20-error-handling/react/ErrorBoundary.tsx:9-12; src/topics/20-error-handling/react/Example.tsx:8 | — |
| 主流 | 能捕获：`use(promise)` 拒绝、`lazy` 失败（→32）；Transition / Action 内抛错（→31） | https://react.dev/reference/react/use；/reference/react/useTransition#displaying-an-error-to-users-with-an-error-boundary | 未讲 | — | R2-20-1 |
| 主流 | 文件头承诺：不能捕获事件处理器 / 异步 / SSR / 自身 | https://react.dev/reference/react/Component | 讲了但错 | src/topics/20-error-handling/react/Example.tsx:9; src/topics/20-error-handling/react/ErrorBoundary.tsx:13-17; src/topics/20-error-handling/vue/Example.vue:10 | R2-20-1（异步项漏 19 的 `startTransition` 例外） |
| 主流 | 事件 / 异步错误处理：`try / catch` 转 state；或 `useErrorBoundary().showBoundary` | https://github.com/bvaughn/react-error-boundary | 缺标签 | src/topics/20-error-handling/react/Example.tsx:79-86 | R2-20-2（`try / catch` 已讲；`showBoundary` 未讲） |
| 主流 | 文件头承诺：`react-error-boundary` 定位；官方明示「不必自己写 class」 | https://react.dev/reference/react/Component；https://github.com/bvaughn/react-error-boundary | 缺标签 | src/topics/20-error-handling/react/Example.tsx:6-7; src/topics/20-error-handling/react/ErrorBoundary.tsx:5-7 | R2-20-2 |
| 主流 | `<ErrorBoundary>` API：`fallback` / `fallbackRender` / `FallbackComponent` / `onError` / `onReset` / `resetKeys` | https://github.com/bvaughn/react-error-boundary | 缺标签 | src/topics/20-error-handling/react/ErrorBoundary.tsx:6; :65 | R2-20-2（仅提 fallbackRender / onReset 名） |
| 主流 | 重置：`resetErrorBoundary` / `resetKeys`；class 版 `key` 重挂 | https://github.com/bvaughn/react-error-boundary；https://react.dev/learn/preserving-and-resetting-state | 缺标签 | src/topics/20-error-handling/react/ErrorBoundary.tsx:53-61 | R2-20-2（手动 reset 已讲；`resetKeys` / `key` 未讲） |
| 主流 | 粒度：根边界兜底 + 局部边界；fallback 不再渲染出错内容 | https://reactrouter.com/7.18.4/how-to/error-boundary；https://vuejs.org/api/composition-api-lifecycle.html | 讲了但错 | src/topics/20-error-handling/react/Example.tsx:23; :115-116 | R2-20-3（只讲局部，未讲根边界） |
| 主流 | 上报入口 `createRoot({ onCaughtError, onUncaughtError, onRecoverableError })` | https://react.dev/reference/react-dom/client/createRoot；node_modules/@types/react-dom/client.d.ts:22-26 | 缺标签 | src/topics/20-error-handling/react/Example.tsx:18; src/topics/20-error-handling/vue/Example.vue:19; :42; :45 | R2-20-4 |
| 旧写法 | 18 → 19：错误不再 rethrow；未捕获 → `window.reportError`，已捕获 → `console.error` | https://react.dev/blog/2024/04/25/react-19-upgrade-guide | 缺标签 | src/topics/20-error-handling/vue/Example.vue:45 | R2-20-4（19 行为提了一半，18 差异未讲） |
| 主流 | Actions 错误：`formAction` throw → 最近边界；可恢复错误 return state（→31） | https://react.dev/reference/react/useActionState | 未讲 | — | R2-20-1 |
| 主流 | 路由级 `errorElement` / `useRouteError`（→18） | https://reactrouter.com/7.18.4/how-to/error-boundary | 未讲 | — | R2-20-5 |
| 主流 | 生产：边界不是流程控制；fallback 重试 + 上报监控 | https://reactrouter.com/7.18.4/how-to/error-boundary | 已讲对 | src/topics/20-error-handling/react/ErrorBoundary.tsx:46-50; :65-72 | 「不是流程控制」未讲 |
| 主流 | 文件头承诺：Vue `onErrorCaptured` 签名、来源、`return false`、`errorHandler` | https://vuejs.org/api/composition-api-lifecycle.html；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:761-762 | 已讲对 | src/topics/20-error-handling/vue/Example.vue:33-50 | — |
| 主流 | 文件头承诺：Vue 能捕获事件处理器错误（真实差异） | https://vuejs.org/api/composition-api-lifecycle.html；node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:205-213 | 已讲对 | src/topics/20-error-handling/vue/Example.vue:36-38; src/topics/20-error-handling/vue/BuggyCounter.vue:24-28 | async handler 的 Promise 拒绝亦被捕获，未讲（R2-20-8） |
| 主流 | 文件头承诺：`errorHandler` 与 `createRoot` 选项「不是同层概念」 | https://react.dev/reference/react-dom/client/createRoot；https://vuejs.org/api/application.html | 讲了但错 | src/topics/20-error-handling/react/Example.tsx:17-18; src/topics/20-error-handling/vue/Example.vue:18-19; :41-42 | R2-20-4 |
| 主流 | Vue 无边界组件原语；`<Suspense>` 异步错误走 `onErrorCaptured` | https://vuejs.org/guide/built-ins/suspense.html | 已讲对 | src/topics/20-error-handling/vue/Example.vue:33-34 | Suspense 未讲（→32），见 R2-20-8 |
| 主流 | 文件头承诺：React 自动卸载崩溃子树、reset 后新实例；Vue 不自动卸载需 `v-if` / `:key` | — | 已讲对 | src/topics/20-error-handling/react/ErrorBoundary.tsx:53-56; src/topics/20-error-handling/vue/Example.vue:52-58; :87-88 | 大纲未列 |
| 主流 | 大纲未列：`return false` 后 Vue 不再 `logError` | node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:238-239, 256 | 已讲对 | src/topics/20-error-handling/vue/Example.vue:43-44 | 大纲未列；源码核实一致 |
| 主流 | 大纲未列：`getDerivedStateFromError` 是 static 纯函数、`componentDidCatch` 可副作用；箭头函数绑定 this | https://react.dev/reference/react/Component | 已讲对 | src/topics/20-error-handling/react/ErrorBoundary.tsx:36-43; :45-51; :57 | 大纲未列 |
| 主流 | 大纲未列：`ErrorInfo.componentStack` | node_modules/@types/react/index.d.ts:4134-4138 | 已讲对 | src/topics/20-error-handling/react/ErrorBoundary.tsx:46-50 | 大纲未列 |
| 主流 | 措辞：「唯一仍需要 class」绝对化；「没有一一对应关系」模板残留 | https://react.dev/reference/react/Component；规格 §5 H | 讲了但错 | src/topics/20-error-handling/react/Example.tsx:5; :17; src/topics/20-error-handling/react/ErrorBoundary.tsx:2; :20; src/topics/20-error-handling/vue/Example.vue:42 | R2-20-6 |
| 主流 | 交叉引用：20 无任何引用且无人引用 | facts-inventory | 未讲 | — | R2-20-7 |

#### 面试 5 问

1. Error Boundary 能捕获什么、不能捕获什么？（追问：为什么 `onClick` 里的错误捕获不到？`setTimeout` 呢？React 19 的 `startTransition` 为什么是例外？）
2. 为什么 Error Boundary 只能用 class 写，生产里你怎么做？（追问：`react-error-boundary` 提供了什么？`getDerivedStateFromError` 和 `componentDidCatch` 分工？）
3. 出错后怎么让用户重试？（追问：`resetKeys` 和 `key` 重挂的区别？重试时怎么避免再次进入同一错误？）
4. React 19 在错误处理上改了什么？（追问：`onCaughtError` / `onUncaughtError` 各在什么时候触发？18 里为什么日志会重复？）
5. Vue 的 `errorCaptured` 和 React 的 Error Boundary 有什么本质差异？（追问：Vue 能捕获事件处理器错误吗？`return false` 是什么意思？全局兜底各在哪配？）

#### 生产写法要点

- 根 `createRoot` 配 `onCaughtError` / `onUncaughtError` 上报监控；局部边界用 `react-error-boundary` 的 `onError` 附带业务上下文。
- 每个异步区域（路由页、弹窗、独立卡片）一个边界，fallback 带「重试」按钮（`resetErrorBoundary`）并用 `resetKeys={[id]}` 跟随参数变化。
- 事件 / 异步错误用 `try/catch` 转成 UI state 或 `showBoundary`；不要靠边界处理可预期的失败（校验、404）。
- 与 Router 配合：路由级 `errorElement` 处理 loader / action 错误，组件级边界处理渲染错误，两层不要互相替代。
- 开发环境 React 仍会打印被捕获的错误，不要把它当成边界失效。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| class `getDerivedStateFromError` + fallback | 父组件 `onErrorCaptured` + `ref` 状态渲染 fallback | https://vuejs.org/api/composition-api-lifecycle.html（2026-09-16） | Vue 无专门边界组件，任何组件都可当边界 |
| 不捕获事件处理器错误 | 捕获事件处理器、watcher、生命周期错误 | https://vuejs.org/api/composition-api-lifecycle.html（2026-09-16） | 真实差异：Vue 的错误来源更广 |
| `createRoot({ onCaughtError, onUncaughtError })` | `app.config.errorHandler` | https://vuejs.org/api/application.html（2026-09-16） | 都是应用级兜底；Vue 的 `info` 说明错误来源 |
| 错误冒泡到最近边界 | 自底向上依次调用所有 `errorCaptured`，`return false` 停止 | https://vuejs.org/api/composition-api-lifecycle.html（2026-09-16） | React 只有最近边界处理 |
| `resetKeys` / `key` 重挂 | 改 `:key` 或重置本地状态 | https://react.dev/learn/preserving-and-resetting-state（2026-09-16） | 同为「换 key 重建」 |
| `use` 拒绝进边界 | `<Suspense>` 异步错误进 `onErrorCaptured` | https://vuejs.org/guide/built-ins/suspense.html（2026-09-16） | — |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-20-1 | 严重 | 讲错 | 绝对化 | 「不能捕获异步代码」漏掉 React 19 例外：`startTransition` / Action 内抛错或拒绝的 Promise 会进边界；也未讲 `use(promise)` 拒绝、`lazy` 失败可被捕获（→31 / 32） | src/topics/20-error-handling/react/Example.tsx:9; src/topics/20-error-handling/react/ErrorBoundary.tsx:15; src/topics/20-error-handling/vue/Example.vue:10 | 异步代码（setTimeout / Promise） | 文件头承诺的「能 / 不能捕获」清单在 19 下不完整；面试第 1 问追问点；31 / 32 依赖此结论 | https://react.dev/reference/react/Component（逐字「an exception is the usage of the startTransition function returned by the useTransition Hook. Errors thrown inside the transition function are caught by error boundaries」）；grep0:startTransition\|useTransition\|Actions\|31[[:space:]]题\|32[[:space:]]题\|lazy | 二、核心概念 |
| R2-20-2 | 概念 | 缺标签 | 其它 | `react-error-boundary` 只剩一句名词：未讲官方「你不必自己写 class」定位、`fallbackRender` / `FallbackComponent` / `onError` / `onReset` / `resetKeys`、`useErrorBoundary().showBoundary` 处理事件 / 异步错误、`withErrorBoundary`；包未安装 | src/topics/20-error-handling/react/ErrorBoundary.tsx:5-7; src/topics/20-error-handling/react/Example.tsx:6-7 | react-error-boundary 库（提供 | 大纲主流；主线判定候选之一（class vs 包） | https://react.dev/reference/react/Component（逐字「you don't have to write the Error Boundary class yourself. For example, you can use react-error-boundary instead」）；https://github.com/bvaughn/react-error-boundary（逐字「Use useErrorBoundary to pass caught errors to the nearest boundary」）；grep0:resetKeys\|useErrorBoundary\|showBoundary | 二、核心概念 |
| R2-20-3 | 生产 | 未标简化 | 生产简化 | 只讲「关键区域局部兜底」，无根边界：未捕获的渲染错误会让 React 移除整棵 UI；生产需根边界 + 局部边界 + fallback 重试 / `resetKeys`；fallback 写死虽自标但无生产形态 | src/topics/20-error-handling/react/Example.tsx:23 | 只在关键区域做局部兜底 | 大纲主流粒度条；演示 fallback 写死（:65 已自标）但缺根边界 | https://react.dev/reference/react/Component（逐字「By default, if your application throws an error during rendering, React will remove its UI from the screen」） | 七、生产环境注意 |
| R2-20-4 | 概念 | 讲错 | 其它 | `createRoot` 的 `onCaughtError` / `onUncaughtError` 被说成「与 errorHandler 不是同层概念」：两者同为应用级兜底；`onRecoverableError` 未提；19「错误不再 rethrow」（未捕获 → `window.reportError`、已捕获 → `console.error`）只提一半，18 重复日志【旧写法】未讲 | src/topics/20-error-handling/react/Example.tsx:17-18; src/topics/20-error-handling/vue/Example.vue:18-19; :41-45 | 但不是同层概念 | 大纲主流 + 旧写法；规格 §5 D 不准确对比 | https://react.dev/reference/react-dom/client/createRoot（逐字 onUncaughtError「Callback called when an error is thrown and not caught by an Error Boundary」）；https://react.dev/blog/2024/04/25/react-19-upgrade-guide（逐字「Errors that are caught by an Error Boundary are reported to console.error」）；node_modules/@types/react-dom/client.d.ts:22-26；grep0:onRecoverableError\|rethrow\|reportError\|React[[:space:]]18 | 八、旧写法对照 |
| R2-20-5 | 概念 | 未讲 | Router | 路由级边界一句未提：`errorElement` / `ErrorBoundary` + `useRouteError` 接 loader / action / 渲染错误，与组件级边界分工（→18） | — | — | 大纲主流只作引用 | https://reactrouter.com/7.18.4/how-to/error-boundary（逐字「closest error boundary will be rendered」）；grep0:errorElement\|useRouteError\|18[[:space:]]题\|路由 | 五、常见追问与回答要点 |
| R2-20-6 | 小问题 | 措辞 | 绝对化 | 「React 中唯一仍需要 class 组件的场景」绝对化（`getSnapshotBeforeUpdate` 同样无函数等价物）；「没有一一对应关系」贴在已给出对应物的句后 | src/topics/20-error-handling/react/Example.tsx:5; :17; src/topics/20-error-handling/react/ErrorBoundary.tsx:2; :20; src/topics/20-error-handling/vue/Example.vue:6; :42 | 唯一仍需要 class 组件的场景 | 规格 §5 B / H | https://react.dev/reference/react/Component（逐字「At the moment, there is no equivalent to getSnapshotBeforeUpdate for function components」） | 六、易错点 |
| R2-20-7 | 小问题 | 未讲 | 交叉引用 | 20 无任何交叉引用，也无人引用它：应加 →18（`errorElement`）、→31（Action 错误）、→32（`use` / `lazy`）；19 / 27 / 31 / 32 应回指 20 | — | — | facts-inventory「没有任何题引用 20」 | grep0:[0-9][0-9][[:space:]]题 | 参考 |
| R2-20-8 | 概念 | 未讲 | Vue现行写法 | Vue 对照缺：`async` 事件处理器的 Promise 拒绝也进 `onErrorCaptured`（`callWithAsyncErrorHandling`）；`<Suspense>` 异步错误同走 `onErrorCaptured`（→32） | — | — | 大纲主流 Vue 对照；解决大纲待核实第 2 条（见 P-19-4） | node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:205-213；https://vuejs.org/guide/built-ins/suspense.html；grep0:async\|Suspense\|Promise[[:space:]]拒绝 | 三、Vue 对照 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | Error Boundary 能捕获什么、不能捕获什么？（追问：为什么 `onClick` 里的错误捕获不到？`setTimeout` 呢？React 19 的 `startTransition` 为什么是例外？） | 部分 | src/topics/20-error-handling/react/ErrorBoundary.tsx:9-17; src/topics/20-error-handling/react/Example.tsx:65-69 | 缺 `startTransition` 例外（课件写成一律不能） |
| 2 | 为什么 Error Boundary 只能用 class 写，生产里你怎么做？（追问：`react-error-boundary` 提供了什么？`getDerivedStateFromError` 和 `componentDidCatch` 分工？） | 部分 | src/topics/20-error-handling/react/Example.tsx:5-7; src/topics/20-error-handling/react/ErrorBoundary.tsx:36-51 | 缺 `react-error-boundary` 提供什么 |
| 3 | 出错后怎么让用户重试？（追问：`resetKeys` 和 `key` 重挂的区别？重试时怎么避免再次进入同一错误？） | 部分 | src/topics/20-error-handling/react/ErrorBoundary.tsx:53-61 | 缺 `resetKeys` / `key` 重挂 |
| 4 | React 19 在错误处理上改了什么？（追问：`onCaughtError` / `onUncaughtError` 各在什么时候触发？18 里为什么日志会重复？） | 部分 | src/topics/20-error-handling/react/Example.tsx:18; src/topics/20-error-handling/vue/Example.vue:45 | 缺触发时机、18 rethrow 差异 |
| 5 | Vue 的 `errorCaptured` 和 React 的 Error Boundary 有什么本质差异？（追问：Vue 能捕获事件处理器错误吗？`return false` 是什么意思？全局兜底各在哪配？） | 能 | src/topics/20-error-handling/vue/Example.vue:33-50; src/topics/20-error-handling/vue/BuggyCounter.vue:24-28 | — |

### 21. 不可变数据更新

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 文件头承诺：Object.is 比引用 → 每层新引用；数组 map / filter / 展开；反例；引用比较是优化地基；五种模式；Immer 提名 | https://react.dev/learn/updating-objects-in-state | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:5-13; src/topics/21-immutable-update/react/Example.tsx:71-137 | 承诺全部兑现；「三大」与「五种」数量打架见 R2-21-10 |
| 主流 | 「treat state as read-only」；原地改后 React 不知道，不 set 不渲染 | https://react.dev/learn/updating-objects-in-state | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:123-137 | 反例按钮可点击，且解释「再点正常按钮数量凭空多 1」 |
| 主流 | 引用变化为何至关重要：setter 用 Object.is；memo / useMemo / useEffect 依赖全靠引用 | https://react.dev/reference/react/useState | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:9-10; src/topics/21-immutable-update/react/Example.tsx:84 | 只有陈述无演示；建议加 memo 行演示「未改的 item 不重渲染」 |
| 主流 | 对象展开是浅拷贝；嵌套要「从改动点到根每层新引用」 | https://react.dev/learn/updating-objects-in-state | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:71-94 | — |
| 主流 | 数组表：添加 → 展开；删除 → filter；替换 → map | https://react.dev/learn/updating-arrays-in-state | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:96-121 | — |
| 主流 | 数组表：插入中间 → slice + 展开；排序 / 反转 → 先拷贝再 sort / reverse | https://react.dev/learn/updating-arrays-in-state | 未讲 | — | R2-21-1 |
| 主流 | `slice`（拷贝）vs `splice`（原地改）命名坑 | https://react.dev/learn/updating-arrays-in-state | 未讲 | — | R2-21-1 |
| 主流 | map 到目标项才展开，其余原样返回 → 未动子树共用引用（结构共享） | https://react.dev/learn/updating-arrays-in-state | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:84; src/topics/21-immutable-update/react/Example.tsx:142 | — |
| 主流 | 「Local mutation is fine」：改渲染 / 事件里刚创建的对象没问题 | https://react.dev/learn/updating-objects-in-state | 未讲 | — | R2-21-6 |
| 主流 | 为什么不推荐 mutation（Deep Dive 五条） | https://react.dev/learn/updating-objects-in-state | 未讲 | — | R2-21-7（排查、优化两条已在 :129-130、:9-10） |
| 主流 | 常见错法：`push` 后 set 同引用 | https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:124-127 | — |
| 主流 | 常见错法：`arr.sort()` 后 set；先改子对象再 `{...state}` | https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability | 未讲 | — | R2-21-1 |
| 主流 | 与 useReducer 同规则（reducer 必须纯、不 mutate）→ 29 | https://react.dev/learn/extracting-state-logic-into-a-reducer | 未讲 | — | R2-21-6 |
| 主流 | Immer 定位：draft 是记录改动的 Proxy、产出新对象；useImmer / useImmerReducer；官方教程推荐、不必装 | https://react.dev/learn/updating-objects-in-state | 未讲 | — | R2-21-3（:13、:85 仅提名）；node_modules 无 immer |
| 主流 | 深嵌套根治 = 扁平化 / 归一化，不是更长的展开链 | https://react.dev/learn/choosing-the-state-structure | 未讲 | — | R2-21-6 |
| 主流 | 同一规则适用 props / context（只读） | https://react.dev/learn/keeping-components-pure | 未讲 | — | R2-21-6 |
| 较新 | lint `react-hooks/immutability`（7.1.1 recommended 为 error）；Compiler 依赖此前提 | https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability | 未讲 | — | R2-21-5；本项目 eslint.config.js 未启用 recommended |
| 较新 | ES2023 `toSorted` / `toReversed` / `toSpliced` / `with` 非破坏方法 | ③ MDN https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted（2026-09-17，摘要：Baseline Widely available since July 2023） | 未讲 | — | R2-21-2；tsconfig.json:4 lib ES2022 不含，类型在 node_modules/typescript/lib/lib.es2023.array.d.ts:57 |
| 旧写法 | class `this.setState({a})` 浅合并顶层，嵌套仍需自己拷 | https://react.dev/reference/react/Component#setstate（2026-09-17，逐字） | 未讲 | — | R2-21-4 |
| 主流 | 更新函数必须纯：id 在事件处理器里生成、StrictMode 双调；不参与渲染的可变值放 useRef（→12）（大纲未列） | https://react.dev/reference/react/useState；https://react.dev/reference/react/useRef | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:96-107; src/topics/21-immutable-update/react/Example.tsx:67-69 | 大纲未列 |
| 主流 | 惰性初始化 + structuredClone 保护模块常量（大纲未列） | https://react.dev/reference/react/useState | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:63-65 | 大纲未列；写法正确但未解释也未指向 03（03 未讲惰性初始化） |
| 主流 | Vue `reactive` 深层响应，直接 `x.y = …` / `push` / `splice` 即触发 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/21-immutable-update/vue/Example.vue:63-112 | 3.5 现行写法 |
| 主流 | Vue `reactive` 限制：不能整体替换、不能解构——坑互为镜像 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 未讲 | — | R2-21-9 |
| 主流 | Vue 官方 `useImmer`（shallowRef + produce） | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-17，逐字） | 未讲 | — | R2-21-9 |
| 主流 | `shallowRef` / `triggerRef` / `markRaw` 以「只在整体替换时更新」换性能 | node_modules/@vue/reactivity/dist/reactivity.d.ts:464 | 未讲 | — | R2-21-9 |
| 主流 | Vue props 只读、子组件应 emit | https://vuejs.org/guide/components/props.html#one-way-data-flow | 未讲 | — | R2-21-6（合并） |
| 主流 | Pinia 直接改 / `$patch` | https://pinia.vuejs.org/core-concepts/state.html | 未讲 | — | 只作引用，落点 16，不计问题 |
| 主流 | Vue 更新粒度「只更新依赖它的地方」 | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-17，逐字） | 讲了但错 | src/topics/21-immutable-update/react/Example.tsx:16; src/topics/21-immutable-update/vue/Example.vue:73 | R2-21-8 |
| 主流 | 「拉 vs 推」变更检测哲学（大纲未列） | https://react.dev/learn/updating-objects-in-state | 已讲对 | src/topics/21-immutable-update/react/Example.tsx:19-22 | 大纲未列；「最根本的分歧」措辞见 R2-21-10 |

#### 面试 5 问

1. 为什么 `state.items.push(x); setItems(state.items)` 不刷新？（追问：那 `setItems([...items])` 为什么会刷新——引用变了；这和 `Object.is` 有什么关系？）
2. 展开运算符是深拷贝吗？更新 `user.address.city` 要写几层？（追问：未改动的兄弟分支需要拷贝吗——不需要，结构共享）
3. `arr.sort()` 后 `setArr([...arr])` 有什么问题？（追问：`slice` 和 `splice` 哪个能用？`toSorted` 能用吗？）
4. Immer 解决什么问题、原理是什么、代价是什么？（追问：RTK 的 `createSlice` 为什么能「直接改」——内置 Immer；Zustand 需要 immer 中间件吗？）
5. 「不可变」为什么对 React 重要而对 Vue 不重要？（追问：memo / useMemo / 依赖数组失效的根因是什么？）

#### 生产写法要点

- 嵌套 ≥ 3 层或列表里的对象频繁局部更新 → 要么归一化（`byId` + `ids`），要么引入 Immer；两者都比手写多层展开可靠。
- 从 API 拿到的数据不要在 state 里原地改（比如 `data.sort()` 再渲染）；派生排序 / 筛选在渲染时算或 useMemo（09 / 17）。
- 开启 `react-hooks/immutability` 与 `purity` 规则并当 error（已装 7.1.1 的 `recommended` 默认如此），不要为了过 lint 用 `as any` 绕开。
- TS：state 类型加 `readonly` / `ReadonlyArray<T>` 可以在编译期挡住 `push` / `sort`；服务端数据类型与 UI 草稿类型分开定义。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| 必须整体替换：`setUser({...user, name})` | `reactive()` / `ref()` 深层响应式，直接 `user.name = 'x'`、`list.push(x)` 即可触发更新 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，逐字「Deep Reactivity」）；node_modules/@vue/reactivity/dist/reactivity.d.ts:44,441 | 方向相反：Vue 靠 Proxy 拦截 set，React 靠引用比较 |
| 展开是浅拷贝、嵌套要层层拷 | `reactive` 「Cannot replace entire object」「Not destructure-friendly」——Vue 的坑在「换引用 / 解构」，React 的坑在「改引用」 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，逐字「Limitations of reactive()」） | 两边坑互为镜像 |
| Immer `produce` | Vue 官方给了 `useImmer` composable：`shallowRef` + `produce`，只有 `.value` 被重新赋值才触发 | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-16，逐字「Immutable Data」示例） | Vue 里是可选优化（大型不可变结构 / 撤销重做），React 里是便利工具 |
| 不可变数据让 memo 只比引用 | `shallowRef` + `triggerRef` 对应「只在整体替换时更新」；`markRaw` / `toRaw` 跳出响应式 | node_modules/@vue/reactivity/dist/reactivity.d.ts:464,491,210,236（①） | Vue 用这些 API 换取「大数据不做深层代理」的性能 |
| props 只读、不能改父传对象 | 「you should not attempt to mutate a prop inside a child component」；对象 / 数组 prop 技术上可改但「the child should emit an event」 | https://vuejs.org/guide/components/props.html#one-way-data-flow（2026-09-16，逐字） | 规则一致；Vue 只是运行期不拦截对象内部改动 |
| Pinia 可直接 `store.count++` / `$patch` | Pinia state 是 reactive，直接改即可；`$patch` 用于批量 / 函数式修改数组 | https://pinia.vuejs.org/core-concepts/state.html（2026-09-16，逐字） | 落点在 16 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-21-1 | 概念 | 未讲 | 其它 | 数组表不全：排序 / 反转要先拷贝、插入中间用 slice + 展开、`slice`（拷）vs `splice`（改）；错法 `arr.sort()` 后 set、先改子对象再 `{...state}` | — | — | 官方四张表只讲了三张，「sort 是原地改」是面试手写高频坑；`sort` 后 `set([...arr])` 会污染旧快照且 memo 失效 | grep0:sort\|reverse\|slice | 二、核心概念 |
| R2-21-2 | 概念 | 未讲 | 其它 | ES2023 `toSorted` / `toReversed` / `toSpliced` / `with` 可替代「先拷贝再排」【较新】 | — | — | Baseline 2023-07 已广泛可用；本项目 tsconfig.json:4 `lib: ES2022` 不含，类型在 lib.es2023.array.d.ts:57，写进课件须升 lib 或标注 | grep0:toSorted\|toReversed | 九、新动向 |
| R2-21-3 | 概念 | 未讲 | 其它 | Immer 只有一句提名：draft 是记录改动的 Proxy、产出全新对象、`useImmer` / `useImmerReducer`、RTK `createSlice` 内置、Zustand immer 中间件、代价 | — | — | 官方教程正式推荐，值得作【主流】加分点写 5 行注释示例（不安装）；面试追问「RTK 为什么能直接改」无依据 | grep0:draft\|produce\|createSlice | 五、常见追问 |
| R2-21-4 | 概念 | 未讲 | 旧写法 | class `this.setState({a})` 浅合并顶层字段，Hooks setter 整体替换 | — | — | 老代码 `setState({nested: {...}})` 仍要自己拷嵌套层；官方逐字「it will be shallowly merged into this.state」（https://react.dev/reference/react/Component#setstate，2026-09-17）；16.8 起变化 | grep0:浅合并\|this\.setState\|类组件 | 八、旧写法对照 |
| R2-21-5 | 概念 | 未讲 | 性能 | lint `react-hooks/immutability`（recommended 为 error）与 React Compiler 依赖不可变前提 | — | — | 官方逐字「Validates against mutating props, state, and other values that are immutable」；本项目 eslint.config.js:33-39 只开 2 条规则，反例 `first.quantity++` 现状不会被 lint 拦住 | grep0:lint\|immutability | 九、新动向 |
| R2-21-6 | 概念 | 未讲 | 其它 | 规则边界：改刚创建的对象可以；props / context 同样只读；reducer 同规则（29）；深嵌套根治是归一化（03） | — | — | 没有边界学习者会走向「什么都 structuredClone」；官方逐字「Local mutation is fine」「props, state, and context … read-only」 | grep0:局部突变\|刚创建\|归一化 | 六、易错点 |
| R2-21-7 | 概念 | 未讲 | 其它 | 官方「为什么不推荐 mutation」五条只覆盖排查、优化两条：撤销 / 重做靠保留旧快照、新特性依赖快照语义、React 实现更简单（不劫持属性） | — | — | 「不可变为什么对 React 重要」的完整答案需要这五条；Requirement Changes（undo）是最能说服 Vue 老手的一条 | grep0:撤销\|undo | 五、常见追问 |
| R2-21-8 | 概念 | 讲错 | 其它 | 「Proxy 拦截 set…只更新依赖它的地方」暗示属性级更新；Vue 3.5 实际是组件级 render effect | src/topics/21-immutable-update/react/Example.tsx:16; src/topics/21-immutable-update/vue/Example.vue:73 | 只更新依赖它的地方 | 官方逐字「each component instance creates a reactive effect to render and update the DOM」；写入触发的是读了它的组件重跑 render，再靠 patch flags 减少 diff；属性级是 Vapor（3.6 rc） | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-17，逐字） | 三、Vue 对照 |
| R2-21-9 | 概念 | 未讲 | Vue现行写法 | Vue 对照缺三项：`reactive` 不能整体替换 / 解构（坑互为镜像）；官方 `useImmer`（shallowRef + produce）；`shallowRef` / `triggerRef` / `markRaw` | — | — | 只讲了「Vue 可以直接改」，没讲 Vue 自己的坑和 Vue 侧何时也要不可变（大型不可变结构 / 撤销重做）；官方逐字「We can integrate Immer with Vue via a simple composable」 | grep0:shallowRef\|triggerRef\|markRaw | 三、Vue 对照 |
| R2-21-10 | 小问题 | 措辞 | 交叉引用 | 「三大数组模式」(:7) 与「五种模式一次讲全」(:12) 数量打架；`useState(() => structuredClone(…))` 用了惰性初始化却未解释、未指向 03；「最根本的分歧」绝对化 | src/topics/21-immutable-update/react/Example.tsx:7; src/topics/21-immutable-update/react/Example.tsx:12; src/topics/21-immutable-update/react/Example.tsx:21; src/topics/21-immutable-update/react/Example.tsx:65 | 三大数组模式 | 五种模式 = 对象展开 + 嵌套 + 追加 + 删除 + 映射表，其中数组只有三种，文件头两句应统一；惰性初始化 03 也未讲（R2-03-1） | course-map §6 B / I | 二、核心概念 |
| R2-21-11 | 生产 | 未标简化 | 生产简化 | 演示用 useRef 自增 id、`amount` 不联动已注明，但未给生产做法：state 类型加 `readonly` / `ReadonlyArray` 编译期挡 `push` / `sort`；服务端数据不在 state 里原地排序，派生排序在渲染时算或 useMemo | src/topics/21-immutable-update/react/Example.tsx:67-69 | 新 item 的自增序号 | 生产里 id 来自服务端或 `crypto.randomUUID()`；`readonly` 是零成本的防 mutate 手段，课件一处未提 | https://react.dev/learn/updating-arrays-in-state | 七、生产环境注意 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 为什么 `state.items.push(x); setItems(state.items)` 不刷新？追问：`setItems([...items])` 为什么会刷新、和 Object.is 什么关系 | 能 | src/topics/21-immutable-update/react/Example.tsx:5-6; src/topics/21-immutable-update/react/Example.tsx:123-137 | — |
| 2 | 展开运算符是深拷贝吗？更新 `user.address.city` 要写几层？追问：未改动的兄弟分支要拷贝吗 | 能 | src/topics/21-immutable-update/react/Example.tsx:71-94 | — |
| 3 | `arr.sort()` 后 `setArr([...arr])` 有什么问题？追问：`slice` / `splice` 哪个能用、`toSorted` 能用吗 | 不能 | — | sort / reverse、slice vs splice、toSorted 一字未提 |
| 4 | Immer 解决什么、原理是什么、代价是什么？追问：RTK `createSlice` 为什么能「直接改」、Zustand 要 immer 中间件吗 | 部分 | src/topics/21-immutable-update/react/Example.tsx:13; src/topics/21-immutable-update/react/Example.tsx:85 | 只有「以可变写法生成不可变更新」一句，无原理、代价、RTK / Zustand |
| 5 | 「不可变」为什么对 React 重要而对 Vue 不重要？追问：memo / useMemo / 依赖数组失效的根因 | 能 | src/topics/21-immutable-update/react/Example.tsx:9-10; src/topics/21-immutable-update/react/Example.tsx:19-22; src/topics/21-immutable-update/react/Example.tsx:84 | — |

### 22. 综合：订单管理页

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 文件头承诺：搜索 / 筛选 / 分页 / 行内编辑 / 二次确认删除 / 请求状态全部实现 | —（文件头 :2） | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:135-159; :203-213; :232-242; :354-363 | 五项功能与请求状态均落地 |
| 主流 | 文件头承诺：草稿值 / 提交值分离（→ 07 / 11） | —（文件头 :5） | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:39-40; :85-92 | — |
| 主流 | 文件头承诺：一个 effect 依赖 [keyword, status, page, reloadFlag]，AbortController cleanup 防竞态（→ 10 / 11 / 27） | https://react.dev/learn/synchronizing-with-effects#fetching-data（11-evidence，逐字） | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:55-77 | reloadFlag 计数器是 effect 手写的固有代价，30 题 refetch 是对照 |
| 主流 | 文件头承诺：判别联合 ListState（含 empty）；totalPages 派生（→ 09 / 11） | https://react.dev/learn/reacting-to-input-with-state（22-outline，逐字） | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:33-36; :79-82; :161-175 | — |
| 主流 | 文件头承诺：OrderRow callback props；保存后 map 不可变局部更新（→ 08 / 21） | https://react.dev/learn/choosing-the-state-structure（22-outline） | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:104-116; :226-232 | — |
| 主流 | 文件头承诺 Vue 对照：命令式 load() + watch(statusFilter)；OrderRow props / emit | —（文件头 :13-15） | 已讲对 | src/topics/22-integrated-order-page/vue/Example.vue:51-77; src/topics/22-integrated-order-page/vue/OrderRow.vue:13-14 | — |
| 主流 | Thinking in React 五步：拆层级 → 静态版 → 最小 state → 归属 → 反向数据流 | https://react.dev/learn/thinking-in-react（22-outline，逐字） | 未讲 | — | R2-22-1 |
| 主流 | 三问判断是不是 state；派生值不进 state | https://react.dev/learn/thinking-in-react（22-outline，逐字） | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:79-82; :244 | 只有 totalPages / busy 两例，未引官方三问（并入 R2-22-1） |
| 主流 | status 枚举取代多 boolean（消灭 impossible states）；状态结构五原则（Avoid contradictions / redundant …） | https://react.dev/learn/reacting-to-input-with-state；https://react.dev/learn/choosing-the-state-structure（22-outline，逐字） | 缺标签 | src/topics/22-integrated-order-page/react/Example.tsx:233-242 | R2-22-8（列表已用判别联合，行级却用 4 个布尔且未说明） |
| 主流 | URL 状态：筛选 / 页码进 query；函数式 setSearchParams；切筛选重置 page；输入类 replace | facts-versions C（setter 整体替换、replace）；course-map §7 第 9 条 | 未讲 | — | R2-22-2 |
| 主流 | 列表 key 用 id；行内编辑不能用 index；不可变 map / filter（→ 06 / 21） | https://react.dev/learn/choosing-the-state-structure（22-outline，摘要） | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:191-199; src/topics/22-integrated-order-page/vue/Example.vue:220-228 | — |
| 主流 | 竞态：每次请求作废上一次（AbortController / ignore） | 11 / 27 evidence（course-map §3） | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:56-76; src/topics/22-integrated-order-page/vue/Example.vue:44-54; :70 | — |
| 主流 | loading 期间保留旧数据 vs 清空；翻页闪烁；手写等价「保留上页 + isFetching」 | https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries（22-outline，逐字） | 未讲 | — | R2-22-3（:59 每次清空，表格消失再出现） |
| 主流 | 乐观更新两种（onMutate 回滚 vs variables）+ useOptimistic（→ 30 / 31） | https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates（22-outline，逐字） | 未讲 | — | R2-22-4 |
| 主流 | 行内编辑：受控输入、保存中禁用、失败保留草稿并提示（→ 07 / 19） | 07 / 19 evidence | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:255-281; :301-336 | useId / label 见 R2-22-6 |
| 主流 | 删除二次确认：防重复点击；dialog 语义 + 焦点陷阱 + 焦点回到触发按钮（→ 35） | ③ W3C APG dialog-modal（22-outline） | 缺标签 | src/topics/22-integrated-order-page/react/Example.tsx:354-363 | R2-22-6（防重复已做，焦点管理与语义未提） |
| 主流 | 错误分层：请求错误进状态 + 重试；渲染崩溃由行级 / 页级 Error Boundary（resetKeys）兜底（→ 20） | 20 evidence | 未讲 | — | R2-22-5（请求错误分支 :164-171 已讲对） |
| 主流 | 生产写法 A：TanStack useQuery 分页 + useMutation 编辑 / 删除 → invalidateQueries | https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries；30 evidence | 未讲 | — | R2-22-7（:20 只提「30 题对照」） |
| 主流 | 生产写法 B：路由 Data 模式 loader 读 request.url + action + useFetcher + 自动 revalidate | https://reactrouter.com/7.18.4/start/data/actions（22-outline，逐字） | 未讲 | — | R2-22-7 |
| 主流 | 生产写法 C：React 19 Actions（form action / useActionState / useFormStatus / useOptimistic） | 31 evidence；facts-versions A | 未讲 | — | R2-22-7 |
| 主流 | 可访问性：table th scope、role="search"、aria-live 播报、aria-current 分页、按钮可访问名（→ 35） | https://vuejs.org/guide/best-practices/accessibility.html；③ MDN ARIA（22-outline） | 未讲 | — | R2-22-6 |
| 主流 | 安全：文本渲染不解析 HTML；删除 / 编辑后端按当前用户校验归属；returnTo 校验（→ 35） | ③ OWASP Authorization Cheat Sheet（22-outline） | 未讲 | — | R2-22-6（代码未用 innerHTML，但一句未提） |
| 主流 | 性能：搜索防抖 / useDeferredValue；大表格虚拟化；startTransition 包裹筛选（→ 14 / 17 / 32） | 14 / 17 / 32 evidence | 未讲 | — | R2-22-12 |
| 主流 | Vue 对照：watch(() => route.query, fetch) 驱动请求；onWatcherCleanup 取消上一次（3.5）；@tanstack/vue-query 同构 | https://vuejs.org/guide/scaling-up/state-management.html（22-outline，逐字）；course-map §2（onWatcherCleanup → 10 / 27） | 缺标签 | src/topics/22-integrated-order-page/vue/Example.vue:44-54 | R2-22-10 |
| 主流 | 测试断言（→ 34） | course-map §2 | 未讲 | — | 十、练习段补可断言结论，不单列问题 |
| 旧写法 | 裸 useEffect 拉数（无缓存）/ 手写布尔而非 status / selectedOrder 整对象入 state | facts-versions B / C；https://react.dev/learn/choosing-the-state-structure | 缺标签 | src/topics/22-integrated-order-page/react/Example.tsx:55-77 | 未标注这是「基础 / 演示」写法（并入 R2-22-7） |
| 主流 | 大纲未列：Vue type="number" 自动应用 .number、解析失败回退原字符串 | https://vuejs.org/guide/essentials/forms.html（2026-09-17，逐字："The `number` modifier is applied automatically if the input has `type="number"`."） | 已讲对 | src/topics/22-integrated-order-page/vue/OrderRow.vue:19-27 | 大纲未列 |
| 主流 | 大纲未列：form 内 button 默认 submit 需 type="button"；删本页最后一条回退一页 | — | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:155-158; :118-125 | 大纲未列 |
| 主流 | eslint-plugin-react-hooks 7 recommended 的 set-state-in-effect（error）可能命中 effect 内同步 setListState | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（2026-09-17，逐字）；facts-versions F | 缺标签 | src/topics/22-integrated-order-page/react/Example.tsx:58-59 | R2-22-9 |
| 主流 | 交叉引用 05 06 07 08 09 10 11 19 21 27 30 均指向正确主题 | facts-inventory | 已讲对 | src/topics/22-integrated-order-page/react/Example.tsx:5-10; :161; :191; :255 | — |

#### 面试 5 问

1. 拿到一个「搜索 + 筛选 + 分页 + 编辑 + 删除」的页面，你怎么拆组件、怎么定 state？（追问：哪些不是 state；state 放哪一层；筛选与页码为什么进 URL；切筛选为什么要重置页码）
2. 分页时切页 UI 闪烁怎么解决？（追问：`keepPreviousData` 做了什么、`isPlaceholderData` 何时为真；手写 effect 版怎么保留旧数据；请求竞态怎么防）
3. 删除 / 编辑要做乐观更新吗，失败怎么回滚？（追问：TanStack `onMutate` / `onError` / `onSettled` 各做什么；`useOptimistic` 与之区别；何时只用 `variables` 就够）
4. 同一页面用 TanStack Query、路由 loader/action、React 19 Actions 三种写法各有什么取舍？（追问：action 完成后 loader 自动 revalidate 的含义；`useFetcher` 与 `<Form>` 区别；服务端状态为什么不放 Zustand）
5. 这页在生产上会缺什么？（追问：请求取消与错误分层；可访问性——表格语义、`aria-live`、对话框焦点；安全——前端权限只是 UX、后端按用户过滤、`returnTo` 校验）

#### 生产写法要点

- 数据获取按主线二选一：TanStack Query（`keepPreviousData` + `invalidateQueries` + 乐观更新）或路由 loader/action（`useFetcher` 行级操作、自动 revalidate）；演示用的 effect 手写版必须标「演示简化」并指向 11 / 27 的取消写法。
- 筛选 / 分页状态进 URL：函数式 `setSearchParams`，切筛选重置 `page`，输入类用 `replace: true`；组件从 URL 派生请求参数，不复制到 state。
- 状态用判别联合（`status`）而非多个 boolean；列表按 id 扁平存储；选中项存 id。
- 每个变更操作：禁用重复提交、失败回滚 + 提示、成功后失效重取；删除走可访问的确认对话框。
- 错误分层：请求错误进状态 + 重试，渲染错误进行级 Error Boundary（`resetKeys`）。
- 安全 / a11y 最低线见 35：文本渲染不解析 HTML、后端按用户校验对象归属、表格语义 + `aria-live` + 焦点管理。
- 性能：防抖 / `useDeferredValue`，大列表虚拟化；服务端状态不进全局 store。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| 状态提升到共同父组件 + 回调 props | 同样提升，或 `reactive()` 共享 store / Pinia | https://vuejs.org/guide/scaling-up/state-management.html（2026-09-17） | Vue 官方示例把变更方法放在 store 上集中 |
| 派生列表在渲染时直接算 | `computed(() => orders.filter(...))` | https://vuejs.org/guide/scaling-up/state-management.html（2026-09-17，摘要） | Vue 自动缓存；React 需要时才 `useMemo`（→ 09 / 17） |
| `useSearchParams` 函数式更新 | `router.replace({ query: { ...route.query, page: '1' } })` | facts-versions C（React 侧）；Vue 侧 → 18 evidence | 两边都要手动合并旧 query |
| `useEffect` + ignore / AbortController | `watch(() => route.query, ...)` + `onWatcherCleanup` | → 27 evidence | 3.5 起 `onWatcherCleanup` |
| `useQuery({ placeholderData: keepPreviousData })` | `useQuery` from `@tanstack/vue-query`（同参数） | → 30 evidence | API 同构 |
| `useFetcher` / `<Form action>` | 无对应；vue-router 5 实验数据加载器【尝鲜】 | facts-versions D | Vue Router 核心无 action 概念 |
| `useOptimistic` | 无；手动 `setQueryData` 或本地 ref 回滚 | → 31 evidence | Vue 无内置乐观更新原语 |
| 行 `key={order.id}` 重置编辑态 | `:key="order.id"` | → 06 evidence | 语义一致 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-22-1 | 概念 | 未讲 | 其它 | Thinking in React 五步与「是不是 state 三问」未作为拆页方法讲：为什么 keyword / status / page 在父级、编辑草稿在行内、筛选后列表 / 总页数 / 是否为空都不是 state | — | — | 综合页是承接 25 题 state 归属的落点，课件只给了结果没给推理；面试 1 问「怎么拆、怎么定 state」答不完整 | grep0:Thinking in React\|state 归属\|最小 ；https://react.dev/learn/thinking-in-react（22-outline 逐字："Does it remain unchanged over time?" / "Can you compute it based on existing state or props?"） | 二、核心概念 |
| R2-22-2 | 概念 | 未讲 | Router | 搜索词 / 筛选 / 页码应进 URL query（刷新 / 分享 / 后退可复现）：useSearchParams 函数式更新、切筛选重置 page=1、输入类 replace: true（→ 18） | — | — | 现状全部放 useState，刷新即丢；setSearchParams 整体替换的坑是 18 题主线修改点第 9 条 | grep0:useSearchParams\|searchParams\|URL ；facts-versions C（逐字：setter「整体替换查询串」`navigate("?" + newSearchParams, navigateOptions)`，支持函数式更新）；course-map §7 第 9 条 | 二、核心概念 |
| R2-22-3 | 生产 | 未标简化 | 生产简化 | 每次请求先清空数据（status: 'loading'）导致翻页 / 筛选时表格消失再出现；未说明这是演示简化，也没给「保留上页数据 + isFetching」或 placeholderData: keepPreviousData 的生产做法 | src/topics/22-integrated-order-page/react/Example.tsx:59 | { status: 'loading' } | 面试 2 问「翻页闪烁怎么解决」；ListState 的 loading 分支没有 data 字段，结构上就无法保留旧数据 | https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries（22-outline 逐字："the UI jumps in and out of the success and pending states because each new page is treated like a brand new query"）；grep0:keepPreviousData\|placeholderData\|保留旧数据 | 七、生产环境注意 |
| R2-22-4 | 概念 | 未讲 | Actions | 编辑 / 删除的乐观更新与回滚：TanStack onMutate / onError / onSettled 三段、只用 variables 的轻量版、React 19 useOptimistic（→ 30 / 31） | — | — | 现状是「成功后再改 UI」（:110-116、:119-125），面试 3 问「要不要乐观更新、失败怎么回滚」答不上 | grep0:onMutate\|useOptimistic\|乐观 ；https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates（22-outline 逐字："use the onMutate option to update your cache directly, or leverage the returned variables to update your UI"） | 二、核心概念 |
| R2-22-5 | 概念 | 未讲 | 其它 | 错误分层：请求失败是数据状态（已做），渲染崩溃要靠行级 / 页级 Error Boundary 兜底，resetKeys 随筛选重置（→ 20） | — | — | 综合页是唯一能演示「行级边界只炸一行」的地方；facts-inventory 指出全课没有任何题引用 20 | grep0:ErrorBoundary\|错误边界\|resetKeys ；20 evidence（course-map §3 错误边界主线 class vs react-error-boundary） | 七、生产环境注意 |
| R2-22-6 | 概念 | 未讲 | 安全a11y | 可访问性与安全零提及：table th scope / role="search" / aria-live 播报结果数与错误 / 分页 aria-current / 删除按钮可访问名 / useId 关联 label / 确认删除的焦点管理；后端按当前用户校验订单归属、文本渲染不解析 HTML（→ 35） | — | — | 输入框无 label、loading 时 disabled 会丢焦点（:141）、确认删除只换按钮文案无焦点处理（:354-363）；前端只传 id 但未说明鉴权在后端 | grep0:aria-\|role=\|useId\|焦点\|<label ；grep0:后端\|dangerouslySetInnerHTML ；③ W3C APG dialog-modal 与 ③ OWASP Authorization（22-outline，逐字见 35） | 七、生产环境注意 |
| R2-22-7 | 生产 | 未标简化 | 生产简化 | effect 手写请求未标「演示简化」，生产三种写法（A TanStack useQuery + useMutation + invalidate；B 路由 loader / action + useFetcher 自动 revalidate；C React 19 Actions）一个都没提示 | src/topics/22-integrated-order-page/react/Example.tsx:20 | 30 题（TanStack Query）里各有一版 | 文件头只说 30 题「深入对照」，:108「真实业务也常选择保存后重新拉取」是唯一的生产提示；React 官方明确列出 effect 拉数的四个缺点 | https://react.dev/reference/react/useEffect#what-are-good-alternatives-to-data-fetching-in-effects（11-evidence 逐字："Fetching directly in Effects usually means you don't preload or cache data."）；https://reactrouter.com/7.18.4/start/data/actions（22-outline 逐字："When the action completes, all loader data on the page is revalidated"）；grep0:useFetcher\|useActionState\|演示简化 | 七、生产环境注意 |
| R2-22-8 | 概念 | 缺标签 | 其它 | 行级状态用 editing / confirmingDelete / saving / deleting 四个布尔（16 种组合多数不可能），与列表用判别联合的做法自相矛盾且未说明；官方建议用 status 枚举消灭 impossible states | src/topics/22-integrated-order-page/react/Example.tsx:239-241 | [saving, setSaving] | 大纲「状态结构：Avoid contradictions」主流项；改成 rowStatus: 'view' \| 'editing' \| 'saving' \| 'confirming' \| 'deleting' 与 11 / 29 题一致 | https://react.dev/learn/reacting-to-input-with-state（22-outline 逐字："impossible states"）；https://react.dev/learn/choosing-the-state-structure（22-outline 逐字："Avoid contradictions"） | 六、易错点 |
| R2-22-9 | 生产 | 缺标签 | 其它 | effect 里 `void loadOrders()` 第一行同步 setListState({ status: 'loading' })，切到 eslint-plugin-react-hooks 7 recommended 后 set-state-in-effect（error）可能命中；未提示改法（初始 state 直接 loading / 把请求交给库） | src/topics/22-integrated-order-page/react/Example.tsx:58-59 | async function loadOrders() | 规则文档只说「synchronously in an effect」，嵌套函数是否命中需运行验证（P-22-1）；命中即 lint 失败 | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（逐字："Validates against calling setState synchronously in an effect, which can lead to re-renders that degrade performance."）；facts-versions F（recommended 含 set-state-in-effect: error） | 六、易错点 |
| R2-22-10 | 概念 | 缺标签 | Vue现行写法 | Vue 侧用模块变量 controller 手工 abort，未提 3.5 的 onWatcherCleanup（在 watch 回调内注册清理）这一现行写法（→ 27） | src/topics/22-integrated-order-page/vue/Example.vue:52 | controller?.abort() | 手工变量能用，但 3.5 起 watch 驱动的请求应用 onWatcherCleanup 对照 React 的 effect cleanup | course-map §2（onWatcherCleanup 主责 10 / 27）；https://vuejs.org/api/reactivity-core.html#onwatchercleanup（3.5，原文未抓取，见 P-22-2） | 三、Vue 对照 |
| R2-22-11 | 小问题 | 措辞 | 绝对化 | 「两边完全一样」「与 React 写法一一对应」——行级状态建模（4 布尔 vs reactive 对象）、竞态处理（cleanup vs 模块变量）两边并不完全相同 | src/topics/22-integrated-order-page/react/Example.tsx:18; :15; src/topics/22-integrated-order-page/vue/Example.vue:19; :16 | 两边完全一样 | 规格 §5 B 绝对化论断 | course-map §6 B | 四、关键区别 |
| R2-22-12 | 概念 | 未讲 | 性能 | 搜索输入防抖或 useDeferredValue、筛选切换用 startTransition、大表格虚拟化（→ 14 / 17 / 32） | — | — | 综合页是这些手段的自然落点；面试 5 问「生产上缺什么」 | grep0:useDeferredValue\|防抖\|debounce\|虚拟 ；facts-versions A（useDeferredValue / useTransition 19.2.8 导出） | 七、生产环境注意 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 拿到一个「搜索 + 筛选 + 分页 + 编辑 + 删除」的页面，你怎么拆组件、怎么定 state？（追问：哪些不是 state；state 放哪一层；筛选与页码为什么进 URL；切筛选为什么要重置页码） | 部分 | src/topics/22-integrated-order-page/react/Example.tsx:38-45; :79-82; :94-99; :220-232 | 缺 URL 状态与 Thinking in React 的归属推理 |
| 2 | 分页时切页 UI 闪烁怎么解决？（追问：keepPreviousData 做了什么、isPlaceholderData 何时为真；手写 effect 版怎么保留旧数据；请求竞态怎么防） | 部分 | src/topics/22-integrated-order-page/react/Example.tsx:55-77 | 只有竞态；闪烁根因与保留旧数据未讲（课件本身就闪） |
| 3 | 删除 / 编辑要做乐观更新吗，失败怎么回滚？（追问：TanStack onMutate / onError / onSettled 各做什么；useOptimistic 与之区别；何时只用 variables 就够） | 不能 | — | onMutate / useOptimistic / variables 全无 |
| 4 | 同一页面用 TanStack Query、路由 loader/action、React 19 Actions 三种写法各有什么取舍？（追问：action 完成后 loader 自动 revalidate 的含义；useFetcher 与 Form 区别；服务端状态为什么不放 Zustand） | 不能 | src/topics/22-integrated-order-page/react/Example.tsx:20 | 只提「30 题对照」，loader / action / Actions 零提及 |
| 5 | 这页在生产上会缺什么？（追问：请求取消与错误分层；可访问性——表格语义、aria-live、对话框焦点；安全——前端权限只是 UX、后端按用户过滤、returnTo 校验） | 部分 | src/topics/22-integrated-order-page/react/Example.tsx:56-76; :164-171 | 缺 Error Boundary、可访问性、安全三块 |

### 23. 渲染模型与 state 快照

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 文件头承诺七条：函数重跑、state/props 皆快照、闭包捕获快照、setter 不改局部变量、setter = 排队渲染、改变量无效、UI = f(props, state) 纯函数 | https://react.dev/learn/state-as-a-snapshot | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:5-12 | 四个区块逐条兑现 |
| 主流 | Trigger → Render → Commit 三步；Commit 只改有差异的 DOM 节点；之后浏览器 paint | https://react.dev/learn/render-and-commit | 未讲 | — | R2-23-1（只有「与旧的 diff，得到新 UI」一句） |
| 主流 | 一次渲染 = 一次函数执行 | https://react.dev/learn/state-as-a-snapshot | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:120-134 | 渲染期 console.log 为演示手段，见 R2-23-8 |
| 主流 | state 在一次渲染内不变；`setNumber(number + 1)` 三次只加 1 | https://react.dev/learn/state-as-a-snapshot | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:112-113; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:166-189 | 连写复现在 03 区块一，本题明示分工（:29-30） |
| 主流 | 过去创建的事件处理器持有旧 state（setTimeout 读旧值） | https://react.dev/learn/state-as-a-snapshot | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:43-58; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:76-87 | 用 props 演示，修法指向 26 |
| 主流 | React 把 state 存在组件之外（shelf）；每次 useState 返回该次快照；每次渲染有自己的事件处理器 | https://react.dev/learn/state-as-a-snapshot | 未讲 | — | R2-23-10（:171「另一个函数作用域」擦边） |
| 主流 | 纯函数第二条件「同样输入同样输出」 | https://react.dev/learn/keeping-components-pure | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:43-48; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:89-90 | — |
| 主流 | 纯函数第一条件「不改渲染前已存在的对象」；props/state/context 三种输入只读；局部突变可以 | https://react.dev/learn/keeping-components-pure | 未讲 | — | R2-23-4（:128-129 只讲「渲染期改 ref 不纯」） |
| 主流 | 副作用放事件处理器；useEffect 是 last resort | https://react.dev/learn/keeping-components-pure | 未讲 | — | R2-23-4 |
| 主流 | StrictMode 开发期双渲染、生产无影响；DevTools 灰显第二次日志 | https://react.dev/reference/react/StrictMode（2026-09-17，逐字） | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:125-126; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:206-207 | 与官方「will appear slightly dimmed」一致 |
| 主流 | StrictMode 四条行为（Effect 双跑、ref 回调双跑、废弃 API 检查）+ 双调函数清单（组件体、useState/set/useMemo/useReducer 的函数） | https://react.dev/reference/react/StrictMode（2026-09-17，逐字） | 未讲 | — | R2-23-3（:65「StrictMode 的假卸载」一句带过） |
| 主流 | 重渲染递归向下、不看子组件 props；`Object.is` 相等跳过（可能仍调一次组件）；memo 归 17 | https://react.dev/learn/render-and-commit；https://react.dev/reference/react/useState | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:302-305; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:221-225 | 「个别情况会调用一次再丢弃」与官方一致 |
| 主流 | state 与树位置绑定：同位置同组件保留、换类型或 key 重置；组件内定义组件 → 子树 state 每次重置（lint `static-components`） | https://react.dev/learn/preserving-and-resetting-state | 未讲 | — | R2-23-2 |
| 主流 | 路由参数变化实例复用、state 与 effect 保留；解法 `key={id}` / 依赖数组（落点 18） | https://react.dev/learn/preserving-and-resetting-state；course-map §6 D | 未讲 | — | R2-23-2 |
| 主流 | 渲染期禁止副作用：改外部变量、渲染期 setState、读写 ref.current | https://react.dev/reference/eslint-plugin-react-hooks | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:128-129 | 只讲了 ref；Too many re-renders 归 03（R2-03-5） |
| 较新 | React Compiler 依赖「纯函数 + 不可变」前提；lint `purity` / `refs` / `set-state-in-render` / `static-components` | https://react.dev/reference/react/memo；facts-versions.md F | 未讲 | — | R2-23-5；本项目 eslint.config.js 未启用 recommended |
| 尝鲜 | 19.3：StrictMode 在 hydration 时也双调 Effects | facts-versions.md B | 未讲 | — | R2-23-3（合并） |
| 旧写法 | class `this.state` 是可变实例字段，事件处理器读到最新值而非快照 | https://react.dev/reference/react/Component（2026-09-17，逐字） | 未讲 | — | R2-23-6 |
| 主流 | 「setState 同步还是异步」用快照解释（大纲未列） | https://react.dev/reference/react/useState | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:179-180 | 大纲未列 |
| 主流 | React 18+ 同一事件多次 setter 合并一次渲染（大纲未列，→24） | https://react.dev/learn/queueing-a-series-of-state-updates | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:176-177 | 大纲未列 |
| 主流 | 只追加列表 index 作 key 的例外（→06）；定时器 id 存 ref + effect cleanup（→12 / 10）（大纲未列） | https://react.dev/learn/rendering-lists；https://react.dev/reference/react/useRef | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:236-239; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:62-74 | 大纲未列 |
| 主流 | Vue：setup 只跑一次；render 是 reactive effect，依赖变了 effect 重跑；onUpdated 观察 | https://vuejs.org/guide/extras/rendering-mechanism.html（2026-09-17，逐字） | 已讲对 | src/topics/23-rendering-and-state-snapshot/vue/Example.vue:38-69 | 与官方 Render Pipeline 一致 |
| 主流 | Vue 依赖追踪精确到「组件的 render effect」 | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-17，逐字） | 已讲对 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:15; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:23 | 「精确触发」可接受，建议明说「组件级」 |
| 主流 | Vue 无快照：`count.value` 现读现取；props 响应式；手动拷贝才过期 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/23-rendering-and-state-snapshot/vue/Example.vue:71-86; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:116-140 | 讲得好 |
| 主流 | Vue 原理：`reactive` 用 Proxy、`ref` 用 getter/setter | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-17，逐字） | 讲了但错 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:16; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:18; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:76 | R2-23-7 |
| 主流 | Vue 纯函数要求：computed / onUpdated 里不改被渲染的状态 | https://vuejs.org/guide/essentials/computed.html | 已讲对 | src/topics/23-rendering-and-state-snapshot/vue/Example.vue:62-69; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:121 | — |
| 主流 | Vue 无 StrictMode 对应物；调试钩子 onRenderTracked / onRenderTriggered | https://react.dev/reference/react/StrictMode | 未讲 | — | R2-23-3（合并） |
| 主流 | Vue key / `<component :is>` / v-if 切换销毁实例；路由复用实例坑同样存在 | https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key | 未讲 | — | R2-23-2（合并） |
| 主流 | 模板残留「没有一一对应关系」与绝对化 | course-map §6 B / H | 讲了但错 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:20; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:57; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:161; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:183; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:23; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:97; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:123 | R2-23-9 |

#### 面试 5 问

1. React 组件「重渲染」到底发生了什么？DOM 一定会更新吗？（追问：Render 和 Commit 分别做什么，为什么说渲染必须是纯的？）
2. 点一次按钮里 `setCount(count + 1)` 写三次，结果是 1 还是 3，为什么？（追问：改成 `c => c + 1` 为什么就是 3，这和 24 题的批处理是一回事吗？）
3. `setTimeout(() => alert(count), 3000)` 期间又点了几次，alert 出来的是哪个值？（追问：想拿最新值该怎么办——ref / 函数式更新 / useEffectEvent，指向 26）
4. StrictMode 为什么让我的组件渲染两次、effect 跑两次？上线会这样吗？（追问：哪些函数会被调两次？初始化函数里 `Math.random()` 会怎样？）
5. 父组件重渲染，子组件 props 没变也会重渲染吗？（追问：什么情况下 React 会跳过——`Object.is` 相同、memo、Compiler；state 在什么条件下会被重置——位置 / 类型 / key）

#### 生产写法要点

- 演示里把「渲染次数」打印到 console 只能在开发期看，StrictMode 下会翻倍；要量重渲染用 React DevTools Profiler（17 题）。
- 依赖「渲染两次结果不同」的代码（初始化里生成 id、发请求、写全局）一律视为 bug，不是「关掉 StrictMode」就完事。
- 路由页面组件按 `key={params.id}` 或正确的 effect 依赖处理实例复用；列表页 / 详情页切换 id 必须能重置内部草稿状态。
- 需要「最新值」的异步回调（轮询、WebSocket、第三方回调）用函数式更新或 ref，不要拉长依赖数组硬凑（26）。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| 一次渲染 = 整个组件函数重跑，UI = f(props, state) | `<script setup>` 只跑一次；渲染函数是一个 reactive effect，「When a dependency used during mount changes, the effect re-runs」 | https://vuejs.org/guide/extras/rendering-mechanism.html（2026-09-16，逐字 Render Pipeline） | Vue 只重跑 render 函数，setup 里的闭包不会重建；React 每次渲染都重建闭包 → 快照 |
| 重渲染从触发组件递归向下 | 依赖追踪精确到组件：只有读了该状态的组件的 render effect 重跑；编译期 patch flags / tree flattening 再减少 diff | https://vuejs.org/guide/extras/rendering-mechanism.html（2026-09-16，逐字）；https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-16，逐字 track / trigger） | 「Vue 自动、React 手动 memo」的根源在此 |
| state 快照：事件处理器读旧值 | 无快照：`count.value` 永远是最新值，setTimeout 里读到的是当前值 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，逐字） | Vue 值是可变容器；「读旧值」在 Vue 里不会发生，但 DOM 延后到 nextTick（24） |
| 纯函数 / 不可变输入 | 模板与 computed 也要求无副作用（getter 只读），但 reactive 状态可原地改 | https://vuejs.org/guide/essentials/computed.html（2026-09-16，摘要；未逐字抓取） | 「纯」的要求相同，「不可变」只 React 有（21） |
| StrictMode 双调 | 无对应物 | https://react.dev/reference/react/StrictMode（2026-09-16，逐字） | 原因：Vue 的 setup 不重跑，没有「渲染纯度」需要暴露；Vue 的调试钩子是 `onRenderTracked` / `onRenderTriggered` |
| state 绑定树位置、key 重置 | 同样依赖 vnode 位置与 `key`；`<component :is>` / `v-if` 切换类型销毁实例 | https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key（2026-09-16，摘要；未逐字抓取） | 两边一致；Vue 路由复用实例的坑同样存在（`<RouterView :key>` / watch params） |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-23-1 | 概念 | 未讲 | 其它 | Trigger → Render → Commit 三阶段与「Commit 只改有差异的 DOM 节点」、浏览器 paint 未讲 | — | — | 题目叫「渲染模型」却没有官方三阶段命名；学习者答不出「重渲染 ≠ 改 DOM」；官方逐字「React only changes the DOM nodes if there's a difference between renders」 | grep0:Commit\|提交阶段\|Trigger | 二、核心概念 |
| R2-23-2 | 概念 | 未讲 | 其它 | state 与渲染树位置绑定：同位置同组件保留 / 换类型或 key 重置；组件内定义组件的坑；路由参数变化实例复用 | — | — | 这是「渲染模型」里 state 归属的另一半，也是 18 题「React 没有实例复用坑」错误的原理出处；Vue 侧 key / `<component :is>` / `<RouterView :key>` 同样未对照 | grep0:同一位置\|同位置\|key 重置\|实例复用 | 二、核心概念 |
| R2-23-3 | 概念 | 未讲 | 其它 | StrictMode 四条行为 + 双调函数清单（组件体、useState / set / useMemo / useReducer 的函数）+ 19.3 hydration 双调【尝鲜】+ Vue 无对应物 | — | — | 只讲了「组件渲染两遍、生产一次」；面试追问「哪些函数被调两次、初始化里 Math.random 会怎样」答不出；官方逐字「Functions that you pass to useState, set functions, useMemo, or useReducer」 | grep0:初始化函数\|更新函数\|ref 回调\|setup → cleanup | 六、易错点 |
| R2-23-4 | 概念 | 未讲 | 其它 | 纯函数完整定义（不改渲染前已存在的对象；props / state / context 只读；局部突变可以）与副作用去处（事件处理器；useEffect 最后手段） | — | — | UI = f(props, state) 只讲了「同输入同输出」半条；「渲染期能不能 new 一个对象再改它」这类追问无依据 | grep0:局部突变\|刚创建的对象\|副作用 | 二、核心概念 |
| R2-23-5 | 概念 | 未讲 | 性能 | React Compiler 依赖「纯函数 + 不可变」前提做自动记忆化；lint `purity` / `refs` / `set-state-in-render` / `static-components` | — | — | 规格要求讲 Compiler 原理与 lint；本项目 eslint.config.js:33-39 只开 2 条规则，recommended 的编译器规则未生效 | grep0:lint\|Compiler\|编译器 | 九、新动向 |
| R2-23-6 | 概念 | 未讲 | 旧写法 | class 组件 `this.state` 是可变实例字段、事件处理器读最新值而非快照；官方「we don't recommend using them in new code」 | — | — | 存量 class 代码里「快照」不成立，读老代码会错判；官方 Pitfall 同时说明 `setState` 后立刻读 `this.state` 仍是旧值（https://react.dev/reference/react/Component，2026-09-17，逐字） | grep0:类组件\|this\.state | 八、旧写法对照 |
| R2-23-7 | 概念 | 讲错 | 其它 | 「ref / reactive 是长期存活的 Proxy 容器」：`ref` 不是 Proxy | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:16; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:18; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:76 | 长期存活的 Proxy 容器 | 官方逐字「In Vue 3, Proxies are used for reactive objects and getter / setters are used for refs」；`ref(0)` 是带 getter/setter 的 RefImpl，只有装对象时内部才用 reactive 包一层 | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-17，逐字） | 三、Vue 对照 |
| R2-23-8 | 生产 | 未标简化 | 生产简化 | 渲染期 console.log 数渲染次数是演示手段，未标「演示简化」，也没给生产做法（React DevTools Profiler，17） | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:134 | Example 函数执行，count = | 生产里量重渲染用 Profiler；渲染期 log 在 StrictMode 下翻倍、上线要删；应明说「本课为观察渲染故意在函数体打印」 | https://react.dev/learn/react-developer-tools | 七、生产环境注意 |
| R2-23-9 | 小问题 | 措辞 | 绝对化 | 模板残留「没有一一对应关系」7 处；「Vue 根本没有…这个概念」「稳赢」 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:20; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:57; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:139; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:161; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:183; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:23; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:97; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:123 | 这些在 Vue 里都没有一一对应关系 | 结论本身对，但模板句机械贴在句尾；改成「原因：setup 不重跑、闭包不重建」一句即可 | course-map §6 B / H | 三、Vue 对照 |
| R2-23-10 | 小问题 | 未讲 | 其它 | 「state 存在组件函数之外（React 内部），每次调用 useState 返回该次渲染的快照」未明说 | — | — | 学习者容易误以为 state 是函数里的局部变量；官方 Recap「React keeps state outside of your component, as if on a shelf」 | grep0:组件外\|架子\|shelf | 二、核心概念 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | React 组件「重渲染」到底发生了什么？DOM 一定会更新吗？追问：Render 和 Commit 分别做什么、为什么渲染必须纯 | 部分 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:22-26; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:221-225 | 缺 Render / Commit 分阶段命名与「只改有差异的 DOM 节点」 |
| 2 | 一次点击里 `setCount(count + 1)` 写三次结果是 1 还是 3？追问：`c => c + 1` 为什么是 3、和批处理是一回事吗 | 能 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:166-189; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:81-82; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:176-177 | — |
| 3 | `setTimeout(() => alert(count), 3000)` 期间又点了几次，alert 的是哪个值？追问：想拿最新值怎么办 | 能 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:50-56; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:76-87; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:30 | — |
| 4 | StrictMode 为什么让组件渲染两次、effect 跑两次？上线会这样吗？追问：哪些函数被调两次、初始化里 `Math.random()` 会怎样 | 部分 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:125-126; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:206-207 | 缺双调函数清单、Effect / ref 回调双跑、初始化不纯的后果 |
| 5 | 父组件重渲染，子组件 props 没变也会重渲染吗？追问：什么情况下跳过、state 何时被重置 | 部分 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:302-305; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:221-225 | 缺 state 重置条件（位置 / 类型 / key） |

### 24. State batching 与函数式更新

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 批处理定义：事件处理器全部跑完才处理更新，避免半成品渲染（文件头承诺） | https://react.dev/learn/queueing-a-series-of-state-updates | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:5-6; src/topics/24-batching-and-functional-updates/react/Example.tsx:255-258 | — |
| 主流 | 不跨事件批处理：每次点击单独处理，第一次点击禁用后第二次不会再提交 | https://react.dev/learn/queueing-a-series-of-state-updates | 未讲 | — | R2-24-5 |
| 主流 | 队列规则一：updater 入队，上一条结果作下一条入参（承诺） | https://react.dev/learn/queueing-a-series-of-state-updates | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:109-129; src/topics/24-batching-and-functional-updates/react/Example.tsx:178-183 | applyQueue 模拟器 + 按钮 B，预测值与实际对照 |
| 主流 | 队列规则二：传值 = 替换、丢弃已排队；`setN(n+5); setN(n=>n+1); setN(42)` 结果 42 | https://react.dev/learn/queueing-a-series-of-state-updates | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:185-198 | 按钮 C / D |
| 主流 | 函数式更新判定规则：由旧算新且手里的旧值可能过期（同一事件多次 / 异步回调 / 脱离当前渲染复用 / 自定义 Hook 暴露）；反例传值即可（承诺） | https://react.dev/reference/react/useState；https://react.dev/learn/state-as-a-snapshot | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:359-368; src/topics/24-batching-and-functional-updates/react/Example.tsx:385-405 | 区块三连点 3 次实测 |
| 主流 | updater 必须纯；StrictMode 开发期双调（承诺） | https://react.dev/learn/queueing-a-series-of-state-updates | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:15; src/topics/24-batching-and-functional-updates/react/Example.tsx:121-122 | — |
| 主流 | 命名约定 `prev` / 首字母 / 全名 | https://react.dev/learn/queueing-a-series-of-state-updates | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:105; src/topics/24-batching-and-functional-updates/react/Example.tsx:165 | 仅代码体现（prev / current / c），无文字说明 |
| 主流 | `Object.is` 相等跳过重渲染；set 函数身份稳定可省出依赖 | https://react.dev/reference/react/useState | 未讲 | — | R2-24-6 |
| 主流 | React 18 自动批处理：前提 createRoot；覆盖 timeouts / promises / 原生事件（承诺） | https://react.dev/blog/2022/03/08/react-18-upgrade-guide | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:10-11; src/topics/24-batching-and-functional-updates/react/Example.tsx:259-260; src/topics/24-batching-and-functional-updates/react/Example.tsx:295-302 | setTimeout 按钮实测；标签见 R2-24-12 |
| 主流 | flushSync 签名 `flushSync<R>(fn: () => R): R`、从 react-dom 导入、回调返回时 DOM 已更新（承诺） | https://react.dev/reference/react-dom/flushSync；node_modules/@types/react-dom/index.d.ts:22 | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:35; src/topics/24-batching-and-functional-updates/react/Example.tsx:262-266; src/topics/24-batching-and-functional-updates/react/Example.tsx:304-321 | 两个按钮实测新旧 DOM 文本 |
| 主流 | flushSync 代价（显著伤性能）与用例（量 DOM 后滚动、第三方集成）（承诺） | https://react.dev/reference/react-dom/flushSync | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:264-266 | — |
| 主流 | flushSync 其余注意：可能强制 Suspense 边界显示 fallback、可能同步跑 pending Effects、可能把回调外的更新一起刷 | https://react.dev/reference/react-dom/flushSync | 未讲 | — | R2-24-2 |
| 主流 | useReducer 的 dispatch 同样入队、批处理、Object.is 跳过 → 29 | https://react.dev/reference/react/useReducer | 未讲 | — | R2-24-7 |
| 主流 | 「set 后立刻读」是快照不是批处理；批处理决定渲染几次、快照决定读到什么 | https://react.dev/learn/state-as-a-snapshot；https://react.dev/learn/queueing-a-series-of-state-updates | 讲了但错 | src/topics/24-batching-and-functional-updates/react/Example.tsx:256-257 | R2-24-1；src/topics/24-batching-and-functional-updates/react/Example.tsx:144-147 讲对，两处矛盾 |
| 较新 | Transition 内更新与紧急更新分开批处理 / 渲染；19.3 起 Transitions 独立渲染 | facts-versions.md B（https://react.dev/blog/2026/09/09/react-19-3）；https://react.dev/reference/react/useTransition | 未讲 | — | R2-24-8；主责 32 |
| 旧写法 | React 17 及以前只在 React 事件里批处理；18.0 起变化 | https://react.dev/blog/2022/03/08/react-18-upgrade-guide | 缺标签 | src/topics/24-batching-and-functional-updates/react/Example.tsx:11; src/topics/24-batching-and-functional-updates/react/Example.tsx:259-260 | R2-24-12 |
| 旧写法 | React 18 + legacy `ReactDOM.render` 行为同 17；19 已移除 `render` | https://react.dev/blog/2022/03/08/react-18-upgrade-guide；facts-versions.md B | 未讲 | — | R2-24-3 |
| 旧写法 | `ReactDOM.unstable_batchedUpdates(fn)` 手动批处理 | https://github.com/reactwg/react-18/discussions/21（③）；node_modules/react-dom/cjs/react-dom.development.js:410 | 未讲 | — | R2-24-3；19.2.8 仍导出 |
| 主流 | Vue：同一 tick 缓冲到 next tick 只刷新一次，不分事件来源（承诺） | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing | 已讲对 | src/topics/24-batching-and-functional-updates/vue/Example.vue:121-127; src/topics/24-batching-and-functional-updates/vue/Example.vue:141-148 | `flush: 'post'` watch 作探针，同一事件 / setTimeout 各 +1 |
| 主流 | Vue nextTick「等它刷完」与 flushSync「逼它现在刷」方向相反；Vue 无强制同步刷新公开 API（承诺） | https://vuejs.org/guide/essentials/reactivity-fundamentals.html；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:61-62 | 已讲对 | src/topics/24-batching-and-functional-updates/vue/Example.vue:129-130; src/topics/24-batching-and-functional-updates/vue/Example.vue:166-172; src/topics/24-batching-and-functional-updates/react/Example.tsx:268-269 | — |
| 主流 | Vue 无函数式更新对应物：ref 是可变容器不是快照（承诺） | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/24-batching-and-functional-updates/vue/Example.vue:62-73; src/topics/24-batching-and-functional-updates/react/Example.tsx:152-153 | — |
| 主流 | 「set 后 log 旧值」在 Vue 里 log 新值；差异在值不在 DOM | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/24-batching-and-functional-updates/vue/Example.vue:174-187 | 数据新、DOM 旧的日志行 |
| 主流 | Vue 无「17 vs 18」版本分水岭 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/24-batching-and-functional-updates/vue/Example.vue:21-22; src/topics/24-batching-and-functional-updates/vue/Example.vue:127 | — |
| 主流 | Pinia `$patch` 一次改多字段、`$subscribe` 只触发一次（落点 16） | https://pinia.vuejs.org/core-concepts/state.html | 未讲 | — | R2-24-7 |
| 主流 | Vue 里唯一会过期的是手动拷进普通变量的 `.value` 快照 | — | 已讲对 | src/topics/24-batching-and-functional-updates/vue/Example.vue:197-201; src/topics/24-batching-and-functional-updates/vue/Example.vue:218-228 | 大纲未列；好内容 |
| 主流 | 探针 effect 数提交次数 + StrictMode 双跑说明 | https://react.dev/reference/react/StrictMode | 已讲对 | src/topics/24-batching-and-functional-updates/react/Example.tsx:245-253; src/topics/24-batching-and-functional-updates/react/Example.tsx:281-284 | 大纲未列；lint 见 R2-24-9 |

#### 面试 5 问

1. React 18 的「自动批处理」到底改了什么？（追问：为什么必须用 `createRoot`，`ReactDOM.render` 为什么不行？）
2. 同一个 onClick 里 `setA(1); setB(2); setC(3)` 渲染几次？放进 `setTimeout` 里呢？放进 `await fetch()` 之后呢？（追问：17 和 18 的答案分别是什么？）
3. 什么时候必须用 `setX(prev => ...)`，什么时候传值就够？（追问：`setN(n+5); setN(n=>n+1); setN(42)` 最终是多少、为什么？）
4. 什么场景需要 `flushSync`，它有什么代价？（追问：它能解决「set 后立刻读到新值」吗——不能，读的仍是快照，它只保证 DOM 已更新）
5. 「set 后 console.log 还是旧值」是批处理造成的吗？（追问：如果 React 不批处理、立刻同步渲染，log 会变吗？）

#### 生产写法要点

- 演示的「计数三连击」是教学；生产里凡是依赖上一状态的更新（计数、toggle、追加列表项）一律写更新函数，防止并发事件和异步回调覆盖。
- `flushSync` 只用于「必须在下一行拿到 DOM 结果」的集成场景（打印、滚动到新插入的行、第三方库测量）；不要用它「修」读旧值问题。
- 若项目仍是 React 18 但入口还是 `ReactDOM.render`（legacy root），行为等同 17，批处理不自动；升级第一步是换 `createRoot`（19 已移除 `render`）。
- 更新函数里不要 dispatch / 发请求 / 写 ref；副作用放事件处理器或 effect。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| 同一事件多次 setState 合并成一次渲染 | 「Vue buffers them until the "next tick" in the update cycle to ensure that each component updates only once no matter how many state changes you have made」 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing（2026-09-16，逐字） | 两边都「一次事件一次更新」；Vue 不分事件来源，天然对 setTimeout / promise 也生效 |
| `flushSync(() => setX())` 后 DOM 已更新 | `count.value++; await nextTick()` 后 DOM 已更新；签名 `nextTick(): Promise<void>` / `nextTick(fn)` | node_modules/@vue/runtime-core/dist/runtime-core.d.ts:61-62（①）；同上 vuejs.org 页（逐字） | 方向相反：flushSync 是「提前刷」、nextTick 是「等它刷」；Vue 没有强制同步刷新的公开 API |
| 函数式更新 `setX(p => p + 1)` | 无对应物：`count.value++` 直接读最新值，不存在「pending state」 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，逐字） | 原因：Vue 的 ref 是可变容器不是快照 |
| 「set 后 log 旧值」 | `count.value++` 后立刻 log 是新值 | 同上 | 差异在「值」而非「DOM」；DOM 两边都延后 |
| React 17 只在合成事件批处理 | Vue 2 / 3 一直按 tick 缓冲 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，摘要） | Vue 没有对应的「版本分水岭」 |
| Pinia `$patch` 一次改多字段 | `store.$patch({...})` / `$patch(state => ...)`；`$subscribe` 「will trigger only once after patches」 | https://pinia.vuejs.org/core-concepts/state.html（2026-09-16，逐字） | 类似「一次事件一次通知」的思路，落点在 16 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-24-1 | 概念 | 讲错 | 绝对化 | 把「处理器里读 state 是旧值」归因于批处理 | src/topics/24-batching-and-functional-updates/react/Example.tsx:256-257 | 所以处理器里读 state 永远是旧值 | 读旧值是快照（闭包）造成，与是否批处理无关：即使 React 同步渲染，闭包里的 count 也不会变；同文件 :144-147 已正确说「和批不批处理无关」，两处自相矛盾，面试第 5 问会答反 | https://react.dev/learn/state-as-a-snapshot（逐字，大纲已引）；https://react.dev/learn/queueing-a-series-of-state-updates（逐字，大纲已引） | 六、易错点 |
| R2-24-2 | 概念 | 未讲 | 其它 | flushSync 其余三条注意事项未讲 | — | — | 只讲了性能代价与用例；缺「可能强制 Suspense 边界显示 fallback」「可能同步跑 pending Effects 并应用其中更新」「可能把回调外的更新一起刷」；面试第 4 问的「代价」答不全 | https://react.dev/reference/react-dom/flushSync（逐字，大纲已引） | 六、易错点 |
| R2-24-3 | 概念 | 未讲 | 旧写法 | legacy `ReactDOM.render` 与 `unstable_batchedUpdates` 的旧写法对照缺失 | — | — | 课件说「17 只在事件里批、18 起 createRoot 一律批」，但没讲「18 + `ReactDOM.render` 仍是旧行为」（升级第一步是换 createRoot；19 已移除 render）与 17 时代库用的 `unstable_batchedUpdates`（19.2.8 仍导出） | https://react.dev/blog/2022/03/08/react-18-upgrade-guide（逐字，大纲已引）；https://github.com/reactwg/react-18/discussions/21（③，逐字："This API still exists in 18, but it isn't necessary anymore because batching happens automatically"；"React 18 with legacy `render` keeps the old behavior"）；node_modules/react-dom/cjs/react-dom.development.js:410 | 八、旧写法对照 |
| R2-24-4 | 概念 | 未讲 | 其它 | 「flushSync 不能让处理器里的 state 变量变新」未明说 | — | — | :317-321 只演示 flushSync 后 DOM 文本已新；没有一句说「count 变量仍是本次渲染的快照，flushSync 只保证 DOM 已提交」，学习者容易把 flushSync 当成「读新值」的修法 | https://react.dev/reference/react-dom/flushSync（逐字，大纲已引）；https://react.dev/learn/state-as-a-snapshot | 五、常见追问 |
| R2-24-5 | 概念 | 未讲 | 其它 | 「React 不跨事件批处理」未讲 | — | — | 官方明确「React does not batch across multiple intentional events like clicks」；课件只有「同一事件里合并」的正面，没有边界（两次点击各自渲染；第一次点击禁用表单后第二次不会再提交） | https://react.dev/learn/queueing-a-series-of-state-updates（逐字，大纲已引） | 二、核心概念 |
| R2-24-6 | 概念 | 未讲 | 其它 | `Object.is` 相同值跳过渲染、set 函数身份稳定未讲 | — | — | 批处理题常追问「setCount(0) 连点会渲染吗」「setter 要不要进依赖」；:366 只说 useCallback 时不必把 count 写进依赖，未说 setter 本身稳定 | https://react.dev/reference/react/useState（逐字，大纲已引） | 五、常见追问 |
| R2-24-7 | 概念 | 未讲 | 交叉引用 | 缺两处一句话落点：useReducer 的 dispatch 同规则 → 29；Pinia `$patch` → 16 | — | — | 29 题两处反向指 24（29:213、29:226），24 没有一句说 dispatch 同样入队批处理；Vue 对照缺 `$patch` 一次改多字段指向 16 | https://react.dev/reference/react/useReducer（逐字 dispatch caveats，大纲已引）；https://pinia.vuejs.org/core-concepts/state.html（逐字，大纲已引） | 五、常见追问 |
| R2-24-8 | 概念 | 未讲 | 并发 | Transition 内更新与紧急更新分开批处理未提 | — | — | 【较新】主责 32，本题需一句：startTransition 里的更新与紧急更新分开批 / 分开渲染，19.3 起 Transitions 独立渲染「不再纠缠」 | facts-versions.md B（https://react.dev/blog/2026/09/09/react-19-3） | 九、新动向 |
| R2-24-9 | 生产 | 未标简化 | 生产简化 | 探针 effect 同步 setState 命中 `react-hooks/set-state-in-effect` | src/topics/24-batching-and-functional-updates/react/Example.tsx:281-284 | setCommits((c) => c + 1) | :253 已说是探针非业务模式，但未写规则名与处置：eslint-plugin-react-hooks 7 `recommended` 含 `set-state-in-effect`(error)，项目 eslint.config.js:35-38 目前只手写 rules-of-hooks / exhaustive-deps，一旦切到 recommended 此文件 lint 失败；需加 `// eslint-disable-next-line react-hooks/set-state-in-effect` 并注明，或改 ref 计数 + 渲染期读取 | node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:18141-18145（① "Validates against calling setState synchronously in an effect"）；https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（逐字："Validates against calling setState synchronously in an effect, which can lead to re-renders that degrade performance."）；facts-versions.md F | 七、生产环境注意 |
| R2-24-10 | 概念 | 措辞 | 绝对化 | 「在 Vue 里根本没有这个坑」与 Vue 侧自相矛盾 | src/topics/24-batching-and-functional-updates/react/Example.tsx:375 | 在 Vue 里根本没有这个坑 | Vue 侧 :197-201 / :218-228 专门演示了「拷贝 .value 快照」造成的同一个坑；应改为「Vue 里只有手动拷贝快照才会出现」 | src/topics/24-batching-and-functional-updates/vue/Example.vue:197-201（课件自身） | 三、Vue 对照 |
| R2-24-11 | 小问题 | 措辞 | 绝对化 | 「永远不会画到屏幕上」等绝对化 + 「没有一一对应关系」模板残留 7 处 | src/topics/24-batching-and-functional-updates/react/Example.tsx:10; src/topics/24-batching-and-functional-updates/react/Example.tsx:258; src/topics/24-batching-and-functional-updates/vue/Example.vue:11; src/topics/24-batching-and-functional-updates/vue/Example.vue:46; src/topics/24-batching-and-functional-updates/react/Example.tsx:19; src/topics/24-batching-and-functional-updates/react/Example.tsx:153; src/topics/24-batching-and-functional-updates/vue/Example.vue:20; src/topics/24-batching-and-functional-updates/vue/Example.vue:69; src/topics/24-batching-and-functional-updates/vue/Example.vue:129; src/topics/24-batching-and-functional-updates/vue/Example.vue:196 | 中间状态永远不会画到屏幕上 | flushSync 本身就会把中间状态画出来（:304-309 自己演示了），应限定「批处理生效时」；vue:46「纪律…完全一致」改「相同」；「没有一一对应关系」保留一处并说明原因即可 | https://react.dev/reference/react-dom/flushSync（逐字，大纲已引）；course-map §6 H | 四、关键区别 |
| R2-24-12 | 小问题 | 缺标签 | 旧写法 | React 17 差异段无【旧写法】标签、无版本号；全文无成熟度标签 | src/topics/24-batching-and-functional-updates/react/Example.tsx:11; src/topics/24-batching-and-functional-updates/react/Example.tsx:259-260; src/topics/24-batching-and-functional-updates/react/Example.tsx:295; src/topics/24-batching-and-functional-updates/vue/Example.vue:12 | React 17 只在 React 自己的事件处理器里批 | 规格要求版本差异标【旧写法】并注明「18.0（2022-03）起随 createRoot 变化」；grep 【主流】【较新】【旧写法】【尝鲜】全文 0 命中 | https://react.dev/blog/2022/03/08/react-18-upgrade-guide（逐字，大纲已引）；course-map §5 | 八、旧写法对照 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | React 18 的「自动批处理」到底改了什么？（追问：为什么必须用 createRoot，ReactDOM.render 为什么不行？） | 部分 | src/topics/24-batching-and-functional-updates/react/Example.tsx:259-260 | 缺「18 + legacy ReactDOM.render 行为同 17」「19 已移除 render」 |
| 2 | 同一个 onClick 里 setA/setB/setC 渲染几次？setTimeout 里呢？await fetch() 之后呢？（追问：17 和 18 分别是什么？） | 能 | src/topics/24-batching-and-functional-updates/react/Example.tsx:255-260; src/topics/24-batching-and-functional-updates/react/Example.tsx:295-302 | — |
| 3 | 什么时候必须用 setX(prev => ...)？（追问：setN(n+5); setN(n=>n+1); setN(42) 最终是多少、为什么？） | 能 | src/topics/24-batching-and-functional-updates/react/Example.tsx:185-198; src/topics/24-batching-and-functional-updates/react/Example.tsx:359-368 | — |
| 4 | 什么场景需要 flushSync，代价是什么？（追问：能解决「set 后立刻读到新值」吗？） | 部分 | src/topics/24-batching-and-functional-updates/react/Example.tsx:262-266; src/topics/24-batching-and-functional-updates/react/Example.tsx:317-321 | 缺「flushSync 后 count 变量仍是快照」的明说；缺 Suspense fallback / pending Effects 代价 |
| 5 | 「set 后 console.log 还是旧值」是批处理造成的吗？（追问：不批处理、同步渲染，log 会变吗？） | 部分 | src/topics/24-batching-and-functional-updates/react/Example.tsx:144-147 | :256-257 反向归因，学习者会读到两个矛盾结论 |

### 25. 状态提升与 state 归属

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 定义：从子组件移除 state，放到最近共同父组件，再用 props 传回 | https://react.dev/learn/sharing-state-between-components | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:7-8; src/topics/25-state-ownership-and-lifting/react/Example.tsx:308-316 | 文件头承诺 |
| 主流 | 三步法：移除子 state → 父先传硬编码 → 父加 state 并连同处理器传下 | https://react.dev/learn/sharing-state-between-components | 未讲 | — | R2-25-1 |
| 主流 | 受控 / 非受控组件（组件级）：driven by props vs local state，实践中混合 | https://react.dev/learn/sharing-state-between-components | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:80-94; src/topics/25-state-ownership-and-lifting/react/Example.tsx:266-268 | 有正反两例但缺官方定义句与取舍 → R2-25-2 |
| 主流 | 单一数据源：每份 state 有唯一 owner | https://react.dev/learn/sharing-state-between-components | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:5-6; src/topics/25-state-ownership-and-lifting/react/Example.tsx:183-185 | 文件头承诺 |
| 主流 | 什么不是 state（三问：随时间不变 / 父传来 / 能算出） | https://react.dev/learn/thinking-in-react | 未讲 | — | R2-25-3（只有「能算出的不是 state」:322-323） |
| 主流 | state 放哪（Step 4）：找依赖组件 → 最近公共父 → 必要时新建组件专门持有 | https://react.dev/learn/thinking-in-react | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:9-12; src/topics/25-state-ownership-and-lifting/react/Example.tsx:310 | 「新建持有 state 的组件」未讲，并入 R2-25-3 |
| 主流 | 反向数据流：owner 才能 setX，setter 当 props 传下 | https://react.dev/learn/thinking-in-react | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:22-23; src/topics/25-state-ownership-and-lifting/react/Example.tsx:311-312; src/topics/25-state-ownership-and-lifting/react/Example.tsx:390-392 | setter 引用稳定已讲 |
| 主流 | 提升的代价：父变胖、子树重渲染、prop drilling | https://react.dev/learn/passing-data-deeply-with-context | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:17-18; src/topics/25-state-ownership-and-lifting/react/Example.tsx:136-137 | 文件头承诺 |
| 主流 | 先 props → 抽组件传 JSX 作 children → 再 context | https://react.dev/learn/passing-data-deeply-with-context | 未讲 | — | R2-25-4 |
| 主流 | 何时留子组件（UI 瞬态）/ 何时上 store（跨页面、多处读写） | https://react.dev/learn/passing-data-deeply-with-context；https://redux.js.org/introduction/getting-started | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:16-21; src/topics/25-state-ownership-and-lifting/react/Example.tsx:126-140; src/topics/25-state-ownership-and-lifting/react/Example.tsx:373-377 | Context 一层与 store 加分判据缺 → R2-25-4 |
| 主流 | 服务端数据交给 Query（30）；URL 能表达的放路由（18） | https://tanstack.com/query/v5/docs/framework/react/guides/does-this-replace-client-state | 未讲 | — | R2-25-5 |
| 主流 | 提升后的重置：state 生命周期随 owner；切换实体用 key 重置子树 | https://react.dev/learn/preserving-and-resetting-state | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:268; src/topics/25-state-ownership-and-lifting/react/Example.tsx:414-422 | key 只一句；指向 10 题存疑 → R2-25-8 |
| 主流 | 不镜像 props 进 state；例外 `initial` / `default` 前缀 | https://react.dev/learn/choosing-the-state-structure | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:246-268; src/topics/25-state-ownership-and-lifting/vue/ProductListOwnCopy.vue:5-24 | 文件头承诺；讲得最充分 |
| 主流 | state 结构：合并一起变的 state；选中态存 id | https://react.dev/learn/choosing-the-state-structure | 未讲 | — | R2-25-3 |
| 主流 | 提升 + useReducer + Context 模块化写法（TasksProvider / useTasks） | https://react.dev/learn/scaling-up-with-reducer-and-context | 未讲 | — | 主责 29 / 15；并入 R2-25-4 一句指向 |
| 较新 | React 19 ref 作 prop：提升命令式句柄无需 forwardRef | https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-25-6 |
| 旧写法 | HOC / render props 做状态共享 | https://react.dev/learn/reusing-logic-with-custom-hooks | 未讲 | — | R2-25-6 |
| 主流 | Vue：props down / events up，子 emit 让父改 | https://vuejs.org/guide/components/props.html#one-way-data-flow | 已讲对 | src/topics/25-state-ownership-and-lifting/vue/Example.vue:26-31; src/topics/25-state-ownership-and-lifting/vue/CategoryFilter.vue:5-10 | 文件头承诺 |
| 主流 | Vue：`defineModel`（3.4+）= modelValue + update:modelValue | node_modules/@vue/runtime-core/dist/runtime-core.d.ts:334-345 | 已讲对 | src/topics/25-state-ownership-and-lifting/vue/SearchBar.vue:7-13; src/topics/25-state-ownership-and-lifting/vue/Example.vue:29-31 | 文件头承诺；现行写法 |
| 主流 | Vue：composable / 模块级 reactive 持有共享状态（对应「新建组件持有 state」） | https://vuejs.org/guide/scaling-up/state-management.html | 未讲 | — | 并入 R2-25-4 |
| 主流 | Vue：先 props / slots，再 provide/inject，再 Pinia | https://vuejs.org/guide/components/provide-inject.html | 已讲对 | src/topics/25-state-ownership-and-lifting/vue/Example.vue:48 | 只一句 |
| 主流 | Vue：`ref(props.x)` 拷贝即断联；props 只作初始值 | https://vuejs.org/guide/components/props.html#one-way-data-flow | 已讲对 | src/topics/25-state-ownership-and-lifting/vue/ProductListOwnCopy.vue:5-7; src/topics/25-state-ownership-and-lifting/vue/ProductListOwnCopy.vue:16-24 | 文件头承诺 |
| 主流 | Vue：`:key` 重置子树 | https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key | 已讲对 | src/topics/25-state-ownership-and-lifting/vue/ProductListOwnCopy.vue:24 | 一句 |
| 主流 | Vue watch `flush: 'pre'` 不多渲染一轮 vs React Effect 多一轮 | https://vuejs.org/guide/essentials/watchers.html | 已讲对 | src/topics/25-state-ownership-and-lifting/vue/ProductListOwnCopy.vue:19-21 | 大纲未列；待核实 P-25-4 |
| 主流 | 组件类型切换 = 卸载重挂，state 随实例销毁 | https://react.dev/learn/preserving-and-resetting-state | 已讲对 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:414-417; src/topics/25-state-ownership-and-lifting/react/Example.tsx:134-135 | 大纲未列；指向 10 题存疑 → R2-25-8 |

#### 面试 5 问

1. 两个兄弟组件要同步一个值，怎么做？（追问：提升到父组件后父组件每次都重渲染，怎么控制——组合 / memo / 拆 owner）
2. 什么该是 state、什么不该？（追问：能从 props 算出来的为什么「definitely isn't state」；选中项存 id 还是对象？）
3. 什么时候用 props 传、什么时候用 Context、什么时候上 Zustand / Redux？（追问：官方在用 context 之前建议先试哪两招？）
4. 「受控组件」只是指 `<input value>` 吗？（追问：一个 Accordion 面板受控 / 非受控各是什么形态，何时选哪个？）
5. 把 state 提升后，切换用户 / 订单时子组件的输入框没清空，怎么办？（追问：`key` 重置和 effect 里 `setValue('')` 哪种对、为什么？）

#### 生产写法要点

- 列表 + 详情 + 筛选这类页面：筛选 / 分页 / 选中 id 放 URL（18），服务端数据放 Query（30），只有编辑草稿、弹窗开关等 UI 瞬态留本地 state。
- 提升到高层的 state 要考虑重渲染范围：把「读 state 的部分」拆成小组件、用 `children` 组合让不相关子树不随之渲染；必要时 memo（17）。
- Context value 里同时放 state 和 setter 会让只写不读的组件也重渲染 → 拆 state / dispatch 两个 context（15 / 29）。
- 跨页面共享、需要持久化 / devtools / 时间旅行 → store（16）；别为了「省 props」直接上全局。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| 提升到共同父组件 + props 下传 + callback 上传 | 同样「props down, events up」：`props` 单向绑定 + `emit`；「the child should emit an event to let the parent perform the mutation」 | https://vuejs.org/guide/components/props.html#one-way-data-flow（2026-09-16，逐字） | 思路一致；Vue 多了 `defineModel` 语法糖（主责 07） |
| 受控组件（父持有值 + onChange） | 组件 `v-model` / `defineModel()`（3.4+）：父持有值，子通过 model ref 读写 | node_modules/@vue/runtime-core/dist/runtime-core.d.ts:334-345（①）；主责 07 | Vue 把「受控」做成了编译期语法糖 |
| 「create a new component solely for holding the state」 | 提取 composable（`useXxx()`）持有共享 `ref` / `reactive`，或模块级 `reactive` store | https://vuejs.org/guide/scaling-up/state-management.html（2026-09-16，逐字「Simple State Management with Reactivity API」） | Vue 的响应式对象可以脱离组件存在，React 的 state 必须挂在组件 / store 上 |
| 用 context 之前先试 props / children 组合 | 同样先 props / slots；再 `provide` / `inject`；再 Pinia | https://vuejs.org/guide/components/provide-inject.html（2026-09-16，逐字「Prop Drilling」）；同上 state-management 页 | 层级对应：children ↔ slots，Context ↔ provide/inject，Zustand ↔ Pinia |
| 「Don't mirror props in state」 | 「define a local data property that uses the prop as its initial value」仅用于初始值；变换用 `computed` | https://vuejs.org/guide/components/props.html#one-way-data-flow（2026-09-16，逐字） | 一致 |
| 提升后用 `key` 重置子树 | `<Child :key="id">` 同理；Vue 路由复用实例的坑同样需要 `key` 或 `watch` params | https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key（2026-09-16，摘要；未逐字抓取） | 一致 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-25-1 | 概念 | 未讲 | 其它 | 状态提升三步法（移除子 state → 父先传硬编码 → 父加 state 连同处理器传下）未讲 | — | — | 文件头承诺「状态提升」，课件直接给结果没给官方步骤；面试常要求口述步骤 | grep0:硬编码\|hardcoded\|Remove state\|先传硬 | 二、核心概念 |
| R2-25-2 | 概念 | 未讲 | 其它 | 受控 / 非受控组件的组件级官方定义与取舍：受控 = driven by props（最灵活但父组件要全配置）、非受控 = 自持 local state（易用难协调）、实践中是混合体 | — | — | 课件有「完全受控的 SearchBar」与「有意做非受控」两例，但没有定义句与「何时选哪个」，面试问 4 只能答一半 | grep0:driven by\|混合\|最灵活\|难以协调 | 二、核心概念 |
| R2-25-3 | 概念 | 未讲 | 其它 | Thinking in React 步骤 3–4 与 state 结构：「随时间不变 / 父传来 / 能算出」三问；「新建组件专门持有 state」；合并一起变的 state；选中态存 id | — | — | 文件头「谁拥有 state」承诺了判断方法，课件只有「谁用」一条标准 | grep0:Thinking in React\|随时间\|三问\|存 id\|selectedId\|solely | 二、核心概念 |
| R2-25-4 | 概念 | 未讲 | 其它 | 取舍阶梯缺中间两级：官方「Start by passing props → 抽组件传 JSX 作 children → 再 context」；Context 适用场景（主题 / 当前用户 / 路由）；store 加分判据（devtools / 持久化 / 更新频繁）；提升后重渲染的控制手段（拆 owner / children 组合 / memo） | — | — | 课件从「局部」直接跳到「全局 store」，面试问 3 追问「context 之前先试哪两招」与问 1 追问「怎么控制重渲染」都答不出 | grep0:children\|组合\|slot\|devtools\|持久化 | 四、关键区别 / 五、常见追问与回答要点 |
| R2-25-5 | 概念 | 未讲 | 交叉引用 | 服务端数据不是提升问题（Query 缓存即共享 → 30）；筛选 / 分页 / 选中 id 能放 URL → 路由（18） | — | — | 本题场景（keyword / category 筛选）在真实页面恰恰应放 URL；课件说「不进 Zustand」却没说该去哪 | grep0:Query\|URL\|路由\|18 题\|30 题 | 七、生产环境注意 |
| R2-25-6 | 概念 | 未讲 | 旧写法 | 【旧写法】HOC / render props 状态共享；【较新】React 19 ref 作普通 prop 后提升命令式句柄无需 forwardRef | — | — | 八 / 九段素材缺失；主责 14 / 12，本题只需一句 | grep0:HOC\|render props\|forwardRef\|ref 作为 | 八、旧写法对照 |
| R2-25-7 | 小问题 | 措辞 | 绝对化 | 模板残留「没有一一对应关系」；「React 没有任何机制」「永远一致 / 永远同步」等绝对化 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:39; src/topics/25-state-ownership-and-lifting/vue/Example.vue:42; src/topics/25-state-ownership-and-lifting/react/Example.tsx:13; src/topics/25-state-ownership-and-lifting/react/Example.tsx:250; src/topics/25-state-ownership-and-lifting/react/Example.tsx:184; src/topics/25-state-ownership-and-lifting/react/Example.tsx:290 | 没有一一对应关系 | 「没有任何机制」应改为「没有内置机制（Effect 同步是反模式）」；其余为强调语气，统一收敛 | course-map §6 H | 二、核心概念 |
| R2-25-8 | 小问题 | 措辞 | 交叉引用 | 「换 key 重置 → 10 题」「组件类型切换的 diff 规则 → 10 题」编号存疑：course-map 中 key 强制重置主责 06、渲染模型主责 23；另缺 13（children 组合）、15（Context 场景）、18（URL）、30（Query） | src/topics/25-state-ownership-and-lifting/react/Example.tsx:268; src/topics/25-state-ownership-and-lifting/react/Example.tsx:415 | 需要重置时给组件换 key（10 题） | 10 题摘要是 useEffect 与生命周期；本题两处引用的内容与其摘要不符（待核实 P-25-1） | course-map §1 | 参考 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 两个兄弟组件要同步一个值怎么做？提升后父组件每次都重渲染怎么控制？ | 部分 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:7-8; src/topics/25-state-ownership-and-lifting/react/Example.tsx:308-316; src/topics/25-state-ownership-and-lifting/react/Example.tsx:380-398 | 控制重渲染的手段（组合 / memo / 拆 owner）未讲 |
| 2 | 什么该是 state？能算出的为什么「definitely isn't state」？选中项存 id 还是对象？ | 部分 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:322-326; src/topics/25-state-ownership-and-lifting/react/Example.tsx:57-58 | 三问与「存 id」未讲 |
| 3 | 何时 props、何时 Context、何时 Zustand / Redux？context 之前先试哪两招？ | 部分 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:19-21; src/topics/25-state-ownership-and-lifting/react/Example.tsx:373-377; src/topics/25-state-ownership-and-lifting/react/Example.tsx:44 | 阶梯缺 children 组合与 Context 场景 |
| 4 | 「受控组件」只指 `<input value>` 吗？Accordion 受控 / 非受控形态？ | 能 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:80-94; src/topics/25-state-ownership-and-lifting/react/Example.tsx:266-268 | 缺官方定义句（R2-25-2） |
| 5 | 提升后切换用户 / 订单时子组件输入框没清空怎么办？key 重置 vs effect 里 setValue('') | 部分 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:262-268 | key 只一句；未与 effect 清空方案正面对比 |

### 26. 过期闭包（stale closure）

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 承诺：根因——一次渲染内 state 不变，本帧创建的每个闭包捕获本帧的值 | https://react.dev/learn/state-as-a-snapshot#state-over-time | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:5-8; src/topics/26-stale-closures/react/Example.tsx:113-116 | 文件头承诺；快照本身指向 03 / 23（成立） |
| 主流 | 现场 1：事件处理器里的 setTimeout 读旧值（无 Effect） | https://react.dev/learn/state-as-a-snapshot | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:134-190 | — |
| 主流 | 现场 2：`[]` Effect 里的 setInterval 锁定挂载帧；`[count]` 则每变重建 | https://react.dev/reference/react/useEffect#updating-state-based-on-previous-state-from-an-effect | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:409-431; src/topics/26-stale-closures/react/Example.tsx:449-476 | 与 10 题分工写明（:34） |
| 主流 | 现场 3：手动 addEventListener / SDK 回调只注册一次 | https://react.dev/reference/react/useEffectEvent#using-an-event-listener-with-latest-values | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:248-273; src/topics/26-stale-closures/react/Example.tsx:290-312 | — |
| 主流 | 现场 4：同一 handler 里 setAge(age + 1) 三次只加 1 | https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:36 | 只作引用指向 24 题（成立） |
| 主流 | lint 视角：漏依赖 = stale closure；`exhaustive-deps` 是探测器 | https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:242-244; src/topics/26-stale-closures/react/Example.tsx:262-265 | — |
| 主流 | 修法 A 函数式更新：Effect 不再读 state，依赖随之消失；只解决「由旧算新」 | https://react.dev/learn/removing-effect-dependencies#are-you-reading-some-state-to-calculate-the-next-state | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:11-12; src/topics/26-stale-closures/react/Example.tsx:182-190 | 文件头承诺；未讲成万能药（:121） |
| 主流 | 修法 B 写对依赖并接受重跑；抑制 lint = 撒谎 | https://react.dev/learn/removing-effect-dependencies | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:276-304; src/topics/26-stale-closures/react/Example.tsx:440-469 | 取舍标准「重建外部资源的代价」讲得好（:287-288） |
| 主流 | 修法 C 交互触发的逻辑搬进事件处理器（事件处理器不是响应式的） | https://react.dev/learn/separating-events-from-effects | 未讲 | — | R2-26-3 |
| 主流 | 修法 D 拆 Effect、对象 / 函数移进 Effect、只读原始值 | https://react.dev/learn/removing-effect-dependencies#does-some-reactive-value-change-unintentionally | 未讲 | — | R2-26-3 |
| 主流 | 「可变值不能作依赖」：`ref.current` 进依赖数组不触发重跑 | https://react.dev/learn/lifecycle-of-reactive-effects#all-variables-declared-in-the-component-body-are-reactive | 未讲 | — | R2-26-4 |
| 较新 | 承诺：修法 E `useEffectEvent`（主线）：非响应式逻辑抽成 Effect Event，总读最新值不重跑 Effect | https://react.dev/reference/react/useEffectEvent；node_modules/@types/react/index.d.ts:1791 | 缺标签 | src/topics/26-stale-closures/react/Example.tsx:15-18; src/topics/26-stale-closures/react/Example.tsx:478-486; src/topics/26-stale-closures/react/Example.tsx:501-525 | R2-26-2（无【较新】标签） |
| 较新 | 限制 1：只在 Effect（或其它 Effect Event）内调用，不在渲染期 | https://react.dev/reference/react/useEffectEvent#caveats | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:489-490 | 允许的三种 Effect 未列 |
| 较新 | 限制 2：不传给其他组件 / Hook；只能在同一组件 / Hook 内声明；由 linter 校验 | https://react.dev/reference/react/useEffectEvent#caveats；https://react.dev/blog/2025/10/01/react-19-2 | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:18; src/topics/26-stale-closures/react/Example.tsx:489-490 | 「同一组件内声明」与 lint 版本未提 → R2-26-2 |
| 较新 | 限制 3：无稳定身份，每次渲染都变 | https://react.dev/reference/react/useEffectEvent#caveats | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:17-18; src/topics/26-stale-closures/react/Example.tsx:483-484 | — |
| 较新 | 限制 4：不是逃避依赖的工具，只用于真正由 Effect 触发的事件 | https://react.dev/reference/react/useEffectEvent#caveats | 未讲 | — | R2-26-2 |
| 较新 | 自定义 Hook 接收回调时 `useEffectEvent(onReceiveMessage)` 包一层 | https://react.dev/learn/reusing-logic-with-custom-hooks#passing-event-handlers-to-custom-hooks | 未讲 | — | R2-26-2（14 题主责 R2-14-4，本题一句） |
| 较新 | lint 前提：需升级 `eslint-plugin-react-hooks@latest`（≥ 6，本项目 7.1.1）否则会把它塞进依赖 | https://react.dev/blog/2025/10/01/react-19-2；node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:551 | 未讲 | — | R2-26-2 |
| 主流 | 心智模型：事件处理器响应交互，Effect 在需要同步时运行；Effect Event 打断响应链 | https://react.dev/learn/separating-events-from-effects | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:125-127; src/topics/26-stale-closures/react/Example.tsx:316-317; src/topics/26-stale-closures/react/Example.tsx:491-496 | — |
| 旧写法 | 承诺：latest ref——社区惯用法、官方无推荐语；18 项目的替代，19.2 起改 useEffectEvent | https://react.dev/learn/referencing-values-with-refs（仅支撑 ref 可变） | 缺标签 | src/topics/26-stale-closures/react/Example.tsx:13-14; src/topics/26-stale-closures/react/Example.tsx:146-155 | R2-26-1【待主线判定】 |
| 旧写法 | `eslint-disable-next-line react-hooks/exhaustive-deps` 省依赖：官方称会导致 bug | https://react.dev/blog/2025/10/01/react-19-2 | 缺标签 | src/topics/26-stale-closures/react/Example.tsx:243-244; src/topics/26-stale-closures/react/Example.tsx:262-264 | R2-26-10（有警告语，未引官方态度） |
| 旧写法 | 「更新函数总是更好吗」：多数情况无差别，不讲成万能药 | https://react.dev/reference/react/useState#is-using-an-updater-always-preferred | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:11-12; src/topics/26-stale-closures/react/Example.tsx:121 | 限定为「由旧算新」 |
| 主流 | 承诺 Vue：ref 是容器，闭包里读 `.value` 总是最新；差异来自 setup 只执行一次 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#why-refs | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:23; src/topics/26-stale-closures/react/Example.tsx:29-33; src/topics/26-stale-closures/vue/Example.vue:70-78 | 文件头承诺 |
| 主流 | Vue 官方原话「没有过期闭包需要担心」+ 承认 React 部分问题可由 Compiler 解决 | https://vuejs.org/guide/extras/composition-api-faq.html#comparison-with-react-hooks | 未讲 | — | R2-26-5 |
| 主流 | Vue 也会「过期」：解构 `reactive` / props 失去响应式连接 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive | 未讲 | — | R2-26-5（课件只给「手动拷 snapshot」） |
| 主流 | `watch(source, cb)` 只追踪显式源、回调里读其它 ref「读而不响应」↔ useEffectEvent | https://vuejs.org/guide/essentials/watchers.html | 未讲 | — | R2-26-5；:498 说「没有任何对应物」见 R2-26-6 |
| 主流 | 承诺 Vue：`count.value++` ↔ 函数式更新；onMounted 注册一次 + onUnmounted 移除 ↔ `[]` Effect + cleanup | https://vuejs.org/guide/essentials/reactivity-fundamentals.html | 已讲对 | src/topics/26-stale-closures/vue/Example.vue:106-113; src/topics/26-stale-closures/vue/Example.vue:159-169 | 文件头承诺 |
| 主流 | 大纲未列：JSX / 模板事件处理器为何不会过期（每次渲染重绑） | — | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:125-127; src/topics/26-stale-closures/react/Example.tsx:353-360; src/topics/26-stale-closures/vue/Example.vue:171-174 | 大纲未列 |
| 主流 | 大纲未列：alive 标志丢弃迟到响应 + `useTimeouts` 用 useRef 存定时器 id（cleanup 先拷 ref.current） | — | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:78-104; src/topics/26-stale-closures/react/Example.tsx:405-407 | 大纲未列；交叉引用 12 / 27 成立 |
| 主流 | 大纲未列：`recommended` 预设对本文件 0 命中（`pollOnce` 未被要求进依赖，印证 :485） | node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:551 | 已讲对 | src/topics/26-stale-closures/react/Example.tsx:485 | 大纲未列；本批实测 |

#### 面试 5 问

1. 什么是过期闭包？为什么 `setTimeout` 里读到的 state 是旧的？（追问：这是 bug 还是设计？为什么 Vue 里 `count.value` 在 setTimeout 里是新的？）
2. `useEffect(() => { setInterval(() => setCount(count + 1), 1000) }, [])` 有什么问题？说出至少三种修法。（追问：函数式更新为什么能让依赖消失？写 `[count]` 的代价是什么？）
3. `useEffectEvent` 解决什么问题？有哪些限制？（追问：为什么不能传给子组件、为什么没有稳定身份？它和 `useCallback` 各解决什么？）
4. 为什么把 `ref.current` 写进依赖数组没用？latest ref 模式怎么写？（追问：React 19.2 之后还需要它吗？什么情况下仍用 ref？）
5. `exhaustive-deps` 报警时你的处理顺序是什么？什么时候可以禁用？（追问：官方对「禁用 lint 排除依赖」的态度是什么？）

#### 生产写法要点

- 定时器 / 轮询：函数式更新 + cleanup；真实项目的轮询优先用 TanStack Query `refetchInterval`（→ 30），不要手写 setInterval 请求
- 第三方 SDK / WebSocket 回调：用 `useEffectEvent` 包住「读最新状态」的部分；仍在 React 18 的项目用 latest ref 并标注为过渡写法
- 必须 `eslint-plugin-react-hooks` ≥ 6（本项目 7.1.1）才认识 `useEffectEvent`，否则 lint 会要求把它加进依赖
- 不要把 `useEffectEvent` 的返回值当 props 传给子组件；需要稳定函数引用给 `memo` 子组件用 `useCallback`（→ 17）
- TS：`useEffectEvent<T extends Function>(callback: T): T`，返回值类型与回调一致；不要给它标 `useCallback` 式的 deps
- 测试：用 fake timers 断言定时器回调读到最新值（→ 34）

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| state 是快照，闭包锁定当次渲染的值 | `ref` 是带 getter/setter 的对象，「.value 让 Vue 有机会检测访问与修改」，闭包里读 `.value` 总是最新 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#why-refs（2026-09-16，逐字） | 差异来自执行模型：React 每次渲染重新执行函数体，Vue `setup()` 只执行一次 |
| 过期闭包是 Hooks 的固有代价 | 官方原话：「setup() 或 `<script setup>` 只调用一次……没有过期闭包需要担心」；同时承认 React 的问题「部分与记忆化相关的可由 React Compiler 解决」 | https://vuejs.org/guide/extras/composition-api-faq.html#comparison-with-react-hooks（2026-09-16，逐字） | — |
| Vue 也会「过期」 | 解构 `reactive` 对象的原始类型属性、或把属性传给函数「会失去响应式连接」 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive（2026-09-16，逐字） | 把 `count.value` 存进局部 `const` 后在 setTimeout 里读，同样是旧值 |
| `useEffectEvent`：读最新值但不作为依赖 | `watch(source, cb)`「只追踪显式监听的源，不会追踪回调内访问的任何东西」——回调里读其他 ref 天然「读而不响应」 | https://vuejs.org/guide/essentials/watchers.html（2026-09-16，逐字） | Vue 无需专门 API；`watchEffect` 则会追踪回调内所有访问 |
| 函数式更新 `setCount(c => c + 1)` | 直接 `count.value++` | https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-16，摘要） | Vue 没有「更新队列传入最新值」的需求 |
| `exhaustive-deps` lint | 无对应物 | https://vuejs.org/guide/extras/composition-api-faq.html（2026-09-16，逐字「无需手动声明依赖」） | 自动依赖收集不需要 lint |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-26-1 | 概念 | 缺标签 | 旧写法 | 【待主线判定】latest ref 被列为核心概念、与 useEffectEvent 并列的正规修法，未标「社区惯用法、react.dev 无推荐语」，未说明 19.2 起官方替代为 useEffectEvent、仍在 18 的项目才用它；区块一（事件处理器 + setTimeout）是 useEffectEvent 覆盖不到的场景，须写明这一前提而不是默认并列 | src/topics/26-stale-closures/react/Example.tsx:13-14; src/topics/26-stale-closures/react/Example.tsx:146-155; src/topics/26-stale-closures/react/Example.tsx:620 | useRef 保存最新值（latest ref） | 大纲判定 latest ref 为旧写法 / 社区惯用法；已定主线 useEffectEvent 保留，latest ref 并排但要标注适用边界 | 26-outline 待核实项（react.dev useRef / referencing-values-with-refs / useEffectEvent / separating-events-from-effects 四页均无该模式）；https://react.dev/reference/react/useEffectEvent（evidence 逐字「useEffectEvent is a React Hook that lets you separate events from Effects.」） | 二、核心概念；八、旧写法对照 |
| R2-26-2 | 概念 | 缺标签 | 散点Hook | useEffectEvent 无【较新】/「19.2 起」成熟度标签；四条限制缺「不是逃避依赖的工具」与「只能在同一组件 / Hook 内声明」；未说明 lint 需 eslint-plugin-react-hooks ≥ 6（本项目 7.1.1）否则会被塞进依赖；TS 签名与自定义 Hook 里的用法（→ 14）未提 | src/topics/26-stale-closures/react/Example.tsx:15; src/topics/26-stale-closures/react/Example.tsx:479; src/topics/26-stale-closures/react/Example.tsx:488-492 | useEffectEvent（React 19.2 内置） | 面试第 3 问「有哪些限制」只能答出 3/4 | https://react.dev/reference/react/useEffectEvent#caveats（evidence 逐字「Do not use useEffectEvent to avoid specifying dependencies in your Effect's dependency array. This hides bugs」）；https://react.dev/blog/2025/10/01/react-19-2（evidence 逐字「You'll need to upgrade to eslint-plugin-react-hooks@latest so that the linter doesn't try to insert them as dependencies」）；node_modules/@types/react/index.d.ts:1791 | 二、核心概念；七、生产环境注意 |
| R2-26-3 | 概念 | 未讲 | 其它 | 官方修法体系不全：修法 C「由交互触发的逻辑搬进事件处理器」、修法 D「拆 Effect / 对象与函数移进 Effect / 只读原始值」未讲；修法优先级（函数式更新 → 正确依赖 → useEffectEvent → latest ref）未成体系 | — | — | 面试第 2 问「至少三种修法」能答，第 5 问「处理顺序」答不上 | grep0:搬进事件\|移进 effect\|移进 Effect\|拆分 effect\|原始值\|优先级 | 二、核心概念；五、常见追问 |
| R2-26-4 | 概念 | 未讲 | 散点Hook | 「可变值不能作依赖」：把 `ref.current` 写进依赖数组不会触发重跑，这条路不通（面试第 4 问主问） | — | — | 课件 :87-88 只讲了 cleanup 里读 ref.current 的 lint 提示 | grep0:current]\|可变值不能作依赖\|写进依赖数组没用 | 五、常见追问；六、易错点 |
| R2-26-5 | 概念 | 未讲 | Vue现行写法 | Vue 侧闭包坑只给「手动拷 const snapshot」：解构 `reactive` / 3.5 前解构 props 失去响应式连接的真实形态未讲；`watch(source, cb)`「只追踪显式源」作为 useEffectEvent 的语义对照未讲；Vue 官方「没有过期闭包需要担心」+ 承认 Compiler 的原话未引 | — | — | 大纲 Vue 对照表三行全缺 | grep0:解构\|toRefs\|失去响应 | 三、Vue 对照 |
| R2-26-6 | 概念 | 措辞 | 绝对化 | 「Vue 里唯一会『过期』的东西是你手动拷出来的普通值」「Vue 侧没有任何对应物」过于绝对；「任何时刻读 .current 都是最新的」在 effect 同步前的窗口不成立；「永远」react 侧 22 处 / vue 侧 19 处，多数语境内成立但应收敛 | src/topics/26-stale-closures/react/Example.tsx:24; src/topics/26-stale-closures/react/Example.tsx:498; src/topics/26-stale-closures/react/Example.tsx:14; src/topics/26-stale-closures/vue/Example.vue:22 | 唯一会「过期」的东西 | 解构 reactive、`watch` 回调只追踪显式源都是 Vue 侧「读到旧值」的现场 | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive（大纲逐字「会失去响应式连接」）；https://vuejs.org/guide/essentials/watchers.html（大纲逐字「只追踪显式监听的源，不会追踪回调内访问的任何东西」） | 三、Vue 对照；四、关键区别 |
| R2-26-7 | 小问题 | 措辞 | 其它 | 模板残留「没有一一对应关系」6 处 | src/topics/26-stale-closures/react/Example.tsx:26; src/topics/26-stale-closures/react/Example.tsx:132; src/topics/26-stale-closures/react/Example.tsx:498; src/topics/26-stale-closures/vue/Example.vue:25; src/topics/26-stale-closures/vue/Example.vue:78; src/topics/26-stale-closures/vue/Example.vue:196 | 没有一一对应关系 | 规格 §5-H | course-map §6-H | 三、Vue 对照 |
| R2-26-8 | 小问题 | 措辞 | 交叉引用 | 引用 06 / 07 / 10 / 12 / 17 / 23 / 24 / 27 / 30 均成立；但「10 题手写的 latest ref 就是它的原理」「10 题修法三」依赖 10 题保留修法三，10 题重写时需联动 | src/topics/26-stale-closures/react/Example.tsx:17; src/topics/26-stale-closures/react/Example.tsx:149 | 10 题手写的 latest ref 就是它的原理 | 10 题 :49、:204-227 确有「修法三 latest ref」并反向指向 26 题 | src/topics/10-effects-and-lifecycle/react/Example.tsx:204-227 | 文件头 |
| R2-26-9 | 生产 | 未标简化 | 生产简化 | 轮询用手写 setInterval + fetch 未标「演示简化」，生产优先 TanStack Query `refetchInterval`（→ 30）；WebSocket / SDK 场景只在注释一句带过 | src/topics/26-stale-closures/react/Example.tsx:423; src/topics/26-stale-closures/react/Example.tsx:520 | setInterval(tick, POLL_MS) | 大纲生产要点：真实项目的轮询优先用 `refetchInterval`，不手写 setInterval 请求 | 26-outline 生产写法要点（TanStack Query 文档 URL 待核实 P-26-3） | 七、生产环境注意 |
| R2-26-10 | 小问题 | 缺标签 | 旧写法 | 两处 `eslint-disable-next-line` 是刻意错误示范，已有警告语但未标【旧写法】、未引官方「大多数用户这样做会导致 bug」 | src/topics/26-stale-closures/react/Example.tsx:264; src/topics/26-stale-closures/react/Example.tsx:430 | react-hooks/exhaustive-deps | 大纲旧写法条目 | https://react.dev/blog/2025/10/01/react-19-2（evidence 逐字「most users just disable the lint rule and exclude the dependency. But that can lead to bugs」） | 八、旧写法对照 |
| R2-26-11 | 小问题 | 缺标签 | 其它 | 无成熟度标签体系（useEffectEvent 应标【较新】、latest ref 应标【旧写法】/ 社区惯用法） | — | — | 规格标签体系；本批实测 recommended 对本文件 0 命中可写进课件作 lint 版本证据 | grep0:【主流】\|【较新】\|【尝鲜】\|【旧写法】 | 文件头 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 什么是过期闭包？为什么 `setTimeout` 里读到的 state 是旧的？（追问：这是 bug 还是设计？为什么 Vue 里 `count.value` 在 setTimeout 里是新的？） | 能 | src/topics/26-stale-closures/react/Example.tsx:5-8; src/topics/26-stale-closures/react/Example.tsx:113-132 | — |
| 2 | `useEffect(() => { setInterval(() => setCount(count + 1), 1000) }, [])` 有什么问题？说出至少三种修法。（追问：函数式更新为什么能让依赖消失？写 `[count]` 的代价是什么？） | 能 | src/topics/26-stale-closures/react/Example.tsx:11-12; src/topics/26-stale-closures/react/Example.tsx:398-431; src/topics/26-stale-closures/react/Example.tsx:440-447; src/topics/26-stale-closures/react/Example.tsx:478-486 | — |
| 3 | `useEffectEvent` 解决什么问题？有哪些限制？（追问：为什么不能传给子组件、为什么没有稳定身份？它和 `useCallback` 各解决什么？） | 部分 | src/topics/26-stale-closures/react/Example.tsx:15-18; src/topics/26-stale-closures/react/Example.tsx:478-492 | 限制 4「不是逃避依赖的工具」、同一组件声明、与 useCallback 的分工未讲 |
| 4 | 为什么把 `ref.current` 写进依赖数组没用？latest ref 模式怎么写？（追问：React 19.2 之后还需要它吗？什么情况下仍用 ref？） | 部分 | src/topics/26-stale-closures/react/Example.tsx:13-14; src/topics/26-stale-closures/react/Example.tsx:146-155 | 「ref.current 作依赖无效」未讲；「19.2 后是否还需要」未正面回答 |
| 5 | `exhaustive-deps` 报警时你的处理顺序是什么？什么时候可以禁用？（追问：官方对「禁用 lint 排除依赖」的态度是什么？） | 部分 | src/topics/26-stale-closures/react/Example.tsx:242-244; src/topics/26-stale-closures/react/Example.tsx:262-264 | 处理顺序未成体系；官方原话未引 |

### 27. 异步竞态、取消与过期响应

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 竞态定义与触发场景（文件头承诺） | https://react.dev/reference/react/useEffect#fetching-data-with-effects | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:5-7; src/topics/27-async-race-and-cancellation/react/Example.tsx:46-52; src/topics/27-async-race-and-cancellation/react/Example.tsx:170-177 | 确定性延迟 100% 复现是大纲未列的加分实现 |
| 主流 | 修法 1 `ignore` 标志（文件头承诺） | https://react.dev/learn/synchronizing-with-effects#fetching-data | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:238-310; src/topics/27-async-race-and-cancellation/vue/Example.vue:123-168 | — |
| 主流 | 修法 2 AbortController + AbortError（文件头承诺） | https://developer.mozilla.org/en-US/docs/Web/API/AbortController（③ MDN） | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:312-385; src/topics/27-async-race-and-cancellation/vue/Example.vue:170-216 | — |
| 主流 | 取消不是错误：catch 里区分 AbortError（文件头承诺） | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request（③ MDN） | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:14; src/topics/27-async-race-and-cancellation/react/Example.tsx:320-321; src/topics/27-async-race-and-cancellation/react/Example.tsx:361-365; src/shared/mockApi.ts:68-71 | axios 的 isCancel / TimeoutError 未提（R2-27-3、R2-27-10） |
| 主流 | fetch 已 resolve 但 body 未读完时 abort，`response.json()` 也 AbortError | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request（③ MDN） | 讲了但错 | src/topics/27-async-race-and-cancellation/react/Example.tsx:356 | R2-27-1 |
| 主流 | ignore vs abort 取舍；可同时用（文件头承诺） | https://react.dev/learn/synchronizing-with-effects#fetching-data | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:15-17; src/topics/27-async-race-and-cancellation/react/Example.tsx:249-251; src/topics/27-async-race-and-cancellation/react/Example.tsx:328-334 | 「abort 后仍靠 ignore 兜底」未提 |
| 主流 | 只靠 loading 布尔挡不住竞态；切换参数时重置 data | https://react.dev/reference/react/useEffect#fetching-data-with-effects | 未讲 | — | R2-27-7（forKeyword 检测仪 :65-67 更强，但没点破 loading 为何不够） |
| 主流 | StrictMode 双调是竞态探测器（文件头承诺） | https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:35-36; src/topics/27-async-race-and-cancellation/react/Example.tsx:197-198; src/topics/27-async-race-and-cancellation/react/Example.tsx:334; src/topics/27-async-race-and-cancellation/react/Example.tsx:425-429 | — |
| 主流 | TanStack 取消：queryFn 拿到 signal；默认不取消，消费 signal 才 opt-in；cancelQueries | https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation；node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:591 | 缺标签 | src/topics/27-async-race-and-cancellation/react/Example.tsx:331; src/topics/27-async-race-and-cancellation/vue/Example.vue:186 | R2-27-2 |
| 主流 | TanStack 默认不取消的理由；取消后查询回到之前状态 | 同上 | 未讲 | — | R2-27-2 |
| 主流 | 取消在 Suspense hooks 下不工作 | 同上 | 未讲 | — | R2-27-2 |
| 主流 | `AbortSignal.timeout` / `AbortSignal.any` / `throwIfAborted`；timeout 抛 TimeoutError | https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal（③ MDN） | 未讲 | — | R2-27-3 |
| 主流 | 路由 loader 的 `request.signal` 随导航中断而 abort（→ 18） | node_modules/react-router/dist/development/data-CjO11-hU.d.ts:444-446; node_modules/react-router/dist/development/chunk-BV7QT456.mjs:2068 | 未讲 | — | R2-27-4 |
| 主流 | 过期响应 vs 过期闭包（→ 26）修法不同 | https://react.dev/learn/state-as-a-snapshot | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:245-247; src/topics/27-async-race-and-cancellation/react/Example.tsx:328-330 | 两者的区别句可更直白 |
| 主流 | 事件触发的请求：handler 持有 controller / 请求序号（工程惯例）；→ 19 / 14 | 官方无专门段落（大纲待核实） | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:16-17; src/topics/27-async-race-and-cancellation/react/Example.tsx:328-330; src/topics/27-async-race-and-cancellation/vue/Example.vue:27-28 | 未指向 14 / 19（R2-27-9） |
| 主流 | 空 / 错误 / 取消态区分；取消不进 error、不清空数据 | https://tanstack.com/query/v5/docs/framework/react/guides/queries | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:104-107; src/topics/27-async-race-and-cancellation/react/Example.tsx:115-147; src/topics/27-async-race-and-cancellation/react/Example.tsx:361-365 | 错误态保留旧数据供重试（TanStack 默认）未讲，本题 error 分支丢弃 users |
| 旧写法 | 组件级 isMounted ref 只挡卸载后 setState | https://react.dev/learn/synchronizing-with-effects#fetching-data | 未讲 | — | R2-27-5 |
| 旧写法 | TanStack v4 `promise.cancel()` → v5 仅 signal | https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5（待核实） | 未讲 | — | R2-27-5；P-27-1 |
| 较新 | useTransition / useDeferredValue 处理 UI 过期，与取消互补（→ 32）；防抖与竞态的区别 | https://react.dev/reference/react/Suspense | 未讲 | — | R2-27-8 |
| 主流 | React 18 起卸载后 setState 是无声 no-op（大纲未列） | https://github.com/facebook/react/pull/22114（③） | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:181-182; src/topics/27-async-race-and-cancellation/react/Example.tsx:253-254; src/topics/27-async-race-and-cancellation/react/Example.tsx:396 | 版本落点见 P-27-3 |
| 主流 | Effect 内同步 setState → `set-state-in-effect`（recommended 为 error） | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect | 未讲 | — | R2-27-11（:200 / :207 / :208） |
| 主流 | 判别联合 idle / loading / success / error + forKeyword（文件头承诺，大纲未列 idle 档） | https://react.dev/learn/choosing-the-state-structure | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:64-74; src/topics/27-async-race-and-cancellation/vue/panelTypes.ts:8-17 | — |
| 主流 | key 重置组件实例 vs Vue 手动赋初值（文件头承诺，大纲未列） | https://react.dev/learn/preserving-and-resetting-state | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:393-399; src/topics/27-async-race-and-cancellation/react/Example.tsx:486; src/topics/27-async-race-and-cancellation/vue/Example.vue:231-251 | — |
| 主流 | Vue：回调第三参 onCleanup ↔ effect cleanup（重跑前 + 停止时）（文件头承诺） | https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup | 已讲对 | src/topics/27-async-race-and-cancellation/vue/Example.vue:21-22; src/topics/27-async-race-and-cancellation/vue/Example.vue:126-127; src/topics/27-async-race-and-cancellation/vue/Example.vue:183-184 | — |
| 主流 | Vue：`onWatcherCleanup()`（3.5+，须在同步段调用）；第三参写法【旧写法】 | https://vuejs.org/api/reactivity-core.html#onwatchercleanup；node_modules/@vue/reactivity/dist/reactivity.d.ts:753 | 未讲 | — | R2-27-6 |
| 主流 | Vue：watch 默认懒执行 vs effect 首跑（文件头承诺） | https://vuejs.org/api/reactivity-core.html#watch | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:24-26; src/topics/27-async-race-and-cancellation/vue/Example.vue:25-26; src/topics/27-async-race-and-cancellation/vue/Example.vue:94 | — |
| 主流 | Vue：同步创建的 watcher 随组件卸载停止并触发 cleanup | https://vuejs.org/guide/essentials/watchers.html#stopping-a-watcher | 已讲对 | src/topics/27-async-race-and-cancellation/vue/Example.vue:183-184 | — |
| 主流 | Vue：官方 useFetch 示例无取消，对照时要补 | https://vuejs.org/guide/reusability/composables.html#async-state-example | 未讲 | — | R2-27-6 |
| 主流 | Vue：`@tanstack/vue-query` queryFn 同样收到 signal | node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:591 | 已讲对 | src/topics/27-async-race-and-cancellation/vue/Example.vue:186 | 一句引用 → 30 |

#### 面试 5 问

1. 什么是请求竞态？怎么复现？（追问：为什么 StrictMode 能帮你更早发现？开发环境两次请求算 bug 吗？）
2. `ignore` 标志和 `AbortController` 的区别？各自适用什么场景？（追问：abort 后 catch 里怎么区分取消和真错误？`response.json()` 会被取消吗？）
3. 为什么只靠 `loading` 布尔挡不住竞态？切换 id 时要不要重置 data？（追问：过期响应和过期闭包有什么不同？）
4. TanStack Query 怎么处理取消？默认取消吗？（追问：为什么默认不取消？Suspense hooks 下呢？手动取消用什么？）
5. 事件触发的请求（搜索连续输入）怎么防过期？（追问：防抖、取消、`useDeferredValue` 各解决什么层面的问题？）

#### 生产写法要点

- 封装一个「可取消的请求」工具：接收 `signal`，把 `AbortError` 转成「已取消」而非错误；结合 `AbortSignal.timeout()` 做超时、`AbortSignal.any()` 合并「导航取消 + 超时」
- 真实项目把取消交给 TanStack Query（queryFn 透传 `signal`）或路由 loader（透传 `request.signal`）；Effect 手写只在无框架小场景
- 取消态不写进 error、不清空已展示数据；错误态保留旧数据 + 重试按钮
- 事件触发的请求：handler 里持有上一个 controller 并 abort；搜索输入先防抖再请求（→ 14）
- 演示用的 mockApi 若不支持 `signal`，必须标「演示简化」并说明生产用 fetch/axios 时如何传 signal
- 测试：用可控 promise 模拟乱序返回，断言最终 UI 对应最后一次请求（→ 34）

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| Effect cleanup 里 `controller.abort()` | `onWatcherCleanup(() => controller.abort())`（3.5+）——官方示例正是 `fetch(url, { signal })` + abort | https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup（2026-09-16，逐字）；node_modules/@vue/reactivity/dist/reactivity.d.ts:753 | 语义一致：watcher 将要重跑或停止时调用 |
| cleanup 必须由 Effect 同步返回 | 「`onWatcherCleanup` 必须在 watchEffect / watch 回调的同步执行期间调用，不能在 await 之后」 | https://vuejs.org/api/reactivity-core.html#onwatchercleanup（2026-09-16，逐字） | 两边都要求「注册清理」发生在同步段 |
| 【旧写法】—— | 3.5 前：watch 回调第三参 `onCleanup` / `watchEffect(onCleanup => ...)` | https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup（2026-09-16，逐字） | 3.5 起可用 `onWatcherCleanup` |
| `ignore` 标志 | 无内置对应；可在 watcher 回调里用同样的局部变量 + `onWatcherCleanup` 置位 | https://vuejs.org/guide/essentials/watchers.html（2026-09-16，摘要） | 模式相同，与框架无关 |
| TanStack `signal` | `@tanstack/vue-query` 共用 query-core，queryFn 同样收到 `signal` | node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:591 | 同一核心 |
| 卸载时取消 | 同步创建的 watcher 随组件卸载自动停止并触发 cleanup；「异步创建的 watcher 不会自动停止」 | https://vuejs.org/guide/essentials/watchers.html#stopping-a-watcher（2026-09-16，逐字） | React 侧 Effect 总随组件卸载清理 |
| 官方 useFetch 示例无取消 | Vue composables 页的 `useFetch` 示例只重置 data/error、未 abort | https://vuejs.org/guide/reusability/composables.html#async-state-example（2026-09-16，摘要） | 课件对照时要补 `onWatcherCleanup` |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-27-1 | 概念 | 讲错 | 其它 | 「被 abort 的 promise 不会 resolve」对真实 fetch 不完整：响应头已到、body 未读完时 abort，fetch 已 resolve，`response.json()` 才以 AbortError reject | src/topics/27-async-race-and-cancellation/react/Example.tsx:356 | 被 abort 的 promise 不会 resolve | mock 一步返回数据，真实 fetch 分两段；`.json()` 必须在同一条 catch 链里，否则取消会漏成未处理 rejection | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request（③ MDN，逐字，见大纲） | 六、易错点 |
| R2-27-2 | 概念 | 缺标签 | 其它 | TanStack 取消的前提未讲：默认不取消（卸载 / 不再使用的查询照跑完）、queryFn 消费 signal 才 opt-in、`queryClient.cancelQueries` 手动取消、Suspense hooks 下取消不工作 | src/topics/27-async-race-and-cancellation/react/Example.tsx:331 | 把这一整套自动化了 | 「自动化」成立的前提是 queryFn 透传 signal；面试第 4 问全部追问答不上 | https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation（逐字，见大纲）；node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:591 | 二、核心概念 |
| R2-27-3 | 概念 | 未讲 | 其它 | `AbortSignal.timeout(ms)`（超时，抛 TimeoutError 而非 AbortError）、`AbortSignal.any([...])` 合并信号、`signal.throwIfAborted()` | — | — | 生产封装「可取消请求」必备；mockApi 的 isAbortError 只认 name === 'AbortError'，超时会被当成失败（MDN 逐字 "The signal aborts with a TimeoutError DOMException on timeout."） | grep0:AbortSignal[.]timeout\|AbortSignal[.]any\|TimeoutError\|throwIfAborted | 七、生产环境注意 |
| R2-27-4 | 概念 | 未讲 | Router | 路由 loader 的取消：loader 收到 `request: Request`，导航中断时路由器 abort 其 signal，透传 `request.signal` 即可 | — | — | 主线数据获取候选之一（→ 11 / 18）；课件只提 TanStack 一种「自动化」 | grep0:request[.]signal\|loader | 四、关键区别 |
| R2-27-5 | 概念 | 未讲 | 旧写法 | 组件级 isMounted ref 存量写法（只挡卸载后 setState、挡不住依赖切换的旧响应）；TanStack v4 `promise.cancel` → v5 仅 signal | — | — | 存量代码最常见的「半修」；:181 已讲 18 起无警告，更说明 isMounted 无必要 | grep0:isMounted\|promise[.]cancel | 八、旧写法对照 |
| R2-27-6 | 概念 | 未讲 | Vue现行写法 | Vue 3.5 `onWatcherCleanup`（须在同步段调用，不能在 await 后）未讲，只用回调第三参 onCleanup；官方 useFetch 示例无取消需补 | — | — | 基线 vue 3.5.42；大纲把第三参写法标【旧写法】；Vue 侧 watch 回调若改成 async，onCleanup 必须在首个 await 前注册 | grep0:onWatcherCleanup | 三、Vue 对照 |
| R2-27-7 | 概念 | 未讲 | 其它 | 「只靠 loading 布尔挡不住竞态」与「切换参数时重置 data（官方 setBio(null)）」未点破 | — | — | 面试第 3 问第一句答不上；loading 描述「有没有请求在飞」，不描述「哪次响应有效」；forKeyword 检测仪更强但没解释 | grep0:只靠 loading\|loading 布尔 | 五、常见追问与回答要点 |
| R2-27-8 | 概念 | 未讲 | 并发 | 三层未区分：防抖减少发出的请求数（→ 14）、取消 / 忽略处理已发出的响应、useDeferredValue / useTransition 处理渲染层的过期 UI（→ 32） | — | — | 面试第 5 问追问；10 题已把防抖指向 14，本题只字未提 | grep0:防抖\|去抖\|debounce\|useDeferredValue\|useTransition | 五、常见追问与回答要点 |
| R2-27-9 | 小问题 | 措辞 | 交叉引用 | 交叉引用缺 14（防抖）、19（提交防重复）、32（useDeferredValue）、18（loader signal）；模板残留「没有一一对应关系」6 处；「永远不会 / 永远等不到」应限定「只要 cleanup 写对」 | src/topics/27-async-race-and-cancellation/react/Example.tsx:36; src/topics/27-async-race-and-cancellation/react/Example.tsx:107; src/topics/27-async-race-and-cancellation/react/Example.tsx:397; src/topics/27-async-race-and-cancellation/vue/Example.vue:37; src/topics/27-async-race-and-cancellation/vue/Example.vue:236 | Vue 没有对应机制（没有一一对应关系） | :36 一句里「没有对应机制」与「没有一一对应关系」重复；现有 06 / 07 / 08 / 10 / 11 / 12 / 24 / 25 / 26 / 30 编号逐条核对无误 | https://react.dev/reference/react/useDeferredValue（2026-09-17） | 参考 |
| R2-27-10 | 生产 | 未标简化 | 生产简化 | 真实 fetch / axios 的取消写法未示范：`fetch(url, { signal })` + `response.ok`、axios 的 `signal` 与 `axios.isCancel`；mockApi 的 isAbortError 依赖 DOMException 未标「演示简化」 | src/topics/27-async-race-and-cancellation/react/Example.tsx:354 | fetchUsers(keyword, { signal: | 全题没有一行真实 fetch；:316 只在注释里提到 fetch 行为 | https://developer.mozilla.org/en-US/docs/Web/API/AbortController（③ MDN，逐字，见大纲） | 七、生产环境注意 |
| R2-27-11 | 生产 | 未标简化 | 其它 | Effect 内同步 setState（:200 idle、:207 loading、:208 经 log() 的 setLines）会命中 react-hooks 7 `recommended` 的 `set-state-in-effect`（error），课件未提 | src/topics/27-async-race-and-cancellation/react/Example.tsx:200; src/topics/27-async-race-and-cancellation/react/Example.tsx:207 | setState({ status: 'idle' }) | 当前 eslint.config.js:35-38 未启用 recommended；切换后三个面板各 3 处报错；包装函数 log() 是否命中见 P-27-4 | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（逐字 "Validates against calling setState synchronously in an effect, which can lead to re-renders that degrade performance."） | 六、易错点 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 什么是请求竞态？怎么复现？（追问：为什么 StrictMode 能帮你更早发现？开发环境两次请求算 bug 吗？） | 能 | src/topics/27-async-race-and-cancellation/react/Example.tsx:5-7; src/topics/27-async-race-and-cancellation/react/Example.tsx:46-52; src/topics/27-async-race-and-cancellation/react/Example.tsx:170-177; src/topics/27-async-race-and-cancellation/react/Example.tsx:197-198; src/topics/27-async-race-and-cancellation/react/Example.tsx:334 | — |
| 2 | `ignore` 标志和 `AbortController` 的区别？各自适用什么场景？（追问：abort 后 catch 里怎么区分取消和真错误？`response.json()` 会被取消吗？） | 部分 | src/topics/27-async-race-and-cancellation/react/Example.tsx:15-17; src/topics/27-async-race-and-cancellation/react/Example.tsx:249-251; src/topics/27-async-race-and-cancellation/react/Example.tsx:320-323; src/topics/27-async-race-and-cancellation/react/Example.tsx:361-365 | body 读取阶段也会 AbortError 未讲，:356 反而说 abort 后 promise 不会 resolve |
| 3 | 为什么只靠 `loading` 布尔挡不住竞态？切换 id 时要不要重置 data？（追问：过期响应和过期闭包有什么不同？） | 部分 | src/topics/27-async-race-and-cancellation/react/Example.tsx:8-9; src/topics/27-async-race-and-cancellation/react/Example.tsx:65-67; src/topics/27-async-race-and-cancellation/react/Example.tsx:245-247; src/topics/27-async-race-and-cancellation/react/Example.tsx:328-330 | loading 布尔为何不够、官方 setBio(null) 重置未点破 |
| 4 | TanStack Query 怎么处理取消？默认取消吗？（追问：为什么默认不取消？Suspense hooks 下呢？手动取消用什么？） | 不能 | src/topics/27-async-race-and-cancellation/react/Example.tsx:331 | 只有「queryFn({ signal }) 把这一整套自动化了」一句，默认不取消 / cancelQueries / Suspense 限制全无 |
| 5 | 事件触发的请求（搜索连续输入）怎么防过期？（追问：防抖、取消、`useDeferredValue` 各解决什么层面的问题？） | 部分 | src/topics/27-async-race-and-cancellation/react/Example.tsx:328-330; src/topics/27-async-race-and-cancellation/vue/Example.vue:27-28 | 防抖与 useDeferredValue / useTransition 的分层未讲 |

### 28. React + TypeScript 基础

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 工程前提：`@types/react(-dom)`、tsconfig `lib` 含 DOM、`jsx: react-jsx`、文件用 `.tsx`；`.tsx` 禁尖括号断言改 `as` | https://react.dev/learn/typescript；https://www.typescriptlang.org/docs/handbook/jsx.html | 未讲 | — | R2-28-11（:49-50 只提 verbatimModuleSyntax 与新 JSX 转换；tsconfig.json:4,8,9 实配 lib / jsx / strict、:15 verbatimModuleSyntax 与课件一致） |
| 主流 | Props 类型：interface / type、可选 `?`、字符串字面量联合、参数默认值代替 defaultProps | https://react.dev/learn/typescript；node_modules/@types/react/index.d.ts:1060-1075 | 已讲对 | src/topics/28-react-typescript-basics/react/Example.tsx:249-256; :263; :371-378 | — |
| 主流 | useState：从初始值推断；`useState<T>` 显式收窄；无参重载得 `S \| undefined` | https://react.dev/learn/typescript；node_modules/@types/react/index.d.ts:1689,1697 | 已讲对 | src/topics/28-react-typescript-basics/react/Example.tsx:12-14; :264-272; :413-421; :422-432 | 无参重载未提（一句即可） |
| 主流 | useReducer：State + 判别联合 Action；19 起不传泛型，必要时 `useReducer<State, [Action]>` | https://react.dev/blog/2024/04/25/react-19-upgrade-guide#better-usereducer-typings；node_modules/@types/react/index.d.ts:1652,1654,1708,1722 | 未讲 | — | R2-28-7（深入 → 29） |
| 主流 | `createContext<T \| null>(null)` + 自定义 Hook 抛错；useMemo / useCallback 从返回值推断；Handler 别名 `ChangeEventHandler<T>`；`style: CSSProperties` | https://react.dev/learn/typescript；node_modules/@types/react/index.d.ts:716,1682,1813,1821,2231,2245,2486 | 未讲 | — | R2-28-11 |
| 主流 | DOM 事件：`ChangeEvent<T>` / `MouseEvent<T>` / `KeyboardEvent<T>`；`currentTarget` 带元素类型，`target` 只有 ChangeEvent（与 SubmitEvent）精确 | https://react.dev/learn/typescript；node_modules/@types/react/index.d.ts:2054,2107,2155 | 讲了但错 | src/topics/28-react-typescript-basics/react/Example.tsx:16; src/topics/28-react-typescript-basics/vue/Example.vue:16 | R2-28-6（:275-283、:284-290、:450-460 本身正确） |
| 主流 | 提交事件：`onSubmit` 类型是 `SubmitEventHandler<T>` → `SubmitEvent<T>`（target 精确到 HTMLFormElement）；`FormEvent` 已标 `@deprecated` | node_modules/@types/react/index.d.ts:2086-2091,2177-2181,2314 | 缺标签 | src/topics/28-react-typescript-basics/react/Example.tsx:15; :293-296 | R2-28-5（大纲第 8 行与 react.dev 仍写 FormEvent，见 pending） |
| 主流 | children：`ReactNode` = 一切可渲染之物的联合 | https://react.dev/learn/typescript#children；node_modules/@types/react/index.d.ts:436-450 | 已讲对 | src/topics/28-react-typescript-basics/react/Example.tsx:18; :244-255; :354-355; :369-376 | — |
| 主流 | `ReactElement` 只接受元素、`PropsWithChildren<P>`、`JSX.Element = ReactElement<any, any>`、函数组件返回 `ReactNode \| Promise<ReactNode>` | node_modules/@types/react/index.d.ts:325,1423,4154,1061 | 未讲 | — | R2-28-8 |
| 主流 | 继承原生属性：`ComponentProps<'button'>`（含 ref）/ `ComponentPropsWithoutRef` / `ComponentPropsWithRef` + `...rest` 透传 + `Omit` 覆写 | node_modules/@types/react/index.d.ts:1452,1480,1530 | 未讲 | — | R2-28-3（:44 把它划给 02；02:118-119 只有一句「小知识」） |
| 主流 | ref-as-prop 类型（19）：`ref?: Ref<HTMLInputElement>`，不再需要 forwardRef | node_modules/@types/react/index.d.ts:194,1403；https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-28-3 |
| 主流 | `useRef` 必须传参、统一 `RefObject<T>`、`MutableRefObject` 弃用；ref 回调只能返回清理函数 | https://react.dev/blog/2024/04/25/react-19-upgrade-guide#useref-requires-an-argument；node_modules/@types/react/index.d.ts:154,176-185,1670,1737-1761 | 未讲 | — | R2-28-1 |
| 主流 | 全局 `JSX` 移除 → `React.JSX`（模块增强写法）；`ReactElement['props']` 默认 unknown；`types-react-codemod preset-19` | https://react.dev/blog/2024/04/25/react-19-upgrade-guide#typescript-changes；node_modules/@types/react/index.d.ts:325-332,4141 | 未讲 | — | R2-28-2 |
| 主流 | 泛型组件 `function List<T>(props: Props<T>)`；`.tsx` 箭头函数需 `<T,>` | https://www.typescriptlang.org/docs/handbook/jsx.html | 未讲 | — | R2-28-4（:260 只说 FC 写不出泛型组件） |
| 主流 | `as const`（TS 3.4）/ `satisfies`（TS 4.9）；判别联合 → 29 | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html | 已讲对 | src/topics/28-react-typescript-basics/react/Example.tsx:73-82; :136-147; src/topics/28-react-typescript-basics/vue/types.ts:16-21 | satisfies 未标 TS 4.9 起（R2-28-12） |
| 主流 | 官方判别联合示例：`FormStatus`、`Dispatch<SetStateAction<S>>` | node_modules/@types/react-dom/index.d.ts:27-43；node_modules/@types/react/index.d.ts:1639,1645 | 未讲 | — | 加分点，→ 31 / 03；:247 仅提 `Dispatch<SetStateAction>` 名字；不单列 |
| 主流 | 类型检查工具：Vite 只转译不检查；`tsc --noEmit` / `vue-tsc --noEmit`（本仓库 typecheck 脚本一次覆盖 .tsx 与 .vue） | https://vuejs.org/guide/typescript/overview.html；package.json scripts | 未讲 | — | R2-28-11 |
| 较新 | @types/react 19.3 才含 `ViewTransition` / `addTransitionType` 稳定类型；已装 19.2.18 只有 canary.d.ts | facts-versions A；node_modules/@types/react/canary.d.ts:109,114 | 未讲 | — | 九段一句；不单列 |
| 旧写法 | `React.FC<Props>`：@types/react 18 起无隐式 children；今天只是 `FunctionComponent` 别名 | node_modules/@types/react/index.d.ts:1030,1060-1061 | 已讲对 | src/topics/28-react-typescript-basics/react/Example.tsx:259-260; :369 | 「至今也写不出泛型组件」措辞（R2-28-12） |
| 旧写法 | `useRef<T>()` 无参、`MutableRefObject`、`useReducer<React.Reducer<S,A>>`、全局 `JSX.Element`、`ElementRef` → `ComponentRef`、`PropsWithRef`；`propTypes` / 函数组件 `defaultProps` / `forwardRef<T, P>` | node_modules/@types/react/index.d.ts:215-227,1063-1066,1403,1421,1549,1670；facts-versions A | 未讲 | — | R2-28-1 / -2 / -7 的八段；propTypes / defaultProps / forwardRef 02:12,118-119 已讲，本题八段一句引用即可 |
| 主流 | Vue `defineProps<T>()` 类型声明（3.3+ 可引用导入类型） | https://vuejs.org/guide/typescript/composition-api.html；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:195 | 已讲对 | src/topics/28-react-typescript-basics/vue/OrderCard.vue:15-22; src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:28-31 | — |
| 主流 | Vue 默认值：3.5 响应式 props 解构 `const { x = 默认 } = defineProps<T>()`（引用类型无需工厂）；`withDefaults` 为 3.4 及以下写法 | https://vuejs.org/api/sfc-script-setup.html（逐字 "This is not necessary when using default values with destructure."）；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:380 | 缺标签 | src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:33-36; :7; src/topics/28-react-typescript-basics/react/Example.tsx:24 | R2-28-10 |
| 主流 | Vue `defineEmits<{ change: [id: number] }>()` 具名元组（3.3+） | https://vuejs.org/guide/typescript/composition-api.html；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:228 | 已讲对 | src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:38-43; src/topics/28-react-typescript-basics/vue/OrderCard.vue:24-27 | 未标 3.3 起（小） |
| 主流 | Vue `ref<T>()`：推断 / 显式联合 / `ref<T>()` 无参得 `T \| undefined`；`computed<T>` | https://vuejs.org/guide/typescript/composition-api.html；node_modules/@vue/reactivity/dist/reactivity.d.ts:412,441-442 | 已讲对 | src/topics/28-react-typescript-basics/vue/Example.vue:177-190; src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:49-54 | 无参 `ref<T>()` 未提 |
| 主流 | Vue 事件：`(event: Event)` + `(event.target as HTMLInputElement).value` / `instanceof` 收窄 | https://vuejs.org/guide/typescript/composition-api.html | 已讲对 | src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:56-63; :65-73; src/topics/28-react-typescript-basics/vue/Example.vue:213-216; :218-228 | — |
| 主流 | Vue 模板引用：3.5 `useTemplateRef<HTMLInputElement>('el')`；旧 `ref<HTMLInputElement \| null>(null)`；组件 ref 用 `InstanceType<typeof Foo>` | https://vuejs.org/guide/typescript/composition-api.html；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:1563 | 未讲 | — | R2-28-1（Vue 对照） |
| 主流 | Vue 泛型组件 `<script setup lang="ts" generic="T">` | https://vuejs.org/api/sfc-script-setup.html（逐字 "The value of `generic` works exactly the same as the parameter list between `<...>` in TypeScript."） | 未讲 | — | R2-28-4 |
| 主流 | Vue `defineSlots<T>()` / `defineModel<T>()` / `InjectionKey<T>` | https://vuejs.org/api/sfc-script-setup.html；https://vuejs.org/guide/typescript/composition-api.html | 已讲对 | src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:45-47 | defineSlots 已讲；defineModel 仅 :40 提名（→ 07）；InjectionKey 未提（→ 15） |
| 主流 | 大纲未列：类型守卫 `value is T`、`unknown` + `in` 收窄（TS 4.9）、`catch (err: unknown)`、`Record<K, V>`、`(typeof X)[number]` | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html | 已讲对 | src/topics/28-react-typescript-basics/react/Example.tsx:90-99; :159-171; :482-495; :496-506; src/topics/28-react-typescript-basics/vue/types.ts:26-32 | 大纲未列；讲得好，保留 |
| 主流 | 大纲未列：`<script setup>` 是否可 `export type` | node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js:25737 | 讲了但错 | src/topics/28-react-typescript-basics/react/Example.tsx:33; src/topics/28-react-typescript-basics/vue/Example.vue:34; src/topics/28-react-typescript-basics/vue/types.ts:4 | R2-28-9 |

#### 面试 5 问

1. `React.ReactNode`、`React.ReactElement`、`JSX.Element` 有什么区别，`children` 该用哪个？（追问：为什么 `ReactElement['props']` 在 19 里变成 `unknown`；`PropsWithChildren` 是什么）
2. React 19 的 TypeScript 类型有哪些破坏性变化？（追问：`useRef()` 为什么必须传参、`MutableRefObject` 去哪了；`React.JSX` 替代全局 `JSX` 时模块增强怎么写；有没有 codemod）
3. 怎么让自定义 `Button` 继承原生 `<button>` 全部属性并透传？（追问：`ComponentProps` vs `ComponentPropsWithoutRef` 何时选哪个；19 里 `ref` 作为普通 prop 的类型怎么写、还需要 `forwardRef` 吗）
4. 事件处理函数怎么标类型？（追问：`target` 与 `currentTarget` 类型差别；抽离出去的 handler 用 `ChangeEvent<HTMLInputElement>` 还是 `ChangeEventHandler`；对照 Vue 里 `event.target as HTMLInputElement`）
5. 泛型组件怎么写、`useReducer` 的类型怎么标？（追问：`.tsx` 里箭头函数泛型 `<T,>`；19 起为何官方建议不给 `useReducer` 传泛型；Vue 的 `generic` 属性与 `defineProps<T>` 对照）

#### 生产写法要点

- tsconfig 开 `strict`（考虑 `noUncheckedIndexedAccess`），`jsx: react-jsx`；`@types/react` 与 `react` 大版本对齐，升级用 `types-react-codemod preset-19`。
- 事件与 DOM 一律用 `currentTarget` 取有类型的元素，禁止 `event: any`；ref 回调用块体避免隐式返回。
- Context 用 `T | null` 默认值 + 自定义 Hook 抛错；派生联合状态用 `status` 判别联合而非多个 boolean（→ 22 / 29）。
- 库组件：`ComponentPropsWithoutRef<'button'> & { ref?: Ref<HTMLButtonElement> }`（19）或保留 `forwardRef`（同时兼容 18 的存量），`Omit` 掉被覆写的原生 prop。
- API 响应类型不可信：接口边界做运行时校验（zod 等）再赋给 TS 类型；`as` 断言只在 narrowing 后使用（→ 35 / 22）。
- 演示里的 `any` / 非空断言 `!` 必须标「演示简化」；生产代码用类型守卫或 `satisfies`。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `interface Props { title: string; count?: number }` + 参数默认值 | `defineProps<{ title: string; count?: number }>()` + 3.5 解构默认值 / `withDefaults` | https://vuejs.org/api/sfc-script-setup.html（2026-09-17） | Vue 由编译器把类型转成运行时校验，故只支持 AST 可分析的类型；React 纯类型层 |
| `onChange?: (id: number) => void` 回调 prop | `defineEmits<{ change: [id: number] }>()` | https://vuejs.org/guide/typescript/composition-api.html（2026-09-17） | React 无 emit 概念，事件即函数 prop |
| `useState<Status>('idle')` | `ref<Status>('idle')` / `Ref<Status>` | 同上 | Vue `ref<number>()` 无参得 `Ref<number \| undefined>`，与 React 无参重载同构 |
| `React.ChangeEvent<HTMLInputElement>` → `e.currentTarget.value` | `(event: Event)` → `(event.target as HTMLInputElement).value` | 同上 | Vue 模板事件是原生 `Event`，无泛型包装 |
| `useRef<HTMLInputElement>(null)` / `ref` prop | `useTemplateRef<HTMLInputElement>('el')`（3.5）；旧 `ref<HTMLInputElement \| null>(null)` | 同上 | 两边都是 `T \| null`；Vue 3.5 可按模板自动推断 |
| `createContext<T \| null>(null)` | `Symbol() as InjectionKey<T>` + `inject(key)` | 同上 | `inject` 返回 `T \| undefined`，同样需要处理缺省 |
| `function List<T>(props: Props<T>)` | `<script setup lang="ts" generic="T">` | https://vuejs.org/api/sfc-script-setup.html（2026-09-17） | Vue 需模板层 `@vue-generic` 显式指定不可推断的类型 |
| `children: React.ReactNode` / render prop | `defineSlots<{ default(props: {...}): any }>()` | 同上 | Vue 插槽只能在类型层做 IDE 提示，返回类型被忽略 |
| `tsc --noEmit` | `vue-tsc --noEmit` | https://vuejs.org/guide/typescript/overview.html（2026-09-17） | `.vue` 需要 language-tools 才能被检查 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-28-1 | 严重 | 未讲 | TS19 | `useRef` 必须传参、统一 `RefObject<T>`、`MutableRefObject` 弃用【旧写法】、ref 回调只能返回清理函数；Vue 对照 `useTemplateRef<T>` | — | — | course-map §2 把「React 19 类型变化」主责给 28，课件全文没有 useRef / RefObject 一个字；三个重载都要求 initialValue，18 的 `useRef<T>()` 在 19 类型下报错；Vue 侧 3.5 `useTemplateRef` 同样缺 | grep0:useRef\|MutableRefObject\|RefObject\|RefCallback；node_modules/@types/react/index.d.ts:154,176-185,1670,1737,1749,1761；https://react.dev/blog/2024/04/25/react-19-upgrade-guide#useref-requires-an-argument（逐字） | 二、核心概念 + 八、旧写法对照 |
| R2-28-2 | 严重 | 未讲 | TS19 | 全局 `JSX` 命名空间移除 → `React.JSX`（增强要包 `declare module "react"`）；`ReactElement['props']` 默认 unknown；`types-react-codemod preset-19` | — | — | 同为 19 类型破坏性变化、面试第 2 问核心；课件既没讲也没在八段给存量代码对照 | grep0:React\.JSX\|JSX\.Element\|ReactElement\|codemod；node_modules/@types/react/index.d.ts:325-332,4141；https://react.dev/blog/2024/04/25/react-19-upgrade-guide#typescript-changes（逐字） | 二、核心概念 + 八、旧写法对照 |
| R2-28-3 | 严重 | 未讲 | TS19 | ref-as-prop 类型 `ref?: Ref<HTMLInputElement>`（19 起不需 forwardRef）+ `ComponentProps` / `ComponentPropsWithoutRef` / `ComponentPropsWithRef` 三者取舍与 `Omit` 覆写 | — | — | 文件头 :44 把 ComponentPropsWithoutRef 划给 02，但 course-map §2 「ComponentProps 与 ref-as-prop」主责是 28、02 只作引用；02:118-119 只有一句「小知识」，`Ref<T>` 联合与三者差异无人讲 | grep0:ComponentPropsWithRef\|ComponentProps<\|forwardRef\|React\.Ref\|ref?:；node_modules/@types/react/index.d.ts:194,1403,1452,1480,1530；https://react.dev/blog/2024/12/05/react-19（"In future versions we will deprecate and remove forwardRef."） | 二、核心概念 |
| R2-28-4 | 严重 | 未讲 | 其它 | 泛型组件：`function List<T>({ items, renderItem }: ListProps<T>)`、`.tsx` 箭头函数 `<T,>` 消歧；Vue `generic="T"` | — | — | course-map §2 主责行明列「泛型组件」；课件 :260 只说 FC 写不出泛型组件，从未展示怎么写；面试第 5 问答不上 | grep0:generic=\|<T,>\|<T extends\|function [A-Za-z]*<T；https://www.typescriptlang.org/docs/handbook/jsx.html；https://vuejs.org/api/sfc-script-setup.html（逐字 generic 段） | 二、核心概念 + 三、Vue 对照 |
| R2-28-5 | 概念 | 缺标签 | TS19 | `FormEvent<HTMLFormElement>` 在 @types/react 19.2.18 已标 `@deprecated`，`onSubmit` 实际类型是 `SubmitEvent<T>`（target 精确到 HTMLFormElement） | src/topics/28-react-typescript-basics/react/Example.tsx:296; :15 | FormEvent<HTMLFormElement> | 类型文件原文 "@deprecated FormEvent doesn't actually exist. You probably meant to use ChangeEvent, InputEvent, SubmitEvent, or just SyntheticEvent"；课件把它当主线事件类型之一，07:126、19:45 同款；应改讲 `SubmitEvent<HTMLFormElement>`、FormEvent 标【旧写法】并注明 react.dev 教程滞后 | node_modules/@types/react/index.d.ts:2086-2091,2177-2181,2314 | 二、核心概念 + 八、旧写法对照 |
| R2-28-6 | 概念 | 讲错 | 其它 | 「泛型参数决定了 e.target / e.currentTarget 的类型」只对 ChangeEvent（与 SubmitEvent）成立；MouseEvent / KeyboardEvent 等的 `target` 仍是裸 `EventTarget` | src/topics/28-react-typescript-basics/react/Example.tsx:16; src/topics/28-react-typescript-basics/vue/Example.vue:16 | 决定了 e.target | `SyntheticEvent<T>` = `BaseSyntheticEvent<E, EventTarget & T, EventTarget>`，第三参（target）固定 EventTarget；只有 ChangeEvent 覆写 `target: EventTarget & CurrentTarget`（注释称 React 20 前保留）；:452 用 currentTarget 是对的，但 :16 的总述会让学习者在 onClick 里写 `e.target.textContent` 后不理解报错 | node_modules/@types/react/index.d.ts:2054,2107,2155,2198 | 二、核心概念 + 六、易错点 |
| R2-28-7 | 概念 | 未讲 | TS19 | `useReducer` 19 起类型推断改进：不传泛型或 `useReducer<State, [Action]>`；`useReducer<React.Reducer<S, A>>`【旧写法】不再可用 | — | — | 批次头 TS19 全组条目；29 主责 useReducer 但 19 的类型变化属本题，至少一句 + 指向 29 | grep0:useReducer\|Reducer<；node_modules/@types/react/index.d.ts:1652,1654,1708,1722；https://react.dev/blog/2024/04/25/react-19-upgrade-guide#better-usereducer-typings（逐字） | 二、核心概念 + 八、旧写法对照 |
| R2-28-8 | 概念 | 未讲 | 其它 | `ReactNode` vs `ReactElement` vs `JSX.Element` 三者关系、`PropsWithChildren<P>`、函数组件返回类型 `ReactNode \| Promise<ReactNode>` | — | — | 面试第 1 问原题；课件只讲 ReactNode（:18、:255），没有对照 ReactElement（只接受元素）与 `JSX.Element = ReactElement<any, any>` | grep0:PropsWithChildren\|ReactElement\|JSX\.Element；node_modules/@types/react/index.d.ts:325,436-450,1061,1423,4154；https://react.dev/learn/typescript#children | 二、核心概念 + 五、常见追问 |
| R2-28-9 | 概念 | 讲错 | Vue现行写法 | 「`<script setup>` 不能 export 类型」不成立：编译器只拒绝非类型导出，`export type` / `export interface` 允许 | src/topics/28-react-typescript-basics/react/Example.tsx:33; src/topics/28-react-typescript-basics/vue/Example.vue:34; src/topics/28-react-typescript-basics/vue/types.ts:4 | <script setup> 不能 export 类型 | compiler-sfc 3.5.42 的判断是 `node.type === "ExportNamedDeclaration" && node.exportKind !== "type"` 才报 "cannot contain ES module exports"；types.ts 存在的真正理由是常量与守卫函数（运行时值）要跨三个组件共享 | node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js:25737-25739 | 三、Vue 对照 + 六、易错点 |
| R2-28-10 | 概念 | 缺标签 | Vue现行写法 | `withDefaults` 被写成默认值主线；3.5 基线应以响应式 props 解构默认值为主线，withDefaults 标 3.4 及以下写法；「对象 / 数组默认值必须写成工厂函数」只对 withDefaults 成立 | src/topics/28-react-typescript-basics/react/Example.tsx:24; src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:33-36; src/topics/28-react-typescript-basics/react/Example.tsx:618; src/topics/28-react-typescript-basics/vue/Example.vue:400 | 可选 prop 的默认值走 withDefaults | 官方逐字："This is **not** necessary when using default values with destructure."；OrderFilterForm.vue:35 已知道 3.5 写法却「保留 withDefaults」，速查表把解构写成括号里的备选 | https://vuejs.org/api/sfc-script-setup.html（逐字）；https://vuejs.org/guide/components/props.html（逐字 "In version 3.4 and below, `foo` is an actual constant"）；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:380 | 三、Vue 对照 + 八、旧写法对照 |
| R2-28-11 | 概念 | 未讲 | 其它 | 工具箱补缺：tsconfig 前提（`jsx: react-jsx`、`lib` 含 DOM、`strict`）、`.tsx` 禁尖括号断言、Vite 只转译 → `tsc` / `vue-tsc --noEmit`、`createContext<T \| null>` + 自定义 Hook 抛错、Handler 别名 `ChangeEventHandler<T>`、`style: CSSProperties` | — | — | 大纲第 1、2、6、7、8、11、23 行均为【主流】，课件只在 :49 提 verbatimModuleSyntax、:485 提 useUnknownInCatchVariables；本仓库 typecheck 脚本就是 `vue-tsc --noEmit`，学习者不知道 Vite 不做类型检查 | grep0:vue-tsc\|noEmit\|react-jsx\|createContext\|EventHandler\|CSSProperties；https://react.dev/learn/typescript；https://vuejs.org/guide/typescript/overview.html；node_modules/@types/react/index.d.ts:716,2231,2486 | 二、核心概念 + 七、生产环境注意 |
| R2-28-12 | 小问题 | 措辞 | 其它 | 模板残留「（没有一一对应关系）」7 处；「本项目 22 道旧题」过时计数；`satisfies` 未标 TS 4.9 起；`useId` 只作引用却未提（course-map §2）；「它至今也写不出泛型组件」宜改「不能直接声明泛型组件」；生产提示宜补「取有类型元素优先 currentTarget」 | src/topics/28-react-typescript-basics/react/Example.tsx:32; :663; src/topics/28-react-typescript-basics/vue/Example.vue:33; :425; src/topics/28-react-typescript-basics/vue/OrderCard.vue:11; src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:11; :46; src/topics/28-react-typescript-basics/react/Example.tsx:39; :77-78; :260 | 没有一一对应关系 | 规格 §5 H 模板残留；仓库现为 30 题（含本题在内 8 题也全是 TS）；useId 在 07 主责、28 应一句引用 | course-map §5 H、§2；https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html | 三、Vue 对照 / 七、生产环境注意 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | `React.ReactNode`、`React.ReactElement`、`JSX.Element` 有什么区别，`children` 该用哪个？（追问：为什么 `ReactElement['props']` 在 19 里变成 `unknown`；`PropsWithChildren` 是什么） | 部分 | src/topics/28-react-typescript-basics/react/Example.tsx:18; :244-255; :354-355; :369-376 | 只有 ReactNode；ReactElement / JSX.Element / PropsWithChildren / props 为 unknown 全未讲（R2-28-2、R2-28-8） |
| 2 | React 19 的 TypeScript 类型有哪些破坏性变化？（追问：`useRef()` 为什么必须传参、`MutableRefObject` 去哪了；`React.JSX` 替代全局 `JSX` 时模块增强怎么写；有没有 codemod） | 不能 | — | useRef 传参、RefObject 统一、React.JSX 增强、ReactElement unknown、codemod 一个都没有（R2-28-1、R2-28-2） |
| 3 | 怎么让自定义 `Button` 继承原生 `<button>` 全部属性并透传？（追问：`ComponentProps` vs `ComponentPropsWithoutRef` 何时选哪个；19 里 `ref` 作为普通 prop 的类型怎么写、还需要 `forwardRef` 吗） | 不能 | — | :44 只说「02 = ComponentPropsWithoutRef + rest 透传」，本题无实现、无 `Ref<T>` 类型、无三者取舍（R2-28-3） |
| 4 | 事件处理函数怎么标类型？（追问：`target` 与 `currentTarget` 类型差别；抽离出去的 handler 用 `ChangeEvent<HTMLInputElement>` 还是 `ChangeEventHandler`；对照 Vue 里 `event.target as HTMLInputElement`） | 部分 | src/topics/28-react-typescript-basics/react/Example.tsx:15-17; :275-283; :450-460; src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:56-63; :65-73 | target / currentTarget 差别被 :16 讲成都由泛型决定（R2-28-6）；`ChangeEventHandler` 别名未讲（R2-28-11）；FormEvent 已弃用（R2-28-5） |
| 5 | 泛型组件怎么写、`useReducer` 的类型怎么标？（追问：`.tsx` 里箭头函数泛型 `<T,>`；19 起为何官方建议不给 `useReducer` 传泛型；Vue 的 `generic` 属性与 `defineProps<T>` 对照） | 不能 | — | 泛型组件、`<T,>`、useReducer 19 类型、Vue `generic` 全未讲（R2-28-4、R2-28-7） |

### 29. useReducer 与判别联合 Action

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 签名 `useReducer(reducer, initialArg, init?)`；reducer 纯、接 (state, action) 返回下一个 state（文件头承诺） | https://react.dev/reference/react/useReducer；node_modules/@types/react/index.d.ts:1708-1726 | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:5-8; src/topics/29-use-reducer-and-action-types/react/Example.tsx:189-201 | — |
| 主流 | 从 useState 迁移：setState 改 dispatch action；action 描述「发生了什么」（承诺） | https://react.dev/learn/extracting-state-logic-into-a-reducer | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:5-6; src/topics/29-use-reducer-and-action-types/react/Example.tsx:167-183 | 含 useState 版反例形态 |
| 主流 | action 形状：字符串 `type` + 最少必要字段；一次交互一个 action | https://react.dev/learn/extracting-state-logic-into-a-reducer | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:41-64; src/topics/29-use-reducer-and-action-types/react/Example.tsx:228 | 「一次交互一个 action」仅在 reset 处点到 |
| 主流 | reducer 纯函数规则：不 I/O、不突变、同输入同输出；未知 action `throw`（承诺） | https://react.dev/learn/extracting-state-logic-into-a-reducer | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:73-89; src/topics/29-use-reducer-and-action-types/react/Example.tsx:122-129 | — |
| 主流 | useState vs useReducer 五维度（Code size / Readability / Debugging / Testing / Personal preference）；可同组件混用 | https://react.dev/learn/extracting-state-logic-into-a-reducer | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:155-187; src/topics/29-use-reducer-and-action-types/react/Example.tsx:203-209 | 课件用自己的 4 条信号 + actionLog 混用，未点名官方五维度 |
| 主流 | 取舍判定：多字段一起变 / 规则被多入口共用 / 可测可回放 → useReducer；单值 → useState（承诺） | https://react.dev/learn/choosing-the-state-structure | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:16-18; src/topics/29-use-reducer-and-action-types/react/Example.tsx:161-165 | — |
| 主流 | dispatch 语义：只对下一次渲染生效、`Object.is` 相等跳过、身份稳定可省出依赖、批处理入队 → 24（承诺） | https://react.dev/reference/react/useReducer | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:66-71; src/topics/29-use-reducer-and-action-types/react/Example.tsx:109-110; src/topics/29-use-reducer-and-action-types/react/Example.tsx:195-196; src/topics/29-use-reducer-and-action-types/react/Example.tsx:213 | EMPTY_CART 同引用 bail out 是好补充 |
| 主流 | dispatch 之后组件里读 state 仍是本次渲染的快照 | https://react.dev/reference/react/useReducer | 讲了但错 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:13 | R2-29-5 |
| 主流 | 惰性初始化第三参 `init`，只在首次渲染跑 | https://react.dev/reference/react/useReducer | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:198-199 | 含 StrictMode 双调 init |
| 主流 | Troubleshooting：漏 `...state` 字段变 undefined / 某 case 没 return 整个 state 变 undefined / 渲染期 dispatch → Too many re-renders | https://react.dev/reference/react/useReducer | 未讲 | — | R2-29-3；push 后 return state 已讲（:84） |
| 主流 | StrictMode 开发期双调 reducer 与 initializer 暴露不纯（承诺） | https://react.dev/reference/react/useReducer | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:76-79; src/topics/29-use-reducer-and-action-types/react/Example.tsx:206 | 机制归 23 |
| 主流 | TS 判别联合 + `switch` 收窄 + `default` 里 `never` 穷尽（承诺） | https://react.dev/learn/typescript | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:41-64; src/topics/29-use-reducer-and-action-types/react/Example.tsx:122-129 | 与 03 互指成立（03 vue:101 也用 never） |
| 主流 | TS 推断规则（19 起）：不传类型参数，靠 reducer 参数注解推断；内联 reducer 注解参数 | https://react.dev/blog/2024/04/25/react-19-upgrade-guide；node_modules/@types/react/index.d.ts:1708 | 未讲 | — | R2-29-1；代码 :201 已是无泛型写法但无说明 |
| 主流 | reducer + Context 规模化：state / dispatch 分两个 context + `useX()` / `useXDispatch()` 自定义 Hook | https://react.dev/learn/scaling-up-with-reducer-and-context | 未讲 | — | R2-29-8；:187 仅一句指向 15 |
| 主流 | Immer / `useImmerReducer` 定级（官方教程给出；RTK createSlice 内置） | https://react.dev/learn/extracting-state-logic-into-a-reducer；https://redux-toolkit.js.org/introduction/getting-started | 未讲 | — | R2-29-2 |
| 主流 | reducer 不做 I/O、不发请求（承诺） | https://react.dev/learn/extracting-state-logic-into-a-reducer | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:7-8; src/topics/29-use-reducer-and-action-types/react/Example.tsx:85 | — |
| 主流 | 异步放事件处理器 / effect，完成后 dispatch 结果 action；服务端数据优先 Query → 30 | https://react.dev/learn/extracting-state-logic-into-a-reducer | 未讲 | — | R2-29-4 |
| 较新 | React 19 `useActionState` 形如「异步 reducer」与 useReducer 的分工 → 31 | facts-versions.md A（node_modules/@types/react/index.d.ts:1975,1980） | 未讲 | — | R2-29-7 |
| 旧写法 | `useReducer<React.Reducer<S, A>>(reducer)` 显式泛型；@types/react 19 起 breaking | https://react.dev/blog/2024/04/25/react-19-upgrade-guide | 未讲 | — | R2-29-1 |
| 旧写法 | Redux 时代 action creator + `ADD_TODO` 常量 + switch 样板；RTK `createSlice` 取代 | https://redux-toolkit.js.org/ | 未讲 | — | R2-29-6；:58 只提 `{ type, payload }` 排版 |
| 主流 | Vue：`reactive()` + 类型化 action 函数，无内置 useReducer 对应物（承诺） | https://vuejs.org/guide/scaling-up/state-management.html；node_modules/@vue/reactivity/dist/reactivity.d.ts:44 | 已讲对 | src/topics/29-use-reducer-and-action-types/vue/Example.vue:59-122; src/topics/29-use-reducer-and-action-types/vue/Example.vue:159-166 | apply 原地改 vs reducer 换引用 |
| 主流 | 判别联合在 Vue 同样可用；Pinia 更常见每 action 一个函数（承诺） | https://pinia.vuejs.org/core-concepts/ | 已讲对 | src/topics/29-use-reducer-and-action-types/vue/Example.vue:42-52; src/topics/29-use-reducer-and-action-types/react/Example.tsx:21-24 | — |
| 主流 | Pinia action 可 async、无「纯」约束（承诺） | https://pinia.vuejs.org/core-concepts/actions.html | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:27; src/topics/29-use-reducer-and-action-types/vue/Example.vue:28 | 大纲来源标摘要，见 P-29-1 |
| 主流 | Pinia `$patch` 一次改多字段 → 16 | https://pinia.vuejs.org/core-concepts/state.html | 未讲 | — | R2-29-9 |
| 主流 | Immer `draft` 写法 vs `reactive` 原地改即触发 | https://vuejs.org/guide/extras/reactivity-in-depth.html | 未讲 | — | R2-29-2；vue:66-68 讲了 Proxy 原地改但无 Immer 对照 |
| 主流 | reducer + Context vs Pinia 天然全局、无 Provider | https://pinia.vuejs.org/introduction.html | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:185-187; src/topics/29-use-reducer-and-action-types/vue/Example.vue:148-149 | 一句指向 15 / 16 |
| 主流 | 撤销 = 清空 + 重放；「重放一致」作 reducer 活单测 | — | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:222-236; src/topics/29-use-reducer-and-action-types/react/Example.tsx:248-256 | 大纲未列；好内容 |
| 主流 | Vue「绕过 dispatch 直接改」反面按钮：API 强制收口 vs 约定收口 | — | 已讲对 | src/topics/29-use-reducer-and-action-types/vue/Example.vue:206-215; src/topics/29-use-reducer-and-action-types/react/Example.tsx:29-32 | 大纲未列；措辞见 R2-29-10 |
| 主流 | payload 绝对量 vs 增量与异步回调快照过期 | — | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:327-333 | 大纲未列；与 24 / 26 呼应 |
| 主流 | eslint-plugin-react-hooks 7 recommended 规则（purity / immutability / refs / set-state-in-render） | facts-versions.md F | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:96-131; src/topics/29-use-reducer-and-action-types/react/Example.tsx:254 | 大纲未列；代码无命中（reducer 无 Date.now、无突变，渲染期只有纯 reduce） |

#### 面试 5 问

1. 什么时候该把 useState 换成 useReducer？（追问：官方五个比较维度是什么；能不能在同一组件混用？）
2. reducer 为什么必须是纯函数？在里面 `fetch` 会怎样？（追问：StrictMode 为什么能帮你发现不纯的 reducer？异步逻辑应该放哪？）
3. 用 TS 写 action 类型时为什么用判别联合而不是 `{ type: string; payload?: any }`？（追问：怎么做穷尽检查；React 19 后 `useReducer` 的泛型该怎么写 / 不该怎么写？）
4. `dispatch` 之后立刻读 state 是新值吗？多次 dispatch 会渲染几次？（追问：`dispatch` 需要放进 useEffect 依赖里吗？）
5. reducer + Context 做全局状态和 Zustand / Redux Toolkit 比差在哪？（追问：为什么官方示例把 state 和 dispatch 拆成两个 context？）

#### 生产写法要点

- reducer 单测：纯函数直接 `expect(reducer(state, action)).toEqual(...)`；这是选 useReducer 的核心收益，课件练习应给一条可断言结论（34）。
- 用 `never` 穷尽检查 + `as const` / 字面量 `type`，禁止 `payload: any`；action 类型集中定义并导出给测试。
- 嵌套结构用 Immer（`useImmerReducer`）或先归一化；不要靠多层展开硬撑。
- 异步：请求在外部做、reducer 只收结果；带 loading / error 的状态机用 `status` 字面量联合（03）；表单提交考虑 19 的 `useActionState`（31）。
- 全局化时把 Provider + Hook 封装到一个模块，导出 `useX()` 做 null 检查（15 的 TS 模式）。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `useReducer` + 纯 reducer + dispatch | 无内置对应物：`reactive()` 对象 + 一组类型化的修改函数（或 `switch (action.type)` 手写一个 reducer 也可行） | node_modules/@vue/reactivity/dist/reactivity.d.ts:44（①）；https://vuejs.org/guide/scaling-up/state-management.html（2026-09-16，逐字「it is recommended to define methods on the store with names that express the intention of the actions」） | Vue 状态可原地改，「一个 action 描述一次交互」的精神落在 store 方法上 |
| 判别联合 Action + `switch` | TS 同样可写判别联合；Pinia 更常见的是每个 action 一个函数（类型由函数签名给出，无需联合） | https://pinia.vuejs.org/core-concepts/（2026-09-16，逐字「function()s become actions」） | 类型技术相同，组织方式不同 |
| reducer 不能有副作用、异步在外 | Pinia actions「can be asynchronous」，直接在 action 里 `await`；无「纯」约束 | https://pinia.vuejs.org/core-concepts/actions.html（未抓取，摘要） | 原因：Pinia 没有「渲染期执行」的语义 |
| 一次 dispatch 改多字段 | `store.$patch({...})` / `$patch(state => {...})`；`$subscribe` 「will trigger only once after patches」 | https://pinia.vuejs.org/core-concepts/state.html（2026-09-16，逐字） | 落点在 16 |
| Immer `draft` 式写法 | 不需要：`reactive` 本身就是 Proxy，原地改即触发 | https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-16，逐字） | Immer 在 Vue 里只用于不可变数据结构 / 撤销重做 |
| reducer + Context 规模化 | Pinia store 天然全局、按 id 注册、无 Provider | https://pinia.vuejs.org/introduction.html（2026-09-16，逐字「No need to dynamically add stores, they are all dynamic by default」） | 主责 16 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-29-1 | 概念 | 未讲 | TS19 | React 19 `useReducer` 类型推断规则与旧泛型写法未讲 | — | — | 代码 :201 已是无泛型写法，但没说「19 起最佳实践是不传类型参数、靠 reducer 参数注解推断；内联 reducer 就注解参数」，也没把 `useReducer<React.Reducer<S, A>>(...)` 标【旧写法】（存量代码常见，@types/react 19 起是 breaking change） | https://react.dev/blog/2024/04/25/react-19-upgrade-guide（逐字「The new best practice is not to pass type arguments to useReducer」，大纲已引）；node_modules/@types/react/index.d.ts:1708（① `function useReducer<S, A extends AnyActionArg>(`）；node_modules/@types/react/index.d.ts:1722 | 八、旧写法对照 |
| R2-29-2 | 概念 | 未讲 | 其它 | Immer / `useImmerReducer` 与 Vue `reactive` 的对照未提 | — | — | 官方教程正式给出 `useImmerReducer`（draft 上可 push 也可 return 新值），嵌套深 / 列表内对象多时值得用；RTK `createSlice` 内置同思路；Vue 侧「reactive 本身就是 draft，不需要 Immer」的对照随之缺失 | https://react.dev/learn/extracting-state-logic-into-a-reducer（逐字「Writing concise reducers with Immer」，大纲已引）；https://redux-toolkit.js.org/introduction/getting-started（逐字，大纲已引） | 七、生产环境注意 |
| R2-29-3 | 概念 | 未讲 | 其它 | Troubleshooting 三个常见错误未讲 | — | — | 「某 case 没 return → 整个 state 变 undefined」「对象 state 漏 `...state` → 字段丢失」「渲染期直接 dispatch → Too many re-renders」；课件只讲了 push 后 return state 引用不变（:84） | https://react.dev/reference/react/useReducer（逐字 Troubleshooting 标题，大纲已引） | 六、易错点 |
| R2-29-4 | 概念 | 未讲 | 其它 | 异步逻辑放哪、「结果 action」模式未讲 | — | — | 只说 reducer 不做 I/O（:85）与 Pinia 可 async（:27），没说异步应放事件处理器 / effect、完成后 dispatch `request_started` / `succeeded` / `failed` 结果 action，也没指向 30（服务端数据优先 Query）；面试第 2 问追问答不上 | https://react.dev/learn/extracting-state-logic-into-a-reducer（逐字「Reducers must be pure」，大纲已引） | 五、常见追问 |
| R2-29-5 | 概念 | 讲错 | 绝对化 | 「不存在 03 题读快照的坑」以偏概全 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:13; src/topics/29-use-reducer-and-action-types/vue/Example.vue:14 | 不存在 03 题「读快照」的坑 | reducer 的 state 参数确实是最新的，但组件里 dispatch 之后读 `items` 仍是本次渲染的快照（只对下一次渲染生效）；:329-332 自己也承认异步回调里绝对数量会过期；应改为「reducer 参数不会过期；组件里读到的 state 仍是快照」 | https://react.dev/reference/react/useReducer（逐字 dispatch caveats「only updates the state variable for the next render」，大纲已引） | 六、易错点 |
| R2-29-6 | 概念 | 未讲 | 旧写法 | Redux 时代 action creator + 常量 + switch 样板与 RTK `createSlice` 对照未讲 | — | — | :58 只说「Redux 的 `{ type, payload }` 是另一种排版」；存量代码大量 `ADD_TODO` 常量 + action creator，RTK 已用 `createSlice`（Immer + 自动 action creator）取代；主责 16，此处一句带过 | https://redux-toolkit.js.org/（逐字「write "mutative" immutable update logic, and even create entire "slices" of state automatically」，大纲已引） | 八、旧写法对照 |
| R2-29-7 | 概念 | 未讲 | Actions | React 19 `useActionState` 与 useReducer 的分工未提 | — | — | 【较新】：`useActionState(action, initialState)` 形如「异步 reducer」，管提交生命周期（pending / 结果）；useReducer 管同步纯状态机；主责 31，此处一句 | facts-versions.md A（node_modules/@types/react/index.d.ts:1975,1980） | 九、新动向 |
| R2-29-8 | 概念 | 未讲 | 交叉引用 | reducer + Context 拆两个 context 的官方模式未讲 | — | — | :187 只一句「useReducer + Context 自制 Redux… 15 题」；官方 scaling-up 页核心是 state / dispatch 分两个 context + `useTasks()` / `useTasksDispatch()`，以及为什么拆（dispatch 稳定，只读 dispatch 的组件不随 state 重渲染）；面试第 5 问追问点 | https://react.dev/learn/scaling-up-with-reducer-and-context（逐字，大纲已引） | 五、常见追问 |
| R2-29-9 | 小问题 | 措辞 | 交叉引用 | 「本项目没有装测试框架」将随 34 题过期；Vue 对照缺 Pinia `$patch` 指向 16 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:89 | 本项目没有装测试框架 | 34 题引入 Vitest 后此句失效，且本题 reducer 单测（:87-88）正是 34 的首选断言对象；Vue 对照缺一句 `$patch` 一次改多字段指向 16 | course-map §1（34 测试题已定新增）；https://pinia.vuejs.org/core-concepts/state.html（逐字，大纲已引） | 十、动手练习 |
| R2-29-10 | 小问题 | 措辞 | 绝对化 | 「根本写不出来」「永远」「没有一一对应关系」等 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:32; src/topics/29-use-reducer-and-action-types/react/Example.tsx:195; src/topics/29-use-reducer-and-action-types/react/Example.tsx:390; src/topics/29-use-reducer-and-action-types/react/Example.tsx:21; src/topics/29-use-reducer-and-action-types/vue/Example.vue:22; src/topics/29-use-reducer-and-action-types/vue/Example.vue:171 | 因为根本写不出来 | 组件里 `items.push()` 直接突变同样绕过 reducer（:84 自己列为常见错误），API 只是不给 setter，「根本写不出来」过强，应改「API 不提供 setter，只剩突变这种 bug 路径」；「没有一一对应关系」3 处为模板残留 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:84（课件自身）；course-map §6 H | 四、关键区别 |
| R2-29-11 | 小问题 | 缺标签 | 其它 | 全文无成熟度标签 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:2; src/topics/29-use-reducer-and-action-types/vue/Example.vue:3 | 学习主题：useReducer 与判别联合 Action | grep 【主流】【较新】【旧写法】【尝鲜】0 命中；规格要求逐一标注：useReducer【主流】（16.8 起）、Immer【主流】加分、TS19 推断【主流】/ 显式泛型【旧写法】、useActionState【较新】 | course-map §5（规格 §3.1） | 一、速答 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 什么时候该把 useState 换成 useReducer？（追问：官方五个比较维度；能否同组件混用？） | 部分 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:155-187; src/topics/29-use-reducer-and-action-types/react/Example.tsx:203-209 | 缺官方五维度名称（Code size / Readability / Debugging / Testing / Personal preference）；混用只有代码无明说 |
| 2 | reducer 为什么必须是纯函数？在里面 fetch 会怎样？（追问：StrictMode 为什么能发现不纯；异步逻辑放哪？） | 部分 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:73-89 | 缺「异步放事件处理器 / effect，完成后 dispatch 结果 action」 |
| 3 | 为什么用判别联合而不是 `{ type: string; payload?: any }`？（追问：穷尽检查；React 19 后 useReducer 泛型该怎么写？） | 部分 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:41-64; src/topics/29-use-reducer-and-action-types/react/Example.tsx:122-129 | 缺 React 19 类型推断规则与旧泛型写法 |
| 4 | dispatch 之后立刻读 state 是新值吗？多次 dispatch 渲染几次？（追问：dispatch 要进 useEffect 依赖吗？） | 部分 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:195-196; src/topics/29-use-reducer-and-action-types/react/Example.tsx:213; src/topics/29-use-reducer-and-action-types/react/Example.tsx:226 | 「dispatch 后读 state 仍是旧快照」没有明说，:13 反而说「不存在读快照的坑」 |
| 5 | reducer + Context 做全局状态和 Zustand / RTK 比差在哪？（追问：为什么官方把 state 和 dispatch 拆成两个 context？） | 不能 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:185-187 | 只有一句指向 15 / 16；两个 context 拆分及理由未讲 |

### 30. TanStack Query 与服务端状态

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 定位：fetching / caching / synchronizing / updating server state；服务端状态四特征（远端不归你所有、异步 API、共享所有权、会过期） | https://tanstack.com/query/v5/docs/framework/react/overview（2026-09-16，逐字） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:8-9; :24; :408 | 四特征只讲「真相在服务器」「会过期」两条，见 R2-30-1 |
| 主流 | 服务端状态 ≠ 客户端状态；Context / Zustand / Pinia 只管客户端状态（→ 15 / 16） | https://tanstack.com/query/v5/docs/framework/react/guides/does-this-replace-client-state（2026-09-16，逐字） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:24-32; :383-418 | — |
| 主流 | React 官方把它列为「客户端缓存」推荐之一（与 useSWR / React Router 6.4+ 并列）；loader / use(promise) 作为数据获取候选（→ 11 / 18 / 32） | https://react.dev/reference/react/useEffect#what-are-good-alternatives-to-data-fetching-in-effects（2026-09-16，逐字） | 未讲 | — | R2-30-1 |
| 主流 | 文件头承诺：不是 React 核心 API；react / vue 适配共用 query-core | node_modules/@tanstack/vue-query/build/modern/vueQueryPlugin.js:2-4（① import query-core） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:5-7; src/topics/30-tanstack-query-server-state/vue/queryPlugin.ts:8-10 | 「React 本身只有 useState / useEffect」措辞见 R2-30-12 |
| 主流 | query 定义；queryFn 返回 promise 或 throw；fetch 不因 HTTP 错误抛需手动检查 | https://tanstack.com/query/v5/docs/framework/react/guides/query-functions（2026-09-16，逐字） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:12; :146-168 | mockApi 直接 throw，response.ok 检查未提，见 R2-30-11 |
| 主流 | 文件头承诺：queryKey = 缓存主键 + 依赖声明；queryFn 依赖的变量必须进 key | https://tanstack.com/query/v5/docs/framework/react/guides/query-keys（2026-09-16，逐字） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:10-11; :173-175 | — |
| 主流 | queryKey 哈希规则：顶层数组、确定性哈希、对象键顺序无关 / 数组元素顺序有关 | https://tanstack.com/query/v5/docs/framework/react/guides/query-keys（2026-09-17，逐字） | 未讲 | — | R2-30-2 |
| 主流 | 接入：new QueryClient + QueryClientProvider；useQuery 单对象签名；useQueryClient | https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5（2026-09-16，逐字） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:102-117; :127; :171; :185-188 | — |
| 主流 | 重要默认值：staleTime 0、gcTime 5 分钟、失败重试 3 次指数退避、聚焦重取 | https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults（2026-09-16，逐字）；node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:698,717 | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:18-20; :97-100; :182-183 | 重连 / 挂载 / 定时重取见 R2-30-3 |
| 主流 | status（pending / error / success）× fetchStatus（fetching / paused / idle）两维度；isLoading = isFetching && isPending（v5） | https://tanstack.com/query/v5/docs/framework/react/guides/queries（2026-09-16，逐字）；node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:854-855,910 | 未讲 | — | R2-30-3（isPending / isFetching 布尔层面的区别已在 :177-179 讲对） |
| 主流 | staleTime 是新鲜度旋钮；invalidateQueries = 标 stale（覆盖 staleTime）+ 活跃查询后台重取；前缀匹配 | https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation（2026-09-16，逐字） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:18-20; :22-23; :195-198 | exact / predicate 未提（小） |
| 主流 | 文件头承诺：useMutation + onSuccess 里 invalidateQueries；返回 promise 使 isPending 等到重取完成 | https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations（2026-09-17，逐字："Returning a Promise on `onSuccess` makes sure the data is updated before the mutation is entirely complete"） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:190-216 | 大纲未列「返回 promise」这一点，课件讲对 |
| 主流 | mutation 默认不重试；mutate vs mutateAsync；useMutation 级回调先于 mutate 级、连续 mutate 只触发最后一次 | https://tanstack.com/query/v5/docs/framework/react/guides/mutations（2026-09-16，逐字 / 摘要） | 未讲 | — | R2-30-4 |
| 主流 | 乐观更新：onMutate + cancelQueries + 快照回滚 vs 用 variables 渲染；对照 useOptimistic（→ 31） | https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates（2026-09-17，逐字，见 22-outline） | 未讲 | — | R2-30-5（:201 仅一句「不展开」，:361-362 的 variables 只用于禁用按钮） |
| 主流 | QueryFunctionContext.signal；默认不取消，queryFn 消费 signal 才 opt-in（→ 27） | https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation（2026-09-16，逐字）；node_modules/@tanstack/query-core/build/modern/query.js:138,177 | 缺标签 | src/topics/30-tanstack-query-server-state/react/Example.tsx:12-13; :76-79 | R2-30-6 |
| 主流 | 渲染优化：结构共享、tracked properties（...rest 关掉）、select 引用稳定 | https://tanstack.com/query/v5/docs/framework/react/guides/render-optimizations（2026-09-16，逐字） | 未讲 | — | R2-30-7 |
| 主流 | 分页 placeholderData: keepPreviousData + isPlaceholderData（→ 22） | https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries（2026-09-16，逐字）；node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:370 | 未讲 | — | R2-30-8 |
| 主流 | 依赖查询 enabled：pending + idle 组合、串行瀑布 | https://tanstack.com/query/v5/docs/framework/react/guides/dependent-queries（2026-09-16，逐字）；node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:693 | 未讲 | — | R2-30-8 |
| 主流 | queryOptions() 共置 key 与 queryFn | https://tanstack.com/query/v5/docs/framework/react/guides/query-options（2026-09-16，逐字） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:450-451 | 一句带过即可 |
| 主流 | 内部实现只作引用（→ 14）：useSyncExternalStore + notifyManager.batchCalls；渲染期 getOptimisticResult 会 build 并发出 'added' | node_modules/@tanstack/react-query/build/modern/useBaseQuery.js:28,30；node_modules/@tanstack/query-core/build/modern/queryObserver.js:78；queryCache.js:30-37 | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:220-245 | 大纲未列「渲染期 build」细节，课件讲对且有源码支撑 |
| 较新 | Suspense 模式 useSuspenseQuery（→ 32）：status / error 由 Suspense 与错误边界接管；不支持 enabled / placeholderData；取消不可用 | https://tanstack.com/query/v5/docs/framework/react/guides/suspense（2026-09-16，逐字）；node_modules/@tanstack/react-query/build/modern/index.d.ts:9 | 未讲 | — | R2-30-9 |
| 主流 | throwOnError 抛到错误边界（→ 20）；QueryErrorResetBoundary | https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5（2026-09-16，逐字）；node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:757 | 未讲 | — | R2-30-9 |
| 旧写法 | v4 → v5 改名：loading→pending、isLoading→isPending、cacheTime→gcTime、keepPreviousData→placeholderData、query 上 onSuccess 移除、useErrorBoundary→throwOnError、Hydrate→HydrationBoundary、多重载→单对象 | https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5（2026-09-16，逐字） | 缺标签 | src/topics/30-tanstack-query-server-state/react/Example.tsx:171 | R2-30-10（只讲签名一条；全文无成熟度标签） |
| 旧写法 | 旧名 React Query；包名 react-query → @tanstack/react-query | https://tanstack.com/query/v5/docs/framework/react/overview（2026-09-16，逐字 "formerly known as React Query"） | 未讲 | — | R2-30-10；注册表摘要仍写「React Query」（src/shell/topicRegistry.ts:217） |
| 主流 | QueryClient 创建位置：useState 初始化 vs 模块级；SSR 每请求实例、模块级会跨用户共享；dehydrate + HydrationBoundary（→ 33） | https://tanstack.com/query/v5/docs/framework/react/guides/ssr（2026-09-17，逐字） | 缺标签 | src/topics/30-tanstack-query-server-state/react/Example.tsx:88-95 | R2-30-11（useState vs 模块级讲对，SSR 前提与 HydrationBoundary 未提） |
| 主流 | StrictMode：初始化函数双调、effect 双跑 → 首条 queryFn 被取消再重发 | https://react.dev/reference/react/StrictMode（2026-09-17，逐字："Functions that you pass to useState…"／"one extra setup+cleanup cycle"） | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:94-95; :433-435 | 「两条 queryFn + 一条被取消」需运行验证（P-30-1） |
| 主流 | devtools 一句 | — | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:222 | 「为保持两侧对称没装」措辞见 R2-30-12 |
| 主流 | 大纲未列：失败后 isInvalidated 自动为 true | node_modules/@tanstack/query-core/build/modern/query.js:309-321 | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:229 | 大纲未列，源码证实 |
| 主流 | Vue 对照：VueQueryPlugin（provide / inject，install 内 mount + onUnmount）；queryKey 可放 ref / computed；返回值是 ref 必须解构成顶层 | node_modules/@tanstack/vue-query/build/modern/vueQueryPlugin.js:15,27,30,52；useBaseQuery.js:70；https://vuejs.org/guide/essentials/reactivity-fundamentals.html（2026-09-17，逐字 "Ref unwrapping in templates only applies if the ref is a top-level property"） | 已讲对 | src/topics/30-tanstack-query-server-state/vue/Example.vue:31-37; :120-126; src/topics/30-tanstack-query-server-state/vue/OrdersCountBadge.vue:27-32; src/topics/30-tanstack-query-server-state/vue/queryPlugin.ts:17-22 | — |
| 主流 | 交叉引用 03 08 09 10 11 15 16 18 19 22 27 全部指向正确主题 | facts-inventory | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:11-13; :132; :194; src/topics/30-tanstack-query-server-state/vue/queryPlugin.ts:12 | — |

#### 面试 5 问

1. 服务端状态和客户端状态有什么区别？TanStack Query 能替代 Zustand / Redux 吗？（追问：接入后剩下的客户端状态放哪？为什么不把接口数据再存一份进 store？）
2. queryKey 怎么设计？为什么 queryFn 用到的变量必须进 key？（追问：对象键顺序、数组顺序影响缓存命中吗？前缀失效怎么用？）
3. `staleTime` 和 `gcTime` 的区别？默认值各是多少？（追问：窗口聚焦重取是怎么回事、怎么关？`invalidateQueries` 和 `staleTime` 谁优先？）
4. mutation 之后怎么让列表更新？（追问：`onSuccess` 写在 `useMutation` 还是 `mutate` 上有什么差别？`mutate` 与 `mutateAsync` 怎么选？）
5. `status` 与 `fetchStatus` 为什么要分开？v5 的 `isLoading` 是什么意思？（追问：v4 → v5 改了哪些名？为什么删掉 query 上的 `onSuccess`？）

#### 生产写法要点

- `QueryClient` 默认项统一设 `staleTime`（非 0）、`retry` 策略、`throwOnError`，不要在每个 `useQuery` 里重复；开发期挂 devtools（包名待核实）
- key 工厂集中管理（`keys.orders.list(filters)`），配合 `queryOptions()` 共置 `queryKey / queryFn` 以获得类型推断
- mutation 成功后按前缀 `invalidateQueries`；乐观更新用 `onMutate` + `cancelQueries` + 快照回滚（→ 31 对照 `useOptimistic`）
- `queryFn` 里检查 `response.ok`、透传 `signal`（→ 27）；错误对象类型化（`TError`）
- 不把服务端数据复制进 `useState` / Zustand；派生用 `select`；避免 `...rest` 解构关掉属性追踪
- SSR / RSC：`dehydrate` + `HydrationBoundary`；`gcTime` 在 SSR 为 Infinity（→ 33）
- 本题演示的 `OrdersCountBadge` / 共用 mockApi 要标「演示简化」（无 `signal`、无 HTTP 错误码）

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `@tanstack/react-query` `useQuery(options)` 返回普通对象 | `@tanstack/vue-query` `useQuery(options: MaybeRefOrGetter<UseQueryOptions>)` 返回 `UseQueryReturnType`（refs）；options 各字段 `MaybeRefDeep`，`queryKey` 可为 ref、`enabled` 可为 getter → 变化自动重取 | node_modules/@tanstack/vue-query/build/modern/queryClient-hf6i_vCa.d.ts:29,36,39-40（vue-query 5.102.8 已安装） | 同一 query-core，缓存语义完全一致，只差响应式包装 |
| `<QueryClientProvider client>` | `app.use(VueQueryPlugin)`；`useQueryClient()` | node_modules/@tanstack/vue-query/build/modern/index.d.ts:17（导出 `VueQueryPlugin`、`useQueryClient`）；https://tanstack.com/query/v5/docs/framework/vue/quick-start（2026-09-16，摘要） | Vue 官方 overview 页无 Vue 专属句子（见待核实） |
| `useMutation` + `invalidateQueries` | 同名 API，`useMutation` 在 `<script setup>` 用法一致 | https://tanstack.com/query/v5/docs/framework/vue/quick-start（2026-09-16，摘要） | — |
| 「服务端状态 ≠ Pinia 状态」 | 同一结论：Pinia 管客户端状态，vue-query 管服务端缓存 | https://tanstack.com/query/v5/docs/framework/react/guides/does-this-replace-client-state（2026-09-16，逐字，框架无关） | — |
| `useSyncExternalStore` 订阅 observer | vue-query 用 Vue 响应式包装 observer 结果 | node_modules/@tanstack/vue-query（已安装） | 实现细节未逐行核实，课件不必展开 |
| 无 TanStack 时的手写 | composable `useFetch`（→ 11） | https://vuejs.org/guide/reusability/composables.html（2026-09-16） | — |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-30-1 | 概念 | 未讲 | 其它 | React 官方把 TanStack 列为「客户端缓存」方案之一（与 useSWR / React Router 6.4+ 并列）；路由 loader / use(promise) 作为数据获取候选完全未提；服务端状态四特征只讲两条 | — | — | 文件头 :31-32 只列「SWR / RTK Query」同类，学习者不知道 loader（18）和 use()（32）也是主线候选；「异步 API」「共享所有权」两特征缺失 | grep0:useSWR\|loader\|use(promise) ；https://react.dev/reference/react/useEffect#what-are-good-alternatives-to-data-fetching-in-effects（逐字："Popular open source solutions include TanStack Query, useSWR, and React Router 6.4+."） | 二、核心概念 / 四、关键区别 |
| R2-30-2 | 概念 | 未讲 | 其它 | queryKey 哈希规则：顶层必须数组、确定性哈希、对象键顺序无关、数组元素顺序有关 | — | — | 只讲「key 是主键 + 依赖声明」，缓存何时命中没讲，面试 2 问追问答不上 | grep0:哈希\|hash ；https://tanstack.com/query/v5/docs/framework/react/guides/query-keys（逐字："Query Keys are hashed deterministically!" / "Array item order matters!"） | 二、核心概念 |
| R2-30-3 | 概念 | 未讲 | 其它 | status × fetchStatus 两个枚举字段（含 paused 离线态）、isLoading v5 = isFetching && isPending；触发重取的默认项不全（refetchOnReconnect / refetchOnMount 默认 true、refetchInterval 默认 false） | — | — | 课件只用 isPending / isFetching 两个布尔讲区别，「什么时候重新请求」只讲了聚焦；面试 5 问核心 | grep0:fetchStatus\|isLoading ；node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:854-855,910,725,733,704 | 二、核心概念 |
| R2-30-4 | 概念 | 未讲 | 其它 | mutation 细节：默认不重试；mutate 与 mutateAsync 取舍（卸载后回调不触发 / 可 try-catch）；useMutation 级回调先于 mutate 级、连续 mutate 只触发最后一次 mutate 级回调 | — | — | 面试 4 问追问点；课件只用 hook 级 onSuccess | grep0:mutateAsync ；https://tanstack.com/query/v5/docs/framework/react/guides/mutations（逐字："By default, TanStack Query will not retry a mutation on error"） | 五、常见追问与回答要点 |
| R2-30-5 | 概念 | 未讲 | Actions | 乐观更新两种写法（onMutate + cancelQueries + 快照回滚 vs 用返回的 variables 直接渲染）及与 React 19 useOptimistic 的对照（→ 31） | — | — | :201 只有一句「本题不展开」；:361-362 已用 variables 却只做按钮禁用，离乐观更新一步之遥 | grep0:cancelQueries\|useOptimistic ；https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates（逐字："use the onMutate option to update your cache directly, or leverage the returned variables to update your UI"） | 七、生产环境注意 |
| R2-30-6 | 概念 | 缺标签 | 其它 | 取消是 opt-in：默认不取消卸载 / 不再使用的查询，只有 queryFn 读取了 signal 才会 abort（→ 27） | src/topics/30-tanstack-query-server-state/react/Example.tsx:13 | 库自动 abort 在途请求 | 文件头把「自动 abort」说成无条件；query-core 只在 abortSignalConsumed 时 cancel，不读 signal 则请求照跑、只是结果按 key 归位（竞态安全 ≠ 取消） | node_modules/@tanstack/query-core/build/modern/query.js:138,177 ；https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation（逐字："By default, queries that unmount or become unused before their promises are resolved are _not_ cancelled."） | 六、易错点 |
| R2-30-7 | 概念 | 未讲 | 性能 | 渲染优化：结构共享保持引用稳定、tracked properties（...rest 解构会关掉）、select 需引用稳定 | — | — | 大纲主流项；与 17 题「data 引用何时变」衔接 | grep0:structuralSharing\|select: ；https://tanstack.com/query/v5/docs/framework/react/guides/render-optimizations（逐字："React Query will only trigger a re-render if one of the properties returned from `useQuery` is actually 'used'"） | 五、常见追问与回答要点 |
| R2-30-8 | 概念 | 未讲 | 其它 | 常用选项：分页 placeholderData: keepPreviousData + isPlaceholderData（→ 22）；依赖查询 enabled（pending + idle、瀑布） | — | — | 22 题翻页闪烁的官方解法就是它；enabled 是「条件请求」标准答案 | grep0:keepPreviousData\|placeholderData\|enabled ；https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries（逐字："each new page is treated like a brand new query"）；node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:370,693 | 二、核心概念 |
| R2-30-9 | 概念 | 未讲 | 并发 | Suspense 模式 useSuspenseQuery 一句指向 32（data 必有、不支持 enabled / placeholderData、取消不可用）；throwOnError 把查询错误抛给错误边界（→ 20） | — | — | 文件头「React 本身只有 useState / useEffect」忽略了 use / Suspense 这条线 | grep0:useSuspenseQuery\|throwOnError ；https://tanstack.com/query/v5/docs/framework/react/guides/suspense（逐字，见 30-evidence）；node_modules/@tanstack/react-query/build/modern/index.d.ts:9 | 二、核心概念（各一句） |
| R2-30-10 | 概念 | 缺标签 | 旧写法 | v4 → v5 改名清单【旧写法】未列（loading→pending、isLoading→isPending、cacheTime→gcTime、keepPreviousData→placeholderData、query 上 onSuccess 移除、useErrorBoundary→throwOnError）；旧名 React Query / 包名 react-query 未提；全文无成熟度标签 | src/topics/30-tanstack-query-server-state/react/Example.tsx:171 | 对象参数是 v5 唯一的写法 | 只讲签名一条；存量 v4 项目与面试「v4→v5 改了什么」答不上；注册表摘要仍写「React Query」（src/shell/topicRegistry.ts:217） | https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5（逐字："The `loading` status has been renamed to `pending`, and similarly the derived `isLoading` flag has been renamed to `isPending`"）；grep0:cacheTime | 八、旧写法对照 |
| R2-30-11 | 生产 | 未标简化 | 生产简化 | 演示简化未标：mockApi 直接 throw（真实 fetch 须检查 response.ok 再 throw）；每次进入新建 QueryClient + retry:false / staleTime 5s 是演示配置；SSR 下 QueryClient 必须每请求新建（模块级会跨用户共享）+ dehydrate / HydrationBoundary（→ 33） | src/topics/30-tanstack-query-server-state/react/Example.tsx:156; :92 | delayMs: 800, failRate | :92 已说「真实应用只建一次」，但没说 SSR 场景恰恰不能模块级；HTTP 错误码检查零提及；生产 defaultOptions 应统一 staleTime / retry 未明说 | https://tanstack.com/query/v5/docs/framework/react/guides/ssr（逐字："Creating the queryClient at the file root level makes the cache shared between all requests and means _all_ data gets passed to _all_ users."）；https://tanstack.com/query/v5/docs/framework/react/guides/query-functions（摘要：fetch 不因 HTTP 错误抛）；grep0:dehydrate\|HydrationBoundary | 七、生产环境注意 |
| R2-30-12 | 小问题 | 措辞 | 其它 | 模板残留「（没有一一对应关系）」×4；「React 本身只有 useState / useEffect」忽略 use / Suspense；「为了保持两侧对称没有装 devtools」不准（Vue 也有 @tanstack/vue-query-devtools） | src/topics/30-tanstack-query-server-state/react/Example.tsx:221; :435; :5; :222; src/topics/30-tanstack-query-server-state/vue/Example.vue:173; :445; :6 | Vue 侧没有对应的 API（没有一一对应关系） | 规格 §5 H 模板残留；:5 为绝对化表述 | course-map §6 H；facts-versions A（react 19.2.8 导出 use / Suspense） | 三、Vue 对照 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | 服务端状态和客户端状态有什么区别？TanStack Query 能替代 Zustand / Redux 吗？（追问：剩下的客户端状态放哪？为什么不把接口数据再存一份进 store？） | 能 | src/topics/30-tanstack-query-server-state/react/Example.tsx:24-32; :383-418 | — |
| 2 | queryKey 怎么设计？为什么 queryFn 用到的变量必须进 key？（追问：对象键顺序、数组顺序影响缓存命中吗？前缀失效怎么用？） | 部分 | src/topics/30-tanstack-query-server-state/react/Example.tsx:10-11; :173-175; :195-198 | 缺哈希规则（对象键序无关 / 数组序有关） |
| 3 | staleTime 和 gcTime 的区别？默认值各是多少？（追问：窗口聚焦重取怎么回事、怎么关？invalidateQueries 和 staleTime 谁优先？） | 能 | src/topics/30-tanstack-query-server-state/react/Example.tsx:18-20; :97-100; :195-198 | — |
| 4 | mutation 之后怎么让列表更新？（追问：onSuccess 写在 useMutation 还是 mutate 上有什么差别？mutate 与 mutateAsync 怎么选？） | 部分 | src/topics/30-tanstack-query-server-state/react/Example.tsx:195-216 | 缺 mutate 级回调顺序与 mutateAsync |
| 5 | status 与 fetchStatus 为什么要分开？v5 的 isLoading 是什么意思？（追问：v4 → v5 改了哪些名？为什么删掉 query 上的 onSuccess？） | 部分 | src/topics/30-tanstack-query-server-state/react/Example.tsx:177-179; :171 | 缺 fetchStatus / paused / isLoading 与改名清单 |

### 31. 表单与 Actions（新题）

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | Action 定义（async transition 函数）；自动管理 pending / 乐观 / 错误 / 表单 | https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-31-1（应新写） |
| 主流 | `startTransition(async)` 立即调用；同步 set 标为 Transition；`isPending` 范围 | https://react.dev/reference/react/useTransition；node_modules/@types/react/index.d.ts:1835 | 缺标签 | src/topics/19-async-submit/react/Example.tsx:10-11 | R2-31-1（仅名词） |
| 主流 | `await` 后 set 需再包 `startTransition`；Transition 不能控制文本输入 | https://react.dev/reference/react/useTransition#troubleshooting | 未讲 | — | R2-31-1 |
| 主流 | `<form action={fn}>`：Transition 中执行、收 `FormData`、成功后 reset 非受控字段、POST 恒定、`formAction` 覆盖 | https://react.dev/reference/react-dom/components/form | 缺标签 | src/topics/07-forms/react/Example.tsx:19-21; :244-246; src/topics/07-forms/vue/Example.vue:20-22 | R2-31-2（讲对「收 FormData」，缺 reset / Transition / 标签，且声明「本项目没有实现」） |
| 主流 | 自动 reset 只针对非受控；`requestFormReset`；受控字段自清 | https://react.dev/blog/2024/12/05/react-19；node_modules/@types/react-dom/index.d.ts:133 | 未讲 | — | R2-31-2 |
| 主流 | `useActionState` 三元组、`fn(prev, formData)`、串行排队、`formAction` 稳定 | https://react.dev/reference/react/useActionState；node_modules/@types/react/index.d.ts:1975-1984 | 缺标签 | src/topics/07-forms/react/Example.tsx:20; :246; src/topics/19-async-submit/react/Example.tsx:10 | R2-31-3（仅名词） |
| 主流 | `state` 作错误载体 `return { error }`；`initialState` 首次后忽略 | https://react.dev/reference/react/useActionState | 未讲 | — | R2-31-3 |
| 主流 | 抛错进 Error Boundary（`formAction` / `<form action>` / `startTransition`） | https://react.dev/reference/react/useActionState；/reference/react-dom/components/form | 讲了但错 | src/topics/20-error-handling/react/Example.tsx:9; src/topics/20-error-handling/react/ErrorBoundary.tsx:15 | R2-31-4（20 题把异步一律列为不能捕获） |
| 主流 | `useFormStatus()`（react-dom）返回 `{ pending, data, method, action }`；须在 `<form>` 子组件 | https://react.dev/reference/react-dom/hooks/useFormStatus；node_modules/@types/react-dom/index.d.ts:27-43 | 未讲 | — | R2-31-5 |
| 主流 | `useOptimistic`；set 须在 Action 内；自动回滚 | https://react.dev/reference/react/useOptimistic；node_modules/@types/react/index.d.ts:1930-1936 | 未讲 | — | R2-31-5 |
| 主流 | 何时仍要受控 `value` / `onChange`；受控 + `<form action>` 组合但受控字段不 reset | https://react.dev/reference/react-dom/components/input | 已讲对 | src/topics/07-forms/react/Example.tsx:100-106 | 取舍已讲；与 Action 的组合关系未讲（R2-31-6） |
| 主流 | `FormData` 取值与类型收窄 | node_modules/typescript/lib/lib.dom.d.ts:12239, 39187 | 已讲对 | src/topics/07-forms/react/Example.tsx:84-91; :133-140; src/topics/28-react-typescript-basics/react/Example.tsx:294 | 应迁入：07 主责保留，31 一句引用 |
| 主流 | 「暴露 action prop」模式 | https://react.dev/reference/react/useTransition#exposing-action-props-from-components | 未讲 | — | R2-31-6 |
| 主流 | 多 Action 排队 / 批处理 → 天然防重复（对照 19 手写） | https://react.dev/reference/react/useActionState | 未讲 | — | R2-31-3 |
| 主流 | 渐进增强 / `permalink` 仅 RSC；SPA 无渐进增强（→33） | https://react.dev/reference/react/useActionState | 未讲 | — | R2-31-6 |
| 旧写法 | `useFormState`（react-dom）→ `useActionState`（react）更名；19.2.8 仍导出 | https://react.dev/blog/2024/12/05/react-19；node_modules/@types/react-dom/index.d.ts:45, 50 | 未讲 | — | R2-31-7 |
| 旧写法 | React 18：`onSubmit` + `preventDefault` + 手写 submitting；`startTransition` 只同步 | https://react.dev/reference/react-dom/components/form | 已讲对 | src/topics/19-async-submit/react/Example.tsx:45-78; src/topics/07-forms/react/Example.tsx:126-142 | 手写写法已在 07 / 19 讲对，但未标「18 唯一 / 19 并列」（R2-31-7） |
| 较新 | 与 React Router `<Form>` + route `action` 的区分（→18） | https://reactrouter.com/7.18.4/api/components/Form | 未讲 | — | R2-31-8 |
| 尝鲜 | 19.3：`submit` 事件含 `submitter`；Server Action 自动 reset 后 `onReset` | https://react.dev/blog/2026/09/09/react-19-3 | 未讲 | — | R2-31-8 |
| 主流 | Vue 对照：无 Actions；`@submit.prevent` + `ref` 手写 submitting | https://vuejs.org/guide/essentials/forms.html | 已讲对 | src/topics/19-async-submit/vue/Example.vue:44-67 | 应迁入（引用 19） |
| 主流 | Vue 对照：React Action 错误冒泡到边界 vs Vue 事件处理器（含 async 拒绝）进 `onErrorCaptured` | node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:205-213 | 未讲 | — | R2-31-8；大纲此行写「不捕获异步 Promise 拒绝」与源码相反（P-31-1） |
| 主流 | 大纲未列：`<form>` 内按钮默认 submit、`type="button"`（`formAction` 覆盖的前置） | https://react.dev/reference/react-dom/components/form | 已讲对 | src/topics/07-forms/react/Example.tsx:188 | 大纲未列 |
| 主流 | 大纲未列：30 题 `useMutation.isPending` 与 Action `isPending` 是两套 pending（→30） | https://tanstack.com/query/v5/docs/framework/react/guides/mutations | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:21; :193-198 | 大纲未列；31 应一句区分 |

#### 面试 5 问

1. React 19 的 Action 是什么，和普通 async 函数有什么区别？（追问：`await` 之后的 setState 为什么要再包一层 `startTransition`？`isPending` 何时结束？）
2. `useActionState` 返回的三个值分别是什么，`fn` 的第一个参数为什么是上一次的 state？（追问：它和 `useFormState` 什么关系？错误应该 return 还是 throw？）
3. `useFormStatus` 为什么在渲染 `<form>` 的同一个组件里拿不到 `pending`？（追问：它从 `react` 还是 `react-dom` 导入？`data` 是什么类型？）
4. `<form action={fn}>` 提交成功后表单为什么自动清空了，受控输入为什么没清？（追问：怎么手动 reset？何时仍要用 `value` / `onChange`？）
5. `useOptimistic` 的乐观值什么时候回滚？（追问：set 函数不在 Action 内调用会怎样？失败时怎么给用户提示？）

#### 生产写法要点

- 可恢复错误（校验、业务拒绝）在 action 里 `catch` 后作为 `state` 返回并渲染；不可恢复错误让它 throw，由最近的 Error Boundary 兜底，并在 `createRoot` 的 `onCaughtError` 上报（→20）。
- `FormData` 取值必须做类型收窄 / 校验（`get` 可能是 `File` 或 `null`），不要直接 `as string` 塞进请求。
- 提交按钮放到子组件用 `useFormStatus` 的 `pending` 禁用；需要重复提交保护时依赖 Action 串行排队而不是手写布尔。
- 受控字段与 `<form action>` 组合时，成功后手动清 state（自动 reset 只清非受控字段）。
- 乐观更新要配失败提示（toast / 内联错误），因为 `useOptimistic` 只负责回滚不负责通知。
- 纯 SPA 里 `action` 函数没有渐进增强；需要无 JS 提交时才谈 Server Functions / `permalink`（→33）。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `<form action={fn}>` + `useActionState` | `<form @submit.prevent="onSubmit">` + `ref` 的 `submitting` / `error` | https://vuejs.org/guide/essentials/forms.html（2026-09-16） | Vue 没有「表单 Action」原语，提交状态手写 |
| `useFormStatus().pending` | 无对应物 | — | Vue 无从 DOM 祖先 `<form>` 读取提交状态的 API；用 props / provide 传 `submitting` |
| `useOptimistic` | 无内置；手写「先改本地 ref，失败回滚」 | — | Vue 无并发渲染层，乐观值只是普通响应式状态 |
| `startTransition(async)` 的 `isPending` | 无对应物；`async` 函数自管 loading | — | Vue 无 Transition 优先级概念（`<Transition>` 是动画组件） |
| `FormData` 取值 | 同为原生 `new FormData(e.target)`；更多用 `v-model` 直接持有值 | https://vuejs.org/guide/essentials/forms.html（2026-09-16） | 平台 API 相同 |
| 错误进 Error Boundary | `onErrorCaptured` 不捕获异步 Promise 拒绝，需 `try/catch` | https://vuejs.org/api/composition-api-lifecycle.html（2026-09-16） | 差异：React 19 的 Action 错误可冒泡到边界 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-31-1 | 严重 | 缺标签 | Actions | Action 定义与 `startTransition(async)` 语义（立即同步调用、`isPending` 范围、`await` 后再包一层、不能控制文本输入）全课程仅 19 题一句名词 | src/topics/19-async-submit/react/Example.tsx:10-11 | React 19 的 useActionState / useTransition | 应新写（31 主责）；19 只提名词无标签无实现 | https://react.dev/reference/react/useTransition（逐字「Functions called in startTransition are called “Actions”」「You must wrap any state updates after any async requests in another startTransition」）；node_modules/@types/react/index.d.ts:1835 | 二、核心概念 |
| R2-31-2 | 严重 | 缺标签 | Actions | `<form action={fn}>` 只有 07 一句「延伸」且声明「本项目没有实现」：缺 Transition 语义、自动 reset 非受控 / `requestFormReset`、POST 恒定、`formAction` 覆盖 | src/topics/07-forms/react/Example.tsx:19-21; :244-246; src/topics/07-forms/vue/Example.vue:20-22 | 本项目没有实现 form actions | 应新写（31 主责）；07 保留一句指向 31 | https://react.dev/reference/react-dom/components/form（逐字「After the action function succeeds, all uncontrolled field elements in the form are reset」「the HTTP method will be POST regardless of value of the method prop」）；https://react.dev/blog/2024/12/05/react-19（逐字「you can call the new requestFormReset React DOM API」）；node_modules/@types/react-dom/index.d.ts:133 | 二、核心概念 |
| R2-31-3 | 严重 | 缺标签 | Actions | `useActionState`：三元组 `[state, formAction, isPending]`、`fn(prev, formData)`、串行排队（天然防重复，对照 19 手写）、错误 return 进 state、`initialState` 首次后忽略 —— 全部未讲 | src/topics/07-forms/react/Example.tsx:20; :246; src/topics/19-async-submit/react/Example.tsx:10 | 19 题提到过 useActionState | 应新写；07 两处把它归到 19 题，19 只提名词 | https://react.dev/reference/react/useActionState（逐字「React queues and executes multiple calls to formAction sequentially. Each call to fn receives the result of the previous call」「React ignores this argument after formAction is invoked for the first time」）；node_modules/@types/react/index.d.ts:1975-1984 | 二、核心概念 |
| R2-31-4 | 严重 | 讲错 | Actions | 错误进 Error Boundary：20 题把「异步代码 / Promise」一律列为不能捕获，与 19 的 `formAction` / `<form action>` / `startTransition` 抛错进最近边界相反；可恢复错误应 return state | src/topics/20-error-handling/react/Example.tsx:9; src/topics/20-error-handling/react/ErrorBoundary.tsx:15 | 异步代码（setTimeout / Promise） | 应新写（31）并修 20（R2-20-1） | https://react.dev/reference/react/useActionState（逐字「If formAction throws an error, React cancels all queued actions and shows the nearest Error Boundary」）；https://react.dev/reference/react-dom/components/form（逐字「the fallback for the error boundary will be displayed」） | 二、核心概念 |
| R2-31-5 | 严重 | 未讲 | Actions | `useFormStatus`（react-dom；须在 `<form>` 的子组件；`FormStatusPending \| FormStatusNotPending`）与 `useOptimistic`（set 须在 Action 内、自动回滚、失败需另行提示）全课程 0 处 | — | — | 应新写；新题无目录 | https://react.dev/reference/react-dom/hooks/useFormStatus（逐字「must be called from a component that is rendered inside a <form>」）；https://react.dev/reference/react/useOptimistic（逐字「The set function must be called inside an Action」）；node_modules/@types/react-dom/index.d.ts:27-43；node_modules/@types/react/index.d.ts:1930-1936 | 二、核心概念 |
| R2-31-6 | 概念 | 未讲 | Actions | 加分点未讲：「暴露 action prop」模式、多 Action 批处理限制、渐进增强 / `permalink` 仅 RSC（→33）、受控输入 + `<form action>` 组合时受控字段不 reset | — | — | 应新写；新题无目录 | https://react.dev/reference/react/useTransition#exposing-action-props-from-components（摘要）；https://react.dev/reference/react/useActionState（`permalink` 段逐字「React ignores this argument after formAction is invoked」上下文） | 五、常见追问与回答要点 |
| R2-31-7 | 概念 | 缺标签 | 旧写法 | 旧写法对照缺：`useFormState` → `useActionState` 更名（19.2.8 react-dom 仍导出）；React 18 手写 submitting 是唯一方案、`startTransition` 只接同步函数 —— 07 / 19 的手写写法未标「18 唯一 / 19 仍【主流】并列」 | src/topics/19-async-submit/react/Example.tsx:11 | 但手写 submitting 仍是面试与存量代码的主流 | 应迁入：手写写法留在 07 / 19 并标【主流】，31 的八段写更名与 18 差异 | https://react.dev/blog/2024/12/05/react-19（逐字「we have renamed it and deprecated useFormState」）；node_modules/@types/react-dom/index.d.ts:45, 50 | 八、旧写法对照 |
| R2-31-8 | 小问题 | 未讲 | 交叉引用 | 与 React Router `<Form>` + route `action` 的区分（→18）【较新】、19.3 `submitter` / `onReset`【尝鲜】、Vue 对照（无 Actions；错误进边界 vs `onErrorCaptured`，→19 / 20）均无落点 | — | — | 应新写（各一句）；新题无目录 | https://reactrouter.com/7.18.4/api/components/Form（逐字「progressively enhanced HTML <form> that submits data to actions via fetch」）；https://react.dev/blog/2026/09/09/react-19-3（逐字「Include the submitter in submit events」）；node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:205-213 | 九、新动向 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | React 19 的 Action 是什么，和普通 async 函数有什么区别？（追问：`await` 之后的 setState 为什么要再包一层 `startTransition`？`isPending` 何时结束？） | 不能 | — | 全缺 |
| 2 | `useActionState` 返回的三个值分别是什么，`fn` 的第一个参数为什么是上一次的 state？（追问：它和 `useFormState` 什么关系？错误应该 return 还是 throw？） | 不能 | — | 只有名词（07 :20、19 :10） |
| 3 | `useFormStatus` 为什么在渲染 `<form>` 的同一个组件里拿不到 `pending`？（追问：它从 `react` 还是 `react-dom` 导入？`data` 是什么类型？） | 不能 | — | 全缺 |
| 4 | `<form action={fn}>` 提交成功后表单为什么自动清空了，受控输入为什么没清？（追问：怎么手动 reset？何时仍要用 `value` / `onChange`？） | 部分 | src/topics/07-forms/react/Example.tsx:244-246; :100-106 | 知道 action 收 FormData 与受控取舍；缺自动 reset 规则、`requestFormReset` |
| 5 | `useOptimistic` 的乐观值什么时候回滚？（追问：set 函数不在 Action 内调用会怎样？失败时怎么给用户提示？） | 不能 | — | 全缺 |

### 32. 并发与异步 UI（新题）

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 并发渲染前提：`createRoot` 下渲染可中断 / 从头重来，渲染必须纯 | https://react.dev/reference/react/useDeferredValue | 缺标签 | src/topics/10-effects-and-lifecycle/react/Example.tsx:217; src/topics/26-stale-closures/react/Example.tsx:149; src/topics/29-use-reducer-and-action-types/react/Example.tsx:79 | R2-32-1（三处顺带一句，无标签无主责） |
| 主流 | `useTransition` → `[isPending, startTransition]`；不能控制文本输入；多个合批 | https://react.dev/reference/react/useTransition；node_modules/@types/react/index.d.ts:1878 | 缺标签 | src/topics/19-async-submit/react/Example.tsx:10-11 | R2-32-2（仅名词） |
| 主流 | 独立 `startTransition(action)` 无 `isPending`；无 set 权时用 `useDeferredValue` | https://react.dev/reference/react/startTransition；node_modules/@types/react/index.d.ts:1885 | 未讲 | — | R2-32-2 |
| 主流 | 19 起 Action 可 async；`await` 后再包；错误进边界（→31） | https://react.dev/reference/react/useTransition | 未讲 | — | R2-32-2 |
| 主流 | Suspense + Transition：已显示内容再挂起不退回 fallback；`isPending` 原地进度 | https://react.dev/reference/react/Suspense | 未讲 | — | R2-32-3 |
| 主流 | `useDeferredValue(value, initialValue?)`：旧值先渲染、无固定延迟、不省请求 | https://react.dev/reference/react/useDeferredValue；node_modules/@types/react/index.d.ts:1861 | 未讲 | — | R2-32-4 |
| 主流 | `useDeferredValue` vs 防抖 / 节流；传原始值 | https://react.dev/reference/react/useDeferredValue | 未讲 | — | R2-32-4（14 题 useDebouncedValue.ts 是对照落点） |
| 较新 | `initialValue`（19 起） | https://react.dev/reference/react/useDeferredValue | 未讲 | — | R2-32-4 |
| 主流 | `<Suspense fallback>` 只被 Suspense 兼容数据源触发；effect / 事件里 fetch 不触发 | https://react.dev/reference/react/Suspense；node_modules/@types/react/index.d.ts:789, 817 | 未讲 | — | R2-32-3 |
| 主流 | 揭示规则：同边界一起揭示、嵌套逐级、300ms 节流、首次挂起 state 不保留 | https://react.dev/reference/react/Suspense | 未讲 | — | R2-32-3 |
| 主流 | `<Suspense key={id}>` 重置边界 | https://react.dev/reference/react/Suspense | 未讲 | — | R2-32-3 |
| 主流 | `use(promise)`：可条件调用；拒绝进边界；不可 `try / catch` | https://react.dev/reference/react/use；node_modules/@types/react/index.d.ts:1971-1973 | 未讲 | — | R2-32-5 |
| 主流 | promise 必须缓存：不能在渲染中 `use(fetch())`；来源 loader / Query / 模块缓存 | https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-32-5 |
| 主流 | `use(Context)` 只作引用→15 | https://react.dev/reference/react/use | 未讲 | — | R2-32-5（15 主责） |
| 主流 | `lazy(() => import())` + Suspense；默认导出；缓存；勿在组件内声明 | https://react.dev/reference/react/lazy；node_modules/@types/react/index.d.ts:1611 | 未讲 | — | R2-32-6 |
| 主流 | 路由级 `lazy` 属性（→18）；`RouterProvider` 默认 Transition 导航 | https://react.dev/reference/react/useTransition#building-a-suspense-enabled-router | 未讲 | — | R2-32-6 |
| 较新 | `<Activity mode>`（19.2 稳定）：hidden 隐藏 + 销毁 Effects、state 保留 | https://react.dev/reference/react/Activity；node_modules/@types/react/index.d.ts:1995-2015 | 缺标签 | src/topics/18-routing/react/Example.tsx:468-469; src/topics/18-routing/vue/SettingsNotificationsPage.vue:23-24 | R2-32-7（18 题一句：hidden「卸载 effect、保留 state」，无 mode 默认值 / 预渲染 / 标签） |
| 较新 | Activity 预渲染（低优先级、不挂 Effects）；替代 `{show && <X/>}` | https://react.dev/reference/react/Activity；https://react.dev/blog/2025/10/01/react-19-2 | 未讲 | — | R2-32-7 |
| 尝鲜 | `<ViewTransition>`（19.3 稳定；19.2.8 不导出） | https://react.dev/reference/react/ViewTransition；facts-versions A | 未讲 | — | R2-32-8 |
| 尝鲜 | `addTransitionType` | https://react.dev/reference/react/addTransitionType；facts-versions A | 未讲 | — | R2-32-8 |
| 尝鲜 | 19.3 Transitions 独立渲染 vs 19.2 合批 | https://react.dev/blog/2026/09/09/react-19-3 | 未讲 | — | R2-32-8 |
| 主流 | StrictMode 与并发：dev 双调渲染 / Effects / ref 回调，暴露不纯与缺 cleanup | https://react.dev/reference/react/StrictMode；node_modules/@types/react/index.d.ts:782 | 缺标签 | src/topics/10-effects-and-lifecycle/react/Example.tsx:8; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:125; src/topics/24-batching-and-functional-updates/react/Example.tsx:122 | R2-32-9（双调讲了多处，「与并发 / Activity 的关系」未讲；src/main.tsx:14 已开 StrictMode） |
| 主流 | Suspense 取数现状：自建缓存 vs `useSuspenseQuery`（→30）/ loader（→18）/ RSC（→33） | https://react.dev/reference/react/use | 未讲 | — | R2-32-5（30 题未提 useSuspenseQuery） |
| 主流 | 错误配合：`use` 拒绝 / `lazy` 失败 / Transition 抛错 → 最近边界（→20） | https://react.dev/reference/react/use；/reference/react/useTransition | 讲了但错 | src/topics/20-error-handling/react/Example.tsx:9 | R2-32-2（20 题写异步一律不能捕获） |
| 旧写法 | React 18：`startTransition` 只同步；无 `use`；`useDeferredValue` 无 `initialValue`；`Activity` 未导出 | facts-versions A / B | 未讲 | — | R2-32-9 |
| 主流 | Vue：`<Suspense>` 实验；async `setup`；`#fallback`；`onErrorCaptured`；`suspensible` | https://vuejs.org/guide/built-ins/suspense.html | 未讲 | — | R2-32-10 |
| 主流 | Vue：`defineAsyncComponent` ≈ `lazy` + Suspense + 边界；`<KeepAlive>` ≈ `<Activity>`；无 `useTransition` / `useDeferredValue` 对应物 | https://vuejs.org/guide/components/async.html；/guide/built-ins/keep-alive.html | 缺标签 | src/topics/18-routing/react/Example.tsx:468 | R2-32-10（仅 KeepAlive ↔ Activity 一句） |
| 主流 | 大纲未列：30 题 TanStack `isPending` / `isFetching` 与 React `isPending` 同名不同义 | https://tanstack.com/query/v5/docs/framework/react/guides/queries | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:14-17; :177-179 | 大纲未列；32 应一句区分 |
| 主流 | 大纲未列：27 题「并发」指并发请求，非并发渲染 | — | 已讲对 | src/topics/27-async-race-and-cancellation/react/Example.tsx:172 | 大纲未列；术语撞车需在 32 说明 |

#### 面试 5 问

1. `useTransition` 和 `useDeferredValue` 分别解决什么问题，什么时候选哪个？（追问：为什么受控输入不能放进 Transition？`useDeferredValue` 和防抖的区别？）
2. `Suspense` 的 fallback 什么时候会显示、什么时候不会？（追问：为什么在 `useEffect` 里 fetch 不会触发 Suspense？已显示的内容为什么有时会退回 fallback，怎么避免？）
3. `use(promise)` 为什么不能直接 `use(fetch(...))`？（追问：promise 该从哪来？拒绝了怎么处理？为什么不能 try/catch？）
4. `React.lazy` 为什么不能写在组件函数内部？（追问：加载失败怎么兜底？路由级怎么拆包？）
5. `<Activity mode="hidden">` 和 `{show && <X/>}` 有什么区别？（追问：hidden 时 Effect 会怎样？state 呢？和 Vue 的 `<KeepAlive>` 像在哪、不像在哪？）

#### 生产写法要点

- 搜索 / 筛选类 UI：输入框保持同步受控，列表用 `useDeferredValue` 或把 `setQuery` 以外的更新放进 `startTransition`，并用 `isPending` / 变暗表示过期。
- `use(promise)` 只接受缓存过的 promise：用 TanStack Query / Router loader / 模块级缓存，绝不在渲染中创建。
- 每个 `lazy` 边界配 `Suspense` + Error Boundary（含重试），并在网络错误时给「重新加载」按钮；路由级优先用 Router `lazy`。
- `Activity` 只用于确定会回来的视图（Tab / 抽屉），hidden 子树的订阅会被销毁但内存仍占用；19.2 以下不可用。
- `ViewTransition` / `addTransitionType` 在 19.2.8 不可导入，主线代码不依赖；升到 19.3 且 `@types/react` 19.3 后再用。
- StrictMode 保持开启；双调 Effect 暴露的问题（重复订阅、未取消请求）在并发 / Activity 下会真实发生。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `<Suspense>` + `use` / `lazy` | `<Suspense>`（实验）+ async `setup` / `defineAsyncComponent` | https://vuejs.org/guide/built-ins/suspense.html（2026-09-16） | Vue 侧仍标实验；React 侧稳定 |
| `lazy()` | `defineAsyncComponent(() => import())` | https://vuejs.org/guide/components/async.html（2026-09-16） | Vue 自带 loading / error / delay / timeout 选项；React 靠 Suspense + 边界 |
| `<Activity mode="hidden">` | `<KeepAlive>` + `onActivated` / `onDeactivated` | https://vuejs.org/guide/built-ins/keep-alive.html（2026-09-16） | 都保留 state；Activity 还能低优先级预渲染，KeepAlive 不能 |
| `useTransition` / `useDeferredValue` | 无对应物 | — | Vue 调度是同步批处理，没有渲染优先级 / 可中断渲染 |
| `<ViewTransition>` | 无内置；`<Transition>` 是 CSS 进出动画，View Transitions API 需手动调用 | https://vuejs.org/guide/built-ins/suspense.html（2026-09-16，仅对照） | 两者都可直接用浏览器 `document.startViewTransition`（③ MDN，未抓取） |
| Error Boundary 兜底 `use` 拒绝 | `onErrorCaptured` 捕获 `<Suspense>` 异步错误 | https://vuejs.org/guide/built-ins/suspense.html（2026-09-16） | — |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-32-1 | 严重 | 缺标签 | 并发 | 「并发渲染」在 10 / 26 / 29 只作一句顺带（可能重跑或丢弃渲染），无主责题解释 `createRoot` 可中断渲染、为何渲染必须纯 | src/topics/10-effects-and-lifecycle/react/Example.tsx:217; src/topics/26-stale-closures/react/Example.tsx:149; src/topics/29-use-reducer-and-action-types/react/Example.tsx:79 | 并发渲染下 React 可能重跑或丢弃某次渲染 | 应迁入 32 作主责并回指三题 | https://react.dev/reference/react/useDeferredValue（逐字「the background re-render is interruptible: if there's another update … React will restart the background re-render from scratch」） | 二、核心概念 |
| R2-32-2 | 严重 | 缺标签 | 并发 | `useTransition` / `startTransition` 仅 19 题一句名词：无 `[isPending, startTransition]`、不能控制文本输入、无 set 权用 `useDeferredValue`、19 async Action、Transition 内错误进边界（20 题 :9 反而写异步不能捕获） | src/topics/19-async-submit/react/Example.tsx:10-11 | React 19 的 useActionState / useTransition | 应新写 | https://react.dev/reference/react/useTransition（逐字「Transition updates can't be used to control text inputs」）；https://react.dev/reference/react/startTransition（逐字「You can wrap an update into a Transition only if you have access to the set function of that state」）；node_modules/@types/react/index.d.ts:1878, 1885 | 二、核心概念 |
| R2-32-3 | 严重 | 未讲 | 并发 | `<Suspense>` 全部未讲：fallback 触发条件（仅 Suspense 兼容数据源，effect fetch 不触发）、揭示规则、Transition 下不退回 fallback、`key` 重置 | — | — | 应新写；30 题也未提 useSuspenseQuery；新题无目录 | https://react.dev/reference/react/Suspense（逐字「Suspense does not detect when data is fetched inside an Effect or event handler」「unless the update causing it was caused by startTransition or useDeferredValue」）；node_modules/@types/react/index.d.ts:789, 817 | 二、核心概念 |
| R2-32-4 | 严重 | 未讲 | 并发 | `useDeferredValue` 全部未讲：旧值先渲染、无固定延迟、vs 防抖节流、传原始值、`initialValue`（19）【较新】 | — | — | 应新写；14 题 useDebouncedValue.ts 为对照落点，应回指；新题无目录 | https://react.dev/reference/react/useDeferredValue（逐字「no fixed delay」「does not by itself prevent extra network requests」）；node_modules/@types/react/index.d.ts:1861 | 二、核心概念 |
| R2-32-5 | 严重 | 未讲 | 并发 | `use(promise)` 未讲：条件调用、拒绝进边界、不可 `try / catch`、promise 必须缓存（来源 loader / Query / 模块缓存）；`use(Context)` 一句→15 | — | — | 应新写；新题无目录 | https://react.dev/reference/react/use（逐字「Do not wrap use in a try-catch block」）；https://react.dev/blog/2024/12/05/react-19（逐字「use does not support promises created in render」）；node_modules/@types/react/index.d.ts:1971-1973 | 二、核心概念 |
| R2-32-6 | 严重 | 未讲 | 并发 | `lazy` 未讲：默认导出、缓存、勿在组件内声明、配 Suspense + 边界；路由级 `lazy` 属性与 `RouterProvider` 默认 Transition 导航（→18） | — | — | 应新写；18 题无 `lazy` 路由（另批核对）；新题无目录 | https://react.dev/reference/react/lazy（逐字「Do not declare lazy components inside other components」）；https://react.dev/reference/react/useTransition#building-a-suspense-enabled-router（逐字「Suspense-enabled routers are expected to wrap the navigation updates into Transitions by default」）；node_modules/@types/react/index.d.ts:1611 | 二、核心概念 |
| R2-32-7 | 概念 | 缺标签 | 并发 | `<Activity>`【较新】只在 18 题一句：无【较新】/ 19.2 标签、无 `mode` 默认 `visible`、无「hidden 时 `display:none` + 销毁 Effects + 保留 state」全貌、无低优先级预渲染、替代 `{show && <X/>}`；「卸载 effect」措辞不准（官方为 destroy Effects，组件不卸载） | src/topics/18-routing/react/Example.tsx:468-469; src/topics/18-routing/vue/SettingsNotificationsPage.vue:23-24 | React 19.2 内置了 Activity 组件 | 应新写（32 主责），18 保留一句回指 | https://react.dev/reference/react/Activity（逐字「React will visually hide its children using the display: "none" CSS property. It will also destroy their Effects」）；facts-versions A（node_modules/@types/react/index.d.ts:1995-2015） | 二、核心概念 |
| R2-32-8 | 概念 | 未讲 | 并发 | 【尝鲜】未讲：`<ViewTransition>` / `addTransitionType`（19.3 稳定，19.2.8 不导出，仅 canary.d.ts）；19.3 Transitions 独立渲染 | — | — | 应新写（九段，主线不依赖）；新题无目录 | https://react.dev/blog/2026/09/09/react-19-3（逐字「in 19.3 it's stable and ready to use」）；facts-versions A（canary.d.ts:109, 114） | 九、新动向 |
| R2-32-9 | 概念 | 缺标签 | 旧写法 | StrictMode 双调讲了多处，但未讲「双调是并发 / Activity 可复用渲染的前提」；React 18 现状（`startTransition` 只同步、无 `use`、`useDeferredValue` 无 `initialValue`、`Activity` 未导出）【旧写法】未讲 | src/topics/10-effects-and-lifecycle/react/Example.tsx:8 | StrictMode 开发期故意把组件 | 应新写（八段 + 二段一句） | https://react.dev/reference/react/StrictMode（逐字「do not impact the production build」）；facts-versions A / B；src/main.tsx:14 | 八、旧写法对照 |
| R2-32-10 | 概念 | 缺标签 | Vue现行写法 | Vue 对照只有 18 题 KeepAlive ↔ Activity 一句：`<Suspense>`（实验）、`defineAsyncComponent`、无 `useTransition` / `useDeferredValue` 对应物均未讲 | src/topics/18-routing/react/Example.tsx:468 | KeepAlive 包住 RouterView | 应新写 | https://vuejs.org/guide/built-ins/suspense.html（逐字「experimental feature … not guaranteed to reach stable status」）；https://vuejs.org/guide/components/async.html；/guide/built-ins/keep-alive.html | 三、Vue 对照 |
| R2-32-11 | 小问题 | 措辞 | 其它 | 术语撞车：30 题 `isPending`（TanStack「无缓存」）、27 题「并发」（并发请求）与 32 的 `isPending` / 并发渲染同名不同义，32 需一句区分并回指 | src/topics/30-tanstack-query-server-state/react/Example.tsx:14; src/topics/27-async-race-and-cancellation/react/Example.tsx:172 | isPending（首次加载 | 应新写一句 | course-map §2（30 只作引用 Suspense 模式） | 五、常见追问与回答要点 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | `useTransition` 和 `useDeferredValue` 分别解决什么问题，什么时候选哪个？（追问：为什么受控输入不能放进 Transition？`useDeferredValue` 和防抖的区别？） | 不能 | — | 全缺（14 题只有手写防抖） |
| 2 | `Suspense` 的 fallback 什么时候会显示、什么时候不会？（追问：为什么在 `useEffect` 里 fetch 不会触发 Suspense？已显示的内容为什么有时会退回 fallback，怎么避免？） | 不能 | — | 全缺 |
| 3 | `use(promise)` 为什么不能直接 `use(fetch(...))`？（追问：promise 该从哪来？拒绝了怎么处理？为什么不能 try/catch？） | 不能 | — | 全缺 |
| 4 | `React.lazy` 为什么不能写在组件函数内部？（追问：加载失败怎么兜底？路由级怎么拆包？） | 不能 | — | 全缺 |
| 5 | `<Activity mode="hidden">` 和 `{show && <X/>}` 有什么区别？（追问：hidden 时 Effect 会怎样？state 呢？和 Vue 的 `<KeepAlive>` 像在哪、不像在哪？） | 部分 | src/topics/18-routing/react/Example.tsx:468-469 | 只有「hidden 卸载 effect、保留 state ≈ KeepAlive」一句；缺预渲染、`display:none`、与条件渲染的对比 |

### 33. 服务端与 RSC 概念课（新题）

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 渲染模式总表 CSR / SSR / SSG / ISR / RSC，三维度：HTML 谁产、何时产、组件代码跑在哪 | https://vuejs.org/guide/scaling-up/ssr.html；https://nextjs.org/docs/app/guides/server-and-client-boundary | 未讲 | — | R2-33-1；新题无目录；入口 src/main.tsx:13 是 `createRoot`（CSR）但无注释说明渲染模式 |
| 主流 | SSR：`react-dom/server` 流式 `renderToReadableStream` / `renderToPipeableStream`；`renderToString` / `renderToStaticMarkup` 为 Legacy | https://react.dev/reference/react-dom/server；node_modules/@types/react-dom/server.d.ts:102,114,122,154 | 未讲 | — | R2-33-2；新题无目录；仅 20 题把 "SSR" 列进不能捕获清单（见末行） |
| 主流 | Hydration：`hydrateRoot` 接管已有 HTML；mismatch 视为 bug；差异内容用 `useEffect` + 状态或 `suppressHydrationWarning`（单层） | https://react.dev/reference/react-dom/client/hydrateRoot；node_modules/@types/react-dom/client.d.ts:101 | 未讲 | — | R2-33-1；新题无目录 |
| 主流 | SSG：`react-dom/static` 的 `prerender` / `prerenderToNodeStream`（等 Suspense 全部 resolve，不流式）；Vue 定义 "render it only once, ahead of time, during the build process" | https://react.dev/reference/react-dom/static/prerender；node_modules/@types/react-dom/static.d.ts:104,122 | 未讲 | — | R2-33-2；新题无目录 |
| 主流 | RSC 定义："renders ahead of time, before bundling, in an environment separate from your client app or SSR server" | https://react.dev/reference/rsc/server-components | 未讲 | — | R2-33-3；新题无目录 |
| 主流 | RSC ≠ SSR："'Server-rendered' describes how Next.js produced the HTML. 'Server Component' describes where the component code runs"；Client Component 也在服务端渲染 | https://nextjs.org/docs/app/guides/server-and-client-boundary | 未讲 | — | R2-33-3；新题无目录 |
| 主流 | RSC 限制：无 state / effect / 事件 / 浏览器 API；可写 `async` 组件，`await` 时 suspend | https://react.dev/reference/rsc/server-components | 未讲 | — | R2-33-3；新题无目录 |
| 主流 | RSC 收益：重依赖不进 bundle、直接读数据库 / 文件 / 密钥；Next 四条 "Use Server Components when" | https://nextjs.org/docs/app/getting-started/server-and-client-components | 未讲 | — | R2-33-3；新题无目录 |
| 主流 | 稳定性：React 19 RSC 稳定、bundler / framework 底层 API 不遵 semver；React 不自带 RSC 运行框架，Next App Router 完整实现 | https://react.dev/reference/rsc/server-components；https://react.dev/learn/creating-a-react-app | 未讲 | — | R2-33-3；新题无目录；next 16【主流】只讲概念不安装（facts §2.2） |
| 主流 | `'use client'`：模块依赖图边界而非渲染树边界；文件顶部、传递依赖全进客户端 bundle；子树不必逐个标 | https://react.dev/reference/rsc/use-client | 未讲 | — | R2-33-4；新题无目录 |
| 主流 | 没有 Server Component 指令（"there is no directive for Server Components"）；App Router 里 layouts / pages 默认 Server | https://react.dev/blog/2024/12/05/react-19；https://nextjs.org/docs/app/getting-started/server-and-client-components | 未讲 | — | R2-33-4；新题无目录 |
| 主流 | `'use server'`：标记可从客户端调用的服务端 async 函数；函数体顶部或文件顶部 | https://react.dev/reference/rsc/use-server；https://react.dev/reference/rsc/server-functions | 未讲 | — | R2-33-5；新题无目录 |
| 主流 | 命名：2024-09 前统称 Server Actions；传给 action 的 Server Function 才叫 Server Action | https://react.dev/reference/rsc/server-functions | 未讲 | — | R2-33-5；新题无目录 |
| 主流 | 三种调用：`<form action={fn}>`（渐进增强）、`useActionState(fn, init, permalink)`、`startTransition` / `useTransition` | https://react.dev/reference/rsc/server-functions | 未讲 | — | R2-33-5；新题无目录；07:20、07:246、19:10 只提 `useActionState` 名字且注明「本项目没有实现 form actions」（→ 31） |
| 主流 | 序列化边界：Server → Client props 可序列化类型清单；`'use server'` 参数 / 返回值同表（JSX 不可作参数、FormData 可） | https://react.dev/reference/rsc/use-client；https://react.dev/reference/rsc/use-server | 未讲 | — | R2-33-4；新题无目录 |
| 主流 | 组合规则：Client 不能 import Server，可经 `children` / props 接收；Context Provider 做成 `'use client'` 包 `{children}`；第三方交互组件包一层 client 文件 | https://nextjs.org/docs/app/getting-started/server-and-client-components | 未讲 | — | R2-33-4；新题无目录 |
| 主流 | Server Function 安全：参数完全客户端可控、视为不可信；鉴权写在函数内；Next：POST 公开端点、Origin / Host 检查、action ID 加密；"Render-time gating … is not a security boundary" | https://react.dev/reference/rsc/use-server；https://nextjs.org/docs/app/guides/server-actions | 未讲 | — | R2-33-6；新题无目录；安全主责 → 35 |
| 主流 | App Router 渲染流程：RSC Payload（Server 渲染结果 + Client 占位与 JS 引用 + props）；首屏 HTML → Payload 调和 → hydrate；后续导航只取 Payload | https://nextjs.org/docs/app/getting-started/server-and-client-components | 未讲 | — | R2-33-7；新题无目录 |
| 主流 | 数据进树：Server Component 里直接 `await getPosts()`；promise 作 prop 传给 Client 用 `use()` 流式；旧 Pages Router 靠 `getServerSideProps` | https://nextjs.org/docs/app/guides/server-and-client-boundary；https://react.dev/reference/react/use | 未讲 | — | R2-33-7；新题无目录 |
| 主流 | 防环境污染：只有 `NEXT_PUBLIC_` 前缀进客户端；`import 'server-only'` / `client-only` | https://nextjs.org/docs/app/getting-started/server-and-client-components | 未讲 | — | R2-33-6；新题无目录；Vite `VITE_` 前缀规则待核实 |
| 主流 | 变更后同步：`revalidatePath` / `revalidateTag` / `updateTag` / `refresh`；`redirect` 会 throw；cookie 变更自动重渲染 | https://nextjs.org/docs/app/getting-started/mutating-data；https://nextjs.org/docs/app/guides/server-actions | 未讲 | — | R2-33-7；新题无目录 |
| 主流 | React 19 文档元数据：组件内 `<title>` `<meta>` `<link>` hoist 到 `<head>`；`<title>` children 必须单一字符串、同时只渲染一个 | https://react.dev/reference/react-dom/components/title；https://react.dev/reference/react-dom/components/meta | 未讲 | — | R2-33-8；新题无目录 |
| 主流 | `<link rel="stylesheet" precedence>` 去重 / Suspend / 排序；`preinit` / `preload` / `preconnect` / `prefetchDNS` | https://react.dev/reference/react-dom/components/link；node_modules/@types/react-dom/index.d.ts:56,66,94,118 | 未讲 | — | R2-33-8；新题无目录 |
| 较新 | 19.2：Partial Pre-rendering（`prerender` 的 `postponed` → `resume`）、SSR Suspense 批量揭示、Node Web Streams、`cacheSignal`；Next 16 Cache Components | facts-versions B；https://react.dev/reference/react-dom/static/prerender；https://nextjs.org/docs/app/getting-started/caching | 未讲 | — | R2-33-9；新题无目录 |
| 尝鲜 | 19.3：`use(browser())` 退出 SSR、`<Context>` 可在 Server Components 渲染、Strict Mode hydration 双调 Effects | facts-versions B | 未讲 | — | R2-33-9；新题无目录；19.3.0 未安装 |
| 旧写法 | `ReactDOM.hydrate` / `render`（19 移除）、`renderToString` 非流式、`react-helmet` / effect 改 title、Pages Router `getServerSideProps` / `getStaticProps`、"Server Actions" 旧称 | facts-versions B；https://react.dev/blog/2024/12/05/react-19 | 未讲 | — | R2-33-10；新题无目录 |
| 主流 | Vue SSR 定义与取舍（time-to-content / 统一心智 / SEO vs 服务器负载）；`renderToString(app)` from `vue/server-renderer`；`createSSRApp` hydration | https://vuejs.org/guide/scaling-up/ssr.html；node_modules/@vue/server-renderer/dist/server-renderer.d.ts:17,28,30 | 未讲 | — | R2-33-11；新题无目录 |
| 主流 | Vue SSR 生命周期：服务端只跑 setup 根作用域，`onMounted` 不跑；`onServerPrefetch` 等待 Promise | https://vuejs.org/guide/scaling-up/ssr.html；https://vuejs.org/api/composition-api-lifecycle.html | 未讲 | — | R2-33-11；新题无目录 |
| 主流 | Vue hydration mismatch 三大原因；3.5 `data-allow-mismatch` 对照 `suppressHydrationWarning` | https://vuejs.org/guide/scaling-up/ssr.html；https://vuejs.org/api/ssr.html | 未讲 | — | R2-33-11；新题无目录 |
| 主流 | Vue 跨请求状态污染：每请求新建 app + router + store | https://vuejs.org/guide/scaling-up/ssr.html；https://vuejs.org/guide/scaling-up/state-management.html | 未讲 | — | R2-33-11；新题无目录；→ 16 |
| 主流 | Vue 高阶方案：官方框架列表有 Nuxt、SSG 用 VitePress；Vue 无 RSC 对应物 | https://vuejs.org/guide/scaling-up/ssr.html；https://vuejs.org/guide/extras/ways-of-using-vue.html | 未讲 | — | R2-33-11；新题无目录；Nuxt 推荐语出处待核实 |
| 主流 | 大纲未列：Error Boundary 不能捕获 SSR 期错误（20 题清单） | https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary | 已讲对 | src/topics/20-error-handling/react/ErrorBoundary.tsx:16; src/topics/20-error-handling/react/Example.tsx:9; src/topics/20-error-handling/vue/Example.vue:10 | 只列名词无定义（R2-33-12）；33 定义 SSR 后回指 20；react.dev 当前页是否仍列此条见 pending |
| 主流 | 大纲未列：「服务端状态」（TanStack Query，30 题）不是「服务端渲染」 | https://tanstack.com/query/v5/docs/framework/react/guides/does-this-replace-client-state | 已讲对 | src/topics/30-tanstack-query-server-state/react/Example.tsx:2; :8; :24 | 名词相近，33 开头一句辨析（R2-33-12） |

#### 面试 5 问

1. CSR / SSR / SSG / ISR 有什么区别，各自适合什么场景？（追问：hydration 是什么、mismatch 从哪来、怎么处理；SEO 与首屏与服务器负载怎么权衡）
2. React Server Components 和 SSR 是一回事吗？（追问：RSC 里能不能用 `useState` / `useEffect`；Client Component 会不会在服务端渲染；RSC Payload 里有什么）
3. `'use client'` 和 `'use server'` 各标记什么？有没有标记 Server Component 的指令？（追问：边界在模块图还是渲染树；Client Component 能否 import Server Component、怎么"嵌套"；跨边界 props 有什么限制）
4. Server Functions / Server Actions 是什么、怎么调用、安全上要注意什么？（追问：与 `<form action>` / `useActionState` 配合怎样做渐进增强；为什么参数必须视为不可信、鉴权写在哪；Next 为什么说按钮不渲染不是安全边界）
5. React 19 的 `<title>` / `<meta>` / `<link>` 怎么用，和 react-helmet 相比有什么变化？（追问：`<title>` children 为什么不能写 `{count}`；同时渲染多个 title 会怎样；stylesheet 的 `precedence` 起什么作用）

#### 生产写法要点

- 本课只讲概念；仓库是 Vite CSR，需要 SSR / RSC 时用 Next.js App Router（或 React Router Framework 模式），不要自建 `renderToPipeableStream` + hydrate 流水线。
- `'use client'` 放在树的尽量低处（只标交互叶子）；Context Provider、第三方交互组件各包一层 client 文件；Server Component 只通过 `children` / 序列化 props 传给 Client。
- 每个 Server Function 内部：鉴权 + 校验入参（FormData / 参数当不可信）+ 收窄返回值；含密钥模块 `import 'server-only'`；删除类操作考虑二次确认与更强会话检查。
- Hydration：渲染期间不要读 `window` / 随机数 / 本地时区，改用 `useEffect`；`suppressHydrationWarning` 只作单层逃生口。
- 元数据：一页只渲染一个 `<title>`，children 用模板字符串；样式表 `precedence` 才有去重与顺序保证。
- Vue：每请求新建 app / router / pinia；浏览器 API 放 `onMounted`；`data-allow-mismatch` 只标不可避免的差异。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| `renderToPipeableStream` / `renderToReadableStream`（react-dom/server） | `renderToNodeStream` / `renderToWebStream`（vue/server-renderer） | https://vuejs.org/api/ssr.html（2026-09-17） | 两边都有流式与字符串版本 |
| `hydrateRoot(dom, <App />)` | `createSSRApp(App).mount('#app')` | https://vuejs.org/guide/scaling-up/ssr.html（2026-09-17） | Vue 用不同的工厂函数进入 hydration 模式 |
| `suppressHydrationWarning` | `data-allow-mismatch="text"`（3.5） | https://vuejs.org/api/ssr.html（2026-09-17） | Vue 可按类型细分允许的 mismatch |
| Server Component `async` + `await` 取数 | `onServerPrefetch(async () => …)` | https://vuejs.org/api/composition-api-lifecycle.html（2026-09-17） | Vue 是同一组件在服务端多跑一个预取钩子，不是独立的组件类型 |
| `'use client'` / `'use server'` | 无 | https://vuejs.org/guide/scaling-up/ssr.html（2026-09-17） | Vue 无 RSC：组件代码总会进客户端 bundle，没有模块图边界 |
| `<title>` / `<meta>` 自动 hoist（19） | 无内置；Nuxt `useHead` / 手写 `useSSRContext` 挂 head | https://vuejs.org/api/ssr.html（2026-09-17） | Vue 核心不管理 `<head>`，交给框架 |
| Next.js App Router | Nuxt | https://vuejs.org/guide/extras/ways-of-using-vue.html（2026-09-17） | 页面只写 "Vue frameworks"，Nuxt 名字出处待核实 |
| `prerender`（SSG） | VitePress / 框架 SSG | https://vuejs.org/guide/extras/ways-of-using-vue.html（2026-09-17） | Vue 核心无独立 prerender API |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-33-1 | 严重 | 未讲 | 服务端 | 渲染模式总表（CSR / SSR / SSG / ISR / RSC 三维度）+ hydration 定义、mismatch 来源与处理 | — | — | course-map §1 摘要「CSR / SSR / SSG / RSC」与 §2 主责 33；30 题课件里只有 20 题一处 "SSR" 名词；应新写，并注明本仓库是 Vite CSR（src/main.tsx:13 `createRoot`） | 新题无目录；https://vuejs.org/guide/scaling-up/ssr.html（逐字）；https://react.dev/reference/react-dom/client/hydrateRoot（逐字） | 二、核心概念 |
| R2-33-2 | 严重 | 未讲 | 服务端 | `react-dom/server` 流式 API 与 `renderToString` Legacy；`react-dom/static` 的 `prerender`（SSG） | — | — | 应新写；练习段用 `renderToString` 在 Node 跑一次（不装框架） | 新题无目录；https://react.dev/reference/react-dom/server（逐字）；node_modules/@types/react-dom/server.d.ts:102,114,122,154；node_modules/react-dom/package.json:57,84（`./server`、`./static` 入口存在） | 二、核心概念 + 十、动手练习 |
| R2-33-3 | 严重 | 未讲 | 服务端 | RSC 定义、RSC ≠ SSR、限制（无 state / effect）、async 组件、收益、稳定性与「React 不自带框架」 | — | — | 应新写；面试第 2 问原题；next 16 只讲概念不安装 | 新题无目录；https://react.dev/reference/rsc/server-components（逐字）；https://nextjs.org/docs/app/guides/server-and-client-boundary（逐字） | 二、核心概念 |
| R2-33-4 | 严重 | 未讲 | 服务端 | `'use client'` 模块图边界、没有 Server Component 指令、组合规则（children 传递 / Provider 包 client）、序列化边界 | — | — | 应新写；面试第 3 问原题 | 新题无目录；https://react.dev/reference/rsc/use-client（逐字）；https://react.dev/blog/2024/12/05/react-19（逐字 "there is no directive for Server Components"） | 二、核心概念 + 六、易错点 |
| R2-33-5 | 严重 | 未讲 | Actions | `'use server'` Server Functions 定义、命名史、三种调用（`<form action>` / `useActionState` / `startTransition`） | — | — | 应新写；07:20、19:10 只提 `useActionState` 名字；Actions 家族本身主责 31，本题只讲服务端一侧并指向 31 | 新题无目录；https://react.dev/reference/rsc/server-functions（逐字）；https://react.dev/reference/rsc/use-server（逐字） | 二、核心概念 |
| R2-33-6 | 严重 | 未讲 | 安全a11y | Server Function 安全：参数不可信、鉴权在函数内、"Render-time gating … is not a security boundary"；`server-only` / `NEXT_PUBLIC_` 防泄漏 | — | — | 应新写；与 18 题「按钮不渲染不是安全」同一原则，35 主责安全总论 | 新题无目录；https://react.dev/reference/rsc/use-server（逐字 "Arguments to Server Functions are fully client-controlled."）；https://nextjs.org/docs/app/guides/server-actions（逐字） | 二、核心概念 + 七、生产环境注意 |
| R2-33-7 | 严重 | 未讲 | 服务端 | Next App Router 流程：RSC Payload、数据进树（Server 里 `await`、promise + `use()`）、变更后 `revalidatePath` / `redirect` | — | — | 应新写；只讲流程不写 Next 代码到仓库 | 新题无目录；https://nextjs.org/docs/app/getting-started/server-and-client-components（逐字）；https://nextjs.org/docs/app/getting-started/mutating-data（逐字） | 二、核心概念 |
| R2-33-8 | 严重 | 未讲 | 服务端 | React 19 文档元数据：`<title>` / `<meta>` / `<link>` hoist 规则、`<title>` 单一字符串、`precedence`、`preinit` 家族 | — | — | 应新写；course-map §1 摘要「React 19 元数据」；可在 Vite CSR 里演示（"work with client-only apps"） | 新题无目录；https://react.dev/reference/react-dom/components/title（逐字）；https://react.dev/reference/react-dom/components/link（逐字）；node_modules/@types/react-dom/index.d.ts:56,66,94,118 | 二、核心概念 + 十、动手练习 |
| R2-33-9 | 概念 | 未讲 | 服务端 | 19.2 PPR / `cacheSignal` / Next Cache Components【较新】；19.3 `use(browser())`、Server Components 里的 `<Context>`【尝鲜】 | — | — | 应新写 九段；19.3 未安装 | 新题无目录；facts-versions B；https://react.dev/reference/react-dom/static/prerender（逐字 postponed） | 九、新动向 |
| R2-33-10 | 概念 | 未讲 | 旧写法 | `ReactDOM.hydrate` / `render`、`renderToString` 非流式、`react-helmet`、Pages Router `getServerSideProps`、"Server Actions" 旧称 | — | — | 应新写 八段；存量项目仍多 | 新题无目录；facts-versions B（升级指南移除清单）；https://nextjs.org/docs/app/guides/server-and-client-boundary（逐字） | 八、旧写法对照 |
| R2-33-11 | 概念 | 未讲 | Vue现行写法 | Vue SSR 定义与取舍、`onServerPrefetch`、3.5 `data-allow-mismatch`、跨请求状态污染、Nuxt / VitePress；Vue 无 RSC 对应物 | — | — | 应新写 三段；每条注明「无对应物」的原因 | 新题无目录；https://vuejs.org/guide/scaling-up/ssr.html（逐字）；https://vuejs.org/api/ssr.html（逐字）；node_modules/@vue/server-renderer/dist/server-renderer.d.ts:17,28,30 | 三、Vue 对照 |
| R2-33-12 | 小问题 | 缺标签 | 交叉引用 | 20 题「不能捕获 SSR」只列名词无定义；30 题「服务端状态」易与服务端渲染混淆；07 / 19 提 `useActionState` 未与 Server Functions 关联 | src/topics/20-error-handling/react/ErrorBoundary.tsx:16; src/topics/20-error-handling/react/Example.tsx:9; src/topics/30-tanstack-query-server-state/react/Example.tsx:8; src/topics/07-forms/react/Example.tsx:20; src/topics/19-async-submit/react/Example.tsx:10 | 服务端渲染（SSR） | 33 落地后回指：20 的 SSR 条加「见 33」，30 开头一句辨析，07 / 19 指向 31 / 33 | course-map §6 I 交叉引用 | 二、核心概念（辨析一句） |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | CSR / SSR / SSG / ISR 有什么区别，各自适合什么场景？（追问：hydration 是什么、mismatch 从哪来、怎么处理；SEO 与首屏与服务器负载怎么权衡） | 不能 | — | 30 题里只有 20 题一处 "SSR" 名词（ErrorBoundary.tsx:16），无任何定义、hydration 一字未提（R2-33-1） |
| 2 | React Server Components 和 SSR 是一回事吗？（追问：RSC 里能不能用 `useState` / `useEffect`；Client Component 会不会在服务端渲染；RSC Payload 里有什么） | 不能 | — | RSC / 'use client' / Payload 零命中（R2-33-3、R2-33-7） |
| 3 | `'use client'` 和 `'use server'` 各标记什么？有没有标记 Server Component 的指令？（追问：边界在模块图还是渲染树；Client Component 能否 import Server Component；跨边界 props 有什么限制） | 不能 | — | 指令、边界、序列化清单全无（R2-33-4、R2-33-5） |
| 4 | Server Functions / Server Actions 是什么、怎么调用、安全上要注意什么？（追问：与 `<form action>` / `useActionState` 配合怎样做渐进增强；为什么参数必须视为不可信；Next 为什么说按钮不渲染不是安全边界） | 不能 | — | 07:20、19:10 只提 `useActionState` 名字并声明未实现；Server Functions 与安全一字未提（R2-33-5、R2-33-6） |
| 5 | React 19 的 `<title>` / `<meta>` / `<link>` 怎么用，和 react-helmet 相比有什么变化？（追问：`<title>` children 为什么不能写 `{count}`；同时渲染多个 title 会怎样；stylesheet 的 `precedence` 起什么作用） | 不能 | — | 30 题里 `<title>` / `<meta` / `precedence` 零命中（R2-33-8） |

### 34. 测试（新题）

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 测试基础设施：`test` 脚本、Vitest、Testing Library、DOM 环境 | https://vitest.dev/guide/；facts-versions §2.2 | 未讲 | — | R2-34-1；新题无目录；package.json scripts 仅 dev / build / preview / typecheck / lint / check，无 test；devDependencies 无 vitest、@testing-library/*、jsdom、happy-dom（与第一轮「没有任何测试基础设施」一致） |
| 主流 | 测试分层 Unit / Component / E2E；本课主线组件 + Hook，E2E 一句 | https://vuejs.org/guide/scaling-up/testing.html | 未讲 | — | R2-34-10；新题无目录 |
| 主流 | Vitest 定位（"powered by Vite"，复用 vite.config）；`vitest` vs `vitest run` | https://vitest.dev/guide/ | 未讲 | — | R2-34-1；新题无目录；vitest 4.1.11 engines `node ^20 \|\| ^22 \|\| >=24`（npm view），本机 Node 22.22.1 满足 |
| 主流 | 配置：`defineConfig` from `vitest/config`，`test.environment: 'jsdom'`；jsdom / happy-dom 单独安装；`// @vitest-environment` | https://vitest.dev/guide/environment | 未讲 | — | R2-34-1；新题无目录 |
| 主流 | `globals` 默认 false；RTL 自动 `cleanup` 依赖全局 `afterEach`，否则 setup 里 `afterEach(cleanup)` | https://vitest.dev/config/globals；https://testing-library.com/docs/react-testing-library/setup | 未讲 | — | R2-34-1；新题无目录 |
| 主流 | `setupFiles`：每个测试文件前运行；放 `import '@testing-library/jest-dom/vitest'` | https://vitest.dev/config/setupfiles；https://github.com/testing-library/jest-dom | 未讲 | — | R2-34-1；新题无目录 |
| 主流 | 基本 API：`describe` / `it` / `expect`；`vi.fn` / `vi.spyOn` / `vi.mock`（hoist）/ `vi.stubGlobal`；`clearAllMocks` / `resetAllMocks` / `restoreAllMocks` 区别 | https://vitest.dev/api/vi.html | 未讲 | — | R2-34-2；新题无目录 |
| 主流 | Fake timers：`vi.useFakeTimers` → `advanceTimersByTime(Async)` / `runAllTimers` / `setSystemTime` → `useRealTimers` | https://vitest.dev/api/vi.html | 未讲 | — | R2-34-2；新题无目录；被测对象已存在：14 防抖、26 轮询、27 竞态延时 |
| 主流 | RTL 定位与 Guiding Principle（"The more your tests resemble the way your software is used…"）；不测实现细节 | https://testing-library.com/docs/react-testing-library/intro | 未讲 | — | R2-34-3；新题无目录 |
| 主流 | 查询三族 `getBy` / `queryBy` / `findBy`、`*AllBy`、`screen`、`screen.debug()` | https://testing-library.com/docs/queries/about | 未讲 | — | R2-34-3；新题无目录 |
| 主流 | 查询优先级：`getByRole`（配 `name`）→ `getByLabelText` → … → `getByTestId` 最后 | https://testing-library.com/docs/queries/about | 未讲 | — | R2-34-3；新题无目录；与 35 a11y 挂钩 |
| 主流 | `render(ui, { wrapper })` 返回值；自动 `cleanup`；自定义 `render` 把 Router / QueryClientProvider / Context 包进去 | https://testing-library.com/docs/react-testing-library/api；/docs/react-testing-library/setup | 未讲 | — | R2-34-4；新题无目录 |
| 主流 | 测 Hook：`renderHook(() => useX(props), { initialProps, wrapper })` → `result.current` / `rerender` | https://testing-library.com/docs/react-testing-library/api | 未讲 | — | R2-34-4；新题无目录；被测对象 14 题 useDebouncedValue.ts / useWindowWidth.ts |
| 主流 | 异步：`findBy*` = `getBy` + `waitFor`（默认 1000ms）；`waitFor` 只放断言；`waitForElementToBeRemoved` | https://testing-library.com/docs/dom-testing-library/api-async | 未讲 | — | R2-34-5；新题无目录 |
| 主流 | `userEvent.setup()` 全 API `await`；与 `fireEvent` 区别；fake timers 下 `advanceTimers` | https://testing-library.com/docs/user-event/intro；/docs/user-event/options | 未讲 | — | R2-34-5；新题无目录 |
| 主流 | `act`：定义、RTL helpers 已包裹、`await act(async …)`、19 起从 `react` 导入（`react-dom/test-utils` 移除） | https://react.dev/reference/react/act；node_modules/@types/react/index.d.ts:1904-1905；facts-versions B | 未讲 | — | R2-34-6；新题无目录 |
| 主流 | jest-dom 断言：`toBeInTheDocument` / `toBeVisible` / `toBeDisabled` / `toHaveTextContent` / `toHaveFocus` / `toHaveAccessibleName` 等；Vitest 入口 `@testing-library/jest-dom/vitest` | https://github.com/testing-library/jest-dom | 未讲 | — | R2-34-3；新题无目录 |
| 主流 | 测路由（Data 模式）：`createRoutesStub([{ path, Component, loader, action }])` + `<Stub initialEntries>` | https://reactrouter.com/7.18.4/start/framework/testing；/7.18.4/api/utils/createRoutesStub | 未讲 | — | R2-34-7；新题无目录；视 18 主线（Data 模式已定） |
| 主流 | 测路由（声明式）：`<MemoryRouter initialEntries>` 包 `<Routes>`；Data 整树 `createMemoryRouter` + `<RouterProvider>` | https://reactrouter.com/7.18.4/api/declarative-routers/MemoryRouter；facts-versions C | 未讲 | — | R2-34-7；新题无目录；18 题演示本身已用 MemoryRouter（facts-inventory） |
| 主流 | 测 TanStack Query：每测试 `new QueryClient({ defaultOptions: { queries: { retry: false } } })`、`wrapper` 包 Provider、`waitFor(isSuccess)`、`gcTime: Infinity` | https://tanstack.com/query/v5/docs/framework/react/guides/testing | 未讲 | — | R2-34-8；新题无目录；→ 30 |
| 主流 | 测异步请求：`vi.mock('@/shared/mockApi')` / `vi.stubGlobal('fetch')`；loading → success / error / empty 各一条；竞态用手动 resolve 的 promise | https://vitest.dev/api/vi.html；https://testing-library.com/docs/dom-testing-library/api-async | 未讲 | — | R2-34-8；新题无目录；被替换对象 src/shared/mockApi.ts；→ 11 / 27 |
| 主流 | 测 Error Boundary：抛错组件 + fallback 断言；19 起错误走 `console.error` / `reportError`，用 `vi.spyOn(console, 'error')` 静音 | facts-versions B；https://vitest.dev/api/vi.html | 未讲 | — | R2-34-8；新题无目录；→ 20 |
| 主流 | MSW 结论：网络层拦截库，本仓库数据源是内存 mockApi（无 HTTP）→ 只提一句不安装 | https://mswjs.io/docs/（③ 线索）；https://tanstack.com/query/v5/docs/framework/react/guides/testing | 未讲 | — | R2-34-10；新题无目录 |
| 主流 | 每题「练习」写一条可断言结论并变成测试 | course-map §2 | 未讲 | — | R2-34-12；新题无目录；现有 30 题只有「试试…」式提示 |
| 主流 | Vue 侧：Vitest 官方推荐；组件测试推荐 `@vue/test-utils`，`@testing-library/vue` 对 Suspense 异步组件有问题；composable 用 `withSetup` 宿主 | https://vuejs.org/guide/scaling-up/testing.html | 未讲 | — | R2-34-9；新题无目录 |
| 主流 | `@testing-library/vue`：基于 DOM Testing Library + VTU；同一套 `render` / `screen` / jest-dom | https://testing-library.com/docs/vue-testing-library/intro | 未讲 | — | R2-34-9；新题无目录；@testing-library/vue 8.1.0 |
| 较新 | Vitest Browser Mode（Playwright / WebdriverIO）、`vitest-browser-react` / `-vue`；一句带过 | https://vitest.dev/guide/browser/ | 未讲 | — | R2-34-11；新题无目录；稳定状态待核实 |
| 旧写法 | Jest + `react-test-renderer`（19 弃用）、Enzyme、`react-dom/test-utils` 的 `act`（19 移除）、`@testing-library/react-hooks`（并入 RTL）、Jest 28+ 需 `jest-environment-jsdom` | facts-versions B；https://testing-library.com/docs/react-testing-library/intro；/docs/react-testing-library/setup | 未讲 | — | R2-34-11；新题无目录 |
| 主流 | 大纲未列：reducer 纯函数可脱离组件单测（`expect(cartReducer(…)).toEqual(…)` 形态） | https://react.dev/learn/extracting-state-logic-into-a-reducer | 已讲对 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:86-89; src/topics/29-use-reducer-and-action-types/vue/Example.vue:16; :77 | 只展示形态、未指明框架，:89 自注「本项目没有装测试框架」（R2-34-12）；34 落地后改成真实测试 |
| 主流 | 大纲未列：「纯函数可单独 import 出去写单元测试」（03 / 28） | https://react.dev/learn/keeping-components-pure | 已讲对 | src/topics/03-state/react/Example.tsx:159-160; src/topics/28-react-typescript-basics/react/Example.tsx:114 | 与 29 同类，34 回指（R2-34-12） |
| 主流 | 大纲未列：「UI 禁用属于视图层防护：可能被…测试代码直接调用」（19） | https://testing-library.com/docs/queries/about | 已讲对 | src/topics/19-async-submit/react/Example.tsx:50 | 可作 34「断言用户可见结果、不绕过 UI」的反例引用 |
| 主流 | 大纲未列：应用入口开启 `<StrictMode>`；RTL `render` 默认不包 StrictMode，测试与 dev 的双调行为不同 | https://react.dev/reference/react/StrictMode | 已讲对 | src/main.tsx:14 | 34 需说明差异；RTL 是否有 `reactStrictMode` 配置见 pending |

#### 面试 5 问

1. React Testing Library 的核心理念是什么，为什么查询优先用 `getByRole`？（追问：`getBy` / `queryBy` / `findBy` 分别在什么场景；`data-testid` 什么时候可以用；这和可访问性有什么关系）
2. `act` 是什么，什么时候需要手动写？（追问：为什么用 RTL 时通常不用写；"not wrapped in act(...)" 警告怎么处理；为什么要 `await act(async …)`；19 起从哪里导入）
3. 怎么测自定义 Hook 和依赖 Provider 的组件？（追问：`renderHook` 的 `wrapper` 与 `initialProps`；测 TanStack Query 为什么要 `retry: false` 且每测试新建 QueryClient；自定义 `render` 怎么封装）
4. 怎么测异步与定时器？（追问：`findBy` 与 `waitFor` 区别与默认超时；fake timers 下 `user-event` 为什么要传 `advanceTimers`；`waitFor` 里为什么只放断言不放副作用）
5. 怎么测用了 React Router 的页面，MSW 值不值得引入？（追问：`createRoutesStub` vs `MemoryRouter` vs `createMemoryRouter` 各适合什么；Vitest 与 Jest 的差异、jsdom 与 happy-dom 怎么选；什么时候才需要网络层 mock）

#### 生产写法要点

- 项目当前**没有**测试基础设施：新增 `vitest.config.ts`（`environment: 'jsdom'`、`setupFiles`、`css: false`）、`src/test/setup.ts`（jest-dom/vitest、`afterEach(cleanup)` 或 `globals: true`）、`npm test` = `vitest run`，并接进 `check` 脚本；依赖版本按 facts §2.2。
- 自定义 `render` 统一注入 `QueryClientProvider`（`retry: false`）、路由（`createMemoryRouter` + `RouterProvider` 或 `createRoutesStub`）、主题 Context；测试文件只 import 这个 `test-utils`。
- 断言用户可见结果（文本、role、禁用态、焦点），不断言 state / 内部函数被调用；`getByTestId` 需说明理由。
- 异步一律 `await findBy*` / `waitFor`，禁止 `setTimeout` 等待；用 fake timers 的用例必须 `useRealTimers` 收尾；user-event 配 `advanceTimers`。
- 每个模拟 API（`src/shared/mockApi`）在测试里用 `vi.mock` 替换并控制延迟 / 失败，覆盖 loading / error / empty / 竞态四类断言；接入真实 HTTP 后再考虑 MSW。
- Vue 侧统一用 Vitest；组件测试优先 `@vue/test-utils`，`@testing-library/vue` 用于与 React 对照且避开 Suspense 异步组件。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| Vitest + `@testing-library/react` | Vitest + `@vue/test-utils`（官方推荐）/ `@testing-library/vue` | https://vuejs.org/guide/scaling-up/testing.html（2026-09-17） | 官方提醒 `@testing-library/vue` 对 Suspense 异步组件有问题 |
| `render(<Comp prop />)` + `screen.getByRole` | `render(Comp, { props })` + `screen.getByRole`（VTL）或 `mount(Comp)`（VTU） | https://testing-library.com/docs/vue-testing-library/intro（2026-09-17） | 查询 API 同源（DOM Testing Library） |
| `renderHook(() => useX())` | `withSetup(() => useX())` 宿主组件 | https://vuejs.org/guide/scaling-up/testing.html（2026-09-17） | composable 依赖生命周期 / inject 时必须挂到组件里 |
| `act` / RTL 自动包裹 | `await nextTick()` / `flushPromises` | https://vuejs.org/guide/scaling-up/testing.html（2026-09-17，摘要） | Vue 无 act 概念，等待响应式刷新即可（`flushPromises` 出处待核实） |
| `createRoutesStub` / `MemoryRouter` | `createRouter({ history: createMemoryHistory() })` + `app.use(router)` | facts-versions D（`createMemoryHistory` 签名） | Vue Router 用内存 history 而非路由桩 |
| `QueryClientProvider` wrapper | `VueQueryPlugin` 注入 + `@tanstack/vue-query` | https://tanstack.com/query/v5/docs/framework/react/guides/testing（2026-09-17，React 侧） | Vue 侧同样需 `retry: false`（vue-query 测试页未抓） |
| `vi.useFakeTimers()` | 同一套 Vitest API | https://vitest.dev/api/vi.html（2026-09-17） | 与框架无关 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-34-1 | 严重 | 未讲 | 测试 | 测试基础设施与配置：阶段 1 安装 vitest 4.1.11 + @testing-library/react 16.3.3 + @testing-library/dom 10.x + @testing-library/user-event 14.6.7 + @testing-library/jest-dom 6.10.0 + jsdom 30 或 happy-dom 20 + @testing-library/vue 8.1.0；`vitest.config.ts`（`environment` / `globals` 或 `afterEach(cleanup)` / `setupFiles`）、`npm test` = `vitest run` 并接进 `check` | — | — | 应新写；package.json 无 test 脚本、无任何测试依赖；course-map §1 摘要「Vitest + Testing Library」 | 新题无目录；facts-versions §2.2 最后一行；https://vitest.dev/guide/environment（逐字）；https://vitest.dev/config/globals（逐字） | 二、核心概念 + 七、生产环境注意 |
| R2-34-2 | 严重 | 未讲 | 测试 | Vitest 基本 API（`vi.fn` / `spyOn` / `mock` hoist / `stubGlobal`、clear vs reset vs restore）与 fake timers 全套 | — | — | 应新写；14 / 26 / 27 的定时器与轮询场景是现成被测对象 | 新题无目录；https://vitest.dev/api/vi.html（逐字） | 二、核心概念 |
| R2-34-3 | 严重 | 未讲 | 测试 | RTL 理念（Guiding Principle）、查询三族、优先级 `getByRole` 优先、`getByTestId` 兜底、jest-dom 断言 | — | — | 应新写；面试第 1 问原题；与 35 a11y 挂钩 | 新题无目录；https://testing-library.com/docs/queries/about（逐字）；https://github.com/testing-library/jest-dom（逐字） | 二、核心概念 |
| R2-34-4 | 严重 | 未讲 | 测试 | `render` 选项与自定义 `render`（wrapper 注入 Router / QueryClient / Context）；`renderHook` 测 14 题 `useDebouncedValue` | — | — | 应新写；面试第 3 问原题 | 新题无目录；https://testing-library.com/docs/react-testing-library/api（逐字）；/docs/react-testing-library/setup（逐字 customRender） | 二、核心概念 + 十、动手练习 |
| R2-34-5 | 严重 | 未讲 | 测试 | 异步：`findBy*` / `waitFor`（只放断言）/ `waitForElementToBeRemoved`；`userEvent.setup()` vs `fireEvent`；fake timers 下 `advanceTimers` | — | — | 应新写；面试第 4 问原题；对应 11 / 27 的三态与竞态 | 新题无目录；https://testing-library.com/docs/dom-testing-library/api-async（逐字）；https://testing-library.com/docs/user-event/intro（逐字 "fireEvent dispatches DOM events, whereas user-event simulates full interactions"） | 二、核心概念 |
| R2-34-6 | 严重 | 未讲 | 测试 | `act`：定义、RTL 已包裹、何时手写、`await act(async …)`、19 起从 `react` 导入、`IS_REACT_ACT_ENVIRONMENT` | — | — | 应新写；面试第 2 问原题；`react-dom/test-utils` 在 19 移除属【旧写法】 | 新题无目录；https://react.dev/reference/react/act（逐字）；node_modules/@types/react/index.d.ts:1904-1905；facts-versions B | 二、核心概念 + 八、旧写法对照 |
| R2-34-7 | 严重 | 未讲 | Router | 测路由：`createRoutesStub`（Data / Framework 模式复用组件）、`createMemoryRouter` + `RouterProvider`（整树）、`MemoryRouter`（仅声明式） | — | — | 应新写；面试第 5 问原题；18 主线 Data 模式已定，声明式并排 | 新题无目录；https://reactrouter.com/7.18.4/start/framework/testing（逐字）；https://reactrouter.com/7.18.4/api/declarative-routers/MemoryRouter（逐字）；facts-versions C（`createMemoryRouter` 签名） | 二、核心概念 + 十、动手练习 |
| R2-34-8 | 严重 | 未讲 | 测试 | 测 TanStack Query（每测试新建 `QueryClient`、`retry: false`、`gcTime`）、测异步请求（`vi.mock` 替换 mockApi、三态 + 竞态）、测 Error Boundary（静音 `console.error`） | — | — | 应新写；对应 30 / 11 / 27 / 20 | 新题无目录；https://tanstack.com/query/v5/docs/framework/react/guides/testing（逐字）；https://vitest.dev/api/vi.html（逐字 spyOn）；facts-versions B（19 渲染错误不再 rethrow） | 二、核心概念 |
| R2-34-9 | 严重 | 未讲 | Vue现行写法 | Vue 侧：Vitest 同为官方推荐；组件测试官方推荐 `@vue/test-utils`，`@testing-library/vue` 对 Suspense 异步组件「should be used with caution」；composable 用 `withSetup` 宿主；`createMemoryHistory` 测路由；vue-query 同样 `retry: false` | — | — | 应新写 三段；course-map §1 摘要「Vue 侧 @testing-library/vue」 | 新题无目录；https://vuejs.org/guide/scaling-up/testing.html（逐字）；https://testing-library.com/docs/vue-testing-library/intro（逐字）；facts-versions D（`createMemoryHistory` 签名） | 三、Vue 对照 |
| R2-34-10 | 概念 | 未讲 | 测试 | 测试分层（Unit / Component / E2E 一句）与 MSW 结论：只提一句不安装，理由是数据源为内存 `src/shared/mockApi`（无 HTTP），接真实 HTTP 后再引入 | — | — | 应新写；大纲阶段判断沿用 | 新题无目录；https://vuejs.org/guide/scaling-up/testing.html（逐字三定义）；https://mswjs.io/docs/（③ 摘要） | 二、核心概念 + 七、生产环境注意 |
| R2-34-11 | 概念 | 未讲 | 旧写法 | 旧写法 Jest + `react-test-renderer`（19 弃用）、Enzyme、`react-dom/test-utils` 的 `act`、`@testing-library/react-hooks`；较新 Vitest Browser Mode 一句 | — | — | 应新写 八 / 九段 | 新题无目录；facts-versions B；https://testing-library.com/docs/react-testing-library/intro（摘要 Enzyme）；https://vitest.dev/guide/browser/（摘要） | 八、旧写法对照 + 九、新动向 |
| R2-34-12 | 小问题 | 缺标签 | 交叉引用 | 29 展示 `expect(...).toEqual(...)` 形态并自注「本项目没有装测试框架」；03 / 28 / 29 vue 只说「可单测」；30 题练习无可断言结论 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:87-89; src/topics/03-state/react/Example.tsx:159; src/topics/28-react-typescript-basics/react/Example.tsx:114; src/topics/29-use-reducer-and-action-types/vue/Example.vue:77 | 本项目没有装测试框架 | 34 落地后：29 的形态改成真实 `cartReducer.test.ts` 并回指；每题十段「练习」补一条可断言结论 | course-map §2（测试组的只作引用要求） | 十、动手练习 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | React Testing Library 的核心理念是什么，为什么查询优先用 `getByRole`？（追问：`getBy` / `queryBy` / `findBy` 分别在什么场景；`data-testid` 什么时候可以用；这和可访问性有什么关系） | 不能 | — | 30 题里 `testing-library` / `screen.` / `getBy` 零命中（R2-34-3） |
| 2 | `act` 是什么，什么时候需要手动写？（追问：为什么用 RTL 时通常不用写；"not wrapped in act(...)" 警告怎么处理；为什么要 `await act(async …)`；19 起从哪里导入） | 不能 | — | `act(` 零命中（R2-34-6） |
| 3 | 怎么测自定义 Hook 和依赖 Provider 的组件？（追问：`renderHook` 的 `wrapper` 与 `initialProps`；测 TanStack Query 为什么要 `retry: false` 且每测试新建 QueryClient；自定义 `render` 怎么封装） | 不能 | — | 29:86-89 只有 reducer 纯函数的 `expect` 形态，`renderHook` / `wrapper` / `retry: false` 零命中（R2-34-4、R2-34-8） |
| 4 | 怎么测异步与定时器？（追问：`findBy` 与 `waitFor` 区别与默认超时；fake timers 下 `user-event` 为什么要传 `advanceTimers`；`waitFor` 里为什么只放断言不放副作用） | 不能 | — | `findBy` / `waitFor` / `useFakeTimers` / `userEvent` 零命中（R2-34-2、R2-34-5） |
| 5 | 怎么测用了 React Router 的页面，MSW 值不值得引入？（追问：`createRoutesStub` vs `MemoryRouter` vs `createMemoryRouter` 各适合什么；Vitest 与 Jest 的差异、jsdom 与 happy-dom 怎么选；什么时候才需要网络层 mock） | 不能 | — | 18 题用 MemoryRouter 只为演示隔离，无测试语境；`createRoutesStub` / `msw` / `jsdom` 零命中（R2-34-7、R2-34-10） |

### 35. 安全与可访问性（新题）

#### 目标大纲 vs 现状

| 层级 | 知识点 | 官方来源 | 现状 | 位置 | 备注 |
|---|---|---|---|---|---|
| 主流 | 承诺（course-map §1 摘要）：dangerouslySetInnerHTML ↔ v-html、开放重定向、令牌存储、前端权限边界、aria-*、焦点管理；§2 主责 35，引用题 18 / 01 / 07 | course-map §1；course-map §2 | 未讲 | — | 新题无目录；下列各行按 30 题零散提及定现状 |
| 主流 | XSS 与自动转义：JSX `{}` 与模板 `{{ }}` / v-bind 默认转义，逃生口才危险 | https://legacy.reactjs.org/docs/introducing-jsx.html；https://vuejs.org/guide/best-practices/security.html | 未讲 | — | 新题无目录；30 题 0 处 XSS / 转义 |
| 主流 | `dangerouslySetInnerHTML={{ __html }}`：极端谨慎、不与 children 同用、`__html: string \| TrustedHTML` | https://react.dev/reference/react-dom/components/common；node_modules/@types/react/index.d.ts:2277-2281 | 未讲 | — | 新题无目录；19.3 Trusted Types 透传【尝鲜】 |
| 主流 | `v-html` 只用于可信内容；render 函数 innerHTML 同理；scoped 样式不作用 | https://vuejs.org/api/built-in-directives.html | 未讲 | — | 新题无目录；01 只作引用但 01 也未提 v-html |
| 主流 | 必须渲染富文本：先净化（DOMPurify）；沙箱 iframe；CSP 只是纵深防御 | ③ OWASP https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html；https://vuejs.org/guide/best-practices/security.html | 未讲 | — | 新题无目录；DOMPurify 未安装 |
| 主流 | URL 注入 `javascript:`：React 16.9 起警告；Vue 要求后端净化；前端 allow-list 只放行 http(s) 与站内路径 | ③ https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html；https://vuejs.org/guide/best-practices/security.html | 未讲 | — | 新题无目录；React 19 是否已抛错见 P-35-1 |
| 主流 | 其它注入面：非可信内容作模板、`:style` 点击劫持、动态事件属性；React 无模板注入面 | https://vuejs.org/guide/best-practices/security.html | 未讲 | — | 新题无目录 |
| 主流 | 开放重定向定义与对策（不接受用户输入作目标 / ID 映射 / 校验站内路径 / 外站要确认） | ③ OWASP https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html | 已讲对 | src/topics/18-routing/react/Example.tsx:237-238; src/topics/18-routing/vue/LoginPage.vue:28-29 | 仅一句注释「必须校验它是站内相对路径」，应迁入 35 展开 |
| 主流 | `safeRedirect` 实现（只允许 `/` 开头且不以 `//`、`/\` 开头）；React Router `redirect()` / `redirectDocument()` 接受绝对 URL 会跳外站 | https://reactrouter.com/7.18.4/api/utils/redirect；https://reactrouter.com/7.18.4/api/utils/redirectDocument | 未讲 | — | 18 :239 直接 `navigate(redirect)` 无校验；应新写函数并给单测 |
| 主流 | `target="_blank"` 与 `rel="noopener"`（现代浏览器默认，`noreferrer` 另议） | ③ MDN https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener | 未讲 | — | 新题无目录；30 题 0 处 _blank |
| 主流 | 令牌存储：不放 localStorage / sessionStorage / IndexedDB；会话令牌放 HttpOnly cookie | ③ OWASP https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html；③ HTML5 Security Cheat Sheet | 未讲 | — | 29 :198、28 :94 提到 localStorage 只是惰性初始化 / 外部输入例子，与令牌无关 |
| 主流 | Cookie 属性 `HttpOnly` / `Secure` / `SameSite`（Strict / Lax / None） | ③ MDN https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies | 未讲 | — | 新题无目录；30 题 0 处 Cookie |
| 主流 | CSRF：cookie 自动携带才有；Bearer 头天然免疫但要防 XSS；token / 自定义头；SameSite 只作纵深；Next Server Actions 的 Origin 检查 | ③ OWASP https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html；https://nextjs.org/docs/app/guides/server-actions | 未讲 | — | 新题无目录；→33 |
| 主流 | 令牌取舍结论：httpOnly cookie + CSRF 防护 vs 内存 access token + httpOnly refresh cookie；localStorage 存 JWT 为存量写法 | 同上两条 OWASP 页 | 未讲 | — | 新题无目录；存量写法标【旧写法】 |
| 主流 | 前端权限边界：后端逐请求鉴权、Deny by default；按钮隐藏只影响体验 | ③ OWASP https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html；https://nextjs.org/docs/app/guides/server-actions；course-map §6 F | 讲了但错 | src/topics/18-routing/react/Example.tsx:367-369; src/topics/18-routing/vue/OrderDetailPage.vue:55 | R2-35-4；18 :10-13 RequireAuth / can() 机制本身已讲对，应迁入并改口 |
| 主流 | IDOR：`/orders/:id`、删除 / 编辑接口后端按当前用户过滤；前端只传 ID | ③ OWASP Authorization Cheat Sheet；https://nextjs.org/docs/app/guides/server-actions | 未讲 | — | 新题无目录；→22 / 33 |
| 主流 | 密钥不进前端：`NEXT_PUBLIC_` / `VITE_` 前缀才打进 bundle；`server-only` | https://nextjs.org/docs/app/getting-started/server-and-client-components | 未讲 | — | 新题无目录；30 题 0 处 import.meta.env；VITE_ 规则见 P-35-5 |
| 主流 | a11y 定义与 WCAG 2.1 / WAI-ARIA | https://vuejs.org/guide/best-practices/accessibility.html | 未讲 | — | 新题无目录 |
| 主流 | ARIA 第一规则：原生元素优先；加 role 不带键盘行为；No ARIA is better than bad ARIA | ③ MDN https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA | 缺标签 | src/topics/04-events/react/Example.tsx:74-76 | 04 用 `<div onClick>` 演示冒泡未标「演示用、可交互控件应为 button」 |
| 主流 | 语义化与地标（nav / main / aside / footer …）；`<button type="button">` 而非 div；标题层级 | https://vuejs.org/guide/best-practices/accessibility.html | 未讲 | — | 18 :521 `<nav>`、各题按钮均用 `<button>` 是正确实践但无讲解 |
| 主流 | 表单标签关联 `<label htmlFor>` / `aria-labelledby` / `aria-describedby` / `aria-invalid`；不用 placeholder 当标签 | https://vuejs.org/guide/best-practices/accessibility.html；node_modules/@types/react/index.d.ts:2551-2600 | 缺标签 | src/topics/07-forms/react/Example.tsx:162-174; src/topics/01-component-and-jsx/react/Example.tsx:90 | 07 用 `<label>` 包裹（隐式关联）正确但未说明；07 :172 `placeholder="必填"` 作提示；01 只讲 for → htmlFor 改名 |
| 主流 | `useId` 生成 htmlFor / aria-describedby 的 id；不能作 list key；SSR 一致 | https://react.dev/reference/react/useId；facts-versions.md A | 未讲 | — | 主责 07，35 引用；30 题 0 处 useId |
| 主流 | 动态状态类 ARIA：`aria-live` / `aria-expanded` / `aria-current` / `aria-hidden`（不用于可聚焦元素） | ③ MDN ARIA；https://vuejs.org/guide/best-practices/accessibility.html；facts-versions.md C | 缺标签 | src/topics/02-props/react/Example.tsx:184-188; src/topics/02-props/vue/Example.vue:91 | 02 演示 aria-label 透传（已讲对，大纲未列）；aria-live 等 0 处；NavLink 默认 aria-current 见 18 |
| 主流 | 键盘可达：Tab / Shift+Tab / 方向键；roving tabindex；不用正数 tabindex；焦点可见 | ③ W3C https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/ | 未讲 | — | 01 :8 仅提 tabindex → tabIndex 改名；19 :50 提到「UI 禁用可能被键盘提交绕过」 |
| 主流 | 焦点管理——路由切换后把焦点移到主内容 / 标题；skip link | https://vuejs.org/guide/best-practices/accessibility.html | 未讲 | — | 18 全部文件 0 处 focus；→18 引用 |
| 主流 | 焦点管理——模态框：`role="dialog"` + `aria-modal` + `aria-labelledby`、焦点陷阱、Esc、关闭回焦 | ③ W3C https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ | 未讲 | — | 30 题无任何弹窗；原生 `<dialog>` 见 P-35-3 |
| 主流 | DOM ref `focus()` 机制（大纲未列） | https://react.dev/learn/manipulating-the-dom-with-refs | 已讲对 | src/topics/12-dom-ref/react/Example.tsx:52; src/topics/12-dom-ref/vue/Example.vue:48 | 大纲未列；35 引用 12 讲「怎么移」、本题讲「何时移」 |
| 主流 | `autoFocus` 的坑（jsx-a11y no-autofocus）；只在对话框 / 搜索页用 | https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/no-autofocus.md | 未讲 | — | 30 题 0 处 autoFocus；React 实现见 P-35-2 |
| 主流 | 工具：eslint-plugin-jsx-a11y（flat config）、axe / Lighthouse / WAVE；Vue 侧 eslint-plugin-vuejs-accessibility | https://github.com/jsx-eslint/eslint-plugin-jsx-a11y；https://vuejs.org/guide/best-practices/accessibility.html | 未讲 | — | 未安装（package.json 无 jsx-a11y）；Vue 插件出处见 P-35-4 |
| 主流 | 视觉隐藏 `.visually-hidden` vs `aria-hidden="true"` 用途相反；skip link 放页首 | https://vuejs.org/guide/best-practices/accessibility.html | 未讲 | — | 新题无目录 |
| 旧写法 | localStorage 存 JWT、`document.cookie` 读 token、`javascript:` 链接、`<div onClick>`、手写 `rel="noopener"` | 上述 OWASP / MDN / React 16.9 | 未讲 | — | 新题无目录 |
| 主流 | 大纲未列：防护分层「UI 禁用可被绕过，逻辑层守卫兜底」 | — | 已讲对 | src/topics/19-async-submit/react/Example.tsx:50-52; src/topics/19-async-submit/vue/Example.vue:45 | 大纲未列；与「前端权限只影响体验」同一思路，35 可引用 |
| 主流 | 大纲未列：URL / JSON / localStorage 等外部输入必须收窄（类型守卫），URL 是用户可改的输入 | — | 已讲对 | src/topics/28-react-typescript-basics/react/Example.tsx:94; src/topics/18-routing/react/Example.tsx:266-270; src/topics/18-routing/vue/LoginPage.vue:18-21 | 大纲未列；输入校验思路，35 引用 |

#### 面试 5 问

1. React / Vue 怎么防 XSS，`dangerouslySetInnerHTML` 和 `v-html` 什么时候能用？（追问：必须渲染富文本怎么办——DOMPurify / 沙箱 iframe / CSP；`href` 里的 `javascript:` React 会怎样）
2. 什么是开放重定向，登录后 `?returnTo=` 怎么写才安全？（追问：为什么 `//evil.com` 也要拦；React Router 的 `redirect()` 为什么能跳外站；`throw redirect` 与 `navigate` 的区别）
3. token 该放 localStorage 还是 cookie？（追问：各自对应 XSS / CSRF 哪个风险；`HttpOnly` / `SameSite` 各解决什么；Bearer 头为什么天然免疫 CSRF）
4. 前端隐藏按钮算不算权限控制？（追问：鉴权应在哪一层做、每个请求都要查吗；`/orders/:id` 的 IDOR 怎么防；RequireAuth 守卫和后端鉴权各自负责什么）
5. 一个自定义弹窗 / 表单要做到可访问需要什么？（追问：`role="dialog"` + `aria-modal` + 焦点陷阱与焦点回归；`label` 怎么关联、`useId` 为什么必要；路由切换后焦点去哪；`autoFocus` 有什么坑；为什么优先原生元素）

#### 生产写法要点

- 富文本一律经 DOMPurify 之类净化后再 `dangerouslySetInnerHTML` / `v-html`，并在代码注释标明来源可信级别；用户 URL 只放行 `http(s):` 与站内相对路径。
- `safeRedirect` 落地为函数并有单测（`/x` 通过；`//evil`、`/\evil`、`https://evil` 回退）；登录后跳转只用它。
- 会话令牌：`HttpOnly + Secure + SameSite=Lax` cookie + CSRF token 或自定义头；如必须用 Bearer，token 只留在内存，刷新走 httpOnly refresh cookie；不写 localStorage。
- 权限：前端只做 UX 级隐藏 / 禁用；所有变更接口后端按当前用户校验对象归属；演示里的"按钮不渲染"必须标「演示简化，不是安全边界」。
- a11y 最低线：原生元素优先；表单全部 `label` + `useId`；请求结果 / 错误用 `aria-live` 播报；对话框用 `role="dialog"` + 焦点陷阱 + 关闭回焦；路由切换把焦点移到标题；引入 `eslint-plugin-jsx-a11y` 并跑一次 axe / Lighthouse。
- 密钥只在服务端；Vite 下只暴露必要的 `VITE_` 变量。

#### Vue 对照

| React | Vue | 来源 | 说明（无对应物时写原因） |
|---|---|---|---|
| JSX 自动转义 `{userText}` | `{{ userText }}` / `v-bind` 自动转义 | https://vuejs.org/guide/best-practices/security.html（2026-09-17） | 两边默认安全，逃生口才危险 |
| `dangerouslySetInnerHTML={{ __html }}` | `v-html` / render 函数 `innerHTML` | https://vuejs.org/api/built-in-directives.html（2026-09-17） | 官方警告措辞几乎一致；Vue 额外提示 scoped 样式不生效 |
| `href="javascript:"` 警告（16.9） | 官方要求后端净化 URL，`:href` 不做自动拦截 | https://vuejs.org/guide/best-practices/security.html（2026-09-17） | Vue 无运行时警告 |
| 无（React 不支持字符串模板） | Rule No.1：不用非可信内容作模板 | 同上 | React 没有运行时模板编译，故无此注入面 |
| `throw redirect(safeRedirect(to))`（loader / action） | 守卫返回 `{ path: safeRedirect(to) }` | facts-versions D（守卫返回值） | 都需要自己校验目标 |
| `<label htmlFor={id}>` + `useId()` | `<label :for="id">` + `useId()`（3.5） | `node_modules/@vue/runtime-core/dist/runtime-core.d.ts:1565` | Vue 3.5 也有 `useId`，同为 SSR 稳定 id |
| `useEffect(() => ref.current?.focus(), [location])` | `watch(() => route.path, () => el.value.focus())` | https://vuejs.org/guide/best-practices/accessibility.html（2026-09-17） | 同一模式，Vue 官方页直接给出代码 |
| `eslint-plugin-jsx-a11y` | `eslint-plugin-vuejs-accessibility`（出处待核实） | https://github.com/jsx-eslint/eslint-plugin-jsx-a11y（2026-09-17） | Vue 官方 a11y 页未列该插件 |

#### 缺失问题表

| 编号 | 级别 | 类型 | 标签 | 要点 | 位置 | 原文片段 | 说明 | 依据 | 建议落点 |
|---|---|---|---|---|---|---|---|---|---|
| R2-35-1 | 严重 | 未讲 | 安全a11y | XSS 自动转义、dangerouslySetInnerHTML ↔ v-html、净化 / 沙箱 / CSP | — | — | 应新写：摘要第一项；30 题 0 处 XSS / v-html / dangerouslySetInnerHTML / innerHTML；01 的 v-html 对照也要补 | 新题无目录；https://react.dev/reference/react-dom/components/common（逐字「This should be used with extreme caution!」）；https://vuejs.org/api/built-in-directives.html（逐字「never on user-provided content」） | 二、核心概念 |
| R2-35-2 | 严重 | 未讲 | 安全a11y | 开放重定向：safeRedirect 实现 + `redirect()` 接受绝对 URL 会整页跳外站 | — | — | 应迁入：18 :237-239 与 LoginPage.vue:28-29 只有注释；在 35 实现函数 + 单测（`/x` 通过；`//evil`、`/\evil`、`https://evil` 回退），18 改为引用 | 新题无目录；③ OWASP Unvalidated Redirects Cheat Sheet（逐字定义）；https://reactrouter.com/7.18.4/api/utils/redirect（逐字「the application should validate any user-supplied inputs to redirects」） | 二、核心概念 |
| R2-35-3 | 严重 | 未讲 | 安全a11y | 令牌存储、Cookie 属性、CSRF 与取舍结论 | — | — | 应新写；localStorage 存 JWT 标【旧写法】；CSRF 的框架级例子指向 33 | 新题无目录；③ OWASP Session Management Cheat Sheet（逐字「Do not store authentication tokens, session IDs, JWTs, refresh tokens, or any credential in localStorage or sessionStorage」）；③ MDN Cookies（逐字 HttpOnly 句） | 二、核心概念 |
| R2-35-4 | 严重 | 讲错 | 安全a11y | 前端权限边界：18 题「不渲染比 disabled 更安全、F12 翻不出来」 | src/topics/18-routing/react/Example.tsx:369; src/topics/18-routing/vue/OrderDetailPage.vue:55 | 比 disabled 更安全 | 应迁入并改口：前端只做 UX 级隐藏 / 禁用，后端逐请求鉴权 + IDOR 对象归属校验；18 的 RequireAuth / can() 机制保留并指向 35 | ③ OWASP Authorization Cheat Sheet（逐字「Developers must never rely on client-side access control checks」）；https://nextjs.org/docs/app/guides/server-actions（逐字「Render-time gating … is not a security boundary」）；course-map §6 F | 二、核心概念 |
| R2-35-5 | 严重 | 未讲 | 安全a11y | aria-*：ARIA 第一规则、地标、label 关联 + useId、aria-live / aria-invalid / aria-hidden | — | — | 应新写；02 :184-188 aria-label 透传、07 label 包裹只能作引用；useId 主责 07 但 07 也未讲（→07 补） | 新题无目录；③ MDN ARIA（逐字「No ARIA is better than bad ARIA」）；https://react.dev/reference/react/useId（逐字「generating unique IDs that can be passed to accessibility attributes」） | 二、核心概念 |
| R2-35-6 | 严重 | 未讲 | 安全a11y | 焦点管理：路由切换移焦、模态框焦点陷阱与回焦、键盘可达、autoFocus 坑 | — | — | 应新写；12 :52 只讲 `ref.current?.focus()` 机制（引用）；18 路由切换后无任何焦点处理 | 新题无目录；③ W3C APG dialog-modal（逐字「When a dialog closes, focus returns to the element that invoked the dialog」）；https://vuejs.org/guide/best-practices/accessibility.html（逐字 `watch(() => route.path, …)` 示例） | 二、核心概念 |
| R2-35-7 | 概念 | 未讲 | 安全a11y | 加分点：`javascript:` URL 注入、其它注入面、noopener、密钥不进前端、IDOR | — | — | 应新写（主流加分点）；React 19 对 `javascript:` 是否已抛错待核实 | 新题无目录；③ React 16.9 博客（逐字「will log a warning」）；https://vuejs.org/guide/best-practices/security.html；③ MDN noopener | 五、常见追问与回答要点 |
| R2-35-8 | 概念 | 未讲 | 测试 | 工具与验证：eslint-plugin-jsx-a11y、axe / Lighthouse；safeRedirect 单测 | — | — | 应新写；jsx-a11y 未安装；测试落点 34 | 新题无目录；https://github.com/jsx-eslint/eslint-plugin-jsx-a11y（逐字「Static AST checker for accessibility rules on JSX elements」） | 七、生产环境注意 |
| R2-35-9 | 小问题 | 缺标签 | 安全a11y | 现有题里的 a11y 演示未标注：04 `<div onClick>` 冒泡演示、07 placeholder 作提示、01 只讲属性改名 | src/topics/04-events/react/Example.tsx:76; src/topics/07-forms/react/Example.tsx:172; src/topics/01-component-and-jsx/react/Example.tsx:90 | onClick={handleCardClick} | 加一句「演示用；可交互控件用 button、标签用 label + htmlFor」并指向 35 | https://vuejs.org/guide/best-practices/accessibility.html（逐字「Avoid using placeholders as they can confuse many users」）；③ MDN ARIA 第一规则 | 六、易错点 |
| R2-35-10 | 小问题 | 措辞 | 交叉引用 | 18 / 19 / 28 里的安全相关句应指向 35 | src/topics/18-routing/react/Example.tsx:237; src/topics/19-async-submit/react/Example.tsx:50; src/topics/28-react-typescript-basics/react/Example.tsx:94 | 安全提示（面试加分项） | 新题落地后补「见 35 题」；18 :369 权限句改口后同样指向 35 | course-map §6 I | 参考 |

#### 学习者测试

| # | 面试问题 | 能否答上 | 依据位置 | 缺什么 |
|---|---|---|---|---|
| 1 | React / Vue 怎么防 XSS，dangerouslySetInnerHTML 和 v-html 什么时候能用？（追问：富文本怎么办；href 里的 javascript: React 会怎样） | 不能 | — | 30 题 0 处 XSS / v-html / dangerouslySetInnerHTML / DOMPurify / CSP |
| 2 | 什么是开放重定向，登录后 ?returnTo= 怎么写才安全？（追问：为什么 //evil.com 也要拦；redirect() 为什么能跳外站；throw redirect 与 navigate 的区别） | 部分 | src/topics/18-routing/react/Example.tsx:237-239 | 只知道「要校验站内相对路径」；`//` 与 `/\` 为何要拦、redirect() 跳外站、实现代码全无 |
| 3 | token 该放 localStorage 还是 cookie？（追问：各对应 XSS / CSRF 哪个风险；HttpOnly / SameSite；Bearer 头为何免疫 CSRF） | 不能 | — | 30 题 0 处 token / Cookie / HttpOnly / SameSite / CSRF |
| 4 | 前端隐藏按钮算不算权限控制？（追问：鉴权在哪一层、每个请求都查吗；/orders/:id 的 IDOR；RequireAuth 与后端鉴权各负责什么） | 不能 | src/topics/18-routing/react/Example.tsx:367-369; src/topics/19-async-submit/react/Example.tsx:50-52 | 18 给出相反结论「更安全」；后端逐请求鉴权、IDOR 全无；19 的「UI 禁用可被绕过」只在防重复语境 |
| 5 | 一个自定义弹窗 / 表单要做到可访问需要什么？（追问：role=dialog + aria-modal + 焦点陷阱与回焦；label 怎么关联、useId 为何必要；路由切换后焦点去哪；autoFocus 的坑；为何优先原生元素） | 不能 | src/topics/12-dom-ref/react/Example.tsx:52; src/topics/02-props/react/Example.tsx:184-188; src/topics/07-forms/react/Example.tsx:162-174 | 只有 ref.focus() 机制、aria-label 透传、label 包裹；role=dialog、焦点陷阱、useId、路由移焦、autoFocus、原生优先全无 |

## 2. 缺失汇总（跨题）

统计：严重 54 / 概念 228 / 生产 32 / 小问题 57（共 371 条；已产出对照的题 35/35）。定级见 §0。

| 题 | 严重 | 概念 | 生产 | 小问题 |
|---|---|---|---|---|
| 01 组件与 JSX | 3 | 6 | 1 | 1 |
| 02 Props | 1 | 8 | 1 | 2 |
| 03 State 与 useState | 0 | 8 | 0 | 2 |
| 04 事件处理 | 1 | 8 | 1 | 1 |
| 05 条件渲染 | 1 | 7 | 1 | 1 |
| 06 列表渲染与 key | 0 | 7 | 1 | 2 |
| 07 表单与受控组件 | 1 | 6 | 0 | 1 |
| 08 父子组件通信 | 0 | 8 | 1 | 2 |
| 09 派生状态 | 0 | 8 | 0 | 2 |
| 10 useEffect 与生命周期 | 0 | 7 | 2 | 2 |
| 11 API 请求状态 | 0 | 6 | 3 | 2 |
| 12 useRef 与 DOM | 0 | 8 | 1 | 2 |
| 13 children 与组件组合 | 1 | 8 | 1 | 1 |
| 14 自定义 Hook | 1 | 5 | 2 | 3 |
| 15 Context 跨层传值 | 1 | 6 | 1 | 2 |
| 16 全局状态（Zustand） | 0 | 9 | 1 | 2 |
| 17 useMemo 与 useCallback | 0 | 8 | 1 | 1 |
| 18 路由（React Router） | 5 | 5 | 1 | 1 |
| 19 异步提交与防重复 | 0 | 5 | 2 | 1 |
| 20 错误边界 | 1 | 4 | 1 | 2 |
| 21 不可变数据更新 | 0 | 9 | 1 | 1 |
| 22 综合：订单管理页 | 0 | 8 | 3 | 1 |
| 23 渲染模型与 state 快照 | 0 | 7 | 1 | 2 |
| 24 State batching 与函数式更新 | 0 | 9 | 1 | 2 |
| 25 状态提升与 state 归属 | 0 | 6 | 0 | 2 |
| 26 过期闭包（stale closure） | 0 | 6 | 1 | 4 |
| 27 异步竞态、取消与过期响应 | 0 | 8 | 2 | 1 |
| 28 React + TypeScript 基础 | 4 | 7 | 0 | 1 |
| 29 useReducer 与判别联合 Action | 0 | 8 | 0 | 3 |
| 30 TanStack Query 与服务端状态 | 0 | 10 | 1 | 1 |
| 31 表单与 Actions（新题） | 5 | 2 | 0 | 1 |
| 32 并发与异步 UI（新题） | 6 | 4 | 0 | 1 |
| 33 服务端与 RSC 概念课（新题） | 8 | 3 | 0 | 1 |
| 34 测试（新题） | 9 | 2 | 0 | 1 |
| 35 安全与可访问性（新题） | 6 | 2 | 0 | 2 |

### 2.1 严重（54）

#### Router（3）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-18-3 | 18 | 未讲 | 已定主线 Data 模式的启动代码与 loader 守卫一处都没有 | — | 二、核心概念 |
| R2-18-4 | 18 | 讲错 | 「React 没有这个实例复用坑」 | src/topics/18-routing/react/Example.tsx:337; src/topics/18-routing/react/Example.tsx:335-336; src/topics/18-routing/vue/OrderDetailPage.vue:20 | 六、易错点 |
| R2-34-7 | 34 | 未讲 | 测路由：`createRoutesStub`（Data / Framework 模式复用组件）、`createMemoryRouter` + `RouterProvider`（整树）、`MemoryRouter`（仅声明式） | — | 二、核心概念 + 十、动手练习 |

#### Actions（6）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-31-1 | 31 | 缺标签 | Action 定义与 `startTransition(async)` 语义（立即同步调用、`isPending` 范围、`await` 后再包一层、不能控制文本输入）全课程仅 19 题一句名词 | src/topics/19-async-submit/react/Example.tsx:10-11 | 二、核心概念 |
| R2-31-2 | 31 | 缺标签 | `<form action={fn}>` 只有 07 一句「延伸」且声明「本项目没有实现」：缺 Transition 语义、自动 reset 非受控 / `requestFormReset`、POST 恒定、`formAction` 覆盖 | src/topics/07-forms/react/Example.tsx:19-21; :244-246; src/topics/07-forms/vue/Example.vue:20-22 | 二、核心概念 |
| R2-31-3 | 31 | 缺标签 | `useActionState`：三元组 `[state, formAction, isPending]`、`fn(prev, formData)`、串行排队（天然防重复，对照 19 手写）、错误 return 进 state、`initialState` 首次后忽略 —— 全部未讲 | src/topics/07-forms/react/Example.tsx:20; :246; src/topics/19-async-submit/react/Example.tsx:10 | 二、核心概念 |
| R2-31-4 | 31 | 讲错 | 错误进 Error Boundary：20 题把「异步代码 / Promise」一律列为不能捕获，与 19 的 `formAction` / `<form action>` / `startTransition` 抛错进最近边界相反；可恢复错误应 return state | src/topics/20-error-handling/react/Example.tsx:9; src/topics/20-error-handling/react/ErrorBoundary.tsx:15 | 二、核心概念 |
| R2-31-5 | 31 | 未讲 | `useFormStatus`（react-dom；须在 `<form>` 的子组件；`FormStatusPending \| FormStatusNotPending`）与 `useOptimistic`（set 须在 Action 内、自动回滚、失败需另行提示）全课程 0 处 | — | 二、核心概念 |
| R2-33-5 | 33 | 未讲 | `'use server'` Server Functions 定义、命名史、三种调用（`<form action>` / `useActionState` / `startTransition`） | — | 二、核心概念 |

#### 并发（6）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-32-1 | 32 | 缺标签 | 「并发渲染」在 10 / 26 / 29 只作一句顺带（可能重跑或丢弃渲染），无主责题解释 `createRoot` 可中断渲染、为何渲染必须纯 | src/topics/10-effects-and-lifecycle/react/Example.tsx:217; src/topics/26-stale-closures/react/Example.tsx:149; src/topics/29-use-reducer-and-action-types/react/Example.tsx:79 | 二、核心概念 |
| R2-32-2 | 32 | 缺标签 | `useTransition` / `startTransition` 仅 19 题一句名词：无 `[isPending, startTransition]`、不能控制文本输入、无 set 权用 `useDeferredValue`、19 async Action、Transition 内错误进边界（20 题 :9 反而写异步不能捕获） | src/topics/19-async-submit/react/Example.tsx:10-11 | 二、核心概念 |
| R2-32-3 | 32 | 未讲 | `<Suspense>` 全部未讲：fallback 触发条件（仅 Suspense 兼容数据源，effect fetch 不触发）、揭示规则、Transition 下不退回 fallback、`key` 重置 | — | 二、核心概念 |
| R2-32-4 | 32 | 未讲 | `useDeferredValue` 全部未讲：旧值先渲染、无固定延迟、vs 防抖节流、传原始值、`initialValue`（19）【较新】 | — | 二、核心概念 |
| R2-32-5 | 32 | 未讲 | `use(promise)` 未讲：条件调用、拒绝进边界、不可 `try / catch`、promise 必须缓存（来源 loader / Query / 模块缓存）；`use(Context)` 一句→15 | — | 二、核心概念 |
| R2-32-6 | 32 | 未讲 | `lazy` 未讲：默认导出、缓存、勿在组件内声明、配 Suspense + 边界；路由级 `lazy` 属性与 `RouterProvider` 默认 Transition 导航（→18） | — | 二、核心概念 |

#### 散点Hook（2）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-07-1 | 07 | 未讲 | `useId` 零覆盖：label / aria 关联、为何不用计数器（SSR hydration 一致）、后缀派生多 id、禁作 key / cache key、`identifierPrefix`、19.2 前缀 `_r_`【较新】 | — | 二、核心概念 |
| R2-14-1 | 14 | 讲错 | 【待主线判定】文件头把 `useState + useEffect` 讲成订阅外部系统的「标准组合」，官方在该场景明确「删除 Effect 改用 useSyncExternalStore」；本题主责的 `useSyncExternalStore` 全目录 0 次（定位 / 两类场景 / getSnapshot 与 subscribe 稳定性 / tearing / 迁移示范 / 生态引用） | src/topics/14-composable-and-custom-hook/react/Example.tsx:6; src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:18 | 二、核心概念；八、旧写法对照 |

#### 性能（1）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-15-1 | 15 | 讲错 | 把「消费组件配合 React.memo」列为 Context 性能优化的面试标准答案 | src/topics/15-context/react/Example.tsx:133-134 | 二、核心概念 / 六、易错点 |

#### 测试（7）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-34-1 | 34 | 未讲 | 测试基础设施与配置：阶段 1 安装 vitest 4.1.11 + @testing-library/react 16.3.3 + @testing-library/dom 10.x + @testing-library/user-event 14.6.7 + @testing-library/jest-dom 6.10.0 + jsdom 30 或 happy-dom 20 + @testing-library/vue 8.1.0；`vitest.config.ts`（`environment` / `globals` 或 `afterEach(cleanup)` / `setupFiles`）、`npm test` = `vitest run` 并接进 `check` | — | 二、核心概念 + 七、生产环境注意 |
| R2-34-2 | 34 | 未讲 | Vitest 基本 API（`vi.fn` / `spyOn` / `mock` hoist / `stubGlobal`、clear vs reset vs restore）与 fake timers 全套 | — | 二、核心概念 |
| R2-34-3 | 34 | 未讲 | RTL 理念（Guiding Principle）、查询三族、优先级 `getByRole` 优先、`getByTestId` 兜底、jest-dom 断言 | — | 二、核心概念 |
| R2-34-4 | 34 | 未讲 | `render` 选项与自定义 `render`（wrapper 注入 Router / QueryClient / Context）；`renderHook` 测 14 题 `useDebouncedValue` | — | 二、核心概念 + 十、动手练习 |
| R2-34-5 | 34 | 未讲 | 异步：`findBy*` / `waitFor`（只放断言）/ `waitForElementToBeRemoved`；`userEvent.setup()` vs `fireEvent`；fake timers 下 `advanceTimers` | — | 二、核心概念 |
| R2-34-6 | 34 | 未讲 | `act`：定义、RTL 已包裹、何时手写、`await act(async …)`、19 起从 `react` 导入、`IS_REACT_ACT_ENVIRONMENT` | — | 二、核心概念 + 八、旧写法对照 |
| R2-34-8 | 34 | 未讲 | 测 TanStack Query（每测试新建 `QueryClient`、`retry: false`、`gcTime`）、测异步请求（`vi.mock` 替换 mockApi、三态 + 竞态）、测 Error Boundary（静音 `console.error`） | — | 二、核心概念 |

#### 安全a11y（8）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-18-5 | 18 | 讲错 | 「按钮不渲染比 disabled 更安全、F12 里都翻不出来」 | src/topics/18-routing/react/Example.tsx:369; src/topics/18-routing/vue/OrderDetailPage.vue:55 | 七、生产环境注意 |
| R2-33-6 | 33 | 未讲 | Server Function 安全：参数不可信、鉴权在函数内、"Render-time gating … is not a security boundary"；`server-only` / `NEXT_PUBLIC_` 防泄漏 | — | 二、核心概念 + 七、生产环境注意 |
| R2-35-1 | 35 | 未讲 | XSS 自动转义、dangerouslySetInnerHTML ↔ v-html、净化 / 沙箱 / CSP | — | 二、核心概念 |
| R2-35-2 | 35 | 未讲 | 开放重定向：safeRedirect 实现 + `redirect()` 接受绝对 URL 会整页跳外站 | — | 二、核心概念 |
| R2-35-3 | 35 | 未讲 | 令牌存储、Cookie 属性、CSRF 与取舍结论 | — | 二、核心概念 |
| R2-35-4 | 35 | 讲错 | 前端权限边界：18 题「不渲染比 disabled 更安全、F12 翻不出来」 | src/topics/18-routing/react/Example.tsx:369; src/topics/18-routing/vue/OrderDetailPage.vue:55 | 二、核心概念 |
| R2-35-5 | 35 | 未讲 | aria-*：ARIA 第一规则、地标、label 关联 + useId、aria-live / aria-invalid / aria-hidden | — | 二、核心概念 |
| R2-35-6 | 35 | 未讲 | 焦点管理：路由切换移焦、模态框焦点陷阱与回焦、键盘可达、autoFocus 坑 | — | 二、核心概念 |

#### 服务端（6）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-33-1 | 33 | 未讲 | 渲染模式总表（CSR / SSR / SSG / ISR / RSC 三维度）+ hydration 定义、mismatch 来源与处理 | — | 二、核心概念 |
| R2-33-2 | 33 | 未讲 | `react-dom/server` 流式 API 与 `renderToString` Legacy；`react-dom/static` 的 `prerender`（SSG） | — | 二、核心概念 + 十、动手练习 |
| R2-33-3 | 33 | 未讲 | RSC 定义、RSC ≠ SSR、限制（无 state / effect）、async 组件、收益、稳定性与「React 不自带框架」 | — | 二、核心概念 |
| R2-33-4 | 33 | 未讲 | `'use client'` 模块图边界、没有 Server Component 指令、组合规则（children 传递 / Provider 包 client）、序列化边界 | — | 二、核心概念 + 六、易错点 |
| R2-33-7 | 33 | 未讲 | Next App Router 流程：RSC Payload、数据进树（Server 里 `await`、promise + `use()`）、变更后 `revalidatePath` / `redirect` | — | 二、核心概念 |
| R2-33-8 | 33 | 未讲 | React 19 文档元数据：`<title>` / `<meta>` / `<link>` hoist 规则、`<title>` 单一字符串、`precedence`、`preinit` 家族 | — | 二、核心概念 + 十、动手练习 |

#### Vue现行写法（1）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-34-9 | 34 | 未讲 | Vue 侧：Vitest 同为官方推荐；组件测试官方推荐 `@vue/test-utils`，`@testing-library/vue` 对 Suspense 异步组件「should be used with caution」；composable 用 `withSetup` 宿主；`createMemoryHistory` 测路由；vue-query 同样 `retry: false` | — | 三、Vue 对照 |

#### TS19（3）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-28-1 | 28 | 未讲 | `useRef` 必须传参、统一 `RefObject<T>`、`MutableRefObject` 弃用【旧写法】、ref 回调只能返回清理函数；Vue 对照 `useTemplateRef<T>` | — | 二、核心概念 + 八、旧写法对照 |
| R2-28-2 | 28 | 未讲 | 全局 `JSX` 命名空间移除 → `React.JSX`（增强要包 `declare module "react"`）；`ReactElement['props']` 默认 unknown；`types-react-codemod preset-19` | — | 二、核心概念 + 八、旧写法对照 |
| R2-28-3 | 28 | 未讲 | ref-as-prop 类型 `ref?: Ref<HTMLInputElement>`（19 起不需 forwardRef）+ `ComponentProps` / `ComponentPropsWithoutRef` / `ComponentPropsWithRef` 三者取舍与 `Omit` 覆写 | — | 二、核心概念 |

#### 绝对化（4）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-05-1 | 05 | 讲错 | 「条件渲染（三元 / &&）= v-if，会真正卸载 / 挂载节点」只在分支类型不同或切到 null 时成立；三元两分支是同类型组件时 React 按「树中位置」复用实例、state 保留，Vue 的 v-if 则总是销毁重建；要重置得加 key（06） | src/topics/05-conditional-rendering/react/Example.tsx:135; src/topics/05-conditional-rendering/vue/Example.vue:135 | 四、关键区别 |
| R2-18-1 | 18 | 讲错 | 「根本没有全局导航钩子」「不存在，也不会有」「导航不是可被拦截的独立事件」 | src/topics/18-routing/react/Example.tsx:31; src/topics/18-routing/react/Example.tsx:145-147; src/topics/18-routing/vue/router.ts:18; src/topics/18-routing/vue/Example.vue:32 | 二、核心概念 |
| R2-18-2 | 18 | 讲错 | 「路由表是组件树 vs 配置」被讲成框架差异 | src/topics/18-routing/react/Example.tsx:30; src/topics/18-routing/react/Example.tsx:5; src/topics/18-routing/react/Example.tsx:24-27; src/topics/18-routing/vue/router.ts:4-8 | 四、关键区别 |
| R2-20-1 | 20 | 讲错 | 「不能捕获异步代码」漏掉 React 19 例外：`startTransition` / Action 内抛错或拒绝的 Promise 会进边界；也未讲 `use(promise)` 拒绝、`lazy` 失败可被捕获（→31 / 32） | src/topics/20-error-handling/react/Example.tsx:9; src/topics/20-error-handling/react/ErrorBoundary.tsx:15; src/topics/20-error-handling/vue/Example.vue:10 | 二、核心概念 |

#### 其它（7）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-01-1 | 01 | 未讲 | 组件名必须大写开头，小写会被当作 HTML 标签 | — | 二、核心概念 |
| R2-01-2 | 01 | 未讲 | 绝不在组件内部定义组件：每次渲染产生新函数 → 同位置视为不同组件 → state 重置且慢 | — | 六、易错点 |
| R2-01-3 | 01 | 未讲 | 组件必须是纯函数：同输入同输出、不改渲染前已存在的对象；局部突变允许；副作用放事件处理器 | — | 二、核心概念 |
| R2-02-1 | 02 | 讲错 | 「React 不警告、纯靠约定」讲反：开发构建下 jsx 运行时对 element.props 调用 `Object.freeze`，ESM 严格模式里 `props.amount = 0` 直接抛 TypeError；生产构建不冻结、赋值静默无效且不重渲染 | src/topics/02-props/react/Example.tsx:28; src/topics/02-props/react/Example.tsx:65; src/topics/02-props/vue/OrderCard.vue:27 | 四、关键区别 |
| R2-04-1 | 04 | 未讲 | 合成事件是委托在 root 容器上的（React 17 起，之前是 document）；`e.nativeEvent` 可拿原生事件；`e.currentTarget` 与 `nativeEvent.currentTarget` 可能不同 | — | 二、核心概念 |
| R2-13-1 | 13 | 未讲 | 组合的两大理由全无：① 减少 prop drilling——"Extract components and pass JSX as children to them"，先试组合再考虑 context（指向 15）；② 性能——wrapper 自己 setState 时 children 元素引用不变、不重渲染（指向 17）；顺带「`{...props}` 用得多说明该拆组件并传 children」（02） | — | 二、核心概念 |
| R2-28-4 | 28 | 未讲 | 泛型组件：`function List<T>({ items, renderItem }: ListProps<T>)`、`.tsx` 箭头函数 `<T,>` 消歧；Vue `generic="T"` | — | 二、核心概念 + 三、Vue 对照 |

### 2.2 概念（228）

#### Router（7）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-11-4 | 11 | 未讲 | 方案 B / C 最小形未给：useQuery 返回字段（status / fetchStatus / isPending / isLoading）、默认 retry 3 次退避、loader + useLoaderData + useNavigation().state、流式 promise + Await、依赖查询与瀑布 | — | 二、核心概念 |
| R2-18-6 | 18 | 讲错 | loader 守卫「好处是不会先闪一下受保护页面」 | src/topics/18-routing/react/Example.tsx:154; src/topics/18-routing/react/Example.tsx:151-155 | 四、关键区别 |
| R2-18-7 | 18 | 讲错 | 「NavLink 高亮逻辑写在 JS 里」漏掉默认 active 类与 aria-current | src/topics/18-routing/react/Example.tsx:120; src/topics/18-routing/react/Example.tsx:9; src/topics/18-routing/vue/Example.vue:50 | 三、Vue 对照 |
| R2-18-8 | 18 | 未讲 | Data 模式加分点整组缺失：errorElement / useRouteError、action + Form + useFetcher、useNavigation、Await 流式、lazy、useBlocker、handle / useMatches、middleware【较新】、父子 loader 并行 | — | 二、核心概念 |
| R2-20-5 | 20 | 未讲 | 路由级边界一句未提：`errorElement` / `ErrorBoundary` + `useRouteError` 接 loader / action / 渲染错误，与组件级边界分工（→18） | — | 五、常见追问与回答要点 |
| R2-22-2 | 22 | 未讲 | 搜索词 / 筛选 / 页码应进 URL query（刷新 / 分享 / 后退可复现）：useSearchParams 函数式更新、切筛选重置 page=1、输入类 replace: true（→ 18） | — | 二、核心概念 |
| R2-27-4 | 27 | 未讲 | 路由 loader 的取消：loader 收到 `request: Request`，导航中断时路由器 abort 其 signal，透传 `request.signal` 即可 | — | 四、关键区别 |

#### Actions（7）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-07-6 | 07 | 缺标签 | React 19 `<form action>` 只作一句「延伸」且说「本项目没有实现」：无【主流】/ 19.0 标签，未讲「在 Transition 中执行、成功后只 reset 非受控字段、受控字段不自动 reset」，指向 19 题而非 31 | src/topics/07-forms/react/Example.tsx:19-21; :244-246; src/topics/07-forms/vue/Example.vue:20-22 | 八、旧写法对照 |
| R2-08-7 | 08 | 未讲 | 【较新】React 19 子组件 `action` prop 可接父组件传下的 async 函数（回调 prop 的异步化） | — | 九、新动向 |
| R2-19-4 | 19 | 缺标签 | Actions 家族只剩一句名词：无【主流】/ 19.0 标签；未讲 `useActionState` 的 `isPending` 与串行排队、`useFormStatus` 须在 `<form>` 子组件、`useOptimistic`、`startTransition(async)` + `isPending`、React 18 只接同步函数【旧写法】；未指向 31 | src/topics/19-async-submit/react/Example.tsx:10-11; src/topics/19-async-submit/vue/Example.vue:11-12 | 二、核心概念 |
| R2-22-4 | 22 | 未讲 | 编辑 / 删除的乐观更新与回滚：TanStack onMutate / onError / onSettled 三段、只用 variables 的轻量版、React 19 useOptimistic（→ 30 / 31） | — | 二、核心概念 |
| R2-29-7 | 29 | 未讲 | React 19 `useActionState` 与 useReducer 的分工未提 | — | 九、新动向 |
| R2-30-5 | 30 | 未讲 | 乐观更新两种写法（onMutate + cancelQueries + 快照回滚 vs 用返回的 variables 直接渲染）及与 React 19 useOptimistic 的对照（→ 31） | — | 七、生产环境注意 |
| R2-31-6 | 31 | 未讲 | 加分点未讲：「暴露 action prop」模式、多 Action 批处理限制、渐进增强 / `permalink` 仅 RSC（→33）、受控输入 + `<form action>` 组合时受控字段不 reset | — | 五、常见追问与回答要点 |

#### 并发（8）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-05-3 | 05 | 未讲 | `<Activity mode="hidden">`（19.2 起稳定导出）隐藏子树保留 state 并卸载 Effect，对应 v-show「保留状态」的需求（主责 32，本题一句）；`hidden` 属性也是替代；19.3 `<ViewTransition>` 一句【尝鲜】；「只能手动控制 display」应放宽 | — | 九、新动向 |
| R2-11-5 | 11 | 未讲 | 方案 D `use(promise)` + Suspense + 错误边界（promise 须缓存、不能 try/catch）、Suspense 看不见 Effect 里的请求、useSuspenseQuery、throwOnError、RSC async/await【尝鲜】 | — | 二、核心概念 |
| R2-19-1 | 19 | 未讲 | state guard 受渲染快照限制：同一渲染内重入（程序化 `requestSubmit` / 循环）读到旧 `submitting`；生产加 `useRef` 锁（改 ref 不触发渲染→12） | — | 六、易错点 |
| R2-24-8 | 24 | 未讲 | Transition 内更新与紧急更新分开批处理未提 | — | 九、新动向 |
| R2-27-8 | 27 | 未讲 | 三层未区分：防抖减少发出的请求数（→ 14）、取消 / 忽略处理已发出的响应、useDeferredValue / useTransition 处理渲染层的过期 UI（→ 32） | — | 五、常见追问与回答要点 |
| R2-30-9 | 30 | 未讲 | Suspense 模式 useSuspenseQuery 一句指向 32（data 必有、不支持 enabled / placeholderData、取消不可用）；throwOnError 把查询错误抛给错误边界（→ 20） | — | 二、核心概念（各一句） |
| R2-32-7 | 32 | 缺标签 | `<Activity>`【较新】只在 18 题一句：无【较新】/ 19.2 标签、无 `mode` 默认 `visible`、无「hidden 时 `display:none` + 销毁 Effects + 保留 state」全貌、无低优先级预渲染、替代 `{show && <X/>}`；「卸载 effect」措辞不准（官方为 destroy Effects，组件不卸载） | src/topics/18-routing/react/Example.tsx:468-469; src/topics/18-routing/vue/SettingsNotificationsPage.vue:23-24 | 二、核心概念 |
| R2-32-8 | 32 | 未讲 | 【尝鲜】未讲：`<ViewTransition>` / `addTransitionType`（19.3 稳定，19.2.8 不导出，仅 canary.d.ts）；19.3 Transitions 独立渲染 | — | 九、新动向 |

#### 散点Hook（11）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-10-3 | 10 | 未讲 | 依赖数组进阶三条未讲：对象 / 函数依赖导致每次 commit 重跑及三种解法；可变值 ref.current 写进依赖无效；不相关的事拆成多个 Effect | — | 二、核心概念 |
| R2-10-4 | 10 | 未讲 | 「不需要 Effect」清单缺链式 setState、初始化应用（模块顶层 / didInit）、通知父组件、订阅外部 store（useSyncExternalStore → 14） | — | 二、核心概念 |
| R2-10-5 | 10 | 未讲 | useLayoutEffect（绘制前、阻塞绘制、量布局后同步重渲染）与 useInsertionEffect 一句都没有 | — | 二、核心概念 |
| R2-12-1 | 12 | 未讲 | `useImperativeHandle`（本题主责）、「不滥用句柄」与 Vue `defineExpose` 对照全缺 | — | 二、核心概念；三、Vue 对照 |
| R2-12-2 | 12 | 未讲 | ref 回调与 React 19 cleanup（本题主责）、不返回则以 null 再调、列表 refs 用 Map、StrictMode 双调、Vue 函数 ref 对照 | — | 二、核心概念；六、易错点 |
| R2-14-4 | 14 | 未讲 | 自定义 Hook 接收事件回调时用 `useEffectEvent`（19.2 起【较新】）包一层再放进 Effect、去掉回调依赖（→ 26） | — | 二、核心概念；五、常见追问 |
| R2-14-5 | 14 | 未讲 | 返回值约定：返回函数建议包 `useCallback`；`useDebugValue` 给共享 Hook 加 DevTools 标签；对象 vs 元组返回 | — | 二、核心概念；七、生产环境注意 |
| R2-15-2 | 15 | 未讲 | `use(Context)` 全部未讲（本题为盲点主责）：签名 `use<T>(usable: Usable<T>): T`、可在条件 / 循环 / early return 后调用、仍须在组件或 Hook 内、Server Components 不支持、19.0 起 | — | 二、核心概念 |
| R2-16-2 | 16 | 未讲 | 底层机制：`useStore` 基于 `useSyncExternalStore`（→14）；vanilla API `getState / setState / subscribe / getInitialState` 组件外读写与测试重置（→34） | — | 二、核心概念 / 五、常见追问与回答要点 |
| R2-26-2 | 26 | 缺标签 | useEffectEvent 无【较新】/「19.2 起」成熟度标签；四条限制缺「不是逃避依赖的工具」与「只能在同一组件 / Hook 内声明」；未说明 lint 需 eslint-plugin-react-hooks ≥ 6（本项目 7.1.1）否则会被塞进依赖；TS 签名与自定义 Hook 里的用法（→ 14）未提 | src/topics/26-stale-closures/react/Example.tsx:15; src/topics/26-stale-closures/react/Example.tsx:479; src/topics/26-stale-closures/react/Example.tsx:488-492 | 二、核心概念；七、生产环境注意 |
| R2-26-4 | 26 | 未讲 | 「可变值不能作依赖」：把 `ref.current` 写进依赖数组不会触发重跑，这条路不通（面试第 4 问主问） | — | 五、常见追问；六、易错点 |

#### 性能（18）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-01-9 | 01 | 未讲 | 新动向缺失：React Compiler 依赖纯性、react-hooks 7.1.1 `recommended` 含 `purity` / `static-components`【较新】；19.3 `<Fragment ref>`、Trusted Types【尝鲜】 | — | 九、新动向 |
| R2-03-7 | 03 | 未讲 | eslint-plugin-react-hooks 7 的 `set-state-in-render` / `immutability` 与 React Compiler 未提 | — | 九、新动向 |
| R2-06-6 | 06 | 未讲 | 九段缺失：千级以上列表虚拟化与 `useMemo` caveat（主责 17）【较新】；React Compiler 对手写 memo 的影响一句；19.3 `<Fragment ref>`【尝鲜】 | — | 九、新动向 |
| R2-08-4 | 08 | 未讲 | 回调 prop 每次渲染都是新函数属正常；只有 memo 子组件 / Hook 依赖才 useCallback | — | 五、常见追问与回答要点 |
| R2-09-3 | 09 | 未讲 | useMemo 判定方法与语义边界：`console.time` 包住、≥1ms 才考虑、CPU throttling、StrictMode 双调导致开发期偏大；React 可能丢弃缓存不能当语义保证；`() => ({})`、不能在循环里调用 | — | 五、常见追问与回答要点 |
| R2-09-4 | 09 | 未讲 | 【较新】React Compiler 自动记忆化后手写 useMemo 的定位与 `preserve-manual-memoization`；让记忆化不必要的五原则——只作一句引用指向 17 | — | 九、新动向 |
| R2-13-11 | 13 | 未讲 | 九段缺失：React Compiler 下组合仍是首选（memo 页原则不变）；eslint-plugin-react-hooks 7.1.1 `recommended` 的 `static-components` 规则禁止渲染期创建组件【较新】 | — | 九、新动向 |
| R2-16-1 | 16 | 未讲 | selector 返回新对象 / 数组每次都重渲染；`useShallow`（`zustand/react/shallow`）浅比较；自定义 equalityFn 需 `createWithEqualityFn`（`zustand/traditional`）；Compiler 不改变订阅粒度 | — | 二、核心概念 / 六、易错点 |
| R2-17-1 | 17 | 未讲 | React DevTools Profiler 用法（本题主责）：录制 → commit → 火焰图 / Ranked；`<Profiler onRender>` 的 actualDuration / baseDuration；19.2 Performance Tracks【较新】；Vue DevTools 对照 | — | 二、核心概念；七、生产环境注意 |
| R2-17-2 | 17 | 未讲 | 列表虚拟化（本题主责）：原理 + `@tanstack/react-virtual`（headless）/ react-window 一句 + Vue 对照库 | — | 二、核心概念；七、生产环境注意 |
| R2-17-3 | 17 | 未讲 | React Compiler（本题主责，【较新】）：自动记忆化原理、对手写记忆化「保留」的态度、本项目不启用理由（方案 A）、`"use memo"` / `"use no memo"` | — | 二、核心概念；九、新动向 |
| R2-17-4 | 17 | 未讲 | lint 规则逐条：`preserve-manual-memoization`（漏依赖阻止编译）、`use-memo`（不放副作用、必须返回值）、`static-components`、`purity`、`immutability`；「linter 不需要安装编译器」；`recommended` 已含 | — | 六、易错点；七、生产环境注意 |
| R2-17-5 | 17 | 未讲 | `memo` / `useMemo`「只是性能优化不是保证」：memo 组件自身 state / context 变化仍重渲染；React 可能丢弃 useMemo 缓存，没有它代码也必须正确 | — | 二、核心概念；五、常见追问 |
| R2-17-6 | 17 | 未讲 | 加分点：减少记忆化需求的五原则（children 传 JSX 等）、判断昂贵的 `console.time` ≥ 1ms 阈值、`useCallback = useMemo(() => fn)` | — | 二、核心概念；五、常见追问 |
| R2-21-5 | 21 | 未讲 | lint `react-hooks/immutability`（recommended 为 error）与 React Compiler 依赖不可变前提 | — | 九、新动向 |
| R2-22-12 | 22 | 未讲 | 搜索输入防抖或 useDeferredValue、筛选切换用 startTransition、大表格虚拟化（→ 14 / 17 / 32） | — | 七、生产环境注意 |
| R2-23-5 | 23 | 未讲 | React Compiler 依赖「纯函数 + 不可变」前提做自动记忆化；lint `purity` / `refs` / `set-state-in-render` / `static-components` | — | 九、新动向 |
| R2-30-7 | 30 | 未讲 | 渲染优化：结构共享保持引用稳定、tracked properties（...rest 解构会关掉）、select 需引用稳定 | — | 五、常见追问与回答要点 |

#### 测试（2）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-34-10 | 34 | 未讲 | 测试分层（Unit / Component / E2E 一句）与 MSW 结论：只提一句不安装，理由是数据源为内存 `src/shared/mockApi`（无 HTTP），接真实 HTTP 后再引入 | — | 二、核心概念 + 七、生产环境注意 |
| R2-35-8 | 35 | 未讲 | 工具与验证：eslint-plugin-jsx-a11y、axe / Lighthouse；safeRedirect 单测 | — | 七、生产环境注意 |

#### 安全a11y（4）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-01-7 | 01 | 未讲 | `dangerouslySetInnerHTML={{ __html }}` ↔ `v-html` 与 XSS 一句，指向 35 | — | 三、Vue 对照 |
| R2-07-5 | 07 | 未讲 | 无 a11y 引用：`<label htmlFor>` / `useId` 关联、错误信息 `aria-describedby`、placeholder 不当 label、提交失败后焦点管理（→35）；课件用隐式 label 包裹但未说明 | — | 七、生产环境注意 |
| R2-22-6 | 22 | 未讲 | 可访问性与安全零提及：table th scope / role="search" / aria-live 播报结果数与错误 / 分页 aria-current / 删除按钮可访问名 / useId 关联 label / 确认删除的焦点管理；后端按当前用户校验订单归属、文本渲染不解析 HTML（→ 35） | — | 七、生产环境注意 |
| R2-35-7 | 35 | 未讲 | 加分点：`javascript:` URL 注入、其它注入面、noopener、密钥不进前端、IDOR | — | 五、常见追问与回答要点 |

#### 服务端（3）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-10-6 | 10 | 未讲 | Effect 只在客户端运行、SSR 不跑；useLayoutEffect 服务端报错；didMount 模式与内容闪烁（→ 33） | — | 七、生产环境注意 |
| R2-16-6 | 16 | 未讲 | `createStore`（vanilla）+ React Context 注入 store：按 props 初始化、SSR / RSC 每请求一个实例；模块级单例跨请求共享的风险（Pinia 文档同样警告） | — | 七、生产环境注意 |
| R2-33-9 | 33 | 未讲 | 19.2 PPR / `cacheSignal` / Next Cache Components【较新】；19.3 `use(browser())`、Server Components 里的 `<Context>`【尝鲜】 | — | 九、新动向 |

#### Vue现行写法（24）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-02-2 | 02 | 讲错 | 「默认值要包一层 withDefaults」已过时：3.5 主线是响应式 props 解构 `const { discount = 0 } = defineProps<Props>()`，`withDefaults` 只是 3.4 及以下的写法；两份 .vue 主线代码仍用 withDefaults，且未提解构 prop 传 composable / watch 要包 getter | src/topics/02-props/react/Example.tsx:17; src/topics/02-props/vue/OrderCard.vue:24; src/topics/02-props/vue/UiButton.vue:26 | 三、Vue 对照 |
| R2-02-12 | 02 | 未讲 | Vue 侧：`useAttrs()` 返回对象非响应式（不能 watch）；多根组件不自动透传并警告，需手动绑 `$attrs` | — | 三、Vue 对照 |
| R2-07-3 | 07 | 缺标签 | `onChange` 只讲「每击键」，未点明 ≈ 原生 `input` 事件且 IME 合成期间也触发；Vue 侧缺 `.lazy` / `.number` / `.trim` 修饰符、IME 期间 `v-model` 不更新、`defineModel()`（3.4 起推荐【较新】）与 3.4 前手写【旧写法】 | src/topics/07-forms/react/Example.tsx:6 | 三、Vue 对照 |
| R2-08-3 | 08 | 未讲 | React 无 v-model：`value + onChange` ↔ `modelValue + update:modelValue` / `defineModel()`（3.4+） | — | 三、Vue 对照 |
| R2-08-6 | 08 | 未讲 | Vue emit 细则未对照：组件事件不冒泡、camelCase 发出 / kebab-case 监听、`defineEmits({ x: p => boolean })` 运行时校验、未声明的 `@x` 落到根元素 | — | 三、Vue 对照 |
| R2-09-6 | 09 | 未讲 | Vue computed 细则未对照：非响应式依赖（`Date.now()`）不更新、可写 computed `{ get, set }`、previous value 参数（3.4+）、getter 无副作用 / 不突变返回值；React 侧纯性要求 | — | 三、Vue 对照 |
| R2-10-9 | 10 | 未讲 | Vue 3.5 `onWatcherCleanup` 与 flush 时机（pre / post / sync ↔ React 以绘制为参照）未讲 | — | 三、Vue 对照 |
| R2-11-8 | 11 | 未讲 | Vue 侧缺官方 `useFetch` composable（watchEffect + toValue）、vue-router 导航前 / 后取数 ↔ loader、`<Suspense>`（async setup）↔ use + Suspense、vue-router 5 数据加载器【尝鲜】 | — | 三、Vue 对照 |
| R2-12-6 | 12 | 缺标签 | Vue 侧代码仍用同名 `ref(null)` + `ref="inputEl"`，`useTemplateRef`（3.5）只在括号里一句、未标现行 / 旧写法 | src/topics/12-dom-ref/vue/Example.vue:26 | 三、Vue 对照；八、旧写法对照 |
| R2-14-8 | 14 | 未讲 | composable 入参 `MaybeRefOrGetter` + `toValue()`（3.3+）规范化；VueUse `useWindowSize` 一句对照（防抖侧已提 VueUse） | — | 三、Vue 对照 |
| R2-15-7 | 15 | 未讲 | Vue 对照缺：`inject(key, default)` / 工厂形式第三参 `true`、`app.provide()` 应用级、inject 必须在 setup 同步阶段调用（与 `use(Context)` 可条件调用对照）、string key 时需 `inject<T>()` | — | 三、Vue 对照 |
| R2-16-8 | 16 | 未讲 | Pinia 对照缺：官方定位（核心团队、Vuex 维护模式、新项目推荐）、模块级 reactive 最小方案与 SSR 警告、`$patch` / `$state`、setup store 需自写 `$reset`、`$subscribe` / `$onAction`、插件体系 vs 中间件 | — | 三、Vue 对照 |
| R2-17-8 | 17 | 未讲 | `v-memo` / `v-once`（显式跳过子树，最接近 memo + deps）、3.4 起 computed 稳定性、`shallowRef` 对照、Vue 官方对 React 记忆化的评价句 | — | 三、Vue 对照 |
| R2-18-11 | 18 | 缺标签 | beforeEach 保留 next() 三参数并把返回值写法说成次要；「忘调 next 就挂起」被当成 Vue 通病；vue-router 5 文件路由与实验数据加载器未提 | src/topics/18-routing/vue/router.ts:82; src/topics/18-routing/vue/router.ts:88-98; src/topics/18-routing/react/Example.tsx:201-203 | 三、Vue 对照 |
| R2-19-7 | 19 | 未讲 | Vue 对照缺两点：`async` handler 的 Promise 拒绝也进 `onErrorCaptured` / `errorHandler`（React 事件处理器必须自己 `try / catch`）；`await router.push()` 后再结束 submitting | — | 三、Vue 对照 |
| R2-20-8 | 20 | 未讲 | Vue 对照缺：`async` 事件处理器的 Promise 拒绝也进 `onErrorCaptured`（`callWithAsyncErrorHandling`）；`<Suspense>` 异步错误同走 `onErrorCaptured`（→32） | — | 三、Vue 对照 |
| R2-21-9 | 21 | 未讲 | Vue 对照缺三项：`reactive` 不能整体替换 / 解构（坑互为镜像）；官方 `useImmer`（shallowRef + produce）；`shallowRef` / `triggerRef` / `markRaw` | — | 三、Vue 对照 |
| R2-22-10 | 22 | 缺标签 | Vue 侧用模块变量 controller 手工 abort，未提 3.5 的 onWatcherCleanup（在 watch 回调内注册清理）这一现行写法（→ 27） | src/topics/22-integrated-order-page/vue/Example.vue:52 | 三、Vue 对照 |
| R2-26-5 | 26 | 未讲 | Vue 侧闭包坑只给「手动拷 const snapshot」：解构 `reactive` / 3.5 前解构 props 失去响应式连接的真实形态未讲；`watch(source, cb)`「只追踪显式源」作为 useEffectEvent 的语义对照未讲；Vue 官方「没有过期闭包需要担心」+ 承认 Compiler 的原话未引 | — | 三、Vue 对照 |
| R2-27-6 | 27 | 未讲 | Vue 3.5 `onWatcherCleanup`（须在同步段调用，不能在 await 后）未讲，只用回调第三参 onCleanup；官方 useFetch 示例无取消需补 | — | 三、Vue 对照 |
| R2-28-9 | 28 | 讲错 | 「`<script setup>` 不能 export 类型」不成立：编译器只拒绝非类型导出，`export type` / `export interface` 允许 | src/topics/28-react-typescript-basics/react/Example.tsx:33; src/topics/28-react-typescript-basics/vue/Example.vue:34; src/topics/28-react-typescript-basics/vue/types.ts:4 | 三、Vue 对照 + 六、易错点 |
| R2-28-10 | 28 | 缺标签 | `withDefaults` 被写成默认值主线；3.5 基线应以响应式 props 解构默认值为主线，withDefaults 标 3.4 及以下写法；「对象 / 数组默认值必须写成工厂函数」只对 withDefaults 成立 | src/topics/28-react-typescript-basics/react/Example.tsx:24; src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:33-36; src/topics/28-react-typescript-basics/react/Example.tsx:618; src/topics/28-react-typescript-basics/vue/Example.vue:400 | 三、Vue 对照 + 八、旧写法对照 |
| R2-32-10 | 32 | 缺标签 | Vue 对照只有 18 题 KeepAlive ↔ Activity 一句：`<Suspense>`（实验）、`defineAsyncComponent`、无 `useTransition` / `useDeferredValue` 对应物均未讲 | src/topics/18-routing/react/Example.tsx:468 | 三、Vue 对照 |
| R2-33-11 | 33 | 未讲 | Vue SSR 定义与取舍、`onServerPrefetch`、3.5 `data-allow-mismatch`、跨请求状态污染、Nuxt / VitePress；Vue 无 RSC 对应物 | — | 三、Vue 对照 |

#### TS19（5）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-02-9 | 02 | 未讲 | @types/react 19 类型变化（`ReactElement` props 为 unknown、`useRef` 必传初始值、不再用 `MutableRefObject`）与 ref 回调清理函数：本题至少一句并指向 28 / 12 | — | 九、新动向 |
| R2-12-7 | 12 | 未讲 | React 19 类型 / 移除项对照：`useRef()` 无参不通过类型检查、`MutableRefObject` 并入 `RefObject`、string refs 移除、`element.ref` 弃用 | — | 八、旧写法对照 |
| R2-28-5 | 28 | 缺标签 | `FormEvent<HTMLFormElement>` 在 @types/react 19.2.18 已标 `@deprecated`，`onSubmit` 实际类型是 `SubmitEvent<T>`（target 精确到 HTMLFormElement） | src/topics/28-react-typescript-basics/react/Example.tsx:296; :15 | 二、核心概念 + 八、旧写法对照 |
| R2-28-7 | 28 | 未讲 | `useReducer` 19 起类型推断改进：不传泛型或 `useReducer<State, [Action]>`；`useReducer<React.Reducer<S, A>>`【旧写法】不再可用 | — | 二、核心概念 + 八、旧写法对照 |
| R2-29-1 | 29 | 未讲 | React 19 `useReducer` 类型推断规则与旧泛型写法未讲 | — | 八、旧写法对照 |

#### 旧写法（30）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-01-6 | 01 | 未讲 | 八、旧写法对照整段缺失：classic runtime 需 `import React`（17 起 automatic，19 必须新 transform）；class 组件、`ReactDOM.render` / `findDOMNode` / string ref 19 已移除 | — | 八、旧写法对照 |
| R2-02-6 | 02 | 缺标签 | 旧写法对照不完整：PropTypes 只说「过时」未注明 19 起不再校验；类组件 `ComponentClass` 仍有 `defaultProps`；`forwardRef` 仍可用、要兼容 React 18 的组件库仍需要它；string ref / `element.ref` 19 移除 / 弃用 | src/topics/02-props/react/Example.tsx:7; src/topics/02-props/react/Example.tsx:59; src/topics/02-props/react/Example.tsx:118-120 | 八、旧写法对照 |
| R2-03-6 | 03 | 未讲 | class `this.setState(partial)` 浅合并 vs Hooks 整体替换；`this.state` 非快照 | — | 八、旧写法对照 |
| R2-04-7 | 04 | 未讲 | 旧写法段缺失：`e.persist()` / 事件池（17 移除，"Not used with React DOM"）、类组件 `this.handleClick.bind(this)`；被动监听 onWheel / onTouch* 为 passive、要 preventDefault 需 ref + `addEventListener(..., { passive: false })` | — | 八、旧写法对照 |
| R2-05-7 | 05 | 未讲 | 八段缺失：类组件 `render()` 里 if/else 或 `renderX()` 辅助方法拆分支；函数组件同理拆子组件 | — | 八、旧写法对照 |
| R2-06-7 | 06 | 未讲 | 八段缺失：`React.Children.map` / `toArray` 自动合成 key 的遍历写法（"uncommon and can lead to fragile code"，主责 13）；存量代码 `key={index}` 标【旧写法】并给准确条件 | — | 八、旧写法对照 |
| R2-07-7 | 07 | 未讲 | 无【旧写法】段：自定义输入组件透传 `ref` 在 18 需 `forwardRef`、19.0 起 `ref` 是普通 prop（→02 / 12）；React 18 无 `<form action>` | — | 八、旧写法对照 |
| R2-08-8 | 08 | 未讲 | 【旧写法】ref + useImperativeHandle 调子组件方法、类组件 `this.props.onX` + bind 未作对照 | — | 八、旧写法对照 |
| R2-09-8 | 09 | 缺标签 | Effect 派生反例未标【旧写法】；类组件 `getDerivedStateFromProps` / `componentWillReceiveProps`、「全包 useMemo」旧建议未作对照 | src/topics/09-derived-state/react/Example.tsx:77 | 八、旧写法对照 |
| R2-10-7 | 10 | 缺标签 | StrictMode 双调 Effect 未写「18.0 起」（17 及以前不双调）；useEffectEvent 未标【较新】 | src/topics/10-effects-and-lifecycle/react/Example.tsx:313; src/topics/10-effects-and-lifecycle/react/Example.tsx:222 | 八、旧写法对照 |
| R2-10-8 | 10 | 未讲 | class 生命周期（componentDidMount / DidUpdate / WillUnmount）对照与「Effect = 三合一」错误类比未讲 | — | 八、旧写法对照 |
| R2-11-7 | 11 | 未讲 | TanStack v4 → v5 改名（loading→pending、isLoading→isPending、cacheTime→gcTime、keepPreviousData→placeholderData、useErrorBoundary→throwOnError、query 回调移除）未讲；本题 status 用 'loading' 与 v5 'pending' 不一致未说明 | — | 八、旧写法对照 |
| R2-12-3 | 12 | 缺标签 | ref 作为 prop 只有一句且声明「不展开」，02 题同样声明「不展开」→ 无人展开；`forwardRef` 未标【旧写法】、无 React 18 对照；「组件默认不暴露 DOM」未讲 | src/topics/12-dom-ref/react/Example.tsx:28-29 | 二、核心概念；八、旧写法对照 |
| R2-13-6 | 13 | 未讲 | 八段缺失：`React.FC<Props>` 隐式 `children`（当前 `FunctionComponent<P>` 签名 `(props: P)` 无隐式 children，须显式声明）；HOC `withX(Component)` 与 `cloneElement` 注入的复用模式 → 现用自定义 Hook + 组合（指向 14） | — | 八、旧写法对照 |
| R2-15-6 | 15 | 缺标签 | `.Provider` 未标【旧写法】且未注明 19.0 起可省、官方将弃用；`<Ctx.Consumer>` render prop、class `static contextType`、Legacy Context 19 移除、19.3 RSC 内可渲染 `<Context>`【尝鲜】均未列 | src/topics/15-context/react/Example.tsx:141 | 八、旧写法对照 / 九、新动向 |
| R2-16-7 | 16 | 缺标签 | 八段素材：Redux 经典写法（手写 store / combineReducers / action 常量 / connect HOC）；zustand v4 `useStore(sel, shallow)` 第二参；Context + useReducer 手搓 store 已提但未标【旧写法】 | src/topics/16-global-state/react/cartStore.ts:5-6 | 八、旧写法对照 |
| R2-17-7 | 17 | 未讲 | `memo` 第二参数 `arePropsEqual`（深比较可能冻结）；class 时代 `PureComponent` / `shouldComponentUpdate` 对照 | — | 二、核心概念；八、旧写法对照 |
| R2-18-9 | 18 | 讲错 | 从 react-router-dom 导入；「v7 声明式 API 与 v6 完全相同」；v6 EOL 与 v8 未提 | src/topics/18-routing/react/Example.tsx:507; src/topics/18-routing/react/Example.tsx:55; src/topics/18-routing/react/Example.tsx:508 | 八、旧写法对照 |
| R2-21-4 | 21 | 未讲 | class `this.setState({a})` 浅合并顶层字段，Hooks setter 整体替换 | — | 八、旧写法对照 |
| R2-23-6 | 23 | 未讲 | class 组件 `this.state` 是可变实例字段、事件处理器读最新值而非快照；官方「we don't recommend using them in new code」 | — | 八、旧写法对照 |
| R2-24-3 | 24 | 未讲 | legacy `ReactDOM.render` 与 `unstable_batchedUpdates` 的旧写法对照缺失 | — | 八、旧写法对照 |
| R2-25-6 | 25 | 未讲 | 【旧写法】HOC / render props 状态共享；【较新】React 19 ref 作普通 prop 后提升命令式句柄无需 forwardRef | — | 八、旧写法对照 |
| R2-26-1 | 26 | 缺标签 | 【待主线判定】latest ref 被列为核心概念、与 useEffectEvent 并列的正规修法，未标「社区惯用法、react.dev 无推荐语」，未说明 19.2 起官方替代为 useEffectEvent、仍在 18 的项目才用它；区块一（事件处理器 + setTimeout）是 useEffectEvent 覆盖不到的场景，须写明这一前提而不是默认并列 | src/topics/26-stale-closures/react/Example.tsx:13-14; src/topics/26-stale-closures/react/Example.tsx:146-155; src/topics/26-stale-closures/react/Example.tsx:620 | 二、核心概念；八、旧写法对照 |
| R2-27-5 | 27 | 未讲 | 组件级 isMounted ref 存量写法（只挡卸载后 setState、挡不住依赖切换的旧响应）；TanStack v4 `promise.cancel` → v5 仅 signal | — | 八、旧写法对照 |
| R2-29-6 | 29 | 未讲 | Redux 时代 action creator + 常量 + switch 样板与 RTK `createSlice` 对照未讲 | — | 八、旧写法对照 |
| R2-30-10 | 30 | 缺标签 | v4 → v5 改名清单【旧写法】未列（loading→pending、isLoading→isPending、cacheTime→gcTime、keepPreviousData→placeholderData、query 上 onSuccess 移除、useErrorBoundary→throwOnError）；旧名 React Query / 包名 react-query 未提；全文无成熟度标签 | src/topics/30-tanstack-query-server-state/react/Example.tsx:171 | 八、旧写法对照 |
| R2-31-7 | 31 | 缺标签 | 旧写法对照缺：`useFormState` → `useActionState` 更名（19.2.8 react-dom 仍导出）；React 18 手写 submitting 是唯一方案、`startTransition` 只接同步函数 —— 07 / 19 的手写写法未标「18 唯一 / 19 仍【主流】并列」 | src/topics/19-async-submit/react/Example.tsx:11 | 八、旧写法对照 |
| R2-32-9 | 32 | 缺标签 | StrictMode 双调讲了多处，但未讲「双调是并发 / Activity 可复用渲染的前提」；React 18 现状（`startTransition` 只同步、无 `use`、`useDeferredValue` 无 `initialValue`、`Activity` 未导出）【旧写法】未讲 | src/topics/10-effects-and-lifecycle/react/Example.tsx:8 | 八、旧写法对照 |
| R2-33-10 | 33 | 未讲 | `ReactDOM.hydrate` / `render`、`renderToString` 非流式、`react-helmet`、Pages Router `getServerSideProps`、"Server Actions" 旧称 | — | 八、旧写法对照 |
| R2-34-11 | 34 | 未讲 | 旧写法 Jest + `react-test-renderer`（19 弃用）、Enzyme、`react-dom/test-utils` 的 `act`、`@testing-library/react-hooks`；较新 Vitest Browser Mode 一句 | — | 八、旧写法对照 + 九、新动向 |

#### 绝对化（7）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-09-7 | 09 | 讲错 | 「computed 是 Vue 派生值的唯一惯用写法」「必须用 computed」「Vue 里也不存在非缓存的直接算」 | src/topics/09-derived-state/react/Example.tsx:14; src/topics/09-derived-state/react/Example.tsx:18-19; src/topics/09-derived-state/vue/Example.vue:15; src/topics/09-derived-state/vue/Example.vue:19; src/topics/09-derived-state/vue/Example.vue:60 | 四、关键区别 |
| R2-12-8 | 12 | 措辞 | 「Vue 的 ref …永远不会给你『改了不更新』的体验」过于绝对（`shallowRef` 深层改动、`markRaw` 对象、解构 reactive 都会「改了不更新」） | src/topics/12-dom-ref/vue/Example.vue:103 | 四、关键区别 |
| R2-13-8 | 13 | 措辞 | 「这是两个框架的本质差异，Vue 模板做不到」把「模板 vs JSX 的默认路径」讲成框架能力差异：Vue 的插槽本身就是函数，渲染函数 / JSX 里以 `h(Card, null, { header: () => … })` 作为值传递、`useSlots()` 可当函数调用；应限定为「模板语法下」 | src/topics/13-slots-and-children/react/Example.tsx:18; src/topics/13-slots-and-children/react/Example.tsx:16-17; src/topics/13-slots-and-children/vue/Example.vue:17-19; src/topics/13-slots-and-children/vue/Example.vue:82-83 | 四、关键区别 |
| R2-24-1 | 24 | 讲错 | 把「处理器里读 state 是旧值」归因于批处理 | src/topics/24-batching-and-functional-updates/react/Example.tsx:256-257 | 六、易错点 |
| R2-24-10 | 24 | 措辞 | 「在 Vue 里根本没有这个坑」与 Vue 侧自相矛盾 | src/topics/24-batching-and-functional-updates/react/Example.tsx:375 | 三、Vue 对照 |
| R2-26-6 | 26 | 措辞 | 「Vue 里唯一会『过期』的东西是你手动拷出来的普通值」「Vue 侧没有任何对应物」过于绝对；「任何时刻读 .current 都是最新的」在 effect 同步前的窗口不成立；「永远」react 侧 22 处 / vue 侧 19 处，多数语境内成立但应收敛 | src/topics/26-stale-closures/react/Example.tsx:24; src/topics/26-stale-closures/react/Example.tsx:498; src/topics/26-stale-closures/react/Example.tsx:14; src/topics/26-stale-closures/vue/Example.vue:22 | 三、Vue 对照；四、关键区别 |
| R2-29-5 | 29 | 讲错 | 「不存在 03 题读快照的坑」以偏概全 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:13; src/topics/29-use-reducer-and-action-types/vue/Example.vue:14 | 六、易错点 |

#### 生产简化（1）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-11-1 | 11 | 未讲 | 官方对「在 Effect 里请求」的态度（四个缺点、推荐框架机制 / TanStack / useSWR / Router loader、何时仍可用 Effect）与路由模式选型判据未讲 | — | 二、核心概念 |

#### 交叉引用（5）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-16-9 | 16 | 未讲 | 「先分类」少两类：URL 状态（筛选 / 分页 / tab → 18）、表单草稿（→07 / 31） | — | 二、核心概念 |
| R2-19-5 | 19 | 未讲 | 无一句指向服务端状态层 / 路由层替代：`useMutation.isPending`（→30）、`useFetcher.state` / `useNavigation`（→18） | — | 五、常见追问与回答要点 |
| R2-24-7 | 24 | 未讲 | 缺两处一句话落点：useReducer 的 dispatch 同规则 → 29；Pinia `$patch` → 16 | — | 五、常见追问 |
| R2-25-5 | 25 | 未讲 | 服务端数据不是提升问题（Query 缓存即共享 → 30）；筛选 / 分页 / 选中 id 能放 URL → 路由（18） | — | 七、生产环境注意 |
| R2-29-8 | 29 | 未讲 | reducer + Context 拆两个 context 的官方模式未讲 | — | 五、常见追问 |

#### 其它（96）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-01-4 | 01 | 未讲 | `<StrictMode>` 开发期双调组件、初始化函数与 Effect，生产零成本 | — | 五、常见追问与回答要点 |
| R2-01-5 | 01 | 未讲 | 渲染三步 Trigger → Render → Commit；同一组件多次使用各自独立实例 | — | 二、核心概念 |
| R2-01-8 | 01 | 未讲 | JSX / 模块细节：标签必须闭合、`aria-*` / `data-*` 保留连字符、多行 return 加括号、`<>` 不能带 key、default / named export 约定、返回类型 ReactNode | — | 二、核心概念 |
| R2-02-3 | 02 | 未讲 | 参数默认值只在缺失或 `undefined` 时生效；传 `null` / `0` 不会用默认值 | — | 六、易错点 |
| R2-02-4 | 02 | 未讲 | 不要把 props 镜像进 state（`useState(props.x)` 后父组件更新被忽略）；刻意忽略更新时命名 `initialX` / `defaultX`，指向 09 | — | 六、易错点 |
| R2-02-5 | 02 | 未讲 | Props 是每次渲染的只读快照（"every render receives a new version of props"）；props 像函数参数、state 是组件记忆 | — | 二、核心概念 |
| R2-02-8 | 02 | 未讲 | `key` 不是 prop（组件收不到，需要 id 另传）；`{...props}` 展开要克制（"Use spread syntax with restraint"）；JSX 无值属性 `disabled` 即 `true`（react:196 用了未说明） | — | 六、易错点 |
| R2-03-1 | 03 | 未讲 | 惰性初始化 `useState(() => init())` 未讲 | — | 二、核心概念 |
| R2-03-2 | 03 | 未讲 | Hooks 规则（只在顶层调用、React 按调用顺序匹配）未提 | — | 六、易错点 |
| R2-03-3 | 03 | 未讲 | 为什么局部变量不能当 state（不跨渲染、不触发渲染）+ state 每实例私有 | — | 二、核心概念 |
| R2-03-4 | 03 | 未讲 | 状态结构原则（避免冗余 / 矛盾 / 深嵌套、不镜像 props）与 `status` 联合替代多 boolean | — | 二、核心概念 |
| R2-03-5 | 03 | 未讲 | useState 两大排错：渲染期无条件 setState → Too many re-renders；把函数存进 state 会被当初始化器调用 | — | 六、易错点 |
| R2-03-8 | 03 | 讲错 | Vue 响应式对照两处失准：`ref` 不是 Proxy；「粒度精细得多」夸大 | src/topics/03-state/react/Example.tsx:312-313; src/topics/03-state/react/Example.tsx:17 | 三、Vue 对照 |
| R2-04-2 | 04 | 未讲 | 传播模型不完整：捕获阶段 `onClickCapture` 与三阶段顺序；`onScroll` 不冒泡（17 起）；原生不冒泡的 onLoad / onAbort 在 React 冒泡；onFocus / onBlur 底层用 focusin / focusout | — | 二、核心概念 |
| R2-04-3 | 04 | 未讲 | 事件处理器是副作用的最佳位置（"Event handlers are the best place for side effects."），不必纯；处理器闭包读到的是本次渲染快照（指向 23 / 26） | — | 二、核心概念 |
| R2-04-4 | 04 | 未讲 | 命名约定 `handleX` / `onX`；回调 prop 代替事件传播（指向 08）；内联箭头每次渲染新函数、只有子组件 `memo` 或作 Effect 依赖时才 `useCallback`（指向 17） | — | 五、常见追问与回答要点 |
| R2-04-5 | 04 | 未讲 | Vue 修饰符对照不全：`.self` → `e.target === e.currentTarget`、`.once` → 自行去重或 `addEventListener(…, { once: true })`、`.enter` / `.ctrl` / `.exact` → `e.key` / `e.ctrlKey`；Vue 侧按键 / 系统修饰符与组件 `emit` 不冒泡 | — | 三、Vue 对照 |
| R2-04-6 | 04 | 未讲 | `onChange` 每次击键触发、行为像原生 input 事件而非 change（主责 07）；表单一律 `onSubmit` + `preventDefault()` 或 19 的 `<form action>`（指向 07 / 31） | — | 五、常见追问与回答要点 |
| R2-04-8 | 04 | 未讲 | TS 事件类型只讲了 `MouseEvent<T>`；`ChangeEvent` / `FormEvent` / `KeyboardEvent`、`SyntheticEvent` 兜底、`MouseEventHandler<T>` 未提，也没指向 28 | — | 二、核心概念 |
| R2-04-9 | 04 | 未讲 | 九段缺失：19.3 新增 onFullscreenChange / onFullscreenError、submit 事件带 `submitter`、resize 事件批处理【尝鲜】 | — | 九、新动向 |
| R2-05-2 | 05 | 未讲 | 同位置换成不同组件（`<p>` ↔ `<Counter>`）会销毁 state；同组件间强制重置用 `key` 或渲染到不同位置（主责 06）；「隐藏 vs 卸载」还可把 state 提升到父级保留 | — | 六、易错点 |
| R2-05-4 | 05 | 未讲 | `return null` 渲染空及其可读性提醒；把 JSX 赋给变量 `let content; if (...)` 是最灵活的写法；JSX 元素是描述不是实例，所以 if/else 与三元 "completely equivalent" | — | 二、核心概念 |
| R2-05-5 | 05 | 未讲 | 类型依据：`ReactNode` 联合含 boolean / null / undefined 所以 `cond && <A/>` 通过类型检查，含 number 所以 `0` 会渲染——TS 拦不住 0 陷阱，要靠 `> 0` 或 lint（指向 28） | — | 五、常见追问与回答要点 |
| R2-05-6 | 05 | 未讲 | 多个互斥布尔（isLoading / isError）易矛盾，用单一 `status` 联合驱动分支（"Avoid contradictions in state"）；本题 `status` 联合是实践但未说理由（落点 11 / 29） | — | 二、核心概念 |
| R2-05-8 | 05 | 未讲 | Vue 侧细节缺：`<template v-if>` 包多元素；v-show 不支持 `<template>` 与 `v-else`；v-if 惰性 / 切换成本高 vs v-show 初始成本高的取舍；v-if 与 v-for 同元素 v-if 优先且拿不到循环变量（指向 06） | — | 三、Vue 对照 |
| R2-06-1 | 06 | 未讲 | `key={Math.random()}` / 渲染期生成 key：每次渲染都对不上 → 所有组件与 DOM 重建、丢失用户输入；key 从哪来：后端 id、本地数据用 `crypto.randomUUID()` 或计数器并在**创建时**写进数据 | — | 六、易错点 |
| R2-06-2 | 06 | 未讲 | 每项多个 DOM 节点时 `<>` 不能带 key，要写 `<Fragment key={id}>`；块体箭头函数 `=> {` 必须显式 `return` 否则什么都不渲染；先 `filter` 再 `map` | — | 二、核心概念 |
| R2-06-3 | 06 | 未讲 | key 的类型 `Key = string \| number \| bigint`（位于 `Attributes.key`）；Vue key 期望 `number \| string \| symbol`、必须原始值、重复 key 渲染报错 | — | 五、常见追问与回答要点 |
| R2-06-4 | 06 | 未讲 | 派生列表（过滤 / 排序）在渲染期计算或 `useMemo`，不复制进 state；`sort` / `reverse` 原地突变要先拷贝 `[...arr].sort()`（主责 21）；Vue 侧突变方法被侦测 vs `filter` 返回新数组整体替换 | — | 六、易错点 |
| R2-06-5 | 06 | 未讲 | Vue 侧细节：`v-for` 语法家族（`of`、对象 `(value, key, index)`、范围 `n in 10`、解构）；`<template v-for>` 的 key 放 template 上；组件 `v-for` 需显式传 props；`v-if` 与 `v-for` 同元素 v-if 优先；`v-memo` 一句 | — | 三、Vue 对照 |
| R2-07-2 | 07 | 未讲 | 受控 ↔ 非受控切换警告：初始值给 `undefined` / `null` 再给字符串会报「changing an uncontrolled input to be controlled」，受控值须始终为字符串 | — | 六、易错点 |
| R2-07-4 | 07 | 缺标签 | 元素差异只讲了 checkbox / select：`value` 恒为字符串、`type="number"` 需 `Number()`、`<option selected>` 在 React 不支持、`<textarea>` 不接 children 均未讲 | src/topics/07-forms/react/Example.tsx:315-316 | 二、核心概念 |
| R2-08-1 | 08 | 未讲 | 「通知父组件」的 Effect 反模式与正解全部未讲：Effect 里 onChange「runs too late」多一轮渲染；同一处理器 setState + onChange 批处理；去掉子 state 全受控；Effect 里 onFetched 上抛数据 | — | 二、核心概念 / 六、易错点 |
| R2-08-2 | 08 | 未讲 | 状态提升三步法、兄弟通信、受控 / 非受控组件的设计层定义只剩一句指向 25 | — | 二、核心概念 |
| R2-08-5 | 08 | 未讲 | 回调 prop 代替事件传播（先 stopPropagation 再调 onClick prop）；多层回调层层转发 vs 提升 / 组合 children / context 阶梯 | — | 二、核心概念 |
| R2-09-1 | 09 | 未讲 | choosing-the-state-structure 三原则未讲：避免重复（存 id 不存对象）、不镜像 props 进 state（`initialX`）、避免矛盾 state | — | 二、核心概念 |
| R2-09-2 | 09 | 未讲 | 未提 eslint-plugin-react-hooks 7 `recommended` 会以 error 报 `set-state-in-effect`；`no-deriving-state-in-effects` 默认 Off | — | 六、易错点 |
| R2-09-5 | 09 | 未讲 | you-might-not-need-an-effect 其余派生场景：prop 变化时重置（key）/ 调整部分 state（渲染期比较 prev 再 setState，限同组件、须有条件）、事件间共享逻辑抽函数、不用 Effect 链 | — | 二、核心概念 |
| R2-11-3 | 11 | 讲错 | 把自定义 Hook 抽象称为「半吊子抽象」，与官方「无框架时把请求逻辑移进自定义 Hook 便于日后整体替换」相反 | src/topics/11-api-request-state/react/Example.tsx:9; src/topics/11-api-request-state/react/Example.tsx:55 | 二、核心概念 |
| R2-12-5 | 12 | 未讲 | `flushSync` 让 DOM 同步更新后再 `scrollIntoView`；Vue `await nextTick()` 对照 | — | 五、常见追问；三、Vue 对照 |
| R2-12-9 | 12 | 未讲 | 加分点：`initialValue` 首轮后被忽略、「useRef 概念上 = useState({current})[0]」解释为何跨渲染同一对象、懒初始化 `if (ref.current === null)` 例外 | — | 二、核心概念；五、常见追问 |
| R2-13-2 | 13 | 未讲 | `children` 结构不透明（单节点 / 数组 / null）；`Children.count/map/toArray` 与 `isValidElement` 可遍历但 "uncommon and can lead to fragile code"，遍历不进入元素内部与 Fragment；替代方案：多个子组件、对象数组 prop、render prop | — | 五、常见追问与回答要点 |
| R2-13-3 | 13 | 未讲 | `cloneElement(element, props)` 注入 props："makes it harder to trace the data flow"；替代：render prop、context、自定义 Hook | — | 五、常见追问与回答要点 |
| R2-13-4 | 13 | 未讲 | `children` 也可以是函数（function as children）；TS：`ReactNode`（"a union of all the possible types"）vs `ReactElement`（只元素）、`PropsWithChildren<P>`、render prop 参数类型显式声明（主责 28） | — | 二、核心概念 |
| R2-13-5 | 13 | 未讲 | 组合组件转发 ref：19 起 ref 是普通 prop，包装组件直接 `{ ref, ...rest }` 透传，`forwardRef`【旧写法】不再必需（主责 02 / 12）；组合 ≠ 在父组件内定义子组件——每次渲染重建（指向 01） | — | 六、易错点 |
| R2-13-7 | 13 | 未讲 | Vue 侧细节缺：`<slot>` fallback 内容（React 用 `children ?? <Default/>`）；动态插槽名 `#[name]`；混用具名与默认时默认插槽须显式 `<template #default>`；`defineSlots`（3.3+）/ `useSlots()` 类型化；renderless 组件 vs composable（"Composables are more efficient than renderless components"，指向 14） | — | 三、Vue 对照 |
| R2-14-6 | 14 | 未讲 | 官方反模式：不要造 `useMount` / `useEffectOnce` / `useUpdateEffect`（绕过依赖检查）；「不必为每一点重复抽 Hook」 | — | 六、易错点 |
| R2-14-7 | 14 | 未讲 | Hooks 规则清单不全（条件 return 之后、try/catch、class、传给 useMemo 的回调）；报错文案「Rendered more/fewer hooks than expected」；`use()` 可条件调用的例外；「不调 Hook 的函数不要加 use」 | — | 二、核心概念；五、常见追问 |
| R2-15-3 | 15 | 未讲 | defaultValue 语义（只在树上无 Provider 时生效、静态不变）、useContext 只找「上方最近的 Provider」、嵌套 Provider 局部覆盖、重复模块 / 漏 value 排错 | — | 二、核心概念 / 六、易错点 |
| R2-15-4 | 15 | 未讲 | 拆 state / dispatch（或 setter）两个 context、Provider + useX 收进一个模块；官方四类场景中的「路由」「reducer + context 管理 state」 | — | 二、核心概念 / 五、常见追问与回答要点 |
| R2-15-5 | 15 | 未讲 | 「Before you use context」：先传 props，再抽组件把 JSX 当 children 传，两者不行才 context | — | 二、核心概念 |
| R2-16-3 | 16 | 措辞 | 【待主线判定】选型段无官方定位原文与采用数据；「Redux Toolkit 更重、样板多」与 RTK 自述相悖（RTK 正是为解决「too much boilerplate」而生）；「最主流之一」无来源 | src/topics/16-global-state/react/Example.tsx:12-13; src/topics/16-global-state/react/cartStore.ts:4-7 | 二、核心概念 / 四、关键区别 |
| R2-16-4 | 16 | 未讲 | 中间件（`devtools`、`persist` + `createJSONStorage`、`subscribeWithSelector`、`combine`、`immer` 需另装）与 `set(partial, true)` 整体替换会清掉 actions | — | 二、核心概念 / 七、生产环境注意 |
| R2-16-5 | 16 | 未讲 | 异步 action（`async` + `await` 后 `set`）、slices 模式 `StateCreator<A & B, [], [], A>`、`combine` 免手写类型 | — | 二、核心概念 / 七、生产环境注意 |
| R2-19-3 | 19 | 未讲 | 错误未分层：网络错误与服务端校验错误同样处理，无「可重试 vs 字段错误」；未说明提交错误应进 state 而非 throw 给边界（边界不捕获事件处理器→20） | — | 五、常见追问与回答要点 |
| R2-20-2 | 20 | 缺标签 | `react-error-boundary` 只剩一句名词：未讲官方「你不必自己写 class」定位、`fallbackRender` / `FallbackComponent` / `onError` / `onReset` / `resetKeys`、`useErrorBoundary().showBoundary` 处理事件 / 异步错误、`withErrorBoundary`；包未安装 | src/topics/20-error-handling/react/ErrorBoundary.tsx:5-7; src/topics/20-error-handling/react/Example.tsx:6-7 | 二、核心概念 |
| R2-20-4 | 20 | 讲错 | `createRoot` 的 `onCaughtError` / `onUncaughtError` 被说成「与 errorHandler 不是同层概念」：两者同为应用级兜底；`onRecoverableError` 未提；19「错误不再 rethrow」（未捕获 → `window.reportError`、已捕获 → `console.error`）只提一半，18 重复日志【旧写法】未讲 | src/topics/20-error-handling/react/Example.tsx:17-18; src/topics/20-error-handling/vue/Example.vue:18-19; :41-45 | 八、旧写法对照 |
| R2-21-1 | 21 | 未讲 | 数组表不全：排序 / 反转要先拷贝、插入中间用 slice + 展开、`slice`（拷）vs `splice`（改）；错法 `arr.sort()` 后 set、先改子对象再 `{...state}` | — | 二、核心概念 |
| R2-21-2 | 21 | 未讲 | ES2023 `toSorted` / `toReversed` / `toSpliced` / `with` 可替代「先拷贝再排」【较新】 | — | 九、新动向 |
| R2-21-3 | 21 | 未讲 | Immer 只有一句提名：draft 是记录改动的 Proxy、产出全新对象、`useImmer` / `useImmerReducer`、RTK `createSlice` 内置、Zustand immer 中间件、代价 | — | 五、常见追问 |
| R2-21-6 | 21 | 未讲 | 规则边界：改刚创建的对象可以；props / context 同样只读；reducer 同规则（29）；深嵌套根治是归一化（03） | — | 六、易错点 |
| R2-21-7 | 21 | 未讲 | 官方「为什么不推荐 mutation」五条只覆盖排查、优化两条：撤销 / 重做靠保留旧快照、新特性依赖快照语义、React 实现更简单（不劫持属性） | — | 五、常见追问 |
| R2-21-8 | 21 | 讲错 | 「Proxy 拦截 set…只更新依赖它的地方」暗示属性级更新；Vue 3.5 实际是组件级 render effect | src/topics/21-immutable-update/react/Example.tsx:16; src/topics/21-immutable-update/vue/Example.vue:73 | 三、Vue 对照 |
| R2-22-1 | 22 | 未讲 | Thinking in React 五步与「是不是 state 三问」未作为拆页方法讲：为什么 keyword / status / page 在父级、编辑草稿在行内、筛选后列表 / 总页数 / 是否为空都不是 state | — | 二、核心概念 |
| R2-22-5 | 22 | 未讲 | 错误分层：请求失败是数据状态（已做），渲染崩溃要靠行级 / 页级 Error Boundary 兜底，resetKeys 随筛选重置（→ 20） | — | 七、生产环境注意 |
| R2-22-8 | 22 | 缺标签 | 行级状态用 editing / confirmingDelete / saving / deleting 四个布尔（16 种组合多数不可能），与列表用判别联合的做法自相矛盾且未说明；官方建议用 status 枚举消灭 impossible states | src/topics/22-integrated-order-page/react/Example.tsx:239-241 | 六、易错点 |
| R2-23-1 | 23 | 未讲 | Trigger → Render → Commit 三阶段与「Commit 只改有差异的 DOM 节点」、浏览器 paint 未讲 | — | 二、核心概念 |
| R2-23-2 | 23 | 未讲 | state 与渲染树位置绑定：同位置同组件保留 / 换类型或 key 重置；组件内定义组件的坑；路由参数变化实例复用 | — | 二、核心概念 |
| R2-23-3 | 23 | 未讲 | StrictMode 四条行为 + 双调函数清单（组件体、useState / set / useMemo / useReducer 的函数）+ 19.3 hydration 双调【尝鲜】+ Vue 无对应物 | — | 六、易错点 |
| R2-23-4 | 23 | 未讲 | 纯函数完整定义（不改渲染前已存在的对象；props / state / context 只读；局部突变可以）与副作用去处（事件处理器；useEffect 最后手段） | — | 二、核心概念 |
| R2-23-7 | 23 | 讲错 | 「ref / reactive 是长期存活的 Proxy 容器」：`ref` 不是 Proxy | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:16; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:18; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:76 | 三、Vue 对照 |
| R2-24-2 | 24 | 未讲 | flushSync 其余三条注意事项未讲 | — | 六、易错点 |
| R2-24-4 | 24 | 未讲 | 「flushSync 不能让处理器里的 state 变量变新」未明说 | — | 五、常见追问 |
| R2-24-5 | 24 | 未讲 | 「React 不跨事件批处理」未讲 | — | 二、核心概念 |
| R2-24-6 | 24 | 未讲 | `Object.is` 相同值跳过渲染、set 函数身份稳定未讲 | — | 五、常见追问 |
| R2-25-1 | 25 | 未讲 | 状态提升三步法（移除子 state → 父先传硬编码 → 父加 state 连同处理器传下）未讲 | — | 二、核心概念 |
| R2-25-2 | 25 | 未讲 | 受控 / 非受控组件的组件级官方定义与取舍：受控 = driven by props（最灵活但父组件要全配置）、非受控 = 自持 local state（易用难协调）、实践中是混合体 | — | 二、核心概念 |
| R2-25-3 | 25 | 未讲 | Thinking in React 步骤 3–4 与 state 结构：「随时间不变 / 父传来 / 能算出」三问；「新建组件专门持有 state」；合并一起变的 state；选中态存 id | — | 二、核心概念 |
| R2-25-4 | 25 | 未讲 | 取舍阶梯缺中间两级：官方「Start by passing props → 抽组件传 JSX 作 children → 再 context」；Context 适用场景（主题 / 当前用户 / 路由）；store 加分判据（devtools / 持久化 / 更新频繁）；提升后重渲染的控制手段（拆 owner / children 组合 / memo） | — | 四、关键区别 / 五、常见追问与回答要点 |
| R2-26-3 | 26 | 未讲 | 官方修法体系不全：修法 C「由交互触发的逻辑搬进事件处理器」、修法 D「拆 Effect / 对象与函数移进 Effect / 只读原始值」未讲；修法优先级（函数式更新 → 正确依赖 → useEffectEvent → latest ref）未成体系 | — | 二、核心概念；五、常见追问 |
| R2-27-1 | 27 | 讲错 | 「被 abort 的 promise 不会 resolve」对真实 fetch 不完整：响应头已到、body 未读完时 abort，fetch 已 resolve，`response.json()` 才以 AbortError reject | src/topics/27-async-race-and-cancellation/react/Example.tsx:356 | 六、易错点 |
| R2-27-2 | 27 | 缺标签 | TanStack 取消的前提未讲：默认不取消（卸载 / 不再使用的查询照跑完）、queryFn 消费 signal 才 opt-in、`queryClient.cancelQueries` 手动取消、Suspense hooks 下取消不工作 | src/topics/27-async-race-and-cancellation/react/Example.tsx:331 | 二、核心概念 |
| R2-27-3 | 27 | 未讲 | `AbortSignal.timeout(ms)`（超时，抛 TimeoutError 而非 AbortError）、`AbortSignal.any([...])` 合并信号、`signal.throwIfAborted()` | — | 七、生产环境注意 |
| R2-27-7 | 27 | 未讲 | 「只靠 loading 布尔挡不住竞态」与「切换参数时重置 data（官方 setBio(null)）」未点破 | — | 五、常见追问与回答要点 |
| R2-28-6 | 28 | 讲错 | 「泛型参数决定了 e.target / e.currentTarget 的类型」只对 ChangeEvent（与 SubmitEvent）成立；MouseEvent / KeyboardEvent 等的 `target` 仍是裸 `EventTarget` | src/topics/28-react-typescript-basics/react/Example.tsx:16; src/topics/28-react-typescript-basics/vue/Example.vue:16 | 二、核心概念 + 六、易错点 |
| R2-28-8 | 28 | 未讲 | `ReactNode` vs `ReactElement` vs `JSX.Element` 三者关系、`PropsWithChildren<P>`、函数组件返回类型 `ReactNode \| Promise<ReactNode>` | — | 二、核心概念 + 五、常见追问 |
| R2-28-11 | 28 | 未讲 | 工具箱补缺：tsconfig 前提（`jsx: react-jsx`、`lib` 含 DOM、`strict`）、`.tsx` 禁尖括号断言、Vite 只转译 → `tsc` / `vue-tsc --noEmit`、`createContext<T \| null>` + 自定义 Hook 抛错、Handler 别名 `ChangeEventHandler<T>`、`style: CSSProperties` | — | 二、核心概念 + 七、生产环境注意 |
| R2-29-2 | 29 | 未讲 | Immer / `useImmerReducer` 与 Vue `reactive` 的对照未提 | — | 七、生产环境注意 |
| R2-29-3 | 29 | 未讲 | Troubleshooting 三个常见错误未讲 | — | 六、易错点 |
| R2-29-4 | 29 | 未讲 | 异步逻辑放哪、「结果 action」模式未讲 | — | 五、常见追问 |
| R2-30-1 | 30 | 未讲 | React 官方把 TanStack 列为「客户端缓存」方案之一（与 useSWR / React Router 6.4+ 并列）；路由 loader / use(promise) 作为数据获取候选完全未提；服务端状态四特征只讲两条 | — | 二、核心概念 / 四、关键区别 |
| R2-30-2 | 30 | 未讲 | queryKey 哈希规则：顶层必须数组、确定性哈希、对象键顺序无关、数组元素顺序有关 | — | 二、核心概念 |
| R2-30-3 | 30 | 未讲 | status × fetchStatus 两个枚举字段（含 paused 离线态）、isLoading v5 = isFetching && isPending；触发重取的默认项不全（refetchOnReconnect / refetchOnMount 默认 true、refetchInterval 默认 false） | — | 二、核心概念 |
| R2-30-4 | 30 | 未讲 | mutation 细节：默认不重试；mutate 与 mutateAsync 取舍（卸载后回调不触发 / 可 try-catch）；useMutation 级回调先于 mutate 级、连续 mutate 只触发最后一次 mutate 级回调 | — | 五、常见追问与回答要点 |
| R2-30-6 | 30 | 缺标签 | 取消是 opt-in：默认不取消卸载 / 不再使用的查询，只有 queryFn 读取了 signal 才会 abort（→ 27） | src/topics/30-tanstack-query-server-state/react/Example.tsx:13 | 六、易错点 |
| R2-30-8 | 30 | 未讲 | 常用选项：分页 placeholderData: keepPreviousData + isPlaceholderData（→ 22）；依赖查询 enabled（pending + idle、瀑布） | — | 二、核心概念 |

### 2.3 生产（32）

#### 散点Hook（1）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-12-4 | 12 | 未标简化 | 演示在渲染期读 `ref.current` 两处，切换 `recommended` 后命中 `react-hooks/refs`（error）；:93 处无任何说明；懒初始化例外与规则名未讲 | src/topics/12-dom-ref/react/Example.tsx:86; src/topics/12-dom-ref/react/Example.tsx:93 | 六、易错点；七、生产环境注意 |

#### 性能（1）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-11-6 | 11 | 未标简化 | 每次搜索先把整张表换成「加载中」再加载，是切换参数闪烁的现场；TanStack `placeholderData: keepPreviousData` / isPlaceholderData 与手写「保留旧 data + isRefreshing」未讲（→ 22） | src/topics/11-api-request-state/react/Example.tsx:61 | 七、生产环境注意 |

#### 安全a11y（1）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-04-10 | 04 | 未标简化 | 可点击 `<div onClick>` 卡片与用 `<a href>` 当按钮，都没有 role / tabIndex / onKeyDown，未标「演示简化」，也没说真实项目用 `<button>`（主责 35） | src/topics/04-events/react/Example.tsx:76; src/topics/04-events/react/Example.tsx:130 | 七、生产环境注意 |

#### 服务端（1）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-14-2 | 14 | 未标简化 | `useWindowWidth` 直接读 `window.innerWidth`，无「仅客户端」说明、无 `getServerSnapshot` / SSR 对照；Vue 侧也未提 SSR 时放 onMounted | src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:16 | 七、生产环境注意 |

#### 生产简化（23）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-01-10 | 01 | 未标简化 | 内联 `style` 对象与硬编码色值未标「演示简化」，未提 CSS Modules / Tailwind / CSS-in-JS 等项目级方案 | src/topics/01-component-and-jsx/react/Example.tsx:45-54; src/topics/01-component-and-jsx/react/Example.tsx:81 | 七、生产环境注意 |
| R2-02-10 | 02 | 未讲 | 生产段缺：`style` 也要合并；用 `Omit<ComponentPropsWithoutRef<'button'>, 'x'>` 解决与自定义 prop 同名冲突；对象 / 函数型默认值每次渲染新引用会击穿 `memo`（17）；运行时校验放数据边界（zod 等）而非 props | — | 七、生产环境注意 |
| R2-05-9 | 05 | 未标简化 | `style={{ display }}` 演示未标「演示简化」（真实项目用 className / `hidden` 属性 / Activity）；提前 return 之前不能有条件调用的 Hook（Hooks 规则，14）；按权限隐藏按钮只是体验，鉴权在后端（35） | src/topics/05-conditional-rendering/react/Example.tsx:138 | 七、生产环境注意 |
| R2-06-10 | 06 | 未讲 | 生产段缺：跨来源合并列表时 key 加前缀（`server-${id}` / `local-${uuid}`）避免碰撞；分页 / 搜索切换保持 key 稳定避免整表重建；每项组件 `memo` 时保证 props 引用稳定 | — | 七、生产环境注意 |
| R2-08-9 | 08 | 未标简化 | 回调全是同步本地更新；生产 onRename 通常 async 提交，要处理 pending / 错误 / 防重复 | src/topics/08-parent-child-communication/react/Example.tsx:120 | 七、生产环境注意 |
| R2-10-1 | 10 | 未标简化 | Effect 手写请求被当成正当默认写法，未说明官方列出的四个缺点与生产替代（框架机制 / TanStack Query / Router loader，→ 11 / 30） | src/topics/10-effects-and-lifecycle/react/Example.tsx:269 | 七、生产环境注意 |
| R2-11-2 | 11 | 未标简化 | mockApi 直接 throw Error；真实 fetch 不因 404 / 500 reject，必须检查 response.ok 再 throw；错误对象类型（HTTP / 网络 / 取消）未统一 | src/topics/11-api-request-state/react/Example.tsx:62 | 七、生产环境注意 |
| R2-13-10 | 13 | 未讲 | 生产段缺：组件 API 优先复合组件 `<Card.Header>` 或具名 JSX prop，不解析 children 结构；render prop 每项都会调用，配合 `memo` 子项注意引用稳定（17）；布局 / 容器组件一律接受 children；逻辑复用优先自定义 Hook（14）而非 renderless / HOC | — | 七、生产环境注意 |
| R2-15-8 | 15 | 未标简化 | Provider 直接写在 Example 里，未组件化为 `ThemeProvider({ children })`（children 元素由上层创建，Provider 内 state 变化不会重渲染它们）；未提 AppProviders 聚合、测试 wrapper 提供 Provider（→34）、高频值不走 context 的替代（拆 context / store） | src/topics/15-context/react/Example.tsx:143 | 七、生产环境注意 |
| R2-16-10 | 16 | 未标简化 | 演示 store 为单 store、同步 action、无持久化 / devtools、totalPrice 用 store 内函数现算；未标「演示简化」也没给生产形态（按领域拆 slices、persist 白名单 + version / migrate、devtools 仅开发期、token 不落 localStorage → 35、selector 内派生） | src/topics/16-global-state/react/cartStore.ts:37 | 七、生产环境注意 |
| R2-17-10 | 17 | 未标简化 | `useMemo` 计算函数与 `ProductRow` 渲染体里的 `console.count` 是观察手段，未标注「计算函数必须纯、生产不写副作用」；200 条 filter+sort 是否达 1ms 阈值未说明 | src/topics/17-performance-hooks/react/Example.tsx:107; src/topics/17-performance-hooks/react/Example.tsx:69 | 七、生产环境注意 |
| R2-18-10 | 18 | 未标简化 | 登录态二态无 checking；navigate(-1) / router.back() 无兜底；setSearchParams 整体替换未说明；safeRedirect 只有注释无实现 | src/topics/18-routing/react/Example.tsx:162; src/topics/18-routing/react/Example.tsx:355; src/topics/18-routing/react/Example.tsx:365; src/topics/18-routing/react/Example.tsx:277-283; src/topics/18-routing/react/Example.tsx:237-239; src/topics/18-routing/vue/OrderDetailPage.vue:34; src/topics/18-routing/vue/LoginPage.vue:28-30 | 七、生产环境注意 |
| R2-19-2 | 19 | 未标简化 | `await` 后无条件 `setResult` / 清空输入：组件卸载或请求被取代时回写；未标「演示简化」，mockApi 支持 `signal` 却未用 `AbortController` / `ignore`（→27） | src/topics/19-async-submit/react/Example.tsx:63-66; src/topics/19-async-submit/vue/Example.vue:56-59 | 七、生产环境注意 |
| R2-19-6 | 19 | 未讲 | 无「前端防重复 ≠ 幂等」：服务端幂等键 / 唯一约束是最终防线；错误提示无 `role="alert"` / `aria-describedby`（→35） | — | 七、生产环境注意 |
| R2-20-3 | 20 | 未标简化 | 只讲「关键区域局部兜底」，无根边界：未捕获的渲染错误会让 React 移除整棵 UI；生产需根边界 + 局部边界 + fallback 重试 / `resetKeys`；fallback 写死虽自标但无生产形态 | src/topics/20-error-handling/react/Example.tsx:23 | 七、生产环境注意 |
| R2-21-11 | 21 | 未标简化 | 演示用 useRef 自增 id、`amount` 不联动已注明，但未给生产做法：state 类型加 `readonly` / `ReadonlyArray` 编译期挡 `push` / `sort`；服务端数据不在 state 里原地排序，派生排序在渲染时算或 useMemo | src/topics/21-immutable-update/react/Example.tsx:67-69 | 七、生产环境注意 |
| R2-22-3 | 22 | 未标简化 | 每次请求先清空数据（status: 'loading'）导致翻页 / 筛选时表格消失再出现；未说明这是演示简化，也没给「保留上页数据 + isFetching」或 placeholderData: keepPreviousData 的生产做法 | src/topics/22-integrated-order-page/react/Example.tsx:59 | 七、生产环境注意 |
| R2-22-7 | 22 | 未标简化 | effect 手写请求未标「演示简化」，生产三种写法（A TanStack useQuery + useMutation + invalidate；B 路由 loader / action + useFetcher 自动 revalidate；C React 19 Actions）一个都没提示 | src/topics/22-integrated-order-page/react/Example.tsx:20 | 七、生产环境注意 |
| R2-23-8 | 23 | 未标简化 | 渲染期 console.log 数渲染次数是演示手段，未标「演示简化」，也没给生产做法（React DevTools Profiler，17） | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:134 | 七、生产环境注意 |
| R2-24-9 | 24 | 未标简化 | 探针 effect 同步 setState 命中 `react-hooks/set-state-in-effect` | src/topics/24-batching-and-functional-updates/react/Example.tsx:281-284 | 七、生产环境注意 |
| R2-26-9 | 26 | 未标简化 | 轮询用手写 setInterval + fetch 未标「演示简化」，生产优先 TanStack Query `refetchInterval`（→ 30）；WebSocket / SDK 场景只在注释一句带过 | src/topics/26-stale-closures/react/Example.tsx:423; src/topics/26-stale-closures/react/Example.tsx:520 | 七、生产环境注意 |
| R2-27-10 | 27 | 未标简化 | 真实 fetch / axios 的取消写法未示范：`fetch(url, { signal })` + `response.ok`、axios 的 `signal` 与 `axios.isCancel`；mockApi 的 isAbortError 依赖 DOMException 未标「演示简化」 | src/topics/27-async-race-and-cancellation/react/Example.tsx:354 | 七、生产环境注意 |
| R2-30-11 | 30 | 未标简化 | 演示简化未标：mockApi 直接 throw（真实 fetch 须检查 response.ok 再 throw）；每次进入新建 QueryClient + retry:false / staleTime 5s 是演示配置；SSR 下 QueryClient 必须每请求新建（模块级会跨用户共享）+ dehydrate / HydrationBoundary（→ 33） | src/topics/30-tanstack-query-server-state/react/Example.tsx:156; :92 | 七、生产环境注意 |

#### 其它（5）

| 编号 | 题 | 类型 | 要点 | 位置 | 建议落点 |
|---|---|---|---|---|---|
| R2-10-2 | 10 | 未标简化 | Effect 内同步 `setLoading(true)` 会命中 react-hooks 7 `recommended` 的 `set-state-in-effect`（error），课件未提该规则、多一轮 render 的代价与例外（值来自 ref） | src/topics/10-effects-and-lifecycle/react/Example.tsx:291 | 六、易错点 |
| R2-11-10 | 11 | 未标简化 | Effect 内同步 `setState({ status: 'loading' })` 会命中 react-hooks 7 `recommended` 的 `set-state-in-effect`（error），课件未提 | src/topics/11-api-request-state/react/Example.tsx:61 | 六、易错点 |
| R2-14-3 | 14 | 未标简化 | 切换 `recommended` 后 `setLoading(true)` 命中 `react-hooks/set-state-in-effect`（error）；课件未说明这是演示写法及生产替代 | src/topics/14-composable-and-custom-hook/react/Example.tsx:114 | 七、生产环境注意 |
| R2-22-9 | 22 | 缺标签 | effect 里 `void loadOrders()` 第一行同步 setListState({ status: 'loading' })，切到 eslint-plugin-react-hooks 7 recommended 后 set-state-in-effect（error）可能命中；未提示改法（初始 state 直接 loading / 把请求交给库） | src/topics/22-integrated-order-page/react/Example.tsx:58-59 | 六、易错点 |
| R2-27-11 | 27 | 未标简化 | Effect 内同步 setState（:200 idle、:207 loading、:208 经 log() 的 setLines）会命中 react-hooks 7 `recommended` 的 `set-state-in-effect`（error），课件未提 | src/topics/27-async-race-and-cancellation/react/Example.tsx:200; src/topics/27-async-race-and-cancellation/react/Example.tsx:207 | 六、易错点 |

### 2.4 小问题（57，折叠）

<details><summary>展开小问题清单</summary>

| 编号 | 题 | 类型 | 要点 | 位置 |
|---|---|---|---|---|
| R2-01-11 | 01 | 措辞 | 「没有一一对应关系」模板残留；「React 没有任何模板语法」「一次只能返回单个根节点」绝对化（返回带 key 的数组也合法）；「Vue 模板里没有等价写法」应补一句 Vue 也支持 JSX | src/topics/01-component-and-jsx/react/Example.tsx:63; src/topics/01-component-and-jsx/react/Example.tsx:19; src/topics/01-component-and-jsx/react/Example.tsx:7; src/topics/01-component-and-jsx/react/Example.tsx:69; src/topics/01-component-and-jsx/vue/Example.vue:78; src/topics/01-component-and-jsx/vue/Example.vue:20 |
| R2-02-7 | 02 | 措辞 | react:120「12 题…不展开 ref 透传」与主责冲突：ref 透传 / useImperativeHandle / ref 回调清理主责 12，`ComponentProps` 与 ref-as-prop 类型主责 28；应改成一句「详见 12 / 28」 | src/topics/02-props/react/Example.tsx:120 |
| R2-02-11 | 02 | 措辞 | 「没有一一对应关系」模板残留 ×4；「根本不存在」「唯一手段」「永远」等绝对化；「SFC…子组件必须放单独的 .vue 文件」可放宽（`defineComponent` + `h` 亦可内联） | src/topics/02-props/react/Example.tsx:31; src/topics/02-props/react/Example.tsx:106; src/topics/02-props/vue/UiButton.vue:32; src/topics/02-props/react/Example.tsx:32; src/topics/02-props/react/Example.tsx:104; src/topics/02-props/react/Example.tsx:146; src/topics/02-props/react/Example.tsx:19 |
| R2-03-9 | 03 | 措辞 | 模板残留「（没有一一对应关系）」7 处；「统一解法都是函数式更新」「稳赢」「根本不存在」 | src/topics/03-state/react/Example.tsx:63; src/topics/03-state/react/Example.tsx:19-20; src/topics/03-state/react/Example.tsx:68; src/topics/03-state/react/Example.tsx:239; src/topics/03-state/react/Example.tsx:336; src/topics/03-state/vue/Example.vue:20-21; src/topics/03-state/vue/Example.vue:86; src/topics/03-state/vue/Example.vue:102 |
| R2-03-10 | 03 | 措辞 | 跨组件状态只指向 16，漏 25（状态提升）/ 15（Context）；reducer 未 export 却说可单测 | src/topics/03-state/react/Example.tsx:159; src/topics/03-state/react/Example.tsx:232 |
| R2-04-11 | 04 | 措辞 | 「没有一一对应关系」模板残留 ×3；react:46「常用属性…与原生一致」应限定 currentTarget（委托下可能不同）；react:104「死循环警告」实际是抛出 "Too many re-renders" 错误 | src/topics/04-events/react/Example.tsx:21; src/topics/04-events/react/Example.tsx:57; src/topics/04-events/vue/Example.vue:22; src/topics/04-events/react/Example.tsx:46; src/topics/04-events/react/Example.tsx:104 |
| R2-05-10 | 05 | 措辞 | 「没有一一对应关系」模板残留 ×6；react:7「false/null/undefined 才不渲染」漏了 `true`（react:109 已补全，两处应一致）；react:134「只能手动控制 style 的 display」绝对化 | src/topics/05-conditional-rendering/react/Example.tsx:16; src/topics/05-conditional-rendering/react/Example.tsx:122; src/topics/05-conditional-rendering/react/Example.tsx:133; src/topics/05-conditional-rendering/vue/Example.vue:17; src/topics/05-conditional-rendering/vue/Example.vue:118; src/topics/05-conditional-rendering/vue/Example.vue:133; src/topics/05-conditional-rendering/react/Example.tsx:7; src/topics/05-conditional-rendering/react/Example.tsx:134 |
| R2-06-8 | 06 | 措辞 | 「第 N 题」未补零 ×10；「把 state 提升到父组件（第 8 题）」应指向 25（08 自己也把状态提升指向 25）；路由参数 `/orders/o1 → /orders/o2` 实例复用未指向 18；第 10 题引用成立 | src/topics/06-list-and-key/react/Example.tsx:93; src/topics/06-list-and-key/react/Example.tsx:169; src/topics/06-list-and-key/react/Example.tsx:236; src/topics/06-list-and-key/react/Example.tsx:239-240; src/topics/06-list-and-key/vue/Example.vue:49; src/topics/06-list-and-key/vue/Example.vue:123; src/topics/06-list-and-key/vue/Example.vue:201; src/topics/06-list-and-key/vue/Example.vue:203-204 |
| R2-06-9 | 06 | 措辞 | react:24 把「退化为按 index 匹配」与 Vue「就地更新」写成差异，实际两边默认都按位置复用；react:25 / vue:190「一模一样」「完全一致」绝对化；react:10「永不增删」过严（只在末尾追加 / 删除时 index 不错位） | src/topics/06-list-and-key/react/Example.tsx:24; src/topics/06-list-and-key/react/Example.tsx:25; src/topics/06-list-and-key/vue/Example.vue:190; src/topics/06-list-and-key/react/Example.tsx:10 |
| R2-07-8 | 07 | 措辞 | 「没有一一对应关系」贴在已给出对应关系（`v-model` ↔ `value` + `onChange`）的句后；react-hook-form「输入时根本不 setState」绝对化（订阅到 formState 时仍重渲染） | src/topics/07-forms/react/Example.tsx:35; :18; :106; src/topics/07-forms/vue/Example.vue:36; :145; :19 |
| R2-08-10 | 08 | 措辞 | 模板残留「没有一一对应关系」与「React 根本不知道 / 完全没有对应物」 | src/topics/08-parent-child-communication/react/Example.tsx:22; src/topics/08-parent-child-communication/vue/Example.vue:23; src/topics/08-parent-child-communication/vue/ProductItem.vue:14; src/topics/08-parent-child-communication/react/Example.tsx:11; src/topics/08-parent-child-communication/vue/Example.vue:12 |
| R2-08-11 | 08 | 措辞 | 交叉引用只有 25；应加 02（props 只读）、04（事件）、07（v-model / 受控 input）、09（不镜像 props）、17（useCallback）、24（批处理）、31（Actions） | src/topics/08-parent-child-communication/react/Example.tsx:24-25 |
| R2-09-9 | 09 | 措辞 | 模板残留「没有一一对应关系」4 处 | src/topics/09-derived-state/react/Example.tsx:21; src/topics/09-derived-state/react/Example.tsx:69; src/topics/09-derived-state/vue/Example.vue:22; src/topics/09-derived-state/vue/Example.vue:59 |
| R2-09-10 | 09 | 措辞 | 全题零交叉引用；应指向 17（memo / useCallback / Compiler）、06（key 重置）、02（props）、25（提升）、29（reducer 事件里算）、30（Query `select`） | src/topics/09-derived-state/react/Example.tsx:7-8 |
| R2-10-10 | 10 | 措辞 | 「在 Vue 里根本不存在 / 压根没有这个概念 / 依赖写全永远是对的」与模板残留「没有一一对应关系」9 处 | src/topics/10-effects-and-lifecycle/react/Example.tsx:21; src/topics/10-effects-and-lifecycle/react/Example.tsx:31; src/topics/10-effects-and-lifecycle/react/Example.tsx:176; src/topics/10-effects-and-lifecycle/react/Example.tsx:316; src/topics/10-effects-and-lifecycle/vue/IntervalCounter.vue:9 |
| R2-10-11 | 10 | 措辞 | 新增题落点未指：数据获取替代 → 11 / 30、订阅外部 store → 14、SSR → 33、Suspense / use → 32；「Dan Abramov 文章」非官方来源 | src/topics/10-effects-and-lifecycle/react/Example.tsx:206 |
| R2-11-9 | 11 | 措辞 | 竞态处理指向 10 而非主责题 27；StrictMode 双请求未指向 10；防重复提交（disabled）未指向 19；批处理未指向 24；`<form>` 提交未指向 31 | src/topics/11-api-request-state/react/Example.tsx:56; src/topics/11-api-request-state/react/Example.tsx:65 |
| R2-11-11 | 11 | 措辞 | 「两边一模一样 / 完全一致」等绝对化措辞 | src/topics/11-api-request-state/react/Example.tsx:16; src/topics/11-api-request-state/vue/Example.vue:25 |
| R2-12-10 | 12 | 缺标签 | 无成熟度标签：ref-as-prop 未标 19.0 起【主流】、Fragment refs（19.3）【尝鲜】一句缺失、useTemplateRef 缺 3.5 版本标签 | — |
| R2-12-11 | 12 | 措辞 | 模板残留「没有一一对应关系」4 处，其中 :41 / vue:34 贴在「选择题是 React 特有的」之后属机械套用 | src/topics/12-dom-ref/react/Example.tsx:13; src/topics/12-dom-ref/react/Example.tsx:41; src/topics/12-dom-ref/vue/Example.vue:14; src/topics/12-dom-ref/vue/Example.vue:34 |
| R2-13-9 | 13 | 讲错 | `{footer && …}` 对 `ReactNode` 类型判空有 0 陷阱：`footer={0}` 会在容器外渲染 "0"，应 `footer != null &&` 或 `footer ?? null`（05 已讲） | src/topics/13-slots-and-children/react/Example.tsx:48 |
| R2-14-9 | 14 | 措辞 | 「两个约束不同源，没有一一对应关系」同一句逐字重复 4 处，模板残留共 6 处 | src/topics/14-composable-and-custom-hook/react/Example.tsx:22; src/topics/14-composable-and-custom-hook/react/Example.tsx:58; src/topics/14-composable-and-custom-hook/vue/Example.vue:23; src/topics/14-composable-and-custom-hook/vue/Example.vue:37; src/topics/14-composable-and-custom-hook/vue/useDebouncedValue.ts:25; src/topics/14-composable-and-custom-hook/vue/useWindowWidth.ts:23 |
| R2-14-10 | 14 | 措辞 | 「依赖 []：订阅一次即可，永远不需要重跑」与同文件 :26-27「StrictMode 会跑两遍」自相矛盾；「调用姿势与 React 完全一致」忽略了 Hooks 规则 | src/topics/14-composable-and-custom-hook/react/useWindowWidth.ts:19; src/topics/14-composable-and-custom-hook/vue/DebouncedUserSearch.vue:18 |
| R2-14-11 | 14 | 缺标签 | 无成熟度标签；`useDebouncedValue` 未标「自实现（react.dev 无官方防抖 Hook）」；`useSyncExternalStore` 应标 18 起【主流】 | — |
| R2-15-9 | 15 | 措辞 | 模板残留「没有一一对应关系」；「根本不存在这个问题」「组件永远不直接 useContext」 | src/topics/15-context/react/Example.tsx:23; src/topics/15-context/vue/Example.vue:24; src/topics/15-context/react/Example.tsx:136; src/topics/15-context/react/Example.tsx:52 |
| R2-15-10 | 15 | 措辞 | 只指向 16；应加 13（children 组合）、17（memo 边界）、29（reducer + context）、33（RSC 里 context 只在 client）、34（测试 wrapper） | src/topics/15-context/react/Example.tsx:9-10 |
| R2-16-11 | 16 | 措辞 | 模板残留「没有一一对应关系」；「action 引用永远稳定 / 永远不会触发更新」在 `set(x, true)` 或 `setState` 覆盖 actions 时不成立 | src/topics/16-global-state/react/cartStore.ts:85; src/topics/16-global-state/vue/cartStore.ts:20; src/topics/16-global-state/react/Example.tsx:50-51 |
| R2-16-12 | 16 | 措辞 | 已有 08 / 09 / 15 / 25 / 30 均成立；缺 14（useSyncExternalStore）、18（URL）、21（不可变）、33（SSR）、34（测试）、35（persist 与 token） | src/topics/16-global-state/react/Example.tsx:14 |
| R2-17-9 | 17 | 措辞 | 文件头「知道有这回事即可，不展开」与本题主责冲突；模板残留「没有一一对应关系」；无成熟度标签 | src/topics/17-performance-hooks/react/Example.tsx:14; src/topics/17-performance-hooks/vue/Example.vue:15; src/topics/17-performance-hooks/react/Example.tsx:25; src/topics/17-performance-hooks/vue/Example.vue:26 |
| R2-18-12 | 18 | 措辞 | 模板残留「（没有一一对应关系）」11 处；交叉引用需补 32 / 35，且 :486 的「（17 题）」应为 15 题（Context value 用 useMemo 的内容在 src/topics/15-context/react/Example.tsx:128-138，17 题无 Context 内容；本轮首版误记为核对无误，第 4 步对比时纠正）；Activity 缺【较新】标签 | src/topics/18-routing/react/Example.tsx:31; src/topics/18-routing/react/Example.tsx:145; src/topics/18-routing/react/Example.tsx:203; src/topics/18-routing/react/Example.tsx:372; src/topics/18-routing/react/Example.tsx:426; src/topics/18-routing/react/Example.tsx:489; src/topics/18-routing/vue/router.ts:18; src/topics/18-routing/vue/router.ts:50; src/topics/18-routing/vue/OrderDetailPage.vue:54; src/topics/18-routing/vue/SettingsPage.vue:14; src/topics/18-routing/vue/Example.vue:32; src/topics/18-routing/react/Example.tsx:468; src/topics/18-routing/react/Example.tsx:486 |
| R2-19-8 | 19 | 措辞 | 只引用 07，未引用 20 / 27 / 30 / 31；标题「工业界标准写法」在 19 有 Actions 后宜改为「手写写法【主流】，与 Actions 并列」 | src/topics/19-async-submit/react/Example.tsx:2 |
| R2-20-6 | 20 | 措辞 | 「React 中唯一仍需要 class 组件的场景」绝对化（`getSnapshotBeforeUpdate` 同样无函数等价物）；「没有一一对应关系」贴在已给出对应物的句后 | src/topics/20-error-handling/react/Example.tsx:5; :17; src/topics/20-error-handling/react/ErrorBoundary.tsx:2; :20; src/topics/20-error-handling/vue/Example.vue:6; :42 |
| R2-20-7 | 20 | 未讲 | 20 无任何交叉引用，也无人引用它：应加 →18（`errorElement`）、→31（Action 错误）、→32（`use` / `lazy`）；19 / 27 / 31 / 32 应回指 20 | — |
| R2-21-10 | 21 | 措辞 | 「三大数组模式」(:7) 与「五种模式一次讲全」(:12) 数量打架；`useState(() => structuredClone(…))` 用了惰性初始化却未解释、未指向 03；「最根本的分歧」绝对化 | src/topics/21-immutable-update/react/Example.tsx:7; src/topics/21-immutable-update/react/Example.tsx:12; src/topics/21-immutable-update/react/Example.tsx:21; src/topics/21-immutable-update/react/Example.tsx:65 |
| R2-22-11 | 22 | 措辞 | 「两边完全一样」「与 React 写法一一对应」——行级状态建模（4 布尔 vs reactive 对象）、竞态处理（cleanup vs 模块变量）两边并不完全相同 | src/topics/22-integrated-order-page/react/Example.tsx:18; :15; src/topics/22-integrated-order-page/vue/Example.vue:19; :16 |
| R2-23-9 | 23 | 措辞 | 模板残留「没有一一对应关系」7 处；「Vue 根本没有…这个概念」「稳赢」 | src/topics/23-rendering-and-state-snapshot/react/Example.tsx:20; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:57; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:139; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:161; src/topics/23-rendering-and-state-snapshot/react/Example.tsx:183; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:23; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:97; src/topics/23-rendering-and-state-snapshot/vue/Example.vue:123 |
| R2-23-10 | 23 | 未讲 | 「state 存在组件函数之外（React 内部），每次调用 useState 返回该次渲染的快照」未明说 | — |
| R2-24-11 | 24 | 措辞 | 「永远不会画到屏幕上」等绝对化 + 「没有一一对应关系」模板残留 7 处 | src/topics/24-batching-and-functional-updates/react/Example.tsx:10; src/topics/24-batching-and-functional-updates/react/Example.tsx:258; src/topics/24-batching-and-functional-updates/vue/Example.vue:11; src/topics/24-batching-and-functional-updates/vue/Example.vue:46; src/topics/24-batching-and-functional-updates/react/Example.tsx:19; src/topics/24-batching-and-functional-updates/react/Example.tsx:153; src/topics/24-batching-and-functional-updates/vue/Example.vue:20; src/topics/24-batching-and-functional-updates/vue/Example.vue:69; src/topics/24-batching-and-functional-updates/vue/Example.vue:129; src/topics/24-batching-and-functional-updates/vue/Example.vue:196 |
| R2-24-12 | 24 | 缺标签 | React 17 差异段无【旧写法】标签、无版本号；全文无成熟度标签 | src/topics/24-batching-and-functional-updates/react/Example.tsx:11; src/topics/24-batching-and-functional-updates/react/Example.tsx:259-260; src/topics/24-batching-and-functional-updates/react/Example.tsx:295; src/topics/24-batching-and-functional-updates/vue/Example.vue:12 |
| R2-25-7 | 25 | 措辞 | 模板残留「没有一一对应关系」；「React 没有任何机制」「永远一致 / 永远同步」等绝对化 | src/topics/25-state-ownership-and-lifting/react/Example.tsx:39; src/topics/25-state-ownership-and-lifting/vue/Example.vue:42; src/topics/25-state-ownership-and-lifting/react/Example.tsx:13; src/topics/25-state-ownership-and-lifting/react/Example.tsx:250; src/topics/25-state-ownership-and-lifting/react/Example.tsx:184; src/topics/25-state-ownership-and-lifting/react/Example.tsx:290 |
| R2-25-8 | 25 | 措辞 | 「换 key 重置 → 10 题」「组件类型切换的 diff 规则 → 10 题」编号存疑：course-map 中 key 强制重置主责 06、渲染模型主责 23；另缺 13（children 组合）、15（Context 场景）、18（URL）、30（Query） | src/topics/25-state-ownership-and-lifting/react/Example.tsx:268; src/topics/25-state-ownership-and-lifting/react/Example.tsx:415 |
| R2-26-7 | 26 | 措辞 | 模板残留「没有一一对应关系」6 处 | src/topics/26-stale-closures/react/Example.tsx:26; src/topics/26-stale-closures/react/Example.tsx:132; src/topics/26-stale-closures/react/Example.tsx:498; src/topics/26-stale-closures/vue/Example.vue:25; src/topics/26-stale-closures/vue/Example.vue:78; src/topics/26-stale-closures/vue/Example.vue:196 |
| R2-26-8 | 26 | 措辞 | 引用 06 / 07 / 10 / 12 / 17 / 23 / 24 / 27 / 30 均成立；但「10 题手写的 latest ref 就是它的原理」「10 题修法三」依赖 10 题保留修法三，10 题重写时需联动 | src/topics/26-stale-closures/react/Example.tsx:17; src/topics/26-stale-closures/react/Example.tsx:149 |
| R2-26-10 | 26 | 缺标签 | 两处 `eslint-disable-next-line` 是刻意错误示范，已有警告语但未标【旧写法】、未引官方「大多数用户这样做会导致 bug」 | src/topics/26-stale-closures/react/Example.tsx:264; src/topics/26-stale-closures/react/Example.tsx:430 |
| R2-26-11 | 26 | 缺标签 | 无成熟度标签体系（useEffectEvent 应标【较新】、latest ref 应标【旧写法】/ 社区惯用法） | — |
| R2-27-9 | 27 | 措辞 | 交叉引用缺 14（防抖）、19（提交防重复）、32（useDeferredValue）、18（loader signal）；模板残留「没有一一对应关系」6 处；「永远不会 / 永远等不到」应限定「只要 cleanup 写对」 | src/topics/27-async-race-and-cancellation/react/Example.tsx:36; src/topics/27-async-race-and-cancellation/react/Example.tsx:107; src/topics/27-async-race-and-cancellation/react/Example.tsx:397; src/topics/27-async-race-and-cancellation/vue/Example.vue:37; src/topics/27-async-race-and-cancellation/vue/Example.vue:236 |
| R2-28-12 | 28 | 措辞 | 模板残留「（没有一一对应关系）」7 处；「本项目 22 道旧题」过时计数；`satisfies` 未标 TS 4.9 起；`useId` 只作引用却未提（course-map §2）；「它至今也写不出泛型组件」宜改「不能直接声明泛型组件」；生产提示宜补「取有类型元素优先 currentTarget」 | src/topics/28-react-typescript-basics/react/Example.tsx:32; :663; src/topics/28-react-typescript-basics/vue/Example.vue:33; :425; src/topics/28-react-typescript-basics/vue/OrderCard.vue:11; src/topics/28-react-typescript-basics/vue/OrderFilterForm.vue:11; :46; src/topics/28-react-typescript-basics/react/Example.tsx:39; :77-78; :260 |
| R2-29-9 | 29 | 措辞 | 「本项目没有装测试框架」将随 34 题过期；Vue 对照缺 Pinia `$patch` 指向 16 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:89 |
| R2-29-10 | 29 | 措辞 | 「根本写不出来」「永远」「没有一一对应关系」等 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:32; src/topics/29-use-reducer-and-action-types/react/Example.tsx:195; src/topics/29-use-reducer-and-action-types/react/Example.tsx:390; src/topics/29-use-reducer-and-action-types/react/Example.tsx:21; src/topics/29-use-reducer-and-action-types/vue/Example.vue:22; src/topics/29-use-reducer-and-action-types/vue/Example.vue:171 |
| R2-29-11 | 29 | 缺标签 | 全文无成熟度标签 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:2; src/topics/29-use-reducer-and-action-types/vue/Example.vue:3 |
| R2-30-12 | 30 | 措辞 | 模板残留「（没有一一对应关系）」×4；「React 本身只有 useState / useEffect」忽略 use / Suspense；「为了保持两侧对称没有装 devtools」不准（Vue 也有 @tanstack/vue-query-devtools） | src/topics/30-tanstack-query-server-state/react/Example.tsx:221; :435; :5; :222; src/topics/30-tanstack-query-server-state/vue/Example.vue:173; :445; :6 |
| R2-31-8 | 31 | 未讲 | 与 React Router `<Form>` + route `action` 的区分（→18）【较新】、19.3 `submitter` / `onReset`【尝鲜】、Vue 对照（无 Actions；错误进边界 vs `onErrorCaptured`，→19 / 20）均无落点 | — |
| R2-32-11 | 32 | 措辞 | 术语撞车：30 题 `isPending`（TanStack「无缓存」）、27 题「并发」（并发请求）与 32 的 `isPending` / 并发渲染同名不同义，32 需一句区分并回指 | src/topics/30-tanstack-query-server-state/react/Example.tsx:14; src/topics/27-async-race-and-cancellation/react/Example.tsx:172 |
| R2-33-12 | 33 | 缺标签 | 20 题「不能捕获 SSR」只列名词无定义；30 题「服务端状态」易与服务端渲染混淆；07 / 19 提 `useActionState` 未与 Server Functions 关联 | src/topics/20-error-handling/react/ErrorBoundary.tsx:16; src/topics/20-error-handling/react/Example.tsx:9; src/topics/30-tanstack-query-server-state/react/Example.tsx:8; src/topics/07-forms/react/Example.tsx:20; src/topics/19-async-submit/react/Example.tsx:10 |
| R2-34-12 | 34 | 缺标签 | 29 展示 `expect(...).toEqual(...)` 形态并自注「本项目没有装测试框架」；03 / 28 / 29 vue 只说「可单测」；30 题练习无可断言结论 | src/topics/29-use-reducer-and-action-types/react/Example.tsx:87-89; src/topics/03-state/react/Example.tsx:159; src/topics/28-react-typescript-basics/react/Example.tsx:114; src/topics/29-use-reducer-and-action-types/vue/Example.vue:77 |
| R2-35-9 | 35 | 缺标签 | 现有题里的 a11y 演示未标注：04 `<div onClick>` 冒泡演示、07 placeholder 作提示、01 只讲属性改名 | src/topics/04-events/react/Example.tsx:76; src/topics/07-forms/react/Example.tsx:172; src/topics/01-component-and-jsx/react/Example.tsx:90 |
| R2-35-10 | 35 | 措辞 | 18 / 19 / 28 里的安全相关句应指向 35 | src/topics/18-routing/react/Example.tsx:237; src/topics/19-async-submit/react/Example.tsx:50; src/topics/28-react-typescript-basics/react/Example.tsx:94 |

</details>

## 3. 主线判定

> 口径：**主线** = 该题主代码采用的写法；**并排** = 同为【主流】或【较新】、在同一题里以第二段代码或对照表出现、面试必须能答的写法；**【旧写法】** 只用于读懂存量代码。依据三项：① 官方文档定位原文（各题 `evidence` 文件逐字摘录，抓取日 2026-09-16）；② 采用情况（npm 周下载，2026-09-05 至 09-11，见 §0 来源清单；大版本份额取自 `AUDIT.md` §2.1）；③ 面试现实（高频问法）。规格预设与官方定位不一致之处已列入 §6，不直接采用。

### 3.1 · 18 路由：主线 Data 模式，声明式 + RequireAuth 并排（维持已定决定）

- **主线**：Data 模式 —— `createMemoryRouter`（演示）/ `createBrowserRouter`（生产）+ `RouterProvider`（从 `react-router/dom` 导入）+ `loader` / `useLoaderData` + `errorElement` + 守卫用 route `middleware`（7.18.3 Data 模式无需 future flag）或 loader 里 `throw redirect()`。
- **并排**：声明式 `<BrowserRouter><Routes><Route element>` + `RequireAuth` 三态包装组件，标【主流】而非旧写法。
- **依据**：
  - 官方定位（reactrouter.com/7.18.4/start/modes，逐字）："Use Data Mode if you: want data features but also want to have control over bundling, data, and server abstractions / started a data router in v6.4 and are happy with it"；"Use Declarative Mode if you: want to use React Router as simply as possible / are coming from v6 and are happy with the `<BrowserRouter>` / have a data layer that either skips pending states … or has its own abstractions for them"。官方没有把声明式称为过时；「自己有数据层（如 TanStack Query）」时声明式是官方认可的路径 —— 这正是并排的理由，也是 18 题与 30 题必须交叉说明的一点（Data 模式 loader 取数 vs 声明式 + TanStack Query，两种组合都是【主流】）。
  - 能力边界（同页逐字）："Declarative mode enables basic routing features like matching URLs to components, navigating around the app, and providing active states"；"By moving route configuration outside of React rendering, Data Mode adds data loading, actions, pending states and more with APIs like `loader`, `action`, and `useFetcher`"。面试高频的「路由守卫 / 渲染前拦截 / pending 状态 / 离开确认」只有 Data 模式能完整回答，这是选它作主线的核心理由。
  - 采用：react-router 37.9M + react-router-dom 30.8M / 周；v7 41.4%、v6 39.2%（`AUDIT.md` §2.1）。同一包无法区分两种模式的份额；Data 模式的 loader / action API 与 Framework 模式（Remix 后继，官方给新手的默认推荐）同构，学一次两处可用；声明式是 v6 存量项目的现状，面试仍会问。
  - v6 已官方 EOL（remix.run/blog/react-router-v8 逐字："officially marking React Router v6 and Remix v2 as End of Life"），`react-router-dom` 在 v8 被删除 → 导入路径 v6【旧写法】→ v7 `react-router` + `react-router/dom`（主线）→ v8【尝鲜】。
- **对规格 §6 十三条修改点的影响**（批次 G 逐条核对，见 §1 18 题末尾的核对表）：随主线调整 5 条 —— #1 导入（Data 模式启动代码成为主代码）、#2「最重要的区别」改写为「渲染前拦截（Data / Vue beforeEach）vs 渲染中拦截（声明式）」且主线站在渲染前一侧、#3 loader `throw redirect` + middleware 从「加分点」升为主线写法、#4 三态检查改为在 loader / middleware 里 `await`（RequireAuth 三态作并排）、#10 `safeRedirect` 校验落到 loader / action；其余 8 条与主线无关照做。壳应用的 `isolateReactRoot` + `ReactIsolatedMount` 仍然需要：`RouterProvider` 内部同样渲染 `<Router>` 并受「不能嵌套 Router」的 invariant 约束（`node_modules/react-router/dist/development/chunk-BV7QT456.mjs:6991,7143`）。

### 3.2 · 07 / 19 / 31 表单提交：受控 + 手写 submitting 与 Actions 并列【主流】

- **主线**：07 = 受控（`value` + `onChange`）与非受控（`defaultValue` + `FormData`）两种基础写法；19 = 手写 `submitting` 状态 + 防重复（`useState` + ref 锁）；31（新题）= Actions 家族（`<form action={fn}>` + `useActionState` + `useFormStatus` + `useOptimistic` + async `startTransition`）。
- **并排**：07 / 19 各用一段指向 31（「React 19 起可以这样写」，`useTransition` / `useActionState` 的 `isPending` 作为 19 的并排写法）；31 里说明与受控组件的组合（受控字段不会被 Action 自动 reset）与 React 18 不可用。
- **依据**：
  - 官方定位：input 页逐字 "**To render a _controlled_ input, pass the `value` prop to it**" —— 受控仍是标准写法；form 页用法**首节**仍是 "Handle form submission with an event handler"（`onSubmit` + `e.preventDefault()`），Actions 节在其后；React 19 博客逐字 "Actions automatically manage submitting data for you"（pending / optimistic / error / forms 四条）。两套写法在官方文档里是**并列**关系，不是替代。
  - 采用：React 19 占 71.3% 但 React 18 仍 24.7%（`AUDIT.md` §2.1），Actions 在 18 不可用；react-hook-form 40.0M / 周（约为 react 的 31%）是表单工程化的事实标准，其内部就是非受控 + ref —— 说明「不靠 Actions 的表单写法」在生产里仍是主体。
  - 面试现实：「受控 vs 非受控」是表单最高频题；「`useActionState` / `useFormStatus` 是什么、`useFormState` 为什么改名」是 19 新题。两者都要能答。
- **标签口径**：07 / 19 的「八、旧写法对照」只放 React 18 差异（`useFormState` → `useActionState` 更名、无 `<form action>`），**不把手写 submitting 标成【旧写法】**。31 的旧写法段放 `useFormState`【旧写法】。

### 3.3 · 11 / 30（与 22）数据获取：教学用 effect 手写讲状态与竞态，生产默认 TanStack Query；loader 作 Data 模式并排；`use(promise)` 只作【较新】引用

- **主线**：11 = 在 Effect 里手写请求，讲透「四态建模（判别联合）+ 竞态 + 取消 + 重试」，**文件头明确标「教学用；生产用缓存层，见 30」**；30 = TanStack Query v5【主流】作为生产默认；22 综合页保持 effect 手写但「七、生产环境注意」写明三种生产改写（TanStack / 路由 loader + action + `useFetcher` / Actions）。
- **并排**：路由 loader（Data 模式，指向 18）；`use(promise)` + `Suspense` 标【较新】只作引用（指向 32），并说明客户端需自建 promise 缓存。
- **依据**：
  - 官方定位（react.dev useEffect 页逐字）："Writing `fetch` calls inside Effects is a popular way to fetch data, especially in fully client-side apps. This is, however, a very manual approach and it has significant downsides"（四条：不在服务端运行 / 瀑布 / 无预载与缓存 / 不符合人体工学）；"**If you use a framework, use its built-in data fetching mechanism. Otherwise, consider using or building a client-side cache.** Popular open source solutions include TanStack Query, useSWR, and React Router 6.4+"；"You can continue fetching data directly in Effects if neither of these approaches suit you"。—— 手写被允许但被明确列为「有显著缺点」，课件不能再把它当唯一写法。
  - `use(promise)` 的前提（use 页逐字）："Promises created in Client Components are recreated on every render" / "Promises passed to `use` must be cached"；Suspense 页 "Suspense does not detect when data is fetched inside an Effect or event handler"。纯客户端项目没有框架 / 缓存层时，`use(promise)` 不成体系 → 只作【较新】引用。
  - 采用：@tanstack/react-query 45.6M / 周（约为 react 的 36%，v5 占 96.5%），swr 12.6M；TanStack Query 是客户端缓存层的事实标准。
  - 面试现实：「useEffect 里请求数据有什么问题」「React Query 解决什么、staleTime 是什么」「loader 和 Query 的关系」三问必答；11 题的手写版本正是回答第一问的现场。
- **待用户决定**（§6）：22 综合页是否在阶段 2 直接迁到 TanStack Query（改动最大，但能把「生产写法」落到代码而不只是注释）。

### 3.4 · 14 订阅外部系统：`useSyncExternalStore` 作主线，`useEffect` + `setState` 订阅作过渡对照

- **主线**：`useWindowWidth` 一类「订阅浏览器 API」的自定义 Hook 用 `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`；防抖 Hook 仍用 `useEffect`（它不是外部 store）。
- **并排**：`useEffect` + `setState` 订阅写法作对照，标为「18 之前的写法 / 简单场景仍可用」，并说明并发渲染下的撕裂问题与 SSR 快照。
- **依据**：
  - 官方定位（you-might-not-need-an-effect 逐字）："React has a purpose-built Hook for subscribing to an external store that is preferred instead. Delete the Effect and replace it with a call to `useSyncExternalStore`"；useSyncExternalStore 页把 "Browser APIs that expose a mutable value and events to subscribe to its changes" 列为两大场景之一；React 18 博客逐字 "It removes the need for useEffect when implementing subscriptions to external data sources"。同页也说 "When possible, we recommend using built-in React state" —— 这限定的是「不是外部 store 就别用」，窗口宽度恰是外部 store。
  - 采用（①）：zustand（`zustand/esm/react.mjs:6`）与 TanStack Query（`useBaseQuery.js:30`）内部都用 `useSyncExternalStore`；Hook 自 18.0（2022-03）稳定，满足【主流】阈值。
  - 面试现实：「useSyncExternalStore 是干什么的、和 useEffect 订阅有什么区别」是 18 新 Hook 的常见追问；`getSnapshot` 必须返回稳定引用是常考坑。

### 3.5 · 16 全局状态：Zustand 主线，Context + reducer 作 React 内置并排，Redux Toolkit 作存量对照

- **主线**：Zustand 5（`create` + selector + `useShallow`，动作放 store 内），对照 Pinia setup store（维持现状）。
- **并排**：Context + `useReducer`（React 内置方案，低频全局值 / 依赖注入用，与 15 题交叉）；Redux Toolkit 作【主流·存量】对照一节（概念 + 一段示意代码，不安装）；jotai / valtio / MobX 只提名字。
- **依据**：
  - 官方定位：react.dev passing-data-deeply-with-context 逐字 "Start by passing props" / "Extract components and pass JSX as children" / "If neither of these approaches works well for you, consider context"，Context 的官方状态管理场景是 reducer + context；useContext 页逐字 "Skipping re-renders with memo does not prevent the children receiving fresh context values" —— Context 不是高频更新 store 的工具。Zustand 自述 "You can use the hook anywhere, without the need of providers. Select your state and the consuming component will re-render when that state changes"；RTK 自述 "The official, opinionated, batteries-included toolset" / "intended to be the standard way to write Redux logic"。
  - 采用：zustand 40.9M / 周（约为 react 的 32%，v5 占 55.5%）> react-redux 27.0M / RTK 22.1M > jotai 4.2M > mobx-react-lite 2.7M > valtio 1.5M > recoil 0.3M。Zustand 已是第一，Redux 系仍有大量存量。
  - 面试现实：「Context 能不能当全局状态管理」「Zustand 和 Redux 的区别」「什么时候该上全局 store」三问必答，RTK 的 slice / immer 写法在存量项目面试里仍会被问。

### 3.6 · 20 错误边界：手写 class 作主线，`react-error-boundary` 作并排（需新增依赖）

- **主线**：手写 class `ErrorBoundary`（`static getDerivedStateFromError` + `componentDidCatch`），这是课程里「唯一的 class 场景」，面试要求能解释为什么必须是 class。
- **并排**：`react-error-boundary`（`ErrorBoundary` + `fallbackRender` + `onError` + `resetKeys` + `useErrorBoundary` 把事件 / 异步错误交给边界），标【主流】。
- **依据**：
  - 官方定位（react.dev Component 页逐字）："There is currently no way to write an Error Boundary as a function component. However, you don't have to write the Error boundary class yourself. For example, you can use `react-error-boundary` instead."；不能捕获列表（逐字）："Event handlers / Server side rendering / Errors thrown in the error boundary itself / Asynchronous code (e.g. `setTimeout` or `requestAnimationFrame` callbacks); **an exception is the usage of the `startTransition` function returned by the `useTransition` Hook**" —— 课件「异步一律不能捕获」必须补这个例外（与 31 题 Actions 错误进边界衔接）。React 19 起未捕获错误走 `window.reportError`、`createRoot` 提供 `onCaughtError` / `onUncaughtError`。
  - 采用：react-error-boundary 11.0M / 周（约为 react 的 9%）；**项目未安装**（`node_modules/react-error-boundary` 不存在）。
  - 面试现实：「为什么错误边界必须是 class」「能捕获什么不能捕获什么」必答；「用什么库」是加分。
- **待用户决定**（§6）：是否在阶段 1 安装 `react-error-boundary` 让并排示例可运行；不安装则并排只能是注释里的代码。

### 3.7 · 26 过期闭包：修法按优先级排列，`useEffectEvent` 保留主线并标【较新】，latest ref 作并排（维持已定决定）

- **主线**：修法优先级 —— ① 函数式更新 `setX(x => …)`【主流】→ ② 把响应式值写进依赖数组【主流】→ ③ `useEffectEvent`【较新，19.2 起稳定；需 eslint-plugin-react-hooks 7】→ ④ latest ref（`useRef` + Effect 同步）作并排。课件 26 用 `useEffectEvent` 作主线示例保留。
- **并排**：latest ref —— react.dev **没有**推荐语（大纲阶段全站检索无命中），定性为「社区惯用法，React 18 项目仍需要」；禁用 lint 规则是官方明确反对的写法。
- **依据**：
  - 官方定位（useEffectEvent 页逐字）："lets you separate events from Effects" / "the `callback` always accesses the latest committed values from render at the time of the call"；四条限制逐字："Effect Events can only be called from inside Effects or other Effect Events. Do not call them during rendering or pass them to other components or Hooks" / "Do not use `useEffectEvent` to avoid specifying dependencies in your Effect's dependency array" / "Effect Event functions do not have a stable identity" / "Effect Events are not reactive and must always be omitted from dependencies"。19.2 博客逐字："most users just disable the lint rule and exclude the dependency. But that can lead to bugs" —— 这是对「禁用 lint」旧习惯的否定。
  - 采用：`useEffectEvent` 19.2（2025-10-01）起稳定，不足 12 个月；React 18（24.7%）不可用；`@types/react/index.d.ts:1791` `@version 19.2.0`。因此标【较新】而非【主流】，且 latest ref 并排不能省。
  - 面试现实：「过期闭包怎么修」是高频题，标准答案就是上述优先级序列；答不出 `useEffectEvent` 的限制会被追问。

### 3.8 · 跨题口径

- 「并排」写法与主线同样进入「一、30 秒速答」的可背诵结论，只是主代码不用；每题的「四、关键区别」要写明适用版本 / 模式（例如 Actions：19.0 起；`useEffectEvent`：19.2 起；Data 模式 middleware：7.9 起且 Data 模式无需 flag；`useSyncExternalStore`：18.0 起）。
- 18 ↔ 30 交叉：两种【主流】组合 ——「Data 模式 loader 取数」与「声明式 / 任意路由 + TanStack Query」，各自的 pending / 错误 / 失效重取归谁负责要在两题都写一句。
- 与 `AUDIT.md` §5.0 已定决定的关系：全部维持（不启用 Compiler、新增 31–35、18 Data 主线、26 useEffectEvent 主线），本节只补充「并排」的定位与标签口径。

## 4. 与第一轮的差异（漏掉的 / 说错的 / 同意的）

> 方法：第 1–3 步完成后，主会话才读第一轮 `AUDIT.md` 的 §3 / §4 / §5 与附录 B。逐题对比由 3 个只读子代理按题号范围（01–10 / 11–20 / 21–30）完成：每题读第一轮该题小节（含 §3.0 全局问题、§4.2 逐题处置、附录 B 逐题遗留）与本轮 `audit` 结果，产出三张清单 —— **第一轮漏掉的**（本轮有、第一轮无，给本轮编号并解释第一轮为何没发现）、**第一轮说错的**（附依据，只列能证明的）、**同意的**（只列第一轮行号，不重抄）。「备注」记第一轮有而本轮没有的条目（本轮可能漏）与拿不准的判断。新题 31–35 与第一轮 §4.3 的对比由主会话写在本节末尾。

**总体结论**（数字来自 30 份逐题对比文件，逐题清单见后）：

| 清单 | 条数 |
|---|---|
| 第一轮漏掉的（本轮有、第一轮无） | 235 |
| 第一轮说错的（有依据） | 9 |
| 同意的（按第一轮行号计） | 164 |
| 备注（第一轮有而本轮没有、两轮相反、拿不准） | 123 |

1. **两轮的分工**：第一轮 176 条以「讲错 / 措辞 / 交叉引用」为主，且大多附源码或官方原文；本轮 371 条以「未讲」为主，其中 235 条在第一轮没有对应条目。第一轮 §4.3 的「散点知识点并入现有题」表其实点到了不少盲点（`useId`、`use(Context)`、`useSyncExternalStore`、ref 回调清理、Actions……），但只作「并入建议」，没有逐题标现状、没有定级、没有进统计 —— 这正是本轮补上的部分。
2. **第一轮漏掉的最重要 5 件事**（按严重级与题的分量）：① 18 题 Data 模式标准启动代码 + loader 守卫 + middleware 整组未讲，且第一轮沿用规格把声明式定为主线（`AUDIT.md:557`）；② Actions 家族（31）与并发 / 异步 UI（32）在 30 题里只有名词，第一轮未按题定级；③ 安全与 a11y（35）、服务端与 RSC（33）、测试（34）三门课的现状是「零」，第一轮各只列了一行要点；④ 各题「文件头承诺但未讲」的基础项 —— 01 组件命名 / 禁止嵌套定义 / 纯函数，13 组合的两大理由，14 `useSyncExternalStore`（主责题 0 命中），15 `use(Context)`，12 `useImperativeHandle` / ref 回调清理，17 Profiler / 虚拟化 / Compiler 规则，28 React 19 类型变化整组；⑤ 主线定位：11 / 30 的数据获取（官方四缺点与替代方案）、07 / 19 / 31 的标签口径、20 的 `react-error-boundary` 并排、26 的修法优先级 —— 第一轮没有查官方定位原文。
3. **第一轮说错的 9 条**（全部附依据，逐题表里有原话）：`05:266`（把「三元 = v-if 会卸载 / 挂载」判为核实无误，实则同类型分支按位置复用实例）、`11:375`（把 `use(promise)` 定为并列主线，应只作【较新】引用）、`13:421`（判「保留」但 `footer &&` 有 0 陷阱且组合理由整段缺失）、`14:442`（`useSyncExternalStore` 只作并排，应为主线）、`18:557`（声明式主线）、`25:689` / `27:745` / `28:764`（Vue 3.5 的 props 解构与 `onWatcherCleanup` 标【较新】，按 12 个月口径应【主流】）、`26:715`（latest ref 标【主流】、`useEffectEvent` 降为加分点，与 §3.7 相反）。
4. **本轮应保留第一轮判断的条目**（对比代理在「备注」里逐条指出：第一轮有源码或官方原文，本轮却标了「已讲对」或降了级；合并时以第一轮为准）：`02:206`（`ComponentPropsWithoutRef` 让 `<UiButton ref>` 被类型拒绝）、`03:223`（空串不会被渲染，源码 `"" !== newChild`）、`07:301`（受控 / 非受控不是 React 特有，Vue `vModelText` 即受控实现）、`08:321`（React 有 DOM 层合成事件系统，缺的是组件级自定义事件）、`10:359`（Vue `watch` 只追踪显式 source）、`14:437`（Vue 侧 controller 冗余）、`15:456`（本 demo 树里 `useMemo` 包 value 挡不住直接子元素重渲染 —— 第一轮定严重）、`16:477`（pinia setup store 与 options 不「等价」）、`17:495`（Vue `hasPropsChanged` 逐个 prop `!==` 比较，回调不触发只因 `isEmitListener`）、`18:517`（`ReactNode` 返回类型是 @types/react 18.2.8 起，不是 19）、`21:613`（`Object.is` 跳过渲染有官方限定）、`22:634`（`watch([keyword, status, page])` 类比与 Vue 版不一致）、`23:654`（React 17 在事件里同样批处理）、`24:667`（14 题没有暴露 `increment()` 的 Hook）、`25:695`（Vue 断开响应的三种方式）、`26:717`（被缓存的 `onClick` 一样过期）、`27:739-741`（`:key` 重建、ignore 标志才是官方「最可靠」）、`29:784`（`satisfies never` 的 lint 结论）、`30:809`（`useSyncExternalStore` 的 `subscribe` 每次渲染是新函数）、`30:813`（交叉引用指错文件）。
5. **本轮自身的错误与可关闭项**：R2-18-12 首版称「17 引用核对无误」，实为 `:486` 应指向 15（已在 §1 更正）；R2-25-8 / P-25-1「10 题引用存疑」—— 第一轮 `:688` 已核实成立，可关闭；R2-22-9 / P-22-1（22 题 `set-state-in-effect` 是否命中）—— 第一轮已实跑 0 告警，可关闭；R2-04-11 与第一轮 `:245` 对 `react:104` 是否抛「Too many re-renders」结论相反，两轮都未运行，留 P-04-3 阶段 2 验证；26 题 lint 两轮实跑一致（无命中），第一轮记录的失败题是 21 / 23 / 24 / 27（实跑）。
6. **口径差异（不算谁错）**：lint 相关级别 —— 第一轮按实跑定「严重」，本轮除 H 批外按规则文本定「概念 / 生产」，事实一致；「严重」的外延解读（D2-1）使本轮 01 / 07 / 31–35 的严重数高于第一轮。

逐题清单如下（每题：第一轮漏掉的 / 第一轮说错的 / 同意的 / 备注）。

#### 01. 组件与 JSX

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-01-1 | 严重 | 组件名必须大写开头，小写会被当作 HTML 标签 | 第一轮只核对已写内容的正误，没按 your-first-component 先列目标大纲再对照 |
| R2-01-2 | 严重 | 绝不在组件内部定义组件：每次渲染新函数 → state 重置且慢 | 同上；:188 结论「内容基本准确」只覆盖已写的部分 |
| R2-01-3 | 严重 | 组件必须是纯函数；局部突变允许；副作用放事件处理器 | 第一轮未查 keeping-components-pure，文件头 `UI = f(props/state)` 的前提没被追问 |
| R2-01-4 | 概念 | `<StrictMode>` 开发期双调、生产零成本 | 第一轮未查 StrictMode 参考页与本题的关系 |
| R2-01-5 | 概念 | 渲染三步 Trigger → Render → Commit；同组件多实例各自独立 | 第一轮未查 render-and-commit / understanding-your-ui-as-a-tree |
| R2-01-6 | 概念 | 八段整段缺失：classic runtime `import React`（17 automatic、19 必须）；class 组件 / `ReactDOM.render` / `findDOMNode` / string ref 19 移除 | 第一轮 :179 覆盖检查提 `ReactDOM.render` 与 transform 版本但未定级，:185 只给 createElement 一行小问题；class 组件 / findDOMNode / string ref 未提 |
| R2-01-7 | 概念 | `dangerouslySetInnerHTML` ↔ `v-html` 与 XSS 一句，指向 35 | 第一轮没有盲点归属表（course-map §2）可对照 |
| R2-01-8 | 概念 | JSX / 模块细节：标签闭合、`aria-*` / `data-*`、多行 return 括号、`<>` 不能带 key、export 约定、返回类型 ReactNode | 第一轮 :179 覆盖检查只提 `<Fragment key>` 一项未定级，其余未按 writing-markup-with-jsx 对照 |
| R2-01-9 | 概念 | 九段缺失：Compiler 依赖纯性、react-hooks 7.1.1 `purity` / `static-components`【较新】；19.3 `<Fragment ref>`、Trusted Types【尝鲜】 | 第一轮 :179 只写 19.3 Fragment refs「可一句带过」未定级；lint / Compiler 未与本题关联 |
| R2-01-10 | 生产 | 内联 `style` 与硬编码色值未标「演示简化」、未提项目级样式方案 | 第一轮没有「演示简化」标注这一检查维度 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 无：第一轮 :184 / :185 / :188 的结论与第二轮大纲一致（Vue 支持 render 函数 / JSX；17 automatic runtime、19 必须新 transform；数字补 px 源码核实） | 01-audit 大纲第 15、32、33 行 |
##### 同意的
- AUDIT.md:184（↔ R2-01-11 「Vue 模板里没有等价写法」应补 Vue 也支持 JSX）, AUDIT.md:185（↔ R2-01-6 jsx 自动运行时版本限定与 createElement【旧写法】）
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:186 `avatarStyle` 未标 `CSSProperties`；AUDIT.md:179 覆盖检查「挂载入口 `createRoot`」（第二轮 R2-01-6 只提 `ReactDOM.render` 已移除，未单列 createRoot）
- 结构判断分歧：第一轮 :188 与 §4.2:888 定「保留 —— 内容基本准确」（0 严重 1 概念）；第二轮 3 严重 6 概念，差异全部来自「未讲」类，第一轮没做大纲对照
- 级别分歧：「Vue 模板没有等价写法」第一轮 :184 定概念，第二轮 R2-01-11 归小问题措辞
- 拿不准：无

#### 02. Props

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-02-2 | 概念 | 「默认值要包一层 withDefaults」已过时：3.5 主线是响应式 props 解构，两份 .vue 主线仍用 withDefaults | 第一轮 :197 只写「3.5 响应式 props 解构已提及但未标成熟度」，没查 vuejs.org sfc-script-setup 把 withDefaults 定为 3.4 及以下写法 |
| R2-02-3 | 概念 | 默认值只在缺失 / `undefined` 时生效；`null` / `0` 不走默认值 | 第一轮未按 passing-props 大纲对照 |
| R2-02-4 | 概念 | 不把 props 镜像进 state；刻意忽略更新时命名 `initialX`，指向 09 | 第一轮未查 choosing-the-state-structure |
| R2-02-5 | 概念 | Props 是每次渲染的只读快照；props 像参数、state 是记忆 | 第一轮未查官方原文 "read-only snapshots in time"，与 03 / 23 的快照模型未串联 |
| R2-02-7 | 小问题 | react:120「不展开 ref 透传」与 12 / 28 主责冲突 | 第一轮无盲点归属表可对照 |
| R2-02-8 | 概念 | `key` 不是 prop；`{...props}` 要克制；无值属性即 `true` | 第一轮未按 passing-props / rendering-lists 大纲对照 |
| R2-02-9 | 概念 | @types/react 19 类型变化与 ref 回调清理函数，一句指向 28 / 12 | 第一轮 :197 只提 ref 作 prop 演示缺失，未查 facts-versions B 的类型变化 |
| R2-02-10 | 生产 | 生产段缺 `style` 合并、`Omit` 同名冲突、默认值新引用击穿 memo、运行时校验放数据边界 | 第一轮生产项 :206 只看了 UiButton 的 ref 类型 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 无：:202 dev 冻结 props、:203 SFC 规范、:204 单根透传、:205 「forwardRef 未标 @deprecated」均与第二轮依据一致 | R2-02-1 / R2-02-6 依据列；`node_modules/@types/react/index.d.ts:1385-1405`（forwardRef JSDoc 无 @deprecated，本轮复核） |
##### 同意的
- AUDIT.md:202（↔ R2-02-1）, AUDIT.md:203（↔ R2-02-11 SFC 一文件一组件可放宽）, AUDIT.md:204（↔ R2-02-12 多根不透传）, AUDIT.md:205（↔ R2-02-6）, AUDIT.md:207（↔ R2-02-11）
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:206 生产「UiButton 用 `ComponentPropsWithoutRef<'button'>`，19 下 `<UiButton ref>` 被类型拒绝，应改 `ComponentProps<'button'>`」——第二轮大纲第 17 行把该写法标「已讲对」，未指出 ref 类型缺口，建议主会话核对后保留第一轮；AUDIT.md:204 「已声明 props 与 emits 事件不在 `$attrs`」第二轮未提
- 级别分歧：R2-02-1 第二轮定严重、第一轮 :202 定概念；「SFC 一文件一组件」第一轮 :203 定概念、第二轮 R2-02-11 归小问题措辞
- 第二轮多出的子点：R2-02-12 的 `useAttrs()` 非响应式（第一轮 :204 只讲多根）
- 拿不准：生产构建下 `props.x = 1` 第一轮 :202 写「静默生效」、第二轮 R2-02-1 写「静默无效且不重渲染」，两轮都只核了 development 构建（P-02-4、附录 B:1255），措辞待运行验证后统一

#### 03. State 与 useState

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-03-1 | 概念 | 惰性初始化 `useState(() => init())` 未讲；Vue `ref(init())` 天然只算一次 | 第一轮 :218 覆盖检查与 :229 结构建议提了「补惰性初始化」但未入问题表定级 |
| R2-03-2 | 概念 | Hooks 规则（顶层调用、按调用顺序匹配）本题首用 Hook 应带一句 | 第一轮未按 state-a-components-memory 大纲对照 |
| R2-03-3 | 概念 | 为什么局部变量不能当 state + state 每实例私有 | 同上；官方 useState 入门动机段未被查 |
| R2-03-4 | 概念 | 状态结构原则（冗余 / 矛盾 / 深嵌套 / 不镜像 props）与 `status` 联合替代多 boolean | 第一轮未查 choosing-the-state-structure / reacting-to-input-with-state |
| R2-03-5 | 概念 | 渲染期无条件 setState → Too many re-renders；函数存进 state 被当初始化器 | 第一轮未查 useState 参考页 Troubleshooting |
| R2-03-6 | 概念 | class `this.setState(partial)` 浅合并 vs Hooks 整体替换 | 第一轮无八段「旧写法对照」检查项 |
| R2-03-7 | 概念 | react-hooks 7 `set-state-in-render` / `immutability` 与 Compiler | 第一轮 :218 覆盖检查提了 lint 规则与 Compiler【较新】但未定级 |
| R2-03-10 | 小问题 | 跨组件状态只指向 16、漏 25 / 15；reducer 未 export 却说可单测 | 第一轮 :217 只核了引用是否成立，没核「官方首选的状态提升」是否被跳过 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 无：:226「粒度单位是组件 render effect」与 R2-03-8 一致；:227「dispatch 身份稳定」成立 | R2-03-8 依据（vuejs.org reactivity-in-depth 逐字）；03-audit 大纲第 25 行 |
##### 同意的
- AUDIT.md:226（↔ R2-03-8 「粒度精细得多」夸大）, AUDIT.md:227（↔ R2-03-9 绝对化措辞）
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:223 概念「`state.error &&` 空串会被渲染出来」与 react-dom 源码相反（`"" !== newChild`，:6318 等四处）——第二轮 03 未提，属实际讲错，需主会话补入；AUDIT.md:224 changeQuantity 位置写反；AUDIT.md:217 / :225 「10、14 题」中 14 引用不成立（应为 26）；AUDIT.md:218 Immer 加分项
- 级别分歧：「粒度精细得多」第一轮 :226 小问题、第二轮 R2-03-8 概念讲错，且第二轮多出 react:17「ref 是 Proxy」一处（`ref` 用 getter / setter）
- 第二轮 R2-03-9 的绝对化清单（:63「统一解法」与 :64 自相矛盾、模板残留 7 处）比第一轮 :227 「永远」四处覆盖更广
- 结构判断：两轮都定「修改、保留三区块」，一致
- 拿不准：无

#### 04. 事件处理

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-04-3 | 概念 | 事件处理器是副作用的最佳位置、不必纯；闭包读到本次渲染快照（指向 23 / 26） | 第一轮未按 responding-to-events 大纲对照，与 01 纯性 / 23 快照未串联 |
| R2-04-4 | 概念 | 命名约定 `handleX` / `onX`；回调 prop 代替传播；内联箭头新函数何时才 useCallback | 同上 |
| R2-04-5 | 概念 | Vue 修饰符对照不全：`.self` / `.once` / `.enter` / `.ctrl` / `.exact` 的 JS 等价；组件 `emit` 不冒泡 | 第一轮 :238 覆盖检查提了 `.self` / `.once` / `e.key` 但未定级 |
| R2-04-6 | 概念 | `onChange` 像原生 input 事件；表单 `onSubmit` + preventDefault 或 19 `<form action>`（指向 07 / 31） | 第一轮未把表单事件纳入本题范围 |
| R2-04-8 | 概念 | TS 事件类型只讲 `MouseEvent<T>`：ChangeEvent / FormEvent / KeyboardEvent / SyntheticEvent / `MouseEventHandler<T>` 未提，未指向 28 | 第一轮 :238 覆盖检查提 `MouseEventHandler<T>` 与 28 衔接但未定级 |
| R2-04-9 | 概念 | 九段缺失：19.3 onFullscreenChange / onFullscreenError、submit 带 `submitter`、resize 批处理【尝鲜】 | 第一轮未查 19.3 博客的事件条目 |
| R2-04-10 | 生产 | 可点击 `<div onClick>` 与 `<a href>` 当按钮无 role / tabIndex / onKeyDown，未标「演示简化」 | 第一轮无 a11y / 「演示简化」检查维度 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 无：:243 root 委托 / 事件池 / onScroll / focusin、:244 passive 均与 R2-04-1 / R2-04-2 / R2-04-7 依据一致 | R2-04-1 依据 `react-dom-client.development.js:19209, 28057`；R2-04-2 依据 `:5328` |
##### 同意的
- AUDIT.md:243（↔ R2-04-1 root 委托、R2-04-2 onScroll / focusin / 捕获、R2-04-7 事件池 / persist）, AUDIT.md:244（↔ R2-04-7 passive）, AUDIT.md:245（↔ R2-04-11 react:104「死循环警告」措辞，结论见备注）
##### 备注
- 两轮结论相反：react:104「渲染中 setState 触发死循环警告」——第一轮 :245 判「本例 3 项列表在渲染期 setState 后收敛，达不到 25 次上限，不会抛 Too many re-renders，且 TS 先因 `void` 报类型错」；第二轮 R2-04-11 判「实际抛 Too many re-renders 错误」但列 P-04-3 待运行。按 `react-dom-client.development.js:7748` 该错误只在更新不收敛时抛出，倾向第一轮正确，阶段 2 运行定夺
- 第一轮有、第二轮没有：AUDIT.md:246 vue:16「`$event` 就是原生 DOM 事件对象」只对原生元素成立（组件事件时为 emit 载荷，附录 B:1256 待核实）；AUDIT.md:238 「document 委托【旧写法】」标签建议
- 级别 / 子点分歧：R2-04-1 第二轮定严重、第一轮 :243 定概念；第二轮多出 `e.nativeEvent` / `currentTarget` 可能不同（第一轮 :238 仅覆盖检查提 nativeEvent）、R2-04-2 多出 onLoad / onAbort 在 React 冒泡与三阶段顺序、R2-04-7 多出类组件 `bind(this)`
- 拿不准：无

#### 05. 条件渲染

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-05-1 | 严重 | 「三元 / && = v-if 会真正卸载 / 挂载」讲反：同类型同位置 React 复用实例保留 state，Vue v-if 总销毁重建 | 第一轮 :257 只把「同位置同类型复用实例」列为覆盖缺失未定级，没有对照 react:135 / vue:135 的等号；:266 反而写「v-if 对照核实无误」 |
| R2-05-2 | 概念 | 同位置换不同组件销毁 state；同组件强制重置用 key 或换位置；隐藏 vs 卸载还可提升 state | 第一轮 :257 覆盖检查一行未定级 |
| R2-05-4 | 概念 | `return null` 及可读性提醒；`let content; if (...)` 最灵活；元素是描述不是实例 | 第一轮 :257 / :266 提「补 return null」但未定级，其余两点未查 conditional-rendering 页 |
| R2-05-5 | 概念 | `ReactNode` 含 boolean / null / undefined 所以 `&&` 合法、含 number 所以 0 会渲染，TS 拦不住 | 第一轮未从 `.d.ts` 角度追问 |
| R2-05-6 | 概念 | 多个互斥布尔易矛盾，用单一 `status` 联合驱动分支；本题用了联合但未说理由 | 第一轮未查 choosing-the-state-structure |
| R2-05-7 | 概念 | 八段缺失：类组件 `render()` 里 if/else 或 `renderX()` 辅助方法 | 第一轮无八段「旧写法对照」检查项 |
| R2-05-8 | 概念 | Vue 侧：`<template v-if>`、v-show 不支持 template / v-else、v-if 惰性 vs v-show 初始成本、v-if 与 v-for 优先级 | 第一轮 :257 覆盖检查提了成本取舍与 `<template v-if>` 但未定级 |
| R2-05-9 | 生产 | `style={{ display }}` 未标「演示简化」；提前 return 前不能有条件 Hook；权限隐藏只是体验 | 第一轮无「演示简化」/ 安全检查维度 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| AUDIT.md:266 | 「`0 &&` 陷阱、v-if 对照、映射表讲解均核实无误」 | react:135 / vue:135「条件渲染 = v-if，会真正卸载 / 挂载节点」讲反：两分支同类型时 React 按树中位置复用实例、state 保留，Vue v-if 则总是销毁重建；「v-if 对照」并未核实无误 | R2-05-1 依据：react.dev preserving-and-resetting-state 逐字 "It's the position in the UI tree—not in the JSX markup—that matters"；vuejs.org built-in-directives#v-if 逐字 "destroyed and re-constructed" |
##### 同意的
- AUDIT.md:262（↔ R2-05-3 `<Activity>` 19.2 与 `hidden` 替代）, AUDIT.md:263（↔ R2-05-10 react:7 与 :109 不一致；第一轮指漏空串、第二轮指漏 `true`，互补）
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:264 「Vue SFC 一文件一组件」措辞（同 02）；AUDIT.md:263 「空串不渲染、0 / NaN / bigint 会渲染」的源码依据（第二轮 R2-05-10 只指漏 `true`）
- 级别 / 定性分歧：Activity 第一轮 :262 定概念「过时」、第二轮 R2-05-3 定概念「未讲」并加主责 32 与 19.3 ViewTransition；R2-05-1 第二轮定严重讲错、第一轮仅作覆盖缺失
- 拿不准：无

#### 06. 列表渲染与 key

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-06-1 | 概念 | `key={Math.random()}` 每次全部重建、丢输入；key 从哪来（后端 id / `crypto.randomUUID()` 创建时写入） | 第一轮 :275 覆盖检查提「不要在渲染时生成随机 key」但未定级，「key 从哪来」未查 |
| R2-06-2 | 概念 | `<Fragment key={id}>`；块体箭头函数须显式 `return`；先 filter 再 map | 第一轮 :275 覆盖检查提 `<Fragment key>` 未定级，其余未按 rendering-lists 对照 |
| R2-06-3 | 概念 | key 类型 `string \| number \| bigint`；Vue key 须原始值、重复 key 报错 | 第一轮未从 `.d.ts` / Vue API 页追问 |
| R2-06-4 | 概念 | 派生列表渲染期算或 useMemo；`sort` / `reverse` 先拷贝；Vue 突变侦测 vs 新数组替换 | 第一轮未与 21 / 09 的派生 / 不可变原则交叉 |
| R2-06-5 | 概念 | Vue `v-for` 语法家族、`<template v-for>` key 位置、组件 v-for 显式传 props、v-if 优先、`v-memo` | 第一轮 :275 覆盖检查提 `<template v-for>` key 未定级，其余未查 list.html |
| R2-06-6 | 概念 | 九段缺失：虚拟化与 useMemo caveat、Compiler 一句、19.3 `<Fragment ref>` | 第一轮 :275 提「虚拟化可指向 §8.3」未定级 |
| R2-06-7 | 概念 | 八段缺失：`Children.map` / `toArray` 合成 key；存量 `key={index}` 标【旧写法】 | 第一轮无八段「旧写法对照」检查项 |
| R2-06-10 | 生产 | 跨来源合并 key 加前缀；分页 / 搜索保持 key 稳定；每项 memo 时 props 引用稳定 | 第一轮无生产要点检查维度 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 无：:286「两个演示与 Preserving and Resetting State 一致、Vue 就地更新 / :key 重建 / ref 初始值不跟 props 走核实无误」与第二轮大纲一致 | 06-audit 大纲第 13、19、20、29、30 行均「已讲对」 |
##### 同意的
- AUDIT.md:274, 280, 281（↔ R2-06-8 「第 8 题」应指 25、不补零）, AUDIT.md:283（↔ R2-06-9 「一模一样 / 完全一致」）
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:284 「SFC 一文件一组件」措辞；AUDIT.md:275 「eslint `set-state-in-effect` 能静态抓到 react:234 的反模式」（第二轮 06 未提 lint）；AUDIT.md:273 「本题 React 文件没有实际调用 useEffect」的线索更正
- 两轮相反：vue:199-201 把 `watch` 同步 props 称「反模式」——第一轮 :282 / :287 判「Vue 官方无此定性，待核实」；第二轮大纲第 34 行标「已讲对」但官方来源列为「—」。两轮都无官方原文，拿不准，建议按第一轮软化为「常见写法但多一步同步；换 :key 更直接」
- 第二轮多出的子点：R2-06-9 的 react:24「退化为按 index 匹配 vs 就地更新」实为同一机制、react:10「永不增删」过严（P-06-3 待运行）；R2-06-8 路由参数变化未指向 18
- 结构判断分歧：第一轮 :286 / §4.2:893 定「保留、只需修正引用」（0 概念）；第二轮 7 概念 1 生产，均为「未讲」类

#### 07. 表单与受控组件

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-07-1 | 严重 | `useId` 零覆盖：label / aria 关联、SSR 一致、禁作 key、`identifierPrefix`、19.2 前缀 `_r_` | 第一轮无盲点归属表；useId 全站为空只在 §3.0:170 共性观察带过一句，未归到 07 定级 |
| R2-07-2 | 概念 | 受控 ↔ 非受控切换警告：初始值 `undefined` / `null` 再给字符串会报警，受控值须始终为字符串 | 第一轮未按 input 参考页 caveats 对照 |
| R2-07-3 | 概念 | `onChange` ≈ 原生 input 事件且 IME 期间触发；Vue `.lazy` / `.number` / `.trim`、IME 期间 v-model 不更新、`defineModel()`（3.4+）与 3.4 前手写【旧写法】 | 第一轮未查 vuejs.org forms / v-model 页的现行写法 |
| R2-07-4 | 概念 | `value` 恒为字符串、`type="number"` 需 `Number()`、`<option selected>` 不支持、`<textarea>` 不接 children | 第一轮未按 select / textarea 参考页对照 |
| R2-07-5 | 概念 | a11y 引用：`htmlFor` / useId 关联、`aria-describedby`、placeholder 不当 label、失败后焦点（→35） | 第一轮无 a11y 检查维度 |
| R2-07-7 | 概念 | 八段缺失：自定义输入组件透传 ref 在 18 需 `forwardRef`、19 起普通 prop；18 无 `<form action>` | 第一轮无八段「旧写法对照」检查项（只把 useFormState 更名列为旧写法） |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 无：:300 `<form action>` 语义（Transition、成功后 reset 非受控字段）与 R2-07-6 依据一致；:307 更名待核实已在附录 B:1258 核实 | R2-07-6 依据 react.dev/reference/react-dom/components/form 逐字 |
##### 同意的
- AUDIT.md:295, 300（↔ R2-07-6 Actions 只作一句「延伸」、缺【主流】/ 19.0 标签）, AUDIT.md:302, 303（↔ R2-07-8 模板残留、react-hook-form 绝对化）
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:301 概念「受控 / 非受控是 React 特有、Vue 里基本不存在」是把成本模型差异讲成框架差异（Vue `vModelText` 即受控实现，`runtime-dom.cjs.js:1522-1577`）——第二轮只在 R2-07-8 作模板残留处理、未定为概念错误，建议主会话保留第一轮定级；AUDIT.md:304 「控制台警告」只在开发构建存在（`react-dom-client.development.js:1423-1433`）
- 主线结构：第一轮 :306 建议拆新题「React 19 表单 Actions」放 19 之后；第二轮 R2-07-6 指向 31 题，方向一致，编号以主线判定为准
- 拿不准：react-hook-form 重渲染机制两轮都标待核实（AUDIT.md:307 / P-07-2）

#### 08. 父子组件通信

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-08-1 | 概念 | 「通知父组件」的 Effect 反模式与正解：Effect 里 onChange 多一轮渲染；同一处理器 setState + onChange；全受控；Effect 里 onFetched 上抛 | 第一轮未查 you-might-not-need-an-effect 的 notifying-parent / passing-data 段 |
| R2-08-2 | 概念 | 状态提升三步法、兄弟通信、受控 / 非受控组件设计层定义只剩一句指向 25 | 第一轮 :314 只核了指向 25 成立，未问本题该留多少 |
| R2-08-3 | 概念 | React 无 v-model：`value + onChange` ↔ `modelValue + update:modelValue` / `defineModel()`（3.4+） | 第一轮 :315 覆盖检查与 :325 结构建议提「补 defineModel 指针」但未定级 |
| R2-08-4 | 概念 | 回调 prop 每次渲染新函数属正常；只有 memo 子组件 / Hook 依赖才 useCallback | 第一轮未查 memo 参考页 |
| R2-08-5 | 概念 | 回调 prop 代替事件传播；多层回调 vs 提升 / children 组合 / context 阶梯 | 第一轮未按 responding-to-events / before-you-use-context 对照 |
| R2-08-6 | 概念 | Vue emit 细则：组件事件不冒泡、camelCase / kebab-case、运行时校验、未声明 `@x` 落到根元素 | 第一轮 :315 只提「Props are readonly」警告，未查 components/events 页 |
| R2-08-7 | 概念 | 【较新】React 19 子组件 `action` prop 接父组件 async 函数 | 第一轮未把 Actions 与本题关联 |
| R2-08-8 | 概念 | 【旧写法】ref + useImperativeHandle 调子组件方法；类组件 `this.props.onX` + bind | 第一轮无八段「旧写法对照」检查项 |
| R2-08-9 | 生产 | 回调全是同步本地更新，生产 onRename 通常 async，pending / 错误 / 防重复未标「演示简化」 | 第一轮无「演示简化」检查维度 |
| R2-08-11 | 小问题 | 交叉引用只有 25，应加 02 / 04 / 07 / 09 / 17 / 24 / 31 | 第一轮只核引用是否成立，不核应有而未有的指向 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 无：:320 「callback props 正是 emit 的对应物」与 R2-08-10「对应关系其实明确（回调 ↔ emit）」一致；:322 「改了也白改」不准确与 R2-08-10 一致 | R2-08-10 依据列 |
##### 同意的
- AUDIT.md:320, 322（↔ R2-08-10 「完全没有对应物」、「改了也白改」）
##### 备注
- 两轮定性相反：react:12 / vue:13「React 没有独立的『事件系统』」——第一轮 :321 定概念不准确（DOM 层有合成事件系统，缺的是组件级自定义事件）；第二轮大纲第 8 行标「已讲对」。两者都引官方页，属措辞精度之争，建议按第一轮加限定「组件级」
- 级别分歧：「emit 无对应物」第一轮 :320 定概念且有 `runtime-core.cjs.js:4481,4537-4545` 源码依据（emit 即查 `props.onX`），第二轮 R2-08-10 归小问题措辞——建议沿用第一轮定级
- 第一轮有、第二轮没有：AUDIT.md:323 `defineProps` 导入类型 / `defineEmits` 具名元组为 3.3+ 未注明版本（可附 3.2 调用签名式【旧写法】）；AUDIT.md:315 Vue「Attempting to mutate prop… Props are readonly」运行时警告未提
- 结构判断分歧：第一轮 :325 / §4.2:895 定「保留」（2 概念）；第二轮 8 概念 1 生产，均为「未讲」类
- 拿不准：无

#### 09. 派生状态

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-09-1 | 概念 | choosing-the-state-structure 三原则：避免重复（存 id）、不镜像 props（`initialX`）、避免矛盾 | 第一轮未按 choosing-the-state-structure 大纲对照 |
| R2-09-2 | 概念 | react-hooks 7 `recommended` 以 error 报 `set-state-in-effect`；`no-deriving-state-in-effects` 默认 Off | 第一轮只在 10 题 :360 讨论该规则（10 / 11 / 22 / 27），未关联到 09 的反例 |
| R2-09-3 | 概念 | useMemo 判定方法（`console.time`、≥1ms、throttling、StrictMode 双调偏大）与语义边界（缓存可丢弃、`() => ({})`、不能循环调用） | 第一轮未查 you-might-not-need-an-effect#how-to-tell 与 useMemo troubleshooting |
| R2-09-5 | 概念 | 其余派生场景：prop 变化时重置（key）/ 渲染期调整部分 state、事件间共享逻辑抽函数、不用 Effect 链 | 第一轮未按 you-might-not-need-an-effect 全页对照 |
| R2-09-6 | 概念 | Vue computed 细则：非响应式依赖不更新、可写 computed、previous value（3.4+）、getter 无副作用 | 第一轮只查了 computed.html 的 caching-vs-methods 一节 |
| R2-09-8 | 概念 | Effect 派生反例未标【旧写法】；`getDerivedStateFromProps` / `componentWillReceiveProps`、「全包 useMemo」旧建议 | 第一轮无八段「旧写法对照」检查项 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 无：:339「渲染时直接算 ↔ 模板表达式 / 方法，useMemo ↔ computed」与 R2-09-7 / R2-09-9 一致；:340 Compiler 定位与 R2-09-4 一致 | R2-09-7 依据 vuejs.org computed.html 逐字 |
##### 同意的
- AUDIT.md:339（↔ R2-09-7 「computed 唯一写法」讲错、R2-09-9 模板残留贴错地方）, AUDIT.md:340（↔ R2-09-4 Compiler【较新】与 `preserve-manual-memoization`）, AUDIT.md:341（↔ R2-09-10 应指向 17）
##### 备注
- 第一轮有、第二轮没有：无实质条目（:334 「标签缺失」为模板通用项）
- 第二轮多出的子点：R2-09-10 交叉引用还应加 06 / 02 / 25 / 29 / 30（第一轮 :341 只要求指向 17）；R2-09-4 「让记忆化不必要的五原则」一句引用
- 结构判断：两轮都定「修改、React 侧论点正确、Vue 对照段重写」，一致
- 拿不准：无

#### 10. useEffect 与生命周期

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-10-1 | 生产 | Effect 手写请求被当正当默认写法，未说官方四个缺点与生产替代（框架 / TanStack / loader → 11 / 30） | 第一轮 :352 覆盖检查提「Fetching data（→ 框架 / TanStack）未列」但未定级，未引 "very manual approach… significant downsides" |
| R2-10-3 | 概念 | 依赖数组进阶三条：对象 / 函数依赖每次 commit 重跑及三种解法；`ref.current` 写进依赖无效；不相关的事拆多个 Effect | 第一轮未按 useEffect 参考页 / lifecycle-of-reactive-effects / removing-effect-dependencies 对照 |
| R2-10-4 | 概念 | 「不需要 Effect」清单缺链式 setState、初始化应用、通知父组件、订阅外部 store（useSyncExternalStore → 14） | 第一轮 :352 覆盖检查列了同样四类但未定级 |
| R2-10-5 | 概念 | useLayoutEffect（绘制前、阻塞、量布局）与 useInsertionEffect 一句都没有；:25「React 只有一个 useEffect」相悖 | 第一轮无盲点归属表；:25 的说法未被质疑 |
| R2-10-6 | 概念 | Effect 只在客户端运行、SSR 不跑；useLayoutEffect 服务端报错；didMount 模式与闪烁（→ 33） | 第一轮无服务端检查维度 |
| R2-10-8 | 概念 | class 生命周期（DidMount / DidUpdate / WillUnmount）对照与「Effect = 三合一」错误类比 | 第一轮无八段「旧写法对照」检查项 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 无：:357 useEffectEvent 19.2 稳定、:360 `set-state-in-effect` 为 recommended error、:361 `onWatcherCleanup` 3.5 均与第二轮依据一致 | R2-10-2 / R2-10-7 / R2-10-9 依据列 |
##### 同意的
- AUDIT.md:357（↔ R2-10-7 useEffectEvent 缺【较新】、R2-10-11 :206 非官方来源）, AUDIT.md:358（↔ R2-10-10 「Vue 里根本不存在」）, AUDIT.md:360（↔ R2-10-2）, AUDIT.md:361（↔ R2-10-9 `onWatcherCleanup`）, AUDIT.md:362（↔ R2-10-11）, AUDIT.md:363（↔ R2-10-7 19.3 hydration 双调【尝鲜】）
##### 备注
- 两轮相反：vue:52-53「watch 显式声明 source…没有『漏依赖』这个坑」——第一轮 :359 定概念讲错并引 vuejs.org watchers 逐字（"watch only tracks the explicitly watched source"）；第二轮大纲第 30 行标「已讲对」。第一轮有官方逐字依据，建议主会话保留第一轮结论
- 两轮相反：react:176「依赖写全永远是对的」——第一轮 :365 判「官方规则复述、后半句已限定，不计」；第二轮 R2-10-10 判需限定（对象依赖写全会无限重跑，引 useEffect#removing-unnecessary-object-dependencies）。第二轮有依据，倾向加限定
- 第一轮有、第二轮没有：AUDIT.md:357 useEffectEvent 三条 caveat（只能在 Effect 内调用、不能传给其他组件 / Hook、返回函数无稳定身份——与本题 latest-ref「ref 对象恒定」类比相反）与「useEvent」提案名待核实；AUDIT.md:363 StrictMode「state 不丢、ref 回调也多跑一次」；AUDIT.md:361 `onUnmounted` 演示冗余标注
- 级别 / 子点分歧：「Vue 里根本不存在」第一轮 :358 定概念、第二轮 R2-10-10 归小问题；R2-10-7 第二轮多出 StrictMode 双调「18.0 起」版本落点；R2-10-9 多出 flush 'pre' / 'post' / 'sync' 时机轴
- 拿不准：`set-state-in-effect` 是否命中 :291 两轮均待运行（AUDIT.md:360 / P-10-1）

#### 11. API 请求状态

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-11-2 | 生产 | mockApi 直接 throw Error；真实 fetch 不因 404 / 500 reject，必须查 response.ok 再 throw；错误类型未统一 | 第一轮只对照 react.dev，没查 MDN fetch 语义，也没把 `src/shared/mockApi.ts` 的简化当「生产简化」定级 |
| R2-11-3 | 概念 | 「不做半吊子抽象」把自定义 Hook 抽象讲反，官方是「无框架时把请求逻辑移进自定义 Hook 便于日后整体替换」 | 第一轮 :380 引用了 :9 但只评「面试必备」定位，没读 you-might-not-need-an-effect#fetching-data 的抽 useData 段 |
| R2-11-4 | 概念 | 方案 B / C 最小形：useQuery 返回字段（status / fetchStatus / isPending / isLoading）、默认 retry 3 次退避、loader + useLoaderData + useNavigation().state、流式 Await、依赖查询与瀑布 | 第一轮 :380 认为「指向 30 / 18 各一句」即可，未要求主线题给候选骨架；TanStack 字段自记「待核实、未抓取参考页」（:387） |
| R2-11-5（部分） | 概念 | 方案 D 细节：promise 须缓存、不能 try/catch、Suspense 看不见 Effect 里的请求、useSuspenseQuery、throwOnError、RSC async/await【尝鲜】 | 第一轮 :375 只在覆盖检查里写一行「use(promise) + Suspense 未提（含 promise 需缓存）」未定级；Suspense 与 Effect 请求的关系、useSuspenseQuery、throwOnError 全未列 |
| R2-11-6 | 生产 | 每次搜索先整表换「加载中」是切换参数闪烁现场；`placeholderData: keepPreviousData` / 保留旧 data + isRefreshing 未讲 | 第一轮没查 TanStack 分页指南，只查了 useEffect 页 |
| R2-11-7 | 概念 | TanStack v4 → v5 改名（loading→pending、cacheTime→gcTime、keepPreviousData→placeholderData、useErrorBoundary→throwOnError）；本题 status 'loading' 与 v5 'pending' 不一致 | 第一轮未抓取 TanStack 迁移指南（:387 待核实），30 题核实的是字段形态不是改名 |
| R2-11-8 | 概念 | Vue 侧缺官方 useFetch composable（watchEffect + toValue）、vue-router 导航前 / 后取数 ↔ loader、`<Suspense>` ↔ use + Suspense、vue-router 5 数据加载器【尝鲜】 | 第一轮覆盖检查只按规格 §7 / §8 查 React 侧，没按 Vue 官方文档列 Vue 对应物 |
| R2-11-9（部分） | 小问题 | 竞态应指向 27 而非 10；StrictMode 双请求指向 10；防重复提交指向 19；`<form>` 提交指向 31 | 第一轮 :384 只补了 → 24；27 / 31 的主责分工在第二轮 course-map 才定 |
| R2-11-10（部分） | 生产 | 官方 Fetching data 示例自身也含同步 setBio(null)，须讲清 lint 代价与取舍 | 第一轮 :382 已提规则会命中，但只说「与 10 题一并决定」，没查官方示例本身也违反该规则 |
| R2-11-11 | 小问题 | 「两边一模一样 / 完全一致」绝对化，应限定为「状态类型相同」 | 第一轮未逐句查绝对化措辞（§3.0 只统计了「没有一一对应关系」） |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| AUDIT.md:375（同 :380 修改建议） | 「use(promise) + Suspense【主流】作为另一条读数据主线」 | 本题只作【较新】引用（指向 32），不是并列主线：纯客户端项目无框架 / 缓存层时 promise 无处缓存，不成体系 | 03-mainline.md §3.3：use 页逐字「Promises passed to use must be cached」、Suspense 页「Suspense does not detect when data is fetched inside an Effect」；R2 outline 行 18 标【较新】 |
##### 同意的
- AUDIT.md:375（四条缺陷 + 替代方案、判别联合缺【主流】标签）, 380, 382, 384, 386
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:381（:15-18「React 声明式 vs Vue 命令式」讲成框架差异，第一轮有仓库内 10 / 22 题 Vue 版 watch+immediate 为证；第二轮 outline 行 31 只把 Vue 命令式 load() 记为已讲对，未评「最重要的区别」段）；:383（「工业界标准」×2、「面试加分点」措辞过强）
- 第一轮 :387 待核实（TanStack 字段形态）已由 30 题核实（附录 B :1260），与 R2-11-4「status × fetchStatus、isLoading = isPending && isFetching」一致
- 主线：第一轮 :386「主体保留」与 03-mainline §3.3（教学用 effect 手写、文件头标「教学用；生产用缓存层见 30」）一致；但第一轮没要求文件头贴「教学用」标签，第二轮 R2-11-1 以此为主线判定依据
- 拿不准：R2-11-1「路由模式选型判据（Data vs 声明式 + 自带 pending 的数据层）」是否应落在 11 题而非 18 / 30，两轮都没讨论归属

#### 12. useRef 与 DOM

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-12-1（部分） | 概念 | `useImperativeHandle` 为本题主责：「不滥用句柄」pitfall 与 Vue `defineExpose` 对照（方向相反：Vue 默认私有）全缺 | 第一轮 :395 只在覆盖检查一行列了 useImperativeHandle 未定级，:401 只说「顺带补一例」；没查 useImperativeHandle#pitfall 与 Vue template-refs#ref-on-component |
| R2-12-2（部分） | 概念 | ref 回调不返回 cleanup 则以 `null` 再调一次；列表 refs 不能在 `map` 里 `useRef`、用 ref 回调维护 `Map`；StrictMode 双调；Vue 函数 ref `:ref="(el) => …"` 对照 | 第一轮 :395 只列了「ref 回调及其清理函数（19.0）」一行未定级；没查 manipulating-the-dom-with-refs 的 list-of-refs 段与 Vue function-refs |
| R2-12-5 | 概念 | `flushSync(() => setState())` 同步提交后再 `scrollIntoView`；Vue `await nextTick()` 对照 | 第一轮没查 manipulating-the-dom-with-refs#flushing-state-updates-synchronously-with-flush-sync |
| R2-12-7（部分） | 概念 | `MutableRefObject` 并入 `RefObject`、string refs 19 移除、`element.ref` 弃用 | 第一轮 :395 只列了「useRef() 无参不通过」一项；其余 19 类型 / 移除项没按升级指南逐条对照 |
| R2-12-9 | 概念 | `initialValue` 首轮后被忽略；「useRef ≈ useState({current})[0]」解释跨渲染同一对象；懒初始化 `if (ref.current === null)` 例外 | 第一轮把 :8 / :38-39 的「同一对象」当已讲对，没按 useRef 参考页查加分点 |
| R2-12-11 | 小问题 | 模板残留「没有一一对应关系」4 处，:41 / vue:34 属机械套用 | 第一轮本题未逐处查模板残留（§3.0 只做全站统计） |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 未发现可用依据证明的错误（两种用途主线保留、Vue 切 useTemplateRef，两轮一致） | — |
##### 同意的
- AUDIT.md:394, 395（ref 回调清理、useImperativeHandle、ref-as-prop、useRef() 无参、forwardRef【旧写法】、Fragment refs、标签全缺）, 400, 401, 402, 403, 405
##### 备注
- 第一轮 :400「升级 lint 预设前需运行验证」：第二轮 R2-12-4 已实测 recommended 于 :86、:93 报 `refs`「Cannot access refs during render」，可关闭
- 级别 / 类型差：R2-12-4 定「生产 / 未标简化」，第一轮 :400 定「概念」；R2-12-8 在 :403 的 shallowRef / markRaw 之外补了「解构 reactive」，并指出与 26 题口径不一致
- R2-12-3 指出 02 题 :118-120 与本题 :28-29 互推「不展开」→ 无人展开；第一轮 :394 已注意到 02 只有注释无代码，但没把「互推」当问题
- 第一轮有、第二轮没有：无实质条目（:401「forwardRef 在 19 仍可用、@types 未标 @deprecated」第二轮 outline 行 22 已同口径）

#### 13. children 与组件组合

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-13-1 | 严重 | 组合的两大理由全无：① 减少 prop drilling——先抽组件传 children 再考虑 context（→15）；② wrapper 自己 setState 时 children 元素引用不变、不重渲染（→17）；「`{...props}` 用得多说明该拆组件」（→02） | 第一轮只查「怎么写」是否准确，没按 passing-data-deeply-with-context#before-you-use-context 与 useMemo#should-you-add-usememo-everywhere 查「为什么组合」 |
| R2-13-2（部分） | 概念 | `children` 结构不透明（单节点 / 数组 / null）；`Children.*` "uncommon and can lead to fragile code"、不进入元素内部与 Fragment；替代：多个子组件 / 对象数组 prop / render prop | 第一轮 :414 只写了「`Children.*` / `cloneElement`【旧写法·不推荐】」一行未定级；没读 Children 页 alternatives 段 |
| R2-13-3（部分） | 概念 | `cloneElement` 注入 props "makes it harder to trace the data flow"；替代 render prop / context / 自定义 Hook | 同上，第一轮只一行提名 |
| R2-13-5 | 概念 | 组合组件转发 ref：19 起 `{ ref, ...rest }` 透传、`forwardRef`【旧写法】；组合 ≠ 在父组件内定义子组件（→01） | 第一轮没把 Card / UserList 当「真实项目要透传 ref 的包装组件」看；内部定义组件的坑归 01 未联动 |
| R2-13-6 | 概念 | `React.FC<Props>` 隐式 `children` 已移除（`FunctionComponent<P>` 签名 `(props: P)`）；HOC / `cloneElement` 复用模式 → 自定义 Hook + 组合（→14） | 第一轮无【旧写法】段检查；没查 @types/react index.d.ts:1060-1061 |
| R2-13-7（部分） | 概念 | `<slot>` fallback 内容；混用时默认插槽须显式 `<template #default>`；`defineSlots`（3.3+）；renderless 组件 vs composable（"Composables are more efficient than renderless components"，→14） | 第一轮 :414 只列了动态插槽名 `#[name]` 与 `useSlots()`；没按 slots 页逐节对照 |
| R2-13-9 | 小问题 | `{footer && …}` 对 `ReactNode` 判空有 0 陷阱（`footer={0}` 渲染 "0"），与 05 题教学自相矛盾 | 第一轮没逐行核代码与 05 题结论的一致性，:421 直接判「代码准确」 |
| R2-13-10（部分） | 生产 | 七段缺失：组件 API 优先复合组件 `<Card.Header>` 或具名 JSX prop、不解析 children；render prop 每项都调用、配合 memo 注意引用稳定；逻辑复用优先自定义 Hook | 第一轮 :414 只列「复合组件（Context 驱动）作为组合进阶」一行，无生产段检查 |
| R2-13-11 | 概念 | 九段缺失：React Compiler 下组合仍是首选；react-hooks 7.1.1 `static-components` 规则禁止渲染期创建组件【较新】 | 第一轮无「九、新动向」检查，且未把 eslint-plugin-react-hooks 7 规则逐题落地 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| AUDIT.md:421（同 :900） | 「保留 —— 代码与主线对照准确」 | 代码有一处不严谨（`react/Example.tsx:48` `footer &&` 的 0 陷阱），且「为什么组合」整段缺失被定严重；处置应为「修改」而非「保留」 | R2-13-9：`node_modules/@types/react/index.d.ts:436-449` ReactNode 含 number；R2-13-1：react.dev 逐字 "Extract components and pass JSX as children to them" |
##### 同意的
- AUDIT.md:413, 414（ReactNode vs ReactElement、PropsWithChildren、函数 children、`Children.*` / `cloneElement`、动态插槽名 / useSlots、标签全缺）, 419
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:419 的正面结论「slot 函数惰性调用、依赖由子组件而非父组件收集」应写进「四、关键区别」（有 render-function 页逐字「slot's dependencies being tracked by the child instead of the parent」）——第二轮 R2-13-8 只做否定、未给替代结论；:419「Vue 一文件一组件只是 SFC 约束」第二轮未提；:414「复合组件（Context 驱动）」实现方式第二轮 R2-13-10 只提 `<Card.Header>` 未提 Context 驱动
- 第二轮自留 P-13-1（`React.FC` 隐式 children 移除的 @types 版本）第一轮未涉及
- 拿不准：R2-13-4「children 也可以是函数」与第一轮 :414「render-children 变体」同一条，第一轮只在覆盖检查一行未定级，计入同意

#### 14. 自定义 Hook

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-14-2 | 生产 | `useWindowWidth` 直接读 `window.innerWidth`：无「仅客户端」说明、无 `getServerSnapshot` / SSR 对照；Vue 侧未提 SSR 时 DOM 副作用放 onMounted | 第一轮 :435 只把 getServerSnapshot 当 uSES 写法的第三段，没把「直接读 window」定为生产简化；没查 vuejs.org composables#side-effects |
| R2-14-4（部分） | 概念 | 自定义 Hook 接收事件回调时用 `useEffectEvent`（19.2 起【较新】）包一层、去掉回调依赖（→ 26） | 第一轮 :430 只在覆盖检查里写了一行「可交叉引用 26」未定级 |
| R2-14-5（部分） | 概念 | 返回函数建议包 `useCallback`；`useDebugValue` 给共享 Hook 加 DevTools 标签 | 第一轮 :430 只列了「返回约定（对象 vs 元组）」一行未定级；useCallback / useDebugValue 完全未提（没查 useCallback#optimizing-a-custom-hook 与 useDebugValue 页） |
| R2-14-6 | 概念 | 官方反模式：不要造 `useMount` / `useEffectOnce` / `useUpdateEffect`；「不必为每一点重复抽 Hook」 | 第一轮没查 reusing-logic-with-custom-hooks#when-to-use-custom-hooks，只按规格 §7 / §8 清单查覆盖 |
| R2-14-7 | 概念 | Hooks 规则清单不全（条件 return 之后、try/catch、class、useMemo 回调）；报错文案；`use()` 可条件调用的例外；「不调 Hook 的函数不要加 use」 | 第一轮把 :45-58 的 Hooks 规则段当作已讲对，没按 rules-of-hooks 参考页逐条对照 |
| R2-14-8 | 概念 | composable 入参 `MaybeRefOrGetter` + `toValue()`（3.3+）规范化；VueUse `useWindowSize` 一句 | 第一轮 Vue 侧只核了「setup 同步调用」限制，没查 composables#input-arguments |
| R2-14-10 | 小问题 | 「依赖 []：永远不需要重跑」与同文件 StrictMode 双跑自相矛盾；「调用姿势与 React 完全一致」忽略 Hooks 规则 | 第一轮未逐句查绝对化措辞 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| AUDIT.md:442（同 :435 修改建议、:901） | 「并排 useSyncExternalStore 版 useWindowWidth」「把 useEffect 版改称通用副作用写法」 | `useWindowWidth` 主线应为 `useSyncExternalStore`，`useEffect + setState` 订阅作并排并标「18 前写法 / 简单场景仍可用」；第一轮自己引用的官方原文就是「删除 Effect 改用 uSES」，却仍让 Effect 版当主线 | 03-mainline.md §3.4：you-might-not-need-an-effect 逐字「Delete the Effect and replace it with a call to useSyncExternalStore」、React 18 博客「It removes the need for useEffect when implementing subscriptions」；zustand `react.mjs:6` / TanStack `useBaseQuery.js:30` 内部均用 uSES |
##### 同意的
- AUDIT.md:430（uSES 缺失、返回约定、useEffectEvent、标签全缺）, 435, 436, 439
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:437（Vue 侧 `let controller` + `onUnmounted(abort)` 冗余，有 `@vue/reactivity` 源码 `cleanup = effect.onStop` 与 10 题自述为证；第二轮 outline 行 33 反把 DebouncedUserSearch.vue:32-41 记为「已讲对」）；:438（两个 `.ts` Hook 文件不在 eslint react-hooks 的 `files: ['**/*.tsx']` 范围，与 §3.0 :159 同源；第二轮未提）；:440 / :429（ahooks 命名待核实；`useDebouncedValue.ts:55` → 30 题引用只部分成立；`:79`「10 题专讲竞态」措辞过重；第二轮 outline 行 33 记「交叉引用 10 / 27 成立」，两轮不一致，需主会话核对）；:429 入站备查（03 题 :63「14 题会再遇到快照」不成立）
- 级别差：R2-14-1 第二轮定严重（本题主责 uSES 全目录 0 次 + 文件头讲错），第一轮 :435 定概念
- 第一轮 :443 待核实（ahooks `useDebounce` / `useDebounceFn`）第二轮同样未核，outline 行 32 直接记为已讲对；第二轮自留 P-14-1（React 17 `use-sync-external-store/shim`）
- 拿不准：R2-14-3 与第一轮 :436 同一问题，但第二轮给了「实测报错文案」——是否已运行验证由主会话确认

#### 15. Context 跨层传值

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-15-3 | 概念 | defaultValue 只在树上无 Provider 时生效、静态不变；useContext 只找「上方最近的 Provider」；嵌套 Provider 局部覆盖；重复模块 / 漏 value 排错 | 第一轮把 :42-66 的 `createContext<T \| null>(null)` 段当已讲对，没按 createContext / useContext 参考页查 defaultValue 语义与查找规则 |
| R2-15-4（部分） | 概念 | 官方 scaling-up 写法：拆 state / dispatch 两个 context、Provider + useX 收进一个模块（→29）；四类场景里的「路由」「reducer + context」 | 第一轮 :457 修改建议只写「按变化频率拆 Context」，没查 scaling-up-with-reducer-and-context 的读写分离理由与四类场景清单 |
| R2-15-5 | 概念 | 「Before you use context」：先传 props，再抽组件把 JSX 当 children 传，两者不行才 context；MiddleLayer 已用 children 却没点破 | 第一轮 :451 / :457 的「children 模式」指 Provider 结构，没查 passing-data-deeply-with-context#before-you-use-context 的决策阶梯 |
| R2-15-6（部分） | 概念 | class `static contextType`、Legacy Context（contextTypes / getChildContext）19.0 移除 | 第一轮 :451 / :458 列了 `.Consumer`【旧写法】与 19.3 RSC，没按升级指南列 class / Legacy 两项 |
| R2-15-7（部分） | 概念 | inject 必须在 setup 同步阶段调用（与 `use(Context)` 可条件调用对照）；string key 时需 `inject<T>()` | 第一轮 :451 只列了 `inject(key, default)` / 工厂默认值 / `app.provide`，没查 composition-api-dependency-injection 页的调用限制 |
| R2-15-8（部分） | 生产 | AppProviders 聚合、测试 wrapper 提供 Provider（→34）、高频值不走 context 的替代 | 第一轮 :456 已要求重构为 `ThemeProvider({ children })`，但没有生产段 / 34 题维度 |
| R2-15-9 | 小问题 | 「根本不存在这个问题」「组件永远不直接 useContext」绝对化；模板残留「没有一一对应关系」 | 第一轮未逐句查绝对化措辞 |
| R2-15-10 | 小问题 | 只指向 16；应加 13 / 17 / 29 / 33 / 34 | 第一轮 :450 只核既有引用是否成立；33 / 34 当时未定 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 未发现可用依据证明的错误（重构为 ThemeProvider({ children })、补 use(Context) 与旧写法对照，两轮一致） | — |
##### 同意的
- AUDIT.md:451（use(Context)、memo 挡不住 context、`.Consumer`、ThemeProvider 结构、Vue inject 默认值 / app.provide、19.3 RSC、标签全缺）, 457, 458, 459, 461
##### 备注
- 第一轮有、第二轮没有（重要）：AUDIT.md:456 定严重——注释 :127-136「useMemo 后消费组件安然不动」在本 demo 树里不成立（MiddleLayer / ThemedCard / ThemedButton 是 `Example` :143-148 直接创建的非 memo 子元素，Example 重渲染它们必随之重渲染，与 value 引用无关，:123 useCallback / :138 useMemo 无任何可观察效果），依据 memo 页「React normally re-renders a component whenever its parent re-renders」；第二轮只降为 R2-15-8「未组件化 ThemeProvider」生产简化，outline 行 13 甚至把 :121-138 记为「已讲对」。建议主会话保留第一轮的严重定级与「加渲染计数演示」要求
- 第一轮 :451「React 没有内建 context selector」这一性能边界（16 题 Zustand 的动机）：第二轮只在学习者测试 #5 提「与 Zustand selector 比粒度差」，问题表未单列
- 级别差：R2-15-1「消费组件配合 React.memo」第二轮定严重，第一轮 :457 定概念（两轮依据相同：useContext / memo 页 caveat）
- 第一轮 :456「重渲染计数需运行验证」第二轮未做

#### 16. 全局状态（Zustand）

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-16-2（部分） | 概念 | `useStore` 基于 `useSyncExternalStore`（→14）；vanilla API `getState / setState / subscribe / getInitialState` 组件外读写与测试重置（→34） | 第一轮 :470 只在覆盖检查里写了一行「getState() / setState() 组件外用法」未定级；uSES 只作为 :475 的依据（react.mjs:5-12）出现，没当知识点讲 |
| R2-16-4（部分） | 概念 | 中间件 `devtools` / `persist` + `createJSONStorage` / `subscribeWithSelector` / `combine` / `immer`；`set(partial, true)` 会清掉 actions | 第一轮 :470 只有「middleware（persist / devtools）一句介绍」未定级；:479 提了 replace 但没说会清掉 actions（README:131） |
| R2-16-5 | 概念 | 异步 action（await 后 `set`）、slices 模式 `StateCreator<A & B, [], [], A>`、`combine` 免手写类型 | 第一轮没按 zustand README 列大纲，只按规格 §7 / §8 清单查覆盖 |
| R2-16-6 | 概念 | `createStore`（vanilla）+ Context 注入：按 props 初始化、SSR / RSC 每请求一个实例；模块级单例跨请求共享风险（Pinia 同样警告） | 第一轮没查 README「without React / Next.js」段与 Pinia SSR 警告；33 题当时未定 |
| R2-16-7（部分） | 概念 | Redux 经典写法（手写 store / combineReducers / connect HOC）作【旧写法】；Context + useReducer 手搓 store 未标【旧写法】 | 第一轮 :475 只列了 zustand v4 `shallow` 第二参【旧写法】；Redux 经典与 Context + useReducer 的标签没查 |
| R2-16-8 | 概念 | Pinia 对照缺：官方定位（核心团队、Vuex 维护模式）、模块级 reactive 最小方案与 SSR 警告、`$patch` / `$state`、setup store 需自写 `$reset`、`$subscribe` / `$onAction`、插件体系 vs 中间件 | 第一轮 Vue 侧只查了版本（pinia 4）与 Option / Setup 写法形态，没按 Pinia 文档列对照大纲 |
| R2-16-9 | 概念 | 「先分类」少两类：URL 状态（→18）、表单草稿（→07 / 31） | 第一轮把 :9-12 的三分类当已讲对，没对照 react.dev 与 zustand README「不该进 store 的」清单 |
| R2-16-10 | 生产 | 演示 store 单 store、同步 action、无持久化 / devtools、totalPrice 现算；未标「演示简化」也没给生产形态（slices、persist 白名单 + version / migrate、token 不落 localStorage → 35） | 第一轮无「生产简化」维度的检查 |
| R2-16-11（部分） | 小问题 | 模板残留「没有一一对应关系」（cartStore.ts:85、vue/cartStore.ts:20） | 第一轮本题未逐处查模板残留（§3.0 只做了全站统计） |
| R2-16-12 | 小问题 | 缺指向 14（uSES）、18（URL）、21（不可变）、33（SSR）、34（测试）、35（persist 与 token） | 第一轮 :469 只核了既有引用是否成立；31–35 当时未定 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 未发现可用依据证明的错误（主线 Zustand 与 03-mainline §3.5 一致） | — |
##### 同意的
- AUDIT.md:470（useShallow / 稳定引用、getState、middleware、RTK 对照、标签全缺）, 475, 476, 479, 481
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:477（`vue/cartStore.ts:7-8`「Options 风格…二者等价」不准确，有 pinia 文档「must return all state properties … cannot have private state」为证；第二轮 outline 行 26 反把 :7-8 记为已讲对）；:470 的 pinia 4.x【较新】版本说明（ESM-only + `@vue/devtools-api` v8）与 Option store 对照代码——第二轮均未提
- 第一轮 :478 / :482 待核实（柯里化 `create<T>()()` 原因原文）：第二轮 outline 行 13 已按 advanced-typescript 页核实「与官方一致」，可关闭；RTK API 细节由 R2-16-3 引 redux-toolkit.js.org 补齐
- 措辞精度：R2-16-1 写「selector 返回新对象每次都重渲染」，第一轮 :475 写「Maximum update depth exceeded 无限循环」并引 migrating-to-v5「may cause infinite loops」与 react.mjs:5-12（uSES 无 equalityFn）——第一轮更准，第二轮学习者测试 #3 也只写「每次重渲染」，建议阶段 2 采用第一轮表述
- 级别 / 类型：R2-16-3 把 :476 从「不完整」升为「讲错」（RTK 自述「too much boilerplate」），有依据，同意

#### 17. useMemo 与 useCallback

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-17-1（部分） | 概念 | Profiler 用法（本题主责）：录制 → commit → 火焰图 / Ranked；`<Profiler onRender>` 的 actualDuration / baseDuration；19.2 Performance Tracks【较新】；Vue DevTools 对照 | 第一轮 :490 只在覆盖检查写了一行「Profiler 只提名字无演示」未定级；`<Profiler>` 组件与 Vue 侧 profiling 未查 |
| R2-17-2（部分） | 概念 | 列表虚拟化（本题主责）：原理 + `@tanstack/react-virtual` / react-window + Vue 对照库 | 第一轮 :490 写「列表虚拟化在本批次任一题都未出现（是否另开题需决定）」，未定归属；第二轮 course-map 定 17 主责 |
| R2-17-4（部分） | 概念 | lint 规则逐条：`use-memo`（不放副作用、必须返回值）、`static-components`、`purity`、`immutability`；「linter 不需要安装编译器」 | 第一轮 :497 只有「recommended 已内置编译器规则（preserve-manual-memoization 等）」一句，没逐条落到本题 |
| R2-17-5 | 概念 | `memo` / `useMemo`「只是性能优化不是保证」：memo 组件自身 state / context 变化仍重渲染；React 可能丢弃 useMemo 缓存，没有它代码也必须正确 | 第一轮没按 memo / useMemo 参考页 caveats 逐条对照 |
| R2-17-6 | 概念 | 减少记忆化需求的五原则（children 传 JSX 等）；判断昂贵 `console.time` ≥ 1ms；`useCallback = useMemo(() => fn)` | 第一轮没查 useCallback#should-you-add-usecallback-everywhere 与 useMemo#how-to-tell-if-a-calculation-is-expensive |
| R2-17-7 | 概念 | `memo` 第二参数 `arePropsEqual`（深比较可能冻结）；class `PureComponent` / `shouldComponentUpdate` 对照 | 第一轮无【旧写法】段检查；memo 页 custom comparison 段未查 |
| R2-17-8（部分） | 概念 | 3.4 起 computed 只在值变化时触发副作用；`shallowRef` 降低大数据开销；Vue 官方对 React 记忆化的评价句 | 第一轮 :496 只补了 v-memo / v-once，没查 performance 页 computed-stability / reduce-reactivity-overhead 与 composition-api-faq |
| R2-17-9（部分） | 小问题 | 文件头「知道有这回事即可，不展开」与本题主责冲突 | 第一轮 :497 已判 Compiler 描述过时，但主责归属在第二轮 course-map 才定 |
| R2-17-10 | 生产 | `useMemo` 计算函数与 `ProductRow` 渲染体里的 `console.count` 未标「观察手段、计算函数必须纯」；200 条 filter+sort 是否达 1ms 未说明 | 第一轮无「生产简化」维度检查；没对照 useMemo 页「calculateValue 必须是纯函数」 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 未发现可用依据证明的错误（主线手写记忆化 + Compiler【较新】小节，两轮一致；§5.0 不启用 Compiler） | — |
##### 同意的
- AUDIT.md:489（18 题 :486 引用应指 15）, 490（Compiler 过时、v-memo / v-once、Profiler、虚拟化、标签全缺）, 496, 497, 502
##### 备注
- 第一轮有、第二轮没有（重要）：AUDIT.md:495（「Vue 不靠引用相等决定子组件更不更新」「事件处理函数不需要引用稳定」讲错——Vue `hasPropsChanged` 逐个 prop `!==` 比较，本例回调不触发只因 `isEmitListener` 把声明式 emit 排除；依据 `runtime-core.cjs.js:4835-4902` 与官方 Props Stability 节；第二轮 outline 行 32 反把 :18-20 / vue:79-84 / ProductRow.vue:22-24 记为「已讲对」，建议主会话保留第一轮结论）；:498（「编译器自动缓存内联事件处理函数」有边界：引用 v-for / v-slot 作用域变量或组件上成员表达式不缓存，`compiler-core.cjs.js:6210-6220`；第二轮 P-17-1 仍待核实，可用第一轮依据关闭）；:499（`ProductRow.vue:9-10` 与 `vue/Example.vue:125` 的 +1 / +2 计数不一致）；:500（StrictMode 也双调 useMemo 计算函数、DevTools 会调暗第二次日志；第二轮 outline 行 35 只记「已讲对」）
- 第一轮 :490 提到 `lazy` 代码分割在本批次未出现：第二轮归 32 题，本题未再提，需主会话确认落点
- 第一轮 :503 待运行验证（StrictMode 下 console.count 倍数）第二轮未做

#### 18. 路由（React Router）

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-18-3 | 严重 | 已定主线 Data 模式的启动代码（createMemoryRouter / createBrowserRouter + RouterProvider + loader + useLoaderData + Component）与 loader 守卫一处都没有 | 第一轮沿用规格主线「声明式 + RequireAuth」（AUDIT.md:557、:905），Data 模式只在 :511 覆盖检查里写了一行「缺失」未定级，也未按官方 modes 页定位质疑主线 |
| R2-18-8 | 概念 | Data 模式加分点整组缺失：errorElement / useRouteError、action + Form + useFetcher、useNavigation、Await 流式、lazy、useBlocker、handle / useMatches、middleware、父子 loader 并行 | :511 覆盖检查只一行列了 middleware / errorElement / lazy / useBlocker / handle 未定级；action + `<Form>` + useFetcher、useNavigation、`<Await>` 流式完全没列——第一轮主线是声明式，这些「仅 Data 可用」的 API 不在其视野内 |
| R2-18-11（部分） | 概念 | vue-router 5 文件路由（vue-router/vite）【较新】未提 | 第一轮 :554 只列了 vue-router/experimental 数据加载器【尝鲜】，没查 router.vuejs.org 的 file-based-routing 页 |
| R2-18-12（部分） | 小问题 | 开放重定向 :237 与权限 :369 应指向 35，Activity :468 与路由级 lazy 应指向 32 | 第一轮时 31–35 新题尚未定（§5 待决），无法给交叉引用落点 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| AUDIT.md:557（同 :905） | 「主线声明式 + 三态 RequireAuth【主流】，并排 Data 模式」 | 主线应为 Data 模式，声明式 + RequireAuth 作并排【主流】；面试高频的守卫 / pending / 离开确认只有 Data 模式能完整回答 | 03-mainline.md §3.1：官方 modes 页逐字「Declarative mode enables basic routing features…」「Data Mode adds data loading, actions, pending states…」；注：03-mainline 称此为「维持已定决定」，即 AUDIT.md §5.0 已改为 Data 主线，与 §3 本题小节 :557 自相矛盾 |
##### 同意的
- AUDIT.md:510（:486 引用应指 15 题）, 511（标签缺失：RequireAuth / Activity / next() / v6 / .Provider）, 516, 518, 519, 520, 521, 522, 523, 524, 525, 529, 530, 531, 532, 533, 535, 537
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:517（严重：「React 19 类型才允许返回 ReactNode」实为 @types/react 18.2.8 + TS 5.1，第一轮有 unpkg 依据，第二轮问题表与大纲均无此条）；:526（「守卫只在导航时运行」被讲成 beforeEach 与 React 的框架差异，第二轮 outline 行 40 把 :533-538 记为已讲对）；:527（「React 没有 meta 这一层」:562-563 / router.ts:49-51 讲错，第二轮 R2-18-8 只列 handle / useMatches 未讲、未指出这句讲错）；:528（「Vue 没有相对 to」不准确，vue-router 4 有 resolveRelativePath；第二轮 outline 行 40 把 :425-426 记为已讲对，R2-18-12 只当模板残留）；:534（「五个页面组件」实为六个）；:536（RouteMeta 类型扩展）
- 第二轮疑似有误：R2-18-12「现有 03 / 05 / 09 / 13 / 15 / 16 / 17 引用逐条核对无误」——实读 `src/topics/18-routing/react/Example.tsx:486`「Context 的 value 用 useMemo 保持引用稳定（17 题）」，该内容在 `src/topics/15-context/react/Example.tsx:128-138`，第一轮 :510 / :537「应改为 15 题」正确
- 级别差：R2-18-5「按钮不渲染更安全」第二轮定严重，第一轮 :525 定概念
- 第一轮 :558 待核实 (2)「父子 loader 并行官方页未命中」：第二轮 R2-18-6 已给 createBrowserRouter 页逐字「running loaders in parallel」，可关闭；(1) Vue `router.back()` 兜底判据第二轮同样未核
- 拿不准：R2-18-2 把 :198-200「导航前 vs 渲染时」记为「已触及」，第一轮 :519 未提这一句——两轮都认为该段需重写，无实质分歧

#### 19. 异步提交与防重复

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-19-1 | 概念 | state guard 受渲染快照限制：同一渲染内重入（程序化 `requestSubmit` / 循环）读到旧 `submitting`；生产加 `useRef` 锁（→12） | 第一轮把「两层保险」当已讲对，没按 state-as-a-snapshot 检查布尔守卫在同一渲染内的语义 |
| R2-19-2 | 生产 | `await` 后无条件 `setResult` / 清空输入：卸载或被取代时回写；mockApi 支持 `signal` 却未用 `AbortController` / `ignore`（→27） | 第一轮没核 `src/shared/mockApi.ts:91-93` 的签名，也没把「提交回写」纳入竞态检查（只在 10 / 11 / 27 查了请求侧） |
| R2-19-3（部分） | 概念 | 错误未分层：网络可重试 vs 服务端字段错误；边界不捕获事件处理器所以提交错误应进 state | 第一轮 :566 / :573 只列了「错误作为 state 返回 vs 抛到边界」两条路径，没提错误分层，也没引 Component 页「Event handlers」不捕获原文 |
| R2-19-4（部分） | 概念 | `useFormStatus` 须在 `<form>` 子组件调用；`startTransition(async)` 中 `await` 后的更新要再包一层；`useOptimistic`；React 18 `startTransition` 只接同步函数【旧写法】 | 第一轮 :571-573 讲了排队语义、`useFormStatus().pending`、form reset，但没查 useFormStatus 页的子组件约束与 useTransition 页的「await 后再包」caveat；18 → 19 差异未定为旧写法条目 |
| R2-19-5 | 概念 | 无一句指向 `useMutation.isPending`（→30）、`useFetcher.state` / `useNavigation`（→18） | 第一轮 :565 只核了既有引用是否成立，没按「服务端状态层 / 路由层替代」查交叉引用 |
| R2-19-6 | 生产 | 「前端防重复 ≠ 幂等」：服务端幂等键 / 唯一约束是最终防线；错误提示无 `role="alert"` / `aria-describedby`（→35） | 第一轮无「生产简化」与 a11y 维度检查；35 题当时未定 |
| R2-19-7 | 概念 | Vue：`async` handler 的 Promise 拒绝也进 `onErrorCaptured` / `errorHandler`；`await router.push()` 后再结束 submitting | 第一轮 Vue 侧只查了 `.number` 修饰符与「Actions 无对应物」，没查 runtime-core `callWithAsyncErrorHandling` 与 vue-router navigation 页 |
| R2-19-8（部分） | 小问题 | 未引用 20 / 27 / 30 / 31 | 27 / 31 的主责分工在第二轮 course-map 才定 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 未发现可用依据证明的错误（手写 submitting 主线 + Actions 并排 / 拆 31 与 03-mainline §3.2 一致） | — |
##### 同意的
- AUDIT.md:565（07 题 :20 / :246 需同步改写）, 566, 571, 572, 573, 575, 577
##### 备注
- 第一轮 :574 / :578 待核实（`type="number"` 输入 "12." 的 value 表现需运行验证）：第二轮 outline 行 27 把 :36-39 记为「已讲对」并引 react.dev input 页，但未给运行验证或规范原文——仍应视为未核，且第二轮把它归 07 主责
- 深度口径不一：第一轮 :577「本题只留 3～5 行对照与指向」、03-mainline §3.2「19 用一段指向 31，isPending 作并排写法」、R2-19-4 要求本题讲 isPending 排队 / useFormStatus 子组件 / useOptimistic——三者对「19 题里 Actions 讲多深」需主会话统一
- 级别 / 类型：R2-19-4 定「缺标签」，第一轮 :571 / :572 拆成两条「概念」，实质同一问题
- 拿不准：R2-19-1 的「真实用户双击是否复现」第二轮自留 P-19-1，第一轮未涉及

#### 20. 错误边界

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-20-3 | 生产 | 只讲「关键区域局部兜底」无根边界：未捕获渲染错误会让 React 移除整棵 UI；生产需根边界 + 局部边界 + fallback 重试 / `resetKeys` | 第一轮 :593 只查了重置与上报，没对照 Component 页「React will remove its UI from the screen」推出粒度要求 |
| R2-20-6 | 小问题 | 「React 中唯一仍需要 class 组件的场景」绝对化（`getSnapshotBeforeUpdate` 同样无函数等价物）；「没有一一对应关系」贴在已给出对应物的句后 | 第一轮未逐句查绝对化措辞；没读 Component 页 getSnapshotBeforeUpdate 段 |
| R2-20-8 | 概念 | Vue 对照缺：`async` 事件处理器的 Promise 拒绝也进 `onErrorCaptured`（`callWithAsyncErrorHandling`）；`<Suspense>` 异步错误同走 `onErrorCaptured`（→32） | 第一轮 Vue 侧只查了 errorCaptured 冒泡顺序与钩子自身抛错，没查 runtime-core.cjs.js:205-213 的异步错误处理 |
| R2-20-1（部分） | 严重 | `lazy` 失败可被边界捕获（→32） | 第一轮 :586 / :591 列了 startTransition / use(promise) / form action 例外，漏 lazy |
| R2-20-2（部分） | 概念 | 官方「你不必自己写 class」定位原文、`FallbackComponent` / `onError` / `withErrorBoundary`；包未安装 | 第一轮 :593 列了 fallbackRender / onReset / resetKeys / useErrorBoundary，未引 Component 页定位句，也没核 node_modules 是否安装 |
| R2-20-4（部分） | 概念 | React 18 重复日志（rethrow）应作【旧写法】对照 | 第一轮 :586 (2) 只写「19 不再 rethrow」，没把 18 行为定为旧写法条目 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | — | 未发现可用依据证明的错误（主线手写 class + `react-error-boundary` 并排与 03-mainline §3.6 一致） | — |
##### 同意的
- AUDIT.md:585, 586（(1)(2)(3)(4) 与标签）, 591, 592, 593, 595, 597
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:586 (5)（Vue `errorCaptured` 自下而上冒泡顺序、钩子自身抛错时两个错误都送 `errorHandler`）；:586 (6)（React Compiler lint `error-boundaries` 规则【较新】，第一轮实测不触发）；:594（「官方多年表示未来可能提供」与 Component 页现行措辞不符，第二轮 R2-20-6 只评「唯一」绝对化）
- 级别差：R2-20-1 第二轮定严重（31 / 32 依赖此结论），第一轮 :591 定概念
- 第一轮 :598 待核实（「Vue 捕获后不会自动卸载崩溃子树」需运行验证）：第二轮 outline 行 25 记为「已讲对、大纲未列」但未给来源，仍未核
- 03-mainline §3.6 待用户决定：是否安装 `react-error-boundary`（第一轮 :593 直接按已可用写建议，未提未安装）

#### 21. 不可变数据更新

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-21-1 | 概念 | 数组表不全：排序 / 反转要先拷贝、插入中间用 slice + 展开、`slice`（拷）vs `splice`（改）；错法 `arr.sort()` 后 set、先改子对象再 `{...state}` | 第一轮没按 updating-arrays-in-state 官方四张表逐项核对，只核了课件已有的追加 / 删除 / 映射三种 |
| R2-21-2 | 概念 | ES2023 `toSorted` / `toReversed` / `toSpliced` / `with` 可替代「先拷贝再排」【较新】；本项目 tsconfig `lib: ES2022` 不含 | 第一轮没查非破坏数组方法，也没核 tsconfig lib 与之的关系 |
| R2-21-4 | 概念 | class `this.setState({a})` 浅合并顶层字段，Hooks setter 整体替换【旧写法】 | 第一轮没查 Component#setState 页，本题旧写法对照段为空 |
| R2-21-7 | 概念 | 官方「为什么不推荐 mutation」五条只覆盖排查、优化两条：撤销 / 重做靠保留旧快照、新特性依赖快照语义、React 实现更简单 | 第一轮没读 updating-objects-in-state 的 Deep Dive |
| R2-21-8 | 概念 | 「Proxy 拦截 set…只更新依赖它的地方」暗示属性级更新；Vue 3.5 实际是组件级 render effect（属性级是 Vapor 3.6 rc） | 第一轮没核 reactivity-in-depth 页的更新粒度原文，Vue 侧只核了 shallowRef / props 只读 |
| R2-21-6（部分） | 概念 | 规则边界：改刚创建的对象可以（Local mutation is fine）；深嵌套根治是归一化（→ 03） | 第一轮 :606 只列了「useReducer 同规则（29）」与 Vue props 只读，没读 keeping-components-pure / choosing-the-state-structure 的边界表述 |
| R2-21-9（部分） | 概念 | Vue 对照缺：`reactive` 不能整体替换 / 解构（坑互为镜像）；Vue 官方 `useImmer`（shallowRef + produce）；`markRaw` | 第一轮 :606 / :612 只列了 shallowRef / shallowReactive / triggerRef 与 props 只读，没查 reactivity-in-depth 页的 useImmer 示例与 reactive 限制 |
| R2-21-3（部分） | 概念 | Immer 原理（draft 是记录改动的 Proxy）、RTK `createSlice` 内置 / Zustand immer 中间件、代价 | 第一轮 :614 只要求「3～5 行 useImmer 示例」，没把 RTK / Zustand 的 immer 关系纳入 |
| R2-21-10 | 小问题 | 「三大数组模式」(:7) 与「五种模式」(:12) 数量打架；`useState(() => structuredClone(…))` 用了惰性初始化却未解释、未指向 03；「最根本的分歧」绝对化 | 第一轮 :616 只核实 structuredClone 写法正确，没查解释与交叉引用缺口 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | （未发现可用依据证明的错误结论） | — | — |
##### 同意的
- AUDIT.md:606（Immer 示例、Compiler / immutability lint【较新】、useReducer 同规则、TS readonly、Vue shallowRef / props 只读、标签缺失）, 611（对应 R2-21-5）, 612（对应 R2-21-9 shallowRef / triggerRef 部分）, 614（对应 R2-21-3）, 616（structuredClone / StrictMode 双调核实正确，第二轮 outline 行 25-26 同）
##### 备注
- lint 口径与级别差（R2-21-5 vs AUDIT.md:611）：第一轮**实跑** `--rule 'react-hooks/immutability: error'` → `:136` error，定「严重」（前提是 §5.5 决定切到 recommended）；第二轮按文本（eslint.config.js 只开 2 条，反例现状不被拦）定「概念 / 未讲」。事实一致，级别差来自「是否假定切换预设」；第二轮 H 批只对 12 / 14 / 26 实跑，21 未复跑
- 第一轮有、第二轮没有：AUDIT.md:613（「Object.is 相等 → 直接跳过重渲染」官方有限定「in some cases React may still need to call your component before skipping the children」；第二轮 outline 行 8 记为「已讲对」。我倾向第一轮：有 react.dev useState 原文，改写时加半句即可）；:606「结构共享」术语（第二轮 outline 行 13 认为 :84 / :142 已讲对，无冲突）
- 级别差：R2-21-11「readonly / ReadonlyArray 防 mutate、生产 id 来源」第二轮定生产，第一轮 :606 只在覆盖检查一行提「TS readonly」未定级
- 主线：本题无主线争议；两轮结构建议一致（保留五种模式 + 反例，补 Immer / lint / Vue 对照）

#### 22. 综合：订单管理页

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-22-1 | 概念 | Thinking in React 五步与「是不是 state 三问」未作为拆页方法讲：为什么 keyword / status / page 在父级、编辑草稿在行内、筛选后列表 / 总页数 / 是否为空都不是 state | 第一轮只按 §8.6「数据获取」核对综合页，没把 thinking-in-react 页当作本题大纲，也没检查与 25 题 state 归属的衔接 |
| R2-22-4 | 概念 | 编辑 / 删除的乐观更新与回滚：TanStack onMutate / onError / onSettled 三段、只用 variables 的轻量版、React 19 useOptimistic（→ 30 / 31） | 第一轮没查 optimistic-updates 页；31 新题当时未定，无落点 |
| R2-22-5 | 概念 | 错误分层：请求失败是数据状态（已做），渲染崩溃要靠行级 / 页级 Error Boundary 兜底，resetKeys 随筛选重置（→ 20） | 第一轮没检查综合页与 20 题的衔接（全课没有任何题引用 20） |
| R2-22-6（部分） | 概念 | 可访问性零提及：table th scope / role="search" / aria-live 播报 / 分页 aria-current / 删除按钮可访问名 / useId 关联 label / 确认删除的焦点管理；文本渲染不解析 HTML（→ 35） | 第一轮 :632 只写了权限 / 后端鉴权一条；没有 a11y / 安全维度（35 新题未定），:635 提到 disabled 但只当 UX 问题 |
| R2-22-8 | 概念 | 行级状态用 editing / confirmingDelete / saving / deleting 四个布尔（多数组合不可能），与列表用判别联合自相矛盾且未说明；官方建议 status 枚举消灭 impossible states | 第一轮没按 choosing-the-state-structure「Avoid contradictions」核对行级状态结构，只核了列表的判别联合 |
| R2-22-10 | 概念 | Vue 侧用模块变量 controller 手工 abort，未提 3.5 的 onWatcherCleanup 现行写法（→ 27） | 第一轮没查 Vue 3.5 现行写法，Vue 对照只核了 `.number` 与 watch 类比 |
| R2-22-12 | 概念 | 搜索输入防抖或 useDeferredValue、筛选切换用 startTransition、大表格虚拟化（→ 14 / 17 / 32） | 第一轮没按性能维度核对综合页；32 新题未定 |
| R2-22-7（部分） | 生产 | 三种生产写法里的 C「React 19 Actions（form action / useActionState / useFormStatus / useOptimistic）」未提示 | 第一轮 :625 / :630 只列 TanStack 与路由 loader 两种；31 新题未定 |
| R2-22-11 | 小问题 | 「两边完全一样」「与 React 写法一一对应」——行级状态建模（4 布尔 vs reactive 对象）、竞态处理（cleanup vs 模块变量）两边并不相同 | 第一轮没扫本题的绝对化措辞（§3.0 :169 只统计了「没有一一对应关系」） |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | （未发现可用依据证明的错误结论） | — | — |
##### 同意的
- AUDIT.md:625（(1) 演示简化 + 生产替代、(2) URL 状态、(3) 权限与后端鉴权、(4) 旧数据消失 / placeholderData）, 630（对应 R2-22-7）, 631（对应 R2-22-2；级别差：第一轮生产、第二轮概念）, 632（对应 R2-22-6 安全半句）, 635（对应 R2-22-3；级别差：第一轮小问题、第二轮生产）, 638（`.number` 自动应用两轮均核实）
##### 备注
- lint 口径（R2-22-9 vs AUDIT.md:633）：第一轮**实跑** `--rule 'react-hooks/set-state-in-effect: error'` 本文件 0 告警，并用 `--stdin` 探针证明只有 effect 体同步 setState 才报；第二轮按文本写「可能命中，需运行验证（P-22-1）」。第一轮结论更强且有实测，R2-22-9 与 P-22-1 可按第一轮关闭；两轮都同意应加注释说明这一点（§4.2 :920 也未把 22 列入 recommended 会失败的 4 题）
- 第一轮有、第二轮没有：AUDIT.md:634（:47-48「≈ Vue 的 watch([keyword, status, page], …)」类比与 Vue 版实际只 `watch(statusFilter)` 不一致；第二轮 outline 行 11 把 Vue 对照记为「已讲对」）；:636（:90 批处理可补「（24 题）」交叉引用）；:625(5) Compiler lint 说明（并入 :633）
- 主线：03-mainline §3.3「22 保持 effect 手写但七、生产环境注意写明三种生产改写；是否迁 TanStack 待用户决定」——第一轮 :630 / :638「保留综合演示」与之一致，无分歧
- 拿不准：R2-22-6 的 a11y 清单（th scope / aria-live / 焦点管理）依据是 W3C APG / MDN 第三方来源，非 React / Vue 官方；是否作为本题「生产环境注意」的必答项取决于 35 题的分工

#### 23. 渲染模型与 state 快照

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-23-1 | 概念 | Trigger → Render → Commit 三阶段与「Commit 只改有差异的 DOM 节点」、浏览器 paint 未讲；题目叫「渲染模型」却无官方三阶段命名 | 第一轮 :647 认为「§8.16 心智模型已覆盖」，只核了课件已有句子与官方一致，没按 render-and-commit 页列大纲 |
| R2-23-2 | 概念 | state 与渲染树位置绑定：同位置同组件保留 / 换类型或 key 重置；组件内定义组件的坑；路由参数变化实例复用；Vue key / `<component :is>` 对照 | 第一轮把 key / 实例复用归 06 / 10 题（:646 只验证引用成立），没查 preserving-and-resetting-state 页是否该在「渲染模型」里讲 |
| R2-23-3 | 概念 | StrictMode 四条行为 + 双调函数清单（组件体、useState / set / useMemo / useReducer 的函数）+ 19.3 hydration 双调【尝鲜】+ Vue 无对应物 | 第一轮 :647 / :660 只核实了「渲染两遍、DevTools 变灰」这两句正确并要求加标签，没列 StrictMode 页的全部行为 |
| R2-23-4 | 概念 | 纯函数完整定义（不改渲染前已存在的对象；props / state / context 只读；局部突变可以）与副作用去处（事件处理器；useEffect 最后手段） | 第一轮没读 keeping-components-pure 页，UI = f(props, state) 只核了「同输入同输出」半条 |
| R2-23-6 | 概念 | class 组件 `this.state` 是可变实例字段、事件处理器读最新值而非快照【旧写法】 | 第一轮没查 Component 页，本题旧写法对照段为空 |
| R2-23-8 | 生产 | 渲染期 console.log 数渲染次数是演示手段，未标「演示简化」，生产用 DevTools Profiler（→ 17） | 第一轮本题 0 条生产问题，没把「演示手段 vs 生产做法」套到渲染期 log 上 |
| R2-23-5（部分） | 概念 | lint `purity` / `refs` / `set-state-in-render` / `static-components` 规则清单与 Compiler「纯函数 + 不可变」前提 | 第一轮 :647 / :652 / :657 只提了 Compiler 自动记忆化与 immutability 一条规则，没列编译器规则家族 |
| R2-23-10 | 小问题 | 「state 存在组件函数之外（shelf），每次 useState 返回该次渲染的快照」未明说 | 第一轮没按 state-as-a-snapshot Recap 逐条核对 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | （未发现可用依据证明的错误结论） | — | — |
##### 同意的
- AUDIT.md:647（Compiler【较新】、标签缺失）, 653（对应 R2-23-7 ref 不是 Proxy，两轮依据相同：reactivity-in-depth 页 + RefImpl 源码）, 655（对应 R2-23-9「Vue 根本没有…这个概念」）, 657（对应 R2-23-5 Compiler 部分）, 169（§3.0 模板残留，对应 R2-23-9）
##### 备注
- lint 口径与级别差：AUDIT.md:652「严重」是第一轮**实跑** `recommended` 得到 `:192` / `:280` `localCopy += 1` 命中 `react-hooks/immutability` error（前提是 §5.5 决定切预设）；第二轮 B 批按文本，R2-23-5 只定「概念 / 未讲」且未点名这两行。事实不冲突，第二轮少了具体命中位置——改写时应沿用第一轮的 `eslint-disable-next-line` + 注释方案
- 第一轮有、第二轮没有：AUDIT.md:654（:176-177「React 18+ 会把同一个事件里的多次 setter 合并」暗示 17 不合并，第一轮有 react-18-upgrade-guide 原文「Before React 18, we only batched updates inside React event handlers」；第二轮 outline 行 25 把同一句记为「已讲对」。我倾向第一轮：结论不错但措辞需精确，与 24 题 :677 同类）；:656（:53「（spec 明写）」指代不明，应改为官方 State as a Snapshot 原文）
- 第一轮 :647「StrictMode 双调渲染函数（19.x 行为）」措辞不准：双调组件体自 18 起已有（第二轮 outline 行 15 引 StrictMode 页），19.3 新增的只是 hydration 双调；不影响结论，改写时按 R2-23-3 的版本口径写
- 主线：本题无主线争议；两轮结构建议一致（保留、小幅修改）

#### 24. State batching 与函数式更新

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-24-1 | 概念（讲错） | :256-257「所以处理器里读 state 永远是旧值」把读旧值归因于批处理；同文件 :144-147 已正确说「和批不批处理无关」，两处自相矛盾 | 第一轮只核了 :144-147 讲对的那句（:677 附近），没通读 :255-258 发现反向归因 |
| R2-24-4 | 概念 | 「flushSync 不能让处理器里的 state 变量变新」未明说，学习者易把 flushSync 当「读新值」的修法 | 第一轮 :674 只核了 flushSync caveats，没从学习者追问（面试第 4 问）角度核 |
| R2-24-5 | 概念 | 「React 不跨事件批处理」（两次点击各自渲染；第一次禁用后第二次不会再提交）未讲 | 第一轮没按 queueing-a-series-of-state-updates 页逐条列大纲 |
| R2-24-6 | 概念 | `Object.is` 相同值跳过渲染、set 函数身份稳定可省出依赖未讲 | 第一轮没按 useState 页核对本题 |
| R2-24-7 | 概念 | 缺两处一句话落点：useReducer 的 dispatch 同规则 → 29（29 题两处反向指 24）；Pinia `$patch` → 16 | 第一轮 :667 只核了本题指出去的引用是否成立，没核被 29 反向引用时本题该有的一句 |
| R2-24-8 | 概念 | Transition 内更新与紧急更新分开批处理 / 渲染；19.3 起 Transitions 独立渲染【较新】 | 第一轮没查 useTransition 页与 19.3 博客；32 新题未定 |
| R2-24-3（部分） | 概念 | `ReactDOM.unstable_batchedUpdates(fn)` 手动批处理【旧写法】（19.2.8 仍导出）未提 | 第一轮 :668 只列了「legacy root 下仍是 17 行为」一条，没查 reactwg 讨论与 react-dom 导出 |
| R2-24-11（部分） | 小问题 | 「中间状态永远不会画到屏幕上」绝对化——flushSync 自己（:304-309）就把中间状态画出来了，应限定「批处理生效时」 | 第一轮没扫本题绝对化措辞，只核了 :375「Vue 里根本没有这个坑」一处 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | （未发现可用依据证明的错误结论） | — | — |
##### 同意的
- AUDIT.md:668（set-state-in-effect 未提、legacy root【旧写法】、标签缺失——对应 R2-24-3 / R2-24-12）, 673（对应 R2-24-9；级别差：第一轮严重、第二轮生产）, 674（对应 R2-24-2）, 675（对应 R2-24-10）, 169（§3.0 模板残留，对应 R2-24-11）
##### 备注
- lint 口径与级别差（AUDIT.md:673 vs R2-24-9）：第一轮**实跑** `recommended` 得到 `:282` `set-state-in-effect` error 并定「严重」（前提是 §5.5 切预设）；第二轮 C 批按文本定「生产 / 未标简化」。事实一致，处置方案一致（`eslint-disable-next-line` + 注明或改 ref 计数）；第一轮多指出「探针自身 setState 会让每次事件再多一次级联提交」（:673），第二轮未提
- 第一轮有、第二轮没有：AUDIT.md:667 / :678（:367「自定义 Hook 里对外暴露的 increment()（14 题）」——14 题没有任何暴露 setter 的 Hook，第一轮已 grep 核实；第二轮 outline 行 10 把 :359-368 记为「已讲对」未核该引用。我倾向第一轮，应改措辞或删「14 题」）；:676（「Vue 没有更新队列」应限定为「没有 state 层的更新队列」，Vue 有 `queueJob` 渲染任务队列，第一轮附源码行号）；:677（:146-147「退回 React 17 不批处理的场景」——17 在事件处理器内是批处理的，与 23 题 :654 同类措辞问题）
- 第一轮 :681 已核实「Vue 无 flushSync 同步刷新 API」（grep `runtime-core.d.ts` 无 `flush*` 导出），第二轮 outline 行 25 引 `runtime-core.d.ts:61-62` 同结论，无冲突
- 主线：本题无主线争议；两轮结构建议一致（保留模拟器与区块，补 caveat / 标签 / lint 说明）

#### 25. 状态提升与 state 归属

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-25-1 | 概念 | 状态提升三步法（移除子 state → 父先传硬编码 → 父加 state 连同处理器传下）未讲；文件头承诺「状态提升」却只给结果 | 第一轮没按 sharing-state-between-components 页列大纲，只核了课件已有的归属表与反例 |
| R2-25-2 | 概念 | 受控 / 非受控组件的组件级官方定义与取舍（driven by props 最灵活但父要全配置 / local state 易用难协调 / 实践中混合）未讲 | 同上；第一轮把受控只当 07 题的 `<input value>` 概念（:688 引用 07 ✓） |
| R2-25-3 | 概念 | Thinking in React「随时间不变 / 父传来 / 能算出」三问；「新建组件专门持有 state」；合并一起变的 state；选中态存 id | 第一轮没查 thinking-in-react / choosing-the-state-structure 页，只核了「能算出的不是 state」一句 |
| R2-25-4（部分） | 概念 | 取舍阶梯中间两级：官方「Start by passing props → 抽组件传 JSX 作 children → 再 context」；store 加分判据（devtools / 持久化 / 更新频繁）；提升后重渲染的控制手段（拆 owner / children 组合 / memo） | 第一轮 :689 / :696 只写了「Context（15 题）是中间档」一句，没查 passing-data-deeply-with-context 页的三步与 13 题 children 组合 |
| R2-25-6 | 概念 | 【旧写法】HOC / render props 状态共享；【较新】React 19 ref 作普通 prop 后提升命令式句柄无需 forwardRef | 第一轮本题旧写法对照段为空，没查 reusing-logic-with-custom-hooks / React 19 博客 |
| R2-25-7（部分） | 小问题 | 「React 没有任何机制」「永远一致 / 永远同步」等绝对化 | 第一轮 :697 只处理了 :39 的模板残留，没扫其余绝对化措辞 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| AUDIT.md:689（同 :695） | 「Vue 3.5 响应式 props 解构【较新】未提」「3.5+ 的响应式 props 解构【较新】」 | 3.5 响应式 props 解构（2024-09 发布，已超 12 个月）是 Vue 侧现行主线写法，应标【主流】；`withDefaults` 才是 3.4 及以下的对照写法 | index.md R2-02-2「3.5 主线是响应式 props 解构，withDefaults 只是 3.4 及以下的写法」、R2-28-10「3.5 基线应以响应式 props 解构默认值为主线」；03-mainline §3.7 的成熟度口径（不足 12 个月才标【较新】） |
##### 同意的
- AUDIT.md:689（store 边界：服务端数据 → 30、URL → 18、Context 中间档；Vue 模块级 reactive 小 store——对应 R2-25-4 / R2-25-5）, 694（「完全一致」绝对化 + Vue 模块级 reactive() 对照，对应 R2-25-4 Vue 行与 R2-25-7）, 696（对应 R2-25-5；级别差：第一轮生产、第二轮概念 / 交叉引用）, 697（对应 R2-25-7 模板残留）
##### 备注
- 两轮定性相反（R2-25-8 vs AUDIT.md:688）：第二轮说「换 key 重置 → 10 题」「组件类型切换 → 10 题」编号存疑（待核实 P-25-1）；第一轮 :688 已逐条核实 10 题 `:400` 换 key 重建实例、`:396` 换组件类型确有该内容。我倾向第一轮：引用成立，P-25-1 可关闭；第二轮的真正诉求是「主责应指向 06 / 23」，那是 course-map 分工问题，不是引用错误
- 第一轮有、第二轮没有：AUDIT.md:695（「Vue 里直接用 props.x 永远是最新值，只有 ref(props.x) 才会断开」漏了 ≤3.4 解构 defineProps、`watch(props.x)` 不包 getter、解构 reactive() 三种断开方式，附 vuejs.org props 页原文；第二轮 outline 行 27 把 ProductListOwnCopy.vue:5-7 记为「已讲对」。我倾向第一轮：有官方原文，与 02 / 26 题的 Vue 解构坑口径一致）；:698（「Vue 侧必须拆成四个 .vue 文件」——SFC 约定而非唯一写法）；:699（反面修法的 lint 加分：recommended 的 set-state-in-effect 会报 :262；官方还有渲染期 setState 第三修法）；:689 `defineModel` 3.4+ 标签缺失（第二轮 outline 行 24 记为「现行写法」，无冲突）
- 第一轮 :702 已核实 `defineModel({ required: true })` 重载与 watch `flush: 'pre'`；第二轮 outline 行 29 把 `flush: 'pre'` 列为待核实 P-25-4——可按第一轮（vuejs.org watchers "Callback Flush Timing"）关闭
- 主线：本题无主线争议；两轮结构建议一致（保留、小幅修改）

#### 26. 过期闭包（stale closure）

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-26-3 | 概念 | 官方修法体系不全：修法 C「交互触发的逻辑搬进事件处理器」、修法 D「拆 Effect / 对象与函数移进 Effect / 只读原始值」未讲；修法优先级（函数式更新 → 正确依赖 → useEffectEvent → latest ref）未成体系 | 第一轮只按规格 §8.2 / §8.3 清单核对（:710），没按 react.dev removing-effect-dependencies / separating-events-from-effects 两页列目标大纲，因此只发现「区块三缺 latest ref」一条 |
| R2-26-4 | 概念 | 「可变值不能作依赖」：把 `ref.current` 写进依赖数组不会触发重跑（面试第 4 问主问） | 第一轮没查 lifecycle-of-reactive-effects 页「组件体内所有变量都是响应式的」一节，只核了 cleanup 里读 `ref.current` 的 lint 提示 |
| R2-26-2（部分） | 概念 | useEffectEvent 的 lint 前提（需 eslint-plugin-react-hooks ≥ 6，否则会被塞进依赖数组）、「只能在同一组件 / Hook 内声明」、自定义 Hook 接收回调时 `useEffectEvent(onReceiveMessage)` 包一层（→ 14）未讲 | 第一轮 :715 / :716 只核了 useEffectEvent 参考页 caveats 与源码，没读 19.2 博客的「upgrade to eslint-plugin-react-hooks@latest」段与 reusing-logic-with-custom-hooks 页 |
| R2-26-5（部分） | 概念 | Vue 官方 composition-api-faq 原话「没有过期闭包需要担心」+ 承认 React 部分问题可由 Compiler 解决，未引用作对照 | 第一轮 :718 / :719 已用 reactive 限制与 watch 显式源纠正绝对化，但没查 composition-api-faq 页的官方对照原话 |
| R2-26-9 | 生产 | 轮询用手写 setInterval + fetch 未标「演示简化」，生产优先 TanStack Query `refetchInterval`（→ 30）；WebSocket / SDK 场景只一句带过 | 第一轮本题 0 条生产问题——没把「演示简化 vs 生产写法」这一维度套到轮询区块上，只核了 cleanup 纪律 |
| R2-26-10 | 小问题 | 两处 `eslint-disable-next-line` 刻意错误示范未标【旧写法】、未引官方「most users just disable the lint rule… can lead to bugs」 | 第一轮 :725 只在待核实里提到该行「警告文案被屏蔽未实测」，没把官方对「禁用 lint 排除依赖」的态度当作课件缺口 |
| R2-26-8 | 小问题 | 「10 题手写的 latest ref 就是它的原理」「10 题修法三」依赖 10 题保留修法三，10 题重写时需联动 | 第一轮 :709 只验证了引用成立，没标注跨题联动风险 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| AUDIT.md:715（同 :724、:913） | 「区块三加【修法二】latest ref【主流】，useEffectEvent 改【修法三】【较新】」「30 秒速答只讲…latest ref，useEffectEvent 作加分点」 | 优先级应为 ① 函数式更新 → ② 正确依赖 → ③ useEffectEvent【较新】主线 → ④ latest ref 并排；latest ref 不能标【主流】，应标「社区惯用法、react.dev 无推荐语、React 18 项目仍需要」 | 03-mainline.md §3.7（维持 §5.0 已定决定：useEffectEvent 主线）；26-outline 待核实项：react.dev useRef / referencing-values-with-refs / useEffectEvent / separating-events-from-effects 四页均无 latest ref 模式；19.2 博客逐字「most users just disable the lint rule and exclude the dependency. But that can lead to bugs」 |
##### 同意的
- AUDIT.md:710（标签缺失；React 18 / 19.0–19.1 不能 import useEffectEvent）, 715（useEffectEvent 无【较新】标签、:620 并列措辞）, 716（caveat 第 3 条与「其他 Hook」半句）, 718（「Vue 没有这个坑」绝对化，对应 R2-26-6）, 719（「没有任何对应物」→ watch 显式源，对应 R2-26-5 / R2-26-6）, 164 / 169（§3.0：「永远新鲜」与「没有一一对应关系」模板残留，对应 R2-26-6 / R2-26-7）
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:717（「JSX 里的 onClick 不会过期」需加限定——被 useCallback / useMemo 缓存且漏依赖的处理器一样过期；第二轮 outline 行 33 把 :125-127 / :353-360 记为「已讲对」，未提此限定。第一轮有 react.dev useCallback 原文，我倾向第一轮：这是 17 题 memo 场景的真实坑，应在改写时保留）；:720（「根本没有 effect」与 :115 / :86 自相矛盾）；:721（useCallback 开 Compiler 后可省未提）；:722（Vue 侧 onBeforeUnmount 里移除监听更简单，附源码依据）；:710(3)（Compiler 使 :329 useCallback 可省）
- 两轮定性相反：latest ref 的标签——第一轮【主流】（依据：React 18 占 24.7%、10 题修法三已用），第二轮【旧写法】/ 社区惯用法（依据：react.dev 无推荐语）。我倾向第二轮 + 03-mainline 的折中：作「并排」、标「社区惯用法，18 项目仍需要」，不标【主流】也不标【旧写法】；第一轮「18 项目无法照抄 useEffectEvent」的事实两轮一致，只是标签口径不同
- 级别差：R2-26-6 把「任何时刻读 .current 都是最新的」（:14）在 effect 同步前的窗口不成立列为绝对化，第一轮未提这一子点（小）
- lint 口径：两轮一致——第一轮 §4.2 :920 未把 26 列入 recommended 预设会失败的 4 题（按文本）；第二轮 H 批内存实跑 recommended 对本文件 0 命中（26-audit 行 35），且 :485「pollOnce 不被要求进依赖」得到实测印证
- 第一轮 :725 待核实（:242 警告文案未实测）第二轮同样未实测，仍属标准行为

#### 27. 异步竞态、取消与过期响应

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-27-1 | 概念（讲错） | :356「被 abort 的 promise 不会 resolve」对真实 fetch 不完整：响应头已到、body 未读完时 abort，fetch 已 resolve，`response.json()` 才以 AbortError reject | 第一轮只核了 mock 一步返回的行为，没对照 MDN fetch 取消页的 body 阶段 |
| R2-27-3 | 概念 | `AbortSignal.timeout(ms)`（抛 TimeoutError 而非 AbortError，mockApi 的 isAbortError 会漏判）、`AbortSignal.any([...])`、`signal.throwIfAborted()` | 第一轮只核了 AbortController / AbortError 基本用法，没查 MDN AbortSignal 的静态方法 |
| R2-27-4 | 概念 | 路由 loader 的取消：loader 收到 `request: Request`，导航中断时路由器 abort 其 signal，透传 `request.signal` 即可（→ 18） | 第一轮 18 题主线是声明式，Data 模式 loader 不在视野内，本题只把 TanStack 当唯一「自动化」 |
| R2-27-7 | 概念 | 「只靠 loading 布尔挡不住竞态」与「切换参数时重置 data（官方 setBio(null)）」未点破；forKeyword 检测仪更强但没解释为何 loading 不够 | 第一轮没按 useEffect 页 fetching-data 示例逐句核对 |
| R2-27-8 | 概念 | 三层未区分：防抖减少发出的请求数（→ 14）、取消 / 忽略处理已发出的响应、useDeferredValue / useTransition 处理渲染层过期 UI（→ 32） | 32 新题未定；第一轮没从面试追问角度核 |
| R2-27-2（部分） | 概念 | TanStack 默认不取消的理由、`queryClient.cancelQueries` 手动取消、Suspense hooks 下取消不工作 | 第一轮 :732 / 30 题 :812 只写了「前提是 queryFn 消费 signal」，没读 query-cancellation 页其余段落 |
| R2-27-5（部分） | 概念 | TanStack v4 `promise.cancel()` → v5 仅 signal【旧写法】 | 第一轮 :744 只列了 isMounted 反模式，没查 TanStack 迁移页 |
| R2-27-10 | 生产 | 真实 fetch / axios 的取消写法（`fetch(url, { signal })` + `response.ok`、`axios.isCancel`）未示范；isAbortError 依赖 DOMException 未标「演示简化」 | 第一轮本题 0 条生产问题，没套「演示简化 vs 生产写法」维度 |
| R2-27-9（部分） | 小问题 | 交叉引用缺 14（防抖）、19（提交防重复）、32、18 | 第一轮 :732 只核了指出去的引用是否成立，没核该有而没有的引用 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| AUDIT.md:745（同 :733） | 「补一行对照并标【较新 3.5+】」（Vue 3.5 `onWatcherCleanup`） | 3.5 发布于 2024-09，已超 12 个月，`onWatcherCleanup` 应作 Vue 侧现行写法【主流】；第二轮 R2-22-10 / R2-27-6 同口径 | 27-audit 大纲行 30（主流 / 3.5+，`reactivity.d.ts:753`）；03-mainline §3.7 的成熟度口径（不足 12 个月才标【较新】） |
##### 同意的
- AUDIT.md:733（onWatcherCleanup、React 17 警告【旧写法】、标签缺失——对应 R2-27-5 / R2-27-6 / R2-27-11）, 738（对应 R2-27-11；级别差：第一轮严重、第二轮生产）, 744（对应 R2-27-5 isMounted）, 745（对应 R2-27-6）, 812（30 题小节：`:331`「把这一整套自动化了」缺 queryFn 消费 signal 前提——对应 R2-27-2）, 169（§3.0 模板残留，对应 R2-27-9）
##### 备注
- lint 口径（AUDIT.md:738 vs R2-27-11 / P-27-4）：第一轮**实跑** `set-state-in-effect: error` 得 3 errors（200:7、263:7、343:7），即每个面板只报第一处同步 setState；第二轮按文本写「三个面板各 3 处」并把 `log()` 包装是否命中列为 P-27-4——按第一轮实测，包装后的 `log()` 行没有单独报错，P-27-4 可按此关闭；两轮处置方案一致（渲染期派生或 `eslint-disable` + 注明）
- 第一轮有、第二轮没有（第二轮疑似漏）：AUDIT.md:739（:29-30 / :393-397「Vue 侧没有换 key 销毁重建这一招」讲错——Vue `:key` 同样能强制替换并重跑生命周期，第一轮引 vuejs.org built-in-special-attributes 原文；第二轮 outline 行 28 把 :393-399 记为「已讲对」。我倾向第一轮：有官方原文，且 25 题 outline 行 28 自己也承认 Vue `:key` 重置子树）；:740（:15-16「拿得到 signal 就 abort（首选）；ignore 是唯一选择」方向与 react.dev「ignore is the most reliable way」相反；第二轮 outline 行 11 记为「已讲对」只补「abort 后仍靠 ignore 兜底」。我倾向第一轮：官方原文明确，且两者可叠加）；:741（vue:92-93「Vue 不存在漏依赖这个坑」讲错——`watch` 只追踪显式 source；第二轮只在 26 题 R2-26-5 讲 watch 显式源，27 题未列）；:742（`vue/panelTypes.ts:3`「`<script setup>` 不能 export 类型」——第二轮只在 28 题 R2-28-9 列，27 题未列）；:743（:450 / :279「一定逆序返回」页面文案缺确定性延迟前提）
- 级别差：R2-27-6 定概念、第一轮 :745 定小问题；R2-27-2 定概念、第一轮 :812 定小问题
- 拿不准：R2-27-6 / 大纲行 30 把 watch 回调第三参 `onCleanup` 标【旧写法】——vuejs.org watchers 页 3.5 仍并列文档化两种写法、未弃用第三参（第一轮 :745 只说「缺 onWatcherCleanup 对照」，未贬第三参）。我倾向第一轮：第三参仍是【主流】，`onWatcherCleanup` 是 3.5 新增的并排写法，需主会话按 Vue 官方原文定
- 待核实：第一轮 :748 两项（`export type` 起始版本、vue-tsc 从 .vue `import type`）第二轮同样未核

#### 28. React + TypeScript 基础

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-28-5 | 概念 | `FormEvent<HTMLFormElement>` 在 @types/react 19.2.18 已标 `@deprecated`（"FormEvent doesn't actually exist…"），`onSubmit` 实际类型是 `SubmitEvent<T>`；07:126、19:45 同款 | 第一轮 :754 把 `FormEvent` 列为本题用到的类型却没核 `index.d.ts:2086-2091` 的 @deprecated 标注 |
| R2-28-6 | 概念（讲错） | :16「泛型参数决定了 e.target / e.currentTarget 的类型」只对 ChangeEvent（与 SubmitEvent）成立；MouseEvent / KeyboardEvent 的 `target` 仍是裸 `EventTarget` | 第一轮没核 `SyntheticEvent<T>` = `BaseSyntheticEvent<E, EventTarget & T, EventTarget>` 第三参固定 EventTarget |
| R2-28-1（部分） | 严重 | ref 回调只能返回清理函数（19）；Vue 对照 3.5 `useTemplateRef<T>` / 组件 ref `InstanceType<typeof Foo>` | 第一轮 :756① / :763 列了 useRef 传参与 RefObject 统一，但没列 ref 回调返回值变化，Vue 侧模板引用类型未对照 |
| R2-28-4（部分） | 严重 | Vue `<script setup lang="ts" generic="T">` 泛型组件对照；`.tsx` 箭头函数 `<T,>` 消歧 | 第一轮 :756② 只一行「缺泛型组件写法」未定级，没查 sfc-script-setup 页 generic 段与 TS JSX handbook |
| R2-28-10（部分） | 概念 | `withDefaults` 被写成默认值主线；3.5 基线应以响应式 props 解构默认值为主线，withDefaults 标 3.4 及以下写法 | 第一轮 :764 只纠正了「工厂函数」限定与版本标签，沿用课件 withDefaults 主线未质疑 |
| R2-28-11（部分） | 概念 | tsconfig 前提（`jsx: react-jsx`、`lib` 含 DOM、`strict`）、`.tsx` 禁尖括号断言、Vite 只转译 → `tsc` / `vue-tsc --noEmit`（本仓库 typecheck 脚本）、`createContext<T \| null>` + 自定义 Hook 抛错、`ChangeEventHandler<T>` 别名 | 第一轮 :756⑤ 只一行列了 useRef / useContext / useCallback 类型与 CSSProperties，没按 react.dev typescript 页与 Vue typescript/overview 页列工程前提 |
| R2-28-12（部分） | 小问题 | `satisfies` 未标 TS 4.9 起；`useId` 应一句引用（→ 07）；「它至今也写不出泛型组件」宜改「不能直接声明泛型组件」；生产提示补「优先 currentTarget」 | 第一轮 :767 只处理了「22 道旧题」过时计数 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| AUDIT.md:764 | 「各处补【主流 3.3+】【较新 3.5+】」（响应式 props 解构 3.5+ 标【较新】） | 3.5 响应式 props 解构（2024-09 发布，已超 12 个月）是 Vue 侧默认值的现行主线写法，应标【主流】；withDefaults 才是 3.4 及以下的对照写法 | R2-28-10（sfc-script-setup 页逐字 "This is not necessary when using default values with destructure"；`runtime-core.d.ts:380`）；index.md R2-02-2 同口径；03-mainline §3.7 的成熟度口径 |
##### 同意的
- AUDIT.md:756（① React 19 类型变化整节、② 泛型组件、③ ReactNode vs ReactElement、④ ComponentProps / ref-as-prop、⑤ 类型写法工具箱、标签缺失、Vue 宏版本——对应 R2-28-1 / -2 / -3 / -4 / -7 / -8 / -11）, 761（对应 R2-28-9；级别差：第一轮严重、第二轮概念）, 763（对应 R2-28-1 / -2 / -7）, 764（对应 R2-28-10 工厂函数限定与版本标签）, 767（对应 R2-28-12「22 道旧题」）, 169（§3.0 模板残留，对应 R2-28-12）
##### 备注
- 级别差（同一事实两轮定级方向相反）：React 19 类型变化四组缺失（useRef 传参 / React.JSX / ref-as-prop + ComponentProps / 泛型组件）第一轮在 :756 覆盖检查里列出但只在 :763 定一条「概念」，第二轮 R2-28-1～4 各定「严重」（依据 course-map §2 把「React 19 类型变化 + 泛型组件」主责给 28、学习者测试 2 / 3 / 5 问「不能」）；反之 `<script setup>` export 类型讲错第一轮定「严重」（:761，附 compiler-sfc 源码 + 编译实测），第二轮 R2-28-9 定「概念」。我倾向：缺失按第二轮（本题是 TS 专题，19 类型变化是规格 §8 组 11 明文要求），讲错按第一轮（课件把它当规则讲了三遍且 27 / 30 题复述）
- 第一轮有、第二轮没有：AUDIT.md:762（`React.FC` 缺官方立场——react.dev typescript 页通篇用参数标注、不提 FC——与【旧写法 / 仍可用】标签；第二轮 outline 行 24 记为「已讲对」，只在 R2-28-12 改一处措辞。我倾向第一轮：面试常问「要不要用 React.FC」，需给官方依据）；:765（:50「spec 里写的」模板残留）；:766（「永远不写 e: any」绝对化，可接受）；:768（`vue/require-default-prop` 属 strongly-recommended、级别 warn，附 eslint-plugin-vue 源码行号）
- 第一轮 :755 已核 02 题 :35 / :118 有 `ComponentPropsWithoutRef` 与 ref-as-prop；第二轮 R2-28-3 补充 course-map §2 把主责定在 28、02 只作引用——两轮事实一致，分工口径以第二轮为准
- 待核实：第一轮 :771「`export type` 起始版本」第二轮同样未核；R2-28-5 pending 里注明 react.dev 教程仍写 FormEvent，改写时应注「教程滞后于类型定义」

#### 29. useReducer 与判别联合 Action

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-29-5 | 概念（讲错） | :13「不存在 03 题读快照的坑」以偏概全：reducer 参数不会过期，但组件里 dispatch 之后读 `items` 仍是本次渲染的快照（只对下一次渲染生效）；:329-332 自己也承认异步回调里绝对数量会过期 | 第一轮 :788 / :790 核了 dispatch 稳定与 bail-out，没核 :13 这句绝对化与 useReducer 页 dispatch caveats 的关系 |
| R2-29-2 | 概念 | Immer / `useImmerReducer`（官方教程正式给出）与 Vue `reactive`「本身就是 draft」的对照未提；RTK `createSlice` 内置同思路 | 第一轮 :779 只列了 RTK createSlice 对照，没读 extracting-state-logic 页的 Immer 段 |
| R2-29-3 | 概念 | Troubleshooting 三个常见错误：某 case 没 return → state 变 undefined；对象 state 漏 `...state`；渲染期 dispatch → Too many re-renders | 第一轮没查 useReducer 页 Troubleshooting 节 |
| R2-29-4 | 概念 | 异步逻辑放事件处理器 / effect，完成后 dispatch `request_started / succeeded / failed` 结果 action；服务端数据优先 Query（→ 30） | 第一轮只核了「reducer 不做 I/O」与「Pinia 可 async」两句正确，没问「那异步放哪」 |
| R2-29-7 | 概念 | React 19 `useActionState` 形如「异步 reducer」与 useReducer 的分工【较新】（→ 31） | 31 新题当时未定 |
| R2-29-8（部分） | 概念 | reducer + Context 拆 state / dispatch 两个 context 的官方模式及理由（dispatch 稳定，只读 dispatch 的组件不随 state 重渲染） | 第一轮 :779 只写「useReducer + Context 组合只一句带过、无代码」，没读 scaling-up-with-reducer-and-context 页 |
| R2-29-6（部分） | 概念 | Redux 时代 action creator + `ADD_TODO` 常量 + switch 样板【旧写法】 | 第一轮 :779 / :786 只列了 RTK createSlice 与 `{ type, payload }` 排版，旧样板未提 |
| R2-29-9（部分） | 小问题 | Vue 对照缺 Pinia `$patch` 一次改多字段指向 16 | 第一轮 :792 Vue 侧核对只核了已有句子 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | （未发现可用依据证明的错误结论） | — | — |
##### 同意的
- AUDIT.md:779（React 19 推断改进、useReducer + Context、RTK 对照、标签缺失——对应 R2-29-1 / -6 / -8 / -11）, 785（对应 R2-29-10「根本写不出来」绝对化；两轮依据相同：突变仍绕过 reducer）, 786（对应 R2-29-6）, 787（对应 R2-29-9 测试句将随 34 题过期）, 792（`:171`「Vue 没有 StrictMode 双跑」成立，第二轮 outline 行 16 同）, 169（§3.0 模板残留，对应 R2-29-10）
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:784（:125-126「no-unused-expressions 不允许 `action satisfies never;`」讲错——第一轮 `--stdin` 探针实测 EXIT 0，规则源码未把 `TSSatisfiesExpression` 视为无用表达式；第二轮 outline 行 17 把 :122-129 记为「已讲对」。我倾向第一轮：有实测 + 源码行号，改写时删掉那半句）；:788（dispatch 稳定可引官方原话「often see it omitted from Effect dependencies」）；:789（StrictMode 双调缺「development-only」限定）；:790（bail-out 漏官方备注「React may still need to call your component before ignoring the result」，与 21 题 :613 同类）
- lint 口径：两轮一致——第一轮 27 题 :738 记「28 / 29 / 30 的 .tsx 在同一组规则下 0 问题」（实跑）；第二轮 outline 行 35「代码无命中」（按文本）
- 第一轮 :778 已核实 03 / 15 / 16 / 24 引用；第二轮 outline 行 17 补 03 vue:101 也用 never，无冲突
- 主线：本题无主线争议；两轮结构建议一致（保留、小修）

#### 30. TanStack Query 与服务端状态

##### 第一轮漏掉的
| R2 编号 | 级别 | 要点 | 第一轮为何没发现 |
|---|---|---|---|
| R2-30-1 | 概念 | React 官方把 TanStack 列为「客户端缓存」方案之一（与 useSWR / React Router 6.4+ 并列）；路由 loader / use(promise) 作为数据获取候选未提；服务端状态四特征只讲两条 | 第一轮没查 react.dev useEffect 页的官方定位，也没按 TanStack overview 页的四特征列大纲；主线口径（03-mainline §3.3：TanStack 生产默认、loader 并排、use(promise)【较新】引用）当时未定 |
| R2-30-2 | 概念 | queryKey 哈希规则：顶层必须数组、确定性哈希、对象键顺序无关、数组元素顺序有关 | 第一轮只按规格 §8 组 6「缓存与失效」清单核对，没读 query-keys 页 |
| R2-30-3（部分） | 概念 | fetchStatus 的 `paused` 离线态；触发重取的默认项不全（refetchOnReconnect / refetchOnMount 默认 true、refetchInterval 默认 false） | 第一轮 :816 只核实了 refetchOnWindowFocus 一项默认值，没查 important-defaults 全表 |
| R2-30-4（部分） | 概念 | mutation 默认不重试；mutate 与 mutateAsync 取舍（卸载后回调不触发 / 可 try-catch）；useMutation 级回调先于 mutate 级、连续 mutate 只触发最后一次 | 第一轮只在覆盖检查 :802 写了一行「mutateAsync 未提」未定级，没读 mutations 页 |
| R2-30-5 | 概念 | 乐观更新两种写法（onMutate + cancelQueries + 快照回滚 vs 用 variables 直接渲染）及与 React 19 useOptimistic 的对照（→ 31） | 第一轮没查 optimistic-updates 页；31 新题当时未定，无落点 |
| R2-30-7 | 概念 | 渲染优化：结构共享保持引用稳定、tracked properties（...rest 解构会关掉）、select 需引用稳定 | 第一轮只在覆盖检查 :802 写了一行「select 未提」未定级，没读 render-optimizations 页 |
| R2-30-8（部分） | 概念 | 分页 placeholderData: keepPreviousData + isPlaceholderData 的正面用法（22 题翻页闪烁的官方解法）；依赖查询 enabled（pending + idle、瀑布） | 第一轮 :808 只把 keepPreviousData 当 v4→v5 改名条目，:802 一行「enabled 未提」未定级；没读 paginated-queries / dependent-queries 页 |
| R2-30-11 | 生产 | 演示简化未标：mockApi 直接 throw（真实 fetch 须检查 response.ok）；SSR 下 QueryClient 必须每请求新建（模块级会跨用户共享）+ dehydrate / HydrationBoundary（→ 33） | 第一轮 :816 只核实了 `useState` 建 client 与 StrictMode 行为，没查 ssr / query-functions 页；33 新题未定 |
| R2-30-10（部分） | 小问题 | 旧名 React Query / 包名 react-query → @tanstack/react-query 未提 | 第一轮 :802 只指出 registry summary 的 v4「loading / error / data」措辞，没核「React Query」旧名 |
| R2-30-12（部分） | 小问题 | 「React 本身只有 useState / useEffect」忽略 use / Suspense 这条线 | 第一轮未扫文件头 :5 的绝对化表述 |
##### 第一轮说错的
| 第一轮位置 | 第一轮原话（≤30 字） | 本轮判断 | 依据 |
|---|---|---|---|
| — | （未发现可用依据证明的错误结论） | — | — |
##### 同意的
- AUDIT.md:802（status × fetchStatus、isLoading、v4→v5 清单、useSuspenseQuery、标签缺失、registry 措辞）, 807（对应 R2-30-3）, 808（对应 R2-30-10）, 812（对应 R2-30-6；级别差：第一轮小问题、第二轮概念）, 814（对应 R2-30-9 useSuspenseQuery、R2-30-12 devtools）, 169（§3.0 模板残留，对应 R2-30-12）
##### 备注
- 第一轮有、第二轮没有：AUDIT.md:809（生产：`useSyncExternalStore` 的 subscribe 每次渲染都是新箭头函数 → 每秒重订一次；有 react.dev Pitfall 原文 + `useBaseQuery.js:30` 源码。第二轮 outline 行 25 把 :220-245 记为「已讲对」未提此坑。我倾向第一轮：依据充分，且是 14 题主线 uSES 的标准 Pitfall，改写时应保留）；:810（`vue/OrdersCountBadge.vue:18`「`<script setup>` 不能 export 类型」讲错——第二轮只在 28 题 R2-28-9 指出同一结论，30 题未列这一处）；:811（`as StatusFilter` 断言与 28 题守卫教学矛盾）；:813（`vue/Example.vue:38`「16 题的 cartStore 注释」实际只在 `16/react/cartStore.ts:11`，Vue 侧 `cartStore.ts` 无此注释——本轮 grep 复核成立；第二轮 outline 行 35「交叉引用全部指向正确主题」只核到题号未核到文件）；:816 已核实清单（第二轮未复核，无冲突）
- 定性微差：:807 说 :178-179 把 isPending 讲成「首次加载（中）」概念不完整（enabled: false 时也为 true）；R2-30-3 说「isPending / isFetching 布尔层面已讲对」只列为两维度未讲。两轮都要求补 status × fetchStatus + isLoading，无实质分歧；措辞上我倾向第一轮，「首次加载中」确实不是 isPending 的定义
- 级别差：R2-30-6「取消是 opt-in」第二轮定概念（文件头 :13 把「自动 abort」说成无条件），第一轮 :812 定小问题；两轮依据相同（`query.js:138,177` + query-cancellation 页）
- 待核实：StrictMode 下「两条 queryFn + 一条被取消」的日志顺序，第一轮 :818 与第二轮 P-30-1 均未运行验证
- 主线：03-mainline §3.3（30 = 生产默认，loader 并排，use(promise) 只作【较新】引用）与第一轮 :917「主体保留」一致；R2-30-1 是该口径在课件里的落点，第一轮未写

#### 31–35 与第一轮 §4.3 的对比

第一轮 §4.3 只为 31–35 各写了一行「内容要点」（未定级、未给来源、未做现状对照），§4.3 末尾的「散点知识点并入现有题」表则把不少盲点条目分派给了老题。本轮为五题各写了目标大纲（20–34 行）、用关键字扫描 30 题得到「现状」、并按盲点归属定级。逐题对比：

| 题 | 第一轮 §4.3 有的 | 本轮新增（第一轮漏掉的） | 本轮判断与第一轮不同的 |
|---|---|---|---|
| 31 表单与 Actions | `<form action>`、`useActionState`、`useFormStatus`、`useOptimistic`、错误两条路径、`isPending` 与排队、Vue 无对应物、19 作基线 | Action 的定义（async transition）与 `await` 后需再包 `startTransition` 的限制；自动 reset 只针对非受控字段与 `requestFormReset`；`useActionState` 的 `permalink` 与「state 作错误载体」；`useFormStatus` 必须在 `<form>` 子组件；`useOptimistic` 的 set 必须在 Action 内；「暴露 action prop」模式；渐进增强；与路由 `<Form>` + action 的区分；`useFormState`【旧写法】；19.3 `submitter` / `onReset`【尝鲜】；现状扫描：07 明说「本项目没有实现 form actions」，`useFormStatus` / `useOptimistic` 全站 0 命中（R2-31-1～5 五条严重） | 第一轮把 Actions 定为「【主流】新增」但没写 07 / 19 的标签口径；本轮 §3.2 明确「受控 + 手写 submitting 与 Actions 并列【主流】，不把手写标旧写法」 |
| 32 并发与异步 UI | `useTransition` / `useDeferredValue`、`Suspense` + `use` + `lazy`、与 Error Boundary 联动、`<Activity>`【较新】、`<ViewTransition>`【尝鲜】、Vue `defineAsyncComponent` / `<Suspense>` / `<Transition>` | 并发渲染的前提（`createRoot`）与「可被打断重来」的含义；独立 `startTransition` 无 `isPending`；Suspense 再挂起时的回退规则与 `key` 重置边界；`use(promise)` 的缓存前提与不可 `try/catch`；`useDeferredValue` vs 防抖节流、19 的 `initialValue`【较新】；路由级 `lazy` 只作引用；Activity 预渲染语义；`addTransitionType`、19.3 Transition 独立渲染【尝鲜】；StrictMode 与并发的关系；React 18 差异【旧写法】；现状扫描：18 题已有一句 Activity ↔ KeepAlive 但措辞不准，其余全站 0 命中（R2-32-1～6 六条严重） | 无实质分歧；第一轮建议「示例内自带 Suspense / 边界避免壳应用接管」本轮采纳进十段大纲 |
| 33 服务端与 RSC | CSR / SSR / SSG / RSC 区别、代码在哪里运行、`'use client'` / `'use server'`、Next 16 App Router、Server Functions、Nuxt 对照 | ISR 与 19.2 Partial Pre-rendering【较新】；RSC ≠ SSR 的官方原话；RSC 限制（无 state / effect、可 async）与收益；「没有 Server Component 指令」这一常见误解；序列化边界与组合规则（Client 不能 import Server，但可经 children 接收）；Server Function 安全（参数完全由客户端控制、鉴权在函数内）；RSC Payload 与数据进树；`NEXT_PUBLIC_` / `server-only`；React 19 文档元数据 `<title>` / `<meta>` / `<link precedence>`（规格 §7 明列，第一轮未分派）；19.3 `use(browser())`【尝鲜】；Vue SSR 生命周期、hydration mismatch 三大原因、跨请求状态污染；现状扫描：全站只有 20 题一处 "SSR" 名词（R2-33-1～8 八条严重） | 第一轮把 33 标为「不可运行、讲解组件 + 注释」，本轮同意并在练习段给出可断言结论（Node 里跑 `renderToString`） |
| 34 测试 | Vitest + Testing Library 为 18 / 24 / 26 的关键结论写测试、Vue 侧 `@testing-library/vue`、Playwright 概念 | 测试分层；Vitest 配置（`environment` / `globals` / `setupFiles`）与 `vi.*` / fake timers；RTL Guiding Principle 与查询优先级（`getByRole` 优先）；`render` 选项与自定义 `render`（wrapper 注入 Router / QueryClient / Context）；`renderHook`；`findBy` / `waitFor`；`userEvent` vs `fireEvent`；`act` 的定义与 19 起从 `react` 导入；jest-dom 断言；测路由（`createRoutesStub` / `createMemoryRouter` / `MemoryRouter`）；测 TanStack（新建 `QueryClient`、`retry: false`）；测 Error Boundary；MSW 的结论（只提一句、不安装，因数据源是内存 mockApi）；每题「可断言结论」机制；Vitest Browser Mode【较新】；Jest + `react-test-renderer` / Enzyme【旧写法】；现状：`package.json` 无 test 脚本与测试依赖，29 题一段 `expect()` 形态并自注「没有装测试框架」（R2-34-1～9 九条严重） | 第一轮把「Vue 侧用 `@testing-library/vue`」当默认；本轮大纲指出 Vue 官方组件测试推荐是 `@vue/test-utils`，`@testing-library/vue` 是其上层封装且两年多未发版（`AUDIT.md` §2.1 已注），阶段 1 安装前需再确认（见附录） |
| 35 安全与可访问性 | XSS 与 `dangerouslySetInnerHTML` ↔ `v-html`、开放重定向（复用 18 的 `safeRedirect`）、令牌存储、前端权限只是体验层、a11y 基础（语义标签、label、`aria-current`、焦点管理） | JSX 自动转义的边界与 `javascript:` URL 注入（React 16.9 起警告）；净化（DOMPurify）/ 沙箱 iframe / CSP 的分工；Vue 的模板注入与 `:style` 面；`redirect()` 接受绝对 URL 会跳外站（官方原句）；`rel="noopener"`；Cookie 属性与 CSRF、令牌取舍结论；IDOR；密钥不进前端；ARIA 第一规则、地标、`aria-live` / `aria-invalid`、键盘可达、路由切换移焦、模态框焦点陷阱（APG）、`autoFocus` 的坑、`eslint-plugin-jsx-a11y`、视觉隐藏 vs `aria-hidden`；现状扫描：18 题 :369「不渲染比 disabled 更安全、F12 翻不出来」是讲错（R2-35-4），其余 0 命中（R2-35-1～6 六条严重） | 第一轮写「复用 18 题 `safeRedirect`」——18 题目前只有注释没有实现（第一轮 §3 自己也指出），本轮改为「35 主责实现、18 引用」；OWASP / MDN 按你 2026-09-16 的决定作第 ③ 级来源 |

第一轮的可选新题 36（样式）、37（表单工程化）本轮未展开（`AUDIT.md` §5.0 已定「放最后再定」）；「散点知识点并入现有题」表里的条目本轮已逐条落到对应老题的问题表（例如 `useId` → 07、`use(Context)` → 15、`useSyncExternalStore` → 14、ref 回调清理 / `useImperativeHandle` → 12、Actions 排队语义 → 19、RTK → 16），并按盲点归属定了级 —— 这正是第一轮只列「并入」而没做的部分。

> 逐题对比覆盖 30/30 题。

## 5. 每题重写大纲（规格 §9 十段模板，30 + 5 题）

> 每段只列要点，不写正文；「参考」列官方链接。

### 01. 组件与 JSX

#### 一、30 秒面试速答
- 组件 = 返回标记的普通 JS 函数，名字必须大写开头；JSX 不是模板，是会被编译成 `jsx()/jsxs()` 调用的语法扩展。
- JSX 只是值：能存变量、当参数、被 return；花括号里只能放表达式；单根用 `<>` Fragment。
- 组件必须纯：同输入同输出、不改渲染前已存在的对象；副作用放事件处理器；`<StrictMode>` 开发期双调来暴露不纯。
- 一次渲染 = trigger → render（调用组件函数）→ commit（只改有差异的 DOM）；调用组件函数不等于改 DOM。
- 绝不在组件内部定义组件：每次渲染是新函数，state 会被重置。
#### 二、核心概念（React）
- 函数组件与大写命名规则；小写标签走 HTML 元素，大写走组件（写成 `<mybutton />` 的现象）。
- JSX 三规则：单根（Fragment）、所有标签闭合、属性 camelCase（`className` / `htmlFor` / `tabIndex`；`aria-*` / `data-*` 例外）；多行 return 加括号。
- 花括号只能出现在文本位与属性 `=` 后；`style={{ }}` 双花括号 = 表达式里的对象字面量；数字自动补 px、unitless 属性除外。
- JSX 编译目标：自动运行时 `react/jsx-runtime` 的 `jsx()/jsxs()`；Vite plugin-react 默认 automatic；React 19 要求新 transform。
- 纯函数：同输入同输出、不改外部对象、局部突变允许；收益 = memo 可跳过、并发可中断重启、可在服务端运行（指向 17 / 32 / 33）。
- `<StrictMode>` 开发期双调组件、初始化函数、Effect，生产无影响；根组件应包裹。
- 渲染三步 trigger / render / commit 与浏览器 paint 的区分；同一组件多次使用各自独立实例（深入见 23、03）。
- 模块约定：一文件至多一个 default export，工具与常量 named export；组件返回类型 ReactNode、`FunctionComponent<P>` 签名（指向 28）。
#### 三、Vue 对照
- SFC 三块 vs 一个函数；Vue 模板编译为 render 函数，"Separation of concerns is not equal to the separation of file types"。
- `{{ }}` 插值与 JSX `{ }` 都只放表达式；Vue 表达式沙箱、只能访问受限全局。
- `class` / `for` 原样 vs `className` / `htmlFor`；`:class` 对象数组语法 vs 字符串拼接（clsx 一句）；`:style` 数字不自动补 px。
- Fragment vs 多根组件（多根时 attrs 不自动透传，指向 02）；`<template v-if/v-for>` 无痕包裹。
- Vue 也支持 JSX / TSX，但 transform 与 React 不同（`class` / `for` 可用、slots 传法不同），只作一句说明。
- `dangerouslySetInnerHTML={{ __html }}` ↔ `v-html`：两边都警告 XSS，富文本必须先消毒，主责 35。
- 纯渲染：Vue `setup` 只执行一次、模板按依赖重跑，「重跑整个函数」心智模型不适用，无 StrictMode 等价物（深入 23）。
- in-DOM 模板大小写不敏感、须 kebab-case、不能自闭合；SFC 不受影响。
#### 四、关键区别
- 「模板 DSL + 指令」vs「JSX 就是 JS 值」：适用所有 React 版本；Vue 也可写 JSX，区别是默认路径而非能力上限。
- React 组件每次渲染重跑整个函数（19.2 主线）；Vue `setup` 一次 + 响应式依赖追踪（3.5）。
- React 数字样式自动补 px（React 特有）；Vue `:style` 需手写单位。
- Fragment `<>` 不能带 key；Vue 多根组件不需要包裹但会丢失 attrs 自动透传。
- 组件名大写是 JSX 编译期规则；Vue SFC 里 PascalCase 只是推荐，in-DOM 模板另有限制。
#### 五、常见追问与回答要点
- 「为什么 17 之后不用 `import React`？」：自动运行时由编译器注入 `react/jsx-runtime` 导入；19 起必须用新 transform。
- 「`<div>` 与 `<Div>` 差在哪一步？」：JSX 编译期按首字母决定 `jsx('div')` 还是 `jsx(Div)`。
- 「局部突变算不纯吗？」：改自己渲染期新建的对象允许；改 props / 外部变量不允许。
- 「StrictMode 生产会双调吗？」：不会，"do not impact the production build"；19.3 起 hydration 时也双调 Effects【尝鲜】。
- 「调用组件函数等于更新 DOM 吗？」：不是，render 阶段只算出树，commit 才改 DOM，且只改差异。
- 「在组件里定义组件会怎样？」：每次渲染新函数类型 → 同位置视为不同组件 → 子树卸载重建、state 丢失；用 key 不能修，必须提到模块顶层。
#### 六、易错点
- `onClick` 等属性大小写、`class` 写成 JSX 属性、`for` 未改 `htmlFor`。
- 花括号里写 `if` / `for` 语句；`style="color:red"` 字符串；忘记 unitless 属性。
- `return` 后换行不加括号 → ASI 返回 undefined。
- 组件内嵌套定义组件、在渲染期改外部数组 / 对象。
- 循环里用 `<>` 而不是 `<Fragment key>`。
- 把 dev 下 console 打两次当 bug（StrictMode）。
#### 七、生产环境注意
- 演示简化：内联 `style` 对象与硬编码色值、文件内常量数据、无 `<StrictMode>` 包裹说明；真实项目样式走 CSS Modules / Tailwind / CSS-in-JS，根组件包 StrictMode。
- 一文件一组件 default export + 类型导出；不要在组件体内创建组件或 hooks 工厂（`static-components` 规则会报错）。
- 多条件 className 用 clsx / classnames；`style` 只放依赖 JS 变量的动态值。
- 富文本必须经服务端或客户端消毒后才进 `dangerouslySetInnerHTML`（主责 35）。
- ESLint 使用 eslint-plugin-react-hooks 7.1.1 `recommended`（含 `purity` / `globals` / `immutability` / `static-components`）；TS 用 `React.JSX` 而非全局 `JSX`。
#### 八、旧写法对照【旧写法】
- classic runtime：JSX 编译为 `React.createElement`，文件顶部必须 `import React from 'react'`；React 17（2020）起 automatic runtime，plugin-react 可用 `jsxRuntime: 'classic'` 回退；React 19 起必须使用新 transform。
- class 组件 `render()` / `this.props` / 字符串 ref：存量常见；React 19.0 移除 string refs、`ReactDOM.render`、`findDOMNode`，改用 `createRoot` 与函数组件。
- 全局 `JSX` 命名空间：@types/react 19 起只有 `React.JSX`。
#### 九、新动向【尝鲜】
- React Compiler 1.0【较新】：自动记忆化依赖组件纯性，本项目不启用；原理与规则主责 17。
- React 19.3【尝鲜】：`<Fragment ref>` 得到 `FragmentInstance`；Trusted Types 对象可直接透传给 `dangerouslySetInnerHTML`；StrictMode 在 hydration 时双调 Effects（19.3.0 于 2026-09-09 发布，19.2.8 不含）。
#### 十、动手练习
- 练习 1：把 VIP 徽章改成组件 `VipBadge`，先故意写成 `vipBadge` 观察警告，再在 `Example` 内部定义它并加一个计数 state，观察每次父组件渲染时 state 丢失。可断言结论：渲染 `<vipBadge />` 时 React 输出「is using incorrect casing」类警告且 DOM 里出现未知元素 `vipbadge`；组件内嵌定义的子组件在父组件重新渲染后 state 归零。
- 练习 2：给 `avatarStyle` 加 `lineHeight: 1.5` 与 `width: 48`，断言渲染出的 `style` 属性为 `line-height: 1.5; width: 48px`（unitless 不补 px）。可断言结论：`element.style.width === '48px'` 且 `element.style.lineHeight === '1.5'`。
#### 参考
- https://react.dev/learn/your-first-component（19.3 站点，2026-09-17）
- https://react.dev/learn/writing-markup-with-jsx（2026-09-17）
- https://react.dev/learn/javascript-in-jsx-with-curly-braces（2026-09-17）
- https://react.dev/learn/keeping-components-pure（2026-09-17）
- https://react.dev/learn/render-and-commit（2026-09-17）
- https://react.dev/reference/react/StrictMode（2026-09-17）
- https://react.dev/reference/react/Fragment（2026-09-17）
- https://react.dev/reference/react-dom/components/common#style；#dangerously-setting-the-inner-html（2026-09-17）
- https://react.dev/blog/2024/04/25/react-19-upgrade-guide；https://react.dev/blog/2026/09/09/react-19-3（2026-09-17）
- https://vuejs.org/guide/scaling-up/sfc.html；/guide/essentials/template-syntax.html；/guide/essentials/class-and-style.html；/guide/extras/render-function.html；/api/built-in-directives.html#v-html（Vue 3.5.42，2026-09-17）

### 02. Props

#### 一、30 秒面试速答
- props 是组件函数唯一的参数对象，用解构 + JS 参数默认值读取；默认值只对缺失 / `undefined` 生效。
- props 是每次渲染的只读快照：不要改它，要变化让父组件传新值；子组件靠 `onX` 回调上浮。
- 开发构建下 React 会冻结 props 对象，赋值直接抛错；生产不冻结但改了也不会重渲染。
- 没有自动透传：想支持原生属性就 `ComponentPropsWithoutRef<'button'>` + `{...rest}` 展开，`className` / `style` 手动合并。
- React 19 起 `ref` 是普通 prop，`forwardRef` 不再必需；函数组件的 `defaultProps` / `propTypes` 已移除 / 不校验，改用 TS。
#### 二、核心概念（React）
- 单参数对象 + 解构；默认值语义（缺失 / `undefined` 才用默认，`null` / `0` 原样传入）。
- 只读快照："every render receives a new version of props"；props 像参数，state 是记忆（指向 03）；dev 下 `Object.freeze` 的事实与生产差异。
- 单向数据流与回调上浮（指向 08）；不要镜像进 state，刻意忽略更新时命名 `initialX`（指向 09）。
- TS 声明：interface、可选、字符串联合、`CSSProperties`、`ReactNode` vs `ReactElement`（指向 28）。
- 继承原生属性：`ComponentProps<'button'>`（含 ref）vs `ComponentPropsWithoutRef`；rest 展开位置决定外部能否覆盖默认值；`className` 合并。
- `ref` 作为 prop（19.0 起）、ref 回调清理函数：本题一句，详见 12 / 28。
- `key` 不是 prop，组件收不到（指向 06）；JSX 无值属性即 `true`；`{...props}` 展开要克制、多用 `children`（指向 13）。
#### 三、Vue 对照
- `defineProps<Props>()` 编译器宏 vs 函数参数；3.5 响应式 props 解构 `const { discount = 0 } = defineProps<Props>()` 为主线，编译器自动加 `props.` 前缀；解构 prop 传 composable / watch 要包 getter `() => discount`。
- `withDefaults` 只在 3.4 及以下需要【旧写法】；对象 / 数组默认值在 withDefaults 里要用工厂函数，解构写法不用。
- 单向绑定与开发期警告（`shallowReadonly`）vs React dev 冻结；两边都不允许改。
- fallthrough attrs 自动落单根元素、class / style 自动合并、`v-on` 双触发；`inheritAttrs: false` + `useAttrs()` 才等于 React 的 rest；`useAttrs()` 非响应式；多根组件不自动透传并警告。
- Boolean 转型：Vue 声明为 Boolean 的 prop 无值即 `true`；React 只有 JSX 语法层的无值 = `true`，无类型转换。
- 运行时校验：Vue `defineProps({ type, required, validator })` 开发期警告；React 交给 TS，`propTypes` 19 起不校验。
- camelCase 声明 / kebab-case 模板自动转换；JSX 无转换。
- 泛型组件 `generic="T"` vs React 泛型组件（主责 28）。
#### 四、关键区别
- 默认值机制：React 是 JS 语法（任何版本）；Vue 3.5+ 用解构、3.4- 用 `withDefaults` 宏。
- 改 props 的后果：Vue 3.x 开发期控制台警告；React 19.2 开发构建抛 TypeError、生产静默无效——两边生产都不保护。
- 透传：Vue 默认自动（单根组件）；React 所有转发显式（任何版本）。
- ref：React 19 起 ref 是 prop、18 及以前要 `forwardRef`；Vue 模板 ref 指向实例且 `<script setup>` 默认封闭需 `defineExpose`（主责 12）。
- 一文件多组件：React 任意；Vue SFC 一文件一组件（内联 `h()` 组件是例外）。
#### 五、常见追问与回答要点
- 「传 `null` 会用默认值吗？」不会，只有 `undefined` 触发；`0` / `''` 同样原样传入。
- 「`ComponentProps` 与 `ComponentPropsWithoutRef` 差在哪？」前者含 `ref`，后者去掉；19 里 ref 是 prop，包装组件直接解构 `{ ref, ...rest }`。
- 「rest 展开为什么放最后？」放后面 = 外部可覆盖默认值；放前面 = 锁死。
- 「外部传 `className` 把内部样式盖没了怎么办？」单独解构后合并（clsx / cn）。
- 「组件库要兼容 React 18 怎么写 ref？」仍用 `forwardRef`；纯 19 项目直接 `{ ref }`。
- 「为什么 React 19 删函数组件 `defaultProps`？」有 JS 参数默认值可替代且更易静态分析；类组件仍保留。
- 「props 复制进 state 什么时候可以？」只想取初始值、刻意忽略后续更新时，并以 `initialX` 命名。
#### 六、易错点
- 在子组件里改 props 或改解构出的局部变量（父组件不知情，UI 与数据源脱节）。
- `useState(props.x)` 镜像 props 后父组件更新无效。
- 把 `className` 留在 rest 里展开导致覆盖；rest 放在具名属性之前锁死默认值。
- 忘记给 `<button>` 默认 `type="button"`，进表单后误提交。
- 对象 / 函数型默认值每次渲染新引用击穿 `memo`（17）。
- Vue 3.5 解构后直接把 `discount` 传给 `watch` / composable 失去响应性，要包 getter。
#### 七、生产环境注意
- 演示简化：只合并了 `className`；真实组件库还要合并 `style`、用 `Omit<…, 'x'>` 解决同名冲突、给 `type` 明确默认值。
- 组件库同时支持 React 18 时保留 `forwardRef`；纯 19 项目直接 `{ ref }`；类型层不用 `MutableRefObject`。
- 需要稳定引用的默认值提到模块级常量；列表项组件配合 `memo` 时检查 props 引用。
- 运行时校验放在数据边界（API 响应、表单）用 zod 之类；组件 props 只靠 TS，不为新代码引入 `propTypes`。
- Vue 侧主线代码改为 3.5 响应式 props 解构，`withDefaults` 移到旧写法段。
#### 八、旧写法对照【旧写法】
- `Comp.defaultProps = {}`：函数组件 React 19.0 移除，改参数默认值；类组件 `ComponentClass` 仍有 `defaultProps`。
- `Comp.propTypes = {}`：19.0 起不再校验，类型标 `@deprecated`；改用 TypeScript。
- `forwardRef((props, ref) => …)`：18 及以前必需；19 语义弃用（"no longer necessary"），@types 19.2.18 未标 deprecated，未来版本移除。
- 类组件 `this.props`、字符串 ref、`element.ref`：19.0 移除 string refs、弃用 `element.ref`（改 `element.props.ref`）。
- Vue `withDefaults(defineProps<Props>(), {...})`：3.4 及以下的默认值写法；3.5 起用解构默认值。
#### 九、新动向【尝鲜】
- @types/react 19 类型变化【较新】：`ReactElement` props 默认 `unknown`、`useRef` 必传初始值、全局 `JSX` → `React.JSX`（主责 28）。
- React 19.3【尝鲜】：`<Fragment ref>`、`<Context>` 可在 Server Components 渲染，本题不依赖。
- Vue 3.6 RC【尝鲜】：Vapor Mode 不改变 props 声明方式。
#### 十、动手练习
- 练习 1：给 `UiButton` 加 `size?: 'sm' | 'md'` 并透传 `style`，外部同时传 `className="btn-ghost"` 与 `style={{ marginLeft: 8 }}`。可断言结论：渲染出的 button 同时含 `btn-primary` 与 `btn-ghost`，且 `style.marginLeft === '8px'`；把 `{...rest}` 移到 `type="button"` 之前后，外部 `type="submit"` 不再生效（`button.type === 'button'`）。
- 练习 2：给 `OrderCard` 传 `discount={null as any}` 与不传两种情况。可断言结论：不传时 `payable === amount`；传 `null` 时默认值不生效、`amount * (1 - null)` 结果为 `amount`（`null` 被当 0），TS 报错说明类型层已拦截。
#### 参考
- https://react.dev/learn/passing-props-to-a-component（19.3 站点，2026-09-17）
- https://react.dev/learn/choosing-the-state-structure#dont-mirror-props-in-state（2026-09-17）
- https://react.dev/learn/typescript（2026-09-17）
- https://react.dev/reference/react/forwardRef；https://react.dev/blog/2024/12/05/react-19；https://react.dev/blog/2024/04/25/react-19-upgrade-guide（2026-09-17）
- node_modules/@types/react/index.d.ts:1452, 1530, 293-302, 1060-1075, 1152（@types/react 19.2.18）
- https://vuejs.org/guide/components/props.html；https://vuejs.org/api/sfc-script-setup.html；https://vuejs.org/guide/components/attrs.html（Vue 3.5.42，2026-09-17）

### 03. State 与 useState

#### 一、30 秒面试速答
- 普通局部变量不跨渲染、改了也不触发渲染；`useState` 给两样东西：跨渲染保留的 state 变量 + 触发重渲染的 setter【主流】。
- setter 不改本次渲染的变量，只「排队下一次渲染」；React 用 `Object.is` 比新旧值，相同就跳过【主流】。
- 对象 / 数组 state 必须整体替换（展开、map、filter），原地改引用不变 React 察觉不到【主流】。
- 新值依赖旧值、同一事件多次更新、异步回调里更新 → 用函数式更新 `setX(prev => …)`【主流】。
- 昂贵初始值用惰性初始化 `useState(() => init())`；多个互相牵制的 state 收敛到 `useReducer`【主流】。
#### 二、核心概念（React）
- 为什么不能用局部变量：「Local variables don't persist between renders」「Changes to local variables won't trigger renders」；每个组件实例的 state 相互隔离。
- 签名 `useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]`（index.d.ts:1689）；TS 从初始值推断，联合 / 可空显式写泛型。
- 快照：本次渲染的 state 是常量，set 后立刻读仍是旧值（区块一保留）；机制归 23，批处理与更新队列归 24。
- 函数式更新：更新函数接收「队列里前一个更新的结果」，按序执行；判定规则三条（依赖旧值 / 同事件多次 / 异步回调）。
- 惰性初始化：传函数本身而不是调用结果，「React saves the initial state once and ignores it on the next renders」；初始化函数必须纯（StrictMode 双调）。
- 状态结构：合并总一起变的、避免矛盾 / 冗余 / 重复 / 深嵌套；不镜像 props（除非命名为 `initialX` / `defaultX`）；多 boolean → `status` 字面量联合。
- 收敛到 `useReducer`：多个 state 互相牵制、更新逻辑分散、想让「发生了什么」与「怎么变」分离（区块二保留，判别联合与 never 穷尽指向 29）；跨组件共享 → 25 / 15 / 16。
- 排错：渲染期无条件 setState → 「Too many re-renders」；想把函数存进 state 要 `useState(() => fn)` / `setFn(() => fn)`。
#### 三、Vue 对照
- `const [x, setX] = useState(v)` ↔ `const x = ref(v)`，改 `x.value = …`；Vue 不需要 setter，因为响应式系统在写入时通知依赖。
- 原理对照要写准：`reactive` 用 Proxy、`ref` 用 getter/setter（3.5 现行写法）；依赖追踪精确到「组件的 render effect」，不是属性级 DOM 更新。
- 对象 state 整体替换 ↔ `reactive` 可原地改，但不能整体替换、不能解构（Limitations of reactive()）；坑互为镜像，详见 21。
- 「set 后读旧值」 ↔ Vue 改完立刻读到新值，只是 DOM 更新缓冲到 nextTick（24）。
- 不镜像 props：两边规则一致，Vue 文档「prop 作初始值就定义本地 ref，要变换就用 computed」。
- 惰性初始化无对应物：`<script setup>` 只执行一次，`ref(init())` 天然只算一次。
- `useReducer` 无对应物：Vue 直接改 `reactive`，逻辑复杂时抽 composable（14）或 Pinia action（16）；Pinia action 可 mutate、可异步，与 reducer 不是一回事。
#### 四、关键区别
- React 19.2 函数组件：更新 = 换引用 + 显式 setter，整个组件函数重跑；Vue 3.5：更新 = 原地改，响应式系统按组件触发 render effect（setup 不重跑）。
- 「快照」只存在于 React 函数组件；class 组件的 `this.state` 不是快照（八）；Vue 没有快照，因此没有函数式更新的对应物。
- `Object.is` 跳过更新两边一致：React setter 比新旧值；Vue `ref` setter 也用值比较，赋同值不触发。
- 粒度差异的前提：不启用 React Compiler 时，父组件重渲染默认带动整棵子树（17 讲 memo）；Vue 只重跑读了该状态的组件。
#### 五、常见追问与回答要点
- 「setState 同步还是异步」：调用是同步的，但只对下一次渲染生效；React 18+ 自动批处理同一事件 / 异步回调里的多次更新（24）。
- 「怎么拿到更新后的值」：下一次渲染直接用；派生值渲染时算（09）；需要在回调里读最新值用函数式更新或 ref（26）。
- 「useState 和 useReducer 怎么选」：单个独立值用 useState；多字段互相牵制、同一规则被多个事件重复实现 → reducer；跨组件 → 提升 / Context / store。
- 「Hooks 为什么不能进 if」：React 按调用顺序匹配 state，顺序变了就对错位（14 主责，lint `rules-of-hooks` 已开）。
- 「同一个组件渲染两次 state 会串吗」：不会，每个实例独立。
#### 六、易错点
- `items[0].quantity++` 后 `setItems(items)`：同引用，`Object.is` 为 true，不渲染。
- `setCount(count + 1)` 连写两次只加 1；`setCount(c => c + 1)` 才加 2（区块一）。
- `useState(expensive())` 每次渲染都算；`onClick={handleClick()}` 渲染期调用 → 无限循环。
- 把 props 复制进 state 后 props 变了 UI 不变。
- 措辞：删掉「（没有一一对应关系）」模板句；「统一解法都是函数式更新」改为「依赖旧值算新值时用函数式更新，要读最新值做别的事用 ref（26）」。
#### 七、生产环境注意
- 演示简化：购物车与数量编辑器都是纯本地 state；真实项目购物车属服务端 / 全局状态（16、30），URL 可表达的筛选放路由 query（18）。
- 演示简化：`quantityReducer` 未 export；生产里 reducer 独立文件 + 单测（34）。
- 惰性初始化读 localStorage 要 try/catch；SSR 场景初始化函数不能碰 `window`（33）。
- 对象 / 数组 state 把类型写全（`useState<Order[]>([])`），联合状态用字面量联合；表单多字段优先 useReducer 或 Actions（31）。
- lint：本项目 eslint.config.js 只开了 `rules-of-hooks` / `exhaustive-deps`；生产建议启用 `recommended` 预设（含 `set-state-in-render` / `immutability`，7.1.1 默认 error）。
#### 八、旧写法对照【旧写法】
- class 组件 `this.setState({ a })` 是浅合并（官方逐字「it will be shallowly merged into this.state」）；Hooks setter 是整体替换，`setUser({ name })` 会丢掉其它字段；16.8（2019-02）起函数组件 + Hooks 为主线，官方「we don't recommend using them in new code」。
- class 的 `this.state` 是可变实例字段，事件处理器读到最新值而非快照；但 `setState` 后立刻读同样是旧值（官方 Pitfall）。
- React 17 及以前只在 React 事件处理器内批处理，setTimeout / Promise 里每次 set 各渲染一次；18 起自动批处理（24）。
#### 九、新动向【尝鲜】
- React Compiler 1.0【较新】依赖「state 不可变、渲染纯」两条前提自动记忆化；本项目不启用，原理归 17。
- eslint-plugin-react-hooks 7.x【较新】`recommended` 已含编译器规则（`set-state-in-render`、`immutability`、`purity`）。
- Vue 3.6 rc【尝鲜】Vapor Mode 才是真正的细粒度更新；3.5 仍是组件级 render effect。
#### 十、动手练习
- 练习 1：把区块二的 `isEditing + error` 改成 `status: 'idle' | 'editing' | 'invalid'`，删掉不可能同时出现的组合。可断言结论：`status` 为 `'invalid'` 时 `error` 非空，且 `isEditing` 字段不再存在。
- 练习 2：给 `SnapshotCounter` 加一个 `useState(() => readFromStorage())` 的惰性初始值并打印调用次数。可断言结论：初始化函数只在首次渲染调用（StrictMode 下开发期 2 次，生产 1 次），后续点击不再调用。
#### 参考
- https://react.dev/learn/state-a-components-memory（React 19.3 站点，2026-09-17）
- https://react.dev/reference/react/useState（2026-09-17）
- https://react.dev/learn/choosing-the-state-structure；https://react.dev/learn/reacting-to-input-with-state（2026-09-17）
- https://react.dev/learn/extracting-state-logic-into-a-reducer（2026-09-17）
- https://react.dev/reference/react/Component#setstate（2026-09-17，旧写法）
- https://react.dev/reference/eslint-plugin-react-hooks（7.1.1，2026-09-17）
- https://vuejs.org/guide/essentials/reactivity-fundamentals.html；https://vuejs.org/guide/extras/reactivity-in-depth.html（Vue 3.5，2026-09-17）
- https://vuejs.org/guide/components/props.html#one-way-data-flow（2026-09-17）

### 04. 事件处理

#### 一、30 秒面试速答
- 事件是 camelCase 属性，传函数不调用：`onClick={handleClick}`；传参写 `onClick={() => f(id)}`，`onClick={f(id)}` 在渲染期就执行。
- 事件对象是 React 合成事件：跨浏览器包装、接口同原生；真实监听器从 React 17 起挂在 root 容器（之前是 document），`e.nativeEvent` 可拿原生。
- 所有事件都冒泡（`onScroll` 除外）；`stopPropagation()` 停冒泡、`preventDefault()` 停默认行为、`onXxxCapture` 走捕获阶段——三件事互不相干。
- React 没有 `.stop` / `.prevent` / `.self` 等修饰符，全部在处理函数里用 JS 写。
- 事件处理器是放副作用的地方，不必纯；它闭包读到的是本次渲染的 state 快照。
#### 二、核心概念（React）
- 绑定与传参：函数引用 vs 调用；内联箭头；要事件对象写 `(e) => f(id, e)`；命名约定 `handleX` / `onX`。
- 合成事件：`target` / `currentTarget` / `nativeEvent` / `bubbles` / `isTrusted`；委托在 root 容器（17 起）；`currentTarget` 与 `nativeEvent.currentTarget` 可能不同。
- 传播三阶段：Capture 向下 → 目标 → 冒泡向上；`onClickCapture`；`onScroll` 不冒泡；onLoad / onAbort 在 React 冒泡；onFocus / onBlur 底层 focusin / focusout。
- `stopPropagation` vs `preventDefault`：两件事；表单 `onSubmit` + `preventDefault()`（主线 07 / 31）。
- 处理器是副作用的最佳位置；读到的是本次渲染快照（指向 23 / 26）。
- 回调 prop 代替传播：子组件 `stopPropagation()` 后显式调用 `onX` prop，链路可读（指向 08）。
- `onChange` 每次击键触发、像原生 input（主责 07）。
- TS：`MouseEvent<HTMLButtonElement>` 从 react 导入会遮蔽全局类型；`ChangeEvent` / `FormEvent` / `KeyboardEvent`；未列出的用 `SyntheticEvent`；`MouseEventHandler<T>`（主责 28）。
#### 三、Vue 对照
- `@click="handler"`（方法处理器）vs `@click="f(id)"`（内联处理器）：Vue 编译器按表达式形态区分并包成函数；React 内联只能是函数表达式。
- 处理器参数：Vue 是原生 `event` / `$event`；React 是合成事件。
- 修饰符 → JS：`.stop` → `stopPropagation()`；`.prevent` → `preventDefault()`；`.self` → `e.target === e.currentTarget`；`.capture` → `onClickCapture`；`.once` → 自行去重或 ref + `{ once: true }`；`.passive` → React 的 onWheel / onTouch* 默认被动。
- 按键 / 系统 / 鼠标修饰符 `.enter` / `.ctrl` / `.exact` / `.left` → `e.key` / `e.ctrlKey` / `e.button` 手写判断。
- 组件事件：Vue `emit('x')` "component emitted events do not bubble"，未声明的 `@click` 作为 fallthrough 落到根元素；React 回调 prop 不冒泡、不自动透传（指向 02 / 08）。
- `v-on` 直接绑在元素上，无委托层，`event.currentTarget` 即元素；React 委托在 root。
- `v-model` 默认监听 `input`，`.lazy` 改为 `change`；React `onChange` = 原生 input（主责 07）。
#### 四、关键区别
- 「模板编译 vs JSX 表达式」决定了 `f(id)` 写法一边对一边错（任何 React 版本）。
- 委托位置：React 17+ root 容器、16 及以前 document；Vue 3 无委托。混用原生 `addEventListener` 时顺序与 `stopPropagation` 行为受此影响。
- 修饰符：Vue 3.5 声明式；React 全靠 JS，任何版本无内置修饰符。
- 事件池：React 16 及以前需 `e.persist()`，17 起移除，可在异步回调里随时读 `e`。
- 被动监听：React 的 onWheel / onTouchStart / onTouchMove 是 passive，处理器里 `preventDefault` 无效（③ 级依据，见 pending）；Vue 用 `.passive` 显式声明。
#### 五、常见追问与回答要点
- 「内联箭头每次渲染都是新函数有问题吗？」通常没有；只有子组件 `memo` 或作 Effect 依赖时才 `useCallback`（17）。
- 「怎么只在点击目标本身时触发？」`if (e.target !== e.currentTarget) return`。
- 「捕获与冒泡处理器谁先执行？」所有 `onXxxCapture` 自上而下，再目标元素的 `onXxx`，再自下而上冒泡。
- 「处理器里读到的 state 是最新的吗？」是本次渲染的快照；延迟回调里可能过期（26）。
- 「怎么阻止 onWheel 的默认滚动？」React 的 onWheel 是被动的，需 ref + `addEventListener('wheel', fn, { passive: false })`（12）。
- 「渲染期调用 setState 会怎样？」触发重复渲染直至 React 抛 "Too many re-renders" 错误（待验证文案）。
#### 六、易错点
- `onClick={f(id)}` 立即执行、列表一渲染就被删光。
- `onclick` 小写、`onClick="fn()"` 字符串写法。
- `preventDefault()` 后以为也停了冒泡；`stopPropagation()` 后以为链接不跳转。
- 把 `<div onClick>` 当按钮：键盘不可达、无语义。
- 在 onWheel / onTouchMove 里 `preventDefault` 无效。
- 用 `document.addEventListener` 拦截 React 事件却发现顺序不对（委托在 root）。
#### 七、生产环境注意
- 演示简化：可点击卡片用 `<div onClick>`、用 `<a href>` 当按钮；真实项目用 `<button>`，非按钮元素补 `role` / `tabIndex` / `onKeyDown`（主责 35）。
- 表单一律 `onSubmit` + `preventDefault()` 或 19 的 `<form action>`（主责 31），不要只绑按钮 `onClick`，否则回车提交与可访问性丢失。
- 需要 `preventDefault` 的滚轮 / 触摸事件用 ref + `addEventListener(..., { passive: false })`。
- 处理器传参 `() => f(id)` 是主流；只在 memo / 依赖场景 `useCallback`。
- 演示里的 `console.log` / 计数副作用标「演示简化」，真实为 setState、请求、导航。
#### 八、旧写法对照【旧写法】
- `e.persist()` / `isPersistent()`：React 16 及以前事件池要求异步读事件前调用；17 起事件池移除，`persist` 变空操作（"Not used with React DOM"）。
- 类组件 `this.handleClick = this.handleClick.bind(this)` 或箭头类字段：存量代码常见；函数组件无 this 问题。
- React 16 及以前事件委托在 `document`：与原生 `document.addEventListener` 混用时顺序不同；17 起改为 root 容器。
- `onScroll` 在 16 及以前会冒泡；17 起不冒泡。
#### 九、新动向【尝鲜】
- React 19.3：`onFullscreenChange` / `onFullscreenError`、submit 事件带 `submitter`、resize 事件批处理、Server Action 后 `onReset`（19.3.0 于 2026-09-09 发布，19.2.8 不含）。
- React Compiler【较新】：自动记忆内联处理器，减少手写 `useCallback` 的必要（主责 17）。
#### 十、动手练习
- 练习 1：给卡片加 `onClickCapture`，在三个层级（卡片 capture、按钮、卡片 bubble）各记录一次日志。可断言结论：点击「切换状态」按钮时顺序为 `card-capture → button`，卡片的冒泡处理器不执行（因 `stopPropagation`）；点击「删除」时顺序为 `card-capture → button → card-bubble`，卡片计数 +1。
- 练习 2：用 ref 给卡片 `addEventListener('click', …)` 一个原生监听器，并在按钮里 `e.stopPropagation()`。可断言结论：原生监听器仍会触发（合成事件的 stopPropagation 只阻止 React 树内传播，原生事件已到达元素）；改用 `e.nativeEvent.stopImmediatePropagation()` 后行为变化需运行验证。
#### 参考
- https://react.dev/learn/responding-to-events（19.3 站点，2026-09-17）
- https://react.dev/reference/react-dom/components/common#react-event-object（2026-09-17）
- https://react.dev/reference/react-dom/components/input（2026-09-17）
- https://react.dev/learn/typescript；node_modules/@types/react/index.d.ts:2054, 2091, 2104, 2130, 2155, 2250（@types/react 19.2.18）
- node_modules/react-dom/cjs/react-dom-client.development.js:19209, 28057, 5328（react-dom 19.2.8）
- ③ https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html（事件委托、事件池、passive；2026-09-17）
- https://react.dev/blog/2026/09/09/react-19-3（2026-09-17）
- https://vuejs.org/guide/essentials/event-handling.html；https://vuejs.org/guide/components/events.html；https://vuejs.org/api/built-in-directives.html#v-on（Vue 3.5.42，2026-09-17）

### 05. 条件渲染

#### 一、30 秒面试速答
- JSX 没有 `v-if`，分支就是 JavaScript：`if` 提前 return、三元、`&&`、把 JSX 存进变量、查表对象。
- `&&` 左边是 `0` 会把 `0` 渲染出来（`false` / `null` / `undefined` / `true` 才是「洞」）；修法 `count > 0 &&`。
- `return null` 渲染空；想保留 DOM 与 state 就用 CSS 隐藏或 19.2 的 `<Activity mode="hidden">`。
- state 跟着「树中位置」走：同位置同类型组件切换时 state 保留，换类型才销毁，要强制重置加 `key`。
- 多个互斥布尔容易矛盾，用一个 `status` 联合驱动分支。
#### 二、核心概念（React）
- 五种写法：`if` + return（含 `return null`）、三元、`&&`、变量赋值（最灵活）、查表对象；分支多时抽子组件 / switch。
- 元素只是描述不是实例，if/else 与三元完全等价。
- `&&` 的求值：返回左操作数本身；ReactNode 含 number 所以 `0` / `NaN` 会渲染，含 boolean / null / undefined 所以是「洞」；TS 拦不住，靠 `> 0` / `!!` / lint。
- 位置规则：同位置同类型复用实例保留 state；换类型销毁；`key` 强制重置（主责 06）。
- 隐藏 vs 卸载：`display: none` / `hidden` 属性保留 DOM 与 state；`return null` 卸载全部；要保留可提升 state。
- 状态建模：单一 `status: 'idle' | 'loading' | 'success' | 'error'` 代替多个布尔（落点 11 / 29）。
- Hooks 规则：提前 return 之前不能条件调用 Hook（指向 14）。
#### 三、Vue 对照
- `v-if` / `v-else-if` / `v-else` 必须紧邻；`<template v-if>` 包多元素；React 用 JS 表达式与 Fragment。
- `v-show` 只切 display、不支持 `<template>` 与 `v-else`；React 无指令，用 style / className / `hidden` / `<Activity>`【较新】。
- `v-if` 惰性、切换成本高；`v-show` 初始成本高、适合频繁切换——React 的取舍同理（卸载 vs 隐藏）。
- `v-if="count"` 按 truthy 判断无 0 陷阱；插值里 `count && '…'` 仍会渲染 0。
- `v-if` 切换总是销毁重建，保留用 `v-show` / `<KeepAlive>`；React 同位置同类型默认复用。
- `:key` 强制替换元素 / 组件（触发生命周期与 transition）与 React `key` 重置同机制（主责 06）。
- `v-if` 与 `v-for` 同元素时 v-if 优先且拿不到循环变量，官方不推荐同用；React 先 filter 再 map（指向 06）。
#### 四、关键区别
- 分支表达：Vue 3.5 模板指令；React 任何版本都是 JS 控制流。
- 0 陷阱：React 把表达式的值当子节点渲染（任何版本）；Vue 指令按 truthy 判断。
- 卸载语义：Vue `v-if` 总是销毁；React 复用是「位置」规则的结果，只有换类型 / 切 null / 换 key 才销毁。
- 隐藏保留状态：Vue 内置 `v-show` / `<KeepAlive>`；React 19.2 前只有 CSS，19.2 起 `<Activity>`【较新】。
- 一文件多组件：React 分支子组件可与父同文件；Vue 三分支就地写在模板。
#### 五、常见追问与回答要点
- 「`''` 和 `NaN` 呢？」`''` 渲染空文本、`NaN` 渲染 "NaN"；都不是「洞」。
- 「TS 能拦住 `0 &&` 吗？」不能，`number` 在 ReactNode 联合里；用 `> 0` 或 lint 规则。
- 「三元两分支同组件切换会重置 state 吗？」不会，同位置同类型复用；要重置加 `key` 或改变位置。
- 「`return null` 和 `display: none` 差在哪？」前者卸载 DOM 与 state、跑 Effect cleanup；后者都保留。
- 「`<Activity mode="hidden">` 与 CSS 隐藏的区别？」Activity 保留 state 但卸载 Effect、降低优先级预渲染（主责 32）。
- 「多状态怎么建模？」判别联合 `status`，避免 `isLoading && isError` 同时为真。
#### 六、易错点
- `items.length && <List/>` 渲染出 `0`。
- 三层以上嵌套三元不可读。
- 同类型组件在同位置切换实体（用户 A → B）忘加 `key`，旧输入串到新实体。
- 在 switch / 早返回之后调用 Hook 违反 Hooks 规则。
- 把 `display: none` 当作「卸载」，Effect 与定时器仍在跑。
- `v-if` + `v-for` 同元素。
#### 七、生产环境注意
- 演示简化：`style={{ display }}` 内联隐藏；真实项目用 className / `hidden` 属性或 `<Activity>`【较新】，并标明 Effect 仍在运行。
- 请求 / 提交状态用判别联合驱动分支，区分「空列表」与「未加载」；`items.length && …` 一律改 `> 0`。
- 需要保留表单、滚动位置的 Tab 用隐藏而非卸载，否则切回来丢失输入。
- 权限隐藏按钮只是体验，鉴权必须由后端完成（主责 35 / 18）。
- 三层以上嵌套三元拆子组件或提前 return；早返回前不能有条件 Hook。
#### 八、旧写法对照【旧写法】
- 类组件 `render()` 里 if/else、`renderHeader()` 辅助方法拆分支：存量代码常见；函数组件改为子组件或提前 return（与 React 版本无关，属于类组件时代模式）。
- 用 `style={{ display }}` 或第三方「v-show 组件」模拟隐藏：19.2 前唯一手段；19.2 起有 `<Activity>`。
#### 九、新动向【尝鲜】
- `<Activity mode="hidden" | "visible">`【较新】：19.2.0 起稳定导出（@types/react 19.2.18 `index.d.ts:1995-2015`），隐藏时保留 state、卸载 Effect（主责 32）。
- `<ViewTransition>`【尝鲜】：19.3.0（2026-09-09）稳定，可给条件切换加动画；19.2.8 不导出，主线不依赖。
#### 十、动手练习
- 练习 1：把 `StatusPanel` 改成三元两分支都渲染同一个带 `useState` 计数的 `<Note />`，切换状态后观察计数。可断言结论：切换 `status` 时计数不归零（同位置同类型复用）；给 `<Note key={status} />` 后计数归零。
- 练习 2：把 `{itemCount && …}` 分别用 `0`、`''`、`NaN`、`null` 作左值。可断言结论：DOM 文本分别为 `"0"`、`""`、`"NaN"`、`""`；只有 `itemCount > 0 &&` 在四种情况下都不输出文本。
#### 参考
- https://react.dev/learn/conditional-rendering（19.3 站点，2026-09-17）
- https://react.dev/learn/preserving-and-resetting-state（2026-09-17）
- https://react.dev/learn/choosing-the-state-structure（2026-09-17）
- https://react.dev/reference/react/Activity；https://react.dev/blog/2026/09/09/react-19-3（2026-09-17）
- node_modules/@types/react/index.d.ts:436-449, 1995-2015（@types/react 19.2.18）
- https://vuejs.org/guide/essentials/conditional.html；https://vuejs.org/api/built-in-directives.html#v-if；#v-show；https://vuejs.org/guide/essentials/list.html（Vue 3.5.42，2026-09-17）

### 06. 列表渲染与 key

#### 一、30 秒面试速答
- 列表就是 `array.map()` 返回 JSX 数组，key 写在 map 直接返回的元素上；多节点用 `<Fragment key>`。
- key 是节点的身份证：兄弟之间唯一、不能变化、不要在渲染期生成；相同 key 复用并更新，key 变了就销毁重建。
- index 作 key 在插入 / 删除 / 重排后会把 DOM 与 state 串到别的数据上；`Math.random()` 作 key 则每次全部重建。
- key 从后端 id 来；本地新建的数据在创建时用 `crypto.randomUUID()` 生成并存进数据。
- key 不只用于列表：给组件换 key 就是「换成另一个东西」，是重置内部 state 的官方解法，代替 Effect 里 setState。
#### 二、核心概念（React）
- `map` 与 `filter` 组合；块体箭头函数要显式 `return`；缺 key 的警告与默认按 index 匹配。
- key 规则：兄弟唯一（不同数组可重复）、稳定、不在渲染期生成；类型 `string | number | bigint`；组件收不到 key，需要 id 另传。
- 为什么要 key：身份而非位置；协调只在同一父级内按 key 匹配。
- index 作 key 的准确条件：纯展示、只在末尾增删、无内部 state；否则输入 / 焦点 / 动画 / state 错位。
- `<Fragment key={id}>` 包多节点；`<>` 不能带 key。
- key 强制重置：`<Editor key={selectedId}>`，一次渲染出正确结果；与 Effect 同步 state 的反模式对比（10）；代价是整棵子树卸载重建。
- 派生列表渲染期计算或 `useMemo`；`sort` / `reverse` 先拷贝（主责 21）；`useState` 初始值只在挂载时求值。
- 路由参数变化时同一路由组件实例复用，用 `key={id}` 或修正 Effect 依赖（主责 18）。
#### 三、Vue 对照
- `v-for="(item, index) in items" :key`：`of`、对象 `(value, key, index)`、范围 `n in 10`（从 1 开始）、解构、`<template v-for>`（key 放 template 上）。
- 不写 key：Vue in-place patch，React 按 index——两边默认都按位置复用，都会串位；"recommended to provide a key whenever possible"。
- key 类型：Vue `number | string | symbol`、必须原始值、重复 key 渲染报错；React `string | number | bigint`。
- 组件 `v-for` 需显式传 props，与 React `<Item key item />` 一致；两边作用域都隔离。
- 数组更新：Vue 侦测 `push` / `splice` / `sort` 等突变方法，也接受 `filter` 新数组；React 必须新引用（主责 21）。
- `:key` 强制替换（触发生命周期、transition）、`<router-view :key="$route.fullPath">`：与 React 同机制。
- `v-if` 与 `v-for` 同元素时 v-if 优先且拿不到循环变量，用 `computed` 过滤；React 先 filter 再 map。
- `v-memo`（3.2+）模板级记忆 vs React `memo` 子组件（主责 17）。
#### 四、关键区别
- 写法：React 任何版本用 JS 方法，无对象 / 范围语法糖；Vue 3.5 指令家族。
- 默认行为：两边不写 key 都按位置复用；差别只在警告（React 警告，Vue 不警告）。
- 更新方式：React 必须新数组；Vue 突变或替换皆可。
- key 类型边界：React 允许 `bigint`、Vue 允许 `symbol`；两边都不接受对象。
- 换 key 重置：机制、写法、心智模型一致，可平移；Vue 额外触发 transition。
#### 五、常见追问与回答要点
- 「向头部插入一项、index 作 key 会怎样？」所有行的 index 前移，旧 DOM / state 留在原位置，输入框内容错位。
- 「两个列表用同一批 id 会冲突吗？」不会，key 只在兄弟之间比较。
- 「组件里需要 id 怎么办？」另传一个 prop：`<Profile key={id} userId={id} />`。
- 「为什么创建时生成而不是渲染时？」渲染期生成 = 每次都不同 = 每次全部重建。
- 「换 key 和 Effect 里 setState 重置比好在哪？」一次渲染出结果、无闪烁、语义准确（换成另一个东西）。
- 「路由 `/orders/1 → /orders/2` 为什么 state 不重置？」同一路由组件实例被复用；外层 `key={id}` 或写对依赖（18）。
#### 六、易错点
- `key={index}` 后删除 / 排序 / 头部插入。
- `key={Math.random()}` 或 `key={Date.now()}`。
- key 写在内层元素而非 map 直接返回的元素。
- 用 `<>` 包多节点却要 key。
- 在 map 回调块体里忘写 `return`。
- 在渲染期 `arr.sort()` 原地突变 state。
- 拿高频变化的值当 key 把整棵子树反复重建。
#### 七、生产环境注意
- 演示简化：非受控备注 input 用来暴露错位（react:161-164 已说明）；真实项目备注受控并按 `order.id` 存放，但错误 key 仍会引发焦点、动画、内部 state 串位。
- key 用后端 id；本地临时项创建时 `crypto.randomUUID()`；跨来源合并加前缀 `server-${id}` / `local-${uuid}`。
- 过滤 / 排序在渲染期或 `useMemo`，不复制进 state；分页 / 搜索切换保持 key 稳定，避免整表重建。
- 千级以上列表用虚拟化（主责 17）；每项组件按需 `memo` 并保证 props 引用稳定。
- key 重置的代价：DOM、state、滚动、焦点全丢，Effect 重跑；只在「确实变成另一个东西」时用。
#### 八、旧写法对照【旧写法】
- `key={index}`：存量代码大量存在；仅当列表纯展示、只在末尾增删、项内无 state 时可用，官方没有「静态列表可用 index」的正面表述（按保守处理）。
- `React.Children.map` / `Children.toArray` 自动合成 key 的遍历写法："uncommon and can lead to fragile code"（主责 13）。
- 类组件时代同样的 key 规则；`this.props.children` 遍历模式。
#### 九、新动向【尝鲜】
- `useMemo` caveat【较新】：官方提到未来内置虚拟化时可能丢弃缓存（主责 17）。
- React Compiler【较新】：自动记忆列表项，但 key 规则不变。
- 19.3 `<Fragment ref>`【尝鲜】：可对 Fragment 列表项拿到 `FragmentInstance`（19.2.8 `FragmentProps` 无 ref）。
#### 十、动手练习
- 练习 1：在 index-key 模式下先在第 1、2 行输入「加急」「送礼」，再删除第 1 行。可断言结论：第一行 `<input>` 的 `value === '加急'` 但该行 `orderNo === 'SO-1002'`（错位）；切换为 `order.id` 作 key 后重复操作，第一行 `value === '送礼'`。
- 练习 2：给 `OrderNoteEditor` 加一个 `useEffect` 打印挂载 / 卸载。可断言结论：切换选中订单时，不带 key 的实例只触发 props 更新、不打印卸载；带 `key={selectedOrder.id}` 的实例先打印卸载再打印挂载，且 `draft` 变为新订单的初始值。
#### 参考
- https://react.dev/learn/rendering-lists（19.3 站点，2026-09-17）
- https://react.dev/learn/preserving-and-resetting-state（2026-09-17）
- https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes（2026-09-17）
- https://react.dev/reference/react/Fragment；https://react.dev/reference/react/Children；https://react.dev/reference/react/useMemo#caveats（2026-09-17）
- node_modules/@types/react/index.d.ts:236-239, 258-260, 735-737（@types/react 19.2.18）
- https://react.dev/blog/2026/09/09/react-19-3（2026-09-17）
- https://vuejs.org/guide/essentials/list.html；https://vuejs.org/api/built-in-special-attributes.html#key；https://vuejs.org/api/built-in-directives.html#v-memo（Vue 3.5.42，2026-09-17）

### 07. 表单与受控组件

#### 一、30 秒面试速答
- 受控：`value` / `checked` + `onChange`，state 是唯一真相源，每击键重渲染；非受控：`defaultValue` + 提交时 `new FormData(form)` 或 `ref.current.value` 读一次。
- 选法：需要即时校验 / 联动 / 格式化 / 按内容禁用按钮 → 受控；只在提交时读、接第三方 DOM、避免每击键重渲染 → 非受控。
- 三个坑：`value` 无 `onChange` 打不进字；初始值 `undefined` 触发受控 / 非受控切换警告；`defaultValue` 改了不生效要换 `key`。
- `useId` 为 label / aria 生成 SSR 稳定的 id，不能当列表 key，多 root 用 `identifierPrefix`。
- Vue `v-model` = `:value` + `@input` 语法糖，同样以 JS 状态为真相源；3.4 起组件侧用 `defineModel()`；React 19 另有 `<form action>` 走 Actions（→31）。
#### 二、核心概念（React）
- 受控定义与 `onChange` 语义：≈ 原生 `input` 事件、每击键、IME 合成期间也触发；`onChange` 里必须同步 setState【主流】
- 元素差异：checkbox / radio 用 `checked`；`<select value>` 且 `<option selected>` 不支持；`<textarea value>` 不接 children；`value` 恒为字符串，`type="number"` 自行 `Number()`【主流】
- 非受控：`defaultValue` / `defaultChecked`、`new FormData(e.currentTarget)`、`ref.current.value`、`FormData.get` 收窄（`string | File | null`）、`currentTarget` 派发后置 null【主流】
- 对象 state + `name` 分发 + 函数式更新；`key={record.id}` 重置整张表单，不要用 effect 同步 props → state【主流】
- `useId`：为什么不用计数器 / random（SSR hydration 一致）；`id + '-name'` 派生多个；禁作 key / `use()` cache key；`createRoot(…, { identifierPrefix })`；19.2 前缀 `_r_`【主流 / 较新】
- 受控 ↔ 非受控不可中途切换：初始值 `''` 不是 `undefined`【主流】
- 提交：受控 + `<form onSubmit>` + `preventDefault` + 手写 submitting（→19）【主流】
  - 并排：`<form action={fn}>` + `useActionState` / `useFormStatus`【主流】，19.0 起；本课只写一段「React 19 起可以这样写」并指向 31 —— 说明 `action` 在 Transition 中执行、成功后只 reset 非受控字段、受控字段需自清或 `requestFormReset`
#### 三、Vue 对照
- `v-model` 展开规则（text `value` / `input`、checkbox `checked` / `change`、select `value` / `change`）；忽略初始 `value` / `checked` / `selected` → 与 React 受控同为「JS 为真相源」
- 修饰符 `.lazy` / `.number` / `.trim` 与 React 手写等价物；`type="number"` 自动 `.number`
- IME：`v-model` 合成期间不更新；React `onChange` 会触发，需要时自己处理 `onCompositionStart / End`
- `defineModel()`（3.4+，【较新】）编译为 `modelValue` + `update:modelValue`；`defineModel('title')` ↔ `v-model:title`；修饰符走 `[model, modifiers]`；3.4 前 props + emits 手写【旧写法】
- 非受控无专门概念：静态 `value` 属性 ≈ `defaultValue`；`:value` 是持续绑定，绑定值变会冲掉输入
- `useId` 无对应物（模板期 id 由开发者提供，无 hydration 顺序问题）；SSR 手写前缀
- `@submit.prevent` ↔ `e.preventDefault()`
#### 四、关键区别
- React 每击键重跑组件函数（19.2，createRoot），Vue 只更新依赖节点 —— 「为性能改非受控」的动机 React 特有
- `defaultValue`（只在挂载写一次，dirty flag 后脱钩） vs Vue `:value`（持续绑定）：形似、语义相反
- React `value` 无 `onChange` → 只读 + 警告；Vue `:value` 无 `@input` → 绑定值变时冲掉输入
- 提交：两边同为「事件处理器 + 手写 submitting」逐行对应
  - 并排：React 19 `<form action>`【主流】（19.0 起）在 Transition 中执行并自动 reset 非受控字段，Vue 无对应物（→31）
- `useId` / SSR 一致性：React 需要（并发 + hydration），Vue 不需要
- 受控 ↔ 非受控不可中途切换（`undefined` 警告）；Vue `v-model` 无此约束
#### 五、常见追问与回答要点
- `value` 不配 `onChange` 会怎样？→ 打不进字 + 警告；只读显式写 `readOnly`
- 初始值 `undefined` 报什么？→ 「A component is changing an uncontrolled input to be controlled」；受控值恒为字符串
- `onChange` 和原生 `change` 一样吗？→ 不，≈ `input` 事件；IME 期间也触发
- `useId` 能当 key 吗？多 root 冲突？→ 不能；`createRoot(…, { identifierPrefix })`
- `type="number"` 的 `value` 是数字吗？→ 字符串；`"12."` 被浏览器规范为空串，要保留用 `type="text"` + `inputMode="decimal"`（19 题 :36-39 已讲）
- 切换编辑记录时残留旧值？→ `key={record.id}`，不要 effect 同步
- react-hook-form 为什么快？→ 默认非受控 + ref 注册，只在订阅的 formState 变化时重渲染（P-07-2）
#### 六、易错点
- 漏写 `name` → FormData 读不到；checkbox 未勾选 key 不存在、勾选无 value 为 `'on'`
- `e.currentTarget` 在 `await` / `setTimeout` 后为 null（源码 `event.currentTarget = null`）
- `<form>` 里的 `<button>` 默认 submit，要写 `type="button"`
- `defaultValue` 改了不生效（dirty flag）；改用 `key` 或受控
- `<option selected>` / `<textarea>` children 在 React 不支持
- `useId` 不要 `querySelector('#' + id)` 依赖格式（前缀随版本变）
- 清理「没有一一对应关系」模板残留与「根本不 setState」等绝对化措辞
#### 七、生产环境注意
- 演示简化：错误只显示文本，无 `htmlFor` / `aria-describedby` / `aria-invalid`、无焦点管理（→35）；生产用 `useId` 关联 label 与错误
- 演示简化：`FormData` 只收窄字符串；生产用 schema 校验（zod 等只作引用）并处理 `File`
- 大表单：拆子组件 / 非受控 / react-hook-form；编辑不同记录用 `key`
- 提交：手写 submitting + 禁用（→19）
  - 并排：`useActionState` + `useFormStatus`【主流】（19.0 起，→31），注意受控字段不自动 reset
- 数字字段在 `onChange` 里 `Number()`，空串单独建模
#### 八、旧写法对照【旧写法】
- 自定义输入组件透传 ref：18 需 `forwardRef`，19.0 起 `ref` 是普通 prop（→02 / 12）
- React 18 无 `<form action>` / `useActionState`，`onSubmit` + 手写 submitting 是唯一方案；19.0 起两条路并存，手写 submitting 在 19 仍是【主流】而非旧写法，本段只放 React 18 差异
- Vue 3.4 前：`defineProps(['modelValue'])` + `defineEmits(['update:modelValue'])` 手写；3.4 起 `defineModel()`
- `useFormState`（react-dom）→ `useActionState`（react）19.0 更名（→31）
#### 九、新动向【尝鲜】
- 19.3：`submit` 事件带 `submitter`；Server Action 自动 reset 后触发 `onReset`（19.2.8 未安装）
- Vue 3.6 rc：Vapor 模式下 `v-model` 用法不变（未稳定，只提一句）
#### 十、动手练习
- 练习 1：把受控表单改为「编辑已有联系人」，用 `key={id}` 切换记录。可断言结论：切换 id 后输入框显示新记录的值，且不需要 `useEffect`
- 练习 2：给姓名输入加 `useId` + `<label htmlFor>` + 错误 `aria-describedby`。可断言结论：`getByLabelText('姓名')` 能找到输入框；同一组件渲染两次得到不同 id
- 练习 3：把初始值改成 `undefined` 再输入。可断言结论：控制台出现「changing an uncontrolled input to be controlled」
#### 参考
- https://react.dev/reference/react-dom/components/input（站点 19.3，2026-09-17）
- https://react.dev/reference/react-dom/components/select；/textarea；/form（2026-09-17）
- https://react.dev/reference/react/useId；https://react.dev/blog/2025/10/01/react-19-2（2026-09-17）
- https://react.dev/learn/preserving-and-resetting-state；/learn/typescript#dom-events（2026-09-17）
- https://vuejs.org/guide/essentials/forms.html；/guide/components/v-model.html（Vue 3.5，2026-09-17）
- node_modules/@types/react/index.d.ts:1907；node_modules/typescript/lib/lib.dom.d.ts:12239, 39187；node_modules/react-dom/cjs/react-dom-client.development.js:19120

### 08. 父子组件通信

#### 一、30 秒面试速答
- React 没有事件系统：父组件把函数当 prop 传下去（`onDelete`），子组件调用它就是「子传父」；数据向下 props、事件向上回调，单向数据流。
- props 只读；子组件要改数据只能「上报意图」，由拥有 state 的父组件 setState。
- 命名约定 `onX`（接口）/ `handleX`（实现）；回调 prop 每次渲染是新函数属正常，只有 memo 子组件才需 useCallback。
- 通知父组件在事件处理器里同步做，不用 useEffect；两份 state 要同步就提升（→25）。
- Vue 对照：`defineEmits` + `emit` 是专门事件机制（不冒泡）；`v-model` / `defineModel` 是 `value + onChange` 的语法糖。
#### 二、核心概念（React）
- callback props：`onDelete: (id: string) => void` 与数据 prop 放同一 interface；子组件把 DOM 事件翻译成领域值上报
- 命名：`on` + 大写事件名；`handleX` 实现；可选回调 `onX?.()`
- 单向数据流与 props 只读：改 props 对象不会触发父组件更新，且污染数据源
- 通知父组件：同一事件处理器里 `setIsOn(next); onChange(next)`，React 批处理成一次渲染（→24）；不要 `useEffect(() => onChange(isOn), [isOn])`（runs too late，多一轮渲染）
- 更进一步：去掉子组件 state，改成完全受控 `Toggle({ isOn, onChange })`
- 回调代替事件传播：子组件 `e.stopPropagation()` 后再调 `onClick` prop，链路可追踪（→04）
- 兄弟通信 = 提升到最近公共父组件（→25）；跨多层先 props、再组合 children（→13）、再 context（→15）
- 回调每次渲染新函数正常；`memo` 子组件 / Hook 依赖才 `useCallback`（→17）
#### 三、Vue 对照
- `defineEmits<{ delete: [id: string] }>()` + `emit('delete', id)` ↔ `onDelete(id)`；额外参数全部转发
- 组件事件不冒泡（只能直接父级监听）↔ React 回调是函数值，可任意层转发
- camelCase 发出 / kebab-case 监听；`defineEmits({ submit: p => boolean })` 运行时校验 ↔ React 只有 TS 类型
- 未声明的 `@click` 落到根元素（fallthrough）↔ React 未知回调只是普通 prop
- `v-model` = `modelValue` + `update:modelValue`；`defineModel()`（3.4+）↔ `value` + `onChange`（→07）
- 深层 props 对象在 Vue 里能改到（响应式穿透）但违反单向流，两边都走上报
#### 四、关键区别
- 「事件」的本质：React 19.2 回调是普通函数值（无声明、无冒泡、无校验）；Vue 3.5 emit 是自定义事件系统（声明 / 抛出 / 监听）
- 语法糖：Vue 3.4+ `defineModel`；React 任何版本都没有 v-model，受控约定靠一对 props
- 更新方式：React 不可变（map 出新数组）；Vue 可变（`target.name = x`）（→21）
- 文件组织：React 同文件多组件；Vue SFC 一文件一组件
#### 五、常见追问与回答要点
- 「回调 prop 每次都是新函数会不会慢？」→ 正常；只在 memo / 依赖场景 useCallback
- 「子组件能在 Effect 里 onChange 吗？」→ 能跑但多一轮渲染，官方反例；改事件处理器或去掉子 state
- 「多层回调层层转发太烦？」→ 先组合 children，再 context；不是先上 store
- 「emit 和回调哪个更解耦？」→ emit 不冒泡、需声明；回调是函数值可直接传递、可追踪
- 「React 19 Actions 和回调 prop 什么关系？」→ `action` prop 就是异步回调 prop（→31）
#### 六、易错点
- 直接改 `product.name`：父组件不更新且数据源被污染
- `useState(props.x)` 只读一次；草稿缓冲要显式命名 `initialX` / 进入编辑时重置（→09 / 25）
- Effect 里回调父组件同步 state（存量代码常见）
- 把事件对象直接上抛而不是领域值
#### 七、生产环境注意
- 演示简化：回调全同步、数据在本地；生产 `onSubmit` 常返回 Promise，子组件要处理 pending / 错误 / 防重复（→19 / 31）
- 回调语义化：`onSelect(id)` 而非透传 event
- 受控子组件不复制 props 进 state
- 提升到根之前先组合（13）与 context（15）；跨页面用 store（16）或 URL（18）
#### 八、旧写法对照【旧写法】
- `useImperativeHandle` + ref 调子组件方法代替数据流：逃生舱，主责 12；19.0 起 ref 可作普通 prop
- 类组件 `this.props.onChange` + constructor `bind`：16.8 Hooks 后由函数组件闭包取代
- 子组件 `useEffect(() => onChange(v), [v])` 同步父组件：官方「You might not need an Effect」反例
- Vue 2 `this.$emit` 无类型声明 → Vue 3.3+ `defineEmits` 具名元组
#### 九、新动向【尝鲜】
- 无本题专属【尝鲜】项；React 19 Actions（`action` prop）已是【主流】只作引用（→31）
#### 十、动手练习
- 练习 1：给 ProductItem 加「库存 ±1」按钮，只上报 `onStockChange(id, delta)`，父组件钳在 0 以上。可断言结论：点「-」到 0 后按钮禁用，且父组件 `products` 中该项 `stock === 0`。
- 练习 2：把 ProductItem 改成「完全受控」——`editing` 与 `draftName` 提升到父组件。可断言结论：父组件重渲染（如删除另一项）后，正在编辑的输入框内容不丢。
#### 参考
- https://react.dev/learn/responding-to-events（React 19.3 站点，2026-09-17）
- https://react.dev/learn/passing-props-to-a-component（2026-09-17）
- https://react.dev/learn/sharing-state-between-components（2026-09-17）
- https://react.dev/learn/you-might-not-need-an-effect（2026-09-17）
- https://react.dev/reference/react/memo（2026-09-17）
- https://vuejs.org/guide/components/events.html（Vue 3.5，2026-09-17）
- https://vuejs.org/guide/components/v-model.html（2026-09-17）

### 09. 派生状态

#### 一、30 秒面试速答
- 能从 props / state 算出来的值不放 state，在渲染期直接算——React 组件每次渲染重跑函数，普通 const 就是最新值。
- 不要 `useState + useEffect` 同步派生值：多一份数据、多一轮渲染、会不同步；lint `react-hooks/set-state-in-effect` 会报 error。
- `useMemo` 只在计算昂贵（量过 ≥1ms）或需要引用稳定（memo 子组件 / Hook 依赖）时加；它只是性能优化，React 可能丢弃缓存。
- 选中项存 id 不存对象；props 不镜像进 state。
- Vue 的 `computed` 按响应式依赖缓存，React 派生值默认不缓存；useMemo 只对应 computed 的「缓存面」。
#### 二、核心概念（React）
- 渲染期直接算：`const total = items.reduce(...)`；纯计算、无副作用
- 三条 state 结构原则：避免冗余（能算的不存）、避免重复（存 `selectedId`，渲染期 `find`）、不镜像 props（例外命名 `initialX` / `defaultX`）
- Effect 派生的代价：先用旧值渲染再级联一次；`react-hooks/set-state-in-effect`（7.x `recommended`，error）
- useMemo：`useMemo(() => f(a, b), [a, b])`；deps 用 `Object.is`；StrictMode 开发期双调 factory；返回对象写 `() => ({...})`；不能在循环里调用
- 三种值得用的场景：慢计算且依赖少变；作为 memo 子组件的 prop；作为其它 Hook 的依赖
- 判断昂贵：`console.time` 包住、≥1ms 才考虑、CPU throttling、以生产构建为准
- prop 变化时：重置全部 state 用 `key`（→06）；只调整部分 state 用渲染期比较 prev 后 setState（同组件、必须有条件）；优先「能否全部渲染期算出」
- 事件间共享逻辑抽普通函数；多步计算在事件里一次算好，不用 Effect 链（→29）
#### 三、Vue 对照
- `computed(() => ...)`：按响应式依赖缓存；方法 / 模板内联表达式每次重跑——对应 React 「直接算」
- `useMemo` 手写 deps ↔ computed 自动收集；非响应式依赖（`Date.now()`）永不更新
- 可写 computed `{ get, set }` ↔ React 无对应，改源 state
- `computed((prev) => ...)`（3.4+）↔ React 需 ref 自存上一次值（→12 / 26）
- getter 无副作用、不突变返回值——两边一致
- `ref + watch` 同步派生值 ↔ `useState + useEffect`，同为反模式
#### 四、关键区别
- 缓存：Vue 3.5 computed 默认缓存；React 19.2 派生值默认每次渲染重算，不启用 Compiler 时只有 useMemo 才缓存
- 依赖：Vue 自动追踪；React useMemo 手写 deps，漏写即过期值
- 写法数量：Vue 有 computed / 方法两种（缓存与否）；React 有直接算 / useMemo 两种——并非「唯一写法」
- 语义保证：computed 缓存是语义的一部分；useMemo 缓存可能被 React 丢弃，只能当优化
#### 五、常见追问与回答要点
- 「每次渲染都重算不浪费吗？」→ 大多数计算 <1ms；先量再加 useMemo
- 「1ms 从哪来？」→ 官方经验值；开发期 StrictMode 双调导致偏大，以生产构建为准
- 「React Compiler 之后还写 useMemo 吗？」→ Compiler 自动记忆化；已有手写会被保留并受 `preserve-manual-memoization` 校验（→17）
- 「items 变了要重置选中项？」→ key / 渲染期 setState / 存 id 三选一，先试存 id
- 「selectedItem 存对象会怎样？」→ 编辑 item 后选中项不同步
#### 六、易错点
- Effect 里 setState 派生（lint error）
- `useMemo(() => { ... })` 忘返回；deps 漏写
- `useState(props.x)` 镜像 props
- 在循环里调 useMemo → 抽组件
- Vue：computed getter 里做副作用；直接改 computed 返回的对象
#### 七、生产环境注意
- 演示简化：`totalPriceMemo` 纯演示（课件已标）；生产默认渲染期算，传给 memo 子组件的对象 / 数组 prop 才 useMemo（→17）
- 服务端数据的过滤 / 汇总用 Query `select` 或渲染期算，不复制进 state（→30）
- 多字段联动用 useReducer 在事件里一次算好（→29）
- ESLint 用 `recommended`；可选开 `no-deriving-state-in-effects`
#### 八、旧写法对照【旧写法】
- `useEffect(() => setFullName(...), [first, last])`：Hooks 早期常见；渲染期计算取代
- 类组件 `componentWillReceiveProps`（16.3 起弃用）/ `getDerivedStateFromProps`：只存量
- 「全包 useMemo / memo」：官方称无大害但可读性差；Compiler 时代更无必要
#### 九、新动向【尝鲜】
- React Compiler 1.0【较新】自动记忆化（本项目不启用）；对派生值的影响只作引用（→17）
- Vue 3.6【尝鲜】alien-signals 重写响应式，computed 语义不变
#### 十、动手练习
- 练习 1：加「选中商品」功能，state 只存 `selectedId`，渲染期 `items.find`。可断言结论：把选中项数量 +1 后详情区显示的数量同步变化，且组件 state 只有 `items` 与 `selectedId` 两个。
- 练习 2：把 `totalPrice` 改成 Effect 同步版并运行 lint。可断言结论：`react-hooks/set-state-in-effect` 报 error；改回渲染期计算后 lint 通过且渲染次数少一次。
#### 参考
- https://react.dev/learn/you-might-not-need-an-effect（2026-09-17）
- https://react.dev/learn/choosing-the-state-structure（2026-09-17）
- https://react.dev/reference/react/useMemo（2026-09-17）
- https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（2026-09-17）
- https://vuejs.org/guide/essentials/computed.html（Vue 3.5，2026-09-17）

### 10. useEffect 与生命周期

#### 一、30 秒面试速答
- useEffect 让组件在渲染提交后与 React 之外的系统（网络、订阅、定时器、DOM）同步；它是「由渲染引起的副作用」，不是生命周期钩子，也不是 onMounted 的替代品【主流】
- 依赖数组不是「你选的」，是 Effect 内读到的全部响应式值；不传 = 每次 commit，`[]` = 只在挂载，`[a, b]` = 挂载 + a / b 变化（Object.is 比较）【主流】
- cleanup 在每次重跑前和卸载时各调一次；开发期 StrictMode 会 setup→cleanup→setup 一遍来检验 cleanup，生产不受影响（React 18 起）【主流】
- 能在渲染期算的、响应事件的、按 prop 重置的都不该进 Effect；在 Effect 里同步 setState 会多一轮渲染，lint 规则 `set-state-in-effect` 会报【主流】
- 要在 Effect 里读最新值又不想它进依赖：19.2 起用 `useEffectEvent`（→ 26）【较新】
#### 二、核心概念（React）
- Effect 的定位与执行时机：commit 后、屏幕更新后；交互引起的可能在绘制前跑；只在客户端运行、SSR 不跑
- 依赖数组三形态与「不能挑选依赖」；ref 对象与 setState 有稳定身份可省略；`ref.current`、`location.pathname` 等可变值写进去无效
- 对象 / 函数依赖导致每次重跑：静态对象移到组件外、动态对象移进 Effect、只从对象里读原始值
- cleanup 时机与 setup / cleanup 镜像；一个 Effect 只做一件同步的事，不相关的事拆开
- StrictMode 双调（18.0 起）：判据是「用户分不清 setup 一次与 setup→cleanup→setup」；用它当泄漏 / 竞态探测器
- 定时器与过期闭包：函数式更新去依赖 → 依赖数组重建定时器的代价 → latest ref → `useEffectEvent`（19.2+，细讲 → 26）
- 请求：cleanup 里 abort 或 ignore（细讲 → 27）；官方四个缺点与替代（框架机制 / TanStack / Router loader，→ 11 / 30）
- `useLayoutEffect`（绘制前、量布局）与 `useInsertionEffect`（CSS-in-JS 库）各一句；「能用 useEffect 就别用它」
#### 三、Vue 对照
- `useEffect(fn, [a, b])` ↔ `watch([a, b], cb)` 显式源 / `watchEffect` 自动追踪；Vue 无「漏依赖」问题，React 靠 exhaustive-deps
- cleanup ↔ `onWatcherCleanup()`（3.5+，须在同步段调用）；3.5 前用回调第三参 `onCleanup`【旧写法】
- `[]` ↔ `onMounted` 只是最接近写法；`watch` 默认惰性需 `immediate: true`，`watchEffect` 立即运行；`once: true`（3.4+）
- 卸载：同步创建的 watcher 随组件自动停止并触发 cleanup；异步创建的要手动 `unwatch()`；`onUnmounted` 不在 SSR 调用
- 时机轴不同：Vue watcher 默认 `flush: 'pre'`（组件 DOM 更新前）、`'post'` / `watchPostEffect`、`'sync'`；React 以浏览器绘制为参照
- StrictMode 双调无对应物；watcher 里改响应式状态是常规写法，但派生值两边都应改用 computed / 渲染期计算
#### 四、关键区别
- 心智模型：Vue 按时机命名钩子；React 是「声明如何同步 + 如何清理」，何时跑由依赖决定（适用 Hooks 16.8+ 函数组件）
- 过期闭包：React 每次渲染重建闭包，异步回调读到旧快照；Vue 的 ref 是长期容器现读现取——但把 `.value` 先读进局部变量同样过期，不是「根本不存在」
- 双调：React 18+ 开发期 StrictMode 才有；Vue 无
- SSR：两边的 Effect / onMounted 都只在客户端跑；React 的 `useLayoutEffect` 在服务端会报错
#### 五、常见追问与回答要点
- 「ref.current 写进依赖有用吗」：无用，它在 React 数据流之外变化；要响应就改成 state 或用 ref 回调
- 「为什么开发环境请求两次」：StrictMode 双调，cleanup 写对则净效果一次；Network 里两次是预期，不要关 StrictMode
- 「派生状态放 Effect 里 setState 报什么」：`set-state-in-effect`，代价是多一轮 render→commit→effect；渲染期直接算或 useMemo
- 「依赖里有对象怎么办」：先问它是否该是依赖；移出 / 移进 / 只读原始值；不要 eslint-disable
- 「什么时候必须 useLayoutEffect」：先量 DOM 再同步重渲染避免闪烁（tooltip 定位）
#### 六、易错点
- 把 `[]` 当成「初始化一次」：它表示「无响应式依赖」，StrictMode 下仍会 setup→cleanup→setup
- 同步 setState 在 Effect 开头（如 `setLoading(true)`）：lint 会报，改为把 loading 并入请求状态或交给数据库层；值来自 ref（量 DOM）时允许
- 用 eslint-disable 省依赖：这是「对 React 撒谎」，用函数式更新 / 拆 Effect / useEffectEvent 让依赖诚实
- 修法二 `[count]` 依赖变化比间隔快时定时器永远等不到触发；不该被打断的连接（WebSocket）尤其糟
- 卸载后 setState：React 18 起无警告，但泄漏依旧；cleanup 必须幂等（会跑两遍）
#### 七、生产环境注意
- 演示简化：请求直接写在 Effect 里；真实项目优先路由 loader 或 TanStack Query（→ 11 / 30），Effect 手写只留给无框架、无缓存需求的场景
- 演示简化：`fetchUsers` 是 mock，真实 fetch 要传 `signal`、检查 `response.ok`（→ 11 / 27）
- lint 基线：eslint.config.js 现只手开 rules-of-hooks / exhaustive-deps；切到 react-hooks 7 `recommended` 后 `set-state-in-effect` 为 error，需先处理 :291 一类写法
- 定时器 clearInterval、监听 removeEventListener、第三方 widget destroy() 都放 cleanup；开发保持 StrictMode 开启
- SSR / RSC：仅浏览器逻辑放 Effect；避免 didMount 模式导致闪烁，能用 CSS 就用 CSS（→ 33）
#### 八、旧写法对照【旧写法】
- class 生命周期 componentDidMount / DidUpdate / WillUnmount（Hooks 16.8 起被 Effect 取代）；「Effect = 三合一」是错误类比，官方要求「从每个 Effect 的视角思考」
- React 17 及以前 StrictMode 不双调 Effect；18.0 起模拟卸载重挂；18 起移除「卸载后 setState」警告
- `eslint-disable-next-line react-hooks/exhaustive-deps` 省依赖：19.2 起改用 `useEffectEvent`；手写 latest ref 是它的前身
- Vue 3.5 前 cleanup 用回调第三参 `onCleanup`；3.5 起 `onWatcherCleanup()`
#### 九、新动向【尝鲜】
- React 19.3 起 StrictMode 在 hydration 时也双调 Effect；`use(browser())` 让仅浏览器组件在服务端挂起而不报错（facts-versions §B）
#### 十、动手练习
- 把场景一改成「切换关键词时保留旧列表、只显示刷新中」，不触发 set-state-in-effect；可断言结论：输入「张」再输入「张伟」期间，列表元素数量不为 0 且最终只包含匹配「张伟」的行
- 给 BrokenIntervalCounter 写测试证明它停在 1，给 Updater 版证明 3 秒后为 3；可断言结论：使用 fake timers 推进 3000ms 后，坏版本文本为「1」、修法一为「3」，且卸载后再推进时间不再调用 setState
#### 参考
- https://react.dev/learn/synchronizing-with-effects（React 19.3 站点，2026-09-17）
- https://react.dev/learn/lifecycle-of-reactive-effects（2026-09-17）
- https://react.dev/learn/you-might-not-need-an-effect（2026-09-17）
- https://react.dev/reference/react/useEffect（2026-09-17）
- https://react.dev/reference/react/useLayoutEffect（2026-09-17）
- https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（2026-09-17）
- https://react.dev/reference/react/StrictMode（2026-09-17）
- https://vuejs.org/guide/essentials/watchers.html（Vue 3.5，2026-09-17）
- https://vuejs.org/api/reactivity-core.html#onwatchercleanup（2026-09-17）

### 11. API 请求状态

#### 一、30 秒面试速答
- 请求态是三值枚举 pending / error / success，用判别联合建模让非法组合无法表示；「空」是 success 下 `data.length === 0` 的派生展示，不是第四个请求态【主流】
- 手写 Effect 请求要做四件事：cleanup 里 abort 或 ignore、切换参数时重置、检查 `response.ok`、区分取消与失败【主流】
- 官方不推荐生产里裸写 Effect 取数：不在服务端跑、易造成网络瀑布、没有预载 / 缓存、样板多易出竞态；推荐框架内置机制，否则用 TanStack Query / useSWR / Router loader【主流】
- TanStack Query 的 `status` 回答「有没有数据」，`fetchStatus` 回答「queryFn 在不在跑」；`isLoading` = 首次请求进行中【主流】
- React 19 的 `use(promise)` + Suspense 把 loading / error 交给 fallback 与错误边界，但 promise 必须缓存，Suspense 看不见 Effect 里的请求【较新】
#### 二、核心概念（React）
- 状态建模：判别联合 vs 多布尔；空态判定；错误对象类型（HTTP 错误 / 网络错误 / 取消）统一
- 主线 Effect 手写（教学用；生产用缓存层，见 30）：`ignore` 或 AbortController + cleanup、reloadFlag 重试、切换参数重置；官方仍允许「都不合适时继续在 Effect 里请求」，并建议抽成自定义 Hook `useData(url)` 便于日后替换（→ 14）【主流】
  - 并排：TanStack Query v5【主流】，生产默认 —— `useQuery({ queryKey, queryFn })` 返回 status / fetchStatus / isPending / isLoading / data / error / refetch；默认 retry 3 次指数退避、staleTime 0、gcTime 5 分钟（细讲 → 30）
  - 并排：路由 loader【主流】，React Router 7 Data 模式 —— 取数在渲染前，`useLoaderData` 读取，pending 用 `useNavigation().state`；流式返回未 await 的 promise + `<Await>` / React.use（→ 18）
  - 并排：`use(promise)` + `<Suspense>` + 错误边界【较新】，React 19 起，只作引用（→ 32）—— promise 须缓存（纯客户端需自建 promise 缓存）、不能在 try/catch 里调用；useSuspenseQuery 同理
- 官方态度四个缺点与「适用于任何 UI 库」；选型判据：用了 TanStack 可留在声明式路由，要数据功能又要控制打包 / 服务端抽象用 Data 模式
- Suspense 只被 Suspense-enabled 数据源激活（框架、lazy、use(cached promise)），是 Effect 手写与 use(promise) 的分水岭
- 依赖 / 串行请求造成瀑布：能并行就并行，`enabled: !!userId` 时 status pending 且 fetchStatus idle
#### 三、Vue 对照
- Effect 手写 ↔ 官方 `useFetch(url)` composable（watchEffect + toValue，返回 data / error refs）；官方示例未做取消，需补 `onWatcherCleanup`（→ 27）
- TanStack ↔ `@tanstack/vue-query`：同一 query-core，返回 refs，`VueQueryPlugin` 安装（→ 30）
- 路由 loader ↔ vue-router「导航前获取」（beforeRouteEnter）/「导航后获取」（watch route.params + immediate）；vue-router 5 `vue-router/experimental` 数据加载器最接近 loader【尝鲜】
- use + Suspense ↔ Vue `<Suspense>` 等待 async setup / 异步组件，`#fallback`，错误用 onErrorCaptured；Vue 侧仍标实验性
- fetch 不因 HTTP 错误 reject：浏览器 API，两边相同
- StrictMode 双请求：Vue 无对应物
#### 四、关键区别
- 触发方式：主线 Effect 手写由依赖驱动，Vue 侧命令式 load() 或 watch 驱动——这组对比只在 Effect 手写与 Vue load() 之间成立
  - 并排：TanStack Query【主流】由 key 驱动的缓存；路由 loader【主流】（Data 模式）由导航驱动；`use(promise)`【较新】由渲染挂起驱动
- pending 的归属：主线 Effect 手写自己建模（判别联合）
  - 并排：TanStack Query 在 query 结果里（status / fetchStatus）；路由 loader 在 `useNavigation().state`；`use(promise)` 在 Suspense fallback + 错误边界
- 状态建模与框架无关，但更新方式不同：React 必须换引用（setState 新对象），Vue 的 ref 可整体替换也可原地改
- 开发期两次请求只在 React 18+ StrictMode 出现
#### 五、常见追问与回答要点
- 「空算不算状态」：不算请求态，是 success 的派生展示；文案是引导换关键词而非报错
- 「fetch 404 进 catch 吗」：不进，只有网络错误 / URL 非法才 reject；必须 `if (!res.ok) throw`
- 「TanStack 与 loader 能同用吗」：能——loader 里 prefetchQuery、组件里 useQuery 读缓存；或按官方判据留在声明式 + TanStack
- 「isLoading 与 isPending」：isPending = 没数据；isLoading = isPending && isFetching（首次请求中）
- 「为什么不能 use(fetch(url))」：客户端每次渲染重建 promise，必须缓存同一实例；错误进最近的错误边界
#### 六、易错点
- 三个布尔并存出现 isLoading && isError；判别联合杜绝
- 忘记检查 response.ok：error 分支永远不触发
- 把取消（AbortError）当失败：每次切换关键词闪一次错误（→ 27）
- Effect 开头同步 setState（重置 loading）会被 `set-state-in-effect` 报 error（react-hooks 7 recommended）；讲清多一轮渲染的代价与取舍
- 搜同一个词不重跑：setKeyword 同值不触发 Effect，需 reloadFlag 或 refetch
- 切换参数时先清空再加载导致闪烁：保留旧数据 + 刷新标记，或 `placeholderData: keepPreviousData`
#### 七、生产环境注意
- 演示简化：共用 mockApi 直接 throw Error、无 HTTP 状态码；真实项目封装 fetch：检查 response.ok、统一错误类型、`AbortSignal.timeout()` 超时（→ 27）
- 真实项目默认 TanStack Query v5（缓存 / 去重 / 重试 / 窗口聚焦重取，→ 30）或路由 loader（Data 模式，→ 18）；本课 Effect 手写是教学写法，生产只留给无框架且无缓存需求的场景，且至少抽成自定义 Hook
- 22 综合页作为落点：保持 effect 手写并补 ignore / abort，在「生产环境注意」写明三种生产改写（TanStack / 路由 loader + action + `useFetcher` / Actions）；是否直接迁到 useQuery + keepPreviousData 待用户决定（D2-2）
- lint：当前 eslint.config.js 未启用 recommended，切换后 :61 一类写法报 error
- 类型：queryFn 返回类型显式声明、响应用 zod 校验（→ 28）；错误信息脱敏后再展示
- 测试：mock fetch 或 MSW，断言三态渲染（→ 34）
#### 八、旧写法对照【旧写法】
- 无 ignore / abort 的裸 Effect 请求（竞态 + 卸载后 setState）；组件级 isMounted ref 只挡卸载（→ 27）
- TanStack v4 → v5（5.0 起）：loading→pending、isLoading→isPending、isInitialLoading→isLoading、cacheTime→gcTime、keepPreviousData→placeholderData、useErrorBoundary→throwOnError、query 上的 onSuccess / onError 回调移除、只支持单对象签名——本课手写版 status 仍用 'loading'，并排 TanStack 段按 v5 用 pending
- React Router 6.4 的 `defer()` → v7 直接返回 promise；v6 从 react-router-dom 导入 → v7 从 react-router（并排 loader 段按 v7 写，→ 18）
- 表单提交防重复的手写 submitting（→ 19）→ React 19 `<form action>` + useActionState（→ 31）
#### 九、新动向【尝鲜】
- Server Component 里直接 async/await 取数，promise 从服务端传给客户端组件再 use（需 RSC 框架，Next.js 16，→ 33）
- vue-router 5 `vue-router/experimental` 数据加载器（5.0.3 / 5.1.0 仍有破坏性变更）
#### 十、动手练习
- 给本课加一个「用真实 fetch 请求 /404」的分支，要求进入 error 态；可断言结论：对返回 404 的 URL，组件最终渲染 error 分支文案且不渲染表格
- 把同一页面改写成 useQuery 版本并对比代码量；可断言结论：搜索同一关键词两次时 queryFn 只被调用一次（staleTime 内），且 error 后点击重试 refetch 被调用
#### 参考
- https://react.dev/reference/react/useEffect#what-are-good-alternatives-to-data-fetching-in-effects（React 19.3 站点，2026-09-17）
- https://react.dev/learn/you-might-not-need-an-effect#fetching-data（2026-09-17）
- https://react.dev/reference/react/use（2026-09-17）
- https://react.dev/reference/react/Suspense（2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/queries（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/reference/useQuery（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5（v5，2026-09-17）
- https://reactrouter.com/7.18.4/start/data/data-loading（v7.18.4，2026-09-17）
- https://reactrouter.com/7.18.4/start/modes（v7.18.4，2026-09-17）
- https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch（③ MDN，2026-09-17）
- https://vuejs.org/guide/reusability/composables.html#async-state-example（Vue 3.5，2026-09-17）
- https://router.vuejs.org/guide/advanced/data-fetching.html（vue-router 5，2026-09-17）

### 12. useRef 与 DOM

#### 一、30 秒面试速答
- `useRef` 返回跨渲染同一个 `{ current }` 普通对象；改它不触发渲染、React 不追踪；用于 DOM 节点、定时器 id 等「渲染不需要」的值【主流】
- DOM ref 在 commit 之后才赋值，渲染期是 `null`；只在事件处理器 / Effect 里读写，渲染期读写会被 `react-hooks/refs` 拦下【主流】
- React 19 起 ref 是普通 prop：`function Input({ ref })` 直接转交给内部元素；`forwardRef` 只在 18 及以前需要【旧写法】
- ref 回调 19 起可返回 cleanup；要暴露句柄用 `useImperativeHandle` 收窄，能用 props 表达就别用句柄【主流】
- Vue 对照：`useTemplateRef`（3.5）拿 DOM；「跨渲染可变值」在 Vue 就是 setup 里的普通变量；Vue 的 `ref` 是响应式的，与 `useRef` 同名不同物【主流】
#### 二、核心概念（React）
- 两种用途：DOM 节点 / 可变值容器；`initialValue` 只在首轮生效；概念上 `useRef` ≈ `useState({ current })[0]`，所以跨渲染是同一对象
- 改 `.current` 不重渲染；渲染期不读写（懒初始化 `if (ref.current === null) ref.current = …` 是唯一例外）；lint `refs` 规则（recommended 预设 error）
- refs vs state 四行对照：`{ current }` vs `[v, setV]`；不触发 / 触发渲染；可变 / 不可变；渲染期不读 / 随时可读（每轮快照）
- DOM ref 时机：渲染期 `null` → commit 阶段先置 null 再赋节点 → 节点移除时置回 null；`flushSync(() => setState())` 后再 `scrollIntoView`
- 只改 React 没理由更新的部分：聚焦 / 滚动 / 测量 / 第三方库挂载；不要改 React 管理的文本、样式、innerHTML
- ref 回调：`ref={node => { …; return () => … }}`（19.0 起）；不返回 cleanup 则以 `null` 再调一次（兼容行为，将移除）；每次渲染传新函数会先 cleanup 再重建；列表 refs 用 `Map` + cleanup 里 `delete`
- ref 作为 prop（19.0 起）：`function MyInput({ ref })`；组件默认不暴露内部 DOM，要暴露就把 `ref` 转交给内部元素；传给 class 组件的 ref 不作 prop
- `useImperativeHandle(ref, () => ({ focus, scrollIntoView }), deps)` 收窄暴露面；只用于 props 表达不了的命令式行为
#### 三、Vue 对照
- `useTemplateRef('key')`（3.5，返回 `Readonly<ShallowRef<T \| null>>`）↔ `useRef<T>(null)`；同名 `const x = ref(null)` + `ref="x"`【旧写法】
- 挂载后才可访问：`onMounted` 内用或 `watchEffect` 判空 ↔ 事件 / Effect 内用
- 函数 ref `:ref="(el) => …"`（卸载时参数 null，无 cleanup 返回值）↔ React 19 前的 ref 回调行为
- `v-for` 内 `ref` 得到数组（挂载后填充，不保证顺序）↔ ref 回调维护 `Map`
- `defineExpose({ … })`（`<script setup>` 默认私有，须显式暴露）↔ `useImperativeHandle`（React 默认给整节点，须显式收窄）
- setup 里的普通变量 / 非响应式对象 ↔ `useRef` 用途二；`await nextTick()` ↔ `flushSync`
- vue-tsc 按 `ref` 所在元素自动推断类型 ↔ 手写 `useRef<HTMLInputElement>(null)`
#### 四、关键区别
- Vue `ref` 响应式、改 `.value` 即更新；React `useRef` 完全不追踪——适用 Vue 3.x / React 16.8+ 全部版本
- 暴露面方向相反：React 传 ref 拿到整个 DOM 节点，要收窄靠 `useImperativeHandle`；Vue `<script setup>` 组件默认私有，要暴露靠 `defineExpose`
- DOM 更新时机：React 用 `flushSync` 强制同步提交；Vue 用 `nextTick` 等待异步刷新
- ref-as-prop 与 ref 回调 cleanup 是 React 19.0 新行为；仍在 18 的项目必须 `forwardRef`，且 ref 回调不能返回值
- StrictMode 开发期双调 ref 回调（19.x）；Vue 无模拟重挂机制
- Vue 也会「改了不更新」：`shallowRef` 深层改动、`markRaw`、解构 `reactive` 原始属性——不要说成「永远不会」
#### 五、常见追问与回答要点
- 为什么渲染期不能读 `ref.current`？→ 渲染必须是纯函数；并发渲染下某次渲染可能被丢弃；懒初始化只写一次所以例外
- setState 后马上 `scrollIntoView` 拿到旧 DOM？→ `flushSync` 同步提交后再操作
- 不返回 cleanup 会怎样？→ React 以 null 再调一次；`ref={el => (x = el)}` 隐式返回赋值结果在 19 的 TS 下报错，改块体
- 为什么不能在 `map` 里 `useRef`？→ Hooks 规则（14 题）；改用 ref 回调 + Map
- `useImperativeHandle` 什么时候不该用？→ 能写成 `<Modal isOpen>` 就别暴露 `{ open, close }`
- class 组件怎么办？→ `createRef` / 实例 ref，ref 不作 prop
#### 六、易错点
- 渲染期读 ref（本课 :86 / :93 的演示）→ `react-hooks/refs` error；需要展示的值就应是 state
- 忘写 `?.` 判空；在 Effect 之前（渲染期）读 DOM ref
- ref 回调每次渲染传新内联函数 → 反复 cleanup / 重建；需要稳定时 `useCallback`
- cleanup 不幂等 → StrictMode 双调时释放两次
- 用 ref 改 React 管理的 innerHTML / 文本（→ 35 题 XSS 与 a11y）
#### 七、生产环境注意
- 本课简化：渲染期读 `ref.current` 只为观察「攒下的值」；真实项目改为 state，或在 Effect 里同步到 state
- 第三方实例（图表 / 地图 / 播放器）用 ref 回调 + cleanup 释放，cleanup 必须幂等
- 句柄用 `useImperativeHandle` 限定方法集并写 `deps`
- TS：`useRef<HTMLInputElement>(null)`；组件 props 里 `ref?: Ref<HTMLInputElement>`（→ 28 题 `ComponentProps` 与 ref-as-prop）；ref 回调不隐式返回
- 仍在 React 18 的库保留 `forwardRef` 并标【旧写法】；升级用 `types-react-codemod`
- 布局测量用 `useLayoutEffect`（→ 10 题）；不要在渲染期 `getBoundingClientRect`
#### 八、旧写法对照【旧写法】
- `forwardRef(render)`：19.0 起不再需要，官方称「未来版本将弃用并移除」；@types/react 19.2.18 尚未标 `@deprecated`；StrictMode 双调 render
- `useRef()` 无参 / `MutableRefObject`：@types/react 19 起三个重载都要求 `initialValue`，统一为 `RefObject`
- 字符串 ref：19.0 移除；`createRef` 仍用于 class 组件；`element.ref` 19.0 弃用，改 `element.props.ref`
- ref 回调返回值：19.0 前返回值被忽略、无 cleanup；只能靠 `null` 分支清理
- Vue：同名 `ref(null)` + `ref="x"`（3.5 前唯一写法）→ `useTemplateRef`（3.5）
#### 九、新动向【尝鲜】
- Fragment refs（19.3）：向 `<Fragment ref>` 传 ref 得到 `FragmentInstance`（有限 DOM 方法集）；19.2.8 不可用，只作一句
#### 十、动手练习
- 练习 1：写 `<FancyInput ref>`，用 `useImperativeHandle` 只暴露 `focus` / `clear`。可断言结论：`ref.current` 只有这两个方法，`ref.current instanceof HTMLInputElement` 为 false
- 练习 2：把「上一次搜索词」从 ref 改成 state；再给列表项写 ref 回调 + Map 并返回 cleanup。可断言结论：渲染期不再读 `.current`（`react-hooks/refs` 零报错）；删除一项后 `Map.size` 减 1
#### 参考
- https://react.dev/reference/react/useRef（19.3 站点，2026-09-17）
- https://react.dev/learn/referencing-values-with-refs；https://react.dev/learn/manipulating-the-dom-with-refs（2026-09-17）
- https://react.dev/reference/react/useImperativeHandle；https://react.dev/reference/react/forwardRef（2026-09-17）
- https://react.dev/reference/react-dom/components/common#ref-callback；https://react.dev/blog/2024/12/05/react-19（2026-09-17）
- https://react.dev/reference/eslint-plugin-react-hooks/lints/refs（eslint-plugin-react-hooks 7.1.1，2026-09-17）
- https://vuejs.org/guide/essentials/template-refs.html（Vue 3.5，2026-09-17）

### 13. children 与组件组合

#### 一、30 秒面试速答
- 标签之间的内容就是 `children` prop，类型 `ReactNode`，没有魔法；「具名插槽」= 任意传 JSX 的 prop；「作用域插槽」= render prop（值为函数的 prop，子组件用自己的数据调用）。
- 组合是 React 复用 UI 的主要手段：让不用数据的中间层接受 `children`，既避免 prop drilling（先组合再 context），又天然跳过 children 的重渲染。
- `children` 结构不透明，`Children` API 与 `cloneElement` 官方都标「uncommon / fragile」，新代码用多个子组件、对象数组 prop 或 render prop 代替。
- React 19 起 ref 是普通 prop，包装组件直接 `{ ref, ...rest }` 透传，不再需要 `forwardRef`。
#### 二、核心概念（React）
- `children`：接受元素、字符串、数字、portal、null / undefined / boolean、数组；`ReactNode` vs `ReactElement`；`PropsWithChildren<P>`（主责 28）。
- 具名 JSX prop：`header={<h1/>}`；render prop：`renderItem={(item) => …}`，`children` 也可以是函数；参数类型显式声明。
- 组合的两大收益：减少 prop drilling（"Extract components and pass JSX as children to them"，指向 15）；wrapper 更新 state 时 children 引用不变、不重渲染（指向 17）。
- 不透明的 `children`：`Children.count/map/toArray`、`isValidElement`，遍历不进入元素内部与 Fragment；三种替代 API 设计。
- `cloneElement` 注入 props 为何难追踪数据流；替代 render prop / context / 自定义 Hook。
- 组合 ≠ 在父组件内定义子组件（每次渲染重建，指向 01）；`{...props}` 用得多说明该拆组件并传 children（02）。
- 包装组件转发 ref：19 起 `{ ref, ...rest }`（主责 02 / 12）。
- 空值处理：`children ?? <Default/>`；`&&` 判空对 ReactNode 有 0 陷阱（05）。
#### 三、Vue 对照
- `{children}` ↔ `<slot />`；fallback 写在 `<slot>` 标签内，React 用 `??`。
- 具名 JSX prop ↔ `<template #header>`；动态名 `#[name]`；混用时默认插槽须显式 `<template #default>`。
- render prop / 函数 children ↔ 作用域插槽 `<slot :user="u" />` + `#default="{ user }"`；都是子组件提供数据、父组件决定渲染。
- Render scope 一致："Slot content has access only to the parent component's data scope"；JSX 闭包读父组件 state 同理。
- `footer != null` 判空 ↔ `$slots.footer` + `v-if` 条件插槽。
- TS：`children?: ReactNode` / `(x: T) => ReactNode` ↔ `defineSlots<{ default(props: { msg: string }): any }>()`（3.3+）、`useSlots()`。
- 逻辑复用：自定义 Hook ↔ composable，"Composables are more efficient than renderless components"（指向 14）。
- `Children` / `cloneElement` 无直接对应；Vue 插槽本身是函数，`useSlots()` 与 `h()` 里手动调用；渲染函数 / JSX 中插槽可作为值传递。
#### 四、关键区别
- 「插槽是模板语法」只在 Vue 模板下成立；Vue 渲染函数 / JSX 里插槽也是函数值——差异是默认路径而非能力。
- React 19.2：ref 是 prop、包装组件零成本透传；18 及以前需 `forwardRef`。
- Vue 3.5：插槽函数由子组件惰性调用（"invoked lazily by the child component"）；React render prop 同样由子组件决定何时调用，而普通 JSX prop 在父渲染期就已创建元素。
- React 组件内可与父同文件定义多个组件；Vue SFC 一文件一组件。
- 性能语义：React children 元素引用不变即可跳过重渲染；Vue 插槽内容按父作用域依赖追踪更新。
#### 五、常见追问与回答要点
- 「`children` 是函数时类型怎么写？」`children: (item: T) => ReactNode`；子组件在需要时调用。
- 「Layout 自己 setState，children 会重渲染吗？」不会，children 是父组件上次创建的同一元素引用（memo 页原则 1）。
- 「为什么 `Children` API 脆弱？」依赖 children 的具体结构；包一层组件或 Fragment 就失效。
- 「`cloneElement` 的替代？」render prop、context、自定义 Hook；数据来源在 JSX 里可见。
- 「renderless 组件 vs 自定义 Hook？」同为逻辑复用；Hook / composable 无额外组件实例，官方推荐。
- 「组合怎么减少 context？」把使用数据的组件作为 children 直接放进去，中间层不经手数据。
#### 六、易错点
- 在父组件函数体内定义 `Card` / `Row` 子组件。
- `footer && …` 判空遇到 `0`；`children` 为 `[]` / `''` 时 fallback 判断失效。
- 用 `Children.map` 假设 children 一定是数组或一定是某组件。
- 用 `cloneElement` 偷偷注入 `onClick`，使用者看不到数据来源。
- render prop 每项返回新组件类型（在回调里定义组件）导致整项重挂载。
- 包装组件忘记透传 `ref` / `className`（02）。
#### 七、生产环境注意
- 演示简化：Card / UserList 未透传 ref 与原生属性、未处理空 children fallback；真实组件库要 `{ ref, className, ...rest }` 透传并合并。
- 组件 API 优先复合组件 `<Card.Header>` 或具名 JSX prop，不解析 children 结构；`Children` / `cloneElement` 只为读懂第三方旧代码。
- render prop 参数类型显式声明；列表 render prop 每项都会调用，配合 `memo` 子项时保证引用稳定（17）。
- 布局 / 容器组件一律接受 `children`，不把数据 props 穿过不使用它的层。
- 逻辑复用优先自定义 Hook（14），不用 renderless 组件或 HOC。
#### 八、旧写法对照【旧写法】
- `React.FC<Props>` 隐式 `children`：@types/react 19.2.18 的 `FunctionComponent<P>` 签名 `(props: P): ReactNode | Promise<ReactNode>` 无隐式 children，必须显式声明（移除版本见 P-13-1）。
- HOC `withX(Component)` 与 `cloneElement` 注入 props：存量库常见；现用自定义 Hook + 组合（cloneElement#alternatives）。
- `forwardRef` 包装组合组件：18 及以前必需；19 起 "no longer necessary"。
- `Children.map` / `toArray` 遍历合成 key：官方标 uncommon。
#### 九、新动向【尝鲜】
- React Compiler 1.0【较新】：自动记忆化不改变「组合优先」原则；`eslint-plugin-react-hooks` 7.1.1 `recommended` 的 `static-components` 规则报错渲染期创建组件（主责 17）。
- React 19.3【尝鲜】：`<Fragment ref>` 可对 header / footer 这类 Fragment 内容拿到 `FragmentInstance`，本题不依赖。
#### 十、动手练习
- 练习 1：给 `Card` 加一个 `useState` 计数按钮，并在 `children` 里放一个用 `console.log` 记录渲染的子组件。可断言结论：点击 Card 内部计数按钮时，作为 children 传入的子组件不重新渲染（日志不增加）；把同一子组件改为在 Card 内部直接 `<Child/>` 渲染时，每次点击都重渲染。
- 练习 2：把 `UserList` 的 `renderItem` 改为函数 children（`{(user) => …}`），并给 `footer` 传 `0`。可断言结论：函数 children 版本渲染结果与 renderItem 版本一致；`footer={0}` 时 DOM 中出现文本 "0"，改成 `footer != null &&` 后不出现。
#### 参考
- https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children（19.3 站点，2026-09-17）
- https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context（2026-09-17）
- https://react.dev/reference/react/useMemo#should-you-add-usememo-everywhere（2026-09-17）
- https://react.dev/reference/react/Children；https://react.dev/reference/react/cloneElement（2026-09-17）
- https://react.dev/learn/typescript；node_modules/@types/react/index.d.ts:436-449, 1423, 325-332, 722, 1060-1061（@types/react 19.2.18）
- https://react.dev/blog/2024/12/05/react-19；https://react.dev/reference/react/forwardRef（2026-09-17）
- https://vuejs.org/guide/components/slots.html；https://vuejs.org/api/sfc-script-setup.html；https://vuejs.org/guide/extras/render-function.html（Vue 3.5.42，2026-09-17）

### 14. 自定义 Hook

#### 一、30 秒面试速答
- 自定义 Hook = `use` 开头、内部调用其他 Hook 的普通函数；共享有状态逻辑、不共享 state，每次调用完全独立【主流】
- Hooks 规则：只在组件 / Hook 顶层调用，React 靠调用顺序对应状态槽；`use` 前缀是 lint 识别 Hook 的硬规则【主流】
- 手写防抖：`useState` + `useEffect` 里 `setTimeout` + cleanup `clearTimeout`，依赖 `[value, delay]`；请求只依赖防抖后的值【主流】
- 订阅 React 之外的可变源（窗口宽度、在线状态、第三方 store）官方首选 `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`（18 起）；`useEffect + setState` 订阅是 18 前写法【主流】
- Vue composable 同样「共享逻辑不共享状态」，但无顶层 / 顺序限制，只受「生命周期钩子须在 setup 同步期注册」约束；setup 只跑一次、返回 Ref 容器【主流】
#### 二、核心概念（React）
- 定义与命名：`use` + 大写字母；不调 Hook 的函数不要加 `use`；每次调用得到独立的 state 与订阅
- Rules of Hooks 全清单（不在条件 / 循环 / 条件 return 之后 / 事件处理器 / class / 传给 useMemo 等的回调 / try-catch-finally 内）；原因：调用顺序 = 状态槽；报错「Rendered more/fewer hooks than expected」；`use()` 是唯一可条件调用的例外（→ 32）
- Hook 代码每次渲染重跑、必须纯；响应式值在 Hook 之间传递并保持最新——这是依赖数组存在的根本原因
- `useDebouncedValue`（自实现，react.dev 无官方版）：本质是「Effect 同步一个定时器」，cleanup 就是算法；`delay` 变化与卸载都由同一个 cleanup 覆盖
- 订阅外部系统（`useWindowWidth` 一类浏览器 API）主线 `useSyncExternalStore`（18.0 起【主流】）：`subscribe` 定义在模块级并返回退订函数、`getSnapshot` 返回原始值或缓存对象（Object.is 相同）、`getServerSnapshot` 供 SSR / hydration；防抖 Hook 不是外部 store，仍用 `useEffect`
  - 并排：`useEffect + setState` 订阅（现课件写法）作对照，标「18 之前的写法 / 简单场景仍可用」，须讲清并发渲染下的 tearing 风险与 SSR 无快照
- `useSyncExternalStore` caveat：快照必须不可变；非阻塞 Transition 中改 store 会退化为阻塞更新；不建议基于 store 值 suspend；传入不同 `subscribe` 会重新订阅
- 迁移示范：`useOnlineStatus` 内部从 Effect 改为 uSES，组件一行不改——自定义 Hook 的价值；生态：TanStack Query / Zustand 内部就是 uSES（→ 30 / 16 只作引用）
- 接收回调用 `useEffectEvent` 包装再放进 Effect，去掉回调依赖（19.2 起【较新】，→ 26）；返回函数包 `useCallback`（→ 17）；`useDebugValue` 给共享库里的 Hook 加 DevTools 标签
#### 三、Vue 对照
- composable：camelCase + `use`（约定非强制）；返回普通对象包多个 ref 便于解构 ↔ Hook 返回普通值或元组
- 使用限制：只能在 `<script setup>` / `setup()` 同步调用（或 onMounted 等钩子内）；可条件调用、不受顺序限制 ↔ Rules of Hooks
- `setup()` 只执行一次 ↔ Hook 每次渲染重跑——定时器 id 在 Vue 是普通 `let`，在 React 只能进 Effect 闭包或 `useRef`
- 入参 `MaybeRefOrGetter` + `toValue()`（3.3+）；要响应式副作用就 `watch` 该 ref ↔ Hook 参数是当次渲染的值
- `onMounted(addEventListener)` + `onUnmounted(remove)` 写入 ref（官方 `useMouse`）↔ `useSyncExternalStore`；Vue 的 ref 本身就是「外部可变源 + 订阅」，无 tearing
- SSR 时 DOM 副作用放 `onMounted` ↔ `getServerSnapshot` / Effect 在服务端不跑
- `watch(source, cb)` + 定时器 + `onUnmounted`（或 `onCleanup` 参数）↔ Effect + cleanup；VueUse `refDebounced` / `useWindowSize` 一句
- `useDebugValue` 无对应物（Vue DevTools 直接显示 setup 返回值）
#### 四、关键区别
- 顶层 / 顺序限制只在 React（16.8+ 至今）；Vue 的限制来自「要找到当前组件实例」，与顺序无关
- 订阅外部源：React 主线 `useSyncExternalStore`（18.0 起，并发安全）；Vue 用 ref + onMounted 天然无此问题
  - 并排：`useEffect + setState`（18 之前的写法 / 简单场景仍可用）在并发渲染下可能读到不一致快照，对照时须写明这一前提
- 定时器 id 存放：React 只能在 Effect 闭包（配 cleanup）或 `useRef`；Vue 是 setup 作用域普通变量（setup 只跑一次）
- 返回值形态：React 返回普通值（每次渲染重新拿）；Vue 返回 Ref 容器（`.value` 在变）
- SSR 前提：React 的 `getServerSnapshot` / Effect 不在服务端跑（→ 33）；Vue `onMounted` 只在客户端跑
#### 五、常见追问与回答要点
- 两个组件调同一个 Hook，state 互通吗？→ 不，各自独立（本课「卸载面板 B」演示）
- 为什么不能在条件里调 Hook？→ 状态槽按调用顺序对应；`use()` 例外因为它不按槽存状态
- `getSnapshot` 为什么必须稳定？→ 每次返回新对象 = 每次「变了」→ 无限重渲染，报「The result of getSnapshot should be cached」
- 服务端快照是什么？→ SSR / hydration 用的值，必须与客户端一致，省略则服务端报错
- Hook 里接收回调怎么处理依赖？→ `useEffectEvent` 包一层；返回的函数要不要 `useCallback`？→ 建议要，让消费者能做优化
- 防抖和节流的区别 → 停手后执行一次 vs 每 delay 至多一次；真实项目用 ahooks / VueUse / lodash
#### 六、易错点
- 把 Vue 的 `let timer` 搬进 React 函数体（每次渲染重置，防抖时灵时不灵）
- 缺 `clearTimeout` → 只是整体延后，不是防抖
- 自造 `useMount` / `useEffectOnce` 绕过 `exhaustive-deps`
- `getSnapshot` 每次 `new` 对象 → 死循环；`subscribe` 写在组件内 → 每次重订阅
- 在 Effect 里同步 `setState`（本课 :114 `setLoading(true)`）→ `react-hooks/set-state-in-effect`
- 「依赖 [] 永远不重跑」忽略 StrictMode 开发期双跑
#### 七、生产环境注意
- 本课 `useWindowWidth` 改为 `useSyncExternalStore` + 模块级 `subscribe` + `getServerSnapshot`（SSR 下 `window` 不存在）
  - 并排：`useEffect + setState` 版保留为对照（18 之前的写法 / 简单场景仍可用），须写明并发 tearing 风险
- `setLoading(true)` 在 Effect 内同步调用会被 `set-state-in-effect` 拦：请求状态交给 TanStack Query（→ 30），或把 loading 派生自「请求中的 key ≠ 已加载的 key」
- 防抖 Hook 处理 `delay` 变化与卸载；输入即搜仍要取消在途请求（→ 27）
- 通用 Hook 加 `useDebugValue`；泛型签名 `useDebouncedValue<T>(value: T, delay: number): T`
- 真实项目用 ahooks / VueUse / lodash.debounce；面试仍考手写
- 测试：`renderHook` + fake timers（→ 34）
#### 八、旧写法对照【旧写法】
- `useEffect + setState` 手写订阅：18 前唯一方式，存量最多；18.0 起官方改推 `useSyncExternalStore`。本课把它作并排对照（「18 之前的写法 / 简单场景仍可用」），不标【旧写法】
- React 17 项目用 `use-sync-external-store/shim`（待核实 P-14-1）
- Vue 3.3 前 composable 入参只接受 ref 需手写 `unref`；3.3 起 `toValue` 兼容 ref / getter / 普通值
#### 九、新动向【尝鲜】
- 无本题专属尝鲜项；`use(promise)` 作为「内置数据获取」方向见 32 题；React Compiler 对自定义 Hook 的自动记忆化见 17 题
#### 十、动手练习
- 练习 1：把 `useWindowWidth` 改写为 `useSyncExternalStore` 版本，`subscribe` 放模块级、`getServerSnapshot` 返回固定值。可断言结论：派发 `resize` 后返回值等于 `window.innerWidth`；多次重渲染后 `subscribe` 只被调用一次（引用稳定不重订阅）
- 练习 2：给 `useDebouncedValue` 写测试：fake timers 下连续输入三次。可断言结论：`advanceTimersByTime(delay - 1)` 时返回值仍是初始值，再前进 1ms 后等于最后一次输入
#### 参考
- https://react.dev/learn/reusing-logic-with-custom-hooks（19.3 站点，2026-09-17）
- https://react.dev/reference/rules/rules-of-hooks；https://react.dev/reference/eslint-plugin-react-hooks/lints/rules-of-hooks（2026-09-17）
- https://react.dev/reference/react/useSyncExternalStore；https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store（2026-09-17）
- https://react.dev/blog/2022/03/29/react-v18（useSyncExternalStore 起始版本，2026-09-17）
- https://react.dev/reference/react/useDebugValue；https://react.dev/reference/react/useCallback#optimizing-a-custom-hook（2026-09-17）
- https://vuejs.org/guide/reusability/composables.html；https://vuejs.org/guide/extras/composition-api-faq.html（Vue 3.5，2026-09-17）

### 15. Context 跨层传值

#### 一、30 秒面试速答
- Context 解决 prop drilling：`createContext` 创建、祖先 `<Ctx value>`（19 起，旧 `.Provider`）提供、后代 `useContext` 读；只找上方最近的 Provider，没有才用 defaultValue。
- value 变化（Object.is）时所有消费者重渲染，`memo` 挡不住；修法：`useMemo` / `useCallback` 稳定 value、拆 state / dispatch 两个 context、把值当 prop 传给 memo 子组件。
- 用之前先传 props、再抽组件传 children；Context 不是状态管理方案，高频更新用 store。
- TS 惯例 `createContext<T | null>(null)` + `useX()` 抛错。
- React 19 `use(Ctx)` 可在条件 / early return 后读 context；Vue 对照 `provide` / `inject` + `InjectionKey`，属性级更新无需 useMemo。
#### 二、核心概念（React）
- 三步与签名：`createContext<T>(defaultValue)`、`useContext<T>(ctx): T`、`<Ctx value={...}>`
- defaultValue 只在无 Provider 时生效且静态不变；无合理默认传 `null`
- 查找规则：上方最近 Provider；嵌套 Provider 局部覆盖
- 重渲染规则：Provider value 用 Object.is 判变，变了则所有消费者重渲染；memo 只管 props，挡不住 context；拆组件把值当 prop 传给 memo 子组件
- 稳定 value：`useMemo` 包对象 + `useCallback` 包函数
- 拆 context：state 与 dispatch / setter 分开；Provider + `useX()` 收进一个模块，不导出 Context 对象
- `use(Context)`【主流，19.0 起】：`use<T>(usable: Usable<T>): T`；可在条件、循环、early return 后调用；仍须在组件 / Hook 内；Server Components 不支持；除此之外与 useContext 同规则
- 使用前：先 props → 抽组件传 JSX 作 children（→13）→ 再 context；四类场景：主题、当前用户、路由、reducer + context（→29）
#### 三、Vue 对照
- `provide(key, value)` / `inject(key)`；`InjectionKey<T>` 携带类型 ↔ `createContext<T | null>` 泛型
- `inject(key, default)`、工厂形式 `inject(key, () => new X(), true)`；`app.provide()` 应用级
- provide 一个 `ref`（as-is 不解包）→ 属性级依赖追踪，只更新读了 `.value` 的组件 ↔ React 全体消费者重渲染
- `readonly(ref)` 防子组件改；把 `toggleTheme` 一起 provide ↔ React 拆 dispatch
- `inject` 必须在 setup 同步阶段调用（条件调用可行，异步后不行）↔ `use(Ctx)` 可条件调用
- `useTheme()` composable + throw 惯例一致
#### 四、关键区别
- 更新粒度：React 19.2 按 value 引用（Object.is）、全体消费者；Vue 3.5 按属性级依赖 → Vue 无需 useMemo 包 value
- Provider 形态：React JSX 包裹 `<Ctx value>`（19.0 起；18 及前 `.Provider`）；Vue setup 内函数调用
- 类型来源：React 靠 context 对象泛型；Vue 靠 Symbol key 泛型；Vue string key 时为 `unknown`
- 条件读取：React 仅 `use()`（19.0+）可条件调用；Vue inject 依赖当前实例
#### 五、常见追问与回答要点
- 「memo 能挡 context 更新吗？」→ 不能；拆组件 / 拆 context / 换 store
- 「`value={{ user, setUser }}` 有什么问题？」→ 每次渲染新对象 → 全员重渲染；useMemo
- 「Context 是全局状态管理吗？」→ 只是传递机制；无 selector 粒度（→16）
- 「`use` 和 `useContext` 差别？」→ 可条件调用；其余相同；RSC 不支持
- 「为什么拆 state / dispatch？」→ 只写不读的组件不随数据变化重渲染；Zustand selector 粒度更细
#### 六、易错点
- 忘包 Provider / 忘写 `value` → undefined；用 null + throw 暴露
- 假默认值吞掉漏包 Provider 的 bug
- value 字面量对象未 useMemo
- 依赖 memo 阻止 context 重渲染（无效）
- 构建产出重复模块（symlink）→ provide 与 read 不是同一 context 对象
- 高频值（输入、滚动）走 context
#### 七、生产环境注意
- 演示简化：Provider 写在 Example 内；生产写 `ThemeProvider({ children })` + `useTheme` 同模块导出，Context 对象不导出；children 由上层创建、引用不变则不随 Provider 内 state 重渲染
- 多 Provider 聚合 `AppProviders`；测试用 wrapper 提供 Provider（→34）
- 高频 / 大对象走 store（→16）；SSR / RSC 下 context 只在 client 组件可用（→33）
- 拆 state / dispatch 两个 context（→29）
#### 八、旧写法对照【旧写法】
- `<Ctx.Provider value>`：18 及以前唯一写法；19.0 起可省 `.Provider`，官方称未来弃用
- `<Ctx.Consumer>{v => ...}</Ctx.Consumer>` render prop：16.8 起用 useContext；class `static contextType`
- Legacy Context（`contextTypes` / `getChildContext`）：19.0 移除
#### 九、新动向【尝鲜】
- 19.3：`<Context>` 可在 Server Components 中直接渲染（未安装，→33）
#### 十、动手练习
- 练习 1：去掉 `useMemo`，在 Example 里加一个无关计数器 state。可断言结论：计数器变化时 ThemedCard 重渲染（渲染计数 +1）；加回 useMemo 后不重渲染。
- 练习 2：把 ThemedCard 包 `memo`，切换主题。可断言结论：memo 后 ThemedCard 仍重渲染（context 变化绕过 memo）；改为外层读 context、把 `theme` 当 prop 传给 memo 子组件后，无关重渲染消失。
#### 参考
- https://react.dev/learn/passing-data-deeply-with-context（2026-09-17）
- https://react.dev/reference/react/createContext（2026-09-17）
- https://react.dev/reference/react/useContext（2026-09-17）
- https://react.dev/reference/react/use（2026-09-17）
- https://react.dev/reference/react/memo（2026-09-17）
- https://react.dev/learn/scaling-up-with-reducer-and-context（2026-09-17）
- https://vuejs.org/guide/components/provide-inject.html（Vue 3.5，2026-09-17）

### 16. 全局状态（Zustand）

#### 一、30 秒面试速答
- 先分类：服务端数据交给 Query、URL 能表达的放路由、表单草稿留本地，剩下真正跨页面 / 跨子树共享的客户端状态才进全局 store。
- Zustand：`create` 出来的 store 就是 Hook，无 Provider；组件用 selector 订阅切片，Object.is 判变，选对象要 `useShallow`；底层是 `useSyncExternalStore`。
- Context 是传递机制不是 store：value 变全体消费者重渲染、无 selector；Redux Toolkit 是 Redux 官方标准写法（createSlice + Immer），存量项目多。
- store 里 `set` 浅合并、仍需不可变更新；actions 与 state 放一起；persist / devtools 靠中间件。
- Vue 对照：Pinia setup store（ref = state、computed = getter、function = action），依赖追踪自动订阅，`storeToRefs` 解构。
#### 二、核心概念（React）
- 主线 Zustand 5：`create<T>()((set, get) => ...)`，selector + `useShallow`，动作放 store 内；官方自述「A small, fast, and scalable bearbones state management solution」【主流】
  - 并排：Context + `useReducer`（React 内置方案，低频全局值 / 依赖注入用，与 15 交叉）；官方定位「Start by passing props … consider context」
  - 并排：Redux Toolkit【主流·存量】对照一节（概念 + 一段示意代码，不安装）；自述「the standard way to write Redux logic」「official, opinionated, batteries-included」；jotai / valtio / MobX 只提名字
- `create<T>()()` 双括号：T 不变型 + TS 无部分推断；或 `combine` 免类型
- 用 store：selector 选原子值；`Object.is` 判变；返回对象 / 数组用 `useShallow`；自定义 equalityFn → `createWithEqualityFn`
- `set(partial | fn, replace?)` 浅合并；`replace: true` 整体替换会清掉 actions；`get()` 读当前值；异步 action `async` + `await` 后 `set`
- 底层：`useSyncExternalStore` 订阅（→14）；`getState / setState / subscribe / getInitialState` 组件外可用
- 中间件：`devtools`、`persist`（+ `createJSONStorage`）、`subscribeWithSelector`、`combine`、`immer`（需另装）；slices 模式 `StateCreator<A & B, [], [], A>`
- 何时上 store：多处读写、更新频繁、需 selector 粒度、devtools / 持久化、组件外读写；服务端数据不进 store（→30）、URL 状态放路由（→18）、表单草稿本地（→07 / 31）
#### 三、Vue 对照
- Pinia `defineStore('id', setupFn)`：`ref` → state、`computed` → getter、`function` → action；setup store 须 return 全部 state
- `useStore(s => s.x)` ↔ `storeToRefs(store)` 解构；action 可直接解构；Vue 靠依赖追踪不需要 selector
- `set` 浅合并 / `replace` ↔ `$patch(obj | fn)` / 赋 `$state`；setup store 需自写 `$reset()`
- `subscribe` / `subscribeWithSelector` ↔ `$subscribe`（patch 后只触发一次）/ `$onAction`
- persist / devtools 中间件 ↔ Pinia 插件 `pinia.use()` + 内置 devtools / HMR / SSR
- Pinia 定位：核心团队维护、Vuex 维护模式、新项目推荐；模块级 `reactive` 是最小方案但 SSR 有 cross-request 污染
- RTK createSlice + Immer ↔ Pinia 直接改 state（无 mutations）
#### 四、关键区别
- 订阅粒度：主线 Zustand 5 手写 selector（Object.is）vs Pinia 3 属性级自动追踪
  - 并排：Context 全体消费者重渲染（memo 挡不住）；RTK `useSelector`（严格相等 + `shallowEqual`）【主流·存量】
- Provider：主线 Zustand 无 Provider（模块级单例；SSR 需 createStore + Context）vs Pinia 需 `app.use(createPinia())`
  - 并排：Context / RTK 都需 Provider
- 更新方式：Zustand / RTK（Immer 内部产不可变）/ Context 均不可变；Pinia 可变（→21）
- 派生值：Zustand 无缓存 getter（selector 内算或组件内算）；Pinia getter = computed 缓存
- React 官方不指定 store 库、只给 Context（+ reducer）；主线 Zustand 是采用第一的社区库；Vue 有唯一官方推荐 Pinia
#### 五、常见追问与回答要点
- 「Zustand 怎么订阅？」→ useSyncExternalStore；无 Provider 因 store 是模块级对象
- 「selector 返回对象无限重渲染？」→ 新引用每次不同；useShallow 浅比较一层；v5 去掉 hook 第二参
- 「RTK 为何能直接改 state？」→ createSlice 内置 Immer；RTK Query 与 TanStack Query 二选一
- 「Context 和 store 分界？」→ 低频小值树内共享用 Context；多处读写 / 高频 / devtools 上 store
- 「Compiler 后还要 selector 吗？」→ 要；Compiler 不改变外部 store 订阅粒度（待核实）
#### 六、易错点
- 不传 selector 订阅整个 store
- selector 返回新对象 / 数组不用 useShallow
- `set(x, true)` 清掉 actions
- 嵌套对象直接改（需拷贝或 immer）
- Pinia：直接解构 state 丢响应；setup store 无 `$reset`
- 把服务端缓存塞进 store
#### 七、生产环境注意
- 演示简化：单 store、同步 action、无持久化 / devtools、`totalPrice` 用 store 内函数现算；生产 Zustand：slices + persist 白名单 + version / migrate + devtools 仅开发期
  - 并排：RTK【主流·存量】configureStore + createSlice + createAsyncThunk 或 RTK Query；Context + useReducer 拆 state / dispatch 两个 Context
- SSR / RSC：模块级单例跨请求共享 → `createStore` + Context 每请求实例（→33）
- 测试：`useStore.setState(useStore.getInitialState(), true)` 重置（→34）
- 安全：token 不随 persist 落 localStorage（→35）
- 异步 action 处理 loading / error，或交给 Query（→30）
#### 八、旧写法对照【旧写法】
- Redux 经典：手写 store / `combineReducers` / action 常量 / `connect(mapStateToProps)`；RTK 1.0 + react-redux 7.1 hooks 起取代（RTK 本身作并排【主流·存量】，不进本段）
- zustand v4：`useStore(sel, shallow)` 第二参 equalityFn；v5 改 `useShallow` / `createWithEqualityFn`（v5 发布日期待核实）
- Context + useReducer 手搓 store：官方 scaling-up 教程写法，无 selector，生产多被库替代
- Vuex → Pinia（维护模式）；Pinia 2 options store → 3 setup store 现行
#### 九、新动向【尝鲜】
- zustand `unstable_ssrSafe` 中间件（5.0.15 仍 unstable）
- pinia 4【较新】：ESM-only、`@vue/devtools-api` 需并装（2026-07）
#### 十、动手练习
- 练习 1：把 CartPanel 改成 `useCartStore(s => ({ items: s.items, clear: s.clear }))`，观察渲染。可断言结论：ProductList 加购一次 CartPanel 渲染两次以上（或 React 报无限更新警告）；改用 `useShallow` 后每次 set 只渲染一次。
- 练习 2：给 store 加 `persist`（name 'cart'，只持久化 items）。可断言结论：刷新页面后 `useCartStore.getState().items` 与刷新前一致，且 `localStorage.getItem('cart')` 中不含 action 字段。
#### 参考
- https://zustand.docs.pmnd.rs/learn/getting-started/introduction（zustand 5，2026-09-17）
- https://zustand.docs.pmnd.rs/learn/guides/prevent-rerenders-with-use-shallow（2026-09-17）
- https://zustand.docs.pmnd.rs/learn/guides/advanced-typescript（2026-09-17）
- https://redux-toolkit.js.org/introduction/getting-started（RTK 2.x，2026-09-17）
- https://redux.js.org/introduction/getting-started（2026-09-17）
- https://react.dev/learn/passing-data-deeply-with-context（2026-09-17）
- https://pinia.vuejs.org/core-concepts/（pinia 3，2026-09-17）
- https://pinia.vuejs.org/core-concepts/state.html（2026-09-17）
- https://vuejs.org/guide/scaling-up/state-management.html（Vue 3.5，2026-09-17）

### 17. useMemo 与 useCallback

#### 一、30 秒面试速答
- `useMemo` 缓存计算结果、`useCallback` 缓存函数本身、`memo` 让子组件在 props 不变时跳过重渲染；三者配套，只 `useCallback` 不配 `memo` 没意义【主流】
- 只在三种情况值得：计算明显慢且依赖少变、作为 memo 子组件的 prop、作为其他 Hook 的依赖；否则先靠「children 传 JSX、state 就近、纯渲染」减少需求【主流】
- 记忆化只是性能优化不是语义保证：没有它代码也必须正确，React 可能丢弃缓存【主流】
- 先测再优化：React DevTools Profiler 火焰图 / Ranked，`<Profiler onRender>` 取 actualDuration；万行列表用虚拟化【主流】
- React Compiler（1.0，2025-10）在构建期自动记忆化并「保留」手写记忆化；本项目不启用，但 `preserve-manual-memoization` 等 lint 规则已在 `recommended` 里【较新】
- Vue：`computed` 自动依赖 + 缓存；子组件按 props 变化更新，天然不需要 memo / useCallback【主流】
#### 二、核心概念（React）
- 更新模型：父组件重渲染默认递归重渲染所有子组件；`{}` / `() => {}` 每次渲染都是新引用
- `memo(Component, arePropsEqual?)`：逐个 prop Object.is；自身 state / 所用 context 变化仍重渲染；「是优化不是保证」；深比较可能冻结
- `useMemo(calc, deps)`：calc 必须纯、deps 用 Object.is；`useCallback(fn, deps) ≡ useMemo(() => fn, deps)`
- 何时有价值（useMemo 三种 / useCallback 两种）；不该用：为 Effect 造对象 → 对象移进 Effect；列表项 useCallback → 抽成 memo 子组件
- 判断昂贵：`console.time` 包住计算 ≥ 1ms；StrictMode 双调计算函数只影响开发
- 「只能当性能优化」：React 可能丢弃缓存（如卸载重挂）；忘写 deps / 箭头函数返回对象忘括号
- Profiler：DevTools Components / Profiler 面板，录制 → 逐 commit → 火焰图（黄慢蓝快灰未渲染）→ Ranked；`<Profiler id onRender={(id, phase, actualDuration, baseDuration, …)}>`；生产需 `react-dom/profiling`；19.2 Performance Tracks【较新】
- 列表虚拟化：只渲染视口内（及 overscan）项；`@tanstack/react-virtual`（headless，自定义 markup）/ react-window v2 `List` / `Grid`（现成组件）；固定高度优先
- React Compiler【较新】：构建期自动记忆化，解决级联重渲染与组件外昂贵计算；保留现有 useMemo / useCallback / memo；新代码靠编译器、存量保留；`"use memo"` / `"use no memo"`（临时、配 TODO）；本项目不启用（方案 A：先学手写再交给编译器）
- lint（recommended 已含）：`preserve-manual-memoization`（手写记忆化漏依赖阻止编译）、`use-memo`（不放副作用、必须返回值）、`static-components`、`purity`、`immutability`；linter 不需要安装编译器
#### 三、Vue 对照
- `useMemo(() => f(a), [a])` ↔ `computed(() => f(a.value))`：自动依赖收集、只在依赖变化时重算；方法调用每次渲染都执行
- 依赖数组手写（lint 兜底）↔ 自动收集——Vue 不需要 `exhaustive-deps`
- `useCallback` ↔ 无需：子组件按 props 值更新，不靠引用相等；编译器缓存内联 handler（P-17-1 待核实原文）
- `memo` ↔ 内置行为（props 未变不更新）+ 显式 `v-memo`（按表达式数组比较，最接近 memo + deps）/ `v-once`
- useMemo 返回同引用避免下游重跑 ↔ 3.4 起 computed 只在值变化时触发副作用
- calc 必须纯 ↔ computed getter 无副作用、返回值是快照不要改
- React DevTools Profiler / `<Profiler>` ↔ Vue DevTools 性能面板 / `app.config.performance`
- 虚拟化 ↔ vue-virtual-scroller / `@tanstack/vue-virtual`；大不可变数据 ↔ `shallowRef` / `shallowReactive`
- React Compiler ↔ 无对应物（细粒度响应式无需编译期记忆化）；Vue 官方评价「部分记忆化问题可由 React Compiler 解决」可引
#### 四、关键区别
- 性能模型：React 默认全量重跑 + 手动记忆化（不开 Compiler 的 React 16.8–19.x）；Vue 依赖追踪 + 组件级精准更新（Vue 3 全版本）
- 依赖声明：手写 deps（Object.is 比较）vs 自动收集
- 更新判定：引用相等（React `memo` 浅比较）vs props 值变化（Vue）——所以 React 才需要稳定引用
- 开启 Compiler 后（【较新】，前提代码遵守 Rules of React）React 也接近「自动挡」，但手写记忆化仍被保留而非删除
- StrictMode 开发期双调渲染与计算函数（React）；Vue 无对应机制，计数即真实更新次数
#### 五、常见追问与回答要点
- `useCallback` 怎么用 `useMemo` 实现 → `useMemo(() => fn, deps)`；只用 `useCallback` 不配 `memo` / 依赖 → 白做
- 怎么判断昂贵 → `console.time` ≥ 1ms；仍卡再用 Profiler 看哪些组件最受益
- React 会丢弃缓存吗 → 可能；所以只能当优化，语义用 `useId` / `useRef`
- `children` 传 JSX 为什么减少渲染 → 父组件 state 变时 children 元素引用不变，包裹组件重渲染不会波及
- 开了 Compiler 还写 `useMemo` 吗 → 新代码不必；存量保留；需要精确控制 Effect 依赖时再手写
- `preserve-manual-memoization` 报错说明什么 → 手写记忆化漏依赖，编译器无法安全保留，该组件被跳过
- `actualDuration` vs `baseDuration` → 本次实际耗时 vs 无记忆化时的估算耗时，差值就是记忆化收益
- 万行列表 → 虚拟化；headless（自定义 markup）vs 现成组件
#### 六、易错点
- 只 `memo` 子组件却传内联对象 / 函数 → 等于没做（本课去掉 useCallback 即 +200 次渲染）
- 忘写 deps；箭头函数返回对象忘加括号 → `undefined`
- `useMemo` 里放副作用（`use-memo`）；用 `useMemo` 保证引用语义（生成 ID）
- 深比较的 `arePropsEqual` 让应用冻结
- 到处加 memo / useMemo：内存 + 心智成本，典型网站粗粒度交互不需要
- StrictMode 下 console 计数翻倍误判为「memo 失效」
#### 七、生产环境注意
- 本课简化：计算函数与渲染体里的 `console.count` 只为观察，生产不在 `useMemo` / 渲染体里写副作用；200 条 filter+sort 未必达 1ms，真实项目先量再加
- 先 Profiler 再优化：录一次交互、看 Ranked 找最贵组件，记录 `actualDuration` 基线
- `memo` 子组件 + 稳定 props（`useCallback` / `useMemo` / 原始值）成套
- 列表 > 数百行且每行有布局成本时用 `@tanstack/react-virtual` 或 react-window；动态高度用测量
- 将来启用 Compiler：先让 `recommended` lint 全绿，`annotation` 模式 + `"use memo"` 渐进，`"use no memo"` 排查；不一刀切删记忆化
- 真正昂贵的纯计算考虑 Web Worker 或服务端
- 类型：`useCallback<T extends Function>` 推断回调；`memo` 包泛型组件的写法（→ 28）
#### 八、旧写法对照【旧写法】
- class 组件 `PureComponent` / `shouldComponentUpdate(nextProps)` ↔ `memo` / `arePropsEqual`（`memo` 起始版本待核实 P-17-3）
- react-window v1 `FixedSizeList` / `VariableSizeList` → v2 `List` / `Grid`（v2 版本号待核实 P-17-2）
- `useMemo` / `useCallback` 手写记忆化在 Compiler 项目里不是「旧写法」而是「被保留」的写法
#### 九、新动向【尝鲜】
- React Compiler 1.0 已稳定属【较新】而非尝鲜；本项目暂不启用（方案 A）
- 19.2 Performance Tracks（Scheduler / Components 轨道）；`recommended-latest` 额外的 `void-use-memo`
#### 十、动手练习
- 练习 1：去掉 `handleSelect` 的 `useCallback`，用 `<Profiler onRender>` 累计 ProductRow 的 actualDuration。可断言结论：点「触发无关重渲染」时，去掉 useCallback 后 ProductRow 渲染次数 +200（StrictMode 下 +400），加回后 +0
- 练习 2：把 200 条改成 20000 条并用 `@tanstack/react-virtual` 渲染。可断言结论：DOM 里的 `<tr>` 数量 ≈ 视口高度 / 行高 + overscan，而不是 20000
#### 参考
- https://react.dev/reference/react/useMemo；https://react.dev/reference/react/useCallback；https://react.dev/reference/react/memo（19.3 站点，2026-09-17）
- https://react.dev/reference/react/Profiler；https://react.dev/learn/react-developer-tools（2026-09-17）
- https://react.dev/learn/react-compiler/introduction；https://react.dev/reference/react-compiler/directives；https://react.dev/blog/2025/10/07/react-compiler-1（Compiler 1.0，2026-09-17）
- https://react.dev/reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization；https://react.dev/reference/eslint-plugin-react-hooks/lints/use-memo（eslint-plugin-react-hooks 7.1.1，2026-09-17）
- https://github.com/TanStack/virtual；https://github.com/bvaughn/react-window（README，2026-09-17）
- https://vuejs.org/guide/essentials/computed.html；https://vuejs.org/guide/best-practices/performance.html；https://vuejs.org/guide/extras/composition-api-faq.html（Vue 3.5，2026-09-17）

### 18. 路由（React Router）

#### 一、30 秒面试速答
- React Router 7 有三种模式：声明式（`<BrowserRouter>` + `<Routes>`）、Data（`createBrowserRouter` 配置数组 + loader / action / pending）、Framework（Data + Vite 插件）；主线用 Data，从 `react-router` 导入、`RouterProvider` 从 `react-router/dom` 导入，写法兼容 v8。
- 登录守卫：Data 模式在分组路由的 loader 里 `throw redirect('/login')`，或用 middleware【较新】；两者都在导航提交前拦截、可以 await 异步检查。声明式模式只能用 RequireAuth 包 element，在渲染中拦截，刷新时需要 checking 态。
- 「路由表是组件树 vs 配置」不是框架差异：`<Routes>` 内部把子元素转成配置对象，Data 模式本身就是数组；真区别是渲染中拦截 vs 渲染前拦截（Vue 的 beforeEach 属于后者）。
- 路由参数从 /orders/o1 变到 /orders/o2 时同位置同组件复用实例，state / effect 保留；要重置就给 `key={id}`。
- `setSearchParams` 整体替换查询串，要在旧参数上改用函数式；`navigate(-1)` 用 `location.key === 'default'` 兜底；前端守卫和按钮隐藏只影响体验，鉴权在后端。
#### 二、核心概念（React）
- 主线 Data 模式：`createMemoryRouter(routes, { initialEntries })`（嵌入演示 / 测试）与 `createBrowserRouter(routes)`（生产）+ `<RouterProvider router />`（从 `react-router/dom` 导入）；router 在组件树外只建一次，「Data Routers should not be held in React state」。
  - 并排：声明式 `<MemoryRouter initialEntries>` / `<BrowserRouter>` + `<Routes><Route path element>`【主流】，v6 存量项目现状，也是「自己有数据层（TanStack Query）」时官方认可的路径（→30）；`<Routes>` 子元素只能是 `<Route>` 或 Fragment，所以守卫只能包在 element 上。
- 路由对象字段：path / index / children / `Component` vs `element` / loader / action / errorElement / handle / lazy / middleware；两种模式共用嵌套 children + `<Outlet>`、index 路由、动态段 `:id` + useParams、通配 `*`。
- loader 在渲染前调用，`useLoaderData<typeof loader>()`；父级数据 useRouteLoaderData；父子 loader 并行执行（dataStrategy 默认）。
- 守卫（主线 Data）：无 path 的分组路由 loader 里 `throw redirect(...)`【主流】，或 `middleware: [requireAuth]`【较新】（父→子依次、未登录时子 loader 不跑、每次客户端导航都跑，7.18.3 Data 模式无需 flag）；三态检查在 loader / middleware 里 `await`。
  - 并排：声明式 RequireAuth 三态包装组件包 element【主流】，未登录渲染 `<Navigate replace>`。
- 提交与 pending：action + `<Form method="post">` + useActionData，完成后自动重新验证；useFetcher 非导航提交；`useNavigation().state`（idle / loading / submitting）与 NavLink 的 isPending。
- 错误与流式：errorElement / useRouteError / isRouteErrorResponse，loader 里 `throw data('Not Found', { status: 404 })`，至少一个根 errorElement；loader 返回未 await 的 promise（须为对象字段）+ Suspense + `<Await>`（React 19 可 use()，→32）。
- useBlocker + useBeforeUnload 离开确认（仅 Data）；handle + useMatches 面包屑（用 loaderData，不用已弃用的 data）；路由级 lazy【较新】；NavLink 默认 `active` 类 + `aria-current="page"`，函数式 className / style 可选。
#### 三、Vue 对照
- `createRouter({ routes })` 配置数组 ↔ `createBrowserRouter([...])` 配置数组（同构）；`createMemoryHistory()` ↔ `createMemoryRouter`；`app.use(router)` ↔ `<RouterProvider>`。
- `router.beforeEach((to, from) => …)` 返回值写法（false 取消 / 路由位置重定向 / undefined·true 放行）↔ loader `throw redirect` / middleware，都在导航提交前；`next()` 三参数【旧写法】仍支持但官方称易错；`meta.requiresAuth` 父到子合并 ↔ 无 path 分组路由。
- 组件内取数 `watch(() => route.params.id, …, { immediate: true })` / `beforeRouteEnter` ↔ loader + useLoaderData；vue-router 5 `vue-router/experimental` 的 `defineBasicLoader`【尝鲜】↔ loader（同为导航前运行）。
- `<RouterLink>` 默认 `router-link-active` / `router-link-exact-active`（基于路由记录匹配，/orders 在 /orders/:id 不激活）↔ NavLink 默认 `active` + `aria-current`（URL 前缀，end 精确）。
- `useRouter().push / replace / go(-1)`（返回 Promise）↔ `useNavigate()`；两边都没有「无上一页」兜底，都要自己判。
- `onBeforeRouteLeave(() => false)` ↔ useBlocker；`component: () => import()` ↔ 路由级 lazy（Vue 明确不要用 defineAsyncComponent 作路由组件）；同 RouterView 实例复用需 watch 或 `:key` ↔ 同位置复用需 `key={id}`。
- `<KeepAlive>` 包 RouterView ↔ `<Activity>`【较新】（路由层无封装，→32）；vue-router 5 文件路由【较新】在 React Router 里对应 Framework 模式，Data 模式无对应物。
#### 四、关键区别
- 拦截时机（最重要的区别）：主线 Data loader / middleware 与 Vue beforeEach 都在导航提交前（可 await、子请求不发、被拦 URL 不入历史栈）。适用：Data 模式 v6.4+ / v7。
  - 并排：声明式 RequireAuth 在渲染中拦截（同步判断、必须 replace、刷新需 checking 态）【主流】，v6+。
- 「全局导航钩子」：主线 Data 模式有 middleware（7.9 起；7.18.3 Data 模式无需 flag，Framework 模式需 `future.v8_middleware`，v8 默认开）；并排的声明式模式确实没有。
- 守卫持续性：主线 loader / middleware 与 Vue beforeEach 都只在导航时跑一次，登录态变化要自己 watch 后手动跳转；并排的 RequireAuth 是渲染条件，退出登录时立刻弹回。
- 实例复用两边一致（同位置复用）：React 用 `key={id}` 或写对依赖，Vue 用 watch 或 `:key="route.fullPath"`；前提是同一路由记录 / 同一 element 位置。
- 激活样式两边都默认加类名：React 按 URL 前缀 + end，Vue 按路由记录；「高亮只能写在 JS 里」不成立。
- `setSearchParams(obj)` 与 `router.push({ query })` 都整体替换查询串；要保留其他参数两边都得合并旧值。
- 「路由表是 JSX vs 配置」只是声明式模式的表象（v6 起 `<Routes>` 内部 createRoutesFromChildren 转配置），不是 React 与 Vue 的差异。
#### 五、常见追问与回答要点
- 三种模式怎么选：按官方 modes 页定位；有自己数据层（TanStack Query）且不需要 pending 状态时声明式也是官方认可；声明式没有 useNavigation / useBlocker / loader。
- loader 里 throw redirect 有什么坑：父子 loader 并行，父级拦截时子级请求可能已发出；middleware 在 next() 前 throw 就不会跑子 loader；Data 模式不需要 flag，只需 `declare module "react-router" { interface Future { v8_middleware: true } }` 补类型。
- 为什么 RequireAuth 要三态：刷新时登录态异步恢复，同步布尔会误判为 guest 并跳登录页；Data 主线 loader 可 await，不存在这个问题。
- /orders/o1 → o2 state 会保留吗：会；useParams 拿到新 id 但实例没重挂；`key={id}` 或依赖数组。
- setSearchParams 为什么丢参数：整体替换；用函数式 `setSearchParams(prev => …)`；同一 tick 多次调用不会累积；筛选变更时重置 page；替换历史用 `{ replace: true }`。
- v6 → v7 → v8 导入：v6 `react-router-dom`【旧写法】；v7 推荐 `react-router`（dom 包只是转发）；v8 删除 dom 包，改 `react-router/dom`；v6 已 EOL；v8 升级前开 5 个 `v8_*` flag。
- redirect 与 navigate 的区别：redirect 返回带 Location 头的 Response，用于 loader / action；navigate 是组件里的命令式函数；官方「often better to use redirect in action/loader functions than this hook」。
#### 六、易错点
- 在组件函数体里直接调 `navigate()`（渲染期副作用）：用 `<Navigate>` 或放进事件 / effect。
- RequireAuth 忘加 replace：后退回到被拦页面再被推回登录页，来回弹跳。
- 回跳地址只拼 pathname，丢掉用户原本带的 query。
- 把 router 放进 React state 或在组件内 `createBrowserRouter`（每次渲染新建）。
- 流式 loader 返回单个 promise（必须是带 key 的对象）；`<Await>` 要放在 Suspense 内。
- 函数式 lazy 不能懒加载 path / index / children / middleware；useMatches 用 `data`（已弃用）而非 `loaderData`。
- 把「没有全局钩子」「路由表是组件树」「React 没有实例复用坑」当成框架结论；模板残留「（没有一一对应关系）」不要照抄。
- 「按钮不渲染更安全」：前端隐藏不是安全边界（→35）。
#### 七、生产环境注意
- 演示简化：主线用 createMemoryRouter 嵌进壳应用（生产 createBrowserRouter）；`RouterProvider` 内部同样渲染 `<Router>`，受「不能嵌套 Router」约束，仍挂在独立 React 树（`isolateReactRoot` + ReactIsolatedMount）。
  - 并排：声明式版用 MemoryRouter（生产 BrowserRouter），同样挂独立树。
- 登录态：主线在 loader / middleware 里 `await auth.check()`，真实项目登录态住全局 store（→16）。
  - 并排：声明式版 RequireAuth 三态 checking / authed / guest。
- safeRedirect（实现归 35）：只允许以 `/` 开头且不以 `//`、`/\` 开头的站内路径；`throw redirect()` 接受绝对 URL 会整页跳外域，所以必须校验。
- `navigate(-1)` 用 `location.key === 'default'` 兜底跳列表页；Vue `router.back()` 同理。
- setSearchParams 用函数式更新并在筛选变更时重置 page；push 与 `{ replace: true }` 按「是否值得一条历史」取舍。
- 每棵路由树至少一个根 errorElement；404 用 `throw data(…, { status: 404 })` + isRouteErrorResponse。
- 前端权限只影响体验，后端逐请求鉴权（→35）；大页面用路由级 lazy；表单页 useBlocker + useBeforeUnload；提交用 `<Form>` / useFetcher 拿 pending，而不是手写 submitting（→19 / 31）。
#### 八、旧写法对照【旧写法】
- 导入路径：v6 从 `react-router-dom`【旧写法】→ v7 `react-router` + `react-router/dom`（主线）→ v8 删除 dom 包【尝鲜】；两种模式都受影响，声明式并排版尤其要改 :55。
- 流式：v6.4–6.x 用 `defer()` 包装，v7 起 loader 直接返回 promise；仅主线 Data 模式有此演变。
- v5 `<Switch>` 与自定义 `<PrivateRoute>` 组件：v6 起 `<Routes>` 子元素只能是 `<Route>`，直接报错。
- v6.4 之前只有声明式模式；Data 模式（createBrowserRouter）自 v6.4 起。
- middleware：7.9 之前不存在；Framework 模式 v7 需 `future.v8_middleware`，v8 默认开启。
- `UIMatch.data` → `loaderData`：v7 弃用、v8 删除。
- Vue：`beforeEach(to, from, next)` 三参数 → 返回值写法（vue-router 4 起推荐，5 仍兼容）；vue-router 3 的 `new VueRouter({...})`。
#### 九、新动向【尝鲜】
- React Router v8（2026-06-17）：Node 22.22+ / React 19.2.7+ / Framework 需 Vite 7+；升级前开 `v8_middleware` 等 5 个 flag；删除 `react-router-dom`；`useMatches` 只剩 loaderData；v6 与 Remix v2 官方 EOL。
- `<Link viewTransition>` / `navigate(to, { viewTransition: true })` 走 `document.startViewTransition`；React 19.3 `<ViewTransition>` 可做切换动画（19.2.8 不导出，→32）。
- vue-router 5（2026-01-29，无破坏性变更）：文件路由进核心 `vue-router/vite`【较新】；`vue-router/experimental` 数据加载器【尝鲜】（5.0.3 起 `reroute()`，5.1 起 `defineParamParser`）。
#### 十、动手练习
- 练习 1：把 /settings 分组路由的守卫从 RequireAuth 改成 loader `throw redirect`，再改成 middleware。可断言结论：未登录访问 /settings/profile 后 `router.state.location.pathname === '/login'`，且 profile 路由的 loader spy 调用次数为 0（middleware 版）。
- 练习 2：在 OrderDetailPage 加一个 useState 计数并点击加 1，从 /orders/o1 导航到 /orders/o2。可断言结论：不加 key 时计数保留（仍为 1）；给 element 加 `key={id}` 后计数归 0。
- 练习 3：用函数式 setSearchParams 同时保留 `page` 与 `status`。可断言结论：`setSearchParams(prev => { prev.set('status', 'paid'); prev.set('page', '1'); return prev })` 后 `location.search === '?page=1&status=paid'`（或按插入顺序 `?status=paid&page=1`，以 URLSearchParams 实际序列化为准）。
#### 参考
- https://reactrouter.com/7.18.4/start/modes（v7.18.4，2026-09-17）；/start/data/installation；/start/data/route-object；/start/data/data-loading；/start/data/actions；/start/declarative/routing
- https://reactrouter.com/7.18.4/how-to/middleware；/how-to/error-boundary；/how-to/suspense；/how-to/navigation-blocking；/how-to/fetchers（2026-09-17）
- https://reactrouter.com/7.18.4/api/data-routers/createMemoryRouter；/createBrowserRouter；/RouterProvider；/api/hooks/useSearchParams；/useNavigate；/useNavigation；/useBlocker；/useMatches；/api/components/NavLink；/Form；/Await；/api/utils/redirect（2026-09-17）
- https://reactrouter.com/8.4.0/upgrading/v7（v8.4.0，2026-09-17）；https://remix.run/blog/react-router-v8（2026-06-17，抓取 2026-09-17）
- https://react.dev/learn/preserving-and-resetting-state（19.3 站点，2026-09-17）
- https://router.vuejs.org/guide/advanced/navigation-guards.html；/guide/advanced/data-fetching.html；/guide/advanced/lazy-loading.html；/guide/advanced/composition-api.html；https://router.vuejs.org/file-based-routing/；https://router.vuejs.org/data-loaders/（vue-router 5，2026-09-17）

### 19. 异步提交与防重复

#### 一、30 秒面试速答
- 手写骨架：`onSubmit` + `preventDefault` + `async` + `try / catch / finally`；`submitting` 必须在 `finally` 恢复。
- 防重复两层：`disabled={submitting}` + 处理器顶部提前返回；同一 tick 重入要 `useRef` 锁；服务端幂等是最终防线。
- 状态建模：`result: { type, message } | null` 或单一 `status` 判别联合，杜绝非法组合。
- 成功清空 / 失败保留；错误进 state 渲染而不是 throw（边界不捕获事件处理器→20）。
- React 19 并列写法：`useActionState` 的 `isPending` + 串行排队、`useFormStatus`、`startTransition(async)`（→31）；Vue：`ref(false)` + `@submit.prevent`。
#### 二、核心概念（React）
- 骨架与 `FormEvent<HTMLFormElement>` 类型（→28）【主流】
- `submitting` + `result` 建模 vs 单一 `status: 'idle' | 'submitting' | 'success' | 'error'`【主流】
- 防重复：`disabled` 被 Enter / `requestSubmit` / 测试绕过 → guard；渲染快照：state guard 只对下一次渲染后的事件有效，同一 tick 内程序化重入需 `useRef` 锁（P-19-1）【主流】
- 过期响应 / 卸载后回写：`AbortController`（mockApi 支持 `signal`）或 `ignore` 标志（→27）【主流】
- 错误分层：网络 / 5xx 可重试 vs 4xx 字段错误；`err instanceof Error` 收窄；不 throw 到边界【主流】
- 成功后：受控清 state、非受控 `form.reset()`、按需 `navigate`（→18）【主流】
- 主线：受控 + 手写 `submitting`（`useState` + ref 锁）【主流】
  - 并排：`<form action>` + `useActionState`（`isPending` 自动、多次提交串行排队）+ `useFormStatus().pending` 子组件按钮 + `useOptimistic`【主流】，19.0 起，本课只写一段「React 19 起可以这样写」并指向 31
  - 并排：非表单按钮 `startTransition(async () => …)` + `useTransition` 的 `isPending`，`await` 后再包一层；抛错进边界（→20）【主流】，19.0 起
#### 三、Vue 对照
- `@submit.prevent` + `const submitting = ref(false)` + `:disabled`；`v-model` 持值；`try / finally` 逐行对应
- Vue 响应式即时读到最新值，无渲染快照，state guard 足够
- `async` handler 的 Promise 拒绝也进 `onErrorCaptured` / `app.config.errorHandler`（runtime-core.cjs.js:205-213）；React 事件处理器必须自己 `try / catch`
- `await router.push()` 等导航完成再结束 submitting；Vue 无 Actions / `useFormStatus` / `useOptimistic` 对应物
- `type="number"` 自动 `.number` 修饰符（课件 :33-37 已讲对）
#### 四、关键区别
- 快照 vs 响应式：React `submitting` 在同一渲染内不变（19.2 createRoot），Vue `ref` 即时；React 需 ref 锁的场景仅同 tick 重入
- 主线手写 submitting：两边逐行对应
  - 并排：React 19 Actions（19.0 起）自动 pending + 串行排队，Vue 手写；错误进边界（React）vs 进 `errorCaptured`（Vue，含异步）
- 错误捕获面：React 边界不接事件处理器错误（19 例外：`startTransition`）；Vue 接事件处理器与 async 拒绝
- 卸载后 setState：React 18+ 静默无警告（P-19-3），但仍应取消请求；Vue 同理用 `onWatcherCleanup` / `AbortController`（→27）
#### 五、常见追问与回答要点
- 只靠 `disabled` 为什么不够？→ Enter / `requestSubmit` / 测试直接调用
- 为什么连续两次调用可能都读到 `false`？→ 渲染快照；ref 锁不触发渲染（→12）；真实双击是否复现见 P-19-1
- 判别联合 vs 多布尔？→ 不可能出现 `success && error`
- `useActionState` 下重复提交会怎样？→ 排队串行、每次收到上一次结果；`useFormStatus` 要放子组件（→31）
- 错误 throw 还是进 state？→ 事件处理器 throw 进不了边界；Action 内 throw 会进边界，可恢复错误 return state
- 有 TanStack Query / Router 时？→ `useMutation.isPending`（→30）、`useFetcher.state !== 'idle'`（→18），别重复造轮子
#### 六、易错点
- `setSubmitting(false)` 不在 `finally` → 失败后表单卡死
- 成功回调盲目覆盖用户新输入；卸载后回写
- 把网络错误和字段错误一视同仁
- `useFormStatus` 写在渲染 `<form>` 的同一组件拿不到 pending（→31）
- `await` 后的 setState 忘了再包 `startTransition`（→31）
#### 七、生产环境注意
- 演示简化：`failRate: 0.3`、无 `signal`、无错误分类、无 `role="alert"` / `aria-describedby`（→35）
- 生产：`submitting` state + `useRef` 锁；请求带 `AbortController`；错误分类展示 + 重试按钮
- 服务端幂等键 / 唯一约束；前端防重复只是体验
- 手写 submitting 在 19 仍是【主流】，不是过渡写法
  - 并排：`<form action>` + `useActionState` + `useFormStatus`【主流】，19.0 起（→31）；React 18 不可用
- 有服务端状态层用 `useMutation` 的 pending 与失效重取（→30）
#### 八、旧写法对照【旧写法】
- React 18：无 `useActionState` / `useFormStatus` / `useOptimistic`，`startTransition` 只接同步函数，手写 submitting 是唯一方案；19.0 起两条路并存，手写 submitting 不标【旧写法】，本段只放 React 18 差异
- `useFormState`（react-dom，Canary 名）→ `useActionState`（react）19.0 更名（→31）
- Vue 侧 3.x 内无写法变化
#### 九、新动向【尝鲜】
- 19.3：`submit` 事件含 `submitter`；Server Action 自动 reset 触发 `onReset`（19.2.8 未安装）
- 19.3 Transitions 独立渲染（多个 Action 不再互相拖慢）
#### 十、动手练习
- 练习 1：给 handler 加 `useRef` 锁，同一 tick 内调用两次 `form.requestSubmit()`。可断言结论：`submitOrder` 只被调用一次
- 练习 2：用 `AbortController` 在卸载时取消请求。可断言结论：卸载后不再 `setResult`；`isAbortError` 不显示为错误
- 练习 3（并排）：用 `useActionState` 重写。可断言结论：连续两次提交串行执行，第二次 `fn` 收到第一次的返回值
#### 参考
- https://react.dev/reference/react-dom/components/form#handle-form-submission-with-an-event-handler（站点 19.3，2026-09-17）
- https://react.dev/learn/state-as-a-snapshot；/learn/typescript（2026-09-17）
- https://react.dev/reference/react/useActionState；/reference/react-dom/hooks/useFormStatus；/reference/react/useTransition（2026-09-17）
- https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary（2026-09-17）
- https://reactrouter.com/7.18.4/how-to/fetchers（v7，2026-09-17）
- https://vuejs.org/guide/essentials/forms.html；https://router.vuejs.org/guide/essentials/navigation.html（Vue 3.5 / vue-router 4.x-5.x 共有，2026-09-17）
- node_modules/@types/react/index.d.ts:1835, 1878；node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:205-213

### 20. 错误边界

#### 一、30 秒面试速答
- 边界 = class 组件 `static getDerivedStateFromError`（转 state 渲染 fallback）+ 可选 `componentDidCatch`（上报）；函数组件无等价 API，生产多用 `react-error-boundary`。
- 能捕：子树渲染、生命周期、构造函数、`use` 拒绝 / `lazy` 失败、19 起 `startTransition` / Action 内抛错；不能捕：事件处理器、`setTimeout` 等异步、SSR、自身。
- 事件 / 异步错误：`try / catch` 转 state，或 `useErrorBoundary().showBoundary` 交给最近边界。
- 19：错误不再 rethrow，`createRoot({ onCaughtError, onUncaughtError, onRecoverableError })` 统一上报；根边界 + 局部边界 + `resetKeys` 重试。
- Vue：`onErrorCaptured` 任意组件即边界，连事件处理器、async 拒绝都接；`return false` 停止传播；`app.config.errorHandler` 全局兜底。
#### 二、核心概念（React）
- 主线手写 class（`getDerivedStateFromError` / `componentDidCatch` / `ErrorInfo.componentStack`），本课程唯一的 class 组件场景，要能解释为什么必须是 class【主流】
  - 并排：`react-error-boundary`（`ErrorBoundary` + `fallbackRender` / `FallbackComponent` + `onError` / `onReset` + `resetKeys` + `useErrorBoundary`）【主流】，官方明示可用；项目未安装，是否安装待用户决定（D2-3），不安装则只能是注释里的代码
- 能捕获清单 + 19 例外：Transition / Action 内抛错或拒绝的 Promise（→31）；`use(promise)` 拒绝、`lazy` 失败（→32）【主流】
- 不能捕获：事件处理器、`setTimeout` / `rAF`、SSR、自身；处理法 `try / catch` → state 或 `showBoundary`【主流】
- 捕获后子树整棵卸载；reset 后全新实例；`resetKeys={[id]}` / `key` 随参数重置【主流】
- 粒度：根边界兜底（否则整棵 UI 被移除）+ 路由页 / 弹窗 / 卡片局部边界；fallback 不再渲染出错内容【主流】
- `createRoot` 三个回调各收 `(error, errorInfo)`；`captureOwnerStack()` 仅开发【主流，19.0】
- 路由级 `errorElement` / `useRouteError` 接 loader / action / 渲染错误（→18）；Actions 可恢复错误 return state（→31）【主流】
- 边界不是流程控制：校验 / 404 用 state / 路由 `throw data`【主流】
#### 三、Vue 对照
- `onErrorCaptured((err, instance, info) => boolean | void)`：来源含渲染、生命周期、事件处理器、watcher、setup、指令、过渡；自底向上依次调用；`return false` 停止（源码 :238-239，且不再 `logError`）
- `app.config.errorHandler` ↔ `createRoot` 回调：同为应用级兜底（课件「不是同层概念」应改）
- Vue 不自动卸载崩溃子树，`v-if` / `:key` 重挂；React 自动卸载
- async 事件处理器的 Promise 拒绝也进 `onErrorCaptured`（`callWithAsyncErrorHandling` :205-213）—— React 事件处理器与 `setTimeout` 都不进边界
- `<Suspense>` 异步错误走 `onErrorCaptured`（→32）；无边界组件原语
#### 四、关键区别
- 捕获面：React 只接「渲染流程」+ 19 的 Transition 例外；Vue 接所有「Vue 管理的代码」含事件与 async
- 传播：React 最近边界处理即止；Vue 逐级调用直到 `return false` 或 `errorHandler`
- 重置与上报：主线 class 手写，reset 靠 `setState` / `key`，上报在 `componentDidCatch` —— Vue 侧一律 `onErrorCaptured` + 本地 state
  - 并排：`react-error-boundary`【主流】`resetKeys` 自动重置、`onError` 上报、`showBoundary` 把事件错误交给边界
- 日志：19 已捕获 → `console.error`、未捕获 → `window.reportError`（18 会 rethrow 造成重复日志【旧写法】）；Vue `return false` 后不打印
#### 五、常见追问与回答要点
- `onClick` 里的错误为什么捕不到？→ 不在渲染流程；`setTimeout` 同理；`startTransition` 内例外（19）
- 为什么只能 class？→ 无 Hook 等价物；生产用 `react-error-boundary`；`getDerivedStateFromError` 纯函数改 state，`componentDidCatch` 做副作用
- 怎么重试？→ `resetErrorBoundary()` / `resetKeys` / `key`；重试前修复触发条件（如换 id）
- React 19 改了什么？→ 不 rethrow；`onCaughtError` / `onUncaughtError` / `onRecoverableError`
- Vue `return false` 什么意思？→ 阻止向上及 `errorHandler`；Vue 能接事件处理器错误
- Action 里 throw 会怎样？→ 取消排队 Action、显示最近边界；可恢复错误 return state（→31）
#### 六、易错点
- 把「异步一律捕不到」当绝对结论（19 的 Transition 例外）
- 只有局部边界没有根边界
- fallback 里再渲染出错内容 → 死循环
- 边界组件自身出错只能由外层接
- 拿边界做表单校验 / 404 流程控制
- 「唯一 class 场景」措辞（`getSnapshotBeforeUpdate` 亦无等价物）；「没有一一对应关系」残留
#### 七、生产环境注意
- 演示简化：fallback 写死、只 `console.error`、无根边界、无 `resetKeys`
- 生产：`createRoot` 回调上报监控；每个异步区域一个边界 + 重试；`resetKeys={[routeParam]}`
- 主线手写 class 时把 fallback / onReset / resetKeys 做成 props
  - 并排：`react-error-boundary`【主流】需 `npm i react-error-boundary` 新增依赖（待用户决定 D2-3）
- 与 Router：路由级 `errorElement` 与组件级边界分工（→18）
- 开发环境仍会打印被捕获错误，不是边界失效（P-20-3）
#### 八、旧写法对照【旧写法】
- React 18：边界捕获后仍 rethrow → 重复日志；无 `onCaughtError` 等选项；异步 Transition 不进边界 —— 19.0 起改变（手写 class 是主线，不进本段）
- 早期只在 `componentDidCatch` 里 setState 渲染 fallback 的写法 → 改用 `getDerivedStateFromError`（引入版本待核 P-20-5）
- 从 `react-dom/test-utils` 导入 `act` 测边界 → 19 起从 `react` 导入（→34）
#### 九、新动向【尝鲜】
- 19.3：Strict Mode hydration 双调 Effects；`react-dom` `browser()` 让组件在 SSR 挂起且不报 recoverable error
- 函数式边界 API 仍无官方计划（react.dev 现状）
#### 十、动手练习
- 练习 1：给 ErrorBoundary 加 `resetKeys` prop（或改用包），改 `id` 自动重置。可断言结论：`id` 变化后 fallback 消失且子树 state 归零
- 练习 2：在 `startTransition(async)` 里 throw。可断言结论：外层边界显示 fallback；同样代码放 `setTimeout` 则不显示
#### 参考
- https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary（站点 19.3，2026-09-17）
- https://react.dev/reference/react-dom/client/createRoot（2026-09-17）
- https://react.dev/blog/2024/04/25/react-19-upgrade-guide（2026-09-17）
- https://react.dev/reference/react/useTransition#displaying-an-error-to-users-with-an-error-boundary；/reference/react/useActionState（2026-09-17）
- https://github.com/bvaughn/react-error-boundary（README，未标版本，2026-09-17）
- https://reactrouter.com/7.18.4/how-to/error-boundary（v7，2026-09-17）
- https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured；/api/application.html#app-config-errorhandler（Vue 3.5，2026-09-17）
- node_modules/@types/react/index.d.ts:1219, 1225, 1255, 4134-4138；node_modules/@types/react-dom/client.d.ts:22-26；node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:205-257

### 21. 不可变数据更新

#### 一、30 秒面试速答
- React 不追踪你改了什么：setter 用 `Object.is` 比新旧引用，同引用 = 没变；所以 state 里的对象 / 数组视为只读，更新必须造新对象【主流】。
- 对象用展开（浅拷贝），嵌套「从改动点到根每层新引用」，未动的分支共用引用；数组添加用展开、删除用 filter、替换用 map、排序先拷贝再 sort（或 `toSorted`）【主流】。
- 引用不变会连带 memo、useMemo、useEffect 依赖全部失效，这是 React 整个优化体系的地基【主流】。
- 嵌套深时用 Immer（`useImmer`，draft 是记录改动的 Proxy）或把 state 归一化；RTK 的 `createSlice` 内置 Immer【主流】。
- Vue 的 `reactive` 靠 Proxy 在写入时触发组件重渲染，直接改即可；坑反过来在「整体替换 / 解构」【主流】。
#### 二、核心概念（React）
- 「You should treat any JavaScript object that you put into state as read-only」；原地改后 React「has no idea that the object has changed」（反例按钮保留）。
- 对象：`{...person, firstName}`，「The spread syntax is shallow」；嵌套「create copies all the way up from the place you're updating」（模式一、二保留）。
- 数组四张表：添加 push/unshift → 展开 / concat；删除 pop/shift/splice → filter / slice；替换 splice / `arr[i]=` → map；排序 reverse/sort → 先拷贝；插入中间 `[...a.slice(0,i), x, ...a.slice(i)]`。
- 「In React, you will be using slice (no p!) a lot more often」——`slice` 拷贝、`splice` 原地改。
- 结构共享：map 只对目标项展开，其余原样返回；JSON 视图里只有被改路径上的节点是新的（保留 `<pre>` 演示）。
- 规则边界：「Local mutation is fine」（改刚创建的对象）；props / context 同样只读；reducer 同规则（29）。
- 更新函数必须纯（id 在事件处理器里生成，StrictMode 双调），惰性初始化 `useState(() => structuredClone(…))` 解释一句并指向 03。
- 深嵌套根治：扁平化 / 归一化（`byId` + `ids`），不是更长的展开链（03 结构原则）。
#### 三、Vue 对照
- `reactive` / `ref` 深层响应：`order.customer = x`、`items.push(x)`、`items.splice(i, 1)` 都触发更新（Vue 五个对照函数保留）。
- 粒度写准：Proxy 触发的是「读了它的组件的 render effect 重跑」，再由 patch flags 减少 diff；不是属性级 DOM 更新。
- Vue 的镜像坑：`reactive` 「Cannot replace entire object」「Not destructure-friendly」；React 的坑在「改引用」，Vue 的坑在「换引用 / 解构」。
- Vue 侧何时也要不可变：大型不可变结构、撤销重做——官方 `useImmer` composable（`shallowRef` + `produce`，只有 `.value` 被赋值才触发）。
- `shallowRef` + `triggerRef`、`markRaw` / `toRaw`：用「只在整体替换时更新」换掉深层代理的开销，是 Vue 对 React 语义的一种主动选择。
- props 只读两边一致：Vue「you should not attempt to mutate a prop inside a child component」，对象 prop 技术上可改但应 emit。
- Pinia state 直接改 / `$patch`，落点 16。
#### 四、关键区别
- React 19.2：变更检测是「拉」——靠你换引用、它比较；Vue 3.5：「推」——Proxy 写入时通知订阅者。两者都不是「更好」，是 setter 模型与依赖追踪模型的必然结果。
- 不启用 React Compiler 时，引用稳定性直接决定 memo / useMemo / 依赖数组是否生效；Compiler【较新】开启后仍以「不可变」为前提，违反规则的组件会被跳过编译。
- Vue 不需要不可变，但需要「不破坏响应式」：不能整体替换 `reactive`、不能解构；`shallowRef` 场景下反而要走不可变。
- class 组件 `setState` 浅合并只对顶层字段成立（八），Hooks setter 整体替换。
#### 五、常见追问与回答要点
- 「为什么不推荐 mutation」官方五条：Debugging（log 不被后续改动污染）、Optimizations（比引用即可）、New Features（新特性依赖快照语义）、Requirement Changes（undo / redo 靠旧副本）、Simpler Implementation（React 不劫持属性）。
- 「Immer 原理与代价」：`produce(base, draft => {…})`，draft 是记录改动的 Proxy，产出结构共享的新对象；代价是一次 Proxy 遍历与额外依赖；RTK `createSlice` 内置，Zustand 需 `immer` 中间件；本项目未安装、只写注释示例。
- 「展开是深拷贝吗」：不是，一层；`structuredClone` 是深拷贝但通常没必要（结构共享才是目标）。
- 「sort 为什么危险」：原地排序污染旧快照，且 `[...arr]` 后再 sort 才是新引用；ES2023 `toSorted`【较新】直接返回新数组。
- 「为什么 Vue 不需要这套」：Proxy 写入时就知道变了；但 Vue 用 `shallowRef` / Immer 时同样要不可变。
#### 六、易错点
- `items.push(x); setItems(items)`：同引用不渲染；`arr.sort(); set([...arr])`：旧快照被改、memo 子组件对不上。
- `state.user.name = 'x'; setState({...state})`：会渲染但子对象仍是原引用，memo 行不更新、上一帧数据被污染。
- 嵌套只拷一层：`{...order, items: order.items}` 后改 `items[0].quantity` 仍是 mutate。
- 在更新函数里 `ref.current++` / 生成随机 id：StrictMode 双调导致跳号。
- 过度拷贝：每次 `structuredClone` 整棵树，结构共享全丢，memo 全失效。
- 措辞：统一「三大 / 五种」数量；「最根本的分歧」改为「两种变更检测模型」。
#### 七、生产环境注意
- 演示简化：id 用 `useRef` 自增、`amount` 不联动；生产 id 来自服务端或 `crypto.randomUUID()`，合计用渲染时派生（09）。
- TS：state 类型加 `readonly` / `ReadonlyArray<T>`，`push` / `sort` 直接编译报错；服务端 DTO 与 UI 草稿类型分开。
- 从 API 拿到的数据不要在 state 里原地 `sort` / `reverse`；排序 / 筛选在渲染时算或 useMemo（17）。
- lint：启用 eslint-plugin-react-hooks 7 `recommended`（`immutability` / `purity` 默认 error）；本项目 eslint.config.js 只开了 `rules-of-hooks` / `exhaustive-deps`，反例代码现状不会被拦。
- 嵌套 ≥ 3 层或列表内对象频繁局部更新：归一化或引入 Immer，不要手写多层展开。
- `toSorted` 等需 tsconfig `lib` 含 ES2023（本项目为 ES2022）；目标浏览器 Baseline 2023-07。
#### 八、旧写法对照【旧写法】
- class 组件 `this.setState({ a })`：「it will be shallowly merged into this.state」——只合并顶层，`setState({ nested: {...} })` 仍要自己拷嵌套层；Hooks setter 整体替换；16.8 起函数组件为主线。
- 老代码常见 `Object.assign({}, state, patch)` 与 lodash `cloneDeep` 后整体 set：语义正确但丢结构共享，读懂即可，新代码用展开 / map。
#### 九、新动向【尝鲜】
- React Compiler 1.0【较新】：以不可变为前提自动记忆化；lint `react-hooks/immutability` 「Validates against mutating props, state, and other values that are immutable」。
- ES2023 `toSorted` / `toReversed` / `toSpliced` / `with`【较新】：非破坏数组方法，Baseline 2023-07。
- Vue 3.6 rc【尝鲜】：alien-signals 重构响应式、Vapor Mode 属性级更新；对本题结论无影响。
#### 十、动手练习
- 练习 1：加「按单价排序」按钮，先用 `prev.items.sort()` 写错，再改成 `[...prev.items].sort()` / `toSorted`。可断言结论：错误写法点击后原 state 数组顺序被改（引用不变），memo 包裹的行不重渲染；正确写法 `prev.items !== next.items` 且未改动的 item 引用相等。
- 练习 2：把 `OrderItem` 行用 `memo` 包裹并计数渲染次数，点「数量 +1」。可断言结论：只有被改的那一行重渲染，其余行 props 引用相等、渲染计数不变。
#### 参考
- https://react.dev/learn/updating-objects-in-state；https://react.dev/learn/updating-arrays-in-state（React 19.3 站点，2026-09-17）
- https://react.dev/reference/react/useState；https://react.dev/learn/keeping-components-pure（2026-09-17）
- https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability（7.1.1，2026-09-17）
- https://react.dev/reference/react/Component#setstate（旧写法，2026-09-17）
- https://vuejs.org/guide/essentials/reactivity-fundamentals.html；https://vuejs.org/guide/extras/reactivity-in-depth.html（Vue 3.5，2026-09-17）
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted（③ MDN，2026-09-17）

### 22. 综合：订单管理页

#### 一、30 秒面试速答
- 按 Thinking in React 拆：OrderFilters / OrderTable / OrderRow / Pagination；keyword / status / page 放最近共同父组件，行内编辑草稿留在行里，反向数据流靠 callback props。
- 最小 state 只有请求参数 + 请求状态；筛选后列表、总页数、是否为空都是派生值；筛选与页码进 URL，刷新 / 分享 / 后退可复现，切筛选时重置 page=1。
- 请求状态用判别联合（status），每次请求作废上一次（AbortController 或 ignore 标志），翻页保留上一页数据避免闪烁。
- 每个变更操作三件套：禁用重复提交、失败回滚 + 提示、成功后失效重取（或不可变局部更新）；删除走可访问的确认对话框。
- 生产上服务端状态交给 TanStack Query 或路由 loader / action，组件里只剩 UI state；表格语义、aria-live、后端校验归属不是可选项。
#### 二、核心概念（React）
- Thinking in React 五步落到本页：拆层级 → 先做静态版（props 单向流）→ 三问找最小 state（不变的 / 父传的 / 可算的都不是 state）→ 归属到最近共同父组件 → 反向数据流（onSaved / onDeleted）。
- 状态结构：列表 ListState 判别联合（loading / success / error，empty 由 success 派生）；行级四个布尔收敛为 rowStatus 枚举，避免矛盾态；选中项存 id 不存对象；不镜像 props 到 state。
- 数据获取主线 effect 手写（现状：deps [keyword, status, page, reloadFlag] + AbortController cleanup + reloadFlag 计数器；官方列出四缺点，教学用，生产改写见七）
  - 并排（若 D2-2 选 B 则互换）：TanStack useQuery({ queryKey: ['orders', { q, status, page }] }) + placeholderData: keepPreviousData【主流】（→ 30）
  - 并排：路由 loader({ request }) 读 new URL(request.url).searchParams，action / useFetcher 自动 revalidate【主流】，React Router 7 Data 模式（→ 18）；use(promise) + Suspense【较新】只作引用，需缓存 promise（→ 32）
- URL 状态：useSearchParams 函数式更新在旧参数上改、切筛选 page=1、输入类 { replace: true }；并排的 loader 写法里 URL 是唯一真相，组件不再持有 keyword / status / page（→ 18）。
- 分页与旧数据：手写版在 loading 时保留上一页 data + isFetching 标记；库版 placeholderData: keepPreviousData + isPlaceholderData；翻页时不要卸载表格。
- 变更后的列表同步：主线成功后不可变局部更新（现状 handleSaved，与筛选不一致时留在原地）
  - 并排：失效重取（TanStack invalidateQueries / loader revalidate）；乐观更新（TanStack onMutate 快照回滚 / variables，React 19 useOptimistic → 31）
- 错误分层：请求失败 = 数据状态 + 重试按钮；渲染崩溃 = 行级 / 页级 Error Boundary，resetKeys 随筛选变化重置（→ 20）。
- 列表 key 用 order.id；key 变化即重置该行编辑态；更新用不可变 map / filter（→ 06 / 21）。
#### 三、Vue 对照
- 单向数据流 state / view / actions；Vue 版把 load() 当普通函数命令式调用，React 版靠依赖变化驱动——同一页面两种触发哲学。
- 请求驱动：watch(() => route.query, load)（或 watch(statusFilter)）+ onWatcherCleanup（3.5）取消上一次，替代模块级 controller 变量；onUnmounted 兜底仍需要。
- 更新模型：响应式代理允许 s.orders[index] = saved 原地改；React 必须 map 出新数组。
- OrderRow：defineProps / defineEmits ↔ props + callback props；v-model 在 type="number" 上自动应用 .number（解析失败回退原字符串）。
- 生产同构：@tanstack/vue-query 与 React 侧同参数；vue-router 核心无 action 概念，vue-router/experimental 数据加载器【尝鲜】可对照 loader。
#### 四、关键区别
- 触发哲学：依赖驱动（React effect deps / TanStack queryKey / loader 按 URL）vs 显式调用（Vue load()）——适用 React 19.2 + react-router 7 Data 模式。
- 更新模型：不可变（React 任意版本）vs 响应式代理原地改（Vue 3）；两边「业务逻辑相同」只在状态机与二次确认层面成立，行级状态建模与竞态处理并不一样。
- 渲染前取数（loader，导航前 await）vs 渲染后取数（effect / useQuery，提交后再请求）：前者无闪烁但阻塞导航，后者需要 pending UI。
- StrictMode（开发期，React 18+）effect 多跑一轮 setup + cleanup，AbortController cleanup 保证第一次请求不写入；Vue 无此现象。
- 表单主线差异：React 受控 + 手写 submitting（现状）vs React 19 Actions（pending 由 useActionState / useFormStatus 提供）vs Vue v-model + 手写 saving。
#### 五、常见追问与回答要点
- 为什么切筛选要重置页码？旧页码可能超出新结果的总页数。
- 为什么搜同一个词还要 reloadFlag？state 不变 effect 不重跑——这是 effect 手写的固有代价，TanStack refetch / loader revalidate 没有这个问题。
- 翻页为什么闪？每页当成全新请求且清空了旧数据；解法是保留旧数据或 keepPreviousData。
- 删除本页最后一条怎么处理？不在第 1 页时回退一页，否则原地刷新。
- 局部更新后与筛选不一致怎么办？要么接受留在原地，要么改成失效重取。
- 为什么服务端数据不放 Zustand / Pinia？它有缓存 key、过期、失效重取这些语义，store 没有（→ 30）。
- form 里的 button 为什么要 type="button"？默认是 submit，会误触发搜索。
#### 六、易错点
- 行级多个布尔组合出矛盾态（saving 与 deleting 同时为真）；用 status 枚举。
- 竞态：慢响应覆盖快响应；cleanup 里 abort 或 ignore。
- effect 内同步 setState → eslint-plugin-react-hooks 7 recommended 的 set-state-in-effect 会报错；改法：初始 state 直接 loading，或把请求交给库。
- 把筛选后的列表 / totalPages 存进 state（冗余）。
- loading 时把输入框 disabled → 键盘焦点丢失。
- 确认删除只换按钮文案，无焦点管理与 role。
- 用 index 作 key，删除后编辑草稿串行。
- 类型断言 e.target.value as OrderStatus | 'all' 绕过校验；用类型谓词或映射表。
#### 七、生产环境注意
- 本课简化清单：effect 手写无缓存、每次请求清空旧数据、随机 15% 失败无退避、二次确认非对话框、无 URL 同步、无 a11y、无错误边界、mockApi 无鉴权。
- 主线 effect 手写保留（教学用），生产按三种写法改写：
  - 并排（若 D2-2 选 B 则与主线互换）：TanStack Query v5【主流】—— useQuery 分页 + keepPreviousData；useMutation 编辑 / 删除，onSuccess 里 invalidateQueries(['orders'])；乐观更新用 onMutate 或 variables；服务端状态不进 store（→ 30）。
  - 并排：路由 Data 模式【主流】，react-router 7 —— loader({ request }) 读 searchParams；action 处理编辑 / 删除，官方原文「When the action completes, all loader data on the page is revalidated」；行级用 useFetcher（fetcher.state 作 pending、fetcher.formData 作乐观值）；全局用 useNavigation；shouldRevalidate 收敛重取（→ 18）。
  - 并排：React 19 Actions【主流】，19.0 起 —— <form action> + useActionState（pending / 返回错误）+ useFormStatus（子按钮）+ useOptimistic（删除即隐藏）；async startTransition 里调用 mutation（→ 31）。
- 可访问性：table 用 th scope="col"、搜索区 role="search"、结果数与错误用 aria-live、分页当前页 aria-current="page"、行按钮 aria-label="删除订单 SO-2026-0002"、删除确认 role="dialog" + aria-modal + 焦点回到触发按钮（→ 35）。
- 安全：搜索词 / 备注只作文本渲染；删除 / 编辑接口后端按当前用户过滤，前端只传 id 且权限判断只是 UX（→ 35）。
- 性能：搜索输入防抖或 useDeferredValue，筛选切换 startTransition，大表格虚拟化（→ 14 / 17 / 32）。
- 错误分层：请求错误进状态 + 重试；渲染错误进行级 Error Boundary（resetKeys）（→ 20）。
#### 八、旧写法对照【旧写法】
- componentDidMount / 裸 useEffect 拉数无取消（React 18 起 StrictMode 双跑会暴露）；本课的 effect 手写版（带取消）是主线，不进本段；若 D2-2 选 B 迁到 TanStack，再整体标「基础写法」放这里。
- 从 react-router-dom 导入（v7 起改 react-router，v8 删除 react-router-dom）。
- useFormState → useActionState（React 19.0 改名）。
- 手写 isSubmitting / isDeleting 布尔而非 status 判别联合；selectedOrder 整对象入 state 而非 selectedId。
- TanStack v4 的 keepPreviousData: true → v5 placeholderData: keepPreviousData（→ 30）。
#### 九、新动向【尝鲜】
- vue-router 5 的 vue-router/experimental 数据加载器：与 React Router loader 对照，仅作介绍。
- React 19.3 <ViewTransition> 可用于翻页 / 筛选切换动画，不进主线。
- react-router v8 middleware 默认开启，权限拦截可从 loader 移到 middleware（→ 18）。
#### 十、动手练习
- 练习 1：把 keyword / status / page 搬进 URL query（函数式 setSearchParams）。可断言结论：切换筛选后 URL 含 page=1，且下一次请求参数 page 为 1。
- 练习 2：翻页时保留上一页数据（ListState 的 loading 分支带上 previous）。可断言结论：快速连点两次「下一页」只渲染最后一次请求的数据，且期间表格元素不消失。
- 可断言结论：删除失败时该行仍在且显示错误文案；保存进行中「保存」按钮 disabled 为 true。
#### 参考
- https://react.dev/learn/thinking-in-react（19.3 站点，2026-09-17）
- https://react.dev/learn/reacting-to-input-with-state（19.3 站点，2026-09-17）
- https://react.dev/learn/choosing-the-state-structure（19.3 站点，2026-09-17）
- https://react.dev/reference/react/useEffect#what-are-good-alternatives-to-data-fetching-in-effects（19.3 站点，2026-09-17）
- https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（eslint-plugin-react-hooks 7，2026-09-17）
- https://reactrouter.com/7.18.4/start/data/actions（v7.18.4，2026-09-17）
- https://reactrouter.com/7.18.4/start/data/route-object（v7.18.4，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates（v5，2026-09-17）
- https://vuejs.org/guide/scaling-up/state-management.html（3.5，2026-09-17）
- https://vuejs.org/guide/essentials/forms.html（3.5，2026-09-17）
- https://vuejs.org/guide/best-practices/accessibility.html（3.5，2026-09-17）

### 23. 渲染模型与 state 快照

#### 一、30 秒面试速答
- 一次更新分三步：Trigger（初始渲染或 setState）→ Render（React 调用组件函数，递归向下）→ Commit（只把有差异的 DOM 节点写进去），之后浏览器 paint【主流】。
- 「渲染」就是调用你的函数：每次渲染都有自己的 props、state、局部变量和事件处理器，state 在一次渲染内永不变，setter 只是请求下一次渲染【主流】。
- 过去创建的回调（setTimeout、监听器）读到的是创建时那一帧的快照；要最新值用函数式更新、ref 或 useEffectEvent（26）【主流】。
- 渲染必须是纯函数：不改渲染前已存在的东西、同输入同输出；StrictMode 开发期把组件体和初始化 / 更新函数调两次来暴露不纯，生产无影响【主流】。
- state 绑定在渲染树的位置上：同位置同组件保留，换类型、换位置或换 key 才重置【主流】。
#### 二、核心概念（React）
- 三阶段：Render 阶段 React 调用组件并递归子组件，得到新 JSX；Commit 阶段与上次比较，「React only changes the DOM nodes if there's a difference between renders」；区块一保留，加一段 DOM 不变的观察（用 DevTools 高亮）。
- 快照：state 存在 React 内部（「as if on a shelf」），每次调用 useState 拿到该次渲染的快照；区块二 / 四保留（setter 不改局部变量、props 也是快照）。
- 直接改变量无效（区块三保留）：没有 setter 就没有新渲染；改 state 里的对象同理（21）。
- 纯函数两条件：「It minds its own business」（不改渲染前已存在的对象 / 变量）、「Same inputs, same output」；props / state / context 只读；渲染中刚创建的对象可以改（local mutation）。
- 副作用去处：事件处理器不在渲染期运行、不必纯；useEffect 是 last resort（10）。
- StrictMode 开发期四条：组件多渲染一次、Effect 多跑一次（setup → cleanup → setup）、ref 回调多跑一次（19 起）、检查废弃 API；双调对象是组件体顶层逻辑、传给 useState / set / useMemo / useReducer 的函数。
- 重渲染范围：从触发组件递归向下，默认不看子组件 props；`Object.is` 相等的 setState 跳过（可能仍调一次组件再跳过子树）；memo / Compiler 才按 props 跳过（17）。
- state 归属：同位置同组件保留，不同组件或换 key 重置；不要在组件函数体内定义组件（每次渲染都是新类型）；路由 /orders/o1 → /orders/o2 同组件实例复用，用 `key={id}` 或写对依赖（18）。
#### 三、Vue 对照
- 一次渲染 = 整个组件函数重跑 ↔ `<script setup>` 只跑一次；「Mount … is performed as a reactive effect」「When a dependency used during mount changes, the effect re-runs」（Render Pipeline 逐字）。
- 依赖追踪精确到组件：「each component instance creates a reactive effect to render and update the DOM」；不是属性级 DOM 更新，Vapor Mode（3.6 rc）才是。
- 原理写准：`reactive` 用 Proxy，`ref` 用 getter/setter（3.5 现行写法，逐字）；两者都是「长期存活的容器」而非快照。
- 快照 ↔ 无快照：`count.value` 现读现取；props 是响应式对象，异步回调里读到最新值；只有手动拷贝的普通值才过期（Vue 区块四保留）。
- 纯函数 ↔ 模板 / computed / onUpdated 里不得改被渲染的状态（会死循环）；但 reactive 状态本身可原地改（21）。
- StrictMode ↔ 无对应物（setup 不重跑，没有渲染纯度要暴露）；调试钩子 `onRenderTracked` / `onRenderTriggered`。
- state 绑定位置 ↔ 同样依赖 vnode 位置与 `key`；`<component :is>` / `v-if` 切换销毁实例；`<RouterView :key>` 或 watch params 处理路由复用。
#### 四、关键区别
- React 19.2 函数组件：闭包每帧重建 → 快照；Vue 3.5：setup 闭包只建一次 → 永远读最新；class 组件（八）与 Vue 更像。
- 重渲染范围：React 不启用 Compiler 时父组件带动整棵子树；Vue 只重跑读了该状态的组件的 render effect。
- 「改了不更新」两边都有，原因不同：React 是「没有 setter」，Vue 是「脱离依赖追踪」（区块三保留）。
- StrictMode 双调只在开发期且只对应纯函数；Vue 无此机制。
#### 五、常见追问与回答要点
- 「重渲染一定改 DOM 吗」：不一定，Commit 只写差异；「渲染很贵吗」：Render 是纯计算，DOM 写入才贵。
- 「setState 同步还是异步」：调用同步、生效在下一次渲染；用快照解释比「异步」准确；批处理见 24。
- 「怎么拿最新值」：函数式更新（依赖旧值算新值）、ref（读最新做别的事）、useEffectEvent【较新】（26）。
- 「StrictMode 双渲染会影响生产吗」：不会；出现两次不同结果说明渲染不纯，修代码而不是关 StrictMode。
- 「子组件什么时候不重渲染」：`Object.is` 相等的 setState、memo 且 props 浅相等、Compiler 自动记忆化。
- 「state 什么时候被重置」：位置变 / 类型变 / key 变；同位置同类型即使 props 全变也保留。
#### 六、易错点
- 在组件内定义子组件 → 每次渲染新类型 → 子树 state 全重置（lint `static-components`）。
- 渲染期读写 `ref.current`、改外部变量、无条件 setState（Too many re-renders）。
- 初始化函数里 `Math.random()` / 发请求：StrictMode 下结果被丢弃一次、请求发两次，是代码不纯不是 React 的 bug。
- 用 index 当 key 只在「只追加不重排」时可接受（区块日志），其余按 06。
- 措辞：删「（没有一一对应关系）」；「Vue 根本没有」改为「Vue 的 setup 闭包不重建，所以没有快照概念」。
#### 七、生产环境注意
- 演示简化：函数体里的 console.log 只为观察渲染，StrictMode 下翻倍；生产量重渲染用 React DevTools Profiler（17），上线前删掉渲染期日志。
- 依赖「渲染两次结果不同」的代码一律视为 bug（生成 id、发请求、写全局），不是关 StrictMode 就完事。
- 路由页面按 `key={params.id}` 或正确的 effect 依赖处理实例复用；切换 id 必须能重置草稿状态。
- 需要最新值的异步回调用函数式更新或 ref，不要拉长依赖数组硬凑（26）。
- lint：启用 eslint-plugin-react-hooks 7 `recommended`（`purity`、`refs`、`set-state-in-render`、`static-components` 默认 error）；本项目目前只开了 2 条规则。
#### 八、旧写法对照【旧写法】
- class 组件 `this.state` 是可变实例字段，事件处理器 / setTimeout 里读到的是最新值而非快照；但 `this.setState` 后立刻读仍是旧值（官方 Pitfall 逐字「Calling setState does not change the current state in the already executing code」）；16.8 起函数组件为主线，官方「we don't recommend using them in new code」。
- StrictMode 双调的 class 侧对象：constructor、render、shouldComponentUpdate（官方清单）。
- `ReactDOM.render` 19 起移除，改 `createRoot`（facts B）；与本题的关系只是「入口」，不展开。
#### 九、新动向【尝鲜】
- React Compiler 1.0【较新】：以「渲染纯、state 不可变」为前提自动记忆化，违反规则的组件被跳过编译；本项目不启用，原理归 17。
- React 19.3【尝鲜】：StrictMode 在 hydration 时也双调 Effects；Transitions 独立渲染不再互相纠缠（未安装，2026-09-09 发布）。
- Vue 3.6 rc【尝鲜】：Vapor Mode 绕过 vdom，更新粒度细于组件。
#### 十、动手练习
- 练习 1：把 `Summary` 改成在 `Example` 函数体内定义，点「+1」观察 Summary 内新增的一个 `useState` 是否每次归零。可断言结论：组件内定义的子组件每次父渲染都重新挂载，其 state 重置为初始值。
- 练习 2：给 `useState(0)` 换成 `useState(() => { console.count('init'); return 0 })`。可断言结论：开发期 StrictMode 下 `init` 计数为 2、生产构建为 1，后续点击不再增加。
#### 参考
- https://react.dev/learn/render-and-commit；https://react.dev/learn/state-as-a-snapshot（React 19.3 站点，2026-09-17）
- https://react.dev/learn/keeping-components-pure；https://react.dev/learn/preserving-and-resetting-state（2026-09-17）
- https://react.dev/reference/react/StrictMode；https://react.dev/reference/react/useState（2026-09-17）
- https://react.dev/reference/react/Component（旧写法，2026-09-17）
- https://react.dev/reference/eslint-plugin-react-hooks（7.1.1，2026-09-17）
- https://vuejs.org/guide/extras/rendering-mechanism.html；https://vuejs.org/guide/extras/reactivity-in-depth.html（Vue 3.5，2026-09-17）

### 24. State batching 与函数式更新

#### 一、30 秒面试速答
- setter 不改本次渲染的 state，只往队列排一条更新；事件处理器跑完 React 才按序处理队列、渲染一次 —— 这就是批处理【主流】
- 队列规则：传值 = 「替换成 X」并丢弃前面结果；传函数 = 拿前一条的结果算新值；`setN(n+5); setN(n=>n+1); setN(42)` 最终 42【主流】
- React 18 起 createRoot 下 setTimeout / Promise / 原生事件里的更新也自动批处理；不跨事件批处理【主流】
- 「set 后 log 旧值」是快照（闭包）造成，不是批处理；批处理决定渲染几次，快照决定读到什么【主流】
- flushSync（react-dom）逼 React 同步渲染并提交，回调返回时 DOM 已更新；只用于必须马上读 DOM 的集成场景，是 last resort【主流】
#### 二、核心概念（React）
- 更新队列：保留区块一的 applyQueue 模拟器与 A / B / C / D 四个队列，预测值与实际值对照
- 批处理三句：同一事件合并成一次提交；不跨事件（两次点击各自渲染）；批处理生效时中间状态不上屏
- 自动批处理前提：createRoot；覆盖 timeouts、promises、原生事件监听等任意来源
- 必须函数式更新的判定：由旧算新 + 手里的旧值可能过期（同一事件多次 / 异步回调 / 脱离当前渲染复用 / 自定义 Hook 暴露）；反例 `setOpen(true)`
- updater 纯函数、StrictMode 双调；命名 `prev` / 首字母 / 全名
- `Object.is` 相同值跳过渲染；set 函数身份稳定可省出依赖；useReducer 的 dispatch 同规则（→ 29）
- flushSync：签名 `flushSync<R>(fn: () => R): R`；代价四条（显著伤性能、可能触发 Suspense fallback、可能同步跑 pending Effects、可能把回调外更新一起刷）
- 快照 vs 批处理：flushSync 后 DOM 新了，但处理器闭包里的 count 仍是旧快照
#### 三、Vue 对照
- Vue 把同一 tick 内的改动缓冲到 next tick 只刷新一次，不分事件来源；批的是渲染 / DOM，不是数据（响应式调度，不是更新队列）
- `count.value++` 连写真加 2、改完立刻可读；无更新队列、无函数式更新对应物（ref 是可变容器不是快照）
- `await nextTick()`「等它刷完」 vs flushSync「逼它现在刷」；Vue 没有强制同步刷新的公开 API
- Vue 里唯一会过期的是手动拷进普通变量的 `.value` 快照（保留区块三反例）
- Pinia `$patch` 一次改多字段、`$subscribe` 只触发一次 → 16 一句
#### 四、关键区别
- React 批的是 state 更新（数据层，处理器内是冻结快照）；Vue 批的是 DOM 刷新（数据立即可读）—— 适用 React 18+ createRoot / Vue 3
- 「读旧值」：React 是快照造成，与批处理无关（17 不批处理时同样旧）；Vue 只在手动拷贝快照时出现
- 「改完读 DOM 旧」：两边都延后；修法方向相反（flushSync vs nextTick）
- 批处理边界：React 不跨事件；Vue 同一 tick 内不分来源；两边都没有「跨 tick / 跨事件合并」
#### 五、常见追问与回答要点
- 18 改了什么、为何要 createRoot：legacy `ReactDOM.render` 保持 17 行为，19 已移除 render
- onClick 三次 set 渲染几次 / setTimeout / await 之后：18+ 全是 1 次；17 事件里 1 次、异步里各 1 次
- flushSync 能否让 set 后读到新 state：不能，只保证 DOM 已提交；读新值靠下一次渲染或 updater
- `setCount(0)` 连点会渲染吗：Object.is 相同则跳过（可能仍调一次组件函数但不提交）
- dispatch 多次渲染几次：同 setState 入队批处理（→ 29）
- startTransition 里的更新：与紧急更新分开批 / 分开渲染（→ 32）
#### 六、易错点
- 把「处理器里读旧值」归因于批处理（现 :256-257 需改写）
- 值与 updater 混用时忘了「值会丢弃前面的累计结果」
- updater 里发请求 / 写 ref / dispatch：StrictMode 双调会做两遍
- 用 flushSync「修」读旧 state；flushSync 可能触发 Suspense fallback、同步跑 pending Effects
- 异步回调里要读最新值做别的事（发请求、判断）时 updater 帮不上忙 → latest ref / useEffectEvent（26）
#### 七、生产环境注意
- 演示简化：区块二探针 effect 同步 setState（:281-284）命中 `react-hooks/set-state-in-effect`（recommended 预设 error）；加 eslint-disable 并注明「探针专用」，或改 ref 计数 + 渲染期读取
- 演示简化：只追加日志用 index 作 key（已注明例外）；useTimeouts 自动清理是纪律示范不是库
- 生产：凡由旧算新一律 updater；flushSync 只用于打印 / 滚动到新插入行 / 第三方测量；升级 18 第一步换 createRoot
- 更新函数不做副作用；副作用放事件处理器或 effect
#### 八、旧写法对照【旧写法】
- React 17 及以前：只在 React 事件里批；setTimeout / fetch().then / 原生事件里每次 setState 各渲染一次 —— 18.0（2022-03）起随 createRoot 变化
- React 18 + `ReactDOM.render`（legacy root）：行为同 17；19 已移除 `ReactDOM.render`
- `ReactDOM.unstable_batchedUpdates(fn)`：17 时代库在非事件回调里手动批处理；18 起不再需要（19.2.8 仍导出，react-dom.development.js:410）
#### 九、新动向【尝鲜】
- 19.3：Transitions 独立渲染「不再纠缠」；`<ViewTransition>` 与 startTransition 联动（主责 32，本题一句）
#### 十、动手练习
- 练习 1：区块一加按钮 E `setCount(c => c + 1); setCount(count + 1)`，先预测再验证。可断言结论：同一事件里先 `setCount(c => c + 1)` 再 `setCount(count + 1)`，最终 count 等于点击前 count + 1（值更新丢弃前面结果）
- 练习 2：把区块二探针改成 ref 计数 + 渲染期读取，使其通过 `set-state-in-effect`。可断言结论：同一事件里两次 setState 只触发一次提交；用 flushSync 拆开后为两次
- 可断言结论：flushSync 回调返回后 DOM 文本已是新值，但同一处理器闭包里的 count 仍是旧值
#### 参考
- https://react.dev/learn/queueing-a-series-of-state-updates（React 19.3 站点，2026-09-17）
- https://react.dev/learn/state-as-a-snapshot（2026-09-17）
- https://react.dev/reference/react/useState（2026-09-17）
- https://react.dev/reference/react-dom/flushSync（2026-09-17）
- https://react.dev/blog/2022/03/08/react-18-upgrade-guide（2026-09-17）
- https://github.com/reactwg/react-18/discussions/21（③ WG 讨论，2026-09-17）
- https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect（eslint-plugin-react-hooks 7，2026-09-17）
- https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing（Vue 3.5，2026-09-17）
- https://pinia.vuejs.org/core-concepts/state.html（Pinia 3，2026-09-17）

### 25. 状态提升与 state 归属

#### 一、30 秒面试速答
- 每份 state 只有一个 owner；兄弟要共享就提升到最近公共父组件，父传 props 下去、传 setter 回调下去。
- 判断什么是 state：随时间会变、不是 props 传来、不能算出来——三问都过才是 state。
- 提升到「刚好够用」那一层；只有自己关心的 UI 瞬态留在子组件；跨页面 / 跨子树才上 store。
- 不要 `useState(props.x)` 镜像 props；确需初始值用 `initialX` 命名并接受不同步，切换实体用 `key` 重置。
- 用 Context 之前先试 props 和「传 JSX 作 children」的组合。
#### 二、核心概念（React）
- 定义与三步法：移除子组件 state → 父先传硬编码值 → 父加 state 并连同处理器传下
- 单一数据源与 owner：谁拥有谁 setState；setter 引用稳定可直接当 onChange 传
- Thinking in React 步骤 3–5：三问判断 state；找所有用到它的组件 → 最近公共父 → 必要时新建组件专门持有；反向数据流
- 受控 / 非受控组件（组件级）：受控 = 完全由 props 驱动（灵活、父要全配）；非受控 = 自持 local state（易用、难协调）；实际是混合
- 何时留子组件：只有本组件及后代用的瞬态（展开 / hover / 草稿）；何时提升：兄弟共读或共写
- state 结构：合并总一起变的；选中态存 id；不镜像 props
- 提升后的重置：state 生命周期随 owner；切换实体用 `key`（→06）；不要 effect 里 `setValue('')`
- 代价与阶梯：父重渲染范围扩大、prop drilling → 先 props → children 组合（→13）→ Context（→15）→ store（→16）
#### 三、Vue 对照
- props down / emit up；「the child should emit an event to let the parent perform the mutation」
- `defineModel()`（3.4+）= `modelValue` + `update:modelValue`，是 `value + onChange` 的语法糖（→07）
- 「新建组件持有 state」↔ composable 持有 `ref`，或模块级 `reactive` store
- 阶梯对应：children ↔ slots；Context ↔ provide/inject；Zustand ↔ Pinia
- `ref(props.x)` 断联 ↔ `useState(props.x)`；变换用 `computed`
- `:key` 重置子树同理；watch `flush: 'pre'` 不多渲染一轮但「两份真相源」问题相同
#### 四、关键区别
- 设计判断层两框架一致（组件化通用规则）；机制层不同：React 19.2 回调 prop vs Vue 3.5 emit / defineModel
- 「镜像 props」在 React 更易踩：`useState(props.x)` 看似初始化实为只读一次；Vue 直接读 `props.x` 永远新鲜、只有主动 `ref(props.x)` 才断
- Effect 同步副本：React 多渲染一轮；Vue watch pre-flush 不多一轮——结论相同
- 共享状态可脱离组件：Vue 响应式对象可模块级存在；React state 必须挂在组件或外部 store
#### 五、常见追问与回答要点
- 「提升后父组件每次都重渲染怎么办？」→ 把读 state 的部分拆小组件、children 组合让无关子树不随之渲染、必要时 memo（→17）
- 「context 之前先试哪两招？」→ 传 props；抽组件传 JSX 作 children
- 「Accordion 受控 / 非受控？」→ `isActive` 由父传 + `onShow` 为受控；自持 `isActive` 为非受控
- 「切换订单输入框没清空？」→ 换 `key`；不要 effect 清空
- 「selectedItem 存对象？」→ 存 id，渲染期 find（→09）
#### 六、易错点
- `useState(props.x)` + `useEffect` 同步（lint `set-state-in-effect`）
- 提升「越高越好」→ 父变胖、整棵子树重渲染
- 为省 props 直接上全局 store
- Context value 同时放 state + setter → 只写组件也重渲染（→15）
- Vue：解构 props 丢响应（用 3.5 响应式 props 解构或 `toRefs`）
#### 七、生产环境注意
- 演示简化：keyword / category 放本地 state；真实列表页筛选 / 分页 / 选中 id 放 URL（→18），服务端数据放 Query（→30），只有草稿 / 弹窗开关留本地
- 高层 state 的重渲染范围：拆组件 + children 组合 + memo
- 拆 state / dispatch 两个 context（→15 / 29）
- 需要持久化 / devtools / 跨页面 → store（→16）
#### 八、旧写法对照【旧写法】
- HOC `withX(Component)` / render props 共享状态：16.8 起由自定义 Hook + 提升 / Context 取代（→14）
- 类组件 `forwardRef` 提升命令式句柄：19.0 起 `ref` 作普通 prop（→12 / 02）
- Vue 2 `.sync` 修饰符 → Vue 3 `v-model:xxx`；`defineModel` 3.4 起
#### 九、新动向【尝鲜】
- 无本题专属【尝鲜】项；Vue 3.5 响应式 props 解构【较新】（→02）
#### 十、动手练习
- 练习 1：把 `expanded` 提升到 Example 并用 Profiler 观察。可断言结论：点「更多」后 SearchBar / ResultSummary 也重渲染（提升前不会）。
- 练习 2：给 ProductListWithOwnCopy 加 `key={keyword}`。可断言结论：父组件 keyword 变化后 `outOfSync` 恒为 false（子组件被重挂载重新拷贝）。
#### 参考
- https://react.dev/learn/sharing-state-between-components（2026-09-17）
- https://react.dev/learn/thinking-in-react（2026-09-17）
- https://react.dev/learn/passing-data-deeply-with-context（2026-09-17）
- https://react.dev/learn/preserving-and-resetting-state（2026-09-17）
- https://react.dev/learn/choosing-the-state-structure（2026-09-17）
- https://vuejs.org/guide/components/props.html#one-way-data-flow（Vue 3.5，2026-09-17）
- https://vuejs.org/guide/scaling-up/state-management.html（2026-09-17）

### 26. 过期闭包（stale closure）

#### 一、30 秒面试速答
- 过期闭包 = 闭包活得比创建它的那次渲染长：state 是渲染快照，交给 setTimeout / addEventListener / setInterval / Promise 的回调读到的是创建那一帧的值【主流】
- 修法优先级：由旧算新 → 函数式更新；愿意重建外部资源 → 写对依赖；要读最新值又不想重跑 Effect → `useEffectEvent`（19.2 起）；仍在 18 或在 Effect 之外 → latest ref（社区惯用法）【主流】【较新】
- `useEffectEvent` 四条限制：只在 Effect 内调用、不传给组件 / Hook、无稳定身份不进依赖数组、不是逃避依赖的工具；lint 需 eslint-plugin-react-hooks 7（本项目 7.1.1）【较新】
- `exhaustive-deps` 就是过期闭包探测器；禁用它是对 React 撒谎、隐藏 bug【主流】
- Vue：setup 只跑一次、`.value` 现读现取，没有这道选择题；但解构 reactive / 手动拷值同样会「过期」【主流】
#### 二、核心概念（React）
- 根因：一次渲染内 state 变量的值不变；过去创建的事件处理器持有创建它那次渲染的 state
- 四个现场：事件处理器里的 setTimeout（无 Effect）、`[]` Effect 里的 setInterval、手动 addEventListener / SDK 回调、同一 handler 多次 `setAge(age + 1)`（→ 24）
- 依赖数组决定闭包重建时机：`[]` 锁定挂载帧；`[count]` 每变一次 cleanup → setup 换新闭包（代价：重建外部资源）
- 修法 A 函数式更新（只解决「由旧算新」，官方：多数情况与直接 set 无差别）；修法 B 写对依赖并接受重建；修法 C 交互触发的逻辑搬进事件处理器；修法 D 拆 Effect / 对象与函数移进 Effect / 只读原始值
- 「可变值不能作依赖」：`ref.current` 写进依赖数组不触发重跑
- 修法 E `useEffectEvent`【较新，19.2 起；需 eslint-plugin-react-hooks 7】，本课主线示例：把非响应式部分抽成 Effect Event，调用时总读最新 committed 值而不重跑 Effect；四条限制；只能在同一组件 / Hook 内声明；自定义 Hook 接收回调时包一层（→ 14）；`useEffectEvent<T extends Function>(cb: T): T`；优先级排在函数式更新与写对依赖之后
  - 并排：latest ref（社区惯用法，react.dev 无推荐语，React 18 项目仍需要）—— Effect 里同步 `ref.current = value`，回调读 `.current`；适用 18 项目与「事件处理器 + 延迟回调」等 Effect 之外的场景；代价：不参与渲染、Effect 同步前有窗口
- cleanup 不是可选项：旧闭包堆积、过期定时器回写、迟到响应（alive 标志，真正取消见 27）
#### 三、Vue 对照
- `ref` 是带 getter / setter 的容器，闭包捕获容器、读时取值 ↔ React 闭包捕获本帧常量
- 官方原话「setup() 或 `<script setup>` 只调用一次……没有过期闭包需要担心」；同时承认 React 部分与记忆化相关的问题可由 Compiler 解决
- Vue 也会过期：解构 `reactive` 原始属性、3.5 前解构 props、手动 `const snapshot = x.value`——「会失去响应式连接」
- `watch(source, cb)` 只追踪显式源、回调内读其它 ref「读而不响应」↔ `useEffectEvent`；`watchEffect` 追踪一切 ↔ 写全依赖
- `count.value++` ↔ 函数式更新；`onMounted` 注册一次 + `onUnmounted` 移除 ↔ `[]` Effect + cleanup
- `exhaustive-deps` 无对应物（自动依赖收集）
#### 四、关键区别
- 执行模型：React 每次渲染重跑函数体（16.8+ 全版本）；Vue setup 只执行一次
- 修法优先级：函数式更新【主流】→ 写对依赖【主流】→ `useEffectEvent`【较新，19.2 起】；Vue 无需选择
  - 并排：latest ref（社区惯用法），仍在 18 的项目用它
- 适用边界：`useEffectEvent` 只能在 Effect 内调用——事件处理器里的延迟回调（本课区块一）仍只能靠函数式更新或并排的 latest ref；Vue 直接读 `.value`
- lint 前提：eslint-plugin-react-hooks 7.1.1 认识 `useEffectEvent`（本课 recommended 实测 0 报错）；< 6 会要求把它塞进依赖
- JSX 事件处理器 / Vue 模板事件两边都不过期（每次渲染重绑）
#### 五、常见追问与回答要点
- bug 还是设计？→ 设计：快照保证一次渲染内一致
- 函数式更新为什么让依赖消失 → 更新函数排队，React 下次渲染传入最新值，Effect 不再读 state
- `[count]` 的代价 → 每变重建监听器 / 定时器；WebSocket / 播放器 / SDK 实例不可接受
- 为什么不能传给子组件 / 没有稳定身份 → 身份每次渲染都变，不能当 `useCallback` 用、不能进依赖；稳定引用给 memo 子组件用 `useCallback`（→ 17）
- 19.2 之后还需要 latest ref 吗 → Effect 内不需要；Effect 之外的延迟回调、18 项目仍用
- `exhaustive-deps` 处理顺序 → 先看能否函数式更新 / 搬进事件 / 移进 Effect，再补依赖，最后 `useEffectEvent`；禁用 = 隐藏 bug
#### 六、易错点
- 把 Effect Event 写进依赖数组（lint 报「must not be included in the dependency array」）或传给子组件
- 用 `useEffectEvent` 逃避依赖（隐藏 bug）；把 latest ref 当「引用稳定的函数」
- 渲染期写 `ref.current = value`（应在 Effect 里）；`ref.current` 写进依赖数组
- 忘 cleanup → 监听器堆积、迟到响应写进已卸载组件
- 「函数式更新总是更好」→ 官方：多数情况无差别
- 「Vue 永远不会过期」→ 解构 reactive 就会
#### 七、生产环境注意
- 本课简化：手写 setInterval + fetch 轮询只为观察闭包；生产优先 TanStack Query `refetchInterval`（→ 30）
- 第三方 SDK / WebSocket 回调：主线用 `useEffectEvent` 包住「读最新状态」的部分（19.2 起）
  - 并排：latest ref（社区惯用法），18 项目仍需要
- 必须 eslint-plugin-react-hooks 7（本项目 7.1.1）；切换 `recommended` 后本课 0 命中
- 不把 Effect Event 传给子组件；memo 子组件需要稳定引用用 `useCallback`（→ 17）
- TS：`useEffectEvent<T extends Function>(callback: T): T`，不要给它写 deps
- 测试：fake timers 断言定时器回调读到最新值（→ 34）
#### 八、旧写法对照【旧写法】
- latest ref 不标【旧写法】：它是并排的社区惯用法（官方文档无推荐语），18 项目仍需要；19.2 起 Effect 内的场景由 `useEffectEvent` 接管，Effect 之外仍靠它
- `// eslint-disable-next-line react-hooks/exhaustive-deps` 省依赖：官方「大多数用户这样做，但会导致 bug」
- 早期提案 `useEvent` / 实验期 `experimental_useEffectEvent`（待核实 P-26-2）→ 19.2 稳定 `useEffectEvent`
#### 九、新动向【尝鲜】
- 19.3 无本题相关变更（facts-versions §B）；React Compiler 不消除过期闭包（它假设代码遵守 Rules of React，依赖仍要写对）
#### 十、动手练习
- 练习 1：把区块三坏例子改成 `useEffectEvent` 并写 fake timers 测试。可断言结论：切换 status 后下一次 tick 的请求参数等于新 status，且 `setInterval` 只被调用一次
- 练习 2：把 Effect Event 写进依赖数组再跑 lint。可断言结论：`exhaustive-deps` 报「Functions returned from useEffectEvent must not be included in the dependency array」
#### 参考
- https://react.dev/reference/react/useEffectEvent（19.3 站点，2026-09-17）
- https://react.dev/learn/separating-events-from-effects；https://react.dev/learn/removing-effect-dependencies；https://react.dev/learn/lifecycle-of-reactive-effects（2026-09-17）
- https://react.dev/learn/state-as-a-snapshot；https://react.dev/reference/react/useEffect；https://react.dev/reference/react/useState（2026-09-17）
- https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps；https://react.dev/blog/2025/10/01/react-19-2（19.2，2026-09-17）
- https://vuejs.org/guide/essentials/reactivity-fundamentals.html；https://vuejs.org/guide/essentials/watchers.html；https://vuejs.org/guide/extras/composition-api-faq.html（Vue 3.5，2026-09-17）

### 27. 异步竞态、取消与过期响应

#### 一、30 秒面试速答
- 竞态：网络响应不按发出顺序到达，先发的慢请求晚回来覆盖新结果；触发场景是依赖（id / 关键词）快速变化，UI 不报错只是数据悄悄错了【主流】
- 根治靠 Effect cleanup：要么 `let ignore = false` + cleanup 置 true 后丢弃响应，要么 `AbortController` 在 cleanup 里 `abort()` 真正取消；拿得到 signal 就 abort，拿不到就 ignore【主流】
- 取消不是失败：catch 里先判 `err.name === 'AbortError'`（或 `signal.aborted`）再 return；超时信号抛的是 TimeoutError【主流】
- 只靠 loading 布尔挡不住竞态，它只说明「有请求在飞」；切换参数时先重置 data【主流】
- 生产里把取消交给 TanStack Query（queryFn 透传 `signal`，默认不取消）或路由 loader（透传 `request.signal`）；StrictMode 双调 Effect 正是竞态探测器（React 18+）【主流】
#### 二、核心概念（React）
- 竞态定义与可复现方式：确定性延迟让「后发先至」100% 出现；用 success 里的 forKeyword 把「结果属于哪次请求」变成可核对的数据
- 修法 1 `ignore`：每轮 Effect 自己的闭包变量，cleanup 置 true；适用任何 promise，但网络与服务端计算照做
- 修法 2 `AbortController`：`fetch(url, { signal })`，cleanup 里 `abort()`；promise 以 AbortError 的 DOMException reject；fetch 已 resolve 但 body 未读完时 `response.json()` 也会 AbortError，要在同一条 catch 链里
- 两种修法可同时用：abort 释放连接，ignore 兜底不接受 signal 的库
- 过期响应 vs 过期闭包（→ 26）：前者是旧请求结果晚到（修法：取消 / 忽略），后者是回调读到旧渲染的值（修法：函数式更新 / useEffectEvent）
- 事件触发的请求没有 cleanup 可挂：handler 里持有上一个 controller 并 abort，或记请求序号只认最后一次（工程惯例，官方无专门段落）
- TanStack Query：每个 queryFn 拿到 `signal`；默认不取消（让缓存在重挂载时可用），消费 signal 才 opt-in；`queryClient.cancelQueries({ queryKey })` 手动取消；Suspense hooks 下取消不工作（→ 30）
- 路由 loader：`request.signal` 随导航中断而 abort，透传即可（→ 18）
#### 三、Vue 对照
- Effect cleanup ↔ `onWatcherCleanup(() => controller.abort())`（3.5+，官方示例正是 fetch + signal）；须在 watch 回调同步段调用，不能在 await 之后
- 3.5 前：回调第三参 `onCleanup` / `watchEffect(onCleanup => …)`【旧写法】——本课现状写法
- `ignore` 标志无内置对应物，在 watch 回调里用同样的局部变量 + onWatcherCleanup 置位；模式与框架无关
- 卸载：同步创建的 watcher 随组件停止并触发 cleanup；异步创建的不会自动停止
- `@tanstack/vue-query` 共用 query-core，queryFn 同样收到 signal
- 官方 `useFetch` composable 示例只重置 data / error、未 abort，对照时要补取消
- 重置：React 换 key 让旧实例的迟到 setState 变 no-op；Vue 手动赋初值，坏面板迟到的响应照样落地
#### 四、关键区别
- 「病」与「药」两边相同，只在挂药位置：React 挂在 Effect 返回值，Vue 挂在 onWatcherCleanup / onCleanup（Vue 3.5 / 3.4）
- 首跑：React Effect 首次渲染后必跑，需显式 `keyword === ''` 返回 idle；Vue watch 默认惰性
- StrictMode 双调只在 React 18+ 开发期；Vue 无对应机制
- 取消的归属：Effect 手写自己管；TanStack 默认不取消需 opt-in；Router loader 随导航自动 abort（Data 模式，react-router 7.x）
- 卸载后 setState：React 18 起无警告（no-op）；Vue 的 ref 长期存活，迟到的赋值会真的落地
#### 五、常见追问与回答要点
- 「开发环境两次请求算 bug 吗」：不算，StrictMode 在探测 cleanup；cleanup 写对则第一次被取消 / 丢弃
- 「abort 后怎么区分取消和真错误」：`err instanceof DOMException && err.name === 'AbortError'`；axios 用 `axios.isCancel`；超时是 TimeoutError
- 「为什么只靠 loading 不够」：loading 不记录「哪次响应有效」，两次响应都会把它置 false 并写 data；要么取消，要么记序号 / ignore
- 「TanStack 默认取消吗」：不；默认让 queryFn 跑完以填缓存；透传 signal 后卸载 / 切 key 才取消
- 「防抖、取消、useDeferredValue 各管什么」：防抖减少发出的请求（→ 14）；取消 / 忽略处理已发出的响应；useDeferredValue / useTransition 处理输入快于渲染的 UI 过期（→ 32）
#### 六、易错点
- 漏判 AbortError：每敲一个字符闪一次错误
- controller / ignore 不是本轮 Effect 的局部变量：cleanup 误伤新一轮请求
- 只写 `fetch().then(r => r.json())` 却把 `.json()` 放在 catch 之外：取消时未处理的 rejection
- 组件级 isMounted ref 只挡卸载，挡不住依赖切换后的旧响应
- Effect 开头同步 setState（idle / loading / 日志）会被 `set-state-in-effect` 报 error（react-hooks 7 recommended）；讲清代价与取舍
- 时间线里「✂ 已取消」出现在下一轮「→ 发出」之后：promise 回调是微任务，不是 bug
#### 七、生产环境注意
- 演示简化：mockApi 一步返回、无 HTTP 状态；真实 fetch 写 `fetch(url, { signal })` + `if (!res.ok) throw` + `.json()` 在同一链上；axios 传 `signal` 并用 `isCancel`
- 封装「可取消请求」：接收 signal，把 AbortError / TimeoutError 转成「已取消」；`AbortSignal.timeout(ms)` 做超时、`AbortSignal.any([navSignal, timeout])` 合并、`signal.throwIfAborted()`
- 真实项目把取消交给 TanStack（queryFn 透传 signal）或 loader（透传 request.signal）；Effect 手写只在无框架小场景（→ 11 主线判定）
- 取消态不进 error、不清空已展示数据；错误态保留旧数据 + 重试按钮（TanStack 默认行为）
- 搜索输入先防抖再请求（→ 14）；提交按钮防重复（→ 19 / 31）
- lint：当前 eslint.config.js 未启用 recommended；切换后本课三个面板各 3 处同步 setState 报错
- 测试：用可控 promise 模拟乱序返回，断言最终 UI 对应最后一次请求（→ 34）
#### 八、旧写法对照【旧写法】
- 组件级 `isMountedRef` 守卫（React 18 前为消除「卸载后 setState」警告而生）：18 起警告移除，官方示例改用按 Effect 的局部 ignore
- TanStack v4 的 `promise.cancel()` 取消方式：v5.0 起移除，只保留 queryFn 的 `signal`（待核实）
- Vue 3.5 前 cleanup 只能用回调第三参 `onCleanup`；3.5 起 `onWatcherCleanup()`
- 无 cleanup 的裸 Effect 请求：存量代码最常见，竞态 + 卸载后 setState
#### 九、新动向【尝鲜】
- React 19.3 Transitions 独立渲染不再纠缠（facts-versions §B）；与本题的请求取消无直接关系，只影响 useTransition 处理 UI 过期的体验
#### 十、动手练习
- 把面板三改成真实 `fetch` 请求本地 JSON 并加 `AbortSignal.timeout(300)`；可断言结论：对 500ms 才响应的接口，面板进入「已取消」而非 error，且 `err.name === 'TimeoutError'`
- 用可控 promise 写乱序测试；可断言结论：先 resolve 第二次请求、再 resolve 第一次时，面板二与面板三的列表都只含第二次结果且 forKeyword 等于当前关键词，面板一则被第一次结果覆盖
#### 参考
- https://react.dev/learn/synchronizing-with-effects#fetching-data（React 19.3 站点，2026-09-17）
- https://react.dev/reference/react/useEffect#fetching-data-with-effects（2026-09-17）
- https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development（2026-09-17）
- https://developer.mozilla.org/en-US/docs/Web/API/AbortController（③ MDN，2026-09-17）
- https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static（③ MDN，2026-09-17）
- https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request（③ MDN，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation（v5，2026-09-17）
- https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup（Vue 3.5，2026-09-17）
- https://vuejs.org/api/reactivity-core.html#onwatchercleanup（2026-09-17）
- https://github.com/facebook/react/pull/22114（③，2026-09-17）

### 28. React + TypeScript 基础

#### 一、30 秒面试速答
- React 里类型没有魔法：props 是函数参数（interface / type，可选用 `?`，默认值用参数解构），事件是从 `react` 导入的泛型合成事件类型，children 是 `ReactNode` 类型的普通 prop。
- `useState` 从初始值推断；初始值是 `null`、`[]`、会被拓宽的字面量时才写 `useState<T>`；`useRef<T>(null)` 必须传参（19 起统一 `RefObject<T>`）。
- 19 的类型破坏性变化四条：`useRef` 必传参 / `MutableRefObject` 弃用、全局 `JSX` → `React.JSX`、`ReactElement['props']` 默认 `unknown`、`useReducer` 不再传泛型；迁移用 `types-react-codemod preset-19`。
- 继承原生属性用 `ComponentProps<'button'>`（含 ref）或 `ComponentPropsWithoutRef`；19 起 `ref?: Ref<HTMLButtonElement>` 就是普通 prop，不需要 `forwardRef`。
- 事件：`currentTarget` 永远带元素类型，`target` 只有 `ChangeEvent` / `SubmitEvent` 精确；提交事件用 `SubmitEvent<HTMLFormElement>`（`FormEvent` 已 `@deprecated`）。
#### 二、核心概念（React）
- 工程前提：`@types/react` + `@types/react-dom` 与 react 大版本对齐；tsconfig `jsx: react-jsx`、`lib` 含 `DOM`、`strict: true`（本仓库 tsconfig.json:4,8,9）；`.tsx` 里断言只能写 `x as T`。
- Props：interface / type 皆可，可选 `?` 读出 `T | undefined`，字符串字面量联合（`variant: 'primary' | 'ghost'`），参数默认值代替 defaultProps；callback prop 写「子组件需要的最小签名」。
- State 与 Reducer：`useState<T>` 三种必写场景（null / [] / 字面量拓宽）；`useReducer(reducer, init)` 19 起从 reducer 形参推断 State 与判别联合 Action，必要时 `useReducer<State, [Action]>`（深入 → 29）。
- 事件：`ChangeEvent<HTMLInputElement>`、`MouseEvent<HTMLButtonElement>`（导入需别名）、`KeyboardEvent<T>`、`SubmitEvent<HTMLFormElement>`；`SyntheticEvent<T>` 的 `currentTarget` 是 `EventTarget & T`，`target` 只是 `EventTarget`，仅 ChangeEvent / SubmitEvent 覆写；抽离 handler 用 `React.ChangeEventHandler<T>` 别名或显式参数类型。
- children 与元素：`ReactNode`（一切可渲染之物）vs `ReactElement`（只接受元素，props 默认 unknown）vs `JSX.Element = ReactElement<any, any>`；`PropsWithChildren<P>`；函数组件返回 `ReactNode | Promise<ReactNode>`。
- ref：`useRef<T>(null)` 三重载都要 initialValue，统一返回 `RefObject<T>`；ref 回调只能返回清理函数（用块体避免隐式返回）；19 起 `ref?: Ref<HTMLInputElement>` 直接声明在 props 里。
- 继承原生属性：`ComponentProps<'button'>`（= `JSX.IntrinsicElements['button']`，含 ref）/ `ComponentPropsWithoutRef` / `ComponentPropsWithRef`；`...rest` 透传；`Omit<…, 'onChange'>` 再覆写；`style: CSSProperties`。
- 泛型组件 `function List<T>({ items, renderItem }: ListProps<T>)`，调用处自动推断；箭头函数在 `.tsx` 里写 `<T,>`；`as const` + `satisfies`（TS 4.9）保字面量又受约束；`unknown` + 类型守卫 / `catch (err: unknown)` 堵住 any 泄漏口（现有区块三保留）。
#### 三、Vue 对照
- `defineProps<{ title: string; count?: number }>()`；默认值 3.5 主线是响应式 props 解构 `const { initial = DEFAULT } = defineProps<Props>()`（引用类型不需工厂函数）；`withDefaults` 是 3.4 及以下写法（对象 / 数组默认值需工厂）。
- `defineEmits<{ submit: [filter: OrderFilter]; reset: [] }>()` 具名元组（3.3+）对照 `onSubmit: (f: OrderFilter) => void`；emit 天然「可选」。
- `ref<T>()` 推断规则与 `useState<T>` 同构（null / [] / 字面量三种必写；`ref<T>()` 无参得 `T | undefined`）；`computed<T>`；`reactive` 不建议传泛型。
- 事件：模板拿到原生 `Event` / `MouseEvent`，`(event.target as HTMLInputElement).value` 或 `instanceof` 收窄；`v-model` 替你做这一步（现有 OrderFilterForm.vue 三种写法保留）。
- 模板引用：3.5 `useTemplateRef<HTMLInputElement>('el')`（对照 `useRef<HTMLInputElement>(null)`）；旧 `ref<HTMLInputElement | null>(null)`；组件实例 `InstanceType<typeof Foo>`。
- 泛型组件 `<script setup lang="ts" generic="T extends Item">`；`defineSlots<{ footer?: () => VNode[] }>()`；`defineModel<string>()` → 07；`InjectionKey<T>` → 15。
- 类型放哪：`<script setup>` 可以 `export type` / `export interface`（编译器只拒绝值导出）；types.ts 存在的理由是常量与守卫函数要跨组件共享。
- 类型检查：Vite 只转译；`tsc --noEmit`（React）/ `vue-tsc --noEmit`（本仓库 typecheck 脚本一次覆盖 .tsx 与 .vue）。
#### 四、关键区别
- 建模位置：React 是纯 TypeScript 类型层（任何 TS 类型都能进 props）；Vue 3.3+ `defineProps<T>()` 由编译器转成运行时校验，只支持 AST 可分析的类型（条件类型不支持）。
- 事件类型来源：React 合成事件从 `react` 导入、带元素泛型（19.2.18 类型）；Vue 3.5 模板事件是全局 DOM 类型，元素类型要自己收窄。
- ref：React 19 `ref` 是普通 prop（`Ref<T>`），18 及以前需 `forwardRef`；Vue 3.5 `useTemplateRef` 配 language-tools 2.1 可按模板自动推断。
- 默认值：React 参数默认值（19 起函数组件无 defaultProps）；Vue 3.5 解构默认值 / 3.4 及以下 withDefaults；布尔 prop Vue 缺省自动 false。
- 泛型组件：React 直接写泛型函数；Vue 需 `generic` 属性，模板层不可推断时用 `@vue-generic` 显式指定。
- 类型检查工具：`tsc` 直接检查 `.tsx`；`.vue` 必须走 `vue-tsc`（language-tools）。
#### 五、常见追问与回答要点
- ReactNode / ReactElement / JSX.Element 区别 → 联合 vs 元素 vs `ReactElement<any, any>`；children 用 ReactNode；19 起 `ReactElement['props']` unknown，读 `element.props` 要显式类型。
- 19 类型变化怎么迁移 → `npx types-react-codemod@latest preset-19 ./src`；全局 JSX 增强改 `declare module "react" { namespace JSX { interface IntrinsicElements {…} } }`。
- `ComponentProps` vs `ComponentPropsWithoutRef` → 要不要把 ref 一起透传；19 起可直接 `ComponentPropsWithoutRef<'button'> & { ref?: Ref<HTMLButtonElement> }`。
- target vs currentTarget → 事件委托下 target 可能是子元素，类型只能是 EventTarget；currentTarget 是绑定元素、带泛型；取值优先 currentTarget。
- 为什么 19 起不给 `useReducer` 传泛型 → 从 reducer 形参推断更准；旧 `useReducer<React.Reducer<S, A>>` 已不可用。
- `.tsx` 泛型箭头函数为什么要 `<T,>` → 与 JSX 标签消歧（官方出处待核实，见 pending）。
#### 六、易错点
- `useRef<HTMLInputElement>()` 在 19 类型下报错；`ref={el => (inst = el)}` 隐式返回被拒绝。
- `onClick={e => e.target.textContent}` 报错：MouseEvent 的 target 是 EventTarget；改 currentTarget。
- `useState([])` 推断 `never[]`；`useState(null)` 推断 `null`；字面量 `'newest'` 拓宽成 string。
- `satisfies` 只保证「都合法」不保证「都出现」，穷尽检查靠 `Record<K, V>` 或 never（→ 29）。
- `<script setup>` 不能 export 值（常量 / 函数），但可以 export 类型；`withDefaults` 的工厂函数要求在解构默认值下不需要。
- 从 `react` 导入 `MouseEvent` 不起别名会遮蔽 DOM 全局类型。
#### 七、生产环境注意
- 演示简化：区块三的 JSON 守卫是手写的，生产接口边界用 zod / valibot 等做运行时校验再赋 TS 类型；`as` 只在 narrowing 后使用。
- 演示用 `e.target.value`（ChangeEvent 下类型正确），库代码与非 ChangeEvent 事件一律用 `currentTarget`。
- tsconfig 开 `strict`（考虑 `noUncheckedIndexedAccess`）；CI 跑 `vue-tsc --noEmit` / `tsc --noEmit`，别只靠 Vite 构建。
- 库组件：`ComponentPropsWithoutRef<'button'> & { ref?: Ref<HTMLButtonElement> }`；要同时兼容 18 存量则保留 `forwardRef`。
- 升级 @types/react 大版本先跑 `types-react-codemod`；19.3 的 `ViewTransition` 类型需 @types/react 19.3。
- 阶段 1 切 eslint-plugin-react-hooks `recommended` 后，`immutability` / `refs` 等规则对本题代码的命中需运行验证（pending）。
#### 八、旧写法对照【旧写法】
- `useRef<T>()` 无参与 `MutableRefObject<T>`（19.0 类型起变化）；`useReducer<React.Reducer<S, A>>(…)`（19.0 起）。
- 全局 `JSX.Element` / `declare global { namespace JSX {…} }`（19.0 起改 `React.JSX`）；`ElementRef<'div'>` → `ComponentRef`、`PropsWithRef`（已 `@deprecated`）。
- `forwardRef<T, P>` 收 ref（19 前必需）；函数组件 `defaultProps`、`propTypes`（19.0 移除 / 不校验；02 已讲）。
- `React.FC<Props>` 隐式 children（@types/react 18 起移除）；`FormEvent<HTMLFormElement>`（@types/react 19.2.18 标 `@deprecated`，改 `SubmitEvent`）。
- Vue：`withDefaults`（3.4 及以下）；`ref<HTMLInputElement | null>(null)` 模板引用（3.5 前）；`defineEmits` 调用签名式（3.3 前无具名元组）。
#### 九、新动向【尝鲜】
- @types/react 19.3（latest）含 `ViewTransition` / `addTransitionType` 稳定类型；已装 19.2.18 只在 canary.d.ts。
- TypeScript 6 / 7（Go 移植）不作主线：typescript-eslint peer `<6.1.0`，Vue 工具链暂不可用。
#### 十、动手练习
- 练习 1：给 `OrderFilterForm` 加 `ref?: Ref<HTMLFormElement>` 与 `ComponentPropsWithoutRef<'form'>` 透传，在父组件用 `useRef<HTMLFormElement>(null)` 调 `reset()`。可断言结论：点击「外部重置」后，关键词输入框的 `value` 为空且 `onReset` 被调用一次。
- 练习 2：把 `OrderCard` 改成泛型 `EntityCard<T extends { id: string }>`（`renderTitle: (item: T) => ReactNode`），Vue 侧用 `generic="T extends { id: string }"`。可断言结论：传入 `Order[]` 时 `renderTitle` 参数被推断为 `Order`，`tsc --noEmit` 零错误；传入缺少 `id` 的对象类型时编译报错。
#### 参考
- https://react.dev/learn/typescript（React 19.3 站点，2026-09-17）
- https://react.dev/blog/2024/04/25/react-19-upgrade-guide#typescript-changes（2026-09-17）
- https://react.dev/blog/2024/12/05/react-19（ref as a prop，2026-09-17）
- node_modules/@types/react/index.d.ts（19.2.18：:154,176-185,194,325,436,1030,1060,1423,1452,1480,1530,1737-1761,2054,2086-2091,2107,2177,2314,4141）
- https://www.typescriptlang.org/docs/handbook/jsx.html；/docs/handbook/release-notes/typescript-4-9.html（2026-09-17）
- https://vuejs.org/guide/typescript/composition-api.html；https://vuejs.org/api/sfc-script-setup.html；https://vuejs.org/guide/components/props.html；https://vuejs.org/guide/typescript/overview.html（Vue 3.5，2026-09-17）
- node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js:25737（3.5.42）；node_modules/@vue/runtime-core/dist/runtime-core.d.ts:195,228,290,380,1563

### 29. useReducer 与判别联合 Action

#### 一、30 秒面试速答
- `const [state, dispatch] = useReducer(reducer, initialArg, init?)`：组件只 dispatch「发生了什么」，怎么变全在纯函数 reducer 里【主流】
- reducer 必须纯：不突变 state、不 I/O、同输入同输出；StrictMode 开发期双调 reducer 与 init 来暴露不纯【主流】
- action 用判别联合：`type` 字面量做标签，`switch` 自动收窄，`default` 里 `never` 做穷尽检查；React 19 起不给 useReducer 传泛型、靠 reducer 参数注解推断【主流】
- dispatch 语义同 setState：只对下一次渲染生效、`Object.is` 相等跳过、身份稳定、同一事件里批处理【主流】
- 取舍：单值 / 只替换 → useState；多种更新方式共享规则、要日志 / 撤销 / 单测 → useReducer；可同组件混用【主流】
#### 二、核心概念（React）
- 签名与惰性初始化 `init(initialArg)`；init 只在首次渲染跑（StrictMode 两次）
- 判别联合 Action + never 穷尽（保留购物车四种 action 与 `exhaustive` 写法）
- reducer 纯函数三条落地规则；未知 action `throw`；返回同引用 bail out（EMPTY_CART）
- 纯函数红利：action 日志 → 撤销 = 清空 + 重放 → 「重放一致」活单测（保留区块三）
- dispatch caveats：下一次渲染生效（dispatch 后读 state 仍是快照）、Object.is 跳过、身份稳定可省出依赖、批处理 → 24
- 异步不进 reducer：请求在事件处理器 / effect / Action 里做，完成后 dispatch `succeeded` / `failed` 结果 action；服务端数据优先 Query → 30
- Troubleshooting：没 return → undefined；漏 `...state`；渲染期 dispatch → Too many re-renders
- TS 19 推断：不传类型参数；内联 reducer 注解 `(state: State, action: Action)`；边缘 `useReducer<State, [Action]>(reducer)`
#### 三、Vue 对照
- 无内置对应物：`reactive()` + 类型化 action 函数（保留 `apply(items, action)` 原地改 vs reducer 换引用的签名对照）
- 判别联合是 TS 能力，Vue 同样可用；Pinia 惯用每 action 一个函数，类型由签名给出
- Pinia action 可 async、无纯约束；`$patch` 一次改多字段、`$subscribe` 只触发一次 → 16
- Immer `draft` 在 Vue 里不需要：`reactive` 本身就是 Proxy，原地改即触发
- 「都走 dispatch」在 Vue 靠约定（保留反面按钮）；Pinia store 天然全局、无 Provider → 16
#### 四、关键区别
- 收口方式：React useReducer 不给 setter，API 强制（突变 state 仍是 bug 路径）；Vue reactive 谁拿到都能改，靠约定 —— 适用 React 16.8+ / Vue 3
- 更新形态：reducer 返回新引用（Object.is 才认，21）；Vue apply 原地改（Proxy 追踪）
- 纯度约束：reducer 运行在渲染期、StrictMode 双调；Pinia action 无渲染期语义、可 async
- 读值：dispatch 后组件里的 state 仍是快照；Vue 改完立刻可读（24）
#### 五、常见追问与回答要点
- 官方五维度：Code size / Readability / Debugging / Testing / Personal preference；可混用（actionLog 用 useState）
- 异步放哪：外部做请求、reducer 只收结果；`status` 字面量联合建模（03）；表单提交考虑 `useActionState`（31）
- dispatch 要进依赖吗：身份稳定，可省；多次 dispatch 同一事件一次渲染（24）
- reducer + Context：state / dispatch 拆两个 context + `useX()` / `useXDispatch()`；拆的理由是只读 dispatch 的组件不随 state 重渲染（15）；对比 Zustand / RTK（16）
- 19 后泛型：不传；`useReducer<React.Reducer<S, A>>` 报错
#### 六、易错点
- `state.push()` 后 `return state`：引用不变界面不动
- 某 case 忘 return / 对象 state 漏 `...state`
- 渲染期直接 dispatch → Too many re-renders
- 在 reducer 里记日志 / 发请求：StrictMode 双跑做两遍
- 把「reducer 参数是最新的」误读成「dispatch 后读 state 是新值」（现 :13 需改写）
- payload 用绝对量时异步回调快照过期 → 改增量 action（保留 :327-333）
#### 七、生产环境注意
- 演示简化：局部购物车 + 日志重放；真实项目撤销栈通常放 `{ past, present, future }` 进 state；只追加日志用 index 作 key（已注明例外）
- 生产：reducer 单测 `expect(reducer(state, action)).toEqual(...)`（34）；action 类型集中定义导出；禁 `payload: any`
- 嵌套结构用 Immer `useImmerReducer`（官方教程写法）或先归一化；RTK `createSlice` 内置 Immer
- 异步：请求在外部，reducer 只收结果；服务端数据交给 Query（30）
- eslint-plugin-react-hooks 7 recommended：`purity`（reducer 里不读 Date.now / Math.random）、`immutability`（不突变 state）、`set-state-in-render`（渲染期不 dispatch）；本课代码无命中
#### 八、旧写法对照【旧写法】
- `useReducer<React.Reducer<State, Action>>(reducer, init)` 显式泛型：@types/react 19（2024-12）起报错，改为不传泛型 + 注解 reducer 参数
- Redux 时代 `ADD_TODO` 常量 + action creator + switch 样板：RTK 1.0 起 `createSlice` 自动生成 action creator 并内置 Immer（主责 16）
#### 九、新动向【尝鲜】
- React 19 `useActionState`【较新】：形如异步 reducer，管提交生命周期；与 useReducer 分工（主责 31，本题一句）
#### 十、动手练习
- 练习 1：给 Action 加 `{ type: 'setQuantity'; id: string; quantity: number }` 但不写 case，观察 `never` 报错；再补 case。可断言结论：`cartReducer([], { type: 'add', product: p1 })` 返回 `[{ id: 'p1', name: '机械键盘', price: 399, quantity: 1 }]`，且 `cartReducer(oneItem, { type: 'changeQuantity', id: 'p1', quantity: 0 })` 返回 `[]`
- 练习 2：把 `undo` 改成 `{ past, present }` 历史栈进 reducer。可断言结论：对空购物车 dispatch `clear` 返回同一个引用（`Object.is` 为 true），组件不重新提交
- 可断言结论：任意 action 序列从 `EMPTY_CART` 重放两次得到结构相同的购物车（reducer 纯）
#### 参考
- https://react.dev/reference/react/useReducer（React 19.3 站点，2026-09-17）
- https://react.dev/learn/extracting-state-logic-into-a-reducer（2026-09-17）
- https://react.dev/learn/scaling-up-with-reducer-and-context（2026-09-17）
- https://react.dev/learn/choosing-the-state-structure（2026-09-17）
- https://react.dev/learn/typescript（2026-09-17）
- https://react.dev/blog/2024/04/25/react-19-upgrade-guide（「Better useReducer typings」，2026-09-17）
- https://redux-toolkit.js.org/introduction/getting-started（RTK 2，2026-09-17）
- https://vuejs.org/guide/scaling-up/state-management.html（Vue 3.5，2026-09-17）
- https://vuejs.org/guide/extras/reactivity-in-depth.html（2026-09-17）
- https://pinia.vuejs.org/core-concepts/（Pinia 3，2026-09-17）；https://pinia.vuejs.org/core-concepts/state.html（2026-09-17）

### 30. TanStack Query 与服务端状态

#### 一、30 秒面试速答
- TanStack Query 管的是服务端状态——远端持有真相、异步获取、别人也能改、放着就会过期——它做缓存 / 同步 / 重取 / 失效，不是客户端状态库，也不管怎么发请求（queryFn 里随便 fetch / axios）。
- queryKey = 缓存主键 + 依赖声明：queryFn 用到的变量都进 key；key 确定性哈希，对象键顺序无关、数组元素顺序有关；失效按前缀匹配。
- 默认值：staleTime 0（一落地就 stale）、gcTime 5 分钟、失败静默重试 3 次指数退避、stale 数据在挂载 / 聚焦 / 重连时后台重取；生产通常在 QueryClient 默认项里把 staleTime 设成非 0。
- 两个维度：status 回答「有没有数据」（pending / error / success），fetchStatus 回答「在不在跑」（fetching / paused / idle）；isPending = 无数据，isFetching = 在请求，isLoading = 两者同时（v5）。
- 写操作用 useMutation，成功后 invalidateQueries 让缓存失效并后台重取，不手工维护副本；剩下真正全局的客户端状态很少，才轮到 Context / Zustand。
#### 二、核心概念（React）
- 本题定位：TanStack Query v5【主流】是生产默认的客户端缓存层，本题是主课；React 官方原文把它列为「客户端缓存」推荐之一（与 useSWR / React Router 6.4+ 并列）；11 / 22 的 useEffect 手写是教学写法（官方列出四缺点：不在服务端运行、瀑布、无缓存、不 ergonomic），只作对照
  - 并排：React Router 7 Data 模式 loader【主流】（→ 18），loader 里 ensureQueryData 预取 + 组件 useQuery 读缓存可并用；use(promise) + Suspense【较新】只作引用（→ 32，需缓存 promise）
- 接入：QueryClient（缓存本体 + defaultOptions）+ QueryClientProvider（Context，只对子树可见）；useQuery 只有单对象签名；useQueryClient 取实例；queryOptions() 共置 key / queryFn 获得类型推断。
- queryKey 规则（顶层数组、可序列化、确定性哈希、变量进 key）与 queryFn 契约（返回 promise / throw；fetch 须检查 response.ok）；QueryFunctionContext 提供 queryKey / signal / meta / client / pageParam。
- 重要默认值全表：staleTime 0、gcTime 5 分钟（SSR 为 Infinity）、retry 客户端 3 / 服务端 0、refetchOnMount / refetchOnWindowFocus / refetchOnReconnect 默认 true（只对 stale 数据）、refetchInterval 默认 false、结构共享默认开。
- status × fetchStatus 两维度与派生布尔：isPending / isFetching / isLoading / isRefetching / isPaused；后台重取 = success + fetching；离线 = pending + paused；错误时旧 data 仍在缓存；失败后 isInvalidated 自动为 true。
- useMutation：idle / pending / error / success；默认不重试；mutate（回调可能因卸载不触发）vs mutateAsync（返回 promise，自己 try / catch）；两层回调顺序（useMutation 级先于 mutate 级，连续 mutate 只触发最后一次 mutate 级）；onSuccess 里 return invalidateQueries 的 promise 让 isPending 等到重取完成。
- 失效重取语义：标 stale（覆盖 staleTime）+ 正在被渲染的查询后台重取；前缀 / exact / predicate 三种匹配；同 key 多处 useQuery 去重共享，同 key 不同 queryFn 时执行触发者的那个。
- 常用选项各一句：enabled 依赖查询（pending + idle、瀑布）；placeholderData: keepPreviousData 分页（→ 22）；select / 结构共享 / tracked properties（性能，...rest 解构会关掉）；throwOnError 抛给错误边界（→ 20）；useSuspenseQuery（→ 32）。
#### 三、Vue 对照
- @tanstack/vue-query 与 react-query 同名同义，同一个 query-core；app.use(VueQueryPlugin, { queryClient }) 内部 client.mount() + app.provide + app.onUnmount(client.unmount)，对应 QueryClientProvider（Context）；组件里都用 useQueryClient()。
- 选项可为 ref / getter：queryKey 里直接放 ref 或 computed，enabled 传 getter，库自动追踪（官方逐字："In vue query any reactive properties within a query key are tracked for changes automatically."）；React 侧靠「下次渲染传新 key」。
- 返回值是装满 ref 的对象（toRefs(readonly(state))），必须解构成顶层 ref 模板才自动解包；`q.isPending` 在 v-if 里是 ref 对象恒为真——vuejs.org「只解包顶层属性」的规则。
- 缓存观察：Vue 侧 onMounted subscribe / onUnmounted 退订，没有「渲染期间不能更新」的限制；React 侧 useSyncExternalStore + notifyManager.batchCalls（只作引用 → 14）。
- Pinia 与 Zustand 一样只管客户端状态；无 TanStack 时 Vue 用 composable useFetch（→ 11）；Vue 无 StrictMode 双跑；devtools 用 @tanstack/vue-query-devtools。
#### 四、关键区别
- 「服务端 vs 客户端状态」是框架无关分类：两端同一 core（@tanstack/query-core 5.102.8），缓存语义完全一致，差异只在响应式包装。
- 响应式接口（vue-query 5.x / react-query 5.x）：React 传本次渲染的快照、返回普通值；Vue 传 ref、返回 ref——这是两套响应式模型的差异，不是 Query 库的差异。
- 与路由 loader 的区别（并排，React Router 7 Data 模式【主流】）：loader 在导航前取数、pending 归 useNavigation、错误归 errorElement、以路由为单位失效（action 完成后 revalidate）；TanStack 在组件内按 key 缓存、pending / 错误在 query 结果里、失效靠 invalidateQueries、跨路由存活并去重；「Data 模式 loader 取数」与「声明式 / 任意路由 + TanStack Query」是两种【主流】组合（→ 18），也可并用（loader 里 queryClient.ensureQueryData 预取，组件里 useQuery 读缓存）。
- 与 use(promise) + Suspense（并排引用，React 19 起【较新】，→ 32）：use 要求 promise 被缓存、不能在 try / catch 里调用，纯客户端需自建 promise 缓存；TanStack 的 useSuspenseQuery 正是这样的缓存源，status / error 交给 Suspense fallback 与错误边界。
- StrictMode（仅开发期，React 18+）：useState 初始化函数双调、effect / 订阅多跑一轮 setup + cleanup，消费了 signal 的首条 queryFn 会被取消再重发（需运行验证）；Vue 无此现象。
#### 五、常见追问与回答要点
- invalidateQueries 和 staleTime 谁优先？失效覆盖 staleTime；只有正在被渲染的查询立即重取，其余等下次用到。
- 窗口聚焦重取怎么关？refetchOnWindowFocus: false（全局 defaultOptions 或单查询）；同理 refetchOnReconnect / refetchOnMount。
- onSuccess 写在 useMutation 还是 mutate 上？前者先触发、总会触发；后者只对这次调用生效，组件卸载后不触发；要顺序执行用 mutateAsync。
- 为什么 v5 删掉 query 上的 onSuccess？官方迁移页只给结论（已移除），理由以官方 RFC 为准（待核实）；替代：在 useEffect 里响应 data，或用 QueryCache 级回调。
- 同一个 key 两处 useQuery 写了不同 queryFn 会怎样？只按 key 认缓存，执行触发这次请求的那份 options（query.js:164-168）；用 queryOptions() 工厂避免。
- 为什么 data 引用没变 / 为什么没重渲染？结构共享 + tracked properties；...rest 解构会关掉追踪。
- 请求失败后旧数据还在吗？在（缓存不会因一次失败清空），isError 与 data 可同时为真，且 isInvalidated 已为 true。
#### 六、易错点
- 忘把 queryFn 用到的变量放进 key → 不重取或缓存串号。
- 以为库会自动取消：不读 signal 就不取消，只是结果按 key 归位。
- `...rest` 解构 useQuery 返回值 → 关掉属性追踪，多余重渲染。
- Vue 侧不解构直接 `q.isPending` → ref 对象恒真。
- 在 QueryClientProvider 同一层调用 useQuery → 「No QueryClient set」。
- QueryClient 写在模块级 → SSR 下跨用户 / 跨请求共享缓存。
- 把接口数据再复制进 useState / Zustand / Pinia 再手写 loading / error。
- 用 isPending 当「正在请求」：有缓存时后台刷新 isPending 为 false，要看 isFetching。
#### 七、生产环境注意
- 本课简化：retry: false、staleTime 5 s、refetchOnWindowFocus: false、每次进入新建 QueryClient、mockApi 直接 throw（无 HTTP 状态码）、无 devtools、OrdersCountBadge 通过 props 传 queryFn。
- 真实项目：main.tsx 单例（SSR 时在 useState / ref 里每请求新建）；defaultOptions 统一 staleTime（非 0）、retry、throwOnError；key 工厂 + queryOptions() 共置；queryFn 检查 response.ok、透传 signal；错误对象类型化。
- 列表页生产写法：TanStack（useQuery 分页 + keepPreviousData + useMutation + invalidateQueries）
  - 并排：路由 loader / action + useFetcher（action 完成后自动 revalidate）【主流】，Data 模式（→ 18）；两者可并用（loader 预取、组件读缓存）。22 综合页现保持 effect 手写并在「生产环境注意」写明改写，是否直接迁到 TanStack 待用户决定（D2-2）。
- 乐观更新：主线 TanStack 的 onMutate + cancelQueries + 快照回滚，或用 mutation 的 variables 直接渲染（单处展示更省）
  - 并排：React 19 useOptimistic【主流】，19.0 起，在 Action 内使用（→ 31）
- SSR / RSC：dehydrate + HydrationBoundary，gcTime 在服务端为 Infinity，请求结束后 queryClient.clear()（→ 33）。
- 开发期挂 @tanstack/react-query-devtools / @tanstack/vue-query-devtools 看缓存条目，而不是自己订阅 QueryCache。
#### 八、旧写法对照【旧写法】
- v4 → v5（5.0 起）：status 'loading' → 'pending'、isLoading → isPending、cacheTime → gcTime、keepPreviousData: true → placeholderData: keepPreviousData、query 上 onSuccess / onError / onSettled 移除、useErrorBoundary → throwOnError、Hydrate → HydrationBoundary、useQuery(key, fn) 多重载 → 单对象、getQueryData 只收 queryKey。
- 旧名 React Query、包名 react-query → @tanstack/react-query（改名版本待核实）；读老代码时 `import { useQuery } from 'react-query'` 即 v3 及以前。
- useEffect 手写请求（11 / 22 的 loading / error / data + AbortController + reloadFlag）：教学写法，官方仍允许，不标【旧写法】；在本题作「基础 / 演示」对照，11 文件头标「教学用；生产用缓存层，见 30」，22 保持现状待 D2-2。
- React 18 时代无 use()：需要 Suspense 数据源只能靠库（TanStack useSuspenseQuery / Relay）；19 起 use(promise)【较新】让路由 loader 返回的 promise 也能 Suspense（→ 32）。
#### 九、新动向【尝鲜】
- staleTime: 'static'（5.102.8 已有类型 `type StaleTime = number \| 'static'`，起始小版本待核实）：永不 stale、连手动 invalidate 也不重取的语义以官方文档为准。
- queryClient.query() 取代 fetchQuery（.d.ts 中 fetchQuery 已标 @deprecated，指向 `queryClient.query({ ...options, staleTime: 'static' })`，起始版本待核实）。
- Next.js 流式 SSR：@tanstack/react-query-next-experimental 的 ReactQueryStreamedHydration（实验包 → 33）。
- npm 无任何 6.x（facts-versions §J），主线稳定在 v5。
#### 十、动手练习
- 练习 1：给列表加 page（进 key）并用 placeholderData: keepPreviousData。可断言结论：切页期间 isPlaceholderData 为 true 且上一页 data 仍可渲染，新数据到达后为 false。
- 练习 2：把「标记已支付」改成乐观更新（onMutate 快照 / onError 回滚 / onSettled invalidate）。可断言结论：mutationFn 失败时列表回到快照，且 ['orders', *] 的 isInvalidated 为 true。
- 可断言结论：同一 key 的两处 useQuery 在一次切换筛选中只让 queryFn 执行一次（mock 计数 = 1）。
#### 参考
- https://tanstack.com/query/v5/docs/framework/react/overview（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/query-keys（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/queries（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/mutations（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/render-optimizations（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/suspense（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/ssr（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/does-this-replace-client-state（v5，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/vue/reactivity（v5，2026-09-17）
- https://react.dev/reference/react/useEffect#what-are-good-alternatives-to-data-fetching-in-effects（19.3 站点，2026-09-17）
- https://react.dev/reference/react/StrictMode（19.3 站点，2026-09-17）
- https://vuejs.org/guide/essentials/reactivity-fundamentals.html（3.5，2026-09-17）

### 31. 表单与 Actions（新题）

#### 一、30 秒面试速答
- Action = 在 Transition 里运行的 async 函数（19.0 起）；React 自动管理 pending、乐观更新、错误、表单提交。
- `<form action={fn}>` 收 `FormData`、在 Transition 中执行、成功后自动 reset 非受控字段。
- `useActionState(fn, init)` → `[state, formAction, isPending]`；`fn(prev, formData)`；多次提交串行排队；错误 return 进 state 或 throw 进边界。
- `useFormStatus()`（react-dom）只能在 `<form>` 的子组件里读父表单 pending；`useOptimistic` 在 Action 内 set，完成后回到真实值。
- 受控 `value` / `onChange` 与 Action 可组合但受控字段不自动 reset；Vue 无对应物，`@submit.prevent` 手写 submitting（→19）。
#### 二、核心概念（React）
- 主线 Actions 家族（19.0 起【主流】）：`<form action>` + `useActionState` + `<SubmitButton>` 用 `useFormStatus` + `useOptimistic` + async `startTransition`，主线代码写在本课
  - 并排：受控 + 手写 submitting【主流】，主线代码留在 07 / 19；本课只说明与受控组件的组合（受控字段不会被 Action 自动 reset）与 React 18 不可用
- `startTransition(async)`：立即同步调用；同步 set 标 Transition；`await` 后 set 需再包；不能控制文本输入；`isPending` 持续到最终提交【主流】
- `<form action>`：函数 → Transition + `FormData`；HTTP 恒 POST；`<button formAction>` 覆盖；自动 reset 非受控、`requestFormReset` 手动【主流】
- `useActionState` 三元组、`fn(prev, formData)`、`initialState` 首次后忽略、`formAction` 身份稳定、串行排队 = 天然防重复（对照 19 手写）【主流】
- 错误两分：可恢复 → `return { error }` 渲染；不可恢复 → throw → 取消排队 + 最近边界（→20）【主流】
- `useFormStatus` 返回 `{ pending, data, method, action }` 判别联合；同组件渲染的 form 拿不到 → 抽子组件【主流】
- `useOptimistic(value, reducer?)`；set 只能在 Action 内；失败自动回滚但不通知【主流】
- 受控输入 + Action 组合（受控字段不自动 reset，需自清或 `requestFormReset`）与 `FormData.get` 收窄（→07）；「暴露 action prop」模式、多 Action 批处理限制
#### 三、Vue 对照
- 无 Actions 家族；`@submit.prevent` + `ref(false)` submitting + `try / finally`（→19）
- `useFormStatus` 无对应：用 props / provide 传 submitting
- `useOptimistic` 无内置：先改本地 ref、失败回滚
- `FormData` 同为平台 API；更多用 `v-model` 持值（→07）
- 错误：React Action 抛错冒泡到边界；Vue 事件处理器（含 async 拒绝，源码 :205-213）进 `onErrorCaptured` —— 差异在「谁接」不在「能否接」（大纲此行待改，P-31-1）
#### 四、关键区别
- 主线 Actions：pending / 排队 / reset 由 React 管（19.0 起，客户端）
  - 并排：手写 submitting、防重复、清空都自己做【主流】（→19）；React 18 只有这条路
- 自动 reset 只对非受控字段（19.0）；受控字段不动
- `useFormStatus` 只读父 `<form>`（react-dom 19.0）
- 排队 vs 并发：`useActionState` 串行；手写版靠 disabled + guard（→19 快照问题）
- SPA 无渐进增强；`permalink` / 无 JS 提交只在 RSC + Server Function（→33）
- 路由 `<Form>` + route `action`（React Router，提交后 revalidate）≠ React 19 `<form action>`（→18）【较新】
#### 五、常见追问与回答要点
- Action 和普通 async 函数区别？→ Transition 语义 + `isPending` + 错误进边界
- `await` 后为什么再包 `startTransition`？→ 已知限制（AsyncContext 前）
- `fn` 第一个参数为什么是上次 state？→ 串行排队、reducer 式累积；`useFormState` 是 Canary 旧名
- 错误 return 还是 throw？→ 可恢复 return，不可恢复 throw
- `useFormStatus` 从哪导入、`data` 类型？→ `react-dom`；`FormData | null`
- 受控输入为什么没清空？→ 自动 reset 只清非受控；`requestFormReset` 或自清 state
- `useOptimistic` set 在 Action 外调用？→ 警告且乐观值一闪
#### 六、易错点
- 把 `useFormStatus` 写在渲染 `<form>` 的组件里
- 忘了 `await` 后再包 `startTransition`
- 用 Transition 控制受控输入
- 校验错误 throw 进边界（应 return state）
- `FormData.get` 直接 `as string`（可能 `File` / `null`）
- 把 React Router `<Form action>` 和 React `<form action>` 混为一谈
#### 七、生产环境注意
- 演示简化：客户端 action + mockApi；无渐进增强、无 `permalink`
- 生产：可恢复错误进 state 渲染并关联 `aria-describedby`（→35）；不可恢复错误进边界并在 `createRoot.onCaughtError` 上报（→20）
- 主线：`<SubmitButton>` 子组件 + `useFormStatus`；依赖串行排队防重复
  - 并排：手写 disabled + guard + ref 锁（→19）【主流】，18 项目唯一方案
- 受控 + Action：成功后自清 state；乐观更新配失败提示
- 有 TanStack Query 时在 Action 内调用 `mutateAsync` 并失效重取（→30）
#### 八、旧写法对照【旧写法】
- React 18：`onSubmit` + `preventDefault` + 手写 submitting / error；`startTransition` 只同步；无 `useFormStatus` / `useOptimistic` —— 19.0 起并存，手写版是并排【主流】而非旧写法，本段只放 React 18 差异；本段的【旧写法】只有 `useFormState`
- `useFormState`（react-dom，Canary）→ `useActionState`（react）19.0 更名；react-dom 19.2.8 仍导出但已弃用
- Vue 无版本差异（3.x 一贯手写）
#### 九、新动向【尝鲜】
- 19.3：`submit` 事件含 `submitter`；Server Action 自动 reset 后触发 `onReset`；Transitions 独立渲染（19.2.8 未安装）
#### 十、动手练习
- 练习 1：用 `useActionState` 重写 19 题订单表单。可断言结论：连续两次提交串行，第二次 `fn` 的 `prev` 是第一次返回值；`isPending` 在最终提交后为 false
- 练习 2：加 `<SubmitButton>` 用 `useFormStatus`。可断言结论：提交期间按钮 `disabled`；父组件内直接调用 `useFormStatus().pending` 恒为 false
- 练习 3：受控 + 非受控各一个字段。可断言结论：成功后非受控字段清空、受控字段保留
#### 参考
- https://react.dev/blog/2024/12/05/react-19（2026-09-17）
- https://react.dev/reference/react/useActionState；/useOptimistic；/useTransition（站点 19.3，2026-09-17）
- https://react.dev/reference/react-dom/hooks/useFormStatus；/reference/react-dom/components/form（2026-09-17）
- https://reactrouter.com/7.18.4/api/components/Form（v7，2026-09-17）
- https://react.dev/blog/2026/09/09/react-19-3（2026-09-17）
- node_modules/@types/react/index.d.ts:1835, 1930-1936, 1975-1984；node_modules/@types/react-dom/index.d.ts:27-43, 45, 50, 133；node_modules/typescript/lib/lib.dom.d.ts:12239, 39187

### 32. 并发与异步 UI（新题）

#### 一、30 秒面试速答
- 并发渲染（`createRoot`，18 起）：渲染可被更紧急更新打断并从头重来，所以渲染必须纯。
- `useTransition` → `[isPending, startTransition]` 把 set 标为非阻塞；`useDeferredValue` 在没有 set 权时延后一个值；两者都不等固定时间。
- `<Suspense fallback>` 只被 Suspense 兼容数据源触发（`lazy`、`use(promise)`、框架 / 库），effect 里 fetch 不触发；Transition 内再次挂起不退回 fallback。
- `use(promise)` 可条件调用、拒绝进最近边界、promise 必须缓存；`lazy` 必须模块级声明。
- 19.2 `<Activity mode="hidden">` 隐藏 + 销毁 Effects + 保留 state ≈ Vue `<KeepAlive>`；19.3 `<ViewTransition>`【尝鲜】。
#### 二、核心概念（React）
- 并发前提：可中断 / 重来 → 纯渲染；StrictMode 双调是同一前提的开发期检验（→10 / 23 / 29）【主流】
- `useTransition`：`isPending`、被打断、不能控制文本输入、多个合批（19.2）；独立 `startTransition` 无 `isPending`；19 async Action、`await` 后再包、错误进边界（→31 / 20）【主流】
- `useDeferredValue(value, initialValue?)`：旧值先渲染再后台重渲染、无固定延迟、与 Suspense 集成、不省请求、传原始值；`initialValue` 19 起【主流 / 较新】
- `<Suspense>`：触发条件、同边界一起揭示、嵌套逐级、300ms 节流、首次挂起 state 不保留、`key` 重置、Transition / deferred 下不退回 fallback【主流】
- `use(promise)`：条件 / 循环可调、不可 `try / catch`、拒绝进边界、promise 需缓存（loader →18、Query →30、模块级）；`use(Context)` →15【主流，19.0】
- `lazy(() => import())`：默认导出、缓存、勿在组件内声明、配 Suspense + 边界；路由级 `lazy` 属性与 `RouterProvider` 默认 Transition 导航（→18）【主流】
- `<Activity mode="visible" | "hidden">`：hidden 时 `display:none` + 销毁 Effects + 保留 state、低优先级预渲染、替代 `{show && <X/>}`（18 题 :468 已提一句）【较新，19.2】
- 取数现状：组件内 fetch + `use` 需自建缓存；生产走 `useSuspenseQuery`（→30）/ loader（→18）/ RSC（→33）【主流】
#### 三、Vue 对照
- `<Suspense>`（3.5 仍标 experimental）：async `setup` / 顶层 `await` / 异步组件；`#default` / `#fallback`；错误进 `onErrorCaptured`；`suspensible`
- `defineAsyncComponent({ loader, loadingComponent, errorComponent, delay, timeout })` ≈ `lazy` + Suspense + 边界（Vue 自带 loading / error）
- `<KeepAlive>` + `onActivated` / `onDeactivated`、`include` / `max` ≈ `<Activity>` 保留 state；Activity 还能低优先级预渲染
- 无 `useTransition` / `useDeferredValue` 对应物：Vue 调度同步批处理，无渲染优先级
- `<Transition>` 是 CSS 动画组件 ≠ `<ViewTransition>`；两边都可直接用浏览器 View Transitions API（③ MDN，P-32-3）
- 术语撞车：27 题「并发请求」、30 题 TanStack `isPending`（无缓存）与本课含义不同
#### 四、关键区别
- 可中断渲染 vs 同步批处理：React 18+ `createRoot` 才有；legacy `render` 无【旧写法】
- `isPending`（Transition）≠ `isPending`（TanStack）；`useDeferredValue` ≠ 防抖（不等固定时间、随设备自适应）
- Suspense 只对「兼容数据源」；Vue Suspense 对 async setup —— 两边都不接 effect 里的 fetch
- `Activity hidden`：Effects 销毁、state 保留、DOM 留在树上 `display:none`；`KeepAlive`：实例缓存、`deactivated` 钩子；条件渲染：全部销毁
- Vue `<Suspense>` 实验（3.5），React Suspense 稳定
- `ViewTransition` 只在 Transition / Suspense / deferred 触发的更新里激活（19.3）
#### 五、常见追问与回答要点
- 何时选 `useTransition` vs `useDeferredValue`？→ 有 set 权 / 无 set 权（props、库返回值）
- 为什么受控输入不能放 Transition？→ 输入需同步更新；输入同步、列表 deferred
- fallback 何时不显示？→ Transition / deferred 引起的再挂起；已显示内容保留
- 为什么不能 `use(fetch())`？→ 每次渲染新 promise 无限挂起；需缓存
- 为什么不能 `try / catch` `use`？→ Suspense Exception 机制
- `lazy` 写在组件内会怎样？→ 每次重渲染新组件，state 重置
- Activity hidden 时 Effect？→ 销毁；恢复时重建；state 保留
#### 六、易错点
- 在 effect 里 fetch 却期待 Suspense fallback
- 在渲染中创建 promise 传给 `use`
- `lazy` 组件内声明；漏 Suspense 或漏 Error Boundary
- 用 Transition 包受控输入的 set
- `await` 后忘再包 `startTransition`
- 把 `Activity` 当 `KeepAlive` 用于不会回来的视图（内存）
- 在 19.2.8 导入 `ViewTransition`（不导出）
#### 七、生产环境注意
- 演示简化：模块级 Map 缓存 promise、mockApi；生产用 Query / loader
- 搜索 UI：输入同步受控 + 列表 `useDeferredValue` + 变暗表示过期
- 每个 `lazy` 边界配 Suspense + 边界 + 重试；路由级优先 Router `lazy`
- `Activity` 只用于确定回来的视图；订阅销毁但内存仍占
- StrictMode 保持开启（本项目 src/main.tsx:14 已开）；双调暴露的问题在并发 / Activity 下真实发生
- `ViewTransition` 等到 19.3 + @types/react 19.3 再用
#### 八、旧写法对照【旧写法】
- React 18：`startTransition` 只同步、无 `use`、`useDeferredValue` 无 `initialValue`、`Activity` 未导出（19.2 起稳定导出，非 `unstable_Activity`）、Suspense 主要配 `lazy` —— 19.0 / 19.2 起变化
- legacy `ReactDOM.render` 无并发（18 起 `createRoot`）
- 数据获取的 Suspense 旧路：手写 throw promise / 实验缓存 → 19 的 `use`（P-32-1）
#### 九、新动向【尝鲜】
- 19.3：`<ViewTransition>` 稳定（`enter` / `exit` / `update` / `share` / `default` / `name`）、`addTransitionType`、Transitions 独立渲染、Strict Mode hydration 双调 Effects、`browser()`（19.2.8 均不可用）
#### 十、动手练习
- 练习 1：搜索框 + 大列表，用 `useDeferredValue`。可断言结论：输入框值同步更新，列表用旧值渲染期间 `deferred !== value`
- 练习 2：`lazy` + Suspense + 边界，模拟 import 失败。可断言结论：失败时显示边界 fallback 而非 Suspense fallback
- 练习 3：`<Activity mode="hidden">` 包 Tab。可断言结论：切回后 Tab 内计数 state 保留，且 hidden 期间 effect cleanup 被调用
#### 参考
- https://react.dev/reference/react/useTransition；/startTransition；/useDeferredValue（站点 19.3，2026-09-17）
- https://react.dev/reference/react/Suspense；/use；/lazy；/Activity；/StrictMode（2026-09-17）
- https://react.dev/reference/react/ViewTransition；/addTransitionType；https://react.dev/blog/2026/09/09/react-19-3（【尝鲜】，2026-09-17）
- https://react.dev/blog/2025/10/01/react-19-2；/blog/2024/12/05/react-19（2026-09-17）
- https://reactrouter.com/7.18.4/api/data-routers/RouterProvider（v7，2026-09-17）
- https://vuejs.org/guide/built-ins/suspense.html；/guide/components/async.html；/guide/built-ins/keep-alive.html（Vue 3.5，2026-09-17）
- node_modules/@types/react/index.d.ts:782, 789, 817, 1611, 1861, 1878, 1885, 1971-1973, 1995-2015；node_modules/@types/react/canary.d.ts:109, 114

### 33. 服务端与 RSC 概念课（新题）

#### 一、30 秒面试速答
- 三个维度分清渲染模式：HTML 谁产（浏览器 / 服务器）、何时产（请求时 / 构建时）、组件代码跑在哪（只服务端 / 两端）。CSR 是本仓库（Vite + `createRoot`），SSR 每次请求出 HTML 再 hydrate，SSG 构建时预渲染，RSC 让一部分组件只在服务端运行、代码不进 bundle。
- RSC 不等于 SSR：SSR 说的是「HTML 怎么产」，Server Component 说的是「组件代码在哪跑、进不进浏览器」；Client Component 也会被服务端渲染成 HTML。
- `'use client'` 标记模块依赖图的客户端边界（不是渲染树），没有标记 Server Component 的指令；`'use server'` 标记可从客户端调用的服务端函数（Server Functions），传给 action 的才叫 Server Action。
- Server Function 的参数完全由客户端控制：每个函数内部自己鉴权 + 校验；「页面没渲染按钮」不是安全边界。
- React 19 起组件里直接写 `<title>` / `<meta>` / `<link>` 会被 hoist 到 `<head>`，CSR、流式 SSR、RSC 都可用；`<title>` 的 children 必须是单一字符串。
#### 二、核心概念（React）
- 课程边界：本课是概念课。仓库仍是 Vite CSR（src/main.tsx:13 `createRoot`），不安装 Next.js；唯一动手部分只用已装的 `react-dom/server` / `react-dom/static` 在 Node 里跑一次。
- 渲染模式总表：CSR / SSR / SSG / ISR / RSC 按三维度列表；本仓库入口就是 CSR 样本（空壳 HTML + JS 接管）。
- SSR 与 hydration：`react-dom/server` 的流式 `renderToPipeableStream`（Node）/ `renderToReadableStream`（Web Streams）为主线，`renderToString` / `renderToStaticMarkup` 为 Legacy；客户端 `hydrateRoot` 接管已有 HTML；两端输出必须一致，mismatch 当 bug 处理，确有差异用 `useEffect` 改状态或单层 `suppressHydrationWarning`；19 起 mismatch 合并成一条带 diff 的日志。
- SSG：`react-dom/static` 的 `prerender` / `prerenderToNodeStream` 等所有 Suspense 边界 resolve 后一次性返回；ISR 是框架层「构建后按需再生成」。
- RSC：定义（逐字 "renders ahead of time, before bundling, in an environment separate from your client app or SSR server"）；可在构建时跑一次或每请求跑；限制（无 state / effect / 事件 / 浏览器 API）；可写 `async` 组件；收益（重依赖不进 bundle、直接读数据源）；React 19 稳定但 bundler / framework 底层 API 不遵 semver，需要框架（Next App Router 完整实现）。
- 指令与边界：`'use client'` 放文件顶部，被标记模块的全部传递依赖进客户端 bundle，子树不必逐个标；没有 Server Component 指令，`'use server'` 只标 Server Functions；组合规则：Client 不能 import Server，可经 `children` / props 接收其渲染结果；Context Provider 与第三方交互组件各包一层 client 文件；跨边界 props 只能是可序列化类型（清单）。
- Server Functions：`'use server'` 只用于 async 函数（函数体顶部或文件顶部）；三种调用 `<form action={fn}>`（JS 未加载也能提交）、`useActionState(fn, init, permalink)`（hydration 前提交会重放）、`startTransition` 内调用取 `isPending`；Actions 家族本身 → 31；安全：参数不可信、函数内鉴权、Next 的 POST 端点 / Origin 检查 / action ID 加密只是纵深防御；`import 'server-only'`、`NEXT_PUBLIC_` 前缀。
- App Router 流程与元数据：Server Components 渲染成 RSC Payload（渲染结果 + Client 占位与 JS 引用 + props）→ 首屏 HTML → Payload 调和 → hydrate，后续导航只取 Payload；数据进树靠 Server Component 里 `await` 或 promise + `use()`；变更后 `revalidatePath` / `revalidateTag` / `redirect`（会 throw）。React 19 元数据：`<title>` / `<meta>` / `<link>` hoist，`<title>` 单一字符串且同时只渲染一个，`<link rel="stylesheet" precedence>` 去重 / Suspend / 排序，`preinit` / `preload` / `preconnect` / `prefetchDNS`。
#### 三、Vue 对照
- Vue SSR 定义与取舍（time-to-content / 统一心智模型 / SEO；代价：浏览器专属代码只能放特定钩子、需 Node 服务器、服务端负载）；官方推荐需要 SSR 时用框架（官方框架列表列有 Nuxt）。
- API 对照：`renderToString(app)` / `renderToNodeStream` / `renderToWebStream`（`vue/server-renderer`）对 `react-dom/server`；`createSSRApp(App).mount('#app')` 对 `hydrateRoot`。
- 生命周期：服务端只跑 setup 根作用域（`beforeCreate` / `created`），`onMounted` / `onUnmounted` 不跑；`onServerPrefetch` 返回 Promise 时服务端等待，对照 Server Component 的 `await`——但 Vue 是同一组件多跑一个钩子，不是独立组件类型。
- hydration mismatch 三大原因（无效嵌套 `<p><div>`、随机值、时区）；3.5 `data-allow-mismatch="text|children|class|style|attribute"` 对照 `suppressHydrationWarning`（Vue 可按类型细分）。
- 跨请求状态污染：模块级单例 store 在服务端被多请求共享 → 每请求新建 app + router + pinia（→ 16）；服务端响应式默认关闭。
- 无对应物：`'use client'` / `'use server'`、RSC Payload——Vue 组件代码总会进客户端 bundle，没有模块图边界；`<title>` 自动 hoist——Vue 核心不管 `<head>`，交给 Nuxt `useHead` 或手写 `useSSRContext`；`prerender`——SSG 交给 VitePress / 框架。
#### 四、关键区别
- 「谁产 HTML」与「代码在哪跑」是两个轴：React 19 + Next 16 App Router 有 RSC 这一轴；Vue 3.5 SSR 只有前一轴（同构、同一份代码两端跑）。
- 边界声明方式：React 用文件级指令切模块图（RSC 环境下才有意义，Vite CSR 里写 `'use client'` 无效果）；Vue 用生命周期钩子区分（`onMounted` 只在客户端）。
- 数据进组件：RSC 在组件内 `await`（无需 API 路由）；Vue 用 `onServerPrefetch` / Nuxt `useAsyncData`；Pages Router 时代是 `getServerSideProps` 先取再作 props。
- 变更提交：Server Functions 是带 action 语义的 RPC（19.0 起）；Vue / Nuxt 走 server routes + fetch，没有编译器生成的引用。
- 元数据：React 19.0 起内置 hoist（任何渲染模式）；Vue 3.5 无内置，框架负责。
- hydration 差异容忍：React 单层 `suppressHydrationWarning`；Vue 3.5 `data-allow-mismatch` 分类型。
#### 五、常见追问与回答要点
- RSC 里能用 `useState` 吗 → 不能（不进浏览器）；交互部分抽成 `'use client'` 叶子，Server Component 通过 `children` 把静态内容塞进去。
- Client Component 会在服务端渲染吗 → 会（首屏 HTML），只是代码也会下发并 hydrate；表：Server Component 服务端 Yes / 浏览器 No，Client Component Yes / Yes。
- 为什么 Provider 要包成 client 文件 → Context 是客户端 API；Provider 只包 `{children}`，children 仍可是 Server Components。
- 为什么参数必须视为不可信 → 任何人都能构造 POST 调用 action；鉴权、校验、返回值收窄写在函数内；渲染期门禁只影响 UI。
- `<title>` 为什么不能写 `订单 {n} 条` → children 必须单一字符串，写 `{`订单 ${n} 条`}`；渲染多个 `<title>` 行为未定义，一页一个。
- 本仓库要 SSR 怎么办 → 用 Next App Router 或 React Router Framework 模式，不自建 `renderToPipeableStream` + hydrate 流水线。
#### 六、易错点
- 把 `'use server'` 当成「标记 Server Component」——它只标函数；Server Component 是默认，不写指令。
- 在 Client Component 里 `import` Server Component（报错）；正确做法是父级 Server Component 把它作为 `children` 传入。
- 跨边界传函数 / 类实例 / Date 之外的不可序列化值；把 promise 在 Client 里创建再 `use()`（应在 Server 创建后传下）。
- 渲染期间读 `window` / `Date.now()` / 随机数 → hydration mismatch；改进 `useEffect`。
- `renderToString` 里 `useEffect` 不会执行、Suspense 不流式——别用它验证副作用。
- Vue：模块级 `reactive()` store 在 SSR 下跨请求泄漏；`onMounted` 里的代码以为服务端也会跑。
#### 七、生产环境注意
- 演示简化：本课不安装 Next，App Router 代码只在注释里示意；练习用 `renderToString`（Legacy、非流式）只为看输出，生产用流式 API 或框架。
- `'use client'` 尽量下沉到交互叶子；Server Component 只通过 `children` / 可序列化 props 传给 Client。
- 每个 Server Function：鉴权 + 校验入参（FormData 当不可信）+ 收窄返回值；含密钥模块 `import 'server-only'`；删除类操作二次确认。
- Hydration：渲染期不读浏览器专属值；`suppressHydrationWarning` 只作单层逃生口；Vue 侧 `data-allow-mismatch` 只标不可避免差异。
- 元数据：一页一个 `<title>`，children 用模板字符串；样式表带 `precedence` 才有去重与顺序保证。
- Vue：每请求新建 app / router / pinia；浏览器 API 放 `onMounted`。
#### 八、旧写法对照【旧写法】
- `ReactDOM.hydrate` / `ReactDOM.render`（19.0 移除，改 `hydrateRoot` / `createRoot`）；`renderToString` 非流式（18 起流式 API 为主线）。
- 元数据靠 `react-helmet` 或 `useEffect` 改 `document.title`（19.0 起内置 hoist）。
- Next Pages Router 的 `getServerSideProps` / `getStaticProps` / `getStaticPaths`（Next 13 App Router 起改为 Server Component 内直接取数）。
- 2024-09 前统称 "Server Actions"（现为 Server Functions ⊃ Server Actions）。
- Vue 2 `vue-server-renderer` 包（Vue 3 改 `vue/server-renderer`，3.5 基线）。
#### 九、新动向【尝鲜】
- React 19.2【较新】：Partial Pre-rendering（`prerender` 返回 `postponed` → `resume` / `resumeToPipeableStream`）、SSR Suspense 边界批量揭示、Node 上 Web Streams SSR、`cacheSignal`（RSC-only）；Next 16 Cache Components（`cacheComponents: true`）把 PPR 作为默认行为。
- React 19.3（2026-09-09，未安装）：`use(browser())` 让组件在服务端 Suspend、客户端不 Suspend（退出 SSR 不报 recoverable error）；`<Context>` 可在 Server Components 直接渲染；Strict Mode 在 hydration 时双调 Effects。
- Vue 3.6 rc（未稳定）：Vapor Mode 与 SSR 的关系文档未定，不展开。
#### 十、动手练习
- 练习 1：在 Node 里用 `react-dom/server` 的 `renderToString` 渲染一个含 `useState` 初始值、`useEffect` 里 `setState`、以及读 `window` 的三个小组件。可断言结论：输出字符串包含 `useState` 初始值对应的文本；`useEffect` 里的 `setState` 不影响输出（effect 不在服务端运行）；读 `window` 的组件在 Node 下抛 `ReferenceError`，证明「浏览器专属代码只能放 effect」。
- 练习 2：在本仓库（CSR）任一组件里渲染 `<title>{`订单 ${n} 条`}</title>`。可断言结论：render 后 `document.title === '订单 5 条'`，且 `document.body` 内没有 `<title>` 元素（被 hoist 到 `<head>`）；改写成 `<title>订单 {n} 条</title>` 时 `console.error` 被调用（children 非单一字符串警告）。
#### 参考
- https://react.dev/reference/rsc/server-components；/reference/rsc/server-functions；/reference/rsc/use-client；/reference/rsc/use-server（React 19.3 站点，2026-09-17）
- https://react.dev/reference/react-dom/server；/reference/react-dom/static/prerender；/reference/react-dom/client/hydrateRoot；/reference/react-dom/components/title；/components/meta；/components/link；/reference/react/use（2026-09-17）
- https://react.dev/blog/2024/12/05/react-19；/blog/2025/10/01/react-19-2；/blog/2026/09/09/react-19-3（2026-09-17）
- https://nextjs.org/docs/app/getting-started/server-and-client-components；/docs/app/guides/server-and-client-boundary；/docs/app/guides/server-actions；/docs/app/getting-started/mutating-data；/docs/app/getting-started/caching（Next 16.3，2026-09-17）
- https://vuejs.org/guide/scaling-up/ssr.html；https://vuejs.org/api/ssr.html；https://vuejs.org/api/composition-api-lifecycle.html；https://vuejs.org/guide/extras/ways-of-using-vue.html（Vue 3.5，2026-09-17）
- node_modules/@types/react-dom/server.d.ts:102,114,122,154；static.d.ts:104,122；client.d.ts:101；node_modules/react-dom/package.json:57,84；node_modules/@vue/server-renderer/dist/server-renderer.d.ts:17,28,30

### 34. 测试（新题）

#### 一、30 秒面试速答
- 组件测试用 Vitest（复用 Vite 配置，jsdom / happy-dom 提供 DOM）+ React Testing Library：只从用户视角查询（`getByRole` 优先）和断言（jest-dom），不测 state / 内部函数。
- `getBy` 同步必须存在、`queryBy` 允许不存在（断言「没有」）、`findBy` 异步等待（= `getBy` + `waitFor`，默认 1000ms）。
- `act` 让 React 在断言前刷完 pending 更新；RTL 的 `render` / `userEvent` / `waitFor` 已经包了 `act`，只有手动触发状态更新时才自己写 `await act(async () => …)`；19 起从 `react` 导入。
- 测 Hook 用 `renderHook` + `wrapper` 注入 Provider；测 TanStack Query 每个测试 `new QueryClient({ defaultOptions: { queries: { retry: false } } })`；测路由用 `createRoutesStub` 或 `createMemoryRouter` + `RouterProvider`。
- 定时器用 `vi.useFakeTimers()` + `advanceTimersByTime`，`userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`；MSW 是网络层 mock，本仓库数据源是内存 mockApi，用 `vi.mock` 就够。
#### 二、核心概念（React）
- 基础设施（阶段 1 安装，来自 facts-versions §2.2）：vitest 4.1.11 + @testing-library/react 16.3.3 + @testing-library/dom 10.x + @testing-library/user-event 14.6.7 + @testing-library/jest-dom 6.10.0 + jsdom 30 或 happy-dom 20 + @testing-library/vue 8.1.0；`vitest.config.ts`：`test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'], css: false }`；`src/test/setup.ts`：`import '@testing-library/jest-dom/vitest'`（不开 globals 则加 `afterEach(cleanup)`）；`npm test` = `vitest run`，接进 `check`；tsconfig `types` 加 `vitest/globals`、`@testing-library/jest-dom`。
- Vitest API：`describe` / `it` / `expect`；`vi.fn()`（`mockResolvedValue`）、`vi.spyOn(obj, key)`、`vi.mock(path, factory)`（hoist 到顶部）、`vi.stubGlobal('fetch', …)`；`clearAllMocks`（清历史）/ `resetAllMocks`（清历史 + 实现）/ `restoreAllMocks`（还原 spyOn）；fake timers：`useFakeTimers` → `advanceTimersByTime(Async)` / `runAllTimers` / `setSystemTime` → `useRealTimers`。
- RTL 理念与查询：Guiding Principle 逐字；三族 `getBy` / `queryBy` / `findBy` + `*AllBy`；优先级 `getByRole`（配 `name`）→ `getByLabelText` → `getByPlaceholderText` → `getByText` → `getByDisplayValue` → `getByAltText` / `getByTitle` → `getByTestId`；`screen.debug()` / Testing Playground。
- `render(ui, { wrapper })` 返回 `container` / `rerender` / `unmount` / `asFragment`；自动 `cleanup`；自定义 `render`（`src/test/test-utils.tsx`）统一包 `QueryClientProvider`（`retry: false`）、路由、主题 Context 并 re-export；`renderHook(() => useX(p), { initialProps, wrapper })` → `result.current` / `rerender(newProps)`。
- 异步与交互：`findBy*` / `waitFor(cb, { timeout, interval })` 回调只放断言、`waitForElementToBeRemoved`；`const user = userEvent.setup()` 在 `render` 前，所有 API `await`；`fireEvent` 只兜底；fake timers 下传 `advanceTimers`。
- `act`：定义（"a test helper to apply pending React updates before making assertions"）、RTL helpers 已包裹、必须 `await act(async …)`、从 `react` 导入、`IS_REACT_ACT_ENVIRONMENT` 由 RTL 设置；"not wrapped in act" 警告的三种来源（测试结束后仍有更新 / 手动 dispatch / 忘了 await）。
- 骨架四则：① Hook：`renderHook(() => useDebouncedValue(value, 300), { initialProps })` + `vi.useFakeTimers()` + `rerender` + `act(() => vi.advanceTimersByTime(300))`；② 路由：`createRoutesStub([{ path: '/orders/:id', Component: OrderPage, loader }])` + `render(<Stub initialEntries={['/orders/o1']} />)`，整树用 `createMemoryRouter(routes, { initialEntries })` + `<RouterProvider router={router} />`；③ 异步：`vi.mock('@/shared/mockApi', () => ({ fetchOrders: vi.fn() }))` + `mockResolvedValue` / `mockRejectedValue` / `mockResolvedValue([])` 各测 success / error / empty，竞态用手动 resolve 的 deferred；④ TanStack：每测试 `new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })` + `wrapper`，`await waitFor(() => expect(result.current.isSuccess).toBe(true))`。
- Error Boundary（20）：抛错子组件 + 断言 fallback；19 起渲染错误走 `console.error` / `window.reportError`，用 `vi.spyOn(console, 'error').mockImplementation(() => {})` 静音并断言被调用。
#### 三、Vue 对照
- Vitest 同为 Vue 官方推荐（"created and maintained by Vue / Vite team members"）；同一份 `vitest.config.ts` 跑两侧。
- 组件测试：官方 "We recommend using `@vue/test-utils`"；`@testing-library/vue`（8.1.0，基于 VTU + DOM Testing Library）与 React 侧共享 `render` / `screen` / jest-dom，但官方提醒它对 Suspense 异步组件 "should be used with caution"。
- `render(Comp, { props, slots, global: { plugins } })` 对照 `render(<Comp prop />, { wrapper })`；`mount(Comp)` 是 VTU 写法。
- composable：纯逻辑直接调用；依赖生命周期 / `provide-inject` 时用官方 `withSetup` 宿主组件，对照 `renderHook` 的 `wrapper`。
- 等待更新：`await nextTick()` / `flushPromises`（VTU），Vue 没有 `act` 概念。
- 路由：`createRouter({ history: createMemoryHistory(), routes })` + `global.plugins: [router]`，对照 `createMemoryRouter`；vue-query 用 `VueQueryPlugin` 注入，同样 `retry: false`（vue-query 测试页待核实）。
- fake timers / `vi.mock` 与框架无关，两侧同一套。
#### 四、关键区别
- 刷新时机：React 19.2 测试需要 `act`（RTL 已包）保证更新落地；Vue 3.5 只需等微任务（`nextTick`），因为响应式更新在 flush 队列里。
- 官方推荐库：React 官方文档直接指向 RTL；Vue 官方首推 `@vue/test-utils`，`@testing-library/vue` 为对照选项（Suspense 限制）。
- 路由桩：React Router 7 Data 模式有 `createRoutesStub`（Framework / Data 模式）；Vue Router 4 / 5 没有路由桩概念，用内存 history 装真路由。
- Hook vs composable：`renderHook` 内置；Vue 需自建 `withSetup`（官方示例）。
- Error Boundary 测试：React 19 错误不再 rethrow 到测试进程，需静音 `console.error`；Vue `onErrorCaptured` 返回 false 即可阻止冒泡（20 题）。
- StrictMode：入口 src/main.tsx:14 开启，测试 `render` 默认不包 → dev 下的双调 effect 在测试里看不到；需要时用 `wrapper` 包 `<StrictMode>`。
#### 五、常见追问与回答要点
- 为什么优先 `getByRole` → 能被 role + 可访问名查到 ≈ 有可访问性；`getByTestId` 只在无语义可用时并写明理由。
- `waitFor` 里为什么只放断言 → 回调会重试到超时，副作用会被重复执行。
- 为什么每个测试新建 `QueryClient` → 缓存跨测试泄漏；`retry: false` 否则错误用例等 3 次退避重试超时。
- `createRoutesStub` vs `createMemoryRouter` vs `MemoryRouter` → 复用组件依赖 `useLoaderData` 用 stub；整页 + 真实 loader 用 `createMemoryRouter`；`MemoryRouter` 只在声明式模式可用。
- jsdom vs happy-dom → happy-dom 更快但缺部分 API；出现 API 缺失再切 jsdom。
- MSW 什么时候引入 → 有真实 HTTP 层且 dev / test / Storybook 想共用 handlers 时；本仓库是内存 mockApi，`vi.mock` 足够。
- Vitest 与 Jest 差异 → ESM / Vite 转换原生支持、`vi` 代替 `jest`、`vi.mock` 同样 hoist、jsdom 需单独装。
#### 六、易错点
- 忘了 `await` user-event / `findBy` / `act`；用 `setTimeout` 等待而不是 `waitFor`。
- fake timers 下 `userEvent` 不传 `advanceTimers` 导致挂死；用完不 `useRealTimers`。
- `vi.mock` 写在 import 之后以为顺序有别（它会被 hoist）；`resetAllMocks` 把 `mockResolvedValue` 也清掉了。
- 断言 `getByText('加载中')` 在 `findBy` 之后已被移除 → 用 `queryBy` 断言不存在。
- 19 下 `import { act } from 'react-dom/test-utils'` 报错；`react-test-renderer` 已弃用。
- Vue：`@testing-library/vue` 测 Suspense 异步组件不稳定；composable 用了 `onMounted` 却不挂宿主组件。
#### 七、生产环境注意
- 演示简化：课件测试只用 `vi.mock` 替换内存 mockApi；真实项目有 HTTP 层时用 MSW `setupServer` 复用 handlers，并在 CI 里跑 `vitest run --coverage`。
- 自定义 `render` 是唯一入口（`src/test/test-utils.tsx`），测试文件禁止直接 import `@testing-library/react`。
- 断言用户可见结果（文本 / role / 禁用态 / 焦点），不断言 state 与内部函数调用；`getByTestId` 需注释理由。
- 异步统一 `await findBy*` / `waitFor`；fake timers 用例 `afterEach(vi.useRealTimers)`；`restoreAllMocks` 放 setup 的 `afterEach`。
- 每个 mockApi 方法覆盖 loading / error / empty / 竞态四类断言；路由页测试同时覆盖未登录重定向（18）。
- Vue 侧统一 Vitest；组件优先 `@vue/test-utils`，`@testing-library/vue` 用于与 React 对照且避开 Suspense。
#### 八、旧写法对照【旧写法】
- Jest + `react-test-renderer`（19.0 弃用）与 Enzyme（RTL 定位为其替代）；Jest 28+ 需单独装 `jest-environment-jsdom`。
- `import { act } from 'react-dom/test-utils'`（19.0 移除，改 `react`）。
- `@testing-library/react-hooks`（已并入 RTL `renderHook`，并入版本待核实）。
- `waitForDomChange` / `wait`（DOM Testing Library 旧 API，已由 `waitFor` 取代）。
- `react-router-dom` 的 `MemoryRouter` 导入路径（v6）→ 从 `react-router` 导入（v7，兼容 v8）。
#### 九、新动向【尝鲜】
- Vitest Browser Mode：真浏览器跑组件测试（Playwright / WebdriverIO / preview），`vitest-browser-react` / `vitest-browser-vue` 提供 `render`；`npx vitest init browser`；主线仍 jsdom。
- vitest 5 与 jest-dom 7 未满 30 天阈值，暂不升级。
- React 19.3 Strict Mode 在 hydration 时双调 Effects（影响 SSR 测试，本仓库 CSR 不受影响）。
#### 十、动手练习
- 练习 1：为 14 题 `useDebouncedValue` 写 `renderHook` + fake timers 测试。可断言结论：`rerender({ value: 'ab' })` 后 299ms 内 `result.current` 仍为 `'a'`，`advanceTimersByTime(300)` 后变为 `'ab'`；在 300ms 内连续 `rerender` 三次只产生一次值变化。
- 练习 2：为 22 题订单页写路由 + 异步测试（`createMemoryRouter` 或自定义 `render`，`vi.mock('@/shared/mockApi')`）。可断言结论：初始渲染出现「加载中」，`await findByRole('table')` 后行数等于 mock 数据条数；`mockRejectedValue` 时出现 `role="alert"` 的错误文案与「重试」按钮，点击重试后 mock 被调用两次；切换筛选后分页回到第 1 页。
#### 参考
- https://vitest.dev/guide/；/guide/environment；/config/globals；/config/setupfiles；/api/vi.html；/guide/browser/（Vitest 4.1，2026-09-17）
- https://testing-library.com/docs/react-testing-library/intro；/docs/react-testing-library/api；/docs/react-testing-library/setup；/docs/queries/about；/docs/dom-testing-library/api-async；/docs/user-event/intro；/docs/user-event/options；/docs/vue-testing-library/intro（2026-09-17）
- https://github.com/testing-library/jest-dom（6.10.0，2026-09-17）
- https://react.dev/reference/react/act；https://react.dev/reference/react/StrictMode（React 19.3 站点，2026-09-17）；node_modules/@types/react/index.d.ts:1904-1905
- https://reactrouter.com/7.18.4/start/framework/testing；/7.18.4/api/utils/createRoutesStub；/7.18.4/api/declarative-routers/MemoryRouter（react-router 7.18.4 文档，2026-09-17）
- https://tanstack.com/query/v5/docs/framework/react/guides/testing（TanStack Query 5，2026-09-17）
- https://vuejs.org/guide/scaling-up/testing.html（Vue 3.5，2026-09-17）；https://mswjs.io/docs/（③，2026-09-17）
- facts-versions §2.2（测试依赖清单）、H（peer 范围）；`npm view vitest@4.1.11 engines`（2026-09-17：node ^20 || ^22 || >=24）

### 35. 安全与可访问性（新题）

#### 一、30 秒面试速答
- React 的 JSX `{}` 和 Vue 的 `{{ }}` / v-bind 默认转义，XSS 只来自逃生口：`dangerouslySetInnerHTML` / `v-html` / `href="javascript:"`；必须渲染富文本时先用 DOMPurify 净化，CSP 只是纵深防御。
- 登录后的 `?returnTo=` 是开放重定向入口：只放行以 `/` 开头且不以 `//`、`/\` 开头的站内路径；React Router 的 `redirect()` 接受绝对 URL，所以校验必须做。
- 会话令牌放 `HttpOnly + Secure + SameSite` cookie 并配 CSRF 防护；不要把 JWT 放 localStorage（任何 XSS 都能读走）；必须用 Bearer 时 token 只留内存、刷新走 httpOnly refresh cookie。
- 前端路由守卫和按钮隐藏只影响体验，鉴权在后端逐请求做，并按当前用户校验对象归属（IDOR）。
- a11y 最低线：原生元素优先，表单 `label` + `useId`，结果 / 错误用 `aria-live`，弹窗 `role="dialog"` + 焦点陷阱 + 关闭回焦，路由切换把焦点移到标题。
#### 二、核心概念（React）
- 自动转义与逃生口：React DOM 在渲染前转义 JSX 里嵌入的值；`dangerouslySetInnerHTML={{ __html }}` 类型为 `string | TrustedHTML`，不能与 children 同用，`{ __html }` 对象在生成 HTML 处就近创建；19.3 起可直接透传 Trusted Types 对象【尝鲜】。
- 净化链路：DOMPurify.sanitize → `dangerouslySetInnerHTML`；不可信内容改用沙箱 iframe；CSP 作为额外一层。
- URL：`<a href={userUrl}>` 遇 `javascript:` React 16.9 起警告；前端 allow-list 只放行 `http(s):` 与站内相对路径；`target="_blank"` 现代浏览器默认 noopener，手写 `rel="noopener"` 是兼容习惯。
- 开放重定向：`safeRedirect(to, fallback = '/')`：`typeof to === 'string' && to.startsWith('/') && !to.startsWith('//') && !to.startsWith('/\\')` 才返回 to；loader / action 里 `throw redirect(safeRedirect(returnTo))`（→18）。
- 令牌与 Cookie：`HttpOnly`（JS 读不到）、`Secure`（仅 HTTPS）、`SameSite` Strict / Lax / None；CSRF 只在 cookie 自动携带时存在，对策 Synchronizer token / double-submit / 自定义头，SameSite 只作纵深；Bearer 头不自动携带故免疫 CSRF 但要防 XSS。
- 权限边界：前端 `can()` / RequireAuth 只做 UX；后端每个请求校验权限与对象归属；前端只传 ID 不传整条记录；密钥只在服务端，Vite 只暴露 `VITE_` 前缀变量（→33 的 `NEXT_PUBLIC_` / `server-only`）。
- aria-* 与语义：ARIA 第一规则（能用原生就用原生，加 role 不带键盘行为）；地标元素；`<label htmlFor={id}>` + `useId()`（不能作 list key、SSR 一致、19.2 起前缀 `_r_`）；`aria-describedby` / `aria-invalid` 挂错误信息；`aria-live` 播报请求结果；`aria-hidden` 只用于装饰且不能放在可聚焦元素上。
- 焦点管理：路由切换后 `useEffect(() => headingRef.current?.focus(), [location])`；模态框 `role="dialog"` + `aria-modal="true"` + `aria-labelledby`，打开时焦点进入、Tab 环绕、Esc 关闭、关闭后回到触发元素；`autoFocus` 只在对话框 / 搜索页用，首屏不抢焦点；键盘可达（Tab 组件间、方向键组件内、roving tabindex、不用正数 tabindex）。
#### 三、Vue 对照
- `{{ userText }}` / `v-bind` 自动转义 ↔ JSX `{}`；`v-html` / render 函数 `innerHTML` ↔ `dangerouslySetInnerHTML`，官方警告措辞几乎一致，Vue 额外提示 scoped 样式不作用于 v-html 内容（→01）。
- Vue Rule No.1「never use non-trusted content as your component template」：React 没有运行时模板编译，无此注入面；`:style` 点击劫持、动态事件属性两边同理。
- `:href` 不做运行时拦截，官方要求后端净化 URL ↔ React 16.9 起对 `javascript:` 警告。
- 守卫返回 `{ path: safeRedirect(to) }` ↔ `throw redirect(safeRedirect(to))`；两边都要自己校验目标（→18）。
- `<label :for="id">` + Vue 3.5 `useId()` ↔ `<label htmlFor={id}>` + React `useId()`，同为 SSR 稳定 id。
- `watch(() => route.path, () => backToTop.value.focus())`（Vue 官方 a11y 页示例）↔ `useEffect` 监听 location 后 `ref.focus()`。
- 工具：`eslint-plugin-jsx-a11y` ↔ `eslint-plugin-vuejs-accessibility`（出处待核实）；Vue 官方页列 Lighthouse / WAVE / ARC Toolkit。
#### 四、关键区别
- XSS 面：两边默认安全、逃生口一致；Vue 多一个「字符串模板」注入面（仅在用运行时编译 / 用户内容作模板时），React 没有（前提：不使用 eval / new Function）。
- URL 注入：React 16.9+ 对 `javascript:` 有运行时警告，Vue 没有；两边都应在后端 / allow-list 处理。
- 权限 / 令牌 / CSRF 与框架无关：SPA（React 或 Vue）+ Bearer 与 SSR 框架（Next / Nuxt）+ cookie 的取舍相同；Next Server Actions 内置 Origin 检查是框架级例子（→33）。
- a11y 属性写法：React 用 `className` / `htmlFor` / `tabIndex`（camelCase），aria-* 与 data-* 保持连字符（→01）；Vue 直接写 HTML 属性。
- `useId`：React 19.2.8 与 Vue 3.5 都有，语义相同（SSR / hydration 两端一致）。
- 焦点管理没有框架差异，只有「何时移」的模式差异：路由切换（→18）与对话框开关是两个必做点。
#### 五、常见追问与回答要点
- 富文本一定要渲染怎么办：DOMPurify 净化 + 注明来源可信级别；不可信改沙箱 iframe；CSP 不能替代净化。
- 为什么 `//evil.com` 也要拦：协议相对 URL 会跳外域；`/\evil.com` 在部分浏览器同样被当作协议相对；所以规则是「`/` 开头且不以 `//`、`/\` 开头」。
- `throw redirect` 与 `navigate` 的区别：前者是 loader / action 里返回的 Response（可跳外站），后者是组件内函数；两者目标都要经 safeRedirect。
- Bearer 头为什么免疫 CSRF：浏览器不会自动附带，攻击页拿不到 token；代价是 token 暴露在 JS 内存，要防 XSS。
- HttpOnly 解决什么、解决不了什么：JS 读不到 cookie（防 XSS 窃取），但 cookie 仍自动携带（需 CSRF 防护）。
- 鉴权在哪一层：后端每个请求；前端隐藏只是体验；RequireAuth 负责「别让用户看到不该看的页」，后端负责「别让请求成功」。
- 为什么 useId 而不是递增计数器 / Math.random：SSR 与客户端顺序不同会 hydration 不一致；useId 由树位置派生。
- 为什么优先原生元素：`<button>` 自带键盘触发、焦点、语义；`<div role="button">` 要自己补 tabIndex、Enter / Space、aria。
#### 六、易错点
- 把「按钮不渲染」当成安全措施（18 :369 现状就是这么写的）。
- `?redirect=` 直接 `navigate(redirect)`，没有 safeRedirect（18 :239 现状）。
- JWT 放 localStorage 并在拦截器里读出来加 Authorization 头【旧写法】。
- 把 `aria-label` 写在没有语义的 `<div>` 上、或给 `<div onClick>` 加 role 却不补键盘事件（04 的 div onClick 只是冒泡演示）。
- placeholder 当标签（07 :172）；`<label>` 与 `<input>` 没有关联（既不包裹也无 htmlFor）。
- `aria-hidden="true"` 放在可聚焦元素上；用正数 tabIndex 改顺序。
- 首屏 autoFocus 抢焦点；对话框关闭后焦点丢到 body。
- 以为 `rel="noreferrer"` 与 `noopener` 是一回事（前者还去掉 Referer）。
#### 七、生产环境注意
- 本课演示简化：登录态与权限码写死在前端（→18）、没有真实后端；真实项目每个变更接口在服务端按当前用户校验，前端 `can()` 只决定 UI。
- 富文本：统一封装 `<SafeHtml html>` 组件内部调 DOMPurify，禁止业务代码直接写 `dangerouslySetInnerHTML`；lint 规则 `react/no-danger`（eslint-plugin-react，未安装）可选。
- safeRedirect 落地为共享函数并有单测（→34）；登录后跳转只用它；Vue 侧守卫同样调用。
- 会话：`HttpOnly + Secure + SameSite=Lax` cookie + CSRF token 或自定义头；如必须 Bearer，token 只留内存，刷新走 httpOnly refresh cookie；不写 localStorage。
- 密钥只在服务端；Vite 下只暴露必要的 `VITE_` 变量，`.env` 不入库。
- a11y 工程化：引入 `eslint-plugin-jsx-a11y`（flat config `jsxA11y.flatConfigs.recommended`），跑一次 axe / Lighthouse；表单全部 `label` + `useId`；结果 / 错误 `aria-live`；弹窗用 `role="dialog"` + 焦点陷阱 + 回焦（或原生 `<dialog>.showModal()`，是否满足 APG 见待核实）。
- 路由切换后把焦点移到页面标题或 skip link（→18）。
#### 八、旧写法对照【旧写法】
- localStorage / sessionStorage 存 JWT、拦截器读出加 Authorization 头：存量极多，OWASP 明确反对；改为 httpOnly cookie 或内存 token。
- `document.cookie` 手工读 token：与 HttpOnly 矛盾，说明 cookie 没设 HttpOnly。
- `<a href="javascript:void(0)">` 当按钮：React 16.9 起警告，「future major release」将抛错；改 `<button type="button">`。
- `<div onClick>` 做按钮不补键盘 / role：改原生 `<button>`。
- 手写 `rel="noopener"`：现代浏览器 `target="_blank"` 默认 noopener，保留仅为兼容老浏览器。
- 递增计数器 / Math.random 生成表单 id：React 18 起用 `useId`（Vue 3.5 起同名）。
- `useFormState` 等 Actions 旧名与安全无关，见 31。
#### 九、新动向【尝鲜】
- React 19.3：`dangerouslySetInnerHTML` 直接透传 Trusted Types 对象供浏览器校验（19.2.8 未导出相关能力，facts-versions B）。
- Next.js Server Actions 内置 Origin / Host 检查与「Render-time gating is not a security boundary」表述（→33）。
- Vue 3.6 rc Vapor 模式对模板注入面无影响（仅提示，不展开）。
#### 十、动手练习
- 练习 1：实现 `safeRedirect(to, fallback)` 并写单测。可断言结论：`safeRedirect('/orders?status=paid') === '/orders?status=paid'`；`safeRedirect('//evil.com')`、`safeRedirect('/\\evil.com')`、`safeRedirect('https://evil.com')`、`safeRedirect(undefined)` 都返回 fallback `'/orders'`。
- 练习 2：给 07 题的表单加 `useId` + `htmlFor` + `aria-describedby` 错误提示。可断言结论：Testing Library `getByLabelText('邮箱')` 能取到 input，且提交空值后 `input.getAttribute('aria-invalid') === 'true'` 并且 `aria-describedby` 指向的元素文本为错误信息。
- 练习 3（可选）：给一个自定义对话框做焦点陷阱与回焦。可断言结论：打开后 `document.activeElement` 在对话框内；按 Esc 关闭后 `document.activeElement === 触发按钮`。
#### 参考
- https://react.dev/reference/react-dom/components/common（19.3 站点，2026-09-17）；https://react.dev/reference/react/useId；https://legacy.reactjs.org/docs/introducing-jsx.html；③ https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html
- https://vuejs.org/guide/best-practices/security.html；https://vuejs.org/guide/best-practices/accessibility.html；https://vuejs.org/api/built-in-directives.html（Vue 3.5，2026-09-17）
- https://reactrouter.com/7.18.4/api/utils/redirect；https://reactrouter.com/7.18.4/api/utils/redirectDocument（v7.18.4，2026-09-17）
- https://nextjs.org/docs/app/guides/server-actions；https://nextjs.org/docs/app/getting-started/server-and-client-components（Next 16，2026-09-17）
- ③ OWASP：Cross_Site_Scripting_Prevention、Unvalidated_Redirects_and_Forwards、Session_Management、HTML5_Security、Cross-Site_Request_Forgery_Prevention、Authorization Cheat Sheets（cheatsheetseries.owasp.org，2026-09-17）
- ③ MDN：/docs/Web/Accessibility/ARIA；/docs/Web/HTTP/Guides/Cookies；/docs/Web/HTML/Reference/Attributes/rel/noopener（2026-09-17）；③ W3C WAI APG：/practices/keyboard-interface/；/patterns/dialog-modal/（2026-09-17）
- https://github.com/jsx-eslint/eslint-plugin-jsx-a11y（README 与 docs/rules/no-autofocus.md，2026-09-17）

## 6. 需要用户决定的事项

> 已定决定（`AUDIT.md` §5.0）本轮全部维持，此处只列**新增**需要你拍板的事项。编号 D2-1 起，供最终回复引用。

**决定记录（2026-09-17，用户答复「全部按建议执行即可」）**

| 项 | 决定 |
|---|---|
| D2-1 | 保留外延解读；严重计数维持 54，阶段 2 按各条「说明」列处理 |
| D2-2 | 选 A：22 题保留 effect 手写，「七、生产环境注意」写三种生产改写；阶段 3 视时间再做 B |
| D2-3 | 阶段 1 安装 `react-error-boundary`（^6），与测试依赖一起 |
| D2-4 | 阶段 1 切换 `recommended` 预设时只记录命中，阶段 2 逐题处理 |
| D2-5 | 20 / 31 的 Vue 对照按 `callWithAsyncErrorHandling` 源码口径写，阶段 2 运行验证一次 |
| D2-6 | 来源分级维持（各包官方文档 = ②，MDN / OWASP / W3C = ③） |
| D2-7 | 规格 §6 路由样板按「5 条随 Data 主线调整、8 条照做」执行 |
| D2-8 | 阶段 2 顺序按建议：18 样板 → 三条跨题共性错误批量修正 → 主线题 → 其余题 → 新题 31–35 |

### D2-1 「严重」的定级口径：文件头承诺的外延

任务书把「严重」定义为「题目标题或文件头承诺了的【主流】知识点未讲或讲错」。对照阶段的子代理对「承诺」有两种解读：字面解读（只有文件头四段明确写到的条目）与外延解读（文件头承诺「函数组件」就包含官方 your-first-component 页的三条规则：组件名大写、禁止嵌套定义、纯函数；承诺「登录态守卫」就包含 Data 模式守卫）。批次 A（01–06、13）与 F（07 的 `useId`、31 / 32 新题）按外延解读，其余批次偏字面。结果是严重项集中在 01、18、31、32、35。

- 建议：**保留外延解读**，因为你要的是「学习完整性」，而这些条目全是面试必答；但在 §2 的严重清单里保留「说明」列，阶段 2 逐题重写时按说明处理即可。
- 若你倾向字面解读：01 的 R2-01-1～3、07 的 `useId` 一条、31 / 32 / 35 中「新题未讲」的条目应降为「概念」，严重总数会减少约 15 条。请回复「保留」或「降级」。

### D2-2 22 综合页是否在阶段 2 直接迁到 TanStack Query

§3.3 判定生产默认是 TanStack Query，22 题目前用 effect 手写请求、状态、分页与删除。两种做法：
- A（改动小）：保留 effect 手写作为「把前面所有题连起来」的综合练习，在「七、生产环境注意」写三种生产改写（TanStack / 路由 loader + action + `useFetcher` / Actions），并把 `set-state-in-effect` 会命中的探针改掉。
- B（改动大）：22 直接用 TanStack Query + `useMutation` 重写（分页 `placeholderData`、删除后 `invalidateQueries`、乐观更新），让「生产写法」落在代码里；effect 手写版本作为折叠对照保留一份。
- 建议 A（阶段 2 工作量可控；30 题已经承担 TanStack 的教学），阶段 3 若时间允许再做 B。

### D2-3 是否安装 `react-error-boundary`

§3.6 判定并排写法是 `react-error-boundary`（官方 Component 页点名；周下载约为 react 的 9%），项目当前未安装。安装则 20 题可以有可运行的并排示例（`useErrorBoundary` 把事件 / 异步错误交给边界、`resetKeys` 重试）；不安装则并排只能写在注释里。建议安装（`^6`，阶段 1 与测试依赖一起装）。

### D2-4 ESLint `recommended` 预设的时点与大纲里「lint 已生效」的表述

多批子代理实测：`eslint.config.js:33-39` 目前只手写 `rules-of-hooks` + `exhaustive-deps` 两条，**没有**启用 eslint-plugin-react-hooks 7 的 `recommended`（含 `set-state-in-effect`、`immutability`、`purity`、`refs` 等编译器规则）。这与大纲阶段「lint 已生效」的假设不符，也意味着课件里至少 10 / 11 / 12 / 14 / 21 / 22 / 23 / 24 / 26 / 27 题的探针 effect 在切换预设后会报错（各题问题表已按「生产」记录并写明规则名）。`AUDIT.md` §5.0 已决定「切换到 recommended，分两步」；请确认：阶段 1 切换预设时**只记录**命中，阶段 2 逐题改写时一并处理（与 PROGRESS.md 现有记录一致）。无需回复即按此执行。

### D2-5 31 题大纲与 Vue 源码矛盾的一条：`onErrorCaptured` 是否捕获异步错误

大纲阶段（O4）写「`onErrorCaptured` 不捕获异步 Promise 拒绝」；对照阶段（F）用 `@vue/runtime-core/dist/runtime-core.cjs.js:205-213` 证明 `callWithAsyncErrorHandling` 会对 handler 返回的 Promise 做 `.catch → handleError`，即**事件处理器 / 生命周期钩子返回的 Promise 拒绝会被捕获**，但 `setTimeout` 回调里抛的错不会。已记 P-31-1 / P-19-4 / R2-20-8。阶段 2 写 20 / 31 的 Vue 对照时按源码口径写，并在阶段 2 运行验证一次。无需回复。

### D2-6 来源清单之外的参考（已决定，记录备查）

你于 2026-09-16 决定：各包自己的官方文档（zustand、Redux Toolkit、react-error-boundary README、nextjs.org）算第 ② 级；MDN、OWASP、W3C WAI 算第 ③ 级并标明。35 题的安全内容因此有 OWASP / MDN 引用（均已标「③」）。

### D2-7 规格 §6 路由样板「其余 12 条修改点不变」需要修正为「5 条随主线调整」

`AUDIT.md` §5.12 记录的决定是「18 题主线改为 Data 模式，规格 §6 第 1 条相应调整，其余 12 条不变」。本轮逐条核对（§1 的 18 题末尾「样板修改点核对」表、§3.1）发现随主线一起变的不止第 1 条：#2「最重要的区别」要改写为「渲染前拦截 vs 渲染中拦截」并站在 Data 一侧；#3 loader `throw redirect` + middleware 从「加分点」升为主线写法；#4 三态检查改为在 loader / middleware 里 `await`（RequireAuth 三态作并排）；#10 `safeRedirect` 校验落到 loader / action。这不是推翻决定，而是把「Data 主线」落实到样板的具体条目上；其余 8 条（NavLink、`navigate(-1)` 兜底、`setSearchParams` 合并、安全表述、实例复用、Vue 守卫返回值、清理残留、ViewTransition 一句）照做。请确认按 5 条调整执行；不回复即按此执行。

### D2-8 阶段 2 的顺序建议（供参考，不必回复）

样板 18 题（Data 主线，13 条修改点中 5 条随主线调整）→ 三条跨题共性错误先做批量修正（Vue `ref` 被说成 Proxy、更新粒度被说成属性级；「没有一一对应关系」模板残留；「永远 / 根本没有 / 完全相同」绝对化）→ 主线题 07 / 19 / 11 / 30 / 14 / 16 / 20 / 26 → 其余题 → 新题 31–35。

## 附录 待核实汇总

**主会话汇总的待核实 / 需运行验证项**（各题的逐条清单见下表；编号 P-NN-k 由对照阶段给出）：

| 编号 | 事项 | 现状 | 建议怎么核实 |
|---|---|---|---|
| M-1 | eslint-plugin-react-hooks 7.1.1 `recommended` 预设下各题的实际命中 | 本轮子代理在内存中实跑（未改仓库）：12 命中 `refs` ×2（`Example.tsx:86,93`）、14 命中 `set-state-in-effect` ×1（`:114`）、17 / 26 无命中；10 / 11 / 22 / 24 / 27 的探针 effect 按规则文本判断会命中 `set-state-in-effect`；第一轮记录 21 / 23 / 24 / 27 会失败。两轮口径不同（一轮实跑、一轮按文本） | 阶段 1 切预设后跑 `npx eslint . --max-warnings=0` 一次，把命中清单写进 PROGRESS.md，阶段 2 逐题处理（D2-4） |
| M-2 | `FormEvent` 在 @types/react 19.2.18 已标 `@deprecated`，`onSubmit` 的事件类型实为 `SubmitEvent<T>`（`node_modules/@types/react/index.d.ts:2086-2091, 2314`） | 07 / 19 / 28 课件与 28 题大纲仍写 `FormEvent`；批次 J 发现 | 阶段 2 改 07 / 19 / 28 时统一改用 `SubmitEvent`；核对 `types-react-codemod` 是否有对应转换 |
| M-3 | `onErrorCaptured` 对异步错误的捕获范围 | 大纲（O4）与对照（F）结论相反；F 引 `@vue/runtime-core/dist/runtime-core.cjs.js:205-213`：handler 返回的 Promise 拒绝会被 `handleError` 捕获，`setTimeout` 回调里抛错不会 | 阶段 2 写 20 / 31 的 Vue 对照前运行验证一次（D2-5） |
| M-4 | `@testing-library/vue` 8.1.0 与 vue 3.5.42 / vitest 4 的兼容性（两年多未发版；Vue 官方组件测试推荐 `@vue/test-utils`） | 第一轮已注「阶段 1 实测」；本轮 34 题大纲建议 Vue 侧以 `@vue/test-utils` 为主、`@testing-library/vue` 为可选 | 阶段 1 安装时 `npm install` 看 peer 冲突，跑一个最小用例 |
| M-5 | `react-error-boundary` 未安装 | 20 题并排示例只能写在注释里 | 待 D2-3 决定；安装则并排示例可运行 |
| M-6 | 22 综合页 / 10 / 11 / 27 题「Effect 顶部同步 `setLoading(true)`」是否被 `set-state-in-effect` 判为错误，以及官方 useEffect 页 Fetching data 示例（同样在 Effect 内同步 `setBio(null)`）与该规则的关系 | 规则页原文与官方示例看似冲突 | 阶段 1 实跑后判断；若官方示例也命中，课件按「派生态 + 函数式更新」改建模而不是禁用规则 |
| M-7 | `<script setup>` 允许 `export type` 的起始 Vue 版本 | `@vue/compiler-sfc` 3.5.42 源码 `:25737` 证实只拒绝值导出（批次 J），起始版本未查到 | 查 vuejs/core CHANGELOG（③）；不影响课件结论 |
| M-8 | TanStack Query `fetchQuery` 已标 `@deprecated` 指向 `queryClient.query()`（`node_modules/@tanstack/query-core/build/modern/hydration-Bjs0MSgg.d.ts:465`）的起始版本；`staleTime: 'static'` 已存在（`:584`） | 批次 I 发现 | 查 TanStack Query CHANGELOG；30 题写法用 `queryClient.query()` 或 `useQuery` |
| M-9 | 本轮的 `grep0:` 依据用的是正则（脚本在题目录复跑必须 0 命中）；部分批次按 BRE 写（`\|` 分隔、`[(]` 桥式括号、`[[:space:]]`），脚本已做等价转换 | 全部 171 条复跑为 0 | 无需再核，阶段 2 改题后这些「未讲」自然转为已讲 |
| M-10 | 采用情况数据（npm 周下载）抓取于 2026-09-16，区间 2026-09-05 至 09-11 | 见 §0 | 阶段 1 复核一次即可，不必重抓 |

共 182 条（来自各题 pending）

| 编号 | 题 | 事项 | 为什么查不到 | 建议怎么核实 |
|---|---|---|---|---|
| P-01-1 | 01 | react.dev 对「inline `style` 不作为默认样式方案」的原文位置（R2-01-10 生产段依据目前只靠 grep0:演示简化） | 本轮未抓取 common#style 页原文 | WebFetch https://react.dev/reference/react-dom/components/common#applying-css-styles 要求逐字引用 |
| P-01-2 | 01 | 组件「返回带 key 的数组」是否值得写进课件（ReactNode 含 `Iterable<ReactNode>`，但 writing-markup-with-jsx 只讲 wrap） | 官方教程页无正面表述，仅类型层依据 | 阶段 2 运行验证 `return [<a key="1"/>, <b key="2"/>]` 无警告；或按保守只写「用 Fragment」 |
| P-01-3 | 01 | React 19.3 `<Fragment ref>` 在 @types/react 19.3.0 的类型定义（本地 19.2.18 `FragmentProps` 仅 `children`，index.d.ts:735-737） | 未安装 19.3 类型 | 升级 @types/react 19.3 后 Grep `FragmentProps` |
| P-01-4 | 01 | StrictMode「19.3 起 hydration 时双调 Effects」在 react.dev/reference/react/StrictMode 页的原文 | 大纲注明抓取摘要未含，目前仅以 facts-versions B 博客为据 | WebFetch StrictMode 参考页要求逐字引用 |
| P-01-5 | 01 | 练习 1 断言的警告文案（小写自定义标签的 dev 警告原文） | 未运行 | 阶段 2 运行验证并抄录 console 原文 |
| P-02-1 | 02 | JSX 无值属性默认 `true`（`<C disabled />`）在 react.dev 的原文位置（大纲已列） | passing-props / writing-markup 页均未含此句 | WebFetch https://react.dev/reference/react-dom/components/common 或 learn/typescript 要求逐字；查不到则只引 `.d.ts` 布尔属性类型 |
| P-02-2 | 02 | `ComponentProps` / `ComponentPropsWithoutRef` 无 react.dev 教程页（大纲已列） | learn/typescript 未提，仅 `.d.ts` JSDoc 引用 react-typescript-cheatsheet | 保持 ① 级依据 node_modules/@types/react/index.d.ts:1452, 1530 |
| P-02-3 | 02 | UiButton.vue:31「只删 inheritAttrs、留 v-bind=attrs 时属性会被绑两遍（class 还会重复）」：同一监听器函数经 mergeProps 是否去重、class 是否真的重复 | 需运行 | 阶段 2 运行验证：去掉 `defineOptions({ inheritAttrs: false })` 后检查 DOM class 与点击次数 |
| P-02-4 | 02 | 生产构建下 `props.x = 1` 是否静默无效（dev 有 `Object.freeze(type.props)`，prod 分支未核对）；react.dev 是否有「dev 冻结 props」原文 | 只核对了 development 构建 | Grep node_modules/react/cjs/react-jsx-runtime.production.js 是否含 freeze；`vite build` 后运行验证 |
| P-02-5 | 02 | Vue 3.5 响应式 props 解构在本项目 @vitejs/plugin-vue 版本下是否默认启用、vue-tsc 类型是否正确推断默认值去可选 | 需运行 | 阶段 2 把 OrderCard.vue 改为解构写法后跑 `vue-tsc` 与 dev server |
| P-03-1 | 03 | 大纲版本说明「本项目不启用 Compiler 但 lint 已生效」与仓库不符：eslint.config.js:33-39 只开了 `rules-of-hooks` / `exhaustive-deps`，未使用 `recommended` 预设，`set-state-in-render` / `immutability` 等编译器规则并未生效 | 大纲疑点（大纲已冻结，不改） | 阶段 1 决定是否改为 `reactHooks.configs.flat.recommended`；改后需重跑 lint 看 30 题是否新增报错 |
| P-03-2 | 03 | `Object.is` 相等时「React may still need to call your component before skipping the children」在 19.2.8 的实际触发条件（区块一「归零」连点两次是否会多打印一次组件函数执行） | 需运行 | 阶段 2 在 23 题「设为 5」连点两次观察控制台 |
| P-03-3 | 03 | React 17 及以前「只在 React 事件处理器内批处理」的官方原文出处（本轮只有 React 18 发布说明的记忆，未抓取） | 未抓取 | 抓 https://react.dev/blog/2022/03/29/react-v18 「Automatic Batching」段逐字，落点 24 题 |
| P-04-1 | 04 | React 被动事件清单（onTouchStart / onTouchMove / onWheel passive）只在 v17 RC 博客（③）摘要出现，react.dev 参考页未列（大纲已列） | 官方参考页无原文 | Grep node_modules/react-dom/cjs/react-dom-client.development.js 中 `passive` 注册逻辑取行号；或阶段 2 运行验证 onWheel 内 preventDefault 是否生效 |
| P-04-2 | 04 | `onScroll` / `onScrollEnd` 在 19.2 的冒泡行为：本地 react-dom-client.development.js:5328 显示 scroll 走 `listenToNonDelegatedEvent`，:19413 同时提到 scrollend，但 react.dev 原文只逐字核实了 onScroll | 参考页对 scrollend 无表述 | WebFetch react.dev/reference/react-dom/components/common 搜 `onScrollEnd`；或运行验证 |
| P-04-3 | 04 | react:104「渲染中 setState 触发死循环警告」的真实表现：预期抛 "Too many re-renders" 错误而非 warning | 未运行 | 阶段 2 把 `onClick={removeItem(item.id)}` 跑一次抄录 console 原文 |
| P-04-4 | 04 | React 17 正式版（非 RC）关于 root 委托 / 事件池移除的原文 | 只有 RC 博客（③）摘要 | WebFetch https://legacy.reactjs.org/blog/2020/10/20/react-v17.html 要求逐字 |
| P-04-5 | 04 | 练习 2 的断言：合成事件 `stopPropagation()` 对同一元素上原生监听器的影响、`nativeEvent.stopImmediatePropagation()` 效果 | 需运行 | 阶段 2 运行验证后再写进课件 |
| P-05-1 | 05 | Vue「`v-if` 优先于 `v-for`」自 3.x 起改变的版本原文（大纲已列） | conditional.html / list.html 摘要未给版本号 | WebFetch https://vuejs.org/guide/migration/ 的 v-if/v-for precedence 条目要求逐字 |
| P-05-2 | 05 | `hidden` 属性 / `display: none` 与 `<Activity mode="hidden">` 在 Effect / Suspense 行为上的差异细节（大纲已列，留给 32） | 本题只写一句 | 32 题核对 https://react.dev/reference/react/Activity |
| P-05-3 | 05 | react:109「JSX 不渲染的只有布尔 / null / undefined」在 `''`、`[]`、`NaN` 下的实际 DOM 输出（练习 2 断言依赖） | 未运行 | 阶段 2 运行验证并抄录 |
| P-05-4 | 05 | 练习 1「三元两分支同类型组件切换 state 保留」在 StrictMode 下的表现是否一致 | 未运行 | 阶段 2 在 StrictMode 根下验证 |
| P-06-1 | 06 | React 官方是否有「静态列表可用 index 作 key」的正面表述（大纲已列） | rendering-lists 页仅有 pitfall，无例外说明 | 按保守处理；若要写进课件，WebFetch https://react.dev/learn/rendering-lists#pitfall 要求逐字确认没有例外 |
| P-06-2 | 06 | Vue「`v-if` 优先于 `v-for`」自 3.x 起的版本原文（大纲已列） | list.html 摘要未含版本号 | WebFetch https://vuejs.org/guide/migration/ 对应条目 |
| P-06-3 | 06 | 「只在末尾追加 / 删除时 index 作 key 不会错位」（用于修正 react:10「永不增删」） | 需运行 | 阶段 2 在演示里改为末尾 push / pop 观察输入框是否错位 |
| P-06-4 | 06 | react:169「onClick={removeOrder(order.id)} 会在渲染时立即执行」在本例（setState 于渲染期）下的真实报错文案 | 需运行 | 与 P-04-3 合并验证 |
| P-06-5 | 06 | react:53「useState 初始值只在挂载那一次求值」在 StrictMode 开发期的表现（初始化函数被调用两次但只用一次结果） | 未运行；StrictMode 页原文本轮未抓取 | WebFetch https://react.dev/reference/react/StrictMode 要求逐字；阶段 2 加 console.log 验证 |
| P-07-1 | 07 | React `onChange` 在 IME 合成期间的触发细节与 `onCompositionStart / End` 写法 | 大纲待核实沿用；③ MDN / react-dom 源码本轮未抓取 | grep node_modules/react-dom/cjs/react-dom-client.development.js `compositionstart`，阶段 2 中文输入实测 |
| P-07-2 | 07 | react-hook-form「输入时不 setState / 只在订阅 formState 时重渲染」的准确表述（课件 :18 :106 写「根本不 setState」） | react-hook-form.com 本轮未抓取 | WebFetch https://react-hook-form.com/get-started 的 isolate re-renders 段并逐字引用 |
| P-07-3 | 07 | Vue 侧「无 `useId` 对应物」为课程判断 | vuejs.org 无明确声明（大纲待核实沿用） | 核 vuejs.org/guide/scaling-up/ssr 与 `useSSRContext` 是否给出 id 方案 |
| P-07-4 | 07 | 07 代码在 eslint-plugin-react-hooks 7 `recommended` 下的命中情况（`refs` 规则对事件处理器内读 `nameInputRef.current?.value` 应不命中） | 需运行；当前 eslint.config.js:34-37 只启用 rules-of-hooks / exhaustive-deps | 阶段 2 以 `reactHooks.configs.flat.recommended` 跑一次 lint |
| P-08-1 | 08 | Vue「不要在 watch 里 emit 同步父组件」无官方原文（大纲已标推论） | 官方文档未写 | 课件写成「同 React：在事件处理器里 emit」并不引用官方 |
| P-08-2 | 08 | 组件事件 `.once` 修饰符在 Vue 3.5 是否仍支持 | 大纲未逐字核实 | rg -n 'Once' node_modules/@vue/runtime-core/dist/runtime-core.d.ts 或 WebFetch vuejs.org events 页 |
| P-08-3 | 08 | 「直接改 props 对象后子组件重渲染会显示改后值」（R2-08-10 的措辞修正）需运行验证 | 需运行 | 阶段 2 在 08 题临时写 `product.name = name` 后 `setEditing(false)` 观察 |
| P-09-1 | 09 | `no-deriving-state-in-effects` 是否有 react.dev 独立文档页 | 大纲待核实，本轮未抓 | WebFetch https://react.dev/reference/eslint-plugin-react-hooks 索引页 |
| P-09-2 | 09 | 练习 2「Effect 同步版会多渲染一次」的可断言结论需运行验证 | 需运行 | 阶段 2 用 Profiler / `console.count` 计数 |
| P-09-3 | 09 | useMemo 缓存被丢弃的具体触发条件在 19.2 是否仍为文档所列（编辑文件 / 初次挂载 suspend / 未来虚拟化） | 大纲逐字取自 react.dev 当前站（描述 19.3） | 对照 19.2 归档文档或 React 源码 |
| P-10-1 | 10 | `set-state-in-effect` 是否命中 Example.tsx:291 的 `setLoading(true)`；官方 useEffect 页 Fetching data 示例自身含同步 `setBio(null)`，规则与官方示例的关系 | 规则页只给原理与 ref 例外，未列「请求前重置状态」这种情况；需运行 | 阶段 2 在 eslint.config.js 临时改用 `reactHooks.configs.flat.recommended` 跑 `npx eslint src/topics/10-effects-and-lifecycle/react` 看报错行 |
| P-10-2 | 10 | 「React 18 起不再打卸载后 setState 警告」（:405）的版本落点 | PR #22114 页面确认移除但未显示所属发布版本；react-v18 博客未含该句 | 读 https://github.com/facebook/react/blob/main/CHANGELOG.md 的 18.0.0 段 |
| P-10-3 | 10 | 大纲称 `[]` 时「setState 有稳定身份可省略」由 exhaustive-deps 认可，课件 :153 未加 disable 也未报警——需确认是规则白名单而非漏报 | lint 内部逻辑无 .d.ts 依据 | 阶段 2 运行 eslint 并对照 https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps 逐字 |
| P-11-1 | 11 | `useQuery` 的 refetchOnMount / placeholderData / throwOnError 默认值与 `enabled` / `skipToken` 关系句（继承大纲待核实） | 参考页 WebFetch 摘要未逐字给出 | 读 node_modules/@tanstack/query-core/build/modern/*.d.ts 中 QueryObserverOptions 的 JSDoc |
| P-11-2 | 11 | `set-state-in-effect` 是否命中 Example.tsx:61 的 `setState({ status: 'loading' })`；官方 Fetching data 示例自身含同步 `setBio(null)` | 规则页未列此情况；需运行 | 同 P-10-1，阶段 2 用 recommended 预设跑 eslint |
| P-11-3 | 11 | 主线判定所需的采用情况数据（@tanstack/react-query、swr、react-router 周下载；State of React 数据获取调查） | 本轮未抓 npm API | `https://api.npmjs.org/downloads/point/last-week/@tanstack%2Freact-query` 等，按规格 §3.2 排序 |
| P-11-4 | 11 | 大纲第 1 行称「空」不是第四个请求态，而文件头标题写「loading / success / error / empty」四态——标题措辞是否随主线调整 | 大纲与课件标题口径不一致 | 用户在主线判定时决定 |
| P-11-5 | 11 | Vue `<Suspense>` 与 vue-router 5 数据加载器组合用法（继承大纲待核实） | 官方页未抓 | 读 https://vuejs.org/guide/built-ins/suspense.html 与 vue-router 5 experimental 文档 |
| P-12-1 | 12 | StrictMode「多跑一次 ref 回调 setup + cleanup」从哪个版本开始（大纲待核实项延续） | 本轮未抓取 StrictMode 页，19.0 博客只写 cleanup 支持 | 读 https://react.dev/reference/react/StrictMode 的 ref callbacks 段与 github.com/facebook/react CHANGELOG |
| P-12-2 | 12 | `react-hooks/refs` 规则是否放行懒初始化写法 `if (ref.current === null) ref.current = …` | 需运行验证（本轮只对课件现有代码跑了 recommended） | 阶段 2 在本仓库写一个懒初始化例子跑 lint |
| P-12-3 | 12 | 「不返回 cleanup 时以 null 再调一次（兼容行为，未来移除）」原文 | 直接引用大纲，本轮未重新抓取 react-dom components/common 页 | WebFetch https://react.dev/reference/react-dom/components/common#ref-callback 要求逐字引用 |
| P-12-4 | 12 | Vue `shallowRef` / `markRaw` 作为「改了不更新」反例的官方原文（用于修正 vue:103 的「永远不会」） | reactivity-advanced 页本轮未抓取 | WebFetch https://vuejs.org/api/reactivity-advanced.html#shallowref、#markraw 逐字 |
| P-13-1 | 13 | `React.FC` 隐式 `children` 被移除的 @types/react 具体版本（大纲已列；本地 19.2.18 确无隐式 children） | 官方来源未核实 | 查 DefinitelyTyped 的 @types/react 18.0.0 变更记录或 react.dev 升级指南；写课件时只说「现已移除」 |
| P-13-2 | 13 | Vue「Conditional Slots」段的版本标注（大纲已列） | slots.html 摘要未含 | WebFetch https://vuejs.org/guide/components/slots.html#conditional-slots 看是否有版本徽章 |
| P-13-3 | 13 | `footer={0}` 在当前 `{footer && …}` 写法下的实际 DOM 输出（R2-13-9 / 练习 2 断言） | 需运行 | 阶段 2 运行验证 |
| P-13-4 | 13 | 练习 1「children 元素引用不变即不重渲染」在 StrictMode 开发期的日志次数（双调会让计数翻倍） | 需运行 | 阶段 2 在 StrictMode 根下验证并在课件里注明 |
| P-14-1 | 14 | React 17 项目使用 `use-sync-external-store/shim` 的官方说明（大纲待核实项延续） | 未抓取该包 README / react.dev 未收录 | 读 https://github.com/facebook/react/tree/main/packages/use-sync-external-store README |
| P-14-2 | 14 | YMNNAE「订阅外部 store」段前后完整原文（大纲待核实项延续） | 本轮直接引用大纲 / evidence 的一句 | WebFetch https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store 要求逐字 |
| P-14-3 | 14 | `useEffect + setState` 版 `useWindowWidth` 在并发渲染下的 tearing 能否在课件里稳定复现（作为主线 B 的演示证据） | 需运行验证 | 阶段 2 用 `startTransition` + 快速 resize 写演示，或退而只讲原理 |
| P-14-4 | 14 | 主线判定所需「采用情况」证据：npm 下载量无法区分「Effect 订阅」与「uSES」写法 | 无直接数据源 | 以生态事实（TanStack Query / Zustand 源码用 uSES，evidence ①）+ 官方 YMNNAE 推荐为依据，由用户拍板 |
| P-14-5 | 14 | `set-state-in-effect` 对「请求前置 `setLoading(true)`」的官方推荐替代写法 | react.dev lint 规则页本轮未抓取 | WebFetch https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect 逐字 |
| P-15-1 | 15 | 「Provider 只接收 children，children 引用不变则不随 Provider 内 state 重渲染」的 react.dev 原文位置 | 大纲待核实，本轮未抓 | WebFetch render-and-commit / memo 页，或阶段 2 运行练习 1 变体验证 |
| P-15-2 | 15 | vuejs.org/api/composition-api-dependency-injection 页「inject 只能在 setup 同步阶段调用」本轮未抓取 | 大纲摘要 | WebFetch 该页逐字 |
| P-15-3 | 15 | 练习 2「memo 后 ThemedCard 仍重渲染」需运行验证 | 需运行 | 阶段 2 Profiler / `console.count` |
| P-15-4 | 15 | `createContext` / `useContext` 签名行号（大纲引 index.d.ts:716-720,1682）本轮未复核 | 本轮 rg 只命中 Context 接口 :678 与 use :1971-1973 | rg -n 'function createContext\|function useContext' node_modules/@types/react/index.d.ts |
| P-16-1 | 16 | zustand v5 迁移页（equalityFn 移除、v5 发布日期）：`/learn/migrations/migrating-to-v5` 与 `/migrations/migrating-to-v5` 均 404；node_modules/zustand 未随包附带 docs 目录 | WebFetch 404 | 试 https://github.com/pmndrs/zustand/blob/main/docs/migrations/migrating-to-v5.md 或 `npm view zustand time` |
| P-16-2 | 16 | 「React Compiler 不改变外部 store 订阅粒度」为推论 | 无官方原文 | 阶段 2 在启用 Compiler 的分支运行练习 1 |
| P-16-3 | 16 | 练习 1「selector 返回新对象导致重复渲染 / 无限更新警告」的具体表现（v5 + useSyncExternalStore 是报错还是无限循环） | 需运行 | 阶段 2 运行验证 |
| P-16-4 | 16 | react-redux `useSelector` 默认相等比较（严格相等）与 `shallowEqual` 页本轮未抓取 | 大纲待核实 | WebFetch https://react-redux.js.org/api/hooks |
| P-16-5 | 16 | 采用数据（zustand / @reduxjs/toolkit / pinia 周下载）供主线判定 | 协议留主会话 | api.npmjs.org/downloads/point/last-week/<pkg> |
| P-16-6 | 16 | selector 里调用 store 函数 `s => s.totalPrice()`（Example.tsx:86）是否为官方认可的派生值写法 | 官方文档未见此写法 | 查 zustand docs 中 computed / derived 相关 guide |
| P-17-1 | 17 | 课件「Vue 编译器会自动缓存模板里的内联事件处理函数（相当于自动 useCallback）」的官方原文 | vuejs.org rendering-mechanism 页只列 static hoisting / patch flags / tree flattening；handler 缓存属 `@vue/compiler-dom` 的 `cacheHandlers` 选项，文档句未抓取 | 读 node_modules/@vue/compiler-core/dist/compiler-core.d.ts 的 `cacheHandlers` 注释；或 Vue SFC Playground 输出对比 |
| P-17-2 | 17 | tanstack.com/virtual 文档页超时；react-window v2 版本号与发布时间；`@tanstack/react-virtual` 当前版本（大纲待核实延续） | 两库均未安装，文档站超时 | `npm view @tanstack/react-virtual version time`；`npm view react-window versions` |
| P-17-3 | 17 | `memo` 起始版本与官方「PureComponent ↔ memo」对照句 | facts-versions 未收录；react.dev memo 页本轮未抓取该句 | WebFetch https://react.dev/reference/react/memo 与 https://react.dev/reference/react/PureComponent 逐字 |
| P-17-4 | 17 | React 19.2 Performance Tracks 的具体用法（只有博客摘录） | 大纲待核实延续 | WebFetch https://react.dev/blog/2025/10/01/react-19-2 Performance Tracks 段 + DevTools 文档 |
| P-17-5 | 17 | 本课 200 条 filter + sort 是否达到官方「≥ 1ms」阈值（若未达，示例本身就是「不值得 useMemo」的反例） | 需运行验证 | 阶段 2 用 `console.time` 在本课测量并把结论写进七段 |
| P-18-1 | 18 | eslint-plugin-react-hooks 7 `recommended` 预设是否命中 18 题代码 | eslint.config.js:34-37 只启用 rules-of-hooks / exhaustive-deps 两条，未启用 recommended 预设；静态阅读未见 set-state-in-effect / refs / purity / immutability 违规，但无法确认 | 阶段 2 临时切到 `reactHooks.configs.flat.recommended` 跑一次 lint |
| P-18-2 | 18 | 「路由参数变化时 useState 保留」与 `key={id}` 重置 | 需运行 | 34 题写测试：createMemoryRouter + `router.navigate('/orders/o2')` 后断言计数 |
| P-18-3 | 18 | Data 主线（createMemoryRouter + RouterProvider）嵌进壳应用时是否仍需 ReactIsolatedMount | 静态推断需隔离：RouterProvider 内部渲染 `<Router>`（node_modules/react-router/dist/development/chunk-BV7QT456.mjs:6991）并触发 :7143 invariant，未运行验证 | 阶段 2 运行：去掉 topicRegistry.ts:138 `isolateReactRoot` 看是否报「You cannot render a <Router> inside another <Router>」 |
| P-18-4 | 18 | 7.18.3 Data 模式 route.middleware 不开 flag 是否真正执行、执行顺序 | facts-versions.md C 说运行时不按 flag 门控（chunk-BV7QT456.mjs 无 `future.v8_middleware` 门控），未运行 | 阶段 2 用 createMemoryRouter 加 middleware，断言父→子执行顺序与「未登录子 loader 不跑」 |
| P-18-5 | 18 | 路由级 lazy 首个可用版本（outline 写 v6.9） | outline 待核实，本轮未抓 CHANGELOG | 查 github.com/remix-run/react-router CHANGELOG 6.9.0 条目 |
| P-18-6 | 18 | Vue「/orders 链接在 /orders/:id 详情页不激活」 | 已按 node_modules/vue-router/dist/vue-router.mjs:923-928（isSameRouteRecord 按路由记录匹配）静态确认，未运行 | 阶段 2 运行确认，或 34 题测试 `router-link-active` 类是否出现 |
| P-18-7 | 18 | 课件 :267 / OrdersPage.vue:16「vue-router 4 里是 string \| null \| (string \| null)[]」等版本措辞是否随安装升级改为「4 / 5」 | 当前安装 vue-router 4.6.4（package.json `^4.6.4`），基线要求安装 5.3.1；取决于阶段 1 是否升级 | 升级后统一改为「vue-router 4 / 5」，并复核 LocationQueryValue 类型未变 |
| P-18-8 | 18 | 练习 3 里 URLSearchParams 函数式更新后的序列化顺序 | 取决于 prev 的现有键顺序，未运行 | 34 题测试按实际输出断言 |
| P-19-1 | 19 | React 18+ 离散事件更新（SyncLane）在微任务中 flush 时，真实用户连续两次 click 之间是否已重渲染 —— 若已重渲染则 state guard 足够，`useRef` 锁只防同 tick 重入；大纲第 4 行「re-render 之前的连续点击都读到 false」可能过强 | 需运行验证，官方页无此粒度 | 阶段 2：真实连点 vs 同 tick 两次 `form.requestSubmit()`，记录 `submitOrder` 调用次数 |
| P-19-2 | 19 | Enter / `requestSubmit()` 绕过 `disabled` 提交按钮的规范依据 | ③ MDN / WHATWG 本轮未抓取（大纲待核实沿用） | WebFetch developer.mozilla.org HTMLFormElement/requestSubmit 与 implicit submission 段 |
| P-19-3 | 19 | 卸载后 `setState` 在 React 18+ 是否静默（无 warning） | 本轮未抓取（React 18 移除该警告为记忆） | 核 https://react.dev/blog/2022/03/08/react-18-upgrade-guide 或阶段 2 运行验证 |
| P-19-4 | 19 | Vue `onErrorCaptured` 是否接住 `async` 事件处理器的 Promise 拒绝 —— 源码 runtime-core.cjs.js:205-213 表明会；大纲 19 / 20 / 31 三处「未明说 / 不捕获」需据此修正 | 官方页未明说 | 阶段 2 运行验证：`async @click` 内 throw，观察父级 `onErrorCaptured` |
| P-20-1 | 20 | `react-error-boundary` 的 `showBoundary` / `resetErrorBoundary` / `withErrorBoundary` 签名与当前版本号 | 包未安装，无 `.d.ts`；README 中 `useErrorBoundary` 章节只剩一句（大纲待核实沿用） | 主线若选包方案，`npm install react-error-boundary` 后读 `dist/*.d.ts`；或抓 github README 的 API 段 |
| P-20-2 | 20 | eslint-plugin-react-hooks 7 `recommended` 的 `error-boundaries` 规则（「Validates usage of error boundaries instead of try/catch for errors in child components」，插件源码 :18152-18153）是否命中 EventErrorDemo 事件处理器内的 `try / catch`（预计不命中） | 需运行；当前 eslint.config.js:34-37 仅启用 rules-of-hooks / exhaustive-deps | 阶段 2 以 `reactHooks.configs.flat.recommended` 跑一次 lint |
| P-20-3 | 20 | 开发环境下被边界捕获的错误是否仍在控制台打印（Example.vue:45 的说法），以及 `onCaughtError` 默认实现 | react.dev Component 页未命中「re-thrown in development」；createRoot 页本轮只抓到回调定义句 | 重新 WebFetch createRoot 页 `onCaughtError` 默认行为段要求逐字，或阶段 2 运行观察 |
| P-20-4 | 20 | `static getDerivedStateFromError(error: Error)` 与 `@types` 的 `GetDerivedStateFromError`（`error: any`）是否影响 `ComponentClass` 静态侧检查 | 需 tsc 验证（低优先） | 阶段 2 `vue-tsc --noEmit` 已通过则关闭 |
| P-20-5 | 20 | 只在 `componentDidCatch` 里 setState 渲染 fallback 的早期写法与 `getDerivedStateFromError` 的引入版本 | 本轮未抓 16.x 发布说明 | 抓 React 16.6 博客或 github releases v16.6.0 |
| P-21-1 | 21 | `toSorted` 等方法的 ECMAScript 版本号：MDN 摘要只给 Baseline 2023-07，未写「ES2023」；TS 侧只能由文件名 lib.es2023.array.d.ts:57 推出 | WebFetch 摘要未含 | 查 tc39 proposal-change-array-by-copy 的 Stage 4 / 纳入版本；或直接以 TS lib 文件名为准并标「③」 |
| P-21-2 | 21 | Immer / use-immer 当前版本与采用份额（本项目未安装，是否值得作【主流】加分点安装） | 未查 npm | `npm view immer version time`、`https://api.npmjs.org/downloads/point/last-week/immer`；阶段 1 决定只写注释示例还是安装 |
| P-21-3 | 21 | RTK `createSlice` 内置 Immer、Zustand immer 中间件的官方原文 | 本轮未抓取 | 抓 https://redux-toolkit.js.org/usage/immer-reducers 与 https://zustand.docs.pmnd.rs/integrations/immer-middleware 逐字 |
| P-21-4 | 21 | 「先改子对象再 `setState({...state})`」在 19.2.8 的实际表现（是否重渲染、memo 子组件是否更新、旧快照是否被污染） | 需运行 | 阶段 2 写最小复现并作为 34 题测试断言 |
| P-21-5 | 21 | 大纲版本说明「已装 7.1.1」隐含 lint 生效：eslint.config.js:33-39 未启用 recommended，`immutability` 未生效 | 大纲疑点（不改大纲） | 同 P-03-1，阶段 1 统一处理 |
| P-22-1 | 22 | set-state-in-effect 是否命中 Example.tsx:58-59（setListState 在 effect 内定义的 async 函数第一行、由 `void loadOrders()` 同步调用）；react.dev 规则页只说「synchronously in an effect」，未明说嵌套函数 | 需运行 | 阶段 1 切到 recommended 后跑 `eslint src/topics/22-integrated-order-page`；命中则按六、易错点的改法重写 |
| P-22-2 | 22 | onWatcherCleanup（Vue 3.5）官方原文与签名未抓取，R2-22-10 只引 course-map §2 | 本次未抓 vuejs.org/api/reactivity-core#onwatchercleanup | 由 10 / 27 主责题抓取后引用；或读 node_modules/@vue/runtime-core/dist/runtime-core.d.ts 取签名 |
| P-22-3 | 22 | 22 题是否需要嵌入 Router（isolateReactRoot）才能演示 URL 状态 / loader 写法；壳目前只对 18 题隔离（src/shell/topicRegistry.ts:16-18） | 取决于主线判定与壳结构 | 主线定为 loader 时评估 22 加 isolateReactRoot + createMemoryRouter；定为 TanStack 时只需 vuePlugins 注册 vue-query 插件 |
| P-22-4 | 22 | useSearchParams 函数式更新与 { replace: true } 的官方文档页（reactrouter.com/7.18.4/api/hooks/useSearchParams）未抓取，R2-22-2 只引 facts-versions C 的源码行 | 本次未抓 | 18 题主责抓取后共用；或直接引 node_modules/react-router/dist/development/chunk-BV7QT456.mjs:10949-10956 |
| P-22-5 | 22 | 删除确认对话框的焦点管理原文（③ W3C APG dialog-modal）在 22-outline 标「见 35」，本题未抓 | 由 35 主责 | 35 题落盘后在七、生产环境注意引用其 evidence |
| P-22-6 | 22 | handleSaved 局部更新后行与筛选不一致（Example.tsx:107-108）——生产是否改为失效重取，取决于数据获取主线 | 主线未定 | 主线判定后在 R2-22-7 的落点统一改写 |
| P-22-7 | 22 | 大纲疑点：22-outline「URL 状态」行的来源只有 facts-versions C 与 course-map §7，无官方页 URL；「视 18 主线（Data 模式已定）」下 URL 状态应由 loader 的 request.url 读取而非 useSearchParams，两条并列写法需在 18 落地后二选一 | 大纲冻结不可改 | 阶段 1 合并时以 18 题最终代码为准，删去不适用的那条 |
| P-23-1 | 23 | 「The result from one of the calls will be ignored」的出处：大纲标为 useState 页逐字，本轮 StrictMode 页摘要未含该句 | WebFetch 摘要未含 | 抓 https://react.dev/reference/react/useState 「My initializer or updater function runs twice」段逐字 |
| P-23-2 | 23 | 未装 React DevTools 时 19.2.8 第二次渲染的 console.log 是否真的「两条一样」（课件 :125、:207 的说法） | 需运行 | 阶段 2 用无扩展的浏览器 profile 点区块一，对照官方「will appear slightly dimmed」只针对装了 DevTools 的情形 |
| P-23-3 | 23 | class 组件事件处理器里读 `this.state` 得到「最新值而非快照」的官方原文（Component 页只有「setState 不会立刻改 this.state」） | 摘要未含 | 抓 https://react.dev/reference/react/Component#state；或阶段 2 写最小 class 在 setTimeout 里读 this.state 验证 |
| P-23-4 | 23 | Vue `onRenderTracked` / `onRenderTriggered` 作为 StrictMode 对照物的官方定位 | 本轮未抓取 | 抓 https://vuejs.org/api/composition-api-lifecycle.html#onrendertracked |
| P-24-1 | 24 | Transition 内更新与紧急更新「分开批处理」的官方原文 | useTransition 页未抓取（主责 32）；19.3 发布说明只有「Transitions 独立渲染」摘要 | 抓 https://react.dev/reference/react/useTransition 与 19.3 博客逐字；阶段 2 用探针 effect 验证 startTransition + 紧急更新的提交次数 |
| P-24-2 | 24 | 探针 effect（:281-284）在 `recommended` 预设下是否真的报 `set-state-in-effect` | 当前 eslint.config.js 只手写两条规则，未运行 recommended | 阶段 2 临时切 `reactHooks.configs.flat.recommended` 跑 eslint |
| P-24-3 | 24 | `unstable_batchedUpdates` 在 React 19 官方文档 / 升级指南是否有弃用说明 | 只查到 WG #21（③）「might get removed in a future major」与 19.2.8 仍导出 | grep 19 升级指南与 19.3 发布说明；`npm view react-dom@19.3.0` 导出清单 |
| P-25-1 | 25 | Example.tsx:268 / :415 指向 10 题的「换 key 重置」「diff 规则」实际主责题（06 / 23 / 10） | 本轮只读本批课件；对 06 / 10 / 23 的一次 grep 未命中 | rg -n '重置\|卸载' src/topics/06-list-and-key src/topics/10-effects-and-lifecycle src/topics/23-rendering-and-state-snapshot |
| P-25-2 | 25 | 练习 1 断言「提升 expanded 后兄弟组件重渲染」需运行验证 | 需运行 | 阶段 2 用 React DevTools Profiler 或 `console.count` |
| P-25-3 | 25 | vuejs.org list 页「Maintaining State with key」段本轮未逐字抓取（大纲已标） | 大纲摘要 | WebFetch https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key |
| P-25-4 | 25 | Vue watch `flush: 'pre'`「不会多渲染一轮」（vue/ProductListOwnCopy.vue:20）需官方原文或运行验证 | 未抓取 watchers 页 | WebFetch https://vuejs.org/guide/essentials/watchers.html#callback-flush-timing 或阶段 2 `onUpdated` 计数 |
| P-26-1 | 26 | latest ref 模式在 react.dev 是否有任何推荐语（大纲待核实延续；本轮维持「无」） | 大纲抓取四页均未出现 | 阶段 2 再抓 https://react.dev/learn/separating-events-from-effects 全文与 useRef 页 troubleshooting 段 |
| P-26-2 | 26 | `useEffectEvent` 版本历史：实验期是否叫 `experimental_useEffectEvent`、早期 RFC `useEvent`（10 题 :222 引用了「早期提案里叫 useEvent」） | facts-versions 只记录 19.2 稳定导出 | 查 github.com/facebook/react CHANGELOG 19.2 段与 RFC 仓库 |
| P-26-3 | 26 | TanStack Query `refetchInterval` 选项的文档 URL（用于「轮询优先用 refetchInterval」的依据） | sources.md 未列 useQuery reference 页 | WebFetch https://tanstack.com/query/v5/docs/framework/react/reference/useQuery |
| P-26-4 | 26 | 课件 :481-482「提交阶段把最新回调换进槽位」的实现描述是否准确 | 需对照 react 源码 | grep node_modules/react-dom/cjs/react-dom-client.development.js 中 useEffectEvent 的 mount / update 实现 |
| P-26-5 | 26 | 课件 :14「任何时刻读 .current 都是最新的」——setState 之后、passive effect 执行之前的窗口内读 latest ref 是否可能读到旧值 | 需运行验证 | 阶段 2 用 `flushSync` + 同步读 ref 构造用例 |
| P-26-6 | 26 | eslint-plugin-react-hooks 7.1.1 对「在事件处理器里调用 Effect Event」是否报错、报哪条规则 | 本课未包含该写法，本批 recommended 实测无法覆盖 | 阶段 2 写反例跑 lint |
| P-27-1 | 27 | TanStack v4 `promise.cancel()` → v5 仅 `signal`（继承大纲待核实） | migrating-to-v5 页 WebFetch 摘要未提及 | 读 https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5 要求逐字，或 node_modules/@tanstack/query-core CHANGELOG |
| P-27-2 | 27 | React Router 文档中「loader 的 request.signal 随导航中断而 abort」的原句（继承大纲待核实）；本题依据只有源码行号 | 7.18.4 route-object / data-loading 页未写该句 | 读 https://reactrouter.com/7.18.4/api/data-routers/createBrowserRouter 或阶段 2 运行验证 |
| P-27-3 | 27 | 「React 18 起卸载后 setState 是无声 no-op」（:181）的版本落点：PR #22114 确认移除但未显示所属发布版本 | react-v18 博客未含该句 | 读 https://github.com/facebook/react/blob/main/CHANGELOG.md 的 18.0.0 段 |
| P-27-4 | 27 | `set-state-in-effect` 是否命中经 `log()` 包装的 `setLines`（:208）以及 `setState({ status: 'idle' })`（:200） | 规则页未写包装函数的处理；需运行 | 阶段 2 用 `reactHooks.configs.flat.recommended` 跑 `npx eslint src/topics/27-async-race-and-cancellation/react` |
| P-27-5 | 27 | 「✂ 已取消」日志出现在下一轮「→ 发出」之后（:325-326）的时序结论：mockApi 的 abort 监听同步 reject、catch 回调为微任务，推理成立但未实测 | 需运行 | 阶段 2 浏览器观察三个面板时间线顺序 |
| P-27-6 | 27 | 大纲「事件触发请求的竞态」（handler 持有 controller / 请求序号）无官方段落，课件 :328-330 已按工程惯例写；是否要标「非官方」由用户定 | 官方无专门段落 | 用户决定措辞 |
| P-28-1 | 28 | `<script setup>` 允许 `export type` / `export interface` 从哪个 Vue 版本开始 | vuejs.org/api/sfc-script-setup.html（2026-09-17，摘要）Restrictions 段未提导出规则；只在 compiler-sfc 3.5.42 源码 :25737 看到 `exportKind !== "type"` 才报错 | 查 github.com/vuejs/core CHANGELOG 搜 "type export" / "script setup"；或阶段 2 在 3.5.42 上写 `export interface Foo {}` 跑 `vue-tsc --noEmit` 与 `vite build` 验证 |
| P-28-2 | 28 | `FormEvent` 标 `@deprecated` 的起始 @types/react 版本，以及 react.dev/learn/typescript 是否已改用 `SubmitEvent`（大纲第 8 行仍写 `React.FormEvent<HTMLFormElement>`，与 19.2.18 类型冲突） | 只有 node_modules/@types/react/index.d.ts:2086-2091 的 JSDoc；DefinitelyTyped 变更记录与 react.dev 该页未逐字抓取 | 抓 https://react.dev/learn/typescript 搜 "FormEvent" / "SubmitEvent"；查 DefinitelyTyped types/react 提交历史；阶段 1 决定课件主线写 SubmitEvent 还是两者并列 |
| P-28-3 | 28 | `.tsx` 中泛型箭头函数需写 `<T,>` 的官方出处 | 沿用大纲待核实：typescriptlang.org/docs/handbook/jsx.html 未提及 | 查 TS 仓库 issue / handbook "Generic Arrow Functions in .tsx"；查不到则课件标「社区惯例」 |
| P-28-4 | 28 | @types/react 18 移除 `React.FC` 隐式 children 的官方说明出处（课件 :259-260 的断言） | 沿用大纲待核实：DefinitelyTyped 变更记录未抓取；本地 .d.ts:1060-1075 只能证明现状 | 查 DefinitelyTyped PR "Remove implicit children from FC"（types/react 18.0.0） |
| P-28-5 | 28 | `ChangeEvent.target` 「React 20 前保持 EventTarget & CurrentTarget」只来自 .d.ts TODO 注释 | node_modules/@types/react/index.d.ts:2105-2106 是内部注释，非官方文档承诺 | 课件只写「当前版本 target 精确」，不写 React 20 预告 |
| P-28-6 | 28 | 阶段 1 切换 eslint-plugin-react-hooks 7 `recommended` 后，`immutability`（:301 局部对象赋值 `filter.minAmount = …`）、`refs`、`purity` 等编译器规则是否命中本题 | 需运行 | 阶段 1 `npm run lint` 实测；命中则改为 `{ ...filter, minAmount }` 写法 |
| P-28-7 | 28 | 官方是否把 `withDefaults` 称为旧写法 / 3.4 及以下写法 | sfc-script-setup 页（逐字）只说解构默认值不需工厂函数；props 页（逐字）只说「3.4 及以下解构不响应」；均未给 withDefaults 贴过时标签 | 课件写「3.5 主线解构默认值；withDefaults 仍受支持，3.4 及以下用」，不写「已废弃」 |
| P-28-8 | 28 | Vue 3.5 `useTemplateRef` 自动推断类型需 language-tools 2.1，本仓库 vue-tsc 3.3.11 是否满足 | 大纲引用文档说明，未对本地版本验证 | 阶段 2 写 `useTemplateRef('input')` 不传泛型，看 vue-tsc 推断结果 |
| P-29-1 | 29 | pinia actions 页「actions can be asynchronous」原文 | 本轮未抓取（大纲已标摘要） | WebFetch https://pinia.vuejs.org/core-concepts/actions.html 要求逐字 |
| P-29-2 | 29 | 课件 :87-88 的 reducer 单测断言在 Vitest 下是否通过（`toEqual` 对 `EMPTY_CART` 同引用与 `[]`） | 需运行 | 34 题落地后写成 vitest 用例运行 |
| P-29-3 | 29 | 「真实业务里手写 useReducer 的频率不高」(:185) 无采用数据 | 观点性表述无来源 | 查 State of React 调查 useReducer 使用率并注明年份，或删掉量化措辞 |
| P-29-4 | 29 | React 19.3 是否改变 StrictMode 对 reducer / initializer 的双调行为 | facts-versions.md B 只提 hydration 时双调 Effects | 读 https://react.dev/blog/2026/09/09/react-19-3 StrictMode 段与 /reference/react/StrictMode |
| P-30-1 | 30 | Example.tsx:433-435 断言 StrictMode 下日志开头是「两条 queryFn 执行 + 一条被取消」；依赖壳是否把 Example 包在 StrictMode 内、以及 signal 是否被消费（query.js:138 只在 abortSignalConsumed 时 cancel） | 需运行 | 阶段 2 在 dev 下打开 30 题看日志；同时对比 fetchOrders 不传 signal 时是否变成两条 queryFn 无取消 |
| P-30-2 | 30 | Example.tsx:148「每次发请求都用最新一次渲染传入的 queryFn」：useBaseQuery 在 effect 里 setOptions（useBaseQuery.js:36），严格说是「最近一次提交的渲染」 | 需运行 | 阶段 2 用两次渲染传不同 queryFn 验证；或改写为「最近一次提交的 options」 |
| P-30-3 | 30 | staleTime: 'static' 与 queryClient.query()（fetchQuery 已标 @deprecated，hydration-Bjs0MSgg.d.ts:465,584）从哪个 5.x 小版本起提供、官方语义原文 | 本次未抓 useQuery 参考页与 CHANGELOG | 读 github.com/TanStack/query/blob/main/packages/query-core/CHANGELOG.md 或 docs/framework/react/reference/useQuery.md |
| P-30-4 | 30 | v5 删除 query 上 onSuccess / onError / onSettled 的官方理由（migrating-to-v5 页只给结论） | WebFetch 摘要未含理由段 | 抓 GitHub RFC / discussion 链接（migrating 页内引用）逐字摘录，写进五、追问 |
| P-30-5 | 30 | react-query → @tanstack/react-query 改包名的版本号（大纲已列待核实） | 未抓 v4 迁移页 | 读 https://tanstack.com/query/v4/docs/framework/react/guides/migrating-to-react-query-4 |
| P-30-6 | 30 | @tanstack/react-query-devtools / @tanstack/vue-query-devtools 是否与主包同版本、5.x 用法（node_modules 未安装） | 未安装、未抓取 | `npm view @tanstack/react-query-devtools dist-tags` + 官方 devtools 页 |
| P-30-7 | 30 | 与路由 loader 并用的官方写法（loader 里 queryClient.ensureQueryData）出处未抓取，四、关键区别中的【待主线判定】条目引用它 | 本次未抓 | 读 TanStack 示例 examples/react/react-router 或 docs 中 "React Router" 相关页 |
| P-30-8 | 30 | 大纲疑点：30-outline Vue 对照「vue-query 用 Vue 响应式包装 observer 结果，实现细节未逐行核实」——本次核实 useBaseQuery.js:69-70 为 toRefs(readonly(state))，可补进大纲来源 | 大纲冻结不可改 | 阶段 1 合并时把 node_modules/@tanstack/vue-query/build/modern/useBaseQuery.js:69-70 写入来源 |
| P-31-1 | 31 | 大纲 Vue 对照行「`onErrorCaptured` 不捕获异步 Promise 拒绝，需 `try / catch`」与 Vue 源码相反：runtime-core.cjs.js:205-213 `callWithAsyncErrorHandling` 对事件处理器返回的 Promise 做 `.catch` → `handleError` → `errorCaptured` | 官方页只列「Event handlers」未明说异步；大纲已冻结，不改 | 阶段 2 运行验证（`async @click` 内 throw）后在 19 / 20 / 31 三题改写对照说明 |
| P-31-2 | 31 | `requestFormReset` 的 react.dev 参考页 | 本轮未抓取，仅有 19 博客与 `@types/react-dom/index.d.ts:133` | WebFetch https://react.dev/reference/react-dom/requestFormReset |
| P-31-3 | 31 | 主线判定所需的采用情况（Actions vs 手写 submitting） | npm 下载量无法区分写法；State of React 调查本轮未抓 | 抓 State of React 2025 表单相关题；查不到则按 evidence 标签判定「并列」处理 |
| P-31-4 | 31 | 「Transition updates can't be used to control text inputs」在 `<form action>` + 受控输入组合下的实际表现（受控 `onChange` 是同步更新，理论上不受影响） | 需运行验证 | 阶段 2：受控输入 + `<form action>`，提交中继续输入观察是否卡顿 / 丢字 |
| P-32-1 | 32 | React 18 时代 Activity 的实验名（`unstable_Activity` / `Offscreen`）与「throw promise」旧式 Suspense 取数的官方表述 | 大纲待核实沿用；本轮未抓 18 文档 | 抓 react.dev 18 版归档或 github facebook/react CHANGELOG 19.2 条目 |
| P-32-2 | 32 | `useTransition` 页「Preventing unwanted loading indicators」「Exposing action props」两节仅得摘要 | 大纲待核实沿用 | 重新 WebFetch 要求逐字 |
| P-32-3 | 32 | Vue `<Transition>` 与浏览器 View Transitions API 的关系 | ③ MDN 本轮未抓取 | WebFetch developer.mozilla.org View_Transitions_API 并标 ③ |
| P-32-4 | 32 | 30 题是否讲 `useSuspenseQuery`（本批 grep `Suspense` 在 src/topics 全 30 题 0 命中） | 30 题属另批 | 由 30 题批次核对是否补「Suspense 模式只作引用」一句 |
| P-32-5 | 32 | 18 题 :468-469「mode 为 hidden 时卸载 effect」措辞是否要改为「销毁 Effects、组件不卸载」 | 18 题属另批 | 由 18 题批次判定；32 主责给全貌 |
| P-32-6 | 32 | `Activity` hidden 期间 `useLayoutEffect` / ref 回调的处理与「纯文本子节点不产生 DOM」细节 | 本轮只抓到 Activity 页 display:none / destroy Effects 句 | 重新 WebFetch https://react.dev/reference/react/Activity 要求逐字 |
| P-33-1 | 33 | vuejs.org 上「推荐 Nuxt」的原句：ssr 页只说 "Vue frameworks"，quick-start 框架列表只列名字 | 沿用大纲待核实（2026-09-17 摘要） | 课件写「官方框架列表列有 Nuxt」，不引用不存在的推荐语；或抓 https://vuejs.org/guide/extras/ways-of-using-vue.html 逐字 |
| P-33-2 | 33 | `cache()`（react）是否只对 Server Components 生效 | /reference/react/cache 未抓取 | WebFetch 该页逐字引用 "Server Components" 限定句；不确定则本课不提 `cache()` |
| P-33-3 | 33 | Create React App 弃用（2025-02）的官方出处 | /learn/creating-a-react-app 当前页未提；需 blog/2025/02/14/sunsetting-create-react-app | 抓该博客；本课「React 不自带 RSC 框架」段只引用 creating-a-react-app 页即可 |
| P-33-4 | 33 | Next PPR 独立页已不存在（重定向到 /getting-started/caching），Cache Components 与 PPR 的当前表述 | 沿用大纲；重定向页内容以摘要形式抓取 | 阶段 1 写九段时重抓 caching 页逐字 |
| P-33-5 | 33 | Vite `VITE_` 前缀环境变量才进客户端 bundle 的规则（对照 `NEXT_PUBLIC_`） | vite.dev/guide/env-and-mode 未抓取 | 抓该页逐字；本仓库 tsconfig `types` 含 `vite/client`，可顺带核对 `import.meta.env` 类型 |
| P-33-6 | 33 | react.dev 当前 Component 页是否仍把 "server-side rendering" 列在 Error Boundary 不能捕获的清单里（20 题现状行的依据） | 只核对了 20 题课件原文，未抓 react.dev 该锚点 | 抓 https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary 逐字；不再列出则 20 题该条与 33 回指都要改 |
| P-33-7 | 33 | 练习 1 在本机（Node 22.22.1、仓库无 tsx / ts-node）怎么跑 `renderToString`：直接 `node` 跑 `.mjs` 需手写 `createElement`，跑 `.tsx` 需 `vite-node` 或 `node --experimental-strip-types`（JSX 不支持） | 需运行 | 阶段 2 决定：用 34 题的 Vitest（`environment: node`）跑该练习最省事，顺便成为 34 的一条测试 |
| P-33-8 | 33 | 练习 2 在 jsdom / happy-dom 下 `<title>` hoist 与 `document.title` 是否生效、非单一字符串是否 `console.error` | 需运行；react.dev title 页写的是浏览器行为 | 阶段 2 在 34 的测试环境里实测；happy-dom 若不支持则改 jsdom |
| P-34-1 | 34 | `renderHook` 从 `@testing-library/react-hooks` 并入 `@testing-library/react` 的版本 | 沿用大纲待核实：RTL 变更记录未抓取 | 查 github.com/testing-library/react-testing-library releases（v13.1.0 附近） |
| P-34-2 | 34 | Vitest Browser Mode 当前是否已标稳定 | 沿用大纲待核实：/guide/browser/ 摘要未见 "experimental"，未逐字确认 | 重抓该页逐字；九段措辞按结果定 |
| P-34-3 | 34 | `@vue/test-utils` 的 `flushPromises` / `mount` vs `shallowMount` | test-utils.vuejs.org 未抓取 | 抓 https://test-utils.vuejs.org/api/ 逐字 |
| P-34-4 | 34 | `@tanstack/vue-query` 测试指南是否与 React 侧结论（`retry: false`、每测试新建 client）一致 | 未抓取 | 抓 https://tanstack.com/query/v5/docs/framework/vue/guides/testing（若存在） |
| P-34-5 | 34 | vitest 配置默认值：`include` glob、`css`、`restoreMocks` / `clearMocks` 默认 | vitest.dev/config/ 总页只有目录 | 阶段 1 安装后读 node_modules/vitest/dist/config.d.ts 或逐项抓子页 |
| P-34-6 | 34 | RTL 16.3.3 是否提供 `configure({ reactStrictMode: true })` 让测试也包 StrictMode（对应 src/main.tsx:14） | 未安装，无 .d.ts；testing-library.com 未抓 configure 页 | 阶段 1 安装后 grep `node_modules/@testing-library/react/types/index.d.ts` 的 `reactStrictMode`；无则用 `wrapper` |
| P-34-7 | 34 | 大纲写「当前文档要求 Node ≥ 22.12、Vite ≥ 6.4」与 `npm view vitest@4.1.11 engines`（`node ^20 \|\| ^22 \|\| >=24`、`vite ^6 \|\| ^7 \|\| ^8`）不一致，疑为 vitest 5 文档 | vitest.dev/guide/ 默认展示最新大版本 | 课件以 4.1.11 的 package.json engines 为准；本机 Node 22.22.1 两者都满足 |
| P-34-8 | 34 | jsdom 30 与 happy-dom 20 二选一（`<title>` hoist、`fetch`、`ResizeObserver` 等 API 覆盖） | 需运行 | 阶段 1 先装 happy-dom 跑 33 / 14 的练习，缺 API 再切 jsdom |
| P-34-9 | 34 | `@testing-library/jest-dom/vitest` 入口在 6.10.0 存在且类型声明可被 `types` 引用 | 未安装 | 阶段 1 安装后读 node_modules/@testing-library/jest-dom/package.json exports |
| P-34-10 | 34 | 18 题的 `isolateReactRoot` + MemoryRouter 演示壳是否影响 `createRoutesStub` / `createMemoryRouter` 测试（18 主线改 Data 模式后） | 需运行；本批未读 18 课件 | 阶段 2 在 18 重写后实测 |
| P-35-1 | 35 | React 19 对 `href="javascript:"` 是否已从警告升级为报错 | 16.9 博客只说「future major release」；react.dev 当前文档未抓到相关句（沿用 outline 待核实） | Grep `node_modules/react-dom/cjs/react-dom-client.development.js` 中 "javascript:" 相关 warning / throw；或阶段 2 运行验证 |
| P-35-2 | 35 | React `autoFocus` 的实现（挂载时调用 focus()、SSR 不输出属性） | /reference/react-dom/components/input 本轮未抓取（沿用 outline） | WebFetch 该页 autoFocus 段，逐字引用 |
| P-35-3 | 35 | 原生 `<dialog>` + `showModal()` 是否满足 APG 模态框要求（焦点陷阱 / Esc / 回焦） | APG 页未提原生 dialog（沿用 outline） | 查 ③ MDN `HTMLDialogElement.showModal()` 页 + 阶段 2 运行验证回焦行为 |
| P-35-4 | 35 | `eslint-plugin-vuejs-accessibility` 是否被 vuejs.org 推荐；与 eslint 9 flat config 兼容性 | accessibility 页抓取结果未见（沿用 outline）；插件 peer 未查 | WebFetch 该插件 README 与 `npm view eslint-plugin-vuejs-accessibility peerDependencies` |
| P-35-5 | 35 | Vite `VITE_` 前缀环境变量规则（只有该前缀才暴露给客户端） | vite.dev/guide/env-and-mode 未抓取（沿用 outline） | WebFetch https://vite.dev/guide/env-and-mode 逐字引用 |
| P-35-6 | 35 | Vue 3.5 `useId` 的官方文档句 | 只核到 `node_modules/@vue/runtime-core/dist/runtime-core.d.ts:1565` 签名（沿用 outline） | WebFetch https://vuejs.org/api/composition-api-helpers.html#useid |
| P-35-7 | 35 | DOMPurify 是否作为项目依赖引入（未安装），及 `eslint-plugin-jsx-a11y` / `eslint-plugin-react` 的 `no-danger` 规则与 typescript-eslint 8 / eslint 9 的兼容 | package.json 无三者；peer 未查 | `npm view dompurify version`、`npm view eslint-plugin-jsx-a11y peerDependencies`；由用户决定是否装 |
| P-35-8 | 35 | `/\evil.com` 在哪些浏览器会被当作协议相对 URL | 本轮未抓 WHATWG URL 规范 / MDN | 查 ③ https://url.spec.whatwg.org/ special-scheme 的 `\` 处理，或阶段 2 用 `new URL('/\\evil.com', location.href)` 运行验证 |
| P-35-9 | 35 | 「React DOM escapes any values embedded in JSX」在 react.dev（非 legacy）站点的对应句 | outline 引用的是 legacy.reactjs.org | WebFetch https://react.dev/learn/javascript-in-jsx-with-curly-braces 或 /reference/react-dom/components/common 查找等价表述 |

