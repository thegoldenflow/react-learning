<script setup lang="ts">
/**
 * 区块三：Vue 模板里的 v-if / v-else 两个分支切换时销毁重建（前提：没包 <KeepAlive>）。对照 react/PositionDemo.tsx（React 的三元两边是同一个组件时 state 会保留）。
 * - 原因在模板编译器：v-if / v-else 的每个分支都被注入了不同的 key（key: 0、key: 1，@vue/compiler-core 3.5.42 compiler-core.cjs.js:4702-4732 按分支序号算 key、
 *   4837-4883 生成 key 属性并注入 vnode），
 *   所以哪怕两边是同一个组件，切换时也是换了一个实例 —— 对应 API 文档「the element and its contained directives / components are destroyed and re-constructed」（测试覆盖）。
 * - 不是 Vue 框架「不复用」：用渲染函数写三元（ok ? h(DraftEditor, …) : h(DraftEditor, …)）没有编译器注入的 key，两边同一个组件时和 React 一样复用实例（Example.test.ts 覆盖）。
 * - 想要 React 那种「同一个实例、只换 props」：只写一个组件，把变化的部分做成 prop（第二行），这时草稿会留下来 —— 正是 React 那个 bug 的 Vue 版本；
 *   想强制换实例就绑 :key（第三行），和 React 的 key 一样（「force replacement of an element/component instead of reusing it」）。
 */
import { computed, ref } from 'vue'
import DraftEditor from './DraftEditor.vue'

const isTaylor = ref(true)
const customer = computed(() => (isTaylor.value ? 'Taylor' : 'Sarah'))
</script>

<template>
  <div class="card stack">
    <h3>区块三：模板里的 v-if / v-else 切换时换一个实例</h3>
    <p class="muted">
      在三行里各输入一点备注，再点「切换客户」，看哪一行的草稿跟着留下来了。
    </p>
    <div class="row">
      <button @click="isTaylor = !isTaylor">
        切换客户（当前：{{ customer }}）
      </button>
    </div>
    <div data-testid="v-if-else">
      <p class="muted">
        ① v-if / v-else，两边都是 &lt;DraftEditor&gt;
      </p>
      <DraftEditor
        v-if="isTaylor"
        customer="Taylor"
      />
      <DraftEditor
        v-else
        customer="Sarah"
      />
    </div>
    <div data-testid="same-instance">
      <p class="muted">
        ② 只写一个 &lt;DraftEditor&gt;，客户名做成 prop
      </p>
      <DraftEditor :customer="customer" />
    </div>
    <div data-testid="with-key">
      <p class="muted">
        ③ 只写一个 &lt;DraftEditor&gt;，再绑 :key
      </p>
      <DraftEditor
        :key="customer"
        :customer="customer"
      />
    </div>
  </div>
</template>
