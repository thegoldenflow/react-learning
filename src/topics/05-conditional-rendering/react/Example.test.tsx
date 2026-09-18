/**
 * 05 题的结论测试：文件头里标了「测试覆盖」的结论都在这里有可运行的证明（react / react-dom 19.2.8，开发构建）。
 */
import { useEffect, useState } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BranchStylesDemo } from './BranchStylesDemo'
import Example from './Example'
import { HideVsUnmountDemo } from './HideVsUnmountDemo'
import { PositionDemo } from './PositionDemo'
import { ZeroPitfallDemo } from './ZeroPitfallDemo'

let consoleError: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

const user = () => userEvent.setup({ delay: null })

const logLines = (label: string) =>
  within(screen.getByRole('list', { name: label }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent)
    .filter((line) => !line?.startsWith('（还没有记录'))

describe('区块一：条件渲染就是 JavaScript', () => {
  it('switch 提前 return、return null、存进变量、三元、&&、查表：切换状态后各自给出对应的 UI', async () => {
    const u = user()
    render(<BranchStylesDemo />)
    expect(screen.getByText('订单待支付，请在 30 分钟内完成付款')).toBeInTheDocument()
    expect(screen.getByTestId('pay-hint')).toHaveTextContent('提示：请尽快付款')
    expect(screen.queryByText(/联系客服恢复/)).toBeNull()

    await u.click(screen.getByRole('button', { name: '设为已支付' }))
    expect(screen.getByTestId('status-badge')).toHaveTextContent('已支付')
    expect(screen.getByTestId('progress')).toHaveTextContent('支付进度：已完成')
    expect(screen.getByTestId('pay-hint')).toHaveTextContent('提示：无需操作')

    await u.click(screen.getByRole('button', { name: '设为已取消' }))
    // 变量是 null：花括号里什么都不渲染
    expect(screen.getByTestId('pay-hint').textContent).toBe('提示：')
    expect(screen.getByText('（&& 分支）这张订单不会再扣款')).toBeInTheDocument()
    expect(screen.getByText('已取消的订单可在 24 小时内联系客服恢复')).toBeInTheDocument()
  })
})

describe('return null 不等于卸载', () => {
  it('组件 return null 时它自己还在树里：state 和 Effect 都保留；但它原来渲染的子组件被卸载，子组件的 state 丢了', async () => {
    const effects: string[] = []
    let toggle!: () => void
    function Inner() {
      const [n, setN] = useState(0)
      useEffect(() => {
        effects.push('inner:setup')
        return () => {
          effects.push('inner:cleanup')
        }
      }, [])
      return <button onClick={() => setN((v) => v + 1)}>内层 {n}</button>
    }
    function Badge({ visible }: { visible: boolean }) {
      const [clicks, setClicks] = useState(0)
      useEffect(() => {
        effects.push('badge:setup')
        return () => {
          effects.push('badge:cleanup')
        }
      }, [])
      if (!visible) return null
      return (
        <>
          <button onClick={() => setClicks((n) => n + 1)}>徽章 {clicks}</button>
          <Inner />
        </>
      )
    }
    function Parent() {
      const [visible, setVisible] = useState(true)
      toggle = () => setVisible((v) => !v)
      return <Badge visible={visible} />
    }
    const u = user()
    render(<Parent />)
    await u.click(screen.getByRole('button', { name: '徽章 0' }))
    await u.click(screen.getByRole('button', { name: '内层 0' }))
    await act(async () => toggle())
    expect(screen.queryByRole('button')).toBeNull()
    await act(async () => toggle())
    // Badge 自己的 state 还在；Inner 是新挂载的（state 从 0 开始，Effect 清理后重新建立）
    expect(screen.getByRole('button', { name: '徽章 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '内层 0' })).toBeInTheDocument()
    expect(effects).toEqual(['inner:setup', 'badge:setup', 'inner:cleanup', 'inner:setup'])
  })
})

describe('区块二：&& 的 0 陷阱', () => {
  it('左边是 0 / NaN 时渲染出「0」「NaN」；改成布尔值就不会', async () => {
    const u = user()
    render(<ZeroPitfallDemo />)
    expect(screen.getByTestId('wrong-count')).toHaveTextContent('购物车共 3 件商品')
    await u.click(screen.getByRole('button', { name: '清空商品（数量设为 0）' }))
    expect(screen.getByTestId('wrong-count').textContent).toBe('❌ {itemCount && …}：0')
    expect(screen.getByTestId('wrong-average').textContent).toBe('❌ {average && …}：NaN')
    expect(screen.getByTestId('right-count').textContent).toBe('✅ {itemCount > 0 && …}：')
    expect(screen.getByTestId('right-average').textContent).toBe('✅ {Number.isFinite(average) ? … : null}：')
  })

  it('哪些值会变成文本：true / false / null / undefined / 空字符串 / 空数组不产生节点；0、NaN、0n 都被渲染出来', () => {
    render(
      <>
        <p data-testid="nothing">
          {true}
          {false}
          {null}
          {undefined}
          {''}
          {[]}
        </p>
        <p data-testid="numbers">
          {0}|{NaN}|{0n}
        </p>
      </>,
    )
    expect(screen.getByTestId('nothing').childNodes).toHaveLength(0)
    expect(screen.getByTestId('numbers').textContent).toBe('0|NaN|0')
  })
})

describe('区块三：UI 树里的位置决定 state 的去留', () => {
  it('三元两边是同一个组件：切换后草稿还在（state 保留）；加 key 或渲染到不同位置才会重置', async () => {
    const u = user()
    render(<PositionDemo />)
    for (const testId of ['same-position', 'with-key', 'different-positions']) {
      await u.type(within(screen.getByTestId(testId)).getByRole('textbox', { name: 'Taylor 的备注' }), '尽快发货')
    }
    await u.click(screen.getByRole('button', { name: /切换客户/ }))
    // 标签已经换成 Sarah，但同位置的那一栏还是 Taylor 的草稿
    expect(within(screen.getByTestId('same-position')).getByRole('textbox', { name: 'Sarah 的备注' })).toHaveValue('尽快发货')
    expect(within(screen.getByTestId('with-key')).getByRole('textbox', { name: 'Sarah 的备注' })).toHaveValue('')
    expect(within(screen.getByTestId('different-positions')).getByRole('textbox', { name: 'Sarah 的备注' })).toHaveValue('')
  })
})

describe('区块四：隐藏还是卸载', () => {
  it('&& 卸载丢 state 和 DOM；hidden 属性都保留、Effect 不停；Activity 都保留、Effect 被清理后重建', async () => {
    const u = user()
    render(<HideVsUnmountDemo />)
    const names = ['&& 卸载', 'hidden 属性', 'Activity']
    for (const name of names) {
      const panel = screen.getByTestId(`panel-${name}`)
      await u.click(within(panel).getByRole('button', { name: '点赞 0' }))
      await u.type(within(panel).getByRole('textbox'), '草稿')
    }
    expect(logLines('区块四日志')).toEqual([
      '&& 卸载：Effect 建立（开始订阅）',
      'hidden 属性：Effect 建立（开始订阅）',
      'Activity：Effect 建立（开始订阅）',
    ])

    await u.click(screen.getByRole('button', { name: '隐藏三块面板' }))
    expect(screen.queryByTestId('panel-&& 卸载')).toBeNull()
    expect(screen.getByTestId('hidden-wrapper')).not.toBeVisible()
    // Activity 用 display: none !important 把子元素藏起来，DOM 还在
    expect(screen.getByTestId('panel-Activity').getAttribute('style')).toBe('display: none !important;')
    expect(logLines('区块四日志').slice(3)).toEqual(['&& 卸载：Effect 清理（取消订阅）', 'Activity：Effect 清理（取消订阅）'])

    await u.click(screen.getByRole('button', { name: '显示三块面板' }))
    const panel = (name: string) => within(screen.getByTestId(`panel-${name}`))
    expect(panel('&& 卸载').getByRole('button', { name: '点赞 0' })).toBeInTheDocument()
    expect(panel('&& 卸载').getByRole('textbox')).toHaveValue('')
    expect(panel('hidden 属性').getByRole('button', { name: '点赞 1' })).toBeInTheDocument()
    expect(panel('hidden 属性').getByRole('textbox')).toHaveValue('草稿')
    expect(panel('Activity').getByRole('button', { name: '点赞 1' })).toBeInTheDocument()
    expect(panel('Activity').getByRole('textbox')).toHaveValue('草稿')
    expect(screen.getByTestId('panel-Activity').getAttribute('style')).toBe('')
    expect(logLines('区块四日志').slice(5)).toEqual(['&& 卸载：Effect 建立（开始订阅）', 'Activity：Effect 建立（开始订阅）'])
  })
})

it('整页渲染：四个区块都在，没有开发期报错', async () => {
  await act(async () => {
    render(<Example />)
  })
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent!.slice(0, 3))).toEqual(['区块一', '区块二', '区块三', '区块四'])
  expect(consoleError).not.toHaveBeenCalled()
})
