<script setup lang="ts">
/**
 * 带 label、提示、错误信息的文本输入组件（React 对照：react/TextField.tsx）。
 *
 * - defineModel()【较新·Vue 3.4 起，官方推荐】：父组件写 v-model="form.name"，这里拿到一个 ref，
 *   读它就是父组件的值，给它赋值就通知父组件更新。编译器把它展开成 modelValue prop + update:modelValue 事件；
 *   3.4 之前要手写 defineProps(['modelValue']) + defineEmits(['update:modelValue'])【旧写法】。
 *   React 没有 v-model 语法糖，自定义输入组件照样收 value + onChange。
 * - useId()【主流·Vue 3.5 起】：和 React 的 useId 一样，服务端和客户端生成的 id 一致；
 *   同一组件调用多次、同一组件渲染多份，得到的都是不同的 id；一页多个 Vue 应用用 app.config.idPrefix 区分。
 * - 父组件想聚焦里面的 <input>：Vue 组件上的 ref 拿到的是组件实例，要用 defineExpose 暴露方法；
 *   React 19 的 ref 是普通 prop，子组件直接转给 <input>。
 */
import { useId, useTemplateRef } from 'vue'

const model = defineModel<string>({ required: true })

// Vue 3.5 起，从 defineProps 解构出来的变量仍然是响应式的（Reactive Props Destructure）【主流·3.5 起】
const { label, name, hint = '', error = '', inputmode = 'text' } = defineProps<{
  label: string
  name: string
  hint?: string
  error?: string
  inputmode?: 'text' | 'numeric'
}>()

// 一个组件只调一次 useId，其余 id 用后缀派生（和 React 侧一样）
const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`

const inputEl = useTemplateRef<HTMLInputElement>('inputEl')

defineExpose({
  focus: () => inputEl.value?.focus(),
})
</script>

<template>
  <div
    class="stack"
    style="gap: 4px"
  >
    <div class="row">
      <label :for="id">{{ label }}</label>
      <!-- 组件内部照常用 v-model 绑到 defineModel 返回的 ref 上，输入法拼写期间不会更新（见 InputEventLab.vue） -->
      <input
        :id="id"
        ref="inputEl"
        v-model="model"
        :name="name"
        :inputmode="inputmode"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined"
      >
    </div>
    <p
      v-if="hint"
      :id="hintId"
      class="muted"
      style="margin: 0"
    >
      {{ hint }}
    </p>
    <p
      v-if="error"
      :id="errorId"
      class="error-text"
      style="margin: 0"
    >
      {{ error }}
    </p>
  </div>
</template>
