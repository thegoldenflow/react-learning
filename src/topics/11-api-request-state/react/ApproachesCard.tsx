/**
 * 四种取数方案速查（只给骨架和归属，可运行示例在各自的题里）。
 *
 * 官方对「在 Effect 里取数」的态度（react.dev/reference/react/useEffect 的 Deep Dive，逐字）：
 * 「This is, however, a very manual approach and it has significant downsides」——
 * ① Effects don't run on the server；② easy to create "network waterfalls"；③ usually means you don't preload or cache data；
 * ④ It's not very ergonomic（竞态之类的样板多）。接着给出建议：
 * 「If you use a framework, use its built-in data fetching mechanism.」
 * 「Otherwise, consider using or building a client-side cache. Popular open source solutions include TanStack Query, useSWR,
 * and React Router 6.4+.」最后留了一句：「You can continue fetching data directly in Effects if neither of these approaches suit you.」
 * 同一页还写明这些缺点「is not specific to React. It applies to fetching data on mount with any library.」
 */
const ROWS = [
  {
    name: 'Effect 手写（本课主线）',
    maturity: '【主流·教学与兜底】',
    trigger: '依赖变化（组件渲染之后）',
    pending: '自己建模（本课用「结果的参数指纹 ≠ 当前参数」派生）',
    solves: '把状态机讲透：判别联合、取消、竞态、重试。缓存 / 去重 / 预载都要自己做',
    skeleton: `useEffect(() => {
  const c = new AbortController()
  fetchUsers(kw, { signal: c.signal })
    .then(users => setResult({ forKey, kind: 'success', users }))
    .catch(err => { if (!isAbortError(err)) setResult({ forKey, kind: 'error', message: … }) })
  return () => c.abort()
}, [forKey])`,
    where: '本课；竞态与取消细讲在 27 题',
  },
  {
    name: 'TanStack Query v5',
    maturity: '【主流·生产默认】',
    trigger: 'queryKey 变化（带缓存、去重）',
    pending: 'status（有没有数据）× fetchStatus（queryFn 在不在跑）',
    solves: '缓存、去重、失效重取、窗口聚焦重取、重试（默认「silently retried 3 times, with exponential backoff delay」）、gcTime 5 分钟',
    skeleton: `const { data, status, fetchStatus, isPending, error, refetch } = useQuery({
  queryKey: ['users', keyword],
  queryFn: ({ signal }) => fetchUsers(keyword, { signal }),
})
// 切换参数不闪：placeholderData: keepPreviousData`,
    where: '30 题（Vue 侧同一个 query-core：@tanstack/vue-query）',
  },
  {
    name: '路由 loader（Data 模式）',
    maturity: '【主流】',
    trigger: '导航（渲染之前就取数）',
    pending: 'useNavigation().state',
    solves: '一进页面就有数据、不会瀑布；配合 action 提交后自动重新验证',
    skeleton: `{ path: '/users', loader: ({ request }) => fetchUsers('', { signal: request.signal }),
  Component: UserList }
// 组件里：const users = useLoaderData()`,
    where: '18 题（Vue 侧：vue-router 的「导航前获取」beforeRouteEnter / 导航后 watch）',
  },
  {
    name: 'use(promise) + Suspense + 错误边界',
    maturity: '【较新·19.0 起】',
    trigger: '渲染读 promise，未完成就挂起',
    pending: 'Suspense 的 fallback；失败交给错误边界',
    solves: '把 loading / error 从组件里搬到边界上；但「Promises passed to use must be cached」，纯客户端要自己做 promise 缓存',
    skeleton: `const users = use(cachedUsersPromise)  // 不能写 use(fetchUsers(kw))：每次渲染都会新建 promise
// use 不能放在 try/catch 里，错误由最近的错误边界接住`,
    where: '32 题（待新增）；Vue 侧对应 <Suspense>（官方标注实验性）',
  },
]

export function ApproachesCard() {
  return (
    <div className="card stack">
      <h3>区块二：四种取数方案速查（官方态度与归属）</h3>
      <p className="muted">
        官方原文：在 Effect 里取数「a very manual approach」，缺点是不在服务端执行、容易造成网络瀑布、没有预载和缓存、样板多；
        有框架就用框架的机制，否则用客户端缓存层（TanStack Query / useSWR / React Router）；都不合适时「You can continue fetching
        data directly in Effects」。所以本课的手写版是教学与兜底写法，不是生产默认。
      </p>
      <table>
        <thead>
          <tr>
            <th>方案</th>
            <th>触发方式</th>
            <th>pending 归谁管</th>
            <th>解决什么 / 代价</th>
            <th>在哪一题</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.name}>
              <td>
                {row.name}
                <br />
                <span className="muted">{row.maturity}</span>
              </td>
              <td>{row.trigger}</td>
              <td>{row.pending}</td>
              <td>{row.solves}</td>
              <td>{row.where}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <details>
        <summary>各方案的最小骨架（只读，不可运行）</summary>
        <div className="stack">
          {ROWS.map((row) => (
            <div key={row.name} className="stack" style={{ gap: 2 }}>
              <strong>{row.name}</strong>
              <pre className="log" style={{ whiteSpace: 'pre-wrap' }}>
                {row.skeleton}
              </pre>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
