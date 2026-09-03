/**
 * 学习主题：API 请求状态建模 —— loading / success / error / empty 与重试
 *
 * React 核心概念：
 * - 工业界标准：用判别联合建模请求状态 status: 'loading' | 'success' | 'error'，
 *   data 只在 success 分支、errorMessage 只在 error 分支 —— 比多个独立 boolean 更不易出非法状态
 * - empty（请求成功但没数据）和 error（请求失败）是两种不同状态，UI 文案与交互都要分开
 * - 重试 = 让同一个请求 effect 重新执行：把 reloadFlag 计数器放进依赖数组，+1 即重跑
 * - 请求逻辑直接写在组件里，不做半吊子抽象；真实业务多用 TanStack Query，但手写这套是面试必备
 *
 * Vue 对应概念：
 * - 同样的判别联合放进 ref<RequestState>，整体替换 state.value —— 状态建模与 React 完全一致
 * - React 靠「改变依赖触发 effect 重跑」来重试；Vue 把请求写成普通函数 load()，重试直接再调一次
 *
 * 最重要的区别：
 * - 请求状态建模是框架无关的工程功底，两边一模一样；差异只在「怎么触发请求」：
 *   React 把请求声明成「状态的同步结果」（effect 由依赖驱动），
 *   Vue 版则把请求当成命令式「动作」（onMounted / 事件处理器里直接调 load）。
 */
import { useEffect, useState, type FormEvent } from 'react'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'

/**
 * 工业界标准写法：判别联合（discriminated union）建模请求状态。
 * status 是判别字段；users 只在 success 分支存在，message 只在 error 分支存在。
 * TS 在 if (state.status === 'success') 收窄后能【保证】state.users 一定存在。
 *
 * 对比三个独立 boolean 的写法（isLoading + isError + data + errorMessage 各自为政）：
 * 那样可能出现 isLoading 和 isError 同时为 true、或「成功了 data 却是 null」的非法组合，
 * 每处 UI 都要靠人肉约定小心维护；判别联合让非法状态「根本无法被表示」—— 面试加分点。
 *
 * 真实业务通常直接用 TanStack Query：useQuery 内部就是这套状态机的完整体
 * （外加缓存/去重/自动重试/失效）。本题不引库、手写整套状态机，是为了让你确切知道它替你管了什么；
 * 30 题会用 @tanstack/react-query 把同一类页面重做一遍，可对照着看。
 */
type RequestState =
  | { status: 'loading' }
  | { status: 'success'; users: User[] }
  | { status: 'error'; message: string }

export default function Example() {
  const [draft, setDraft] = useState('') // 输入框草稿
  const [keyword, setKeyword] = useState('') // 已提交的搜索词（真正的请求参数）
  const [reloadFlag, setReloadFlag] = useState(0) // 专门用来触发 effect 重跑的计数器
  const [state, setState] = useState<RequestState>({ status: 'loading' })

  /**
   * 请求 effect：依赖 [keyword, reloadFlag]，三个触发源统一成一条数据流 ——
   * - 挂载后自动执行一次 → 初始自动加载；
   * - 提交搜索改 keyword → 依赖变化，重新请求；
   * - 点「重试」把 reloadFlag +1 → 依赖变化，同一段请求逻辑原样重跑 —— 这就是重试的实现。
   *   （另一种做法是抽 load() 函数在各处手动调用；不引库时「依赖驱动 + reloadFlag」是常见手写模式。）
   *
   * 请求逻辑就这样直接写在组件里 —— 不急着抽 useFetch 之类的半吊子抽象；
   * 要抽象就上成熟的 TanStack Query。竞态处理与 10 题相同：cleanup 里 abort 旧请求。
   * failRate: 0.35 —— 35% 的请求随机失败，方便你亲眼看到 error 分支和重试按钮。
   */
  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    fetchUsers(keyword, { signal: controller.signal, failRate: 0.35 })
      .then((users) => setState({ status: 'success', users }))
      .catch((err: unknown) => {
        if (isAbortError(err)) return // 「被取消」不算失败（10 题讲过）
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : '未知错误',
        })
      })
    return () => controller.abort()
  }, [keyword, reloadFlag])

  const loading = state.status === 'loading'

  /**
   * 提交搜索：keyword 换成草稿值，同时 reloadFlag +1 —— 这样搜索「同一个词」也会重新请求
   * （否则 setKeyword 传相同值，state 没变、effect 不会重跑）。
   * 同一事件里的两次 setState 会被 React 自动批处理成一次重渲染 → effect 只重跑一次。
   */
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault() // 阻止 form 默认的整页刷新；用 form 包裹是为了让回车也能触发搜索
    setKeyword(draft)
    setReloadFlag((n) => n + 1)
  }

  /** 重试：只改 reloadFlag，keyword 不动 —— 用同样的参数把失败的请求再发一次 */
  const retry = () => setReloadFlag((n) => n + 1)

  return (
    <div className="stack">
      <p className="muted">
        初始自动加载用户列表；35% 概率随机失败，多点几次「重试」可看到 error 分支；搜「zzz」看空态
      </p>

      <form className="row" onSubmit={handleSearch}>
        {/* 加载中禁用输入与按钮：防止重复提交，请求结束（成功或失败）后自动恢复 */}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="搜索姓名或邮箱，搜「zzz」看空态"
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '加载中…' : '搜索'}
        </button>
      </form>

      {/* 四种 UI 形态一一对应四种状态：loading / error / 空 success / 有数据 success。
          注意 empty 不是 error：它是「请求成功、数据恰好为空」，文案是引导换关键词而不是报错重试。 */}
      {state.status === 'loading' && <p className="muted">加载中，请稍候…</p>}

      {state.status === 'error' && (
        <div className="card">
          {/* 收窄到 error 分支后，TS 保证 state.message 存在 */}
          <p className="error-text">{state.message}</p>
          {/* 重试按钮只出现在 error 分支；点击后 effect 重跑，状态自然回到 loading */}
          <button className="btn-primary" onClick={retry}>
            重试
          </button>
        </div>
      )}

      {state.status === 'success' && state.users.length === 0 && (
        <p className="muted">没有找到{keyword ? `与「${keyword}」` : ''}匹配的用户，换个关键词试试</p>
      )}

      {state.status === 'success' && state.users.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>邮箱</th>
              <th>角色</th>
            </tr>
          </thead>
          <tbody>
            {state.users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge">{u.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
