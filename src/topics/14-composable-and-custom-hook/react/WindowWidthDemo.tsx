/**
 * 区块一：订阅浏览器 API —— useSyncExternalStore 主线 + useEffect 订阅并排，外加一个 subscribe 稳定性实验。
 * Vue 对照：vue/WidthPanel.vue + vue/useWindowWidth.ts。
 */
import { useState, useSyncExternalStore } from 'react'
import { useWindowWidth } from './useWindowWidth'
import { useWindowWidthEffect } from './useWindowWidthEffect'

interface WidthPanelProps {
  title: string
  /** 宽窄分界线（px）：两个面板用不同阈值，对同一宽度得出不同的「窄 / 宽」结论 */
  threshold: number
}

/**
 * 两个 WidthPanel 实例各自调用 useWindowWidth：每次调用都有自己的一份订阅。
 * 两个面板显示的数字相同，只因为它们读的是同一个外部数据源（窗口宽度）；订阅是两份 ——
 * 卸载面板 B 只取消 B 自己的订阅，A 照常更新（测试里数过 addEventListener / removeEventListener）。
 */
function WidthPanel({ title, threshold }: WidthPanelProps) {
  // ✅ 在组件顶层无条件调用。放进 if / 循环 / 事件处理函数里，rules-of-hooks 会报错（Example.tsx 二-2）
  const width = useWindowWidth()
  const widthByEffect = useWindowWidthEffect()

  // 「窄 / 宽」是渲染时算出的派生值，不需要 state（09 题）；Vue 版对应 computed
  const label = width === null ? '未知' : width < threshold ? '窄' : '宽'

  return (
    <div className="card">
      <div className="row">
        <strong>{title}</strong>
        <span className="badge">
          {label}（阈值 {threshold}px）
        </span>
      </div>
      <p>
        useSyncExternalStore（主线）：<strong>{width === null ? '（服务端未知）' : `${width}px`}</strong>
        {' · '}
        useEffect 订阅（并排）：<strong>{widthByEffect}px</strong>
      </p>
    </div>
  )
}

/* ---------------------- subscribe 稳定性实验 ---------------------- */

/**
 * 实验用的「外部 store」：只记录 subscribe 被调用了几次。
 * 计数显示在另一个组件（LabCounts）里：它和被测组件是兄弟，自己更新时不会让被测组件重渲染，
 * 不然「重渲染 → 重新订阅 → 计数变化 → 又重渲染」会绕成圈。
 */
function createSubscribeLab() {
  const counts = { stable: 0, inline: 0 }
  let snapshot = { ...counts }
  const listeners = new Set<() => void>()
  const bump = (key: keyof typeof counts) => {
    counts[key] += 1
    snapshot = { ...counts }
    listeners.forEach((listener) => listener())
  }
  const onResize = (onStoreChange: () => void) => {
    window.addEventListener('resize', onStoreChange)
    return () => window.removeEventListener('resize', onStoreChange)
  }
  return {
    /** 只创建一次、引用不变的 subscribe（等价于写在模块顶层或 useCallback 包住） */
    stableSubscribe(onStoreChange: () => void) {
      bump('stable')
      return onResize(onStoreChange)
    },
    /** 给「每次渲染新建一个 subscribe」的写法调用，只负责计数 */
    inlineSubscribe(onStoreChange: () => void) {
      bump('inline')
      return onResize(onStoreChange)
    },
    subscribeCounts(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getCounts: () => snapshot,
  }
}

type SubscribeLab = ReturnType<typeof createSubscribeLab>
const getWidth = () => window.innerWidth

function LabProbe({ lab }: { lab: SubscribeLab }) {
  const [renders, setRenders] = useState(1)
  // 引用稳定：lab 在整个组件生命周期里是同一个对象，lab.stableSubscribe 也就是同一个函数
  const stable = useSyncExternalStore(lab.stableSubscribe, getWidth)
  // ❌ 反例：每次渲染都新建一个箭头函数传进去 —— React 发现 subscribe 变了，就先退订再重订
  const inline = useSyncExternalStore((onStoreChange) => lab.inlineSubscribe(onStoreChange), getWidth)
  return (
    <div className="row">
      <button onClick={() => setRenders((n) => n + 1)}>让这个组件重渲染一次</button>
      <span className="muted">
        已渲染 {renders} 次（两个 Hook 读到的宽度：{stable} / {inline}）
      </span>
    </div>
  )
}

function LabCounts({ lab }: { lab: SubscribeLab }) {
  const counts = useSyncExternalStore(lab.subscribeCounts, lab.getCounts)
  return (
    <p aria-label="subscribe 调用次数">
      引用稳定的 subscribe 被调用 <strong>{counts.stable}</strong> 次；每次渲染新建的 subscribe 被调用{' '}
      <strong>{counts.inline}</strong> 次
    </p>
  )
}

export function SubscribeLabCard() {
  const [lab] = useState(createSubscribeLab)
  return (
    <div className="stack">
      <strong>实验：subscribe 的引用要稳定</strong>
      <LabProbe lab={lab} />
      <LabCounts lab={lab} />
      <p className="muted">
        每点一次，「每次渲染新建」那一行就多一次退订 + 重订，另一行不变。开发环境 StrictMode 会在挂载时多跑一轮
        setup + cleanup，所以两行的起始值都是 2（生产是 1）。
      </p>
    </div>
  )
}

/** 两个面板 + 卸载开关。showB 放在这里而不是外层：切换它时不会顺带让下面的实验组件重渲染 */
function WidthPanels() {
  const [showB, setShowB] = useState(true)
  return (
    <>
      <WidthPanel title="面板 A" threshold={768} />
      {showB && <WidthPanel title="面板 B" threshold={1024} />}
      <div className="row">
        <button onClick={() => setShowB((s) => !s)}>{showB ? '卸载面板 B' : '重新挂载面板 B'}</button>
        <span className="muted">卸载 B 只取消 B 自己的订阅，A 不受影响 —— 每次调用 Hook，订阅都是独立的一份。</span>
      </div>
    </>
  )
}

export function WindowWidthDemo() {
  return (
    <div className="card stack">
      <h3>区块一：订阅浏览器 API —— useSyncExternalStore（主线）与 useEffect 订阅（并排）</h3>
      <p className="muted">
        拖动浏览器窗口改变宽度，两个面板实时更新；每个面板里的两个数字分别来自主线和并排写法。
        同步更新的普通页面上两者看起来一样，差别在并发渲染（tearing）和服务端渲染（见文件头）。
      </p>
      <WidthPanels />
      <SubscribeLabCard />
    </div>
  )
}
