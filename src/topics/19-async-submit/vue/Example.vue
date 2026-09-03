<script setup lang="ts">
/**
 * 学习主题：异步提交与防重复 —— submitting 状态的工业界标准写法
 *
 * React 核心概念：
 * - submitting 布尔状态：提交前置 true，try/finally 里置回 false（成功、失败都必须恢复）
 * - 防重复的两层保险：disabled={submitting}（UI 层）+ 处理函数开头 if (submitting) return（逻辑层）
 * - 结果提示的状态建模：result: { type: 'success' | 'error'; message: string } | null ——
 *   一个字段同时表达「有没有结果、是成功还是失败、文案是什么」，杜绝多个散装布尔的非法组合
 * - 成功后清空表单、失败保留输入 —— 别让用户重新打一遍
 * - React 19 的 useActionState / useTransition 是处理表单提交的新趋势，
 *   但手写 submitting 仍是面试与存量代码的主流（本示例用基础写法）
 *
 * Vue 对应概念：
 * - ref(false) 的 submitting + 一模一样的 try/finally
 * - 表单绑定用 v-model（React 是受控组件 value + onChange）
 *
 * 最重要的区别：
 * - 异步提交的流程控制（禁用、恢复、成功清空、失败保留）是框架无关的工程功底，
 *   两边逐行对应；差异只在状态 API（useState vs ref）与表单绑定（受控组件 vs v-model）。
 */
import { ref } from 'vue'
import { submitOrder } from '@/shared/mockApi'

// 与 React 版相同的结果建模：null = 还没提交过；type 区分成功/失败，
// 同样杜绝「两条提示同时显示」的非法组合
interface SubmitResult {
  type: 'success' | 'error'
  message: string
}

// React 版是四个 useState；这里是四个 ref —— 这层业务逻辑两边几乎一致，差异只在状态 API。
// 金额的小差异：React 的受控 value 永远是字符串（空串这种转不成数字的中间态原样留在 state 里；
// "12." 这类半截小数在 type="number" 下会被浏览器规范成空串，要保留得用 type="text" + inputmode="decimal"）；
// Vue 对 type="number" 的输入会自动做数字转换（相当于隐式加了 .number 修饰符），
// 输入合法数字时 amount 存的是 number，空串等转不动的仍是 string —— 所以类型写 string | number，
// 提交时两边都统一 Number() 转换，行为一致。
const customer = ref('')
const amount = ref<string | number>('')
const submitting = ref(false)
const result = ref<SubmitResult | null>(null)

// React 版这里是 handleSubmit(e) + e.preventDefault()；Vue 用 @submit.prevent 修饰符代劳
async function handleSubmit() {
  // 防重复第二层保险（逻辑层守卫）：UI 禁用可能被键盘提交等方式绕过，函数开头 guard 兜底。
  // 「怎么防止表单重复提交」的面试答案两个框架通用：disabled + guard 两层一起上
  if (submitting.value) return

  submitting.value = true
  result.value = null // 清掉上一次的提示
  try {
    const order = await submitOrder(
      { customer: customer.value, amount: Number(amount.value) },
      { failRate: 0.3 }, // 30% 概率随机失败，与 React 版一致
    )
    result.value = { type: 'success', message: `创建成功！新订单号：${order.orderNo}` }
    // 成功后清空表单（React 版：setCustomer('') + setAmount('')）
    customer.value = ''
    amount.value = ''
  } catch (err) {
    // 失败：显示错误，但保留输入 —— 用户点一下重新提交即可
    result.value = { type: 'error', message: err instanceof Error ? err.message : '未知错误' }
  } finally {
    // 与 React 版完全相同的关键点：恢复必须放 finally，否则失败后表单永久「卡死」
    submitting.value = false
  }
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      30% 概率随机失败；金额填 0 / 留空或清空客户名可看服务端校验错误；提交中快速连点按钮不会重复提交
    </p>

    <!-- @submit.prevent 对应 React 的 e.preventDefault() -->
    <form
      class="card stack"
      @submit.prevent="handleSubmit"
    >
      <label class="stack">
        客户名称
        <!-- v-model 对应 React 的 value + onChange 受控写法 -->
        <input
          v-model="customer"
          placeholder="如：张伟"
          :disabled="submitting"
        >
      </label>
      <label class="stack">
        金额
        <input
          v-model="amount"
          type="number"
          placeholder="大于 0 的数字"
          :disabled="submitting"
        >
      </label>
      <div class="row">
        <!-- 防重复第一层保险：提交期间禁用 + 文案切换，与 React 版共用同一个 submitting 单一数据源 -->
        <button
          type="submit"
          class="btn-primary"
          :disabled="submitting"
        >
          {{ submitting ? '提交中…' : '创建订单' }}
        </button>
      </div>
    </form>

    <!-- result 为 null 时什么都不渲染；type 同时决定样式和语义（与 React 版一致） -->
    <p
      v-if="result"
      :class="result.type === 'success' ? 'success-text' : 'error-text'"
    >
      {{ result.message }}
    </p>
  </div>
</template>
