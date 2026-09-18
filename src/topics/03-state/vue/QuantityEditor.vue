<script setup lang="ts">
/**
 * 区块六：多个状态互相牵制 —— React 用 useReducer，Vue 直接改。对照 react/QuantityEditor.tsx 与 react/quantityReducer.ts。
 *
 * Vue 没有 useReducer 的内置对应物：日常写法是一个 reactive 对象 + 几个直接改它的函数（下面每个函数对应 reducer 的一个 case）；
 * 逻辑复杂或要跨组件时，抽成 composable（14 题）或 Pinia 的 action（16 题）。
 * 「别让修改散落在各个事件处理函数里」是和框架无关的组织方式（react.dev 给 reducer 的理由就是「many state updates spread across many event handlers」）：
 * React 用 useReducer 来做（纯函数 + 只暴露 dispatch）；Vue 的惯用写法是把修改集中到 composable 的函数或 Pinia action 里。Vue 可以原地改，所以不需要 reducer 这种
 * 「返回新对象」的形式；想用也能用（29 题 Vue 侧的 apply(items, action)），只是不是惯用法。
 * Pinia action 和 reducer 也不是一回事：action 直接改 store、可以是异步的；reducer 是同步纯函数，只负责算出下一个 state。
 */
import { reactive } from 'vue'

const STOCK_LIMIT = 8

// 四个互相牵制的字段，用一个 reactive 对象装起来，和 React 侧 reducer 管理的 state 对齐
const editor = reactive({
  quantity: 1,
  isEditing: false,
  draft: '',
  error: '',
})

function increment() {
  if (editor.quantity >= STOCK_LIMIT) {
    editor.error = `库存只有 ${STOCK_LIMIT} 件，加不上去了`
    return
  }
  editor.quantity += 1
  editor.error = ''
}

function decrement() {
  if (editor.quantity <= 1) {
    editor.error = '至少 1 件'
    return
  }
  editor.quantity -= 1
  editor.error = ''
}

// 一个动作连带改三个字段：React 侧把它写成 reducer 的一个 case，这里写成一个函数 —— 两边都是把这组修改收在一处
function startEdit() {
  editor.isEditing = true
  editor.draft = String(editor.quantity)
  editor.error = ''
}

function commitEdit() {
  const next = Number(editor.draft)
  if (!Number.isInteger(next) || next < 1) {
    editor.error = '请输入 ≥ 1 的整数'
    return
  }
  if (next > STOCK_LIMIT) {
    editor.error = `库存只有 ${STOCK_LIMIT} 件`
    return
  }
  editor.quantity = next
  editor.isEditing = false
  editor.draft = ''
  editor.error = ''
}

function cancelEdit() {
  editor.isEditing = false
  editor.draft = ''
  editor.error = ''
}

// 不要写成 let editor = reactive({ … }) 再整体换掉：赋值本身不会触发重新渲染（和区块一的普通变量一样，界面停在旧值，等别的原因重渲染才跳过去），
// 而且其它还拿着旧对象的地方（watch、传出去的引用）都跟着失联（Limitations of reactive()：「the reactivity connection to the first reference is lost」）。
// 所以逐个字段改，或者用 Object.assign 一次改几个字段
function resetEditor() {
  Object.assign(editor, { quantity: 1, isEditing: false, draft: '', error: '' })
}
</script>

<template>
  <div class="card stack">
    <h3>区块六：多个状态互相牵制 —— Vue 直接改就行</h3>
    <p class="muted">
      数量 / 是否编辑中 / 输入草稿 / 错误提示 —— React 侧把这四个字段收进了一个 reducer
    </p>
    <div class="row">
      <span class="muted">库存上限 {{ STOCK_LIMIT }} 件</span>
      <template v-if="editor.isEditing">
        <input
          v-model="editor.draft"
          placeholder="输入数量"
          aria-label="数量"
        >
        <button
          class="btn-primary"
          @click="commitEdit"
        >
          确定
        </button>
        <button
          class="btn-ghost"
          @click="cancelEdit"
        >
          取消
        </button>
      </template>
      <template v-else>
        <!-- 和 React 侧一样不做 disabled：边界规则统一由上面那几个函数裁决 -->
        <button @click="decrement">
          -
        </button>
        <strong data-testid="editor-quantity">{{ editor.quantity }} 件</strong>
        <button @click="increment">
          +
        </button>
        <button @click="startEdit">
          直接输入
        </button>
      </template>
      <button
        class="btn-ghost"
        @click="resetEditor"
      >
        重置
      </button>
    </div>
    <p
      v-if="editor.error !== ''"
      class="error-text"
    >
      {{ editor.error }}
    </p>
  </div>
</template>
