/**
 * 区块一：为什么需要 state —— 普通局部变量的两个问题，以及「state 属于组件实例」。
 * Vue 对照：vue/WhyStateDemo.vue、vue/StateCounter.vue（Vue 的普通变量表现不一样，见那边的注释）。
 */
import { useState } from 'react'
import { createDemoLog, type DemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

/**
 * ❌ 用普通局部变量记点击次数。react.dev state-a-components-memory 列了两个问题：
 * 1）局部变量不跨渲染保留：组件每渲染一次，函数体从头执行，let clicks = 0 重新来一遍；
 * 2）改局部变量不触发渲染：React 不知道你改了它，不会用新数据再渲染一次。
 * 点几下看日志：变量确实在涨（1、2、3），界面一直是 0；再点「让本区块重渲染」，然后接着点 —— 日志又从 1 开始，因为这次渲染的 clicks 是新的 0。
 * 日志写在组件外的 store 里（demoKit.ts），写日志不会让这个组件重渲染，否则问题 2 就看不出来了。
 */
function LocalVariableCounter({ log }: { log: DemoLog }) {
  let clicks = 0

  function handleClick() {
    // eslint-disable-next-line react-hooks/immutability -- 教学反例：lint 实测报「Cannot reassign variable after render completes」「Reassigning `clicks` after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead.」
    clicks += 1
    log.add(`局部变量 clicks 改成了 ${clicks}，界面上还是 0（没有调用 setter，React 不会重渲染）`)
  }

  return (
    <div className="row">
      <span>
        ❌ 局部变量 clicks：<strong data-testid="local-clicks">{clicks}</strong>
      </span>
      {/* eslint-disable-next-line react-hooks/immutability -- 同一个反例在使用处再报一次：「Cannot modify local variables after render completes」「This argument is a function which may reassign or mutate `clicks` after render」 */}
      <button onClick={handleClick}>局部变量 +1</button>
    </div>
  )
}

/**
 * ✅ useState 给两样东西：一个跨渲染保留的 state 变量，一个会「请求 React 用新值再渲染一次」的 setter。
 * 命名约定：const [something, setSomething]。
 */
function StateCounter({ label }: { label: string }) {
  const [count, setCount] = useState(0)
  return (
    <div className="row">
      <span>
        ✅ 计数器 {label}：<strong data-testid={`state-count-${label}`}>{count}</strong>
      </span>
      <button onClick={() => setCount(count + 1)}>{label} +1</button>
    </div>
  )
}

export function WhyStateDemo() {
  const [log] = useState(() => createDemoLog())
  // 只用来让本区块重渲染一次：演示「局部变量不跨渲染保留」
  const [renderRound, setRenderRound] = useState(0)

  return (
    <div className="card stack">
      <h3>区块一：为什么需要 state —— 局部变量不行，state 属于组件实例</h3>
      <LocalVariableCounter log={log} />
      <div className="row">
        <button onClick={() => setRenderRound((n) => n + 1)}>让本区块重渲染（已重渲染 {renderRound} 次）</button>
      </div>
      {/* 同一个组件渲染两次 = 两个独立的实例，各有各的 state，互不影响（测试覆盖） */}
      <StateCounter label="A" />
      <StateCounter label="B" />
      <LogPanel log={log} label="区块一日志" />
    </div>
  )
}
