/**
 * 演示日志：组件外的小 store，用 useSyncExternalStore 读（14 题）。
 * 错误回调（onError、window 的 error 事件）里写日志不碰 React state：
 * 回调可能在提交阶段或 React 之外执行，写外部 store 最简单，也不会让写日志的组件自己重渲染。
 */
export function createErrorLog() {
  let lines: readonly string[] = []
  const listeners = new Set<() => void>()
  return {
    push(line: string) {
      lines = [...lines, line].slice(-10)
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => lines,
  }
}

export type ErrorLog = ReturnType<typeof createErrorLog>
