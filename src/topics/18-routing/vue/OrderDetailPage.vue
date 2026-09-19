<script setup lang="ts">
/**
 * 订单详情（/orders/:id）。
 *
 * 组件实例复用：/orders/o1 → /orders/o2 命中同一条路由，同一个 <RouterView> 复用这个组件实例，setup 不会重跑。
 * 所以取数要 watch 路由参数【最常用】；组件里的 ref（包括子组件 NoteDraft 的草稿）也会保留。
 * 需要重置就给子组件（或 RouterView）加 :key，或在 watch 里手动重置，两种都常见（06 题统一措辞）。React 侧是同一类问题：同位置复用，用 key={id} 重置。
 */
import { onWatcherCleanup, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchOrder, isAbortError } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type Order } from '@/shared/types'
import { can } from './auth'
import { hasInAppHistory } from './navigationHistory'
import NoteDraft from './NoteDraft.vue'

const route = useRoute()
const router = useRouter()

const order = ref<Order | null>(null)
const notFound = ref(false)
const loading = ref(true)
const resetDraftById = ref(false)

watch(
  () => route.params.id,
  async (id) => {
    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort())
    loading.value = true
    try {
      const result = await fetchOrder(String(id), { signal: controller.signal })
      // 找到新订单之前，旧订单的内容保持显示（React Data 模式在 loader 完成前也保留旧页面）
      order.value = result
      notFound.value = result === null
      loading.value = false
    } catch (err) {
      if (!isAbortError(err)) {
        loading.value = false
        throw err
      }
    }
  },
  { immediate: true },
)

function nextId(current: Order): string {
  return `o${Number(current.id.slice(1)) + 1}`
}

/** 返回的兜底：应用内没有上一页时去列表页（React 侧用 location.key === 'default' 判断） */
function goBack() {
  if (hasInAppHistory(router)) router.back()
  else void router.push('/orders')
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <button
        type="button"
        @click="goBack"
      >
        ← 返回
      </button>
      <RouterLink
        v-if="order"
        :to="`/orders/${nextId(order)}`"
      >
        下一个订单 →
      </RouterLink>
      <span
        v-if="loading"
        class="muted"
      >加载中……</span>
    </div>

    <div
      v-if="notFound"
      class="card stack"
    >
      <h3>404：订单不存在</h3>
      <p class="error-text">
        找不到订单 {{ route.params.id }}
      </p>
    </div>

    <template v-else-if="order">
      <div class="row">
        <!-- 按钮级权限：v-if（或封装成自定义指令 v-permission）只决定界面上显示什么，
             拦不住用户直接调接口；权限校验必须由后端完成（35 题，待新增）。 -->
        <button
          v-if="can('order:delete')"
          type="button"
          class="btn-danger"
          title="演示用，不会真的删除"
        >
          删除
        </button>
        <span
          v-else
          class="muted"
        >（未登录，界面上不显示删除按钮 —— 这只是体验层面的处理）</span>
      </div>

      <div class="card stack">
        <h3>
          {{ order.orderNo }}
          <span :class="`badge badge-${order.status}`">{{ ORDER_STATUS_TEXT[order.status] }}</span>
        </h3>
        <p>客户：{{ order.customer }} ｜ 金额：¥{{ order.amount }} ｜ 下单日期：{{ order.createdAt }}</p>
      </div>

      <label>
        <input
          v-model="resetDraftById"
          type="checkbox"
        >
        给备注组件加 :key="order.id"（勾上后，切换订单时草稿会清空）
      </label>
      <NoteDraft
        :key="resetDraftById ? order.id : 'same-instance'"
        :order-no="order.orderNo"
      />
    </template>
  </div>
</template>
