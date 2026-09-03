<script setup lang="ts">
/**
 * 学习主题：State batching 与函数式更新 —— 更新队列、自动批处理、flushSync 与「什么时候必须函数式更新」
 *
 * React 核心概念：
 * - setter 不会立刻改本次渲染里的 state，只是往这个 state 的【更新队列】里排一条更新；
 *   事件处理器整个执行完之后，React 才在下一次渲染里按顺序处理队列 —— 03 题「连写两次只加 1」的底层机制就是它
 * - 队列里有两种更新：传值 setCount(5) = 「替换成 5」；传函数 setCount(c => c + 1) = updater（更新函数），
 *   「把队列里前一条算出的结果当 c 传进来，用返回值替换掉」。React 侧区块一用一个 applyQueue 模拟器把这条规则跑给你看
 * - 批处理（batching）：同一个事件里的多次 setState 合并成【一次】渲染、一次提交（commit），
 *   中间状态永远不会画到屏幕上。React 18+ 的 createRoot 在 setTimeout / Promise / 原生监听器里也自动批处理
 *   （React 17 只在 React 自己的事件处理器里批，这是面试常问的版本差异）
 * - flushSync（来自 react-dom）：强制 React 立刻同步渲染并提交，把批处理拆开；
 *   只有「setState 之后必须马上读 DOM」才用，代价是多一次渲染
 * - 什么时候必须函数式更新：新值由旧值算出来，且读到的旧值可能已经过期 —— 同一事件里多次更新、
 *   异步回调里更新、更新逻辑要脱离当前渲染复用；updater 必须是纯函数
 *
 * Vue 对应概念：
 * - 赋值即生效：count.value++ 连写两次真的加 2，改完下一行就能读到新值（区块一四个按钮全部「所见即所得」）；
 *   Vue 没有「更新队列」也没有「函数式更新」——没有一一对应关系
 * - Vue 批的是【DOM 刷新】不是数据：同一个 tick 里改再多 ref，调度器也只在微任务里刷新一次 DOM（区块二）；
 *   无论在事件处理器里还是 setTimeout 里都是如此，没有「17 vs 18」的版本故事
 * - nextTick：等这次 DOM 刷新完成再读；与 flushSync 方向相反（一个「等它刷完」，一个「逼它现在刷」）
 * - Vue 里唯一会「过期」的东西，是你手动把 .value 拷进普通变量的那份快照（区块三；26 题详讲）
 *
 * 最重要的区别：
 * - React 批的是「state 更新」（数据层）：处理器执行期间 state 是冻结的快照，所有改动排队等下一次渲染，
 *   所以才需要 updater 去拿「排队之后的最新值」；
 *   Vue 批的是「DOM 更新」（视图层）：数据立刻改、立刻可读，只有 DOM 是延迟到微任务里刷新的。
 *   两边都在「批」，批的东西不同 —— 这是本题最容易被类比带偏的地方
 * - 由此：React 里「setState 后立刻读 DOM 还是旧的」要用 flushSync 逼一次同步渲染；
 *   Vue 里「改 ref 后立刻读 DOM 还是旧的」要 await nextTick() 等一次刷新。同一个现象，工具方向相反
 * - 与相邻题的区别：03 题只做最小的 +1 / +2 复现；23 题讲「一次渲染 = 一次函数执行」与快照本身；
 *   本题讲快照之上「多个更新怎么排队、怎么合并、怎么拆开、何时必须用 updater」；26 题继续讲异步回调里的过期闭包
 */
import { nextTick, onUnmounted, ref, watch } from 'vue'

// ============ 公共：三个区块各自的页面日志 + 会自动清理的 setTimeout ============
// React 侧每个区块是一个独立组件、各有一份 useState 日志；Vue 这边单个 SFC，直接开三个 ref 数组。
// 日志放在 setup 作用域（组件实例级）而不是模块级变量里：切题重进、StrictMode 双挂载都不会串台。
const queueLog = ref<string[]>([])
const flushLog = ref<string[]>([])
const timerLog = ref<string[]>([])

// React 侧要把定时器 id 放进 useRef（普通变量活不过一次渲染，12 题）；Vue 的 setup 只执行一次，
// 一个普通 Set 天然跨渲染存活。卸载时统一 clearTimeout —— 纪律与 React 的 effect cleanup 完全一致。
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

/**
 * ★ 区块一：没有更新队列 —— 赋值即生效
 *
 * React 侧四个按钮排出四种队列：A [替换成 N+1, 替换成 N+1] 只 +1、B [updater, updater] +2、
 * C [替换成 N+5, updater] +6、D 最后一条「替换成 42」把前面全丢掉 = 42，还配了一个 applyQueue 模拟器。
 * Vue 这边四个按钮的结果是 +2、+2、+6、=42 —— 数字上除了 A 都一样，但原因完全不同：
 * Vue 没有队列，每一行赋值当场生效，下一行读 count.value 读到的就是上一行写进去的新值。
 * 所以「传值还是传函数」这道选择题在 Vue 里根本不存在，函数式更新也没有对应物 —— 没有一一对应关系。
 *
 * 日志里每行都写了「赋值完立刻读到的 count.value」：它就是新值 —— 这一点在 React 侧永远做不到
 *（React 处理器里读 count 永远是本次渲染的快照，新值要到下一次渲染才看得见）。
 */
const count = ref(0)

function report(button: string, before: number) {
  // 关键：这一行是在赋值语句【之后、同一个同步函数里】读的，读到的已经是新值 —— 赋值即生效
  queueLog.value.push(
    `点 ${button}｜改之前 count = ${before}｜赋值完立刻读 count.value = ${count.value}（没有队列，赋值即生效）`,
  )
}

// 对照 React 的 A（React 只 +1）：第二行读 count.value 时，第一行已经写进去了 → +2
function addTwiceByValue() {
  const before = count.value
  count.value = count.value + 1
  count.value = count.value + 1
  report('A', before)
}

// 对照 React 的 B（React +2）：Vue 里没有 updater 这种东西，count.value++ 本身就是「由旧算新」
function addTwiceByIncrement() {
  const before = count.value
  count.value++
  count.value++
  report('B', before)
}

// 对照 React 的 C（React +6）：Vue 也 +6，但 React 是队列 [替换成 N+5, c => c + 1] 依次处理，Vue 是两次普通赋值
function addFiveThenOne() {
  const before = count.value
  count.value = count.value + 5
  count.value++
  report('C', before)
}

// 对照 React 的 D（= 42）：Vue 也 = 42，最后一行赋值覆盖前面的结果 —— 这一步倒是和「替换」语义一样
function addFiveThenOneThenSet42() {
  const before = count.value
  count.value = count.value + 5
  count.value++
  count.value = 42
  report('D', before)
}

function resetCount() {
  count.value = 0
}

/**
 * ★ 区块二：Vue 批的是 DOM 刷新 —— 数据立刻改，DOM 在微任务里只刷一次
 *
 * React 侧用一个依赖 [count, flag] 的 useEffect 当探针数「提交次数」，
 * 并用 flushSync 把一次事件里的两个更新拆成两次提交。
 * Vue 侧的对应物是「DOM 刷新次数」：用 flush: 'post' 的 watch 数 —— 它在 batchCount / flag 引起的
 * 那次 DOM 更新之后才跑，同一个 tick 里两个 ref 都改了也只跑一次（调度器把更新任务去重排进微任务队列）。
 * 无论是同一事件里改、还是 setTimeout 里改，Vue 都只刷一次 —— 没有 React 17 / 18 那种「事件里批、异步里不批」的历史包袱。
 *
 * 想把它「拆开」，Vue 没有 flushSync 那种「逼它现在刷」的 API（没有一一对应关系），
 * 只能顺着调度器走：改一个 ref、await nextTick() 等它刷完、再改另一个 —— 刷新次数就是 2。
 *
 * 坑：别在 onUpdated 里改 flushes 来数更新次数 —— flushes 本身被模板渲染，改它又触发更新、onUpdated 再跑，死循环。
 * watch 的 source 只写 [batchCount, flag]，回调里改别的 ref 不会再触发自己。
 */
const batchCount = ref(0)
const flag = ref(false)
const flushes = ref(0)
// 模板 ref（12 题）：用来在处理器里「立刻读 DOM 文本」，验证 DOM 到底刷了没有
const countEl = ref<HTMLElement | null>(null)

watch(
  [batchCount, flag],
  ([c, f]) => {
    flushes.value++
    flushLog.value.push(`↳ DOM 刷新落地（batchCount = ${c}, flag = ${String(f)}）`)
  },
  { flush: 'post' },
)

/** 同一事件里改两个 ref：数据当场都变了，DOM 只在本轮微任务里刷一次 → 刷新次数 +1 */
function updateBothInEvent() {
  flushLog.value.push('点「同一事件改两个 ref」→ 期待只刷新 1 次')
  batchCount.value++
  flag.value = !flag.value
}

/** setTimeout 里改两个 ref：Vue 一直都是这样批，没有版本差异 → 仍 +1 */
function updateBothInTimeout() {
  flushLog.value.push('点「setTimeout 里改两个 ref」→ 200ms 后改，期待仍只刷新 1 次')
  later(() => {
    batchCount.value++
    flag.value = !flag.value
  }, 200)
}

/** 对照 React 的 flushSync：Vue 只能「等一次刷新」再改下一个，于是刷新 2 次 —— 方向相反的工具 */
async function updateBothSplitByNextTick() {
  flushLog.value.push('点「用 await nextTick() 拆开」→ 期待刷新 2 次')
  batchCount.value++
  await nextTick() // 等第一次 DOM 刷新完成（React 这里是 flushSync 逼它现在刷）
  flag.value = !flag.value
}

/** 改完立刻读 DOM：数据已经是新值，但 DOM 要等微任务 → 读到旧文本（React 里 setCount 后也是旧文本，原因不同） */
function readDomAfterAssign() {
  batchCount.value++
  flushLog.value.push(
    `batchCount.value++ 之后立刻读：数据 batchCount.value = ${batchCount.value}（已是新值），DOM 文本「${countEl.value?.textContent ?? '?'}」（还是旧值）`,
  )
}

/** await nextTick() 之后读 DOM：刷新已完成，读到新文本（React 里对应 flushSync 之后读） */
async function readDomAfterNextTick() {
  batchCount.value++
  await nextTick()
  flushLog.value.push(`await nextTick() 之后读 DOM：「${countEl.value?.textContent ?? '?'}」—— 已是新值`)
}

/**
 * ★ 区块三：React 的「必须函数式更新」清单，在 Vue 里对应什么
 *
 * React 侧列了四种必须用 updater 的场景（同一事件多次更新 / 异步回调里由旧算新 / 更新逻辑脱离当前渲染复用 /
 * 自定义 Hook 对外暴露的 increment），并演示第二种：1.5 秒内连点 3 次「setCount(count + 1)」只 +1。
 *
 * Vue 里这四种场景全都不需要任何特殊写法 —— setTimeout 回调里的 delayCount.value 永远现读现取，连点 3 次就 +3。
 * 「函数式更新」这个概念在 Vue 里没有一一对应关系。
 *
 * 但 Vue 老手也要知道自己的边界在哪：一旦你把 .value 拷进普通变量（const snapshot = delayCount.value），
 * 再在异步回调里用这份拷贝算新值，就人为制造了 React 那种快照 —— 这才是 Vue 里唯一会「过期」的东西。
 * 第二个按钮故意这么写，让你看到同一个坑的 Vue 版本；26 题会系统地讲。
 * 对应的纪律很简单：在需要的那一刻再读 .value，别提前拷贝。
 */
const DELAY_MS = 1500
const delayCount = ref(0)
const pendingTimers = ref(0)

/** ✅ 对照 React 的「坏」按钮：Vue 里这样写天然正确，回调执行时才读 .value */
function scheduleIncrement() {
  timerLog.value.push(`${DELAY_MS}ms 后执行 delayCount.value++（回调触发时才读 .value）`)
  pendingTimers.value++
  later(() => {
    pendingTimers.value--
    delayCount.value++
    timerLog.value.push(`  定时器触发：delayCount.value++ → ${delayCount.value}`)
  }, DELAY_MS)
}

/** ❌ 人为模拟 React 的快照：点击时拷一份普通变量，1.5 秒后用它算 —— 连点 3 次只 +1 */
function scheduleIncrementFromSnapshot() {
  const snapshot = delayCount.value
  timerLog.value.push(`${DELAY_MS}ms 后执行 delayCount.value = snapshot + 1，此刻 snapshot = ${snapshot}`)
  pendingTimers.value++
  later(() => {
    pendingTimers.value--
    delayCount.value = snapshot + 1
    timerLog.value.push(`  定时器触发：snapshot(${snapshot}) + 1 → ${delayCount.value}（用的是点击时的拷贝）`)
  }, DELAY_MS)
}

function resetDelayCount() {
  delayCount.value = 0
}
</script>

<template>
  <div class="stack">
    <!-- 区块一：React 侧是「更新队列 + 模拟器」，Vue 侧没有队列，四个按钮都是赋值即生效 -->
    <div class="card stack">
      <h3>区块一：没有更新队列 —— 赋值即生效</h3>
      <p class="muted">
        依次点 A / B / C / D：React 侧 A 只 +1，这里 A 和 B 一样 +2；日志里「赋值完立刻读」到的就是新值，
        React 处理器里永远读不到。
      </p>
      <p>
        当前 count：<strong>{{ count }}</strong>
      </p>
      <div class="row">
        <button @click="addTwiceByValue">
          A：count.value = count.value + 1 ×2 → +2
        </button>
        <button
          class="btn-primary"
          @click="addTwiceByIncrement"
        >
          B：count.value++ ×2 → +2
        </button>
        <button @click="addFiveThenOne">
          C：+5 再 ++ → +6
        </button>
        <button @click="addFiveThenOneThenSet42">
          D：C 之后再 count.value = 42 → 等于 42
        </button>
        <button
          class="btn-ghost"
          @click="resetCount"
        >
          归零
        </button>
      </div>
      <!-- 只追加的日志用 index 作 key 是 06 题规则的例外：条目从不重排或删除 -->
      <ul class="log">
        <li
          v-if="queueLog.length === 0"
          class="log-empty"
        >
          （还没有记录，点上面的按钮）
        </li>
        <li
          v-for="(line, index) in queueLog"
          :key="index"
        >
          {{ line }}
        </li>
      </ul>
      <div class="row">
        <button
          class="btn-ghost"
          @click="queueLog = []"
        >
          清空日志
        </button>
      </div>
    </div>

    <!-- 区块二：React 侧数「提交次数」+ flushSync 拆开；Vue 侧数「DOM 刷新次数」+ nextTick 等刷新 -->
    <div class="card stack">
      <h3>区块二：Vue 批的是 DOM 刷新 —— 改完立刻可读，DOM 只刷一次</h3>
      <p class="muted">
        先记住「DOM 刷新次数」，再点前三个按钮，看它 +1 还是 +2（页面打开时是 0：watch 默认懒执行，
        不像 React 侧的探针 effect 会被 StrictMode 跑两遍）。
        后两个按钮对照「改 ref 后立刻读 DOM」是旧是新。
      </p>
      <p class="row">
        <span>batchCount：</span>
        <strong ref="countEl">{{ batchCount }}</strong>
        <span class="badge">flag = {{ String(flag) }}</span>
        <span class="badge">batchCount / flag 的 DOM 刷新次数：{{ flushes }}</span>
      </p>
      <div class="row">
        <button @click="updateBothInEvent">
          同一事件改两个 ref（+1 次）
        </button>
        <button @click="updateBothInTimeout">
          setTimeout 里改两个 ref（仍 +1 次）
        </button>
        <button
          class="btn-primary"
          @click="updateBothSplitByNextTick"
        >
          用 await nextTick() 拆开（+2 次）
        </button>
      </div>
      <div class="row">
        <button @click="readDomAfterAssign">
          改完立刻读 DOM（数据新、DOM 旧）
        </button>
        <button @click="readDomAfterNextTick">
          await nextTick() 后读 DOM（新文本）
        </button>
      </div>
      <ul class="log">
        <li
          v-if="flushLog.length === 0"
          class="log-empty"
        >
          （还没有记录，点上面的按钮）
        </li>
        <li
          v-for="(line, index) in flushLog"
          :key="index"
        >
          {{ line }}
        </li>
      </ul>
      <div class="row">
        <button
          class="btn-ghost"
          @click="flushLog = []"
        >
          清空日志
        </button>
      </div>
    </div>

    <!-- 区块三：React 侧「坏 vs updater」；Vue 侧「天然正确 vs 人为拷贝快照」 -->
    <div class="card stack">
      <h3>区块三：Vue 不需要函数式更新 —— 唯一会过期的是你自己拷的快照</h3>
      <p class="muted">
        1.5 秒内连点 3 次第一个按钮，定时器全部触发后 +3（React 侧同样写法只 +1）；
        再连点 3 次第二个按钮，只 +1 —— 因为它人为拷贝了一份快照。
      </p>
      <p class="row">
        <span>delayCount：</span>
        <strong>{{ delayCount }}</strong>
        <span class="badge">在途定时器：{{ pendingTimers }} 个</span>
      </p>
      <div class="row">
        <button
          class="btn-primary"
          @click="scheduleIncrement"
        >
          1.5 秒后 delayCount.value++（连点 3 次 +3）
        </button>
        <button @click="scheduleIncrementFromSnapshot">
          1.5 秒后 delayCount.value = snapshot + 1（连点 3 次只 +1）
        </button>
        <button
          class="btn-ghost"
          @click="resetDelayCount"
        >
          归零
        </button>
      </div>
      <ul class="log">
        <li
          v-if="timerLog.length === 0"
          class="log-empty"
        >
          （还没有记录，点上面的按钮）
        </li>
        <li
          v-for="(line, index) in timerLog"
          :key="index"
        >
          {{ line }}
        </li>
      </ul>
      <div class="row">
        <button
          class="btn-ghost"
          @click="timerLog = []"
        >
          清空日志
        </button>
      </div>
    </div>
  </div>
</template>
