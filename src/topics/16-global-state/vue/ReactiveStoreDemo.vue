<script setup lang="ts">
/**
 * 区块三 Vue 对照：Vue 内置的最小方案 —— 模块级 reactive（reactiveCart.ts）。
 * 对照 react/ContextReducerCart.tsx：同样勾选「礼品包装」，这里的件数徽标不会重新渲染，因为它的渲染函数没读 giftWrap。
 * 子组件用 defineComponent + h 写在本文件里，只为了把三个很小的组件放在一处对照阅读。
 */
/* eslint-disable vue/one-component-per-file -- 三个几行的小组件放在一起对照阅读，拆文件反而分散 */
import { defineComponent, h } from 'vue'
import { DEMO_PRODUCTS } from './products'
import { reactiveCart } from './reactiveCart'
import RenderCountsPanel from './RenderCountsPanel.vue'
import { createRenderCounts, provideRenderCounts, useRenderCount } from './renderCounts'

const counts = createRenderCounts()
provideRenderCounts(counts)

const AddButtons = defineComponent({
  name: 'ReactiveAddButtons',
  setup() {
    useRenderCount('ReactiveAddButtons')
    return () =>
      h(
        'div',
        { class: 'row' },
        DEMO_PRODUCTS.slice(0, 2).map((p) =>
          h('button', { key: p.id, class: 'btn-primary', onClick: () => reactiveCart.add(p) }, `加入「${p.name}」`),
        ),
      )
  },
})

const CountBadge = defineComponent({
  name: 'ReactiveCountBadge',
  setup() {
    useRenderCount('ReactiveCountBadge')
    return () =>
      h('span', { class: 'badge' }, `件数：${reactiveCart.items.reduce((sum, it) => sum + it.quantity, 0)}`)
  },
})

const GiftWrap = defineComponent({
  name: 'ReactiveGiftWrap',
  setup() {
    useRenderCount('ReactiveGiftWrap')
    return () =>
      h('label', { class: 'row' }, [
        h('input', { type: 'checkbox', checked: reactiveCart.giftWrap, onChange: () => reactiveCart.toggleGiftWrap() }),
        '礼品包装',
      ])
  },
})

const entries: Array<[string, string]> = [
  ['ReactiveAddButtons', '商品按钮'],
  ['ReactiveCountBadge', '件数'],
  ['ReactiveGiftWrap', '礼品包装'],
]
</script>

<template>
  <div class="card stack">
    <h3>区块三：模块级 reactive（Vue 内置的最小方案，对照 Context + useReducer）</h3>
    <p class="muted">
      勾选「礼品包装」：件数徽标不动（它没读 giftWrap）。对照 React 侧的 Context 版本：memo 包着的件数徽标照样重渲染。
      这个对象是模块级单例：离开本题再回来，内容还在（没有持久化，刷新页面才清空）。
    </p>
    <AddButtons />
    <div class="row">
      <CountBadge />
      <GiftWrap />
      <button @click="reactiveCart.reset()">
        清空
      </button>
    </div>
    <p class="muted">
      {{ reactiveCart.items.length === 0 ? '（空）' : reactiveCart.items.map((it) => `${it.name} × ${it.quantity}`).join('、') }}
    </p>
    <RenderCountsPanel
      :counts="counts"
      :entries="entries"
      label="区块三渲染次数"
    />
  </div>
</template>
