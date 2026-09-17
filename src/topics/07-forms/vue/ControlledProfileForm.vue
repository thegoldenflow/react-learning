<script setup lang="ts">
/**
 * 【主线：受控】个人资料表单（React 对照：react/ControlledProfileForm.tsx，字段和校验一致）。
 *
 * v-model 就是 Vue 里的受控写法：输入框显示什么由 form 决定，官方原文
 * 「v-model will ignore the initial value, checked or selected attributes ... treat the current bound JavaScript state
 * as the source of truth」。和 React 的差别：
 * - 不用写 value + onChange + name 分发，v-model 按元素类型自动选属性和事件；
 * - type="number" 的 v-model 自动带 .number：能解析成数字就存 number，清空时是 ''（React 侧 state 存字符串）；
 * - 输入过滤：v-model 不会把被拒绝的输入从 DOM 里改回去，所以手机号改用 :value + @input 手动改回；
 * - 错误信息同样是派生值（computed），聚焦第一个出错字段用 useTemplateRef + TextField 暴露的 focus()。
 */
import { computed, reactive, ref, useId, useTemplateRef } from 'vue'
import type { UserRole } from '@/shared/types'
import TextField from './TextField.vue'

type ContactChannel = 'email' | 'phone'

interface ProfileForm {
  name: string
  phone: string
  /** v-model + type="number"：解析得了是 number，清空时是空串（官方：if the input is empty ... an empty string is returned） */
  age: number | ''
  role: UserRole
  bio: string
  contact: ContactChannel
  subscribe: boolean
}

type FieldErrors = Partial<Record<'name' | 'phone' | 'age', string>>

const ROLE_TEXT: Record<UserRole, string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '只读访客',
}
const ROLE_OPTIONS: UserRole[] = ['admin', 'editor', 'viewer']
const CONTACT_TEXT: Record<ContactChannel, string> = { email: '邮件', phone: '电话' }
const CONTACT_OPTIONS: ContactChannel[] = ['email', 'phone']

const INITIAL_PROFILE: ProfileForm = {
  name: '林小满',
  phone: '',
  age: '',
  role: 'editor',
  bio: '',
  contact: 'email',
  subscribe: true,
}

// React 版是 useState<ProfileForm>(INITIAL_PROFILE)；Vue 用 reactive 包一个副本，v-model 直接改它的属性
const form = reactive<ProfileForm>({ ...INITIAL_PROFILE })
const submitted = ref(false)
const saved = ref<ProfileForm | null>(null)

/** 演示简化：手写校验（与 React 侧相同），生产用 schema 校验，后端再校验一遍 */
function validateProfile(value: ProfileForm): FieldErrors {
  const errors: FieldErrors = {}
  if (value.name.trim() === '') errors.name = '姓名不能为空'
  if (value.contact === 'phone' && value.phone.length !== 11) errors.phone = '选择电话联系时，手机号要填满 11 位'
  if (value.age !== '' && (!Number.isInteger(value.age) || value.age < 1 || value.age > 150)) {
    errors.age = '年龄要是 1–150 之间的整数'
  }
  return errors
}

// 派生值：React 侧在渲染里直接算，Vue 用 computed（带缓存）
const errors = computed<FieldErrors>(() => (submitted.value ? validateProfile(form) : {}))

// 手机号、年龄没有用 TextField，自己调 useId；同一个组件调用两次得到两个不同的 id
const phoneId = useId()
const ageId = useId()

const nameField = useTemplateRef<InstanceType<typeof TextField>>('nameField')
const phoneInput = useTemplateRef<HTMLInputElement>('phoneInput')
const ageInput = useTemplateRef<HTMLInputElement>('ageInput')

/**
 * 输入过滤的 Vue 写法。不能直接用 v-model：非法输入不写进 form 时，form 没变、组件不重新渲染，
 * v-model 也就不会把 DOM 改回去（它只在 beforeUpdate 里写回），字母会留在输入框里。
 * 所以拒绝时手动把 el.value 改回 form.phone。React 的受控输入在事件结束后自动改回。
 */
function onPhoneInput(e: Event) {
  const el = e.target as HTMLInputElement
  if (/^\d{0,11}$/.test(el.value)) {
    form.phone = el.value
  } else {
    el.value = form.phone
  }
}

// React 要手动 e.preventDefault()；模板上的 @submit.prevent 已经做了
function handleSubmit() {
  submitted.value = true
  const nextErrors = validateProfile(form)
  if (nextErrors.name) nameField.value?.focus()
  else if (nextErrors.phone) phoneInput.value?.focus()
  else if (nextErrors.age) ageInput.value?.focus()
  if (Object.keys(nextErrors).length > 0) {
    saved.value = null
    return
  }
  // 展开 reactive 得到一份普通对象快照
  saved.value = { ...form, name: form.name.trim() }
}

function handleReset() {
  Object.assign(form, INITIAL_PROFILE)
  submitted.value = false
  saved.value = null
}
</script>

<template>
  <div class="card stack">
    <h3>区块一：受控表单【主线】—— 个人资料</h3>
    <p class="muted">
      v-model 就是 Vue 的受控写法：输入框显示什么由 form 决定，输入时 v-model 把新值写回 form。
    </p>

    <!-- @submit.prevent：修饰符阻止默认提交；noValidate 关掉浏览器自带的校验气泡，和 React 侧一样 -->
    <form
      class="stack"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <!-- 组件 v-model：TextField 里用 defineModel() 接住。ref="nameField" 拿到的是组件实例 -->
      <TextField
        ref="nameField"
        v-model="form.name"
        label="姓名"
        name="name"
        :error="errors.name"
      />

      <div
        class="stack"
        style="gap: 4px"
      >
        <div class="row">
          <label :for="phoneId">手机号</label>
          <input
            :id="phoneId"
            ref="phoneInput"
            name="phone"
            inputmode="numeric"
            :value="form.phone"
            :aria-invalid="errors.phone ? true : undefined"
            :aria-describedby="`${phoneId}-hint` + (errors.phone ? ` ${phoneId}-error` : '')"
            @input="onPhoneInput"
          >
        </div>
        <p
          :id="`${phoneId}-hint`"
          class="muted"
          style="margin: 0"
        >
          只收数字，最多 11 位。这里用 :value + @input 手动改回，敲字母同样会被弹回
        </p>
        <p
          v-if="errors.phone"
          :id="`${phoneId}-error`"
          class="error-text"
          style="margin: 0"
        >
          {{ errors.phone }}
        </p>
      </div>

      <div
        class="stack"
        style="gap: 4px"
      >
        <div class="row">
          <label :for="ageId">年龄</label>
          <!-- type="number" 的 v-model 自动加 .number 修饰符 -->
          <input
            :id="ageId"
            ref="ageInput"
            v-model="form.age"
            name="age"
            type="number"
            :aria-invalid="errors.age ? true : undefined"
            :aria-describedby="errors.age ? `${ageId}-error` : undefined"
          >
        </div>
        <p
          v-if="errors.age"
          :id="`${ageId}-error`"
          class="error-text"
          style="margin: 0"
        >
          {{ errors.age }}
        </p>
      </div>

      <label class="row">
        角色
        <!-- select 也是 v-model（value + change）。Vue 模板里写 <option selected> 不报错，但 v-model 会忽略它 -->
        <select
          v-model="form.role"
          name="role"
        >
          <option
            v-for="role in ROLE_OPTIONS"
            :key="role"
            :value="role"
          >
            {{ ROLE_TEXT[role] }}
          </option>
        </select>
      </label>

      <label
        class="stack"
        style="gap: 4px"
      >
        简介
        <!-- .trim 修饰符：写回 form 之前先去掉首尾空格（React 没有修饰符，要在 onChange 或提交时自己 trim） -->
        <textarea
          v-model.trim="form.bio"
          name="bio"
          rows="2"
          placeholder="选填"
        />
      </label>

      <fieldset style="border: none; padding: 0; margin: 0">
        <legend style="padding: 0">
          联系方式
        </legend>
        <div class="row">
          <label
            v-for="channel in CONTACT_OPTIONS"
            :key="channel"
            class="row"
            style="gap: 4px"
          >
            <!-- radio 的 v-model 是 checked + change；React 写 checked={form.contact === channel} -->
            <input
              v-model="form.contact"
              type="radio"
              name="contact"
              :value="channel"
            >
            {{ CONTACT_TEXT[channel] }}
          </label>
        </div>
      </fieldset>

      <label class="row">
        <input
          v-model="form.subscribe"
          type="checkbox"
          name="subscribe"
        >
        订阅通知
      </label>

      <label class="row">
        账号 ID
        <!-- Vue 里只写 value 不写事件不会报错；本来就只读，同样显式写 readonly -->
        <input
          value="U-2026-0007"
          readonly
        >
      </label>

      <div class="row">
        <button
          type="submit"
          class="btn-primary"
        >
          保存
        </button>
        <button
          type="button"
          @click="handleReset"
        >
          重置
        </button>
      </div>
    </form>

    <p class="muted">
      实时 state：<code style="word-break: break-all">{{ JSON.stringify(form) }}</code>
    </p>

    <div
      v-if="saved !== null"
      class="stack"
      style="gap: 4px"
    >
      <p
        class="success-text"
        style="margin: 0"
      >
        保存成功（演示：只存在本地 state）
      </p>
      <p style="margin: 0">
        {{ saved.name }} · {{ ROLE_TEXT[saved.role] }} · 年龄 {{ saved.age === '' ? '未填' : saved.age }} ·
        {{ CONTACT_TEXT[saved.contact] }}联系 · {{ saved.subscribe ? '已订阅' : '未订阅' }}
      </p>
    </div>
  </div>
</template>
