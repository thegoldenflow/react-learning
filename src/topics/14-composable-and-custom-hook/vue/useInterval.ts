/**
 * Composable：useInterval（对照 React 版 react/useInterval.ts）。
 *
 * React 那边要用 useEffectEvent 才能「读到最新回调、又不因回调变化重建定时器」；Vue 不需要：
 * setup 只执行一次，callback 是同一个函数，它里面读的 ref 每次读到的都是当前值，没有过期闭包。
 *
 * delay 收 MaybeRefOrGetter：调用方可以传普通值、ref 或 getter（() => paused.value ? null : 1000），
 * 用 toValue()（Vue 3.3 起）统一取值 —— 官方 composables 文档「Input Arguments」的写法。
 * 要对入参做响应式副作用，就在 watch 的 getter 里调用 toValue，delay 一变就重建定时器。
 * onWatcherCleanup（Vue 3.5 起）注册清理：下一次重建前、以及组件卸载时 watcher 停止时都会执行（对应 React effect 的 cleanup）。
 */
import { onWatcherCleanup, toValue, watch, type MaybeRefOrGetter } from 'vue'

export function useInterval(callback: () => void, delay: MaybeRefOrGetter<number | null>): void {
  watch(
    () => toValue(delay),
    (ms) => {
      if (ms === null) return // null 表示暂停
      const id = setInterval(callback, ms)
      onWatcherCleanup(() => clearInterval(id))
    },
    { immediate: true },
  )
}
