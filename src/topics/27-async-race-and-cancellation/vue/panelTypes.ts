/**
 * 27 题 Vue 侧共享类型。
 * 单独成文件是因为 <script setup> 的 SFC 不能 export 类型，而 Example.vue 与 ResultPanel.vue 都要用到 PanelState；
 * React 侧同一个联合类型直接写在 Example.tsx 里（ResultPanel 也在同一个文件）。
 */
import type { User } from '@/shared/types'

/**
 * 面板状态：判别联合（11 题的建模方式）。success 里多存一个 forKeyword ——
 * 「这份列表是哪个关键词的结果」，页面据此判断列表有没有被过期响应覆盖。
 * idle 是本题特有的一档：关键词为空时不发请求，也就没有 loading。
 */
export type PanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; users: User[]; forKeyword: string }
  | { status: 'error'; message: string }
