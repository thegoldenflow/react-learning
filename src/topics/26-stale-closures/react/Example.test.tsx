/**
 * 26 题的结论测试：文件头里标了「测试覆盖」的结论都在这里有可运行的证明（react-dom 19.2.8）。
 * 定时器类的结论用 fake timers 精确推进时间；轮询的请求延迟传 0，推进定时器后 flush 微任务让 Promise 回来。
 * 测试工具本身在 34 题（待新增）细讲。
 */
import { forwardRef, memo, useEffect, useEffectEvent, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { DelayedSaveDemo } from './DelayedSaveDemo'
import { POLL_MS, SAVE_DELAY_MS } from './demoKit'
import { DependencyLabs } from './DependencyLabs'
import Example from './Example'
import { ListenerDemo } from './ListenerDemo'
import { PollingDemo } from './PollingDemo'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const logOf = (label: string) => screen.getByLabelText(label).textContent ?? ''
const logLines = (label: string) => Array.from(screen.getByLabelText(label).querySelectorAll('li')).map((li) => li.textContent ?? '')
const pressEnter = (placeholder: string) => fireEvent.keyDown(screen.getByPlaceholderText(placeholder), { key: 'Enter' })

/**
 * 推进 fake timers 并跑完 Promise 回调。模拟请求的 delayMs=0 仍是一个 setTimeout(0)；
 * Vitest 内置的 fake-timers 把「推进过程中新排进来的 0ms 定时器」记成 1ms 之后（clock.duringTick ? 1 : 0），
 * 所以由 setInterval 回调发出的请求要再推 1ms 才回来。
 */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
    await vi.advanceTimersByTimeAsync(1)
  })
}

describe('区块一：事件处理函数里的 setTimeout（没有 Effect 参与）', () => {
  it('读快照的回调拿到点击那次渲染的 count；读 latest ref 的拿到最新值', () => {
    vi.useFakeTimers()
    render(<DelayedSaveDemo />)
    click('2 秒后保存（坏：读快照 count）')
    click('2 秒后保存（好：读 latestCount.current）')
    for (let i = 0; i < 3; i += 1) click('+1')
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS))

    expect(logOf('区块一日志')).toContain('【坏】保存了 count=0')
    expect(logOf('区块一日志')).toContain('【好】保存了 count=3')
  })

  it('setCount(count + 1) 把中间的更新盖回去（数字倒退）；setCount(c => c + 1) 在最新值上 +1', () => {
    vi.useFakeTimers()
    render(<DelayedSaveDemo />)
    const count = () => screen.getByLabelText('区块一 count').textContent

    click('2 秒后 +1（坏：setCount(count + 1)）')
    for (let i = 0; i < 3; i += 1) click('+1')
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS))
    expect(count()).toBe('1') // 3 被打回 0 + 1

    click('2 秒后 +1（好：setCount(c => c + 1)）')
    for (let i = 0; i < 3; i += 1) click('+1')
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS))
    expect(count()).toBe('5') // 1 + 3 + 1
  })

  it('卸载后不会再有回调往日志里写（useTimeouts 在卸载时 clearTimeout）', () => {
    vi.useFakeTimers()
    const view = render(<DelayedSaveDemo />)
    click('2 秒后保存（坏：读快照 count）')
    expect(vi.getTimerCount()).toBe(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('区块二：手动 addEventListener', () => {
  it('依赖 [] 读到挂载时的值；写对依赖每次 count 变化都重注册；useEffectEvent 只注册一次却读到最新值', () => {
    render(<ListenerDemo />)
    for (let i = 0; i < 2; i += 1) click('+1')

    pressEnter('按 Enter（坏：依赖 []）')
    pressEnter('按 Enter（写对依赖 [count, log]）')
    pressEnter('按 Enter（useEffectEvent）')
    pressEnter('按 Enter（对照：JSX onKeyDown）')
    pressEnter('按 Enter（坏：useCallback 缓存的 onKeyDown）')

    const log = logOf('区块二日志')
    expect(log).toContain('【坏 · 依赖 []】监听器读到 count=0')
    expect(log).toContain('【写对依赖】监听器读到 count=2')
    expect(log).toContain('【写对依赖】第 3 次注册监听器（count=2）') // 挂载 1 次 + 两次 +1 各 1 次
    expect(log).toContain('【useEffectEvent】监听器读到 count=2')
    expect(log).toContain('【useEffectEvent】第 1 次注册监听器')
    expect(log).not.toContain('【useEffectEvent】第 2 次注册监听器')
    expect(log).toContain('【对照 · JSX】onKeyDown 读到 count=2')
    // JSX 事件也会过期：前提是旧闭包被 useCallback 缓存住了
    expect(log).toContain('【坏 · useCallback []】JSX 处理函数读到 count=0')
  })

  it('每个版本的 cleanup 都会注销监听器：卸载后 add / remove 次数相等', () => {
    const added = vi.spyOn(HTMLInputElement.prototype, 'addEventListener')
    const removed = vi.spyOn(HTMLInputElement.prototype, 'removeEventListener')
    const view = render(<ListenerDemo />)
    for (let i = 0; i < 2; i += 1) click('+1')
    const keydown = (spy: typeof added) => spy.mock.calls.filter(([type]) => type === 'keydown').length
    // 依赖 [] 1 次 + 写对依赖 3 次 + useEffectEvent 1 次（JSX 事件由 React 在根节点统一委托，不走这里）
    expect(keydown(added)).toBe(5)
    view.unmount()
    expect(keydown(removed)).toBe(5)
  })
})

describe('区块三：轮询读筛选参数', () => {
  const start = async (mode: string) => {
    render(<PollingDemo delayMs={0} />)
    fireEvent.change(screen.getByRole('combobox', { name: /^写法/ }), { target: { value: mode } })
    click('开始轮询')
    await advance(0) // 挂载时立即的第一次请求
  }
  const switchToPaid = () => fireEvent.change(screen.getByRole('combobox', { name: /^筛选状态/ }), { target: { value: 'paid' } })

  it('❌ 依赖 []：切到 paid 之后仍然按 all 查', async () => {
    vi.useFakeTimers()
    await start('broken')
    switchToPaid()
    await advance(POLL_MS)
    expect(logLines('区块三日志').at(-1)).toBe('【坏 · []】第 2 次轮询：status=all → 15 条')
  })

  it('② 写对依赖：切换后立刻按新参数查一次，计数从 1 重来（定时器重建）', async () => {
    vi.useFakeTimers()
    await start('deps')
    switchToPaid()
    await advance(0)
    expect(logLines('区块三日志').at(-1)).toBe('【写对依赖】第 1 次轮询：status=paid → 6 条')
  })

  it.each([
    ['effectEvent', '【useEffectEvent】'],
    ['latestRef', '【latest ref】'],
  ])('%s：定时器只建一次（setInterval 调用 1 次），计数连续、参数读最新', async (mode, tag) => {
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    await start(mode)
    switchToPaid()
    await advance(POLL_MS)
    expect(logLines('区块三日志').at(-1)).toBe(`${tag}第 2 次轮询：status=paid → 6 条`)
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
  })

  it('停止轮询后 cleanup 已执行：没有定时器，也不再写日志', async () => {
    vi.useFakeTimers()
    await start('effectEvent')
    click('停止轮询')
    const before = logLines('区块三日志').length
    await advance(POLL_MS * 3)
    expect(vi.getTimerCount()).toBe(0)
    expect(logLines('区块三日志')).toHaveLength(before)
  })

  it('cleanup 之后才回来的响应被 alive 标志丢弃', async () => {
    vi.useFakeTimers()
    render(<PollingDemo delayMs={500} />)
    fireEvent.change(screen.getByRole('combobox', { name: /^写法/ }), { target: { value: 'effectEvent' } })
    click('开始轮询') // 第一次请求已发出，500ms 后才回来
    click('停止轮询')
    await advance(1000)
    expect(logOf('区块三日志')).not.toContain('第 1 次轮询')
  })
})

describe('useEffectEvent 与 latest ref 的细节', () => {
  it('Effect Event 没有稳定身份（每次渲染一个新函数），但旧的那个也转发到最新的回调', () => {
    const seen: Array<() => number> = []
    function Probe() {
      const [n, setN] = useState(0)
      const read = useEffectEvent(() => n)
      useEffect(() => {
        seen.push(read)
      })
      return <button onClick={() => setN((x) => x + 1)}>n+1</button>
    }
    render(<Probe />)
    click('n+1')
    click('n+1')
    expect(seen).toHaveLength(3)
    expect(seen[0]).not.toBe(seen[1])
    expect(seen[1]).not.toBe(seen[2])
    expect(seen[0]()).toBe(2) // 第一次渲染拿到的函数，调用时读到的是最新提交的 n
  })

  it('渲染期间调用 Effect Event 会抛错', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function CallsDuringRender() {
      const read = useEffectEvent(() => 1)
      // 故意违反：rules-of-hooks 报「`read` is a function created with React Hook "useEffectEvent", and can only be called from Effects
      // and Effect Events in the same component」—— 这里要证明的是运行时同样会拦
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return <span>{read()}</span>
    }
    expect(() => render(<CallsDuringRender />)).toThrow("A function wrapped in useEffectEvent can't be called during rendering.")
  })

  it('运行时只拦渲染期：在 onClick 里调用 Effect Event 不抛错，读到最新值（lint 的 rules-of-hooks 会报 error）', () => {
    const seen: number[] = []
    function Probe() {
      const [n, setN] = useState(0)
      const read = useEffectEvent(() => n)
      return (
        <>
          <button onClick={() => setN((x) => x + 1)}>n+1</button>
          {/* 故意违反：rules-of-hooks 报「`read` is a function created with React Hook "useEffectEvent", and can only be called from Effects and
              Effect Events in the same component」—— 这里要证明的是运行时不拦 */}
          {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
          <button onClick={() => seen.push(read())}>读</button>
        </>
      )
    }
    render(<Probe />)
    click('n+1')
    click('读')
    expect(seen).toEqual([1])
  })

  it('Effect Event 在这次提交的 useInsertionEffect 里调用，读到的已是新值', () => {
    const seen: string[] = []
    function Probe() {
      const [n, setN] = useState(0)
      const read = useEffectEvent(() => n)
      useInsertionEffect(() => {
        seen.push(`insertion：n=${n} effectEvent=${read()}`)
      })
      return <button onClick={() => setN((x) => x + 1)}>n+1</button>
    }
    render(<Probe />)
    click('n+1')
    expect(seen).toEqual(['insertion：n=0 effectEvent=0', 'insertion：n=1 effectEvent=1'])
  })

  it('latest ref 的窗口期：用 useEffect 同步时，layout effect 与子组件的 Effect 读到旧值；Effect Event 已是最新', () => {
    const seen: string[] = []
    function Child({ report }: { report: () => void }) {
      useEffect(() => {
        report()
      })
      return null
    }
    function Probe() {
      const [n, setN] = useState(0)
      const latest = useRef(n)
      useEffect(() => {
        latest.current = n
      })
      const read = useEffectEvent(() => n)
      useLayoutEffect(() => {
        seen.push(`layout：n=${n} latest=${latest.current} effectEvent=${read()}`)
      })
      return (
        <>
          <button onClick={() => setN((x) => x + 1)}>n+1</button>
          <Child report={() => seen.push(`子组件 Effect：n=${n} latest=${latest.current}`)} />
        </>
      )
    }
    render(<Probe />)
    click('n+1')
    expect(seen).toContain('layout：n=1 latest=0 effectEvent=1')
    expect(seen).toContain('子组件 Effect：n=1 latest=0') // 子组件的 Effect 先于父组件的 Effect 执行
  })

  it('React 19.2.x 的已知 bug：memo() / forwardRef 组件里的 Effect Event 一直调用第一次渲染的回调（19.3.0 修复，#34831）', () => {
    // 19.2.8 的提交阶段只给普通函数组件（tag 0）换回调，forwardRef（11）和不带比较函数的 memo（15）直接跳过
    // （react-dom-client.development.js:13874-13892）。升级到 19.3 之后这条测试会失败 —— 那时把断言改成读到最新值，并同步改课件。
    const seen: string[] = []
    function useReport(tag: string, n: number) {
      const read = useEffectEvent(() => n)
      useEffect(() => {
        seen.push(`${tag}：props n=${n}，Effect Event 读到 ${read()}`)
      })
    }
    const Plain = ({ n }: { n: number }) => {
      useReport('普通组件', n)
      return null
    }
    const Memoized = memo(function Memoized({ n }: { n: number }) {
      useReport('memo 组件', n)
      return null
    })
    const WithRef = forwardRef<HTMLSpanElement, { n: number }>(function WithRef({ n }, ref) {
      useReport('forwardRef 组件', n)
      return <span ref={ref} />
    })
    function Parent() {
      const [n, setN] = useState(0)
      return (
        <>
          <button onClick={() => setN((x) => x + 1)}>n+1</button>
          <Plain n={n} />
          <Memoized n={n} />
          <WithRef n={n} />
        </>
      )
    }
    render(<Parent />)
    click('n+1')
    expect(seen).toContain('普通组件：props n=1，Effect Event 读到 1')
    expect(seen).toContain('memo 组件：props n=1，Effect Event 读到 0')
    expect(seen).toContain('forwardRef 组件：props n=1，Effect Event 读到 0')
  })

  it('离散事件里 flushSync 之后，被动 Effect 已同步执行完：latest ref 立刻是新值', () => {
    const seen: number[] = []
    function Probe() {
      const [n, setN] = useState(0)
      const latest = useRef(n)
      useEffect(() => {
        latest.current = n
      })
      return (
        <button
          onClick={() => {
            flushSync(() => setN((x) => x + 1))
            seen.push(latest.current)
          }}
        >
          flushSync
        </button>
      )
    }
    render(<Probe />)
    click('flushSync')
    expect(seen).toEqual([1])
  })
})

describe('区块四：让依赖合法地消失', () => {
  it('4a：交互逻辑放进 Effect，提交后每切一次主题就多发一次请求；放进事件处理函数只发一次', () => {
    render(<DependencyLabs />)
    click('提交（Effect 版）')
    click('提交（事件版）')
    click(/切换主题/)
    click(/切换主题/)
    const lines = logLines('4a 日志')
    expect(lines.filter((l) => l === '【Effect 版】POST /api/register')).toHaveLength(3)
    expect(lines.filter((l) => l === '【事件版】POST /api/register')).toHaveLength(1)
  })

  it('4b：每次渲染新建的对象当依赖，和连接无关的打字也会断开重连；只依赖原始值则不会', () => {
    render(<DependencyLabs />)
    fireEvent.change(screen.getByPlaceholderText('草稿（对象依赖版）'), { target: { value: 'a' } })
    fireEvent.change(screen.getByPlaceholderText('草稿（原始值依赖版）'), { target: { value: 'a' } })
    let lines = logLines('4b 日志')
    expect(lines.filter((l) => l.startsWith('【对象依赖】连接'))).toHaveLength(2)
    expect(lines.filter((l) => l.startsWith('【原始值依赖】连接'))).toHaveLength(1)

    fireEvent.change(screen.getByRole('combobox', { name: /^房间/ }), { target: { value: 'travel' } })
    lines = logLines('4b 日志')
    expect(lines.at(-1)).toBe('【原始值依赖】连接 wss://chat.example/travel')
    expect(lines.filter((l) => l.startsWith('【原始值依赖】连接'))).toHaveLength(2)
  })

  it('4c：ref.current 写进依赖数组，改它不会让 Effect 重跑；别的原因重渲染时才补跑一次', () => {
    render(<DependencyLabs />)
    const effectRuns = () => logLines('4c 日志').filter((l) => l.startsWith('Effect 执行了'))
    expect(effectRuns()).toEqual(['Effect 执行了（此刻 ref.current=0）'])
    click('ref.current + 1')
    click('ref.current + 1')
    expect(effectRuns()).toHaveLength(1)
    click(/让组件重渲染/)
    expect(effectRuns()).toEqual(['Effect 执行了（此刻 ref.current=0）', 'Effect 执行了（此刻 ref.current=2）'])
  })
})

it('入口组件渲染四个区块', () => {
  render(<Example />)
  expect(screen.getByRole('heading', { name: /区块一/ })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /区块二/ })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /区块三/ })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /区块四/ })).toBeInTheDocument()
})
