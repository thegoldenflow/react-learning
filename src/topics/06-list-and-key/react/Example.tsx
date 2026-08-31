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
 * - key 还有第二种用法（不限于列表）：给同一个组件换一个 key，等于告诉 React「这是另一个东西」，
 *   旧实例连同它的 state / effect 一起卸载、新实例重新挂载 —— 这是官方推荐的
 *   「prop 变了要重置内部 state」解法：<EditForm key={selectedId} />
 *
 * Vue 对应概念：
 * - v-for="(order, index) in orders" + :key，diff 同样靠 key 匹配新旧节点
 * - :key 用 index 有一模一样的问题——这不是 React 特有的坑
 * - :key 变了同样会销毁重建组件实例、内部 state 全部丢弃；
 *   Vue 老手熟悉的 <router-view :key="$route.fullPath"> 就是这个手法
 *
 * 最重要的区别：
 * - 机制几乎一致，差别在写法：React 用 JS 的 .map()（key 是 React 保留属性，不会传给组件）；
 *   Vue 用模板指令 v-for + :key
 * - React 不写 key 会在控制台警告并退化为按 index 匹配；Vue 3 不写 :key 则默认「就地更新」策略
 * - 「换 key 重置组件状态」是少数两边机制、写法、心智模型都一模一样的知识点，可以放心平移
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

/** 子组件的 props：只收一个订单对象，草稿本身是它自己的内部 state */
interface OrderNoteEditorProps {
  order: Order
}

/**
 * 带内部 state 的子组件，专门用来演示「key 的第二种用法：强制重置组件状态」。
 * 注意它对「自己会不会被重置」一无所知——重置与否完全由父组件给不给 key 决定，
 * 这也是这个手法好用的原因：不用改子组件一行代码。
 * 它与父组件同文件——React 组件只是函数，一个文件放多个组件很常见；
 * Vue 对照版必须拆成单独的 vue/OrderNoteEditor.vue（SFC 一文件一组件）。
 */
function OrderNoteEditor({ order }: OrderNoteEditorProps) {
  // useState 的初始值只在「本实例挂载的那一次」求值，之后 props 再怎么变都不会重新跑。
  // ★ Vue 老手最容易想错的点：这不是 computed，也不是带 immediate 的 watch，
  //   props.order 换了一个订单，draft 纹丝不动。
  //   （其实 Vue 里 const draft = ref(props.order.customer) 也一样不会跟着 props 走，两边同理）
  const [draft, setDraft] = useState(() => `${order.customer}的备注：`)
  // 一个只读不写的 state，记录「本实例是为哪个订单挂载的」。
  // 它和 draft 一样只在挂载时求值一次，所以可以当成「实例身份证」：
  // 它 !== 当前 props.order.orderNo，就说明这个实例是被复用的旧实例。
  const [mountedFor] = useState(order.orderNo)
  const isFresh = mountedFor === order.orderNo

  return (
    <div className="stack">
      <span className="muted">
        当前 props.order：{order.orderNo}（{order.customer}）
      </span>
      <span className="muted">本实例挂载时对应的订单：{mountedFor}</span>
      {/* 受控 textarea：草稿存在组件的 state 里，正是这次要观察的「内部状态」 */}
      <textarea
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <span className={isFresh ? 'success-text' : 'error-text'}>
        {isFresh
          ? '实例是新挂载的：draft 已按新订单重新初始化'
          : `实例被复用：draft 还停留在 ${mountedFor} 的草稿上`}
      </span>
    </div>
  )
}

export default function Example() {
  const [orders, setOrders] = useState(initialOrders)
  // 默认用 index 作 key，方便你按下面的步骤先「亲手踩一次坑」
  const [useIndexKey, setUseIndexKey] = useState(true)

  // ↓ 下面这两行服务于「换 key 重置状态」区块。
  // 故意读常量 initialOrders 而不是可增删的 orders，让这个演示不受上面删除操作的干扰
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0].id)
  // 「选中的订单对象」可以由 selectedOrderId 直接算出来，就不要再存一份 state（第 9 题：派生状态）
  const selectedOrder = initialOrders.find((o) => o.id === selectedOrderId) ?? initialOrders[0]

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

      {/* ===== key 的第二种用法：不在列表里，而是用来强制重置一个组件的内部 state ===== */}
      <div className="card stack">
        <h3>换 key = 重置组件内部 state</h3>
        <ol>
          <li>先在下面两个「草稿备注」框里各改点内容（比如都加上「加急」）</li>
          <li>点下面那排按钮，切换到另一个订单</li>
          <li>【不换 key】那张：草稿原封不动残留着，还是上一个订单的内容 → 脏数据</li>
          <li>【换 key】那张：草稿自动重置成新订单的初始值 → 这才是想要的效果</li>
        </ol>
        <div className="row">
          <span className="muted">当前编辑的订单：</span>
          {/* 这排按钮本身也是列表渲染，key 用稳定唯一的 o.id，不用 index */}
          {initialOrders.map((o) => (
            <button
              key={o.id}
              className={o.id === selectedOrderId ? 'btn-primary' : undefined}
              onClick={() => setSelectedOrderId(o.id)}
            >
              {o.orderNo}
            </button>
          ))}
        </div>

        <div className="row" style={{ alignItems: 'stretch' }}>
          <div className="card stack" style={{ flex: '1 1 280px' }}>
            <strong className="error-text">【不换 key】state 残留</strong>
            <code>{'<OrderNoteEditor order={selectedOrder} />'}</code>
            {/*
              没有 key 时，React 按「同一父节点下的同一位置 + 同一组件类型」匹配新旧节点，
              判定「还是原来那个实例，只是 props 变了」→ 只更新 props，内部 state 原样保留。
              所以 draft 停在上一个订单的草稿上。
              这就是本题前半部分讲的同一套协调规则：位置/key 没变 = 复用实例。
            */}
            <OrderNoteEditor order={selectedOrder} />
          </div>

          <div className="card stack" style={{ flex: '1 1 280px' }}>
            <strong className="success-text">【换 key】state 归零</strong>
            <code>{'<OrderNoteEditor key={selectedOrder.id} order={selectedOrder} />'}</code>
            {/*
              key 变了 → React 判定「这不是刚才那个节点」：
              1) 卸载旧 Fiber：state 全部丢弃、effect 的清理函数执行、对应的 DOM 节点被删除；
              2) 挂载全新实例：useState 的初始值重新求值一次、effect 重新跑一遍。
              ★ 注意 key 在这里根本不在任何列表里——key 从来不是「列表专用属性」，
                它就是节点的身份标识；「列表里匹配新旧节点」和「换 key 强制重置」
                是同一个机制的两种用法，面试问到 key 时能把这两点串起来讲是加分项。
            */}
            <OrderNoteEditor key={selectedOrder.id} order={selectedOrder} />
          </div>
        </div>

        {/*
          ★ 面试高频题：「props 变了，子组件里那份由 props 派生的 state 要跟着重置，怎么写？」
          - 反模式：useEffect(() => setDraft(...), [order])
            —— 先用旧 state 渲染一帧、再 setState 触发第二次渲染，多一次无意义渲染甚至闪烁；
            React 官方《You Might Not Need an Effect》点名批评（第 10 题的 effect 反模式清单里有）。
          - 官方推荐解法：给子组件挂 key（本例）。一次渲染直接出正确结果，语义也更准确：
            这不是「同一个东西变了」，而是「换成了另一个东西」。
          - 再往前一步想：如果那份 state 本来就能由 props 直接算出来，那干脆别存 state，渲染时算（第 9 题）；
            如果父组件也要读到它，就把 state 提升到父组件（第 8 题）。
          ⚠ 别滥用：key 一变，整棵子树都会重置——滚动位置丢失、子组件里的 useEffect 重新发请求、
            过渡动画重放、输入框失焦。只在「它确实应该变成另一个东西」时用，别当成刷新页面的万能锤。
        */}
        <p className="muted">
          一张残留、一张归零——这就是「key 变化 = 卸载旧实例 + 挂载新实例」最直接的证据
        </p>
      </div>
    </div>
  )
}
