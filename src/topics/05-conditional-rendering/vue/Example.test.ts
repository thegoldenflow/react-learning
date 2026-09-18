/**
 * 05 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看（vue 3.5.42，开发构建）。
 */
/* eslint-disable vue/one-component-per-file -- 探针组件（渲染函数三元、组件上的 v-show、KeepAlive 停用期间的 watch）只在测试里用，写成 defineComponent + h() 更直观 */
import {
  defineComponent,
  h,
  KeepAlive,
  nextTick,
  onBeforeUpdate,
  onDeactivated,
  onMounted,
  onUnmounted,
  onUpdated,
  ref,
  vShow,
  watch,
  withDirectives,
} from 'vue'
import { compileTemplate } from 'vue/compiler-sfc'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import BranchStylesDemo from './BranchStylesDemo.vue'
import Example from './Example.vue'
import HideVsUnmountDemo from './HideVsUnmountDemo.vue'
import PositionDemo from './PositionDemo.vue'
import ZeroPitfallDemo from './ZeroPitfallDemo.vue'

enableAutoUnmount(afterEach)

let consoleWarn: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

// vue/compiler-sfc 是 vue 包的官方子路径导出，和 @vitejs/plugin-vue 编译 SFC 用的是同一个编译器
const compile = (source: string) => compileTemplate({ source, filename: 'Probe.vue', id: 'probe' }).code

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) => {
  const button = wrapper.findAll('button').find((b) => b.text() === text)
  if (!button) throw new Error(`找不到按钮「${text}」`)
  return button
}

describe('Vue 区块一：v-if / v-else-if / v-else', () => {
  it('三个分支、插值里的三元、<template v-if> 包两段且 DOM 里没有 template 这一层', async () => {
    const wrapper = mount(BranchStylesDemo)
    const extraTexts = ['（v-if 分支）这张订单不会再扣款', '已取消的订单可在 24 小时内联系客服恢复']
    const extras = () => wrapper.findAll('p').filter((p) => extraTexts.includes(p.text()))
    expect(wrapper.text()).toContain('订单待支付，请在 30 分钟内完成付款')
    expect(extras()).toHaveLength(0)

    await buttonByText(wrapper, '设为已支付').trigger('click')
    expect(wrapper.text()).toContain('支付成功，商品将在 48 小时内发出')
    expect(wrapper.text()).not.toContain('订单待支付')
    expect(wrapper.get('[data-testid="progress"]').text()).toBe('支付进度：已完成')

    await buttonByText(wrapper, '设为已取消').trigger('click')
    expect(wrapper.text()).toContain('订单已取消')
    expect(wrapper.text()).not.toContain('支付成功')
    // <template v-if> 本身不进 DOM：两段 <p> 的父元素直接就是卡片 div
    expect(extras()).toHaveLength(2)
    for (const p of extras()) expect(p.element.parentElement).toBe(wrapper.element)
  })
})

describe('Vue 区块二：0 陷阱', () => {
  it('v-if 对 0、NaN 都不渲染；插值里的 && 会把 0 显示出来，false 显示成「false」', async () => {
    const wrapper = mount(ZeroPitfallDemo)
    expect(wrapper.get('[data-testid="interpolation-false"]').text()).toBe("❌ 插值里 isVip && '…'：false")
    expect(wrapper.get('[data-testid="interpolation-ternary"]').text()).toBe("✅ 插值里写三元 isVip ? '…' : ''：")
    await buttonByText(wrapper, '清空商品（数量设为 0）').trigger('click')
    expect(wrapper.get('[data-testid="v-if-count"]').text()).toBe('✅ v-if="itemCount"：')
    expect(wrapper.get('[data-testid="v-if-average"]').text()).toBe('✅ v-if="average"：')
    expect(wrapper.get('[data-testid="interpolation-count"]').text()).toBe("❌ 插值里 itemCount && '…'：0")
  })
})

describe('Vue 区块三：模板里的 v-if / v-else 切换时换一个实例', () => {
  it('编译器给 v-if / v-else 的两个分支注入了不同的 key', () => {
    const code = compile('<Editor v-if="ok" name="A" /><Editor v-else name="B" />')
    expect(code).toContain('key: 0')
    expect(code).toContain('key: 1')
  })

  it('渲染函数里写三元（没有编译器注入的 key）：两边同一个组件时复用实例，草稿留下 —— 和 React 一样', async () => {
    const Editor = defineComponent({
      props: { name: { type: String, required: true } },
      setup(props) {
        const draft = ref('')
        return () =>
          h('input', {
            'aria-label': `${props.name} 的备注`,
            value: draft.value,
            onInput: (e: Event) => (draft.value = (e.target as HTMLInputElement).value),
          })
      },
    })
    const ok = ref(true)
    const Parent = defineComponent({
      setup: () => () => h('div', [ok.value ? h(Editor, { name: 'A' }) : h(Editor, { name: 'B' })]),
    })
    const wrapper = mount(Parent)
    await wrapper.get('input').setValue('草稿')
    const before = wrapper.get('input').element
    ok.value = false
    await nextTick()
    const after = wrapper.get('input').element as HTMLInputElement
    expect(after.getAttribute('aria-label')).toBe('B 的备注')
    expect(after).toBe(before)
    expect(after.value).toBe('草稿')
  })

  it('v-if / v-else 同一个组件：切换后草稿没了；只写一个组件、换 prop：草稿留下（React 那个 bug 的 Vue 版）；绑 :key：草稿没了', async () => {
    const wrapper = mount(PositionDemo)
    for (const testId of ['v-if-else', 'same-instance', 'with-key']) {
      await wrapper.get(`[data-testid="${testId}"] input`).setValue('尽快发货')
    }
    await wrapper.findAll('button').find((b) => b.text().startsWith('切换客户'))!.trigger('click')
    const valueOf = (testId: string) => (wrapper.get(`[data-testid="${testId}"] input`).element as HTMLInputElement).value
    expect(wrapper.get('[data-testid="v-if-else"] label').text()).toContain('给 Sarah 的备注')
    expect(valueOf('v-if-else')).toBe('')
    expect(valueOf('same-instance')).toBe('尽快发货')
    expect(valueOf('with-key')).toBe('')
  })
})

describe('Vue 区块四：v-if / v-show / KeepAlive', () => {
  it('v-if 卸载重建；v-show 只切 display、不走挂载 / 卸载 / 停用 / 激活钩子；KeepAlive 保留实例，走 deactivated / activated，DOM 移出文档、再显示时插回同一个元素', async () => {
    const wrapper = mount(HideVsUnmountDemo, { attachTo: document.body })
    for (const name of ['v-if', 'v-show', 'KeepAlive']) {
      const panel = wrapper.get(`[data-testid="panel-${name}"]`)
      await panel.get('button').trigger('click')
      await panel.get('input').setValue('草稿')
    }
    const lines = () => wrapper.findAll('[aria-label="区块四日志"] li').map((li) => li.text())
    expect(lines()).toEqual(['v-if：onMounted', 'v-show：onMounted', 'KeepAlive：onMounted', 'KeepAlive：onActivated'])
    const keepAliveInput = wrapper.get('[data-testid="panel-KeepAlive"] input').element

    await buttonByText(wrapper, '隐藏三块面板').trigger('click')
    expect(wrapper.find('[data-testid="panel-v-if"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="panel-v-show"]').attributes('style')).toContain('display: none')
    // KeepAlive：实例还在缓存里，但 DOM 被移出了文档（Activity 是用 display: none 留在原地）
    expect(wrapper.get('[data-testid="keep-alive-slot"]').find('input').exists()).toBe(false)
    expect(keepAliveInput.isConnected).toBe(false)
    expect(lines().slice(4)).toEqual(['v-if：onUnmounted', 'KeepAlive：onDeactivated'])

    await buttonByText(wrapper, '显示三块面板').trigger('click')
    const panel = (name: string) => wrapper.get(`[data-testid="panel-${name}"]`)
    expect(panel('v-if').get('button').text()).toBe('点赞 0')
    expect((panel('v-if').get('input').element as HTMLInputElement).value).toBe('')
    expect(panel('v-show').get('button').text()).toBe('点赞 1')
    expect((panel('v-show').get('input').element as HTMLInputElement).value).toBe('草稿')
    expect(panel('KeepAlive').get('button').text()).toBe('点赞 1')
    expect((panel('KeepAlive').get('input').element as HTMLInputElement).value).toBe('草稿')
    expect(panel('KeepAlive').get('input').element).toBe(keepAliveInput)
    expect(lines().slice(6)).toEqual(['v-if：onMounted', 'KeepAlive：onActivated'])
  })

  it('组件上的 v-show：不走挂载 / 卸载，但每次切换都会被父组件强制更新，onBeforeUpdate / onUpdated 照常调用', async () => {
    // 模板里的 <Panel v-show="visible" /> 编译成 withDirectives(组件 vnode, [[vShow, visible]])，下面的渲染函数就是这个写法
    const code = compile('<Panel v-show="visible" />')
    expect(code).toContain('_withDirectives')
    expect(code).toContain('_vShow')

    const calls: string[] = []
    const Child = defineComponent({
      setup() {
        onMounted(() => calls.push('mounted'))
        onUnmounted(() => calls.push('unmounted'))
        onBeforeUpdate(() => calls.push('beforeUpdate'))
        onUpdated(() => calls.push('updated'))
        return () => h('p', '子组件')
      },
    })
    const visible = ref(true)
    const Parent = defineComponent({
      setup: () => () => h('div', [withDirectives(h(Child), [[vShow, visible.value]])]),
    })
    const wrapper = mount(Parent)
    visible.value = false
    await nextTick()
    expect(wrapper.get('p').attributes('style')).toBe('display: none;')
    visible.value = true
    await nextTick()
    expect(calls).toEqual(['mounted', 'beforeUpdate', 'updated', 'beforeUpdate', 'updated'])
  })

  it('KeepAlive 停用期间 watch 照样触发、组件照样重新渲染（Activity 则由 React 清理 Effect）', async () => {
    const calls: string[] = []
    const source = ref(0)
    const Cached = defineComponent({
      setup() {
        watch(source, (v) => calls.push(`watch:${v}`))
        onDeactivated(() => calls.push('deactivated'))
        onUpdated(() => calls.push('updated'))
        return () => h('p', `source ${source.value}`)
      },
    })
    const visible = ref(true)
    const Parent = defineComponent({
      setup: () => () => h(KeepAlive, null, [visible.value ? h(Cached) : null]),
    })
    mount(Parent)
    visible.value = false
    await nextTick()
    source.value = 1
    await nextTick()
    expect(calls).toEqual(['deactivated', 'watch:1', 'updated'])
  })
})

it('整页渲染：四个区块都在，没有警告', () => {
  const wrapper = mount(Example)
  expect(wrapper.findAll('h3').map((h3) => h3.text().slice(0, 3))).toEqual(['区块一', '区块二', '区块三', '区块四'])
  expect(consoleWarn).not.toHaveBeenCalled()
})
