<script setup lang="ts">
/**
 * 区块一：v-if / v-else-if / v-else。对照 react/BranchStylesDemo.tsx（React 用 JS 的 if / switch / 三元 / &&）。
 * - v-if「The block will only be rendered if the directive's expression returns a truthy value.」；v-else / v-else-if 必须紧跟在前一个分支后面（「must immediately follow」）。
 * - 一次切换好几个元素：v-if 写在 <template> 上，「which serves as an invisible wrapper」（React 里是 Fragment 或存进变量）。
 * - 查表、插值里的三元两边写法一样。
 */
import { ref } from 'vue'
import type { OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

const status = ref<OrderStatus>('pending')
const statuses = ['pending', 'paid', 'cancelled'] as const
</script>

<template>
  <div class="card stack">
    <h3>
      区块一：v-if / v-else-if / v-else
      <span
        :class="`badge badge-${status}`"
        data-testid="status-badge"
      >{{ ORDER_STATUS_TEXT[status] }}</span>
    </h3>
    <div class="row">
      <button
        v-for="s in statuses"
        :key="s"
        :disabled="status === s"
        @click="status = s"
      >
        设为{{ ORDER_STATUS_TEXT[s] }}
      </button>
    </div>
    <p
      v-if="status === 'pending'"
      class="error-text"
    >
      订单待支付，请在 30 分钟内完成付款
    </p>
    <p
      v-else-if="status === 'paid'"
      class="success-text"
    >
      支付成功，商品将在 48 小时内发出
    </p>
    <p
      v-else
      class="muted"
    >
      订单已取消
    </p>
    <p data-testid="progress">
      支付进度：{{ status === 'paid' ? '已完成' : '未完成' }}
    </p>
    <!-- <template v-if>：两段一起出现，最终 DOM 里没有 <template> 这一层 -->
    <template v-if="status === 'cancelled'">
      <p class="muted">
        （v-if 分支）这张订单不会再扣款
      </p>
      <p class="muted">
        已取消的订单可在 24 小时内联系客服恢复
      </p>
    </template>
  </div>
</template>
