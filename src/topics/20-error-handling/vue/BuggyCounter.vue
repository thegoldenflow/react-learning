<script setup lang="ts">
/**
 * 易碎子组件（对照 React 版：BuggyCounter 与 Example 同住一个 .tsx 文件 ——
 * React 组件只是函数；Vue 的 SFC 一文件一组件，所以拆成这个单独文件）。
 *
 * 两处 throw 对照：
 * 1. count 到 3 时在【渲染期间】throw（下面的 computed）—— React 的 Error Boundary 也能接住这类；
 * 2. 「事件处理器里 throw」按钮 —— React 版接不住（只能自己 try/catch），
 *    而 Vue 会把事件处理器里的错误一并交给父级的 onErrorCaptured —— 捕获范围更宽。
 */
import { computed, ref } from 'vue'

const count = ref(0)

// 对应 React「在组件函数体里 throw」：Vue 的渲染 = 模板求值，
// 模板读取这个 computed 时抛错，同样属于「渲染期间」的错误，会被父级 onErrorCaptured 接住
const label = computed(() => {
  if (count.value === 3) {
    throw new Error('计数到 3，BuggyCounter 渲染崩溃了！')
  }
  return count.value
})

// 事件处理器里 throw：React 的 Error Boundary 对此无能为力；
// Vue 把组件的事件处理器也纳入错误捕获管道，父级 onErrorCaptured 照样能接住
function throwInHandler() {
  throw new Error('事件处理器里的错误（Vue 的 onErrorCaptured 也能接住）')
}
</script>

<template>
  <div class="stack">
    <p>
      易碎计数器：<strong>{{ label }}</strong>（加到 3 会在渲染中 throw）
    </p>
    <div class="row">
      <button
        class="btn-primary"
        @click="count++"
      >
        +1
      </button>
      <button
        class="btn-danger"
        @click="throwInHandler"
      >
        事件处理器里 throw
      </button>
    </div>
  </div>
</template>
