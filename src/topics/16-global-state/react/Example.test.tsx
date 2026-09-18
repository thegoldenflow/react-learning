/**
 * 16 题的结论测试：文件头里讲的关键结论，每条都在这里有一个可以运行的证明。
 * 渲染次数用 <Profiler> 统计（renderCounts.tsx），页面上的数字和这里断言的是同一个东西。
 * useCartStore 是模块级单例：每个测试前用 setState(getInitialState(), true) 整体重置（官方测试指南的做法），并清空 localStorage。
 * 测试工具本身在 34 题（待新增）细讲。
 */
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { CartDemo, DEMO_PRODUCTS } from './CartDemo'
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  getCheckoutRequestCount,
  selectTotalCount,
  useCartStore,
} from './cartStore'
import { ContextReducerCart } from './ContextReducerCart'
import Example from './Example'
import { ScopedStoreDemo } from './ScopedStoreDemo'
import { StoreApiDemo } from './StoreApiDemo'

beforeEach(() => {
  useCartStore.setState(useCartStore.getInitialState(), true)
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/** 读页面上「渲染次数」面板里某个组件的计数 */
const renders = (id: string) => Number(screen.getByTestId(`renders-${id}`).textContent?.match(/(\d+)$/)?.[1])
const snapshot = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, renders(id)]))
const CART_IDS = ['ProductList', 'CartPanel', 'CartSummary', 'GiftWrapToggle', 'WholeStoreBadge']

describe('区块一：selector 决定谁重渲染', () => {
  it('加入购物车：只选了 action 的商品列表不重渲染；读 items / 件数的组件和订阅整个 store 的徽标各渲染一次', () => {
    render(<CartDemo />)
    expect(snapshot(CART_IDS)).toEqual({ ProductList: 1, CartPanel: 1, CartSummary: 1, GiftWrapToggle: 1, WholeStoreBadge: 1 })

    fireEvent.click(screen.getAllByRole('button', { name: '加入购物车' })[0])

    expect(snapshot(CART_IDS)).toEqual({ ProductList: 1, CartPanel: 2, CartSummary: 2, GiftWrapToggle: 1, WholeStoreBadge: 2 })
    expect(screen.getByText(/合计 1 件/)).toBeInTheDocument()
  })

  it('只改礼品包装：useShallow 的合计、选 items 的购物车都不动，只有它自己和「订阅整个 store」的反例重渲染', () => {
    render(<CartDemo />)
    fireEvent.click(screen.getAllByRole('button', { name: '加入购物车' })[0])
    const before = snapshot(CART_IDS)

    fireEvent.click(screen.getByLabelText(/礼品包装/))

    const after = snapshot(CART_IDS)
    expect(after.GiftWrapToggle - before.GiftWrapToggle).toBe(1)
    expect(after.WholeStoreBadge - before.WholeStoreBadge).toBe(1)
    expect(after.CartPanel).toBe(before.CartPanel)
    expect(after.CartSummary).toBe(before.CartSummary)
    expect(after.ProductList).toBe(before.ProductList)
  })

  it('action 返回原来的 state 对象：set 用 Object.is 判断没变，不通知任何订阅者', () => {
    render(<CartDemo />)
    fireEvent.click(screen.getAllByRole('button', { name: '加入购物车' })[0])
    const listener = vi.fn()
    const unsubscribe = useCartStore.subscribe(listener)
    const stateBefore = useCartStore.getState()
    const before = snapshot(CART_IDS)

    act(() => useCartStore.getState().decrease('p1')) // 数量已经是 1

    expect(useCartStore.getState()).toBe(stateBefore)
    expect(listener).not.toHaveBeenCalled()
    expect(snapshot(CART_IDS)).toEqual(before)
    unsubscribe()
  })

  it('selector 每次返回新对象又不包 useShallow：开发环境先报「should be cached」，随后陷入无限更新', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const useBearStore = create<{ bears: number; fish: number }>()(() => ({ bears: 1, fish: 2 }))
    function Bad() {
      const { bears, fish } = useBearStore((s) => ({ bears: s.bears, fish: s.fish }))
      return <span>{bears + fish}</span>
    }
    expect(() => render(<Bad />)).toThrow(/Maximum update depth exceeded/)
    expect(
      consoleError.mock.calls.some(([msg]) => String(msg).includes('The result of getSnapshot should be cached')),
    ).toBe(true)
  })

  it('useShallow 用的 shallow 只比较一层：第一层的值用 Object.is 比，嵌套对象按引用比', () => {
    expect(shallow({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true)
    expect(shallow([1, 2], [1, 2])).toBe(true)
    const items: number[] = []
    expect(shallow({ items }, { items })).toBe(true)
    expect(shallow({ items: [] }, { items: [] })).toBe(false) // 内容一样、引用不同
  })

  it('set 默认浅合并、actions 保留；set(x, true) 整体替换会把 actions 一起换掉', () => {
    const store = create<{ count: number; note: string; inc: () => void }>()((set) => ({
      count: 0,
      note: '保留',
      inc: () => set((s) => ({ count: s.count + 1 })),
    }))
    store.getState().inc()
    expect(store.getState()).toMatchObject({ count: 1, note: '保留' })
    expect(typeof store.getState().inc).toBe('function')

    // 类型层面 replace: true 要求传完整 state（v5 更严格），这里故意只传一部分来演示后果
    store.setState({ count: 0 } as never, true)
    expect(store.getState()).toEqual({ count: 0 })
    expect(store.getState().inc).toBeUndefined()
  })

  it('store 是模块级单例：组件卸载再挂载，购物车还在；Context + useReducer 的 state 跟着组件一起没了', () => {
    const first = render(
      <>
        <CartDemo />
        <ContextReducerCart />
      </>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: '加入购物车' })[0])
    fireEvent.click(screen.getByRole('button', { name: '加入「机械键盘」' }))
    expect(screen.getByText('件数（memo 包着）：1')).toBeInTheDocument()
    first.unmount()

    render(
      <>
        <CartDemo />
        <ContextReducerCart />
      </>,
    )
    expect(screen.getByText(/合计 1 件/)).toBeInTheDocument()
    expect(screen.getByText('件数（memo 包着）：0')).toBeInTheDocument()
  })

  it('服务端渲染：useStore 用 getInitialState() 当服务端快照，拿不到客户端内存里的购物车', () => {
    useCartStore.getState().addToCart(DEMO_PRODUCTS[0])
    function Probe() {
      const count = useCartStore(selectTotalCount)
      return <span>{count} 件</span>
    }
    expect(renderToString(<Probe />)).toContain('0<!-- --> 件')
    render(<Probe />)
    expect(screen.getByText('1 件')).toBeInTheDocument()
  })
})

describe('区块二：组件外读写、subscribe、异步 action、persist', () => {
  it('getState() 在事件处理函数里读最新值；非 React 代码调用 action 清空购物车，订阅的组件跟着更新', () => {
    render(
      <>
        <CartDemo />
        <StoreApiDemo delayMs={20} />
      </>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: '加入购物车' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: '加入购物车' })[1])
    fireEvent.click(screen.getByRole('button', { name: 'getState() 读一次（不订阅）' }))
    expect(screen.getByText(/getState\(\)：2 件/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /模拟「退出登录」/ }))
    expect(screen.getByText(/合计 0 件/)).toBeInTheDocument()
    expect(screen.getByLabelText('subscribe 日志')).toHaveTextContent('items：2 件 → 0 件')
  })

  it('subscribe 放在 Effect 里并用返回值当 cleanup：StrictMode 下多订一次又退掉，卸载后一个不剩', () => {
    const original = useCartStore.subscribe
    let active = 0
    vi.spyOn(useCartStore, 'subscribe').mockImplementation((listener) => {
      active += 1
      const unsubscribe = original(listener)
      return () => {
        active -= 1
        unsubscribe()
      }
    })
    const view = render(
      <StrictMode>
        <StoreApiDemo delayMs={20} />
      </StrictMode>,
    )
    expect(active).toBe(1)
    view.unmount()
    expect(active).toBe(0)
  })

  it('异步 action：await 之后再 set；成功后清空购物车并记下订单号', async () => {
    useCartStore.getState().addToCart(DEMO_PRODUCTS[0])
    render(<StoreApiDemo delayMs={300} />)

    fireEvent.click(screen.getByRole('button', { name: '结算' }))
    expect(screen.getByRole('status')).toHaveTextContent('结算状态：pending')
    expect(screen.getByRole('button', { name: '结算中…' })).toBeDisabled()

    expect(await screen.findByText(/结算状态：success，订单号 CO-/, {}, { timeout: 2000 })).toBeInTheDocument()
    expect(useCartStore.getState().items).toEqual([])
  })

  it('同一轮里调用两次：第二次 get() 已经读到 pending，直接返回 —— 服务端只收到一次请求', async () => {
    useCartStore.getState().addToCart(DEMO_PRODUCTS[0])
    render(<StoreApiDemo delayMs={20} />)
    const before = getCheckoutRequestCount()

    fireEvent.click(screen.getByRole('button', { name: '同一轮里调用两次 checkoutCart()' }))

    await screen.findByText(/结算状态：success/)
    expect(getCheckoutRequestCount() - before).toBe(1)
    const log = screen.getByLabelText('subscribe 日志').textContent ?? ''
    expect(log.match(/checkout：idle → pending/g)).toHaveLength(1)
  })

  it('结算失败：错误变成 state 显示出来，购物车保留', async () => {
    useCartStore.getState().addToCart(DEMO_PRODUCTS[0])
    render(<StoreApiDemo delayMs={20} />)
    fireEvent.click(screen.getByLabelText('模拟结算失败'))
    fireEvent.click(screen.getByRole('button', { name: '结算' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('网络错误：结算失败，请重试')
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('persist 只存白名单字段：localStorage 里只有 items、giftWrap 和版本号，没有结算状态和 actions', () => {
    const { addToCart, setGiftWrap } = useCartStore.getState()
    addToCart(DEMO_PRODUCTS[0])
    setGiftWrap(true)

    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null') as {
      state: Record<string, unknown>
      version: number
    }
    expect(stored.version).toBe(CART_STORAGE_VERSION)
    expect(Object.keys(stored.state).sort()).toEqual(['giftWrap', 'items'])
    expect(stored.state.items).toEqual([{ id: 'p1', name: '机械键盘', price: 399, quantity: 1 }])
  })

  it('版本号不一致时调用 migrate：写入 v0 旧数据再 rehydrate，qty 被转换成 quantity 并写回 v1', async () => {
    render(
      <>
        <CartDemo />
        <StoreApiDemo delayMs={20} />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: /写入 v0 旧数据/ }))

    await waitFor(() =>
      expect(useCartStore.getState().items).toEqual([{ id: 'p2', name: '无线鼠标', price: 149, quantity: 3 }]),
    )
    expect(screen.getByText(/合计 3 件/)).toBeInTheDocument()
    expect(screen.getByLabelText('localStorage 内容')).toHaveTextContent('"version":1')
    expect(screen.getByLabelText('localStorage 内容')).toHaveTextContent('"quantity":3')
  })

  it('版本号不一致又没写 migrate：console.error 后丢弃旧数据；getInitialState() 返回水合前的初始值', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('probe', JSON.stringify({ state: { n: 5 }, version: 1 }))

    const noMigrate = create<{ n: number }>()(persist(() => ({ n: 0 }), { name: 'probe', version: 2 }))
    expect(noMigrate.getState().n).toBe(0)
    expect(consoleError).toHaveBeenCalledWith(
      "State loaded from storage couldn't be migrated since no migrate function was provided",
    )

    localStorage.setItem('probe', JSON.stringify({ state: { n: 5 }, version: 0 }))
    const sameVersion = create<{ n: number }>()(persist(() => ({ n: 0 }), { name: 'probe' }))
    expect(sameVersion.getState().n).toBe(5) // localStorage 是同步存储：create 返回时已经水合完
    expect(sameVersion.persist.hasHydrated()).toBe(true)
    expect(sameVersion.getInitialState().n).toBe(0)
  })
})

describe('区块三：Context + useReducer（并排）', () => {
  it('没有 selector：只改礼品包装，memo 包着的件数徽标也重渲染；只读 dispatch 的按钮不动', () => {
    render(<ContextReducerCart />)
    fireEvent.click(screen.getByRole('button', { name: '加入「机械键盘」' }))
    const ids = ['CtxProductList', 'CtxCountBadge', 'CtxGiftWrap', 'CtxCartList']
    const before = snapshot(ids)
    expect(before.CtxProductList).toBe(1) // 加入商品时也没动

    fireEvent.click(screen.getByLabelText('礼品包装'))

    const after = snapshot(ids)
    expect(after.CtxCountBadge - before.CtxCountBadge).toBe(1)
    expect(after.CtxCartList - before.CtxCartList).toBe(1)
    expect(after.CtxProductList).toBe(before.CtxProductList)
    expect(screen.getByText('件数（memo 包着）：1')).toBeInTheDocument()
  })
})

describe('区块四：createStore + Context，每个实例一份 store', () => {
  it('两个清单各有一份 store：B 的初始值来自 props，往 A 里加东西不影响 B', () => {
    render(<ScopedStoreDemo />)
    const listA = screen.getByLabelText('清单 A（初始为空）')
    const listB = screen.getByLabelText('清单 B：稍后再买（props 初始化）')
    expect(within(listB).getByText('1 件')).toBeInTheDocument()

    fireEvent.click(within(listA).getByRole('button', { name: '+ 4K 显示器' }))
    fireEvent.click(within(listA).getByRole('button', { name: '+ 4K 显示器' }))

    expect(within(listA).getByText('2 件')).toBeInTheDocument()
    expect(within(listB).getByText('1 件')).toBeInTheDocument()
    // 和模块级的 useCartStore 也无关
    expect(useCartStore.getState().items).toEqual([])
  })
})

describe('入口', () => {
  it('五个区块都渲染出来', () => {
    render(<Example />)
    for (const title of ['区块一', '区块二', '区块三', '区块四', '区块五']) {
      expect(screen.getByRole('heading', { name: new RegExp(title) })).toBeInTheDocument()
    }
  })
})
