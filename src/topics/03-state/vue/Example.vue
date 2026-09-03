<script setup lang="ts">
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
import { computed, reactive, ref } from 'vue'
import type { CartItem } from '@/shared/types'

const INITIAL_ITEMS: CartItem[] = [
  { id: 'p1', name: '机械键盘', price: 399, quantity: 1 },
  { id: 'p2', name: '无线鼠标', price: 129, quantity: 2 },
  { id: 'p3', name: '显示器支架', price: 259, quantity: 1 },
]

// React 里这一步是：const [items, setItems] = useState(INITIAL_ITEMS)。
// ref 返回一个带 .value 的响应式引用，读写都是它自己，没有单独的 setter。
// 注意这里要拷贝一份（map + 展开）：Vue 是「直接改对象本身」，不拷贝的话
// 会把模块级常量 INITIAL_ITEMS 改坏；React 的不可变更新永远不碰旧数据，天然没这个问题。
const items = ref<CartItem[]>(INITIAL_ITEMS.map((item) => ({ ...item })))

// 直接修改就能触发更新：Proxy 拦截到对 quantity 的「写」，精准通知用到它的地方。
// React 里这一段是无效反例 —— 引用没变、React 察觉不到，
// 必须 setItems(prev => prev.map(...)) 造新数组 + 新对象。
function changeQuantity(id: string, delta: number) {
  const item = items.value.find((it) => it.id === id)
  if (item) item.quantity = Math.max(1, item.quantity + delta) // 最少 1 件
}

// 整体替换写法（filter 造新数组赋给 .value），和 React 的 filter 写法形似；
// 区别：Vue 用 splice 原地删也一样能更新，React 只有「换新引用」这一条路。
function removeItem(id: string) {
  items.value = items.value.filter((it) => it.id !== id)
}

// Vue 的 setup 只执行一次，派生值必须用 computed 声明（带依赖缓存）；
// React 里这一步只是组件函数里的普通 const —— 因为整个函数每次渲染都会重跑。
const totalCount = computed(() => items.value.reduce((sum, it) => sum + it.quantity, 0))
const totalPrice = computed(() => items.value.reduce((sum, it) => sum + it.price * it.quantity, 0))

/**
 * ★ 区块一：同样两个按钮，Vue 里都真的加 2
 *
 * React 侧这里是 useState + 「渲染快照 / 过期闭包」的可点击复现：
 * 按钮 A 连写两次 setCount(count + 1) 只加 1，因为 count 是本次渲染的常量快照。
 * Vue 【没有「渲染快照」这个概念】——count.value 每次都是从响应式对象上重新读，
 * 所以下面两个按钮在 Vue 里效果完全一样，都实打实加 2。
 *
 * 本区块只做最小复现，React 侧的完整讲解见 23 题（渲染模型与 state 快照）与 24 题（批处理与函数式更新）。
 */
const count = ref(0)

// 对照 React 的按钮 A（React 只加 1）：这里第二行读 count.value 时，
// 读到的已经是第一行写进去的新值，所以加 2。
function addTwiceByValue() {
  count.value = count.value + 1
  count.value = count.value + 1
}

// 对照 React 的按钮 B（React 加 2）。注意：Vue 里【没有与「函数式更新」对应的东西】
//（没有一一对应关系）——函数式更新是为了绕开 React 的渲染快照才存在的，
// Vue 没有快照就不需要它。所以这个按钮和上面那个在 Vue 里是同一回事。
function addTwiceByMutation() {
  count.value++
  count.value++
}

function resetCount() {
  count.value = 0
}

/**
 * ★ 区块二：多个状态互相牵制 —— React 用 useReducer，Vue 直接改
 *
 * React 侧写了一整套：QuantityState 接口 + Action 判别联合类型 + reducer 纯函数
 *（每个分支 return { ...state, 要改的字段 }，default 分支用 never 做编译期穷尽检查）+ dispatch 驱动 UI。
 * Vue 侧【没有 useReducer 的对应物】（没有一一对应关系），下面就是最自然的 Vue 写法。
 *
 * 差异的根源不是 API 多少，而是状态模型：
 * React 是「不可变更新 + 渲染快照」，状态一多，「谁在什么时候造了哪个新对象」就容易散落在
 * 各个事件处理器里，才需要 reducer 这层间接，把「发生了什么」收敛进一个纯函数；
 * Vue 直接在响应式对象上改就行，逻辑复杂时的惯用做法是抽成 composable 或 Pinia action（见 16 题）——
 * 而且 Pinia action 和 reducer 也不是一回事：前者直接 mutate、可以写异步，后者是同步纯函数。
 *
 * 本区块是 useReducer 的入门；判别联合 Action 的完整讲解、action 日志与撤销重放见 29 题。
 */
const STOCK_LIMIT = 8

// 四个互相牵制的状态：数量 / 是否编辑中 / 输入草稿 / 错误提示。
// 用一个 reactive 对象装起来，正好和 React 侧 reducer 管理的那个 state 对象对齐。
const editor = reactive({
  quantity: 1,
  isEditing: false,
  draft: '',
  error: '',
})

// 下面每个函数，都对应 React 侧 reducer 里的一个 case 分支。
// 区别：这里是「直接改」，React 那边是「返回一个新 state 对象」。
function increment() {
  if (editor.quantity >= STOCK_LIMIT) {
    editor.error = `库存只有 ${STOCK_LIMIT} 件，加不上去了`
    return
  }
  editor.quantity += 1
  editor.error = ''
}

function decrement() {
  if (editor.quantity <= 1) {
    editor.error = '至少 1 件'
    return
  }
  editor.quantity -= 1
  editor.error = ''
}

// 一个动作连带改三个字段：React 侧这正是「该上 useReducer」的信号，Vue 里三行赋值而已
function startEdit() {
  editor.isEditing = true
  editor.draft = String(editor.quantity)
  editor.error = ''
}

function commitEdit() {
  const next = Number(editor.draft)
  if (!Number.isInteger(next) || next < 1) {
    editor.error = '请输入 ≥ 1 的整数'
    return
  }
  if (next > STOCK_LIMIT) {
    editor.error = `库存只有 ${STOCK_LIMIT} 件`
    return
  }
  editor.quantity = next
  editor.isEditing = false
  editor.draft = ''
  editor.error = ''
}

function cancelEdit() {
  editor.isEditing = false
  editor.draft = ''
  editor.error = ''
}

function resetEditor() {
  editor.quantity = 1
  editor.isEditing = false
  editor.draft = ''
  editor.error = ''
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      购物车：+/- 调整数量（最少 1 件），可整件移除
    </p>

    <!-- v-for + :key 对应 React 的 items.map(...) + key -->
    <div
      v-for="item in items"
      :key="item.id"
      class="card"
    >
      <div class="row">
        <strong>{{ item.name }}</strong>
        <span class="muted">单价 ￥{{ item.price.toFixed(2) }}</span>
      </div>
      <div class="row">
        <!-- quantity 为 1 时禁用减号，保证「最少 1 件」 -->
        <button
          :disabled="item.quantity === 1"
          @click="changeQuantity(item.id, -1)"
        >
          -
        </button>
        <span>{{ item.quantity }} 件</span>
        <button @click="changeQuantity(item.id, 1)">
          +
        </button>
        <button
          class="btn-danger"
          @click="removeItem(item.id)"
        >
          移除
        </button>
      </div>
    </div>

    <p
      v-if="items.length === 0"
      class="muted"
    >
      购物车空了，去逛逛吧
    </p>

    <p>
      合计 <strong>{{ totalCount }}</strong> 件，总价
      <strong class="success-text">￥{{ totalPrice.toFixed(2) }}</strong>
    </p>

    <!-- ↓↓↓ 下面两个区块与购物车相互独立，各自对照 React 侧的一个关键点 ↓↓↓ -->

    <!-- 区块一：React 侧按钮 A 只加 1，Vue 侧两个按钮都加 2 -->
    <div class="card stack">
      <h3>同样两个按钮：Vue 里都真的加 2</h3>
      <p class="muted">
        React 侧的按钮 A 只会 +1（渲染快照 / 过期闭包）；Vue 没有快照，两个按钮都 +2
      </p>
      <p>
        当前 count：<strong>{{ count }}</strong>
      </p>
      <div class="row">
        <button @click="addTwiceByValue">
          A：count.value = count.value + 1 ×2（+2）
        </button>
        <button
          class="btn-primary"
          @click="addTwiceByMutation"
        >
          B：count.value++ ×2（+2）
        </button>
        <button
          class="btn-ghost"
          @click="resetCount"
        >
          归零
        </button>
      </div>
    </div>

    <!-- 区块二：同一个交互场景，React 侧用 useReducer + dispatch，Vue 侧直接调函数改对象 -->
    <div class="card stack">
      <h3>多个状态互相牵制时：Vue 直接改就行</h3>
      <p class="muted">
        数量 / 是否编辑中 / 输入草稿 / 错误提示 —— React 侧把这四个状态收进了一个 reducer
      </p>

      <div class="row">
        <span class="muted">库存上限 {{ STOCK_LIMIT }} 件</span>

        <!-- v-if / v-else 挂在 template 标签上：对应 React 侧三元表达式里的两个 Fragment 片段 -->
        <template v-if="editor.isEditing">
          <input
            v-model="editor.draft"
            placeholder="输入数量"
          >
          <button
            class="btn-primary"
            @click="commitEdit"
          >
            确定
          </button>
          <button
            class="btn-ghost"
            @click="cancelEdit"
          >
            取消
          </button>
        </template>
        <template v-else>
          <!-- 和 React 侧一样不做 disabled：边界规则统一由上面那几个函数裁决 -->
          <button @click="decrement">
            -
          </button>
          <strong>{{ editor.quantity }} 件</strong>
          <button @click="increment">
            +
          </button>
          <button @click="startEdit">
            直接输入
          </button>
        </template>

        <button
          class="btn-ghost"
          @click="resetEditor"
        >
          重置
        </button>
      </div>

      <p
        v-if="editor.error !== ''"
        class="error-text"
      >
        {{ editor.error }}
      </p>
    </div>
  </div>
</template>
