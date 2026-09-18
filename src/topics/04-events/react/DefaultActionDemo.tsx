/**
 * 区块四：默认行为 —— preventDefault 和 stopPropagation 是两件事；表单提交用 onSubmit + preventDefault；「只在点到自己时触发」（Vue 的 .self）。
 * Vue 对照：vue/DefaultActionDemo.vue（@submit.prevent、@click.prevent、@click.self）。
 */
import { useState, type MouseEvent, type SubmitEvent } from 'react'

export function DefaultActionDemo() {
  const [bubbled, setBubbled] = useState(0)
  const [message, setMessage] = useState('')
  const [selfClicks, setSelfClicks] = useState(0)

  /**
   * preventDefault 只阻止浏览器的默认动作（这里是跳转），事件照样冒泡到外层（外层计数 +1）。
   * 演示简化：应用内跳转用路由的 <Link>，它内部做的就是「preventDefault + 前端导航」（18 题）；这里只是演示拦截。
   */
  function handleLinkClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    // 看原生事件的 defaultPrevented 才知道浏览器的默认动作有没有真被拦住（合成事件自己的 defaultPrevented 在调用 preventDefault 时无条件变成 true，区块六）
    setMessage(`拦截了跳转（e.nativeEvent.defaultPrevented = ${e.nativeEvent.defaultPrevented}），事件照样冒泡到外层`)
  }

  /**
   * 表单：在 <form> 上监听 onSubmit，不要靠提交按钮的 onClick。输入框里回车时浏览器会先对提交按钮派发一次 click（隐式提交），所以 onClick 不会漏；
   * 问题是它太早：onClick 在浏览器的约束校验（required、pattern）之前执行，必填为空时照样触发，onSubmit 要等校验通过才触发（测试覆盖）；form.requestSubmit() 也不经过按钮。
   * 不 preventDefault，浏览器会按 action 提交并整页刷新（「will reload the whole page by default」）。表单的完整写法见 07 题，React 19 的 <form action> 见 31 题（待新增）。
   */
  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const keyword = new FormData(e.currentTarget).get('keyword')
    setMessage(`拦截了表单提交，关键字：${String(keyword)}（没有整页刷新）`)
  }

  /**
   * stopPropagation 只停传播，不管默认动作：勾选框的默认动作（切换勾选）照样发生，外层计数不变（测试覆盖）。
   * 勾选框是非受控的（defaultChecked），勾没勾上由浏览器决定，正好用来观察默认动作。
   */
  function handleStop(e: MouseEvent<HTMLInputElement>) {
    e.stopPropagation()
    setMessage(`stopPropagation：外层计数不变，勾选框照样变成了${e.currentTarget.checked ? '已勾选' : '未勾选'}`)
  }

  /**
   * Vue 的 @click.self：只有 event.target 是这个元素本身时才处理，点它里面的子元素不算。
   * React 没有修饰符，在处理函数开头判断 e.target !== e.currentTarget 就返回（Vue 的守卫就是这一行，runtime-dom.cjs.js:1822）。
   */
  function handleSelfOnly(e: MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    setSelfClicks((n) => n + 1)
  }

  return (
    <div className="card stack">
      <h3>区块四：默认行为 —— preventDefault 与 stopPropagation 是两件事</h3>
      {/* 演示简化：外层 div 的 onClick 只用来数冒泡 */}
      <div className="stack" onClick={() => setBubbled((n) => n + 1)}>
        <p className="muted" data-testid="bubbled">
          外层收到的冒泡点击：{bubbled} 次
        </p>
        <div className="row">
          <a href="https://example.com/invoice" onClick={handleLinkClick}>
            查看发票（preventDefault）
          </a>
          <label className="row">
            <input type="checkbox" defaultChecked={false} onClick={handleStop} />
            只 stopPropagation 的勾选框
          </label>
        </div>
        <form className="row" onSubmit={handleSubmit}>
          <input name="keyword" defaultValue="键盘" aria-label="搜索关键字" />
          <button type="submit">搜索（onSubmit + preventDefault）</button>
        </form>
      </div>
      {message !== '' && (
        <p className="success-text" data-testid="default-message">
          {message}
        </p>
      )}
      {/* 演示简化：可点击的 div 只用来演示 .self；真实项目里可点击的东西用 button，或补 role、tabIndex 和键盘处理（七；35 题，待新增） */}
      <div className="card" data-testid="self-area" onClick={handleSelfOnly}>
        点这块空白处计数（相当于 .self）；<button>点这个按钮不算</button>
        <span className="muted"> · 已计数 {selfClicks} 次</span>
      </div>
    </div>
  )
}
