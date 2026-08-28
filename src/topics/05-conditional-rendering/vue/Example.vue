<script setup lang="ts">
/**
 * 学习主题：条件渲染（三元、&&、提前 return / switch、映射对象）
 *
 * React 核心概念：
 * - JSX 没有指令，条件渲染就是普通 JavaScript：三元表达式、&& 短路、if / switch 提前 return
 * - 分支多时工业界常用 switch 辅助函数（或子组件）以及「状态 → 内容」的映射对象
 * - && 的经典陷阱：左侧是数字 0 时，JSX 会把 0 渲染到页面上（false/null/undefined 才不渲染）
 *
 * Vue 对应概念：
 * - v-if / v-else-if / v-else 模板指令描述分支；v-show 只切换 display，DOM 一直在
 * - v-if 对任何 falsy 值（包括 0）都不渲染，没有 0 陷阱
 *
 * 最重要的区别：
 * - Vue 用模板指令描述分支；React 用 JS 本身的控制流，JSX 只是表达式
 * - {count && <X/>} 在 React 会把 0 渲染出来；正确写法是 count > 0 && <X/>
 * - v-show 在 React 没有指令对应物（没有一一对应关系），要手动用 style 的 display 控制
 */
import { ref } from 'vue'
import type { OrderStatus } from '@/shared/types'
import { ORDER_STATUS_TEXT } from '@/shared/types'

const status = ref<OrderStatus>('pending')
const itemCount = ref(3)
const showDetail = ref(true)
</script>

<template>
  <div class="stack">
    <div class="card stack">
      <h3>
        订单状态
        <!-- 「映射对象」查表取文案：这一点两边写法一致（React 里也是 ORDER_STATUS_TEXT[status]） -->
        <span :class="`badge badge-${status}`">{{ ORDER_STATUS_TEXT[status] }}</span>
      </h3>

      <!-- 切换状态的按钮组：当前状态的按钮禁用 -->
      <div class="row">
        <button
          :disabled="status === 'pending'"
          @click="status = 'pending'"
        >
          设为待支付
        </button>
        <button
          :disabled="status === 'paid'"
          @click="status = 'paid'"
        >
          设为已支付
        </button>
        <button
          :disabled="status === 'cancelled'"
          @click="status = 'cancelled'"
        >
          设为已取消
        </button>
      </div>

      <!-- 三分支「完全不同的 UI」：Vue 用 v-if / v-else-if / v-else 就地表达，无需子组件。
           React 那边是 switch + return 的 StatusPanel 子组件（且与父组件同文件——
           React 允许一个文件多个组件，Vue SFC 是一文件一组件） -->
      <div
        v-if="status === 'pending'"
        class="stack"
      >
        <p class="error-text">
          订单待支付，请在 30 分钟内完成付款
        </p>
        <p class="muted">
          超时未支付将自动取消
        </p>
      </div>
      <div
        v-else-if="status === 'paid'"
        class="stack"
      >
        <p class="success-text">
          支付成功！
        </p>
        <p class="muted">
          商品将在 48 小时内发出
        </p>
      </div>
      <div
        v-else
        class="stack"
      >
        <p class="muted">
          订单已取消
        </p>
      </div>

      <!-- 二选一：模板插值里同样可以写三元，与 React 一致 -->
      <p>支付进度：{{ status === 'paid' ? '已完成' : '未完成' }}</p>

      <!-- 只有「渲染 / 不渲染」时 Vue 用 v-if；React 那边对应 && 短路 -->
      <p
        v-if="status === 'cancelled'"
        class="muted"
      >
        已取消的订单可在 24 小时内联系客服恢复
      </p>
    </div>

    <div class="card stack">
      <h3>&& 的 0 陷阱（Vue 没有）</h3>
      <div class="row">
        <button @click="itemCount = 0">
          清空商品（数量设为 0）
        </button>
        <button @click="itemCount = 3">
          恢复为 3 件
        </button>
      </div>

      <!-- v-if="itemCount"：0 是 falsy，直接不渲染，页面不会出现「0」。
           React 里 {itemCount && <span>…</span>} 却会把 0 渲染出来——
           这是 React 特有的坑，Vue 中没有一一对应关系；React 的正确写法是 itemCount > 0 && -->
      <div>
        v-if="itemCount" 的渲染结果：<span v-if="itemCount">购物车共 {{ itemCount }} 件商品</span>
      </div>
      <p class="muted">
        清空后这里什么都不显示（对照 React 反例会多出一个 0）
      </p>
    </div>

    <div class="card stack">
      <h3>「隐藏但保留 DOM」：v-show</h3>
      <button @click="showDetail = !showDetail">
        {{ showDetail ? '隐藏' : '显示' }}订单详情
      </button>
      <!-- v-show：DOM 保留，只切换 display。React 没有对应指令（没有一一对应关系），
           要手写 style={{ display: show ? 'block' : 'none' }}。
           对比：v-if（= React 的三元 / &&）是真正卸载/挂载节点 -->
      <div v-show="showDetail">
        <p>订单号：SO-20260828-001</p>
        <p>收货地址：上海市浦东新区张江高科技园区</p>
        <p class="muted">
          （打开浏览器 DevTools 看：隐藏时这段 DOM 依然存在）
        </p>
      </div>
    </div>
  </div>
</template>
