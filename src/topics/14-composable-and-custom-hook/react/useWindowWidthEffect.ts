/**
 * 并排【18 之前的写法 · 简单场景仍可用】：useEffect + setState 订阅窗口宽度。
 * 主线见 useWindowWidth.ts（useSyncExternalStore）。存量代码里这种写法最多，读得懂、也能跑，
 * 但官方在「订阅外部数据源」这件事上已经改推 useSyncExternalStore（原文见 Example.tsx 二-3）。
 *
 * 和主线比差在哪（前提写清楚）：
 * 1. 并发渲染（React 18 起，startTransition 等非阻塞更新）时，外部数据可能在一次渲染的中途变化，同一屏的不同组件读到不同版本
 *    （社区叫 tearing，撕裂）。useSyncExternalStore 在提交前会再核对一次快照，保证「every component on screen is reflecting the same version
 *    of the store」（useSyncExternalStore 页 Caveats 原文）；Effect 版没有这道检查。
 *    只用同步更新的普通页面上，两种写法看起来一样（本课区块一里两个数字始终相同）。
 * 2. 首次渲染时读 window：服务端渲染没有 window，useState 的初始化函数会直接报错；
 *    useSyncExternalStore 有 getServerSnapshot 专门处理这件事。
 * 3. 要自己保证「挂监听 + cleanup 卸监听」配对；依赖写 [] 表示依赖不变就不重跑
 *    （开发环境 StrictMode 会额外跑一轮 setup + cleanup 来检验 cleanup 写没写对）。
 */
import { useEffect, useState } from 'react'

export function useWindowWidthEffect(): number {
  // 惰性初始化（传函数）：初始值只在首次渲染计算一次。window.innerWidth 很便宜，这里主要是示范写法
  const [width, setWidth] = useState(() => window.innerWidth)

  useEffect(() => {
    // setState 写在事件回调里（异步触发），不是在 Effect 体里同步调用，所以不违反 set-state-in-effect
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width
}
