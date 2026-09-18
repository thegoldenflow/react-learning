/**
 * 自定义 Hook 接收回调：useInterval(callback, delay)。
 * 对照 Vue 版 vue/useInterval.ts（setup 只跑一次，回调天然读到最新的 ref，不需要这层处理）。
 *
 * 问题：调用方每次渲染都会传一个新的箭头函数进来。回调要是放进 Effect 的依赖，
 * 每次渲染都会 clearInterval + setInterval —— 父组件重渲染得比 delay 还勤时，定时器等不到触发（区块二的「干扰」开关）。
 * 不放进依赖又会读到旧的闭包（过期闭包，26 题）。
 *
 * 官方给自定义 Hook 的做法：用 useEffectEvent【较新·19.2 起】把回调包一层。
 * Effect Event 里读到的是最新一次渲染的 props / state，而它自己不算 Effect 的依赖，
 * 所以依赖数组里只剩 delay：delay 变了才重建定时器。
 * 约束（useEffectEvent 页的 Caveats）：只能在 Effect 里调用（这里在 setInterval 的回调里调用，定时器是 Effect 建的）；
 * 不要传给别的组件或 Hook；不要拿它来「骗过」依赖检查。React 18 项目没有这个 API，用 latest ref 模式（26 题）。
 */
import { useEffect, useEffectEvent } from 'react'

export function useInterval(callback: () => void, delay: number | null): void {
  const onTick = useEffectEvent(callback)

  useEffect(() => {
    if (delay === null) return // 传 null 表示暂停
    const id = setInterval(() => onTick(), delay)
    return () => clearInterval(id)
  }, [delay])
}

/**
 * ❌ 反例：把回调直接放进依赖。能读到最新值，但每次渲染都会重建定时器。
 * 只为了在区块二里和上面的写法并排比较；不要这样写。
 */
export function useIntervalNaive(callback: () => void, delay: number | null): void {
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(callback, delay)
    return () => clearInterval(id)
  }, [callback, delay])
}
