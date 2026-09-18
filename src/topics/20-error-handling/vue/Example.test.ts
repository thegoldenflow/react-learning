/**
 * 20 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看（vue 3.5.42）。
 */
/* eslint-disable vue/one-component-per-file -- 测试里用几个很小的探针组件，拆成单独文件反而难读 */
import { computed, defineComponent, h, nextTick, onErrorCaptured, ref } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import AppErrorHandlerDemo from './AppErrorHandlerDemo.vue'
import BoundaryBasicsDemo from './BoundaryBasicsDemo.vue'
import BuggyCounter from './BuggyCounter.vue'
import CaptureOnlyParent from './CaptureOnlyParent.vue'
import CatchScopeDemo from './CatchScopeDemo.vue'
import Example from './Example.vue'

enableAutoUnmount(afterEach)

let windowErrors: string[]
const onWindowError = (event: ErrorEvent) => {
  windowErrors.push(event.message)
  event.preventDefault()
}

beforeEach(() => {
  windowErrors = []
  window.addEventListener('error', onWindowError)
})

afterEach(() => {
  window.removeEventListener('error', onWindowError)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const buttonByText = (wrapper: Pick<ReturnType<typeof mount>, 'findAll'>, text: string) =>
  wrapper.findAll('button').find((b) => b.text().trim().startsWith(text))!

describe('Vue 区块一：ErrorBoundary.vue', () => {
  it('渲染中 throw 被接住（info 是 render function）：边界外不受影响；重试后子树是全新实例', async () => {
    const wrapper = mount(BoundaryBasicsDemo)
    const counterCard = wrapper.findAll('.card')[0]
    for (let i = 0; i < 3; i += 1) await counterCard.get('button').trigger('click')

    expect(counterCard.get('[role="alert"]').text()).toContain('这块区域崩溃了：计数到 3，BuggyCounter 渲染崩溃了')
    expect(wrapper.get('[aria-label="区块一日志"]').text()).toContain('（来源：render function）')

    await buttonByText(counterCard, '重试').trigger('click')
    expect(counterCard.text()).toContain('易碎计数器：0')
  })

  it('resetKeys：选中损坏的 p3 → 兜底；换回 p1 自动重置', async () => {
    const wrapper = mount(BoundaryBasicsDemo)
    const radio = (id: string) => wrapper.get(`input[type="radio"][value="${id}"]`)
    await radio('p3').setValue(true)
    await flushPromises()
    expect(wrapper.text()).toContain('商品 p3 的数据损坏，无法渲染')

    await radio('p1').setValue(true)
    await flushPromises()
    expect(wrapper.text()).toContain('机械键盘：￥399.00')
    expect(wrapper.get('[aria-label="区块一日志"]').text()).toContain('@reset：边界已重置')
  })

  it('只注册 onErrorCaptured、不换界面：渲染函数抛错的组件变成空注释节点，实例和 state 都还在', async () => {
    const wrapper = mount(CaptureOnlyParent)
    for (let i = 0; i < 3; i += 1) await wrapper.get('button').trigger('click')

    expect(wrapper.html()).toContain('<!---->')
    expect(wrapper.text()).toContain('已捕获：计数到 3')
    const counter = wrapper.findComponent(BuggyCounter)
    expect(counter.exists()).toBe(true) // 没有被卸载
  })

  it('错误发生在 computed 里（更新前的脏检查阶段）：info 是 component update，渲染函数没执行，界面停在上一次的样子', async () => {
    const infos: string[] = []
    const count = ref(2)
    const Child = defineComponent({
      setup() {
        const label = computed(() => {
          if (count.value === 3) throw new Error('computed 里 throw')
          return count.value
        })
        return () => h('span', `计数：${label.value}`)
      },
    })
    const Parent = defineComponent({
      setup() {
        onErrorCaptured((_err, _instance, info) => {
          infos.push(info)
          return false
        })
        return () => h(Child)
      },
    })
    const wrapper = mount(Parent)
    count.value = 3
    await nextTick()
    expect(infos).toEqual(['component update'])
    expect(wrapper.text()).toBe('计数：2')
  })
})

describe('Vue 区块二：onErrorCaptured 接得住什么', () => {
  it.each([
    ['1. 渲染中 throw', '渲染中 throw', 'render function'],
    ['2. 事件处理函数里 throw', '事件处理函数里 throw', 'native event handler'],
    ['3. async 处理函数里 throw', 'async 事件处理函数 await 之后 throw', 'native event handler'],
    ['4. watch 回调里 throw', 'watch 回调里 throw', 'watcher callback'],
  ])('接得住：%s', async (button, message, info) => {
    const wrapper = mount(CatchScopeDemo)
    await buttonByText(wrapper, button).trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain(`边界接住了：${message}（来源：${info}）`)
    expect(windowErrors).toEqual([])
  })

  it('接不住：setTimeout 回调里 throw（Vue 不经手）', async () => {
    vi.useFakeTimers()
    const wrapper = mount(CatchScopeDemo)
    await buttonByText(wrapper, '5. setTimeout 里 throw').trigger('click')
    expect(() => vi.runOnlyPendingTimers()).toThrow('setTimeout 回调里 throw')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('接不住：自己 addEventListener 注册的原生监听里 throw（浏览器派发 window 的 error 事件）', async () => {
    const wrapper = mount(CatchScopeDemo)
    await buttonByText(wrapper, '6. addEventListener').trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(windowErrors).toEqual(['addEventListener 注册的原生监听里 throw'])
    expect(wrapper.get('[aria-label="区块二错误日志"]').text()).toContain('window error 事件')
  })
})

describe('Vue 区块四：传播规则与 app.config.errorHandler', () => {
  it('自下而上逐级调用，最后到 errorHandler；中间层 return false 就停在那里', async () => {
    const wrapper = mount(AppErrorHandlerDemo, { attachTo: document.body })
    await nextTick()
    await wrapper.get('.btn-danger').trigger('click')
    const log = () => wrapper.get('[aria-label="传播日志"]').text()
    expect(log()).toMatch(/① 中间层 errorCaptured（来源：native event handler）\n② 外层 errorCaptured\n③ app.config.errorHandler：最里层组件的事件处理函数出错/)

    await wrapper.get('input[type="checkbox"]').setValue(true) // 重建小应用，中间层 return false
    await nextTick()
    await wrapper.get('.btn-danger').trigger('click')
    const lines = log().split('\n')
    expect(lines.at(-1)).toContain('① 中间层 errorCaptured（来源：native event handler） → return false，到此为止')
    expect(lines.filter((l) => l.startsWith('③'))).toHaveLength(1) // 只有第一次那条
  })
})

describe('Vue 入口', () => {
  it('各区块都渲染出来', async () => {
    const wrapper = mount(Example, { attachTo: document.body })
    await flushPromises()
    for (const title of ['区块一', '区块二', '区块三在 Vue 里', '区块四']) {
      expect(wrapper.text()).toContain(title)
    }
  })
})
