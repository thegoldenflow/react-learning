/**
 * 30 题的结论测试：文件头里讲的关键结论，每条都在这里有一个可以运行的证明。
 * 每个用例新建 QueryClient 和演示工具（模拟接口延迟 20ms；要观察中间态时用 300ms）。
 * 测试工具本身在 34 题（待新增）细讲。
 *
 * 注意：共用 mockApi 的订单数据是模块级可变的，「标记已支付」会影响同一文件里后面的用例，
 * 所以标记类的用例都先切到「待支付」筛选，再点第一行。
 */
import { StrictMode } from 'react'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  QueryClient,
  QueryClientProvider,
  hashKey,
  onlineManager,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import Example, { OrdersWorkbench } from './Example'
import { createDemoQueryClient, createOrdersDemo } from './ordersDemo'

const DELAY = 20
const SLOW = 300

const clients: QueryClient[] = []
afterEach(() => {
  // 先卸载组件再清缓存：反过来的话，clear() 发出的缓存事件会让还挂着的组件在 act 之外更新
  cleanup()
  onlineManager.setOnline(true) // 全局单例：别把「离线」留给下一个用例
  clients.splice(0).forEach((client) => client.clear())
})

function newClient(client: QueryClient) {
  clients.push(client)
  return client
}

function setup({ delayMs = DELAY, staleTime, strict = false }: { delayMs?: number; staleTime?: number; strict?: boolean } = {}) {
  const demo = createOrdersDemo({ delayMs })
  const client = newClient(createDemoQueryClient({ staleTime }))
  const user = userEvent.setup({ delay: null })
  const tree = (
    <QueryClientProvider client={client}>
      <OrdersWorkbench demo={demo} />
    </QueryClientProvider>
  )
  render(strict ? <StrictMode>{tree}</StrictMode> : tree)
  const logs = () => demo.log.getSnapshot()
  /** 日志里某个查询的 queryFn 执行了几次 */
  const runs = (label: string) => logs().filter((line) => line.includes(`queryFn 执行：${label}`)).length
  return { demo, client, user, logs, runs }
}

/** 状态表里某个字段当前显示的值 */
function field(table: string, name: string) {
  const cell = screen.getByRole('table', { name: table }).querySelector(`[data-field="${name}"]`)
  return cell?.textContent
}

const listRows = () => within(screen.getByRole('table', { name: '订单列表' })).getAllByRole('row').slice(1)
const card = (heading: RegExp) => within(screen.getByRole('heading', { name: heading }).closest('.card') as HTMLElement)
const statusSelect = () => screen.getByRole('combobox', { name: /状态筛选/ })

describe('区块一：queryKey、缓存与 status × fetchStatus', () => {
  it('首次加载是 pending + fetching（isLoading），徽标用同一个 key 也只执行一次 queryFn', async () => {
    const { runs } = setup({ delayMs: SLOW })

    await waitFor(() => expect(field('列表查询的状态', 'fetchStatus')).toBe('fetching'))
    expect(field('列表查询的状态', 'status')).toBe('pending')
    expect(field('列表查询的状态', 'isLoading')).toBe('true')

    await waitFor(() => expect(listRows()).toHaveLength(5))
    expect(field('列表查询的状态', 'status')).toBe('success')
    expect(field('列表查询的状态', 'fetchStatus')).toBe('idle')
    expect(screen.getByText('共 15 条')).toBeInTheDocument()
    expect(runs('列表 all 第 1 页')).toBe(1)
  })

  it('staleTime 内切回来直接用缓存，不再执行 queryFn', async () => {
    const { user, runs } = setup()
    await waitFor(() => expect(listRows()).toHaveLength(5))

    await user.selectOptions(statusSelect(), 'paid')
    await waitFor(() => expect(runs('列表 paid 第 1 页')).toBe(1))
    await user.selectOptions(statusSelect(), 'all')

    expect(listRows()).toHaveLength(5)
    expect(runs('列表 all 第 1 页')).toBe(1)
  })

  it('过了 staleTime 再用到：先给旧数据，同时后台重取（success + fetching，isRefetching）', async () => {
    const { user, runs } = setup({ delayMs: SLOW, staleTime: 0 })
    await waitFor(() => expect(listRows()).toHaveLength(5))
    await user.selectOptions(statusSelect(), 'paid')
    await waitFor(() => expect(field('列表查询的状态', 'status')).toBe('success'))

    await user.selectOptions(statusSelect(), 'all')

    // 同一时刻：表格里是旧数据（没闪「加载中」），状态是 success + 后台重取
    await waitFor(() => {
      expect(field('列表查询的状态', 'isRefetching')).toBe('true')
      expect(listRows()).toHaveLength(5)
    })
    expect(field('列表查询的状态', 'status')).toBe('success')
    await waitFor(() => expect(runs('列表 all 第 1 页')).toBe(2))
  })

  it('queryKey 确定性哈希：对象键顺序不影响命中，数组元素顺序影响', async () => {
    expect(hashKey(['orders', { status: 'all', page: 1 }])).toBe(hashKey(['orders', { page: 1, status: 'all' }]))
    expect(hashKey(['orders', 'list'])).not.toBe(hashKey(['list', 'orders']))

    // 缓存观察窗里看到的哈希：对象的键排过序
    setup()
    const inspector = card(/区块五/)
    expect(await inspector.findByText('["orders","list",{"page":1,"status":"all"}]')).toBeInTheDocument()
    await waitFor(() => expect(listRows()).toHaveLength(5))
    expect(await card(/区块四/).findByText(/共 15 单/)).toBeInTheDocument()
  })

  it('翻页：不保留上一页时回到 pending；打开 keepPreviousData 后旧数据垫着、isPlaceholderData 为 true', async () => {
    const { user } = setup({ delayMs: SLOW })
    await waitFor(() => expect(listRows()).toHaveLength(5))

    await user.click(screen.getByRole('button', { name: '下一页' }))
    await waitFor(() => expect(field('列表查询的状态', 'status')).toBe('pending'))
    expect(screen.queryByRole('table', { name: '订单列表' })).not.toBeInTheDocument()
    await waitFor(() => expect(listRows()[0]).toHaveTextContent('SO-2026-0006'))

    await user.click(screen.getByLabelText(/保留上一页/))
    await user.click(screen.getByRole('button', { name: '下一页' }))

    expect(field('列表查询的状态', 'isPlaceholderData')).toBe('true')
    expect(field('列表查询的状态', 'status')).toBe('success')
    expect(listRows()[0]).toHaveTextContent('SO-2026-0006') // 还是第 2 页的数据
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()

    await waitFor(() => expect(listRows()[0]).toHaveTextContent('SO-2026-0011'))
    expect(field('列表查询的状态', 'isPlaceholderData')).toBe('false')
  })

  it('离线（onlineManager）：首次请求是 pending + paused，isLoading 为 false；恢复在线后自动继续', async () => {
    const { user, runs } = setup()
    await waitFor(() => expect(listRows()).toHaveLength(5))

    await user.click(screen.getByLabelText(/模拟断网/))
    await user.selectOptions(statusSelect(), 'cancelled')

    await waitFor(() => expect(field('列表查询的状态', 'fetchStatus')).toBe('paused'))
    expect(field('列表查询的状态', 'status')).toBe('pending')
    expect(field('列表查询的状态', 'isLoading')).toBe('false')
    expect(runs('列表 cancelled 第 1 页')).toBe(0) // queryFn 根本没执行

    await user.click(screen.getByLabelText(/模拟断网/))
    await waitFor(() => expect(field('列表查询的状态', 'status')).toBe('success'))
    expect(runs('列表 cancelled 第 1 页')).toBe(1)
  })

  it('请求失败：isError，上一次成功的数据还在，缓存条目被自动标记为已失效', async () => {
    const { user } = setup()
    await waitFor(() => expect(listRows()).toHaveLength(5))

    await user.click(screen.getByRole('button', { name: '刷新（模拟失败）' }))

    expect(await card(/区块一/).findByRole('alert')).toHaveTextContent('网络错误')
    expect(field('列表查询的状态', 'status')).toBe('error')
    expect(listRows()).toHaveLength(5)
    expect(card(/区块五/).getByText('已失效')).toBeInTheDocument()
  })
})

describe('区块二：mutation 与失效', () => {
  it('失效重取：isPending 一直等到重取完成；useMutation 级回调先于 mutate 级回调', async () => {
    const { user, logs } = setup({ delayMs: SLOW })
    await user.selectOptions(statusSelect(), 'pending')
    await waitFor(() => expect(listRows().length).toBeGreaterThan(0))
    const first = listRows()[0]
    const orderNo = within(first).getAllByRole('cell')[0].textContent ?? ''

    await user.click(within(first).getByRole('button', { name: '标记为已支付' }))

    expect(await screen.findByRole('button', { name: '提交中…' })).toBeInTheDocument()
    await waitFor(() => expect(field('mutation 的状态', 'status')).toBe('success'), { timeout: 3000 })
    // mutation 结束时，列表已经是重取后的新数据：这一单不在「待支付」里了
    expect(screen.queryByText(orderNo)).not.toBeInTheDocument()

    const at = (text: string) => logs().findIndex((line) => line.includes(text))
    expect(at('useMutation 级 onSuccess')).toBeGreaterThan(-1)
    expect(at('useMutation 级 onSuccess')).toBeLessThan(at('useMutation 级 onSettled'))
    expect(at('useMutation 级 onSettled')).toBeLessThan(at('mutate 级 onSuccess'))
    // 失效之后的重取发生在 mutate 级回调之前（onSettled 返回的 Promise 被 await 了）
    const refetchAfterSettled = logs().findIndex(
      (line, i) => i > at('useMutation 级 onSettled') && line.includes('queryFn 执行：列表 pending'),
    )
    expect(refetchAfterSettled).toBeGreaterThan(-1)
    expect(refetchAfterSettled).toBeLessThan(at('mutate 级 onSuccess'))
  })

  it('乐观更新 · 改缓存：立刻显示已支付；失败后用快照回滚', async () => {
    const { user, logs } = setup({ delayMs: SLOW })
    await user.selectOptions(statusSelect(), 'pending')
    await waitFor(() => expect(listRows().length).toBeGreaterThan(0))
    await user.click(screen.getByLabelText(/onMutate 改缓存/))
    await user.click(screen.getByLabelText('让 mutation 失败（看回滚）'))
    const orderNo = within(listRows()[0]).getAllByRole('cell')[0].textContent ?? ''

    await user.click(within(listRows()[0]).getByRole('button', { name: '标记为已支付' }))

    // onMutate 改了缓存：还在「待支付」筛选里，但这一行已经显示成已支付
    await waitFor(() => expect(listRows()[0]).toHaveTextContent('已支付'))
    expect(await card(/区块二/).findByRole('alert', {}, { timeout: 3000 })).toHaveTextContent('网络错误')
    await waitFor(() => expect(listRows()[0]).toHaveTextContent('待支付'))
    expect(listRows()[0]).toHaveTextContent(orderNo)
    expect(logs().some((line) => line.includes('用快照把缓存回滚了'))).toBe(true)
  })

  it('乐观更新 · variables：在途时画成「已支付（待确认）」，失败后自然回到真实值，不需要回滚代码', async () => {
    const { user } = setup({ delayMs: SLOW })
    await user.selectOptions(statusSelect(), 'pending')
    await waitFor(() => expect(listRows().length).toBeGreaterThan(0))
    await user.click(screen.getByLabelText(/用 variables 渲染/))
    await user.click(screen.getByLabelText('让 mutation 失败（看回滚）'))

    await user.click(within(listRows()[0]).getByRole('button', { name: '标记为已支付' }))

    expect(listRows()[0]).toHaveTextContent('已支付（待确认）')
    expect(await card(/区块二/).findByRole('alert', {}, { timeout: 3000 })).toHaveTextContent('网络错误')
    expect(listRows()[0]).toHaveTextContent('待支付')
    expect(listRows()[0]).not.toHaveTextContent('待确认')
  })

  it('mutation 默认不重试；mutate 级回调在组件卸载后不执行，mutateAsync 的 Promise 照常完成', async () => {
    const client = newClient(new QueryClient())
    let calls = 0
    const hookSuccess = vi.fn()
    const mutateSuccess = vi.fn()
    const asyncResolved = vi.fn()

    function Probe({ fail }: { fail: boolean }) {
      const mutation = useMutation({
        mutationFn: async (n: number) => {
          calls += 1
          await new Promise((resolve) => setTimeout(resolve, DELAY))
          if (fail) throw new Error('boom')
          return n
        },
        onSuccess: hookSuccess,
      })
      return (
        <>
          <button onClick={() => mutation.mutate(1, { onSuccess: mutateSuccess })}>mutate</button>
          <button onClick={() => void mutation.mutateAsync(2).then(asyncResolved)}>mutateAsync</button>
          <span>{mutation.status}</span>
        </>
      )
    }

    const user = userEvent.setup({ delay: null })
    const failing = render(
      <QueryClientProvider client={client}>
        <Probe fail />
      </QueryClientProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'mutate' }))
    expect(await screen.findByText('error')).toBeInTheDocument()
    expect(calls).toBe(1) // 没有重试
    failing.unmount()

    calls = 0
    const view = render(
      <QueryClientProvider client={client}>
        <Probe fail={false} />
      </QueryClientProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'mutate' }))
    view.unmount() // 请求还没回来就卸载
    await waitFor(() => expect(hookSuccess).toHaveBeenCalledTimes(1))
    expect(mutateSuccess).not.toHaveBeenCalled()

    const again = render(
      <QueryClientProvider client={client}>
        <Probe fail={false} />
      </QueryClientProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'mutateAsync' }))
    again.unmount()
    await waitFor(() => expect(asyncResolved).toHaveBeenCalledWith(2))
  })

  it('查询默认失败重试 3 次：queryFn 一共执行 4 次才进入 error', async () => {
    const client = newClient(new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } }))
    let calls = 0
    function Probe() {
      const query = useQuery({
        queryKey: ['always-fail'],
        queryFn: async () => {
          calls += 1
          throw new Error('boom')
        },
      })
      return <span>{query.status}</span>
    }
    render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    )
    expect(await screen.findByText('error')).toBeInTheDocument()
    expect(calls).toBe(4)
  })
})

describe('区块三：依赖查询（enabled）', () => {
  it('没选中时 pending + idle（isLoading 为 false）；选中一行后才请求', async () => {
    const { user, runs } = setup()
    await waitFor(() => expect(listRows()).toHaveLength(5))

    expect(field('详情查询的状态', 'status')).toBe('pending')
    expect(field('详情查询的状态', 'fetchStatus')).toBe('idle')
    expect(field('详情查询的状态', 'isLoading')).toBe('false')
    expect(runs('详情')).toBe(0)

    await user.click(listRows()[0])
    expect(await card(/区块三/).findByText('SO-2026-0001')).toBeInTheDocument()
    expect(runs('详情 o1')).toBe(1)
    expect(field('详情查询的状态', 'status')).toBe('success')
  })
})

describe('区块四：useSuspenseQuery', () => {
  it('首次加载显示 Suspense 的 fallback，之后 data 直接可用', async () => {
    setup({ delayMs: SLOW })
    const stats = card(/区块四/)
    expect(stats.getByText(/统计加载中/)).toBeInTheDocument()
    expect(await stats.findByText(/共 15 单/, {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('缓存里没有数据时失败 → 错误边界；「重试」配合 QueryErrorResetBoundary 重新请求', async () => {
    // React 会把错误边界接住的错误用 console.error 报一次（开发环境），这里收起来并断言
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { user } = setup()
    const stats = card(/区块四/)
    expect(await stats.findByText(/共 15 单/)).toBeInTheDocument()

    await user.click(stats.getByRole('button', { name: '清空缓存并让请求失败' }))

    expect(await stats.findByRole('alert')).toHaveTextContent('统计加载失败（错误边界接住）')
    await user.click(stats.getByRole('button', { name: '重试' }))
    expect(await stats.findByText(/共 15 单/)).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

describe('其它结论：取消、渲染优化、同 key 不同 queryFn、Provider', () => {
  it('StrictMode：读过 signal 的首个请求被取消后再发一次（列表 queryFn 执行 2 次、取消 1 次）', async () => {
    const { runs, logs } = setup({ strict: true })
    await waitFor(() => expect(listRows()).toHaveLength(5))
    expect(runs('列表 all 第 1 页')).toBe(2)
    expect(logs().filter((line) => line.includes('列表 all 第 1 页 被取消'))).toHaveLength(1)
  })

  it('StrictMode：queryFn 不读 signal 时第一次请求不会被取消，重新订阅后直接复用，只执行一次', async () => {
    const client = newClient(new QueryClient())
    let calls = 0
    function Probe() {
      const query = useQuery({
        queryKey: ['no-signal'],
        queryFn: async () => {
          calls += 1
          await new Promise((resolve) => setTimeout(resolve, DELAY))
          return 'ok'
        },
      })
      return <span>{query.data ?? '…'}</span>
    }
    render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>
      </StrictMode>,
    )
    expect(await screen.findByText('ok')).toBeInTheDocument()
    expect(calls).toBe(1)
  })

  it('tracked properties：只读 data 的组件不因 isFetching 变化重渲染；...rest 展开后每次变化都重渲染', async () => {
    const client = newClient(new QueryClient())
    const renders = { tracked: 0, spread: 0 }
    const queryFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, DELAY))
      return { value: 1 }
    }
    function Tracked() {
      renders.tracked += 1
      const { data } = useQuery({ queryKey: ['tracked'], queryFn })
      return <span>tracked:{data?.value ?? '…'}</span>
    }
    function Spread() {
      renders.spread += 1
      const { data, ...rest } = useQuery({ queryKey: ['tracked'], queryFn })
      return (
        <span>
          spread:{data?.value ?? '…'}:{Object.keys(rest).length > 0 ? 'y' : 'n'}
        </span>
      )
    }
    render(
      <QueryClientProvider client={client}>
        <Tracked />
        <Spread />
      </QueryClientProvider>,
    )
    await screen.findByText('tracked:1')
    const before = { ...renders }

    // 分两段 act：同一个 act 里的几次更新会被合并成一次渲染，分开才能看到「开始请求」「请求完成」各自的渲染
    await act(async () => {
      void client.refetchQueries({ queryKey: ['tracked'] })
      await new Promise((resolve) => setTimeout(resolve, 5)) // fetchStatus 变成 fetching 的通知
    })
    const mid = { ...renders }
    await act(() => new Promise((resolve) => setTimeout(resolve, DELAY * 3))) // 请求完成

    // 重取到的内容相同（结构共享保住了 data 引用），变的只有 isFetching、dataUpdatedAt 这些字段
    expect(renders.tracked).toBe(before.tracked)
    expect(mid.spread).toBeGreaterThan(before.spread)
    expect(renders.spread).toBeGreaterThan(mid.spread)
  })

  it('结构共享：重取到内容相同的数据时 data 引用不变', async () => {
    const client = newClient(new QueryClient())
    const seen: unknown[] = []
    function Probe() {
      const { data } = useQuery({ queryKey: ['shared'], queryFn: async () => ({ items: [{ id: 1 }] }) })
      if (data) seen.push(data)
      return <span>{data ? 'ready' : '…'}</span>
    }
    render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    )
    await screen.findByText('ready')
    const first = client.getQueryData(['shared'])

    await act(() => client.refetchQueries({ queryKey: ['shared'] }))

    expect(client.getQueryData(['shared'])).toBe(first)
    expect(new Set(seen).size).toBe(1)
  })

  it('同一个 key 两处 useQuery 写了不同的 queryFn：执行的是发起这次请求的观察者那一份，另一份不会被调用', async () => {
    const client = newClient(new QueryClient())
    const fnA = vi.fn(async () => 'A')
    const fnB = vi.fn(async () => 'B')
    function A() {
      const { data } = useQuery({ queryKey: ['same-key'], queryFn: fnA })
      return <span>A 看到：{data ?? '…'}</span>
    }
    function B() {
      const { data } = useQuery({ queryKey: ['same-key'], queryFn: fnB })
      return <span>B 看到：{data ?? '…'}</span>
    }
    render(
      <QueryClientProvider client={client}>
        <A />
        <B />
      </QueryClientProvider>,
    )
    expect(await screen.findByText('B 看到：A')).toBeInTheDocument()
    expect(fnA).toHaveBeenCalledTimes(1)
    expect(fnB).not.toHaveBeenCalled()
  })

  it('useQuery 写在 QueryClientProvider 之外会报「No QueryClient set」', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Outside() {
      useQuery({ queryKey: ['x'], queryFn: async () => 1 })
      return null
    }
    expect(() => render(<Outside />)).toThrow('No QueryClient set, use QueryClientProvider to set one')
    consoleError.mockRestore()
  })
})

describe('Example 入口', () => {
  it('六个区块都渲染出来，列表数据到位（入口用页面上的 800ms 延迟）', async () => {
    render(<Example />)
    for (const n of ['一', '二', '三', '四', '五', '六']) {
      expect(screen.getByRole('heading', { name: new RegExp(`区块${n}`) })).toBeInTheDocument()
    }
    await waitFor(() => expect(listRows()).toHaveLength(5), { timeout: 3000 })
  })
})
