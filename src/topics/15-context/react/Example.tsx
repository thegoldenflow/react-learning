/**
 * 学习主题：Context 跨层传值（主题切换）
 *
 * React 核心概念：
 * - 问题：props 要穿过一堆根本不关心它的中间层组件（prop drilling）；Context 让深层组件「跳过中间层」直接读
 * - createContext 创建 Context；根组件用 <ThemeContext value={...}> 提供；深层组件用 useContext 读取
 * - 工业惯例：不直接暴露 useContext(ThemeContext)，而是封装 useTheme() 自定义 Hook，
 *   缺 Provider 时直接 throw——把「忘了包 Provider」变成开发期就炸的明确错误
 * - Context 适合低频全局数据（主题 / 登录用户 / 语言），不是完整状态管理方案，不要拿它当 store
 *   （高频复杂共享状态见 16 题 Zustand）
 * - 重渲染问题：value 一变，所有消费组件全部重渲染；value 是对象时若每次渲染新建，
 *   引用次次不同 = 次次「变化」→ 全员无谓重渲染。工业标准写法：useMemo 包 value（+ useCallback 稳定其中的函数）
 *
 * Vue 对应概念：
 * - provide / inject 解决同一个问题；InjectionKey<T> 提供类型安全（inject 能自动推断出 T）
 * - 同样的工业惯例：封装 useTheme() composable，inject 不到就 throw
 * - provide 传响应式对象（ref）时依赖追踪是属性级的，天然没有「value 引用变化导致全员重渲染」的问题
 *
 * 最重要的区别：
 * - React Context 以「value 的引用」为粒度判定变化：引用一变，所有 useContext 的组件整体重渲染，
 *   所以才需要 useMemo 包 value
 * - Vue 的 provide 传的是响应式对象（setup 只执行一次，对象只创建一次），依赖记到属性，
 *   重新渲染的是读过该属性的组件 ——两边的更新粒度模型没有一一对应关系
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

/**
 * createContext<ThemeContextValue | null>(null)：
 * 默认值故意给 null，而不是编一个假的 { theme: 'light', toggleTheme: () => {} }——
 * 假默认值会把「忘了包 Provider」这个 bug 静默吞掉（页面能跑但点了没反应）。
 * Vue 里对应 const THEME_KEY: InjectionKey<ThemeInjection> = Symbol(...)，
 * 类型参数的作用相同：让读取方拿到精确类型。
 */
const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * 工业惯例：封装 useTheme() 自定义 Hook，组件永远不直接 useContext(ThemeContext)。
 * 好处：
 * 1) 缺 Provider 时立刻 throw，错误信息明确，而不是深层组件里莫名其妙的 null；
 * 2) throw 之后返回值类型收窄为 ThemeContextValue，调用方不用每次判空；
 * 3) Context 对象本身不用导出，实现细节被封装住。
 * 面试考点：「Context 的最佳实践」，标准答案就是这个 Provider + 自定义 Hook + throw 的组合。
 * Vue 里对应封装 useTheme() composable：inject(THEME_KEY) 不到就 throw，惯例一模一样。
 */
function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (ctx === null) {
    throw new Error('useTheme() 必须在 <ThemeContext value={...}> 内部使用——是否忘了包 Provider？')
  }
  return ctx
}

/** 两套主题的实际样式（全局 CSS 不含主题色，这里用内联样式演示，与 Vue 版一致） */
const THEME_STYLES: Record<Theme, CSSProperties> = {
  light: { background: '#ffffff', color: '#1f2937', border: '1px solid #d1d5db' },
  dark: { background: '#1f2937', color: '#f9fafb', border: '1px solid #4b5563' },
}

/**
 * 中间层组件：只负责布局，完全不认识 theme——
 * 它没有接收 theme prop，也没有 useContext，却包着两个要用 theme 的深层组件。
 * 这就是 Context 的价值：数据「跳过」了它。若没有 Context，theme 和 toggleTheme
 * 都得作为 props 从它手上过一遍（prop drilling）。
 * （React 的子组件可以和父组件写在同一个 .tsx 文件里——组件只是函数；
 * Vue 的 SFC 一文件一组件，对应的 MiddleLayer 是单独的 .vue 文件。）
 */
function MiddleLayer({ children }: { children: ReactNode }) {
  return (
    <div className="card stack">
      <p className="muted">MiddleLayer（中间层：只管布局，不接触 theme——被 Context「跳过」）</p>
      {children}
    </div>
  )
}

/** 深层组件一：只读 theme。Vue 版是 ThemedCard.vue，里面用 useTheme()（内部是 inject） */
function ThemedCard() {
  // 跳过 MiddleLayer 直接读 Context——props 没有经过任何中间层
  const { theme } = useTheme()
  return (
    <div className="card" style={THEME_STYLES[theme]}>
      <strong>ThemedCard（深层组件）</strong>
      <p>当前主题：{theme === 'light' ? '☀️ light' : '🌙 dark'}</p>
      <p>我通过 useTheme() 直接读 Context，props 没有经过中间层。</p>
    </div>
  )
}

/**
 * 深层组件二：除了读 theme，还拿到 toggleTheme——
 * Context 的 value 里既放数据也放修改函数，深层组件可以直接触发根组件的状态更新。
 */
function ThemedButton() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button style={THEME_STYLES[theme]} onClick={toggleTheme}>
      切换到 {theme === 'light' ? 'dark' : 'light'} 主题
    </button>
  )
}

export default function Example() {
  // 主题的「真身」仍是根组件的普通 state——Context 只负责「传」，不负责「存」
  const [theme, setTheme] = useState<Theme>('light')

  // useCallback 让 toggleTheme 引用稳定（函数式更新，依赖为空数组），
  // 否则每次渲染新建函数，下面 useMemo 的依赖 [theme, toggleTheme] 次次变化，useMemo 就白包了
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  /**
   * 工业标准写法：useMemo 包住 value。
   * 若直接写 <ThemeContext value={{ theme, toggleTheme }}>，这个字面量对象在
   * 「根组件每次渲染」时都是新引用；Context 用 Object.is 对比 value，新引用 = 有变化，
   * 于是根组件因任何原因重渲染（哪怕和主题无关），所有消费组件都被连坐重渲染。
   * useMemo 后：theme 不变则 value 引用不变，消费组件安然不动。
   * 面试考点：「Context 有什么性能问题？怎么优化？」——答 value 引用稳定（useMemo）、
   * 按变化频率拆分多个 Context、消费组件配合 React.memo。
   * Vue 对照：provide 的对象在 setup 里只创建一次（setup 只执行一次），且依赖追踪是属性级的
   * ——谁读了 theme 谁才更新，根本不存在这个问题，所以 Vue 没有对应 useMemo 包 value 的步骤。
   */
  const value = useMemo<ThemeContextValue>(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    // React 19 起 Context 本身可直接当 Provider 组件用；React 18 及更早写 <ThemeContext.Provider value={...}>
    // Vue 里对应 setup 里的一行 provide(THEME_KEY, {...})——是函数调用，不是包裹组件
    <ThemeContext value={value}>
      <MiddleLayer>
        <ThemedCard />
        <ThemedButton />
      </MiddleLayer>
    </ThemeContext>
  )
}
