/**
 * 区块三的【少用】部分：onClickCapture / onScrollCapture，以及 React 事件和元素上的原生监听器混用时的完整先后顺序。
 * 捕获事件：官方「Capture events are useful for code like routers or analytics, but you probably won't use them in app code.」
 * 完整顺序：面试追问「委托到哪、谁先执行」时用得上，应用代码里很少在同一块 DOM 上同时挂 React 事件和 addEventListener（工程经验）。
 * 其中常见的一条 —— React 里 stopPropagation 之后 document 上冒泡阶段的监听器收不到、改用 { capture: true } 的修法 —— 放在正在运行的 PropagationDemo 里。
 * 页面上这一块已注释（PropagationDemo.tsx 里取消注释即可运行）；本文件保留，Example.test.tsx 直接渲染它，结论照样被测试验证。讲解见 Example.tsx 附 1。
 * Vue 对照：vue/PropagationDemo.vue（v-on 直接挂在元素上，和原生监听器按 DOM 顺序交错执行）。
 */
import { useEffect, useRef, useState } from 'react'
import { createDemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

export function CaptureOrderDemo() {
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
    // document 上的监听器只记本实验里的点击
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
    <div className="stack">
      <h4>【少用】onClickCapture，以及 React 事件和原生监听器谁先执行</h4>
      <label className="row">
        <input type="checkbox" checked={stopInButton} onChange={(e) => setStopInButton(e.target.checked)} />
        捕获实验：按钮的 onClick 里调用 e.stopPropagation()
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
            点我（捕获实验）
          </button>
        </div>
      </div>
      <LogPanel log={log} label="捕获实验日志" />
      <ScrollCaptureProbe />
    </div>
  )
}

/**
 * onScroll 在 React 里不冒泡，外层的 onScroll 收不到里面的滚动；想在外层观察里面的滚动，用 onScrollCapture
 * （捕获阶段不限定只派发给目标，react-dom-client.development.js:19411-19413，测试覆盖）。Vue 对应 @scroll.capture。
 */
function ScrollCaptureProbe() {
  const [outerScrollCaptures, setOuterScrollCaptures] = useState(0)

  return (
    <div className="stack" onScrollCapture={() => setOuterScrollCaptures((n) => n + 1)}>
      <div
        data-testid="capture-scroll-box"
        style={{ maxHeight: 60, overflowY: 'auto', border: '1px dashed currentColor', padding: 4 }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>滚动我（第 {i + 1} 行）</div>
        ))}
      </div>
      <p className="muted" data-testid="capture-scroll-count">
        外层的 onScrollCapture：{outerScrollCaptures} 次
      </p>
    </div>
  )
}
