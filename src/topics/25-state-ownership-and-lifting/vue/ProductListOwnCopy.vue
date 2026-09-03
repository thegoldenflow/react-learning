<script setup lang="ts">
/**
 * ❌ 反面教材：「让列表组件自己再存一份 keyword」（对照 React 侧的 ProductListWithOwnCopy）。
 *
 * 出事的就是下面那一行 ref(props.keyword)。props 对象本身是响应式的（直接在模板或 computed 里读 props.keyword
 * 永远是最新值），但 props.keyword 读出来是一个普通字符串，塞进 ref 的那一刻就和父组件断了联系 ——
 * 之后父组件的 keyword 怎么变，localKeyword 都纹丝不动。Vue 同样不会替你同步两份 state。
 *
 * 于是出现了【两份真相源】：父组件的 keyword（搜索框显示它、汇总用它算「匹配 N 件」）
 * 和本组件的 localKeyword（这张表用它过滤）。勾上复选框后去搜索框打字：汇总变了，这张表停在挂载那一刻并飘出红字；
 * 在本组件自己的输入框里打字则反过来 —— 双向都断，谁都不是「对的」。
 *
 * 作为对照，category 没有被拷贝，computed 里每次都直接读 props.category —— 所以切分类时这张表照样更新。
 * 同一个组件里，走 props 的永远新鲜，拷进 ref 的立刻过期，差别只在「有没有多存一份」。
 *
 * 常见的错误修法：watch(() => props.keyword, v => { localKeyword.value = v }) —— 这是 09 题点名的 ref + watch 反模式：
 * 仍然是两份数据、多一处会被遗漏的同步点、子组件自己改副本时父组件照样不知道（只堵住了一个方向）。
 * 正确修法是删掉这份 ref，直接用 props（就是 ProductList.vue）。
 * React 侧的同款错误修法是 useEffect(() => setLocalKeyword(keyword), [keyword])，它还会额外多渲染一轮
 * （先用旧副本渲染、effect 再改一次）；Vue 的 watch 默认 flush: 'pre'，在子组件重渲染之前就跑完，
 * 不会多渲染一轮 —— 但「两份真相源」这个病是一样的，机制差异不改变结论。
 *
 * 什么时候「初始值来自 props」是合理的？当你【有意】做非受控组件（08 题 ProductItem 的 draftName：进入编辑时拷一份草稿，
 * 确认时再 emit 上报）。那种场景请把 prop 命名成 initialKeyword / defaultKeyword 把意图说出来，需要重置时给组件换 :key。
 */
import { computed, ref } from 'vue'
import type { Product } from '@/shared/types'
import ProductList from './ProductList.vue'

const props = defineProps<{
  /** 父组件的 keyword —— 本组件会错误地把它拷贝一份 */
  keyword: string
  /** 父组件的 category —— 本组件会正确地直接使用它，作为对照 */
  category: string
  /** 全部商品：本组件自己过滤（因为它坚持要用自己那份 keyword） */
  products: Product[]
}>()

// ❌ 拷贝：只在 setup 时读一次 props.keyword，从此与父组件分道扬镳
const localKeyword = ref(props.keyword)

// 两份真相源是否已经分叉
const outOfSync = computed(() => localKeyword.value !== props.keyword)

// 过滤用的是自己那份副本；category 走 props，现读现取（过滤逻辑与 Example.vue 相同，故意不共享，坏只能坏在归属上）
const visible = computed(() => {
  const kw = localKeyword.value.trim().toLowerCase()
  return props.products.filter(
    (p) =>
      (props.category === 'all' || p.category === props.category) &&
      p.name.toLowerCase().includes(kw),
  )
})
</script>

<template>
  <div class="stack">
    <div class="row">
      <label class="row">
        <span>本组件自己的 keyword 副本：</span>
        <input v-model="localKeyword">
      </label>
      <span class="muted">
        分类仍走 props（当前「{{ category === 'all' ? '全部' : category }}」）—— 现读现取，永远同步
      </span>
    </div>
    <p
      v-if="outOfSync"
      class="error-text"
    >
      两份真相源已经分叉：父组件的 keyword =「{{ keyword }}」，本组件的副本 =「{{ localKeyword }}」。
      上面的汇总和这张表说的已经不是同一回事。
    </p>
    <p
      v-else
      class="success-text"
    >
      此刻两份值恰好相等（挂载时拷贝的就是父组件当时的值）—— 去上面的搜索框改一下，或在这里改一下，看它们分叉
    </p>
    <ProductList :products="visible" />
  </div>
</template>
