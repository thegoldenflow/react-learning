<script setup lang="ts">
/**
 * 区块四：多根组件的透传。React 没有对应的问题（React 从来不自动透传，Fragment 包几个节点都一样要自己展开 rest）。
 * - 多根组件不自动透传：attrs 页「components with multiple root nodes do not have an automatic attribute fallthrough behavior.
 *   If $attrs are not bound explicitly, a runtime warning will be issued.」没绑的话属性直接丢掉，开发环境警告
 *   「Extraneous non-props attributes (…) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.」（测试覆盖）。
 * - 本组件有三个根节点（label、input、提示文字），显式把 $attrs 绑到 <input> 上：父组件传的 placeholder、maxlength、class 都落在输入框上。
 *   class 也在 $attrs 里，想让它落在别的根上就写 :class="$attrs.class"（01 题提到过）。
 * - 顺序：v-bind="$attrs" 写在 :id 前面，id 由组件说了算（后写的覆盖先写的）；反过来的话父组件传一个 id 就会盖掉 useId 生成的，<label for> 就对不上了。
 */
import { useId } from 'vue'

const { label, hint = '' } = defineProps<{ label: string; hint?: string }>()
// useId【主流·3.5 起】（07 题）
const id = useId()
</script>

<template>
  <label :for="id">{{ label }}</label>
  <input
    v-bind="$attrs"
    :id="id"
  >
  <span
    v-if="hint"
    class="muted"
  >{{ hint }}</span>
</template>
