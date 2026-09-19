/**
 * 区块五：Vue 的事件修饰符在 React 里怎么写 —— React 没有修饰符，全部是处理函数里的一两行 JS。
 * .stop / .prevent / .self 见区块三、四；.capture 就是 onClickCapture（【少用】，区块三的 CaptureOrderDemo）；.passive 见附 3。
 * 这里是项目里常用的几件事：【最常用】按键判断 e.key（配合输入法组字判断）、【常用】回车提交时排除 Shift（多行输入里 Shift + Enter 换行）、【常用】「只能点一次」用 state + disabled。
 * 【少用】ref 标记的 .once、多个组合键精确区分（.exact）、鼠标按键与右键菜单：拆到 RareModifiersDemo.tsx，页面上已注释（取消注释即可运行），测试照样直接渲染它。
 * Vue 对照：vue/ModifiersDemo.vue（同样的交互用修饰符声明）。
 */
import { useState, type KeyboardEvent } from 'react'
import { createDemoLog } from './demoKit'
import { LogPanel } from './LogPanel'
/* 【少用】取消下面 <RareModifiersDemo /> 的注释时，这一段也取消注释（删掉这一行和下面的结束行）
import { RareModifiersDemo } from './RareModifiersDemo'
*/

export function ModifiersDemo() {
  const [log] = useState(() => createDemoLog())
  const [claimed, setClaimed] = useState(false)

  /** 【常用】@click.once：按钮用 state 记「领过了」，顺便 disabled —— React 里更常见的写法（界面要跟着变） */
  function handleClaim() {
    if (claimed) return
    setClaimed(true)
    log.add('领取成功（之后再点不再处理）')
  }

  /**
   * 【最常用】@keydown.enter：看 e.key；【常用】按着 Shift 的回车不算提交（Vue 写 .enter.exact，那边连 Ctrl / Alt / Meta 也排除）；【常用】@keydown.esc。
   * 中文输入法组字时按回车是在确认候选词，不该当成提交：MDN keydown 页「To ignore all keydown events that are part of composition」给的写法是
   * 判断 event.isComposing || event.keyCode === 229（③；组字开始 / 结束那一下 isComposing 可能还是 false，所以连 keyCode 一起判断 ——
   * keyCode 在 @types/react 19.2.18 里标了 @deprecated（index.d.ts:2144-2145），MDN 也说它已弃用，但在这个判断里仍建议带上）。
   * React 的 KeyboardEvent 上没有 isComposing，要从 e.nativeEvent 读。Vue 的按键修饰符同样只比较 event.key（runtime-dom.cjs.js:1853-1867），也要自己判断。
   */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter' && !e.shiftKey) {
      log.add('Enter（按着 Shift 不算）：提交')
    } else if (e.key === 'Escape') {
      e.currentTarget.value = ''
      log.add('Esc（相当于 .esc）：清空输入框')
    }
  }

  return (
    <div className="card stack">
      <h3>区块五：Vue 的修饰符在 React 里怎么写</h3>
      <p className="muted">【最常用】按键判断 e.key（中文输入法组字时的回车要排除）；【常用】回车提交时排除 Shift、Esc 清空、只能点一次的按钮用 state + disabled。</p>
      <div className="row">
        <button onClick={handleClaim} disabled={claimed}>
          {claimed ? '已领取' : '领取优惠券（.once）'}
        </button>
      </div>
      <input placeholder="试试 Enter、Shift + Enter、Esc，或者用中文输入法打字后按回车" aria-label="按键实验输入框" onKeyDown={handleKeyDown} />
      <LogPanel log={log} label="区块五日志" />
      {/* 【少用】取消注释即可运行：删掉这一行和下面的结束行，并取消文件顶部 import { RareModifiersDemo } 那一段的注释
      <RareModifiersDemo />
      */}
    </div>
  )
}
