/**
 * 自定义 Hook【主线】：useWindowWidth —— 订阅窗口 resize，返回当前窗口宽度。
 * 订阅「React 之外的可变数据源」（浏览器 API、第三方 store）官方首选 useSyncExternalStore【主流·18.0 起】。
 * 对照：useWindowWidthEffect.ts（useEffect + setState 订阅，18 之前的写法，简单场景仍可用）；
 * Vue 版 vue/useWindowWidth.ts（composable：ref + onMounted / onUnmounted）。
 *
 * 自定义 Hook = 以 use 开头、内部调用了其他 Hook 的普通函数，不需要注册。
 * 复用的是「逻辑」不是「状态」：每个调用方都得到自己的一份订阅。
 * use 前缀是 eslint-plugin-react-hooks 识别 Hook 的依据（7.1.1 的判定是 use 后面紧跟大写字母或数字），它靠这个才能检查 Hooks 规则。
 *
 * useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) 三个参数：
 * - subscribe(onStoreChange)：开始监听，返回取消监听的函数。写在模块顶层，每次渲染传进去的都是同一个函数 ——
 *   每次渲染传一个新函数，React 会退订再重订（区块一的实验能数出来，Example.tsx 二-4）。
 * - getSnapshot()：读当前值。连续两次调用、数据源没变时必须返回相同的值（Object.is）；
 *   这里返回 number，天然满足。要是每次 return 一个新对象，React 会认为一直在变，开发环境报
 *   「The result of getSnapshot should be cached to avoid an infinite loop」（有测试）。
 * - getServerSnapshot()：只在服务端渲染和 hydration 时用。服务端没有 window，也不知道用户的窗口多宽，
 *   所以返回 null，让组件自己决定「未知」时显示什么；不传这个参数，服务端渲染会直接报错（有测试，33 题待新增）。
 */
import { useDebugValue, useSyncExternalStore } from 'react'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('resize', onStoreChange)
  return () => window.removeEventListener('resize', onStoreChange)
}

const getSnapshot = () => window.innerWidth
const getServerSnapshot = () => null

export function useWindowWidth(): number | null {
  const width = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // useDebugValue：在 React DevTools 里给这个自定义 Hook 显示一个标签（「useWindowWidth: 1280px」）。
  // 官方建议只给共享库里的 Hook 加；这里加上是为了演示写法。第二个参数是格式化函数，只在 DevTools 查看时才调用。
  useDebugValue(width, (w) => (w === null ? '服务端未知' : `${w}px`))

  // 返回普通值：组件每次渲染都会重新执行本 Hook、拿到当下的值。
  // Vue 的 composable 返回 Ref 容器（setup 只执行一次，必须交出一个能持续追踪的容器）。
  return width
}
