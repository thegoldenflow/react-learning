/**
 * 14 题的结论测试：文件头里讲的关键结论，每条都在这里有一个可以运行的证明。
 * 定时器类的结论用 fake timers（vi.useFakeTimers）精确推进时间；请求类的用真实定时器 + 很短的延迟。
 * 测试工具本身在 34 题（待新增）细讲。
 */
import { StrictMode, useState, useSyncExternalStore } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { DebouncedSearchDemo } from './DebouncedSearchDemo'
import Example from './Example'
import { IntervalDemo } from './IntervalDemo'
import { useDebouncedValue } from './useDebouncedValue'
import { useWindowWidth } from './useWindowWidth'
import { SubscribeLabCard, WindowWidthDemo } from './WindowWidthDemo'

function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1024 })
})

describe('区块一：useSyncExternalStore 订阅浏览器 API', () => {
  it('主线与并排写法都跟着 resize 更新；卸载面板 B 只取消 B 自己的订阅', () => {
    const added = vi.spyOn(window, 'addEventListener')
    const removed = vi.spyOn(window, 'removeEventListener')
    render(<WindowWidthDemo />)
    const resizeCalls = (spy: typeof added) => spy.mock.calls.filter(([type]) => type === 'resize').length

    expect(screen.getByText('面板 A').closest('.card')).toHaveTextContent('useSyncExternalStore（主线）：1024px')
    expect(screen.getByText('面板 A').closest('.card')).toHaveTextContent('useEffect 订阅（并排）：1024px')

    setWindowWidth(500)
    const panelA = screen.getByText('面板 A').closest('.card') as HTMLElement
    expect(panelA).toHaveTextContent('useSyncExternalStore（主线）：500px')
    expect(panelA).toHaveTextContent('useEffect 订阅（并排）：500px')
    expect(panelA).toHaveTextContent('窄（阈值 768px）')

    // 基准在这里取：上面的 resize 会让区块一里的 subscribe 实验组件重渲染并重订（它演示的正是这件事）
    const addedBefore = resizeCalls(added)
    const removedBefore = resizeCalls(removed)
    fireEvent.click(screen.getByRole('button', { name: '卸载面板 B' }))
    // B 的两份订阅（主线 + 并排）被取消，没有新的订阅
    expect(resizeCalls(removed) - removedBefore).toBe(2)
    expect(resizeCalls(added)).toBe(addedBefore)

    setWindowWidth(900)
    expect(screen.getByText('面板 A').closest('.card')).toHaveTextContent('useSyncExternalStore（主线）：900px')
  })

  it('subscribe 引用稳定只订阅一次；每次渲染新建的 subscribe 每次都退订再重订', () => {
    render(<SubscribeLabCard />)
    const counts = () => screen.getByLabelText('subscribe 调用次数').textContent ?? ''
    expect(counts()).toContain('引用稳定的 subscribe 被调用 1 次')
    expect(counts()).toContain('每次渲染新建的 subscribe 被调用 1 次')

    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: '让这个组件重渲染一次' }))
    }

    expect(counts()).toContain('引用稳定的 subscribe 被调用 1 次')
    expect(counts()).toContain('每次渲染新建的 subscribe 被调用 4 次')
  })

  it('StrictMode 开发环境挂载时多跑一轮 setup + cleanup：两个计数都从 2 开始', () => {
    render(
      <StrictMode>
        <SubscribeLabCard />
      </StrictMode>,
    )
    const counts = screen.getByLabelText('subscribe 调用次数').textContent ?? ''
    expect(counts).toContain('引用稳定的 subscribe 被调用 2 次')
    expect(counts).toContain('每次渲染新建的 subscribe 被调用 2 次')
  })

  it('getSnapshot 每次返回新对象：开发环境报「should be cached」，并陷入无限更新', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const subscribe = () => () => {}
    function Uncached() {
      const size = useSyncExternalStore(subscribe, () => ({ width: window.innerWidth }))
      return <span>{size.width}</span>
    }
    expect(() => render(<Uncached />)).toThrow(/Maximum update depth exceeded/)
    expect(consoleError.mock.calls.some(([msg]) => String(msg).includes('The result of getSnapshot should be cached'))).toBe(
      true,
    )
  })

  it('服务端渲染：useWindowWidth 用 getServerSnapshot 返回 null；不传 getServerSnapshot 会报错', () => {
    function Probe() {
      const width = useWindowWidth()
      return <span>{width === null ? '服务端未知' : `${width}px`}</span>
    }
    expect(renderToString(<Probe />)).toContain('服务端未知')

    const subscribe = () => () => {}
    function NoServerSnapshot() {
      const width = useSyncExternalStore(subscribe, () => window.innerWidth)
      return <span>{width}</span>
    }
    expect(() => renderToString(<NoServerSnapshot />)).toThrow(/Missing getServerSnapshot/)
  })
})

describe('区块二：useInterval 与 useEffectEvent', () => {
  it('改步长两边都用上新值；频繁重渲染时回调进依赖的写法一直被重置、停住不动', () => {
    vi.useFakeTimers()
    render(<IntervalDemo delay={1000} noiseMs={300} />)
    const good = () => screen.getByLabelText('useEffectEvent 版计数').textContent
    const naive = () => screen.getByLabelText('回调进依赖版计数').textContent

    act(() => vi.advanceTimersByTime(3000))
    expect(good()).toContain('3')
    expect(naive()).toContain('3')

    fireEvent.change(screen.getByLabelText('步长'), { target: { value: '5' } })
    act(() => vi.advanceTimersByTime(1000))
    expect(good()).toContain('8')
    expect(naive()).toContain('8')

    fireEvent.click(screen.getByLabelText(/干扰/))
    // 一小步一小步推进：同一个 act 里的多次更新会合并成一次渲染，推进一大段的话中间不会重渲染
    for (let i = 0; i < 30; i += 1) act(() => vi.advanceTimersByTime(100))
    expect(good()).toContain('23') // 每秒 +5，不受重渲染影响
    expect(naive()).toContain('8') // 每 300ms 被重建一次，等不到 1000ms
  })

  it('依赖只有 delay：步长变化不会重建定时器，delay 变成 null（暂停）才会清掉', () => {
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    render(<IntervalDemo delay={1000} noiseMs={300} />)
    const created = setIntervalSpy.mock.calls.length

    fireEvent.change(screen.getByLabelText('步长'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('步长'), { target: { value: '3' } })
    // 反例每次渲染都重建（+2），useEffectEvent 版一次都不重建
    expect(setIntervalSpy.mock.calls.length - created).toBe(2)

    const clearedBefore = clearIntervalSpy.mock.calls.length
    fireEvent.click(screen.getByLabelText(/暂停/))
    // 暂停：两个定时器各清一次，都不再新建
    expect(clearIntervalSpy.mock.calls.length - clearedBefore).toBe(2)
    expect(setIntervalSpy.mock.calls.length - created).toBe(2)
  })
})

describe('区块三：防抖与「let timer」坑', () => {
  function DebounceProbe({ value, delay }: { value: string; delay: number }) {
    return <span data-testid="debounced">{useDebouncedValue(value, delay)}</span>
  }

  it('useDebouncedValue：停手满 delay 才更新；中途再变就重新计时', () => {
    vi.useFakeTimers()
    const { rerender } = render(<DebounceProbe value="a" delay={500} />)
    rerender(<DebounceProbe value="ab" delay={500} />)
    act(() => vi.advanceTimersByTime(400))
    rerender(<DebounceProbe value="abc" delay={500} />)
    act(() => vi.advanceTimersByTime(499))
    expect(screen.getByTestId('debounced')).toHaveTextContent(/^a$/)
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByTestId('debounced')).toHaveTextContent('abc')
  })

  it('防抖搜索：快速输入只按最后的关键词发一次请求', async () => {
    const user = userEvent.setup({ delay: null })
    render(<DebouncedSearchDemo debounceMs={60} delayMs={20} />)
    await waitFor(() => expect(screen.getByLabelText('请求次数')).toHaveTextContent('一共发了 1 次请求'))

    await user.type(screen.getByLabelText('防抖搜索关键词'), '张伟')

    await waitFor(() => expect(screen.getByLabelText('请求次数')).toHaveTextContent('一共发了 2 次请求'))
    expect(screen.getByLabelText('请求次数')).toHaveTextContent('请求：「张伟」')
    expect(screen.getByLabelText('请求次数')).not.toHaveTextContent('请求：「张」')
    expect(await screen.findByText(/zhangwei@example.com/)).toBeInTheDocument()
  })

  it('let timer 放在组件函数体里：每次输入都触发；存进 useRef 才只触发一次', async () => {
    const user = userEvent.setup({ delay: null })
    render(<DebouncedSearchDemo debounceMs={60} delayMs={20} />)

    await user.type(screen.getByLabelText('let timer 写法'), 'abc')
    await user.type(screen.getByLabelText('useRef 写法'), 'abc')

    await waitFor(() => expect(screen.getByLabelText('let timer 触发次数')).toHaveTextContent('触发了 3 次：a、ab、abc'))
    await waitFor(() => expect(screen.getByLabelText('useRef 触发次数')).toHaveTextContent('触发了 1 次：abc'))
  })
})

describe('Hooks 规则', () => {
  function Conditional({ extra }: { extra: boolean }) {
    const [a] = useState(1)
    if (extra) {
      // eslint-disable-next-line react-hooks/rules-of-hooks -- 故意违反规则，证明 React 的报错文案
      const [b] = useState(2)
      return <span>{a + b}</span>
    }
    return <span>{a}</span>
  }

  it('条件调用 Hook：多出一个 Hook 报「Rendered more hooks」，少一个报「Rendered fewer hooks」', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const first = render(<Conditional extra={false} />)
    expect(() => first.rerender(<Conditional extra />)).toThrow(/Rendered more hooks than during the previous render/)
    first.unmount()

    const second = render(<Conditional extra />)
    expect(() => second.rerender(<Conditional extra={false} />)).toThrow(/Rendered fewer hooks than expected/)
    consoleError.mockRestore()
  })
})

describe('Example 入口', () => {
  it('三个区块都渲染出来', () => {
    render(<Example />)
    for (const n of ['一', '二', '三']) {
      expect(screen.getByRole('heading', { name: new RegExp(`区块${n}`) })).toBeInTheDocument()
    }
    expect(screen.getByText('面板 A').closest('.card')).toHaveTextContent('useSyncExternalStore（主线）：1024px')
  })
})
