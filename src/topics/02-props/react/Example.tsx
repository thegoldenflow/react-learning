/**
 * 学习主题：Props（类型声明、默认值与单向数据流）
 *
 * React 核心概念：
 * - props 就是组件函数的第一个参数（一个普通对象），用 TS interface 描述形状
 * - 默认值用「参数解构默认值」：function OrderCard({ discount = 0 }: Props) —— 工业主流写法
 * - defaultProps / PropTypes 是过时写法，TypeScript 时代不再使用
 * - props 只读：子组件不能改，要改就调用父组件传下来的回调把修改「上浮」（08 题详讲）
 * - 组件只是函数，多个组件写在同一个 .tsx 文件里很常见
 *
 * Vue 对应概念：
 * - defineProps<{ ... }>() 声明类型；默认值要包一层 withDefaults(defineProps<...>(), { ... })
 * - Vue 的 props 同样单向：子组件里改 props，开发期会收到运行时警告
 * - SFC 一个文件只能有一个组件，子组件必须放单独的 .vue 文件
 *
 * 最重要的区别：
 * - defineProps 是「编译器宏」（编译期展开、无需 import）；React 没有任何宏，
 *   props 就是函数参数，类型、默认值全部用 TypeScript + JS 原生语法（解构默认值）表达
 * - 「子组件不能改 props」两边一致，但 Vue 有运行时警告兜底，React 不警告、
 *   纯靠约定与单向数据流——改 props 往往不报错，却会造成 UI 与数据源不一致（面试常问）
 */
import type { OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

/**
 * 用 interface 描述 props 形状 —— 对应 Vue 的 defineProps<{ ... }>()。
 * 问号表示可选；配合下面的解构默认值，等价于 Vue 的 withDefaults。
 */
interface OrderCardProps {
  orderNo: string
  customer: string
  amount: number
  status: OrderStatus
  /** 折扣率 0~1，可选；不传按 0（不打折）处理 */
  discount?: number
}

/**
 * 子组件 OrderCard 和父组件写在同一个 .tsx 文件里——React 组件只是函数，
 * 一个文件里放多个组件（只导出需要对外的那个）非常常见；
 * Vue 的 SFC 一个文件只能有一个组件，对照版把它拆成了单独的 OrderCard.vue。
 *
 * 参数解构 + 默认值 { discount = 0 } 是 React + TS 的工业主流写法，
 * 对应 Vue 的 withDefaults(defineProps<Props>(), { discount: 0 })。
 * 不要再用 OrderCard.defaultProps（已过时，函数组件里 React 19 已移除支持）。
 */
function OrderCard({ orderNo, customer, amount, status, discount = 0 }: OrderCardProps) {
  // props 是只读输入，绝不要在子组件里改它。
  //   amount = amount * 0.5  // ❌ 反例：解构出的只是局部变量，父组件毫不知情，
  //                          //    数据源和 UI 从此对不上
  // Vue 里改 props.amount 会在控制台收到警告；React 不警告，纯靠「单向数据流」约定。
  // 真想改？把「想改」这件事通过父组件传下来的回调上浮给父组件（08 题详讲）。

  // 派生值就是普通 const：组件函数每次渲染都会重跑，payable 自动保持最新；
  // Vue 的 setup 只执行一次，对照版要用 computed(() => ...) 包起来（03 题详讲）。
  const payable = amount * (1 - discount)

  return (
    <div className="card">
      <div className="row">
        <strong>{orderNo}</strong>
        {/* status 是 'pending' | 'paid' | 'cancelled'，正好拼出全局徽章类名 badge-xxx */}
        <span className={`badge badge-${status}`}>{ORDER_STATUS_TEXT[status]}</span>
      </div>
      <p>客户：{customer}</p>
      <p>
        金额：￥{amount.toFixed(2)}
        {/* 条件渲染：&& 短路表达式，discount > 0 才渲染后面的节点 —— 对应 Vue 的 v-if */}
        {discount > 0 && (
          <span className="success-text">
            （立减 {Math.round(discount * 100)}%，应付 ￥{payable.toFixed(2)}）
          </span>
        )}
      </p>
    </div>
  )
}

/**
 * 父组件：传 props 就是写 JSX 属性。
 * - 静态字符串直接用引号：orderNo="SO-20260801"
 * - 其他任何 JS 值（数字/布尔/对象/函数）一律用花括号：amount={1280}
 *   对应 Vue：静态属性直接写，动态值用 v-bind（:amount="1280"）
 * - JSX 属性名保持 camelCase（orderNo）；Vue 模板惯用 kebab-case（order-no）
 */
export default function Example() {
  return (
    <div className="stack">
      <p className="muted">父组件渲染三张订单卡；第二张传了可选的 discount，其余两张走默认值 0</p>
      <OrderCard orderNo="SO-20260801" customer="林小满" amount={1280} status="pending" />
      <OrderCard orderNo="SO-20260802" customer="陈北洋" amount={5600} status="paid" discount={0.15} />
      <OrderCard orderNo="SO-20260803" customer="赵四方" amount={899} status="cancelled" />
    </div>
  )
}
