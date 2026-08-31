/**
 * 自定义 Hook：useDebouncedValue —— 把一个「变得很快」的值，延迟 delay 毫秒再吐出来。
 * （对照 Vue 版 vue/useDebouncedValue.ts —— 那是一个 composable。）
 *
 * 用法：const debouncedKeyword = useDebouncedValue(keyword, 500)
 * keyword 每敲一个字符就重新计时；只有「停手超过 delay」才把最后那个值更新到返回值上。
 *
 * 本文件是「手写防抖」的标准答案，面试现场高频手写题。下面每条注释都对应一个标准追问点。
 */
import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delay: number): T {
  /**
   * 泛型 <T>：对被防抖的值不做任何类型假设（string / number / 对象都能用），
   * 调用处 useDebouncedValue(keyword, 500) 传进来的是 string，返回值就自动是 string。
   *
   * 初始值直接用 value 而不是空值：首屏不该白等 delay 毫秒才有内容。
   */
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  /**
   * 防抖的全部秘密就在这个 effect 的「setTimeout + cleanup 里 clearTimeout」上。
   *
   * 依赖是 [value, delay]，所以 value 每变一次，React 都会：
   *   ① 先执行上一轮 effect 的 cleanup（clearTimeout，掐掉上一个还没到点的定时器）
   *   ② 再执行本轮 effect（重新 setTimeout 计时）
   *
   * 【为什么 cleanup 里必须 clearTimeout】—— 这是面试的第一个追问。
   * 如果去掉 clearTimeout：每敲一个字符都会挂上一个独立的定时器，delay 毫秒后它们逐个到期，
   * setDebouncedValue 被调用 N 次 —— 结果只是把每次输入整体「延后」了 delay，
   * 请求一次没少发，完全不是防抖。
   * 「每次值变化，先把上一个待执行的定时器取消掉，只让最后一次存活」才是防抖的本质定义；
   * clearTimeout 不是顺手做的清理，它就是算法本身。
   * （顺带：组件卸载时 React 也会执行这个 cleanup，所以不会有「组件都没了，定时器还在往里 setState」的隐患。）
   *
   * 【Vue 老手最容易想错的一条 —— 定时器 id 该存在哪】
   * Vue 里防抖会很自然地写成：setup 作用域里 `let timer`，watch 回调里 clearTimeout(timer) 后重新赋值。
   * 这在 Vue 成立，是因为 <script setup> 只执行一次，timer 是一个「长期活着」的闭包变量。
   * React 完全不同：组件函数每次渲染都从头到尾重新执行一遍，函数体里的普通局部变量
   * （`let timer` / `const timer`）每次渲染都是全新的一份，上一次渲染攒的值直接丢失。
   * 所以在 React 里，跨渲染需要活下来的定时器 id 只有两个正规去处：
   *   ① 本实现这样，让它待在 effect 回调的闭包里，靠 React 保证「下一轮 setup 前先跑上一轮 cleanup」
   *      来配对 setTimeout / clearTimeout（推荐：不需要额外容器，配对天然正确）；
   *   ② 存进 useRef（12 题的「用途二：跨渲染保存可变值」）—— 当你需要在事件处理器里
   *      手动 cancel/flush 时才需要它。
   * 「Vue 那套 let timer 直接搬进 React 组件函数体」是 Vue 转 React 最典型的翻车点，
   * 现象是防抖时灵时不灵（因为每次渲染都在跟一个全新的、值为 undefined 的 timer 打交道）。
   *
   * 【防抖 vs 节流，一句话】
   * 防抖 debounce = 事件停止 delay 后才执行一次（适合搜索联想、表单校验，只关心最终值）；
   * 节流 throttle = 每 delay 至多执行一次（适合 scroll / resize / 拖拽，过程中就要持续响应）。
   *
   * 【工业界现状 —— 也是常见追问】
   * 真实项目很少手写：JS 侧用 lodash.debounce，React 侧用 ahooks 的 useDebounce / useDebounceFn，
   * 或者干脆交给 TanStack Query（把 debounce 后的关键词当 queryKey，缓存与竞态一并解决）。
   * 但面试要考的就是这段手写版 —— 它能同时暴露你对 effect 依赖、cleanup 时机和闭包的理解。
   * 本示例遵守项目约定不引入任何第三方库。
   *
   * 补充：useState 与 useEffect 都在本函数【顶层】无条件调用 —— 自定义 hook 自身同样受 Hooks 规则约束，
   * 不能把它们塞进 if / 循环 / 嵌套函数。
   */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  // 返回普通值（不是容器）：调用方所在的组件每次重渲染都会重新执行本 hook 拿到当下的值。
  // Vue 版必须返回 Ref<T> 容器，因为它的 setup 只跑一次 —— 使用手感不同，注意区分。
  return debouncedValue
}
