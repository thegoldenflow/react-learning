<script setup lang="ts">
/**
 * 区块一：v-for + :key、computed 过滤排序。对照 react/ListBasicsDemo.tsx（React 用 filter / sort / map）。
 * - 【最常用】v-for="item in items" + :key="item.id"（API 页 key 一节：「The most common use case is combined with v-for」）。
 * - 过滤列表项：【最常用】过滤、排序放进 computed（「replace users with a new computed property that returns your filtered list」，频率：工程经验）；
 *   【常用】把 v-for 挪到外层 <template>、v-if 写在里面（「This can be fixed by moving v-for to a wrapping <template> tag」）。
 *   ❌ 在 v-for 同一个元素上写 v-if 来过滤：v-if 先求值、读不到循环变量（Example.test.ts 用编译结果证明）。
 *   computed 里排序前先拷贝：「Be careful with reverse() and sort() in a computed property! These two methods will mutate the original array」，
 *   和 React 那边「copy the array first」是同一个道理。
 * - ✅ 整个列表要隐藏：「move the v-if to a container element (e.g. ul, ol)」—— 下面的 <ul v-if> / <p v-else>。
 * - 【常用】一项多个节点、又不能多包一层（表格里一项占两行 <tr>）：<template v-for>，:key 写在 <template> 上（「the key should be placed on the <template> container」；
 *   React 是 <Fragment key>；频率：工程经验）。
 * - 【少用】of、遍历对象、整数范围、解构：拆在 RareVForDemo.vue，模板里已注释（讲解见 react/Example.tsx 附 6）。
 */
import { computed, ref } from 'vue'
import { PRODUCT_CATEGORIES, PRODUCTS } from '@/shared/products'
/* 【少用】取消模板里 <RareVForDemo /> 的注释时，这一段也取消注释（删掉这一行和下面的结束行）
import RareVForDemo from './RareVForDemo.vue'
*/

type SortKey = 'default' | 'price-asc' | 'price-desc'

const category = ref('全部')
const plentyOnly = ref(false)
const sortKey = ref<SortKey>('default')
const categories = ['全部', ...PRODUCT_CATEGORIES]

const visible = computed(() => {
  const noFilter = category.value === '全部' && !plentyOnly.value
  const filtered = noFilter
    ? PRODUCTS
    : PRODUCTS.filter((p) => (category.value === '全部' || p.category === category.value) && (!plentyOnly.value || p.stock >= 10))
  if (sortKey.value === 'default') return filtered
  return [...filtered].sort((a, b) => (sortKey.value === 'price-asc' ? a.price - b.price : b.price - a.price))
})
</script>

<template>
  <div class="card stack">
    <h3>区块一：v-for + :key、computed 过滤排序</h3>
    <p class="muted">
      【最常用】过滤、排序写在 computed 里，v-for 遍历它的结果，:key 用数据自带的 id（这里是 p.id）。
    </p>
    <div class="row">
      <label class="row">
        分类
        <select
          v-model="category"
          aria-label="分类"
        >
          <option
            v-for="c in categories"
            :key="c"
            :value="c"
          >{{ c }}</option>
        </select>
      </label>
      <label class="row">
        <input
          v-model="plentyOnly"
          type="checkbox"
        >
        只看库存 ≥ 10 件
      </label>
      <label class="row">
        排序
        <select
          v-model="sortKey"
          aria-label="排序"
        >
          <option value="default">默认</option>
          <option value="price-asc">价格从低到高</option>
          <option value="price-desc">价格从高到低</option>
        </select>
      </label>
    </div>
    <!-- ✅ 整个列表要隐藏时，v-if 写在外层容器上，不和 v-for 写在同一个元素上 -->
    <ul
      v-if="visible.length > 0"
      class="stack"
      aria-label="商品列表"
    >
      <li
        v-for="p in visible"
        :key="p.id"
      >
        {{ p.name }} · ￥{{ p.price }}
      </li>
    </ul>
    <p
      v-else
      class="muted"
    >
      没有符合条件的商品
    </p>

    <p class="muted">
      一项要渲染多个节点：能多包一层元素就包一层（【最常用】，上面每项就是一个 &lt;li&gt;）；
      表格里一项占两行 &lt;tr&gt;，外面不能再包 &lt;div&gt;，这时用 &lt;template v-for&gt;，:key 写在 &lt;template&gt; 上【常用】。
    </p>
    <table aria-label="库存明细">
      <tbody>
        <template
          v-for="p in visible"
          :key="p.id"
        >
          <tr>
            <td>{{ p.name }}</td>
            <td>￥{{ p.price }}</td>
          </tr>
          <tr>
            <td
              colspan="2"
              class="muted"
            >
              库存 {{ p.stock }} 件
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- 【少用】v-for 的其他写法（of、遍历对象、整数范围、解构）。取消注释即可运行：删掉这一行和下面的结束行，并取消 script 里 import RareVForDemo 那一段的注释
    <RareVForDemo />
    -->
  </div>
</template>
