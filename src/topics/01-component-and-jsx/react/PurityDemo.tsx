/**
 * 区块三：组件必须是纯函数 —— 渲染时改外部变量会出什么事，StrictMode 为什么把组件调用两次。
 * Vue 对照：vue/Example.vue 的说明卡（Vue 没有 StrictMode）。
 *
 * 例子照搬 react.dev keeping-components-pure 的「茶杯」：ImpureCup 在渲染时改了组件外的变量 guest。
 * - 同样的输入得到不同的输出：每渲染一次，编号就往上涨；
 * - 开发环境的 StrictMode 会把每个组件函数调用两次（生产环境不会），不纯的组件立刻露馅 —— 页面上是 #2、#4、#6，而不是 #1、#2、#3；
 * - 点「让本区块重渲染」，编号继续往上涨；纯的写法（编号从 props 传进来）始终和输入一致。
 * 渲染只是「调用组件函数、算出这次要什么样的界面」，真正改 DOM 在之后的提交（commit）阶段，而且只改有变化的节点（react.dev render-and-commit；23 题深入）。
 * 所以渲染期间不要做副作用：改外部变量、发请求、改 DOM 都放到事件处理函数里，实在需要和外部同步时才用 Effect（10 题）。
 */
import { useState } from 'react'

/** 组件外的变量：渲染时去改它就是副作用 */
let guest = 0

function ImpureCup() {
  // 故意违反：eslint-plugin-react-hooks 7 的 globals 规则报 error（实测文案见 Example.tsx 六）；保留这个反例是为了看到 StrictMode 的效果
  // eslint-disable-next-line react-hooks/globals
  guest = guest + 1
  return <li>第 #{guest} 位客人的茶杯（不纯：渲染时改了外部变量）</li>
}

/** ✅ 纯：同样的 props 得到同样的 JSX（Same inputs, same output） */
function Cup({ guestNo }: { guestNo: number }) {
  return <li>第 #{guestNo} 位客人的茶杯</li>
}

/**
 * 局部突变是允许的：cups 是这次渲染自己新建的数组，往里 push 不影响任何渲染之前就存在的东西。
 * keeping-components-pure 把这叫 local mutation。
 */
function TeaGathering() {
  const cups = []
  for (let i = 1; i <= 3; i++) {
    cups.push(<Cup key={i} guestNo={i} />)
  }
  return <ul>{cups}</ul>
}

export function PurityDemo() {
  const [renders, setRenders] = useState(0)

  return (
    <div className="card stack">
      <h3>区块三：组件必须是纯函数 · StrictMode 为什么调用两次</h3>
      <p className="muted">
        左边的茶杯在渲染时改了组件外的变量：开发环境里 StrictMode 把每个组件调用两次，第一次打开本页时编号是 #2、#4、#6（间隔 2）；每点一次「让本区块重渲染」、
        或者切到别的题再回来，还会接着涨。
        右边的编号从 props 传入，始终是 1、2、3。生产构建不会调用两次，但不纯的组件照样会在每次重渲染时出错。
      </p>
      <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="stack">
          <strong>不纯</strong>
          <ul aria-label="不纯的茶杯">
            <ImpureCup />
            <ImpureCup />
            <ImpureCup />
          </ul>
        </div>
        <div className="stack">
          <strong>纯（局部突变）</strong>
          <TeaGathering />
        </div>
      </div>
      <div className="row">
        <button onClick={() => setRenders((n) => n + 1)}>让本区块重渲染（已 {renders} 次）</button>
      </div>
    </div>
  )
}
