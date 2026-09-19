/**
 * 区块四：隐藏还是卸载 —— 几种「让它看不见」的写法，对 state、DOM、Effect 的影响各不相同（按项目里的使用频率排列，【少用】的已注释）。
 * - 【最常用】{visible && <Panel />}：卸载。state 和 DOM 都没了，Effect 被清理；再显示时从头来（「when React removes a component, it destroys its state」）。
 * - 【最常用】状态提升：面板照样用 && 卸载，但点赞数和输入内容放在父组件里，再显示时原样传回来（官方：「This is the most common solution.」）。
 * - 【常用】<div hidden={!visible}>：只是藏起来，组件一直在树里。state、DOM 都在，Effect 也一直在跑（订阅、定时器照常工作）。
 * - 【少用】<Activity mode="hidden">【较新·19.2 起】（已注释，取消注释即可运行）：React 替你用 display: none 藏起来，state 和 DOM 保留，Effect 被清理，隐藏期间的更新降为低优先级；再显示时 Effect 重新建立。
 * Vue 对照：vue/HideVsUnmountDemo.vue（v-if / v-show / <KeepAlive>）。
 */
import { useEffect, useState } from 'react'
/* 【少用】取消下面 <Activity> 面板的注释时，这一段也取消注释（删掉这一行和下面的结束行）
import { Activity } from 'react'
*/
import { createDemoLog, type DemoLog } from './demoKit'
import { LogPanel } from './LogPanel'

/**
 * 面板里有两种「状态」：React state（点赞数）和 DOM 自己的状态（非受控输入框里打的字）。
 * Effect 模拟一个订阅：挂载时记「开始订阅」，清理时记「取消订阅」。
 */
function Panel({ name, log }: { name: string; log: DemoLog }) {
  const [likes, setLikes] = useState(0)

  useEffect(() => {
    log.add(`${name}：Effect 建立（开始订阅）`)
    return () => log.add(`${name}：Effect 清理（取消订阅）`)
  }, [name, log])

  return (
    <div className="stack" data-testid={`panel-${name}`}>
      <div className="row">
        <strong>{name}</strong>
        <button onClick={() => setLikes((n) => n + 1)}>点赞 {likes}</button>
      </div>
      {/* 非受控输入框：打的字只存在 DOM 里，DOM 被删掉就没了 */}
      <input placeholder="随便打几个字" aria-label={`${name} 的输入框`} />
    </div>
  )
}

/**
 * 状态提升版的面板：自己不存任何数据，点赞数和输入内容都由父组件通过 props 传进来（输入框改成受控）。
 * 组件被 && 卸载时，丢掉的只是它自己（Effect 照样被清理），数据还在父组件手里（25 题）。
 */
function LiftedPanel({
  likes,
  onLike,
  draft,
  onDraftChange,
  log,
}: {
  likes: number
  onLike: () => void
  draft: string
  onDraftChange: (value: string) => void
  log: DemoLog
}) {
  useEffect(() => {
    log.add('状态提升：Effect 建立（开始订阅）')
    return () => log.add('状态提升：Effect 清理（取消订阅）')
  }, [log])

  return (
    <div className="stack" data-testid="panel-状态提升">
      <div className="row">
        <strong>状态提升</strong>
        <button onClick={onLike}>点赞 {likes}</button>
      </div>
      <input value={draft} onChange={(e) => onDraftChange(e.target.value)} placeholder="随便打几个字" aria-label="状态提升 的输入框" />
    </div>
  )
}

export function HideVsUnmountDemo() {
  const [log] = useState(() => createDemoLog())
  const [visible, setVisible] = useState(true)
  // 提升上来的数据：LiftedPanel 被卸载时它们还在
  const [liftedLikes, setLiftedLikes] = useState(0)
  const [liftedDraft, setLiftedDraft] = useState('')

  return (
    <div className="card stack">
      <h3>区块四：隐藏还是卸载 —— &&、状态提升、hidden 属性</h3>
      <p className="muted">在每块面板里各点几次赞、打几个字，然后「隐藏」再「显示」，对比哪块面板的内容还在，再看日志里 Effect 的变化。</p>
      <div className="row">
        <button onClick={() => setVisible((v) => !v)}>{visible ? '隐藏面板' : '显示面板'}</button>
      </div>

      {/* 【最常用】不需要保留时直接卸载；想保留状态时不能只写 &&：隐藏就是卸载 */}
      <div className="card">
        <p className="muted">【最常用】不需要保留：直接 && 卸载</p>
        {visible && <Panel name="&& 卸载" log={log} />}
      </div>

      {/* 【最常用】需要保留时把 state 提升到父组件：面板照样被 && 卸载（日志里有 Effect 清理），数据不丢 */}
      <div className="card">
        <p className="muted">【最常用】需要保留：把 state 提升到父组件，面板照样 && 卸载</p>
        {visible && (
          <LiftedPanel
            likes={liftedLikes}
            onLike={() => setLiftedLikes((n) => n + 1)}
            draft={liftedDraft}
            onDraftChange={setLiftedDraft}
            log={log}
          />
        )}
      </div>

      {/*
        【常用】hidden 属性：浏览器不渲染这个元素（MDN ③：「Web browsers may implement the hidden state using display: none」；给它设了 CSS display 会覆盖 hidden）。
        官方把「用 CSS 藏起来」列为保留 state 的做法之一，也提醒「it can get very slow if the hidden trees are large」。隐藏的元素里脚本和表单照样有效，Effect 也一直在跑。
      */}
      <div className="card">
        <p className="muted">【常用】hidden 属性 / CSS 隐藏：组件一直在，Effect 一直跑</p>
        <div hidden={!visible} data-testid="hidden-wrapper">
          <Panel name="hidden 属性" log={log} />
        </div>
      </div>

      {/* 【少用】<Activity>（19.2 起才有）：「You can use Activity as an alternative to conditionally rendering parts of your app」（19.2 发布博客）。隐藏时给子元素加 display: none !important，state 和 DOM 保留、Effect 被清理（react-dom 19.2.8；演示注释期间由 Example.test.tsx 里的独立组件验证） */}
      {/* 【少用】取消注释即可运行：删掉这一行和下面的结束行，并取消文件顶部 import { Activity } 那一段的注释
      <div className="card">
        <p className="muted">【少用】&lt;Activity&gt;【较新·19.2 起】：保留 state 和 DOM，清理 Effect</p>
        <Activity mode={visible ? 'visible' : 'hidden'}>
          <Panel name="Activity" log={log} />
        </Activity>
      </div>
      */}

      <LogPanel log={log} label="区块四日志" />
      <p className="muted">
        页面开着 StrictMode：开发环境里组件新挂载时（取消注释 &lt;Activity&gt; 面板后，它重新显示时也一样），React 会多跑一轮「清理 → 建立」来检查 Effect 的清理函数写得对不对（10 题），所以日志里会多出几行。Activity 参考页：「we recommend adding &lt;StrictMode&gt; which will eagerly perform Activity
        unmounts and mounts to catch any unexpected side-effects.」（Chrome 与 jsdom 实测一致）；生产构建没有这一轮。
      </p>
    </div>
  )
}
