/**
 * 18 题 Vue 侧的结论测试，和 react/Example.test.tsx 的结论对照着看。
 * Vue 官方测试文档推荐用 @vue/test-utils 挂载组件；接口用 vi.mock 换成零延迟版本（测试写法在 34 题，待新增）。
 */
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createTopic18Router } from './router'
import { login } from './auth'
import Example from './Example.vue'

vi.mock('@/shared/mockApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/mockApi')>()
  return {
    ...actual,
    fetchOrders: (...[params, options]: Parameters<typeof actual.fetchOrders>) =>
      actual.fetchOrders(params, { ...options, delayMs: 0 }),
    fetchOrder: (...[id, options]: Parameters<typeof actual.fetchOrder>) =>
      actual.fetchOrder(id, { ...options, delayMs: 0 }),
  }
})

/** 先导航到初始地址再挂载：这样初始地址就是「应用里的第一条记录」，和用户直接打开链接一样 */
async function setup(path: string, { loggedIn = false } = {}) {
  const router = createTopic18Router({ authDelayMs: 0 })
  if (loggedIn) await login()
  await router.push(path)
  await router.isReady()
  const wrapper = mount(Example, { global: { plugins: [router] } })
  await flushPromises()
  return { router, wrapper }
}

function buttonByText(wrapper: VueWrapper, text: string) {
  const button = wrapper.findAll('button').find((b) => b.text() === text)
  if (!button) throw new Error(`找不到按钮：${text}`)
  return button
}

const draftInput = (wrapper: VueWrapper) => wrapper.get<HTMLInputElement>('input[placeholder^="先输入"]')

describe('Vue 侧：beforeEach 守卫与登录回跳', () => {
  it('返回值写法：未登录访问 /settings/profile 被重定向到 /login，被拦的地址不进历史记录', async () => {
    const { router } = await setup('/orders')

    await router.push('/settings/profile')

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirectTo).toBe('/settings/profile')
    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/orders'))
  })

  it('登录后 router.replace 回到被拦的页面', async () => {
    const { router, wrapper } = await setup('/login?redirectTo=/settings/notifications')

    await buttonByText(wrapper, '模拟登录').trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/settings/notifications'))
  })

  it('外部回跳地址被 safeRedirect 拦下，登录后回到 /orders', async () => {
    const { router, wrapper } = await setup('/login?redirectTo=https://evil.example')

    await buttonByText(wrapper, '模拟登录').trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/orders'))
  })
})

describe('Vue 侧：组件复用、query 合并、返回兜底、离开确认', () => {
  it('/orders/o1 → /orders/o2：同一个 RouterView 复用组件，草稿保留；加 :key 后切换订单会重置', async () => {
    const { router, wrapper } = await setup('/orders/o1')
    await vi.waitFor(() => expect(wrapper.text()).toContain('给 SO-2026-0001 写备注'))
    await draftInput(wrapper).setValue('草稿A')

    await router.push('/orders/o2')
    await vi.waitFor(() => expect(wrapper.text()).toContain('给 SO-2026-0002 写备注'))
    expect(draftInput(wrapper).element.value).toBe('草稿A')

    await wrapper.get('input[type="checkbox"]').setValue(true)
    await draftInput(wrapper).setValue('草稿B')
    await router.push('/orders/o3')
    await vi.waitFor(() => expect(wrapper.text()).toContain('给 SO-2026-0003 写备注'))
    expect(draftInput(wrapper).element.value).toBe('')
  })

  it('router.push({ query }) 先合并旧 query：换状态时清掉 page、保留其它参数', async () => {
    const { router, wrapper } = await setup('/orders?page=2&keep=1')
    await vi.waitFor(() => expect(wrapper.text()).toContain('第 2 / 3 页'))

    await buttonByText(wrapper, '已支付').trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/orders?keep=1&status=paid'))
  })

  it('直接打开详情页时「返回」去列表页', async () => {
    const { router, wrapper } = await setup('/orders/o3')
    await vi.waitFor(() => expect(wrapper.text()).toContain('SO-2026-0003'))

    await buttonByText(wrapper, '← 返回').trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/orders'))
  })

  it('onBeforeRouteLeave：有未保存的修改时，confirm 选「取消」就留在原页', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { router, wrapper } = await setup('/settings/notifications', { loggedIn: true })
    await vi.waitFor(() => expect(wrapper.text()).toContain('通知设置'))
    await wrapper.get('input[type="checkbox"]').setValue(false)

    await router.push('/orders')
    expect(confirmSpy).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/settings/notifications')

    confirmSpy.mockReturnValue(true)
    await router.push('/orders')
    expect(router.currentRoute.value.path).toBe('/orders')
    confirmSpy.mockRestore()
  })
})
