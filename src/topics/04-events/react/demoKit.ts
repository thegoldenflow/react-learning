/**
 * 本题各区块共用的非组件部分：演示日志（组件外的小 store）与「把 DOM 节点写成一小段文字」的工具函数。
 * 日志面板组件在 LogPanel.tsx（组件文件只导出组件，Fast Refresh 的要求，01 题二-11）。
 *
 * 日志为什么放在组件外：区块三要在 React 的处理函数和原生 addEventListener 的监听器里都记一笔，按真实的执行顺序排好。
 * 写到组件外的 store、由 LogPanel 用 useSyncExternalStore 读（14 题），谁先调用 add() 谁就排在前面，不经过 React 的 state 更新队列。
 * 每个区块用 useState(() => createDemoLog()) 各建一份（03 题区块四的惰性初始化）。
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

/** 把事件目标写成 <tag id="…"> 这样的一小段文字；null 原样写出来（处理函数返回后 currentTarget 会变成 null） */
export function describeTarget(target: EventTarget | null): string {
  if (target === null) return 'null'
  if (target instanceof Element) {
    const id = target.id ? ` id="${target.id}"` : ''
    const testId = target.getAttribute('data-node') ? ` data-node="${target.getAttribute('data-node')}"` : ''
    return `<${target.tagName.toLowerCase()}${id}${testId}>`
  }
  return Object.prototype.toString.call(target)
}
