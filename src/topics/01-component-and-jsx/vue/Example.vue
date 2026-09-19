<script setup lang="ts">
/**
 * 主题：01. 组件与 JSX（Vue 对照：SFC 与模板语法）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-19
 * 前置主题：无（第一题）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时按项目里的使用频率标【最常用】【常用】【少用】（规则与依据见 react/Example.tsx 文件头）。
 *          Vue 这一侧的演示（SFC + 模板、:class / :style、<style scoped>、具名插槽、<template v-for>）都是 Vue 项目里常用的写法，没有注释掉的部分。
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - SFC + 模板【最常用】：一个 .vue 文件 = <script setup> + <template> + <style>，由 @vue/compiler-sfc 编译成标准的 JS 模块；模板被编译成渲染函数（区块二有实际输出）。
 *   官方把 SFC 作为 SPA、SSG 这类项目的推荐做法；React 这边是一个返回 JSX 的函数，JSX 同样要编译（成 jsx() 调用）。
 * - 模板语法【主流】：插值 {{ }} 只能放单个表达式，而且在沙箱里只能访问受限的全局变量；class / for 原样写；按条件挂类名【最常用】:class 对象语法
 *   （:class / :style 的数组语法【少用】，见附）；同名简写 :id【主流·3.4 起】。React 里拼 class 靠字符串（三元 / clsx）、合并 style 靠对象展开。
 * - 写样式：静态样式【最常用】写在 <style scoped> 里（区块一的 UserCard.vue；create-vue 脚手架生成的组件默认如此，官方风格指南把「组件样式要有作用域」列为 Essential，
 *   scoped、CSS Modules、BEM 都算），:style 只放依赖数据的值 ——
 *   和 React 的「静态样式走 className（CSS Modules），style 只放动态值」是同一个原则。
 * - :style 里的数字不补单位【主流】（区块二：width: 48 在 jsdom 和 Chrome 里都被当成无效值丢掉）；React 会给 0 与无单位属性以外的数字自动补 px。
 * - 多根组件【主流】：Vue 3 组件可以有多个根节点（区块一的 ProfileCards.vue），不需要 Fragment；多根时透传 attrs 要显式绑定（class 用 $attrs.class 指定），否则运行时警告（attrs 页；透传机制与多根组件见 02 题区块四）。
 *   一次渲染多个节点用 <template v-for> / <template v-if>，v-for 的 key 写在 <template> 上。
 * - 把一段 UI 传给子组件【最常用】：Vue 用插槽（区块一的 #badge，13 题）；React 把 JSX 当值传。
 * - 纯渲染【主流】：模板和渲染函数同样不该有副作用；Vue 没有 StrictMode 这样的双调用检查。React 的「在组件里定义组件会丢 state」：
 *   在 <script setup> 里定义的只创建一次，不会出问题（setup 每个实例只执行一次）。
 * - 命名【主流】：SFC 里组件标签推荐 PascalCase。
 * - v-html ↔ dangerouslySetInnerHTML【主流】：只用于可信内容，否则就是 XSS（35 题，待新增）；scoped 样式不作用于 v-html 插入的内容。
 *
 * 附：少用的写法与细节（完整出处见 react/Example.tsx 的附 2–5）
 * - 【少用】渲染函数 h() / JSX：官方推荐绝大多数情况用模板；Vue 的 JSX 转换和 React 的不同，不能混用。在渲染函数 / JSX 里现场创建组件对象，
 *   Vue 同样按 vnode 的 type 判断能否复用，每次更新都卸载重建 —— 规则和 React 一样，差别只在 setup 只执行一次。
 * - 【少用】v-once / v-memo：模板级的「跳过更新」，v-memo 官方说只为性能关键场景的微优化、很少需要（v-once 少用是工程经验）。
 * - 【少用】:class / :style 的数组语法：合并多个类名 / 样式对象时用；静态样式进了 <style scoped> 之后就很少需要（改写前的 UserCard.vue 用 :style 数组合并 avatarStyle 与 accent）。
 * - 【少用】直接写在 HTML 里的模板（in-DOM template）：大小写不敏感，要用 kebab-case、写闭合标签；用 SFC 时不受影响。
 * - :style 会自动加厂商前缀（React 的 style 不加，react-dom 原样写入）。
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
