<script setup lang="ts">
/**
 * 区块一：绑定与传参。对照 react/BindingDemo.tsx。
 * - 方法处理器 @click="handleCountClick"：自动收到原生事件对象（React 收到的是合成事件）；
 * - 内联处理器：OrderRow.vue 里的 @click="emit('remove', item.id, $event.shiftKey)"。模板编译器按「是不是合法的标识符 / 属性访问路径」区分两者，内联写法会被包成函数，
 *   所以模板里写「调用」是对的 —— React 的 JSX 只是普通 JS 表达式，onClick={removeItem(item.id)} 会在渲染时立刻执行（React 侧区块一的 ❌ 列表）；
 * - 内联处理器里要原生事件就用 $event，或者写成箭头函数 (e) => …。
 */
import { ref } from 'vue'
import type { OrderItem } from '@/shared/types'
import OrderRow from './OrderRow.vue'

const INITIAL_ITEMS: OrderItem[] = [
  { id: 'i1', name: '机械键盘', price: 399, quantity: 2 },
  { id: 'i2', name: '无线鼠标', price: 129, quantity: 2 },
  { id: 'i3', name: '显示器支架', price: 199, quantity: 1 },
]

const clicks = ref(0)
const lastPos = ref('还没点过')
const items = ref<OrderItem[]>(INITIAL_ITEMS.map((item) => ({ ...item })))

// 方法处理器：参数就是原生 MouseEvent（全局类型，不用 import）
function handleCountClick(e: MouseEvent) {
  clicks.value++
  lastPos.value = `x=${Math.round(e.clientX)}, y=${Math.round(e.clientY)}`
}

function handleRemove(id: string, onlyOne: boolean) {
  const item = items.value.find((it) => it.id === id)
  if (!item) return
  if (onlyOne && item.quantity > 1) item.quantity -= 1
  else items.value = items.value.filter((it) => it.id !== id)
}

function restore() {
  items.value = INITIAL_ITEMS.map((item) => ({ ...item }))
}
</script>

<template>
  <div class="card stack">
    <h3>区块一：绑定与传参 —— 模板里的「调用」会被编译成函数</h3>
    <div class="row">
      <button @click="handleCountClick">
        点击计数：{{ clicks }}
      </button>
      <span
        class="muted"
        data-testid="last-pos"
      >最后一次点击位置：{{ lastPos }}</span>
    </div>
    <ul class="stack">
      <OrderRow
        v-for="item in items"
        :key="item.id"
        :item="item"
        @remove="handleRemove"
      />
      <li
        v-if="items.length === 0"
        class="muted"
      >
        商品已全部删除
      </li>
    </ul>
    <div class="row">
      <button @click="restore">
        恢复商品
      </button>
    </div>
  </div>
</template>
