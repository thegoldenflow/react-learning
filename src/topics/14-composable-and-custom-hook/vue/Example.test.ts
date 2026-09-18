/**
 * 14 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看。
 * 用 @vue/test-utils 挂载；定时器类结论用 fake timers，请求类用真实定时器 + 很短的延迟。
 */
/* eslint-disable vue/one-component-per-file -- 测试里用几个很小的探针组件验证 composable，拆成单独文件反而难读 */
import { defineComponent, h, nextTick, ref } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import DebouncedUserSearch from './DebouncedUserSearch.vue'
import Example from './Example.vue'
import IntervalDemo from './IntervalDemo.vue'
import LetTimerDemo from './LetTimerDemo.vue'
import WidthPanel from './WidthPanel.vue'
import { useDebouncedValue } from './useDebouncedValue'
import { useInterval } from './useInterval'
import { useWindowWidth } from './useWindowWidth'

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1024 })
})

async function resize(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  window.dispatchEvent(new Event('resize'))
  await nextTick()
}

describe('Vue：useWindowWidth（ref + onMounted / onUnmounted）', () => {
  it('首次渲染是「未知」，onMounted 读到宽度后下一个 tick 更新；跟着 resize 更新；卸载时移除自己的监听', async () => {
    const removed = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(WidthPanel, { props: { title: '面板 A', threshold: 768 } })
    // 纯客户端渲染也会先出一帧 null：这是「setup 里不碰 window」换来的服务端渲染安全
    expect(wrapper.text()).toContain('挂载前未知')
    await nextTick()
    expect(wrapper.text()).toContain('1024px')

    await resize(500)
    expect(wrapper.text()).toContain('500px')
    expect(wrapper.text()).toContain('窄（阈值 768px）')

    wrapper.unmount()
    expect(removed.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1)
  })

  it('composable 可以在 if 里调用（不受调用顺序限制）；但生命周期钩子晚于 setup 同步期注册会被警告', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Conditional = defineComponent({
      props: { withWidth: Boolean },
      setup(props) {
        const width = props.withWidth ? useWindowWidth() : ref(null)
        return () => h('span', String(width.value))
      },
    })
    const withWidth = mount(Conditional, { props: { withWidth: true } })
    await nextTick()
    expect(withWidth.text()).toBe('1024')
    expect(mount(Conditional, { props: { withWidth: false } }).text()).toBe('null')
    expect(warn).not.toHaveBeenCalled()

    const Late = defineComponent({
      setup() {
        setTimeout(() => useWindowWidth(), 0)
        return () => h('span')
      },
    })
    mount(Late)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(warn.mock.calls.some(([msg]) => String(msg).includes('onMounted is called when there is no active component instance'))).toBe(
      true,
    )
  })
})

describe('Vue：useInterval（toValue + onWatcherCleanup）', () => {
  it('回调读到的是最新的 ref；频繁重新渲染不影响定时器；暂停后不再触发', async () => {
    vi.useFakeTimers()
    const wrapper = mount(IntervalDemo, { props: { delay: 1000, noiseMs: 300 } })
    const ui = within(wrapper.element as HTMLElement)
    const count = () => ui.getByLabelText('计数').textContent

    vi.advanceTimersByTime(3000)
    await nextTick()
    expect(count()).toContain('3')

    await wrapper.find('input[type=number]').setValue('5')
    await wrapper.findAll('input[type=checkbox]')[1].setValue(true) // 干扰
    for (let i = 0; i < 30; i += 1) {
      vi.advanceTimersByTime(100)
      await nextTick()
    }
    expect(count()).toContain('18') // 3 + 3 × 5：重新渲染不会重建定时器

    await wrapper.findAll('input[type=checkbox]')[0].setValue(true) // 暂停
    vi.advanceTimersByTime(3000)
    await nextTick()
    expect(count()).toContain('18')
  })

  it('组件卸载时 watcher 停止，onWatcherCleanup 注册的清理函数照样执行（定时器被清掉）', () => {
    vi.useFakeTimers()
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const tick = vi.fn()
    const Probe = defineComponent({
      setup() {
        useInterval(tick, 1000)
        return () => h('span')
      },
    })
    const wrapper = mount(Probe)
    vi.advanceTimersByTime(2000)
    expect(tick).toHaveBeenCalledTimes(2)

    wrapper.unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
    vi.advanceTimersByTime(3000)
    expect(tick).toHaveBeenCalledTimes(2)
  })
})

describe('Vue：防抖与 let timer', () => {
  it('useDebouncedValue 接受 getter：停手满 delay 才更新', async () => {
    vi.useFakeTimers()
    const source = ref('a')
    let debounced: ReturnType<typeof useDebouncedValue<string>> | undefined
    const Probe = defineComponent({
      setup() {
        debounced = useDebouncedValue(() => source.value, 500)
        return () => h('span')
      },
    })
    mount(Probe)
    source.value = 'ab'
    await nextTick()
    vi.advanceTimersByTime(400)
    source.value = 'abc'
    await nextTick()
    vi.advanceTimersByTime(499)
    expect(debounced?.value).toBe('a')
    vi.advanceTimersByTime(1)
    expect(debounced?.value).toBe('abc')
  })

  it('防抖搜索：快速输入只按最后的关键词发一次请求', async () => {
    const user = userEvent.setup({ delay: null })
    const wrapper = mount(DebouncedUserSearch, { props: { debounceMs: 60, delayMs: 20 }, attachTo: document.body })
    const ui = within(wrapper.element as HTMLElement)
    await vi.waitFor(() => expect(ui.getByLabelText('请求次数')).toHaveTextContent('一共发了 1 次请求'))

    await user.type(ui.getByLabelText('防抖搜索关键词'), '张伟')

    await vi.waitFor(() => expect(ui.getByLabelText('请求次数')).toHaveTextContent('一共发了 2 次请求'))
    expect(ui.getByLabelText('请求次数')).toHaveTextContent('请求：「张伟」')
    await vi.waitFor(() => expect(ui.getByText(/zhangwei@example.com/)).toBeInTheDocument())
  })

  it('let timer 放在 setup 作用域里：Vue 里是对的，快速输入只触发一次', async () => {
    const user = userEvent.setup({ delay: null })
    const wrapper = mount(LetTimerDemo, { props: { debounceMs: 60 }, attachTo: document.body })
    const ui = within(wrapper.element as HTMLElement)

    await user.type(ui.getByLabelText('let timer 写法'), 'abc')

    await vi.waitFor(() => expect(ui.getByLabelText('let timer 触发次数')).toHaveTextContent('触发了 1 次：abc'))
  })
})

describe('Example 入口', () => {
  it('三个区块都渲染出来', async () => {
    const wrapper = mount(Example, { attachTo: document.body })
    await flushPromises()
    const ui = within(wrapper.element as HTMLElement)
    for (const n of ['一', '二', '三']) {
      expect(ui.getByRole('heading', { name: new RegExp(`区块${n}`) })).toBeInTheDocument()
    }
  })
})
