# 01–04 按「使用频率」改写 · 执行 prompt

> **用法**：在新会话里发送「读 `docs/upgrade/RETROFIT-01-04-PROMPT.md`，按它执行」。
> 写于 2026-09-19（05 样板提交 dd8586c 之后）。**一次只开一个会话**：`PROGRESS.md`、README、注册表、`src/shared/` 是共享文件，并行会互相覆盖。
> 本文件和 `CONTINUE-PROMPT.md` 冲突时，01–04 的改写以本文件为准；其余事项（工程约定、验证方法、已核实的事实）以 `CONTINUE-PROMPT.md` 和 `PROGRESS.md` 为准。
>
> **执行状态（2026-09-19）：已全部完成，不用再执行。** fdbff97（01）、9ee15d0（02）、ade42f8（03）、1a8ffe7（04），记录见 PROGRESS 2.17–2.20；用户随后定了先做 06（`docs/upgrade/TOPIC06-PROMPT.md`）、02 的原生属性类型保持 ComponentPropsWithRef。本文件保留作为 01–04 改写方法的记录，后面各题按同样方法改写时可以照着用（第 3、5、6 节）。

---

## 0. 任务

你是资深前端工程师兼技术讲师，在继续升级 `D:\code\AI\learning\react`：一个「学 React（Vue 3 对照版）」学习站点，读者熟悉 Vue、在系统学 React 并准备面试。

01 组件与 JSX、02 Props、03 State、04 事件处理已经在阶段 2-C 改写过（十段文件头 + 可运行演示 + 测试），但当时同一件事的几种写法是平铺的，几乎每条都标【主流】，看不出项目里到底写哪个。用户随后定了「使用频率」写法，**05 条件渲染已按它改好，用户确认「05 可以」**。你要做的：**按 05 的样子，把 01 → 02 → 03 → 04 逐题改写，每题一个 commit**。四题做完后更新 PROGRESS、向用户汇报并**停下来**，问下一批做什么（其余已完成的题：18、07、19、11、30、14、16、20、26；还有 06 的半成品）。

不在本次范围：
- `git stash` 里说明以「wip06」开头的 06 半成品：**不要 pop、不要 drop**，也别让子代理读 `src/topics/06-list-and-key/`（stash 期间那里是旧文件）。
- 其他题、README 的叙述章节、阶段 3 / 4 的事。
- 新增知识点（例外：某件事【最常用】的写法原来没有演示，要补上，见 3.3）。
- 新增依赖、升级依赖、push、开 PR、合并分支。

## 1. 用户的要求（原话，按时间顺序）

1. 「我的目的不是让你把一个主题的所有方法都写下来，而是让你把，工业界最常见的方法写出来，或者你可以把多种方法种，最常用的标注出来」
2. （我提议「只讲最常用的，少用的删掉」之后）「这样，你把不常用的，不用删除，注释起来就好，放开的是真正常用的方法」
3. （05 改完后）「05 可以」

两个要点：**页面上运行的只有常用写法；不常用的一条都不删，注释着保留，取消注释就能运行。**

## 2. 开工前按顺序读

1. `docs/upgrade/CONTINUE-PROMPT.md` §4.3 的「**使用频率标注**」8 条：这是规则本身，本文件只是把它落到 01–04 上。同文件 §2 的可复用做法（尤其 9、11、13、14、21、24、27、35、36）和 §6 的工程约定也要看。
2. **样板 05**：`git show dd8586c --stat`，再逐个看 `src/topics/05-conditional-rendering/react/` 下的 `Example.tsx`（文件头：「使用频率」说明行、速答、二-1～5 的写法、「附」1–4、练习 3）、`BranchStylesDemo.tsx` / `PositionDemo.tsx` / `HideVsUnmountDemo.tsx`（【少用】注释块的样子）、`Example.test.tsx`（注释掉的断言、按 names 数组算的区块四测试、「附：<Activity>」独立测试），以及 `vue/Example.vue`（Vue 侧只加说明和「附」）。
3. `docs/upgrade/PROGRESS.md`：2.16（05 改写记录与注释块约定）、2.11–2.14（01–04 当初的改写记录、已核实的事实、复核改过的点）、「统一措辞」里的 Props / State / 事件三张表。
4. 本文件第 4 节：我读 01–04 文件头后做的初步盘点，是起点，不是结论。

然后：`git status`（只应有两个未跟踪的规格文件 `course-upgrade-prompt.md`、`update-project.md`，不要提交它们）、`git stash list`（应有一条 wip06）、`git log --oneline -3`（最上面是本 prompt 的提交，下面是 dd8586c）、跑一次 `npm run check` 确认基线是绿的（2026-09-19：400 条测试 / 31 个文件）。

## 3. 每题的做法（01 → 02 → 03 → 04）

### 3.1 盘点

把这一题里「同一件事有几种写法」的地方列成表（写在 scratchpad 里）：要做的事 → 各种写法 → 频率标签 → 依据。注意三点：
- **按「要做的事」算**，不是一题只留一种写法。例如 03 的「只更新一次」和「同一事件里多次更新」是两件事，各有自己的最常用写法。
- **常见错误写法不是「一种写法」**：`onClick={handleClick()}`、改 props、原地改 state 再 set 同一个引用、在组件里定义组件……这些照讲、照演示，标 ❌，不参与频率排序。
- **【旧写法】单独处理**：只为读懂存量代码的旧 API，正文仍放在「八、旧写法对照」。旧写法的可运行演示：面试高频（比如 JSX 编译成 `createElement`、`forwardRef`）的保持运行、标【旧写法】；其余按【少用】注释。

### 3.2 核实依据

- 频率判断的依据按这个顺序找：官方原文（react.dev 里「common」「most common」「isn't common」「you probably won't use」这类话）→ 官方示例和主流库官方文档里的写法（05 用了 TanStack Query 的 Overview、Redux 的 Essentials 教程）→ 主流库 / 模板的默认做法 → npm 下载量。都找不到才写「工程经验」。
- 引文逐字核对：抓官方仓库的 raw markdown（例如 `https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/learn/<页面>.md`、`https://raw.githubusercontent.com/vuejs/docs/main/src/guide/...`），用 `curl -sSfL -o` 存到 scratchpad 再 grep；网页上的 `—` 在 markdown 里是 `--`，去掉 markdown 标记后比较。
- 没开 Ultracode 时不能用 Workflow。需要时用 Agent 工具起**只读**研究代理（并发不超过 2 个），让它把结果写成 scratchpad 里的 JSON。第 4 节标了「待核实」的条目优先查。

### 3.3 改演示

- 【最常用】【常用】正常运行，界面上的小标题 / 行标题带频率标签（05 区块四的 `<p className="muted">【最常用】…</p>`）。
- 某件事【最常用】的写法原来没有演示，要补上，并配测试（05 补了「状态提升」面板）。
- **【少用】的演示注释掉，不删**。注释块约定（PROGRESS 2.16）：
  - 第一行以 `{/* 【少用】` 或 `/* 【少用】` 开头，写明怎么取消（「取消注释即可运行：删掉这一行和下面的结束行」）；最后一行单独是 `*/}` 或 `*/`。
  - 块里面不能再有块注释：原来的 JSDoc 改成 `//` 行；原来的 `{/* … */}` 说明挪到块外面，另起一行写成完整的 `{/* … */}`。
  - 被注释的定义、用法、import 一起注释（tsconfig 开了 `noUnusedLocals`，只注释用法会让定义报「未使用」）。import 单独放进一个 `/* 【少用】… */` 块（05 的 `import { Activity } from 'react'`）。
  - **整个区块都是【少用】时**（例如 04 区块六），在 `Example.tsx` 里把这个区块的渲染和 import 用【少用】注释块包起来，组件文件保留；它自己的测试直接渲染组件，照样运行。整页测试里的区块标题列表同样用注释块处理（参考 05 区块四测试的 names 写法）。
- 区块内部夹着【少用】片段时（例如 04 区块三混着原生监听器的执行顺序实验），可以把那部分拆成单独的小组件，再整体注释。

### 3.4 改测试

- 和注释掉的演示对应的断言，用同样的【少用】注释块包起来（「演示里取消 … 的注释后，这里也取消注释」）。
- 测试尽量写成不依赖面板数量的形式：names 数组 + 注释块里的 `names.push(…)`，日志期望值用数组算出来；按钮文案别写死数量（05 把「隐藏四块面板」改成了「隐藏面板」）。
- 文件头里仍标「测试覆盖」的【少用】结论，要另写一条独立组件的测试来验证（05 的「附：<Activity mode="hidden">」），保证演示注释着的时候结论照样被验证。原来就是独立探针的测试不用动。
- 测试条数可以增加，不应减少（被注释的断言不算删除）。

### 3.5 改文件头（`react/Example.tsx` 十段，`vue/Example.vue` 精简头）

- 「成熟度」下面加「使用频率」说明行，文字照抄 05（改成本题的情况）。
- 一、30 秒速答只用【最常用】。
- 二～七的正文只写【最常用】【常用】，每条写依据；带频率标签的写法，成熟度是【主流】时不再重复标，【较新】【尝鲜】【旧写法】照标。
- 【少用】写法和只为「说全」的细节（源码行号链、边角行为、实测过程）**不删**，挪到文末新增的「附：少用的写法与细节」（放在「十、动手练习」和「参考」之间），正文留一句「演示已注释，见附 N」。五、六里面试常问的问答和易错点保留在原位。
- 可以加一道练习：取消某个【少用】演示的注释并跑测试（05 的练习 3）。
- **JSDoc 文件头里不能出现 `*/`**（写「删掉注释块的第一行和最后一行」，不要把 `*/}` 写进去）。
- `vue/Example.vue`：加一行使用频率说明（Vue 侧按 Vue 项目里的频率判断，v-if / v-show 这类 Vue 常用写法不注释）；从正文挪走的细节放进「附：细节」。
- 本题已有的「统一措辞」照用，不另起说法。

### 3.6 验证（每题都做全）

1. `npm run check`（lint → typecheck → test → build）全绿；用管道截输出时加 `set -o pipefail`。
2. **注释里的代码能跑**：先 `cp -r src/topics/<题>/react <scratchpad>/backupNN`，用 5.1 的脚本取消本题全部【少用】注释块，跑 `npx eslint src/topics/<题> --max-warnings=0`、`npm run typecheck`、`npx vitest run src/topics/<题>`，全绿后把备份拷回，`diff -r` 确认一致。
3. **什么都没丢**：用 5.2 的脚本检查 HEAD 版本里这一题所有「」引文在改写后仍然存在（05：80 条、缺失 0）。缺失的要么补回（放进「附」），要么在 PROGRESS 里写明为什么这条引文本来就是错的。
4. CONTINUE-PROMPT §4.6 的收尾检查（`没有一一对应关系`、绝对化用词、交叉引用、CRLF）。
5. 浏览器：临时在 `.claude/launch.json` 加 5174 配置（`npm run dev -- --port 5174 --strictPort`），`preview_start` → 页面里先包一层 console.error / console.warn 收集 → 用 `javascript_tool` 一次点完本题 React 侧改过的区块并读回结果（面板隐藏时截图会失败，以脚本结果为准）→ `preview_stop` → `git checkout -- .claude/launch.json`。**用户自己在 5173 跑着 dev 服务器，不要碰。**

### 3.7 复核

每题写完后起 1 个**反驳式复核代理**（只读），让它逐条查：频率标签的依据是否成立、引文是否逐字（给它 raw markdown 的存放路径）、有没有内容从正文消失却没进「附」、注释块取消后能不能跑（让它自己跑一遍 5.1 的脚本，在备份上操作）、和 05 样板的写法是否一致、「统一措辞」是否照用。结果写成 scratchpad 里的 `review.json`（id / file / line / category / severity / problem / evidence / suggestion），主会话用 node 拍平后逐条改。前几题的复核每次都查出 20 条以上实打实的问题，这一步不要省。

### 3.8 收尾与提交

- `PROGRESS.md`：「每题状态」表里这一题的行末尾追加「2026-09-19 按使用频率改写（见 2.1x）」；新增一节 2.17（01）/ 2.18（02）/ 2.19（03）/ 2.20（04），格式照 2.16：起因一句、改动（文件头 / 演示 / 测试 / Vue 侧）、频率判断与依据表、注释掉了什么、验证结果、复核改了几条。
- 只在本题范围内更新 README 的事实行（如果区块名称或数量变了）；注册表 summary 同理。
- 提交：按显式路径 `git add`，信息格式 `NN 主题名：按使用频率改写 —— 要点`，正文列主要改动，结尾加 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`。不 push。

## 4. 初步盘点（我读 01–04 文件头与演示文件开头得出的，逐条核实后再定）

标「待核实」的是我拿不准、需要找依据的；没标的也要确认依据能写出来。

### 01 组件与 JSX（`src/topics/01-component-and-jsx/`）
- 多个节点包成一个返回值：`<>…</>`【最常用】；列表里一次返回多个节点 `<Fragment key>`【常用】；返回带 key 的数组【少用】（现在只在测试里，二-3 那句挪到附）。
- 写样式：`className` + CSS 文件 / CSS Modules / Tailwind【最常用】，依据 common 组件页「We recommend only using the style attribute when your styles depend on JavaScript variables.」；`style` 对象【常用】，只放依赖运行时数据的值。**区块一 ProfileCards 大量用行内 style 写静态样式**（七里标了「演示简化」）：看 `src/shared/` 的样式能不能承接，能就把静态部分换成 className，只留动态值在 style；换不了就保持并在界面上写明「演示简化」。区块二的 style 补 px 实验讲的是 style 本身的行为，保留运行。
- 多条件 className：`clsx` / `classnames`（待核实：npm 周下载量）与模板字符串 / `filter(Boolean).join(' ')` 哪个更常用；本项目没装 clsx，**不新增依赖**，只在正文写一句。
- default export 还是 named export：react.dev「People often use default exports if the file exports only one component, and use named exports if it exports multiple components and values.」—— 两种都常用，按团队约定，写明理由即可，不强行排序。
- JSX 转换：automatic runtime【最常用】（19 起必须）；classic / `createElement`【旧写法】，区块二右栏的编译结果对照是面试常问点，保持运行、标【旧写法】。
- Vue 侧：SFC + 模板【最常用】；渲染函数 `h()` / JSX【少用】（「Vue recommends using templates to build applications in the vast majority of cases.」）；`:class` 对象 / 数组语法【最常用】；`v-once` / `v-memo`【少用】（待核实官方措辞）；in-DOM 模板的限制【少用】。
- 候选挪进「附」的细节：带点成员表达式 `<ui.button />` 的编译（esbuild 实测）、`jsxDEV` 与 vite 源码行号、unitlessNumbers 的源码行号、StrictMode 四项里 ref 回调的双调用、18 起返回 undefined 不报错的 CHANGELOG、FunctionComponent 签名的 index.d.ts 行号、Vue `:style` 厂商前缀、Vue 在渲染函数里现场创建组件（复核实测）。
- 照讲的错误写法：小写组件名、class / for / onclick、return 后换行、在组件里定义组件、渲染时改外部变量、列表里的 `<>` 带不了 key。

### 02 Props（`src/topics/02-props/`）
- 读 props：参数里解构【最常用】（「Usually you don't need the whole props object itself, so you destructure it into individual props.」）；整个 props 对象【少用】。
- 描述类型：interface / type 两种都常用（learn/typescript「you can use an interface or type」），按团队约定。
- 默认值：解构默认值【最常用】；对象 / 数组默认值提到模块顶层常量【常用】（需要稳定引用时）；函数体里 `??` 兜住 null【常用】；函数组件的 `defaultProps`【旧写法】（「时灵时不灵」的 createElement 细节挪进附）。
- 布尔 prop 只写属性名 `<UiButton disabled>` 还是 `disabled={true}`：旧文档不推荐省略，但省略写法在现代代码里很普遍 —— **待核实**，找得到依据（例如主流组件库官方文档的示例写法）就标频率，找不到就写「两种都常见，团队约定」。
- 接收原生属性的类型：`ComponentPropsWithRef<'button'>`（@types/react 的 JSDoc 推荐）、`ComponentProps<'button'>`、`ButtonHTMLAttributes<HTMLButtonElement>` 哪个在行业里最常用 —— **待核实**：shadcn/ui 面向 React 19 的 button 源码据我记忆用的是 `React.ComponentProps<"button">`，要去 shadcn-ui/ui 仓库拿原文确认。结论如果和现在的主线（UiButton 用 WithRef）不同：两者对 DOM 元素等价（二-7 已有测试），可以把「行业最常用」和「官方类型建议」分开写，**不要为此改动主线代码**，除非依据很充分。
- className 合并：演示里的 `filter(Boolean).join(' ')`（演示简化）与 `clsx` / `cn`（tailwind-merge）—— 同 01，只写一句，不装依赖。
- ref：ref 作为 prop【最常用·19 起】；`forwardRef`【旧写法】（存量代码和要兼容 18 的组件库里还很常见，写明）。
- 子组件想改数据：调用父组件传下来的 `onXxx` 回调【最常用】。
- props 进 state：直接用 / 渲染时算【最常用】；`initialX` + 换 key 重来【常用】（编辑草稿、表单初始值）。
- children 的类型：`ReactNode`【最常用】；`ReactElement`【少用】。
- 候选挪进附：冻结的源码行号链、生产构建赋值实测的过程、legacy JSX In Depth 的出处细节、Vue `useAttrs` 能被 watch 的实测（#4161）、defaultProps 与 createElement。
- Vue 侧：`defineProps<T>()` 类型声明【最常用】；运行时对象声明（带 validator）【常用】（待核实）；3.5 解构默认值【最常用】，`withDefaults`【旧写法】；`inheritAttrs: false` + `v-bind="$attrs"`【常用】。

### 03 State（`src/topics/03-state/`）
- 基于旧值更新：只更新一次时 `setCount(count + 1)` 和更新函数都行，官方「In most cases, there is no difference between these two approaches.」；同一事件里多次更新、在定时器 / Promise 回调里基于旧值更新 → 更新函数【最常用】。按这两件事分别标。
- 要用新值做别的事：先算好存进变量 `const next = …`【最常用】（useState 页 Troubleshooting 的写法）。
- 对象 / 数组更新：展开、map、filter【最常用】；Immer【常用】（21 题）。
- 初始值：直接给值【最常用】；昂贵时惰性初始化 `useState(() => …)` / `useState(createX)`【常用】。
- state 的结构：存 id 不存对象、多个布尔值合成 status【最常用】；Group related state【常用】；深嵌套拍平成 byId【少用】→ 附。
- `useState`【最常用】；`useReducer`【常用】（逻辑分散、字段互相牵制时）。
- 区块七的两个报错：「Too many re-renders」是常见错误，照讲；「想把函数存进 state 结果被调用了」场景少见，**待定**：它是官方 Troubleshooting 的一条，而且演示和测试写得很完整 —— 倾向把它当【少用】注释掉、讲解挪进附，但要先确认区块七拆开后是否好读。
- 渲染期有条件地 set 自己的 state（记住上一次的 prop）：官方「usually best avoided」→【少用】→ 附（它现在是独立测试，不用动）。
- 候选挪进附：Object.is 急切比较与 fiber alternate 的源码行号链、RE_RENDER_LIMIT 25、mountStateImpl 采用第一次结果、dispatchSetState 的行号、setter 引用稳定的源码位置。
- Vue 侧：`ref`【最常用】（官方「the recommended way to declare reactive state is using the ref() function」）；`reactive`【常用】；其余看 `vue/Example.vue` 与 Vue 三段的内容再定。

### 04 事件处理（`src/topics/04-events/`）
- 绑定：`onClick={handleClick}`、传参 `onClick={() => remove(id)}`【最常用】；`(e) => remove(id, e)`【常用】。
- 表单提交：`<form onSubmit>` + `preventDefault`【最常用】；提交按钮的 onClick 是 ❌（照讲）。`stopPropagation`【常用】。
- 传播：冒泡 `onClick`【最常用】；`onClickCapture`【少用】（官方「Capture events are useful for code like routers or analytics, but you probably won't use them in app code.」）；**区块三里 React 委托和原生监听器的执行顺序、`stopImmediatePropagation`、`onScrollCapture`【少用】**→ 考虑把这部分拆成单独组件整体注释，讲解挪进附；onScroll 不冒泡 / onFocus 冒泡属于面试常问，保留。
- 修饰符的 JS 写法（区块五 ModifiersDemo：.once、按键、.ctrl.exact、鼠标按键）：按键 `e.key === 'Enter'`【最常用】；.self（`e.target === e.currentTarget`，在区块四）【常用】；.once（ref 标记）、.exact、鼠标按键 `e.button`【少用】—— 待核实后决定区块五留哪几行运行。
- 区块六 PassiveWheelDemo（onWheel 是被动监听、要拦滚轮得 `addEventListener('wheel', fn, { passive: false })`）：只有自定义缩放 / 横向滚动才用到 →【少用】，按 3.3「整个区块都是少用」处理，讲解挪进附。
- 事件类型：从 react 导入 `MouseEvent` 等【最常用】；`SyntheticEvent` 兜底、`XxxEventHandler`【常用】。
- 给处理函数包 `useCallback`【少用】（「Caching a function with useCallback is only valuable in a few cases」）。
- 合成事件与 root 委托：面试高频概念，照讲；源码行号挪进附。
- Vue 侧：`@click="handler"` / 内联处理器【最常用】；`.prevent` / `.stop` / `.enter`【最常用】；`.passive`【少用】；`@click.right` / `.middle` 被编译成 contextmenu / mouseup 的细节 → 附。

## 5. 脚本（用 Write 工具写到 scratchpad 的 .cjs 再执行；Bash 的 heredoc 超过约 8 KB 会失败，也遇到过吞掉反斜杠的情况）

### 5.1 取消【少用】注释块（验证用，先备份）

```js
// 用法：node uncomment-rare.cjs <目录> [--dry]
// 把目录（不递归）下 .ts / .tsx / .vue 文件里所有【少用】注释块取消注释：
// - 删掉以 `{/* 【少用】`、`/* 【少用】` 或 `<!-- 【少用】`（.vue 模板）开头、且本行没有结束符（`*/` / `-->`）的那一行；
// - 以及它后面第一行单独的 `*/}`、`*/` 或 `-->`。
// --dry 只报告数量、不写文件。先备份再跑，验证完从备份还原。
const fs = require('fs')
const path = require('path')
const dir = process.argv[2]
const dry = process.argv.includes('--dry')
let total = 0
for (const f of fs.readdirSync(dir).filter((name) => /\.(tsx?|vue)$/.test(name))) {
  const p = path.join(dir, f)
  const lines = fs.readFileSync(p, 'utf8').split('\n')
  const out = []
  let pending = null
  let n = 0
  for (const line of lines) {
    if (!pending && /^\s*\{?\/\* 【少用】/.test(line) && !line.includes('*/')) {
      pending = /^\s*\*\/\}?\s*$/
      n++
      continue
    }
    if (!pending && /^\s*<!-- 【少用】/.test(line) && !line.includes('-->')) {
      pending = /^\s*-->\s*$/
      n++
      continue
    }
    if (pending && pending.test(line)) {
      pending = null
      continue
    }
    out.push(line)
  }
  if (pending) throw new Error(`${f}：有没结束的【少用】注释块`)
  if (n) {
    if (!dry) fs.writeFileSync(p, out.join('\n'))
    console.log(`${f}：${n} 个【少用】注释块${dry ? '（dry run，未写入）' : '已取消注释'}`)
    total += n
  }
}
console.log(`合计 ${total} 个`)
```

在 05 上 `--dry` 的结果应是 11 个（BranchStylesDemo 2、Example.test 6、HideVsUnmountDemo 2、PositionDemo 1）。2026-09-19 起脚本也认 .vue 模板里的 `<!-- 【少用】` … `-->` 注释块（04 的 vue 目录 --dry 是 7 个）。

### 5.2 旧版引文是否都还在

```js
// 用法：node quotes-kept.cjs <题目录> [git 版本，默认 HEAD]
// 把该版本里题目录下所有文件的「…」引文取出来，检查现在的题目录里是否都还在（逐字，忽略空白差异）
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const dir = process.argv[2].split(path.sep).join('/').replace(/\/$/, '')
const rev = process.argv[3] || 'HEAD'
const norm = (s) => s.replace(/\s+/g, '')
const files = execSync(`git ls-tree -r --name-only ${rev} -- ${dir}`, { encoding: 'utf8' }).split('\n').filter(Boolean)
const oldText = files.map((f) => execSync(`git show ${rev}:${f}`, { encoding: 'utf8', maxBuffer: 1 << 26 })).join('\n')
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
// 注释里的引文可能跨行：新旧两边都先去掉行首的「 * 」「// 」再比较
const flat = (s) => s.replace(/\n[ \t]*(\*|\/\/)[ \t]?/g, '\n')
const newText = norm(flat(walk(dir).map((f) => fs.readFileSync(f, 'utf8')).join('\n')))
const quotes = [...new Set([...flat(oldText).matchAll(/「([^「」]{6,})」/g)].map((m) => m[1]))]
const missing = quotes.filter((q) => !newText.includes(norm(q)))
console.log(`${dir}：旧版引文 ${quotes.length} 条，缺失 ${missing.length} 条`)
for (const q of missing) console.log('  缺失：「' + q.slice(0, 120) + (q.length > 120 ? '…' : '') + '」')
process.exitCode = missing.length ? 1 : 0
```

提交前在仓库根目录跑：`node <scratchpad>/quotes-kept.cjs src/topics/<题目录>`（比较的是 HEAD，也就是这题改写前的版本）。

## 6. 已知的坑（05 改写时踩过或差点踩的）

- JSDoc 文件头里出现 `*/` 会提前结束注释、整份文件语法错误。
- JSX 注释块 `{/* … */}` 里不能再嵌 `{/* … */}`；块注释 `/* … */` 里不能有 JSDoc。
- 只注释用法不注释定义 → `noUnusedLocals` 报错；只注释定义不注释用法 → 找不到名字。取消注释时也要成对取消，注释块的第一行要写清「和哪一段一起取消」。
- 区块被注释后，整页测试里的区块标题列表、按钮文案里的数量要跟着改（写成与数量无关的形式）。
- Bash 里 `cd` 到子目录会改掉会话的工作目录；用绝对路径，或在同一条命令里 `cd` 回仓库根目录。
- 浏览器面板隐藏时截图会失败（Screenshot timed out），用 `javascript_tool` 读回结果当证据。
- Vue 侧按 Vue 项目里的频率判断，不要照搬 React 侧的标签。

## 7. 必须停下来问用户的情况

1. 频率判断会推翻已定的决定（AUDIT.md §5.0、各题主线、「统一措辞」表），或者依据显示两种写法在行业里势均力敌、又直接影响主线代码的写法（例如 02 的 `ComponentProps` 与 `ComponentPropsWithRef`，如果依据很充分、想改 UiButton 的主线类型）：列出选项和推荐，问用户。
2. 需要新增 / 升级依赖、push、开 PR、合并分支、动 wip06 的 stash。
3. 01–04 全部完成后：汇报并问下一批（18、07、19、11、30、14、16、20、26 按同样方式改写，还是先把 06 做完 —— 06 本身要直接按使用频率写法完成）。

其他情况不停：查不到的依据写「工程经验」并在 PROGRESS 里记一笔，接着做。

## 8. 会话结束前（或上下文快满时）

1. 当前题没做完：不提交半成品；在 PROGRESS.md 写清做到哪、还差什么，并把本文件里对应题的状态补一句（例如「02：演示已改、文件头未改」）。
2. 更新 PROGRESS.md 的阶段状态和「下一步」，提交文档。
3. 向用户简短汇报：完成了哪几题（附 commit）、每题注释掉了什么、有没有需要他决定的事；提示他在新会话里发送「读 `docs/upgrade/RETROFIT-01-04-PROMPT.md`，按它执行」继续。
