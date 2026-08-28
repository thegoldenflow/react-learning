<script setup lang="ts">
/**
 * 学习主题：派生状态（computed vs 渲染时直接算）
 *
 * React 核心概念：
 * - 派生值的默认写法是「渲染时直接算」：const total = items.reduce(...) 写在组件函数体里，
 *   每次渲染重算——这是 React 默认且正确的做法，不需要任何 API
 * - useMemo 只有两种情况才需要：计算确实昂贵；或需要引用稳定
 *   （结果要传给 React.memo 子组件 / 要进其他 Hook 的依赖数组）
 * - 不要为了模仿 computed 滥用 useMemo：它本身有成本（存依赖、每次渲染对比），默认先不用
 * - 反模式：把派生值放进 useState 再用 useEffect 同步——多一份数据、多一轮渲染、可能不同步
 * - 判断标准：能从现有 state / props 算出来的值，都不该是 state
 *
 * Vue 对应概念：
 * - computed(() => ...)：自动追踪依赖、自动缓存，是 Vue 派生值的唯一惯用写法
 * - Vue 侧的同款反模式：ref + watch 手动同步派生值，同样不要做（该用 computed）
 *
 * 最重要的区别：
 * - Vue 的 setup 只执行一次，派生值必须用 computed 才能「自动跟着变」；
 *   React 组件函数每次渲染整个重跑，普通 const 天然就是最新值，默认不需要任何包装
 * - useMemo ≠ computed：useMemo 要手写依赖数组、不自动追踪、只是性能优化手段，
 *   两者没有一一对应关系
 */
import { computed, ref } from 'vue'
import type { CartItem } from '@/shared/types'

const INITIAL_CART: CartItem[] = [
  { id: 'c1', name: '降噪耳机', price: 249, quantity: 1 },
  { id: 'c2', name: '蓝牙音箱', price: 129, quantity: 1 },
  { id: 'c3', name: 'USB-C 数据线', price: 29, quantity: 2 },
]

/** 免运费门槛：总金额超过它就免运费 */
const FREE_SHIPPING_THRESHOLD = 500

// 浅拷贝再交给 ref：下面 changeQuantity 直接改对象（可变更新），不拷贝会把模块级常量改掉；
// React 版全程不可变更新，从不碰初始常量
const items = ref<CartItem[]>(INITIAL_CART.map(it => ({ ...it })))

function changeQuantity(id: string, delta: number) {
  const target = items.value.find(it => it.id === id)
  // Vue 直接改对象属性；React 里这一步必须 map 出新数组 + 新对象（不可变更新）
  if (target) target.quantity = Math.max(1, target.quantity + delta)
}

// Vue 的派生值只有一种惯用写法：computed——自动追踪依赖、依赖不变时读缓存。
// React 版这三个值是组件函数体里的普通 const（每次渲染直接重算）：
// React 组件函数每次渲染整个重跑，直接算天然拿到最新值；
// Vue 的 setup 只执行一次，必须靠 computed 建立「随依赖自动更新」的值。
const totalCount = computed(() => items.value.reduce((sum, it) => sum + it.quantity, 0))
const totalPrice = computed(() =>
  items.value.reduce((sum, it) => sum + it.price * it.quantity, 0),
)
// 派生值可以继续派生：freeShipping 依赖 totalPrice——computed 链会自动按需更新
const freeShipping = computed(() => totalPrice.value > FREE_SHIPPING_THRESHOLD)

// React 版这里还演示了一个 useMemo 版本（手写依赖数组；只有计算昂贵或需要引用稳定才值得用，
// 且那边明确注释了「数据量小，useMemo 纯属演示，实际不需要」）。
// computed 默认就缓存 + 自动追踪依赖，与 useMemo 语义并不等价，没有一一对应关系；
// Vue 里也不存在「非缓存的直接算」惯用写法，computed 就是唯一姿势。

// ❌ Vue 侧的同款反模式：ref + watch 手动同步派生值——不要这样做！
//
//   const total = ref(0)
//   watch(items, () => {
//     total.value = items.value.reduce((sum, it) => sum + it.price * it.quantity, 0)
//   }, { deep: true, immediate: true })
//
// 和 React 的「useState + useEffect 同步」一模一样的病：多一份可能过期的数据、更新慢一拍、
// 忘了同步就是 bug。判断标准两边一致：能从现有状态算出来的值，都不该是独立状态——
// Vue 用 computed，React 渲染时直接算。
</script>

<template>
  <div class="stack">
    <div
      v-for="it in items"
      :key="it.id"
      class="card row"
    >
      <strong>{{ it.name }}</strong>
      <span class="muted">￥{{ it.price.toFixed(2) }}</span>
      <button
        :disabled="it.quantity <= 1"
        @click="changeQuantity(it.id, -1)"
      >
        -
      </button>
      <span>{{ it.quantity }}</span>
      <button @click="changeQuantity(it.id, 1)">
        +
      </button>
    </div>

    <div class="card stack">
      <!-- 下面展示的每个值都是 computed 派生出来的，没有一个是独立状态（模板里自动解包 .value） -->
      <p>总件数：{{ totalCount }} 件</p>
      <p>总金额：￥{{ totalPrice.toFixed(2) }}</p>
      <p class="muted">
        （React 版此处还展示了 useMemo 版总金额作对比；Vue 用 computed，无此区分）
      </p>
      <p
        v-if="freeShipping"
        class="success-text"
      >
        总金额已超过 ￥{{ FREE_SHIPPING_THRESHOLD }}，免运费！
      </p>
      <p
        v-else
        class="muted"
      >
        距离免运费还差 ￥{{ (FREE_SHIPPING_THRESHOLD - totalPrice).toFixed(2) }}
        （总金额超过 ￥{{ FREE_SHIPPING_THRESHOLD }} 免运费）
      </p>
    </div>
  </div>
</template>
