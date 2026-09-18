<script setup lang="ts">
/**
 * 主题：20. 错误边界（Vue 对照：onErrorCaptured）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：06、10、14、18、19（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - Vue 没有专门的边界组件：任何组件注册 onErrorCaptured((err, instance, info) => boolean | void) 就能接住后代的错误【主流】。
 *   本课把它包成可复用的 ErrorBoundary.vue（默认插槽 + fallback 插槽 + resetKeys），和 React 的手写边界对照。
 * - 捕获面比 React 宽【主流】：渲染、生命周期、setup、watch 回调，还有模板上的事件处理函数（同步 throw，以及处理函数返回的 Promise 被拒绝；
 *   只接住交回给 Vue 的 Promise，在 onMounted 里调 async 函数却不 return，它的拒绝 Vue 看不到），
 *   info 分别是 'render function'、'native event handler'、'watcher callback' 等（区块二，测试覆盖）。
 *   接不住的是 Vue 没参与调用的代码：setTimeout 回调、自己 addEventListener 注册的监听。
 * - Vue 不替你换界面：钩子只负责通知，兜底界面要自己用 v-if 切换，重试时子树重新挂载。出错的组件本身留在原地 ——
 *   渲染函数里抛错时渲染成空注释节点，computed 在更新前抛错时界面停在上一次的样子（info 是 'component update'），测试覆盖。
 *   官方提醒兜底界面不要再渲染出错的内容，否则会无限渲染。
 * - 传播规则：自下而上逐级调用所有 errorCaptured，最后到 app.config.errorHandler；某一层 return false 就停，也不再打印（区块四，测试覆盖）。
 *   React 的边界只交给最近的一个。
 * - 全局【主流】：app.config.errorHandler 对应 React 的 createRoot 回调，都是应用级上报入口；默认「will re-throw errors during development and log
 *   errors during production」；【较新·3.5 起】app.config.throwUnhandledErrorInProduction 可以让生产环境也抛出。
 * - React 的 react-error-boundary 在 Vue 里不需要对应物：Vue 本来就接事件处理函数的错误和交回给它的被拒绝的 Promise，用不着 showBoundary。
 * - <Suspense>【尝鲜·实验性】没有自己的错误处理，异步错误用父组件的 onErrorCaptured 接（32 题，待新增）。
 */
import AppErrorHandlerDemo from './AppErrorHandlerDemo.vue'
import BoundaryBasicsDemo from './BoundaryBasicsDemo.vue'
import CatchScopeDemo from './CatchScopeDemo.vue'
</script>

<template>
  <div class="stack">
    <BoundaryBasicsDemo />
    <CatchScopeDemo />
    <div class="card stack">
      <h3>区块三在 Vue 里</h3>
      <p class="muted">
        React 区块三的 react-error-boundary 主要解决两件事：少写 class 样板、用 showBoundary 把事件 / 异步错误交给边界。
        Vue 这边 onErrorCaptured 本来就是一个钩子，事件处理函数的错误、处理函数返回的被拒绝的 Promise 也会送上来，所以不需要这类库。
      </p>
    </div>
    <AppErrorHandlerDemo />
  </div>
</template>
