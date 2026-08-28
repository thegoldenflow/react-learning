/**
 * 学习主题：列表渲染与 key（.map() 对照 v-for，index 作 key 的坑）
 *
 * React 核心概念：
 * - 列表就是数组的 .map() 返回 JSX；key 写在 map 返回的「最外层元素」上
 * - key 是协调（reconciliation）时匹配新旧节点的身份标识：
 *   key 相同 → 复用并更新节点；key 变了 → 销毁旧节点、新建节点
 * - 用 index 作 key 时，删除/插入/排序会让 index「顶替」到别的数据上，
 *   节点被错误复用，DOM 状态（输入框内容、滚动位置、焦点）随之错位
 * - index 勉强可用的场景：纯展示、列表永不增删/重排、且没有内部状态
 *
 * Vue 对应概念：
 * - v-for="(order, index) in orders" + :key，diff 同样靠 key 匹配新旧节点
 * - :key 用 index 有一模一样的问题——这不是 React 特有的坑
 *
 * 最重要的区别：
 * - 机制几乎一致，差别在写法：React 用 JS 的 .map()（key 是 React 保留属性，不会传给组件）；
 *   Vue 用模板指令 v-for + :key
 * - React 不写 key 会在控制台警告并退化为按 index 匹配；Vue 3 不写 :key 则默认「就地更新」策略
 */
import { useState } from 'react'
import type { Order } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

// 用共享类型 Order 造 5 条常量数据作为初始 state
const initialOrders: Order[] = [
  { id: 'o1', orderNo: 'SO-1001', customer: '张伟', amount: 528, status: 'pending', createdAt: '2026-08-21', items: [] },
  { id: 'o2', orderNo: 'SO-1002', customer: '李娜', amount: 129, status: 'paid', createdAt: '2026-08-22', items: [] },
  { id: 'o3', orderNo: 'SO-1003', customer: '王强', amount: 2680, status: 'paid', createdAt: '2026-08-23', items: [] },
  { id: 'o4', orderNo: 'SO-1004', customer: '赵敏', amount: 88, status: 'cancelled', createdAt: '2026-08-24', items: [] },
  { id: 'o5', orderNo: 'SO-1005', customer: '陈静', amount: 456, status: 'pending', createdAt: '2026-08-25', items: [] },
]

export default function Example() {
  const [orders, setOrders] = useState(initialOrders)
  // 默认用 index 作 key，方便你按下面的步骤先「亲手踩一次坑」
  const [useIndexKey, setUseIndexKey] = useState(true)

  function removeOrder(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  return (
    <div className="stack">
      <div className="card stack">
        <h3>亲手观察 key 的 bug</h3>
        <ol>
          <li>保持「用 index 作 key」，在前两行的备注框里输入不同内容（如「加急」「送礼」）</li>
          <li>删除第一行 → 「加急」跑到了 SO-1002 的行里：备注错位了！</li>
          <li>点「重置列表」，切换成「用 id 作 key」，重复上面的操作 → 备注跟着行走，一切正常</li>
        </ol>
        <div className="row">
          <label>
            <input
              type="checkbox"
              checked={useIndexKey}
              onChange={(e) => setUseIndexKey(e.target.checked)}
            />
            用 index 作 key（错误示范）
          </label>
          <button onClick={() => setOrders(initialOrders)}>重置列表</button>
          <span className="muted">当前 key：{useIndexKey ? 'index' : 'order.id'}</span>
        </div>
      </div>

      <div className="card stack">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>金额</th>
              <th>状态</th>
              <th>备注（暴露 key 问题用）</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {/*
              列表渲染 = 数组 .map() 返回 JSX。Vue 对应 v-for="(order, index) in orders"。
              key 必须写在 map 返回的「最外层元素」（这里是 <tr>）上，写在内层无效。
              key 是 React 的保留属性：只给协调算法用，组件内部读不到它。
            */}
            {orders.map((order, index) => (
              // ★ 核心考点：key 是节点的「身份证」。
              // 用 order.id：删除第一行后，剩余行的 key 不变 → React 知道「o1 没了」，
              //   精确销毁 o1 那一行，其余行（连同各自的 DOM 输入框）原样复用。
              // 用 index：删除第一行后，原来 key=1 的行变成 key=0…… React 按 key 匹配，
              //   以为「key=0 的行还在，只是数据变了」→ 复用旧 DOM 只更新文本，
              //   而备注输入框是非受控的（状态存在 DOM 里），内容留在了原节点上 → 错位。
              // 所以 key 必须「稳定且唯一」：稳定 = 同一条数据每次渲染 key 不变（key 变化 = 销毁重建）；
              // 唯一 = 兄弟之间不重复。index 只有在纯展示、永不增删/重排时勉强可用。
              <tr key={useIndexKey ? index : order.id}>
                <td>{order.orderNo}</td>
                <td>{order.customer}</td>
                <td>¥{order.amount}</td>
                <td>
                  <span className={`badge badge-${order.status}`}>
                    {ORDER_STATUS_TEXT[order.status]}
                  </span>
                </td>
                <td>
                  {/*
                    这个输入框故意「非受控」（没有 value/onChange，内容只存在 DOM 里），
                    正是为了让「节点被错误复用」肉眼可见。
                    实际项目中备注通常是受控的、按 order.id 存放，就不会这样错位——
                    但错误的 key 依然会引发焦点丢失、动画错乱、组件内部状态串行等问题。
                  */}
                  <input placeholder="输入备注后再删除第一行" />
                </td>
                <td>
                  {/* 传参要包箭头函数（见第 4 题）：onClick={removeOrder(order.id)} 会在渲染时立即执行 */}
                  <button className="btn-danger" onClick={() => removeOrder(order.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="muted">订单已删光，点上面的「重置列表」恢复</p>}
      </div>
    </div>
  )
}
