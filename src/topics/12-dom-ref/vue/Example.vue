<script setup lang="ts">
/**
 * 学习主题：DOM ref 与跨渲染可变值 —— useRef 的两种用途
 *
 * React 核心概念：
 * - 用途一：useRef<HTMLInputElement>(null) + <input ref={inputRef}> 获取真实 DOM 节点，命令式调用 focus() 等
 * - 用途二：跨渲染保存任意可变值 —— 改 .current 不触发重渲染，但值一直存活
 * - React 完全不追踪 ref：useRef 返回的只是一个每次渲染都相同的普通对象 { current: T }，改它 React 毫不知情
 * - 选择标准：值的变化需要反映到界面 → useState；只是记录、不影响渲染 → useRef
 *
 * Vue 对应概念：
 * - DOM ref：const inputEl = ref<HTMLInputElement | null>(null) + 模板 ref="inputEl"，挂载后才有值
 * - 「跨渲染保存可变值」：Vue 的 setup 只执行一次，普通变量天然跨渲染存活，不需要专门 API —— 没有一一对应关系
 *
 * 最重要的区别：
 * - 「Vue 的 ref ≠ React 的 useRef」：同名不同概念。Vue 的 ref 是响应式的，改 .value 视图立即更新；
 *   React 的 useRef 完全不被追踪，改 .current 界面纹丝不动 —— 它真正对应的是 Vue setup 里的普通变量/普通对象。
 * - 根源：React 组件函数每次渲染整个重跑，函数内的普通变量每次都被重置，所以需要 useRef 这个
 *   「跨渲染的盒子」；Vue 没有这个问题。因此「state 还是 ref」这道选择题是 React 特有的，也是面试高频题。
 */
import { ref } from 'vue'

// ============ DOM ref ============
// 变量名与模板里 ref="inputEl" 的字符串同名即可自动关联（React 是直接把 ref 对象传给 JSX 属性）。
// 挂载前 .value 是 null，与 React 的 .current 一致。（Vue 3.5 另有 useTemplateRef('inputEl') 新写法，语义相同。）
const inputEl = ref<HTMLInputElement | null>(null)

const keyword = ref('')
const submitted = ref('')

// React 版这里必须用 useRef（「上一次搜索词」不该自己触发渲染，普通变量又活不过一次渲染）；
// Vue 不用做这个选择：全部用响应式 ref 即可。「state 还是 ref」这道选择题是 React 特有的，
// 没有一一对应关系。
// （React 版还注释了「渲染期读 ref 需谨慎」；lastKeyword 在这里是响应式的，不存在那个问题。）
const lastKeyword = ref('')

// ============ 小实验 ============
// reactiveCount：Vue 的 ref 是响应式的，改 .value 视图立即更新 —— 行为上对应 React 的 setState。
const reactiveCount = ref(0)
// countBox 才是 React useRef 的真正对应物：一个 Vue 不追踪的普通对象（没用 ref/reactive 包装）。
// React 的 useRef 返回的正是这样一个 { current } 盒子。setup 只跑一次，普通对象天然跨渲染存活；
// 改 countBox.current 视图不更新 —— 直到某个响应式数据触发了重渲染，才「顺便」显示出新值。
const countBox = { current: 0 }

function handleFocus() {
  // React 里这一步是 inputRef.current?.focus() —— 两边同样要判空（挂载前拿不到节点）
  inputEl.value?.focus()
}

function handleSearch() {
  // React 里这一步是「写 ref + setState」两个不同性质的动作；Vue 里两行都是普通的响应式赋值
  lastKeyword.value = submitted.value
  submitted.value = keyword.value
}
</script>

<template>
  <div class="stack">
    <div class="card">
      <h3>搜索框</h3>
      <div class="row">
        <!-- ref="inputEl" 对应 React 的 ref={inputRef}；v-model 对应受控的 value + onChange -->
        <input
          ref="inputEl"
          v-model="keyword"
          placeholder="输入搜索词"
        >
        <button @click="handleFocus">
          聚焦输入框
        </button>
        <button
          class="btn-primary"
          @click="handleSearch"
        >
          搜索
        </button>
      </div>
      <p>
        本次搜索：<strong>{{ submitted || '（还没搜过）' }}</strong>，上一次搜索：
        <strong>{{ lastKeyword || '（无）' }}</strong>
      </p>
    </div>

    <div class="card">
      <h3>小实验：普通对象 vs 响应式 ref</h3>
      <p>
        countBox.current = <strong>{{ countBox.current }}</strong>，reactiveCount =
        <strong>{{ reactiveCount }}</strong>
      </p>
      <div class="row">
        <!-- 改普通对象：值确实变了，但 Vue 不追踪它，视图不更新 —— 这正是 React 里改 ref.current 的手感 -->
        <button @click="countBox.current++">
          countBox.current + 1（界面不动）
        </button>
        <!-- 改响应式 ref 触发重渲染，countBox 攒下的值也被「顺便」显示出来 —— 对应 React 的 setState 按钮 -->
        <button @click="reactiveCount++">
          reactiveCount + 1（触发更新）
        </button>
      </div>
      <p class="muted">
        先连点几次左边按钮 —— 界面没反应；再点一次右边按钮，countBox 攒下的值才一次性显示出来。
        注意对比：Vue 的 ref 是响应式的，永远不会给你「改了不更新」的体验 —— 与 React 的 useRef 同名不同物。
      </p>
    </div>
  </div>
</template>
