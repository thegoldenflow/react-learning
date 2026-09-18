/**
 * 区块五：谁管什么 —— 本地 UI state 与 QueryClient 缓存并排，外加运行日志。
 *
 * 缓存观察窗只服务于教学：真实项目看缓存用 devtools（@tanstack/react-query-devtools，Example.tsx 七），
 * 不自己订阅 QueryCache。这里订阅 QueryCache 顺带演示两件事：
 * 1. useSyncExternalStore 的 subscribe 要引用稳定。官方 Pitfall：每次渲染传一个新的 subscribe 函数，
 *    React 会退订再重订；本区块每秒重新渲染一次，写成内联箭头函数就等于每秒重订一次。所以用 useCallback 包住（14 题）。
 * 2. 回调要用 notifyManager.batchCalls 包一层：useQuery 在【渲染期间】就会往缓存里登记新 key（发出 'added' 事件），
 *    如果回调同步触发 setState，React 会报「渲染一个组件时更新了另一个组件」；batchCalls 把通知推迟到渲染之外，
 *    库自己的 useQuery 也是这样订阅的。
 *
 * Vue 对照：vue/CacheInspector.vue（onMounted 订阅、onUnmounted 退订，把结果写进 ref）。
 */
import { useCallback, useSyncExternalStore } from 'react'
import { notifyManager, useQueryClient, type QueryCache } from '@tanstack/react-query'
import type { ListFilters, OrdersDemo } from './ordersDemo'

interface CacheRow {
  hash: string
  status: string
  fetchStatus: string
  observers: number
  invalidated: boolean
  updatedAt: number
}

/**
 * 快照必须「内容不变则引用不变」：每次都新建数组的话 useSyncExternalStore 会认为数据一直在变。
 * 这里拼成一个字符串（字符串按值比较），渲染时再拆开。
 */
function serializeCache(cache: QueryCache): string {
  return cache
    .getAll()
    .map((q) =>
      [
        q.queryHash,
        q.state.status,
        q.state.fetchStatus,
        q.getObserversCount(),
        q.state.isInvalidated ? 1 : 0,
        q.state.dataUpdatedAt,
      ].join('\t'),
    )
    .join('\n')
}

function parseCache(snapshot: string): CacheRow[] {
  if (snapshot === '') return []
  return snapshot.split('\n').map((line) => {
    const [hash, status, fetchStatus, observers, invalidated, updatedAt] = line.split('\t')
    return {
      hash,
      status,
      fetchStatus,
      observers: Number(observers),
      invalidated: invalidated === '1',
      updatedAt: Number(updatedAt),
    }
  })
}

interface Props {
  demo: OrdersDemo
  filters: ListFilters
  keepPrevious: boolean
  selectedId: string | null
  now: number
}

export function CacheInspector({ demo, filters, keepPrevious, selectedId, now }: Props) {
  const cache = useQueryClient().getQueryCache()
  const subscribe = useCallback((onChange: () => void) => cache.subscribe(notifyManager.batchCalls(onChange)), [cache])
  const rows = parseCache(useSyncExternalStore(subscribe, () => serializeCache(cache)))
  const logLines = useSyncExternalStore(demo.log.subscribe, demo.log.getSnapshot)

  return (
    <div className="card stack">
      <h3>区块五：谁管什么 —— 本地 UI state vs 服务端状态的缓存</h3>
      <p className="muted">
        左边是这几个区块里的本地 UI state；右边是 QueryClient 缓存里的全部条目。第一列是 key 哈希后的结果：
        对象的键被排过序（page 在 status 前面），所以 {'{ status, page }'} 和 {'{ page, status }'} 命中同一条缓存。
        离开本题再进来两边都是空的 —— 本项目每次进入都新建 QueryClient；真实应用只建一次，缓存跨页面存活。
      </p>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="stack" style={{ flex: 1, minWidth: 200 }}>
          <strong>本地 UI state（useState）</strong>
          <ul>
            <li>筛选 status：{filters.status}</li>
            <li>页码 page：{filters.page}</li>
            <li>保留上一页：{String(keepPrevious)}</li>
            <li>选中行 selectedId：{selectedId ?? 'null'}</li>
          </ul>
          <span className="muted">只属于这个页面，不需要和服务器同步 —— 这才是 useState / Zustand 该管的东西。</span>
        </div>
        <div className="stack" style={{ flex: 3, minWidth: 320 }}>
          <strong>服务端状态（QueryClient 缓存）</strong>
          {rows.length === 0 ? (
            <p className="log-empty">（空）</p>
          ) : (
            <table aria-label="缓存条目">
              <thead>
                <tr>
                  <th>queryHash</th>
                  <th>status</th>
                  <th>fetchStatus</th>
                  <th>观察者</th>
                  <th>更新于</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.hash}>
                    <td>
                      <code style={{ wordBreak: 'break-all' }}>{row.hash}</code>
                    </td>
                    <td>{row.status}</td>
                    <td>{row.fetchStatus}</td>
                    <td>{row.observers}</td>
                    <td>
                      {row.updatedAt ? `${Math.max(0, Math.floor((now - row.updatedAt) / 1000))} 秒前` : '—'}
                      {row.invalidated && <strong> 已失效</strong>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <span className="muted">
            真相在服务器，这里只是一份可能过期的副本：有主键、有时间戳、有观察者计数、会失效、没人用 5 分钟（gcTime）后被回收 ——
            这些概念 useState / Zustand / Pinia 都没有，这就是「服务端状态需要专门的工具」的意思。
            「已失效」来自 invalidateQueries，或者某次请求失败后库自动标记，都表示下次用到时必须重取。
          </span>
        </div>
      </div>

      <div className="row">
        <strong>运行日志</strong>
        <button className="btn-ghost" onClick={demo.log.clear}>
          清空
        </button>
      </div>
      <ul className="log" aria-label="运行日志">
        {logLines.length === 0 ? (
          <li className="log-empty">（暂无）</li>
        ) : (
          logLines.map((line, i) => <li key={i}>{line}</li>)
        )}
      </ul>
      <span className="muted">
        开发环境 StrictMode 下，刚进入本题时列表查询会有两条「queryFn 执行：列表 all 第 1 页」和一条「被取消」：effect 被多跑了一轮
        setup + cleanup，最后一个观察者离开时，因为 queryFn 读过 signal，库把在途请求取消了，重新订阅后再发一次（10 题讲过的双跑）。
        queryFn 不读 signal 的话，第一次请求不会被取消，重新订阅时直接复用它，只执行一次（两种情况都有测试）。
      </span>
    </div>
  )
}
