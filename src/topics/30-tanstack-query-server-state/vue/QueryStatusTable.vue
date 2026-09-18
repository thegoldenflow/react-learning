<script setup lang="ts">
/**
 * 把查询 / mutation 的状态字段画成一张小表（对应 React 侧 OrdersListPanel.tsx 里的 QueryStatusTable）。
 * 父组件传进来的是解构后的顶层 ref 在模板里解包出来的普通值，所以这里拿到的就是 string / boolean。
 */
defineProps<{
  label: string
  fields: Record<string, string | boolean>
}>()
</script>

<template>
  <table :aria-label="label">
    <tbody>
      <tr>
        <th
          v-for="(_, name) in fields"
          :key="name"
        >
          <code>{{ name }}</code>
        </th>
      </tr>
      <tr>
        <td
          v-for="(value, name) in fields"
          :key="name"
          :data-field="name"
        >
          {{ String(value) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
