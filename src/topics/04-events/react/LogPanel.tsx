/**
 * 各区块共用的日志面板：用 useSyncExternalStore 读 demoKit.ts 里的日志 store（14 题）。
 */
import { useSyncExternalStore } from 'react'
import type { DemoLog } from './demoKit'

interface LogPanelProps {
  log: DemoLog
  /** 屏幕阅读器与测试用的名字，例如「区块三日志」 */
  label: string
}

/** 只追加的纯文本日志，key 用 index 没问题：条目没有子组件 state、也没有受控输入（有 state 的列表项要用稳定 id，06 题） */
export function LogPanel({ log, label }: LogPanelProps) {
  const lines = useSyncExternalStore(log.subscribe, log.getSnapshot)
  return (
    <div className="stack">
      <ul className="log" aria-label={label}>
        {lines.length === 0 && <li className="log-empty">（还没有记录，点上面的按钮）</li>}
        {lines.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
      <div className="row">
        <button className="btn-ghost" onClick={log.clear}>
          清空日志
        </button>
      </div>
    </div>
  )
}
