<script setup lang="ts">
/**
 * 区块一的资料卡组件。对照 react/ProfileCards.tsx 里的 UserCard。
 * - SFC 里组件名推荐 PascalCase（UserCard），模板里写 <UserCard />；只有「写在 HTML 里的模板」（in-DOM template）才必须用 kebab-case，见 Example.vue。
 * - React 版用 badge 参数接收一段 JSX（JSX 是值）；Vue 的习惯写法是具名插槽 #badge —— 父组件把一段模板交给子组件渲染（插槽细节见 13 题）。
 * - props 的写法细节是 02 题的内容，这里只用最简单的类型声明 + 响应式 props 解构【主流·3.5 起】。
 * - 两张卡是两个独立的组件实例：每张卡的「关注」状态各管各的（React 版同样演示）。
 */
import { ref, type CSSProperties } from 'vue'
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

// Vue 的 :style 不给数字补 px，要自己写单位（React 写 48 即可）。演示简化：真实项目的样式放在 <style scoped> / CSS Modules / Tailwind 里。
const avatarStyle: CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
}
</script>

<template>
  <!-- :style 绑定对象；条件样式可以直接写三元。React 里是 style={cond ? {...} : undefined} -->
  <div
    class="card"
    :style="highlight ? { borderColor: accent, borderWidth: '2px' } : undefined"
  >
    <div class="row">
      <!-- :style 数组语法合并多个样式对象；React 没有数组语法，用对象展开 {...avatarStyle, background} -->
      <div :style="[avatarStyle, { background: accent }]">
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
