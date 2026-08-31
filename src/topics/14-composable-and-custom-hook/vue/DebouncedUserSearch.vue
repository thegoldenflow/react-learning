<script setup lang="ts">
/**
 * DebouncedUserSearch（对照 React 版：React 把这个子组件和根组件写在同一个 Example.tsx 里，
 * 组件只是函数；Vue 一文件一组件，拆成本文件）。
 *
 * 演示第二个 composable：useDebouncedValue —— 输入框每敲一个字都变，
 * 但真正拿去发请求的是「停手 500ms 后」的值，请求次数因此大幅下降。
 * 10 题的搜索是每个字符都发请求（故意不防抖），这里补上防抖那一步。
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'
import { useDebouncedValue } from './useDebouncedValue'

// 输入框绑定的原始值：v-model 每敲一个字符就变
const keyword = ref('')

// composable 的调用姿势与 React 完全一致；区别是这里传进去/拿回来的都是 Ref 容器。
// React 侧还有一条 Vue 没有的约束：useDebouncedValue 必须在组件顶层无条件调用（Hooks 规则）。
const debouncedKeyword = useDebouncedValue(keyword, 500)

const users = ref<User[]>([])
const loading = ref(true)

// 「正在等待防抖」是派生值：React 版是渲染期间算出来的普通 const，
// Vue 的 setup 只跑一次，跨更新的派生值用 computed（09 题）
const waiting = computed(() => keyword.value !== debouncedKeyword.value)

// 与 10 题同款：watch 回调和 onUnmounted 是两个独立函数，controller 要提升到 setup 作用域共享
let controller: AbortController | undefined

// 关键点：watch 的源是 debouncedKeyword（不是 keyword）—— 防抖与请求彻底解耦，
// 「怎么防抖」被 composable 收进去了，这里只管「关键词一变就重新查」。
// AbortController + isAbortError 的写法见 10 题：防抖减少的是请求数量，
// 但只要还可能连发两次，竞态就依然存在，abort 不能省。
watch(
  debouncedKeyword,
  (kw, _prev, onCleanup) => {
    const ctrl = new AbortController()
    controller = ctrl
    onCleanup(() => ctrl.abort())

    loading.value = true
    fetchUsers(kw, { signal: ctrl.signal })
      .then((list) => {
        users.value = list
        loading.value = false
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return // 「被取消」不是失败
        loading.value = false
      })
  },
  { immediate: true }, // React 的 effect 首次渲染后必然跑一次，Vue 要显式加 immediate
)

onUnmounted(() => controller?.abort())
</script>

<template>
  <div class="card">
    <h3>防抖搜索（useDebouncedValue）</h3>
    <p class="muted">
      连续快速输入：「当前输入」立刻变，「防抖后的关键词」要停手 500ms 才跟上 —— 请求只在后者变化时发出
    </p>

    <input
      v-model="keyword"
      placeholder="搜索姓名或邮箱，如「张」或 example"
    >

    <p>
      当前输入：<strong>{{ keyword || '（空）' }}</strong>
      <span
        v-if="waiting"
        class="badge badge-pending"
      >
        等待防抖…
      </span>
    </p>
    <p>
      防抖后的关键词（真正拿去请求的值）：<strong>{{ debouncedKeyword || '（空）' }}</strong>
    </p>

    <p
      v-if="loading"
      class="muted"
    >
      加载中…
    </p>
    <p
      v-if="!loading && users.length === 0"
      class="muted"
    >
      没有匹配的用户
    </p>

    <ul>
      <li
        v-for="u in users"
        :key="u.id"
      >
        {{ u.name }}（{{ u.email }}）<span class="badge">{{ u.role }}</span>
      </li>
    </ul>
  </div>
</template>
