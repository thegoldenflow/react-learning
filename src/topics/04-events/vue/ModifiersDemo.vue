<script setup lang="ts">
/**
 * 区块五：修饰符。对照 react/ModifiersDemo.tsx（React 在处理函数里写 JS）。
 * - 【最常用】按键修饰符 .enter / 【常用】.esc：比较的是 event.key（withKeys :1853-1867）。回车提交这里写 .enter.exact【常用】：按着 Shift / Ctrl / Alt / Meta 的回车都不算
 *   （多行输入里 Shift + Enter 用来换行；React 版只排除了 Shift，这里更严）。
 *   按键修饰符不看输入法组字状态，中文输入法按回车确认候选词时要自己判断：照 MDN 写 event.isComposing || event.keyCode === 229
 *   （组字结束那一下 isComposing 可能已经是 false，keyCode 还是 229；keyCode 已弃用，但这个判断里仍建议带上，和 React 侧一致）；
 * - 【常用】.once：底层就是 addEventListener 的 { once: true }（parseName，runtime-dom.cjs.js:660-672），触发一次后监听器被浏览器移除。
 * - 【少用】多个组合键精确区分（.ctrl.enter.exact）、鼠标按键与右键菜单：拆到 RareModifiersDemo.vue，页面上已注释（取消注释即可运行），测试照样直接挂载它。
 */
import { ref } from 'vue'
/* 【少用】取消模板里 <RareModifiersDemo /> 的注释时，这一段也取消注释（删掉这一行和下面的结束行）
import RareModifiersDemo from './RareModifiersDemo.vue'
*/

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
</script>

<template>
  <div class="card stack">
    <h3>区块五：修饰符 —— 声明式写在模板上</h3>
    <p class="muted">
      【最常用】.prevent / .stop（区块三、四）与按键 .enter；【常用】.esc、.once、回车时排除修饰键的 .enter.exact。
    </p>
    <div class="row">
      <button
        :disabled="claimed"
        @click.once="claimed = true; add('领取成功（.once：监听器已被移除）')"
      >
        {{ claimed ? '已领取' : '领取优惠券（.once）' }}
      </button>
    </div>
    <input
      placeholder="试试 Enter、Shift + Enter、Esc，或者用中文输入法打字后按回车"
      aria-label="按键实验输入框"
      @keydown.enter.exact="handleEnter"
      @keydown.esc="handleEsc"
    >
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
    <!-- 【少用】取消注释即可运行：删掉这一行和下面的结束行，并取消 script 里 import RareModifiersDemo 那一段的注释
    <RareModifiersDemo />
    -->
  </div>
</template>
