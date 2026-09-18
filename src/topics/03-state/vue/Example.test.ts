/**
 * 03 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看（vue 3.5.42，开发构建）。
 */
/* eslint-disable vue/one-component-per-file -- 探针组件（赋同值、渲染中改数据）只在测试里用，写成 defineComponent + h() 更直观 */
import { defineComponent, h, nextTick, onUpdated, ref } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import CartDemo from './CartDemo.vue'
import Example from './Example.vue'
import LazyInitDemo from './LazyInitDemo.vue'
import QuantityEditor from './QuantityEditor.vue'
import SnapshotDemo from './SnapshotDemo.vue'
import StateStructureDemo from './StateStructureDemo.vue'
import WhyStateDemo from './WhyStateDemo.vue'

enableAutoUnmount(afterEach)

let consoleWarn: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

const warnTexts = (): string[] => consoleWarn.mock.calls.map((args: unknown[]) => String(args[0]))

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) => {
  const button = wrapper.findAll('button').find((b) => b.text() === text)
  if (!button) throw new Error(`找不到按钮「${text}」`)
  return button
}

describe('Vue 区块一：普通变量与组件实例', () => {
  it('<script setup> 里的普通变量一直活着，但改了不触发渲染；等别的数据让组件重渲染，界面才跳到当前值', async () => {
    const wrapper = mount(WhyStateDemo)
    for (let i = 0; i < 3; i++) await buttonByText(wrapper, '普通变量 +1').trigger('click')
    expect(wrapper.get('[data-testid="plain-clicks"]').text()).toBe('0')
    await wrapper.findAll('button').find((b) => b.text().startsWith('让本区块重渲染'))!.trigger('click')
    // React 那边重渲染后是 0（局部变量每次渲染重来）；Vue 的 setup 只执行一次，变量保留了 3
    expect(wrapper.get('[data-testid="plain-clicks"]').text()).toBe('3')
  })

  it('每个组件实例一份 state', async () => {
    const wrapper = mount(WhyStateDemo)
    await buttonByText(wrapper, 'A +1').trigger('click')
    await buttonByText(wrapper, 'A +1').trigger('click')
    expect(wrapper.get('[data-testid="state-count-A"]').text()).toBe('2')
    expect(wrapper.get('[data-testid="state-count-B"]').text()).toBe('0')
  })
})

describe('Vue 区块二：没有渲染快照，DOM 延后刷新', () => {
  it('改完立刻读就是新值；DOM 要到 nextTick 之后才变', async () => {
    const wrapper = mount(SnapshotDemo)
    await buttonByText(wrapper, '改完立刻读').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[aria-label="区块二日志"] li').map((li) => li.text())).toEqual([
      '改完立刻读：count.value = 1，DOM 上还是 0',
      'await nextTick() 之后 DOM 是 1',
    ])
  })

  it('两个按钮都加 2（React 侧 A 只加 1）', async () => {
    const wrapper = mount(SnapshotDemo)
    await wrapper.findAll('button').find((b) => b.text().startsWith('A：'))!.trigger('click')
    expect(wrapper.get('[data-testid="snapshot-count"]').text()).toBe('2')
    await wrapper.findAll('button').find((b) => b.text().startsWith('B：'))!.trigger('click')
    expect(wrapper.get('[data-testid="snapshot-count"]').text()).toBe('4')
  })

  it('赋相同的值不触发重新渲染（ref 的 setter 用 Object.is 比较）', async () => {
    const count = ref(0)
    let updates = 0
    const Probe = defineComponent({
      setup() {
        onUpdated(() => updates++)
        return () => h('p', String(count.value))
      },
    })
    mount(Probe)
    count.value = 0
    await nextTick()
    expect(updates).toBe(0)
    count.value = 1
    await nextTick()
    expect(updates).toBe(1)
  })
})

describe('Vue 区块三：直接改就更新', () => {
  it('item.quantity 原地改、filter 整体替换都会更新，合计由 computed 算', async () => {
    const wrapper = mount(CartDemo)
    await wrapper.get('[data-testid="cart-row-p1"]').findAll('button').find((b) => b.text() === '+')!.trigger('click')
    expect(wrapper.get('[data-testid="cart-row-p1"]').text()).toContain('2 件')
    await wrapper.get('[data-testid="cart-row-p3"]').findAll('button').find((b) => b.text() === '移除')!.trigger('click')
    expect(wrapper.find('[data-testid="cart-row-p3"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="cart-total-count"]').text()).toBe('4')
  })

  it('初始数据拷过一份：重新挂载时模块常量没有被上一次的原地修改改坏', async () => {
    const first = mount(CartDemo)
    await first.get('[data-testid="cart-row-p1"]').findAll('button').find((b) => b.text() === '+')!.trigger('click')
    first.unmount()
    const second = mount(CartDemo)
    expect(second.get('[data-testid="cart-row-p1"]').text()).toContain('1 件')
  })
})

describe('Vue 区块四：setup 只执行一次', () => {
  it('ref(createInitialRows()) 只调用一次，组件重新渲染不会再调用；没有 StrictMode 那样的双调用', async () => {
    const wrapper = mount(LazyInitDemo)
    expect(wrapper.get('[data-testid="init-calls"]').text()).toBe('1')
    await wrapper.get('input').setValue('12')
    await wrapper.get('input').setValue('123')
    expect(wrapper.text()).toContain('含「123」的有 0 行')
    expect(wrapper.get('[data-testid="init-calls"]').text()).toBe('1')
  })
})

describe('Vue 区块五：state 的结构', () => {
  it('存同一个响应式对象会跟着变、存副本会过期；列表换成新对象后只有存 id 的还对', async () => {
    const wrapper = mount(StateStructureDemo)
    const keyboardRow = wrapper.findAll('.row').find((row) => row.text().startsWith('机械键盘'))!
    await keyboardRow.findAll('button').find((b) => b.text() === '选中')!.trigger('click')
    await keyboardRow.findAll('button').find((b) => b.text() === '+1')!.trigger('click')
    await keyboardRow.findAll('button').find((b) => b.text() === '+1')!.trigger('click')
    expect(wrapper.get('[data-testid="selected-by-object"]').text()).toBe('存同一个响应式对象：机械键盘 × 3')
    expect(wrapper.get('[data-testid="selected-by-copy"]').text()).toBe('❌ 存副本：机械键盘 × 1')
    expect(wrapper.get('[data-testid="selected-by-id"]').text()).toBe('✅ 存 id、computed 查找：机械键盘 × 3')
    await buttonByText(wrapper, '重新拉取（列表换成新对象）').trigger('click')
    expect(wrapper.get('[data-testid="selected-by-object"]').text()).toBe('存同一个响应式对象：机械键盘 × 3')
    expect(wrapper.get('[data-testid="selected-by-id"]').text()).toBe('✅ 存 id、computed 查找：机械键盘 × 13')
  })

  it('一个 status：再次发送时不会同时显示「已发送」', async () => {
    const wrapper = mount(StateStructureDemo)
    const row = wrapper.get('[data-testid="send-status"]')
    await row.findAll('button').find((b) => b.text() === '发送')!.trigger('click')
    await row.findAll('button').find((b) => b.text() === '模拟服务器返回')!.trigger('click')
    await row.findAll('button').find((b) => b.text() === '发送')!.trigger('click')
    expect(row.text()).toContain('发送中…')
    expect(row.text()).not.toContain('已发送 ✓')
  })
})

describe('Vue 区块六：reactive 对象 + 直接改的函数', () => {
  it('确认输入一次改四个字段；校验失败显示错误', async () => {
    const wrapper = mount(QuantityEditor)
    await buttonByText(wrapper, '直接输入').trigger('click')
    const input = wrapper.get('input')
    expect((input.element as HTMLInputElement).value).toBe('1')
    await input.setValue('0')
    await buttonByText(wrapper, '确定').trigger('click')
    expect(wrapper.text()).toContain('请输入 ≥ 1 的整数')
    await input.setValue('5')
    await buttonByText(wrapper, '确定').trigger('click')
    expect(wrapper.get('[data-testid="editor-quantity"]').text()).toBe('5 件')
    expect(wrapper.find('input').exists()).toBe(false)
    await buttonByText(wrapper, '重置').trigger('click')
    expect(wrapper.get('[data-testid="editor-quantity"]').text()).toBe('1 件')
  })
})

describe('Vue 区块七：两个常见错误在 Vue 里', () => {
  it('ref(fn) 存的就是函数本身，不会被调用', () => {
    const received: unknown[][] = []
    const toUpper = (...args: unknown[]) => {
      received.push(args)
      return 'return value'
    }
    const formatter = ref(toUpper)
    expect(formatter.value).toBe(toUpper)
    expect(received).toEqual([])
  })

  it('渲染时改自己读过的数据：开发构建里同一个更新任务重复排队超过 100 次就报 Maximum recursive updates exceeded', async () => {
    const n = ref(0)
    const RenderMutation = defineComponent({
      name: 'RenderMutation',
      setup() {
        return () => {
          n.value++
          return h('p', String(n.value))
        }
      },
    })
    // 这个错误在异步刷新队列时交给 handleError(msg, null, …)：instance 是 null，所以 app.config.errorHandler 接不到；
    // 开发环境先警告（标签写的是 app errorHandler），再把这段字符串抛出去 —— 变成未处理的 Promise 拒绝（runtime-core.cjs.js:435-449、:227-269）
    const rejections: unknown[] = []
    const onRejection = (reason: unknown) => rejections.push(reason)
    process.on('unhandledRejection', onRejection)
    const errorHandler = vi.fn()
    try {
      mount(RenderMutation, { global: { config: { errorHandler } } })
      await vi.waitFor(() => expect(rejections).toHaveLength(1))
    } finally {
      process.off('unhandledRejection', onRejection)
    }
    expect(errorHandler).not.toHaveBeenCalled()
    // 抛出的是这段字符串本身，不是 Error 对象
    expect(rejections[0]).toBe(
      'Maximum recursive updates exceeded in component <RenderMutation>. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.',
    )
    expect(warnTexts()).toEqual(['[Vue warn]: Unhandled error during execution of app errorHandler'])
    expect(n.value).toBeGreaterThan(100)
  })
})

it('整页渲染：七个区块都在，没有警告', () => {
  const wrapper = mount(Example)
  expect(wrapper.findAll('h3').map((h3) => h3.text().slice(0, 3))).toEqual(['区块一', '区块二', '区块三', '区块四', '区块五', '区块六', '区块七'])
  expect(warnTexts()).toEqual([])
})
