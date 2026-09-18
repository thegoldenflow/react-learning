<script setup lang="ts">
/**
 * 区块二 Vue 对照的触发按钮（放在 ErrorBoundary.vue 里面）。对照 react/CatchScopeDemo.tsx 的 Triggers。
 * Vue 能接住由 Vue 负责调用的代码里的错误：渲染函数、模板上的事件处理函数（包括处理函数返回的被拒绝的 Promise）、
 * watch 回调、生命周期钩子……（runtime-core 的 callWithErrorHandling / callWithAsyncErrorHandling）。
 * 接不住的是 Vue 没参与调用的代码：setTimeout 回调、自己 addEventListener 注册的原生监听。
 */
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

const crash = ref(false)
const watchTick = ref(0)

// 在模板里调用：错误发生在渲染函数里（info 是 'render function'）
function renderStatus() {
  if (crash.value) throw new Error('渲染中 throw')
  return '（正常）'
}

watch(watchTick, () => {
  throw new Error('watch 回调里 throw')
})

function throwSync() {
  throw new Error('事件处理函数里 throw')
}

async function throwAsync() {
  await Promise.resolve()
  throw new Error('async 事件处理函数 await 之后 throw')
}

function throwInTimeout() {
  setTimeout(() => {
    throw new Error('setTimeout 回调里 throw')
  }, 0)
}

// 自己注册的原生监听：Vue 不经手，错误不会进 onErrorCaptured
const nativeButton = useTemplateRef<HTMLButtonElement>('native')
const onNativeClick = () => {
  throw new Error('addEventListener 注册的原生监听里 throw')
}
onMounted(() => nativeButton.value?.addEventListener('click', onNativeClick))
// 卸载前移除（onUnmounted 时模板 ref 已经被置为 null）
onBeforeUnmount(() => nativeButton.value?.removeEventListener('click', onNativeClick))
</script>

<template>
  <div class="stack">
    <span class="muted">渲染状态：{{ renderStatus() }}</span>
    <strong>接得住（外层边界显示兜底界面）</strong>
    <div class="row">
      <button
        class="btn-danger"
        @click="crash = true"
      >
        1. 渲染中 throw
      </button>
      <button
        class="btn-danger"
        @click="throwSync"
      >
        2. 事件处理函数里 throw
      </button>
      <button
        class="btn-danger"
        @click="throwAsync"
      >
        3. async 处理函数里 throw
      </button>
      <button
        class="btn-danger"
        @click="watchTick++"
      >
        4. watch 回调里 throw
      </button>
    </div>
    <strong>接不住（去了 window 的 error 事件）</strong>
    <div class="row">
      <button @click="throwInTimeout">
        5. setTimeout 里 throw
      </button>
      <button ref="native">
        6. addEventListener 的原生监听里 throw
      </button>
    </div>
  </div>
</template>
