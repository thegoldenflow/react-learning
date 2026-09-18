/**
 * 区块四：自定义组件接收原生属性 —— 继承类型 + { ...rest } 展开 + className / style 合并 + ref 作为 prop。
 * Vue 对照：vue/UiButtonDemo.vue（fallthrough attributes 自动透传、inheritAttrs: false + useAttrs() 手动接管、多根组件）。
 */
import { useRef, useState } from 'react'
import { UiButton } from './UiButton'

export function UiButtonDemo() {
  const [clicks, setClicks] = useState(0)
  const [focusInfo, setFocusInfo] = useState('（还没移动过焦点）')
  // ref 作为 prop【主流·React 19 起】：父组件的 ref 直接传给 UiButton，UiButton 把它交给真实的 <button>，
  // 所以 deleteRef.current 拿到的是 DOM 节点（Vue 的组件 ref 拿到的是组件实例，要 defineExpose，见 vue/UiButtonDemo.vue）。
  // useRef 必须传初始值（@types/react 19 起的要求，12 / 28 题改写时补）。
  const deleteRef = useRef<HTMLButtonElement>(null)

  function focusDelete() {
    deleteRef.current?.focus()
    setFocusInfo(`焦点在：${document.activeElement?.textContent ?? '（无）'}`)
  }

  return (
    <div className="card stack">
      <h3>区块四：接收原生属性（{'{...rest}'} 展开）与 ref 作为 prop</h3>
      <p className="muted">
        UiButton 只声明了 variant / size 两个自己的 prop；下面的 onClick / disabled / type / title / aria-label 都是原生 button 的属性，靠组件内部的
        {'{...rest}'} 展开才落到真实 &lt;button&gt; 上（Vue 默认由框架自动透传）；className / style 被组件单独接住，和它自己的类名、样式合并后再交给 &lt;button&gt;。
      </p>
      <div className="row">
        {/* onClick 生效，是因为它被 rest 收集后展开到了 <button> 上 */}
        <UiButton onClick={() => setClicks((n) => n + 1)}>点我（onClick 透传）</UiButton>

        {/* 多个原生属性一起透传；ref 也是普通 prop */}
        <UiButton
          ref={deleteRef}
          variant="danger"
          title="这行 title 透传到真实 button 上，鼠标悬停可见"
          aria-label="删除订单 SO-20260803"
          onClick={() => setClicks((n) => n + 1)}
        >
          删除
        </UiButton>

        {/* 只写属性名不写值 = 传 true：<UiButton disabled> 编译成 { disabled: true }（esbuild 实测）。
            disabled 真的落到了原生 button 上：按钮变灰、点击不触发 onClick；组件里要是忘了展开 rest，这个按钮照样能点 */}
        <UiButton disabled onClick={() => setClicks((n) => n + 1)}>
          已禁用
        </UiButton>

        {/* UiButton 把 type="button" 写在 {...rest} 前面，它只是默认值；这里传的 type="submit" 覆盖了它（按钮不在 form 里，点了不会提交） */}
        <UiButton type="submit">type 被覆盖为 submit</UiButton>

        {/* className 与组件自己的 btn-primary 合并；style 与组件内部的 size 样式合并，外部同名属性优先 */}
        <UiButton size="sm" className="btn-ghost" style={{ marginLeft: 8 }}>
          className / style 被合并
        </UiButton>
      </div>
      <div className="row">
        <button onClick={focusDelete}>把焦点移到「删除」按钮（父组件用 ref 调 focus()）</button>
        <span className="muted">{focusInfo}</span>
      </div>
      <p className="muted">onClick 触发次数：{clicks}（点「已禁用」不会增加）</p>
    </div>
  )
}
