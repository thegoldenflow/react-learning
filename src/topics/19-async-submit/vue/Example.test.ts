/**
 * 19 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看。
 * 用 @vue/test-utils 挂载，查询与用户操作借用 Testing Library 与 user-event（挂到 document.body 上）。
 * Vue 的 DOM 更新是异步批量的：操作之后先 flushPromises()，再断言页面内容。
 */
import { createApp, defineComponent, h, onErrorCaptured } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import ManualSubmitForm from './ManualSubmitForm.vue'
import Example from './Example.vue'

enableAutoUnmount(afterEach)

const DELAY = 20
/** 要断言「提交中」这个中间状态时用长一点的延迟，免得机器忙时请求先结束了 */
const SLOW = 300
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function setup(delayMs = DELAY) {
  const wrapper = mount(ManualSubmitForm, { props: { delayMs }, attachTo: document.body })
  return { wrapper, ui: within(wrapper.element as HTMLElement), user: userEvent.setup({ delay: null }) }
}

function logLines(ui: ReturnType<typeof within>) {
  return within(ui.getByRole('list', { name: '手写版请求日志' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent?.trim() ?? '')
}

async function fillOrder(ui: ReturnType<typeof within>, user: ReturnType<typeof userEvent.setup>, customer: string, amount: string) {
  await user.type(ui.getByLabelText('客户名称'), customer)
  await user.type(ui.getByLabelText('金额'), amount)
}

describe('Vue 手写 submitting', () => {
  it('提交中禁用按钮、文案变成「提交中…」；成功后显示订单号并清空输入', async () => {
    const { ui, user } = setup(SLOW)
    await fillOrder(ui, user, '张伟', '100')

    await user.click(ui.getByRole('button', { name: '创建订单' }))
    await flushPromises()
    expect(ui.getByRole('button', { name: '提交中…' })).toBeDisabled()
    expect(ui.getByLabelText('客户名称')).toBeDisabled()

    await vi.waitFor(() => expect(ui.getByRole('status')).toHaveTextContent(/创建成功！新订单号：SO-2026-\d{4}/))
    expect(ui.getByLabelText('客户名称')).toHaveValue('')
    expect(ui.getByRole('button', { name: '创建订单' })).toBeEnabled()
  })

  it('网络错误：role="alert" + 重试按钮，输入保留；finally 里恢复了 submitting', async () => {
    const { ui, user } = setup()
    await fillOrder(ui, user, '王芳', '88')
    await user.click(ui.getByLabelText('模拟网络失败'))

    await user.click(ui.getByRole('button', { name: '创建订单' }))

    await vi.waitFor(() => expect(ui.getByRole('alert')).toHaveTextContent('网络错误'))
    expect(ui.getByLabelText('客户名称')).toHaveValue('王芳')
    expect(ui.getByRole('button', { name: '创建订单' })).toBeEnabled()

    await user.click(ui.getByLabelText('模拟网络失败'))
    await user.click(within(ui.getByRole('alert')).getByRole('button', { name: '重试' }))
    await vi.waitFor(() => expect(ui.getByRole('status')).toHaveTextContent('创建成功'))
  })

  it('字段错误：aria-describedby 读出错误，nextTick 之后焦点移到出错的字段', async () => {
    const { ui, user } = setup()
    await user.type(ui.getByLabelText('金额'), '50')

    await user.click(ui.getByRole('button', { name: '创建订单' }))

    await vi.waitFor(() =>
      expect(ui.getByLabelText('客户名称')).toHaveAccessibleDescription('服务端校验失败：客户名称不能为空'),
    )
    expect(ui.getByLabelText('客户名称')).toHaveAttribute('aria-invalid', 'true')
    expect(ui.getByLabelText('客户名称')).toHaveFocus()
    expect(ui.queryByRole('button', { name: '重试' })).not.toBeInTheDocument()
  })

  it('同一轮事件里提交两次：ref 同步生效，守卫直接拦下第二次，不需要 React 那样的 useRef 锁', async () => {
    const { wrapper, ui, user } = setup()
    await fillOrder(ui, user, '李娜', '66')
    const form = wrapper.get('form').element as HTMLFormElement

    form.requestSubmit()
    form.requestSubmit()
    await flushPromises()
    await vi.waitFor(() => expect(ui.getByRole('status')).toBeInTheDocument())

    const lines = logLines(ui)
    expect(lines.filter((line) => line.includes('发出请求'))).toHaveLength(1)
    expect(lines).toContain('重复提交被 submitting 守卫拦下')
  })

  it('请求还没回来组件就卸载了：不报错、不警告（这里用 createApp 手动挂载，避免测试工具重复卸载）', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(ManualSubmitForm, { delayMs: DELAY })
    app.mount(host)
    const ui = within(host)
    const user = userEvent.setup({ delay: null })
    await fillOrder(ui, user, '陈静', '20')

    await user.click(ui.getByRole('button', { name: '创建订单' }))
    app.unmount()
    host.remove()
    await wait(DELAY * 3)

    expect(consoleError).not.toHaveBeenCalled()
    expect(consoleWarn).not.toHaveBeenCalled()
    consoleError.mockRestore()
    consoleWarn.mockRestore()
  })
})

describe('Vue 的错误捕获面（和 React 的错误边界对照）', () => {
  it('事件处理函数的同步错误和 async 函数的 Promise 拒绝，都会进入父组件的 onErrorCaptured', async () => {
    const captured: string[] = []
    const Child = defineComponent(() => () =>
      h('div', [
        h(
          'button',
          {
            onClick: async () => {
              await Promise.resolve()
              throw new Error('异步失败')
            },
          },
          'async',
        ),
        h(
          'button',
          {
            onClick: () => {
              throw new Error('同步失败')
            },
          },
          'sync',
        ),
      ]),
    )
    const Parent = defineComponent(() => {
      onErrorCaptured((err, _instance, info) => {
        captured.push(`${(err as Error).message} | ${info}`)
        // 返回 false：错误不再往上抛，也不会走到 app.config.errorHandler / 控制台
        return false
      })
      return () => h(Child)
    })
    const wrapper = mount(Parent, { attachTo: document.body })

    await wrapper.findAll('button')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('button')[1].trigger('click')
    await flushPromises()

    expect(captured).toEqual(['异步失败 | native event handler', '同步失败 | native event handler'])
  })
})

describe('Example 入口', () => {
  it('手写区块和「Actions 在 Vue 里怎么写」说明卡片都渲染出来', () => {
    const wrapper = mount(Example, { attachTo: document.body })
    const ui = within(wrapper.element as HTMLElement)

    expect(ui.getByRole('heading', { name: /区块一：手写 submitting/ })).toBeInTheDocument()
    expect(ui.getByRole('heading', { name: /区块二：React 19 Actions 在 Vue 里怎么写/ })).toBeInTheDocument()
  })
})
