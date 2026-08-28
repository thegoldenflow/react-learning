<script setup lang="ts">
/**
 * 学习主题：useEffect 与生命周期 —— 副作用、依赖数组、cleanup 与请求竞态
 *
 * React 核心概念：
 * - useEffect(setup, deps)：渲染提交到屏幕后执行 setup，用来「让组件与外部系统保持同步」（请求/订阅/定时器/DOM）
 * - 依赖数组：[] = 只在挂载后执行一次；[keyword] = 挂载后 + keyword 每次变化后执行；不传 = 每次渲染后都执行
 * - setup 可以返回 cleanup 函数：下一次 setup 执行前 + 组件卸载前各执行一次 —— 一个函数覆盖两个时机
 * - StrictMode 开发期故意把组件「挂载→卸载→重挂载」，effect 双跑一遍，专门检验 cleanup 写没写对
 * - 请求竞态：先发的慢请求可能后返回、覆盖后发的快请求的正确结果；在 cleanup 里 abort 旧请求即可根治
 *
 * Vue 对应概念：
 * - [keyword] ≈ watch(keyword, cb, { immediate: true })—— immediate 必须有：React 的 effect 首次渲染后就会执行一次
 * - [] ≈ onMounted，但语义不同：不是「生命周期钩子」，而是「依赖为空，所以永远不需要重跑」
 * - cleanup ≈ watch 回调的 onCleanup 参数 + onUnmounted 两个 API 的合体
 *
 * 最重要的区别：
 * - Vue 给你一排按「时机」命名的生命周期钩子；React 只有一个 useEffect，思维模型不是生命周期，
 *   而是「声明式同步」：你声明如何与外部系统同步、如何清理，何时执行由 React 根据依赖决定。
 *   「useEffect(fn, []) 就是 onMounted」是最常见的误解 —— 行为恰好像，出发点完全不同，
 *   useEffect 不是 onMounted 的替代品。
 */
import { onUnmounted, ref, watch } from 'vue'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'

const keyword = ref('')
const users = ref<User[]>([])
// React 同款：初始就是 true，避免首帧闪一下「没有匹配的用户」
const loading = ref(true)

// React 里没有这个外部变量：每轮 effect 的 controller 存在自己的闭包里，cleanup 直接引用它。
// Vue 的 watch 回调和 onUnmounted 是两个独立函数，想在卸载时拿到「最近一次」的 controller，
// 只能提升到 setup 作用域共享。
let controller: AbortController | undefined

// React 的依赖数组 [keyword] ≈ 这里的 watch(keyword, cb, { immediate: true })。
// immediate 必不可少：Vue 的 watch 默认懒执行，不加 immediate 首屏不会发请求；
// 而 React 的 effect 首次渲染后必然执行一次，「初始加载」是自动的。
// 另外：React 的依赖数组要手写、漏写会读到过期闭包值（exhaustive-deps lint 规则专查这个）；
// Vue 的 watch 显式声明 source（watchEffect 则自动收集依赖），没有「漏依赖」这个坑。
watch(
  keyword,
  (kw, _prev, onCleanup) => {
    const ctrl = new AbortController()
    controller = ctrl
    // React 里这一步是 effect 返回的 cleanup 函数；Vue 用 onCleanup 参数注册，
    // 在下一次回调执行前触发 —— 同样用来取消旧请求。
    // 竞态不是 React 特有的问题：Vue 里旧的慢请求同样会覆盖新的快结果，解法一样是 abort。
    // （React 文档的 let ignore = false 布尔位方案在 Vue 里同样适用，abort 比它更彻底。）
    // （与 React 版一样，本题故意不做防抖 —— 每个字符都发请求；防抖优化是 14 题。）
    onCleanup(() => ctrl.abort())

    loading.value = true
    // Vue 的 watch 回调可以写成 async（cleanup 由 onCleanup 参数承担，不占用返回值）；
    // React 的 effect 返回值就是 cleanup，所以不能 async —— 这里保持 .then 写法与 React 版对齐。
    fetchUsers(kw, { signal: ctrl.signal })
      .then((list) => {
        users.value = list
        loading.value = false
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return // React 同款：「被取消」不是失败，必须忽略
        loading.value = false // 完整错误处理（error 状态 + 重试）见 11 题
      })
  },
  { immediate: true },
)

// React 的 cleanup 一个函数覆盖「依赖变化前」和「卸载前」两个时机；Vue 拆成 onCleanup + onUnmounted。
// （严格说 watcher 随组件卸载停止时 onCleanup 也会执行，这里显式写 onUnmounted 是把
// 「卸载时取消在途请求」这个时机亮出来与 React 对照；对已取消的 controller 重复 abort 是无害空操作。）
onUnmounted(() => controller?.abort())

// React 的 StrictMode 开发期会「挂载→卸载→重挂载」把 effect 双跑一遍来检验 cleanup ——
// Vue 没有对应机制，这一点没有一一对应关系。

// React 侧列了「哪些逻辑不该放 useEffect」：①响应用户事件 ②渲染期可算的派生值 ③随 props 重置 state。
// Vue 的对应习惯：①放 @click 等事件处理器 ②用 computed ③给组件换 :key ——
// 道理相通：watch / effect 只留给「与外部系统同步」的场景。
</script>

<template>
  <div class="stack">
    <p class="muted">
      输入关键词实时搜索用户；快速连续输入时旧请求会被取消，结果不会错乱
    </p>

    <!-- v-model 对应 React 的 value + onChange 受控写法。
         分工相同：输入只负责改 keyword，「发请求」由 watch 响应 keyword 变化。 -->
    <input
      v-model="keyword"
      placeholder="搜索姓名或邮箱，如「张」或 example"
    >

    <p
      v-if="loading"
      class="muted"
    >
      加载中…
    </p>
    <p
      v-if="!loading && users.length === 0"
      class="muted"
    >
      没有匹配的用户
    </p>

    <ul>
      <li
        v-for="u in users"
        :key="u.id"
      >
        {{ u.name }}（{{ u.email }}）<span class="badge">{{ u.role }}</span>
      </li>
    </ul>
  </div>
</template>
