<script setup lang="ts">
/**
 * 区块四（Vue 对照，对应 react/SuspenseStatsPanel.tsx）：<Suspense> + vue-query 的 suspense()。
 *
 * - Vue 的 <Suspense> 仍是实验性功能（vuejs.org/guide/built-ins/suspense 页首的提示），属于【尝鲜】；
 *   React 的 Suspense + useSuspenseQuery 是稳定 API。
 * - 错误由父组件的 onErrorCaptured 接住（异步 setup 的 reject 和 watch 回调里抛的错都会走到这里），
 *   对应 React 的错误边界；返回 false 表示到此为止，不再往上传。
 * - 已经显示过内容之后，<Suspense> 只有在 #default 的根节点被替换时才会回到 pending：缓存被清空不会让它重新挂起。
 *   所以这里「重新加载」要做两件事：removeQueries 删掉这条缓存，再换 key 重新挂载子组件；
 *   :timeout="0" 让它换内容时立刻显示 fallback（默认会先保留旧内容）。React 侧只要 resetQueries，组件自己会重新挂起。
 */
import { onErrorCaptured, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import OrderStatsView from './OrderStatsView.vue'
import { orderKeys, type OrdersDemo } from './ordersDemo'

const props = defineProps<{ demo: OrdersDemo }>()
const queryClient = useQueryClient()

const attempt = ref(0) // 子组件的 key：一变就重新挂载
const errorMessage = ref<string | null>(null)

onErrorCaptured((err) => {
  errorMessage.value = err instanceof Error ? err.message : String(err)
  return false
})

function reload(fail: boolean) {
  if (fail) props.demo.failNext('stats')
  errorMessage.value = null
  queryClient.removeQueries({ queryKey: orderKeys.stats() })
  attempt.value += 1
}

function retry() {
  errorMessage.value = null
  attempt.value += 1
}
</script>

<template>
  <div class="card stack">
    <h3>区块四：Suspense —— Vue 的 &lt;Suspense&gt;（实验性）+ vue-query 的 suspense()</h3>
    <p class="muted">
      「清空缓存重新加载」先看到 fallback；「清空缓存并让请求失败」走到 onErrorCaptured，点「重试」恢复。
    </p>
    <div class="row">
      <button @click="reload(false)">
        清空缓存重新加载
      </button>
      <button
        class="btn-danger"
        @click="reload(true)"
      >
        清空缓存并让请求失败
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="row"
      role="alert"
    >
      <span class="error-text">统计加载失败（onErrorCaptured 接住）：{{ errorMessage }}</span>
      <button
        class="btn-primary"
        @click="retry"
      >
        重试
      </button>
    </div>
    <Suspense
      v-else
      :timeout="0"
    >
      <OrderStatsView
        :key="attempt"
        :demo="demo"
      />
      <template #fallback>
        <p class="muted">
          统计加载中…（Suspense #fallback）
        </p>
      </template>
    </Suspense>
  </div>
</template>
