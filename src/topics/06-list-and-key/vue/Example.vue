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
 * - key 还有第二种用法（不限于列表）：给同一个组件换一个 key，等于告诉 React「这是另一个东西」，
 *   旧实例连同它的 state / effect 一起卸载、新实例重新挂载 —— 这是官方推荐的
 *   「prop 变了要重置内部 state」解法：<EditForm key={selectedId} />
 *
 * Vue 对应概念：
 * - v-for="(order, index) in orders" + :key，diff 同样靠 key 匹配新旧节点
 * - :key 用 index 有一模一样的问题——这不是 React 特有的坑
 * - :key 变了同样会销毁重建组件实例、内部 state 全部丢弃；
 *   Vue 老手熟悉的 <router-view :key="$route.fullPath"> 就是这个手法
 *
 * 最重要的区别：
 * - 机制几乎一致，差别在写法：React 用 JS 的 .map()（key 是 React 保留属性，不会传给组件）；
 *   Vue 用模板指令 v-for + :key
 * - React 不写 key 会在控制台警告并退化为按 index 匹配；Vue 3 不写 :key 则默认「就地更新」策略
 * - 「换 key 重置组件状态」是少数两边机制、写法、心智模型都一模一样的知识点，可以放心平移
 */
import { computed, ref } from 'vue'
import type { Order } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'
// 子组件必须单独拆成 .vue 文件；React 版的 OrderNoteEditor 就写在同一个 .tsx 里
import OrderNoteEditor from './OrderNoteEditor.vue'

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

// ↓ 下面这两行服务于「换 :key 重置状态」区块。
// 故意读常量 initialOrders 而不是可增删的 orders，让这个演示不受上面删除操作的干扰
const selectedOrderId = ref(initialOrders[0].id)
// 「选中的订单对象」能由 selectedOrderId 直接算出来，就不要再存一份状态（第 9 题：派生状态）
const selectedOrder = computed(
  () => initialOrders.find((o) => o.id === selectedOrderId.value) ?? initialOrders[0],
)

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

    <!-- ===== :key 的第二种用法：不在列表里，而是用来强制重置一个组件的内部状态 ===== -->
    <div class="card stack">
      <h3>换 :key = 重置组件内部状态</h3>
      <ol>
        <li>先在下面两个「草稿备注」框里各改点内容（比如都加上「加急」）</li>
        <li>点下面那排按钮，切换到另一个订单</li>
        <li>【不换 :key】那张：草稿原封不动残留着，还是上一个订单的内容 → 脏数据</li>
        <li>【换 :key】那张：草稿自动重置成新订单的初始值 → 这才是想要的效果</li>
      </ol>
      <div class="row">
        <span class="muted">当前编辑的订单：</span>
        <!-- 这排按钮本身也是列表渲染，:key 用稳定唯一的 o.id，不用 index -->
        <button
          v-for="o in initialOrders"
          :key="o.id"
          :class="{ 'btn-primary': o.id === selectedOrderId }"
          @click="selectedOrderId = o.id"
        >
          {{ o.orderNo }}
        </button>
      </div>

      <div
        class="row"
        style="align-items: stretch"
      >
        <div
          class="card stack"
          style="flex: 1 1 280px"
        >
          <strong class="error-text">【不换 :key】状态残留</strong>
          <code>&lt;OrderNoteEditor :order="selectedOrder" /&gt;</code>
          <!-- 没有 :key 时，Vue 按「同位置 + 同组件」判定这还是原来那个实例，
               只更新 props、setup 不重跑 → draft 停在上一个订单的草稿上。
               和 React 那边不写 key 的表现一模一样。 -->
          <OrderNoteEditor :order="selectedOrder" />
        </div>

        <div
          class="card stack"
          style="flex: 1 1 280px"
        >
          <strong class="success-text">【换 :key】状态归零</strong>
          <code>&lt;OrderNoteEditor :key="selectedOrder.id" :order="selectedOrder" /&gt;</code>
          <!-- :key 变了 → Vue 卸载旧组件实例（状态丢弃、onUnmounted 触发、DOM 删除），
               再创建一个全新实例（setup 重新执行、ref 初始值重新求值）。
               ★ 注意这里的 :key 根本不在任何 v-for 里：key 从来不是「列表专用属性」，
                 它就是节点身份标识，「列表匹配」和「强制重置」是同一个机制的两种用法。
               ★ 这条在 Vue 和 React 里是完全一致的机制，可以放心平移——
                 你熟悉的 <router-view :key="$route.fullPath"> 就是同一个手法。 -->
          <OrderNoteEditor
            :key="selectedOrder.id"
            :order="selectedOrder"
          />
        </div>
      </div>

      <!-- 「props 变了、由 props 派生的状态要跟着重置」这类需求：
           反模式是 watch(() => props.order, () => { draft.value = ... }, { immediate: true })
           （React 对应的反模式是 useEffect 里 setState，第 10 题有完整清单）；
           推荐解法就是本例的换 :key，一次渲染直接出正确结果。
           更进一步：能由 props 直接算出来的就用 computed 别存 ref（第 9 题），
           父组件也要读到就把状态提升上去（第 8 题）。
           ⚠ 别滥用：:key 一变整棵子树重置，滚动位置丢失、子组件重新发请求、动画重放、输入框失焦。 -->
      <p class="muted">
        一张残留、一张归零——这就是「key 变化 = 销毁旧实例 + 创建新实例」最直接的证据
      </p>
    </div>
  </div>
</template>
