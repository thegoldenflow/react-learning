/**
 * 学习主题：错误边界 —— Error Boundary vs onErrorCaptured
 *
 * React 核心概念：
 * - Error Boundary 是 React 中唯一仍需要 class 组件的场景：函数组件没有等价 API
 *   （getDerivedStateFromError / componentDidCatch 没有对应 Hook）；工业界常用现成的
 *   react-error-boundary 库（本课程不引入，手写一遍是面试要求）
 * - 能捕获：子组件树【渲染流程】里的错误 —— 渲染期间、生命周期方法、构造函数
 * - 不能捕获：事件处理器、异步代码（setTimeout / Promise）、SSR、边界组件自身的错误
 * - Error Boundary vs try/catch：前者接「声明式渲染」过程中的错误，后者接「命令式代码」；
 *   事件处理器属于命令式代码，必须自己 try/catch
 * - 边界捕获错误后 React 会自动卸载崩溃的子树；reset 后子树以全新实例重挂（state 归零）
 *
 * Vue 对应概念：
 * - onErrorCaptured 捕获后代组件的错误，返回 false 阻止向上冒泡 —— 一个钩子扮演边界角色
 * - 但捕获范围比 React 宽：渲染、生命周期之外，连事件处理器里的错误也能接住
 * - 全局兜底 app.config.errorHandler —— 与 React 没有一一对应关系
 *   （React 19 最接近的是 createRoot 的 onUncaughtError / onCaughtError 选项，但不是同层概念）
 * - Vue 捕获后不会自动卸载崩溃子树，重置时要靠 v-if / :key 自己重挂载
 *
 * 最重要的区别：
 * - React 用「专门的边界组件」包住易碎区域，隔离范围由组件树结构决定，且对事件处理器无能为力；
 *   Vue 用「任意组件里的一个钩子」实现同样效果，捕获范围更宽 —— 两边都推荐只在关键区域做局部兜底
 */
import { useState } from 'react'
import ErrorBoundary from './ErrorBoundary'

/**
 * 易碎计数器：count 到 3 时在【渲染期间】throw —— 这正是 Error Boundary 能接住的错误类型。
 * React 的子组件就是同文件里的另一个函数，不必拆文件（Vue 的 SFC 一文件一组件，
 * 对照版拆成了单独的 BuggyCounter.vue —— 这是两个框架的组织方式差异）。
 */
function BuggyCounter() {
  const [count, setCount] = useState(0)
  if (count === 3) {
    // 在组件函数体（渲染流程）里 throw：错误沿组件树向上冒泡，被最近的 ErrorBoundary 捕获。
    // Vue 版对应写法是在渲染时求值的 computed 里 throw —— 同样属于「渲染期间」。
    throw new Error('计数到 3，BuggyCounter 渲染崩溃了！')
  }
  return (
    <div className="stack">
      <p>
        易碎计数器：<strong>{count}</strong>（加到 3 会在渲染中 throw）
      </p>
      <button className="btn-primary" onClick={() => setCount((c) => c + 1)}>
        +1
      </button>
    </div>
  )
}

/** 边界外的正常计数器：验证「崩溃被隔离在边界内部，旁边的组件毫发无损」 */
function SafeCounter() {
  const [count, setCount] = useState(0)
  return (
    <div className="stack">
      <p>
        正常计数器：<strong>{count}</strong>
      </p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  )
}

/**
 * 演示「不能捕获」清单里最常考的一条：事件处理器里的错误。
 * 这个组件明明被 ErrorBoundary 包着，但点第一颗按钮时兜底 UI 不会出现 ——
 * 事件处理器不属于渲染流程，错误直接抛到全局（只在控制台可见）。
 * （对照：Vue 版把这颗按钮放在 BuggyCounter.vue 里，onErrorCaptured 反而能接住 —— 范围更宽。）
 */
function EventErrorDemo() {
  const [caught, setCaught] = useState<string | null>(null)

  // 不 try/catch：错误抛到全局，外层 ErrorBoundary 完全无感，UI 不变（打开控制台能看到报错）
  const throwWithoutCatch = () => {
    throw new Error('事件处理器里的错误 —— Error Boundary 捕获不到我！')
  }

  // 正确做法：事件处理器属于「命令式代码」，必须自己 try/catch，再把错误转成 state 显示
  const throwWithCatch = () => {
    try {
      throw new Error('事件处理器里的错误（已被 try/catch 接住）')
    } catch (err) {
      setCaught(err instanceof Error ? err.message : '未知错误')
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <button className="btn-danger" onClick={throwWithoutCatch}>
          事件处理器里 throw（不 try/catch）
        </button>
        <button onClick={throwWithCatch}>事件处理器里 throw（自己 try/catch）</button>
      </div>
      <p className="muted">
        点左边：外层边界毫无反应，错误只出现在控制台 —— 证明 Error Boundary 捕获不到事件处理器；
        点右边：try/catch 接住并显示在下方
      </p>
      {caught && <p className="error-text">try/catch 捕获：{caught}</p>}
    </div>
  )
}

export default function Example() {
  return (
    <div className="stack">
      <p className="muted">
        把左边的易碎计数器加到 3：只有它所在的卡片变成兜底 UI，右边的正常计数器不受影响；
        点「重置」后子树以全新实例重挂（count 归零）。下方卡片演示「事件处理器里的错误接不住」
      </p>

      <div className="row">
        <div className="card">
          {/* 边界只包住易碎区域 —— 包得越小，崩溃影响面越小。
              对应 Vue：onErrorCaptured 写在哪个组件，哪个组件就是「边界」 */}
          <ErrorBoundary>
            <BuggyCounter />
          </ErrorBoundary>
        </div>
        <div className="card">
          <SafeCounter />
        </div>
      </div>

      <div className="card">
        {/* 就算包了边界，事件处理器里的错误也接不住 —— 见 EventErrorDemo 内部注释 */}
        <ErrorBoundary>
          <EventErrorDemo />
        </ErrorBoundary>
      </div>
    </div>
  )
}
