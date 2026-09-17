<script setup lang="ts">
/**
 * 主题：07. 表单与受控组件（Vue 对照）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-17
 * 前置主题：03、04、06、09、12（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解（30 秒速答、核心概念、关键区别、追问、易错点、生产注意、旧写法、新动向、练习、参考）
 * 在 react/Example.tsx；本文件列出 Vue 这一侧的要点，和 React 的对应关系写在各文件的注释里。
 *
 * Vue 这一侧的要点：
 * - v-model【主流】就是 Vue 的受控写法：按元素展开成「属性 + 事件」，忽略 HTML 里写的初始 value / checked / selected，
 *   以 JS 状态为真相源（ControlledProfileForm.vue）。不用 v-model、写静态属性、提交时读 FormData 就是非受控写法
 *   （UncontrolledContactForm.vue）。「受控 / 非受控」两边都有，不是 React 独有的概念。
 * - 修饰符 .lazy / .number / .trim【主流】；type="number" 自动带 .number。
 * - 组件 v-model 用 defineModel()【较新·3.4 起，官方推荐】；3.4 之前手写 modelValue + update:modelValue【旧写法】（TextField.vue）。
 * - useId()【主流·3.5 起】生成服务端与客户端一致的 id；多个应用用 app.config.idPrefix。
 * - 和 React 受控输入的差别（InputEventLab.vue）：v-model 输入法拼写期间不更新；写入被拒绝时不会把 DOM 改回去，
 *   输入过滤要写 :value + @input 手动改回。
 * - :value 不配 @input 是持续绑定：组件每次重新渲染都会写回绑定值，和 React 的 defaultValue 语义相反。
 * - React 19 的 <form action> / useActionState 在 Vue 没有内置对应物，照常在 @submit 里手写（31 题，待新增）。
 */
import ControlledProfileForm from './ControlledProfileForm.vue'
import InputEventLab from './InputEventLab.vue'
import UncontrolledContactForm from './UncontrolledContactForm.vue'
</script>

<template>
  <div class="stack">
    <ControlledProfileForm />
    <UncontrolledContactForm />
    <InputEventLab />
  </div>
</template>
