<script setup lang="ts">
/**
 * 订单详情页（/orders/:id）：演示读路径参数 + 返回按钮。
 * React 版对照：useParams() 读 :id；useNavigate() 拿 navigate 函数，navigate(-1) 后退一步。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ORDER_STATUS_TEXT } from '@/shared/types'
import { ORDERS } from './ordersData'
// 按钮级权限判断（与 React 版 useAuth().can 逻辑一致，只是取法不同：
// Vue 直接 import 模块级函数，React 要从 Context 里 useAuth() 取）
import { can } from './auth'

const route = useRoute()
const router = useRouter()

// route.params.id 对应 React 的 useParams().id。
// 必须用 computed 而不是一次性取值：/orders/o1 → /orders/o2 之间跳转时 Vue 会复用同一个组件实例
// （setup 不重跑），只有响应式读取才能跟上参数变化 —— 这是 Vue Router 的经典面试坑。
// React 版没有这个坑：URL 变化触发重新渲染，useParams 每次渲染都读到最新值。
const order = computed(() => ORDERS.find((o) => o.id === route.params.id))
</script>

<template>
  <!-- URL 是外部输入，参数对应的数据可能不存在，详情页必须处理「找不到」分支（与 React 版一致） -->
  <div
    v-if="!order"
    class="stack"
  >
    <p class="error-text">
      订单不存在：{{ route.params.id }}
    </p>
    <div class="row">
      <button @click="router.back()">
        ← 返回上一页
      </button>
    </div>
  </div>

  <div
    v-else
    class="stack"
  >
    <div class="row">
      <!-- router.back() = 浏览器后退一步，带着列表页的筛选 query 一起回去。
           React 对照：navigate(-1) -->
      <button @click="router.back()">
        ← 返回上一页
      </button>

      <!-- 按钮级权限：Vue 里就是一个 v-if；真实项目更常封装成自定义指令
           v-permission="'order:delete'"，在指令钩子里把没权限的元素 el.remove() 掉。
           React 对照：条件渲染 can('order:delete') && <button className="btn-danger">删除</button>，
           React 没有「指令」这个概念（没有一一对应关系），要复用只能抽成包装组件 <Can code="…">。
           两边的共同点：条件不成立时按钮压根不进 DOM，比 disabled 更安全、比 CSS 隐藏更彻底。
           也就是说 React 那边「路由守卫 = 包装组件、按钮权限 = 条件渲染」，
           用的是同一套「组件即一切」的心智模型，而 Vue 这边是「全局钩子 + 自定义指令」两套机制。 -->
      <button
        v-if="can('order:delete')"
        class="btn-danger"
        title="演示用，不真的删除"
      >
        删除
      </button>
      <span
        v-else
        class="muted"
      >
        （未登录 → 没有 order:delete 权限，删除按钮整个不渲染）
      </span>
    </div>
    <div class="card stack">
      <h3>
        {{ order.orderNo }}
        <span :class="`badge badge-${order.status}`">{{ ORDER_STATUS_TEXT[order.status] }}</span>
      </h3>
      <p>客户：{{ order.customer }} ｜ 金额：¥{{ order.amount }} ｜ 下单日期：{{ order.createdAt }}</p>
      <table>
        <thead>
          <tr>
            <th>商品</th>
            <th>单价</th>
            <th>数量</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="it in order.items"
            :key="it.id"
          >
            <td>{{ it.name }}</td>
            <td>¥{{ it.price }}</td>
            <td>{{ it.quantity }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
