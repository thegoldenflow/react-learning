/**
 * 区块五：Vue 的事件修饰符在 React 里怎么写 —— React 没有修饰符，全部是处理函数里的一两行 JS。
 * .stop / .prevent / .self 见区块三、四；.capture 就是 onClickCapture（区块三）；.passive 见区块六。这里演示 .once、按键修饰符、.ctrl.exact、鼠标按键。
 * Vue 对照：vue/ModifiersDemo.vue（同样的交互用修饰符声明）。
 */
import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { createDemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

export function ModifiersDemo() {
  const [log] = useState(() => createDemoLog())
  const [claimed, setClaimed] = useState(false)
  // .once 的另一种写法：只想让处理逻辑执行一次、又不想让界面变化时，用 ref 记一个标记（12 题：改 ref 不触发渲染）
  const reportedRef = useRef(false)

  /** @click.once：按钮用 state 记「领过了」，顺便 disabled，这是 React 里更常见的写法（界面要跟着变） */
  function handleClaim() {
    if (claimed) return
    setClaimed(true)
    log.add('领取成功（之后再点不再处理）')
  }

  /** 只执行一次、界面不变：ref 标记。也可以用 ref + addEventListener(…, { once: true })，Vue 的 .once 底层用的就是这个选项 */
  function handleReport() {
    if (reportedRef.current) {
      log.add('已经上报过，这次忽略')
      return
    }
    reportedRef.current = true
    log.add('上报一次')
  }

  /**
   * @keydown.enter / @keydown.esc / @keydown.ctrl.enter.exact：看 e.key 和 e.ctrlKey / shiftKey / altKey / metaKey。
   * 中文输入法组字时按回车是在确认候选词，不该当成提交：MDN keydown 页「To ignore all keydown events that are part of composition」给的写法是
   * 判断 event.isComposing || event.keyCode === 229（③；组字开始 / 结束那一下 isComposing 可能还是 false，所以连 keyCode 一起判断 ——
   * keyCode 在 @types/react 19.2.18 里标了 @deprecated（index.d.ts:2144-2145），MDN 也说它已弃用，但在这个判断里仍建议带上）。
   * React 的 KeyboardEvent 上没有 isComposing，要从 e.nativeEvent 读。Vue 的按键修饰符同样只比较 event.key（runtime-dom.cjs.js:1853-1867），也要自己判断。
   */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    const hasOtherModifier = e.shiftKey || e.altKey || e.metaKey
    if (e.key === 'Enter' && e.ctrlKey && !hasOtherModifier) {
      log.add('Ctrl + Enter（只按了 Ctrl，相当于 .ctrl.enter.exact）：提交并继续')
    } else if (e.key === 'Enter' && !e.ctrlKey && !hasOtherModifier) {
      log.add('Enter（没按任何修饰键，相当于 .enter.exact）：提交')
    } else if (e.key === 'Escape') {
      e.currentTarget.value = ''
      log.add('Esc（相当于 .esc）：清空输入框')
    }
  }

  /**
   * 鼠标按键：e.button 0 = 主键（Vue .left）、1 = 辅助键（.middle）、2 = 次键（.right）。右键菜单要在 onContextMenu 里 preventDefault 才不弹浏览器菜单
   * （Vue 写 @contextmenu.prevent）。非主键按下再松开触发的是 auxclick（MDN ③：「a non-primary pointing device button」），不是 click，
   * 所以要区分按键时用 onMouseDown / onMouseUp / onAuxClick / onContextMenu。
   */
  function handleMouseDown(e: MouseEvent<HTMLButtonElement>) {
    const names: Record<number, string> = { 0: '主键（.left）', 1: '辅助键 / 中键（.middle）', 2: '次键 / 右键（.right）' }
    log.add(`按下了${names[e.button] ?? `按键 ${e.button}`}`)
  }

  return (
    <div className="card stack">
      <h3>区块五：Vue 的修饰符在 React 里怎么写</h3>
      <div className="row">
        <button onClick={handleClaim} disabled={claimed}>
          {claimed ? '已领取' : '领取优惠券（.once）'}
        </button>
        <button onClick={handleReport}>上报一次（ref 标记）</button>
      </div>
      <input
        placeholder="试试 Enter、Ctrl + Enter、Esc"
        aria-label="按键实验输入框"
        onKeyDown={handleKeyDown}
      />
      <div className="row">
        <button
          onMouseDown={handleMouseDown}
          onContextMenu={(e) => {
            e.preventDefault()
            log.add('onContextMenu 里 preventDefault：浏览器右键菜单没有弹出')
          }}
        >
          用左键 / 中键 / 右键按我
        </button>
      </div>
      <LogPanel log={log} label="区块五日志" />
    </div>
  )
}
