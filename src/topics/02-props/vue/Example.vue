<script setup lang="ts">
/**
 * 学习主题：Props（类型声明、默认值与单向数据流）
 *
 * React 核心概念：
 * - props 就是组件函数的第一个参数（一个普通对象），用 TS interface 描述形状
 * - 默认值用「参数解构默认值」：function OrderCard({ discount = 0 }: Props) —— 工业主流写法
 * - defaultProps / PropTypes 是过时写法，TypeScript 时代不再使用
 * - props 只读：子组件不能改，要改就调用父组件传下来的回调把修改「上浮」（08 题详讲）
 * - 组件只是函数，多个组件写在同一个 .tsx 文件里很常见
 * - 没有任何属性会自动透传：想让自己的组件支持 disabled / type / title / aria-* / onClick
 *   这些原生属性，必须自己用 { ...rest } 收集，再展开到真实 DOM 元素上
 * - ComponentPropsWithoutRef<'button'> 一次性继承 <button> 的全部原生属性类型，
 *   与自定义 props 用交叉类型 & 拼起来 —— 这是组件库（shadcn/ui、MUI）的通用 API 写法
 *
 * Vue 对应概念：
 * - defineProps<{ ... }>() 声明类型；默认值要包一层 withDefaults(defineProps<...>(), { ... })
 * - Vue 的 props 同样单向：子组件里改 props，开发期会收到运行时警告
 * - SFC 一个文件只能有一个组件，子组件必须放单独的 .vue 文件
 * - fallthrough attributes（$attrs）：没在 defineProps 里声明的属性（含 class/style/事件监听）
 *   Vue 会自动落到子组件根元素上，class/style 还会自动与根元素已有的合并
 * - defineOptions({ inheritAttrs: false }) + useAttrs() 才是「手动接管透传」，
 *   这一步才等价于 React 的 { ...rest }
 *
 * 最重要的区别：
 * - defineProps 是「编译器宏」（编译期展开、无需 import）；React 没有任何宏，
 *   props 就是函数参数，类型、默认值全部用 TypeScript + JS 原生语法（解构默认值）表达
 * - 「子组件不能改 props」两边一致，但 Vue 有运行时警告兜底，React 不警告、
 *   纯靠约定与单向数据流——改 props 往往不报错，却会造成 UI 与数据源不一致（面试常问）
 * - 属性透传：Vue 默认帮你做（$attrs 自动落到根元素、class/style 还自动合并），
 *   React 一个属性都不会自动传下去。没有一一对应关系——React 里根本不存在
 *   $attrs / inheritAttrs / useAttrs 这套机制，{ ...rest } 是唯一手段，连 className 也要手动合并
 */
// 子组件必须是单独的 .vue 文件再 import 进来；React 版的 OrderCard 与父组件同文件
import OrderCard from './OrderCard.vue'
// 演示属性透传的按钮组件；React 版的 UiButton 与父组件同在一个 .tsx 文件里
import UiButton from './UiButton.vue'

// 只用来证明 @click 确实落到了真实 button 上（React 侧对应 handleDemoClick）
function handleDemoClick() {
  console.log('[02-Vue] @click 没被 defineProps 接住，它是通过 $attrs 落到真实 <button> 上的')
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      父组件渲染三张订单卡；第二张传了可选的 discount，其余两张走默认值 0
    </p>
    <!-- 静态字符串属性直接写；数字等 JS 值要用 v-bind（:amount="1280"）。
         React 里这一步是：字符串用引号、其余值一律花括号 amount={1280}。
         Vue 模板惯用 kebab-case（order-no），JSX 属性保持 camelCase（orderNo）。 -->
    <OrderCard
      order-no="SO-20260801"
      customer="林小满"
      :amount="1280"
      status="pending"
    />
    <OrderCard
      order-no="SO-20260802"
      customer="陈北洋"
      :amount="5600"
      status="paid"
      :discount="0.15"
    />
    <OrderCard
      order-no="SO-20260803"
      customer="赵四方"
      :amount="899"
      status="cancelled"
    />

    <!-- ---------- 新增区块：UiButton 与属性透传 ---------- -->
    <div class="card stack">
      <p class="muted">
        UiButton 只声明了 variant 一个自己的 prop；下面的 disabled / type / title / aria-label / @click
        都没被 defineProps 接住，走的是 fallthrough attributes（$attrs）这条路
      </p>
      <div class="row">
        <!-- @click 能生效：Vue 默认就会把没声明的属性自动落到子组件根元素上；
             React 那边必须靠组件内部把 rest 展开到 <button> 才行 -->
        <UiButton @click="handleDemoClick">
          主要按钮（点我看控制台）
        </UiButton>

        <!-- 多个原生属性一起透传，写法和 React 侧一一对应 -->
        <UiButton
          variant="danger"
          title="这行 title 是透传到真实 button 上的，鼠标悬停可见"
          aria-label="删除订单 SO-20260803"
          @click="handleDemoClick"
        >
          删除
        </UiButton>

        <!-- disabled 真的落到原生 button 上：按钮变灰、点击不触发 @click -->
        <UiButton
          disabled
          @click="handleDemoClick"
        >
          已禁用（点击无反应）
        </UiButton>

        <!-- type 同理：UiButton 里 type="button" 写在 v-bind="attrs" 之前，
             mergeProps 后写的同名键覆盖前面的，所以外部这个 type="submit" 生效。
             与 React 侧「rest 展开位置决定外部能不能覆盖默认值」是同一条规则 -->
        <UiButton
          type="submit"
          @click="handleDemoClick"
        >
          type 被外部覆盖为 submit
        </UiButton>

        <!-- class 会被 Vue 自动 merge 到根元素已有的 class 上；
             React 侧要把 className 单独解构出来手动拼接，否则外部 className 会整个覆盖组件样式 -->
        <UiButton class="btn-ghost">
          class 被自动合并
        </UiButton>
      </div>
      <p class="muted">
        打开 DevTools 看最后一个按钮：btn-primary 和 btn-ghost 同时存在——
        class/style 的合并是 Vue 白送的，React 必须自己写合并逻辑
      </p>
    </div>
  </div>
</template>
