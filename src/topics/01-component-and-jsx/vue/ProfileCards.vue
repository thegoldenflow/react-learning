<script setup lang="ts">
/**
 * 区块一 Vue 对照：资料卡。对照 react/ProfileCards.tsx。
 * 同一个 UserCard 用两次，各自是独立的组件实例；VIP 徽章通过具名插槽 #badge 传进去（React 版是把 JSX 存进变量再当参数传）。
 * Vue 的模板片段不能直接存进变量；要拿到「可以存、可以传」的 UI 值，得写渲染函数：h() 返回的 vnode 和 JSX 一样是普通对象（Vue 项目里少用，见 react/Example.tsx 附 2）。
 */
import type { User } from '@/shared/types'
import UserCard from './UserCard.vue'

// 演示简化：数据写成文件内常量（不是响应式数据，本题只讲渲染）
const vipUser: User = { id: 'u1', name: '林小满', email: 'linxiaoman@example.com', role: 'admin' }
const normalUser: User = { id: 'u2', name: '陈北洋', email: 'chenbeiyang@example.com', role: 'viewer' }
</script>

<template>
  <!-- Vue 3 的组件可以有多个根节点，不需要 Fragment（多根时透传 attrs 要自己用 $attrs 指定，否则运行时警告） -->
  <!-- 模板用 HTML 注释；React 的 JSX 里要写成 {/* ... */} -->
  <p class="muted">
    区块一：同一个 UserCard 组件用了两次；VIP 徽章通过具名插槽 #badge 传进去。
  </p>
  <UserCard
    :user="vipUser"
    online
    accent="#d4a017"
    highlight
  >
    <template #badge>
      <span class="badge badge-paid">VIP</span>
    </template>
  </UserCard>
  <UserCard
    :user="normalUser"
    :online="false"
    accent="#5b8def"
  />
</template>
