<script setup lang="ts">
/**
 * 区块三：输入事件实验（React 对照：react/InputEventLab.tsx）。
 *
 * 实验一：v-model 什么时候更新。
 * - 文本框的 v-model 监听 input 事件（.lazy 改成 change），和 React 的 onChange 一样每输入一个字符更新一次；
 * - 输入法合成期间不更新：「v-model doesn't get updated during IME composition」。
 *   vue 3.5.42 的 vModelText 在 compositionstart 时给元素打上 composing 标记，input 监听器看到标记就直接返回，
 *   compositionend 时清掉标记并补派发一次 input（runtime-dom.cjs.js:1505-1513、:1533-1545）。
 *   React 的 onChange 合成期间照样触发。要在 Vue 里逐字响应，官方建议自己写 :value + @input。
 *
 * 实验二：输入过滤。v-model 只在组件重新渲染时把 JS 值写回 DOM（vModelText.beforeUpdate，:1559-1576）。
 * 被拒绝的输入不会引起重新渲染，非法字符就留在输入框里 —— 这是 v-model 和 React 受控输入最实际的差别。
 */
import { computed, ref } from 'vue'

/* ---------- 实验一 ---------- */
const modelText = ref('')
const lines = ref<string[]>([])

function log(line: string) {
  lines.value = [...lines.value.slice(-11), line]
}

// v-model 的 input 监听器先注册：mountElement 先调指令的 created 钩子，再给 props 上的事件加监听
// （runtime-core.cjs.js:5737-5743），所以这里读到的 modelText 已经是 v-model 处理过的结果
function onRawInput(e: Event) {
  log(`input：输入框里是「${(e.target as HTMLInputElement).value}」，v-model 的值是「${modelText.value}」`)
}

/* ---------- 实验二 ---------- */
const digits = ref('')
// 反例：v-model 绑一个会拒绝写入的 computed —— 拒绝时 digits 不变，组件不重新渲染，DOM 里的字母留着
const digitsModel = computed({
  get: () => digits.value,
  set: (value: string) => {
    if (/^\d*$/.test(value)) digits.value = value
  },
})

const digits2 = ref('')
// 正确：:value + @input，拒绝时手动把 DOM 改回去
function onDigitsInput(e: Event) {
  const el = e.target as HTMLInputElement
  if (/^\d*$/.test(el.value)) digits2.value = el.value
  else el.value = digits2.value
}
</script>

<template>
  <div class="card stack">
    <h3>区块三：v-model 什么时候更新（换成中文输入法试试）</h3>

    <p class="muted">
      实验一：先用英文输入几个字母、再点空白处失焦；然后切到拼音输入法打「你好」，看拼写过程中 v-model 的值有没有变。
    </p>
    <label class="row">
      实验输入框
      <input
        v-model="modelText"
        @input="onRawInput"
        @compositionstart="log('compositionstart：开始拼写')"
        @compositionend="log(`compositionend：选定「${($event as CompositionEvent).data}」`)"
        @change="log(`原生 change：${($event.target as HTMLInputElement).value}`)"
      >
    </label>
    <p class="muted">
      v-model 的值：{{ modelText === '' ? '（空）' : modelText }}
    </p>
    <div class="row">
      <strong>事件日志</strong>
      <button
        type="button"
        class="btn-ghost"
        @click="lines = []"
      >
        清空
      </button>
    </div>
    <ul
      class="log"
      aria-label="输入事件日志"
    >
      <li
        v-if="lines.length === 0"
        class="log-empty"
      >
        （空）
      </li>
      <li
        v-for="(line, i) in lines"
        :key="i"
      >
        {{ line }}
      </li>
    </ul>

    <p class="muted">
      实验二：两个输入框都只想收数字，敲个字母试试。要过滤输入时只能用 :value + @input（v-model 做不到把字母弹回）。
    </p>
    <label class="row">
      反例：v-model + 会拒绝的 computed
      <input
        v-model="digitsModel"
        inputmode="numeric"
      >
    </label>
    <p class="muted">
      state：{{ digits === '' ? '（空）' : digits }} —— 字母没写进 state，但留在了输入框里
    </p>
    <label class="row">
      正确：:value + @input 手动改回
      <input
        :value="digits2"
        inputmode="numeric"
        @input="onDigitsInput"
      >
    </label>
    <p class="muted">
      state：{{ digits2 === '' ? '（空）' : digits2 }} —— 字母被弹回，和 React 的受控输入表现一致
    </p>
  </div>
</template>
