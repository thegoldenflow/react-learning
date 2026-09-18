<script setup lang="ts">
/**
 * 区块二 Vue 对照：onErrorCaptured 接得住什么、接不住什么。对照 react/CatchScopeDemo.tsx。
 * 和 React 最大的不同：事件处理函数（同步 throw，以及处理函数返回的 Promise 被拒绝）Vue 都会交给 onErrorCaptured，info 是 'native event handler'；
 * React 的边界对事件处理函数无能为力，只能 try / catch 或 showBoundary。
 */
import { onMounted, onUnmounted, ref } from 'vue'
import CatchTriggers from './CatchTriggers.vue'
import ErrorBoundary from './ErrorBoundary.vue'

const log = ref<string[]>([])
const boundaryKey = ref(0)
const message = (error: unknown) => (error instanceof Error ? error.message : String(error))
const push = (line: string) => {
  log.value = [...log.value, line].slice(-10)
}

const onWindowError = (event: ErrorEvent) => {
  push(`window error 事件：${event.message}`)
  event.preventDefault() // 同 React 侧：只为保持控制台干净，真实项目在这里上报
}
onMounted(() => window.addEventListener('error', onWindowError))
onUnmounted(() => window.removeEventListener('error', onWindowError))
</script>

<template>
  <div class="card stack">
    <h3>区块二：onErrorCaptured 接得住什么、接不住什么</h3>
    <ErrorBoundary
      :key="boundaryKey"
      @error="(err, info) => push(`边界 @error：${message(err)}（来源：${info}）`)"
    >
      <CatchTriggers />
      <template #fallback="{ error, info }">
        <div
          class="stack"
          role="alert"
        >
          <p class="error-text">
            边界接住了：{{ message(error) }}（来源：{{ info }}）
          </p>
          <button
            class="btn-primary"
            @click="boundaryKey++"
          >
            换 key 重新挂载
          </button>
        </div>
      </template>
    </ErrorBoundary>
    <pre
      class="log"
      aria-label="区块二错误日志"
    >{{ log.length === 0 ? '（还没有错误）' : log.join('\n') }}</pre>
    <p class="muted">
      window 的 error 事件是整个页面共享的：左边 React 侧触发的同类错误也会出现在这个日志里。
    </p>
  </div>
</template>
