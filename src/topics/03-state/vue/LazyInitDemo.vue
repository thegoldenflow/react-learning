<script setup lang="ts">
/**
 * 区块四：Vue 没有「惰性初始化」这个概念。对照 react/LazyInitDemo.tsx。
 * <script setup> 只在组件实例创建时执行一次，ref(createInitialRows()) 这一行也只执行一次；之后组件怎么重新渲染，重跑的都是模板编译出的渲染函数，不是 setup。
 * React 的组件函数每次渲染都从头执行，所以才需要把「函数本身」交给 useState，让 React 只在首次渲染时调用它。
 * Vue 也没有 StrictMode 那样「开发环境调用两次」的检查：这里首次渲染就是 1 次（测试覆盖）。
 */
import { computed, ref } from 'vue'

interface DraftRow {
  id: number
  text: string
}

// 只用来数调用次数。在 setup 里（渲染之前）改 ref 没问题；演示简化：真实的初始化函数不该有这种副作用
const initCalls = ref(0)

function createInitialRows(): DraftRow[] {
  initCalls.value += 1
  return Array.from({ length: 50 }, (_, i) => ({ id: i, text: `草稿 ${i + 1}` }))
}

const rows = ref(createInitialRows())
const keyword = ref('1')
const matched = computed(() => rows.value.filter((row) => row.text.includes(keyword.value)).length)
</script>

<template>
  <div class="card stack">
    <h3>区块四：setup 只执行一次 —— 没有「惰性初始化」这回事</h3>
    <label class="row">
      输入几个字让本组件重新渲染：
      <input
        v-model="keyword"
        aria-label="过滤关键字"
      >
    </label>
    <p>ref(createInitialRows())：50 行里含「{{ keyword }}」的有 {{ matched }} 行</p>
    <p>
      初始化函数被调用的次数：<strong data-testid="init-calls">{{ initCalls }}</strong> 次
    </p>
  </div>
</template>
