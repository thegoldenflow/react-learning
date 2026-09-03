/**
 * 学习主题：不可变数据更新 —— 两框架状态模型的核心差异
 *
 * React 核心概念：
 * - React 不追踪「你改了什么」：setState 后用 Object.is 比较新旧引用来决定要不要重渲染，
 *   所以更新必须「造新对象」—— 改哪个字段，从它到根的每一层都要换新引用
 * - 三大数组模式：map 改一项、filter 删一项、[...arr, item] 追加
 * - 反例：order.items[0].quantity++ 引用没变 → React 认为「没变化」→ 不重渲染
 * - 引用比较是整个 React 优化体系的地基：memo 的 props 浅比较、useEffect/useMemo 的
 *   依赖数组比较，全靠「变化必换引用」这条约定才成立
 * - 本题是 03 题「不可变更新」规则的系统化：03 题只在一层数组上 map / filter，这里把对象展开、
 *   嵌套更新、数组追加 / 删除等五种模式一次讲全
 * - 深嵌套更新繁琐是真实痛点，工业界常用 Immer（useImmer）「以可变写法生成不可变更新」（本课不引入）
 *
 * Vue 对应概念：
 * - reactive 对象直接 mutate：Proxy 拦截 set，写入那一刻就精准知道谁变了、只更新依赖它的地方
 * - 没有「每层新引用」的负担：push / splice / 直接赋值都是惯用写法
 *
 * 最重要的区别：
 * - 变更检测的哲学：React 是「拉」—— 不监听数据，靠你换引用、它来比较发现变化；
 *   Vue 是「推」—— Proxy 在写入时就通知订阅者。这是两框架最根本的分歧：
 *   React 的不可变约定、Vue 的响应式系统，都源于这一设计选择。
 */
import { useRef, useState } from 'react'
import type { Order, OrderItem, OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

const INITIAL_ORDER: Order = {
  id: 'o1',
  orderNo: 'SO-2026-0001',
  customer: '张伟',
  amount: 557,
  status: 'pending',
  createdAt: '2026-08-28',
  items: [
    { id: 'it-1', name: '机械键盘', price: 299, quantity: 1 },
    { id: 'it-2', name: '无线鼠标', price: 129, quantity: 2 },
  ],
}

/** 客户名轮换（点一次换一个，纯演示用） */
function nextCustomer(current: string): string {
  const names = ['张伟', '王芳', '李娜']
  const idx = names.indexOf(current)
  return names[(idx + 1) % names.length] ?? '张伟'
}

/** 状态流转：pending → paid → cancelled → pending */
const NEXT_STATUS: Record<OrderStatus, OrderStatus> = {
  pending: 'paid',
  paid: 'cancelled',
  cancelled: 'pending',
}

/** 追加 item 时轮换的商品模板 */
const PRODUCT_POOL = [
  { name: '显示器支架', price: 199 },
  { name: 'USB 扩展坞', price: 249 },
  { name: '降噪耳机', price: 899 },
]

export default function Example() {
  // 初始值用 structuredClone 深拷贝：下面的「反例按钮」会真的 mutate 这个对象，
  // 不拷贝的话会把模块级常量 INITIAL_ORDER 也改脏
  const [order, setOrder] = useState<Order>(() => structuredClone(INITIAL_ORDER))

  // 新 item 的自增序号：不参与渲染的可变值放 useRef（12 题讲过）。
  // Vue 版对照：setup 只跑一次，一个普通 let 变量就够了
  const nextItemSeq = useRef(3)

  /**
   * 模式一：对象展开改顶层字段。
   * { ...prev, customer: xxx } —— 最外层是新对象，改的字段覆盖，其余字段照抄（浅拷贝）。
   * Vue 版对照：order.customer = xxx 一行完事，Proxy 拦截这次赋值。
   */
  const renameCustomer = () => {
    setOrder((prev) => ({ ...prev, customer: nextCustomer(prev.customer) }))
  }

  /**
   * 模式二：嵌套更新（改数组里某个对象的字段）—— 面试手写题的最高频考点。
   * 规则：从根到被改字段，【每一层都要新引用】：
   *   新 order 对象（展开）→ 新 items 数组（map 返回新数组）→ 目标 item 的新对象（展开）。
   * 没被改的 item 由 map 原样返回 —— 引用复用，配合 memo 时这些行不会重渲染。
   * 这正是深嵌套让人头疼的原因，也是 Immer 流行的原因。
   */
  const increaseQuantity = (itemId: string) => {
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, quantity: it.quantity + 1 } : it,
      ),
    }))
  }

  /**
   * 模式三：数组追加 —— [...prev.items, newItem]，而不是 push（push 改的是原数组）。
   * 注意：newItem 的 id 在事件处理器里生成，而不是在 setOrder 的更新函数里 ——
   * 更新函数必须是纯函数（StrictMode 开发期会调用它两次来暴露副作用），
   * 在里面 ++ 会导致序号跳号。
   */
  const appendItem = () => {
    const seq = nextItemSeq.current++
    const template = PRODUCT_POOL[seq % PRODUCT_POOL.length] ?? { name: '新商品', price: 99 }
    const newItem: OrderItem = { id: `it-${seq}`, name: template.name, price: template.price, quantity: 1 }
    setOrder((prev) => ({ ...prev, items: [...prev.items, newItem] }))
  }

  /**
   * 模式四：数组删一项 —— filter 返回不含目标项的新数组（而不是 splice 改原数组）。
   */
  const removeItem = (itemId: string) => {
    setOrder((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== itemId) }))
  }

  /**
   * 模式五：还是对象展开，字段值来自映射表 —— 状态机式流转的常见写法。
   */
  const toggleStatus = () => {
    setOrder((prev) => ({ ...prev, status: NEXT_STATUS[prev.status] }))
  }

  /**
   * ❌ 反例：直接 mutate。点这个按钮页面【不会有任何反应】——
   * quantity 确实 ++ 了，但 order 的引用没变，也没有 setState 触发渲染流程；
   * 就算补一句 setOrder(order)，传入的还是同一个引用，Object.is(prev, next) 为 true，
   * React 直接跳过重渲染。这就是「为什么 React 里改 state 必须造新对象」的直观答案。
   *
   * 更隐蔽的坑：点完反例再点任意正常按钮，你会发现数量「凭空」多了 1 ——
   * 数据早就被改了，只是 UI 一直没跟上。数据与 UI 不同步、难以排查，正是 mutate 的危害。
   *
   * Vue 版对照：一模一样的代码在 Vue 里是【正确写法】——Proxy 拦截 set，改完立即精准更新。
   */
  const badMutate = () => {
    const first = order.items[0]
    if (first) first.quantity++ // 改了数据，但 React 毫不知情
  }

  return (
    <div className="stack">
      <p className="muted">
        点按钮并观察下方 JSON：React 的每次更新都产生一棵「新对象树」（只有被改路径上的节点是新的）；
        点「反例」按钮页面不动，再点任意正常按钮会发现数量偷偷变了
      </p>

      <div className="row">
        <button onClick={renameCustomer}>改客户名（对象展开）</button>
        <button onClick={appendItem}>追加 item（[...arr, item]）</button>
        <button onClick={toggleStatus}>
          切换状态（当前：{ORDER_STATUS_TEXT[order.status]}）
        </button>
        <button className="btn-danger" onClick={badMutate}>
          反例：直接 mutate（点了没反应）
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>商品</th>
            <th>单价</th>
            <th>数量</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it) => (
            <tr key={it.id}>
              <td>{it.name}</td>
              <td>¥{it.price}</td>
              <td>{it.quantity}</td>
              <td className="row">
                <button onClick={() => increaseQuantity(it.id)}>数量 +1（map 改一项）</button>
                <button className="btn-danger" onClick={() => removeItem(it.id)}>
                  删除（filter）
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 实时展示整个 state 对象，肉眼确认每次操作后的新数据。
          注意 amount 是订单上的静态字段，本题不让它随 items 联动，别被 JSON 里对不上的合计迷惑 */}
      <pre>{JSON.stringify(order, null, 2)}</pre>
    </div>
  )
}
