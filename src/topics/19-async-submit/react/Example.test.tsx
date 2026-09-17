/**
 * 19 题的结论测试：文件头里讲的关键结论，每条都在这里有一个可以运行的证明。
 * 模拟接口的延迟用 20ms（够看到「提交中」，又不拖慢测试）。测试写法在 34 题（待新增）详细讲。
 *
 * 约定（同 07 / 18 题）：userEvent.setup({ delay: null })；需要「同一轮事件里提交两次」时，
 * 在一个 act 回调里连续调用两次 form.requestSubmit()，两次提交之间 React 来不及重新渲染。
 */
import { act } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionSubmitForm } from './ActionSubmitForm'
import { ManualSubmitForm } from './ManualSubmitForm'
import Example from './Example'

const DELAY = 20
/** 要断言「提交中」这个中间状态时用长一点的延迟，免得机器忙时请求先结束了 */
const SLOW = 300
const wait = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)))

/** 日志面板里的每一行 */
function logLines(label: string) {
  return within(screen.getByRole('list', { name: label }))
    .getAllByRole('listitem')
    .map((li) => li.textContent ?? '')
}

async function fillOrder(user: ReturnType<typeof userEvent.setup>, customer: string, amount: string) {
  await user.type(screen.getByLabelText('客户名称'), customer)
  await user.type(screen.getByLabelText('金额'), amount)
}

describe('主线：手写 submitting', () => {
  it('提交中按钮禁用、文案变成「提交中…」；成功后显示订单号并清空输入', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ManualSubmitForm delayMs={SLOW} />)
    await fillOrder(user, '张伟', '100')

    await user.click(screen.getByRole('button', { name: '创建订单' }))

    expect(await screen.findByRole('button', { name: '提交中…' })).toBeDisabled()
    // 提交中输入框也禁用（本课的取舍）
    expect(screen.getByLabelText('客户名称')).toBeDisabled()
    expect(await screen.findByRole('status')).toHaveTextContent(/创建成功！新订单号：SO-2026-\d{4}/)
    expect(screen.getByLabelText('客户名称')).toHaveValue('')
    expect(screen.getByRole('button', { name: '创建订单' })).toBeEnabled()
  })

  it('网络错误：role="alert" 显示错误和「重试」，输入保留；关掉模拟失败后点重试就成功', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ManualSubmitForm delayMs={DELAY} />)
    await fillOrder(user, '王芳', '88')
    await user.click(screen.getByLabelText('模拟网络失败'))

    await user.click(screen.getByRole('button', { name: '创建订单' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('网络错误')
    expect(screen.getByLabelText('客户名称')).toHaveValue('王芳')
    // finally 里恢复了 submitting：失败之后按钮可以再点
    expect(screen.getByRole('button', { name: '创建订单' })).toBeEnabled()

    await user.click(screen.getByLabelText('模拟网络失败'))
    await user.click(within(alert).getByRole('button', { name: '重试' }))
    expect(await screen.findByRole('status')).toHaveTextContent('创建成功')
  })

  it('字段错误：显示在字段旁（aria-describedby），没有重试按钮，焦点移到出错的字段', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ManualSubmitForm delayMs={DELAY} />)
    await user.type(screen.getByLabelText('金额'), '50')

    await user.click(screen.getByRole('button', { name: '创建订单' }))

    const customer = screen.getByLabelText('客户名称')
    await waitFor(() => expect(customer).toHaveAccessibleDescription('服务端校验失败：客户名称不能为空'))
    expect(customer).toHaveAttribute('aria-invalid', 'true')
    expect(customer).toHaveFocus()
    expect(screen.queryByRole('button', { name: '重试' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('金额')).toHaveValue('50')
  })

  it('同一轮事件里提交两次：有 useRef 锁只发一个请求；去掉锁只剩 state 守卫，两个请求都发出去了', async () => {
    const user = userEvent.setup({ delay: null })
    const { container } = render(<ManualSubmitForm delayMs={DELAY} />)
    await fillOrder(user, '李娜', '66')
    const form = container.querySelector('form')!

    await act(async () => {
      form.requestSubmit()
      form.requestSubmit()
    })
    await screen.findByRole('status')
    expect(logLines('手写版请求日志').filter((line) => line.includes('发出请求'))).toHaveLength(1)
    expect(logLines('手写版请求日志')).toContain('重复提交被 useRef 锁拦下')

    await user.click(screen.getByRole('button', { name: '清空' }))
    await user.click(screen.getByLabelText('去掉 useRef 锁（反例）'))
    await fillOrder(user, '李娜', '66')
    await act(async () => {
      form.requestSubmit()
      form.requestSubmit()
    })
    await wait(DELAY * 3)
    const lines = logLines('手写版请求日志')
    expect(lines.filter((line) => line.includes('发出请求'))).toHaveLength(2)
    expect(lines.filter((line) => line.includes('成功'))).toHaveLength(2)
  })

  it('上一次提交之后已经重新渲染过：再次提交被 state 守卫拦下（例如提交中又有代码调了一次 requestSubmit）', async () => {
    const user = userEvent.setup({ delay: null })
    const { container } = render(<ManualSubmitForm delayMs={DELAY} />)
    await fillOrder(user, '刘强', '10')
    const form = container.querySelector('form')!

    await act(async () => {
      form.requestSubmit()
    })
    // act 结束时第一次提交引起的渲染已经完成，submitting 已经是 true
    await act(async () => {
      form.requestSubmit()
    })

    expect(logLines('手写版请求日志')).toContain('重复提交被 state 守卫拦下')
    await screen.findByRole('status')
  })

  it('请求还没回来组件就卸载了：React 18 起卸载后的 setState 是空操作，不再报错', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup({ delay: null })
    const { unmount } = render(<ManualSubmitForm delayMs={DELAY} />)
    await fillOrder(user, '陈静', '20')

    await user.click(screen.getByRole('button', { name: '创建订单' }))
    unmount()
    await wait(DELAY * 3)

    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

describe('并排：React 19 Actions', () => {
  it('useFormStatus 让按钮在提交中禁用；成功后 React 自动清空非受控输入框', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ActionSubmitForm delayMs={SLOW} />)
    await fillOrder(user, '杨洋', '300')

    await user.click(screen.getByRole('button', { name: '创建订单' }))

    expect(await screen.findByRole('button', { name: '提交中…' })).toBeDisabled()
    expect(screen.getByText(/isPending（来自 useActionState）：true/)).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('创建成功')
    expect(screen.getByLabelText('客户名称')).toHaveValue('')
    expect(screen.getByLabelText('金额')).toHaveValue('')
  })

  it('action 返回错误 state 也算成功：非受控字段被重置；回填了 defaultValue 的字段保住，没回填的「备注」被清空', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ActionSubmitForm delayMs={DELAY} />)
    await fillOrder(user, '赵敏', '99')
    await user.type(screen.getByLabelText('备注（故意不回填）'), '加急')
    await user.click(screen.getByLabelText('模拟网络失败'))

    await user.click(screen.getByRole('button', { name: '创建订单' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('网络错误')
    expect(screen.getByLabelText('客户名称')).toHaveValue('赵敏')
    expect(screen.getByLabelText('金额')).toHaveValue('99')
    expect(screen.getByLabelText('备注（故意不回填）')).toHaveValue('')
  })

  it('同一轮事件里提交两次：两个 action 排队串行执行，不会被丢弃（所以照样要按 pending 禁用按钮）', async () => {
    const user = userEvent.setup({ delay: null })
    const { container } = render(<ActionSubmitForm delayMs={DELAY} />)
    await fillOrder(user, '孙丽', '45')
    const form = container.querySelector('form')!

    await act(async () => {
      form.requestSubmit()
      form.requestSubmit()
    })
    await waitFor(() => expect(logLines('Actions 版请求日志')).toHaveLength(4))

    const lines = logLines('Actions 版请求日志')
    expect(lines[0]).toMatch(/^#1 action 开始/)
    expect(lines[1]).toMatch(/^#1 成功/)
    expect(lines[2]).toMatch(/^#2 action 开始/)
    expect(lines[3]).toMatch(/^#2 成功/)
  })
})

describe('Example 入口', () => {
  it('主线和并排两个区块都渲染出来', () => {
    render(<Example />)

    expect(screen.getByRole('heading', { name: /区块一：手写 submitting/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /区块二：React 19 Actions/ })).toBeInTheDocument()
  })
})
