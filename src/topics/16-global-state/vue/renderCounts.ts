/**
 * 渲染计数（演示用）：对照 react/renderCounts.tsx 的 <Profiler>。
 * 每个被计数的组件在 onMounted / onUpdated 里记一次 —— onUpdated 只在「这个组件自己的渲染函数重新执行并更新了 DOM」后调用，
 * 子组件更新不会触发父组件的 onUpdated，所以数出来的是组件级的重渲染次数。
 * 计数对象由区块根组件 provide、被计数的组件 inject（provide / inject 就是 Vue 里的「Context」，15 题）。
 */
import { inject, onMounted, onUpdated, provide, reactive, type InjectionKey } from 'vue'

export function createRenderCounts() {
  const counts = reactive<Record<string, number>>({})
  return {
    counts,
    record(id: string) {
      counts[id] = (counts[id] ?? 0) + 1
    },
    reset() {
      for (const key of Object.keys(counts)) delete counts[key]
    },
  }
}

export type RenderCounts = ReturnType<typeof createRenderCounts>

const RENDER_COUNTS_KEY: InjectionKey<RenderCounts> = Symbol('topic16-render-counts')

export function provideRenderCounts(counts: RenderCounts) {
  provide(RENDER_COUNTS_KEY, counts)
}

/** 在被计数的组件 setup 里调用；没有 provide 时什么也不做（单独挂载组件做测试也能用） */
export function useRenderCount(id: string) {
  const counts = inject(RENDER_COUNTS_KEY, null)
  if (!counts) return
  onMounted(() => counts.record(id))
  onUpdated(() => counts.record(id))
}
