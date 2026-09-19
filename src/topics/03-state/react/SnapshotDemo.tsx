/**
 * 区块二：setter 只影响下一次渲染 —— set 之后立刻读还是旧值、连写两次只加 1、设成同一个值会被跳过。
 * 使用频率：要用新值做别的事 →【最常用】先算好存进变量；同一事件里多次更新 →【最常用】更新函数 setCount(c => c + 1)。
 * 本区块只做最小复现：机制见 23 题（渲染与快照）、24 题（更新队列与批处理），异步回调里读到旧值的各种修法见 26 题。
 * Vue 对照：vue/SnapshotDemo.vue（两个按钮都加 2；数据立刻变，DOM 到下一个 tick 才变）。
 */
import { useState } from 'react'
import { createDemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

export function SnapshotDemo() {
  const [log] = useState(() => createDemoLog())
  const [count, setCount] = useState(0)

  /**
   * set 之后立刻读：count 是这次渲染的常量，setCount 不会改它，只是请求 React 用新值再渲染一次。
   * react.dev useState：「The set function only updates the state variable for the next render.」
   */
  function setThenRead() {
    setCount(count + 1)
    log.add(`setCount(${count + 1}) 之后立刻读 count = ${count}（还是这次渲染的值）`)
  }

  /**
   * ✅【最常用】要用新值做别的事（写日志、发请求、传给别的函数）：先算好存进变量，set 和后面的代码都用这个变量。
   * 这是 useState 页 Troubleshooting「I've updated the state, but logging gives me the old value」给的写法：const nextCount = count + 1。
   */
  function computeThenUse() {
    const next = count + 1
    setCount(next)
    log.add(`setCount(next) 之后 count 仍是 ${count}，先算好的 next = ${next}（后面的代码用 next）`)
  }

  /**
   * ❌ 两行读到的是同一个 count：等价于 setCount(0 + 1) 两次，结果只加 1。
   * 这里并不是「setCount 异步」：两次调用都在排队，排的都是「替换成 count + 1」这个值。
   */
  function addTwiceByValue() {
    setCount(count + 1)
    setCount(count + 1)
    log.add(`A：两次 setCount(${count + 1})，排了两条「替换成 ${count + 1}」`)
  }

  /**
   * ✅【最常用】更新函数（updater）：同一事件里多次更新同一个 state 时用。React 处理队列时把「前一条更新算出的结果」传进来，0 → 1 → 2。
   * 命名约定：参数用 state 名的首字母（c）或 prevCount。
   */
  function addTwiceByUpdater() {
    setCount((c) => c + 1)
    setCount((c) => c + 1)
    log.add('B：两次 setCount(c => c + 1)，排了两条「在前一条结果上 +1」')
  }

  /**
   * 设成同一个值：React 用 Object.is 比较新旧值，相同就跳过这次重渲染（连同子组件）。
   * 细节：如果这个组件刚因为自己的 state 更新重渲染过，React 可能还会调用一次组件函数、再跳过子组件（useState 页原文 may still need to call your component，测试覆盖）；
   * 所以不要让组件函数里的逻辑依赖「调用次数」。
   */
  function setSame() {
    setCount(count)
    log.add(`setCount(${count})：和当前值 Object.is 相同，React 跳过这次重渲染`)
  }

  return (
    <div className="card stack">
      <h3>区块二：setter 只影响下一次渲染</h3>
      <p className="muted">【最常用】同一事件里多次更新用更新函数（B）；要用新值做别的事先算好存进变量（「先算好 next 再用」）。A 是反例。</p>
      <p>
        count：<strong data-testid="snapshot-count">{count}</strong>
      </p>
      <div className="row">
        <button onClick={setThenRead}>set 之后立刻读</button>
        <button onClick={computeThenUse}>【最常用】先算好 next 再用</button>
        <button onClick={addTwiceByValue}>{'A：setCount(count + 1) ×2（只 +1）'}</button>
        <button className="btn-primary" onClick={addTwiceByUpdater}>
          {'B：setCount(c => c + 1) ×2（+2）'}
        </button>
        <button onClick={setSame}>设成当前值</button>
        <button className="btn-ghost" onClick={() => setCount(0)}>
          归零
        </button>
      </div>
      <LogPanel log={log} label="区块二日志" />
    </div>
  )
}
