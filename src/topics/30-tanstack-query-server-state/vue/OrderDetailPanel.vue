<script setup lang="ts">
/**
 * 区块三：依赖查询（Vue 对照，对应 react/OrderDetailPanel.tsx）。
 * detailOptions() 收一个 getter：它同时放进 queryKey 和 enabled（enabled: () => toValue(id) !== null），
 * props.selectedId 一变，key 和 enabled 一起更新。vue-query 的 enabled 类型是 MaybeRefOrGetter<boolean>。
 */
import { useQuery } from '@tanstack/vue-query'
import { ORDER_STATUS_TEXT } from '@/shared/types'
import QueryStatusTable from './QueryStatusTable.vue'
import type { OrdersDemo } from './ordersDemo'

const props = defineProps<{ demo: OrdersDemo; selectedId: string | null }>()
const emit = defineEmits<{ clear: [] }>()

const { data, error, status, fetchStatus, isPending, isLoading, isFetching, isError } = useQuery(
  props.demo.detailOptions(() => props.selectedId),
)
</script>

<template>
  <div class="card stack">
    <h3>区块三：依赖查询 —— enabled 为 false 时是 pending + idle</h3>
    <p class="muted">
      没选中时：pending 但 idle，isLoading 为 false。点上面表格里的任意一行，这里才发请求。
    </p>
    <QueryStatusTable
      label="详情查询的状态"
      :fields="{ selectedId: selectedId ?? 'null', status, fetchStatus, isPending, isLoading, isFetching }"
    />

    <p
      v-if="selectedId === null"
      class="muted"
    >
      还没有选中订单（查询没有执行）
    </p>
    <p
      v-if="isLoading"
      class="muted"
    >
      详情加载中…
    </p>
    <p
      v-if="isError"
      class="error-text"
      role="alert"
    >
      详情加载失败：{{ error?.message }}
    </p>
    <div
      v-if="data"
      class="stack"
    >
      <div class="row">
        <strong>{{ data.orderNo }}</strong>
        <span>{{ data.customer }}</span>
        <span>￥{{ data.amount }}</span>
        <span :class="`badge badge-${data.status}`">{{ ORDER_STATUS_TEXT[data.status] }}</span>
        <span
          v-if="isFetching"
          class="muted"
        >⟳ 后台重取中</span>
      </div>
      <ul>
        <li
          v-for="item in data.items"
          :key="item.id"
        >
          {{ item.name }} × {{ item.quantity }}（￥{{ item.price }}）
        </li>
      </ul>
      <button
        class="btn-ghost"
        @click="emit('clear')"
      >
        取消选中
      </button>
    </div>
  </div>
</template>
