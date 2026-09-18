<script setup lang="ts">
/**
 * 易碎计数器（对照 react/BoundaryBasicsDemo.tsx 里的 BuggyCounter）：count 到 3 时在渲染期间 throw。
 * 用模板里调用函数的方式抛错，错误发生在渲染函数里，onErrorCaptured 收到的 info 是 'render function'。
 * 如果改成在 computed 里 throw、模板读这个 computed：Vue 3.5 会在重新渲染之前的「脏检查」里先求值 computed，
 * 错误在那一步抛出，info 变成 'component update'，而且渲染函数根本没执行，界面停在上一次的样子（Example.test.ts 有对比）。
 */
import { ref } from 'vue'

const count = ref(0)

function renderCount() {
  if (count.value === 3) {
    throw new Error('计数到 3，BuggyCounter 渲染崩溃了')
  }
  return count.value
}
</script>

<template>
  <div class="row">
    <span>易碎计数器：<strong>{{ renderCount() }}</strong>（加到 3 会在渲染中 throw）</span>
    <button
      class="btn-primary"
      @click="count++"
    >
      +1
    </button>
  </div>
</template>
