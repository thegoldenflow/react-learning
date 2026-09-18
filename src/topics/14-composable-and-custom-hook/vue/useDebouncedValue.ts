/**
 * Composable：useDebouncedValue（对照 React 版 react/useDebouncedValue.ts）。
 *
 * 用法：const debouncedKeyword = useDebouncedValue(keyword, 500)，也可以传 getter：useDebouncedValue(() => props.q, 500)
 * source 停止变化 delay 毫秒后，返回的 ref 才追上来。
 *
 * 和 React 版的差别：
 * - 入参是 MaybeRefOrGetter，用 toValue() 取值（Vue 3.3 起）；返回 Ref 容器。React 版收发的都是普通值。
 * - 这里用 watch + onWatcherCleanup（Vue 3.5 起）清掉上一个定时器，和 React 的 cleanup 一一对应：
 *   source 变化时先清旧定时器再重新计时；组件卸载时 watcher 随之停止，清理函数同样会执行，不用另写 onUnmounted。
 * - Vue 里也可以把定时器 id 放在 setup 作用域的 let 变量里（setup 只执行一次，它一直是同一个变量）——
 *   区块三的 LetTimerDemo.vue 演示了这种写法在 Vue 里是对的、搬到 React 里就坏了。
 * 真实 Vue 项目一般直接用 VueUse 的 refDebounced / watchDebounced / useDebounceFn，不必手写。
 */
import { onWatcherCleanup, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

export function useDebouncedValue<T>(source: MaybeRefOrGetter<T>, delay: number): Ref<T> {
  // ref() 的返回类型会对 T 做深层解包（UnwrapRef），T 未确定时 TS 认不出它就是 Ref<T>，所以断言一次；
  // 泛型工具型 composable 常见此写法，日常写具体类型（ref('')）时不会遇到
  const debounced = ref(toValue(source)) as Ref<T>

  // 不加 immediate：初始值在上面已经取过一次，首屏不用白等 delay
  watch(
    () => toValue(source),
    (value) => {
      const timer = setTimeout(() => {
        debounced.value = value
      }, delay)
      onWatcherCleanup(() => clearTimeout(timer))
    },
  )

  return debounced
}
