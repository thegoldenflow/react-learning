/**
 * 04 题的结论测试：文件头里标了「测试覆盖」的结论都在这里有可运行的证明（react / react-dom 19.2.8，开发构建，jsdom）。
 * jsdom 没有真实的滚动和布局，滚动、滚轮都是用 fireEvent 派发事件来观察监听器的行为。测试工具本身在 34 题（待新增）细讲。
 */
import { useEffect, useRef, type ChangeEvent, type MouseEventHandler, type SubmitEvent, type SyntheticEvent } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectTypeOf } from 'vitest'
import { BindingDemo } from './BindingDemo'
import { DefaultActionDemo } from './DefaultActionDemo'
import { describeTarget } from './demoKit'
import { EventObjectDemo } from './EventObjectDemo'
import Example from './Example'
import { ModifiersDemo } from './ModifiersDemo'
import { PassiveWheelDemo } from './PassiveWheelDemo'
import { PropagationDemo } from './PropagationDemo'

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

const logLines = (label: string) =>
  within(screen.getByRole('list', { name: label }))
    .getAllByRole('listitem')
    .map((li) => li.textContent)

const tableRows = (label: string) =>
  Object.fromEntries(
    within(screen.getByRole('table', { name: label }))
      .getAllByRole('row')
      .map((tr) => {
        const [expression, value] = tr.querySelectorAll('td')
        return [expression.textContent, value.textContent]
      }),
  )

const user = () => userEvent.setup({ delay: null })

describe('区块一：绑定与传参', () => {
  it('onClick={handleCountClick}：点击时才调用，并收到事件对象', () => {
    render(<BindingDemo />)
    expect(screen.getByRole('button', { name: '点击计数：0' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '点击计数：0' }), { clientX: 12, clientY: 34 })
    expect(screen.getByRole('button', { name: '点击计数：1' })).toBeInTheDocument()
    expect(screen.getByTestId('last-pos')).toHaveTextContent('x=12, y=34')
  })

  it('传参包一层箭头函数；子组件通过 onRemove 回调 prop 报告，事件对象里的 shiftKey 一起传上去', () => {
    render(<BindingDemo />)
    const keyboard = within(screen.getByTestId('row-i1'))
    fireEvent.click(keyboard.getByRole('button'), { shiftKey: true })
    expect(screen.getByTestId('row-i1')).toHaveTextContent('机械键盘 × 1')
    fireEvent.click(keyboard.getByRole('button'))
    expect(screen.queryByTestId('row-i1')).toBeNull()
  })

  it('onClick={removeItem(item.id)}：渲染时就调用了，列表一出现就被删光；更新会收敛，所以不报错', async () => {
    const u = user()
    render(<BindingDemo />)
    await u.click(screen.getByRole('button', { name: /❌ 挂载/ }))
    const broken = screen.getByTestId('broken-list')
    expect(within(broken).queryAllByRole('button')).toHaveLength(0)
    expect(broken).toHaveTextContent('一渲染就被删光了')
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('区块二：事件对象', () => {
  it('target 是被点中的子元素、currentTarget 是挂监听的元素、nativeEvent.currentTarget 是 root 容器；处理函数返回后 currentTarget 变成 null', async () => {
    const u = user()
    const { container } = render(<EventObjectDemo />)
    await u.click(screen.getByText('🧾 图标'))
    expect(tableRows('处理函数里读到的值')).toMatchObject({
      'e.type': 'click',
      'e.target': '<span data-node="icon">',
      'e.currentTarget': '<button data-node="demo-button">',
      // render() 的 container 就是这棵 React 树的 root 容器，React 的监听器挂在它上面
      'e.nativeEvent.currentTarget': describeTarget(container),
      'e.nativeEvent instanceof window.MouseEvent': 'true',
      'e.bubbles / e.eventPhase': 'true / 3',
    })
    await waitFor(() =>
      expect(tableRows('处理函数返回之后读到的值')).toEqual({
        'setTimeout 里 e.type': 'click',
        'setTimeout 里 e.target': '<span data-node="icon">',
        'setTimeout 里 e.currentTarget': 'null',
        'setTimeout 里 提前存下来的 button': '<button data-node="demo-button">',
      }),
    )
  })
})

describe('区块三：事件传播', () => {
  it('顺序：React 捕获（外 → 中）→ 原生捕获与冒泡 → React 冒泡（按钮 → 中 → 外）→ document', async () => {
    const u = user()
    render(<PropagationDemo />)
    await u.click(screen.getByRole('button', { name: '点我' }))
    expect(logLines('区块三日志')).toEqual([
      'React 外层 onClickCapture',
      'React 中层 onClickCapture',
      '原生 外层 div（捕获）',
      '原生 按钮（冒泡）',
      '原生 外层 div（冒泡）',
      'React 按钮 onClick',
      'React 中层 onClick',
      'React 外层 onClick',
      '原生 document（冒泡）',
    ])
  })

  it('按钮里 stopPropagation：React 树里后面的 onClick 和 document 上的原生监听都收不到；DOM 里更深的原生监听早已执行', async () => {
    const u = user()
    render(<PropagationDemo />)
    await u.click(screen.getByRole('checkbox'))
    await u.click(screen.getByRole('button', { name: '点我' }))
    expect(logLines('区块三日志')).toEqual([
      'React 外层 onClickCapture',
      'React 中层 onClickCapture',
      '原生 外层 div（捕获）',
      '原生 按钮（冒泡）',
      '原生 外层 div（冒泡）',
      'React 按钮 onClick',
    ])
  })

  it('在 onClickCapture 里 stopPropagation：原生事件在 root 容器的捕获阶段就被停住，root 里面的原生监听器和 document 都收不到', async () => {
    const seen: string[] = []
    function Probe() {
      const outerRef = useRef<HTMLDivElement>(null)
      const buttonRef = useRef<HTMLButtonElement>(null)
      useEffect(() => {
        const outer = outerRef.current!
        const button = buttonRef.current!
        const onOuterCapture = () => seen.push('原生 外层（捕获）')
        const onNative = () => seen.push('原生 按钮')
        const onDocument = () => seen.push('原生 document')
        outer.addEventListener('click', onOuterCapture, true)
        button.addEventListener('click', onNative)
        document.addEventListener('click', onDocument)
        return () => {
          outer.removeEventListener('click', onOuterCapture, true)
          button.removeEventListener('click', onNative)
          document.removeEventListener('click', onDocument)
        }
      }, [])
      return (
        <div
          ref={outerRef}
          onClickCapture={(e) => {
            seen.push('React 外层 onClickCapture')
            e.stopPropagation()
          }}
          onClick={() => seen.push('React 外层 onClick')}
        >
          <button ref={buttonRef} onClick={() => seen.push('React 按钮 onClick')}>
            捕获阶段
          </button>
        </div>
      )
    }
    render(<Probe />)
    await act(async () => screen.getByRole('button', { name: '捕获阶段' }).click())
    expect(seen).toEqual(['React 外层 onClickCapture'])
  })

  it('stopPropagation 不挡同一个节点（root 容器）上后挂的原生监听器；e.nativeEvent.stopImmediatePropagation() 才挡得住', async () => {
    for (const immediate of [false, true]) {
      const seen: string[] = []
      const { container, unmount } = render(
        <button
          onClick={(e) => {
            seen.push('React onClick')
            e.stopPropagation()
            if (immediate) e.nativeEvent.stopImmediatePropagation()
          }}
        >
          {immediate ? '带 stopImmediatePropagation' : '只 stopPropagation'}
        </button>,
      )
      const onRoot = () => seen.push('root 容器上后挂的原生监听器')
      container.addEventListener('click', onRoot)
      await act(async () => screen.getByRole('button').click())
      container.removeEventListener('click', onRoot)
      unmount()
      expect(seen).toEqual(immediate ? ['React onClick'] : ['React onClick', 'root 容器上后挂的原生监听器'])
    }
  })

  it('onScroll 在 React 里不冒泡（外层用 onScrollCapture 能收到）；onFocus 在 React 里冒泡', async () => {
    render(<PropagationDemo />)
    fireEvent.scroll(screen.getByTestId('scroll-box'))
    await act(async () => screen.getByRole('textbox', { name: '焦点实验输入框' }).focus())
    expect(screen.getByTestId('bubbling-counts')).toHaveTextContent(
      '里面的 onScroll：1 次 · 外层的 onScroll：0 次 · 外层的 onScrollCapture：1 次 · 外层的 onFocus：1 次',
    )
  })

  it('原生不冒泡的 load 在 React 里冒泡（common 页 Caveats）', () => {
    const seen: string[] = []
    render(
      <div onLoad={() => seen.push('外层 onLoad')}>
        <img alt="" data-testid="img" onLoad={() => seen.push('img onLoad')} />
      </div>,
    )
    fireEvent.load(screen.getByTestId('img'))
    expect(seen).toEqual(['img onLoad', '外层 onLoad'])
  })
})

describe('区块四：默认行为', () => {
  it('preventDefault 只拦跳转，事件照样冒泡到外层', () => {
    render(<DefaultActionDemo />)
    // fireEvent 的返回值是原生 dispatchEvent 的结果：false 表示原生事件的默认动作被取消了
    expect(fireEvent.click(screen.getByRole('link', { name: '查看发票（preventDefault）' }))).toBe(false)
    expect(screen.getByTestId('default-message')).toHaveTextContent('拦截了跳转（e.nativeEvent.defaultPrevented = true），事件照样冒泡到外层')
    expect(screen.getByTestId('bubbled')).toHaveTextContent('外层收到的冒泡点击：1 次')
  })

  it('stopPropagation 只停传播，不管默认动作：勾选框照样勾上，外层计数不变', async () => {
    const u = user()
    render(<DefaultActionDemo />)
    const checkbox = screen.getByRole('checkbox', { name: '只 stopPropagation 的勾选框' })
    await u.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(screen.getByTestId('bubbled')).toHaveTextContent('外层收到的冒泡点击：0 次')
    expect(screen.getByTestId('default-message')).toHaveTextContent('stopPropagation：外层计数不变，勾选框照样变成了已勾选')
  })

  it('在 <form> 上监听 onSubmit：输入框里按回车也会走到这里，preventDefault 拦住了原生 submit 的默认动作', async () => {
    const u = user()
    render(<DefaultActionDemo />)
    // React 的监听器挂在 root 容器上，比 document 早；document 上的原生监听器读到的就是 React 处理完之后的结果
    const submitted: boolean[] = []
    const onSubmit = (e: Event) => submitted.push(e.defaultPrevented)
    document.addEventListener('submit', onSubmit)
    try {
      const input = screen.getByRole('textbox', { name: '搜索关键字' })
      await u.clear(input)
      await u.type(input, '鼠标{Enter}')
    } finally {
      document.removeEventListener('submit', onSubmit)
    }
    expect(submitted).toEqual([true])
    expect(screen.getByTestId('default-message')).toHaveTextContent('拦截了表单提交，关键字：鼠标（没有整页刷新）')
  })

  it('提交按钮的 onClick 跑在浏览器校验之前：必填为空时 onClick 照样触发、onSubmit 不触发；回车会对提交按钮派发 click；requestSubmit() 不经过按钮', async () => {
    const u = user()
    const seen: string[] = []
    render(
      <form
        onSubmit={(e) => {
          e.preventDefault()
          seen.push('form onSubmit')
        }}
      >
        <input required aria-label="必填项" />
        <button type="submit" onClick={() => seen.push('button onClick')}>
          提交
        </button>
      </form>,
    )
    await u.click(screen.getByRole('button', { name: '提交' }))
    expect(seen.splice(0)).toEqual(['button onClick'])
    await u.type(screen.getByRole('textbox', { name: '必填项' }), '键盘{Enter}')
    expect(seen.splice(0)).toEqual(['button onClick', 'form onSubmit'])
    await act(async () => screen.getByRole('button', { name: '提交' }).closest('form')!.requestSubmit())
    expect(seen.splice(0)).toEqual(['form onSubmit'])
  })

  it('照 HTML 写成字符串 onClick="…"：开发环境报错，点击没反应', () => {
    render(<button onClick={'handleClick()' as never}>字符串处理函数</button>)
    expect(errorTexts()).toEqual(['Expected `onClick` listener to be a function, instead got a value of `string` type.'])
  })

  it('e.target !== e.currentTarget 就返回（Vue 的 .self）：点子元素不计数', async () => {
    const u = user()
    render(<DefaultActionDemo />)
    const area = screen.getByTestId('self-area')
    await u.click(within(area).getByRole('button', { name: '点这个按钮不算' }))
    expect(area).toHaveTextContent('已计数 0 次')
    await u.click(area)
    expect(area).toHaveTextContent('已计数 1 次')
  })
})

describe('区块五：Vue 修饰符的 React 写法', () => {
  it('.once：state 标记（界面跟着变）与 ref 标记（界面不变）', async () => {
    const u = user()
    render(<ModifiersDemo />)
    await u.click(screen.getByRole('button', { name: '领取优惠券（.once）' }))
    expect(screen.getByRole('button', { name: '已领取' })).toBeDisabled()
    await u.click(screen.getByRole('button', { name: '上报一次（ref 标记）' }))
    await u.click(screen.getByRole('button', { name: '上报一次（ref 标记）' }))
    expect(logLines('区块五日志')).toEqual(['领取成功（之后再点不再处理）', '上报一次', '已经上报过，这次忽略'])
  })

  it('按键：Enter、Ctrl + Enter（exact）、多按了 Shift 不算、Esc 清空、输入法组字时的回车被忽略', () => {
    render(<ModifiersDemo />)
    const input = screen.getByRole('textbox', { name: '按键实验输入框' })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true, shiftKey: true })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    fireEvent.change(input, { target: { value: '草稿' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(logLines('区块五日志')).toEqual([
      'Enter（没按任何修饰键，相当于 .enter.exact）：提交',
      'Ctrl + Enter（只按了 Ctrl，相当于 .ctrl.enter.exact）：提交并继续',
      'Esc（相当于 .esc）：清空输入框',
    ])
    expect(input).toHaveValue('')
  })

  it('鼠标按键看 e.button；onContextMenu 里 preventDefault 拦住浏览器右键菜单', () => {
    render(<ModifiersDemo />)
    const button = screen.getByRole('button', { name: '用左键 / 中键 / 右键按我' })
    fireEvent.mouseDown(button, { button: 2 })
    const notCancelled = fireEvent.contextMenu(button)
    expect(notCancelled).toBe(false)
    expect(logLines('区块五日志')).toEqual(['按下了次键 / 右键（.right）', 'onContextMenu 里 preventDefault：浏览器右键菜单没有弹出'])
  })
})

describe('区块六：onWheel 是被动监听', () => {
  it('onWheel 里 preventDefault：合成事件记了一笔，原生事件没被拦住；原生监听器 { passive: false } 能拦住', () => {
    render(<PassiveWheelDemo />)
    // fireEvent 的返回值是 dispatchEvent 的结果：false 表示有监听器成功 preventDefault
    expect(fireEvent.wheel(screen.getByTestId('react-wheel'), { deltaY: -100 })).toBe(true)
    expect(screen.getByTestId('react-wheel-result')).toHaveTextContent('e.isDefaultPrevented() = true，e.nativeEvent.defaultPrevented = false')
    expect(fireEvent.wheel(screen.getByTestId('native-wheel'), { deltaY: -100 })).toBe(false)
    expect(screen.getByTestId('zoom')).toHaveTextContent('110%')
  })
})

describe('类型层（@types/react 19.2.18）', () => {
  // expectTypeOf 在运行时什么都不检查，真正的验证是 npm run typecheck（vue-tsc 检查测试文件）
  it('事件类型从 react 导入；currentTarget 带上元素类型，target 一般只是 EventTarget（SubmitEvent 例外）', () => {
    const onClick: MouseEventHandler<HTMLButtonElement> = (e) => {
      expectTypeOf(e.currentTarget).toEqualTypeOf<EventTarget & HTMLButtonElement>()
      expectTypeOf(e.target).toEqualTypeOf<EventTarget>()
      expectTypeOf(e.nativeEvent).toEqualTypeOf<MouseEvent>()
    }
    // ChangeEvent 专门把 target 收窄成表单元素（index.d.ts:2097-2108）
    const onChange = (e: ChangeEvent<HTMLInputElement>) => expectTypeOf(e.target.value).toEqualTypeOf<string>()
    const onSubmit = (e: SubmitEvent<HTMLFormElement>) => expectTypeOf(e.target).toEqualTypeOf<EventTarget & HTMLFormElement>()
    // 列表里没有的事件用 SyntheticEvent 兜底
    const onAnything = (e: SyntheticEvent<HTMLElement>) => expectTypeOf(e.preventDefault).toBeFunction()
    expect([onClick, onChange, onSubmit, onAnything].every((fn) => typeof fn === 'function')).toBe(true)
  })
})

it('整页渲染：六个区块都在，没有开发期报错', () => {
  render(<Example />)
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent!.slice(0, 3))).toEqual([
    '区块一',
    '区块二',
    '区块三',
    '区块四',
    '区块五',
    '区块六',
  ])
  expect(consoleError).not.toHaveBeenCalled()
})
