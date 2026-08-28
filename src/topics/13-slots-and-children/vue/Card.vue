<script setup lang="ts">
/**
 * 可复用 Card（对照 React 版：React 的 Card 是 Example.tsx 里的一个函数，
 * 用 header / children / footer 三个 ReactNode props 接内容；Vue 的插槽是模板语法，
 * 且 SFC 一个文件一个组件，所以拆成这个单独的 .vue 文件）。
 *
 * <slot name="header" /> / <slot /> / <slot name="footer" /> 分别对应 React 的
 * header prop / children / footer prop。
 */
</script>

<template>
  <div class="card">
    <div class="row">
      <slot name="header" />
    </div>
    <div><slot /></div>
    <!-- 用 $slots.footer 判断使用方有没有提供 footer 插槽 ——
         React 里这一步是普通的可选 prop 判空：{footer && <div className="row">{footer}</div>} -->
    <div
      v-if="$slots.footer"
      class="row"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
