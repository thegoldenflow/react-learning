<script setup lang="ts">
/**
 * 主题：07. 表单与受控组件（Vue 对照）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-19
 * 前置主题：03、04、06、09、12（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：按 Vue 项目里的使用频率标【最常用】【常用】【少用】（依据写在 react/Example.tsx 三；没有出处的写「工程经验」），不照搬 React 侧的标签。
 *          Vue 这一侧没有需要注释的演示；【少用】的写法只写在下面的「附：细节」。
 *
 * 完整的十段讲解（30 秒速答、核心概念、关键区别、追问、易错点、生产注意、旧写法、新动向、练习、参考）
 * 在 react/Example.tsx；本文件列出 Vue 这一侧的要点，和 React 的对应关系写在各文件的注释里。
 *
 * Vue 这一侧的要点：
 * - v-model【最常用】就是 Vue 的受控写法（「we often need to sync the state of form input elements with corresponding state in JavaScript」）：
 *   按元素展开成「属性 + 事件」，忽略 HTML 里写的初始 value / checked / selected，以 JS 状态为真相源（ControlledProfileForm.vue）。
 *   不用 v-model、写静态属性、提交时读 FormData 就是非受控写法（UncontrolledContactForm.vue）。「受控 / 非受控」两边都有，不是 React 独有的概念。
 *   Vue 项目里读表单值基本用 v-model；非受控写法【少用】（工程经验，多见于上传文件时拼 FormData）。本课仍把 UncontrolledContactForm.vue
 *   保留为主线、照常运行：它是 React 非受控主线的逐行对照（2-B 定的），也承载 :value 语义的 ❌ 实验 —— 记在 PROGRESS「待用户定」07-1。
 * - 修饰符 .trim / .number【常用】（频率：工程经验）；type="number" 自动带 .number。.lazy 见附。
 * - 组件 v-model 用 defineModel()【较新·3.4 起】【最常用】（频率：工程经验；官方把它定为 3.4 起的推荐写法）；
 *   3.4 之前手写 modelValue + update:modelValue【旧写法】（TextField.vue）。
 * - label：包在 <label> 里、<label :for> + id 两种都常见（工程经验；Vue 官方表单指南的示例写的是 <label for> + 静态 id）；
 *   组件里的 id 用 useId()（3.5 起）【常用】生成；多个应用用 app.config.idPrefix（附）。
 * - 和 React 受控输入的差别（InputEventLab.vue）：v-model 输入法拼写期间不更新；写入被拒绝时不会把 DOM 改回去，
 *   输入过滤要写 :value + @input 手动改回。
 * - :value 不配 @input 是持续绑定：组件每次重新渲染都会写回绑定值，和 React 的 defaultValue 语义相反。
 * - React 19 的 <form action> / useActionState 在 Vue 没有内置对应物，照常在 @submit 里手写（31 题，待新增）。
 *
 * 附：细节
 * - 【少用】.lazy：改为 change 之后同步（失焦时更新），项目里表单基本用默认的 input 同步（工程经验），本课没有演示。
 * - 【少用】一页多个 Vue 应用：app.config.idPrefix 改掉 useId 的前缀（Example.test.ts 有测试；一页挂多个 Vue 应用本身就少见，工程经验）。
 * - 源码位置（@vue/runtime-dom 3.5.42）：v-model 合成期间不更新 runtime-dom.cjs.js:1533-1545，写回 DOM 只在 beforeUpdate :1559-1576；
 *   :value 每次重新渲染都 patch（runtime-core.cjs.js:5897 + runtime-dom.cjs.js:591-601）。
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
