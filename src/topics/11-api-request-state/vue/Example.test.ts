/**
 * 11 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看。
 * 用 @vue/test-utils 挂载（挂到 document.body），查询与操作借用 Testing Library 与 user-event。
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import WatchRequestPanel from './WatchRequestPanel.vue'
import Example from './Example.vue'

enableAutoUnmount(afterEach)

const DELAY = 20
const SLOW = 300

function setup(delayMs = DELAY) {
  const wrapper = mount(WatchRequestPanel, { props: { delayMs }, attachTo: document.body })
  return { wrapper, ui: within(wrapper.element as HTMLElement), user: userEvent.setup({ delay: null }) }
}

const rows = (ui: ReturnType<typeof within>) => within(ui.getByRole('table')).getAllByRole('row').slice(1)

describe('Vue：watch 驱动的请求', () => {
  it('初始自动加载（immediate）：先「加载中」，成功后渲染表格', async () => {
    const { ui } = setup(SLOW)

    expect(ui.getByText('加载中，请稍候…')).toBeInTheDocument()

    await vi.waitFor(() => expect(ui.getByRole('table')).toBeInTheDocument())
    expect(rows(ui).length).toBeGreaterThan(0)
  })

  it('空态不是错误态：没有重试按钮', async () => {
    const { ui, user } = setup()
    await vi.waitFor(() => expect(ui.getByRole('table')).toBeInTheDocument())

    await user.type(ui.getByLabelText('搜索关键词'), 'zzz')
    await user.click(ui.getByRole('button', { name: '搜索' }))

    await vi.waitFor(() => expect(ui.getByText(/没有找到与「zzz」匹配的用户/)).toBeInTheDocument())
    expect(ui.queryByRole('table')).not.toBeInTheDocument()
    expect(ui.queryByRole('button', { name: '重试' })).not.toBeInTheDocument()
  })

  it('失败：role="alert" + 重试按钮；关掉开关后恢复成功', async () => {
    const { ui, user } = setup()
    await vi.waitFor(() => expect(ui.getByRole('table')).toBeInTheDocument())

    await user.click(ui.getByLabelText('让请求失败'))
    await vi.waitFor(() => expect(ui.getByRole('alert')).toHaveTextContent('网络错误'))

    await user.click(ui.getByLabelText('让请求失败'))
    await vi.waitFor(() => expect(ui.getByRole('table')).toBeInTheDocument())
    expect(ui.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('切换关键词时旧数据留在屏幕上，只多一个「刷新中…」', async () => {
    const { ui, user } = setup(SLOW)
    await vi.waitFor(() => expect(ui.getByRole('table')).toBeInTheDocument())
    const before = rows(ui).length

    await user.type(ui.getByLabelText('搜索关键词'), '张')
    await user.click(ui.getByRole('button', { name: '搜索' }))
    await flushPromises()

    expect(ui.getByText(/刷新中…（下面还是上一次的结果）/)).toBeInTheDocument()
    expect(rows(ui)).toHaveLength(before)

    await vi.waitFor(() => expect(rows(ui)).toHaveLength(1))
  })

  it('onWatcherCleanup 取消上一次请求：连续切换关键词只渲染最后一次的结果', async () => {
    const { ui, user } = setup(SLOW)
    await vi.waitFor(() => expect(ui.getByRole('table')).toBeInTheDocument())

    await user.type(ui.getByLabelText('搜索关键词'), '张')
    await user.click(ui.getByRole('button', { name: '搜索' }))
    await user.clear(ui.getByLabelText('搜索关键词'))
    await user.type(ui.getByLabelText('搜索关键词'), '王')
    await user.click(ui.getByRole('button', { name: '搜索' }))

    await vi.waitFor(() => expect(rows(ui)).toHaveLength(1))
    expect(within(ui.getByRole('table')).getByText('王芳')).toBeInTheDocument()
    expect(ui.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('搜同一个关键词也会重新请求：参数指纹里的重试计数 +1', async () => {
    const { ui, user } = setup()
    await vi.waitFor(() => expect(ui.getByRole('table')).toBeInTheDocument())

    await user.type(ui.getByLabelText('搜索关键词'), '王')
    await user.click(ui.getByRole('button', { name: '搜索' }))
    await vi.waitFor(() => expect(ui.getByText(/参数指纹/)).toHaveTextContent('王|1'))

    await user.click(ui.getByRole('button', { name: '搜索' }))
    await vi.waitFor(() => expect(ui.getByText(/参数指纹/)).toHaveTextContent('王|2'))
  })
})

describe('Example 入口', () => {
  it('主线面板和方案对照表都渲染出来', async () => {
    const wrapper = mount(Example, { attachTo: document.body })
    const ui = within(wrapper.element as HTMLElement)

    expect(ui.getByRole('heading', { name: /区块一：watch 驱动的请求/ })).toBeInTheDocument()
    expect(ui.getByRole('heading', { name: /区块二：四种取数方案在 Vue 里的对应物/ })).toBeInTheDocument()
    await vi.waitFor(() => expect(ui.getAllByRole('table')).toHaveLength(2))
  })
})
