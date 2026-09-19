# 其余九题按「使用频率」改写 · 执行 prompt（18、07、19、11、30、14、16、20、26）

> **用法**：在新会话里发送「读 `docs/upgrade/RETROFIT-REST-PROMPT.md`，按它执行」。九题工作量大，一个会话做不完就按第 8 节停下，下一个会话发同一句话接着做。
> 写于 2026-09-19（06 完成、push 到 1a7ea3f 之后）。**一次只开一个会话**：`PROGRESS.md`、README、注册表、`src/shared/` 是共享文件，并行会互相覆盖。
> 本文件和 `CONTINUE-PROMPT.md` / `RETROFIT-01-04-PROMPT.md` 冲突时，这九题的改写以本文件为准；其余事项（工程约定、验证方法、已核实的事实）以 `CONTINUE-PROMPT.md` 和 `PROGRESS.md` 为准。
>
> **执行状态**（每做完一题在这里补一行，新会话从第一个「未开始」的题接着做）：
> - 18：已完成（6d76108，PROGRESS 2.22；补了 useFetcher 星标演示；待用户定 18-1）
> - 07：已完成（13c58f9，PROGRESS 2.23；待用户定 07-1）
> - 19：已完成（a05c7f5，PROGRESS 2.24）
> - 11：未开始
> - 30：未开始
> - 14：未开始
> - 16：未开始
> - 20：未开始
> - 26：未开始

---

## 0. 任务

你是资深前端工程师兼技术讲师，在继续升级 `D:\code\AI\learning\react`：一个「学 React（Vue 3 对照版）」学习站点，读者熟悉 Vue、在系统学 React 并准备面试。

阶段 2-B 的八题（07、19、11、30、14、16、20、26）和样板 18 在 2026-09-17～18 改写过（十段文件头 + 可运行演示 + 测试），当时还没有「使用频率」规则：同一件事的几种写法平铺着，几乎每条都标【主流】。用户随后定了使用频率写法，05 按它改成样板（用户确认「05 可以」），01–04 照它改完，06 直接按它写完。你要做的：**按同样的方法，把这九题按 18 → 07 → 19 → 11 → 30 → 14 → 16 → 20 → 26 的顺序逐题改写，每题一个 commit**。九题都做完后更新 PROGRESS、向用户汇报并**停下来**，问下一步。

不在本次范围：08 起的 2-C 新题、阶段 3 / 4、README 的叙述章节、新增或升级依赖、push、开 PR、合并分支；新增知识点（例外：某件事【最常用】的写法没有运行中的演示，要补上，见 RETROFIT-01-04 §3.3）。

## 1. 用户的要求与已定的决定

- 使用频率写法（用户原话）：「我的目的不是让你把一个主题的所有方法都写下来，而是让你把，工业界最常见的方法写出来，或者你可以把多种方法种，最常用的标注出来」；「你把不常用的，不用删除，注释起来就好，放开的是真正常用的方法」。要点：**页面上运行的只有常用写法；不常用的一条都不删，注释着保留，取消注释就能运行。**
- 2026-09-19：「05 可以」；01–04 按同样方式改完（fdbff97 / 9ee15d0 / ade42f8 / 1a8ffe7）；06 完成（efe5615）；02 题原生属性类型保持 `ComponentPropsWithRef`（不换成 ComponentProps）；全部已 push 到 1a7ea3f。
- 2026-09-19 用户在 06 做完后选了「其余九题按 01–04 的方式做使用频率改写」，并要求写成 prompt 交给新会话执行（就是本文件）。
- 各题的主线是 2-B 时定下、有依据的决定（AUDIT-ROUND2 §3、AUDIT.md §5.0，18 的风格经用户确认）：**频率标注不改主线代码**。行业最常用和本课主线不一致时，照 02 题的做法分开写（「行业最常用 X（依据）；本课主线 Y（理由）」），记进 PROGRESS 的「待用户定」清单，九题做完一起问（见第 7 节）。

## 2. 开工前按顺序读

1. `docs/upgrade/CONTINUE-PROMPT.md`：§4.3「使用频率标注」8 条；§2 可复用做法（尤其 9、11、13、14、21、23、24、27、29、34–42）；§6 工程约定和各题「已核实的事实」（07、11、19、14、16、20、26、30、18 各有一条，改写时直接引用，不必重查）。
2. `docs/upgrade/RETROFIT-01-04-PROMPT.md`：§3（每题的做法 3.1–3.8，本文件照它做）、§5（取消【少用】注释块的脚本、旧版引文是否都还在的脚本）、§6（已知的坑）。
3. 样板与例子：05（dd8586c）是样板；04（1a8ffe7）的少用片段拆成单独组件、页面上只注释 import 与用法；06（efe5615）是最新的一题，频率标签、✅ / ❌、「附」的写法最接近现在的口径（尤其它的复核记录，PROGRESS 2.21 末尾）。
4. `docs/upgrade/PROGRESS.md`：2.16–2.21（使用频率改写与 06 的记录、复核改过的点）；「统一措辞」各表（这九题各自定稿的表：表单与事件类型 07、服务端状态 30、自定义 Hook 14、全局状态 16、错误边界 20、过期闭包 26 —— 改写时照用，不另起说法）；「每题状态」表里这九题的「遗留」一栏。
5. 每题动手前再读它自己的记录：18 → 2.1，07 → 2.3，19 → 2.4，11 → 2.5，30 → 2.6，14 → 2.7，16 → 2.8，20 → 2.9，26 → 2.10。

然后：`git status`（只应有两个未跟踪的规格文件 `course-upgrade-prompt.md`、`update-project.md`，不要提交它们）、`git stash list`（应为空）、`git log --oneline -3`、跑一次 `npm run check` 确认基线是绿的（2026-09-19 做完 18 / 07 / 19 之后：450 条测试 / 33 个文件）。

## 3. 每题的做法

照 `RETROFIT-01-04-PROMPT.md` §3.1–3.8 做（盘点 → 核实依据 → 改演示 → 改测试 → 改文件头 → 验证 → 复核 → 收尾提交）。01–06 之后补充的要点：

- **盘点写在 scratchpad 里**，按「要做的事」列：写法 → 标签 → 依据。常见错误写法标 ❌、不参与排序；只有一种正确写法、对照组是 ❌ 时不打频率标签；【旧写法】单独处理（面试高频的保持运行，其余按【少用】注释）。
- **依据**：先找直接讲频率的官方原文（common / uncommon / often / rarely / most common / rare case…），再看官方示例和主流库文档的写法，再看 npm 下载量（只在同类库之间比，写清范围与日期），都没有就写「工程经验」。讲「该不该用 / 怎么做」的句子不能当频率依据（CONTINUE-PROMPT §2 第 39、40 条）。引文用官方仓库的 raw markdown 逐字核对（抓到 scratchpad 再 grep），用第 5 节的 `verify-quotes.cjs` 跑一遍。
- **演示**：【最常用】【常用】正常运行、界面小标题带频率标签；【最常用】没有演示的要补上并配测试；【少用】拆成单独组件、页面上只注释 import 与用法（04 的做法），测试直接渲染组件；.vue 模板里的注释块写成 `<!-- 【少用】…` 开头、单独一行 `-->` 结尾。Vue 侧按 Vue 项目里的频率判断，不照搬 React 的标签。
- **测试**：条数只增不减（被注释的断言不算删除）；测试标题不写频率字样，只用「附 N【少用】」对应注释块；文件头里写了「测试覆盖」的每一句都要有断言真能证明它（06 的复核抓到过「只测了一边」）。类型层的断言由 `npm run typecheck` 检查。
- **文件头**：「成熟度」下加「使用频率」说明行（照 05 / 06）；30 秒速答只用【最常用】（❌ 的坑可以讲）；二～七只写【最常用】【常用】，每个标签写依据；【少用】和只为说全的细节（源码行号链、边角实测）挪进文末「附：少用的写法与细节」，正文留一句「演示已注释，见附 N」；编号标题保留【主流】；频率与版本分开写。JSDoc 文件头里不能出现 `*/`。
- **验证**：`npm run check`（管道截输出时 `set -o pipefail`）；RETROFIT §5.1 的脚本取消本题全部【少用】注释块，跑本题 lint、`npx vue-tsc --noEmit`、本题测试，再从备份还原并 `diff -r`；§5.2 的旧版引文检查（缺失的补进「附」，或在 PROGRESS 写明为什么删）；第 5 节的引文逐字核对；CONTINUE-PROMPT §4.6 的收尾检查（`没有一一对应关系`、绝对化用词、交叉引用、31–35 带「待新增」、CRLF）；浏览器：临时在 `.claude/launch.json` 加 5174 配置（`npm run dev -- --port 5174 --strictPort`），`preview_start` → 页面里先包一层 console.error / console.warn 收集 → 用 `javascript_tool` 一次点完改过的区块并读回结果 → `preview_stop` → `git checkout -- .claude/launch.json`。**用户自己在 5173 跑着 dev 服务器，不要碰。**
- **复核**：每题写完起 1 个反驳式复核代理（只读，并发不超过 2 个），prompt 照 06 的写法（背景规则、盘点表与原文的路径、逐条核查 1–9、输出 `review-NN.json`）；让它在自己的仓库副本里跑「取消注释」验证。01–06 每题都查出 20 条以上实打实的问题，这一步不要省。**删副本前先 `cmd //c rmdir <副本>\node_modules` 去掉 junction**（CONTINUE-PROMPT §2 第 42 条）。复核跑的时候可以做浏览器验证、起草 PROGRESS。
- **收尾与提交**：PROGRESS 新增 2.22（18）、2.23（07）……按做的顺序编号，格式照 2.17–2.20（起因、改动、频率判断与依据表、注释掉了什么、验证、复核）；「每题状态」表这一题的行末尾追加「2026-09-19 按使用频率改写（见 2.xx）」；README / 注册表只在区块名称、数量、测试条数变了时改这一题的事实行；本文件开头的执行状态补一行「NN：已完成（提交号）」；按显式路径 `git add`，信息格式 `NN 主题名：按使用频率改写 —— 要点`，正文列主要改动，结尾加 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`。不 push。检查「只含要提交的改动」可以用 CONTINUE-PROMPT §2 第 38 条（checkout-index 导出暂存区 + junction）。

## 4. 初步盘点（我读各题标题与 PROGRESS 记录得出的起点，不是结论；逐条找依据，找不到写「工程经验」）

标「决定点」的是频率判断可能和本课主线不一致的地方：**不改主线**，分开写、记进「待用户定」清单（第 7 节）。

### 18 路由（`src/topics/18-routing/`，React 8 个文件、Vue 12 个；样板题，风格经用户确认）
- **决定点**：路由模式 —— 主线是 Data 模式（`createBrowserRouter` + loader / action / middleware）；声明式 `<BrowserRouter><Routes>` 是并排，文件头自己写着「v6 存量项目和面试最常见」。行业里声明式很可能最常用（找依据：reactrouter.com 的 modes 页原文、官方模板默认用哪个、GitHub 代码搜索只能当线索），新项目官方推荐哪种要原文。分开写「行业存量最常用 / 官方新项目推荐 / 本课主线」。
- 路由对象用 `Component`（6.9 起）还是 `element`：待核实哪个常用。
- 守卫：middleware【较新·7.9 起】、loader 里 redirect、`RequireAuth` 包装组件 —— 按模式分别标（声明式项目里 RequireAuth 最常用是工程经验，要写明）。
- 导航：`<Link>` / `<NavLink>`【最常用】、`useNavigate`【常用】、loader / action 里 `redirect`（Data 模式）。
- `useBlocker` 离开确认、`handle` + `useMatches` 面包屑、`lazy` 路由：各自标频率（lazy 分包大概率常用；面包屑 / 离开确认要依据）。
- 取数：loader + `useLoaderData` 与「任意路由 + TanStack Query」（30 题）两种主流组合，已有交叉说明，频率分开写。
- Vue：`router.beforeEach`【最常用】、路由级 `beforeEnter`、组件内守卫（`onBeforeRouteLeave` 等）、`<RouterView :key>`；按 Vue 项目频率标。

### 07 表单（`src/topics/07-forms/`）
- 受控与非受控两条都是主线（2-B 已定，不改）；频率：受控在 React 应用里是否最常用、`FormData` + 非受控在 React 19 Actions 之后是否常用 —— 找依据后分开标，别把非受控标成【少用】去注释主线演示。
- 表单 state：一个对象 + 按 `name` 分发，还是每个字段一个 `useState`；自定义输入组件收 `value` + `onChange`【最常用】；`useId`【常用】。
- 表单库（react-hook-form 等）只写一句频率事实（37 题可选，未安装，不装依赖）。
- 大表单每击键重渲染的优化（把 state 放进更小的组件）：频率要依据。
- Vue：`v-model`【最常用】；`.lazy` / `.number` / `.trim`；组件上的 v-model 用 `defineModel()`（3.4+）还是 props + emit（【旧写法】）。

### 19 异步提交（`src/topics/19-async-submit/`）
- 主线手写 `submitting` + `disabled`（【最常用】的依据：react.dev form 页第一个用法「Handle form submission with an event handler」）；同一轮重入的 `useRef` 锁【常用 / 少用】待定；`useActionState` / `useFormStatus`【较新·19.0 起】（31 题待新增）；不在表单里的按钮用 `useTransition`；已经用 TanStack Query 时 `useMutation` 的 `isPending`（在那类项目里最常用，写前提）。
- 错误分层（字段错误 / 全局错误）、成功后清空 / 跳转 / 让查询失效：按「要做的事」分别标。
- Vue：手写 `submitting` 同样最常用；有没有少用写法看 `vue/` 的演示。

### 11 API 请求状态（`src/topics/11-api-request-state/`）
- **决定点（已定，只写清楚）**：主线是在 Effect 里手写取数（教学），文件头已写「生产用缓存层，见 30」。频率上生产最常用的是 TanStack Query 这类缓存层（依据：react.dev useEffect 页「Fetching data」一节对 Effect 取数缺点的原文 + 同类库 npm 下载量对比）；并排的路由 loader【常用】；`use(promise)`【较新】少用。
- 取消：`AbortController`（演示用）与官方示例的 `ignore` 标记 —— 两者频率待核实（官方示例用 ignore，真实项目里 abort 常见）。
- 状态建模：判别联合 ✅ / 多个布尔 ❌，不打频率标签。

### 30 TanStack Query（`src/topics/30-tanstack-query-server-state/`）
- `useQuery`【最常用】；`queryOptions` / key 工厂【常用】（官方文档推荐的程度要原文）；`useSuspenseQuery`【较新】；`enabled` 依赖查询【常用】。
- mutation 之后：`invalidateQueries`【最常用】（官方 invalidations-from-mutations 页的措辞）、`setQueryData`【常用】；乐观更新两种写法（改缓存 / 用 variables 渲染）各自的频率要原文。
- 预取：`ensureQueryData` / `prefetchQuery` / `fetchQuery` 在存量代码最常见但 5.102.0 起标 `@deprecated`，`queryClient.query()`【尝鲜】—— 统一措辞表已定，照用。
- Vue：`@tanstack/vue-query` 同一套；客户端状态放 Pinia。

### 14 自定义 Hook（`src/topics/14-composable-and-custom-hook/`）
- **决定点**：订阅浏览器 API / 外部 store —— 主线 `useSyncExternalStore`（AUDIT-ROUND2 §3 已定，有官方原文），并排 `useEffect` + `setState`（「18 之前的写法 · 简单场景仍可用」）。行业存量代码里后者很可能更常见（工程经验），分开写，不改主线。
- 返回函数包 `useCallback`（useCallback 页「Optimizing a custom Hook」原文）；防抖 Hook 自己写（`useEffect` + 定时器）还是用 lodash / use-debounce 这类库（只写一句，不装依赖）。
- 「不要造生命周期 Hook」是 ❌，不参与排序。
- Vue：composable + `ref` + `onMounted` / `onUnmounted`【最常用】；VueUse 这类库只写一句。

### 16 全局状态（`src/topics/16-global-state/`，React 9 个文件、Vue 16 个）
- **决定点**：状态库 —— 主线 Zustand，Redux Toolkit 只读对照（AUDIT.md §5.0：RTK 只讲概念、不装依赖）。按 npm 周下载量比较同类库（@reduxjs/toolkit / redux、zustand、jotai、mobx，写清日期与「含传递依赖」），行业存量最常用的若是 RTK，分开写，不改主线。
- 先 props → Context → store 的选择顺序（官方原文）；selector【最常用】、`useShallow`【常用】；`persist` / `devtools` 中间件；`createStore` + Context（服务端渲染、多实例时才用，频率待定）；Context + `useReducer`【常用 · React 内置】。
- Vue：Pinia【最常用】（官方推荐原文）；setup store 与 option store 哪个常用（Pinia 文档的措辞要原文）；模块级 `reactive` 共享【少用】？持久化插件自己写还是用 pinia-plugin-persistedstate（只写一句）。

### 20 错误边界（`src/topics/20-error-handling/`）
- **决定点**：主线手写 class 边界，react-error-boundary 可运行并排。react.dev 自己说可以直接用 react-error-boundary（Component 页原文，统一措辞表里有）；行业里后者大概率最常用。分开写「行业最常用 react-error-boundary / 本课主线手写（讲清原理）」，不改主线。
- 粒度：根边界 + 路由级（18 题）+ 局部；重置：`resetKeys`、`key`、`onReset`；上报：`componentDidCatch` / `onError` 与 `createRoot` 的 `onCaughtError` / `onUncaughtError`【较新·19.0 起】—— 各自标频率。
- 「接得住 / 接不住」八个按钮是讲机制的实验，不是写法，不打频率标签。
- Vue：`app.config.errorHandler`【最常用】、`onErrorCaptured`【常用】、可复用的 ErrorBoundary.vue 组件。

### 26 过期闭包（`src/topics/26-stale-closures/`）
- **决定点**：修法 —— 统一措辞表定了顺序 ① 函数式更新 → ② 写对依赖 → ③ `useEffectEvent`【较新·19.2.0 起】（主线示例）→ ④ latest ref（社区惯用法 · 并排）。频率上 ① ② 最常用；③ 很新、存量代码里少；④ 在 18 / 19.0 / 19.1 项目里常见（26 题记录：2026-09-18 这三个版本合计占周下载 30.45%）。分开写，不改主线。
- 四个现场（事件处理函数里的 setTimeout、Effect 里的监听器、轮询、依赖对象）是讲机制，不打频率标签；「让依赖合法消失」的几种写法（搬进事件处理函数、对象移进 Effect、拆 Effect）各自标频率。
- Vue：默认现读 `.value` 不会过期；watch 与 watchEffect 的选择按 Vue 项目频率标。

## 5. 脚本

RETROFIT-01-04-PROMPT.md §5 的两个脚本照用（`uncomment-rare.cjs`：取消【少用】注释块，已支持 .vue；`quotes-kept.cjs`：旧版「」引文是否都还在）。另外一个是 06 用的引文逐字核对脚本（用 Write 工具写到 scratchpad 的 .cjs 再执行）：

```js
// 用法：node verify-quotes.cjs <题目录> <文档目录>
// 取出题目录下所有文件里的「…」引文（不含中文的、长度 ≥ 12），去掉 markdown 标记后逐字比对文档原文；「…」省略号两边分段比对。
// 文档目录里放官方仓库的 raw markdown（curl -sSfL -o 抓下来）。未命中的多半是运行时 / lint / tsc 的报错原文，逐条去测试或源码里核对。
const fs = require('fs')
const path = require('path')
const [dir, docsDir] = process.argv.slice(2)
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const norm = (s) =>
  s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url)
    .replace(/\{\/\*[^*]*\*\/\}/g, '') // {/*anchor*/}
    .replace(/<\/?(?:em|strong|code|kbd|a)[^>]*>/g, '')
    .replace(/[*_`]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+--\s+/g, ' — ')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const docs = fs
  .readdirSync(docsDir)
  .filter((f) => /\.(md|txt|json)$/.test(f))
  .map((f) => ({ f, t: norm(fs.readFileSync(path.join(docsDir, f), 'utf8')) }))
// 注释里的引文可能跨行：去掉行首的「 * 」「// 」
const flat = (s) => s.replace(/\n[ \t]*(\*|\/\/)[ \t]?/g, '\n')
const quotes = new Map()
for (const f of walk(dir)) {
  const text = flat(fs.readFileSync(f, 'utf8'))
  for (const m of text.matchAll(/「([^「」]+)」/g)) {
    const q = m[1]
    if (/[\u4e00-\u9fff]/.test(q) || q.length < 12) continue
    if (!quotes.has(q)) quotes.set(q, new Set())
    quotes.get(q).add(path.basename(f))
  }
}
let ok = 0
const bad = []
for (const [q, files] of quotes) {
  const parts = q.split('…').map((p) => norm(p)).filter((p) => p.length > 3)
  const hit = docs.find((d) => parts.every((p) => d.t.includes(p)))
  if (hit) ok++
  else bad.push(`[${[...files].join(',')}] ${q}`)
}
console.log(`引文 ${quotes.size} 条：命中 ${ok}，未命中 ${bad.length}`)
for (const b of bad) console.log('  未命中：' + b)
```

raw markdown 的地址：`https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/<learn|reference/react|reference/react-dom|blog>/…md`、`https://raw.githubusercontent.com/vuejs/docs/main/src/<guide|api>/…md`、`https://raw.githubusercontent.com/vuejs/router/main/packages/docs/…`、`https://raw.githubusercontent.com/vuejs/pinia/v3/packages/docs/…`、`https://raw.githubusercontent.com/TanStack/query/main/docs/…`、`https://raw.githubusercontent.com/remix-run/react-router/main/docs/…`、`https://raw.githubusercontent.com/pmndrs/zustand/main/docs/…`（路径先在仓库里确认；分支名以仓库默认分支为准）。

## 6. 已知的坑（01–06 踩过的，加上 RETROFIT-01-04 §6）

- 18 / 07 / 19 复核反复抓到的（后面各题先自查）：【主流·x 起】和频率标签叠在一起（要写成「【最常用】…（x 起）」，只有【较新】【尝鲜】【旧写法】才叠）；改写时编号标题上的【主流】丢了；
  「用途 / 什么时候用 / 推荐哪个 API」的原句被当成频率依据（例如 useBlocker「Mostly used to…」、vue-router「usually used to…」、route-object「Most properties can be lazily imported」、
  useTransition「For common use cases, React provides…」）；两边都有官方示例的写法硬排高低（该写「两种都常见」）；npm 同类库比较被拿去撑跨类别的结论；
  只有一种正确写法却打了【最常用】（「只能这样做」不是频率）；文件头说「两种写法都有断言 / 测试有断言」其实只测了一边；新写的「只能 / 做不到」类排他结论（07 的「非受控做不到即时反应」是错的）。
- 引文脚本只读 .md / .txt / .json：.mdx（react-hook-form 文档）、引用式链接 [text][ref]、三个点「...」的省略、跨行引文要手工核对。
- 一次改三题时，用 CONTINUE-PROMPT §2 第 38 条（checkout-index 导出暂存区 + junction）逐题提交，复核代理可以同时读工作区里的下一题。

- JSDoc 文件头里不能出现 `*/`；JSX 注释块里不能再嵌 `{/* … */}`；.vue 模板的注释块中间不能再有 HTML 注释。
- 只注释用法不注释定义 → `noUnusedLocals` 报错；注释块要成对取消，第一行写清「和哪一段一起取消」。区块被注释后，整页测试里的区块标题列表、按钮文案里的数量要写成与数量无关的形式（names 数组）。
- Bash 里 `cd` 到子目录会改掉会话的工作目录；超过约 8 KB 的 heredoc 会整条失败，长脚本用 Write 写到 scratchpad；在 bash 的 `node -e "…"` 里写反引号会被 shell 吃掉，带反引号的替换用 Edit 工具或 .cjs 文件。
- compileTemplate 的输出第一行是 import，找调用要搜 `_renderList(` 这种带括号的写法；子串断言注意 `_ctx.todos` 含 `_ctx.todo`（CONTINUE-PROMPT §2 第 41 条）。
- react-hooks 的编译器类规则不分析定义在测试回调里的组件，别预先写 eslint-disable（会变成 Unused directive，`--max-warnings=0` 下失败）；vue/one-component-per-file 在测试文件里只数对象形式的 `defineComponent`。
- 浏览器面板隐藏时截图会失败、定时器被节流，用 `javascript_tool` 读回结果当证据；预览标签页的 console 缓冲会混入之前的日志，先包一层自己收集。
- 18、16、30 的文件多（React 8–9 个、Vue 12–16 个），复核代理读得慢；复核期间不要改这一题的文件，可以先做下一题的盘点（只读）。

## 7. 必须停下来问用户的情况

1. **「决定点」**（第 4 节标出的 18、14、16、20、26，以及改写中新发现的同类情况）：先按「分开写、不改主线」处理，把每一条写进 PROGRESS 新建的「待用户定（九题改写）」小节（题号、行业最常用写法与依据、本课主线与理由、推荐），**九题做完一起问**。例外：如果依据强到「不改主线就等于教错」，立刻停下来问。
2. 需要新增 / 升级依赖、push、开 PR、合并分支、删除用户文件。
3. **九题都做完后**：汇报（每题的提交号、注释掉了什么、补了什么演示、复核改了几条、「待用户定」清单），然后问下一步：先处理「待用户定」清单，还是开始 08 起的 2-C 新题（08 → 09 → 10 → …，直接按使用频率写法）。

其他情况不停：查不到的依据写「工程经验」并在 PROGRESS 里记一笔，接着做。

## 8. 会话结束前（或上下文快满时）

1. 当前题没做完：不提交半成品代码 —— `git stash push --include-untracked -m "wipNN：<做到哪>" -- src/topics/<题目录>`；在 PROGRESS.md 写清做到哪、还差什么，并在本文件开头的执行状态里补一句（例如「16：演示已改、文件头未改，在 stash wip16」）。已经通过检查的题照常提交。
2. 更新 PROGRESS.md 的阶段状态和「下一步」，提交文档。
3. 向用户简短汇报：完成了哪几题（附提交号）、每题注释掉了什么、「待用户定」清单现在有几条；提示他在新会话里发送「读 `docs/upgrade/RETROFIT-REST-PROMPT.md`，按它执行」继续。
