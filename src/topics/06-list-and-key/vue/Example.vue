<script setup lang="ts">
/**
 * 学习主题：列表渲染与 key（.map() 对照 v-for，index 作 key 的坑）
 *
 * React 核心概念：
 * - 列表就是数组的 .map() 返回 JSX；key 写在 map 返回的「最外层元素」上
 * - key 是协调（reconciliation）时匹配新旧节点的身份标识：
 *   key 相同 → 复用并更新节点；key 变了 → 销毁旧节点、新建节点
 * - 用 index 作 key 时，删除/插入/排序会让 index「顶替」到别的数据上，
 *   节点被错误复用，DOM 状态（输入框内容、滚动位置、焦点）随之错位
 * - index 勉强可用的场景：纯展示、列表永不增删/重排、且没有内部状态
 *
 * Vue 对应概念：
 * - v-for="(order, index) in orders" + :key，diff 同样靠 key 匹配新旧节点
 * - :key 用 index 有一模一样的问题——这不是 React 特有的坑
 *
 * 最重要的区别：
 * - 机制几乎一致，差别在写法：React 用 JS 的 .map()（key 是 React 保留属性，不会传给组件）；
 *   Vue 用模板指令 v-for + :key
 * - React 不写 key 会在控制台警告并退化为按 index 匹配；Vue 3 不写 :key 则默认「就地更新」策略
 */
import { ref } from 'vue'
import type { Order } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

const initialOrders: Order[] = [
  { id: 'o1', orderNo: 'SO-1001', customer: '张伟', amount: 528, status: 'pending', createdAt: '2026-08-21', items: [] },
  { id: 'o2', orderNo: 'SO-1002', customer: '李娜', amount: 129, status: 'paid', createdAt: '2026-08-22', items: [] },
  { id: 'o3', orderNo: 'SO-1003', customer: '王强', amount: 2680, status: 'paid', createdAt: '2026-08-23', items: [] },
  { id: 'o4', orderNo: 'SO-1004', customer: '赵敏', amount: 88, status: 'cancelled', createdAt: '2026-08-24', items: [] },
  { id: 'o5', orderNo: 'SO-1005', customer: '陈静', amount: 456, status: 'pending', createdAt: '2026-08-25', items: [] },
]

const orders = ref<Order[]>([...initialOrders])
// 默认用 index 作 key，先亲手踩一次坑——Vue 的 :key 用 index 有一模一样的问题
const useIndexKey = ref(true)

function removeOrder(id: string) {
  orders.value = orders.value.filter((o) => o.id !== id)
}

function resetOrders() {
  orders.value = [...initialOrders]
}
</script>

<template>
  <div class="stack">
    <div class="card stack">
      <h3>亲手观察 key 的 bug（Vue 同样会踩）</h3>
      <ol>
        <li>保持「用 index 作 key」，在前两行的备注框里输入不同内容（如「加急」「送礼」）</li>
        <li>删除第一行 → 「加急」跑到了 SO-1002 的行里：备注错位了！</li>
        <li>点「重置列表」，切换成「用 id 作 key」，重复上面的操作 → 备注跟着行走，一切正常</li>
      </ol>
      <div class="row">
        <label>
          <input
            v-model="useIndexKey"
            type="checkbox"
          >
          用 index 作 key（错误示范）
        </label>
        <button @click="resetOrders">
          重置列表
        </button>
        <span class="muted">当前 key：{{ useIndexKey ? 'index' : 'order.id' }}</span>
      </div>
    </div>

    <div class="card stack">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>金额</th>
            <th>状态</th>
            <th>备注（暴露 key 问题用）</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- v-for + :key。React 对应 orders.map((order, index) => <tr key={...}>)，
               key 写在 map 返回的最外层元素上；Vue 里 :key 就写在 v-for 所在元素上。
               :key 的道理与 React 完全一致：key 是节点「身份证」，必须稳定且唯一——
               用 index 时删除第一行，后面的行 index 前移被错误复用，
               备注输入框的内容（存在 DOM 里）就错位了。 -->
          <tr
            v-for="(order, index) in orders"
            :key="useIndexKey ? index : order.id"
          >
            <td>{{ order.orderNo }}</td>
            <td>{{ order.customer }}</td>
            <td>¥{{ order.amount }}</td>
            <td>
              <span :class="`badge badge-${order.status}`">
                {{ ORDER_STATUS_TEXT[order.status] }}
              </span>
            </td>
            <td>
              <!-- 故意不写 v-model：内容只存在 DOM 里，让「节点被错误复用」肉眼可见。
                   React 那边同样是非受控 input，两边现象一致 -->
              <input placeholder="输入备注后再删除第一行">
            </td>
            <td>
              <!-- Vue 模板里直接写调用即可；React 要包箭头函数（见第 4 题） -->
              <button
                class="btn-danger"
                @click="removeOrder(order.id)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p
        v-if="orders.length === 0"
        class="muted"
      >
        订单已删光，点上面的「重置列表」恢复
      </p>
    </div>
  </div>
</template>
