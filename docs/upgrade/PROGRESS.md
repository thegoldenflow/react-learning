# 课件升级进度（docs/upgrade/PROGRESS.md）

> 规格：仓库根目录 `course-upgrade-prompt.md`（基准日 2026-09-16）。
> 新会话先读本文件，再接着做。上下文快满或会话要结束时，先更新本文件。

## 阶段状态

| 阶段 | 内容 | 状态 | 交付物 | 备注 |
|---|---|---|---|---|
| 0 | 审计（只读） | **完成。** 两轮审计均完成；用户 2026-09-17 答复「全部按建议执行」（AUDIT-ROUND2.md §6 D2-1～8，记录在 AUDIT.md §5.13）；两轮合并规则写在 AUDIT.md 附录 C | `docs/upgrade/AUDIT.md`（含 §5.13、§5.14、附录 C）、`docs/upgrade/REAUDIT-PROMPT.md`、`docs/upgrade/AUDIT-ROUND2.md` | 两轮审计与合并说明均已提交（d550e27、1efc217） |
| 1 | 依赖与工具链调整 | **完成（2026-09-17）**：commit「阶段 1：依赖与工具链调整」（34cd734）+「阶段 1 补充：ESLint 9 → 10（D1-1）」 | package.json / package-lock.json、vitest.config.ts、eslint.config.js + eslint-suppressions.json、tsconfig.json、src/test/、4 处 react-router 导入、README 事实行 | 复核口径与全部记录见下文「阶段 1 记录」；版本决定见 AUDIT.md §5.0 的 5.14、5.15 |
| 2 | 逐主题修改（先改 18 路由样板） | **进行中**（分支 `phase-2-topics`）：前置 commit（壳修复，2.0）、**18 路由样板**（2.1，风格已确认，AUDIT.md §5.0 的 5.16）、**2-A Vue 响应式措辞批量修正**（2.2，措辞见「统一措辞」）、**2-B 的 07 表单**（2.3）、**19 异步提交**（2.4）、**11 API 请求状态**（2.5）、**30 TanStack Query**（2.6）、**14 自定义 Hook**（2.7）、**16 全局状态**（2.8）已完成。**下一步：2-B 的 20 错误边界**（其后 26，再做 2-C），做法见 `docs/upgrade/CONTINUE-PROMPT.md` | 每题一个 commit | 样板已确认，其余题不再逐题停 |
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
| `src/bridge/VueMount.tsx:36`（渲染期写 `createPluginsRef.current`） | refs | **已修复**（阶段 2 前置 commit，见 2.0） |
| `src/shell/TopicPage.tsx:58`（effect 里按 slug 重置两个 state） | set-state-in-effect | **已修复**（同上） |
| `src/shell/TopicPage.tsx:105`（`useMemo` 里 `lazy()` 出来的组件） | static-components | **已修复**（同上） |
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
5. **D1-1：ESLint 9 已 EOL（已决定 A 并执行，见 1.7）。** eslint.org/version-support 原文：「ESLint v9.x reached end-of-life on 2026-08-06 and is no longer maintained」；`npm view eslint@9.39.5 deprecated` 为「This version is no longer supported.」。审计 §2.2「保持 9.x」没发现这一点。v10：首发 2026-02-06（已满 6 个月）；typescript-eslint 8.x、eslint-plugin-vue 10、eslint-plugin-react-hooks 7.1.1 的 peer 都已包含 ^10；周下载份额 16.6%（2026-09-16 数据），未达 30%。阶段 1 没有擅自升级，需要用户决定：A 阶段 2 开始前单独一个 commit 升到 ESLint 10；B 保持 9，到阶段 4 再评估。
6. **用户自己的 dev 服务器已过期。** 2026-09-16 20:19 从 `cmd /k "cd /d D:\code\AI\learning\react && npm run dev"` 启动（PID 6464，端口 5173）。依赖变更后它的预构建缓存过期，请求 `react-router` 预构建产物返回 504（Outdated Optimize Dep）。没有动它，需要用户重启。
7. 本机 PATH 上的 npm 是全局安装的 10.5.2（`C:\Users\lenovo\AppData\Roaming\npm`），盖过了 Node 自带的 10.9.4。仅记录。

### 1.7 D1-1：ESLint 9 → 10（2026-09-17，用户选 A，单独 commit）

- **版本**：eslint **10.8.1**（2026-08-07，满 30 天的最新 10.x；之后的 10.9.0 / 10.9.1 / 10.10.0 修的都是具体规则的误报和 autofix 问题，不是 10.8.1 引入的回归）；`@eslint/js` **10.0.1**（2026-02-06，10.x 目前唯一的正式版，不再和 eslint 同步发版，peer `eslint ^10.0.0`）。eslint 10 的 engines 是 `^20.19.0 || ^22.13.0 || >=24`，本机 22.22.1 满足。typescript-eslint 8.68.0、eslint-plugin-vue 10.10.0、vue-eslint-parser 10.4.1、eslint-plugin-react-hooks 7.1.1 的 peer 都包含 ^10，`npm ls` 没有 invalid / unmet。这次安装没有触发 arborist 崩溃；lockfile 只变了 ESLint 自身的依赖，并移除了旧 eslintrc 那一套（@eslint/eslintrc 等 15 个包）。
- **v10 破坏性变更逐条核对**（官方 eslint.org/docs/latest/use/migrate-to-10.0.0）：
  - Node 版本：满足。
  - `eslint:recommended` 新增 `no-unassigned-vars` / `no-useless-assignment` / `preserve-caught-error`：实跑 0 命中。
  - 配置文件改为从被检查文件所在目录向上查找：只有根目录一份配置，不受影响。
  - 旧 eslintrc 格式彻底移除：本项目早已是 flat config。
  - JSX 引用纳入作用域分析：0 新增报告。
  - `eslint-env` 注释改报错：仓库里没有。
  - 插件侧 API 移除（context / SourceCode 旧方法）：四个插件都已声明支持 ^10，实跑正常。
- **配置改动**：`tseslint.config()` 在已安装的 typescript-eslint 里已标 `@deprecated`（`node_modules/typescript-eslint/dist/config-helper.d.ts:67`：「ESLint core now provides this functionality via `defineConfig()`, which we now recommend instead」），所以改为 `defineConfig()` + `globalIgnores(['dist'])`（`node_modules` 默认就被忽略），各预设数组直接传入不再展开。规则内容和作用范围不变。
- **结果**：`npm run lint` 0 error / 0 warning；16 条批量抑制原样生效（没有新增，也没有失效）；另外 3 条是题目里原有的 `eslint-disable-next-line react-hooks/exhaustive-deps`（10:127、26:264、26:430，教学反例）。用 stdin 探针确认各类规则确实在跑：react-hooks/rules-of-hooks、@typescript-eslint/no-explicit-any、新的 preserve-caught-error、vue/require-v-for-key 都能报出。`npm run check` 全部通过（test 6/6、build 约 5.6 秒）。

## 阶段 2 记录

### 2.0 前置：站点壳修复（2026-09-17，分支 `phase-2-topics`，单独 commit）

属于规格规则 10 的「站点壳改动」：只改基础设施，不动任何课件。

- `src/bridge/VueMount.tsx`（refs）：原先在渲染期执行 `createPluginsRef.current = createPlugins`（latest ref），改为 `useEffectEvent`（React 19.2）包一层 `loadPlugins`，在 effect 里的异步 IIFE 中调用。effect 依赖仍只有 `component`，内联传入的插件工厂照样不会引起重挂载。
- `src/shell/TopicPage.tsx`（set-state-in-effect）：原先 `useEffect` 在 slug 变化时把两个「查看源码」开关重置为 false。改为外层 `TopicPage` 只读 `slug`，渲染 `<TopicPageContent key={slug} slug={slug} />`，切题时整页重新挂载，state 自然回到初始值（React 文档「用 key 重置全部 state」）。
- `src/shell/TopicPage.tsx`（static-components）：原先在 `useMemo` 里 `lazy(loader)`。第一次改成模块级 Map 缓存 + 渲染中调用 `getReactExample(slug)` 取组件，**仍被规则命中**：规则实现（`eslint-plugin-react-hooks` 的 `validateStaticComponents`）只要 JSX 标签的值来自渲染期的 `CallExpression` / `MethodCall` / `FunctionExpression` / `NewExpression` 就报，不区分有没有缓存。最终改为在模块顶层遍历 `ALL_TOPICS`，一次性创建 `reactExamples[slug] = lazy(...)`、`vueExamples[slug] = defineAsyncComponent(...)`，渲染时只做属性读取（`lazy` 只登记加载器，渲染到该题才下载代码块）。
- **顺带修复一个早就存在的控制台错误**（验证时发现，不是 lint 命中）：离开 18 题时控制台报 `Attempted to synchronously unmount a root while React was already rendering`。原因是 `src/bridge/ReactIsolatedMount.tsx` 在 effect cleanup 里同步调用 `root.unmount()`，而这个 cleanup 由外层 React 在提交阶段执行；react-dom 的 `unmount()` 一旦发现外层处于 render / commit 上下文就告警（`react-dom/cjs/react-dom-client.development.js:27906-27908`）。已用旧代码复现，确认不是这次改动引入的。修法：把 `unmount()` 放进 `queueMicrotask`，等外层这一轮提交结束再卸载。
- 台账：`npx eslint . --prune-suppressions` 后，`eslint-suppressions.json` 只剩 8 道题的 13 条。
- 验证：`npm run check` 通过（lint 0 / typecheck 0 / test 6/6 / build）。浏览器用临时 5174 dev 服务器，验证完已停掉并还原 launch.json：
  - 03 题打开两侧「查看源码」后切到 16 题，查看器数量从 2 回到 0；切回 03 正常渲染，没有卡在 Suspense fallback。
  - 每个 Vue 宿主只有 1 个根节点（StrictMode 双挂载没有留下重复实例）。
  - 18 题 Vue 侧的 vue-router 插件照常装上（点「设置」被 `beforeEach` 拦到登录页）；30 题两侧各 15 行数据。
  - 18 → 16 → 18 → 17 以及 18 → 19 → 18 快速切换，控制台 0 条 error。

### 2.1 18 路由样板（2026-09-17，分支 `phase-2-topics`）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 18 题十段大纲（主线判定 §3.1），规格 §6 的 13 条修改点（其中 5 条按 D2-7 随 Data 主线调整），逐题问题表按附录 C 取两轮（R2-18-1～12 + AUDIT.md §3 的 18 题各行，含「以第一轮为准」的 18:517）。

**结构（React 侧 8 个文件，Vue 侧 12 个文件）**
- `react/Example.tsx`：十段文件头 + 「主线：Data 模式 / 并排：声明式模式」切换。主线 router 在模块顶层创建（官方「Data Routers should not be held in React state」）。
- `react/dataRouter.tsx`【主线】：createMemoryRouter 配置数组，包含 loader / action / errorElement / handle / HydrateFallback / 路由级 lazy；守卫两种写法并排，「设置」用分组 loader 【主流】，「报表」用分组 middleware【较新·7.9 起】；根路由有一个日志 middleware，演示父 → 子执行顺序和「每次导航都执行」；`declare module 'react-router' { interface Future { v8_middleware: true } }` 只打开类型。
- `react/dataPages.tsx`【主线页面】：useLoaderData、useNavigation 加载提示、useMatches 面包屑（读 loaderData）、`<Form>` + useActionData 登录、useOutletContext、useBlocker + useBeforeUnload、NavLink 默认 active、setSearchParams 函数式合并并重置 page、`location.key === 'default'` 返回兜底、NoteDraft 演示同位置复用（勾选框切换 `key={order.id}`）、404 errorElement、按钮权限的正确安全表述。
- `react/ReportsPage.tsx`：由 lazy 按需加载，loader 用 `context.get(userContext)` 读 middleware 写入的用户。
- `react/DeclarativeDemo.tsx`【并排】：MemoryRouter + Routes + RequireAuth 三态（checking / authed / guest）、「模拟刷新」、退出登录后立即弹回；讲清 `<Routes>` 子元素限制和 v5 PrivateRoute【旧写法】。
- `react/demoAuth.ts`（异步模拟会话 + 安全边界说明）、`react/demoLog.ts`（导航日志面板）。
- Vue 侧：`router.ts` 改成返回值写法的 async beforeEach，给 `RouteMeta` 加类型，settings 系列路由懒加载；`auth.ts` 改为三态 + 异步；`OrdersPage.vue` / `OrderDetailPage.vue` 改为组件内 watch 取数 + `onWatcherCleanup` 取消，并合并 query、给返回按钮加兜底、演示实例复用（新增 `NoteDraft.vue`）；`LoginPage.vue` 用 safeRedirect；`SettingsNotificationsPage.vue` 用 onBeforeRouteLeave + beforeunload；新增 `navigationHistory.ts`（返回兜底的依据）；删除 `ordersData.ts`（改用共享 mockApi）；`Example.vue` 文件头精简（见待确认项 1）。
- 共享：`src/shared/safeRedirect.ts`（+ 5 条测试）、`mockApi.ts` 新增 `fetchOrder`、`styles.css` 新增 `.nav-links a.active` 与源码查看器样式。
- 壳（AUDIT §5.0 的 5.10）：`topicRegistry.ts` 的源码 glob 扩到每题 `react/**/*.{ts,tsx}`、`vue/**/*.{ts,vue}`（含测试），`TopicPage.tsx` 的源码查看器改为可切换文件（入口 Example 排第一）；18 题 summary 同步；README 里 18 题相关的几处事实行、源码查看器说明同步更新。

**规格 §6 十三条的落实**：#1 导入统一为 react-router + react-router/dom，createMemoryRouter 作主线，并讲清 v6 → v7 → v8 的演变；#2「最重要的区别」改成「渲染前拦截 vs 渲染中拦截」；#3 loader throw redirect【主流】作主线守卫，讲清父子并行，并补上本次发现的「最深一层 redirect 优先」，middleware【较新】并排，useBlocker 已实现；#4 Data 主线在 loader / middleware 里 await，声明式并排用 RequireAuth 三态，并修正了「loader 不会闪」的说法；#5 实例复用的结论改正，给出 key 与依赖数组两种解法，并有测试；#6 NavLink 默认 active + aria-current；#7 安全表述改正；#8 返回兜底；#9 setSearchParams 函数式合并、重置 page、push / replace 的取舍；#10 safeRedirect 已实现（在 action 与 loader 里使用）；#11 清理残留（全题 0 处「没有一一对应关系」），版本说明改为「主线 v7，写法兼容 v8；v6 已 EOL」；#12 Vue 守卫改成返回值写法，数据加载器标【尝鲜】；#13 ViewTransition 只作一句【尝鲜】介绍。

**第一轮条目的处理**：18:517（ReactNode 返回类型从 @types/react 18.2.8 + TS 5.1 起，与 React 19 无关）已改正；:510 / :537 的交叉引用已处理（原文已重写，不再引用 17 题）；:526 守卫持续性改成「模式差异」；:527 meta ↔ handle / 分组路由；:528 相对路径改为「相对路由 vs 相对路径」；:534 页面计数的表述已删除；:536 RouteMeta 类型已扩展。

**待核实项的结论**：P-18-1 recommended 预设下 18 题 0 命中；P-18-2 参数变化 state 保留，React、Vue 两侧都有测试；P-18-3 用一次性测试确认 RouterProvider 嵌进另一个 Router 会抛「inside another」，所以仍需 ReactIsolatedMount；P-18-4 middleware 父 → 子顺序、未登录时下游 loader 不执行、没有 loader 也执行，均有测试；P-18-5 函数式 lazy 从 6.9.0（2023-03-10）起，对象式 lazy 从 7.5.0 起（官方 CHANGELOG）；P-18-6 浏览器实测：Vue 的「订单」RouterLink 在详情页不激活；P-18-7 Vue 侧不再写死「vue-router 4」的类型措辞；P-18-8 query 顺序已由测试按实际序列化结果断言。附录 B 的 18 题 (1)「Vue router.back() 兜底判据」：`createWebHistory` 的 `history.state.back` 来自源码 buildState（`vue-router/dist/vue-router.js:91`），不是公开 API，memory history 下不可用，已在 `navigationHistory.ts` 注明。

**本次新发现**：
1. 父级守卫 loader 与子路由 loader 同时 redirect 时，React Router 采用最深一层的 redirect（`findRedirect` 从最后一个匹配往前找），守卫要到下一次导航才生效。已写进注释、文件头和测试。
2. `useSearchParams` 函数形式不会像 setState 那样排队（官方原文已引用）。
3. vue-router 的 memory history 不记录 back，「应用内有无上一页」只能自己跟踪。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 36 条测试 / build）；18 题测试无 act 警告、无 stderr。浏览器用临时 5174 服务器验证（完成后已停掉并还原 launch.json）：两种守卫的日志、Form 登录回跳、恶意回跳被拦、实例复用与 key、query 合并、404、useBlocker、登出、声明式三态与模拟刷新、Vue 侧守卫 / 复用 / 返回 / query / onBeforeRouteLeave、源码查看器切换文件。捕获到的 console.error / console.warn 为 0（R0025 已消失）。

**样板风格与深度（2026-09-17 用户答复「按你推荐的来」，6 项全部确认，见 AUDIT.md §5.0 的 5.16；其余题照此执行）**：
1. 文件头只在 `react/Example.tsx` 写完整十段；`vue/Example.vue` 写题目信息 + Vue 侧要点，并指向 React 文件（避免两份长文头各改各的）。
2. 一题拆成多个文件（主线 / 并排 / 模拟服务 / 测试），靠源码查看器切换阅读；这样做而不是塞进一个大文件。
3. 演示深度：主线把规格与大纲点名的 Data 模式能力（loader、action、Form、useNavigation、errorElement、lazy、middleware、useBlocker、handle / useMatches）都做成可运行代码；并排版只演示与主线不同的部分（守卫）。
4. 每条关键结论都配自动化测试（React 18 条、Vue 7 条），测试文件和示例放同目录。
5. 引用未来新题时写「（32 题，待新增）」。
6. 模拟服务可注入延迟（页面上 300–400ms 方便观察，测试里 0）。

### 2.2 阶段 2-A：Vue 响应式措辞批量修正（2026-09-17）

- **范围**：先按接续 prompt 跑 `grep -rn "Proxy\|属性级\|粒度" src/topics`，再用「精准 / 精确通知 / 重跑整个 / 不重跑 / 只更新 / 那几个节点 / 最小更新范围」补搜，逐处判断。改了 15 个文件 45 处：03（react 3、vue 3）、07（react 1、vue 4）、14（react 2、vue 2）、15（react 1、vue 1）、21（react 3、vue 4）、23（react 6、vue 10）、26（vue 2）、29（vue 1）、README 2。最终措辞见下文「统一措辞」。
- **审计点名的三条**：R2-03-8（03 react :17、:312-313，vue 同句）、R2-21-8（21 react :16、vue :73）、R2-23-7（23 react :16、vue :18、:76）已改。
- **审计没列、这次补搜发现的同类错误**：07 题 4 处「Vue 输入不会重跑整个组件 / 只更新用到该值的那几个节点」（实际会重跑本组件的渲染函数，靠 patch flags 只比对动态节点）；14 题 3 处「响应式靠 Proxy 追踪，不靠调用顺序」（composable 不受调用顺序约束的原因是 setup 只执行一次、状态在返回的 ref / reactive 对象里）；23 题「Proxy 发现值没变」（`count` 是 ref，靠 setter 里的 `hasChanged`）、区块三标题「脱离了 Proxy」和控制台文案；21 题「改完立即精准更新」（DOM 在下一个 tick 更新）；29 题「被精准通知」。
- **判断为正确、没有改**：「props 是响应式 Proxy」（23 题 3 处；props 是 `shallowReactive`）；reactive 对象、从 reactive 数组取出的对象被 Proxy 拦截（21 题 react :74、vue :95，22 题两处，29 题 :66）；15 题「依赖追踪是属性级的」（说的是追踪，后半句「谁读了谁更新」是组件级）；16 / 17 题「组件级精准更新」「订阅粒度」（与统一措辞一致，17 题的「根本不会更新」留给 17 题重写）；README :264「只重跑真正依赖了变化数据的渲染副作用」。
- **README**：只改同一错误的两处（对照表 :183「Proxy 依赖追踪」、思维差异第 1 条 :262「Vue 用 Proxy 拦截读写…精准触发更新」），叙述章节其余内容仍留阶段 4。
- **按 5.16 没做**：「没有一一对应关系」残留和绝对化用词（这次改到的句子里有的也原样保留，逐题清零）；12 题 3 处「改 .value 视图立即更新」属于「时机」一行，12 题改写时处理。
- **验证**：lint 0 / typecheck 0 / 36 条测试 / build 全部通过；改动文件无 CRLF。改动只涉及注释和几处模板文案（07、21、23 Vue 侧），vue-tsc 与构建都编译了模板，没有另做浏览器验证。

### 2.3 07 表单与受控组件（2026-09-17，2-B 第一题）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 07 大纲 + §3.2 主线判定（受控、非受控两条都是主线，Actions 只作并排指向 31）；问题表 = R2-07-1～8 + AUDIT.md §3 的 07 各行（:300-:304，其中 :301「受控 / 非受控是 React 特有」按附录 C 备注保留第一轮的概念级定级）。

**结构（React 6 个文件，Vue 6 个文件）**
- `react/Example.tsx`：十段文件头 + 三个区块。
- `react/ControlledProfileForm.tsx`【主线：受控】：对象 state + name 分发；文本、type="number"（存字符串）、`<select value>`、`<textarea value>`、radio（fieldset + legend）、checkbox；手机号只收数字（被拒的输入由 React 弹回）；错误信息是派生值；提交失败聚焦第一个出错字段；只读字段 `readOnly`；`SubmitEvent<HTMLFormElement>`。
- `react/UncontrolledContactForm.tsx`【主线：非受控】：`defaultValue` / `defaultChecked`（input、select、textarea）；FormData 读字段并列出实际的键（没写 name 的字段、没勾选的 checkbox 不在里面）；ref 单点读；async 提交里演示 `e.currentTarget` 在 await 后为 null；保留原生 `required` 校验；「换默认姓名」+「换 key」实验；一段 `<form action>` 并排说明。
- `react/TextField.tsx`：`useId` + `htmlFor` / `aria-describedby` / `aria-invalid`；React 19 `ref` 作为普通 prop。
- `react/InputEventLab.tsx`：onChange 与原生 change、输入法合成事件的日志实验。
- Vue 侧：`ControlledProfileForm.vue`（v-model，type="number" 自动 `.number`，`.trim`，手机号用 `:value` + `@input` 手动改回）、`UncontrolledContactForm.vue`（静态属性初始值、`<option selected>` 与 textarea 文字、FormData、`useTemplateRef`、`:key` 重置、「`:value` 持续绑定会冲掉输入」实验）、`TextField.vue`（`defineModel()` + `useId()` + `defineExpose`）、`InputEventLab.vue`（v-model 合成期间不更新、v-model 拒绝写入不改回 DOM 的反例与正确写法）、`Example.vue` 精简头。
- 测试：React 19 条、Vue 13 条（全仓库 7 个文件 68 条）。

**问题表处理**：R2-07-1 useId（含为什么不用计数器、派生多个 id、禁作 key / cache key、identifierPrefix、19.2 前缀 `_r_`，都有测试或原文）；R2-07-2 受控 ↔ 非受控切换报错（测试断言报错文本）；R2-07-3 onChange ≈ input 事件、IME、`.lazy/.number/.trim`、`defineModel()`；R2-07-4 number 字符串、`<option selected>`、textarea children；R2-07-5 a11y 引用（→35）；R2-07-6 `<form action>`【主流·19.0】并排 + 「只重置非受控字段」测试；R2-07-7 八段旧写法（forwardRef、18 无 Actions、useFormState 改名、FormEvent、Vue 3.4 前手写 v-model、3.5 前无 useId）；R2-07-8 模板残留与「根本不 setState」清零。第一轮 :300 同 R2-07-6；:301 改为「两种模式两边都有，差别在『受控强度』、更新范围、:value 与 defaultValue 语义」；:302 残留已清；:303 react-hook-form 表述改为官方 FAQ 原文；:304「控制台警告」改为「开发环境报错」。

**待核实项结论**：
- M-2（FormEvent @deprecated）：成立。@types/react 19.2.18 `index.d.ts:2086-2091`「FormEvent doesn't actually exist」，onSubmit 类型是 `SubmitEventHandler`（:2314）。07 已改用 `SubmitEvent`；19 / 28 等题改写时照做（见「统一措辞 · 事件类型」）。
- P-07-1（IME 期间 onChange）：react-dom 19.2.8 `getTargetInstForInputOrChangeEvent`（:3587）只看值是否变化，不看合成状态，测试用 compositionstart 后的 input 事件证明会触发。真实输入法无法用浏览器工具自动输入，未做人工实测。
- P-07-2（react-hook-form 表述）：按 react-hook-form.com/faqs 原文改写（非受控 + register 拿 ref；Controller / useController 把重新渲染限制在字段内；watch 订阅会重新渲染）。
- **P-07-3（Vue 无 useId 对应物）：审计结论不成立。** Vue 3.5 起有 `useId()`（vuejs.org/api/composition-api-helpers；blog.vuejs.org/posts/vue-3-5；源码 `runtime-core.cjs.js:1704`），多应用用 `app.config.idPrefix`（`runtime-core.d.ts:1117-1119`）。AUDIT-ROUND2 的 07 Vue 对照表与 §5 大纲「useId 无对应物」作废，课件已按实测写，测试断言默认前缀 `v-` 与 idPrefix。
- P-07-4（07 在 recommended 预设下的 lint）：0 命中（阶段 1 起已用 recommended，本题新代码同样 0）。

**本次新发现（审计没写到）**：
1. v-model 与 React 受控的「强度」不同：React 在事件处理结束后把 DOM 改回 props.value（`react-dom-client.development.js:3251-3272` → `restoreStateOfTarget`），被拒的输入会弹回；Vue 的 vModelText 只在 `beforeUpdate` 写回（`runtime-dom.cjs.js:1559-1576`），写入被拒时组件不重新渲染，非法字符留在输入框。两边都有测试，Chrome 实测一致。
2. Vue 的 `:value`（不配 @input）在组件**任何一次**重新渲染时都会写回：`runtime-core.cjs.js:5897` 对 `value` 不比较新旧、每次都 patch，`runtime-dom.cjs.js:591-601` 发现和 DOM 当前值不同就覆盖。测试与 Chrome 实测：只改一个无关的计数器，用户输入也被冲掉。
3. `<form action>` 成功后受控字段保持 state 的值、非受控字段回到默认值（测试实测，与官方原文一致）；reset 由 `startHostTransition` 里的 `requestFormReset$1`（:8940-8957）请求、提交阶段 `form.reset()`（:15152）执行。
4. 被 React 弹回时光标跳到末尾（Chrome 实测）：在「1380」第 1 位后敲字母，值不变、`selectionStart` 变成 4；敲数字则停在插入处。
5. v-model 的 input 监听先于模板上的 `@input` 注册（`runtime-core.cjs.js:5737-5743`：先调指令 created，再挂 props 上的事件），所以同一元素上 `@input` 里读到的是 v-model 处理过的值。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 68 条测试 / build）；07 的 32 条测试无 act 警告、无 stderr。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json）：两侧三个区块渲染；React 手机号逐字输入「138a0」得到 1380；onChange 逐字触发、失焦才出现原生 change；非受控提交两侧都显示 FormData 键与「await 之后 currentTarget：null」；React「换默认姓名」不影响改过的输入框、换 key 后恢复；两侧提交失败聚焦姓名、aria-invalid 与 aria-describedby 正确（React id `_r_3_-error`，Vue id `v-0-2`）；Vue `:value` 被无关的重新渲染冲掉、v-model 反例留下「12a」；07 ↔ 08 / 06 来回切换；源码查看器两侧各 6 个文件。发现并修复一处布局问题：「实时 state」的长 JSON 撑出卡片 24px，加了 `word-break: break-all`。捕获到的 console.error / console.warn 为 0。

### 2.4 19 异步提交与防重复（2026-09-17）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 19 大纲 + §3.2（手写 submitting 主线、Actions 并排指向 31）；问题表 = R2-19-1～8 + AUDIT.md §3 的 19 各行（:571-:575）。§4 备注里「19 题 Actions 讲多深」三方口径不一，本次定为：**Actions 做一个可运行的并排区块（`<form action>` + `useActionState` + `useFormStatus`），useOptimistic、Server Functions、action 抛错进错误边界留给 31 题**。

**结构（React 5 个文件，Vue 3 个文件）**
- `react/Example.tsx`：十段文件头 + 两个区块。
- `react/ManualSubmitForm.tsx`【主线】：submitting 布尔 + result 判别联合；防重复三道关（disabled → state 守卫 → useRef 锁）；错误分层（`ApiFieldError` 显示在字段旁 + effect 里聚焦，网络错误 `role="alert"` + 重试）；成功清空 / 失败保留；`finally` 恢复；「同一轮事件里提交两次」「去掉 useRef 锁」两个开关。
- `react/ActionSubmitForm.tsx`【并排·19.0 起】：`useActionState` 的 `isPending`、排队串行、`useFormStatus` 子组件按钮、`defaultValue` 回填，以及「备注」故意不回填演示「返回错误也会重置非受控字段」。
- `react/requestLog.tsx`：外部 store + `useSyncExternalStore` 的请求日志（action 里 setState 会等 action 结束才显示，所以日志不能用 state）。
- Vue 侧：`ManualSubmitForm.vue`（逐行对应；守卫用 ref 同步性，不需要锁；`nextTick` 后聚焦）、`Example.vue`（精简头 + 「Actions 在 Vue 里怎么写」说明卡片）、`Example.test.ts`。
- 共享：`src/shared/mockApi.ts` 新增 `ApiFieldError`（字段级校验错误），`submitOrder` 的两处校验失败改抛它；`amount` 的判断从 `<= 0` 改成 `!(amount > 0)`（NaN 也算非法）。`submitOrder` 只有 19 题在用，改动向后兼容（仍是 `Error` 子类、message 不变）。
- 测试：React 10 条、Vue 7 条（全仓库 9 个文件 85 条）。

**问题表处理**：R2-19-1 渲染快照 + useRef 锁（页面实验 + 测试 + Chrome 实测）；R2-19-2 提交回写改为讲清「React 18 起卸载后 setState 是空操作，写操作不要为了清理去 abort」并给测试，读操作的取消指向 27；R2-19-3 错误分层 + 「错误边界接不住事件处理函数」；R2-19-4 Actions 全套标签与约束（isPending、排队串行、useFormStatus 子组件、18 无 Actions）；R2-19-5 指向 30 的 `useMutation.isPending` 与 18 的 `useFetcher` / `useNavigation`；R2-19-6 幂等 + a11y（role="alert" / role="status" / aria-describedby）；R2-19-7 Vue 的 `onErrorCaptured` 捕获面 + `await router.push()`；R2-19-8 标题改为「异步提交与防重复」，交叉引用补 07 / 12 / 18 / 20 / 27 / 29 / 30 / 31。第一轮 :571「新趋势」措辞、:572 排队语义、:573 三条对照、:575「工业界标准写法」都已处理。

**待核实项结论**：
- P-19-1（真实连点是否需要 ref 锁）：**已核实**。离散事件里的 setState 在事件结束后的微任务里就完成渲染（`react-dom-client.development.js:18825-18856` `processRootScheduleInMicrotask` + `:18979-18991` `scheduleImmediateRootScheduleTask`）。Chrome 实测：`btn.click()` 之后同一任务里按钮 `disabled` 仍是 false，一个微任务之后就变成 true；用两次独立任务的点击只发出一个请求。所以 state 守卫 + disabled 足以挡住真实连点，**useRef 锁防的是同一轮里被调用两次**（页面实验：去掉锁发两个请求 SO-…0103 / 0104，加锁只发一个）。大纲「re-render 之前的连续点击都读到 false」这句话过强，课件按实测写。
- P-19-2（Enter / `requestSubmit` 是否绕过 disabled 的按钮）：**未核实，已从课件里去掉**。WHATWG 的「Implicit submission」小节两次 WebFetch 都没取到；浏览器里用合成 KeyboardEvent 和 CDP 的 Return 键都没能触发隐式提交（连按钮可用时也没触发），无法判定。课件改为只说「提交入口不只按钮：代码调用 requestSubmit、快捷键处理函数、测试直接调处理函数」，不再声称回车能绕过 disabled。
- P-19-3（卸载后 setState）：**已核实**。react.dev/blog/2022/03/08/react-18-upgrade-guide「We've removed this warning.」；测试：请求未回来就卸载，console.error 0 次。
- P-19-4 / M-3（Vue `onErrorCaptured` 与异步错误）：**已核实成立**。`callWithAsyncErrorHandling` 对 handler 返回的 Promise `.catch → handleError`（`runtime-core.cjs.js:205-213`）；测试：同步 throw 和 async 拒绝都进父组件的 `onErrorCaptured`，`info` 都是 `native event handler`。20 / 31 题可直接引用这条结论。
- 第一轮 :574 / :578（`type="number"` 对「12.」的表现）：**已核实**。Chrome 实测把 `type="number"` 的 value 设成「12.」「1e」「-」，读回来都是空串，`valueAsNumber` 是 NaN；「12.5」「0012」原样保留。19 题的金额字段因此改用 `type="text"` + `inputMode="decimal"`。

**本次新发现（审计没写到）**：
1. `<form action>` 里 action **返回**错误 state（没有 throw）也算「succeeds」，React 照样重置非受控字段 —— 一次性实验 + 测试 + Chrome 实测都确认：没有回填的「备注」被清空，用 `defaultValue={state.values.x}` 回填的字段保住。官方原文只说「After the action function succeeds…」，没点明「返回错误也算成功」。
2. `useActionState` 的排队是**串行执行、不丢弃**：同一轮提交两次会创建两单（日志 #2 成功 → #3 开始 → #3 成功），所以 Actions 版本照样要 `disabled={pending}`，服务端照样要幂等。
3. action 开头调用的 setState 属于这次 Transition，要等 action 整个结束才显示（一次性测试：请求进行中日志是空的）。所以请求日志用外部 store + `useSyncExternalStore`。
4. 字段错误后聚焦要等重新渲染：提交中输入框是 disabled，`catch` 里直接 `focus()` 不生效（React 侧放进 effect，Vue 侧 `await nextTick()`）。
5. 「提交中」这类中间状态的测试对机器负载敏感：全仓库一起跑时 20ms 的模拟延迟会先结束。这类断言统一用 300ms（测试里的 `SLOW`）。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 85 条测试 / build），全量测试连跑两次稳定；19 的 17 条测试无 act 警告、无 stderr。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json）：两侧四个区块渲染；手写版成功 / 网络失败 + 重试 / 字段错误 + 聚焦 + aria-describedby（React `_r_3_-error`、Vue `v-0-0-error`）；同一轮提交两次的有锁 / 无锁对比；Actions 版 pending、回填、备注被清空、排队串行；Vue 侧守卫拦下第二次；19 ↔ 18 / 07 来回切换；源码查看器 React 5 个 / Vue 3 个文件。捕获到的 console.error / console.warn 为 0。

### 2.5 11 API 请求状态（2026-09-17）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 11 大纲 + §3.3（教学用 effect 手写为主线，生产默认 TanStack Query，loader 并排指向 18，`use(promise)` 只作【较新】引用指向 32）；问题表 = R2-11-1～11 + AUDIT.md §3 的 11 各行。

**结构（React 4 个文件，Vue 4 个文件）**
- `react/EffectRequestPanel.tsx`【主线】：判别联合的结果 + **派生的请求态**（结果带「参数指纹」`keyword|reloadFlag|failMode`，`pending = 指纹不等于当前指纹`）；cleanup 里 abort；`reloadFlag` 让「搜同一个词」也重新请求；切换关键词保留旧数据 + 「刷新中…」；失败用开关模拟（不再用 35% 随机失败）。
- `react/ApproachesCard.tsx`：四种方案速查表（Effect 手写 / TanStack Query v5 / 路由 loader / `use(promise)`+Suspense）+ 官方对「在 Effect 里取数」的四条缺点与建议原文 + 只读骨架。
- `react/Example.tsx`：十段文件头，开头就写明「手写是教学写法，生产用缓存层（30）或 loader（18）」。
- Vue 侧：`WatchRequestPanel.vue`（`watch(参数指纹, …, { immediate: true })` + `onWatcherCleanup`【主流·3.5】，同一套建模与派生 pending）、`ApproachesCard.vue`（Vue 对应物：`@tanstack/vue-query`、导航前 / 后取数、实验性 `<Suspense>`）、`Example.vue` 精简头。
- 测试：React 7 条、Vue 7 条（全仓库 11 个文件 99 条）。

**问题表处理**：R2-11-1 官方四条缺点 + 替代方案 + 选型（速查卡 + 文件头二-7）；R2-11-2 `fetch` 不因 404 reject（③ MDN 逐字）+「本课模拟接口直接 throw」标为演示简化；R2-11-3 删掉「半吊子抽象」，改成官方建议「至少抽成自定义 Hook（14 题）」；R2-11-4 TanStack 的 status × fetchStatus、默认重试 3 次指数退避、gcTime 5 分钟、loader + useLoaderData + useNavigation 骨架；R2-11-5 `use(promise)` 的两条 caveat 原文 + Suspense 只对支持 Suspense 的数据源生效；R2-11-6 保留旧数据 + 「刷新中」（对应 placeholderData: keepPreviousData）；R2-11-7 v4 → v5 改名清单进「八、旧写法」，手写版术语改成 pending / success / error；R2-11-8 Vue 侧 useFetch / 导航取数 / `<Suspense>` 全部补齐；R2-11-9 交叉引用改指 27（竞态）、10（StrictMode）、19（提交类禁用）、24（批处理）、29（判别联合）、30 / 18 / 32；R2-11-10 见下；R2-11-11 「两边一模一样」改为「状态建模可以逐字相同，更新方式不同」。

**待核实项结论**：
- **M-6 / P-11-2（官方 Fetching data 示例与 `set-state-in-effect`）：已核实。** 把官方示例原样写成探针文件后跑 `npx eslint`：`setBio(null)` 命中 `react-hooks/set-state-in-effect`（error：「Calling setState synchronously within an effect can trigger cascading renders」）。结论：官方示例重在讲 ignore，不代表这一行必须这么写。本题因此改成**派生请求态**，Effect 体里不再有同步 setState，`eslint-suppressions.json` 里 11 题的那条已 prune（现在只剩 10 / 12 / 14 / 21 / 23 / 24 / 27 共 12 条）。10 / 24 / 27 题改写时可沿用这个做法或按各题情况保留反例。
- P-11-4（「空」是不是第四态）：按大纲口径定稿 —— 请求态三值，空态是 success 的派生展示；标题与文案都不再写「四态 / 五态」。
- P-11-1 / P-11-3 / P-11-5：未核（TanStack 细节默认值留给 30 题按 query-core 的 d.ts 核；采用情况数据阶段 4 再抓；Vue `<Suspense>` 与 vue-router 数据加载器组合留给 32 / 18 题）。

**本次新发现**：把「结果带参数指纹、请求态派生」当主线写法，一次解决三件事：Effect 体里不用同步 setState（避开 lint 规则、少一轮渲染）、过期响应写进来也不会被当成当前结果（等价于官方的 ignore 标记）、切换参数时旧数据能留在屏幕上（等价于 keepPreviousData）。10 / 22 / 27 题改写时可以沿用。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 99 条测试 / build）；11 的 14 条测试无 act 警告、无 stderr。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json）：两侧初始 8 行；React 切换关键词时「刷新中…」出现且旧 8 行仍在，完成后 1 行、指纹 `张|1|false`；失败开关 → role="alert" + 重试按钮 → 关掉后恢复；Vue 侧同样（指纹 `王|1|false`）。捕获到的 console.error / console.warn 为 0。

### 2.6 30 TanStack Query 与服务端状态（2026-09-17）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 30 大纲 + §3.3（TanStack v5 生产默认，loader 并排指向 18，`use(promise)` 只作【较新】引用指向 32）；问题表 = R2-30-1～12 + AUDIT.md §3 的 30 各行（含 §4 备注里「以第一轮为准」的 :809 uSES subscribe、:810 `<script setup>` 导出类型、:811 `as` 断言、:813 交叉引用）。核实用了一个只读工作流（3 个研究代理：query-core / react-query / vue-query 源码 19 条、官方文档 15 条、进阶文档 + npm / CHANGELOG 10 条；每份结果再配一个反驳式复核代理），44 条里 38 条确认、6 条措辞修正，修正后的说法已写进课件。

**结构（React 8 个文件，Vue 13 个文件）**
- `react/Example.tsx`：十段文件头 + 入口（`useState` 建 QueryClient 与演示工具）+ `OrdersWorkbench`（本地 UI state：筛选、页码、保留上一页、选中行、每秒时钟）。
- `react/ordersDemo.ts`：key 工厂（`['orders','list',{status,page}]` / `['orders','detail',id]` / `['orders','stats']`）+ `queryOptions()` 定义 + `createDemoQueryClient`（演示配置，测试可调 staleTime）+ 每次进入新建的演示工具（外部 store 日志、「下一次失败」开关、延迟）。queryFn 从 context 取 queryKey / signal。
- `react/OrdersListPanel.tsx`【区块一、二】：筛选 / 翻页 / 「保留上一页」/ 刷新 / 模拟失败 / 模拟断网（Effect 同步到全局 onlineManager，cleanup 恢复）；status × fetchStatus 实时状态表；同 key 徽标；mutation 三种做法（失效重取 / 乐观·variables / 乐观·onMutate 改缓存 + 回滚）+ 失败开关 + mutation 状态表；两层回调写进日志。`select` 改用类型守卫。
- `react/OrderDetailPanel.tsx`【区块三】：`enabled` 依赖查询，pending + idle 状态表。
- `react/SuspenseStatsPanel.tsx`【区块四】：`useSuspenseQuery` + 自带 `Suspense` + `QueryErrorResetBoundary` + react-error-boundary；`resetQueries` 触发重新挂起 / 首次失败进错误边界。
- `react/CacheInspector.tsx`【区块五】：本地 UI state 与 QueryCache 全部条目（queryHash、status、fetchStatus、观察者、已失效、几秒前）并排 + 运行日志；`useSyncExternalStore` 的 subscribe 用 `useCallback`（修第一轮 :809 的 Pitfall）+ `notifyManager.batchCalls`。
- `react/LoaderVsQueryCard.tsx`【区块六，只读】：路由 loader 与 TanStack 的分工表 + 并用骨架（官方 examples/react/react-router 的 `ensureQueryData` + `useSuspenseQuery`；`queryClient.query()` 标【尝鲜】）。
- Vue 侧：`Example.vue`（精简头）、`OrdersWorkbench.vue`、`OrdersListPanel.vue`（`defineModel` 的 filters / keepPrevious；key 里放 getter；`placeholderData` 传 computed；不解构的坑演示；watch + `onWatcherCleanup` 同步 onlineManager）、`OrdersCountBadge.vue`、`QueryStatusTable.vue`、`OrderDetailPanel.vue`、`SuspenseStatsPanel.vue` + `OrderStatsView.vue`（`<Suspense :timeout="0">` + 顶层 `await suspense()` + `onErrorCaptured`，换 key 重新挂起）、`CacheInspector.vue`、`LoaderVsQueryCard.vue`、`ordersDemo.ts`、`queryPlugin.ts`（改用 `createDemoQueryClient`）。
- 壳：`topicRegistry.ts` 30 题 summary 改为 v5 术语（去掉「React Query」「loading / error / data」）。README 只改 30 题相关的事实行（目录行、对照表 useQuery 行、说明段、面试题行、「待完善」里 30 题那条）。
- 测试：React 22 条、Vue 14 条（全仓库 13 个文件 135 条）。

**问题表处理**：R2-30-1 react.dev 原文 + overview 四个特征原文 + 区块六（loader / 并用）+ 四-3/4（`use(promise)` → 32）；R2-30-2 哈希规则原文 + 测试 + 区块五显示排序后的 queryHash；R2-30-3 status × fetchStatus 全组合（含 paused、enabled 时的 pending + idle）与重取触发默认值；R2-30-4 mutation 默认不重试、两层回调先后、卸载后 mutate 级不执行、mutateAsync（都有测试）；R2-30-5 两种乐观更新可运行并排 + 测试，useOptimistic 指向 31；R2-30-6 取消是 opt-in（读 signal 才 abort），StrictMode 下读 / 不读 signal 两个测试；R2-30-7 结构共享 + tracked properties（`...rest`）+ select，两条测试；R2-30-8 keepPreviousData 与 enabled 都做成可运行区块 + 测试；R2-30-9 useSuspenseQuery 可运行区块 + throwOnError 默认值 + QueryErrorResetBoundary；R2-30-10 v4 → v5 改名清单 + 包名 v4 起改名 + 全文成熟度标签，注册表 summary 同步；R2-30-11 演示简化全部标出 + SSR（模块级 client 会跨用户共享、`useState` 建、gcTime Infinity、HydrationBoundary → 33）+ response.ok；R2-30-12 残留清零、删掉「React 本身只有 useState / useEffect」、两侧 devtools 都写。第一轮：isPending 不再讲成「首次加载」（改为 status 维度，首次加载中是 isLoading）；:809 subscribe 用 useCallback；:810 `<script setup>` 不能导出类型的错误说法已删（类型放进 `vue/ordersDemo.ts`）；:811 `as` 改守卫（Vue 侧 v-model 绑 `:value` 原值，不需要守卫）；:812 取消的前提写清；:813 Vue 侧文件头已重写，不再引用 16 题 cartStore 注释；:814 useSuspenseQuery / Vue devtools 已补。

**待核实项结论**：
- P-30-1（StrictMode 日志）：**已核实**。测试 + Chrome 实测：进入本题时 React 侧列表查询 queryFn 执行 2 次、「被取消」1 次，统计查询 1 次；queryFn 不读 signal 时只执行 1 次（测试）；Vue 侧各 1 次。
- P-30-2（「用最新一次渲染的 queryFn」）：**改写**。普通 useQuery 发请求用的是最近一次提交后 effect 里 `setOptions` 同步给观察者的选项（useBaseQuery.js:35-37、queryObserver.js:139）；复核代理补了反例：Suspense 模式在渲染期 `fetchOptimistic` 就用这次渲染的选项发请求（queryObserver.js:106-120）。课件「五」按两种情况写，并有「同 key 不同 queryFn」测试。
- P-30-3 / M-8：**已核实**。`staleTime: 'static'` 从 5.79.0（2025-05-29，PR #9139）起，标【较新】；`queryClient.query()` 从 5.102.0（2026-08-22，PR #10658）起，同一版本把 fetchQuery / prefetchQuery / ensureQueryData 标 `@deprecated`（5.102.8 `hydration-Bjs0MSgg.d.ts:465-485`），发布不满 30 天标【尝鲜】。迁移页说旧方法「will be removed in v6」。补充：'static' 只看观察者上的 staleTime，在 `query()` 里传只影响那一次调用（query.js:99-102 `isStatic()`）。
- P-30-4：迁移页链接 GitHub Discussion #5279，正文指向维护者博客《Breaking React Query's API on purpose》（③，2023-04-16）：回调行为不一致（每个组件各触发一次、从缓存读时不触发、拿来同步状态会失步）；替代按场景：派生状态 / QueryCache 全局回调 / 实在要同步再 useEffect。
- P-30-5：v4 迁移页「react-query is now @tanstack/react-query」；旧包 `react-query` latest 停在 3.39.3。
- P-30-6：`@tanstack/react-query-devtools` 有 5.102.8；`@tanstack/vue-query-devtools` 从 2025-11 起版本号走 6.x，6.1.48 对应 vue-query 5.102.8（peer `@tanstack/vue-query ^5.102.8`）。两个都没装，课件只说明。
- P-30-7：官方 prefetching 指南的 Router Integration 现在用 `queryClient.query()`（并说明 prefetchQuery / ensureQueryData 已弃用）；官方 examples/react/react-router 仍是 loader 里 `await queryClient.ensureQueryData(...)` + 组件 `useSuspenseQuery`。区块六按示例写，新写法标【尝鲜】。
- P-30-8：vue-query `useBaseQuery.js:69-70` 为 `toRefs(readonly(state))`，已写进 Vue 对照。
- 仍待核实：mutation 回调第三个参数从 `context` 改名 `onMutateResult`、并新增第四个参数 `context`（含 client）是从哪个 5.x 起（query-core CHANGELOG 没搜到）。

**本次新发现（审计没写到）**：
1. 5.102.0 起 `ensureQueryData` / `prefetchQuery` / `fetchQuery` 已弃用，大纲「loader 里 ensureQueryData 预取」在新文档里已换成 `queryClient.query()`；课件按「官方示例仍用、旧方法 v5 可用、新方法【尝鲜】」三层写。
2. Vue Query 官方 reactivity 指南以「queryKey / enabled 里放 ref 或 getter」为主（「enabled and queryKey are the two query options that can accept reactive values」）；类型上整个选项也能写成 getter，但指南没展开，课件不用。另外 **`queryOptions()` + key 里放 ref 这个组合 vue-tsc 推断不出来**（No overload matches，2026-09-17 实测），改成放 getter 就通过 —— Vue 侧工厂参数因此收 `T | (() => T)`。
3. vue-query 的 `suspense()` 默认不 reject（只有 `throwOnError` 为真才 reject，useBaseQuery.js），所以 Vue 侧要把 throwOnError 写成与 React `useSuspenseQuery` 默认值相同的函数，错误才到得了 `onErrorCaptured`。
4. Vue `<Suspense>` 显示过内容后，只有 #default 根节点被替换才回到 pending（Vue 文档原文），缓存被清空不会自动重新挂起：Vue 侧用 `removeQueries` + 换 key + `:timeout="0"`；React 侧只要 `resetQueries`。
5. `onlineManager` 是 query-core 的全局单例，同页 React / Vue 两侧共用（Chrome 实测：React 侧勾「模拟断网」，Vue 侧显示「离线」）；两侧都在 cleanup 里恢复在线，离开本题后两侧都显示「在线」（Chrome 实测 + Vue 卸载测试）。
6. 暂停的请求要「在线且页面可见」才继续（retryer.js:51 `canContinue`）。Chrome 实测：预览面板隐藏（visibilityState hidden）时恢复网络仍停在 paused，页面一可见就继续。浏览器验证时用一次性探针把 visibilityState 改成 visible 并派发 visibilitychange。
7. 测试写法：同一个 `act` 里的几次 uSES 更新会合并成一次渲染，要观察「开始请求」「请求完成」两次渲染得分两段 act；自己的 `afterEach` 比 RTL 的自动 cleanup 先执行（Vitest 的 after 钩子倒序），先 `client.clear()` 会让还挂着的组件在 act 之外更新 —— 先调 `cleanup()` 再清缓存。
8. Vue 3.5.42 开发环境第一次用 `<Suspense>` 会用 console.info 打印「<Suspense> is an experimental feature and its API will likely change.」（测试输出里是 stdout，不是警告）。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 135 条测试 / build）；30 的 36 条测试连跑 3 次稳定，无 act 警告、无 stderr（只有上面第 8 条的 stdout）。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json）：两侧六个区块渲染；StrictMode 日志（React 列表 2 次 + 取消 1 次，Vue 1 次）；keepPreviousData 翻页（isPlaceholderData true、「下一页」禁用、之后换成第 2 页）；模拟断网 → paused → 恢复（见新发现 6）；乐观·改缓存立即「已支付」→ 失败回滚、日志「存了 5 份快照」；乐观·variables「已支付（待确认）」→ 成功后离开待支付列表；只重取正在使用的查询；依赖查询 pending + idle → fetching → 成功；两侧 Suspense fallback / 错误边界（onErrorCaptured）/ 重试；Vue 不解构的坑显示「请求中」；切到 18 / 11 再回来两侧都「在线」；源码查看器 React 8 个、Vue 13 个文件。捕获到的 console.error 1 条：React 开发环境对区块四故意触发的、被错误边界接住的错误的默认报告（页面上已注明）；console.warn 0 条。

### 2.7 14 自定义 Hook 与 Composable（2026-09-17）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 14 大纲 + §3.4 主线判定（订阅浏览器 API 用 `useSyncExternalStore`，`useEffect` + `setState` 订阅作并排；防抖仍用 Effect）；问题表 = R2-14-1～11 + AUDIT.md §3 的 14 各行（:435 按附录 C 由第二轮覆盖为「uSES 主线」、:436 set-state-in-effect、:437 Vue 冗余 controller、:438 `.ts` Hook 不在 lint 范围（阶段 1 已解决）、:440 交叉引用、:443 ahooks 命名）。核实工作流：文档 13 条 + 源码 / npm 9 组，各配一个反驳式复核代理，全部确认或只修正行号 / 细节。

**结构（React 8 个文件，Vue 9 个文件）**
- `react/Example.tsx`：十段文件头 + 三个区块的入口。
- `react/useWindowWidth.ts`【主线】：`useSyncExternalStore` + 模块级 `subscribe` + 返回原始值的 `getSnapshot` + 返回 null 的 `getServerSnapshot` + `useDebugValue`。
- `react/useWindowWidthEffect.ts`【并排·18 之前的写法 · 简单场景仍可用】。
- `react/WindowWidthDemo.tsx`【区块一】：两个面板同时显示主线与并排的值；卸载面板 B（状态放在独立子组件里，不牵动实验组件）；subscribe 稳定性计数实验（计数显示在兄弟组件里，避免「重渲染 → 重订 → 计数 → 重渲染」绕圈）。
- `react/useInterval.ts` + `react/IntervalDemo.tsx`【区块二】：`useEffectEvent` 版与「回调进依赖」反例并排；步长、暂停、「干扰：每 300ms 重渲染」开关。
- `react/useDebouncedValue.ts` + `react/DebouncedSearchDemo.tsx`【区块三】：防抖搜索（请求态从「结果属于哪个关键词」派生，Effect 体里不再同步 setState，lint 抑制已清）+ 请求次数日志；「let timer」反例与 useRef 修法对照。
- Vue 侧：`useWindowWidth.ts`（初始值 null、onMounted 读 window，服务端渲染安全）、`WidthPanel.vue`、`useInterval.ts`（MaybeRefOrGetter + toValue + onWatcherCleanup）、`IntervalDemo.vue`、`useDebouncedValue.ts`（toValue + onWatcherCleanup）、`DebouncedUserSearch.vue`（删掉冗余的 controller + onUnmounted）、`LetTimerDemo.vue`（Vue 里 let timer 是对的）、`Example.vue`（精简头 + 三个区块）。
- 壳：注册表 14 题 summary；README 14 题目录行、说明段、面试题行。`eslint-suppressions.json` 删掉 14 题一条，剩 **11 条 / 6 个文件**（10 / 12 / 21 / 23 / 24 / 27）。
- 测试：React 12 条、Vue 8 条（全仓库 15 个文件 155 条）。Vue 测试文件用了几个探针组件，加了文件级 `eslint-disable vue/one-component-per-file`。

**问题表处理**：R2-14-1 主线改为 uSES（定位原文、两类场景、getSnapshot / subscribe 稳定性、并发一致性、迁移示范、生态引用、Effect 版标「18 之前的写法」）；R2-14-2 getServerSnapshot 返回 null + 服务端渲染测试，Vue 侧按官方「DOM 副作用放 onMounted」改写；R2-14-3 set-state-in-effect 改为派生 loading；R2-14-4 useEffectEvent 可运行区块 + 四条 Caveats；R2-14-5 useCallback 建议原文 + useDebugValue 示范；R2-14-6 useMount / useEffectOnce / useUpdateEffect 反模式原文；R2-14-7 Hooks 规则 6 条原文 + 两条报错文案测试 + use() 例外原文 + 「不调用 Hook 不要用 use 前缀」；R2-14-8 toValue / MaybeRefOrGetter、VueUse 对照；R2-14-9 重复 6 处的模板句清零；R2-14-10「永远不需要重跑」改为 StrictMode 说明；R2-14-11 全文成熟度标签，useDebouncedValue 标「自己实现」。第一轮 :437 冗余 controller 已删（watcher 停止时清理函数也会执行，有源码与测试）；:440 两处交叉引用已改（「10 题专讲竞态」→ 竞态专题 27 题；「交给 TanStack Query」→ 防抖后的值放进 queryKey）；:443 ahooks `useDebounce` / `useDebounceFn` 已核实存在。

**待核实项结论**：
- P-14-1：use-sync-external-store 包的开发版提示原文「If you wish to support React 16 and 17, import from 'use-sync-external-store/shim' instead.」（README 本身没写）；peer 支持 react ^16.8 到 ^19，有原生 API 时 shim 直接用原生的。写进「八」。
- P-14-2：you-might-not-need-an-effect「Subscribing to an external store」完整原文已引（示例是 navigator.onLine + online / offline 事件）。
- P-14-3（tearing 能否稳定复现）：**没有做可视化演示**，只讲原理并引用 useSyncExternalStore Caveats 原文与 react-dom 源码的 `isRenderConsistentWithExternalStores`。注意：React 18 发布博客里**没有 tearing 这个词**，课件没有把它归到博客名下。
- P-14-4：按主线判定 §3.4 执行（生态依据：zustand 5.0.15 `esm/react.mjs:5-13`、TanStack `useBaseQuery.js:30` 直接调用 `React.useSyncExternalStore`）。
- P-14-5：set-state-in-effect 规则页把「Setting loading state synchronously」列为常见违例，Valid 示例是 ref 取值与渲染期计算；「异步回调里 setState 合法」没有单独示例，只能从 Invalid 示例注释和插件源码文案推出，课件按此措辞。

**本次新发现（审计没写到）**：
1. 「Vue 的 let timer 搬进 React」这个坑，eslint-plugin-react-hooks 7 的 recommended 预设能直接拦下：`react-hooks/immutability` 在赋值处报「Cannot reassign variable after render completes」、在 `onChange={handleChange}` 处报「Cannot modify local variables after render completes」（2026-09-17 实测）。课件保留反例，两处 eslint-disable 并写明原因。
2. getSnapshot 未缓存时开发环境只是 console.error「The result of getSnapshot should be cached to avoid an infinite loop」（react-dom-client.development.js:8130），真正抛错的是随后的「Maximum update depth exceeded」（测试证明）。
3. eslint-plugin-react-hooks 7.1.1 的 Hook 判定是 `/^use[A-Z0-9]/`，单独的 `use` 也算（isHookName，:54894）。
4. React 18 发布博客注明 useSyncExternalStore「is intended to be used by libraries, not application code」，而 learn 页和参考页都用应用层的 useOnlineStatus 示范它；课件两层意思都写。
5. Vue 侧 `ref(null)` + onMounted 的写法纯客户端也会先渲染一次「未知」（测试证明），React 的 uSES 纯客户端渲染时直接读 getSnapshot。
6. 测试写法：同一个 act 里推进一大段 fake timers 时，React 不会在定时器之间重渲染，「回调进依赖被一再重置」看不出来，要按 100ms 一步分别 act；resize 会让 subscribe 实验组件重渲染并重订，数 addEventListener 时基准要取在操作前一刻。
7. 浏览器面板隐藏时，视口模拟改了 innerWidth 却不派发 resize 事件（没有渲染帧），验证时手动派发一次。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 155 条测试 / build）；14 的 20 条测试连跑两次稳定，无 act 警告、无 stderr。浏览器用临时 5174 服务器（完成后已还原视口、停掉服务器、还原 launch.json）：两侧三个区块渲染；StrictMode 下 subscribe 实验从 2 / 2 开始，点 3 次后变成 2 / 5；视口改为 700 并派发 resize 后两侧面板都变成 700px、「窄」；卸载面板 B 后 A 照常更新；React 侧 let timer 触发 3 次、useRef 1 次，Vue 侧 let timer 1 次；防抖搜索只按「张伟」发请求（React 侧开发环境多一次被取消的空关键词请求，页面已注明）。捕获到的 console.error / console.warn 为 0。

### 2.8 16 全局状态（2026-09-18）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 16 大纲 + §3.5 主线判定（Zustand 5 主线；Context + useReducer 作 React 内置并排；Redux Toolkit 作【主流·存量】只读对照，不装依赖）；问题表 = R2-16-1～12 + AUDIT.md §3 的 16 各行（:470 覆盖检查、:475 v5 稳定引用与 useShallow、:476 RTK 对照、:477「Options / setup 二者等价」（附录 C「以第一轮为准」）、:479 柯里化原因、:481「永远稳定」）。核实：本会话没开 Ultracode，没有用 Workflow，改用 Agent 工具起了 2 个只读研究代理（官方文档 32 条原文，其中 3 条措辞修正；npm / 源码 19 组，其中 2 条修正）+ 1 个反驳式复核代理（对写好的课件逐条复核，提出 24 条：错 7、无出处 1、措辞 16，已全部处理，见下），另在主会话读了 zustand / pinia 源码并用探针测试核实行为。

**结构（React 9 个文件，Vue 16 个文件）**
- `react/Example.tsx`：十段文件头 + 五个区块的入口。
- `react/cartStore.ts`【主线】：`create<CartState>()(devtools(persist(...)))`；actions 与 state 同一接口；`set` 第三个参数写 action 名；`decrease` 到 1 时返回原 state（不通知订阅者）；异步 `checkoutCart`（`get()` 守卫 + await 后 set）；persist 的 `partialize` 白名单、`version: 1` + `migrate`（v0 的 qty → quantity）；导出选择器 `selectTotalCount` / `selectTotalPrice`（替换原来的 store 内 `totalPrice()` 函数）；模拟结算接口带请求计数。
- `react/renderCounts.tsx`：`<Profiler onRender>` 统计每个组件的提交次数，计数放组件外的小 store、单独面板显示。
- `react/CartDemo.tsx`【区块一】：商品列表（只选 action）/ 购物车（原子 selector + `useShallow` 取三个 action）/ 合计（`useShallow` 返回派生的两个数字）/ 礼品包装 / 「订阅整个 store」的反例徽标，五个组件的渲染次数实时显示。
- `react/StoreApiDemo.tsx`【区块二】：`getState()` 在事件里读、非 React 代码调 action（模拟退出登录）、Effect 里 `subscribe` + cleanup 写日志、结算（成功 / 失败 / 同一轮调两次）、查看 localStorage、`persist.clearStorage()`、写入 v0 旧数据后 `persist.rehydrate()` 触发 migrate。
- `react/ContextReducerCart.tsx`【区块三 · 并排】：react.dev scaling-up 教程的写法（state / dispatch 两个 Context + 自定义 Hook + `<Context value>`），`memo` 包着的件数徽标照样被礼品包装触发重渲染。
- `react/ScopedStoreDemo.tsx`【区块四】：`createStore` + `useState(() => ...)` + Context + `useStore(store, selector)`，两个清单各一份 store、一个用 props 初始化。
- `react/ReduxToolkitCard.tsx`【区块五 · 只读】：RTK 2 + react-redux 9 示意代码（`createSlice`、`configureStore`、`.withTypes()`）+ 四种方案速查表。
- Vue 侧：`cartStore.ts`（setup store + 自写 `$reset` + 异步结算 + 第三个参数 `persist` 选项）、`persistPlugin.ts`（迷你持久化插件：`declare module 'pinia'` 给 `DefineStoreOptionsBase` 加选项、创建时 `$patch` 水合、`$subscribe({ detached: true, flush: 'sync' })` 写回；`topic16PiniaSetup` 通过 `app.config.globalProperties.$pinia.use()` 装到 VueMount 新建的 pinia 上）、`ProductList` / `CartPanel` / `CartSummary` / `GiftWrapToggle` / `WholeStoreBadge` / `CartDemo` / `RenderCountsPanel` + `renderCounts.ts`（onMounted / onUpdated 计数，provide / inject 传计数器）、`StoreApiDemo.vue`（storeToRefs 与直接解构对比、`$patch` 两种形式、`$reset`、组件外 `useCartStore()`、结算、`$subscribe` / `$onAction` 日志）、`reactiveCart.ts` + `ReactiveStoreDemo.vue`（模块级 reactive 最小方案，对照 Context + useReducer）、`products.ts`、`Example.vue`（精简头 + 「区块四、五在 Vue 里」说明卡）。
- 壳：`topicRegistry.ts` 16 题 summary 更新，并加 `vuePlugins` 懒加载 `topic16PiniaSetup`（与 18 / 30 题同一个机制，不改 VueMount）。README 16 题目录行、对照表 Zustand 行、说明段、面试题行，以及附录「全局状态为什么选 Zustand」一段（原文「Redux Toolkit 概念多、样板重」与 RTK 自述相悖，已改）。
- 测试：React 19 条、Vue 15 条（全仓库 17 个文件 189 条）。

**问题表处理**：R2-16-1 useShallow（区块一 + 测试：不包时的两条报错、shallow 只比一层）、`createWithEqualityFn` 写进二-5 / 八（`zustand/traditional` 需另装 use-sync-external-store，本仓库导入会 ERR_MODULE_NOT_FOUND，只作说明）、Compiler 一句（推论，待核实）；R2-16-2 底层 uSES（react.mjs:5-13）+ getState / setState / subscribe / getInitialState（区块二 + 测试）+ 服务端快照读 getInitialState（测试）；R2-16-3 按 §3.5 定稿：RTK 自述三条抱怨原文、「RTK 样板多」改为「RTK 减轻了经典 Redux 的样板，但比 Zustand 仍多 Provider / configureStore / 带类型 Hook」、采用数据（③ npm）；R2-16-4 devtools / persist 可运行，subscribeWithSelector / combine / redux / immer 写进二-8，`set(x, true)` 清掉 actions（测试）；R2-16-5 异步 action（区块二 + 测试）、slices 类型写法进七、combine 进二-8；R2-16-6 区块四可运行 + Next.js 指南原文；R2-16-7 八段：zustand v4 相等函数 / 默认导出 / persist 初始写入、经典 Redux + createStore 弃用、Context.Provider、legacy context 在 19 移除、Vuex / Pinia 2；R2-16-8 Pinia 对照全部落地（定位原文、$patch / $state / 自写 $reset / $subscribe / $onAction、插件、模块级 reactive + SSR 原文、组件外使用）；R2-16-9 先分类五类（服务端 / URL / 表单草稿 / 子树 / 全局）；R2-16-10 七段全部标出演示简化与生产写法（slices、persist 白名单 + version / migrate + 校验、token 不落 localStorage → 35、devtools 仅开发期、服务端渲染每请求一个 store、测试重置）；R2-16-11 模板残留清零，「永远稳定」改为带前提；R2-16-12 交叉引用补 14 / 18 / 21 / 25 / 29 / 30 / 33 / 34 / 35。第一轮：:477 改为官方原文「Options stores are easier to work with while Setup stores are more flexible and powerful」（初稿写成「能力相当」，复核后改正）；:479 柯里化原因改引 advanced-typescript 原文（T 不变型 + TS#10571）；:481 加「没被 set(x, true) 换掉」的前提。

**大纲与判定的一处取舍**：AUDIT-ROUND2 §5 的 16 大纲「八」把「Context + useReducer 手搓 store」列为旧写法，但 §3.5 主线判定把它定为 React 内置并排、react.dev 仍把它当 scaling-up 的正式写法。按 §3.5 + 官方教程定为【主流 · React 内置】，并写清适用范围（低频全局值、依赖注入、子树内部）和短板（没有 selector）；真正的旧写法（class 组件 legacy context、`<Context.Provider>`）放进八。

**待核实项结论**：
- P-16-1（v5 迁移页、发布日期）：迁移页在 GitHub 的 `docs/reference/migrations/migrating-to-v5.md`（原文已引）；页面里没有发布日期，③ npm：5.0.0 发布于 2024-10-14，最新 5.0.15（2026-08-13），4.5.7（2025-05-15）是最后一个 4.x。
- P-16-2（Compiler 不改变订阅粒度）：仍是推论，没找到官方原文，课件写「推论，待核实，见 17 题」，17 题改写时在 Compiler 小节再核。
- **P-16-3（selector 返回新对象的表现）：已核实。** zustand 5.0.15 + react-dom 19.2.8：开发环境先 console.error「The result of getSnapshot should be cached to avoid an infinite loop」（:8130），随后抛「Maximum update depth exceeded」（:4625）；测试覆盖。迁移指南原文是「may cause infinite loops」。
- P-16-4（react-redux useSelector 相等比较）：hooks 页原文「uses strict === reference equality checks by default」「returning a new object every time will always force a re-render by default」，可传 `shallowEqual`；8.1.0 起开发期 stabilityCheck。写进二-11 / 四-2。
- P-16-5（采用数据）：③ api.npmjs.org 2026-09-10 至 09-16：zustand 50.3M、react-redux 33.6M、@reduxjs/toolkit 27.2M、jotai 5.3M、mobx 3.4M、valtio 1.9M、pinia 4.5M、vuex 1.5M；zustand v5 55.3% / v4 39.5%；pinia v3 42.2% / v2 39.2% / v4 18.6%；RTK v2 91.8%。
- **P-16-6（selector 里调用 store 函数 `s => s.totalPrice()`）：文档没有示范这种写法**（beginner-typescript 的「Derived State with Selectors」推荐在 selector 里算；advanced-typescript 的 slices 例子在 store 里放过 getBoth，但没在 selector 里调用）。已改为 store 外导出选择器函数。

**本次新发现（审计没写到）**：
1. Vue 3.4 起 computed 结果没变就不通知下游（blog.vuejs.org/posts/vue-3-4 原文），所以「读了整个 $state、再包一层 computed 只算件数」的组件不会因为无关字段重新渲染 —— computed 在这里起的作用和 Zustand selector 的 Object.is 一样。第一版 WholeStoreBadge 就因此没能复现「订阅整个 store」，改成模板直接读展开后的对象；两种情况都有测试。
2. Pinia `$subscribe` 的坑：`$patch` 之后同一个 tick 里的直接修改，在默认 flush（'pre'）下不会再单独回调（Pinia 4 文档的提示原文；3.0.4 实测一样：$patch 期间暂停监听，恢复监听排在同一轮 flush 之后）。用 `$subscribe` 做持久化会漏存这次修改，本题 persistPlugin 改用 `flush: 'sync'`，有测试。
3. pinia.d.ts 里 onError「Return false to catch the error and stop it from propagating」的注释在 3.0.4 没有实现（pinia.mjs:1403-1416 一律重新抛出），课件写明不要依赖。
4. `$onAction` 的 detached 是第二个位置参数 `true`，`$subscribe` 是选项 `{ detached: true }`。setup store 返回的 `$reset` 也被当成 action，会出现在 `$onAction` 日志里（浏览器实测）。
5. zustand persist 下 `getInitialState()` 返回水合前的初始值（middleware.mjs:378），所以官方的测试重置写法在 persist store 上照样可用；localStorage 这类同步存储在 `create` 返回时已经水合完（测试覆盖）。devtools 没装扩展时不包装 setState、直接 return fn(set, get, api)，不会报警告。
6. `zustand/traditional` 与 `zustand/middleware/immer` 在本仓库无法导入（缺 use-sync-external-store / immer 两个可选 peer），课件只作说明。
7. react.dev 的 scaling-up 教程把 state / dispatch 拆成两个 Context 当作结构来讲，没说是性能优化；「只读 dispatch 的组件不重渲染」是由 useReducer 参考页「dispatch has a stable identity」推出的，课件这样写并有测试。
8. Vue 官方 state-management 页仍写 Pinia「works with both Vue 2 and Vue 3」，但 Pinia 3 起只支持 Vue 3，课件注明这句已过时。
9. 浏览器首次打开本题时，Vite 发现新依赖 `zustand/react/shallow`、`zustand/middleware`，重新预构建后自动刷新一次；刷新前控制台会出现一次「Invalid hook call」（新旧两份预构建的 React 混用），刷新后正常。这是 Vite 开发模式的现象，与代码无关；用户自己的 5173 服务器第一次打开 16 题也会遇到一次。

**复核代理提出、已改的 24 条（要点）**：Profiler 是 16.9.0 起（不是 16.5，React CHANGELOG）；devtools 不写 action 名时 5.0.15 先从调用栈推断函数名、推断不出来才是 "anonymous"（middleware.mjs:75-77，本课隔着 persist 所以推断不出来）；「option / setup store 能力相当」改为官方「Setup stores are more flexible and powerful」；「v5 为了和 React 默认行为一致而去掉 equalityFn」没有出处，已删（那句原文说的是 selector 稳定引用）；「RTK 样板多说的是经典 Redux」改为「RTK 减轻了样板，但比 Zustand 仍多 Provider / configureStore / 带类型 Hook」；「React 只提供 Context」补上 useSyncExternalStore；pinia 4 不只改打包（还重写了错误提示、加了小功能）；Next.js 指南的说明是 2025-10 加的，从【尝鲜】移到七；另有 4 处文件内交叉引用位置写错、1 处引文删了词、RTK 示意代码漏了 react-redux 的导入、换 key 重置的交叉引用改指 06 题，都已改。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 189 条测试 / build）；16 的 34 条测试无 act 警告、无 stderr。浏览器用临时 5174 服务器（完成后已停掉、清掉 localStorage 并还原 launch.json）：两侧区块一渲染次数与测试一致（加入购物车：商品列表 1、购物车 2、合计 2、礼品包装 1、整店徽标 2；再勾礼品包装：只有礼品包装与整店徽标 +1）；区块二 getState、模拟退出登录、同一轮调两次结算（两侧都只发 1 次请求）、结算失败 role="alert"、查看 localStorage（只有 items / giftWrap / version）、v0 → migrate、Vue `$patch` / `$reset` / 直接解构不更新；区块三 memo 徽标照样渲染（React）/ 件数不动（Vue）；区块四两个清单互不影响；切到 15 / 14 / 30 再回来，React 购物车在内存里、Vue 购物车从 localStorage 读回；整页刷新后两侧都从 localStorage 恢复；页面宽 1024 时没有卡片溢出；源码查看器 React 9 个、Vue 16 个文件。除新发现 9 那一次之外，捕获到的 console.error / console.warn 为 0（改代码时 HMR 分三步应用，中间出现过两条「statusText 未定义」警告，整页刷新后消失）。

## 统一措辞（各题改写时照用）

### Vue 响应式（2-A 定稿，2026-09-17）

**依据**：
- vuejs.org/guide/extras/reactivity-in-depth：「In Vue 3, Proxies are used for reactive objects and getter / setters are used for refs」；「each component instance creates a reactive effect to render and update the DOM」。
- vuejs.org/guide/essentials/reactivity-fundamentals：「Non-primitive values are turned into reactive proxies via `reactive()`」；「when a ref is mutated, it will trigger a re-render for components that are tracking it」；「Vue buffers them until the "next tick" in the update cycle to ensure that each component updates only once no matter how many state changes you have made」。
- vuejs.org/guide/extras/rendering-mechanism：「When a dependency used during mount changes, the effect re-runs. This time, a new, updated Virtual DOM tree is created」；「When this component needs to re-render, it only needs to traverse the flattened tree instead of the full tree」。
- 源码（vue 3.5.42）：`@vue/reactivity/dist/reactivity.cjs.js:1517-1555`（`RefImpl`：`get value()` 里 track，`set value()` 先 `hasChanged` 再 trigger）、`:1496`（`toReactive`：对象交给 `reactive()`）、`:1459`（`createReactiveObject` 里 `new Proxy`）、`:1093`（reactive 的 set 同样先 `hasChanged`）；`@vue/shared/dist/shared.cjs.js:86`（`hasChanged = !Object.is`）；`@vue/runtime-core/dist/runtime-core.cjs.js:6317`（每个组件实例 `instance.effect = new ReactiveEffect(componentUpdateFn)`，调度走 `queueJob`）、`:4835`（`shouldUpdateComponent`：props 没变的子组件跳过更新）、`:4940`（组件 props 是 `shallowReactive`）。

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| 实现方式 | `reactive()` 返回原对象的 Proxy；`ref()` 靠 `.value` 的 getter / setter（读时追踪、写时触发）；`ref` 装对象或数组时，内部用 `reactive()` 转成 Proxy，所以 `items.value.push()`、`item.quantity++` 是 Proxy 拦截的 | 「ref 是 Proxy」「ref / reactive 是 Proxy 容器」；泛指时写「Vue 用 Proxy 拦截读写」 |
| 泛称 | 「ref / reactive」「响应式数据」「响应式容器」 | 「Proxy 里的数据」 |
| 普通变量改了不更新视图 | 「它不是 ref / reactive，响应式系统追踪不到」 | 「不在 Proxy 里」「脱离了 Proxy」 |
| 赋相同的值 | 「ref 的 setter / reactive 的 set 用 `Object.is` 比较，值没变不触发」 | 对 ref 写「Proxy 发现值没变」 |
| 更新单位 | 依赖追踪记到具体属性；写入后被触发重新执行的是读过它的 effect —— 组件的 render effect（每个组件实例一个）、computed、watch。组件 render effect 重跑 = 重新执行这个组件的渲染函数（setup 不重跑）、生成新的虚拟 DOM 再 patch；编译器标出的动态节点（patch flags / tree flattening）让 patch 只比对会变的部分；props 没变的子组件不跟着重渲染 | 「属性级更新」「只更新依赖它的地方 / 用到它的那几个节点」「Vue 不重跑整个组件」「粒度比 React 精细得多」 |
| 与 React 对比 | 两边的更新单位都是组件：React 从调用 setState 的组件开始，默认连同它渲染出的子组件一起重新执行（memo 可跳过）；Vue 只重跑读过这份数据的组件的渲染函数，props 没变的子组件不跟着重渲染 | 不带范围的「Vue 细粒度、React 粗粒度」 |
| 时机 | 数据立刻变；DOM 更新异步批量，在下一个 tick 执行，同一轮里每个组件只更新一次 | 「改 .value 视图立即更新」「改完立即精准更新」 |
| 更细粒度的方向 | 逐个绑定直接更新 DOM、不经过组件级虚拟 DOM，是 Vapor Mode（Vue 3.6 RC）的方向【尝鲜】 | 把 Vapor 的行为说成 Vue 3.5 的现状 |
| 本来就对、不用改 | 「props 是响应式 Proxy」（`shallowReactive`）；reactive 对象、从 reactive 数组里取出的对象由 Proxy 拦截；「依赖追踪是属性级的」（说的是追踪，不是更新） | — |

### 表单与事件类型（07 定稿，2026-09-17）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| 提交事件类型 | `onSubmit` 的参数写 `SubmitEvent<HTMLFormElement>`（@types/react 19.2.18：`onSubmit?: SubmitEventHandler<T>`，index.d.ts:2314） | `FormEvent<HTMLFormElement>`（已 `@deprecated`，:2086-2091），只在「旧写法对照」里出现 |
| 输入事件类型 | `ChangeEvent<HTMLInputElement>` 等 | — |
| onChange 的语义 | 「行为像原生 input 事件，值每变一次触发一次，输入法拼写期间也触发」（官方「for example, it fires on every keystroke」只是举例） | 「和原生 change 一样」 |
| 受控 / 非受控 | 两种都是【主流】基础写法；Vue 两种模式都有（v-model = 受控，静态属性 + FormData = 非受控），差别在受控强度、更新范围、`:value` 与 `defaultValue` 语义 | 「受控 / 非受控是 React 特有的概念」「Vue 里不存在」 |
| 开发期报错 | 「开发环境报错（console.error）」 | 「控制台警告」（生产构建没有这些检查） |
| useId | React 18.0 起；Vue 3.5 起也有 `useId()`（多应用 `app.config.idPrefix`） | 「Vue 没有 useId 对应物」 |

### 服务端状态 / TanStack Query（30 定稿，2026-09-17）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| isPending | 「status === 'pending'，还没有数据」；首次加载中是 isLoading（= isPending && isFetching） | 「isPending = 首次加载中」「isPending = 正在请求」 |
| 两个维度 | status 回答「有没有数据」，fetchStatus 回答「queryFn 在不在跑」（queries 页原文） | 只用 isPending / isFetching 两个布尔讲 |
| 取消 | 「queryFn 读了 signal，库才会在 key 切换 / 最后一个观察者离开时 abort；不读就只是不再重试，请求照样跑完」 | 「库自动取消在途请求」「把竞态取消全自动化了」（不带前提） |
| paused | 「想请求但被暂停：默认 networkMode 'online' 下断网，或重试等待期间页面不可见；在线且页面可见才继续」 | 「paused = 断网」 |
| 预取 API | ensureQueryData / prefetchQuery / fetchQuery：v5 可用、存量代码最常见，5.102.0 起标 @deprecated；queryClient.query()【尝鲜·5.102.0 起】 | 把 query() 当主线，或不提弃用 |
| staleTime: 'static' | 【较新·5.79.0 起】，连 invalidateQueries 也不重取；只看观察者上的 staleTime | 「和 Infinity 一样」 |
| 包名 | @tanstack/react-query（v4 起）；旧名 React Query | 「React Query」当现名 |
| Vue 响应式参数 | 「把 ref 或 getter 放进 queryKey / enabled」（官方 reactivity 指南）；返回值是一组 ref，要解构 | 「vue-query 返回 reactive 对象」 |

### 自定义 Hook 与订阅外部数据源（14 定稿，2026-09-17）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| 订阅浏览器 API / 第三方 store | 主线 useSyncExternalStore【主流·18.0 起】；useEffect + setState 订阅标「18 之前的写法 · 简单场景仍可用」 | 「useState + useEffect 是订阅外部系统的标准组合」 |
| tearing | 「并发渲染中途外部数据变化，同一屏读到不同版本（社区叫 tearing）」，官方依据引 useSyncExternalStore Caveats「every component on screen is reflecting the same version of the store」 | 说成 React 18 博客里的原话 |
| getSnapshot 不稳定 | 开发环境 console.error「should be cached」，随后无限重渲染报「Maximum update depth exceeded」 | 「getSnapshot 不稳定会直接抛错」 |
| Hook 命名 | 官方：use + 大写字母；lint 实际判定 /^use[A-Z0-9]/ | 「use 前缀只是风格」 |
| 接收回调 | useEffectEvent【较新·19.2 起】包一层，18 用 latest ref（26 题） | 回调直接进依赖，或用 eslint-disable 去掉依赖 |
| Vue 对应 | composable + ref + onMounted / onUnmounted；Vue 没有 useSyncExternalStore 这类 API，也不需要 | 「没有一一对应关系」 |

### 全局状态（16 定稿，2026-09-18）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| Zustand 怎么判断变没变 | 「selector 的结果用 Object.is 比较」（useShallow 指南原文；README 叫 strict-equality） | 「默认浅比较」 |
| selector 返回对象 / 数组 | 「v5 下可能无限更新（迁移指南原文 may cause infinite loops）；包 useShallow（只比一层）或拆成原子 selector」 | 「只是多渲染几次」（那是 react-redux 的表现） |
| Context 与 store | 「Context 是传值机制，没有 selector；value 变了读它的组件都重渲染，memo 挡不住」；适用低频全局值、依赖注入、子树内部 | 「Context 不能做状态管理」「Context 性能差」（不带前提） |
| Context + useReducer | 【主流 · React 内置】（react.dev scaling-up 教程的正式写法） | 「旧写法」 |
| Redux Toolkit | 【主流 · 存量】Redux 官方标准写法；为减轻经典 Redux 的样板（原文 help address）而做，比经典写法少得多，但比 Zustand 仍多 Provider / configureStore / 带类型 Hook | 「RTK 样板多、太重」「RTK 没有样板」 |
| React 官方给了什么 | 「不指定状态库；内置 Context（+ reducer）和给外部 store 用的 useSyncExternalStore」 | 「React 只提供 Context」 |
| 派生值 | Zustand：在 selector 里算（或导出选择器函数）；Pinia：getter = computed | 「store 里放函数、selector 里调 s.xxx()」 |
| 服务端渲染 | 模块级 store 会跨请求共享 → createStore + Context 每请求一个；Pinia 每请求 createPinia()；RSC 不读写 store | 「Zustand 不能用于服务端渲染」 |
| option / setup store | 官方「Options stores are easier to work with while Setup stores are more flexible and powerful」 | 「两种写法等价 / 能力相当」 |
| Pinia 版本 | 本课用 3.0.4；pinia 4【尝鲜】：破坏性变更只涉及打包，另重写了错误提示；Pinia 3 起只支持 Vue 3 | 「Pinia 支持 Vue 2 和 3」「pinia 4 只改了打包」 |
| Vue computed | Vue 3.4 起 computed 结果没变就不通知下游（blog 原文），作用相当于 selector 的 Object.is | 「computed 依赖变了，用它的组件就一定重新渲染」 |
| Profiler | `<Profiler>`【主流 · 16.9 起】，生产构建默认不调用 onRender | 「16.5 起」 |

## 每题状态（阶段 2 起填写）

| 题号 | 主题 | 状态 | 改动摘要 | 遗留问题 |
|---|---|---|---|---|
| 18 | 路由（React Router） | **完成（样板已确认）** | Data 模式主线（loader / action / middleware 守卫 / errorElement / lazy / useBlocker / 面包屑）+ 声明式 RequireAuth 三态并排；十段文件头；React 18 条 + Vue 7 条结论测试；Vue 守卫改为返回值写法；safeRedirect 共享实现；源码查看器支持多文件（5.10）。详见 2.1 | 32 / 34 / 35 题新增后回填交叉引用 |
| 16 | 全局状态（Zustand） | **完成** | Zustand 5 主线五个区块（selector 与 useShallow + Profiler 渲染计数 / 组件外读写 + subscribe + 异步 action + persist 与 migrate / Context + useReducer 并排 / createStore + Context 每实例一份 / RTK 只读对照）；Vue 侧 Pinia setup store + 迷你持久化插件 + 模块级 reactive；React 19 条 + Vue 15 条测试；了结 P-16-1、3～6（P-16-2 仍是推论）。详见 2.8 | P-16-2（Compiler 与订阅粒度）留给 17 题；33 / 34 / 35 新增后回填交叉引用；首次打开会触发一次 Vite 依赖重新预构建（新发现 9） |
| 14 | 自定义 Hook 与 Composable | **完成** | useSyncExternalStore 主线（useWindowWidth + getServerSnapshot + useDebugValue）+ Effect 订阅并排 + subscribe 稳定性实验；useInterval（useEffectEvent）与「回调进依赖」反例；防抖搜索（派生 loading，lint 抑制已清）+ let timer 坑；React 12 条 + Vue 8 条测试；了结 P-14-1～5。详见 2.7 | tearing 没有做可视化演示（P-14-3，只讲原理）；32 / 33 / 34 新增后回填交叉引用；03 题 :64「10、14 题会再遇到快照」留给 03 题改写时核对 |
| 30 | TanStack Query 与服务端状态 | **完成** | v5 主线六个区块（queryKey 与缓存 + status × fetchStatus + 保留上一页 + 断网 / mutation 三种更新方式 / enabled / useSuspenseQuery / 缓存观察窗 / loader 分工）；key 工厂 + queryOptions；React 22 条 + Vue 14 条测试；了结 P-30-1～8、M-8。详见 2.6 | mutation 回调改名的起始版本待核实；31 / 32 / 33 / 34 新增后回填交叉引用；27 题「queryFn({ signal }) 把这一整套自动化了」缺「读了 signal 才取消」的前提，27 题改写时处理 |
| 11 | API 请求状态 | **完成** | Effect 手写主线（判别联合 + 派生 pending + 取消 + 重试 + 保留旧数据）+ 四种方案速查；lint 抑制已清（M-6 / P-11-2 了结）；React 7 条 + Vue 7 条测试。详见 2.5 | 32 题新增后回填交叉引用；P-11-1 / P-11-3 / P-11-5 留给 30 / 18 / 32 与阶段 4 |
| 19 | 异步提交与防重复 | **完成** | 手写 submitting 主线（防重复三道关 + 错误分层 + a11y）+ React 19 Actions 可运行并排；共享 mockApi 加 `ApiFieldError`；React 10 条 + Vue 7 条测试；了结 P-19-1/3/4、M-3 与「12.」的待核实。详见 2.4 | 31 / 35 题新增后回填交叉引用；P-19-2（回车与 disabled）无法核实，已从课件去掉 |
| 07 | 表单与受控组件 | **完成** | 受控、非受控两条主线（各一个可运行表单）+ TextField（useId、ref 作为 prop、aria）+ onChange / v-model 触发时机实验；十段文件头；React 19 条 + Vue 13 条结论测试；FormEvent → SubmitEvent；更正审计「Vue 无 useId」。详见 2.3 | 31 / 32 / 34 / 35 题新增后回填交叉引用；「SubmitEvent.submitter 是否随 19.3 发布」待核实 |
| 其余 01–30 | — | 未开始 | — | 10 / 12 / 21 / 23 / 24 / 27 有 lint 抑制待清（共 11 条，1.4；11、14 题的已在 2.5、2.7 清掉） |

## 遗留 / 待核实

- 已决定：AUDIT.md §5.0（5.1–5.12 + 5.13 第二轮 + 5.14 阶段 1 复核 + 5.15 D1-1 升级 ESLint 10）。当前没有待决事项。
- 第二轮审计已完成（2026-09-17）：`docs/upgrade/AUDIT-ROUND2.md`（§1 逐题目标大纲 vs 现状、§2 缺失汇总、§3 主线判定、§4 与第一轮差异、§5 每题十段重写大纲、§6 待决 D2-1～8、附录待核实）。统计：35 题 371 条（严重 54 / 概念 228 / 生产 32 / 小问题 57）；待核实 182 条 + 主会话 M-1～M-10。
- 合并规则（已按 §6 答复执行，写在 AUDIT.md 附录 C）：阶段 2 每题以 AUDIT-ROUND2.md §5 的十段大纲为蓝本；逐题问题表 = 本轮 §2 缺失清单 + 第一轮 §3 讲错清单，其中 AUDIT-ROUND2.md §4 第 4 条列出的约 20 条「第一轮有依据、本轮标已讲对」的条目以第一轮为准；§4 第 5 条的可关闭项（P-25-1、P-22-1）关闭；§3 主线判定与 §6 决定覆盖第一轮 §4.2 里与之冲突的处置建议（18 主线、14 uSES 主线、26 latest ref 标签、Vue 3.5 特性标【主流】）。
- 待核实：AUDIT-ROUND2.md 附录（各题 P-NN-k 共 182 条 + M-1～M-10）。阶段 1 已了结：M-1（recommended 实跑清单，见 1.4）、M-4（@testing-library/vue 8.1.0 与 vue 3.5.42 / vitest 4.1.11 实测可用）、M-5（react-error-boundary 已安装）、M-10（采用情况复核：本次复核发布日期、engines 与 deprecated 状态，未重抓周下载）。仍待核实：M-7。M-8 已在 30 题了结（query() 5.102.0 起、同一版本弃用 fetchQuery 等，见 2.6）。M-2 已在 07 题了结（成立，见 2.3）；M-3 已在 19 题了结（成立，见 2.4，20 / 31 题可直接引用）；M-6 已在 11 题了结（官方示例确实命中 `set-state-in-effect`，见 2.5）。
- 阶段 1 新增待核实：vue-router 从哪个 5.x 版本开始对 `next()` 发 R0025 警告。
- 阶段 1 遗留：README 叙述性章节留阶段 4；@testing-library/vue 内嵌 DTL 9，Vue 测试里的 `screen` 来自 DTL 9（34 题讲 Vue 测试时注明）；冒烟测试在 34 题落地后并入或删除；已装的 6 个不满 30 天的包满 30 天后也不主动升级，除非有需要。
- 第二轮工作方式记录：大纲阶段 5 批（按文档域分组、禁读课件）→ 对照阶段 10 批（按代码体量 ≤ 125 KB 分组）→ 主线回填 1 批 → 与第一轮对比 3 批；全部 2 并发，共 19 个只读子代理，约 4.5 小时；产物先写 scratchpad 的 parts 再由脚本合并并做机械校验（`file:line` 存在、原文片段命中、`grep0` 复跑为 0、枚举 / 编号合法、无残留标记）；脚本与 parts 不入库。
- 待核实 / 需运行验证：AUDIT.md 附录 B（16 条逐题遗留 + 9 条需运行验证）。
- 审计统计：30 题共 176 条（严重 9 / 概念 71 / 生产 14 / 小问题 82）；结构建议：18 题重写，21 题修改，8 题保留小修，新增 5 题（31–35）+ 可选 2 题。
- 工作方式记录：6 个只读子代理分批（每批 4–6 题，2 并发），每批约 25–40 分钟；版本调查脚本与事实卡在会话 scratchpad（不入库），结论已全部写进 AUDIT.md。
