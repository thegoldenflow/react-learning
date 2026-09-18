<script setup lang="ts">
/**
 * 主题：14. 自定义 Hook 与 Composable（Vue 对照）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-17
 * 前置主题：10、12、09、11（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - composable 与自定义 Hook 一样「共享逻辑、不共享状态」；以 use 开头是命名约定，不是 lint 的依据【主流】。
 * - 调用限制：必须在 <script setup> / setup() 里同步调用（要找到当前组件实例来注册生命周期、绑定 watcher）；
 *   不受调用顺序限制、可以写在 if 里。在 setTimeout 里调用会被警告「onMounted is called when there is no active component instance」（测试覆盖）【主流】。
 * - 订阅外部数据源：ref + onMounted 加监听 + onUnmounted 移除（官方 useMouse 示例）；服务端渲染时 DOM 副作用放 onMounted，
 *   所以 useWindowWidth 初始值是 null，纯客户端也会先渲染一次「未知」（测试覆盖）。对应 React 的 useSyncExternalStore + getServerSnapshot【主流】。
 * - 入参 MaybeRefOrGetter + toValue()【主流·3.3 起】；清理用 onWatcherCleanup【主流·3.5 起】，组件卸载时 watcher 停止，清理函数照样执行（测试覆盖）。
 * - 回调不会过期：setup 只执行一次，useInterval 不需要 React 那边的 useEffectEvent；频繁重新渲染也不会重建定时器（测试覆盖）。
 * - 定时器 id 放 setup 作用域的 let 变量是对的（LetTimerDemo.vue，测试覆盖）；同样的写法在 React 组件函数体里会失效。
 * - 生态：VueUse 的 useWindowSize、useEventListener、refDebounced / watchDebounced / useDebounceFn。
 */
import { ref } from 'vue'
import DebouncedUserSearch from './DebouncedUserSearch.vue'
import IntervalDemo from './IntervalDemo.vue'
import LetTimerDemo from './LetTimerDemo.vue'
import WidthPanel from './WidthPanel.vue'

const showB = ref(true)
</script>

<template>
  <div class="stack">
    <div class="card stack">
      <h3>区块一：订阅浏览器 API —— composable（ref + onMounted / onUnmounted）</h3>
      <p class="muted">
        拖动浏览器窗口改变宽度，两个面板实时更新（各自独立监听 resize）。Vue 没有 useSyncExternalStore 这类 API，也不需要。
      </p>
      <WidthPanel
        title="面板 A"
        :threshold="768"
      />
      <WidthPanel
        v-if="showB"
        title="面板 B"
        :threshold="1024"
      />
      <div class="row">
        <button @click="showB = !showB">
          {{ showB ? '卸载面板 B' : '重新挂载面板 B' }}
        </button>
        <span class="muted">卸载 B 时它自己的 onUnmounted 移除监听，A 不受影响。</span>
      </div>
    </div>

    <IntervalDemo />

    <div class="card stack">
      <h3>区块三：防抖（useDebouncedValue）与「let timer」在 Vue 里是对的</h3>
      <DebouncedUserSearch />
      <strong>同样的「let timer」写法：Vue 里正常防抖（React 里会失效）</strong>
      <LetTimerDemo />
    </div>
  </div>
</template>
