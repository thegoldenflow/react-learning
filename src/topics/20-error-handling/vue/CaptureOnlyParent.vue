<script setup lang="ts">
/**
 * 实验：只注册 onErrorCaptured、不换界面，会怎样？
 * 渲染函数抛错时，Vue 把出错的 BuggyCounter 渲染成一个空注释节点（runtime-core.cjs.js:4695-4698：handleError 之后
 * createVNode(Comment)），但实例没有被卸载，state（count = 3）也还在；它旁边的内容照常显示（Example.test.ts 有验证）。
 * 如果错误是在更新前的 computed 脏检查里抛的（BuggyCounter.vue 的注释），连渲染都没执行，界面停在上一次的样子。
 * React 不一样：边界以内的整棵子树都会被卸载、换成 fallback；没有边界时整个根都会被移除。
 * 所以 Vue 里要「显示兜底界面并在重试时重建」，得像 ErrorBoundary.vue 那样自己用 v-if 切换。
 */
import { onErrorCaptured, ref } from 'vue'
import BuggyCounter from './BuggyCounter.vue'

const captured = ref('')

onErrorCaptured((err) => {
  captured.value = err instanceof Error ? err.message : String(err)
  return false
})
</script>

<template>
  <div class="stack">
    <BuggyCounter />
    <p class="muted">
      {{ captured ? `已捕获：${captured}（上面的计数器变成了空白，实例还在）` : '这里只注册了 onErrorCaptured，没有兜底界面' }}
    </p>
  </div>
</template>
