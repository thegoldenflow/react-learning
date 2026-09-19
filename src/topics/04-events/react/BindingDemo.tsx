/**
 * 区块一：绑定与传参 —— 传函数、不要调用；要传参就包一层箭头函数；处理函数与回调 prop 的命名约定。
 * 使用频率：【最常用】onClick={handleClick}、传参 onClick={() => remove(id)}；【常用】既要参数又要事件对象 onClick={(e) => remove(id, e)}。
 * Vue 对照：vue/BindingDemo.vue 与 vue/OrderRow.vue（模板里写「调用」是对的，例如 @click="emit('remove', item.id, $event.shiftKey)"，因为模板会被编译成函数）。
 */
import { useState, type MouseEvent } from 'react'
import type { OrderItem } from '@/shared/types'

const INITIAL_ITEMS: OrderItem[] = [
  { id: 'i1', name: '机械键盘', price: 399, quantity: 2 },
  { id: 'i2', name: '无线鼠标', price: 129, quantity: 2 },
  { id: 'i3', name: '显示器支架', price: 199, quantity: 1 },
]

interface OrderRowProps {
  item: OrderItem
  /**
   * 回调 prop 以 on 开头（官方约定「event handler props should start with on, followed by a capital letter」），
   * 名字按业务含义起：onRemove 而不是 onClick。子组件只报告「要删哪一行、是不是按着 Shift」，怎么删由父组件决定（08 题）。
   */
  onRemove: (id: string, onlyOne: boolean) => void
}

function OrderRow({ item, onRemove }: OrderRowProps) {
  return (
    <li className="row" data-testid={`row-${item.id}`}>
      <span>
        {item.name} × {item.quantity}
      </span>
      {/* 【最常用】传参包一层箭头函数：点击时才调用 onRemove(item.id, true)。Vue 对应 @click="remove(item.id)" */}
      <button onClick={() => onRemove(item.id, true)}>减一件</button>
      {/* 【常用】要用事件对象又要传参：(e) => onRemove(item.id, e.shiftKey)。Vue 对应 @click="remove(item.id, $event)" */}
      <button className="btn-danger" onClick={(e) => onRemove(item.id, e.shiftKey)}>
        删除（按住 Shift 只减一件）
      </button>
    </li>
  )
}

/**
 * ❌ 把「传函数」写成了「调用函数」：onClick={removeItem(item.id)}。
 * 渲染每一行时 removeItem 就被调用了（「JavaScript inside the JSX { and } executes right away」），在渲染期间更新自己的 state；
 * 这个更新会收敛（删光就不再删），所以不报错，只是列表一出现就被删光了（测试覆盖）。onClick 拿到的是 removeItem 的返回值 undefined，点击什么也不做。
 * TypeScript 会拦（void 不能当 onClick）；lint 在这里没报：set-state-in-render 只认组件体里无条件执行的 setState，这次调用发生在 items.map 的回调里
 * （eslint-plugin-react-hooks 7.1.1 实测；03 题区块七那种直接写在组件 return 里的 onClick={handleClick()} 会报）。
 * 同样的错写成 onClick={setCount(count + 1)} 就不收敛了，React 抛「Too many re-renders」（03 题区块七）。
 */
function BrokenList() {
  const [items, setItems] = useState(INITIAL_ITEMS)
  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }
  return (
    <ul className="stack" data-testid="broken-list">
      {items.map((item) => (
        <li key={item.id} className="row">
          {item.name}
          <button
            // @ts-expect-error -- 教学反例：Type 'void' is not assignable to type 'MouseEventHandler<HTMLButtonElement> | undefined'
            onClick={removeItem(item.id)}
          >
            删除
          </button>
        </li>
      ))}
      {items.length === 0 && <li className="muted">（一渲染就被删光了：渲染每一行时都调用了 removeItem）</li>}
    </ul>
  )
}

export function BindingDemo() {
  const [clicks, setClicks] = useState(0)
  const [lastPos, setLastPos] = useState('还没点过')
  const [items, setItems] = useState(INITIAL_ITEMS)
  const [showBroken, setShowBroken] = useState(false)

  /**
   * 处理函数命名 handle + 事件名（约定），定义在组件里，所以能读 props / state —— 读到的是这次渲染的值（23、26 题）。
   * 处理函数不必是纯函数：「Event handlers are the best place for side effects.」改 state、发请求、导航都写在这里。
   * 事件对象是唯一的参数，类型 MouseEvent<HTMLButtonElement> 从 react 导入（它会遮蔽浏览器全局的 MouseEvent，见 Example.tsx 二-9）。
   */
  function handleCountClick(e: MouseEvent<HTMLButtonElement>) {
    setClicks((c) => c + 1)
    setLastPos(`x=${Math.round(e.clientX)}, y=${Math.round(e.clientY)}`)
  }

  function handleRemove(id: string, onlyOne: boolean) {
    setItems((prev) =>
      onlyOne
        ? prev.flatMap((item) => (item.id !== id ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []))
        : prev.filter((item) => item.id !== id),
    )
  }

  return (
    <div className="card stack">
      <h3>区块一：绑定与传参 —— 传函数，不要调用</h3>
      <p className="muted">
        【最常用】onClick={'{handleClick}'}、传参包一层箭头函数 onClick={'{() => remove(id)}'}；【常用】既要参数又要事件对象 onClick={'{(e) => remove(id, e)}'}。
      </p>
      <div className="row">
        {/* ✅【最常用】传函数引用：onClick={handleCountClick}；点击时 React 调用它并传入事件对象 */}
        <button onClick={handleCountClick}>点击计数：{clicks}</button>
        <span className="muted" data-testid="last-pos">
          最后一次点击位置：{lastPos}
        </span>
      </div>
      <ul className="stack">
        {items.map((item) => (
          // ✅【最常用】传参包一层箭头函数（在 OrderRow 里）：点击时才执行。内联箭头每次渲染都是新函数，一般没问题；子组件用了 memo 或者它是 Effect 依赖时才考虑 useCallback（17 题）
          <OrderRow key={item.id} item={item} onRemove={handleRemove} />
        ))}
        {items.length === 0 && <li className="muted">商品已全部删除</li>}
      </ul>
      <div className="row">
        <button onClick={() => setItems(INITIAL_ITEMS)}>恢复商品</button>
        <button onClick={() => setShowBroken((v) => !v)}>{showBroken ? '收起' : '❌ 挂载写成 onClick={removeItem(item.id)} 的列表'}</button>
      </div>
      {showBroken && <BrokenList />}
    </div>
  )
}
