/**
 * 本题各区块共用的非组件部分：演示日志（组件外的小 store）、会在卸载时自动清理的 setTimeout、两个演示用的时间常量。
 * 日志面板组件在 LogPanel.tsx。拆成两个文件是因为 @vitejs/plugin-react 的 README：「For React refresh to work correctly, your file should only export
 * React components.」—— 组件文件里再导出常量、工具函数，改这个文件时热更新会退化成整页刷新（01 题二-11）。
 *
 * 日志为什么不用 useState：区块二、四要在 Effect 体里记「这一轮 setup 跑了」，
 * 在 Effect 体里同步 setState 会被 react-hooks/set-state-in-effect 拦下（11 题），而且写日志本身不该让组件多渲染一次。
 * 写到组件外的 store、用 useSyncExternalStore 读（14 题），定时器回调、监听器、Promise.then 里写也一样方便。
 * 每个区块用 useState(() => createDemoLog()) 各建一份：StrictMode 双挂载、切题重进都不会串台。
 */
import { useEffect, useRef } from 'react'

/** 区块一：延迟保存的等待时间，长到足够你在中间多点几次 +1 */
export const SAVE_DELAY_MS = 2000

/** 区块三：轮询间隔，长到你来得及切换下拉框 */
export const POLL_MS = 2000

export interface DemoLog {
  add(line: string): void
  clear(): void
  /** 内容不变时返回同一个数组，满足 useSyncExternalStore 对快照稳定的要求（14 题） */
  getSnapshot(): readonly string[]
  subscribe(listener: () => void): () => void
}

export function createDemoLog(maxLines = 16): DemoLog {
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

type TimerId = ReturnType<typeof setTimeout>

/**
 * 「会自己收拾的 setTimeout」：返回 later(fn, ms)，登记过的定时器在组件卸载时全部 clearTimeout。
 * 定时器 id 存在 useRef 里（12 题：跨渲染保存、改了不触发渲染的可变值）。
 * 区块一的「坏」按钮也走这里 —— 坏的是回调读到的值，不是清理纪律：切题之后不允许还有回调往日志里写。
 */
export function useTimeouts() {
  const idsRef = useRef<TimerId[]>([])

  useEffect(() => {
    // cleanup 里要用的东西先拷到局部变量：exhaustive-deps 会提醒「cleanup 执行时 ref.current 可能已经变了」。
    // 这里数组引用从不更换（只原地增删），拿住它就够了。StrictMode 的挂载 → 卸载 → 重挂载也走这条 cleanup。
    const ids = idsRef.current
    return () => {
      ids.forEach((id) => clearTimeout(id))
      ids.length = 0
    }
  }, [])

  return (callback: () => void, ms: number) => {
    const id = setTimeout(() => {
      const ids = idsRef.current
      ids.splice(ids.indexOf(id), 1)
      callback()
    }, ms)
    idsRef.current.push(id)
  }
}
