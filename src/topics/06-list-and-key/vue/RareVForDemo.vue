<script setup lang="ts">
/**
 * 【少用】v-for 的其他写法（ListBasicsDemo.vue 里已注释；Example.test.ts 直接挂载本组件，注释期间结论照样被验证）。
 * Vue 项目里平时写的就是 item in items；下面这些读别人的代码时认得出来就行（频率是工程经验）：
 * - of 代替 in：「You can also use of as the delimiter instead of in, so that it is closer to JavaScript's syntax for iterators」。
 * - 遍历对象 (value, key, index)：「The iteration order will be based on the result of calling Object.values() on the object」。
 * - 整数范围 n in 5：「Note here n starts with an initial value of 1 instead of 0.」
 * - 解构：「you can use destructuring on the v-for item alias similar to destructuring function arguments」。
 * React 没有这些语法糖：对象写 Object.entries(obj).map(…)，范围写 Array.from({ length: 5 }, (_, i) => i + 1).map(…)。
 */
import { PRODUCTS } from '@/shared/products'

const firstThree = PRODUCTS.slice(0, 3)
const shippingRules = { 满额包邮: '满 99 元', 发货时间: '48 小时内', 退货期: '7 天' }
</script>

<template>
  <div class="stack">
    <h4>【少用】v-for 的其他写法</h4>
    <ul aria-label="of 分隔符">
      <li
        v-for="p of firstThree"
        :key="p.id"
      >
        {{ p.name }}
      </li>
    </ul>
    <ul aria-label="配送规则">
      <li
        v-for="(value, key, index) in shippingRules"
        :key="key"
      >
        {{ index + 1 }}. {{ key }}：{{ value }}
      </li>
    </ul>
    <p data-testid="range">
      评分：<span
        v-for="n in 5"
        :key="n"
      >{{ n }}</span>
    </p>
    <ul aria-label="解构">
      <li
        v-for="{ id, name, price } in firstThree"
        :key="id"
      >
        {{ name }}（￥{{ price }}）
      </li>
    </ul>
  </div>
</template>
