# 学 React（Vue 3 对照版）

一个面向 **精通 Vue 3 的开发者** 的 React 学习项目。

**React 是主角，Vue 是参照物。** 本项目的目标不是「对比两个框架」，而是让你用最短路径学会工业界常见的 React 写法、建立 React 的思维模型、覆盖高频面试题——你已经熟悉的 Vue 3（Composition API / `<script setup>` / Pinia / Vue Router）只作为「翻译器」：每个 React 概念旁边都放着你已经会的 Vue 等价物，帮你把已有经验迁移过来，而不是从零学起。

## 项目目标

- **以 React 为第一视角**：每个知识点先讲 React 的核心概念和工业界惯用写法，再给出 Vue 对照，最后点破两者最重要的思维差异。
- **每题双文件并排实时运行**：22 个知识点，每题一个 `react/Example.tsx` 和一个 `vue/Example.vue`，实现同一个功能。壳应用把两个示例**并排渲染在同一个页面里实时运行**，源码也并排展示——看得到行为一致，比得出写法差异。
- **注释即教材**：示例代码里的注释密度非常高，逐条解释「React 为什么这么设计」「Vue 里对应什么」「新手最容易在哪里踩坑」「面试怎么考」。读注释比读本 README 更重要。
- **面向工业界与面试**：技术栈选的都是当前主流——React 19、TypeScript、Zustand、React Router v7；每题的注释里都埋了高频面试考点。

## 安装与运行

```bash
npm install        # 安装依赖
npm run dev        # 启动 Vite 开发服务器，浏览器打开提示的地址即可
npm run typecheck  # vue-tsc --noEmit，同时对 .tsx 和 .vue 做类型检查
npm run lint       # ESLint（含 react-hooks 与 vue 插件规则）
npm run build      # 先 typecheck 再 vite build
```

> **编辑器建议**：VS Code 安装官方扩展 **「Vue (Official)」**（Vue 语言服务）。没有它，`.vue` 文件的导入在 `.ts`/`.tsx` 里拿不到类型提示；React 侧则开箱即用。

技术栈一览（见 `package.json`）：

| 类别 | React 侧 | Vue 侧 |
| --- | --- | --- |
| 框架 | react 19 / react-dom 19 | vue 3.5 |
| 路由 | react-router-dom 7 | vue-router 4 |
| 全局状态 | zustand 5 | pinia 3 |
| 构建 | Vite 7 + @vitejs/plugin-react + @vitejs/plugin-vue（同一个应用同时启用两个插件） | |
| 类型 | TypeScript 5.9 + vue-tsc（统一检查 .tsx 与 .vue） | |

## 知识点目录（四阶段 · 22 题）

每题目录位于 `src/topics/<编号-目录名>/`，内含 `react/Example.tsx` 与 `vue/Example.vue`。

### 第一阶段：React 基础

| 编号 | 目录名 | 标题 | 学习重点 |
| --- | --- | --- | --- |
| 01 | `01-component-and-jsx` | 组件与 JSX | 函数组件 + JSX：React 里「一切都是 JavaScript」，对照 Vue 的 SFC 与模板语法 |
| 02 | `02-props` | Props | 用 TypeScript 类型声明 props、默认值写法、「props 只读」的约定，以及继承原生元素属性 + `{...rest}` 透传 |
| 03 | `03-state` | State 与 useState | useState 的读与写、不可变更新、渲染快照与函数式更新、多状态收敛到 useReducer，对照 ref/reactive |
| 04 | `04-events` | 事件处理 | onClick 与事件对象、处理函数的定义与传参，对照 @click 与 $event |
| 05 | `05-conditional-rendering` | 条件渲染 | 三元表达式与 && 的用法及陷阱（误渲染 0），对照 v-if / v-else-if |
| 06 | `06-list-and-key` | 列表渲染与 key | .map() 渲染列表、key 为什么必须稳定唯一、index 作 key 的坑、用 key 强制重置组件状态，对照 v-for |

### 第二阶段：表单和数据流

| 编号 | 目录名 | 标题 | 学习重点 |
| --- | --- | --- | --- |
| 07 | `07-forms` | 表单与受控组件 | value + onChange 的受控模式、非受控写法（defaultValue / FormData）、表单提交与 preventDefault，对照 v-model |
| 08 | `08-parent-child-communication` | 父子组件通信 | callback props 让子组件通知父组件、单向数据流，对照 emit |
| 09 | `09-derived-state` | 派生状态 | 渲染时直接计算派生值、什么时候才需要 useMemo，对照 computed |
| 10 | `10-effects-and-lifecycle` | useEffect 与生命周期 | 依赖数组、cleanup、AbortController、定时器与过期闭包；useEffect 不是 onMounted 的替代品 |
| 11 | `11-api-request-state` | API 请求状态 | loading / success / error / empty / retry 的完整处理，两边共用同一个模拟 API |

### 第三阶段：组件复用和常见 Hooks

| 编号 | 目录名 | 标题 | 学习重点 |
| --- | --- | --- | --- |
| 12 | `12-dom-ref` | useRef 与 DOM | DOM ref、用 ref 保存可变值；修改 ref 为什么不触发重新渲染，对照 template ref |
| 13 | `13-slots-and-children` | children 与组件组合 | children、具名 props 传 JSX、render props，对照 slot / 具名 slot |
| 14 | `14-composable-and-custom-hook` | 自定义 Hook | 状态逻辑复用、手写防抖 Hook、Hooks 规则（不能放进条件/循环），对照 composable |
| 15 | `15-context` | Context 跨层传值 | createContext / useContext 解决什么问题、可能引发的重渲染，对照 provide/inject |
| 16 | `16-global-state` | 全局状态（Zustand） | Zustand store 与组件局部状态的取舍，对照 Pinia |
| 17 | `17-performance-hooks` | useMemo 与 useCallback | memoization 什么时候有价值、为什么不能无脑用，对照 Vue 的 computed 缓存 |

### 第四阶段：实际开发常见模式

| 编号 | 目录名 | 标题 | 学习重点 |
| --- | --- | --- | --- |
| 18 | `18-routing` | 路由（React Router） | 路由参数、query、嵌套路由、页面导航、登录态守卫，对照 Vue Router |
| 19 | `19-async-submit` | 异步提交与防重复 | submitting 状态、防重复点击、成功/失败提示的工业界标准写法 |
| 20 | `20-error-handling` | 错误边界 | Error Boundary（唯一的 class 组件场景）能捕获什么、不能捕获什么，对照 errorCaptured |
| 21 | `21-immutable-update` | 不可变数据更新 | 展开、map、filter、嵌套更新；引用变化对 React 为什么至关重要 |
| 22 | `22-integrated-order-page` | 综合：订单管理页 | 搜索 + 筛选 + 分页 + 编辑 + 删除 + 各种请求状态，综合前面所有知识点 |

## React → Vue 概念对照表

方向是 **React 概念在前**：先记住 React 怎么写，再用 Vue 帮自己理解。

| React | Vue 3 对应 | 注意差异 |
| --- | --- | --- |
| JSX（`{expr}`、`.map()`、三元） | template（`{{ }}`、`v-for`、`v-if`） | JSX 就是 JavaScript 表达式，没有指令系统——所有控制流用原生 JS 写，能力上限更高但也没有模板编译期优化。 |
| `interface Props` + 函数参数解构 | `defineProps<Props>()` / `withDefaults` | React 的 props 类型就是普通 TS 类型，默认值用参数默认值语法；没有运行时校验层，纯靠编译期类型。 |
| `useState` | `ref` / `reactive` | useState 返回的是普通值 + setter，**不可直接修改**、必须换新引用；Vue 的 ref 是响应式对象，直接改就生效。 |
| 渲染时直接算派生值 / `useMemo` | `computed` | React 组件函数每次渲染整体重跑，普通 `const` 就是天然的派生值，useMemo 只是性能优化项；Vue 的 computed 是必需品（setup 只跑一次）且自动缓存。 |
| `useEffect` | `watch` / `watchEffect` / `onMounted` | useEffect 是「与外部系统同步」的声明式模型，不是生命周期钩子；`[dep]` ≈ `watch(dep, cb, { immediate: true })`（注意 immediate），cleanup 一个函数覆盖 Vue 的 onCleanup + onUnmounted 两个时机。 |
| 受控组件（`value` + `onChange`） | `v-model` | React 没有双向绑定语法糖，读和写两条线都要自己接；好处是数据流向永远显式可见。 |
| callback props（`onXxx` 属性传函数） | `emit('xxx')` | React 没有独立的事件系统，「子通知父」就是调用父亲传下来的函数；没有 emits 声明，类型直接写在 props 接口里。 |
| `children` / 具名 props 传 JSX / render props | 默认 slot / 具名 slot / 作用域插槽 | JSX 是一等公民的值，可以当普通 prop 传递；render props（传一个返回 JSX 的函数）对应作用域插槽——「子把数据回传给父的渲染逻辑」。 |
| `createContext` + `useContext` | `provide` / `inject` | 语义几乎一致，但 React 的 Context value 变化会让**所有消费组件**重渲染，需拆分 Context 或配合 memo；Vue 注入的 ref 是精准依赖追踪的。 |
| Zustand | Pinia | Zustand 无需 Provider、import 即用，但订阅粒度靠手写 selector；Pinia 的 store 是响应式对象，「读了才依赖」全自动。 |
| React Router（`<Routes>` / `useParams` / `useNavigate`） | Vue Router（路由表 / `useRoute` / `useRouter`） | React Router 的声明式路由就是 JSX 组件树的一部分；Vue Router 是集中式路由表配置。守卫思路也不同：React 常用包装组件 / loader，Vue 用导航守卫。 |
| custom hook（`useXxx`） | composable（`useXxx`） | 写法惊人地像，但 custom hook 每次渲染都重新执行、受 Hooks 规则约束（顶层调用、不能进条件/循环）；composable 在 setup 里只执行一次，无此限制。 |

## 每个知识点的学习重点

### 第一阶段：React 基础

**01 组件与 JSX** —— 函数组件就是「返回 JSX 的普通函数」，JSX 里 `{}` 内是任意 JS 表达式；`className`、`style` 对象写法等与 HTML 的差异。理解「JSX 即 JavaScript」是后面所有题的地基。工业界现状：函数组件 + Hooks 早已全面取代 class 组件，新代码不会再写 class（唯一例外见 20 题）。

**02 Props** —— 用 `interface` 声明 props 类型、参数解构 + 默认值、props 只读约定；以及**继承原生元素属性**（`ComponentPropsWithoutRef<'button'>` + `{...rest}`）。后半段是 Vue 老手的盲区：Vue 的 fallthrough attributes 会把 `disabled`/`aria-*` **自动**落到根元素，React 一个都不会自动落，必须显式展开。工业界现状：TS 化的 React 项目 props 就是纯类型声明，不再用运行时的 `prop-types` 库；受控地暴露原生属性是 shadcn/ui、MUI 等组件库的通用 API 设计范式。

**03 State 与 useState** —— 本项目最重要的一题。useState 二元组、**不可变更新**（map/filter/展开造新引用）、函数式更新 `setX(prev => ...)`、「引用变了才重渲染」，以及一个能亲手点的**渲染快照**实验（`setCount(count+1)` 连写两次只加 1）。末尾还有 **useReducer**：多个互相牵制的状态如何收敛成 reducer + Action 判别联合 + `never` 穷尽检查。这是 Vue 开发者思维转换的第一关，示例注释请逐条读完。

**04 事件处理** —— `onClick={fn}` 传函数引用、需要传参时套一层箭头函数、合成事件对象。对照 `@click` 与 `$event`；React 没有事件修饰符（`.stop` / `.prevent`），要自己调 `e.stopPropagation()` / `e.preventDefault()`。

**05 条件渲染** —— 三元表达式、`&&` 短路及其经典陷阱（`count && <X/>` 会把 0 渲染出来）。React 的「条件渲染」就是普通 JS 控制流，没有 `v-if` 指令。

**06 列表渲染与 key** —— `.map()` 渲染列表，key 帮 React 在 diff 时识别「哪一项还是哪一项」；index 作 key 在增删/排序时导致状态错位。本题还演示 key 的第二种用法：**换 key 强制重置组件状态**（`<EditForm key={selectedId}>`），这是官方文档给「prop 变了要重置 state」的标准答案，比在 useEffect 里同步好。面试必考，工业界代码评审必查。

### 第二阶段：表单和数据流

**07 表单与受控组件** —— `value` + `onChange` 受控模式、多字段表单用一个对象 state、提交时 `preventDefault`；以及**非受控写法**（`defaultValue` + `FormData`/ref 一次性取值）和两种模式的取舍。注意两个经典坑：`defaultValue` 只在首次挂载生效（与 Vue 的响应式直觉相反）、受控 `value` 不给 `onChange` 输入框会变只读。工业界现状：**复杂表单（多字段校验、动态字段）生产上普遍用 react-hook-form**（它内部正是非受控 + ref 注册，所以性能好）——先学会原生写法，才能理解它帮你省掉了什么。

**08 父子组件通信** —— 子组件通过父亲传下来的 callback prop 上报事件，状态提升（lifting state up）+ 单向数据流。React 没有 emit：「通信」就是函数调用，类型安全天然免费。

**09 派生状态** —— 能从现有 state 算出来的值**不要再开一个 state**，渲染时直接算；只有计算确实昂贵时才上 useMemo。这是 Vue 开发者第二个思维关口：React 没有（也不需要）到处都是的 computed。

**10 useEffect 与生命周期** —— 依赖数组三种形态、cleanup 的两个执行时机、StrictMode 双跑的用意、用 AbortController 根治请求竞态；外加一个**定时器实验**：`setInterval` 配空依赖数组为什么永远停在 1（过期闭包），以及三种修法（函数式更新 / 加进依赖 / latest ref）。第三个思维关口：useEffect 是「声明式同步」，不是生命周期钩子的换皮。

**11 API 请求状态** —— loading / success / error / empty / retry 五态齐全的手写请求流程。工业界现状：**生产项目的服务端数据基本都交给 TanStack Query（React Query）**——缓存、去重、重试、失效开箱即用；本题手写原生流程，是为了让你确切知道 TanStack Query 替你管了哪些状态。

### 第三阶段：组件复用和常见 Hooks

**12 useRef 与 DOM** —— 拿 DOM 用 `ref={domRef}`、用 ref 存「不参与渲染的可变值」（定时器 id 等）；`ref.current` 变化**不触发**重渲染。注意：React 的 useRef ≠ Vue 的 ref（后者是响应式状态，对应的是 useState）。

**13 children 与组件组合** —— `children`、具名 props 传 JSX、render props 三板斧，对应 Vue 的默认/具名/作用域插槽。工业界现状：组合（composition）是 React 组件库（如 Radix、shadcn/ui）的通用设计语言，比继承和配置项更主流。

**14 自定义 Hook** —— 把「state + effect」逻辑抽成 `useXxx` 复用：`useWindowWidth`（两个实例验证「复用的是逻辑不是状态」）和 `useDebouncedValue`（防抖搜索，配合 10 题的 AbortController 收口）；Hooks 规则（只能在顶层调用）及其由来。手写防抖是自定义 Hook 这个考点最经典的现场手写题——注意定时器为什么不能用普通变量存：Vue 的 setup 只跑一次，`let timer` 天然跨渲染存活，React 每次渲染重跑函数体会把它重置。工业界现状：真实项目多用 lodash.debounce / ahooks，但面试考手写版。

**15 Context 跨层传值** —— createContext / Provider / useContext 解决 props 逐层透传；Context 值变化会让所有消费者重渲染，因此工业界惯例是「低频全局值」（主题、当前用户、国际化）用 Context，高频共享状态交给 16 题的方案。

**16 全局状态（Zustand）** —— `create()` 建 store、selector 收窄订阅、set 不可变更新；什么状态该进全局、什么该留局部。工业界现状：Zustand 是当前 React 社区最主流的轻量全局状态方案之一（详见附录选型说明）。

**17 useMemo 与 useCallback** —— 缓存昂贵计算 / 稳定函数引用以配合 `memo`；不要无脑加（本身有成本，且多数计算根本不贵）。工业界现状：**React Compiler 正在把手动 memo 自动化**（构建期自动记忆化，React 19 生态已可用）——但面试与存量代码仍要求你懂手动写法，先学原生再理解编译器解决了什么。

### 第四阶段：实际开发常见模式

**18 路由（React Router）** —— `<Routes>/<Route>` 声明式路由、`useParams` / `useSearchParams` / `useNavigate`、嵌套路由与 `<Outlet>`，以及**登录态守卫**（`<RequireAuth>` 包装组件 + 登录后回跳）与按钮级权限。最重要的一条差异：Vue 的守卫是集中式配置外挂的钩子（`router.beforeEach`），**React 根本没有全局导航钩子**——守卫就是路由表里的一个普通组件，因为 React 的路由表本身就是组件树。本题 Vue 侧用 memory history 挂载以免与壳应用路由冲突。

**19 异步提交与防重复** —— submitting 状态锁按钮、成功/失败提示、错误恢复，工业界表单提交的标准样板。工业界现状：**React 19 的 useActionState / form actions 是官方新趋势**，把「提交中/结果/错误」收进一个 hook——先学会手写版本，才能看懂它抽象了什么。

**20 错误边界** —— Error Boundary 是 React 里**唯一还必须用 class 组件**的场景；它能捕获渲染期错误，捕获不了事件处理器/异步代码里的错误。对照 Vue 的 `errorCaptured`。工业界现状：一般直接用 `react-error-boundary` 库而不是手写 class。

**21 不可变数据更新** —— 展开、map、filter、嵌套对象/数组更新的完整套路，以及「引用变化」为何是 React 一切更新检测的基石。工业界现状：**深嵌套结构生产上普遍用 Immer**（`produce` 里写「可变风格」代码、产出不可变结果，Redux Toolkit 内置）——先把手写展开练熟，才知道 Immer 免除了什么苦。

**22 综合：订单管理页** —— 搜索 + 筛选 + 分页 + 编辑 + 删除 + 完整请求状态，一个页面串起前面全部 21 题。建议最后做，当成自测：先自己写 React 版，再对照示例。

## React 和 Vue 最重要的 10 个思维差异

1. **不可变 vs 可变。** React 的 state 是普通 JS 值，没有 Proxy 包装，React 察觉不到你的修改——它得知变化的唯一途径是你调用 setter 并传入**新引用**（`Object.is` 对比）。Vue 用 Proxy 拦截读写，直接 `item.quantity++` 就能精准触发更新。这是两个框架一切差异的源头。

2. **重新执行整个组件函数 vs 精准依赖追踪。** React 更新的最小单位是「组件函数整体重跑」：setState 后整个函数从头执行，产出新 JSX 再 diff。Vue 的 setup 只跑一次，之后靠依赖追踪只重跑真正依赖了变化数据的渲染副作用。理解「我写的每一行组件代码每次渲染都会重新执行」之后，闭包快照、useMemo、useCallback 的存在理由全都顺理成章。

3. **JSX 即 JavaScript vs 模板 DSL。** JSX 没有指令、没有修饰符、没有模板专属语法——条件是三元、循环是 `.map()`、插值是 `{}`。表达能力上不封顶（JSX 是值，可以存变量、传参数、从函数返回），代价是失去了模板静态分析带来的编译期优化，性能默认值不如 Vue，需要理解重渲染机制来兜底。

4. **useEffect 的同步模型 vs 生命周期钩子。** Vue 给你 onMounted / onUnmounted / watch 一排按时机命名的 API；React 只有一个 useEffect，思维模型是「声明组件如何与外部系统保持同步、如何清理」，执行时机由依赖数组决定。`useEffect(fn, [])` 行为像 onMounted，但那是「依赖为空所以永不重跑」的推论，不是生命周期钩子——带着钩子思维用 effect 是大部分 effect bug 的来源。

5. **手动 memo vs 自动缓存。** Vue 的 computed 自动缓存、模板编译期做静态提升，性能优化基本免费。React 里派生值默认「每次渲染重算」，缓存（useMemo/useCallback/memo）是需要你手动做且要权衡成本的显式优化——而 React Compiler 的出现恰恰证明了这件事该交给工具。

6. **显式受控 vs v-model 语法糖。** React 拒绝双向绑定：表单值从 state 来（value），变化通过事件写回 state（onChange），两条线都摆在明面上。啰嗦，但数据流向一眼可查；Vue 的 v-model 是同一模式的语法糖，糖衣下也是 :value + @input。

7. **组合优先 vs 插槽系统。** Vue 用 slot 这一专门机制解决内容分发；React 里 JSX 是一等公民的值，「插槽」退化成普通 props（children 也只是个特殊 prop），作用域插槽退化成「传一个函数」（render props）。没有新概念要学，全是函数与值的组合——这也是 React 组件库 API 设计的通用风格。

8. **Hooks 规则的由来。** React 不靠变量名、也不靠 Proxy 识别状态，而是靠**调用顺序**：每次渲染时第 N 个 useState 调用对应内部链表的第 N 个状态槽。所以 hook 不能写进条件/循环——否则顺序错位、状态张冠李戴。Vue 的 composable 在 setup 里只执行一次、响应式数据自带身份，没有这条限制。

9. **快照式闭包 vs 永远新鲜的引用。** React 每次渲染的 props/state 是那一帧的「快照」，事件处理器和 effect 闭包捕获的都是当时的值——异步回调里读到旧值（过期闭包）是 React 特有的经典 bug。Vue 的 `xxx.value` 永远指向响应式对象本身，不存在这个问题。这就是「函数式更新 `setX(prev => ...)`」存在的原因。

10. **状态与视图的关系：UI = f(state)。** React 把 UI 彻底当成状态的纯函数：不改 DOM、不改 state，只描述「给定状态该长什么样」，一切变化都通过换状态触发重算。Vue 也讲声明式，但它的响应式系统允许「命令式地改数据」；React 则把命令式彻底赶到边缘（effect / ref），核心渲染路径保持纯函数。适应了这一点，React 代码的可预测性就成了肌肉记忆。

## 推荐学习顺序

**按 01 → 22 顺序学**，四个阶段循序渐进，后面的题会直接引用前面的概念（示例注释里标了「见 XX 题」）。

其中 **03、09、10、21 是思维转换的四个关键节点**，值得放慢速度：

- **03 State 与 useState**：不可变更新 + 显式 setter，Vue 习惯迁移的第一道墙；
- **09 派生状态**：戒掉「什么都要 computed」的反射，接受「渲染时直接算」；
- **10 useEffect**：从「生命周期钩子」切换到「声明式同步」的心智模型；
- **21 不可变更新**：把 03 题的原则推广到深嵌套结构，练成手感。

**强烈建议动手改代码**：`npm run dev` 跑起来，直接改 `src/topics/*/react/Example.tsx`，Vite 热更新立即可见。有效的练法：把正确写法故意改成错误写法（直接改 state、删掉依赖项、把 key 换成 index），亲眼看 UI 坏在哪、ESLint 报什么——比只读注释记得牢十倍。最后用 22 题自测：先不看示例自己实现，再对照。

## 常见误区：Vue 开发者最容易犯的错

1. **直接修改 state。**
   错误：`items[0].quantity++`（Vue 习惯）——UI 纹丝不动，因为引用没变，React 察觉不到。
   正确：`setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: it.quantity + 1 } : it))`——永远造新引用交给 setter。

2. **用 useEffect 模仿 watch 做派生值。**
   错误：`useEffect(() => { setTotal(items.reduce(...)) }, [items])`——多一次渲染，两份状态迟早不同步。
   正确：`const total = items.reduce(...)` 渲染时直接算。effect 只用于「与 React 之外的系统同步」。

3. **为模仿 computed 滥用 useMemo。**
   错误：所有派生值都 `useMemo` 包一层，以为等价于 computed。
   正确：默认直接算；只有计算确实昂贵、或需要稳定引用（作为依赖/传给 memo 子组件）时才 useMemo——它本身有对比成本，不是免费缓存。

4. **在条件/循环里调用 hook。**
   错误：`if (visible) { const [x, setX] = useState(0) }`——渲染间调用顺序变化，状态槽错位。
   正确：所有 hook 无条件写在组件顶层；条件逻辑放进 hook 内部或 JSX 里。`eslint-plugin-react-hooks` 会拦住你。

5. **把 index 当 key。**
   错误：`items.map((it, i) => <Row key={i} />)`——增删/排序时组件状态跟错行。
   正确：用数据自身稳定唯一的 id 作 key。仅当列表纯展示、永不重排增删时 index 才勉强可用。

6. **误以为 useRef 就是 Vue 的 ref。**
   错误：`countRef.current++` 后等着 UI 更新——useRef 的变化不触发渲染。
   正确：参与渲染的数据用 useState；useRef 只用于 DOM 引用和「不需要触发渲染的可变值」（定时器 id、上一次的值）。Vue 的 `ref()` 对应的是 useState，不是 useRef。

7. **拿 Context 当全局 store。**
   错误：把高频变化的应用状态塞进一个大 Context——value 一变，所有消费组件全部重渲染。
   正确：Context 只放低频全局值（主题、当前用户）；高频共享状态用 Zustand（selector 精准订阅）。

8. **把 `useEffect(fn, [])` 当 onMounted、漏写依赖。**
   错误：effect 里用了 `keyword` 却写 `[]`，导致读到首帧的过期闭包值、变化不重跑。
   正确：effect 里用到的响应式值都进依赖数组，遵守 `exhaustive-deps` 规则；「只想跑一次」往往说明代码放错了地方。

9. **用 `count && <X/>` 做条件渲染。**
   错误：`count` 为 0 时页面上渲染出一个字面量 `0`。
   正确：`count > 0 && <X/>` 或三元表达式——`&&` 左侧必须是真正的布尔值。

10. **期待双向绑定。**
    错误：只写 `<input value={name} />` 就以为能输入——受控组件没有 onChange 就是只读的。
    正确：`value` + `onChange` 成对出现；React 没有 v-model，读写两条线都要自己接。

## 每个知识点对应的面试高频问题

| 题号 | 面试问题 |
| --- | --- |
| 01 | JSX 是什么？它最终被编译成什么？函数组件和 class 组件有什么区别，为什么现在都用函数组件？ |
| 02 | props 为什么是只读的？如何用 TypeScript 给组件的 props 定义类型和默认值？如何让自定义组件支持 `disabled`、`aria-*` 等全部原生属性（对比 Vue 的 `$attrs` 自动透传）？ |
| 03 | setState 之后发生了什么？为什么直接修改 state 不会触发更新？`setCount(count+1)` 连写两次为什么只加 1？什么时候该从 useState 升级到 useReducer？ |
| 04 | React 的合成事件（SyntheticEvent）是什么？`onClick={fn()}` 和 `onClick={fn}` 有什么区别？ |
| 05 | `condition && <Component/>` 有什么陷阱？条件渲染 null / false 时组件会发生什么？ |
| 06 | key 的作用是什么？为什么不能用 index 作 key？key 变化时组件会发生什么（卸载旧 Fiber、state 与 effect 全部丢弃）？如何用 key 重置子组件状态？ |
| 07 | 受控组件和非受控组件的区别是什么？各适用什么场景？`defaultValue` 和 `value` 有什么区别？为什么 react-hook-form 性能好？ |
| 08 | React 的父子组件如何通信？什么是状态提升？为什么 React 强调单向数据流？ |
| 09 | 什么是派生状态？为什么「用 useEffect 同步一份派生 state」是反模式？ |
| 10 | useEffect 的依赖数组三种写法各是什么行为？cleanup 什么时候执行？如何解决请求竞态？为什么 StrictMode 下 effect 执行两次？`setInterval` 配空依赖数组为什么计数永远停在 1，有哪几种修法？ |
| 11 | 一个完整的数据请求要处理哪些状态？TanStack Query 解决了手写请求的哪些痛点？ |
| 12 | useRef 和 useState 的区别？修改 ref.current 为什么不触发重渲染？useRef 有哪些典型用途？ |
| 13 | children 是什么？什么是 render props？React 如何实现 Vue 作用域插槽的效果？ |
| 14 | 自定义 Hook 和普通函数有什么区别？Hooks 为什么不能写在条件/循环里（Hooks 规则的原理）？手写一个防抖 Hook（定时器 id 为什么不能用普通变量存？卸载时为什么要 clearTimeout？防抖和节流的区别）。 |
| 15 | Context 解决什么问题？Context value 变化时哪些组件会重渲染，如何优化？ |
| 16 | Zustand / Redux / Context 如何选型？Zustand 的 selector 起什么作用？什么状态应该放全局、什么放局部？ |
| 17 | useMemo 和 useCallback 分别缓存什么？什么时候该用、什么时候是负优化？React.memo 和它们如何配合？ |
| 18 | React Router 中如何获取路由参数和 query？嵌套路由和 `<Outlet>` 如何工作？如何编程式导航？React Router 没有 `beforeEach`，登录态拦截和登录后回跳怎么做？ |
| 19 | 如何防止表单重复提交？React 19 的 useActionState / useTransition 解决了什么问题？ |
| 20 | Error Boundary 能捕获哪些错误、不能捕获哪些（事件/异步/自身）？为什么它必须是 class 组件？ |
| 21 | 为什么 React 要求不可变更新？如何不可变地更新深层嵌套对象？Immer 的原理是什么？ |
| 22 | （综合题）如何设计一个列表页的状态结构？搜索/筛选/分页状态如何组织？防抖放在哪一层？ |

## 附录

### 技术选型说明

**全局状态为什么选 Zustand，而不是 Redux 或 Context + useReducer？**
Zustand 轻量（核心几 KB）、无样板（一个 `create()` 就是 store + Hook，不需要 Provider、action type、dispatch）、且是当前 React 社区新项目的主流选择之一，面试认可度高。对比之下：Redux（即使是 Redux Toolkit）概念多、样板重，适合超大团队的强约束场景，作为入门第一个状态库性价比低；Context + useReducer 无需依赖但样板不少，且 Context 的整体重渲染问题使它不适合高频状态。学会 Zustand 的「store + selector」模型后，迁移到任何方案都容易。

**路由为什么用 React Router v7 的声明式 API？**
v7 的声明式用法（`<Routes>` / `<Route>` / `useParams` / `useNavigate`）与 v6 完全相同——这是存量项目与面试题的绝对主流，学一份经验通吃 v6/v7。v7 新增的框架模式（loader/action、文件路由）属于进阶内容，不影响本项目覆盖的核心路由概念。

### 一个 Vite 应用如何同时跑 React 和 Vue？

本项目是**一个 React 应用**（壳应用、路由、页面布局全是 React），在 `vite.config` 里同时启用 `@vitejs/plugin-react` 和 `@vitejs/plugin-vue`，因此 `.tsx` 与 `.vue` 可以共存编译。

Vue 示例通过桥接组件 `src/bridge/VueMount.tsx` 挂进 React 组件树：

- React 渲染一个由它拥有的空 `div`，在 `useEffect` 里调用 Vue 的 `createApp(component).mount(div)`，把 Vue 示例作为一个**独立的 Vue 应用实例**挂载进去；
- cleanup 时调用 `app.unmount()` 完整销毁，保证切换知识点时 Vue 侧的状态、定时器、插件都被干净回收；
- 需要 Vue 插件的题目（如 18 题的 vue-router）通过 `topicRegistry.ts` 里该题的 `vuePlugins` 工厂函数**每次挂载新建插件实例**（router 实例不能跨两个 createApp 复用），并用 memory history 避免与壳应用的地址栏路由冲突；
- 18 题的 **React 示例**同样被挂进一棵独立的 React 树（`src/bridge/ReactIsolatedMount.tsx`）：React Router 规定一棵组件树里只能有一个 `<Router>`，示例内部的 MemoryRouter 必须脱离壳应用 BrowserRouter 的上下文。

两侧示例共用 `src/shared/` 下的同一套类型与模拟 API，保证并排运行时行为一致——这个桥接是项目基础设施，本身不属于 22 个知识点。

---

祝学习顺利。记住本项目的使用方式：**跑起来、并排看、读注释、动手改。**
