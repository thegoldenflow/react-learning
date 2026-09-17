# 学 React（Vue 3 对照版）

一个面向 **精通 Vue 3 的开发者** 的 React 学习项目。

**React 是主角，Vue 是参照物。** 本项目的目标不是「对比两个框架」，而是让你用最短路径学会工业界常见的 React 写法、建立 React 的思维模型、覆盖高频面试题——你已经熟悉的 Vue 3（Composition API / `<script setup>` / Pinia / Vue Router）只作为「翻译器」：每个 React 概念旁边都放着你已经会的 Vue 等价物，帮你把已有经验迁移过来，而不是从零学起。

## 项目目标

- **以 React 为第一视角**：每个知识点先讲 React 的核心概念和工业界惯用写法，再给出 Vue 对照，最后点破两者最重要的思维差异。
- **每题双文件并排实时运行**：30 个知识点，每题一个 `react/Example.tsx` 和一个 `vue/Example.vue`，实现同一个功能。壳应用把两个示例**并排渲染在同一个页面里实时运行**，源码也并排展示——看得到行为一致，比得出写法差异。
- **注释即教材**：示例代码里的注释密度非常高，逐条解释「React 为什么这么设计」「Vue 里对应什么」「新手最容易在哪里踩坑」「面试怎么考」。读注释比读本 README 更重要。
- **面向工业界与面试**：技术栈选的都是当前主流——React 19、TypeScript、Zustand、React Router v7、TanStack Query v5；每题的注释里都埋了高频面试考点。

## 安装与运行

```bash
npm install        # 安装依赖
npm run dev        # 启动 Vite 开发服务器，浏览器打开提示的地址即可
npm run typecheck  # vue-tsc --noEmit，同时对 .tsx 和 .vue 做类型检查
npm run lint       # ESLint（react-hooks 官方 recommended 预设 + vue 插件规则），警告也算失败
npm test           # vitest run：Vitest（jsdom）+ Testing Library
npm run build      # 先 typecheck 再 vite build
npm run check      # lint + typecheck + test + build 一条命令
```

> **编辑器建议**：VS Code 安装官方扩展 **「Vue (Official)」**（Vue 语言服务）。没有它，`.vue` 文件的导入在 `.ts`/`.tsx` 里拿不到类型提示；React 侧则开箱即用。

技术栈一览（见 `package.json`）：

| 类别 | React 侧 | Vue 侧 |
| --- | --- | --- |
| 框架 | react 19 / react-dom 19 | vue 3.5 |
| 路由 | react-router 7（从 `react-router` 导入） | vue-router 5 |
| 全局状态 | zustand 5 | pinia 3 |
| 服务端状态 | @tanstack/react-query 5 | @tanstack/vue-query 5（共用同一个 @tanstack/query-core） |
| 构建 | Vite 7 + @vitejs/plugin-react + @vitejs/plugin-vue（同一个应用同时启用两个插件） | |
| 类型 | TypeScript 5.9 + vue-tsc（统一检查 .tsx 与 .vue） | |
| 测试 | Vitest 4 + @testing-library/react + user-event + jest-dom（jsdom） | @testing-library/vue + @vue/test-utils（同一份 vitest.config.ts） |

## 目录结构

```text
src/
├── main.tsx                     # 入口：StrictMode + BrowserRouter，挂载壳应用
├── shell/                       # 壳应用（项目基础设施，不属于知识点）
│   ├── App.tsx                  # 侧栏 + 首页（首页展示推荐学习顺序与五阶段目录）
│   ├── TopicPage.tsx            # 单题页面：React / Vue 示例并排渲染 + 源码查看器
│   ├── topicRegistry.ts         # 30 题注册表：标题 / 摘要 / 阶段 / 推荐顺序 / Vue 插件工厂
│   └── ShellErrorBoundary.tsx   # 壳层错误边界：示例抛错不会拖垮整个应用
├── bridge/
│   ├── VueMount.tsx             # 在 React 树里 createApp().mount() 一个 Vue 示例
│   └── ReactIsolatedMount.tsx   # 把 React 示例挂进独立的 React 树（18 题：示例内含 Router）
├── shared/                      # 两侧示例共用
│   ├── types.ts                 # Order / User / Product 等类型
│   ├── mockApi.ts               # 模拟 API（fetchUsers / fetchOrders / updateOrder …，支持 signal / failRate / delayMs）
│   ├── products.ts              # 25 / 29 题共用的商品目录
│   └── styles.css               # 全局样式与工具类
├── test/                        # 测试基础设施（不属于知识点；配置见根目录 vitest.config.ts）
│   ├── setup.ts                 # 每个测试文件运行前执行：给 expect 装上 jest-dom 断言
│   ├── smoke.react.test.tsx     # 工具链冒烟测试（React 侧）
│   ├── smoke.vue.test.ts        # 工具链冒烟测试（Vue 侧）
│   └── fixtures/                # 冒烟测试用的最小组件
└── topics/
    └── NN-slug/                 # 每题一个目录，NN 为两位编号
        ├── react/
        │   ├── Example.tsx      # React 示例根组件
        │   └── …                # 必须拆出去的兄弟文件（如 18 题的页面组件）
        └── vue/
            ├── Example.vue      # Vue 示例根组件
            └── …                # 兄弟文件：18 题 router.ts、30 题 queryPlugin.ts、拆出的子 SFC 等
```

约定：

- **根组件 `Example` 不接收任何 props**——壳应用直接 `<Example />` 渲染，每题都能独立运行。
- **兄弟文件放在 Example 旁边**（18 题 `vue/router.ts`、30 题 `vue/queryPlugin.ts`、25 / 27 / 28 题拆出的子组件 SFC），核心讲解写在两个 Example 文件里；页面内的源码查看器可以切换查看该题 `react/`、`vue/` 目录下的全部文件（含测试）。
- **自动发现**：`topicRegistry.ts` 用 `import.meta.glob('../topics/*/react/Example.tsx')`（以及 `.vue` 和 `?raw` 源码）按目录名自动懒加载。新增一题 = 新建目录 + 在注册表加一条标题 / 摘要；文件还不存在时页面显示占位提示而不是崩溃。
- **头注释约定**：每个 Example 文件开头固定四段「学习主题 / React 核心概念 / Vue 对应概念 / 最重要的区别」。React 在前是有意为之——本项目的视角是 React 第一。两侧头注释互相对应；概念没有一一对应时明确写「没有一一对应关系」。

## 知识点目录（五阶段 · 30 题）

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
| 07 | `07-forms` | 表单与受控组件 | 受控（value + onChange）与非受控（defaultValue + FormData）两条主线、useId 与无障碍关联、onChange 的触发时机，对照 v-model / defineModel |
| 08 | `08-parent-child-communication` | 父子组件通信 | callback props 让子组件通知父组件、单向数据流，对照 emit |
| 09 | `09-derived-state` | 派生状态 | 渲染时直接计算派生值、什么时候才需要 useMemo，对照 computed |
| 10 | `10-effects-and-lifecycle` | useEffect 与生命周期 | 依赖数组、cleanup、AbortController、定时器与过期闭包；useEffect 不是 onMounted 的替代品 |
| 11 | `11-api-request-state` | API 请求状态 | Effect 手写请求（判别联合 + 派生 pending + 取消 + 重试 + 保留旧数据）与四种取数方案速查 |

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
| 18 | `18-routing` | 路由（React Router） | Data 模式主线（loader / action / middleware 守卫）与声明式 RequireAuth 并排；参数、query、嵌套路由、导航，对照 Vue Router |
| 19 | `19-async-submit` | 异步提交与防重复 | 手写 submitting（disabled + state 守卫 + useRef 锁）、错误分层与重试，并排 React 19 Actions（useActionState / useFormStatus） |
| 20 | `20-error-handling` | 错误边界 | Error Boundary（唯一的 class 组件场景）能捕获什么、不能捕获什么，对照 errorCaptured |
| 21 | `21-immutable-update` | 不可变数据更新 | 展开、map、filter、嵌套更新；引用变化对 React 为什么至关重要 |
| 22 | `22-integrated-order-page` | 综合：订单管理页 | 搜索 + 筛选 + 分页 + 编辑 + 删除 + 各种请求状态，综合前面所有知识点 |

### 第五阶段：React 核心机制与进阶模式

这 8 题与前四阶段同等重要（渲染模型、批处理、状态归属、过期闭包、竞态、TypeScript、useReducer、服务端状态），建议按下文的推荐顺序穿插学习，不要留到最后。

| 编号 | 目录名 | 标题 | 学习重点 |
| --- | --- | --- | --- |
| 23 | `23-rendering-and-state-snapshot` | 渲染模型与 state 快照 | 组件函数每次渲染都重新执行，state / props 是本次渲染的快照，setter 不改当前闭包里的值；UI = f(props, state)，对照 Vue 的响应式依赖追踪 |
| 24 | `24-batching-and-functional-updates` | State batching 与函数式更新 | 同一事件里 `setCount(count + 1)` 连写两次只加 1、`setCount(c => c + 1)` 才加 2：更新队列、自动批处理与 flushSync，对照 Vue 的异步 DOM 刷新与 nextTick |
| 25 | `25-state-ownership-and-lifting` | 状态提升与 state 归属 | 兄弟组件共享搜索 / 分类筛选时把 state 提升到最近的共同父组件；谁拥有 state、何时留在子组件、何时才上全局 store，对照 props + emit |
| 26 | `26-stale-closures` | 过期闭包（stale closure） | 延迟回调、手动事件监听、轮询读到旧 state 的坏例子与修法（函数式更新、依赖数组、latest ref / useEffectEvent、cleanup），对照 Vue 永远新鲜的 `.value` |
| 27 | `27-async-race-and-cancellation` | 异步竞态、取消与过期响应 | 快速改关键词时先发的慢请求后返回并覆盖新结果：坏版本可复现，ignore 标志 vs AbortController、cleanup 里取消，以及 loading / error / empty 的处理 |
| 28 | `28-react-typescript-basics` | React + TypeScript 基础 | Props / 可选属性 / 字符串联合 / useState 泛型 / 事件类型 / callback props / ReactNode 的类型建模，对照 defineProps / defineEmits / `ref<T>` |
| 29 | `29-use-reducer-and-action-types` | useReducer 与判别联合 Action | 购物车的添加 / 删除 / 改数量 / 清空收敛为纯函数 reducer + 判别联合 Action；什么时候 useState 就够，对照 Vue 的 reactive + 类型化 action 函数 |
| 30 | `30-tanstack-query-server-state` | TanStack Query 与服务端状态 | query key、缓存与 staleTime、loading / error / data、refetch、mutation 与失效重取；服务端状态不等于本地 UI state，React Query 对照 Vue Query |

## Vue → React 速查表

先速查、再看下面的详表。这张表的方向是 **Vue 在前**：你已经会的东西，在 React 里叫什么、在哪一题学。

| Vue | React | 对应题号 |
| --- | --- | --- |
| template | JSX | 01 |
| props | props | 02 / 28 |
| ref / reactive | useState | 03 / 23 |
| computed | derived data / useMemo | 09 / 17 |
| watch / onMounted | useEffect | 10 / 26 |
| v-model | controlled component（受控组件） | 07 |
| emit | callback props | 08 / 25 |
| slot | children | 13 |
| provide / inject | Context | 15 |
| Pinia | Zustand / Context / reducer | 16 / 15 / 29 |
| Vue Router | React Router | 18 |
| composable | custom hook | 14 |
| reactive update（响应式更新） | render + state snapshot（重渲染 + state 快照） | 23 / 24 |
| typed emit | typed callback props | 28 |
| request composable | query hook / custom hook | 11 / 30 |
| nextTick / 更新队列 | automatic batching（自动批处理） | 24 |
| reactive + action 函数 | useReducer + 判别联合 Action | 29 |

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
| state 快照 + 重渲染（`UI = f(props, state)`） | 响应式更新（依赖追踪：reactive 用 Proxy，ref 用 getter / setter） | React 每次 setState 都让组件函数整体重跑，本次渲染里的 state / props 是固定快照，setter 不会改当前闭包里的变量；Vue 的 setup 只跑一次，`.value` 永远读到最新值。更新队列、批处理、函数式更新、过期闭包全都由此而来（23 / 24 / 26 题）。 |
| `React.ChangeEvent<HTMLInputElement>` 等事件类型 | `Event` + `(e.target as HTMLInputElement)` | React 的合成事件带泛型，`e.target.value` 直接有类型；Vue 模板里 `@input` 拿到的是原生 `Event`，要自己断言 target——这正是 `v-model` 替你省掉的那一步（28 题）。 |
| `useReducer` + 判别联合 Action | `reactive` + 类型化 action 函数（无内置对应） | React 把「所有修改收敛成一个纯函数」做成了内置 Hook，`never` 穷尽检查保证漏掉的 Action 在编译期报错；Vue 没有对应原语，日常写 `addItem()` 这类方法或 Pinia action，纯 reducer 风格也能手写（29 题）。 |
| `useQuery` / `useMutation`（React Query） | `useQuery` / `useMutation`（Vue Query） | 两侧共用同一个 `@tanstack/query-core`，API 几乎逐字相同——它是生态库而非 React 核心 API；差别只在触发方式：React 靠重渲染把新的 queryKey 传进去，Vue 把 ref 放进 queryKey 由库自动监听（30 题）。 |

## 每个知识点的学习重点

### 第一阶段：React 基础

**01 组件与 JSX** —— 函数组件就是「返回 JSX 的普通函数」，JSX 里 `{}` 内是任意 JS 表达式；`className`、`style` 对象写法等与 HTML 的差异。理解「JSX 即 JavaScript」是后面所有题的地基。工业界现状：函数组件 + Hooks 早已全面取代 class 组件，新代码不会再写 class（唯一例外见 20 题）。

**02 Props** —— 用 `interface` 声明 props 类型、参数解构 + 默认值、props 只读约定；以及**继承原生元素属性**（`ComponentPropsWithoutRef<'button'>` + `{...rest}`）。后半段是 Vue 老手的盲区：Vue 的 fallthrough attributes 会把 `disabled`/`aria-*` **自动**落到根元素，React 一个都不会自动落，必须显式展开。工业界现状：TS 化的 React 项目 props 就是纯类型声明，不再用运行时的 `prop-types` 库；受控地暴露原生属性是 shadcn/ui、MUI 等组件库的通用 API 设计范式。

**03 State 与 useState** —— 本项目最重要的一题。useState 二元组、**不可变更新**（map/filter/展开造新引用）、函数式更新 `setX(prev => ...)`、「引用变了才重渲染」，以及一个能亲手点的**渲染快照**实验（`setCount(count+1)` 连写两次只加 1）。末尾还有 **useReducer**：多个互相牵制的状态如何收敛成 reducer + Action 判别联合 + `never` 穷尽检查（渲染快照与批处理在 23/24 题展开、useReducer 在 29 题展开）。这是 Vue 开发者思维转换的第一关，示例注释请逐条读完。

**04 事件处理** —— `onClick={fn}` 传函数引用、需要传参时套一层箭头函数、合成事件对象。对照 `@click` 与 `$event`；React 没有事件修饰符（`.stop` / `.prevent`），要自己调 `e.stopPropagation()` / `e.preventDefault()`。

**05 条件渲染** —— 三元表达式、`&&` 短路及其经典陷阱（`count && <X/>` 会把 0 渲染出来）。React 的「条件渲染」就是普通 JS 控制流，没有 `v-if` 指令。

**06 列表渲染与 key** —— `.map()` 渲染列表，key 帮 React 在 diff 时识别「哪一项还是哪一项」；index 作 key 在增删/排序时导致状态错位。本题还演示 key 的第二种用法：**换 key 强制重置组件状态**（`<EditForm key={selectedId}>`），这是官方文档给「prop 变了要重置 state」的标准答案，比在 useEffect 里同步好。面试必考，工业界代码评审必查。

### 第二阶段：表单和数据流

**07 表单与受控组件** —— 两条主线都是【主流】：**受控**（`value` / `checked` + `onChange`，一个对象 state + 按 `name` 分发，text / number / select / textarea / radio / checkbox 各自的写法，校验结果作为派生值，失败时聚焦第一个出错字段）和**非受控**（`defaultValue` / `defaultChecked` + 提交时 `new FormData(表单)` 或 ref 读一次，`key` 重置表单）。`TextField` 演示 `useId` + `htmlFor` / `aria-describedby` 和 React 19 的「`ref` 作为普通 prop」。区块三是 `onChange` 触发时机实验：它像原生 `input` 事件、输入法拼写期间也触发，Vue 的 `v-model` 拼写期间不更新。几条面试常考的边界都有测试：onChange 拒绝的输入会被 React 弹回（v-model 不会）、`value` 不配 `onChange` 与「uncontrolled → controlled」两类开发环境报错、`e.currentTarget` 在 await 后为 null、React 19 `<form action>` 成功后只重置非受控字段。工业界现状：复杂表单常用 react-hook-form，它默认走非受控 + ref 注册（本项目不安装）。

**08 父子组件通信** —— 子组件通过父亲传下来的 callback prop 上报事件，状态提升（lifting state up）+ 单向数据流（状态归属的判断标准见 25 题）。React 没有 emit：「通信」就是函数调用，类型安全天然免费。

**09 派生状态** —— 能从现有 state 算出来的值**不要再开一个 state**，渲染时直接算；只有计算确实昂贵时才上 useMemo。这是 Vue 开发者第二个思维关口：React 没有（也不需要）到处都是的 computed。

**10 useEffect 与生命周期** —— 依赖数组三种形态、cleanup 的两个执行时机、StrictMode 双跑的用意、用 AbortController 根治请求竞态；外加一个**定时器实验**：`setInterval` 配空依赖数组为什么永远停在 1（过期闭包），以及三种修法（函数式更新 / 加进依赖 / latest ref）。第三个思维关口：useEffect 是「声明式同步」，不是生命周期钩子的换皮（过期闭包见 26 题、竞态与取消见 27 题）。

**11 API 请求状态** —— 主线是**在 Effect 里手写请求（教学用）**：判别联合建模结果、取消与竞态、重试、空态与错误态分开。两个做法值得记：请求态**派生而不另存**（结果带上「参数指纹」，`pending = 指纹 ≠ 当前指纹`，于是 Effect 体里不用同步 `setState`，也不会被 `set-state-in-effect` 拦下，过期响应写进来也不会被当成当前结果），以及**切换关键词时保留旧数据**只加一个「刷新中…」（TanStack Query 的 `placeholderData: keepPreviousData` 同一目的）。区块二是四种方案速查（Effect 手写 / TanStack Query v5 的 `status × fetchStatus` / 路由 loader / `use(promise)` + Suspense）以及官方对「在 Effect 里取数」的四条缺点原文——**手写不是生产默认**：生产用缓存层（30 题）或路由 loader（18 题）。Vue 侧用 `watch` + `onWatcherCleanup`（3.5）一一对应，并列出 Vue 的对应物（`@tanstack/vue-query`、导航前/后取数、实验性的 `<Suspense>`）。

### 第三阶段：组件复用和常见 Hooks

**12 useRef 与 DOM** —— 拿 DOM 用 `ref={domRef}`、用 ref 存「不参与渲染的可变值」（定时器 id 等）；`ref.current` 变化**不触发**重渲染。注意：React 的 useRef ≠ Vue 的 ref（后者是响应式状态，对应的是 useState）。

**13 children 与组件组合** —— `children`、具名 props 传 JSX、render props 三板斧，对应 Vue 的默认/具名/作用域插槽。工业界现状：组合（composition）是 React 组件库（如 Radix、shadcn/ui）的通用设计语言，比继承和配置项更主流。

**14 自定义 Hook** —— 把「state + effect」逻辑抽成 `useXxx` 复用：`useWindowWidth`（两个实例验证「复用的是逻辑不是状态」）和 `useDebouncedValue`（防抖搜索，配合 10 题的 AbortController 收口）；Hooks 规则（只能在顶层调用）及其由来。手写防抖是自定义 Hook 这个考点最经典的现场手写题——注意定时器为什么不能用普通变量存：Vue 的 setup 只跑一次，`let timer` 天然跨渲染存活，React 每次渲染重跑函数体会把它重置。工业界现状：真实项目多用 lodash.debounce / ahooks，但面试考手写版。

**15 Context 跨层传值** —— createContext / Provider / useContext 解决 props 逐层透传；Context 值变化会让所有消费者重渲染，因此工业界惯例是「低频全局值」（主题、当前用户、国际化）用 Context，高频共享状态交给 16 题的方案。

**16 全局状态（Zustand）** —— `create()` 建 store、selector 收窄订阅、set 不可变更新；什么状态该进全局、什么该留局部。工业界现状：Zustand 是当前 React 社区最主流的轻量全局状态方案之一（详见附录选型说明）。

**17 useMemo 与 useCallback** —— 缓存昂贵计算 / 稳定函数引用以配合 `memo`；不要无脑加（本身有成本，且多数计算根本不贵）。工业界现状：**React Compiler 正在把手动 memo 自动化**（构建期自动记忆化，React 19 生态已可用）——但面试与存量代码仍要求你懂手动写法，先学原生再理解编译器解决了什么。

### 第四阶段：实际开发常见模式

**18 路由（React Router）** —— 课件升级阶段 2 的样板题（2026-09-17 重写，文件头按十段模板）。主线是 Data 模式：`createMemoryRouter` / `createBrowserRouter` 配置数组 + `RouterProvider`，loader / action / `errorElement` / `handle` / 路由级 `lazy`，登录守卫两种写法并排——分组路由 loader 里 `throw redirect`【主流】（日志面板演示父子 loader 并行的坑）与 middleware【较新·7.9 起】（下游 loader 不执行）；`useNavigation`、`useBlocker`、`useMatches` 面包屑、`safeRedirect` 回跳校验。并排是声明式模式 + RequireAuth 三态（checking / authed / guest）。最重要的区别是拦截时机：渲染之前（Data 模式、Vue `beforeEach`）还是渲染之中（声明式 RequireAuth）；「路由表是组件树还是配置」只是声明式模式的表象。参数变化时组件实例复用、`setSearchParams` 整体替换、`navigate(-1)` 兜底、NavLink 默认 `active` 类都有测试（`react/Example.test.tsx`、`vue/Example.test.ts`）。Vue 侧用返回值写法的 `beforeEach` 与 memory history。

**19 异步提交与防重复** —— 主线是**手写 submitting**（`useState` 驱动界面 + `useRef` 锁 + `try / catch / finally`）：防重复三道关（按钮 `disabled` → 处理函数里的 state 守卫 → `useRef` 锁），结果用判别联合建模，错误分层（服务端字段错误显示在字段旁并聚焦、网络错误 `role="alert"` + 重试），成功清空、失败保留输入。页面上的「同一轮事件里提交两次」实验能看到：只有 state 守卫时两个请求都发出去了，加上 `useRef` 锁才拦住（渲染快照）。并排是 **React 19 Actions【主流·19.0 起】**：`<form action>` + `useActionState`（`isPending`、重复提交排队串行）+ `useFormStatus`（按钮必须放在 `<form>` 的子组件里），并演示了一个常见坑——action 返回错误 state 也算成功，非受控字段照样被重置，要把提交的值放回 state 用 `defaultValue` 回填。Vue 侧逐行对应，但 `ref` 同步生效，守卫本身就够；事件处理函数里的同步错误和 async 拒绝都会进 `onErrorCaptured`（React 的错误边界接不住事件处理函数里的错误）。完整的 Actions（`useOptimistic`、Server Functions）在 31 题。

**20 错误边界** —— Error Boundary 是 React 里**唯一还必须用 class 组件**的场景；它能捕获渲染期错误，捕获不了事件处理器/异步代码里的错误。对照 Vue 的 `errorCaptured`。工业界现状：一般直接用 `react-error-boundary` 库而不是手写 class。

**21 不可变数据更新** —— 展开、map、filter、嵌套对象/数组更新的完整套路，以及「引用变化」为何是 React 一切更新检测的基石。工业界现状：**深嵌套结构生产上普遍用 Immer**（`produce` 里写「可变风格」代码、产出不可变结果，Redux Toolkit 内置）——先把手写展开练熟，才知道 Immer 免除了什么苦。

**22 综合：订单管理页** —— 搜索 + 筛选 + 分页 + 编辑 + 删除 + 完整请求状态，一个页面串起前面全部 21 题。建议最后做，当成自测：先自己写 React 版，再对照示例。

### 第五阶段：React 核心机制与进阶模式

**23 渲染模型与 state 快照** —— 整个 React 心智模型的地基，推荐顺序里排第一。四个可点的实验：①「一次渲染 = 一次函数执行」，组件函数体顶部的 `console.log` 让你亲眼看到每次 setState 后整个函数重跑（开发期 StrictMode 打印两遍，生产只一次）；②「处理器捕获快照」，`setCount(count + 1)` 之后立刻把 `count` 写进页面日志——日志里仍是旧值，页面显示的却是新值，两个数字差 1 就是「新 UI 来自新一次函数执行」的证据；③「直接改局部变量无效」，`let localCopy = count; localCopy += 1` 像 Vue 那样改，UI 纹丝不动，下次渲染它还会被重新初始化；④「UI = f(props, state)」，纯子组件 `Summary` 在同样的 props 下必然渲染出同样的 UI，「1 秒后记录本次渲染收到的 props」按钮证明 props 和 state 一样属于当前渲染的快照——父组件这 1 秒内又 +1 也改不了日志里的旧 props。Vue 侧同样的按钮 `count.value++` 后立刻读到新值：setup 只跑一次，渲染函数从 Proxy 现读，没有快照这回事，`let localCopy = count.value` 不更新视图的原因也不同（脱离了 Proxy）。与 03 题的区别：03 只复现「连点两次只加 1」，本题讲背后的机制。工业界现状：这就是官方文档「Render and Commit」「State as a Snapshot」两章，读不懂它就读不懂后面所有 Hooks 的行为。

**24 State batching 与函数式更新** —— 三个区块。①「更新队列」四个按钮：A `setCount(count + 1)` 连写两次（+1）、B `setCount(c => c + 1)` 连写两次（+2）、C `setCount(count + 5); setCount(c => c + 1)`（+6）、D 最后再 `setCount(42)`（=42）；文件内一个 `applyQueue` 模拟器把每次点击的队列与预测结果写进日志——值 = 替换、函数 = 作用于前值，对应官方文档「queueing a series of state updates」。②「批处理：一次事件只提交一次渲染」：用 effect 诚实统计提交次数，同一事件里改两个 state 只 +1 次；React 18 起 `setTimeout` 里也自动批处理（仍 +1）；`flushSync` 才能拆成两次；再配一对按钮证明「setState 后立刻读 DOM 是旧文本、`flushSync` 后是新文本」。③「什么时候必须函数式更新」清单 + 「连点 3 次：500ms 后 `setCount(count + 1)`」（共 +1）vs updater（+3），指向 26 题。Vue 侧 A/B 都 +2、C +6、D =42——没有更新队列也没有函数式更新，赋值即生效，「没有一一对应关系」；Vue 批的是 **DOM flush** 不是数据，`count.value++` 后立刻读 DOM 是旧的、`await nextTick()` 后才是新的，`flushSync` 与 `nextTick` 是方向相反的工具。工业界现状：React 18 之前只有事件处理器内批处理，`setTimeout` / Promise 里每次 setState 都触发一次渲染——面试仍常考这段历史；`flushSync` 只在「必须同步读 DOM」（测量、滚动定位）时用。

**25 状态提升与 state 归属** —— 搜索框、分类筛选、结果统计、商品列表四个兄弟组件共用 `keyword` 与 `category`：state 提升到最近的公共父组件，父组件渲染期直接过滤（09 题），子组件完全受控。头注释里有一张**归属表**：`keyword / category → Example`（三个兄弟都用，提升）、`expanded → CategoryFilter`（只有它用，留在子组件——兄弟变化后展开态照样保留）；「为什么不能各存一份：没有任何机制保持同步」；「为什么不进 Zustand：只有这棵子树用」（16 题的判断标准）。复选框「让列表组件自己再存一份 keyword（反面教材）」切到 `useState(keyword)` 拷贝的版本，拷贝后不再同步——两份真相源，用 `useEffect` 把它们抄齐是 09 题的反模式。React 的单向数据流：数据向下（props）、事件向上（callback）。Vue 侧用 `defineModel`（脱糖后就是 `modelValue` + `update:modelValue` = React 的 value / onChange）与 props + emit 实现同一结构，`ref(props.keyword)` 拷贝后同样不同步。与 08 题的区别：08 讲机制（callback props vs emit，一父一子），25 讲设计判断（state 放哪、兄弟共享、何时留局部、何时才进全局）。工业界现状：「state 放在需要它的组件的最近公共祖先，再往上是过度提升，更往上才是全局 store」是官方文档 Sharing State Between Components 的结论，也是代码评审里最常见的结构性意见。

**26 过期闭包（stale closure）** —— 头注释第一条：React 函数组件每次渲染都会产生新的变量和闭包，Vue 的 setup 只跑一次、ref 是长期存活的容器。三个区块各带运行日志。①「事件处理器里的 setTimeout（根本没有 effect）」：「2 秒后保存」读到的是点击那一帧的 `count`（坏），latest ref 才读到最新值（好）；「2 秒后 +1」用函数式更新只解决「由旧算新」，要为别的目的读最新值仍得用 ref；JSX 里的 `onClick` 本身不会过期，因为每次渲染都重建。②「手动 `addEventListener`」：依赖 `[]` 的监听器永远读到首帧的 `count`，依赖 `[count]` + `removeEventListener` cleanup 才正确——删掉 cleanup 就能看到监听器堆积、每次按 Enter 多打一行。③「轮询读旧的筛选参数」：`BrokenPoller`（依赖 `[]`，切到 paid 后仍按 all 查）、`RestartingPoller`（依赖 `[status]`，重启轮询在这里可接受）、`EffectEventPoller`（React 19.2 的 `useEffectEvent`：读最新 props 又不重启 effect，10 题手写的 latest ref 的官方版）；每个 poller 都用 `alive` 标志 + `clearInterval` 做 cleanup，迟到的响应不再写日志。Vue 侧 `setTimeout(() => log(count.value))` 永远新鲜，唯一会「过期」的是手动拷贝 `const snapshot = count.value`；依赖数组 / 函数式更新 / useEffectEvent / latest ref 在 Vue 里都没有一一对应关系。与 10 题的区别：10 是 `setInterval` 计数器一个案例的三种修法，26 是非 effect 回调、DOM 监听、轮询参数等更普遍的现象 + cleanup 的后果 + 官方原语。工业界现状：过期闭包是 React 项目里最常见的一类线上 bug（表现为「偶尔读到旧值」），`exhaustive-deps` 规则 + `useEffectEvent` 是当前的标准防线。

**27 异步竞态、取消与过期响应** —— 用确定性延迟（`a` 1100ms、`an` 800ms、`ang` 500ms、`angf` 200ms）让「先发的慢请求后返回」稳定复现：一键「自动演示：依次输入 a → an → ang → angf」，一个输入框同时驱动三个面板并排比较。`BrokenSearch`（无 cleanup：#1「a」最后返回，覆盖了「angf」的结果，列表变成 6 人并高亮「当前关键词 angf ／ 列表来自请求「a」」）；`IgnoreFlagSearch`（`let ignore = false`，cleanup 置 true，响应仍回来但被丢弃并记日志——官方文档模式，适用于接口不支持取消的场景）；`AbortSearch`（每轮 effect 新建 `AbortController`，`signal` 传给 `fetchUsers`，cleanup 里 `abort()`，`isAbortError` 分流后记「已取消」而不是当错误展示）。每个面板都有 idle / loading / success / error / empty 五态，`zzz` 看空态，勾选「模拟请求失败」看错误与重试。Vue 侧一个 `keyword` ref + 三个 `watch(keyword, …)`：`onCleanup` 就是 effect cleanup 的一一对应，watch 默认懒执行恰好对应 idle。与 10 / 11 题的区别：10 只顺带展示 abort 修法，11 讲请求状态建模，27 把竞态本身可视化（可复现的乱序、三种策略并排、过期响应语义）。工业界现状：TanStack Query 的 `queryFn({ signal })` 把这一整套自动化了（30 题）；但面试几乎必问「如何处理请求竞态」，ignore 标志和 AbortController 两种手写答案都要会。

**28 React + TypeScript 基础** —— 02 题讲了 props 接口、默认值、`ComponentPropsWithoutRef` + rest，本题补齐其余工具箱：`useState('')` 能推断、`useState<StatusFilter>('all')` 必须显式泛型（否则拓宽成 `string`）、`useState<Order[]>(…)`（裸 `useState([])` 是 `never[]`）、`useState<string | null>(null)`；`ChangeEvent<HTMLInputElement | HTMLSelectElement>`、`FormEvent<HTMLFormElement>`、`MouseEvent` 要起别名以免遮蔽 DOM 全局类型，内联 `onChange={e => …}` 可推断；callback props `onSelect?: (id, e) => void`、`footer?: ReactNode` 插槽、`children?`；字符串联合 `OrderStatus | 'all'` + `as const satisfies` + 类型守卫代替 `as` 断言；`Record<OrderStatus, string>`、`catch (err: unknown)`，永不 `e: any`。Vue 侧对照 `defineProps<Props>()` + `withDefaults`、`defineEmits<{ submit: [filter: OrderFilter]; reset: [] }>()`、`ref<StatusFilter>('all')`（同样的拓宽问题）；模板 `@input` 拿到原生 `Event`，必须 `(e.target as HTMLInputElement).value`——这正是 `v-model` 替你省掉的；`ReactNode` 是值类型、slot 是模板机制，没有一一对应关系。工业界现状：新的 React 项目几乎 100% 是 TS；TS 不是 React 独有，但 React 里 JSX / 事件 / props 都是普通值，所以比 Vue 模板更频繁地需要你亲手建模类型。

**29 useReducer 与判别联合 Action** —— 购物车的添加 / 删除 / 改数量 / 清空全部收敛为组件外的纯函数 `cartReducer(state, action)`；`Action` 是 `add / remove / changeQuantity / clear` 四种形状的判别联合，`switch` 的 `default` 用 `const exhaustive: never = action` 做穷尽检查，漏掉一种 Action 编译期就报错；业务规则（数量 < 1 视为移除）集中在 reducer 里。页面有 action 日志面板（每条 dispatch 的 JSON）、「撤销上一步」（清空 + 重放剩余 action，同一事件内批处理成一次渲染——24 题）、以及一行「重放 N 条 action 得到的购物车与当前一致 ✓」——纯函数带来的日志 / 撤销 / 重放 / 可单测都是免费的。注释里明确：什么时候 `useState` 就够、setter 分散在各处的信号、`dispatch` 引用稳定、StrictMode 会调用 reducer 两次所以必须纯、联合类型优于 `{ type: string; payload?: unknown }`。Vue 侧同一个 `Action` 类型 + `reactive` + 类型化 `apply(items, action)`（原地修改，Vue 风格）：useReducer 没有内置对应，日常写 `addItem()` 或 Pinia action，纯 reducer 风格也能用。与 03 题区块二的区别：03 讲「为什么从 useState 升级」，29 是列表上的完整模式。工业界现状：useReducer + Context 是「不装状态库」时的标准组合，Redux Toolkit 的 slice 本质就是这套 reducer + Action 模式，学会它读 Redux 代码零障碍。

**30 TanStack Query 与服务端状态** —— `useQuery({ queryKey: ['orders', status], queryFn })` 取订单列表：切筛选再切回，`staleTime` 5 秒内直接出缓存不发请求；`isPending` / `isError` + 重试 / 空态 / `refetch`，头部「数据更新于 …」与「后台刷新中…」（`isFetching && !isPending`）；`useMutation` 把订单标记为已支付，`onSuccess` 里 `invalidateQueries({ queryKey: ['orders'] })` 前缀匹配所有筛选下的缓存并自动重取；可选的 `OrdersCountBadge` 用同一个 key 再 `useQuery`，只发一次请求（去重 / 共享缓存）。`status` 下拉与选中高亮是**本地 UI state**，与服务端状态并排对比。它**不是 React 核心 API**：`queryFn` 的 `signal` 就是 27 题手工取消的自动版；Zustand / Pinia / Context 管客户端状态、不管服务端缓存；`useState` 不等于服务端状态管理；不要把 loading / error / 缓存全部手写成一堆本地 state（对照 11 / 22 题的手写状态机）。本项目里每次挂载各建一个 `QueryClient`——React 在示例内 `useState(() => new QueryClient())`，Vue 通过注册表的 `vuePlugins` 工厂安装 `VueQueryPlugin`——真实应用在 `main.ts(x)` 里只建一次，原因见附录。Vue 侧 API 几乎逐字相同，`queryKey` 里放 ref 会被自动解包并监听。工业界现状：TanStack Query 是 React 生态服务端数据的事实标准，Vue 侧同一个库同样可用；生产默认 `retry: 3` + 指数退避、devtools 常驻，本题为了教学把 retry 关掉了。

## React 和 Vue 最重要的 11 个思维差异

1. **不可变 vs 可变。** React 的 state 是普通 JS 值，没有 Proxy 包装，React 察觉不到你的修改——它得知变化的唯一途径是你调用 setter 并传入**新引用**（`Object.is` 对比）。Vue 拦截读写（`reactive` 用 Proxy，`ref` 用 `.value` 的 getter / setter），直接 `item.quantity++` 就能触发读过它的组件重新渲染。这是两个框架一切差异的源头。

2. **重新执行整个组件函数 vs 精准依赖追踪。** React 更新的最小单位是「组件函数整体重跑」：setState 后整个函数从头执行，产出新 JSX 再 diff。Vue 的 setup 只跑一次，之后靠依赖追踪只重跑真正依赖了变化数据的渲染副作用。理解「我写的每一行组件代码每次渲染都会重新执行」之后，闭包快照、useMemo、useCallback 的存在理由全都顺理成章（23 题用可点的实验证明）。

3. **JSX 即 JavaScript vs 模板 DSL。** JSX 没有指令、没有修饰符、没有模板专属语法——条件是三元、循环是 `.map()`、插值是 `{}`。表达能力上不封顶（JSX 是值，可以存变量、传参数、从函数返回），代价是失去了模板静态分析带来的编译期优化，性能默认值不如 Vue，需要理解重渲染机制来兜底。

4. **useEffect 的同步模型 vs 生命周期钩子。** Vue 给你 onMounted / onUnmounted / watch 一排按时机命名的 API；React 只有一个 useEffect，思维模型是「声明组件如何与外部系统保持同步、如何清理」，执行时机由依赖数组决定。`useEffect(fn, [])` 行为像 onMounted，但那是「依赖为空所以永不重跑」的推论，不是生命周期钩子——带着钩子思维用 effect 是大部分 effect bug 的来源。

5. **手动 memo vs 自动缓存。** Vue 的 computed 自动缓存、模板编译期做静态提升，性能优化基本免费。React 里派生值默认「每次渲染重算」，缓存（useMemo/useCallback/memo）是需要你手动做且要权衡成本的显式优化——而 React Compiler 的出现恰恰证明了这件事该交给工具。

6. **显式受控 vs v-model 语法糖。** React 拒绝双向绑定：表单值从 state 来（value），变化通过事件写回 state（onChange），两条线都摆在明面上。啰嗦，但数据流向一眼可查；Vue 的 v-model 是同一模式的语法糖，糖衣下也是 :value + @input。

7. **组合优先 vs 插槽系统。** Vue 用 slot 这一专门机制解决内容分发；React 里 JSX 是一等公民的值，「插槽」退化成普通 props（children 也只是个特殊 prop），作用域插槽退化成「传一个函数」（render props）。没有新概念要学，全是函数与值的组合——这也是 React 组件库 API 设计的通用风格。

8. **Hooks 规则的由来。** React 不靠变量名、也不靠 Proxy 识别状态，而是靠**调用顺序**：每次渲染时第 N 个 useState 调用对应内部链表的第 N 个状态槽。所以 hook 不能写进条件/循环——否则顺序错位、状态张冠李戴。Vue 的 composable 在 setup 里只执行一次、响应式数据自带身份，没有这条限制。

9. **快照式闭包 vs 永远新鲜的引用。** React 每次渲染的 props/state 是那一帧的「快照」，事件处理器和 effect 闭包捕获的都是当时的值——异步回调里读到旧值（过期闭包）是 React 特有的经典 bug。Vue 的 `xxx.value` 永远指向响应式对象本身，不存在这个问题。这就是「函数式更新 `setX(prev => ...)`」存在的原因（23/24/26 题）。

10. **状态与视图的关系：UI = f(state)。** React 把 UI 彻底当成状态的纯函数：不改 DOM、不改 state，只描述「给定状态该长什么样」，一切变化都通过换状态触发重算。Vue 也讲声明式，但它的响应式系统允许「命令式地改数据」；React 则把命令式彻底赶到边缘（effect / ref），核心渲染路径保持纯函数。适应了这一点，React 代码的可预测性就成了肌肉记忆。

11. **服务端状态 vs 客户端状态。** Pinia 用户的习惯是把接口拿回来的数据也塞进 store，再手写 loading / error / 缓存 / 刷新。React 生态把这两类状态分开：服务端状态（来自接口、随时可能过期、别人也能改）交给 TanStack Query——缓存、失效、重取、去重、竞态取消开箱即用；store（Zustand / Context）只保留真正的客户端状态（当前用户、主题、购物车草稿、筛选条件）。分清这两类状态，React 项目里的 state 会少一大半（30 题）。

## 推荐学习顺序

**不要按 01 → 30 的编号顺序学。** 编号只是目录的历史顺序（最初的 22 题 + 后来补齐的 8 题），不代表理解难度。下面是按理解难度排的推荐顺序，首页展示的也是同一条路径（点击即可跳到对应题目）：

| 阶段 | 顺序 | 这一段在建立什么 |
| --- | --- | --- |
| 一、建立模型 | 23 → 28 → 01 → 02 → 03 → 24 → 04 → 05 → 06 → 21 | 先看清「组件函数重跑、state 是快照」，再学 JSX / props / state / 事件 / 条件 / 列表，并立刻把不可变更新练成手感 |
| 二、数据流 | 09 → 07 → 08 → 25 | 派生值、受控表单、父子通信、state 归属——React 的单向数据流 |
| 三、副作用与异步 | 10 → 26 → 11 → 27 | useEffect 的同步模型、过期闭包、请求状态、竞态与取消 |
| 四、复用与状态管理 | 12 → 14 → 29 → 15 → 16 → 18 → 30 | ref、自定义 Hook、useReducer、Context、Zustand、路由、服务端状态 |
| 五、工程模式与综合 | 19 → 17 → 20 → 13 → 22 | 异步提交、memo、错误边界、组合模式，最后用综合题自测 |

**为什么是这个顺序：**

- **目录编号是历史，不是难度。** 前 22 题是项目最初的四阶段，23–30 是后来补齐的第五阶段——但第五阶段里有好几题恰恰是最基础的。
- **23 / 24 / 26 讲的是渲染模型本身**：「组件函数每次渲染重跑、state 是快照、更新会排队、闭包会过期」。03 / 09 / 10 里所有「反直觉」的现象（连点两次只加 1、不需要 computed、定时器停在 1）都是它的推论，所以它们紧挨着 03 / 09 / 10 学：23 打头建立模型，24 紧跟 03，26 紧跟 10。
- **28 放在最前**，因为本项目的所有示例都是 TypeScript：`useState<T>`、`ChangeEvent<HTMLInputElement>`、`ReactNode` 这些从 01 题起就会出现，先扫一遍类型工具箱，后面读代码不会被类型标注绊住。
- **21 提前到 07 前面**：表单的每一次 `onChange` 都是「不可变地更新一个对象」，这是每天都要写的东西，03 学完就该练熟，不该拖到第四阶段。
- **13 / 17 / 20 靠后**：children 组合、memo 优化、错误边界是「模式」而不是「机制」，不理解渲染模型就看不出它们解决了什么；放到后面反而一遍就懂。
- **22 永远最后**，当成自测。

两处允许的偏离：TS 熟练的读者可以略过 28（遇到不认识的类型再回来查）；slot 重度用户可以把 13 提前到 08 之后——它对 Vue 开发者其实不难。

其中 **23、03、24、09、10、26、21 是思维转换的关键节点**，值得放慢速度：

- **23 渲染模型与 state 快照**：整个 React 心智模型的地基，后面每一题的「为什么」都回到这里；
- **03 State 与 useState**：不可变更新 + 显式 setter，Vue 习惯迁移的第一道墙；
- **24 State batching 与函数式更新**：更新会排队、同一事件只渲染一次，「什么时候必须函数式更新」；
- **09 派生状态**：戒掉「什么都要 computed」的反射，接受「渲染时直接算」；
- **10 useEffect**：从「生命周期钩子」切换到「声明式同步」的心智模型；
- **26 过期闭包**：每次渲染都是新闭包——React 特有 bug 的根源与全部修法；
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

11. **`setX` 后立刻读 `x`，以为已经更新。**
    错误：`setCount(count + 1); console.log(count)`——打印的还是旧值；`setCount(count + 1)` 连写两次也只加 1。
    正确：state 是本次渲染的快照，setter 只是「排队一次更新」，下一次渲染才读得到新值。「由旧算新」用函数式更新 `setCount(c => c + 1)`；同一事件里要用新值，就先算出来存进局部变量（23 / 24 题）。

12. **兄弟组件各存一份相同的 state，再互相「同步」。**
    错误：搜索框和列表各自 `useState(keyword)`，再用 `useEffect` 把一边抄到另一边——两份真相源，迟早不一致。
    正确：把 state 提升到最近的公共父组件，子组件通过 props 读、通过 callback props 改，全程只有一份（25 题）。

13. **把接口数据塞进 Zustand / Context，再手写 loading / error / 缓存。**
    错误：Pinia 习惯——`fetchOrders()` 的结果存进 store，配上 `loading`、`error`、`lastFetched` 一堆字段，每个页面都手写一遍刷新与失效逻辑。
    正确：服务端状态交给 TanStack Query（`useQuery` / `useMutation` + `invalidateQueries`），store 只放真正的客户端状态（30 题）。

14. **用 `any` 绕过事件 / Props 类型。**
    错误：`onChange={(e: any) => setName(e.target.value)}`、`props: any`——类型检查形同虚设，重构时改漏了也没人报错。
    正确：`ChangeEvent<HTMLInputElement>`、`FormEvent<HTMLFormElement>`、`interface Props { … }`、`useState<T>` 显式泛型；不认识的值用 `unknown` + 类型守卫收窄（28 题）。

## 每个知识点对应的面试高频问题

| 题号 | 面试问题 |
| --- | --- |
| 01 | JSX 是什么？它最终被编译成什么？函数组件和 class 组件有什么区别，为什么现在都用函数组件？ |
| 02 | props 为什么是只读的？如何用 TypeScript 给组件的 props 定义类型和默认值？如何让自定义组件支持 `disabled`、`aria-*` 等全部原生属性（对比 Vue 的 `$attrs` 自动透传）？ |
| 03 | setState 之后发生了什么？为什么直接修改 state 不会触发更新？`setCount(count+1)` 连写两次为什么只加 1？什么时候该从 useState 升级到 useReducer？ |
| 04 | React 的合成事件（SyntheticEvent）是什么？`onClick={fn()}` 和 `onClick={fn}` 有什么区别？ |
| 05 | `condition && <Component/>` 有什么陷阱？条件渲染 null / false 时组件会发生什么？ |
| 06 | key 的作用是什么？为什么不能用 index 作 key？key 变化时组件会发生什么（卸载旧 Fiber、state 与 effect 全部丢弃）？如何用 key 重置子组件状态？ |
| 07 | 受控组件和非受控组件的区别是什么？各适用什么场景？`value` 不配 `onChange`、初始值给 `undefined` 分别会怎样？`onChange` 和原生 `change` 一样吗？`useId` 为什么不用自增计数器？为什么 react-hook-form 性能好？ |
| 08 | React 的父子组件如何通信？什么是状态提升？为什么 React 强调单向数据流？（状态提升的完整讨论见 25 题） |
| 09 | 什么是派生状态？为什么「用 useEffect 同步一份派生 state」是反模式？ |
| 10 | useEffect 的依赖数组三种写法各是什么行为？cleanup 什么时候执行？如何解决请求竞态？为什么 StrictMode 下 effect 执行两次？`setInterval` 配空依赖数组为什么计数永远停在 1，有哪几种修法？ |
| 11 | 一个完整的数据请求要处理哪些状态？为什么不用三个布尔？官方为什么不推荐在 Effect 里取数、替代方案各解决什么？`fetch` 拿到 404 会进 catch 吗？TanStack Query 的 `status` 和 `fetchStatus` 有什么区别？ |
| 12 | useRef 和 useState 的区别？修改 ref.current 为什么不触发重渲染？useRef 有哪些典型用途？ |
| 13 | children 是什么？什么是 render props？React 如何实现 Vue 作用域插槽的效果？ |
| 14 | 自定义 Hook 和普通函数有什么区别？Hooks 为什么不能写在条件/循环里（Hooks 规则的原理）？手写一个防抖 Hook（定时器 id 为什么不能用普通变量存？卸载时为什么要 clearTimeout？防抖和节流的区别）。 |
| 15 | Context 解决什么问题？Context value 变化时哪些组件会重渲染，如何优化？ |
| 16 | Zustand / Redux / Context 如何选型？Zustand 的 selector 起什么作用？什么状态应该放全局、什么放局部？ |
| 17 | useMemo 和 useCallback 分别缓存什么？什么时候该用、什么时候是负优化？React.memo 和它们如何配合？ |
| 18 | React Router 三种模式怎么选？登录守卫用 loader 还是 middleware，各有什么坑？RequireAuth 为什么要三态？路由参数变化时 state 会不会重置？`setSearchParams` 为什么会丢参数？v6 → v7 → v8 的导入路径怎么变？ |
| 19 | 如何防止表单重复提交？只靠 `disabled` 为什么不够、为什么还要 `useRef` 锁？提交出错该 throw 给错误边界还是放进 state？React 19 的 `useActionState` / `useFormStatus` 解决了什么问题，重复提交会怎样？ |
| 20 | Error Boundary 能捕获哪些错误、不能捕获哪些（事件/异步/自身）？为什么它必须是 class 组件？ |
| 21 | 为什么 React 要求不可变更新？如何不可变地更新深层嵌套对象？Immer 的原理是什么？ |
| 22 | （综合题）如何设计一个列表页的状态结构？搜索/筛选/分页状态如何组织？防抖放在哪一层？ |
| 23 | React 组件函数什么时候执行？「state 是快照」是什么意思？事件处理函数里 setCount 之后立刻 console.log(count) 打印什么？UI = f(props, state) 怎么理解？和 Vue 的响应式依赖追踪有什么本质区别？ |
| 24 | setCount(count + 1) 连写两次为什么只加 1，setCount(c => c + 1) 为什么加 2？什么是自动批处理，React 18 前后有什么变化？updater 函数依次拿到的是什么？什么时候必须用函数式更新？flushSync 和 Vue 的 nextTick 有何不同？ |
| 25 | 状态应该放在哪个组件？什么是状态提升，为什么两个兄弟组件不能各存一份？什么时候不该提升、什么时候才该进全局 store？React 的单向数据流指什么？ |
| 26 | 什么是过期闭包？setTimeout / 事件监听器 / 轮询里读到的 state 为什么是旧的？依赖数组如何影响闭包？函数式更新、加进依赖、latest ref / useEffectEvent 各适用什么场景？cleanup 为什么不可省？Vue 为什么没有这个问题？ |
| 27 | 什么是请求竞态？如何用 AbortController 在 cleanup 里取消？接口不支持取消时如何丢弃过期响应？AbortError 该当错误展示吗？TanStack Query 如何自动处理？ |
| 28 | 如何给 props / 可选属性 / callback props 定义类型？useState 什么时候需要显式泛型？ChangeEvent / FormEvent / MouseEvent 怎么用？ReactNode 和 ReactElement 的区别？为什么不该用 any？对比 defineProps / defineEmits 的泛型写法。 |
| 29 | useState 和 useReducer 怎么选？reducer 为什么必须是纯函数？判别联合 Action 带来什么安全性（never 穷尽检查）？dispatch 的引用稳定吗？useReducer + Context 能替代 Redux 吗？Vue 里如何实现类似模式？ |
| 30 | 服务端状态和客户端状态有什么区别？query key 起什么作用？staleTime 和 gcTime 的区别？mutation 成功后为什么要 invalidateQueries？TanStack Query 与 Zustand / Pinia / Context 各解决什么？为什么不用 useState + useEffect 手写？ |

## 当前完成状态

**已完成**

- 30 个知识点全部就位，每题都有 `react/Example.tsx` 与 `vue/Example.vue`，头注释四段齐全、两侧互相对应，可在壳应用里并排运行。
- 壳应用：侧栏按编号分五阶段；首页展示推荐学习顺序；每题页面内可查看该题目录下全部文件的源码；Vue 插件工厂（18 题 vue-router、30 题 VueQueryPlugin）。
- 共享层：类型、模拟 API（支持 `signal` / `failRate` / `delayMs`）、25 / 29 题共用的商品目录。
- lint / typecheck / build：见下节验证结果。

**部分完成**

- 30 题只演示 `useQuery` / `useMutation` / `invalidateQueries` 的核心流程，没有接入 TanStack Query devtools，也没有演示 persist（缓存持久化）。
- 19 题只在注释里提到 React 19 的 `useActionState`，实现仍是手写 `submitting` 的基础写法，没有实现 form actions。
- 17 题提到的 React Compiler 没有在本项目启用，手动 `useMemo` / `useCallback` 仍是教学重点。

**待完善**

- 测试基建已接入（2026-09-17），但目前只有 `src/test/` 下的工具链冒烟测试；各题关键结论的测试还没写，也没有端到端测试，各题行为仍靠逐题浏览器手测（见下节）。
- 没有 Suspense / `use()` 数据加载专题（30 题刻意不用 `useSuspenseQuery`，避免壳应用的 Suspense / ErrorBoundary 接管整个面板）。
- 没有 SSR / 框架模式（Next.js、React Router 框架模式的 loader / action）内容。

## 验证命令与已知缺口

| 命令 | 作用 | 结果 |
| --- | --- | --- |
| `npm run lint` | `eslint . --max-warnings=0`：react-hooks 官方 recommended 预设 + vue 插件规则，警告也视为失败 | 通过（0 错误、0 警告，2026-09-17）。切换预设时已有的命中（8 道题共 13 处）记在根目录 `eslint-suppressions.json`，随各题改写逐处修复 |
| `npm run typecheck` | `vue-tsc --noEmit`，同时检查 .tsx、.vue 与测试文件 | 通过（0 错误，2026-09-17） |
| `npm test` | `vitest run`（jsdom） | 通过（2 个文件 6 条冒烟测试，2026-09-17） |
| `npm run build` | typecheck + vite build | 通过（vite build 约 6 秒，产物在 `dist/`，2026-09-17） |
| `npm run check` | lint + typecheck + test + build | 通过（2026-09-17） |
| `npm ls @tanstack/query-core` | 确认 react-query 与 vue-query 共用同一份 query-core | 通过（两个包都解析到 `@tanstack/query-core@5.102.8`，第二份显示 deduped，2026-09-17） |

测试目前只覆盖工具链本身（React / Vue 两侧各 3 条冒烟测试），各题的行为仍靠逐题浏览器手测验证。

## 附录

### 技术选型说明

**全局状态为什么选 Zustand，而不是 Redux 或 Context + useReducer？**
Zustand 轻量（核心几 KB）、无样板（一个 `create()` 就是 store + Hook，不需要 Provider、action type、dispatch）、且是当前 React 社区新项目的主流选择之一，面试认可度高。对比之下：Redux（即使是 Redux Toolkit）概念多、样板重，适合超大团队的强约束场景，作为入门第一个状态库性价比低；Context + useReducer 无需依赖但样板不少，且 Context 的整体重渲染问题使它不适合高频状态。学会 Zustand 的「store + selector」模型后，迁移到任何方案都容易。

**路由为什么用 React Router v7 的声明式 API？**
v7 的声明式用法（`<Routes>` / `<Route>` / `useParams` / `useNavigate`）与 v6 完全相同——这是存量项目与面试题的绝对主流，学一份经验通吃 v6/v7。v7 新增的框架模式（loader/action、文件路由）属于进阶内容，不影响本项目覆盖的核心路由概念。

**为什么选 TanStack Query，而且两侧都装？**
`@tanstack/react-query` 与 `@tanstack/vue-query` 共用同一个 `@tanstack/query-core`，两侧的 `useQuery` / `useMutation` / `invalidateQueries` API 几乎逐字相同——这恰好证明了本项目想让你记住的一件事：**它不是 React 的核心 API，而是生态里管「服务端状态」的库**，Vue 项目同样可以用。如果 Vue 侧改用 Pinia 手写缓存与失效，30 题就会变成「库 vs 手写」的对比，看不出两个框架在这件事上其实没有差异。选它而不选 SWR / RTK Query / Apollo，是因为它的行业占有率最高，且不绑定 Redux 或 GraphQL。11 题保留了手写请求状态机的版本，读者可以逐项对照库替你管了什么。本项目里两侧都是**每次挂载新建一个 QueryClient**：React 在示例内 `useState(() => new QueryClient())` + `<QueryClientProvider>`，Vue 通过注册表的 `vuePlugins` 工厂每次 `createTopic30QueryPlugin()` 安装 `VueQueryPlugin`——原因是壳应用在 StrictMode 下会把示例挂载两次、切题时又完整卸载重挂，一个插件实例不能跨两个 `createApp` 共用；真实应用在 `main.ts(x)` 里只建一个 client、全局唯一缓存。

### 一个 Vite 应用如何同时跑 React 和 Vue？

本项目是**一个 React 应用**（壳应用、路由、页面布局全是 React），在 `vite.config` 里同时启用 `@vitejs/plugin-react` 和 `@vitejs/plugin-vue`，因此 `.tsx` 与 `.vue` 可以共存编译。

Vue 示例通过桥接组件 `src/bridge/VueMount.tsx` 挂进 React 组件树：

- React 渲染一个由它拥有的空 `div`，在 `useEffect` 里调用 Vue 的 `createApp(component).mount(div)`，把 Vue 示例作为一个**独立的 Vue 应用实例**挂载进去；
- cleanup 时调用 `app.unmount()` 完整销毁，保证切换知识点时 Vue 侧的状态、定时器、插件都被干净回收；
- 需要 Vue 插件的题目（如 18 题的 vue-router）通过 `topicRegistry.ts` 里该题的 `vuePlugins` 工厂函数**每次挂载新建插件实例**（router 实例不能跨两个 createApp 复用），并用 memory history 避免与壳应用的地址栏路由冲突；
- 30 题的 Vue Query 同理：`vue/queryPlugin.ts` 导出 `createTopic30QueryPlugin()` 工厂，每次挂载新建 `QueryClient` 并 `app.use(VueQueryPlugin, { queryClient })`；`VueMount` 调用 `app.use(plugin)` 时不传 options，所以配置包在工厂返回的插件里，卸载由 VueQueryPlugin 自己在 `app.onUnmount` 完成；
- 18 题的 **React 示例**同样被挂进一棵独立的 React 树（`src/bridge/ReactIsolatedMount.tsx`）：React Router 规定一棵组件树里只能有一个 `<Router>`，示例内部的 RouterProvider（以及并排演示里的 MemoryRouter）必须脱离壳应用 BrowserRouter 的上下文。

两侧示例共用 `src/shared/` 下的同一套类型与模拟 API，保证并排运行时行为一致——这个桥接是项目基础设施，本身不属于 30 个知识点。

---

祝学习顺利。记住本项目的使用方式：**跑起来、并排看、读注释、动手改。**
