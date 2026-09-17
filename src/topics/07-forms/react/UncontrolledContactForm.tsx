/**
 * 【主线：非受控】快速新增联系人。没有任何 state 保存输入内容：值由 DOM 自己保管，
 * 只在需要的那一刻读一次 —— 提交时 new FormData(表单)，或者 ref.current.value。
 *
 * 本文件演示：
 * - defaultValue / defaultChecked 只给初始值（<input>、<select>、<textarea> 都一样）；
 * - FormData 一次读出全部字段：字段必须有 name；没勾选的 checkbox 在 FormData 里没有这个 key；
 * - FormData.get() 返回 string | File | null，要先收窄；
 * - e.currentTarget 在事件处理函数返回后被置为 null：异步保存之前，先把表单节点和数据取出来；
 * - 浏览器原生校验（required）：不合法时浏览器直接拦下提交，onSubmit 不会执行；
 * - defaultValue 改了，用户碰过的输入框不会跟着变；换 key 让表单重新挂载，新的默认值才生效。
 *
 * 输入时这个组件一次都不重新渲染（Example.test.tsx 用 <Profiler> 数过），这是非受控最直接的收益。
 * Vue 对照：vue/UncontrolledContactForm.vue（静态 value 属性 + FormData + useTemplateRef）。
 */
import { useRef, useState, type SubmitEvent } from 'react'

/** 提交那一刻读到的字段 —— 注意这里没有「输入过程中的值」，只有提交时的快照 */
interface QuickContact {
  name: string
  email: string
  role: string
  note: string
  subscribe: boolean
}

interface SubmitReport {
  contact: QuickContact
  /** FormData 里实际有哪些字段（没写 name、没勾选的都不在里面） */
  keys: string[]
  /** await 之后再读 e.currentTarget 得到什么 */
  currentTargetAfterAwait: string
}

/** 「换默认姓名」实验用的候选值 */
const DEFAULT_NAME_POOL = ['周未名', '陈阿四', '孙小圣']

/**
 * FormData.get() 的返回类型是 string | File | null：文件输入框给 File，字段不存在给 null。
 * 先收窄再用 —— 直接 String(value) 遇到文件会得到 "[object File]"。
 */
function readText(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/** 演示简化：模拟一次异步保存（真实项目是请求接口，loading 与防重复见 19 题） */
function fakeSave(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs))
}

export function UncontrolledContactForm({ saveDelayMs = 300 }: { saveDelayMs?: number }) {
  // 划重点：下面没有任何一个 state 存着输入框的内容
  const [report, setReport] = useState<SubmitReport | null>(null)
  // 「用 ref 读姓名」的结果；null 表示还没读过
  const [peeked, setPeeked] = useState<string | null>(null)
  // 「换默认姓名」实验：改这个下标，传给 defaultValue 的字符串就变了
  const [defaultNameIndex, setDefaultNameIndex] = useState(0)
  // 「换 key」实验：key 一变，React 丢掉旧的 <form> 子树，重新挂载一份
  const [formKey, setFormKey] = useState(0)

  // 取值方式二：ref 拿到真实 DOM 节点，读 .value（12 题讲 useRef 的这个用途）。
  // 和 FormData 的区别：FormData 一次读全部字段，ref 适合只读某一个字段
  const nameInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    // 取值方式一：new FormData(表单节点)，一次读出所有带 name 的字段（官方示例写 e.target，提交事件的 target 就是表单）。
    // 这两行必须在 await 之前：React 派发完事件就把 e.currentTarget 置成 null
    // （react-dom 19.2.8 的 executeDispatch 里 `event.currentTarget = null`），async 函数在第一个 await 处就已经返回了。
    const form = e.currentTarget
    const formData = new FormData(form)
    const contact: QuickContact = {
      name: readText(formData, 'quickName'),
      email: readText(formData, 'quickEmail'),
      role: readText(formData, 'quickRole'),
      note: readText(formData, 'quickNote'),
      // checkbox 的原生规则：没勾选时 FormData 里没有这个 key（get 返回 null）；
      // 勾选了但 <input> 没写 value 属性时，值是字符串 'on'。所以判断「有没有」即可。
      subscribe: formData.get('quickSubscribe') !== null,
    }

    await fakeSave(saveDelayMs)

    // 类型声明里 currentTarget 不会是 null，但运行到这里时它已经被置空了 —— 这正是要演示的坑
    const after = (e.currentTarget as HTMLFormElement | null) === null ? 'null' : '仍然是 <form>'
    setReport({ contact, keys: Array.from(formData.keys()), currentTargetAfterAwait: after })
    setPeeked(null)
  }

  function handlePeek() {
    // 挂载前 .current 是 null，所以用 ?. 再 ?? 兜底
    setPeeked(nameInputRef.current?.value ?? '')
  }

  return (
    <div className="card stack">
      <h3>区块二：非受控表单【主线】—— 快速新增联系人</h3>
      <p className="muted">
        这个表单没有任何 state 存输入内容：输入时组件不重新渲染，点「提交」的那一刻才从 DOM 里把值读出来。
      </p>

      {/* key={formKey}：key 变了，React 把整个 <form> 卸载再重新挂载 —— 让 defaultValue 重新生效的标准做法。
          没有 noValidate：保留浏览器原生校验，姓名清空后点提交，浏览器会拦下来，handleSubmit 不会执行。 */}
      <form key={formKey} className="stack" onSubmit={handleSubmit}>
        <label className="row">
          姓名
          {/* defaultValue 只在这个 input 首次挂载时写进 DOM，之后值由 DOM 自己管。
              name 是 FormData 的键，漏写就读不到；required 交给浏览器校验。 */}
          <input ref={nameInputRef} name="quickName" defaultValue={DEFAULT_NAME_POOL[defaultNameIndex]} required />
        </label>
        <label className="row">
          邮箱
          <input name="quickEmail" type="email" defaultValue="weiming@example.com" />
        </label>
        <label className="row">
          角色
          {/* 非受控的 select 用 <select defaultValue>，同样不能给 <option> 写 selected */}
          <select name="quickRole" defaultValue="viewer">
            <option value="admin">管理员</option>
            <option value="editor">编辑</option>
            <option value="viewer">只读访客</option>
          </select>
        </label>
        <label className="stack" style={{ gap: 4 }}>
          备注
          {/* 非受控的 textarea 用 defaultValue，不能写成 <textarea>初始文字</textarea> */}
          <textarea name="quickNote" rows={2} defaultValue="展会上交换的名片" />
        </label>
        <label className="row">
          来源（故意没写 name）
          <input defaultValue="这个字段不会出现在 FormData 里" />
        </label>
        <label className="row">
          {/* checkbox 的非受控写法是 defaultChecked，不是 defaultValue */}
          <input name="quickSubscribe" type="checkbox" defaultChecked />
          订阅通知
        </label>
        <div className="row">
          <button type="submit" className="btn-primary">
            提交（读 FormData）
          </button>
          <button type="button" onClick={handlePeek}>
            用 ref 读姓名
          </button>
        </div>
      </form>

      {peeked !== null && <p className="muted">ref 读到的姓名：{peeked === '' ? '（空）' : peeked}</p>}

      {report !== null && (
        <div className="stack" style={{ gap: 4 }}>
          <p className="success-text" style={{ margin: 0 }}>
            已提交（演示：没有真的发请求）
          </p>
          <p style={{ margin: 0 }}>
            {report.contact.name || '（未填写）'} · {report.contact.email || '（未填写）'} · {report.contact.role} ·
            备注：{report.contact.note || '无'} · {report.contact.subscribe ? '已订阅' : '未订阅'}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            FormData 里的字段：{report.keys.join('、')}（「来源」没有 name，不在里面；取消勾选订阅再提交，quickSubscribe 也会消失）
          </p>
          <p className="muted" style={{ margin: 0 }}>
            await 之后读 e.currentTarget：{report.currentTargetAfterAwait}（所以要在 await 之前把表单节点取出来）
          </p>
        </div>
      )}

      {/*
        「换默认姓名」实验（Vue 老手容易踩）：defaultValue 是初始值，不是一条能随时改的绑定。
        机制：React 把它写成 DOM 的默认值（value 属性）；输入框一旦被用户改过（HTML 规范的 dirty value flag），
        显示的内容就和默认值脱钩了。所以用户改过一个字之后，defaultNameIndex 再怎么变，输入框都不动。
        输入框还没被碰过时，改 defaultValue 会看到内容跟着变 —— 那只是还没脱钩，不是绑定，所以实验要先改一个字。
        要让新的默认值无条件生效：换 key 重新挂载（第二个按钮），或者改成受控。
        Vue 里长得像的 :value="xxx" 是持续绑定，行为正好相反（vue/UncontrolledContactForm.vue）。
      */}
      <div className="row">
        <button type="button" onClick={() => setDefaultNameIndex((i) => (i + 1) % DEFAULT_NAME_POOL.length)}>
          换默认姓名
        </button>
        <button type="button" onClick={() => setFormKey((k) => k + 1)}>
          换 key 重新挂载
        </button>
      </div>
      <p className="muted">
        当前传给 defaultValue 的值：{DEFAULT_NAME_POOL[defaultNameIndex]}。步骤：先在姓名框里改一个字，再点「换默认姓名」——
        输入框不动；再点「换 key 重新挂载」，新的默认值才出现。
      </p>

      <p className="muted">
        并排【主流·React 19.0 起】：也可以写 {'<form action={fn}>'}，fn 直接收到 FormData、在 Transition 里执行，
        不用 preventDefault；action 成功后 React 会把这些非受控字段重置成默认值（受控字段不会被重置）。
        配合 useActionState / useFormStatus 的完整写法在 31 题（待新增）。
      </p>
    </div>
  )
}
