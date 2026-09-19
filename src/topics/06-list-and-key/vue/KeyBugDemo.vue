<script setup lang="ts">
/**
 * 区块二：:key 是身份。对照 react/KeyBugDemo.tsx。
 * - 【最常用】:key 用数据自带的 id；【常用】前端新建的数据在创建时生成 id（demoData.ts 的 createLocalOrder），之后每次渲染 key 都不变。
 * - ❌ 不写 :key：Vue 用「就地更新」（in-place patch）——「The default behavior of v-for will try to patch the elements in-place without moving them.」
 *   按位置复用 DOM，效果和 React 用 index 作 key 一样：开头插入后备注错位（测试覆盖）。
 *   官方：「This default mode is efficient, but only suitable when your list render output does not rely on child component state or temporary DOM state (e.g. form input values).」
 *   React 不写 key 时同样按位置匹配，只是多一条开发期报错；Vue 运行时不报警（测试覆盖），模板里由 eslint-plugin-vue 的 vue/require-v-for-key 拦（下面那一行用 eslint-disable 放行了）。
 * - ❌ :key 用 index：同样错位；❌ :key 用 Math.random()：每次重渲染都重建，输入全丢（测试覆盖）。
 * - 【最常用】改数组直接调变更方法 unshift / push / splice：「Vue is able to detect when a reactive array's mutation methods are called and trigger necessary updates.」
 *   【常用】filter / slice 这类方法返回新数组时整体替换（「we should replace the old array with the new one」），下面的「重置列表」就是整体替换。
 *   React 的 state 要造新数组交给 setter（原地改完再传同一个引用会被跳过，03 题区块三）。
 * - 初始值先拷贝一份：ref 装数组时内部用 reactive() 转成 Proxy，Proxy 包的是原数组；直接 ref(INITIAL_ORDERS) 再 unshift，改掉的是模块常量，「重置列表」就回不去了（测试覆盖）。
 *   [...INITIAL_ORDERS] 是浅拷贝：数组是新的，里面的订单对象还是常量里那几个，要改订单字段得先拷贝对象。
 * - key 要用原始值：「The key binding expects primitive values - i.e. strings and numbers. Do not use objects as v-for keys.」（API 页写的类型是 number | string | symbol）；
 *   「Duplicate keys will cause render errors.」—— 3.5.42 开发构建实测：挂载时不检查，更新时走到乱序比较那一步才出一条 [Vue warn]，界面也会出错（测试覆盖）。
 * - 演示简化：备注输入框是非受控的，为了让「DOM 被错误复用」看得见；真实项目里备注按 order.id 存在响应式数据里。
 */
import { ref } from 'vue'
import type { Order } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'
import { createLocalOrder, INITIAL_ORDERS } from './demoData'

type KeyMode = 'none' | 'index' | 'id' | 'random'
const keyMode = ref<KeyMode>('none')
const orders = ref<Order[]>([...INITIAL_ORDERS])
const renderRound = ref(0)
</script>

<template>
  <div class="card stack">
    <h3>区块二：:key 是身份 —— 不写、index、id、Math.random()</h3>
    <p class="muted">
      先在前两行的备注框里各打几个字，再点下面的按钮，看备注还在不在自己那一行。
    </p>
    <p class="muted">
      「开头插入 / 末尾追加」的新行在创建数据时就生成了 id（createLocalOrder）【常用】；改数组直接调 unshift / push / splice【最常用】。
    </p>
    <div class="row">
      <label class="row">
        :key 用
        <select
          v-model="keyMode"
          aria-label="key 的取法"
        >
          <option value="none">不写 ❌（就地更新）</option>
          <option value="index">index ❌（开头插入 / 删除时错位）</option>
          <option value="id">order.id（数据自带的 id）【最常用】</option>
          <option value="random">Math.random() ❌（每次渲染都重建）</option>
        </select>
      </label>
    </div>
    <div class="row">
      <button @click="orders.unshift(createLocalOrder('新客户（开头）'))">
        开头插入一行
      </button>
      <button @click="orders.push(createLocalOrder('新客户（末尾）'))">
        末尾追加一行
      </button>
      <button @click="orders.splice(0, 1)">
        删除第一行
      </button>
      <button @click="renderRound++">
        让列表重渲染（{{ renderRound }}）
      </button>
      <button
        class="btn-ghost"
        @click="orders = [...INITIAL_ORDERS]"
      >
        重置列表
      </button>
    </div>
    <table>
      <thead>
        <tr>
          <th>订单号</th>
          <th>客户</th>
          <th>状态</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="keyMode === 'none'">
          <!-- eslint-disable-next-line vue/require-v-for-key -- 教学反例：故意不写 :key，演示就地更新 -->
          <tr v-for="order in orders">
            <td>{{ order.orderNo }}</td>
            <td>{{ order.customer }}</td>
            <td>
              <span :class="`badge badge-${order.status}`">{{ ORDER_STATUS_TEXT[order.status] }}</span>
            </td>
            <td>
              <input
                placeholder="打几个字"
                :aria-label="`${order.orderNo} 的备注`"
              >
            </td>
          </tr>
        </template>
        <template v-else>
          <tr
            v-for="(order, index) in orders"
            :key="keyMode === 'index' ? index : keyMode === 'id' ? order.id : Math.random()"
          >
            <td>{{ order.orderNo }}</td>
            <td>{{ order.customer }}</td>
            <td>
              <span :class="`badge badge-${order.status}`">{{ ORDER_STATUS_TEXT[order.status] }}</span>
            </td>
            <td>
              <input
                placeholder="打几个字"
                :aria-label="`${order.orderNo} 的备注`"
              >
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <p
      v-if="orders.length === 0"
      class="muted"
    >
      订单删光了，点「重置列表」恢复
    </p>
  </div>
</template>
