/**
 * 学习主题：综合实战 —— 订单管理页（搜索 / 筛选 / 分页 / 行内编辑 / 二次确认删除）
 *
 * React 核心概念：
 * - 「草稿值」与「提交值」分离：输入框存 draft，点搜索才提交为 keyword（07/11 题）
 * - 一个请求 effect 依赖 [keyword, status, page, reloadFlag]：搜索、筛选、翻页、刷新、重试
 *   全部收敛为「改状态 → effect 自动重新请求」，AbortController 防竞态（10/11 题）
 * - 判别联合建模 loading / error / success（含 empty）（11 题）；派生值 totalPages 渲染时直接算（09 题）
 * - 组件拆分：OrderRow 管一行的展示 / 编辑 / 删除，用 callback props 通知父级（08 题）；
 *   保存成功后用 map 做不可变局部更新（21 题）
 *
 * Vue 对应概念：
 * - React 靠「effect 依赖数组」声明式驱动请求；Vue 版把 load() 当普通函数命令式调用，
 *   只有「状态筛选变化立即查询」用 watch —— 同一个页面，两种触发哲学
 * - OrderRow 的 props/emit、v-model 表单、v-if 状态分支与 React 写法一一对应
 *
 * 最重要的区别：
 * - 业务逻辑（状态建模、竞态处理、二次确认、行内编辑）两边完全一样 —— 是框架无关的工程功底；
 *   框架差异集中在两点：请求由「依赖变化」还是「显式调用」触发；更新数据必须不可变还是可以直接改
 */
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { deleteOrder, fetchOrders, isAbortError, updateOrder } from '@/shared/mockApi'
import type { Order, OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

const PAGE_SIZE = 5

/** 筛选下拉与行内编辑下拉共用的状态选项（筛选那份额外加一个 'all'） */
const ORDER_STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'cancelled']

/** 判别联合建模列表请求状态（11 题）—— 与 Vue 版逐字相同 */
type ListState =
  | { status: 'loading' }
  | { status: 'success'; orders: Order[]; total: number }
  | { status: 'error'; message: string }

export default function Example() {
  const [draft, setDraft] = useState('') // 输入框草稿 ≈ Vue 里 v-model 绑定的 draft
  const [keyword, setKeyword] = useState('') // 已提交的搜索词，才是真正的请求参数
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [reloadFlag, setReloadFlag] = useState(0) // 「刷新 / 重试」专用计数器：+1 即让 effect 重跑
  const [listState, setListState] = useState<ListState>({ status: 'loading' })

  /**
   * 请求 effect：此处 useEffect 依赖 [keyword, status, page, reloadFlag]
   * ≈ Vue 的 watch([keyword, status, page], load, { immediate: true })。
   * 五个入口（初始加载 / 搜索 / 筛选 / 翻页 / 刷新）统一成「改状态 → 自动重新请求」一条数据流。
   *
   * loadOrders 定义在 effect【内部】：它读到的 keyword/status/page 一定是本轮依赖对应的值，
   * 没有过期闭包问题，也天然满足 exhaustive-deps 规则（若定义在组件顶层，函数每次渲染都是
   * 新引用，要么漏依赖要么用 useCallback 包起来 —— 定义进 effect 是官方推荐的简化写法）。
   */
  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      setListState({ status: 'loading' })
      try {
        // failRate: 0.15 —— 15% 概率随机失败，演示 error 分支与重试
        const { items, total } = await fetchOrders(
          { keyword, status, page, pageSize: PAGE_SIZE },
          { signal: controller.signal, failRate: 0.15 },
        )
        setListState({ status: 'success', orders: items, total })
      } catch (err) {
        if (isAbortError(err)) return // 「被取消」不算失败（10 题）
        setListState({ status: 'error', message: err instanceof Error ? err.message : '未知错误' })
      }
    }

    void loadOrders()
    // cleanup 取消在途请求：防竞态 + StrictMode 双跑安全
    // ≈ Vue 版在 load() 开头 abort 上一次的 controller（外加 onUnmounted 兜底）
    return () => controller.abort()
  }, [keyword, status, page, reloadFlag])

  const loading = listState.status === 'loading'
  // 派生值渲染时直接算，不塞进 state（09 题）≈ Vue 的 computed(totalPages)
  const totalPages =
    listState.status === 'success' ? Math.max(1, Math.ceil(listState.total / PAGE_SIZE)) : 1

  /** 提交搜索（点按钮或回车都会触发 form 的 submit）：此处 onSubmit + preventDefault ≈ Vue 的 @submit.prevent */
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setKeyword(draft) // 草稿提交为正式参数
    setPage(1) // 新搜索回到第 1 页
    setReloadFlag((n) => n + 1) // 搜「同一个词」state 不变、effect 不会重跑，补个计数器保证必发请求
    // 同一事件里的三次 setState 被自动批处理成一次重渲染，effect 只重跑一次
    // ≈ Vue 版 handleSearch 里连续赋值后手动调一次 load()
  }

  /** 状态筛选变化立即查询：改 state → effect 自动重跑 ≈ Vue 的 watch(statusFilter) */
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    // DOM 的 value 只有 string 类型，需要断言收窄（Vue 的 v-model 直接拿到绑定值，无此步）
    setStatus(e.target.value as OrderStatus | 'all')
    setPage(1) // 换筛选条件回到第 1 页
  }

  /** 刷新 / 重试是同一件事：参数不变，把请求原样再发一次 ≈ Vue 版直接再调 load() */
  const refresh = () => setReloadFlag((n) => n + 1)

  /**
   * 行保存成功：用 map 做不可变局部更新（21 题），不重新请求。
   * 此处必须换新数组、新对象引用，React 才会重渲染 ≈ Vue 版直接 orders[i] = saved（响应式代理允许原地改）。
   * 注意：若把状态改成了不匹配当前筛选的值，该行会留在原地，点「刷新」即可；
   * 真实业务也常选择「保存后直接重新拉取列表」。
   */
  const handleSaved = (saved: Order) => {
    setListState((prev) =>
      prev.status === 'success'
        ? { ...prev, orders: prev.orders.map((o) => (o.id === saved.id ? saved : o)) }
        : prev,
    )
  }

  /** 行删除成功：刷新当前页；删的是本页最后一条且不在第 1 页时回退一页（否则会看到一个空页） */
  const handleDeleted = () => {
    if (listState.status === 'success' && listState.orders.length === 1 && page > 1) {
      setPage((p) => p - 1) // page 变化本身就会触发 effect 重新请求
    } else {
      setReloadFlag((n) => n + 1) // 原地刷新当前页
    }
  }

  return (
    <div className="stack">
      <p className="muted">
        综合页：搜索（点按钮或回车）+ 状态筛选（变化立即查询）+ 分页 + 行内编辑 + 二次确认删除；
        请求 15% 概率随机失败，可演示错误与重试
      </p>

      {/* 工具栏：用 form 包裹让回车也能触发搜索 */}
      <form className="row" onSubmit={handleSearch}>
        {/* 受控输入 value + onChange ≈ v-model="draft"（07 题） */}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="搜索订单号或客户名"
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          搜索
        </button>
        {/* 受控 select ≈ v-model="statusFilter"；变化立即查询 */}
        <select value={status} onChange={handleStatusChange} disabled={loading}>
          <option value="all">全部</option>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_TEXT[s]}
            </option>
          ))}
        </select>
        {/* 注意 type="button"：form 里的 button 默认是 submit，不写会误触发搜索（Vue 版同一个坑） */}
        <button type="button" onClick={refresh} disabled={loading}>
          刷新
        </button>
      </form>

      {/* 状态分支渲染（05/11 题）≈ Vue 的 v-if / v-else-if 链 */}
      {listState.status === 'loading' && <p className="muted">加载中，请稍候…</p>}

      {listState.status === 'error' && (
        <div className="card">
          <p className="error-text">{listState.message}</p>
          <button className="btn-primary" onClick={refresh}>
            重试
          </button>
        </div>
      )}

      {listState.status === 'success' && listState.orders.length === 0 && (
        <p className="muted">没有找到匹配的订单，换个关键词或筛选条件试试</p>
      )}

      {listState.status === 'success' && listState.orders.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户</th>
                <th>金额</th>
                <th>状态</th>
                <th>创建日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {/* map + key ≈ v-for + :key（06 题）；每行的编辑/删除状态都封装在 OrderRow 内部 */}
              {listState.orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                />
              ))}
            </tbody>
          </table>

          <div className="row">
            <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              上一页
            </button>
            <span className="muted">
              第 {page} / {totalPages} 页 · 共 {listState.total} 条
            </span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * 行组件：一行订单的「展示 / 行内编辑 / 二次确认删除」。
 * React 的子组件就是同文件里的另一个函数（Vue 版一文件一组件，拆成 OrderRow.vue）。
 * props 传数据进来 + callback props 把结果报上去（08 题）
 * ≈ Vue 的 defineProps + emit('saved') / emit('deleted')。
 */
interface OrderRowProps {
  order: Order
  onSaved: (saved: Order) => void
  onDeleted: (id: string) => void
}

function OrderRow({ order, onSaved, onDeleted }: OrderRowProps) {
  const [editing, setEditing] = useState(false)
  // 编辑草稿：进入编辑时从 order 拷贝一份，保存前的修改不影响列表数据
  // ≈ Vue 版的 reactive 编辑表单对象（React 惯用多个 useState，也可以合成一个对象）
  const [customerDraft, setCustomerDraft] = useState('')
  const [amountDraft, setAmountDraft] = useState('') // number input 的 value 也是 string，提交时再 Number()
  const [statusDraft, setStatusDraft] = useState<OrderStatus>('pending')
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false) // 「删除」→「确认删除？」的二次确认态
  const [deleting, setDeleting] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)

  const busy = saving || deleting // 派生值直接算（09 题）≈ Vue 的 computed(busy)

  const startEdit = () => {
    setCustomerDraft(order.customer)
    setAmountDraft(String(order.amount))
    setStatusDraft(order.status)
    setRowError(null)
    setConfirmingDelete(false)
    setEditing(true)
  }

  /** 保存：客户端先做基本校验再调 updateOrder；保存中禁用整行交互（19 题防重复提交） */
  const save = async () => {
    const amount = Number(amountDraft)
    if (!customerDraft.trim()) {
      setRowError('客户名不能为空')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setRowError('金额必须是大于 0 的数字')
      return
    }
    setSaving(true)
    setRowError(null)
    try {
      const saved = await updateOrder(
        order.id,
        { customer: customerDraft.trim(), amount, status: statusDraft },
        { failRate: 0.15 },
      )
      onSaved(saved) // 通知父级做不可变局部更新 ≈ Vue 的 emit('saved', saved)
      setEditing(false)
    } catch (err) {
      setRowError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  /** 二次确认后的真正删除；成功后父级刷新列表，本行随之卸载 */
  const remove = async () => {
    setDeleting(true)
    setRowError(null)
    try {
      await deleteOrder(order.id, { failRate: 0.15 })
      onDeleted(order.id) // ≈ Vue 的 emit('deleted', order.id)
    } catch (err) {
      setRowError(err instanceof Error ? err.message : '删除失败')
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <tr>
      <td>{order.orderNo}</td>
      {/* 每个单元格按 editing 切换「文本 / 输入框」：三元表达式 ≈ Vue 模板里的 v-if / v-else */}
      <td>
        {editing ? (
          <input
            value={customerDraft}
            onChange={(e) => setCustomerDraft(e.target.value)}
            disabled={busy}
          />
        ) : (
          order.customer
        )}
      </td>
      <td>
        {editing ? (
          <input
            type="number"
            value={amountDraft}
            onChange={(e) => setAmountDraft(e.target.value)}
            disabled={busy}
          />
        ) : (
          `¥${order.amount}`
        )}
      </td>
      <td>
        {editing ? (
          <select
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
            disabled={busy}
          >
            {ORDER_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_TEXT[s]}
              </option>
            ))}
          </select>
        ) : (
          // 模板字符串手拼 className ≈ Vue 的 :class="`badge-${order.status}`"
          <span className={`badge badge-${order.status}`}>{ORDER_STATUS_TEXT[order.status]}</span>
        )}
      </td>
      <td>{order.createdAt}</td>
      <td>
        <div className="row">
          {editing ? (
            <>
              <button className="btn-primary" onClick={save} disabled={busy}>
                {saving ? '保存中…' : '保存'}
              </button>
              <button onClick={() => setEditing(false)} disabled={busy}>
                取消
              </button>
            </>
          ) : confirmingDelete ? (
            <>
              {/* 二次确认：第一次点「删除」只是切换到确认态，再点这颗才真正调接口 */}
              <button className="btn-danger" onClick={remove} disabled={busy}>
                {deleting ? '删除中…' : '确认删除？'}
              </button>
              <button onClick={() => setConfirmingDelete(false)} disabled={busy}>
                取消
              </button>
            </>
          ) : (
            <>
              <button onClick={startEdit} disabled={busy}>
                编辑
              </button>
              <button className="btn-danger" onClick={() => setConfirmingDelete(true)} disabled={busy}>
                删除
              </button>
            </>
          )}
          {rowError && <span className="error-text">{rowError}</span>}
        </div>
      </td>
    </tr>
  )
}
