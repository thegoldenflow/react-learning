# 第二轮审计任务：学习完整性审计（交给一个全新的会话执行）

> 把本文件全文作为新会话的第一条消息。基准日按执行当天写。

## 0. 你是谁、要做什么

你是资深前端工程师兼技术讲师。仓库 `D:\code\AI\learning\react` 是一个 React × Vue 3 对照学习站（30 题，每题 `src/topics/<NN-slug>/react/Example.tsx` + `vue/Example.vue`，部分题有辅助文件）。学习者熟悉 Vue 3，目标是 **学 React 到「面试能答、上生产不踩坑」**。

已经有一轮审计（`docs/upgrade/AUDIT.md`）。它的长处是查错：176 条问题都有行号和依据。它的短板是 **查缺不够**：

- 「缺什么」只在每题写了一行「覆盖检查」，没有定级，没有进统计，没有跨题汇总；
- 它默认沿用了规格文件里的「主线」选择（例如 18 题路由以声明式模式为主线），没有拿官方文档的定位去质疑；
- 审计清单把「已知问题模式」排在前面、「覆盖检查」排在第九位，子代理的注意力自然落在挑错上；
- 结果就是：18 题里连 React Router v7 官方 Data 模式的标准启动代码（`createBrowserRouter` + `RouterProvider` + loader）一行都没有，这件事在报告里只是一个括号。

你的任务是 **反过来做**：先不看课件，从官方文档出发写出「每题应该教什么」的目标大纲；再拿目标大纲去对照现状，把每一处缺失当成和错误同等级的问题定级；最后再和第一轮对比，指出第一轮漏了什么、说错了什么。产出必须能直接当作阶段 2 逐题重写的大纲用。

## 1. 硬规则

1. **只读**。不改仓库任何文件、不装依赖、不跑 dev server。你只能写：`docs/upgrade/AUDIT-ROUND2.md`（交付物）、`docs/upgrade/PROGRESS.md`（结束时更新状态）、以及会话 scratchpad 里的临时文件。
2. **事实必须有依据**，优先级：① `node_modules` 里已安装包的 `.d.ts` / 源码 → ② 官方文档（react.dev、reactrouter.com、vuejs.org、router.vuejs.org、pinia.vuejs.org、tanstack.com、vite.dev、vitest.dev、testing-library.com）→ ③ 官方博客 / 发布说明。查不到就标「待核实」，不凭记忆下结论。
3. **版本基线直接采用** `docs/upgrade/AUDIT.md` 的 §2.2 与附录 A（已核实的 API 事实卡），不要重做版本调查。要点：react 19.2.8 主线（19.3 新特性【尝鲜】、React 18 差异【旧写法】）；react-router 7.18.3 主线、从 `react-router` 导入、v8【尝鲜】、v6【旧写法】；Data 模式的 middleware 不需要 future flag；vue 3.5.42、vue-router 将升 5.3.1、pinia 3.0.4；zustand 5、TanStack Query 5；React Compiler 不启用但要讲；eslint-plugin-react-hooks 7.1.1 的 `recommended` 已含编译器规则。
4. **第 3 步之前不要读 `AUDIT.md` 的 §3、§4、§5**，只允许读 §0、§2、附录 A。这是为了让你的目标大纲和缺失判断独立于第一轮。
5. 成熟度标签按规格 `course-upgrade-prompt.md` §3.1：【主流】【较新】【尝鲜】【旧写法】。
6. 已经定下的决定（`AUDIT.md` §5.0）不要推翻，但可以补充：不启用 React Compiler；新增 31 表单与 Actions、32 并发与异步 UI、33 服务端与 RSC 概念课、34 测试、35 安全与可访问性；**18 题主线改为 Data 模式**，声明式 + RequireAuth 作并排；26 题 useEffectEvent 保留主线并标【较新】。

## 2. 方法（按顺序做，每一步都要落到文件里）

### 第 1 步：先写「目标大纲」，不看课件

对 30 题 + 已定的 5 个新题（31–35）逐题写出：

- **必会【主流】**：面试必答 + 生产必用的 API / 概念，每一条注明 react.dev 或对应官方文档的具体页面；
- **加分【较新】**：稳定但尚未普及的（19.2 的 Activity / useEffectEvent、React Compiler、react-router middleware、vue-router 5 文件路由等）；
- **了解【尝鲜】**：19.3 的 ViewTransition 等，只需一句；
- **读懂【旧写法】**：React 18 及以前、react-router v6、vue-router `next()` 等存量代码里会见到的写法，注明从哪个版本变化；
- **面试 5 问**：这题最常被问的 5 个问题（含追问）；
- **生产写法要点**：这题的演示如果放到真实项目，必须补哪些东西（异步状态、错误处理、边界、URL 状态、安全、类型）；
- **Vue 对照**：只写核实过的对应关系；没有对应物时说明原因。

来源建议：react.dev 的 Learn 全部章节 + Reference（react / react-dom / react-dom/client / eslint-plugin-react-hooks）、reactrouter.com 的 Declarative / Data 两条模式的 Start 与 How To、vuejs.org Guide 与 API、router.vuejs.org、pinia.vuejs.org、tanstack.com/query v5 Guides。目标大纲写进 `AUDIT-ROUND2.md` 第 1 节，每题一小节。

### 第 2 步：现状对照，把「缺」当问题定级

读每题的全部文件（含辅助文件），对目标大纲的每一条标记：已讲对 / 讲了但错 / 讲了但缺标签或版本限定 / **未讲**。定级规则：

- **严重**：题目标题或文件头承诺了的【主流】知识点未讲，或讲错；
- **概念**：【主流】加分点、【较新】内容、【旧写法】对照缺失；绝对化或过时表述；
- **生产**：演示写法未标「演示简化」且没有生产做法；
- **小问题**：措辞、标签、交叉引用。

每条给 `file:line`（用带行号的读取，行号必须真实）。此外做一个「学习者测试」：拿第 1 步的面试 5 问，逐问判断「只读这题的文件能不能答上来」，答不上来的列出来。

### 第 3 步：主线判定

凡是同一需求有多种主流写法的题，明确写出「主线应该是哪个、并排是哪个」，并给依据（官方文档的定位原文 + 采用情况 + 面试现实）。至少覆盖：18 路由（已定 Data 主线，请核对其余 12 条修改点是否要跟着调整）、07/19/31 表单（受控 vs Actions）、11/30 数据获取（effect 手写 vs TanStack vs loader vs use()）、14 订阅外部系统（useEffect vs useSyncExternalStore）、16 状态管理（Zustand vs Context vs RTK）、20 错误边界（class vs react-error-boundary）、26 过期闭包（useEffectEvent vs latest ref）。

### 第 4 步：与第一轮对比

现在才读 `AUDIT.md` 的 §3、§4、§5。产出三张清单：**第一轮漏掉的**（你发现而它没有）、**第一轮说错的**（附你的依据）、**同意的**（不用重复展开，列编号即可）。不要把第一轮已经正确指出的问题重抄一遍。

### 第 5 步：给出「每题重写大纲」

把第 1、2 步合成阶段 2 可以直接执行的东西：每题一份按规格 §9 十段模板组织的大纲（30 秒速答、核心概念、Vue 对照、关键区别、追问、易错点、生产注意、旧写法、新动向、练习、参考），每段列要点，不写正文。这是本轮最重要的交付。

## 3. 第一轮已知的盲点（必须逐个核对，不能只说「已覆盖」）

- React Router：Data 模式的标准启动代码（`createBrowserRouter` / 演示用 `createMemoryRouter` + `RouterProvider` from `react-router/dom` + `loader` + `useLoaderData` + `Component`/`element`）、`errorElement` / `useRouteError`、`lazy` 路由属性、`action` + `<Form>` + `useFetcher`、`useNavigation` pending 状态、`defer`/流式（v7 里 loader 直接返回 promise）、middleware 守卫、`useBlocker`、`handle`/`useMatches`、导入路径 v6 → v7 → v8。
- React 19 Actions 家族：`<form action>`、`useActionState`、`useFormStatus`、`useOptimistic`、`startTransition` 里的 async 函数；错误进 Error Boundary。
- 并发与异步 UI：`useTransition`、`useDeferredValue`、`Suspense` + `use(promise)`、`React.lazy`、`<Activity>`、`<ViewTransition>`。
- 散点 Hook：`useId`、`useSyncExternalStore`、`useImperativeHandle`、ref 回调清理函数、`use(Context)`。
- 性能：React DevTools Profiler、列表虚拟化、React Compiler 的原理与 `preserve-manual-memoization` 等规则。
- 测试：Vitest + Testing Library 怎么测 Hook、路由、异步；`act`；MSW 是否值得提。
- 安全与 a11y：`dangerouslySetInnerHTML` ↔ `v-html`、开放重定向、令牌存储、前端权限边界、`aria-*`、焦点管理。
- 服务端：CSR / SSR / SSG / RSC、`'use client'` / `'use server'`、Next.js App Router、Server Functions；React 19 的 `<title>` / `<meta>` 元数据。
- Vue 侧对照是否用了 3.4 / 3.5 的现行写法：`defineModel`、`useTemplateRef`、响应式 props 解构、`onWatcherCleanup`、守卫返回值写法、vue-router 5 文件路由与 `vue-router/experimental` 数据加载器、pinia setup store。
- TypeScript：React 19 类型变化（`useRef` 必须传参、`React.JSX`、`ReactElement` props 为 unknown）、泛型组件、`ComponentProps` 与 ref-as-prop。

## 4. 输出文件 `docs/upgrade/AUDIT-ROUND2.md` 的结构

```
# 第二轮审计：学习完整性（日期）
## 0. 方法与来源清单
## 1. 逐题目标大纲 vs 现状（30 + 5 题，每题：目标大纲表 | 现状标记 | 缺失问题表 | 学习者测试）
## 2. 缺失汇总（跨题，按严重 / 概念 / 生产分组；每条给题号 + 要点 + 建议落点）
## 3. 主线判定（每题一段：主线 / 并排 / 依据）
## 4. 与第一轮的差异（漏掉的 / 说错的 / 同意的）
## 5. 每题重写大纲（按规格 §9 十段模板，30 + 5 题）
## 6. 需要用户决定的事项
## 附录 待核实汇总
```

## 5. 工作方式

- 题多，分批做（每批 4–6 题），可以用子代理并行，但这台机器只有 4 核，**并发不要超过 2**。每批先写目标大纲再对照，结果先写 scratchpad 再合并进交付文件，避免上下文用尽时丢结果。
- 每完成一批就把 `AUDIT-ROUND2.md` 写一次（追加），不要攒到最后。
- 结束前更新 `docs/upgrade/PROGRESS.md`：把「第二轮审计」标为完成，遗留项写进「遗留 / 待核实」。
- **做完停下，等用户确认**，不进入阶段 1。

## 6. 最终回复的格式

只回复：交付文件路径；缺失汇总的数量（严重 / 概念 / 生产）；第一轮漏掉的最重要的 5 件事；主线判定的一句话结论清单；需要用户决定的事项编号。不要把整份报告贴回来。
