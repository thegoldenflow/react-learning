/**
 * 学习主题：React + TypeScript 基础 —— 给 props / state / 事件 / children 建模的常用类型工具箱
 *
 * React 核心概念：
 * - Props 类型：interface XxxProps + 函数参数解构（02 题的基础）；本题在此之上补齐三类常见字段：
 *   callback props 的函数类型（onSubmit: (filter: OrderFilter) => void）、可选回调（onReset?: () => void）、
 *   「插槽型」prop（footer?: ReactNode）
 * - 可选属性：问号 selected?: boolean / minAmount?: number —— 读取时类型是 T | undefined，要么给默认值要么判空
 * - 字符串联合类型：OrderStatus = 'pending' | 'paid' | 'cancelled'（共享类型）；本题扩展为 StatusFilter = OrderStatus | 'all'，
 *   配 Record<StatusFilter, string> 做文案表（漏一个成员编译就报错）；选项数组用 as const + satisfies 既保留字面量又受类型约束；
 *   把 string 收窄成联合类型用「类型守卫」（value is StatusFilter），而不是 as 断言
 * - useState 的类型推断：useState('') 推断 string、useState(0) 推断 number —— 多数时候不用写泛型。
 *   必须显式的三种情况：① 字面量会被拓宽（useState<SortKey>('newest')，不写就是 string）；
 *   ② 初始值是 null（useState<string | null>(null)，不写就只能是 null）；③ 初始值是空数组（useState<Order[]>([])，不写就是 never[]）
 * - React 事件类型：ChangeEvent<HTMLInputElement> / FormEvent<HTMLFormElement> / MouseEvent<HTMLButtonElement>，
 *   泛型参数是「事件挂在哪种 DOM 元素上」，决定了 e.target / e.currentTarget 的类型；
 *   写成内联箭头函数 onChange={e => …} 时 e 由 JSX 上下文推断，抽成独立函数就必须手写参数类型 —— 永远不写 e: any
 * - ReactNode：「一切可渲染之物」（元素 / 字符串 / 数字 / null / 数组…）—— children 与「具名插槽」props 的类型
 * - 数组与对象类型：Order[]、OrderFilter 接口、Record<K, V>、(typeof X)[number] 从常量数组反推联合类型
 * - 避免滥用 any：外部数据（JSON.parse 返回 any）立刻标成 unknown，用类型守卫验证后再用；
 *   catch (err: unknown) 用 instanceof Error 收窄；这两处是业务代码里 any 最常见的两个泄漏口
 *
 * Vue 对应概念：
 * - defineProps<{ … }>() 泛型声明 props；可选 prop 的默认值走 withDefaults（对象 / 数组默认值必须写成工厂函数）
 * - defineEmits<{ submit: [filter: OrderFilter]; reset: [] }>() 用「具名元组」声明事件签名 —— 对应 callback props 的函数类型
 * - ref<T>()：ref('') 推断 string，ref<StatusFilter>('all') 同样需要显式（否则拓宽成 string），ref([]) 同样是 never[]，
 *   ref<string | null>(null) 同样要写 —— 这组推断规则是 TypeScript 本身的行为，两边完全一致
 * - 事件类型：Vue 模板里 @input / @change / @click 拿到的是【原生 DOM 事件】（Event / MouseEvent），
 *   e.target 是 EventTarget | null，取 value 必须 (e.target as HTMLInputElement).value 或 instanceof 收窄 ——
 *   这正是 v-model 帮你省掉的那一步；React 的 ChangeEvent<HTMLInputElement> 已把 e.target 精确到元素类型
 * - <slot /> / <slot name="footer" /> 对应 children / footer；defineSlots 只是给「模板机制」加类型标注 ——
 *   ReactNode 是一个值的类型、插槽是模板语法，没有一一对应关系
 * - 类型只能放 .ts：<script setup> 不能 export 类型，跨组件共享的类型放 vue/types.ts（React 的 .tsx 就是普通模块，随便 export）
 *
 * 最重要的区别：
 * - 三个事实先钉死：① Vue 和 React 都可以使用 TypeScript（本项目两侧全是 TS：<script setup lang="ts"> 与 .tsx）；
 *   ② React 中 JSX、事件和 props 的类型经常需要【显式建模】—— 组件就是函数、props 就是参数、事件就是回调参数，
 *   没有编译器宏、也没有模板编译器替你推断；③ TypeScript 类型不是 React 独有，但在 React 项目里非常常见，
 *   常见到「React + TS」几乎是默认组合（本项目 22 道旧题的示例全是 TS，这就是为什么推荐顺序里本题排在第二位、仅次于 23 题）
 * - Vue 把类型信息交给编译器宏（defineProps / defineEmits / defineModel）和模板编译器（v-model、@click 的 e 自动推断）；
 *   React 一切都是普通 TypeScript：props 是 interface、事件是从 'react' 导入的泛型类型、children 是 ReactNode 类型的 prop
 * - React 事件是合成事件（SyntheticEvent），类型从 'react' 导入且带 DOM 元素泛型；Vue 拿到的是原生 DOM 事件，类型是全局的
 *   Event / MouseEvent —— 所以 React 里 import MouseEvent 时要起别名，否则会遮蔽 DOM 全局的同名类型
 * - 与邻题的分工：02 = props 接口、默认值、ComponentPropsWithoutRef + rest 透传；本题 = 其余工具箱
 *   （state 泛型、事件类型、ReactNode、联合类型与守卫、satisfies、unknown）；04 讲事件机制本身、07 讲受控表单本身，
 *   本题只讲它们的类型；13 讲 children / 插槽的组合用法，本题只讲 ReactNode 这个类型；29 讲判别联合 Action + never 穷尽检查
 */
// 类型与值可以写在同一条 import 里，类型加 type 前缀（inline type specifier）；也可以分成 import type { … } 单独一行（02 题写法）。
// tsconfig 开了 verbatimModuleSyntax：类型只在编译期存在，不标 type 会让打包器去找一个运行时并不存在的导出。
// spec 里写的 React.ChangeEvent<…> 是同一个类型的命名空间写法 —— 新 JSX 转换下不再需要 import React，所以直接按名导入更常见。
// MouseEvent 起别名 ReactMouseEvent：'react' 导出的 MouseEvent 是合成事件类型，和浏览器全局的 DOM MouseEvent 同名，
// 不起别名会在本文件里把 DOM 那个遮蔽掉，写 DOM 代码时会莫名其妙地类型不匹配。
import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { ORDER_STATUS_TEXT, type Order, type OrderStatus } from '@/shared/types'

/* ============================================================================
 * 一、联合类型、常量数组与类型守卫
 * ========================================================================== */

/**
 * 字符串联合类型的扩展：筛选条件比订单状态多一个 'all'（不限状态）。
 * 联合类型是 TS 里表达「有限几种取值」最常用的手段，比 enum 轻（没有运行时产物、与字符串字面量直接兼容）。
 * Vue 侧同一行写在 vue/types.ts 里 —— 类型本身与框架无关。
 */
type StatusFilter = OrderStatus | 'all'

/**
 * 「类型 → 值」的常见需求：下拉框需要一个数组去 map 出 <option>，而联合类型在运行时不存在，无法遍历。
 * 写法拆开看：
 * - as const：把 string[] 冻结成只读元组 readonly ['all', 'pending', 'paid', 'cancelled']，每个成员保留字面量类型；
 * - satisfies readonly StatusFilter[]：检查每个成员都是合法的 StatusFilter（写错一个字母立刻报错），
 *   但【不改变】表达式的类型 —— 如果换成 `: readonly StatusFilter[]` 的类型标注，元组会被拓宽成普通数组，字面量信息就丢了。
 * 局限要诚实：satisfies 只保证「数组里的都合法」，不保证「联合类型的成员都出现了」（少写一项不会报错）；
 * 想要「一个都不能少」的检查，用下面的 Record<StatusFilter, string>。
 */
const STATUS_FILTER_OPTIONS = ['all', 'pending', 'paid', 'cancelled'] as const satisfies readonly StatusFilter[]

/**
 * Record<K, V>：键必须覆盖 K 的【全部】成员 —— 将来给 OrderStatus 加一个 'refunded'，这里立刻编译报错，
 * 这就是「用类型逼你补全 UI 文案」。对象展开把共享的 ORDER_STATUS_TEXT（它本身就是 Record<OrderStatus, string>）合并进来。
 */
const STATUS_FILTER_LABEL: Record<StatusFilter, string> = { all: '全部', ...ORDER_STATUS_TEXT }

/**
 * 类型守卫（type guard / type predicate）：返回类型写成 value is StatusFilter，
 * 调用处 if (isStatusFilter(x)) 分支里 x 的类型会从 string 自动收窄成 StatusFilter。
 * 用它代替 as：<select> 的 e.target.value 静态类型只是 string，10 题直接写了 as TimerMode 断言（选项来自自己的常量，断言安全）；
 * 本题展示更严格的守卫写法 —— 值来自外部（URL 参数、JSON、localStorage）时守卫是唯一正确的做法，断言等于自欺。
 * 实现里 option === value 是「字面量 vs string」的比较，TS 允许，所以不需要任何断言。
 */
function isStatusFilter(value: string): value is StatusFilter {
  return STATUS_FILTER_OPTIONS.some((option) => option === value)
}

/**
 * 对象类型：interface 描述「筛选条件」这份数据的形状。
 * minAmount 可选：不筛金额时干脆没有这个字段，比用 0 / -1 之类的哨兵值清楚得多。
 */
interface OrderFilter {
  keyword: string
  status: StatusFilter
  /** 最低金额（含）；不限制时省略 */
  minAmount?: number
}

const DEFAULT_FILTER: OrderFilter = { keyword: '', status: 'all' }

/** 纯函数：一条订单是否满足筛选条件。写在组件外，不依赖任何 state，可以单独测试 */
function matchesFilter(order: Order, filter: OrderFilter): boolean {
  const kw = filter.keyword.trim().toLowerCase()
  if (kw !== '' && !order.orderNo.toLowerCase().includes(kw) && !order.customer.toLowerCase().includes(kw)) {
    return false
  }
  if (filter.status !== 'all' && order.status !== filter.status) return false
  // 可选属性读出来是 number | undefined，必须先判 undefined 再比较（strict 下直接比较会报错）
  if (filter.minAmount !== undefined && order.amount < filter.minAmount) return false
  return true
}

/** 把筛选条件拼成一句话给页面显示 */
function describeFilter(filter: OrderFilter): string {
  const parts = [
    `关键词「${filter.keyword === '' ? '（空）' : filter.keyword}」`,
    `状态「${STATUS_FILTER_LABEL[filter.status]}」`,
  ]
  if (filter.minAmount !== undefined) parts.push(`金额 ≥ ${filter.minAmount}`)
  return parts.join(' · ')
}

/**
 * 「值 → 类型」的反方向：先写常量数组，再用 (typeof SORT_OPTIONS)[number]['value'] 把 value 字段的字面量抽成联合类型。
 * 与上面 STATUS_FILTER_OPTIONS 正好相反：那边是先有类型、数组去 satisfies 它；这边是先有数组、类型从数组推出来。
 * 选哪种？类型会被多处共享（跨文件、进接口）时先定义类型；只在本地用一次的下拉选项，从数组推最省事、不会两处不同步。
 * 外层括号不能省：typeof SORT_OPTIONS[number] 会被解析成 typeof (SORT_OPTIONS[number])，语义不同。
 */
const SORT_OPTIONS = [
  { value: 'newest', label: '最新在前' },
  { value: 'amountDesc', label: '金额从高到低' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['value']

function isSortKey(value: string): value is SortKey {
  return SORT_OPTIONS.some((option) => option.value === value)
}

/** Record 的值也可以是函数类型：每种排序对应一个比较器，同样受「一个都不能少」的检查 */
const SORT_COMPARATORS: Record<SortKey, (a: Order, b: Order) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  amountDesc: (a, b) => b.amount - a.amount,
}

/**
 * 面向【外部数据】的类型守卫：参数是 unknown，一步步用 typeof / in 收窄，全程没有 as。
 * TS 4.9 起 'keyword' in value 会把 object 收窄成 object & Record<'keyword', unknown>，于是 value.keyword 可读（类型 unknown），
 * 再 typeof 一次就成了 string。这是「运行时校验 + 编译期收窄」合一的写法，zod 之类的库做的就是它的自动化版本。
 * 对照另一条路 —— const v = value as OrderFilter：一行搞定，但 JSON 里少个字段、状态拼错，运行时才炸，且炸在离这里很远的地方。
 */
function isOrderFilter(value: unknown): value is OrderFilter {
  if (typeof value !== 'object' || value === null) return false
  if (!('keyword' in value) || typeof value.keyword !== 'string') return false
  if (!('status' in value) || typeof value.status !== 'string' || !isStatusFilter(value.status)) return false
  if ('minAmount' in value && value.minAmount !== undefined && typeof value.minAmount !== 'number') return false
  return true
}

/* ============================================================================
 * 二、数据：数组类型 Order[]（元素形状来自共享的 Order 接口）
 * ========================================================================== */

/**
 * 数组类型两种写法等价：Order[] 与 Array<Order>，工业界惯用前者。
 * 给常量标注类型的价值：对象字面量会做「多余属性检查」—— 少写 createdAt、把 status 拼成 'payed' 都是编译错误。
 */
const ORDERS: Order[] = [
  {
    id: 'o1',
    orderNo: 'SO-2026-0001',
    customer: '林小满',
    amount: 1280,
    status: 'pending',
    createdAt: '2026-08-02',
    items: [{ id: 'o1-1', name: '4K 显示器', price: 1280, quantity: 1 }],
  },
  {
    id: 'o2',
    orderNo: 'SO-2026-0002',
    customer: '陈北洋',
    amount: 5600,
    status: 'paid',
    createdAt: '2026-08-05',
    items: [
      { id: 'o2-1', name: '电动升降桌', price: 2199, quantity: 2 },
      { id: 'o2-2', name: '桌面音箱', price: 1202, quantity: 1 },
    ],
  },
  {
    id: 'o3',
    orderNo: 'SO-2026-0003',
    customer: '赵四方',
    amount: 899,
    status: 'cancelled',
    createdAt: '2026-08-09',
    items: [{ id: 'o3-1', name: '便携显示器', price: 899, quantity: 1 }],
  },
  {
    id: 'o4',
    orderNo: 'SO-2026-0004',
    customer: '周知行',
    amount: 528,
    status: 'pending',
    createdAt: '2026-08-14',
    items: [
      { id: 'o4-1', name: '机械键盘', price: 399, quantity: 1 },
      { id: 'o4-2', name: '无线鼠标', price: 129, quantity: 1 },
    ],
  },
  {
    id: 'o5',
    orderNo: 'SO-2026-0005',
    customer: '林小满',
    amount: 699,
    status: 'paid',
    createdAt: '2026-08-20',
    items: [{ id: 'o5-1', name: '降噪耳机', price: 699, quantity: 1 }],
  },
]

/* ============================================================================
 * 区块一：筛选表单 —— props 类型、可选属性、callback props、ReactNode、事件类型
 * ========================================================================== */

/**
 * props 接口：四个字段展示四种常见形态。
 * - initial?: OrderFilter        可选的对象 prop；对应 Vue 的 withDefaults(defineProps<{ initial?: OrderFilter }>(), { initial: () => ({ … }) })
 * - onSubmit: (filter) => void   callback prop 就是一个函数类型的字段（08 题的机制）；对应 Vue 的 defineEmits<{ submit: [filter: OrderFilter] }>()
 * - onReset?: () => void         可选回调：调用时写 onReset?.()；Vue 的 emit 天然「可选」（父组件不监听就是不监听），没有这层区分
 * - footer?: ReactNode           「具名插槽」在 React 里只是一个可渲染值类型的 prop；对应 Vue 的 <slot name="footer" />
 *
 * 面试角度：callback prop 的类型该写成什么？写成「子组件需要的最小签名」(filter: OrderFilter) => void，
 * 而不是把父组件的 setter 类型 Dispatch<SetStateAction<OrderFilter>> 泄漏进来 —— 子组件不该知道父组件用的是 useState 还是别的。
 */
interface OrderFilterFormProps {
  /** 初始值（只在首次渲染读取一次，与 useState 的初始值同理；父组件想重置就换 key，见下方 Example） */
  initial?: OrderFilter
  onSubmit: (filter: OrderFilter) => void
  onReset?: () => void
  /** 表单底部的自定义内容；不传就不渲染底部区域 */
  footer?: ReactNode
}

/**
 * 不需要 React.FC：给参数标注 props 类型就够了（React.FC 在 @types/react 18 之前会隐式带上 children ——
 * 18 起已移除，本项目的 19.2 同样没有；它至今也写不出泛型组件，所以社区惯例是直接给参数标类型）。
 * 参数解构默认值 initial = DEFAULT_FILTER 把 OrderFilter | undefined 收窄成 OrderFilter（02 题的写法）。
 */
function OrderFilterForm({ initial = DEFAULT_FILTER, onSubmit, onReset, footer }: OrderFilterFormProps) {
  // useState 的推断：初始值是 string，state 就是 string，setter 只接受 string —— 不用写泛型
  const [keyword, setKeyword] = useState(initial.keyword)
  // 这里 useState(initial.status) 也能推断出 StatusFilter，因为 initial.status 的声明类型就是它；
  // 显式写出来是为了和 Example 里 useState<SortKey>('newest') 对照：直接传字面量 'all' 时就只会推断成 string，那时泛型不能省。
  const [status, setStatus] = useState<StatusFilter>(initial.status)
  // 金额输入框的草稿用 string 保存（07 题：受控输入框的值永远是字符串），提交时再转成 number 塞进可选字段
  const [minAmountText, setMinAmountText] = useState(
    initial.minAmount === undefined ? '' : String(initial.minAmount),
  )

  /**
   * ChangeEvent<E>：E 是事件所在的 DOM 元素类型，决定 e.target 的类型。
   * 一个处理器同时挂在 <input> 和 <select> 上，就把 E 写成联合 HTMLInputElement | HTMLSelectElement ——
   * 两者都有 name 和 value: string，所以解构不需要再收窄。
   * 参数类型必须手写：这是独立函数，不像内联箭头函数那样能从 JSX 属性反推；写 e: any 是自废武功（e.target.valeu 拼错都不报）。
   * Vue 对照：@input / @change 拿到的是原生 Event，e.target 是 EventTarget | null，得 (e.target as HTMLInputElement).value ——
   * 那个断言不可避免，v-model 正是替你做了这一步。React 的合成事件类型把元素类型编码进了泛型，所以这里没有断言。
   */
  function handleFieldChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'keyword') {
      setKeyword(value)
    } else if (name === 'status') {
      // value 只是 string；守卫通过后它才是 StatusFilter，setStatus(value) 才能通过编译
      if (isStatusFilter(value)) setStatus(value)
    }
  }

  /**
   * FormEvent<HTMLFormElement>：表单提交事件。e.preventDefault() 阻止浏览器整页刷新（07 题）。
   * e.currentTarget 已经是 HTMLFormElement，想走非受控路线可以直接 new FormData(e.currentTarget)；本题用受控 state 组装。
   */
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // 先按必填字段造对象，再按条件补可选字段：不筛金额时对象上干脆没有 minAmount，而不是 minAmount: undefined
    // （这是本地临时对象，还没交给任何人，往上加属性没问题 —— 与「不可变更新」不冲突，那条规则针对的是 state）
    const filter: OrderFilter = { keyword: keyword.trim(), status }
    if (minAmountText !== '') filter.minAmount = Number(minAmountText)
    onSubmit(filter)
  }

  function handleReset() {
    setKeyword(DEFAULT_FILTER.keyword)
    setStatus(DEFAULT_FILTER.status)
    setMinAmountText('')
    // 可选回调：?.() 在 onReset 是 undefined 时什么都不做；直接写 onReset() 会被 strict 拦下
    onReset?.()
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="row">
        <label className="row">
          <span>关键词：</span>
          {/* name 属性让一个处理器分辨多个字段；受控写法 value + onChange 见 07 题 */}
          <input name="keyword" value={keyword} placeholder="订单号或客户名" onChange={handleFieldChange} />
        </label>
        <label className="row">
          <span>状态：</span>
          {/* 选项来自 STATUS_FILTER_OPTIONS（as const 元组），文案来自 Record —— 两处都受类型约束，不会出现「多一个」或「少一个」 */}
          <select name="status" value={status} onChange={handleFieldChange}>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {STATUS_FILTER_LABEL[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="row">
          <span>金额 ≥</span>
          {/* 内联箭头函数：e 的类型由 JSX 上下文推断为 ChangeEvent<HTMLInputElement>，鼠标悬停在 e 上就能看到 ——
              这就是为什么「简单的事件处理直接写内联」在 React + TS 里格外顺手；抽出去才需要手写类型 */}
          <input
            type="number"
            min={0}
            step={1}
            value={minAmountText}
            placeholder="不限"
            onChange={(e) => setMinAmountText(e.target.value)}
          />
        </label>
      </div>
      <div className="row">
        <button type="submit" className="btn-primary">
          应用筛选
        </button>
        <button type="button" className="btn-ghost" onClick={handleReset}>
          重置
        </button>
      </div>
      {/* footer 是 ReactNode：判空后原样渲染。用 != null 而不是 && —— ReactNode 允许 0，0 && … 会把 0 打到页面上（05 题的坑） */}
      {footer != null && <div className="row">{footer}</div>}
    </form>
  )
}

/* ============================================================================
 * 区块二：订单卡片 —— 可选布尔 prop、带事件参数的 callback prop、children
 * ========================================================================== */

/**
 * - selected?: boolean                 可选布尔：不传视为 false（解构默认值）；Vue 里布尔 prop 缺省自动是 false，不需要 withDefaults
 * - onSelect?: (id, e) => void         回调把 React 合成事件一并交给父组件：参数类型 ReactMouseEvent<HTMLButtonElement>
 *                                      告诉父组件「这是从一个 <button> 上发出的点击」，e.currentTarget 因此是 HTMLButtonElement；
 *                                      Vue 对照 defineEmits<{ select: [id: string, e: MouseEvent] }>()，那个 MouseEvent 是 DOM 原生类型
 * - children?: ReactNode               标签之间的内容；显式声明才能接收（React 18 起 FC 不再隐式带 children）；对应 Vue 默认 <slot />
 */
interface OrderCardProps {
  order: Order
  selected?: boolean
  onSelect?: (id: string, e: ReactMouseEvent<HTMLButtonElement>) => void
  children?: ReactNode
}

function OrderCard({ order, selected = false, onSelect, children }: OrderCardProps) {
  return (
    <div className="card stack">
      <div className="row">
        <strong>{order.orderNo}</strong>
        {/* order.status 是 OrderStatus 联合类型：既能拼类名，又能当 Record 的键 —— 两处都有类型保护 */}
        <span className={`badge badge-${order.status}`}>{ORDER_STATUS_TEXT[order.status]}</span>
        {selected && <span className="badge">已选中</span>}
      </div>
      <div className="row">
        <span>客户：{order.customer}</span>
        <span className="muted">
          ￥{order.amount.toFixed(2)} · {order.createdAt}
        </span>
      </div>
      {/* children 就是普通 prop，放哪里由组件决定；判空同样用 != null */}
      {children != null && <div>{children}</div>}
      {/* onSelect 可选：没传就不渲染按钮。内联箭头函数里的 e 由 <button onClick> 推断为 MouseEvent<HTMLButtonElement>，
          正好匹配 onSelect 的参数类型 —— 类型在这里「接上了」，改错任何一端都会报错 */}
      {onSelect && (
        <div className="row">
          <button className={selected ? 'btn-primary' : undefined} onClick={(e) => onSelect(order.id, e)}>
            {selected ? '取消选择' : '选择'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ============================================================================
 * 根组件：state 的类型推断与显式泛型、渲染期过滤、unknown 与类型守卫
 * ========================================================================== */

export default function Example() {
  /**
   * useState 泛型什么时候必须写 —— 三个真实案例都在这里：
   * ① useState<Order[]>(ORDERS)：这里其实可以推断（ORDERS 已标注 Order[]）；但若初始值是空数组 useState([])，
   *    推断结果是 never[] —— 之后 setOrders([order]) 直接报错，所以「初始空数组必须写泛型」
   * ② useState<string | null>(null)：不写泛型推断出的 state 类型就是 null，永远塞不进字符串
   * ③ useState<SortKey>('newest')：字面量会拓宽 —— 不写泛型就是 string，后面 SORT_COMPARATORS[sortKey] 立刻报错
   * 其余（lastClick / jsonText / importError / formVersion）都靠推断，不写泛型才是常态。
   * Vue 对照：ref<Order[]>([]) / ref<string | null>(null) / ref<SortKey>('newest') 面对的是一模一样的三个问题。
   */
  const [orders, setOrders] = useState<Order[]>(ORDERS)
  // 对象 state：初始值已经是 OrderFilter 类型，推断即可；复杂对象建议还是显式写，读代码的人一眼看到形状
  const [filter, setFilter] = useState<OrderFilter>(DEFAULT_FILTER)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [lastClick, setLastClick] = useState('')
  // 用 key 让表单重新挂载：OrderFilterForm 只在首次渲染读一次 initial（与 useState(props.x) 同理，25 题详讲），
  // 「从 JSON 导入」后要让输入框显示新值，正确做法是换 key 重建组件，而不是用 useEffect 把 props 抄进 state（09 题的反模式）
  const [formVersion, setFormVersion] = useState(0)
  const [jsonText, setJsonText] = useState('{"keyword":"","status":"pending","minAmount":500}')
  const [importError, setImportError] = useState('')

  /** 渲染期直接过滤 + 排序（09 题：派生值不另开 state）。filter() 已返回新数组，接着 sort() 不会碰到 state 里的那份 */
  const visibleOrders = orders.filter((o) => matchesFilter(o, filter)).sort(SORT_COMPARATORS[sortKey])

  // find 的返回类型是 Order | undefined —— 可选链 ?. 与判 undefined 是处理它的标准姿势
  const selectedOrder = orders.find((o) => o.id === selectedId)
  const canMarkPaid = selectedOrder?.status === 'pending'

  function applyFilter(next: OrderFilter) {
    setFilter(next)
    setSelectedId(null)
  }

  function resetFilter() {
    applyFilter(DEFAULT_FILTER)
  }

  /**
   * 这个处理器的类型完全由 OrderCardProps['onSelect'] 决定 —— 写错参数类型，传给 <OrderCard onSelect> 的那一行就会报错。
   * e.currentTarget 是 HTMLButtonElement（泛型给的），textContent / shiftKey / clientX 都有类型，不需要 instanceof 或断言；
   * Vue 侧同一段要先 e.currentTarget instanceof HTMLButtonElement，因为 DOM MouseEvent.currentTarget 只是 EventTarget | null。
   */
  function handleSelect(id: string, e: ReactMouseEvent<HTMLButtonElement>) {
    setSelectedId((prev) => (prev === id ? null : id))
    setLastClick(
      `按钮「${e.currentTarget.textContent}」，Shift ${e.shiftKey ? '按住' : '未按'}，坐标 (${e.clientX}, ${e.clientY})`,
    )
  }

  /**
   * 数组 state 的不可变更新（03 / 21 题）：map 造新数组，被改的那条造新对象。
   * 变量标注 : Order 有两个作用：让意图一眼可读，并确保对象字面量里的 'paid' 按 OrderStatus 字面量而不是 string 处理。
   */
  function markSelectedPaid() {
    if (selectedId === null) return
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== selectedId || o.status !== 'pending') return o
        const next: Order = { ...o, status: 'paid' }
        return next
      }),
    )
  }

  function resetOrders() {
    setOrders(ORDERS)
    setSelectedId(null)
  }

  /**
   * any 的第一大泄漏口：JSON.parse 的返回类型是 any —— 不标注的话 parsed 会带着 any 一路传染下去，什么都不报。
   * 正确做法：接住的那一刻就标成 unknown（unknown 什么都不能直接做，逼你先校验），再用类型守卫收窄。
   * 第二大泄漏口是 catch：strict 下 catch 变量默认已是 unknown（useUnknownInCatchVariables），这里显式写出来是教学；
   * 千万别写 catch (err: any) 然后 err.message —— 抛出来的可能根本不是 Error（字符串、undefined 都能 throw）。
   * 试试：把 status 改成 "payed"、把 minAmount 改成 "500"（带引号）、或删掉一个引号，看三种不同的失败信息。
   */
  function handleImport() {
    try {
      const parsed: unknown = JSON.parse(jsonText)
      if (!isOrderFilter(parsed)) {
        setImportError(
          'JSON 能解析，但结构不是 OrderFilter：需要 keyword: string、status: all | pending | paid | cancelled，可选 minAmount: number',
        )
        return
      }
      // 守卫通过：parsed 在这里已经是 OrderFilter，直接交给和表单相同的入口
      applyFilter(parsed)
      setFormVersion((v) => v + 1)
      setImportError('')
    } catch (err: unknown) {
      // unknown 必须先收窄才能读 .message；不是 Error 就退回 String(err)
      setImportError(err instanceof Error ? `JSON 解析失败：${err.message}` : String(err))
    }
  }

  return (
    <div className="stack">
      {/* ---------------- 区块一 ---------------- */}
      <div className="card stack">
        <h3>区块一：筛选表单 —— props 类型 / 可选属性 / callback props / ReactNode / 事件类型</h3>
        <p className="muted">
          改关键词、状态、最低金额后点「应用筛选」，区块二的列表随之变化；「重置」会触发可选的 onReset。
          状态下拉里只有 StatusFilter 联合类型的四个成员（多一个、少一个都过不了编译）。
          表单底部那行灰字是父组件通过 footer 这个 ReactNode 类型的 prop 传进去的。
        </p>
        <OrderFilterForm
          key={formVersion}
          initial={filter}
          onSubmit={applyFilter}
          onReset={resetFilter}
          footer={<span className="muted">当前生效：{describeFilter(filter)}</span>}
        />
      </div>

      {/* ---------------- 区块二 ---------------- */}
      <div className="card stack">
        <h3>区块二：订单卡片 —— selected? / onSelect(id, e) / children / 从常量数组推出的排序类型</h3>
        <p className="muted">
          点「选择」高亮卡片（再点取消）；「最近一次点击」那行读的全是 MouseEvent 上带类型的字段。
          选中一条待支付订单后可以「标记为已支付」（不可变更新，见 03 / 21 题）。
          排序下拉的值类型 SortKey 是从 SORT_OPTIONS 常量数组反推出来的。
        </p>
        <div className="row">
          <label className="row">
            <span>排序：</span>
            {/* 与状态下拉同款：string → 守卫 → SortKey，而不是 as SortKey */}
            <select
              value={sortKey}
              onChange={(e) => {
                if (isSortKey(e.target.value)) setSortKey(e.target.value)
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button disabled={!canMarkPaid} onClick={markSelectedPaid}>
            把选中的订单标记为已支付
          </button>
          <button className="btn-ghost" onClick={resetOrders}>
            恢复初始数据
          </button>
        </div>
        {lastClick !== '' && <p className="muted">最近一次点击：{lastClick}</p>}
        <p className="muted">
          匹配 {visibleOrders.length} / {orders.length} 条
          {selectedOrder ? `，已选中 ${selectedOrder.orderNo}` : '，未选中'}
        </p>
        {visibleOrders.length === 0 && <p className="muted">没有符合条件的订单 —— 试试重置筛选</p>}
        {visibleOrders.map((o) => (
          // 标签之间的内容就是 children：这里父组件决定往卡片里塞一行商品摘要，OrderCard 只负责「放在哪」
          <OrderCard key={o.id} order={o} selected={o.id === selectedId} onSelect={handleSelect}>
            <span className="muted">
              {o.items.length} 种商品：{o.items.map((item) => `${item.name} × ${item.quantity}`).join('、')}
            </span>
          </OrderCard>
        ))}
      </div>

      {/* ---------------- 区块三 ---------------- */}
      <div className="card stack">
        <h3>区块三：从 JSON 导入筛选条件 —— unknown + 类型守卫 + catch (err: unknown)，拒绝 any</h3>
        <p className="muted">
          JSON.parse 返回 any，是业务代码里 any 泄漏的头号来源。这里把结果立刻标成 unknown，用 isOrderFilter 守卫验证后才使用。
          点「导入」应用到区块一（表单会重新挂载显示新值）；试试把 status 改成 &quot;payed&quot;、把 500 加上引号、或删掉一个引号。
        </p>
        <textarea rows={2} value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
        <div className="row">
          <button className="btn-primary" onClick={handleImport}>
            导入
          </button>
          {importError !== '' && <span className="error-text">{importError}</span>}
        </div>
      </div>

      {/* ---------------- 速查表 ---------------- */}
      <div className="card stack">
        <h3>速查表：同一件事，两边分别写什么类型</h3>
        <table>
          <thead>
            <tr>
              <th>场景</th>
              <th>React</th>
              <th>Vue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>组件输入</td>
              <td>
                <code>interface Props</code> + 函数参数解构
              </td>
              <td>
                <code>{'defineProps<Props>()'}</code>
              </td>
            </tr>
            <tr>
              <td>可选 + 默认值</td>
              <td>
                <code>{'{ x = 默认 }: Props'}</code>
              </td>
              <td>
                <code>withDefaults</code>（3.5 起也可解构默认值）
              </td>
            </tr>
            <tr>
              <td>子通知父</td>
              <td>
                <code>{'onX?: (…) => void'}</code>（普通函数 prop）
              </td>
              <td>
                <code>{'defineEmits<{ x: […] }>()'}</code>
              </td>
            </tr>
            <tr>
              <td>局部状态</td>
              <td>
                <code>{'useState<T>(init)'}</code>（null / [] / 字面量时必须写 T）
              </td>
              <td>
                <code>{'ref<T>(init)'}</code>（同样三种情况）
              </td>
            </tr>
            <tr>
              <td>输入事件</td>
              <td>
                <code>{'ChangeEvent<HTMLInputElement>'}</code>（e.target 已精确）
              </td>
              <td>
                原生 <code>Event</code> → <code>as HTMLInputElement</code>，或用 v-model 跳过
              </td>
            </tr>
            <tr>
              <td>点击事件</td>
              <td>
                <code>{'MouseEvent<HTMLButtonElement>'}</code>（从 'react' 导入，需别名）
              </td>
              <td>
                全局 DOM <code>MouseEvent</code>
              </td>
            </tr>
            <tr>
              <td>可渲染内容</td>
              <td>
                <code>ReactNode</code> 类型的 prop（children / footer）
              </td>
              <td>
                <code>{'<slot>'}</code> 模板机制（没有一一对应关系）
              </td>
            </tr>
            <tr>
              <td>外部数据</td>
              <td colSpan={2}>
                <code>unknown</code> + 类型守卫 <code>value is T</code>；<code>catch (err: unknown)</code> —— 这是 TypeScript
                本身的规则，与框架无关
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
