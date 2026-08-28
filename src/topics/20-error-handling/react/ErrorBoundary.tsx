/**
 * 通用错误边界（题 20 专用）—— React 中唯一仍然需要 class 组件的场景。
 *
 * 函数组件没有等价 API：getDerivedStateFromError / componentDidCatch 都没有对应的 Hook
 * （官方多年表示「未来可能提供」，至今没有）。工业界通常不手写，而是用现成的
 * react-error-boundary 库（提供 <ErrorBoundary fallbackRender={...} onReset={...}>，
 * 内部就是下面这几十行）；本课程不引入第三方库，手写一遍 —— 这也是高频面试题。
 *
 * 能捕获（子组件树在【渲染流程】里抛出的错误）：
 * 1. 子组件渲染期间（函数组件体 / render 方法执行时）
 * 2. 子组件的生命周期方法
 * 3. 子组件的构造函数
 * 不能捕获（Example 里的按钮演示了第 1 条）：
 * 1. 事件处理器里的错误 —— 它不发生在渲染流程里，必须自己 try/catch
 * 2. 异步代码（setTimeout、Promise 回调 —— 它们执行时渲染早已结束）
 * 3. 服务端渲染（SSR）
 * 4. 边界组件【自身】抛出的错误（只能由更外层的边界接）
 *
 * Vue 对照：onErrorCaptured 一个钩子干同样的事，但捕获范围更宽（连事件处理器里的错误
 * 都能接住），详见本题 Vue 版 —— 两者没有一一对应关系。
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // class 组件的 state 是一个整体对象；没有 useState，用类字段初始化
  state: ErrorBoundaryState = { error: null }

  /**
   * 子树渲染出错时被调用，返回值合并进 state —— 相当于「catch 到错误后 setState」。
   * 它是 static 纯函数（不允许副作用），只负责「把错误转成 state」，
   * 让下一次 render 走到兜底 UI 分支。
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  /**
   * 错误上报的时机（这里允许副作用）：error 是错误本身，info.componentStack 是组件调用栈。
   * 真实业务在这里发给 Sentry 等监控平台；演示里只打到控制台。
   */
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] 捕获到渲染错误：', error, info.componentStack)
  }

  /**
   * 重置：清空 error，回到正常渲染。关键点 —— React 捕获错误时已把崩溃的子树整棵【卸载】，
   * reset 后 children 会以全新实例重新挂载（BuggyCounter 的 count 归零），所以不会立刻再崩。
   * （Vue 的 onErrorCaptured 不会自动卸载子树，重置时要自己用 v-if / :key 强制重挂 —— 见 Vue 版。）
   * 用箭头函数类字段绑定 this，等价于在构造函数里 bind（class 组件的经典面试点）。
   */
  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      // 兜底 UI：真实业务通常做成 props（fallback / fallbackRender）方便复用，演示里写死
      return (
        <div className="stack">
          <p className="error-text">这块区域崩溃了：{this.state.error.message}</p>
          <button className="btn-primary" onClick={this.reset}>
            重置
          </button>
        </div>
      )
    }
    // 没出错时原样渲染 children —— 边界组件平时是「透明」的
    return this.props.children
  }
}
