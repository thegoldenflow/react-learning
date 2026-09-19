/**
 * 区块五的【少用】部分：.once 的 ref 写法、多个组合键精确区分（Enter 与 Ctrl + Enter 各算一种，Ctrl + Shift + Enter 两个都不算）、鼠标按键（.left / .middle / .right）与自定义右键菜单。
 * 项目里不常需要（工程经验）：「只执行一次」多半同时要改界面，用 state + disabled（ModifiersDemo 里的写法）；回车提交排除 Shift 已经在 ModifiersDemo 里；
 * 区分鼠标按键、拦右键菜单多见于编辑器、画布、自定义右键菜单这类场景。
 * 页面上这一块已注释（ModifiersDemo.tsx 里取消注释即可运行）；本文件保留，Example.test.tsx 直接渲染它，结论照样被测试验证。讲解见 Example.tsx 附 2。
 * Vue 对照：vue/ModifiersDemo.vue（同样的交互用修饰符声明）。
 */
import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { createDemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

export function RareModifiersDemo() {
  const [log] = useState(() => createDemoLog())
  // .once 的另一种写法：只想让处理逻辑执行一次、又不想让界面变化时，用 ref 记一个标记（12 题：改 ref 不触发渲染）
  const reportedRef = useRef(false)

  // 只执行一次、界面不变：ref 标记。也可以用 ref + addEventListener(…, { once: true })，Vue 的 .once 底层用的就是这个选项
  function handleReport() {
    if (reportedRef.current) {
      log.add('已经上报过，这次忽略')
      return
    }
    reportedRef.current = true
    log.add('上报一次')
  }

  /**
   * @keydown.enter.exact / @keydown.ctrl.enter.exact：除了 e.key，还要看 e.ctrlKey / shiftKey / altKey / metaKey，把不想要的修饰键排除掉（.exact 的做法）。
   * 输入法组字的判断和 ModifiersDemo 一样（e.nativeEvent.isComposing || e.keyCode === 229）。
   */
  function handleExactKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    const hasOtherModifier = e.shiftKey || e.altKey || e.metaKey
    if (e.key === 'Enter' && e.ctrlKey && !hasOtherModifier) {
      log.add('Ctrl + Enter（只按了 Ctrl，相当于 .ctrl.enter.exact）：提交并继续')
    } else if (e.key === 'Enter' && !e.ctrlKey && !hasOtherModifier) {
      log.add('Enter（没按任何修饰键，相当于 .enter.exact）：提交')
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
    <div className="stack">
      <h4>【少用】ref 标记的 .once、精确组合键（.exact）、鼠标按键与右键菜单</h4>
      <div className="row">
        <button onClick={handleReport}>上报一次（ref 标记）</button>
      </div>
      <input placeholder="试试 Enter、Ctrl + Enter、Ctrl + Shift + Enter" aria-label="组合键实验输入框" onKeyDown={handleExactKeyDown} />
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
      <LogPanel log={log} label="少用修饰符日志" />
    </div>
  )
}
