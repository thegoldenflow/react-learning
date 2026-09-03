<script setup lang="ts">
/**
 * 订单列表页（/orders）：演示 query 参数筛选（?status=paid）。
 * React 版对照：useSearchParams —— 读用 searchParams.get('status')，写用 setSearchParams，
 * 一个 hook 管读写；Vue 里读写分离在两个对象上：useRoute() 读当前路由信息，useRouter() 做跳转。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'
import { ORDERS } from './ordersData'

const route = useRoute()
const router = useRouter()

// route.query.status 类型是 string | null | (string | null)[]（vue-router 4 的 LocationQueryValue；同名参数可能重复出现），
// URL 是用户可改的外部输入，必须自己收窄成合法值。
// React 的 searchParams.get() 返回 string | null，同样要收窄。
// 用 computed 跟踪 query 变化（setup 只跑一次，route 是响应式对象）；
// React 版组件在 URL 变化时重新渲染，直接在函数体里算即可。
const status = computed<OrderStatus | 'all'>(() => {
  const raw = route.query.status
  return raw === 'pending' || raw === 'paid' || raw === 'cancelled' ? raw : 'all'
})

// 派生数据用 computed（React 版：渲染时直接算的普通变量）
const filtered = computed(() =>
  status.value === 'all' ? ORDERS : ORDERS.filter((o) => o.status === status.value),
)

const FILTERS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: ORDER_STATUS_TEXT.pending },
  { value: 'paid', label: ORDER_STATUS_TEXT.paid },
  { value: 'cancelled', label: ORDER_STATUS_TEXT.cancelled },
]

// 改 query：router.push 一个 location 对象（Vue 惯用「对象描述目标」），向 history 压入新记录（可后退）。
// React 版对照：setSearchParams({ status })，效果等价于点了 <Link to="/orders?status=paid">。
function changeStatus(next: OrderStatus | 'all') {
  router.push({ path: '/orders', query: next === 'all' ? {} : { status: next } })
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      点筛选按钮观察 query 参数变化（当前 status={{ status }}）；筛选状态存在 URL
      里，刷新 / 分享 / 后退都不丢 —— 这是 query 优于组件 state 的场景
    </p>
    <div class="row">
      <button
        v-for="f in FILTERS"
        :key="f.value"
        :class="{ 'btn-primary': status === f.value }"
        @click="changeStatus(f.value)"
      >
        {{ f.label }}
      </button>
    </div>
    <table>
      <thead>
        <tr>
          <th>订单号</th>
          <th>客户</th>
          <th>金额</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="o in filtered"
          :key="o.id"
        >
          <td>
            <!-- RouterLink 生成 <a> 但拦截点击、走客户端路由（不刷新页面）。
                 React 对照：<Link to={`/orders/${o.id}`}> -->
            <RouterLink :to="`/orders/${o.id}`">
              {{ o.orderNo }}
            </RouterLink>
          </td>
          <td>{{ o.customer }}</td>
          <td>¥{{ o.amount }}</td>
          <td>
            <span :class="`badge badge-${o.status}`">{{ ORDER_STATUS_TEXT[o.status] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
