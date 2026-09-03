<script setup lang="ts">
/**
 * 搜索框（对照 React 侧 Example.tsx 里的 SearchBar 函数组件）。
 *
 * 归属：本组件【不拥有】keyword。它没有自己的 ref，只是把父组件的值显示出来、把用户的输入上报回去。
 *
 * defineModel<string>()（Vue 3.4+ 的编译器宏）脱糖为一个 modelValue prop + 一个 update:modelValue 事件：
 * 父组件写 <SearchBar v-model="keyword" /> 就等于 :model-value="keyword" @update:model-value="keyword = $event"。
 * 也就是说 v-model 只是「props 向下 + emit 向上」的语法糖，state 仍归父组件所有 ——
 * 这正是 React 侧 value + onChange 一对 props 的语法糖版本（React 没有糖，只能写两个 props）。
 * { required: true } 让类型是 string 而不是 string | undefined：父组件必须传 v-model。
 */
const model = defineModel<string>({ required: true })

/**
 * 「清空」看起来像直接改本地变量，实际是 emit('update:modelValue', '') —— 改的还是父组件那份 keyword。
 * React 侧同一个按钮写的是 onClick={() => onChange('')}，本质相同：本组件自始至终没有一份自己的 state。
 */
function clear() {
  model.value = ''
}
</script>

<template>
  <div class="row">
    <label class="row">
      <span>搜索：</span>
      <!-- 输入框 v-model 绑到 defineModel 返回的 ref：每次输入都会 emit 到父组件，父组件改了再传回来 -->
      <input
        v-model="model"
        placeholder="商品名，如「显示器」「键盘」"
      >
    </label>
    <button
      class="btn-ghost"
      :disabled="model === ''"
      @click="clear"
    >
      清空
    </button>
  </div>
</template>
