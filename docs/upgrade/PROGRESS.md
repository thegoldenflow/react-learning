# 课件升级进度（docs/upgrade/PROGRESS.md）

> 规格：仓库根目录 `course-upgrade-prompt.md`（基准日 2026-09-16）。
> 新会话先读本文件，再接着做。上下文快满或会话要结束时，先更新本文件。

## 阶段状态

| 阶段 | 内容 | 状态 | 交付物 | 备注 |
|---|---|---|---|---|
| 0 | 审计（只读） | **完成。** 两轮审计均完成；用户 2026-09-17 答复「全部按建议执行」（AUDIT-ROUND2.md §6 D2-1～8，记录在 AUDIT.md §5.13）；两轮合并规则写在 AUDIT.md 附录 C | `docs/upgrade/AUDIT.md`（含 §5.13、§5.14、附录 C）、`docs/upgrade/REAUDIT-PROMPT.md`、`docs/upgrade/AUDIT-ROUND2.md` | 两轮审计与合并说明均已提交（d550e27、1efc217） |
| 1 | 依赖与工具链调整 | **完成（2026-09-17）**：commit「阶段 1：依赖与工具链调整」（34cd734）+「阶段 1 补充：ESLint 9 → 10（D1-1）」 | package.json / package-lock.json、vitest.config.ts、eslint.config.js + eslint-suppressions.json、tsconfig.json、src/test/、4 处 react-router 导入、README 事实行 | 复核口径与全部记录见下文「阶段 1 记录」；版本决定见 AUDIT.md §5.0 的 5.14、5.15 |
| 2 | 逐主题修改（先改 18 路由样板） | **进行中**（分支 `phase-2-topics`）：前置 commit（壳修复，2.0）与 **18 路由样板**（2.1）已完成，**样板风格已确认**（AUDIT.md §5.0 的 5.16）。**下一步：按 `docs/upgrade/CONTINUE-PROMPT.md` 在新会话继续**，先做 2-A（Vue 响应式措辞批量修正），再按 2-B → 2-C 逐题改 | 每题一个 commit | 样板已确认，其余题不再逐题停 |
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

## 每题状态（阶段 2 起填写）

| 题号 | 主题 | 状态 | 改动摘要 | 遗留问题 |
|---|---|---|---|---|
| 18 | 路由（React Router） | **完成（样板已确认）** | Data 模式主线（loader / action / middleware 守卫 / errorElement / lazy / useBlocker / 面包屑）+ 声明式 RequireAuth 三态并排；十段文件头；React 18 条 + Vue 7 条结论测试；Vue 守卫改为返回值写法；safeRedirect 共享实现；源码查看器支持多文件（5.10）。详见 2.1 | 32 / 34 / 35 题新增后回填交叉引用 |
| 其余 01–30 | — | 未开始 | — | 10 / 11 / 12 / 14 / 21 / 23 / 24 / 27 有 lint 抑制待清（1.4） |

## 遗留 / 待核实

- 已决定：AUDIT.md §5.0（5.1–5.12 + 5.13 第二轮 + 5.14 阶段 1 复核 + 5.15 D1-1 升级 ESLint 10）。当前没有待决事项。
- 第二轮审计已完成（2026-09-17）：`docs/upgrade/AUDIT-ROUND2.md`（§1 逐题目标大纲 vs 现状、§2 缺失汇总、§3 主线判定、§4 与第一轮差异、§5 每题十段重写大纲、§6 待决 D2-1～8、附录待核实）。统计：35 题 371 条（严重 54 / 概念 228 / 生产 32 / 小问题 57）；待核实 182 条 + 主会话 M-1～M-10。
- 合并规则（已按 §6 答复执行，写在 AUDIT.md 附录 C）：阶段 2 每题以 AUDIT-ROUND2.md §5 的十段大纲为蓝本；逐题问题表 = 本轮 §2 缺失清单 + 第一轮 §3 讲错清单，其中 AUDIT-ROUND2.md §4 第 4 条列出的约 20 条「第一轮有依据、本轮标已讲对」的条目以第一轮为准；§4 第 5 条的可关闭项（P-25-1、P-22-1）关闭；§3 主线判定与 §6 决定覆盖第一轮 §4.2 里与之冲突的处置建议（18 主线、14 uSES 主线、26 latest ref 标签、Vue 3.5 特性标【主流】）。
- 待核实：AUDIT-ROUND2.md 附录（各题 P-NN-k 共 182 条 + M-1～M-10）。阶段 1 已了结：M-1（recommended 实跑清单，见 1.4）、M-4（@testing-library/vue 8.1.0 与 vue 3.5.42 / vitest 4.1.11 实测可用）、M-5（react-error-boundary 已安装）、M-10（采用情况复核：本次复核发布日期、engines 与 deprecated 状态，未重抓周下载）。仍待核实：M-2（`FormEvent` 已 `@deprecated`）、M-3（`onErrorCaptured` 异步范围）、M-6、M-7、M-8。
- 阶段 1 新增待核实：vue-router 从哪个 5.x 版本开始对 `next()` 发 R0025 警告。
- 阶段 1 遗留：README 叙述性章节留阶段 4；@testing-library/vue 内嵌 DTL 9，Vue 测试里的 `screen` 来自 DTL 9（34 题讲 Vue 测试时注明）；冒烟测试在 34 题落地后并入或删除；已装的 6 个不满 30 天的包满 30 天后也不主动升级，除非有需要。
- 第二轮工作方式记录：大纲阶段 5 批（按文档域分组、禁读课件）→ 对照阶段 10 批（按代码体量 ≤ 125 KB 分组）→ 主线回填 1 批 → 与第一轮对比 3 批；全部 2 并发，共 19 个只读子代理，约 4.5 小时；产物先写 scratchpad 的 parts 再由脚本合并并做机械校验（`file:line` 存在、原文片段命中、`grep0` 复跑为 0、枚举 / 编号合法、无残留标记）；脚本与 parts 不入库。
- 待核实 / 需运行验证：AUDIT.md 附录 B（16 条逐题遗留 + 9 条需运行验证）。
- 审计统计：30 题共 176 条（严重 9 / 概念 71 / 生产 14 / 小问题 82）；结构建议：18 题重写，21 题修改，8 题保留小修，新增 5 题（31–35）+ 可选 2 题。
- 工作方式记录：6 个只读子代理分批（每批 4–6 题，2 并发），每批约 25–40 分钟；版本调查脚本与事实卡在会话 scratchpad（不入库），结论已全部写进 AUDIT.md。
