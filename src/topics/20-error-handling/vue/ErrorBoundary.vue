<script setup lang="ts">
/**
 * Vue 版的可复用「错误边界」组件：对照 react/ErrorBoundary.tsx。
 * Vue 没有专门的边界原语，任何组件注册 onErrorCaptured 就能接住后代的错误；这里把它包成组件，方便和 React 对照。
 *
 * - onErrorCaptured(err, instance, info)：后代组件的错误到这里，info 是来源（'render function'、'native event handler' 等，
 *   生产构建里是短代码）。返回 false 阻止继续向上传播，也不会再交给 app.config.errorHandler、不会打印（runtime-core handleError）。
 * - 兜底：出错时用 v-if 把默认插槽整个换掉 —— 这一步要自己写。Vue 不会替你卸载出错的组件：渲染函数抛错时它渲染成一个空注释节点，
 *   computed 在更新前抛错时界面停在上一次的样子，两种情况实例和 state 都还在（CaptureOnlyParent.vue，Example.test.ts 有验证）。
 *   React 则会把边界以内的整棵子树卸载，换成 fallback。
 * - 重置：清掉错误，v-if 切回默认插槽，子树重新挂载成全新实例（state 归零）；resetKeys 变化时自动重置（对应 React 的 resetKeys）。
 */
import { onErrorCaptured, ref, watch } from 'vue'

const props = defineProps<{
  /** 任何一项变化（Object.is 逐项比较）就自动重置 */
  resetKeys?: readonly unknown[]
}>()

const emit = defineEmits<{
  /** 上报：对应 React 边界的 onError / componentDidCatch */
  error: [error: unknown, info: string]
  reset: []
}>()

defineSlots<{
  default(): unknown
  fallback(props: { error: unknown; info: string; reset: () => void }): unknown
}>()

const hasError = ref(false)
const error = ref<unknown>(null)
const info = ref('')

onErrorCaptured((err, _instance, errorInfo) => {
  hasError.value = true
  error.value = err
  info.value = errorInfo
  emit('error', err, errorInfo)
  return false
})

function reset() {
  emit('reset')
  hasError.value = false
  error.value = null
  info.value = ''
}

function keysChanged(prev: readonly unknown[] = [], next: readonly unknown[] = []) {
  return prev.length !== next.length || prev.some((item, i) => !Object.is(item, next[i]))
}

watch(
  () => props.resetKeys,
  (next, prev) => {
    if (hasError.value && keysChanged(prev, next)) reset()
  },
)
</script>

<template>
  <slot
    v-if="hasError"
    name="fallback"
    :error="error"
    :info="info"
    :reset="reset"
  />
  <slot v-else />
</template>
