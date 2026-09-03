<script setup lang="ts">
/**
 * 分类筛选（对照 React 侧 Example.tsx 里的 CategoryFilter 函数组件）。
 *
 * 归属表：
 * - value（选中的分类）→ 父组件 Example.vue：ResultSummary 和 ProductList 也要用它，所以它不能留在这里，
 *   只能以 props 传进来；用户点了分类，本组件 emit('change', 分类) 上报，由父组件真正改 —— 事件向上
 * - expanded（折叠 / 展开）→ 本组件：除了本组件，没有任何人需要知道分类面板现在是折叠还是展开，
 *   所以它不提升，就是一个普通的 ref —— 这就是「什么情况下 state 应该留在子组件」
 * 同一个组件里，一个 state 提升、一个 state 留下，标准只有一条：谁用。
 *
 * 可观察的证据：先点「更多」展开，再去搜索框打字 —— 父组件的 keyword 变了、本组件也跟着重渲染，
 * 但 expanded 不会被重置：ref 随组件实例存活，只有组件销毁（v-if 为 false）才会丢。
 *
 * React 对应：props { categories, value, onChange } + 局部 const [expanded, setExpanded] = useState(false)。
 * Vue 把「数据」和「事件」分成 defineProps / defineEmits 两套宏；React 两者都是普通 props。
 */
import { computed, ref } from 'vue'

const props = defineProps<{
  /** 所有分类，来自父组件（数据向下） */
  categories: string[]
  /** 当前选中的分类，来自父组件 —— 本组件不拥有它；'all' 表示不限分类 */
  value: string
}>()

// 事件向上：对应 React 的 onChange: (next: string) => void
const emit = defineEmits<{
  change: [value: string]
}>()

/** 折叠时只显示前几个分类，其余收进「更多」 */
const COLLAPSED_COUNT = 2

// ★ 留在子组件的 state：只有本组件关心
const expanded = ref(false)

// 派生值用 computed（React 侧是渲染期的普通 const）
const visibleCategories = computed(() =>
  expanded.value ? props.categories : props.categories.slice(0, COLLAPSED_COUNT),
)
const hiddenCount = computed(() => props.categories.length - COLLAPSED_COUNT)
// 折叠时选中的分类可能被藏进「更多」里 —— 这只是本组件的显示问题，选中值本身仍安稳地在父组件手里
const selectedIsHidden = computed(
  () => props.value !== 'all' && !visibleCategories.value.includes(props.value),
)
</script>

<template>
  <div class="row">
    <span>分类：</span>
    <!-- 点分类不改任何本地 state，只 emit；高亮与否读的是 props.value —— 父组件才是真相源 -->
    <button
      :class="{ 'btn-primary': value === 'all' }"
      @click="emit('change', 'all')"
    >
      全部
    </button>
    <button
      v-for="c in visibleCategories"
      :key="c"
      :class="{ 'btn-primary': value === c }"
      @click="emit('change', c)"
    >
      {{ c }}
    </button>
    <!-- 唯一一处改本地 state 的地方：折叠 / 展开只关本组件的事 -->
    <button
      v-if="hiddenCount > 0"
      class="btn-ghost"
      @click="expanded = !expanded"
    >
      {{ expanded ? '收起' : `更多（${hiddenCount}）` }}
    </button>
    <span
      v-if="selectedIsHidden"
      class="muted"
    >
      （已选「{{ value }}」折叠在「更多」里 —— 折叠只是本组件的显示问题，选中值仍在父组件手里）
    </span>
  </div>
</template>
