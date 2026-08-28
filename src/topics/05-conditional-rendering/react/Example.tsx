/**
 * 学习主题：条件渲染（三元、&&、提前 return / switch、映射对象）
 *
 * React 核心概念：
 * - JSX 没有指令，条件渲染就是普通 JavaScript：三元表达式、&& 短路、if / switch 提前 return
 * - 分支多时工业界常用 switch 辅助函数（或子组件）以及「状态 → 内容」的映射对象
 * - && 的经典陷阱：左侧是数字 0 时，JSX 会把 0 渲染到页面上（false/null/undefined 才不渲染）
 *
 * Vue 对应概念：
 * - v-if / v-else-if / v-else 模板指令描述分支；v-show 只切换 display，DOM 一直在
 * - v-if 对任何 falsy 值（包括 0）都不渲染，没有 0 陷阱
 *
 * 最重要的区别：
 * - Vue 用模板指令描述分支；React 用 JS 本身的控制流，JSX 只是表达式
 * - {count && <X/>} 在 React 会把 0 渲染出来；正确写法是 count > 0 && <X/>
 * - v-show 在 React 没有指令对应物（没有一一对应关系），要手动用 style 的 display 控制
 */
import { useState } from 'react'
import type { OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

/**
 * 三种状态对应三种「完全不同的 UI」：分支多时，工业界常抽成一个小组件（或辅助函数），
 * 用 switch + return 表达，比嵌套三元清晰得多。
 * 注意：React 允许一个 .tsx 文件里放多个组件（这本身就是与 Vue「一文件一组件」的差异）；
 * Vue 里同样的三分支直接用 v-if / v-else-if / v-else 模板指令就地表达，不需要子组件。
 */
function StatusPanel({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'pending':
      return (
        <div className="stack">
          <p className="error-text">订单待支付，请在 30 分钟内完成付款</p>
          <p className="muted">超时未支付将自动取消</p>
        </div>
      )
    case 'paid':
      return (
        <div className="stack">
          <p className="success-text">支付成功！</p>
          <p className="muted">商品将在 48 小时内发出</p>
        </div>
      )
    case 'cancelled':
      return (
        <div className="stack">
          <p className="muted">订单已取消</p>
        </div>
      )
  }
}

export default function Example() {
  const [status, setStatus] = useState<OrderStatus>('pending')
  const [itemCount, setItemCount] = useState(3)
  const [showDetail, setShowDetail] = useState(true)

  return (
    <div className="stack">
      <div className="card stack">
        <h3>
          订单状态{' '}
          {/*
            「映射对象」也是一种条件渲染：多分支只是取不同文案/样式时，
            用 Record<状态, 文案> 查表比 if/三元链清晰。Vue 里同样可以查表，
            这一点两边写法一致（ORDER_STATUS_TEXT 是共享常量）。
          */}
          <span className={`badge badge-${status}`}>{ORDER_STATUS_TEXT[status]}</span>
        </h3>

        {/* 切换状态的按钮组：当前状态的按钮禁用 */}
        <div className="row">
          <button disabled={status === 'pending'} onClick={() => setStatus('pending')}>
            设为待支付
          </button>
          <button disabled={status === 'paid'} onClick={() => setStatus('paid')}>
            设为已支付
          </button>
          <button disabled={status === 'cancelled'} onClick={() => setStatus('cancelled')}>
            设为已取消
          </button>
        </div>

        {/* 三分支的「完全不同 UI」交给上面的 switch 子组件。Vue 对应 v-if / v-else-if / v-else */}
        <StatusPanel status={status} />

        {/* 二选一用「三元表达式」最直接。Vue 里模板插值同样可以写三元 */}
        <p>支付进度：{status === 'paid' ? '已完成' : '未完成'}</p>

        {/*
          只有「渲染 / 不渲染」两种情况时用 && 短路最简洁。
          Vue 对应 v-if="status === 'cancelled'"。
        */}
        {status === 'cancelled' && (
          <p className="muted">已取消的订单可在 24 小时内联系客服恢复</p>
        )}
      </div>

      <div className="card stack">
        <h3>&& 的 0 陷阱</h3>
        <div className="row">
          <button onClick={() => setItemCount(0)}>清空商品（数量设为 0）</button>
          <button onClick={() => setItemCount(3)}>恢复为 3 件</button>
        </div>

        {/*
          ★ 反例（面试高频）：{itemCount && <p>…</p>}
          && 短路返回的是「左操作数本身」：itemCount 为 0 时表达式的值是数字 0，
          而 JSX 会渲染数字（包括 0），只有 false/null/undefined 才不渲染——
          于是页面上凭空多出一个「0」。下面这行故意保留了错误写法，清空商品后亲眼看看：
        */}
        <div>
          反例的渲染结果：{itemCount && <span>购物车共 {itemCount} 件商品</span>}
        </div>

        {/* ✅ 正确写法：把左侧变成布尔值（itemCount > 0，或 !!itemCount / Boolean(itemCount)） */}
        <div>
          正确的渲染结果：{itemCount > 0 && <span>购物车共 {itemCount} 件商品</span>}
        </div>
        <p className="muted">
          Vue 的 v-if="itemCount" 没有这个陷阱：任何 falsy 值都直接不渲染
          ——这是 React 特有的坑，Vue 中没有一一对应关系。
        </p>
      </div>

      <div className="card stack">
        <h3>「隐藏但保留 DOM」：对应 v-show</h3>
        <button onClick={() => setShowDetail((s) => !s)}>
          {showDetail ? '隐藏' : '显示'}订单详情
        </button>
        {/*
          React 没有 v-show 指令（没有一一对应关系）：想要「DOM 保留、只是隐藏」，
          只能手动控制 style 的 display。与上面的条件渲染不同：
          条件渲染（三元 / &&）= v-if，会真正卸载/挂载节点；这里 DOM 始终存在。
          频繁切换且初始化开销大的内容适合这种方式。
        */}
        <div style={{ display: showDetail ? 'block' : 'none' }}>
          <p>订单号：SO-20260828-001</p>
          <p>收货地址：上海市浦东新区张江高科技园区</p>
          <p className="muted">（打开浏览器 DevTools 看：隐藏时这段 DOM 依然存在）</p>
        </div>
      </div>
    </div>
  )
}
