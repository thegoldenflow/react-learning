/**
 * 区块三：事件传播 —— 【最常用】onClick（冒泡阶段）从被点的元素一层层往外传；想挡住外层就在处理函数里 e.stopPropagation()。
 * document 上的监听器（点击外部关闭这类代码常见）：按钮里 stopPropagation 之后，document 上冒泡阶段的监听器收不到（17 起原生事件在 root 容器上被停住）；
 * 改用捕获阶段 { capture: true } 就还能收到 —— 这是 React 17 RC 博客给的修法（测试覆盖）。
 * 另附一个小实验：onScroll 在 React 里不冒泡，onFocus 在 React 里冒泡（原生 focus 不冒泡）。
 * 【少用】onClickCapture / onScrollCapture、React 事件和元素上的原生监听器谁先执行：拆到 CaptureOrderDemo.tsx，页面上已注释（取消注释即可运行），测试照样直接渲染它。
 * Vue 对照：vue/PropagationDemo.vue（v-on 直接挂在元素上，和原生监听器按 DOM 顺序交错执行）。
 */
import { useEffect, useRef, useState } from 'react'
/* 【少用】取消下面 <CaptureOrderDemo /> 的注释时，这一段也取消注释（删掉这一行和下面的结束行）
import { CaptureOrderDemo } from './CaptureOrderDemo'
*/
import { createDemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

export function PropagationDemo() {
  const [log] = useState(() => createDemoLog(24))
  const [stopInButton, setStopInButton] = useState(false)
  const outerRef = useRef<HTMLDivElement>(null)

  // document 上挂两个原生监听器（只记本区块里的点击）：冒泡阶段的会被 React 里的 stopPropagation 挡住，捕获阶段的不会
  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return
    const inOuter = (e: Event) => e.target instanceof Node && outer.contains(e.target)
    const onCapture = (e: Event) => {
      if (inOuter(e)) log.add('document 捕获阶段的监听器（{ capture: true }）')
    }
    const onBubble = (e: Event) => {
      if (inOuter(e)) log.add('document 冒泡阶段的监听器')
    }
    document.addEventListener('click', onCapture, { capture: true })
    document.addEventListener('click', onBubble)
    return () => {
      document.removeEventListener('click', onCapture, { capture: true })
      document.removeEventListener('click', onBubble)
    }
  }, [log])

  return (
    <div className="card stack">
      <h3>区块三：事件传播 —— 冒泡与 stopPropagation</h3>
      <p className="muted">
        【最常用】onClick 在冒泡阶段执行：按钮 → 中层 → 外层；勾上下面的选项，按钮的 onClick 里调用 e.stopPropagation()，外层和 document 冒泡阶段的监听器就收不到了，
        document 上改用 {'{ capture: true }'} 的监听器照样收到。
      </p>
      <label className="row">
        <input type="checkbox" checked={stopInButton} onChange={(e) => setStopInButton(e.target.checked)} />
        按钮的 onClick 里调用 e.stopPropagation()
      </label>
      {/* 演示简化：外层和中层的 div 只用来观察传播顺序；真实项目里「可点击的区域」要用 button 或补齐键盘交互（Example.tsx 七） */}
      <div ref={outerRef} className="card stack" data-node="outer" onClick={() => log.add('React 外层 onClick')}>
        外层 div
        <div className="card stack" data-node="inner" onClick={() => log.add('React 中层 onClick')}>
          中层 div
          <button
            onClick={(e) => {
              log.add('React 按钮 onClick')
              // stopPropagation：停的是 React 树里后面的 onClick（中层、外层），同时停住原生事件，document 冒泡阶段的监听器收不到；它不管浏览器的默认动作（区块四）
              if (stopInButton) e.stopPropagation()
            }}
          >
            点我
          </button>
        </div>
      </div>
      <LogPanel log={log} label="区块三日志" />
      <BubblingExceptions />
      {/* 【少用】取消注释即可运行：删掉这一行和下面的结束行，并取消文件顶部 import { CaptureOrderDemo } 那一段的注释
      <CaptureOrderDemo />
      */}
    </div>
  )
}

/**
 * onScroll 在 React 里不冒泡（「This event does not bubble.」，17 起不再模拟冒泡）；onFocus / onBlur 在 React 里冒泡
 * （「Unlike the built-in browser focus event, in React the onFocus event bubbles.」，17 起底层用 focusin / focusout）。
 * 所以外层 div 的 onFocus 能知道「里面有输入框获得了焦点」，外层的 onScroll 却收不到里面滚动区域的滚动（测试覆盖）。
 * 想在外层观察里面的滚动要用 onScrollCapture（【少用】，演示在 CaptureOrderDemo.tsx）。
 */
function BubblingExceptions() {
  const [outerScrolls, setOuterScrolls] = useState(0)
  const [innerScrolls, setInnerScrolls] = useState(0)
  const [outerFocus, setOuterFocus] = useState(0)

  return (
    <div className="stack" onScroll={() => setOuterScrolls((n) => n + 1)} onFocus={() => setOuterFocus((n) => n + 1)}>
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
        里面的 onScroll：{innerScrolls} 次 · 外层的 onScroll：{outerScrolls} 次 · 外层的 onFocus：{outerFocus} 次
      </p>
    </div>
  )
}
