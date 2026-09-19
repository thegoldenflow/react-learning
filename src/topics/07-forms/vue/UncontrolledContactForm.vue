<script setup lang="ts">
/**
 * 【主线：非受控】快速新增联系人（React 对照：react/UncontrolledContactForm.tsx）。
 *
 * Vue 同样可以不用 v-model：初始值写成静态的 value / checked 属性（挂载时写一次，之后由 DOM 保管），
 * 提交时 new FormData(表单) 读一次，或者用 useTemplateRef 拿到节点读 .value。两种模式两边都有。
 * 频率：Vue 项目里读表单值基本用 v-model，这种写法【少用】（工程经验，多见于上传文件时拼 FormData）。
 * 本课仍保留为主线、照常运行：它是 React 非受控主线的逐行对照（2-B 定的），也承载 :value 语义的 ❌ 实验（下方）——
 * 行业频率和本课主线不一致，记在 PROGRESS「待用户定」07-1。
 *
 * 和 React 的差别集中在「初始值」的写法：
 * - Vue 没有 defaultValue 这个 prop。静态 value 属性对应 React 的 defaultValue；
 * - :value="xxx" 是持续绑定：组件每次重新渲染都会把绑定值写回 DOM，冲掉用户输入 —— 和 defaultValue 正好相反（下方实验）；
 * - <option selected>、<textarea>里的文字 在 Vue 模板里是合法的 HTML 默认值，React 不支持这两种写法。
 */
import { ref, useTemplateRef } from 'vue'

interface QuickContact {
  name: string
  email: string
  role: string
  note: string
  subscribe: boolean
}

interface SubmitReport {
  contact: QuickContact
  keys: string[]
  currentTargetAfterAwait: string
}

const { saveDelayMs = 300 } = defineProps<{ saveDelayMs?: number }>()

const report = ref<SubmitReport | null>(null)
const peeked = ref<string | null>(null)
const formKey = ref(0)

// 模板 ref【主流·Vue 3.5 起 useTemplateRef】，对应 React 的 useRef<HTMLInputElement>(null) + ref={nameInputRef}
const quickNameInput = useTemplateRef<HTMLInputElement>('quickNameInput')

/** FormData.get() 返回 string | File | null，两边一样要先收窄 */
function readText(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function fakeSave(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs))
}

async function handleQuickSubmit(e: Event) {
  // Vue 的模板事件给的是原生 Event，要自己断言成表单节点；React 的 SubmitEvent<HTMLFormElement> 已经带好类型。
  // currentTarget 同样只在派发期间有值（这是 DOM 事件本身的规则），await 之前取出来
  const form = e.currentTarget as HTMLFormElement
  const formData = new FormData(form)
  const contact: QuickContact = {
    name: readText(formData, 'quickName'),
    email: readText(formData, 'quickEmail'),
    role: readText(formData, 'quickRole'),
    note: readText(formData, 'quickNote'),
    // 没勾选的 checkbox 在 FormData 里没有这个 key —— 原生表单的规则，和框架无关
    subscribe: formData.get('quickSubscribe') !== null,
  }

  await fakeSave(saveDelayMs)

  report.value = {
    contact,
    keys: Array.from(formData.keys()),
    currentTargetAfterAwait: e.currentTarget === null ? 'null' : '仍然是 <form>',
  }
  peeked.value = null
}

function handlePeek() {
  // 外层 .value 是模板 ref 的值（DOM 节点），内层 .value 是输入框的值
  peeked.value = quickNameInput.value?.value ?? ''
}

/* ---------- 实验：:value 持续绑定会冲掉用户输入 ---------- */
const SUGGESTED_NAMES = ['周未名', '陈阿四', '孙小圣']
const suggestedIndex = ref(0)
// 只用来让组件重新渲染一次：它显示在模板里，改它就会重新渲染
const renderTick = ref(0)
</script>

<template>
  <div class="card stack">
    <h3>区块二：非受控表单【主线】—— 快速新增联系人</h3>
    <p class="muted">
      不用 v-model：初始值写成静态属性，值由 DOM 保管，点「提交」时才用 FormData 读出来。
    </p>
    <p class="muted">
      Vue 项目里这种写法【少用】（多见于上传文件）；这里作为 React 非受控主线的对照保留。
    </p>

    <!-- :key 变了，整个 <form> 重新挂载，静态初始值重新生效（React 同样是换 key）。
         没有 novalidate：保留浏览器原生校验，姓名清空后提交会被拦下 -->
    <form
      :key="formKey"
      class="stack"
      @submit.prevent="handleQuickSubmit"
    >
      <label class="row">
        姓名
        <!-- 静态 value 属性：挂载时写一次，之后 DOM 自己管值 —— 这才是 React defaultValue 的等价物 -->
        <input
          ref="quickNameInput"
          name="quickName"
          value="周未名"
          required
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
        角色
        <!-- 不用 v-model 时，<option selected> 就是 HTML 的默认选中项；React 不支持，要写 <select defaultValue> -->
        <select name="quickRole">
          <option value="admin">管理员</option>
          <option value="editor">编辑</option>
          <option
            value="viewer"
            selected
          >只读访客</option>
        </select>
      </label>
      <label
        class="stack"
        style="gap: 4px"
      >
        备注
        <!-- 静态文字写在 <textarea> 里就是 HTML 的默认内容（插值不行）；React 要写 defaultValue -->
        <textarea
          name="quickNote"
          rows="2"
        >展会上交换的名片</textarea>
      </label>
      <label class="row">
        来源（故意没写 name）
        <input value="这个字段不会出现在 FormData 里">
      </label>
      <label class="row">
        <!-- 静态 checked 属性，对应 React 的 defaultChecked -->
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
          提交（读 FormData）
        </button>
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
      v-if="report !== null"
      class="stack"
      style="gap: 4px"
    >
      <p
        class="success-text"
        style="margin: 0"
      >
        已提交（演示：没有真的发请求）
      </p>
      <p style="margin: 0">
        {{ report.contact.name || '（未填写）' }} · {{ report.contact.email || '（未填写）' }} · {{ report.contact.role }} ·
        备注：{{ report.contact.note || '无' }} · {{ report.contact.subscribe ? '已订阅' : '未订阅' }}
      </p>
      <p
        class="muted"
        style="margin: 0"
      >
        FormData 里的字段：{{ report.keys.join('、') }}（「来源」没有 name，不在里面）
      </p>
      <p
        class="muted"
        style="margin: 0"
      >
        await 之后读 e.currentTarget：{{ report.currentTargetAfterAwait }}
      </p>
    </div>

    <button
      type="button"
      style="align-self: flex-start"
      @click="formKey++"
    >
      换 key 重新挂载（恢复静态初始值）
    </button>

    <!-- React 侧这里是「改 defaultValue 不生效」的实验；Vue 里长得像的 :value 行为正好相反 -->
    <div class="stack">
      <strong>实验：:value 是持续绑定</strong>
      <label class="row">
        建议姓名
        <input
          name="suggestedName"
          :value="SUGGESTED_NAMES[suggestedIndex]"
        >
      </label>
      <div class="row">
        <button
          type="button"
          @click="suggestedIndex = (suggestedIndex + 1) % SUGGESTED_NAMES.length"
        >
          换绑定值
        </button>
        <button
          type="button"
          @click="renderTick++"
        >
          只让组件重新渲染（第 {{ renderTick }} 次）
        </button>
      </div>
      <p class="muted">
        先在「建议姓名」里改几个字，再点任意一个按钮：输入框都会回到绑定值。
        :value 没配 @input 时，组件每次重新渲染都会把绑定值写回 DOM（不管绑定值有没有变）。
        React 的 defaultValue 正好相反：改了也不影响用户改过的输入框。
      </p>
    </div>
  </div>
</template>
