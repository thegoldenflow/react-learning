<script setup lang="ts">
/**
 * 学习主题：API 请求状态建模 —— loading / success / error / empty 与重试
 *
 * React 核心概念：
 * - 工业界标准：用判别联合建模请求状态 status: 'loading' | 'success' | 'error'，
 *   data 只在 success 分支、errorMessage 只在 error 分支 —— 比多个独立 boolean 更不易出非法状态
 * - empty（请求成功但没数据）和 error（请求失败）是两种不同状态，UI 文案与交互都要分开
 * - 重试 = 让同一个请求 effect 重新执行：把 reloadFlag 计数器放进依赖数组，+1 即重跑
 * - 请求逻辑直接写在组件里，不做半吊子抽象；真实业务多用 TanStack Query，但手写这套是面试必备
 *
 * Vue 对应概念：
 * - 同样的判别联合放进 ref<RequestState>，整体替换 state.value —— 状态建模与 React 完全一致
 * - React 靠「改变依赖触发 effect 重跑」来重试；Vue 把请求写成普通函数 load()，重试直接再调一次
 *
 * 最重要的区别：
 * - 请求状态建模是框架无关的工程功底，两边一模一样；差异只在「怎么触发请求」：
 *   React 把请求声明成「状态的同步结果」（effect 由依赖驱动），
 *   Vue 版则把请求当成命令式「动作」（onMounted / 事件处理器里直接调 load）。
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'

// 与 React 版逐字相同的判别联合 —— 两边的状态设计完全一致，差异只在响应式 API。
// 同样杜绝 isLoading && isError 之类的非法组合；模板里 v-if="state.status === 'success'"
// 收窄后，TS 同样能保证 state.users 存在。
// （React 侧的面试点这里同样成立；Vue 生态的现成方案是 @tanstack/vue-query，本课程不引入。）
type RequestState =
  | { status: 'loading' }
  | { status: 'success'; users: User[] }
  | { status: 'error'; message: string }

const draft = ref('') // 输入框草稿
const keyword = ref('') // 已提交的搜索词（真正的请求参数）
// 「整体替换」的状态用 ref 而不是 reactive：reactive 不能整体换引用，
// state.value = { ... } 正好对应 React 的 setState(新对象)。
const state = ref<RequestState>({ status: 'loading' })

// React 版没有这个变量（controller 存在每轮 effect 的闭包里，cleanup 直接引用）；
// Vue 版的 load 是普通函数，需要自己记住「上一次」的 controller 用于取消。
let controller: AbortController | undefined

// React 版把请求声明成「由 [keyword, reloadFlag] 驱动的 effect」，初始加载/搜索/重试
// 都通过改依赖触发重跑；Vue 版直接写成普通函数，三个入口命令式地调它 ——
// 所以不需要 reloadFlag 这种「专门触发重跑的计数器」。请求逻辑同样直接写在组件里，不抽象。
async function load() {
  controller?.abort() // 取消上一次未完成的请求，避免竞态（10 题讲过；对应 React 的 cleanup）
  const ctrl = new AbortController()
  controller = ctrl
  state.value = { status: 'loading' }
  try {
    // failRate: 0.35 与 React 版一致 —— 35% 概率随机失败，方便看到 error 分支和重试按钮
    const users = await fetchUsers(keyword.value, { signal: ctrl.signal, failRate: 0.35 })
    state.value = { status: 'success', users }
  } catch (err) {
    if (isAbortError(err)) return // 「被取消」不算失败（10 题讲过）
    state.value = { status: 'error', message: err instanceof Error ? err.message : '未知错误' }
  }
}

// 初始自动加载：React 版靠「effect 挂载后必然执行一次」自动完成，Vue 版显式在 onMounted 调用
onMounted(load)
// React 版 effect cleanup 里的 abort 已覆盖卸载时机；Vue 版单独用 onUnmounted 取消在途请求
onUnmounted(() => controller?.abort())

// 提交搜索：React 版这里要 setKeyword + setReloadFlag(n => n + 1)（两次 setState 被批处理成
// 一次重渲染，再由 effect 重跑）；Vue 版赋值后直接调 load()，搜同一个词自然也会重新请求。
function handleSearch() {
  keyword.value = draft.value
  load()
}

// 重试：React 版靠 reloadFlag +1 触发 effect 重跑；Vue 版直接把同一个 load 再调一次
function retry() {
  load()
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      初始自动加载用户列表；35% 概率随机失败，多点几次「重试」可看到 error 分支；搜「zzz」看空态
    </p>

    <!-- @submit.prevent 对应 React 的 e.preventDefault()；用 form 包裹是为了让回车也能触发搜索。
         加载中禁用输入与按钮：防止重复提交，请求结束（成功或失败）后自动恢复 -->
    <form
      class="row"
      @submit.prevent="handleSearch"
    >
      <input
        v-model="draft"
        placeholder="搜索姓名或邮箱，搜「zzz」看空态"
        :disabled="state.status === 'loading'"
      >
      <button
        type="submit"
        class="btn-primary"
        :disabled="state.status === 'loading'"
      >
        {{ state.status === 'loading' ? '加载中…' : '搜索' }}
      </button>
    </form>

    <!-- 四种 UI 形态一一对应四种状态（与 React 版逐一对应）。
         注意 empty 不是 error：它是「请求成功、数据恰好为空」，文案是引导换关键词而不是报错重试。 -->
    <p
      v-if="state.status === 'loading'"
      class="muted"
    >
      加载中，请稍候…
    </p>

    <div
      v-if="state.status === 'error'"
      class="card"
    >
      <!-- 收窄到 error 分支后，TS 保证 state.message 存在 -->
      <p class="error-text">
        {{ state.message }}
      </p>
      <!-- 重试按钮只出现在 error 分支；React 版点击后靠 reloadFlag 触发 effect 重跑 -->
      <button
        class="btn-primary"
        @click="retry"
      >
        重试
      </button>
    </div>

    <p
      v-if="state.status === 'success' && state.users.length === 0"
      class="muted"
    >
      没有找到{{ keyword ? `与「${keyword}」` : '' }}匹配的用户，换个关键词试试
    </p>

    <table v-if="state.status === 'success' && state.users.length > 0">
      <thead>
        <tr>
          <th>姓名</th>
          <th>邮箱</th>
          <th>角色</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="u in state.users"
          :key="u.id"
        >
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td><span class="badge">{{ u.role }}</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
