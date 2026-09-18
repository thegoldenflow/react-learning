<script setup lang="ts">
/**
 * 区块三：不要把 props 拷进本地状态。对照 react/MirrorPropsDemo.tsx。
 */
import { ref } from 'vue'
import PriceDraft from './PriceDraft.vue'
import PriceViews from './PriceViews.vue'

const price = ref(100)
const draftKey = ref(0)
</script>

<template>
  <div class="card stack">
    <h3>区块三：不要把 props 拷进本地状态</h3>
    <div class="row">
      <span>父组件的 price：<strong>{{ price }}</strong></span>
      <button @click="price += 10">
        父组件 price +10
      </button>
      <button @click="draftKey++">
        按当前 price 重开草稿（换 key）
      </button>
    </div>
    <PriceViews :price="price" />
    <PriceDraft
      :key="draftKey"
      :initial-price="price"
    />
  </div>
</template>
