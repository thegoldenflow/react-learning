<script setup lang="ts">
/**
 * 主题：01. 组件与 JSX（Vue 对照：SFC 与模板语法）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：无（第一题）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - SFC【主流】：一个 .vue 文件 = <script setup> + <template> + <style>，由 @vue/compiler-sfc 编译成标准的 JS 模块；模板被编译成渲染函数（区块二有实际输出）。
 *   React 这边是一个返回 JSX 的函数，JSX 同样要编译（成 jsx() 调用）。
 * - 模板语法【主流】：插值 {{ }} 只能放单个表达式，而且在沙箱里只能访问受限的全局变量；class / for 原样写；:class、:style 有对象和数组语法，:style 自动加厂商前缀；
 *   同名简写 :id【主流·3.4 起】。React 里拼 class 靠字符串（clsx）、合并 style 靠对象展开。
 * - :style 里的数字不补单位【主流】（区块二：width: 48 在 jsdom 和 Chrome 里都被当成无效值丢掉）；React 会给 0 与无单位属性以外的数字自动补 px。
 * - 多根组件【主流】：Vue 3 组件可以有多个根节点（区块一的 ProfileCards.vue），不需要 Fragment；多根时透传 attrs 要显式绑定（class 用 $attrs.class 指定），否则运行时警告（attrs 页；透传机制与多根组件见 02 题区块四）。
 *   一次渲染多个节点用 <template v-for> / <template v-if>，v-for 的 key 写在 <template> 上。
 * - 把一段 UI 传给子组件【主流】：React 把 JSX 当值传；Vue 用插槽（区块一的 #badge，13 题）。Vue 也有渲染函数 h() 和 JSX / TSX，但官方推荐绝大多数情况用模板，
 *   而且 Vue 的 JSX 转换和 React 的不同，不能混用。
 * - 纯渲染【主流】：模板和渲染函数同样不该有副作用；Vue 没有 StrictMode 这样的双调用检查。React 的「在组件里定义组件会丢 state」：
 *   在 <script setup> 里定义的只创建一次，不会出问题（setup 每个实例只执行一次）；但在渲染函数 / JSX 里现场创建组件对象，Vue 同样按 vnode 的 type 判断能否复用，
 *   每次更新都卸载重建 —— 规则和 React 一样，差别只在 setup 只执行一次。
 * - 命名【主流】：SFC 里组件标签推荐 PascalCase；直接写在 HTML 里的模板大小写不敏感，要用 kebab-case、写闭合标签。
 * - v-html ↔ dangerouslySetInnerHTML【主流】：只用于可信内容，否则就是 XSS（35 题，待新增）；scoped 样式不作用于 v-html 插入的内容。
 */
import ProfileCards from './ProfileCards.vue'
import TemplateRulesDemo from './TemplateRulesDemo.vue'
</script>

<template>
  <div class="stack">
    <ProfileCards />
    <TemplateRulesDemo />
    <div class="card stack">
      <h3>区块三、四在 Vue 里</h3>
      <p class="muted">
        React 区块三讲「组件必须是纯函数、StrictMode 调用两次」，区块四讲「在组件里定义组件会丢 state」。Vue 的模板同样应该没有副作用，但没有
        StrictMode 这类双调用检查。区块四的问题在 &lt;script setup&gt; 里定义组件时不会出现（每个实例只执行一次）；但在渲染函数 / JSX 里现场创建组件对象，
        Vue 同样按 vnode 的类型判断能否复用，每次更新都会卸载重建 —— 规则和 React 一样。
      </p>
    </div>
  </div>
</template>
