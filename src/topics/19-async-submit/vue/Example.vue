<script setup lang="ts">
/**
 * 主题：19. 异步提交与防重复（Vue 对照）
 * 适用版本：Vue 3.5 · vue-router 5.x
 * 最后核对：2026-09-17
 * 前置主题：07、12、23、27（同 React 侧）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 *
 * 完整的十段讲解（30 秒速答、核心概念、关键区别、追问、易错点、生产注意、旧写法、新动向、练习、参考）
 * 在 react/Example.tsx；本文件列出 Vue 这一侧的要点。
 *
 * Vue 这一侧的要点：
 * - @submit.prevent + ref(false) + :disabled + try / catch / finally【主流】，和 React 手写版逐行对应（ManualSubmitForm.vue）。
 * - ref 同步读写，没有渲染快照：同一轮事件里第二次提交读到的 submitting 已经是 true，守卫就够，不需要额外的锁。
 * - 错误分层同 React：字段错误显示在字段旁并聚焦（等 nextTick 之后，输入框解除 disabled 才能 focus），网络错误 role="alert" + 重试。
 * - 事件处理函数里的错误（同步 throw 和 async 函数返回的 Promise 拒绝）会进入父组件的 onErrorCaptured /
 *   app.config.errorHandler（runtime-core.cjs.js:205-213，Example.test.ts 有断言）；可预期的错误仍然自己 catch 后显示。
 * - 提交成功要跳转时 await router.push()，它返回 Promise，导航结束后才 resolve。
 * - React 19 的 <form action> / useActionState / useFormStatus 在 Vue 没有内置对应物（下方说明卡片）。
 */
import ManualSubmitForm from './ManualSubmitForm.vue'
</script>

<template>
  <div class="stack">
    <ManualSubmitForm />

    <div class="card stack">
      <h3>区块二：React 19 Actions 在 Vue 里怎么写</h3>
      <p class="muted">
        Vue 没有 &lt;form action&gt;、useActionState、useFormStatus 这类内置写法，照常写区块一的 async 函数 + ref 状态即可。
      </p>
      <p class="muted">
        React 那边区块二演示的三件事，在 Vue 里分别对应：pending 状态自己用 ref 维护；重复提交靠守卫直接拦下（React 的 Actions 是排队执行）；
        成功后清空输入框自己把 ref 置空（React 会自动重置非受控字段，返回错误也会重置）。
      </p>
    </div>
  </div>
</template>
