<script setup lang="ts">
/**
 * 区块四：属性透传。对照 react/UiButtonDemo.tsx。
 */
import { ref, useTemplateRef } from 'vue'
import LabeledInput from './LabeledInput.vue'
import UiButton from './UiButton.vue'

const clicks = ref(0)
const focusInfo = ref('（还没移动过焦点）')
// 组件 ref 拿到的是 UiButton 的实例（只能访问 defineExpose 暴露出来的 focus），不是 <button> 节点
const deleteBtn = useTemplateRef<InstanceType<typeof UiButton>>('deleteBtn')

function focusDelete() {
  deleteBtn.value?.focus()
  focusInfo.value = `焦点在：${document.activeElement?.textContent?.trim() ?? '（无）'}`
}
</script>

<template>
  <div class="card stack">
    <h3>区块四：属性透传（fallthrough attributes）与组件 ref</h3>
    <p class="muted">
      UiButton 只声明了 variant / size 两个 prop；下面的 @click / disabled / type / title / aria-label / class / style 都没被 defineProps 接住，
      走的是透传属性（$attrs）。UiButton 关掉了自动透传、用 v-bind="attrs" 手动绑到 &lt;button&gt; 上 —— 这一步相当于 React 的 {...rest}。
    </p>
    <div class="row">
      <UiButton @click="clicks++">
        点我（@click 透传）
      </UiButton>
      <UiButton
        ref="deleteBtn"
        variant="danger"
        title="这行 title 透传到真实 button 上，鼠标悬停可见"
        aria-label="删除订单 SO-20260803"
        @click="clicks++"
      >
        删除
      </UiButton>
      <!-- disabled 没有声明成 prop，所以不做布尔转型：模板里的无值写法原样当成 disabled="" 透传给 <button>，原生 button 照样被禁用 -->
      <UiButton
        disabled
        @click="clicks++"
      >
        已禁用
      </UiButton>
      <UiButton type="submit">
        type 被覆盖为 submit
      </UiButton>
      <UiButton
        size="sm"
        class="btn-ghost"
        :style="{ marginLeft: '8px' }"
      >
        class / style 被合并
      </UiButton>
    </div>
    <div class="row">
      <button @click="focusDelete">
        把焦点移到「删除」按钮（组件 ref + defineExpose）
      </button>
      <span class="muted">{{ focusInfo }}</span>
    </div>
    <p class="muted">
      @click 触发次数：{{ clicks }}（点「已禁用」不会增加）
    </p>

    <div class="stack">
      <p class="muted">
        多根组件：LabeledInput 有 label、input、提示文字三个根节点，Vue 不会自动透传，组件里显式写了 v-bind="$attrs" 绑到 &lt;input&gt; 上。
      </p>
      <div class="row">
        <LabeledInput
          label="收货人"
          hint="最多 10 个字"
          placeholder="例如：林小满"
          maxlength="10"
        />
      </div>
    </div>
  </div>
</template>
