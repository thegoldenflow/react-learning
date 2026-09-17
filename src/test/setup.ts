/**
 * 全部测试共用的初始化（vitest.config.ts 的 setupFiles）——项目基础设施，不是知识点。
 * - 给 expect 加上 jest-dom 的 DOM 断言：toBeInTheDocument、toHaveTextContent 等。
 * - vitest.config.ts 开了 globals，Testing Library 会在每个测试后自动 cleanup，这里不用手写 afterEach。
 */
import '@testing-library/jest-dom/vitest'
