<script setup lang="ts">
/**
 * 区块三的【少用】部分：.capture（@click.capture、@scroll.capture），以及 Vue 的监听器和原生 addEventListener 混用时的先后顺序。对照 react/CaptureOrderDemo.tsx。
 * Vue 项目里很少写捕获阶段的监听，也很少在同一块 DOM 上混用 v-on 和 addEventListener（工程经验）；这里保留完整的顺序实验，给「Vue 没有委托」这件事作证据。
 * 页面上这一块已注释（PropagationDemo.vue 里取消注释即可运行）；本文件保留，Example.test.ts 直接挂载它，结论照样被测试验证。
 * - v-on 直接挂在元素上（没有委托），所以 Vue 的处理函数和原生 addEventListener 的监听器完全按 DOM 的传播顺序交错执行：
 *   同一个元素、同一阶段上，谁先注册谁先执行（Vue 的监听器在挂载时注册，比 onMounted 里加的原生监听器早）。React 那边是「原生的先跑完，React 的在 root 容器上集中派发」。
 * - .capture = 捕获阶段监听；.stop = stopPropagation()：停的是 DOM 里后面的传播（外层、document），同一个元素上已经注册的其他监听器照常执行（测试覆盖顺序）。
 * - 要在外层观察里面的滚动就用 @scroll.capture（捕获阶段会经过外层，React 对应 onScrollCapture）。
 * - 演示简化：外层 / 中层 div 绑 @click 只用来观察传播；真实项目里可点击的东西用 button（react/Example.tsx 七）。
 */
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const log = ref<string[]>([])
const add = (line: string) => log.value.push(line)
const stopInButton = ref(false)
const outer = useTemplateRef<HTMLDivElement>('outer')
const button = useTemplateRef<HTMLButtonElement>('button')

function handleButton(e: MouseEvent) {
  add('Vue 按钮 @click')
  if (stopInButton.value) e.stopPropagation()
}

const onOuterCapture = () => add('原生 外层 div（捕获）')
const onButton = () => add('原生 按钮（冒泡）')
const onOuter = () => add('原生 外层 div（冒泡）')
const onDocument = (e: Event) => {
  if (e.target instanceof Node && outer.value?.contains(e.target)) add('原生 document（冒泡）')
}

onMounted(() => {
  outer.value?.addEventListener('click', onOuterCapture, true)
  button.value?.addEventListener('click', onButton)
  outer.value?.addEventListener('click', onOuter)
  document.addEventListener('click', onDocument)
})
onBeforeUnmount(() => {
  outer.value?.removeEventListener('click', onOuterCapture, true)
  button.value?.removeEventListener('click', onButton)
  outer.value?.removeEventListener('click', onOuter)
  document.removeEventListener('click', onDocument)
})

const outerScrollCaptures = ref(0)
</script>

<template>
  <div class="stack">
    <h4>【少用】.capture，以及 Vue 监听器和原生监听器谁先执行</h4>
    <label class="row">
      <input
        v-model="stopInButton"
        type="checkbox"
      >
      捕获实验：按钮的处理函数里调用 e.stopPropagation()
    </label>
    <div
      ref="outer"
      class="card stack"
      @click.capture="add('Vue 外层 @click.capture')"
      @click="add('Vue 外层 @click')"
    >
      外层 div
      <div
        class="card stack"
        @click.capture="add('Vue 中层 @click.capture')"
        @click="add('Vue 中层 @click')"
      >
        中层 div
        <button
          ref="button"
          @click="handleButton"
        >
          点我（捕获实验）
        </button>
      </div>
    </div>
    <ul
      class="log"
      aria-label="捕获实验日志"
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
    <div
      class="stack"
      @scroll.capture="outerScrollCaptures++"
    >
      <div
        data-testid="capture-scroll-box"
        style="max-height: 60px; overflow-y: auto; border: 1px dashed currentColor; padding: 4px"
      >
        <div
          v-for="i in 8"
          :key="i"
        >
          滚动我（第 {{ i }} 行）
        </div>
      </div>
      <p
        class="muted"
        data-testid="capture-scroll-count"
      >
        外层的 @scroll.capture：{{ outerScrollCaptures }} 次
      </p>
    </div>
  </div>
</template>
