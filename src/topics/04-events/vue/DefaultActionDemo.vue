<script setup lang="ts">
/**
 * 区块四：默认行为。对照 react/DefaultActionDemo.tsx。
 * - @click.prevent / @submit.prevent / @click.stop / @click.self：修饰符由编译器包成守卫函数（withModifiers，runtime-dom.cjs.js:1818-1843），按书写顺序执行 ——
 *   所以「Order matters」：@click.prevent.self 会阻止元素本身和子元素的默认动作，@click.self.prevent 只阻止元素本身的。
 * - @submit.prevent 写在 <form> 上（和 React 一样，不要靠提交按钮的 click）：回车时浏览器会先对提交按钮派发 click，所以按钮的 @click 不会漏，但它跑在浏览器的必填 / 格式校验之前，
 *   requestSubmit() 这类不经过按钮的提交也管不到（react/Example.tsx 二-6，React 侧测试覆盖）。
 * - .stop 只停传播、不管默认动作：勾选框照样勾上（测试覆盖）。
 */
import { ref } from 'vue'

const bubbled = ref(0)
const message = ref('')
const selfClicks = ref(0)

function handleLinkClick(e: MouseEvent) {
  message.value = `拦截了跳转（event.defaultPrevented = ${e.defaultPrevented}），事件照样冒泡到外层`
}

function handleSubmit(e: SubmitEvent) {
  const keyword = new FormData(e.currentTarget as HTMLFormElement).get('keyword')
  message.value = `拦截了表单提交，关键字：${String(keyword)}（没有整页刷新）`
}
</script>

<template>
  <div class="card stack">
    <h3>区块四：默认行为 —— .prevent、.stop、.self</h3>
    <!-- 演示简化：外层 div 的 @click 只用来数冒泡；可点击的东西真实项目里用 button 或补 role、tabindex 和键盘处理（35 题，待新增） -->
    <div
      class="stack"
      @click="bubbled++"
    >
      <p
        class="muted"
        data-testid="bubbled"
      >
        外层收到的冒泡点击：{{ bubbled }} 次
      </p>
      <div class="row">
        <a
          href="https://example.com/invoice"
          @click.prevent="handleLinkClick"
        >查看发票（.prevent）</a>
        <label class="row">
          <input
            type="checkbox"
            @click.stop="message = '.stop：外层计数不变，勾选框照样勾上了'"
          >
          只 .stop 的勾选框
        </label>
      </div>
      <form
        class="row"
        @submit.prevent="handleSubmit"
      >
        <input
          name="keyword"
          value="键盘"
          aria-label="搜索关键字"
        >
        <button type="submit">
          搜索（@submit.prevent）
        </button>
      </form>
    </div>
    <p
      v-if="message !== ''"
      class="success-text"
      data-testid="default-message"
    >
      {{ message }}
    </p>
    <!-- 演示简化：可点击的 div 只用来演示 .self -->
    <div
      class="card"
      data-testid="self-area"
      @click.self="selfClicks++"
    >
      点这块空白处计数（.self）；<button>点这个按钮不算</button>
      <span class="muted"> · 已计数 {{ selfClicks }} 次</span>
    </div>
  </div>
</template>
