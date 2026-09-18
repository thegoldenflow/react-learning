<script setup lang="ts">
/**
 * 区块一的子组件：对照 react/BindingDemo.tsx 的 OrderRow（React 用 onRemove 回调 prop，Vue 用 emit）。
 * 组件事件不冒泡：「Unlike native DOM events, component emitted events do not bubble.」只有直接父组件能监听到（测试覆盖）。
 */
import type { OrderItem } from '@/shared/types'

defineProps<{ item: OrderItem }>()
// 具名元组写法【主流·3.3 起】：事件名 remove，父组件监听写 @remove
const emit = defineEmits<{ remove: [id: string, onlyOne: boolean] }>()
</script>

<template>
  <li
    class="row"
    :data-testid="`row-${item.id}`"
  >
    <span>{{ item.name }} × {{ item.quantity }}</span>
    <!-- 内联处理器里用 $event 拿原生事件：对应 React 的 (e) => onRemove(item.id, e.shiftKey) -->
    <button
      class="btn-danger"
      @click="emit('remove', item.id, $event.shiftKey)"
    >
      删除（按住 Shift 只减一件）
    </button>
  </li>
</template>
