<script setup lang="ts">
/**
 * 行组件：一行订单的「展示 / 行内编辑 / 二次确认删除」
 * （对照 React 版：OrderRow 与 Example 同住一个 .tsx 文件 —— React 组件只是函数；
 * Vue 的 SFC 一文件一组件，所以拆成这个单独文件）。
 * defineProps 进、emit 出 ≈ React 的 props + callback props（08 题）。
 */
import { computed, reactive, ref } from 'vue'
import { deleteOrder, updateOrder } from '@/shared/mockApi'
import type { Order, OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

const props = defineProps<{ order: Order }>()
const emit = defineEmits<{ saved: [order: Order]; deleted: [id: string] }>()

const ORDER_STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'cancelled']

const editing = ref(false)
// 编辑草稿放一个 reactive 对象（React 版是三个 useState）。
// 金额字段注意与 React 的差异：React 里 e.target.value 恒为 string，提交时再 Number()；
// Vue 对 type="number" 的输入自动应用 .number 修饰符 —— 能解析时存入 number、
// 解析不了（如清空）回退为原始 string，所以类型是 string | number，提交时统一 Number() 兜底
const editForm = reactive({
  customer: '',
  amountText: '' as string | number,
  status: 'pending' as OrderStatus,
})
const saving = ref(false)
const confirmingDelete = ref(false) // 「删除」→「确认删除？」的二次确认态
const deleting = ref(false)
const rowError = ref<string | null>(null)

const busy = computed(() => saving.value || deleting.value) // React 版是渲染时直接算的 const busy

function startEdit() {
  // 进入编辑时从 props.order 拷贝一份草稿，保存前的修改不影响列表数据（与 React 版一致）
  editForm.customer = props.order.customer
  editForm.amountText = String(props.order.amount)
  editForm.status = props.order.status
  rowError.value = null
  confirmingDelete.value = false
  editing.value = true
}

// 保存：客户端先做基本校验再调 updateOrder；保存中禁用整行交互（19 题防重复提交）
async function save() {
  const amount = Number(editForm.amountText)
  if (!editForm.customer.trim()) {
    rowError.value = '客户名不能为空'
    return
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    rowError.value = '金额必须是大于 0 的数字'
    return
  }
  saving.value = true
  rowError.value = null
  try {
    const saved = await updateOrder(
      props.order.id,
      { customer: editForm.customer.trim(), amount, status: editForm.status },
      { failRate: 0.15 },
    )
    emit('saved', saved) // 通知父级更新该行 ≈ React 调 callback prop onSaved(saved)
    editing.value = false
  } catch (err) {
    rowError.value = err instanceof Error ? err.message : '保存失败'
  } finally {
    saving.value = false
  }
}

// 二次确认后的真正删除；成功后父级刷新列表，本行随之卸载
async function remove() {
  deleting.value = true
  rowError.value = null
  try {
    await deleteOrder(props.order.id, { failRate: 0.15 })
    emit('deleted', props.order.id) // ≈ React 的 onDeleted(order.id)
  } catch (err) {
    rowError.value = err instanceof Error ? err.message : '删除失败'
    deleting.value = false
    confirmingDelete.value = false
  }
}
</script>

<template>
  <tr>
    <td>{{ order.orderNo }}</td>
    <!-- 每个单元格按 editing 切换「文本 / 输入框」：v-if / v-else ≈ React 的三元表达式 -->
    <td>
      <input
        v-if="editing"
        v-model="editForm.customer"
        :disabled="busy"
      >
      <template v-else>
        {{ order.customer }}
      </template>
    </td>
    <td>
      <input
        v-if="editing"
        v-model="editForm.amountText"
        type="number"
        :disabled="busy"
      >
      <template v-else>
        ¥{{ order.amount }}
      </template>
    </td>
    <td>
      <select
        v-if="editing"
        v-model="editForm.status"
        :disabled="busy"
      >
        <option
          v-for="s in ORDER_STATUS_OPTIONS"
          :key="s"
          :value="s"
        >
          {{ ORDER_STATUS_TEXT[s] }}
        </option>
      </select>
      <!-- :class 动态拼接 ≈ React 的模板字符串 `badge badge-${order.status}` -->
      <span
        v-else
        class="badge"
        :class="`badge-${order.status}`"
      >
        {{ ORDER_STATUS_TEXT[order.status] }}
      </span>
    </td>
    <td>{{ order.createdAt }}</td>
    <td>
      <div class="row">
        <template v-if="editing">
          <button
            class="btn-primary"
            :disabled="busy"
            @click="save"
          >
            {{ saving ? '保存中…' : '保存' }}
          </button>
          <button
            :disabled="busy"
            @click="editing = false"
          >
            取消
          </button>
        </template>
        <template v-else-if="confirmingDelete">
          <!-- 二次确认：第一次点「删除」只是切换到确认态，再点这颗才真正调接口 -->
          <button
            class="btn-danger"
            :disabled="busy"
            @click="remove"
          >
            {{ deleting ? '删除中…' : '确认删除？' }}
          </button>
          <button
            :disabled="busy"
            @click="confirmingDelete = false"
          >
            取消
          </button>
        </template>
        <template v-else>
          <button
            :disabled="busy"
            @click="startEdit"
          >
            编辑
          </button>
          <button
            class="btn-danger"
            :disabled="busy"
            @click="confirmingDelete = true"
          >
            删除
          </button>
        </template>
        <span
          v-if="rowError"
          class="error-text"
        >{{ rowError }}</span>
      </div>
    </td>
  </tr>
</template>
