/**
 * 【主线】手写提交状态：useState 驱动界面 + useRef 锁防同一轮重入 + try / catch / finally。
 * React 18 和 19 都能用，面试最常问的就是这一套。React 19 的 Actions 写法在 ActionSubmitForm.tsx（并排）。
 *
 * 本文件演示：
 * - submitting 布尔 + result 判别联合：结果只可能是「成功 / 字段错误 / 网络错误」之一，不会同时显示两条提示；
 * - 防重复三道关：按钮 disabled（界面）【最常用】→ state 守卫【常用】→ useRef 锁【常用】（同一轮事件里的重入，state 守卫拦不住）；
 * - 错误分层：服务端字段错误显示在字段旁（aria-describedby，改了输入再提交）；网络错误显示在表单上方
 *   （role="alert"，给「重试」按钮）；
 * - 成功清空、失败保留输入；submitting 在 finally 里恢复；
 * - 请求日志：每一次真正发出的请求记一行，拦下的重复提交也记一行。
 *
 * Vue 对照：vue/ManualSubmitForm.vue（ref 是同步读写的，同一轮事件里的第二次提交读到的已经是 true，不需要额外的锁）。
 */
import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import { ApiFieldError, submitOrder } from '@/shared/mockApi'
import { createRequestLog, RequestLogPanel } from './requestLog'

type Field = 'customer' | 'amount'

/**
 * 提交结果：null 表示还没有结果。用判别联合（29 题），每种结果只带自己需要的字段。
 * 也可以把 submitting 并进来，写成 status: 'idle' | 'submitting' | 'success' | 'error' 一个联合；
 * 这里把 submitting 单独拿出来，是因为它要同时驱动 disabled 和守卫；合成一个 status 联合也很常见（练习 1）—— 两种都常见，按团队约定。
 */
type SubmitResult =
  | { type: 'success'; orderNo: string }
  | { type: 'fieldError'; field: Field; message: string }
  | { type: 'networkError'; message: string }

function isField(value: string): value is Field {
  return value === 'customer' || value === 'amount'
}

export function ManualSubmitForm({ delayMs = 800 }: { delayMs?: number }) {
  // 受控输入（07 题）。金额用字符串存，提交时再 Number()：空串、写了一半的数字都能原样保留
  const [customer, setCustomer] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)

  // 演示开关：请求模拟网络失败；去掉 useRef 锁（反例）
  const [failNetwork, setFailNetwork] = useState(false)
  const [withoutLock, setWithoutLock] = useState(false)

  const [log] = useState(createRequestLog)

  /**
   * useRef 锁：改 .current 同步生效，也不会触发重新渲染（12 题）。
   * state 做不到这一点：「A state variable's value never changes within a render, even if its event handler's code
   * is asynchronous」—— 同一轮事件里第二次进入 handleSubmit，读到的 submitting 还是这次渲染的旧值 false。
   */
  const lockRef = useRef(false)
  const requestSeq = useRef(0)
  const formRef = useRef<HTMLFormElement>(null)
  const customerRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const customerId = useId()
  const amountId = useId()
  const fieldError = (field: Field) => (result?.type === 'fieldError' && result.field === field ? result.message : '')

  /**
   * 字段错误出现后，把焦点移到出错的输入框（07 题）。
   * 不能在 catch 里直接 focus：那时 setSubmitting(false) 还没生效，输入框仍是 disabled，focus() 不起作用；
   * 放在 effect 里，等这次渲染提交、输入框解除禁用之后再聚焦。这是「让 DOM 和 state 保持同步」，属于 effect 的正当用途（10 题）。
   */
  useEffect(() => {
    if (result?.type !== 'fieldError') return
    const target = result.field === 'customer' ? customerRef : amountRef
    target.current?.focus()
  }, [result])

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    // 第二道关：state 守卫。只对「上一次提交之后已经重新渲染过」的事件有效
    if (submitting) {
      log.add('重复提交被 state 守卫拦下')
      return
    }
    // 第三道关：useRef 锁。同一轮事件里连续进入两次（比如代码连着调用两次 requestSubmit），
    // 两次读到的 submitting 都是 false，只有同步生效的 ref 能拦住第二次
    if (!withoutLock) {
      if (lockRef.current) {
        log.add('重复提交被 useRef 锁拦下')
        return
      }
      lockRef.current = true
    }

    requestSeq.current += 1
    const id = requestSeq.current
    setSubmitting(true)
    setResult(null) // 清掉上一次的提示，免得旧提示在新请求期间还挂着
    log.add(`#${id} 发出请求：${customer || '（空）'}，金额 ${amount || '（空）'}`)

    try {
      const order = await submitOrder(
        { customer, amount: Number(amount) },
        { delayMs, failRate: failNetwork ? 1 : 0 },
      )
      setResult({ type: 'success', orderNo: order.orderNo })
      // 成功清空，方便录入下一单（受控字段要自己清；需要跳转的话在这里 navigate，18 题）
      setCustomer('')
      setAmount('')
      log.add(`#${id} 成功：${order.orderNo}`)
    } catch (err) {
      // 失败保留输入。可预期的错误放进 state 渲染出来，不要 throw：错误边界接不住事件处理函数里的错误（20 题）
      if (err instanceof ApiFieldError && isField(err.field)) {
        setResult({ type: 'fieldError', field: err.field, message: err.message })
      } else {
        setResult({ type: 'networkError', message: err instanceof Error ? err.message : '未知错误' })
      }
      log.add(`#${id} 失败：${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      // 恢复必须放在 finally：只写在 try 末尾的话，请求一失败 submitting 就一直是 true，表单卡死
      setSubmitting(false)
      lockRef.current = false
    }
  }

  /**
   * 实验：同一轮事件里连续提交两次。requestSubmit() 和点提交按钮一样触发 submit 事件（也会先做原生校验）。
   * 真实用户双击走不到这一步：两次点击是两个独立的事件，第一次点击之后 React 已经重新渲染、按钮已经禁用
   * （Chrome 实测，见 docs/upgrade/PROGRESS.md 2.4）。useRef 锁防的是「同一轮里被调用两次」这类代码路径。
   */
  function submitTwiceInOneTurn() {
    formRef.current?.requestSubmit()
    formRef.current?.requestSubmit()
  }

  return (
    <div className="card stack">
      <h3>区块一：手写 submitting【主线】</h3>
      <p className="muted">
        提交中 + 防连点：submitting + disabled【最常用】；处理函数里的 state 守卫、useRef 锁【常用】（按钮以外的提交入口、同一轮里被调用两次才用得上）。
      </p>

      <form ref={formRef} className="stack" noValidate onSubmit={handleSubmit}>
        {result?.type === 'networkError' && (
          // role="alert"：出现时读屏软件马上读出来
          <div role="alert" className="row">
            <span className="error-text">{result.message}</span>
            {/* 网络错误原样重试有意义；字段错误要先改输入，不给重试按钮 */}
            <button type="button" onClick={() => formRef.current?.requestSubmit()} disabled={submitting}>
              重试
            </button>
          </div>
        )}

        <div className="stack" style={{ gap: 4 }}>
          <label htmlFor={customerId}>客户名称</label>
          <input
            id={customerId}
            ref={customerRef}
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="如：张伟"
            // 提交中禁用输入框：避免「请求发出后又改了内容，成功时被清空」。也有产品选择不禁用，按需取舍
            disabled={submitting}
            aria-invalid={fieldError('customer') ? true : undefined}
            aria-describedby={fieldError('customer') ? `${customerId}-error` : undefined}
          />
          {fieldError('customer') && (
            <p id={`${customerId}-error`} className="error-text" style={{ margin: 0 }}>
              {fieldError('customer')}
            </p>
          )}
        </div>

        <div className="stack" style={{ gap: 4 }}>
          <label htmlFor={amountId}>金额</label>
          {/* 金额用 type="text" + inputMode="decimal"：手机上弹数字键盘，value 保留用户输入的原文。
              type="number" 遇到不合法的中间值，读到的 value 是空串（Chrome 实测：「12.」「1e」「-」都读成 ''，
              valueAsNumber 是 NaN；记录在 docs/upgrade/PROGRESS.md 2.4） */}
          <input
            id={amountId}
            ref={amountRef}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="大于 0 的数字"
            disabled={submitting}
            aria-invalid={fieldError('amount') ? true : undefined}
            aria-describedby={fieldError('amount') ? `${amountId}-error` : undefined}
          />
          {fieldError('amount') && (
            <p id={`${amountId}-error`} className="error-text" style={{ margin: 0 }}>
              {fieldError('amount')}
            </p>
          )}
        </div>

        <div className="row">
          {/* 第一道关：提交中禁用按钮，文案切成「提交中…」。disabled 和文案都来自同一个 submitting */}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? '提交中…' : '创建订单'}
          </button>
        </div>
      </form>

      {result?.type === 'success' && (
        // role="status"：礼貌地播报，不打断读屏软件正在读的内容
        <p role="status" className="success-text" style={{ margin: 0 }}>
          创建成功！新订单号：{result.orderNo}
        </p>
      )}

      <div className="row">
        <label className="row" style={{ gap: 4 }}>
          <input type="checkbox" checked={failNetwork} onChange={(e) => setFailNetwork(e.target.checked)} />
          模拟网络失败
        </label>
        <label className="row" style={{ gap: 4 }}>
          <input type="checkbox" checked={withoutLock} onChange={(e) => setWithoutLock(e.target.checked)} />
          去掉 useRef 锁（反例）
        </label>
        <button type="button" onClick={submitTwiceInOneTurn}>
          同一轮事件里提交两次
        </button>
      </div>

      <RequestLogPanel log={log} label="手写版请求日志" />
    </div>
  )
}
