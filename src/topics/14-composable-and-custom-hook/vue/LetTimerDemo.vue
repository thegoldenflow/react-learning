<script setup lang="ts">
/**
 * 「let timer」对照（React 版 react/DebouncedSearchDemo.tsx 里的 LetTimerBroken / LetTimerFixed）。
 * 同样的写法在 Vue 里是对的：<script setup> 只执行一次，timer 是一直活着的同一个变量，
 * 每次输入都能 clearTimeout 掉上一次的定时器。React 组件函数每次渲染都重新执行，同样的 let 每次都是新的。
 */
import { onUnmounted, ref } from 'vue'

const props = withDefaults(defineProps<{ debounceMs?: number }>(), { debounceMs: 500 })

const text = ref('')
const fired = ref<string[]>([])
let timer: ReturnType<typeof setTimeout> | undefined

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  text.value = value
  clearTimeout(timer)
  timer = setTimeout(() => {
    fired.value.push(value)
  }, props.debounceMs)
}

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="stack">
    <input
      aria-label="let timer 写法"
      :value="text"
      placeholder="快速输入 abc"
      @input="onInput"
    >
    <span aria-label="let timer 触发次数">触发了 {{ fired.length }} 次：{{ fired.join('、') }}</span>
  </div>
</template>
