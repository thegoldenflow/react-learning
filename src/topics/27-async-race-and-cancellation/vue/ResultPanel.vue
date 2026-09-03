<script setup lang="ts">
/**
 * 纯展示组件（对照 React 侧 Example.tsx 里的 ResultPanel 函数组件）。
 *
 * 不拥有任何 state：状态、日志都由 Example.vue 里的三个 watch 各自维护，这里只负责画。
 * 五种 UI 一一对应：idle / loading / error（带重试）/ success 且为空 / success 有数据；
 * 注意 empty 不是 error：请求成功、数据恰好为空，文案是引导换关键词而不是报错重试（11 题）。
 * success 时核对 forKeyword 与当前 keyword，不一致就红字标出「列表来自哪个请求」—— 本题的「检测仪」，
 * 面板一会亮红，面板二、三永远不会。
 * 「重试」「清空日志」通过 emit 通知父组件（React 侧是 onRetry / onClearLog 两个 callback props，08 题）。
 */
import type { PanelState } from './panelTypes'

defineProps<{
  title: string
  /** 告诉学习者在这个面板里该看什么 */
  hint: string
  /** 当前关键词：用来核对 success 结果有没有过期 */
  keyword: string
  state: PanelState
  /** 时间线日志：→ 发出、← 返回、✂ 取消 */
  lines: string[]
}>()

const emit = defineEmits<{
  retry: []
  clearLog: []
}>()
</script>

<template>
  <div class="card stack">
    <h3>{{ title }}</h3>
    <p class="muted">
      {{ hint }}
    </p>

    <p
      v-if="state.status === 'idle'"
      class="muted"
    >
      空闲 —— 关键词为空时不发请求
    </p>
    <p
      v-if="state.status === 'loading'"
      class="muted"
    >
      加载中…
    </p>

    <div
      v-if="state.status === 'error'"
      class="row"
    >
      <!-- v-if 收窄到 error 分支后 TS 保证 state.message 存在；重试按钮只在这里出现 -->
      <span class="error-text">{{ state.message }}</span>
      <button
        class="btn-primary"
        @click="emit('retry')"
      >
        重试
      </button>
    </div>

    <template v-if="state.status === 'success'">
      <p
        v-if="state.forKeyword === keyword"
        class="success-text"
      >
        列表来自请求「{{ state.forKeyword }}」，与当前关键词一致
      </p>
      <p
        v-else
        class="error-text"
      >
        当前关键词「{{ keyword }}」／ 列表来自请求「{{ state.forKeyword }}」—— 过期响应覆盖了正确结果
      </p>
      <p
        v-if="state.users.length === 0"
        class="muted"
      >
        没有找到与「{{ state.forKeyword }}」匹配的用户，换个关键词试试
      </p>
      <ul v-else>
        <li
          v-for="u in state.users"
          :key="u.id"
        >
          {{ u.name }}（{{ u.email }}）<span class="badge">{{ u.role }}</span>
        </li>
      </ul>
    </template>

    <div class="row">
      <span class="muted">时间线（→ 发出，← 返回，✂ 取消）</span>
      <button
        class="btn-ghost"
        @click="emit('clearLog')"
      >
        清空日志
      </button>
    </div>
    <!-- 只追加、从不重排的列表用 index 当 key 可以接受（06 题规则的例外） -->
    <ul class="log">
      <li
        v-if="lines.length === 0"
        class="log-empty"
      >
        （还没有日志 —— 在上方输入关键词，或点「自动演示」）
      </li>
      <li
        v-for="(line, index) in lines"
        :key="index"
      >
        {{ line }}
      </li>
    </ul>
  </div>
</template>
