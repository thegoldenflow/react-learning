<script setup lang="ts">
/**
 * 深层组件一：只读 theme。
 * 跳过 MiddleLayer 直接用 useTheme()（内部是 inject）拿注入值——props 没有经过任何中间层。
 * React 里这一步是 const { theme } = useTheme()（内部是 useContext）。
 */
import { THEME_STYLES, useTheme } from './theme'

const { theme } = useTheme()
// 注意：theme 是 ref，从注入对象上解构出来仍是同一个 ref，响应性不丢
// （会丢响应性的是对 reactive 对象做属性解构，那种要用 toRefs）
</script>

<template>
  <div
    class="card"
    :style="THEME_STYLES[theme]"
  >
    <strong>ThemedCard（深层组件）</strong>
    <p>当前主题：{{ theme === 'light' ? '☀️ light' : '🌙 dark' }}</p>
    <p>我通过 useTheme() 直接读注入值，props 没有经过中间层。</p>
  </div>
</template>
