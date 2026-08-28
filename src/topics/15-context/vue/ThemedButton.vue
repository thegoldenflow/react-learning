<script setup lang="ts">
/**
 * 深层组件二：除了读 theme，还拿到 toggleTheme——
 * 注入值里既放数据也放修改函数，深层组件可以直接触发根组件的状态更新。
 * React 版一致：Context 的 value 里既有 theme 也有 toggleTheme。
 */
import { THEME_STYLES, useTheme } from './theme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    :style="THEME_STYLES[theme]"
    @click="toggleTheme"
  >
    切换到 {{ theme === 'light' ? 'dark' : 'light' }} 主题
  </button>
</template>
