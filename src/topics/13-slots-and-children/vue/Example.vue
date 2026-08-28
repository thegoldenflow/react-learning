<script setup lang="ts">
/**
 * 学习主题：插槽与 children —— React 用「值」组合 UI
 *
 * React 核心概念：
 * - children：写在组件标签之间的内容，作为名为 children 的 prop 传入，类型 ReactNode —— 就是普通 prop，没有魔法
 * - 「具名插槽」不存在专门概念：再声明几个 ReactNode 类型的 props 即可（header={<...>} footer={<...>}）
 * - render prop：值为函数的 prop（renderItem={(user) => <...>}），组件把内部数据交回给使用者决定怎么渲染
 * - 组件组合（composition）是 React 复用 UI 的主要手段
 *
 * Vue 对应概念：
 * - children ≈ 默认 <slot />；header / footer props ≈ 具名插槽 #header / #footer
 * - render prop ≈ 作用域插槽：<slot :user="u" /> + 使用侧 v-slot="{ user }"
 * - React 判空可选的 footer prop ≈ Vue 用 $slots.footer 判断插槽是否传入
 *
 * 最重要的区别：
 * - Vue 的插槽是模板语法特性，插槽内容只能写在组件标签内部；React 的 JSX 是普通 JS 值，
 *   能赋给变量、存进数组、当参数传、从函数返回 ——「UI 即值」让 React 根本不需要「插槽」这个
 *   专门概念，一切用 props 表达。这是两个框架的本质差异，Vue 模板做不到。
 */
import { ref } from 'vue'
import type { User } from '@/shared/types'
// React 版的 Card / UserList 和用例写在同一个 .tsx 里（组件只是函数）；Vue 一文件一组件，须 import
import Card from './Card.vue'
import UserList from './UserList.vue'

const message = ref('')

// 演示数据（不发请求，专注组合本身）—— 与 React 版同一份
const users: User[] = [
  { id: 'u1', name: '张伟', email: 'zhangwei@example.com', role: 'admin' },
  { id: 'u2', name: '李娜', email: 'lina@example.com', role: 'editor' },
  { id: 'u3', name: '王芳', email: 'wangfang@example.com', role: 'viewer' },
]
</script>

<template>
  <div class="stack">
    <!-- 具名插槽 #header / #footer 对应 React 的 header={...} footer={...} props。
         插槽内容的作用域在父组件（编译进父的渲染函数）：按钮能直接改 message ——
         React 的 JSX 闭包引用 setMessage 同理。 -->
    <Card>
      <template #header>
        <strong>订单 SO-1024</strong>
        <span class="badge badge-pending">待支付</span>
      </template>

      <!-- 没被 <template #xx> 包裹的内容进默认插槽，对应 React 的 children -->
      <p>客户：张伟，金额：￥1024.00</p>
      <p v-if="message">
        {{ message }}
      </p>

      <template #footer>
        <button
          class="btn-primary"
          @click="message = '订单 SO-1024 支付成功'"
        >
          去支付
        </button>
        <button
          class="btn-danger"
          @click="message = '订单 SO-1024 已取消'"
        >
          取消订单
        </button>
      </template>
    </Card>

    <!-- 第二张卡片：不给 #footer，Card 里 v-if="$slots.footer" 就不渲染操作区
         （React 版是可选 prop 判空：footer && ...） -->
    <Card>
      <template #header>
        <strong>团队成员</strong>
      </template>

      <p class="muted">
        同一份数据、同一个 UserList，两种渲染 —— 插槽内容说了算：
      </p>
      <!-- 作用域插槽：v-slot="{ user }" 解构拿到 UserList 传回的每项数据。
           React 版是 renderItem={(user) => <>...</>}。
           注意差异：Vue 的插槽内容只能写在 <UserList> 标签内部（模板语法）；
           React 的 renderItem 是普通函数值，可以抽成变量、从别处传进来 —— JSX 是值。 -->
      <UserList
        v-slot="{ user }"
        :users="users"
      >
        {{ user.name }}（{{ user.email }}）<span class="badge">{{ user.role }}</span>
      </UserList>

      <p class="muted">
        精简版（只要名字 —— React 版这里的 renderItem 直接返回字符串）：
      </p>
      <UserList
        v-slot="{ user }"
        :users="users"
      >
        {{ user.name }}
      </UserList>
    </Card>
  </div>
</template>
