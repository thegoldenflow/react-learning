<script setup lang="ts">
/**
 * 学习主题：useMemo 与 useCallback（配合 React.memo 的性能优化）
 *
 * React 核心概念：
 * - React 的更新模型：父组件 state 一变，默认从它开始整棵子树重跑渲染函数——
 *   子组件不管 props 变没变都会重渲染
 * - React.memo(子组件)：props 浅比较（Object.is 逐个对比）都相同就跳过重渲染——
 *   前提是每个 prop 的引用稳定
 * - useCallback 缓存函数引用：不包的话父组件每次渲染都新建函数 → memo 的浅比较永远不等 →
 *   memo 完全失效（引用相等这条因果链是本题核心）
 * - useMemo 缓存昂贵计算（如 200 条数据的 filter + sort），依赖不变时复用上次结果
 * - 不要无脑 useMemo/useCallback：有内存与心智成本，绝大多数组件根本不需要；
 *   先用 React DevTools Profiler 量测出瓶颈再优化
 * - React Compiler 正在把这类手动 memo 化逐步自动化（知道有这回事即可，不展开）
 *
 * Vue 对应概念：
 * - computed：自动依赖追踪 + 自动缓存，相当于「不用手写依赖数组的 useMemo」
 * - Vue 是组件级精准更新：父组件重渲染时，props 没变的子组件根本不会更新——
 *   memo / useCallback 在 Vue 里没有对应物，因为不需要
 * - Vue 编译器还会自动缓存模板里的内联事件处理函数（相当于自动帮你 useCallback）
 *
 * 最重要的区别：
 * - 两个框架的性能模型根本不同：React 默认「全量重跑 + 手动挡优化（memo/useMemo/useCallback）」，
 *   Vue 默认「依赖追踪 + 自动挡精准更新」；React 这三件套是在弥补「默认全量重跑」，
 *   Vue 天然不需要它们——没有一一对应关系
 */
import { computed, ref } from 'vue'
import type { Product } from '@/shared/types'
import ProductRow from './ProductRow.vue'

const CATEGORIES = ['键盘', '耳机', '显示器', '音箱'] as const

type SortOrder = 'default' | 'asc' | 'desc'

/** 生成约 200 条确定性的商品数据（取模制造「伪随机」价格 / 库存，与 React 版完全一致） */
function generateProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, i) => {
    const category = CATEGORIES[i % CATEGORIES.length]
    return {
      id: `p${i + 1}`,
      name: `${category}型号-${String(i + 1).padStart(3, '0')}`,
      price: ((i * 37) % 1900) + 99,
      category,
      stock: (i * 13) % 50,
    }
  })
}

const products = ref<Product[]>(generateProducts(200))
const keyword = ref('')
const category = ref('all')
const sortOrder = ref<SortOrder>('default')
const selectedId = ref<string | null>(null)
// 与列表完全无关的 state：演示「父组件因无关原因重渲染」时 Vue 的表现（对照 React 版同名按钮）
const unrelatedCount = ref(0)

// computed 缓存 filter + sort 的结果：自动追踪依赖（products / keyword / category / sortOrder）、
// 依赖不变时读缓存——等价于 React 版那个手写依赖数组的 useMemo，但不用写依赖、也不可能写漏。
// 打开控制台：点「触发无关重渲染」时这里的计数不动（缓存命中），
// React 版靠 useMemo 手动达成同样效果，且依赖数组写漏一个就会拿到过期结果。
const visibleProducts = computed(() => {
  console.count('[17-Vue] filter+sort 计算次数')
  const kw = keyword.value.trim()
  let result = products.value.filter((p) => p.name.includes(kw))
  if (category.value !== 'all') {
    result = result.filter((p) => p.category === category.value)
  }
  if (sortOrder.value !== 'default') {
    // sort 原地排序，先拷贝再排，不改 filter 的结果数组
    result = [...result].sort((a, b) =>
      sortOrder.value === 'asc' ? a.price - b.price : b.price - a.price,
    )
  }
  return result
})

// 普通函数即可——React 版这里必须 useCallback：那边函数每次渲染重建、memo 靠引用相等判断，
// 不包就 200 行全部重渲染。Vue 的 setup 只执行一次（函数本来就只创建一次），
// 且子组件更不更新看的是「props 值变没变」，不靠回调引用相等——useCallback 没有对应物，因为不需要。
function handleSelect(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}
</script>

<template>
  <div class="stack">
    <div class="card row">
      <input
        v-model="keyword"
        placeholder="搜索商品名…"
      >
      <select v-model="category">
        <option value="all">
          全部类别
        </option>
        <option
          v-for="c in CATEGORIES"
          :key="c"
          :value="c"
        >
          {{ c }}
        </option>
      </select>
      <select v-model="sortOrder">
        <option value="default">
          默认排序
        </option>
        <option value="asc">
          价格从低到高
        </option>
        <option value="desc">
          价格从高到低
        </option>
      </select>
      <button @click="unrelatedCount++">
        触发无关重渲染（已点 {{ unrelatedCount }} 次）
      </button>
    </div>

    <p class="muted">
      共 {{ visibleProducts.length }} 条。打开控制台观察：点「触发无关重渲染」时「计算次数」和
      「更新次数」都不动（computed 缓存命中 + 行组件 props 没变就不更新，全是框架默认行为）；
      点行内「选中」时「更新次数」只 +2。
    </p>

    <!--
      对照 React 版此处的强调：Vue 侧没有「别无脑 memo/useCallback」的问题，因为压根不用写；
      代价是要理解响应式系统的规则（依赖收集、ref/reactive 的边界）。
      两边最后殊途同归：React Compiler 也在把 React 的手动优化变成编译器的活。
    -->
    <table>
      <thead>
        <tr>
          <th>名称</th>
          <th>类别</th>
          <th>价格</th>
          <th>库存</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <ProductRow
          v-for="p in visibleProducts"
          :key="p.id"
          :product="p"
          :selected="selectedId === p.id"
          @select="handleSelect"
        />
      </tbody>
    </table>
  </div>
</template>
