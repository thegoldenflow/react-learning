<script setup lang="ts">
/**
 * 区块一：props 的类型、解构与默认值。对照 react/OrderCards.tsx。
 */
import NoteText from './NoteText.vue'
import OrderCard from './OrderCard.vue'
</script>

<template>
  <div class="stack">
    <h3>区块一：props 的类型、解构与默认值</h3>
    <!-- 静态字符串直接写；数字等 JS 值用 v-bind（:amount="1280"）。React 里是：字符串用引号、其余一律花括号 amount={1280}。
         prop 名在 defineProps 里用 camelCase 声明，模板里惯用 kebab-case（order-no），Vue 自动对应；JSX 没有这层转换。 -->
    <OrderCard
      order-no="SO-20260801"
      customer="林小满"
      :amount="1280"
      status="pending"
    />
    <OrderCard
      order-no="SO-20260802"
      customer="陈北洋"
      :amount="5600"
      status="paid"
      :discount="0.15"
    />
    <OrderCard
      order-no="SO-20260803"
      customer="赵四方"
      :amount="899"
      status="cancelled"
    />

    <div class="card stack">
      <p class="muted">
        默认值只对「没传」和「传 undefined」生效；null、空串原样传进去。布尔 prop 不一样：Vue 不传是 false（布尔转型），React 不传是 undefined。
      </p>
      <table>
        <thead>
          <tr>
            <th>父组件的写法</th>
            <th>NoteText 收到的值</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>&lt;NoteText /&gt;</code></td>
            <td><NoteText /></td>
          </tr>
          <tr>
            <td><code>&lt;NoteText :note="undefined" /&gt;</code></td>
            <td><NoteText :note="undefined" /></td>
          </tr>
          <tr>
            <td><code>&lt;NoteText :note="null" /&gt;</code></td>
            <td><NoteText :note="null" /></td>
          </tr>
          <tr>
            <td><code>&lt;NoteText note="" /&gt;</code></td>
            <td><NoteText note="" /></td>
          </tr>
          <tr>
            <td><code>&lt;NoteText emphasis /&gt;</code></td>
            <td><NoteText emphasis /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
