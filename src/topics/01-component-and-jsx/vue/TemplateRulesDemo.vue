<script setup lang="ts">
/**
 * 区块二 Vue 对照：模板编译成什么 · 几条规则。对照 react/JsxRulesDemo.tsx。
 *
 * Vue 的模板同样要编译：SFC 里的 <template> 由 @vitejs/plugin-vue 调用 @vue/compiler-sfc 变成渲染函数（下面是 compileTemplate 3.5.42 的实际输出，只保留关键部分）。
 * 和 JSX 编译结果的区别：Vue 编译器给动态节点打补丁标记（下面 strong 的 1 表示 TEXT，只有文本会变），用 block 收集动态后代（tree flattening），
 * 把静态的 props 提升成常量（_hoisted_1）、把静态节点缓存起来（span 的 -1 表示 CACHED，更新时直接复用），所以更新时只遍历、比对动态部分。
 * JSX 编译结果没有这层信息：React 重新执行这个组件（以及默认连带的子组件），比较它们新旧两棵元素树（React 的编译期优化是 React Compiler，17 题改写时补）。
 */
import { ref, useTemplateRef } from 'vue'

const TEMPLATE = `<div class="card">
  <strong>{{ name }}</strong>
  <span class="badge">VIP</span>
</div>`

const RENDER = `import { toDisplayString as _toDisplayString, createElementVNode as _createElementVNode,
  openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

const _hoisted_1 = { class: "card" }

export function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("strong", null, _toDisplayString(_ctx.name), 1 /* TEXT */),
    _cache[0] || (_cache[0] = _createElementVNode("span", { class: "badge" }, "VIP", -1 /* CACHED */))
  ]))
}`

// 同一组数字交给 :style：Vue 不补单位，width: 48 这类值在 jsdom 和 Chrome（标准模式）里都被当成无效值丢掉
const NUMERIC_STYLE = { width: 48, borderWidth: 2, padding: 0, lineHeight: 1.5, opacity: 0.5, zIndex: 3, fontWeight: 700, flexGrow: 2 }
const probe = useTemplateRef<HTMLDivElement>('probe')
const renderedStyle = ref<string | null>(null)

const TERMS = [
  { term: 'SFC', desc: '单文件组件，<template> + <script> + <style>' },
  { term: 'v-for', desc: '列表渲染；放在 <template> 上可以一次渲染多个节点' },
]
</script>

<template>
  <div class="card stack">
    <h3>区块二：模板编译成什么 · 几条规则</h3>
    <div
      class="row"
      style="align-items: stretch; flex-wrap: wrap"
    >
      <div
        class="stack"
        style="flex: 1 1 260px; min-width: 0"
      >
        <strong>源码（模板）</strong>
        <pre
          class="source-view"
          style="margin: 0; overflow-x: auto"
        >{{ TEMPLATE }}</pre>
      </div>
      <div
        class="stack"
        style="flex: 1 1 260px; min-width: 0"
      >
        <strong>编译后的渲染函数</strong>
        <pre
          class="source-view"
          style="margin: 0; overflow-x: auto"
        >{{ RENDER }}</pre>
      </div>
    </div>

    <div class="stack">
      <strong>:style 里的数字：Vue 不补 px</strong>
      <div
        ref="probe"
        :style="NUMERIC_STYLE"
        hidden
      />
      <div class="row">
        <code>{{ JSON.stringify(NUMERIC_STYLE) }}</code>
        <button @click="renderedStyle = probe?.getAttribute('style') ?? ''">
          读出渲染后的 style 属性
        </button>
      </div>
      <p aria-label="渲染后的 style">
        {{ renderedStyle ?? '（点按钮读取）' }}
      </p>
    </div>

    <div class="stack">
      <strong>一次渲染多个节点：&lt;template v-for&gt;，key 写在 &lt;template&gt; 上</strong>
      <dl>
        <template
          v-for="t in TERMS"
          :key="t.term"
        >
          <dt>{{ t.term }}</dt>
          <dd>{{ t.desc }}</dd>
        </template>
      </dl>
    </div>
  </div>
</template>
