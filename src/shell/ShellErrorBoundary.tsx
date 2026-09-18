/**
 * 壳应用的错误边界（基础设施）：某个示例渲染崩溃时，不让整个学习站点白屏。
 * 错误边界目前只能用 class 组件写（函数组件没有对应的 Hook），
 * 详细讲解见 20 题《错误边界》。
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ShellErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ShellErrorBoundary] 示例渲染出错：', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="boundary-fallback">
          <p className="error-text">示例渲染出错：{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })}>重试</button>
        </div>
      )
    }
    return this.props.children
  }
}
