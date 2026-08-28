/**
 * VueMount —— 在 React 组件树里挂载一个 Vue 组件的桥接组件（项目基础设施，不是知识点）。
 *
 * 原理：
 * - React 负责渲染并拥有这个宿主 <div>；Vue 只接管它的「子节点」，两个框架互不触碰对方的 DOM。
 * - useEffect 里 createApp().mount()，cleanup 里 app.unmount() 完整销毁
 *   （watcher 停止、onUnmounted 执行、DOM 清空），因此 React 19 StrictMode
 *   开发期的「挂载→卸载→重挂载」双调用是安全的。
 * - 每次挂载都新建一个 Pinia，示例之间的 store 状态互不串扰。
 * - 插件（如 18 题的 vue-router）必须以工厂函数传入：StrictMode 会挂载两次，
 *   router 实例不能跨两个 createApp 复用。
 */
import { useEffect, useRef } from 'react'
import {
  createApp,
  type App as VueApp,
  type Component as VueComponent,
  type Plugin as VuePlugin,
} from 'vue'
import { createPinia } from 'pinia'

interface VueMountProps {
  /** 要挂载的 Vue 组件（.vue 文件的默认导出，或 defineAsyncComponent 的结果） */
  component: VueComponent
  /** 额外 Vue 插件的工厂函数，每次挂载都会重新调用（支持异步，便于懒加载） */
  createPlugins?: () => VuePlugin[] | Promise<VuePlugin[]>
}

export function VueMount({ component, createPlugins }: VueMountProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  // 「latest ref」模式：effect 的依赖只有 component。
  // 内联传入的 createPlugins={() => [...]} 每次渲染都是新函数，
  // 若放进依赖数组会导致 Vue 应用在每次 React 渲染时反复重挂载。
  const createPluginsRef = useRef(createPlugins)
  createPluginsRef.current = createPlugins

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let app: VueApp | null = null

    void (async () => {
      const plugins = (await createPluginsRef.current?.()) ?? []
      if (cancelled) return
      app = createApp(component)
      app.use(createPinia())
      for (const plugin of plugins) {
        app.use(plugin)
      }
      app.mount(host)
    })()

    return () => {
      cancelled = true
      app?.unmount()
      app = null
    }
  }, [component])

  return <div ref={hostRef} className="vue-host" />
}
