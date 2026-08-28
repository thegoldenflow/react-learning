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
 *
 * Vue 对应概念：
 * - composable：同样以 use 开头的普通函数（社区约定，非强制），内部用 ref + onMounted/onUnmounted
 * - effect 的 cleanup ≈ onUnmounted 里移除监听器
 *
 * 最重要的区别：
 * - Vue 的 composable 没有「只能顶层调用」的限制（响应式靠 Proxy 追踪，不靠调用顺序），
 *   但受「生命周期钩子必须在 setup 同步执行期间注册」的约束 —— 两个约束不同源，没有一一对应关系。
 * - React 的 hook 每次渲染整个重跑、返回普通值；Vue 的 composable 只在 setup 跑一次、返回 Ref 容器。
 */
import { ref } from 'vue'
import WidthPanel from './WidthPanel.vue'

const showB = ref(true)

// React 版在 WidthPanel 里放了一段被注释掉的「条件调用 hook」违规代码（eslint 会报错）——
// Vue 没有那条规则：composable 放进 if 里调用也不会错乱（响应式靠 Proxy 追踪，不靠调用顺序）。
// 但 Vue 有自己的约束：composable 内部若用了 onMounted 等生命周期钩子，就必须在 setup
// 【同步执行期间】调用（不能放进 setTimeout / await 之后）。两个约束不同源，没有一一对应关系。
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
  </div>
</template>
