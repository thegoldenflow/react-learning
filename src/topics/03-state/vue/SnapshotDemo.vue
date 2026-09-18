<script setup lang="ts">
/**
 * 区块二：Vue 没有「渲染快照」。对照 react/SnapshotDemo.tsx。
 * - 改完立刻读就是新值：count.value 每次都从 ref 上现读；
 * - 两个按钮都加 2：没有「更新队列里排的是值还是函数」这回事，也就不需要函数式更新；
 * - 但 DOM 不是立刻变：同一个 tick 里的修改被缓冲，下一个 tick 统一刷新（每个组件只更新一次），要读更新后的 DOM 就 await nextTick()（24 题）；
 * - 赋相同的值：ref 的 setter 用 Object.is（hasChanged）比较，没变就不触发（测试覆盖）。
 */
import { nextTick, ref, useTemplateRef } from 'vue'

const count = ref(0)
const log = ref<string[]>([])
const countEl = useTemplateRef<HTMLElement>('countEl')

async function setThenRead() {
  count.value = count.value + 1
  const domNow = countEl.value?.textContent
  log.value.push(`改完立刻读：count.value = ${count.value}，DOM 上还是 ${domNow}`)
  await nextTick()
  log.value.push(`await nextTick() 之后 DOM 是 ${countEl.value?.textContent}`)
}

// 对照 React 的按钮 A：第二行读到的已经是第一行写进去的新值
function addTwiceByValue() {
  count.value = count.value + 1
  count.value = count.value + 1
}

// 对照 React 的按钮 B：Vue 里和上面是同一回事
function addTwiceByIncrement() {
  count.value++
  count.value++
}
</script>

<template>
  <div class="card stack">
    <h3>区块二：Vue 没有渲染快照，只是 DOM 延后刷新</h3>
    <p>
      count：<strong
        ref="countEl"
        data-testid="snapshot-count"
      >{{ count }}</strong>
    </p>
    <div class="row">
      <button @click="setThenRead">
        改完立刻读
      </button>
      <button @click="addTwiceByValue">
        A：count.value = count.value + 1 ×2（+2）
      </button>
      <button
        class="btn-primary"
        @click="addTwiceByIncrement"
      >
        B：count.value++ ×2（+2）
      </button>
      <button
        class="btn-ghost"
        @click="count = 0"
      >
        归零
      </button>
    </div>
    <ul
      class="log"
      aria-label="区块二日志"
    >
      <li
        v-if="log.length === 0"
        class="log-empty"
      >
        （还没有记录，点上面的按钮）
      </li>
      <li
        v-for="(line, i) in log"
        :key="i"
      >
        {{ line }}
      </li>
    </ul>
  </div>
</template>
