/**
 * 学习主题：State（useState 与不可变更新 —— React 与 Vue 最核心的思维差异）
 *
 * React 核心概念：
 * - useState(初始值) 返回 [当前值, setter] 二元组，用数组解构自由命名
 * - 绝不直接修改 state：items[0].quantity++ 不会触发任何更新（引用没变，React 察觉不到）
 * - 更新 = 用 setter 传入「新引用」：数组用 map/filter 造新数组，对象用 { ...旧对象, 字段: 新值 }
 * - setter 两种用法：setX(新值) 与 setX(prev => 新值)；新值依赖旧值时必须用函数式
 * - setter 调用后 React 用 Object.is 对比新旧值：不同 → 重新执行整个组件函数生成新 UI
 *
 * Vue 对应概念：
 * - ref() / reactive() 创建响应式数据，直接改（item.quantity++）就能触发更新
 * - Vue 用 Proxy 拦截读写：渲染时「读」到谁就依赖谁，「写」时精准通知用到它的地方更新
 *
 * 最重要的区别：
 * - Vue：可变数据 + 自动依赖追踪 ——「改了就更新」，框架帮你找到最小更新范围；
 * - React：不可变数据 + 显式 setState ——「换了引用才更新」，更新方式是整个组件函数重跑。
 *   把 Vue 的「直接改对象」习惯带进 React 是新手第一大坑，本题注释请逐条读完。
 */
import { useState } from 'react'
import type { CartItem } from '@/shared/types'

/** 初始数据：只在「首次渲染」时被 useState 采用，之后 state 自己独立演化 */
const INITIAL_ITEMS: CartItem[] = [
  { id: 'p1', name: '机械键盘', price: 399, quantity: 1 },
  { id: 'p2', name: '无线鼠标', price: 129, quantity: 2 },
  { id: 'p3', name: '显示器支架', price: 259, quantity: 1 },
]

export default function Example() {
  /**
   * useState 返回 [值, setter] 二元组，对应 Vue 的 const items = ref([...])。
   * 逐项对比：
   * - 读：React 直接用 items；Vue 在 <script> 里要 items.value（模板里自动解包）
   * - 写：React 只能调 setItems(新数组)；Vue 直接改 items.value 或改里面的对象
   * 为什么 React 要拆成两个东西？因为 items 只是普通数组（没有 Proxy 包装），
   * React 根本「监听」不到你的修改——它得知状态变化的唯一途径，就是你显式调用 setter。
   *
   * 面试考点：为什么 setState 会触发重新渲染？
   * setItems(next) → React 用 Object.is(next, 旧值) 对比 → 引用不同 → 标记组件脏 →
   * 重新执行整个 Example 函数，拿到新 JSX，diff 后更新 DOM。
   * Vue 则是 Proxy 依赖追踪：改哪个属性，只有依赖那个属性的渲染副作用会重新执行，
   * 粒度比 React「整个组件函数重跑」精细得多。
   */
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS)

  /**
   * ❌ 新手第一大坑（从 Vue 来的你必看）：直接改 state 无效！
   *
   *   const brokenPlus = (id: string) => {
   *     const item = items.find(it => it.id === id)
   *     if (item) item.quantity++   // Vue 里这样写完全 OK，React 里 UI 纹丝不动
   *   }
   *
   * 为什么无效：quantity 确实变了，但 items 这个数组的「引用」没变，
   * 而 React 不做任何依赖追踪。即使你补一句 setItems(items)（传回同一个引用），
   * React 用 Object.is 一比：新旧是同一个引用 → 认为「没变」→ 跳过渲染。
   * 结论：必须造一个「新数组/新对象」交给 setter，这就是「不可变更新」。
   */

  /** ✅ 正确写法：map 造新数组；被改的那一项用展开语法造新对象，其余项原样复用引用 */
  const changeQuantity = (id: string, delta: number) => {
    // 函数式更新 setItems(prev => ...)：新状态依赖旧状态时必须这么写。
    // 直接写 setItems(items.map(...)) 这里也能跑，但闭包里的 items 是「本次渲染的快照」：
    // 若同一事件里连续 setItems 两次、或在异步回调里更新，拿到的都是过期旧值，
    // 后一次会把前一次覆盖掉；prev 参数由 React 保证永远是最新状态，稳赢。
    // Vue 没有这个问题：items.value 永远指向那个响应式对象本身，不存在「过期快照」。
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? // 不可变更新套路：{ ...旧对象, 要改的字段: 新值 }；Math.max 保证最少 1 件
            { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    )
  }

  /** 整件移除：filter 天然返回新数组，正好满足「换新引用」的要求 */
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  /**
   * 派生值不需要（也不应该）再开一个 state！
   * 每次 setItems 后整个 Example 函数重跑，下面两行自动重新计算——这就是 UI = f(state)。
   * Vue 的 setup 只执行一次，派生值必须用 computed 包起来；
   * React 的组件函数每次渲染完整重跑，普通 const 就是「天然的 computed」。
   */
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="stack">
      <p className="muted">购物车：+/- 调整数量（最少 1 件），可整件移除</p>

      {/* 列表渲染就是 items.map(...) —— 对应 Vue 的 v-for；key 要用稳定唯一的 id（07 题详讲） */}
      {items.map(item => (
        <div key={item.id} className="card">
          <div className="row">
            <strong>{item.name}</strong>
            <span className="muted">单价 ￥{item.price.toFixed(2)}</span>
          </div>
          <div className="row">
            {/* quantity 为 1 时禁用减号，保证「最少 1 件」 */}
            <button disabled={item.quantity === 1} onClick={() => changeQuantity(item.id, -1)}>
              -
            </button>
            <span>{item.quantity} 件</span>
            <button onClick={() => changeQuantity(item.id, 1)}>+</button>
            <button className="btn-danger" onClick={() => removeItem(item.id)}>
              移除
            </button>
          </div>
        </div>
      ))}

      {items.length === 0 && <p className="muted">购物车空了，去逛逛吧</p>}

      <p>
        合计 <strong>{totalCount}</strong> 件，总价{' '}
        <strong className="success-text">￥{totalPrice.toFixed(2)}</strong>
      </p>
    </div>
  )
}
