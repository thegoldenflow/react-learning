<script setup lang="ts">
/**
 * 学习主题：父子组件通信（callback props vs emit）
 *
 * React 核心概念：
 * - 父传子：props 传数据；子通知父：父把「函数」也当 props 传下去（callback props），
 *   子组件在合适时机直接调用它，比如 onDelete(product.id)
 * - 命名约定：props 名用 on 开头（onDelete / onRename），父组件里的实现用 handle 开头
 *   （handleDelete / handleRename）——业界通用，一眼区分「接口」与「实现」
 * - 单向数据流：数据向下（props），事件向上（回调）；列表数据只存在于父组件
 * - 子组件绝不直接修改父状态：props 只读，而且只有父组件自己的 setState
 *   才能让父组件重渲染——子组件改了也白改，React 根本不知道
 * - React 没有独立的「事件系统」：callback props 就是普通的函数参数
 *
 * Vue 对应概念：
 * - defineEmits<{ delete: [id: string] }>() 声明事件，emit('delete', id) 抛出，
 *   父组件模板里 @delete="handleDelete" 监听
 * - Vue 的 props 同样只读、同样单向数据流——理念一致，机制不同
 * - SFC 一文件一组件：子组件 ProductItem 必须是单独的 .vue 文件
 *
 * 最重要的区别：
 * - emit 是 Vue 专门的自定义事件机制（声明、抛出、监听三步）；React 完全没有对应物，
 *   没有一一对应关系——所谓「子传父」只是「父传给子的函数被子调用了」，纯 JavaScript
 * - React 的子组件可以与父组件同文件（组件只是函数）；本题 ProductItem 就写在下面
 * - 本题讲「机制」（callback props vs emit）；「状态该归谁」的设计判断——兄弟组件共享、为什么不能各存一份、
 *   何时留在子组件——见 25 题（状态提升与 state 归属）
 */
import { ref } from 'vue'
import type { Product } from '@/shared/types'
// SFC 一文件一组件：子组件必须单独拆成 ProductItem.vue 再导入；
// React 版的 ProductItem 和父组件写在同一个 .tsx 文件里
import ProductItem from './ProductItem.vue'

/** 初始商品列表：用 Product 类型的常量初始化父组件状态 */
const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: '机械键盘', price: 399, category: '外设', stock: 12 },
  { id: 'p2', name: '人体工学椅', price: 1299, category: '家具', stock: 5 },
  { id: 'p3', name: '4K 显示器', price: 1999, category: '外设', stock: 8 },
]

// 浅拷贝每个对象再交给 ref：Vue 是可变更新（下面会直接改 target.name），
// 不拷贝会把模块级常量也改掉，示例卸载重挂后就看到「被改过的初始数据」；
// React 版全程不可变更新，从不碰初始常量，所以不需要拷贝
const products = ref<Product[]>(INITIAL_PRODUCTS.map(p => ({ ...p })))

// 与 React 相同的 handle* 命名约定。删除这一步两边写法几乎一样：filter 出新数组
// （Vue 对 ref 重新赋值即可触发更新，不需要 setState）；真正体现「可变 vs 不可变」差别的是下面的改名
function handleDelete(id: string) {
  products.value = products.value.filter(p => p.id !== id)
}

function handleRename(id: string, newName: string) {
  const target = products.value.find(p => p.id === id)
  // Vue 直接改对象属性；React 里这一步必须 map 出新数组 + 新对象（不可变更新）
  if (target) target.name = newName
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      数据只存在父组件（共 {{ products.length }} 件）；子组件展示商品并「上报意图」，父组件执行修改
    </p>
    <!-- 数据用 :product 传、事件用 @delete / @rename 监听——Vue 语法上分成两类；
         React 里两者都是普通 props，写法一致：onDelete={handleDelete} -->
    <ProductItem
      v-for="p in products"
      :key="p.id"
      :product="p"
      @delete="handleDelete"
      @rename="handleRename"
    />
    <p
      v-if="products.length === 0"
      class="muted"
    >
      商品已全部删除（重新进入本页可复位）
    </p>
  </div>
</template>
