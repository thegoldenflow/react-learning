/**
 * Composable：useWindowWidth（对照 React 版 react/useWindowWidth.ts）。
 *
 * composable = 利用组合式 API 封装、复用有状态逻辑的函数；名字以 use 开头是约定（React 那边是 lint 识别 Hook 的依据）。
 * 和 React 一样「共享逻辑、不共享状态」：每次调用都创建新的 ref 和新的事件监听。
 *
 * React 用 useSyncExternalStore 订阅外部数据源；Vue 没有专门的 API，也不需要 ——
 * 官方 composables 文档的 useMouse 示例就是这个写法：onMounted 里加监听、onUnmounted 里移除、把值写进 ref。
 * ref 本身就是「可变的值 + 订阅」，没有 React 并发渲染里的 tearing 问题。
 *
 * 为什么初始值是 null、到 onMounted 才读 window：官方文档要求服务端渲染时「DOM 相关的副作用放在挂载后的钩子里」，
 * setup 里直接读 window 在服务端会报错。对应 React 版 getServerSnapshot 返回 null。
 * 代价是纯客户端应用首次渲染会先显示一次「未知」（React 的 useSyncExternalStore 在纯客户端渲染时直接读 getSnapshot，没有这一帧）；
 * 只做客户端渲染的项目可以直接 ref(window.innerWidth)。
 */
import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export function useWindowWidth(): Ref<number | null> {
  const width = ref<number | null>(null)
  const update = () => {
    width.value = window.innerWidth
  }

  // 生命周期钩子要在 setup 同步执行期间注册（它要找到当前组件实例），所以 composable 不能放进 setTimeout 或 await 之后调用。
  // 这是 Vue 这一侧的限制；React 的限制是「顶层调用、顺序稳定」，两者原因不同（React 文件头「三」）。
  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })
  onUnmounted(() => window.removeEventListener('resize', update))

  // 返回 Ref 容器（引用不变、.value 在变）：setup 只执行一次，必须交出一个能持续追踪的容器
  return width
}
