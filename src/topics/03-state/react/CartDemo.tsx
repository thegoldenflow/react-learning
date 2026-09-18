/**
 * 区块三：对象 / 数组 state 要整体替换 —— 造新数组、新对象交给 setter；原地改 + 传回同一个引用，React 会跳过。
 * 五种不可变更新模式（对象展开、嵌套、追加、删除、Immer）的系统讲解在 21 题。
 * Vue 对照：vue/CartDemo.vue（直接改 item.quantity 就更新）。
 */
import { useState } from 'react'
import type { CartItem } from '@/shared/types'

const INITIAL_ITEMS: CartItem[] = [
  { id: 'p1', name: '机械键盘', price: 399, quantity: 1 },
  { id: 'p2', name: '无线鼠标', price: 129, quantity: 2 },
  { id: 'p3', name: '显示器支架', price: 259, quantity: 1 },
]

export function CartDemo() {
  /**
   * 初始值只在首次渲染时被采用，之后 state 自己演化。
   * 演示简化：这里先拷一份再交给 useState（惰性初始化，区块四），只是因为下面的 ❌ 按钮会原地改对象 —— 不拷的话，第一次渲染的 state 就是
   * INITIAL_ITEMS 本身，❌ 按钮改到的是这个模块常量，切走再回来初始数量已经变了。全部用不可变更新的代码不需要这一步。
   * 类型写全：useState<CartItem[]>(…)。初始值是 [] 的时候尤其要写，否则推断成 never[]。
   */
  const [items, setItems] = useState<CartItem[]>(() => INITIAL_ITEMS.map((item) => ({ ...item })))

  /**
   * ✅ map 造新数组；被改的那一项用展开造新对象，其余项原样复用引用。
   * 这里用更新函数 setItems(prev => …)：只更新一次时写 setItems(items.map(…)) 结果一样；
   * 同一个事件里要连续更新、或者在异步回调里更新时，更新函数才会有区别（区块二、24 题）。
   */
  function changeQuantity(id: string, delta: number) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)))
  }

  /** ✅ filter 天然返回新数组 */
  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  /**
   * ❌ Vue 的写法搬进 React：找到那一项直接改，再把同一个数组交给 setter。
   * - 数据确实变了，但 items 还是同一个引用：Object.is 相同 → React 跳过这次重渲染，界面不动；
   * - 更糟的是之后任何一次重渲染（比如点别的商品的 +）都会把改过的值带出来 —— 界面和你的操作对不上（测试覆盖）；
   * - 旧的那一帧数据也被改了：依赖「上一次的 state」的东西（撤销、对比、memo 的浅比较，17 / 21 题）全部失灵。
   * lint 能拦下 items[0].quantity++、user.age = 2 这种直接写法（react-hooks/immutability「Modifying a value returned from 'useState()'」），
   * 但像这里经过 find() 拿到的对象再改、或 items.push()，eslint-plugin-react-hooks 7.1.1 实测都拦不住 —— 规则是兜底，不是保证。
   */
  function mutateInPlace(id: string) {
    const item = items.find((it) => it.id === id)
    if (item) item.quantity += 1
    setItems(items)
  }

  /**
   * 派生值不另开 state：每次渲染重新算（UI = f(state)，09 题）。Vue 里对应 computed。
   */
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="card stack">
      <h3>区块三：对象 / 数组 state 要整体替换</h3>
      <p className="muted">先点某一行的「❌ 原地 +1」：界面不动；再点另一行的 +，刚才那一行的数量才「突然」变了。</p>
      {items.map((item) => (
        <div key={item.id} className="row" data-testid={`cart-row-${item.id}`}>
          <strong>{item.name}</strong>
          <span className="muted">￥{item.price.toFixed(2)}</span>
          <button disabled={item.quantity === 1} onClick={() => changeQuantity(item.id, -1)}>
            -
          </button>
          <span>{item.quantity} 件</span>
          <button onClick={() => changeQuantity(item.id, 1)}>+</button>
          <button onClick={() => mutateInPlace(item.id)}>❌ 原地 +1</button>
          <button className="btn-danger" onClick={() => removeItem(item.id)}>
            移除
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="muted">购物车空了</p>}
      <p>
        合计 <strong data-testid="cart-total-count">{totalCount}</strong> 件，总价{' '}
        <strong className="success-text">￥{totalPrice.toFixed(2)}</strong>
      </p>
    </div>
  )
}
