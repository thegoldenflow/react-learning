<script setup lang="ts">
/**
 * 区块四 Vue 对照：错误的传播规则与 app.config.errorHandler（对照 react/RootOptionsDemo.tsx 的 createRoot 回调）。
 * 官方传播规则（composition-api-lifecycle 页）：多个 errorCaptured「will be invoked on the same error, in the order of bottom to top」；
 * 默认最后还会送到 app.config.errorHandler；某一层 return false 就停下，后面的 errorCaptured 和 errorHandler 都不再调用。
 * 演示需要：真实项目在 main.ts 里 createApp 之后设置 app.config.errorHandler；这里在卡片里另建一个小 Vue 应用来观察。
 * 三个小组件用 defineComponent + h 写在本文件里，方便对照阅读。
 */
/* eslint-disable vue/one-component-per-file -- 三个几行的小组件只为演示传播顺序，放在一起更好读 */
import { createApp, defineComponent, h, onBeforeUnmount, onErrorCaptured, onMounted, ref, useTemplateRef, watch, type App } from 'vue'

const log = ref<string[]>([])
const stopInMiddle = ref(false)
const host = useTemplateRef<HTMLDivElement>('host')
const message = (error: unknown) => (error instanceof Error ? error.message : String(error))
const push = (line: string) => {
  log.value = [...log.value, line].slice(-12)
}

const Thrower = defineComponent({
  name: 'Thrower',
  setup() {
    const boom = () => {
      throw new Error('最里层组件的事件处理函数出错')
    }
    return () => h('button', { class: 'btn-danger', onClick: boom }, '最里层组件抛错')
  },
})

const Middle = defineComponent({
  name: 'Middle',
  props: { stop: Boolean },
  setup(props) {
    onErrorCaptured((_err, _instance, info) => {
      push(`① 中间层 errorCaptured（来源：${info}）${props.stop ? ' → return false，到此为止' : ''}`)
      return props.stop ? false : undefined
    })
    return () => h(Thrower)
  },
})

const Outer = defineComponent({
  name: 'Outer',
  props: { stop: Boolean },
  setup(props) {
    onErrorCaptured(() => {
      push('② 外层 errorCaptured')
    })
    return () => h('div', { class: 'row' }, [h(Middle, { stop: props.stop })])
  },
})

let app: App | null = null
let container: HTMLDivElement | null = null

function mountMiniApp() {
  app?.unmount()
  container?.remove()
  if (!host.value) return
  container = document.createElement('div')
  host.value.appendChild(container)
  app = createApp(Outer, { stop: stopInMiddle.value })
  app.config.errorHandler = (err, _instance, info) => {
    push(`③ app.config.errorHandler：${message(err)}（来源：${info}）`)
  }
  app.mount(container)
}

onMounted(mountMiniApp)
watch(stopInMiddle, mountMiniApp)
onBeforeUnmount(() => {
  app?.unmount()
  container?.remove()
})
</script>

<template>
  <div class="card stack">
    <h3>区块四：传播规则与 app.config.errorHandler</h3>
    <div
      ref="host"
      class="card"
    />
    <label class="row">
      <input
        v-model="stopInMiddle"
        type="checkbox"
      >
      中间层 return false
    </label>
    <pre
      class="log"
      aria-label="传播日志"
    >{{ log.length === 0 ? '（点上面的按钮）' : log.join('\n') }}</pre>
    <p class="muted">
      不勾：① → ② → ③，自下而上一层层调用，最后到全局；勾上：只有 ①。React 的边界只交给最近的一个，不会逐级调用。
    </p>
  </div>
</template>
