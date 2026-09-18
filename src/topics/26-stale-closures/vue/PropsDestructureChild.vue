<script setup lang="ts">
/**
 * 区块一的子组件：Vue 3.5 的响应式 props 解构【主流·3.5 起】。
 *
 * const { count } = defineProps() 看起来像 React 的 function Child({ count })，行为却不同：
 * 编译器把本组件里对 count 的每一次访问加上 props.（vuejs.org guide/components/props「Reactive Props Destructure」；实际编译产物是 __props.count），
 * 所以 2 秒后的定时器回调里读 count，读到的是那一刻的 prop —— 不会过期（测试覆盖）。
 * 3.4 及以前没有这个编译改写，解构出来的 count 是常量，行为和 React 的 props 快照一样。
 * 坑：把解构出来的 prop 直接交给 watch(count) 不行，要写成 watch(() => count)（官方「Passing Destructured Props into Functions」；文档说编译器会 throw a warning，
 * 3.5.42 实测 compileScript 直接抛错、编译失败，见 react/Example.tsx 三）。
 *
 * React 对照：函数组件的 props 和 state 一样是那次渲染的快照 —— function Child({ count }) 里 setTimeout 读 count，读到的是创建定时器那次渲染的值。
 */
import { onBeforeUnmount } from 'vue'

const { count } = defineProps<{ count: number }>()
const emit = defineEmits<{ log: [line: string] }>()

let timer: ReturnType<typeof setTimeout> | undefined

function readLater() {
  emit('log', `【子组件】已安排：2 秒后读解构出来的 prop count（此刻 ${count}）`)
  clearTimeout(timer)
  timer = setTimeout(() => {
    emit('log', `【子组件】2 秒后读到 count=${count} —— 3.5 的编译器把它改写成了 props.count，读到的是此刻的 prop`)
  }, 2000)
}

// setup 只执行一次，let timer 跨越所有更新一直有效（14 题）；卸载时清掉
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="row">
    <button @click="readLater">
      2 秒后读 prop（子组件 const { count } = defineProps()）
    </button>
    <span class="muted">子组件收到的 count={{ count }}</span>
  </div>
</template>
