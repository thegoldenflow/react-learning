/**
 * 学习主题：自定义 Hook 与 Composable —— 逻辑复用
 *
 * React 核心概念：
 * - 自定义 hook：以 use 开头、内部调用其他 hook 的普通函数 —— 复用的是「逻辑」，每个调用方的状态各自独立
 * - useState + useEffect（挂监听，cleanup 卸监听）是订阅外部系统的标准组合
 * - Hooks 规则：只能在组件 / 自定义 hook 的【顶层】调用，禁止放进条件、循环、嵌套函数 ——
 *   React 按「调用顺序」把每个 hook 对应到内部状态槽，顺序一错位全部错乱；eslint-plugin-react-hooks 强制检查
 * - use 前缀不是命名风格：lint 靠它识别 hook 才能实施上述规则（硬规则）
 * - 防抖 hook useDebouncedValue：useState 存延迟值 + useEffect 里 setTimeout + cleanup 里 clearTimeout，
 *   依赖 [value, delay] —— clearTimeout 不是顺手清理，它就是防抖算法本身；面试高频手写题
 * - 组件函数每次渲染整体重跑：函数体里的普通局部变量（如 let timer）活不过一次渲染，
 *   跨渲染要存活的定时器 id 只能待在 effect 闭包里（配 cleanup），或存进 useRef（12 题用途二）
 *
 * Vue 对应概念：
 * - composable：同样以 use 开头的普通函数（社区约定，非强制），内部用 ref + onMounted/onUnmounted
 * - effect 的 cleanup ≈ onUnmounted 里移除监听器
 * - 防抖 composable：watch + setTimeout + onUnmounted 清理；定时器 id 就是 setup 作用域里的一个普通 let 变量
 *
 * 最重要的区别：
 * - Vue 的 composable 没有「只能顶层调用」的限制（响应式靠 Proxy 追踪，不靠调用顺序），
 *   但受「生命周期钩子必须在 setup 同步执行期间注册」的约束 —— 两个约束不同源，没有一一对应关系。
 * - React 的 hook 每次渲染整个重跑、返回普通值；Vue 的 composable 只在 setup 跑一次、返回 Ref 容器。
 * - 由此延伸出防抖实现的差异：Vue 的 setup 只跑一次，`let timer` 天然跨更新存活；
 *   React 每次渲染都重新执行函数体，同样的写法会被重置 —— 这是 Vue 老手写 React 防抖最容易踩的坑。
 */
import { useEffect, useState } from 'react'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'
import { useDebouncedValue } from './useDebouncedValue'
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

/**
 * 第二个演示：防抖搜索 —— 用自定义 hook useDebouncedValue 把「输入」和「请求」解耦。
 *
 * 10 题的搜索是每敲一个字符就发一次请求（那一题故意不防抖，专讲竞态）；
 * 这一题把「延迟」这段逻辑抽成 hook，输入框照常受控，请求只跟着防抖后的值走。
 * 注意这正是自定义 hook 的价值所在：抽走的是【逻辑】，组件里只剩下一行调用，
 * 而且任何一个组件都能复用同一段防抖逻辑、各自持有独立的定时器与状态。
 */
function DebouncedUserSearch() {
  // 受控输入框的原始值：每敲一个字符就变一次
  const [keyword, setKeyword] = useState('')

  // ✅ 顶层无条件调用 —— 本题两个自定义 hook（useWindowWidth 与 useDebouncedValue）
  // 都遵守 Hooks 规则：只在组件 / 自定义 hook 的顶层调用，不放进条件、循环或嵌套函数。
  // 延迟值：keyword 停止变化 500ms 后，debouncedKeyword 才追上来
  const debouncedKeyword = useDebouncedValue(keyword, 500)

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // 「正在等待防抖」是渲染期间算出的派生值，不需要 state（09 题）；Vue 版对应 computed
  const waiting = keyword !== debouncedKeyword

  /**
   * 依赖数组写 [debouncedKeyword] 而不是 [keyword] —— 这一行就是整个防抖优化的落点：
   * effect 只在「防抖后的值」变化时重跑，中间那些一闪而过的中间态根本不会触发请求。
   *
   * 防抖之后仍然要 AbortController（10 题教过的写法）：防抖只是把请求数量降下来，
   * 并没有消灭竞态 —— 只要还可能连发两次（比如输入「张」停手、又输入「王」），
   * 先发的慢请求依旧可能后返回并覆盖新结果。cleanup 里 abort 才是竞态的根治办法。
   * 注意这里有两层 cleanup 在协作，各管各的：
   *   - useDebouncedValue 内部的 cleanup 负责 clearTimeout（取消上一个待触发的计时）
   *   - 这里的 cleanup 负责 abort（取消上一个在途请求）
   * 「一个 effect 只做一件事、自带自己的清理」是 React 组织副作用的基本思路。
   */
  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    fetchUsers(debouncedKeyword, { signal: controller.signal })
      .then((list) => {
        setUsers(list)
        setLoading(false)
      })
      .catch((err: unknown) => {
        // 「被取消」不是失败，必须忽略（完整错误处理是 11 题）
        if (isAbortError(err)) return
        setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedKeyword])

  return (
    <div className="card">
      <h3>防抖搜索（useDebouncedValue）</h3>
      <p className="muted">
        连续快速输入：「当前输入」立刻变，「防抖后的关键词」要停手 500ms 才跟上 —— 请求只在后者变化时发出
      </p>

      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜索姓名或邮箱，如「张」或 example"
      />

      {/* 把两个值并排显示出来，肉眼就能看见「滞后」这件事本身 */}
      <p>
        当前输入：<strong>{keyword || '（空）'}</strong>
        {waiting && <span className="badge badge-pending">等待防抖…</span>}
      </p>
      <p>
        防抖后的关键词（真正拿去请求的值）：<strong>{debouncedKeyword || '（空）'}</strong>
      </p>

      {loading && <p className="muted">加载中…</p>}
      {!loading && users.length === 0 && <p className="muted">没有匹配的用户</p>}

      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name}（{u.email}）<span className="badge">{u.role}</span>
          </li>
        ))}
      </ul>
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

      {/* 第二个自定义 hook 的演示：useWindowWidth 抽的是「订阅外部系统」，
          useDebouncedValue 抽的是「跨时间的定时逻辑」—— 两类最常见的自定义 hook 场景 */}
      <DebouncedUserSearch />
    </div>
  )
}
