/**
 * 26 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看（vue 3.5.42）。
 * 定时器用 fake timers；轮询的请求延迟通过 prop 传 0。
 */
import { defineComponent, h, nextTick, ref, watchEffect } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import DelayedSaveDemo from './DelayedSaveDemo.vue'
import Example from './Example.vue'
import ListenerDemo from './ListenerDemo.vue'
import PollingDemo from './PollingDemo.vue'
import WatchSourceDemo from './WatchSourceDemo.vue'

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

type AnyWrapper = Pick<ReturnType<typeof mount>, 'findAll' | 'get'>
const button = (wrapper: AnyWrapper, text: string) => {
  const found = wrapper.findAll('button').find((b) => b.text().trim().startsWith(text))
  if (!found) throw new Error(`找不到按钮：${text}`)
  return found
}
const lines = (wrapper: AnyWrapper, label: string) => wrapper.get(`[aria-label="${label}"]`).findAll('li').map((li) => li.text())

describe('Vue 区块一：setTimeout 里现读 .value', () => {
  it('现读 count.value 拿到最新值；手动拷的 snapshot 停在点击那一刻', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DelayedSaveDemo)
    await button(wrapper, '2 秒后保存（现读').trigger('click')
    await button(wrapper, '2 秒后保存（手动快照').trigger('click')
    for (let i = 0; i < 3; i += 1) await button(wrapper, '+1').trigger('click')
    vi.advanceTimersByTime(2000)
    await nextTick() // 日志数组已经变了，DOM 在下一个 tick 更新

    const log = lines(wrapper, '区块一日志').join('\n')
    expect(log).toContain('【现读】保存了 count.value=3')
    expect(log).toContain('【手动快照】保存了 snapshot=0，而此刻 count.value=3')
  })

  it('count.value++ 保住中间的更新；count.value = snapshot + 1 把数字打回去', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DelayedSaveDemo)
    const count = () => wrapper.get('[aria-label="区块一 count"]').text()

    await button(wrapper, '2 秒后 +1（snapshot').trigger('click')
    for (let i = 0; i < 3; i += 1) await button(wrapper, '+1').trigger('click')
    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(count()).toBe('1')

    await button(wrapper, '2 秒后 +1（count.value++').trigger('click')
    for (let i = 0; i < 3; i += 1) await button(wrapper, '+1').trigger('click')
    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(count()).toBe('5')
  })

  it('解构 reactive 得到的普通值停在 setup 那一刻；toRefs 的 ref 连着源对象', async () => {
    const wrapper = mount(DelayedSaveDemo)
    for (let i = 0; i < 2; i += 1) await button(wrapper, '点赞 +1').trigger('click')
    await button(wrapper, '读三种写法').trigger('click')
    expect(lines(wrapper, '区块一日志').at(-1)).toBe(
      'state.likes=2（现读）｜解构出来的 likes=0（setup 时拷走的值）｜toRefs 的 likesRef.value=2（现读）',
    )
  })

  it('Vue 3.5 解构出来的 prop：2 秒后的回调里读到的是那一刻的 prop（编译器改写成了 props.count）', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DelayedSaveDemo)
    await button(wrapper, '2 秒后读 prop').trigger('click')
    for (let i = 0; i < 3; i += 1) await button(wrapper, '+1').trigger('click')
    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(lines(wrapper, '区块一日志').at(-1)).toContain('【子组件】2 秒后读到 count=3')
  })

  it('卸载时清掉还没执行的定时器', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DelayedSaveDemo)
    await button(wrapper, '2 秒后保存（现读').trigger('click')
    await button(wrapper, '2 秒后读 prop').trigger('click')
    expect(vi.getTimerCount()).toBe(2)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('Vue 区块二：onMounted 里手动 addEventListener', () => {
  it('只注册一次，handler 读到的是当前值；onMounted 时拷的值停在 0', async () => {
    const added = vi.spyOn(HTMLInputElement.prototype, 'addEventListener')
    const wrapper = mount(ListenerDemo)
    const keydownCalls = () => added.mock.calls.filter(([type]) => type === 'keydown').length
    // 两次：onMounted 里手动注册的 + Vue 给模板 @keydown 注册的 invoker（Vue 把监听器直接绑在元素上，不像 React 在根节点统一委托）
    expect(keydownCalls()).toBe(2)
    for (let i = 0; i < 2; i += 1) await button(wrapper, '+1').trigger('click')
    await wrapper.get('input[placeholder^="按 Enter（onMounted"]').trigger('keydown', { key: 'Enter' })
    await wrapper.get('input[placeholder^="按 Enter（对照"]').trigger('keydown', { key: 'Enter' })

    const log = lines(wrapper, '区块二日志')
    expect(log[0]).toBe('【手动监听】读到 count.value=2（现读）；onMounted 时拷的 mountedCount=0（手动快照）')
    expect(log[1]).toBe('【模板事件】@keydown.enter 读到 count.value=2')
    // 重渲染了两次，没有任何重新注册：手动监听只在 onMounted 注册；模板事件的处理函数被编译器缓存、引用没变，Vue 不会重新注册
    expect(keydownCalls()).toBe(2)
    expect(wrapper.text()).toContain('注册次数 1')
  })

  it('onBeforeUnmount 里移除手动注册的监听器（此时模板 ref 还指着元素）', () => {
    const removed = vi.spyOn(HTMLInputElement.prototype, 'removeEventListener')
    const wrapper = mount(ListenerDemo)
    const manualInput = wrapper.get('input[placeholder^="按 Enter（onMounted"]').element
    wrapper.unmount()
    const fromManualInput = removed.mock.calls.filter(([type], i) => type === 'keydown' && removed.mock.contexts[i] === manualInput)
    expect(fromManualInput).toHaveLength(1)
  })
})

describe('Vue 区块三：轮询', () => {
  async function startPolling(mode: 'fresh' | 'frozen' | 'restart') {
    const wrapper = mount(PollingDemo, { props: { delayMs: 0 } })
    await wrapper.findAll('select')[1].setValue(mode)
    await button(wrapper, '开始轮询').trigger('click')
    await vi.advanceTimersByTimeAsync(1)
    return wrapper
  }
  const toPaid = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('select')[0].setValue('paid')

  it('现读：定时器不重建，下一次 tick 读到新的 status', async () => {
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const wrapper = await startPolling('fresh')
    await toPaid(wrapper)
    await vi.advanceTimersByTimeAsync(2000 + 1)
    expect(lines(wrapper, '区块三日志').at(-1)).toBe('【现读】第 2 次轮询：status=paid → 6 条')
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
  })

  it('启动时拷一份：一直用开始那一刻的 status（React 依赖 [] 的样子）', async () => {
    vi.useFakeTimers()
    const wrapper = await startPolling('frozen')
    await toPaid(wrapper)
    await vi.advanceTimersByTimeAsync(2000 + 1)
    expect(lines(wrapper, '区块三日志').at(-1)).toBe('【启动时拷一份】第 2 次轮询：status=all → 15 条（下拉框已经是 paid）')
  })

  it('watch 重启：status 在 source 里，一变就清理并重建，计数从 1 重来（React 依赖 [status] 的样子）', async () => {
    vi.useFakeTimers()
    const wrapper = await startPolling('restart')
    await toPaid(wrapper)
    await vi.advanceTimersByTimeAsync(1)
    expect(lines(wrapper, '区块三日志').at(-1)).toBe('【watch 重启】第 1 次轮询：status=paid → 6 条')
  })

  it('停止轮询与卸载都会执行 onWatcherCleanup：定时器清掉', async () => {
    vi.useFakeTimers()
    const wrapper = await startPolling('fresh')
    expect(vi.getTimerCount()).toBe(1)
    await button(wrapper, '停止轮询').trigger('click')
    expect(vi.getTimerCount()).toBe(0)

    await button(wrapper, '开始轮询').trigger('click')
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(1) // 让已发出请求的 setTimeout(0) 走完
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('Vue 区块四：watch 的 source', () => {
  it('watchEffect 追踪回调里读到的 theme：提交后每切一次主题多发一次请求；watch 版与事件版只发一次', async () => {
    const wrapper = mount(WatchSourceDemo)
    await button(wrapper, '提交（watchEffect 版）').trigger('click')
    await button(wrapper, '提交（watch 版）').trigger('click')
    await button(wrapper, '提交（事件版）').trigger('click')
    await button(wrapper, '切换主题').trigger('click')
    await button(wrapper, '切换主题').trigger('click')
    const log = lines(wrapper, '4a 日志')
    expect(log.filter((l) => l === '【watchEffect 版】POST /api/register')).toHaveLength(3)
    expect(log.filter((l) => l === '【watch 版】POST /api/register')).toHaveLength(1)
    expect(log.filter((l) => l === '【事件版】POST /api/register')).toHaveLength(1)
  })

  it('非响应式的值当 watch 的 source：改了、组件重渲染了，回调都不执行', async () => {
    const wrapper = mount(WatchSourceDemo)
    await button(wrapper, 'plain.count + 1').trigger('click')
    await button(wrapper, 'plain.count + 1').trigger('click')
    await button(wrapper, '让组件重渲染').trigger('click')
    await flushPromises()
    const log = lines(wrapper, '4c 日志')
    expect(log).toEqual(['plain.count 改成了 1（Vue 追踪不到）', 'plain.count 改成了 2（Vue 追踪不到）'])
  })

  it('坑：watchEffect 里写 logRef.value.push，logRef 也被收成依赖，给它赋新数组会让 watchEffect 重跑', async () => {
    let runs = 0
    const Probe = defineComponent({
      setup() {
        const logRef = ref<string[]>([])
        watchEffect(() => {
          runs += 1
          logRef.value.push(`第 ${runs} 次执行`) // 读 logRef.value 被追踪；push 本身不追踪
        })
        return () => h('button', { onClick: () => (logRef.value = []) }, '清空')
      },
    })
    const wrapper = mount(Probe)
    expect(runs).toBe(1)
    await wrapper.get('button').trigger('click')
    expect(runs).toBe(2) // 清空（给 ref 赋新数组）触发了重跑
  })
})

it('入口组件渲染四个区块', () => {
  const wrapper = mount(Example)
  const titles = wrapper.findAll('h3').map((h3) => h3.text())
  expect(titles).toHaveLength(4)
  expect(titles[0]).toMatch(/^区块一/)
  expect(titles[3]).toMatch(/^区块四/)
})
