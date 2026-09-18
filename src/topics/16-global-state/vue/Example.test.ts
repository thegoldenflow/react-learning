/**
 * 16 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看。
 * 每个测试新建一个 pinia 并装上 persistPlugin（和页面上一样：壳应用每次挂载都新建 pinia）；localStorage 每次清空。
 */
/* eslint-disable vue/one-component-per-file -- 测试里用几个很小的探针组件，拆成单独文件反而难读 */
import { computed, createApp, defineComponent, h, nextTick } from 'vue'
import { createPinia, defineStore, setActivePinia, type Pinia } from 'pinia'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import CartDemo from './CartDemo.vue'
import { CART_STORAGE_KEY, getCheckoutRequestCount, useCartStore } from './cartStore'
import Example from './Example.vue'
import { persistPlugin } from './persistPlugin'
import { DEMO_PRODUCTS } from './products'
import { reactiveCart } from './reactiveCart'
import ReactiveStoreDemo from './ReactiveStoreDemo.vue'
import StoreApiDemo from './StoreApiDemo.vue'

enableAutoUnmount(afterEach)

/** 和页面一样：新建 pinia、装插件、装到一个 app 上（插件要等 pinia 装到 app 上才生效） */
function freshPinia(): Pinia {
  const pinia = createPinia()
  pinia.use(persistPlugin)
  createApp({}).use(pinia)
  setActivePinia(pinia)
  return pinia
}

let pinia: Pinia

beforeEach(() => {
  localStorage.clear()
  reactiveCart.reset()
  pinia = freshPinia()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const renders = (wrapper: ReturnType<typeof mount>, id: string) =>
  Number(wrapper.get(`[data-testid="renders-${id}"]`).text().match(/(\d+)$/)?.[1])

const snapshot = (wrapper: ReturnType<typeof mount>, ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, renders(wrapper, id)]))

const CART_IDS = ['ProductList', 'CartPanel', 'CartSummary', 'GiftWrapToggle', 'WholeStoreBadge']

describe('Vue 区块一：读了什么就依赖什么', () => {
  it('加入购物车：只调用 action 的商品列表不重新渲染；读了 items / getter 的组件和读了整个 $state 的徽标各渲染一次', async () => {
    const wrapper = mount(CartDemo, { global: { plugins: [pinia] } })
    await nextTick()
    expect(snapshot(wrapper, CART_IDS)).toEqual({
      ProductList: 1,
      CartPanel: 1,
      CartSummary: 1,
      GiftWrapToggle: 1,
      WholeStoreBadge: 1,
    })

    await wrapper.findAll('button').find((b) => b.text() === '加入购物车')!.trigger('click')
    await nextTick()

    expect(snapshot(wrapper, CART_IDS)).toEqual({
      ProductList: 1,
      CartPanel: 2,
      CartSummary: 2,
      GiftWrapToggle: 1,
      WholeStoreBadge: 2,
    })
    expect(wrapper.text()).toContain('合计 1 件')
  })

  it('只改礼品包装：合计（getter）和购物车都不动，只有它自己和读了整个 $state 的徽标重新渲染', async () => {
    const wrapper = mount(CartDemo, { global: { plugins: [pinia] } })
    await wrapper.findAll('button').find((b) => b.text() === '加入购物车')!.trigger('click')
    await nextTick()
    const before = snapshot(wrapper, CART_IDS)

    await wrapper.get('input[type="checkbox"]').setValue(true)
    await nextTick()

    const after = snapshot(wrapper, CART_IDS)
    expect(after.GiftWrapToggle - before.GiftWrapToggle).toBe(1)
    expect(after.WholeStoreBadge - before.WholeStoreBadge).toBe(1)
    expect(after.CartPanel).toBe(before.CartPanel)
    expect(after.CartSummary).toBe(before.CartSummary)
    expect(after.ProductList).toBe(before.ProductList)
    expect(useCartStore().giftWrap).toBe(true) // v-model 直接改了 store 的 state
  })

  it('再包一层 computed 只算件数：礼品包装变化时结果没变，组件不重新渲染（Vue 3.4 起 computed 值没变不通知下游）', async () => {
    let renderCalls = 0
    const Probe = defineComponent({
      setup() {
        const cart = useCartStore()
        const all = computed(() => ({ ...cart.$state })) // 依赖整个 state
        const count = computed(() => all.value.items.reduce((sum, it) => sum + it.quantity, 0))
        return () => {
          renderCalls += 1
          return h('span', `${count.value} 件`) // 渲染函数只读 count
        }
      },
    })
    const wrapper = mount(Probe, { global: { plugins: [pinia] } })
    expect(renderCalls).toBe(1)

    useCartStore().setGiftWrap(true)
    await nextTick()
    expect(renderCalls).toBe(1) // all 重算了，count 算出来还是 0，不通知组件

    useCartStore().addToCart(DEMO_PRODUCTS[0])
    await nextTick()
    expect(renderCalls).toBe(2)
    expect(wrapper.text()).toBe('1 件')
  })
})

describe('Vue 区块二：store 实例 API', () => {
  it('storeToRefs 解构的值跟着更新；直接解构 store 拿到的是那一刻的值', async () => {
    const wrapper = mount(StoreApiDemo, { props: { delayMs: 20 }, global: { plugins: [pinia] } })
    useCartStore().addToCart(DEMO_PRODUCTS[0])
    useCartStore().addToCart(DEMO_PRODUCTS[0])
    await nextTick()
    expect(wrapper.text()).toContain('storeToRefs：2 件 · 直接解构（不会更新）：0 件')
  })

  it('setup store 没有自带 $reset：开发环境调用会报错；本题自己写的 $reset 把 state 设回初始值', () => {
    const useNoReset = defineStore('topic16-no-reset', () => ({}))
    expect(() => useNoReset().$reset()).toThrow('is built using the setup syntax and does not implement $reset()')

    const cart = useCartStore()
    cart.addToCart(DEMO_PRODUCTS[0])
    cart.setGiftWrap(true)
    cart.$reset()
    expect(cart.items).toEqual([])
    expect(cart.giftWrap).toBe(false)
  })

  it('$subscribe：$patch 立刻同步回调一次（patch object / patch function）；同一个 tick 里的多次直接修改合并成一次 direct', async () => {
    const cart = useCartStore()
    const types: string[] = []
    cart.$subscribe((mutation) => types.push(mutation.type))

    cart.$patch({ giftWrap: true })
    expect(types).toEqual(['patch object']) // 还没等 tick 就已经回调了

    cart.$patch((state) => {
      state.items.push({ id: 'p1', name: '机械键盘', price: 399, quantity: 1 })
      state.giftWrap = false
    })
    expect(types).toEqual(['patch object', 'patch function'])

    await nextTick()
    cart.addToCart(DEMO_PRODUCTS[1])
    cart.setGiftWrap(true)
    expect(types).toHaveLength(2) // 直接修改走 watch（flush: 'pre'），这时还没回调
    await nextTick()
    expect(types).toEqual(['patch object', 'patch function', 'direct']) // 两次直接修改合并成一次
  })

  it('坑：$patch 之后同一个 tick 里的直接修改，默认 flush 下不会单独回调；flush: sync 每次都回调（persistPlugin 因此用 sync）', async () => {
    const cart = useCartStore()
    const pre: string[] = []
    const sync: string[] = []
    cart.$subscribe((mutation) => pre.push(mutation.type))
    cart.$subscribe((mutation) => sync.push(mutation.type), { flush: 'sync' })

    cart.$patch({ giftWrap: true })
    cart.addToCart(DEMO_PRODUCTS[0]) // 同一个 tick，紧跟在 $patch 后面
    await nextTick()

    expect(pre).toEqual(['patch object']) // 加入购物车这次修改没有回调
    expect(sync[0]).toBe('patch object')
    expect(sync).toContain('direct')
    // 持久化插件用的是 sync：存进去的是最新的购物车
    expect(localStorage.getItem(CART_STORAGE_KEY)).toContain('"quantity":1')
  })

  it('$onAction：每次调用 action 前触发、after 等 Promise 完成；同一轮调两次结算，action 被调用两次，但只发出一次请求', async () => {
    useCartStore().addToCart(DEMO_PRODUCTS[0])
    const wrapper = mount(StoreApiDemo, { props: { delayMs: 20 }, global: { plugins: [pinia] } })
    const before = getCheckoutRequestCount()

    await wrapper.findAll('button').find((b) => b.text() === '同一轮里调用两次 checkoutCart()')!.trigger('click')
    await vi.waitFor(() => expect(wrapper.get('[role="status"]').text()).toContain('success'))

    expect(getCheckoutRequestCount() - before).toBe(1)
    const log = wrapper.get('[aria-label="store 日志"]').text()
    expect(log.match(/checkoutCart 开始/g)).toHaveLength(2)
    expect(log.match(/checkoutCart 完成/g)).toHaveLength(2)
    expect(useCartStore().items).toEqual([])
  })

  it('结算失败：错误变成 state，购物车保留；没有未处理的 Promise 拒绝', async () => {
    useCartStore().addToCart(DEMO_PRODUCTS[0])
    const consoleError = vi.spyOn(console, 'error')
    const warn = vi.spyOn(console, 'warn')
    const wrapper = mount(StoreApiDemo, { props: { delayMs: 20 }, global: { plugins: [pinia] } })

    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.findAll('button').find((b) => b.text() === '结算')!.trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))

    expect(wrapper.get('[role="alert"]').text()).toContain('网络错误：结算失败，请重试')
    expect(useCartStore().items).toHaveLength(1)
    expect(consoleError).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it('组件外调用 useCartStore()：app.use(pinia) 之后在普通函数里也能用', async () => {
    useCartStore().addToCart(DEMO_PRODUCTS[0])
    const wrapper = mount(StoreApiDemo, { props: { delayMs: 20 }, global: { plugins: [pinia] } })
    await wrapper.findAll('button').find((b) => b.text().startsWith('模拟「退出登录」'))!.trigger('click')
    expect(useCartStore().items).toEqual([])
  })
})

describe('Vue：持久化插件与 pinia 实例', () => {
  it('只存白名单字段；新建一个 pinia（相当于离开本题再回来）时从 localStorage 读回来', async () => {
    const cart = useCartStore()
    cart.addToCart(DEMO_PRODUCTS[0])
    cart.setGiftWrap(true)
    await nextTick() // $subscribe 默认在下一个 tick 之前回调

    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null') as {
      state: Record<string, unknown>
      version: number
    }
    expect(stored.version).toBe(1)
    expect(Object.keys(stored.state).sort()).toEqual(['giftWrap', 'items'])

    const next = useCartStore(freshPinia())
    expect(next).not.toBe(cart)
    expect(next.items).toEqual([{ id: 'p1', name: '机械键盘', price: 399, quantity: 1 }])
    expect(next.giftWrap).toBe(true)
    expect(next.checkout).toEqual({ status: 'idle' })
  })

  it('版本号不一致时走 migrate：v0 的 qty 转成 quantity', () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ state: { items: [{ id: 'p2', name: '无线鼠标', price: 149, qty: 3 }] }, version: 0 }),
    )
    const cart = useCartStore(freshPinia())
    expect(cart.items).toEqual([{ id: 'p2', name: '无线鼠标', price: 149, quantity: 3 }])
    expect(cart.totalCount).toBe(3)
  })

  it('state 挂在 pinia 实例上：两个 pinia 各有一份（对照 React 区块四），没装插件的 pinia 读不到持久化数据', () => {
    const a = useCartStore(pinia)
    a.addToCart(DEMO_PRODUCTS[0])
    const plain = createPinia()
    createApp({}).use(plain)
    const b = useCartStore(plain)
    expect(a.totalCount).toBe(1)
    expect(b.totalCount).toBe(0)
  })
})

describe('Vue 区块三：模块级 reactive', () => {
  it('只改礼品包装：件数徽标没读 giftWrap，不重新渲染；卸载再挂载后内容还在（模块级单例）', async () => {
    const wrapper = mount(ReactiveStoreDemo)
    await wrapper.findAll('button').find((b) => b.text() === '加入「机械键盘」')!.trigger('click')
    await nextTick()
    const ids = ['ReactiveAddButtons', 'ReactiveCountBadge', 'ReactiveGiftWrap']
    const before = snapshot(wrapper, ids)
    expect(before.ReactiveAddButtons).toBe(1)

    await wrapper.get('input[type="checkbox"]').trigger('change')
    await nextTick()

    const after = snapshot(wrapper, ids)
    expect(after.ReactiveGiftWrap - before.ReactiveGiftWrap).toBe(1)
    expect(after.ReactiveCountBadge).toBe(before.ReactiveCountBadge)
    expect(after.ReactiveAddButtons).toBe(before.ReactiveAddButtons)

    wrapper.unmount()
    const again = mount(ReactiveStoreDemo)
    expect(again.text()).toContain('件数：1')
  })
})

describe('Vue 入口', () => {
  it('各区块都渲染出来', async () => {
    const Probe = defineComponent({ setup: () => () => h(Example) })
    const wrapper = mount(Probe, { global: { plugins: [pinia] } })
    await flushPromises()
    for (const title of ['区块一', '区块二', '区块三', '区块四、五']) {
      expect(wrapper.text()).toContain(title)
    }
  })
})
