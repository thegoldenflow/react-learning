/**
 * 区块二：自定义 Hook 接收回调 —— useEffectEvent（useInterval）与「回调进依赖」的反例并排。
 * Vue 对照：vue/IntervalDemo.vue。
 */
import { useState } from 'react'
import { useInterval, useIntervalNaive } from './useInterval'

export function IntervalDemo({ delay = 1000, noiseMs = 300 }: { delay?: number; noiseMs?: number }) {
  const [step, setStep] = useState(1)
  const [paused, setPaused] = useState(false)
  const [noisy, setNoisy] = useState(false)
  const [good, setGood] = useState(0)
  const [naive, setNaive] = useState(0)
  const [noise, setNoise] = useState(0)

  const activeDelay = paused ? null : delay
  // 两个计数器每次都加 step：回调里读到的都是最新的 step（前者靠 useEffectEvent，后者靠每次重建定时器）
  useInterval(() => setGood((c) => c + step), activeDelay)
  useIntervalNaive(() => setNaive((c) => c + step), activeDelay)
  // 「干扰」：每 noiseMs 毫秒让本组件重渲染一次，比 delay 更勤
  useInterval(() => setNoise((n) => n + 1), noisy ? noiseMs : null)

  return (
    <div className="card stack">
      <h3>区块二：自定义 Hook 接收回调 —— useEffectEvent（较新·19.2）</h3>
      <p className="muted">
        两个计数器每 {delay / 1000} 秒加一次步长。改步长两边都立刻用上新值；打开「干扰」后本组件每 {noiseMs}ms
        重渲染一次：回调进依赖的写法每次渲染都重建定时器，等不到触发，计数停住。
      </p>
      <div className="row">
        <label className="row">
          <span>步长</span>
          <input
            type="number"
            min={1}
            value={step}
            onChange={(e) => setStep(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 64 }}
          />
        </label>
        <label className="row">
          <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
          <span>暂停（delay 传 null）</span>
        </label>
        <label className="row">
          <input type="checkbox" checked={noisy} onChange={(e) => setNoisy(e.target.checked)} />
          <span>干扰：每 {noiseMs}ms 重渲染一次</span>
        </label>
      </div>
      <ul>
        <li aria-label="useEffectEvent 版计数">
          useEffectEvent 版（依赖只有 delay）：<strong>{good}</strong>
        </li>
        <li aria-label="回调进依赖版计数">
          回调进依赖的反例（依赖 [callback, delay]）：<strong>{naive}</strong>
        </li>
      </ul>
      <p className="muted">干扰重渲染次数：{noise}</p>
    </div>
  )
}
