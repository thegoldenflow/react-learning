<script setup lang="ts">
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
 * - useState 的类型推断：useState('') 推断 string —— 多数时候不用写泛型。必须显式的三种情况：
 *   ① 字面量会被拓宽（useState<SortKey>('newest')）；② 初始值是 null（useState<string | null>(null)）；③ 初始值是空数组（useState<Order[]>([])，不写就是 never[]）
 * - React 事件类型：ChangeEvent<HTMLInputElement> / FormEvent<HTMLFormElement> / MouseEvent<HTMLButtonElement>，
 *   泛型参数是「事件挂在哪种 DOM 元素上」，决定了 e.target / e.currentTarget 的类型；
 *   写成内联箭头函数 onChange={e => …} 时 e 由 JSX 上下文推断，抽成独立函数就必须手写参数类型 —— 永远不写 e: any
 * - ReactNode：「一切可渲染之物」—— children 与「具名插槽」props 的类型
 * - 数组与对象类型：Order[]、OrderFilter 接口、Record<K, V>、(typeof X)[number] 从常量数组反推联合类型
 * - 避免滥用 any：外部数据（JSON.parse 返回 any）立刻标成 unknown，用类型守卫验证后再用；catch (err: unknown) 用 instanceof Error 收窄
 *
 * Vue 对应概念：
 * - defineProps<{ … }>() 泛型声明 props；可选 prop 的默认值走 withDefaults（对象 / 数组默认值必须写成工厂函数）——
 *   见 OrderFilterForm.vue 的 initial?、OrderCard.vue 的 selected?（布尔可选 prop 缺省自动 false，不需要默认值）
 * - defineEmits<{ submit: [filter: OrderFilter]; reset: [] }>() 用「具名元组」声明事件签名 —— 对应 callback props 的函数类型；
 *   OrderCard.vue 的 select: [id: string, e: MouseEvent] 把原生事件一并抛给父组件
 * - ref<T>()：ref('') 推断 string，ref<SortKey>('newest') 必须显式（否则拓宽成 string），ref([]) 同样是 never[]，
 *   ref<string | null>(null) 同样要写 —— 这组推断规则是 TypeScript 本身的行为，两边完全一致（本文件三个案例都在下面）
 * - 事件类型：模板里 @input / @change / @click 拿到的是【原生 DOM 事件】（Event / MouseEvent），
 *   e.target 是 EventTarget | null，取 value 必须 (e.target as HTMLInputElement).value 或 instanceof 收窄 ——
 *   这正是 v-model 帮你省掉的那一步（OrderFilterForm.vue 把三种写法并排放了）；React 的 ChangeEvent<HTMLInputElement> 已把 e.target 精确到元素类型
 * - <slot /> / <slot name="footer" /> 对应 children / footer；defineSlots 只是给「模板机制」加类型标注 ——
 *   ReactNode 是一个值的类型、插槽是模板语法，没有一一对应关系
 * - 类型只能放 .ts：<script setup> 不能 export 类型，跨组件共享的类型放 types.ts（React 的 .tsx 就是普通模块，随便 export）；
 *   页面的源码查看器只显示本文件，OrderFilterForm.vue / OrderCard.vue / types.ts 要在编辑器里打开看
 *
 * 最重要的区别：
 * - 三个事实先钉死：① Vue 和 React 都可以使用 TypeScript（本项目两侧全是 TS：<script setup lang="ts"> 与 .tsx）；
 *   ② React 中 JSX、事件和 props 的类型经常需要【显式建模】—— 组件就是函数、props 就是参数、事件就是回调参数，
 *   没有编译器宏、也没有模板编译器替你推断；③ TypeScript 类型不是 React 独有，但在 React 项目里非常常见，
 *   常见到「React + TS」几乎是默认组合 —— 本文件里的联合类型、Record、守卫、unknown 与 React 侧一字不差，正说明它们是 TS 的，不是 React 的
 * - Vue 把类型信息交给编译器宏（defineProps / defineEmits / defineModel）和模板编译器（v-model、@click 的 e 自动推断）；
 *   React 一切都是普通 TypeScript：props 是 interface、事件是从 'react' 导入的泛型类型、children 是 ReactNode 类型的 prop
 * - React 事件是合成事件（SyntheticEvent），类型从 'react' 导入且带 DOM 元素泛型；Vue 拿到的是原生 DOM 事件，类型是全局的
 *   Event / MouseEvent —— 所以 React 里 import MouseEvent 时要起别名，否则会遮蔽 DOM 全局的同名类型；Vue 侧直接用全局类型即可
 * - 与邻题的分工：02 = props 接口、默认值、属性透传；本题 = 其余工具箱（state 泛型、事件类型、ReactNode / slot 的类型、
 *   联合类型与守卫、satisfies、unknown）；04 讲事件机制本身、07 讲受控表单本身，本题只讲它们的类型；
 *   13 讲 children / 插槽的组合用法，本题只讲类型；29 讲判别联合 Action + never 穷尽检查
 */
import { computed, ref } from 'vue'
import type { Order } from '@/shared/types'
import { DEFAULT_FILTER, STATUS_FILTER_LABEL, isStatusFilter, type OrderFilter } from './types'
import OrderFilterForm from './OrderFilterForm.vue'
import OrderCard from './OrderCard.vue'

/* ============================================================================
 * 一、「值 → 类型」：从常量数组反推联合类型（React 侧同名常量，一字不差）
 * ========================================================================== */

/**
 * 与 types.ts 里 STATUS_FILTER_OPTIONS 正好相反：那边先有类型、数组去 satisfies 它；这边先有数组、类型从数组推出来。
 * 只在本文件用一次的下拉选项，从数组推最省事、不会两处不同步。外层括号不能省：typeof X[number] 会被解析成 typeof (X[number])。
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

/** 纯函数：一条订单是否满足筛选条件。可选属性 minAmount 读出来是 number | undefined，必须先判 undefined 再比较 */
function matchesFilter(order: Order, filter: OrderFilter): boolean {
  const kw = filter.keyword.trim().toLowerCase()
  if (kw !== '' && !order.orderNo.toLowerCase().includes(kw) && !order.customer.toLowerCase().includes(kw)) {
    return false
  }
  if (filter.status !== 'all' && order.status !== filter.status) return false
  if (filter.minAmount !== undefined && order.amount < filter.minAmount) return false
  return true
}

function describeFilter(filter: OrderFilter): string {
  const parts = [
    `关键词「${filter.keyword === '' ? '（空）' : filter.keyword}」`,
    `状态「${STATUS_FILTER_LABEL[filter.status]}」`,
  ]
  if (filter.minAmount !== undefined) parts.push(`金额 ≥ ${filter.minAmount}`)
  return parts.join(' · ')
}

/**
 * 面向【外部数据】的类型守卫：参数 unknown，用 typeof / in 一步步收窄，全程没有 as。
 * TS 4.9 起 'keyword' in value 会把 object 收窄成 object & Record<'keyword', unknown>，于是 value.keyword 可读。
 * 这段和 React 侧完全相同 —— 它是 TypeScript 的，不属于任何框架。
 */
function isOrderFilter(value: unknown): value is OrderFilter {
  if (typeof value !== 'object' || value === null) return false
  if (!('keyword' in value) || typeof value.keyword !== 'string') return false
  if (!('status' in value) || typeof value.status !== 'string' || !isStatusFilter(value.status)) return false
  if ('minAmount' in value && value.minAmount !== undefined && typeof value.minAmount !== 'number') return false
  return true
}

/* ============================================================================
 * 二、数据：数组类型 Order[]（与 React 侧同一份，元素形状来自共享的 Order 接口）
 * ========================================================================== */

/** 给常量标注 Order[] 的价值：对象字面量会做多余属性检查，少写 createdAt、把 status 拼成 'payed' 都是编译错误 */
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
 * 三、状态：ref 的类型推断与显式泛型 —— 三个「必须写泛型」的案例与 React 侧一一对应
 * ========================================================================== */

// ① ref<Order[]>：这里能推断（ORDERS 已标注），但初始值若是空数组 ref([]) 会推断成 Ref<never[]>，之后 push 什么都报错。
//   浅拷贝每个对象：Vue 是可变更新（下面 markSelectedPaid 会直接改 target.status），不拷贝会把模块级常量改坏（08 题同款）；
//   React 侧全程不可变更新、从不碰 ORDERS，所以那边不需要拷贝
const orders = ref<Order[]>(ORDERS.map((o) => ({ ...o })))
// 对象 state：初始值已是 OrderFilter，可推断；复杂对象显式写出让读代码的人一眼看到形状
const filter = ref<OrderFilter>({ ...DEFAULT_FILTER })
// ② ref<string | null>：不写泛型 ref(null) 推断出 Ref<null>，永远塞不进字符串
const selectedId = ref<string | null>(null)
// ③ ref<SortKey>：字面量会拓宽 —— 不写泛型就是 Ref<string>，后面 SORT_COMPARATORS[sortKey.value] 立刻报错
const sortKey = ref<SortKey>('newest')
// 其余靠推断：初始值是 string / number 就是 Ref<string> / Ref<number>，不写泛型才是常态
const lastClick = ref('')
const jsonText = ref('{"keyword":"","status":"pending","minAmount":500}')
const importError = ref('')
// 换 :key 让表单重新挂载：OrderFilterForm 在 setup 里 ref(props.initial.x) 只拷贝一次（25 题的「拷贝后不再同步」），
// 「从 JSON 导入」后要让输入框显示新值，正确做法是换 key 重建组件，而不是在子组件里 watch(props) 抄回本地 ref
const formVersion = ref(0)

// 派生值用 computed（setup 只跑一次）；React 侧是渲染期的普通 const（09 题）。filter() 已返回新数组，接着 sort() 不会碰 orders 本身
const visibleOrders = computed(() =>
  orders.value.filter((o) => matchesFilter(o, filter.value)).sort(SORT_COMPARATORS[sortKey.value]),
)
// find 的返回类型是 Order | undefined —— 可选链 ?. 是处理它的标准姿势
const selectedOrder = computed(() => orders.value.find((o) => o.id === selectedId.value))
const canMarkPaid = computed(() => selectedOrder.value?.status === 'pending')

// 参数类型由 OrderFilterForm 的 defineEmits<{ submit: [filter: OrderFilter] }>() 决定：模板里 @submit="applyFilter" 会检查签名是否匹配
function applyFilter(next: OrderFilter) {
  filter.value = next
  selectedId.value = null
}

function resetFilter() {
  applyFilter({ ...DEFAULT_FILTER })
}

/** 排序下拉：与 OrderFilterForm.vue 的 handleStatusChange 同款 —— 原生 Event → instanceof 收窄 → 守卫，不写 as */
function handleSortChange(e: Event) {
  if (e.target instanceof HTMLSelectElement && isSortKey(e.target.value)) sortKey.value = e.target.value
}

/**
 * 参数类型由 OrderCard 的 defineEmits<{ select: [id: string, e: MouseEvent] }>() 决定 —— 这个 MouseEvent 是 DOM 原生事件。
 * 差别就在下面这行：DOM 的 e.currentTarget 只是 EventTarget | null，读 textContent 前必须 instanceof 收窄；
 * React 侧的 ReactMouseEvent<HTMLButtonElement> 已把 currentTarget 精确到 HTMLButtonElement，直接 e.currentTarget.textContent。
 * shiftKey / clientX 两边都有 —— 合成事件把常用字段原样暴露了。
 */
function handleSelect(id: string, e: MouseEvent) {
  selectedId.value = selectedId.value === id ? null : id
  const label = e.currentTarget instanceof HTMLButtonElement ? e.currentTarget.textContent?.trim() : '?'
  lastClick.value = `按钮「${label}」，Shift ${e.shiftKey ? '按住' : '未按'}，坐标 (${e.clientX}, ${e.clientY})`
}

// Vue 风格：直接改响应式对象的属性（03 题）；React 侧是 map 造新数组 + 新对象的不可变更新。
// target.status = 'paid'：赋值目标的声明类型是 OrderStatus，字面量 'paid' 直接通过检查，拼错就报错
function markSelectedPaid() {
  const target = selectedOrder.value
  if (target && target.status === 'pending') target.status = 'paid'
}

function resetOrders() {
  orders.value = ORDERS.map((o) => ({ ...o }))
  selectedId.value = null
}

/**
 * any 的两大泄漏口与 React 侧完全相同：JSON.parse 返回 any（立刻标成 unknown 再用守卫收窄）、catch 变量（strict 下默认 unknown，
 * instanceof Error 收窄后才能读 .message）。这段代码里没有任何 Vue API —— 「TS 不是 React 独有」再次得证。
 */
function handleImport() {
  try {
    const parsed: unknown = JSON.parse(jsonText.value)
    if (!isOrderFilter(parsed)) {
      importError.value =
        'JSON 能解析，但结构不是 OrderFilter：需要 keyword: string、status: all | pending | paid | cancelled，可选 minAmount: number'
      return
    }
    // 守卫通过：parsed 在这里已经是 OrderFilter
    applyFilter(parsed)
    formVersion.value++
    importError.value = ''
  } catch (err: unknown) {
    importError.value = err instanceof Error ? `JSON 解析失败：${err.message}` : String(err)
  }
}
</script>

<template>
  <div class="stack">
    <!-- ---------------- 区块一 ---------------- -->
    <div class="card stack">
      <h3>区块一：筛选表单 —— defineProps / withDefaults / defineEmits / 具名插槽 / 原生事件类型</h3>
      <p class="muted">
        改关键词、状态、最低金额后点「应用筛选」，区块二的列表随之变化；「重置」会 emit 一个不带参数的 reset。
        状态下拉里只有 StatusFilter 联合类型的四个成员。表单底部那行灰字是父组件通过 #footer 具名插槽传进去的
        ——React 侧同一件事是一个 ReactNode 类型的 footer prop。三个输入框各用一种事件写法，源码在 OrderFilterForm.vue。
      </p>
      <!-- :initial 是 props（kebab-case 不必，单词本身就是小写）；@submit / @reset 监听 defineEmits 声明的事件；
           #footer 是具名插槽。React 侧：initial={filter} onSubmit={applyFilter} onReset={resetFilter} footer={<span>…</span>} -->
      <OrderFilterForm
        :key="formVersion"
        :initial="filter"
        @submit="applyFilter"
        @reset="resetFilter"
      >
        <template #footer>
          <span class="muted">当前生效：{{ describeFilter(filter) }}</span>
        </template>
      </OrderFilterForm>
    </div>

    <!-- ---------------- 区块二 ---------------- -->
    <div class="card stack">
      <h3>区块二：订单卡片 —— selected? / emit('select', id, e: MouseEvent) / 默认插槽 / 从常量数组推出的排序类型</h3>
      <p class="muted">
        点「选择」高亮卡片（再点取消）；「最近一次点击」那行读的是原生 MouseEvent 上的字段（currentTarget 要先 instanceof 收窄）。
        选中一条待支付订单后可以「标记为已支付」（Vue 直接改响应式对象，React 侧是不可变更新）。
        排序下拉的值类型 SortKey 是从 SORT_OPTIONS 常量数组反推出来的。
      </p>
      <div class="row">
        <label class="row">
          <span>排序：</span>
          <!-- 与状态下拉同款：原生 Event → 守卫 → SortKey，而不是 as SortKey -->
          <select
            :value="sortKey"
            @change="handleSortChange"
          >
            <option
              v-for="option in SORT_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
        <button
          :disabled="!canMarkPaid"
          @click="markSelectedPaid"
        >
          把选中的订单标记为已支付
        </button>
        <button
          class="btn-ghost"
          @click="resetOrders"
        >
          恢复初始数据
        </button>
      </div>
      <p
        v-if="lastClick !== ''"
        class="muted"
      >
        最近一次点击：{{ lastClick }}
      </p>
      <p class="muted">
        匹配 {{ visibleOrders.length }} / {{ orders.length }} 条{{ selectedOrder ? `，已选中 ${selectedOrder.orderNo}` : '，未选中' }}
      </p>
      <p
        v-if="visibleOrders.length === 0"
        class="muted"
      >
        没有符合条件的订单 —— 试试重置筛选
      </p>
      <!-- :order / :selected 是 props，@select 监听 defineEmits 声明的事件（参数类型随之推断）；
           标签之间的内容进默认插槽 = React 的 children -->
      <OrderCard
        v-for="o in visibleOrders"
        :key="o.id"
        :order="o"
        :selected="o.id === selectedId"
        @select="handleSelect"
      >
        <span class="muted">{{ o.items.length }} 种商品：{{ o.items.map((item) => `${item.name} × ${item.quantity}`).join('、') }}</span>
      </OrderCard>
    </div>

    <!-- ---------------- 区块三 ---------------- -->
    <div class="card stack">
      <h3>区块三：从 JSON 导入筛选条件 —— unknown + 类型守卫 + catch (err: unknown)，拒绝 any</h3>
      <p class="muted">
        JSON.parse 返回 any，是业务代码里 any 泄漏的头号来源。这里把结果立刻标成 unknown，用 isOrderFilter 守卫验证后才使用
        ——这段代码与 React 侧一字不差。点「导入」应用到区块一（表单会重新挂载显示新值）；
        试试把 status 改成 "payed"、把 500 加上引号、或删掉一个引号。
      </p>
      <textarea
        v-model="jsonText"
        rows="2"
      />
      <div class="row">
        <button
          class="btn-primary"
          @click="handleImport"
        >
          导入
        </button>
        <span
          v-if="importError !== ''"
          class="error-text"
        >{{ importError }}</span>
      </div>
    </div>

    <!-- ---------------- 速查表 ---------------- -->
    <div class="card stack">
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
            <td><code>interface Props</code> + 函数参数解构</td>
            <td><code>defineProps&lt;Props&gt;()</code></td>
          </tr>
          <tr>
            <td>可选 + 默认值</td>
            <td><code>{ x = 默认 }: Props</code></td>
            <td><code>withDefaults</code>（3.5 起也可解构默认值）；布尔可选 prop 免默认值</td>
          </tr>
          <tr>
            <td>子通知父</td>
            <td><code>onX?: (…) =&gt; void</code>（普通函数 prop）</td>
            <td><code>defineEmits&lt;{ x: […] }&gt;()</code></td>
          </tr>
          <tr>
            <td>局部状态</td>
            <td><code>useState&lt;T&gt;(init)</code>（null / [] / 字面量时必须写 T）</td>
            <td><code>ref&lt;T&gt;(init)</code>（同样三种情况）</td>
          </tr>
          <tr>
            <td>输入事件</td>
            <td><code>ChangeEvent&lt;HTMLInputElement&gt;</code>（e.target 已精确）</td>
            <td>原生 <code>Event</code> → <code>as HTMLInputElement</code> / instanceof，或用 v-model 跳过</td>
          </tr>
          <tr>
            <td>点击事件</td>
            <td><code>MouseEvent&lt;HTMLButtonElement&gt;</code>（从 'react' 导入，需别名）</td>
            <td>全局 DOM <code>MouseEvent</code></td>
          </tr>
          <tr>
            <td>可渲染内容</td>
            <td><code>ReactNode</code> 类型的 prop（children / footer）</td>
            <td><code>&lt;slot&gt;</code> 模板机制 + defineSlots 标注（没有一一对应关系）</td>
          </tr>
          <tr>
            <td>外部数据</td>
            <td colspan="2">
              <code>unknown</code> + 类型守卫 <code>value is T</code>；<code>catch (err: unknown)</code> —— 这是 TypeScript 本身的规则，与框架无关
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
