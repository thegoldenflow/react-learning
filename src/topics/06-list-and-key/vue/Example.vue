<script setup lang="ts">
/**
 * 主题：06. 列表渲染与 key（Vue 对照：v-for + :key、就地更新、换 :key 重置组件）
 * 适用版本：Vue 3.5 · eslint-plugin-vue 10.10
 * 最后核对：2026-09-19
 * 前置主题：01、02、03、05
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时按 Vue 项目里的使用频率标【最常用】【常用】【少用】（规则与依据见 react/Example.tsx 文件头）。
 *          【少用】的 v-for 写法拆在 RareVForDemo.vue，ListBasicsDemo.vue 里注释着（删掉注释块的第一行和最后一行就能运行；
 *          模板里的注释块写成 <!-- 【少用】… 开头、单独一行 --> 结尾）；❌ 反例照常运行。
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - 渲染列表：v-for="item in items" + :key="item.id"【最常用】（区块一；API 页「The most common use case is combined with v-for」），要下标写 (item, index) in items。组件上用 v-for 不会自动把 item 传进去，要显式写 :order="order"
 *   （「components have isolated scopes of their own」），和 React 的 <Row key={id} order={order} /> 一样。
 * - 过滤 / 排序：computed【最常用】（区块一），排序前先拷贝（computed 里原地 sort 会改掉源数组）；把 v-for 挪到外层 <template>、v-if 写在里面【常用】。
 *   v-if 与 v-for 写在同一个元素上 ❌：v-if 先求值、读不到循环变量（编译结果测试覆盖），官方不推荐同用，lint 的 vue/no-use-v-if-with-v-for 会报错；
 *   要隐藏整个列表 ✅ 把 v-if 挪到外层容器（区块一的 <ul v-if> / <p v-else>）。React 没有指令优先级的问题：先 filter 再 map。
 * - 一项多个节点：<template v-for>，:key 写在 <template> 上【常用】（区块一的库存明细表，一项两行 <tr>）；Vue 2 的 <template> 不能带 key、只能写在子元素上，
 *   Vue 3 的 lint 规则 vue/no-v-for-template-key-on-child 会拦这种旧写法。
 * - key 是身份（区块二）：❌ 不写 :key 时 Vue 就地更新（按位置复用 DOM），和 React 不写 key、用 index 作 key 一样，在开头插入、删除开头的项、重排时会把输入框的内容串到别的行；
 *   运行时不报警（测试覆盖），靠 lint 的 vue/require-v-for-key。❌ index、❌ Math.random() 两边后果相同（测试覆盖）。
 *   key 要用原始值（API 页：number | string | symbol）；重复 key 挂载时不检查，更新时走到乱序比较那一步才出一条 [Vue warn]，界面也会出错（测试覆盖）。
 * - 改数组：直接调变更方法 push / unshift / splice【最常用】，filter / slice 得到新数组后整体替换【常用】（区块二）；React 的 state 要造新数组交给 setter。
 *   ref 装数组时内部用 reactive() 转成 Proxy，Proxy 包的是原数组：初始值是模块常量时先拷贝一份（测试覆盖；浅拷贝，里面的订单对象还是同一批）。
 * - 换 :key 强制换实例（区块三）：setup 重跑、ref 初始值重新算，和 React 的 key 是同一个机制；<router-view :key="$route.fullPath"> 也是它（18 题）。
 *   官方列的另一个用途是触发过渡：<transition><span :key="text">，text 变了就换一个元素、播放过渡。
 *   prop 变了要重置内部状态：换 :key 和 watch 手动重置两种都常见（工程经验）；watch 默认在组件更新之前执行，不会先用旧值渲染一次（测试覆盖），
 *   这一点和 React「在 Effect 里 setState 重置」不同（React 会先用旧值渲染一次，官方要避免）。
 *
 * 附：细节（了解即可，完整出处见 react/Example.tsx 的附 6、附 7）
 * - 【少用】of 代替 in、遍历对象 (value, key, index)、整数范围 n in 10（从 1 开始）、解构（拆在 RareVForDemo.vue，ListBasicsDemo.vue 里注释着，测试直接挂载它）；嵌套 v-for 里 computed 用不了时改用方法；
 *   v-memo（3.2+）：官方「should be rarely needed」，大列表（length > 1000）才考虑，本课没有演示。
 * - 官方允许不写 key 的情况：「unless the iterated DOM content is simple (i.e. contains no components or stateful DOM elements)」。
 * - 整体替换数组时 Vue 并不会丢掉整个列表的 DOM：「Vue implements some smart heuristics to maximize DOM element reuse」。
 */
import KeyBugDemo from './KeyBugDemo.vue'
import KeyResetDemo from './KeyResetDemo.vue'
import ListBasicsDemo from './ListBasicsDemo.vue'
</script>

<template>
  <div class="stack">
    <ListBasicsDemo />
    <KeyBugDemo />
    <KeyResetDemo />
  </div>
</template>
