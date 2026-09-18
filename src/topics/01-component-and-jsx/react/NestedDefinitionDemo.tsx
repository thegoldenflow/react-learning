/**
 * 区块四：不要在组件里面定义组件 —— 父组件每渲染一次，里面定义的组件就是一个新函数，子树被卸载重建，state 丢光。
 * Vue 对照：vue/Example.vue 的说明卡。
 *
 * react.dev your-first-component：组件可以渲染别的组件，但「never nest their definitions」，要定义在模块顶层。
 * 原因在 preserving-and-resetting-state：React 按「树里的位置 + 组件类型」决定保不保留 state；
 * 定义在父组件里的 NestedNote 每次渲染都是一个新的函数（新的组件类型），在 React 看来同一位置换了一个组件，于是卸载旧的、挂载新的。
 * 用 key 也救不了（key 相同但类型不同照样重建），只能把定义挪到模块顶层；需要父组件的数据就通过 props 传进去。
 * 这也是 06 题「换 key = 换实例」、18 题「同位置同类型复用实例」的同一条规则。
 */
import { useState } from 'react'

/** ✅ 定义在模块顶层：每次渲染都是同一个函数，同一位置的实例和 state 保留 */
function StableNote({ owner }: { owner: string }) {
  const [text, setText] = useState('')
  return (
    <label className="row">
      <span>顶层定义（{owner}）：</span>
      <input value={text} placeholder="先打几个字" onChange={(e) => setText(e.target.value)} />
    </label>
  )
}

export function NestedDefinitionDemo() {
  const [clicks, setClicks] = useState(0)
  const owner = `点击了 ${clicks} 次`

  // ❌ 在组件里定义组件：每次渲染 NestedDefinitionDemo 都会创建一个新的 NestedNote 函数
  // eslint-plugin-react-hooks 7 的 static-components 规则报 error（实测文案见 Example.tsx 六）；保留这个反例是为了看到 state 被重置
  function NestedNote() {
    const [text, setText] = useState('')
    return (
      <label className="row">
        <span>组件里定义（{owner}）：</span>
        <input value={text} placeholder="先打几个字" onChange={(e) => setText(e.target.value)} />
      </label>
    )
  }

  return (
    <div className="card stack">
      <h3>区块四：不要在组件里面定义组件</h3>
      <p className="muted">在两个输入框里都打几个字，再点「让父组件重渲染」：组件里定义的那个被清空了（整个子树卸载重建），顶层定义的保留。</p>
      <button onClick={() => setClicks((n) => n + 1)}>让父组件重渲染</button>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <NestedNote />
      <StableNote owner={owner} />
    </div>
  )
}
