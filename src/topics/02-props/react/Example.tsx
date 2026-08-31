/**
 * 学习主题：Props（类型声明、默认值与单向数据流）
 *
 * React 核心概念：
 * - props 就是组件函数的第一个参数（一个普通对象），用 TS interface 描述形状
 * - 默认值用「参数解构默认值」：function OrderCard({ discount = 0 }: Props) —— 工业主流写法
 * - defaultProps / PropTypes 是过时写法，TypeScript 时代不再使用
 * - props 只读：子组件不能改，要改就调用父组件传下来的回调把修改「上浮」（08 题详讲）
 * - 组件只是函数，多个组件写在同一个 .tsx 文件里很常见
 * - 没有任何属性会自动透传：想让自己的组件支持 disabled / type / title / aria-* / onClick
 *   这些原生属性，必须自己用 { ...rest } 收集，再展开到真实 DOM 元素上
 * - ComponentPropsWithoutRef<'button'> 一次性继承 <button> 的全部原生属性类型，
 *   与自定义 props 用交叉类型 & 拼起来 —— 这是组件库（shadcn/ui、MUI）的通用 API 写法
 *
 * Vue 对应概念：
 * - defineProps<{ ... }>() 声明类型；默认值要包一层 withDefaults(defineProps<...>(), { ... })
 * - Vue 的 props 同样单向：子组件里改 props，开发期会收到运行时警告
 * - SFC 一个文件只能有一个组件，子组件必须放单独的 .vue 文件
 * - fallthrough attributes（$attrs）：没在 defineProps 里声明的属性（含 class/style/事件监听）
 *   Vue 会自动落到子组件根元素上，class/style 还会自动与根元素已有的合并
 * - defineOptions({ inheritAttrs: false }) + useAttrs() 才是「手动接管透传」，
 *   这一步才等价于 React 的 { ...rest }
 *
 * 最重要的区别：
 * - defineProps 是「编译器宏」（编译期展开、无需 import）；React 没有任何宏，
 *   props 就是函数参数，类型、默认值全部用 TypeScript + JS 原生语法（解构默认值）表达
 * - 「子组件不能改 props」两边一致，但 Vue 有运行时警告兜底，React 不警告、
 *   纯靠约定与单向数据流——改 props 往往不报错，却会造成 UI 与数据源不一致（面试常问）
 * - 属性透传：Vue 默认帮你做（$attrs 自动落到根元素、class/style 还自动合并），
 *   React 一个属性都不会自动传下去。没有一一对应关系——React 里根本不存在
 *   $attrs / inheritAttrs / useAttrs 这套机制，{ ...rest } 是唯一手段，连 className 也要手动合并
 */
// ComponentPropsWithoutRef 是 React 自带的工具类型（只作类型用，必须写 import type）
import type { ComponentPropsWithoutRef } from 'react'
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

/* ======================= 新增区块：可复用按钮与「原生属性透传」 ======================= */

/**
 * UiButton：组件库风格的按钮，用来讲透 Vue 老手在 React 里最大的盲区之一 —— 属性透传。
 *
 * 你在 Vue 里写 <UiButton disabled title="x" aria-label="删除" @click="fn" />，
 * 这些没在 defineProps 里声明的东西，Vue 会**自动**塞到子组件根元素上
 * （fallthrough attributes / $attrs），class 和 style 甚至还会自动跟根元素已有的合并。
 * 这件事太自动了，很多人写了几年 Vue 组件都没意识到它存在。
 *
 * React 这边：**一个属性都不会自动透传**。props 只是函数的第一个参数，
 * 你没解构、没用上的属性就静静躺在那个对象里，永远不会出现在 DOM 上——
 * 传了 disabled 按钮照样能点，传了 onClick 什么都不会发生。
 * 没有一一对应关系：React 里没有 $attrs、没有 inheritAttrs、没有 useAttrs 这套机制，
 * 唯一手段就是「自己声明类型 + { ...rest } 展开」。
 */

/**
 * ComponentPropsWithoutRef<'button'> = 原生 <button> 能接收的全部 props 类型
 * （onClick / disabled / type / title / aria-* / data-* / children 一网打尽），
 * 比手抄一堆属性声明强得多，React 升级时类型还会自动跟着走。
 *
 * 用交叉类型 & 把「组件自己的 props」和「原生属性」拼起来，
 * 正是 shadcn/ui、MUI 这类组件库的通用 API 设计范式（面试常考：怎么设计一个可复用按钮）。
 *
 * 小知识：带 ref 的版本是 ComponentProps<'button'>（React 19 起 ref 就是普通 prop），
 * 老代码里的 forwardRef + ComponentPropsWithRef 已不再必需（12 题详讲 ref）。
 */
type UiButtonProps = {
  /** 组件自己的 props：只有这一个，其余全部来自原生 button */
  variant?: 'primary' | 'danger'
} & ComponentPropsWithoutRef<'button'>

/** variant → 全局按钮类名的映射表，就是一个普通 JS 对象 */
const VARIANT_CLASS: Record<NonNullable<UiButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  danger: 'btn-danger',
}

function UiButton({ variant = 'primary', className, children, ...rest }: UiButtonProps) {
  // className 为什么要单独解构出来，而不是直接扔进 rest？
  // 因为放任它留在 rest 里，下面 {...rest} 展开时会把组件自己算出来的 className 整个覆盖掉——
  // 外部只要传一个 className，btn-primary 就没了，样式直接崩。
  // 所以「先接住、再合并」是组件库的标准做法（工业界一般用 clsx / cn 工具函数干这件事）。
  // 对照 Vue：v-bind="attrs" 里的 class 会被 Vue 自动 merge 到根元素已有 class 上，
  // 那个「合并」是框架送你的；React 这边框架不管，得你自己拼字符串。
  const mergedClassName = [VARIANT_CLASS[variant], className].filter(Boolean).join(' ')

  return (
    // {...rest} 的位置很重要：
    // - 写在具名属性「之后」→ 具名属性只是默认值，外部传同名属性可以覆盖它
    //   （这里 type="button" 是默认值，外部传 type="submit" 就会盖掉它）
    // - 反过来把 {...rest} 写在最前面 → 等于组件强制锁死，外部永远覆盖不了
    // 这一条 code review 经常挑，面试也爱问「为什么 rest 要展开在最后」。
    <button type="button" className={mergedClassName} {...rest}>
      {children}
    </button>
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
  // 事件处理函数就是普通函数（04 题详讲事件）；这里只用来证明 onClick 确实透传到了原生 button
  function handleDemoClick() {
    console.log('[02-React] onClick 也是靠 { ...rest } 展开才落到真实 <button> 上的')
  }

  return (
    <div className="stack">
      <p className="muted">父组件渲染三张订单卡；第二张传了可选的 discount，其余两张走默认值 0</p>
      <OrderCard orderNo="SO-20260801" customer="林小满" amount={1280} status="pending" />
      <OrderCard orderNo="SO-20260802" customer="陈北洋" amount={5600} status="paid" discount={0.15} />
      <OrderCard orderNo="SO-20260803" customer="赵四方" amount={899} status="cancelled" />

      {/* ---------- 新增区块：UiButton 与原生属性透传 ---------- */}
      <div className="card stack">
        <p className="muted">
          UiButton 只声明了 variant 一个自己的 prop；下面这些 disabled / type / title / aria-label /
          onClick 全是原生 button 属性，靠组件内部的 rest 展开显式透传（Vue 里这一步是框架自动做的）
        </p>
        <div className="row">
          {/* onClick 能生效，是因为它被 rest 收集后展开到了真实 <button> 上 */}
          <UiButton onClick={handleDemoClick}>主要按钮（点我看控制台）</UiButton>

          {/* 多个原生属性一起透传：title 悬停可见，aria-label 指定无障碍名称 */}
          <UiButton
            variant="danger"
            title="这行 title 是透传到真实 button 上的，鼠标悬停可见"
            aria-label="删除订单 SO-20260803"
            onClick={handleDemoClick}
          >
            删除
          </UiButton>

          {/* disabled 真的落到了原生 button 上：按钮变灰、点击不触发 onClick。
              如果 UiButton 里忘了展开 rest，这个按钮照样能点——这就是 React 与 Vue 的分水岭 */}
          <UiButton disabled onClick={handleDemoClick}>
            已禁用（点击无反应）
          </UiButton>

          {/* type 也是原生属性，同时演示「rest 展开位置」这条规则：
              组件内部把 type="button" 写在 rest 展开之前，所以它只是默认值，
              外部这里传的 type="submit" 会把它覆盖掉（DevTools 里看到的 type 就是 submit；
              按钮不在 form 里，点了不会真提交）。若把 rest 展开挪到 type 前面，这里就永远覆盖不了 */}
          <UiButton type="submit" onClick={handleDemoClick}>
            type 被外部覆盖为 submit
          </UiButton>

          {/* 外部 className 与组件自己的 btn-primary 合并，而不是把它覆盖掉 */}
          <UiButton className="btn-ghost">className 被合并</UiButton>
        </div>
        <p className="muted">
          打开 DevTools 看最后一个按钮：class 上 btn-primary 和 btn-ghost 同时存在——
          组件把外部 className 合并了进来；若直接把 className 留在 rest 里展开，btn-primary 会被整个覆盖
        </p>
      </div>
    </div>
  )
}
