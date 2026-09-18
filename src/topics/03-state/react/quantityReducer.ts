/**
 * 区块六的 reducer：状态类型、Action 判别联合、reducer 纯函数。
 * 放在单独的 .ts 文件并导出，一是组件文件只导出组件（Fast Refresh，见 demoKit.ts 开头），二是可以脱离组件单独测试（Example.test.tsx 里直接调用它）——
 * react.dev extracting-state-logic-into-a-reducer 的「Testing」一条说的就是这个。判别联合与 never 穷尽检查的完整讲解、action 日志与撤销重放见 29 题。
 */

/** 库存上限：数量不能超过它 */
export const STOCK_LIMIT = 8

/** 四个互相牵制的字段：改一个往往要连带改另外几个 */
export interface QuantityState {
  /** 已确认的数量 */
  quantity: number
  /** 是否处于「直接输入」模式 */
  isEditing: boolean
  /** 输入框里的草稿文本（未确认，所以不能直接写进 quantity） */
  draft: string
  /** 校验错误文案，空串表示没有错误 */
  error: string
}

/**
 * Action 的判别联合类型（discriminated union）：type 是判别标签，switch (action.type) 的每个 case 里 TypeScript 自动收窄，
 * case 'changeDraft' 里能安全地读 action.draft，别的分支里读 action.draft 编译报错。
 * 比 { type: string; payload?: unknown } 好在：有哪些 action、各带什么参数，变成了编译期契约。
 */
export type QuantityAction =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'startEdit' }
  | { type: 'changeDraft'; draft: string }
  | { type: 'commitEdit' }
  | { type: 'cancelEdit' }
  | { type: 'reset' }

export const INITIAL_QUANTITY_STATE: QuantityState = {
  quantity: 1,
  isEditing: false,
  draft: '',
  error: '',
}

/**
 * reducer：(旧 state, action) => 新 state。三条要求：
 * 1）纯函数：只做计算，不发请求、不 setTimeout、不改外部变量、不读 Date.now() / Math.random()。StrictMode 开发环境会调用它两次来暴露副作用。
 * 2）不改传进来的 state：每个分支 return { ...state, 要改的字段 }，和区块三的不可变更新是同一套规则（原地改 + 返回同一个对象，Object.is 相同，React 跳过）。
 * 3）定义在组件外：不依赖 props / state 闭包，所以能导出来单独测试。
 *
 * 「互相牵制」的体现：确认输入要同时改 quantity、关掉 isEditing、清空 draft 和 error。拆成四个 useState 的话，这四行 setXxx 会散落在几个事件处理函数里，
 * 漏一个就是 bug；收进 reducer 后，「commitEdit 会让状态变成什么样」只在一处定义。
 */
export function quantityReducer(state: QuantityState, action: QuantityAction): QuantityState {
  switch (action.type) {
    case 'increment': {
      // 故意不在按钮上 disabled：「库存上限」这条规则由 reducer 统一裁决，UI 上有几个入口触发 increment，行为都一致
      if (state.quantity >= STOCK_LIMIT) {
        return { ...state, error: `库存只有 ${STOCK_LIMIT} 件，加不上去了` }
      }
      return { ...state, quantity: state.quantity + 1, error: '' }
    }
    case 'decrement': {
      if (state.quantity <= 1) {
        return { ...state, error: '至少 1 件' }
      }
      return { ...state, quantity: state.quantity - 1, error: '' }
    }
    case 'startEdit':
      // 一个 action 连带改三个字段：进入编辑模式时用当前数量预填草稿
      return { ...state, isEditing: true, draft: String(state.quantity), error: '' }
    case 'changeDraft':
      // 这一支里 action 已被收窄，action.draft 有类型
      return { ...state, draft: action.draft, error: '' }
    case 'commitEdit': {
      const next = Number(state.draft)
      if (!Number.isInteger(next) || next < 1) {
        return { ...state, error: '请输入 ≥ 1 的整数' }
      }
      if (next > STOCK_LIMIT) {
        return { ...state, error: `库存只有 ${STOCK_LIMIT} 件` }
      }
      return { ...state, quantity: next, isEditing: false, draft: '', error: '' }
    }
    case 'cancelEdit':
      return { ...state, isEditing: false, draft: '', error: '' }
    case 'reset':
      // 返回那个常量对象本身是可以的：reducer 从不修改它，所以能安全共享；state 本来就等于它时 Object.is 相同，React 跳过这次重渲染
      return INITIAL_QUANTITY_STATE
    default: {
      // never 穷尽检查：所有分支都处理过，action 的类型只剩 never。给 QuantityAction 加了新分支却忘了写 case，这一行编译期报错
      // （Type '{ type: "xxx" }' is not assignable to type 'never'）。tsconfig 开了 noUnusedLocals，所以下一行要真的用上 exhaustive。
      const exhaustive: never = action
      throw new Error(`未处理的 action：${String(exhaustive)}`)
    }
  }
}
