<script setup lang="ts">
/**
 * 中间层组件：只负责布局，完全不认识 theme——
 * 没有 props 透传，也没有 inject，却包着两个要用 theme 的深层组件；数据被 provide/inject「跳过」。
 * （React 版的 MiddleLayer 与父组件同在一个 .tsx 文件里——组件只是函数；
 * Vue 的 SFC 一文件一组件，只能拆成这个单独的 .vue 文件。）
 */
</script>

<template>
  <div class="card stack">
    <p class="muted">
      MiddleLayer（中间层：只管布局，不接触 theme——被 provide/inject「跳过」）
    </p>
    <!-- React 里对应 {children}；Vue 用 slot -->
    <slot />
  </div>
</template>
