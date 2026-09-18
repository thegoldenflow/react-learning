<script setup lang="ts">
/**
 * 区块二：Vue 的 v-if 没有 0 陷阱。对照 react/ZeroPitfallDemo.tsx。
 * - v-if 按 truthy 判断：0、NaN、'' 都不渲染（测试覆盖 0 与 NaN）。
 * - 但插值 {{ }} 里写 itemCount && '…'，表达式的值就是 0，插值会把它显示成「0」—— 和 React 的 && 一样。
 *   文档没有写插值怎么显示各种值，依据是源码：@vue/shared 3.5.42 的 toDisplayString（shared.cjs.js:518-520）null / undefined 显示成空串，其他原始值 String(val)，
 *   所以 0 显示「0」、NaN 显示「NaN」。
 * - false 更容易踩：{{ isVip && '…' }} 在 isVip 为 false 时显示「false」（React 不渲染 false）。插值里的条件写三元 cond ? '…' : ''，或者改用 v-if（测试覆盖）。
 */
import { computed, ref } from 'vue'

const PRICES = [399, 129, 259]
const itemCount = ref(3)
const isVip = ref(false)
const average = computed(() => {
  const prices = PRICES.slice(0, itemCount.value)
  return prices.reduce((sum, p) => sum + p, 0) / prices.length
})
</script>

<template>
  <div class="card stack">
    <h3>区块二：v-if 没有 0 陷阱，插值里的 &amp;&amp; 有</h3>
    <div class="row">
      <button @click="itemCount = 0">
        清空商品（数量设为 0）
      </button>
      <button @click="itemCount = 3">
        恢复为 3 件
      </button>
    </div>
    <ul class="stack">
      <li data-testid="v-if-count">
        ✅ v-if="itemCount"：<span v-if="itemCount">购物车共 {{ itemCount }} 件商品</span>
      </li>
      <li data-testid="v-if-average">
        ✅ v-if="average"：<span v-if="average">均价 ￥{{ average.toFixed(2) }}</span>
      </li>
      <li data-testid="interpolation-count">
        ❌ 插值里 itemCount &amp;&amp; '…'：{{ itemCount && `购物车共 ${itemCount} 件商品` }}
      </li>
      <li data-testid="interpolation-false">
        ❌ 插值里 isVip &amp;&amp; '…'：{{ isVip && '会员价 ￥299' }}
      </li>
      <li data-testid="interpolation-ternary">
        ✅ 插值里写三元 isVip ? '…' : ''：{{ isVip ? '会员价 ￥299' : '' }}
      </li>
    </ul>
  </div>
</template>
