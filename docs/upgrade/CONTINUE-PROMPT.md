# 课件升级 · 接续执行 prompt（阶段 2 其余题 → 阶段 3 → 阶段 4）

> **用法**：在新会话里发送「读 `docs/upgrade/CONTINUE-PROMPT.md`，按它继续执行」。
> **一次只开一个会话**执行本文件：`PROGRESS.md`、`eslint-suppressions.json`、README、注册表、`src/shared/` 是共享文件，并行会互相覆盖。
> 本文件写于 2026-09-17（同日第三次更新），可以反复使用：每个会话都从 `docs/upgrade/PROGRESS.md` 的「下一步」接着做。两者冲突时以 PROGRESS.md 为准。

---

## 0. 任务

你是资深前端工程师兼技术讲师，在继续升级 `D:\code\AI\learning\react`：一个「学 React（Vue 3 对照版）」学习站点，每题一个 React 示例（主教学文件，大量中文注释）+ 一个 Vue 3 对照。读者熟悉 Vue、在系统学 React 并准备面试。目标：**学得对、学的是主流、面试能用、上生产不踩坑**。

阶段 0（两轮审计）、阶段 1（依赖与工具链）已完成；阶段 2 的 18 路由样板已完成并**经用户确认**，随后已完成 2-A（Vue 响应式措辞）与 2-B 的 **07、19、11、30、14** 五题。你要做的是：**接着 2-B 的 16 题往下做**（16 → 20 → 26），然后 2-C 其余题 → 阶段 3 新题 31–35 → 阶段 4 一致性检查与交付文档。

## 1. 开工前按顺序读

1. `docs/upgrade/PROGRESS.md`：当前进度、「下一步」、每题状态、遗留与待核实。
2. 仓库根目录 `course-upgrade-prompt.md`（用户写的规格，未跟踪，不要提交）：§1 工作规则、§2 验收标准、§3 成熟度标签与主流判定、§9 文件头模板、§11 完成定义。
3. `docs/upgrade/AUDIT.md` §5.0 决定表（5.1–5.16）和附录 C（两轮审计怎么合起来用）。
4. `docs/upgrade/AUDIT-ROUND2.md` §3（主线判定）和 §6（D2 决定）。
5. **样板**：`src/topics/18-routing/` 下全部文件，以及 PROGRESS.md 的 2.1 节。风格、深度、注释密度、测试写法都照它来。
6. **已完成各题的成品**（同样是样板，越往后写法越接近现在的节奏）：`src/topics/07-forms/`、`19-async-submit/`、`11-api-request-state/`、`30-tanstack-query-server-state/`、`14-composable-and-custom-hook/`，以及 PROGRESS.md 的 2.3–2.7 节（每节都写了「问题表处理」「待核实项结论」「新发现」「验证」四块，新题照这个格式记录）。最新的 30、14 两题最能代表现在的做法：先用只读工作流核实事实，再写代码，测试覆盖每条结论。
7. PROGRESS.md 的「**统一措辞**」一节（Vue 响应式、表单与事件类型、服务端状态 / TanStack Query、自定义 Hook 与订阅外部数据源四张表）：这些说法已定稿，后续各题直接照用，不要再自己另起一套。

然后：`git status`（只应有两个未跟踪的规格文件）、`git log --oneline -5`、跑一次 `npm run check` 确认基线是绿的。

## 2. 当前状态（2026-09-17 第三次更新）

- 分支：`phase-1-toolchain`（34cd734 工具链、b7bcb90 ESLint 10）→ `phase-2-topics`：0e2874b 壳修复、4252967 **18 样板**、c03ae3b / 622bec1 文档、ccfd3db **2-A 统一 Vue 响应式措辞**、111ddfa **07 表单**、b9cc7b1 **19 异步提交**、659c24d **11 请求状态**、6358cbc 接续 prompt、5c04d9e **30 TanStack Query**、61281d7 **14 自定义 Hook**。都**没有 push、没有 PR**，不要自己推送或合并。
- 依赖基线：React 19.2.8、react-router 7.18.3（从 `react-router` 导入，`RouterProvider` 从 `react-router/dom`）、vue 3.5.42、vue-router 5.2.0、pinia 3.0.4、zustand 5.0.15、@tanstack/*-query 5.102.8、react-error-boundary 6.1.3、ESLint 10.8.1、Vitest 4.1.11 + jsdom 29.1.1 + Testing Library（React / Vue）+ @vue/test-utils 2.4.11、TypeScript ~5.9.3、Vite 7.3.6。
- 已确认的样板风格（5.16）：
  1. 完整十段文件头只写在 `react/Example.tsx`；`vue/Example.vue` 写题目信息 + Vue 侧要点，并指向 React 文件；
  2. 一题可以拆成多个文件（主线 / 并排 / 模拟服务 / 测试），页面源码查看器能切换查看；
  3. 规格与大纲点名的主线能力做成可运行代码，并排版只演示和主线不同的部分；
  4. 每条关键结论配自动化测试，测试和示例放同目录（`react/Example.test.tsx`、`vue/Example.test.ts`）；
  5. 引用还没建的新题写「（32 题，待新增）」；
  6. 模拟服务可注入延迟（页面上几百毫秒，测试里 0）。
- 其余已定决定（详见 AUDIT.md §5.0）：不启用 React Compiler（手写记忆化是主线，编译器作【较新】小节）；新增 31–35，36（样式方案）/ 37（表单工程化，需装 react-hook-form + zod）可选、放最后问用户；01–30 不重编号；Redux Toolkit 并入 16（只讲概念，不装依赖）；工程化与 StrictMode 并入 README + 10 / 23；心智模型总结和面试总索引是阶段 4 文档；「严重」按外延解读（D2-1）；22 题保留 effect 手写，在「七、生产环境注意」写三种生产改写（D2-2）；新装或升级依赖取「满 30 天的最新补丁」，已装在用的不降级（5.14）。
- 当前数字（2026-09-17 第三次更新）：`没有一一对应关系` 90 处 / 46 个文件；`永远` 124 处、`根本没有` 6、`完全相同` 5、`完全一样` 7；`eslint-suppressions.json` 剩 **11 条 / 6 个文件**（10 / 12 / 21 / 23 / 24 / 27）。全量测试 155 条、15 个测试文件。
- **已经积累的可复用做法**（前五题实测过，后面各题优先照用）：
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
  12. 外部 store 做演示日志（`createDemoLog` / `createRequestLog`）：queryFn、mutation 回调、Effect 里写日志都不碰 React state，用 `useSyncExternalStore` 读；计数类实验的显示放在兄弟组件里，免得「重渲染 → 重订 → 计数 → 重渲染」绕圈（14 题 SubscribeLab）。

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

`07 → 19 → 11 → 30 → 14 → 16 → 20 → 26`。**07（111ddfa）、19（b9cc7b1）、11（659c24d）、30（5c04d9e）、14（61281d7）已完成，从 16 开始做。** 主线口径已确认（AUDIT-ROUND2.md §3 有官方原文依据，直接采用）：
- **07 表单 —— 已完成（111ddfa，见 PROGRESS 2.3）**：受控（`value` + `onChange`）与非受控（`defaultValue` + `FormData`）两种基础写法都是主线；加 `useId`【主流】；Actions 写法指向 31（待新增）。「八、旧写法对照」只放 React 18 差异（`useFormState` → `useActionState` 更名、18 没有 `<form action>`），**不要把受控写法标成旧写法**。`FormEvent` 在 @types/react 19.2 已 `@deprecated`，改用 `SubmitEvent`（待核实项 M-2，先核实 `node_modules/@types/react/index.d.ts`）。
- **19 异步提交 —— 已完成（b9cc7b1，见 PROGRESS 2.4）**：手写 `submitting` + 防重复（useState + ref 锁）是主线；`useTransition` / `useActionState` 的 `isPending` 作并排，指向 31。
- **11 请求状态 —— 已完成（659c24d，见 PROGRESS 2.5）**：在 Effect 里手写请求，讲透四态建模（判别联合）+ 竞态 + 取消 + 重试；文件头写明「教学用，生产用缓存层，见 30」，并引用 react.dev useEffect 页对 Effect 取数缺点的原文。路由 loader 作并排（指向 18），`use(promise)` 只作【较新】引用（指向 32，待新增）。
- **下一题 16 之前先看**：30 题已经把「服务端状态不进 store」讲透（does-this-replace-client-state 页原文、区块五缓存观察窗），16 题只需交叉引用、不要重复；14 题已核实 zustand 5.0.15 的 `useStore` 就是 `React.useSyncExternalStore(api.subscribe, useCallback(() => selector(api.getState())), useCallback(() => selector(api.getInitialState())))` + `useDebugValue`（`node_modules/zustand/esm/react.mjs:5-13`），「selector 返回新对象会怎样」「为什么要 useShallow」可以直接接 14 题「getSnapshot 必须稳定」的结论（14 题有测试）。pinia 已装 3.0.4，pinia 4 于 2026-07-14 首发、不满 3 个月，按规格 §4 只作【尝鲜】介绍；Redux Toolkit 只讲概念、不安装（决定 5.0 表）。16 题有无 lint 抑制：没有（剩下的 11 条在 10 / 12 / 21 / 23 / 24 / 27）。
- **30 TanStack Query —— 已完成（5c04d9e，见 PROGRESS 2.6）**：v5 作生产默认【主流】；讲 `status × fetchStatus` 两个维度，v4 术语标【旧写法】；补 `useSuspenseQuery` 一节。和 18 交叉说明两种主流组合：「Data 模式 loader 取数」和「任意路由 + TanStack Query」，各自由谁负责 pending / 错误 / 失效重取。`fetchQuery` 已标 `@deprecated`，指向 `queryClient.query()`（M-8，先核实版本）。
- **14 自定义 Hook —— 已完成（61281d7，见 PROGRESS 2.7）**：`useWindowWidth` 这类订阅浏览器 API 的 Hook 主线改为 `useSyncExternalStore`；`useEffect` + `setState` 订阅作过渡对照（讲撕裂与 SSR 快照）。防抖 Hook 仍用 `useEffect`。把 `react/*.ts` 的 lint 抑制清掉。
- **16 全局状态**：Zustand 5 主线（`create` + selector + `useShallow`）对照 Pinia；Context + `useReducer` 作 React 内置并排；Redux Toolkit 作【主流·存量】对照一节（概念 + 示意代码，不安装）。
- **20 错误边界**：手写 class 是主线（解释为什么必须是 class）；`react-error-boundary`（已安装）作可运行的并排（`fallbackRender`、`onError`、`resetKeys`、`useErrorBoundary`）。补「异步错误一般捕获不到，例外是 `useTransition` 返回的 `startTransition`」（官方原文见 AUDIT-ROUND2.md §3.6）和 React 19 的 `onCaughtError` / `onUncaughtError`。Vue 侧 `onErrorCaptured` 对 Promise 拒绝的捕获范围先运行验证（M-3、D2-5）。
- **26 过期闭包**：修法优先级为 ① 函数式更新 → ② 写对依赖 → ③ `useEffectEvent`【较新·19.2 起】作主线示例（写全官方四条限制）→ ④ latest ref 作并排（React 18 项目仍需要）。以 AUDIT-ROUND2 §3.7 为准；AUDIT.md §4.3 表里「latest ref 回到主线」那句已被附录 C 覆盖。

### 3.3 阶段 2-C：其余题（每题 1 个 commit，按编号）

`01 → 02 → 03 → 04 → 05 → 06 → 08 → 09 → 10 → 12 → 13 → 15 → 17 → 21 → 22 → 23 → 24 → 25 → 27 → 28 → 29`。
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
- 18 题已核实、可以直接引用的 React Router 事实：同一次导航里父子 loader 并行（`defaultDataStrategy` 里的 `Promise.all`）；多个 loader 同时 redirect 时最深一层优先（`findRedirect` 从后往前找）；middleware 不调用 `next()` 会自动继续，`next()` 只能调用一次；Data 模式专有 hook 在非 Data 路由下会抛「must be used within a data router」；redirect 到跨域绝对地址会整页跳转；memory history 只有第一条记录的 key 是 `"default"`。vue-router 5 的 memory history 不记录 `back`。

## 7. 会话结束前（或上下文快满时）

1. 当前题没做完：先不提交半成品代码，在 PROGRESS.md 写清做到哪、还差什么；已经通过检查的可以提交。
2. 更新 PROGRESS.md 的阶段状态、每题状态和「下一步」，并提交文档。
3. 向用户简短汇报：本会话完成了哪些题（附 commit）、有没有需要他决定的事；最后提示他在新会话里继续发送「读 `docs/upgrade/CONTINUE-PROMPT.md`，按它继续执行」。
