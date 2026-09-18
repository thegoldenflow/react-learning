/**
 * 区块三：事件传播 —— 捕获（onClickCapture）→ 目标 → 冒泡（onClick）；stopPropagation 挡住了谁；React 的委托和原生监听器的先后顺序。
 * 另附一个小实验：onScroll 在 React 里不冒泡，onFocus 在 React 里冒泡（原生 focus 不冒泡）。
 * Vue 对照：vue/PropagationDemo.vue（v-on 直接挂在元素上，和原生监听器按 DOM 顺序交错执行）。
 */
import { useEffect, useRef, useState } from 'react'
import { createDemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

export function PropagationDemo() {
  const [log] = useState(() => createDemoLog(24))
  const [stopInButton, setStopInButton] = useState(false)
  const outerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  /**
   * 再挂几个原生监听器，和 React 的处理函数放在同一份日志里比先后。
   * React 17 起把监听器挂在 root 容器上（React 16 及以前挂在 document 上）：原生事件先在 DOM 里走完捕获、到达目标、冒泡到 root 容器，
   * React 才在 root 容器的监听器里按组件树依次调用 onClick。所以按钮和外层 div 上的原生冒泡监听器，都比 React 的 onClick 先执行；
   * 而 onClickCapture 由 root 容器的捕获监听器派发，比外层 div 自己的原生捕获监听器还早（测试覆盖，顺序见日志）。
   */
  useEffect(() => {
    const outer = outerRef.current
    const button = buttonRef.current
    if (!outer || !button) return
    const onOuterCapture = () => log.add('原生 外层 div（捕获）')
    const onButton = () => log.add('原生 按钮（冒泡）')
    const onOuter = () => log.add('原生 外层 div（冒泡）')
    // document 上的监听器只记本区块里的点击
    const onDocument = (e: Event) => {
      if (e.target instanceof Node && outer.contains(e.target)) log.add('原生 document（冒泡）')
    }
    outer.addEventListener('click', onOuterCapture, true)
    button.addEventListener('click', onButton)
    outer.addEventListener('click', onOuter)
    document.addEventListener('click', onDocument)
    return () => {
      outer.removeEventListener('click', onOuterCapture, true)
      button.removeEventListener('click', onButton)
      outer.removeEventListener('click', onOuter)
      document.removeEventListener('click', onDocument)
    }
  }, [log])

  return (
    <div className="card stack">
      <h3>区块三：事件传播 —— 捕获、冒泡与 stopPropagation</h3>
      <label className="row">
        <input type="checkbox" checked={stopInButton} onChange={(e) => setStopInButton(e.target.checked)} />
        按钮的 onClick 里调用 e.stopPropagation()
      </label>
      {/* 演示简化：外层和中层的 div 只用来观察传播顺序；真实项目里「可点击的区域」要用 button 或补齐键盘交互（Example.tsx 七） */}
      <div
        ref={outerRef}
        className="card stack"
        data-node="outer"
        onClickCapture={() => log.add('React 外层 onClickCapture')}
        onClick={() => log.add('React 外层 onClick')}
      >
        外层 div
        <div
          className="card stack"
          data-node="inner"
          onClickCapture={() => log.add('React 中层 onClickCapture')}
          onClick={() => log.add('React 中层 onClick')}
        >
          中层 div
          <button
            ref={buttonRef}
            onClick={(e) => {
              log.add('React 按钮 onClick')
              // stopPropagation：停的是 React 树里后面的 onClick（中层、外层），同时也调用了原生事件的 stopPropagation ——
              // 这时原生事件已经冒泡到 root 容器，所以 document / window 上的监听器收不到；DOM 里比 root 更深的原生监听器早就执行过了
              if (stopInButton) e.stopPropagation()
            }}
          >
            点我
          </button>
        </div>
      </div>
      <LogPanel log={log} label="区块三日志" />
      <BubblingExceptions />
    </div>
  )
}

/**
 * onScroll 在 React 里不冒泡（「This event does not bubble.」，17 起不再模拟冒泡）；onFocus / onBlur 在 React 里冒泡
 * （「Unlike the built-in browser focus event, in React the onFocus event bubbles.」，17 起底层用 focusin / focusout）。
 * 所以外层 div 的 onFocus 能知道「里面有输入框获得了焦点」，外层的 onScroll 却收不到里面滚动区域的滚动；想在外层观察里面的滚动，用 onScrollCapture
 * （捕获阶段不限定只派发给目标，react-dom-client.development.js:19411-19413）（测试覆盖）。
 */
function BubblingExceptions() {
  const [outerScrolls, setOuterScrolls] = useState(0)
  const [innerScrolls, setInnerScrolls] = useState(0)
  const [outerFocus, setOuterFocus] = useState(0)
  const [outerScrollCaptures, setOuterScrollCaptures] = useState(0)

  return (
    <div
      className="stack"
      onScroll={() => setOuterScrolls((n) => n + 1)}
      onScrollCapture={() => setOuterScrollCaptures((n) => n + 1)}
      onFocus={() => setOuterFocus((n) => n + 1)}
    >
      <h4>哪些事件在 React 里不冒泡</h4>
      <div
        data-testid="scroll-box"
        style={{ maxHeight: 60, overflowY: 'auto', border: '1px dashed currentColor', padding: 4 }}
        onScroll={() => setInnerScrolls((n) => n + 1)}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>滚动我（第 {i + 1} 行）</div>
        ))}
      </div>
      <input placeholder="点进来获得焦点" aria-label="焦点实验输入框" />
      <p className="muted" data-testid="bubbling-counts">
        里面的 onScroll：{innerScrolls} 次 · 外层的 onScroll：{outerScrolls} 次 · 外层的 onScrollCapture：{outerScrollCaptures} 次 · 外层的 onFocus：{outerFocus} 次
      </p>
    </div>
  )
}
