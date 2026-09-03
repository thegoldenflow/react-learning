/**
 * 学习主题：异步提交与防重复 —— submitting 状态的工业界标准写法
 *
 * React 核心概念：
 * - submitting 布尔状态：提交前置 true，try/finally 里置回 false（成功、失败都必须恢复）
 * - 防重复的两层保险：disabled={submitting}（UI 层）+ 处理函数开头 if (submitting) return（逻辑层）
 * - 结果提示的状态建模：result: { type: 'success' | 'error'; message: string } | null ——
 *   一个字段同时表达「有没有结果、是成功还是失败、文案是什么」，杜绝多个散装布尔的非法组合
 * - 成功后清空表单、失败保留输入 —— 别让用户重新打一遍
 * - React 19 的 useActionState / useTransition 是处理表单提交的新趋势，
 *   但手写 submitting 仍是面试与存量代码的主流（本示例用基础写法）
 *
 * Vue 对应概念：
 * - ref(false) 的 submitting + 一模一样的 try/finally
 * - 表单绑定用 v-model（React 是受控组件 value + onChange）
 *
 * 最重要的区别：
 * - 异步提交的流程控制（禁用、恢复、成功清空、失败保留）是框架无关的工程功底，
 *   两边逐行对应；差异只在状态 API（useState vs ref）与表单绑定（受控组件 vs v-model）。
 */
import { useState, type FormEvent } from 'react'
import { submitOrder } from '@/shared/mockApi'

/**
 * 提交结果的状态建模：null = 还没提交过（什么都不显示）；
 * type 区分成功/失败，UI 据此选样式，message 是文案。
 * 比 successMessage + errorMessage 两个散装 state 更好 —— 不可能同时显示两条提示。
 */
interface SubmitResult {
  type: 'success' | 'error'
  message: string
}

export default function Example() {
  // 受控组件：输入框的值由 state 驱动（07 题讲过）。
  // 金额也用 string 存：需要 string 承载的是「空串」这种转不成数字的中间态（用 number 存，
  // 清空输入框时就没法表示「还没填」）；提交时再 Number() 转换。
  // 注意 type="number" 下浏览器会把 "12." 这类半截小数规范成空串，state 里根本看不到它；
  // 真要保留原始文本，得改用 type="text" + inputMode="decimal"。
  const [customer, setCustomer] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault() // 阻止 form 默认的整页刷新

    /**
     * 防重复第二层保险（逻辑层守卫）。第一层是按钮的 disabled={submitting}，
     * 但 UI 禁用属于「视图层防护」：可能被键盘提交、测试代码直接调用、
     * 样式被覆盖等方式绕过 —— 处理函数开头的 guard 才是兜底。
     * 「怎么防止表单重复提交」是高频面试题，标准答案就是这两层一起上。
     */
    if (submitting) return

    setSubmitting(true)
    setResult(null) // 清掉上一次的提示，避免旧提示在新请求期间还挂在页面上
    try {
      const order = await submitOrder(
        { customer, amount: Number(amount) },
        { failRate: 0.3 }, // 30% 概率随机失败，方便亲眼看到失败分支
      )
      setResult({ type: 'success', message: `创建成功！新订单号：${order.orderNo}` })
      // 成功后清空表单，让用户可以继续录入下一单
      setCustomer('')
      setAmount('')
    } catch (err) {
      // 失败：显示错误，但【保留输入】—— 用户点一下重新提交即可，不用重新打一遍
      setResult({ type: 'error', message: err instanceof Error ? err.message : '未知错误' })
    } finally {
      /**
       * 标准写法的核心：setSubmitting(false) 必须放 finally ——
       * 无论成功还是抛错都会执行。如果只写在 try 末尾，一旦请求失败，
       * submitting 永远是 true，按钮永久禁用，表单就「卡死」了。
       */
      setSubmitting(false)
    }
  }

  return (
    <div className="stack">
      <p className="muted">
        30% 概率随机失败；金额填 0 / 留空或清空客户名可看服务端校验错误；提交中快速连点按钮不会重复提交
      </p>

      <form className="card stack" onSubmit={handleSubmit}>
        <label className="stack">
          客户名称
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="如：张伟"
            disabled={submitting}
          />
        </label>
        <label className="stack">
          金额
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="大于 0 的数字"
            disabled={submitting}
          />
        </label>
        <div className="row">
          {/* 防重复第一层保险：提交期间禁用按钮，同时文案切成「提交中…」给用户反馈。
              disabled 和文案共用同一个 submitting state —— 单一数据源 */}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? '提交中…' : '创建订单'}
          </button>
        </div>
      </form>

      {/* result 为 null 时什么都不渲染；type 同时决定样式和语义 —— 判别建模的好处 */}
      {result && (
        <p className={result.type === 'success' ? 'success-text' : 'error-text'}>
          {result.message}
        </p>
      )}
    </div>
  )
}
