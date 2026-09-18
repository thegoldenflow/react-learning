/**
 * 渲染计数工具（演示用，区块一、三共用）：用 React 自带的 <Profiler> 统计「每个组件提交了几次渲染」。
 *
 * - <Profiler id onRender>【主流·16.9 起】：react.dev reference/react/Profiler。它的子树里有组件渲染并提交时调用 onRender
 *   （子树里没人渲染就不调用）；开发环境可用，生产构建默认关闭（「Profiling adds some additional overhead, so it is disabled
 *   in the production build by default」）。所以生产构建里这些计数会一直是 0 —— 本站按开发模式运行。
 * - 计数存在组件外的小 store 里、用 useSyncExternalStore 读（14 题），显示在单独的面板组件里：
 *   被计数的组件自己不读计数，否则「渲染 → 计数变化 → 又渲染」会绕成圈。
 * - StrictMode 开发环境会把渲染函数调两次，但只提交一次，所以挂载时每个组件记 1 次。
 */
import { Profiler, useSyncExternalStore, type ReactNode } from 'react'

export function createRenderCounts() {
  let counts: Readonly<Record<string, number>> = {}
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  return {
    record(id: string) {
      counts = { ...counts, [id]: (counts[id] ?? 0) + 1 }
      emit()
    },
    reset() {
      counts = {}
      emit()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => counts,
  }
}

export type RenderCounts = ReturnType<typeof createRenderCounts>

/** 给一个组件套上 Profiler：它每提交一次渲染，计数 +1 */
export function Counted({ id, counts, children }: { id: string; counts: RenderCounts; children: ReactNode }) {
  return (
    <Profiler id={id} onRender={() => counts.record(id)}>
      {children}
    </Profiler>
  )
}

interface RenderCountsPanelProps {
  counts: RenderCounts
  /** 按顺序显示哪些计数：[Profiler id, 显示名] */
  entries: Array<[id: string, label: string]>
  label: string
}

export function RenderCountsPanel({ counts, entries, label }: RenderCountsPanelProps) {
  // counts 由父组件 useState 创建一次，counts.subscribe 引用稳定，不会反复重订（14 题）
  const snapshot = useSyncExternalStore(counts.subscribe, counts.getSnapshot)
  return (
    <div className="row" aria-label={label}>
      <span className="muted">渲染次数：</span>
      {entries.map(([id, name]) => (
        <span key={id} className="badge" data-testid={`renders-${id}`}>
          {name} {snapshot[id] ?? 0}
        </span>
      ))}
      <button onClick={counts.reset}>计数清零</button>
    </div>
  )
}
