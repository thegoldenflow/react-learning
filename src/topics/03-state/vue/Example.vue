<script setup lang="ts">
/**
 * 主题：03. State（Vue 对照：ref / reactive、没有渲染快照、setup 只执行一次）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：01、02
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - ref() 是声明响应式状态的首选【主流】：「In Composition API, the recommended way to declare reactive state is using the ref() function」。
 *   ref 靠 .value 的 getter / setter 追踪与触发（「Under the hood, Vue performs the tracking in its getter, and performs triggering in its setter.」），
 *   装对象或数组时内部用 reactive() 转成 Proxy；reactive() 直接返回 Proxy。
 * - 普通变量不是响应式的【主流】（区块一）：官方说法是「Reactive state needs to be explicitly created using Reactivity APIs.」<script setup> 只执行一次，普通变量一直活着、跨渲染保留，
 *   改了不触发渲染；别的数据让组件重渲染时，模板才顺带读到它的当前值（测试覆盖）。React 的局部变量每次渲染重来。
 * - 每个组件实例执行一次自己的 setup，各有一份 ref【主流】（区块一，测试覆盖）；ref 定义在组件外的模块顶层就是全局共享（16 题）。
 * - 没有渲染快照【主流】（区块二）：改完立刻读到新值，两个按钮都加 2，也就不需要 React 的「更新函数」；DOM 更新缓冲到下一个 tick、每个组件只更新一次，
 *   要读更新后的 DOM 就 await nextTick()（测试覆盖）。赋相同的值不触发（ref 的 setter 用 Object.is 比较，测试覆盖）。
 * - 直接改就更新【主流】（区块三）：item.quantity += 1 被 Proxy 拦截；ref 的 .value 可以整体替换。reactive() 的三条限制：只能装对象类型、不能整体替换、解构出原始类型的属性会断开追踪 ——
 *   所以官方「recommend using ref() as the primary API for declaring reactive state」（区块六的 resetEditor 用 Object.assign 改字段，而不是把 reactive 对象整体换掉）。
 * - 没有「惰性初始化」【主流】（区块四）：setup 只执行一次，ref(createInitialRows()) 天然只算一次；Vue 也没有 StrictMode 那样的开发期双调用（测试覆盖：1 次）。
 * - state 的结构【主流】（区块五）：存同一个响应式对象会跟着原地修改变，存副本会过期；列表被整体换成新对象后，存下来的对象就和列表脱节了 ——
 *   只要 id 稳定，存 id + computed 查找两种情况都对得上（测试覆盖）。
 *   多个布尔值合成一个字面量联合的 status，需要布尔值时用 computed 派生。
 * - useReducer 没有内置对应物【主流】（区块六）：reactive 对象 + 直接改它的函数；复杂时把修改集中到 composable（14 题）或 Pinia action（16 题）——「别让修改散落各处」和框架无关。Pinia action 可以直接改 store、可以是异步的，reducer 是同步纯函数。
 * - 渲染时改自己读过的数据【主流】（区块七）：开发构建在同一个更新任务重复排队超过 100 次时报「Maximum recursive updates exceeded in component <X>. …」（runtime-core.cjs.js:283、:435-449），
 *   先警告再把这段字符串抛出去，变成未处理的 Promise 拒绝，app.config.errorHandler 接不到（传给 handleError 的 instance 是 null）（开发构建的这些行为测试覆盖）；
 *   生产构建没有这项检查（runtime-core.cjs.prod.js 里没有 checkRecursiveUpdates）。
 *   React 对应的是「Too many re-renders」。
 * - 把函数存进 ref【主流】：ref(fn) 存的就是 fn，Vue 不会把它当初始化函数调用（测试覆盖）；React 要写 useState(() => fn)。
 * - 更细粒度的方向：Vapor Mode【尝鲜】（Vue 3.6 RC）逐个绑定直接更新 DOM、不经过组件级虚拟 DOM；Vue 3.5 的更新单位仍是组件的 render effect。
 */
import CartDemo from './CartDemo.vue'
import LazyInitDemo from './LazyInitDemo.vue'
import QuantityEditor from './QuantityEditor.vue'
import SnapshotDemo from './SnapshotDemo.vue'
import StateStructureDemo from './StateStructureDemo.vue'
import WhyStateDemo from './WhyStateDemo.vue'
</script>

<template>
  <div class="stack">
    <WhyStateDemo />
    <SnapshotDemo />
    <CartDemo />
    <LazyInitDemo />
    <StateStructureDemo />
    <QuantityEditor />
    <div class="card stack">
      <h3>区块七在 Vue 里</h3>
      <ul class="stack">
        <li>
          渲染时无条件地改状态：React 抛「Too many re-renders」；Vue 在渲染里改自己读过的数据，开发构建在同一个更新任务被重复排队超过 100 次时报
          「Maximum recursive updates exceeded in component &lt;X&gt;…」（测试覆盖）。两边的结论一样：渲染过程里不要无条件地改状态
          （React 有一个有条件的例外：记住上一次的 prop，见 react/Example.tsx 二-13）。
        </li>
        <li>
          把函数存进响应式数据：ref(fn) 存的就是 fn 本身，Vue 不会把它当初始化函数调用，也没有「更新函数」这种写法（测试覆盖）。
        </li>
      </ul>
    </div>
  </div>
</template>
