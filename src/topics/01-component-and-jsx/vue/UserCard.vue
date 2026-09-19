<script setup lang="ts">
/**
 * 区块一的资料卡组件。对照 react/ProfileCards.tsx 里的 UserCard。
 * - SFC 里组件名推荐 PascalCase（UserCard），模板里写 <UserCard />；只有「写在 HTML 里的模板」（in-DOM template）才必须用 kebab-case，见 react/Example.tsx 附 4（vue/Example.vue 的附里有摘要）。
 * - React 版用 badge 参数接收一段 JSX（JSX 是值）；Vue 的习惯写法是具名插槽 #badge —— 父组件把一段模板交给子组件渲染（插槽细节见 13 题）。
 * - props 的写法细节是 02 题的内容，这里只用最简单的类型声明 + 响应式 props 解构【主流·3.5 起】。
 * - 两张卡是两个独立的组件实例：每张卡的「关注」状态各管各的（React 版同样演示）。
 * - 写样式：静态样式【最常用】写在 <style scoped> 里（create-vue 脚手架生成的组件默认如此；官方风格指南 Essential 要求组件样式有作用域，
 *   「all other components should always be scoped」，scoped、CSS Modules、BEM 都算）；:style 只放依赖数据的值（accent）。React 版对应的是 CSS Modules + style。
 */
import { ref } from 'vue'
import type { User } from '@/shared/types'

const { user, online, accent, highlight = false } = defineProps<{
  user: User
  online: boolean
  accent: string
  highlight?: boolean
}>()

const followed = ref(false)

const ROLE_TEXT: Record<User['role'], string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '访客',
}
</script>

<template>
  <!-- :class 对象语法按条件挂类名，和静态 class 合并；边框颜色取决于 accent，放 :style（Vue 不给数字补 px，要写单位时写成字符串） -->
  <div
    class="card"
    :class="{ vip: highlight }"
    :style="highlight ? { borderColor: accent } : undefined"
  >
    <div class="row">
      <div
        class="avatar"
        :style="{ background: accent }"
      >
        {{ user.name.charAt(0) }}
      </div>
      <div>
        <div class="row">
          <!-- 插值 {{ }} 与 JSX 的 { } 一样只能放单个表达式 -->
          <strong>{{ user.name }}</strong>
          <!-- Vue 模板里 class 就写 class；React 里要写 className -->
          <span class="badge">{{ ROLE_TEXT[user.role] }}</span>
          <slot name="badge" />
        </div>
        <span class="muted">{{ user.email }}</span>
      </div>
    </div>
    <!-- :class 对象语法按条件挂类名；React 里这一步是三元手拼 className 字符串 -->
    <div class="row">
      <p :class="{ 'success-text': online, muted: !online }">
        {{ online ? '● 在线' : '○ 离线' }}
      </p>
      <button
        :class="followed ? 'btn-ghost' : 'btn-primary'"
        @click="followed = !followed"
      >
        {{ followed ? '已关注' : '关注' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 静态样式：scoped 让这些类名只作用于本组件（编译时给元素加 data-v-xxx 属性、给选择器加属性选择器） */
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.vip {
  border-width: 2px;
}
</style>
