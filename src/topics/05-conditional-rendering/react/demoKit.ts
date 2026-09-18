/**
 * 本题区块四用的演示日志：组件外的小 store，由 LogPanel 用 useSyncExternalStore 读（14 题）。
 * 日志为什么放在组件外：要在 Effect 的 setup / cleanup 里记一笔，在 Effect 体里同步 setState 会被 react-hooks/set-state-in-effect 拦下（11 题），
 * 而且写日志本身不该让演示组件多渲染一次。组件文件只导出组件（Fast Refresh，01 题二-11），所以 store 放在这个 .ts 里。
 */

export interface DemoLog {
  add(line: string): void
  clear(): void
  /** 内容不变时返回同一个数组，满足 useSyncExternalStore 对快照稳定的要求（14 题） */
  getSnapshot(): readonly string[]
  subscribe(listener: () => void): () => void
}

export function createDemoLog(maxLines = 20): DemoLog {
  let lines: readonly string[] = []
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  return {
    add(line) {
      lines = [...lines, line].slice(-maxLines)
      emit()
    },
    clear() {
      lines = []
      emit()
    },
    getSnapshot: () => lines,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
