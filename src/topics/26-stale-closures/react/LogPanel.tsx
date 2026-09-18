/**
 * 各区块共用的日志面板：用 useSyncExternalStore 读 demoKit.ts 里的日志 store（14 题）。
 */
import { useSyncExternalStore } from 'react'
import type { DemoLog } from './demoKit'

interface LogPanelProps {
  log: DemoLog
  /** 屏幕阅读器与测试用的名字，例如「区块一日志」 */
  label: string
  /** 空日志时的提示：告诉学习者该点哪里 */
  emptyHint?: string
}

/**
 * 只追加的运行日志，key 用了 index：条目是纯文本 <li>，没有子组件 state、也没有受控输入，超出上限从头部丢弃时最多多几次文本更新，
 * 不会出现 06 题演示的「状态串到别的行」。有 state 的列表项仍要用稳定 id（06 题）。
 */
export function LogPanel({ log, label, emptyHint = '（还没有记录，点上面的按钮）' }: LogPanelProps) {
  const lines = useSyncExternalStore(log.subscribe, log.getSnapshot)
  return (
    <div className="stack">
      <ul className="log" aria-label={label}>
        {lines.length === 0 && <li className="log-empty">{emptyHint}</li>}
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
