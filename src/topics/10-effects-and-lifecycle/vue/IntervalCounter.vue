<script setup lang="ts">
/**
 * 子组件 IntervalCounter（对照 React 版：React 的四个计数器组件都和父组件同在一个 .tsx 文件里，
 * 因为组件只是函数；Vue 的 SFC 一文件一组件，只能拆成这个单独的 .vue 文件）。
 *
 * React 侧提供了四种实现让你在下拉框里切换，其中第一种是【坏】的 —— 计数永远停在 1。
 * Vue 这边只有一种实现，原因是：
 *
 * 【Vue 里根本不存在那个「坏」版本】
 * setup 只执行一次，count 是一个一直存活的响应式容器，回调里的 count.value 是「现读现取」，
 * 每次都拿到最新值。所以 setInterval(() => count.value++, 1000) 天然就是对的 ——
 * 不需要函数式更新、不需要依赖数组、也不需要 latest ref。
 * React 的那三种修法在 Vue 里没有一一对应关系：它们修的是 React 渲染快照模型独有的「过期闭包」
 * （React 每次渲染重跑组件函数，定时器回调捕获的是「创建它那一帧」的 count 常量，越活越过期）。
 *
 * 但有一条纪律两个框架完全一致：【必须清理定时器】。
 * 不 clearInterval，组件卸载后定时器还在后台跑 —— 内存泄漏，而且还在改一个已经没人看的状态。
 * React 靠 effect 返回的 cleanup，Vue 靠 onUnmounted：形式不同，责任相同。
 */
import { onMounted, onUnmounted, ref } from 'vue'

/** 与 React 版同名同值的间隔常量 */
const TICK_MS = 1000

const count = ref(0)

// 定时器 id 就是 setup 作用域里的一个普通 let 变量：setup 只跑一次，它天然跨越所有更新一直存活。
// React 里组件函数每次渲染整体重跑，同样写法的普通变量每帧都会被重置，
// 所以 id 只能待在 effect 闭包里（配 cleanup），或者存进 useRef —— 12 题「跨渲染保存可变值」那个用途。
let timer: ReturnType<typeof setInterval> | undefined

// 用 onMounted 装、onUnmounted 拆，是 Vue 里最直白的写法。
// （也可以写成 watchEffect((onCleanup) => { const id = setInterval(...); onCleanup(() => clearInterval(id)) })，
//  那个形状更贴近 React 的 useEffect：一个函数里既装又拆。这里选 onMounted/onUnmounted，
//  正是为了照出两边的思维差异：Vue 按「时机」命名钩子，React 只有一个「声明如何同步 + 如何清理」的 useEffect。）
onMounted(() => {
  timer = setInterval(() => {
    // 就是这一行：count.value 现读现取，永远是最新值。
    // React 的坏版本坏就坏在同一位置 —— 它读到的是首次渲染那一帧的 count 快照（恒为 0）。
    count.value++
  }, TICK_MS)
})

onUnmounted(() => {
  // 与 React 的 cleanup 完全等价的那一步。这个 if 只是 TS 的类型守卫，不是逻辑需要。
  if (timer !== undefined) clearInterval(timer)
})
</script>

<template>
  <div class="stack">
    <p class="row">
      <span>计数：</span>
      <strong>{{ count }}</strong>
      <span class="badge">每秒 +1</span>
    </p>
    <!-- React 版还额外跑了一个「秒表参照」，用来反衬坏版本的计数停在 1；
         Vue 这边没有坏版本可反衬（秒表和计数永远是同一个数），所以只显示计数本身。 -->
    <p class="muted">
      每秒 +1，正常工作 —— 而且这是 Vue 里唯一的写法。
      React 那边要在四种写法里挑一种，其中一种还是错的。
    </p>
  </div>
</template>
