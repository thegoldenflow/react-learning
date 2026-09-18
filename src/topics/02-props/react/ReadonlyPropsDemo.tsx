/**
 * 区块二：props 只读 —— 子组件想改，就调用父组件传下来的回调，让父组件改自己的 state、再传新的 props 下来。
 * 另外演示「props 是每次渲染的快照」：事件处理函数里读到的是点击那一次渲染的 props。
 * Vue 对照：vue/ReadonlyPropsDemo.vue、vue/AmountEditor.vue。
 */
import { useState } from 'react'

interface AmountEditorProps {
  amount: number
  /** 回调 prop：约定以 on 开头。子组件只「报告」想改成多少，改不改、怎么改由父组件决定（08 题） */
  onAmountChange: (next: number) => void
  /** 「稍后读取」的延迟，页面上 1500ms，测试里用 fake timers 推进 */
  delayMs: number
}

/**
 * 这里故意用整个 props 对象（不解构），为了能演示 props.amount = 0 这个反例。平时照样在参数里解构。
 * 注意 TypeScript 不拦这个赋值：interface 的字段默认可写。想在编译期拦下，可以把类型写成 Readonly<AmountEditorProps>。
 */
function AmountEditor(props: AmountEditorProps) {
  const { amount, onAmountChange, delayMs } = props
  const [log, setLog] = useState<string[]>([])
  const addLog = (line: string) => setLog((prev) => [...prev, line])

  // ❌ 反例：直接改 props。开发构建里 React 把 props 对象冻结了（Object.freeze），ES 模块是严格模式，赋值直接抛 TypeError；
  // 生产构建不冻结：赋值「成功」但不触发重渲染，这个组件下次自己重渲染时会读到改过的值，父组件一重渲染又被新的 props 对象盖掉
  // —— 界面和数据源对不上（node + 生产构建实测，见 Example.tsx 二-3）。
  function mutateProps() {
    try {
      // eslint-disable-next-line react-hooks/immutability -- 教学反例：演示开发构建里 props 被冻结。lint 实测报「This value cannot be modified」「Modifying component props or hook arguments is not allowed. Consider using a local variable instead.」
      props.amount = 0
      addLog(`赋值没有报错（生产构建是这样）：props.amount 现在是 ${props.amount}，但界面没有更新`)
    } catch (e) {
      addLog(`${(e as Error).name}: ${(e as Error).message}`)
    }
  }

  // ❌ 反例二（不演示按钮）：amount = 0 —— 只改了这次渲染的局部变量，父组件和 React 都不知道、不会重渲染；但同一次渲染里的其他闭包
  // （例如已经排队的定时器回调）会读到 0，界面和逻辑对不上。在事件处理函数里这样写，react-hooks/immutability 同样报错。

  // ✅ 正确做法：把「想改成多少」告诉父组件
  function resetByParent() {
    onAmountChange(0)
    addLog('调用 onAmountChange(0)：父组件更新 state → 重新渲染 → 传下来新的 amount')
  }

  // 快照：这次渲染的 amount 是个常量。定时器回调里读到的是「点击那一次渲染」的值，哪怕这期间父组件已经传了新值下来（23 / 26 题）。
  function readLater() {
    addLog(`点击时 amount = ${amount}，${delayMs}ms 后再读一次…`)
    setTimeout(() => addLog(`${delayMs}ms 后读到 amount = ${amount}（点击那一次渲染的快照）`), delayMs)
  }

  return (
    <div className="stack">
      <p>
        子组件收到的 amount：<strong>{amount}</strong>
      </p>
      <div className="row">
        <button className="btn-danger" onClick={mutateProps}>
          ❌ 直接改 props.amount = 0
        </button>
        <button className="btn-primary" onClick={resetByParent}>
          ✅ onAmountChange(0) 请父组件改
        </button>
        <button onClick={readLater}>稍后读取 amount（快照）</button>
      </div>
      <ul className="log" aria-label="子组件日志">
        {log.length === 0 ? <li className="log-empty">（还没有操作）</li> : log.map((line, i) => <li key={i}>{line}</li>)}
      </ul>
    </div>
  )
}

export function ReadonlyPropsDemo({ delayMs = 1500 }: { delayMs?: number }) {
  // 数据的主人是父组件：state 在这里，子组件只拿到它的一份只读快照
  const [amount, setAmount] = useState(100)

  return (
    <div className="card stack">
      <h3>区块二：props 只读，改动靠回调上浮；props 是每次渲染的快照</h3>
      <div className="row">
        <span>
          父组件的 state：amount = <strong>{amount}</strong>
        </span>
        <button onClick={() => setAmount((a) => a + 100)}>父组件 +100</button>
      </div>
      <p className="muted">试试：先点「稍后读取」，再马上点「父组件 +100」—— 日志里读到的还是点击时的旧值。</p>
      <AmountEditor amount={amount} onAmountChange={setAmount} delayMs={delayMs} />
    </div>
  )
}
