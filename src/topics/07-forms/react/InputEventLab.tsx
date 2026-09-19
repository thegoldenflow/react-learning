/**
 * 区块三：输入事件实验 —— React 的 onChange 到底在什么时候触发。
 *
 * - onChange 的行为像原生 input 事件，每输入一个字符触发一次（官方：「Behaves like the browser input event」），
 *   和原生 change 事件（文本框的值改过之后失焦才触发）不是一回事。下面用 addEventListener 挂了一个原生 change 做对照。
 * - 输入法合成期间也会触发：react-dom 19.2.8 里文本框的 onChange 由原生 input / change 事件驱动，
 *   只看值有没有变，不看是否正在合成（react-dom-client.development.js:3587 getTargetInstForInputOrChangeEvent）。
 *   用拼音输入「你好」，日志里会出现拼写过程中的中间值。只想在选好字之后处理（例如按输入内容发搜索请求），
 *   就自己监听 onCompositionStart / onCompositionEnd，合成期间先不处理。
 * - Vue 的 v-model 在合成期间不更新，vue/InputEventLab.vue 是同一个实验。
 *
 * 「非法输入被弹回」的实验在区块一的手机号字段（ControlledProfileForm.tsx）。
 * 输入框本身是字段少时的受控写法：一个 useState + value + onChange（react.dev input 页受控示例的写法）。
 * 只想在选好字之后处理：监听 compositionstart / end 自己记标记，或者在处理函数里判断 e.nativeEvent.isComposing（04 题统一措辞），
 * 两种都常见（工程经验）。
 */
import { useEffect, useRef, useState } from 'react'

/** 只保留最近 12 行日志 */
function appendLine(lines: string[], line: string) {
  return [...lines.slice(-11), line]
}

export function InputEventLab() {
  const [text, setText] = useState('')
  const [lines, setLines] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * 原生 change 事件没有对应的 JSX prop（onChange 这个名字已经被 React 用成了 input 语义），只能 addEventListener。
   * 订阅 DOM 事件属于「和外部系统同步」，写在 effect 里，cleanup 里移除（10 题）。
   * 监听器里用函数式更新，不读闭包里的 lines，依赖数组保持为空（26 题）。
   */
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const handleNativeChange = () => setLines((prev) => appendLine(prev, `原生 change：${input.value}`))
    input.addEventListener('change', handleNativeChange)
    return () => input.removeEventListener('change', handleNativeChange)
  }, [])

  return (
    <div className="card stack">
      <h3>区块三：onChange 什么时候触发（换成中文输入法试试）</h3>
      <p className="muted">
        先用英文输入几个字母，再点页面空白处让输入框失焦；然后切到拼音输入法打「你好」。对照日志里 onChange 和原生 change 各出现在什么时候。
      </p>
      <p className="muted">
        这个输入框就是字段少时的写法：一个 useState + value + onChange（字段多时见区块一的对象 state）。
      </p>
      <label className="row">
        实验输入框
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setLines((prev) => appendLine(prev, `onChange：${e.target.value}`))
          }}
          onCompositionStart={() => setLines((prev) => appendLine(prev, 'compositionstart：开始拼写'))}
          onCompositionEnd={(e) => setLines((prev) => appendLine(prev, `compositionend：选定「${e.data}」`))}
        />
      </label>
      <p className="muted">state：{text === '' ? '（空）' : text}</p>
      <div className="row">
        <strong>事件日志</strong>
        <button type="button" className="btn-ghost" onClick={() => setLines([])}>
          清空
        </button>
      </div>
      <ul className="log" aria-label="输入事件日志">
        {lines.length === 0 ? (
          <li className="log-empty">（空）</li>
        ) : (
          // 日志项是纯文本、没有内部状态，用下标当 key 最多多更新几次文字，不会出现 06 题那种状态错位
          lines.map((line, i) => <li key={i}>{line}</li>)
        )}
      </ul>
    </div>
  )
}
