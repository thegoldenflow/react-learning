<script setup lang="ts">
/**
 * 区块一 Vue 对照：事件处理函数里的 setTimeout。对照 react/DelayedSaveDemo.tsx。
 *
 * React 侧四个按钮里「坏」的两个，在 Vue 里照原样写不出来：setup 只执行一次，count 是一直存活的 ref，
 * 回调捕获的是 ref 本身，2 秒后通过 .value 现读，就是那一刻的值（官方 Why Refs：.value 让 Vue 能在读写时介入）。
 * 所以 Vue 的对照组是「现读 count.value」vs「点击时手动拷一份 snapshot」—— 后者才是 React 坏例子的等价物：
 * React 是每次渲染都产生一份新的常量，回调自然拿到那一份；Vue 得你亲手拷。
 *
 * 但「Vue 没有过期问题」说过头了。Vue 里把响应式数据变成普通值的写法都会「过期」（下面的「手动快照」按钮、「解构 reactive」一排和子组件的实验，测试覆盖）：
 * - const snapshot = count.value：手动拷贝；
 * - const { likes } = state（state 是 reactive）：官方 Limitations of reactive()「we will lose the reactivity connection」；
 * - 3.4 及以前解构 props（3.5 起编译器改写成 props.x，见子组件 PropsDestructureChild.vue）。
 * 修法：保留 ref / reactive 本身，或者 toRefs(state) 把每个属性变成连着源对象的 ref。
 */
import { onBeforeUnmount, reactive, ref, toRefs } from 'vue'
import LogList from './LogList.vue'
import PropsDestructureChild from './PropsDestructureChild.vue'

/** 与 React 版同名同值 */
const SAVE_DELAY_MS = 2000

const count = ref(0)
const log = ref<string[]>([])
const push = (line: string) => {
  log.value.push(line)
}

// ---- 会在卸载时清理的 setTimeout ----
// React 侧要把定时器 id 放进 useRef（普通变量活不过一次渲染，12 题）；Vue 的 setup 只执行一次，一个普通 Set 就一直存活。
const timerIds = new Set<ReturnType<typeof setTimeout>>()
function later(callback: () => void, ms: number) {
  const id = setTimeout(() => {
    timerIds.delete(id)
    callback()
  }, ms)
  timerIds.add(id)
}
onBeforeUnmount(() => {
  timerIds.forEach((id) => clearTimeout(id))
  timerIds.clear()
})

/** ✅ Vue 的默认写法：回调里现读 count.value */
function saveFresh() {
  push(`已安排：2 秒后保存（现读 count.value）。此刻 count=${count.value}，现在快去点几次 +1`)
  later(() => push(`【现读】保存了 count.value=${count.value} —— 回调执行那一刻从 ref 里取，和页面一致`), SAVE_DELAY_MS)
}

/** ⚠ 手动快照：对照 React 的坏例子 */
function saveSnapshot() {
  const snapshot = count.value
  push(`已安排：2 秒后保存（手动拷的 snapshot=${snapshot}）。现在快去点几次 +1`)
  later(() => push(`【手动快照】保存了 snapshot=${snapshot}，而此刻 count.value=${count.value} —— 普通变量不会自己变`), SAVE_DELAY_MS)
}

/** ✅ 2 秒后 count.value++：读写都在 ref 上，中间加的全保住 —— React 侧要写 setCount(c => c + 1) 才有同样效果 */
function addFresh() {
  push('已安排：2 秒后 count.value++。现在快去点几次 +1，数字不会倒退')
  later(() => {
    count.value++
    push(`【现读】执行了 count.value++ → ${count.value}`)
  }, SAVE_DELAY_MS)
}

/** ⚠ 手动快照 + 1：等价于 React 侧的 setCount(count + 1)，数字倒退 */
function addSnapshot() {
  const snapshot = count.value
  push(`已安排：2 秒后 count.value = snapshot + 1（snapshot=${snapshot}）。现在快去点几次 +1`)
  later(() => {
    count.value = snapshot + 1
    push(`【手动快照】执行了 count.value = ${snapshot} + 1：页面被打回 ${count.value}`)
  }, SAVE_DELAY_MS)
}

// ---- Vue 也会「过期」：解构 reactive ----
const state = reactive({ likes: 0 })
// 在 setup 里解构一次：likes 是一个普通 number，和 state 从此没有关系（官方 Limitations of reactive() 第三条）
const { likes } = state
// toRefs：每个属性变成一个连着源对象的 ref（读写都转发到 state.likes）
const { likes: likesRef } = toRefs(state)

function readLikes() {
  push(`state.likes=${state.likes}（现读）｜解构出来的 likes=${likes}（setup 时拷走的值）｜toRefs 的 likesRef.value=${likesRef.value}（现读）`)
}
</script>

<template>
  <div class="card stack">
    <h3>区块一：事件处理函数里的 setTimeout —— 现读 .value 读到最新值，手动拷出来的值才会过期</h3>
    <p class="muted">
      点任意一个「2 秒后…」按钮，然后在 2 秒内连点几次 +1：「现读」的两个和页面一致（Vue 的默认行为）；「手动快照」的两个停在点击那一刻（+1
      那个还会把数字倒退）—— 那才是 React 侧「坏」按钮的样子。
    </p>
    <p>
      当前 count：<strong aria-label="区块一 count">{{ count }}</strong>
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
        2 秒后保存（手动快照 snapshot）
      </button>
    </div>
    <div class="row">
      <button @click="addFresh">
        2 秒后 +1（count.value++）
      </button>
      <button @click="addSnapshot">
        2 秒后 +1（snapshot + 1）
      </button>
    </div>
    <PropsDestructureChild
      :count="count"
      @log="push"
    />
    <div class="row">
      <span>解构 reactive：state.likes = <strong aria-label="区块一 likes">{{ state.likes }}</strong></span>
      <button @click="state.likes++">
        点赞 +1
      </button>
      <button @click="readLikes">
        读三种写法
      </button>
    </div>
    <LogList
      :lines="log"
      label="区块一日志"
      @clear="log = []"
    />
  </div>
</template>
