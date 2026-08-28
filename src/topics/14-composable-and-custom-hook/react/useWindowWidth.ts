/**
 * 自定义 Hook：useWindowWidth —— 订阅窗口 resize，返回当前窗口宽度。
 * （对照 Vue 版 vue/useWindowWidth.ts —— 那是一个 composable。）
 *
 * 自定义 hook = 以 use 开头、内部调用了其他 hook 的【普通函数】，不需要任何注册/声明步骤。
 * 提取出去的是「逻辑」而不是「状态」：每个调用方都得到一份完全独立的 state 和事件订阅。
 * use 前缀不是命名品味：eslint-plugin-react-hooks 靠它识别「这是 hook」，
 * 才能对它检查 Hooks 规则（顶层调用、顺序稳定）—— 硬规则；Vue 的 use 前缀只是社区约定。
 */
import { useEffect, useState } from 'react'

export function useWindowWidth(): number {
  // 惰性初始化（传函数）：初始值只在首次渲染计算一次。window.innerWidth 很便宜，
  // 这里主要是示范写法 —— 当初始值来自昂贵计算时必须这么写，否则每次渲染都白算一遍。
  // Vue 版直接 ref(window.innerWidth) 即可：setup 本来就只执行一次，不存在这个问题。
  const [width, setWidth] = useState(() => window.innerWidth)

  // 订阅外部系统（window 的 resize 事件）是标准的 effect 场景。
  // 依赖 []：订阅一次即可，永远不需要重跑；卸载时由 cleanup 移除。
  // Vue 版把「挂监听 / 卸监听」拆成 onMounted / onUnmounted 两个钩子，React 用一个 effect 表达。
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)

    // cleanup 移除监听器 —— 对应 Vue 的 onUnmounted。
    // StrictMode 开发期会把组件「挂载→卸载→重挂载」跑两遍来检验它：少了这行，
    // 监听器会越挂越多（内存泄漏 + 重复 setState）。Vue 没有对应机制。
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 返回普通的 number：组件每次重渲染都会重新执行本 hook、拿到当下的值。
  // Vue 的 composable 返回 Ref<number>（容器引用不变、.value 在变）——
  // 因为 setup 只执行一次，必须交出一个「能持续追踪」的容器。使用手感不同，注意区分。
  return width
}
