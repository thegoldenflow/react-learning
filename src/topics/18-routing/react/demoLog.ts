/**
 * 调用日志：记录每次导航里 middleware / loader / action 到底执行了哪些。
 * 页面上的日志面板靠它回答两个面试追问：
 * - 用 loader 做守卫时，被拦下的导航里子路由的 loader 有没有跑？（会跑，父子 loader 并行）
 * - 用 middleware 做守卫时呢？（不会跑，middleware 在 loader 之前执行）
 */

export interface DemoLog {
  add(line: string): void
  clear(): void
  /** 返回不可变数组：内容不变时引用不变，满足 useSyncExternalStore 对快照的要求 */
  getSnapshot(): readonly string[]
  subscribe(listener: () => void): () => void
}

export function createDemoLog(maxLines = 14): DemoLog {
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
