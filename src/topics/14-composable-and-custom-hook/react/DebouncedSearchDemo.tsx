/**
 * 区块三：防抖搜索（useDebouncedValue）+「let timer」坑的对照实验。
 * Vue 对照：vue/DebouncedUserSearch.vue、vue/LetTimerDemo.vue。
 */
import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'
import { useDebouncedValue } from './useDebouncedValue'

/* ---------------------- 请求日志（外部 store） ---------------------- */

function createRequestLog() {
  let lines: readonly string[] = []
  const listeners = new Set<() => void>()
  return {
    add(line: string) {
      lines = [...lines, line]
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

/** 请求结果：forKeyword 记住它属于哪个关键词，用来派生「是否还在加载」（11 题的做法） */
type Result =
  | { forKeyword: string; kind: 'success'; users: User[] }
  | { forKeyword: string; kind: 'error'; message: string }

interface Props {
  /** 防抖时长：页面 500ms，测试里调短 */
  debounceMs?: number
  /** 模拟接口延迟 */
  delayMs?: number
}

function DebouncedUserSearch({ debounceMs = 500, delayMs = 400 }: Props) {
  // 受控输入框的原始值：每敲一个字符就变一次
  const [keyword, setKeyword] = useState('')
  // ✅ 顶层无条件调用；keyword 停止变化 debounceMs 后，debouncedKeyword 才追上来
  const debouncedKeyword = useDebouncedValue(keyword, debounceMs)
  const [result, setResult] = useState<Result | null>(null)
  const [log] = useState(createRequestLog)
  const requests = useSyncExternalStore(log.subscribe, log.getSnapshot)

  // 派生值（09 题）：还在等防抖 / 结果不属于当前关键词 = 还在加载。不用在 Effect 里同步 setLoading(true)
  const waiting = keyword !== debouncedKeyword
  const loading = result === null || result.forKeyword !== debouncedKeyword

  /**
   * 依赖写 debouncedKeyword 而不是 keyword：Effect 只在「防抖后的值」变化时重跑，中间态不会触发请求。
   * 防抖之后仍然要 AbortController：防抖只减少请求数量，只要还可能连发两次（输入「张」停手、又改成「王」），
   * 先发的慢请求就可能后返回。两层 cleanup 各管各的：useDebouncedValue 里的 clearTimeout 取消待触发的计时，
   * 这里的 abort 取消在途的请求（竞态专题 27 题）。
   * Effect 体里只发请求、记日志，setState 都在 Promise 回调里（11 题「请求态派生」的做法），不命中 set-state-in-effect。
   */
  useEffect(() => {
    const controller = new AbortController()
    log.add(`请求：「${debouncedKeyword}」`)
    fetchUsers(debouncedKeyword, { signal: controller.signal, delayMs })
      .then((users) => setResult({ forKeyword: debouncedKeyword, kind: 'success', users }))
      .catch((err: unknown) => {
        if (isAbortError(err)) return // 被取消不是失败（27 题）
        setResult({ forKeyword: debouncedKeyword, kind: 'error', message: err instanceof Error ? err.message : '未知错误' })
      })
    return () => controller.abort()
  }, [debouncedKeyword, delayMs, log])

  return (
    <div className="stack">
      <input
        aria-label="防抖搜索关键词"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜索姓名或邮箱，如「张」或 example"
      />
      <p>
        当前输入：<strong>{keyword || '（空）'}</strong>
        {waiting && <span className="badge badge-pending">等待防抖…</span>}
        {' · '}防抖后的关键词：<strong>{debouncedKeyword || '（空）'}</strong>
      </p>
      <p className="muted" aria-label="请求次数">
        一共发了 {requests.length} 次请求：{requests.join('、')}
      </p>
      {loading && <p className="muted">加载中…</p>}
      {!loading && result?.kind === 'error' && (
        <p className="error-text" role="alert">
          {result.message}
        </p>
      )}
      {!loading && result?.kind === 'success' && result.users.length === 0 && (
        <p className="muted">没有匹配的用户</p>
      )}
      {result?.kind === 'success' && (
        <ul style={{ opacity: loading ? 0.5 : 1 }}>
          {result.users.map((u) => (
            <li key={u.id}>
              {u.name}（{u.email}）<span className="badge">{u.role}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------------------- 「let timer」坑 ---------------------- */

/**
 * ❌ 把 Vue 的写法原样搬进 React：定时器 id 放在组件函数体里的 let 变量上。
 * 每次输入 → setText → 组件重新渲染 → 函数体重新执行 → timer 又是一个新的 undefined，
 * 下一次 onChange 里的 clearTimeout(timer) 清不掉上一次的定时器，于是每次输入都会触发。
 * Vue 里同样的写法是对的：setup 只执行一次，let timer 一直是同一个变量（vue/LetTimerDemo.vue）。
 * lint 能拦下它：eslint-plugin-react-hooks 7 的 recommended 预设里 react-hooks/immutability 在赋值处报
 * 「Cannot reassign variable after render completes」、在 onChange={handleChange} 处报「Cannot modify local variables after
 * render completes」（2026-09-17 实测），下面两处用 eslint-disable 故意保留。
 */
function LetTimerBroken({ debounceMs }: { debounceMs: number }) {
  const [text, setText] = useState('')
  const [fired, setFired] = useState<string[]>([])
  let timer: ReturnType<typeof setTimeout> | undefined

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setText(value)
    clearTimeout(timer)
    // eslint-disable-next-line react-hooks/immutability -- 故意保留：这里报「Cannot reassign variable after render completes」
    timer = setTimeout(() => setFired((list) => [...list, value]), debounceMs)
  }

  return (
    <div className="stack">
      {/* 教学反例。recommended 预设的 react-hooks/immutability 会在这一行报「Cannot modify local variables after render completes」 */}
      {/* eslint-disable-next-line react-hooks/immutability -- 故意保留，演示函数体里的 let 活不过一次渲染 */}
      <input aria-label="let timer 写法" value={text} onChange={handleChange} placeholder="快速输入 abc" />
      <span aria-label="let timer 触发次数">
        触发了 {fired.length} 次：{fired.join('、')}
      </span>
    </div>
  )
}

/**
 * ✅ 修法：定时器 id 存进 useRef（12 题「用途二」），它在组件的整个生命周期里是同一个对象。
 * 卸载时清掉还没到点的定时器：cleanup 里用的是 Effect 执行时拿到的 timers 对象本身，不是「某一次的 .current」。
 */
function LetTimerFixed({ debounceMs }: { debounceMs: number }) {
  const [text, setText] = useState('')
  const [fired, setFired] = useState<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const timers = timerRef
    return () => clearTimeout(timers.current)
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setText(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFired((list) => [...list, value]), debounceMs)
  }

  return (
    <div className="stack">
      <input aria-label="useRef 写法" value={text} onChange={handleChange} placeholder="快速输入 abc" />
      <span aria-label="useRef 触发次数">
        触发了 {fired.length} 次：{fired.join('、')}
      </span>
    </div>
  )
}

export function DebouncedSearchDemo({ debounceMs = 500, delayMs = 400 }: Props) {
  return (
    <div className="card stack">
      <h3>区块三：防抖（useDebouncedValue）与「let timer」坑</h3>
      <p className="muted">
        连续快速输入：「当前输入」立刻变，「防抖后的关键词」停手 {debounceMs}ms 才跟上，请求只在后者变化时发出（看请求次数）。
        开发环境 StrictMode 挂载时会多发一次空关键词请求（第一次被 cleanup 取消），生产只有一次。
      </p>
      <DebouncedUserSearch debounceMs={debounceMs} delayMs={delayMs} />
      <strong>Vue 老手最容易踩的坑：定时器 id 放在组件函数体的 let 里</strong>
      <p className="muted">在两个输入框里各快速敲「abc」，等半秒看各触发了几次。</p>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <LetTimerBroken debounceMs={debounceMs} />
        <LetTimerFixed debounceMs={debounceMs} />
      </div>
    </div>
  )
}
