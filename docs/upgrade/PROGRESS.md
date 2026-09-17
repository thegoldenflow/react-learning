# 课件升级进度（docs/upgrade/PROGRESS.md）

> 规格：仓库根目录 `course-upgrade-prompt.md`（基准日 2026-09-16）。
> 新会话先读本文件，再接着做。上下文快满或会话要结束时，先更新本文件。

## 阶段状态

| 阶段 | 内容 | 状态 | 交付物 | 备注 |
|---|---|---|---|---|
| 0 | 审计（只读） | **完成。** 两轮审计均完成；用户 2026-09-17 答复「全部按建议执行」（AUDIT-ROUND2.md §6 D2-1～8，记录在 AUDIT.md §5.13）；两轮合并规则写在 AUDIT.md 附录 C | `docs/upgrade/AUDIT.md`（含 §5.13、§5.14、附录 C）、`docs/upgrade/REAUDIT-PROMPT.md`、`docs/upgrade/AUDIT-ROUND2.md` | 两轮审计与合并说明均已提交（d550e27、1efc217） |
| 1 | 依赖与工具链调整 | **完成（2026-09-17）**，commit「阶段 1：依赖与工具链调整」。**有一项新待决 D1-1（ESLint 9 已 EOL），见下文 1.6** | package.json / package-lock.json、vitest.config.ts、eslint.config.js + eslint-suppressions.json、tsconfig.json、src/test/、4 处 react-router 导入、README 事实行 | 复核口径与全部记录见下文「阶段 1 记录」；版本决定见 AUDIT.md §5.0 的 5.14 |
| 2 | 逐主题修改（先改 18 路由样板） | 未开始。顺序：先单独一个 commit 修站点壳的 3 条 lint 命中（1.4），再改 18 样板 | 每题一个 commit | 样板完成后停止等确认 |
| 3 | 补充新主题 | 未开始 | | 按阶段 0 确认的清单 |
| 4 | 一致性检查 + CHANGELOG | 未开始 | `docs/upgrade/CHANGELOG.md` | |

## 阶段 0 进度

| 步骤 | 状态 |
|---|---|
| 基线检查（`npx eslint . --max-warnings=0`、`npx vue-tsc --noEmit`） | 完成：两者均通过（exit 0） |
| 版本采用情况调查（npm 周下载 / 发布时间 / peerDependencies） | 完成：数据已抓取，结论见 AUDIT.md §2 |
| API 事实卡（node_modules + 官方文档核实） | 完成：见 AUDIT.md 附录 A（99 项核实 / 3 项待核实） |
| 逐题审计 批次 A（01–06） | 完成（已合并进 AUDIT.md §3） |
| 逐题审计 批次 B（07–11） | 完成（已合并进 AUDIT.md §3） |
| 逐题审计 批次 C（12–17） | 完成（已合并进 AUDIT.md §3） |
| 逐题审计 批次 D（18–22） | 完成（已合并进 AUDIT.md §3） |
| 逐题审计 批次 E（23–26） | 完成（已合并进 AUDIT.md §3） |
| 逐题审计 批次 F（27–30） | 完成（已合并进 AUDIT.md §3） |
| 合并 + 全局问题 + 主题调整建议 + 待决事项 | 完成：AUDIT.md §3.0 / §4 / §5 / 附录 A / 附录 B |
| 第二轮 · 大纲阶段（O1–O5：不看课件，按官方文档写 35 题目标大纲） | 完成（35 份 outline + 10 份主线 evidence） |
| 第二轮 · 对照阶段（A–J：逐题带行号对照、缺失定级、学习者测试、十段重写大纲） | 完成（35 题 × audit / rewrite / pending） |
| 第二轮 · 主线判定 + 回填 | 完成：AUDIT-ROUND2.md §3（7 组 + 跨题口径）；11 份主线题大纲已按判定回填 |
| 第二轮 · 与第一轮对比 | 完成：AUDIT-ROUND2.md §4（第一轮漏 235 / 错 9 / 同意 164 / 备注 123） |
| 两轮合并进 AUDIT.md | 完成：不物理合并，合并规则写在 AUDIT.md 附录 C |

## 阶段 1 记录（2026-09-17）

### 1.1 版本复核与最终安装

规格 §4 要求「阶段 1 按第 3 节再复核」。复核后用户决定（AUDIT.md §5.0 的 5.14）：**新装或升级的包取「满 30 天的最新补丁」**（§3.3）；已经装着在用的包即使不满 30 天也不降级。跳过的较新补丁都看过 release notes，只有表中注明的例外。

| 包 | 决定记录（§5.0） | 实装 | 发布日期（距 09-17 天数） | 说明 |
|---|---|---|---|---|
| react-router | 7.18.3，改为直接依赖 | 7.18.3 | 2026-08-28（20） | 已装在用，保持；删除 `react-router-dom` |
| vue-router | 5.3.1 | **5.2.0** | 2026-07-15（64） | 5.3.0 / 5.3.1 不满 30 天。5.2.0 带一个已知回归：#2537（2025-08 合入）在 `history/html5.ts` 加的 `visibilitychange` 监听，会在 Edge 下让 `createWebHistory` 开发期抢窗口焦点，5.3.0（#2704）修复。只影响 html5 history，本项目 Vue 侧只用 `createMemoryHistory`，之前装的 4.6.4 也有同一问题 |
| react-error-boundary | ^6 | 6.1.3 | 2026-08-15（33） | 6.1.4 / 6.1.5 只有 12–18 天，修的是边界情况和类型 |
| vitest | ^4.1（4.1.11） | 4.1.11 | 2026-08-18（30） | |
| jsdom | ^30 | **29.1.1** | 2026-04-30（140） | jsdom 30.x 全部声明 `engines.node: ^22.22.2 \|\| ^24.15.0 \|\| >=26`，本机 Node 22.22.1；29.x 是 `^22.13.0`。v29 首发 2026-03-15，已满 6 个月 |
| @testing-library/react | ^16.3（16.3.3） | 16.3.2 | 2026-01-19（241） | 16.3.3 修的 #1231（嵌套 act 警告）是长期问题，不是回归 |
| @testing-library/dom | ^10 | 10.4.1 | 2025-07-27 | 10.4.2 只有 4 天（只改了 @types/node 的锁定） |
| @testing-library/user-event | ^14.6（14.6.7） | 14.6.5 | 2026-08-18（30） | 14.6.6 修的 #1291 是 2025-06 就有的问题 |
| @testing-library/jest-dom | ^6.10（6.10.0） | **6.9.1** | 2025-10-01（351） | **6.10.0 已被维护者在 npm 上标为 deprecated**：「Incorrect minor release with breaking changes (Node >=22 and required @testing-library/dom peer). Use 6.9.1 for the 6.x line, or upgrade to 7.0.0.」7.x 首发 2026-07-20，不满 6 个月 |
| @testing-library/vue | ^8.1 | 8.1.0 | 2024-05-18 | 自带一份内嵌的 `@testing-library/dom@9.3.4`，和 React 侧的 10.4.1 不是同一份 |
| @vue/test-utils | （5.14 新批准） | 2.4.11 | 2026-06-04（105） | 作为直接依赖，@testing-library/vue 去重复用这份；否则会解析到 2026-09-16 发布的 2.5.1 |

已装在用、不满 30 天、保持不动（括号内是满 30 天的日期）：vue-tsc 3.3.11（09-20）、@types/react-dom 19.2.5（09-22）、typescript-eslint 8.68.0（09-23）、@tanstack/*-query 5.102.8（09-26）、vue 3.5.42（09-26）、react-router 7.18.3（09-27）。不为升级而升级。

传递依赖没有逐个套 30 天规则（只把 @vue/test-utils 提为直接依赖）。其它记录：`@vue/devtools-api` 现在有三份（vue-query 6.6.4、pinia 7.7.10、vue-router 8.2.1，各自依赖，不冲突）；安装时 npm 对 `glob@10.5.0`（js-beautify ← @vue/test-utils，仅开发依赖）给出 deprecated 提示；`npm audit` 0 个漏洞。

### 1.2 新增依赖用途（规格规则 7）

| 包 | 类型 | 用途 |
|---|---|---|
| react-error-boundary | dependencies | 20 题「手写 class 主线 + react-error-boundary 并排」的可运行示例（D2-3） |
| vitest、jsdom | devDependencies | 测试运行器（复用 Vite 配置）与 DOM 环境 |
| @testing-library/react、@testing-library/dom、@testing-library/user-event、@testing-library/jest-dom | devDependencies | React 组件测试、模拟用户交互、DOM 断言 |
| @testing-library/vue、@vue/test-utils | devDependencies | Vue 对照测试；34 题 Vue 侧主线用 @vue/test-utils |

### 1.3 工具链改动清单

- `package.json` scripts：`lint` = `eslint . --max-warnings=0`（警告也算失败）；新增 `test` = `vitest run`；`check` = `npm run lint && npm run typecheck && npm run test && vite build`（typecheck 只跑一次）。`dev` / `build` / `preview` / `typecheck` 不变。
- `vitest.config.ts`（新增）：`mergeConfig(vite.config.ts, …)` 复用插件和 `@` 别名；`resolve.conditions = [...defaultClientConditions]`（原因见 1.6 第 2 条）；`test.environment = 'jsdom'`、`globals: true`、`setupFiles: ['./src/test/setup.ts']`。
- `tsconfig.json`：`types` 加 `vitest/globals`；`include` 加 `vitest.config.ts`。
- `src/test/`（新增，项目基础设施）：`setup.ts`（`import '@testing-library/jest-dom/vitest'`）；`smoke.react.test.tsx`（3 条：RTL + user-event + jest-dom；`createMemoryRouter` + `react-router/dom` 的 `RouterProvider` + `useParams`；react-error-boundary 的 fallback）；`smoke.vue.test.ts`（3 条：@testing-library/vue + user-event；@vue/test-utils 的 `mount` + `trigger`；vue-router 5 的 memory history 带参导航）；`fixtures/SmokeCounter.vue`。34 题落地后并入或删除。各题的测试按决定和示例放同目录（`react/Example.test.tsx`、`vue/Example.test.ts`）。
- `eslint.config.js`：react-hooks 块换成 `reactHooks.configs.flat.recommended`；作用范围 `**/*.tsx` + `src/topics/*/react/**/*.ts` + `src/shell/**/*.ts` + `src/bridge/**/*.ts`。已用 `--print-config` 核对：react 目录 `.ts` 有 16 条 react-hooks 规则，vue 目录 `.ts` 为 0。
- `eslint-suppressions.json`（新增）：切换预设时的 16 条既有命中（清单见 1.4）。
- 导入：`react-router-dom` → `react-router` 共 4 处：`src/main.tsx:9`、`src/shell/App.tsx:5`、`src/shell/TopicPage.tsx:7`、`src/topics/18-routing/react/Example.tsx:55`。壳的 3 处只改 import 行，属规格规则 10「依赖调整必须修改」；18 题讲解内容不动，留给阶段 2 样板。
- README：只改被阶段 1 弄过时的事实行（命令块、技术栈表的路由和测试行、目录树加 `src/test/`、「待完善」里测试那条、验证命令表）。叙述性章节（L12 段落、附录「路由为什么用 React Router v7」里「与 v6 完全相同」、完成状态列表）留阶段 4。

### 1.4 lint 命中台账（M-1 实跑结论）

切换到 recommended 后实跑：16 个 error、0 个 warning（和切换前的内存预演逐条一致）。全部记在 `eslint-suppressions.json`。

| 位置 | 规则 | 由谁处理 |
|---|---|---|
| `src/bridge/VueMount.tsx:36`（渲染期写 `createPluginsRef.current`） | refs | 阶段 2 开头单独 commit「壳 lint 修复」 |
| `src/shell/TopicPage.tsx:58`（effect 里按 slug 重置两个 state） | set-state-in-effect | 同上 |
| `src/shell/TopicPage.tsx:105`（`useMemo` 里 `lazy()` 出来的组件） | static-components | 同上 |
| 10 `react/Example.tsx:291` | set-state-in-effect | 阶段 2 改 10 题 |
| 11 `react/Example.tsx:61` | set-state-in-effect | 阶段 2 改 11 题 |
| 12 `react/Example.tsx:86`（×2）、`:93` | refs | 阶段 2 改 12 题 |
| 14 `react/Example.tsx:114` | set-state-in-effect | 阶段 2 改 14 题 |
| 21 `react/Example.tsx:136` | immutability | 阶段 2 改 21 题 |
| 23 `react/Example.tsx:192`、`:280` | immutability | 阶段 2 改 23 题 |
| 24 `react/Example.tsx:282` | set-state-in-effect | 阶段 2 改 24 题 |
| 27 `react/Example.tsx:200`、`:263`、`:343` | set-state-in-effect | 阶段 2 改 27 题 |

- 与两轮审计的预判对照：12（refs）、14（set-state-in-effect）、21 / 23 / 24 / 27、10 / 11 都命中；22、26、17 无命中（P-22-1 已关闭）；壳的 3 条是新发现，审计没预判到。
- M-6（官方 useEffect 页 Fetching data 示例与 `set-state-in-effect` 的关系）留到阶段 2 改 10 / 11 / 27 时判断。
- **台账流程**：修掉一处后跑 `npx eslint . --prune-suppressions`，和改动一起提交。不 prune 的话 `npm run lint` 会报「There are suppressions left that do not occur anymore」并失败（ESLint 9.39.5 `lib/cli.js`，未加 `--pass-on-unpruned-suppressions` 时返回 2）。批量抑制只作用于 error、按「文件 × 规则 × 条数」计数，所以同一文件新增同类问题照样会报出来。编辑器里这些行仍会显示红线（抑制只在 CLI 生效）。

### 1.5 验证结果（2026-09-17）

- `npm run check` 全部通过：lint 0 error / 0 warning（16 条已抑制）；typecheck 0 error（含测试文件和 vitest.config.ts）；test 2 个文件 6 条用例通过，verbose 输出里没有 stderr / act 警告 / 未处理错误；build 通过（约 5.5 秒）。
- `npm ls`：没有 react-router-dom；react / react-dom / vue / vite 各一份（vitest 与 vue-router 5 的 vite 都去重到 7.3.6）；@vue/test-utils 去重到 2.4.11；`@tanstack/query-core` 仍共用 5.102.8。
- 可复现性：把 package.json + package-lock.json 复制到 scratch 目录跑 `npm ci`（全局 npm 10.5.2），全新安装成功；仓库里再跑普通 `npm install` 显示 up to date。
- 浏览器：5173 上已有的 dev 服务器过期（见 1.6 第 6 条），另起临时 dev 服务器 5174 验证，验证完已停掉，`.claude/launch.json` 已还原。
  - 首页正常；侧栏 NavLink 客户端导航（无整页刷新），激活项带 `active` 类和 `aria-current="page"`。
  - 18 题 React 侧：「待支付」筛选后 query 为 `status=pending`、剩 2 行；点「设置」被 RequireAuth 拦到登录页（回跳 `/settings`），模拟登录后回到嵌套子路由「个人资料」；订单详情 `SO-2026-0001` 正常显示。
  - 18 题 Vue 侧（vue-router 5.2.0）：同样的筛选、`beforeEach` 拦截 → 登录 → 回跳 `/settings/profile`、订单详情，全部正常；控制台有一条弃用警告（1.6 第 3 条）。
  - 16 题（zustand / pinia）、30 题（TanStack Query 两侧各 15 行数据）正常渲染；控制台没有 error。

### 1.6 执行中的新发现

1. **npm 安装 vitest 时 arborist 崩溃。** `npm install -D vitest@4.1.11 …` 报 `Cannot read properties of null (reading 'edgesOut')`，全局 npm 10.5.2 和 Node 自带的 npm 10.9.4 都能复现。原因：计算 vitest 的可选 peer 集时沿 `@vitest/mocker` → `vite`（可选 peer，解析到最新的 8.3.0）→ `@vitejs/devtools*` → `vitest@*`（5.0.1）一路递归，在 `#loadPeerSet` 里崩溃。处理：测试依赖用 `--legacy-peer-deps` 装一次。但该模式把 eslint-plugin-vue 的必需 peer `vue-eslint-parser@10.4.1` 删掉了，随后一次正常 `npm install`（装 jest-dom 6.9.1）又把它补回，仍是 10.4.1。之后普通 `npm install` 和 `npm ci` 都正常。以后在本仓库新增依赖，若再次触发同样的崩溃，照此处理，并确认 `vue-eslint-parser` 还在。
2. **Vitest 里 react-router 会加载出两份实例。** 不配 `resolve.conditions` 时，测试里的 `react-router` 解析到 CJS 的 `dist/development/index.js`；而 `react-router/dom` 的 CJS 入口内部 `require('react-router')` 被 Node 22 按 `module-sync` 条件解析成 ESM 的 `index.mjs`（`node -e "require.resolve('react-router')"` 实测）。结果是两份 Context，用 `react-router/dom` 的 `RouterProvider` 渲染时 `useParams()` 读到 `{}`。已在 `vitest.config.ts` 设 `resolve.conditions = [...defaultClientConditions]`：两个入口都解析到 `.mjs`，vue / react / @vue/test-utils 的解析结果不变（已逐个追踪）。冒烟测试第 2 条守着这个修复。浏览器端（Vite 预构建）不受影响。影响：18 题的测试、34 题「测路由」的写法都依赖这项配置，34 题讲 Vitest 配置时要提一句。
3. **vue-router 5.2.0 对 `next()` 发出弃用警告。** dev 控制台：`[VUE_ROUTER_R0025] The next() callback in navigation guards is deprecated.`，并给出 fix「Return the value instead」。源码：`node_modules/vue-router/dist/useApi-CROJJdhE.js:223-224`（诊断定义）、`devtools-Bpr7ZAVB.js:596`（调用点）。**需更正审计**：AUDIT.md 附录 A-D「next 仍被支持」与 §5.4「18 题 Vue 侧代码不用改」不再完整。18 题 Vue 守卫在阶段 2 改为返回值写法（规格 §6 第 12 条本来就要改）；课件讲 `next()` 时标【旧写法】，写明 v5 起 dev 会警告（从哪个 5.x 版本开始待核实）。
4. **@testing-library/jest-dom 6.10.0 已被维护者弃用**，改装 6.9.1（见 1.1）。AUDIT.md §2.1 / §2.2 / §5.2 里的「6.10.0」作废。
5. **新待决 D1-1：ESLint 9 已 EOL。** eslint.org/version-support 原文：「ESLint v9.x reached end-of-life on 2026-08-06 and is no longer maintained」；`npm view eslint@9.39.5 deprecated` 为「This version is no longer supported.」。审计 §2.2「保持 9.x」没发现这一点。v10：首发 2026-02-06（已满 6 个月）；typescript-eslint 8.x、eslint-plugin-vue 10、eslint-plugin-react-hooks 7.1.1 的 peer 都已包含 ^10；周下载份额 16.6%（2026-09-16 数据），未达 30%。阶段 1 没有擅自升级，需要用户决定：A 阶段 2 开始前单独一个 commit 升到 ESLint 10；B 保持 9，到阶段 4 再评估。
6. **用户自己的 dev 服务器已过期。** 2026-09-16 20:19 从 `cmd /k "cd /d D:\code\AI\learning\react && npm run dev"` 启动（PID 6464，端口 5173）。依赖变更后它的预构建缓存过期，请求 `react-router` 预构建产物返回 504（Outdated Optimize Dep）。没有动它，需要用户重启。
7. 本机 PATH 上的 npm 是全局安装的 10.5.2（`C:\Users\lenovo\AppData\Roaming\npm`），盖过了 Node 自带的 10.9.4。仅记录。

## 每题状态（阶段 2 起填写）

| 题号 | 主题 | 状态 | 改动摘要 | 遗留问题 |
|---|---|---|---|---|
| 01–30 | — | 未开始 | — | 10 / 11 / 12 / 14 / 21 / 23 / 24 / 27 有 lint 抑制待清（1.4）；18 的 Vue 守卫有 R0025 弃用警告（1.6 第 3 条） |

## 遗留 / 待核实

- 已决定：AUDIT.md §5.0（5.1–5.12 + 5.13 第二轮 + 5.14 阶段 1 复核）。
- **待决 D1-1**：ESLint 9 已 EOL，是否在阶段 2 前升级到 10（见 1.6 第 5 条）。
- 第二轮审计已完成（2026-09-17）：`docs/upgrade/AUDIT-ROUND2.md`（§1 逐题目标大纲 vs 现状、§2 缺失汇总、§3 主线判定、§4 与第一轮差异、§5 每题十段重写大纲、§6 待决 D2-1～8、附录待核实）。统计：35 题 371 条（严重 54 / 概念 228 / 生产 32 / 小问题 57）；待核实 182 条 + 主会话 M-1～M-10。
- 合并规则（已按 §6 答复执行，写在 AUDIT.md 附录 C）：阶段 2 每题以 AUDIT-ROUND2.md §5 的十段大纲为蓝本；逐题问题表 = 本轮 §2 缺失清单 + 第一轮 §3 讲错清单，其中 AUDIT-ROUND2.md §4 第 4 条列出的约 20 条「第一轮有依据、本轮标已讲对」的条目以第一轮为准；§4 第 5 条的可关闭项（P-25-1、P-22-1）关闭；§3 主线判定与 §6 决定覆盖第一轮 §4.2 里与之冲突的处置建议（18 主线、14 uSES 主线、26 latest ref 标签、Vue 3.5 特性标【主流】）。
- 待核实：AUDIT-ROUND2.md 附录（各题 P-NN-k 共 182 条 + M-1～M-10）。阶段 1 已了结：M-1（recommended 实跑清单，见 1.4）、M-4（@testing-library/vue 8.1.0 与 vue 3.5.42 / vitest 4.1.11 实测可用）、M-5（react-error-boundary 已安装）、M-10（采用情况复核：本次复核发布日期、engines 与 deprecated 状态，未重抓周下载）。仍待核实：M-2（`FormEvent` 已 `@deprecated`）、M-3（`onErrorCaptured` 异步范围）、M-6、M-7、M-8。
- 阶段 1 新增待核实：vue-router 从哪个 5.x 版本开始对 `next()` 发 R0025 警告。
- 阶段 1 遗留：README 叙述性章节留阶段 4；@testing-library/vue 内嵌 DTL 9，Vue 测试里的 `screen` 来自 DTL 9（34 题讲 Vue 测试时注明）；冒烟测试在 34 题落地后并入或删除；已装的 6 个不满 30 天的包满 30 天后也不主动升级，除非有需要。
- 第二轮工作方式记录：大纲阶段 5 批（按文档域分组、禁读课件）→ 对照阶段 10 批（按代码体量 ≤ 125 KB 分组）→ 主线回填 1 批 → 与第一轮对比 3 批；全部 2 并发，共 19 个只读子代理，约 4.5 小时；产物先写 scratchpad 的 parts 再由脚本合并并做机械校验（`file:line` 存在、原文片段命中、`grep0` 复跑为 0、枚举 / 编号合法、无残留标记）；脚本与 parts 不入库。
- 待核实 / 需运行验证：AUDIT.md 附录 B（16 条逐题遗留 + 9 条需运行验证）。
- 审计统计：30 题共 176 条（严重 9 / 概念 71 / 生产 14 / 小问题 82）；结构建议：18 题重写，21 题修改，8 题保留小修，新增 5 题（31–35）+ 可选 2 题。
- 工作方式记录：6 个只读子代理分批（每批 4–6 题，2 并发），每批约 25–40 分钟；版本调查脚本与事实卡在会话 scratchpad（不入库），结论已全部写进 AUDIT.md。
