<script setup lang="ts">
/**
 * 区块二的子组件。对照 react/ReadonlyPropsDemo.tsx 里的 AmountEditor。
 * - Vue 的 props 同样单向：子组件改 props，开发环境不抛错，而是控制台警告、值不变（setup 拿到的是 shallowReadonly 包过的 props）；
 *   生产构建没有这层只读包装，赋值会成功并触发重渲染，父组件之后传的值没变的话子组件不会被更新，界面一直停在改过的值（node + 生产构建实测）。
 * - 子组件想改，就 emit 事件交给父组件改（对应 React 的 onAmountChange 回调，08 题）。
 * - 「稍后读取」：Vue 的 props 是响应式对象，定时器里读 props.amount 读到的是那一刻的最新值 —— 和 React 的「每次渲染一份快照」不同（26 题）。
 */
import { ref } from 'vue'

interface Props {
  amount: number
  delayMs: number
}

// 这里不解构，为了能演示 props.amount = 0 这个反例；平时用 3.5 的响应式 props 解构即可。
const props = defineProps<Props>()
// 具名元组写法【主流·3.3 起】：事件名 amountChange，模板里监听写 @amount-change
const emit = defineEmits<{ amountChange: [next: number] }>()

const log = ref<string[]>([])
const addLog = (line: string) => log.value.push(line)

// ❌ 反例：直接改 props
function mutateProps() {
  // @ts-expect-error -- defineProps 的返回类型是只读的，TypeScript 在编译期就拦下（React 那边 interface 的字段默认可写，TS 不拦）
  props.amount = 0 // eslint-disable-line vue/no-mutating-props -- 教学反例：演示开发环境的只读警告
  addLog(`赋值没有抛错；读回 props.amount = ${props.amount}（开发环境：控制台警告 target is readonly，值没变）`)
}

// ✅ 正确做法：emit 给父组件
function resetByParent() {
  emit('amountChange', 0)
  addLog("emit('amountChange', 0)：父组件更新自己的 ref → 新的 amount 传下来")
}

// 定时器回调里读 props.amount：读的是响应式对象，拿到的是那一刻的最新值
function readLater() {
  addLog(`点击时 amount = ${props.amount}，${props.delayMs}ms 后再读一次…`)
  setTimeout(() => addLog(`${props.delayMs}ms 后读到 amount = ${props.amount}（最新值：props 是响应式对象，不是快照）`), props.delayMs)
}
</script>

<template>
  <div class="stack">
    <p>
      子组件收到的 amount：<strong>{{ amount }}</strong>
    </p>
    <div class="row">
      <button
        class="btn-danger"
        @click="mutateProps"
      >
        ❌ 直接改 props.amount = 0
      </button>
      <button
        class="btn-primary"
        @click="resetByParent"
      >
        ✅ emit('amountChange', 0) 请父组件改
      </button>
      <button @click="readLater">
        稍后读取 amount
      </button>
    </div>
    <ul
      class="log"
      aria-label="子组件日志"
    >
      <li
        v-if="log.length === 0"
        class="log-empty"
      >
        （还没有操作）
      </li>
      <li
        v-for="(line, i) in log"
        :key="i"
      >
        {{ line }}
      </li>
    </ul>
  </div>
</template>
