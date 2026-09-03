<script setup lang="ts">
/**
 * 学习主题：综合实战 —— 订单管理页（搜索 / 筛选 / 分页 / 行内编辑 / 二次确认删除）
 *
 * React 核心概念：
 * - 「草稿值」与「提交值」分离：输入框存 draft，点搜索才提交为 keyword（07/11 题）
 * - 一个请求 effect 依赖 [keyword, status, page, reloadFlag]：搜索、筛选、翻页、刷新、重试
 *   全部收敛为「改状态 → effect 自动重新请求」，AbortController 防竞态（10/11 题）
 * - 判别联合建模 loading / error / success（含 empty）（11 题）；派生值 totalPages 渲染时直接算（09 题）
 * - 组件拆分：OrderRow 管一行的展示 / 编辑 / 删除，用 callback props 通知父级（08 题）；
 *   保存成功后用 map 做不可变局部更新（21 题）
 *
 * Vue 对应概念：
 * - React 靠「effect 依赖数组」声明式驱动请求；Vue 版把 load() 当普通函数命令式调用，
 *   只有「状态筛选变化立即查询」用 watch —— 同一个页面，两种触发哲学
 * - OrderRow 的 props/emit、v-model 表单、v-if 状态分支与 React 写法一一对应
 *
 * 最重要的区别：
 * - 业务逻辑（状态建模、竞态处理、二次确认、行内编辑）两边完全一样 —— 是框架无关的工程功底；
 *   框架差异集中在两点：请求由「依赖变化」还是「显式调用」触发；更新数据必须不可变还是可以直接改
 * - 本页手写的请求状态机与竞态处理，在 27 题（竞态）和 30 题（TanStack Query）里各有一版深入对照
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { fetchOrders, isAbortError } from '@/shared/mockApi'
import type { Order, OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'
import OrderRow from './OrderRow.vue'

const PAGE_SIZE = 5
const ORDER_STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'cancelled']

// 判别联合建模列表请求状态（11 题）—— 与 React 版逐字相同
type ListState =
  | { status: 'loading' }
  | { status: 'success'; orders: Order[]; total: number }
  | { status: 'error'; message: string }

const draft = ref('') // 输入框草稿（React 版是 useState + 受控输入）
const keyword = ref('') // 已提交的搜索词，才是真正的请求参数
const statusFilter = ref<OrderStatus | 'all'>('all')
const page = ref(1)
const state = ref<ListState>({ status: 'loading' })

// React 版的 controller 存在每轮 effect 的闭包里、由 cleanup 引用；
// Vue 版的 load 是普通函数，自己记住「上一次」的 controller 用于取消
let controller: AbortController | undefined

// React 版是「effect 依赖 [keyword, status, page, reloadFlag]，改状态 → 自动重新请求」；
// Vue 版把 load 写成普通函数，各入口（挂载 / 搜索 / 筛选 / 翻页 / 刷新 / 重试）命令式地调它 ——
// 所以不需要 reloadFlag 计数器：搜同一个词、按原参数刷新都只是「把 load 再调一次」
async function load() {
  controller?.abort() // 取消上一次在途请求，防竞态（对应 React effect 的 cleanup abort）
  const ctrl = new AbortController()
  controller = ctrl
  state.value = { status: 'loading' }
  try {
    // failRate: 0.15 与 React 版一致 —— 15% 概率随机失败，演示 error 分支与重试
    const { items, total } = await fetchOrders(
      { keyword: keyword.value, status: statusFilter.value, page: page.value, pageSize: PAGE_SIZE },
      { signal: ctrl.signal, failRate: 0.15 },
    )
    state.value = { status: 'success', orders: items, total }
  } catch (err) {
    if (isAbortError(err)) return // 「被取消」不算失败（10 题）
    state.value = { status: 'error', message: err instanceof Error ? err.message : '未知错误' }
  }
}

onMounted(load) // 初始加载：React 版靠「effect 挂载后必然执行一次」自动完成
onUnmounted(() => controller?.abort()) // 卸载时取消在途请求：React 版由 effect cleanup 覆盖

// 「状态筛选变化立即查询」用 watch —— 对应 React 版 effect 依赖数组里的 status。
// page 没有被 watch（它只是请求参数，翻页函数改完直接调 load），所以这里归 1 不会引发重复请求
watch(statusFilter, () => {
  page.value = 1
  load()
})

// 提交搜索（点按钮或回车都会触发 form 的 submit）：草稿提交为正式参数、回到第 1 页、查询。
// React 版这里是 setKeyword + setPage + setReloadFlag 三连，批处理成一次重渲染后由 effect 统一重跑
function handleSearch() {
  keyword.value = draft.value
  page.value = 1
  load()
}

// 翻页：React 版只 setPage，由 effect 自动重新请求；Vue 版改完参数手动调 load
function goPrev() {
  page.value -= 1
  load()
}
function goNext() {
  page.value += 1
  load()
}

// 刷新 / 重试是同一件事：参数不变，把 load 原样再调一次（React 版靠 reloadFlag +1 触发 effect）
function refresh() {
  load()
}

// 派生值用 computed（React 版是渲染时直接算的普通 const totalPages）
const totalPages = computed(() =>
  state.value.status === 'success' ? Math.max(1, Math.ceil(state.value.total / PAGE_SIZE)) : 1,
)

// 行保存成功：直接改数组元素 —— 响应式代理允许原地修改；
// React 版必须 map 出新数组做不可变更新（21 题），引用不变就不会重渲染。
// 同样地：若状态改成了不匹配当前筛选的值，该行会留在原地，点「刷新」即可
function handleSaved(saved: Order) {
  const s = state.value
  if (s.status !== 'success') return
  const index = s.orders.findIndex((o) => o.id === saved.id)
  if (index !== -1) s.orders[index] = saved
}

// 行删除成功：刷新当前页；删的是本页最后一条且不在第 1 页时回退一页（与 React 版一致）
function handleDeleted() {
  if (state.value.status === 'success' && state.value.orders.length === 1 && page.value > 1) {
    page.value -= 1
  }
  load()
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      综合页：搜索（点按钮或回车）+ 状态筛选（变化立即查询）+ 分页 + 行内编辑 + 二次确认删除；
      请求 15% 概率随机失败，可演示错误与重试
    </p>

    <!-- 工具栏：form + @submit.prevent 让回车也能触发搜索（React 版是 onSubmit + e.preventDefault()） -->
    <form
      class="row"
      @submit.prevent="handleSearch"
    >
      <!-- v-model ≈ React 的受控输入 value + onChange（07 题） -->
      <input
        v-model="draft"
        placeholder="搜索订单号或客户名"
        :disabled="state.status === 'loading'"
      >
      <button
        type="submit"
        class="btn-primary"
        :disabled="state.status === 'loading'"
      >
        搜索
      </button>
      <!-- v-model 直接拿到绑定值；React 版还要 e.target.value as OrderStatus | 'all' 断言收窄 -->
      <select
        v-model="statusFilter"
        :disabled="state.status === 'loading'"
      >
        <option value="all">
          全部
        </option>
        <option
          v-for="s in ORDER_STATUS_OPTIONS"
          :key="s"
          :value="s"
        >
          {{ ORDER_STATUS_TEXT[s] }}
        </option>
      </select>
      <!-- type="button" 防止误触发 form 提交（React 版同一个坑） -->
      <button
        type="button"
        :disabled="state.status === 'loading'"
        @click="refresh"
      >
        刷新
      </button>
    </form>

    <!-- v-if / v-else-if 状态分支（05/11 题）≈ React 的条件渲染表达式 -->
    <p
      v-if="state.status === 'loading'"
      class="muted"
    >
      加载中，请稍候…
    </p>

    <div
      v-else-if="state.status === 'error'"
      class="card"
    >
      <p class="error-text">
        {{ state.message }}
      </p>
      <button
        class="btn-primary"
        @click="refresh"
      >
        重试
      </button>
    </div>

    <p
      v-else-if="state.orders.length === 0"
      class="muted"
    >
      没有找到匹配的订单，换个关键词或筛选条件试试
    </p>

    <template v-else>
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>金额</th>
            <th>状态</th>
            <th>创建日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- v-for + :key ≈ React 的 map + key（06 题）；
               @saved / @deleted 对应 React 的 callback props onSaved / onDeleted -->
          <OrderRow
            v-for="order in state.orders"
            :key="order.id"
            :order="order"
            @saved="handleSaved"
            @deleted="handleDeleted"
          />
        </tbody>
      </table>

      <div class="row">
        <button
          :disabled="page <= 1"
          @click="goPrev"
        >
          上一页
        </button>
        <span class="muted">第 {{ page }} / {{ totalPages }} 页 · 共 {{ state.total }} 条</span>
        <button
          :disabled="page >= totalPages"
          @click="goNext"
        >
          下一页
        </button>
      </div>
    </template>
  </div>
</template>
