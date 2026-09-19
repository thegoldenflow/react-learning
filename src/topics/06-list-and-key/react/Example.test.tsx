/**
 * 06 题的结论测试：文件头里标了「测试覆盖」的结论都在这里有可运行的证明（react / react-dom 19.2.8，开发构建）。
 * 类型层的断言（expectTypeOf、@ts-expect-error）由 npm run typecheck（vue-tsc）检查，vitest run 本身不检查类型。
 */
import { createRef, Fragment, useEffect, useState, type Key } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectTypeOf } from 'vitest'
import Example from './Example'
import { createLocalOrder } from './demoData'
import { KeyBugDemo } from './KeyBugDemo'
import { KeyResetDemo } from './KeyResetDemo'
import { ListBasicsDemo } from './ListBasicsDemo'
import { PRODUCTS } from '@/shared/products'

let consoleError: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** React 的开发期报错是「格式串 + 参数」，拼起来再比对 */
const errorTexts = (): string[] =>
  consoleError.mock.calls.map((args: unknown[]) => {
    const [format, ...rest] = args.map(String)
    let i = 0
    return format.replace(/%s/g, () => rest[i++] ?? '')
  })

const user = () => userEvent.setup({ delay: null })

const productItems = () =>
  within(screen.getByRole('list', { name: '商品列表' }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent)

describe('区块一：列表就是 filter / sort / map', () => {
  it('先过滤再排序再 map；排序前拷贝，没选筛选条件时排序也没改掉模块常量 PRODUCTS 的顺序', async () => {
    const u = user()
    render(<ListBasicsDemo />)
    const before = PRODUCTS.map((p) => p.id)
    // 「全部」时 filtered 就是 PRODUCTS 本身：不拷贝直接 sort 会把它原地改掉（练习 3）
    await u.selectOptions(screen.getByRole('combobox', { name: '排序' }), 'price-asc')
    expect(productItems()[0]).toBe('无线鼠标 · ￥129')
    expect(PRODUCTS.map((p) => p.id)).toEqual(before)

    await u.selectOptions(screen.getByRole('combobox', { name: '分类' }), '显示器')
    expect(productItems()).toEqual(['便携显示器 · ￥899', '4K 显示器 · ￥1999'])
    expect(PRODUCTS.map((p) => p.id)).toEqual(before)
  })

  it('两个筛选条件都在 filter 里：显示器 + 库存 ≥ 10 件 → 列表为空，显示提示', async () => {
    const u = user()
    render(<ListBasicsDemo />)
    await u.selectOptions(screen.getByRole('combobox', { name: '分类' }), '显示器')
    await u.click(screen.getByRole('checkbox', { name: '只看库存 ≥ 10 件' }))
    expect(productItems()).toEqual([])
    expect(screen.getByText('没有符合条件的商品')).toBeInTheDocument()
  })

  it('一项两行 <tr> 用 <Fragment key>：<tbody> 里的行平铺、每项两行，没有 key 报错', () => {
    render(<ListBasicsDemo />)
    const rows = within(screen.getByRole('table', { name: '库存明细' })).getAllByRole('row')
    expect(rows).toHaveLength(PRODUCTS.length * 2)
    expect(rows.slice(0, 2).map((tr) => tr.textContent)).toEqual(['机械键盘￥399', '库存 12 件'])
    expect(rows[0].parentElement!.tagName).toBe('TBODY')
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('缺 key、重复 key：开发环境报错原文', () => {
    function Missing() {
      return (
        <ul>
          {['a', 'b'].map((x) => (
            // 故意不写 key（本仓库没装 eslint-plugin-react，lint 不会拦这一行）
            <li>{x}</li>
          ))}
        </ul>
      )
    }
    render(<Missing />)
    function Duplicated() {
      return (
        <ul>
          {['a', 'a'].map((x) => (
            <Fragment key={x}>
              <li>{x}</li>
            </Fragment>
          ))}
        </ul>
      )
    }
    render(<Duplicated />)
    expect(errorTexts()).toEqual([
      'Each child in a list should have a unique "key" prop.\n\nCheck the render method of `Missing`. See https://react.dev/link/warning-keys for more information.',
      'Encountered two children with the same key, `a`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.',
    ])
  })

  it('块体箭头函数忘了写 return：TypeScript 报错（void[] 不能当 ReactNode），运行时什么都不渲染、也不报错', () => {
    const items = ['a', 'b']
    function NoReturn() {
      return (
        <ul aria-label="忘了 return">
          {/* @ts-expect-error -- 块体里没有 return，map 得到 void[]，tsc 报 TS2322「Type 'void[]' is not assignable to type 'ReactNode'」 */}
          {items.map((x) => {
            // 本项目的 lint 不拦这一行：@typescript-eslint/no-unused-expressions 沿用核心规则的默认值，enforceForJSX 是 false（核心规则 array-callback-return 能拦，本项目没开）
            ;<li key={x}>{x}</li>
          })}
        </ul>
      )
    }
    render(<NoReturn />)
    expect(screen.getByRole('list', { name: '忘了 return' })).toBeEmptyDOMElement()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('key 的类型：string | number | bigint（@types/react 19.2.18 的 Key）', () => {
    expectTypeOf<Key>().toEqualTypeOf<string | number | bigint>()
  })
})

describe('区块二：key 是身份', () => {
  /** 在前两行的备注框里各打一段字，然后执行某个操作，返回每一行「订单号 → 备注」 */
  async function run(keyMode: 'id' | 'index' | 'random', action: string) {
    const u = user()
    render(<KeyBugDemo />)
    await u.selectOptions(screen.getByRole('combobox', { name: 'key 的取法' }), keyMode)
    await u.type(screen.getByRole('textbox', { name: 'SO-1001 的备注' }), '加急')
    await u.type(screen.getByRole('textbox', { name: 'SO-1002 的备注' }), '送礼')
    await u.click(screen.getByRole('button', { name: new RegExp(`^${action}`) }))
    return Object.fromEntries(
      screen.getAllByRole('textbox').map((input) => [input.getAttribute('aria-label')!.replace(' 的备注', ''), (input as HTMLInputElement).value]),
    )
  }

  it('key 用 id：开头插入一行，备注还在原来那一行', async () => {
    const notes = await run('id', '开头插入一行')
    expect(notes).toMatchObject({ 'SO-1001': '加急', 'SO-1002': '送礼' })
    expect(Object.values(notes)[0]).toBe('')
  })

  it('key 用 id：删除第一行，其余行的备注都留在自己那一行', async () => {
    const notes = await run('id', '删除第一行')
    expect(notes).not.toHaveProperty('SO-1001')
    expect(notes['SO-1002']).toBe('送礼')
  })

  it('key 用 id：新行的 id 在创建数据时生成，之后重渲染 key 不变，新行里的输入留得住', async () => {
    const u = user()
    render(<KeyBugDemo />)
    await u.selectOptions(screen.getByRole('combobox', { name: 'key 的取法' }), 'id')
    await u.click(screen.getByRole('button', { name: '开头插入一行' }))
    const fresh = screen.getAllByRole('textbox')[0]
    expect(fresh).toHaveAccessibleName(/^NEW-\d+ 的备注$/)
    await u.type(fresh, '新客户要发票')
    await u.click(screen.getByRole('button', { name: /^让列表重渲染/ }))
    expect(screen.getAllByRole('textbox')[0]).toBe(fresh)
    expect(fresh).toHaveValue('新客户要发票')
  })

  it('key 用 index：开头插入一行，备注跑到了新插入的行上（错位）', async () => {
    const notes = await run('index', '开头插入一行')
    const values = Object.values(notes)
    expect(values.slice(0, 3)).toEqual(['加急', '送礼', ''])
    expect(notes['SO-1001']).toBe('送礼')
  })

  it('key 用 index：删除第一行，第一行的备注留给了下一个订单', async () => {
    const notes = await run('index', '删除第一行')
    expect(notes['SO-1002']).toBe('加急')
  })

  it('key 用 index：只在末尾追加时，已有下标不变，不会错位', async () => {
    const notes = await run('index', '末尾追加一行')
    expect(notes).toMatchObject({ 'SO-1001': '加急', 'SO-1002': '送礼' })
  })

  it('key 用 Math.random()：一次普通的重渲染就把所有行重建，输入全丢', async () => {
    const notes = await run('random', '让列表重渲染')
    expect(notes).toMatchObject({ 'SO-1001': '', 'SO-1002': '' })
  })
})

describe('demoData：本地新建的数据在创建时生成 id', () => {
  it('有 crypto.randomUUID() 时用它（jsdom 里有），id 带 local- 前缀', () => {
    expect(createLocalOrder('甲').id).toMatch(/^local-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('没有 crypto.randomUUID()（http + 局域网 IP 不是安全上下文）时退回自增计数器', () => {
    vi.stubGlobal('crypto', {})
    const a = createLocalOrder('甲')
    const b = createLocalOrder('乙')
    expect(a.id).toMatch(/^local-\d+$/)
    expect(Number(b.id.slice('local-'.length))).toBe(Number(a.id.slice('local-'.length)) + 1)
  })
})

describe('区块三：换 key = 换一个实例', () => {
  it('不换 key：实例被复用，草稿残留；换 key：新实例，草稿重新初始化', async () => {
    const u = user()
    render(<KeyResetDemo />)
    for (const testId of ['without-key', 'with-key']) {
      const box = within(screen.getByTestId(testId)).getByRole('textbox', { name: '草稿备注' })
      await u.type(box, '加急')
    }
    await u.click(screen.getByRole('button', { name: 'SO-1002' }))
    const without = within(screen.getByTestId('without-key'))
    const withKey = within(screen.getByTestId('with-key'))
    expect(without.getByRole('textbox', { name: '草稿备注' })).toHaveValue('张伟的备注：加急')
    expect(without.getByTestId('instance-status')).toHaveTextContent('被复用的实例：草稿还是 SO-1001 的')
    expect(withKey.getByRole('textbox', { name: '草稿备注' })).toHaveValue('李娜的备注：')
    expect(withKey.getByTestId('instance-status')).toHaveTextContent('新实例：草稿按新订单重新初始化')
  })

  it('❌ 在 Effect 里监听 prop 再 setState 重置：新 prop 先配着旧草稿渲染一次、再渲染第二次；换 key 只渲染一次，直接是新草稿', () => {
    const renders: string[] = []
    function Editor({ orderNo }: { orderNo: string }) {
      const [draft, setDraft] = useState(`${orderNo} 的草稿`)
      useEffect(() => {
        // 教学反例：官方「🔴 Avoid: Resetting state on prop change in an Effect」。写在模块顶层的组件里，lint 的 react-hooks/set-state-in-effect 会报
        // 「Calling setState synchronously within an effect can trigger cascading renders」（实测）；定义在测试回调里的组件 lint 不分析，所以这里不用 disable
        setDraft(`${orderNo} 的草稿`)
      }, [orderNo])
      renders.push(`${orderNo}|${draft}`)
      return <p>{draft}</p>
    }
    const { rerender } = render(<Editor orderNo="SO-1001" />)
    renders.length = 0
    rerender(<Editor orderNo="SO-1002" />)
    expect(renders).toEqual(['SO-1002|SO-1001 的草稿', 'SO-1002|SO-1002 的草稿'])

    // ✅ 换 key：Editor 里不写 Effect，靠 key 换实例
    function KeyedEditor({ orderNo }: { orderNo: string }) {
      const [draft] = useState(`${orderNo} 的草稿`)
      renders.push(`${orderNo}|${draft}`)
      return <p>{draft}</p>
    }
    const keyed = render(<KeyedEditor key="SO-1001" orderNo="SO-1001" />)
    renders.length = 0
    keyed.rerender(<KeyedEditor key="SO-1002" orderNo="SO-1002" />)
    expect(renders).toEqual(['SO-1002|SO-1002 的草稿'])
  })
})

describe('九：19.2.8 的 <Fragment> 还不接受 ref（19.3 起才有 Fragment Refs）', () => {
  it('传 ref：TypeScript 报错，运行时开发环境报 Invalid prop，ref 一直是 null', () => {
    const ref = createRef<unknown>()
    // @ts-expect-error -- @types/react 19.2.18 的 FragmentProps 没有 ref
    render(<Fragment ref={ref}><p>内容</p></Fragment>)
    expect(errorTexts()).toEqual(['Invalid prop `ref` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.'])
    expect(ref.current).toBeNull()
  })
})

it('整页渲染：三个区块都在，没有开发期报错', () => {
  render(<Example />)
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent!.slice(0, 3))).toEqual(['区块一', '区块二', '区块三'])
  expect(consoleError).not.toHaveBeenCalled()
})
