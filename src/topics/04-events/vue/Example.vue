<script setup lang="ts">
/**
 * 学习主题：事件处理（onClick、事件对象、传参、冒泡与默认行为）
 *
 * React 核心概念：
 * - 事件用 camelCase 属性绑定：onClick={handler}，绑定的是「函数引用」，不是函数调用
 * - 给处理函数传参必须包一层箭头函数：onClick={() => handler(id)}
 * - 事件对象是 SyntheticEvent（React 对原生事件的跨浏览器包装），
 *   类型写作 React.MouseEvent<HTMLButtonElement>
 * - React 没有事件修饰符，阻止冒泡/默认行为要在处理函数里手动调用
 *   e.stopPropagation() / e.preventDefault()
 *
 * Vue 对应概念：
 * - @click="handler" 绑定事件；模板里 @click="handler(item.id)" 可以直接写「调用」，
 *   Vue 编译器会把它包成内联函数
 * - $event 就是原生 DOM 事件对象
 * - 修饰符 .stop / .prevent / .once / .self 声明式处理冒泡与默认行为
 *
 * 最重要的区别：
 * - onClick={handler(id)} 会在「每次渲染时」立即执行 handler——经典新手坑；
 *   Vue 模板里同样的写法却是对的，因为模板会被编译、而 JSX 只是普通 JS 表达式
 * - Vue 的事件修饰符在 React 中没有一一对应关系，.stop/.prevent 全部要手写在处理函数里
 */
import { ref } from 'vue'
import type { OrderItem, OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

const initialItems: OrderItem[] = [
  { id: 'i1', name: '机械键盘', price: 399, quantity: 1 },
  { id: 'i2', name: '无线鼠标', price: 129, quantity: 2 },
  { id: 'i3', name: '显示器支架', price: 199, quantity: 1 },
]

const count = ref(0)
const lastPos = ref('还没点过')
const items = ref<OrderItem[]>([...initialItems])
const status = ref<OrderStatus>('pending')
const cardClicks = ref(0)
const linkMsg = ref('')

// 这里的 e 是「原生 DOM MouseEvent」（模板里叫 $event）；
// React 里这一步拿到的是 SyntheticEvent 包装，类型写作 React.MouseEvent<HTMLButtonElement>。
function handleCountClick(e: MouseEvent) {
  count.value++
  lastPos.value = `x=${e.clientX}, y=${e.clientY}`
}

function removeItem(id: string) {
  items.value = items.value.filter((item) => item.id !== id)
}

// 阻止冒泡由模板里的 @click.stop 修饰符完成，函数里不用碰事件对象；
// React 没有修饰符，要在函数里手写 e.stopPropagation()。
function toggleStatus() {
  status.value = status.value === 'pending' ? 'paid' : 'pending'
}

// 阻止默认行为同理：模板里 @click.prevent；React 里手写 e.preventDefault()。
function handleFakeLink() {
  linkMsg.value = '已拦截跳转，改为在本页查看发票（演示 .prevent）'
}

function restoreItems() {
  items.value = [...initialItems]
}
</script>

<template>
  <!-- 卡片绑定 @click：内部点击会冒泡到这里，除非用了 .stop（对应 React 手写 stopPropagation） -->
  <div
    class="card stack"
    @click="cardClicks++"
  >
    <h3>
      订单卡片
      <span :class="`badge badge-${status}`">{{ ORDER_STATUS_TEXT[status] }}</span>
    </h3>
    <p class="muted">
      卡片捕获到的冒泡点击：{{ cardClicks }} 次
    </p>

    <!-- @click="handleCountClick"：不传参时事件对象自动作为第一个参数。
         React 对应 onClick={handleCountClick}（camelCase + 函数引用） -->
    <div class="row">
      <button @click="handleCountClick">
        按钮点击计数：{{ count }}
      </button>
      <span class="muted">最后一次点击位置：{{ lastPos }}</span>
    </div>

    <ul>
      <li
        v-for="item in items"
        :key="item.id"
        class="row"
      >
        <span> {{ item.name }} × {{ item.quantity }}（¥{{ item.price }}） </span>
        <!-- 直接写调用 removeItem(item.id) 在 Vue 是对的：编译器会包成内联函数。
             React 必须自己包箭头函数 onClick={() => removeItem(item.id)}，
             写成 onClick={removeItem(item.id)} 会在渲染时立即执行——经典坑。
             若还要事件对象：@click="removeItem(item.id, $event)"。 -->
        <button
          class="btn-danger"
          @click="removeItem(item.id)"
        >
          删除
        </button>
      </li>
    </ul>
    <p
      v-if="items.length === 0"
      class="muted"
    >
      商品已全部删除
    </p>

    <div class="row">
      <!-- .stop 修饰符：点击不冒泡到卡片，冒泡计数不变。React 里这一步是手写 e.stopPropagation() -->
      <button
        class="btn-primary"
        @click.stop="toggleStatus"
      >
        切换状态（pending ↔ paid）
      </button>
      <button @click="restoreItems">
        恢复商品
      </button>
    </div>

    <p>
      <!-- .prevent 修饰符：链接不跳转。React 里是手写 e.preventDefault() -->
      <a
        href="https://example.com/invoice"
        @click.prevent="handleFakeLink"
      >
        查看发票（本应跳转的链接）
      </a>
    </p>
    <p
      v-if="linkMsg !== ''"
      class="success-text"
    >
      {{ linkMsg }}
    </p>
  </div>
</template>
