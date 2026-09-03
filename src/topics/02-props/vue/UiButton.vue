<script setup lang="ts">
/**
 * 子组件 UiButton（对照 React 版：UiButton 与父组件同写在 Example.tsx 里）。
 *
 * 这个组件的重点是「属性透传」——Vue 老手最容易忽略的机制，两种写法对照：
 *
 * (1) 默认行为（fallthrough attributes / $attrs）：
 *     只要不写 inheritAttrs: false，父组件传来的、没被 defineProps 接住的属性
 *     （disabled / type / title / aria-* / @click，甚至 class 和 style）
 *     Vue 都会**自动**落到本组件的根元素上，class/style 还会自动与根元素已有的合并。
 *     也就是说：模板哪怕只写 <button :class="variantClass"><slot /></button>，
 *     外面传的 disabled 和 @click 照样能用——框架替你做了，很多人写了几年组件都没意识到。
 *
 * (2) 显式接管：defineOptions({ inheritAttrs: false }) 关掉自动透传，
 *     再用 useAttrs() 拿到这些属性，手动 v-bind 到你想绑的元素上（本文件用的就是这种）。
 *     这一步才等价于 React 的 { ...rest }——React 只有 (2) 这条路，压根没有 (1)。
 */
import { computed, useAttrs } from 'vue'

interface Props {
  /** 组件自己的 props：只有这一个，对照 React 的 UiButtonProps['variant'] */
  variant?: 'primary' | 'danger'
}

// 对应 React 的参数解构默认值 { variant = 'primary' }
const props = withDefaults(defineProps<Props>(), { variant: 'primary' })

// 关掉「自动透传到根元素」，改成下面手动 v-bind="attrs"。
// 把这一行和模板里的 v-bind="attrs" 一起删掉，组件行为几乎不变（Vue 会自动补上这份工作）——
// 这正是「Vue 帮你做了、React 逼你显式写」的典型。
// 注意：只删这一行、留着 v-bind="attrs"，属性会被绑两遍（class 还会重复），别这么写。
// React 里没有这个开关，因为它根本没有自动透传这回事（没有一一对应关系）。
defineOptions({ inheritAttrs: false })

// useAttrs() = 所有没被 defineProps 接住的属性（含 class/style/事件监听器），
// 对应 React 的 function UiButton({ variant, className, children, ...rest }) 里的 rest。
const attrs = useAttrs()

// 对应 React 的 VARIANT_CLASS 映射表；variant 只有两个取值，这里直接写三元，没有另建映射对象
const variantClass = computed(() => (props.variant === 'danger' ? 'btn-danger' : 'btn-primary'))
</script>

<template>
  <!-- 顺序与 React 版一致：type="button" 写在 v-bind="attrs" 前面只是默认值，外部传 type 会覆盖它。
       class 这里不用手动合并：v-bind="attrs" 里的 class 被 Vue 自动 merge 到 :class 上；
       React 那边必须自己写 [VARIANT_CLASS[variant], className].filter(Boolean).join(' ')。
       <slot /> 对应 React 的 children（13 题详讲）。 -->
  <button
    type="button"
    :class="variantClass"
    v-bind="attrs"
  >
    <slot />
  </button>
</template>
