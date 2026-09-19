<script setup lang="ts">
/**
 * 主题：02. Props（Vue 对照：defineProps、单向数据流与透传属性）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-19
 * 前置主题：01
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时按项目里的使用频率标【最常用】【常用】【少用】（规则与依据见 react/Example.tsx 文件头）。
 *          Vue 这一侧的演示（类型声明的 defineProps、3.5 解构默认值、emit、透传与 inheritAttrs: false、useTemplateRef）都是 Vue 项目里常用的写法，没有注释掉的部分。
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - 声明 props：【最常用】类型声明 defineProps<Props>()（编译器宏，不用 import；官方 TypeScript 指南说用泛型参数「usually more straightforward」）；
 *   【常用】运行时声明 defineProps({ amount: { type: Number, required: true, validator } })（props 页的主示例就是它，不写 TS 的项目只能用它），在开发环境校验、失败只警告；
 *   类型声明由编译器生成等价的运行时声明。
 *   React 的 props 就是函数参数，没有宏；React 19 起 propTypes 不再校验，组件 props 靠 TypeScript 这类静态检查。
 * - 默认值【主流·3.5 起】：3.5 起的代码【最常用】响应式 props 解构（官方 TypeScript 指南先给的就是它） const { discount = 0 } = defineProps<Props>()，编译器把后面对 discount 的访问改写成 __props.discount，
 *   所以它仍是响应式的；把解构出来的 prop 传给 watch / composable 要包成 getter（() => discount）。3.4 及以前用 withDefaults(defineProps<Props>(), { … })【旧写法】，
 *   对象 / 数组默认值要写成工厂函数，解构写法不需要（区块一）。
 * - 默认值只在「没传 / 传 undefined」时生效【主流】，null 原样收到，和 React 一样；布尔 prop 不一样：声明成 boolean 的 prop 不传是 false、只写属性名是 true（布尔转型），
 *   React 不传就是 undefined（区块一，测试覆盖）。同时允许 String 和 Boolean 时，Boolean 写在 String 前面才做布尔转型。
 * - 单向数据流【主流】：子组件改 props，开发环境不抛错，控制台警告「Set operation on key "amount" failed: target is readonly.」、值不变；TypeScript 也拦
 *   （defineProps 的返回类型是只读的）。生产构建没有只读包装，赋值会成功（node + 生产构建实测）。【最常用】想改就 emit 给父组件（区块二，08 题）。
 *   props 是响应式对象：父组件重新渲染把新值 patch 进来之后（下一个 tick），定时器里读 props.amount 读到的就是新值，不是 React 那样「每次渲染一份快照」（区块二，26 题）。
 * - 不要把 prop 拷进本地 ref【主流】：ref(price) 只在 setup 执行时读一次；【最常用】直接读 prop、需要转换就用 computed；【常用】有意只取初始值时命名 initialX（props 页的第一种情形）（区块三）。
 * - 透传属性（fallthrough attributes）：【最常用】单根组件什么都不用写，没被 props / emits 声明的属性和监听器自动加到根元素上，class / style 合并、监听器两边都触发；
 *   【常用】defineOptions({ inheritAttrs: false })（defineOptions 3.3 起）+ useAttrs() / $attrs 手动接管 = React 的 {...rest}（官方给的典型场景是属性要落在根元素以外的地方；
 *   区块四的 UiButton 为了和 React 版逐行对照用的是这种）。
 *   关了 inheritAttrs 又没手动绑，属性就丢了；没关 inheritAttrs 又手动绑，class 会重复（测试覆盖）。
 * - 多根组件【主流】不自动透传，没显式绑 $attrs 会运行时警告（区块四的 LabeledInput，测试覆盖）。
 * - useAttrs()【主流】返回的对象：文档「it isn't reactive (for performance reasons). You cannot use watchers to observe its changes.」要响应式就声明成 prop，或在 onUpdated 里读。
 * - 组件 ref【主流】：模板 ref 放在组件上拿到的是组件实例；<script setup> 组件默认封闭，要 defineExpose（12 题改写时补）；useTemplateRef【主流·3.5 起】（区块四）。
 *   React 19 的 ref 是普通 prop，组件把它转交给 DOM 元素，父组件拿到的是 DOM 节点。
 * - prop 名【主流】：defineProps 里 camelCase 声明，模板里惯用 kebab-case（order-no），Vue 自动对应；透传属性在 JS 里保留原始写法（$attrs['foo-bar']、$attrs.onClick）。
 * - 解构出来的 prop 是只读的：给它赋值（discount = 1）编译时直接报错「Cannot assign to destructured props as they are readonly.」（@vue/compiler-sfc 3.5.42）。
 *
 * 附：细节（了解即可，完整出处见 react/Example.tsx 的附 6）
 * - useAttrs 能不能 watch：实测 3.5.42 里 watch(() => attrs.title) 其实会触发（attrs 代理整体追踪、属性变化时统一触发，3.2 起为修插槽里的 $attrs 更新而加），
 *   但文档没有承诺，别依赖（测试记录了这个现状）。
 * - 开发环境 setup 拿到的是 shallowReadonly(props)，生产构建是可写的 props 对象；重复绑定的同一个监听器按引用去重（源码行号见 react/Example.tsx 附 6）。
 */
import MirrorPropsDemo from './MirrorPropsDemo.vue'
import OrderCards from './OrderCards.vue'
import ReadonlyPropsDemo from './ReadonlyPropsDemo.vue'
import UiButtonDemo from './UiButtonDemo.vue'
</script>

<template>
  <div class="stack">
    <OrderCards />
    <ReadonlyPropsDemo />
    <MirrorPropsDemo />
    <UiButtonDemo />
  </div>
</template>
