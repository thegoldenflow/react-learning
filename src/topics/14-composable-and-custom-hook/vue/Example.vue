<script setup lang="ts">
/**
 * 学习主题：自定义 Hook 与 Composable —— 逻辑复用
 *
 * React 核心概念：
 * - 自定义 hook：以 use 开头、内部调用其他 hook 的普通函数 —— 复用的是「逻辑」，每个调用方的状态各自独立
 * - useState + useEffect（挂监听，cleanup 卸监听）是订阅外部系统的标准组合
 * - Hooks 规则：只能在组件 / 自定义 hook 的【顶层】调用，禁止放进条件、循环、嵌套函数 ——
 *   React 按「调用顺序」把每个 hook 对应到内部状态槽，顺序一错位全部错乱；eslint-plugin-react-hooks 强制检查
 * - use 前缀不是命名风格：lint 靠它识别 hook 才能实施上述规则（硬规则）
 * - 防抖 hook useDebouncedValue：useState 存延迟值 + useEffect 里 setTimeout + cleanup 里 clearTimeout，
 *   依赖 [value, delay] —— clearTimeout 不是顺手清理，它就是防抖算法本身；面试高频手写题
 * - 组件函数每次渲染整体重跑：函数体里的普通局部变量（如 let timer）活不过一次渲染，
 *   跨渲染要存活的定时器 id 只能待在 effect 闭包里（配 cleanup），或存进 useRef（12 题用途二）
 *
 * Vue 对应概念：
 * - composable：同样以 use 开头的普通函数（社区约定，非强制），内部用 ref + onMounted/onUnmounted
 * - effect 的 cleanup ≈ onUnmounted 里移除监听器
 * - 防抖 composable：watch + setTimeout + onUnmounted 清理；定时器 id 就是 setup 作用域里的一个普通 let 变量
 *
 * 最重要的区别：
 * - Vue 的 composable 没有「只能顶层调用」的限制（响应式靠 Proxy 追踪，不靠调用顺序），
 *   但受「生命周期钩子必须在 setup 同步执行期间注册」的约束 —— 两个约束不同源，没有一一对应关系。
 * - React 的 hook 每次渲染整个重跑、返回普通值；Vue 的 composable 只在 setup 跑一次、返回 Ref 容器。
 * - 由此延伸出防抖实现的差异：Vue 的 setup 只跑一次，`let timer` 天然跨更新存活；
 *   React 每次渲染都重新执行函数体，同样的写法会被重置 —— 这是 Vue 老手写 React 防抖最容易踩的坑。
 */
import { ref } from 'vue'
import DebouncedUserSearch from './DebouncedUserSearch.vue'
import WidthPanel from './WidthPanel.vue'

const showB = ref(true)

// React 版在 WidthPanel 里放了一段被注释掉的「条件调用 hook」违规代码（eslint 会报错）——
// Vue 没有那条规则：composable 放进 if 里调用也不会错乱（响应式靠 Proxy 追踪，不靠调用顺序）。
// 但 Vue 有自己的约束：composable 内部若用了 onMounted 等生命周期钩子，就必须在 setup
// 【同步执行期间】调用（不能放进 setTimeout / await 之后）。两个约束不同源，没有一一对应关系。

// 第二个 composable 的演示见 DebouncedUserSearch.vue：useWindowWidth 抽的是「订阅外部系统」，
// useDebouncedValue 抽的是「跨时间的定时逻辑」—— 两类最常见的复用场景。
// 防抖那一侧最值得留意的差异：定时器 id 在 Vue 里就是 setup 作用域里的一个普通 let 变量
// （setup 只跑一次，它天然跨更新存活），React 里这么写会被每次渲染重置，只能靠 effect 闭包 + cleanup。
</script>

<template>
  <div class="stack">
    <p class="muted">
      拖动浏览器窗口边缘改变宽度，两个面板会实时更新（各自独立订阅 resize）
    </p>

    <WidthPanel
      title="面板 A"
      :threshold="768"
    />
    <WidthPanel
      v-if="showB"
      title="面板 B"
      :threshold="1024"
    />

    <div class="row">
      <button @click="showB = !showB">
        {{ showB ? '卸载面板 B' : '重新挂载面板 B' }}
      </button>
    </div>
    <p class="muted">
      卸载面板 B 时，它那次 useWindowWidth 调用里的 onUnmounted 会移除 B 自己的监听器
      （React 版对应 effect 的 cleanup），面板 A 不受影响 ——
      印证「每次调用 composable，状态与订阅都是独立的一份」。
    </p>

    <DebouncedUserSearch />
  </div>
</template>
