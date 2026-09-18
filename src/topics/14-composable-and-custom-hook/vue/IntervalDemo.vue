<script setup lang="ts">
/**
 * 区块二（Vue 对照 react/IntervalDemo.tsx）：composable 接收回调。
 * 打开「干扰」让本组件频繁重新渲染：Vue 的重新渲染只重跑渲染函数，setup 和 watch 不会重来，定时器照常触发。
 * React 侧对应的反例（回调进依赖）在这里写不出来 —— Vue 没有「依赖数组」这回事。
 */
import { ref } from 'vue'
import { useInterval } from './useInterval'

const props = withDefaults(defineProps<{ delay?: number; noiseMs?: number }>(), { delay: 1000, noiseMs: 300 })

const step = ref(1)
const paused = ref(false)
const noisy = ref(false)
const count = ref(0)
const noise = ref(0)

// 回调里读 step.value：每次触发时读到的都是当前值
// 输入框清空时 v-model.number 给的是空串，这里兜底成 1（React 版在 onChange 里做同样的事）
useInterval(() => {
  count.value += Math.max(1, Number(step.value) || 1)
}, () => (paused.value ? null : props.delay))
// 「干扰」：每 noiseMs 毫秒改一次 noise，让模板重新渲染
useInterval(() => {
  noise.value += 1
}, () => (noisy.value ? props.noiseMs : null))
</script>

<template>
  <div class="card stack">
    <h3>区块二：composable 接收回调 —— setup 只跑一次，不需要 useEffectEvent</h3>
    <p class="muted">
      计数器每 {{ delay / 1000 }} 秒加一次步长；改步长立刻生效；打开「干扰」后本组件每 {{ noiseMs }}ms 重新渲染一次，计数照常增长。
    </p>
    <div class="row">
      <label class="row">
        <span>步长</span>
        <input
          v-model.number="step"
          type="number"
          min="1"
          style="width: 64px"
        >
      </label>
      <label class="row">
        <input
          v-model="paused"
          type="checkbox"
        >
        <span>暂停（delay 传 null）</span>
      </label>
      <label class="row">
        <input
          v-model="noisy"
          type="checkbox"
        >
        <span>干扰：每 {{ noiseMs }}ms 重新渲染一次</span>
      </label>
    </div>
    <p aria-label="计数">
      计数：<strong>{{ count }}</strong>
    </p>
    <p class="muted">
      干扰重新渲染次数：{{ noise }}
    </p>
  </div>
</template>
