<script setup lang="ts">
/**
 * 子组件 ProductItem（对照 React 版：React 的 ProductItem 与父组件同在一个 .tsx 文件里，
 * 因为组件只是函数；Vue 的 SFC 一文件一组件，只能拆成这个单独的 .vue 文件）。
 */
import { ref } from 'vue'
import type { Product } from '@/shared/types'

// Vue 把「数据」和「事件」分成 defineProps / defineEmits 两套 API 声明；
// React 里两者都是普通 props，写在同一个 interface 里（onDelete 就是一个函数类型的字段）
const props = defineProps<{ product: Product }>()

// defineEmits：类型化声明本组件会抛出的自定义事件。
// React 完全没有对应物——所谓「事件」只是父组件传下来的回调函数被直接调用，没有一一对应关系
const emit = defineEmits<{
  delete: [id: string]
  rename: [id: string, newName: string]
}>()

// 行内编辑是子组件自己的「局部 UI 状态」，父组件不关心（与 React 版一致，放在子组件）
const editing = ref(false)
// 注意：ref 的初始值也只取一次，之后 props 变了它不会自动同步（和 useState 同理），
// 所以每次进入编辑（startEdit）都要手动重置为最新的 props 值
const draftName = ref(props.product.name)

function startEdit() {
  draftName.value = props.product.name
  editing.value = true
}

function confirmRename() {
  const name = draftName.value.trim()
  if (name !== '' && name !== props.product.name) {
    // 子组件绝不直接写 props.product.name = name——虽然 Vue 的响应式会穿透、改了真会生效，
    // 但那是破坏单向数据流的错误做法；正确姿势是把「改名意图 + 数据」抛给父组件。
    // React 里这一步是直接调用回调 onRename(product.id, name)，纯函数调用、没有事件机制
    emit('rename', props.product.id, name)
  }
  editing.value = false
}
</script>

<template>
  <div class="card">
    <div class="row">
      <template v-if="editing">
        <input v-model="draftName">
        <button
          class="btn-primary"
          @click="confirmRename"
        >
          确认
        </button>
        <button @click="editing = false">
          取消
        </button>
      </template>
      <template v-else>
        <strong>{{ product.name }}</strong>
        <span class="muted">
          ￥{{ product.price }} · {{ product.category }} · 库存 {{ product.stock }}
        </span>
        <button @click="startEdit">
          编辑
        </button>
        <!-- 删除同理：只上报 id，具体怎么删完全是父组件的事 -->
        <button
          class="btn-danger"
          @click="emit('delete', product.id)"
        >
          删除
        </button>
      </template>
    </div>
  </div>
</template>
