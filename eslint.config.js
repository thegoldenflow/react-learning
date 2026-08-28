import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  // 必须放在 tseslint 之后：它会把 *.vue 重新指派给 vue-eslint-parser（后写的配置生效）
  ...pluginVue.configs['flat/recommended'],
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
    // 只作用于 .tsx（React 代码）。绝不作用于 .vue/.ts：
    // rules-of-hooks 会把 Vue composable（如 setup 里的 useXxxStore()）误判为 React Hook。
    // 项目约定：React 代码一律 .tsx，Vue 代码一律 .vue/.ts。
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  { languageOptions: { globals: globals.browser } },
)
