/**
 * 学习主题：DOM ref 与跨渲染可变值 —— useRef 的两种用途
 *
 * React 核心概念：
 * - 用途一：useRef<HTMLInputElement>(null) + <input ref={inputRef}> 获取真实 DOM 节点，命令式调用 focus() 等
 * - 用途二：跨渲染保存任意可变值 —— 改 .current 不触发重渲染，但值一直存活；
 *   「用 ref 保存最新值」的完整应用场景见 26 题（过期闭包）
 * - React 完全不追踪 ref：useRef 返回的只是一个每次渲染都相同的普通对象 { current: T }，改它 React 毫不知情
 * - 选择标准：值的变化需要反映到界面 → useState；只是记录、不影响渲染 → useRef
 *
 * Vue 对应概念：
 * - DOM ref：const inputEl = ref<HTMLInputElement | null>(null) + 模板 ref="inputEl"，挂载后才有值
 * - 「跨渲染保存可变值」：Vue 的 setup 只执行一次，普通变量天然跨渲染存活，不需要专门 API —— 没有一一对应关系
 *
 * 最重要的区别：
 * - 「Vue 的 ref ≠ React 的 useRef」：同名不同概念。Vue 的 ref 是响应式的，改 .value 视图立即更新；
 *   React 的 useRef 完全不被追踪，改 .current 界面纹丝不动 —— 它真正对应的是 Vue setup 里的普通变量/普通对象。
 * - 根源：React 组件函数每次渲染整个重跑，函数内的普通变量每次都被重置，所以需要 useRef 这个
 *   「跨渲染的盒子」；Vue 没有这个问题。因此「state 还是 ref」这道选择题是 React 特有的，也是面试高频题。
 */
import { useRef, useState } from 'react'

export default function Example() {
  // ============ 用途一：DOM ref ============
  // 泛型写 HTMLInputElement、初始值 null：挂载前拿不到节点，所以 .current 的类型是 HTMLInputElement | null。
  // React 在「提交 DOM 之后」才把节点塞进 .current —— 渲染期间它还是 null，只能在事件处理器 / effect 里用。
  // Vue 完全同理：const inputEl = ref<HTMLInputElement | null>(null)，挂载前 .value 也是 null。
  // 顺带一提：React 19 起 ref 是普通 prop，函数组件不再需要 forwardRef 就能把 ref 透传给子组件
  //（02 题的 UiButton 提过）；本题只讲 useRef 自身的两种用途，不展开 ref 透传。
  const inputRef = useRef<HTMLInputElement>(null)

  const [keyword, setKeyword] = useState('')
  const [submitted, setSubmitted] = useState('')

  // ============ 用途二：跨渲染保存可变值 ============
  // 「上一次搜索词」选 ref 而不是 state：它只是顺带记录，自己变化时不需要触发渲染
  // （每次它变化的同一瞬间都有 setSubmitted 触发渲染，用 state 纯属多余）。
  // 如果换成普通 const/let？不行 —— 组件函数每次渲染重跑，普通变量每次都被重置归零，
  // 只有 useRef 给的这个「盒子」能跨渲染存活。
  // （Vue 版这里用的是响应式 ref：Vue 不需要在「触发渲染 / 不触发渲染」之间做选择，
  //   这道选择题是 React 特有的，没有一一对应关系。）
  const lastKeywordRef = useRef('')

  // 小实验用：一个 ref、一个 state，各自 +1，对比谁能让界面更新
  const countRef = useRef(0)
  const [count, setCount] = useState(0)

  function handleFocus() {
    // ?. 判空是必须的：TS 知道 .current 可能为 null。
    // 命令式 DOM 操作（focus / scrollIntoView / 播放视频）是 DOM ref 的正当用途；
    // 千万别用 ref 去改文本、改样式 —— 那是在绕过 React 的声明式渲染，是反模式。
    inputRef.current?.focus()
  }

  function handleSearch() {
    // 先把「上一次提交的词」存进 ref，再 setState。
    // 界面上能看到 ref 的新值，是因为 setSubmitted 触发了这次渲染、「顺便」读出了 ref 的当前值 ——
    // ref 自己永远不会主动引发界面更新。
    lastKeywordRef.current = submitted
    setSubmitted(keyword)
  }

  return (
    <div className="stack">
      <div className="card">
        <h3>搜索框</h3>
        <div className="row">
          {/* ref={inputRef}：直接把 ref 对象传给 JSX 属性；
              Vue 是在模板写 ref="inputEl"，靠「与变量同名的字符串」自动关联 */}
          <input
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入搜索词"
          />
          <button onClick={handleFocus}>聚焦输入框</button>
          <button className="btn-primary" onClick={handleSearch}>
            搜索
          </button>
        </div>
        {/* 严格说，在 JSX 里读 lastKeywordRef.current 属于「渲染期读 ref」，官方建议尽量避免
            （渲染应保持纯函数）。这里它只随 setSubmitted 一起变化、显示始终一致，为演示而为之；
            正式代码若一个值需要展示，那它多半就该是 state。 */}
        <p>
          本次搜索：<strong>{submitted || '（还没搜过）'}</strong>，上一次搜索：
          <strong>{lastKeywordRef.current || '（无）'}</strong>
        </p>
      </div>

      <div className="card">
        <h3>小实验：改 ref 不触发重渲染</h3>
        <p>
          countRef.current = <strong>{countRef.current}</strong>，count(state) ={' '}
          <strong>{count}</strong>
        </p>
        <div className="row">
          {/* 直接改 .current：值确实变了（可以连点几次），但 React 不追踪 ref，
              不会安排重渲染，屏幕上的数字纹丝不动 */}
          <button
            onClick={() => {
              countRef.current++
            }}
          >
            ref.current + 1（界面不动）
          </button>
          {/* setState 触发重渲染 → 组件函数重跑 → 这一帧才把 ref 攒下来的值一起显示出来 */}
          <button onClick={() => setCount((c) => c + 1)}>setState + 1（触发渲染）</button>
        </div>
        <p className="muted">
          先连点几次左边按钮 —— 界面没反应；再点一次右边按钮，ref 攒下的值才一次性显示出来。
          如果一个值需要这样「蹭别人的渲染」才能上屏，说明它本该用 state。
        </p>
      </div>
    </div>
  )
}
