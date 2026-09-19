/**
 * 03 题的结论测试：文件头里标了「测试覆盖」的结论都在这里有可运行的证明（react / react-dom 19.2.8，开发构建）。
 * 故意触发的开发期报错（console.error）都 spy 住并断言文案，不让它进 stderr。测试工具本身在 34 题（待新增）细讲。
 */
import { Component, StrictMode, useState, type Dispatch, type SetStateAction } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CartItem } from '@/shared/types'
import { CartDemo } from './CartDemo'
import Example from './Example'
import { LazyInitDemo } from './LazyInitDemo'
import { QuantityEditor } from './QuantityEditor'
import { INITIAL_QUANTITY_STATE, STOCK_LIMIT, quantityReducer, type QuantityState } from './quantityReducer'
import { SnapshotDemo } from './SnapshotDemo'
import { StateStructureDemo } from './StateStructureDemo'
import { TroubleshootingDemo } from './TroubleshootingDemo'
import { WhyStateDemo } from './WhyStateDemo'

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

const logLines = (label: string) =>
  within(screen.getByRole('list', { name: label }))
    .getAllByRole('listitem')
    .map((li) => li.textContent)

const user = () => userEvent.setup({ delay: null })

describe('区块一：为什么需要 state', () => {
  it('局部变量：改了不触发渲染，重渲染后又从 0 开始', async () => {
    const u = user()
    render(<WhyStateDemo />)
    const button = screen.getByRole('button', { name: '局部变量 +1' })
    await u.click(button)
    await u.click(button)
    await u.click(button)
    // 变量确实在涨，界面一直是 0
    expect(screen.getByTestId('local-clicks')).toHaveTextContent('0')
    expect(logLines('区块一日志').map((line) => line!.split('，')[0])).toEqual([
      '局部变量 clicks 改成了 1',
      '局部变量 clicks 改成了 2',
      '局部变量 clicks 改成了 3',
    ])
    // 重渲染一次之后再点：这次渲染的 clicks 是新的 0，日志又从 1 开始
    await u.click(screen.getByRole('button', { name: /让本区块重渲染/ }))
    await u.click(button)
    expect(logLines('区块一日志').at(-1)).toMatch(/^局部变量 clicks 改成了 1，/)
    expect(screen.getByTestId('local-clicks')).toHaveTextContent('0')
  })

  it('state 属于组件实例：同一个组件渲染两次，各有各的 state', async () => {
    const u = user()
    render(<WhyStateDemo />)
    await u.click(screen.getByRole('button', { name: 'A +1' }))
    await u.click(screen.getByRole('button', { name: 'A +1' }))
    expect(screen.getByTestId('state-count-A')).toHaveTextContent('2')
    expect(screen.getByTestId('state-count-B')).toHaveTextContent('0')
  })
})

describe('区块二：setter 只影响下一次渲染', () => {
  it('set 之后立刻读，读到的还是这次渲染的值；界面在下一次渲染变成新值', async () => {
    const u = user()
    render(<SnapshotDemo />)
    await u.click(screen.getByRole('button', { name: 'set 之后立刻读' }))
    expect(logLines('区块二日志')).toEqual(['setCount(1) 之后立刻读 count = 0（还是这次渲染的值）'])
    expect(screen.getByTestId('snapshot-count')).toHaveTextContent('1')
  })

  it('要用新值做别的事：先算好存进变量（最常用）—— 同一时刻 count 仍是旧值，next 是新值；界面也变成新值', async () => {
    const u = user()
    render(<SnapshotDemo />)
    await u.click(screen.getByRole('button', { name: '【最常用】先算好 next 再用' }))
    expect(logLines('区块二日志')).toEqual(['setCount(next) 之后 count 仍是 0，先算好的 next = 1（后面的代码用 next）'])
    expect(screen.getByTestId('snapshot-count')).toHaveTextContent('1')
  })

  it('setCount(count + 1) 连写两次只加 1；setCount(c => c + 1) 连写两次加 2', async () => {
    const u = user()
    render(<SnapshotDemo />)
    await u.click(screen.getByRole('button', { name: /^A：/ }))
    expect(screen.getByTestId('snapshot-count')).toHaveTextContent('1')
    await u.click(screen.getByRole('button', { name: /^B：/ }))
    expect(screen.getByTestId('snapshot-count')).toHaveTextContent('3')
  })

  it('Object.is 相同就跳过：没有待处理更新时连组件函数都不调用；刚因自己的 state 更新重渲染过时，可能再调用一次组件函数，但跳过子组件', async () => {
    const calls: string[] = []
    let setValue!: (value: number) => void
    function Child() {
      calls.push('Child')
      return null
    }
    function Parent() {
      const [value, set] = useState(0)
      setValue = set
      calls.push(`Parent ${value}`)
      return <Child />
    }
    render(<Parent />)
    expect(calls.splice(0)).toEqual(['Parent 0', 'Child'])
    await act(async () => setValue(0))
    expect(calls.splice(0)).toEqual([])
    await act(async () => setValue(1))
    expect(calls.splice(0)).toEqual(['Parent 1', 'Child'])
    // 刚因自己的 state 更新重渲染过：React 还得调用一次组件函数才能确认，确认没变就跳过子组件（useState 页「may still need to call your component before skipping the children」）
    await act(async () => setValue(1))
    expect(calls.splice(0)).toEqual(['Parent 1'])
    await act(async () => setValue(1))
    expect(calls.splice(0)).toEqual([])
  })

  it('StrictMode 开发环境：初始化函数、更新函数都被调用两次（其中一次的结果被忽略，和 useState 页原文一致）', async () => {
    const calls: string[] = []
    let bump!: () => void
    function Counter() {
      const [n, setN] = useState(() => {
        calls.push('init')
        return 0
      })
      bump = () =>
        setN((prev) => {
          calls.push(`updater ${prev}`)
          return prev + 1
        })
      return <p data-testid="strict-n">{n}</p>
    }
    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )
    expect(calls.splice(0)).toEqual(['init', 'init'])
    await act(async () => bump())
    expect(calls.splice(0)).toEqual(['updater 0', 'updater 0'])
    expect(screen.getByTestId('strict-n')).toHaveTextContent('1')
  })
})

describe('区块三：对象 / 数组 state 要整体替换', () => {
  const quantityOf = (id: string) => within(screen.getByTestId(`cart-row-${id}`)).getByText(/ 件$/).textContent

  it('map / filter / 展开造新引用：+、-、移除都生效，合计是渲染时算的', async () => {
    const u = user()
    render(<CartDemo />)
    await u.click(within(screen.getByTestId('cart-row-p1')).getByRole('button', { name: '+' }))
    expect(quantityOf('p1')).toBe('2 件')
    await u.click(within(screen.getByTestId('cart-row-p2')).getByRole('button', { name: '-' }))
    expect(quantityOf('p2')).toBe('1 件')
    await u.click(within(screen.getByTestId('cart-row-p3')).getByRole('button', { name: '移除' }))
    expect(screen.queryByTestId('cart-row-p3')).toBeNull()
    expect(screen.getByTestId('cart-total-count')).toHaveTextContent('3')
  })

  it('原地改 + setItems(items)：同一个引用被跳过，界面不动；下一次别的重渲染才把改过的值带出来', async () => {
    const u = user()
    render(<CartDemo />)
    await u.click(within(screen.getByTestId('cart-row-p1')).getByRole('button', { name: '❌ 原地 +1' }))
    await u.click(within(screen.getByTestId('cart-row-p1')).getByRole('button', { name: '❌ 原地 +1' }))
    expect(quantityOf('p1')).toBe('1 件')
    expect(screen.getByTestId('cart-total-count')).toHaveTextContent('4')
    // 点另一行的 +：这次是正常的更新，重渲染时 p1 被改过的数量「突然」出现
    await u.click(within(screen.getByTestId('cart-row-p2')).getByRole('button', { name: '+' }))
    expect(quantityOf('p1')).toBe('3 件')
    expect(screen.getByTestId('cart-total-count')).toHaveTextContent('7')
  })

  it('演示简化的拷贝起作用：重新挂载后初始数量没有被上一次的原地修改改坏', async () => {
    const u = user()
    const { unmount } = render(<CartDemo />)
    await u.click(within(screen.getByTestId('cart-row-p1')).getByRole('button', { name: '❌ 原地 +1' }))
    unmount()
    render(<CartDemo />)
    expect(quantityOf('p1')).toBe('1 件')
  })
  it('类型层：readonly 数组拦下 push 与下标赋值，Readonly<T> 拦下字段赋值；两者都是浅的', () => {
    const items: readonly CartItem[] = [{ id: 'p1', name: '机械键盘', price: 399, quantity: 1 }]
    const item: Readonly<CartItem> = items[0]
    // 只做类型检查，不执行（运行时没有 readonly 这回事）
    const attempts = () => {
      // @ts-expect-error -- Property 'push' does not exist on type 'readonly CartItem[]'.
      items.push(item)
      // @ts-expect-error -- Index signature in type 'readonly CartItem[]' only permits reading.
      items[0] = item
      // @ts-expect-error -- Cannot assign to 'quantity' because it is a read-only property.
      item.quantity = 2
      // 浅的：readonly 数组里的元素照样能改字段
      items[0].quantity = 2
    }
    expect(typeof attempts).toBe('function')
  })
})

describe('区块四：惰性初始化', () => {
  it('useState(createX()) 每次渲染都调用；useState(() => createX()) 只在首次渲染调用', async () => {
    const u = user()
    await act(async () => {
      render(<LazyInitDemo />)
    })
    expect(screen.getByTestId('eager-calls')).toHaveTextContent('1')
    expect(screen.getByTestId('lazy-calls')).toHaveTextContent('1')
    await u.type(screen.getByRole('textbox', { name: '过滤关键字' }), '23')
    await waitFor(() => expect(screen.getByTestId('eager-calls')).toHaveTextContent('3'))
    expect(screen.getByTestId('lazy-calls')).toHaveTextContent('1')
    // 初始值只用一次：两边的 rows 都是第一次算出来的那 50 行，过滤结果一样
    expect(screen.getByText(/^❌/)).toHaveTextContent('含「123」的有 0 行')
    expect(screen.getByText(/^✅/)).toHaveTextContent('含「123」的有 0 行')
  })

  it('StrictMode 开发环境：首次渲染两边都是 2 次；之后每次渲染 ❌ 再加 2，✅ 不变', async () => {
    const u = user()
    await act(async () => {
      render(
        <StrictMode>
          <LazyInitDemo />
        </StrictMode>,
      )
    })
    expect(screen.getByTestId('eager-calls')).toHaveTextContent('2')
    expect(screen.getByTestId('lazy-calls')).toHaveTextContent('2')
    await u.type(screen.getByRole('textbox', { name: '过滤关键字' }), '0')
    await waitFor(() => expect(screen.getByTestId('eager-calls')).toHaveTextContent('4'))
    expect(screen.getByTestId('lazy-calls')).toHaveTextContent('2')
  })
})

describe('区块五：state 的结构', () => {
  it('存对象会过期，存 id + 渲染时查找跟着列表走', async () => {
    const u = user()
    render(<StateStructureDemo />)
    const keyboardRow = screen.getByText('机械键盘 × 1').closest('.row') as HTMLElement
    await u.click(within(keyboardRow).getByRole('button', { name: '选中' }))
    await u.click(within(keyboardRow).getByRole('button', { name: '+1' }))
    await u.click(within(keyboardRow).getByRole('button', { name: '+1' }))
    expect(screen.getByTestId('selected-by-object')).toHaveTextContent('❌ 存对象 selectedItem：机械键盘 × 1')
    expect(screen.getByTestId('selected-by-id')).toHaveTextContent('✅ 存 id、渲染时查找：机械键盘 × 3')
  })

  it('两个布尔值会出现「发送中」和「已发送」同时成立的不可能状态；一个 status 不会', async () => {
    const u = user()
    render(<StateStructureDemo />)
    for (const testId of ['send-booleans', 'send-status']) {
      const row = within(screen.getByTestId(testId))
      await u.click(row.getByRole('button', { name: '发送' }))
      await u.click(row.getByRole('button', { name: '模拟服务器返回' }))
      await u.click(row.getByRole('button', { name: '发送' }))
    }
    const booleans = within(screen.getByTestId('send-booleans'))
    expect(booleans.getByText('发送中…')).toBeInTheDocument()
    expect(booleans.getByText('已发送 ✓')).toBeInTheDocument()
    const status = within(screen.getByTestId('send-status'))
    expect(status.getByText('发送中…')).toBeInTheDocument()
    expect(status.queryByText('已发送 ✓')).toBeNull()
  })
})

describe('区块六：useReducer', () => {
  it('reducer 能脱离组件单独测试：规则集中在一处，不修改传进来的 state', () => {
    const frozen: QuantityState = Object.freeze({ ...INITIAL_QUANTITY_STATE })
    const next = quantityReducer(frozen, { type: 'increment' })
    expect(next).toEqual({ ...INITIAL_QUANTITY_STATE, quantity: 2 })
    expect(next).not.toBe(frozen)

    let state = INITIAL_QUANTITY_STATE
    for (let i = 0; i < STOCK_LIMIT + 2; i++) state = quantityReducer(state, { type: 'increment' })
    expect(state.quantity).toBe(STOCK_LIMIT)
    expect(state.error).toBe(`库存只有 ${STOCK_LIMIT} 件，加不上去了`)

    const editing = quantityReducer(quantityReducer(state, { type: 'startEdit' }), { type: 'changeDraft', draft: 'abc' })
    expect(quantityReducer(editing, { type: 'commitEdit' })).toMatchObject({ isEditing: true, error: '请输入 ≥ 1 的整数' })
    // reset 返回那个常量本身：state 已经是它时 Object.is 相同，React 跳过重渲染
    expect(quantityReducer(state, { type: 'reset' })).toBe(INITIAL_QUANTITY_STATE)
  })

  it('组件里只 dispatch「发生了什么」：确认输入一次改四个字段', async () => {
    const u = user()
    render(<QuantityEditor />)
    await u.click(screen.getByRole('button', { name: '直接输入' }))
    const input = screen.getByRole('textbox', { name: '数量' })
    expect(input).toHaveValue('1')
    await u.clear(input)
    await u.type(input, '0')
    await u.click(screen.getByRole('button', { name: '确定' }))
    expect(screen.getByText('请输入 ≥ 1 的整数')).toBeInTheDocument()
    await u.clear(input)
    await u.type(input, '5')
    await u.click(screen.getByRole('button', { name: '确定' }))
    expect(screen.getByTestId('editor-quantity')).toHaveTextContent('5 件')
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByText('请输入 ≥ 1 的整数')).toBeNull()
  })

  it('&& 左边是空串不渲染任何东西（不创建文本节点）；左边是 0 会把 0 渲染出来', () => {
    const error = ''
    const count = 0
    render(
      <p data-testid="and-and">
        [{error && <b>错误</b>}][{count && <b>数量</b>}]
      </p>,
    )
    const p = screen.getByTestId('and-and')
    expect(p.textContent).toBe('[][0]')
    // 子节点依次是「[」、空串、「][」、0、「]」：空串那一格没有对应的 DOM 节点，0 变成了文本节点
    expect(Array.from(p.childNodes).map((node) => node.textContent)).toEqual(['[', '][', '0', ']'])
  })
})

describe('区块七：常见报错', () => {
  it('onClick={handleClick()}：渲染时就调用了 setter，React 抛 Too many re-renders（被错误边界接住）', async () => {
    const u = user()
    render(<TroubleshootingDemo />)
    await u.click(screen.getByRole('button', { name: /挂载 onClick/ }))
    expect(screen.getByText(/错误边界接住了/)).toHaveTextContent(
      '错误边界接住了：Too many re-renders. React limits the number of renders to prevent an infinite loop.',
    )
    // 开发环境默认的 onCaughtError 用 console.error 打印一次被接住的错误（20 题）
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect((consoleError.mock.calls[0][1] as Error).message).toBe(
      'Too many re-renders. React limits the number of renders to prevent an infinite loop.',
    )
    await u.click(screen.getByRole('button', { name: '卸载' }))
    expect(screen.queryByText(/错误边界接住了/)).toBeNull()
  })

  it('有条件地在渲染中 set 自己的 state 是允许的（记住上一次的 prop）：React 丢掉这次输出、马上重新渲染', () => {
    const renders: string[] = []
    function Selection({ items }: { items: string[] }) {
      const [prevItems, setPrevItems] = useState(items)
      const [selection, setSelection] = useState<string | null>(items[0])
      if (items !== prevItems) {
        setPrevItems(items)
        setSelection(null)
      }
      renders.push(String(selection))
      return <p data-testid="selection">{String(selection)}</p>
    }
    const { rerender } = render(<Selection items={['a']} />)
    rerender(<Selection items={['b']} />)
    expect(renders).toEqual(['a', 'a', 'null'])
    expect(screen.getByTestId('selection')).toHaveTextContent('null')
    expect(errorTexts()).toEqual([])
  })

  /* 【少用】演示里取消 FormatterBlock 的注释后，这里也取消注释（删掉这一行和下面的结束行）
  it('setFormatter(addBang) 把 addBang 当更新函数调用，state 变成字符串；setFormatter(() => addBang) 才是存函数', async () => {
    const u = user()
    render(<TroubleshootingDemo />)
    expect(screen.getByTestId('formatter-preview')).toHaveTextContent('HELLO STATE')
    await u.click(screen.getByRole('button', { name: '❌ setFormatter(addBang)' }))
    expect(screen.getByTestId('formatter-preview')).toHaveTextContent('state 已经不是函数了（typeof = string）')
    await u.click(screen.getByRole('button', { name: '✅ setFormatter(() => addBang)' }))
    expect(screen.getByTestId('formatter-preview')).toHaveTextContent('hello state!')
  })
  */


  it('useState(fn) 会把 fn 当初始化函数调用（不传参数）', () => {
    const received: unknown[][] = []
    const toUpper = (...args: unknown[]) => {
      received.push(args)
      return 'return value'
    }
    let state: unknown
    function Probe() {
      const [value] = useState<unknown>(toUpper)
      state = value
      return null
    }
    render(<Probe />)
    expect(received).toEqual([[]])
    expect(state).toBe('return value')
  })
})

describe('附 1：把函数存进 state（区块七的演示已注释，这里用独立组件验证）', () => {
  it('setFn(fn) 把 fn 当更新函数调用（传入上一个 state），state 变成它的返回值；setFn(() => fn) 才是存函数', async () => {
    type Formatter = (text: string) => string
    const toUpper: Formatter = (text) => text.toUpperCase()
    const received: unknown[] = []
    const addBang: Formatter = (text) => {
      received.push(text)
      return `${String(text)}!`
    }
    let setFormatter!: Dispatch<SetStateAction<Formatter>>
    let current: unknown
    function Probe() {
      const [formatter, set] = useState<Formatter>(() => toUpper)
      setFormatter = set
      current = formatter
      return null
    }
    render(<Probe />)
    expect(current).toBe(toUpper)
    // ❌ TypeScript 不拦：addBang 的类型也满足「新值」那一支；运行时 React 把它当更新函数，传进去的是上一个 state（toUpper 这个函数）
    await act(async () => setFormatter(addBang))
    expect(received).toEqual([toUpper])
    expect(current).toBe(`${String(toUpper)}!`)
    // ✅ 包一层返回函数的箭头函数
    await act(async () => setFormatter(() => addBang))
    expect(current).toBe(addBang)
  })
})

describe('八、旧写法对照：class 组件的 setState', () => {
  it('this.setState(partial) 浅合并；set 之后同步代码里 this.state 还是旧值，定时器里读到的是最新值', async () => {
    vi.useFakeTimers()
    const seen: string[] = []
    class Legacy extends Component<object, { quantity: number; note: string }> {
      state = { quantity: 1, note: '保留' }
      handleClick = () => {
        this.setState({ quantity: this.state.quantity + 1 })
        seen.push(`同步读 ${this.state.quantity}`)
        setTimeout(() => seen.push(`定时器里读 ${this.state.quantity}`), 100)
      }
      render() {
        return (
          <button onClick={this.handleClick}>
            {this.state.quantity} · {this.state.note}
          </button>
        )
      }
    }
    render(<Legacy />)
    await act(async () => screen.getByRole('button').click())
    await act(async () => vi.advanceTimersByTime(100))
    expect(screen.getByRole('button')).toHaveTextContent('2 · 保留')
    expect(seen).toEqual(['同步读 1', '定时器里读 2'])
    vi.useRealTimers()
  })

  it('Hooks 的 setter 是整体替换：只传一个字段，别的字段就没了', async () => {
    function Modern() {
      const [state, setState] = useState<{ quantity: number; note?: string }>({ quantity: 1, note: '保留' })
      return (
        <button onClick={() => setState({ quantity: state.quantity + 1 })}>
          {state.quantity} · {state.note ?? '（note 没了）'}
        </button>
      )
    }
    render(<Modern />)
    await act(async () => screen.getByRole('button').click())
    expect(screen.getByRole('button')).toHaveTextContent('2 · （note 没了）')
  })
})

it('整页渲染：七个区块都在，没有开发期报错', async () => {
  await act(async () => {
    render(<Example />)
  })
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent!.slice(0, 3))).toEqual([
    '区块一',
    '区块二',
    '区块三',
    '区块四',
    '区块五',
    '区块六',
    '区块七',
  ])
  expect(errorTexts()).toEqual([])
})
