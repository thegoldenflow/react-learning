<script setup lang="ts">
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
import { computed, reactive, ref } from 'vue'
import { PRODUCTS } from '@/shared/products'
import type { CartItem, Product } from '@/shared/types'

/**
 * ★ Action：与 React 侧【同一个】判别联合类型，一字不差。
 *
 * 判别联合是 TypeScript 的能力，不是 React 的：type 字段做判别标签、switch 里自动收窄、default 分支的 never 穷尽检查，
 * 在 Vue 项目里原样可用。日常 Vue 代码很少写它 —— 直接调 addItem(product) 比 dispatch({ type: 'add', product }) 短，
 * 而且 Pinia action 天生就是「一个函数一种变化」。但只要你想要「每一次状态变化都是一个可序列化的普通对象」
 *（操作日志、撤销 / 重放、录制回放、跨 worker / 跨标签页同步），这个类型就值得写 —— 本题演示的正是这些红利。
 *
 * 为什么比 { type: string; payload?: unknown } 安全（与 React 侧同一套理由，因为它们是同一个 TS 特性）：
 * 拼错 type、漏传 id、加了新成员却忘了处理，全部在编译期报错，而不是运行时悄悄走到 default。
 */
type Action =
  | { type: 'add'; product: Product }
  | { type: 'remove'; id: string }
  | { type: 'changeQuantity'; id: string; quantity: number }
  | { type: 'clear' }

/**
 * ★ apply(items, action)：类型化的 action 函数 —— React 侧 cartReducer 在 Vue 里的对应写法。
 *
 * 签名对照：
 *   React   cartReducer(state: CartItem[], action: Action): CartItem[]   // 返回【新数组】，旧的一个字节不碰
 *   Vue     apply(items: CartItem[], action: Action): void              // 【原地修改】传进来的数组，不返回
 *
 * 为什么 Vue 可以原地改：items 是 reactive 代理，push / splice / 直接赋值都会被 Proxy 拦截，
 * 读过它的组件渲染函数与 computed 被触发重新执行；React 没有依赖追踪、只认「引用变没变」（Object.is），
 * 所以 reducer 必须返回新引用（21 题）。两边写法的差异，根源就是 03 题讲的「可变 + 依赖追踪」vs「不可变 + 换引用」。
 *
 * 它不是纯函数（改了参数），但它【确定性 + 不读任何外部状态】：同一串 action 从空数组开始 apply 一遍，
 * 必然得到同样的购物车 —— 这就足以支撑下面的撤销 / 重放 / 「重放一致」检查。
 * 想要 React 那种严格的纯函数也行：把 React 侧的 cartReducer 原样搬来，写 cart.items = cartReducer(cart.items, action)
 * —— 能用，但不是 Vue 的惯用法：Vue 的心智是「改对象」，不是「换引用」。
 *
 * 业务规则同样集中在这里：「同一商品再次加入 → 数量 +1」只在 add 分支，「数量小于 1 视为移除」只在 changeQuantity 分支，
 * 「-」按钮 / 输入框 / 将来的批量入口都自动遵守 —— 「规则只写一遍」这条好处与框架无关。
 * 它也定义在组件外面、不碰任何 ref：可以单独 import 出去，传一个普通数组就能写单元测试。
 */
function apply(items: CartItem[], action: Action): void {
  switch (action.type) {
    case 'add': {
      // 这一支里 action 已被收窄为 { type: 'add'; product: Product }
      const { id, name, price } = action.product
      const exists = items.find((item) => item.id === id)
      if (exists) {
        // 直接改对象：Vue 里天经地义，React 里这行是无效反例（03 题第一大坑）
        exists.quantity += 1
      } else {
        // 只拷贝购物车需要的字段：CartItem 与 Product 是两个类型，不把 category / stock 一起带进来
        items.push({ id, name, price, quantity: 1 })
      }
      return
    }
    case 'remove': {
      const index = items.findIndex((item) => item.id === action.id)
      if (index !== -1) items.splice(index, 1)
      return
    }
    case 'changeQuantity': {
      const index = items.findIndex((item) => item.id === action.id)
      if (index === -1) return
      if (action.quantity < 1) {
        // 业务规则：数量小于 1 视为移除。写在这里一次，所有入口共享
        items.splice(index, 1)
      } else {
        items[index].quantity = action.quantity
      }
      return
    }
    case 'clear':
      // 原地清空（items.length = 0 也行）。千万别写 items = []：那只是把局部变量指向了另一个数组，
      // 响应式对象里的那个数组纹丝不动 —— 这是「原地修改」风格自己的坑，React 的「返回新数组」反而没有
      items.splice(0, items.length)
      return
    default: {
      // ★ never 穷尽检查：与 React 侧同一行代码。给 Action 加新成员却忘了写 case，这里立刻编译报错。
      // 写法同 03 题：noUnusedLocals 要求 exhaustive 真的被用到，所以拿它拼进错误信息
      const exhaustive: never = action
      throw new Error(`未处理的 action：${String(exhaustive)}`)
    }
  }
}

/** 两个购物车「内容相同」：同样的商品、同样的顺序、同样的数量（引用可以不同 —— 重放出来的必然是另一个数组） */
function isSameCart(a: CartItem[], b: CartItem[]): boolean {
  return a.length === b.length && a.every((item, index) => item.id === b[index].id && item.quantity === b[index].quantity)
}

/** 数量输入框的解析：只接受非负整数；null 表示「这次输入不构成一个有效的 action」（比如按退格清空了输入框） */
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
 * ★ 什么时候值得这么写 ——「useState 还是 useReducer」这道题在 Vue 里长什么样
 *
 * Vue 没有 setter，所以没有「多个 setter 让逻辑分散」这个说法；但同一种分散照样会发生：
 * 「加入购物车」按钮里写 cart.items.push(...)、「-」按钮里写 item.quantity--、输入框里再判断一次「小于 1 要删」——
 * 四个入口各自直接改 reactive 对象，「合并同一商品」「小于 1 视为移除」这些规则散在模板和处理器里，漏一处就是 bug。
 *
 * Vue 的常规「升级路线」是：模板里直接改 → 抽成命名函数 addItem() / removeItem()（多数场景到这里就够）
 * → 跨组件时搬进 Pinia 的 action（16 题）。它升级的是「代码放哪」，不是 API：始终是普通函数直接 mutate，没有 dispatch。
 * React 的 useState → useReducer 升级的是「状态只能怎么改」：从「谁都能 setItems」收紧为「只能 dispatch 一个 action」。
 *
 * 本题故意把 Vue 侧也写成 dispatch(action) 风格，是为了演示这个模式在 Vue 里同样可用、以及它换来的红利
 * （日志 / 撤销 / 重放 / 可测试）；日常 Vue 项目里没有这些需求时，写 addItem() 就好，不必为了像 React 而绕这一层。
 *
 * 对照 React 侧那份「useState 够用」的清单：单个独立的布尔 / 字符串 / 数字（输入框文本、开关、当前 tab）—— Vue 里就是一个 ref，
 * 本题的 actionLog 也只是一个 ref，它只有「追加」和「替换」两种变化，不值得进 apply。
 */

/**
 * 购物车本体：reactive 包一个对象，items 是它里面的数组。
 * 与 React 侧 useReducer(cartReducer, EMPTY_CART) 对照：那边组件手里只有 [items, dispatch]，没有 setItems；
 * 这边 cart 是一个普通的响应式对象 —— 模板、任何函数、甚至子组件拿到它都能直接改，「都走 dispatch」只能靠纪律。
 * 这不是 Vue 的缺陷（它换来的是 03 题讲的「改了就更新」的手感），但正是本题「最重要的区别」那一条：
 * React 用 API 强制收口，Vue 用约定收口。区块三的反面按钮就是「约定被打破」的样子。
 */
const cart = reactive<{ items: CartItem[] }>({ items: [] })

/**
 * action 日志：与购物车分开存，只记「发生了什么」。
 * 放在组件的 setup 作用域（不是模块级变量）：切题重进、壳应用重复挂载都不会串台。
 * React 侧特别强调「不能在 reducer 里记日志，StrictMode 双跑会记两遍」；Vue 没有 StrictMode 双跑这回事（没有一一对应关系），
 * 但把日志留在 dispatch 里而不是 apply 里同样更干净：apply 只负责状态转换，才能被重放随便调用而不产生副作用。
 */
const actionLog = ref<Action[]>([])

/**
 * 所有按钮都走这一个函数：对购物车 apply 一次，同时记一条日志 —— 对应 React 侧的 send()。
 * 参数类型就是 Action：dispatch({ type: 'remove' }) 漏了 id、dispatch({ type: 'addd', ... }) 拼错，都在调用点编译报错。
 * 这两次修改发生在同一个同步调用里，Vue 只在微任务里刷新一次 DOM（24 题：Vue 批的是 DOM 刷新，不是数据）。
 */
function dispatch(action: Action) {
  apply(cart.items, action)
  actionLog.value.push(action)
}

/**
 * ★ 撤销 =「清空 + 从头重放剩余的 action」，与 React 侧完全同构，用的是同一个 apply。
 * 没有写任何「反向操作」：不用定义 add 的逆是 remove、changeQuantity 的逆是改回旧数量……
 * 因为 apply 是确定性的，从空购物车把同一串 action 再喂一遍，必然得到同一个购物车。
 * 这 N+1 次原地修改全在一个同步函数里，DOM 只刷新一次，中间状态不会闪到屏幕上。
 *（用 clear 回到起点，是因为本题初始 state 恰好就是空购物车；初始 state 不为空时要专门加一个 reset action。）
 */
function undo() {
  const remaining = actionLog.value.slice(0, -1)
  apply(cart.items, { type: 'clear' })
  remaining.forEach((action) => apply(cart.items, action))
  actionLog.value = remaining
}

/** 整个演示归零：购物车与日志一起清空（这次 clear 不记日志，它不是「用户对购物车做的事」） */
function resetDemo() {
  apply(cart.items, { type: 'clear' })
  actionLog.value = []
}

/**
 * ❌ 反面教材：绕过 dispatch，直接改 reactive 对象。
 * 界面会立刻更新（Vue 追踪得到），但日志里没有这一步 ——「重放一致」立刻变 ✗；再点一次「撤销」它就被抹掉了，
 * 因为撤销是从日志重放出来的。这就是「状态变化没有经过唯一入口」的代价：日志、撤销、重放、单测全部失真。
 * React 侧写不出这个按钮：useReducer 没给 setItems，组件手里只有 dispatch。
 */
function mutateBehindDispatch() {
  const first = cart.items.at(0)
  if (first) first.quantity += 1
}

/**
 * 数量输入框：:value 单向绑定 + @input 手动 dispatch。
 * 这里故意不用 v-model="item.quantity" —— 那会直接写 reactive 对象，正是上面说的「绕过 dispatch」，
 * 日志与重放立刻失真。「所有变化都经过 apply」在 Vue 里要靠这种自觉。
 *
 * 与 React 受控输入的一个小差别：React 会在事件处理完后自动把 DOM 弹回 state 的值（07 题），
 * 所以非法输入「忽略」就够了；Vue 的 :value 只是「state 变了才写 DOM」，我们没改 state 它就不会重写，
 * 非法输入得自己把 DOM 写回去，否则输入框会停在空白而 state 还是原来的数量。
 * @input 拿到的是原生 Event，e.target 要断言成 HTMLInputElement（28 题：这正是 v-model 帮你省掉的那一步）。
 */
function onQuantityInput(item: CartItem, event: Event) {
  const input = event.target as HTMLInputElement
  const next = parseQuantity(input.value)
  if (next === null) {
    input.value = String(item.quantity)
    return
  }
  // 没变就不发：UI 层的小判断，不进 apply —— apply 只回答「这个 action 会让购物车变成什么」
  if (next !== item.quantity) dispatch({ type: 'changeQuantity', id: item.id, quantity: next })
}

/** 商品目录按钮上显示「已有 N 件」用；返回 undefined 表示不在购物车里 */
function quantityInCart(id: string): number | undefined {
  return cart.items.find((item) => item.id === id)?.quantity
}

// 派生值用 computed（09 题）：React 侧是组件函数里的普通 const，每次渲染重算
const totalCount = computed(() => cart.items.reduce((sum, item) => sum + item.quantity, 0))
const totalPrice = computed(() => cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0))

/**
 * ★ 确定性的证据：把整份日志从空购物车开始重放一遍，结果必须与当前购物车一致。
 * 注意这里的 items 是一个【普通数组】，不是 reactive —— apply 对它照样有效，因为 apply 只是个 JS 函数，
 * 对「传进来的是不是响应式代理」一无所知；这也是它能脱离组件写单测的原因。
 * React 侧对应 actionLog.reduce(cartReducer, EMPTY_CART)：reducer 返回新值所以能用 reduce 串起来；
 * apply 原地改所以用 for 循环喂同一个数组 —— 两种形态，同一件事。
 * 只要有人绕过 dispatch 改了购物车（区块三的反面按钮），或者 apply 里混进了不确定的东西（按当前时间打折），这一行立刻变 ✗。
 */
const replayed = computed(() => {
  const items: CartItem[] = []
  for (const action of actionLog.value) apply(items, action)
  return items
})
const replayMatches = computed(() => isSameCart(replayed.value, cart.items))
const replayedCount = computed(() => replayed.value.reduce((sum, item) => sum + item.quantity, 0))
</script>

<template>
  <div class="stack">
    <!-- ============ 区块一：商品目录 ============ -->
    <div class="card stack">
      <h3>区块一：商品目录 —— 按钮只 dispatch「发生了什么」</h3>
      <p class="muted">
        点「加入购物车」。同一商品第二次加入是数量 +1 而不是多一行 —— 这条规则只写在 apply 的 add 分支里，
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
          <tr
            v-for="product in PRODUCTS"
            :key="product.id"
          >
            <td>{{ product.name }}</td>
            <td>
              <span class="badge">{{ product.category }}</span>
            </td>
            <td>￥{{ product.price.toFixed(2) }}</td>
            <td>
              <!-- 按钮里只有一句 dispatch(...)：它不知道「合并数量」这条规则，也不需要知道 -->
              <button
                class="btn-primary"
                @click="dispatch({ type: 'add', product })"
              >
                加入购物车{{ quantityInCart(product.id) !== undefined ? `（已有 ${quantityInCart(product.id)} 件）` : '' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ============ 区块二：购物车 ============ -->
    <div class="card stack">
      <h3>区块二：购物车 —— 三个入口，一条规则</h3>
      <p class="muted">
        用「-」「+」或直接输入改数量。减到 0 或输入 0 会把这一行移除：changeQuantity 里「数量小于 1 视为移除」只写了一次，
        「-」按钮和输入框两个入口都自动遵守。「移除」「清空」也只是两条普通 action。
      </p>

      <p
        v-if="cart.items.length === 0"
        class="muted"
      >
        购物车是空的 —— 去区块一加几件
      </p>
      <table v-else>
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
          <tr
            v-for="item in cart.items"
            :key="item.id"
          >
            <td>{{ item.name }}</td>
            <td>￥{{ item.price.toFixed(2) }}</td>
            <td>
              <div class="row">
                <!-- 「-」「+」都发 changeQuantity、带【绝对数量】—— 需求给定的 Action 形状就是这样。
                     这里读 item.quantity 永远是最新值（reactive 现读现取），没有 React 侧注释里提到的「异步回调里快照过期」问题 -->
                <button @click="dispatch({ type: 'changeQuantity', id: item.id, quantity: item.quantity - 1 })">
                  -
                </button>
                <!-- 故意不用 v-model="item.quantity"：那会绕过 dispatch 直接写 reactive 对象，见 onQuantityInput 的注释 -->
                <input
                  type="number"
                  min="0"
                  step="1"
                  :value="item.quantity"
                  style="width: 72px"
                  @input="onQuantityInput(item, $event)"
                >
                <button @click="dispatch({ type: 'changeQuantity', id: item.id, quantity: item.quantity + 1 })">
                  +
                </button>
              </div>
            </td>
            <td>￥{{ (item.price * item.quantity).toFixed(2) }}</td>
            <td>
              <button
                class="btn-danger"
                @click="dispatch({ type: 'remove', id: item.id })"
              >
                移除
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="row">
        <span>
          合计 <strong>{{ totalCount }}</strong> 件，总价
          <strong class="success-text">￥{{ totalPrice.toFixed(2) }}</strong>
        </span>
        <button
          class="btn-danger"
          :disabled="cart.items.length === 0"
          @click="dispatch({ type: 'clear' })"
        >
          清空购物车
        </button>
      </div>
    </div>

    <!-- ============ 区块三：action 日志、撤销与重放 ============ -->
    <div class="card stack">
      <h3>区块三：action 日志、撤销与重放 —— 同一个 apply 换来的红利</h3>
      <p class="muted">
        每次 dispatch 的 action 原样记在这里（它们只是普通对象，可以序列化、可以存起来）。
        「撤销上一步」= 清空后从头重放剩余的 action，没有写任何「反向操作」：试试加几件、清空、再撤销，整个购物车会回来。
        最后一行每次都用日志重放一遍 apply，它与当前购物车一致 —— 直到你点那个红色的反面按钮：
        绕过 dispatch 直接改 reactive 对象，界面照样更新，但日志不知道，重放立刻对不上；再点一次「撤销」它就被抹掉了。
      </p>

      <!-- 只在尾部追加 / 删除的列表用 index 作 key 是 06 题规则的例外：存活条目的位置从不变化 -->
      <ul class="log">
        <li
          v-if="actionLog.length === 0"
          class="log-empty"
        >
          （还没有 action，去区块一点「加入购物车」）
        </li>
        <li
          v-for="(action, index) in actionLog"
          :key="index"
        >
          #{{ index + 1 }} {{ describeAction(action) }}
        </li>
      </ul>

      <p :class="replayMatches ? 'success-text' : 'error-text'">
        重放 {{ actionLog.length }} 条 action 得到的购物车（{{ replayedCount }} 件）与当前购物车（{{ totalCount }} 件）
        {{ replayMatches ? '一致 ✓' : '不一致 ✗' }}
      </p>

      <div class="row">
        <button
          :disabled="actionLog.length === 0"
          @click="undo"
        >
          撤销上一步
        </button>
        <!-- React 侧没有这个按钮：useReducer 只给 dispatch，没有 setItems，想绕过 reducer 在 API 上就做不到 -->
        <button
          class="btn-danger"
          :disabled="cart.items.length === 0"
          @click="mutateBehindDispatch"
        >
          反面教材：绕过 dispatch，直接 cart.items[0].quantity++
        </button>
        <button
          class="btn-ghost"
          :disabled="actionLog.length === 0 && cart.items.length === 0"
          @click="resetDemo"
        >
          重置演示（清空购物车与日志）
        </button>
      </div>
    </div>
  </div>
</template>
