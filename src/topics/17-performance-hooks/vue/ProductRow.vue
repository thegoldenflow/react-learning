<script setup lang="ts">
/**
 * 列表行组件——注意：这里没有任何 memo 包装。
 * Vue 是组件级精准更新：父组件重渲染时，props 没变的子组件根本不会更新，框架默认行为（自动挡）。
 * React 版的 ProductRow 必须 memo(...) 包裹 + 父组件 useCallback 稳定回调才能达到同样效果（手动挡）。
 *
 * 用两个计数亲眼验证（对应 React 版 ProductRow 里的 console.count）：
 * - 「创建次数」只在行组件首次创建时打印（setup 只执行一次；筛选后新出现的行也会打印）；
 * - 「更新次数」只在本行 props 真正变化时打印——点「选中」只 +2（新选中的行 + 取消选中的行），
 *   点「触发无关重渲染」一次都不 +。
 * （React 版还有一条 StrictMode 注意：开发期组件函数每次渲染跑两遍、控制台数字约翻倍；
 * Vue 没有这个机制，这里的数字就是真实更新次数。）
 */
import { onUpdated } from 'vue'
import type { Product } from '@/shared/types'

defineProps<{
  product: Product
  selected: boolean
}>()

// React 版这里是 onSelect 回调 prop；Vue 用 defineEmits 声明自定义事件。
// 关键差异：父组件传给本组件的事件处理函数不需要引用稳定——Vue 不靠引用相等决定更不更新，
// 编译器还会自动缓存内联处理函数（相当于自动 useCallback）。
const emit = defineEmits<{ select: [id: string] }>()

console.count('[17-Vue] ProductRow 创建次数')
onUpdated(() => console.count('[17-Vue] ProductRow 更新次数'))
</script>

<template>
  <tr :style="selected ? { outline: '2px solid #3b82f6' } : undefined">
    <td>{{ product.name }}</td>
    <td>{{ product.category }}</td>
    <td>￥{{ product.price.toFixed(2) }}</td>
    <td>{{ product.stock }}</td>
    <td>
      <button @click="emit('select', product.id)">
        {{ selected ? '取消选中' : '选中' }}
      </button>
    </td>
  </tr>
</template>
