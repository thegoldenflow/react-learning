<script setup lang="ts">
/**
 * 区块三 Vue 对照：轮询读筛选参数。对照 react/PollingDemo.tsx。
 *
 * 三种模式：
 * - 现读（Vue 的自然写法）：定时器只建一次，每次 tick 读 status.value —— 对应 React ③ useEffectEvent / ④ latest ref 的效果；
 * - 启动时拷一份：开始轮询那一刻 const frozenStatus = status.value，之后一直用它 —— 对应 React 依赖 [] 的坏例子（那边是框架替你拷的）；
 * - watch 重启：把 status 也放进 watch 的 source，status 一变就先清理、再按新参数重建定时器 —— 对应 React ② 写对依赖 [status]。
 *   在 Vue 里这是你主动选的行为（想要「换条件立刻查一次」），而不是为了读到新值被迫的。
 *
 * 整个轮询挂在一个 watch 上：source 是 [polling, pollMode, 第三项]。第三项是个 getter，只有「watch 重启」模式才读 status.value ——
 * watch 只追踪 source 里读到的东西（官方 watch vs. watchEffect：「watch only tracks the explicitly watched source」），
 * 其他模式下 status 变了不会触发它。回调里读 status.value（现读模式每次 tick 都读）不会被追踪。
 * 清理用 onWatcherCleanup【主流·3.5 起】：下一次回调之前、watcher 停止时（组件卸载时同步创建的 watcher 会自动停止）都会执行 ——
 * 相当于 React Effect 返回的 cleanup。alive 标志和 React 侧一样，只丢弃迟到的响应，不真的取消请求（27 题）。
 *
 * 演示简化：真实项目的轮询用 @tanstack/vue-query 的 refetchInterval（TanStack Query 的基础见 30 题），把 status 的 getter 放进 queryKey。
 */
import { onWatcherCleanup, ref, watch } from 'vue'
import { fetchOrders } from '@/shared/mockApi'
import { ORDER_STATUS_TEXT, type OrderStatus } from '@/shared/types'
import LogList from './LogList.vue'

type StatusFilter = OrderStatus | 'all'
type PollMode = 'fresh' | 'frozen' | 'restart'

/** 模拟请求延迟：页面 300ms，测试里 0 */
const { delayMs = 300 } = defineProps<{ delayMs?: number }>()

const STATUS_OPTIONS: StatusFilter[] = ['all', 'pending', 'paid', 'cancelled']
const STATUS_LABEL: Record<StatusFilter, string> = { all: '全部', ...ORDER_STATUS_TEXT }
/** 与 React 版同名同值 */
const POLL_MS = 2000

const status = ref<StatusFilter>('all')
const pollMode = ref<PollMode>('fresh')
const polling = ref(false)
const log = ref<string[]>([])
const TAG: Record<PollMode, string> = { fresh: '【现读】', frozen: '【启动时拷一份】', restart: '【watch 重启】' }

watch(
  [polling, pollMode, () => (pollMode.value === 'restart' ? status.value : null)],
  ([on, mode]) => {
    if (!on) return
    let alive = true
    let tickNo = 0
    const frozenStatus = status.value
    const tick = () => {
      const seq = ++tickNo
      // 每次 tick 现读 status.value；frozen 模式故意用开始那一刻拷的值
      const requested = mode === 'frozen' ? frozenStatus : status.value
      void fetchOrders({ status: requested, pageSize: 20 }, { delayMs }).then((page) => {
        if (!alive) return
        const note = requested !== status.value ? `（下拉框已经是 ${status.value}）` : ''
        log.value.push(`${TAG[mode]}第 ${seq} 次轮询：status=${requested} → ${page.total} 条${note}`)
      })
    }
    tick()
    const id = setInterval(tick, POLL_MS)
    onWatcherCleanup(() => {
      alive = false
      clearInterval(id)
    })
  },
)

function changeStatus() {
  // v-model 的 change 监听先于这个 @change 注册，这里读到的已经是新值
  log.value.push(`—— 下拉框切到 status=${status.value} ——`)
}

function togglePolling() {
  polling.value = !polling.value
  log.value.push(polling.value ? `—— 开始轮询（status=${status.value}）——` : '—— 停止轮询：watcher 清理时清掉定时器，之后不会再有新日志 ——')
}
</script>

<template>
  <div class="card stack">
    <h3>区块三：轮询读筛选参数 —— 回调里读 status.value 就是最新值</h3>
    <p class="muted">
      点「开始轮询」，等一两条日志后把状态切到「已支付」：「现读」下一次 tick 就用新状态、计数连续（对应 React ③ / ④）；「启动时拷一份」一直用开始那一刻的
      status（对应 React ❌）；「watch 重启」立刻按新状态查一次、计数从 1 重来（对应 React ②）。默认数据里 all=15、pending=6、paid=6、cancelled=3 条。
    </p>
    <div class="row">
      <label class="row">
        <span>筛选状态：</span>
        <!-- v-model 直接拿到绑定值；React 版还要 e.target.value as StatusFilter 收窄 -->
        <select
          v-model="status"
          @change="changeStatus"
        >
          <option
            v-for="s in STATUS_OPTIONS"
            :key="s"
            :value="s"
          >
            {{ STATUS_LABEL[s] }}
          </option>
        </select>
      </label>
      <button
        :class="polling ? 'btn-danger' : 'btn-primary'"
        @click="togglePolling"
      >
        {{ polling ? '停止轮询' : '开始轮询' }}
      </button>
    </div>
    <div class="row">
      <label class="row">
        <span>写法：</span>
        <select v-model="pollMode">
          <option value="fresh">现读 status.value（定时器只建一次，参数读最新）</option>
          <option value="frozen">启动时拷一份（手动快照，对照 React 依赖 [] 的坏例子）</option>
          <option value="restart">watch 重启（status 进 source，对照 React 依赖 [status]）</option>
        </select>
      </label>
    </div>
    <p class="muted">
      {{ polling ? `轮询中。下拉框里的 status=${status}` : '未在轮询 —— 没有任何定时器在跑。' }}
    </p>
    <LogList
      :lines="log"
      label="区块三日志"
      empty-hint="（还没有记录，点「开始轮询」）"
      @clear="log = []"
    />
  </div>
</template>
