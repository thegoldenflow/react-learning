<script setup lang="ts">
/**
 * 区块一 Vue 对照：ErrorBoundary.vue（onErrorCaptured + v-if 切换兜底界面）—— 隔离、重置、resetKeys。
 * 对照 react/BoundaryBasicsDemo.tsx。
 */
import { ref } from 'vue'
import BuggyCounter from './BuggyCounter.vue'
import CaptureOnlyParent from './CaptureOnlyParent.vue'
import ErrorBoundary from './ErrorBoundary.vue'
import ProductDetail from './ProductDetail.vue'

const safeCount = ref(0)
const productId = ref('p1')
const useResetKeys = ref(true)
const log = ref<string[]>([])

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))
const push = (line: string) => {
  log.value = [...log.value, line].slice(-10)
}
</script>

<template>
  <div class="card stack">
    <h3>区块一：边界组件 —— 隔离、重置、resetKeys</h3>
    <div class="row">
      <div class="card">
        <ErrorBoundary @error="(err, info) => push(`@error：${message(err)}（来源：${info}）`)">
          <BuggyCounter />
          <template #fallback="{ error, reset }">
            <div
              class="stack"
              role="alert"
            >
              <p class="error-text">
                这块区域崩溃了：{{ message(error) }}
              </p>
              <button
                class="btn-primary"
                @click="reset"
              >
                重试
              </button>
            </div>
          </template>
        </ErrorBoundary>
      </div>
      <div class="card">
        <div class="row">
          <span>边界外的计数器：<strong>{{ safeCount }}</strong></span>
          <button @click="safeCount++">
            +1
          </button>
        </div>
      </div>
    </div>

    <strong>resetKeys：出错的原因变了就自动重置</strong>
    <div class="row">
      <label
        v-for="id in ['p1', 'p2', 'p3']"
        :key="id"
        class="row"
      >
        <input
          v-model="productId"
          type="radio"
          name="topic20-product-vue"
          :value="id"
        >
        {{ id === 'p3' ? `${id}（数据损坏）` : id }}
      </label>
      <label class="row">
        <input
          v-model="useResetKeys"
          type="checkbox"
        >
        传 :reset-keys="[productId]"
      </label>
    </div>
    <ErrorBoundary
      :reset-keys="useResetKeys ? [productId] : undefined"
      @error="(err) => push(`@error：${message(err)}`)"
      @reset="push('@reset：边界已重置')"
    >
      <ProductDetail :id="productId" />
      <template #fallback="{ error, reset }">
        <div
          class="row"
          role="alert"
        >
          <span class="error-text">{{ message(error) }}</span>
          <button @click="reset">
            重试
          </button>
        </div>
      </template>
    </ErrorBoundary>

    <strong>实验：只注册 onErrorCaptured、不换界面</strong>
    <div class="card">
      <CaptureOnlyParent />
    </div>

    <pre
      class="log"
      aria-label="区块一日志"
    >{{ log.length === 0 ? '（还没有捕获到错误）' : log.join('\n') }}</pre>
  </div>
</template>
