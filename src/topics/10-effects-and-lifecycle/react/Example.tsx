/**
 * 学习主题：useEffect 与生命周期 —— 副作用、依赖数组、cleanup 与请求竞态
 *
 * React 核心概念：
 * - useEffect(setup, deps)：渲染提交到屏幕后执行 setup，用来「让组件与外部系统保持同步」（请求/订阅/定时器/DOM）
 * - 依赖数组：[] = 只在挂载后执行一次；[keyword] = 挂载后 + keyword 每次变化后执行；不传 = 每次渲染后都执行
 * - setup 可以返回 cleanup 函数：下一次 setup 执行前 + 组件卸载前各执行一次 —— 一个函数覆盖两个时机
 * - StrictMode 开发期故意把组件「挂载→卸载→重挂载」，effect 双跑一遍，专门检验 cleanup 写没写对
 * - 请求竞态：先发的慢请求可能后返回、覆盖后发的快请求的正确结果；在 cleanup 里 abort 旧请求即可根治
 *
 * Vue 对应概念：
 * - [keyword] ≈ watch(keyword, cb, { immediate: true })—— immediate 必须有：React 的 effect 首次渲染后就会执行一次
 * - [] ≈ onMounted，但语义不同：不是「生命周期钩子」，而是「依赖为空，所以永远不需要重跑」
 * - cleanup ≈ watch 回调的 onCleanup 参数 + onUnmounted 两个 API 的合体
 *
 * 最重要的区别：
 * - Vue 给你一排按「时机」命名的生命周期钩子；React 只有一个 useEffect，思维模型不是生命周期，
 *   而是「声明式同步」：你声明如何与外部系统同步、如何清理，何时执行由 React 根据依赖决定。
 *   「useEffect(fn, []) 就是 onMounted」是最常见的误解 —— 行为恰好像，出发点完全不同，
 *   useEffect 不是 onMounted 的替代品。
 */
import { useEffect, useState } from 'react'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'

export default function Example() {
  const [keyword, setKeyword] = useState('')
  const [users, setUsers] = useState<User[]>([])
  // 初始就是 true：挂载后 effect 必然发起首次请求，若初始 false 首帧会闪一下「没有匹配的用户」
  const [loading, setLoading] = useState(true)

  /**
   * 网络请求是「副作用」：它和渲染本身无关、要跟 React 之外的系统（网络）打交道，所以放进 useEffect。
   *
   * 依赖数组写 [keyword]：挂载后执行一次（自动完成初始加载）+ keyword 每次变化后再执行。
   * 对应 Vue 的 watch(keyword, cb, { immediate: true })—— immediate 这点必须注意：
   * Vue 的 watch 默认懒执行（变化才跑），而 React 的 effect 首次渲染后必然会跑一次。
   *
   * 如果这里写 []，行为上像 onMounted（只跑一次），但那是因为「依赖为空、永远不需要重跑」，
   * 不是因为它是生命周期钩子 —— 后果就是 keyword 变化不会重新请求，effect 里读到的永远是
   * 首次渲染的旧 keyword（过期闭包）。eslint-plugin-react-hooks 的 exhaustive-deps 规则
   * 就是专门查「effect 用了却没写进依赖」的，面试常考。
   *
   * 竞态（面试高频）：keyword 从「a」变「ab」时会连发两个请求，若「a」的响应更慢、
   * 反而更晚到达，就会覆盖「ab」的正确结果。React 的解法优雅在于：每轮 effect 重跑前
   * 先执行上一轮的 cleanup —— 在 cleanup 里取消旧请求，旧响应根本没机会回来。
   * （本题故意不做防抖 —— 每个字符都发请求；防抖优化是 14 题。）
   */
  useEffect(() => {
    // 每轮 effect 创建属于自己的 controller；cleanup 是闭包，恰好能拿到「这一轮」的它
    const controller = new AbortController()

    setLoading(true)
    // 注意：effect 回调本身不能写成 async —— async 函数返回 Promise，
    // 而 React 规定 effect 的返回值只能是 cleanup 函数（或不返回）。
    // 想用 await 就在 effect 内部另外定义一个 async 函数再调用；这里用 .then 链保持精简。
    fetchUsers(keyword, { signal: controller.signal })
      .then((list) => {
        setUsers(list)
        setLoading(false)
      })
      .catch((err: unknown) => {
        // 「被取消」不是失败：切换关键词 / 卸载导致的 abort 会走到这里，必须忽略，
        // 否则每敲一个字符都会闪一次错误。
        if (isAbortError(err)) return
        // 完整的错误处理（error 状态 + 重试按钮）是 11 题的主角，这里只收起 loading
        setLoading(false)
      })

    /**
     * cleanup 函数：React 在「下一轮 effect 执行前」和「组件卸载前」都会调用它，
     * 一个函数覆盖两个时机 —— Vue 里对应两个 API：watch 回调的 onCleanup（下一次回调前）
     * 和 onUnmounted（卸载前）。
     *
     * StrictMode：开发环境 React 会故意把组件「挂载→卸载→重挂载」，effect 因此跑两遍
     * （第一次的请求被 cleanup 立即取消，第二次正常完成）。这不是 bug，是刻意的检查：
     * cleanup 写对了，双跑的净效果等于跑一次；写漏了，双跑立刻暴露重复请求/重复订阅。
     * 生产构建只跑一次。Vue 没有对应机制 —— 这一点没有一一对应关系。
     *
     * 补充：React 官方文档还有个更简的方案 —— let ignore = false 布尔位，cleanup 里置 true、
     * 回调里判断后丢弃过期结果。AbortController 更彻底：真的取消了网络请求，而不只是丢弃响应。
     */
    return () => {
      controller.abort()
    }
  }, [keyword])

  /**
   * 面试高频：哪些逻辑【不该】放进 useEffect？（本题只有网络请求这一种正当用法）
   * 1. 响应用户事件 —— 点按钮提交、弹提示：直接写在事件处理器里，
   *    不要「setState 之后再用 effect 监听那个 state」绕一圈；
   * 2. 能在渲染期间算出来的派生值 —— 如「过滤后的列表」「合计金额」：渲染时直接算（09 题），
   *    用 effect 把它同步进另一个 state 是反模式（多一次渲染，且两份状态迟早不同步）；
   * 3. 「props 变化时重置 state」—— 不要用 effect 手动同步，给组件加 key 让它整棵重建。
   * 只有「与 React 之外的系统同步」（网络、订阅、定时器、非受控 DOM）才需要 effect。
   */

  return (
    <div className="stack">
      <p className="muted">输入关键词实时搜索用户；快速连续输入时旧请求会被取消，结果不会错乱</p>

      {/* 受控输入框：value + onChange（对应 Vue 的 v-model）。
          注意分工：事件处理器只负责「改状态」（setKeyword），
          「发请求」这个副作用由 effect 响应 keyword 的变化 —— 副作用统一由状态驱动。 */}
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜索姓名或邮箱，如「张」或 example"
      />

      {loading && <p className="muted">加载中…</p>}
      {!loading && users.length === 0 && <p className="muted">没有匹配的用户</p>}

      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name}（{u.email}）<span className="badge">{u.role}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
