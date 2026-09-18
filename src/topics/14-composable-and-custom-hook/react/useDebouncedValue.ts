/**
 * 自定义 Hook：useDebouncedValue —— 把一个「变得很快」的值，停手 delay 毫秒后再吐出来。
 * 对照 Vue 版 vue/useDebouncedValue.ts（composable）。
 *
 * 用法：const debouncedKeyword = useDebouncedValue(keyword, 500)
 * keyword 每变一次就重新计时，只有「停手超过 delay」才把最后那个值交出来。
 *
 * 这是自己实现的 Hook：React 没有内置的防抖 Hook（react 包导出的 Hook 里没有），面试常考手写。
 * 它用 useEffect 而不是 useSyncExternalStore：防抖要同步的是「一个定时器」这种副作用，不是读取外部数据源。
 */
import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delay: number): T {
  // 泛型 <T>：string / number / 对象都能防抖；传 string 进来，返回值就是 string。
  // 初始值直接用 value：首屏不该白等 delay 毫秒才有内容。
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  /**
   * 防抖的全部算法就是「setTimeout + cleanup 里 clearTimeout」。依赖是 [value, delay]，value 每变一次 React 都会：
   *   ① 先执行上一轮的 cleanup（clearTimeout，掐掉上一个还没到点的定时器）；
   *   ② 再执行本轮（重新 setTimeout 计时）。
   * 去掉 clearTimeout，每次输入都会各挂一个定时器、各自到点触发 —— 只是整体延后了 delay，请求一次没少发。
   * 组件卸载时 React 也会执行 cleanup，不会留下到点后往已卸载组件里 setState 的定时器。
   * delay 变了同样会先 cleanup 再按新的 delay 重新计时。
   *
   * setState 写在定时器回调里（异步），不是在 Effect 体里同步调用，所以不违反 set-state-in-effect 规则。
   *
   * 定时器 id 存在哪：这里让它待在 Effect 回调的闭包里，靠「下一轮执行前先跑上一轮 cleanup」配对。
   * 另一个去处是 useRef（12 题「用途二」），需要在事件处理函数里手动取消 / 立即执行时才用得上。
   * Vue 那种「setup 作用域里 let timer」的写法搬进 React 组件函数体就会失效：函数体每次渲染都重新执行，
   * let timer 每次都是新的 undefined —— 区块三第二个实验能看到后果。
   */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
