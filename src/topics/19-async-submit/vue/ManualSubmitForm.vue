<script setup lang="ts">
/**
 * 手写提交状态（React 对照：react/ManualSubmitForm.tsx，字段、错误分层、实验按钮一致）。
 *
 * 和 React 版逐行对应：@submit.prevent ↔ e.preventDefault()；ref(false) ↔ useState(false)；try / catch / finally 相同。
 * 差别在防重复：Vue 的 ref 读写是同步的，同一轮事件里第二次进入 handleSubmit 时 submitting.value 已经是 true，
 * 守卫本身就能拦住，不需要 React 版的 useRef 锁（点「同一轮事件里提交两次」看日志）。
 */
import { nextTick, ref, useId, useTemplateRef } from 'vue'
import { ApiFieldError, submitOrder } from '@/shared/mockApi'

type Field = 'customer' | 'amount'

type SubmitResult =
  | { type: 'success'; orderNo: string }
  | { type: 'fieldError'; field: Field; message: string }
  | { type: 'networkError'; message: string }

const { delayMs = 800 } = defineProps<{ delayMs?: number }>()

// 金额用字符串存，和 React 版一致；不用 type="number"，也就没有 v-model 自动 .number 的转换
const customer = ref('')
const amount = ref('')
const submitting = ref(false)
const result = ref<SubmitResult | null>(null)
const failNetwork = ref(false)

const logLines = ref<string[]>([])
function log(line: string) {
  logLines.value = [...logLines.value.slice(-11), line]
}
let requestSeq = 0

const form = useTemplateRef<HTMLFormElement>('form')
const customerInput = useTemplateRef<HTMLInputElement>('customerInput')
const amountInput = useTemplateRef<HTMLInputElement>('amountInput')
const customerId = useId()
const amountId = useId()

function fieldError(field: Field) {
  return result.value?.type === 'fieldError' && result.value.field === field ? result.value.message : ''
}

function isField(value: string): value is Field {
  return value === 'customer' || value === 'amount'
}

async function handleSubmit() {
  // 守卫：ref 是同步生效的，同一轮事件里的第二次调用也能读到 true
  if (submitting.value) {
    log('重复提交被 submitting 守卫拦下')
    return
  }

  requestSeq += 1
  const id = requestSeq
  submitting.value = true
  result.value = null
  log(`#${id} 发出请求：${customer.value || '（空）'}，金额 ${amount.value || '（空）'}`)

  try {
    const order = await submitOrder(
      { customer: customer.value, amount: Number(amount.value) },
      { delayMs, failRate: failNetwork.value ? 1 : 0 },
    )
    result.value = { type: 'success', orderNo: order.orderNo }
    customer.value = ''
    amount.value = ''
    log(`#${id} 成功：${order.orderNo}`)
  } catch (err) {
    if (err instanceof ApiFieldError && isField(err.field)) {
      result.value = { type: 'fieldError', field: err.field, message: err.message }
    } else {
      result.value = { type: 'networkError', message: err instanceof Error ? err.message : '未知错误' }
    }
    log(`#${id} 失败：${err instanceof Error ? err.message : '未知错误'}`)
  } finally {
    submitting.value = false
  }

  // 聚焦出错的字段：输入框在 submitting 期间是 disabled，要等 DOM 更新之后（nextTick）才能 focus。
  // React 版把这一步放在 effect 里，原因相同
  if (result.value?.type === 'fieldError') {
    const target = result.value.field === 'customer' ? customerInput : amountInput
    await nextTick()
    target.value?.focus()
  }
}

function submitTwiceInOneTurn() {
  form.value?.requestSubmit()
  form.value?.requestSubmit()
}
</script>

<template>
  <div class="card stack">
    <h3>区块一：手写 submitting（Vue）</h3>
    <p class="muted">
      提交中 + 防连点：submitting ref + :disabled【最常用】；ref 同步读写，处理函数里的守卫就能拦住同一轮里的第二次，不需要锁。
    </p>

    <form
      ref="form"
      class="stack"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <div
        v-if="result?.type === 'networkError'"
        role="alert"
        class="row"
      >
        <span class="error-text">{{ result.message }}</span>
        <button
          type="button"
          :disabled="submitting"
          @click="form?.requestSubmit()"
        >
          重试
        </button>
      </div>

      <div
        class="stack"
        style="gap: 4px"
      >
        <label :for="customerId">客户名称</label>
        <input
          :id="customerId"
          ref="customerInput"
          v-model="customer"
          placeholder="如：张伟"
          :disabled="submitting"
          :aria-invalid="fieldError('customer') ? true : undefined"
          :aria-describedby="fieldError('customer') ? `${customerId}-error` : undefined"
        >
        <p
          v-if="fieldError('customer')"
          :id="`${customerId}-error`"
          class="error-text"
          style="margin: 0"
        >
          {{ fieldError('customer') }}
        </p>
      </div>

      <div
        class="stack"
        style="gap: 4px"
      >
        <label :for="amountId">金额</label>
        <input
          :id="amountId"
          ref="amountInput"
          v-model="amount"
          inputmode="decimal"
          placeholder="大于 0 的数字"
          :disabled="submitting"
          :aria-invalid="fieldError('amount') ? true : undefined"
          :aria-describedby="fieldError('amount') ? `${amountId}-error` : undefined"
        >
        <p
          v-if="fieldError('amount')"
          :id="`${amountId}-error`"
          class="error-text"
          style="margin: 0"
        >
          {{ fieldError('amount') }}
        </p>
      </div>

      <div class="row">
        <button
          type="submit"
          class="btn-primary"
          :disabled="submitting"
        >
          {{ submitting ? '提交中…' : '创建订单' }}
        </button>
      </div>
    </form>

    <p
      v-if="result?.type === 'success'"
      role="status"
      class="success-text"
      style="margin: 0"
    >
      创建成功！新订单号：{{ result.orderNo }}
    </p>

    <div class="row">
      <label
        class="row"
        style="gap: 4px"
      >
        <input
          v-model="failNetwork"
          type="checkbox"
        >
        模拟网络失败
      </label>
      <button
        type="button"
        @click="submitTwiceInOneTurn"
      >
        同一轮事件里提交两次
      </button>
    </div>

    <div class="row">
      <strong>请求日志</strong>
      <button
        type="button"
        class="btn-ghost"
        @click="logLines = []"
      >
        清空
      </button>
    </div>
    <ul
      class="log"
      aria-label="手写版请求日志"
    >
      <li
        v-if="logLines.length === 0"
        class="log-empty"
      >
        （空）
      </li>
      <li
        v-for="(line, i) in logLines"
        :key="i"
      >
        {{ line }}
      </li>
    </ul>
  </div>
</template>
