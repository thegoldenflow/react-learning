/**
 * 01 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看（vue 3.5.42）。
 */
import { enableAutoUnmount, mount } from '@vue/test-utils'
import Example from './Example.vue'
import ProfileCards from './ProfileCards.vue'
import TemplateRulesDemo from './TemplateRulesDemo.vue'

enableAutoUnmount(afterEach)

describe('Vue 区块一：SFC 组件与模板', () => {
  it('同一个 UserCard 渲染两次；VIP 徽章通过具名插槽传入；:class 对象语法；静态样式在 <style scoped>，:style 里只有依赖数据的颜色', () => {
    const wrapper = mount(ProfileCards)
    const cards = wrapper.findAll('.card')
    expect(cards).toHaveLength(2)
    expect(cards[0].find('.badge-paid').text()).toBe('VIP')
    expect(cards[1].find('.badge-paid').exists()).toBe(false)
    expect(cards[0].classes()).toEqual(['card', 'vip'])
    expect(cards[1].classes()).toEqual(['card'])
    expect(cards[0].attributes('style')).toBe('border-color: rgb(212, 160, 23);')
    expect(cards[0].get('.avatar').attributes('style')).toBe('background: rgb(212, 160, 23);')
    // <style scoped>：编译器给组件里的元素加上同一个 data-v-<id> 属性，样式选择器也带上它（.vip[data-v-…]），所以类名只在本组件里生效
    const scopeAttrs = (el: Element) => el.getAttributeNames().filter((n) => n.startsWith('data-v-'))
    expect(scopeAttrs(cards[0].element)).toHaveLength(1)
    expect(scopeAttrs(cards[0].get('.avatar').element)).toEqual(scopeAttrs(cards[0].element))
    expect(cards[1].find('p').classes()).toEqual(['muted'])
  })

  it('同一个组件用两次是两个独立实例：点第一张卡的「关注」，第二张不变', async () => {
    const wrapper = mount(ProfileCards)
    const [first, second] = wrapper.findAll('.card')
    await first.get('button').trigger('click')
    expect(first.get('button').text()).toBe('已关注')
    expect(second.get('button').text()).toBe('关注')
  })
})

describe('Vue 区块二：模板规则', () => {
  it(':style 里的数字不补单位：width / borderWidth 这类值被 jsdom 当成无效值丢掉（Chrome 实测相同），无单位属性照常生效', async () => {
    const wrapper = mount(TemplateRulesDemo)
    await wrapper.findAll('button').find((b) => b.text().startsWith('读出渲染后的 style'))!.trigger('click')
    const style = wrapper.get('[aria-label="渲染后的 style"]').text()
    expect(style).not.toContain('width')
    expect(style).not.toContain('border-width')
    expect(style).toContain('padding: 0px')
    expect(style).toContain('line-height: 1.5')
    expect(style).toContain('opacity: 0.5')
  })

  it('<template v-for> 一次渲染多个节点，不产生包裹元素', () => {
    const wrapper = mount(TemplateRulesDemo)
    expect(wrapper.get('dl').html().replace(/\s+/g, '')).toBe(
      '<dl><dt>SFC</dt><dd>单文件组件，&lt;template&gt;+&lt;script&gt;+&lt;style&gt;</dd><dt>v-for</dt><dd>列表渲染；放在&lt;template&gt;上可以一次渲染多个节点</dd></dl>',
    )
  })
})

it('入口组件渲染各区块', () => {
  const wrapper = mount(Example)
  expect(wrapper.findAll('.card').length).toBeGreaterThanOrEqual(3)
})
