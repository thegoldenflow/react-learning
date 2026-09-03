<script setup lang="ts">
/**
 * 学习主题：组件与 JSX（没有模板 DSL，一切都是 JavaScript）
 *
 * React 核心概念：
 * - 函数组件：组件就是「返回 JSX 的普通函数」，UI = f(props/state)
 * - JSX 是表达式：编译成函数调用，可以赋值给变量、当参数传、被 return；
 *   一次只能返回单个根节点，需要多个平级节点时用 <>...</>（Fragment）
 * - 属性写 camelCase：class → className、for → htmlFor、tabindex → tabIndex
 * - 花括号 { } 里放任意 JS 表达式（取值、三元、函数调用、模板字符串），不能放 if/for 语句
 * - style={{ }} 接收对象：属性名 camelCase，纯数字默认按 px 处理（opacity / zIndex / fontWeight 等无单位属性除外）
 *
 * Vue 对应概念：
 * - SFC 单文件组件：<template> + <script setup> + <style scoped>，模板是专门的 DSL
 * - 插值 {{ }}：也只能放表达式，这一点和 JSX 花括号一致
 * - :class 有对象/数组语法，:style 有对象/数组语法（编译器内置支持）
 *
 * 最重要的区别：
 * - Vue 用模板 DSL + 指令（v-bind/v-if/v-for）描述 UI，框架提供专用语法；
 *   React 没有任何模板语法——拼 class 用字符串、条件用三元、循环用 map、
 *   合并样式用对象展开。学 React 的本质是学会「用纯 JavaScript 表达 UI」。
 */
import type { User } from '@/shared/types'

// 与 React 版同款对象，取值在模板插值 {{ }} 里完成
const ROLE_TEXT: Record<User['role'], string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '访客',
}

// 数据同样用文件内常量（不是响应式数据，本题只讲渲染）
const vipUser: User = { id: 'u1', name: '林小满', email: 'linxiaoman@example.com', role: 'admin' }
const normalUser: User = { id: 'u2', name: '陈北洋', email: 'chenbeiyang@example.com', role: 'viewer' }
const vipOnline = true
const normalOnline = false

// React 里这一步是 CSSProperties 对象 + style={{ }}。
// 注意：Vue 的 :style 不会给数字自动加 px，所以这里要写 '48px'（React 写 48 即可）。
const avatarStyle = {
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
  <div class="stack">
    <p class="muted">
      用户资料卡：上为 VIP 卡，下为普通卡，数据来自文件内常量
    </p>

    <!-- Vue 模板用 HTML 注释；React 的 JSX 里要写成 {/* ... */}（花括号包 JS 注释） -->

    <!-- ===== VIP 卡片 ===== -->
    <!-- :style 对象语法对应 React 的 style={{ }}；数字要自己带单位（'2px'） -->
    <div
      class="card"
      :style="{ borderColor: '#d4a017', borderWidth: '2px' }"
    >
      <div class="row">
        <!-- :style 数组语法合并多个样式对象；React 没有数组语法，用对象展开 {...avatarStyle, background} -->
        <div :style="[avatarStyle, { background: '#d4a017' }]">
          {{ vipUser.name.charAt(0) }}
        </div>
        <div>
          <div class="row">
            <!-- 插值 {{ }} 与 JSX 的 { } 一样只能放表达式 -->
            <strong>{{ vipUser.name }}</strong>
            <!-- Vue 模板里 class 就写 class；React 里因为 class 是 JS 保留字要写 className -->
            <span class="badge">{{ ROLE_TEXT[vipUser.role] }}</span>
            <!-- React 版把 VIP 徽章存进了变量 vipTag 再插入（JSX 是表达式）；
                 Vue 模板片段无法存进变量，这里直接写——没有一一对应关系 -->
            <span class="badge badge-paid">VIP</span>
          </div>
          <span class="muted">{{ vipUser.email }}</span>
        </div>
      </div>
      <!-- :class 对象语法按条件挂类名；React 里这一步是三元手拼 className 字符串 -->
      <p :class="{ 'success-text': vipOnline, muted: !vipOnline }">
        {{ vipOnline ? '● 在线' : '○ 离线' }}
      </p>
    </div>

    <!-- ===== 普通卡片 ===== -->
    <div class="card">
      <div class="row">
        <div :style="[avatarStyle, { background: '#5b8def' }]">
          {{ normalUser.name.charAt(0) }}
        </div>
        <div>
          <div class="row">
            <strong>{{ normalUser.name }}</strong>
            <span class="badge">{{ ROLE_TEXT[normalUser.role] }}</span>
          </div>
          <span class="muted">{{ normalUser.email }}</span>
        </div>
      </div>
      <p :class="{ 'success-text': normalOnline, muted: !normalOnline }">
        {{ normalOnline ? '● 在线' : '○ 离线' }}
      </p>
    </div>
  </div>
</template>
