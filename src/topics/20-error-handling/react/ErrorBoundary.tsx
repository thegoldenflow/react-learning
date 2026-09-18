/**
 * 20 题【主线】手写的错误边界（class 组件）。
 *
 * 为什么必须是 class：react.dev Component 页原文「There is currently no way to write an Error Boundary as a function component.」
 * 边界靠两个 class 生命周期工作，函数组件没有对应的 Hook：
 * - static getDerivedStateFromError(error)：子树渲染出错时调用，返回要合并进 state 的对象，让下一次 render 走兜底分支。
 *   它是 static 纯函数，不能有副作用（不能 setState、不能上报）。
 * - componentDidCatch(error, info)：提交阶段调用，适合做副作用（上报监控）；info.componentStack 是出错组件的祖先链。
 * 同一页接着说「you don't have to write the Error Boundary class yourself. For example, you can use react-error-boundary instead.」
 * —— 生产项目多用那个库（区块三并排演示，已安装 6.1.3）；面试要求能手写，所以主线手写一遍。
 * class 组件在 React 19 里并没有被弃用，只是新代码不推荐：除了错误边界，getSnapshotBeforeUpdate 也还没有函数组件的等价写法。
 *
 * 这个版本把生产里需要的几项做成了 props（对照 react-error-boundary 的同名能力）：
 * - fallback({ error, reset })：出错时渲染什么（对应 fallbackRender）；
 * - onError(error, info)：上报（对应 onError，在 componentDidCatch 里调用）；
 * - resetKeys：数组里任何一项变了就自动重置（对应 resetKeys，用 Object.is 逐项比较）；
 * - onReset()：重置时通知调用方，把导致出错的状态也清掉（对应 onReset）。
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface FallbackArgs {
  /** 抛出来的值：JS 可以 throw 任何东西，所以类型是 unknown，显示前要自己判断 */
  error: unknown
  /** 清掉错误、重新渲染子树（子树会以全新实例挂载） */
  reset: () => void
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: (args: FallbackArgs) => ReactNode
  onError?: (error: unknown, info: ErrorInfo) => void
  onReset?: () => void
  resetKeys?: readonly unknown[]
}

// 用 hasError 标记而不是判断 error 是否为 null：有人会 throw null / throw undefined
type ErrorBoundaryState = { hasError: false; error: null } | { hasError: true; error: unknown }

const INITIAL_STATE: ErrorBoundaryState = { hasError: false, error: null }

function keysChanged(prev: readonly unknown[] = [], next: readonly unknown[] = []) {
  return prev.length !== next.length || prev.some((item, i) => !Object.is(item, next[i]))
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = INITIAL_STATE

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // 这里只转交给调用方。React 19 另外还会调用根节点的 onCaughtError（默认 console.error 打印这个错误，区块四）
    this.props.onError?.(error, info)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    // resetKeys 变了就重置。prevState.hasError 这个条件不能省：如果「改了某个 key」本身就是出错的原因，
    // 捕获错误的那一次更新里 key 也变了，不加判断会立刻重置、再崩一次（react-error-boundary 源码同样的判断）
    if (this.state.hasError && prevState.hasError && keysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset()
    }
  }

  // 箭头函数类字段：this 固定指向这个实例，可以直接当 onClick 传（等价于在构造函数里 bind，class 组件的经典面试点）
  reset = () => {
    this.props.onReset?.()
    this.setState(INITIAL_STATE)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback({ error: this.state.error, reset: this.reset })
    }
    // 没出错时原样渲染 children，边界组件平时是「透明」的
    return this.props.children
  }
}
