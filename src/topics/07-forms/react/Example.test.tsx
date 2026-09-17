/**
 * 07 题的结论测试：文件头里讲的关键结论，每条都在这里有一个可以运行的证明。
 * 测试工具与写法本身在 34 题（待新增）详细讲。
 *
 * 约定（同 18 题）：
 * - userEvent.setup({ delay: null })：模拟真实的键盘、鼠标操作；
 * - 输入法合成事件 user-event 模拟不了，这类底层事件用 fireEvent 直接派发；
 * - 开发环境的报错用 vi.spyOn(console, 'error') 接住，再断言内容（测试跑的是 React 开发构建）。
 */
import { act, Profiler, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ControlledProfileForm } from './ControlledProfileForm'
import { InputEventLab } from './InputEventLab'
import { TextField } from './TextField'
import { UncontrolledContactForm } from './UncontrolledContactForm'
import Example from './Example'

/** console.error 的调用里有没有包含某段文字的 */
function errorCalledWith(spy: { mock: { calls: unknown[][] } }, text: string) {
  return spy.mock.calls.some((args) => args.some((arg) => String(arg).includes(text)))
}

const liveState = () => screen.getByText(/实时 state/)

describe('受控：state 是唯一真相源', () => {
  it('每输入一个字符都经过 onChange → setState，实时 state 同步更新', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ControlledProfileForm />)

    const name = screen.getByLabelText('姓名')
    await user.clear(name)
    await user.type(name, '王五')

    expect(name).toHaveValue('王五')
    expect(liveState()).toHaveTextContent('"name":"王五"')
  })

  it('受控表单每输入一个字符提交一次渲染；非受控表单输入时一次都不渲染', async () => {
    const user = userEvent.setup({ delay: null })
    let commits = 0
    const countCommit = () => {
      commits += 1
    }

    const controlled = render(
      <Profiler id="controlled" onRender={countCommit}>
        <ControlledProfileForm />
      </Profiler>,
    )
    commits = 0
    await user.type(screen.getByLabelText('姓名'), 'abc')
    expect(commits).toBe(3)
    controlled.unmount()

    render(
      <Profiler id="uncontrolled" onRender={countCommit}>
        <UncontrolledContactForm saveDelayMs={0} />
      </Profiler>,
    )
    commits = 0
    await user.type(screen.getByLabelText('姓名'), 'abc')
    expect(screen.getByLabelText('姓名')).toHaveValue('周未名abc')
    expect(commits).toBe(0)
  })

  it('onChange 不接受的输入不写进 state，事件结束后 React 把 DOM 改回 state（字母被弹回）', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ControlledProfileForm />)

    const phone = screen.getByLabelText('手机号')
    await user.type(phone, '138a0')

    expect(phone).toHaveValue('1380')
    expect(liveState()).toHaveTextContent('"phone":"1380"')
  })

  it('type="number" 的 value 也是字符串：state 里存字符串，保存时才转成数字', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ControlledProfileForm />)

    await user.type(screen.getByLabelText('年龄'), '28')
    expect(liveState()).toHaveTextContent('"age":"28"')

    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(await screen.findByText(/年龄 28/)).toBeInTheDocument()
  })

  it('<select value>、<textarea value>、radio 与 checkbox 的 checked 都由 state 决定', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ControlledProfileForm />)

    await user.selectOptions(screen.getByLabelText('角色'), 'admin')
    await user.type(screen.getByLabelText('简介'), '前端')
    await user.click(screen.getByLabelText('电话'))
    await user.click(screen.getByLabelText('订阅通知'))

    expect(liveState()).toHaveTextContent('"role":"admin"')
    expect(liveState()).toHaveTextContent('"bio":"前端"')
    expect(liveState()).toHaveTextContent('"contact":"phone"')
    expect(liveState()).toHaveTextContent('"subscribe":false')
    expect(screen.getByLabelText('邮件')).not.toBeChecked()
  })
})

describe('受控的边界：开发环境的两类报错', () => {
  it('value 不配 onChange：开发环境报错、打不进字；写了 readOnly 就不报', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup({ delay: null })
    render(<input aria-label="只有 value" value="固定值" />)

    await user.type(screen.getByLabelText('只有 value'), 'x')

    expect(screen.getByLabelText('只有 value')).toHaveValue('固定值')
    expect(errorCalledWith(consoleError, 'without an `onChange` handler')).toBe(true)

    consoleError.mockClear()
    render(<ControlledProfileForm />)
    expect(screen.getByLabelText('账号 ID')).toHaveAttribute('readonly')
    expect(errorCalledWith(consoleError, 'without an `onChange` handler')).toBe(false)
    consoleError.mockRestore()
  })

  it('初始值是 undefined、输入后变成字符串：报「changing an uncontrolled input to be controlled」', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup({ delay: null })
    function SwitchingInput() {
      const [value, setValue] = useState<string | undefined>(undefined)
      return <input aria-label="初始值 undefined" value={value} onChange={(e) => setValue(e.target.value)} />
    }
    render(<SwitchingInput />)

    await user.type(screen.getByLabelText('初始值 undefined'), 'a')

    expect(errorCalledWith(consoleError, 'changing an uncontrolled input to be controlled')).toBe(true)
    consoleError.mockRestore()
  })
})

describe('useId 与无障碍关联', () => {
  it('label 通过 htmlFor 关联输入框；同一个组件渲染两份得到不同的 id；19.2 的默认前缀是 _r_', () => {
    render(
      <>
        <TextField label="甲" name="a" value="" onChange={() => {}} />
        <TextField label="乙" name="b" value="" onChange={() => {}} />
      </>,
    )

    const a = screen.getByLabelText('甲')
    const b = screen.getByLabelText('乙')
    expect(a.id).not.toBe(b.id)
    expect(a.id).toMatch(/^_r_/)
  })

  it('一页有多个 React 根：createRoot 传 identifierPrefix，生成的 id 带上各自的前缀', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container, { identifierPrefix: 'admin-' })

    await act(async () => {
      root.render(<TextField label="丙" name="c" value="" onChange={() => {}} />)
    })

    expect(within(container).getByLabelText('丙').id).toMatch(/^_admin-r_/)
    act(() => root.unmount())
    container.remove()
  })

  it('提交失败：错误信息经 aria-describedby 读出、aria-invalid 为 true，焦点移到第一个出错的字段；改对后错误随即消失', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ControlledProfileForm />)

    await user.clear(screen.getByLabelText('姓名'))
    await user.click(screen.getByLabelText('电话'))
    await user.click(screen.getByRole('button', { name: '保存' }))

    const name = screen.getByLabelText('姓名')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('姓名不能为空')
    expect(name).toHaveFocus()
    expect(screen.getByLabelText('手机号')).toHaveAccessibleDescription(/只收数字.*手机号要填满 11 位/)

    // 错误是从 state 派生出来的：改对之后下一次渲染就没有了
    await user.type(name, '赵六')
    expect(name).not.toHaveAttribute('aria-invalid')
  })
})

describe('非受控：值由 DOM 保管，需要时读一次', () => {
  const submitButton = () => screen.getByRole('button', { name: '提交（读 FormData）' })

  it('FormData 只包含有 name 的字段；取消勾选的 checkbox 不在里面', async () => {
    const user = userEvent.setup({ delay: null })
    render(<UncontrolledContactForm saveDelayMs={0} />)

    await user.click(submitButton())
    expect(
      await screen.findByText(/FormData 里的字段：quickName、quickEmail、quickRole、quickNote、quickSubscribe（/),
    ).toBeInTheDocument()

    await user.click(screen.getByLabelText('订阅通知'))
    await user.click(submitButton())
    expect(await screen.findByText(/FormData 里的字段：quickName、quickEmail、quickRole、quickNote（/)).toBeInTheDocument()
  })

  it('e.currentTarget 在事件处理函数返回后被置为 null：await 之后读到 null', async () => {
    const user = userEvent.setup({ delay: null })
    render(<UncontrolledContactForm saveDelayMs={0} />)

    await user.click(submitButton())

    expect(await screen.findByText(/await 之后读 e.currentTarget：null/)).toBeInTheDocument()
  })

  it('ref.current.value 单独读一个字段', async () => {
    const user = userEvent.setup({ delay: null })
    render(<UncontrolledContactForm saveDelayMs={0} />)

    await user.type(screen.getByLabelText('姓名'), '！')
    await user.click(screen.getByRole('button', { name: '用 ref 读姓名' }))

    expect(screen.getByText('ref 读到的姓名：周未名！')).toBeInTheDocument()
  })

  it('保留浏览器原生校验：必填的姓名清空后提交被拦下，onSubmit 不执行', async () => {
    const user = userEvent.setup({ delay: null })
    render(<UncontrolledContactForm saveDelayMs={0} />)

    await user.clear(screen.getByLabelText('姓名'))
    await user.click(submitButton())
    // 如果 onSubmit 执行了，保存结果会在一个定时器之后出现；等过这段时间再断言「没有出现」才有意义
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))

    expect(screen.getByLabelText('姓名')).toBeInvalid()
    expect(screen.queryByText(/已提交/)).not.toBeInTheDocument()
  })

  it('defaultValue 改了，用户改过的输入框不跟着变；换 key 重新挂载后新的默认值才生效', async () => {
    const user = userEvent.setup({ delay: null })
    render(<UncontrolledContactForm saveDelayMs={0} />)

    await user.type(screen.getByLabelText('姓名'), '！')
    await user.click(screen.getByRole('button', { name: '换默认姓名' }))
    expect(screen.getByLabelText('姓名')).toHaveValue('周未名！')

    await user.click(screen.getByRole('button', { name: '换 key 重新挂载' }))
    expect(screen.getByLabelText('姓名')).toHaveValue('陈阿四')
  })

  it('React 19 的 <form action>：action 成功后非受控字段重置为默认值，受控字段保持 state 里的值', async () => {
    const user = userEvent.setup({ delay: null })
    const saved: string[] = []
    function ActionForm() {
      const [title, setTitle] = useState('受控标题')
      return (
        <form
          action={async (formData) => {
            saved.push(String(formData.get('note')))
          }}
        >
          <input aria-label="非受控备注" name="note" defaultValue="默认备注" />
          <input aria-label="受控标题" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button type="submit">提交</button>
        </form>
      )
    }
    render(<ActionForm />)

    await user.type(screen.getByLabelText('非受控备注'), '（改过）')
    await user.type(screen.getByLabelText('受控标题'), '（改过）')
    await user.click(screen.getByRole('button', { name: '提交' }))

    await waitFor(() => expect(screen.getByLabelText('非受控备注')).toHaveValue('默认备注'))
    expect(saved).toEqual(['默认备注（改过）'])
    expect(screen.getByLabelText('受控标题')).toHaveValue('受控标题（改过）')
  })
})

describe('onChange 的触发时机（InputEventLab）', () => {
  const logText = () => screen.getByRole('list', { name: '输入事件日志' })

  it('onChange 像原生 input 事件，每输入一个字符触发一次；原生 change 要等失焦才触发', async () => {
    const user = userEvent.setup({ delay: null })
    render(<InputEventLab />)

    await user.type(screen.getByLabelText('实验输入框'), 'ab')
    expect(logText()).toHaveTextContent('onChange：a')
    expect(logText()).toHaveTextContent('onChange：ab')
    expect(logText()).not.toHaveTextContent('原生 change')

    await user.tab()
    expect(logText()).toHaveTextContent('原生 change：ab')
  })

  it('输入法拼写期间（compositionstart 之后、compositionend 之前）onChange 照样触发', () => {
    render(<InputEventLab />)
    const input = screen.getByLabelText('实验输入框')

    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: 'ni' } })
    fireEvent.input(input, { target: { value: 'nih' } })

    const lines = within(logText())
      .getAllByRole('listitem')
      .map((li) => li.textContent)
    expect(lines).toEqual(['compositionstart：开始拼写', 'onChange：ni', 'onChange：nih'])
  })
})

describe('Example 入口', () => {
  it('三个区块都渲染出来', () => {
    render(<Example />)

    expect(screen.getByRole('heading', { name: /区块一：受控表单/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /区块二：非受控表单/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /区块三：onChange 什么时候触发/ })).toBeInTheDocument()
  })
})
