<script setup lang="ts">
/**
 * 区块三：Vue 里直接改就更新。对照 react/CartDemo.tsx（React 必须造新数组、新对象交给 setter）。
 * - items 是 ref，装的数组在内部被 reactive() 转成 Proxy，从里面取出来的 item 也是 Proxy，所以 item.quantity += 1 这次「写」被拦截，读过它的组件重新渲染；
 * - 整体替换（items.value = 新数组）也可以，ref 的 .value 能整体换；reactive() 创建的对象不能整体替换（换了就和原来的引用断开了），解构出原始类型的属性也会断开追踪
 *   （解构出来的是普通值），这是 Vue 文档「Limitations of reactive()」三条中的两条（第三条是只能装对象类型），所以官方推荐 ref() 作为声明响应式状态的首选；
 * - 两边方向相反：React 禁止原地改、只认新引用；Vue 靠原地改被拦截来追踪（换新引用在 Vue 里也行，只是不必要）。
 */
import { computed, ref } from 'vue'
import type { CartItem } from '@/shared/types'

const INITIAL_ITEMS: CartItem[] = [
  { id: 'p1', name: '机械键盘', price: 399, quantity: 1 },
  { id: 'p2', name: '无线鼠标', price: 129, quantity: 2 },
  { id: 'p3', name: '显示器支架', price: 259, quantity: 1 },
]

// 要拷一份：ref() 把数组转成 Proxy，但 Proxy 包的还是原来那些对象 —— 不拷的话，下面的原地修改会改掉模块常量 INITIAL_ITEMS。
// React 侧只有 ❌ 按钮才会改到它（所以 React 那边拷贝是为了那个反例）；Vue 的惯用写法就是原地改，所以这里必须拷。
const items = ref<CartItem[]>(INITIAL_ITEMS.map((item) => ({ ...item })))

// ✅ Vue 的惯用写法：直接改（React 里这一段是无效的反例）
function changeQuantity(id: string, delta: number) {
  const item = items.value.find((it) => it.id === id)
  if (item) item.quantity = Math.max(1, item.quantity + delta)
}

// 整体替换也行：filter 造新数组赋给 .value；用 splice 原地删同样会更新
function removeItem(id: string) {
  items.value = items.value.filter((it) => it.id !== id)
}

// setup 只执行一次，派生值用 computed（带缓存，依赖变了才重算）；React 里是组件函数里的普通 const，每次渲染重算
const totalCount = computed(() => items.value.reduce((sum, it) => sum + it.quantity, 0))
const totalPrice = computed(() => items.value.reduce((sum, it) => sum + it.price * it.quantity, 0))
</script>

<template>
  <div class="card stack">
    <h3>区块三：Vue 里直接改就更新</h3>
    <div
      v-for="item in items"
      :key="item.id"
      class="row"
      :data-testid="`cart-row-${item.id}`"
    >
      <strong>{{ item.name }}</strong>
      <span class="muted">￥{{ item.price.toFixed(2) }}</span>
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
    <p
      v-if="items.length === 0"
      class="muted"
    >
      购物车空了
    </p>
    <p>
      合计 <strong data-testid="cart-total-count">{{ totalCount }}</strong> 件，总价
      <strong class="success-text">￥{{ totalPrice.toFixed(2) }}</strong>
    </p>
  </div>
</template>
