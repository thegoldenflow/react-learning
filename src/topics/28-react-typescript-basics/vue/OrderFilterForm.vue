<script setup lang="ts">
/**
 * 筛选表单（对照 React 侧 Example.tsx 里的 OrderFilterForm 函数组件）。
 *
 * React 侧一个 interface OrderFilterFormProps 里写了四个字段：initial? / onSubmit / onReset? / footer?。
 * Vue 把它们拆到三个编译器宏里：
 * - initial?  → defineProps + withDefaults（可选对象 prop 的默认值必须是工厂函数；eslint 的 vue/require-default-prop 也要求给可选 prop 默认值）
 * - onSubmit / onReset? → defineEmits<{ submit: [filter: OrderFilter]; reset: [] }>()（具名元组 = 事件参数签名；
 *   emit 天然「可选」—— 父组件不监听就是不监听，没有 React 那种 onReset?.() 的区分）
 * - footer?   → <slot name="footer" />，defineSlots 只是给模板机制加类型标注；React 的 footer 是一个 ReactNode 类型的【值】——
 *   没有一一对应关系
 *
 * 事件类型是本文件的重点：@input / @change / @submit 拿到的都是【原生 DOM 事件】，类型是全局的 Event，
 * e.target 只是 EventTarget | null —— 取 value 要么 as HTMLInputElement 断言，要么 instanceof 收窄。
 * React 的 ChangeEvent<HTMLInputElement> 把元素类型编码进了泛型，e.target.value 直接可用，没有这一步。
 * 而 v-model 之所以好用，正是因为它替你做了这一步 —— 本文件故意让三个字段各用一种写法，把差别摆出来。
 */
import { ref, type VNode } from 'vue'
import {
  DEFAULT_FILTER,
  STATUS_FILTER_LABEL,
  STATUS_FILTER_OPTIONS,
  isStatusFilter,
  type OrderFilter,
  type StatusFilter,
} from './types'

interface Props {
  /** 初始值：只在 setup 时读一次（下面 ref(props.initial.keyword) 拷贝了值），父组件想重置就换 :key */
  initial?: OrderFilter
}

// withDefaults 给可选 prop 默认值，对应 React 的参数解构默认值 { initial = DEFAULT_FILTER }。
// 对象默认值必须写成工厂函数 () => ({ … })：Vue 会为每个实例调用一次，避免多个实例共享同一个对象。
// Vue 3.5 起也可以写 const { initial = DEFAULT_FILTER } = defineProps<Props>()（响应式 props 解构）；这里保留 withDefaults 写法。
const props = withDefaults(defineProps<Props>(), { initial: () => ({ ...DEFAULT_FILTER }) })

// 具名元组：submit 带一个 OrderFilter 参数，reset 不带参数。父组件 @submit="fn" 时 fn 的参数类型由此推断。
// React 对照：onSubmit: (filter: OrderFilter) => void 与 onReset?: () => void 两个函数类型的 props。
const emit = defineEmits<{
  submit: [filter: OrderFilter]
  reset: []
}>()

// defineSlots：给插槽加类型标注（footer 可选、无作用域参数、返回 VNode 数组）。
// 它标注的是「模板机制」，本组件拿不到一个叫 footer 的值；React 的 footer 是实打实的 prop —— 没有一一对应关系。
defineSlots<{ footer?: () => VNode[] }>()

// ref 的类型推断与 useState 完全一致：初始值是 string 就是 Ref<string>；
// status 显式写 ref<StatusFilter>：这里 props.initial.status 已是 StatusFilter、可推断，写出来是为了对照 —— 直接 ref('all') 只会得到 Ref<string>
const keyword = ref(props.initial.keyword)
const status = ref<StatusFilter>(props.initial.status)
// 金额草稿用 string 保存（受控输入的值永远是字符串），提交时再转 number 塞进可选字段
const minAmountText = ref(props.initial.minAmount === undefined ? '' : String(props.initial.minAmount))

/**
 * 写法一：@input 手动处理 —— 参数是原生 Event，e.target 是 EventTarget | null，
 * 断言 (e.target as HTMLInputElement) 不可避免（这里是安全的：事件只可能来自那个 <input>）。
 * 这就是 v-model 在编译后替你写的东西。React 对照：ChangeEvent<HTMLInputElement> 的 e.target 已经是 HTMLInputElement。
 */
function handleKeywordInput(e: Event) {
  keyword.value = (e.target as HTMLInputElement).value
}

/**
 * 写法二：instanceof 收窄，不写 as —— 更严格，也更啰嗦。
 * 收窄后 e.target.value 是 string，再过一次类型守卫才能赋给 Ref<StatusFilter>（React 侧 handleFieldChange 的同一步）。
 */
function handleStatusChange(e: Event) {
  if (!(e.target instanceof HTMLSelectElement)) return
  const { value } = e.target
  if (isStatusFilter(value)) status.value = value
}

/**
 * 写法三：金额输入框直接 v-model（见模板），没有任何事件代码 —— 日常 Vue 代码 95% 是这一种。
 *
 * 提交：参数类型写 Event 就够（Vue 实际传的是 SubmitEvent，子类型可以赋给父类型），e.preventDefault() 阻止整页刷新。
 * 模板里用 @submit.prevent 修饰符也行；这里显式调用是为了和 React 侧 FormEvent<HTMLFormElement> + e.preventDefault() 对齐。
 */
function handleSubmit(e: Event) {
  e.preventDefault()
  // 先按必填字段造对象，再按条件补可选字段：不筛金额时对象上干脆没有 minAmount
  const filter: OrderFilter = { keyword: keyword.value.trim(), status: status.value }
  if (minAmountText.value !== '') filter.minAmount = Number(minAmountText.value)
  emit('submit', filter)
}

function handleReset() {
  keyword.value = DEFAULT_FILTER.keyword
  status.value = DEFAULT_FILTER.status
  minAmountText.value = ''
  // 父组件没监听 @reset 也没关系 —— emit 天然可选，React 侧要写 onReset?.()
  emit('reset')
}
</script>

<template>
  <form
    class="stack"
    @submit="handleSubmit"
  >
    <div class="row">
      <label class="row">
        <span>关键词：</span>
        <!-- 写法一：:value + @input 手动处理（处理器里有一次不可避免的 as 断言） -->
        <input
          :value="keyword"
          placeholder="订单号或客户名"
          @input="handleKeywordInput"
        >
      </label>
      <label class="row">
        <span>状态：</span>
        <!-- 写法二：@change + instanceof 收窄 + 类型守卫；选项来自 as const 元组，文案来自 Record，两处都受类型约束 -->
        <select
          :value="status"
          @change="handleStatusChange"
        >
          <option
            v-for="option in STATUS_FILTER_OPTIONS"
            :key="option"
            :value="option"
          >
            {{ STATUS_FILTER_LABEL[option] }}
          </option>
        </select>
      </label>
      <label class="row">
        <span>金额 ≥</span>
        <!-- 写法三：v-model —— 上面两种写法里的 e.target 断言 / 收窄，编译器在这里替你做了 -->
        <input
          v-model="minAmountText"
          type="number"
          min="0"
          step="1"
          placeholder="不限"
        >
      </label>
    </div>
    <div class="row">
      <button
        type="submit"
        class="btn-primary"
      >
        应用筛选
      </button>
      <button
        type="button"
        class="btn-ghost"
        @click="handleReset"
      >
        重置
      </button>
    </div>
    <!-- 具名插槽 footer：父组件没传就不渲染底部区域（$slots.footer 判断），对应 React 的 footer != null && … -->
    <div
      v-if="$slots.footer"
      class="row"
    >
      <slot name="footer" />
    </div>
  </form>
</template>
