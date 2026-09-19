# 课件升级 · 接续执行 prompt（阶段 2 其余题 → 阶段 3 → 阶段 4）

> **用法**：在新会话里发送「读 `docs/upgrade/CONTINUE-PROMPT.md`，按它继续执行」。
> **一次只开一个会话**执行本文件：`PROGRESS.md`、`eslint-suppressions.json`、README、注册表、`src/shared/` 是共享文件，并行会互相覆盖。
> **2026-09-19 第九次更新：用户定了「使用频率」写法（§4.3），05 已按它改写成样板（dd8586c，用户确认）；01–04 已按同样方式改写（fdbff97 / 9ee15d0 / ade42f8 / 1a8ffe7，`RETROFIT-01-04-PROMPT.md`）；06 已从 wip06 恢复并直接按使用频率写法完成（efe5615，`TOPIC06-PROMPT.md`，PROGRESS 2.21）。下一步等用户定：其余九题（18、07、19、11、30、14、16、20、26）的使用频率改写，还是 08 起的新题 —— 用户没定之前不要自己开工。**
> 本文件写于 2026-09-17，2026-09-18 第七次更新（完成 2-C 的 05 之后；06 做了一半，半成品在 `git stash` 里），可以反复使用：每个会话都从 `docs/upgrade/PROGRESS.md` 的「下一步」接着做。两者冲突时以 PROGRESS.md 为准。

---

## 0. 任务

你是资深前端工程师兼技术讲师，在继续升级 `D:\code\AI\learning\react`：一个「学 React（Vue 3 对照版）」学习站点，每题一个 React 示例（主教学文件，大量中文注释）+ 一个 Vue 3 对照。读者熟悉 Vue、在系统学 React 并准备面试。目标：**学得对、学的是主流、面试能用、上生产不踩坑**。

阶段 0（两轮审计）、阶段 1（依赖与工具链）已完成；阶段 2 的 18 路由样板已完成并**经用户确认**，随后已完成 2-A（Vue 响应式措辞）、2-B 全部八题（**07、19、11、30、14、16、20、26**），以及 2-C 的 **01、02、03、04、05**。你要做的是：**先把 `git stash` 里的 06 半成品取出来做完**（见 3.3），再按编号往下做，然后阶段 3 新题 31–35 → 阶段 4 一致性检查与交付文档。

## 1. 开工前按顺序读

1. `docs/upgrade/PROGRESS.md`：当前进度、「下一步」、每题状态、遗留与待核实。
2. 仓库根目录 `course-upgrade-prompt.md`（用户写的规格，未跟踪，不要提交）：§1 工作规则、§2 验收标准、§3 成熟度标签与主流判定、§9 文件头模板、§11 完成定义。
3. `docs/upgrade/AUDIT.md` §5.0 决定表（5.1–5.16）和附录 C（两轮审计怎么合起来用）。
4. `docs/upgrade/AUDIT-ROUND2.md` §3（主线判定）和 §6（D2 决定）。
5. **样板**：`src/topics/18-routing/` 下全部文件，以及 PROGRESS.md 的 2.1 节。风格、深度、注释密度、测试写法都照它来。
6. **已完成各题的成品**（同样是样板，越往后写法越接近现在的节奏）：`src/topics/07-forms/`、`19-async-submit/`、`11-api-request-state/`、`30-tanstack-query-server-state/`、`14-composable-and-custom-hook/`、`16-global-state/`、`20-error-handling/`、`26-stale-closures/`、`01-component-and-jsx/`、`02-props/`、`03-state/`、`04-events/`、`05-conditional-rendering/`，以及 PROGRESS.md 的 2.3–2.15 节（每节都写了「问题表处理」「待核实项结论」「新发现」「复核代理提出、已改的 N 条」「验证」几块，新题照这个格式记录）。最新的 03、04、05 三题最能代表现在的做法：研究代理核实事实（文档原文 / 源码与 npm）→ 主会话读源码 + 一次性探针测试 → 写代码与测试 → 写文件头 → 反驳式复核代理逐条复核（26 题 28 条、01 题 32 条、02 题 22 条、03 题 23 条、04 题 28 条、05 题 27 条，都是实打实的问题，这一步不要省）→ 修正后提交。
7. PROGRESS.md 的「**统一措辞**」一节（Vue 响应式、表单与事件类型、服务端状态 / TanStack Query、自定义 Hook 与订阅外部数据源、全局状态、错误边界、过期闭包与 useEffectEvent、Props、State、事件、条件渲染、列表与 key 十二张表）：这些说法已定稿，后续各题直接照用，不要再自己另起一套。

然后：`git status`（只应有两个未跟踪的规格文件）、`git stash list`（应有一条说明以「wip06」开头的 stash）、`git log --oneline -5`、跑一次 `npm run check` 确认基线是绿的（这时 06 还在 stash 里，基线是 05 提交后的状态）。

## 2. 当前状态（2026-09-18 第七次更新）

- 分支：`phase-1-toolchain`（34cd734 工具链、b7bcb90 ESLint 10）→ `phase-2-topics`：0e2874b 壳修复、4252967 **18 样板**、c03ae3b / 622bec1 文档、ccfd3db **2-A 统一 Vue 响应式措辞**、111ddfa **07 表单**、b9cc7b1 **19 异步提交**、659c24d **11 请求状态**、6358cbc 接续 prompt、5c04d9e **30 TanStack Query**、61281d7 **14 自定义 Hook**、d869301 接续 prompt、1eb2d3f **16 全局状态**、036fdba **20 错误边界**、301022e 接续 prompt（第四次）、ae5047c **26 过期闭包**、1e3394e **01 组件与 JSX**、85bba93 接续 prompt（第五次）、8348eea **02 Props**、b0ce8d3 接续 prompt（第六次）、ef34104 **03 State**、9de5117 **04 事件处理**、8e3121b **05 条件渲染**，之后是本 prompt 的第七次更新；2026-09-19：dd8586c **05 按使用频率改写（样板）**，之后是本 prompt 的第八次更新与 `RETROFIT-01-04-PROMPT.md`（未 push）。2026-09-18 已按用户要求把 `phase-2-topics` push 到 origin（github.com/thegoldenflow/react-learning），push 到 d0ecc80（本 prompt 第七次更新）为止；**没有开 PR**。除非用户明确要求，不要自己推送、开 PR 或合并。
- 依赖基线：React 19.2.8、react-router 7.18.3（从 `react-router` 导入，`RouterProvider` 从 `react-router/dom`）、vue 3.5.42、vue-router 5.2.0、pinia 3.0.4、zustand 5.0.15、@tanstack/*-query 5.102.8、react-error-boundary 6.1.3、ESLint 10.8.1、Vitest 4.1.11 + jsdom 29.1.1 + Testing Library（React / Vue）+ @vue/test-utils 2.4.11、TypeScript ~5.9.3、Vite 7.3.6。
- 已确认的样板风格（5.16）：
  1. 完整十段文件头只写在 `react/Example.tsx`；`vue/Example.vue` 写题目信息 + Vue 侧要点，并指向 React 文件；
  2. 一题可以拆成多个文件（主线 / 并排 / 模拟服务 / 测试），页面源码查看器能切换查看；
  3. 规格与大纲点名的主线能力做成可运行代码，并排版只演示和主线不同的部分；
  4. 每条关键结论配自动化测试，测试和示例放同目录（`react/Example.test.tsx`、`vue/Example.test.ts`）；
  5. 引用还没建的新题写「（32 题，待新增）」；
  6. 模拟服务可注入延迟（页面上几百毫秒，测试里 0）。
- 其余已定决定（详见 AUDIT.md §5.0）：不启用 React Compiler（手写记忆化是主线，编译器作【较新】小节）；新增 31–35，36（样式方案）/ 37（表单工程化，需装 react-hook-form + zod）可选、放最后问用户；01–30 不重编号；Redux Toolkit 并入 16（只讲概念，不装依赖）；工程化与 StrictMode 并入 README + 10 / 23；心智模型总结和面试总索引是阶段 4 文档；「严重」按外延解读（D2-1）；22 题保留 effect 手写，在「七、生产环境注意」写三种生产改写（D2-2）；新装或升级依赖取「满 30 天的最新补丁」，已装在用的不降级（5.14）。
- 当前数字（2026-09-18 第七次更新，06 在 stash 里时）：`没有一一对应关系` 56 处 / 28 个文件；`永远` 72 处 / 25 个文件、`根本没有` 2、`完全相同` 5、`完全一样` 6；`eslint-suppressions.json` 剩 **11 条 / 6 个文件**（10 / 12 / 21 / 23 / 24 / 27）。全量测试 399 条、31 个测试文件。
- **已经积累的可复用做法**（前面各题实测过，后面各题优先照用）：
  1. **请求 / 提交类状态尽量派生，不要在 Effect 体里同步 setState**：把「结果属于哪一次参数」（参数指纹）记进结果，`pending` 由它算出来。一次解决三件事：不碰 `set-state-in-effect` 规则、过期响应不会被当成当前结果（等价官方 ignore 标记）、切换参数时旧数据能留着不闪（等价 `placeholderData: keepPreviousData`）。见 11 题。
  2. **可复现的演示开关**代替随机失败：`failRate: 开关 ? 1 : 0`、`delayMs` 作为组件 prop（页面几百毫秒、测试 20ms；要断言「加载中 / 提交中」这种中间态时用 300ms，20ms 在全量测试里会先结束）。
  3. **焦点要等重新渲染之后再移**：提交中输入框是 disabled，`catch` 里直接 `focus()` 不生效 —— React 侧放进 effect，Vue 侧 `await nextTick()`。
  4. **onSubmit 的事件类型写 `SubmitEvent<HTMLFormElement>`**（`FormEvent` 在 @types/react 19.2 已 `@deprecated`）。
  5. **Actions 里的日志 / 进度不要用 state**：action 在 Transition 里执行，里面的 setState 要等 action 结束才显示；用外部 store + `useSyncExternalStore`（见 19 题的 `requestLog.tsx`）。
  6. 浏览器验证的固定套路：临时加 5174 配置 → `preview_start` → 在页面里先包一层 `console.error` / `console.warn` 收集 → 用 `javascript_tool` 一次跑完整套交互并回读结果（比截图可靠，且浏览器面板隐藏时截图会是空白）→ `preview_stop` → `git checkout -- .claude/launch.json`。
  7. 需要「Chrome 才能给结论」的事实（光标、原生事件时机、number 输入的规范化等），用一次性探针在页面里量出来，把数字写进课件并在 PROGRESS 里记一句「Chrome 实测」。实在量不出来的（例如隐式提交），**从课件里删掉这个说法**，不要留一个没依据的结论。
  8. **事实核实用只读工作流**（30、14 两题的做法，Ultracode 开着时每题都这样做）：写代码前先起一个 Workflow —— 2 个研究代理（一个查 node_modules 源码 / 类型 / npm，一个查官方文档，文档优先抓 GitHub 上的 raw markdown 保证逐字，例如 `raw.githubusercontent.com/reactjs/react.dev/main/src/content/...`、`raw.githubusercontent.com/vuejs/docs/main/src/...`、`raw.githubusercontent.com/TanStack/query/main/docs/...`），每份结果再配一个反驳式复核代理；输出用 schema（id / claim / evidence{ref, quote} / status），每条问题写成编号清单。并发上限是 2，一次约 15–30 分钟，研究期间主会话可以先写不依赖事实的代码骨架。结果从 `journal.jsonl` 里用 node 脚本抽出来读。
  9. **测试的几个坑**：自己的 `afterEach` 比 RTL 的自动 cleanup 先执行（Vitest 的 after 钩子倒序），要清 QueryClient 之类的外部状态时先调 `cleanup()`；同一个 `act` 里的多次更新会合并成一次渲染，要观察中间渲染（fake timers 推进、useSyncExternalStore 更新）就分多段 act，比如 100ms 一步；userEvent 之后不要在两次 await 之间做同步断言，把「旧数据还在 + 新状态」放进同一个 waitFor；故意触发错误边界 / Hooks 规则报错的用例要 spy `console.error` 并断言，别让它进 stderr；Vue 测试文件里有多个 `defineComponent` 探针时加文件级 `/* eslint-disable vue/one-component-per-file -- 原因 */`。
  10. **浏览器面板是隐藏的**（`tabs_context` 会说 hidden）：`document.visibilityState` 是 hidden，定时器被节流、不跑渲染帧。视口模拟会改 innerWidth 但不派发 resize，要手动 `window.dispatchEvent(new Event('resize'))`；依赖「页面可见」的逻辑（TanStack 的暂停请求恢复）可以用一次性探针把 `visibilityState` 改成 visible 再派发 `visibilitychange`，并在 PROGRESS 里写明。
  11. **lint 会直接拦下的反例**：教学反例（条件调用 Hook、Vue 式 `let timer`、Effect 里同步 setState 等）要保留时，在报错那一行加 `eslint-disable-next-line <规则> -- 原因`，并在注释里写上实测报错文案；React Compiler 系规则有时会在两处各报一次（赋值处和使用处），两处都要加。
  12. 外部 store 做演示日志（`createDemoLog` / `createRequestLog` / 20 题 `errorLog.ts`）：queryFn、mutation 回调、Effect 里写日志都不碰 React state，用 `useSyncExternalStore` 读；计数类实验的显示放在兄弟组件里，免得「重渲染 → 重订 → 计数 → 重渲染」绕圈（14 题 SubscribeLab）。
  13. **没开 Ultracode 时不能用 Workflow**（工具说明要求用户明确同意）：改用 Agent 工具，写代码前起 2 个只读研究代理（一个查官方文档原文并用脚本逐字校验引文，一个查 npm / node_modules 源码行号），写完文件头后再起 1 个**反驳式复核代理**逐条查引文、行号、版本、绝对化措辞、交叉引用（16 题复核出 24 条、20 题 10 条，都是实打实的问题，这一步不要省）。并发上限 2；研究期间主会话照样读源码、写代码。结果让代理写成 scratchpad 里的 JSON，再用 node 脚本拍平成文本读。
  14. **一次性探针测试**：对「实际行为是什么」拿不准时，先在题目录里写一个 `probe.test.tsx` 跑 `npx vitest run <文件> --silent=false --reporter=verbose`（不加这两个参数看不到 console.log），把结果写进课件后删掉探针。16 题的 selector 行为、20 题的「接得住 / 接不住」矩阵、Vue 渲染错误的两种表现都是这样定下来的。
  15. **做下一题时想先提交上一题**：`git stash push --include-untracked -m wip -- src/topics/<下一题目录>` → `npm run check` → 按显式路径 `git add` + commit → `git stash pop`。检查必须在「只有要提交的改动」的状态下跑。
  16. **渲染次数**用 React 自带的 `<Profiler onRender>`（16.9 起；生产构建不调用）统计，计数放外部 store、单独面板显示（16 题 `renderCounts.tsx`）；Vue 侧用 onMounted / onUpdated 计数、provide / inject 传计数器。
  17. **错误类测试的坑**（20 题）：被边界接住的错误 React 开发环境默认 console.error 打印，每个用例 spy 并断言；jsdom 没有 `window.reportError`，React 会自己派发 window 的 error 事件（用 `preventDefault` 收住）；Vitest jsdom 环境的 setTimeout 是 Node 定时器，回调里 throw 会变成进程级错误让整个测试失败，用 fake timers + `expect(() => vi.runOnlyPendingTimers()).toThrow()`；async 函数的拒绝走 Node 的 `unhandledRejection`，临时 `process.on` 收住；**act 里没接住的错误会被 act 重新抛出，onUncaughtError 不会被调用**，要测它得临时把 `IS_REACT_ACT_ENVIRONMENT` 设成 false、用原生 `.click()`；在 effect cleanup 里用 queueMicrotask 卸载的嵌套 root，测试末尾要 `await act(async () => view.unmount())`，否则报「An update to Root inside a test was not wrapped in act」。
  18. 新引入的依赖子路径（如 `zustand/react/shallow`、`zustand/middleware`）第一次在 dev 服务器里被请求时，Vite 会重新预构建并自动刷新一次，刷新前控制台会出现一次「Invalid hook call」（两份预构建的 React 混用），属于 Vite 开发模式现象；浏览器验证时刷新一次再开始收集控制台。
  19. **组件文件只导出组件**：@vitejs/plugin-react README「For React refresh to work correctly, your file should only export React components.」组件文件里再导出常量、工具函数、store，热更新会退化成整页刷新。常量 / 工具 / Hook 放 `.ts`（26 题 `demoKit.ts` + `LogPanel.tsx` 的拆法）；`export type` 不受影响。
  20. **fake timers 的 0ms 规则**：Vitest 4 内置 fake-timers 把「推进过程中新排进来的 0ms 定时器」记成 1ms 之后（`clock.duringTick ? 1 : 0`）。定时器回调里发出的 delayMs=0 请求，要 `advanceTimersByTimeAsync(ms)` 之后再推 1ms（26 题测试的 `advance` 辅助函数）。
  21. **lint 探针**：`npx eslint <文件> --no-inline-config -f json` 能看到被行内 disable 盖住的报错文案（ESLint 10 不再内置 unix 格式化器）；「每次渲染新建的对象当依赖」这类报错落在对象声明那一行，disable 要写在声明上方。
  22. **两题交叠做**（复核代理一跑 15–25 分钟，可以在它复核上一题时开始下一题的研究和代码，并发仍不超过 2 个代理）：提交前一题时，先把 README / 注册表里下一题的那几行临时还原成 HEAD 版本（先把完整文件拷到 scratchpad），`git stash push --include-untracked -- <下一题目录>`，跑 `npm run check`，按路径提交，再 `stash pop` 并恢复那几行。注意两点：stash 期间别让子代理读那个目录（01 题的复核代理就读到过旧文件）；**下一题自己提交前必须再跑一次完整 check**（01 题的测试文件在 stash 期间藏着一个类型错误，是复核代理发现的）。
  23. **React 开发期报错的断言**：console.error 收到的是格式串加参数（例如格式串「Invalid DOM property %s. Did you mean %s?」加上 class、className 两个参数），先拼成完整句子再比对（01 题的 `errorTexts(): string[]`；返回类型要写，否则推成 any、typecheck 报 TS7006）。同一个标签名的「unrecognized tag」报错整个进程只报一次。
  24. **反驳式复核代理的 prompt 要点**：给它研究材料的路径，让它写脚本逐条核对引文（允许去掉 markdown 标记与「…」省略）、源码行号、实测结论（自己重跑）、交叉引用（去被引用的题目录里看）、成熟度标签、统一措辞表，并对照审计大纲列出遗漏；输出 JSON（id / file / line / category / severity / problem / evidence / suggestion），主会话用 node 拍平阅读。
  25. **交叉引用只指向已经存在的内容**：被引用的题还没改写、里面没有那段内容时，写「NN 题改写时补」并在 PROGRESS 该题的「遗留」里记一笔（01 题：17 的 Compiler 小节、28 的组件返回类型；02 题：12 的 ref 回调 / useImperativeHandle / defineExpose、28 的 ReactElement / React.JSX / 泛型组件）。被引用的题改写完成后，回头把「NN 题改写时补」改成「见 NN 题」（02 做完时已把 01 的两处「02 题改写时补」改掉）。
  26. **生产构建的行为用 node + jsdom 一次性脚本量**（02 题）：在 scratchpad 写 .cjs，开头设 `process.env.NODE_ENV = 'production'`，用绝对路径 require 仓库的 jsdom、react / react-dom/client（或 vue），手写 `act = async fn => { await fn(); await new Promise(r => setTimeout(r, 50)) }`（生产包没有 act）；jsdom 的 window / document / Element / Node 挂到 global（navigator 是只读 getter，别挂）。同一脚本传 development 跑一遍做对照。
  27. **类型层结论写成测试**（02 题）：`import { expectTypeOf } from 'vitest'` + `// @ts-expect-error`，由 `npm run typecheck`（vue-tsc 检查测试文件）来验证；tsconfig 开了 noUnusedLocals，被 @ts-expect-error 标注的声明要在后面用一下，否则「声明未使用」这个错误就能让 @ts-expect-error 成立、证明不了想证明的错误。验证方法：临时删掉指令跑一次 vue-tsc 看真实报错（先把文件备份到 scratchpad，别用 /tmp 与 scratchpad 两个路径混着还原）。
  28. **Vue 侧 lint 的几个现成规则**（02 题）：`vue/no-mutating-props`（教学反例用行尾 `// eslint-disable-line vue/no-mutating-props -- 原因`，上一行放 `// @ts-expect-error`）；`vue/require-default-prop`（解构的可选非布尔 prop 要给默认值）；`vue/no-setup-props-reactivity-loss` 对 3.5 解构后的 `ref(price)` 不报，别预先写 disable（会变成 Unused eslint-disable directive 警告，--max-warnings=0 下失败）。
  29. **Vue 编译结果写成测试**（05 题）：`import { compileTemplate } from 'vue/compiler-sfc'`（vue 包的官方子路径导出，和 @vitejs/plugin-vue 用同一个编译器），`compileTemplate({ source, filename: 'Probe.vue', id: 'probe' }).code` 断言里面有 `key: 0`、`_withDirectives`、`_vShow` 之类；再用 `defineComponent` + `h()` / `withDirectives(h(Child), [[vShow, visible.value]])` / `h(KeepAlive, null, [cond ? h(X) : null])` 写等价的渲染函数探针，证明运行时行为。
  30. **演示里别在子组件的 onUpdated 里写父组件渲染的日志**（05 题）：日志一变父组件重渲染，带指令（v-show）的子组件被强制更新，又写日志，循环到 Vue 的递归上限。这类结论放进测试里用独立探针验证。
  31. **Vue 的递归更新报错接不到**（03 题）：开发构建同一任务重复排队超过 100 次时 `handleError(字符串, null, 10)`，instance 是 null，`app.config.errorHandler` 收不到，字符串被当作未处理的 Promise 拒绝抛出 —— 测试里临时 `process.on('unhandledRejection', …)` 收住并断言。
  32. **RTL 的 `fireEvent` 返回 dispatchEvent 的结果**（04 题）：返回 false 表示默认动作被 preventDefault 拦了，比读合成事件的 defaultPrevented 可靠（被动监听时两者不一致）。jsdom 的「Not implemented: …」（例如链接导航）走 virtual console 打到 stderr，不经过 console.error，spy 不到 —— 让默认动作被拦掉，或者干脆别触发。
  33. **React 开发期报错的格式串**（03 题补充）：被错误边界 / root 接住的错误，console.error 的第一个参数是「%o…」格式串，错误对象在后面的参数里（`calls[0][1].message`）。
  34. **Testing Library 的角色**：`<dl>` 没有 list 角色（getByRole('list') 找不到），用 getByLabelText 或 container.querySelector；本项目**没装 eslint-plugin-react**（没有 `react/jsx-key`、`react/jsx-no-leaked-render` 这类规则），写 eslint-disable 指向这些规则会报「Definition for rule … was not found」。
  35. **复核报告怎么读**：复核代理把问题写成 scratchpad 里的 `review.json`（id / file / line / category / severity / problem / evidence / suggestion），主会话用 node 拍平后逐条改；改文件用 scratchpad 里的 .cjs 脚本做「查找唯一片段 → 替换」（找不到或不唯一就抛错），比手工 Edit 几十处稳。
  36. **写 heredoc 前先估长度**：超过约 8 KB 的 heredoc 在 Bash 工具里整条失败（unexpected EOF），2026-09-18 又踩了几次 —— 长脚本一律先用 Write 写到 scratchpad 的 .cjs 再执行。
  37. **【少用】片段拆成单独的组件文件**（04 题）：CaptureOrderDemo.tsx、RareModifiersDemo.tsx、PassiveWheelDemo.tsx 这类整块少用的演示，组件文件保留、只把页面上的 import 与用法放进【少用】注释块，测试直接渲染组件 —— 注释期间结论照样被测试验证，取消注释也只要改两处。取消注释后页面上会多出同名控件时，测试按名字区分（04 的两个 stopPropagation 勾选框）。Vue 侧按 Vue 项目里的频率判断，少用的同样拆成单独的 .vue 组件（04 的 CaptureOrderDemo.vue、RareModifiersDemo.vue）；模板里的注释块第一行以 `<!-- 【少用】` 开头并写明怎么取消、最后一行单独是 `-->`，中间不能再有 HTML 注释，script 里照旧 `/* 【少用】` … `*/`（RETROFIT-01-04-PROMPT.md §5.1 的脚本已能识别 .vue）。场景本身少用时，它的 ❌ 反例随场景一起注释，并在文件头写明这个例外（03 的「把函数存进 state」、04 区块六）。
  38. **不用 stash 也能「只检查要提交的改动」**（01–04 题）：按显式路径 `git add`；README 这类混着别题改动的文件，先生成只含本题改动的版本，用 `git update-index --cacheinfo 100644,$(git hash-object -w <文件>),README.md` 暂存；再 `git checkout-index -a -f --prefix=<scratchpad>/checkNN/` 导出暂存区，`cmd //c "mklink /J <scratchpad>\checkNN\node_modules D:\code\AI\learning\react\node_modules"` 链上依赖，在导出目录里跑 `npm run check`，全绿再 commit。好处是复核代理正在读别的题目录时也能提交（stash 会让它读到旧文件）。
  39. **频率标签的格式**（01–04 复核定下来的）：频率和版本分开写（【最常用】automatic runtime（React 17 起，19 起必须）；成熟度是【较新】【尝鲜】【旧写法】时才叠加，例如 <Activity>【较新·19.2 起】【少用】），编号标题上的【主流】保留；只有一种正确写法、对照组是 ❌ 反例时不打频率标签，只用 ✅ / ❌（03 的存 id、status，04 的 stopPropagation）；两种写法各有主流出处、分不出高低时写「两种都常见，按团队约定」（02 的布尔 prop、interface / type）；行业写法和官方建议不一致时分开写，不为此改主线（02 的 ComponentProps / ComponentPropsWithRef，用户定为保持 WithRef）；讲「该不该用」的官方原文不当频率依据（04 的 useCallback）；测试标题不写频率字样，只用「附 N【少用】」对应注释块；Vue 侧不照搬 React 的标签。
  40. **频率依据的常见错误**（复核代理每题都抓到）：拿「两种写法结果相同」「什么时候用」「it's reasonable」「only valuable in a few cases」这类句子当频率依据（要找 common / uncommon / often / rarely / most cases 这类直接讲频率的原文，找不到写「工程经验」）；npm 下载量含传递依赖，只能比较同类库之间；统计要写清范围并按用途分类；风格指南的「要有作用域」不等于「用 scoped 属性」；把正文推荐的写法（练习、七里的建议）又标成【少用】。
  41. **06 题踩到的测试小坑**：compileTemplate 的输出第一行是 import，找 `_renderList` 会先命中 import，要找调用 `_renderList(`；`_ctx.todos` 里含有 `_ctx.todo` 这个子串，断言「没有读 _ctx.todo」要写成 `_ctx.todo.`；Vue 的 console.warn 参数是分开的（`[Vue warn]: …`、`"a"`、`Make sure …`、组件栈），用 `mock.calls[0].slice(0, 3)` 比对；react-hooks 的编译器类规则（set-state-in-effect 等）不分析定义在测试回调里的组件，别预先写 eslint-disable（会变成 Unused directive）。
  42. **复核代理的仓库副本**：复核代理为了跑「取消注释」会把仓库拷到 scratchpad 并用 `mklink /J` 链上 node_modules；删副本前先 `cmd //c rmdir <副本>\node_modules` 去掉 junction，否则递归删除可能顺着 junction 清空真正的 node_modules。

## 3. 还要做的事（按这个顺序）

### 3.1 阶段 2-A：Vue 响应式措辞批量修正 —— **已完成（ccfd3db）**，措辞见 PROGRESS.md「统一措辞」，以下保留原始要求供查阅

多题把 Vue 讲错了同一件事，先统一改掉，后面逐题重写时沿用同一套措辞：
- `ref` 不是 Proxy。官方（vuejs.org/guide/extras/reactivity-in-depth）原文：「In Vue 3, Proxies are used for reactive objects and getter / setters are used for refs」。`ref` 装对象时内部才用 `reactive` 包一层。
- 更新单位不是「属性级」。官方原文：「each component instance creates a reactive effect to render and update the DOM」。准确说法：**依赖追踪记录到具体属性，但被触发重新执行的是读过它的组件的 render effect**，再 patch DOM；逐属性直接更新 DOM 是 Vapor Mode（Vue 3.6 RC）的方向【尝鲜】。
- 已知位置：`03-state/react/Example.tsx:17`、`:312-313`；`21-immutable-update/react/Example.tsx:16`、`vue/Example.vue:73`；`23-rendering-and-state-snapshot/react/Example.tsx:16`、`vue/Example.vue:18`、`:76`（审计编号 R2-03-8、R2-21-8、R2-23-7）。再用 `grep -rn "Proxy\|属性级\|粒度" src/topics` 找全，逐处判断（`reactive` 用 Proxy 是对的，不要误改）。
- 写法：只改这些句子，不顺手重写整题；把最终采用的措辞记进 PROGRESS.md 的「统一措辞」一节（没有就新建），后面每题照用。
- commit：`阶段 2-A：统一 Vue 响应式描述（ref 不是 Proxy，更新单位是组件 render effect）`。

「没有一一对应关系」残留和绝对化用词**不做批量修改**：每题重写时清零（见 4.6 的检查命令），阶段 4 再全局复查一遍。

### 3.2 阶段 2-B：主线判定题（每题 1 个 commit，按顺序）

`07 → 19 → 11 → 30 → 14 → 16 → 20 → 26`。**全部完成：07（111ddfa）、19（b9cc7b1）、11（659c24d）、30（5c04d9e）、14（61281d7）、16（1eb2d3f）、20（036fdba）、26（ae5047c）。** 主线口径已确认（AUDIT-ROUND2.md §3 有官方原文依据，直接采用）：
- **07 表单 —— 已完成（111ddfa，见 PROGRESS 2.3）**：受控（`value` + `onChange`）与非受控（`defaultValue` + `FormData`）两种基础写法都是主线；加 `useId`【主流】；Actions 写法指向 31（待新增）。「八、旧写法对照」只放 React 18 差异（`useFormState` → `useActionState` 更名、18 没有 `<form action>`），**不要把受控写法标成旧写法**。`FormEvent` 在 @types/react 19.2 已 `@deprecated`，改用 `SubmitEvent`（待核实项 M-2，先核实 `node_modules/@types/react/index.d.ts`）。
- **19 异步提交 —— 已完成（b9cc7b1，见 PROGRESS 2.4）**：手写 `submitting` + 防重复（useState + ref 锁）是主线；`useTransition` / `useActionState` 的 `isPending` 作并排，指向 31。
- **11 请求状态 —— 已完成（659c24d，见 PROGRESS 2.5）**：在 Effect 里手写请求，讲透四态建模（判别联合）+ 竞态 + 取消 + 重试；文件头写明「教学用，生产用缓存层，见 30」，并引用 react.dev useEffect 页对 Effect 取数缺点的原文。路由 loader 作并排（指向 18），`use(promise)` 只作【较新】引用（指向 32，待新增）。
- **（16 题做之前的提示，保留备查）**：30 题已经把「服务端状态不进 store」讲透（does-this-replace-client-state 页原文、区块五缓存观察窗），16 题只需交叉引用、不要重复；14 题已核实 zustand 5.0.15 的 `useStore` 就是 `React.useSyncExternalStore(api.subscribe, useCallback(() => selector(api.getState())), useCallback(() => selector(api.getInitialState())))` + `useDebugValue`（`node_modules/zustand/esm/react.mjs:5-13`），「selector 返回新对象会怎样」「为什么要 useShallow」可以直接接 14 题「getSnapshot 必须稳定」的结论（14 题有测试）。pinia 已装 3.0.4，pinia 4 于 2026-07-14 首发、不满 3 个月，按规格 §4 只作【尝鲜】介绍；Redux Toolkit 只讲概念、不安装（决定 5.0 表）。16 题有无 lint 抑制：没有（剩下的 11 条在 10 / 12 / 21 / 23 / 24 / 27）。
- **30 TanStack Query —— 已完成（5c04d9e，见 PROGRESS 2.6）**：v5 作生产默认【主流】；讲 `status × fetchStatus` 两个维度，v4 术语标【旧写法】；补 `useSuspenseQuery` 一节。和 18 交叉说明两种主流组合：「Data 模式 loader 取数」和「任意路由 + TanStack Query」，各自由谁负责 pending / 错误 / 失效重取。`fetchQuery` 已标 `@deprecated`，指向 `queryClient.query()`（M-8，先核实版本）。
- **14 自定义 Hook —— 已完成（61281d7，见 PROGRESS 2.7）**：`useWindowWidth` 这类订阅浏览器 API 的 Hook 主线改为 `useSyncExternalStore`；`useEffect` + `setState` 订阅作过渡对照（讲撕裂与 SSR 快照）。防抖 Hook 仍用 `useEffect`。把 `react/*.ts` 的 lint 抑制清掉。
- **16 全局状态 —— 已完成（1eb2d3f，见 PROGRESS 2.8）**：Zustand 5 主线五个区块（selector / useShallow + Profiler 渲染计数、组件外读写 + subscribe + 异步 action + persist / migrate、Context + useReducer 并排、createStore + Context、RTK 只读对照）；Vue 侧 Pinia setup store + 迷你持久化插件（注册表 vuePlugins 装到新建的 pinia 上）+ 模块级 reactive。
- **20 错误边界 —— 已完成（036fdba，见 PROGRESS 2.9）**：手写 class 边界主线（fallback / onError / onReset / resetKeys 做成 props）+ react-error-boundary 可运行并排；「接得住 / 接不住」8 个按钮逐条测试（含 useTransition 例外与顶层 startTransition 进不了）；createRoot 小根演示 onCaughtError / onUncaughtError；Vue 侧可复用 ErrorBoundary.vue、捕获面、传播规则与 errorHandler。
- **26 过期闭包 —— 已完成（ae5047c，见 PROGRESS 2.10）**：修法优先级为 ① 函数式更新 → ② 写对依赖 → ③ `useEffectEvent`【较新·19.2 起】作主线示例（写全官方四条限制）→ ④ latest ref 作并排（React 18 项目仍需要）。以 AUDIT-ROUND2 §3.7 为准；AUDIT.md §4.3 表里「latest ref 回到主线」那句已被附录 C 覆盖。

### 3.3 阶段 2-C：其余题（每题 1 个 commit，按编号）

**2026-09-19 起的顺序**：已完成的题要按 §4.3「使用频率标注」回头改写 —— 05（dd8586c）、01–04（fdbff97 / 9ee15d0 / ade42f8 / 1a8ffe7）已完成；**06 已按 `docs/upgrade/TOPIC06-PROMPT.md` 完成（efe5615，PROGRESS 2.21）**；之后 18、07、19、11、30、14、16、20、26 的改写与 08 起的新题谁先，**等用户定**。02 题原生属性类型用户定为保持 ComponentPropsWithRef。06 和之后的新题直接按 §4.3 写（写完再补也行，但要在提交前完成）。

`01 → 02 → 03 → 04 → 05 → 06 → 08 → 09 → 10 → 12 → 13 → 15 → 17 → 21 → 22 → 23 → 24 → 25 → 27 → 28 → 29`。**01（1e3394e，2.11）、02（8348eea，2.12）、03（ef34104，2.13）、04（9de5117，2.14）、05（8e3121b，2.15）、06（efe5615，2.21）已完成。08 起的新题与九题改写谁先，等用户定。** 做每一题前先看 PROGRESS「每题状态」表里其他题留给它的遗留（例如 01 题留给 17 的 Compiler 小节、留给 28 的组件返回类型；02 题留给 12 的 ref 回调与清理 / useImperativeHandle / RefObject / defineExpose、留给 28 的 ReactElement / React.JSX / 泛型组件；26 题留给 10 的「场景二修法三 latest ref」、留给 14 的 19.2.x memo / forwardRef bug 一句；03 题：14 题留下「03 题 :64『10、14 题会再遇到快照』改写时核对」；03 题留给 21 的深嵌套拍平与 reactive 限制、留给 17 的 Compiler 小节；04 题留给 17 的内联处理函数记忆化、留给 07 的「提交按钮 onClick 跑在校验之前」；05 题留给 06 的 v-if 与 v-for 同用、留给 32 的 Activity 与 Suspense）。

**06 怎么接着做**（**已完成：efe5615，见 PROGRESS 2.21；wip06 的 stash 已恢复并清空。** 以下保留原始记录）：
1. `git stash list` 找到说明以「wip06」开头的那条（写这份 prompt 时是 `stash@{0}`），`git stash pop` 恢复。stash 里只有 `src/topics/06-list-and-key/` 下的文件：React 的 `ListBasicsDemo.tsx`（区块一：filter / sort / map、排序前拷贝、`<Fragment key>` 包 dt / dd）、`demoData.ts`（`INITIAL_ORDERS`、`createLocalOrder`：优先 `crypto.randomUUID()`，没有时退回自增计数器）、`KeyBugDemo.tsx`（区块二：key 用 id / index / Math.random() 三种模式，Math.random 那一行有 `eslint-disable-next-line react-hooks/purity`，实测报错「Cannot call impure function during render」）、`KeyResetDemo.tsx`（区块三：OrderNoteEditor 换 key 重置草稿）、占位的 `Example.tsx`（文件头待写）、`Example.test.tsx`（10 条，已通过）；Vue 的 `ListBasicsDemo.vue`、`KeyBugDemo.vue`（不写 key / index / id / random 四种，不写 key 那一行禁用了 `vue/require-v-for-key`）。仓库里原有的 `vue/Example.vue`、`vue/OrderNoteEditor.vue` 还是旧版。
2. 还没做：Vue 侧的 KeyResetDemo（可复用旧的 OrderNoteEditor.vue 或重写）、`vue/Example.vue` 精简头、Vue 测试；React `Example.tsx` 的十段文件头；README / 注册表 / PROGRESS（2.16、06 行、「下一步」指到 08）；反驳式复核代理；浏览器验证；提交。
3. 06 的文档研究已经做完（42 条，40 确认、2 查无），结论见下面第 6 节「06 题已核实的事实」；原始材料在上一个会话的 scratchpad：`C:\Users\lenovo\AppData\Local\Temp\claude\D--code-AI-learning-react\2806c59c-8286-45cc-8eea-31cacd9313b2\scratchpad\research06\`（`docs/` 是抓下来的官方原文，`docs-result.json` 是逐条结论，`probe06/results.txt` 是探针结果）。临时目录可能已被清理，找不到就只靠第 6 节，写引文前对照官方 raw markdown 重新逐字核对。
4. 06 做完后，把 05 的两处「（06 题改写时补）」改成「见 06 题」（`05-conditional-rendering/react/Example.tsx` 三的 v-if 与 v-for 条、`vue/Example.vue` 同一条），和 06 一起提交。

各题要并入的散点知识点见 AUDIT.md §4.3「散点知识点并入现有题」表（04 合成事件变化、05 `<Activity>` 一句、12 ref 回调清理 / `useImperativeHandle` / `forwardRef` 旧写法 / `useTemplateRef`、15 `use(Context)`、17 Compiler 小节、24 `flushSync` caveat、28 React 19 类型变化等）。第一轮里「以第一轮为准」的条目清单在附录 C，逐条核对。

### 3.4 阶段 3：新题 31–35（新分支 `phase-3-new-topics`，从 `phase-2-topics` 末端切出）

- 蓝本：AUDIT-ROUND2.md §5 的 31–35 十段大纲 + §1 的 31–35 目标大纲 + AUDIT.md §4.3。
  - 31 React 19 表单与 Actions；
  - 32 并发与异步 UI（示例内自带 Suspense 与错误边界，避免被壳应用接管；`<ViewTransition>` 只作【尝鲜】介绍，19.2.8 不导出）；
  - 33 服务端渲染与 RSC（概念课，明确标注不可运行，Next.js 不安装）；
  - 34 测试（把 `src/test/smoke.*` 并入后删除，讲清 `vitest.config.ts` 里 `resolve.conditions` 的原因；Vue 侧以 @vue/test-utils 为主）；
  - 35 安全与可访问性（复用 `@/shared/safeRedirect`；XSS 与 `dangerouslySetInnerHTML` ↔ `v-html`；令牌存储；前端权限只是体验层；a11y 基础）。
- 注册表 `src/shell/topicRegistry.ts` 加「第六阶段」；`RECOMMENDED_ORDER` 的插入位置先按 AUDIT.md §4.4 的建议，阶段 4 定稿。
- 31–35 都完成后，全仓库去掉交叉引用里的「待新增」。
- 36 / 37 做不做，**停下来问用户**（37 要装新依赖，属于规则 7）。

### 3.5 阶段 4：一致性检查与交付（新分支 `phase-4-consistency`）

- 全局复查：模板残留为 0；绝对化用词要么删除、要么带限定条件；交叉引用逐条成立；每题文件头有适用版本、最后核对日期和成熟度标签；术语与 PROGRESS.md「统一措辞」一致；`eslint-suppressions.json` 已清空（清空后删除文件，确认 `npm run lint` 仍通过）；待核实清单逐条收口或保留「待核实」标注。
- README：按最终题目重写叙述章节（项目目标、技术栈、目录、知识点目录、学习重点、推荐顺序、面试问题、完成状态、验证命令、附录选型说明）；注册表定稿推荐顺序。
- 交付文档：`docs/upgrade/CHANGELOG.md`（按主题汇总改动）；面试总索引与心智模型总结（`docs/` 下两份文档 + README 章节，每题链接并标成熟度）。
- 最后跑 `npm run check`，并在浏览器里把所有题点一遍、看控制台。然后向用户汇报，问是否要合并分支或开 PR。

## 4. 每题的做法（照 18 样板）

### 4.1 找齐这一题的材料（以 07 为例，换成对应编号）

```bash
grep -n "^### 07\. \|^#### 07\. " docs/upgrade/AUDIT-ROUND2.md   # 三处：§1 目标大纲与问题表、§4 与第一轮差异、§5 十段重写大纲（蓝本）
grep -n "^| R2-07-" docs/upgrade/AUDIT-ROUND2.md                  # 缺失 / 讲错问题（§1 表 + §2 汇总）
grep -n "^| P-07-" docs/upgrade/AUDIT-ROUND2.md                   # 待核实项
grep -n "^### 07\. " docs/upgrade/AUDIT.md                        # 第一轮逐题问题表（含行号与依据）
```

把 §5 大纲当蓝本；逐题问题表 = 第二轮 §1 / §2 的 R2 条目 + 第一轮 §3 的讲错条目；附录 C 列出的「以第一轮为准」条目按第一轮处理；主线口径按 AUDIT-ROUND2 §3。

### 4.2 写之前先核实

- 依据优先级（规格 §1.2 + D2-6）：① `node_modules` 里的 `.d.ts` / 源码（写上文件和行号）→ ② 官方文档（react.dev、reactrouter.com、vuejs.org、router.vuejs.org、pinia.vuejs.org、vite.dev、tanstack.com，以及各包自己的官方文档）→ ③ 官方博客 / 发布说明 / CHANGELOG，以及 MDN、OWASP、W3C（引用时标「③」）→ 其它来源只能当线索。
- 注释里引用官方原文，写明版本或核对日期；查不到的写「待核实」，并记进 PROGRESS.md。
- 审计里的「待核实」和「需运行验证」条目，要么核实后写进课件，要么用测试或浏览器验证，结论记进 PROGRESS。审计结论如果与源码实测不符，以实测为准，并在 PROGRESS 里注明（18 题就发现过 vue-router 5 的 `next()` 警告、「最深一层 redirect 优先」这类审计没写到的事实）。

### 4.3 改写

- `react/Example.tsx` 文件头按规格 §9 写全：主题、适用版本、最后核对、前置主题、成熟度，一至十段，参考。30 秒速答只用【主流】和【较新】内容。
- 每个知识点带成熟度标签，【较新】注明起始版本。对比句写明适用的版本 / 模式 / 前提，不写没有限定的「永远 / 一定 / 完全相同 / 根本没有」。
- **使用频率标注（2026-09-18 用户要求，05 题是样板，用户已确认「05 可以」；2026-09-19 01–04 已按它改写，见 PROGRESS 2.17–2.20 与 §2 的可复用做法 37–40）**：用户原话「我的目的不是让你把一个主题的所有方法都写下来，而是让你把工业界最常见的方法写出来，或者把多种方法中最常用的标注出来」，随后又定了「不常用的，不用删除，注释起来就好，放开的是真正常用的方法」。做法：
  1. **按「要做的事」算频率**，不是一题只留一种：同一件事有几种写法时标【最常用】【常用】【少用】；成熟度是【主流】时不再重复标，【较新】【尝鲜】【旧写法】照标（例：`<Activity>【较新·19.2 起】【少用】`）。文件头在「成熟度」下面加一行「使用频率」说明。
  2. 频率判断要有依据：官方原文（如「This is the most common solution.」「isn't common」）、官方示例和主流库官方文档里的写法（如 TanStack Query Overview 的提前 return、Redux Essentials 的 `let content`）、主流库 / 模板的默认做法、npm 下载量；没有出处的写「工程经验」。
  3. **演示代码**：【最常用】【常用】正常运行，界面小标题带频率标签；【最常用】的写法如果没有演示，要补上（05 题区块四补了「状态提升」面板）。**【少用】的演示不删，注释掉**，并保证取消注释就能运行：注释块第一行以 `{/* 【少用】` 或 `/* 【少用】` 开头、写明取消注释的方法，最后一行单独是 `*/}` 或 `*/`，中间不能再有块注释（原来的 JSDoc 改成 `//` 行）；依赖的 import 同样放进一个【少用】注释块。说明性的注释另起一行、写成完整的 `{/* … */}`。
  4. **测试**：和注释掉的演示对应的断言也用同样的【少用】注释块包起来（取消演示注释时一起取消）；测试写成不依赖面板数量的形式（例如 names 数组 + 注释块里的 `names.push(…)`）。文件头里仍标「测试覆盖」的少用结论，另写一条用独立组件的测试来验证（05 题的「附：<Activity>」）。
  5. **文件头**：正文（一至七）只写【最常用】【常用】；30 秒速答只用【最常用】。【少用】的写法和只为「说全」的细节（源码行号、边角行为）不删，集中到文末「附：少用的写法与细节」（放在「十、动手练习」和「参考」之间），正文里留一句「演示已注释，见附 N」。可以加一道练习：取消某个【少用】演示的注释并跑测试。注意 JSDoc 文件头里不能出现 `*/`。
  6. **验证**：除 `npm run check` 外，再把全部【少用】注释块取消一次，跑该题的 lint、`npm run typecheck`、该题测试，全绿后从备份还原（先 `cp -r` 到 scratchpad，还原后 `diff -r` 确认一致）。取消注释的脚本：逐行扫描，遇到匹配 `/^\s*\{?\/\* 【少用】/` 且本行不含 `*/` 的行就删掉，并删掉其后第一行匹配 `/^\s*\*\/\}?\s*$/` 的行。
  7. Vue 这一侧按 Vue 项目里的频率判断（v-show、KeepAlive 在 Vue 项目里常用，不注释）。
  8. 这和「审计要查缺」不冲突：官方教的概念不能漏，但同一件事的每种写法不用平铺在正文里。
- 演示里的简化都标「演示简化」，并写出生产写法；安全相关（URL 参数、跳转、HTML 注入、令牌、权限）写清风险与正确做法。
- Vue 侧以 Vue 3.5 官方文档为准（组合式 API + `<script setup lang="ts">`，Vue 3.5 的响应式 props 解构、`onWatcherCleanup`、`useTemplateRef` 按 AUDIT-ROUND2 口径标【主流】）。只有核实过确实没有对应物，才写「没有对应物」，并说明原因。
- 需要拆文件时参照 18 题的命名习惯；示例根组件保持无 props（壳应用直接渲染 `<Example />`）。
- 不改无关代码。站点壳和 `src/shared/` 只在确有必要时改，并在 PROGRESS 里说明。

### 4.4 测试

- 课件强调的关键结论都要有测试证明（规格 §2 第 9 条）：React 侧放 `react/Example.test.tsx`，Vue 侧放 `vue/Example.test.ts`。
- React：直接触发 React 更新的调用（例如 `router.navigate()`）用 `await act(...)` 包起来（`act` 从 `react` 导入）；用 `userEvent.setup({ delay: null })`；断言用 `findBy*` / `waitFor`；测试输出里不能有 act 警告和 stderr。
- Vue：用 `@vue/test-utils` 的 `mount` + `flushPromises` + `vi.waitFor`；接口延迟用 `vi.mock('@/shared/mockApi', …)` 包一层置 0（写法见 `18-routing/vue/Example.test.ts`）。
- 需要真实浏览器行为的结论（定时器节流、焦点、滚动）用浏览器验证，结果写进 PROGRESS。

### 4.5 验证

- 本题有 lint 抑制时：修掉后跑 `npx eslint . --prune-suppressions`，和本题改动一起提交。
- `npm run check`（lint → typecheck → test → build）必须全绿；用管道截输出时加 `set -o pipefail`。
- 浏览器：用户自己常在独立 cmd 窗口里跑着 5173 端口的 dev 服务器（**不要杀掉**）。验证时临时在 `.claude/launch.json` 加一个 5174 的配置（`npm run dev -- --port 5174 --strictPort`），用预览工具启动，验证完停掉，并 `git checkout -- .claude/launch.json` 还原。把本题两侧的主要交互点一遍，在页面里临时包一层 `console.error` / `console.warn` 收集输出（预览标签页的控制台缓冲会混入之前的日志），应为 0。

### 4.6 收尾

```bash
T=src/topics/07-forms
grep -rn "没有一一对应关系" $T                                   # 应为 0
grep -rn "永远\|根本没有\|完全相同\|完全一样\|一定会" $T             # 逐处确认已加限定或已删除（「绝对地址」这类术语不算）
grep -rno "[0-9][0-9] 题" $T | sort | uniq -c                     # 交叉引用逐条核对；31–35 在阶段 3 之前要带「待新增」
# 检查改动和新增的文件没有 CRLF（仓库要求 LF），有输出就要处理；两个用户规格文件不归我们管，已跳过
node -e "const {execSync}=require('child_process');const fs=require('fs');const skip=['course-upgrade-prompt.md','update-project.md'];for(const l of execSync('git status --porcelain -uall',{encoding:'utf8'}).split('\n')){const f=l.slice(3).trim();if(f&&!skip.includes(f)&&fs.existsSync(f)&&fs.statSync(f).isFile()&&fs.readFileSync(f,'utf8').includes('\r\n'))console.log('CRLF:',f)}"
```

- 更新 PROGRESS.md：「每题状态」表加一行（状态、改动摘要、遗留），必要时加简短记录小节，并把「下一步」指到下一题。
- 只在本题涉及的范围内更新 README 的事实行（该题的目录行、说明段、面试题行），叙述章节留给阶段 4。
- commit：一个主题一个 commit，按显式路径 `git add`（不要 `add -A`，两个规格文件保持未跟踪）。提交信息格式：`NN 主题名：改动要点`，正文列出主要改动，结尾按会话系统提示的要求加 Co-Authored-By 行。

## 5. 必须停下来问用户的情况

1. 需要新增依赖（规格规则 7）：说明用途、候选版本（按 5.14 的 30 天规则）、peer 与 engines 核对结果，等确认后再装。
2. 题目结构变化超出已定范围（增删、合并、重编号），包括 36 / 37 做不做。
3. 实测证据与已定决定或主线判定冲突（类似阶段 1 发现 jsdom 30 不支持本机 Node）：给出选项和推荐。
4. 想升级已有依赖的大版本或小版本（例如 2026-10-09 之后评估 React 19.3），或任何不可逆 / 对外的操作（push、开 PR、合并分支、删除用户文件、结束用户的进程）。

其它情况不停：逐题做完就提交，接着做下一题。事实查不到就标「待核实」并记录，不要为此停下。

## 6. 工程约定与已知坑（照做，不要重复踩）

- 仓库 `.gitattributes` 是 `* text=auto eol=lf`。Windows 上的编辑有时会写出 CRLF，改完用脚本检查。
- Bash 工具里超过约 8 KB 的 heredoc 会失败（报 unexpected EOF），大文件和长文本用 Write 工具写到 scratchpad 再用 node 脚本合并。不要在 Bash 里 `cd` 进 `node_modules`（会改掉会话的工作目录，2026-09-17 又踩过一次），用绝对路径或 `node_modules/...` 相对路径。
- 验证命令：`npm run lint`（`--max-warnings=0`）、`npm run typecheck`（vue-tsc 同时检查 .tsx / .vue / 测试）、`npm test`、`npm run build`、`npm run check`。
- `vitest.config.ts` 里的 `resolve.conditions = [...defaultClientConditions]` 不能删：去掉后 Vitest 会把 `react-router` 和 `react-router/dom` 加载成两份实例（CJS 与 ESM），`useParams()` 读到 `{}`。
- ESLint 10 flat config（`defineConfig`）；react-hooks 用官方 `flat.recommended`，作用于 `**/*.tsx` 和 react / shell / bridge 目录下的 `.ts`（不含 vue 目录）。修掉抑制条目后要 prune，否则 lint 失败。
- npm 安装 vitest 这类依赖时，arborist 可能崩溃（`Cannot read properties of null (reading 'edgesOut')`）。绕法：这一条命令加 `--legacy-peer-deps`，再跑一次普通 `npm install` 补回被误删的 peer（`vue-eslint-parser`），最后核对 lockfile 与 HEAD 的差异。
- 机器只有 4 核：子代理最多 2 个并发，只让它们做只读的资料核实；课件代码和注释在主会话里写，保证风格一致。
- 浏览器面板隐藏时 Chrome 会节流定时器，测定时器类演示前先把标签页调到前台；脚本化连续点击会被 React 批处理成一次渲染，需要逐次观察时要加等待。
- 07 / 19 / 11 已核实、可以直接引用的事实（详见 PROGRESS 2.3–2.5，不必重新查）：`FormEvent` 在 @types/react 19.2.18 已 `@deprecated`（`index.d.ts:2086-2091`），`onSubmit` 用 `SubmitEvent`；React 的 onChange 由原生 input / change 驱动、不看输入法合成状态（`react-dom-client.development.js:3587`），事件结束后会把受控输入的 DOM 值改回 props（`:3251-3272`）；`e.currentTarget` 在处理函数返回后被置 null（`:19120`）；useId 默认前缀 19.2 起是 `_r_`（`:9045-9064`）；离散事件里的 setState 在事件结束后的微任务里就完成渲染（`:18825-18856`、`:18979-18991`），所以真实双击会被 disabled 挡住、同一轮里的重复调用才需要 useRef 锁；`<form action>` 的 action **返回**错误 state 也算成功、非受控字段照样被重置（要用 `defaultValue` 回填）；`useActionState` 的重复提交是排队串行、不丢弃；官方 useEffect「Fetching data」示例里的同步 `setBio(null)` 确实命中 `set-state-in-effect`。Vue 侧：`useId()` 从 3.5 起就有（`runtime-core.cjs.js:1704`，多应用用 `app.config.idPrefix`）—— 审计里「Vue 没有 useId 对应物」是错的；`v-model` 合成期间不更新（`runtime-dom.cjs.js:1533-1545`）、写入被拒时不会把 DOM 改回去（`:1559-1576`）；`:value` 在组件每次重新渲染时都会写回 DOM（`runtime-core.cjs.js:5897` + `runtime-dom.cjs.js:591-601`）；事件处理函数的同步错误和 async 拒绝都进 `onErrorCaptured`（`runtime-core.cjs.js:205-213`，info 是 `native event handler`）。
- Chrome 实测记录（写课件可直接引用，注明「Chrome 实测」）：`type="number"` 的 value 设成「12.」「1e」「-」读回来都是空串、`valueAsNumber` 为 NaN；受控输入拒绝输入时值被改回、光标跳到末尾；文本框的原生 `change` 在失焦时才触发。
- 30 题已核实、可以直接引用的 TanStack Query 事实（详见 PROGRESS 2.6）：5.102.8 三个包共用 query-core；isLoading = isPending && isFetching、isRefetching = isFetching && !isPending（queryObserver.js:237-265）；默认 staleTime 0、gcTime 客户端 5 分钟 / 服务端 Infinity、retry 客户端 3 / 服务端 0（间隔 1s、2s、4s…上限 30s）、mutation retry 0；hashKey 对纯对象键排序；取消只在 queryFn 读过 signal 时发生（query.js:132-141）；请求失败自动 isInvalidated；mutation 回调顺序（useMutation 级先、mutate 级后且只对最后一次、组件卸载后不执行）；`queryClient.query()` 5.102.0 起、同版弃用 fetchQuery / prefetchQuery / ensureQueryData；`staleTime: 'static'` 5.79.0 起；vue-query-devtools 版本号走 6.x；vue-query 的 `suspense()` 默认不 reject；onlineManager 是全局单例、React / Vue 两侧共用；暂停的请求要在线且页面可见才继续。
- 14 题已核实的事实（详见 PROGRESS 2.7）：react-dom 19.2.8 的 useSyncExternalStore 在开发环境连调两次 getSnapshot，不同就 console.error「should be cached」（:8130），随后无限重渲染抛「Maximum update depth exceeded」；subscribe 换引用就重订（effect 依赖 [subscribe]）；服务端渲染缺 getServerSnapshot 抛「Missing getServerSnapshot ... Will revert to client rendering.」；「Rendered more hooks than during the previous render.」（:7848）/「Rendered fewer hooks than expected. This may be caused by an accidental early return statement.」（:7718）；eslint-plugin-react-hooks 7.1.1 的 isHookName 是 `/^use[A-Z0-9]/` 或单独的 use；Vue watcher 停止时 onWatcherCleanup / onCleanup 注册的清理函数会执行（reactivity effect.onStop），组件卸载时 `scope.stop()`；toValue 3.3+、onWatcherCleanup 3.5+；React 18 博客里没有 tearing 这个词。
- 16 题已核实的事实（详见 PROGRESS 2.8）：zustand 5.0.15 的 useStore 就是 `React.useSyncExternalStore(api.subscribe, useCallback(() => selector(api.getState())), useCallback(() => selector(api.getInitialState())))`（esm/react.mjs:5-13），服务端快照读 getInitialState；selector 返回新对象时开发环境先 console.error「The result of getSnapshot should be cached」再抛「Maximum update depth exceeded」；useShallow 只比较一层；set 先 Object.is 判断、返回原 state 不通知；persist 下 getInitialState 返回水合前的值、localStorage 同步水合、版本不一致没 migrate 会 console.error 并丢弃；devtools 没装扩展时不包装 setState，不写 action 名时先从调用栈推断；`zustand/traditional` 与 `zustand/middleware/immer` 在本仓库缺可选 peer、无法导入。Pinia 3.0.4：setup store 调默认 $reset 开发环境抛「does not implement $reset()」；$subscribe 默认 flush 'pre' + deep，$patch 同步回调一次，**$patch 之后同一 tick 的直接修改默认不回调**（要 flush: 'sync'）；$onAction 的 detached 是第二个位置参数；onError 注释里的「return false」没有实现。Vue 3.4 起 computed 结果没变不通知下游。`<Profiler>` 16.9 起。
- 20 题已核实的事实（详见 PROGRESS 2.9）：react-dom 19.2.8 默认 onCaughtError = console.error（传了回调就不打印），onUncaughtError = reportError + 开发环境 console.warn；被接住的错误不触发 window 的 error 事件（Component 页「bubble up to window」是旧行为）；事件处理函数错误在 executeDispatch 里 try / catch 后交给 reportError，其他监听照常执行；只有 useTransition 返回的 startTransition 的错误进边界，顶层 startTransition 不进；lazy 失败被缓存，重置边界不会重新下载；act 里没接住的错误由 act 重新抛出、不调 onUncaughtError。Vue：模板上的事件处理函数（含 async 被拒绝）、watch 回调进 onErrorCaptured；渲染函数里抛错的组件渲染成空注释，computed 在更新前抛错时 info 是 'component update' 且界面停在上一次；onUnmounted 里模板 ref 已是 null。`<RouterProvider onError>` 7.11.0 起稳定；react-error-boundary 6.1.3（6.0 起只发 ESM，6.1.4 修了 throw null 重置）。
- 26 题已核实的事实（详见 PROGRESS 2.10）：useEffectEvent 19.2.0 起（react 18.3.1 / 19.0 / 19.1 稳定版都没有导出；实验期名字 experimental_useEvent → experimental_useEffectEvent；RFC useEvent 2022-09 搁置）；eslint-plugin-react-hooks 6.1.0 起识别（5.x 与误发的 6.0.0 不识别）；参考页 Caveats 四条（第 1 条是「顶层调用」，「not reactive、不写进依赖」出自 learn 页与 useEffect 页）；react-dom 19.2.8 每次渲染返回新的包装函数、共用一个 ref，更新时新回调在这次提交的 before-mutation 写入（早于 insertion / layout / passive），运行时只拦渲染期调用（生产错误码 440），onClick 里调用照常执行；**19.2.x 的 memo()（不带比较函数）/ forwardRef 组件里 Effect Event 一直调用第一次渲染的回调，19.3.0 修复（#34831）**；latest ref 用 useEffect 同步有窗口期（本组件 layout effect、子组件 Effect 读到旧值）；react.dev 挑战题「Read the latest state」用 ref 在事件处理函数里保存最新值（官方没有给 latest ref 命名）；exhaustive-deps 的依赖比较在渲染阶段（updateEffectImpl）；JSX 事件派发时读 DOM 节点上最近一次提交的 props（getListener）；Vue watch 回调在 effect.run() 之后调用所以不登记依赖，watchEffect 里读 logRef.value 会被收成依赖；Vue 3.5.42 把解构出来的 prop 直接传给 watch 时 compileScript 抛错（文档写的是 warning）；react.dev 有三处 Pitfall 写成 eslint-ignore-next-line（ESLint 没有这个指令）；npm 上周下载（2026-09-18）React 18 / 19.0 / 19.1 合计 30.45%。
- 01 题已核实的事实（详见 PROGRESS 2.11）：小写组件名的两条开发期报错原文；class / for / tabindex / onclick / ariaLabel 的报错原文；style 传字符串抛错原文；style 数字补 px 的规则（0 与 unitlessNumbers 不补，含 aspectRatio / lineClamp / scale）；返回 undefined 18.0 起不报错（CHANGELOG「Components can now render undefined」）；开发环境 JSX 编译成 jsxDEV（vite 的 jsxDev: !isProduction），生产是 jsx() / jsxs()；新 JSX 转换 2020 年「is not required」→ 19「now required」；StrictMode 参考页四项开发期行为与双调用范围；Fragment Refs 在 19.3 转正（本仓库 19.2.8 没有 FragmentInstance）；Vue :style 数字不补单位（jsdom 与 Chrome 都丢掉 width: 48）；compiler-sfc 的实际编译带静态提升与 -1 CACHED；Vue 在渲染函数里现场创建组件对象同样每次重建；lint 对渲染期突变只拦重新赋值（globals）和属性赋值（immutability），arr.push() 拦不住。
- 02 题已核实的事实（详见 PROGRESS 2.12）：开发构建 props 被浅冻结（react-jsx-dev-runtime.development.js:193），函数组件拿到的就是 element.props，赋值抛「TypeError: Cannot assign to read only property 'amount' of object '#<Object>'」；生产构建赋值成功、不重渲染、子组件自己重渲染时读到改过的值、父组件重渲染后恢复；Vue 开发构建 setup 拿 shallowReadonly(props)，赋值警告「[Vue warn] Set operation on key "amount" failed: target is readonly.」、值不变，生产构建赋值成功并重渲染、父组件传同样的值时界面一直停在改过的值；读 props.key 报「X: `key` is not a prop. …」（整页只报一次）；展开含 key 的对象报「A props object containing a "key" prop is being spread into JSX …」；读 element.ref 报「Accessing element.ref was removed in React 19. …」（升级指南文案不同）；函数组件 defaultProps 在 jsx() 路径静默忽略、createElement 路径仍合并（`<C {...p} key="k" />` 编译成 createElement）；propTypes 静默忽略；forwardRef 19.2.8 可用无提示、@types/react 19.2.18 / 19.3.0 没标 @deprecated；@types/react 的 ComponentProps JSDoc 建议用 WithRef / WithoutRef；data-* 不在 ComponentProps 类型里；Vue 3.5 propsDestructure 默认开启、给解构 prop 赋值编译报错「Cannot assign to destructured props as they are readonly.」、解构默认值后 vue-tsc 去掉 undefined；布尔 prop 缺省 false；没关 inheritAttrs 又手动 v-bind="attrs" 时 class 重复、同一监听器去重；多根组件没绑 $attrs 警告「Extraneous non-props attributes (…) … fragment or text or teleport root nodes.」；useAttrs 文档说不能 watch，3.5.42 实测 watch getter 会触发（3.2 #4161）；react.dev 没有「无值属性 = true」的原文（出处 legacy JSX In Depth）；表单里没写 type 的 <button> 是提交按钮（MDN）。
- 03 题已核实的事实（详见 PROGRESS 2.13）：Object.is 相同时，没有待处理更新就当场比较、连组件函数都不调用（react-dom :9143-9161）；组件刚因自己的 state 更新重渲染过时会调用一次组件函数再跳过子组件（:8070-8072、:10174-10179），`<Profiler onRender>` 这时仍报一次 update；RE_RENDER_LIMIT 25；初始化函数「should be pure」、更新函数与 reducer「must be pure」，StrictMode 下初始化函数采用第一次的结果、更新函数在非急切路径下采用第二次；React 18 升级指南「Before React 18, we only batched updates inside React event handlers.」；eslint-plugin-react-hooks 7.1.1 的 recommended 实际 16 条规则，immutability 拦 `items[0].quantity++`、拦不住 `items.find()` 后改字段和 `push()`，set-state-in-render 不报 `items.map()` 回调里的 `onClick={fn(id)}`；Vue `<script setup>` 的普通 let 一直活着但不触发渲染；`readonly T[]` / `Readonly<T>` 都是浅的。
- 04 题已核实的事实（详见 PROGRESS 2.14）：React 17 起大多数事件委托在 root 容器（listenToAllSupportedEvents :19209），nonDelegatedEvents（scroll、scrollend、load、媒体事件等）冒泡监听挂在元素本身；touchstart / touchmove / wheel 用 `{ passive: true }` 注册（:19251-19270，出处是 React 17 changelog）；和原生监听器混用的顺序：window / document 捕获 → React 捕获 → 容器里面元素的原生捕获 → 目标与冒泡路径上的原生监听 → React 冒泡 → document / window 冒泡；onClick 里 stopPropagation 挡不住 root 里面元素上已执行的原生监听器，onClickCapture 里调用则全挡；合成事件的 preventDefault 无条件把自己的 defaultPrevented 设成 true，原生默认动作看 `e.nativeEvent.defaultPrevented`；提交按钮的 onClick 跑在约束校验之前、回车会对提交按钮派发 click、requestSubmit() 不经过按钮；字符串处理函数报「Expected `onClick` listener to be a function, instead got a value of `string` type.」；Vue 的 `@click.right` / `.middle` 被编译成 contextmenu / mouseup，修饰符守卫按书写顺序执行，按键修饰符只比较 event.key；组字判断写 `isComposing || keyCode === 229`。
- 05 题已核实的事实（详见 PROGRESS 2.15）：`<Activity mode="hidden">` 给子元素写 `style="display: none !important;"`，再显示时变回空串，Effect 清理后重建；@types/react 19.2.18 标 `@version 19.2.0`（index.d.ts:2013），参考页没写版本；return null 的组件自己的 state / Effect 在、子组件被卸载；true / false / null / undefined / '' / [] 不产生节点，0、NaN、0n 渲染成文本；Vue 模板 v-if / v-else 由编译器注入 key（compiler-core.cjs.js:4702-4732、4837-4883），渲染函数三元同类型复用；组件上的 v-show 每次切换强制更新子组件（runtime-core.cjs.js:4842），onBeforeUpdate / onUpdated 照常；KeepAlive 停用（runtime-core.cjs.js:2919-2936）不停组件的 effect，watch 与重新渲染继续，DOM 移出文档、激活时插回同一个元素；Vue 插值里 false 显示「false」；v3 迁移指南「In 2.x, when using v-if and v-for on the same element, v-for would take precedence.」；eslint-plugin-react 7.30.0 起有 jsx-no-leaked-render（不在 recommended）。
- 06 题已核实的事实（详见 PROGRESS 2.21；另有：块体箭头函数忘了 return 时 tsc 报 TS2322 void[]、本项目 lint 不拦、核心规则 array-callback-return 能拦；Vue 3.5.42 重复 key 只在乱序更新时警告一次且 DOM 出错；Vue 的 watch 在组件更新前执行，React 在 Effect 里 setState 重置先渲染一次旧值；19.2.8 的 <Fragment ref> 报 Invalid prop 且 ref 为 null；Children / cloneElement 属于 react.dev 的 Legacy React APIs；HTML 允许用 <div> 包 <dl> 的每组 dt / dd）：缺 key 报「Each child in a list should have a unique "key" prop.\n\nCheck the render method of `Missing`. See https://react.dev/link/warning-keys for more information.」（文档展示的带「Warning:」前缀，19.2.8 实际没有）；重复 key 报「Encountered two children with the same key, `a`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.」；index 作 key：开头插入 / 删除第一行时非受控输入错位，只在末尾追加不错位；Math.random() 作 key 每次重渲染都重建、输入全丢，lint 报 react-hooks/purity「Cannot call impure function during render」；react.dev 原文是「that's what React will use if you don't specify a key at all」（不是 by default），key 要在「creating items」时生成并存进数据；`<>` 不能带 key，要 `<Fragment key>`，Fragment ref 19.3 才稳定（19.2.8 没有）；Children 页 Pitfall「Using Children is uncommon」，替代写法之一是「Accepting an array of objects as a prop」；react.dev 的 memo / useMemo 页都没有推荐虚拟化长列表；updating-arrays 页示范 `[...list]` 拷贝后 sort / reverse，没有提 toSorted；本项目 tsconfig lib 是 ES2022，类型里没有 `toSorted`（运行时有），课件用 `[...arr].sort()`；`crypto.randomUUID()` 只在安全上下文可用（localhost 算，局域网 IP 的 http 不算），jsdom 里有；Vue：`n in 10` 从 1 开始，遍历对象是 (value, key, index)，`<template v-for>` 的 key 放在 template 上，默认「in-place patch」、只在不依赖子组件 state 或临时 DOM state 时安全，key 期望 number | string | symbol，重复 key 在 3.5.42 开发构建警告「Duplicate keys found during update: … Make sure keys are unique.」，缺 key 运行时不报警（runtime-core.cjs.js 里只有重复 key 的警告 :6542；模板里由 `vue/require-v-for-key` 拦），组件上 v-for 不会自动传 item，数组 7 个变更方法可侦测，v-memo 3.2+（大列表 > 1000 才考虑）。
- 18 题已核实、可以直接引用的 React Router 事实：同一次导航里父子 loader 并行（`defaultDataStrategy` 里的 `Promise.all`）；多个 loader 同时 redirect 时最深一层优先（`findRedirect` 从后往前找）；middleware 不调用 `next()` 会自动继续，`next()` 只能调用一次；Data 模式专有 hook 在非 Data 路由下会抛「must be used within a data router」；redirect 到跨域绝对地址会整页跳转；memory history 只有第一条记录的 key 是 `"default"`。vue-router 5 的 memory history 不记录 `back`。

## 7. 会话结束前（或上下文快满时）

1. 当前题没做完：先不提交半成品代码，在 PROGRESS.md 写清做到哪、还差什么；已经通过检查的可以提交。
2. 更新 PROGRESS.md 的阶段状态、每题状态和「下一步」，并提交文档。
3. 向用户简短汇报：本会话完成了哪些题（附 commit）、有没有需要他决定的事；最后提示他在新会话里继续发送「读 `docs/upgrade/CONTINUE-PROMPT.md`，按它继续执行」。
