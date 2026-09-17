<script setup lang="ts">
/**
 * 学习主题：过期闭包（stale closure）—— 延迟回调、手动事件监听、轮询读到旧 state 的现场、观察与修法
 *
 * React 核心概念：
 * - 每次渲染都是一次新的函数执行：本帧的 count 是常量，本帧创建的每一个闭包（onClick、setTimeout 的回调、
 *   addEventListener 的 handler、effect 里的 setInterval 回调、fetch 的 .then）捕获的都是本帧的值
 * - 闭包活得比创建它的那一帧长，就会「过期」：setTimeout 2 秒后读到的仍是点击那一帧的 count（区块一）；
 *   依赖 [] 的 effect 只在挂载后跑一次，它注册的监听器 / 定时器永远读挂载那一帧的值（区块二、三）
 * - 依赖数组为什么影响闭包：依赖变化 → 先跑上一轮的 cleanup → 再跑新一轮 setup，用【新一帧的闭包】重新注册。
 *   [] = 永远用挂载那一帧的闭包；[count] = count 每变一次就换一个新闭包（代价：监听器 / 定时器销毁重建）
 * - 函数式更新 setCount(c => c + 1) 只解决「由旧值算新值」这一类问题；回调若要读最新值去做别的事
 *   （保存、上报、当请求参数），函数式更新帮不上忙，要用 latest ref（useRef 每帧同步最新值）
 * - useEffectEvent（React 19.2 内置）：把「要读最新值、但不想让它触发 effect 重跑」的逻辑包起来，
 *   effect 的依赖数组可以诚实地写 []（React 侧区块三）
 * - cleanup 为什么重要：每一轮 effect 注册的监听器 / 定时器都是一个独立闭包，不在 cleanup 里注销，
 *   换新闭包时旧的还活着 —— 监听器堆积、过期定时器往回写、迟到的响应写进已卸载的组件
 *
 * Vue 对应概念：
 * - setup 只执行一次，ref 是长期存活的容器：任何回调里的 count.value / status.value 都是现读现取，永远新鲜 ——
 *   本文件三个区块里的 setTimeout / addEventListener / setInterval 回调全部直接读 .value，没有一个会过期
 * - Vue 里唯一会「过期」的东西是你手动拷出来的普通值：const snapshot = count.value。
 *   每个区块都放了一个这样的「手动快照」对照按钮 —— 它就是 React 坏例子在 Vue 里的等价物，只是 React 是框架替你拷的、Vue 得你自己拷
 * - onMounted 里注册一次监听器、回调里读 count.value，永远正确；仍要在卸载时移除（区块二）—— 清理纪律两边完全一致
 * - 依赖数组 / 函数式更新 / latest ref / useEffectEvent 在 Vue 里都没有一一对应关系：它们修的是 React 渲染模型独有的坑。
 *   硬要类比：Vue 的 ref 本身就是「latest ref」，但那是响应式容器的天性，不是一个技巧
 *
 * 最重要的区别：
 * - React 函数组件每次渲染都会产生新的变量和闭包；Vue 的 setup 只跑一次、ref 是长期存活的容器。
 *   所以 React 里「这个闭包是哪一帧创建的」决定它读到什么；Vue 里回调什么时候执行、就读到什么时候的值
 * - 由此：React 的每个异步回调都要问一句「它执行时，我想读的是创建那一帧的值，还是最新值？」并挑一种修法；
 *   Vue 没有这道选择题：现读 .value 就是最新值，想要旧值反而得手动拷贝
 * - 与邻题的分工：10 题只讲「setInterval 里 setState 读旧值」这一个案例的三种修法；本题讲更普遍的现场
 *   （根本没有 effect 的延迟回调、手动 DOM 监听、轮询读旧参数）+ 通过日志观察 + cleanup 的后果 + 官方的 useEffectEvent。
 *   快照本身见 03 / 23 题，更新队列见 24 题，异步竞态与取消见 27 题
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { fetchOrders } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type OrderStatus } from '@/shared/types'

// ============ 公共：会在卸载时自动清理的 setTimeout ============
// React 侧要把定时器 id 放进 useRef（普通变量活不过一次渲染，12 题）；Vue 的 setup 只执行一次，
// 一个普通 Set 天然跨越所有更新一直存活。卸载时统一 clearTimeout —— 纪律与 React 的 effect cleanup 完全一致。
const timerIds = new Set<ReturnType<typeof setTimeout>>()

function later(callback: () => void, ms: number) {
  const id = setTimeout(() => {
    timerIds.delete(id)
    callback()
  }, ms)
  timerIds.add(id)
}

onUnmounted(() => {
  timerIds.forEach((id) => clearTimeout(id))
  timerIds.clear()
})

/* ============================================================================
 * ★ 区块一：事件处理器里的 setTimeout —— Vue 里现读 .value 永远新鲜
 * ========================================================================== */

/** 与 React 版同名同值 */
const SAVE_DELAY_MS = 2000

/**
 * React 侧这里有四个按钮：「保存」读闭包里的 count 会过期、读 latestCount.current 才对；
 * 「+1」写 setCount(count + 1) 会把数字倒退、写 setCount(c => c + 1) 才对。
 *
 * Vue 侧同样四个按钮，但「坏」的那两个在 Vue 里【写不出来】—— 除非你手动把 count.value 拷进一个普通变量。
 * 所以 Vue 的对照组是「现读 count.value」（永远新鲜）vs「点击时拷的 snapshot」（这才会过期）：
 * - setTimeout(() => save(count.value))：回调 2 秒后执行，那一刻通过 ref 的 .value 现读，就是最新值 —— 这是 Vue 的默认行为；
 * - const snapshot = count.value; setTimeout(() => save(snapshot))：你亲手把值定格在点击那一刻 —— 这才是 React 坏例子的等价物。
 *
 * 理解这一点就理解了整题：React 的坏例子不是「写错了」，而是 React 的闭包天然就是这份 snapshot ——
 * 每次渲染都产生新的变量和闭包，回调捕获的 count 只能是创建它那一帧的常量。
 * Vue 的 ref 是长期存活的容器，回调捕获的是容器本身，读的时候才取值。
 * 因此 latest ref / 函数式更新这些修法在 Vue 里没有一一对应关系：Vue 没有这个坑要修。
 */
const count = ref(0)
const saveLog = ref<string[]>([])

// React 侧要 setLines(prev => [...prev, line]) 造新数组（并且必须函数式更新，否则过期的 log 会丢行）；
// Vue 直接 push，Proxy 会拦截到（ref 装的数组在内部被 reactive() 转成了 Proxy）—— 而且 saveLog 本身也是长期存活的容器，回调里 push 永远不会「过期」。
function pushSave(line: string) {
  saveLog.value.push(line)
}

/** ✅ Vue 的默认写法：回调里现读 count.value，2 秒后拿到的就是那一刻的最新值 */
function saveFresh() {
  pushSave(`已安排：${SAVE_DELAY_MS / 1000} 秒后保存（现读 count.value）。此刻 count=${count.value}，现在快去点几次 +1`)
  later(() => {
    pushSave(`【现读】保存了 count.value=${count.value} —— 回调执行那一刻从容器里现取，和页面一致`)
  }, SAVE_DELAY_MS)
}

/** ⚠ 手动快照：这才是 Vue 里唯一能做出「旧值」的方法 —— 对照 React 的坏例子 */
function saveSnapshot() {
  const snapshot = count.value
  pushSave(`已安排：${SAVE_DELAY_MS / 1000} 秒后保存（手动拷的 snapshot=${snapshot}）。现在快去点几次 +1`)
  later(() => {
    pushSave(`【手动快照】保存了 snapshot=${snapshot}，而此刻 count.value=${count.value} —— 普通变量不会自己变新`)
  }, SAVE_DELAY_MS)
}

/** ✅ 2 秒后 count.value++：读写都在容器上，中间加的全保住 —— React 侧要写 setCount(c => c + 1) 才有同样效果 */
function addFresh() {
  pushSave(`已安排：${SAVE_DELAY_MS / 1000} 秒后 count.value++。现在快去点几次 +1，数字不会倒退`)
  later(() => {
    count.value++
    pushSave(`【现读】执行了 count.value++ → ${count.value}，中间加的都保住了`)
  }, SAVE_DELAY_MS)
}

/** ⚠ 手动快照 + 1：等价于 React 侧的 setCount(count + 1)，中间加的全被盖回去，数字倒退 */
function addSnapshot() {
  const snapshot = count.value
  pushSave(`已安排：${SAVE_DELAY_MS / 1000} 秒后 count.value = snapshot + 1（snapshot=${snapshot}）。现在快去点几次 +1，看数字倒退`)
  later(() => {
    count.value = snapshot + 1
    pushSave(`【手动快照】执行了 count.value = ${snapshot} + 1：页面被打回 ${count.value} —— 这就是 React 侧 setCount(count + 1) 的效果`)
  }, SAVE_DELAY_MS)
}

/* ============================================================================
 * ★ 区块二：手动 addEventListener —— onMounted 注册一次，读 .value 永远正确
 * ========================================================================== */

/**
 * React 侧有两个组件：依赖 [] 的坏版本（监听器永远读挂载那一帧的 count=0）和依赖 [count] 的好版本
 * （count 每变一次就注销 / 重挂一次监听器）。
 *
 * Vue 侧只需要一个监听器：onMounted 里 addEventListener 一次，handler 读 enterCount.value 现取 ——
 * 它注册时 enterCount 是 0，之后涨到 10，handler 一行代码没改、也没重新注册，读到的就是 10。
 * 「依赖数组决定监听器里的闭包是哪一帧的」这个问题在 Vue 里不存在：闭包只有一份，它捕获的是容器。
 * 为了照出 React 坏例子的模样，handler 里同时打印 onMounted 那一刻手动拷的 mountedCount —— 它才会停在 0。
 *
 * 清理纪律一致：onUnmounted 里 removeEventListener。React 靠 effect 返回的 cleanup，Vue 靠 onUnmounted，形式不同、责任相同。
 * 细节：模板 ref 在组件卸载过程中会被置回 null，所以要移除的元素在 onMounted 时先存进 setup 作用域变量，
 * 不能在 onUnmounted 里再去读 enterInput.value（React 侧同理：effect 里先 const el = inputRef.current 再交给 cleanup）。
 */
const enterCount = ref(0)
const listenerLog = ref<string[]>([])

// 模板 ref（12 题）：拿到真实的 <input> 元素去 addEventListener
const enterInput = ref<HTMLInputElement | null>(null)
// onMounted 时把元素存下来，供 onUnmounted 移除监听器用（那时模板 ref 已经是 null）
let listenedElement: HTMLInputElement | null = null
// 手动快照：onMounted 那一刻的值，只拷这一次 —— 用来对照 React 坏例子里「永远是 0」的 count
let mountedCount = 0

function handleManualEnter(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  listenerLog.value.push(
    `监听器读到 enterCount.value=${enterCount.value}（现读，永远正确）；onMounted 时拷的 mountedCount=${mountedCount}（手动快照，才会像 React 坏例子那样停在 0）`,
  )
}

onMounted(() => {
  mountedCount = enterCount.value
  listenedElement = enterInput.value
  // 只注册这一次。React 的坏版本也只注册一次，差别在于那边 handler 捕获的是常量、这边捕获的是容器
  listenedElement?.addEventListener('keydown', handleManualEnter)
})

onUnmounted(() => {
  // 与 React 侧 cleanup 里的 removeEventListener 完全等价的那一步
  listenedElement?.removeEventListener('keydown', handleManualEnter)
})

/** 对照：模板里的 @keydown.enter —— 和 React 的 JSX onKeyDown 一样不需要操心，读到的也是现值 */
function handleTemplateEnter() {
  listenerLog.value.push(`@keydown.enter 读到 enterCount.value=${enterCount.value}（模板事件，同样现读）`)
}

/* ============================================================================
 * ★ 区块三：轮询读筛选参数 —— 回调里读 status.value 永远是最新的
 * ========================================================================== */

type StatusFilter = OrderStatus | 'all'

/** 与 React 版相同的选项与文案 */
const STATUS_OPTIONS: StatusFilter[] = ['all', 'pending', 'paid', 'cancelled']
const STATUS_LABEL: Record<StatusFilter, string> = { all: '全部', ...ORDER_STATUS_TEXT }

/** 与 React 版同名同值 */
const POLL_MS = 2000
const POLL_DELAY_MS = 300

/**
 * React 侧三种写法并排：依赖 []（坏：status 停在挂载那一帧）、依赖 [status]（status 一变就销毁重建定时器）、
 * useEffectEvent（定时器只建一次、status 永远最新）。
 *
 * Vue 侧只有一种自然写法：setInterval 的回调每次执行时现读 status.value。定时器只建一次，参数永远新鲜 ——
 * 这正是 React 侧 useEffectEvent 费一番功夫才达到的效果，Vue 的 ref 天生如此。
 * 依赖数组 / useEffectEvent 在 Vue 里没有一一对应关系：setInterval 又不是 watch，没人会因为 status 变了而重跑它；
 * 如果你【想要】「status 一变就立刻按新条件查一次」（React 修法一顺带得到的行为），
 * 那是另一个需求 —— 用 watch(status, (s, _prev, onCleanup) => { … onCleanup(stop) }) 主动重启，而不是被迫重启。
 *
 * 为了照出 React 坏例子的模样，这里提供一个「启动时拷一份 status」的模式：const frozenStatus = status.value 只在
 * 开始轮询那一刻拷一次，之后一直用它发请求 —— 这就是 React 依赖 [] 版本的等价物（那边是框架替你拷的）。
 *
 * alive 标志 + clearInterval 与 React 侧完全一致：停止 / 卸载之后，已经发出去的请求即使返回也不再写日志。
 * 只丢弃响应、不真的取消请求（AbortController 是 27 题的主角）。
 */
const status = ref<StatusFilter>('all')
type PollMode = 'fresh' | 'frozen'
const pollMode = ref<PollMode>('fresh')
const polling = ref(false)
const pollLog = ref<string[]>([])

// 「停止当前这一轮轮询」的函数：每次 startPolling 都创建一个新闭包（各自持有自己的 alive 与定时器 id），
// 和 React 侧「每一轮 effect 的 cleanup 各管各的」是同一个结构 —— 差别只是 Vue 里要自己保管它。
let stopCurrentPolling: (() => void) | undefined

function startPolling() {
  if (stopCurrentPolling !== undefined) return
  let alive = true
  let tickNo = 0
  // 只在开始那一刻拷一次：frozen 模式下之后每次轮询都用它 —— 对照 React 依赖 [] 的坏例子
  const frozenStatus = status.value
  pollLog.value.push(`—— 开始轮询（status=${status.value}）——`)

  const tick = () => {
    tickNo += 1
    const seq = tickNo
    // 每次执行都现读 pollMode.value / status.value：回调捕获的是容器，不是值
    const frozen = pollMode.value === 'frozen'
    const requested = frozen ? frozenStatus : status.value
    fetchOrders({ status: requested, pageSize: 20 }, { delayMs: POLL_DELAY_MS }).then((page) => {
      if (!alive) return
      pollLog.value.push(
        `${frozen ? '【手动快照】' : '【现读】'}第 ${seq} 次轮询：status=${requested} → ${page.total} 条${
          frozen && requested !== status.value ? `（下拉框已经是 ${status.value}，这就是 React 坏例子的样子）` : ''
        }`,
      )
    })
  }

  tick()
  const id = setInterval(tick, POLL_MS)
  polling.value = true
  stopCurrentPolling = () => {
    alive = false
    clearInterval(id)
    stopCurrentPolling = undefined
    polling.value = false
  }
}

function stopPolling() {
  stopCurrentPolling?.()
  pollLog.value.push('—— 停止轮询：定时器已清，之后不会再有新日志 ——')
}

function changeStatus() {
  pollLog.value.push(`—— 下拉框切到 status=${status.value}，「现读」模式下一次轮询立刻用它 ——`)
}

// 切题（React 壳卸载 Vue 应用）时定时器必须清掉，alive 置 false 让迟到的响应作废 —— 与 React 侧 cleanup 等价
onUnmounted(() => {
  stopCurrentPolling?.()
})
</script>

<template>
  <div class="stack">
    <!-- ---------------- 区块一 ---------------- -->
    <div class="card stack">
      <h3>区块一：事件处理器里的 setTimeout —— 现读 .value 永远新鲜，手动快照才会过期</h3>
      <p class="muted">
        点任意一个「2 秒后…」按钮，然后在 2 秒内连点几次 +1，再看日志：
        「现读」的两个和页面一致（这是 Vue 的默认行为）；「手动快照」的两个停在点击那一刻（+1 那个还会把数字倒退回去）——
        那才是 React 侧「坏」按钮的样子。
      </p>
      <p>
        当前 count：<strong>{{ count }}</strong>
      </p>
      <div class="row">
        <button
          class="btn-primary"
          @click="count++"
        >
          +1
        </button>
        <button
          class="btn-ghost"
          @click="count = 0"
        >
          归零
        </button>
      </div>
      <div class="row">
        <button @click="saveFresh">
          2 秒后保存（现读 count.value）
        </button>
        <button @click="saveSnapshot">
          2 秒后保存（手动快照 snapshot，对照 React 坏例子）
        </button>
      </div>
      <div class="row">
        <button @click="addFresh">
          2 秒后 +1（count.value++）
        </button>
        <button @click="addSnapshot">
          2 秒后 +1（snapshot + 1，对照 React 的 setCount(count + 1)）
        </button>
      </div>
      <!-- 只追加、从不重排的列表用 index 当 key 可以接受（06 题规则的例外） -->
      <ul class="log">
        <li
          v-if="saveLog.length === 0"
          class="log-empty"
        >
          （还没有记录，点上面的按钮）
        </li>
        <li
          v-for="(line, index) in saveLog"
          :key="index"
        >
          {{ line }}
        </li>
      </ul>
      <div class="row">
        <button
          class="btn-ghost"
          @click="saveLog = []"
        >
          清空日志
        </button>
      </div>
    </div>

    <!-- ---------------- 区块二 ---------------- -->
    <div class="card stack">
      <h3>区块二：手动 addEventListener —— onMounted 注册一次，读 .value 永远正确</h3>
      <p class="muted">
        先点几次 +1，再分别在两个输入框里按 Enter：手动注册的监听器只注册过一次，读到的却是当前值；
        同一行里 onMounted 时手动拷的 mountedCount 停在 0 —— 那就是 React 侧依赖 [] 坏例子的样子。
        React 那边要靠依赖数组 [count] 反复注销 / 重挂监听器才能读到新值，Vue 这边一次都不用重挂。
      </p>
      <p>
        当前 count：<strong>{{ enterCount }}</strong>
      </p>
      <div class="row">
        <button
          class="btn-primary"
          @click="enterCount++"
        >
          +1
        </button>
        <button
          class="btn-ghost"
          @click="enterCount = 0"
        >
          归零
        </button>
      </div>
      <div class="row">
        <!-- ref="enterInput" 对应 React 的 ref={inputRef}；监听器在 onMounted 里注册、onUnmounted 里移除 -->
        <input
          ref="enterInput"
          placeholder="在这里按 Enter（onMounted 里手动 addEventListener）"
        >
        <span class="muted">只注册了一次，读到的仍是当前值</span>
      </div>
      <div class="row">
        <!-- 模板事件：对应 React 的 JSX onKeyDown，两边都不需要操心闭包 -->
        <input
          placeholder="在这里按 Enter（对照：@keydown.enter）"
          @keydown.enter="handleTemplateEnter"
        >
        <span class="muted">模板事件同样现读</span>
      </div>
      <ul class="log">
        <li
          v-if="listenerLog.length === 0"
          class="log-empty"
        >
          （还没有记录，在上面的输入框里按 Enter）
        </li>
        <li
          v-for="(line, index) in listenerLog"
          :key="index"
        >
          {{ line }}
        </li>
      </ul>
      <div class="row">
        <button
          class="btn-ghost"
          @click="listenerLog = []"
        >
          清空日志
        </button>
      </div>
    </div>

    <!-- ---------------- 区块三 ---------------- -->
    <div class="card stack">
      <h3>区块三：轮询读筛选参数 —— 回调里读 status.value 永远是最新的</h3>
      <p class="muted">
        点「开始轮询」，等一两条日志后把状态切到「已支付」：「现读」模式下一次轮询立刻用新状态、计数连续（定时器只建了一次，
        对应 React 的 useEffectEvent 版）；切到「启动时拷一份」模式，接下来的轮询一直用开始那一刻的 status ——
        那就是 React 依赖 [] 坏例子的样子。停止轮询 / 切题之后不再有新日志（alive 标志 + clearInterval）。
        默认数据里 all=15、pending=6、paid=6、cancelled=3 条（在 19 / 22 / 30 题改过订单的话数字会不同）。
      </p>
      <div class="row">
        <label class="row">
          <span>筛选状态：</span>
          <!-- v-model 直接拿到绑定值；React 版还要 e.target.value as StatusFilter 断言收窄 -->
          <select
            v-model="status"
            @change="changeStatus"
          >
            <option
              v-for="s in STATUS_OPTIONS"
              :key="s"
              :value="s"
            >
              {{ STATUS_LABEL[s] }}
            </option>
          </select>
        </label>
        <button
          v-if="polling"
          class="btn-danger"
          @click="stopPolling"
        >
          停止轮询
        </button>
        <button
          v-else
          class="btn-primary"
          @click="startPolling"
        >
          开始轮询
        </button>
      </div>
      <div class="row">
        <label class="row">
          <span>写法：</span>
          <!-- React 侧是三种写法（[] / [status] / useEffectEvent）；Vue 只有「现读」一种自然写法，
               「启动时拷一份」是为了照出 React 坏例子而手动制造的快照 -->
          <select v-model="pollMode">
            <option value="fresh">
              现读 status.value（Vue 唯一的自然写法，定时器只建一次、参数永远最新）
            </option>
            <option value="frozen">
              启动时拷一份 const frozenStatus = status.value（手动快照，对照 React 依赖 [] 的坏例子）
            </option>
          </select>
        </label>
      </div>
      <p
        v-if="polling"
        class="muted"
      >
        轮询中。下拉框里的 status={{ status }}；「现读」模式回调每次现取它，「启动时拷一份」模式一直用开始那一刻的值 —— 看日志。
      </p>
      <p
        v-else
        class="muted"
      >
        未在轮询 —— 没有任何定时器在跑。
      </p>
      <ul class="log">
        <li
          v-if="pollLog.length === 0"
          class="log-empty"
        >
          （还没有记录，点「开始轮询」）
        </li>
        <li
          v-for="(line, index) in pollLog"
          :key="index"
        >
          {{ line }}
        </li>
      </ul>
      <div class="row">
        <button
          class="btn-ghost"
          @click="pollLog = []"
        >
          清空日志
        </button>
      </div>
    </div>
  </div>
</template>
