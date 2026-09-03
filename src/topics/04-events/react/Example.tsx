/**
 * 学习主题：事件处理（onClick、事件对象、传参、冒泡与默认行为）
 *
 * React 核心概念：
 * - 事件用 camelCase 属性绑定：onClick={handler}，绑定的是「函数引用」，不是函数调用
 * - 给处理函数传参必须包一层箭头函数：onClick={() => handler(id)}
 * - 事件对象是 SyntheticEvent（React 对原生事件的跨浏览器包装），
 *   类型写作 React.MouseEvent<HTMLButtonElement>
 * - React 没有事件修饰符，阻止冒泡/默认行为要在处理函数里手动调用
 *   e.stopPropagation() / e.preventDefault()
 *
 * Vue 对应概念：
 * - @click="handler" 绑定事件；模板里 @click="handler(item.id)" 可以直接写「调用」，
 *   Vue 编译器会把它包成内联函数
 * - $event 就是原生 DOM 事件对象
 * - 修饰符 .stop / .prevent / .once / .self 声明式处理冒泡与默认行为
 *
 * 最重要的区别：
 * - onClick={handler(id)} 会在「每次渲染时」立即执行 handler——经典新手坑；
 *   Vue 模板里同样的写法却是对的，因为模板会被编译、而 JSX 只是普通 JS 表达式
 * - Vue 的事件修饰符在 React 中没有一一对应关系，.stop/.prevent 全部要手写在处理函数里
 */
// MouseEvent 这里从 'react' 导入的是 React 的合成事件类型（很多代码写作 React.MouseEvent），
// 它会遮蔽浏览器全局的同名 DOM MouseEvent——两者不是一回事，前者是后者的跨浏览器包装。
// verbatimModuleSyntax 开启时，只作类型用的导入必须写 type。
import { useState, type MouseEvent } from 'react'
import type { OrderItem, OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

const initialItems: OrderItem[] = [
  { id: 'i1', name: '机械键盘', price: 399, quantity: 1 },
  { id: 'i2', name: '无线鼠标', price: 129, quantity: 2 },
  { id: 'i3', name: '显示器支架', price: 199, quantity: 1 },
]

export default function Example() {
  const [count, setCount] = useState(0)
  const [lastPos, setLastPos] = useState('还没点过')
  const [items, setItems] = useState(initialItems)
  const [status, setStatus] = useState<OrderStatus>('pending')
  const [cardClicks, setCardClicks] = useState(0)
  const [linkMsg, setLinkMsg] = useState('')

  // 事件对象参数：类型是 React.MouseEvent<泛型 = 触发元素>。
  // 面试考点：这是 SyntheticEvent（合成事件）——React 对原生事件的跨浏览器包装，
  // 常用属性（clientX、target、currentTarget…）与原生一致。Vue 里拿到的直接就是原生 $event。
  function handleCountClick(e: MouseEvent<HTMLButtonElement>) {
    setCount((c) => c + 1)
    setLastPos(`x=${e.clientX}, y=${e.clientY}`)
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // 需要阻止冒泡时，只能在处理函数里手动调 e.stopPropagation()。
  // Vue 里这一步是修饰符 @click.stop="toggleStatus"——React 没有修饰符（没有一一对应关系）。
  function toggleStatus(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation() // 不让这次点击冒泡到外层卡片的 onClick（可对比删除按钮：它会冒泡）
    setStatus((s) => (s === 'pending' ? 'paid' : 'pending'))
  }

  // 阻止默认行为同理：手动 e.preventDefault()。Vue 对应 @click.prevent。
  function handleFakeLink(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault() // 阻止 <a> 跳转；注意它仍会冒泡（preventDefault 只管默认行为）
    setLinkMsg('已拦截跳转，改为在本页查看发票（演示 preventDefault）')
  }

  function handleCardClick() {
    setCardClicks((c) => c + 1)
  }

  return (
    // 整个卡片绑定了 onClick：内部任何点击都会「冒泡」到这里，
    // 除非某个按钮自己 stopPropagation()。点点看各个按钮，观察下面的冒泡计数。
    <div className="card stack" onClick={handleCardClick}>
      <h3>
        订单卡片{' '}
        <span className={`badge badge-${status}`}>{ORDER_STATUS_TEXT[status]}</span>
      </h3>
      <p className="muted">卡片捕获到的冒泡点击：{cardClicks} 次</p>

      {/*
        基本绑定：onClick={handleCountClick} —— camelCase 属性 + 函数「引用」。
        千万不要写 onClick={handleCountClick()}：加了括号就是在渲染时立即调用，
        点击时反而没有处理函数（除非它恰好返回一个函数）。
        Vue 对应：@click="handleCountClick"，事件对象会自动作为第一个参数传入。
      */}
      <div className="row">
        <button onClick={handleCountClick}>按钮点击计数：{count}</button>
        <span className="muted">最后一次点击位置：{lastPos}</span>
      </div>

      <ul>
        {items.map((item) => (
          <li key={item.id} className="row">
            <span>
              {item.name} × {item.quantity}(¥{item.price})
            </span>
            {/*
              ★ 经典新手坑：需要传参时必须包一层箭头函数。
              onClick={() => removeItem(item.id)}  ✅ 点击时才执行
              onClick={removeItem(item.id)}        ❌ 渲染这一行时就立即执行了，
                列表一渲染商品就被删光，还会因「渲染中 setState」触发死循环警告。
              Vue 里 @click="removeItem(item.id)" 却是对的：模板编译器会把它包成内联函数，
              这是「模板会编译、JSX 只是普通 JS」带来的行为差异，面试高频。
              若还需要事件对象：onClick={(e) => removeItem(item.id, e)}，对应 Vue 的
              @click="removeItem(item.id, $event)"。
              （这个删除按钮没有 stopPropagation，点击会冒泡、让上面的卡片计数 +1）
            */}
            <button className="btn-danger" onClick={() => removeItem(item.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="muted">商品已全部删除</p>}

      <div className="row">
        {/* 这个按钮在处理函数里 stopPropagation 了：点击它，卡片冒泡计数不会变 */}
        <button className="btn-primary" onClick={toggleStatus}>
          切换状态（pending ↔ paid）
        </button>
        {/* 恢复商品：不传参也不需要事件对象时，内联箭头函数或引用都行 */}
        <button onClick={() => setItems(initialItems)}>恢复商品</button>
      </div>

      <p>
        {/* preventDefault 演示：链接不会真的跳转。Vue 写法是 @click.prevent */}
        <a href="https://example.com/invoice" onClick={handleFakeLink}>
          查看发票（本应跳转的链接）
        </a>
      </p>
      {linkMsg !== '' && <p className="success-text">{linkMsg}</p>}
    </div>
  )
}
