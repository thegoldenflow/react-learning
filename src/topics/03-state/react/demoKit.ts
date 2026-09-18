/**
 * 本题各区块共用的非组件部分：演示日志（组件外的小 store）、初始化函数的调用计数器、区块四的「昂贵的初始值」。
 * 日志面板组件在 LogPanel.tsx。拆成两个文件是因为 @vitejs/plugin-react 的 README：「For React refresh to work correctly, your file should only export
 * React components.」（01 题二-11、26 题同样的拆法）。
 *
 * 日志为什么不用 useState：区块一要证明「改局部变量不会触发渲染」，如果点击时顺手 setLog，组件就因为日志重渲染了，演示就不成立。
 * 写到组件外的 store、由兄弟组件 LogPanel 用 useSyncExternalStore 读（14 题），写日志不会让演示组件本身重渲染。
 * 每个区块用 useState(() => createDemoLog()) 各建一份（惰性初始化，区块四），StrictMode 双挂载、切题重进都不会串台。
 */

export interface DemoLog {
  add(line: string): void
  clear(): void
  /** 内容不变时返回同一个数组，满足 useSyncExternalStore 对快照稳定的要求（14 题） */
  getSnapshot(): readonly string[]
  subscribe(listener: () => void): () => void
}

export function createDemoLog(maxLines = 12): DemoLog {
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

export type InitVariant = 'eager' | 'lazy'

/** 区块四：两种写法的初始化函数各被调用了几次 */
export interface InitCallCounter {
  hit(variant: InitVariant): void
  getSnapshot(): Readonly<Record<InitVariant, number>>
  subscribe(listener: () => void): () => void
}

/**
 * hit() 发生在渲染期间（初始化函数是在渲染时被调用的）。如果在这里同步通知订阅者，就等于「渲染 A 组件时更新了 B 组件」，
 * React 开发环境会报「Cannot update a component (…) while rendering a different component (…)」。所以通知推迟到微任务里、合并成一次。
 */
export function createInitCallCounter(): InitCallCounter {
  let counts: Readonly<Record<InitVariant, number>> = { eager: 0, lazy: 0 }
  const listeners = new Set<() => void>()
  let notifyQueued = false
  return {
    hit(variant) {
      counts = { ...counts, [variant]: counts[variant] + 1 }
      if (notifyQueued) return
      notifyQueued = true
      queueMicrotask(() => {
        notifyQueued = false
        listeners.forEach((listener) => listener())
      })
    },
    getSnapshot: () => counts,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export interface DraftRow {
  id: number
  text: string
}

/**
 * 区块四的「昂贵的初始值」：造 50 行草稿（react.dev useState 页 createInitialTodos 的同款例子）。
 * 真实项目里常见的是解析一大段数据、读 localStorage（要 try / catch，见 Example.tsx 七）。
 *
 * 演示简化：为了数调用次数，这个函数里有一个副作用（counter.hit）。真实的初始化函数应当是纯函数（官方原文「It should be pure」）——
 * StrictMode 在开发环境调用它两次，就是为了把这类副作用暴露出来（页面开着 StrictMode，区块四的计数是 2；不开 StrictMode 以及生产构建是 1，两种情况测试都覆盖了）。
 */
export function createInitialRows(counter: InitCallCounter, variant: InitVariant): DraftRow[] {
  counter.hit(variant)
  return Array.from({ length: 50 }, (_, i) => ({ id: i, text: `草稿 ${i + 1}` }))
}
