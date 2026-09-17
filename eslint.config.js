import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import reactHooks from 'eslint-plugin-react-hooks'

// defineConfig / globalIgnores 由 ESLint 核心的 eslint/config 提供。
// typescript-eslint 已把自家的 tseslint.config() 标为 @deprecated，推荐改用 defineConfig()。
export default defineConfig(
  // dist 是构建产物；node_modules 默认就会被忽略
  globalIgnores(['dist']),

  js.configs.recommended,
  tseslint.configs.recommended,
  // 必须放在 tseslint 之后：它会把 *.vue 重新指派给 vue-eslint-parser（后写的配置生效）
  pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        // vue-eslint-parser 把 <script lang="ts"> 交给 TS parser 解析
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
    rules: {
      // 每个知识点的 SFC 都叫 Example.vue，单词名是有意为之
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    // eslint-plugin-react-hooks 7 官方 recommended 预设：rules-of-hooks、exhaustive-deps，
    // 外加 React Compiler 的规则（refs、set-state-in-effect、immutability、static-components 等）。
    // 本项目不启用 React Compiler，但照样用这些规则检查代码。
    // 作用范围：所有 .tsx，以及 React 侧目录（题目的 react/、壳 shell/、桥 bridge/）下的 .ts（自定义 Hook、store）。
    // 不作用于 vue/ 目录下的 .ts：rules-of-hooks 会把 Vue composable（如 useXxxStore()）误判为 React Hook。
    // 切换预设时已有的命中记录在根目录 eslint-suppressions.json（ESLint 批量抑制），
    // 修掉一处后运行 `npx eslint . --prune-suppressions` 同步台账。
    files: ['**/*.tsx', 'src/topics/*/react/**/*.ts', 'src/shell/**/*.ts', 'src/bridge/**/*.ts'],
    ...reactHooks.configs.flat.recommended,
  },
  { languageOptions: { globals: globals.browser } },
)
