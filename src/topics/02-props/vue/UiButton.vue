<script setup lang="ts">
/**
 * 区块四的按钮。对照 react/UiButton.tsx。
 *
 * Vue 的属性透传有两种状态：
 * (1)【最常用】默认（fallthrough attributes）：没被 props / emits 声明的属性和 v-on 监听器（disabled、type、title、aria-*、@click，以及 class、style），
 *     单根组件会自动加到根元素上，class / style 与根元素已有的合并，监听器两边都触发。模板只写 <button :class="…"><slot /></button>，外面传的 disabled、@click 照样生效。
 * (2)【常用】手动接管（本文件）：defineOptions({ inheritAttrs: false }) 关掉自动透传（defineOptions 3.3 起），再用 useAttrs() 拿到这些属性，v-bind 到想绑的元素上。
 *     这一步才相当于 React 的 { ...rest } —— React 只有这一种写法，没有 (1) 这种自动行为（React 的 props 只是函数参数）。
 * 什么时候要 (2)：属性不该落在根元素上（例如根是 <label>、真正的 <input> 在里面），或者要控制 attrs 和自己的属性谁先谁后。本组件用 (2) 是为了和 React 版逐行对照。
 */
import { computed, useAttrs, useTemplateRef, type CSSProperties } from 'vue'

// 组件自己的 props：对照 React 的 variant / size；3.5 响应式解构 + 默认值
const { variant = 'primary', size = 'md' } = defineProps<{
  variant?: 'primary' | 'danger'
  size?: 'sm' | 'md'
}>()

// 关掉「自动透传到根元素」，改成模板里手动 v-bind="attrs"。
// 只删这一行、留着 v-bind="attrs" 的话，属性会被绑两遍：class 变成「btn-primary btn-ghost btn-ghost」，同一个监听器 Vue 会去重、只触发一次（测试覆盖）。
defineOptions({ inheritAttrs: false })

// 没被 defineProps 接住的属性（含 class、style、onClick 这样的监听器，名字保留原始大小写：@click 在这里是 onClick）。
// 对应 React 的 function UiButton({ variant, size, className, style, ref, children, ...rest }) 里的 rest。
// 文档说这个对象「isn't reactive」、不能用 watch 观察（要响应式就声明成 prop，或在 onUpdated 里读）；实测 3.5.42 的 watch 其实会触发，但那不是文档承诺的行为（见 Example.vue）。
const attrs = useAttrs()

const variantClass = computed(() => (variant === 'danger' ? 'btn-danger' : 'btn-primary'))
// 演示简化：尺寸写成行内样式，只为演示 style 的合并（真实组件库写成 CSS 类）
const sizeStyle = computed<CSSProperties>(() => (size === 'sm' ? { fontSize: '12px', padding: '2px 8px' } : {}))

// 组件上的 ref 拿到的是组件实例，不是 <button>；<script setup> 组件默认封闭，父组件想调 focus() 就要 defineExpose 暴露出去（12 题改写时补）。
// React 19 这边 ref 是普通 prop，直接转交给 <button>，父组件拿到的就是 DOM 节点。
const buttonEl = useTemplateRef<HTMLButtonElement>('button')
defineExpose({ focus: () => buttonEl.value?.focus() })
</script>

<template>
  <!-- 顺序与 React 版一致：type="button" 写在 v-bind="attrs" 前面只是默认值，外面传 type 会覆盖它；
       class、style 不用自己拼：v-bind 合并时 class 拼接、style 合并（同名属性后写的优先），React 那边要自己写合并逻辑。
       <slot /> 对应 React 的 children（13 题）。 -->
  <button
    ref="button"
    type="button"
    :class="variantClass"
    :style="sizeStyle"
    v-bind="attrs"
  >
    <slot />
  </button>
</template>
