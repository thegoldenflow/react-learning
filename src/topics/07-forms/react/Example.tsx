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
 * - 非受控组件：用 defaultValue / defaultChecked 给「初始值」，之后值由 DOM 自己保管；
 *   React 全程不知道用户敲了什么，也就不会因为敲键盘而重渲染
 * - 非受控的两种取值方式：提交时 new FormData(e.currentTarget) 一次性读全部字段（每个 input 必须有 name），
 *   或用 useRef<HTMLInputElement> 读 ref.current.value 做单点取值
 * - 「受控 vs 非受控怎么选」是中文面试标配题：需要实时校验 / 联动 / 格式化 / 按内容禁用提交按钮 → 受控；
 *   字段多、只关心提交结果、要接入非 React 的第三方 DOM 组件、不想每次按键都重渲染 → 非受控
 * - react-hook-form 性能好的原因正是内部走非受控 + ref 注册，输入时根本不 setState（面试常问）
 * - React 19 的 form actions（<form action={fn}>）会直接把 FormData 交给你，底层就是这里的非受控取值；
 *   本示例只写原生 onSubmit 版（19 题提到过 useActionState，但那里用的是手写 submitting 的基础写法，
 *   本项目没有实现 form actions）
 *
 * Vue 对应概念：
 * - v-model="form.name" 一个指令完成绑定；text / select / checkbox 全是同一个 v-model
 * - @submit.prevent 用修饰符声明式阻止默认行为
 * - 表单对象用 reactive 包住，直接改属性即可，无需展开复制
 * - 复杂表单 Vue 生态常用 VeeValidate / FormKit，定位类似 react-hook-form（同样不引入）
 * - 「受控 vs 非受控」这道二分题在 Vue 里基本不存在：v-model 太顺手，输入也不会重跑整个组件，
 *   没有「为了性能改用非受控」的动机 —— 没有一一对应关系
 * - Vue 也没有 defaultValue 这个 prop：要「只给初始值」就写一个静态 value 属性；取 DOM 原始值同样可以
 *   用模板 ref 读 el.value，或在 @submit.prevent 里 new FormData(e.target as HTMLFormElement)
 *
 * 最重要的区别：
 * - v-model 只是 :value + @input 的语法糖，本质仍是「值下行、事件上行」；
 *   React 没有这层语法糖，value 和 onChange 必须手写——没有一一对应关系。
 *   这是刻意设计：数据怎么流动，代码里必须显式可见
 * - React 每次按键都会重新执行整个组件函数（重渲染），这是正常且廉价的，不要恐慌
 * - 坑一（Vue 老手必踩）：defaultValue 只是「初始值」，用户一旦碰过输入框（HTML 的 dirty value flag 置位），
 *   之后这个变量再怎么变，输入框都纹丝不动 —— 这跟 Vue 里「改个响应式值输入框就跟着变」的直觉完全相反。
 *   想让新默认值无条件生效，工业界做法是给表单换一个 key 强制重新挂载，或者干脆改用受控
 * - 坑二：受控的 value 不配 onChange，输入框会变成只读（React 还会在控制台警告）；真想只读就显式写 readOnly。
 *   Vue 侧形似的写法是 :value 不配 @input，但表现正好相反：它是「持续绑定」，绑定值一变会把用户输入冲掉
 */
import { useRef, useState } from 'react'
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

/* ============ 以下是新增的「非受控写法」对照区块 ============ */

/** 非受控小表单最终收集到的字段 —— 注意这里没有「输入过程中的值」，只有提交那一刻的快照 */
interface QuickContact {
  name: string
  email: string
  subscribe: boolean
}

/** 「换默认值」小实验用的候选姓名 */
const DEFAULT_NAME_POOL = ['周未名', '陈阿四', '孙小圣']

/**
 * FormData.get() 的返回类型是 string | File | null：file input 给的是 File，字段不存在时给 null。
 * 所以必须先收窄再用 —— 直接写 String(value) 在遇到文件时会得到 "[object File]"，是个容易忽略的坑。
 */
function readText(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * 非受控组件（uncontrolled component）—— 中文面试标配题「受控 vs 非受控」的另一半。
 *
 * 受控：state 是唯一数据源。每敲一个字符 → onChange → setState → 组件函数整个重跑 → 新 value 写回 DOM。
 * 非受控：值由 DOM 节点自己保管，React 全程不知道用户敲了什么，也就不会因为敲键盘而重渲染；
 *         只有在你主动去读的那一刻（提交时的 FormData，或 ref.current.value）才取一次值。
 *
 * 怎么选（面试就答这个）：
 * - 用受控：需要实时校验、字段之间联动、输入时格式化（手机号 / 金额分隔符）、按内容禁用提交按钮 ——
 *   凡是「输入过程中就要有反应」的场景，值必须握在 React 手里。
 * - 用非受控：字段多且只关心提交结果、不需要实时联动、要接入非 React 的第三方 DOM 组件
 *   （日期选择器 / 富文本编辑器，它们自己管 DOM）、或纯粹不想每次按键都重渲染整棵表单。
 * - 工业界现状：复杂表单生产上普遍用 react-hook-form —— 它性能好的原因正是内部走非受控 + ref 注册，
 *   输入时根本不 setState（本示例不引入，先把原生写法理解透，才知道它替你省了什么）。
 *
 * Vue 对照：这整个「二分」在 Vue 里基本不存在 —— v-model 太顺手，而且 Vue 不会因为输入就重跑组件，
 * 没有「为了性能改用非受控」的动机。所以这是一个没有一一对应关系的 React 特有概念。
 */
function UncontrolledQuickForm() {
  // 划重点：下面没有任何一个 state 存着输入框的内容。
  // 你在输入框里狂敲，这个组件一次都不会重渲染 —— 这正是非受控最直观的收益。
  const [saved, setSaved] = useState<QuickContact | null>(null)
  // 「用 ref 单点取值」的演示结果；null 表示还没读过
  const [peeked, setPeeked] = useState<string | null>(null)
  // 「坑一」演示用：改这个下标，就改变了传给 defaultValue 的字符串
  const [defaultNameIndex, setDefaultNameIndex] = useState(0)
  // 「怎么让新默认值真正生效」演示用：key 一变，React 就丢掉旧 DOM 重新挂载一份
  const [formKey, setFormKey] = useState(0)

  // 取值方式二：ref 直接摸真实 DOM 节点（12 题讲过 useRef 的这个用途）。
  // 和 FormData 的区别只是粒度：FormData 一次读全部字段，ref 适合只读某一个字段。
  const nameInputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // 取值方式一：new FormData(表单 DOM 节点)，一次性把所有字段读出来。
    // 前提：每个 input 都要有 name —— 没写 name 的字段对 FormData 完全不存在（高频踩坑点）。
    // e.currentTarget 就是绑了 onSubmit 的那个 <form>；只能在事件处理器里同步用：
    // 放进 setTimeout / await 之后再读会拿到 null —— React 派发完事件就会把 currentTarget 置空
    //（原生事件同理）。要在异步里继续用，先在同步阶段把 FormData 或表单节点存进局部变量。
    const formData = new FormData(e.currentTarget)
    setSaved({
      name: readText(formData, 'quickName'),
      email: readText(formData, 'quickEmail'),
      // checkbox 的原生表单老规矩：没勾选时这个 key 在 FormData 里压根不存在（get 返回 null）；
      // 勾选了而 input 又没写 value 属性时，浏览器给的是字符串 'on'。所以判断「有没有」即可。
      subscribe: formData.get('quickSubscribe') !== null,
    })
    setPeeked(null)
  }

  function handlePeek() {
    // .current 可能是 null（挂载前拿不到节点），所以 ?. 加 ?? 兜底
    setPeeked(nameInputRef.current?.value ?? '')
  }

  return (
    <div className="card stack">
      <h3>非受控写法：快速新增联系人（对照上面的受控表单）</h3>
      <p className="muted">
        这个表单没有任何 state 存输入内容：敲键盘时组件一次都不重渲染，
        只有点「提交」的那一刻，React 才从 DOM 里把值读出来。
      </p>

      {/*
        key={formKey}：key 一变，React 就把整棵子树卸载再重新挂载 —— 这是「让 defaultValue 重新生效」
        的官方做法，也是工业界重置表单最省事的手法。Vue 里几乎用不到这招。
      */}
      <form key={formKey} className="stack" onSubmit={handleSubmit}>
        <label className="row">
          姓名
          {/*
            用 defaultValue 而不是 value：它只在这个 input「首次挂载」时写进 DOM 一次，之后 DOM 自己管值。
            同时挂了 ref，方便演示另一种取值方式；name 是 FormData 的钥匙，绝不能漏写。
          */}
          <input
            ref={nameInputRef}
            name="quickName"
            defaultValue={DEFAULT_NAME_POOL[defaultNameIndex]}
            placeholder="必填"
          />
        </label>
        <label className="row">
          邮箱
          <input name="quickEmail" type="email" defaultValue="weiming@example.com" />
        </label>
        <label className="row">
          {/* checkbox 的非受控写法是 defaultChecked，不是 defaultValue（正如受控那边是 checked，不是 value） */}
          <input name="quickSubscribe" type="checkbox" defaultChecked />
          订阅通知
        </label>
        <div className="row">
          <button type="submit" className="btn-primary">
            提交（一次性读 FormData）
          </button>
          {/* 原生 <form> 里 <button> 默认就是 type="submit"，不写 type="button" 会误触发提交 —— 经典坑 */}
          <button type="button" onClick={handlePeek}>
            用 ref 读姓名
          </button>
        </div>
      </form>

      {/*
        坑一（Vue 老手必踩）：defaultValue 给的是「初始值」，不是一条能随时改的绑定。
        机制：React 只是把它写进 DOM 的 value「属性」；而输入框一旦被用户碰过
        （HTML 规范里的 dirty value flag 置位），显示的内容就和这个属性彻底脱钩了。
        所以只要用户改过一个字，之后 defaultNameIndex 再怎么变、传进去的字符串再怎么换，
        输入框都纹丝不动 —— 这跟 Vue 里「改个响应式值，绑定的输入框立刻跟着变」的直觉完全相反。
        （严谨一点：如果输入框还没被碰过，改 defaultValue 是会看到内容跟着变的 —— 那只是属性
        还没脱钩，不是响应式绑定，所以下面的实验一定要先在框里改一个字再点按钮。）
        想让新默认值「无条件」生效只有两条路：换 key 强制重新挂载（下面第二个按钮），
        或者干脆改用受控。
      */}
      <div className="row">
        <button onClick={() => setDefaultNameIndex(i => (i + 1) % DEFAULT_NAME_POOL.length)}>
          换默认姓名（碰过的输入框不会跟着变）
        </button>
        <button onClick={() => setFormKey(k => k + 1)}>换 key 重新挂载（新默认值才生效）</button>
      </div>
      <p className="muted">
        当前传给 defaultValue 的值：{DEFAULT_NAME_POOL[defaultNameIndex]}。
        实验步骤：先在姓名框里改一个字（这一步不能省，它让输入框和 value 属性脱钩），
        再点「换默认姓名」—— 输入框纹丝不动；再点「换 key 重新挂载」，新默认值才会出现。
      </p>

      {/*
        坑二：写了 value 却不写 onChange，输入框会变成只读 ——
        因为每次渲染 React 都把 value 写回 DOM，而没有 onChange 就没人更新 state，
        值永远被打回原样，看起来就是「字打不进去」，React 还会在控制台警告你。
        如果本来就想要只读，正确写法是显式加 readOnly（下面这个输入框），警告随之消失。
        Vue 侧形似的写法是 :value 不配 @input，但表现正好相反：它是持续绑定，绑定值一变会冲掉用户输入。
      */}
      <label className="row">
        只读对照
        <input value="value 不配 onChange 就打不进字" readOnly />
      </label>

      {peeked !== null && (
        <p className="muted">ref 读到的姓名：{peeked === '' ? '（空）' : peeked}</p>
      )}

      {saved !== null && (
        <div className="stack">
          <p className="success-text">已提交 —— 下面的值全部由 FormData 一次性读出</p>
          <p>姓名：{saved.name === '' ? '（未填写）' : saved.name}</p>
          <p>邮箱：{saved.email === '' ? '（未填写）' : saved.email}</p>
          <p>订阅通知：{saved.subscribe ? '已订阅' : '未订阅'}</p>
        </div>
      )}

      <p className="muted">
        延伸：React 19 的 form actions（{'<form action={fn}>'}）会直接把这份 FormData 交到你手上，
        连 onSubmit + preventDefault 都省了，原理就是这里的非受控取值
        （19 题提到过 useActionState，但那里用的是手写 submitting 的基础写法，本项目没有实现 form actions）。
      </p>
    </div>
  )
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

      {/* ============ 新增：非受控写法对照区块 ============ */}
      <UncontrolledQuickForm />
    </div>
  )
}
