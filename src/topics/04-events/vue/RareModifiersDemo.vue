<script setup lang="ts">
/**
 * 区块五的【少用】部分：多个组合键精确区分（.enter.exact 与 .ctrl.enter.exact 各算一种）、鼠标按键（.left / .middle / .right）与右键菜单。对照 react/RareModifiersDemo.tsx。
 * 多见于编辑器、画布、自定义右键菜单这类场景（工程经验）。页面上这一块已注释（ModifiersDemo.vue 里取消注释即可运行）；本文件保留，Example.test.ts 直接挂载它。
 * - 系统修饰符 .ctrl 与 .exact 看 ctrlKey / shiftKey / altKey / metaKey（modifierGuards :1818-1831）；按键修饰符同样不看输入法组字状态，要自己判断。
 * - @click.right 会被编译器改写成 contextmenu 事件的监听、@click.middle 改写成 mouseup（@vue/compiler-dom 3.5.42 compiler-dom.cjs.js:362-370），
 *   所以右键菜单这里直接写 @contextmenu.prevent。
 */
import { ref } from 'vue'

const log = ref<string[]>([])
const add = (line: string) => log.value.push(line)

function handleEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  add('Enter（.enter.exact）：提交')
}

function handleMouseDown(e: MouseEvent) {
  const names: Record<number, string> = { 0: '主键（.left）', 1: '辅助键 / 中键（.middle）', 2: '次键 / 右键（.right）' }
  add(`按下了${names[e.button] ?? `按键 ${e.button}`}`)
}
</script>

<template>
  <div class="stack">
    <h4>【少用】多个组合键精确区分、鼠标按键与右键菜单</h4>
    <input
      placeholder="试试 Enter、Ctrl + Enter、Ctrl + Shift + Enter"
      aria-label="组合键实验输入框"
      @keydown.enter.exact="handleEnter"
      @keydown.ctrl.enter.exact="add('Ctrl + Enter（.ctrl.enter.exact）：提交并继续')"
    >
    <div class="row">
      <button
        @mousedown="handleMouseDown"
        @contextmenu.prevent="add('@contextmenu.prevent：浏览器右键菜单没有弹出')"
      >
        用左键 / 中键 / 右键按我
      </button>
    </div>
    <ul
      class="log"
      aria-label="少用修饰符日志"
    >
      <li
        v-if="log.length === 0"
        class="log-empty"
      >
        （还没有记录）
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
