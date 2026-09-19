<script setup lang="ts">
/**
 * 区块六【少用】：滚轮。对照 react/PassiveWheelDemo.tsx。拦截滚轮只在自定义缩放、横向轮播这类场景用得到（工程经验），
 * 整块在 Example.vue 里已注释（取消注释即可运行）；本文件保留，Example.test.ts 直接挂载它。
 * - Vue 不给 wheel 加 passive：v-on 在元素上 addEventListener 时只带修饰符声明的选项，所以 @wheel.prevent 直接生效（测试覆盖）；
 *   React 的 onWheel 是被动监听，要拦滚轮得自己 addEventListener(…, { passive: false })。
 *   （浏览器把 window / document / body 上的 wheel、touchstart、touchmove 默认当成 passive，MDN ③；绑在普通元素上不受影响。）
 * - .passive 是反过来的显式声明：「attaches a DOM event with { passive: true }」，用在只读滚动 / 触摸的监听上提升性能；「Do not use .passive and .prevent together」。
 */
import { ref } from 'vue'

const zoom = ref(100)

function handleWheel(e: WheelEvent) {
  zoom.value = Math.min(200, Math.max(50, zoom.value + (e.deltaY < 0 ? 10 : -10)))
}
</script>

<template>
  <div class="card stack">
    <h3>区块六【少用】：滚轮 —— @wheel.prevent 直接生效</h3>
    <div
      data-testid="vue-wheel"
      style="height: 80px; overflow: hidden; border: 1px dashed currentColor; padding: 8px"
      @wheel.prevent="handleWheel"
    >
      @wheel.prevent：缩放 <strong data-testid="zoom">{{ zoom }}%</strong>
    </div>
  </div>
</template>
