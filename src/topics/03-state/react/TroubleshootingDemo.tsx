/**
 * 区块七：useState 的常见报错 —— react.dev useState 页 Troubleshooting 里的两条。
 * 1）Too many re-renders：渲染时无条件调用 setter（最常见的来源是 onClick={handleClick()}，把「传函数」写成了「调用函数」）；
 * 2）【少用】想把函数存进 state，结果它被调用了：useState / setter 收到函数时会把它当成初始化函数 / 更新函数。项目里很少把函数存进 state，
 *    这一段演示已注释（取消注释即可运行），结论由 Example.test.tsx 里的独立组件验证，讲解见 Example.tsx 附 1。
 * 错误边界用 react-error-boundary（20 题）接住，界面上显示报错原文；开发环境 React 还会用 console.error 打印一次被接住的错误（20 题）。
 * Vue 对照：vue/Example.vue 的说明（Vue 在渲染时改自己读过的数据，开发构建报 Maximum recursive updates exceeded；ref 存函数就是存函数）。
 */
import { useState } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'

/**
 * ❌ 把 onClick={handleClick} 写成了 onClick={handleClick()}：渲染时就调用了 handleClick → setCount → React 立刻再渲染 → 又调用……
 * React 超过重渲染上限后抛错「Too many re-renders. React limits the number of renders to prevent an infinite loop.」（react-dom 19.2.8 实测）。
 * 两道静态检查都会拦：TypeScript 报 handleClick() 的返回值 void 不能当 onClick；lint 报 react-hooks/set-state-in-render。
 */
function CallInsteadOfPass() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)
  }

  return (
    <button
      // @ts-expect-error -- 教学反例：Type 'void' is not assignable to type 'MouseEventHandler<HTMLButtonElement> | undefined'
      onClick={handleClick()} // eslint-disable-line react-hooks/set-state-in-render -- 教学反例：lint 实测报「Cannot call setState during render」「Calling setState during render may trigger an infinite loop.」
    >
      {count}
    </button>
  )
}

/** 正确写法：传函数本身，或者需要参数时包一层箭头函数 onClick={() => handleClick(id)} */
function PassTheFunction() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)
  }

  return <button onClick={handleClick}>✅ onClick={'{handleClick}'}：点了 {count} 次</button>
}

function RenderLoopBlock() {
  const [mounted, setMounted] = useState(false)

  return (
    <div className="stack">
      <h4>Too many re-renders</h4>
      <PassTheFunction />
      <div className="row">
        <button onClick={() => setMounted(true)} disabled={mounted}>
          ❌ 挂载 onClick={'{handleClick()}'} 的组件
        </button>
        <button className="btn-ghost" onClick={() => setMounted(false)} disabled={!mounted}>
          卸载
        </button>
      </div>
      {mounted && (
        <ErrorBoundary fallbackRender={({ error }) => <p className="error-text">错误边界接住了：{getErrorMessage(error)}</p>}>
          <CallInsteadOfPass />
        </ErrorBoundary>
      )}
    </div>
  )
}

/* 【少用】「把函数存进 state」的演示。取消注释即可运行：删掉这一行和下面的结束行，再取消 TroubleshootingDemo 里 <FormatterBlock /> 那一段的注释
type Formatter = (text: string) => string

const toUpper: Formatter = (text) => text.toUpperCase()
const addBang: Formatter = (text) => `${text}!`

const SAMPLE = 'hello state'

// 想存的是「函数」本身：
// - useState(toUpper) ❌：React 把 toUpper 当初始化函数调用（不传参数），state 是它的返回值 —— 这里 text 是 undefined，直接抛错；
// - setFormatter(addBang) ❌：React 把 addBang 当更新函数调用，传进去的是上一个 state（一个函数），state 变成一段字符串。
//   TypeScript 拦不住：addBang 的类型 (text: string) => string 正好也满足 SetStateAction<Formatter> 里「新值」那一支；
// - 正确写法：useState(() => toUpper)、setFormatter(() => addBang) —— 外面包一层返回这个函数的箭头函数。
function FormatterBlock() {
  const [formatter, setFormatter] = useState<Formatter>(() => toUpper)
  // state 被「当成更新函数调用」的写法改坏以后就不是函数了，这里先判断再调用（它的类型写的是 Formatter，TypeScript 不会提醒，只能靠运行时判断）
  const stateType: string = typeof formatter
  const preview = typeof formatter === 'function' ? formatter(SAMPLE) : `state 已经不是函数了（typeof = ${stateType}）`

  return (
    <div className="stack">
      <h4>【少用】想把函数存进 state，它却被调用了</h4>
      <p>
        formatter(&quot;{SAMPLE}&quot;) → <strong data-testid="formatter-preview">{preview}</strong>
      </p>
      <div className="row">
        <button onClick={() => setFormatter(() => toUpper)}>{'✅ setFormatter(() => toUpper)'}</button>
        <button onClick={() => setFormatter(() => addBang)}>{'✅ setFormatter(() => addBang)'}</button>
        <button onClick={() => setFormatter(addBang)}>❌ setFormatter(addBang)</button>
      </div>
    </div>
  )
}
*/

export function TroubleshootingDemo() {
  return (
    <div className="card stack">
      <h3>区块七：常见报错</h3>
      <RenderLoopBlock />
      {/* 【少用】和文件上方 FormatterBlock 的定义一起取消注释（删掉这一行和下面的结束行）
      <FormatterBlock />
      */}
    </div>
  )
}
