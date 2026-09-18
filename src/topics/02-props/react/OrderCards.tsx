/**
 * 区块一：给 props 写类型、用参数解构读取、给可选 prop 写默认值；默认值只对「没传 / 传 undefined」生效。
 * Vue 对照：vue/OrderCards.vue、vue/OrderCard.vue、vue/NoteText.vue。
 */
import type { ReactNode } from 'react'
// 只当类型用的导入写 import type（本项目开了 verbatimModuleSyntax）；类型和值也可以写在同一条 import 里：import { ORDER_STATUS_TEXT, type OrderStatus } …
import type { OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

/**
 * 用 interface 描述 props 的形状 —— 对应 Vue 的 defineProps<Props>()。问号表示可选。
 * TypeScript 只在编译期检查，运行时不校验（React 19 起 propTypes 也不再校验，见 Example.tsx 八）。
 */
interface OrderCardProps {
  orderNo: string
  customer: string
  amount: number
  status: OrderStatus
  /** 折扣率 0~1，可选；不传按 0（不打折） */
  discount?: number
}

/**
 * props 是组件函数唯一的参数（一个对象）。参数里直接解构，默认值用 JS 的解构默认值语法 { discount = 0 }。
 * 对应 Vue 3.5 的响应式 props 解构 const { discount = 0 } = defineProps<Props>()（3.4 及以前用 withDefaults）。
 * 不要再写 OrderCard.defaultProps：React 19 起函数组件的 defaultProps 在日常 JSX 写法下被静默忽略（createElement 路径仍会合并，见 Example.tsx 八，测试覆盖）。
 * 一个 .tsx 文件里放多个组件很常见（只导出需要对外的那个）；Vue 一个 SFC 只有一个模板组件，所以对照版拆成了 OrderCard.vue。
 */
function OrderCard({ orderNo, customer, amount, status, discount = 0 }: OrderCardProps) {
  // 派生值就是普通 const：组件函数每次渲染都重新执行，payable 自然是最新的；Vue 的 setup 只执行一次，对照版用 computed（09 题）。
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
        {/* discount > 0 才渲染后面的节点（条件渲染，05 题） */}
        {discount > 0 && (
          <span className="success-text">
            （立减 {Math.round(discount * 100)}%，应付 ￥{payable.toFixed(2)}）
          </span>
        )}
      </p>
    </div>
  )
}

interface NoteTextProps {
  /** 备注：可以不传；类型里也允许明确传 null，表示「就是没有备注」 */
  note?: string | null
  /** 可选的布尔 prop：不传就是 undefined（Vue 里声明成 boolean 的 prop 不传是 false） */
  emphasis?: boolean
}

/** 把收到的值原样显示出来：undefined 显示成 undefined，字符串带引号 */
function show(value: unknown) {
  return value === undefined ? 'undefined' : JSON.stringify(value)
}

/** 默认值实验用的组件：note 的默认值是 '（无备注）' */
function NoteText({ note = '（无备注）', emphasis }: NoteTextProps) {
  return (
    <code>
      note = {show(note)} · emphasis = {show(emphasis)}
    </code>
  )
}

/**
 * 五种传法。JSX 写在模块顶层的常量里没问题：它只是描述界面的普通对象（01 题）。
 * react.dev passing-props：默认值「is only used if the size prop is missing or if you pass size={undefined}」，传 null 或 0 不会用默认值。
 */
const DEFAULT_CASES: { code: string; element: ReactNode }[] = [
  { code: '<NoteText />', element: <NoteText /> },
  { code: '<NoteText note={undefined} />', element: <NoteText note={undefined} /> },
  { code: '<NoteText note={null} />', element: <NoteText note={null} /> },
  { code: '<NoteText note="" />', element: <NoteText note="" /> },
  // 只写属性名不写值 = 传 true（和 HTML 的布尔属性写法一样）
  { code: '<NoteText emphasis />', element: <NoteText emphasis /> },
]

export function OrderCards() {
  return (
    <div className="stack">
      <h3>区块一：props 的类型、解构与默认值</h3>
      {/* 传 props 就是写 JSX 属性：字符串可以直接用引号；数字、布尔、对象、函数等其他 JS 值一律用花括号。
          属性名原样传给组件（orderNo 就是 orderNo），JSX 不做大小写转换；Vue 模板里惯用 kebab-case（order-no），由 Vue 转成 camelCase。 */}
      <OrderCard orderNo="SO-20260801" customer="林小满" amount={1280} status="pending" />
      <OrderCard orderNo="SO-20260802" customer="陈北洋" amount={5600} status="paid" discount={0.15} />
      <OrderCard orderNo="SO-20260803" customer="赵四方" amount={899} status="cancelled" />

      <div className="card stack">
        <p className="muted">默认值只对「没传」和「传 undefined」生效；null、空串原样传进去。</p>
        <table>
          <thead>
            <tr>
              <th>父组件的写法</th>
              <th>NoteText 收到的值</th>
            </tr>
          </thead>
          <tbody>
            {/* key 写在这里的 <tr> 上，给 React 自己用；组件收不到 key（如果子组件也需要这个值，要另外用一个 prop 传，测试覆盖） */}
            {DEFAULT_CASES.map((c) => (
              <tr key={c.code}>
                <td>
                  <code>{c.code}</code>
                </td>
                <td>{c.element}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
