/**
 * 01 题的结论测试：文件头里标了「测试覆盖」的结论都在这里有可运行的证明（react-dom 19.2.8）。esbuild / compiler 的编译输出、lint 文案是一次性实测，不在这里。
 * 故意触发开发环境报错（console.error）的用例都 spy 住并断言文案，不让它进 stderr。
 * 测试工具本身在 34 题（待新增）细讲。
 */
import { createElement, Fragment, StrictMode, useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Example from './Example'
import { JsxRulesDemo } from './JsxRulesDemo'
import { NestedDefinitionDemo } from './NestedDefinitionDemo'
import { ProfileCards } from './ProfileCards'
import { PurityDemo } from './PurityDemo'

let consoleError: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

/** React 的开发期报错是「格式串 + 参数」，拼起来再比对 */
const errorTexts = (): string[] =>
  consoleError.mock.calls.map((args: unknown[]) => {
    const [format, ...rest] = args.map(String)
    let i = 0
    return format.replace(/%s/g, () => rest[i++] ?? '')
  })

describe('区块一：组件就是返回 JSX 的函数，JSX 就是值', () => {
  it('同一个 UserCard 渲染两次；存在变量里的 JSX 通过参数传进去；数字 style 补 px', () => {
    render(<ProfileCards />)
    const cards = screen.getAllByText(/@example\.com/).map((el) => el.closest('.card') as HTMLElement)
    expect(cards).toHaveLength(2)
    expect(within(cards[0]).getByText('VIP')).toHaveClass('badge', 'badge-paid')
    expect(within(cards[1]).queryByText('VIP')).toBeNull()
    expect(cards[0].getAttribute('style')).toContain('border-width: 2px')
    expect(within(cards[0]).getByText('林').getAttribute('style')).toContain('width: 48px')
    expect(within(cards[1]).getByText('○ 离线')).toHaveClass('muted')
    expect(errorTexts()).toEqual([])
  })

  it('同一个组件用两次是两个独立实例：点第一张卡的「关注」，第二张不变', () => {
    render(<ProfileCards />)
    const [first, second] = screen.getAllByText(/@example\.com/).map((el) => el.closest('.card') as HTMLElement)
    fireEvent.click(within(first).getByRole('button', { name: '关注' }))
    expect(within(first).getByRole('button', { name: '已关注' })).toBeInTheDocument()
    expect(within(second).getByRole('button', { name: '关注' })).toBeInTheDocument()
  })

  it('组件名小写会被当成 HTML 标签：DOM 里出现未知元素，开发环境报错', () => {
    const vipBadge = () => <span>VIP</span>
    void vipBadge
    // 等价于写 <vipBadge />：JSX 编译时小写开头编译成字符串 'vipBadge'，不会调用上面那个函数
    const { container } = render(<div>{createElement('vipBadge')}</div>)
    expect(container.innerHTML).toBe('<div><vipbadge></vipbadge></div>')
    expect(errorTexts()).toContain('<vipBadge /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.')
    expect(errorTexts()).toContain(
      'The tag <vipBadge> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.',
    )
  })

  it('组件返回 undefined（例如 return 后面直接换行）不报错，什么都不渲染', () => {
    function Empty() {
      return undefined
    }
    const { container } = render(
      <div>
        <Empty />
      </div>,
    )
    expect(container.innerHTML).toBe('<div></div>')
    expect(errorTexts()).toEqual([])
  })
})

describe('区块二：JSX 规则', () => {
  it('style 数字：width / borderWidth 补 px，0 与 lineHeight / opacity / zIndex / fontWeight / flexGrow 不补', () => {
    render(<JsxRulesDemo />)
    fireEvent.click(screen.getByRole('button', { name: '读出渲染后的 style 属性' }))
    expect(screen.getByLabelText('渲染后的 style')).toHaveTextContent(
      'width: 48px; border-width: 2px; padding: 0px; line-height: 1.5; opacity: 0.5; z-index: 3; font-weight: 700; flex-grow: 2;',
    )
  })

  it('style 传字符串直接抛错', () => {
    // @ts-expect-error 故意传字符串：类型上就不允许
    expect(() => render(<div style="color: red" />)).toThrow(
      "The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.",
    )
  })

  it('HTML 写法的属性名：开发环境报错并提示正确的 camelCase 名字', () => {
    render(
      // @ts-expect-error 故意写 HTML 属性名：TypeScript 也会拦下
      <label class="x" for="y" tabindex="1" onclick={() => {}}>
        l
      </label>,
    )
    expect(errorTexts()).toEqual(
      expect.arrayContaining([
        'Invalid DOM property `class`. Did you mean `className`?',
        'Invalid DOM property `for`. Did you mean `htmlFor`?',
        'Invalid DOM property `tabindex`. Did you mean `tabIndex`?',
        'Invalid event handler property `onclick`. Did you mean `onClick`?',
      ]),
    )
  })

  it('aria-* / data-* 保留连字符；写成 ariaLabel 会报错', () => {
    const { container } = render(<div aria-label="头像" data-user-id="u1" />)
    expect(container.innerHTML).toBe('<div aria-label="头像" data-user-id="u1"></div>')
    // @ts-expect-error 故意写成 camelCase
    render(<div ariaLabel="头像" />)
    expect(errorTexts()).toContain('Invalid ARIA attribute `ariaLabel`. Did you mean `aria-label`?')
  })

  it('列表里：<Fragment key> 没有警告；简写 <> 没法写 key，报缺少 key', () => {
    render(<JsxRulesDemo />)
    expect(screen.getByText('Fragment').tagName).toBe('DT')
    expect(errorTexts()).toEqual([])

    function NoKey() {
      return (
        <dl>
          {['a', 'b'].map((t) => (
            // 故意不写 key：简写 <> 上写不了 key
            <>
              <dt>{t}</dt>
              <dd>{t}</dd>
            </>
          ))}
        </dl>
      )
    }
    render(<NoKey />)
    expect(errorTexts().some((t) => t.startsWith('Each child in a list should have a unique "key" prop.'))).toBe(true)
  })

  it('返回带 key 的数组也合法（ReactNode 包含 Iterable<ReactNode>），但日常写 Fragment 更清楚', () => {
    function Pair() {
      return [<dt key="t">术语</dt>, <dd key="d">解释</dd>]
    }
    const { container } = render(
      <dl>
        <Pair />
      </dl>,
    )
    expect(container.innerHTML).toBe('<dl><dt>术语</dt><dd>解释</dd></dl>')
    expect(errorTexts()).toEqual([])
  })

  it('Fragment 不产生 DOM 节点', () => {
    const { container } = render(
      <Fragment>
        <span>a</span>
        <span>b</span>
      </Fragment>,
    )
    expect(container.innerHTML).toBe('<span>a</span><span>b</span>')
  })
})

describe('区块三：组件必须是纯函数', () => {
  const cupNumbers = () =>
    within(screen.getByLabelText('不纯的茶杯'))
      .getAllByRole('listitem')
      .map((li) => Number(/#(\d+)/.exec(li.textContent ?? '')?.[1]))

  it('不开 StrictMode：不纯的茶杯每渲染一次编号往上涨；纯的一直是 1、2、3', () => {
    render(<PurityDemo />)
    const [a, b, c] = cupNumbers()
    expect([b - a, c - b]).toEqual([1, 1])
    fireEvent.click(screen.getByRole('button', { name: /让本区块重渲染/ }))
    expect(cupNumbers()).toEqual([a + 3, a + 4, a + 5])
    expect(screen.getAllByText(/^第 #\d 位客人的茶杯$/).map((li) => li.textContent)).toEqual([
      '第 #1 位客人的茶杯',
      '第 #2 位客人的茶杯',
      '第 #3 位客人的茶杯',
    ])
  })

  it('StrictMode（开发环境）把组件函数调用两次：不纯的编号每次跳 2', () => {
    render(
      <StrictMode>
        <PurityDemo />
      </StrictMode>,
    )
    const [a, b, c] = cupNumbers()
    expect([b - a, c - b]).toEqual([2, 2])
  })

  it('StrictMode 下组件函数被调用两次（生产构建不会，这里只验证开发环境）', () => {
    let calls = 0
    function Counted() {
      calls += 1
      return null
    }
    render(
      <StrictMode>
        <Counted />
      </StrictMode>,
    )
    expect(calls).toBe(2)
  })
})

describe('区块四：不要在组件里面定义组件', () => {
  it('父组件重渲染后，组件里定义的子组件被重建、输入清空；顶层定义的保留', () => {
    render(<NestedDefinitionDemo />)
    const nested = () => screen.getByLabelText(/组件里定义/) as HTMLInputElement
    const stable = () => screen.getByLabelText(/顶层定义/) as HTMLInputElement
    fireEvent.change(nested(), { target: { value: '草稿' } })
    fireEvent.change(stable(), { target: { value: '草稿' } })
    expect(nested().value).toBe('草稿')

    fireEvent.click(screen.getByRole('button', { name: '让父组件重渲染' }))
    expect(nested().value).toBe('')
    expect(stable().value).toBe('草稿')
  })

  it('同样的规则：同一位置换了组件类型，state 就丢（key 相同也一样）', () => {
    function A() {
      const [n, setN] = useState(0)
      return <button onClick={() => setN((x) => x + 1)}>A {n}</button>
    }
    function B() {
      const [n, setN] = useState(0)
      return <button onClick={() => setN((x) => x + 1)}>B {n}</button>
    }
    const { rerender } = render(<A key="same" />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveTextContent('A 1')
    rerender(<B key="same" />)
    expect(screen.getByRole('button')).toHaveTextContent('B 0')
  })
})

it('入口组件渲染四个区块', () => {
  render(<Example />)
  for (const title of [/区块二/, /区块三/, /区块四/]) {
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  }
  expect(screen.getByText(/区块一：同一个 UserCard 组件用了两次/)).toBeInTheDocument()
})
