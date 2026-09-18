/**
 * 区块六：多个 state 互相牵制 → 从 useState 升级到 useReducer（入门；列表上的完整模式、action 日志与撤销重放见 29 题）。
 * reducer 与类型在 quantityReducer.ts。
 * Vue 对照：vue/QuantityEditor.vue（没有 useReducer 的内置对应物，reactive 对象 + 直接改它的函数）。
 */
import { useReducer } from 'react'
import { INITIAL_QUANTITY_STATE, STOCK_LIMIT, quantityReducer } from './quantityReducer'

export function QuantityEditor() {
  /**
   * useReducer(reducer, 初始 state) 返回 [state, dispatch]，和 useState 一样是二元组。
   * dispatch(action) 不是「直接改状态」，而是派发一个描述「发生了什么」的对象，React 拿它调用 reducer 算出新 state，再重渲染。
   * 第三个参数是惰性初始化：useReducer(reducer, 参数, init) 首次渲染时用 init(参数) 算初始 state，道理和区块四的 useState(() => …) 一样。
   * dispatch 和 useState 的 setter 一样，引用在组件的整个生命周期里不变，传给 memo 子组件不会破坏浅比较（17 题）。
   */
  const [state, dispatch] = useReducer(quantityReducer, INITIAL_QUANTITY_STATE)

  return (
    <div className="card stack">
      <h3>区块六：多个 state 互相牵制 → useReducer</h3>
      <p className="muted">
        数量 / 是否编辑中 / 输入草稿 / 错误提示 —— 四个互相牵制的字段收进一个 reducer。试试点到上限、输入 0 或字母、编辑到一半取消。
      </p>
      <div className="row">
        <span className="muted">库存上限 {STOCK_LIMIT} 件</span>
        {state.isEditing ? (
          <>
            {/* 受控输入：value 来自 state.draft（07 题） */}
            <input
              value={state.draft}
              placeholder="输入数量"
              aria-label="数量"
              onChange={(e) => dispatch({ type: 'changeDraft', draft: e.target.value })}
            />
            <button className="btn-primary" onClick={() => dispatch({ type: 'commitEdit' })}>
              确定
            </button>
            <button className="btn-ghost" onClick={() => dispatch({ type: 'cancelEdit' })}>
              取消
            </button>
          </>
        ) : (
          <>
            {/* 按钮不做 disabled：边界规则一律交给 reducer 裁决 */}
            <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
            <strong data-testid="editor-quantity">{state.quantity} 件</strong>
            <button onClick={() => dispatch({ type: 'increment' })}>+</button>
            <button onClick={() => dispatch({ type: 'startEdit' })}>直接输入</button>
          </>
        )}
        <button className="btn-ghost" onClick={() => dispatch({ type: 'reset' })}>
          重置
        </button>
      </div>
      {/* 写成 state.error !== '' 是为了让 && 左边是布尔值、意图明确。error 为空串时写 {state.error && …} 也不会显示任何东西（React 不为空字符串创建文本节点，测试覆盖）；
          但同样的写法左边换成数字 0，就会把 0 渲染到页面上（05 题）。 */}
      {state.error !== '' && <p className="error-text">{state.error}</p>}
    </div>
  )
}
