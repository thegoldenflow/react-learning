<script setup lang="ts">
/**
 * 请求状态建模（React 对照：react/EffectRequestPanel.tsx，建模、取消、重试、保留旧数据一一对应）。
 *
 * 和 React 的对应关系：
 * - useEffect(..., [依赖]) ↔ watch(参数指纹, ..., { immediate: true })：都是「参数变了就重新请求」；
 * - cleanup 里 controller.abort() ↔ onWatcherCleanup(() => controller.abort())【主流·Vue 3.5 起】，
 *   Vue 3.4 及以前用 watch 回调的第三个参数 onCleanup；
 * - pending 同样是派生的（computed）：结果里记着它属于哪一次参数指纹，不等于当前指纹就说明还在加载。
 *   Vue 这边没有 set-state-in-effect 这类规则，但「派生而不是另存一份」同样避免了状态对不上；
 * - 另一种常见的 Vue 写法是命令式 load()（onMounted 调一次、事件里再调），差别只是触发方式。
 *   官方 composable 示例（useFetch）用 watchEffect + toValue，同样没做取消，要自己补 onWatcherCleanup。
 */
import { computed, onWatcherCleanup, ref, watch } from 'vue'
import { fetchUsers, isAbortError } from '@/shared/mockApi'
import type { User } from '@/shared/types'

type Result =
  | { forKey: string; kind: 'success'; users: User[] }
  | { forKey: string; kind: 'error'; message: string }

const { delayMs = 600 } = defineProps<{ delayMs?: number }>()

const draft = ref('')
const keyword = ref('')
const reloadFlag = ref(0)
const failMode = ref(false)
const result = ref<Result | null>(null)

const requestKey = computed(() => `${keyword.value}|${reloadFlag.value}|${failMode.value}`)
const pending = computed(() => result.value === null || result.value.forKey !== requestKey.value)
const previousUsers = computed(() => (result.value?.kind === 'success' ? result.value.users : null))

watch(
  requestKey,
  async (key) => {
    const controller = new AbortController()
    // onWatcherCleanup 必须在回调的同步阶段调用（await 之前）：下一次触发前、组件卸载时都会执行
    onWatcherCleanup(() => controller.abort())
    try {
      const users = await fetchUsers(keyword.value, {
        signal: controller.signal,
        delayMs,
        failRate: failMode.value ? 1 : 0,
      })
      result.value = { forKey: key, kind: 'success', users }
    } catch (err) {
      if (isAbortError(err)) return // 取消不算失败（27 题）
      result.value = { forKey: key, kind: 'error', message: err instanceof Error ? err.message : '未知错误' }
    }
  },
  { immediate: true },
)

function handleSearch() {
  keyword.value = draft.value
  // 和 React 版一样：搜同一个词时关键词没变，靠 reloadFlag 让参数指纹变化
  reloadFlag.value += 1
}
</script>

<template>
  <div class="card stack">
    <h3>区块一：watch 驱动的请求（Vue）</h3>
    <p class="muted">
      搜「zzz」看空态；勾选「让请求失败」看错误态与重试；切换关键词时旧数据会留在屏幕上。
    </p>

    <form
      class="row"
      @submit.prevent="handleSearch"
    >
      <input
        v-model="draft"
        placeholder="搜索姓名或邮箱"
        aria-label="搜索关键词"
      >
      <button
        type="submit"
        class="btn-primary"
      >
        搜索
      </button>
      <label
        class="row"
        style="gap: 4px"
      >
        <input
          v-model="failMode"
          type="checkbox"
        >
        让请求失败
      </label>
    </form>

    <p class="muted">
      参数指纹 <code>{{ requestKey }}</code>；请求态（派生）：{{ pending ? '加载中' : result?.kind === 'error' ? '失败' : '成功' }}
    </p>

    <p
      v-if="pending && previousUsers === null"
      class="muted"
    >
      加载中，请稍候…
    </p>

    <div
      v-if="!pending && result?.kind === 'error'"
      class="stack"
      style="gap: 6px"
    >
      <p
        role="alert"
        class="error-text"
        style="margin: 0"
      >
        {{ result.message }}
      </p>
      <div class="row">
        <button
          type="button"
          class="btn-primary"
          @click="reloadFlag += 1"
        >
          重试
        </button>
      </div>
    </div>

    <p
      v-if="!pending && result?.kind === 'success' && result.users.length === 0"
      class="muted"
    >
      没有找到{{ keyword ? `与「${keyword}」` : '' }}匹配的用户，换个关键词试试
    </p>

    <template v-if="(previousUsers?.length ?? 0) > 0">
      <p
        v-if="pending"
        class="muted"
      >
        刷新中…（下面还是上一次的结果）
      </p>
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>邮箱</th>
            <th>角色</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in previousUsers"
            :key="u.id"
          >
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td><span class="badge">{{ u.role }}</span></td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>
