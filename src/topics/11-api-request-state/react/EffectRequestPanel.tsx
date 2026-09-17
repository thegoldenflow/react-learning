/**
 * 【主线】在 Effect 里手写请求（教学用；生产用缓存层，见 30 题）。
 *
 * 本文件把四件事做全：
 * 1. 判别联合建模结果：success 带 users、error 带 message，不可能出现「又成功又失败」；
 * 2. 请求态是派生的，不存进 state：结果里记下它属于哪一次参数（forKey），
 *    forKey 和当前参数不一样就说明请求还在路上。这样 Effect 体里不用同步 setState
 *    （否则命中 react-hooks 的 set-state-in-effect，还多一轮渲染），过期的响应写进来也不会被当成当前结果
 *    —— 等价于官方 ignore 标记的「数据版」；
 * 3. 取消：cleanup 里 abort 上一次请求；AbortError 不算失败（27 题细讲）；
 * 4. 重试 / 重新请求：reloadFlag 进参数指纹，+1 就重跑同一段逻辑（搜同一个词也会重新请求）。
 *
 * 顺带解决「切换关键词先闪一下加载中」：上一次的数据留在屏幕上，只加一个「刷新中…」标记
 * （TanStack Query 的 placeholderData: keepPreviousData 就是干这个的，见 30 题）。
 *
 * Vue 对照：vue/WatchRequestPanel.vue（watch + onWatcherCleanup，同一套建模）。
 */
import { useEffect, useState, type SubmitEvent } from 'react'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'

/** 请求结果。forKey 记住它属于哪一次参数，用来判断「是不是当前这次请求的结果」 */
type Result =
  | { forKey: string; kind: 'success'; users: User[] }
  | { forKey: string; kind: 'error'; message: string }

export function EffectRequestPanel({ delayMs = 600 }: { delayMs?: number }) {
  const [draft, setDraft] = useState('') // 输入框草稿
  const [keyword, setKeyword] = useState('') // 已提交的搜索词（真正的请求参数）
  const [reloadFlag, setReloadFlag] = useState(0) // 专门用来「再请求一次」的计数器
  const [failMode, setFailMode] = useState(false) // 演示开关：让请求必定失败
  const [result, setResult] = useState<Result | null>(null)

  // 参数指纹：关键词 + 重试次数 + 演示开关。它一变就意味着「要发一次新请求」
  const requestKey = `${keyword}|${reloadFlag}|${failMode}`
  // 派生的请求态：还没有结果，或者结果属于上一次参数 → 这一次还在加载
  const pending = result === null || result.forKey !== requestKey
  // 上一次成功的数据：切换关键词时先把它继续显示着，避免表格闪成「加载中」
  const previousUsers = result?.kind === 'success' ? result.users : null

  useEffect(() => {
    const controller = new AbortController()
    fetchUsers(keyword, { signal: controller.signal, delayMs, failRate: failMode ? 1 : 0 })
      .then((users) => setResult({ forKey: requestKey, kind: 'success', users }))
      .catch((err: unknown) => {
        // 取消不是失败：不写结果，界面继续保持「加载中」，直到新请求写入（27 题）
        if (isAbortError(err)) return
        setResult({ forKey: requestKey, kind: 'error', message: err instanceof Error ? err.message : '未知错误' })
      })
    // cleanup 在「依赖变化后的下一次执行之前」和「卸载时」运行：取消上一次还没回来的请求。
    // 开发环境 StrictMode 会挂载两次，所以你会在网络面板里看到两次请求，生产只有一次（10 题）
    return () => controller.abort()
  }, [keyword, requestKey, delayMs, failMode])

  function handleSearch(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setKeyword(draft)
    // 同时 +1：搜「同一个词」时 keyword 没变，只靠 setKeyword 不会重新请求。
    // 同一个事件里的两次 setState 会被批处理成一次重渲染，Effect 也只重跑一次（24 题）
    setReloadFlag((n) => n + 1)
  }

  return (
    <div className="card stack">
      <h3>区块一：在 Effect 里手写请求【主线·教学用】</h3>
      <p className="muted">
        搜「zzz」看空态；勾选「让请求失败」看错误态与重试；切换关键词时注意旧数据会留在屏幕上（只多一个「刷新中…」）。
      </p>

      <form className="row" onSubmit={handleSearch}>
        {/* 查询类请求不禁用输入框：用户可以接着改关键词（提交类请求要禁用，见 19 题） */}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="搜索姓名或邮箱"
          aria-label="搜索关键词"
        />
        <button type="submit" className="btn-primary">
          搜索
        </button>
        <label className="row" style={{ gap: 4 }}>
          <input type="checkbox" checked={failMode} onChange={(e) => setFailMode(e.target.checked)} />
          让请求失败
        </label>
      </form>

      <p className="muted">
        参数指纹 <code>{requestKey}</code>；请求态（派生）：{pending ? '加载中' : result?.kind === 'error' ? '失败' : '成功'}
      </p>

      {/* 五种界面形态：首次加载 / 刷新中（带旧数据）/ 失败 / 空 / 有数据。
          空态不是错误态：它是「请求成功、数据恰好为空」，文案引导换关键词，不给重试按钮。 */}
      {pending && previousUsers === null && <p className="muted">加载中，请稍候…</p>}

      {!pending && result?.kind === 'error' && (
        <div className="stack" style={{ gap: 6 }}>
          <p role="alert" className="error-text" style={{ margin: 0 }}>
            {result.message}
          </p>
          <div className="row">
            {/* 重试：只改 reloadFlag，参数不动，同一段请求逻辑原样重跑 */}
            <button type="button" className="btn-primary" onClick={() => setReloadFlag((n) => n + 1)}>
              重试
            </button>
          </div>
        </div>
      )}

      {!pending && result?.kind === 'success' && result.users.length === 0 && (
        <p className="muted">没有找到{keyword ? `与「${keyword}」` : ''}匹配的用户，换个关键词试试</p>
      )}

      {(previousUsers?.length ?? 0) > 0 && (
        <>
          {pending && <p className="muted">刷新中…（下面还是上一次的结果）</p>}
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>邮箱</th>
                <th>角色</th>
              </tr>
            </thead>
            <tbody>
              {previousUsers?.map((u) => (
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
        </>
      )}
    </div>
  )
}
