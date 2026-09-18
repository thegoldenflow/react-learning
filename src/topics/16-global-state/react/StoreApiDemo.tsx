/**
 * 区块二【主线】：在组件外读写 store、subscribe、异步 action、persist。
 * useCartStore 既是 Hook，也是一个挂着 getState / setState / subscribe / getInitialState 的对象（zustand esm/react.mjs:17）。
 * Vue 对照：vue/StoreApiDemo.vue（$subscribe / $onAction / $patch / 自写 $reset）。
 */
import { useEffect, useState, useSyncExternalStore } from 'react'
import { CART_STORAGE_KEY, getCheckoutRequestCount, selectTotalCount, useCartStore, type CartState } from './cartStore'

/* ------------------ 演示日志：组件外的小 store（和 14 / 19 题同一个做法） ------------------ */

function createDemoLog() {
  let lines: readonly string[] = []
  const listeners = new Set<() => void>()
  return {
    push(line: string) {
      lines = [...lines, line].slice(-12)
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => lines,
  }
}

type DemoLog = ReturnType<typeof createDemoLog>

/** 把一次 store 变化翻译成人能读的日志（只比较关心的字段） */
function describeChange(state: CartState, prev: CartState): string[] {
  const out: string[] = []
  if (state.items !== prev.items) out.push(`items：${selectTotalCount(prev)} 件 → ${selectTotalCount(state)} 件`)
  if (state.giftWrap !== prev.giftWrap) out.push(`giftWrap：${prev.giftWrap} → ${state.giftWrap}`)
  if (state.checkout !== prev.checkout) {
    const detail =
      state.checkout.status === 'success'
        ? `（${state.checkout.orderNo}；服务端累计收到 ${getCheckoutRequestCount()} 次结算请求）`
        : state.checkout.status === 'error'
          ? `（${state.checkout.message}）`
          : ''
    out.push(`checkout：${prev.checkout.status} → ${state.checkout.status}${detail}`)
  }
  return out
}

/**
 * 「退出登录」这类非 React 代码（请求拦截器、WebSocket 回调、路由守卫）要改 store 时：
 * 用 getState() 拿到 action 再调用。也可以 useCartStore.setState({...}) 直接写，但绕过了 action 里的业务规则。
 */
function logoutAndClearCart() {
  useCartStore.getState().clear()
}

function LogPanel({ log }: { log: DemoLog }) {
  const lines = useSyncExternalStore(log.subscribe, log.getSnapshot)
  return (
    <pre className="log" aria-label="subscribe 日志">
      {lines.length === 0 ? '（还没有变化）' : lines.join('\n')}
    </pre>
  )
}

export function StoreApiDemo({ delayMs = 600 }: { delayMs?: number }) {
  const [log] = useState(createDemoLog)
  const [snapshotText, setSnapshotText] = useState('')
  const [storageText, setStorageText] = useState('')
  const [failNext, setFailNext] = useState(false)

  // 选一个对象没问题：checkout 只在 set 时被整体替换，没变时引用不变（Object.is 相同）
  const checkout = useCartStore((s) => s.checkout)
  const checkoutCart = useCartStore((s) => s.checkoutCart)

  /**
   * subscribe 在组件外也能用；在组件里用时放进 Effect，并把它返回的取消函数作为 cleanup。
   * 这里只写日志、不 setState，所以日志放在组件外的 log 里。
   * 需要「只在某个字段变化时回调」可以换 subscribeWithSelector 中间件，或者像这样自己比较 prev。
   */
  useEffect(
    () =>
      useCartStore.subscribe((state, prev) => {
        for (const line of describeChange(state, prev)) log.push(line)
      }),
    [log],
  )

  const readSnapshot = () => {
    // 事件处理函数里用 getState() 读最新值：不订阅，所以不会因为 store 变化而重渲染本组件
    const s = useCartStore.getState()
    setSnapshotText(`getState()：${selectTotalCount(s)} 件，礼品包装 ${s.giftWrap ? '是' : '否'}，结算状态 ${s.checkout.status}`)
  }

  const readStorage = () => {
    setStorageText(localStorage.getItem(CART_STORAGE_KEY) ?? '（localStorage 里没有这个键）')
  }

  const writeLegacyAndRehydrate = async () => {
    // 模拟「老版本代码写下的数据」：v0 的条目字段叫 qty。rehydrate 时版本号不一致 → 调 migrate → 写回 v1
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ state: { items: [{ id: 'p2', name: '无线鼠标', price: 149, qty: 3 }] }, version: 0 }),
    )
    await useCartStore.persist.rehydrate()
    readStorage()
  }

  const pending = checkout.status === 'pending'

  return (
    <div className="card stack">
      <h3>区块二：组件外读写、subscribe、异步 action、persist（主线）</h3>

      <strong>1. 组件外读写</strong>
      <div className="row">
        <button onClick={readSnapshot}>getState() 读一次（不订阅）</button>
        <button onClick={logoutAndClearCart}>模拟「退出登录」：非 React 代码清空购物车</button>
      </div>
      {snapshotText && <p className="muted">{snapshotText}</p>}

      <strong>2. 异步 action：结算</strong>
      <div className="row">
        <button className="btn-primary" disabled={pending} onClick={() => void checkoutCart({ delayMs, fail: failNext })}>
          {pending ? '结算中…' : '结算'}
        </button>
        <button
          disabled={pending}
          onClick={() => {
            // 同一轮里连调两次：第二次 get() 已经读到 'pending'，直接返回（set 是同步生效的）
            void checkoutCart({ delayMs, fail: failNext })
            void checkoutCart({ delayMs, fail: failNext })
          }}
        >
          同一轮里调用两次 checkoutCart()
        </button>
        <label className="row">
          <input type="checkbox" checked={failNext} onChange={(e) => setFailNext(e.target.checked)} />
          模拟结算失败
        </label>
      </div>
      <p role="status">
        结算状态：{checkout.status}
        {checkout.status === 'success' && `，订单号 ${checkout.orderNo}`}
      </p>
      {checkout.status === 'error' && (
        <p role="alert" className="error-text">
          {checkout.message}（购物车保留，可以重试）
        </p>
      )}

      <strong>3. persist：只持久化白名单字段</strong>
      <div className="row">
        <button onClick={readStorage}>查看 localStorage</button>
        <button
          onClick={() => {
            // 只删存储里的这一项；内存里的 store 不变，下一次 set 又会写回去
            useCartStore.persist.clearStorage()
            readStorage()
          }}
        >
          persist.clearStorage()
        </button>
        <button onClick={() => void writeLegacyAndRehydrate()}>写入 v0 旧数据 → rehydrate（触发 migrate）</button>
      </div>
      {storageText && (
        <pre className="log" aria-label="localStorage 内容">
          {storageText}
        </pre>
      )}

      <strong>4. subscribe 日志（组件外监听，Effect cleanup 里取消）</strong>
      <LogPanel log={log} />
    </div>
  )
}
