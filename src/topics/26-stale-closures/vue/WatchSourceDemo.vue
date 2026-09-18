<script setup lang="ts">
/**
 * 区块四 Vue 对照：watch 的 source 决定谁会让它重跑。对照 react/DependencyLabs.tsx。
 *
 * 4a 提交 + 主题（React 4a）：
 * - watchEffect：「automatically tracks every reactive property accessed during its synchronous execution」—— 回调里读了 theme，theme 就成了依赖，
 *   提交之后每切一次主题又发一次请求。这就是 React「Effect 依赖 [submitted, theme]」的样子。
 * - watch(submitted, cb)：只追踪显式的 source，回调里读 theme 不会被追踪（「It won't track anything accessed inside the callback」）——
 *   「读最新值但不因为它重跑」，概念上对应 React 的 useEffectEvent；Vue 不需要专门的 API。
 * - 事件处理函数里直接做：两边框架的首选。这段逻辑是对「点了提交」的响应，本来就不该放进 watch / Effect。
 * 4b（每次渲染新建的对象当依赖）在 Vue 里基本不会发生：setup 只执行一次，对象也只建一次；watch 比较的是 source 的值，不是「每次渲染」。
 * 4c 非响应式的值当 source：watch(() => plain.count) 里 plain 是普通对象，Vue 追踪不到，改了不会触发 ——
 *   和 React 的 ref.current 进依赖数组一样没用；区别是 React 在别的原因重渲染时还会补跑一次，Vue 的 watch 不看渲染，一次都不跑。
 */
import { reactive, ref, watch, watchEffect } from 'vue'
import LogList from './LogList.vue'

type Theme = 'light' | 'dark'

// ---- 4a ----
const theme = ref<Theme>('light')
// 日志用 reactive 数组 + push：Vue 内部对数组的 push / splice 不做依赖追踪。要是写成 ref、再 submitLog.value.push(...)，
// watchEffect 会把读到的 submitLog.value 也收成依赖 —— 点「清空日志」（给 ref 赋一个新数组）就会让它重跑、再发一次请求（测试覆盖）。
const submitLog = reactive<string[]>([])
const submittedA = ref(false) // watchEffect 版
const submittedB = ref(false) // watch 版
const submittedC = ref(false) // 事件处理函数版

watchEffect(() => {
  if (!submittedA.value) return
  submitLog.push('【watchEffect 版】POST /api/register')
  submitLog.push(`【watchEffect 版】弹出通知「注册成功」（${theme.value} 主题）`)
})

watch(submittedB, (submitted) => {
  if (!submitted) return
  submitLog.push('【watch 版】POST /api/register')
  submitLog.push(`【watch 版】弹出通知「注册成功」（${theme.value} 主题）`)
})

function submitViaHandler() {
  submittedC.value = true
  submitLog.push('【事件版】POST /api/register')
  submitLog.push(`【事件版】弹出通知「注册成功」（${theme.value} 主题）`)
}

// ---- 4c ----
const plain = { count: 0 } // 普通对象：没有 reactive() 包装
const plainLog = ref<string[]>([])
const renders = ref(0)
watch(
  () => plain.count,
  (value) => plainLog.value.push(`watch 回调执行了（plain.count=${value}）`),
)
function bumpPlain() {
  plain.count += 1
  plainLog.value.push(`plain.count 改成了 ${plain.count}（Vue 追踪不到）`)
}
</script>

<template>
  <div class="card stack">
    <h3>区块四：watch 的 source 决定谁会让它重跑 —— watch vs watchEffect、非响应式的值当 source</h3>
    <div class="card stack">
      <h4>4a · watchEffect 追踪回调里读到的一切，watch 只追踪 source</h4>
      <p class="muted">
        三个按钮各点一次提交，再切几次主题：watchEffect 版每切一次就多发一次请求；watch 版和事件版都只发一次。
      </p>
      <div class="row">
        <button
          class="btn-ghost"
          @click="theme = theme === 'light' ? 'dark' : 'light'"
        >
          切换主题（当前 {{ theme }}）
        </button>
        <button
          :disabled="submittedA"
          @click="submittedA = true"
        >
          {{ submittedA ? '已提交（watchEffect 版）' : '提交（watchEffect 版）' }}
        </button>
        <button
          :disabled="submittedB"
          @click="submittedB = true"
        >
          {{ submittedB ? '已提交（watch 版）' : '提交（watch 版）' }}
        </button>
        <button
          :disabled="submittedC"
          @click="submitViaHandler"
        >
          {{ submittedC ? '已提交（事件版）' : '提交（事件版）' }}
        </button>
      </div>
      <LogList
        :lines="submitLog"
        label="4a 日志"
        @clear="submitLog.splice(0)"
      />
    </div>
    <div class="card stack">
      <h4>4c · 非响应式的值当 watch 的 source 没用</h4>
      <p class="muted">
        点几次「plain.count + 1」，再点「让组件重渲染」：watch 回调一次都不执行 —— Vue 的 watch 只在追踪到的响应式数据变化时重跑，和渲染无关。
      </p>
      <div class="row">
        <button @click="bumpPlain">
          plain.count + 1
        </button>
        <button
          class="btn-ghost"
          @click="renders++"
        >
          让组件重渲染（已 {{ renders }} 次）
        </button>
      </div>
      <LogList
        :lines="plainLog"
        label="4c 日志"
        @clear="plainLog = []"
      />
    </div>
  </div>
</template>
