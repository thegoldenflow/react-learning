/**
 * 【并排】【较新·19.0 起】【常用】同一个表单用 Actions 写（频率：工程经验，19.0 起才有，React 19 项目的表单里常见）：<form action> + useActionState + useFormStatus。
 * 只演示和主线不同的地方；useOptimistic、action 抛错交给错误边界、Server Functions 等完整内容在 31 题（待新增）。
 *
 * 和手写版的差别：
 * - 不写 onSubmit / preventDefault / submitting / try-finally：isPending（useActionState）和
 *   pending（useFormStatus）由 React 维护，action 结束自动恢复；
 * - 输入框不受控（name + defaultValue），action 收到 FormData：useActionState 的 action 第一个参数是上一次的 state，
 *   「The submitted form data is therefore its second argument instead of its first」；
 * - 重复提交不会被丢弃，而是排队：「React queues and executes multiple calls to dispatchAction sequentially.
 *   Each call to reducerAction receives the result of the previous call」—— 同一轮里提交两次会创建两单，
 *   所以按钮照样要按 pending 禁用，服务端照样要幂等；
 * - action 成功（没有 throw）之后 React 会重置表单里的非受控字段，返回错误 state 也算成功。
 *   失败时要保住输入，就把提交的值放进返回的 state，再用 defaultValue 回填（「备注」故意没回填，失败后会被清空）。
 */
import { useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ApiFieldError, submitOrder } from '@/shared/mockApi'
import { createRequestLog, RequestLogPanel } from './requestLog'

interface FormValues {
  customer: string
  amount: string
}

interface ActionState {
  result:
    | { type: 'success'; orderNo: string }
    | { type: 'fieldError'; field: string; message: string }
    | { type: 'networkError'; message: string }
    | null
  /** 本次提交的值：失败时用来回填 defaultValue；成功时清空 */
  values: FormValues
}

const EMPTY_VALUES: FormValues = { customer: '', amount: '' }
const INITIAL_STATE: ActionState = { result: null, values: EMPTY_VALUES }

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

/**
 * useFormStatus 只能读到「父级 <form>」的状态：「must be called from a component that is rendered inside a <form>」，
 * 写在渲染 <form> 的那个组件里拿不到。所以按钮单独拆成子组件。
 */
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? '提交中…' : '创建订单'}
    </button>
  )
}

export function ActionSubmitForm({ delayMs = 800 }: { delayMs?: number }) {
  const [failNetwork, setFailNetwork] = useState(false)
  const [log] = useState(createRequestLog)
  const requestSeq = useRef(0)
  const formRef = useRef<HTMLFormElement>(null)

  /**
   * action 可以是 async 函数，在 Transition 里执行。
   * 可预期的错误（字段错误、网络错误）return 成 state；只有意料之外的错误才 throw ——
   * 「If dispatchAction throws an error, React cancels all queued actions and shows the nearest Error Boundary」（20 题）。
   */
  async function createOrderAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
    requestSeq.current += 1
    const id = requestSeq.current
    const values: FormValues = { customer: readText(formData, 'customer'), amount: readText(formData, 'amount') }
    log.add(`#${id} action 开始：${values.customer || '（空）'}，金额 ${values.amount || '（空）'}`)
    try {
      const order = await submitOrder(
        { customer: values.customer, amount: Number(values.amount) },
        { delayMs, failRate: failNetwork ? 1 : 0 },
      )
      log.add(`#${id} 成功：${order.orderNo}`)
      return { result: { type: 'success', orderNo: order.orderNo }, values: EMPTY_VALUES }
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误'
      log.add(`#${id} 失败：${message}`)
      if (err instanceof ApiFieldError) return { result: { type: 'fieldError', field: err.field, message }, values }
      return { result: { type: 'networkError', message }, values }
    }
  }

  const [state, formAction, isPending] = useActionState(createOrderAction, INITIAL_STATE)
  const { result, values } = state

  return (
    <div className="card stack">
      <h3>区块二：React 19 Actions【并排·19.0 起】</h3>
      <p className="muted">【较新·19.0 起】【常用】React 19 项目的表单里常见；手写 submitting（区块一）仍是最常用的写法。</p>
      <p className="muted">
        isPending（来自 useActionState）：{String(isPending)}。按钮的禁用状态来自子组件里的 useFormStatus。
      </p>

      {/* action 传函数时不用 preventDefault（「calling e.preventDefault() isn't needed」），也不用 onSubmit */}
      <form ref={formRef} className="stack" action={formAction} noValidate>
        {result?.type === 'networkError' && (
          <div role="alert" className="row">
            <span className="error-text">{result.message}</span>
            <button type="button" onClick={() => formRef.current?.requestSubmit()} disabled={isPending}>
              重试
            </button>
          </div>
        )}

        <label className="stack" style={{ gap: 4 }}>
          客户名称
          {/* 非受控 + defaultValue 回填：失败时 values 是刚提交的值，重置后输入框里还是它 */}
          <input name="customer" defaultValue={values.customer} placeholder="如：张伟" />
        </label>
        {result?.type === 'fieldError' && result.field === 'customer' && (
          <p className="error-text" style={{ margin: 0 }}>
            {result.message}
          </p>
        )}

        <label className="stack" style={{ gap: 4 }}>
          金额
          <input name="amount" defaultValue={values.amount} inputMode="decimal" placeholder="大于 0 的数字" />
        </label>
        {result?.type === 'fieldError' && result.field === 'amount' && (
          <p className="error-text" style={{ margin: 0 }}>
            {result.message}
          </p>
        )}

        <label className="stack" style={{ gap: 4 }}>
          备注（故意不回填）
          <input name="note" placeholder="失败后这里会被清空" />
        </label>

        <div className="row">
          <SubmitButton />
        </div>
      </form>

      {result?.type === 'success' && (
        <p role="status" className="success-text" style={{ margin: 0 }}>
          创建成功！新订单号：{result.orderNo}（非受控输入框已被 React 自动清空）
        </p>
      )}

      <div className="row">
        <label className="row" style={{ gap: 4 }}>
          <input type="checkbox" checked={failNetwork} onChange={(e) => setFailNetwork(e.target.checked)} />
          模拟网络失败
        </label>
        <button
          type="button"
          onClick={() => {
            formRef.current?.requestSubmit()
            formRef.current?.requestSubmit()
          }}
        >
          同一轮事件里提交两次
        </button>
      </div>

      <RequestLogPanel log={log} label="Actions 版请求日志" />
    </div>
  )
}
