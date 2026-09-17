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
 * - 「受控 vs 非受控」这道二分题在 Vue 里基本不存在：v-model 太顺手；输入时只有读了该字段的组件重跑渲染函数，
 *   props 没变的子组件不会被连带重渲染，没有「为了性能改用非受控」的动机 —— 没有一一对应关系
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

/* ============ 以下是新增的「非受控写法」对照区块 ============ */

/** 提交那一刻收集到的字段快照（React 侧同名类型 QuickContact） */
interface QuickContact {
  name: string
  email: string
  subscribe: boolean
}

/** FormData.get() 返回 string | File | null，两边一样要先收窄再用 */
function readText(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

// 这里要点破一个事实：React 侧那一整套「受控 vs 非受控」的取舍，在 Vue 世界里基本不成立 ——
// v-model 又短又顺手；一次输入只让本组件的渲染函数重跑（setup 不重跑），patch 时只比对编译器标出的动态节点，
// props 没变的子组件也不会被连带重渲染，
// 所以没有「为了性能改用非受控」的动机。Vue 生产代码里几乎见不到有人刻意写非受控表单，
// 「受控组件 / 非受控组件」这对概念本身就是 React 特有的，没有一一对应关系。
// 下面这段纯粹是为了和 React 侧对照：Vue 同样能走「DOM 自己存值、提交时读一次」这条路。
const quickSaved = ref<QuickContact | null>(null)
const peeked = ref<string | null>(null)
// 模板 ref，对应 React 的 useRef<HTMLInputElement>(null) + ref={nameInputRef}
const quickNameInput = ref<HTMLInputElement | null>(null)

function handleQuickSubmit(e: Event) {
  // 和 React 侧完全同一招：new FormData(表单节点) 一次性读出所有带 name 的字段（没 name 的字段读不到）。
  // 差别只在怎么拿到表单节点：React 是 e.currentTarget（FormEvent<HTMLFormElement> 已经定好了类型），
  // Vue 的模板事件给的是原生 Event，需要自己断言成 HTMLFormElement。
  const formData = new FormData(e.target as HTMLFormElement)
  quickSaved.value = {
    name: readText(formData, 'quickName'),
    email: readText(formData, 'quickEmail'),
    // checkbox 没勾选时 FormData 里压根没有这个 key —— 原生表单的老规矩，和框架无关
    subscribe: formData.get('quickSubscribe') !== null,
  }
  peeked.value = null
}

function handlePeek() {
  // React 侧是 nameInputRef.current?.value；Vue 是 .value?.value
  //（外层 .value 是响应式 ref 的取值，内层 .value 是 DOM 节点的属性）
  peeked.value = quickNameInput.value?.value ?? ''
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

    <!-- 和 React 一样 state 随按键实时更新，两边都会重新渲染本组件：React 重跑整个组件函数，
         Vue 只重跑渲染函数（setup 不重跑），patch 时只比对编译器标出的动态节点，比如这一行文本 -->
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

    <!-- ============ 新增：非受控写法对照区块（呼应 React 侧的 UncontrolledQuickForm） ============ -->
    <div class="card stack">
      <h3>非受控写法：快速新增联系人（对照上面的受控表单）</h3>
      <p class="muted">
        Vue 里几乎没人这么写：v-model 太顺手，每次按键的更新成本也低（setup 不重跑，props 没变的子组件不会被连带重渲染），
        所以「受控 vs 非受控」这道 React 面试标配题，在 Vue 世界里基本不成立 —— 没有一一对应关系。
        下面纯粹是为了和 React 侧对照。
      </p>

      <form
        class="stack"
        @submit.prevent="handleQuickSubmit"
      >
        <label class="row">
          姓名
          <!-- Vue 没有 defaultValue 这个 prop：想「只给初始值」就写一个静态 value 属性，
               它只在挂载时写一次，之后 DOM 自己管值 —— 这才是 React defaultValue 的等价物。
               千万别写成 :value 动态绑定：那是「持续绑定」，绑定值一变就会把用户已输入的内容冲掉；
               而 React 的 defaultValue 恰恰相反，改了也纹丝不动（只在首次挂载生效，要换 key 才重挂载）。
               长得像的两行代码，语义正好相反 —— 这是 Vue 老手在 React 里最容易踩的坑。 -->
          <input
            ref="quickNameInput"
            name="quickName"
            value="周未名"
            placeholder="必填"
          >
        </label>
        <label class="row">
          邮箱
          <input
            name="quickEmail"
            type="email"
            value="weiming@example.com"
          >
        </label>
        <label class="row">
          <!-- 初始勾选：静态 checked 属性，对应 React 的 defaultChecked -->
          <input
            name="quickSubscribe"
            type="checkbox"
            checked
          >
          订阅通知
        </label>
        <div class="row">
          <button
            type="submit"
            class="btn-primary"
          >
            提交（一次性读 FormData）
          </button>
          <!-- 和 React 一样：<form> 里的 button 默认就是 submit，不写 type="button" 会误触发提交 -->
          <button
            type="button"
            @click="handlePeek"
          >
            用 ref 读姓名
          </button>
        </div>
      </form>

      <p
        v-if="peeked !== null"
        class="muted"
      >
        ref 读到的姓名：{{ peeked === '' ? '（空）' : peeked }}
      </p>

      <div
        v-if="quickSaved !== null"
        class="stack"
      >
        <p class="success-text">
          已提交 —— 下面的值全部由 FormData 一次性读出
        </p>
        <p>姓名：{{ quickSaved.name === '' ? '（未填写）' : quickSaved.name }}</p>
        <p>邮箱：{{ quickSaved.email === '' ? '（未填写）' : quickSaved.email }}</p>
        <p>订阅通知：{{ quickSaved.subscribe ? '已订阅' : '未订阅' }}</p>
      </div>

      <p class="muted">
        React 侧还演示了两个坑：defaultValue 改了、用户碰过的输入框纹丝不动（要换 key 才重新挂载）、
        受控 value 不配 onChange 会变只读。这两个坑在 Vue 里都不存在 —— v-model 会替你把值写回去，
        静态 value 也从没让人误以为它是响应式的。
      </p>
    </div>
  </div>
</template>
