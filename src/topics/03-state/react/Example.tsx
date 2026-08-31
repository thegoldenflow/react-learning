/**
 * 学习主题：State（useState 与不可变更新 —— React 与 Vue 最核心的思维差异）
 *
 * React 核心概念：
 * - useState(初始值) 返回 [当前值, setter] 二元组，用数组解构自由命名
 * - 绝不直接修改 state：items[0].quantity++ 不会触发任何更新（引用没变，React 察觉不到）
 * - 更新 = 用 setter 传入「新引用」：数组用 map/filter 造新数组，对象用 { ...旧对象, 字段: 新值 }
 * - setter 两种用法：setX(新值) 与 setX(prev => 新值)；新值依赖旧值时必须用函数式
 * - setter 调用后 React 用 Object.is 对比新旧值：不同 → 重新执行整个组件函数生成新 UI
 * - 渲染快照：本次渲染里的 state 是一个常量快照，同一个事件里读两次拿到的是同一个值，
 *   所以 setCount(count + 1) 连写两次只加 1，setCount(c => c + 1) 连写两次才加 2（区块一可点击验证）
 * - useReducer(reducer, 初始 state) 返回 [state, dispatch]：多个 state 互相牵制时，
 *   把「发生了什么（action）」和「状态怎么变（reducer 纯函数）」拆开（区块二）
 *
 * Vue 对应概念：
 * - ref() / reactive() 创建响应式数据，直接改（item.quantity++）就能触发更新
 * - Vue 用 Proxy 拦截读写：渲染时「读」到谁就依赖谁，「写」时精准通知用到它的地方更新
 * - Vue 没有「渲染快照」：count.value 每次都从响应式对象上重新读，连写两次 count.value++ 真的加 2；
 *   因此 Vue 里没有与「函数式更新 setX(prev => ...)」对应的东西（没有一一对应关系）
 * - Vue 也没有 useReducer 的对应物（没有一一对应关系）：直接改 ref / reactive 即可，
 *   逻辑复杂时抽成 composable 或 Pinia action（见 16 题）
 *
 * 最重要的区别：
 * - Vue：可变数据 + 自动依赖追踪 ——「改了就更新」，框架帮你找到最小更新范围；
 * - React：不可变数据 + 显式 setState ——「换了引用才更新」，更新方式是整个组件函数重跑。
 *   把 Vue 的「直接改对象」习惯带进 React 是新手第一大坑，本题注释请逐条读完。
 * - 由此派生：正因为 React 是「快照 + 不可变更新」，才需要函数式更新来绕开过期闭包、
 *   才需要 reducer 这层间接来收敛复杂状态；Vue 的「可变 + 依赖追踪」两者都不需要。
 *   这不是 API 多少的差异，是状态模型的差异。
 */
import { useReducer, useState } from 'react'
import type { CartItem } from '@/shared/types'

/** 初始数据：只在「首次渲染」时被 useState 采用，之后 state 自己独立演化 */
const INITIAL_ITEMS: CartItem[] = [
  { id: 'p1', name: '机械键盘', price: 399, quantity: 1 },
  { id: 'p2', name: '无线鼠标', price: 129, quantity: 2 },
  { id: 'p3', name: '显示器支架', price: 259, quantity: 1 },
]

/**
 * ★ 区块一：连点两次只加 1 ——「渲染快照 / 过期闭包」的最小可复现
 *
 * 上面 changeQuantity 的注释里反复强调「必须函数式更新」，这里让你亲手点出坏掉的那一半。
 *
 * 心智模型：每一次渲染，都有属于它自己的一份 count。
 * 组件函数每渲染一次就整个重跑一次，const [count] = useState(0) 会解构出一个
 * 【本次渲染专属的常量】。事件处理器是在这次渲染里创建的闭包，捕获的就是这个常量——
 * 在这个事件从头执行到尾的过程中，count 绝不会变。所以按钮 A 的两行等价于：
 *     setCount(0 + 1)
 *     setCount(0 + 1)   // 第二行读到的还是快照 0，不是 1
 * 两次都在说「把状态设成 1」，最终只加 1。这就是「过期闭包（stale closure）」：
 * 闭包里存的是那一刻的定格值，而不是「最新值」。
 *
 * 按钮 B 传的是【更新函数】：React 把它排进更新队列，轮到它执行时传进来的 prev
 * 是「队列里前一个更新算完的结果」，于是 0 → 1 → 2，真的加 2。
 *
 * 面试怎么考（这是 React 面试出现频率最高的题之一）：
 * - 「setState 是同步还是异步？」→ setter 不会立刻改本次渲染的 count；React 18+ 默认批处理，
 *   同一个事件里的多次更新会合并成一次重渲染，count 要到下一次渲染才是新值。
 * - 「setCount(count + 1) 写两次为什么只加 1？怎么改？」→ 就是这一题，改成函数式更新。
 * - 推广版：在 setTimeout / Promise.then / addEventListener 回调等【晚于本次渲染】的地方读 state，
 *   读到的同样是当时那次渲染的快照（10、14 题会再遇到）。统一解法都是函数式更新。
 *
 * Vue 老手最容易想错的地方：
 * 在 Vue 里 count.value 是每次从响应式对象上【重新读】出来的，写两次 count.value++ 实打实加 2，
 * 「快照」这个概念根本不存在。千万别把「读 state = 读最新值」的直觉带进 React——
 * React 里读到的永远是本次渲染那一帧的定格。
 */
function SnapshotCounter() {
  const [count, setCount] = useState(0)

  /** ❌ 用本次渲染的 count 算新值：两行读到同一个快照，最终只加 1 */
  const addTwiceByValue = () => {
    setCount(count + 1)
    setCount(count + 1)
  }

  /** ✅ 函数式更新：prev 由 React 在处理更新队列时传入，永远是最新值，最终加 2 */
  const addTwiceByUpdater = () => {
    setCount(prev => prev + 1)
    setCount(prev => prev + 1)
  }

  return (
    <div className="card stack">
      <h3>亲手点出「过期闭包」：连写两次只加 1</h3>
      <p className="muted">
        两个按钮里都写了两行「加一」，唯一差别是写法。点一下 A，再点一下 B，看数字差在哪。
      </p>
      <p>
        当前 count：<strong>{count}</strong>
      </p>
      <div className="row">
        <button onClick={addTwiceByValue}>
          {'A：setCount(count + 1) ×2（预期 +2，实际只 +1）'}
        </button>
        <button className="btn-primary" onClick={addTwiceByUpdater}>
          {'B：setCount(c => c + 1) ×2（实际 +2）'}
        </button>
        <button className="btn-ghost" onClick={() => setCount(0)}>
          归零
        </button>
      </div>
    </div>
  )
}

/** 区块二演示用的库存上限：数量不能超过它 */
const STOCK_LIMIT = 8

/** 区块二的完整状态：四个字段互相牵制（改一个往往要连带改另外几个） */
interface QuantityState {
  /** 已确认的数量 */
  quantity: number
  /** 是否处于「直接输入」模式 */
  isEditing: boolean
  /** 输入框里的草稿文本（未确认，所以不能直接写进 quantity） */
  draft: string
  /** 校验错误文案，空串表示无错 */
  error: string
}

/**
 * Action 的【判别联合类型（discriminated union）】——useReducer 在 TS 项目里的精华。
 * type 字段是「判别标签」：在 switch (action.type) 的每个 case 里，TS 会把 action
 * 自动收窄到对应的那一支，所以 case 'changeDraft' 里能安全地读 action.draft，
 * 而在 case 'increment' 里读 action.draft 会直接编译报错。
 * 面试点：为什么用联合类型而不是 { type: string; payload?: unknown }？
 * 因为前者把「有哪些 action、每个 action 带什么参数」变成了编译期契约，后者等于放弃类型检查。
 */
type QuantityAction =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'startEdit' }
  | { type: 'changeDraft'; draft: string }
  | { type: 'commitEdit' }
  | { type: 'cancelEdit' }
  | { type: 'reset' }

const INITIAL_QUANTITY_STATE: QuantityState = {
  quantity: 1,
  isEditing: false,
  draft: '',
  error: '',
}

/**
 * reducer：(旧 state, action) => 新 state。
 *
 * 三条铁律（面试常问）：
 * 1）必须是【纯函数】：只做计算，不发请求、不 setTimeout、不改外部变量、不读 Date.now()/Math.random()。
 *    React 在开发环境的 StrictMode 下会故意调用它两次来暴露副作用，不纯就会露馅。
 * 2）【绝不能 mutate 传进来的 state】：state.quantity++ 是错的，引用没变 React 认为没变化。
 *    每个分支都要 return { ...state, 要改的字段 }——和本题购物车的不可变更新是同一套规则。
 * 3）它定义在组件外面：不依赖任何 props/state 闭包，因此可以单独 import 出去写单元测试
 *    （这也是 useReducer 相比一堆 useState 的一大好处：状态逻辑可测试）。
 *
 * 注意这里「互相牵制」的体现：确认输入时要同时改 quantity、关掉 isEditing、清空 draft、清空 error。
 * 如果拆成四个 useState，这四行 setXxx 会散落在好几个事件处理器里，漏掉一个就是 bug；
 * 收进 reducer 后，「commitEdit 这件事会让状态变成什么样」只有一处定义。
 */
function quantityReducer(state: QuantityState, action: QuantityAction): QuantityState {
  switch (action.type) {
    case 'increment': {
      // 故意不用 disabled 拦住，让「库存上限」这条规则由 reducer 统一裁决：
      // 规则写在 reducer 里 → 无论 UI 上有几个入口触发 increment，行为都一致。
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
      // 进入编辑模式时用当前数量预填草稿：一个 action 连带改三个字段，正是 reducer 的价值
      return { ...state, isEditing: true, draft: String(state.quantity), error: '' }
    case 'changeDraft':
      // action 携带参数（payload）：在这一支里 TS 已把 action 收窄，action.draft 有类型
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
      // 返回那个常量对象本身是允许的：reducer 从不 mutate 它，所以它可以被安全共享；
      // 而且当 state 本来就等于它时，Object.is 相等 → React 直接跳过这次重渲染。
      return INITIAL_QUANTITY_STATE
    default: {
      // ★ never 穷尽检查：TS 走到这里时 action 的所有分支都被处理过了，类型只剩 never，
      // 才能赋值给 never 类型的变量。将来给 QuantityAction 加一个新分支却忘了写 case，
      // 这一行会立刻【编译期】报错（Type '{ type: "xxx" }' is not assignable to type 'never'）——
      // 这是 TS + reducer 最实用的组合技，面试里说得出来是加分项。
      // 写法细节：tsconfig 开了 noUnusedLocals，所以下一行必须真的用上 exhaustive，
      // 光声明不用会报「已声明但从未读取」。
      const exhaustive: never = action
      throw new Error(`未处理的 action：${String(exhaustive)}`)
    }
  }
}

/**
 * ★ 区块二：多个 state 互相牵制 → 从 useState 升级到 useReducer
 *
 * 什么时候该升级（这就是「useState 和 useReducer 怎么选」这道常规面试题的答案）：
 * 1）多个 state 互相牵制：一个操作要同时改好几个字段（本例：确认输入要一次改 4 个）；
 * 2）更新逻辑复杂且分散：同一条规则（库存上限、至少 1 件）被好几个事件处理器重复实现；
 * 3）下一个状态强依赖上一个状态：reducer 的签名天生就是 (prev, action) => next；
 * 4）想把「发生了什么」和「状态怎么变」分开：组件里只写 dispatch({ type: 'commitEdit' })
 *    这种业务语义，具体怎么变全在 reducer 里——组件变薄，状态逻辑可单测。
 * 反过来：单个独立的布尔/字符串/数字，用 useState 就好，上 reducer 是过度设计。
 *
 * 顺带一个实用点：dispatch 的引用是【稳定的】（跟 setState 一样，永远不变），
 * 传给 memo 包裹的子组件不会破坏浅比较，也不用 useCallback 包（17 题会详讲）。
 *
 * 诚实地说：真实业务代码里手写 useReducer 的频率并不高——
 * 局部状态用 useState、跨组件状态用 Zustand/Redux Toolkit（16 题）就覆盖了绝大多数场景。
 * 它更常出现在面试题，以及表单向导 / 富交互组件（拖拽、画布、多步流程）这类复杂局部交互里。
 * 但它是 React 官方 Learn 里的核心 hook，必须会写、会讲清楚何时选它。
 *
 * Vue 老手容易想错的地方：
 * 「reducer 不就是 Pinia 的 action 吗？」不是。Pinia 的 action 是直接 mutate store、且可以
 * 写异步发请求；reducer 只是一个同步纯函数，只负责算出下一个 state，副作用一律不许进。
 * Vue 侧【没有 useReducer 的对应物】（没有一一对应关系），因为 Vue 直接改响应式对象就行。
 */
function QuantityEditor() {
  /**
   * useReducer(reducer, 初始 state) 返回 [当前 state, dispatch]——和 useState 一样是二元组。
   * dispatch(action) 不是「直接改状态」，而是「派发一个描述发生了什么的对象」，
   * React 拿它去调 reducer 算出新 state，再触发重渲染。
   * （第三个参数 init 惰性初始化本课不展开：useReducer(reducer, 入参, init) 会用 init(入参) 算初始值。）
   */
  const [state, dispatch] = useReducer(quantityReducer, INITIAL_QUANTITY_STATE)

  return (
    <div className="card stack">
      <h3>多个状态互相牵制时：升级到 useReducer</h3>
      <p className="muted">
        数量 / 是否编辑中 / 输入草稿 / 错误提示 —— 四个互相牵制的状态，全部收进一个 reducer。
        试试点到上限、输入 0 或字母、编辑中途取消。
      </p>

      <div className="row">
        <span className="muted">库存上限 {STOCK_LIMIT} 件</span>

        {state.isEditing ? (
          // 编辑模式：输入框受控于 state.draft（受控表单见 07 题）
          <>
            <input
              value={state.draft}
              placeholder="输入数量"
              onChange={e => dispatch({ type: 'changeDraft', draft: e.target.value })}
            />
            <button className="btn-primary" onClick={() => dispatch({ type: 'commitEdit' })}>
              确定
            </button>
            <button className="btn-ghost" onClick={() => dispatch({ type: 'cancelEdit' })}>
              取消
            </button>
          </>
        ) : (
          // 展示模式：注意这里的按钮【不做 disabled】，边界规则一律交给 reducer 裁决
          <>
            <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
            <strong>{state.quantity} 件</strong>
            <button onClick={() => dispatch({ type: 'increment' })}>+</button>
            <button onClick={() => dispatch({ type: 'startEdit' })}>直接输入</button>
          </>
        )}

        <button className="btn-ghost" onClick={() => dispatch({ type: 'reset' })}>
          重置
        </button>
      </div>

      {/* 写 state.error !== '' 而不是 state.error &&：&& 左边是空串时会把空串渲染出来，
          虽然肉眼看不见，但同类写法遇到数字 0 就会把 0 打到页面上（05 题的经典坑） */}
      {state.error !== '' && <p className="error-text">{state.error}</p>}
    </div>
  )
}

export default function Example() {
  /**
   * useState 返回 [值, setter] 二元组，对应 Vue 的 const items = ref([...])。
   * 逐项对比：
   * - 读：React 直接用 items；Vue 在 <script> 里要 items.value（模板里自动解包）
   * - 写：React 只能调 setItems(新数组)；Vue 直接改 items.value 或改里面的对象
   * 为什么 React 要拆成两个东西？因为 items 只是普通数组（没有 Proxy 包装），
   * React 根本「监听」不到你的修改——它得知状态变化的唯一途径，就是你显式调用 setter。
   *
   * 面试考点：为什么 setState 会触发重新渲染？
   * setItems(next) → React 用 Object.is(next, 旧值) 对比 → 引用不同 → 标记组件脏 →
   * 重新执行整个 Example 函数，拿到新 JSX，diff 后更新 DOM。
   * Vue 则是 Proxy 依赖追踪：改哪个属性，只有依赖那个属性的渲染副作用会重新执行，
   * 粒度比 React「整个组件函数重跑」精细得多。
   */
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS)

  /**
   * ❌ 新手第一大坑（从 Vue 来的你必看）：直接改 state 无效！
   *
   *   const brokenPlus = (id: string) => {
   *     const item = items.find(it => it.id === id)
   *     if (item) item.quantity++   // Vue 里这样写完全 OK，React 里 UI 纹丝不动
   *   }
   *
   * 为什么无效：quantity 确实变了，但 items 这个数组的「引用」没变，
   * 而 React 不做任何依赖追踪。即使你补一句 setItems(items)（传回同一个引用），
   * React 用 Object.is 一比：新旧是同一个引用 → 认为「没变」→ 跳过渲染。
   * 结论：必须造一个「新数组/新对象」交给 setter，这就是「不可变更新」。
   */

  /** ✅ 正确写法：map 造新数组；被改的那一项用展开语法造新对象，其余项原样复用引用 */
  const changeQuantity = (id: string, delta: number) => {
    // 函数式更新 setItems(prev => ...)：新状态依赖旧状态时必须这么写。
    // 直接写 setItems(items.map(...)) 这里也能跑，但闭包里的 items 是「本次渲染的快照」：
    // 若同一事件里连续 setItems 两次、或在异步回调里更新，拿到的都是过期旧值，
    // 后一次会把前一次覆盖掉；prev 参数由 React 保证永远是最新状态，稳赢。
    // Vue 没有这个问题：items.value 永远指向那个响应式对象本身，不存在「过期快照」。
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? // 不可变更新套路：{ ...旧对象, 要改的字段: 新值 }；Math.max 保证最少 1 件
            { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    )
  }

  /** 整件移除：filter 天然返回新数组，正好满足「换新引用」的要求 */
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  /**
   * 派生值不需要（也不应该）再开一个 state！
   * 每次 setItems 后整个 Example 函数重跑，下面两行自动重新计算——这就是 UI = f(state)。
   * Vue 的 setup 只执行一次，派生值必须用 computed 包起来；
   * React 的组件函数每次渲染完整重跑，普通 const 就是「天然的 computed」。
   */
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="stack">
      <p className="muted">购物车：+/- 调整数量（最少 1 件），可整件移除</p>

      {/* 列表渲染就是 items.map(...) —— 对应 Vue 的 v-for；key 要用稳定唯一的 id（07 题详讲） */}
      {items.map(item => (
        <div key={item.id} className="card">
          <div className="row">
            <strong>{item.name}</strong>
            <span className="muted">单价 ￥{item.price.toFixed(2)}</span>
          </div>
          <div className="row">
            {/* quantity 为 1 时禁用减号，保证「最少 1 件」 */}
            <button disabled={item.quantity === 1} onClick={() => changeQuantity(item.id, -1)}>
              -
            </button>
            <span>{item.quantity} 件</span>
            <button onClick={() => changeQuantity(item.id, 1)}>+</button>
            <button className="btn-danger" onClick={() => removeItem(item.id)}>
              移除
            </button>
          </div>
        </div>
      ))}

      {items.length === 0 && <p className="muted">购物车空了，去逛逛吧</p>}

      <p>
        合计 <strong>{totalCount}</strong> 件，总价{' '}
        <strong className="success-text">￥{totalPrice.toFixed(2)}</strong>
      </p>

      {/* ↓↓↓ 下面两个区块与购物车相互独立，各自演示一个 React 状态模型的关键点 ↓↓↓ */}
      <SnapshotCounter />
      <QuantityEditor />
    </div>
  )
}
