/**
 * 30 题的 Vue Query 插件工厂 —— 对应 React 侧 Example.tsx 里的
 *   const [queryClient] = useState(() => createDemoQueryClient())
 *   <QueryClientProvider client={queryClient}>…</QueryClientProvider>
 *
 * 两边做的是同一件事：造一个 QueryClient（缓存本体 + 默认配置），再「注入」给整棵组件树 ——
 * React 用 Context（QueryClientProvider），Vue 用插件 + provide（VueQueryPlugin 的 install 里 app.provide）；
 * 组件里两边都用 useQueryClient() 取回它。@tanstack/react-query 与 @tanstack/vue-query 是同一个
 * @tanstack/query-core 外面的两层框架适配，这个文件装的是 Vue 那一层。
 *
 * 为什么是「工厂函数」而不是直接 export 一个插件实例（与 18 题 router.ts 的理由相同）：
 * 壳应用（VueMount）每次挂载都会新建一个 Vue 应用，React 19 的 StrictMode 在开发期还会挂载两次；
 * QueryClient 会 mount / unmount 自己的事件监听，不能跨两个 createApp 复用，所以每次挂载都新建一个。
 * 这也意味着「离开本题再进来」拿到的是全新的空缓存 —— 真实应用里 QueryClient 在 main.ts 只建一次。
 *
 * 为什么要在 VueQueryPlugin 外面再包一层：
 * 壳应用安装插件时是 app.use(plugin) 不传 options，而 QueryClient 只能通过 options 传给 VueQueryPlugin，
 * 所以这里返回一个自己的 install(app)，在里面 app.use(VueQueryPlugin, { queryClient })。
 *
 * 不要在这里手动 queryClient.unmount()：VueQueryPlugin.install 已经调用了 client.mount()，
 * 并通过 app.onUnmount 注册了 client.unmount()（vue-query 5.102.8 的 vueQueryPlugin.js:15、:26-30）；
 * 再手动调一次会让它内部的挂载计数变成负数。
 * 开发期看缓存：@tanstack/vue-query-devtools，或者给 VueQueryPlugin 传 enableDevtoolsV6Plugin: true
 * 接入 Vue Devtools（vueQueryPlugin.d.ts:5-7）。本课没装 devtools。
 */
import type { App, Plugin } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createDemoQueryClient } from './ordersDemo'

/** 壳应用约定的入口函数名（见 topicRegistry.ts 的 vuePlugins 工厂），不能改 */
export function createTopic30QueryPlugin(): Plugin {
  // 配置与 React 侧逐字一致（retry: false、staleTime 5 秒、关掉窗口聚焦重取），两边的缓存行为才可对照
  const queryClient = createDemoQueryClient()
  return {
    install(app: App) {
      app.use(VueQueryPlugin, { queryClient })
    },
  }
}
