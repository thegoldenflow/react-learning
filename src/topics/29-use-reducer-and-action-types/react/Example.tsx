/**
 * 学习主题：useReducer 与判别联合 Action —— 把购物车的全部状态变化收敛成一个纯函数
 *
 * React 核心概念：
 * - useReducer(reducer, 初始 state) 返回 [state, dispatch]：组件里不再写「状态怎么改」，
 *   只 dispatch 一个描述「发生了什么」的 action 对象；怎么改全在组件外的 reducer 里
 * - reducer(state, action) => 新 state：纯函数，是所有状态转换的唯一入口 —— 不 mutate 传入的 state、不发请求、
 *   不读 Date.now()；开发环境 StrictMode 会把它调用两次来暴露副作用（本项目开了 StrictMode）
 * - action 用判别联合类型（discriminated union）建模：type 字段是判别标签，switch (action.type) 每个分支里
 *   TS 自动收窄；type 拼错 / 漏传 payload / 加了新 action 忘写 case，全部在【编译期】报错（default 分支的 never 穷尽检查）
 * - useReducer 不给 setter：想改状态只有 dispatch 一条路，「所有变化都经过 reducer」是 API 保证的；
 *   dispatch 的引用跨渲染稳定，传给子组件不需要 useCallback
 * - reducer 拿到的 state 永远是最新的（它本身就是「由旧算新」的形态），不存在 03 题「读快照」的坑
 * - 纯函数的红利（本题重点演示）：每条 action 记进日志 → 撤销 = 从头重放剩余 action → 重放 N 条得到的购物车
 *   与当前一致 → 可以脱离组件写单元测试
 * - 什么时候 useState 就够：单个独立的布尔 / 字符串 / 数字，或更新方式只有「替换」一种；什么时候升级：
 *   同一份 state 有多种更新方式、更新里带业务规则且被多个入口共用、下一个 state 强依赖上一个 state
 *   （本题四种操作共享「同一商品合并数量」「数量小于 1 视为移除」两条规则）
 *
 * Vue 对应概念：
 * - Vue 没有 useReducer 的内置对应物（没有一一对应关系）：日常写法是 reactive 对象 + 直接改它的普通函数
 *   addItem(product) / removeItem(id)，跨组件时是 Pinia 的 action（16 题）—— 不需要 action 对象，也不需要 dispatch
 * - 但「集中描述状态转换」这个模式在 Vue 里完全可用：Vue 侧用同一个 Action 类型 + 一个类型化的
 *   apply(items, action) 函数（switch + never 穷尽检查原样照搬 —— 那是 TypeScript 的能力，不是 React 的）
 * - 差别在 apply 是【原地修改】（push / splice / 直接赋值，reactive 追踪得到），reducer 是【返回新引用】（Object.is 才认）；
 *   纯 reducer 风格在 Vue 里也能用（items.value = cartReducer(items.value, action)），只是不是惯用法
 * - Pinia action ≠ reducer：前者直接 mutate、可以写 async；后者是同步纯函数，副作用一律不许进
 *
 * 最重要的区别：
 * - React：useReducer 只暴露 dispatch，没有 setItems —— 想绕过 reducer 直接改状态在 API 上就做不到；
 *   Vue：reactive 对象谁拿到都能改，「都走 dispatch」只能靠纪律（Vue 侧区块三留了一个「绕过 dispatch 直接改」的反面按钮，
 *   点一下「重放一致」立刻变 ✗；React 侧没有这个按钮，因为根本写不出来）
 * - 与相邻题的区别：03 题区块二是四字段编辑器上「为什么从 useState 升级到 useReducer」的入门；
 *   本题是列表上的完整模式 —— 需求给定的四种 Action、业务规则集中在 reducer、纯函数带来的日志 / 撤销 / 重放 / 可测试。
 *   21 题讲不可变更新的写法本身；16 题讲跨组件的全局状态（Zustand / Pinia），本题的状态仍是组件局部的
 */
import { useReducer, useState } from 'react'
import { PRODUCTS } from '@/shared/products'
import type { CartItem, Product } from '@/shared/types'

/**
 * ★ Action：判别联合类型（discriminated union），与需求里给的形状一字不差。
 *
 * type 字段是「判别标签」（discriminant）。四个成员各自声明自己带什么参数：
 * add 带整个 product、remove 只带 id、changeQuantity 带 id 和目标数量、clear 什么都不带。
 * 在 switch (action.type) 的每个 case 里，TS 会把 action 自动收窄到那一支 ——
 * case 'add' 里 action.product 有完整类型，写 action.id 会直接编译报错。
 *
 * 为什么这比 { type: string; payload?: unknown } 安全得多（面试常问）：
 * 1）type 拼错字（'addd'）→ 不在联合里 → 编译报错，而不是运行时悄悄走到 default；
 * 2）漏传 / 传错参数（send({ type: 'remove' }) 忘了 id）→ 编译报错；
 * 3）将来加一个 { type: 'setToStock'; id: string } 却忘了在 reducer 里写 case →
 *    default 分支的 never 穷尽检查在编译期报错（见 cartReducer 末尾）；
 * 4）读代码的人看这一个类型就知道「这个购物车一共能发生哪四件事」—— 它是状态机的公开契约。
 * 把 payload 写成 unknown 等于放弃以上全部：每个 case 里都得先 as 一遍，类型系统形同虚设。
 *
 * 命名约定：本项目用 type 字段做判别标签（React 官方文档也这么写）；
 * Redux 社区的 { type, payload } 只是另一种排版，判别联合的原理完全一样。
 */
type Action =
  | { type: 'add'; product: Product }
  | { type: 'remove'; id: string }
  | { type: 'changeQuantity'; id: string; quantity: number }
  | { type: 'clear' }

/**
 * 空购物车用一个模块级常量，而不是每次写 []：
 * reducer 从不 mutate 它，所以可以安全共享；而且 clear 时如果购物车本来就是它，
 * 返回同一个引用 → Object.is 相等 → React 直接跳过这次渲染（bail out）。
 */
const EMPTY_CART: CartItem[] = []

/**
 * ★ reducer：(当前 state, action) => 下一个 state。整个购物车的状态转换只有这一个入口。
 *
 * 它必须是【纯函数】，原因不是教条，而是 React 真的依赖这一点：
 * - 开发环境的 StrictMode 会把每次 reducer 调用【故意执行两次】，两次结果必须一样、且不能留下痕迹；
 *   在这里 push 日志、发请求、读 Date.now()，双跑立刻露馅（所以本题的 action 日志记在组件里，不记在 reducer 里）；
 * - 并发渲染下 React 可能重跑或丢弃某次渲染，不纯的 reducer 会把副作用做两遍、或做在被丢弃的分支上；
 * - 本题区块三的「撤销 = 重放」「重放结果与当前一致」全都建立在「同样的 (state, action) 永远得到同样的结果」上。
 *
 * 纯的三条落地规则：
 * 1）不 mutate 传进来的 state：每个分支都返回新数组（map / filter / 展开），旧数组一个字节都不碰（21 题）；
 *    state.push(...) 之后 return state 是最常见的错误 —— 引用没变，React 认为「没变化」，界面纹丝不动；
 * 2）不做任何 I/O：不发请求、不写 localStorage、不 console.log 业务数据；
 * 3）不依赖组件闭包：定义在组件外面，只看参数 —— 所以可以单独 import 出去写单元测试，组件都不用挂载：
 *      expect(cartReducer([], { type: 'add', product: p1 })).toEqual([{ id: 'p1', name: '机械键盘', price: 399, quantity: 1 }])
 *      expect(cartReducer(oneItem, { type: 'changeQuantity', id: 'p1', quantity: 0 })).toEqual([])
 *    （本项目没有装测试框架，这里只展示形态。）
 *
 * 业务规则集中在这里、而不是散落在按钮里：
 * - 「同一商品再次加入 → 数量 +1 而不是新增一行」只写在 add 分支；
 * - 「数量小于 1 视为移除」只写在 changeQuantity 分支 —— UI 上「-」按钮、数量输入框两个入口自动遵守，
 *   将来再加一个「批量改数量」入口也不用再写一遍。
 */
function cartReducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case 'add': {
      // 这一支里 action 已被收窄为 { type: 'add'; product: Product }，action.product 有完整类型
      const { id, name, price } = action.product
      if (state.some((item) => item.id === id)) {
        return state.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      // 只拷贝购物车需要的字段：CartItem 与 Product 是两个类型，不把 category / stock 一起带进来
      return [...state, { id, name, price, quantity: 1 }]
    }
    case 'remove': {
      const next = state.filter((item) => item.id !== action.id)
      // id 不存在时返回原引用而不是一个内容相同的新数组：Object.is 相等 → React 跳过渲染
      return next.length === state.length ? state : next
    }
    case 'changeQuantity': {
      if (!state.some((item) => item.id === action.id)) return state
      if (action.quantity < 1) {
        // 业务规则：数量小于 1 视为移除。写在这里一次，所有入口共享
        return state.filter((item) => item.id !== action.id)
      }
      return state.map((item) => (item.id === action.id ? { ...item, quantity: action.quantity } : item))
    }
    case 'clear':
      return EMPTY_CART
    default: {
      // ★ never 穷尽检查（03 题也用了）：走到这里时四种 action 都已处理，action 的类型只剩 never。
      // 给 Action 加新成员却忘了写 case，这一行立刻编译报错（Type '{ type: "xxx" }' is not assignable to type 'never'）。
      // 写法细节：tsconfig 开了 noUnusedLocals，所以 exhaustive 必须真的被用上；
      // ESLint 的 no-unused-expressions 也不允许写成 `action satisfies never;` 这种裸表达式。
      const exhaustive: never = action
      throw new Error(`未处理的 action：${String(exhaustive)}`)
    }
  }
}

/** 两个购物车「内容相同」：同样的商品、同样的顺序、同样的数量（引用可以不同 —— 重放出来的必然是另一个数组） */
function isSameCart(a: CartItem[], b: CartItem[]): boolean {
  return a.length === b.length && a.every((item, index) => item.id === b[index].id && item.quantity === b[index].quantity)
}

/**
 * 数量输入框的解析：只接受非负整数。
 * 返回 null 表示「这次输入不构成一个有效的 action」（比如按退格清空了输入框），调用方直接忽略 ——
 * React 受控输入会在事件处理完后把 DOM 回写成当前的 value，输入框自动弹回原来的数量。
 * 注意：合法性校验放在 UI 边界（这里），业务规则（小于 1 视为移除）放在 reducer —— 两层各管各的。
 */
function parseQuantity(raw: string): number | null {
  if (raw.trim() === '') return null
  const next = Number(raw)
  return Number.isInteger(next) && next >= 0 ? next : null
}

/** 日志里每条 action 的展示：它们只是普通对象，JSON 序列化后可以存起来、发给服务器、写进测试 */
function describeAction(action: Action): string {
  return JSON.stringify(action)
}

/**
 * ★ 什么时候 useState 就够，什么时候该升级 ——「useState 还是 useReducer」这道面试题的答案
 *
 * useState 够用的情况：state 是一个独立的原始值（布尔 / 字符串 / 数字），或更新方式只有「替换」一种：
 * 输入框的文本、开关、当前选中的 tab、下拉的筛选值 —— 上 reducer 是过度设计（本题的 actionLog 也只用 useState）。
 *
 * 该升级的信号（本题全中）：
 * 1）同一份 state 有多种更新方式（add / remove / changeQuantity / clear），每种都要「由旧算新」；
 * 2）更新里带业务规则，而且同一条规则被多个入口共用（「-」按钮和输入框都要遵守「小于 1 视为移除」）；
 * 3）想把「发生了什么」和「状态怎么变」分开：组件只说 send({ type: 'add', product })，具体怎么变它不关心；
 * 4）想给状态变化做日志 / 撤销 / 重放 / 单测 —— 只有「所有变化都是一个可序列化的对象、经过同一个纯函数」才做得到。
 *
 * 用 useState 写同一个购物车会长这样（只看形态，别抄）：
 *
 *   const [items, setItems] = useState<CartItem[]>([])
 *   const add = (product: Product) =>
 *     setItems((prev) => (prev.some(...) ? prev.map(...) : [...prev, { ...摘字段, quantity: 1 }]))
 *   const remove = (id: string) => setItems((prev) => prev.filter(...))
 *   const decrement = (item: CartItem) =>
 *     item.quantity <= 1 ? remove(item.id) : setItems((prev) => prev.map(...))   // 「小于 1 视为移除」第一次出现
 *   const onQuantityInput = (id: string, raw: string) => {
 *     const next = Number(raw)
 *     if (next < 1) return remove(id)                                             // 同一条规则第二次出现 —— 漏掉一处就是 bug
 *     setItems((prev) => prev.map(...))
 *   }
 *
 * 问题不在于「多几行」，而在于状态逻辑【分散】：四种转换散在四个闭包里，每个都直接握着 setItems，
 * 同一条规则要在两个入口各写一遍；要加日志就得在每个闭包里各 push 一次；想单测就得把组件挂起来点按钮。
 * reducer 把这些收进一个纯函数，组件只剩 dispatch —— 组件变薄，状态逻辑可测。
 *
 * 诚实地说：真实业务里手写 useReducer 的频率不高 —— 局部状态 useState、跨组件 Zustand / Redux Toolkit（16 题）
 * 覆盖了绝大多数场景；它常见于表单向导、拖拽画布、多步流程这类复杂局部交互，以及面试题。
 * 另一个常见组合是 useReducer + Context「自制 Redux」：注意 Context 只是传递手段，不是完整的状态管理方案（15 题）。
 */
export default function Example() {
  /**
   * useReducer(reducer, 初始 state) 返回 [state, dispatch]，和 useState 一样是二元组。
   * 注意这里【没有 setItems】：想改购物车，唯一的路是 dispatch 一个 Action ——「所有变化都经过 reducer」
   * 是 API 本身保证的，不靠自觉。Vue 侧的 reactive 对象谁都能改，这一点是两边最本质的差别。
   *
   * dispatch 的引用跨渲染【稳定】（与 setState 一样永远不变）：传给 memo 子组件不会破坏浅比较，
   * 写进 effect 依赖数组也不会引起重跑，不需要 useCallback 包一层（17 题）。
   *
   * 初始值直接传 EMPTY_CART；如果初始值算起来很贵（比如从 localStorage 解析），用第三个参数惰性初始化：
   * useReducer(cartReducer, storageKey, (key) => loadCart(key))，init 只在首次渲染跑一次（StrictMode 下两次，同样要求纯）。
   */
  const [items, dispatch] = useReducer(cartReducer, EMPTY_CART)

  /**
   * action 日志是【另一份】独立 state —— 它只有「追加」和「替换」两种更新，用 useState 就够（正是上面说的够用场景）。
   * 故意不把日志塞进 reducer 管理的 state 里：日志是「关于状态变化的元数据」，不是购物车本身；
   * 也不能在 reducer 里记日志 —— 那是副作用，StrictMode 双跑会记两遍。
   * 日志放在组件 state 而不是模块级变量里：切题重进、StrictMode 双挂载都不会串台。
   */
  const [actionLog, setActionLog] = useState<Action[]>([])

  /**
   * 所有按钮都走这一个函数：dispatch 给 reducer，同时记一条日志。
   * 同一个事件里的这两次更新会被批处理成【一次】渲染（24 题）。
   * 这里的 action 参数类型就是 Action：send({ type: 'remove' }) 漏了 id、send({ type: 'addd', ... }) 拼错，
   * 都在这个调用点直接编译报错 —— 判别联合的安全性从 reducer 一路延伸到每个按钮。
   */
  const send = (action: Action) => {
    dispatch(action)
    setActionLog((prev) => [...prev, action])
  }

  /**
   * ★ 撤销 =「清空 + 从头重放剩余的 action」。
   * 没有写任何「反向操作」：不用定义 add 的逆是 remove、changeQuantity 的逆是改回旧数量……
   * 因为 reducer 是纯函数，从同一个起点把同一串 action 再喂一遍，必然得到同一个购物车。
   * 这 N+1 次 dispatch 发生在同一个事件里 → React 批处理成【一次】渲染（24 题），中间状态不会闪到屏幕上；
   * reducer 被调用 N+1 次（StrictMode 下再翻倍）—— 纯函数、毫秒级，这正是「纯」换来的自由。
   *（用 clear 回到起点，是因为本题初始 state 恰好就是空购物车；初始 state 不为空时要专门加一个 reset action。
   *  另一种常见实现是把 { past, present } 历史栈直接放进 reducer 的 state —— 思路相同，日志版更能看清「重放」。）
   */
  const undo = () => {
    const remaining = actionLog.slice(0, -1)
    dispatch({ type: 'clear' })
    remaining.forEach((action) => dispatch(action))
    setActionLog(remaining)
  }

  /** 整个演示归零：购物车与日志一起清空（这次 clear 不记日志，它不是「用户对购物车做的事」） */
  const resetDemo = () => {
    dispatch({ type: 'clear' })
    setActionLog([])
  }

  // 派生值在渲染期直接算，不进 state（09 题）
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  /**
   * ★ 纯函数的证据：把整份日志从空购物车开始重放一遍，结果必须与当前购物车一致。
   * 这两行每次渲染都重算（日志几十条、reducer 纯计算，成本可忽略）；它是 reducer 的「活单测」——
   * 只要 reducer 里混进任何不纯的东西（比如按当前时间打折、读一个模块级计数器），这一行立刻变 ✗。
   * reduce 的签名 (acc, cur) => acc 和 reducer 的 (state, action) => state 一模一样 —— useReducer 的名字就是这么来的。
   */
  const replayed = actionLog.reduce(cartReducer, EMPTY_CART)
  const replayMatches = isSameCart(replayed, items)
  const replayedCount = replayed.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="stack">
      {/* ============ 区块一：商品目录 ============ */}
      <div className="card stack">
        <h3>区块一：商品目录 —— 按钮只 dispatch「发生了什么」</h3>
        <p className="muted">
          点「加入购物车」。同一商品第二次加入是数量 +1 而不是多一行 —— 这条规则只写在 reducer 的 add 分支里，
          按钮本身对它一无所知。每点一次，区块三的日志多一条。
        </p>
        <table>
          <thead>
            <tr>
              <th>商品</th>
              <th>分类</th>
              <th>单价</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((product) => {
              const inCart = items.find((item) => item.id === product.id)
              return (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>
                    <span className="badge">{product.category}</span>
                  </td>
                  <td>￥{product.price.toFixed(2)}</td>
                  <td>
                    {/* 按钮里只有一句 send(...)：它不知道「合并数量」这条规则，也不需要知道 */}
                    <button className="btn-primary" onClick={() => send({ type: 'add', product })}>
                      加入购物车{inCart ? `（已有 ${inCart.quantity} 件）` : ''}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ============ 区块二：购物车 ============ */}
      <div className="card stack">
        <h3>区块二：购物车 —— 三个入口，一条规则</h3>
        <p className="muted">
          用「-」「+」或直接输入改数量。减到 0 或输入 0 会把这一行移除：changeQuantity 里「数量小于 1 视为移除」只写了一次，
          「-」按钮和输入框两个入口都自动遵守。「移除」「清空」也只是两条普通 action。
        </p>

        {items.length === 0 ? (
          <p className="muted">购物车是空的 —— 去区块一加几件</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>商品</th>
                <th>单价</th>
                <th>数量</th>
                <th>小计</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>￥{item.price.toFixed(2)}</td>
                  <td>
                    <div className="row">
                      {/*
                        「-」「+」都发 changeQuantity、带【绝对数量】—— 需求给定的 Action 形状就是这样。
                        用本次渲染的 item.quantity ± 1 算目标值在这里是安全的：点击事件发生在渲染之后，
                        每次点击拿到的都是最新一帧。但如果这个更新要在异步回调里发（26 题），快照就可能过期 ——
                        那种场景应改成带增量的 action（{ type: 'increment'; id }），让 reducer 用它拿到的最新 state 去算：
                        reducer 天生就是「函数式更新」的形态，怎么设计 payload 决定了你能不能享受到这一点。
                      */}
                      <button
                        onClick={() => send({ type: 'changeQuantity', id: item.id, quantity: item.quantity - 1 })}
                      >
                        -
                      </button>
                      {/* 受控输入（07 题）：value 来自 state，输入合法且真的变了才 dispatch；不合法时忽略、React 自动把 DOM 弹回。
                          「没变就不发」是 UI 层的小判断，不进 reducer：reducer 只回答「这个 action 会让 state 变成什么」 */}
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={item.quantity}
                        style={{ width: 72 }}
                        onChange={(e) => {
                          const next = parseQuantity(e.target.value)
                          if (next !== null && next !== item.quantity) {
                            send({ type: 'changeQuantity', id: item.id, quantity: next })
                          }
                        }}
                      />
                      <button
                        onClick={() => send({ type: 'changeQuantity', id: item.id, quantity: item.quantity + 1 })}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>￥{(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button className="btn-danger" onClick={() => send({ type: 'remove', id: item.id })}>
                      移除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="row">
          <span>
            合计 <strong>{totalCount}</strong> 件，总价{' '}
            <strong className="success-text">￥{totalPrice.toFixed(2)}</strong>
          </span>
          <button className="btn-danger" disabled={items.length === 0} onClick={() => send({ type: 'clear' })}>
            清空购物车
          </button>
        </div>
      </div>

      {/* ============ 区块三：action 日志、撤销与重放 ============ */}
      <div className="card stack">
        <h3>区块三：action 日志、撤销与重放 —— 纯函数换来的红利</h3>
        <p className="muted">
          每次 dispatch 的 action 原样记在这里（它们只是普通对象，可以序列化、可以存起来）。
          「撤销上一步」= 清空后从头重放剩余的 action，没有写任何「反向操作」：试试加几件、清空、再撤销，整个购物车会回来。
          最后一行每次渲染都用日志重放一遍 reducer，它与当前购物车永远一致 —— 这就是 reducer 是纯函数的证据。
        </p>

        {/* 只在尾部追加 / 删除的列表用 index 作 key 是 06 题规则的例外：存活条目的位置从不变化 */}
        <ul className="log">
          {actionLog.length === 0 && <li className="log-empty">（还没有 action，去区块一点「加入购物车」）</li>}
          {actionLog.map((action, index) => (
            <li key={index}>
              #{index + 1} {describeAction(action)}
            </li>
          ))}
        </ul>

        <p className={replayMatches ? 'success-text' : 'error-text'}>
          重放 {actionLog.length} 条 action 得到的购物车（{replayedCount} 件）与当前购物车（{totalCount} 件）
          {replayMatches ? '一致 ✓' : '不一致 ✗'}
        </p>

        <div className="row">
          <button disabled={actionLog.length === 0} onClick={undo}>
            撤销上一步
          </button>
          <button className="btn-ghost" disabled={actionLog.length === 0 && items.length === 0} onClick={resetDemo}>
            重置演示（清空购物车与日志）
          </button>
        </div>
      </div>
    </div>
  )
}
