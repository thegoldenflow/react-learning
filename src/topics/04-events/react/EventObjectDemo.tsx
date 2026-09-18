/**
 * 区块二：事件对象 —— React 的合成事件（synthetic event）：target / currentTarget / nativeEvent，以及处理函数返回之后还能读什么。
 * Vue 对照：vue/EventObjectDemo.vue（Vue 的处理函数拿到的就是原生事件，currentTarget 就是绑定的元素）。
 */
import { useState, type MouseEvent } from 'react'
import { describeTarget } from './demoKit'

type Row = [expression: string, value: string]

export function EventObjectDemo() {
  const [rows, setRows] = useState<Row[]>([])
  const [laterRows, setLaterRows] = useState<Row[]>([])

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    setRows([
      ['e.type', e.type],
      ['e.target', describeTarget(e.target)],
      ['e.currentTarget', describeTarget(e.currentTarget)],
      // React 把监听器挂在 root 容器上：原生事件此刻正在 root 容器上派发（common 页 Caveats「React attaches event handlers at the root」）
      ['e.nativeEvent.currentTarget', describeTarget(e.nativeEvent.currentTarget)],
      ['e.nativeEvent instanceof window.MouseEvent', String(e.nativeEvent instanceof window.MouseEvent)],
      ['e.bubbles / e.eventPhase', `${e.bubbles} / ${e.eventPhase}`],
      ['e.isTrusted', String(e.isTrusted)],
    ])
    // 处理函数返回之后再读：17 起没有事件池，type / target 照样能读；currentTarget 被 React 在派发完这一个处理函数后置成 null
    // （react-dom-client.development.js:19113-19120 executeDispatch）。要在异步回调里用 currentTarget，先存进局部变量。
    const button = e.currentTarget
    setTimeout(() => {
      setLaterRows([
        ['e.type', e.type],
        ['e.target', describeTarget(e.target)],
        ['e.currentTarget', describeTarget(e.currentTarget)],
        ['提前存下来的 button', describeTarget(button)],
      ])
    }, 0)
  }

  return (
    <div className="card stack">
      <h3>区块二：事件对象 —— 合成事件与 nativeEvent</h3>
      <p className="muted">点按钮里的「图标」文字：target 是被点中的 &lt;span&gt;，currentTarget 是挂着 onClick 的 &lt;button&gt;。</p>
      <div className="row">
        <button data-node="demo-button" onClick={handleClick}>
          <span data-node="icon">🧾 图标</span> 查看事件对象
        </button>
      </div>
      {rows.length > 0 && (
        <table className="stack" aria-label="处理函数里读到的值">
          <tbody>
            {rows.map(([expression, value]) => (
              <tr key={expression}>
                <td>
                  <code>{expression}</code>
                </td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {laterRows.length > 0 && (
        <table className="stack" aria-label="处理函数返回之后读到的值">
          <tbody>
            {laterRows.map(([expression, value]) => (
              <tr key={expression}>
                <td>
                  setTimeout 里 <code>{expression}</code>
                </td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
