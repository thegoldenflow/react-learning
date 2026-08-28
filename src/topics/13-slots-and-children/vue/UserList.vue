<script setup lang="ts">
/**
 * UserList（对照 React 版的 render prop）：
 * 作用域插槽 <slot :user="u" /> 把组件内部的数据交回给使用者，使用侧 v-slot="{ user }" 接收。
 * React 版是 renderItem: (user: User) => ReactNode —— 「值为函数的 prop」，本质相同：
 * 数据在组件内部，渲染方式由外部注入。
 */
import type { User } from '@/shared/types'

defineProps<{ users: User[] }>()
</script>

<template>
  <ul>
    <li
      v-for="u in users"
      :key="u.id"
    >
      <!-- :user="u" 把数据「传回」插槽内容 —— React 里这一步是函数调用 renderItem(u) -->
      <slot :user="u" />
    </li>
  </ul>
</template>
