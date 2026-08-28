/**
 * ReactIsolatedMount —— 把某个 React 示例挂载到一棵独立的 React 树（项目基础设施，不是知识点）。
 *
 * 为什么需要它：React Router 规定一棵组件树里只能有一个 <Router>
 * （报错 "You cannot render a <Router> inside another <Router>"）。
 * 壳应用本身用 BrowserRouter，而 18 题的示例内部要用 MemoryRouter，
 * 因此该示例必须用 createRoot 挂进一棵全新的 React 树，摆脱外层的 Router 上下文。
 * 这和 VueMount 挂载 Vue 组件是同一个思路：宿主 div 归外层 React 管，
 * 它的子节点归内层这棵独立 React 树管。
 */
import { StrictMode, useEffect, useRef, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'

interface ReactIsolatedMountProps {
  /** 示例组件的懒加载器（import.meta.glob 的产物） */
  load: () => Promise<{ default: ComponentType }>
}

export function ReactIsolatedMount({ load }: ReactIsolatedMountProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let root: Root | null = null

    void load().then((mod) => {
      if (cancelled) return
      const Example = mod.default
      root = createRoot(host)
      // 独立树不继承外层的 StrictMode，这里手动补上，保持与壳应用一致的开发期检查
      root.render(
        <StrictMode>
          <Example />
        </StrictMode>,
      )
    })

    return () => {
      cancelled = true
      root?.unmount()
      root = null
    }
  }, [load])

  return <div ref={hostRef} />
}
