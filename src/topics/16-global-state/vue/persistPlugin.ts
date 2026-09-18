/**
 * 16 题的迷你持久化插件：Pinia 的「插件」对应 Zustand 的 persist 中间件。
 *
 * - Pinia 的扩展方式是 pinia.use(plugin)：插件在每个 store 创建时执行一次，拿到 { store, options, pinia, app }
 *   （pinia.vuejs.org core-concepts/plugins）。Zustand 的扩展方式是把创建函数一层层包起来（中间件）。
 * - 这里用插件读 defineStore 第三个参数里的自定义选项 persist（下面 declare module 给它加了类型），
 *   创建时从 localStorage 读出来 $patch 进去，之后用 $subscribe 在每次变化后写回。
 * - 演示简化：真实项目一般用社区插件 pinia-plugin-persistedstate（本仓库没装，只作线索）；
 *   服务端渲染时没有 localStorage，这里做了判断直接跳过。
 *
 * 注册：壳应用的 VueMount 每次挂载都 app.use(createPinia())，本题在注册表的 vuePlugins 里
 * 用 topic16PiniaSetup 把插件装到这个新 pinia 上（src/shell/topicRegistry.ts）。
 */
import type { Plugin, UnwrapRef } from 'vue'
import type { PiniaPluginContext, StateTree } from 'pinia'

export interface PersistOptions<S extends StateTree> {
  /** localStorage 的键 */
  key: string
  /** 白名单：只存这些 state 字段（对应 Zustand persist 的 partialize） */
  pick: Array<keyof S & string>
  /** 数据结构有破坏性变化时加 1 */
  version: number
  /** 存储里的版本号和 version 不一致时，把旧数据转成新结构；不提供就丢弃旧数据 */
  migrate?: (persisted: unknown, fromVersion: number) => Partial<UnwrapRef<S>>
}

declare module 'pinia' {
  // 声明合并：泛型参数要和 pinia 原来的声明保持一致（S、Store）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 同名接口合并要求泛型参数完全一致，Store 在这里用不到也必须写上
  export interface DefineStoreOptionsBase<S extends StateTree, Store> {
    /** 16 题 persistPlugin 读取的选项 */
    persist?: PersistOptions<S>
  }
}

interface StoredValue {
  state: Record<string, unknown>
  version: number
}

function isStoredValue(value: unknown): value is StoredValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as StoredValue).version === 'number' &&
    typeof (value as StoredValue).state === 'object' &&
    (value as StoredValue).state !== null
  )
}

export function persistPlugin({ store, options }: PiniaPluginContext) {
  const persist = options.persist
  if (!persist || typeof localStorage === 'undefined') return

  // 1. 水合：读出来、校验版本、必要时 migrate，再用 $patch 一次性写进 store
  try {
    const raw = localStorage.getItem(persist.key)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    if (isStoredValue(parsed)) {
      const state =
        parsed.version === persist.version ? parsed.state : persist.migrate?.(parsed.state, parsed.version)
      // 函数形式的 $patch：一次写入多个字段，只触发一次 $subscribe
      if (state) store.$patch((draft) => Object.assign(draft, state))
    }
  } catch {
    // 存储里的数据坏了（手改、旧代码写的）：忽略，用初始值。生产里可以顺手删掉这一项
  }

  // 2. 之后每次变化写回。
  // - detached: true：不跟着任何组件卸载而取消（插件里本来也没有组件，写出来表明意图）。
  // - flush: 'sync'：每次修改都立刻回调。默认的 'pre' 会把同一个 tick 里的修改合并成一次，但有一个坑（Pinia 文档的提示原文见
  //   Example.tsx 三）：$patch 之后同一个 tick 里紧接着的直接修改，不会再单独触发回调 —— 用默认值时，那次修改就漏存了
  //   （Example.test.ts 有复现）。代价是改得频繁时每次都写一遍 localStorage；数据大、改得勤的话再加防抖。
  const save = () => {
    const picked = Object.fromEntries(persist.pick.map((k) => [k, store.$state[k]]))
    localStorage.setItem(persist.key, JSON.stringify({ state: picked, version: persist.version }))
  }
  store.$subscribe(save, { detached: true, flush: 'sync' })
}

/** 给注册表 vuePlugins 用的 Vue 插件：把 persistPlugin 装到当前 app 的 pinia 上（pinia 安装时会设置 $pinia） */
export const topic16PiniaSetup: Plugin = {
  install(app) {
    app.config.globalProperties.$pinia.use(persistPlugin)
  },
}
