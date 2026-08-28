<script setup lang="ts">
/**
 * 学习主题：表单处理（受控组件 vs v-model）
 *
 * React 核心概念：
 * - 受控组件：value={state} + onChange={更新 state}，输入框显示什么完全由 state 决定；
 *   每次按键都 setState → 组件重渲染 → 新 value 写回输入框，这正是单向数据流的体现
 * - checkbox 是例外：绑定 checked，取值用 e.target.checked（不是 value）
 * - 表单状态惯用「一个对象 state」：一个 handleChange 按 input 的 name 分发，
 *   用展开语法不可变更新 setForm(prev => ({ ...prev, [name]: value }))
 * - 提交用 <form onSubmit>，必须手动 e.preventDefault() 阻止浏览器默认的刷新式提交
 * - 工业界复杂表单（校验、性能、动态字段）常用 react-hook-form，本示例不引入
 *
 * Vue 对应概念：
 * - v-model="form.name" 一个指令完成绑定；text / select / checkbox 全是同一个 v-model
 * - @submit.prevent 用修饰符声明式阻止默认行为
 * - 表单对象用 reactive 包住，直接改属性即可，无需展开复制
 * - 复杂表单 Vue 生态常用 VeeValidate / FormKit，定位类似 react-hook-form（同样不引入）
 *
 * 最重要的区别：
 * - v-model 只是 :value + @input 的语法糖，本质仍是「值下行、事件上行」；
 *   React 没有这层语法糖，value 和 onChange 必须手写——没有一一对应关系。
 *   这是刻意设计：数据怎么流动，代码里必须显式可见
 * - React 每次按键都会重新执行整个组件函数（重渲染），这是正常且廉价的，不要恐慌
 */
import { reactive, ref } from 'vue'
import type { UserRole } from '@/shared/types'

interface ProfileForm {
  name: string
  email: string
  role: UserRole
  subscribe: boolean
}

const ROLE_TEXT: Record<UserRole, string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '只读访客',
}
const ROLE_OPTIONS: UserRole[] = ['admin', 'editor', 'viewer']

// React 版是 useState<ProfileForm>(INITIAL_FORM)；Vue 用 reactive 包住整个表单对象，
// v-model 直接读写它的属性，改了就触发更新，不需要展开复制出新对象
const form = reactive<ProfileForm>({
  name: '林小满',
  email: 'xiaoman@example.com',
  role: 'editor',
  subscribe: true,
})
const error = ref('')
const saved = ref<ProfileForm | null>(null)

// React 版这里还有一个「通用 handleChange」：按 input 的 name 分发字段、
// 手动区分 checkbox 的 checked——Vue 的 v-model 直接绑到 form.xxx，这个函数整个不需要存在。

// React 里提交处理要手动 e.preventDefault()；模板上的 @submit.prevent 已经替我们做了
function handleSubmit() {
  // 简单校验：姓名必填（复杂校验 Vue 生态交给 VeeValidate 等，本示例手写足矣）
  if (form.name.trim() === '') {
    error.value = '姓名不能为空'
    saved.value = null
    return
  }
  error.value = ''
  // 展开 reactive 对象得到一份普通快照；React 版同样是展开：setSaved({ ...form, name: form.name.trim() })
  saved.value = { ...form, name: form.name.trim() }
}
</script>

<template>
  <div class="stack">
    <!-- @submit.prevent：修饰符阻止默认刷新；React 里是 onSubmit + 手动 e.preventDefault() -->
    <form
      class="card stack"
      @submit.prevent="handleSubmit"
    >
      <label class="row">
        姓名
        <!-- v-model 一句顶 React 的 value + onChange + name 三件套；
             但它只是 :value + @input 的语法糖，React 没有这层糖，没有一一对应关系 -->
        <input
          v-model="form.name"
          placeholder="必填"
        >
      </label>
      <label class="row">
        邮箱
        <input
          v-model="form.email"
          type="email"
        >
      </label>
      <label class="row">
        角色
        <!-- select 也是同一个 v-model；React 里是把 value 统一挂到 <select> 上 + onChange -->
        <select v-model="form.role">
          <option
            v-for="role in ROLE_OPTIONS"
            :key="role"
            :value="role"
          >
            {{ ROLE_TEXT[role] }}
          </option>
        </select>
      </label>
      <label class="row">
        <!-- checkbox 依然是 v-model，Vue 自动改绑到 checked；
             React 里要自己写 checked={...}，读值用 e.target.checked -->
        <input
          v-model="form.subscribe"
          type="checkbox"
        >
        订阅通知
      </label>

      <p
        v-if="error !== ''"
        class="error-text"
      >
        {{ error }}
      </p>
      <div class="row">
        <button
          type="submit"
          class="btn-primary"
        >
          保存
        </button>
      </div>
    </form>

    <!-- 和 React 一样 state 随按键实时更新；不同的是 Vue 不重跑整个组件，只更新这一行文本 -->
    <p class="muted">
      实时 state：{{ JSON.stringify(form) }}
    </p>

    <div
      v-if="saved !== null"
      class="card"
    >
      <p class="success-text">
        保存成功！
      </p>
      <p>姓名：{{ saved.name }}</p>
      <p>邮箱：{{ saved.email === '' ? '（未填写）' : saved.email }}</p>
      <p>
        角色：<span class="badge">{{ ROLE_TEXT[saved.role] }}</span>
      </p>
      <p>订阅通知：{{ saved.subscribe ? '已订阅' : '未订阅' }}</p>
    </div>
  </div>
</template>
