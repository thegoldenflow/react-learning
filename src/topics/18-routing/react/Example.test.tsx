/**
 * 18 题的结论测试：文件头里讲的关键结论，每条都在这里有一个可以运行的证明。
 * 每个用例新建 router（零延迟的模拟服务），互不影响。
 * 测试工具与写法本身在 34 题（待新增）详细讲。
 *
 * 两个约定：
 * - 直接调用 router.navigate() 会触发 React 更新，用 act 包起来（React 19 起 act 从 react 导入，
 *   不再从 react-dom/test-utils 导入）；
 * - userEvent.setup({ delay: null })：不在每次操作后额外等一个定时器，
 *   让路由的异步更新落在后面的 findBy / waitFor 里，而不是游离在 act 之外。
 */
import { act } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider } from 'react-router/dom'
import { createDataRouter, type DataRouterDeps } from './dataRouter'
import { createDemoAuth } from './demoAuth'
import { createDemoLog } from './demoLog'
import { DeclarativeDemo } from './DeclarativeDemo'
import Example from './Example'

async function setup(initialEntries: string[], { loggedIn = false } = {}) {
  const deps: DataRouterDeps = {
    auth: createDemoAuth({ delayMs: 0 }),
    log: createDemoLog(100),
    delayMs: 0,
  }
  if (loggedIn) await deps.auth.login()
  const router = createDataRouter(deps, { initialEntries })
  const user = userEvent.setup({ delay: null })
  render(<RouterProvider router={router} />)
  const logHas = (text: string) => deps.log.getSnapshot().some((line) => line.includes(text))
  return { router, deps, user, logHas }
}

describe('主线 Data 模式：守卫', () => {
  it('loader 守卫：未登录被 redirect 到登录页，但子路由的 loader 已经执行（父子 loader 并行）', async () => {
    const { router, logHas } = await setup(['/orders'])
    await screen.findByRole('table')

    await act(() => router.navigate('/settings/profile'))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?redirectTo=%2Fsettings%2Fprofile')
    expect(logHas('守卫 loader：未登录')).toBe(true)
    expect(logHas('个人资料 loader：已发出请求')).toBe(true)
  })

  it('loader 守卫：子路由 loader 也 redirect 时，最深一层的 redirect 先生效，守卫在下一次导航才拦下', async () => {
    const { router, logHas } = await setup(['/orders'])
    await screen.findByRole('table')

    // /settings 的 index 路由会 redirect 到 /settings/profile
    await act(() => router.navigate('/settings'))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?redirectTo=%2Fsettings%2Fprofile')
    expect(logHas('/settings · 守卫 loader：未登录')).toBe(true)
    expect(logHas('/settings/profile · 守卫 loader：未登录')).toBe(true)
  })

  it('middleware 守卫：父 middleware 先执行；未登录时在 next() 之前 redirect，下游 loader 不执行', async () => {
    const { router, deps, logHas } = await setup(['/orders'])
    await screen.findByRole('table')
    deps.log.clear()

    await act(() => router.navigate('/reports'))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    const lines = deps.log.getSnapshot()
    const rootIndex = lines.findIndex((line) => line.startsWith('/reports · 根 middleware：开始'))
    const guardIndex = lines.findIndex((line) => line.includes('守卫 middleware：未登录'))
    expect(rootIndex).toBeGreaterThanOrEqual(0)
    expect(guardIndex).toBeGreaterThan(rootIndex)
    expect(logHas('报表 loader')).toBe(false)
  })

  it('middleware 把用户写进路由上下文，下游 loader 用 context.get 读到（路由级 lazy 加载的页面）', async () => {
    const { logHas } = await setup(['/reports'], { loggedIn: true })

    expect(await screen.findByText(/查看人：张伟/)).toBeInTheDocument()
    expect(logHas('middleware 写入的用户：张伟')).toBe(true)
  })

  it('客户端 middleware 每次导航都执行，即使目标路由没有 loader', async () => {
    const { router, deps } = await setup(['/settings/profile'], { loggedIn: true })
    await screen.findByText('邮箱：zhangwei@example.com')
    deps.log.clear()

    // 通知设置页没有 loader
    await act(() => router.navigate('/settings/notifications'))

    await screen.findByRole('heading', { name: '通知设置' })
    expect(deps.log.getSnapshot()).toContain('/settings/notifications · 根 middleware：开始')
  })
})

describe('主线 Data 模式：登录 action 与回跳', () => {
  it('被拦下的地址不进历史栈；登录后登录页被替换，按后退回到拦截前的页面', async () => {
    const { router, user } = await setup(['/orders'])
    await screen.findByRole('table')
    await act(() => router.navigate('/settings/notifications'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))

    await user.click(screen.getByRole('button', { name: '模拟登录' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/settings/notifications'))

    await act(() => router.navigate(-1))
    await waitFor(() => expect(router.state.location.pathname).toBe('/orders'))
  })

  it('外部回跳地址被 safeRedirect 拦下，登录后回到订单列表', async () => {
    const { router, user } = await setup(['/login?redirectTo=https://evil.example'])

    expect(await screen.findByText(/没有通过 safeRedirect 校验/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '模拟登录' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/orders'))
  })

  it('action 返回 401：useActionData 显示错误，页面停在登录页', async () => {
    const { router, user } = await setup(['/login'])

    await user.click(await screen.findByRole('checkbox', { name: /模拟账号或密码错误/ }))
    await user.click(screen.getByRole('button', { name: '模拟登录' }))

    expect(await screen.findByText('账号或密码错误（模拟）')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})

describe('两种模式通用的写法（在主线里验证）', () => {
  it('/orders/o1 → /orders/o2：同一位置的组件被复用，state 保留；加 key 后切换订单会重置', async () => {
    const { user } = await setup(['/orders/o1'])
    await user.type(await screen.findByRole('textbox'), '草稿A')

    await user.click(screen.getByRole('link', { name: '下一个订单 →' }))
    await screen.findByText(/给 SO-2026-0002 写备注/)
    expect(screen.getByRole('textbox')).toHaveValue('草稿A')

    await user.click(screen.getByRole('checkbox', { name: /给备注组件加 key/ }))
    await user.type(screen.getByRole('textbox'), '草稿B')
    await user.click(screen.getByRole('link', { name: '下一个订单 →' }))
    await screen.findByText(/给 SO-2026-0003 写备注/)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('setSearchParams 函数形式：换筛选条件时保留其它参数、清掉 page；翻页时保留筛选条件', async () => {
    const { router, user } = await setup(['/orders?page=2&keep=1'])
    await screen.findByText(/第 2 \/ 3 页/)

    await user.click(screen.getByRole('button', { name: '已支付' }))
    await waitFor(() => expect(router.state.location.search).toBe('?keep=1&status=paid'))

    await user.click(await screen.findByRole('button', { name: '下一页' }))
    await waitFor(() => expect(router.state.location.search).toBe('?keep=1&status=paid&page=2'))
  })

  it('直接打开详情页（location.key === "default"）时「返回」跳到列表页', async () => {
    const { router, user } = await setup(['/orders/o3'])

    await user.click(await screen.findByRole('button', { name: '← 返回' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/orders'))
  })

  it('有上一页时「返回」等于 navigate(-1)，带着原来的 query 回去', async () => {
    const { router, user } = await setup(['/orders?status=paid'])

    await user.click(await screen.findByRole('link', { name: 'SO-2026-0001' }))
    await user.click(await screen.findByRole('button', { name: '← 返回' }))

    await waitFor(() => expect(router.state.location.search).toBe('?status=paid'))
  })

  it('NavLink 默认加 active 类和 aria-current="page"，按 URL 前缀匹配', async () => {
    await setup(['/orders/o1'])

    const ordersLink = await screen.findByRole('link', { name: '订单' })
    expect(ordersLink).toHaveClass('active')
    expect(ordersLink).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: '设置（loader 守卫）' })).not.toHaveClass('active')
  })
})

describe('主线 Data 模式：错误与离开确认', () => {
  it('loader 抛出 404：详情页自己的 errorElement 显示，上层导航还在', async () => {
    await setup(['/orders/o999'])

    expect(await screen.findByRole('heading', { name: '404：订单不存在' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '订单' })).toBeInTheDocument()
  })

  it('useBlocker：有未保存的修改时拦住应用内导航，「留下」取消，「离开」继续', async () => {
    const { router, user } = await setup(['/settings/notifications'], { loggedIn: true })
    await user.click(await screen.findByRole('checkbox', { name: /接收邮件通知/ }))

    await user.click(screen.getByRole('link', { name: '订单' }))
    const dialog = await screen.findByRole('alertdialog', { name: '离开确认' })
    await user.click(within(dialog).getByRole('button', { name: '留下' }))
    expect(router.state.location.pathname).toBe('/settings/notifications')

    await user.click(screen.getByRole('link', { name: '订单' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: '离开' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/orders'))
  })
})

describe('并排：声明式模式的 RequireAuth 三态', () => {
  it('checking → guest 去登录页 → 登录后回跳 → 退出登录后下一次渲染就被送回登录页', async () => {
    const user = userEvent.setup({ delay: null })
    render(<DeclarativeDemo authDelayMs={0} />)

    expect(screen.getByText(/正在确认登录状态/)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '登录（声明式）' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '模拟登录' }))
    expect(await screen.findByText('个人资料：zhangwei@example.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '退出登录' }))
    expect(await screen.findByRole('heading', { name: '登录（声明式）' })).toBeInTheDocument()
  })

  it('模拟刷新：会话还在，也要先经过 checking 才放行', async () => {
    const user = userEvent.setup({ delay: null })
    // 检查登录态留 50ms，点完「模拟刷新」之后才来得及看到 checking
    render(<DeclarativeDemo authDelayMs={50} />)
    await user.click(await screen.findByRole('button', { name: '模拟登录' }))
    await screen.findByText('个人资料：zhangwei@example.com')

    await user.click(screen.getByRole('button', { name: '模拟刷新页面' }))

    expect(screen.getByText(/正在确认登录状态/)).toBeInTheDocument()
    expect(await screen.findByText('个人资料：zhangwei@example.com')).toBeInTheDocument()
  })
})

describe('Example 入口', () => {
  it('默认显示主线 Data 模式，可以切到声明式并排', async () => {
    const user = userEvent.setup({ delay: null })
    render(<Example />)

    expect(screen.getByRole('tab', { name: '主线：Data 模式' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: '并排：声明式模式' }))
    expect(await screen.findByRole('button', { name: '模拟刷新页面' })).toBeInTheDocument()
  })
})
