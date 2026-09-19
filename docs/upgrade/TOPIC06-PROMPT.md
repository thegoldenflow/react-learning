# 06 列表与 key · 执行 prompt（直接按「使用频率」写法完成）

> **用法**：在新会话里发送「读 `docs/upgrade/TOPIC06-PROMPT.md`，按它执行」。
> 写于 2026-09-19（01–04 按使用频率改写完成、9dfe389 之后）。**一次只开一个会话**：`PROGRESS.md`、README、注册表、`src/shared/` 是共享文件，并行会互相覆盖。
> 本文件和 `CONTINUE-PROMPT.md` 冲突时，06 的做法以本文件为准；其余事项（工程约定、验证方法、已核实的事实）以 `CONTINUE-PROMPT.md` 和 `PROGRESS.md` 为准。
>
> **执行状态（2026-09-19）：已完成（efe5615），不用再执行。** 记录见 PROGRESS 2.21（复核 36 条全部处理）；wip06 的 stash 已恢复并清空。下一步等用户定：其余九题（18、07、19、11、30、14、16、20、26）的使用频率改写，还是 08 起的新题。本文件保留作为「从半成品接着做、直接按使用频率写法完成」的记录。

---

## 0. 任务

你是资深前端工程师兼技术讲师，在继续升级 `D:\code\AI\learning\react`：一个「学 React（Vue 3 对照版）」学习站点，读者熟悉 Vue、在系统学 React 并准备面试。

06 列表与 key 在 2026-09-18 做了一半，半成品在 `git stash` 里（说明以「wip06」开头）。当时还没有「使用频率」规则。你要做的：**把 06 恢复出来，直接按使用频率写法做完**（样板是 05，01–04 是照它改完的四个例子），一个 commit；然后更新 PROGRESS、向用户汇报并**停下来**，问下一步做什么。

不在本次范围：其他题（01–05 已完成；18、07、19、11、30、14、16、20、26 的使用频率改写和 08 起的新题都等用户定）、阶段 3 / 4、新增或升级依赖、push、开 PR、合并分支。

## 1. 用户的要求与已定的决定

- 使用频率写法（用户原话）：「我的目的不是让你把一个主题的所有方法都写下来，而是让你把，工业界最常见的方法写出来，或者你可以把多种方法种，最常用的标注出来」；「你把不常用的，不用删除，注释起来就好，放开的是真正常用的方法」。要点：**页面上运行的只有常用写法；不常用的一条都不删，注释着保留，取消注释就能运行。**
- 2026-09-19 用户确认：「05 可以」；01–04 按同样方式改完（fdbff97 / 9ee15d0 / ade42f8 / 1a8ffe7，文档 9dfe389）。
- 2026-09-19 用户决定：**先做 06**（其余九题的改写之后再说）；**02 题原生属性类型保持 `ComponentPropsWithRef`**（不换成 ComponentProps，统一措辞表不动）。

## 2. 开工前按顺序读

1. `docs/upgrade/CONTINUE-PROMPT.md`：§4.3「使用频率标注」8 条；§2 可复用做法（尤其 9、11、13、14、21、23、24、27、29、34、35、36，以及 01–04 新增的 **37–40**：少用片段拆成单独组件、.vue 注释块格式、不用 stash 只检查要提交的改动、频率标签格式、频率依据的常见错误）；§3.3「06 怎么接着做」；§6 工程约定和「**06 题已核实的事实**」那一条（缺 key / 重复 key 的报错原文、index / Math.random 作 key 的实测、react.dev 原文措辞、`<Fragment key>`、Children「uncommon」、toSorted 与 tsconfig lib、crypto.randomUUID 的安全上下文、Vue v-for 的各项事实）。
2. `docs/upgrade/RETROFIT-01-04-PROMPT.md`：§3（每题的做法 3.1–3.8）、§5（两个脚本：取消【少用】注释块，已支持 .vue；旧版引文是否都还在）、§6（已知的坑）。**06 照 §3 的步骤做**，区别只在于 06 的代码大部分还没写，不是「改写」而是「写完」。
3. 样板与例子：05（dd8586c）的 `react/Example.tsx` 文件头与 `Example.test.tsx`；04（1a8ffe7）的少用片段拆分写法（`CaptureOrderDemo.tsx` / `RareModifiersDemo.tsx`、`vue/CaptureOrderDemo.vue`、页面上只注释 import 与用法）。
4. `docs/upgrade/PROGRESS.md`：2.16–2.20（05、01–04 的改写记录与复核改过的点）、「统一措辞」各表（尤其 Props、State、条件渲染）、「每题状态」表里别的题留给 06 的遗留（05 留给 06：v-if 与 v-for 同用）。
5. 审计材料：`grep -n "^### 06\. \|^#### 06\. " docs/upgrade/AUDIT-ROUND2.md`（§1 目标大纲与问题表、§5 十段重写大纲是蓝本）、`grep -n "^| R2-06-\|^| P-06-" docs/upgrade/AUDIT-ROUND2.md`、`grep -n "^### 06\. " docs/upgrade/AUDIT.md`。

然后：`git status`（只应有两个未跟踪的规格文件 `course-upgrade-prompt.md`、`update-project.md`，不要提交它们）、`git stash list`（应有一条 wip06）、`git log --oneline -3`（最上面是本 prompt 的提交）、跑一次 `npm run check` 确认基线是绿的（2026-09-19：411 条测试 / 31 个文件）。

## 3. 恢复半成品

1. `git stash list` 找到说明以「wip06」开头的那条，`git stash pop <那一条>` 恢复（2026-09-19 核对过：stash 的基底是 9de5117，之后 06 目录没有被任何提交改过，恢复不会冲突；stash 里含未跟踪的新文件）。恢复后 `git stash list` 应为空。
2. 恢复出来的东西（CONTINUE-PROMPT §3.3 有更详细的说明）：
   - React：`ListBasicsDemo.tsx`（区块一：filter / sort / map、排序前拷贝、`<Fragment key>` 包 dt / dd）、`demoData.ts`（`INITIAL_ORDERS`、`createLocalOrder`：优先 `crypto.randomUUID()`，没有时退回自增计数器）、`KeyBugDemo.tsx`（区块二：key 用 id / index / Math.random() 三种）、`KeyResetDemo.tsx`（区块三：换 key 重置草稿）、占位的 `Example.tsx`（文件头待写）、`Example.test.tsx`（10 条，已通过）。
   - Vue：`ListBasicsDemo.vue`、`KeyBugDemo.vue`（不写 key / index / id / random 四种）。仓库里原有的 `vue/Example.vue`、`vue/OrderNoteEditor.vue` 还是改写前的旧版。
3. 还没做的：Vue 侧的 KeyResetDemo（可复用旧的 `OrderNoteEditor.vue` 或重写）、`vue/Example.vue` 的精简头、Vue 测试；React `Example.tsx` 的十段文件头；使用频率标注（下面第 4 节）；README / 注册表 / PROGRESS；复核；浏览器验证；提交。
4. 研究材料：上一个会话的 scratchpad `C:\Users\lenovo\AppData\Local\Temp\claude\D--code-AI-learning-react\2806c59c-8286-45cc-8eea-31cacd9313b2\scratchpad\research06\`（`docs/` 是抓下来的官方原文，`docs-result.json` 是逐条结论；2026-09-19 还在）。找不到就只靠 CONTINUE-PROMPT §6 的「06 题已核实的事实」，写引文前对照官方 raw markdown 重新逐字核对（`curl -sSfL -o` 存到本会话 scratchpad 再 grep）。

## 4. 初步频率盘点（起点，不是结论；逐条找依据，找不到写「工程经验」）

按「要做的事」算。常见错误写法（缺 key、重复 key、渲染时 `Math.random()` 当 key、会重排的列表用 index）照讲、照演示，标 ❌，不参与排序。

### React
- 渲染列表：`items.map(item => <Row key={item.id} … />)`【最常用】（rendering-lists 的写法）；先 `filter` 再 `map`【最常用】；for 循环往数组里 push JSX【少用】（01 题茶杯例子里出现过，局部突变合法）。
- 排序：先拷贝再排 `[...list].sort(…)`【最常用】（updating-arrays 页示范的就是拷贝后 sort / reverse）；`toSorted()` 是 ES2023，本项目 tsconfig 的 lib 是 ES2022、类型里没有 → 只在「附」里提（运行时有）。
- key 从哪来：数据自带的 id（数据库主键）【最常用】；前端新建的数据在**创建时**生成 id（`crypto.randomUUID()`、自增计数器、uuid 包）【常用】—— rendering-lists「Where to get your key」一节原文逐字核对；数组下标 index【少用】：只适合不会增删、不会重排的静态列表（官方原文是「that's what React will use if you don't specify a key at all」，不是 by default）。
- 一项要渲染多个节点：`<Fragment key>`【常用】（`<>` 写不了 key，01 题已讲）。
- 换 key 重置 state（区块三）：05 / 02 题已定为【最常用】的重置办法，这里讲「key 是身份」的另一面，引用 05 / 02 不要重复展开。
- `Children.map` / `cloneElement` 操作 children【少用】：Children 页 Pitfall「Using Children is uncommon」，替代写法之一是「Accepting an array of objects as a prop」—— 只在正文一句 + 附，不做演示（没有就不补）。
- 长列表虚拟化：react.dev 的 memo / useMemo 页都没有推荐（已核实），只在七「生产环境注意」提一句需要时用库（工程经验），不装依赖。

### Vue（按 Vue 项目里的频率判断，不照搬 React 的标签）
- `v-for` + `:key`【最常用】；`<template v-for>`（一次渲染多个节点，key 放在 template 上）【常用】；`n in 10` 范围、遍历对象 `(value, key, index)`【少用】；`v-memo`【少用】（官方「should be rarely needed」，大列表 > 1000 才考虑）。
- 改数组：直接调变更方法 push / splice / sort（Vue 能侦测 7 个变更方法）【最常用】；整体替换 `list.value = list.value.filter(…)`【常用】。
- `v-if` 与 `v-for` 同一元素：官方不推荐同用 → 【最常用】先用 computed 过滤；把 v-if 挪到外层容器 / `<template>`【常用】。**这是 05 留给 06 的遗留**：06 做完后把 05 的两处「（06 题改写时补）」（`05-conditional-rendering/react/Example.tsx` 三的 v-if 与 v-for 条、`vue/Example.vue` 同一条）改成「见 06 题」，和 06 一起提交。
- 不写 key：Vue 默认「in-place patch」，只在不依赖子组件 state 或临时 DOM state 时安全；运行时不报警、由 `vue/require-v-for-key` lint 拦（已核实）—— ❌ 演示，照常运行。

### 演示的处理
- 现有三个区块多半都是【最常用】【常用】或 ❌ 反例，可能不需要注释任何演示；如果盘点下来有【少用】的演示，照 04 的做法拆成单独组件、页面上只注释 import 与用法，测试直接渲染组件（React、Vue 两侧同样处理，.vue 模板的注释块格式见 CONTINUE-PROMPT §2 第 37 条）。
- 【最常用】的写法如果没有运行中的演示，要补上并配测试（例如 key 从数据的 id 来、前端新建时生成 id、Vue 侧 computed 过滤代替 v-if + v-for）。
- 界面小标题 / 说明行带频率标签；测试标题不写频率字样，只用「附 N【少用】」对应注释块。

## 5. 做法、验证、复核、收尾

照 `RETROFIT-01-04-PROMPT.md` §3 的 3.2–3.8 做，要点：
- **文件头**：`react/Example.tsx` 十段 + 「使用频率」说明行（照 05 / 01–04 的写法）+ 文末「附：少用的写法与细节」；30 秒速答只用【最常用】；正文每个频率标签写依据（官方原文优先，找不到写「工程经验」），频率和版本分开写，编号标题保留【主流】；`vue/Example.vue` 精简头 + 使用频率说明 + 「附：细节」。JSDoc 文件头里不能出现 `*/`。
- **测试**：React 已有 10 条；Vue 侧补齐（mount + 结论断言，缺 key 不报警、重复 key 的警告原文、index 错位、换 key 重置、v-if 与 v-for 的编译优先级可以用 compileTemplate 断言）；每条「测试覆盖」的结论都要有测试。
- **验证**：`npm run check` 全绿（用管道截输出时加 `set -o pipefail`）；如果有【少用】注释块，按 RETROFIT §5.1 的脚本取消一次、跑 lint / typecheck / 06 测试、再从备份还原并 `diff -r`；§5.2 的引文保留检查（和 HEAD 里改写前的 06 比，缺失的要么补进「附」，要么在 PROGRESS 写明为什么删）；CONTINUE-PROMPT §4.6 的收尾检查（`没有一一对应关系`、绝对化用词、交叉引用、31–35 带「待新增」、CRLF）。
- **浏览器**：临时在 `.claude/launch.json` 加 5174 配置（`npm run dev -- --port 5174 --strictPort`）→ `preview_start` → 页面里先包一层 console.error / console.warn 收集 → 用 `javascript_tool` 一次点完两侧的交互（开头插入一行看备注跟着谁走、删第一行、Math.random 那一行重渲染后输入丢失、换 key 重置草稿）并读回结果 → `preview_stop` → `git checkout -- .claude/launch.json`。**用户自己在 5173 跑着 dev 服务器，不要碰。**
- **复核**：写完后起 1 个反驳式复核代理（只读，并发不超过 2 个），prompt 照 01–04 的写法（背景规则、盘点表路径、逐条核查 1–9、输出 `review-06.json`）；逐条处理，写进 PROGRESS。前五题的复核每次都查出 20 条以上实打实的问题，这一步不要省。
- **收尾与提交**：
  - `PROGRESS.md`：新增 **2.21** 06 一节（格式照 2.17–2.20：起因、改动、频率判断与依据表、注释掉了什么、验证、复核）；「每题状态」表加 06 一行；「阶段状态」与「下一步」改成「06 完成，等用户定下一批」；统一措辞如果有 06 定下来的新说法（例如 key 的来源、index 作 key 的前提），加一张「列表与 key（06 定稿）」表。
  - README 06 的目录行、说明段、面试题行按实际内容写；注册表 06 的 summary 同步。
  - 05 的两处「（06 题改写时补）」改成「见 06 题」（见第 4 节）。
  - 按显式路径 `git add`，信息格式 `06 列表与 key：按使用频率写法完成 —— 要点`，正文列主要改动，结尾加 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`。不 push。
  - 本文件开头补一行「执行状态：已完成（提交号）」，CONTINUE-PROMPT §3.3 的「06 怎么接着做」标成已完成，和 06 一起或另起一个文档提交。

## 6. 必须停下来问用户的情况

1. 频率判断会推翻已定的决定（AUDIT.md §5.0、各题主线、「统一措辞」表），或依据显示两种写法势均力敌、又直接影响主线代码：列出选项和推荐，问用户（02 题原生属性类型已由用户定为保持 WithRef，不要再问）。
2. 需要新增 / 升级依赖（例如想装虚拟化列表库、uuid）、push、开 PR、合并分支。
3. **06 提交后**：汇报（提交号、注释掉了什么、补了什么演示、复核改了几条、有没有需要用户定的事），然后问下一步：
   - 其余九题（18、07、19、11、30、14、16、20、26）按 01–04 的方式做使用频率改写；
   - 还是先写 08 起的 2-C 新题（08 → 09 → 10 → …，直接按使用频率写法）。

其他情况不停：查不到的依据写「工程经验」并在 PROGRESS 里记一笔，接着做。

## 7. 会话结束前（或上下文快满时）

1. 06 没做完：不提交半成品代码 —— 用 `git stash push --include-untracked -m "wip06：<做到哪>" -- src/topics/06-list-and-key` 存起来；在 PROGRESS.md 写清做到哪、还差什么，并在本文件第 3 节补一句当前状态。
2. 更新 PROGRESS.md 的阶段状态和「下一步」，提交文档。
3. 向用户简短汇报，提示他在新会话里发送「读 `docs/upgrade/TOPIC06-PROMPT.md`，按它执行」继续。
