/**
 * 题 15 的注入 key、类型与 useTheme composable（Vue 侧，不是知识点主文件）。
 *
 * InjectionKey<T> 是一个「带类型的 Symbol」：provide 和 inject 用同一个 key，
 * inject(THEME_KEY) 就能自动推断出 ThemeInjection——对应 React 侧
 * createContext<ThemeContextValue | null>(null) 的类型参数。
 */
import { inject, type CSSProperties, type InjectionKey, type Ref } from 'vue'

export type Theme = 'light' | 'dark'

export interface ThemeInjection {
  /** 只读 ref：深层组件只能读，改主题必须走 toggleTheme（保护单向数据流） */
  theme: Readonly<Ref<Theme>>
  toggleTheme: () => void
}

export const THEME_KEY: InjectionKey<ThemeInjection> = Symbol('topic15-theme')

/** 两套主题的实际样式（全局 CSS 不含主题色，用内联样式演示，与 React 版一致；CSSProperties 类型对应 React 的同名类型） */
export const THEME_STYLES: Record<Theme, CSSProperties> = {
  light: { background: '#ffffff', color: '#1f2937', border: '1px solid #d1d5db' },
  dark: { background: '#1f2937', color: '#f9fafb', border: '1px solid #4b5563' },
}

/**
 * 与 React 侧完全相同的工业惯例：封装 useTheme()，注入不到就 throw——
 * 把「忘了 provide」变成开发期就炸的明确错误，同时返回类型收窄为 ThemeInjection，
 * 调用方不用判空。React 里这一步是 useContext(ThemeContext) === null 时 throw 的自定义 Hook。
 */
export function useTheme(): ThemeInjection {
  const ctx = inject(THEME_KEY)
  if (!ctx) {
    throw new Error('useTheme() 必须在 provide(THEME_KEY) 的组件树内部使用——是否忘了 provide？')
  }
  return ctx
}
