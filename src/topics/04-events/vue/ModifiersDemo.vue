<script setup lang="ts">
/**
 * 区块五：修饰符。对照 react/ModifiersDemo.tsx（React 在处理函数里写 JS）。
 * - .once：底层就是 addEventListener 的 { once: true }（parseName，runtime-dom.cjs.js:660-672），触发一次后监听器被浏览器移除；
 * - 按键修饰符 .enter / .esc 比较的是 event.key（withKeys :1853-1867），系统修饰符 .ctrl 与 .exact 看 ctrlKey / shiftKey / altKey / metaKey（modifierGuards :1818-1831）；
 *   按键修饰符不看输入法组字状态，中文输入法按回车确认候选词时要自己判断：照 MDN 写 event.isComposing || event.keyCode === 229
 *   （组字结束那一下 isComposing 可能已经是 false，keyCode 还是 229；keyCode 已弃用，但这个判断里仍建议带上，和 React 侧一致）；
 * - @click.right 会被编译器改写成 contextmenu 事件的监听、@click.middle 改写成 mouseup（@vue/compiler-dom 3.5.42 compiler-dom.cjs.js:362-370），
 *   所以右键菜单这里直接写 @contextmenu.prevent。
 */
import { ref } from 'vue'

const log = ref<string[]>([])
const add = (line: string) => log.value.push(line)
const claimed = ref(false)

function handleEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  add('Enter（.enter.exact）：提交')
}

function handleEsc(e: KeyboardEvent) {
  (e.currentTarget as HTMLInputElement).value = ''
  add('Esc（.esc）：清空输入框')
}

function handleMouseDown(e: MouseEvent) {
  const names: Record<number, string> = { 0: '主键（.left）', 1: '辅助键 / 中键（.middle）', 2: '次键 / 右键（.right）' }
  add(`按下了${names[e.button] ?? `按键 ${e.button}`}`)
}
</script>

<template>
  <div class="card stack">
    <h3>区块五：修饰符 —— 声明式写在模板上</h3>
    <div class="row">
      <button
        :disabled="claimed"
        @click.once="claimed = true; add('领取成功（.once：监听器已被移除）')"
      >
        {{ claimed ? '已领取' : '领取优惠券（.once）' }}
      </button>
    </div>
    <input
      placeholder="试试 Enter、Ctrl + Enter、Esc"
      aria-label="按键实验输入框"
      @keydown.enter.exact="handleEnter"
      @keydown.ctrl.enter.exact="add('Ctrl + Enter（.ctrl.enter.exact）：提交并继续')"
      @keydown.esc="handleEsc"
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
      aria-label="区块五日志"
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
