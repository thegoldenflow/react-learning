/**
 * 学习主题：状态提升与 state 归属 —— state 该放在哪个组件？兄弟组件怎么共享？什么该留在子组件、什么不该进全局 store
 *
 * React 核心概念：
 * - state 归属（ownership）：每一份 state 只能属于【一个】组件，它是这份数据的唯一真相源（single source of truth）；
 *   其他组件只能通过 props 读它、通过 callback 请求改它 —— 谁拥有，谁才能 setState
 * - 状态提升（lifting state up）：两个兄弟组件要用同一份 state 时，把它提升到「最近的公共父组件」，
 *   父组件把值当 props 传下去、把 setter 包在回调里也当 props 传下去（08 题的机制；本题讲怎么用它做设计判断）
 * - 归属表（本题的三份 state，页面区块一也画了这张表）：
 *     keyword / category → Example（SearchBar 改、CategoryFilter 改、ResultSummary 读、ProductList 读 ——
 *                           四个兄弟都用 → 提升到它们最近的公共父组件 Example）
 *     expanded          → CategoryFilter（「折叠 / 展开」只有它自己关心，父组件和兄弟都不需要知道 → 留在子组件）
 * - 为什么不能让两个兄弟各自保存一份相同的 state：React 没有任何机制让两份 state 保持同步。
 *   useState(props.keyword) 只在首次渲染读一次初始值，之后 props 变了它纹丝不动（区块二的反面教材当场演示）；
 *   想用 useEffect 把 props 抄进 state 来「同步」，是 09 题点名的反模式（多一份数据、多一轮渲染、迟早不同步）
 * - 什么情况下 state 应该留在子组件：只有这个组件（及其后代）用到、父组件和兄弟都不关心的「局部 UI 状态」——
 *   折叠 / 展开、hover、输入草稿、编辑模式（08 题 ProductItem 的 editing 也是）。提升是有代价的
 *   （父组件变胖、每次改动整棵子树重渲染），所以规则是「提升到刚好够用的那一层」，而不是「越高越好」
 * - 不要把所有状态都放到全局 store：keyword / category 只有这棵子树用，不进 Zustand。16 题的标准：
 *   只被一个组件树用的状态放局部；只有跨页面 / 跨互不嵌套组件共享的客户端状态才进全局 store。
 *   全局 store 是「状态提升到顶」的极端形式，代价是任何组件都能改它、数据流不再一眼可见
 * - React 的单向数据流：数据向下（props）、事件向上（callback）；子组件永远不直接改父组件的 state，
 *   只能调用父组件给的回调「上报意图」。完全受控的子组件（SearchBar）自己没有任何 useState
 *
 * Vue 对应概念：
 * - 「state 放哪」这个设计判断在 Vue 里完全一样：keyword / category 提升到 Example.vue，expanded 留在 CategoryFilter.vue
 * - 数据向下 = props，事件向上 = emit：CategoryFilter.vue 用 defineProps + defineEmits；
 *   SearchBar.vue 用 defineModel<string>() —— 它脱糖为 modelValue prop + update:modelValue 事件，
 *   正是 React 这里 value + onChange 一对 props 的语法糖版本
 * - 同一个坑：ProductListOwnCopy.vue 里 ref(props.keyword) 拷贝了一份，之后同样不再同步 ——
 *   Vue 的 props 对象是响应式的，但从里面读出来的字符串是普通值，拷进 ref 就断了联系
 * - 不进 Pinia 的理由与不进 Zustand 完全相同（16 题）
 *
 * 最重要的区别：
 * - 设计判断层面（谁拥有 state、何时提升、何时留局部、何时才进全局）两个框架【完全一致】——
 *   这是组件化的通用规则，不是 React 独有；Vue 老手在这一题要学的不是新概念，而是它在 React 里的具体写法
 * - 机制层面不同：「事件向上」React 是 callback props（普通函数参数），Vue 是 emit（自定义事件）；
 *   「一对 value/onChange」在 Vue 里有 v-model / defineModel 语法糖，React 没有语法糖，只能老老实实写两个 props
 *   （没有一一对应关系 —— React 里所谓「事件」就是父组件传下来的函数被调用了，08 题讲的正是这个机制）
 * - 「把 props 拷进本地 state」这个坑两边都有，但 React 更容易踩：useState(props.x) 看起来像「初始化」，
 *   实际语义是「只读一次」；Vue 里直接用 props.x 永远是最新值，只有主动 ref(props.x) 才会断开
 * - 与邻题的分工：08 讲 callback props vs emit 的机制（一父一子）；本题讲设计判断（兄弟共享、重复 state 反模式、
 *   何时留局部、何时不进全局）；09 讲派生值直接算（本题的过滤列表就是这么算的，不另开 state）；
 *   15 / 16 讲真的需要跨层 / 跨页面共享时才用 Context / Zustand
 */
import { useState } from 'react'
import { PRODUCTS, PRODUCT_CATEGORIES } from '@/shared/products'
import type { Product } from '@/shared/types'

/**
 * 分类筛选的值：'all' 是「不限分类」的哨兵值，其余是 PRODUCT_CATEGORIES 里的真实分类名。
 * （TS 会把 'all' | string 化简成 string —— 写成联合只是为了把「'all' 是特殊值」这个意图留在类型里。）
 */
type CategoryValue = 'all' | string

/**
 * 过滤逻辑：一个纯函数，父组件在【渲染期】直接调用它算出可见列表（09 题：能从 state 算出来的值不另开 state）。
 * 反面教材组件也用它 —— 保证两种列表除了「keyword 从哪来」之外没有任何差别，坏掉的原因只能是 state 归属。
 */
function filterProducts(products: Product[], keyword: string, category: CategoryValue): Product[] {
  const kw = keyword.trim().toLowerCase()
  return products.filter(
    (p) => (category === 'all' || p.category === category) && p.name.toLowerCase().includes(kw),
  )
}

/* ============================================================================
 * 子组件们：React 组件只是函数，可以和父组件同文件（Vue 侧每个都是单独的 .vue 文件）。
 * 请按「谁拥有 state」来读每一个组件：SearchBar 什么都不拥有；CategoryFilter 只拥有 expanded；
 * ResultSummary / ProductList 什么都不拥有；ProductListWithOwnCopy 拥有了它【不该拥有】的东西。
 * ========================================================================== */

interface SearchBarProps {
  /** 当前关键词 —— 来自父组件，本组件只负责显示 */
  value: string
  /** 用户想改关键词时上报给父组件；真正改 state 的是父组件的 setKeyword */
  onChange: (next: string) => void
}

/**
 * 完全受控的子组件：注意它【没有任何 useState】。
 *
 * 它不拥有 keyword：value 从父组件来，用户敲键盘时它也不自己存，而是把新值通过 onChange 上报，
 * 由父组件 setKeyword，父组件重渲染后再把新 value 传回来 —— 这一圈就是单向数据流：
 * 数据向下（props）、事件向上（callback）。它和 07 题的受控 <input> 是同一个模式，只是抬高了一层：
 * <input> 受控于 SearchBar，SearchBar 受控于 Example。
 *
 * 为什么不让它自己 useState('') 再「顺便」通知父组件？因为那样就有了两份 keyword：
 * 兄弟组件 CategoryFilter / ResultSummary / ProductList 读的是父组件那份，
 * 只要有一条路径忘了同步（比如父组件的「清空」按钮只改了自己那份），输入框显示的和列表用的就对不上。
 *
 * Vue 对应：SearchBar.vue 用 defineModel<string>()，父组件写 <SearchBar v-model="keyword" />；
 * 脱糖后就是 :model-value + @update:model-value，和这里的 value + onChange 一一对应 —— 只是 Vue 给了语法糖。
 */
function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="row">
      <label className="row">
        <span>搜索：</span>
        <input
          value={value}
          placeholder="商品名，如「显示器」「键盘」"
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {/* 「清空」也走同一条上报通道：本组件从头到尾没有一行 setState */}
      <button className="btn-ghost" disabled={value === ''} onClick={() => onChange('')}>
        清空
      </button>
    </div>
  )
}

/** 折叠时只显示前几个分类，其余收进「更多」 */
const COLLAPSED_COUNT = 2

interface CategoryFilterProps {
  /** 所有分类，来自父组件（数据向下） */
  categories: string[]
  /** 当前选中的分类，来自父组件 —— 本组件不拥有它 */
  value: CategoryValue
  /** 用户点了某个分类时上报（事件向上）；'all' 表示不限分类 */
  onChange: (next: CategoryValue) => void
}

/**
 * 「什么情况下 state 应该留在子组件」的正面例子：expanded 是 CategoryFilter 自己的 state。
 *
 * 判断只问一件事：除了这个组件，还有谁需要知道「分类面板现在是折叠还是展开」？
 * 父组件不关心（它只关心选了哪个分类），兄弟组件更不关心 —— 所以 expanded 不提升，留在这里。
 * 反过来，value（选中的分类）被 ResultSummary 和 ProductList 也用到了，所以它不能留在这里，
 * 必须从父组件以 props 传进来 —— 同一个组件里，一个 state 留下、一个 state 提升，标准就是「谁用」。
 *
 * 可观察的证据：先点「更多」展开，再去搜索框打字 —— 父组件因 keyword 变化而重渲染、本组件也被重新调用，
 * 但 expanded 不会被重置：useState 的值由 React 按组件实例保管，跨渲染存活（只有卸载才会丢）。
 * 这也是「提升到刚好够用的那一层」的原因之一：把 expanded 也提升上去，父组件只会白白多一份没人读的 state，
 * 并且每次折叠 / 展开都让整棵子树重渲染。
 *
 * Vue 对应：CategoryFilter.vue 里 const expanded = ref(false)，同样留在子组件；props + emit 传 value。
 */
function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
  const [expanded, setExpanded] = useState(false)

  // 派生值直接在渲染期算（09 题）：折叠态下只露出前 COLLAPSED_COUNT 个分类
  const visibleCategories = expanded ? categories : categories.slice(0, COLLAPSED_COUNT)
  const hiddenCount = categories.length - COLLAPSED_COUNT
  // 折叠时选中的分类可能被藏进「更多」里 —— 这只是本组件的显示问题，选中值本身仍安稳地在父组件手里
  const selectedIsHidden = value !== 'all' && !visibleCategories.includes(value)

  return (
    <div className="row">
      <span>分类：</span>
      <button className={value === 'all' ? 'btn-primary' : undefined} onClick={() => onChange('all')}>
        全部
      </button>
      {visibleCategories.map((c) => (
        // 点分类不改任何本地 state，只上报；高亮与否读的是 props.value —— 父组件才是真相源
        <button key={c} className={value === c ? 'btn-primary' : undefined} onClick={() => onChange(c)}>
          {c}
        </button>
      ))}
      {hiddenCount > 0 && (
        // 唯一一处本地 setState：折叠 / 展开只关本组件的事
        <button className="btn-ghost" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '收起' : `更多（${hiddenCount}）`}
        </button>
      )}
      {selectedIsHidden && (
        <span className="muted">（已选「{value}」折叠在「更多」里 —— 折叠只是本组件的显示问题，选中值仍在父组件手里）</span>
      )}
    </div>
  )
}

interface ResultSummaryProps {
  keyword: string
  category: CategoryValue
  matched: number
  total: number
}

/**
 * 纯展示组件：四个 props 全部来自父组件，自己没有 state。
 * 它和 SearchBar / CategoryFilter 是兄弟 —— 它能和它们「永远一致」，不是因为有什么同步机制，
 * 而是因为大家读的都是父组件那【同一份】state。这就是状态提升要买的东西：一致性不靠同步，靠只有一份。
 */
function ResultSummary({ keyword, category, matched, total }: ResultSummaryProps) {
  return (
    <p>
      关键词「<strong>{keyword === '' ? '（空）' : keyword}</strong>」· 分类「
      <strong>{category === 'all' ? '全部' : category}</strong>」· 匹配 <strong>{matched}</strong> / {total} 件
      <span className="muted">（这一行读的全是 Example 的 state，与搜索框、分类按钮同源，所以永远一致）</span>
    </p>
  )
}

interface ProductListProps {
  /** 已经由父组件过滤好的列表：本组件只负责画表，不知道 keyword / category 的存在 */
  products: Product[]
}

/**
 * ✅ 正确的列表组件：只接收「父组件在渲染期过滤好的结果」。
 * 它连 keyword / category 都不需要知道 —— 过滤是父组件的事（09 题：派生值在渲染期直接算，不另开 state）。
 * 组件越「笨」越好复用：这张表同样可以拿去画购物车、画搜索结果、画任何 Product[]。
 */
function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return <p className="muted">没有匹配的商品</p>
  }
  return (
    <table>
      <thead>
        <tr>
          <th>商品</th>
          <th>分类</th>
          <th>单价</th>
          <th>库存</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>
              <span className="badge">{p.category}</span>
            </td>
            <td>￥{p.price}</td>
            <td>{p.stock}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface ProductListWithOwnCopyProps {
  /** 父组件的 keyword —— 本组件会错误地把它拷贝一份 */
  keyword: string
  /** 父组件的 category —— 本组件会正确地直接使用它，作为对照 */
  category: CategoryValue
  /** 全部商品：本组件自己过滤（因为它坚持要用自己那份 keyword） */
  products: Product[]
}

/**
 * ❌ 反面教材：「让列表组件自己再存一份 keyword」—— 两个兄弟各存一份相同的 state。
 *
 * 出事的就是下面那一行 useState(keyword)。它看起来像「用 props 初始化」，实际语义是【只在首次渲染读一次】：
 * 之后父组件的 keyword 怎么变，localKeyword 都纹丝不动 —— React 没有任何机制让两份 state 保持同步，
 * 这是 React 的设计，不是 bug：state 归组件实例私有，props 只是调用时传进来的参数（23 题：每次渲染一份快照）。
 *
 * 于是出现了【两份真相源】：
 * - 父组件的 keyword：搜索框显示它、ResultSummary 用它算「匹配 N 件」；
 * - 本组件的 localKeyword：这张表用它过滤。
 * 勾上复选框后去搜索框打字：上面的 ResultSummary 立刻变，这张表却停在挂载那一刻的关键词，并飘出红字。
 * 在本组件自己的输入框里打字则反过来：表变了，ResultSummary 不变。—— 双向都断，谁都不是「对的」。
 *
 * 作为对照，category 没有被拷贝，本组件每次渲染都直接读 props.category —— 所以切分类时这张表照样更新。
 * 同一个组件里，走 props 的永远新鲜，拷进 state 的立刻过期，差别只在「有没有多存一份」。
 *
 * 常见的错误修法：useEffect(() => setLocalKeyword(keyword), [keyword]) ——「props 变了就同步进 state」。
 * 这是 09 题点名的反模式：① 仍然是两份数据；② 每次 keyword 变化多渲染一轮（先用旧副本渲染，effect 再改一次）；
 * ③ 子组件自己改副本时父组件照样不知道，只堵住了一个方向。正确修法是删掉这份 state，直接用 props（就是 ProductList）。
 *
 * 什么时候「初始值来自 props」是合理的？当你【有意】做非受控组件：初始值由父组件给、之后完全由子组件自己管
 * （08 题 ProductItem 的 draftName 就是：进入编辑时从 props 拷一份草稿，确认时再上报）。那种场景请把 prop
 * 命名成 initialKeyword / defaultKeyword 把意图说出来，需要重置时给组件换 key（10 题）—— 那是设计，不是事故。
 *
 * Vue 对应：ProductListOwnCopy.vue 里 const localKeyword = ref(props.keyword) 是同一个坑 ——
 * props 对象是响应式的，但读出来的字符串是普通值，塞进 ref 就和父组件断了联系；Vue 同样不会替你同步。
 */
function ProductListWithOwnCopy({ keyword, category, products }: ProductListWithOwnCopyProps) {
  // ❌ 拷贝：只在首次渲染读一次 keyword，从此与父组件分道扬镳
  const [localKeyword, setLocalKeyword] = useState(keyword)

  // 两份真相源是否已经分叉 —— 渲染期直接算
  const outOfSync = localKeyword !== keyword
  // 过滤用的是自己那份副本；category 走 props，现读现取
  const visible = filterProducts(products, localKeyword, category)

  return (
    <div className="stack">
      <div className="row">
        <label className="row">
          <span>本组件自己的 keyword 副本：</span>
          <input value={localKeyword} onChange={(e) => setLocalKeyword(e.target.value)} />
        </label>
        <span className="muted">
          分类仍走 props（当前「{category === 'all' ? '全部' : category}」）—— 现读现取，永远同步
        </span>
      </div>
      {outOfSync ? (
        <p className="error-text">
          两份真相源已经分叉：父组件的 keyword =「{keyword}」，本组件的副本 =「{localKeyword}」。
          上面的 ResultSummary 和这张表说的已经不是同一回事。
        </p>
      ) : (
        <p className="success-text">
          此刻两份值恰好相等（挂载时拷贝的就是父组件当时的值）—— 去上面的搜索框改一下，或在这里改一下，看它们分叉
        </p>
      )}
      <ProductList products={visible} />
    </div>
  )
}

export default function Example() {
  /**
   * 这两份 state 归 Example 所有：它是 SearchBar / CategoryFilter / ResultSummary / ProductList 最近的公共父组件。
   * 归属决定了 API：Example 把值以 props 传下去，把 setKeyword / setCategory 以回调传下去 —— setter 本身就是
   * 一个稳定的函数，可以直接当 onChange 传（不需要再包一层）。
   * Vue 对应：Example.vue 里的 const keyword = ref('')、const category = ref('all')。
   */
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<CategoryValue>('all')

  /** 演示开关：决定列表位置渲染哪个组件。它也归 Example —— 因为是 Example 在做这个渲染决定 */
  const [ownCopyMode, setOwnCopyMode] = useState(false)

  /**
   * 派生值：渲染期直接算（09 题）。不要写成 const [visibleProducts, setVisibleProducts] = useState(...) 再用 effect 同步 ——
   * 那会造出第四份「真相」。能从 keyword / category 算出来的东西，就不该是 state。
   * Vue 对应：computed(() => ...)，因为 setup 只跑一次；React 组件函数每次渲染重跑，普通 const 就够。
   */
  const visibleProducts = filterProducts(PRODUCTS, keyword, category)

  return (
    <div className="stack">
      {/* ---------------- 区块一：归属表 ---------------- */}
      <div className="card stack">
        <h3>区块一：state 归属表 —— 谁拥有什么（父组件把自己拥有的 state 亮出来）</h3>
        <p className="muted">
          这张表由 Example 渲染，所以它只能显示 Example 自己拥有的值；expanded 那一格是空的 ——
          子组件的局部 state 父组件读不到，这正是「留在子组件」的含义。去区块二操作，回来看这里跟着变。
        </p>
        <table>
          <thead>
            <tr>
              <th>state</th>
              <th>归属组件</th>
              <th>当前值</th>
              <th>为什么放这里</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>keyword</code>
              </td>
              <td>Example（父）</td>
              <td>「{keyword}」</td>
              <td>SearchBar 改它，ResultSummary / ProductList 读它 → 提升到最近的公共父组件</td>
            </tr>
            <tr>
              <td>
                <code>category</code>
              </td>
              <td>Example（父）</td>
              <td>「{category === 'all' ? '全部' : category}」</td>
              <td>CategoryFilter 改它，其余兄弟读它 → 同上</td>
            </tr>
            <tr>
              <td>
                <code>expanded</code>
              </td>
              <td>CategoryFilter（子）</td>
              <td className="muted">父组件读不到（也不需要）</td>
              <td>只有折叠面板自己关心 → 留在子组件</td>
            </tr>
          </tbody>
        </table>
        <p className="muted">
          为什么不进 Zustand：keyword / category 只有这棵子树在用，切到别的页面就没意义了 ——
          16 题的标准是「跨页面 / 跨互不嵌套组件共享的客户端状态」才进全局 store。全局 store 是把 state 提升到顶的极端形式，
          对只有一棵子树用的状态来说是过度设计：谁都能改、数据流不再一眼可见。
        </p>
      </div>

      {/* ---------------- 区块二：兄弟共享 ---------------- */}
      <div className="card stack">
        <h3>区块二：两个兄弟组件共同驱动同一个列表 —— 状态提升</h3>
        <p className="muted">
          搜索框（SearchBar）和分类按钮（CategoryFilter）是兄弟，都不拥有 state，只上报 —— 单向数据流：
          数据向下（props）、事件向上（callback）。它们共同作用于下面的汇总与列表。
          试试：输入「显示」再选「显示器」；先点「更多」展开分类，再去搜索框打字 ——
          展开态不会被重置（它是 CategoryFilter 自己的 state，跨渲染存活）。
        </p>

        {/* 数据向下：value / categories；事件向上：onChange。setter 引用稳定，直接当回调传即可 */}
        <SearchBar value={keyword} onChange={setKeyword} />
        <CategoryFilter categories={PRODUCT_CATEGORIES} value={category} onChange={setCategory} />
        <ResultSummary
          keyword={keyword}
          category={category}
          matched={visibleProducts.length}
          total={PRODUCTS.length}
        />

        {/* 反面教材开关：勾上后，列表位置换成「自己再存一份 keyword」的版本 */}
        <label className="row">
          <input
            type="checkbox"
            checked={ownCopyMode}
            onChange={(e) => setOwnCopyMode(e.target.checked)}
          />
          <span>让列表组件自己再存一份 keyword（反面教材）</span>
        </label>
        <p className="muted">
          勾上后去搜索框改关键词：上面的「匹配 N 件」变了，列表却停在勾选那一刻的关键词并飘出红字；
          切分类则照样更新（category 走 props）。取消勾选再勾上 = 组件卸载重挂，重新拷贝一次。
        </p>

        {/*
          两个槽位换的是【组件类型】，所以勾选 / 取消都是「卸载旧的、挂载新的」（10 题的 diff 规则）：
          ProductListWithOwnCopy 的 localKeyword 随卸载一起销毁，再勾上时重新 useState(keyword) 拷一份新的。
        */}
        {ownCopyMode ? (
          <ProductListWithOwnCopy keyword={keyword} category={category} products={PRODUCTS} />
        ) : (
          <ProductList products={visibleProducts} />
        )}
      </div>
    </div>
  )
}
