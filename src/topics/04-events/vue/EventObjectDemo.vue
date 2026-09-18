<script setup lang="ts">
/**
 * 区块二：Vue 的处理函数拿到的就是原生事件。对照 react/EventObjectDemo.tsx。
 * - v-on 直接在元素上 addEventListener（runtime-dom.cjs.js:634-636），没有委托层：currentTarget 就是绑定的那个元素，没有 nativeEvent 这一层；
 * - 处理函数返回之后，原生事件的 currentTarget 也是 null（MDN：「Outside an event handler it will be null.」）—— 这一点两边一样。
 */
import { ref } from 'vue'

type Row = [expression: string, value: string]

function describeTarget(target: EventTarget | null): string {
  if (target === null) return 'null'
  if (target instanceof Element) {
    const node = target.getAttribute('data-node')
    return `<${target.tagName.toLowerCase()}${node ? ` data-node="${node}"` : ''}>`
  }
  return Object.prototype.toString.call(target)
}

const rows = ref<Row[]>([])
const laterRows = ref<Row[]>([])

function handleClick(e: MouseEvent) {
  rows.value = [
    ['event.type', e.type],
    ['event.target', describeTarget(e.target)],
    ['event.currentTarget', describeTarget(e.currentTarget)],
    ['event instanceof MouseEvent', String(e instanceof MouseEvent)],
    ['event.eventPhase', String(e.eventPhase)],
  ]
  setTimeout(() => {
    laterRows.value = [
      ['event.type', e.type],
      ['event.target', describeTarget(e.target)],
      ['event.currentTarget', describeTarget(e.currentTarget)],
    ]
  }, 0)
}
</script>

<template>
  <div class="card stack">
    <h3>区块二：事件对象 —— Vue 拿到的就是原生事件</h3>
    <div class="row">
      <button
        data-node="demo-button"
        @click="handleClick"
      >
        <span data-node="icon">🧾 图标</span> 查看事件对象
      </button>
    </div>
    <table
      v-if="rows.length > 0"
      aria-label="处理函数里读到的值"
    >
      <tbody>
        <tr
          v-for="[expression, value] in rows"
          :key="expression"
        >
          <td><code>{{ expression }}</code></td>
          <td>{{ value }}</td>
        </tr>
      </tbody>
    </table>
    <table
      v-if="laterRows.length > 0"
      aria-label="处理函数返回之后读到的值"
    >
      <tbody>
        <tr
          v-for="[expression, value] in laterRows"
          :key="expression"
        >
          <td>setTimeout 里 <code>{{ expression }}</code></td>
          <td>{{ value }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
