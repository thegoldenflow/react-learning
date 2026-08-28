<script setup lang="ts">
/**
 * 学习主题：错误边界 —— Error Boundary vs onErrorCaptured
 *
 * React 核心概念：
 * - Error Boundary 是 React 中唯一仍需要 class 组件的场景：函数组件没有等价 API
 *   （getDerivedStateFromError / componentDidCatch 没有对应 Hook）；工业界常用现成的
 *   react-error-boundary 库（本课程不引入，手写一遍是面试要求）
 * - 能捕获：子组件树【渲染流程】里的错误 —— 渲染期间、生命周期方法、构造函数
 * - 不能捕获：事件处理器、异步代码（setTimeout / Promise）、SSR、边界组件自身的错误
 * - Error Boundary vs try/catch：前者接「声明式渲染」过程中的错误，后者接「命令式代码」；
 *   事件处理器属于命令式代码，必须自己 try/catch
 * - 边界捕获错误后 React 会自动卸载崩溃的子树；reset 后子树以全新实例重挂（state 归零）
 *
 * Vue 对应概念：
 * - onErrorCaptured 捕获后代组件的错误，返回 false 阻止向上冒泡 —— 一个钩子扮演边界角色
 * - 但捕获范围比 React 宽：渲染、生命周期之外，连事件处理器里的错误也能接住
 * - 全局兜底 app.config.errorHandler —— 与 React 没有一一对应关系
 *   （React 19 最接近的是 createRoot 的 onUncaughtError / onCaughtError 选项，但不是同层概念）
 * - Vue 捕获后不会自动卸载崩溃子树，重置时要靠 v-if / :key 自己重挂载
 *
 * 最重要的区别：
 * - React 用「专门的边界组件」包住易碎区域，隔离范围由组件树结构决定，且对事件处理器无能为力；
 *   Vue 用「任意组件里的一个钩子」实现同样效果，捕获范围更宽 —— 两边都推荐只在关键区域做局部兜底
 */
import { onErrorCaptured, ref } from 'vue'
import BuggyCounter from './BuggyCounter.vue'

const errorMessage = ref<string | null>(null)
const safeCount = ref(0) // 兜底区域之外的正常计数器（React 版拆成了 SafeCounter 组件）

/**
 * onErrorCaptured：捕获【后代组件】抛出的错误 —— 一个钩子就扮演了 React ErrorBoundary 的角色，
 * 不需要专门写一个 class 组件。（回调还有两个参数：出错的组件实例、错误来源字符串 info，这里没用到。）
 *
 * 捕获范围比 React 的 Error Boundary 宽：渲染、生命周期之外，
 * 事件处理器、watch 回调等「Vue 管理的代码」里的错误也能接住 ——
 * 点子组件里「事件处理器里 throw」的按钮试试，这里照样能捕获（React 版这颗按钮只能自己 try/catch）。
 *
 * 返回 false 阻止错误继续向上传播（传给更外层的 onErrorCaptured，直至全局 app.config.errorHandler）——
 * 对应 React 边界「把错误就地消化」的行为。app.config.errorHandler 这个全局兜底与 React
 * 没有一一对应关系（React 19 最接近的是 createRoot 的 onUncaughtError / onCaughtError 选项）。
 * 注：开发模式下控制台仍会打印错误详情，属正常现象（React 边界捕获时同样会打印）。
 */
onErrorCaptured((err) => {
  errorMessage.value = err instanceof Error ? err.message : String(err)
  return false
})

/**
 * 重置：清空错误信息。注意与 React 的差异 —— React 捕获错误时会【自动】卸载崩溃子树，
 * reset 后自动重挂全新实例；Vue 不会自动卸载，这里靠模板里的 v-if：
 * 出错时 BuggyCounter 被 v-else 移除（卸载），重置后重新挂载出全新实例（count 归零），不会立刻再崩。
 */
function reset() {
  errorMessage.value = null
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      把左边的易碎计数器加到 3：只有它所在的卡片变成兜底 UI，右边的正常计数器不受影响；
      点「重置」后子树以全新实例重挂（count 归零）。子组件里「事件处理器里 throw」的按钮
      在 Vue 里也会被捕获 —— React 版做不到这一点
    </p>

    <div class="row">
      <div class="card">
        <!-- 出错时兜底 UI 顶替子组件：对应 React ErrorBoundary 里 render 的 if (error) 分支 -->
        <div
          v-if="errorMessage"
          class="stack"
        >
          <p class="error-text">
            这块区域崩溃了：{{ errorMessage }}
          </p>
          <button
            class="btn-primary"
            @click="reset"
          >
            重置
          </button>
        </div>
        <!-- v-if / v-else 负责卸载、重挂崩溃子树（React 版由边界自动完成，无需手动） -->
        <BuggyCounter v-else />
      </div>

      <div class="card">
        <p>
          正常计数器：<strong>{{ safeCount }}</strong>
        </p>
        <button @click="safeCount++">
          +1
        </button>
      </div>
    </div>
  </div>
</template>
