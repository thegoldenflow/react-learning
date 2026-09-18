/**
 * 区块六（只读）：路由 loader 与 TanStack Query 的分工 —— 两种【主流】组合，以及并用。
 *
 * 四种取数方案的总览在 11 题的速查卡里，这里不重复，只回答一个问题：同一个页面的数据，交给路由还是交给 Query？
 * - 「Data 模式 loader 取数」（18 题）：导航前取数，pending 归 useNavigation，错误归 errorElement，
 *   action 完成后页面上的 loader 自动重新验证（18 题引过原文「When the action completes, all loader data on the page is revalidated」）。
 * - 「任意路由 + TanStack Query」（本课）：组件按 key 订阅缓存，pending / 错误在 query 结果里，失效靠 invalidateQueries，
 *   缓存跨路由存活、同 key 去重。
 * - 并用：loader 里预取、组件里读缓存。官方 prefetching 指南的原话：
 *   「an attractive way to do prefetching is integrating it at the router level」；
 *   TanStack 官方仓库的 examples/react/react-router 示例就是 loader 里 `await queryClient.ensureQueryData(...)`、
 *   组件里 `useSuspenseQuery(...)`。
 *
 * 版本提醒（2026-09-17 核对）：5.102.0（2026-08-22）新增了 queryClient.query()，同时把 fetchQuery / prefetchQuery /
 * ensureQueryData 标成 @deprecated（本项目装的 5.102.8 的 .d.ts 里能看到：「Use queryClient.query({ ...options, staleTime: 'static' })
 * instead.」），官方 prefetching 指南也改成了 query()。旧方法在 v5 里照常可用、存量代码里最常见；
 * query() 发布不满一个月，按本课的规则标【尝鲜】，读新文档时认得它就行。
 */
const ROWS = [
  {
    aspect: '什么时候取数',
    loader: '导航时、渲染新页面之前（父子 loader 并行）',
    query: '组件挂载 / key 变化时；stale 数据在挂载、窗口聚焦、网络重连时后台重取',
    both: 'loader 里预取，进页面时缓存里已经有数据',
  },
  {
    aspect: 'pending 归谁',
    loader: 'useNavigation().state',
    query: 'status × fetchStatus（isLoading、isRefetching…）',
    both: '首次进入归导航；之后的后台重取归 Query',
  },
  {
    aspect: '错误归谁',
    loader: 'errorElement / ErrorBoundary（路由级）',
    query: 'error / isError；throwOnError 或 useSuspenseQuery 交给错误边界',
    both: '关键数据在 loader 里 await，失败走路由的错误处理',
  },
  {
    aspect: '缓存与去重',
    loader: '路由本身不做跨导航的数据缓存',
    query: '按 key 缓存、同 key 去重；staleTime / gcTime 控制新鲜度和回收',
    both: 'Query 的缓存让再次进入同一路由时 loader 立即返回',
  },
  {
    aspect: '写之后怎么更新',
    loader: 'action 完成后自动重新验证页面上的 loader',
    query: 'useMutation + invalidateQueries（或乐观更新）',
    both: 'action 里 invalidateQueries，再由 loader / 组件读到新数据',
  },
]

const SKELETON = `// 并用（官方 examples/react/react-router 的写法，这里换成本课的查询定义）
const router = createBrowserRouter([
  {
    path: '/orders/:id',
    loader: async ({ params }) => {
      // 关键数据：await，失败交给路由的 errorElement
      await queryClient.ensureQueryData(orderDetailOptions(params.id!))
      return null
    },
    Component: OrderPage,
  },
])

function OrderPage() {
  const { id } = useParams()
  const { data } = useSuspenseQuery(orderDetailOptions(id!)) // 缓存里已有，不会挂起
}

// 【尝鲜·5.102.0 起】同样的预取，新文档写成：
// await queryClient.query({ ...orderDetailOptions(id), staleTime: 'static' })`

export function LoaderVsQueryCard() {
  return (
    <div className="card stack">
      <h3>区块六：路由 loader 与 TanStack Query 的分工（只读）</h3>
      <p className="muted">
        两种组合都是【主流】：「Data 模式 loader 取数」（18 题）和「任意路由 + TanStack Query」（本课），也可以并用。
        四种取数方案的总览见 11 题的速查卡。
      </p>
      <table>
        <thead>
          <tr>
            <th>对比项</th>
            <th>路由 loader（React Router 7 Data 模式）</th>
            <th>TanStack Query v5</th>
            <th>并用</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.aspect}>
              <td>{row.aspect}</td>
              <td>{row.loader}</td>
              <td>{row.query}</td>
              <td>{row.both}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <details>
        <summary>并用的最小骨架（只读，不可运行）</summary>
        <pre className="log" style={{ whiteSpace: 'pre-wrap' }}>
          {SKELETON}
        </pre>
      </details>
    </div>
  )
}
