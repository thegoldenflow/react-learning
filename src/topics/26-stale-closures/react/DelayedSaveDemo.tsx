/**
 * 区块一：事件处理函数里的 setTimeout —— 没有 Effect 参与，闭包照样过期。
 * Vue 对照：vue/DelayedSaveDemo.vue。
 *
 * 很多人以为过期闭包是 useEffect 的专属问题 —— 不是。它是「闭包 + 渲染快照」的产物：
 * 只要一个回调晚于创建它的那次渲染执行，读到的就是那次渲染的 state（react.dev state-as-a-snapshot 的 setTimeout + alert 例子）。
 * 这个区块里的定时器由点击直接创建，和 Effect 无关；区块里的两个 Effect（给 latest ref 同步最新值、卸载时清定时器）是修法和清理，不是病因。
 *
 * 四个按钮，两组对照：
 * 1）「保存」组：回调要读最新的 count 去做别的事（这里是写日志，真实业务里是发请求 / 上报）。
 *    坏版本读闭包里的 count —— 点击那次渲染的快照；好版本读 latestCount.current —— 跨渲染同一个的盒子，每次渲染后同步成最新值。
 *    函数式更新在这组帮不上忙：setCount(c => c + 1) 的 c 只在更新函数内部可用，拿不出来发请求。
 *    useEffectEvent 在这里也不能用：useEffectEvent 页 Caveats「Effect Events can only be called from inside Effects or other Effect Events」，
 *    而这是事件处理函数创建的定时器。
 *    所以「Effect 之外的延迟回调要读最新值」正是 19.2 之后仍要用 latest ref 的场景。
 * 2）「+1」组：回调要「由旧值算新值」。坏版本 setCount(count + 1) 用的是点击那次渲染的 count，中间加的全被盖回去（数字倒退）；
 *    好版本 setCount(c => c + 1)：c 由 React 在处理这个更新时传入，是排在它前面的更新都生效之后的值。
 */
import { useEffect, useRef, useState } from 'react'
import { createDemoLog, SAVE_DELAY_MS, useTimeouts } from './demoKit'
import { LogPanel } from './LogPanel'

export function DelayedSaveDemo() {
  const [count, setCount] = useState(0)
  const [log] = useState(() => createDemoLog())
  const later = useTimeouts()

  /**
   * latest ref（社区惯用法 · 并排，见 Example.tsx 二-8）。
   * useRef 返回的对象在组件整个生命周期里是同一个；这个 Effect 故意不写依赖数组（每次渲染后都执行），职责就是「每次提交后同步一次」。
   * 为什么不直接在函数体里写 latestCount.current = count：useRef 页 Caveats「Do not write or read ref.current during rendering,
   * except for initialization」，eslint-plugin-react-hooks 7 的 refs 规则会报 error「Cannot access refs during render」（2026-09-18 实测）。
   * 代价（本题测试覆盖）：同步发生在 useEffect 里，在它执行之前有一个窗口 —— 本组件的 useLayoutEffect、子组件的 Effect 读到的还是旧值。
   * 本例在 2 秒后的定时器里读，早已过了这个窗口。
   * 另一种写法来自 react.dev 的挑战题「Read the latest state」：在改 state 的事件处理函数里顺手写 ref（setText(v); textRef.current = v），
   * 没有窗口期；前提是这个值只在少数几个你控制的处理函数里变 —— 本例 count 有 +1、归零、延迟 +1 三处在改，放 Effect 里同步更不容易漏。
   */
  const latestCount = useRef(count)
  useEffect(() => {
    latestCount.current = count
  })

  /** ❌ 读闭包里的 count：这是点击那次渲染的快照，2 秒后早就不是页面上的数字了 */
  const saveStale = () => {
    log.add(`已安排：2 秒后保存（读快照）。此刻 count=${count}，现在快去点几次 +1`)
    later(() => {
      log.add(`【坏】保存了 count=${count} —— 点击那次渲染的快照`)
    }, SAVE_DELAY_MS)
  }

  /** ✅ 读 latestCount.current：ref 对象跨渲染是同一个，里面的值每次提交后都被刷新 */
  const saveLatest = () => {
    log.add(`已安排：2 秒后保存（读 latest ref）。此刻 count=${count}，现在快去点几次 +1`)
    later(() => {
      log.add(`【好】保存了 count=${latestCount.current} —— 读的是 ref 里的最新值，和页面一致`)
    }, SAVE_DELAY_MS)
  }

  /** ❌ setCount(count + 1)：用点击那次渲染的 count 算，中间加的全被盖回去，数字倒退 */
  const addStale = () => {
    log.add(`已安排：2 秒后 setCount(${count} + 1)。现在快去点几次 +1，看数字会不会倒退`)
    later(() => {
      setCount(count + 1)
      log.add(`【坏】执行了 setCount(${count} + 1)：页面被打回 ${count + 1}`)
    }, SAVE_DELAY_MS)
  }

  /** ✅ setCount(c => c + 1)：在排队的更新都生效之后的值上 +1，中间加的都保住 */
  const addUpdater = () => {
    log.add('已安排：2 秒后 setCount(c => c + 1)。现在快去点几次 +1')
    later(() => {
      setCount((c) => c + 1)
      // 更新函数必须是纯函数（StrictMode 开发环境会调用两次），日志写在它外面
      log.add('【好】执行了 setCount(c => c + 1)：c 由 React 传入，中间加的都保住了')
    }, SAVE_DELAY_MS)
  }

  return (
    <div className="card stack">
      <h3>区块一：事件处理函数里的 setTimeout —— 没有 Effect 参与，闭包照样过期</h3>
      <p className="muted">
        点任意一个「2 秒后…」按钮，然后在 2 秒内连点几次 +1，再看日志：「坏」的两个读到 / 算出的是点击那次渲染的旧值（+1
        那个还会把数字倒退回去），「好」的两个和页面一致。函数式更新只救「由旧算新」；要读最新值做别的事，这里只能用 latest
        ref（useEffectEvent 只能在 Effect 里调用）。
      </p>
      <p>
        当前 count：<strong aria-label="区块一 count">{count}</strong>
      </p>
      <div className="row">
        <button className="btn-primary" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
        <button className="btn-ghost" onClick={() => setCount(0)}>
          归零
        </button>
      </div>
      <div className="row">
        <button onClick={saveStale}>2 秒后保存（坏：读快照 count）</button>
        <button onClick={saveLatest}>2 秒后保存（好：读 latestCount.current）</button>
      </div>
      <div className="row">
        <button onClick={addStale}>2 秒后 +1（坏：setCount(count + 1)）</button>
        <button onClick={addUpdater}>{'2 秒后 +1（好：setCount(c => c + 1)）'}</button>
      </div>
      <LogPanel log={log} label="区块一日志" />
    </div>
  )
}
