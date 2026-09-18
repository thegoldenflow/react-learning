/**
 * 区块一：条件渲染就是 JavaScript —— if / switch 提前 return、return null、把 JSX 存进变量、三元、&&、查表。
 * Vue 对照：vue/BranchStylesDemo.vue（v-if / v-else-if / v-else、<template v-if>）。
 */
import { useState, type ReactNode } from 'react'
import type { OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

/**
 * 写法一：if / switch 里各自 return 一棵 JSX 树（「In React, control flow (like conditions) is handled by JavaScript.」）。
 * 三个分支是三块完全不同的 UI，抽成一个小组件用 switch 表达，比嵌套三元清楚（官方：「consider extracting child components to clean things up」）。
 * 注意 Hooks 要写在所有提前 return 之前（「before any early returns」，14 题）。
 */
function StatusPanel({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'pending':
      return <p className="error-text">订单待支付，请在 30 分钟内完成付款</p>
    case 'paid':
      return <p className="success-text">支付成功，商品将在 48 小时内发出</p>
    case 'cancelled':
      return <p className="muted">订单已取消</p>
  }
}

/**
 * 写法二：return null —— 组件什么都不渲染。官方提醒：「In practice, returning null from a component isn't common because it might surprise a developer
 * trying to render it. More often, you would conditionally include or exclude the component in the parent component's JSX.」
 * 这里为了演示才这样写；更常见的是父组件里写 {status === 'cancelled' && <RestoreHint />}（见下面的 &&）。
 */
function RestoreHint({ status }: { status: OrderStatus }) {
  if (status !== 'cancelled') return null
  return <p className="muted">已取消的订单可在 24 小时内联系客服恢复</p>
}

export function BranchStylesDemo() {
  const [status, setStatus] = useState<OrderStatus>('pending')

  /**
   * 写法三：把 JSX 存进变量，再用 if 改写 —— 「This style is the most verbose, but it's also the most flexible.」
   * 适合条件多、又要在 JSX 里多处用到的场景；类型写 ReactNode（字符串、数字、JSX、null 都行，28 题）。
   */
  let payHint: ReactNode = '请尽快付款'
  if (status === 'paid') payHint = <strong>无需操作</strong>
  else if (status === 'cancelled') payHint = null

  return (
    <div className="card stack">
      <h3>
        区块一：条件渲染就是 JavaScript{' '}
        {/* 写法六：查表。多分支只是取不同文案 / 样式时，Record<状态, 文案> 比 if 链清楚（ORDER_STATUS_TEXT 是 React、Vue 共用的常量） */}
        <span className={`badge badge-${status}`} data-testid="status-badge">
          {ORDER_STATUS_TEXT[status]}
        </span>
      </h3>
      <div className="row">
        {(['pending', 'paid', 'cancelled'] as const).map((s) => (
          <button key={s} disabled={status === s} onClick={() => setStatus(s)}>
            设为{ORDER_STATUS_TEXT[s]}
          </button>
        ))}
      </div>
      <StatusPanel status={status} />
      {/* 写法四：三元，二选一。和 if 写法「completely equivalent」—— JSX 元素只是描述，不是实例（区块三讲这句话的后果） */}
      <p data-testid="progress">支付进度：{status === 'paid' ? '已完成' : '未完成'}</p>
      {/* 写法三的变量用花括号插进来；变量是 null 时什么都不渲染 */}
      <p data-testid="pay-hint">提示：{payHint}</p>
      {/* 写法五：&&，渲染或者不渲染。左边是布尔值才安全（区块二） */}
      {status === 'cancelled' && <p className="muted">（&& 分支）这张订单不会再扣款</p>}
      <RestoreHint status={status} />
    </div>
  )
}
