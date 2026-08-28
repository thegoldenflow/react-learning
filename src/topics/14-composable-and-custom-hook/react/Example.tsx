/**
 * 学习主题：自定义 Hook 与 Composable —— 逻辑复用
 *
 * React 核心概念：
 * - 自定义 hook：以 use 开头、内部调用其他 hook 的普通函数 —— 复用的是「逻辑」，每个调用方的状态各自独立
 * - useState + useEffect（挂监听，cleanup 卸监听）是订阅外部系统的标准组合
 * - Hooks 规则：只能在组件 / 自定义 hook 的【顶层】调用，禁止放进条件、循环、嵌套函数 ——
 *   React 按「调用顺序」把每个 hook 对应到内部状态槽，顺序一错位全部错乱；eslint-plugin-react-hooks 强制检查
 * - use 前缀不是命名风格：lint 靠它识别 hook 才能实施上述规则（硬规则）
 *
 * Vue 对应概念：
 * - composable：同样以 use 开头的普通函数（社区约定，非强制），内部用 ref + onMounted/onUnmounted
 * - effect 的 cleanup ≈ onUnmounted 里移除监听器
 *
 * 最重要的区别：
 * - Vue 的 composable 没有「只能顶层调用」的限制（响应式靠 Proxy 追踪，不靠调用顺序），
 *   但受「生命周期钩子必须在 setup 同步执行期间注册」的约束 —— 两个约束不同源，没有一一对应关系。
 * - React 的 hook 每次渲染整个重跑、返回普通值；Vue 的 composable 只在 setup 跑一次、返回 Ref 容器。
 */
import { useState } from 'react'
import { useWindowWidth } from './useWindowWidth'

/**
 * 两个 WidthPanel 实例各自调用 useWindowWidth：每次调用都得到独立的 state 和独立的 resize 订阅 ——
 * 复用的是「逻辑」，不是「状态」。两个面板显示的数字相同，只因为它们同步的是同一个外部源（窗口宽度）；
 * 状态本身是两份 —— 卸载面板 B 只清理 B 自己的监听器，A 不受影响（下方按钮可验证）。
 */
interface WidthPanelProps {
  title: string
  /** 宽窄分界线（px）：两个面板用不同阈值，对同一宽度得出不同的「窄/宽」结论 */
  threshold: number
}

function WidthPanel({ title, threshold }: WidthPanelProps) {
  // ✅ 正确用法：在组件顶层无条件调用
  const width = useWindowWidth()

  // ❌ 违规示例（放开注释后 eslint-plugin-react-hooks 的 rules-of-hooks 规则会直接报错）：
  // if (width > threshold) {
  //   const wide = useWindowWidth() // Error: React Hook "useWindowWidth" is called conditionally.
  // }
  //
  // 为什么禁止（面试必考）：React 不靠变量名识别状态，而是按【调用顺序】——
  // 「第 1 次 hook 调用对应第 1 个状态槽、第 2 次对应第 2 个……」。hook 一旦进了
  // 条件/循环/嵌套函数，前后两次渲染的调用顺序就可能错位，从错位处起所有 hook
  // 都会拿到别人的状态。Vue 的 composable 没有这条限制（响应式靠 Proxy 追踪、
  // 不靠顺序），但它受「生命周期钩子须在 setup 同步执行期间注册」的另一种约束 ——
  // 两个约束不同源，没有一一对应关系。

  // 「窄/宽」是渲染期间算出的派生值，不需要 state（09 题）；Vue 版对应 computed
  const isNarrow = width < threshold

  return (
    <div className="card">
      <div className="row">
        <strong>{title}</strong>
        <span className="badge">{isNarrow ? '窄' : '宽'}（阈值 {threshold}px）</span>
      </div>
      <p>
        当前窗口宽度：<strong>{width}px</strong>
      </p>
    </div>
  )
}

export default function Example() {
  const [showB, setShowB] = useState(true)

  return (
    <div className="stack">
      <p className="muted">拖动浏览器窗口边缘改变宽度，两个面板会实时更新（各自独立订阅 resize）</p>

      <WidthPanel title="面板 A" threshold={768} />
      {showB && <WidthPanel title="面板 B" threshold={1024} />}

      <div className="row">
        <button onClick={() => setShowB((s) => !s)}>
          {showB ? '卸载面板 B' : '重新挂载面板 B'}
        </button>
      </div>
      <p className="muted">
        卸载面板 B 时，它那次 useWindowWidth 调用里 effect 的 cleanup 会移除 B 自己的监听器，
        面板 A 不受影响 —— 印证「每次调用 hook，状态与订阅都是独立的一份」。
      </p>
    </div>
  )
}
