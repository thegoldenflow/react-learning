<script setup lang="ts">
/**
 * 区块三：换 :key = 换一个实例，内部状态重置。对照 react/KeyResetDemo.tsx。
 * - :key 变了：卸载旧实例（onUnmounted）、创建新实例（setup 重跑、ref 初始值重新算）。
 *   API 页：「It can also be used to force replacement of an element/component instead of reusing it.」
 *   这里的 :key 不在任何 v-for 里 —— key 不是列表专用的，「列表里对上号」和「强制换实例」是同一个机制。
 *   Vue 项目里常见的 <router-view :key="$route.fullPath"> 也是这个手法（同一条路由的组件实例会被复用，18 题）。
 * - Vue 里 prop 变了要重置内部状态，换 :key 和 watch 手动重置两种都常见（工程经验）：:key 一步到位、整棵子树重来；
 *   watch 可以只重置一部分、DOM 不重建（测试覆盖），但每个要重置的 ref 都要自己写（WatchNoteEditor.vue）。
 * - 别滥用 :key：一变整棵子树重建，滚动位置、焦点、子组件里的请求都会重来。
 */
import { computed, ref } from 'vue'
import { INITIAL_ORDERS } from './demoData'
import OrderNoteEditor from './OrderNoteEditor.vue'
import WatchNoteEditor from './WatchNoteEditor.vue'

const selectedId = ref(INITIAL_ORDERS[0].id)
// 选中的订单由 id 算出来，不另存一份（03 题区块五、09 题）
const selectedOrder = computed(() => INITIAL_ORDERS.find((o) => o.id === selectedId.value) ?? INITIAL_ORDERS[0])
</script>

<template>
  <div class="card stack">
    <h3>区块三：换 :key = 换一个实例，内部状态重置</h3>
    <p class="muted">
      在三个草稿框里都改点内容，再切换订单：第一个还是上一个订单的草稿，另外两个重新初始化。
    </p>
    <p class="muted">
      prop 变了、组件内部状态要从头来：Vue 里换 :key 和 watch 手动重置两种都常见。
    </p>
    <div class="row">
      <button
        v-for="o in INITIAL_ORDERS"
        :key="o.id"
        :class="{ 'btn-primary': o.id === selectedId }"
        @click="selectedId = o.id"
      >
        {{ o.orderNo }}
      </button>
    </div>
    <div
      class="row"
      style="align-items: stretch"
    >
      <div
        class="card stack"
        style="flex: 1 1 220px"
        data-testid="without-key"
      >
        <strong class="error-text">❌ 不换 :key：同一位置、同一组件 → 复用实例，状态残留</strong>
        <code>&lt;OrderNoteEditor :order="selectedOrder" /&gt;</code>
        <OrderNoteEditor :order="selectedOrder" />
      </div>
      <div
        class="card stack"
        style="flex: 1 1 220px"
        data-testid="with-key"
      >
        <strong class="success-text">✅ 换 :key：卸载旧实例、创建新实例</strong>
        <code>&lt;OrderNoteEditor :key="selectedOrder.id" :order="selectedOrder" /&gt;</code>
        <OrderNoteEditor
          :key="selectedOrder.id"
          :order="selectedOrder"
        />
      </div>
      <div
        class="card stack"
        style="flex: 1 1 220px"
        data-testid="with-watch"
      >
        <strong class="success-text">✅ watch 手动重置：实例不换，草稿改回初始值</strong>
        <code>watch(() =&gt; props.order.id, () =&gt; { draft.value = … })</code>
        <WatchNoteEditor :order="selectedOrder" />
      </div>
    </div>
    <p class="muted">
      别滥用：key 一变整棵子树都重建 —— 滚动位置、焦点、子组件里的请求都会重来。只在「它确实该变成另一个东西」时用；
      能由 props 算出来的就用 computed，不存（09 题）；父组件也要读它，就提升到父组件（25 题）。
    </p>
  </div>
</template>
