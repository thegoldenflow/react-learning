/**
 * 06 题 Vue 侧的结论测试，和 react/Example.test.tsx 对照着看（vue 3.5.42，开发构建）。
 */
import { defineComponent, h, nextTick, ref, watch } from 'vue'
import { compileTemplate } from 'vue/compiler-sfc'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { PRODUCTS } from '@/shared/products'
import { INITIAL_ORDERS } from './demoData'
import Example from './Example.vue'
import KeyBugDemo from './KeyBugDemo.vue'
import KeyResetDemo from './KeyResetDemo.vue'
import ListBasicsDemo from './ListBasicsDemo.vue'
import RareVForDemo from './RareVForDemo.vue'

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
  const button = wrapper.findAll('button').find((b) => b.text().startsWith(text))
  if (!button) throw new Error(`找不到按钮「${text}」`)
  return button
}

describe('Vue 区块一：v-for + :key、computed 过滤排序', () => {
  const items = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('ul[aria-label="商品列表"] li').map((li) => li.text())

  it('computed 里先过滤再排序；排序前拷贝，没选筛选条件时排序也没改掉 PRODUCTS 的顺序', async () => {
    const wrapper = mount(ListBasicsDemo)
    const before = PRODUCTS.map((p) => p.id)
    await wrapper.get('select[aria-label="排序"]').setValue('price-asc')
    expect(items(wrapper)[0]).toBe('无线鼠标 · ￥129')
    expect(PRODUCTS.map((p) => p.id)).toEqual(before)

    await wrapper.get('select[aria-label="分类"]').setValue('显示器')
    expect(items(wrapper)).toEqual(['便携显示器 · ￥899', '4K 显示器 · ￥1999'])
    expect(PRODUCTS.map((p) => p.id)).toEqual(before)
  })

  it('v-if 写在外层容器上：显示器 + 库存 ≥ 10 件 → <ul> 整个不渲染，显示 v-else 的提示', async () => {
    const wrapper = mount(ListBasicsDemo)
    await wrapper.get('select[aria-label="分类"]').setValue('显示器')
    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.find('ul[aria-label="商品列表"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('没有符合条件的商品')
  })

  it('<template v-for> 的 :key 写在 template 上：一项两行 <tr>，平铺在 <tbody> 里，DOM 里没有 template 这一层', () => {
    const wrapper = mount(ListBasicsDemo)
    const tbody = wrapper.get('table[aria-label="库存明细"] tbody').element
    expect(tbody.children).toHaveLength(PRODUCTS.length * 2)
    expect([...tbody.children].slice(0, 2).map((tr) => tr.textContent!.replace(/\s+/g, ''))).toEqual(['机械键盘￥399', '库存12件'])
    expect(tbody.querySelector('template')).toBeNull()
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  it('v-if 与 v-for 写在同一个元素上：v-if 先求值（包在 renderList 外面），读的是 _ctx.todo 而不是循环变量；挪进 <template v-for> 里面才在循环内', () => {
    const same = compile('<ul><li v-for="todo in todos" v-if="!todo.isDone" :key="todo.id">{{ todo.name }}</li></ul>')
    expect(same).toContain('(!_ctx.todo.isDone)')
    expect(same.indexOf('(!_ctx.todo.isDone)')).toBeLessThan(same.indexOf('_renderList('))

    const wrapped = compile('<ul><template v-for="todo in todos" :key="todo.id"><li v-if="!todo.isDone">{{ todo.name }}</li></template></ul>')
    expect(wrapped).toContain('(!todo.isDone)')
    expect(wrapped.indexOf('(!todo.isDone)')).toBeGreaterThan(wrapped.indexOf('_renderList('))
    expect(wrapped).not.toContain('_ctx.todo.')
  })
})

describe('Vue 区块二：:key 是身份', () => {
  /** 在前两行的备注框里各打一段字，然后点某个按钮，返回每一行「订单号 → 备注」 */
  async function run(keyMode: 'none' | 'index' | 'id' | 'random', action: string) {
    const wrapper = mount(KeyBugDemo)
    await wrapper.get('select[aria-label="key 的取法"]').setValue(keyMode)
    // 非受控输入：setValue 只是改 DOM 上的 value，和用户打字一样，Vue 的数据里没有它
    await wrapper.get('input[aria-label="SO-1001 的备注"]').setValue('加急')
    await wrapper.get('input[aria-label="SO-1002 的备注"]').setValue('送礼')
    await buttonByText(wrapper, action).trigger('click')
    const notes = Object.fromEntries(
      wrapper.findAll('tbody input').map((input) => [input.attributes('aria-label')!.replace(' 的备注', ''), (input.element as HTMLInputElement).value]),
    )
    return { wrapper, notes }
  }

  it('不写 :key（就地更新）：开头插入一行，备注跑到了新插入的行上，运行时没有任何警告', async () => {
    const { notes } = await run('none', '开头插入一行')
    expect(Object.values(notes).slice(0, 3)).toEqual(['加急', '送礼', ''])
    expect(notes['SO-1001']).toBe('送礼')
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  it(':key 用 index：开头插入一行错位；删除第一行，第一行的备注留给了下一个订单', async () => {
    const inserted = await run('index', '开头插入一行')
    expect(inserted.notes['SO-1001']).toBe('送礼')
    inserted.wrapper.unmount()
    const removed = await run('index', '删除第一行')
    expect(removed.notes['SO-1002']).toBe('加急')
  })

  it(':key 用 index：只在末尾追加时，已有下标不变，不会错位', async () => {
    const { notes } = await run('index', '末尾追加一行')
    expect(notes).toMatchObject({ 'SO-1001': '加急', 'SO-1002': '送礼' })
  })

  it(':key 用 id：开头插入一行，备注还在原来那一行；新行的 id 在创建数据时生成，重渲染后新行里的输入留得住', async () => {
    const { wrapper, notes } = await run('id', '开头插入一行')
    expect(notes).toMatchObject({ 'SO-1001': '加急', 'SO-1002': '送礼' })
    const fresh = wrapper.findAll('tbody input')[0]
    expect(fresh.attributes('aria-label')).toMatch(/^NEW-\d+ 的备注$/)
    await fresh.setValue('新客户要发票')
    await buttonByText(wrapper, '让列表重渲染').trigger('click')
    expect(wrapper.findAll('tbody input')[0].element).toBe(fresh.element)
    expect((fresh.element as HTMLInputElement).value).toBe('新客户要发票')
  })

  it(':key 用 id：删除第一行，其余行的备注都留在自己那一行', async () => {
    const { notes } = await run('id', '删除第一行')
    expect(notes).not.toHaveProperty('SO-1001')
    expect(notes['SO-1002']).toBe('送礼')
  })

  it(':key 用 Math.random()：一次普通的重渲染就把所有行重建，输入全丢', async () => {
    const { notes } = await run('random', '让列表重渲染')
    expect(notes).toMatchObject({ 'SO-1001': '', 'SO-1002': '' })
  })

  it('变更方法 unshift / push / splice 直接触发更新；初始值拷贝过，模块常量没被改，「重置列表」回得去', async () => {
    const wrapper = mount(KeyBugDemo)
    const rows = () => wrapper.findAll('tbody tr').map((tr) => tr.find('td').text())
    await buttonByText(wrapper, '开头插入一行').trigger('click')
    await buttonByText(wrapper, '末尾追加一行').trigger('click')
    expect(rows()).toHaveLength(6)
    expect(rows()[0]).toMatch(/^NEW-/)
    await buttonByText(wrapper, '删除第一行').trigger('click')
    expect(rows()[0]).toBe('SO-1001')
    expect(INITIAL_ORDERS).toHaveLength(4)
    await buttonByText(wrapper, '重置列表').trigger('click')
    expect(rows()).toEqual(['SO-1001', 'SO-1002', 'SO-1003', 'SO-1004'])
  })

  it('ref 装数组时代理的是原数组：不拷贝就调变更方法，改掉的是原来那个数组', () => {
    const source = ['a', 'b']
    const list = ref(source)
    list.value.push('c')
    expect(source).toEqual(['a', 'b', 'c'])
  })

  it('重复 key：挂载、末尾追加时不检查；更新时走到乱序比较才警告，界面也会出错（多出一个节点）', async () => {
    const keys = ref(['a', 'a'])
    const Dup = defineComponent(() => () => h('ul', keys.value.map((k) => h('li', { key: k }, k))))
    const wrapper = mount(Dup)
    keys.value = ['a', 'a', 'b']
    await nextTick()
    expect(consoleWarn).not.toHaveBeenCalled()

    keys.value = ['b', 'x', 'a', 'a']
    await nextTick()
    expect(consoleWarn).toHaveBeenCalledTimes(1)
    expect(consoleWarn.mock.calls[0].slice(0, 3)).toEqual(['[Vue warn]: Duplicate keys found during update:', '"a"', 'Make sure keys are unique.'])
    // 数据是 4 项，DOM 里是 5 个 <li>：「Duplicate keys will cause render errors.」
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual(['a', 'b', 'x', 'a', 'a'])
  })
})

describe('Vue 区块三：换 :key = 换一个实例', () => {
  it('不换 :key：实例被复用，草稿残留；换 :key：新实例，草稿重新初始化；watch：同一个实例，草稿被改回初始值', async () => {
    const wrapper = mount(KeyResetDemo)
    for (const testId of ['without-key', 'with-key', 'with-watch']) {
      const box = wrapper.get(`[data-testid="${testId}"] textarea`)
      await box.setValue(`${(box.element as HTMLTextAreaElement).value}加急`)
    }
    const watchBox = wrapper.get('[data-testid="with-watch"] textarea').element
    await buttonByText(wrapper, 'SO-1002').trigger('click')

    const panel = (testId: string) => ({
      draft: (wrapper.get(`[data-testid="${testId}"] textarea`).element as HTMLTextAreaElement).value,
      status: wrapper.get(`[data-testid="${testId}"] [data-testid="instance-status"]`).text(),
    })
    expect(panel('without-key')).toEqual({ draft: '张伟的备注：加急', status: '被复用的实例：草稿还是 SO-1001 的' })
    expect(panel('with-key')).toEqual({ draft: '李娜的备注：', status: '新实例：草稿按新订单重新初始化' })
    expect(panel('with-watch')).toEqual({ draft: '李娜的备注：', status: '同一个实例（创建时是 SO-1001），草稿由 watch 重置' })
    // watch 这一块的 textarea 还是原来那个 DOM 元素（实例没换）
    expect(wrapper.get('[data-testid="with-watch"] textarea').element).toBe(watchBox)
  })

  it('watch 默认在组件更新之前执行：换订单后子组件只渲染一次，没有「新订单 + 旧草稿」这一帧', async () => {
    const renders: string[] = []
    const Child = defineComponent({
      props: { orderNo: { type: String, required: true } },
      setup(props) {
        const draft = ref(`${props.orderNo} 的草稿`)
        watch(
          () => props.orderNo,
          (next) => {
            draft.value = `${next} 的草稿`
          },
        )
        return () => {
          renders.push(`${props.orderNo}|${draft.value}`)
          return h('p', draft.value)
        }
      },
    })
    const orderNo = ref('SO-1001')
    const Parent = defineComponent(() => () => h(Child, { orderNo: orderNo.value }))
    mount(Parent)
    renders.length = 0
    orderNo.value = 'SO-1002'
    await nextTick()
    expect(renders).toEqual(['SO-1002|SO-1002 的草稿'])
  })
})

describe('附 6【少用】v-for 的其他写法（RareVForDemo.vue，页面上已注释）', () => {
  it('of 分隔符、遍历对象 (value, key, index)、范围从 1 开始、解构', () => {
    const wrapper = mount(RareVForDemo)
    expect(wrapper.findAll('ul[aria-label="of 分隔符"] li').map((li) => li.text())).toEqual(['机械键盘', '无线鼠标', '4K 显示器'])
    expect(wrapper.findAll('ul[aria-label="配送规则"] li').map((li) => li.text())).toEqual(['1. 满额包邮：满 99 元', '2. 发货时间：48 小时内', '3. 退货期：7 天'])
    expect(wrapper.get('[data-testid="range"]').text()).toBe('评分：12345')
    expect(wrapper.findAll('ul[aria-label="解构"] li')[0].text()).toBe('机械键盘（￥399）')
  })
})

it('整页挂载：三个区块都在，没有 [Vue warn]', () => {
  const wrapper = mount(Example)
  expect(wrapper.findAll('h3').map((h3) => h3.text().slice(0, 3))).toEqual(['区块一', '区块二', '区块三'])
  expect(consoleWarn).not.toHaveBeenCalled()
})
