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
 *
 * Vue 对应概念：
 * - ref() / reactive() 创建响应式数据，直接改（item.quantity++）就能触发更新
 * - Vue 用 Proxy 拦截读写：渲染时「读」到谁就依赖谁，「写」时精准通知用到它的地方更新
 *
 * 最重要的区别：
 * - Vue：可变数据 + 自动依赖追踪 ——「改了就更新」，框架帮你找到最小更新范围；
 * - React：不可变数据 + 显式 setState ——「换了引用才更新」，更新方式是整个组件函数重跑。
 *   把 Vue 的「直接改对象」习惯带进 React 是新手第一大坑，本题注释请逐条读完。
 */
import { computed, ref } from 'vue'
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
  </div>
</template>
