<script setup lang="ts">
/**
 * 学习主题：渲染模型与 state 快照 ——「一次渲染 = 一次函数执行」与 UI = f(props, state)
 *
 * React 核心概念：
 * - 组件就是函数：每次渲染 React 都【重新调用】它，函数体从头到尾跑一遍，返回这一帧的 JSX（区块一）
 * - state 和 props 都属于当前 render 的 snapshot：useState 解构出的 count、函数参数里的 props，
 *   在这一次函数执行期间是不会变的常量（区块二、区块四）
 * - 事件处理器是在某一次渲染里创建的闭包，捕获的是那一次渲染的快照值，不是「最新值」（区块二）
 * - 调用 setter 不会改当前函数里的局部变量：setCount(count + 1) 之后再读 count，还是旧值（区块二）
 * - setter 做的事是「排队一次新渲染」：state 更新后 React 再次执行组件函数，新 UI 来自新一次函数执行
 * - 直接改变量（localCopy += 1，或直接改 state 里的对象）什么都不会发生：没有 setter 就没有新渲染（区块三）
 * - UI = f(props, state)：渲染必须是纯函数，同样的 props 与 state 必得同样的 UI（区块四）
 *
 * Vue 对应概念：
 * - setup 只执行一次（本文件顶部的 console.log 只打印一次）；重跑的只有模板编译出来的渲染函数，
 *   而且由响应式系统精确触发 —— onUpdated 每次组件更新后触发，用它观察「渲染函数重跑了」
 * - ref / reactive 是长期存活的 Proxy 容器，count.value 每次都是现读现取 —— 没有「快照」这回事：
 *   count.value++ 之后立刻就能读到新值（区块二）
 * - 改一个不在 Proxy 里的普通变量（let localCopy）同样不更新视图，但原因不同：
 *   不是「没有 setter」，而是「脱离了依赖追踪」；它也不会像 React 那样每帧被重置（区块三）
 * - 子组件的 props 是响应式 Proxy，异步回调里读 props.count 永远是最新值；只有手动拷贝出来的普通值才会「过期」（区块四）
 * - 「渲染快照」「setter 不改局部变量」「函数式更新」这些在 Vue 里都没有一一对应关系
 *
 * 最重要的区别：
 * - Vue 依靠响应式系统追踪依赖：渲染时读到谁就依赖谁，改 Proxy 里的数据 → 精确通知依赖它的地方重跑；
 *   React 不追踪任何东西：调用 setter → 重新执行整个组件函数 → 用返回的新 JSX 与旧的 diff，得到新 UI。
 * - 所以千万不要把 React 解释成「直接修改变量后自动刷新」—— 那是 Vue 改【响应式数据】时的模型，不是 React 的
 *   （Vue 改普通变量同样不会刷新，见区块三）。
 *   React 里 UI 变化的唯一入口是「调用 setter → 新一轮函数执行」。
 * - state snapshot 思维 vs 响应式变量思维：Vue 的 count 是一个会自己变新的「容器」；
 *   React 的 count 是本次渲染的「定格照片」。带着 Vue 的直觉写 React，会在 03 / 24 / 26 题的坑里反复摔倒。
 * - 与邻题的分工：03 题区块一是「连写两次 setCount 只加 1」的最小复现；本题从不连写两次 setCount，
 *   讲的是那个现象背后的四条机制 + UI = f(props, state)。更新队列与批处理见 24 题，过期闭包的各种修法见 26 题。
 */
import { computed, onUnmounted, onUpdated, ref } from 'vue'

/**
 * ★ 区块一：Vue 侧没有「组件函数重跑」。
 *
 * <script setup> 的代码就是 setup 函数体，整个组件生命周期只执行【一次】，所以下面这条日志只打印一次。
 * 之后 count 变化时重跑的是模板编译出的渲染函数（由响应式系统触发），setup 里的变量、函数都原地不动。
 * React 侧对应的位置是 Example 函数体顶部的 console.log —— 那一条每次渲染都打印。
 *
 * 壳应用提示：本项目用 React 的 StrictMode 把 Vue 应用「挂载→卸载→重挂载」了一次（VueMount 桥），
 * 所以控制台可能看到两次「setup 执行」—— 那是两个 Vue 应用实例各跑一次，不是 setup 重跑。
 */
console.log('[23-Vue] setup 执行（整个组件生命周期只有这一次）')

const count = ref(0)
const threshold = ref(5)

// 页面日志：放在 ref 里而不是模块级变量，切题 / 重挂载都不会串。
// React 侧必须 setLogs(prev => [...prev, message]) 造新数组；Vue 直接 push，Proxy 会拦截到。
const logs = ref<string[]>([])

function log(message: string) {
  logs.value.push(message)
}

/**
 * onUpdated：组件因响应式数据变化【重新渲染并更新 DOM 之后】触发。
 * 它是观察「渲染函数重跑」最接近 React 那条 console.log 的位置 —— 但注意语义差异：
 * React 那条日志打印在渲染【期间】（函数体里），这条打印在更新【之后】（生命周期钩子里）。
 * 只做 console.log、绝不在这里改被渲染的 ref（改了会再触发更新 → 死循环）。
 */
onUpdated(() => {
  console.log('[23-Vue] 组件更新（渲染函数重跑），count =', count.value)
})

/**
 * ★ 区块二：Vue 没有渲染快照。
 *
 * count.value++ 之后紧接着读 count.value，读到的就是新值 —— 这一行代码在 React 里是
 * setCount(count + 1) 后读 count 仍是旧值。差异的根源：
 * React 的 count 是本次函数执行里的常量快照；Vue 的 count 是长期存活的 Proxy 容器，.value 现读现取。
 * 视图更新是「另一件事」：Vue 会在本轮同步代码跑完后异步刷新 DOM（nextTick，24 题详讲），
 * 但数据本身立刻就变了。
 *
 * 面试对照：Vue 里问「ref 改了之后 DOM 什么时候更新」（答：下一个微任务批量刷新）；
 * React 里问「setState 之后 state 什么时候变」（答：下一次渲染，本次闭包里永远不变）—— 两个问题问的不是同一层。
 */
function handleAdd() {
  count.value++
  log(`调用 count.value++ 之后，count.value 已经是 ${count.value}（React 侧这里还是旧值）`)
}

function setTo(value: number) {
  count.value = value
}

/**
 * ★ 区块三：直接改普通变量，视图不更新 —— 但原因和 React 不同。
 *
 * let localCopy = count.value 只在 setup 里执行一次，拷出来的是一个普通 number，不在任何 Proxy 里。
 * localCopy += 1 之后视图不动，是因为响应式系统【追踪不到】它，没人通知渲染函数重跑（onUpdated 也不会打印）。
 * React 侧 localCopy 不更新是因为「没有 setter 就没有新渲染」—— 现象一样，机制两回事，没有一一对应关系。
 *
 * 这个按钮故意【只写控制台、不写页面日志】：logs 是响应式的，push 一条就会触发本组件重渲染，
 * 而模板重跑时读到的是 localCopy 的【当前值】（Vue 没有快照），新值会被顺带画出来 ——
 * 你会误以为「改普通变量也更新了视图」。只有让这次点击不碰任何响应式数据，才能看到视图纹丝不动。
 *
 * 更细的差别：React 的 localCopy 每次渲染都被重新初始化（let 写在函数体里、函数每帧重跑）；
 * Vue 的 localCopy 是 setup 作用域里的长期变量，不会被重置 —— 你加的那些 1 一直攒着，
 * 下次组件因【任何】响应式变化重渲染时（比如点「+1」），模板会顺带把攒下的新值画出来（模板读到的是变量当前值）。
 * 点几次「localCopy += 1」再点「+1」就能看到：Vue 侧显示攒下的值，React 侧被重置回 count。
 */
let localCopy = count.value

function mutateLocalCopy() {
  localCopy += 1
  // 只写控制台：往响应式的 logs 里 push 会触发重渲染，模板会顺带画出新值，实验就被污染了（见上方注释）
  console.log(`[23-Vue] localCopy += 1 → localCopy 现在是 ${localCopy}，视图不更新：它是普通数字，不在 Proxy 里，响应式系统追踪不到`)
}

/**
 * ★ 区块四：UI = f(props, state) 在 Vue 里怎么理解。
 *
 * React 侧有一个纯子组件 Summary({ count, threshold })，父组件每次重渲染它都被重新调用、拿到新的 props 快照；
 * 「1 秒后记录本次渲染收到的 props」证明 props 也是快照。
 * Vue 侧这里用 computed 表达同一个「f」：reached 只依赖 count 与 threshold，输入不变结果就不变（还带缓存）。
 * Vue 子组件的 props 是响应式 Proxy —— 子组件在 setTimeout 里读 props.count 读到的是父组件当下的最新值，
 * 所以「记录本次渲染收到的 props」这个实验在 Vue 里做不出「旧值」：没有一一对应关系。
 * 能做出「旧值」的只有一种情况：你自己在点击那一刻把 count.value 拷成一个普通变量（下面的 snapshot）——
 * 那是手动制造的快照，不是框架给你的。
 */
const reached = computed(() => count.value >= threshold.value)

// 定时器 id 存在 setup 作用域变量里，onUnmounted 时清掉（React 侧存在 useRef 里、useEffect 的 cleanup 里清）
let timerId: number | undefined

function recordLater() {
  // 手动拷贝：这才是 Vue 里唯一会「过期」的东西
  const snapshot = count.value
  if (timerId !== undefined) clearTimeout(timerId)
  timerId = window.setTimeout(() => {
    timerId = undefined
    log(`1 秒后：现读 count.value=${count.value}（永远最新）；点击时手动拷贝的 snapshot=${snapshot}（这才会过期）`)
  }, 1000)
}

// 切题（React 壳卸载 Vue 应用）时定时器必须清掉，否则回调会往已销毁组件的 ref 里写
onUnmounted(() => {
  if (timerId !== undefined) clearTimeout(timerId)
})

function toggleThreshold() {
  threshold.value = threshold.value === 5 ? 3 : 5
}
</script>

<template>
  <div class="stack">
    <!-- ---------------- 区块一 ---------------- -->
    <div class="card stack">
      <h3>区块一：setup 只执行一次，重跑的是渲染函数</h3>
      <p class="muted">
        打开控制台：「setup 执行」只在挂载时打印（壳应用的 StrictMode 会挂载两个 Vue 实例，所以可能有两条）；
        之后每次点按钮只会多一条「组件更新」（区块三那个只改普通变量的按钮除外：它什么都不触发）——
        那是 onUpdated，由响应式系统在 DOM 更新后触发。
        React 侧每次点击多的是「Example 函数执行」：整个组件函数重跑了。
      </p>
      <p>
        当前 count：<strong>{{ count }}</strong>
      </p>
      <div class="row">
        <button
          class="btn-primary"
          @click="handleAdd"
        >
          +1
        </button>
        <button @click="setTo(5)">
          设为 5
        </button>
        <button
          class="btn-ghost"
          @click="setTo(0)"
        >
          归零
        </button>
      </div>
      <p class="muted">
        连点两次「设为 5」：第二次赋同样的值，Proxy 发现值没变，不会触发任何更新（onUpdated 不打印）——
        和 React 的 Object.is 跳过是同一个结论：同样的数据没有理由产生不同的 UI。
      </p>
    </div>

    <!-- ---------------- 运行日志 ---------------- -->
    <div class="card stack">
      <div class="row">
        <h3>运行日志（各区块的按钮都写到这里）</h3>
        <button
          class="btn-ghost"
          @click="logs = []"
        >
          清空日志
        </button>
      </div>
      <!-- 只追加、从不重排的列表用 index 当 key 可以接受（06 题规则的例外） -->
      <ul class="log">
        <li
          v-if="logs.length === 0"
          class="log-empty"
        >
          （还没有日志 —— 点上面或下面的按钮）
        </li>
        <li
          v-for="(line, index) in logs"
          :key="index"
        >
          {{ line }}
        </li>
      </ul>
    </div>

    <!-- ---------------- 区块二 ---------------- -->
    <div class="card stack">
      <h3>区块二：count.value++ 之后立刻就是新值 —— Vue 没有渲染快照</h3>
      <p class="muted">
        点「+1 并记录」：日志里写的 count.value 和下面显示的数字【一样】。
        React 侧同一个按钮的日志会比页面少 1 —— 那边的事件处理器读的是本次渲染的快照。
      </p>
      <p>
        模板里读到的 count：<strong>{{ count }}</strong>
      </p>
      <div class="row">
        <button
          class="btn-primary"
          @click="handleAdd"
        >
          +1 并记录 count.value++ 之后的值
        </button>
      </div>
    </div>

    <!-- ---------------- 区块三 ---------------- -->
    <div class="card stack">
      <h3>区块三：改普通变量同样不更新视图 —— 但原因是「脱离了 Proxy」</h3>
      <p class="muted">
        打开控制台，连点几次「localCopy += 1」：控制台里的 localCopy 在涨，页面不动、也没有「组件更新」
        （响应式系统追踪不到普通变量，什么都没被触发）。
        再点区块一的「+1」：组件因 count 重渲染，模板顺带把攒下的 localCopy 画出来 ——
        React 侧此时反而被重置回 count，因为那边的 let 写在每帧重跑的函数体里。
        这个按钮故意不写页面日志：往响应式的 logs 里 push 也会触发重渲染，同样会把新值画出来。
      </p>
      <p>
        页面上的 localCopy：<strong>{{ localCopy }}</strong>
        <span class="muted">（setup 里拷出来的普通数字：let localCopy = count.value，只拷了这一次）</span>
      </p>
      <div class="row">
        <button @click="mutateLocalCopy">
          localCopy += 1（Vue 里也不会更新视图）
        </button>
      </div>
    </div>

    <!-- ---------------- 区块四 ---------------- -->
    <div class="card stack">
      <h3>区块四：UI = f(props, state) —— Vue 用 computed 表达 f，props 永远最新</h3>
      <p class="muted">
        「已达阈值」由 computed 从 count 与 threshold 算出：输入不变结果就不变。
        点「1 秒后记录」后立刻再点几次 +1：1 秒后现读的 count.value 是最新值（React 侧记的是旧 props），
        只有点击时手动拷贝的 snapshot 才停在旧值。
      </p>
      <div class="row">
        <button @click="setTo(5)">
          设为 5
        </button>
        <button @click="setTo(0)">
          设为 0
        </button>
        <button
          class="btn-ghost"
          @click="toggleThreshold"
        >
          切换阈值（3 ↔ 5）
        </button>
        <button
          class="btn-ghost"
          @click="handleAdd"
        >
          +1
        </button>
      </div>
      <p class="row">
        <span>
          f 的输入：count=<strong>{{ count }}</strong>，threshold=<strong>{{ threshold }}</strong>
        </span>
        <span :class="reached ? 'badge badge-paid' : 'badge badge-pending'">
          {{ reached ? '已达阈值' : '未达阈值' }}
        </span>
      </p>
      <div class="row">
        <button @click="recordLater">
          1 秒后记录 count（现读 .value vs 点击时的手动拷贝）
        </button>
        <span class="muted">点完立刻回上面再点几次 +1，看 1 秒后两个值哪个变了</span>
      </div>
    </div>
  </div>
</template>
