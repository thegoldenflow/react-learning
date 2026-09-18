<script setup lang="ts">
/**
 * 区块四的内层组件：<script setup> 里有顶层 await，它就成了「异步组件」，必须放在 <Suspense> 里渲染。
 *
 * vue-query 的 suspense()：缓存里没有数据（或已过期）就发请求并等它完成，否则直接返回。
 * 请求失败时要不要 reject 由 throwOnError 决定 —— 默认不 reject，而是 resolve 一个 error 状态的结果，
 * 这样错误就到不了父组件的 onErrorCaptured。这里写成和 React 侧 useSuspenseQuery 默认值同样的规则：
 * 缓存里没有数据时才抛（已经有数据时的后台重取失败，不把界面换成错误）。
 */
import { useQuery } from '@tanstack/vue-query'
import { ORDER_STATUS_TEXT } from '@/shared/types'
import type { OrdersDemo } from './ordersDemo'

const props = defineProps<{ demo: OrdersDemo }>()

const { data, isFetching, suspense } = useQuery({
  ...props.demo.statsOptions(),
  throwOnError: (_error, query) => query.state.data === undefined,
})

await suspense()
</script>

<template>
  <!-- Vue 侧的 data 类型仍含 undefined（和 React 的 useSuspenseQuery 不同），模板里照样要判断 -->
  <p
    v-if="data"
    aria-label="订单统计"
  >
    共 {{ data.total }} 单：{{ ORDER_STATUS_TEXT.pending }} {{ data.pending }} · {{ ORDER_STATUS_TEXT.paid }} {{ data.paid }} ·
    {{ ORDER_STATUS_TEXT.cancelled }} {{ data.cancelled }}
    <span
      v-if="isFetching"
      class="muted"
    > ⟳ 后台更新中</span>
  </p>
</template>
