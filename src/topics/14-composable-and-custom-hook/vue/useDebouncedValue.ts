/**
 * Composable：useDebouncedValue（对照 React 版 react/useDebouncedValue.ts）。
 *
 * 用法：const debouncedKeyword = useDebouncedValue(keyword, 500)
 * source 停止变化 delay 毫秒后，返回的那个 ref 才追上来。
 *
 * 与 React 版的差别一眼可见：入参是 Ref<T>、返回也是 Ref<T>（容器），
 * React 版收发的都是普通值 —— 因为 React 的组件函数每次渲染整体重跑，Vue 的 setup 只跑一次。
 */
import { onUnmounted, ref, watch } from 'vue'
import type { Ref } from 'vue'

export function useDebouncedValue<T>(source: Ref<T>, delay: number): Ref<T> {
  // 泛型 composable 里的一个 TypeScript 细节（与防抖主线无关）：ref() 的返回类型带条件类型
  // 和 UnwrapRef（对象会被深层解包），T 还没确定时 TS 不认它就是 Ref<T>，所以显式断言一次。
  // 泛型工具型 composable 常见此写法；日常写具体类型（ref('')）时不会遇到。
  const debounced = ref(source.value) as unknown as Ref<T>

  // 【与 React 最关键的差异，两句话】
  // 定时器 id 在 Vue 里就是 setup 作用域里的一个普通 let 变量 —— composable / <script setup> 只执行一次，
  // 这个变量天然跨越所有更新一直活着，clearTimeout 和 setTimeout 自然配得上对。
  // React 里这么写会翻车：组件函数每次渲染都重新执行，函数体里的 let timer 每次都是全新的一份，
  // 所以 React 版把定时器 id 留在 effect 回调的闭包里、靠 cleanup 配对（或者存进 useRef，见 12 题「用途二」）。
  // 反过来说：React 用 useRef 当「跨渲染可变值容器」这件事，在 Vue 里没有对应物 ——
  // Vue 压根不需要这样一个容器，setup 作用域里的普通变量就够了，没有一一对应关系。
  let timer: ReturnType<typeof setTimeout> | undefined

  // React 版的依赖数组 [value, delay] ≈ 这里的 watch(source, ...)。
  // 不加 immediate：初始值在上面创建 debounced 时已经取过一次，首屏不用白等 delay。
  watch(source, (value) => {
    // 与 React 版同一个要点：每次值变化，先掐掉上一个还没到点的定时器，只让最后一次存活 ——
    // 这一步就是防抖算法本身，去掉它就只是「每次输入统统延后 delay」，一次请求都不会少发。
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  // React 版组件卸载时会自动执行同一个 cleanup（一个函数覆盖「下一轮前」和「卸载前」两个时机）；
  // Vue 要显式补一个 onUnmounted，否则组件都没了定时器还会再触发一次写值。
  onUnmounted(() => {
    if (timer !== undefined) clearTimeout(timer)
  })

  // 防抖 vs 节流（与 React 版同一条）：防抖 = 停手 delay 后执行一次；节流 = 每 delay 至多执行一次。
  // 真实 Vue 项目一般直接用 VueUse 的 useDebounce / refDebounced / watchDebounced，不必手写；
  // 手写版是为了讲清「watch + 定时器 + 清理」这条链路（React 那边则是面试必考的手写题）。
  return debounced
}
