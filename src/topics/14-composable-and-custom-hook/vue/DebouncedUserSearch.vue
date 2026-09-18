<script setup lang="ts">
/**
 * 防抖搜索（对照 React 版 react/DebouncedSearchDemo.tsx 里的 DebouncedUserSearch）。
 * 请求只跟着防抖后的值走；请求态和 React 版一样用「结果属于哪个关键词」派生（11 题的做法）。
 */
import { computed, onWatcherCleanup, ref, watch } from 'vue'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'
import { useDebouncedValue } from './useDebouncedValue'

const props = withDefaults(defineProps<{ debounceMs?: number; delayMs?: number }>(), { debounceMs: 500, delayMs: 400 })

type Result =
  | { forKeyword: string; kind: 'success'; users: User[] }
  | { forKeyword: string; kind: 'error'; message: string }

const keyword = ref('')
// 传 ref 进去；也可以传 getter（() => props.q）
const debouncedKeyword = useDebouncedValue(keyword, props.debounceMs)
const result = ref<Result | null>(null)
const requests = ref<string[]>([])

const waiting = computed(() => keyword.value !== debouncedKeyword.value)
const loading = computed(() => result.value === null || result.value.forKeyword !== debouncedKeyword.value)

// watch 的源是 debouncedKeyword（不是 keyword）：防抖与请求解耦。
// 取消用 onWatcherCleanup：关键词再变时、组件卸载时 watcher 停止时都会 abort 上一次请求 ——
// 不需要把 controller 提到 setup 作用域再补一个 onUnmounted（watcher 停止时清理函数也会执行）。
watch(
  debouncedKeyword,
  (kw) => {
    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort())
    requests.value.push(`请求：「${kw}」`)
    fetchUsers(kw, { signal: controller.signal, delayMs: props.delayMs })
      .then((users) => {
        result.value = { forKeyword: kw, kind: 'success', users }
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return // 被取消不是失败
        result.value = { forKeyword: kw, kind: 'error', message: err instanceof Error ? err.message : '未知错误' }
      })
  },
  { immediate: true }, // React 的 effect 首次渲染后必然跑一次；Vue 的 watch 默认懒执行，要显式 immediate
)
</script>

<template>
  <div class="stack">
    <input
      v-model="keyword"
      aria-label="防抖搜索关键词"
      placeholder="搜索姓名或邮箱，如「张」或 example"
    >
    <p>
      当前输入：<strong>{{ keyword || '（空）' }}</strong>
      <span
        v-if="waiting"
        class="badge badge-pending"
      >等待防抖…</span>
      · 防抖后的关键词：<strong>{{ debouncedKeyword || '（空）' }}</strong>
    </p>
    <p
      class="muted"
      aria-label="请求次数"
    >
      一共发了 {{ requests.length }} 次请求：{{ requests.join('、') }}
    </p>
    <p
      v-if="loading"
      class="muted"
    >
      加载中…
    </p>
    <p
      v-if="!loading && result?.kind === 'error'"
      class="error-text"
      role="alert"
    >
      {{ result.message }}
    </p>
    <p
      v-if="!loading && result?.kind === 'success' && result.users.length === 0"
      class="muted"
    >
      没有匹配的用户
    </p>
    <ul
      v-if="result?.kind === 'success'"
      :style="{ opacity: loading ? 0.5 : 1 }"
    >
      <li
        v-for="u in result.users"
        :key="u.id"
      >
        {{ u.name }}（{{ u.email }}）<span class="badge">{{ u.role }}</span>
      </li>
    </ul>
  </div>
</template>
