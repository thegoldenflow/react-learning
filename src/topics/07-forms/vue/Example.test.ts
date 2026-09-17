/**
 * 07 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看。
 * 用 @vue/test-utils 挂载（Vue 官方推荐），元素查询和用户操作借用 Testing Library 与 user-event，
 * 所以挂到 document.body 上（attachTo），每个用例结束自动卸载。测试写法在 34 题（待新增）详细讲。
 * Vue 的 DOM 更新是异步批量的：操作之后先 flushPromises()，再断言页面内容。
 */
import { defineComponent, h, ref } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { fireEvent, within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import ControlledProfileForm from './ControlledProfileForm.vue'
import InputEventLab from './InputEventLab.vue'
import TextField from './TextField.vue'
import UncontrolledContactForm from './UncontrolledContactForm.vue'
import Example from './Example.vue'

enableAutoUnmount(afterEach)

/** 挂载到 body，返回 Testing Library 的查询对象 */
function setup(component: Parameters<typeof mount>[0], options: Parameters<typeof mount>[1] = {}) {
  const wrapper = mount(component, { ...options, attachTo: document.body })
  return { wrapper, ui: within(wrapper.element as HTMLElement), user: userEvent.setup({ delay: null }) }
}

describe('受控：v-model（ControlledProfileForm.vue）', () => {
  it('v-model 按元素类型写回 form；type="number" 自动转成数字、清空是空串；.trim 去掉首尾空格', async () => {
    const { ui, user } = setup(ControlledProfileForm)

    await user.clear(ui.getByLabelText('姓名'))
    await user.type(ui.getByLabelText('姓名'), '王五')
    await user.type(ui.getByLabelText('年龄'), '28')
    await user.selectOptions(ui.getByLabelText('角色'), 'admin')
    await user.type(ui.getByLabelText('简介'), '  前端  ')
    await user.click(ui.getByLabelText('电话'))
    await user.click(ui.getByLabelText('订阅通知'))
    await flushPromises()

    const state = ui.getByText(/实时 state/)
    expect(state).toHaveTextContent('"name":"王五"')
    expect(state).toHaveTextContent('"age":28,')
    expect(state).toHaveTextContent('"role":"admin"')
    expect(state).toHaveTextContent('"bio":"前端"')
    expect(state).toHaveTextContent('"contact":"phone"')
    expect(state).toHaveTextContent('"subscribe":false')

    await user.clear(ui.getByLabelText('年龄'))
    await flushPromises()
    expect(state).toHaveTextContent('"age":"",')
  })

  it('输入过滤：:value + @input 在拒绝时手动改回 DOM，字母被弹回', async () => {
    const { ui, user } = setup(ControlledProfileForm)

    await user.type(ui.getByLabelText('手机号'), '138a0')
    await flushPromises()

    expect(ui.getByLabelText('手机号')).toHaveValue('1380')
  })

  it('提交失败：aria-invalid、aria-describedby 读出错误，焦点移到第一个出错的字段', async () => {
    const { ui, user } = setup(ControlledProfileForm)

    await user.clear(ui.getByLabelText('姓名'))
    await user.click(ui.getByLabelText('电话'))
    await user.click(ui.getByRole('button', { name: '保存' }))
    await flushPromises()

    const name = ui.getByLabelText('姓名')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('姓名不能为空')
    expect(name).toHaveFocus()
    expect(ui.getByLabelText('手机号')).toHaveAccessibleDescription(/只收数字.*手机号要填满 11 位/)
  })
})

describe('defineModel 与 useId（TextField.vue）', () => {
  it('defineModel：子组件里的输入写回父组件；useId 让两个实例的 id 不同，默认前缀是 v', async () => {
    const Parent = defineComponent(() => {
      const a = ref('初始值')
      const b = ref('')
      return () =>
        h('div', [
          h(TextField, { label: '甲', name: 'a', modelValue: a.value, 'onUpdate:modelValue': (v: string) => (a.value = v) }),
          h(TextField, { label: '乙', name: 'b', modelValue: b.value, 'onUpdate:modelValue': (v: string) => (b.value = v) }),
          h('p', `父组件里的 a：${a.value}`),
        ])
    })
    const { ui, user } = setup(Parent)

    const a = ui.getByLabelText('甲')
    expect(a).toHaveValue('初始值')
    await user.type(a, '（改）')
    await flushPromises()
    expect(ui.getByText(/父组件里的 a/)).toHaveTextContent('父组件里的 a：初始值（改）')

    const b = ui.getByLabelText('乙')
    expect(a.id).not.toBe(b.id)
    expect(a.id).toMatch(/^v-/)
  })

  it('一页多个 Vue 应用：app.config.idPrefix 改掉 useId 的前缀', () => {
    const { ui } = setup(TextField, {
      props: { label: '丙', name: 'c', modelValue: '' },
      global: { config: { idPrefix: 'admin' } },
    })

    expect(ui.getByLabelText('丙').id).toMatch(/^admin-/)
  })
})

describe('v-model 和 React 受控输入的差别（InputEventLab.vue）', () => {
  it('v-model 每次 input 事件都更新（不等失焦）；原生 change 要等失焦才触发', async () => {
    const { ui, user } = setup(InputEventLab)
    const log = ui.getByRole('list', { name: '输入事件日志' })

    await user.type(ui.getByLabelText('实验输入框'), 'ab')
    await flushPromises()
    expect(ui.getByText(/v-model 的值：/)).toHaveTextContent('v-model 的值：ab')
    expect(log).not.toHaveTextContent('原生 change')

    await user.tab()
    await flushPromises()
    expect(log).toHaveTextContent('原生 change：ab')
  })

  it('输入法拼写期间 v-model 不更新，compositionend 之后才更新（React 的 onChange 拼写期间照样触发）', async () => {
    const { ui } = setup(InputEventLab)
    const input = ui.getByLabelText('实验输入框')

    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: 'ni' } })
    await flushPromises()
    expect(ui.getByText(/v-model 的值：/)).toHaveTextContent('v-model 的值：（空）')
    expect(ui.getByRole('list', { name: '输入事件日志' })).toHaveTextContent('输入框里是「ni」，v-model 的值是「」')

    fireEvent.compositionEnd(input, { target: { value: '你好' }, data: '你好' })
    await flushPromises()
    expect(ui.getByText(/v-model 的值：/)).toHaveTextContent('v-model 的值：你好')
  })

  it('v-model 的写入被拒绝时不会改回 DOM（字母留在输入框）；:value + @input 手动改回才会弹回', async () => {
    const { ui, user } = setup(InputEventLab)

    const bad = ui.getByLabelText('反例：v-model + 会拒绝的 computed')
    await user.type(bad, '12a')
    await flushPromises()
    expect(bad).toHaveValue('12a')
    expect(ui.getByText(/字母没写进 state/)).toHaveTextContent('state：12 ——')

    const good = ui.getByLabelText('正确：:value + @input 手动改回')
    await user.type(good, '12a')
    await flushPromises()
    expect(good).toHaveValue('12')
  })
})

describe('非受控（UncontrolledContactForm.vue）', () => {
  const submitButton = (ui: ReturnType<typeof setup>['ui']) => ui.getByRole('button', { name: '提交（读 FormData）' })

  it('静态属性就是初始值：<option selected>、<textarea> 里的文字在 Vue 模板里照常生效', () => {
    const { ui } = setup(UncontrolledContactForm, { props: { saveDelayMs: 0 } })

    expect(ui.getByLabelText('姓名')).toHaveValue('周未名')
    expect(ui.getByLabelText('角色')).toHaveValue('viewer')
    expect(ui.getByLabelText('备注')).toHaveValue('展会上交换的名片')
    expect(ui.getByLabelText('订阅通知')).toBeChecked()
  })

  it('FormData 只包含有 name 的字段；await 之后 e.currentTarget 是 null（DOM 事件本身的规则）', async () => {
    const { ui, user } = setup(UncontrolledContactForm, { props: { saveDelayMs: 0 } })

    await user.click(submitButton(ui))

    await vi.waitFor(() =>
      expect(ui.getByText(/FormData 里的字段/)).toHaveTextContent(
        'FormData 里的字段：quickName、quickEmail、quickRole、quickNote、quickSubscribe（',
      ),
    )
    expect(ui.getByText(/await 之后读 e.currentTarget/)).toHaveTextContent('null')
  })

  it('保留浏览器原生校验：必填的姓名清空后提交被拦下；换 :key 重新挂载，静态初始值回来', async () => {
    const { ui, user } = setup(UncontrolledContactForm, { props: { saveDelayMs: 0 } })

    await user.clear(ui.getByLabelText('姓名'))
    await user.click(submitButton(ui))
    await new Promise((resolve) => setTimeout(resolve, 20))
    await flushPromises()
    expect(ui.getByLabelText('姓名')).toBeInvalid()
    expect(ui.queryByText(/已提交/)).not.toBeInTheDocument()

    await user.click(ui.getByRole('button', { name: /换 key 重新挂载/ }))
    await flushPromises()
    expect(ui.getByLabelText('姓名')).toHaveValue('周未名')
  })

  it(':value 是持续绑定：用户改过之后，组件任何一次重新渲染都会把绑定值写回（绑定值没变也一样）', async () => {
    const { ui, user } = setup(UncontrolledContactForm, { props: { saveDelayMs: 0 } })
    const suggested = ui.getByLabelText('建议姓名')

    await user.clear(suggested)
    await user.type(suggested, '我自己填的')
    await flushPromises()
    expect(suggested).toHaveValue('我自己填的')

    await user.click(ui.getByRole('button', { name: /只让组件重新渲染/ }))
    await flushPromises()
    expect(suggested).toHaveValue('周未名')
  })
})

describe('Example 入口', () => {
  it('三个区块都渲染出来', () => {
    const { ui } = setup(Example)

    expect(ui.getByRole('heading', { name: /区块一：受控表单/ })).toBeInTheDocument()
    expect(ui.getByRole('heading', { name: /区块二：非受控表单/ })).toBeInTheDocument()
    expect(ui.getByRole('heading', { name: /区块三：v-model 什么时候更新/ })).toBeInTheDocument()
  })
})
