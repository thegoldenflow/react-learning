<script setup lang="ts">
/**
 * 主题：26. 过期闭包（Vue 对照：现读 .value、watch 的 source、watchEffect）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：03、10、12、14、23、24（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - 为什么默认不过期【主流】：setup 只执行一次，回调捕获的是 ref / reactive 本身，执行时通过 .value 现读。
 *   官方 composition-api-faq 在对比 React Hooks 时就把这一点列为区别（原文见 react/Example.tsx 三）。区块一、二、三的「现读」写法都是这个道理。
 * - Vue 也会「过期」【主流】：把响应式数据变成普通值的写法 —— 手动 const snapshot = x.value、解构 reactive 对象（官方 Limitations of reactive()：
 *   失去响应式连接）、3.4 及以前解构 props。修法是保留 ref / reactive 本身，或用 toRefs。3.5 起 const { x } = defineProps() 由编译器改写成 props.x，
 *   在回调里读到的是那一刻的 prop（区块一子组件，测试覆盖）；但 watch(x) 要写成 watch(() => x)。
 * - 事件监听【主流】：onMounted 注册一次、handler 现读 .value，onBeforeUnmount 移除（这时模板 ref 还在）。
 *   模板事件（@keydown）Vue 直接绑在元素上，处理函数换了时只把 invoker.value 换成新的、不重新注册（runtime-dom patchEvent）——
 *   相当于框架替你做了 latest ref；编译器通常还会把处理函数缓存起来（17 题），缓存的函数执行时现读 .value，也不会过期。
 *   React 的 JSX 事件在根节点统一委托，派发时读 DOM 节点上当前的 props，同样用到最新提交的处理函数。
 * - watch 与 watchEffect【主流】（区块四）：watch 只追踪 source，回调里读到的值不会触发重跑 —— 概念上对应 React 的 useEffectEvent（读最新值、不当依赖）；
 *   watchEffect 追踪同步执行期间读到的一切 —— 对应 React「把读到的都写进依赖」。本该由交互触发的逻辑两边的首选都是放进事件处理函数。
 *   watchEffect 里写日志别用 logRef.value.push（读 .value 会被收成依赖），测试覆盖。
 * - 清理【主流】：onWatcherCleanup（3.5 起，只能在同步执行期间调用）/ 回调第三个参数 onCleanup（3.4 及以前只能用它；3.5 仍可用，await 之后注册清理时要用它），在下一次回调前与 watcher 停止时执行，对应 Effect 的 cleanup；
 *   在 setup 里同步创建的 watcher 随组件卸载自动停止（区块三）。
 * - 非响应式的值【主流】（普通对象、普通变量）当 watch 的 source，改了也不会触发 —— 和 React 把 ref.current 写进依赖数组一样没用，但 React 会在别的原因重渲染时补跑，Vue 一次都不跑（区块四）。
 * - 概念对应【主流】：React 的函数式更新、依赖数组、exhaustive-deps、useEffectEvent、latest ref 在 Vue 里不需要：它们处理的是「每次渲染都产生新闭包」这个前提，Vue 的 setup 没有这个前提。
 *   对应关系只在概念上：count.value++ ↔ 函数式更新；watch(source) ↔ 写对依赖；watch 回调里现读 ↔ useEffectEvent；ref 本身 ↔ latest ref。
 */
import DelayedSaveDemo from './DelayedSaveDemo.vue'
import ListenerDemo from './ListenerDemo.vue'
import PollingDemo from './PollingDemo.vue'
import WatchSourceDemo from './WatchSourceDemo.vue'
</script>

<template>
  <div class="stack">
    <DelayedSaveDemo />
    <ListenerDemo />
    <PollingDemo />
    <WatchSourceDemo />
  </div>
</template>
