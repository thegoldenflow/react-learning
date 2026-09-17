/**
 * 【主线：受控】个人资料表单。每个字段的值都来自 state，每次输入都走一遍 onChange → setState → 重新渲染。
 *
 * 本文件演示：
 * - 一个对象 state + 按 name 分发的通用 handleChange + 函数式不可变更新（03 / 21 题）；
 * - 各种元素的受控写法：文本、type="number"、<select value>、<textarea value>、radio / checkbox 用 checked；
 * - 输入过滤：onChange 不把非法输入写进 state，事件结束后 React 把 DOM 改回 state（手机号只收数字）；
 * - 校验结果是派生值（09 题）：点过一次「保存」之后，错误信息随输入实时更新，不另存一份 state；
 * - 无障碍：TextField 用 useId 关联 label 和错误信息；提交失败时把焦点移到第一个出错的字段；
 * - 只读字段写 readOnly，不要只给 value 不给 onChange。
 *
 * Vue 对照：vue/ControlledProfileForm.vue（v-model 版，同样的字段和校验）。
 */
import { useRef, useState, type ChangeEvent, type SubmitEvent } from 'react'
import type { UserRole } from '@/shared/types'
import { TextField } from './TextField'

type ContactChannel = 'email' | 'phone'

/** 整个表单收进一个对象 —— 字段不多时最常见的组织方式 */
export interface ProfileForm {
  name: string
  /** 只存数字，最多 11 位 */
  phone: string
  /**
   * 年龄输入框是 type="number"，但 e.target.value 仍然是字符串。
   * 用字符串存才能表示「还没填」（空串）；提交时再 Number() 转换。
   * 浏览器对 "12." 这类半截输入的处理见 19 题。
   */
  age: string
  role: UserRole
  bio: string
  contact: ContactChannel
  subscribe: boolean
}

/** 保存下来的结果：年龄已经转成数字，没填是 null */
type SavedProfile = Omit<ProfileForm, 'age'> & { age: number | null }

type FieldErrors = Partial<Record<'name' | 'phone' | 'age', string>>

const ROLE_TEXT: Record<UserRole, string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '只读访客',
}
const ROLE_OPTIONS: UserRole[] = ['admin', 'editor', 'viewer']

const CONTACT_TEXT: Record<ContactChannel, string> = {
  email: '邮件',
  phone: '电话',
}
const CONTACT_OPTIONS: ContactChannel[] = ['email', 'phone']

/**
 * 受控字段的初始值都是确定的字符串 / 布尔值，不能是 undefined：
 * value 先是 undefined（React 当成非受控）后来变成字符串（变成受控），开发环境会报
 * 「A component is changing an uncontrolled input to be controlled」（Example.test.tsx 有断言）。
 */
const INITIAL_PROFILE: ProfileForm = {
  name: '林小满',
  phone: '',
  age: '',
  role: 'editor',
  bio: '',
  contact: 'email',
  subscribe: true,
}

/** 演示简化：手写 if 校验。生产里用 schema（如 zod）统一描述规则，而且后端要再校验一遍（35 题，待新增） */
function validateProfile(form: ProfileForm): FieldErrors {
  const errors: FieldErrors = {}
  if (form.name.trim() === '') errors.name = '姓名不能为空'
  if (form.contact === 'phone' && form.phone.length !== 11) errors.phone = '选择电话联系时，手机号要填满 11 位'
  if (form.age !== '') {
    const age = Number(form.age)
    if (!Number.isInteger(age) || age < 1 || age > 150) errors.age = '年龄要是 1–150 之间的整数'
  }
  return errors
}

export function ControlledProfileForm() {
  const [form, setForm] = useState<ProfileForm>(INITIAL_PROFILE)
  // 点过「保存」之后才开始显示错误
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState<SavedProfile | null>(null)

  // 错误信息是派生值：每次渲染从 form 算出来，不用 useState 再存一份，也就不会和 form 对不上（09 题）
  const errors = submitted ? validateProfile(form) : {}

  // React 19：ref 作为普通 prop 传给 TextField，拿到的是它里面的 <input>（提交失败时聚焦用）
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const ageRef = useRef<HTMLInputElement>(null)

  /**
   * 通用 handleChange：所有字段共用一个处理函数，靠 name 属性决定更新哪个字段。
   * Vue 里这个函数不需要存在：v-model 直接绑到 form.xxx。
   */
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    // checkbox 的值在 checked 上，不在 value 上；radio 的 value 就是选项自己的值，照常读 value
    const nextValue = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : value
    // 展开旧对象 + 计算属性名 [name] 覆盖一个字段（不可变更新，03 / 21 题）。
    // 代价：TS 检查不出 name 字符串和字段类型是否匹配，name 必须和 ProfileForm 的键一致。
    setForm((prev) => ({ ...prev, [name]: nextValue }))
  }

  /**
   * 输入过滤：非法输入直接不写进 state。
   * 这时 state 没变，但 DOM 里已经多了一个字母 —— React 在这次事件处理结束后，会把输入框的值改回 props 里的 value
   * （react-dom 19.2.8 的 batchedUpdates 结束时调用 restoreStateOfTarget），用户看到的就是「字母被弹回去了」。
   * 这正是「受控」的含义：「React will force the input to always have the value you passed」。
   * Vue 的 v-model 不会这样做，写法差异见 vue/InputEventLab.vue。
   *
   * 两个限制（官方 Troubleshooting「My input caret jumps to the beginning on every keystroke」）：
   * - 接受的输入要同步地原样写进 state（e.target.value）。放进 setTimeout / await 之后再 set，
   *   或者写成别的值（例如 toUpperCase()），光标会乱跳；
   * - 被弹回时 React 重新设置了 value，光标会跳到末尾（2026-09-17 在 Chrome 实测：在「1380」的第 1 位后敲字母，
   *   值还是 1380，光标到了最后；敲数字则光标正常停在插入处）。所以生产里的金额、分段手机号这类格式化输入，
   *   通常交给输入掩码组件，或者只在失焦 / 提交时格式化。
   */
  function handlePhoneChange(e: ChangeEvent<HTMLInputElement>) {
    const { value } = e.target
    if (!/^\d{0,11}$/.test(value)) return
    setForm((prev) => ({ ...prev, phone: value }))
  }

  /**
   * onSubmit 挂在 <form> 上，而不是按钮的 onClick：在输入框里按回车、点 type="submit" 的按钮都会触发。
   * 必须 e.preventDefault()，否则浏览器按传统方式提交表单并刷新页面。Vue 写 @submit.prevent。
   * 事件类型用 SubmitEvent<HTMLFormElement>：@types/react 19.2 已把 FormEvent 标成 @deprecated（28 题）。
   */
  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
    const nextErrors = validateProfile(form)
    // 焦点移到第一个出错的字段（顺序和页面一致），键盘和读屏用户能直接看到出了什么错
    const firstInvalid = nextErrors.name ? nameRef : nextErrors.phone ? phoneRef : nextErrors.age ? ageRef : null
    if (firstInvalid) {
      firstInvalid.current?.focus()
      setSaved(null)
      return
    }
    // 提交中的 loading、防重复、接口失败提示在 19 题；React 19 的 <form action> 写法在 31 题（待新增）
    setSaved({ ...form, name: form.name.trim(), age: form.age === '' ? null : Number(form.age) })
  }

  function handleReset() {
    setForm(INITIAL_PROFILE)
    setSubmitted(false)
    setSaved(null)
  }

  return (
    <div className="card stack">
      <h3>区块一：受控表单【主线】—— 个人资料</h3>
      <p className="muted">
        每个输入框的值都来自 state。每输入一个字符：onChange → setForm → 组件重新渲染 → 新的 value 写回输入框。
      </p>

      {/* noValidate：校验和错误提示由我们自己做，关掉浏览器自带的校验气泡，免得两套提示打架 */}
      <form className="stack" noValidate onSubmit={handleSubmit}>
        <TextField ref={nameRef} label="姓名" name="name" value={form.name} onChange={handleChange} error={errors.name} />

        <TextField
          ref={phoneRef}
          label="手机号"
          name="phone"
          value={form.phone}
          onChange={handlePhoneChange}
          inputMode="numeric"
          hint="只收数字，最多 11 位。敲个字母试试：字母会被弹回去"
          error={errors.phone}
        />

        <TextField
          ref={ageRef}
          label="年龄"
          name="age"
          type="number"
          value={form.age}
          onChange={handleChange}
          hint={'选填。type="number" 的 value 也是字符串，提交时再转成数字'}
          error={errors.age}
        />

        <label className="row">
          角色
          {/* <select value> 受控：选中项由 <select> 的 value 决定。
              React 不支持给 <option> 写 selected（官方：「passing a selected attribute to <option> is not supported」）；
              多选时写 multiple，value 是字符串数组。Vue 同样是 v-model 绑在 <select> 上。 */}
          <select name="role" value={form.role} onChange={handleChange}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {ROLE_TEXT[role]}
              </option>
            ))}
          </select>
        </label>

        <label className="stack" style={{ gap: 4 }}>
          简介
          {/* <textarea value> 受控；React 不支持把初始文字写成 <textarea>children</textarea>，
              受控用 value，非受控用 defaultValue */}
          <textarea name="bio" rows={2} value={form.bio} onChange={handleChange} placeholder="选填" />
        </label>

        {/* 一组 radio：fieldset + legend 给这组选项一个名字（读屏软件会读出「联系方式」）。
            每个 radio 用 checked={当前值 === 选项值}，同一个 name 让浏览器知道它们是一组 */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ padding: 0 }}>联系方式</legend>
          <div className="row">
            {CONTACT_OPTIONS.map((channel) => (
              <label key={channel} className="row" style={{ gap: 4 }}>
                <input
                  type="radio"
                  name="contact"
                  value={channel}
                  checked={form.contact === channel}
                  onChange={handleChange}
                />
                {CONTACT_TEXT[channel]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="row">
          {/* checkbox 受控用 checked，不是 value；读值用 e.target.checked */}
          <input type="checkbox" name="subscribe" checked={form.subscribe} onChange={handleChange} />
          订阅通知
        </label>

        <label className="row">
          账号 ID
          {/* 只给 value 不给 onChange，开发环境会报「You provided a `value` prop to a form field without an
              `onChange` handler」，而且输入框打不进字。本来就要只读时，显式写 readOnly，报错随之消失。 */}
          <input value="U-2026-0007" readOnly />
        </label>

        <div className="row">
          <button type="submit" className="btn-primary">
            保存
          </button>
          {/* <form> 里的 <button> 默认 type="submit"，普通按钮必须写 type="button"，否则点了会提交表单 */}
          <button type="button" onClick={handleReset}>
            重置
          </button>
        </div>
      </form>

      {/* 受控的直接好处：state 随输入实时更新，渲染里随时能用它（联动、实时校验、按内容禁用按钮） */}
      <p className="muted">
        实时 state：<code style={{ wordBreak: 'break-all' }}>{JSON.stringify(form)}</code>
      </p>

      {saved !== null && (
        <div className="stack" style={{ gap: 4 }}>
          <p className="success-text" style={{ margin: 0 }}>
            保存成功（演示：只存在本地 state）
          </p>
          <p style={{ margin: 0 }}>
            {saved.name} · {ROLE_TEXT[saved.role]} · 年龄 {saved.age ?? '未填'} · {CONTACT_TEXT[saved.contact]}联系 ·
            {saved.subscribe ? ' 已订阅' : ' 未订阅'}
          </p>
        </div>
      )}
    </div>
  )
}
