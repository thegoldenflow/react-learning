/**
 * 02 题的结论测试：文件头里标了「测试覆盖」的结论都在这里有可运行的证明（react / react-dom 19.2.8，开发构建）。
 * 生产构建下改 props 的行为是 node + 生产构建的一次性实测，写在 Example.tsx 二-3 与附 3，不在这里。
 * 故意触发开发环境报错（console.error）的用例都 spy 住并断言文案，不让它进 stderr。测试工具本身在 34 题（待新增）细讲。
 */
import { Component, forwardRef, useRef, type ComponentProps, type ComponentPropsWithoutRef, type ComponentPropsWithRef } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectTypeOf } from 'vitest'
import Example from './Example'
import { MirrorPropsDemo } from './MirrorPropsDemo'
import { OrderCards } from './OrderCards'
import { ReadonlyPropsDemo } from './ReadonlyPropsDemo'
import { UiButtonDemo } from './UiButtonDemo'

let consoleError: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** React 的开发期报错是「格式串 + 参数」，拼起来再比对 */
const errorTexts = (): string[] =>
  consoleError.mock.calls.map((args: unknown[]) => {
    const [format, ...rest] = args.map(String)
    let i = 0
    return format.replace(/%s/g, () => rest[i++] ?? '')
  })

/** 区块一表格里某种写法那一行显示的结果 */
const rowResult = (code: string) => screen.getByText(code).closest('tr')!.querySelectorAll('td')[1].textContent

describe('区块一：props 的类型、解构与默认值', () => {
  it('三张订单卡：只有传了 discount 的那张显示折扣，其余走默认值 0', () => {
    render(<OrderCards />)
    const cards = ['SO-20260801', 'SO-20260802', 'SO-20260803'].map((no) => screen.getByText(no).closest('.card') as HTMLElement)
    expect(within(cards[1]).getByText(/立减 15%，应付 ￥4760\.00/)).toBeInTheDocument()
    expect(within(cards[0]).queryByText(/立减/)).toBeNull()
    expect(within(cards[2]).queryByText(/立减/)).toBeNull()
    expect(errorTexts()).toEqual([])
  })

  it('默认值只对「没传 / 传 undefined」生效；null 与空串原样收到；只写属性名 = 传 true；可选布尔 prop 不传是 undefined', () => {
    render(<OrderCards />)
    expect(rowResult('<NoteText />')).toBe('note = "（无备注）" · emphasis = undefined')
    expect(rowResult('<NoteText note={undefined} />')).toBe('note = "（无备注）" · emphasis = undefined')
    expect(rowResult('<NoteText note={null} />')).toBe('note = null · emphasis = undefined')
    expect(rowResult('<NoteText note="" />')).toBe('note = "" · emphasis = undefined')
    expect(rowResult('<NoteText emphasis />')).toBe('note = "（无备注）" · emphasis = true')
  })

  // 这条报错整个页面只报一次（模块级开关 specialPropKeyWarningShown），本文件只有这一个用例读 props.key
  it('key 不是 prop：组件读 props.key 得到 undefined，开发环境报错；要用这个值得另外用一个 prop 传', () => {
    let seenKey: unknown = 'not-read'
    function Row(props: { rowId: string }) {
      seenKey = (props as { key?: unknown }).key
      return <li>{props.rowId}</li>
    }
    render(
      <ul>
        <Row key="o1" rowId="o1" />
      </ul>,
    )
    expect(seenKey).toBeUndefined()
    expect(screen.getByText('o1')).toBeInTheDocument()
    expect(errorTexts()).toEqual([
      'Row: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)',
    ])
  })

  it('把带 key 的对象展开进 JSX：开发环境报错，key 要直接写在 JSX 上', () => {
    function Row({ rowId }: { rowId: string }) {
      return <li>{rowId}</li>
    }
    const rowProps = { key: 'o1', rowId: 'o1' }
    render(
      <ul>
        <Row {...rowProps} />
      </ul>,
    )
    expect(errorTexts()[0]).toMatch(/^A props object containing a "key" prop is being spread into JSX:/)
    expect(errorTexts()[0]).toContain('React keys must be passed directly to JSX without using spread:')
  })
})

describe('区块二：props 只读，改动靠回调上浮；props 是每次渲染的快照', () => {
  it('开发构建里 props 被冻结：直接赋值抛 TypeError，界面和父组件都不变', () => {
    render(<ReadonlyPropsDemo delayMs={0} />)
    fireEvent.click(screen.getByRole('button', { name: '❌ 直接改 props.amount = 0' }))
    const log = screen.getByRole('list', { name: '子组件日志' })
    expect(log).toHaveTextContent("TypeError: Cannot assign to read only property 'amount' of object '#<Object>'")
    expect(screen.getByText(/子组件收到的 amount/)).toHaveTextContent('子组件收到的 amount：100')
    expect(screen.getByText(/父组件的 state/)).toHaveTextContent('amount = 100')
  })

  it('函数组件拿到的 props 对象是冻结的（react.dev createElement：In development, React will freeze … its props property shallowly）', () => {
    let frozen: boolean | undefined
    function Probe(props: { amount: number }) {
      frozen = Object.isFrozen(props)
      return <span>{props.amount}</span>
    }
    render(<Probe amount={1} />)
    expect(frozen).toBe(true)
  })

  it('调用父组件传下来的回调：父组件改 state，新的 amount 传下来', () => {
    render(<ReadonlyPropsDemo delayMs={0} />)
    fireEvent.click(screen.getByRole('button', { name: '父组件 +100' }))
    fireEvent.click(screen.getByRole('button', { name: '✅ onAmountChange(0) 请父组件改' }))
    expect(screen.getByText(/父组件的 state/)).toHaveTextContent('amount = 0')
    expect(screen.getByText(/子组件收到的 amount/)).toHaveTextContent('子组件收到的 amount：0')
  })

  it('快照：定时器回调里读到的是点击那一次渲染的 amount，哪怕父组件已经传了新值', () => {
    vi.useFakeTimers()
    render(<ReadonlyPropsDemo delayMs={1500} />)
    fireEvent.click(screen.getByRole('button', { name: '稍后读取 amount（快照）' }))
    fireEvent.click(screen.getByRole('button', { name: '父组件 +100' }))
    expect(screen.getByText(/子组件收到的 amount/)).toHaveTextContent('子组件收到的 amount：200')
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(screen.getByRole('list', { name: '子组件日志' })).toHaveTextContent('1500ms 后读到 amount = 100（点击那一次渲染的快照）')
  })
})

describe('区块三：不要把 props 复制进 state', () => {
  it('useState(price) 停在第一次渲染的值；直接读 / 渲染时计算的跟着变', () => {
    render(<MirrorPropsDemo />)
    const inc = screen.getByRole('button', { name: '父组件 price +10' })
    fireEvent.click(inc)
    fireEvent.click(inc)
    expect(screen.getByTestId('mirrored')).toHaveTextContent('100')
    expect(screen.getByTestId('direct')).toHaveTextContent('120')
    expect(screen.getByTestId('with-tax')).toHaveTextContent('127')
  })

  it('initialPrice 有意只取初始值；父组件换 key 才按新的初始值重来', () => {
    render(<MirrorPropsDemo />)
    fireEvent.click(screen.getByRole('button', { name: '草稿 −10' }))
    expect(screen.getByTestId('draft')).toHaveTextContent('90')
    fireEvent.click(screen.getByRole('button', { name: '父组件 price +10' }))
    fireEvent.click(screen.getByRole('button', { name: '父组件 price +10' }))
    // 父组件的 price 已经是 120，草稿不跟着变（本地 state 只在第一次渲染读 initialPrice）
    expect(screen.getByTestId('draft')).toHaveTextContent('90')
    fireEvent.click(screen.getByRole('button', { name: '按当前 price 重开草稿（换 key）' }))
    expect(screen.getByTestId('draft')).toHaveTextContent('120')
  })
})

describe('区块四：接收原生属性与 ref 作为 prop', () => {
  it('onClick / disabled 靠 {...rest} 落到真实 button 上：禁用的按钮点了不触发', async () => {
    const user = userEvent.setup({ delay: null })
    render(<UiButtonDemo />)
    await user.click(screen.getByRole('button', { name: '点我（onClick 透传）' }))
    await user.click(screen.getByRole('button', { name: '已禁用' }))
    expect(screen.getByRole('button', { name: '已禁用' })).toBeDisabled()
    expect(screen.getByText(/onClick 触发次数/)).toHaveTextContent('onClick 触发次数：1')
  })

  it('type 默认 button、外部可覆盖；title / aria-label 原样透传', () => {
    render(<UiButtonDemo />)
    expect(screen.getByRole('button', { name: '点我（onClick 透传）' })).toHaveAttribute('type', 'button')
    expect(screen.getByRole('button', { name: 'type 被覆盖为 submit' })).toHaveAttribute('type', 'submit')
    const del = screen.getByRole('button', { name: '删除订单 SO-20260803' })
    expect(del).toHaveTextContent('删除')
    expect(del).toHaveAttribute('title', '这行 title 透传到真实 button 上，鼠标悬停可见')
  })

  it('className 与组件自己的类名合并；style 与组件内部样式合并', () => {
    render(<UiButtonDemo />)
    const btn = screen.getByRole('button', { name: 'className / style 被合并' })
    expect(btn.className).toBe('btn-primary btn-ghost')
    expect(btn.getAttribute('style')).toBe('font-size: 12px; padding: 2px 8px; margin-left: 8px;')
  })

  it('ref 作为 prop（React 19）：父组件的 ref 拿到的是真实的 <button>，可以直接 focus()', () => {
    render(<UiButtonDemo />)
    fireEvent.click(screen.getByRole('button', { name: /把焦点移到「删除」按钮/ }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '删除订单 SO-20260803' }))
    expect(screen.getByText(/^焦点在：/)).toHaveTextContent('焦点在：删除')
  })

  it('类型层：WithRef 带 ref、WithoutRef 不带；和原生属性同名、类型不兼容的 prop 要先 Omit', () => {
    expectTypeOf<ComponentPropsWithRef<'button'>>().toHaveProperty('ref')
    expectTypeOf<ComponentPropsWithoutRef<'button'>>().not.toHaveProperty('ref')
    // <input> 自带 size?: number。用 & 拼一个 'sm' | 'md' 不报错，但交出来的类型只剩 undefined（number 和字符串字面量没有交集）
    expectTypeOf<(ComponentPropsWithRef<'input'> & { size?: 'sm' | 'md' })['size']>().toEqualTypeOf<undefined>()
    // @ts-expect-error -- 用 interface 继承则直接报错：Interface 'BadInputProps' incorrectly extends interface …（size 的类型不兼容）
    interface BadInputProps extends ComponentPropsWithRef<'input'> { size?: 'sm' | 'md' }
    interface GoodInputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
      size?: 'sm' | 'md'
    }
    expectTypeOf<GoodInputProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>()
    // 用一下 BadInputProps，免得上面的 @ts-expect-error 被「声明了没用」这个错误满足
    expectTypeOf<BadInputProps>().toBeObject()
  })

  it('类型层：对 DOM 元素，ComponentProps 和 ComponentPropsWithRef 是同一个类型（expectTypeOf 由 npm run typecheck 检查）', () => {
    expectTypeOf<ComponentProps<'button'>>().toEqualTypeOf<ComponentPropsWithRef<'button'>>()
    expectTypeOf<ComponentProps<'input'>>().toEqualTypeOf<ComponentPropsWithRef<'input'>>()
    expectTypeOf<ComponentProps<'button'>>().toHaveProperty('ref')
  })
})

describe('八、旧写法对照（React 19 的行为）', () => {
  it('函数组件的 defaultProps：key 写在展开前面（编译成 jsx()）被静默忽略，key 写在展开后面（编译成 createElement）却会合并；class 组件的 defaultProps 照常生效', () => {
    function Greeting({ name }: { name?: string }) {
      return <span data-testid="fn">{String(name)}</span>
    }
    Object.assign(Greeting, { defaultProps: { name: '来自 defaultProps' } })
    class ClassGreeting extends Component<{ name?: string | null }> {
      static defaultProps = { name: '来自 class 的 defaultProps' }
      render() {
        return <span data-testid="class">{String(this.props.name)}</span>
      }
    }
    const p = {}
    render(
      <>
        <Greeting />
        {/* esbuild：<Greeting key="a" {...p} /> → jsx(Greeting, { ...p }, "a")；<Greeting {...p} key="b" /> → createElement(Greeting, { ...p, key: "b" }) */}
        <Greeting key="a" {...p} />
        <Greeting {...p} key="b" />
        <ClassGreeting />
        <ClassGreeting name={undefined} />
        <ClassGreeting name={null} />
      </>,
    )
    expect(screen.getAllByTestId('fn').map((el) => el.textContent)).toEqual(['undefined', 'undefined', '来自 defaultProps'])
    // Component 页：「They will be used for undefined and missing props, but not for null props.」
    expect(screen.getAllByTestId('class').map((el) => el.textContent)).toEqual(['来自 class 的 defaultProps', '来自 class 的 defaultProps', 'null'])
    expect(errorTexts()).toEqual([])
  })

  it('propTypes 不再校验：校验函数返回错误也没有任何报错', () => {
    function Price({ amount }: { amount: number }) {
      return <span>{amount}</span>
    }
    Object.assign(Price, { propTypes: { amount: () => new Error('amount 必须是正数') } })
    render(<Price amount={-1} />)
    expect(errorTexts()).toEqual([])
  })

  it('forwardRef 仍然可用（兼容 React 18 的写法）', () => {
    const OldButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'>>(function OldButton(props, ref) {
      return <button ref={ref} {...props} />
    })
    let node: HTMLButtonElement | null = null
    function Parent() {
      const ref = useRef<HTMLButtonElement>(null)
      return (
        <>
          <OldButton ref={ref}>旧写法</OldButton>
          <button onClick={() => (node = ref.current)}>读 ref</button>
        </>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByRole('button', { name: '读 ref' }))
    expect(node).toBe(screen.getByRole('button', { name: '旧写法' }))
    expect(errorTexts()).toEqual([])
  })

  it('element.ref 已弃用：读它开发环境报错，ref 在 element.props.ref 里', () => {
    const ref = { current: null }
    const element = <div ref={ref} />
    expect((element.props as { ref?: unknown }).ref).toBe(ref)
    void (element as unknown as { ref: unknown }).ref
    expect(errorTexts()).toEqual([
      'Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release.',
    ])
  })
})

it('入口组件渲染四个区块', () => {
  render(<Example />)
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4)
  expect(errorTexts()).toEqual([])
})
