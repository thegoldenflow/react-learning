<script setup lang="ts">
/**
 * 区块四：v-if / v-show / <KeepAlive>。对照 react/HideVsUnmountDemo.tsx（&& / hidden 属性 / <Activity>）。
 * - v-if：卸载，state 和 DOM 都没了（onUnmounted），再显示是新实例（onMounted）；
 * - v-show：「v-show only toggles the display CSS property of the element」，组件一直在，不走挂载 / 卸载（也不走停用 / 激活）钩子 —— 相当于 React 里用 hidden / CSS 藏起来；
 *   但组件上的 v-show 每次切换都会让组件被父组件强制更新一次（vnode 带指令就强制更新，@vue/runtime-core 3.5.42 runtime-core.cjs.js:4842），onBeforeUpdate / onUpdated 照常调用。
 *   本演示的面板没有记 onUpdated：日志就在父组件里，子组件一更新就写日志会让父组件重新渲染、又强制更新子组件，循环下去；这一点在 Example.test.ts 里单独验证。
 * - <KeepAlive> 包住 v-if：组件实例被缓存，「it goes into a deactivated state instead of being unmounted」，停用时 onDeactivated、激活时 onActivated。
 *   和 React 的 <Activity> 一样保留 state；不同有两点：Activity 由 React 清理 Effect，KeepAlive 停用期间 watch 照样触发、组件照样随数据重新渲染（要停订阅自己在
 *   onDeactivated 里做，Example.test.ts 覆盖）；KeepAlive 缓存的组件 DOM 被移出文档、激活时插回同一个元素，Activity 是用 display: none 留在原地（测试覆盖）。
 * - v-if 与 v-show 怎么选：「v-if has higher toggle costs while v-show has higher initial render costs. So prefer v-show if you need to toggle something very often,
 *   and prefer v-if if the condition is unlikely to change at runtime.」v-show 不能用在 <template> 上，也不能配 v-else。
 *   v-if 是惰性的：「if the condition is false on initial render, it will not do anything」；v-show 不管条件都先渲染。
 */
import { ref } from 'vue'
import LifecyclePanel from './LifecyclePanel.vue'

const visible = ref(true)
const log = ref<string[]>([])
const add = (line: string) => log.value.push(line)
</script>

<template>
  <div class="card stack">
    <h3>区块四：v-if、v-show 与 &lt;KeepAlive&gt;</h3>
    <div class="row">
      <button @click="visible = !visible">
        {{ visible ? '隐藏三块面板' : '显示三块面板' }}
      </button>
    </div>
    <div class="card">
      <LifecyclePanel
        v-if="visible"
        name="v-if"
        :log="add"
      />
    </div>
    <div class="card">
      <LifecyclePanel
        v-show="visible"
        name="v-show"
        :log="add"
      />
    </div>
    <div
      class="card"
      data-testid="keep-alive-slot"
    >
      <KeepAlive>
        <LifecyclePanel
          v-if="visible"
          name="KeepAlive"
          :log="add"
        />
      </KeepAlive>
    </div>
    <ul
      class="log"
      aria-label="区块四日志"
    >
      <li
        v-for="(line, i) in log"
        :key="i"
      >
        {{ line }}
      </li>
    </ul>
  </div>
</template>
