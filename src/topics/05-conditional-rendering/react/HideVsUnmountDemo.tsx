/**
 * 区块四：隐藏还是卸载 —— 三种「让它看不见」的写法，对 state、DOM、Effect 的影响各不相同。
 * - {visible && <Panel />}：卸载。state 和 DOM 都没了，Effect 被清理；再显示时从头来（「when React removes a component, it destroys its state」）。
 * - <div hidden={!visible}>：只是藏起来，组件一直在树里。state、DOM 都在，Effect 也一直在跑（订阅、定时器照常工作）。
 * - <Activity mode="hidden">【较新·19.2 起】：React 替你用 display: none 藏起来，state 和 DOM 保留，Effect 被清理，隐藏期间的更新降为低优先级；再显示时 Effect 重新建立。
 * Vue 对照：vue/HideVsUnmountDemo.vue（v-if / v-show / <KeepAlive>）。
 */
import { Activity, useEffect, useState } from 'react'
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

export function HideVsUnmountDemo() {
  const [log] = useState(() => createDemoLog())
  const [visible, setVisible] = useState(true)

  return (
    <div className="card stack">
      <h3>区块四：隐藏还是卸载 —— &&、hidden 属性、&lt;Activity&gt;</h3>
      <p className="muted">在三块面板里各点几次赞、打几个字，然后「隐藏」再「显示」，对比哪块面板的内容还在，再看日志里 Effect 的变化。</p>
      <div className="row">
        <button onClick={() => setVisible((v) => !v)}>{visible ? '隐藏三块面板' : '显示三块面板'}</button>
      </div>

      {/* ❌ 想保留状态时不要用 &&：隐藏就是卸载 */}
      <div className="card">{visible && <Panel name="&& 卸载" log={log} />}</div>

      {/*
        hidden 属性：浏览器不渲染这个元素（MDN ③：「Web browsers may implement the hidden state using display: none」；给它设了 CSS display 会覆盖 hidden）。
        官方把「用 CSS 藏起来」列为保留 state 的做法之一，也提醒「it can get very slow if the hidden trees are large」。隐藏的元素里脚本和表单照样有效，Effect 也一直在跑。
      */}
      <div className="card" hidden={!visible} data-testid="hidden-wrapper">
        <Panel name="hidden 属性" log={log} />
      </div>

      {/* <Activity>：「You can use Activity as an alternative to conditionally rendering parts of your app」（19.2 发布博客）。隐藏时给子元素加 display: none !important（react-dom 19.2.8，测试覆盖） */}
      <div className="card">
        <Activity mode={visible ? 'visible' : 'hidden'}>
          <Panel name="Activity" log={log} />
        </Activity>
      </div>

      <LogPanel log={log} label="区块四日志" />
      <p className="muted">
        页面开着 StrictMode：开发环境里组件新挂载、以及 &lt;Activity&gt; 重新显示时，React 会多跑一轮「清理 → 建立」来检查 Effect 的清理函数写得对不对（10 题），所以日志里会多出几行。Activity 参考页：「we recommend adding &lt;StrictMode&gt; which will eagerly perform Activity
        unmounts and mounts to catch any unexpected side-effects.」（Chrome 与 jsdom 实测一致）；生产构建没有这一轮。
      </p>
      <p className="muted">
        第四种办法是把 state 提升到父组件（官方说这是「the most common solution」，25 题）：子组件卸载了也不要紧，数据在父组件手里；需要跨刷新保留的草稿再存进 localStorage。
      </p>
    </div>
  )
}
