<script setup lang="ts">
/**
 * 学习主题：异步竞态、取消与过期响应 —— 先发的慢请求后返回时，怎样不让它覆盖正确结果
 *
 * React 核心概念：
 * - 竞态（race condition）：keyword 从 a 打到 angf 会连发 4 个请求，而网络不保证按发出顺序返回。
 *   本题用确定性延迟（a=1100ms、an=800ms、ang=500ms、angf=200ms）让「后发先至」100% 复现：
 *   请求 A（#1「a」）先发出、请求 B（#4「angf」）后发出，B 先返回、A 最后返回（三个面板的时间线都能看到）
 * - 过期响应（stale response）：响应回来时，它对应的关键词已经不是当前关键词。不处理就会覆盖新结果 ——
 *   面板一会亮出红字「当前关键词 angf ／ 列表来自请求「a」」：UI 与数据悄悄对不上、不报错，是最难发现的一类 bug
 * - effect 的 cleanup 就是天然的「你已过期」信号：keyword 一变，React 先跑上一轮的 cleanup、再跑新一轮 setup。
 *   在 cleanup 里做两件事之一即可根治：① let ignore = true，响应回来后丢弃（官方文档模式，面板二）；
 *   ② controller.abort()，真正取消请求（面板三）
 * - AbortController：new 一个 → 把 signal 交给 fetch / mock API → cleanup 里 abort() → promise 以 AbortError 拒绝。
 *   取消不是失败：catch 里必须先 isAbortError → return，否则每敲一个字符都会闪一次错误
 * - ignore vs abort：ignore 只是「不用这个响应」，网络传输和服务端计算照做；abort 连网络都省了
 * - 每个面板都用判别联合建模 idle | loading | success | error（11 题的建模方式），success 里多存一个 forKeyword，
 *   页面据此判断列表有没有过期
 *
 * Vue 对应概念：
 * - watch(source, (kw, _prev, onCleanup) => …)：onCleanup 与 effect cleanup 一一对应 ——
 *   下一次回调执行前 + watcher 停止（组件卸载）时都会执行，一个 API 覆盖两个时机，和 React 的 cleanup 一样
 * - 三种策略逐字同构：不注册 onCleanup（坏，面板一）／ onCleanup(() => { ignore = true })（面板二）／
 *   onCleanup(() => controller.abort())（面板三）——「病」与「药」都和 React 一样，只是挂药的位置不同
 * - watch 默认懒执行：挂载时不跑，恰好对应本题的「初始 idle、'' 不发请求」；
 *   React 的 effect 首次渲染后必然执行一次，所以 React 侧要显式判断 keyword === '' 再 return
 * - 请求序号用 setup 作用域的普通 let 就够了（setup 只跑一次，变量长期存活）；React 侧要用 useRef 才能跨渲染保存
 * - 11 题那种命令式 load() 没有 onCleanup 可用：在函数开头 abort 上一个 controller，或比对请求序号（那就是 ignore 的命令式版本）
 * - 「重置」：React 侧换 key 让三个面板销毁重建；Vue 侧状态就在 setup 里，直接赋回初始值 ——
 *   但 ref 是长期存活的容器，坏面板迟到的响应在重置后照样落地；React 侧旧实例的 setState 是 no-op。这一点没有一一对应关系
 *
 * 最重要的区别：
 * - 竞态是「异步 + 可变的当前状态」的固有问题，与框架无关：Vue 侧不处理同样会被覆盖，面板一在 Vue 里一样坏。
 *   两边的解法也一样（ignore / abort），区别只在「挂药的位置」：React 挂在 effect 的返回值上，
 *   Vue 挂在 watch 回调的 onCleanup 参数上。
 *   React 的 StrictMode 会在开发期把 effect「挂载→卸载→重挂载」一遍来检验 cleanup 写没写对，
 *   Vue 没有对应机制（没有一一对应关系）
 * - 与邻题的分工：10 题 = effect / watch 基础，只顺带展示了「cleanup 里 abort」这一种修法；
 *   11 题 = 请求状态怎么建模（loading / success / error / empty 与重试）；
 *   27 题 = 竞态本身：可复现的乱序、三种策略并排对比、过期响应的语义，以及每个面板各自的 loading / error / empty
 */
import { onUnmounted, ref, watch } from 'vue'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { PanelState } from './panelTypes'
import ResultPanel from './ResultPanel.vue'

/**
 * 确定性延迟：关键词越长、响应越快 —— a=1100ms、an=800ms、ang=500ms、angf=200ms（与 React 侧完全一致）。
 * 真实网络里「先发后至」是概率事件，靠运气复现不了 bug；把延迟做成关键词长度的函数，四个请求就一定逆序返回。
 * 结果集也刻意不同：「a」匹配全部 8 个用户（每个邮箱的 example 里都有 a）、「angf」只匹配 1 个（王芳）。
 */
const delayFor = (keyword: string) => Math.max(200, 1400 - keyword.length * 300)

/** 自动演示的输入序列与间隔：a → an → ang → angf，每 150ms 敲一个字符（比最快的响应 200ms 还快） */
const DEMO_STEPS = ['a', 'an', 'ang', 'angf'] as const
const DEMO_STEP_GAP_MS = 150
const DELAY_TABLE = DEMO_STEPS.map((step) => `${step} = ${delayFor(step)}ms`).join('，')

const toMessage = (err: unknown) => (err instanceof Error ? err.message : '未知错误')

// 三个面板共享的输入：一个关键词同时驱动三种策略，才看得出差别
const keyword = ref('')
const shouldFail = ref(false)
// 重试计数：+1 即让三个 watch 用同样参数重新请求。Vue 里更自然的写法是直接调一个 load() 函数（11 题），
// 但本题的 cleanup 必须挂在 watch 回调的 onCleanup 上，所以重试也走 watch —— 与 React 侧的 reloadFlag 对齐
const reloadFlag = ref(0)
const demoRunning = ref(false)

// 三个面板各自的状态与时间线。React 侧这些 state 住在三个子组件里；Vue 侧三个 watch 都写在这一个 setup 里
//（onCleanup 只能在 watch 回调里拿到），所以状态也就近放在这里，ResultPanel 只负责画。
// 日志放 ref 而不是模块级变量：切题 / 重挂载都不会串。React 侧必须 setLines(prev => [...prev, line]) 造新数组，Vue 直接 push。
const brokenState = ref<PanelState>({ status: 'idle' })
const brokenLines = ref<string[]>([])
// 请求序号：setup 作用域的普通变量就够了（不参与渲染、且 setup 只跑一次）；React 侧要用 useRef 才能跨渲染保存
let brokenSeq = 0

const ignoreState = ref<PanelState>({ status: 'idle' })
const ignoreLines = ref<string[]>([])
let ignoreSeq = 0

const abortState = ref<PanelState>({ status: 'idle' })
const abortLines = ref<string[]>([])
let abortSeq = 0

/**
 * ★ 面板一【坏】：watch 回调里发请求，响应回来就写 —— 没有注册 onCleanup。
 *
 * 和 React 侧 BrokenSearch 逐行对应，结果也一样坏：用自动演示复现（请求 A = #1，请求 B = #4），
 * #4「angf」最先返回、页面短暂正确，然后 #3、#2、#1 依次返回并各覆盖一次，最终停在「a」的 8 个人，
 * 而输入框里明明是 angf —— 红字亮起。这证明竞态不是 React 的问题，是异步本身的问题。
 *
 * watch 的 source 写成数组 [keyword, shouldFail, reloadFlag]：任一变化都重跑回调，对应 React 的依赖数组
 * [keyword, shouldFail, reloadFlag]；差别是 Vue 显式声明 source、不存在「漏依赖」这个坑。
 * watch 默认懒执行，所以挂载时不发请求（React 侧要靠 keyword === '' 的显式判断）。
 *
 * 日志里的「覆盖！」旁白只是观察辅助（借用请求序号判断「这不是最新一个请求」），赋值那一行不做任何判断。
 */
watch([keyword, shouldFail, reloadFlag], ([kw, fail]) => {
  if (kw === '') {
    brokenState.value = { status: 'idle' }
    return
  }
  const seq = ++brokenSeq
  const delayMs = delayFor(kw)
  brokenState.value = { status: 'loading' }
  brokenLines.value.push(`→ #${seq} 发出「${kw}」（预计 ${delayMs}ms）`)

  fetchUsers(kw, { delayMs, failRate: fail ? 1 : 0 })
    .then((users) => {
      // ❌ 不管这个响应属于哪个关键词，回来就写 —— 最后返回的那个请求决定页面
      brokenState.value = { status: 'success', users, forKeyword: kw }
      const stale = seq !== brokenSeq ? `（覆盖！最新请求已是 #${brokenSeq}）` : ''
      brokenLines.value.push(`← #${seq}「${kw}」返回 ${users.length} 条${stale}`)
    })
    .catch((err: unknown) => {
      // 错误同样会乱序落地：勾选「模拟请求失败」时，最后返回的错误也会盖掉前面的
      brokenState.value = { status: 'error', message: toMessage(err) }
      brokenLines.value.push(`← #${seq}「${kw}」失败：${toMessage(err)}`)
    })
  // 没有 onCleanup —— 这就是「坏」的全部原因
})

/**
 * ★ 面板二【修法一】onCleanup(() => { ignore = true })，丢弃过期响应 —— React 官方文档模式的 Vue 版。
 *
 * 每一次回调都有自己的 let ignore = false；onCleanup 注册的函数在「下一次回调执行前」和「watcher 停止时」
 * 把它置成 true。then 回调和 onCleanup 里的函数捕获的是同一个 ignore，下一次回调有它自己的另一个 ——
 * 靠闭包把「轮次」隔离开，和 React 侧的原理一模一样（React 侧那是每轮 effect 的新闭包）。
 *
 * 代价与 React 侧相同：请求并没有被取消，#1「a」在 1100ms 后照样回来（「已过期，丢弃」），
 * 只是没让它污染页面。拿不到 AbortSignal 的场景（第三方 SDK）这是唯一选择，其余情况优先面板三。
 *
 * 回调的第二个参数是旧值，本题用不到，按惯例命名为 _prev（10 题同款）。
 */
watch([keyword, shouldFail, reloadFlag], ([kw, fail], _prev, onCleanup) => {
  if (kw === '') {
    ignoreState.value = { status: 'idle' }
    return
  }
  // 这一次回调专属的过期标记：then 回调与 onCleanup 里的函数共享同一个变量
  let ignore = false
  onCleanup(() => {
    ignore = true
  })
  const seq = ++ignoreSeq
  const delayMs = delayFor(kw)
  ignoreState.value = { status: 'loading' }
  ignoreLines.value.push(`→ #${seq} 发出「${kw}」（预计 ${delayMs}ms）`)

  fetchUsers(kw, { delayMs, failRate: fail ? 1 : 0 })
    .then((users) => {
      if (ignore) {
        // 响应真的回来了（网络没省），只是不再采用
        ignoreLines.value.push(`← #${seq}「${kw}」返回 ${users.length} 条 —— 已过期，丢弃`)
        return
      }
      ignoreState.value = { status: 'success', users, forKeyword: kw }
      ignoreLines.value.push(`← #${seq}「${kw}」返回 ${users.length} 条 —— 采用`)
    })
    .catch((err: unknown) => {
      if (ignore) {
        ignoreLines.value.push(`← #${seq}「${kw}」失败 —— 已过期，丢弃`)
        return
      }
      ignoreState.value = { status: 'error', message: toMessage(err) }
      ignoreLines.value.push(`← #${seq}「${kw}」失败：${toMessage(err)}`)
    })
})

/**
 * ★ 面板三【修法二】onCleanup(() => controller.abort())，真正取消请求。
 *
 * 每一次回调 new 一个 AbortController，把 signal 交给请求；onCleanup 里 abort()。
 * abort() 之后 promise 以 AbortError 拒绝、连接真的断掉 —— 看日志：#1「a」不会再有「返回」那一行，只有「✂ 已取消」。
 *
 * 两条纪律与 React 侧相同：
 * 1）取消不是失败：catch 里必须先 isAbortError(err) → return，否则每敲一个字符都闪一次错误；
 * 2）controller 是「这一次回调的」局部变量，onCleanup 里的函数是闭包，拿到的正是自己这一次的 controller。
 *
 * 日志顺序的小细节：「✂ #1 已取消」写在 catch 里，而 promise 回调是微任务，所以它会出现在
 * 下一次回调打出的「→ #2 发出」之后 —— 顺序反了不是 bug，是 JS 事件循环的时序，两边一样。
 *
 * 卸载时机：watcher 随组件卸载而停止时，onCleanup 注册的函数也会执行，在途请求被取消；
 * 10 题为了把这个时机「亮出来」额外写了 onUnmounted(() => controller?.abort())，本题不再重复。
 * 命令式代码（11 题的 load()）没有 onCleanup 可挂：函数开头 abort 上一个 controller，或比对请求序号。
 * TanStack Query 的 queryFn({ signal }) 把这一整套自动化了（30 题）。
 */
watch([keyword, shouldFail, reloadFlag], ([kw, fail], _prev, onCleanup) => {
  if (kw === '') {
    abortState.value = { status: 'idle' }
    return
  }
  // 每次回调创建属于自己的 controller；onCleanup 里的函数是闭包，恰好能拿到「这一次」的它
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  const seq = ++abortSeq
  const delayMs = delayFor(kw)
  abortState.value = { status: 'loading' }
  abortLines.value.push(`→ #${seq} 发出「${kw}」（预计 ${delayMs}ms）`)

  fetchUsers(kw, { signal: controller.signal, delayMs, failRate: fail ? 1 : 0 })
    .then((users) => {
      // 能走到这里的一定是「没被取消」的请求 —— 被 abort 的 promise 不会 resolve
      abortState.value = { status: 'success', users, forKeyword: kw }
      abortLines.value.push(`← #${seq}「${kw}」返回 ${users.length} 条 —— 采用`)
    })
    .catch((err: unknown) => {
      if (isAbortError(err)) {
        // 「被取消」不是失败：不进 error 状态，只记一笔
        abortLines.value.push(`✂ #${seq}「${kw}」已取消（AbortError，不算失败；响应不会再回来）`)
        return
      }
      abortState.value = { status: 'error', message: toMessage(err) }
      abortLines.value.push(`← #${seq}「${kw}」失败：${toMessage(err)}`)
    })
})

// ============ 自动演示与重置 ============

// 自动演示的定时器 id：setup 作用域的数组（React 侧存 useRef），卸载时必须全部 clearTimeout
const demoTimers: number[] = []

function clearDemoTimers() {
  demoTimers.forEach((id) => window.clearTimeout(id))
  demoTimers.length = 0
}

// 切题时清掉还没触发的演示定时器，否则它们会继续改一个已卸载组件的 keyword
onUnmounted(clearDemoTimers)

/**
 * 清空并重置。React 侧靠换 key 让三个面板销毁重建（state / 日志 / 序号一起归零）；
 * Vue 侧状态就在 setup 里，直接赋回初始值。keyword 归空后三个 watch 会各自把状态置为 idle，
 * 面板二、三的 onCleanup 会让在途请求被丢弃 / 取消（它们那一行「丢弃 / 取消」的日志会落在清空后的时间线里 ——
 * 那是 onCleanup 在工作）；面板一没有 onCleanup，在途的响应会在重置之后照样落地 —— 这又是它「坏」的一个证据。
 * React 侧旧实例在换 key 后已卸载，迟到的 setState 全是 no-op，所以看不到这些残留（没有一一对应关系）。
 */
function reset() {
  clearDemoTimers()
  demoRunning.value = false
  keyword.value = ''
  brokenState.value = { status: 'idle' }
  brokenLines.value = []
  brokenSeq = 0
  ignoreState.value = { status: 'idle' }
  ignoreLines.value = []
  ignoreSeq = 0
  abortState.value = { status: 'idle' }
  abortLines.value = []
  abortSeq = 0
}

/**
 * 一键复现：a → an → ang → angf，每 150ms 一步，用 setTimeout 链逐步改 keyword。
 * 第一个字符也延后 150ms：Vue 这边没有 StrictMode 双跑的顾虑，延后只是为了和 React 侧的节奏一致。
 */
function runDemo() {
  reset()
  demoRunning.value = true
  DEMO_STEPS.forEach((step, index) => {
    const id = window.setTimeout(() => {
      keyword.value = step
      if (index === DEMO_STEPS.length - 1) demoRunning.value = false
    }, (index + 1) * DEMO_STEP_GAP_MS)
    demoTimers.push(id)
  })
}

function retry() {
  reloadFlag.value++
}
</script>

<template>
  <div class="stack">
    <div class="card stack">
      <h3>一个输入框驱动三个面板：同一个关键词、三种处理方式</h3>
      <p class="muted">
        延迟由关键词长度决定：{{ DELAY_TABLE }}。正常速度打出 angf，四个请求一定逆序返回。
        也可以搜「zzz」看空态，勾选「模拟请求失败」看错误分支与重试。
      </p>

      <div class="row">
        <!-- v-model 对应 React 的 value + onChange；输入只改 keyword，「发请求」由三个 watch 响应 keyword 变化 -->
        <input
          v-model="keyword"
          placeholder="试试依次输入 a、an、ang、angf"
          :disabled="demoRunning"
        >
        <button
          class="btn-primary"
          :disabled="demoRunning"
          @click="runDemo"
        >
          {{ demoRunning ? '演示中…' : '自动演示：依次输入 a → an → ang → angf（间隔 150ms）' }}
        </button>
        <button
          class="btn-ghost"
          @click="reset"
        >
          清空并重置
        </button>
      </div>

      <label class="row">
        <!-- shouldFail 是三个 watch 的 source 之一：勾选 / 取消都会让它们用新的 failRate 重新请求 -->
        <input
          v-model="shouldFail"
          type="checkbox"
        >
        <span>
          模拟请求失败（勾选期间所有请求必定失败；点面板里的「重试」会重新请求 —— 时间线多一轮、仍然失败；
          取消勾选会自动重新请求并恢复，不必再点「重试」）
        </span>
      </label>

      <p class="muted">
        观察顺序：先看面板一的红字和 8 人列表，再看面板二的「已过期，丢弃」、面板三的「✂ 已取消」——
        后两者最终都只剩王芳 1 人。切到别的题再回来，一切从 idle 重新开始，没有残留请求会报错。
      </p>
    </div>

    <!-- 三个面板：同一个 keyword，三种策略。@retry / @clear-log 对应 React 侧的 onRetry / onClearLog -->
    <ResultPanel
      title="面板一【坏】响应回来就写，没有 onCleanup"
      hint="看时间线：#4「angf」最先返回后，#3、#2、#1 依次返回并各覆盖一次；最终列表是「a」的 8 人，上方亮红字。"
      :keyword="keyword"
      :state="brokenState"
      :lines="brokenLines"
      @retry="retry"
      @clear-log="brokenLines = []"
    />
    <ResultPanel
      title="面板二【修法一】onCleanup 里 ignore = true，丢弃过期响应"
      hint="四个请求照样都会返回（网络没省），但过期轮次的响应被丢弃；列表始终属于最新关键词，最终只剩王芳 1 人。"
      :keyword="keyword"
      :state="ignoreState"
      :lines="ignoreLines"
      @retry="retry"
      @clear-log="ignoreLines = []"
    />
    <ResultPanel
      title="面板三【修法二】onCleanup 里 controller.abort()，真正取消"
      hint="过期请求在 onCleanup 里被 abort：时间线里只有「✂ 已取消」，永远等不到它们的「返回」；只有 #4 返回并被采用。"
      :keyword="keyword"
      :state="abortState"
      :lines="abortLines"
      @retry="retry"
      @clear-log="abortLines = []"
    />
  </div>
</template>
