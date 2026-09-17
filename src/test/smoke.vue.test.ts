/**
 * 工具链冒烟测试（Vue 侧）——项目基础设施，不是知识点。
 * 证明：plugin-vue 能在 Vitest 里编译 SFC；@testing-library/vue 8.1（两年多没发版，审计待核实项 M-4）
 * 与 @vue/test-utils 都能驱动 Vue 3.5；升级后的 vue-router 5 能在测试环境里完成内存导航。
 */
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import SmokeCounter from './fixtures/SmokeCounter.vue'

describe('Vue 测试工具链', () => {
  it('@testing-library/vue：render + user-event + jest-dom 断言', async () => {
    const user = userEvent.setup()
    render(SmokeCounter)

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('点击 1 次')
  })

  it('@vue/test-utils：mount + trigger', async () => {
    const wrapper = mount(SmokeCounter)

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').text()).toBe('点击 1 次')
  })

  it('vue-router 5：createMemoryHistory 下导航到带参数的路由', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: SmokeCounter },
        { path: '/orders/:id', component: SmokeCounter },
      ],
    })

    await router.push('/orders/o1')

    expect(router.currentRoute.value.params.id).toBe('o1')
  })
})
