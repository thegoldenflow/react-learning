<script setup lang="ts">
/**
 * 学习主题：Context 跨层传值（主题切换）
 *
 * React 核心概念：
 * - 问题：props 要穿过一堆根本不关心它的中间层组件（prop drilling）；Context 让深层组件「跳过中间层」直接读
 * - createContext 创建 Context；根组件用 <ThemeContext value={...}> 提供；深层组件用 useContext 读取
 * - 工业惯例：不直接暴露 useContext(ThemeContext)，而是封装 useTheme() 自定义 Hook，
 *   缺 Provider 时直接 throw——把「忘了包 Provider」变成开发期就炸的明确错误
 * - Context 适合低频全局数据（主题 / 登录用户 / 语言），不是完整状态管理方案，不要拿它当 store
 *   （高频复杂共享状态见 16 题 Zustand）
 * - 重渲染问题：value 一变，所有消费组件全部重渲染；value 是对象时若每次渲染新建，
 *   引用次次不同 = 次次「变化」→ 全员无谓重渲染。工业标准写法：useMemo 包 value（+ useCallback 稳定其中的函数）
 *
 * Vue 对应概念：
 * - provide / inject 解决同一个问题；InjectionKey<T> 提供类型安全（inject 能自动推断出 T）
 * - 同样的工业惯例：封装 useTheme() composable，inject 不到就 throw
 * - provide 传响应式对象（ref）时依赖追踪是属性级的，天然没有「value 引用变化导致全员重渲染」的问题
 *
 * 最重要的区别：
 * - React Context 以「value 的引用」为粒度判定变化：引用一变，所有 useContext 的组件整体重渲染，
 *   所以才需要 useMemo 包 value
 * - Vue 的 provide 传的是响应式对象（setup 只执行一次，对象只创建一次），更新粒度是
 *   「谁读了哪个属性谁更新」——两边的更新粒度模型没有一一对应关系
 */
import { provide, readonly, ref } from 'vue'
import { THEME_KEY, type Theme } from './theme'
import MiddleLayer from './MiddleLayer.vue'
import ThemedCard from './ThemedCard.vue'
import ThemedButton from './ThemedButton.vue'

// 主题的「真身」仍是根组件的普通 ref——provide 只负责「传」，不负责「存」
const theme = ref<Theme>('light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

// provide 是 setup 里的一行函数调用（React 里对应 JSX 包裹 <ThemeContext value={value}>）。
// 传下去的对象只创建这一次（setup 只执行一次），且 theme 是响应式 ref：
// 深层组件读 theme.value 时建立「属性级」依赖，theme 一变只有真正读它的组件更新。
// React 那边必须 useCallback 稳定 toggleTheme + useMemo 包 value，否则根组件每次渲染
// 新建对象引用、所有消费组件连坐重渲染——Vue 的响应式模型天然没有这个问题，这里无需任何包装。
// readonly() 防止深层组件直接改 theme.value，改主题只能走 toggleTheme。
provide(THEME_KEY, { theme: readonly(theme), toggleTheme })
</script>

<template>
  <MiddleLayer>
    <ThemedCard />
    <ThemedButton />
  </MiddleLayer>
</template>
