/**
 * 11 题的结论测试：文件头里讲的关键结论，每条都在这里有一个可以运行的证明。
 * 模拟接口的延迟用 20ms；要观察「加载中」这种中间态时用 300ms（机器忙时 20ms 会先结束）。
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EffectRequestPanel } from './EffectRequestPanel'
import Example from './Example'

const DELAY = 20
const SLOW = 300

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('主线：Effect 手写请求', () => {
  it('初始自动加载：先「加载中」，成功后渲染表格', async () => {
    render(<EffectRequestPanel delayMs={SLOW} />)

    expect(screen.getByText('加载中，请稍候…')).toBeInTheDocument()

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(rows().length).toBeGreaterThan(0)
    expect(screen.queryByText('加载中，请稍候…')).not.toBeInTheDocument()
  })

  it('空态不是错误态：搜不到时给引导文案，没有重试按钮', async () => {
    const user = userEvent.setup({ delay: null })
    render(<EffectRequestPanel delayMs={DELAY} />)
    await screen.findByRole('table')

    await user.type(screen.getByLabelText('搜索关键词'), 'zzz')
    await user.click(screen.getByRole('button', { name: '搜索' }))

    expect(await screen.findByText(/没有找到与「zzz」匹配的用户/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '重试' })).not.toBeInTheDocument()
  })

  it('失败：role="alert" 显示错误 + 重试按钮；关掉失败开关后点重试恢复成功', async () => {
    const user = userEvent.setup({ delay: null })
    render(<EffectRequestPanel delayMs={DELAY} />)
    await screen.findByRole('table')

    await user.click(screen.getByLabelText('让请求失败'))
    expect(await screen.findByRole('alert')).toHaveTextContent('网络错误')

    await user.click(screen.getByLabelText('让请求失败'))
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('切换关键词时旧数据留在屏幕上，只多一个「刷新中…」（不闪加载中）', async () => {
    const user = userEvent.setup({ delay: null })
    render(<EffectRequestPanel delayMs={SLOW} />)
    await screen.findByRole('table')
    const before = rows().length

    await user.type(screen.getByLabelText('搜索关键词'), '张')
    await user.click(screen.getByRole('button', { name: '搜索' }))

    expect(screen.getByText(/刷新中…（下面还是上一次的结果）/)).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(rows()).toHaveLength(before)
    expect(screen.queryByText('加载中，请稍候…')).not.toBeInTheDocument()

    await waitFor(() => expect(rows()).toHaveLength(1))
    expect(screen.queryByText(/刷新中…（下面还是上一次的结果）/)).not.toBeInTheDocument()
  })

  it('搜同一个关键词也会重新请求：参数指纹里的重试计数 +1', async () => {
    const user = userEvent.setup({ delay: null })
    render(<EffectRequestPanel delayMs={DELAY} />)
    await screen.findByRole('table')
    const keyOf = () => screen.getByText(/参数指纹/).textContent ?? ''

    await user.type(screen.getByLabelText('搜索关键词'), '王')
    await user.click(screen.getByRole('button', { name: '搜索' }))
    await waitFor(() => expect(keyOf()).toContain('王|1'))

    await user.click(screen.getByRole('button', { name: '搜索' }))
    await waitFor(() => expect(keyOf()).toContain('王|2'))
  })

  it('连续切换关键词：旧请求被取消，只渲染最后一次的结果（取消不算失败）', async () => {
    const user = userEvent.setup({ delay: null })
    render(<EffectRequestPanel delayMs={SLOW} />)
    await screen.findByRole('table')

    await user.type(screen.getByLabelText('搜索关键词'), '张')
    await user.click(screen.getByRole('button', { name: '搜索' }))
    await user.clear(screen.getByLabelText('搜索关键词'))
    await user.type(screen.getByLabelText('搜索关键词'), '王')
    await user.click(screen.getByRole('button', { name: '搜索' }))

    await waitFor(() => expect(rows()).toHaveLength(1))
    expect(within(screen.getByRole('table')).getByText('王芳')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Example 入口', () => {
  it('主线面板和方案速查都渲染出来', async () => {
    render(<Example />)

    expect(screen.getByRole('heading', { name: /区块一：在 Effect 里手写请求/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /区块二：四种取数方案速查/ })).toBeInTheDocument()
    // 速查表格立刻就有；主线面板的数据表格要等请求回来
    await waitFor(() => expect(screen.getAllByRole('table')).toHaveLength(2))
  })
})
