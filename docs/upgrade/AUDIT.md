# 课件升级 · 阶段 0 审计报告（AUDIT.md）

> 规格：`course-upgrade-prompt.md`（基准日 2026-09-16）。本报告只读不改源码；所有版本数据在 2026-09-16 实时抓取。
> 阅读顺序建议：先看 §5（需要你决定的事项）和 §4（主题调整建议），再按需查 §3 的逐题问题。

## 0. 审计方法与基线

**依据优先级**（规格 §1.2）：① `node_modules` 中已安装包的 `.d.ts` / 源码 → ② 官方文档（react.dev、reactrouter.com、vuejs.org、router.vuejs.org、pinia.vuejs.org、vite.dev、tanstack.com）→ ③ 官方博客 / 发布说明 / CHANGELOG → ④ 其他来源只作线索。查不到的一律标「待核实」并汇总在附录 B。

**基线检查（2026-09-16，未改任何文件）**：

| 命令 | 结果 |
|---|---|
| `npx eslint . --max-warnings=0` | 通过（exit 0，无输出） |
| `npx vue-tsc --noEmit` | 通过（exit 0） |
| `npm test` | 不存在：仓库没有任何测试基础设施（无 vitest / testing-library / jsdom，package-lock 里也从未装过） |
| `git status` | 一处未提交改动：`src/topics/13-slots-and-children/react/Example.tsx:129` 全角括号/冒号被改成半角（疑似误改，见 §5）；两个未跟踪文件 `course-upgrade-prompt.md`、`update-project.md` 是你的规格文件 |

**仓库结构（用于对照）**：30 题在 `src/topics/<NN-slug>/react/Example.tsx` + `vue/Example.vue`（部分题有辅助 `.ts/.vue`），共 109 个文件、约 18.9k 行；注册表 `src/shell/topicRegistry.ts`（5 阶段分组 + 推荐顺序）；站点壳 `src/main.tsx`、`src/shell/App.tsx`、`src/shell/TopicPage.tsx`；桥 `src/bridge/ReactIsolatedMount.tsx`（18 题独立 React 根，MemoryRouter 在示例内部）、`src/bridge/VueMount.tsx`（每次挂载新建 Pinia，按注册表 `vuePlugins` 工厂装插件）。

**审计分批**：A 01–06 · B 07–11 · C 12–17 · D 18–22 · E 23–26 · F 27–30，每批由一个只读子代理按统一模板审计，共用 §2 的版本结论与附录 A 的事实卡，结果按题号合并进 §3。

---

## 1. 主题清单

| # | 标题（文件头原文） | 目录（`src/topics/`） | 文件 | 用到的库 / 关键 API | 交叉引用（指向） |
|---|---|---|---|---|---|
| 01 | 组件与 JSX（没有模板 DSL，一切都是 JavaScript） | `01-component-and-jsx` | react 121 行 / vue 109 行 | 无第三方；React 侧无 Hook（仅 `CSSProperties` 类型） | 03 |
| 02 | Props（类型声明、默认值与单向数据流） | `02-props` | react 218 / vue 127 + OrderCard.vue、UiButton.vue | `ComponentPropsWithoutRef`；Vue `computed`、`useAttrs`；注释提到 defaultProps/PropTypes/forwardRef 已废弃 | 04 08 09 12 13 28 |
| 03 | State（useState 与不可变更新） | `03-state` | react 399 / vue 318 | `useState`、`useReducer`；Vue `ref`、`reactive`、`computed` | 05 06 07 14 16 17 23 24 26 29 |
| 04 | 事件处理（onClick、事件对象、传参、冒泡与默认行为） | `04-events` | react 137 / vue 146 | `useState`、`MouseEvent` 类型 | — |
| 05 | 条件渲染（三元、&&、提前 return / switch、映射对象） | `05-conditional-rendering` | react 146 / vue 145 | `useState` | — |
| 06 | 列表渲染与 key（.map() 对照 v-for，index 作 key 的坑） | `06-list-and-key` | react 250 / vue 211 + OrderNoteEditor.vue | `useState`、`useEffect` | 04 08 09 10（写法为「第 9 题」，未补零） |
| 07 | 表单处理（受控组件 vs v-model） | `07-forms` | react 358 / vue 304 | `useState`、`useRef`、`ChangeEvent`、`FormEvent`；注释提到 `useActionState` 但未实现 | 03 12 19 |
| 08 | 父子组件通信（callback props vs emit） | `08-parent-child-communication` | react 137 / vue 80 + ProductItem.vue | `useState` | 25 |
| 09 | 派生状态（computed vs 渲染时直接算） | `09-derived-state` | react 123 / vue 117 | `useMemo`、`useState` | — |
| 10 | useEffect 与生命周期 —— 副作用、依赖数组、cleanup 与请求竞态 | `10-effects-and-lifecycle` | react 423 / vue 170 + IntervalCounter.vue | `useEffect`、`useRef`、`useState`；注释讨论 `useEffectEvent` 但未使用；Vue `watch`、`onMounted`、`onUnmounted` | 03 06 09 11 12 14 26 27 |
| 11 | API 请求状态建模 —— loading / success / error / empty 与重试 | `11-api-request-state` | react 152 / vue 159 | `useEffect`、`useState`；`@/shared/mockApi` | 10 30 |
| 12 | DOM ref 与跨渲染可变值 —— useRef 的两种用途 | `12-dom-ref` | react 116 / vue 107 | `useRef`、`useState`；提到 React 19 ref 作为 prop | 02 26 |
| 13 | 插槽与 children —— React 用「值」组合 UI | `13-slots-and-children` | react 134 / vue 102 + Card.vue、UserList.vue | `useState`、`ReactNode` | — |
| 14 | 自定义 Hook 与 Composable —— 逻辑复用 | `14-composable-and-custom-hook` | react 190 + useDebouncedValue.ts、useWindowWidth.ts / vue 74 + 4 个辅助文件 | `useEffect`、`useState`（窗口宽度未用 `useSyncExternalStore`）；Vue `watch`、`onMounted` | 09 10 11 12 30 |
| 15 | Context 跨层传值（主题切换） | `15-context` | react 150 / vue 53 + MiddleLayer/ThemedButton/ThemedCard.vue、theme.ts | `createContext`、`useContext`、`useMemo`、`useCallback`；已用 React 19 `<Context value>`；Vue `provide/inject`、`InjectionKey`、`readonly` | 16 |
| 16 | 全局状态管理（Zustand vs Pinia） | `16-global-state` | react 138 + cartStore.ts / vue 43 + CartPanel/ProductList.vue、cartStore.ts | **zustand** `create`；**pinia** `defineStore`、`storeToRefs` | 08 09 15 25 30 |
| 17 | useMemo 与 useCallback（配合 React.memo 的性能优化） | `17-performance-hooks` | react 200 / vue 154 + ProductRow.vue | `memo`、`useMemo`、`useCallback`；Vue `onUpdated` | 09 |
| 18 | 路由 —— React Router 的参数、query、嵌套路由、导航与登录态守卫 | `18-routing` | react 585 / vue 89 + 9 个辅助文件（router.ts、auth.ts、5 个页面等） | **react-router-dom**（MemoryRouter、Routes、Route、Link、NavLink、Navigate、Outlet、useParams、useSearchParams、useNavigate、useLocation）；**vue-router**（createRouter、createMemoryHistory、beforeEach、useRoute、useRouter）；注册表 `isolateReactRoot` + `vuePlugins` | 03 05 09 13 15 16 17 |
| 19 | 异步提交与防重复 —— submitting 状态的工业界标准写法 | `19-async-submit` | react 123 / vue 119 | `useState`、`FormEvent`；注释提到 `useActionState`/`useTransition` 但未使用 | 07 |
| 20 | 错误边界 —— Error Boundary vs onErrorCaptured | `20-error-handling` | react 134 + ErrorBoundary.tsx / vue 101 + BuggyCounter.vue | class 组件 `getDerivedStateFromError`、`componentDidCatch`；注释提到 `createRoot` 的 `onUncaughtError/onCaughtError`；Vue `onErrorCaptured` | — |
| 21 | 不可变数据更新 —— 两框架状态模型的核心差异 | `21-immutable-update` | react 188 / vue 176 | `useState`、`useRef`；Vue `reactive` | 03 12 |
| 22 | 综合实战 —— 订单管理页 | `22-integrated-order-page` | react 379 / vue 249 + OrderRow.vue | `useEffect`、`useState`；`@/shared/mockApi` | 06 07 08 09 10 11 19 21 27 30 |
| 23 | 渲染模型与 state 快照 | `23-rendering-and-state-snapshot` | react 310 / vue 302 | `useEffect`、`useRef`、`useState`；Vue `onUpdated` | 03 06 09 12 17 24 26 |
| 24 | State batching 与函数式更新 | `24-batching-and-functional-updates` | react 441 / vue 408 | `flushSync`（react-dom）、`useState`、`useEffect`、`useRef`、`SetStateAction`；Vue `nextTick` | 03 06 09 10 12 14 17 23 26 |
| 25 | 状态提升与 state 归属 | `25-state-ownership-and-lifting` | react 426 / vue 195 + 4 个辅助 .vue | `useState`、`useEffect` | 07 08 09 10 16 23 |
| 26 | 过期闭包（stale closure） | `26-stale-closures` | react 630 / vue 491 | **`useEffectEvent`**（从 `react` 导入并作主线使用）、`useCallback`、`useEffect`、`useRef` | 06 07 10 12 17 23 24 27 30 |
| 27 | 异步竞态、取消与过期响应 | `27-async-race-and-cancellation` | react 493 / vue 352 + ResultPanel.vue、panelTypes.ts | `useEffect`、`useRef`、`AbortController` | 06 07 08 10 11 12 24 25 26 30 |
| 28 | React + TypeScript 基础 | `28-react-typescript-basics` | react 678 / vue 437 + OrderCard/OrderFilterForm.vue、types.ts | `ChangeEvent`、`FormEvent`、`MouseEvent`、`ReactNode`、`as const satisfies`、类型谓词 | 02 03 05 07 08 09 10 21 23 25 27 |
| 29 | useReducer 与判别联合 Action | `29-use-reducer-and-action-types` | react 419 / vue 442 | `useReducer`、`useCallback`；Vue `reactive` | 03 06 07 09 15 16 17 21 24 26 28 |
| 30 | TanStack Query 与服务端状态 | `30-tanstack-query-server-state` | react 461 / vue 449 + OrdersCountBadge.vue、queryPlugin.ts | **@tanstack/react-query**（QueryClient、QueryClientProvider、useQuery、useMutation、useQueryClient、notifyManager）、`useSyncExternalStore`；**@tanstack/vue-query**（VueQueryPlugin）；注册表 `vuePlugins` | 03 08 09 10 11 15 16 18 19 22 27 |

**交叉引用总量**：约 401 处「见 NN 题 / NN 题讲过」，分布在 68 个文件；被引用最多的是 11（约 45 次）、09、10、03、16；没有任何题引用 20；06 题是唯一用「第 9 题」（不补零）格式的。逐条是否成立见 §3 各题的「交叉引用」行。

**全局 grep 结果（供 §3 定位）**：`没有一一对应关系` 118 处 / 59 文件（06、11、13、19、21、22 题为 0）；`永远` 约 132 处（26 题 react 侧 22 处、10 题 12 处最多）；`根本没有` 9 处；`完全相同 / 完全一样` 20 处；`react-router-dom` 导入 4 处（`src/main.tsx:9`、`src/shell/App.tsx:5`、`src/shell/TopicPage.tsx:7`、`18-routing/react/Example.tsx:55`）；React 19 旧写法（`forwardRef`、`.Provider`、`defaultProps`、`propTypes`）只出现在说明性注释里，代码里没有；`useActionState / useFormStatus / useOptimistic / useTransition / use() / Suspense / useId / useDeferredValue / lazy` 在 30 题代码里**一处都没用**。

---

## 2. 版本采用情况调查

数据来源：`https://api.npmjs.org/versions/<pkg>/last-week`（按大版本聚合，排除预发布版）、`https://registry.npmjs.org/<pkg>`（`time`、`dist-tags`、各版本 `peerDependencies`），抓取时间 2026-09-16。

### 2.1 各包数据

| 包 | 当前安装 | npm latest | 各大版本周下载占比 | 大版本首发 → 最近发版 | 关键 peerDependencies |
|---|---|---|---|---|---|
| react / react-dom | 19.2.8 | 19.3.0（2026-09-09） | v19 71.3%，**v18 24.7%**，v17 1.7%，v16 1.7% | v19 2024-12-05 → 19.3.0@2026-09-09；v18 → 18.3.1@2024-04-26（已停止发版） | react-dom@19.3.0 要求 react ^19.3.0 |
| @types/react / @types/react-dom | 19.2.18 / 19.2.5 | 19.3.0 | v19 72.4%，v18 24.7% | v18 线仍在发版（18.3.31@2026-06-05） | @types/react-dom@19.3.0 要求 @types/react ^19.3.0 |
| react-router | 7.18.3（作为 react-router-dom 的依赖装入） | **8.4.0**（2026-09-15）；dist-tag `version-7` = 7.18.4（2026-09-15）、`version-6` = 6.30.6（2026-08-18） | **v7 41.4%，v6 39.2%**，v5 9.6%，v8 8.5% | v8 2026-06-17 → 8.4.0；v7 2024-11-22 → 7.18.4；v6 2021-11-03 → 6.30.6@2026-08-18（**仍在发补丁**） | v7: react >=18；**v8: react >=19.2.7** |
| react-router-dom | 7.18.3 | 7.18.4（**没有 v8**，v8 已删除此包） | **v6 47.3%**，v7 40.1%，v5 11.7% | v7 → 7.18.4@2026-09-15；v6 → 6.30.6@2026-08-18 | react >=18 |
| vite | 7.3.6 | 8.3.0（2026-09-10） | **v8 43.6%**，v7 22.8%，v6 17%，v5 15.2% | v8 2026-03-12 → 8.3.0；v7 2025-06-24 → 7.3.6@2026-06-25 | — |
| @vitejs/plugin-react | 5.2.0 | 6.1.1 | v5 36.8%，v4 32.1%，v6 30.4% | v6 2026-03-12（**只支持 vite ^8**）；v5 2025-08-07 → 5.2.0@2026-03-12 | v5.2.0: vite ^4.2 / ^5 / ^6 / ^7 / ^8；v6.1.1: vite ^8、babel-plugin-react-compiler ^1.0.0（可选） |
| @vitejs/plugin-vue | 6.0.8 | 6.0.9 | v6 60.6%，v5 32.6% | v6 2025-06-24 → 6.0.9@2026-09-14 | vue ^3.2.25；vite ^5 / ^6 / ^7 / ^8 |
| typescript | 5.9.3 | **7.0.2**（2026-07-08） | **v5 65.2%**，v6 17.1%，v7 9.2% | v7 2026-07-08；v6 2026-03-23 → 6.0.3@2026-04-16；v5 → 5.9.3@2025-09-30 | — |
| typescript-eslint | 8.68.0 | 8.70.0（2026-09-07） | v8 99.4% | v8 2024-07-31 → 8.70.0 | eslint ^8.57 / ^9 / ^10；**typescript >=4.8.4 <6.1.0** |
| vue-tsc | 3.3.11 | 3.3.11 | v3 59.3%，v2 28.2% | v3 2025-07-01 → 3.3.11@2026-08-21 | typescript >=5.0.0 |
| eslint | 9.39.5（dist-tag `maintenance`） | 10.10.0 | **v9 57.5%**，v8 21%，v10 16.6% | v10 2026-02-06 → 10.10.0@2026-09-04；v9 → 9.39.5@2026-07-10 | — |
| eslint-plugin-react-hooks | 7.1.1 | 7.1.1 | **v7 43.1%**，v5 40.1%，v4 12.2% | v7 2025-10-08 → 7.1.1@2026-04-17 | eslint ^3 … ^10 |
| eslint-plugin-vue | 10.10.0 | 10.11.0 | v10 55.4%，v9 34.3% | v10 2025-03-05 → 10.11.0@2026-09-06 | eslint ^8.57 / ^9 / ^10 |
| vue | 3.5.42 | 3.5.42（3.6 为 `rc` 3.6.0-rc.8） | v3 89%，v2 10.7% | v3 → 3.5.42@2026-08-27 | — |
| vue-router | 4.6.4 | **5.3.1**（2026-09-02） | **v4 54.9%，v5 35.1%**，v3 9.7% | v5 2026-01-29 → 5.3.1；v4 2020-12-07 → 4.6.4@**2025-12-11**（此后无发版） | v5.3.1: vue ^3.5.34 / ^4；vite ^7.3 / ^8；pinia ^3.0.4 / ^4.0.2；@pinia/colada >=0.21.2；@vue/compiler-sfc ^3.5.34 / ^4（后四项按用法应为可选 peer，待核实） |
| pinia | 3.0.4 | **4.0.3**（2026-08-12） | **v3 41.9%，v2 39.5%**，v4 18.5% | v4 2026-07-14 → 4.0.3；v3 2025-02-11 → 3.0.4@2025-11-05；v2 → 2.3.1@2025-01-20 | v3: vue ^3.5.11、typescript >=4.5；v4: vue ^3.5.11、typescript >=5.6、@vue/devtools-api ^8.1.5 |
| zustand | 5.0.15 | 5.0.15 | v5 55.5%，v4 39.3% | v5 2024-10-14 → 5.0.15@2026-08-13 | react >=18（可选） |
| @tanstack/react-query | 5.102.8（锁定） | 5.103.1（2026-09-16） | v5 96.5%，v4 3.5% | v5 2023-10-17 → 5.103.1 | react ^18 / ^19 |
| @tanstack/vue-query | 5.102.8（锁定） | 5.103.1 | v5 90.5%，v4 9.5% | 同上 | vue ^2.6 / ^3.3 |
| next（仅概念讲解） | 未安装 | 16.3.5 | **v16 68.2%**，v15 21.8%，v14 7.6% | v16 2025-10-22 → 16.3.5@2026-09-11 | react ^18.2 / ^19 |
| babel-plugin-react-compiler | 未安装 | 1.0.0（2025-10-07，之后无新版） | v1 92.7%，pre 7.2%；周总量 1446 万（约为 react 周下载的 9%） | v1 2025-10-07 | — |

候选新增依赖（当前**均未安装**，用于阶段 1 补 `test` 脚本 / 阶段 3 新题）：

| 包 | latest | 各大版本周下载占比 | 大版本首发 | 关键 peerDependencies | 备注 |
|---|---|---|---|---|---|
| vitest | 5.0.1（2026-09-15） | **v4 57%**，v3 21.9%，v5 8.7% | v5 2026-09-03；v4 2025-10-22 → 4.1.11@2026-08-18 | v4.1.11: vite ^6 / ^7 / ^8；@types/node ^20 / ^22 / >=24 | 选 **4.x**（v5 发布不满 30 天） |
| @testing-library/react | 16.3.3 | v16 86.3% | v16 2024-06-03 → 16.3.3@2026-08-27 | react/react-dom ^18 / ^19；@testing-library/dom ^10 | 选 16.x（需同装 @testing-library/dom 10.x） |
| @testing-library/vue | 8.1.0 | v8 85.3% | v8 2023-10-31 → 8.1.0@**2024-05-18**（两年多无发版） | vue >=3；@vue/compiler-sfc >=3 | 选 8.x；维护不活跃但与 vue 3.5 兼容（待阶段 1 实测） |
| @testing-library/user-event | 14.6.7 | v14 93.7% | v14 2022-03-29 → 14.6.7@2026-09-02 | @testing-library/dom >=7.21.4 | 选 14.x |
| @testing-library/jest-dom | 7.0.1（2026-08-09） | **v6 79.2%**，v7 14% | v7 2026-07-20；v6 2023-08-13 → 6.10.0@2026-07-20 | v6: @testing-library/dom >=10 <11 | 选 **6.x**（v7 不满 6 个月） |
| jsdom | 30.0.1（2026-07-29） | 份额极分散：v26 18.7%，v29 18.1%，v20 13.7%，v30 11.6% | v30 2026-07-27；v29 2026-03-15 | canvas（可选） | 测试环境依赖，课件不讲；二选一见 §5 |
| happy-dom | 20.14.5 | **v20 88%** | v20 2025-10-09 → 20.14.5@2026-09-12 | — | 同上 |
| react-hook-form | 7.88.0 | v7 99.3% | v7 2021-04-02 → 7.88.0@2026-09-11 | react ^16.8 … ^19 | 仅当新增「表单工程化」题时需要 |
| zod | 4.6.5 | v4 57%，v3 43% | v4 2025-07-09 → 4.6.5@2026-09-13 | — | 同上；v4 满 14 个月、份额 57% → 【主流】 |
| @reduxjs/toolkit / react-redux | 2.12.0 / 9.3.0 | v2 92% / v9 79.1% | v2 2023-12-04；v9 2023-12-04 | react ^18 / ^19 | 仅当新增 Redux Toolkit 对照且需可运行示例时需要 |

### 2.2 逐包结论

判定阈值（规格 §3.3）：同一大版本内的小版本 / 补丁满 30 天；新大版本需同时满足 满 6 个月 + 关键工具链 peer 兼容 + 周下载份额 ≥ 30%（或官方默认）。

| 包 | 规格 §4 基线 | 审计结论 | 理由 |
|---|---|---|---|
| react / react-dom / @types/* | 19.2.x | **同意：主线 19.2.x**，安装保持 19.2.8 / 19.2.18 | 19.3.0 发布仅 7 天（< 30 天）；v18 仍占 24.7% → 「React 18 → 19 变化」必须作为【旧写法】对照保留。2026-10-09 之后可评估把安装升到 19.3.x（课件仍把 19.3 特性标【尝鲜】直到满足 §3.3） |
| react-router | 7.x，写法兼容 v8 | **同意：主线 7.x（安装 7.18.3；7.18.4 发布 1 天，暂不升）；统一从 `react-router` 导入；v8 标【尝鲜】** | v8 首发 3 个月（< 6 个月）、份额 8.5%（< 30%）、且要求 react >=19.2.7；v7 41.4% 是当前第一。**修正规格中「v6 已宣布停止维护」的表述**：v6 在 2026-08-18 仍发了 6.30.6，且 react-router-dom 的下载中 v6 仍占 47.3%（第一）。是否有官方 EOL 公告见附录 A。建议阶段 1 把依赖从 `react-router-dom` 改为直接依赖 `react-router`（v7 的 `react-router-dom` 只是 2 行转发） |
| vite | 7.x 或 8.x | **保持 7.3.6，不为升级而升级**；v8 记为「已满足主流条件，可选升级」 | v8 首发 6 个月零 4 天、份额 43.6%、plugin-vue 6 / plugin-react 5.2 / vitest 4 都声明支持 ^8 → 按 §3.3 已够格。但项目现状正常，且 plugin-react 6（vite 8 专用）曾误处理 `.vue` 子模块（见 vite.config.ts 注释）；课件没有依赖 Vite 大版本的内容。若升级，用 plugin-react 5.2.0 + vite 8 |
| typescript | 5.9.x 或 6.0.x | **保持 5.9.3** | typescript-eslint peer `<6.1.0` 排除 7.x；6.0 首发 5.8 个月、份额 17.1%，都未达标；v5 65.2% |
| typescript-eslint | — | 保持 8.68.0（8.70.0 发布 9 天） | 满 30 天后可升到 8.69 / 8.70 |
| eslint | — | **保持 9.x**（9.39.5）；v10 标【较新】。**阶段 1 更正（2026-09-17）：ESLint v9.x 已于 2026-08-06 EOL**（eslint.org/version-support；npm 上 9.39.5 标 deprecated），本条结论待重新决定（PROGRESS.md 待决 D1-1） | v9 57.5%；v10 首发 7 个月但份额 16.6% < 30%。typescript-eslint、eslint-plugin-vue、react-hooks 都已声明支持 ^10，将来升级无阻碍 |
| eslint-plugin-react-hooks | 7.x | **同意 7.1.1** | v7 43.1% 第一；其 `recommended` 预设内容见附录 A（决定是否需要单独装 React Compiler 的 lint 规则） |
| vue | 3.5.x | **同意 3.5.42**；3.6 标【尝鲜】 | 3.6 仍是 rc.8 |
| vue-router | 4.x API，安装 5.x | **同意：安装 5.3.1，课件只用 4.x / 5.x 共有的 API；文件路由【较新】、`vue-router/experimental` 数据加载器【尝鲜】** | v5 首发 7.5 个月、份额 35.1%（≥ 30%）、peer vue ^3.5.34 已满足；v4 自 2025-12-11 后没有发版。前提：附录 A 核实 v5 对非文件路由项目无破坏性变更（含 `next()` 是否仍可用） |
| pinia | 3.x | **同意：主线 3.0.4；v4 标【较新】（2 个月）** | v4 首发 2 个月、份额 18.5%，两项都未达标；v2 仍占 39.5%（存量大）。v4 改了什么见附录 A |
| zustand / @tanstack/*-query | 5.x / 5.x | **同意【主流】**；query 保持锁定 5.102.8 | 5.103.1 当天发布 |
| next | 16.x | **同意【主流】**（只做概念讲解，不安装） | v16 68.2% |
| babel-plugin-react-compiler | 【较新】 | **同意【较新】**；默认方案 A（不启用），对比见 §5 | 1.0.0 发布 11 个月；周下载约为 react 的 9%；无后续版本 |
| 测试依赖（新增，需你确认） | 按 peer 选 | **vitest 4.1.11 + @testing-library/react 16.3.3 + @testing-library/dom 10.x + @testing-library/vue 8.1.0 + @testing-library/user-event 14.6.7 + @testing-library/jest-dom 6.10.0 + DOM 环境（jsdom 30 或 happy-dom 20，见 §5）** | 全部 peer 与 react 19.2 / vue 3.5 / vite 7 兼容；vitest 5 与 jest-dom 7 不满阈值 |

**查不到或按保守处理的项**：react-router v6 的官方维护状态声明（附录 A 待核实）；vue-router 5 的 peer 中 vite / pinia / @pinia/colada 是否为可选 peer（不影响结论，安装时以 `npm install` 是否报 peer 冲突为准）。

---

## 3. 逐题问题

（按批次合并，每题一节；级别：严重 = 会报错或结论错误；概念 = 过时 / 追新 / 不准确；生产 = 演示写法与生产写法不符；小问题。）

**问题统计（30 题，不含 §3.0 全局项）**

| 级别 | 数量 | 说明 |
|---|---|---|
| 严重 | 9 | 5 条是结论与源码 / 官方文档相反（15、18×3、28）；4 条是切换 eslint-plugin-react-hooks 7 `recommended` 预设后该文件 lint 失败（21、23、24、27），取决于 §5.5 |
| 概念 | 71 | 过时 / 追新 / 绝对化 / 模式差异讲成框架差异 / 不准确对比 |
| 生产 | 14 | 演示写法未标「演示简化」或缺生产做法 |
| 小问题 | 82 | 模板残留、交叉引用、措辞、轻微不一致 |
| **合计** | **176** | 平均每题约 6 条；18 题最多（22 条），06 / 13 最少 |

每题的问题表见下；先看 §3.0 的全局项，再看 §4.2 的逐题处置表定优先级。

### 3.0 全局与基础设施问题（不属于单题，阶段 1 / 阶段 4 处理）

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `package.json:20`；`src/main.tsx:9`、`src/shell/App.tsx:5`、`src/shell/TopicPage.tsx:7`、`src/topics/18-routing/react/Example.tsx:55` | 依赖与 4 处导入都用 `react-router-dom`。v7 的 `react-router-dom` 只是 2 行转发（`export * from 'react-router'` + `RouterProvider/HydratedRouter` 来自 `react-router/dom`），v8 已删除该包 | `node_modules/react-router-dom/dist/index.mjs`；附录 A-C | 阶段 1：依赖改为直接依赖 `react-router`（当前只是 react-router-dom 的传递依赖），4 处导入改为 `from 'react-router'`；站点壳的改动按规格规则 10 在报告中说明（这是「依赖调整必须修改」的情形）。壳只用到 BrowserRouter/Routes/Route/Link/NavLink/useParams，都在 `react-router` 主入口 |
| 概念 | `README.md:12`、`README.md:444-445` | README 把 React Router v7 描述为「当前主流」且「v7 的声明式用法与 v6 完全相同——学一份经验通吃 v6/v7」；没有提 v8（2026-06 首发、已是 npm latest）、v6 EOL、导入路径变化 | 附录 A-C（v8 升级指南、v6 EOL 博客）；§2 | 阶段 4 改为「主线 v7，写法兼容 v8；v6 已 EOL，仅作旧写法对照」，删掉「完全相同」 |
| 概念 | `README.md:405-424`（当前完成状态）、`README.md:426-435`（验证命令，标注 2026-09-02） | 「部分完成 / 待完善」列出的缺口（19 题未用 useActionState、无 Suspense/use()、React Compiler 未启用、无测试、无 SSR）与规格 §7/§8 的缺口一致，但没有成熟度标签，且验证结果日期已过期 | 本报告 §4 | 阶段 4 按最终主题清单重写这两节；验证表加上 `test` 脚本 |
| 生产 / 工具链 | `eslint.config.js:33` | react-hooks 规则只作用于 `**/*.tsx`。含 Hook 的 `.ts` 文件不受 `rules-of-hooks` / `exhaustive-deps` 约束：`14-composable-and-custom-hook/react/useDebouncedValue.ts`、`react/useWindowWidth.ts`（两个自定义 Hook）、`16-global-state/react/cartStore.ts`（Zustand store，无 Hook 调用但同目录）。注释说这是为了避开 Vue composable，但 Vue 侧 composable 都在 `vue/` 目录 | `eslint.config.js:30-40`；`src/topics/14-…/react/*.ts` | 阶段 1：把 react-hooks 块的 `files` 改为 `['**/*.tsx', 'src/topics/*/react/**/*.ts', 'src/shell/**/*.ts', 'src/bridge/**/*.ts']`（仍排除 `vue/`）；顺带评估是否改用 `reactHooks.configs.flat.recommended`（7.1.1 已含编译器规则，见附录 A-F；当前只开两条） |
| 结构 | `package.json`（无 `test` 脚本）；`tsconfig.json`（`types: ["vite/client","node"]`，单一 tsconfig，`include: ["src","vite.config.ts"]`） | 没有任何测试基础设施，规格 §2 第 9 条「关键结论有自动化测试证明」目前无法满足 | §0 基线；§2 候选依赖表 | 阶段 1：新增 vitest 4 + Testing Library（清单见 §5.2），`vite.config.ts` 加 `test` 块（或独立 `vitest.config.ts`），tsconfig `types` 加 `vitest/globals`（若用 globals）与 `@testing-library/jest-dom`，`include` 加测试目录；测试文件放 `src/topics/<NN>/__tests__/` 或与示例同目录，需你在 §5 决定 |
| 结构 | `src/shell/topicRegistry.ts`（`import.meta.glob('../topics/*/react/Example.tsx')` 等 4 个 glob） | 站点只加载 / 展示每题的 `Example.tsx` 与 `Example.vue` 源码；辅助文件（18 题 `router.ts`、`auth.ts`、5 个页面，14 题的两个 Hook，16 题的 store 等）在页面里看不到源码 | `topicRegistry.ts:262-290` | 不是错误；建议阶段 2 改 18 题时评估是否把「源码查看」扩展到目录下全部文件（属于站点壳改动，需你确认） |
| 一致 | 全部 30 题的 `react/Example.tsx` 与 `vue/Example.vue` 文件头 | 现有文件头统一为「学习主题 / React 核心概念 / Vue 对应概念 / 最重要的区别」四段；规格 §9 要求十段（适用版本、最后核对、前置主题、成熟度、30 秒速答、追问、易错点、生产注意、旧写法对照、新动向、练习、参考） | 规格 §9 | 阶段 2 逐题重写文件头；建议先在 18 题样板上定稿模板措辞 |
| 小问题 | `src/topics/06-list-and-key/react/Example.tsx:93,169,236,239,240`、`vue/Example.vue:49,123,201,203,204` | 交叉引用写成「第 9 题 / 第 4 题 / 第 8 题 / 第 10 题」，其余 29 题都是补零的「09 题 / 见 09 题」 | grep | 阶段 4 统一为「NN 题」两位数格式 |
| 小问题 | `src/shell/topicRegistry.ts:193` | 26 题 summary 写「对照 Vue 永远新鲜的 .value」——绝对化用词出现在站点文案里 | grep | 改为「对照 Vue 中通过 `.value` 总能读到当前值」 |
| 小问题 | `src/topics/13-slots-and-children/react/Example.tsx:129`（工作区未提交改动） | 全角「（ ）：」被改成半角「( ) :」并多了一个空格，与全仓库全角标点惯例不一致，疑似误改 | `git diff` | 见 §5：建议 `git checkout` 还原；阶段 0 未动它 |
| 备注 | `vite.config.ts` | `react({ exclude: [/\/node_modules\//, /\.vue$/] })` 是为将来 Vite 8 + plugin-react 6 预留的保险；当前 plugin-react 5.2.0 自己已排除 `.vue` 子模块 | 文件内注释；§2.2 vite 结论 | 保持 Vite 7；不为升级而升级 |

**共性观察（供阶段 2 制定模板时参考）**：
- 「没有一一对应关系」在 59 个文件里出现 118 次，且分布均匀（每题 1～5 处），说明它是模板性写法而不是逐处核实的结论；阶段 2 应逐处改为「说明原因和适用范围」或删除（规格 §2 第 8 条）。
- 30 题代码里没有用到 React 19 的 Actions 家族（`useActionState` / `useFormStatus` / `useOptimistic` / `<form action>`）、`use()` / `Suspense`、`useTransition` / `useDeferredValue`、`lazy`、`useId`、`<Activity>`、`useSyncExternalStore`（仅 30 题为 devtools 面板用了一次）——规格 §7 的【主流】清单中约一半在代码层面为空白，只在 07/19 题注释里提了名字。
- 旧写法（`forwardRef`、`.Provider`、`defaultProps`、`propTypes`、`ReactDOM.render`、`react-dom/test-utils`）在代码里一处都没有，只在 02/12/15/18 题的说明性注释里出现，且都标为已废弃——方向正确，但缺「从哪个版本开始变化」与【旧写法】标签。

<!-- BATCH-RESULTS-START -->

### 01. 组件与 JSX（没有模板 DSL，一切都是 JavaScript）
- 文件：`react/Example.tsx`（121 行）、`vue/Example.vue`（109 行）
- 用到的库 / API：React：`import type { CSSProperties } from 'react'`、JSX / Fragment（仅注释提及）、`style={{}}` 对象、`className`；Vue：`<script setup lang="ts">`、插值 `{{ }}`、`:class` 对象语法、`:style` 对象 / 数组语法
- 交叉引用：指向 → [03]（`react/Example.tsx:33` useState）；被引用 ← [无]；不成立的引用：无
- 覆盖检查（§7 / §8）：缺失：挂载入口 `createRoot` 与 `ReactDOM.render`【旧写法】对照（§5.A 列表项）；新 JSX transform 的版本说明（17 引入、19 必须）；`<Fragment key>` 写法；Vue render 函数 / JSX 对照（见下表）；19.3 Fragment refs【尝鲜】可一句带过。标签缺失：全部知识点
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:63, 69`；`vue/Example.vue:77-78` | 「JSX 是表达式，Vue 的模板片段做不到 / Vue 模板里没有等价写法 / 没有一一对应关系」把模板模式的限制讲成框架差异（§5.C、§5.H）：Vue 官方支持 render 函数与 JSX/TSX，`h()` 返回的 vnode 同样可以存变量、当参数传、被 return，`setup()` 也可直接返回 render 函数 | https://vuejs.org/guide/extras/render-function.html（"there are situations where we need the full programmatic power of JavaScript. That's where we can use the render function"；`const vnode = h('div', { id: 'foo' }, [])`；`return () => h('div', …)`） | 改为「Vue 的模板语法里没有等价物；改用 render 函数 / JSX（需 @vitejs/plugin-vue-jsx，非主流写法）时有」，删除「没有一一对应关系」 |
| 小问题 | `react/Example.tsx:59-60` | `<div className="card" /> ≈ jsx('div', …)` 未限定版本：这是 React 17 引入的自动运行时（`react/jsx-runtime`）形式，React 19 起必须使用新 transform；老代码里的 `React.createElement` 形式应作【旧写法】对照 | facts-sheet B「升级指南：新行为…必须使用新 JSX transform」；https://react.dev/blog/2024/04/25/react-19-upgrade-guide | 加版本限定 + 一行【旧写法】对照 |
| 小问题 | `vue/Example.vue:40` | `avatarStyle` 未标类型，与 React 侧 `CSSProperties` 不对称；Vue 同样导出 `CSSProperties`（`import type { CSSProperties } from 'vue'`），标上可获得类型检查 | `node_modules/@vue/runtime-dom/dist/runtime-dom.d.ts:96`（`export interface CSSProperties`）、`:295`（`StyleValue`） | 补类型标注（可选） |

- 结构建议：保留 —— 内容基本准确；「数字自动补 px（React）/ 不补 px（Vue）」已按源码核实成立（`react-dom-client.development.js:2730-2735` 非 unitless 数字拼 `"px"`；`@vue/runtime-dom/dist/runtime-dom.cjs.js:534` 直接 `style[prefixed] = val`），只需补标签、版本限定与文件头
- 待核实：无

---

### 02. Props（类型声明、默认值与单向数据流）
- 文件：`react/Example.tsx`（218 行）、`vue/Example.vue`（127 行）、`vue/OrderCard.vue`（54 行）、`vue/UiButton.vue`（55 行）
- 用到的库 / API：React：`import type { ComponentPropsWithoutRef } from 'react'`、参数解构默认值、`{ ...rest }` 透传、交叉类型；Vue：`defineProps` / `withDefaults`、`defineOptions({ inheritAttrs: false })`、`useAttrs`、`v-bind="attrs"`、`computed`、`<slot />`
- 交叉引用：指向 → [04, 08, 09, 12, 13, 28]（`react/Example.tsx:8, 66`→08；`:69`→09；`:14`→28；`:120`→12；`:162`→04；`vue/UiButton.vue:47`→13）；被引用 ← [12, 28]；不成立的引用：无（08 讲 callback props、09 讲 computed vs 渲染时算、12:28-29 反向引用了本题 UiButton、13 讲 children/slot、28 讲事件类型 / ReactNode，均核实）
- 覆盖检查（§7 / §8）：缺失：`ref` 作为 prop 的实际演示【主流】（仅 `:118-120` 一句「小知识」，且示例类型不允许传 ref，见下表）；旧写法对照（`defaultProps` / `propTypes` / `forwardRef` 的版本与标签）；Vue 3.5 响应式 props 解构（`vue/OrderCard.vue:22`）已提及但未标成熟度。标签缺失：全部知识点
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:28-29, 65`；`vue/Example.vue:29-30`；`vue/OrderCard.vue:27` | 「React 不警告、纯靠约定 / 改 props 往往不报错」不准确：开发构建下 React 会 `Object.freeze(element.props)`，函数组件拿到的就是这个冻结对象，在严格模式模块（ESM/TS 输出）里 `props.amount = 0` 会抛 TypeError；生产构建不冻结、静默生效。只有像 `:63` 那样改「解构出的局部变量」才两种构建都无声无息 | `node_modules/react/cjs/react-jsx-runtime.development.js:193` `Object.freeze && (Object.freeze(type.props), Object.freeze(type))`；抛错 vs 静默取决于严格模式与构建：需运行验证 | 改为「开发构建冻结 props 对象，直接赋值会抛 TypeError；生产构建静默；改解构后的局部变量任何构建都不报错——这才是本例演示的坑」 |
| 概念 | `react/Example.tsx:19, 55`；`vue/Example.vue:20, 35`；`vue/OrderCard.vue:4`；`vue/UiButton.vue:3` | 「SFC 一个文件只能有一个组件 / 子组件必须放单独的 .vue 文件」是模板模式的限制而非 Vue 的限制（§5.C）：SFC 规范只规定「至多一个顶层 `<template>`」，同一文件里用 `defineComponent` + render 函数 / JSX 可以定义多个组件 | https://vuejs.org/api/sfc-spec.html "Each *.vue file can contain at most one top-level `<template>` block"；https://vuejs.org/guide/extras/render-function.html | 改为「一个 SFC 只能有一个模板组件；同文件多组件要走 render 函数 / JSX（非主流），所以对照版拆成单独 .vue」 |
| 概念 | `react/Example.tsx:20-21, 30-31, 99-100`；`vue/Example.vue:21-22, 31-32`；`vue/UiButton.vue:7-12` | Vue 自动透传的描述缺前提：只有【单根】组件才自动透传；多根组件不会自动透传、开发期告警，必须显式 `v-bind="$attrs"`；已声明的 props 与 `emits` 里的事件不在 `$attrs` 中 | https://vuejs.org/guide/components/attrs.html "components with multiple root nodes do not have an automatic attribute fallthrough behavior. If $attrs are not bound explicitly, a runtime warning will be issued"；"The $attrs object includes all attributes that are not declared by the component's props or emits options" | 补「单根组件」前提与「emits 已声明的事件不透传」例外 |
| 概念 | `react/Example.tsx:7`；`vue/Example.vue:8` | 「defaultProps / PropTypes 是过时写法，TypeScript 时代不再使用」未写从哪个版本变化、未标【旧写法】：React 19 移除函数组件的 `defaultProps` 与 `propTypes`（静默忽略），类组件 `defaultProps` 仍支持；`forwardRef` 在 @types/react 19.2.18 中未标 @deprecated，仅官方博客称被 ref-as-prop 取代（`:59` 单独那句「函数组件里 React 19 已移除支持」是对的） | facts-sheet A：`@types/react/index.d.ts:1060-1075` `FunctionComponent` 无 `defaultProps`、`:1152` `ComponentClass` 仍有 `defaultProps?`、`propTypes` 标 @deprecated；facts-sheet B：升级指南 "Removed deprecated React APIs" | 文件头改为「React 19 起移除（函数组件）；类组件 defaultProps 仍可用；React 18 存量项目仍会见到」并标【旧写法】 |
| 生产 | `react/Example.tsx:12-13, 111-125, 133` | 以「shadcn/ui、MUI 的通用 API 写法」介绍的 UiButton 用 `ComponentPropsWithoutRef<'button'>`：在 React 19 主线下 `ref` 已是普通 prop，父组件 `<UiButton ref={r}>` 会被类型拒绝（props 类型里没有 ref），而运行时它本可随 `...rest` 落到 `<button>`；`WithoutRef` 是 forwardRef 时代的搭配。组件库按钮不能接 ref（焦点管理）不算生产写法 | `@types/react/index.d.ts:1452`（`ComponentProps` 含 ref）、`:1530` `type ComponentPropsWithoutRef<T> = PropsWithoutRef<ComponentProps<T>>`；facts-sheet A「ref 作为 prop」 | 主线改用 `ComponentProps<'button'>` 并演示 `<UiButton ref={…}>`【主流】；`forwardRef + ComponentPropsWithoutRef` 放旧写法对照【旧写法】 |
| 小问题 | `react/Example.tsx:31-32, 106-107`；`vue/UiButton.vue:32` | 「根本不存在 / 唯一手段 / 没有一一对应关系」：结论本身成立（React 任何版本都没有自动透传），但按 §2.4 应改为有边界表述 | — | 改为「React 没有自动透传机制，需显式 `{...rest}`；className 合并靠 cn/clsx 之类工具」 |

- 结构建议：修改 —— 主体讲解正确且面试价值高，但「React 不警告」与「SFC 一文件一组件」两条结论要纠正，UiButton 要按 React 19 的 ref-as-prop 重写类型
- 待核实：`props.amount = 0` 在本项目构建下是抛 TypeError 还是静默（取决于模块是否严格模式），需运行验证

---

### 03. State（useState 与不可变更新 —— React 与 Vue 最核心的思维差异）
- 文件：`react/Example.tsx`（399 行）、`vue/Example.vue`（318 行）
- 用到的库 / API：React：`useState`（含泛型）、`useReducer`（含判别联合 Action、never 穷尽检查）、函数式更新、`Object.is` 语义；Vue：`ref`、`reactive`、`computed`、`v-model`、`<template v-if / v-else>`
- 交叉引用：指向 → [05, 06, 07, 10, 14, 16, 17, 23, 24, 26, 29]（`react/Example.tsx:294`→05；`:366`→06；`:264`→07；`:63`→10/14；`:21, 232`→16；`:229`→17；`:71`→23/24；`:64`→26；`:241`→29；`vue/Example.vue:22, 107`→16；`:74`→23/24；`:110`→29）；被引用 ← [07, 10, 18, 21, 23, 24, 28, 29, 30]；不成立的引用：`react/Example.tsx:63`「（10、14 题会再遇到）」—— 14 题只用 setTimeout 做防抖，全文没有「过期闭包 / 快照」内容（grep 无命中），真正讲这个的是 10 题（:10, 29, 103）与 26 题（:12-17）
- 覆盖检查（§7 / §8）：缺失：`useState(() => …)` 惰性初始化【主流】（06 题用到但本题未讲）；`Object.is` 跳过渲染的例外说明（React 可能仍调用一次组件再丢弃结果）；eslint-plugin-react-hooks 7 的 `immutability` / `set-state-in-render` 规则【较新】能静态抓到「直接改 state」（本仓库 `eslint.config` 只手动开了 rules-of-hooks / exhaustive-deps，未启用 `recommended` 预设）；Immer 作为嵌套更新加分项；React Compiler 对手写不可变更新的影响【较新】。标签缺失：全部知识点
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:293-294` | 「`state.error &&` 左边是空串时会把空串渲染出来，虽然肉眼看不见」与源码相反：react-dom 协调时对 `""` 直接跳过，不会创建文本节点；会被渲染成文本的是数字（含 0）、NaN、bigint | `node_modules/react-dom/cjs/react-dom-client.development.js:6318, 6411, 6497, 7061` `("string" === typeof newChild && "" !== newChild)` | 改为「空串本身不会被渲染，但同类写法遇到数字 0 就会把 0 打到页面上；养成把 && 左侧写成布尔值的习惯」 |
| 小问题 | `react/Example.tsx:44` | 「上面 changeQuantity 的注释里反复强调…」位置写反：`changeQuantity` 定义在本区块之后（`:332`） | 本文件 | 改为「下面 Example 里 changeQuantity 的注释」 |
| 小问题 | `react/Example.tsx:63` | 交叉引用「10、14 题」中的 14 不成立（见上） | `14-composable-and-custom-hook/react/Example.tsx` 全文 grep「过期闭包 / 快照」无命中 | 改为「10、26 题」 |
| 小问题 | `react/Example.tsx:312-313` | 「Vue …只有依赖那个属性的渲染副作用会重新执行，粒度比 React 精细得多」易被读成 DOM 节点级更新：Vue 依赖追踪的单位是组件的 render effect（整组件 render 函数重跑 + VDOM diff），精细之处在于「只重跑依赖它的组件」和编译期 patch flag / 块树缩小 diff；节点级更新是 Vue 3.6 Vapor Mode【尝鲜】 | https://vuejs.org/guide/extras/rendering-mechanism.html "This step is performed as a reactive effect… When a dependency used during mount changes, the effect re-runs… compares it with the old one"；facts-sheet I（3.6 仍为 RC） | 加限定「组件级 render effect；靠编译期信息缩小 diff；Vapor【尝鲜】才更细」 |
| 小问题 | `react/Example.tsx:69, 82, 228, 336` | 「永远」四处：结论均成立（updater 收到队列前一个更新的结果；dispatch 身份稳定；读 state 变量得到本次渲染快照），但按 §2.4 建议加限定（如「同一组件实例生命周期内」「读 state 变量时；ref.current 例外」） | react.dev/reference/react/useReducer "React guarantees that the dispatch function identity is stable" | 措辞加限定 |

- 结构建议：修改 —— 三个区块（购物车不可变更新 / 快照计数 / useReducer 入门）讲解准确且与 23 / 24 / 29 分工清楚，保留结构；只需纠正空串论断、修正两处引用、补惰性初始化与 lint 规则加分项
- 待核实：无

---

### 04. 事件处理（onClick、事件对象、传参、冒泡与默认行为）
- 文件：`react/Example.tsx`（137 行）、`vue/Example.vue`（146 行）
- 用到的库 / API：React：`useState`、`import { type MouseEvent } from 'react'`（合成事件类型）、`e.stopPropagation()` / `e.preventDefault()`、`e.clientX`；Vue：`ref`、`@click`、`.stop` / `.prevent` 修饰符、`$event`、内联处理器
- 交叉引用：指向 → [无]；被引用 ← [02, 06]；不成立的引用：无
- 覆盖检查（§7 / §8）：缺失：`e.nativeEvent`；事件委托挂在 root 容器（React 17+）【主流】与 document 委托【旧写法】；事件池移除 / `e.persist()`【旧写法】；`onScroll` 不冒泡（17+）；passive 事件与 `preventDefault` 失效；`onClickCapture`（对照 `.capture`）；`.self` 对照 `e.target === e.currentTarget`；`.once` 对照；`MouseEventHandler<T>` 写法与 28 题衔接；键盘事件 / `e.key`。标签缺失：全部知识点
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:7-8, 45-46`（文件头与正文对「合成事件」的全部描述） | 合成事件 / 冒泡的描述没有任何版本限定与机制说明：React 17 起事件委托挂在 root 容器而非 `document`、事件池已移除（`e.persist()` 成【旧写法】）、`onScroll` 不再冒泡、`onFocus/onBlur` 底层改用 focusin/focusout、`onXxxCapture` 使用真正的捕获阶段。这些正是「合成事件」面试的标准追问，且直接关系本题的「冒泡」演示（root 委托意味着 `stopPropagation` 挡不住挂在 `document` 上的原生监听） | https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html（"attach them to the root DOM container into which your React tree is rendered"、"The old event pooling optimization has been fully removed"、"The onScroll event no longer bubbles"、"Capture phase events … now use real browser capture phase listeners"）；`node_modules/react-dom/cjs/react-dom-client.development.js:19209` `listenToAllSupportedEvents(rootContainerElement)`、`:28057, 28113` 在 `createRoot/hydrateRoot` 的 container 上调用 | 文件头加「React 17+：委托到 root、无事件池、onScroll 不冒泡」并标版本；`document` 委托与 `e.persist()` 放【旧写法】 |
| 概念 | `react/Example.tsx:9-10, 63-65` | 「阻止默认行为手动 `e.preventDefault()` 即可」缺边界：react-dom 把 `touchstart` / `touchmove` / `wheel` 注册为 passive 监听，`onWheel` / `onTouchStart` 里调用 `e.preventDefault()` 不生效（浏览器忽略并告警），需要 ref + 原生 `addEventListener(…, { passive: false })`；Vue 侧对应 `.passive` 修饰符（本例 click 不受影响，但文件头写成了通用结论） | `node_modules/react-dom/cjs/react-dom-client.development.js:19250-19265`（三种事件 → `passive: !0`）；React 17 RC 博客 "Keep onTouchStart, onTouchMove, and onWheel passive" | 补一句限定与解法，并给 Vue `.passive` 对照 |
| 小问题 | `react/Example.tsx:103-104` | 「`onClick={removeItem(item.id)}` …还会因『渲染中 setState』触发死循环警告」：本例三个渲染阶段 setState 后列表变空即收敛，达不到 25 次重渲染上限，不会出现该错误；而且 TS 会先因 `void` 不能赋给 `onClick` 报类型错 | `react-dom-client.development.js:7748` "Too many re-renders…"（仅在渲染阶段更新不收敛时抛出）；需运行验证 | 改为「渲染时就执行了、TS 也直接报错；只有更新不收敛时才会抛 Too many re-renders」 |
| 小问题 | `vue/Example.vue:16`（文件头） | 「`$event` 就是原生 DOM 事件对象」只对原生元素成立；监听子组件 emit 的事件时 `$event` 是 emit 的载荷 | 待核实（本次未抓取 vuejs.org 组件事件页原文） | 加限定「原生元素上」 |

- 结构建议：修改 —— 演示本身（冒泡计数、stop/prevent、传参包箭头函数）准确好用；缺的是「合成事件到底是什么、17 起怎么变、passive 例外」这层面试必问内容
- 待核实：Vue 文档中「组件事件的 `$event` 为 emit 载荷」的原文措辞

---

### 05. 条件渲染（三元、&&、提前 return / switch、映射对象）
- 文件：`react/Example.tsx`（146 行）、`vue/Example.vue`（145 行）
- 用到的库 / API：React：`useState`、三元 / `&&` / `switch` 子组件、`style={{ display }}`、`Record` 映射表；Vue：`ref`、`v-if / v-else-if / v-else`、`v-show`、插值三元
- 交叉引用：指向 → [无]；被引用 ← [03, 18, 28]；不成立的引用：无
- 覆盖检查（§7 / §8）：缺失：组件 `return null` 渲染空（文件头 `:5` 写了「if / switch 提前 return」，示例里没有 `return null` 场景）；同位置同类型分支复用实例 / 保留 state（与 06 的 key 衔接，react.dev「Preserving and Resetting State」）；`<Activity>`【较新】（见下表）；Vue 侧 v-if 与 v-show 的成本取舍（惰性渲染 vs 初始渲染开销）、`<template v-if>` 分组。标签缺失：全部知识点
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:16, 133-134`；`vue/Example.vue:17, 133-134` | 「v-show 在 React 没有对应物（没有一一对应关系），只能手动控制 style 的 display」对 React 19.2 已过时（§5.A 过时 + §5.H）：19.2 稳定导出的 `<Activity mode="hidden">` 用 `display: none` 隐藏并保留 state（差异：会清理 Effects，恢复时重建），是 v-show 最接近的官方对应物【较新】；纯手动方案也不止 `style`（`hidden` 属性 / CSS class） | https://react.dev/reference/react/Activity "React will visually hide its children using the display: 'none' CSS property. It will also destroy their Effects… reveal the children with their previous state restored"；facts-sheet A：`react.development.js:795` `exports.Activity`、`@types/react/index.d.ts:1995-2015` `@version 19.2.0` | 改为「主线：手动 style / hidden 控制【主流】；【较新】React 19.2 `<Activity mode="hidden">`（保留 state、清理 effect，与 v-show 不完全等价）」，删掉「只能」与「没有一一对应关系」 |
| 小问题 | `react/Example.tsx:7, 109` | 「JSX 不渲染的只有布尔值、null、undefined」漏了空字符串 `""`（同样不渲染）；会渲染的是数字 0 / NaN / bigint | `react-dom-client.development.js:6318` `("string" === typeof newChild && "" !== newChild)` | 补「空串也不渲染」 |
| 小问题 | `react/Example.tsx:25`；`vue/Example.vue:60-61` | 「Vue SFC 是一文件一组件」同 02 题问题（模板模式限制，非框架限制） | 见 02 题依据（vuejs.org/api/sfc-spec.html） | 与 02 统一措辞 |

- 结构建议：修改 —— `0 &&` 陷阱、v-if 对照、映射表讲解均核实无误（Vue `v-if` 按真值判断、插值里 `0 &&` 会渲染 0 的补充也对）；只需补 `<Activity>`【较新】与 `return null`
- 待核实：无

---

### 06. 列表渲染与 key（.map() 对照 v-for，index 作 key 的坑）
- 文件：`react/Example.tsx`（250 行）、`vue/Example.vue`（211 行）、`vue/OrderNoteEditor.vue`（35 行）
- 用到的库 / API：React：`useState`（含惰性初始化 `useState(() => …)`）、`key`（列表 + 强制重置两种用法）、非受控 `<input>`（刻意）；Vue：`ref`、`computed`、`v-for` + `:key`、`defineProps`、`v-model`。注：本题 React 文件**没有**实际调用 `useEffect`（只在 `:234, 241` 注释里作为反模式提及，import 也只有 `useState`），任务线索里「有 useEffect 用法」不成立
- 交叉引用：指向 → [04, 08, 09, 10]（`react/Example.tsx:169`、`vue/Example.vue:123`→04；`:240` / `:204`→08；`:93, 239` / `:49, 203`→09；`:236` / `:201`→10）；被引用 ← [10, 22, 23, 24, 26, 27, 29]；不成立的引用：`react/Example.tsx:240`、`vue/Example.vue:204`「把 state 提升到父组件（第 8 题）」—— 08 题只讲 callback props 机制，并在 `08-parent-child-communication/react/Example.tsx:24-25` 明确把「状态提升 / 归属」交给 25 题；其余引用核实成立（09 讲派生值；10 题 `:331-334` 确有 effect 反模式清单且含「props 变化时重置 state → 加 key」）
- 覆盖检查（§7 / §8）：缺失：`<Fragment key={…}>`（每项渲染多个元素时）；key 只需兄弟间唯一、不要在渲染时生成随机 key；eslint-plugin-react-hooks 7 的 `set-state-in-effect`【较新】能静态抓到 `:234` 的反模式（本仓库未启用 recommended 预设）；列表虚拟化可指向 §8.3；Vue 3 `<template v-for>` 的 key 放在 template 上。标签缺失：全部知识点
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 小问题 | `react/Example.tsx:240`；`vue/Example.vue:204` | 交叉引用指向错误：状态提升在 25 题，不在 08 题 | `08-parent-child-communication/react/Example.tsx:24-25`；`topicRegistry.ts:184-188` | 改为「25 题（状态提升与 state 归属）」 |
| 小问题 | `react/Example.tsx:93, 169, 236, 239, 240`；`vue/Example.vue:49, 123, 201, 203, 204` | 交叉引用写作「第 9 题 / 第 4 题 / 第 10 题 / 第 8 题」不补零，与全站「06 题」格式不一致（全站唯一） | 本文件 | 统一为「09 题」格式 |
| 小问题 | `vue/Example.vue:199-201` | 把 `watch(() => props.order, …, { immediate: true })` 称为 Vue 的「反模式」：Vue 官方文档没有此类批评，watch 同步派生状态在 Vue 里是常见写法；换 `:key` 只是更简洁 | 待核实（vuejs.org 未见相关「反模式」表述） | 改为「常见写法但多一步同步；换 :key 更直接」 |
| 小问题 | `react/Example.tsx:25`；`vue/Example.vue:26, 190` | 「机制、写法、心智模型都一模一样 / 完全一致」：结论成立，但两边卸载触发的钩子不同（Vue `onUnmounted`、React effect 清理），按 §2.4 加一句限定 | — | 「机制一致，钩子名称与 effect 清理时机不同」 |
| 小问题 | `react/Example.tsx:50`；`vue/OrderNoteEditor.vue:4` | 「SFC 一文件一组件」同 02 题问题 | 见 02 题依据 | 与 02 统一措辞 |

- 结构建议：保留 —— 两个演示（index 作 key 错位、换 key 重置 state）设计好、结论与 react.dev「Preserving and Resetting State」一致，Vue 侧对照（就地更新策略、`:key` 重建实例、`ref` 初始值不跟 props 走）也核实无误；只需修正引用格式与指向
- 待核实：Vue 官方是否有把「watch 同步 props 派生状态」定性为反模式的表述

---

### 07. 表单处理（受控组件 vs v-model）
- 文件：`react/Example.tsx`（358 行）、`vue/Example.vue`（304 行）
- 用到的库 / API：无第三方库；React：`useState`、`useRef<HTMLInputElement>(null)`、`ChangeEvent`/`FormEvent` 类型、`defaultValue`/`defaultChecked`、`key` 重置、`readOnly`；DOM：`FormData`、`e.currentTarget`；Vue：`reactive`、`ref`、`v-model`（text/select/checkbox）、`@submit.prevent`、模板 ref
- 交叉引用：指向 → [03, 12, 19]；被引用 ← [03, 19, 22, 25, 26, 27, 28, 29]；不成立的引用：无（`19 题提到过 useActionState` 成立：19/react/Example.tsx:10-11 确有一句提及，但 19 把它写成「新趋势」——那是 19 题的问题；`12 题讲过 useRef` 成立：12/react/Example.tsx:5）
- 覆盖检查（§7 / §8）：缺失：§8-5「React 19 表单与 Actions」整块——`<form action>`、`useActionState`、`useFormStatus`（react-dom）、`useOptimistic` 全项目零实现（grep 全 src/topics 只命中 07 与 19 的注释）；`<form action>` 成功后「非受控字段会被重置」这一与本题非受控区块直接相关的行为未提；标签缺失：受控/非受控【主流】、`<form action>`【主流·19.0】未标
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:19-21`、`react/Example.tsx:244-246`、`vue/Example.vue:20-22` | React 19.0（2024-12）的 `<form action>` / `useActionState` / `useFormStatus` 属【主流】，本题只在两处注释里说「本项目没有实现 form actions」，并把它推给 19 题——而 19 题也只有一句「新趋势」；受控/非受控之外的第三条主线在全站缺席 | facts-sheet §B「React 19.0 列表」；react.dev/reference/react-dom/components/form：「The function passed to `action` may be async and will be called with a single argument containing the form data」「Unlike `onSubmit`, an `action` runs in a Transition and calling `e.preventDefault()` isn't needed」「After the `action` function succeeds, all uncontrolled field elements in the form are reset」；grep `useActionState\|useFormStatus\|useOptimistic\|action={` 全 src/topics 仅命中 07:19-21,244-246 与 19:10-11 | 拆出新题「React 19 表单 Actions」（见结构建议）；07 本题保留 2-3 行指引并写明成熟度：「onSubmit + preventDefault + 手写 FormData【主流】仍是非 Action 表单的默认写法；`<form action={fn}>` 自 19.0 起【主流】，fn 直接收到 FormData、跑在 Transition 里、成功后重置非受控字段」；`useFormState`→`useActionState` 更名放【旧写法】并标「待核实」（facts-sheet §B 未在官方页命中） |
| 概念 | `react/Example.tsx:28-29`、`react/Example.tsx:108-109`、`vue/Example.vue:29-30`、`vue/Example.vue:104-107`、`vue/Example.vue:221-222` | 把「受控 / 非受控」说成「React 特有的概念、在 Vue 里基本不存在、没有一一对应关系」——这是把成本模型差异讲成框架差异（§5.C）：Vue 原生 `v-model` 本身就是受控模式的实现（指令在 `created` 监听 input 写回、在 `beforeUpdate` 把绑定值推回 `el.value`），本文件自己也演示了 Vue 的非受控版（静态 `value` + FormData）；真正不同的是 Vue 不因输入重跑组件，以及「只写 value 不写监听」的表现相反 | `node_modules/@vue/runtime-dom/dist/runtime-dom.cjs.js:1522-1577`（`vModelText.created/beforeUpdate`，`el.value = newValue`）；`runtime-dom.cjs.js:591-600`（静态 `value` 走 `patchDOMProp` 写 DOM prop，只在挂载时执行一次）；本文件 `vue/Example.vue:226-260` 已实现 Vue 非受控版 | 改为：「两种模式 Vue 都有：v-model = 受控（语法糖），静态 value + FormData = 非受控；差别在成本模型（Vue 不重跑组件，所以没有'为性能改非受控'的动机）和 value-only 的行为相反」；删掉「React 特有 / 没有一一对应关系」 |
| 小 | `react/Example.tsx:35`、`vue/Example.vue:36`、`vue/Example.vue:145` | §5.H 模板残留：这三句自己就在陈述对应关系（v-model ≈ :value + @input ≈ value + onChange），句尾却贴「没有一一对应关系」 | 同上（`vModelText` 即 value+listener 的封装） | 改为「对应关系：v-model ≈ value + onChange（+ name 分发）；差别只是 Vue 有语法糖」 |
| 小 | `react/Example.tsx:18`、`react/Example.tsx:106`、`vue/Example.vue:19` | 「react-hook-form … 输入时根本不 setState」——第三方库论断，来源不在允许清单内，且绝对化（订阅 `formState`、`watch()`、`Controller` 时仍会重渲染） | 待核实（react-hook-form.com 不在 §1 来源清单内） | 软化为「以非受控 + ref 注册为主，默认不因输入重渲染（订阅 formState / watch 时例外）」并标「待核实」，或改为指向 §8-9 表单工程化题 |
| 小 | `react/Example.tsx:41`、`react/Example.tsx:219-222` | 「React 还会在控制台警告你」——该警告只在开发构建存在，未说明 | `node_modules/react-dom/cjs/react-dom-client.development.js:1423-1433`（"You provided a `value` prop to a form field without an `onChange` handler…"，仅 development 构建） | 加「（开发构建）」三个字 |

- 结构建议：修改 + 拆出新题 —— 07 的受控/非受控主线本身是对的，但 §8-5 的 Actions 四件套是 19.0 起的【主流】且全站为空；建议新题「React 19 表单 Actions（`<form action>` / useActionState / useFormStatus / useOptimistic）」放在 19 题之后（19 题手写 `submitting` + try/finally 正是它们替代的对象，可作【旧写法】对照），07 只保留指针。若不愿加题，则并入 19 作主线、19 现有手写版降为对照。
- 待核实：react-hook-form 的重渲染机制说法（来源不在清单内）；`useFormState` → `useActionState` 更名的官方原文（facts-sheet §B 未命中）。

---

### 08. 父子组件通信（callback props vs emit）
- 文件：`react/Example.tsx`（137 行）、`vue/Example.vue`（80 行）、`vue/ProductItem.vue`（76 行）
- 用到的库 / API：无第三方库；React：`useState`、callback props（`onDelete`/`onRename`）、同文件多组件；Vue：`ref`、`defineProps<{ product: Product }>()`（导入类型）、`defineEmits<{ delete: [id: string]; rename: [...] }>()`（具名元组语法）、`v-for`/`:key`、`@delete`/`@rename`、`v-if`/`v-else` 的 `<template>`
- 交叉引用：指向 → [25]；被引用 ← [02, 16, 22, 25, 27, 28, 30]；不成立的引用：无（25/react/Example.tsx:8,17,267 确讲状态归属并回指 08）
- 覆盖检查（§7 / §8）：缺失：组件级双向绑定的对照——Vue 3.4+ `defineModel` / 组件 `v-model` ↔ React 自定义组件上的 `value` + `onChange` 受控对（这是本题「callback props」最常见的生产形态，也是 Vue 老手最想知道的对应物）；Vue 侧运行时证据「Attempting to mutate prop … Props are readonly」警告未提；标签缺失：整题无【主流】标注；`defineEmits` 具名元组与导入类型均为 3.3+ 未注明
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:21-22`、`vue/Example.vue:22-23`、`vue/ProductItem.vue:14` | 「emit 是 Vue 专门的自定义事件机制；React 完全没有对应物，没有一一对应关系」——结论反了：callback props 正是 emit 的一一对应物。Vue 的 `@delete="fn"` 编译为子组件的 `onDelete` prop，`emit('delete')` 的实现就是查 `props.onDelete` 并调用它；官方渲染函数指南明确「以 on + 大写开头的 prop 即事件监听器，`h(SomeComponent, { onCustomEvent })`」。Vue 多出来的只是声明（defineEmits）、类型化、大小写归一和模板语法上的数据/事件区分 | `node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:4481,4537-4545`（`emit()`：`props[toHandlerKey(event)] || props[toHandlerKey(camelize(event))]` → `callWithAsyncErrorHandling(handler…)`）；vuejs.org/guide/extras/render-function.html#v-on（"Props with names that start with `on` followed by an uppercase letter are treated as event listeners"、`h(SomeComponent, { onCustomEvent: … })`） | 重写「最重要的区别」第一条：「对应物就是 callback props：`@delete` = 传 `onDelete` prop，`emit('delete', id)` = 调 `props.onDelete(id)`；差别是 Vue 用 `defineEmits` 显式声明 + 校验 + 模板里 `:`/`@` 语法分家，React 把两者都当普通 props」；删除三处「完全没有对应物 / 没有一一对应关系」 |
| 概念 | `react/Example.tsx:12`、`vue/Example.vue:13` | 「React 没有独立的『事件系统』」——不准确：React 对 DOM 事件有自己的合成事件系统（React event object / synthetic event，`e.nativeEvent` 取原生事件）；没有的是「组件级自定义事件」机制 | react.dev/reference/react-dom/components/common#react-event-object（"Your event handlers will receive a React event object. It is also sometimes known as a 'synthetic event'"）；`node_modules/react-dom/cjs/react-dom-client.development.js:19113-19120`（`executeDispatch` 设置/清空 `event.currentTarget`） | 改为「React 没有组件级自定义事件机制（DOM 事件另有合成事件系统，见 04 题）：子传父就是普通函数调用」 |
| 小 | `react/Example.tsx:10-11`、`vue/Example.vue:11-12` | 「子组件改了也白改，React 根本不知道」——不是「白改」：`product` 与父 state 是同一引用，`product.name = x` 会就地污染父组件的数据源，下一次任何原因的重渲染都会把改动显示出来；函数体 :68-71 的说法（「UI 与数据源从此对不上」）是准确的，文件头与之不一致 | 本文件 `react/Example.tsx:68-71`；vuejs.org/guide/components/props.html#mutating-object-array-props（"it will be able to mutate the object or array's nested properties"） | 文件头改成与 :68-71 一致：「改了不会触发重渲染，但会就地污染父组件的数据源——比不生效更糟」 |
| 小 | `vue/ProductItem.vue:11`、`vue/ProductItem.vue:15-18` | `defineProps` 引用导入类型、`defineEmits` 具名元组语法都是 Vue 3.3+ 才支持，未注明版本（存量 3.2 项目读者会踩） | vuejs.org/api/sfc-script-setup.html（"3.3+: alternative, more succinct syntax … named tuple syntax"；"In version 3.2 and below … limited to a type literal or a reference to a local interface. This limitation was resolved in 3.3"） | 注释加「（3.3+）」；可顺带给出 3.2 的调用签名式 `defineEmits<{ (e: 'delete', id: string): void }>()` 作【旧写法】 |

- 结构建议：保留 —— 代码与命名约定讲得准（`on*`/`handle*` 只是约定、props 只读、单向数据流），只需重写「emit 无对应物」这条结论并补 `defineModel` 指针。
- 待核实：无。

---

### 09. 派生状态（computed vs 渲染时直接算）
- 文件：`react/Example.tsx`（123 行）、`vue/Example.vue`（117 行）
- 用到的库 / API：无第三方库；React：`useState`、`useMemo`（演示）、提及 `React.memo`；Vue：`ref`、`computed`（含 computed 链）、注释中的 `watch(..., { deep, immediate })` 反模式
- 交叉引用：指向 → 无（未引用任何题；但 17 题 :97 回指本题）；被引用 ← [02, 14, 16, 17, 18, 22, 23, 24, 25, 28, 29, 30]；不成立的引用：无
- 覆盖检查（§7 / §8）：缺失：React Compiler【较新】对手写 `useMemo` 的影响（本题核心论点「useMemo 只在昂贵/引用稳定时用」在编译器时代需要一句补充）；与 17 题（useMemo/useCallback）的分工与指向；标签缺失：「渲染时直接算」【主流】、`useMemo`【主流】、React Compiler【较新】均未标
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:14`、`react/Example.tsx:18-21`、`react/Example.tsx:69`、`vue/Example.vue:15`、`vue/Example.vue:19-22`、`vue/Example.vue:59-60` | 「computed 是 Vue 派生值的唯一惯用写法」「Vue 里也不存在『非缓存的直接算』惯用写法，computed 就是唯一姿势」「派生值必须用 computed 才能自动跟着变」——与官方文档相反：Vue 文档专门有「Computed Caching vs. Methods」一节，模板内表达式 / 方法调用同样随渲染重算且自动更新，「a method invocation will always run the function whenever a re-render happens」「In cases where you do not want caching, use a method call instead」。因此 React 的「渲染时直接算」在 Vue 里的对应物是模板表达式/方法调用（每次渲染重算），`computed` 的对应物才是 `useMemo`（缓存），两处「没有一一对应关系」都是贴错了地方 | vuejs.org/guide/essentials/computed.html#computed-caching-vs-methods（上引原文；"For complex logic that includes reactive data, it is recommended to use a computed property"） | 重写「最重要的区别」：「① 渲染时直接算 ↔ 模板内表达式 / 方法调用（两边都每次渲染重算、自动更新）；② useMemo ↔ computed（两边都缓存；差别：useMemo 依赖手写 + 立即求值，computed 自动追踪 + 惰性求值）；Vue 默认用 computed 是因为 setup 只跑一次、且 computed 便宜，不是因为没有别的写法」；删掉「唯一 / 必须 / 没有一一对应关系」 |
| 概念 | `react/Example.tsx:7-9`、`react/Example.tsx:59-70` | 「不要为了模仿 computed 滥用 useMemo … 量测到瓶颈再加」在 React Compiler（1.0，2025-10，【较新】）时代需要补一句：编译器自动记忆化后，新代码「rely on the compiler … useMemo/useCallback where needed」；存量手写 useMemo 官方建议「leaving existing memoization in place」；配套 lint 规则 `react-hooks/preserve-manual-memoization` 已在插件 7.1.1 的 recommended 预设里 | react.dev/reference/react/useMemo（"React Compiler automatically memoizes values and functions, reducing the need for manual `useMemo` calls"）；react.dev/learn/react-compiler/introduction（上引两句）；`node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:18216-18219`；facts-sheet §G | 在 :59-70 的 useMemo 段后加一段【较新】：「启用 React Compiler 后组件级记忆化由编译器完成，手写 useMemo 保留为精确控制的逃生舱；面试仍需会手写」；按 §4 方案 A（默认不启用）措辞 |
| 小 | `react/Example.tsx:59-70` | 本题只给了 useMemo 的两条使用条件，未指向 17 题（useMemo 与 useCallback 专题），而 17 题 :97 回指本题；单向引用 | 17/react/Example.tsx:97 | 在 :70 处加「更完整的取舍与 useCallback 见 17 题」 |

- 结构建议：修改 —— React 侧论点正确，Vue 对照段（computed 唯一/必须）需按官方「computed vs methods」重写，并补 Compiler 一段。
- 待核实：无。

---

### 10. useEffect 与生命周期 —— 副作用、依赖数组、cleanup 与请求竞态
- 文件：`react/Example.tsx`（423 行）、`vue/Example.vue`（170 行）、`vue/IntervalCounter.vue`（64 行）
- 用到的库 / API：`@/shared/mockApi`（`fetchUsers` 带 `signal`——AbortSignal 已实际使用于 :295；`isAbortError`）；React：`useEffect`（[]、[dep]、无依赖三种）、cleanup、`useRef`（latest ref）、`useState`、`eslint-disable-next-line react-hooks/exhaustive-deps`（:127，刻意保留的坏例）；注释提及 `useEffectEvent`（未 import）；Vue：`watch(source, cb(kw, prev, onCleanup), { immediate })`、`onMounted`/`onUnmounted`、`ref`、`v-if` 卸载
- 交叉引用：指向 → [03, 06, 09, 11, 12, 14, 26, 27]；被引用 ← [06, 14, 22, 24, 25, 26, 27, 28, 30]；不成立的引用：无（03:10-11 确讲连写两次只加 1；06:46 确讲换 key 重置；12:5-6 两种用途；14:10 防抖 hook；26:15,38,479 useEffectEvent 有代码；27:11-16 ignore vs abort 三面板；11 错误处理）
- 覆盖检查（§7 / §8）：「你可能不需要 Effect」已覆盖 3 条（:326-335：用户事件 / 派生值 / props 变化重置），官方清单还有 Chains of computations、Initializing the application、Notifying/Passing data to the parent、Subscribing to an external store（→ `useSyncExternalStore`）、Fetching data（→ 框架 / TanStack）未列；Vue 3.5 `onWatcherCleanup()`【较新】未提；标签缺失：`useEffectEvent`【较新·19.2】在 :222-227 / vue:103 被当作「官方已内置」介绍但无标签；`useEffect`/cleanup【主流】未标
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:41`、`react/Example.tsx:222-227`、`vue/Example.vue:103` | `useEffectEvent` 的事实陈述正确（19.2 稳定导出、本项目可直接 import、exhaustive-deps 认它）但缺【较新】标签；「早期提案里叫 useEvent」在允许来源中查不到；且未提官方三条限制：只能在 Effect 内调用、不能传给其他组件/Hook、返回函数**没有稳定身份**（与本题「ref 对象恒定」的 latest-ref 类比正好相反，易误导） | `node_modules/react/cjs/react.development.js` 导出清单含 `useEffectEvent`（facts-sheet §A）；`node_modules/@types/react/index.d.ts:1786-1791`（`@version 19.2.0`）；`node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:548-551`（"Functions returned from `useEffectEvent` must not be included in the dependency array"）；react.dev/reference/react/useEffectEvent（Caveats："Effect Events can only be called from inside Effects or other Effect Events. Do not call them during rendering or pass them to other components or Hooks"、"Effect Event functions do not have a stable identity. Their identity intentionally changes on every render"）；「useEvent」提案名：待核实 | 标【较新·React 19.2】；补三条 caveat 一句话；删「早期提案里叫 useEvent」或标待核实；把 :206 的第三方文章引用换成 react.dev useEffectEvent 页的「Using a timer with latest values」示例（与本题场景一致） |
| 概念 | `react/Example.tsx:21-22`、`react/Example.tsx:29-31`、`react/Example.tsx:107-109`、`vue/Example.vue:22-23`、`vue/Example.vue:30-32`、`vue/IntervalCounter.vue:9-14` | 「React 那个坏版本在 Vue 里根本不存在」「Vue … 压根没有这个概念（过期闭包）」「只能重建心智模型，不能靠类比」——过度绝对（§5.B/§5.D）：Vue 同样会读到旧值，只要把响应式值解构/拷贝成普通变量（官方 reactive() 限制第 3 条：`let { count } = state` 后「lose the reactivity connection」），或 `const { x } = props` 后在定时器里读它；只是 `count.value++` 这一种写法天然安全 | vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive（"Not destructure-friendly: when we destructure a reactive object's primitive type property into local variables … we will lose the reactivity connection"） | 改为「同一形状的坏版本在 Vue 里不会出现（.value 现读现取），但把响应式值解构成普通变量后闭包同样读旧值——Vue 老手的对应坑是解构，不是没有坑」；保留三种修法「Vue 无需」的结论，但去掉「压根没有这个概念」 |
| 概念 | `vue/Example.vue:52-53` | 「Vue 的 watch 显式声明 source … 没有『漏依赖』这个坑」——与官方相反：`watch` 只追踪显式 source，回调里读到但没列进 source 的值变了不会触发，这正是「漏依赖」，且 Vue 没有 lint 兜底；只有 `watchEffect` 自动收集，且仅收集第一个 await 之前的访问 | vuejs.org/guide/essentials/watchers.html#watch-vs-watcheffect（"`watch` only tracks the explicitly watched source. It won't track anything accessed inside the callback"；"only properties accessed before the first `await` tick will be tracked"） | 改为「watch 也会漏（source 没列全就不触发），差别是 React 有 exhaustive-deps 报警、Vue 没有；watchEffect 才自动收集（async 回调只收集 await 之前）」 |
| 生产 | `react/Example.tsx:291`（`setLoading(true)` 同步写在 effect 顶部） | 需运行验证：现 `eslint.config.js:34-38` 只手动开了 rules-of-hooks / exhaustive-deps；§4 要求阶段 1 改用 eslint-plugin-react-hooks 7.x 官方推荐配置，而 7.1.1 的 `recommended` 预设含编译器规则 `react-hooks/set-state-in-effect`（error）：「Validates against calling setState synchronously in an effect」——本题（及 11、22、27 同款）的「effect 顶部 setLoading(true)」请求惯用写法会被判 error | `node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:18141-18145`（规则说明 + `preset: Recommended`）；facts-sheet §F（recommended 含 set-state-in-effect: error）；本仓库 `eslint.config.js:34-38` | 阶段 1 切换预设后实际跑 lint 确认；若确认命中，二选一并在「生产环境注意」写明：① 把 loading 改为从判别联合状态派生（11 题的 `status` 建模）并用 `forKeyword` 判断是否过期（27 题做法）；② 保留写法但逐行 disable 并解释「官方规则为何反对同步 setState-in-effect」。这是需要在阶段 0 让用户决定的事项 |
| 小 | `react/Example.tsx:19`、`react/Example.tsx:309-311`、`vue/Example.vue:20`、`vue/Example.vue:84-87` | Vue 侧 cleanup 对照只写了 `onCleanup` 参数 + `onUnmounted`；Vue 3.5 新增 `onWatcherCleanup()`（须在回调同步阶段调用、await 之后不可用）未提；另 vue:85-86 已承认 watcher 停止时 onCleanup 会跑、`onUnmounted` 只是为对照而写——应标「演示冗余」 | `node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:8759`（`exports.onWatcherCleanup`）；vuejs.org/guide/essentials/watchers.html#side-effect-cleanup（"onWatcherCleanup … 3.5+ … must be called during the synchronous execution of a watch callback"） | 加一句【较新·Vue 3.5】`onWatcherCleanup`；`onUnmounted` 处标「演示：与 onCleanup 重复」 |
| 小 | `react/Example.tsx:206` | 引用「Dan Abramov 专门写过一篇文章」（overreacted.io）作为 latest-ref/useInterval 套路依据——非官方来源 | §1 依据优先级 | 换为 react.dev/reference/react/useEffectEvent「Using a timer with latest values」示例（官方同场景代码） |
| 小 | `react/Example.tsx:313-316`、`react/Example.tsx:8` | StrictMode 描述「挂载→卸载→重挂载」与 Learn 文档措辞一致，但可补两点避免误解：state 不会丢、只是每个 Effect 多跑一轮 setup→cleanup→setup（参考页原话）；ref 回调也会多跑一次；React 19.3 起 hydration 时也双调 Effects【尝鲜】 | react.dev/reference/react/StrictMode（"one extra setup+cleanup cycle in development for every Effect"；"re-run refs callbacks an extra time"）；facts-sheet §B 19.3 其它 | 补一句；`src/main.tsx:3` 的壳注释同款措辞可一并统一 |

- 绝对化词扫描：`永远` 在本题共 18 处（react:11,18,94,133,167,172,176,198,245,275,276,367；vue:12,19,148；IntervalCounter:6,38,58），均为「计数永远停在 1 / 闭包里的值永远是首帧」这类演示前提或 effect 语义复述，不计；react:176「依赖写全永远是对的」为 React 官方规则的复述且后半句已给限定，不计。真正需要改的绝对化是上表第 2、3 行的「根本不存在 / 压根没有 / 没有漏依赖」。
- 结构建议：修改 —— 代码四种计数器与竞态取消都经得起推敲（`e.currentTarget` 置空、async effect 禁止、React 18 去掉已卸载 setState 警告等均已按 react-dom 源码与官方升级指南核实无误），需要动的是标签、Vue 侧三处绝对化，以及 lint 预设切换后的 setState-in-effect 决策；与 27 题分工清楚（本题只展示 cleanup-abort，27 做三面板对照），保持。
- 待核实：`useEffectEvent` 早期提案名「useEvent」（允许来源内未命中）。

---

### 11. API 请求状态建模 —— loading / success / error / empty 与重试
- 文件：`react/Example.tsx`（152 行）、`vue/Example.vue`（159 行）
- 用到的库 / API：`@/shared/mockApi`（`fetchUsers(keyword, { signal, failRate: 0.35 })`——AbortSignal 已实际使用于 react:62 / vue:54；`isAbortError`）；React：`useEffect`（deps `[keyword, reloadFlag]`）、`useState<RequestState>`（判别联合）、`FormEvent`；Vue：`ref<RequestState>`、`onMounted(load)`、`onUnmounted`、`async function load()` + try/catch
- 交叉引用：指向 → [10, 30]；被引用 ← [10, 14, 22, 27, 30]；不成立的引用：无（30/react/Example.tsx:16,48 回指本题并对照判别联合；`@tanstack/vue-query` 已安装：`package.json:16`，30 题 react:7,35 提及）
- 覆盖检查（§7 / §8）：缺失：§8-6「在 useEffect 里直接请求的问题」官方四条（不在服务端运行 / 请求瀑布 / 无缓存无预载 / 竞态）与官方替代方案（框架数据获取、TanStack Query / useSWR / 路由 loader）未写；React 19 `use(promise)` + Suspense【主流】作为另一条读数据主线未提（含「promise 需缓存、不能在渲染中新建」的限制）；标签缺失：判别联合建模【主流】、`use()`【主流】未标
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:9`、`react/Example.tsx:33-35`、`react/Example.tsx:55-56`、`vue/Example.vue:28` | 本题把「effect 里手写请求状态机」定位为「面试必备」并只以一句「真实业务多用 TanStack Query」带过，没有给出官方明确列出的四条缺陷与替代方案；读者会把本题写法当成生产基线（§5.G 加分项不完整） | react.dev/learn/synchronizing-with-effects「What are good alternatives to data fetching in Effects?」：Effects don't run on the server / network waterfalls / no preloading or caching / race conditions；推荐 framework 内置获取、TanStack Query / useSWR / React Router 6.4+ loader；`let ignore = false` 模式 | 加「生产环境注意」段：列四条缺陷 + 三条替代（30 题 TanStack、18 题 loader、19.0 `use()`【主流】一句话），并把 :9 改为「手写状态机是理解库的前提与面试题，不是生产默认」 |
| 概念 | `react/Example.tsx:15-18`、`vue/Example.vue:16-19` | 「最重要的区别」把「React 声明式（effect 由依赖驱动）vs Vue 命令式（load() 动作）」讲成框架差异（§5.C）——这是本题两侧各自选的模式：Vue 同样可以 `watch(keyword, load, { immediate: true })`（本项目 10 题 Vue 版和 22 题 Vue 版就是这么写的），React 也可以抽 `load()` 在事件里调（本文件 :53 自己提到）；真正的框架差异只是 React 的「状态驱动」挂点只有 effect，因而需要 `reloadFlag` 这种触发器 | 本仓库 `10-effects-and-lifecycle/vue/Example.vue:54-82`（watch + immediate 发请求）；`30-tanstack-query-server-state/vue/Example.vue:39`（「22 题用 watch 触发」）；本文件 `react/Example.tsx:53` | 改为「两边都能两种写法，本题刻意各选一种做对照：状态驱动（React effect / Vue watch+immediate）vs 命令式 load()；React 侧状态驱动写法需要 reloadFlag 触发'同参重跑'，是它特有的额外成本」 |
| 生产 | `react/Example.tsx:61`（`setState({ status: 'loading' })` 同步写在 effect 顶部） | 需运行验证：同 10 题——切到 eslint-plugin-react-hooks 7.1.1 `recommended` 预设后，`react-hooks/set-state-in-effect`（error）会命中本题请求惯用写法 | `node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:18141-18145`；`eslint.config.js:34-38`（当前未启用该规则） | 与 10 题一并决定；本题若改，最自然的是在 success 分支存 `forKeyword`（27 题做法），把「是否在加载」派生为 `state.forKeyword !== keyword`，effect 内不再同步 setState |
| 小 | `react/Example.tsx:5`、`react/Example.tsx:25`、`react/Example.tsx:31` | 「工业界标准」×2 + 「面试加分点」——判别联合是推荐的建模方式，但称「标准」过强；本题面向的 TanStack Query 也同时暴露 `status` 判别值与 `isPending`/`isError` 布尔，两种形态并存 | 措辞层面；TanStack 字段形态：待核实（本次未抓取 tanstack.com 参考页） | 改为「推荐写法 / 常见手写模式」；保留「非法状态无法表示」的论证 |
| 小 | `react/Example.tsx:79` | 「同一事件里的两次 setState 会被 React 自动批处理成一次重渲染」正确，但缺前提「React 18+ 且使用 createRoot」及指向 24 题 | react.dev/blog/2022/03/29/react-v18「Automatic Batching」 | 加「（React 18+ createRoot；详见 24 题）」 |

- 结构建议：修改 —— 判别联合 + 竞态取消 + 空态/错误分开的主体保留；补官方「不要在 effect 里直接请求」的论据与替代方案清单，纠正「声明式 vs 命令式」的框架差异表述，并与 10 题一起决定 set-state-in-effect 的处理。与 30 题分工成立（30 明确回指本题为「手写状态机」对照）。
- 待核实：TanStack Query v5 `useQuery` 返回的 status 字面量与布尔字段的确切形态（未抓取参考页）。

---

### 12. DOM ref 与跨渲染可变值 —— useRef 的两种用途
- 文件：`react/Example.tsx`（116 行）、`vue/Example.vue`（107 行）
- 用到的库 / API：react `useRef`、`useState`；vue `ref`（DOM ref 以同名字符串 `ref="inputEl"` 关联）；无第三方库
- 交叉引用：指向 → [26, 02]；被引用 ← [02, 07, 10, 21, 23, 24, 26, 27]；不成立的引用：无（26 题 `react/Example.tsx:13,146-154` 确讲 latest ref；02 题 `react/Example.tsx:119-120` 确有「19 起不需要 forwardRef」的说明，但只是注释，没有代码）
- 覆盖检查（§7 / §8）：缺失：ref 回调函数及其清理函数（19.0【主流】，§8 组 2 明确列出「ref 清理」）；`useImperativeHandle`（19 写法 `function MyInput({ ref })`，无需 forwardRef）；「ref 作为 prop」的实际代码（本题与 02 题都只在注释里提）；「React 19 类型下 `useRef()` 无参不通过」这一 18→19 变化（§5.A 列出）；【旧写法】forwardRef 对照；【尝鲜】19.3 Fragment refs 可一句带过。标签缺失：全部知识点无成熟度标签（`react/Example.tsx:28` 的 React 19 说明也没有）
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:81-86`、`react/Example.tsx:93` | 两处在渲染期读 `ref.current`（`lastKeywordRef.current`、`countRef.current`）并直接渲染到界面；官方 caveat 是「Do not write or read ref.current during rendering, except for initialization」；:81-83 对第一处做了免责说明，:93 的小实验没有；且 eslint-plugin-react-hooks 7 的 recommended 预设含 `react-hooks/refs`（error），会直接把这两处判错——当前仓库只开两条规则所以能过 lint | https://react.dev/reference/react/useRef（Caveats）；https://react.dev/reference/eslint-plugin-react-hooks/lints/refs「Validates correct usage of refs, not reading/writing during render」，示例与 :93 同构；facts §F recommended 含 `refs`(error) | 若保留「改 ref 不重渲染」小实验，统一标注「演示简化：违反官方 caveat、开 recommended 预设会被 refs 规则拦下」；或改为在事件处理器里读 ref 后 setState 再展示。升级 lint 预设前需运行验证 |
| 概念 | `react/Example.tsx:28-29` | 「React 19 起 ref 是普通 prop，函数组件不再需要 forwardRef」结论正确，但无成熟度标签，没说 forwardRef 在 19 里仍可用（@types 未标 @deprecated；官方原话是「will be deprecated in a future release」），也没有【旧写法】对照，读者读到存量 forwardRef 代码没有落点 | facts §A forwardRef 行（`@types/react/index.d.ts:1403`，JSDoc 无 @deprecated）；https://react.dev/reference/react/forwardRef「In React 19, forwardRef is no longer necessary. Pass ref as a prop instead. forwardRef will be deprecated in a future release.」；https://react.dev/reference/react/useImperativeHandle「Starting with React 19, ref is available as a prop. In React 18 and earlier, it was necessary to get the ref from forwardRef.」 | 标【主流】；新增「八、旧写法对照」：forwardRef + `ComponentPropsWithRef`【旧写法·18 及以前】vs `({ ref }: Props)`【主流·19】，并顺带补 `useImperativeHandle` 一例 |
| 概念 | `vue/Example.vue:25-27` | Vue 侧主线用「变量名与模板 ref 同名」的写法，`useTemplateRef` 只作括号附注；Vue 3.5 官方文档把 `useTemplateRef()` 列为主写法，同名写法放在「Usage before 3.5」小节；本仓库 vue 3.5.42 | https://vuejs.org/guide/essentials/template-refs.html（「Usage before 3.5」：「In versions before 3.5 where useTemplateRef() was not introduced, we need to declare a ref with a name that matches…」）；`node_modules/@vue/runtime-core/dist/runtime-core.d.ts:1563` `export declare function useTemplateRef<T = unknown, Keys extends string = string>(key: Keys): TemplateRef<T>` | 主线改 `const inputEl = useTemplateRef<HTMLInputElement>('inputEl')`【主流·3.5+】，同名写法标【旧写法·3.5 前，仍可用】 |
| 小问题 | `vue/Example.vue:103` | 「Vue 的 ref 是响应式的，永远不会给你『改了不更新』的体验」：`shallowRef` 的深层改动、`markRaw` 过的对象都会「改了不更新」 | https://vuejs.org/api/reactivity-advanced.html（shallowRef：「state.value.count = 2 // does NOT trigger change」；markRaw：「will never be converted to a proxy」） | 改为「`ref()` 的 `.value` 赋值一定触发更新；shallowRef 深层改动 / markRaw 对象是例外」 |

- 结构建议：修改 —— 两种用途主线保留，补 ref 作为 prop / ref 回调清理 / `useImperativeHandle` 三个 19.0【主流】知识点与【旧写法】forwardRef 对照；Vue 侧主线切到 `useTemplateRef`
- 待核实：无

---

### 13. 插槽与 children —— React 用「值」组合 UI
- 文件：`react/Example.tsx`（134 行）、`vue/Example.vue`（102 行）、`vue/Card.vue`（27 行）、`vue/UserList.vue`（23 行）
- 用到的库 / API：react `useState`、`ReactNode` 类型、Fragment `<>`；vue `ref`、`defineProps`、`<slot>` / `<slot name>` / `<slot :user>`、`$slots.footer`、`v-slot="{ user }"` / `#header`；共享 `User` 类型
- 交叉引用：指向 → []（本题无「见 NN 题」）；被引用 ← [02（`vue/UiButton.vue:47`）, 18（`react/Example.tsx:191,373`）]；不成立的引用：无
- 覆盖检查（§7 / §8）：缺失：`ReactNode` vs `ReactElement`（何时要求「必须是元素」；`@types/react/index.d.ts:436-448` 的 ReactNode 联合含 boolean/undefined/bigint/Iterable，文件头 :30 只列了一部分）；`PropsWithChildren`；children 为函数的 render-children 变体；复合组件（Context 驱动）作为组合进阶；`Children.*` / `cloneElement`【旧写法·不推荐】；Vue 侧缺动态插槽名 `#[name]` 与 `useSlots()`。标签缺失：全部
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:16-18`、`react/Example.tsx:26-27`、`vue/Example.vue:17-19`、`vue/Example.vue:82-83`、`vue/Card.vue:4-5` | §5.C 把「模板 vs 渲染函数」的模式差异讲成框架差异：「Vue 的插槽内容只能写在组件标签内部…React 根本不需要『插槽』这个专门概念…这是两个框架的本质差异，Vue 模板做不到」「Vue 一文件一组件」。Vue 的插槽在运行时就是「返回 VNode 的函数」，渲染函数 / JSX 里可以把它当值传（`h(Card, null, { header: () => …, default: () => … })`）、存变量、从别处传入，Vue 官方支持 JSX/TSX；「一文件一组件」只是 SFC 的约束，`defineComponent` + 渲染函数一个文件可放多个组件。官方指出的真正区别是：slot 以函数形式惰性调用，「依赖由子组件而不是父组件收集」 | https://vuejs.org/guide/extras/render-function.html（「Passing Slots」：「slot functions or an object of slot functions must be passed」；「Passing slots as functions allows them to be invoked lazily by the child component. This leads to the slot's dependencies being tracked by the child instead of the parent」；JSX 节） | 改为「在模板语法下，插槽内容写在标签内；在渲染函数/JSX 下，Vue 的 slot 就是返回 VNode 的函数，与 render prop 同构」；删掉「本质差异 / 做不到」；把「slot 函数惰性调用、子组件收集依赖」作为真正的区别写进「四、关键区别」 |

- 结构建议：保留 —— 代码与主线对照准确，只需修正上述注释并补 ReactElement / 组合进阶
- 待核实：无

---

### 14. 自定义 Hook 与 Composable —— 逻辑复用
- 文件：`react/Example.tsx`（190 行）、`react/useDebouncedValue.ts`（70 行）、`react/useWindowWidth.ts`（35 行）、`vue/Example.vue`（74 行）、`vue/DebouncedUserSearch.vue`（107 行）、`vue/WidthPanel.vue`（34 行）、`vue/useDebouncedValue.ts`（49 行）、`vue/useWindowWidth.ts`（31 行）
- 用到的库 / API：react `useState`、`useEffect`；`AbortController`；共享 `fetchUsers` / `isAbortError`；vue `ref`、`computed`、`watch`（第三参数 `onCleanup`、`{ immediate: true }`）、`onMounted`、`onUnmounted`、`defineProps`
- 交叉引用：指向 → [12, 09, 10, 11, 30]；被引用 ← [03（`react/Example.tsx:63`）, 10（`react/Example.tsx:285`、`vue/Example.vue:65`）, 24（`react/Example.tsx:367`）]；不成立的引用：`react/useDebouncedValue.ts:55`「交给 TanStack Query（把 debounce 后的关键词当 queryKey…见 30 题）」——30 题只讲 queryKey / 缓存 / 失效，grep 30 题无「防抖 / debounce」，引用目标只部分成立；`react/Example.tsx:79`「10 题…专讲竞态」——10 题 `react/Example.tsx:283` 自己写明「竞态的可复现演示、ignore 标志 vs AbortController」在 27 题，10 只演示 abort 写法，措辞过重；（入站备查）03 题 :63 说「10、14 题会再遇到（快照）」，14 题并未讲 state 快照，属 03 题问题
- 覆盖检查（§7 / §8）：缺失：`useSyncExternalStore`【主流】（§8 组 2；官方对「订阅外部系统」的首选，本题的 resize 订阅正是其典型场景）；自定义 Hook 的返回约定（对象 vs 元组）；`useEffectEvent`【较新】在自定义 Hook 里的用法（26 题有，可交叉引用）。标签缺失：全部
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:6`、`react/useWindowWidth.ts:18-20`（同句复制于 `vue/Example.vue:7`） | 「useState + useEffect（挂监听，cleanup 卸监听）是订阅外部系统的标准组合」「订阅外部系统（window 的 resize 事件）是标准的 effect 场景」与官方推荐相反：react.dev 明确「React has a purpose-built Hook for subscribing to an external store that is preferred instead」，示例正是订阅 window 事件 + `getServerSnapshot` | https://react.dev/learn/you-might-not-need-an-effect（Subscribing to an external store）；https://react.dev/reference/react/useSyncExternalStore（Subscribing to a browser API：`window.addEventListener('online', callback)`）；`@types/react/index.d.ts:1924`、facts §A | 并排给出 `useSyncExternalStore` 版 `useWindowWidth`【主流·18+】（subscribe / getSnapshot / getServerSnapshot 三段，说明 getSnapshot 必须返回稳定值），把 useEffect 版改称「通用副作用写法 / 读懂存量代码」；「标准」改「常见」 |
| 生产 | `react/Example.tsx:114` | `setLoading(true)` 在 effect 体内同步调用：eslint-plugin-react-hooks 7 recommended 预设的 `set-state-in-effect` 规则会报错（官方示例与此一模一样：同步 `setLoading(true)` flagged、promise 里的 `setLoading(false)` allowed）；同时「effect 里 fetch + 手写 loading」正是 §8 组 6 要作为问题引出 TanStack Query 的写法，本题没有标注「演示简化」，只在 :122 提到 11 题 | https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect；facts §F recommended 含 `set-state-in-effect`(error) | 标注「演示简化：手写请求状态，生产用 30 题 TanStack Query 或 11 题的判别联合」；若要通过 recommended 预设，把 loading 改为派生/异步设置（需运行验证） |
| 概念 | `vue/DebouncedUserSearch.vue:29-30`、`vue/DebouncedUserSearch.vue:57` | 「watch 回调和 onUnmounted 是两个独立函数，controller 要提升到 setup 作用域共享」——不必要：`watch` 的 `onCleanup` 在 watcher 停止时也会执行（源码 `cleanup = effect.onStop = …`），setup 里同步创建的 watcher 会随组件卸载自动停止，所以卸载时 abort 已被 onCleanup 覆盖；10 题 `vue/Example.vue:85-86` 自己已承认「watcher 随组件卸载停止时 onCleanup 也会执行」，14 题却把它写成必需，前后矛盾 | `node_modules/@vue/reactivity/dist/reactivity.cjs.js:1945-1955`（`cleanup = effect.onStop = () => { … for (const cleanup2 of cleanups) cleanup2() }`）；`node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:6842` 卸载时 `scope.stop()`；https://vuejs.org/guide/essentials/watchers.html（Stopping a Watcher：「Watchers declared synchronously inside setup() or <script setup> … will be automatically stopped when the owner component is unmounted」） | 删掉 `let controller` 与 `onUnmounted(() => controller?.abort())`，或改注释为「可选的显式对照，功能上冗余」，与 10 题措辞统一 |
| 小问题 | `react/useDebouncedValue.ts:1-70`、`react/useWindowWidth.ts:1-35`（整个文件） | 两个 React Hook 文件是 `.ts`，不在 `eslint.config.js` 的 `files: ['**/*.tsx']` 范围内，rules-of-hooks / exhaustive-deps 对它们不生效；而本题恰恰在 `react/Example.tsx:8-9`、`react/useWindowWidth.ts:7-8` 强调「lint 靠 use 前缀识别 hook 并强制 Hooks 规则（硬规则）」，示范文件自己却没被检查 | `D:\code\AI\learning\react\eslint.config.js`（`files: ['**/*.tsx']`，注释说明是为避开 Vue composable 误判） | 把 React 侧 hook 文件改为 `.tsx`，或为 `src/topics/*/react/**/*.ts` 单独加一条 react-hooks 配置（不含 vue 目录） |
| 小问题 | `react/Example.tsx:22`、`react/Example.tsx:58`、`vue/Example.vue:23`、`vue/Example.vue:37`、`vue/useWindowWidth.ts:23`、`vue/useDebouncedValue.ts:25` | §5.H：同一句「两个约束不同源，没有一一对应关系」在本题 6 处重复；结论本身成立（Vue 文档：composable 须在 setup 同步调用，原因是需要 active instance 来挂生命周期和 watcher），但重复到像模板残留 | https://vuejs.org/guide/reusability/composables.html（Usage Restrictions） | 只在文件头「三、Vue 对照」讲一次，其余处删除或改「见文件头」 |
| 小问题 | `react/useDebouncedValue.ts:54-55`、`react/Example.tsx:79` | :54 的 ahooks `useDebounce` / `useDebounceFn` 名称未能核实（未安装、未抓官方文档）；:55、:79 的交叉引用见上「不成立的引用」 | 待核实 / 见交叉引用栏 | :55 改为「30 题讲 queryKey 与缓存，防抖值进 queryKey 的组合需自行搭」；:79 改为「10 题给出 abort 解法，竞态专题是 27 题」 |

- 结构建议：修改 —— 并排 `useSyncExternalStore` 版 `useWindowWidth`，Vue 侧删冗余 controller，清理重复句；防抖主线保留
- 待核实：ahooks `useDebounce` / `useDebounceFn` 的存在与命名

---

### 15. Context 跨层传值（主题切换）
- 文件：`react/Example.tsx`（150 行）、`vue/Example.vue`（53 行）、`vue/MiddleLayer.vue`（18 行）、`vue/ThemedButton.vue`（19 行）、`vue/ThemedCard.vue`（23 行）、`vue/theme.ts`（37 行）
- 用到的库 / API：react `createContext`、`useContext`、`useMemo`、`useCallback`、`useState`、`<ThemeContext value>`（19 直接当 Provider）、`CSSProperties` / `ReactNode` 类型；vue `provide`、`inject`、`readonly`、`ref`、`InjectionKey`、`Ref`、`CSSProperties` 类型
- 交叉引用：指向 → [16]；被引用 ← [18（`react/Example.tsx:171,516`、`vue/auth.ts:9`）, 29（`react/Example.tsx:187`）, 30（`react/Example.tsx:29,112`、`vue/Example.vue:23`）]；不成立的引用：无
- 覆盖检查（§7 / §8）：缺失：`use(Context)`【主流·19.0】（可在条件 / 循环里读，§7 列为主流）；「React 没有内建 context selector」这一性能边界（正是 16 题 Zustand 的动机）；`memo` 挡不住 context 更新；`<Context.Consumer>`【旧写法】；官方推荐的 `ThemeProvider({ children })` 结构；Vue 侧 `inject(key, default)` / 工厂默认值与 `app.provide`；【尝鲜】19.3 「Context 可在 Server Components 里渲染」可一句带过。标签缺失：全部（`react/Example.tsx:141` 的版本说明也无标签）
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 严重 | `react/Example.tsx:127-136`（另 `:121-122`、`vue/Example.vue:42-43` 复述） | 「useMemo 后：theme 不变则 value 引用不变，消费组件安然不动」「根组件因任何原因重渲染…所有消费组件都被连坐」——在本题的组件树里不成立：`MiddleLayer` / `ThemedCard` / `ThemedButton` 都是 `Example` 在 :143-148 直接创建的非 memo 子元素，只要 `Example` 重渲染它们就跟着重渲染（官方：「React normally re-renders a component whenever its parent re-renders」），与 value 引用是否稳定无关；因此 :123 的 useCallback 和 :138 的 useMemo 在本 demo 中没有任何可观察效果，注释宣称的行为与代码实际行为相反。官方示例之所以成立，是把状态放在 `TasksProvider({ children })` 里，children 由外部创建、引用稳定 | https://react.dev/reference/react/memo（「React normally re-renders a component whenever its parent re-renders」）；https://react.dev/learn/scaling-up-with-reducer-and-context（`export function TasksProvider({ children })`，「take children as a prop」）；https://react.dev/reference/react/useContext（Optimizing re-renders 示例把状态放在 MyApp 并只声称消费者不必重渲染） | 重构为 `ThemeProvider({ children })` 持有 state，`Example` 里放一个与主题无关的 state 按钮，`ThemedCard` 加 `console.count`，让「value 稳定 → 非消费者不重渲染」可验证（§2-9）；重渲染计数需运行验证 |
| 概念 | `react/Example.tsx:133-134` | 面试加分项列「消费组件配合 React.memo」：memo 不能阻止消费组件因 context 变化而重渲染（官方 caveat：「Skipping re-renders with memo does not prevent the children receiving fresh context values」；「Even with memo, your component will re-render if … a context that it's using changes」）；memo 的正确用武之地是隔离 Provider 之下不消费 context 的中间层。加分项也漏了 children 模式和「React 无内建 selector」 | https://react.dev/reference/react/useContext（Caveats）；https://react.dev/reference/react/memo | 改为「Provider 用 children 模式 / 按变化频率拆 Context / 把消费点下沉到小组件（用 memo 隔离非消费者）/ 需要 selector 就上 Zustand（16 题）」 |
| 概念 | `react/Example.tsx:141` | 「React 19 起 Context 本身可直接当 Provider 组件用；React 18 及更早写 <ThemeContext.Provider>」正确但无【主流】/【旧写法】标签，且没说 `.Provider` 在 19 里仍然可用（类型上 `Context<T>` 继承 `Provider<T>`，官方只说 older versions 用它），`Consumer`【旧写法】也未提 | https://react.dev/reference/react/createContext（「Starting in React 19, you can render <SomeContext> as a provider. In older versions of React, use <SomeContext.Provider>」；Consumer：「newly written code should read context with useContext() instead」）；facts §A `index.d.ts:678` | 加标签与「19 仍兼容 .Provider，迁移不急」说明；「八、旧写法对照」列 `.Provider` / `.Consumer` |
| 概念 | `react/Example.tsx:60-66` | `useTheme()` 只用 `useContext`；React 19 的 `use(ThemeContext)`【主流】与之等价且可在条件 / 循环里调用，本题一字未提（§7 列为主流、§5.G 加分项不完整） | https://react.dev/reference/react/use（「Unlike useContext, use(context) can be called in conditionals and loops like if」）；facts §A `index.d.ts:1973` | 在 useTheme 旁加一句对照，并作为「五、追问」的加分点 |

- 结构建议：修改 —— 重构为 `ThemeProvider({ children })` 并加可验证的渲染计数演示；补 `use(Context)`、children 模式与旧写法对照；Vue 侧 provide/readonly 描述与官方一致，可保留
- 待核实：无

---

### 16. 全局状态管理（Zustand vs Pinia）
- 文件：`react/Example.tsx`（138 行）、`react/cartStore.ts`（88 行）、`vue/Example.vue`（43 行）、`vue/CartPanel.vue`（71 行）、`vue/ProductList.vue`（41 行）、`vue/cartStore.ts`（58 行）
- 用到的库 / API：zustand 5.0.15 `create<T>()(…)`（柯里化）、selector、`set` / `get`；pinia 3.0.4 `defineStore`（setup store）、`storeToRefs`；vue `ref`、`computed`；Pinia 由 `src/bridge/VueMount.tsx:49` `app.use(createPinia())` 安装（与 `vue/cartStore.ts:4` 注释一致，已核实）
- 交叉引用：指向 → [30, 15, 08, 25, 09]；被引用 ← [03, 18, 25, 29, 30]（多处）；不成立的引用：无（09 题 :7「渲染时直接算」存在）
- 覆盖检查（§7 / §8）：缺失：zustand v5「selector 必须返回稳定引用，否则无限循环」易错点与 `useShallow`【主流】（规格线索明确要求）；`useCartStore.getState()` / `setState()` 组件外用法；middleware（persist / devtools）一句介绍；**Redux Toolkit【主流·存量】对照**（§8 组 8 明确要求，现只被一句「更重、样板多」带过）；pinia 4.x【较新】版本说明（ESM-only + `@vue/devtools-api` v8 并装，facts §E）；Option store 对照代码。标签缺失：全部（「最主流的轻量方案之一」无标签无依据）
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:7-8`、`react/Example.tsx:49-51`、`react/Example.tsx:74` | 讲了 selector + `Object.is`，却没讲 v5 最容易踩的坑：selector 返回新对象 / 数组（如 `s => [s.items, s.clear]`、`s => ({ … })`）会「Maximum update depth exceeded」无限循环；「每个字段各写一个 selector」正是为了规避它但没点明；解法 `useShallow`（`zustand/react/shallow`）或 `zustand/traditional` 的 `createWithEqualityFn` 一字未提（§5.G） | `node_modules/zustand/esm/react.mjs:5-12`（`useSyncExternalStore(api.subscribe, () => selector(api.getState()), …)`，无 equalityFn）；https://react.dev/reference/react/useSyncExternalStore（「if you always return a different value, you will enter an infinite loop」）；zustand 官方 `docs/reference/migrations/migrating-to-v5.md`「Requiring stable selector outputs」（「If a selector returns a new reference, it may cause infinite loops」）；`docs/learn/guides/prevent-rerenders-with-use-shallow.md`；`node_modules/zustand/react/shallow.d.ts` | 加「六、易错点」：v5 稳定引用规则 + `useShallow` 示例；「八、旧写法」：v4 `useStore(sel, shallow)` 第二参数写法【旧写法】 |
| 概念 | `react/Example.tsx:12-13`、`react/cartStore.ts:4-7`、`react/cartStore.ts:40-43` | Redux Toolkit 只被「更重、样板多」一句否定，不满足 §8 组 8「Redux Toolkit（大量存量项目在用）」的对照要求；且 :40-43「Zustand 必须不可变更新 vs Pinia 可直接改」的对比因此不完整——RTK 的 createSlice 内置 Immer 可变写法，与 Pinia 手感反而最接近 | 规格 §8 组 8；RTK API 细节 待核实（本仓库未安装 @reduxjs/toolkit，未抓官方文档） | 加「Redux Toolkit【主流·存量】」小节：configureStore / createSlice / useSelector / useDispatch 与 Pinia、Zustand 三方对照；是否新增依赖或只讲概念，需用户决定 |
| 小问题 | `vue/cartStore.ts:7-8` | 「也可用 Options 风格…二者等价」：Pinia 文档说 setup store 必须 return 全部 state（不能有私有 state）、更灵活，Option store 更易用——不是完全等价 | https://pinia.vuejs.org/core-concepts/（「you must return all state properties in setup stores … you cannot have private state」；「Option stores are easier to work with while Setup stores are more flexible and powerful」） | 改为「两种写法能力对等但约束不同」并列出约束 |
| 小问题 | `react/cartStore.ts:30-32` | 柯里化 `create<T>()(…)` 写法本身已核实，但「为了绕开 TypeScript 的推断限制（部分泛型参数无法只指定一个）」这段原因在现版官方文档未找到原文 | `node_modules/zustand/react.d.ts:9-12`（`Create` 第二重载 `<T>(): <Mos…>(initializer) => …`）；zustand 官方 `docs/learn/guides/beginner-typescript.md`（「The create function uses the curried form」） | 保留写法与【主流】标签；原因措辞标「待核实」或引官方原文 |
| 小问题 | `react/Example.tsx:50-51` | 「action 函数…引用永远稳定…这个订阅永远不会触发更新」：前提是没有用 `set(state, true)` 整体替换 store（v5 对 replace 类型更严格） | `node_modules/zustand/vanilla.d.ts:1-7`（`replace?: false` / `replace: true` 两重载）；migrating-to-v5「Stricter types when setState's replace flag is set」 | 加限定「本 store 未用 replace 整体替换」 |

- 结构建议：修改 —— 主线代码可保留；补 v5 易错点 / `useShallow`、RTK 三方对照、pinia 4【较新】说明与成熟度标签
- 待核实：zustand 官方对柯里化 `create<T>()()` 原因的原文；Redux Toolkit API 细节

---

### 17. useMemo 与 useCallback（配合 React.memo 的性能优化）
- 文件：`react/Example.tsx`（200 行）、`vue/Example.vue`（154 行）、`vue/ProductRow.vue`（43 行）
- 用到的库 / API：react `memo`、`useCallback`、`useMemo`、`useState`、`console.count`；vue `computed`、`ref`、`defineProps`、`defineEmits`、`onUpdated`；壳应用 `src/main.tsx:14` `<StrictMode>`（注释 :63 所述属实）
- 交叉引用：指向 → [09]；被引用 ← [03（`react/Example.tsx:229`）, 18（`react/Example.tsx:486`）, 23（`react/Example.tsx:303`）, 24（`react/Example.tsx:366`）, 26（`react/Example.tsx:325`）, 29（`react/Example.tsx:196`）]；不成立的引用：（入站备查）18 题 `react/Example.tsx:486`「Context 的 value 用 useMemo 保持引用稳定（17 题）」——该内容在 15 题 :127-138，17 题未讲 Context value；属 18 题问题
- 覆盖检查（§7 / §8）：缺失：React Compiler【较新】只剩一句过时描述（§4 方案 A 要求：手写记忆化为主线，另讲编译器原理、对手写 memo 的影响、lint 规则）；Vue 对照 `v-memo` / `v-once`【主流·3.2+】；React DevTools Profiler 只提名字无演示；§8 组 3 的列表虚拟化、`lazy` 代码分割在本批次任一题都未出现（是否另开题需决定）。标签缺失：全部
- 文件头模板缺口：缺 一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:132-133`、`vue/Example.vue:19-20`、`vue/Example.vue:79-81`、`vue/ProductRow.vue:4-5`、`vue/ProductRow.vue:23-24` | §5.D：「Vue 不靠引用相等决定子组件更不更新」「父组件传给本组件的事件处理函数不需要引用稳定」——Vue 的 `shouldUpdateComponent` / `hasPropsChanged` 正是逐个 prop 用 `!==` 比较（对象 / 数组 / 函数按引用），官方性能指南专门有「Props Stability」一节（「a child component only updates when at least one of its received props has changed」并要求保持 props 稳定）。本例回调不影响更新，是因为 `select` 经 `defineEmits` 声明、`isEmitListener` 把它排除在比较之外，而不是「Vue 不比引用」；未声明的 `onXxx` 或每次新建的对象 prop 同样会触发子组件更新 | `node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:4835-4902`（`hasPropValueChanged` → `return nextProp !== prevProp`；`&& !isEmitListener(emits, key)`）；https://vuejs.org/guide/best-practices/performance.html（Props Stability） | 改为「Vue 也按引用比较 props；本例不需要 useCallback 是因为 setup 只执行一次 + 声明式 emit 监听器被排除在比较外；对象 / 数组 prop 仍要注意稳定性（官方 activeId 示例）」 |
| 概念 | `react/Example.tsx:18-19`、`react/Example.tsx:25`、`vue/Example.vue:19-20`、`vue/Example.vue:26`、`vue/Example.vue:129` | §5.D / §5.H：「memo / useCallback 在 Vue 里没有对应物，因为不需要」「Vue 天然不需要它们——没有一一对应关系」：Vue 有 `v-memo`（3.2+，官方示例就是本题的「大列表选中行」场景 `v-memo="[item.id === selected]"`）、`v-once`，以及 computed 缓存；对应物核实存在，「没有一一对应关系」在此不成立 | https://vuejs.org/api/built-in-directives.html#v-memo（「The most common case … rendering large v-for lists」，`v-memo="[item.id === selected]"`）；https://vuejs.org/guide/best-practices/performance.html（v-once / v-memo） | 改为「Vue 默认精准更新；显式记忆化工具是 v-memo / v-once【主流·3.2+】，官方定位为微优化」；Vue 版列表可示范 `v-memo` 或至少在「三、Vue 对照」提及 |
| 概念 | `react/Example.tsx:14`、`react/Example.tsx:175`、`vue/Example.vue:15`、`vue/Example.vue:131` | 版本说明过时：「React Compiler 正在把…逐步自动化（知道有这回事即可，不展开）」——Compiler 1.0 已于 2025-10 稳定，应按【较新】讲清：自动记忆化原理；对手写 memo 的影响（官方：存量 memo 建议保留，新代码依赖编译器、必要时手写做精确控制）；eslint-plugin-react-hooks 7 recommended 已内置编译器规则（`preserve-manual-memoization` 等）；本仓库默认不启用 | facts §G；https://react.dev/learn/react-compiler/introduction（「React Compiler is now stable」；「For existing code, we recommend either leaving existing memoization in place…」；「For new code, we recommend relying on the compiler for memoization and using useMemo/useCallback where needed」）；https://react.dev/reference/react/useMemo（「React Compiler automatically memoizes values and functions, reducing the need for manual useMemo calls」）；facts §F | 增加「九、新动向【较新】」小节，主线仍手写（方案 A）；说明「面试仍考手写链路 + 存量项目仍需读懂」 |
| 小问题 | `react/Example.tsx:20`、`react/Example.tsx:133`、`vue/Example.vue:21`、`vue/ProductRow.vue:24` | 「Vue 编译器会自动缓存模板里的内联事件处理函数（相当于自动 useCallback）」有边界：引用了 v-for / v-slot 作用域变量的内联处理函数不缓存（源码注释「must be passed fresh to avoid stale values」），组件上的成员表达式处理函数也不缓存；它解决的是 patch 成本，与 useCallback 的「让 memo 浅比较通过」不是同一件事 | `node_modules/@vue/compiler-core/dist/compiler-core.cjs.js:6210-6220`（`shouldCache = context.cacheHandlers && … && !(isMemberExp && node.tagType === 1) && !hasScopeRef(exp, context.identifiers)`）；`node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js:4337` `cacheHandlers: true` | 加限定条件，去掉「相当于自动 useCallback」的等价表述 |
| 小问题 | `vue/ProductRow.vue:9-10` vs `vue/Example.vue:125` | 前者说「点『选中』只 +2（新选中的行 + 取消选中的行）」，后者说「+1（首次选中 / 取消选中）或 +2（从 A 行切到 B 行）」，两处不一致，后者正确 | 代码逻辑（首次选中只有一行 `selected` 变化） | 统一为 +1 / +2 |
| 小问题 | `react/Example.tsx:63-64`、`react/Example.tsx:168` | StrictMode 说明不完整：官方同时会把 `useMemo` 的计算函数调两次（本题「filter+sort 计算次数」同样翻倍，:63 只说组件函数）；且装了 React DevTools 时第二次渲染的 console 输出会被调暗 / 可设置静默，「数字约翻倍」需运行验证 | https://react.dev/reference/react/StrictMode（「Functions that you pass to useState, set functions, useMemo, or useReducer」被调两次；DevTools「slightly dimmed」）；https://react.dev/reference/react/useMemo（「call your calculation function twice」） | 注明两类计数都受影响及 DevTools 设置；标「需运行验证」 |

- 结构建议：修改 —— 主线手写记忆化保留（方案 A），增 Compiler【较新】小节与 Vue `v-memo` 对照，修正 Vue「不比引用」的描述
- 待核实：无（StrictMode 下 console.count 的具体倍数需运行验证）

---

### 18. 路由 —— React Router 的参数、query、嵌套路由、导航与登录态守卫
- 文件：`react/Example.tsx`（585 行）、`vue/Example.vue`（89）、`vue/router.ts`（101）、`vue/auth.ts`（31）、`vue/ordersData.ts`（60）、`vue/LoginPage.vue`（55）、`vue/OrdersPage.vue`（91）、`vue/OrderDetailPage.vue`（99）、`vue/SettingsPage.vue`（33）、`vue/SettingsProfilePage.vue`（17）、`vue/SettingsNotificationsPage.vue`（28）
- 用到的库 / API：`react-router-dom` 7.18.3（转发包）：`MemoryRouter`、`Routes`、`Route`、`Link`、`NavLink`、`Navigate`、`Outlet`、`useLocation`、`useNavigate`、`useParams`、`useSearchParams`；react：`createContext`、`useContext`、`useMemo`、`useState`、`<AuthContext value>`（19 直接当 Provider）；vue-router 4.6.4：`createRouter`、`createMemoryHistory`、`router.beforeEach`（`next` 三参数写法）、`useRoute`、`useRouter`、`RouterLink`、`RouterView`、`router.push/replace/back`、`meta`；vue：`reactive`、`computed`、`ref`
- 交叉引用：指向 → [03, 05, 09, 13, 15, 16, 17]；被引用 ← [30]（`30/vue/queryPlugin.ts:12` 引用本题 `router.ts` 的工厂函数理由）；不成立的引用：`react/Example.tsx:486`「Context 的 value 用 useMemo 保持引用稳定（17 题）」—— 该内容在 15 题（`15-context/react/Example.tsx:128-138`），17 题讲的是昂贵计算的 useMemo，应改为「15 题」；`react/Example.tsx:373`「13 题的包装组件思路」—— 13 题讲 children/插槽，未出现「包装组件」措辞，可成立但建议改为「13 题的 children 组合」
- 覆盖检查（§7 / §8.7）：缺失：Data 模式（`createMemoryRouter`/`createBrowserRouter` + `RouterProvider` + loader）；middleware 守卫【较新】；路由级错误处理（`errorElement`/`ErrorBoundary`/`useRouteError`，声明式模式不可用）；懒加载（`lazy` 路由属性 / `React.lazy`+`Suspense`）；`useBlocker` 离开确认；`handle`/`useMatches`；导入路径演变 v6→v7→v8；开放重定向校验；三态登录态；URL 状态的合并更新；标签缺失：RequireAuth（应标【主流】）、`Activity`（`:468` 应标【较新】）、`next()` 写法（应标【旧写法】）、v6（【旧写法】+ EOL）、`<AuthContext.Provider>`（`:516` 已含义上标旧写法，需贴标签）
- 文件头模板缺口：缺 头字段（适用版本/最后核对/前置主题/成熟度）/一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 严重 | `react/Example.tsx:31`、`:145`；`vue/Example.vue:32`；`vue/router.ts:18`、`:109`（同句在 :18） | 「React Router 根本没有『全局导航钩子』这种东西…它不存在，也不会有」结论错误：7.18.3 Data 模式的 route 对象直接支持 `middleware: MiddlewareFunction[]`，不需要 future flag；客户端 middleware 每次导航都执行，不管有没有 loader；v8 默认开启；只有声明式模式没有 | `nm:react-router/dist/development/data-CjO11-hU.d.ts:747`（`middleware?: MiddlewareFunction[]`）、`:496`（签名）；`chunk-BV7QT456.mjs:4845-4849`（`defaultDataStrategyWithMiddleware`）；reactrouter.com/7.18.4/how-to/middleware「Client middlewares will run on every client navigation, regardless of whether there are loaders to run」；facts:C | 按 §6.2 改为「渲染中拦截（声明式 RequireAuth）vs 渲染前拦截（Data 模式 loader/middleware、Vue beforeEach）」；按 §6.3 在无 path 的分组路由上挂 `middleware: [requireAuth]` 并标【较新】 |
| 严重 | `react/Example.tsx:191-192` | 「React 19 的类型允许函数组件直接返回 ReactNode；@types/react 18 及更早要写成 `<>{children}</>`」结论错误：该变化来自 @types/react 18.2.8（`JSXElementConstructor`/`FunctionComponent` 返回类型改为 `ReactNode`，配合 TS 5.1 的 `JSX.ElementType`），与 React 19 无关；18.2.7 仍是 `ReactElement<any, any> \| null` | unpkg.com/@types/react@18.2.7/index.d.ts（`(props: P, context?: any): ReactElement<any, any> \| null`）vs unpkg.com/@types/react@18.2.8/index.d.ts（`(props: P, context?: any): ReactNode`）；React 19 升级指南的 TypeScript 变更清单无此项（facts:B） | 改为「@types/react ≥ 18.2.8 + TS ≥ 5.1 起可直接 `return children`；更早版本需 `<>{children}</>`」，标【主流】 |
| 严重 | `react/Example.tsx:335-337`；`vue/OrderDetailPage.vue:18-20` | 「React 没有这个『实例复用坑』」结论错误：`/orders/o1 → /orders/o2` 命中同一条 `<Route>`，`OrderDetailPage` 在树中同一位置渲染，React 复用实例，本地 state 与 effect（依赖不含 id 时）都保留；本例详情页没有本地 state 才看不出来 | react.dev/learn/preserving-and-resetting-state「React preserves a component's state for as long as it's being rendered at its position in the UI tree」；§5.D | 按 §6.5：给出 `key={id}` 强制重挂 与「写对 effect 依赖数组」两种解法；用测试证明参数变化时 state 保留；Vue 侧保留 computed/watch 说明，把「差异」改成「两边都要处理，只是触发方式不同」 |
| 概念 | `react/Example.tsx:5`、`:24-27`、`:30`、`:142`、`:547-548`、`:16`、`:27`；`vue/Example.vue:6`、`:25-31`、`:36-40`；`vue/router.ts:4-8`、`:13-14`、`:84-86`；`vue/LoginPage.vue:7-9` | 把模式差异讲成框架差异（§5.C）：「路由表就是组件树 / 没有安装插件这一步」只对声明式模式成立——`<Routes>` 用 `createRoutesFromChildren` 把子元素转成配置对象，`<Route>` 不真正渲染，非 `<Route>`/Fragment 子元素直接报错；Data 模式本身是配置数组 + `<RouterProvider router>`「先配置后安装」，`createWebHistory` 的对应物在 Data 模式是 `createBrowserRouter` | `nm:react-router/dist/development/chunk-BV7QT456.mjs:7298`（`createRoutesFromChildren`）、`:7314`（invariant「All component children of <Routes> must be a <Route> or <React.Fragment>」） | §6.2：真正的区别改为「拦截发生在渲染中还是渲染前」；补一句 v5 时代 `<PrivateRoute>` 写法从 v6 起报错【旧写法】 |
| 概念 | `react/Example.tsx:43-55` | 从 `react-router-dom` 导入（§5.A 过时）：v7 推荐从 `react-router` 导入，`react-router-dom` 7.x 只是 `export * from "react-router"` 的转发；v8 已删除该包 | `nm:react-router-dom/dist/index.mjs`；reactrouter.com/upgrading/v8「移除 react-router-dom」；facts:C | §6.1：统一从 `react-router` 导入，Data 模式演示用 `createMemoryRouter` + `RouterProvider`（`react-router` 主入口与 `react-router/dom` 均导出）；讲清 v6【旧写法】→ v7 → v8【尝鲜】 |
| 概念 | `react/Example.tsx:505-508` | 「v7 的声明式 API 与 v6 完全相同」绝对化且版本说明过时：v7 改了导入路径、要求 React 18+；Data 模式是官方主推；v6 已被官方标为 EOL；v8 已发布（2026-06-17）；「v6.4+ 另有数据路由…本课不展开」应改为并排版本 | remix.run/blog/react-router-v8（v6 EOL 声明）；facts:C | §6.11：改为「主线 v7，写法兼容 v8；v6 已宣布停止维护【旧写法】」 |
| 概念 | `react/Example.tsx:151-155` | (a)「RequireAuth —— v6/v7 声明式路由的标准答案」需限定为「声明式模式的标准做法【主流】」；(b)「loader 里判断…不会先闪一下受保护页面」对比不成立：RequireAuth 未登录时根本不渲染 children，也不会闪；(c) 加分项不完整（§5.G）：父子 loader 并行执行（默认 dataStrategy 用 `Promise.all`），父 loader 抛 redirect 时子 loader 可能已发出；middleware 在 `next()` 之前抛出时 loader 根本不会运行 | `nm:react-router/dist/development/chunk-BV7QT456.mjs:4836-4844`（`defaultDataStrategy`：`await Promise.all(matchesToLoad.map((m) => m.resolve()))`）；reactrouter.com/7.18.4/how-to/middleware「if an error is thrown before calling next(), then we haven't called any loaders yet」 | §6.3 + §6.4：渲染前拦截的真正优势是「可直接 await 异步检查、检查完成前不提交导航、子路由数据请求不发出」；loader throw redirect 标【主流】并写清并行问题；middleware 标【较新】 |
| 概念 | `react/Example.tsx:201-203`；`vue/router.ts:73-79`、`:81-82` | 「Vue 的 beforeEach 必须调用 next()（或 return 一个值）…什么都不调用会让导航一直挂起…React 的组件式守卫没有这个坑」不准确：只有声明了第 3 个参数 `next` 的守卫才要求调用（`guard.length > 2`）；返回值写法下不返回 = `undefined` = 放行；开发模式下 async 守卫忘调 next 会 warn 并 reject「Invalid navigation guard」而不是挂起。React Data 模式的 loader/middleware 同样是「必须 resolve」的异步函数，不 resolve 一样挂起导航——这是模式差异不是框架差异 | `nm:vue-router/dist/devtools-EWN81iOl.mjs:755-765`（`if (guard.length < 3) guardCall = guardCall.then(next)`；`The "next" callback was never called…`）；router.vuejs.org/guide/advanced/navigation-guards「undefined or true: the navigation is validated」 | 主线改用返回值写法（返回 `false`/位置对象/`undefined`），把 `next()` 三参数移到【旧写法】并注明「经 RFC 拟移除，仍支持」；删掉「React 没有这个坑」 |
| 概念 | `react/Example.tsx:9`、`:119-121`；`vue/Example.vue:10`、`:49-53`、`:85-86`；`vue/SettingsPage.vue:28-29` | NavLink 对照不准确（§5.D）：NavLink 激活时默认加 `active` 类名（另有 `pending`/`transitioning`）与 `aria-current="page"`，CSS 命中 `.active` 即可；函数式 `className`/`style` 用于 Tailwind、CSS-in-JS 等场景；Vue 侧也有函数式（`<RouterLink custom v-slot="{ isActive }">` / `useLink`）。`:522-525` 与 `vue/Example.vue:51-53` 的激活判定描述本身正确（NavLink `end=false` 前缀匹配；Vue 按路由记录 + params，兄弟记录不激活） | `nm:react-router/dist/development/chunk-BV7QT456.mjs:10681`（`end = false`）、`:10713-10724`（`aria-current`、`isActive ? "active"`）；`nm:vue-router/dist/vue-router.mjs:917-929`（`activeRecordIndex`/`isActive`）、`:982`（`custom`）、`:994-995`（`router-link-active`/`router-link-exact-active`）；router.vuejs.org/guide/essentials/active-links | §6.6：默认类名 + `aria-current`；函数式写法的适用场景；补 `end` 与 `router-link-exact-active` 的对照 |
| 概念 | `react/Example.tsx:367-369`、`:382`；`vue/OrderDetailPage.vue:55`、`:69` | 「条件不成立时按钮根本不进 DOM（比 disabled 更安全…F12 里都翻不出来）」安全表述错误（§5.F）：前端权限只影响体验，用户可直接调接口，鉴权必须由后端完成 | §2.7 / §5.F（规格验收标准） | §6.7：改为「前端权限 = 体验层，后端鉴权 = 安全层」，删除「更安全」 |
| 概念 | `react/Example.tsx:533-538`；`vue/Example.vue:61-66` | Vue 侧描述准确（守卫只在导航发生时运行，登录态变了不会踢人），但把它讲成「与 beforeEach 的实质差异」是模式差异：React Data 模式的 loader/middleware 也只在导航时运行，登录态变化同样不会踢人；只有声明式 RequireAuth 是「持续生效的渲染条件」 | reactrouter.com/7.18.4/how-to/middleware（middleware 按导航执行）；§5.C | 限定为「声明式模式 vs 导航前守卫」；两边都提「登录态失效后要么 watch 登录态手动跳转，要么下次导航/请求 401 时处理」 |
| 概念 | `vue/router.ts:49-51`、`:89-90`；`react/Example.tsx:562-563` | 「React 没有 meta 这一层」不准确：React Router 路由对象与声明式 `<Route>` 都有 `handle`（`useMatches` 读取，官方用于面包屑等抽象），Data 模式还可用 route context；且 Vue 也有路由级 `beforeEnter` 可与声明并置，「守卫逻辑与路由声明分居两处」不是唯一形态 | `nm:react-router/dist/development/data-CjO11-hU.d.ts:767`（`handle?: any`）；`index-react-server-client-BjY-eKuf.d.ts:616-640`（`PathRouteProps.handle`）；reactrouter.com/7.18.4/start/data/route-object「Route handle allows apps to add anything to a route match in useMatches」；router.vuejs.org navigation-guards（`beforeEnter`） | 改为「Vue 用 meta + 全局守卫 / 或 beforeEnter；React 声明式用包装组件，Data 模式用 handle/middleware」 |
| 概念 | `react/Example.tsx:425-426`；`vue/SettingsPage.vue:12-14` | 「Vue 没有一一对应的『相对 to』体验，相对路径支持有限」不准确：vue-router 4 支持相对 `to`，按 URL 语义相对当前 path 解析（从 `/settings/profile` 写 `to="notifications"` 得 `/settings/notifications`，但从 `/settings` 写得 `/notifications`）；React Router 相对「路由层级」解析。差异是「相对路径 vs 相对路由」，不是「有 vs 无」 | `nm:vue-router/dist/devtools-EWN81iOl.mjs:287-311`（`resolveRelativePath`）、`:207`（`parseURL` 调用） | 改写对照并删掉「没有一一对应」 |
| 生产 | `react/Example.tsx:161-167`、`:205-222`、`:483`；`vue/auth.ts:18` | 登录态是同步布尔值，没有「检查中」状态；刷新页面时真实应用要异步校验会话，布尔态会先把人踢到登录页 | §5.E / §6.4 | RequireAuth 改三态 `checking / authed / guest`，`checking` 时渲染占位；Vue 侧 `auth` 同样加 `status` |
| 生产 | `react/Example.tsx:355`、`:364-365`；`vue/OrderDetailPage.vue:34`、`:45-48` | `navigate(-1)` / `router.back()` 无兜底：直接打开详情页时后退会离开应用 | `nm:react-router/dist/development/chunk-BV7QT456.mjs:44,144,177,245`（初始 `location.key === "default"`，facts:C） | §6.8：`location.key === 'default'` 时改为 `navigate('/orders')`；Vue 侧兜底写法见「待核实」 |
| 生产 | `react/Example.tsx:275-283`；`vue/OrdersPage.vue:38-42` | `setSearchParams({})` / `setSearchParams({ status })` 与 `router.push({ path, query: {...} })` 都是整体替换查询串，其它参数（分页等）会丢；且未说明默认 push 与 `{ replace: true }` 的取舍 | `nm:react-router/dist/development/chunk-BV7QT456.mjs:10949-10956`（`navigate("?" + newSearchParams, navigateOptions)`，facts:C） | §6.9：`setSearchParams(prev => { const n = new URLSearchParams(prev); …; return n })`，切筛选时重置页码；Vue 侧 `query: { ...route.query, status }`；筛选类 query 建议 `replace` |
| 生产 | `react/Example.tsx:231`、`:237-239`；`vue/LoginPage.vue:20-21`、`:28-30` | 开放重定向只有注释没有校验；`redirect` 直接交给 `navigate`/`router.replace` | §5.E / §6.10 | 实现 `safeRedirect`（只允许以 `/` 开头、且不以 `//` 或 `/\` 开头）；说明改用 `throw redirect()` 后指向外站会整页跳转，校验必须做 |
| 小问题 | `react/Example.tsx:31`、`:145`、`:203`、`:372`、`:426`、`:489`；`vue/Example.vue:32`；`vue/router.ts:18`、`:50`；`vue/OrderDetailPage.vue:54`；`vue/SettingsPage.vue:14` | 模板残留「（没有一一对应关系）」逐处判断：`:31`/`:145`/`vue/Example.vue:32`/`router.ts:18` 附在错误结论上（删）；`:203` 附在「函数总得返回点什么」（无关，删）；`:372`/`OrderDetailPage.vue:54`「React 没有指令」成立但应改成说明句（复用逻辑用组件或 Hook）；`:489` 成立但应写成「Vue 的依赖追踪按属性，无需稳定 value 引用」；`:426`/`SettingsPage.vue:14`、`router.ts:50` 不成立（见上两行） | — | 按 §5.H 清理；保留的两处改成有前提的说明句 |
| 小问题 | `react/Example.tsx:61`；`vue/ordersData.ts:3` | 「五个页面组件」与代码不符：React 文件有 6 个页面组件（Login/OrderList/OrderDetail/SettingsLayout/SettingsProfile/SettingsNotifications）+ RequireAuth；Vue 有 6 个页面 .vue | 实读文件 | 改为「六个」或删数字 |
| 小问题 | `react/Example.tsx:467-470`；`vue/SettingsNotificationsPage.vue:22-25` | `Activity` 描述正确（hidden 时销毁 Effect、保留 state）但缺【较新】标签；可补「DOM 保留并 `display:none`、隐藏时仍以低优先级渲染」 | react.dev/reference/react/Activity；facts:A（19.2.8 稳定导出 `Activity`） | 贴【较新】（19.2 起）；KeepAlive 对照保留 |
| 小问题 | `vue/router.ts:91` | `to.meta.requiresAuth` 类型为 `unknown`（`RouteMeta extends Record<PropertyKey, unknown>`），靠 truthiness 编译通过；官方推荐扩展类型 | `nm:vue-router/dist/router-CWoNjPRp.d.mts:891-897`（注释给出 `declare module 'vue-router' { interface RouteMeta {…} }` 示例） | 加 `declare module 'vue-router' { interface RouteMeta { requiresAuth?: boolean } }` |
| 小问题 | `react/Example.tsx:486` | 交叉引用应为 15 题（见上方「不成立的引用」） | `15-context/react/Example.tsx:128-138` | 改「17 题」为「15 题」 |

**§6 修改点对照表**

| §6 条目 | 对应行号（React / Vue） | 现状 | 备注 |
|---|---|---|---|
| 1 导入 | `react/Example.tsx:43-55` / `vue/router.ts:23` | 从 `react-router-dom` 导入；无 `RouterProvider`/`createMemoryRouter`；Vue 用 `createMemoryHistory` 正确 | facts:C 已核实两个导出位置；需补 v6/v7/v8 导入路径演变 |
| 2 重写「最重要的区别」 | `react/Example.tsx:23-32`、`:138-149`、`:547-548` / `vue/Example.vue:24-33`、`vue/router.ts:4-8`、`:16-21`、`:84-86`、`vue/LoginPage.vue:7-9` | 仍是「组件树 vs 配置」+「根本没有全局钩子」 | 依据 `chunk-BV7QT456.mjs:7298/:7314`；补 `<PrivateRoute>`【旧写法】 |
| 3 守卫的加分点 | `react/Example.tsx:151-155` / `vue/router.ts:70-98` | 只提 loader throw redirect，无并行问题说明、无 middleware、无 useBlocker | `defaultDataStrategy` Promise.all（`:4836-4844`）；`useBlocker` 稳定、`unstable_usePrompt` 仍带前缀（facts:C） |
| 4 RequireAuth 三态 | `react/Example.tsx:161-167`、`:205-222`、`:483`、`:154` / `vue/auth.ts:18` | 布尔登录态；「不会闪」错误对比 | 见表中「生产」与「概念」行 |
| 5 修正「没有实例复用坑」 | `react/Example.tsx:335-338` / `vue/OrderDetailPage.vue:17-21` | 结论错误；无 `key`/依赖数组解法；无测试 | react.dev preserving-and-resetting-state |
| 6 修正 NavLink 对比 | `react/Example.tsx:118-125`、`:427-432`、`:522-531` / `vue/Example.vue:49-53`、`:84-89`、`vue/SettingsPage.vue:27-32` | 只讲函数式 style；未提默认 `active` 类与 `aria-current` | `chunk-BV7QT456.mjs:10713-10724` |
| 7 按钮权限安全表述 | `react/Example.tsx:367-383` / `vue/OrderDetailPage.vue:51-70`、`vue/auth.ts:28-31` | 「比 disabled 更安全」 | §5.F |
| 8 `navigate(-1)` 兜底 | `react/Example.tsx:355`、`:364-365` / `vue/OrderDetailPage.vue:34`、`:45-48` | 无兜底 | `location.key === 'default'`（facts:C） |
| 9 `setSearchParams` 合并更新 | `react/Example.tsx:275-283` / `vue/OrdersPage.vue:38-42` | 整体替换；未讲 push/replace 取舍 | `chunk-BV7QT456.mjs:10949-10956` |
| 10 实现 `safeRedirect` | `react/Example.tsx:231`、`:237-239` / `vue/LoginPage.vue:20-21`、`:28-30` | 仅注释 | — |
| 11 清理与更新 | 模板残留见表中「小问题」行；版本说明 `react/Example.tsx:505-508` | 未清理；「v7 与 v6 完全相同」 | v6 EOL（remix.run/blog/react-router-v8） |
| 12 Vue 对照补充 | `vue/router.ts:81-82`、`:88-98`；数据加载器：无 | `next()` 三参数作主线，返回值写法被称为「新写法」并放弃；未提 vue-router 5 `vue-router/experimental` 数据加载器 | router.vuejs.org navigation-guards；facts:D（5.x 无破坏性变更，数据加载器【尝鲜】） |
| 13 可选 ViewTransition | 无 | 未提及 | facts:A（19.2.8 不导出，19.3 稳定）→ 只作【尝鲜】介绍 |

- 结构建议：重写 —— 按 §6 目标结构：主线声明式 + 三态 RequireAuth【主流】，并排 Data 模式 `createMemoryRouter` + loader【主流】+ middleware【较新】；Vue 侧守卫改返回值写法、`next()` 入【旧写法】。
- 待核实：(1) Vue 侧 `router.back()` 兜底判断（`router.options.history.state.back` 是否可用于判定「应用内无上一页」）未从 `d.mts` 核实；(2)「父子 loader 并行」由 `defaultDataStrategy` 源码的 `Promise.all` 佐证，官方 v7 Data Loading / Route Object 页面未直接命中该句。

---

### 19. 异步提交与防重复 —— submitting 状态的工业界标准写法
- 文件：`react/Example.tsx`（123 行）、`vue/Example.vue`（119）
- 用到的库 / API：react：`useState`、`FormEvent`、受控 `<input>`、`<form onSubmit>` + `preventDefault`；`@/shared/mockApi.submitOrder`；vue：`ref`、`v-model`、`@submit.prevent`
- 交叉引用：指向 → [07]（`react/Example.tsx:35`「07 题讲过」受控组件，成立）；被引用 ← [07（`07/react/Example.tsx:20`、`:246`；`07/vue/Example.vue:21`）, 30（`30/react/Example.tsx:194`；`30/vue/Example.vue:142`）]；不成立的引用：无。注意 07 题 `:20`/`:246` 写「19 题提到过 useActionState，但…本项目没有实现 form actions」，若采纳批次 B 拆出新题，07 题需同步改写
- 覆盖检查（§7 / §8.5）：缺失：React 19 Actions（`<form action>`、`useActionState`、`useFormStatus`、`useOptimistic`）无演示、无对照（§7 列为【主流】）；`useTransition`/`isPending` 与手写 `submitting` 的关系；错误处理的两条路径（错误作为 state 返回 vs 抛到 Error Boundary，指向 20 题）；`<form action>` 成功后自动重置非受控字段的行为；Vue 侧「Actions 无对应物」的说明；标签缺失：`:10-11` 的 `useActionState`/`useTransition`（前者【主流】19.0，后者 18.0 起存在）、手写 `submitting`（应标「框架无关基线【主流】，React 18 存量必会」）
- 文件头模板缺口：缺 头字段/一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:10-11`；`vue/Example.vue:11-12` | 「React 19 的 useActionState / useTransition 是处理表单提交的新趋势」不准确且无标签：`useTransition` 是 React 18.0（2022-03）API，19 新增的是「传给 startTransition 的异步函数 = Action」；`useActionState`/`<form action>`/`useFormStatus` 19.0 起稳定（2024-12），按 §3 判定属【主流】，不宜再称「新趋势」；未说明与手写写法的分工 | react.dev/blog/2022/03/29/react-v18（`useTransition` 为 18 新 Hook）；react.dev/reference/react/useTransition「Functions called in startTransition are called 'Actions'」；facts:A（`useActionState`、`useOptimistic` 稳定导出） | 保留手写 `submitting` 作主线（框架无关 + React 18 存量），并排一版 `useActionState` + `useFormStatus`（或拆新题后交叉引用），两者都贴标签 |
| 概念 | `react/Example.tsx:6`、`:48-54`、`:107-111`；`vue/Example.vue:7`、`:45-47` | 「防重复两层保险…标准答案就是这两层一起上」缺 Actions 下的限定：`useActionState` 会把多次 `dispatchAction` 排队顺序执行（不丢弃、不并发），`isPending` 直到全部完成才复位；因此 Actions 版本不能靠 `if (submitting) return`（action 收不到 isPending），要靠 `disabled={isPending}` / `useFormStatus().pending`，否则连点会排队提交多次 | react.dev/reference/react/useActionState「React queues and executes multiple calls to dispatchAction sequentially」；react.dev/reference/react/useTransition「isPending … stays true until all Actions complete」；react.dev/reference/react-dom/components/form（`useFormStatus` 示例） | 加「isPending 与防重复」小节：手写版 = 布尔守卫 + disabled；Actions 版 = 排队语义 + `pending` 禁用 |
| 小问题 | `react/Example.tsx:63-69`、`:46` | 与 `<form action>` 对照缺失：action 成功后 React 自动重置非受控字段、失败不重置（恰好等价本题「成功清空、失败保留」，受控组件仍要自己清）；action 无需 `e.preventDefault()`；错误处理两条路径——在 action 内 `try/catch` 把错误作为 state 返回（推荐），或抛出后「取消所有排队 action 并显示最近的 Error Boundary」（指向 20 题） | react.dev/reference/react-dom/components/form「After the action function succeeds, all uncontrolled field elements in the form are reset」「calling e.preventDefault() isn't needed」；react.dev/reference/react/useActionState「If dispatchAction throws an error, React cancels all queued actions and shows the nearest Error Boundary」 | 在「常见追问」补这三条对照 |
| 小问题 | `react/Example.tsx:38-39`；`vue/Example.vue:34` | 「type="number" 下浏览器会把 "12." 这类半截小数规范成空串」是浏览器行为断言，未核实 | 需运行验证（HTML 规范的 valid floating-point number 不允许尾随小数点，但各浏览器 value sanitization 表现需实测） | 实测后保留或改为「可能」措辞 |
| 小问题 | `src/shell/topicRegistry.ts:148`；`react/Example.tsx:2` | 「工业界标准写法」措辞绝对：React 19 项目的标准写法正在转向 Actions | §2.4 | 改为「手写基线写法 + React 19 Actions 对照」 |

- 结构建议：保留（基线）+ 拆出新题 —— 手写 `submitting` 保留为框架无关基线【主流】；同意批次 B 在 19 题之后拆出「React 19 表单 Actions」，本题只留 3～5 行对照与指向；`vue/Example.vue:35-36`（`type="number"` 自动应用 `.number`）已核实正确（vuejs.org/guide/essentials/forms#number）。
- 待核实：`type="number"` 输入 "12." 的 `value` 表现（需运行验证）。

---

### 20. 错误边界 —— Error Boundary vs onErrorCaptured
- 文件：`react/Example.tsx`（134 行）、`react/ErrorBoundary.tsx`（78）、`vue/Example.vue`（101）、`vue/BuggyCounter.vue`（51）
- 用到的库 / API：react：class `Component`、`static getDerivedStateFromError`、`componentDidCatch(error, ErrorInfo)`、`useState`；vue：`onErrorCaptured`（返回 `false`）、`ref`、`computed`
- 交叉引用：指向 → 无；被引用 ← 无（全仓库 grep「20 题」无命中）；不成立的引用：无
- 覆盖检查（§7 19.0 `onCaughtError/onUncaughtError`；§8.4 Error Boundary）：缺失：(1) 异步例外——`startTransition`/Actions 内抛错或返回 rejected Promise、`use(promise)` 拒绝、`<form action>` 抛错都会被最近的边界捕获；(2) `createRoot` 的 `onCaughtError / onUncaughtError / onRecoverableError`（仅一句带过）与 React 19「渲染错误不再 rethrow：未捕获 → `window.reportError`，已捕获 → `console.error`」；(3) 用 `key` / `resetKeys` 重置边界；`react-error-boundary` 的 `resetKeys`、`useErrorBoundary`（把事件处理器/异步错误交给边界的官方库解法，正对应 `:66-69` 的演示）；(4) React Router 路由级 `errorElement`/`ErrorBoundary`（Data/Framework 模式；声明式不可用）——与 18 题联动；(5) Vue 侧 `errorCaptured` 自下而上冒泡顺序、钩子自身抛错时两个错误都送 `errorHandler`；(6) React Compiler lint 的 `error-boundaries` 规则【较新】（实测本题不触发）；标签缺失：class 边界（【主流】）、`react-error-boundary`（【主流】生产）、`createRoot` 选项（【主流】19.0）
- 文件头模板缺口：缺 头字段/一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:9`；`react/ErrorBoundary.tsx:15`；`vue/Example.vue:10` | 「不能捕获：异步代码（setTimeout / Promise 回调）」缺限定，在 React 19 下部分不成立：传给 `startTransition` 的函数（Action）抛错或返回 rejected Promise 会被边界捕获；`use(promise)` 拒绝会显示最近边界的 fallback；`<form action>` 抛错同样进边界。应限定为「不经 React 调度的异步回调（setTimeout、手写 `.then`）」 | react.dev/reference/react/Component「Asynchronous code … an exception is the usage of the startTransition function … Errors thrown inside the transition function are caught by error boundaries」；react.dev/reference/react/use「If the Promise is rejected, the fallback of the nearest Error Boundary will be displayed」；react.dev/reference/react-dom/components/form | 改写「不能捕获」清单并加一条「能捕获：Action / use(promise) / form action 里的错误【主流】19.0」，与 19 题的错误处理对照 |
| 概念 | `react/Example.tsx:17-18`；`vue/Example.vue:18-19`、`:41-42` | 「app.config.errorHandler 与 React 没有一一对应关系…onUncaughtError / onCaughtError 不是同层概念」对照不可信：两者都是根级错误汇报口——Vue `errorHandler` 收所有未被 `errorCaptured` 返回 `false` 拦下的错误；React `onUncaughtError` 收未被边界捕获的、`onCaughtError` 收被边界捕获的、`onRecoverableError` 收自动恢复的，三者都带 `componentStack`。真正的差异是 Vue 的 `errorHandler` 还收事件处理器错误，而 React 的事件处理器错误完全不经 React | react.dev/reference/react-dom/client/createRoot（三个选项描述）；vuejs.org/api/composition-api-lifecycle#onerrorcaptured「By default, all errors are still sent to the application-level app.config.errorHandler」；facts:B（未捕获 → `window.reportError`，已捕获 → `console.error`） | 改为「`errorHandler` ≈ `onUncaughtError` + `onCaughtError` 的合集」，标【主流】19.0，并把 `ReactIsolatedMount.tsx:32` 的 `createRoot(host)` 作为可加选项的演示点 |
| 生产 | `react/ErrorBoundary.tsx:59-61`、`:65`；`react/Example.tsx:117-119`、`:128-130` | 重置只靠内部 `reset`，无 `fallback`/`fallbackRender` props、无 `key`/`resetKeys` 重置、无上报；`:65` 只说「演示里写死」，没写生产写法 | github.com/bvaughn/react-error-boundary README（`fallbackRender`、`onReset`、`resetKeys`「When changed, these keys will reset a triggered error boundary」、`useErrorBoundary`）；react.dev preserving-and-resetting-state（`key` 重置） | 「七、生产环境注意」写：`react-error-boundary` + `resetKeys`/`onReset`；路由级 `errorElement`（Data 模式）；`componentDidCatch` 上报 |
| 小问题 | `react/ErrorBoundary.tsx:5` | 「官方多年表示『未来可能提供』，至今没有」——官方当前措辞是「There is currently no way to write an Error Boundary as a function component」，未承诺提供 | react.dev/reference/react/Component | 引用原文，标【主流】 |
| 小问题 | `react/Example.tsx:68`、`:74`、`:97` | 「错误直接抛到全局（只在控制台可见）」正确，但可补 React 19 语义：渲染期未捕获错误走 `window.reportError`（`onUncaughtError` 可定制）；事件处理器错误是普通未捕获异常，不经 React | facts:B（升级指南「Errors in render are not re-thrown」） | 一句补充即可 |

- 结构建议：修改 —— 保留手写 class 边界主线与 Vue `onErrorCaptured` 对照（`vue/Example.vue:43-45` 关于「返回 false 后不再打印」与 `nm:@vue/runtime-core/dist/runtime-core.cjs.js:238-239` 一致；`vue/Example.vue:16-17` 捕获范围与 vuejs.org 列表一致）；补 React 19 异步例外、`createRoot` 选项、`key`/`resetKeys`、`react-error-boundary`、RR `errorElement` 指向 18 题。
- 待核实：`vue/Example.vue:19-20`、`:53-55`「Vue 捕获后不会自动卸载崩溃子树」——文档未直接陈述，需运行验证（演示本身用 `v-if` 重挂，不受影响）。

---

### 21. 不可变数据更新 —— 两框架状态模型的核心差异
- 文件：`react/Example.tsx`（188 行）、`vue/Example.vue`（176）
- 用到的库 / API：react：`useState`（函数式更新）、`useRef`、`structuredClone`；vue：`reactive`；Immer 未引入（仅提及）
- 交叉引用：指向 → [03（`:11`）, 12（`:67`）]；被引用 ← [28（`28/react/Example.tsx:463`、`:532`）, 29（`29/react/Example.tsx:35`、`:83`；`29/vue/Example.vue:36`、`:68`）]；不成立的引用：无（03 题 `:2`、`:25`、`:310-328` 讲 `Object.is` 与不可变更新；12 题 `:36` 讲「不需要触发渲染的值放 ref」）
- 覆盖检查（§8.1 state 与不可变更新；§8.3 React Compiler【较新】）：缺失：Immer/`useImmer` 只有一句（无示例、无标签，官方 `useState` 文档明确推荐）；「结构共享」术语（`:84` 已讲引用复用，可点名）；React Compiler 与 `react-hooks/immutability` lint【较新】（实测 `:136` 触发）；`useReducer` 同规则（指向 29 题）；TS `readonly`/`Readonly<T>` 防误改；Vue 侧缺 `shallowRef`/`shallowReactive`/`triggerRef`（Vue 里也需要「换引用」的场景）与 props 只读对照；标签缺失：Immer（【主流】）、Compiler（【较新】）
- 文件头模板缺口：缺 头字段/一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 严重 | `react/Example.tsx:134-137` | 反例 `first.quantity++` 在 eslint-plugin-react-hooks 7.1.1 `recommended` 预设下触发 `react-hooks/immutability` error（「Modifying a value returned from 'useState()', which should not be modified directly」）；当前仓库只开了 `rules-of-hooks`/`exhaustive-deps` 所以通过，阶段 1 切到官方推荐配置（§4）后本文件 lint 失败 | 实测 `npx eslint --rule 'react-hooks/immutability: error'` → `136:16 error`；facts:F（`recommended` 含 `immutability`）；规则描述「Validates against mutating props, state, and other values that are immutable」 | 加 `// eslint-disable-next-line react-hooks/immutability` 并在注释里说明「这正是 React Compiler 的 lint 会拦下的写法」——顺势作为【较新】加分点 |
| 概念 | `react/Example.tsx:16-17`；`vue/Example.vue:17-18`、`:106-108` | 「Vue 没有『每层新引用』的负担…push / splice / 直接赋值都是惯用写法」绝对化：`shallowRef`/`shallowReactive` 下必须替换 `.value`/顶层引用（或 `triggerRef`）才触发；props 只读（改 props 顶层会 warn，深层可变但不推荐）；大列表性能优化也常用 `shallowRef` + 不可变替换 | vuejs.org/api/reactivity-advanced#shallowref「does NOT trigger change: state.value.count = 2 / does trigger change: state.value = { count: 2 }」；vuejs.org/guide/components/props#one-way-data-flow「props are readonly」 | 加限定「默认 `reactive`/`ref` 深层响应式；浅层 API 与 props 是 Vue 里也要『换引用』的场景」，作为 Vue 对照补充 |
| 小问题 | `react/Example.tsx:5-6`、`:126-127`；`vue/Example.vue:6-7` | 「Object.is 相等 → React 直接跳过重渲染」基本正确，但官方有限定：某些情况下 React 仍会先调用一次组件再跳过子树 | react.dev/reference/react/useState「Although in some cases React may still need to call your component before skipping the children」 | 加半句限定 |
| 小问题 | `react/Example.tsx:13`、`:85` | Immer 只提名字、无标签、无写法；官方文档直接推荐 | react.dev/reference/react/useState「you can use a library like Immer」 | 给 3～5 行 `useImmer` 示例并标【主流】；`:84` 补「结构共享」术语 |

- 结构建议：修改 —— 保留五种模式与「反例」演示；补 Immer 示例【主流】、Compiler/`immutability` lint【较新】、Vue `shallowRef`/props 只读对照；`:63-65` `structuredClone` 与 `:99-100` StrictMode 双调更新函数的说明已核实正确（react.dev/reference/react/useState）。
- 待核实：无。

---

### 22. 综合实战 —— 订单管理页（搜索 / 筛选 / 分页 / 行内编辑 / 二次确认删除）
- 文件：`react/Example.tsx`（379 行）、`vue/Example.vue`（249）、`vue/OrderRow.vue`（192）
- 用到的库 / API：react：`useEffect`（内嵌 async 取数 + `AbortController` cleanup）、`useState`、`FormEvent`/`ChangeEvent`；`@/shared/mockApi`：`fetchOrders`、`updateOrder`、`deleteOrder`、`isAbortError`；vue：`ref`、`computed`、`watch`、`onMounted`、`onUnmounted`、`reactive`、`defineProps`/`defineEmits`、`v-model`
- 交叉引用：指向 → [05, 06, 07, 08, 09, 10, 11, 19, 21, 27, 30]；被引用 ← [30（`30/react/Example.tsx:26`、`:31`、`:49`、`:123`、`:199`、`:202`、`:417`；`30/vue/Example.vue:25`、`:39`、`:47`、`:146`、`:148`、`:417`）]；不成立的引用：无（10 题 `:289`/`:303` 有 `AbortController`/`isAbortError`；11 题 `:38-46` 判别联合 + draft/keyword；27 题 `:11-16` ignore vs abort；30 题 TanStack Query）
- 覆盖检查（§8.6 数据获取）：缺失：(1) 未标「演示简化」，也未列官方指出的 effect 取数四缺陷（不在服务端运行、瀑布、无缓存/预加载、样板多）与生产替代（30 题 TanStack Query / 18 题路由 loader）；(2) 分页/筛选/关键词未放 URL（`useSearchParams`，18 题）——刷新/分享丢状态，且与 18 题 `:289`「筛选状态存在 URL 里」自相矛盾；(3) 删除的权限与后端鉴权表述（18 题按钮权限）；(4) 重新请求时旧数据整体消失（TanStack `placeholderData` 对照）；(5) React Compiler lint 说明（见下）；标签缺失：手写 effect 取数（【主流】但注明生产倾向库）
- 文件头模板缺口：缺 头字段/一/五/六/七/八/参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 生产 | `react/Example.tsx:17-20`、`:46-77` | 用 `useEffect` 直接取数未标「演示简化」，只说 27/30 题「深入对照」；官方明确列出缺陷并推荐框架机制或 TanStack Query / React Router loader | react.dev/reference/react/useEffect#fetching-data-with-effects「Effects don't run on the server … network waterfalls … no preloading or caching」及推荐 TanStack Query / React Router 6.4+ | 文件头「七、生产环境注意」写明简化点并指向 30 题、18 题 loader；`:51-53`「定义进 effect 是官方推荐写法」已核实（官方示例同模式 + ignore 标志） |
| 生产 | `react/Example.tsx:39-44`；`vue/Example.vue:38-42` | `page`/`status`/`keyword` 只在组件 state，不在 URL；与 18 题 `react/Example.tsx:289` 的结论矛盾 | 18 题 `:289`；§8.7「参数与 URL 状态」 | 用 `useSearchParams` 函数式合并更新（切筛选重置 page、`replace`），Vue 侧 `router.replace({ query: { ...route.query, page } })` |
| 生产 | `react/Example.tsx:283-295`、`:369-371`；`vue/OrderRow.vue:73-85` | 删除只有二次确认，无权限判断，也没写「按钮不显示 ≠ 安全，后端必须鉴权」 | §5.F | 引用 18 题 `can('order:delete')` 并加后端鉴权说明 |
| 小问题 | `react/Example.tsx:58-59` | `setListState({ status: 'loading' })` 位于内嵌 async 函数内，在 react-hooks 7.1.1 `recommended` 下实测**不**触发 `set-state-in-effect`（规则只标记 effect 体内同步 setState）；若把该行提到 effect 体直接调用，实测报错「Calling setState synchronously within an effect can trigger cascading renders」。注释未说明这一点，读者容易照搬成 effect 体同步 `setLoading(true)` | 实测 `npx eslint --rule 'react-hooks/set-state-in-effect: error'`（本文件 0 告警）与 `--stdin` 探针（effect 体同步 `setState` → error）；react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect | 加注释说明；或改为「loading 由 render 派生」写法（如以 `pendingKey` 判定），标【较新】 |
| 小问题 | `react/Example.tsx:47-48` | 「≈ Vue 的 `watch([keyword, status, page], load, { immediate: true })`」是类比，但 Vue 版实际只 `watch(statusFilter)`（`vue/Example.vue:72-77`），注释与对照代码不一致 | 实读两文件 | 注明「Vue 版有意用命令式调用；全参数 watch 写法只是等价类比」 |
| 小问题 | `react/Example.tsx:141`、`:118-125`；`vue/Example.vue:142`、`:117-123` | 搜索输入框在 loading 期间 `disabled`（用户不能继续输入）；重新请求时列表整体进入 loading、旧数据消失 | — | 生产写法：只禁用提交按钮；保留旧数据 + 顶部 loading 条（或指向 30 题 `placeholderData`） |
| 小问题 | `react/Example.tsx:90` | 「三次 setState 被自动批处理成一次重渲染」正确，可加交叉引用 | 24 题 `react/Example.tsx:10` | 补「（24 题）」 |

- 结构建议：修改 —— 保留综合演示与 Vue 命令式对照（`vue/OrderRow.vue:21-22` `.number` 自动应用已核实：vuejs.org/guide/essentials/forms#number）；补生产标注、URL 状态、权限表述；竞态/取消处理与 27 题一致（27 题 `:11-16` 同为 cleanup abort + `isAbortError` 忽略）。
- 待核实：无。

---

### 23. 渲染模型与 state 快照 ——「一次渲染 = 一次函数执行」与 UI = f(props, state)
- 文件：`react/Example.tsx`（310 行）、`vue/Example.vue`（302 行）
- 用到的库 / API：无第三方库；React `useState` / `useEffect` / `useRef`、StrictMode 行为（main.tsx）；Vue `ref` / `computed` / `onUpdated` / `onUnmounted`、模板 ref
- 交叉引用：指向 → [03, 06, 09, 12, 17, 24, 26]（另引 main.tsx）；被引用 ← [24, 25, 26]；不成立的引用：无（03 `items[0].quantity++` :6/:322 与「连写两次」区块一 :42 ✓；06 index-key 坑 :8 ✓；09 派生值渲染期直接算 :5 ✓；12 useRef 用途二「跨渲染保存可变值」:6 ✓；17 memo 跳过重渲染 :7 ✓；main.tsx StrictMode 说明 :3-5 ✓）
- 覆盖检查（§7 / §8）：缺失：§8.3/§7「React Compiler【较新】」—— `react/Example.tsx:303`「父组件每次重渲染，React 默认会重新调用所有子组件函数」在开启编译器（自动记忆化）后不再成立，应加一句；§8.16 心智模型部分已覆盖（重渲染 vs 细粒度响应式）。标签缺失：StrictMode 双调渲染函数（【主流】，19.x 行为，:125-126）、`Object.is` 跳过更新（【主流】，:222-224）、`ref` 作为 prop 与本题无关，不必补
- 文件头模板缺口：缺 版本行 / 最后核对 / 前置主题 / 成熟度行、一、五、六、七、八、参考（二/三/四以「React 核心概念 / Vue 对应概念 / 最重要的区别」形式存在）

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 严重 | `react/Example.tsx:192`、`:280`（同一模式；`:163` 声明处） | 区块三「直接改变量无效」的刻意反例 `localCopy += 1` 在 eslint-plugin-react-hooks 7 `recommended` 预设下被 `react-hooks/immutability` 判 **error**（"Cannot reassign variable after render completes" / "Cannot modify local variables after render completes"）；§4 计划切到官方推荐配置后本文件 lint 直接失败；开启 React Compiler【较新】时该组件会因同一诊断被跳过优化 | 本批次实测（命令见文首）；facts-sheet F（`recommended` 含 `immutability: error`） | 保留反例，但在 `:192`/`:280` 加 `// eslint-disable-next-line react-hooks/immutability` 并注释「这正是编译器规则禁止的写法，本区块要演示的就是它无效；开启 React Compiler 时此组件会被跳过优化【较新】」；30 秒速答里补一句「渲染期变量在渲染结束后不可再赋值」 |
| 概念 | `react/Example.tsx:16`、`:182`；`vue/Example.vue:18`、`:76`、`:184`、`:239` | 把 `ref` 说成「Proxy 容器」「渲染函数从 Proxy 现读」「Proxy 发现值没变」「脱离了 Proxy」——本题的 `count` 是原始值 `ref`，它不是 Proxy；Vue 官方：Proxy 只用于 `reactive()` 对象，`ref` 用 getter/setter；同值跳过是 `RefImpl` setter 里的 `hasChanged`（`!Object.is`），与 Proxy 无关（`vue/Example.vue:54` 对数组 `push` 说「Proxy 会拦截到」是对的：ref 里的对象值会被 `reactive()` 包成 Proxy） | vuejs.org/guide/extras/reactivity-in-depth："In Vue 3, Proxies are used for reactive objects and getter / setters are used for refs."；`node_modules/@vue/reactivity/dist/reactivity.cjs.js:1517-1540`（`class RefImpl` / `set value` / `hasChanged`）；`@vue/shared/dist/shared.cjs.js:86` `hasChanged = (v, o) => !Object.is(v, o)` | 统一改为「ref 是带 getter/setter 的响应式容器（对象值才会被 reactive() 包成 Proxy）」；`:184` 改「ref 的 setter 用 Object.is 判断没变，不触发」；`:239` 标题改「脱离了响应式追踪」 |
| 小问题 | `react/Example.tsx:176-177` | 「React 18+ 会把同一个事件里的多次 setter 合并成一次重渲染」暗示 17 不合并；实际 React 一直在 React 事件处理器内批处理，18 的变化是 setTimeout/Promise/原生监听器里也批（24 题） | react.dev/blog/2022/03/08/react-18-upgrade-guide："Before React 18, we only batched updates inside React event handlers." | 改为「React 一直会合并同一个 React 事件处理器里的更新；React 18 起 createRoot 下 setTimeout / Promise 里也合并（24 题）」 |
| 小问题 | `react/Example.tsx:183`（同类：`:20`、`vue/Example.vue:23`） | 「Vue 根本没有『本次渲染的 count』这个概念」无限定；本文件区块四 `:124-125`、`vue/Example.vue:133` 自己承认手动拷贝的普通值会定格，Vue 官方也列出 reactive() 解构即失去响应 | vuejs.org/guide/essentials/reactivity-fundamentals "Limitations of reactive()"："when we destructure a reactive object's primitive type property into local variables, or when we pass that property into a function, we will lose the reactivity connection" | 改为「Vue 的渲染函数和事件回调不会持有『本次渲染的 count』快照；只有你解构 / 拷贝出来的普通值才会定格（区块四）」 |
| 小问题 | `react/Example.tsx:53` | 「（spec 明写）」指代不明，读者不知道 spec 是什么 | react.dev/learn/state-as-a-snapshot："Its props, event handlers, and local variables were all calculated using its state at the time of the render." | 改为「（官方文档 State as a Snapshot 明写：props、事件处理器、局部变量都按渲染那一刻的 state 计算）」并在参考区放链接 |
| 小问题 | `react/Example.tsx:303` | 「父组件每次重渲染，React 默认会重新调用所有子组件函数（17 题讲怎么跳过）」未提 React Compiler 自动记忆化后默认行为改变 | react.dev/learn/react-compiler；facts-sheet G（babel-plugin-react-compiler 1.0.0，默认不启用） | 补「开启 React Compiler【较新】后编译器会自动记忆化，未变的子组件默认跳过；本项目未启用」 |

- 结构建议：保留（小幅修改）—— 四条机制与官方 State as a Snapshot / useState 文档逐句一致（`:222-224` 的 Object.is 表述与官方原文吻合），只需补标签、修 Proxy 措辞、给反例加 lint 说明
- 待核实：无（StrictMode 第二次渲染日志「装 DevTools 变灰」已对照 react.dev/reference/react/StrictMode 原文核实；VueMount 桥在 StrictMode 下双挂载已对照 `src/bridge/VueMount.tsx:6-11`）

---

### 24. State batching 与函数式更新 —— 更新队列、自动批处理、flushSync 与「什么时候必须函数式更新」
- 文件：`react/Example.tsx`（441 行）、`vue/Example.vue`（408 行）
- 用到的库 / API：无第三方库；React `useState` / `useEffect` / `useRef` / `SetStateAction`（类型）、`react-dom` `flushSync`；Vue `ref` / `watch`（`flush: 'post'`）/ `nextTick` / `onUnmounted`、模板 ref
- 交叉引用：指向 → [03, 06, 09, 10, 12, 14, 17, 23, 26]；被引用 ← [23, 26]；不成立的引用：`react/Example.tsx:367`「自定义 Hook 里对外暴露的 increment()：调用方在什么时候调、调几次你都不知道（14 题）」—— 14 题只有 `useDebouncedValue` / `useWindowWidth` 两个 Hook（`14-composable-and-custom-hook/react/useDebouncedValue.ts:12`、`useWindowWidth.ts:12`），没有任何暴露 `increment` / setter 的 Hook。其余：03 区块一 ✓、06 ✓、09 ✓、10 「清单」:331-334 与 latest ref 修法三 :204 ✓、12 ✓、17 useCallback ✓、23 ✓、26 ✓
- 覆盖检查（§7 / §8）：缺失：§8.3 React Compiler【较新】的 `set-state-in-effect` 规则（正好命中本题探针）未提；React 18 legacy root（`ReactDOM.render`）下仍是 17 行为——`:260` 只说 createRoot，可补一句作【旧写法】对照。标签缺失：自动批处理（18+ createRoot）【主流】、React 17 行为【旧写法】（`:11`、`:259`、`:295`）、`flushSync`【主流·逃生舱】、`useLayoutEffect`（`:265`）【主流】
- 文件头模板缺口：缺 版本行 / 最后核对 / 前置主题 / 成熟度行、一、五、六、七、八、参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 严重 | `react/Example.tsx:281-284`（规则报在 `:282`） | 区块二的「提交次数探针」在 effect 里同步 `setCommits` / `setLines`，`recommended` 预设下被 `react-hooks/set-state-in-effect` 判 **error**（"Calling setState synchronously within an effect can trigger cascading renders"）；§4 切官方推荐配置后 lint 失败。另：探针自身的 setState 会让每次事件再多一次级联提交，页面「提交次数」只数 count/flag 的提交，`:246-248` 未说明 | 本批次实测；facts-sheet F | 保留探针但加 `// eslint-disable-next-line react-hooks/set-state-in-effect` + 注释「探针刻意违反 set-state-in-effect【较新】：effect 里 setState 会级联渲染，页面上的次数只统计 count/flag 落地的提交」；`:253` 已标「不是业务代码该有的模式」，把规则名补进去 |
| 概念 | `react/Example.tsx:12-13`、`:262-266`；`vue/Example.vue:13-14`、`:23` | flushSync 官方四条 caveat 只讲了「性能 / 多一次渲染」；缺「可能把挂起的 Suspense 边界强制显示 fallback」「可能先执行挂起的 Effect 并同步应用其中的更新」「可能顺带刷出回调之外的挂起更新」；未标【主流】也未明确「官方：last resort」。第 3 条恰好解释本题现象：第二个 flushSync 会先把第一个提交留下的探针 effect 跑掉 | react.dev/reference/react-dom/flushSync Caveats："flushSync may force pending Suspense boundaries to show their fallback state." / "flushSync may run pending Effects and synchronously apply any updates they contain before returning." / "flushSync may flush updates outside the callback…" / "Most of the time, flushSync can be avoided. Use flushSync as last resort." | 在 `:262-266` 补齐三条 caveat，加「【主流】逃生舱，官方原话 last resort」；面试加分点写「Suspense 下慎用」 |
| 概念 | `react/Example.tsx:375` | 「在 Vue 里根本没有这个坑」无限定，与本题 Vue 侧 `:198-201`（把 .value 拷进普通变量就会过期）自相矛盾，也与 Vue 官方 reactive() 解构限制冲突 | vuejs.org reactivity-fundamentals "Limitations of reactive()"（解构 / 传值即失去响应）；`vue/Example.vue:218-228` 自证 | 改为「Vue 里只要在回调里现读 .value 就没有这个坑；一旦解构 reactive() 或把值拷进普通变量（Vue 侧区块三的 snapshot 按钮），坑一模一样」 |
| 小问题 | `react/Example.tsx:19`、`:153`；`vue/Example.vue:20`、`:69` | 「Vue 没有『更新队列』」——Vue 有渲染任务队列（`queueJob` 去重 + 微任务 `flushJobs`），本题 `:20-21` / `vue:126` 自己也在讲它；应限定为「没有 state 层的更新队列」 | `node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:303-319`（`queueJob`、`resolvedPromise.then(flushJobs)`） | 改为「Vue 没有 state 层的更新队列（它排队的是渲染任务，24 题区块二）、也没有 updater」 |
| 小问题 | `react/Example.tsx:146-147` | 「哪怕退回 React 17 不批处理的场景」——React 17 在事件处理器内是批处理的，不批的是 setTimeout 等；结论（count 是闭包常量）不受影响，措辞需精确 | react-18-upgrade-guide 同上 | 改为「哪怕在 React 17 不批处理的 setTimeout 里」 |
| 小问题 | `react/Example.tsx:367` | 指向 14 题的 `increment()` 例子不存在（见交叉引用） | grep 14 题三个 React 文件无 `increment` | 改为「自定义 Hook 对外暴露的更新函数（例：一个 `useCounter` 的 `increment`）」或删掉「14 题」 |

- 结构建议：修改 —— 更新队列模拟器与官方 "Queueing a series of state updates" 的 replace / updater 规则逐条一致，区块设计好；需补 flushSync caveat、加标签、修 14 题引用、给探针加 lint 说明
- 待核实：无（Vue 侧「没有 flushSync 那种同步刷新 API」已 grep `@vue/runtime-core/dist/runtime-core.d.ts` 无任何 `flush*` 导出核实；`watch` 懒执行、`flush: 'post'`、多源同 tick 合并已对照 vuejs.org/guide/essentials/watchers "user-created watcher callbacks are batched to avoid duplicate invocations"）

---

### 25. 状态提升与 state 归属 —— state 该放在哪个组件？兄弟组件怎么共享？什么该留在子组件、什么不该进全局 store
- 文件：`react/Example.tsx`（426 行）、`vue/Example.vue`（195 行）、`vue/CategoryFilter.vue`（82 行）、`vue/ProductList.vue`（45 行）、`vue/ProductListOwnCopy.vue`（82 行）、`vue/SearchBar.vue`（42 行）
- 用到的库 / API：无第三方库；React `useState`（`useEffect` 只出现在注释里，作反面写法）、`@/shared/products`（PRODUCTS / PRODUCT_CATEGORIES）、`@/shared/types`（Product）；Vue `ref` / `computed` / `defineProps` / `defineEmits` / `defineModel({ required: true })` / `v-model` / `v-if` / `v-else`
- 交叉引用：指向 → [07, 08, 09, 10, 15, 16, 23]；被引用 ← [08]（`08-parent-child-communication/react/Example.tsx:25` → 25 题）；不成立的引用：无（08 `ProductItem` 的 `editing` / `draftName` :54/:57 ✓；09 useEffect 同步派生值反模式 :10/:77 与 Vue 侧 ref+watch 反模式 :62 ✓；10 换 key 重建实例 :400、换组件类型 :396 ✓；16 「跨页面 / 跨互不嵌套组件」标准 :14-15 ✓；07 受控组件 ✓；15 Context ✓；23 快照 ✓）
- 覆盖检查（§7 / §8）：本题对应 §8.8「状态应该放在哪里」+ §8.2「你可能不需要 Effect」。缺失：(1) 「何时进全局 store」的边界只有一条——缺「服务端数据交给请求层（16 题 :14 自己列了，本题漏了；30 题）」「筛选 / 搜索条件生产中常放 URL（18 题 searchParams）」「Context（15 题）作中间档」；(2) Vue 官方的「模块级 reactive() 小 store」这档 React 无直接对应（见下表）；(3) 加分项：eslint-plugin-react-hooks 7 的 `set-state-in-effect` 会直接把 `:262` 的错误修法判 error【较新】；react.dev 还有「渲染期 setState + 比较 prev」第三种修法可一句带过。标签缺失：`defineModel` 3.4+（已写版本，未标【主流】）；Vue 3.5 响应式 props 解构【较新】未提
- 文件头模板缺口：缺 版本行 / 最后核对 / 前置主题 / 成熟度行、一、五、六、七、八、参考（六个 Vue 文件里只有 Example.vue 有文件头）

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:26`、`:32`、`:35`；`vue/Example.vue:24`、`:34`、`:38` | 「这个设计判断在 Vue 里完全一样 / 两个框架【完全一致】/ 不进 Pinia 的理由与不进 Zustand 完全相同」——判断标准（谁用、提升到刚好够用的一层）相同，但**可选工具不同**：Vue 官方把「状态提升」称为 "a possible workaround… quickly gets tedious"，并正式给出「模块级 `reactive()` 对象被多个兄弟组件 import」这一档；React 没有直接等价物（模块级可变对象需 `useSyncExternalStore` 或 Zustand 才能驱动渲染） | vuejs.org/guide/scaling-up/state-management："For case one, a possible workaround is by 'lifting' the shared state up to a common ancestor component… However, this quickly gets tedious…" / "If you have a piece of state that should be shared by multiple instances, you can use reactive() to create a reactive object, and then import it into multiple components" | 改为「判断标准两边一致；但 Vue 在『提升』和『Pinia』之间还有一档官方认可的『模块级 reactive() 小 store』，React 没有等价物——这是本题最值得写进 Vue 对照的差异」；「完全相同 / 完全一致」改「一致」+ 上述限定 |
| 概念 | `react/Example.tsx:41`；`vue/Example.vue:44` | 「Vue 里直接用 props.x 永远是最新值，只有主动 ref(props.x) 才会断开」——还有三种会断开：≤3.4 解构 `defineProps`（"foo is an actual constant and will never change"）、把 `props.x` 当值传给函数 / `watch(props.x)`（需包 getter）、解构 reactive()；3.5+ 响应式 props 解构【较新】会编译成 `props.x`，但传给 watch 仍要 `() => foo` | vuejs.org/guide/components/props "Reactive Props Destructure"："In version 3.4 and below, foo is an actual constant and will never change. In version 3.5 and above, Vue's compiler automatically prepends props." / "we can watch a destructured prop also by wrapping it in a getter: watch(() => foo, …)" | 改为「只要通过 props.x 读就是最新；解构（≤3.4）、`watch(props.x)`、拷进 ref 都会断开；3.5+ 的响应式 props 解构【较新】编译成 props.x，但传给 watch 仍需包 getter」 |
| 生产 | `react/Example.tsx:19-21`、`:373-377`；`vue/Example.vue:135-139` | 「什么时候才进全局 store」只给「跨页面 / 跨互不嵌套组件」一条边界，且未标「演示简化」：本题的 keyword / category 正是生产中通常放 **URL**（刷新 / 分享 / 后退可保留，18 题 `useSearchParams`）的那类状态；服务端数据（30 题）也不进 store；Context（15 题）是中间档 | course-upgrade-prompt §8.6/§8.7/§8.8；16 题 `react/Example.tsx:14-15` 已列「服务端数据交给请求层」 | 在区块一「为什么不进 Zustand」段补三句边界，并加「演示简化：真实列表页通常把 keyword / category 放 URL search params（18 题），组件 state 只是本题为讲归属而做的简化」 |
| 小问题 | `react/Example.tsx:39`；`vue/Example.vue:42` | 「（没有一一对应关系 —— React 里所谓「事件」就是父组件传下来的函数被调用了）」挂在「React 没有 v-model 语法糖」后面，括号里的理由讲的是 emit 机制而不是语法糖，读起来像模板残留 | 上下文本身 | 改为「（React 没有 v-model 这层语法糖：value + onChange 就是它的展开形式，08 题）」 |
| 小问题 | `vue/Example.vue:45` | 「Vue 侧必须拆成四个 .vue 文件」——SFC 约定一文件一组件；用 `defineComponent` + 渲染函数 / JSX 可在同一文件定义多个组件 | vuejs.org/guide/scaling-up/sfc（SFC 是推荐格式而非唯一格式） | 改为「SFC 一文件一组件，所以这里拆成四个 .vue 文件（非 SFC 写法可同文件，但不推荐）」 |
| 小问题 | `react/Example.tsx:262-264` | 反面修法 `useEffect(() => setLocalKeyword(keyword), [keyword])` 的三条理由正确且与官方一致，但可加分：eslint-plugin-react-hooks 7 recommended 会直接报 `set-state-in-effect`；官方另给「渲染期 setState + 比较 prev」第三种修法 | react.dev/learn/you-might-not-need-an-effect "Adjusting some state when a prop changes"（"🔴 Avoid: Adjusting state on prop change in an Effect"）；本批次 24 题实测同类写法命中 | 补一句「lint 层面：recommended 预设的 set-state-in-effect【较新】会直接报错；官方还有渲染期 setState 的写法，只用于极少数场景」 |

- 结构建议：保留（小幅修改）—— 归属表 + 反面教材 + Vue 六文件对照设计扎实，`useEffect` 只作反例且与 "You Might Not Need an Effect" 一致；需软化「完全一致」、补 Vue 模块级 store 对照、补 store 边界与 URL 状态说明
- 待核实：无（`defineModel({ required: true })` 去掉 `undefined` 已对照 `node_modules/@vue/runtime-core/dist/runtime-core.d.ts:334-339` 重载；`watch` 默认 `flush: 'pre'` 早于子组件 DOM 更新已对照 vuejs.org watchers "Callback Flush Timing"）

---

### 26. 过期闭包（stale closure）—— 延迟回调、手动事件监听、轮询读到旧 state 的现场、观察与修法
- 文件：`react/Example.tsx`（630 行）、`vue/Example.vue`（491 行）
- 用到的库 / API：无第三方库；React `useState` / `useEffect` / `useRef` / `useCallback` / **`useEffectEvent`**（从 `react` 导入，19.2 稳定导出）、`@/shared/mockApi` `fetchOrders`、`@/shared/types`（ORDER_STATUS_TEXT / OrderStatus）；Vue `ref` / `onMounted` / `onUnmounted`、模板 ref、`@keydown.enter`
- 交叉引用：指向 → [03, 06, 07, 10, 12, 17, 19, 22, 23, 24, 27, 30]；被引用 ← [10（`10-effects-and-lifecycle/react/Example.tsx:41` → 26 题）, 23, 24]；不成立的引用：无（10 三种修法 :12-13、:47-49 ✓；10 「依赖比间隔还频繁定时器永远不触发」:171 ✓；10 「换组件类型 = 换实例」:396 ✓；12 用途一 DOM ref ✓；17 useCallback ✓；27 AbortController :13/:313 ✓；07 受控 select ✓；19/22/30 会改订单数据 —— `shared/mockApi.ts:150-188` 注释 ✓；「all=15 / pending=6 / paid=6 / cancelled=3」按 `mockApi.ts:46-62` 数据核对 ✓）
- 覆盖检查（§7 / §8）：本题对应 §8.2「useEffectEvent【较新】」+ §8.3。缺失：(1) 区块三缺「定时器只建一次且参数最新」的【主流】解法 latest ref（10 题修法三、本题区块一已用），导致该需求的唯一答案是【较新】API；(2) React 18 / 19.0–19.1 项目不能 `import { useEffectEvent } from 'react'`，未说明；(3) React Compiler【较新】使 `:329` 的 `useCallback` 可省未提。标签缺失：函数式更新 / 依赖数组 / latest ref / useCallback【主流】、useEffectEvent【较新，19.2+】
- 文件头模板缺口：缺 版本行 / 最后核对 / 前置主题 / 成熟度行、一、五、六、七、八、参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:15-18`、`:32`、`:38`、`:368`、`:381`、`:479-500`、`:620`；`vue/Example.vue:14-15`、`:192`、`:404` | `useEffectEvent` 未标【较新】，在区块三作为「修法二」与依赖数组并列，而「定时器只建一次、参数最新」的【主流】写法 latest ref 在区块三缺席（只在区块一用于「读」）；`import { useEffectEvent } from 'react'` 只在 React 19.2+ 可用（19.2 起稳定导出），React 18 仍占 24.7% 周下载的项目无法照抄；总结 `:620` 把它和 latest ref 并列为默认选项 | facts-sheet A（19.2.8 `exports.useEffectEvent`，`@types/react` `@version 19.2.0`）；react.dev/blog/2025/10/01/react-19-2；course-upgrade-prompt §3.1 / §7 | (a) 头部与 `:479` 标「【较新】React 19.2 起内置；18 / 19.0–19.1 项目用 10 题修法三 latest ref」；(b) 区块三 POLL_MODES 加「【修法二】latest ref（10 题）【主流】」，useEffectEvent 改「【修法三】【较新】」；(c) 30 秒速答只讲函数式更新 / 依赖数组 / latest ref，useEffectEvent 作加分点 |
| 概念 | `react/Example.tsx:488-492` | 官方四条 caveat 只讲了两条：缺第 3 条「不要用它来逃避依赖数组，只用于确实是『由 Effect 触发的事件』的逻辑」；第 2 条少了「也不能传给其他 Hook / 其他 Effect Event 里可调用」半句。第 4 条（身份每次渲染都变）`:17-18`、`:483-484` 讲对了且与源码一致（`mountEvent` / `updateEvent` 每次调用都返回新函数；`commitUseEffectEventMount` 阶段 `ref.impl = nextImpl`） | react.dev/reference/react/useEffectEvent Caveats："Effect Events can only be called from inside Effects or other Effect Events. Do not call them during rendering or pass them to other components or Hooks." / "Do not use useEffectEvent to avoid specifying dependencies in your Effect's dependency array. This hides bugs… Only use it for logic that is genuinely an event fired from Effects." / "Effect Event functions do not have a stable identity. Their identity intentionally changes on every render."；`node_modules/react-dom/cjs/react-dom-client.development.js:8676-8698`、`:13888` | 补第 3 条，并说明本例轮询 tick 为何算「genuinely an event」（官方 Separating Events from Effects 的 `onTick` 例子同型）；第 2 条补「其他 Hook」 |
| 概念 | `react/Example.tsx:125-127`、`:316-317`、`:353`、`:360` | 「JSX 里的 onClick 不会过期 / React 合成事件不会过期 / 不需要任何修法」无限定：用 `useCallback` / `useMemo` 缓存的 JSX 处理器一旦依赖漏写，返回的仍是旧渲染的闭包，一样过期——这是 17 题 memo 场景最常见的坑，也是 exhaustive-deps 存在的原因 | react.dev/reference/react/useCallback："it will either return an already stored fn function from the last render (if the dependencies haven't changed)…"；同页建议用 updater 去掉 state 依赖 | 加限定「前提是没用 useCallback / memo 把旧闭包缓存起来（17 题）；缓存了就回到依赖数组的问题」 |
| 概念 | `vue/Example.vue:78`（同类：`:25-26`、`:32`；`react/Example.tsx:26`） | 「Vue 没有这个坑要修」与 Vue 官方 reactive() 限制（解构 / 传值即失去响应）、≤3.4 的 props 解构、以及本文件自己的三个「手动快照」对照按钮矛盾 | vuejs.org reactivity-fundamentals "Limitations of reactive()"；vuejs.org props "In version 3.4 and below, foo is an actual constant and will never change." | 改为「Vue 没有『框架替你拷快照』这个坑；但解构 reactive()、≤3.4 解构 props、把 .value 拷进普通变量，会得到同样的过期值——这正是本文件每个区块的对照按钮」 |
| 概念 | `react/Example.tsx:498-499`；`vue/Example.vue:196` | 「useEffectEvent 在 Vue 侧没有任何对应物」——「回调里读最新值但不让它成为依赖」这一分离，Vue 的 `watch`（显式 source）vs `watchEffect` 正是同一概念；本题 setInterval 场景确实用不上（文件也说了），但「没有任何对应物」过头 | vuejs.org/guide/essentials/watchers "watch vs. watchEffect"："watch only tracks the explicitly watched source. It won't track anything accessed inside the callback." | 改为「概念上最接近的是 watch(显式 source)：回调里读到的其他 ref 不会成为依赖；setInterval 场景本身不需要这层分离」 |
| 小问题 | `react/Example.tsx:35`、`:107` | 「根本没有 effect」与 `:115`「（除了给 ref 同步值的那个）」及 `useTimeouts` 内的 `useEffect`（`:86`）不一致 | 本文件代码 | 改为「不靠 effect 也会过期」/「没有 effect 参与也照样过期」 |
| 小问题 | `react/Example.tsx:325-329`、`:545` | `useCallback(..., [])` 用法与说明正确（只用 setter 函数式更新，`[]` 诚实），但未提 React Compiler 后可省 | react.dev/reference/react/useCallback："React Compiler automatically memoizes values and functions, reducing the need for manual useCallback calls." | 补「开启 React Compiler【较新】后不必手写；本项目未启用」 |
| 小问题 | `vue/Example.vue:139-140`、`:147-148`、`:166-169` | 「模板 ref 在卸载过程中被置回 null，onUnmounted 里读不到」与源码一致（`unmount` → `setRef(null)` 同步执行，`um` 钩子随后 post-flush），但更简单的写法是在 `onBeforeUnmount`（实例仍完整可用）里 `removeEventListener`，不必额外保存元素 | `node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:6717-6719`（`setRef(ref, null, …, true)`）、`:6839-6848`（`bum` 先于 `unmount(subTree)`，`um` 入 post 队列）；vuejs.org/api/composition-api-lifecycle onBeforeUnmount："the component instance is still fully functional." | 保留现写法作为「为什么 onUnmounted 里 ref 是 null」的讲解，补一句「更简单：onBeforeUnmount 里移除」 |

- 结构建议：修改 —— 三个区块（无 effect 的延迟回调 / 手动监听 / 轮询）的分工好、cleanup 纪律到位、alive 标志设计正确；只需调整成熟度分层：latest ref 进区块三作【主流】，useEffectEvent 标【较新】并排，补第 3 条 caveat，修四处绝对化
- 待核实：无（`:242`「exhaustive-deps 会警告缺少 count 和 onLog」的具体文案被 `eslint-disable-next-line` 屏蔽，未实测，属标准行为；`:16`「exhaustive-deps 禁止把它写进数组」已对照 `eslint-plugin-react-hooks.development.js:548-551` "Functions returned from `useEffectEvent` must not be included in the dependency array"）

---

### 27. 异步竞态、取消与过期响应
- 文件：`react/Example.tsx`（493 行）、`vue/Example.vue`（352）、`vue/ResultPanel.vue`（119）、`vue/panelTypes.ts`（17）
- 用到的库 / API：React `useState` / `useEffect`（cleanup）/ `useRef`、`key` 重置；DOM `AbortController` / `AbortSignal` / `DOMException('AbortError')`；`@/shared/mockApi` `fetchUsers` / `isAbortError`。Vue `ref` / `watch`（第三参数 `onCleanup`，数组 source）/ `onUnmounted`；`ResultPanel.vue` 用 `defineProps<>` / `defineEmits<{ retry: []; clearLog: [] }>`；`v-model`。
- 交叉引用：指向 → [06, 07, 08, 10, 11, 12, 23, 24, 25, 26, 30]；被引用 ← [30]（"27 题 = 手写竞态取消"）；不成立的引用：无（10 题 `react/Example.tsx:322` 确有 cleanup 里 `controller.abort()`；11 题有 `load()` / `reloadFlag` / 判别联合 / 空态；26 题有 latest ref；30 题有 `queryFn({ signal })`——但 30 题的"自动取消"有前提，见 30 题第 6 条）
- 覆盖检查（§7 / §8）：属 §8 组 6「在 useEffect 里直接请求的问题（竞态）→ TanStack Query」。缺失：react.dev 说明 `ignore` 是"最可靠"修法的理由（fetch 之后可能还有别的异步步骤）；Vue 3.5 `onWatcherCleanup()`【较新】；React 17 及以前"setState on unmounted"警告的【旧写法】对照。标签缺失：全文没有任何成熟度标签（StrictMode 双跑、React 18+ 无警告 no-op 均应标【主流】并注明起始版本）。
- 文件头模板缺口：缺 头部元信息（适用版本 / 最后核对 / 前置主题 / 成熟度）/ 一 / 五 / 六 / 七 / 八 / 参考（现有"React 核心概念 / Vue 对应概念 / 最重要的区别"≈ 二 / 三 / 四）

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 严重 | `react/Example.tsx:200, 207-208, 263, 271-272, 343, 351-352` | 三个面板的 effect 体内同步调用 `setState({ status: 'idle' })`、`setState({ status: 'loading' })` 与 `log()`（→`setLines`）；在 eslint-plugin-react-hooks 7.1.1 的 `recommended` 预设下被 `react-hooks/set-state-in-effect` 判 error。基线通过只是因为本仓库手动只开了两条规则；spec §4 要求"使用官方推荐配置"，切换后本文件 lint 失败 | 只读实测：`npx eslint --rule '{"react-hooks/set-state-in-effect":"error",…}' src/topics/27-…/react/Example.tsx` → 3 errors（200:7、263:7、343:7 "Calling setState synchronously within an effect can trigger cascading renders"）；facts-sheet F（recommended 含 set-state-in-effect=error）；28/29/30 的 .tsx 在同一组规则下 0 问题 | 把 idle / loading 改成渲染期派生（`forKeyword` 本来就在 state 里）：`const view = keyword === '' ? IDLE : state.status === 'success' && state.forKeyword !== keyword ? LOADING : state`；effect 只保留发请求与 then/catch 里的 setState（回调里 setState 不被该规则拦）；若为教学刻意保留同步写法，加行内 `eslint-disable-next-line react-hooks/set-state-in-effect` 并注明"演示简化" |
| 概念 | `react/Example.tsx:29-30, 393-397`；`vue/Example.vue:29-30, 232-236` | "Vue 侧没有这一招（换 key 销毁重建）（没有一一对应关系）"——Vue 的 `key` 同样能强制替换组件 / 元素并重跑生命周期；Vue 侧"没有"只是因为本题把三个面板的状态写在同一个父 setup 里而不是子组件，是模式差异不是框架差异（§5.C + §5.H） | vuejs.org/api/built-in-special-attributes.html#key："can also be used to force replacement of an element/component instead of reusing it… Properly trigger lifecycle hooks of a component" | 改为"Vue 同样可用 `:key` 重建组件；本题 Vue 侧因为状态住在父 setup 里才逐个赋回初始值"，删掉"没有一一对应关系" |
| 概念 | `react/Example.tsx:15-16, 250-251, 333`；`vue/Example.vue:16, 131` | "拿得到 signal 就 abort（首选）；ignore 是拿不到 signal 时的唯一选择"——方向与官方相反：react.dev 把 `ignore` 标志称为"最可靠"的修法，理由是 fetch 之后可能还链着别的异步步骤，abort 只取消拿到 signal 的那一步；二者并不互斥（生产常 abort + ignore 并用） | react.dev/learn/synchronizing-with-effects → Fetching data："More asynchronous steps could be chained after the fetch, so using an explicit flag like `ignore` is the most reliable way to fix this type of problem." | 改为"abort 省网络、ignore 最可靠（覆盖后续所有异步步骤）；两者可叠加：abort 之后仍以 ignore / 请求序号守门"；"唯一选择"改为"仍然可用的办法" |
| 概念 | `vue/Example.vue:92-93` | "Vue 显式声明 source、不存在「漏依赖」这个坑"——`watch` 只追踪 source，回调里读到但没列进 source 的 ref 不会触发重跑，这正是同一类"漏依赖"，而且没有 exhaustive-deps 这种 lint 帮你查；只有 `watchEffect` 自动追踪（§5.D） | vuejs.org/guide/essentials/watchers.html："`watch` only tracks the explicitly watched source. It won't track anything accessed inside the callback."；"`watchEffect`… automatically tracks every reactive property accessed during its synchronous execution" | 改为"Vue 把依赖显式写在 source 里，漏写同样不会触发、也没有 lint 提醒；watchEffect 才是自动追踪" |
| 概念 | `vue/panelTypes.ts:3` | "`<script setup>` 的 SFC 不能 export 类型"——已安装 @vue/compiler-sfc 3.5.42 只拒绝值导出，`export type` / `export interface` 允许（28 题同一结论，见其第 1 条） | `node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js:25737` `node.type === "ExportNamedDeclaration" && node.exportKind !== "type"` 才 `cannot contain ES module exports`；scratchpad 内 `compileScript` 实测：含 `export type` / `export interface` 的 `<script setup lang="ts">` 编译 OK，`export const` 报错 | 理由改为"跨组件共享的类型放独立 .ts 更通用（不依赖从 .vue 导入类型）"，不要写成"不能"；起始版本待核实 |
| 小问题 | `react/Example.tsx:48, 450`；`vue/Example.vue:49, 279` | "四个请求【一定】逆序返回"是确定性延迟下的演示前提，可接受；但页面文案 :450 / :279 没有带前提 | — | 句尾加"（本题延迟由关键词长度决定，所以必然）" |
| 小问题 | `react/Example.tsx:181-182, 253-254` | "React 18+ 对已卸载组件的 setState 是无声 no-op"正确，但缺【旧写法】对照：18 以前会打印 "Can't perform a React state update on an unmounted component"，存量代码常见 `isMounted` 兜底 | react.dev/blog/2022/03/08/react-18-upgrade-guide "No warning about setState on unmounted components… We've removed this warning." | 补一句 18 前的警告与 `isMounted` 反模式，标【旧写法】 |
| 小问题 | `react/Example.tsx:22`；`vue/Example.vue:21-22, 183` | `onCleanup` 两个时机的描述正确；缺 Vue 3.5 `onWatcherCleanup()`【较新】对照（且必须在回调同步阶段调用，await 之后不能用） | vuejs.org/guide/essentials/watchers.html Side Effect Cleanup（3.5+ `onWatcherCleanup`；"must be called during the synchronous execution"） | 补一行对照并标【较新 3.5+】 |

- 结构建议：修改 —— 复现设计与三面板对比很好，保留；主要修 recommended 预设下的 lint 风险、三处"框架差异"措辞，并补文件头模板。
- 待核实：`<script setup>` 允许 `export type` 的起始 Vue 版本（源码证实 3.5.42 允许，版本号未查到）；消费端 vue-tsc 从 `.vue` 文件 `import type` 是否顺畅（需运行验证）。

---

### 28. React + TypeScript 基础
- 文件：`react/Example.tsx`（678 行，全仓库最大）、`vue/Example.vue`（437）、`vue/OrderCard.vue`（63）、`vue/OrderFilterForm.vue`（164）、`vue/types.ts`（42）
- 用到的库 / API：React `useState`；类型 `ChangeEvent` / `FormEvent` / `MouseEvent`（别名 `ReactMouseEvent`）/ `ReactNode`；TS：字符串联合、`as const satisfies`、类型谓词 `value is T`、`Record<K, V>`、`(typeof X)[number]`、`unknown` + `in` 收窄、`catch (err: unknown)`、`verbatimModuleSyntax` 的 inline `type` 导入。Vue `ref` / `computed` / `defineProps<T>()` / `withDefaults` / `defineEmits<{ x: [...] }>()` / `defineSlots` / `$slots` / `v-model` / 原生 `Event` + `instanceof`。
- 交叉引用：指向 → [02, 03, 04, 05, 07, 08, 09, 10, 13, 21, 25, 29]；被引用 ← [29]（"28 题：这正是 v-model 帮你省掉的那一步"）；不成立的引用：无（02 题 :35/:118 有 `ComponentPropsWithoutRef` 与 ref-as-prop；10 题 :377 有 `as TimerMode`；05 题有 `0 &&`；09 题 :10/:77 有"派生值放 state + effect 同步"反模式；25 题有 `useState(props.x)`；13 题有 ReactNode / 具名插槽）
- 覆盖检查（§7 / §8）：§8 组 11「组件、Hooks、泛型组件的类型写法；React 19 的类型变化」。缺失：① 整节"React 19 的类型变化"（`useRef` 必须传参、`MutableRefObject`→`RefObject`、`ReactElement` props 默认 `unknown`、全局 `JSX`→`React.JSX`、`useReducer` 推断改进、`types-react-codemod`）；② 泛型组件写法（如 `function List<T>({ items, renderItem }: ListProps<T>)`）；③ `ReactNode` vs `ReactElement`（官方 TS 页明确对比，本题只讲 ReactNode）；④ `ComponentProps` / `ComponentPropsWithRef` 与 ref-as-prop（19 起）的关系（02 题一句带过，本题未接）；⑤ `useRef` / `useContext` / `useCallback` 的类型写法、`React.CSSProperties`。标签缺失：全文无成熟度标签；Vue 侧 `defineEmits` 具名元组【3.3+】、`defineSlots`【3.3+】、`defineModel`【3.4+】未标版本（仅 props 解构标了 3.5）。
- 文件头模板缺口：缺 头部元信息 / 一 / 五 / 六 / 七 / 八 / 参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 严重 | `react/Example.tsx:33`；`vue/Example.vue:34`；`vue/types.ts:4` | "类型只能放 .ts：`<script setup>` 不能 export 类型（它编译成 setup 函数，模块导出被占用了）"——结论与已安装编译器相反：compiler-sfc 3.5.42 仅拒绝值导出（`exportKind !== "type"` 被豁免），`export type` / `export interface` 编译通过；本题作为 TS 专题把它当规则讲了三遍 | `node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js:25737`；scratchpad 内 `parse`+`compileScript` 实测：A（`export type` + `export interface`）OK，B（`export const`）报 "cannot contain ES module exports" | 改为"可以 `export type`，但跨组件共享的类型放独立 .ts 是更通用的做法（消费端不必从 .vue 导入类型，工具链更稳）"；起始版本待核实；消费端 vue-tsc 行为需运行验证 |
| 概念 | `react/Example.tsx:259-260, 369`；`vue/Example.vue`（无对应）| `React.FC` 的取舍表述基本正确（18 起无隐式 children；写不出泛型组件），但只说"社区惯例"，没有给官方立场——react.dev TypeScript 页通篇用"给 props 参数标类型"写法、根本不提 `React.FC`；也缺【旧写法】标签（`React.FC<Props>` 在存量代码里大量存在，面试会问） | `@types/react/index.d.ts:1060-1061` `interface FunctionComponent<P = {}> { (props: P): ReactNode \| Promise<ReactNode>; …}`（无 children、无 defaultProps）；react.dev/blog/2022/03/08/react-18-upgrade-guide "the `children` prop now needs to be listed explicitly when defining props"；react.dev/learn/typescript（不提 FC） | 补"官方文档写法 = 参数标注；`React.FC` 标【旧写法／仍可用】；18 起 children 需显式（可用 `PropsWithChildren<P>`）" |
| 概念 | `react/Example.tsx:2-47`（文件头）、`:412-432`（useState 泛型段） | 缺"React 19 的类型变化"（规格 §8 组 11 明确要求）：本题是 TS 专题，却没出现 `useRef`、`RefObject`、`React.JSX`、`ReactElement` 任何一个 19 相关变化；`useState` 泛型三种情况讲得好，但 19 的 `useRef` 必须传参（存量代码 `useRef<T>()` 直接类型报错）与之同类却没讲 | facts-sheet A/B（升级指南 TypeScript changes 已核实）；`@types/react/index.d.ts:1737` `useRef<T>(initialValue: T): RefObject<T>`（无零参重载）、`:1669-1672` `@deprecated Use RefObject instead` / `interface MutableRefObject`、`:325-333` `ReactElement<P = unknown, …>`、`:4141` `namespace JSX` 位于 React 命名空间内 | 新增区块四或"八、旧写法对照"：`useRef<T>(null)` 必填、`MutableRefObject`→`RefObject`、`JSX.Element`→`React.JSX.Element`、`ReactElement` props unknown、`useReducer` 推断改进、`types-react-codemod`；每条标【主流 19.0+】/【旧写法 ≤18】 |
| 概念 | `react/Example.tsx:24-25, 40, 618`；`vue/Example.vue:23-25, 42, 400`；`vue/OrderFilterForm.vue:8, 34-35, 40-47` | Vue 侧编译器宏缺版本 / 成熟度标注：`defineEmits` 具名元组 3.3+、`defineSlots` 3.3+、`defineModel` 3.4+、响应式 props 解构 3.5+（只有最后一个标了）；且 `:34` "对象默认值必须写成工厂函数"应限定为 withDefaults —— 3.5 解构默认值不需要工厂函数 | vuejs.org/api/sfc-script-setup.html："3.3+: alternative, more succinct syntax"（tuple）、defineSlots "3.3+"、defineModel "3.4+"、destructure "3.5+"；"This requirement is not necessary when using default values with destructure" | 各处补【主流 3.3+】【较新 3.5+】；`:34` 改为"withDefaults 里必须写工厂函数；3.5 解构默认值不需要" |
| 小问题 | `react/Example.tsx:50` | "spec 里写的 React.ChangeEvent<…>"——"spec" 指向读者看不到的需求文档，属生成 / 模板残留 | — | 改为"官方文档常用 `React.ChangeEvent<…>` 命名空间写法" |
| 小问题 | `react/Example.tsx:17, 278`；`vue/Example.vue:17` | "永远不写 e: any" / "断言等于自欺"——绝对化，但属编码规范可接受 | — | 可改"不要写 e: any" |
| 小问题 | `react/Example.tsx:39` | "本项目 22 道旧题的示例全是 TS，这就是为什么推荐顺序里本题排在第二位、仅次于 23 题"——现在是 30 题，"旧题"是历史信息；顺序绑定 registry，一改即失效 | `src/shell/topicRegistry.ts:239-240` `RECOMMENDED_ORDER = ['23', '28', …]`（目前属实） | 改为"所有示例都是 TS，所以推荐顺序把本题放在最前（见目录说明）" |
| 小问题 | `vue/OrderFilterForm.vue:7`；`vue/OrderCard.vue:7` | 引用 `vue/require-default-prop`"要求可选 prop 默认值、布尔豁免"——规则属于 `flat/strongly-recommended`（本仓库 `flat/recommended` 已包含，级别是 warn），布尔豁免属实 | `node_modules/eslint-plugin-vue/dist/configs/flat/vue3-strongly-recommended.js:22` `"vue/require-default-prop": "warn"`；`dist/rules/require-default-prop.js:21-32` Boolean 豁免 | 注明"strongly-recommended 级别（warn）" |

- 结构建议：修改 —— 三个区块与速查表保留；新增"React 19 类型变化 + 泛型组件 + ReactNode/ReactElement"一节；修正 `<script setup>` 导出结论；Vue 宏补版本标签。
- 待核实：`<script setup>` 允许 `export type` 的起始 Vue 版本。

---

### 29. useReducer 与判别联合 Action
- 文件：`react/Example.tsx`（419 行）、`vue/Example.vue`（442）
- 用到的库 / API：React `useReducer`（reducer 纯函数、`default` 分支 `never` 穷尽检查、惰性 init 第三参数仅注释提及）/ `useState`；`@/shared/products` `PRODUCTS`。Vue `reactive` / `ref` / `computed`；原生 `Event` + `as HTMLInputElement`。
- 交叉引用：指向 → [03, 06, 07, 09, 15, 16, 17, 21, 24, 26, 28]；被引用 ← [28]（"29 讲判别联合 Action + never 穷尽检查"）；不成立的引用：无（03 题 :205-211 有 `never` 穷尽检查与 useReducer 入门；15 题 :9 有"不是完整状态管理方案"；16 题 :12 提到 Redux Toolkit；24 题 :20 有"Vue 批的是 DOM 刷新"）
- 覆盖检查（§7 / §8）：§8 组 2「useState / useReducer」。缺失：React 19 `useReducer` 类型推断改进（`ActionDispatch<A>`、显式泛型写法变化）；`useReducer + Context` 组合只一句带过、无代码（§8 组 8 "Context 的边界"处应有对照）；Redux Toolkit `createSlice`（大量存量项目）作为对照未提。标签缺失：全文无成熟度标签。
- 文件头模板缺口：缺 头部元信息 / 一 / 五 / 六 / 七 / 八 / 参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:125-126` | "ESLint 的 no-unused-expressions 也不允许写成 `action satisfies never;` 这种裸表达式"——与实测相反：本仓库配置（typescript-eslint 8 的 `@typescript-eslint/no-unused-expressions`）对 `a satisfies never` 语句不报错 | 只读实测 `npx eslint --stdin --stdin-filename src/topics/29-…/react/_probe.tsx`：探针 A（`a satisfies never` 语句）EXIT 0 无输出；对照探针 B（`a + 1` 语句）报 `@typescript-eslint/no-unused-expressions`；规则源码 `@typescript-eslint/eslint-plugin/dist/rules/no-unused-expressions.js:44-62` 未把 `TSSatisfiesExpression` 视为无用表达式 | 删掉这半句；"noUnusedLocals 要求 exhaustive 被使用"的理由成立（`tsconfig.json` `noUnusedLocals: true`），可保留；或直接改用 `action satisfies never` 并说明两种写法皆可 |
| 概念 | `react/Example.tsx:30-32, 192-193`；`vue/Example.vue:31-33, 210, 424` | "想绕过 reducer 直接改状态在 API 上就做不到 / React 侧根本写不出来"——绝对化：React 没有 setter，但 `items[0].quantity++` 这种原地 mutate 照样写得出来（不触发渲染，下一次渲染后"重放一致"同样会变 ✗）；真正的保障是不可变约定 + React Compiler 的 `immutability` lint | react.dev/reference/react/useReducer "State is read-only. Don't modify any objects or arrays in state… always return new objects from your reducer"；facts-sheet F：recommended 预设含 `react-hooks/immutability`(error) | 改为"没有 setter；直接 mutate state 是另一类 bug（21 题），编译器 lint 的 immutability 规则会拦" |
| 小问题 | `react/Example.tsx:57-58` | "Redux 社区的 { type, payload } 只是另一种排版，判别联合的原理完全一样"——手写 FSA 联合确实同理，但 Redux Toolkit `createSlice` 生成的 action creator / `PayloadAction<P>` 不靠手写联合 | — | 限定为"手写 `{ type, payload }` 联合时原理相同；RTK 的类型由 createSlice 推断" |
| 小问题 | `react/Example.tsx:87-89` | "本项目没有装测试框架，这里只展示形态"当前属实，但规格 §2.9 要求关键结论有测试；纯 reducer 是最适合的测试对象 | `package.json` 无 test 脚本；`node_modules/.bin` 无 vitest | 阶段 1 装 vitest 后补 `cartReducer.test.ts`（含 never 穷尽的类型测试），删掉这句 |
| 小问题 | `react/Example.tsx:12, 195-196`；`vue/Example.vue:13` | "dispatch 引用跨渲染稳定，不需要 useCallback"正确，建议引官方原话并说明 exhaustive-deps 允许省略 | react.dev/reference/react/useReducer "The `dispatch` function has a stable identity, so you will often see it omitted from Effect dependencies" | 加依据与【主流】标签 |
| 小问题 | `react/Example.tsx:8, 77-78, 199, 227`；`vue/Example.vue:9` | StrictMode 双调 reducer / initializer 的表述正确；部分位置缺"仅开发环境"限定与成熟度标签 | react.dev/reference/react/useReducer "In Strict Mode, React will call your reducer and initializer twice… development-only behavior" | 加标签与 development-only 限定 |
| 小问题 | `react/Example.tsx:69, 109-110` | bail-out（返回同引用 → 跳过渲染）描述正确，漏了官方备注"React 可能仍会调用组件函数再丢弃结果" | react.dev/reference/react/useReducer "React may still need to call your component before ignoring the result" | 加半句 |

- Vue 侧核对：`reactive` + 类型化 `apply()` 原地修改的对照准确（源码与注释一致）；"Pinia action 就是这个模式"已讲到位（`:22-23` "跨组件时是 Pinia 的 action，不需要 action 对象"；`:28` "Pinia action ≠ reducer：直接 mutate、可 async"）；`:171` "Vue 没有 StrictMode 双跑（没有一一对应关系）"成立。
- 结构建议：保留（小修）—— 讲解与演示（日志 / 撤销 / 重放 / 反面按钮）扎实；补 React 19 推断改进、RTK 对照与文件头模板即可。
- 待核实：无。

---

### 30. TanStack Query 与服务端状态
- 文件：`react/Example.tsx`（461 行）、`vue/Example.vue`（449）、`vue/OrdersCountBadge.vue`（43）、`vue/queryPlugin.ts`（44）
- 用到的库 / API：`@tanstack/react-query` 5.102.8：`QueryClient` / `QueryClientProvider` / `useQuery` / `useMutation` / `useQueryClient` / `notifyManager.batchCalls` / `QueryCache.subscribe` / `findAll` / `Query.getObserversCount`；React `useSyncExternalStore` / `useEffect` / `useRef` / `useState`。`@tanstack/vue-query` 5.102.8：`VueQueryPlugin` / `QueryClient` / `useQuery`（ref / computed 作 queryKey）/ `useMutation` / `useQueryClient`；Vue `ref` / `computed` / `onMounted` / `onUnmounted` / `defineProps`。`@/shared/mockApi` `fetchOrders` / `updateOrder` / `isAbortError`。
- 交叉引用：指向 → [03, 08, 09, 10, 11, 15, 16, 19, 22, 27]；被引用 ← [27]（queryFn signal）、[16]（"服务端数据交给请求层（如 TanStack Query，见 30 题）"）；不成立的引用：`vue/Example.vue:38` "（16 题的 cartStore 注释）"——该注释在 16 题 `react/cartStore.ts:11`，Vue 侧 `vue/cartStore.ts` 没有这段（16 `vue/Example.vue:15` 文件头有类似一句）
- 覆盖检查（§7 / §8）：§8 组 6「→ TanStack Query；缓存与失效」。缺失：`status` × `fetchStatus` 两个维度、`isLoading`（v5 = `isPending && isFetching`）与 `isRefetching`；【旧写法】v4→v5 对照只讲了"位置参数移除"一条（缺 `isLoading`→`isPending`、`cacheTime`→`gcTime`、`keepPreviousData: true`→`placeholderData: keepPreviousData`、useQuery 的 onSuccess/onError/onSettled 移除、`useErrorBoundary`→`throwOnError`、`remove()`→`removeQueries`）；`useSuspenseQuery`（全文未提，也未说明本题为何不用）；`queryOptions()` 仅一句；`mutateAsync` / `enabled` / `select` 未提。标签缺失：全文无成熟度标签（v5 应标【主流】）。registry summary（`topicRegistry.ts:217`）仍用 v4 的"loading / error / data"措辞。
- 文件头模板缺口：缺 头部元信息 / 一 / 五 / 六 / 七 / 八 / 参考

| 级别 | 位置 | 问题 | 依据 | 修改建议 |
|---|---|---|---|---|
| 概念 | `react/Example.tsx:14-17, 175, 178-179, 316`；`vue/Example.vue:15-16, 122, 127, 288` | 把 `isPending` 讲成"首次加载（中）"：v5 里 `isPending` 只表示 `status === 'pending'`（还没有数据），与是否在请求无关（`enabled: false` 时也为 true）；"首次加载中"是 `isLoading = isPending && isFetching`；"后台刷新中"库已提供 `isRefetching = isFetching && !isPending`（本题手工拼）；`status` / `fetchStatus` 两维度全文未提。演示因 `enabled` 默认 true 不会出错，但概念不完整、面试易被追问 | `node_modules/@tanstack/query-core/build/modern/queryObserver.js:237-261`（`isFetching = fetchStatus === "fetching"`；`isPending = status === "pending"`；`isLoading = isPending && isFetching`；`isRefetching = isFetching && !isPending`）；tanstack.com/…/guides/queries "The status gives information about the data: Do we have any or not? The fetchStatus gives information about the queryFn: Is it running or not?" | 增加"两维度"小节；`加载中…` 分支改用 `isLoading`；"后台刷新中"改用 `isRefetching`；v4 的 `isLoading` 语义标【旧写法】 |
| 概念 | `react/Example.tsx:171`；`vue/Example.vue:118` | 【旧写法】对照只有"v4 位置参数已移除"；缺 `cacheTime→gcTime`、`isLoading→isPending`、`keepPreviousData→placeholderData: keepPreviousData`、useQuery 回调移除、`useErrorBoundary→throwOnError`——存量 v4 项目与面试题常见 | tanstack.com/…/guides/migrating-to-v5（各条原文已抓取）；`query-core/build/modern/utils.js:189` 导出 `keepPreviousData` 函数 | 增设"八、旧写法对照（v4）"表，每条一行 |
| 生产 | `react/Example.tsx:232-233` | `useSyncExternalStore` 的 `subscribe` 每次渲染都是新箭头函数 → React 每次重渲染都退订 / 重订；本组件每秒 `setNow` 一次，等于每秒重订一次。官方文档 Pitfall 明确要求把 subscribe 提到组件外或 `useCallback`；库自身也用 `useCallback` 包 subscribe。注释没标"演示简化" | react.dev/reference/react/useSyncExternalStore "If a different `subscribe` function is passed during a re-render, React will re-subscribe to the store… declare `subscribe` outside the component / useCallback"；`react-query/build/modern/useBaseQuery.js:30` `React.useCallback((onStoreChange) => …, [observer, shouldSubscribe])` | `const subscribe = useCallback((cb: () => void) => cache.subscribe(notifyManager.batchCalls(cb)), [cache])`，并在注释里点明这条 Pitfall（本身就是好教学点） |
| 概念 | `vue/OrdersCountBadge.vue:18` | "`<script setup>` 不能 export 类型，这里各写一份"——同 27 / 28，与 compiler-sfc 3.5.42 相反 | `compiler-sfc.cjs.js:25737`；scratchpad 编译实测 | 改理由为"共享类型放 .ts"；或直接从 `../react` 侧 / 独立 `types.ts` 导入 |
| 小问题 | `react/Example.tsx:271` | `e.target.value as StatusFilter` 断言——与 28 题"值来自 select 用守卫、不用 as"的教学自相矛盾（10 题同款写法，但 28 已明确升级为守卫） | 28 题 `react/Example.tsx:93-98` | 改用守卫，或注明"选项来自自身常量，断言安全（28 题）" |
| 小问题 | `react/Example.tsx:12-13, 176, 433-435`；`vue/Example.vue:13-14, 124, 444-445` | "库自动 abort 在途请求"与 StrictMode 下"两条 queryFn + 一条被取消"的日志描述：源码支持（最后一个 observer 离开且 signal 被消费时 `retryer.cancel`），但前提是 queryFn 消费了 `signal`——官方默认"不取消"，注释未写这一前提；27 题 `:331` "把这一整套自动化了"同样缺此前提 | `query-core/build/modern/query.js:132-140` `removeObserver` → `#abortSignalConsumed` 才 `cancel({ revert: true })`；`:177` 读取 `context.signal` 时置位；tanstack query-cancellation 文档 "By default, queries that unmount or become unused before their promises are resolved are _not_ cancelled… if you consume the AbortSignal, the Promise will be cancelled" | 补一句"前提：queryFn 用了 `signal`；不用则不取消"；日志顺序结论需运行验证 |
| 小问题 | `vue/Example.vue:38` | 交叉引用"16 题的 cartStore 注释"指向了 React 侧文件的内容（Vue 侧 `cartStore.ts` 无此注释） | grep `16-global-state`：仅 `react/cartStore.ts:11`、两侧 `Example` 文件头 :14/:15 | 改为"16 题两侧文件头（服务端数据交给请求层）" |
| 小问题 | `react/Example.tsx:222`；`vue/Example.vue:171` | 只提 `@tanstack/react-query-devtools`，Vue 对应的 `@tanstack/vue-query-devtools` 未提；`useSuspenseQuery` 全文未提且未说明本题为何不用 | `react-query/build/modern/index.js:7,23` 导出 `useSuspenseQuery` / `queryOptions`；tanstack suspense 指南（`data` 保证有值，无 `enabled` / `placeholderData`） | 加"九、进阶：`useSuspenseQuery`（配合 Suspense / Error Boundary，data 非 undefined）；本题为讲清 isPending / isError 状态机刻意不用" |

- 已逐项核实、与源码一致（无需修改，供改写时引用）：`gcTime` 默认 5 分钟（`removable.js:17` `3e5`）；`staleTime` 默认 0（`query.js:107`）；`retry` 默认 3（`retryer.js:89` `isServer() ? 0 : 3`）；`refetchOnWindowFocus` 默认 true（`queryObserver.js:323-328` `value !== false`）；`invalidateQueries` 前缀匹配（`utils.js:21-25` `partialMatchKey`，`exact` 可关）；`onSuccess` 返回 Promise 会被 await、mutation 保持 pending（`mutation.js:107`）；请求失败后 `isInvalidated: true`（`query.js:319-321`，注释 `:229` 说法正确）；渲染期 `getOptimisticResult` → `build` → `add` 发 `'added'`（`useBaseQuery.js:28`、`queryObserver.js:77-78`、`queryCache.js:13-37`），故 `batchCalls` 的解释成立；`QueryClientProvider` 在 `useEffect` 里 `mount()` / `unmount()`，StrictMode 丢弃的 client 不会 mount（`QueryClientProvider.js`）；"No QueryClient set, use QueryClientProvider to set one" 错误文案属实；`queryPlugin.ts:21-22`（VueQueryPlugin.install 已 `client.mount()`、`app.onUnmount(cleanup → client.unmount())`、再手动 unmount 计数变负）与 `vueQueryPlugin.js` + `queryClient.js:42-43` `#mountCount--` 一致；vue-query 返回 `toRefs(readonly(state))`（`useBaseQuery.js` 末尾）、`queryKey` 类型 `MaybeRef<QueryKey>`（`queryClient-hf6i_vCa.d.ts:29`）、options 经 `cloneDeepUnref` + `watch(defaultedOptions, updater)` 响应（与 vue 侧 reactivity 文档一致）；模板里 `q.isPending` 是嵌套 Ref、`v-if` 恒真（vuejs.org reactivity-fundamentals：非顶层 ref 不解包）；"每次挂载新建 QueryClient"与 `src/bridge/VueMount.tsx:45-54`（`createPluginsRef.current?.()` 每次 effect 重新调用）及 `topicRegistry.ts:218-222` 一致；两侧共用 `@tanstack/query-core 5.102.8`（两包 package.json dependencies）。
- 结构建议：修改 —— 主体保留；补"两维度状态"、"v4 旧写法"、`useSuspenseQuery` 一节；修 uSES 订阅写法；修正 registry summary 措辞。
- 待核实：StrictMode 下日志"两条 queryFn + 一条被取消"的实际顺序（源码支持，需运行验证）。

---

### 3.31 各批次共同观察（子代理原话，供阶段 2 制定模板参考）

**批次 A**

1. 六题都没有任何成熟度标签、没有版本限定，也没有「旧写法对照」段：02 的 defaultProps/PropTypes/forwardRef、04 的事件委托 / 事件池、01 的 JSX transform 都只有「过时」二字而无「从哪个版本变化」，与 §5.A 要求不符。
2. 「没有一一对应关系」在 01 / 02 / 03 / 04 / 05 / 06 共出现 10 余处，其中三处实为「模板模式 vs render 函数」或「19.2 之前 vs 之后」的差异（01 的 JSX 存变量、02/05/06 的「一文件一组件」、05 的 v-show ↔ `<Activity>`），其余（函数式更新、useReducer、事件修饰符、自动透传）经核实确实无对应物，但都缺「为什么」的说明。
3. 需要纠正的技术结论只有三条且都可由源码直接证明：02「React 改 props 不警告」（dev 构建冻结 props）、03「空串会被渲染」（react-dom 跳过 `""`）、05「v-show 只能手动 display」（19.2 `<Activity>`）；本仓库 eslint 只手动开了 2 条 hooks 规则，未启用 `recommended` 预设，所以 03/06 里点名的反模式目前不会被 lint 抓到，是后续「生产注意」段可以利用的点。

**批次 B**

1. 成熟度标签全缺：五题没有任何【主流/较新/尝鲜/旧写法】标注；两处真正需要标签的内容——10 题的 `useEffectEvent`（【较新·19.2】）和 07/19 题提到的 Actions（【主流·19.0】）——前者被当作已内置随口介绍，后者全站零实现，是本批最大的结构缺口。
2. 「没有一一对应关系」在本批出现 27 处，其中 07（v-model ↔ value+onChange）、08（emit ↔ callback props）、09（computed ↔ useMemo / 直接算 ↔ 模板表达式）三题贴在的句子本身就在陈述对应关系，且核对 Vue 源码/文档后对应物确实存在，属机械残留需重写；10 题关于 StrictMode 的两处经核实成立，关于「过期闭包 Vue 压根没有」的几处则是过度绝对（解构后同样读旧值）。
3. 工具链联动风险：`eslint.config.js` 现只手动启用 rules-of-hooks / exhaustive-deps；按 §4 切到 eslint-plugin-react-hooks 7.1.1 官方 `recommended` 预设后，`set-state-in-effect`（error）会命中 10/11（以及 22/27 同款）「effect 顶部同步 setLoading」的请求惯用写法——需在阶段 1 前决定是改建模（forKeyword 派生）还是保留并解释，建议作为「需要用户决定的事项」列入总报告。

**批次 C**

1. **Vue 侧「自动化无边界」是本批最集中的错误类型**：13（模板 vs 渲染函数）、17（props 其实按引用比较；`v-memo` 存在）、12（「永远不会改了不更新」）、14（`onCleanup` 已覆盖卸载）——Vue 侧结论需要像 React 侧一样逐条对官方文档 / runtime 源码核实，尤其是「没有一一对应关系」这句在 17 题不成立。
2. **eslint-plugin-react-hooks 7 的 recommended 预设一旦启用（规格要求「官方推荐配置」），本批至少 12（`refs`：渲染期读 `ref.current`）与 14（`set-state-in-effect`：同步 `setLoading(true)`）会报错**；且 14 的两个 `.ts` Hook 文件目前完全不受 hooks 规则约束。建议阶段 1 先决定预设与文件匹配范围，再逐题改。
3. **「官方已把新写法设为默认 / 首选，课件仍停在 18 时代或一句带过」需要统一补成熟度定位**：`useSyncExternalStore`（14）、`use(Context)` 与 `ThemeProvider({ children })`（15）、v5 稳定 selector + `useShallow`（16）、React Compiler 1.0 与 `v-memo`（17）、`useTemplateRef` + ref 回调清理 / `useImperativeHandle`（12）。其中 15 题的 useMemo 演示结论在当前树里是错的（严重），是本批最该先改的一处。

**批次 E**

1. **成熟度分层与文件头全部缺席**：14 个文件 0 个【主流 / 较新 / 尝鲜 / 旧写法】标签、0 个 §9 字段。最需要分层的三处：React 17 批处理行为（24 题，应标【旧写法】）、`useEffectEvent`（26 题，应标【较新】并把 latest ref 补回主线）、React Compiler 对 23 题「子组件必重跑」/ 26 题 `useCallback` 的影响（【较新】）。
2. **官方 recommended 预设会让 23、24 题 lint 失败**（实测：23 `immutability` ×2 在刻意反例上，24 `set-state-in-effect` ×1 在探针上）——都是教学上必须保留的代码，阶段 1 切配置前要先给这三处加 `eslint-disable-next-line` + 注释说明「这正是编译器规则禁止的写法」；25、26 题干净。
3. **Vue 侧两个系统性措辞问题**：(a) 把原始值 `ref` 说成 Proxy（23 题 6 处；官方：ref 用 getter/setter，reactive 才用 Proxy）；(b) 「Vue 根本没有这个坑 / 没有这个坑要修」（23:183、24:375、26 Vue:78）与 Vue 官方 reactive() 解构限制、≤3.4 props 解构限制矛盾——而三题 Vue 文件里的「手动快照」对照按钮恰恰证明了坑存在，只是「谁替你拷了快照」不同。另有一处硬错误：24 题 `:367` 引用的 14 题 `increment()` Hook 不存在。

**批次 F**

1. 四题文件头均为"学习主题 / React 核心概念 / Vue 对应概念 / 最重要的区别"结构，缺 §9 的元信息（适用版本 / 最后核对 / 前置 / 成熟度）与"一、五、六、七、八、参考"，且全文没有任何【主流】【较新】【旧写法】标签——一致性缺口最大。
2. 跨题重复的错误结论："`<script setup>` 不能 export 类型"在 27（panelTypes.ts）、28（三处）、30（OrdersCountBadge.vue）共 5 处出现；已安装 @vue/compiler-sfc 3.5.42 只拒绝值导出，`export type` / `export interface` 编译通过（源码 + 实测）。
3. React Compiler lint 预设实测：27 题 3 处 `set-state-in-effect` error；28 / 29 / 30 的 .tsx 在同一组规则（含 refs / purity / immutability / set-state-in-render）下 0 问题。

<!-- BATCH-RESULTS-END -->

---

## 4. 主题调整建议

先说结论：**30 题全部保留，不合并、不重编号**；1 题重写（18），21 题修改，8 题保留小修；另建议新增 5 题（31–35）+ 2 题可选（36–37），其余 §8 缺口并入现有题或作为阶段 4 文档。

### 4.1 现有 30 题 → 规格 §8 主题地图的映射

| 规格 §8 组 | 组内知识点 | 现有题 | 覆盖情况 |
|---|---|---|---|
| 1 基础 | JSX 与渲染；组件、props 与 children 组合；state 与不可变更新；事件；条件渲染、列表与 key；受控与非受控表单 | 01、02、13、03、21、04、05、06、07 | 全部有题；07 缺与 React 19 表单 API 的衔接（→ 新题 31） |
| 2 Hooks | useState/useReducer；useEffect（含「你可能不需要 Effect」）；useRef（含 ref 作为 prop、ref 清理）；useContext 与性能边界；自定义 Hook；useId；useSyncExternalStore；useEffectEvent【较新】 | 03、29、10、12、15、14、26 | **缺 useId、useSyncExternalStore**（→ 07 / 14）；ref 回调清理与 `useImperativeHandle` 未讲（→ 12）；useEffectEvent 已作 26 题主线但缺【较新】标签 |
| 3 性能与记忆化 | memo/useMemo/useCallback；DevTools Profiler；列表虚拟化；代码分割 lazy；React Compiler【较新】 | 17、09 | **缺 Profiler、虚拟化、lazy、React Compiler**（Compiler → 17；lazy → 新题 32；Profiler / 虚拟化 → 17 注释级提及） |
| 4 并发与异步 UI | useTransition、useDeferredValue；Suspense 与 use()；Error Boundary；Activity【较新】；ViewTransition【尝鲜】 | 20 | **只有 Error Boundary 有题**（→ 新题 32） |
| 5 React 19 表单与 Actions | form action、useActionState、useFormStatus、useOptimistic | —（07、19 题注释提到名字） | **整组缺失**（→ 新题 31） |
| 6 数据获取 | useEffect 请求的问题 → TanStack Query；路由 loader；缓存与失效 | 11、27、30、22 | 路由 loader 缺失（→ 18 并排版本） |
| 7 路由 | 声明式与 Data 模式；参数与 URL 状态；嵌套；懒加载；错误处理；守卫（RequireAuth / loader / middleware【较新】） | 18 | 只有声明式 + RequireAuth；**缺 Data 模式、loader、middleware、懒加载、errorElement**（→ 18 重写，规格 §6） |
| 8 状态管理 | 状态放哪里；Context 边界；Zustand（对照 Pinia）；Redux Toolkit | 25、15、16 | **缺 Redux Toolkit**（→ 16 概念对照，不装依赖） |
| 9 表单工程化 | React Hook Form + Zod | — | **缺**（→ 可选新题 37，需新依赖） |
| 10 样式 | CSS Modules、Tailwind、CSS-in-JS | 01（只讲 class/style 写法） | **缺**（→ 可选新题 36，或并入 01） |
| 11 TypeScript | 组件、Hooks、泛型组件类型；React 19 类型变化 | 28 | 有；**缺「React 19 类型变化」一节**（→ 28） |
| 12 测试 | Vitest + Testing Library；Playwright 概念 | — | **缺**（→ 新题 34，依赖 §5.2） |
| 13 工程化 | Vite；ESLint 与 hooks 规则；StrictMode 行为 | —（10/23 题零散提到 StrictMode） | **缺独立讲解**（→ README + 10/23 题小节；不建议单独成题） |
| 14 服务端与框架 | CSR/SSR/SSG/RSC；Next.js App Router；Server Functions | — | **缺**（→ 新题 33，概念课） |
| 15 安全与可访问性 | XSS 与 dangerouslySetInnerHTML；开放重定向；令牌存储；前端权限边界；a11y | —（18 题注释提到开放重定向、按钮权限） | **缺**（→ 新题 35） |
| 16 心智模型总结 | 重新渲染 vs 细粒度响应式；JSX vs 模板；Hooks vs 组合式；编译器方向 | 23、24、26（各讲一角） | 缺总结（→ 阶段 4 文档） |
| 17 面试总索引 | 高频题清单 + 链接 + 成熟度 | README「面试高频问题」表 | 缺成熟度标签与链接（→ 阶段 4 生成） |

### 4.2 逐题处置建议（问题计数来自 §3；「结构建议」为审计子代理原话摘要）

| # | 标题 | 严重 | 概念 | 生产 | 小 | 结构建议（子代理原话摘要） |
|---|---|---|---|---|---|---|
| 01 | 组件与 JSX（没有模板 DSL，一切都是 JavaScript） | 0 | 1 | 0 | 2 | 保留 —— 内容基本准确；「数字自动补 px（React）/ 不补 px（Vue）」已按源码核实成立（`react-dom-client.development.js:2730-2735` 非 unitless 数字拼 `"px"`；`@vue/runtime-dom/dist/runtime-dom.cjs.js:534` 直接 `style[prefixed] = val`），只需补标签、版本限定与文件头 |
| 02 | Props（类型声明、默认值与单向数据流） | 0 | 4 | 1 | 1 | 修改 —— 主体讲解正确且面试价值高，但「React 不警告」与「SFC 一文件一组件」两条结论要纠正，UiButton 要按 React 19 的 ref-as-prop 重写类型 |
| 03 | State（useState 与不可变更新 —— React 与 Vue 最核心的思维差异） | 0 | 1 | 0 | 4 | 修改 —— 三个区块（购物车不可变更新 / 快照计数 / useReducer 入门）讲解准确且与 23 / 24 / 29 分工清楚，保留结构；只需纠正空串论断、修正两处引用、补惰性初始化与 lint 规则加分项 |
| 04 | 事件处理（onClick、事件对象、传参、冒泡与默认行为） | 0 | 2 | 0 | 2 | 修改 —— 演示本身（冒泡计数、stop/prevent、传参包箭头函数）准确好用；缺的是「合成事件到底是什么、17 起怎么变、passive 例外」这层面试必问内容 |
| 05 | 条件渲染（三元、&&、提前 return / switch、映射对象） | 0 | 1 | 0 | 2 | 修改 —— `0 &&` 陷阱、v-if 对照、映射表讲解均核实无误（Vue `v-if` 按真值判断、插值里 `0 &&` 会渲染 0 的补充也对）；只需补 `<Activity>`【较新】与 `return null` |
| 06 | 列表渲染与 key（.map() 对照 v-for，index 作 key 的坑） | 0 | 0 | 0 | 5 | 保留 —— 两个演示（index 作 key 错位、换 key 重置 state）设计好、结论与 react.dev「Preserving and Resetting State」一致，Vue 侧对照（就地更新策略、`:key` 重建实例、`ref` 初始值不跟 props 走）也核实无误；只需修正引用格式与指向 |
| 07 | 表单处理（受控组件 vs v-model） | 0 | 2 | 0 | 3 | 修改 + 拆出新题 —— 07 的受控/非受控主线本身是对的，但 §8-5 的 Actions 四件套是 19.0 起的【主流】且全站为空；建议新题「React 19 表单 Actions（`<form action>` / useActionState / useFormStatus / useOptimistic）」放在 19 题之后（19 题手写 `submitting` + try/finally 正是它们替代的对象，可作【旧写法】对照），07 只保留指针。若不愿加题，则并入 19 作主线、19 现有手写版降为对照。 |
| 08 | 父子组件通信（callback props vs emit） | 0 | 2 | 0 | 2 | 保留 —— 代码与命名约定讲得准（`on*`/`handle*` 只是约定、props 只读、单向数据流），只需重写「emit 无对应物」这条结论并补 `defineModel` 指针。 |
| 09 | 派生状态（computed vs 渲染时直接算） | 0 | 2 | 0 | 1 | 修改 —— React 侧论点正确，Vue 对照段（computed 唯一/必须）需按官方「computed vs methods」重写，并补 Compiler 一段。 |
| 10 | useEffect 与生命周期 —— 副作用、依赖数组、cleanup 与请求竞态 | 0 | 3 | 1 | 3 | 修改 —— 代码四种计数器与竞态取消都经得起推敲（`e.currentTarget` 置空、async effect 禁止、React 18 去掉已卸载 setState 警告等均已按 react-dom 源码与官方升级指南核实无误），需要动的是标签、Vue 侧三处绝对化，以及 lint 预设切换后的 setState-in-effect 决策；与 27 题分工清楚（本题只展示 cleanup-abort，27 做三面板对照），保持。 |
| 11 | API 请求状态建模 —— loading / success / error / empty 与重试 | 0 | 2 | 1 | 2 | 修改 —— 判别联合 + 竞态取消 + 空态/错误分开的主体保留；补官方「不要在 effect 里直接请求」的论据与替代方案清单，纠正「声明式 vs 命令式」的框架差异表述，并与 10 题一起决定 set-state-in-effect 的处理。与 30 题分工成立（30 明确回指本题为「手写状态机」对照）。 |
| 12 | DOM ref 与跨渲染可变值 —— useRef 的两种用途 | 0 | 3 | 0 | 1 | 修改 —— 两种用途主线保留，补 ref 作为 prop / ref 回调清理 / `useImperativeHandle` 三个 19.0【主流】知识点与【旧写法】forwardRef 对照；Vue 侧主线切到 `useTemplateRef` |
| 13 | 插槽与 children —— React 用「值」组合 UI | 0 | 1 | 0 | 0 | 保留 —— 代码与主线对照准确，只需修正上述注释并补 ReactElement / 组合进阶 |
| 14 | 自定义 Hook 与 Composable —— 逻辑复用 | 0 | 2 | 1 | 3 | 修改 —— 并排 `useSyncExternalStore` 版 `useWindowWidth`，Vue 侧删冗余 controller，清理重复句；防抖主线保留 |
| 15 | Context 跨层传值（主题切换） | 1 | 3 | 0 | 0 | 修改 —— 重构为 `ThemeProvider({ children })` 并加可验证的渲染计数演示；补 `use(Context)`、children 模式与旧写法对照；Vue 侧 provide/readonly 描述与官方一致，可保留 |
| 16 | 全局状态管理（Zustand vs Pinia） | 0 | 2 | 0 | 3 | 修改 —— 主线代码可保留；补 v5 易错点 / `useShallow`、RTK 三方对照、pinia 4【较新】说明与成熟度标签 |
| 17 | useMemo 与 useCallback（配合 React.memo 的性能优化） | 0 | 3 | 0 | 3 | 修改 —— 主线手写记忆化保留（方案 A），增 Compiler【较新】小节与 Vue `v-memo` 对照，修正 Vue「不比引用」的描述 |
| 18 | 路由 —— React Router 的参数、query、嵌套路由、导航与登录态守卫 | 3 | 10 | 4 | 5 | 重写 —— 按 §6 目标结构：主线声明式 + 三态 RequireAuth【主流】，并排 Data 模式 `createMemoryRouter` + loader【主流】+ middleware【较新】；Vue 侧守卫改返回值写法、`next()` 入【旧写法】。 |
| 19 | 异步提交与防重复 —— submitting 状态的工业界标准写法 | 0 | 2 | 0 | 3 | 保留（基线）+ 拆出新题 —— 手写 `submitting` 保留为框架无关基线【主流】；同意批次 B 在 19 题之后拆出「React 19 表单 Actions」，本题只留 3～5 行对照与指向；`vue/Example.vue:35-36`（`type="number"` 自动应用 `.number`）已核实正确（vuejs.org/guide/essentials/forms#number）。 |
| 20 | 错误边界 —— Error Boundary vs onErrorCaptured | 0 | 2 | 1 | 2 | 修改 —— 保留手写 class 边界主线与 Vue `onErrorCaptured` 对照（`vue/Example.vue:43-45` 关于「返回 false 后不再打印」与 `nm:@vue/runtime-core/dist/runtime-core.cjs.js:238-239` 一致；`vue/Example.vue:16-17` 捕获范围与 vuejs.org 列表一致）；补 React 19 异步例外、`createRoot` 选项、`key`/`resetKeys`、`react-error-boundary`、RR `errorElement` 指向 18 题。 |
| 21 | 不可变数据更新 —— 两框架状态模型的核心差异 | 1 | 1 | 0 | 2 | 修改 —— 保留五种模式与「反例」演示；补 Immer 示例【主流】、Compiler/`immutability` lint【较新】、Vue `shallowRef`/props 只读对照；`:63-65` `structuredClone` 与 `:99-100` StrictMode 双调更新函数的说明已核实正确（react.dev/reference/react/useState）。 |
| 22 | 综合实战 —— 订单管理页（搜索 / 筛选 / 分页 / 行内编辑 / 二次确认删除） | 0 | 0 | 3 | 4 | 修改 —— 保留综合演示与 Vue 命令式对照（`vue/OrderRow.vue:21-22` `.number` 自动应用已核实：vuejs.org/guide/essentials/forms#number）；补生产标注、URL 状态、权限表述；竞态/取消处理与 27 题一致（27 题 `:11-16` 同为 cleanup abort + `isAbortError` 忽略）。 |
| 23 | 渲染模型与 state 快照 ——「一次渲染 = 一次函数执行」与 UI = f(props, state) | 1 | 1 | 0 | 4 | 保留（小幅修改）—— 四条机制与官方 State as a Snapshot / useState 文档逐句一致（`:222-224` 的 Object.is 表述与官方原文吻合），只需补标签、修 Proxy 措辞、给反例加 lint 说明 |
| 24 | State batching 与函数式更新 —— 更新队列、自动批处理、flushSync 与「什么时候必须函数式更新」 | 1 | 2 | 0 | 3 | 修改 —— 更新队列模拟器与官方 "Queueing a series of state updates" 的 replace / updater 规则逐条一致，区块设计好；需补 flushSync caveat、加标签、修 14 题引用、给探针加 lint 说明 |
| 25 | 状态提升与 state 归属 —— state 该放在哪个组件？兄弟组件怎么共享？什么该留在子组件、什么不该进全局 store | 0 | 2 | 1 | 3 | 保留（小幅修改）—— 归属表 + 反面教材 + Vue 六文件对照设计扎实，`useEffect` 只作反例且与 "You Might Not Need an Effect" 一致；需软化「完全一致」、补 Vue 模块级 store 对照、补 store 边界与 URL 状态说明 |
| 26 | 过期闭包（stale closure）—— 延迟回调、手动事件监听、轮询读到旧 state 的现场、观察与修法 | 0 | 5 | 0 | 3 | 修改 —— 三个区块（无 effect 的延迟回调 / 手动监听 / 轮询）的分工好、cleanup 纪律到位、alive 标志设计正确；只需调整成熟度分层：latest ref 进区块三作【主流】，useEffectEvent 标【较新】并排，补第 3 条 caveat，修四处绝对化 |
| 27 | 异步竞态、取消与过期响应 | 1 | 4 | 0 | 3 | 修改 —— 复现设计与三面板对比很好，保留；主要修 recommended 预设下的 lint 风险、三处"框架差异"措辞，并补文件头模板。 |
| 28 | React + TypeScript 基础 | 1 | 3 | 0 | 4 | 修改 —— 三个区块与速查表保留；新增"React 19 类型变化 + 泛型组件 + ReactNode/ReactElement"一节；修正 `<script setup>` 导出结论；Vue 宏补版本标签。 |
| 29 | useReducer 与判别联合 Action | 0 | 2 | 0 | 5 | 保留（小修）—— 讲解与演示（日志 / 撤销 / 重放 / 反面按钮）扎实；补 React 19 推断改进、RTK 对照与文件头模板即可。 |
| 30 | TanStack Query 与服务端状态 | 0 | 3 | 1 | 4 | 修改 —— 主体保留；补"两维度状态"、"v4 旧写法"、`useSuspenseQuery` 一节；修 uSES 订阅写法；修正 registry summary 措辞。 |
| **合计** | | **9** | **71** | **14** | **82** | |

计数说明：9 条「严重」里 5 条是技术结论与源码 / 官方文档相反（15、18×3、28），另 4 条（21、23、24、27）是「切换到 eslint-plugin-react-hooks 7 官方 `recommended` 预设后该文件 lint 失败」，是否成立取决于 §5.5 的决定。

### 4.3 新增题与并入建议（编号从 31 起，01–30 不动）

| 建议 | 编号 | 主题 | 成熟度 | 内容要点 | 新依赖 | 依据 |
|---|---|---|---|---|---|---|
| 新增 | 31 | React 19 表单与 Actions | 【主流】 | `<form action>`、`useActionState`、`useFormStatus`、`useOptimistic`；错误处理两条路径（返回 state / 抛给 Error Boundary，联动 20）；`isPending` 与防重复（Actions 排队语义）；Vue 侧手写 + 说明无内置对应物；19 题手写 `submitting` 作为对照基线 | 无 | §8-5 整组缺失；07/19 题只提名字（批次 B、D 一致建议） |
| 新增 | 32 | 并发与异步 UI | 【主流】+【较新】+【尝鲜】 | `useTransition` / `useDeferredValue`【主流】；`Suspense` + `use(promise)` + `lazy` 代码分割【主流】；与 Error Boundary 联动（20）；`<Activity>`【较新·19.2】对照 KeepAlive / v-show；`<ViewTransition>`【尝鲜·19.3】只作介绍；Vue 对照 `defineAsyncComponent`、`<Suspense>`（实验）、`<Transition>` | 无（示例内自带 Suspense / 边界，避免壳应用接管） | §8-4 只有 Error Boundary 有题；README 自述缺 Suspense/use() |
| 新增 | 33 | 服务端渲染与 Server Components（概念课） | 【主流】 | CSR / SSR / SSG / RSC 的区别；代码在哪里运行；`'use client'` / `'use server'` 边界；Next.js 16 App Router 概览；Server Functions；Vue 对照 Nuxt | 无（不可运行，以讲解组件 + 注释为主，明确标「概念课」） | §8-14 缺失；面试常问 |
| 新增 | 34 | 测试 | 【主流】 | Vitest + Testing Library：为 18 题「参数变化时 state 保留」、24 题批处理、26 题过期闭包等关键结论写测试；Vue 侧 @testing-library/vue 对照；Playwright 只讲概念 | §5.2 的测试依赖 | §8-12 缺失；§2-9「可验证」要求 |
| 新增 | 35 | 安全与可访问性 | 【主流】 | XSS 与 `dangerouslySetInnerHTML` ↔ `v-html`；开放重定向（复用 18 题 `safeRedirect`）；令牌存储（httpOnly cookie vs localStorage）；前端权限只是体验层；a11y 基础（语义标签、label、`aria-current`、焦点管理） | 无 | §8-15 缺失；§2-7 要求 |
| 可选新增 | 36 | 样式方案 | 【主流】 | CSS Modules / Tailwind / CSS-in-JS 现状与取舍 ↔ SFC scoped CSS / CSS Modules；不引入 Tailwind 依赖，只讲写法 | 无 | §8-10；优先级低，也可并入 01 |
| 可选新增 | 37 | 表单工程化 | 【主流】 | react-hook-form + zod ↔ Vue 常见方案（VeeValidate / 手写 + zod） | `react-hook-form` ^7.88、`zod` ^4 | §8-9；需新依赖，建议放最后 |
| 并入 18 | — | Data 模式路由与守卫 | 【主流】/【较新】 | `createMemoryRouter` + `RouterProvider` + loader（`throw redirect`）+ `errorElement` + `lazy` 路由 + middleware【较新】+ `useBlocker`；按规格 §6 做「并排版本」，拆成 18 目录下的辅助文件（需 §5.10 扩展源码查看） | 无 | 规格 §6 已定 |
| 并入 16 | — | Redux Toolkit 对照 | 【主流·存量】 | `configureStore` / `createSlice`（内置 Immer）/ `useSelector` / `useDispatch` 与 Zustand、Pinia 三方对照；只讲概念，不装依赖 | 无 | §8-8 |
| 并入 README + 10 / 23 | — | 工程化与 StrictMode | 【主流】 | Vite；ESLint hooks 规则（含编译器规则）；StrictMode 双调用行为 | 无 | §8-13 |
| 阶段 4 文档 | — | 心智模型总结 + 面试总索引 | — | `docs/` 下两份文档 + README 章节；每题链接 + 成熟度标签 | 无 | §8-16 / 17；规格阶段 4 交付 |

散点知识点并入现有题（阶段 2 逐题处理时一并做）：

| 知识点 | 并入 | 标签 |
|---|---|---|
| 合成事件 React 17 起的变化（root 委托、无事件池、onScroll 不冒泡）、passive 事件与 `preventDefault` | 04 | 【主流】+【旧写法】 |
| `<Activity>` 对照 `v-show`（一句）；`return null` | 05 | 【较新】 |
| `useState(() => …)` 惰性初始化；`immutability` / `set-state-in-render` lint 规则 | 03 | 【主流】/【较新】 |
| `useId`（表单 label / id） | 07 | 【主流】 |
| `defineModel`（3.4+）指针；`defineEmits` 具名元组 3.3+ 标注 | 08 | 【主流】 |
| React Compiler 对手写 `useMemo` 的影响 | 09、17 | 【较新】 |
| 「你可能不需要 Effect」完整清单；`onWatcherCleanup`（Vue 3.5） | 10 | 【主流】 |
| effect 直接请求的四条缺陷与替代方案；`use(promise)` 指针 | 11 | 【主流】 |
| ref 回调清理函数、`useImperativeHandle`、`forwardRef` 旧写法对照、`useTemplateRef`（Vue 3.5） | 12 | 【主流】/【旧写法】 |
| `ReactNode` vs `ReactElement`；slot 函数惰性调用的真正区别 | 13 | 【主流】 |
| `useSyncExternalStore` 版 `useWindowWidth` 并排 | 14 | 【主流】 |
| `use(Context)`；`ThemeProvider({ children })` 模式；`.Provider` / `.Consumer` 旧写法 | 15 | 【主流】/【旧写法】 |
| zustand v5 稳定 selector 规则 + `useShallow`；pinia 4 说明 | 16 | 【主流】/【较新】 |
| `v-memo` / `v-once` 对照；Compiler 小节；Profiler / 虚拟化提一句 | 17 | 【主流】/【较新】 |
| Actions 排队语义与 `isPending` | 19 | 【主流】 |
| Actions / `use(promise)` 的错误进边界；`createRoot` 错误回调；`react-error-boundary`；路由级 `errorElement` | 20 | 【主流】 |
| Immer 示例；`shallowRef` 对照 | 21 | 【主流】 |
| 演示简化标注；URL 状态（引用 18）；权限表述 | 22 | 【主流】 |
| `flushSync` 四条官方 caveat；React 17 批处理【旧写法】 | 24 | 【主流】/【旧写法】 |
| Vue 模块级 `reactive()` 小 store 这一档；store 边界 | 25 | 【主流】 |
| latest ref 回到主线；`useEffectEvent` 标【较新】+ 三条 caveat | 26 | 【主流】/【较新】 |
| 「React 19 类型变化」一节；`<script setup>` 可 `export type` 的修正 | 28 | 【主流】 |
| React 19 `useReducer` 类型推断改进；RTK 对照指针 | 29 | 【主流】 |
| TanStack v5 `status × fetchStatus` 两维度；v4 术语【旧写法】；`useSuspenseQuery` 一节 | 30 | 【主流】/【旧写法】 |

### 4.4 注册表与学习顺序（阶段 3 / 4 执行）

- `src/shell/topicRegistry.ts` 新增「第六阶段：React 19 与生态进阶」放 31–35（及可选 36–37）；`RECOMMENDED_ORDER` 建议插入位置：31 紧跟 19、32 紧跟 20、35 紧跟 18、34 紧跟 22、33 放最后（概念课）。具体顺序阶段 4 再定。
- README 的「知识点目录 / 学习重点 / 面试问题」三张表同步加行；「当前完成状态」「验证命令」两节按最终状态重写（见 §3.0）。

---

## 5. 需要你决定的事项

### 5.0 决定记录（2026-09-16，用户答复「全部按建议来」）

| 项 | 决定 |
|---|---|
| 5.1 | **A：不启用 React Compiler**；手写记忆化为主线，编译器原理、影响与 lint 规则作【较新】小节 |
| 5.2 | **全部安装**：vitest ^4.1、@testing-library/react ^16.3 + dom ^10、@testing-library/vue ^8.1、user-event ^14.6、jest-dom ^6.10、**jsdom** ^30；测试文件与示例同目录（`react/Example.test.tsx`、`vue/Example.test.ts`）；`test` = `vitest run`，`check` = lint + typecheck + test + build |
| 5.3 | **同意**：依赖与 4 处导入改为 `react-router`（含站点壳），版本保持 7.18.3 |
| 5.4 | **同意**：vue-router 升 5.3.1，pinia 保持 3.0.4 |
| 5.5 | **同意，分两步**：阶段 1 切 `recommended` 预设 + 扩大 files 范围并记录报错题；阶段 2 逐题处理 |
| 5.6 | **同意**：新增 31–35；36、37 可选（放最后再定）；Data 模式并入 18、RTK 并入 16、工程化并入 README + 10/23、总结与面试索引作阶段 4 文档；01–30 不重编号 |
| 5.7 | **同意**：26 题保留 useEffectEvent 主线，标【较新·19.2】+ 三条 caveat，latest ref 并排 |
| 5.8 | **已执行**：`git checkout` 还原 13 题标点 |
| 5.9 | 保持 Vite 7.3.6 |
| 5.10 | **同意**：阶段 2 改 18 题时把源码查看扩展到题目录下全部文件 |
| 5.11 | **同意**：阶段 0 文档单独提交 |
| **5.12（新增）** | **18 题主线改为 Data 模式**（`createBrowserRouter` / 演示用 `createMemoryRouter` + `RouterProvider` + loader + `errorElement` + `lazy` + middleware 守卫【较新】），声明式 + `RequireAuth` 作并排版本并标「存量项目与面试最常见」。**规格 §6 的第 1 条「主线」相应调整，其余 12 条修改点不变。** |
| **5.13（第二轮，2026-09-17）** | 用户答复「全部按建议执行」：AUDIT-ROUND2.md §6 的 D2-1～D2-8 全部按建议执行（严重级保留外延解读；22 题保留 effect 手写 + 三种生产改写；阶段 1 安装 `react-error-boundary`；切 `recommended` 只记录、阶段 2 处理；规格 §6 路由样板 5 条随 Data 主线调整）。两轮合并说明见附录 C |
| **5.14（阶段 1 复核，2026-09-17）** | 用户四项均按建议：① 新装 / 升级的包按 §3.3 取「满 30 天的最新补丁」，已装在用的不降级 → vue-router **5.2.0**（不是 5.3.1）、@testing-library/react 16.3.2、@testing-library/dom 10.4.1、user-event 14.6.5、react-error-boundary 6.1.3、vitest 4.1.11；② jsdom 30.x 要求 Node ^22.22.2，本机 22.22.1 → 改装 **jsdom 29.1.1**；③ 新增 **@vue/test-utils 2.4.11** 为直接 devDependency；④ 切 `recommended` 后站点壳的 3 条命中先记录，阶段 2 开头单独 commit 修。执行中另发现：@testing-library/jest-dom 6.10.0 已被维护者 deprecated → 按其说明改装 **6.9.1**；**ESLint 9 已于 2026-08-06 EOL**（新待决 D1-1，未擅自升级）；vue-router 5.2.0 对 `next()` 发 R0025 弃用警告。全部记录见 PROGRESS.md「阶段 1 记录」 |

**追加约束（用户 2026-09-16）**：第一轮审计偏重「查错」，对「缺什么」只做了一行覆盖检查，没有给缺失项定级、也没有质疑规格里的主线选择。阶段 1 之前先由另一个会话做第二轮「学习完整性」审计（prompt 见 `docs/upgrade/REAUDIT-PROMPT.md`），合并后再开工。

每项都给了「建议」，你只需回复编号 + 同意/改为什么。

### 5.1 React Compiler：方案 A（不启用）还是 B（启用）？——建议 A

| 维度 | A：不启用（建议） | B：启用 |
|---|---|---|
| 成熟度依据（§2） | `babel-plugin-react-compiler` 1.0.0 发布 11 个月、周下载约为 react 的 9%；React 官方文档已把它列为稳定，但 State of React 类调查数据本次未抓取 | 同左；官方 Vite 集成方式在 `@vitejs/plugin-react` 5.x 与 6.x 之间不同（5.x 用 `babel.plugins`，6.x 改 `reactCompilerPreset` + `@rolldown/plugin-babel`），升级 Vite 8 时要跟着改 |
| 课件主线 | 手写 `memo / useMemo / useCallback`【主流】为主线（17、09、15 题）；另加「九、新动向【较新】」讲编译器原理、对手写记忆化的影响、`preserve-manual-memoization` 等 lint 规则 | 主线改为「依赖编译器 + 必要时手写」；手写记忆化降为「面试必答 + 存量项目」内容 |
| 演示可信度 | 17 题「不加 useCallback 子组件就重渲染」的演示保持可观察 | 启用后 17 / 15 / 23 题的重渲染计数演示会被编译器改变（自动记忆化），需要逐题用 `"use no memo"` 退出或重写演示 |
| 面试 | 面试仍以手写链路为主，A 直接对齐 | 需额外解释「为什么演示里看不到重渲染」 |
| lint | 不需要装编译器也能用 eslint-plugin-react-hooks 7.1.1 `recommended` 预设里的全部编译器规则（附录 A-F 已核实），课件可以「讲规则不开编译器」 | 同左 |
| 新增依赖 | 无 | `babel-plugin-react-compiler`（+ Vite 8 时 `@rolldown/plugin-babel`） |

### 5.2 新增测试依赖（阶段 1 安装，规格规则 7 要求先确认）——建议全部同意

| 包 | 版本 | 用途 | peer 兼容（§2） |
|---|---|---|---|
| `vitest` | ^4.1.11 | 测试运行器（vite 7 复用同一配置） | vite ^6‖^7‖^8 ✓ |
| `@testing-library/react` + `@testing-library/dom` | ^16.3.3 + ^10 | React 组件测试（18 题「参数变化时 state 保留」、24 题批处理等） | react ^18‖^19 ✓ |
| `@testing-library/vue` | ^8.1.0 | Vue 对照测试（可选：只给关键结论写） | vue >=3 ✓；两年无发版，若阶段 1 实测有问题改用 `@vue/test-utils` |
| `@testing-library/user-event` | ^14.6.7 | 用户交互 | ✓ |
| `@testing-library/jest-dom` | ^6.10.0（**阶段 1 更正：6.10.0 已被维护者 deprecated，实装 6.9.1**，见 §5.0 的 5.14） | DOM 断言（`toBeInTheDocument`） | dom >=10 <11 ✓；v7 不满 6 个月 |
| DOM 环境：`jsdom` ^30 **或** `happy-dom` ^20 | 二选一 | 测试 DOM | 都是 vitest peer `*`。建议 **jsdom**（Testing Library / TanStack / React Router 官方测试都用它，兼容性最稳）；happy-dom 更快、份额 88% 集中在 v20，也可 |

测试文件位置（需你定）：建议 **与示例同目录**：`src/topics/<NN>/react/Example.test.tsx`、`src/topics/<NN>/vue/Example.test.ts`（注册表的 `import.meta.glob` 只匹配 `Example.tsx` / `Example.vue`，不会误加载测试；`tsconfig.include` 已含 `src`）。备选：`src/topics/<NN>/__tests__/`。`test` 脚本：`vitest run`；`check` 脚本改为 lint + typecheck + test + build。

其它候选依赖（只在对应新题获批时才装）：`react-hook-form` ^7.88 + `zod` ^4（表单工程化题）；`@reduxjs/toolkit` ^2 + `react-redux` ^9（仅当要可运行的 RTK 对照；建议 16 题只讲概念，不装）；`react-error-boundary`（20 题建议只讲用法不装）。

### 5.3 `react-router-dom` → `react-router`（含站点壳）——建议同意

阶段 1 改 4 处导入 + `package.json` 依赖换名（`react-router-dom` 删除，`react-router` 升为直接依赖，版本保持 7.18.3）。站点壳 `src/main.tsx`、`src/shell/App.tsx`、`src/shell/TopicPage.tsx` 各改一行 import，属规格规则 10 允许的「依赖调整必须修改」，报告已说明。不升 v8。

### 5.4 `vue-router` 升 5.3.1、`pinia` 保持 3.0.4——建议同意

依据 §2.2：v5 满足全部三个阈值且官方声明无破坏性变更；18 题 Vue 侧代码不用改（`createRouter` / `createMemoryHistory` / `beforeEach` 不变）。**阶段 1 更正（2026-09-17）**：实装 5.2.0（30 天规则，见 §5.0 的 5.14）；代码确实能照常运行，但 `beforeEach` 里的 `next()` 写法会触发 dev 弃用警告 R0025，阶段 2 改 18 题时换成返回值写法。安装时若 npm 报 vue-router 5 的可选 peer（vite / pinia / @pinia/colada），以实际 `npm install` 输出为准，不额外装 `@pinia/colada`。pinia 4 等满 6 个月再评估。

### 5.5 ESLint：切换到 eslint-plugin-react-hooks 7 官方 `recommended` 预设，并把 react 目录下的 `.ts` 纳入 hooks 规则——建议同意，但分两步

- 后果（已实测 / 预判）：切换后 12 题（`refs`：渲染期读 `ref.current`）、14 题（`set-state-in-effect`：effect 顶部同步 `setLoading(true)`）、21 题（`immutability`：反例 `first.quantity++`）会直接报 error；10 / 11 / 26 / 27 题同款「effect 体同步 setState」写法需阶段 1 实测。
- 建议：阶段 1 先切预设并把 `files` 扩到 `src/**/react/**/*.{ts,tsx}` + `src/shell` + `src/bridge`，把报错的题记入 PROGRESS.md 的遗留列表，**不在阶段 1 改课件**；阶段 2 逐题处理：有教学价值的反例保留并加 `eslint-disable-next-line` + 一句「这就是 React Compiler 时代 lint 会拦下的写法」；请求类写法改为「loading 由 render 派生」（27 题 `forKeyword` 做法）或在 effect 内异步设置。
- 备选：只保留现有 2 条规则（不推荐：规格 §4 要求「使用官方推荐配置」，且 §7 要求讲 React Compiler 的 lint 规则）。

### 5.6 主题结构调整（见 §4.3）——需要你逐条确认

- 新增题：31 React 19 表单与 Actions、32 并发与异步 UI（Suspense / use() / transitions / lazy / Activity / ViewTransition）、33 服务端渲染与 Server Components（概念课）、34 测试、35 安全与可访问性。
- 可选新增：36 样式方案、37 表单工程化（RHF + Zod，需装依赖）。
- 建议并入现有题而不新增：Data 模式路由 + loader + middleware（并入 18，按规格 §6 做「并排版本」，拆成 18 目录下的辅助文件）、Redux Toolkit 对照（并入 16，只讲概念）、工程化与 StrictMode（并入 README + 10/23 题小节）、心智模型总结与面试总索引（阶段 4 作为 `docs/` 文档 + README 章节，不做成题）。
- 不重编号：01–30 保持不变；新题从 31 起，注册表加「第六阶段」；推荐学习顺序在阶段 4 重排。

### 5.7 26 题把 `useEffectEvent`【较新】作为主线修法——建议保留，只补标签与限制

规格 §3.1 允许【较新】进入主线（注明起始版本）。建议：主线保留 `useEffectEvent`（React 19.2 起，官方推荐做法），标【较新·19.2】并补三条官方限制（只能在 Effect 内调用、不能传给其他组件 / Hook、返回函数没有稳定身份）；「latest ref」写法保留为【主流·18 及以前的通用解法】并排；30 秒速答两种都提。备选：主线换成 latest ref，`useEffectEvent` 降为加分点。

### 5.8 13 题工作区那处未提交的标点改动——建议还原

`git checkout -- src/topics/13-slots-and-children/react/Example.tsx`（把 `精简版(只要名字 …) :` 还原为全角 `精简版（只要名字 ……）：`）。若那是你有意改的，告诉我，我在阶段 2 顺手统一。

### 5.9 Vite 保持 7.3.6——建议不升级（无需回复，除非你想升）

### 5.10 站点壳：是否把「源码查看」扩展到每题目录下的全部文件——可选

18 题重写后会有多个辅助文件（Data 模式路由、safeRedirect、middleware），现有页面只展示 `Example.tsx` / `Example.vue`。建议阶段 2 改 18 题时一并把 `topicRegistry.ts` 的 glob 扩到 `../topics/*/react/**/*.{ts,tsx}`（属站点壳改动，需你同意）。

### 5.11 阶段 0 的两个文档是否现在提交——需要你回复

`docs/upgrade/AUDIT.md` 与 `docs/upgrade/PROGRESS.md` 目前未提交（`src/` 无任何改动）。建议单独一个 commit「阶段 0：审计报告」，收到「继续」后再开始阶段 1。

---

## 附录 A · 已核实的 API 事实卡

> 由子代理在 2026-09-16 核实；node_modules 路径相对 `D:codeAIlearning
eact
ode_modules`；状态「核实」= 有一手证据，「待核实」= 未能证实、禁止当事实引用。

### A. React 19.2.8 / @types/react 19.2.18（已安装）

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| `useEffectEvent` | 19.2.8 **稳定导出**，无 `experimental_` 前缀；类型标注 `@version 19.2.0` | `react/cjs/react.development.js:1227` `exports.useEffectEvent = function (callback)`；`@types/react/index.d.ts:1791` `export function useEffectEvent<T extends Function>(callback: T): T;` | 核实 |
| `Activity` | 19.2.8 **稳定导出为 `Activity`**（不是 `unstable_Activity`）；props：`mode?: "hidden" \| "visible"`（默认 `"visible"`）、`name?`、`children` | `react.development.js:795` `exports.Activity = REACT_ACTIVITY_TYPE;`；`index.d.ts:1995-2015` `export const Activity: ExoticComponent<ActivityProps>;` `@version 19.2.0`；runtime 导出清单中无 `unstable_Activity` | 核实 |
| `use` | 稳定 | `index.d.ts:1973` `export function use<T>(usable: Usable<T>): T;`；runtime `:1193` | 核实 |
| `useActionState` | 稳定，两个重载 | `index.d.ts:1975,1980`；runtime `:1196` `exports.useActionState = function (action, initialState, permalink)` | 核实 |
| `useOptimistic` | 稳定，两个重载 | `index.d.ts:1930,1933`；runtime `:1253` | 核实 |
| `useTransition` | `(): [boolean, TransitionStartFunction]` | `index.d.ts:1878`；runtime `:1276` | 核实 |
| `useDeferredValue` | `(value: T, initialValue?: T): T`（19 起支持 initialValue） | `index.d.ts:1861`；runtime `:1217` | 核实 |
| `useSyncExternalStore` | 稳定 | `index.d.ts:1924`；runtime `:1265` | 核实 |
| `useId` | `(): string` | `index.d.ts:1907`；runtime `:1230` | 核实 |
| `cache` | 稳定导出 | `index.d.ts:1987` `export function cache<CachedFunction extends Function>(fn): CachedFunction;`；runtime `:917` | 核实 |
| `cacheSignal` | 19.2 新增，稳定导出 | `index.d.ts:1993` `export function cacheSignal(): null \| CacheSignal;` `@version 19.2.0`；runtime `:922` | 核实 |
| `ViewTransition` | **19.2.8 不导出**；仅在 `@types/react/canary.d.ts` 中有类型 | runtime `exports.*` 全清单无 `ViewTransition`/`unstable_ViewTransition`；`index.d.ts` 无匹配；`canary.d.ts:109` `export const ViewTransition: ExoticComponent<ViewTransitionProps>;` | 核实 |
| `addTransitionType` | **19.2.8 不导出**；仅 canary 类型 | runtime 无匹配；`canary.d.ts:114` `export function addTransitionType(type: string): void;` | 核实 |
| react 19.2.8 runtime 完整导出 | `Activity Children Component Fragment Profiler PureComponent StrictMode Suspense act cache cacheSignal captureOwnerStack cloneElement createContext createElement createRef forwardRef isValidElement lazy memo startTransition unstable_useCacheRefresh use useActionState useCallback useContext useDebugValue useDeferredValue useEffect useEffectEvent useId useImperativeHandle useInsertionEffect useLayoutEffect useMemo useOptimistic useReducer useRef useState useSyncExternalStore useTransition version` | `grep -o "exports\.[A-Za-z_]* =" react/cjs/react.development.js` | 核实 |
| react-dom `useFormStatus` | 导出 | `@types/react-dom/index.d.ts:43` `export function useFormStatus(): FormStatus;`；`react-dom/cjs/react-dom.development.js:416` | 核实 |
| react-dom `useFormState` | 19.2.8 **仍导出**（runtime 仅转发到 dispatcher，导出层无弃用告警） | `react-dom.development.js:413-415`；`@types/react-dom/index.d.ts:45,50` | 核实 |
| react-dom `flushSync` / `createPortal` | 导出 | `@types/react-dom/index.d.ts:22` `export function flushSync<R>(fn: () => R): R;`；`:14` `createPortal(`；runtime 导出清单含两者 | 核实 |
| react-dom `preload` / `preinit` 等 | `prefetchDNS`(:56) `preconnect`(:66) `preload`(:94) `preloadModule`(:107) `preinit`(:118) `preinitModule`(:131) 均导出 | `@types/react-dom/index.d.ts`；runtime 导出清单 | 核实 |
| react-dom/client | 仅 `createRoot`、`hydrateRoot`、`version` | `react-dom/cjs/react-dom-client.development.js` 导出清单 | 核实 |
| `useRef()` 无参调用 | **不能通过类型检查**：三个重载均要求 `initialValue` 参数，无零参重载 | `index.d.ts:1737` `function useRef<T>(initialValue: T): RefObject<T>;`<br>`:1749` `function useRef<T>(initialValue: T \| null): RefObject<T \| null>;`<br>`:1761` `function useRef<T>(initialValue: T \| undefined): RefObject<T \| undefined>;` | 核实 |
| `forwardRef` 是否 `@deprecated` | @types/react 19.2.18 **未标 `@deprecated`**（JSDoc 1377-1402 无该标签）；React 19 博客称 "ref as a prop … deprecates forwardRef"（语义弃用，类型未标） | `index.d.ts:1403` `function forwardRef<T, P = {}>(render: ForwardRefRenderFunction<T, PropsWithoutRef<P>>): ForwardRefExoticComponent<…>`；react.dev/blog/2024/12/05/react-19（原文："In future versions we will deprecate and remove forwardRef."） | 核实 |
| `<Context value>` 直接作 Provider | **已有类型支持**：`Context<T>` 继承 `Provider<T>` | `index.d.ts:678` `interface Context<T> extends Provider<T> { Provider: Provider<T>; Consumer: Consumer<T>; …}`；`:638` `type Provider<T> = ProviderExoticComponent<ProviderProps<T>>;`；`:544` `interface ProviderProps<T> { value: T; children?: ReactNode }` | 核实 |
| `RefCallback` 返回清理函数 | **允许**返回 `() => void` 作为 cleanup | `index.d.ts:176-185` `type RefCallback<T> = { bivarianceHack(instance: T \| null): void \| (() => VoidOrUndefinedOnly) \| DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[…] }["bivarianceHack"];` | 核实 |
| 全局 `JSX` 命名空间 | **无全局 `JSX`**，只有 `React.JSX`：`index.d.ts` 中无 `declare global`，`namespace JSX` 位于 `declare namespace React` 内部 | `grep "declare global"` 在 `index.d.ts` 无结果；`index.d.ts:4141` `    namespace JSX {`（缩进于 React 命名空间内） | 核实 |
| 函数组件 `defaultProps` | `FunctionComponent<P>` 接口 **没有** `defaultProps` 成员（仅 `propTypes?`、`displayName?`）；类组件 `ComponentClass` 仍有 `defaultProps?: Partial<P>` | `index.d.ts:1060-1075`（FunctionComponent）；`:1152`（ComponentClass） | 核实 |
| `propTypes` 类型 | 仍在 .d.ts 中，但标 `@deprecated Only kept in types for backwards compatibility. Will be removed in a future major release.`，类型为 `propTypes?: any` | `index.d.ts:934-937, 1063-1066, 1124-1127, 1147-1150, 1370-1373` | 核实 |
| `@types/react` 最新 | latest = 19.3.0（ts5.9/ts6.0 标签同为 19.3.0）；已安装 19.2.18 → ViewTransition 等稳定类型需升级 @types/react 19.3 | `npm view @types/react dist-tags` | 核实 |

### B. React 发布线（19.0 / 19.2 / 19.3，WebFetch 官方博客）

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| React 19.3 发布 | **2026-09-09** 发布 19.3.0（未安装；当前 npm latest） | react.dev/blog 列表；https://react.dev/blog/2026/09/09/react-19-3；`npm view react time` `"19.3.0": "2026-09-09T17:21Z"`；github.com/facebook/react/releases v19.3.0 | 核实 |
| 19.3 `<ViewTransition>` | 稳定："We shared it as an experimental API last year, and in 19.3 it's stable and ready to use." | react.dev/blog/2026/09/09/react-19-3 | 核实 |
| 19.3 `addTransitionType` | 稳定，用于按 transition 起因选择动画 | 同上 | 核实 |
| 19.3 Fragment Refs | 向 `<Fragment>` 传 ref 得到 `FragmentInstance`（有限 DOM 方法集） | 同上；GitHub release v19.3.0 | 核实 |
| 19.3 react-dom `browser()` | `use(browser())` 让组件在服务端触发 Suspense、客户端不触发（opt out of SSR，不报 recoverable error） | 同上 | 核实 |
| 19.3 Trusted Types | React 直接透传 Trusted Types 对象供浏览器校验 | 同上 | 核实 |
| 19.3 其它 | `<Context>` 可在 Server Components 中直接渲染；Transitions 独立渲染不再纠缠；Strict Mode 在 hydration 时双调 Effects；`onFullscreenChange/onFullscreenError`、`maskType`、`fetchPriority`(module)、`onReset` after Server Action、`submitter` in submit、`credentialless` iframe、resize 事件批处理 | 同上 | 核实 |
| React 19.2 (2025-10-01) 列表 | `<Activity />`、`useEffectEvent`、`cacheSignal`（RSC-only）、Performance Tracks（Scheduler/Components）、Partial Pre-rendering（`prerender`、`resume`、`resumeToPipeableStream`、`resumeAndPrerender`、`resumeAndPrerenderToNodeStream`）、SSR Suspense 边界批量揭示、Node 上的 Web Streams SSR、`eslint-plugin-react-hooks` v6（flat config 默认 + 编译器规则）、`useId` 前缀改为 `_r_` | https://react.dev/blog/2025/10/01/react-19-2 | 核实 |
| React 19.0 (2024-12-05) 列表 | Actions、`useActionState`、`useFormStatus`、`useOptimistic`、`use`、Server Components、Server Actions、ref as a prop、hydration error diffs、`<Context>` as provider、ref cleanup functions、`useDeferredValue` initialValue、document metadata、stylesheets(`precedence`)、async scripts、`prefetchDNS/preconnect/preload/preinit`、third-party script 兼容、`onCaughtError/onUncaughtError`、Custom Elements、`prerender/prerenderToNodeStream` | https://react.dev/blog/2024/12/05/react-19 | 核实 |
| 升级指南：移除 | `propTypes`/`defaultProps`（函数组件）、Legacy Context（`contextTypes`/`getChildContext`）、string refs、module pattern factories、`React.createFactory`、`react-test-renderer/shallow`、`ReactDOM.render`、`ReactDOM.hydrate`、`unmountComponentAtNode`、`ReactDOM.findDOMNode`、`react-dom/test-utils`（`act` 移到 `react`）、UMD 构建、`unstable_flushControlled` 等 | https://react.dev/blog/2024/04/25/react-19-upgrade-guide（"Removed deprecated React APIs"/"Removed deprecated React DOM APIs"） | 核实 |
| 升级指南：弃用 | `element.ref`（改用 `element.props.ref`）、`react-test-renderer` | 同上 "New deprecations" | 核实 |
| 升级指南：新行为 | ref as prop；ref 回调只能返回 cleanup（隐式返回其它值报错）；渲染错误不再 rethrow（`window.reportError`/`console.error`）；必须使用新 JSX transform | 同上 | 核实 |
| 升级指南：TypeScript | `useRef` 必须传参（`MutableRefObject` 弃用，统一 `RefObject`）；`ReactElement` props 默认 `unknown`；全局 `JSX` 命名空间移除 → `React.JSX`（模块增强需 `declare module "react" { namespace JSX {…} }`）；`useReducer` 类型推断改进；`types-react-codemod` | 同上 "TypeScript changes" | 核实 |
| `useFormState` → `useActionState` 更名 | 官方原文："React.useActionState was previously called ReactDOM.useFormState in the Canary releases, but we have renamed it and deprecated useFormState."；react-dom 19.2.8 运行时仍同时导出两者（见 A） | https://react.dev/blog/2024/12/05/react-19（2026-09-16 WebFetch 核实） | 核实 |

### C. react-router 7.18.3（已安装）

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| `future.v8_middleware` 在 7.18.3 是否仍是 future flag | **是（Framework 模式）**。Framework 模式 `FutureConfig` 含 `v8_middleware: boolean`；server runtime 按 `future?.v8_middleware === true` 决定是否创建 `RouterContextProvider`。**Data 模式**（`createBrowserRouter/createMemoryRouter`）的 `FutureConfig` 为空接口，运行时不按该 flag 门控，直接读取 route 的 `middleware` 字段 | `react-router/dist/development/index-react-server-client-BjY-eKuf.d.ts:127-131`<br>`interface FutureConfig { v8_passThroughRequests: boolean; v8_trailingSlashAwareDataRequests: boolean; v8_middleware: boolean; }`<br>`instrumentation-B7w3_Eo9.d.ts:303` `interface FutureConfig {}`（data-mode createRouter）；`chunk-HT4INDD5.mjs:148,166`；`chunk-BV7QT456.mjs` 中无 `future.v8_middleware` 门控 | 核实 |
| 类型层 `Future` 增强 | `interface Future {}`（可增强）+ `type MiddlewareEnabled = Future extends { v8_middleware: infer T extends boolean } ? T : false;` | `data-CjO11-hU.d.ts:8-12` | 核实 |
| `unstable_middleware` 标识符 | 7.18.3 dist 中**不存在**（grep 仅命中 `v8_middleware`） | `grep -rn "unstable_middleware" dist/development/*.d.ts` 无结果 | 核实 |
| 路由对象 `middleware` 字段 | `middleware?: MiddlewareFunction[];`（NonIndex/Index RouteObject）；服务端 route module `middleware?: MiddlewareFunction<Response>[]` | `data-CjO11-hU.d.ts:747`、`:1551`；`index-react-server-client-BjY-eKuf.d.ts:640,732` | 核实 |
| `MiddlewareFunction` 签名 | `type MiddlewareFunction<Result = unknown> = (args: DataFunctionArgs<Readonly<RouterContextProvider>>, next: MiddlewareNextFunction<Result>) => MaybePromise<Result \| void>;` | `data-CjO11-hU.d.ts:496` | 核实 |
| `RouterContextProvider` | `declare class RouterContextProvider { #private; constructor(init?: Map<RouterContext, unknown>); get(...); set(...) }`；从 `react-router` 主入口导出 | `data-CjO11-hU.d.ts:412-418`；`index-react-server.d.ts:2719` 导出清单 | 核实 |
| 路由 `createContext` | `declare function createContext<T>(defaultValue?: T): RouterContext<T>;`，主入口导出 | `data-CjO11-hU.d.ts:389`；`index-react-server.d.ts:2719` | 核实 |
| `createMemoryRouter` | `declare function createMemoryRouter(routes: RouteObject[], opts?: MemoryRouterOpts): Router$1;` | `index-react-server-client-BjY-eKuf.d.ts:371` | 核实 |
| `RouterProvider` 导出位置 | **两处都有**：`react-router` 主入口（带 `flushSync` prop：`RouterProvider({ router, flushSync, onError, useTransitions }): React.ReactElement`）；`react-router/dom`（`props: Omit<RouterProviderProps, "flushSync">`，内部接 react-dom `flushSync`） | `index.d.ts:6`（`o as RouterProvider`）+ `index-react-server-client-BjY-eKuf.d.ts:477`；`dom-export.d.ts:7-8, 173`；`react-router/package.json` exports `"./dom"` | 核实 |
| `redirect` / `redirectDocument` / `replace` | `declare const redirect: RedirectFunction;` 返回带 Location 头的 `Response` | `data-CjO11-hU.d.ts:1134, 1168` | 核实 |
| `useBlocker` | `declare function useBlocker(shouldBlock: boolean \| BlockerFunction): Blocker;`；`BlockerFunction = (args: { currentLocation: Location; nextLocation: Location; historyAction: Action }) => boolean` | `index.d.ts:876`；`index-react-server.d.ts:1741-1745` | 核实 |
| `unstable_usePrompt` | 仍带 `unstable_` 前缀导出：`usePrompt({ when: boolean \| BlockerFunction; message: string }): void` | `index-react-server-client-BjY-eKuf.d.ts:3496-3499`；`index.d.ts:6` `a8 as unstable_usePrompt` | 核实 |
| `useBeforeUnload` | `useBeforeUnload(callback: (event: BeforeUnloadEvent) => any, options?: { capture?: boolean }): void` | `index-react-server-client-BjY-eKuf.d.ts:3445-3447` | 核实 |
| NavLink 默认 class / aria | 默认 `"aria-current": ariaCurrentProp = "page"`；`ariaCurrent = isActive ? ariaCurrentProp : void 0`；字符串 className 时拼接 `isActive ? "active"`、`isPending ? "pending"`、`isTransitioning ? "transitioning"`；`end = false`、`caseSensitive = false` | `chunk-BV7QT456.mjs:10678, 10713, 10717-10724` | 核实 |
| `useSearchParams` setter 语义 | **整体替换查询串**：`navigate("?" + newSearchParams, navigateOptions)`；支持函数式更新 `nextInit(new URLSearchParams(searchParams))`；`defaultInit` 仅在首次 set 之前合并（`hasSetSearchParamsRef`） | `chunk-BV7QT456.mjs:10949-10956`；`SetURLSearchParams = (nextInit?, navigateOpts?: NavigateOptions) => void`（`…BjY-eKuf.d.ts:3050`） | 核实 |
| `{ replace: true }` 选项 | `NavigateOptions.replace?: boolean`（另有 `state`、`preventScrollReset`、`relative`、`flushSync`、`viewTransition`、`mask`） | `index-react-server-client-BjY-eKuf.d.ts:171-185` | 核实 |
| `location.key === "default"` | 初始位置 key 为 `"default"`：memory history 首条 `index2 === 0 ? "default" : void 0`；browser history `globalHistory.state?.key \|\| "default"`；后续导航 `createKey()` 随机 | `chunk-BV7QT456.mjs:44, 144, 177, 245` | 核实 |
| `react-router-dom` 7.18.3 package.json | 无 `deprecated` 字段；`dependencies: { "react-router": "7.18.3" }`；peer `react >=18`；`dist/index.mjs` 内容即 `export * from "react-router"; export { HydratedRouter, RouterProvider } from "react-router/dom"` | `react-router-dom/package.json`；`react-router-dom/dist/index.mjs`；`npm view react-router-dom@7.18.3 deprecated` 为空 | 核实 |
| react-router-dom 是否有 8.x | **没有**（npm versions 无 8.x；latest 7.18.4） | `npm view react-router-dom versions/dist-tags` | 核实 |
| react-router v8 | 8.0.0 发布 **2026-06-17**；latest 8.4.0（2026-09-15）；v7 分支同日发 7.18.4 | `npm view react-router time/dist-tags`；remix.run/blog/react-router-v8 | 核实 |
| v7→v8 升级指南 | 页面 https://reactrouter.com/upgrading/v8 存在（`/upgrading/v7` 也返回同一 v7→v8 内容；`/upgrading/v6` 404）。要点：最低 Node 22.22+ / React 19.2.7+ / Vite 7+；v7 需先开的 flags：`v8_middleware`、`v8_splitRouteModules`、`v8_viteEnvironmentApi`、`v8_passThroughRequests`、`v8_trailingSlashAwareDataRequests`；**移除 `react-router-dom`**（改 `react-router` + `react-router/dom`）；`meta`/`useMatches` 的 `data` → `loaderData`；Cloudflare `cloudflareDevProxy` → `@cloudflare/vite-plugin`；v8 ESM-only、tsconfig target ES2022 | reactrouter.com/upgrading/v8；remix.run/blog/react-router-v8 | 核实 |
| 中间件文档 | 当前站点默认版本 8.4.0 的 https://reactrouter.com/how-to/middleware **不再提 future flag**（middleware 已默认）；v7 版文档 https://reactrouter.com/7.18.4/how-to/middleware 明确：Framework 模式需 `react-router.config.ts` 中 `future: { v8_middleware: true }`；Data 模式无需 flag，直接在 route 对象加 `middleware: [...]`，类型上可 `declare module "react-router" { interface Future { v8_middleware: true } }`；导出名 `middleware` / `clientMiddleware`；`createContext` + `RouterContextProvider` + `context.get/set` | 两个页面 WebFetch | 核实 |
| v6 EOL | **官方已声明 EOL**："With the release of React Router v8 we are officially marking React Router v6 and Remix v2 as End of Life (EOL) so they will no longer be receiving security updates."；"React Router v7 will continue to receive security updates, just like v6 (and Remix v2) did."；改为每年一个大版本 | https://remix.run/blog/react-router-v8（2026-06-17） | 核实 |

### D. vue-router 4.6.4（已安装）与 v5

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| 类型文件位置 | 4.6.x 起（tsup 重构）**没有 `dist/vue-router.d.ts`**；类型在 `dist/vue-router.d.mts`（re-export）+ `dist/router-CWoNjPRp.d.mts` | `ls vue-router/dist` | 核实 |
| `NavigationGuard` 返回值 | `interface NavigationGuard { (to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded, next: NavigationGuardNext): _Awaitable<NavigationGuardReturn>; }`；`type NavigationGuardReturn = void \| Error \| boolean \| RouteLocationRaw;`；`_Awaitable<T> = T \| PromiseLike<T>` | `router-CWoNjPRp.d.mts:376-378, 365, 145` | 核实 |
| `next` 是否可选/遗留 | 类型上 `next` 是**第三个位置参数（非 `?:`）**，但 JS 可省略；文档："In previous versions of Vue Router, it was also possible to use a third argument `next`, this was a common source of mistakes and went through an RFC to remove it. However, it is still supported."；推荐返回值：`false` 取消 / 路由位置 重定向 / `undefined`·`true` 放行 / `Error` 触发 `router.onError`。**阶段 1 补充（2026-09-17，vue-router 5.2.0 实跑）**：仍可用，但 dev 控制台会发 `[VUE_ROUTER_R0025] The next() callback in navigation guards is deprecated.`（`vue-router/dist/useApi-CROJJdhE.js:223-224`），见 PROGRESS.md 1.6 | `router-CWoNjPRp.d.mts:388-394`（`NavigationGuardNext` 重载，4.6.4）；https://router.vuejs.org/guide/advanced/navigation-guards.html | 核实（4.6.4）；5.x 行为见补充 |
| `createMemoryHistory` | `declare function createMemoryHistory(base?: string): RouterHistory;` | `vue-router.d.mts:25` | 核实 |
| v5.0.0 发布与变化 | **2026-01-29** 发布。官方原话："Vue Router 5 is a _boring_ release, it merges unplugin-vue-router into the core package with no breaking changes."（唯一例外：IIFE 构建不再内置 `@vue/devtools-api`，因其 v8 移除 IIFE）。新增：文件式路由进核心（`vue-router/vite`）、数据加载器 `vue-router/experimental`（实验）、`vue-router/unplugin` 工具、`vue-router/volar/*`、查询参数默认可选（实验）、Route JSON schema | https://github.com/vuejs/router/releases/tag/v5.0.0；`npm view vue-router time` | 核实 |
| v4→v5 迁移指南 | https://router.vuejs.org/guide/migration/v4-to-v5.html 存在："there are no breaking changes" for v4 users without file-based routing；unplugin 用户：移除 `unplugin-vue-router`，`unplugin-vue-router/vite`→`vue-router/vite`，`…/data-loaders/*`→`vue-router/experimental`，`unplugin-vue-router`→`vue-router/unplugin`，`…/volar/*`→`vue-router/volar/*`，删 `unplugin-vue-router/client` 引用，生成类型移到 `src/route-map.d.ts`。`/guide/migration/` 是 v3→v4 页；`/guide/migration/v5.html` 404 | WebFetch | 核实 |
| v5 后续实验区破坏性变更 | 5.0.3：`reroute(to)` 替代 `new NavigationResult(to)`，移除 `selectNavigationResult`/`NAVIGATION_RESULTS_KEY`，`miss()` 改为内部 throw；5.1.0（2026-05-28）：`defineParamParser`/`defineParamParserRaw` 替代 `defineQueryParamParser`/`definePathParamParser`；5.2.0 (2026-07-15)、5.3.0 (2026-08-27)、5.3.1 (2026-09-02) | https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md；`npm view vue-router time` | 核实 |
| 4.x 末版 | 4.6.4（2025-12-11）为最后 4.x；npm `latest` 已是 5.3.1 | `npm view vue-router dist-tags/time` | 核实 |
| v5 最低 Vue 版本 | 抓取的 release/迁移页未写明 | — | 待核实 |

### E. pinia

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| pinia 4.0.0 发布 | **2026-07-14**；latest 4.0.3（2026-08-12） | `npm view pinia time/dist-tags`（GitHub 页面摘要给出的年份不可靠，以 npm 为准） | 核实 |
| 4.0 变化 | 官方原话："Pinia 4 contains only technically breaking changes: ESM only and upgrading `@vue/devtools-api` which now must be installed alongside pinia."（devtools-api v8 需随 pinia 一起安装）。其它：Nostics 错误诊断、`storeToRefs` 跳过 nullish 值、插件/属性诊断、导出 `piniaSymbol`、settable getters 可在 devtools 编辑、HMR 保留运行时新增属性；配套 `@pinia/testing@2.0.0`、`@pinia/nuxt@1.0.0` | https://github.com/vuejs/pinia/releases/tag/v4.0.0；/releases | 核实 |
| 3.x 是否仍在发版 | **没有**：最后 3.x 为 3.0.4（2025-11-05），4.0.0 之后 npm 无任何 3.x 发布；v3 分支 CHANGELOG 止于 3.0.4 | `npm view pinia versions/time`；https://github.com/vuejs/pinia/blob/v3/packages/pinia/CHANGELOG.md | 核实 |
| 3.0.0 变化（供对照） | 2025-02-11："drops support for Vue 2 and other deprecated APIs"；BREAKING：`PiniaStorePlugin` 移除→`PiniaPlugin`；`defineStore({ id })` 移除→`defineStore('id')`；iife 不含 devtools | 同上 CHANGELOG | 核实 |
| pinia 4 最低 Vue / Node 版本 | release notes 未写 | — | 待核实 |

### F. eslint-plugin-react-hooks 7.1.1（已安装）

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| 存在的 config 名 | `configs.recommended`、`configs['recommended-latest']`（两者为 legacy 形态 `plugins: ['react-hooks']`，README 说 .eslintrc 用 `plugin:react-hooks/recommended`）；`configs.flat.recommended`、`configs.flat['recommended-latest']`（flat 形态）。**无 `recommended-legacy`**（0 命中） | `eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:55433-55462`；README | 核实 |
| `recommended` 是否含 React Compiler 规则 | **含**。`recommended` = `rules-of-hooks: error`、`exhaustive-deps: warn` + 所有 `preset: Recommended` 的编译器规则：`config`(error)、`set-state-in-effect`(error)、`error-boundaries`(error)、`gating`(error)、`globals`(error)、`immutability`(error)、`preserve-manual-memoization`(error)、`purity`(error)、`refs`(error)、`set-state-in-render`(error)、`static-components`(error)、`unsupported-syntax`(warn)、`use-memo`(error)、`incompatible-library`(warn) | `:55414-55432`（`basicRuleConfigs` + `recommendedCompilerRuleConfigs`）；规则表 `:18092-18340` 的 `preset`/`severity`；`mapErrorSeverityToESlint` `:52076` | 核实 |
| `recommended-latest` 额外 | = recommended + `void-use-memo`(error)（唯一 `preset: RecommendedLatest`） | `:52071-52075`；规则表 | 核实 |
| 已注册但默认 Off 的规则 | `capitalized-calls`、`memoized-effect-dependencies`、`exhaustive-effect-dependencies`、`no-deriving-state-in-effects`、`fbt`、`hooks`、`invariant`、`rule-suppression`、`syntax`、`todo`(Hint)、`memo-dependencies`；`component-hook-factories` 为 7.1.0 起的 deprecated 空规则 | 规则表；`:55414` | 核实 |
| 备注 | 插件 `meta.version` 字符串写死 `'7.0.0'`（包版本 7.1.1）；peer `eslint ^3…^10` | `:55445`；`package.json:39` | 核实 |

### G. React Compiler

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| 稳定版本 | `babel-plugin-react-compiler` latest = **1.0.0**；React Compiler v1.0 博客 2025-10-07；文档安装命令 `npm install -D babel-plugin-react-compiler@latest` | `npm view babel-plugin-react-compiler dist-tags`；react.dev/blog；https://react.dev/learn/react-compiler/installation | 核实 |
| Vite 集成（官方文档） | `@vitejs/plugin-react` **≥6.0.0**：`import react, { reactCompilerPreset } from '@vitejs/plugin-react'; import babel from '@rolldown/plugin-babel'; plugins: [react(), babel({ presets: [reactCompilerPreset()] })]`（需 `npm i -D @rolldown/plugin-babel`）；文档注："In `@vitejs/plugin-react@6.0.0`, the inline Babel option was removed." **<6.0.0**（含已安装 5.2.0）：`react({ babel: { plugins: ['babel-plugin-react-compiler'] } })` | 同上 installation 页 | 核实 |
| 已安装 @vitejs/plugin-react 5.2.0 | 有 `babel?: BabelOptions \| ((id, { ssr }) => BabelOptions)` 选项；**无 `reactCompiler` 选项**；README 中 "compiler" 0 次出现 | `@vitejs/plugin-react/dist/index.d.ts:33`；`grep -ci compiler README.md` = 0 | 核实 |
| React 版本要求 | 默认 `target: '19'`（React 19 内置运行时，无需额外配置）；React 17/18 需 `npm install react-compiler-runtime@latest` 并设 `target: '18'`/`'17'` | https://react.dev/reference/react-compiler/target | 核实 |
| ESLint 配合 | 文档："The compiler rules are available in the `recommended-latest` preset."（实测 7.1.1 的 `recommended` 亦已含，见 F） | installation 页 + F | 核实 |

### H. TypeScript 与工具链 peer 范围

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| TS 7.0 | **2026-07-08** 发布，"a 10x faster native port of TypeScript"（Go 移植）；`typescript` npm 包现在即原生编译器（latest 7.0.2）；`@typescript/typescript6` 提供回退；nightly 改用 `typescript@next` | https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/；`npm view typescript dist-tags` | 核实 |
| TS 6.0 定位 | 2026-03-23 发布，"the last release based on the current JavaScript codebase" | https://devblogs.microsoft.com/typescript/ | 核实 |
| TS 7 API 兼容 | "TypeScript 7 does not yet expose a stable programmatic API"；typescript-eslint、Vue、Astro、Svelte、MDX、Angular 等暂不能用 TS 7；7.1 将带新 API | TS 7.0 公告 | 核实 |
| typescript-eslint | 8.70.0 peer：`typescript: ">=4.8.4 <6.1.0"`、`eslint: "^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0"` → **不支持 TS 7** | `npm view typescript-eslint peerDependencies` | 核实 |
| vue-tsc | 3.3.11 peer `typescript: ">=5.0.0"`（范围未排除 7，但 TS 7 缺 API，实际可用性未验证） | `npm view vue-tsc peerDependencies` | 核实（peer 范围）/ 待核实（TS 7 实际可用） |
| vitest | 5.0.1 peer：`vite: "^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0"`、`@types/node: "^22.0.0 \|\| >=24.0.0"`、jsdom/happy-dom `*` | `npm view vitest@latest peerDependencies` | 核实 |
| @testing-library/react | 16.3.3 peer：react/react-dom/@types/react/@types/react-dom `^18.0.0 \|\| ^19.0.0`，`@testing-library/dom ^10.0.0` | `npm view @testing-library/react peerDependencies` | 核实 |
| @testing-library/vue | 8.1.0 peer：`vue >= 3`、`@vue/compiler-sfc >= 3` | `npm view @testing-library/vue peerDependencies` | 核实 |
| 已安装 TS | 5.9.3（2025-09-30） | `npm view typescript time` | 核实 |

### I. Vue 3.6 状态

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| 3.6 是否稳定 | **未稳定**：npm `latest` = 3.5.42，`rc` = 3.6.0-rc.8（2026-09-11）；GitHub releases 无 v3.6.0 正式版 | `npm view vue dist-tags/time`；https://github.com/vuejs/core/releases | 核实 |
| 3.6 头条特性 | v3.6.0-rc.1（2026-07-18）："entering the RC phase as we have completed the intended feature set for Vapor Mode"；两大项：**Vapor Mode**（opt-in：`<script setup vapor>` / `<script vapor>` / `<template vapor>`，混用需 `vaporInteropPlugin`）和 **基于 alien-signals 的 `@vue/reactivity` 重构**；"Vapor Mode is feature-complete in Vue 3.6 RC" | https://github.com/vuejs/core/releases/tag/v3.6.0-rc.1 | 核实 |
| 官方博客 | blog.vuejs.org **尚无 3.6 文章**（最新为 2024-09-01 "Announcing Vue 3.5"） | https://blog.vuejs.org/ | 核实 |

### J. TanStack Query

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| 版本状态 | `@tanstack/react-query` latest **5.103.1**；`alpha/beta/rc` 标签仍指向 5.0.0 预发布；**npm 上不存在任何 6.x 版本**（含 alpha）；`@tanstack/query-core` 同样 latest 5.103.1 | `npm view @tanstack/react-query dist-tags`；`versions` 无 `"6.`；`npm view @tanstack/query-core dist-tags` | 核实 |

### K. Next.js

| 项目 | 事实 | 依据 | 状态 |
|---|---|---|---|
| 当前 major / latest | **16**；latest 16.3.5；canary 16.4.0-canary.34（2026-09-16）；preview 16.3.0-preview.10；无 17.x | `npm view next dist-tags` | 核实 |
| 16.0.0 首发时间 | **2025-10-22**（`"16.0.0": "2025-10-22T00:12:16Z"`）；16.1.0 2025-12-18；16.2.0 2026-03-18；16.3.0 2026-08-03；对照 15.0.0 2024-10-21 | `npm view next time` | 核实 |

---

### 事实卡内的待核实项（已并入附录 B）

1. **B**：React 官方"`useFormState` 更名为 `useActionState`"的原文出处——本次抓取的升级指南摘要未命中；仅能确认 react-dom 19.2.8 仍同时导出 `useFormState` 与 `useFormStatus`。
2. **D**：vue-router 5.x 的最低 Vue 版本要求（release notes / 迁移页均未写）。
3. **E**：pinia 4.x 的最低 Vue / Node 版本（release notes 未写；只确认 ESM-only + `@vue/devtools-api` v8 需并装）。
4. **H**：vue-tsc 3.3.x 在 TypeScript 7 下的实际可用性（peer 范围 `>=5.0.0` 未排除，但微软公告称 TS 7 尚无稳定编程 API，Vue 工具链暂不可用）。

其余各项均有 node_modules 行号或已实际抓取的官方页面作为依据。


## 附录 B · 待核实汇总

阶段 0 未能从规格 §1.2 允许的来源核实、或需要运行才能确认的项。写课件时这些结论只能标「待核实」，不能当事实。

**事实卡（附录 A）遗留**

| # | 项目 | 现状 |
|---|---|---|
| A1 | `useFormState` → `useActionState` 更名的官方原文 | **已核实**（React 19 发布博客原文见附录 A-B），不再待核实 |
| A2 | vue-router 5.x 最低 Vue 版本 | **已由 peerDependencies 补上**：vue-router@5.3.1 要求 `vue ^3.5.34`（§2.1） |
| A3 | pinia 4.x 最低 Vue / TS 版本 | **已由 peerDependencies 补上**：pinia@4.0.3 要求 `vue ^3.5.11`、`typescript >=5.6.0`（§2.1） |
| A4 | vue-tsc 3.3.x 在 TypeScript 7 下是否可用 | 待核实（与本项目无关：主线锁 TS 5.9） |

**逐题审计遗留（按题号）**

- 02 题：`props.amount = 0` 在本项目构建下是抛 TypeError 还是静默（取决于模块是否严格模式），需运行验证
- 04 题：Vue 文档中「组件事件的 `$event` 为 emit 载荷」的原文措辞
- 06 题：Vue 官方是否有把「watch 同步 props 派生状态」定性为反模式的表述
- 07 题：react-hook-form 的重渲染机制说法（来源不在清单内）；`useFormState` → `useActionState` 更名的官方原文（facts-sheet §B 未命中）。 → 更名原文**已核实**（附录 A-B）
- 10 题：`useEffectEvent` 早期提案名「useEvent」（允许来源内未命中）。
- 11 题：TanStack Query v5 `useQuery` 返回的 status 字面量与布尔字段的确切形态（未抓取参考页）。 → **已由 30 题审计核实**（v5 为 status × fetchStatus 两维度，isLoading = isPending && isFetching）
- 14 题：ahooks `useDebounce` / `useDebounceFn` 的存在与命名
- 16 题：zustand 官方对柯里化 `create<T>()()` 原因的原文；Redux Toolkit API 细节
- 18 题：(1) Vue 侧 `router.back()` 兜底判断（`router.options.history.state.back` 是否可用于判定「应用内无上一页」）未从 `d.mts` 核实；(2)「父子 loader 并行」由 `defaultDataStrategy` 源码的 `Promise.all` 佐证，官方 v7 Data Loading / Route Object 页面未直接命中该句。
- 19 题：`type="number"` 输入 "12." 的 `value` 表现（需运行验证）。
- 20 题：`vue/Example.vue:19-20`、`:53-55`「Vue 捕获后不会自动卸载崩溃子树」——文档未直接陈述，需运行验证（演示本身用 `v-if` 重挂，不受影响）。
- 27 题：`<script setup>` 允许 `export type` 的起始 Vue 版本（源码证实 3.5.42 允许，版本号未查到）；消费端 vue-tsc 从 `.vue` 文件 `import type` 是否顺畅（需运行验证）。
- 28 题：`<script setup>` 允许 `export type` 的起始 Vue 版本。
- 30 题：StrictMode 下日志"两条 queryFn + 一条被取消"的实际顺序（源码支持，需运行验证）。

**需要运行才能确认的项（阶段 2 改到该题时验证）**

- 02 题：开发构建下直接给 props 赋值是抛 `TypeError` 还是静默（取决于模块严格模式）。
- 04 题：`onClick={removeItem(item.id)}` 是否触发「Too many re-renders」。
- 15 题：重构为 `ThemeProvider({ children })` 后的重渲染计数。
- 17 题：StrictMode 下 `console.count` 的实际倍数（组件函数与 `useMemo` 计算函数都会双调）。
- 19 题：`type="number"` 输入 `12.` 时各浏览器的 `value`。
- 20 题：Vue 捕获错误后是否自动卸载崩溃子树。
- 30 题：StrictMode 下「两条 queryFn + 一条被取消」日志的实际顺序。
- 10 / 11 / 12 / 14 / 21 / 23 / 24 / 26 / 27 题：切换到 eslint-plugin-react-hooks 7 `recommended` 预设后的实际 lint 结果（审计已用只读方式实测 12、14、21、22、23、24、27 的命中情况，见各题）。

## 附录 C · 第二轮审计合并说明（2026-09-17）

第二轮「学习完整性」审计报告在 `docs/upgrade/AUDIT-ROUND2.md`（35 题 371 条：严重 54 / 概念 228 / 生产 32 / 小问题 57；待核实 182 条 + M-1～M-10）。两轮不物理合并，按下面的规则一起使用：

- **阶段 2 每题的蓝本**：AUDIT-ROUND2.md §5 的十段重写大纲（主线题已按 §3 判定回填）。
- **逐题问题表** = AUDIT-ROUND2.md §2（缺失、按级别与标签分组）+ 本报告 §3 的讲错清单。两轮重叠的条目（AUDIT-ROUND2.md §4 各题「同意的」）只处理一次。
- **以第一轮为准的条目**（第二轮标成「已讲对」但本报告有源码 / 官方原文依据，见 AUDIT-ROUND2.md §4 第 4 条）：02:206、03:223、07:301、08:321、10:359、14:437、15:456、16:477、17:495、18:517、21:613、22:634、23:654、24:667、25:695、26:717、27:739-741、29:784、30:809、30:813（均为本报告行号）。
- **以第二轮为准、覆盖本报告 §4.2 处置建议的条目**：18 主线为 Data 模式（本报告 :557）；14 `useWindowWidth` 主线为 `useSyncExternalStore`（:442）；26 修法优先级为 函数式更新 → 正确依赖 → `useEffectEvent`【较新】→ latest ref 并排（:715）；11 的 `use(promise)` 只作【较新】引用（:375）；13 处置改为「修改」（:421）；05 的「三元 = v-if 会卸载」需修正（:266）；Vue 3.5 的响应式 props 解构与 `onWatcherCleanup` 标【主流】（:689、:745、:764）。
- **可关闭的待核实**：附录 B 中 18 题「父子 loader 并行」（第二轮 R2-18-6 有官方原文）、16 题「柯里化原因」（第二轮 16 题大纲有官方原文）；第二轮的 P-25-1（10 题引用，本报告 :688 已核实成立）、P-22-1（22 题 `set-state-in-effect`，本报告已实跑 0 告警）。
- **主线判定与决定**：AUDIT-ROUND2.md §3（7 组 + 跨题口径）与 §6（D2-1～D2-8，已全部按建议决定，见 §5.13）。
- **lint 口径**：本报告对 21 / 23 / 24 / 27 / 22 为实跑；第二轮对 12（`refs`）/ 14（`set-state-in-effect`）/ 17 / 26 为实跑，其余按规则文本。阶段 1 切换预设后以实际输出为准（AUDIT-ROUND2.md 附录 M-1）。
