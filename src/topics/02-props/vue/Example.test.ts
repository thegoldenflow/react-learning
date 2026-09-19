/**
 * 02 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看（vue 3.5.42，开发构建）。
 * 生产构建下改 props 的行为是 node + 生产构建的一次性实测，写在 react/Example.tsx 二-3 与附 3（Vue 的结论在四-3 与附 6）。
 */
/* eslint-disable vue/one-component-per-file -- 探针组件（多根、inheritAttrs 对照、attrs 的 watch）只在测试里用，写成 defineComponent + h() 更直观 */
import { defineComponent, h, mergeProps, nextTick, ref, useAttrs, watch } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import Example from './Example.vue'
import LabeledInput from './LabeledInput.vue'
import MirrorPropsDemo from './MirrorPropsDemo.vue'
import OrderCards from './OrderCards.vue'
import ReadonlyPropsDemo from './ReadonlyPropsDemo.vue'
import UiButtonDemo from './UiButtonDemo.vue'

enableAutoUnmount(afterEach)

let consoleWarn: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const warnTexts = (): string[] => consoleWarn.mock.calls.map((args: unknown[]) => String(args[0]))

describe('Vue 区块一：defineProps、解构默认值与布尔转型', () => {
  it('三张订单卡：只有传了 discount 的那张显示折扣（3.5 响应式 props 解构的默认值）', () => {
    const wrapper = mount(OrderCards)
    const cards = wrapper.findAll('.card').slice(0, 3)
    expect(cards[1].text()).toContain('立减 15%，应付 ￥4760.00')
    expect(cards[0].text()).not.toContain('立减')
    expect(cards[2].text()).not.toContain('立减')
  })

  it('默认值只对「没传 / 传 undefined」生效，null 与空串原样收到；布尔 prop 不传是 false、只写属性名是 true', () => {
    const wrapper = mount(OrderCards)
    const rows = wrapper.findAll('tbody tr').map((tr) => tr.findAll('td')[1].text())
    expect(rows).toEqual([
      'note = "（无备注）" · emphasis = false',
      'note = "（无备注）" · emphasis = false',
      'note = null · emphasis = false',
      'note = "" · emphasis = false',
      'note = "（无备注）" · emphasis = true',
    ])
    expect(warnTexts()).toEqual([])
  })
})

describe('Vue 区块二：props 只读，改动靠事件上浮', () => {
  it('开发环境改 props：不抛错，控制台警告 target is readonly，值不变', async () => {
    const wrapper = mount(ReadonlyPropsDemo, { props: { delayMs: 0 } })
    await wrapper.findAll('button').find((b) => b.text().startsWith('❌'))!.trigger('click')
    expect(warnTexts()).toEqual(['[Vue warn] Set operation on key "amount" failed: target is readonly.'])
    expect(wrapper.get('[aria-label="子组件日志"]').text()).toContain('读回 props.amount = 100')
    expect(wrapper.text()).toContain('子组件收到的 amount：100')
  })

  it("emit('amountChange', 0)：父组件改自己的 ref，新值传下来", async () => {
    const wrapper = mount(ReadonlyPropsDemo, { props: { delayMs: 0 } })
    await wrapper.findAll('button').find((b) => b.text() === '父组件 +100')!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text().startsWith('✅'))!.trigger('click')
    expect(wrapper.text()).toContain('父组件的 ref：amount = 0')
    expect(wrapper.text()).toContain('子组件收到的 amount：0')
  })

  it('定时器里读 props.amount 读到的是最新值（props 是响应式对象，不是快照）', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ReadonlyPropsDemo, { props: { delayMs: 1500 } })
    await wrapper.findAll('button').find((b) => b.text() === '稍后读取 amount')!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === '父组件 +100')!.trigger('click')
    vi.advanceTimersByTime(1500)
    await nextTick()
    expect(wrapper.get('[aria-label="子组件日志"]').text()).toContain('1500ms 后读到 amount = 200（最新值')
  })
})

describe('Vue 区块三：不要把 prop 拷进本地 ref', () => {
  it('ref(price) 停在 setup 执行时的值；直接读 / computed 跟着变', async () => {
    const wrapper = mount(MirrorPropsDemo)
    const inc = wrapper.findAll('button').find((b) => b.text() === '父组件 price +10')!
    await inc.trigger('click')
    await inc.trigger('click')
    expect(wrapper.get('[data-testid="mirrored"]').text()).toBe('100')
    expect(wrapper.get('[data-testid="direct"]').text()).toBe('120')
    expect(wrapper.get('[data-testid="with-tax"]').text()).toBe('127')
  })

  it('initialPrice 有意只取初始值；父组件换 :key 才按新的初始值重来', async () => {
    const wrapper = mount(MirrorPropsDemo)
    const button = (text: string) => wrapper.findAll('button').find((b) => b.text() === text)!
    await button('草稿 −10').trigger('click')
    await button('父组件 price +10').trigger('click')
    await button('父组件 price +10').trigger('click')
    expect(wrapper.get('[data-testid="draft"]').text()).toBe('90')
    await button('按当前 price 重开草稿（换 key）').trigger('click')
    expect(wrapper.get('[data-testid="draft"]').text()).toBe('120')
  })
})

describe('Vue 区块四：透传属性与组件 ref', () => {
  it('@click / disabled / type / title / aria-label 透传到 <button>；class 拼接、style 合并', async () => {
    const wrapper = mount(UiButtonDemo)
    const button = (text: string) => wrapper.findAll('button').find((b) => b.text() === text)!
    await button('点我（@click 透传）').trigger('click')
    expect(button('已禁用').attributes('disabled')).toBe('')
    expect((button('已禁用').element as HTMLButtonElement).disabled).toBe(true)
    await button('已禁用').trigger('click')
    expect(wrapper.text()).toContain('@click 触发次数：1')
    expect(button('点我（@click 透传）').attributes('type')).toBe('button')
    expect(button('type 被覆盖为 submit').attributes('type')).toBe('submit')
    expect(button('删除').attributes('aria-label')).toBe('删除订单 SO-20260803')
    expect(button('删除').attributes('title')).toBe('这行 title 透传到真实 button 上，鼠标悬停可见')
    const merged = button('class / style 被合并')
    expect(merged.classes()).toEqual(['btn-primary', 'btn-ghost'])
    expect(merged.attributes('style')).toBe('font-size: 12px; padding: 2px 8px; margin-left: 8px;')
  })

  it('组件 ref 拿到的是组件实例：父组件通过 defineExpose 暴露的 focus() 把焦点移到 <button>', async () => {
    const wrapper = mount(UiButtonDemo, { attachTo: document.body })
    await wrapper.findAll('button').find((b) => b.text().startsWith('把焦点移到'))!.trigger('click')
    expect(document.activeElement?.textContent?.trim()).toBe('删除')
    expect(wrapper.text()).toContain('焦点在：删除')
  })

  it('没关 inheritAttrs 又手动 v-bind="attrs"：属性绑两遍，class 重复；同一个监听器被去重，只触发一次', async () => {
    let clicks = 0
    // 等价于模板 <button type="button" class="btn-primary" v-bind="attrs">（模板里的 v-bind 编译出来就是 mergeProps），并且没写 inheritAttrs: false
    const DoubleBound = defineComponent({
      setup() {
        const attrs = useAttrs()
        return () => h('button', mergeProps({ type: 'button', class: 'btn-primary' }, attrs), '按钮')
      },
    })
    const wrapper = mount(() => h(DoubleBound, { class: 'btn-ghost', onClick: () => clicks++ }))
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').attributes('class')).toBe('btn-primary btn-ghost btn-ghost')
    expect(clicks).toBe(1)
  })

  it('多根组件：显式 v-bind="$attrs" 的属性落在 <input> 上；没绑就丢掉并警告', () => {
    const wrapper = mount(LabeledInput, { props: { label: '收货人' }, attrs: { placeholder: '例如：林小满', maxlength: '10', class: 'wide' } })
    const input = wrapper.get('input')
    expect(input.attributes('placeholder')).toBe('例如：林小满')
    expect(input.attributes('maxlength')).toBe('10')
    expect(input.classes()).toEqual(['wide'])
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(warnTexts()).toEqual([])

    const Unbound = defineComponent({ setup: () => () => [h('label', '收货人'), h('input')] })
    const unbound = mount(() => h('div', [h(Unbound, { placeholder: '例如：林小满' })]))
    expect(unbound.get('input').attributes('placeholder')).toBeUndefined()
    expect(warnTexts()).toEqual([
      '[Vue warn]: Extraneous non-props attributes (placeholder) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.',
    ])
  })

  it('useAttrs() 的现状：文档说不能 watch，3.5.42 实测 watch 会触发（实现细节，不要依赖）', async () => {
    const seen: unknown[] = []
    const Child = defineComponent({
      inheritAttrs: false,
      setup() {
        const attrs = useAttrs()
        watch(
          () => attrs.title,
          (v) => seen.push(v),
        )
        return () => h('button', { title: attrs.title as string }, '按钮')
      },
    })
    const title = ref('a')
    const wrapper = mount(() => h(Child, { title: title.value }))
    title.value = 'b'
    await nextTick()
    await nextTick()
    expect(wrapper.get('button').attributes('title')).toBe('b')
    expect(seen).toEqual(['b'])
  })
})

it('入口组件渲染四个区块', () => {
  const wrapper = mount(Example)
  expect(wrapper.findAll('h3')).toHaveLength(4)
  expect(warnTexts()).toEqual([])
})
