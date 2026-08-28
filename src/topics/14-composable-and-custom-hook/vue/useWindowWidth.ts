/**
 * Composable：useWindowWidth（对照 React 版 react/useWindowWidth.ts）。
 *
 * composable = 以 use 开头的普通函数。use 前缀在 Vue 只是社区约定；
 * React 那边是 lint 强制的硬规则（eslint 靠前缀识别 hook 并检查 Hooks 规则）。
 * 与 React 相同的是「逻辑复用、状态独立」：每次调用都创建全新的 ref 和全新的事件订阅。
 */
import { onMounted, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

export function useWindowWidth(): Ref<number> {
  // React 版是 useState(() => window.innerWidth) 惰性初始化；
  // Vue 的 setup 只执行一次，直接读一次初始值即可，不存在「每次渲染白算」的问题。
  const width = ref(window.innerWidth)

  const handleResize = () => {
    width.value = window.innerWidth
  }

  // React 版用一个 useEffect 表达「挂监听 + cleanup 卸监听」；Vue 拆成 onMounted / onUnmounted。
  // 注意 Vue 侧的约束：这两个钩子必须在 setup【同步执行期间】注册，
  // 所以 composable 不能放进 setTimeout、await 之后再调用 —— 这与 React 的
  // 「顶层调用、顺序稳定」是不同源的两种约束，没有一一对应关系。
  // （React 版还提到 StrictMode 开发期双跑 effect 来检验 cleanup —— Vue 没有对应机制。）
  onMounted(() => window.addEventListener('resize', handleResize))
  onUnmounted(() => window.removeEventListener('resize', handleResize))

  // 返回 Ref 容器（引用不变、.value 在变）—— React 版返回普通 number，
  // 因为组件每次渲染会重新执行整个 hook。使用侧记得 .value（模板里自动解包）。
  return width
}
