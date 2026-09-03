/**
 * 学习主题：useMemo 与 useCallback（配合 React.memo 的性能优化）
 *
 * React 核心概念：
 * - React 的更新模型：父组件 state 一变，默认从它开始整棵子树重跑渲染函数——
 *   子组件不管 props 变没变都会重渲染
 * - React.memo(子组件)：props 浅比较（Object.is 逐个对比）都相同就跳过重渲染——
 *   前提是每个 prop 的引用稳定
 * - useCallback 缓存函数引用：不包的话父组件每次渲染都新建函数 → memo 的浅比较永远不等 →
 *   memo 完全失效（引用相等这条因果链是本题核心）
 * - useMemo 缓存昂贵计算（如 200 条数据的 filter + sort），依赖不变时复用上次结果
 * - 不要无脑 useMemo/useCallback：有内存与心智成本，绝大多数组件根本不需要；
 *   先用 React DevTools Profiler 量测出瓶颈再优化
 * - React Compiler 正在把这类手动 memo 化逐步自动化（知道有这回事即可，不展开）
 *
 * Vue 对应概念：
 * - computed：自动依赖追踪 + 自动缓存，相当于「不用手写依赖数组的 useMemo」
 * - Vue 是组件级精准更新：父组件重渲染时，props 没变的子组件根本不会更新——
 *   memo / useCallback 在 Vue 里没有对应物，因为不需要
 * - Vue 编译器还会自动缓存模板里的内联事件处理函数（相当于自动帮你 useCallback）
 *
 * 最重要的区别：
 * - 两个框架的性能模型根本不同：React 默认「全量重跑 + 手动挡优化（memo/useMemo/useCallback）」，
 *   Vue 默认「依赖追踪 + 自动挡精准更新」；React 这三件套是在弥补「默认全量重跑」，
 *   Vue 天然不需要它们——没有一一对应关系
 */
import { memo, useCallback, useMemo, useState } from 'react'
import type { Product } from '@/shared/types'

const CATEGORIES = ['键盘', '耳机', '显示器', '音箱'] as const

type SortOrder = 'default' | 'asc' | 'desc'

/** 生成约 200 条确定性的商品数据（取模制造「伪随机」价格 / 库存，每次刷新一致，便于观察） */
function generateProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, i) => {
    const category = CATEGORIES[i % CATEGORIES.length]
    return {
      id: `p${i + 1}`,
      name: `${category}型号-${String(i + 1).padStart(3, '0')}`,
      price: ((i * 37) % 1900) + 99,
      category,
      stock: (i * 13) % 50,
    }
  })
}

interface ProductRowProps {
  product: Product
  selected: boolean
  onSelect: (id: string) => void
}

/**
 * 列表行组件，用 React.memo 包裹：props 浅比较都相同就跳过本次重渲染。
 * console.count 让你亲眼验证——打开控制台：
 * - 点「触发无关重渲染」：父组件重跑了，但这里的计数【不动】（memo 生效，200 行全部跳过）；
 * - 点某行「选中」：首次选中或取消选中只 +1（只有那一行的 selected 变了），从 A 行切到 B 行才 +2
 *   （A 取消 + B 选中），其余行 props 没变，跳过；
 * - 改搜索/筛选/排序：只有仍在列表里的行不重渲染，新出现的行会渲染。
 * 试一试：把下面的 memo(...) 去掉、或把父组件的 useCallback 去掉，再点「触发无关重渲染」，
 * 计数会一次性 +200——这就是「引用不稳定 → memo 失效」的直观代价。
 * （注意：本项目壳应用开着 StrictMode，开发期组件函数每次渲染会执行两遍，
 * 控制台数字大约是上述的两倍——看相对变化即可，「不动」的仍然一动不动。）
 * Vue 对照：ProductRow.vue 完全没有 memo 这层包装，父组件更新时 props 没变的子组件
 * 根本不会更新，是框架默认行为（自动挡）。
 */
const ProductRow = memo(function ProductRow({ product, selected, onSelect }: ProductRowProps) {
  console.count('[17-React] ProductRow 渲染次数')
  return (
    <tr style={selected ? { outline: '2px solid #3b82f6' } : undefined}>
      <td>{product.name}</td>
      <td>{product.category}</td>
      <td>￥{product.price.toFixed(2)}</td>
      <td>{product.stock}</td>
      <td>
        <button onClick={() => onSelect(product.id)}>{selected ? '取消选中' : '选中'}</button>
      </td>
    </tr>
  )
})

export default function Example() {
  // 真实项目里商品列表通常来自接口或 props，这里放进 state 模拟这一点——
  // 所以它要进下面 useMemo 的依赖数组（如果是模块级常量则不必进）
  const [products] = useState<Product[]>(() => generateProducts(200))
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // 与列表完全无关的 state：专门用来演示「父组件因无关原因重渲染」时 memo/useMemo 是否兜得住
  const [unrelatedCount, setUnrelatedCount] = useState(0)

  /**
   * useMemo 缓存 filter + sort 的结果：依赖 [products, keyword, category, sortOrder]
   * 都没变时直接复用上次的数组（控制台里「filter+sort 计算次数」不动）。
   * 这里 useMemo 同时命中了它值得用的两个理由（见 09 题）：
   * 1) 计算相对昂贵：200 条数据的两轮 filter + 一轮 sort，每次无关渲染都白算一遍很浪费；
   * 2) 引用稳定：visibleProducts 是数组，不缓存的话每次渲染都是新数组引用——
   *    即使内容一样，下游依赖它的一切（若有 effect / memo 子组件直接接收它）都会被牵动。
   * Vue 对照：computed(() => ...) 自动追踪依赖 + 自动缓存，作用相当于「不用手写依赖数组的 useMemo」，
   * 但不是等价物（见头注释：一个靠依赖追踪，一个靠手写依赖数组做比较）。
   * 注意依赖数组是手写的：写漏一个（比如漏了 sortOrder）就会拿到过期结果——
   * 这类 bug 靠 eslint-plugin-react-hooks 的 exhaustive-deps 规则兜底。
   */
  const visibleProducts = useMemo(() => {
    console.count('[17-React] filter+sort 计算次数')
    const kw = keyword.trim()
    let result = products.filter((p) => p.name.includes(kw))
    if (category !== 'all') {
      result = result.filter((p) => p.category === category)
    }
    if (sortOrder !== 'default') {
      // sort 原地排序，先拷贝再排，不改 filter 的结果数组
      result = [...result].sort((a, b) =>
        sortOrder === 'asc' ? a.price - b.price : b.price - a.price,
      )
    }
    return result
  }, [products, keyword, category, sortOrder])

  /**
   * useCallback 稳定回调引用——本题的核心因果链：
   * 函数是对象，父组件每次渲染时「function handleSelect() {...}」都会创建一个新函数对象；
   * ProductRow 的 memo 做的是 props 浅比较（Object.is），新函数 !== 旧函数 →
   * onSelect 这项对比失败 → 200 行全部照常重渲染，memo 形同虚设。
   * useCallback(fn, []) 让 handleSelect 在组件整个生命周期里都是同一个引用。
   * 依赖数组能写 [] 的原因：内部用函数式更新 setSelectedId(prev => ...)，不需要读取外部值。
   * 面试考点：「useCallback 有什么用？」——标准答案不是「优化性能」四个字，
   * 而是这条链：稳定引用 → memo 浅比较通过 → 子组件跳过重渲染；不配合 memo（或依赖数组）时
   * 单独用 useCallback 毫无意义。
   * Vue 对照：不需要这一步——Vue 不靠引用相等决定子组件更不更新，
   * 而且编译器会自动缓存模板里的内联事件处理函数（相当于自动 useCallback）。
   */
  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="stack">
      <div className="card row">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索商品名…"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">全部类别</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
          <option value="default">默认排序</option>
          <option value="asc">价格从低到高</option>
          <option value="desc">价格从高到低</option>
        </select>
        <button onClick={() => setUnrelatedCount((c) => c + 1)}>
          触发无关重渲染（已点 {unrelatedCount} 次）
        </button>
      </div>

      <p className="muted">
        共 {visibleProducts.length} 条。打开控制台观察两个计数：点「触发无关重渲染」时两个计数都不动
        （useMemo 缓存命中 + memo 全部跳过）；点行内「选中」时只有选中状态变化的那一两行重渲染
        （StrictMode 开发期渲染跑两遍，数字会约翻倍，重点看哪个计数动了）。
      </p>

      {/*
        最后强调：不要无脑 useMemo/useCallback——每个都要存缓存、每次渲染都要对比依赖，
        还抬高了代码的阅读成本；绝大多数组件（渲染本来就便宜）加了纯属负担。
        正确姿势：先跑 React DevTools Profiler 量出真正慢的地方，再对症下药。
        另外 React Compiler 正在让这类手动优化逐步自动化——但读懂现有代码仍需掌握本题。
      */}
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>类别</th>
            <th>价格</th>
            <th>库存</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {visibleProducts.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              selected={selectedId === p.id}
              onSelect={handleSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
