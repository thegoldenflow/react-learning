/**
 * 区块四：初始值只用一次 —— useState(createX()) 每次渲染都白算一遍，useState(createX) / useState(() => createX(arg)) 只在首次渲染算。
 * Vue 对照：vue/LazyInitDemo.vue（setup 只执行一次，ref(createX()) 天然只算一次，没有「惰性初始化」这个概念）。
 */
import { useState, useSyncExternalStore } from 'react'
import { createInitCallCounter, createInitialRows, type InitCallCounter } from './demoKit'

interface RowsProps {
  counter: InitCallCounter
  keyword: string
}

/**
 * ❌ 传的是「调用结果」：createInitialRows(...) 这个表达式每次渲染都会执行（它只是函数体里的一行普通代码），
 * 结果只在第一次被 useState 采用，之后每次都算完就扔。react.dev：「React saves the initial state once and ignores it on the next renders.」
 */
function EagerRows({ counter, keyword }: RowsProps) {
  const [rows] = useState(createInitialRows(counter, 'eager'))
  const matched = rows.filter((row) => row.text.includes(keyword)).length
  return (
    <li>
      ❌ useState(createInitialRows(…))：50 行里含「{keyword}」的有 {matched} 行
    </li>
  )
}

/**
 * ✅【常用】传「函数本身」：React 只在首次渲染（组件实例创建时）调用它。初始值算起来昂贵（读 localStorage、生成大数组）时才需要；
 * 普通的初始值【最常用】直接给值 useState(0)、useState<CartItem[]>([])。
 * 不需要参数时写 useState(createInitialRows)；需要参数时包一层箭头函数 useState(() => createInitialRows(counter, 'lazy'))。
 * 初始化函数要求：纯函数、不接收参数（箭头函数里用闭包拿参数）、返回初始值；StrictMode 开发环境会调用它两次。
 */
function LazyRows({ counter, keyword }: RowsProps) {
  const [rows] = useState(() => createInitialRows(counter, 'lazy'))
  const matched = rows.filter((row) => row.text.includes(keyword)).length
  return (
    <li>
      ✅ {'useState(() => createInitialRows(…))'}：50 行里含「{keyword}」的有 {matched} 行
    </li>
  )
}

/** 兄弟组件：只有它订阅计数器，计数变化只让它自己重渲染（14 题 SubscribeLab 的做法） */
function InitCallPanel({ counter }: { counter: InitCallCounter }) {
  const counts = useSyncExternalStore(counter.subscribe, counter.getSnapshot)
  return (
    <p>
      初始化函数被调用的次数：❌ <strong data-testid="eager-calls">{counts.eager}</strong> 次 · ✅{' '}
      <strong data-testid="lazy-calls">{counts.lazy}</strong> 次
    </p>
  )
}

export function LazyInitDemo() {
  // 计数器本身也用惰性初始化创建：每个区块实例一份，重渲染时不会再 new 一个
  const [counter] = useState(() => createInitCallCounter())
  const [keyword, setKeyword] = useState('1')

  return (
    <div className="card stack">
      <h3>区块四：初始值只用一次 —— 惰性初始化</h3>
      <p className="muted">【最常用】初始值直接给：useState(0)；【常用】算起来昂贵时传函数本身（惰性初始化），只在首次渲染调用。</p>
      <label className="row">
        输入几个字让下面两个组件重渲染：
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} aria-label="过滤关键字" />
      </label>
      <ul className="stack">
        <EagerRows counter={counter} keyword={keyword} />
        <LazyRows counter={counter} keyword={keyword} />
      </ul>
      <InitCallPanel counter={counter} />
      <p className="muted">
        页面开着 StrictMode：首次渲染两边都是 2 次（开发环境把初始化函数调用两次）；之后每输入一个字，❌ 再加 2（每次渲染也调用两次组件函数），✅ 不再变。
      </p>
    </div>
  )
}
