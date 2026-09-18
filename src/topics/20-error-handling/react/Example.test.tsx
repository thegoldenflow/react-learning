/**
 * 20 题的结论测试：文件头里讲的关键结论，每条都在这里有一个可以运行的证明（react-dom 19.2.8）。
 * 被边界接住的错误，React 开发环境默认会 console.error 打印（defaultOnCaughtError）—— 每个用例都 spy 住并断言，不让它进 stderr。
 * jsdom 没有 window.reportError，React 退回到自己派发 window 的 error 事件（reportGlobalError 的后备分支），所以「交给 reportError」在测试里表现为 error 事件。
 * 测试工具本身在 34 题（待新增）细讲。
 */
import { useState, useTransition } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { BoundaryBasicsDemo } from './BoundaryBasicsDemo'
import { CatchScopeDemo } from './CatchScopeDemo'
import ErrorBoundary, { errorMessage } from './ErrorBoundary'
import Example from './Example'
import { LibraryBoundaryDemo } from './LibraryBoundaryDemo'
import { RootOptionsDemo } from './RootOptionsDemo'

let consoleError: ReturnType<typeof vi.spyOn>
let windowErrors: string[]
const onWindowError = (event: ErrorEvent) => {
  windowErrors.push(event.message)
  event.preventDefault()
}

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  windowErrors = []
  window.addEventListener('error', onWindowError)
})

afterEach(() => {
  window.removeEventListener('error', onWindowError)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** React 默认的 onCaughtError 打印的第三段：「React will try to recreate this component tree from scratch using the error boundary you provided, X.」 */
const caughtLogs = () =>
  consoleError.mock.calls.filter((args: unknown[]) => args.some((a) => String(a).includes('React will try to recreate this component tree')))

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('区块一：手写边界 —— 隔离、重置、resetKeys', () => {
  it('渲染中 throw 被接住：只有边界里面换成兜底界面，边界外的组件不受影响；重试后子树是全新实例', () => {
    render(<BoundaryBasicsDemo />)
    const safeCard = screen.getByText(/边界外的计数器：/).closest('.card') as HTMLElement
    fireEvent.click(within(safeCard).getByRole('button', { name: '+1' }))
    const counterCard = screen.getByText(/易碎计数器：/).closest('.card') as HTMLElement
    for (let i = 0; i < 2; i += 1) fireEvent.click(within(counterCard).getByRole('button', { name: '+1' }))
    expect(within(counterCard).getByText('2')).toBeInTheDocument()

    fireEvent.click(within(counterCard).getByRole('button', { name: '+1' }))

    expect(within(counterCard).getByRole('alert')).toHaveTextContent('这块区域崩溃了：计数到 3，BuggyCounter 渲染崩溃了')
    expect(screen.getByText(/边界外的计数器：/)).toHaveTextContent('边界外的计数器：1')
    expect(screen.getByLabelText('区块一 onError 日志')).toHaveTextContent('onError：计数到 3')
    expect(caughtLogs()).toHaveLength(1) // 开发环境默认 console.error 打印一次（React 19 起不再重复）
    expect(windowErrors).toEqual([]) // 被接住的错误不会触发 window 的 error 事件（Component 页 Caveats 里「bubble up to window」是旧行为）

    fireEvent.click(within(counterCard).getByRole('button', { name: '重试' }))
    expect(within(counterCard).getByText('0')).toBeInTheDocument()
  })

  it('resetKeys：选中损坏的 p3 → 兜底；换回 p1 自动重置。不传 resetKeys 时停在兜底界面，要手动重试', () => {
    render(<BoundaryBasicsDemo />)
    const log = () => screen.getByLabelText('区块一 onError 日志').textContent ?? ''

    fireEvent.click(screen.getByLabelText('p3（数据损坏）'))
    // 导致出错的正是这次 key 变化：实现里跳过了「刚捕获错误的那一次更新」，所以没有被立刻重置
    expect(screen.getByRole('alert')).toHaveTextContent('商品 p3 的数据损坏，无法渲染')

    fireEvent.click(screen.getByLabelText('p1'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('机械键盘：￥399.00')).toBeInTheDocument()
    expect(log()).toContain('onReset：边界已重置')

    fireEvent.click(screen.getByLabelText(/传 resetKeys/)) // 关掉 resetKeys
    fireEvent.click(screen.getByLabelText('p3（数据损坏）'))
    fireEvent.click(screen.getByLabelText('p2'))
    expect(screen.getByRole('alert')).toHaveTextContent('商品 p3 的数据损坏') // 没有自动重置
    click('重试')
    expect(screen.getByText('无线鼠标：￥149.00')).toBeInTheDocument()
  })

  it('throw 出来的不一定是 Error：throw null 也能进兜底界面并重置（手写版用 hasError 标记）', () => {
    function ThrowsNull() {
      const [boom, setBoom] = useState(false)
      if (boom) throw null
      return <button onClick={() => setBoom(true)}>throw null</button>
    }
    render(
      <ErrorBoundary fallback={({ error, reset }) => <button onClick={reset}>收到：{errorMessage(error)}，重试</button>}>
        <ThrowsNull />
      </ErrorBoundary>,
    )
    click('throw null')
    click('收到：null，重试')
    expect(screen.getByRole('button', { name: 'throw null' })).toBeInTheDocument()
  })
})

describe('区块二：接得住什么、接不住什么', () => {
  it('接得住：渲染中 throw', () => {
    render(<CatchScopeDemo />)
    click('1. 渲染中 throw')
    expect(screen.getByRole('alert')).toHaveTextContent('边界接住了：渲染中 throw')
  })

  it('接得住：useTransition 返回的 startTransition 里 throw（async 函数被拒绝也算）', async () => {
    render(<CatchScopeDemo />)
    await act(async () => {
      click(/2\. useTransition 的 startTransition 里 throw/)
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('useTransition 的 startTransition 里 throw')
    expect(windowErrors).toEqual([])
  })

  it('接得住：useTransition 的 startTransition 里同步 throw 也算', async () => {
    function SyncTransition() {
      const [, startTransition] = useTransition()
      return (
        <button
          onClick={() =>
            startTransition(() => {
              throw new Error('startTransition 里同步 throw')
            })
          }
        >
          同步 throw
        </button>
      )
    }
    render(
      <ErrorBoundary fallback={({ error }) => <p role="alert">{errorMessage(error)}</p>}>
        <SyncTransition />
      </ErrorBoundary>,
    )
    await act(async () => {
      click('同步 throw')
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('startTransition 里同步 throw')
  })

  it('接得住：lazy 加载失败；换 key 重新挂载整个边界后恢复', async () => {
    render(<CatchScopeDemo />)
    await act(async () => {
      click('3. 渲染一个加载失败的 lazy 组件')
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('chunk 加载失败（模拟网络错误）')
    click('换 key 重新挂载')
    expect(screen.getByRole('button', { name: '1. 渲染中 throw' })).toBeInTheDocument()
  })

  it('接不住：事件处理函数里 throw —— React 交给 reportError（window 的 error 事件），边界没反应；同一次事件里其他监听照常执行', () => {
    render(<CatchScopeDemo />)
    click('4. 事件处理函数里 throw')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(windowErrors).toEqual(['事件处理函数里 throw'])
    expect(screen.getByLabelText('区块二错误日志')).toHaveTextContent('window error 事件：事件处理函数里 throw')

    const parentClicks = vi.fn()
    render(
      <div onClick={parentClicks}>
        <button
          onClick={() => {
            throw new Error('子元素的处理函数出错')
          }}
        >
          子元素
        </button>
      </div>,
    )
    click('子元素')
    expect(parentClicks).toHaveBeenCalledTimes(1)
  })

  it('接不住：顶层 startTransition（不是 useTransition 返回的那个）里 throw', () => {
    render(<CatchScopeDemo />)
    click('7. 顶层 startTransition 里 throw')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(windowErrors).toEqual(['顶层 startTransition 里 throw'])
  })

  it('接不住：setTimeout 回调里 throw —— 是普通的未捕获异常，React 不经手', () => {
    vi.useFakeTimers()
    render(<CatchScopeDemo />)
    click('6. setTimeout 里 throw')
    expect(() => vi.runOnlyPendingTimers()).toThrow('setTimeout 回调里 throw')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('接不住：async 事件处理函数 await 之后 throw —— 变成未处理的 Promise 拒绝', async () => {
    const rejections: unknown[] = []
    const onRejection = (reason: unknown) => rejections.push(reason)
    process.on('unhandledRejection', onRejection)
    try {
      render(<CatchScopeDemo />)
      click('5. async 处理函数里 throw')
      await waitFor(() => expect(rejections).toHaveLength(1))
      expect(errorMessage(rejections[0])).toBe('async 事件处理函数 await 之后 throw')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    } finally {
      process.off('unhandledRejection', onRejection)
    }
  })

  it('接不住的错误用 try / catch 转成 state 显示', () => {
    render(<CatchScopeDemo />)
    click('8. try / catch 后显示')
    expect(screen.getByText('保存失败（已被 try / catch 接住）')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('区块三：react-error-boundary', () => {
  it('showBoundary 把 await 之后的错误交给边界；重试（imperative-api）与换 resetKeys（keys）两种重置', async () => {
    render(<LibraryBoundaryDemo delayMs={20} />)
    const log = () => screen.getByLabelText('区块三日志').textContent ?? ''

    click('加载订单')
    expect(await screen.findByRole('alert')).toHaveTextContent('加载失败：网络错误：请求失败，请重试')
    expect(log()).toContain('onError：网络错误：请求失败，请重试')

    click('重试')
    expect(log()).toContain('onReset：reason = imperative-api')

    click('加载订单')
    await screen.findByRole('alert')
    fireEvent.change(screen.getByLabelText('订单 id'), { target: { value: 'o2' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(log()).toContain('onReset：reason = keys')

    fireEvent.click(screen.getByLabelText('模拟请求失败'))
    click('加载订单')
    expect(await screen.findByText(/SO-/)).toBeInTheDocument()
  })
})

describe('区块四：createRoot 的错误回调', () => {
  it('边界接住的 → onCaughtError（带 errorBoundary）；没接住的 → onUncaughtError，整棵小根的界面被移除；可以重建', async () => {
    const view = render(<RootOptionsDemo />)
    const log = () => screen.getByLabelText('根回调日志').textContent ?? ''

    await act(async () => click('边界里的组件崩溃'))
    expect(screen.getByRole('alert')).toHaveTextContent('边界接住了：边界里的组件崩溃')
    expect(log()).toContain('onCaughtError：边界里的组件崩溃（接住它的边界：ErrorBoundary）')
    expect(caughtLogs()).toHaveLength(0) // 传了 onCaughtError，默认的 console.error 就不再打印

    // 在 act 里，没接住的错误会被 act 收集后重新抛出，onUncaughtError 不会被调用（react-dom logUncaughtError：actQueue 不为空时只 push 到 thrownErrors）。
    // 所以这一步在 act 之外触发：临时关掉 IS_REACT_ACT_ENVIRONMENT，用原生 click，更新按浏览器里的方式调度
    const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const previous = env.IS_REACT_ACT_ENVIRONMENT
    env.IS_REACT_ACT_ENVIRONMENT = false
    try {
      screen.getByRole('button', { name: '没有边界的组件崩溃' }).click()
      await waitFor(() => expect(log()).toContain('onUncaughtError：没有边界的组件崩溃'))
    } finally {
      env.IS_REACT_ACT_ENVIRONMENT = previous
    }
    expect(screen.queryByText(/这是一棵独立的小根/)).not.toBeInTheDocument()
    expect(windowErrors).toEqual([]) // 传了 onUncaughtError，默认的 reportError 也被替换

    await act(async () => click('重建小根'))
    expect(await screen.findByText(/这是一棵独立的小根/)).toBeInTheDocument()
    // 小根在微任务里卸载（见 RootOptionsDemo）：放进 async act，让这个微任务也在 act 里执行完
    await act(async () => view.unmount())
  })
})

describe('入口', () => {
  it('四个区块都渲染出来', async () => {
    let view: ReturnType<typeof render> | undefined
    await act(async () => {
      view = render(<Example />)
    })
    for (const title of ['区块一', '区块二', '区块三', '区块四']) {
      expect(screen.getByRole('heading', { name: new RegExp(title) })).toBeInTheDocument()
    }
    await act(async () => view?.unmount())
  })
})
