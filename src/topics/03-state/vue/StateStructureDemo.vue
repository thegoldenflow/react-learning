<script setup lang="ts">
/**
 * 区块五：state 的结构。对照 react/StateStructureDemo.tsx。
 *
 * 1）存对象还是存 id —— Vue 这边的表现和 React 不一样：
 * - 存同一个响应式对象（selectedItem.value = item）：原地修改时改的是同一个对象，详情跟着变，不会像 React 那样过期；
 * - 存一份副本（{ ...item }）：和 React 的问题一样，详情停在选中那一刻；
 * - 但只要列表被整体换成新对象（最常见的是重新请求接口），存下来的旧对象就和列表脱节了（点「重新拉取」试试）；
 *   存 id、渲染时用 computed 查找：只要 id 稳定，原地修改和整体换新都对得上（选中项被删掉时查到 null，显示未选中）—— 所以 Vue 里同样推荐存 id（测试覆盖三种存法）。
 * 2）多个布尔值 → 一个 status：这是建模原则，和框架无关。Vue 里一样用字面量联合的 ref，需要布尔值时用 computed 派生
 *   （React 侧演示了两个布尔值出现「发送中且已发送」的 bug，Vue 写两个 ref 布尔值会有同样的问题）。
 */
import { computed, ref } from 'vue'

interface Product {
  id: string
  name: string
  quantity: number
}

const PRODUCTS: Product[] = [
  { id: 'p1', name: '机械键盘', quantity: 1 },
  { id: 'p2', name: '无线鼠标', quantity: 2 },
]

const items = ref<Product[]>(PRODUCTS.map((p) => ({ ...p })))
const selectedItem = ref<Product | null>(null)
const selectedCopy = ref<Product | null>(null)
const selectedId = ref<string | null>(null)
const selected = computed(() => items.value.find((item) => item.id === selectedId.value) ?? null)

function select(item: Product) {
  selectedItem.value = item
  selectedCopy.value = { ...item }
  selectedId.value = item.id
}

function addOne(item: Product) {
  item.quantity += 1
}

// 模拟重新请求接口：数据还是那些，但每一项都是新对象（数量顺便 +10，好看出区别）
function refetch() {
  items.value = items.value.map((item) => ({ ...item, quantity: item.quantity + 10 }))
}

const show = (item: Product | null) => (item ? `${item.name} × ${item.quantity}` : '（未选中）')

type SendStatus = 'typing' | 'sending' | 'sent'
const status = ref<SendStatus>('typing')
const isSending = computed(() => status.value === 'sending')
const isSent = computed(() => status.value === 'sent')
</script>

<template>
  <div class="card stack">
    <h3>区块五：state 的结构 —— 别重复、别矛盾</h3>
    <div class="stack">
      <h4>1）别存重复的数据：存 id，不存对象</h4>
      <div
        v-for="item in items"
        :key="item.id"
        class="row"
      >
        <span>{{ item.name }} × {{ item.quantity }}</span>
        <button @click="select(item)">
          选中
        </button>
        <button @click="addOne(item)">
          +1
        </button>
      </div>
      <div class="row">
        <button @click="refetch">
          重新拉取（列表换成新对象）
        </button>
      </div>
      <ul class="stack">
        <li data-testid="selected-by-object">
          存同一个响应式对象：{{ show(selectedItem) }}
        </li>
        <li data-testid="selected-by-copy">
          ❌ 存副本：{{ show(selectedCopy) }}
        </li>
        <li data-testid="selected-by-id">
          ✅ 存 id、computed 查找：{{ show(selected) }}
        </li>
      </ul>
    </div>
    <div class="stack">
      <h4>2）多个布尔值 → 一个 status</h4>
      <div
        class="row"
        data-testid="send-status"
      >
        <strong>✅ 一个 status</strong>
        <button @click="status = 'sending'">
          发送
        </button>
        <button
          :disabled="!isSending"
          @click="status = 'sent'"
        >
          模拟服务器返回
        </button>
        <span v-if="isSending">发送中…</span>
        <span
          v-if="isSent"
          class="success-text"
        >已发送 ✓</span>
      </div>
    </div>
  </div>
</template>
