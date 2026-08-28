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
import { useState } from 'react'
// verbatimModuleSyntax：只作类型使用的导入必须写 import type
import type { ChangeEvent, FormEvent } from 'react'
import type { UserRole } from '@/shared/types'

/** 整个表单收进一个对象 —— 字段不多时工业界最常见的组织方式 */
interface ProfileForm {
  name: string
  email: string
  role: UserRole
  subscribe: boolean
}

/** 角色的中文文案 + 下拉选项（select 用它渲染 option） */
const ROLE_TEXT: Record<UserRole, string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '只读访客',
}
const ROLE_OPTIONS: UserRole[] = ['admin', 'editor', 'viewer']

const INITIAL_FORM: ProfileForm = {
  name: '林小满',
  email: 'xiaoman@example.com',
  role: 'editor',
  subscribe: true,
}

export default function Example() {
  // 表单状态：一个对象 state；Vue 对照版是 reactive<ProfileForm>({ ... })
  const [form, setForm] = useState<ProfileForm>(INITIAL_FORM)
  // 校验错误信息（空串表示无错误）
  const [error, setError] = useState('')
  // 提交成功后的保存结果快照，null 表示还没保存过
  const [saved, setSaved] = useState<ProfileForm | null>(null)

  /**
   * 工业界惯用的「通用 handleChange」：所有字段共用一个处理函数，
   * 靠 input 的 name 属性决定更新哪个字段——不必为每个字段写一个 setter。
   * Vue 里这个函数整个不需要存在：v-model 直接绑到 form.xxx，没有 name 分发这回事。
   */
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    // 面试考点：checkbox 的值不在 value 里，而在 checked 里（DOM 的设计，两个框架都绕不开；
    // Vue 的 v-model 帮你分辨了这件事，React 里要自己判断 type === 'checkbox'）
    const nextValue =
      e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
        ? e.target.checked
        : value
    // 展开旧对象 + 计算属性名 [name] 覆盖单个字段——不可变更新（03 题的延续）。
    // 注意：TS 无法校验「name 字符串」与「字段类型」是否匹配，这是该模式的固有代价
    // （react-hook-form 等库用泛型注册字段解决了它），name 拼写务必与 state 字段名一致。
    setForm(prev => ({ ...prev, [name]: nextValue }))
  }

  /**
   * 提交：onSubmit 挂在 <form> 上（而不是按钮的 onClick），这样回车提交也能触发。
   * 必须手动 e.preventDefault()，否则浏览器会按传统表单方式刷新页面。
   * Vue 用修饰符 @submit.prevent 声明式完成同一件事——React 没有修饰符系统，全靠手写 JS。
   */
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // 简单校验：姓名必填（复杂校验工业界交给 react-hook-form + zod 等，本示例手写足矣）
    if (form.name.trim() === '') {
      setError('姓名不能为空')
      setSaved(null)
      return
    }
    setError('')
    setSaved({ ...form, name: form.name.trim() })
  }

  return (
    <div className="stack">
      <form className="card stack" onSubmit={handleSubmit}>
        <label className="row">
          姓名
          {/*
            受控组件三要素：value 来自 state、onChange 写回 state、name 告诉 handleChange 改哪个字段。
            每敲一个字符：onChange → setState → Example 整个重新执行 → 新 value 渲染回输入框。
            输入框内容永远等于 state 内容，state 是唯一数据源（single source of truth）。
            Vue 里这一整套就是一句 v-model="form.name"——但那只是 :value + @input 的语法糖。
          */}
          <input name="name" value={form.name} onChange={handleChange} placeholder="必填" />
        </label>
        <label className="row">
          邮箱
          <input name="email" type="email" value={form.email} onChange={handleChange} />
        </label>
        <label className="row">
          角色
          {/* select 同样受控：value 统一挂在 <select> 上（React 刻意统一了 API；
              原生 DOM 其实靠 option 的 selected 属性）。Vue 里 select 也是同一个 v-model */}
          <select name="role" value={form.role} onChange={handleChange}>
            {ROLE_OPTIONS.map(role => (
              <option key={role} value={role}>
                {ROLE_TEXT[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="row">
          {/* checkbox 绑定的是 checked 而不是 value；读值用 e.target.checked */}
          <input name="subscribe" type="checkbox" checked={form.subscribe} onChange={handleChange} />
          订阅通知
        </label>

        {error !== '' && <p className="error-text">{error}</p>}
        <div className="row">
          <button type="submit" className="btn-primary">
            保存
          </button>
        </div>
      </form>

      {/* 受控的直接好处：state 随按键实时更新，任何地方都能立刻消费它 */}
      <p className="muted">实时 state：{JSON.stringify(form)}</p>

      {saved !== null && (
        <div className="card">
          <p className="success-text">保存成功！</p>
          <p>姓名：{saved.name}</p>
          <p>邮箱：{saved.email === '' ? '（未填写）' : saved.email}</p>
          <p>
            角色：<span className="badge">{ROLE_TEXT[saved.role]}</span>
          </p>
          <p>订阅通知：{saved.subscribe ? '已订阅' : '未订阅'}</p>
        </div>
      )}
    </div>
  )
}
