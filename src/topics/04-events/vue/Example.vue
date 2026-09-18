<script setup lang="ts">
/**
 * 主题：04. 事件处理（Vue 对照：v-on、修饰符、原生事件、组件事件不冒泡）
 * 适用版本：Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：01、02、03
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - 方法处理器与内联处理器【主流】（区块一）：「The template compiler detects method handlers by checking whether the v-on value string is a valid JavaScript identifier or property access path.」
 *   @click="remove(item.id)" 这种内联写法会被编译器包成函数，所以模板里写「调用」是对的；React 的 JSX 没有这层编译，onClick={remove(id)} 在渲染时就执行。
 * - 事件对象【主流】（区块二）：方法处理器收到的就是原生事件（「A method handler automatically receives the native DOM Event object」），内联处理器用 $event 或箭头函数。
 *   $event 只在原生元素上是 DOM 事件；在组件上监听自定义事件时，它是 emit 的第一个参数。处理函数返回后 currentTarget 是 null（MDN ③，测试覆盖）。
 * - 没有委托【主流】（区块三）：v-on 在元素上直接 addEventListener（runtime-dom.cjs.js:634-636），currentTarget 就是绑定的元素；Vue 的监听器和原生监听器按 DOM 顺序交错执行，
 *   同一元素上先注册的先执行；.stop 之后同一元素上的其他监听器照常执行（测试覆盖）。React 17 起大多数事件委托到 root 容器，onClick 这类处理函数在原生事件到达 root 时才执行
 *   （onScroll、onLoad 这类挂在元素本身）。
 * - 原生不冒泡的事件 Vue 不做模拟【主流】（区块三）：外层的 @scroll、@focus 收不到里面元素的事件，要监听里面的焦点用 @focusin、观察里面的滚动用 @scroll.capture（测试覆盖）；React 让 onFocus / onLoad 冒泡、onScroll 不冒泡。
 * - 修饰符【主流】（区块四、五）：.stop .prevent .self .capture .once .passive；按键 .enter .tab .delete .esc .space .up .down .left .right；系统键 .ctrl .alt .shift .meta；.exact；鼠标 .left .right .middle。
 *   .stop / .prevent / .self / 系统键 / 鼠标键 / .exact 编译成守卫函数、按书写顺序执行（「Order matters when using modifiers」，runtime-dom.cjs.js:1818-1843）；.capture / .once / .passive 是
 *   addEventListener 的选项（:660-672）；按键修饰符比较 event.key，不看输入法组字状态（:1853-1867，要自己判断 isComposing || keyCode === 229）；@click.right / @click.middle 被编译器改写成 contextmenu / mouseup（compiler-dom.cjs.js:362-370）。
 * - 滚轮【主流】（区块六）：Vue 默认不 passive，@wheel.prevent 直接生效（测试覆盖）；.passive 是显式声明，「Do not use .passive and .prevent together」。React 的 onWheel 是被动监听。
 * - 组件事件不冒泡【主流】：「Unlike native DOM events, component emitted events do not bubble. You can only listen to the events emitted by a direct child component.」（测试覆盖）
 *   没在 emits 里声明的监听器是透传属性：单根组件把它加到根元素上，根节点是另一个组件时继续往下透传 —— 所以隔一层也可能「收到」孙组件的事件，这是透传，不是冒泡（02 题，测试覆盖两种情况）。React 的回调 prop 同样不冒泡（区块一的 OrderRow；08 题）。
 * - @submit.prevent 写在 <form> 上【主流】（区块四，07 题）：不要靠提交按钮的 @click —— 它跑在浏览器的必填 / 格式校验之前，requestSubmit() 也不经过按钮。
 */
import BindingDemo from './BindingDemo.vue'
import DefaultActionDemo from './DefaultActionDemo.vue'
import EventObjectDemo from './EventObjectDemo.vue'
import ModifiersDemo from './ModifiersDemo.vue'
import PassiveWheelDemo from './PassiveWheelDemo.vue'
import PropagationDemo from './PropagationDemo.vue'
</script>

<template>
  <div class="stack">
    <BindingDemo />
    <EventObjectDemo />
    <PropagationDemo />
    <DefaultActionDemo />
    <ModifiersDemo />
    <PassiveWheelDemo />
  </div>
</template>
