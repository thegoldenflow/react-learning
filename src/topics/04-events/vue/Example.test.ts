/**
 * 04 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看（vue 3.5.42，开发构建，jsdom）。
 */
/* eslint-disable vue/one-component-per-file -- 探针组件（组件事件不冒泡）只在测试里用，写成 defineComponent + h() 更直观 */
import { defineComponent, h } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import BindingDemo from './BindingDemo.vue'
import CaptureOrderDemo from './CaptureOrderDemo.vue'
import DefaultActionDemo from './DefaultActionDemo.vue'
import EventObjectDemo from './EventObjectDemo.vue'
import Example from './Example.vue'
import ModifiersDemo from './ModifiersDemo.vue'
import PassiveWheelDemo from './PassiveWheelDemo.vue'
import PropagationDemo from './PropagationDemo.vue'
import RareModifiersDemo from './RareModifiersDemo.vue'

enableAutoUnmount(afterEach)

let consoleWarn: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) => {
  const button = wrapper.findAll('button').find((b) => b.text() === text)
  if (!button) throw new Error(`找不到按钮「${text}」`)
  return button
}

const logLines = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll(`[aria-label="${label}"] li:not(.log-empty)`).map((li) => li.text())

const tableRows = (wrapper: ReturnType<typeof mount>, label: string) =>
  Object.fromEntries(wrapper.findAll(`[aria-label="${label}"] tr`).map((tr) => tr.findAll('td').map((td) => td.text())))

describe('Vue 区块一：绑定与传参', () => {
  it('方法处理器收到原生事件；内联处理器里「调用」是对的；子组件 emit 带上 $event.shiftKey', async () => {
    const wrapper = mount(BindingDemo)
    await buttonByText(wrapper, '点击计数：0').trigger('click', { clientX: 12, clientY: 34 })
    expect(wrapper.get('[data-testid="last-pos"]').text()).toBe('最后一次点击位置：x=12, y=34')
    const removeButton = () => wrapper.get('[data-testid="row-i1"] .btn-danger')
    await removeButton().trigger('click', { shiftKey: true })
    expect(wrapper.get('[data-testid="row-i1"]').text()).toContain('机械键盘 × 1')
    await removeButton().trigger('click')
    expect(wrapper.find('[data-testid="row-i1"]').exists()).toBe(false)
  })

  it('内联处理器传参 @click="emit(\'remove\', item.id, true)"：点击时才执行，数量减一', async () => {
    const wrapper = mount(BindingDemo)
    const row = () => wrapper.get('[data-testid="row-i2"]')
    expect(row().text()).toContain('无线鼠标 × 2')
    const minusOne = row()
      .findAll('button')
      .find((b) => b.text() === '减一件')
    await minusOne!.trigger('click')
    expect(row().text()).toContain('无线鼠标 × 1')
  })

  it('组件事件不冒泡：孙组件 emit 的事件，隔一层的组件收不到（给中间组件的监听器只是透传到它的根元素 div 上）', async () => {
    const heard: string[] = []
    const Child = defineComponent({
      emits: ['pick'],
      setup(_, { emit }) {
        return () => h('button', { onClick: () => emit('pick', 42) }, 'child')
      },
    })
    // 中间组件渲染一个 div 再包 Child：父组件给它的 onPick 透传到 div 上，成了原生 pick 事件的监听器 —— 没有谁派发名叫 pick 的 DOM 事件，所以它收不到
    const Wrapper = defineComponent({
      setup() {
        return () => h('div', [h(Child)])
      },
    })
    const Parent = defineComponent({
      setup() {
        return () => h(Wrapper, { onPick: (v: unknown) => heard.push(`Wrapper 上的 onPick 收到 ${String(v)}`) })
      },
    })
    const wrapper = mount(Parent)
    await wrapper.get('button').trigger('click')
    expect(heard).toEqual([])
  })

  it('反例：中间组件的根节点就是子组件、又没声明 emits 时，监听器一路透传下去，祖父组件「收到」了孙组件的事件 —— 这是透传，不是冒泡', async () => {
    const heard: string[] = []
    const Child = defineComponent({
      emits: ['pick'],
      setup(_, { emit }) {
        return () => h('button', { onClick: () => emit('pick', 42) }, 'child')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        return () => h(Child)
      },
    })
    const Parent = defineComponent({
      setup() {
        return () => h(Wrapper, { onPick: (v: unknown) => heard.push(`Wrapper 上的 onPick 收到 ${String(v)}`) })
      },
    })
    const wrapper = mount(Parent)
    await wrapper.get('button').trigger('click')
    expect(heard).toEqual(['Wrapper 上的 onPick 收到 42'])
  })
})

describe('Vue 区块二：事件对象', () => {
  it('处理函数拿到的是原生事件，currentTarget 就是绑定的元素；处理函数返回后 currentTarget 是 null', async () => {
    const wrapper = mount(EventObjectDemo, { attachTo: document.body })
    await wrapper.get('[data-node="icon"]').trigger('click')
    expect(tableRows(wrapper, '处理函数里读到的值')).toMatchObject({
      'event.type': 'click',
      'event.target': '<span data-node="icon">',
      'event.currentTarget': '<button data-node="demo-button">',
      'event instanceof MouseEvent': 'true',
    })
    await vi.waitFor(() =>
      expect(tableRows(wrapper, '处理函数返回之后读到的值')).toEqual({
        'setTimeout 里 event.type': 'click',
        'setTimeout 里 event.target': '<span data-node="icon">',
        'setTimeout 里 event.currentTarget': 'null',
      }),
    )
  })
})

describe('Vue 区块三：事件传播', () => {
  it('冒泡：按钮 → 中层 → 外层 → document；按钮里 stopPropagation 之后，外层和 document 冒泡阶段的监听器收不到，document 的捕获监听（{ capture: true }）照样收到', async () => {
    const wrapper = mount(PropagationDemo, { attachTo: document.body })
    await buttonByText(wrapper, '点我').trigger('click')
    expect(logLines(wrapper, '区块三日志')).toEqual([
      'document 捕获阶段的监听器（{ capture: true }）',
      'Vue 按钮 @click',
      'Vue 中层 @click',
      'Vue 外层 @click',
      'document 冒泡阶段的监听器',
    ])
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await buttonByText(wrapper, '点我').trigger('click')
    expect(logLines(wrapper, '区块三日志').slice(5)).toEqual(['document 捕获阶段的监听器（{ capture: true }）', 'Vue 按钮 @click'])
  })

  it('【少用】没有委托：Vue 的监听器和原生监听器按 DOM 顺序交错执行，同一元素上先注册的先执行（CaptureOrderDemo，页面上已注释）', async () => {
    const wrapper = mount(CaptureOrderDemo, { attachTo: document.body })
    await buttonByText(wrapper, '点我（捕获实验）').trigger('click')
    expect(logLines(wrapper, '捕获实验日志')).toEqual([
      'Vue 外层 @click.capture',
      '原生 外层 div（捕获）',
      'Vue 中层 @click.capture',
      'Vue 按钮 @click',
      '原生 按钮（冒泡）',
      'Vue 中层 @click',
      'Vue 外层 @click',
      '原生 外层 div（冒泡）',
      '原生 document（冒泡）',
    ])
  })

  it('【少用】.stop / stopPropagation：同一元素上的其他监听器照常执行，DOM 里后面的传播停止（CaptureOrderDemo，页面上已注释）', async () => {
    const wrapper = mount(CaptureOrderDemo, { attachTo: document.body })
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await buttonByText(wrapper, '点我（捕获实验）').trigger('click')
    expect(logLines(wrapper, '捕获实验日志')).toEqual([
      'Vue 外层 @click.capture',
      '原生 外层 div（捕获）',
      'Vue 中层 @click.capture',
      'Vue 按钮 @click',
      '原生 按钮（冒泡）',
    ])
  })

  it('原生 scroll、focus 不冒泡，Vue 不模拟；外层要知道里面获得焦点就用 @focusin', async () => {
    const wrapper = mount(PropagationDemo, { attachTo: document.body })
    await wrapper.get('[data-testid="scroll-box"]').trigger('scroll')
    ;(wrapper.get('[aria-label="焦点实验输入框"]').element as HTMLInputElement).focus()
    await flushPromises()
    expect(wrapper.get('[data-testid="bubbling-counts"]').text()).toBe(
      '里面的 @scroll：1 次 · 外层的 @scroll：0 次 · 外层的 @focus：0 次 · 外层的 @focusin：1 次',
    )
  })

  it('【少用】外层观察里面的滚动用 @scroll.capture（CaptureOrderDemo，页面上已注释）', async () => {
    const wrapper = mount(CaptureOrderDemo, { attachTo: document.body })
    await wrapper.get('[data-testid="capture-scroll-box"]').trigger('scroll')
    expect(wrapper.get('[data-testid="capture-scroll-count"]').text()).toBe('外层的 @scroll.capture：1 次')
  })
})

describe('Vue 区块四：默认行为', () => {
  it('.prevent 只拦跳转，事件照样冒泡；.stop 只停传播，勾选框照样勾上', async () => {
    const wrapper = mount(DefaultActionDemo)
    await wrapper.get('a').trigger('click')
    expect(wrapper.get('[data-testid="default-message"]').text()).toBe('拦截了跳转（event.defaultPrevented = true），事件照样冒泡到外层')
    expect(wrapper.get('[data-testid="bubbled"]').text()).toBe('外层收到的冒泡点击：1 次')
    const checkbox = wrapper.get('input[type="checkbox"]')
    await checkbox.trigger('click')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.get('[data-testid="bubbled"]').text()).toBe('外层收到的冒泡点击：1 次')
  })

  it('@submit.prevent 写在 form 上：输入框里回车走到这里，原生 submit 的默认动作被取消', async () => {
    const wrapper = mount(DefaultActionDemo, { attachTo: document.body })
    const submitted: boolean[] = []
    const onSubmit = (e: Event) => submitted.push(e.defaultPrevented)
    document.addEventListener('submit', onSubmit)
    try {
      const u = userEvent.setup({ delay: null })
      const input = wrapper.get('input[name="keyword"]').element as HTMLInputElement
      await u.clear(input)
      await u.type(input, '鼠标{Enter}')
      await flushPromises()
    } finally {
      document.removeEventListener('submit', onSubmit)
    }
    expect(submitted).toEqual([true])
    expect(wrapper.get('[data-testid="default-message"]').text()).toBe('拦截了表单提交，关键字：鼠标（没有整页刷新）')
  })

  it('.self：点子元素不计数', async () => {
    const wrapper = mount(DefaultActionDemo)
    await buttonByText(wrapper, '点这个按钮不算').trigger('click')
    expect(wrapper.get('[data-testid="self-area"]').text()).toContain('已计数 0 次')
    await wrapper.get('[data-testid="self-area"]').trigger('click')
    expect(wrapper.get('[data-testid="self-area"]').text()).toContain('已计数 1 次')
  })
})

describe('Vue 区块五：修饰符', () => {
  it('.once：第二次点击不再处理', async () => {
    const wrapper = mount(ModifiersDemo)
    const button = wrapper.findAll('button')[0]
    // 按钮领取后会 disabled，这里直接派发原生点击，证明监听器本身已经被移除
    await button.trigger('click')
    button.element.removeAttribute('disabled')
    button.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(logLines(wrapper, '区块五日志')).toEqual(['领取成功（.once：监听器已被移除）'])
  })

  it('按键：.enter.exact 提交（按着 Shift / Ctrl 的回车不算）、组字中的回车（isComposing 或 keyCode 229）被忽略、.esc 清空', async () => {
    const wrapper = mount(ModifiersDemo)
    const input = wrapper.get('input')
    await input.trigger('keydown', { key: 'Enter' })
    await input.trigger('keydown', { key: 'Enter', shiftKey: true })
    await input.trigger('keydown', { key: 'Enter', ctrlKey: true })
    await input.trigger('keydown', { key: 'Enter', isComposing: true })
    await input.trigger('keydown', { key: 'Enter', keyCode: 229 })
    await input.setValue('草稿')
    await input.trigger('keydown', { key: 'Escape' })
    expect(logLines(wrapper, '区块五日志')).toEqual(['Enter（.enter.exact）：提交', 'Esc（.esc）：清空输入框'])
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('【少用】多个组合键精确区分：.enter.exact 与 .ctrl.enter.exact 各算一种，Ctrl + Shift + Enter 两个都不触发（RareModifiersDemo，页面上已注释）', async () => {
    const wrapper = mount(RareModifiersDemo)
    const input = wrapper.get('input')
    await input.trigger('keydown', { key: 'Enter' })
    await input.trigger('keydown', { key: 'Enter', ctrlKey: true })
    await input.trigger('keydown', { key: 'Enter', ctrlKey: true, shiftKey: true })
    expect(logLines(wrapper, '少用修饰符日志')).toEqual(['Enter（.enter.exact）：提交', 'Ctrl + Enter（.ctrl.enter.exact）：提交并继续'])
  })

  it('【少用】鼠标按键看 event.button；@contextmenu.prevent 拦住浏览器右键菜单（RareModifiersDemo，页面上已注释）', async () => {
    const wrapper = mount(RareModifiersDemo)
    const button = wrapper.get('button')
    await button.trigger('mousedown', { button: 2 })
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    button.element.dispatchEvent(event)
    await flushPromises()
    expect(event.defaultPrevented).toBe(true)
    expect(logLines(wrapper, '少用修饰符日志')).toEqual(['按下了次键 / 右键（.right）', '@contextmenu.prevent：浏览器右键菜单没有弹出'])
  })
})

describe('【少用】Vue 区块六：滚轮（页面上整块已注释，这里直接挂载组件）', () => {
  it('@wheel.prevent 直接生效（Vue 不给元素上的 wheel 加 passive）', async () => {
    const wrapper = mount(PassiveWheelDemo)
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 })
    wrapper.get('[data-testid="vue-wheel"]').element.dispatchEvent(event)
    await flushPromises()
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.get('[data-testid="zoom"]').text()).toBe('110%')
  })
})

it('整页渲染：各区块都在，没有警告', () => {
  const wrapper = mount(Example)
  const names = ['区块一', '区块二', '区块三', '区块四', '区块五']
  /* 【少用】Example.vue 里取消区块六（PassiveWheelDemo）的注释后，这里也取消注释
  names.push('区块六')
  */
  expect(wrapper.findAll('h3').map((h3) => h3.text().slice(0, 3))).toEqual(names)
  expect(consoleWarn).not.toHaveBeenCalled()
})
