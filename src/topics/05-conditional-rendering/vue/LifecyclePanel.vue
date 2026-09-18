<script setup lang="ts">
/**
 * 区块四的面板（对照 react/HideVsUnmountDemo.tsx 的 Panel）：点赞数是 ref，输入框是非受控的（打的字只在 DOM 里）。
 * 生命周期钩子记日志：挂载 / 卸载，以及被 <KeepAlive> 缓存时的停用 / 激活。
 */
import { onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue'

const { name, log } = defineProps<{ name: string; log: (line: string) => void }>()
const likes = ref(0)

onMounted(() => log(`${name}：onMounted`))
onUnmounted(() => log(`${name}：onUnmounted`))
onActivated(() => log(`${name}：onActivated`))
onDeactivated(() => log(`${name}：onDeactivated`))
</script>

<template>
  <div
    class="stack"
    :data-testid="`panel-${name}`"
  >
    <div class="row">
      <strong>{{ name }}</strong>
      <button @click="likes++">
        点赞 {{ likes }}
      </button>
    </div>
    <input
      placeholder="随便打几个字"
      :aria-label="`${name} 的输入框`"
    >
  </div>
</template>
