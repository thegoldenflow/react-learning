<script setup lang="ts">
/**
 * 区块三：事件传播。对照 react/PropagationDemo.tsx。
 * - 【最常用】@click 在冒泡阶段执行：按钮 → 中层 → 外层；想挡住外层就在处理函数里 e.stopPropagation()（模板里也可以写 @click.stop）。
 * - document 上的监听器（点击外部关闭这类代码常见）：按钮里 stopPropagation 之后，document 上冒泡阶段的监听器收不到；改用捕获阶段 { capture: true } 就还能收到（测试覆盖）。
 *   这一点 Vue 和 React 17+ 的结果一样：Vue 是直接停了 DOM 传播，React 是在 root 容器上停住。
 * - 原生 scroll、focus 不冒泡，Vue 不做任何模拟：外层的 @scroll、@focus 都收不到里面元素的事件；要监听里面的焦点就用会冒泡的 @focusin（React 的 onFocus 底层就是 focusin）。
 *   要在外层观察里面的滚动得用 @scroll.capture（【少用】，演示在 CaptureOrderDemo.vue）。
 * - 【少用】.capture 与「Vue 监听器和原生监听器交错执行」的实验：拆到 CaptureOrderDemo.vue，页面上已注释（取消注释即可运行），测试照样直接挂载它。
 * - 演示简化：外层 / 中层 div 绑 @click 只用来观察传播；真实项目里可点击的东西用 button（react/Example.tsx 七）。
 */
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
/* 【少用】取消模板里 <CaptureOrderDemo /> 的注释时，这一段也取消注释（删掉这一行和下面的结束行）
import CaptureOrderDemo from './CaptureOrderDemo.vue'
*/

const log = ref<string[]>([])
const add = (line: string) => log.value.push(line)
const stopInButton = ref(false)
const outer = useTemplateRef<HTMLDivElement>('outer')

function handleButton(e: MouseEvent) {
  add('Vue 按钮 @click')
  if (stopInButton.value) e.stopPropagation()
}

// document 上的两个监听器：只记本区块里的点击
const inOuter = (e: Event) => e.target instanceof Node && !!outer.value?.contains(e.target)
const onDocumentCapture = (e: Event) => {
  if (inOuter(e)) add('document 捕获阶段的监听器（{ capture: true }）')
}
const onDocumentBubble = (e: Event) => {
  if (inOuter(e)) add('document 冒泡阶段的监听器')
}

onMounted(() => {
  document.addEventListener('click', onDocumentCapture, { capture: true })
  document.addEventListener('click', onDocumentBubble)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentCapture, { capture: true })
  document.removeEventListener('click', onDocumentBubble)
})

const innerScrolls = ref(0)
const outerScrolls = ref(0)
const outerFocus = ref(0)
const outerFocusin = ref(0)
</script>

<template>
  <div class="card stack">
    <h3>区块三：事件传播 —— 冒泡与 .stop</h3>
    <p class="muted">
      【最常用】@click 在冒泡阶段执行：按钮 → 中层 → 外层；勾上下面的选项，按钮的处理函数里调用 e.stopPropagation()，外层和 document 冒泡阶段的监听器就收不到了。
    </p>
    <label class="row">
      <input
        v-model="stopInButton"
        type="checkbox"
      >
      按钮的处理函数里调用 e.stopPropagation()
    </label>
    <div
      ref="outer"
      class="card stack"
      @click="add('Vue 外层 @click')"
    >
      外层 div
      <div
        class="card stack"
        @click="add('Vue 中层 @click')"
      >
        中层 div
        <button @click="handleButton">
          点我
        </button>
      </div>
    </div>
    <ul
      class="log"
      aria-label="区块三日志"
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
    <div class="row">
      <button
        class="btn-ghost"
        @click="log = []"
      >
        清空日志
      </button>
    </div>
    <div
      class="stack"
      @scroll="outerScrolls++"
      @focus="outerFocus++"
      @focusin="outerFocusin++"
    >
      <h4>原生不冒泡的事件，Vue 不做模拟</h4>
      <div
        data-testid="scroll-box"
        style="max-height: 60px; overflow-y: auto; border: 1px dashed currentColor; padding: 4px"
        @scroll="innerScrolls++"
      >
        <div
          v-for="i in 8"
          :key="i"
        >
          滚动我（第 {{ i }} 行）
        </div>
      </div>
      <input
        placeholder="点进来获得焦点"
        aria-label="焦点实验输入框"
      >
      <p
        class="muted"
        data-testid="bubbling-counts"
      >
        里面的 @scroll：{{ innerScrolls }} 次 · 外层的 @scroll：{{ outerScrolls }} 次 · 外层的 @focus：{{ outerFocus }} 次 · 外层的 @focusin：{{ outerFocusin }} 次
      </p>
    </div>
    <!-- 【少用】取消注释即可运行：删掉这一行和下面的结束行，并取消 script 里 import CaptureOrderDemo 那一段的注释
    <CaptureOrderDemo />
    -->
  </div>
</template>
