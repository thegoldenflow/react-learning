import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'

// 本项目在同一个 Vite 应用里同时运行 React 和 Vue：
// - plugin-react 负责 .tsx（React 示例 + 壳应用）
// - plugin-vue 负责 .vue（Vue 对照示例）
// 两个插件按文件扩展名各管各的，互不干扰。
export default defineConfig({
  plugins: [
    vue(),
    react({
      // plugin-react 5.x 默认就不会处理 .vue 编译出的虚拟子模块，
      // 这里显式 exclude 是保险（若未来升级 Vite 8 + plugin-react 6 则是必需）。
      // 注意：自定义 exclude 会覆盖默认的 node_modules 排除，需要一并加回。
      exclude: [/\/node_modules\//, /\.vue$/],
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
