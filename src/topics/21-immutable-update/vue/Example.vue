<script setup lang="ts">
/**
 * 学习主题：不可变数据更新 —— 两框架状态模型的核心差异
 *
 * React 核心概念：
 * - React 不追踪「你改了什么」：setState 后用 Object.is 比较新旧引用来决定要不要重渲染，
 *   所以更新必须「造新对象」—— 改哪个字段，从它到根的每一层都要换新引用
 * - 三大数组模式：map 改一项、filter 删一项、[...arr, item] 追加
 * - 反例：order.items[0].quantity++ 引用没变 → React 认为「没变化」→ 不重渲染
 * - 引用比较是整个 React 优化体系的地基：memo 的 props 浅比较、useEffect/useMemo 的
 *   依赖数组比较，全靠「变化必换引用」这条约定才成立
 * - 本题是 03 题「不可变更新」规则的系统化：03 题只在一层数组上 map / filter，这里把对象展开、
 *   嵌套更新、数组追加 / 删除等五种模式一次讲全
 * - 深嵌套更新繁琐是真实痛点，工业界常用 Immer（useImmer）「以可变写法生成不可变更新」（本课不引入）
 *
 * Vue 对应概念：
 * - reactive 对象直接 mutate：Proxy 拦截 set，写入时就知道是哪个属性变了，读过它的组件重新执行渲染函数、再 patch DOM
 * - 没有「每层新引用」的负担：push / splice / 直接赋值都是惯用写法
 *
 * 最重要的区别：
 * - 变更检测的哲学：React 是「拉」—— 不监听数据，靠你换引用、它来比较发现变化；
 *   Vue 是「推」—— 写入时（reactive 由 Proxy 拦截，ref 由 .value 的 setter 拦截）就通知读过它的 effect。这是两框架最根本的分歧：
 *   React 的不可变约定、Vue 的响应式系统，都源于这一设计选择。
 */
import { reactive } from 'vue'
import type { Order, OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

const INITIAL_ORDER: Order = {
  id: 'o1',
  orderNo: 'SO-2026-0001',
  customer: '张伟',
  amount: 557,
  status: 'pending',
  createdAt: '2026-08-28',
  items: [
    { id: 'it-1', name: '机械键盘', price: 299, quantity: 1 },
    { id: 'it-2', name: '无线鼠标', price: 129, quantity: 2 },
  ],
}

// 客户名轮换（与 React 版相同的演示辅助函数）
function nextCustomer(current: string): string {
  const names = ['张伟', '王芳', '李娜']
  const idx = names.indexOf(current)
  return names[(idx + 1) % names.length] ?? '张伟'
}

// 状态流转：pending → paid → cancelled → pending
const NEXT_STATUS: Record<OrderStatus, OrderStatus> = {
  pending: 'paid',
  paid: 'cancelled',
  cancelled: 'pending',
}

// 追加 item 时轮换的商品模板
const PRODUCT_POOL = [
  { name: '显示器支架', price: 199 },
  { name: 'USB 扩展坞', price: 249 },
  { name: '降噪耳机', price: 899 },
]

// 嵌套对象状态用 reactive：后面所有操作都直接 mutate 它。
// 同样 structuredClone 一份，避免把模块级常量 INITIAL_ORDER 改脏。
// React 版对照：useState + 「每次 setOrder 都造一棵新对象树」。
const order = reactive<Order>(structuredClone(INITIAL_ORDER))

// 新 item 的自增序号：setup 只跑一次，普通 let 变量就够了。
// React 版对照：函数组件每次渲染都重新执行，「不参与渲染的可变值」要放 useRef。
let nextItemSeq = 3

// 模式一对照：React 要 { ...prev, customer: xxx } 造新对象；Vue 直接给字段赋值，
// Proxy 拦截这次 set，触发读过 order.customer 的组件重新渲染（这里就是本组件）。
function renameCustomer() {
  order.customer = nextCustomer(order.customer)
}

// 模式二对照（React 面试手写最高频：嵌套更新每层都要新引用 map + 展开）：
// Vue 里 find 到目标直接 ++，不存在「从根到字段每层换引用」的负担 ——
// 这就是顶部注释说的「核心差异」最直观的体现。
function increaseQuantity(itemId: string) {
  const target = order.items.find((it) => it.id === itemId)
  if (target) target.quantity++
}

// 模式三对照：React 用 [...prev.items, newItem]（push 是错的）；Vue 的 push 就是惯用写法。
// React 版的 id 必须在事件处理器里生成（更新函数要保持纯函数）；Vue 没有这个约束。
function appendItem() {
  const seq = nextItemSeq++
  const template = PRODUCT_POOL[seq % PRODUCT_POOL.length] ?? { name: '新商品', price: 99 }
  order.items.push({ id: `it-${seq}`, name: template.name, price: template.price, quantity: 1 })
}

// 模式四对照：React 用 filter 造新数组；Vue 用 splice 原地删除即可
//（items 数组也是响应式的，splice 会被 Proxy 拦截）。
function removeItem(itemId: string) {
  const idx = order.items.findIndex((it) => it.id === itemId)
  if (idx !== -1) order.items.splice(idx, 1)
}

// 模式五对照：同样是直接赋值，字段值来自映射表。
function toggleStatus() {
  order.status = NEXT_STATUS[order.status]
}

// React 版的「反例」在 Vue 里是【正例】：一模一样的直接 mutate，
// 在 React 里点了没反应（引用没变、不重渲染），在 Vue 里立即生效 ——
// 两个按钮点起来的差异，就是「拉 vs 推」两种变更检测哲学的现场演示。
function directMutate() {
  const first = order.items[0]
  if (first) first.quantity++
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      点按钮并观察下方 JSON：Vue 直接改同一个 reactive 对象即可，Proxy 拦截写入并触发本组件重新渲染；
      「直接 mutate」按钮在 React 版里是点了没反应的反例，在这里完全正常
    </p>

    <div class="row">
      <button @click="renameCustomer">
        改客户名（直接赋值）
      </button>
      <button @click="appendItem">
        追加 item（push）
      </button>
      <button @click="toggleStatus">
        切换状态（当前：{{ ORDER_STATUS_TEXT[order.status] }}）
      </button>
      <button
        class="btn-danger"
        @click="directMutate"
      >
        React 的反例：直接 mutate（Vue 里正常生效）
      </button>
    </div>

    <table>
      <thead>
        <tr>
          <th>商品</th>
          <th>单价</th>
          <th>数量</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="it in order.items"
          :key="it.id"
        >
          <td>{{ it.name }}</td>
          <td>¥{{ it.price }}</td>
          <td>{{ it.quantity }}</td>
          <td class="row">
            <button @click="increaseQuantity(it.id)">
              数量 +1（find 后直接 ++）
            </button>
            <button
              class="btn-danger"
              @click="removeItem(it.id)"
            >
              删除（splice）
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 实时展示整个 state 对象，肉眼确认每次操作后的数据（与 React 版一致）。
         amount 是订单上的静态字段，本题不让它随 items 联动，别被 JSON 里对不上的合计迷惑 -->
    <pre>{{ JSON.stringify(order, null, 2) }}</pre>
  </div>
</template>
