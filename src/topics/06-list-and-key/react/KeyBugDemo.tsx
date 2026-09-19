/**
 * 区块二：key 是列表项的身份 —— 用 id、用 index、用 Math.random() 三种 key，分别做「开头插入 / 末尾追加 / 删除第一行 / 重渲染」，看输入框里的备注跟着谁走。
 * - 【最常用】key 用数据自带的 id（INITIAL_ORDERS 的 o1、o2……，真实项目里是后端返回的主键）。
 * - 【常用】前端新建的数据在「创建的时候」生成 id 并存进数据（demoData.ts 的 createLocalOrder，crypto.randomUUID()），之后每次渲染 key 都不变。
 * - ❌ index（这个列表会在开头插入、会删除）、❌ Math.random()（渲染时生成）。
 * Vue 对照：vue/KeyBugDemo.vue（不写 :key 的就地更新、index、id、Math.random() 四种）。
 */
import { useState } from 'react'
import { ORDER_STATUS_TEXT } from '@/shared/types'
import { createLocalOrder, INITIAL_ORDERS } from './demoData'

type KeyMode = 'id' | 'index' | 'random'

const KEY_MODE_LABEL: Record<KeyMode, string> = {
  id: 'order.id（数据自带的 id）【最常用】',
  index: 'index ❌（开头插入 / 删除时错位）',
  random: 'Math.random() ❌（每次渲染都重建）',
}

export function KeyBugDemo() {
  const [orders, setOrders] = useState(INITIAL_ORDERS)
  const [keyMode, setKeyMode] = useState<KeyMode>('index')
  const [renderRound, setRenderRound] = useState(0)

  /**
   * 三种 key 各自的后果（测试覆盖）：
   * - order.id：key 跟着数据走，插入、删除之后 React 都能对上号（排序同理）（「They let us uniquely identify an item between its siblings.」），输入框的内容留在自己那一行。
   *   新插入的行的 id 是 createLocalOrder 在创建数据时生成的，存在数据里，重渲染时 key 不变，新行里的输入也留得住。
   * - index：官方 Pitfall ——「that's what React will use if you don't specify a key at all」，而且「the order in which you render items will change over time if an item is inserted,
   *   deleted, or if the array gets reordered」。开头插入一行后，原来第 0 行的 DOM 被当成新的第 0 行复用，备注跑到了新行上；只在末尾追加时已有的下标不变，不会错位
   *   （这就是 index 可以接受的前提，附 4）。
   * - Math.random()：「do not generate keys on the fly … This will cause keys to never match up between renders, leading to all your components and DOM being recreated every time.」
   *   连一次普通的重渲染都会把所有行重建，输入框里的字全丢。
   */
  function keyOf(order: (typeof orders)[number], index: number) {
    if (keyMode === 'id') return order.id
    if (keyMode === 'index') return index
    // eslint-disable-next-line react-hooks/purity -- 教学反例：lint 实测报「Cannot call impure function during render」，Math.random() 每次渲染结果都不同
    return Math.random()
  }

  return (
    <div className="card stack">
      <h3>区块二：key 是身份 —— id、index、Math.random() 的区别</h3>
      <p className="muted">先在前两行的备注框里各打几个字，再点下面的按钮，看备注还在不在自己那一行。</p>
      <p className="muted">
        「开头插入 / 末尾追加」的新行在创建数据时就生成了 id（createLocalOrder 里的 crypto.randomUUID()）【常用】，之后每次渲染 key 都不变。
      </p>
      <div className="row">
        <label className="row">
          key 用
          <select value={keyMode} onChange={(e) => setKeyMode(e.target.value as KeyMode)} aria-label="key 的取法">
            {(Object.keys(KEY_MODE_LABEL) as KeyMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {KEY_MODE_LABEL[mode]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <button onClick={() => setOrders((prev) => [createLocalOrder('新客户（开头）'), ...prev])}>开头插入一行</button>
        <button onClick={() => setOrders((prev) => [...prev, createLocalOrder('新客户（末尾）')])}>末尾追加一行</button>
        <button onClick={() => setOrders((prev) => prev.slice(1))}>删除第一行</button>
        <button onClick={() => setRenderRound((n) => n + 1)}>让列表重渲染（{renderRound}）</button>
        <button className="btn-ghost" onClick={() => setOrders(INITIAL_ORDERS)}>
          重置列表
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>状态</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={keyOf(order, index)}>
              <td>{order.orderNo}</td>
              <td>{order.customer}</td>
              <td>
                <span className={`badge badge-${order.status}`}>{ORDER_STATUS_TEXT[order.status]}</span>
              </td>
              <td>
                {/*
                  演示简化：备注输入框是非受控的（内容只存在 DOM 里），为了让「DOM 被错误复用」肉眼可见。
                  真实项目里备注是受控的、按 order.id 存在 state 里，就不会这样错位 —— 但错误的 key 仍会让组件内部 state、焦点、动画跟错行。
                */}
                <input placeholder="打几个字" aria-label={`${order.orderNo} 的备注`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p className="muted">订单删光了，点「重置列表」恢复</p>}
    </div>
  )
}
