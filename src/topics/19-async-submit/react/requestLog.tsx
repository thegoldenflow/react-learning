/**
 * 请求日志（演示工具）：记录每一次真正发出去的请求，以及被拦下的重复提交，用来观察防重复有没有生效。
 *
 * 为什么放在 React 外面、用 useSyncExternalStore 读（14 题）：
 * Actions 版本在 action 函数开头写日志，而 action 在 Transition 里执行 —— 这时调用 setState 属于这次 Transition，
 * 要等 action 整个结束才显示（2026-09-17 用一次性测试确认：请求进行中日志为空，action 结束后才出现），日志就「迟到」了。
 * 外部 store 的变化由 useSyncExternalStore 按同步更新处理，写进去马上能看到。
 */
import { useSyncExternalStore } from 'react'

export interface RequestLog {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => readonly string[]
  add: (line: string) => void
  clear: () => void
}

export function createRequestLog(limit = 12): RequestLog {
  let lines: readonly string[] = []
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    // 每次修改都换一个新数组；没有变化时返回同一个引用（getSnapshot 的要求，14 题）
    getSnapshot: () => lines,
    add(line) {
      lines = [...lines.slice(-(limit - 1)), line]
      emit()
    },
    clear() {
      lines = []
      emit()
    },
  }
}

export function RequestLogPanel({ log, label }: { log: RequestLog; label: string }) {
  const lines = useSyncExternalStore(log.subscribe, log.getSnapshot)
  return (
    <>
      <div className="row">
        <strong>请求日志</strong>
        <button type="button" className="btn-ghost" onClick={log.clear}>
          清空
        </button>
      </div>
      <ul className="log" aria-label={label}>
        {lines.length === 0 ? <li className="log-empty">（空）</li> : lines.map((line, i) => <li key={i}>{line}</li>)}
      </ul>
    </>
  )
}
