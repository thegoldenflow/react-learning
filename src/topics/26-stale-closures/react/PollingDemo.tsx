/**
 * 区块三：轮询读旧的筛选参数 —— ❌ [] / ② [status] / ③ useEffectEvent（主线）/ ④ latest ref（并排）四种写法。
 * Vue 对照：vue/PollingDemo.vue。
 *
 * 演示简化：这里手写 setInterval + 请求只是为了观察闭包。真实项目的轮询交给 TanStack Query 的 refetchInterval（TanStack Query 的基础见 30 题，轮询写法见官方 guides/polling）：
 * 参数放进 queryKey，换参数就是换一条缓存，库负责定时、去重、失败重试、页面不可见时暂停（refetchIntervalInBackground 默认 false）。
 *
 * 日志里的「第 n 次」是【这一轮 Effect 内部】的计数：
 * ❌ 只有一轮 Effect，数字一直涨、status 一直是旧的；② 换参数时数字从 1 重来（定时器被销毁重建）；
 * ③ / ④ 数字连续、status 却跟着下拉框变（定时器只建了一次）。
 *
 * alive 标志 + clearInterval 是每一轮 Effect 的「身份证」：cleanup 把 alive 置 false，已经发出、还没回来的请求返回后不再写日志。
 * 这里只丢弃迟到的响应，不真的取消请求（AbortController 是 27 题的主角）。
 */
import { useEffect, useEffectEvent, useRef, useState, type ComponentType } from 'react'
import { fetchOrders } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type OrderStatus } from '@/shared/types'
import { createDemoLog, POLL_MS, type DemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

export type StatusFilter = OrderStatus | 'all'

const STATUS_OPTIONS: StatusFilter[] = ['all', 'pending', 'paid', 'cancelled']
const STATUS_LABEL: Record<StatusFilter, string> = { all: '全部', ...ORDER_STATUS_TEXT }

/** as const 让 PollMode 直接从这里推导出字面量联合类型 */
const POLL_MODES = [
  { value: 'broken', label: '❌ 依赖 []：定时器闭包里的 status 停在挂载那次渲染' },
  { value: 'deps', label: '② 写对依赖 [status]：status 一变就销毁重建定时器' },
  { value: 'effectEvent', label: '③ useEffectEvent（主线·19.2 起）：定时器只建一次，status 读最新' },
  { value: 'latestRef', label: '④ latest ref（并排·React 18 也能用）：定时器只建一次，status 读 ref' },
] as const

export type PollMode = (typeof POLL_MODES)[number]['value']

interface PollerProps {
  /** 当前筛选状态：每次渲染都是最新的 props，但定时器闭包里的那份取决于写法 */
  status: StatusFilter
  log: DemoLog
  /** 模拟请求延迟：页面 300ms，测试里多为 0 */
  delayMs: number
}

/** 一次请求 + 写日志；alive 由发起它的那一轮 Effect 提供 */
function requestOnce(tag: string, seq: number, status: StatusFilter, delayMs: number, isAlive: () => boolean, log: DemoLog) {
  void fetchOrders({ status, pageSize: 20 }, { delayMs }).then((page) => {
    if (!isAlive()) return
    log.add(`${tag}第 ${seq} 次轮询：status=${status} → ${page.total} 条`)
  })
}

/**
 * ❌ 依赖 []：Effect 只在挂载后执行一次，setInterval 的回调是挂载那次渲染的闭包，status 一直是当时的值。
 * 下拉框切到「已支付」，props.status 已经是 paid，定时器每 2 秒仍用 status=all 发请求 ——
 * 接口没报错、定时器在跑、只是参数一直是旧的，线上很难发现。
 */
function BrokenPoller({ status, log, delayMs }: PollerProps) {
  useEffect(() => {
    let alive = true
    let tickNo = 0
    const tick = () => requestOnce('【坏 · []】', ++tickNo, status, delayMs, () => alive, log)
    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
    // 教学反例：exhaustive-deps 报缺少 status、log、delayMs。别学这个 disable（官方态度见 Example.tsx 八）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <p className="muted">轮询中（依赖 []）。props.status={status}，定时器闭包里的 status 停在挂载那次渲染。</p>
}

/**
 * ② 写对依赖 [status, log, delayMs]：status 一变，先 cleanup（alive=false + clearInterval）再 setup（新闭包、新定时器）。
 * 参数总是新的，日志里的「第 n 次」从 1 重来 —— 定时器被销毁重建的痕迹。
 * 在这里它是可接受的，甚至是想要的：换了筛选条件，「立刻按新条件查一次」本来就合理，重启定时器顺带做到了。
 * 取舍的标准是「重建这个外部资源的代价能不能接受」—— 定时器可以；WebSocket 连接、播放器实例往往不行（10 题还讲了
 * 「依赖变化比间隔还快时，定时器一直等不到触发」）。
 */
function DepsPoller({ status, log, delayMs }: PollerProps) {
  useEffect(() => {
    let alive = true
    let tickNo = 0
    const tick = () => requestOnce('【写对依赖】', ++tickNo, status, delayMs, () => alive, log)
    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [status, log, delayMs])
  return <p className="muted">轮询中（依赖 [status]）。props.status={status}，切换后定时器销毁重建，计数从 1 重来。</p>
}

/**
 * ③ 主线：useEffectEvent【较新·React 19.2 起】。
 * 「status 变了要不要重建定时器」和「每次 tick 用哪个 status」是两件事：前者不想，后者要最新值。
 * 把后者抽成 Effect Event：onTick 里读的 status / log / delayMs 是调用那一刻最新提交的值，而 onTick 本身不是响应式值、不写进依赖，
 * 于是 Effect 的依赖数组诚实地是 [] —— 定时器只建一次，参数一直新鲜。官方 separating-events-from-effects 页的 onTick 例子是同一个结构。
 *
 * 为什么把 seq 和 isAlive 当参数传进去：tickNo / alive 是这一轮 Effect 的私有变量，onTick 是组件级的函数，看不见 Effect 闭包里的东西。
 * Effect Event 负责「读最新值」，Effect 负责「生命周期」。
 *
 * 实现细节（react-dom 19.2.8，本题测试覆盖）：onTick 每次渲染都是一个新的函数（没有稳定身份），但每一个都转发到同一个内部槽位；
 * 更新渲染时新回调先排队，这次提交的第一步（before-mutation）才换进槽位，早于这次提交里的所有 Effect。所以它不能当 useCallback 用，也不需要进依赖。
 * 已知 bug：19.2.x 在 memo()（不带比较函数）/ forwardRef 组件里跳过这一步，Effect Event 一直调用第一次渲染的回调（19.3.0 修复）。
 * 本组件是普通函数组件，不受影响（测试里有 memo / forwardRef 的对照）。
 */
function EffectEventPoller({ status, log, delayMs }: PollerProps) {
  const onTick = useEffectEvent((seq: number, isAlive: () => boolean) => {
    requestOnce('【useEffectEvent】', seq, status, delayMs, isAlive, log)
  })

  useEffect(() => {
    let alive = true
    let tickNo = 0
    const isAlive = () => alive
    const tick = () => onTick(++tickNo, isAlive)
    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])
  return <p className="muted">轮询中（useEffectEvent，依赖 []）。props.status={status}，定时器只建了一次，日志里的 status 跟着变。</p>
}

/**
 * ④ 并排：latest ref（社区惯用法；React 18 / 19.0 / 19.1 没有 useEffectEvent，10 题场景二的修法三也是它；19.2.x 的 memo / forwardRef 组件里也用它）。
 * 每次提交后在 Effect 里把最新的 status 写进 ref，定时器回调读 ref.current。效果和 ③ 一样，区别：
 * - 要自己维护「同步」那一步，漏写或写进渲染期都是 bug（渲染期写 ref 会被 eslint-plugin-react-hooks 7 的 refs 规则报 error）；
 * - 用 useEffect 同步有窗口期：本组件的 useLayoutEffect、子组件的 Effect 在同步之前执行，读到的是旧值（测试覆盖）；
 *   也可以改用 useLayoutEffect 同步来缩小窗口；useEffectEvent 没有这个窗口；
 * - 同步的对象可以是值，也可以是整个回调（latestTick.current = () => …，10 题就是这样写的）。
 */
function LatestRefPoller({ status, log, delayMs }: PollerProps) {
  const latest = useRef({ status, log, delayMs })
  useEffect(() => {
    latest.current = { status, log, delayMs }
  })

  useEffect(() => {
    let alive = true
    let tickNo = 0
    const tick = () => {
      const { status: current, log: currentLog, delayMs: currentDelay } = latest.current
      requestOnce('【latest ref】', ++tickNo, current, currentDelay, () => alive, currentLog)
    }
    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])
  return <p className="muted">轮询中（latest ref，依赖 []）。props.status={status}，定时器只建了一次，每次 tick 读 ref 里的最新值。</p>
}

const POLLERS: Record<PollMode, ComponentType<PollerProps>> = {
  broken: BrokenPoller,
  deps: DepsPoller,
  effectEvent: EffectEventPoller,
  latestRef: LatestRefPoller,
}

export function PollingDemo({ delayMs = 300 }: { delayMs?: number }) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [mode, setMode] = useState<PollMode>('broken')
  const [polling, setPolling] = useState(false)
  const [log] = useState(() => createDemoLog(20))
  const Poller = POLLERS[mode]

  const changeStatus = (next: StatusFilter) => {
    setStatus(next)
    log.add(`—— 下拉框切到 status=${next}，接下来的轮询该用它 ——`)
  }

  const changeMode = (next: PollMode) => {
    setMode(next)
    if (polling) log.add('—— 切换写法：旧 poller 卸载（cleanup），新 poller 挂载，计数从 1 开始 ——')
  }

  const togglePolling = () => {
    setPolling((p) => !p)
    log.add(polling ? '—— 停止轮询：poller 卸载时执行 cleanup，之后不会再有新日志 ——' : `—— 开始轮询（status=${status}）——`)
  }

  return (
    <div className="card stack">
      <h3>区块三：轮询读旧的筛选参数 —— 四种写法</h3>
      <p className="muted">
        点「开始轮询」，等一两条日志后把状态切到「已支付」：❌ 每 2 秒仍记 status=all；② 立刻按新状态查一次、计数从 1 重来；③ / ④
        计数连续、status 跟着变。停止轮询、切换写法或切题之后，旧的那一轮不再写日志（alive 标志 + clearInterval）。默认数据里
        all=15、pending=6、paid=6、cancelled=3 条（在 19 / 22 / 30 题改过订单的话数字会不同）。
      </p>
      <div className="row">
        <label className="row">
          <span>筛选状态：</span>
          {/* 受控 select（07 题）。e.target.value 的静态类型是 string，选项全部来自 STATUS_OPTIONS，断言是安全的 */}
          <select value={status} onChange={(e) => changeStatus(e.target.value as StatusFilter)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <button className={polling ? 'btn-danger' : 'btn-primary'} onClick={togglePolling}>
          {polling ? '停止轮询' : '开始轮询'}
        </button>
      </div>
      <div className="row">
        <label className="row">
          <span>写法：</span>
          <select value={mode} onChange={(e) => changeMode(e.target.value as PollMode)}>
            {POLL_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {/*
        key={mode}：换写法时整个卸载旧 poller（执行它的 cleanup），挂载全新实例（06 题「换 key = 换实例」）。
        四个组件的类型本来就不同，不写 key 也会换实例；写上是为了把意图说清楚。
      */}
      {polling ? (
        <Poller key={mode} status={status} log={log} delayMs={delayMs} />
      ) : (
        <p className="muted">未在轮询 —— 没有任何定时器在跑。</p>
      )}
      <LogPanel log={log} label="区块三日志" emptyHint="（还没有记录，点「开始轮询」）" />
    </div>
  )
}
