<script setup lang="ts">
/**
 * 区块一：普通变量为什么不行、state 属于组件实例。对照 react/WhyStateDemo.tsx。
 *
 * Vue 的普通变量和 React 的局部变量「坏」的方式不一样：
 * - React：组件函数每次渲染从头执行，let clicks = 0 每次都重来 —— 不跨渲染保留，改了也不触发渲染（两个问题都有）；
 * - Vue：<script setup> 只在组件实例创建时执行一次，下面的 plainClicks 一直活着、跨渲染保留；但它不是 ref / reactive，
 *   响应式系统追踪不到，改了不会触发重新渲染（只剩第二个问题）。等别的数据让组件重新渲染时，模板才顺带读到它的当前值 —— 界面「跳」一下。
 * 测试覆盖：点 3 次界面还是 0，让组件重渲染一次后显示 3（React 那边重渲染后是 0）。
 */
import { ref } from 'vue'
import StateCounter from './StateCounter.vue'

// ❌ 普通变量：不是 ref / reactive，响应式系统追踪不到
let plainClicks = 0
// 只用来让本组件重新渲染一次
const renderRound = ref(0)

function addPlain() {
  plainClicks += 1
}
</script>

<template>
  <div class="card stack">
    <h3>区块一：普通变量为什么不行，state 属于组件实例</h3>
    <div class="row">
      <span>❌ 普通变量 plainClicks：<strong data-testid="plain-clicks">{{ plainClicks }}</strong></span>
      <button @click="addPlain">
        普通变量 +1
      </button>
    </div>
    <div class="row">
      <button @click="renderRound++">
        让本区块重渲染（已重渲染 {{ renderRound }} 次）
      </button>
    </div>
    <p class="muted">
      点几次「普通变量 +1」界面不动；再点「让本区块重渲染」，数字一下跳到你点过的次数 —— 变量一直活着，只是没人追踪它。
    </p>
    <StateCounter label="A" />
    <StateCounter label="B" />
  </div>
</template>
