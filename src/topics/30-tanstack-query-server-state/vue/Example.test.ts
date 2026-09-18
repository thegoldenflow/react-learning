/**
 * 30 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看（缓存规则来自同一个 query-core，这里重点测 Vue 侧的写法差异）。
 * 用 @vue/test-utils 挂载（挂到 document.body），查询与操作借用 Testing Library 与 user-event。
 * 每个用例新建 QueryClient 和演示工具；共用 mockApi 的订单数据是模块级可变的，标记类用例先切到「待支付」。
 */
import { defineComponent, h } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { QueryClient, VueQueryPlugin, onlineManager, useQuery } from '@tanstack/vue-query'
import OrdersWorkbench from './OrdersWorkbench.vue'
import Example from './Example.vue'
import { createTopic30QueryPlugin } from './queryPlugin'
import { createDemoQueryClient, createOrdersDemo } from './ordersDemo'

enableAutoUnmount(afterEach)

const DELAY = 20
const SLOW = 300

const clients: QueryClient[] = []
afterEach(() => {
  onlineManager.setOnline(true)
  clients.splice(0).forEach((client) => client.clear())
})

function setup({ delayMs = DELAY, staleTime }: { delayMs?: number; staleTime?: number } = {}) {
  const demo = createOrdersDemo({ delayMs })
  const queryClient = createDemoQueryClient({ staleTime })
  clients.push(queryClient)
  const wrapper = mount(OrdersWorkbench, {
    props: { demo },
    attachTo: document.body,
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
  const ui = within(wrapper.element as HTMLElement)
  const logs = () => demo.log.lines.value
  const runs = (label: string) => logs().filter((line) => line.includes(`queryFn 执行：${label}`)).length
  const field = (table: string, name: string) =>
    ui.getByRole('table', { name: table }).querySelector(`[data-field="${name}"]`)?.textContent?.trim()
  const listRows = () => within(ui.getByRole('table', { name: '订单列表' })).getAllByRole('row').slice(1)
  const card = (heading: RegExp) => within(ui.getByRole('heading', { name: heading }).closest('.card') as HTMLElement)
  const statusSelect = () => ui.getByRole('combobox', { name: /状态筛选/ })
  return { wrapper, demo, ui, logs, runs, field, listRows, card, statusSelect, user: userEvent.setup({ delay: null }) }
}

describe('Vue：区块一（同一个 query-core，写法换成 key 里放 getter + 解构 ref）', () => {
  it('首次加载 pending + fetching，成功后渲染；徽标同一个 key 只执行一次 queryFn', async () => {
    const { field, listRows, runs, ui } = setup({ delayMs: SLOW })

    await vi.waitFor(() => expect(field('列表查询的状态', 'fetchStatus')).toBe('fetching'))
    expect(field('列表查询的状态', 'isLoading')).toBe('true')

    await vi.waitFor(() => expect(listRows()).toHaveLength(5))
    expect(ui.getByText('共 15 条')).toBeInTheDocument()
    expect(runs('列表 all 第 1 页')).toBe(1)
  })

  it('queryKey 里放 getter：改筛选就换 key；staleTime 内切回来不再执行 queryFn', async () => {
    const { listRows, runs, statusSelect, user } = setup()
    await vi.waitFor(() => expect(listRows()).toHaveLength(5))

    await user.selectOptions(statusSelect(), '已支付')
    await vi.waitFor(() => expect(runs('列表 paid 第 1 页')).toBe(1))
    await user.selectOptions(statusSelect(), '全部')

    await vi.waitFor(() => expect(listRows()).toHaveLength(5))
    expect(runs('列表 all 第 1 页')).toBe(1)
  })

  it('哈希结果与 React 侧相同：对象的键排过序', async () => {
    const { card, listRows } = setup()
    await vi.waitFor(() => expect(listRows()).toHaveLength(5))
    expect(card(/区块五/).getByText('["orders","list",{"page":1,"status":"all"}]')).toBeInTheDocument()
  })

  it('keepPreviousData：翻页时旧数据垫着，isPlaceholderData 为 true', async () => {
    const { field, listRows, ui, user } = setup({ delayMs: SLOW })
    await vi.waitFor(() => expect(listRows()).toHaveLength(5))

    await user.click(ui.getByLabelText(/保留上一页/))
    await user.click(ui.getByRole('button', { name: '下一页' }))

    await vi.waitFor(() => expect(field('列表查询的状态', 'isPlaceholderData')).toBe('true'))
    expect(listRows()[0]).toHaveTextContent('SO-2026-0001')
    await vi.waitFor(() => expect(listRows()[0]).toHaveTextContent('SO-2026-0006'))
    expect(field('列表查询的状态', 'isPlaceholderData')).toBe('false')
  })

  it('离线：pending + paused；取消勾选恢复在线后自动继续；勾着离开本题时 onWatcherCleanup 也会恢复在线', async () => {
    const { field, listRows, runs, statusSelect, ui, user, wrapper } = setup()
    await vi.waitFor(() => expect(listRows()).toHaveLength(5))

    await user.click(ui.getByLabelText(/模拟断网/))
    await user.selectOptions(statusSelect(), '已取消')
    await vi.waitFor(() => expect(field('列表查询的状态', 'fetchStatus')).toBe('paused'))
    expect(field('列表查询的状态', 'status')).toBe('pending')
    expect(runs('列表 cancelled 第 1 页')).toBe(0)

    await user.click(ui.getByLabelText(/模拟断网/))
    await vi.waitFor(() => expect(field('列表查询的状态', 'status')).toBe('success'))
    expect(runs('列表 cancelled 第 1 页')).toBe(1)

    await user.click(ui.getByLabelText(/模拟断网/))
    expect(onlineManager.isOnline()).toBe(false)
    wrapper.unmount()
    expect(onlineManager.isOnline()).toBe(true)
  })

  it('失败：isError，上一次的数据还在，缓存条目自动标记已失效', async () => {
    const { card, field, listRows, ui, user } = setup()
    await vi.waitFor(() => expect(listRows()).toHaveLength(5))

    await user.click(ui.getByRole('button', { name: '刷新（模拟失败）' }))

    await vi.waitFor(() => expect(card(/区块一/).getByRole('alert')).toHaveTextContent('网络错误'))
    expect(field('列表查询的状态', 'status')).toBe('error')
    expect(listRows()).toHaveLength(5)
    expect(card(/区块五/).getByText('已失效')).toBeInTheDocument()
  })

  it('Vue 专属的坑：不解构的 listQuery.isFetching 是 ref 对象，三元表达式里总按真值处理', async () => {
    const { listRows, ui } = setup()
    await vi.waitFor(() => expect(listRows()).toHaveLength(5))
    const pitfall = ui.getByText(/Vue 专属的坑/)
    expect(pitfall).toHaveTextContent('得到「请求中」；')
    expect(pitfall).toHaveTextContent('得到「空闲」')
  })
})

describe('Vue：区块二（mutation）', () => {
  it('失效重取：useMutation 级回调先于 mutate 级；mutation 结束时列表已是重取后的数据', async () => {
    const { field, listRows, logs, statusSelect, ui, user } = setup({ delayMs: SLOW })
    await user.selectOptions(statusSelect(), '待支付')
    await vi.waitFor(() => expect(listRows().length).toBeGreaterThan(0), { timeout: 3000 })
    const orderNo = within(listRows()[0]).getAllByRole('cell')[0].textContent ?? ''

    await user.click(within(listRows()[0]).getByRole('button', { name: '标记为已支付' }))

    await vi.waitFor(() => expect(field('mutation 的状态', 'status')).toBe('success'), { timeout: 3000 })
    expect(ui.queryByText(orderNo)).not.toBeInTheDocument()
    const at = (text: string) => logs().findIndex((line) => line.includes(text))
    expect(at('useMutation 级 onSuccess')).toBeLessThan(at('useMutation 级 onSettled'))
    expect(at('useMutation 级 onSettled')).toBeLessThan(at('mutate 级 onSuccess'))
  })

  it('乐观更新 · 改缓存：立刻显示已支付，失败后用快照回滚', async () => {
    const { card, listRows, logs, statusSelect, ui, user } = setup({ delayMs: SLOW })
    await user.selectOptions(statusSelect(), '待支付')
    await vi.waitFor(() => expect(listRows().length).toBeGreaterThan(0), { timeout: 3000 })
    await user.click(ui.getByLabelText(/onMutate 改缓存/))
    await user.click(ui.getByLabelText('让 mutation 失败（看回滚）'))

    await user.click(within(listRows()[0]).getByRole('button', { name: '标记为已支付' }))

    await vi.waitFor(() => expect(listRows()[0]).toHaveTextContent('已支付'))
    await vi.waitFor(() => expect(card(/区块二/).getByRole('alert')).toHaveTextContent('网络错误'), { timeout: 3000 })
    await vi.waitFor(() => expect(listRows()[0]).toHaveTextContent('待支付'))
    expect(logs().some((line) => line.includes('用快照把缓存回滚了'))).toBe(true)
  })

  it('乐观更新 · variables：在途时显示「已支付（待确认）」，失败后回到真实值', async () => {
    const { card, listRows, statusSelect, ui, user } = setup({ delayMs: SLOW })
    await user.selectOptions(statusSelect(), '待支付')
    await vi.waitFor(() => expect(listRows().length).toBeGreaterThan(0), { timeout: 3000 })
    await user.click(ui.getByLabelText(/用 variables 渲染/))
    await user.click(ui.getByLabelText('让 mutation 失败（看回滚）'))

    await user.click(within(listRows()[0]).getByRole('button', { name: '标记为已支付' }))

    await vi.waitFor(() => expect(listRows()[0]).toHaveTextContent('已支付（待确认）'))
    await vi.waitFor(() => expect(card(/区块二/).getByRole('alert')).toHaveTextContent('网络错误'), { timeout: 3000 })
    expect(listRows()[0]).toHaveTextContent('待支付')
  })
})

describe('Vue：区块三、四', () => {
  it('依赖查询：没选中时 pending + idle，选中一行后才请求', async () => {
    const { card, field, listRows, runs, user } = setup()
    await vi.waitFor(() => expect(listRows()).toHaveLength(5))
    expect(field('详情查询的状态', 'status')).toBe('pending')
    expect(field('详情查询的状态', 'fetchStatus')).toBe('idle')
    expect(runs('详情')).toBe(0)

    await user.click(listRows()[0])
    await vi.waitFor(() => expect(card(/区块三/).getByText('SO-2026-0001')).toBeInTheDocument())
    expect(runs('详情 o1')).toBe(1)
  })

  it('<Suspense>：先显示 fallback；清空缓存并失败 → onErrorCaptured；重试后恢复', async () => {
    const { card, ui, user } = setup({ delayMs: SLOW })
    const stats = () => card(/区块四/)
    expect(stats().getByText(/统计加载中/)).toBeInTheDocument()
    await vi.waitFor(() => expect(stats().getByText(/共 15 单/)).toBeInTheDocument(), { timeout: 3000 })

    await user.click(ui.getByRole('button', { name: '清空缓存并让请求失败' }))
    await vi.waitFor(() => expect(stats().getByText(/统计加载中/)).toBeInTheDocument())
    await vi.waitFor(() => expect(stats().getByRole('alert')).toHaveTextContent('onErrorCaptured 接住'), { timeout: 3000 })

    await user.click(stats().getByRole('button', { name: '重试' }))
    await vi.waitFor(() => expect(stats().getByText(/共 15 单/)).toBeInTheDocument(), { timeout: 3000 })
  })
})

describe('Vue：其它结论', () => {
  it('没有安装 VueQueryPlugin 时 useQueryClient 找不到 QueryClient', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Bare = defineComponent({
      setup() {
        useQuery({ queryKey: ['x'], queryFn: async () => 1 })
        return () => h('span')
      },
    })
    expect(() => mount(Bare)).toThrow("No 'queryClient' found in Vue context")
    warn.mockRestore()
  })

  it('Example 入口：通过 queryPlugin.ts 的工厂装好 QueryClient，六个区块都渲染', async () => {
    const wrapper = mount(Example, { attachTo: document.body, global: { plugins: [createTopic30QueryPlugin()] } })
    const ui = within(wrapper.element as HTMLElement)
    for (const n of ['一', '二', '三', '四', '五', '六']) {
      expect(ui.getByRole('heading', { name: new RegExp(`区块${n}`) })).toBeInTheDocument()
    }
    await vi.waitFor(() => expect(ui.getByRole('table', { name: '订单列表' })).toBeInTheDocument(), { timeout: 3000 })
  })
})
