import { defaultClientConditions } from 'vite'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Vitest 配置：在 vite.config.ts 的基础上追加测试专用项，
// 测试与开发服务器共用同一套插件（plugin-react + plugin-vue）和 @ 别名。
export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      // 按浏览器应用的解析条件（module / browser / development|production）挑依赖的入口文件。
      // 不加时（2026-09-17 实测）：测试里 `react-router` 解析到 CJS 的 dist/development/index.js，
      // 而 `react-router/dom` 的 CJS 入口内部 require('react-router') 被 Node 22 按 module-sync
      // 条件解析成 ESM 的 index.mjs —— 同一个包加载出两份实例，两份 Context 互不相通，
      // 用 react-router/dom 的 RouterProvider 渲染时 useParams() 读到空对象。
      // 加上后两个入口都解析到 .mjs，共用同一份 chunk；vue、react、@vue/test-utils 的解析结果不变。
      conditions: [...defaultClientConditions],
    },
    test: {
      // 组件测试需要 DOM
      environment: 'jsdom',
      // describe / it / expect / vi 不用逐个导入；@testing-library/react 与 @testing-library/vue
      // 也靠全局 afterEach 自动 cleanup
      globals: true,
      // 每个测试文件运行前先执行（给 expect 装上 jest-dom 断言）
      setupFiles: ['./src/test/setup.ts'],
    },
  }),
)
