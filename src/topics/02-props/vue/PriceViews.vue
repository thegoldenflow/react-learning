<script setup lang="ts">
/**
 * 区块三：同一个 price 两种用法。对照 react/MirrorPropsDemo.tsx 里的 PriceViews。
 * - ❌ ref(price)：只在 setup 执行时读一次（setup 每个实例只执行一次），之后父组件传新值，这个 ref 不变 —— 和 React 的 useState(price) 同一个坑；
 * - ✅ 直接在模板里读 price，要换算就用 computed（props 页「define a computed property using the prop's value」）。
 */
import { computed, ref } from 'vue'

const { price } = defineProps<{ price: number }>()

// 编译后是 ref(__props.price)：把那一刻的值拷进一个新的 ref，之后和 prop 再无关系
const mirrored = ref(price)
const withTax = computed(() => Math.round(price * 1.06))
</script>

<template>
  <ul class="stack">
    <li>
      ❌ ref(price) 拷出来的值：<strong data-testid="mirrored">{{ mirrored }}</strong>（停在 setup 执行时的值）
    </li>
    <li>
      ✅ 直接读 price：<strong data-testid="direct">{{ price }}</strong>；含税价用 computed：<strong data-testid="with-tax">{{ withTax }}</strong>
    </li>
  </ul>
</template>
