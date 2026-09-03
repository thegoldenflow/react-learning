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
 * - 定时器与过期闭包（面试高频）：setInterval 回调里写 setCount(count + 1)、依赖数组写 []，
 *   计数会永远停在 1 —— effect 只在挂载后跑过一次，它闭包里的 count 被永久冻结在首次渲染的 0。
 *   三种修法：① 函数式更新 setCount(c => c + 1)；② 把 count 写进依赖数组（代价是每次计数都销毁重建定时器）；
 *   ③ latest ref（用 ref 存最新的回调，effect 依赖仍写 []）
 * - 定时器的 cleanup 不是可选项：不 clearInterval，组件卸载后定时器还在跑 —— 内存泄漏 + 对已卸载组件 setState
 *
 * Vue 对应概念：
 * - [keyword] ≈ watch(keyword, cb, { immediate: true })—— immediate 必须有：React 的 effect 首次渲染后就会执行一次
 * - [] ≈ onMounted，但语义不同：不是「生命周期钩子」，而是「依赖为空，所以永远不需要重跑」
 * - cleanup ≈ watch 回调的 onCleanup 参数 + onUnmounted 两个 API 的合体
 * - 定时器：onMounted 里 setInterval(() => count.value++)、onUnmounted 里 clearInterval。
 *   「必须清理」这条纪律两边完全一致；但 React 那个「坏版本」在 Vue 里根本不存在
 *   （setup 只跑一次，count.value 是现读现取），所以那三种修法在 Vue 里没有一一对应关系
 *
 * 最重要的区别：
 * - Vue 给你一排按「时机」命名的生命周期钩子；React 只有一个 useEffect，思维模型不是生命周期，
 *   而是「声明式同步」：你声明如何与外部系统同步、如何清理，何时执行由 React 根据依赖决定。
 *   「useEffect(fn, []) 就是 onMounted」是最常见的误解 —— 行为恰好像，出发点完全不同，
 *   useEffect 不是 onMounted 的替代品。
 * - 「过期闭包」是 React 渲染快照模型的独有陷阱：每次渲染都重跑组件函数，那一帧里创建的每个闭包
 *   捕获的都是那一帧的 state；异步回调（定时器 / 订阅 / 网络回调）活得比那一帧长，就会读到过期值。
 *   Vue 的 ref 是一个一直存活的容器、.value 现读现取，压根没有这个概念，没有一一对应关系。
 */
import { onUnmounted, ref, watch } from 'vue'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'
import IntervalCounter from './IntervalCounter.vue'

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
    // （这里只展示「onCleanup 里 abort」这一种解法；竞态的可复现演示、ignore 标志 vs AbortController、
    //  过期响应的处理见 27 题。）
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

// ============ 场景二：定时器 ============
// 计数器本体在 IntervalCounter.vue 里（那里有最关键的注释：为什么 Vue 不存在 React 那个「坏」版本）。
// 注意：页面上的源码查看器只显示两个 Example 文件，IntervalCounter.vue 的源码要在编辑器里打开看。
// 这里只保留一个「卸载 / 重新挂载」开关，用来现场演示清理时机 ——
// React 侧还多了一个「实现方式」下拉框（四选一），Vue 这边没有对应物：
// 那四种写法全是为了绕开 React 的过期闭包，Vue 只有一种写法且天然正确，没有一一对应关系。
// 本场景聚焦「定时器里 setState 读到旧值」；延迟回调 / 手动事件监听 / 轮询读旧参数等更多现场
// 与 useEffectEvent 修法见 26 题。
const counterMounted = ref(true)
</script>

<template>
  <div class="stack">
    <div class="card stack">
      <h3>场景一：实时搜索（请求副作用 + 竞态取消）</h3>
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

    <div class="card stack">
      <h3>场景二：定时器（Vue 里天然正确，React 里是经典陷阱）</h3>
      <p class="muted">
        计数每秒 +1。React 侧同一个场景要在四种实现里切换，第一种会永远停在 1 ——
        那是 React 渲染快照模型独有的「过期闭包」，Vue 没有这个问题。
      </p>

      <div class="row">
        <!-- 卸载 / 重新挂载：v-if 让组件真正销毁重建，onUnmounted 因此被触发。
             对应 React 侧同名按钮（那边由 cleanup 承担 clearInterval）。 -->
        <button @click="counterMounted = !counterMounted">
          {{ counterMounted ? '卸载计数器' : '重新挂载计数器' }}
        </button>
      </div>

      <IntervalCounter v-if="counterMounted" />
      <p
        v-else
        class="muted"
      >
        计数器已卸载 —— onUnmounted 里的 clearInterval 已经执行，后台不再有定时器在跑。
        重新挂载后计数从 0 重新开始（count 随组件一起被销毁了）。
      </p>
    </div>
  </div>
</template>
