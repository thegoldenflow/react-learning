<script setup lang="ts">
/**
 * 区块二 Vue 对照：手动 addEventListener。对照 react/ListenerDemo.tsx。
 *
 * React 侧五个输入框在讲「依赖数组决定交出去的是哪次渲染的闭包」。Vue 这边只需要一个监听器：
 * onMounted 里 addEventListener 一次，handler 读 count.value 现取 —— 注册时 count 是 0，之后涨到 10，handler 没换过、也没重新注册，读到的就是 10。
 * 这就是 React ③ useEffectEvent 版想要的效果（只注册一次、读最新值），在 Vue 里是默认行为：setup 只执行一次，闭包只有一份，它捕获的是 ref。
 * 为了照出 React 坏例子的样子，handler 同时打印 onMounted 那一刻手动拷的 mountedCount —— 它才会停在 0。
 *
 * 清理：onBeforeUnmount 里 removeEventListener。这时组件实例还完整（官方「the component instance is still fully functional」），
 * 模板 ref 还指着元素；到了 onUnmounted，模板 ref 已经被置回 null（20 题实测），所以在 onUnmounted 里移除就得先把元素另存一份。
 * React 靠 Effect 返回的 cleanup，Vue 靠卸载钩子 —— 形式不同、责任相同。
 */
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import LogList from './LogList.vue'

const count = ref(0)
const log = ref<string[]>([])
const registerCount = ref(0)

// useTemplateRef【主流·3.5 起】拿到 <input> 元素（12 题）
const inputEl = useTemplateRef<HTMLInputElement>('enterInput')
// 手动快照：onMounted 那一刻的值，只拷这一次 —— 对照 React 坏例子里停在 0 的 count
let mountedCount = 0

function handleManualEnter(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  log.value.push(`【手动监听】读到 count.value=${count.value}（现读）；onMounted 时拷的 mountedCount=${mountedCount}（手动快照）`)
}

onMounted(() => {
  mountedCount = count.value
  inputEl.value?.addEventListener('keydown', handleManualEnter)
  registerCount.value += 1
})

onBeforeUnmount(() => {
  inputEl.value?.removeEventListener('keydown', handleManualEnter)
})

/** 对照：模板里的 @keydown.enter —— 和 React 的 JSX onKeyDown 一样，读到的是现值 */
function handleTemplateEnter() {
  log.value.push(`【模板事件】@keydown.enter 读到 count.value=${count.value}`)
}
</script>

<template>
  <div class="card stack">
    <h3>区块二：手动 addEventListener —— onMounted 注册一次，读 .value 就是最新值</h3>
    <p class="muted">
      先点几次 +1，再在两个输入框里按 Enter：手动注册的监听器只注册过一次（注册次数 {{ registerCount }}），读到的却是当前值；同一行里
      onMounted 时拷的 mountedCount 停在 0 —— 那是 React 侧依赖 [] 坏例子的样子。React 要么靠依赖数组反复重注册，要么用 useEffectEvent。
    </p>
    <p>
      当前 count：<strong aria-label="区块二 count">{{ count }}</strong>
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
      <input
        ref="enterInput"
        placeholder="按 Enter（onMounted 里手动 addEventListener）"
      >
      <span class="muted">只注册了一次，读到的是当前值</span>
    </div>
    <div class="row">
      <!-- 模板事件：对应 React 的 JSX onKeyDown -->
      <input
        placeholder="按 Enter（对照：@keydown.enter）"
        @keydown.enter="handleTemplateEnter"
      >
      <span class="muted">模板事件同样现读</span>
    </div>
    <LogList
      :lines="log"
      label="区块二日志"
      empty-hint="（还没有记录，在上面的输入框里按 Enter）"
      @clear="log = []"
    />
  </div>
</template>
