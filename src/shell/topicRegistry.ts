/**
 * 30 个知识点的注册表（壳应用基础设施）。
 * 通过 import.meta.glob 懒加载每个知识点的 React / Vue 示例及其源码文本，
 * 某个示例文件还不存在时页面会显示占位提示，而不是整个应用崩溃。
 */
import type { ComponentType } from 'react'
import type { Component as VueComponent, Plugin as VuePlugin } from 'vue'

export interface TopicEntry {
  slug: string
  title: string
  summary: string
  /** 挂载该题 Vue 示例时需要额外安装的 Vue 插件（工厂函数，每次挂载新建实例） */
  vuePlugins?: () => VuePlugin[] | Promise<VuePlugin[]>
  /**
   * 该题的 React 示例需要挂进独立的 React 树。
   * 目前只有 18 题：React Router 不允许一棵树里嵌套两个 Router，
   * 示例内部的 RouterProvider（以及并排演示里的 MemoryRouter）必须脱离壳应用的 BrowserRouter 上下文。
   */
  isolateReactRoot?: boolean
}

export interface TopicPhase {
  label: string
  /** 仅首页展示的一句说明（例如提醒某阶段应穿插学习而不是留到最后） */
  note?: string
  topics: TopicEntry[]
}

export const PHASES: TopicPhase[] = [
  {
    label: '第一阶段：React 基础',
    topics: [
      {
        slug: '01-component-and-jsx',
        title: '组件与 JSX',
        summary: '函数组件 + JSX：React 里「一切都是 JavaScript」，对照 Vue 的 SFC 与模板语法。',
      },
      {
        slug: '02-props',
        title: 'Props',
        summary: '用 TypeScript 类型声明 props、默认值写法、「props 只读」约定，以及继承原生元素属性 + rest 透传。',
      },
      {
        slug: '03-state',
        title: 'State 与 useState',
        summary: 'useState 的读与写、不可变更新、渲染快照与函数式更新，以及多状态收敛到 useReducer。',
      },
      {
        slug: '04-events',
        title: '事件处理',
        summary: 'onClick 与事件对象、处理函数的定义与传参，对照 @click 与 $event。',
      },
      {
        slug: '05-conditional-rendering',
        title: '条件渲染',
        summary: '三元表达式与 && 的用法及陷阱（误渲染 0），对照 v-if / v-else-if。',
      },
      {
        slug: '06-list-and-key',
        title: '列表渲染与 key',
        summary: '.map() 渲染列表、key 为什么必须稳定唯一、index 作 key 的坑，以及用 key 强制重置组件状态。',
      },
    ],
  },
  {
    label: '第二阶段：表单和数据流',
    topics: [
      {
        slug: '07-forms',
        title: '表单与受控组件',
        summary: '受控（value + onChange）与非受控（defaultValue + FormData）两条主线、useId 与无障碍关联、onChange 的触发时机，对照 v-model / defineModel。',
      },
      {
        slug: '08-parent-child-communication',
        title: '父子组件通信',
        summary: 'callback props 让子组件通知父组件、单向数据流，对照 emit。',
      },
      {
        slug: '09-derived-state',
        title: '派生状态',
        summary: '渲染时直接计算派生值、什么时候才需要 useMemo，对照 computed。',
      },
      {
        slug: '10-effects-and-lifecycle',
        title: 'useEffect 与生命周期',
        summary: '依赖数组、cleanup、AbortController、定时器与过期闭包；useEffect 不是 onMounted 的替代品。',
      },
      {
        slug: '11-api-request-state',
        title: 'API 请求状态',
        summary: 'Effect 手写请求：判别联合建模、派生 pending、取消与竞态、重试、保留旧数据；另附四种取数方案速查。',
      },
    ],
  },
  {
    label: '第三阶段：组件复用和常见 Hooks',
    topics: [
      {
        slug: '12-dom-ref',
        title: 'useRef 与 DOM',
        summary: 'DOM ref、用 ref 保存可变值；修改 ref 为什么不触发重新渲染，对照 template ref。',
      },
      {
        slug: '13-slots-and-children',
        title: 'children 与组件组合',
        summary: 'children、具名 props 传 JSX、render props，对照 slot / 具名 slot。',
      },
      {
        slug: '14-composable-and-custom-hook',
        title: '自定义 Hook',
        summary: '状态逻辑复用、手写防抖 Hook、Hooks 规则（不能放进条件/循环），对照 composable。',
      },
      {
        slug: '15-context',
        title: 'Context 跨层传值',
        summary: 'createContext / useContext 解决什么问题、可能引发的重渲染，对照 provide/inject。',
      },
      {
        slug: '16-global-state',
        title: '全局状态（Zustand）',
        summary: 'Zustand store 与组件局部状态的取舍，对照 Pinia。',
      },
      {
        slug: '17-performance-hooks',
        title: 'useMemo 与 useCallback',
        summary: 'memoization 什么时候有价值、为什么不能无脑用，对照 Vue 的 computed 缓存。',
      },
    ],
  },
  {
    label: '第四阶段：实际开发常见模式',
    topics: [
      {
        slug: '18-routing',
        title: '路由（React Router）',
        summary: 'Data 模式主线（loader / action / middleware 守卫）与声明式 RequireAuth 并排；参数、query、嵌套路由、导航，对照 Vue Router。',
        isolateReactRoot: true,
        vuePlugins: async () => {
          // 懒加载 18 题的 vue-router 配置（memory history，避免与壳应用的地址栏路由冲突）
          const { createTopic18Router } = await import('../topics/18-routing/vue/router')
          return [createTopic18Router()]
        },
      },
      {
        slug: '19-async-submit',
        title: '异步提交与防重复',
        summary: '手写 submitting（disabled + state 守卫 + useRef 锁）、错误分层与重试，并排 React 19 的 useActionState / useFormStatus。',
      },
      {
        slug: '20-error-handling',
        title: '错误边界',
        summary: 'Error Boundary（唯一的 class 组件场景）能捕获什么、不能捕获什么，对照 errorCaptured。',
      },
      {
        slug: '21-immutable-update',
        title: '不可变数据更新',
        summary: '展开、map、filter、嵌套更新；引用变化对 React 为什么至关重要。',
      },
      {
        slug: '22-integrated-order-page',
        title: '综合：订单管理页',
        summary: '搜索 + 筛选 + 分页 + 编辑 + 删除 + 各种请求状态，综合前面所有知识点。',
      },
    ],
  },
  {
    label: '第五阶段：React 核心机制与进阶模式',
    note: '这 8 题与前四阶段同等重要（渲染模型、批处理、状态归属、过期闭包、竞态、TypeScript、useReducer、服务端状态），建议按上方的推荐顺序穿插学习，不要留到最后。',
    topics: [
      {
        slug: '23-rendering-and-state-snapshot',
        title: '渲染模型与 state 快照',
        summary:
          '组件函数每次渲染都重新执行，state / props 是本次渲染的快照，setter 不改当前闭包里的值；UI = f(props, state)，对照 Vue 的响应式依赖追踪。',
      },
      {
        slug: '24-batching-and-functional-updates',
        title: 'State batching 与函数式更新',
        summary:
          '同一事件里 setCount(count + 1) 连写两次只加 1、setCount(c => c + 1) 才加 2：更新队列、自动批处理与 flushSync，对照 Vue 的异步 DOM 刷新与 nextTick。',
      },
      {
        slug: '25-state-ownership-and-lifting',
        title: '状态提升与 state 归属',
        summary:
          '兄弟组件共享搜索 / 分类筛选时把 state 提升到最近的共同父组件；谁拥有 state、何时留在子组件、何时才上全局 store，对照 props + emit。',
      },
      {
        slug: '26-stale-closures',
        title: '过期闭包（stale closure）',
        summary:
          '延迟回调、手动事件监听、轮询读到旧 state 的坏例子与修法（函数式更新、依赖数组、latest ref / useEffectEvent、cleanup），对照 Vue 永远新鲜的 .value。',
      },
      {
        slug: '27-async-race-and-cancellation',
        title: '异步竞态、取消与过期响应',
        summary:
          '快速改关键词时先发的慢请求后返回并覆盖新结果：坏版本可复现，ignore 标志 vs AbortController、cleanup 里取消，以及 loading / error / empty 的处理。',
      },
      {
        slug: '28-react-typescript-basics',
        title: 'React + TypeScript 基础',
        summary:
          'Props / 可选属性 / 字符串联合 / useState 泛型 / 事件类型 / callback props / ReactNode 的类型建模，对照 defineProps / defineEmits / ref<T>。',
      },
      {
        slug: '29-use-reducer-and-action-types',
        title: 'useReducer 与判别联合 Action',
        summary:
          '购物车的添加 / 删除 / 改数量 / 清空收敛为纯函数 reducer + 判别联合 Action；什么时候 useState 就够，对照 Vue 的 reactive + 类型化 action 函数。',
      },
      {
        slug: '30-tanstack-query-server-state',
        title: 'TanStack Query 与服务端状态',
        summary:
          'TanStack Query v5：queryKey 与缓存、status × fetchStatus、mutation 与失效、两种乐观更新、分页 / 依赖查询、useSuspenseQuery；服务端状态不等于客户端状态，react-query 与 vue-query 共用 query-core。',
        vuePlugins: async () => {
          // 懒加载 30 题的 Vue Query 插件（每次挂载新建 QueryClient，与 React 侧 useState(() => new QueryClient()) 对称）
          const { createTopic30QueryPlugin } = await import('../topics/30-tanstack-query-server-state/vue/queryPlugin')
          return [createTopic30QueryPlugin()]
        },
      },
    ],
  },
]

export const ALL_TOPICS: TopicEntry[] = PHASES.flatMap((p) => p.topics)

export function findTopic(slug: string): TopicEntry | undefined {
  return ALL_TOPICS.find((t) => t.slug === slug)
}

/**
 * 推荐学习顺序（按理解难度排列，不按目录编号）。首页展示；理由见 README「推荐学习顺序」。
 * 目录编号只反映文件顺序：23 / 24 / 26 讲的是渲染模型本身，紧挨着 03 / 09 / 10 学最合适；
 * 28 放在最前，因为所有示例都是 TypeScript。
 */
export const RECOMMENDED_ORDER: readonly string[] = [
  '23', '28', '01', '02', '03', '24', '04', '05', '06', '21',
  '09', '07', '08', '25',
  '10', '26', '11', '27',
  '12', '14', '29', '15', '16', '18', '30',
  '19', '17', '20', '13', '22',
]

/** 按推荐顺序排好的知识点；题号写错时只在控制台报错并跳过，绝不让壳应用白屏 */
export const RECOMMENDED_TOPICS: TopicEntry[] = RECOMMENDED_ORDER.flatMap((num) => {
  const topic = ALL_TOPICS.find((t) => t.slug.startsWith(`${num}-`))
  if (!topic) {
    console.error(`[topicRegistry] RECOMMENDED_ORDER 里的题号不存在：${num}`)
    return []
  }
  return [topic]
})

if (new Set(RECOMMENDED_ORDER).size !== ALL_TOPICS.length) {
  console.error('[topicRegistry] RECOMMENDED_ORDER 应恰好覆盖全部知识点各一次，请检查')
}

const reactModules = import.meta.glob<{ default: ComponentType }>(
  '../topics/*/react/Example.tsx',
)
const vueModules = import.meta.glob<{ default: VueComponent }>('../topics/*/vue/Example.vue')
// 源码查看器展示每题 react/、vue/ 目录下的全部文件（含测试），不只是两个 Example
const reactSources = import.meta.glob<string>('../topics/*/react/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
})
const vueSources = import.meta.glob<string>('../topics/*/vue/**/*.{ts,vue}', {
  query: '?raw',
  import: 'default',
})

// 显式标注可空返回类型：import.meta.glob 的 Record 索引在 TS 看来「必有值」，
// 但知识点文件可能尚未创建，运行时确实可能取到 undefined。
export function loadReactExample(slug: string): (() => Promise<{ default: ComponentType }>) | null {
  return reactModules[`../topics/${slug}/react/Example.tsx`] ?? null
}

export function loadVueExample(slug: string): (() => Promise<{ default: VueComponent }>) | null {
  return vueModules[`../topics/${slug}/vue/Example.vue`] ?? null
}

export interface SourceFile {
  /** 相对题目目录的路径，例如 react/Example.tsx */
  path: string
  load: () => Promise<string>
}

/** 某题某一侧的全部源码文件：入口 Example 排第一，其余按路径排序 */
function listSources(
  sources: Record<string, () => Promise<string>>,
  slug: string,
  side: 'react' | 'vue',
  entry: string,
): SourceFile[] {
  const prefix = `../topics/${slug}/`
  return Object.entries(sources)
    .filter(([key]) => key.startsWith(`${prefix}${side}/`))
    .map(([key, load]) => ({ path: key.slice(prefix.length), load }))
    .sort((a, b) => {
      if (a.path === entry) return -1
      if (b.path === entry) return 1
      return a.path.localeCompare(b.path)
    })
}

export function listReactSources(slug: string): SourceFile[] {
  return listSources(reactSources, slug, 'react', 'react/Example.tsx')
}

export function listVueSources(slug: string): SourceFile[] {
  return listSources(vueSources, slug, 'vue', 'vue/Example.vue')
}
