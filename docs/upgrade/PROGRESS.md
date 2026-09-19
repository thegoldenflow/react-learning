# 课件升级进度（docs/upgrade/PROGRESS.md）

> 规格：仓库根目录 `course-upgrade-prompt.md`（基准日 2026-09-16）。
> 新会话先读本文件，再接着做。上下文快满或会话要结束时，先更新本文件。

## 阶段状态

| 阶段 | 内容 | 状态 | 交付物 | 备注 |
|---|---|---|---|---|
| 0 | 审计（只读） | **完成。** 两轮审计均完成；用户 2026-09-17 答复「全部按建议执行」（AUDIT-ROUND2.md §6 D2-1～8，记录在 AUDIT.md §5.13）；两轮合并规则写在 AUDIT.md 附录 C | `docs/upgrade/AUDIT.md`（含 §5.13、§5.14、附录 C）、`docs/upgrade/REAUDIT-PROMPT.md`、`docs/upgrade/AUDIT-ROUND2.md` | 两轮审计与合并说明均已提交（d550e27、1efc217） |
| 1 | 依赖与工具链调整 | **完成（2026-09-17）**：commit「阶段 1：依赖与工具链调整」（34cd734）+「阶段 1 补充：ESLint 9 → 10（D1-1）」 | package.json / package-lock.json、vitest.config.ts、eslint.config.js + eslint-suppressions.json、tsconfig.json、src/test/、4 处 react-router 导入、README 事实行 | 复核口径与全部记录见下文「阶段 1 记录」；版本决定见 AUDIT.md §5.0 的 5.14、5.15 |
| 2 | 逐主题修改（先改 18 路由样板） | **进行中**（分支 `phase-2-topics`）：前置 commit（壳修复，2.0）、**18 路由样板**（2.1，风格已确认，AUDIT.md §5.0 的 5.16）、**2-A Vue 响应式措辞批量修正**（2.2，措辞见「统一措辞」）、**2-B 的 07 表单**（2.3）、**19 异步提交**（2.4）、**11 API 请求状态**（2.5）、**30 TanStack Query**（2.6）、**14 自定义 Hook**（2.7）、**16 全局状态**（2.8）、**20 错误边界**（2.9）、**26 过期闭包**（2.10）已完成，**2-B 全部完成**；2-C 的 **01 组件与 JSX**（2.11）、**02 Props**（2.12）、**03 State**（2.13）、**04 事件处理**（2.14）、**05 条件渲染**（2.15）已完成；2026-09-19 按用户要求定了「使用频率」写法，**05 按它改写成样板并经用户确认**（2.16）。**下一步：按 `docs/upgrade/RETROFIT-01-04-PROMPT.md` 把 01–04 改成使用频率写法**（每题一个 commit，做完 04 停下来问用户下一批）；06 的半成品仍在 `git stash` 里（说明含 wip06），之后怎么排由用户定，接续方法见 CONTINUE-PROMPT §3.3 | 每题一个 commit | 样板已确认，其余题不再逐题停 |
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

### 2.9 20 错误边界（2026-09-18）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 20 大纲 + §3.6 主线判定（手写 class 边界主线；react-error-boundary 并排 —— 阶段 1 已安装 6.1.3，所以做成可运行区块）；问题表 = R2-20-1～8 + AUDIT.md §3 的 20 各行（:585-:598）。核实：1 个只读研究代理（官方文档 15 组、136 条原文逐字校验，其中 7 组有修正）+ 主会话读 react-dom / react-error-boundary / @vue/runtime-core 源码 + 两份一次性探针测试 + 1 个反驳式复核代理（提出 10 条：错 5、措辞 5，已全部处理，见下）。

**结构（React 8 个文件，Vue 10 个文件）**
- `react/Example.tsx`：十段文件头 + 四个区块的入口。
- `react/ErrorBoundary.tsx`【主线】：手写 class 边界，`fallback({ error, reset })` / `onError` / `onReset` / `resetKeys` 做成 props（照 react-error-boundary 的能力设计）；`hasError` 标记（throw null 也能处理）；resetKeys 跳过「刚捕获错误的那一次更新」。
- `react/BoundaryBasicsDemo.tsx`【区块一】：易碎计数器（隔离、重试后全新实例）+ 商品详情 resetKeys（可关掉 resetKeys 对比）+ onError / onReset 日志。
- `react/CatchScopeDemo.tsx`【区块二】：8 个按钮 —— 接得住：渲染中 throw、useTransition 的 startTransition（async）、lazy 加载失败；接不住：事件处理函数、async 处理函数、setTimeout、顶层 startTransition（Effect 里监听 window 的 error / unhandledrejection 写日志）；try / catch 转 state。
- `react/LibraryBoundaryDemo.tsx`【区块三 · 并排】：react-error-boundary 的 FallbackComponent、onError、onReset（reason）、resetKeys、`useErrorBoundary().showBoundary` 接 await 之后的请求错误。
- `react/RootOptionsDemo.tsx`【区块四】：在卡片里 createRoot 一棵小根，传 onCaughtError / onUncaughtError；没有边界时整棵小根被移除、可以重建；生产分层清单。
- `react/errorLog.ts`：演示日志（外部 store + useSyncExternalStore）。
- Vue 侧：`ErrorBoundary.vue`（onErrorCaptured + v-if 切 fallback 插槽 + resetKeys）、`BuggyCounter.vue`（模板里调函数抛错）、`ProductDetail.vue`、`BoundaryBasicsDemo.vue`、`CaptureOnlyParent.vue`（只注册钩子不换界面的实验）、`CatchTriggers.vue` + `CatchScopeDemo.vue`（渲染 / 事件 / async / watch 接得住，setTimeout / 原生 addEventListener 接不住）、`AppErrorHandlerDemo.vue`（小 Vue 应用演示自下而上传播、return false、app.config.errorHandler）、`Example.vue`（精简头 + 「区块三在 Vue 里」说明卡）。
- 壳：注册表 20 题 summary；`src/shell/ShellErrorBoundary.tsx` 只改了一句注释（「React 中唯一仍然需要 class 组件的场景」→「错误边界目前只能用 class 组件写」，与课件结论一致，不改代码）。README 20 题目录行、说明段、面试题行。
- 测试：React 15 条、Vue 12 条（全仓库 19 个文件 216 条）。

**问题表处理**：R2-20-1（严重）「异步一律接不住」改为 Component 页原文的四类 + useTransition 例外，并补 lazy / use(promise) / useActionState 进边界、顶层 startTransition 进不了（区块二 + 测试，32 / 31 待新增）；R2-20-2 react-error-boundary 可运行并排（区块三，官方定位原文、全部 props、useErrorBoundary、withErrorBoundary、6.0.0 只发 ESM / 6.0.1 起 CommonJS 回来、6.1 unknown）；R2-20-3 根边界：区块四演示「没有边界整棵界面被移除」，七写分层；R2-20-4 createRoot 三个回调可运行（区块四 + 测试），「errorHandler 与 createRoot 选项不是同层概念」改为「都是应用级上报入口」，React 18 重复抛错 / 重复日志进八；R2-20-5 路由级 ErrorBoundary / useRouteError / RouterProvider onError【较新·7.11 起】（18 题）；R2-20-6「唯一 class 场景」删掉，改引 Component 页 getSnapshotBeforeUpdate 原文，模板残留清零；R2-20-7 交叉引用补 06 / 10 / 14 / 18 / 19 / 31 / 32 / 33 / 34；R2-20-8 Vue async 处理函数被拒绝进 onErrorCaptured（测试）、Suspense 错误处理原文。第一轮：:586 各条已落地；:594「官方多年表示未来可能提供」改为 Component 页现行原文；:598「Vue 捕获后不会自动卸载崩溃子树」已核实并细化（见新发现 6）。

**待核实项结论**：
- P-20-1（react-error-boundary 签名与版本）：按已安装 6.1.3 的 `dist/react-error-boundary.d.ts` 写（showBoundary / resetBoundary / withErrorBoundary / onReset details / FallbackProps.error 为 unknown）；最新 6.1.5，6.1.4 修了 throw null 时重置不生效。
- P-20-2（error-boundaries 规则）：在 recommended 预设里（插件 7.1.1 `preset: LintRulePreset.Recommended`）；只拦「组件体的 try 里构造 JSX」，事件处理函数里的 try / catch 不受影响（本题 lint 通过）。
- **P-20-3（开发环境是否打印被接住的错误）：已核实。** react-dom 19.2.8 `defaultOnCaughtError` 用 console.error 打印（:9370-9416，测试断言），传了 onCaughtError 就不再打印（测试）。另：Component 页 componentDidCatch 的 Caveats「In development, the errors will bubble up to window」在 19.2.8 不成立（被接住的错误不触发 window 的 error 事件，测试覆盖），课件在八里注明是旧行为。
- P-20-4（getDerivedStateFromError 参数类型）：写成 `error: unknown`，vue-tsc 通过，关闭。
- P-20-5（引入版本）：componentDidCatch 随 React 16 发布（博客 2017-07-26 为 16 beta，16.0 于 2017-09-26 发布）；getDerivedStateFromError 16.6.0（2018-10-23）。「deprecated in favor of getDerivedStateFromError」出自现行 Component 页，16.6 博客本身没这么说。

**本次新发现（审计没写到）**：
1. 只有 useTransition 返回的 startTransition 里的错误进边界；从 react 直接导入的顶层 startTransition 进不了（useTransition 页 Troubleshooting 原文 + 测试 + Chrome 实测）。
2. React 19.2.8 的事件处理函数错误：`executeDispatch` 里 try / catch 后交给 reportError，同一次事件里其他监听照常执行（测试：子元素 onClick 抛错，父元素 onClick 仍被调用）。
3. 在 act 里，没接住的渲染错误被推进 `ReactSharedInternals.thrownErrors` 由 act 重新抛出，onUncaughtError 不会被调用（`logUncaughtError`，:9420-9433）；要测 onUncaughtError 得临时关掉 `IS_REACT_ACT_ENVIRONMENT` 用原生 click。
4. lazy 会缓存被拒绝的 Promise（lazy 页原文 + react 源码 `payload._status = 2`），重置边界不会重新下载，重试要重新调用 lazy()。
5. react-error-boundary 的 showBoundary 实现是「setState 记下错误、下一次渲染时在 Hook 里 throw」（dist/react-error-boundary.js:84-92），所以对只接渲染错误的边界也有效。
6. Vue 捕获错误后不替你换界面：渲染函数里抛错 → 那个组件渲染成空注释节点（runtime-core.cjs.js:4695-4698）；computed 在更新前的脏检查里抛错 → info 是 'component update'，渲染函数没执行，界面停在上一次（两种都有测试，实例和 state 都还在）。原课件说「模板读这个 computed 时抛错属于渲染期间」不准确（实际在渲染前的脏检查里抛出）；本题的 BuggyCounter.vue 改成模板里调函数。另外 Vue 只接住「交回给它的」被拒绝的 Promise（callWithAsyncErrorHandling 只处理返回值），在 onMounted 里调 async 函数却不 return 的拒绝它看不到。
7. Vue 的 onUnmounted 里模板 ref 已经是 null，移除原生监听要放 onBeforeUnmount（探针实测）。
8. `<RouterProvider onError>` 在 react-router 7.11.0 转正（CHANGELOG「Stabilize <HydratedRouter onError>/<RouterProvider onError>」）。
9. 测试环境差异：jsdom 29 没有 window.reportError，React 退回到自己派发 window 的 error 事件；Vitest 的 jsdom 环境里 setTimeout 是 Node 的定时器，回调里的异常会变成进程级未捕获异常（让测试失败），所以相关测试用 fake timers 让它同步抛出再断言；async 处理函数的拒绝在 Node 里是 `unhandledRejection` 进程事件。
10. 浏览器里 React、Vue 两侧都监听 window 的 error 事件，会看到对方的错误，两侧日志下面各加了一句说明。

**复核代理提出、已改的 10 条（要点）**：react-error-boundary「6.0 起只发 ESM、peer 18/19」只对 6.0.0 成立 —— 6.0.1 起又带回 CommonJS（已安装的 6.1.3 同时有 .cjs / .js），React 18/19 的 peer 也是 6.0.1 起（npm view 逐版本）；「404 不该用边界」与 React Router 文档相反（「There are exceptions to the rule in #2, especially 404s」，loader 里 throw data(..., { status: 404 }) 交给路由级边界），文件头与区块四清单都已改；练习 2 要先把外层边界换成库的 ErrorBoundary（否则 useErrorBoundary 渲染时就报 ErrorBoundaryContext not found）；练习 1 的次数差一；19.3 发布说明里和错误有关的不止一条；「Vue 能接 async 函数的错误」收窄为「交回给 Vue 的被拒绝的 Promise」；补了 useTransition 里同步 throw 的测试；Vue 对照段补上成熟度标签（throwUnhandledErrorInProduction【较新·3.5 起】、Suspense【尝鲜·实验性】）。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 216 条测试 / build）；20 的 27 条测试无 act 警告、无 stderr。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json）：两侧区块一崩溃 / 重试（计数归零）/ resetKeys 自动重置；React 区块二 4～7 没有兜底、日志分别记下 window error / unhandledrejection，1～3 进边界；Vue 区块二 1～4 进边界（info：render function / native event handler ×2 / watcher callback），5、6 进 window error；区块三 onError → 重试（imperative-api）→ 换订单（keys）→ 关掉失败开关后加载成功；区块四 onCaughtError（边界名 ErrorBoundary）/ onUncaughtError 后小根变空、重建恢复；Vue 区块四 ①②③ 与 return false 只剩 ①；页面宽 1024 无溢出；源码查看器 React 8 个、Vue 10 个文件。控制台只有 React 开发环境默认 onCaughtError 对被接住错误的 console.error（课件七已说明），没有其它 error / warn。

### 2.10 26 过期闭包（2026-09-18，2-B 最后一题）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 26 大纲 + §3.7 主线判定（修法优先级 函数式更新 → 写对依赖 → useEffectEvent【较新】主线 → latest ref 并排）；问题表 = R2-26-1～11 + AUDIT.md §3 的 26 各行（:715-:722，其中 :717「被缓存的 onClick 一样过期」按附录 C 以第一轮为准）。核实：本会话没开 Ultracode，用 Agent 工具起了 2 个只读研究代理（官方文档 68 条 / 296 段引文逐字校验，其中 8 条修正、5 条查无；源码 / npm / lint 实测 32 条，其中 7 条修正、1 条查无）+ 主会话两份一次性探针测试 + 1 个反驳式复核代理（提出 28 条：错 4、无出处 1、措辞 23，已全部处理，见下）。

**结构（React 8 个文件，Vue 8 个文件）**
- `react/Example.tsx`：十段文件头 + 四个区块的入口。
- `react/demoKit.ts`：`createDemoLog`（组件外日志 store，Effect 体里写日志不碰 set-state-in-effect）+ `useTimeouts`（卸载时清定时器）+ 两个时间常量；`react/LogPanel.tsx`：日志面板（useSyncExternalStore）。拆成 .ts + .tsx 两个文件是因为 @vitejs/plugin-react README「For React refresh to work correctly, your file should only export React components.」（组件文件再导出常量 / 工具函数，热更新会退化成整页刷新）。
- `react/DelayedSaveDemo.tsx`【区块一】：事件处理函数里的 setTimeout（没有 Effect 参与）—— 读快照 vs latest ref、`setCount(count + 1)` 倒退 vs 函数式更新；写明 useEffectEvent 在这里用不了（只能在 Effect 里调用），这是 19.2 之后仍需要 latest ref 的场景；官方挑战题「Read the latest state」的事件处理函数同步写法作对照。
- `react/ListenerDemo.tsx`【区块二】：手动 addEventListener 五个输入框 —— ❌ 依赖 []、② 写对依赖（每次 +1 重注册，日志显示第 n 次注册）、③ useEffectEvent（只注册一次）、JSX onKeyDown、❌ 被 `useCallback(fn, [])` 缓存的 JSX 处理函数（第一轮 :717）。
- `react/PollingDemo.tsx`【区块三】：轮询四种写法 ❌ [] / ② [status] / ③ useEffectEvent（主线）/ ④ latest ref（并排），写法下拉框切换、`key={mode}` 换实例；alive 标志丢弃迟到响应；演示简化 → TanStack Query refetchInterval（30 题）。
- `react/DependencyLabs.tsx`【区块四】：4a 交互逻辑搬回事件处理函数（官方 submit + theme 例子）、4b 每次渲染新建的对象当依赖（草稿框打字就断开重连）vs 只依赖原始值、4c `ref.current` 写进依赖数组没用。
- Vue 侧：`DelayedSaveDemo.vue`（现读 / 手动快照 + 解构 reactive vs toRefs）+ `PropsDestructureChild.vue`（3.5 解构 props 在回调里读到最新值）、`ListenerDemo.vue`（onMounted 注册一次 + onBeforeUnmount 移除 + useTemplateRef）、`PollingDemo.vue`（一个 watch + onWatcherCleanup，现读 / 启动时拷一份 / watch 重启三种模式）、`WatchSourceDemo.vue`（watchEffect vs watch vs 事件版；非响应式 source）、`LogList.vue`、`Example.vue`（精简头）。旧的 `vue/Example.vue` 单文件拆开。
- 壳：注册表 26 题 summary；README 26 题目录行、说明段、面试题行。
- 测试：React 22 条、Vue 15 条（全仓库 21 个文件 253 条）。

**问题表处理**：R2-26-1 latest ref 标「社区惯用法 · 并排」，写明适用边界（React 18 / 19.0 / 19.1、Effect 之外的延迟回调、19.2.x 的 memo / forwardRef 组件），「react.dev 无推荐语」改正（见待核实 P-26-1）；R2-26-2 useEffectEvent【较新·19.2.0 起】、参考页 Caveats 四条原文（第 1 条是「顶层调用」，「not reactive、不写进依赖」出自 learn 页与 useEffect 页）、lint 从 6.1.0 起识别、TS 签名、自定义 Hook 包一层（14 题）、与 useCallback 的分工；R2-26-3 修法体系：搬回事件（4a）、拆 Effect、对象 / 函数移进 Effect / 原始值（4b）+ 五「exhaustive-deps 报警的处理顺序」；R2-26-4 `ref.current` 作依赖（4c + 测试 + lint 文案）；R2-26-5 Vue 官方 FAQ 原文、解构 reactive / 3.4 前解构 props、watch vs watchEffect（Vue 区块四）；R2-26-6 绝对化措辞清零（「唯一会过期」「没有任何对应物」「任何时刻读 .current 都是最新」都已改）；R2-26-7 模板残留 6 处清零；R2-26-8 交叉引用逐条核对（10 题场景二修法三仍在，10 题改写时要保留或同步改 26 的引用）；R2-26-9 轮询演示简化 → refetchInterval（UseQueryOptions 原文）；R2-26-10 disable 注释标【旧写法】并引 19.2 博客原文；R2-26-11 全文成熟度标签。第一轮：:715 按 §3.7 覆盖；:716 第 3 条 caveat 与「其他 Hook」已补；:717 被缓存的 JSX 处理函数（区块二 + 测试）；:718 / :719 已改；:720「根本没有 effect」已改；:721 Compiler 一句已加（useCallback 页原文）；:722 Vue 改用 onBeforeUnmount 移除（并说明 onUnmounted 时模板 ref 已是 null）。

**待核实项结论**：
- **P-26-1（latest ref 有没有官方推荐语）：结论改正。** react.dev 没有给这个模式命名（全站无 useLatest / latestRef），但 learn/referencing-values-with-refs 的挑战题「Read the latest state」答案就是「you can keep the latest input text in a ref」，ref 在事件处理函数里与 setText 一起更新，题目称之为 occasional cases。课件照此写，标签仍按 §3.7 用「社区惯用法」（官方只在挑战题里用过、没有作为通用模式推荐），主线判定不变。
- P-26-2（版本历史）：RFC「useEvent」（reactjs/rfcs#220，2022-05-04 提出，承诺 always stable function identity，2022-09-27 搁置）→ 实验通道 experimental_useEvent（2022-11 起）→ experimental_useEffectEvent（2024-04 至 2025-09）→ 19.2.0（2025-10-01）稳定导出。react 18.3.1 / 19.0.0 / 19.1.0 / 19.1.9 的稳定版都没有导出（npm pack 核对）。eslint-plugin-react-hooks 5.x 与误发的 6.0.0 里 isUseEffectEventIdentifier 直接 return false，6.1.0（与 React 19.2 同日）起识别。
- P-26-3（refetchInterval 的文档 URL）：TanStack 2026-09-02 把 React 参考文档改为 TypeDoc 生成，旧的 reference/useQuery 已 404；选项说明在 docs/framework/react/reference/interfaces/UseQueryOptions.md，另有 guides/polling.md。两个选项默认都是 false。
- **P-26-4（「提交阶段把最新回调换进槽位」准不准）：已核实并细化。** react-dom 19.2.8：每次渲染返回新的包装函数（共用一个 ref，调用 ref.impl），更新渲染时新回调排进 updateQueue.events，在 commitBeforeMutationEffects（:13874-13889）写入 —— 早于 insertion / layout / passive 所有 Effect；首次挂载在渲染期直接写入；渲染被丢弃则不写入。测试证明 layout effect 里调用 Effect Event 已是新值。
- **P-26-5（latest ref 的窗口期）：已核实。** 用 useEffect 同步时，本组件的 useLayoutEffect、子组件的 Effect（子先于父执行）读到的是旧值（测试覆盖）；离散事件里 flushSync 之后被动 Effect 已同步执行完，读到新值（测试覆盖）。课件去掉「任何时刻读 .current 都是最新的」。
- P-26-6（在事件处理函数里调用 Effect Event）：lint 报 rules-of-hooks error「… can only be called from Effects and Effect Events in the same component.」，传给子组件再多一句「It cannot be assigned to a variable or passed down.」；运行时只拦渲染期调用，在 onClick 里调用照常执行（探针实测）。

**本次新发现（审计没写到）**：
1. **React 19.2.x 的 useEffectEvent 在 memo()（不带比较函数）/ forwardRef 组件里一直调用第一次渲染的回调**：commitBeforeMutationEffects 只处理 tag 0，tag 11 / 15 直接 break（:13890-13892）。19.3.0 修复（CHANGELOG #34831，issue #34818 标题「Bug: Stale closures with useEffectEvent」，报告版本 19.2）；19.2.1～19.2.8 没有回补。测试钉住这个行为（升级 19.3 后这条测试会失败，届时改断言并改课件）。本仓库其它用 useEffectEvent 的地方（14 题 useInterval / IntervalDemo、bridge/VueMount）都是普通函数组件，不受影响；14 题注释可在 2-C 或阶段 4 补一句。
2. Effect Event 身份每次渲染都变，但旧的包装函数调用时也转发到最新回调（共用一个 ref，测试覆盖）。
3. JSX 事件不过期的机制：react-dom 派发事件时从 DOM 节点上读最近一次提交的 props（getListener :3274-3279，commitUpdate 在提交时写入 :22167-22170）。Vue 的模板事件绑在元素上的是 invoker：处理函数换了时 patchEvent 只换 invoker.value、不重新注册（runtime-dom.cjs.js:641-659）；而编译器通常把模板处理函数缓存起来（本课 @keydown.enter 编译成缓存的 withKeys 包装，引用不变，patchEvent 根本不会被调用），缓存的函数执行时现读 .value，所以也不会过期（测试证明重渲染后 addEventListener 次数不变）。
4. Vue 文档说把解构出来的 prop 直接传给 watch 编译器会「throw a warning」，3.5.42 实测 compileScript 直接抛错（编译失败）；以实测为准，课件两个都写。
5. Vue watch 回调里的读取不被追踪，不是靠 pauseTracking：回调在 effect.run() 结束之后才调用（研究代理读 @vue/reactivity 源码）。
6. watchEffect 里写 `logRef.value.push(...)` 会把 logRef 收成依赖（读 .value 被追踪，push 本身不追踪），给它赋新数组就重跑 —— Vue 区块四改用 reactive 数组 + push / splice，另有测试证明这个坑。
7. Vue 的模板事件同样通过 addEventListener 绑在元素上（测试里数 keydown 注册要算上它），React 的 JSX 事件在根节点委托。
8. Vitest 4 内置 fake-timers 把「推进过程中新排进来的 0ms 定时器」记成 1ms 之后（`clock.duringTick ? 1 : 0`），setInterval 回调里发出的 delayMs=0 请求要再推 1ms 才回来（测试辅助函数已处理）。
9. React 19 StrictMode 下挂载时的 setup → cleanup → setup 共用同一个 ref，所以「第 n 次注册」在页面上从第 2 次开始（浏览器实测，页面已注明）。
10. exhaustive-deps 对「每次渲染新建的对象当依赖」的报错位置在对象声明那一行，不在依赖数组那一行（eslint-disable 要写在声明上方）。
11. react.dev 有三处 Pitfall 示例（lifecycle-of-reactive-effects、removing-effect-dependencies、useEffect 参考页）把注释写成了 `eslint-ignore-next-line`，ESLint 没有这个指令，照抄不会生效；课件提醒不要照抄。
12. exhaustive-deps 的依赖比较发生在渲染阶段（updateEffectImpl 里 areHookInputsEqual，:8641-8655），提交阶段只执行已打标记的 Effect；Effect Event 的换入早于「这次提交」里的所有 Effect（commitRoot 开头会先冲刷上一次提交遗留的被动 Effect）。
13. npm 上周下载（2026-09-18）：React 18 / 19.0 / 19.1 合计 30.45%（18.x 24.71%），连同 17 及更早，没有 useEffectEvent 的共 34.18%；19.2.x 56.72%，19.3.x 8.79%。

**复核代理提出、已改的 28 条（要点）**：引文漏了 will（「we will lose the reactivity connection」）；eslint-ignore-next-line 是三处 Pitfall 不是一处、「笔误」改为「ESLint 没有这个指令」；依赖比较在渲染阶段不在提交后；「Vue 任何函数里读 .value 都不当依赖」改为区分 watch 回调 / 事件 / 定时器（不登记）与 watchEffect / computed / 模板（登记）；「Vue 没有缓存处理函数这一层」与 17 题矛盾，改为 Vue 编译器也缓存、但缓存的函数现读 .value；五「exhaustive-deps 处理顺序」把「老实写依赖」放回 useEffectEvent 之前（与优先级和大纲一致）；取消补上「queryFn 读了 signal 才中止」的前提（30 题措辞表）；refetchInterval 的「30 题」引用改为「基础见 30 题、轮询见官方 guides/polling」（30 题只提了默认 false）；日志用 index 当 key 改为按理由说明（不是 06 题允许的例外）；【较新】补起始版本；exhaustive-deps 报的是 warn 不是 error；「exhaustive-deps 报的就是过期闭包」限定为「缺少依赖」时；npm 占比拆成 30.45% / 34.18% 并注明含 CI；「社区库常用 useLayoutEffect / useLatest 社区常见」这类频度说法删掉；补 7.0.1 禁止内联 useEffectEvent 当 JSX prop、六补「以为 useEffectEvent 返回稳定函数」；补两条测试（onClick 里调用不抛错、useInsertionEffect 里已是新值），「渲染被丢弃不写入」改标源码依据；flushSync 那条测试在二-8 补上对应说明；停止轮询的日志文案改成「卸载 / watcher 清理时」；onCleanup 不是旧写法（3.5 仍可用，await 之后注册清理要用它）；Vue 源码依据补文件与行号；PropsDestructureChild 区分文档说法（warning）与 3.5.42 实测（抛错）。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 251 条测试 / build）；26 的 35 条测试无 act 警告、无 stderr。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json）：React 区块一（坏的保存读到 0、好的读到 3；延迟 +1 把 6 打回 4，函数式更新 4 → 7）、区块二（StrictMode 下注册从第 2 次开始；两次 +1 后写对依赖是第 4 次注册；依赖 [] 与 useCallback [] 读到 0，其余读到 2）、区块三（四种写法日志与测试一致，停止后 2.5 秒无新日志）、区块四（Effect 版 3 次 POST、事件版 1 次；对象依赖打字就断开重连；ref.current 改两次不跑、重渲染后补跑读到 2）；Vue 区块一（现读 3、快照 0、子组件 prop 3、数字打回 4、likes 三种写法 2 / 0 / 2）、区块二（注册次数 1，两个输入框读到 2）、区块三（现读 / 启动时拷一份 / watch 重启与测试一致，停止后无新日志）、区块四（watchEffect 3 次、watch 与事件版各 1 次，清空日志不会重跑；非响应式 source 不触发）；开始轮询后切到 27 → 25 → 回 26 无报错；源码查看器 React 7 个、Vue 8 个文件；899px 宽无横向溢出。捕获到的 console.error / console.warn 为 0（复核修正只改了注释、日志文案与测试，没有影响交互）。

### 2.11 01 组件与 JSX（2026-09-18，2-C 第一题）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 01 大纲；问题表 = R2-01-1～11 + AUDIT.md §3 的 01 各行（:184 Vue 也有渲染函数 / JSX、:185 新 JSX 转换的版本、:186 avatarStyle 类型）。核实：1 个只读研究代理查官方文档（23 项、240 段引文逐字校验：19 项确认、4 项修正）+ 主会话一次性探针测试（小写标签、嵌套定义、数组返回、style 补 px、各种 DOM 属性报错）+ esbuild / @vue/compiler-dom 实际编译 + lint 实测 + 1 个反驳式复核代理（提出 32 条：错 8、措辞 24，已全部处理，见下）。

**结构（React 6 个文件，Vue 5 个文件）**
- `react/Example.tsx`：十段文件头 + 四个区块的入口。
- `react/ProfileCards.tsx`【区块一】：`UserCard` 组件用两次（两个独立实例，各自的「关注」按钮互不影响，测试覆盖）；VIP 徽章是存在变量里的 JSX、通过 `badge` 参数传进去；className / style 对象（标「演示简化」）/ 花括号 / Fragment / JSX 注释。
- `react/JsxRulesDemo.tsx`【区块二】：同一段 JSX 在 automatic（`jsx()` / `jsxs()`）与 classic（`React.createElement`【旧写法】）下的编译结果（esbuild 0.28.2 实测）；style 数字补 px 的实测按钮（读出 DOM 上的 style 属性）；列表里的 `<Fragment key>`。
- `react/PurityDemo.tsx`【区块三】：react.dev keeping-components-pure 的茶杯例子 —— 渲染时改外部变量（StrictMode 下 #2、#4、#6，重渲染 / 切题回来接着涨）vs 纯的 `Cup`（局部突变）。
- `react/NestedDefinitionDemo.tsx`【区块四】：在组件里定义组件 → 父组件重渲染后输入被清空；顶层定义的保留。
- Vue 侧：`ProfileCards.vue`（多根组件 + 具名插槽 #badge）、`UserCard.vue`（:class / :style 对象与数组语法、3.5 响应式 props 解构、CSSProperties 类型、「关注」按钮）、`TemplateRulesDemo.vue`（@vue/compiler-sfc 3.5.42 compileTemplate 的实际输出：补丁标记、静态提升 _hoisted_1、静态节点缓存 -1 CACHED；:style 数字不补单位的实测按钮、`<template v-for>` + key）、`Example.vue`（精简头 + 「区块三、四在 Vue 里」说明卡）。
- 壳：注册表 01 题 summary；README 01 题目录行、说明段、面试题行。
- 测试：React 17 条、Vue 5 条。

**问题表处理**：R2-01-1 大写规则（原文 + 两条开发期报错原文 + 测试）；R2-01-2 嵌套定义（区块四 + preserving-and-resetting-state 原文 + static-components 实测文案 + 测试）；R2-01-3 纯函数（区块三 + 原文三条好处 + globals 实测文案 + 测试）；R2-01-4 StrictMode（参考页四项开发期行为原文 + 测试）；R2-01-5 渲染三步与独立实例（render-and-commit、state-a-components-memory 原文）；R2-01-6 八整段（classic runtime、新转换 2020 年「is not required」→ 19「now required」、ReactDOM.render / findDOMNode / 字符串 ref 移除、defaultProps、React.JSX）；R2-01-7 dangerouslySetInnerHTML ↔ v-html（Vue 文档原文，主责 35 待新增）；R2-01-8 JSX 细节（闭合、aria / data、多行括号、Fragment key、default / named export、ReactNode）；R2-01-9 九（Compiler 1.0【较新】、19.3 Fragment Refs / Trusted Types / hydration 双调 Effect【尝鲜】）；R2-01-10 行内 style 标「演示简化」+ common 页原文；R2-01-11 模板残留清零，「React 没有任何模板语法」「一次只能返回单个根节点」「Vue 模板里没有等价写法」改掉（Vue 也有 h() / JSX，返回带 key 的数组也合法）。第一轮 :184 / :185 / :186 已落实。

**待核实项结论**：
- P-01-1（style 不作默认样式方案的原文）：common 组件页「React does not prescribe how you add CSS files.」「We recommend only using the style attribute when your styles depend on JavaScript variables.」
- P-01-2（返回带 key 的数组）：合法、无警告（测试覆盖）；课件写「日常写 Fragment 更清楚」。
- P-01-3（`<Fragment ref>` 的类型）：19.3 博客「both of these are now stable in React 19.3」；本仓库锁 19.2.8，没有 FragmentInstance，只在九作【尝鲜】介绍，升级 19.3 后再核类型。
- P-01-4（StrictMode 在 hydration 时双调 Effect）：StrictMode 参考页没有提；出处是 19.3 CHANGELOG「Double invoke Effects in Strict Mode during hydration, matching client-rendered roots」（#35961）。
- P-01-5（小写标签的报错原文）：「<vipBadge /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.」「The tag <vipBadge> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.」（react-dom 19.2.8，测试覆盖；后一条每个标签名只报一次）。

**本次新发现（审计没写到）**：
1. 新 JSX 转换的官方说法前后相反：2020 年发布博客「This upgrade will not change the JSX syntax and is not required.」；React 19 升级指南标题「New JSX Transform is now required」，不启用时控制台报「Your app (or one of its dependencies) is using an outdated JSX transform.」
2. StrictMode 参考页列的开发期行为是四项（多了「检查已废弃的 API」），原句「All of these checks are development-only and do not impact the production build.」
3. @vitejs/plugin-react README「For React refresh to work correctly, your file should only export React components.」—— 本课和 26 题都按这个拆文件。
4. style 的 0 值不补 px（源码 `0 === value` 分支，浏览器规范化成 0px）；aspectRatio、lineClamp、scale 等也在 unitlessNumbers 里。
5. Vue 的 :style 给 width 这类属性传数字，Chrome 与 jsdom 都直接丢掉（浏览器实测 + 测试），无单位属性照常生效。
6. Vue 模板编译结果带补丁标记（`1 /* TEXT */`）；SFC 实际编译（compileTemplate）还会把静态 props 提升成常量、把静态节点缓存（`-1 /* CACHED */`）—— `compile()` 默认选项看不到这两项。JSX 编译结果没有这些信息（课件四-2）。
9. 本项目开发环境（vite dev、Vitest）的 JSX 编译成 react/jsx-dev-runtime 的 `jsxDEV()`（vite 的 esbuild 配置 `jsxDev: !isProduction`，config.js:35692），生产构建才是 `jsx()` / `jsxs()`。
10. `<ui.button />` 这类带点的成员表达式不看首字母，一律编译成变量引用；lint 对渲染期突变：重新赋值外部变量报 globals、改外部对象属性报 immutability、`arr.push()` 拦不住（复核实测）。
11. Vue 在渲染函数 / JSX 里现场创建组件对象，每次更新同样卸载重建（isSameVNodeType 比较 type 与 key，复核实测）；只有 `<script setup>` 里定义的才只建一次。
7. 「State is isolated and private」出自 state-a-components-memory，「Vue templates are compiled into render functions」出自 rendering-mechanism（审计里写的出处不对）。
8. Vue 文档原文是「Vue JSX transform is different from React's JSX transform, so you can't use React's JSX transform in Vue applications」。

**复核代理提出、已改的 32 条（要点）**：测试文件的类型错误（`errorTexts` 推成 any，会让 check 失败 —— 提交 26 时 01 被暂存，check 没覆盖到，已补返回类型）；「17 题细讲 Compiler」「多根组件见 02 题」两处引用的内容还不存在，改为「改写时补」并记进遗留；「其余组件都用 named export」有反例（20 题 ErrorBoundary）；三、Vue 对照各条与 Vue 侧补齐成熟度标签，`:id` 改【主流·3.4 起】；二-2 补「开发环境是 jsxDEV」；lint 覆盖面改准确（globals / immutability / push 拦不住）；Vue「不会出现区块四的问题」限定为 setup 里定义；React 的重渲染范围按统一措辞改（从该组件起连带子组件，不是整棵树）；Vue 编译输出换成 compiler-sfc 的实际产物并讲静态缓存；patch flags 与 tree flattening 分开说；19.3 那句出处改为发布博客的 Changelog；参考列表补齐 7 处；「两张卡各自独立的 state」没有演示 → 加「关注」按钮与两侧测试；成员表达式、import 顺序、三栏、组件名、Fragment 包了三个节点、「一定」、四-4 / 四-5 的前提、「一个文件一个组件」按官方原文改、jsdom 与浏览器的说法、练习 2 换成 flexShrink（jsdom 把 aspect-ratio 序列化成 1.5 / 1）、ReactNode 的 28 题引用、StrictMode 的双调用范围（useState / set / useMemo / useReducer 的函数）、「very slow」、33 题（待新增）、FunctionComponent 签名、`<template v-if>`、v-once / v-memo、厂商前缀、多根 $attrs.class、错误边界「或用 react-error-boundary」。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 275 条测试 / build）；01 的 22 条测试无 act 警告、无 stderr（故意触发的开发期报错都 spy 并断言）。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json）：不纯茶杯首次 #2、#4、#6，点重渲染后 #8、#10、#12，切到 02 / 26 再回来接着涨；React 读出的 style 为「width: 48px; border-width: 2px; padding: 0px; line-height: 1.5; …」，Vue 侧没有 width / border-width（Chrome 实测）；区块四父组件重渲染后组件里定义的输入框清空、顶层定义的保留；两侧 dl 列表正常；源码查看器 React 6 个、Vue 5 个文件；页面无横向溢出；复核后补的「关注」按钮两侧各点第一张卡，只有那张变成「已关注」。捕获到的 console.error / console.warn 为 0。

### 2.12 02 Props（2026-09-18，2-C 第二题）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 02 大纲；问题表 = R2-02-1～12 + AUDIT.md §3 的 02 各行（:202 开发构建冻结 props、:203 「SFC 一文件一组件」、:204 单根透传前提、:205 defaultProps / propTypes 的版本、:206 UiButton 按 React 19 ref-as-prop 重写 —— 附录 C 列为「以第一轮为准」、:207 绝对化）。核实：2 个只读研究代理（官方文档 25 项、114 段引文脚本逐字校验全部通过；源码 / npm 15 项，1 项修正：createElement 仍合并函数组件的 defaultProps）+ 主会话一次性探针（Vitest 开发构建 + node / jsdom 生产构建两侧实测）+ 1 个反驳式复核代理（提出 22 条：错 5、措辞 10、建议 7，已全部处理，见下）。

**结构（React 7 个文件，Vue 13 个文件）**
- `react/Example.tsx`：十段文件头 + 四个区块的入口。
- `react/OrderCards.tsx`【区块一】：三张订单卡（interface + 参数解构默认值）；默认值实验表（没传 / `undefined` / `null` / 空串 / 无值写法 `emphasis`）。
- `react/ReadonlyPropsDemo.tsx`【区块二】：`props.amount = 0` 在开发构建抛 TypeError（界面显示错误原文）、`onAmountChange(0)` 请父组件改、「稍后读取」演示快照（`delayMs` prop，页面 1500ms）。
- `react/MirrorPropsDemo.tsx`【区块三】：`useState(price)` 镜像 vs 直接读 / 渲染时计算；`initialPrice` + 换 key 重开草稿。
- `react/UiButton.tsx` + `react/UiButtonDemo.tsx`【区块四】：`ComponentPropsWithRef<'button'>` + `{ variant, size, className, style, ref, children, ...rest }`；className / style 合并、`type="button"` 默认值写在 rest 前、ref 作为 prop（父组件 focus 删除按钮）。
- Vue 侧：`OrderCards.vue` / `OrderCard.vue`（3.5 响应式 props 解构）/ `NoteText.vue`（布尔转型）、`ReadonlyPropsDemo.vue` / `AmountEditor.vue`（改 props 只警告、emit、定时器读到最新值）、`MirrorPropsDemo.vue` / `PriceViews.vue` / `PriceDraft.vue`、`UiButtonDemo.vue` / `UiButton.vue`（inheritAttrs: false + useAttrs + useTemplateRef + defineExpose）/ `LabeledInput.vue`（多根组件显式 `v-bind="$attrs"`，`:id` 写在后面由组件说了算）、`Example.vue`（精简头）。
- 壳：注册表 02 题 summary；README 02 题目录行、速查表 `interface Props` 行、说明段、面试题行、28 题段落里提到 02 的半句。
- 其他题的交叉引用：01 的「多根的情况 02 题改写时补」两处改为「见 02 题区块四」；28 react/Example.tsx:44 的 `ComponentPropsWithoutRef` 改为 `ComponentPropsWithRef + rest 透传与 ref 作为 prop`。
- 测试：React 20 条、Vue 13 条。

**问题表处理**：R2-02-1 讲反的「React 不警告」→ 开发构建冻结 props + TypeError 原文 + 生产构建三步行为（测试 + node 实测）；R2-02-2 Vue 主线改成 3.5 响应式 props 解构，withDefaults 进旧写法；R2-02-3 默认值边界（null / 0 / 空串，两侧测试）；R2-02-4 镜像 props（区块三，两侧测试）；R2-02-5 快照（区块二「稍后读取」，React 读到旧值、Vue 读到新值，两侧测试）；R2-02-6 旧写法对照补全（defaultProps 移除且 createElement 路径仍合并、class defaultProps、propTypes、forwardRef、element.ref、string ref）；R2-02-7 ref 透传的交叉引用改成「12 / 28 题改写时补」；R2-02-8 key 不是 prop、展开要克制、无值属性 = true（原文 + 测试）；R2-02-9 @types/react 19 类型变化 + ref 回调清理（九、二-8）；R2-02-10 生产段（style 合并、Omit 冲突、默认值引用、校验放数据边界）；R2-02-11 模板残留与绝对化清零、SFC 说法改准；R2-02-12 useAttrs 与多根组件（测试）。第一轮 :202～:207 全部落实（UiButton 改为 ComponentPropsWithRef + ref 作为 prop 主线，forwardRef + WithoutRef 进旧写法）。

**待核实项结论**：
- P-02-1（无值属性 = true 的出处）：react.dev 没有这句（全仓库 224 个 md 搜过）；出处是 legacy.reactjs.org JSX In Depth「If you pass no value for a prop, it defaults to true.」（同段「we don't recommend not passing a value for a prop」）；esbuild 0.28.2 实测编译成 `{ disabled: true }`。
- P-02-2（ComponentProps 系列无 react.dev 页）：确认没有，依据用 @types/react 19.2.18 index.d.ts（:1430-1432 JSDoc「It's usually better to use ComponentPropsWithRef or ComponentPropsWithoutRef」、:1480-1484、:1530）。
- P-02-3（只删 inheritAttrs、留 v-bind="attrs"）：真实 SFC 实测 class 变成「btn-primary btn-ghost btn-ghost」，style 同名键合并，同一个 onClick 只触发一次（mergeProps 按引用去重，runtime-core.cjs.js:8012-8036）；测试覆盖。
- P-02-4（生产构建改 props）：react-jsx-runtime.production.js 不冻结；node + react-dom 19.2.8 生产构建 + jsdom 实测：赋值成功、不重渲染；子组件自己重渲染时读到改过的值（同一个 props 对象）；父组件重渲染后恢复。react.dev 原文在 createElement 页 Caveats「In development, React will freeze the returned element and its props property shallowly」。
- P-02-5（3.5 响应式 props 解构）：compiler-sfc 3.5.42 的 propsDestructure 默认开启（d.ts:119-124「@default true」），@vitejs/plugin-vue 6.0.8 把 `features.propsDestructure` 透传、本项目没配置；vue-tsc 3.3.11 下解构默认值后类型去掉了 undefined（OrderCard.vue 模板里 `discount > 0` 通过类型检查）。

**本次新发现（审计没写到）**：
1. React 19.2.8 的 `React.createElement` 仍会合并任何组件（含函数组件）的 `defaultProps`（react.development.js:1037-1039），而 `<C {...p} key="k" />`（key 写在展开后面）会被 esbuild 编译成 createElement —— 函数组件的 defaultProps 在 19 里「时灵时不灵」（测试覆盖两种写法）。
2. Vue 生产构建改 props：setup 拿到的是可写的 shallowReactive props（runtime-core.cjs.prod.js:6613），赋值成功并触发重渲染；父组件之后传的值没变时子组件不会被更新，界面一直停在改过的值（node + jsdom 实测）。开发构建是 shallowReadonly，警告「[Vue warn] Set operation on key "amount" failed: target is readonly.」（reactivity 包的 warn 没有冒号，runtime-core 的是「[Vue warn]:」）。
3. `useAttrs()` 文档说「isn't reactive … You cannot use watchers」，但 3.5.42 的 attrs 代理读时整体追踪（runtime-core.cjs.js:8365-8369 `track(target, "get", "")`）、updateProps 在 attrs 变化时统一 trigger（:5042），`watch(() => attrs.title)` 实测会触发；这套追踪来自 3.2 的修复「ensure setupContext.attrs reactivity when used in child slots」（#4161）。isReactive(attrs) 为 false。课件按文档写、测试记录现状。
4. 开发环境读 props.key 的报错整个页面只报一次（模块级 `specialPropKeyWarningShown`）；props 上的 key getter 不可枚举，生产环境 props 上没有 key。
5. 升级指南里 element.ref 的报错文案（「is no longer supported」）和 19.2.8 实际打印的（「Accessing element.ref was removed in React 19. …」）不一致，课件用实测文案。
6. `ComponentProps<'input'> & { size?: 'sm' | 'md' }` 不报错但 size 的类型变成 undefined；interface 继承直接报 TS2430 —— 所以同名冲突要 Omit（测试里用 expectTypeOf + @ts-expect-error 固定下来，并且让 BadInputProps 被使用，免得 @ts-expect-error 被「声明未使用」满足）。
7. react-hooks/immutability 不只拦 `props.x = …`，在事件处理函数里给解构出来的 prop 重新赋值也报同一段文案（复核实测；渲染期的 `amount = amount + 1` 不报）。
8. Vue 3.5 给解构出来的 prop 赋值时 compileScript 直接报错「Cannot assign to destructured props as they are readonly.」（compiler-sfc.cjs.js:25081-25098）。
9. @types/react 19.2.18 与 19.3.0 的 forwardRef 都没有 @deprecated（npm + unpkg 抽查 19.0.0 / 19.0.14 / 19.1.0 / 19.1.17 / 19.2.0 / 19.3.0）；19.3.0 相对 19.2.18 新增 FragmentInstance / Fragment ref、ViewTransition 与 addTransitionType、SubmitEvent.submitter。
10. HTML 标准现在把 `<button>` 的缺省 type 叫 Auto 状态（没有 command / commandfor 时按提交按钮处理）；MDN 原句「This is the default if the attribute is not specified for buttons associated with a <form>」。
11. Vue `generic` 属性从哪个版本开始，文档没有版本徽章、3.3 CHANGELOG 里也没有直接条目 —— 课件只标【主流】、不写版本。

**复核代理提出、已改的 22 条（要点）**：易错点「改解构出来的局部变量任何构建都不报错、没有效果」两半都不成立（lint 照样报、同次渲染的其他闭包会读到改过的值）；6 处「见 12 题」、2 处「28 题」指向的内容还不存在 → 改成「NN 题改写时补」并记进遗留；React 头 3 处、Vue 头 5 处缺成熟度标签（19.3 改标【尝鲜·19.3.0】）；四-1「React 任何版本都是参数默认值」与八段矛盾；Vue「任何时候读 props.x 都是最新值」补上「父组件重新渲染 patch 之后（下一个 tick）」；区块四说明把 className / style 也说成靠 rest 透传；className 覆盖方向只说了一半（谁写在后面谁赢）；SIZE_STYLE 被当成「稳定引用的默认值」例子不成立 → 换成 `EMPTY_ITEMS`；data-* 不在 ComponentPropsWithRef 类型里；`<button>` 缺省 type 补 MDN 依据（参考列表加 MDN）；30 秒速答把 propTypes 限定在函数组件；「只靠 TypeScript」→「TypeScript 这类静态检查（外部数据在边界用 schema 校验）」（含 README 速查表）；冻结是浅的但 jsxs 的静态 children 数组也会被冻结 → 改成「父组件传进来的对象 / 数组 prop」；19.3 类型新增漏了 addTransitionType；class defaultProps 测试补 undefined / null 两种；defaultProps 的 createElement 路径改用真实 JSX（key 在展开前 / 后）证明；LabeledInput 的 `:id` 挪到 `v-bind="$attrs"` 后面；源码行号改准（:5035-5042、:10130 → :7662、jsx-dev-runtime:193）；ref 回调清理补升级指南原文；补 ReactElement 与 ReactNode、Vue 泛型组件、Boolean 多类型顺序、key → 06 题、vue-tsc 去 undefined 的结论。另：九段「forwardRef 在 19.3 运行时也没有动作」没核实过，改成只说类型包与 19.2.8 运行时（forwardRef 测试补了无报错断言）。复核建议的「Vapor Mode 不改变 props 声明方式」没有依据，没写。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 测试 308 条 / build）；02 的 33 条测试无 act 警告、无 stderr（故意触发的开发期报错 / 警告都 spy 并断言）。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json；面板隐藏）：两侧默认值表（React emphasis 为 undefined、Vue 为 false）、❌ 按钮（React 显示 TypeError 原文、Vue 读回 100 并只有那一条预期的 readonly 警告）、「稍后读取」（Chrome 实测 React 读到 100、Vue 读到 200）、回调 / emit 改成 0、镜像 100 / 直接 120 / 含税 127 / 草稿 90 → 重开 120、onClick 计数 1（禁用按钮不加）、合并后 class「btn-primary btn-ghost」与 style「font-size: 12px; padding: 2px 8px; margin-left: 8px;」、type submit、focus 移到「删除」、LabeledInput 的 placeholder / maxlength 落在 input 上且 label for 与 id 一致；源码查看器 React 7 个、Vue 13 个文件；1280 宽无横向溢出。修复复核意见后重跑一遍，捕获到的 console.error / console.warn 为 0。

### 2.13 03 State 与 useState（2026-09-18，2-C 第三题）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 03 大纲；问题表 = R2-03-1～10 + AUDIT.md §3 的 03 各行（:223 空串 && —— 附录 C 列为「以第一轮为准」、:224 changeQuantity 位置写反、:225 引用「10、14 题」、:226 Vue 粒度、:227 四处「永远」）。核实：2 个只读研究代理（官方文档 44 小项、233 段引文脚本逐字校验全部通过：40 确认、2 修正、2 查无；源码 / npm 26 项、141 处行号回读全部通过：25 确认、1 修正）+ 主会话一次性探针（React：Object.is 跳过的两种情形、Too many re-renders、函数存进 state、StrictMode 双调、空串与 0、class setState；Vue：普通 let 变量、渲染中改数据、ref(fn)、赋同值、DOM 时机；lint：6 种反例的真实报错；TypeScript：readonly 类型的三条报错）+ React 18 升级指南原文（自动批处理、ReactDOM.render 的报错文案）+ MDN（localStorage 的 SecurityError、setItem 的 QuotaExceededError）+ 1 个反驳式复核代理（提出 23 条：错 4、措辞 11、建议 8，已全部处理，见下）。

**结构（React 12 个文件，Vue 9 个文件）**
- `react/Example.tsx`：十段文件头 + 七个区块的入口。
- `react/WhyStateDemo.tsx`【区块一】：局部变量 `let clicks`（日志 1、2、3，界面一直 0；重渲染后又从 1 开始）+ 同一个 `StateCounter` 渲染两次各管各的。
- `react/SnapshotDemo.tsx`【区块二】：set 之后立刻读、A ×2 只 +1 / B ×2 +2、设成当前值。
- `react/CartDemo.tsx`【区块三】：map / filter / 展开 + 「❌ 原地 +1」（界面不动，下次别的重渲染才「突然」变）；初始数据用惰性初始化拷一份（标「演示简化」：否则 ❌ 按钮改到模块常量）。
- `react/LazyInitDemo.tsx`【区块四】：`useState(createInitialRows(…))` vs `useState(() => createInitialRows(…))`，调用次数面板是兄弟组件（计数器在 `demoKit.ts`，通知推迟到微任务，避免「渲染 A 时更新 B」的报错）。
- `react/StateStructureDemo.tsx`【区块五】：选中项存对象 vs 存 id；两个布尔值（「发送中」「已发送」同时成立的 bug）vs 一个 status。
- `react/QuantityEditor.tsx` + `react/quantityReducer.ts`【区块六】：原 reducer 挪到 .ts 并导出（R2-03-10：之前说「可单独测试」但没导出），测试里直接调用。
- `react/TroubleshootingDemo.tsx`【区块七】：`onClick={handleClick()}`（react-error-boundary 接住 Too many re-renders）、`setFormatter(addBang)` 把函数当更新函数调用。
- `react/demoKit.ts` + `react/LogPanel.tsx`：日志 store 与面板（照 26 题的拆法）。
- Vue 侧：`WhyStateDemo.vue` + `StateCounter.vue`、`SnapshotDemo.vue`（useTemplateRef 读 DOM + nextTick）、`CartDemo.vue`、`LazyInitDemo.vue`、`StateStructureDemo.vue`（存同一个响应式对象 / 副本 / id 三种 + 「重新拉取」）、`QuantityEditor.vue`（resetEditor 改成 Object.assign）、`Example.vue`（精简头 + 「区块七在 Vue 里」说明卡）。
- 壳：注册表 03 题 summary；README 03 题目录行、说明段、面试题行，以及 23 段落「与 03 题的区别」、29 段落「与 03 题区块六的区别」两处半句。
- 其他题的交叉引用：23（react / vue）「03 题区块一」→「区块二」；29（react / vue）「03 题区块二」→「区块六」。
- 测试：React 24 条、Vue 14 条。

**问题表处理**：R2-03-1 惰性初始化（区块四 + 原文 + 两侧测试，含 StrictMode 2 次）；R2-03-2 Hooks 规则（二-3：顶层调用原文 + deep dive「stable call order」「array of state pairs」，指向 14）；R2-03-3 局部变量两个问题 + state 属于实例（区块一，两侧测试）；R2-03-4 状态结构五原则（二-10 逐条原文，区块五演示重复 / 矛盾两条，拍平引「child place IDs」原文；不镜像 props 指向 02 区块三）；R2-03-5 两大排错（区块七 + Troubleshooting 原文 + 测试）；R2-03-6 class setState 浅合并与 this.state（八 + 测试，含 17 及以前定时器里同步生效的前提）；R2-03-7 lint 与 Compiler（九：recommended 预设实际 16 条、Compiler「understands the Rules of React」与「will skip optimizing」）；R2-03-8 Vue 响应式按统一措辞写；R2-03-9 模板残留与绝对化清零（「统一解法都是函数式更新」改成官方「In most cases, there is no difference」+ 什么时候要用）；R2-03-10 交叉引用改成 25 / 15 / 16 / 30，reducer 导出并单测。第一轮 :223（空串 && 讲反：React 不为空字符串建文本节点，测试覆盖）、:224（位置写反，重写后不再有这句）、:225（「10、14 题」改成 23 / 24 / 26）、:226、:227 全部落实。

**待核实项结论**：
- P-03-1（lint 预设）：阶段 1 已切 `reactHooks.configs.flat.recommended`；7.1.1 的 recommended 实际 16 条规则（插件文档列 17 条，多出的 component-hook-factories 不在 7.1.1 预设里；installation 页又说编译器规则在 recommended-latest，文档自相矛盾）。
- P-03-2（Object.is 相同时「may still need to call your component」）：react-dom 19.2.8 实测 —— 没有待处理更新时 dispatchSetState 当场比较、相同就连组件函数都不调用（:9143-9161）；组件刚因自己的 state 更新重渲染过时，alternate 上留着更新标记，React 调用一次组件函数、算出没变再跳过子组件（:8070-8072、:10174-10179），再 set 一次就不调用了；只是因为父组件重渲染而跟着重渲染的子组件没有这个标记（复核实测）。这时 `<Profiler onRender>` 仍报一次 update —— 不能拿 Profiler 证明「没重渲染」。
- P-03-3（17 及以前只在 React 事件里批处理的原文）：React 18 升级指南「Before React 18, we only batched updates inside React event handlers.」「Starting in React 18 with createRoot, all updates will be automatically batched, no matter where they originate from.」（发布博客的说法是「Without automatic batching, …」）。

**本次新发现（审计没写到）**：
1. eslint-plugin-react-hooks 7.1.1 的 immutability 拦得住 `items[0].quantity++`、`user.age = 2`，拦不住经 `items.find()` 拿到的对象再改字段、`items.push()`（渲染期和事件处理函数里都不报）；局部 `let` 在事件处理函数里重新赋值报两条（赋值处「Cannot reassign variable after render completes」、onClick 处「Cannot modify local variables after render completes」）。
2. set-state-in-render 报组件体里无条件的 setState 与 `onClick={handleClick()}`，不报「记住上一次的 prop」那种有条件写法（规则页列为 Valid）；写在 `items.map()` 回调里的 `onClick={removeItem(id)}` 也不报（04 题实测）。
3. 官方措辞：初始化函数「should be pure」，更新函数与 reducer「must be pure」；StrictMode 下两次调用「one of the calls will be ignored」—— 19.2.8 里初始化函数采用第一次的结果，更新函数在非急切路径下采用第二次（复核实测）。
4. Vue `<script setup>` 的普通 `let` 变量：setup 只执行一次，变量一直活着但不触发渲染，别的数据让组件重渲染时模板读到它的当前值（开发的非内联编译与生产的内联编译都一样，复核实测）—— React 的局部变量是每次渲染重来。
5. Vue 在渲染里改自己读过的数据：开发构建在同一个任务重复排队超过 100 次时 `handleError(字符串, null, 10)`，先警告「Unhandled error during execution of app errorHandler」（标签用的是错误码 10 的名字），再把字符串本身抛出去 —— 变成未处理的 Promise 拒绝，`app.config.errorHandler` 接不到（instance 是 null）；生产构建没有 checkRecursiveUpdates。
6. `setFn(fn)`：TypeScript 拦不住（fn 的类型正好满足 SetStateAction 里「新值」那一支）。
7. 空串 `&&`：React 不为空字符串创建文本节点（协调子节点四处 `"" !== newChild` 判断，宿主元素唯一子节点走 textContent = ""），会渲染出来的是数字 0（和 NaN）。
8. `readonly CartItem[]` 拦 push（TS2339）与下标赋值（TS2542），`Readonly<CartItem>` 拦字段赋值（TS2540）；两者都是浅的。
9. React 18 升级指南里 ReactDOM.render 的开发期报错原文「Until you switch to the new API, your app will behave as if it's running React 17.」

**复核代理提出、已改的 23 条（要点）**：二-10「另外三条」列错（把 Don't mirror props 当成一条、漏了 Group related state）→ 按五条原则逐条写原文；「深嵌套拍平（21 题）」「详见 21 题（reactive 限制）」两处引用不成立 → 03 自己补拍平原文、删掉 21 的引用并记进遗留；StateStructureDemo 的「原文核对见二-7」→ 二-10；class setState「set 之后同步读旧值」补版本前提（17 及以前定时器 / Promise 里同步生效）、「过期闭包只出现在函数组件里」改成「class 默认从 this 现读，拷出来同样会过期」；StrictMode 测试名「只有第一次的结果被采用」对更新函数不成立 → 改成「其中一次的结果被忽略」；9 处缺成熟度标签；Vue「reactive 换掉就和模板断开」与区块一自相矛盾 → 改成「赋值不触发渲染、旧引用失联」；QuantityEditor.vue 把 reducer 讲成框架差异 → 改成「别让修改散落各处是和框架无关的组织方式」；Vue「渲染过程里不要改状态」补「无条件地」与 React 的例外；「任何时候都对 / 始终一致」补 id 稳定的前提；「解构会断开追踪」补「原始类型的属性」；四-2 补「不启用 Compiler」；localStorage 的错误改成 SecurityError / 解析失败 / 形状不对，配额只在写入时；「刚更新过」改成「刚因自己的 state 更新重渲染过」（含 README）；二-9 惰性初始化补「需要参数时包一层」；demoKit 注释与测试对齐；fake timers 在 afterEach 里恢复；README 补「开发构建」；五补「惰性初始化和 props 镜像是同一个原因」；二-13 的「测试覆盖」归属改准。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 测试 346 条 / build）；03 的 38 条测试无 act 警告、无 stderr（故意触发的报错都 spy 并断言；Vue 的未处理拒绝用 process.on('unhandledRejection') 收住）。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json；面板隐藏）：React 七个区块 —— 局部变量日志 1、2、3 且界面 0、重渲染后从 1 开始，A / B 计数器互不影响；快照日志「setCount(1) 之后立刻读 count = 0」、A 只 +1、B +2；「❌ 原地 +1」后界面不动、点另一行 + 后突然变 2、合计 6；惰性初始化 StrictMode 下首次 2 / 2，输入一次后 4 / 2；选中项存对象停在 × 1、存 id 显示 × 3；两个布尔值同时显示「发送中…」「已发送 ✓」；reducer 输入 9 报库存、输入 5 成功；Too many re-renders 被边界接住（唯一一条 console.error 是这个预期的报错）、formatter 被改坏后显示 typeof = string。Vue 六个区块 —— 普通变量点 3 次显示 0、重渲染后显示 3；改完立刻读 1、DOM 上还是 0、nextTick 后 1；A / B 都 +2；列表换新后存对象停在 × 2、存 id 显示 × 12；init 调用 1 次。源码查看器 React 12 个、Vue 9 个文件；无横向溢出。复核后的修改只动注释、测试名与说明文字，重跑 lint / typecheck / 测试。

### 2.14 04 事件处理（2026-09-18，2-C 第四题）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 04 大纲；问题表 = R2-04-1～11 + AUDIT.md §3 的 04 各行（:243 合成事件 17 起的变化、:244 passive、:245「渲染中 setState 触发死循环警告」、:246 vue「$event 就是原生 DOM 事件对象」的前提）。核实：1 个只读文档研究代理（13 组 46 小项、173 段引文脚本逐字校验全部通过：44 确认、2 修正、2 查无；另做了 3 条故意改错的反向测试）+ 主会话读源码（react-dom 事件系统、@types/react 事件类型、@vue/runtime-dom 的 patchEvent / 修饰符守卫、@vue/compiler-dom 的 v-on 变换、react-router 的 shouldProcessLinkClick）+ 主会话一次性探针（React 5 组、Vue 2 组、捕获阶段 stopPropagation 1 组，结果见下）+ MDN（keydown 的输入法组字、auxclick、localStorage 以外的几页）+ 1 个反驳式复核代理（见下）。

**结构（React 10 个文件，Vue 9 个文件）**
- `react/Example.tsx`：十段文件头 + 六个区块的入口。
- `react/BindingDemo.tsx`【区块一】：`onClick={handleCountClick}`（读 clientX）、`OrderRow` 子组件用 `onRemove` 回调 prop（`(e) => onRemove(item.id, e.shiftKey)`）、「❌ 挂载写成 onClick={removeItem(item.id)} 的列表」（渲染时就删光）。
- `react/EventObjectDemo.tsx`【区块二】：点按钮里的图标，表格列出 type / target / currentTarget / nativeEvent.currentTarget（root 容器）/ eventPhase / isTrusted，以及 setTimeout 里读到的值（currentTarget 为 null）。
- `react/PropagationDemo.tsx`【区块三】：外层 / 中层 onClickCapture + onClick、按钮 onClick（可勾选 stopPropagation），再挂原生捕获 / 冒泡监听与 document 监听，同一份日志比先后；附「哪些事件在 React 里不冒泡」（onScroll 不冒泡、外层 onScrollCapture 能收到、onFocus 冒泡）。
- `react/DefaultActionDemo.tsx`【区块四】：链接 preventDefault（显示原生 defaultPrevented，照样冒泡）、只 stopPropagation 的勾选框（照样勾上）、`<form onSubmit>` + preventDefault（回车也走这里）、`e.target !== e.currentTarget`（.self）。
- `react/ModifiersDemo.tsx`【区块五】：.once（state 标记 / ref 标记）、Enter / Ctrl + Enter（exact）/ Esc 与输入法组字判断、鼠标按键与 onContextMenu。
- `react/PassiveWheelDemo.tsx`【区块六】：onWheel + preventDefault（拦不住）vs ref + addEventListener(…, { passive: false })（缩放）。
- `react/demoKit.ts` + `react/LogPanel.tsx`：日志 store、describeTarget。
- Vue 侧：`BindingDemo.vue` + `OrderRow.vue`（emit + $event.shiftKey）、`EventObjectDemo.vue`、`PropagationDemo.vue`（.capture / 勾选 stop + 原生监听器 + @scroll / @focus / @focusin）、`DefaultActionDemo.vue`、`ModifiersDemo.vue`（.once、.enter.exact、.ctrl.enter.exact、.esc、@contextmenu.prevent）、`PassiveWheelDemo.vue`（@wheel.prevent）、`Example.vue`（精简头）。
- 壳：注册表 04 题 summary；README 04 题目录行、说明段、面试题行。
- 测试：React 22 条、Vue 15 条。

**问题表处理**：R2-04-1 委托到 root 容器（源码 listenToAllSupportedEvents / nonDelegatedEvents / portal，区块二实测 nativeEvent.currentTarget）；R2-04-2 传播模型（三阶段原文、和原生监听器混用的完整顺序、onScroll / onScrollEnd 只在目标、onFocus / onLoad 在 React 里冒泡、onMouseEnter 没有捕获阶段、onScrollCapture 能在外层收到）；R2-04-3 处理函数是放副作用的地方 + 读到那次渲染的 state；R2-04-4 命名约定、回调 prop 代替传播、内联箭头与 useCallback；R2-04-5 Vue 修饰符逐个给出 JS 写法（.self / .once / .enter / .esc / .ctrl.exact / 鼠标键 / .capture / .passive）+ Vue 侧可运行；R2-04-6 onChange 像原生 input（五）+ 表单用 onSubmit（二-6 给出真实理由）；R2-04-7 旧写法（document 委托、事件池与 persist、onScroll 冒泡、class this 绑定、keyCode 系列）+ passive 滚轮（区块六）；R2-04-8 事件类型全家（MouseEvent / KeyboardEvent / ChangeEvent / SubmitEvent / WheelEvent / SyntheticEvent / MouseEventHandler / FormEvent 弃用，类型层测试）；R2-04-9 19.3 的事件相关条目【尝鲜】；R2-04-10 可点击 div 标「演示简化」、七写生产做法；R2-04-11 模板残留清零、「与原生一致」加限定、「死循环警告」改成实测结论。第一轮 :243 / :244 落实；:245（渲染中 setState 的真实表现）以第一轮为准：更新会收敛，不报错（测试覆盖）；:246（$event 的前提）已加。

**待核实项结论**：
- P-04-1（被动事件）：react-dom 19.2.8 addTrappedEventListener 对 touchstart / touchmove / wheel 用 { passive: true } 注册（:19251-19270）；react.dev 参考页没有写，出处是 React 17 changelog「Keep onTouchStart, onTouchMove, and onWheel passive.」；jsdom 与 Chrome 实测 onWheel 里 preventDefault 后原生 defaultPrevented 为 false。
- P-04-2（onScrollEnd）：react.dev common 页没有 onScrollEnd 条目；源码 scrollend 与 scroll 同样只派发给目标（:19411-19413）。课件只写源码结论。
- P-04-3（渲染中 setState）：onClick={removeItem(id)} 写在列表里时渲染期更新会收敛，不报错、不打印任何东西，列表直接为空（测试覆盖）；不收敛的写法才抛 Too many re-renders（03 题）。
- P-04-4（React 17 正式版原文）：正式版博客「In React 17, React will no longer attach event handlers at the document level under the hood.」（比 RC 多了 under the hood）；事件池、onScroll、focusin、捕获阶段的正文只在 RC 博客，正式版只有 changelog。
- P-04-5（合成事件 stopPropagation 与原生监听器）：onClick 里调用时，root 容器里面元素上的原生监听器早已执行，document / window 收不到，root 容器上后挂的原生监听器照样执行（要 stopImmediatePropagation）；onClickCapture 里调用时，root 里面的原生监听器全都收不到（测试覆盖）。

**本次新发现（审计没写到）**：
1. 和原生监听器混用时的完整顺序（jsdom 与 Chrome 一致）：window / document 捕获 → React 的 onXxxCapture（root 容器的捕获监听）→ 容器里面元素的原生捕获 → 目标与冒泡路径上的原生监听 → React 的 onXxx（root 容器的冒泡监听）→ document / window 冒泡。
2. nonDelegatedEvents（scroll、scrollend、load、cancel、close、invalid、toggle、beforetoggle、媒体事件）在 root 上只挂捕获，冒泡监听挂在元素本身；所以 onScroll、onLoad 的 nativeEvent.currentTarget 是元素本身（复核实测）。
3. 在 items.map 回调里写 onClick={removeItem(id)}，eslint-plugin-react-hooks 7.1.1 的 set-state-in-render 不报（只认组件体里无条件的 setState）；TypeScript 会报。
4. 表单：输入框回车时浏览器（与 user-event）会先对提交按钮派发 click，所以按钮 onClick 不会漏；真正的问题是 onClick 跑在约束校验之前（必填为空时 onClick 照样触发、onSubmit 不触发），requestSubmit() 也不经过按钮（测试覆盖）。审计里「只绑按钮 onClick 回车就漏了」的说法不成立（复核实测）。
5. 字符串形式的处理函数 onClick="…"：开发环境 console.error「Expected `onClick` listener to be a function, instead got a value of `string` type.」
6. 合成事件的 preventDefault 会无条件把合成事件自己的 defaultPrevented 设成 true（:3384-3386），原生默认动作有没有真的被拦住要看 e.nativeEvent.defaultPrevented（被动监听时两者不一致）。
7. Vue：@click.right / @click.middle 被 @vue/compiler-dom 改写成 contextmenu / mouseup（compiler-dom.cjs.js:362-370）；修饰符守卫按书写顺序执行（withModifiers :1832-1843）；.once / .capture / .passive 是 addEventListener 的选项（parseName :660-672）；按键修饰符只比较 event.key，不看 isComposing。
8. Vue：v-on 直接在元素上 addEventListener，Vue 的监听器与原生监听器按 DOM 顺序交错，同一元素上先注册的先执行（Vue 在挂载时注册，比 onMounted 里加的早）；.stop 不挡同一元素上的其他监听器。
9. Vue：没声明 emits 的中间组件，根节点是子组件时，给它的监听器会一路透传，祖父组件「收到」孙组件的 emit（看起来像冒泡，其实是透传，复核实测）；根节点是 div 时收不到。
10. react-router 7.18.3 的 Link 只处理「没按修饰键的左键点击、target 为 _self」（shouldProcessLinkClick，chunk-BV7QT456.mjs:7428-7435）。
11. MDN keydown：组字结束那一下 isComposing 可能已经是 false、keyCode 仍是 229 —— 判断要写 isComposing || keyCode === 229。

**复核代理提出、已改的 28 条（要点）**：表单理由讲错（回车会对提交按钮派发 click，onClick 不会漏）→ 改成「onClick 跑在校验之前、requestSubmit 不经过按钮」并补测试；「容器上给每种原生事件各挂一个捕获一个冒泡」与源码不符 → 补 nonDelegatedEvents 与 portal；Vue 组字判断只看 isComposing → 补 keyCode 229 与测试；「八；35 题」→「二-8、七」；「nativeEvent.currentTarget 是 root 容器」「处理函数总在 root 上执行」补委托事件前提；速答「除 onScroll 外都传播」补 onScrollEnd / onMouseEnter；透传补单根前提与「根节点是组件时继续透传」的反例测试；注释里不存在的 @click="removeItem(item.id)" 改指 OrderRow.vue；「onClick="fn()"（01 题）」→ 本课实测报错原文；「03 题八」讲 this 不成立 → 改成「class 组件的其他写法见 03 题八」；「root 捕获最先触发」补 window / document 更早；「接口和原生事件一样」加限定；v-model 补 checkbox / radio / select 与标签；「Vue 完全跟原生一致」去绝对化；行号 :1818-1843、charCode / keyCode / which 的顺序；可点击 div 补「演示简化」（React self-area、Vue 各处）；链接测试改用原生 defaultPrevented 与 fireEvent 返回值；表单测试改成在 document 上读原生 submit 的 defaultPrevented（Vue 侧补回车路径）；捕获阶段 stopPropagation 测试补外层原生捕获与 document；补 stopImmediatePropagation（P-04-5）与测试；五补「onChange 和原生 change 一样吗」；区块四改用勾选框演示「只 stopPropagation 默认动作照样发生」；二-7 补 onScrollCapture（两侧演示与测试）；练习 2 补组字断言；SubmitEvent 的 target 例外；类型层测试注明由 typecheck 验证；一处 JSDoc 缩进。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 测试 383 条 / build）；04 的 37 条测试无 act 警告、无 stderr。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json；面板隐藏，滚动 / 焦点用手动派发事件验证）：React 六个区块 —— 计数与点击位置、Shift 删除只减一件、❌ 列表一挂载就空、事件对象表格（nativeEvent.currentTarget 是 <div id="root">，setTimeout 里 currentTarget 为 null）、传播日志与测试顺序完全一致（勾选 stop 后停在「React 按钮 onClick」）、onScroll 1 / 外层 0 / onFocus 1、链接 preventDefault 冒泡计数 1、requestSubmit 被拦住且路径没变、.self、.once / ref 标记、按键（Ctrl+Shift+Enter 与组字回车被忽略）、右键 contextmenu defaultPrevented、onWheel 原生 defaultPrevented false / passive: false 的为 true 且缩放 110%；Vue 六个区块同样逐项通过（Vue 监听器与原生监听器交错顺序与测试一致、@focusin 1、@wheel.prevent defaultPrevented true）。捕获到的 console.error / warn 为 0。复核后的修改（勾选框、onScrollCapture 计数、链接文案）由测试覆盖，未再开浏览器。源码查看器 React 10 个、Vue 9 个文件；无横向溢出。

### 2.15 05 条件渲染（2026-09-18，2-C 第五题）

**蓝本与依据**：AUDIT-ROUND2.md §5 的 05 大纲；问题表 = R2-05-1～10 + AUDIT.md §3 的 05 各行。核实：1 个只读文档研究代理（38 条、161 段引文脚本逐字校验全部通过：37 确认、1 修正〔Activity 参考页没写起始版本，「19.2」只能引发布博客〕、1 查无〔插值怎么显示 null / undefined 文档没写〕）+ 主会话读源码（@types/react 的 ReactNode 与 Activity、react 的 Activity 导出、@vue/compiler-core 给 v-if 分支注入 key、@vue/shared 的 toDisplayString）+ 主会话一次性探针（同类型同位置保留 / key 重置 / 换类型重置、Activity 的 display: none !important 与 Effect、return null、NaN）+ 1 个反驳式复核代理（见下）。

**结构（React 8 个文件，Vue 8 个文件）**
- `react/Example.tsx`：十段文件头 + 四个区块的入口。
- `react/BranchStylesDemo.tsx`【区块一】：switch 提前 return 的 StatusPanel、return null 的 RestoreHint（注明官方说不常见）、把 JSX 存进 ReactNode 变量、三元、&&、查表。
- `react/ZeroPitfallDemo.tsx`【区块二】：itemCount && …（清空后显示 0）、average && …（显示 NaN）、> 0 与 Number.isFinite 的正确写法；TypeScript 拦不住。
- `react/PositionDemo.tsx`【区块三】：三行 DraftEditor（每行有看得见的小标题）—— 三元同类型（草稿保留，bug）、不同 key（重置）、两个 &&（渲染到不同位置，重置）。
- `react/HideVsUnmountDemo.tsx`【区块四】：三块面板（点赞 state + 非受控输入 + 记日志的 Effect）—— && 卸载、hidden 属性、<Activity mode>；日志用 demoKit 的外部 store。
- `react/demoKit.ts` + `react/LogPanel.tsx`。
- Vue 侧：`BranchStylesDemo.vue`（v-if / v-else-if / v-else、<template v-if>）、`ZeroPitfallDemo.vue`（v-if 没有 0 陷阱、插值里的 && 有，false 显示成「false」、三元写法）、`PositionDemo.vue` + `DraftEditor.vue`（模板 v-if / v-else 切换重建、只写一个组件换 prop 会保留、:key 重置）、`HideVsUnmountDemo.vue` + `LifecyclePanel.vue`（v-if / v-show / KeepAlive，生命周期钩子记日志）、`Example.vue`（精简头）。
- 壳：注册表 05 题 summary；README 05 题目录行、说明段、面试题行。
- 测试：React 7 条、Vue 9 条（Vue 测试里另用渲染函数写了三个探针组件：渲染函数三元复用实例、组件上的 v-show 触发 onUpdated、KeepAlive 停用期间 watch 不停；文件级 `eslint-disable vue/one-component-per-file`）。

**问题表处理**：R2-05-1（「条件渲染 = 卸载」讲反）→ 速答第 3、4 条与二-4 按「同位置同类型保留、换类型 / 去掉 / 换 key 才卸载」重写，区块三三行对照（测试覆盖），Vue 侧写明「模板里的 v-if / v-else、没包 KeepAlive」两个前提；R2-05-2 换类型重置 + key / 不同位置两种重置办法 + 状态提升（区块三、区块四的说明段）；R2-05-3 <Activity>（区块四，【较新·19.2 起】，display: none !important 与 Effect 清理测试覆盖）、hidden 属性（MDN ③）、19.3 <ViewTransition>（九，【尝鲜】）；R2-05-4 return null（附官方「不常见」原文）、JSX 存进变量、三元与 if「completely equivalent」；R2-05-5 ReactNode 类型依据（index.d.ts:436-449）+ TS 拦不住 + lint 能拦（eslint-plugin-react 的 jsx-no-leaked-render，本项目没装）；R2-05-6 status 联合驱动分支（区块一，指向 03 区块五与 11 题）；R2-05-7 class 组件 render() / renderX()（八）；R2-05-8 <template v-if>、v-show 的限制、v-if 惰性与取舍原文、v-if 与 v-for 优先级（「06 题改写时补」）；R2-05-9 演示不再用 style display（改 hidden 属性，Activity 自带），Hooks 在提前 return 之前（二-1、六），按权限隐藏只是体验（七）；R2-05-10 「没有一一对应关系」本题清零，true 也不渲染（二-2 一次说全并测试），「只能」去掉。第一轮 05 的两条（补 <Activity>、return null）已落实。

**待核实项结论**：
- P-05-1（v-if / v-for 优先级的版本变化）：v3 迁移指南 breaking-changes/v-if-v-for 原文「In 2.x, when using v-if and v-for on the same element, v-for would take precedence.」「In 3.x, v-if will always have the higher precedence than v-for.」（vuejs/v3-migration-guide 仓库原文），已写进三的 v-if 与 v-for 条。
- P-05-2（hidden / display: none 与 Activity 在 Effect / Suspense 上的差异细节）：本题只写 Effect 的差别（测试覆盖），Suspense 部分留给 32 题。
- P-05-3（''、[]、NaN 的实际输出）：true / false / null / undefined / '' / [] 都不产生节点，0、NaN、0n 渲染成文本（React 测试覆盖）。
- P-05-4（StrictMode 下三元同类型切换是否仍保留 state）：一致，保留（复核代理探针 D）。

**本次新发现（审计没写到）**：
1. Vue 模板里 v-if / v-else 切换重建，是因为 @vue/compiler-core 给每个分支注入了 key（compiler-core.cjs.js:4702-4732 按分支序号算 key、4837-4883 生成并注入）；Vue 用渲染函数写三元时没有这个 key，两边同一个组件时和 React 一样复用实例（测试覆盖）。审计「Vue 的 v-if 总是销毁重建」要加「模板、没包 KeepAlive」两个前提。
2. 组件上的 v-show 并非「不走任何钩子」：vnode 带指令时 shouldUpdateComponent 直接返回 true（runtime-core.cjs.js:4842），每次切换子组件都走 onBeforeUpdate / onUpdated（测试覆盖）。演示面板不能在 onUpdated 里写父组件的日志，否则父组件重渲染 → 强制更新子组件 → 再写日志，循环。
3. KeepAlive 停用（runtime-core.cjs.js:2919-2936）只把 DOM 移进存储容器、调 onDeactivated，不停组件的 effect：停用期间 watch 照样触发、组件照样重新渲染（测试覆盖）。这是它和 Activity（React 清理 Effect）最大的区别；DOM 被移出文档（isConnected 为 false），激活时插回的是同一个元素（测试覆盖）。
4. Vue 插值里 false 显示成「false」（toDisplayString 对非 null / undefined 的原始值一律 String），比 React 的 0 陷阱更容易踩；插值里的条件写三元或改用 v-if。
5. <Activity mode="hidden"> 给子元素写的是 style="display: none !important;"，再显示时 style 变回空字符串（测试覆盖）；@types/react 19.2.18 的 Activity 标注 @version 19.2.0（index.d.ts:2013），参考页没写版本。
6. return null 时组件自己的 state 和 Effect 都在，但它原来渲染的子组件会被卸载（Effect 清理、state 丢失，测试覆盖）。
7. eslint-plugin-react 7.30.0（2022-05-18）起有 jsx-no-leaked-render（不在 recommended 里）；本项目没装 eslint-plugin-react，0 陷阱 lint 不拦。
8. ViewTransition 要放在条件里面（{show && <ViewTransition>…}），它自己被加上 / 移除才触发 enter / exit（19.3 博客原文）。

**复核代理提出、已改的 27 条（要点）**：速答第 4 条「切到别的分支就是卸载」与第 3 条矛盾 → 加「从树上去掉（&& 变 false、换类型、换 key）」前提；v-show「不走任何钩子」→ 只是不走挂载 / 卸载 / 停用 / 激活，onBeforeUpdate / onUpdated 照常（三处 + 测试标题，补测试）；Activity「更接近 KeepAlive 的停用」→ 改写副作用差别（KeepAlive 停用 watch 与渲染不停，补测试）；Vue 空字符串「测试覆盖」不实 → 改成「测试覆盖 0 与 NaN」；「11 题四态」→ 三值判别联合；「&& 返回左边」补「左边是假值时」；「v-if / v-else 总是重建」补模板与 KeepAlive 前提（5 处，补渲染函数三元测试），四-1 补 Vue 渲染函数 / JSX；「三层以上 / 一律」去掉；「只能靠」→「主要靠」并补外部数据源；「（06 题）」→「06 题改写时补」并补【主流】；ViewTransition 放在条件里面；编译器行号改成 4702-4732、4837-4883；Troubleshooting 补 useLayoutEffect 原文；Activity 测试改断言精确 style 字符串；KeepAlive 测试补 isConnected 与同一元素；Vue 区块一测试补 v-else-if / v-else 与 parentElement；补 Vue 插值 false（演示 + 测试）；补 v-if 惰性原文与 React 对照；补 true / 0n（测试）；补 lint 能拦；return null 补子组件被卸载（测试）；区块三两侧加看得见的行标题、「栏」改「行」；StrictMode 说明改引 Activity 参考页原文；版本依据补 @version 19.2.0；六补「以为 hidden / CSS 隐藏就是卸载」、P-05-1 核实后写入。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 测试 399 条（31 个文件） / build）；05 的 16 条测试无 act 警告、无 stderr。浏览器用临时 5174 服务器（完成后已停掉并还原 launch.json）：复核前逐区块验证过 —— 区块一三种状态切换、区块二清空后「0」「NaN」、区块三同位置草稿保留 / 另两行清空、区块四 && 卸载 / hidden 保留 / Activity 的 display: none !important 与日志（StrictMode 下多一轮清理 → 建立）；Vue 四个区块同样逐项通过，console.error / warn 为 0。复核后又开了一次：React 与 Vue 区块三的行标题与三行结果（React ① 保留 ②③ 清空；Vue ② 保留 ①③ 清空）、Vue 区块二「false」与三元两行、Activity 隐藏时 style 为「display: none !important;」显示后为空、StrictMode 说明段的原文，console.error / warn 为 0，无横向溢出。

### 2.16 05 按「使用频率」改写（2026-09-19，样板，用户已确认）

**起因**：用户 2026-09-18 看了 01–05 后说「我的目的不是让你把一个主题的所有方法都写下来，而是让你把工业界最常见的方法写出来，或者你可以把多种方法中最常用的标注出来」；我提议「只讲最常用、少用的删掉」后，用户改成「不常用的，不用删除，注释起来就好，放开的是真正常用的方法」；05 改完后用户回复「05 可以」。规则定稿在 CONTINUE-PROMPT §4.3「使用频率标注」（8 条）。

**05 的改动**
- 文件头：「成熟度」下加「使用频率」说明行；30 秒速答只用【最常用】；二-1～5 按「要做的事」标【最常用】【常用】【少用】并写依据 —— react.dev「The shortcuts are common」「isn't common」「This is the most common solution.」、TanStack Query docs/framework/react/overview.md 的提前 return（if (isPending) return 'Loading...'）、Redux docs/tutorials/essentials/part-5-async-logic.md 的 let content: React.ReactNode、you-might-not-need-an-effect 的「giving it an explicit key」；【少用】写法与只为说全的细节（0n、编译器与运行时源码行号、Vue 渲染函数三元、v-show 强制更新、KeepAlive 移走 DOM、Vue 2 优先级、Activity 的首次隐藏 / 纯文本 / 媒体细节）集中到新增的「附」1–4，一条没删（旧版 80 条「」引文，改写后缺失 0 条）；新增练习 3（取消 Activity 注释并跑测试）。
- 演示：区块四新增「状态提升」面板（LiftedPanel，最常用的保留办法原来只有一句话）；注释掉 3 处【少用】—— 区块一 RestoreHint（组件自己 return null）、区块三第三行（渲染到不同位置）、区块四 Activity 面板（连同 import）；界面小标题带频率标签；区块四按钮改成「隐藏面板 / 显示面板」（取消注释后文案仍成立）；区块二、区块一的注释补频率标签。
- 测试：区块一、三对应断言用【少用】注释块包起来；区块四测试改成按 names 数组计算（注释块里 names.push('Activity')，取消注释后测试仍成立）；新增「附：<Activity mode="hidden">」独立组件测试，演示注释期间结论照样被验证。React 8 条（原 7 条 + 1），Vue 9 条不变。
- Vue 侧：演示不变（v-if、v-show、KeepAlive、:key 在 Vue 项目里都常用）；Example.vue 加使用频率说明和「附：细节」。

**注释块约定（后续各题照用）**：第一行以 `{/* 【少用】` 或 `/* 【少用】` 开头并写明怎么取消，最后一行单独是 `*/}` 或 `*/`；中间不能再有块注释（原 JSDoc 改成 `//` 行）；说明性注释另起一行写成完整的 `{/* … */}`；被注释的定义、用法、import 要一起注释（tsconfig 开了 noUnusedLocals）。

**验证**：`npm run check` 通过（lint 0 / typecheck 0 / 测试 400 条（31 个文件） / build）；用脚本取消全部 11 个【少用】注释块后 lint、typecheck、05 测试（17 条）全绿，再从备份还原并 `diff -r` 一致；引文保留检查 80 / 0；浏览器（临时 5174，已停并还原 launch.json）：区块一取消状态下只有 && 分支、没有 RestoreHint，区块三两行，区块四三块面板隐藏再显示后只有「&& 卸载」清空、「状态提升」和「hidden 属性」保留点赞与草稿，console.error / warn 为 0。

### 2.17 01 按「使用频率」改写（2026-09-19）

**起因**：按 `RETROFIT-01-04-PROMPT.md` 把 01 改成 05 样板的写法（用户要求：页面上运行的只有常用写法，少用的注释保留、不删）。

**改动**
- 文件头：「成熟度」下加「使用频率」说明行；30 秒速答补一条「静态样式写样式表、style 只放动态值」；二-1 补「【最常用】写成函数」（Component 页「We recommend defining components as functions instead of classes.」）；二-3 多个节点按【最常用】`<>` / 【常用】`<Fragment key>` / 【少用】带 key 的数组分开标；二-5 改成「写样式」一节（静态样式 / 依赖运行时数据的值 / 按条件拼 className 三件事分别标）；二-11 default / named 写「两种都常见，按团队约定」；三的 Vue 侧按 Vue 项目里的频率标（SFC + 模板、`:class` 对象语法、`<style scoped>`【最常用】，渲染函数 / JSX、`v-once` / `v-memo`、`:class` / `:style` 数组语法、in-DOM 模板【少用】）；五补一问「样式写 style 还是 className」；七改写「演示简化」（布局微调仍写在 style 里是全站共同简化，区块一按生产写法）；新增练习 3（`.offline` 类）；新增「附」1–5（返回数组、Vue 渲染函数、Vue 少用写法、in-DOM 模板、细节：成员表达式、jsxDEV 与 vite 行号、18.0 起返回 undefined 不报错、unitlessNumbers 行号、FunctionComponent 签名、厂商前缀）。适用版本补「Vite 7.3（CSS Modules）」。
- 演示：**补上【最常用】的「静态样式走 className」**—— 区块一的头像与 VIP 边框从行内 style 对象挪进新文件 `react/ProfileCards.module.css`（Vite 内置 CSS Modules），style 只剩 accent 决定的底色 / 边框颜色；区块二界面标题补频率标签（automatic runtime【最常用】、`<Fragment key>`【常用】、classic【旧写法】照常显示）。本题没有【少用】的演示需要注释（返回数组原来就只在测试里）。
- 测试：区块一第一条改成断言「CSS Modules 类名 + style 里只有颜色」（Vitest 4.1 默认不处理 CSS，CSS Module 返回 `_<类名>_<文件路径哈希>` 的代理，node_modules/vitest/dist/chunks/cli-api.*.js 的 getCSSModuleProxyReturn）；返回数组那条改名「附 1【少用】」；Vue 第一条改成断言 `vip` 类、`<style scoped>` 的 data-v 属性、`:style` 只有颜色。条数不变（React 17、Vue 5）。
- Vue 侧：`UserCard.vue` 的静态样式挪进 `<style scoped>`（`.avatar`、`.vip`），`:class="{ vip: highlight }"`；`Example.vue` 加使用频率说明和「附」。
- 壳：`src/shell/topicRegistry.ts` 的 React 源码 glob 加 `css`，源码查看器才能显示 `ProfileCards.module.css`（01 的 React 文件从 6 个变成 7 个，浏览器确认）。README 01 行更新（className / CSS Modules、Vue 侧 `<style scoped>`）。

**频率判断与依据**

| 要做的事 | 写法与标签 | 依据 |
|---|---|---|
| 定义组件 | 函数【最常用】；class【旧写法】 | reference/react/Component「We recommend defining components as functions instead of classes.」 |
| JSX 转换 | automatic【最常用】（19 起必须）；classic【旧写法】（面试常问，照常显示） | 19 升级指南 |
| 多个节点包成一个返回值 | `<>`【最常用】；`<Fragment key>`【常用】；带 key 的数组【少用】 | Fragment 页「<Fragment>, often used via <>...</> syntax」「Usually you won't need this unless you need to pass a key to your Fragment.」；数组：工程经验 |
| 静态样式 | 样式表 + className【最常用】 | 花括号页「React does not require you to use inline styles (CSS classes work great for most cases).」 |
| 依赖运行时数据的值 | style【最常用】 | common「We recommend only using the style attribute when your styles depend on JavaScript variables.」 |
| 按条件拼 className | 一两个条件三元【最常用】；条件多交给 clsx 类工具【最常用】 | 工程经验；工具之间 clsx 下载量最高（npm 2026-09-11～17：clsx 88,124,459、classnames 23,020,897，含传递依赖） |
| 导出 | default / named 两种都常见 | importing-and-exporting「some teams choose to only stick to one style … Do what works best for you!」 |
| Vue 写组件 | SFC + 模板【最常用】；渲染函数 / JSX【少用】 | sfc「the recommended approach for using Vue in the following scenarios」；render-function「Vue recommends using templates to build applications in the vast majority of cases.」 |
| Vue 静态样式 | `<style scoped>`【最常用】 | create-vue 默认模板（template/code/default/src/components 的 HelloWorld.vue、WelcomeItem.vue）；风格指南 Essential 要求组件样式有作用域（不限定 scoped，CSS Modules、BEM 都算） |
| Vue 其余 | `:class` 对象语法【最常用】；数组语法、v-once / v-memo、in-DOM 模板【少用】 | v-memo「should be rarely needed」；introduction「SFC … is the recommended way to author Vue components if your use case warrants a build setup」；其余工程经验 |

**验证**：`npm run check` 通过（在只含 01 改动的暂存区导出目录里跑，见提交说明）；01 测试 22 条（React 17、Vue 5）；引文保留检查 81 / 0；【少用】注释块 0 个；浏览器（临时 5174）：React 卡片 class 为 `card _vip_…`、border-top-width 2px、头像 48px 圆形、style 只有颜色，Vue 卡片 `card vip` 同样 2px，两侧「关注」各点第一张只有它变，源码查看器 7 个文件含 `ProfileCards.module.css`，console.error / warn 为 0；另由复核代理做了一次生产构建，确认懒加载的 CSS 排在 index.css 之后、`._vip_` 能盖过 `.card`。

**复核**：反驳式复核代理提出 25 条（中 6、低 19），全部处理：`<>` 的频率依据换成 Fragment 页的「often used via」（「in most cases」那句挪到二-6 讲等价）；clsx 的依据写清是工具之间的比较、含传递依赖；`<style scoped>` 的依据换成 create-vue 模板，风格指南那句只用来说「要有作用域」；`:style` 数组语法与对象展开合并的演示随 avatarStyle 删掉了 → 标【少用】写进附 3 并注明 02 题 UiButton 有对象展开合并的演示；README 的 Vue 半句；`:class` / `:style` 不再打包标最常用；v-once 的少用注明是工程经验；补回 CSS-in-JS；二-5 按三件事分别标；二-2 / 二-5 / 二-11 标题补回【主流】、频率与版本分开写（【最常用】automatic runtime（React 17 起，19 起必须））；三补 h() 返回 vnode 的半句（审计 :184）；四-4 写明 CSS Modules 由构建工具提供、Vue 也有 `<style module>`；四-5 数组写法标少用；练习 3 的断言改成 `/^_offline_/`；测试注释写明哈希算的是文件路径；CSS 注释改准确并写明 `.vip` 靠加载顺序盖过 `.card`；Vue 测试补 data-v 断言；UserCard.vue 的「见附」写明附 4；「没有警告」改成「不报错（没有 console.error）」；in-DOM 的频率依据换成 introduction 页；React style 不加前缀补源码出处（setValueForStyle :2675、:2721-2735）；适用版本补 Vite；CSSProperties 不再在 01 出现 → 二-5 注明类型名并指向 02 题 UiButton（审计 :186 的对称要求改由 02 题满足）；壳改动写进本节。

### 2.18 02 按「使用频率」改写（2026-09-19）

**起因**：同 2.17，按 `RETROFIT-01-04-PROMPT.md` 改写。

**改动**
- 文件头：加「使用频率」说明行（写明 AmountEditor 用整个 props 对象是 ❌ 演示的载体，不算少用写法的演示）；30 秒速答只留最常用（「有意只取初始值 → initialX + 换 key」降为正文的【常用】，内容还在二-5、五）；二-1 读 props（解构【最常用】/ 整个 props 对象【少用】）与布尔 prop 简写（两种都常见，按团队约定）；二-2 默认值（解构默认值【最常用】/ 模块顶层常量【常用】/ `??`【常用】/ defaultProps【旧写法】）；二-4 回调上浮【最常用】（跨很多层时 Context / store【常用】）；二-5 直接用 prop【最常用】/ initialX + 换 key【常用】；二-7 原生属性类型把「行业最常用 ComponentProps<'button'>」和「官方类型建议 ComponentPropsWithRef（本课主线）」分开写；二-8 ref 作为普通 prop【最常用】（解构或随 rest 展开都行）；二-9 children：ReactNode【最常用】/ ReactElement【少用】；二-10 interface / type 两种都常见；三的 Vue 侧：类型声明 defineProps<T>()【最常用】/ 运行时声明【常用】、3.5 解构默认值【最常用】、单根自动透传【最常用】/ inheritAttrs: false【常用】；新增练习 3（换成 ComponentProps 全部通过、换成 WithoutRef typecheck 报两处错）；新增「附」1–8（整个 props 对象、布尔 prop 的出处与两种口径、冻结源码链与生产构建实测、defaultProps 的 createElement 机制、RefCallback 返回类型、Vue 编译结果 / 只读包装源码 / useAttrs watch 实测、原生属性类型的出处与构成、ReactElement）。
- 演示：没有需要注释的【少用】演示；界面补频率标签（区块一「参数里解构 + 解构默认值」、区块二「✅ 回调上浮」、区块三「直接读 price」【最常用】/「initialPrice 草稿」【常用】、区块四「继承原生 props + rest 展开、ref 作为普通 prop」）。
- 测试：新增 1 条类型层测试「对 DOM 元素 ComponentProps 与 ComponentPropsWithRef 是同一个类型」（expectTypeOf，由 npm run typecheck 检查），React 21 条、Vue 13 条。
- Vue 侧：`Example.vue` 加使用频率说明、标签与「附：细节」；`UiButton.vue` 的两种透传状态标【最常用】/【常用】。README 02 行测试条数 20 → 21。

**频率判断与依据**

| 要做的事 | 写法与标签 | 依据 |
|---|---|---|
| 读 props | 参数里解构【最常用】；整个 props 对象【少用】 | passing-props「Usually you don't need the whole props object itself, so you destructure it into individual props.」 |
| 布尔 prop | disabled / disabled={true} 两种都常见 | Airbnb React 风格指南「Omit the value of the prop when it is explicitly true.」+ eslint-plugin-react jsx-boolean-value（默认 never，不在 recommended）；react.dev 示例多写 ={true}（conditional-rendering、typescript、input 等页）；legacy JSX In Depth 不推荐省略 |
| 默认值 | 解构默认值【最常用】；模块顶层常量、`??`【常用】 | passing-props；后两个工程经验 |
| 子组件想改数据 | 回调上浮【最常用】；Context / store【常用】 | passing-props「ask its parent」、sharing-state-between-components |
| props 进 state | 直接用【最常用】；initialX + 换 key【常用】 | choosing-the-state-structure「Don't mirror props in state」 |
| 原生属性类型 | 行业【最常用】ComponentProps<'button'>；官方建议 ComponentPropsWithRef（本课主线）；兼容 18 用 forwardRef + WithoutRef【旧写法】 | shadcn/ui new-york-v4 的 button.tsx / input.tsx 与 tailwind-v4.mdx「Replace React.forwardRef<...> with React.ComponentProps<...>」；@types/react JSDoc「It's usually better to use ComponentPropsWithRef or ComponentPropsWithoutRef」；Radix UI toggle.tsx |
| ref | 作为普通 prop【最常用】（解构或随 rest 展开） | react-19 博客（解构）；shadcn/ui（随 rest，迁移文档「Remove ref={ref}」） |
| children 类型 | ReactNode【最常用】；ReactElement【少用】 | learn/typescript 先给 ReactNode；PropsWithChildren（index.d.ts:1423）；ReactElement 只在 cloneElement / asChild 这类 API 里用（工程经验） |
| Vue 声明 props | 类型声明【最常用】；运行时声明【常用】 | typescript/composition-api「it is usually more straightforward to define props with pure types via a generic type argument」；props 页主示例是运行时声明 |
| Vue 透传 | 单根自动透传【最常用】；inheritAttrs: false + $attrs【常用】 | attrs「The common scenario for disabling attribute inheritance is when attributes need to be applied to other elements besides the root node.」 |

**待用户决定（不影响本次提交）**：行业里 React 19 组件最常见的原生属性类型写法是 `ComponentProps<'button'>`（shadcn/ui），本课主线 UiButton 按「统一措辞 · Props」表和 @types/react 的 JSDoc 写 `ComponentPropsWithRef<'button'>`。两者对 DOM 元素是同一个类型（测试覆盖）。按 RETROFIT §7.1 没有改主线和统一措辞表，只在正文分开写，汇报时问用户要不要把主线换成 ComponentProps。

**验证**：`npm run check` 通过（在只含 02 改动的暂存区导出目录里跑）；02 测试 34 条（React 21、Vue 13）；引文保留检查 107 / 0；【少用】注释块 0 个；练习 3 两步都实测过（换成 ComponentProps：typecheck 与测试全过；换成 WithoutRef：UiButton.tsx「Property 'ref' does not exist on type 'UiButtonProps'」+ UiButtonDemo.tsx ref={deleteRef} 不能赋值），实测后已还原；浏览器（临时 5174）：各区块频率标签显示正常，✅ 回调、父组件 price +10、onClick 透传交互正常，console.error / warn 为 0。

**复核**：反驳式复核代理提出 20 条（高 2、中 4、低 14），全部处理：速答与主线不一致、擅自改统一措辞表的说法（改回表里的主线措辞，行业写法另起一句，决定留给用户）；「两种都常见」改成「行业最常用 / 官方类型建议」分开写并补 shadcn 迁移文档；二-7 丢掉的「react.dev 没有讲这组类型」、index.d.ts 行号、ComponentProps 的构成补进附 7；附 2 的时间线改成「同一时期的两种口径」；ref「解构」不是唯一主流写法（改成解构或随 rest 展开，五、七同步）；`??`、回调上浮、运行时声明、3.5 解构默认值补依据；children 的 ReactNode 依据换成 PropsWithChildren、ReactElement 按盘点改回【少用】放进附 8；inheritAttrs 行去掉重复的【主流】；ReadonlyPropsDemo 的【少用】标签改成「反例的载体」；三处「见二-3」补「与附 3」；练习 3 补 import 并加 WithoutRef 这一步（有会失败的断言）；测试标题去掉频率判断；区块四界面补标签；二-8 的超长行断开；布尔 prop 的出处补全、注明 jsx-boolean-value 不在 recommended；clsx / cn 补 shadcn 的依据。

### 2.19 03 按「使用频率」改写（2026-09-19）

**起因**：同 2.17，按 `RETROFIT-01-04-PROMPT.md` 改写。

**改动**
- 文件头：加「使用频率」说明行；30 秒速答只留最常用（惰性初始化、useReducer 两句降为正文的【常用】，内容还在二-9、二-11、五）；二-5 补「要用新值做别的事：先算好存进变量」【最常用】；二-6 按「一次事件只更新一次」（直接传新值【最常用】）/「同一事件多次更新、Effect 与定时器里基于旧值」（更新函数【最常用】）/「统一风格一律写更新函数」【常用】/ 参数命名（首字母【最常用】、全名或 prev 前缀【常用】）分开标；二-8 展开 / map / filter【最常用】、Immer【常用】；二-9 直接给值【最常用】、惰性初始化【常用】；二-10 Avoid redundant state【最常用】、Group related state【常用】、深嵌套时拍平与 Immer 都【常用】（官方首选拍平）；二-11 useState【最常用】/ useReducer【常用】；二-13 只留 Too many re-renders，「把函数存进 state」【少用】；新增二-14「prop 变了要调整 state」（渲染时算 / 换 key【最常用】，渲染期有条件地 set【少用】）；三的 Vue 侧 ref【最常用】/ reactive【常用】；新增练习 3（取消 FormatterBlock 注释）；「附」1–4（把函数存进 state、渲染期有条件地 set、拍平的具体形状、源码细节与统计）。
- 演示：**区块二补上【最常用】的「先算好 next 再用」按钮**（日志同时显示 count 仍是旧值、next 是新值）；**区块七的「把函数存进 state」（FormatterBlock 连同类型、常量）按【少用】注释**（2 个注释块：定义 + 用法），区块七只留 Too many re-renders；各区块补频率说明行（区块一、二、三、四、六）。
- 测试：新增「先算好 next 再用」；区块七原来渲染演示的 setFormatter 测试用【少用】注释块包起来，另写「附 1：把函数存进 state」独立组件测试（setter 用 React 的 Dispatch<SetStateAction<Formatter>> 类型，断言 state 变成 toUpper 转成字符串再加「!」）。React 25 条运行 + 1 条随演示注释，Vue 14 条。
- Vue 侧：`Example.vue` 加使用频率说明、ref / reactive 分档，存 id 写「推荐」（不照搬 React 侧的频率标签）。README 03 行与说明段、注册表 summary 的「两个常见报错」改成「常见报错」，测试条数更新。

**频率判断与依据**

| 要做的事 | 写法与标签 | 依据 |
|---|---|---|
| 一次事件只更新一次 | 直接传新值【最常用】；一律写更新函数【常用】 | queueing「It is an uncommon use case, but if you would like to update the same state variable multiple times…」；useState「You might hear a recommendation to always write code like setAge(a => a + 1)…」「it's reasonable」；react.dev 示例粗略统计（按用途分类约 40 : 5） |
| 同一事件多次更新 / Effect 与定时器里基于旧值 | 更新函数【最常用】 | useState deep dive「However, if you do multiple updates within the same event, updaters can be helpful.」；useEffect「✅ Pass a state updater」 |
| 更新函数参数命名 | 首字母【最常用】；全名或 prev 前缀【常用】 | queueing「It's common to name the updater function argument by the first letters…」「another common convention is…」 |
| 要用新值做别的事 | 先算好存进变量【最常用】 | useState Troubleshooting「If you need to use the next state, you can save it in a variable before passing it to the set function」 |
| 对象 / 数组更新 | 展开 / map / filter【最常用】；Immer【常用】 | updating-objects-in-state「Immer is a popular library…」 |
| 初始值 | 直接给值【最常用】；惰性初始化【常用】 | 工程经验；useState「This can be wasteful if it's creating large arrays or performing expensive calculations.」 |
| state 结构 | 能算出来的不存【最常用】；Group related state【常用】；深嵌套：拍平【常用】（官方首选）/ Immer【常用】 | choosing-the-state-structure「When possible, prefer to structure state in a flat way.」「try flattening it」；Redux 风格指南 Normalize；updating-objects「if you don't want to change your state structure…」 |
| 存 id / 一个 status | 不打频率标签（唯一正确写法 vs ❌，只用 ✅ / ❌） | — |
| 管理 state | useState【最常用】；useReducer【常用】 | extracting-state-logic「You don't have to use reducers for everything: feel free to mix and match!」；频率为工程经验 |
| 把函数存进 state | 【少用】（坑随场景一起注释） | 工程经验 |
| prop 变了要调整 state | 渲染时算 / 换 key【最常用】；渲染期有条件地 set【少用】 | useState「This pattern is rarely needed」 |
| Vue 声明状态 | ref【最常用】；reactive【常用】 | reactivity-fundamentals「the recommended way to declare reactive state is using the ref() function」；reactive 工程经验 |

**注释掉了什么**：TroubleshootingDemo.tsx 的 FormatterBlock（类型 Formatter、toUpper / addBang / SAMPLE 与组件本身，原 JSDoc 改成 `//` 行）与它在 TroubleshootingDemo 里的用法；Example.test.tsx 里渲染它的那条测试。取消全部 3 个注释块后 lint、typecheck、03 React 测试（26 条）全绿，已从备份还原并 `diff -r` 一致（复核代理在副本上用最终版本又验证了一次）。

**验证**：`npm run check` 通过（在只含 03 改动的暂存区导出目录里跑）；03 测试 39 条（React 25、Vue 14）；引文保留检查 131 / 0；浏览器（临时 5174）：区块二「先算好 next 再用」日志正确、区块七只剩 Too many re-renders、各区块频率说明行显示正常，console.error / warn 为 0。

**复核**：反驳式复核代理提出 23 条（严重 1、中 8、低 14），全部处理：拍平从【少用】改成【常用】（官方首选，Redux 风格指南也要求规范化），原则原句放回正文，附 3 改成拍平的形状细节并补「下放到子组件」；「只更新一次直接传新值」的依据换成 queueing 页「It is an uncommon use case」，统计改写成分类后的口径并写明范围；「一律写更新函数」的依据换成「You might hear a recommendation…」；Effect / 定时器里用更新函数补 useEffect 页依据、补第三种用途（读 state 变量不方便时）；删掉只有 03 有的「错误写法不参与频率排序」那句，把【少用】标在「要把函数存进 state」这件事上；存 id / status 不再打频率标签；Vue 侧存 id 改回「推荐」；useState / useReducer、惰性初始化、Group related state、reactive 补依据或「工程经验」，二-11 标题补回【主流】；Avoid redundant state 标【最常用】（速答里有它）；参数命名按官方原文分档；新增二-14（prop 变了要调整 state）；README / 注册表的「两个常见报错」与测试条数；区块七的编号与 describe 名；独立测试改成单独的 describe、用 React 的 Dispatch 类型、断言具体值；「先算好 next」的日志同时显示旧 count；区块一、二补界面标签；Immer 注明「21 题改写时补」；统一措辞 State 表「函数式更新什么时候用」一行补频率口径；10 题的「一律用函数式更新」口诀记进遗留。

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

### 错误边界（20 定稿，2026-09-18）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| 为什么是 class | 「目前没有函数组件的写法（Component 页 There is currently no way…），官方也说可以直接用 react-error-boundary」 | 「React 中唯一需要 class 的场景」（getSnapshotBeforeUpdate 也没有函数写法） |
| 接不住什么 | Component 页四类：事件处理函数、服务端渲染、边界自身、setTimeout / rAF 这类异步回调；例外是 useTransition 返回的 startTransition | 「异步错误一律接不住」 |
| startTransition | 「useTransition 返回的那个」里抛错进边界（19.0 起）；顶层 startTransition 进不了 | 不区分两个 startTransition |
| 事件处理函数的错误去哪 | 「React 捕获后交给 reportError（浏览器派发 window 的 error 事件），同一次事件里其他监听照常执行」 | 「直接抛到全局」 |
| 开发环境日志 | 「被接住的错误由默认 onCaughtError 用 console.error 打印一次；传了 onCaughtError 就不打印」 | 「会冒泡到 window」（React 18 的行为）、「边界失效了」 |
| Vue 捕获面 | 「Vue 负责调用的代码：渲染、生命周期、setup、watch、模板事件处理函数，以及交回给 Vue 的被拒绝的 Promise」 | 「Vue 能接所有 async 错误」 |
| Vue 出错后的界面 | 「钩子只负责通知；渲染函数抛错的组件变成空注释，computed 抛错时界面停在上一次，实例都还在；兜底要自己 v-if」 | 「Vue 会自动卸载出错的组件」 |
| 404 | React Router 推荐 loader 里 throw data(..., { status: 404 }) 交给路由级边界（文档点名的例外） | 「404 不该用边界」 |
| react-error-boundary 版本 | 6.0.0 只发 ESM；6.0.1 起 CommonJS 回来、peer 为 React 18 / 19；6.1 起错误类型 unknown | 「6.x 只发 ESM」 |

### 过期闭包与 useEffectEvent（26 定稿，2026-09-18）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| 修法顺序 | ① 函数式更新 → ② 写对依赖 → ③ useEffectEvent【较新·19.2.0 起】→ ④ latest ref（社区惯用法 · 并排）；另有「搬回事件处理函数」「对象 / 函数移进 Effect、依赖原始值」「拆 Effect」 | 「latest ref 是主流修法」「useEffectEvent 只是加分点」 |
| latest ref 的官方态度 | 「react.dev 没有给这个模式命名；referencing-values-with-refs 的挑战题 Read the latest state 用 ref 在事件处理函数里保存最新值（occasional cases）」 | 「react.dev 对 latest ref 没有任何推荐语」「官方推荐的模式」 |
| latest ref 同步位置 | 事件处理函数里跟 setState 一起写（官方挑战题）/ useEffect 无依赖（lint 干净，有窗口期）/ useLayoutEffect（缩小窗口）；渲染期写 ref.current 会被 refs 规则报 error | 「任何时刻读 .current 都是最新的」「渲染期写 ref.current = value 没问题」 |
| Effect Event 的换入时机 | 「更新渲染时新回调先排队，提交的第一步（before-mutation）写进去，早于所有 Effect」（19.2.8） | 「提交阶段某一步」「和 useEffect 同时」 |
| useEffectEvent 的限制 | 参考页 Caveats 四条：顶层调用；只在 Effect / Effect Event 里调用，不渲染时调用、不传给组件或 Hook；不拿来逃避依赖；身份每次渲染都变。另：不是响应式值、不写进依赖（learn 页 / useEffect 页） | 把「not reactive、必须从依赖省略」说成参考页 Caveats 之一 |
| 运行时与 lint | 「运行时只拦渲染期调用（抛错），在事件处理函数里调用照常执行、靠 rules-of-hooks 报 error」 | 「在 Effect 外调用会抛错」 |
| 19.2.x 已知 bug | 「memo()（不带比较函数）/ forwardRef 组件里的 Effect Event 一直调用第一次渲染的回调，19.3.0 修复（#34831）」 | 「19.2 起可以放心在任何组件里用」 |
| lint 版本 | 「eslint-plugin-react-hooks 6.1.0 起识别 useEffectEvent（本项目 7.1.1）」 | 「需要 v6」「需要 v7」（6.0.0 是误发、不识别） |
| JSX 事件为什么不过期 | 「React 派发时从 DOM 节点读最近一次提交的 props 里的处理函数；前提是没被 useCallback 缓存成旧闭包」 | 「JSX 事件永远不会过期」 |
| Vue 会不会过期 | 「默认现读 .value 不会；把值拷出来（手动快照、解构 reactive、3.4 及以前解构 props）就会」 | 「Vue 没有这个坑」「Vue 唯一会过期的是手动快照」 |
| Vue 里 useEffectEvent 的概念对应 | 「watch 只追踪 source，回调里读最新值不触发重跑」 | 「Vue 没有任何对应物」 |
| 3.5 解构 props | 「编译器把访问改写成 props.x，回调里读到的是那一刻的 prop；watch(x) 要写 watch(() => x)（3.5.42 实测编译抛错，文档写的是 warning）」 | 「解构 props 会失去响应式」（3.4 及以前才是） |

### Props（02 定稿，2026-09-18）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| props 只读靠什么 | 「开发构建里 props 被浅冻结，严格模式下赋值抛 TypeError（JS 引擎的错误）；生产构建不冻结，赋值成功但不重渲染；react-hooks/immutability 会报」 | 「React 不警告、纯靠约定」「改 props 一定报错」（不分构建） |
| 快照 | 「props 是每次渲染的只读快照（passing-props Recap 原文）；Vue 的 props 是同一个响应式对象，父组件 patch 之后读到新值」 | 「Vue 任何时候读 props 都是最新值」（不提下一个 tick） |
| 默认值 | React：参数解构默认值，只对没传 / undefined 生效；Vue：3.5 响应式 props 解构【主流】，3.4 及以前 withDefaults【旧写法】 | 「Vue 默认值要包一层 withDefaults」 |
| 函数组件 defaultProps | 「19.0 移除：日常 JSX（jsx()）下静默忽略，React.createElement 路径仍会合并（key 写在展开后面就会走这条）；class 组件保留」 | 「19 里函数组件的 defaultProps 完全不生效」 |
| propTypes | 「19 起 React 不再做 propTypes 检查（所有组件），组件 props 靠 TypeScript 这类静态检查，外部数据在边界用 schema 校验」 | 「只靠 TypeScript」「函数组件的 propTypes 被移除」 |
| 透传 | 「React 任何版本都没有自动透传，只有显式 {...rest}；Vue 单根组件默认自动透传，多根组件要显式绑 $attrs（否则警告）」 | 「React 里根本不存在…唯一手段」、不带单根前提的「Vue 自动透传」 |
| 原生属性类型 | 「ComponentPropsWithRef / ComponentPropsWithoutRef（@types/react 的 JSDoc 建议用这两个）；纯 19 组件用 WithRef 并解构 ref，兼容 18 用 forwardRef + WithoutRef」 | 「ComponentPropsWithoutRef 是组件库的标准写法」 |
| ref 与 forwardRef | 「React 19 起 ref 对函数组件是普通 prop（class 组件不是）；forwardRef 仍可用，文档说将来弃用，@types/react 19.2 / 19.3 都没标 @deprecated」 | 「forwardRef 已废弃」「forwardRef 是必需的」 |
| key | 「key 不是 prop，组件收不到；需要这个值另用一个 prop 传」 | — |
| useAttrs | 「文档：isn't reactive、不能用 watch；3.5.42 实测 watch getter 会触发（实现细节，不要依赖）」 | 「useAttrs 返回响应式对象」 |
| 一个文件几个组件 | 「一个 SFC 只有一个模板组件；同一文件写多个组件要 defineComponent + 渲染函数 / JSX」 | 「Vue 一个文件只能有一个组件」 |
| <button> 的 type | 「表单里没写 type 的 <button> 是提交按钮（MDN ③）」 | 「button 默认 type 是 submit」（不带表单前提） |

### State（03 定稿，2026-09-18）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| set 之后读 | 「setter 只影响下一次渲染，这次渲染里读还是旧值」（useState 页 Caveats 原文） | 「setState 是异步的」 |
| 函数式更新什么时候用 | 「同一事件里多次更新同一个 state、异步回调里基于旧值更新时用；只更新一次两种写法结果相同（官方 In most cases, there is no difference），这时直接传新值最常用（queueing 页「It is an uncommon use case」）；想统一风格一律写也可以（常用）」（2026-09-19 补频率口径，见 2.19） | 「新值依赖旧值时必须用函数式更新」「统一解法都是函数式更新」 |
| Object.is 跳过 | 「相同就跳过重渲染与子组件；组件刚因自己的 state 更新重渲染过时，React 可能先调用一次组件函数再跳过子组件」 | 「设同样的值组件函数一定不执行」「刚更新过的组件」（不说是自己的 state） |
| 初始化函数 | 「应当是纯函数（should）、不接收参数；需要参数就包一层箭头函数；StrictMode 开发环境调两次、其中一次的结果被忽略」 | 「必须是纯函数」（must 是更新函数和 reducer 的措辞）、「只采用第一次的结果」 |
| 空串 && | 「空字符串不渲染任何节点；会渲染出来的是数字 0（和 NaN）」 | 「空串会被渲染成看不见的文本」 |
| lint 能拦什么 | 「immutability 拦得住 items[0].x++、obj.x = …；拦不住经 find() 拿到的对象再改、push()；set-state-in-render 只报组件体里无条件的 setState」 | 「lint 会拦住所有直接修改 state」 |
| 普通变量 | 「React 的局部变量每次渲染重来（不保留、不触发渲染）；Vue <script setup> 的普通变量一直活着，只是不触发渲染」 | 「两边的普通变量一样」 |
| 存对象还是存 id | 「React 存下来的对象在列表不可变更新后过期；Vue 存同一个响应式对象，原地修改时不过期，列表整体换新时同样过期；两边都推荐存 id（id 稳定为前提）」 | 「Vue 存对象不会过期」「存 id 任何时候都对」 |
| 为什么要 reducer | 「别让修改散落在各个事件处理函数里（和框架无关）；React 用 reducer，Vue 集中到 composable / Pinia action」 | 「Vue 不需要 reducer 是因为可以直接改」（把模式讲成框架差异） |
| class 的 setState | 「浅合并；React 事件处理函数里（18 起 createRoot 下任何地方）set 之后同步读还是旧值；17 及以前在定时器 / Promise / 原生事件里同步生效；定时器里读 this.state 是最新值，拷出来同样会过期」 | 「class 的 setState 是异步的」「过期闭包只出现在函数组件里」 |
| Vue 渲染中改数据 | 「开发构建在同一个任务重复排队超过 100 次时报 Maximum recursive updates exceeded；生产构建没有这项检查」 | 「Vue 会无限循环」「Vue 也抛 Too many re-renders」 |
| reactive 的限制 | 「只能装对象类型、不能整体替换（和原来的引用断开）、解构出原始类型的属性会断开追踪；所以官方推荐 ref() 为首选」 | 「reactive 解构就失去响应性」（不说原始类型）、「reactive 换掉就和模板断开」 |

### 事件（04 定稿，2026-09-18）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| 委托位置 | 「React 17 起大多数事件的监听器挂在 root 容器上（16 及以前是 document）；scroll、load、媒体事件这类在元素本身，portal 里的在 portal 容器」 | 「React 所有事件都委托到 root」「React 把事件绑在 document 上」（不带版本） |
| nativeEvent.currentTarget | 「以 onClick 为例是 root 容器」 | 不带事件类型的「是 root 容器」 |
| 合成事件与原生 | 「接口基本遵循同一套 DOM 标准，少数属性没有（KeyboardEvent 的 isComposing 要从 e.nativeEvent 读）」 | 「和原生事件完全一样」 |
| 传播 | 「多数事件都会传播；onScroll / onScrollEnd 只在目标上（外层用 onScrollCapture），onMouseEnter / onMouseLeave 没有捕获阶段、从离开的元素传到进入的元素；onFocus / onBlur / onLoad 在 React 里冒泡」 | 「React 事件都会冒泡」「除 onScroll 外都冒泡」（不提其他例外） |
| stopPropagation 挡住谁 | 「onClick 里调用：挡 React 树里后面的 onClick 和 root 容器之外（document / window）的监听器，root 里面元素上的原生监听器早已执行；onClickCapture 里调用：root 里面的也收不到；同一节点上的其他监听器要 stopImmediatePropagation」 | 「stopPropagation 挡住所有监听器」 |
| 表单为什么用 onSubmit | 「提交按钮的 onClick 跑在浏览器约束校验之前（必填为空也执行），requestSubmit() 也不经过按钮；回车时浏览器会对提交按钮派发 click，所以 onClick 本身不会漏」 | 「只绑按钮 onClick，回车提交就漏了」 |
| onWheel / onTouchStart / onTouchMove | 「react-dom 用 { passive: true } 注册，处理函数里 preventDefault 拦不住（看 e.nativeEvent.defaultPrevented）；要拦就 ref + addEventListener(…, { passive: false })」 | 「onWheel 里 preventDefault 就能阻止滚动」「看 e.defaultPrevented 判断拦没拦住」 |
| 渲染时调用处理函数 | 「onClick={fn(id)} 在渲染时就执行；更新会收敛时列表直接变空、不报错，不收敛时抛 Too many re-renders」 | 「一定报死循环警告」 |
| Vue 修饰符 | 「守卫函数按书写顺序执行（Order matters）；.once / .capture / .passive 是 addEventListener 选项；按键修饰符只比较 event.key，不看输入法组字」 | 「Vue 的修饰符和 React 一一对应」 |
| Vue 组件事件 | 「emit 不冒泡；没声明 emits 的监听器透传到单根组件的根元素，根节点是组件时继续往下透传（看起来像冒泡，其实是透传）」 | 「Vue 组件事件会冒泡」、不带单根前提的「自动透传」 |
| 输入法组字 | 「判断 e.isComposing \|\| e.keyCode === 229（MDN ③，React 里 isComposing 从 e.nativeEvent 读）」 | 只判断 isComposing |

### 条件渲染（05 定稿，2026-09-18）

| 要说的事 | 这样写 | 不要这样写 |
|---|---|---|
| 什么时候是卸载 | 「组件从树上被去掉（&& 变成 false、三元换成别的类型或别的 key）就是卸载；三元两边同一个组件、同一位置时是复用，state 保留」 | 「条件渲染切到别的分支就是卸载」「条件渲染 = v-if，会真正卸载」 |
| && 的返回值 | 「左边是假值时，&& 返回的就是左边这个值本身（不是 false）」 | 不带条件的「&& 返回左边的值」 |
| 哪些值不渲染 | 「true / false / null / undefined / '' / [] 不产生节点；数字（0、NaN）和 bigint（0n）当作文本渲染」 | 「false / null / undefined 才不渲染」（漏 true）「假值都不渲染」 |
| Vue 的 v-if / v-else | 「模板里的 v-if / v-else 切换会重建（编译器注入了不同的 key；前提是没包 KeepAlive）；渲染函数里写三元和 React 一样复用」 | 「Vue 的 v-if 总是销毁重建」（不带模板与 KeepAlive 前提）「Vue 不复用、React 复用」 |
| v-show | 「只切 display，不走挂载 / 卸载 / 停用 / 激活钩子；组件上的 v-show 切换时组件被强制更新，onBeforeUpdate / onUpdated 照常」 | 「v-show 不走任何生命周期钩子」 |
| Activity 与 KeepAlive | 「都保留 state；Activity 由 React 清理 Effect、DOM 用 display: none 留在原地；KeepAlive 停用时 watch 与重新渲染都不停、DOM 移出文档」 | 「Activity 就是 React 版的 KeepAlive」「Activity 更接近 KeepAlive 的停用」 |
| Activity 的版本 | 「19.2 起（19.2 发布博客、@types/react 的 @version 19.2.0）」 | 引参考页说版本（参考页没写） |
| 0 陷阱怎么拦 | 「左边写成布尔值（> 0）；TypeScript 拦不住（ReactNode 含 number / bigint）；eslint-plugin-react 的 jsx-no-leaked-render 能拦（本项目没装）」 | 「TS 会报错」「lint 会报」（不说是哪个插件） |
| Vue 插值里的 && | 「插值里 0 显示「0」，false 显示「false」；插值里的条件写三元或改用 v-if」 | 「Vue 没有 0 陷阱」（不区分 v-if 与插值） |

## 每题状态（阶段 2 起填写）

| 题号 | 主题 | 状态 | 改动摘要 | 遗留问题 |
|---|---|---|---|---|
| 18 | 路由（React Router） | **完成（样板已确认）** | Data 模式主线（loader / action / middleware 守卫 / errorElement / lazy / useBlocker / 面包屑）+ 声明式 RequireAuth 三态并排；十段文件头；React 18 条 + Vue 7 条结论测试；Vue 守卫改为返回值写法；safeRedirect 共享实现；源码查看器支持多文件（5.10）。详见 2.1 | 32 / 34 / 35 题新增后回填交叉引用 |
| 26 | 过期闭包 | **完成** | 修法优先级（函数式更新 → 写对依赖 → useEffectEvent 主线 → latest ref 并排）四个区块：事件处理函数里的 setTimeout、手动 addEventListener（含被 useCallback 缓存的 JSX 处理函数）、轮询四种写法、让依赖合法消失（搬进事件 / 对象依赖 / ref.current）；Vue 侧现读 .value、手动快照与解构 reactive、3.5 解构 props、watch vs watchEffect；React 22 条 + Vue 15 条测试（含 latest ref 窗口期、Effect Event 身份与换入时机、19.2.x memo / forwardRef bug）；了结 P-26-1～6。详见 2.10 | 19.3 升级后改 memo / forwardRef 那条测试与课件；14 题 useInterval 注释可补一句 19.2.x 的 memo / forwardRef bug；10 题改写时保留「场景二修法三 latest ref」或同步改 26 的引用；31–35 新增后回填交叉引用 |
| 01 | 组件与 JSX | **完成** | 四个区块：资料卡（UserCard 两个独立实例、JSX 当值传、className / style / Fragment）、JSX 编译成什么（automatic vs classic 编译结果、style 补 px 实测、Fragment key）、组件必须纯（茶杯例子 + StrictMode）、不要在组件里定义组件；Vue 侧 SFC + 具名插槽、:class / :style、compiler-sfc 编译输出；React 17 条 + Vue 5 条测试；了结 P-01-1～5。详见 2.11 | 17 题改写时补 Compiler 小节并回头核对 01 的引用；多根组件的 attrs 透传已在 02 补上（2.12）；28 题改写时补「组件返回类型 / FunctionComponent 签名」；19.3 升级后核 Fragment ref 的类型；33 / 35 新增后回填交叉引用；2026-09-19 按使用频率改写（见 2.17） |
| 02 | Props | **完成** | 四个区块：props 的类型、解构与默认值（默认值实验表：没传 / undefined / null / 空串 / 无值写法）、props 只读与回调上浮（开发构建 TypeError、onAmountChange、快照）、不要把 props 复制进 state（useState 镜像 vs 直接读、initialPrice + 换 key）、接收原生属性（ComponentPropsWithRef + {...rest}、className / style 合并、ref 作为 prop）；Vue 侧 3.5 响应式 props 解构、布尔转型、改 props 只警告、props 是响应式对象、inheritAttrs + useAttrs、多根组件、组件 ref + defineExpose；React 20 条 + Vue 13 条测试；了结 P-02-1～5。详见 2.12 | 12 题改写时补：ref 回调与清理函数、useImperativeHandle、RefObject / MutableRefObject、useRef 必传参数、组件 ref + defineExpose（02 已写「12 题改写时补」，12 改完回头改成「见 12 题」）；28 题改写时补：ReactNode 与 ReactElement 的取舍、全局 JSX → React.JSX、useRef 必传参数、Vue 泛型组件 generic（同上）；17 题改写时核对 02 的「默认值新引用让 memo 失效」；19.3 升级后核 forwardRef 是否标弃用；35 新增后回填交叉引用；2026-09-19 按使用频率改写（见 2.18；原生属性类型的主线要不要换成 ComponentProps 待用户定） |
| 03 | State 与 useState | **完成** | 七个区块：为什么需要 state（局部变量 vs useState、state 属于实例）、setter 只影响下一次渲染（快照、A / B、设成当前值）、对象 / 数组整体替换（原地改 + 同一个引用被跳过）、惰性初始化（调用次数面板）、state 的结构（存 id vs 存对象、status vs 两个布尔值）、useReducer（reducer 导出单测）、两个常见报错（Too many re-renders、函数存进 state）；Vue 侧普通 let 变量、DOM 在 nextTick 才变、setup 只执行一次、存同一个响应式对象 / 副本 / id、渲染中改数据的 Maximum recursive updates；React 24 条 + Vue 14 条测试；了结 P-03-1～3。详见 2.13 | 21 题改写时补：深嵌套拍平（03 二-10 已写原文，21 只讲了 Immer）与 Vue 侧 reactive 的三条限制 / ref 首选（R2-21-9；03 已写，21 可指回 03）；17 题改写时补 Compiler 小节（03 九已写「17 题改写时补」）；33 / 34 / 35 新增后回填交叉引用；19.3 升级后无需改（本课没用到 19.3 的 API）；2026-09-19 按使用频率改写（见 2.19）；10 题改写时改掉「新状态只依赖旧状态 → 一律用函数式更新，和 03 题是同一条」这句口诀（10-effects-and-lifecycle/react/Example.tsx:144，和 03 现在的口径与统一措辞表冲突）；21 题改写时补 Immer 的用法（03 二-8 已写「21 题改写时补」，本项目没装 immer） |
| 04 | 事件处理 | **完成** | 六个区块：绑定与传参（传函数不要调用、回调 prop 以 on 开头、❌ 列表渲染时就删光）、事件对象（target / currentTarget / nativeEvent.currentTarget 是 root 容器、setTimeout 里 currentTarget 为 null）、事件传播（React 捕获 / 冒泡与原生监听器同一份日志比先后、stopPropagation 挡住谁、onScroll 不冒泡 / onScrollCapture / onFocus 冒泡）、默认行为（preventDefault 只拦默认动作、只 stopPropagation 的勾选框、form onSubmit、.self）、Vue 修饰符的 React 写法（.once、按键与 .exact、输入法组字、鼠标键与右键菜单）、onWheel 是被动监听；Vue 侧 v-on 直接绑元素（与原生监听器交错）、修饰符实现、@click.right 改写成 contextmenu、@wheel.prevent 生效、组件事件不冒泡与透传反例；React 22 条 + Vue 15 条测试；了结 P-04-1～5。详见 2.14 | 17 题改写时补 Compiler 对内联处理函数的记忆化（04 九已写「17 题改写时补」）；07 题可补「提交按钮 onClick 跑在校验之前」的一句（04 二-6 已有测试）；31 / 34 / 35 新增后回填交叉引用；19.3 升级后核 onFullscreenChange 与 submitter |
| 05 | 条件渲染 | **完成** | 四个区块：分支就是 JavaScript（switch 提前 return、return null、JSX 存进变量、三元、&&、查表）、&& 的 0 陷阱（0 / NaN 渲染出来、> 0 与 Number.isFinite、true / 0n 等取值表、TS 拦不住）、UI 树里的位置决定 state 的去留（三行对照：三元同类型保留、key 重置、不同位置重置）、隐藏还是卸载（&& / hidden 属性 / <Activity>，日志记 Effect 建立与清理）；Vue 侧模板 v-if / v-else 注入 key（compileTemplate 测试）与渲染函数三元复用、插值里 0 与 false、v-show 触发 onUpdated、KeepAlive 停用期间 watch 不停与 DOM 移出文档；React 7 条 + Vue 9 条测试；了结 P-05-1 / 3 / 4。详见 2.15 | 06 题改写时补 v-if 与 v-for 同用（05 三已写「06 题改写时补」）；P-05-2（Activity 与 Suspense）留给 32 题；32 新增后回填 Activity 的交叉引用；19.3 升级后核 <ViewTransition> 与 Activity 的配合；2026-09-19 按使用频率改写（样板，用户已确认，见 2.16）|
| 20 | 错误边界 | **完成** | 手写 class 边界主线（fallback / onError / onReset / resetKeys）+ react-error-boundary 可运行并排；「接得住 / 接不住」8 个按钮 + useTransition 同步 / async、顶层 startTransition、lazy 缓存；createRoot 小根演示 onCaughtError / onUncaughtError 与整棵界面被移除；Vue 侧 ErrorBoundary.vue、捕获面、出错组件的两种表现、传播规则与 errorHandler；React 15 条 + Vue 12 条测试；了结 P-20-1～5。详见 2.9 | 31 / 32 / 33 / 34 新增后回填交叉引用；18 题可补一句 RouterProvider onError（7.11 起）与 throw data 404 |
| 16 | 全局状态（Zustand） | **完成** | Zustand 5 主线五个区块（selector 与 useShallow + Profiler 渲染计数 / 组件外读写 + subscribe + 异步 action + persist 与 migrate / Context + useReducer 并排 / createStore + Context 每实例一份 / RTK 只读对照）；Vue 侧 Pinia setup store + 迷你持久化插件 + 模块级 reactive；React 19 条 + Vue 15 条测试；了结 P-16-1、3～6（P-16-2 仍是推论）。详见 2.8 | P-16-2（Compiler 与订阅粒度）留给 17 题；33 / 34 / 35 新增后回填交叉引用；首次打开会触发一次 Vite 依赖重新预构建（新发现 9） |
| 14 | 自定义 Hook 与 Composable | **完成** | useSyncExternalStore 主线（useWindowWidth + getServerSnapshot + useDebugValue）+ Effect 订阅并排 + subscribe 稳定性实验；useInterval（useEffectEvent）与「回调进依赖」反例；防抖搜索（派生 loading，lint 抑制已清）+ let timer 坑；React 12 条 + Vue 8 条测试；了结 P-14-1～5。详见 2.7 | tearing 没有做可视化演示（P-14-3，只讲原理）；32 / 33 / 34 新增后回填交叉引用（03 题 :64「10、14 题」那句已随 03 重写删除，2.13） |
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
