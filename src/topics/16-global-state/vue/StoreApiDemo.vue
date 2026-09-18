<script setup lang="ts">
/**
 * 区块二 Vue 对照：Pinia store 的实例 API —— storeToRefs 的坑、$patch、自写 $reset、$subscribe、$onAction、
 * 组件外使用、异步 action、持久化插件。对照 react/StoreApiDemo.tsx（getState / setState / subscribe / persist）。
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { CART_STORAGE_KEY, getCheckoutRequestCount, useCartStore } from './cartStore'
import { DEMO_PRODUCTS } from './products'

const { delayMs = 600 } = defineProps<{ delayMs?: number }>()

const cart = useCartStore()
const { totalCount, checkout } = storeToRefs(cart)
// ❌ 直接解构 getter / state：拿到的是这一刻的值（普通数字），之后购物车再变，它也不会变
const { totalCount: frozenCount } = cart

const log = ref<string[]>([])
const push = (line: string) => {
  log.value = [...log.value, line].slice(-12)
}

/**
 * $subscribe：state 变化后回调。直接改 state 的变化按 watch 的默认时机（flush: 'pre'）在同一个 tick 里合并成一次，
 * type 是 'direct'；$patch 会暂停这个 watcher、立刻同步回调一次，type 是 'patch object' / 'patch function'。
 * 在组件里调用时随组件卸载自动取消；要保留就传 { detached: true }。
 */
cart.$subscribe((mutation) => {
  push(`$subscribe：${mutation.type}`)
})

/**
 * $onAction：每个 action 调用之前触发；after 在 action 完成后调用（async action 会等 Promise 完成），
 * onError 在 action 抛错或 Promise 被拒绝时调用。注意它的 detached 是第二个参数（$onAction(cb, true)），
 * 和 $subscribe 的 { detached: true } 写法不一样。
 */
cart.$onAction(({ name, after, onError }) => {
  push(`$onAction：${name} 开始`)
  after(() => push(`$onAction：${name} 完成${name === 'checkoutCart' ? `（服务端累计 ${getCheckoutRequestCount()} 次结算请求）` : ''}`))
  onError((err) => push(`$onAction：${name} 出错：${String(err)}`))
})

/** 组件外（普通函数）使用 store：在 app.use(pinia) 之后调用即可；服务端渲染时要把当前请求的 pinia 传进去 useCartStore(pinia) */
function logoutAndClearCart() {
  useCartStore().clear()
}

const failNext = ref(false)
const storageText = ref('')
const statusText = computed(() =>
  checkout.value.status === 'success'
    ? `结算状态：success，订单号 ${checkout.value.orderNo}`
    : `结算状态：${checkout.value.status}`,
)

function patchObject() {
  // 对象形式：普通对象会深合并，数组整体替换
  cart.$patch({ giftWrap: !cart.giftWrap })
}

function patchFunction() {
  // 函数形式：适合 push 数组、一次改多个字段；函数必须是同步的
  cart.$patch((state) => {
    state.items.push({ id: 'p4', name: DEMO_PRODUCTS[3].name, price: DEMO_PRODUCTS[3].price, quantity: 1 })
    state.giftWrap = true
  })
}

function checkoutTwice() {
  // 同一轮里连调两次：第二次读到 checkout.status === 'pending' 直接返回
  void cart.checkoutCart({ delayMs, fail: failNext.value })
  void cart.checkoutCart({ delayMs, fail: failNext.value })
}

function readStorage() {
  storageText.value = localStorage.getItem(CART_STORAGE_KEY) ?? '（localStorage 里没有这个键）'
}
</script>

<template>
  <div class="card stack">
    <h3>区块二：store 实例 API、组件外使用、异步 action、持久化插件</h3>

    <strong>1. storeToRefs 与直接解构</strong>
    <p>
      storeToRefs：<strong>{{ totalCount }}</strong> 件 · 直接解构（不会更新）：<strong>{{ frozenCount }}</strong> 件
    </p>

    <strong>2. $patch 与自写的 $reset</strong>
    <div class="row">
      <button @click="patchObject">
        $patch 对象形式：切换礼品包装
      </button>
      <button @click="patchFunction">
        $patch 函数形式：加一台显示器 + 礼品包装
      </button>
      <button @click="cart.$reset()">
        $reset()（setup store 自己写的）
      </button>
      <button @click="logoutAndClearCart">
        模拟「退出登录」：组件外清空购物车
      </button>
    </div>

    <strong>3. 异步 action：结算</strong>
    <div class="row">
      <button
        class="btn-primary"
        :disabled="checkout.status === 'pending'"
        @click="cart.checkoutCart({ delayMs, fail: failNext })"
      >
        {{ checkout.status === 'pending' ? '结算中…' : '结算' }}
      </button>
      <button
        :disabled="checkout.status === 'pending'"
        @click="checkoutTwice"
      >
        同一轮里调用两次 checkoutCart()
      </button>
      <label class="row">
        <input
          v-model="failNext"
          type="checkbox"
        >
        模拟结算失败
      </label>
    </div>
    <p role="status">
      {{ statusText }}
    </p>
    <p
      v-if="checkout.status === 'error'"
      role="alert"
      class="error-text"
    >
      {{ checkout.message }}（购物车保留，可以重试）
    </p>

    <strong>4. 持久化插件（persistPlugin.ts）</strong>
    <div class="row">
      <button @click="readStorage">
        查看 localStorage
      </button>
    </div>
    <pre
      v-if="storageText"
      class="log"
      aria-label="localStorage 内容"
    >{{ storageText }}</pre>

    <strong>5. $subscribe / $onAction 日志</strong>
    <pre
      class="log"
      aria-label="store 日志"
    >{{ log.length === 0 ? '（还没有变化）' : log.join('\n') }}</pre>
  </div>
</template>
