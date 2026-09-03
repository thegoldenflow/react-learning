<script setup lang="ts">
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
 *   useState(props.keyword) 只在首次渲染读一次初始值，之后 props 变了它纹丝不动；
 *   想用 useEffect 把 props 抄进 state 来「同步」，是 09 题点名的反模式（多一份数据、多一轮渲染、迟早不同步）
 * - 什么情况下 state 应该留在子组件：只有这个组件（及其后代）用到、父组件和兄弟都不关心的「局部 UI 状态」——
 *   折叠 / 展开、hover、输入草稿、编辑模式。提升是有代价的，规则是「提升到刚好够用的那一层」，不是「越高越好」
 * - 不要把所有状态都放到全局 store：只被一个组件树用的状态放局部；只有跨页面 / 跨互不嵌套组件共享的客户端状态
 *   才进全局 store（16 题的标准）
 * - React 的单向数据流：数据向下（props）、事件向上（callback）；完全受控的子组件（SearchBar）自己没有任何 useState
 *
 * Vue 对应概念：
 * - 「state 放哪」这个设计判断在 Vue 里完全一样：keyword / category 提升到本文件（最近的公共父组件），
 *   expanded 留在 CategoryFilter.vue 里 —— 每个子组件的注释都标了「这份 state 归谁」
 * - 数据向下 = props，事件向上 = emit（对应 React 的 callback props）：
 *   CategoryFilter.vue 用 defineProps<{ value }>() + defineEmits<{ change: [value: string] }>()，
 *   父组件模板里 :value="category" @change="handleCategoryChange" —— 这就是 React 的 value={category} onChange={setCategory}
 * - SearchBar.vue 用 defineModel<string>()：它脱糖为 modelValue prop + update:modelValue 事件，
 *   父组件写 <SearchBar v-model="keyword" /> 等于 :model-value="keyword" @update:model-value="keyword = $event"。
 *   也就是说 v-model 只是「props 向下 + emit 向上」的语法糖，state 仍归父组件所有 —— 对应 React 的 value + onChange
 * - 同一个坑：ProductListOwnCopy.vue 里 const localKeyword = ref(props.keyword) 拷贝了一份，之后同样不再同步。
 *   props 对象是响应式的，但从里面读出来的字符串是普通值，塞进 ref 就和父组件断了联系；Vue 同样不会替你同步
 * - 不进 Pinia 的理由与 React 侧不进 Zustand 完全相同：keyword / category 只有这棵子树用（16 题）
 * - 派生值 visibleProducts 用 computed（setup 只跑一次）；React 侧是渲染期的普通 const（09 题）
 *
 * 最重要的区别：
 * - 设计判断层面（谁拥有 state、何时提升、何时留局部、何时才进全局）两个框架【完全一致】——
 *   这是组件化的通用规则，不是 React 独有；Vue 老手在这一题要学的不是新概念，而是它在 React 里的具体写法
 * - 机制层面不同：「事件向上」Vue 是 emit（自定义事件，声明 / 抛出 / 监听三步），React 是 callback props（普通函数参数）；
 *   「一对 value/onChange」在 Vue 里有 v-model / defineModel 语法糖，React 没有语法糖，只能老老实实写两个 props
 *   （没有一一对应关系 —— React 里所谓「事件」就是父组件传下来的函数被调用了，08 题讲的正是这个机制）
 * - 「把 props 拷进本地 state」这个坑两边都有，但 React 更容易踩：useState(props.x) 看起来像「初始化」，
 *   实际语义是「只读一次」；Vue 里直接用 props.x 永远是最新值，只有主动 ref(props.x) 才会断开
 * - SFC 一文件一组件：React 侧五个子组件和父组件写在同一个 Example.tsx 里；Vue 侧必须拆成四个 .vue 文件
 *   （页面的源码查看器只显示本文件，子组件源码要在编辑器里打开看）；ResultSummary 太小，直接内联在模板里
 * - 与邻题的分工：08 讲 callback props vs emit 的机制（一父一子）；本题讲设计判断（兄弟共享、重复 state 反模式、
 *   何时留局部、何时不进全局）；09 讲派生值直接算；15 / 16 讲真的需要跨层 / 跨页面共享时才用 provide/inject / Pinia
 */
import { computed, ref } from 'vue'
import { PRODUCTS, PRODUCT_CATEGORIES } from '@/shared/products'
import SearchBar from './SearchBar.vue'
import CategoryFilter from './CategoryFilter.vue'
import ProductList from './ProductList.vue'
import ProductListOwnCopy from './ProductListOwnCopy.vue'

/**
 * 这两份 state 归 Example.vue 所有：它是 SearchBar / CategoryFilter / ResultSummary / ProductList 最近的公共父组件。
 * category 的 'all' 是「不限分类」的哨兵值，其余是 PRODUCT_CATEGORIES 里的真实分类名。
 * React 对应：const [keyword, setKeyword] = useState('')、const [category, setCategory] = useState<CategoryValue>('all')。
 * 差别只在机制：React 必须把 setter 当 props 传下去；Vue 把 ref 用 v-model 绑给子组件、或在 @change 里自己改。
 */
const keyword = ref('')
const category = ref('all')

/** 演示开关：决定列表位置渲染哪个组件。它也归本组件 —— 因为是本组件在做这个渲染决定 */
const ownCopyMode = ref(false)

/**
 * 派生值用 computed：setup 只执行一次，必须用 computed 才能「跟着 keyword / category 变」。
 * React 侧同一行是渲染期的普通 const filterProducts(PRODUCTS, keyword, category)（09 题）。
 * 两边共同的纪律：能从现有 state 算出来的值，绝不另开一份 state（ref + watch 手动同步是 Vue 侧的同款反模式）。
 * ProductListOwnCopy.vue 里有一份几乎一样的过滤逻辑 —— 故意不抽成共享文件，让那个反面教材的「坏」只能来自 state 归属。
 */
const visibleProducts = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return PRODUCTS.filter(
    (p) =>
      (category.value === 'all' || p.category === category.value) &&
      p.name.toLowerCase().includes(kw),
  )
})

/**
 * 子组件 emit('change', next) 后由父组件真正改 state —— 事件向上，改动仍由拥有者执行。
 * React 对应：直接把 setCategory 当 onChange 传下去（setter 引用稳定）；Vue 这里也可以在模板里写
 * @change="category = $event"，拆成函数只是为了和 React 侧的 handle* 命名对齐、方便加类型。
 */
function handleCategoryChange(next: string) {
  category.value = next
}
</script>

<template>
  <div class="stack">
    <!-- ---------------- 区块一：归属表 ---------------- -->
    <div class="card stack">
      <h3>区块一：state 归属表 —— 谁拥有什么（父组件把自己拥有的 state 亮出来）</h3>
      <p class="muted">
        这张表由 Example.vue 渲染，所以它只能显示自己拥有的值；expanded 那一格是空的 ——
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
            <td><code>keyword</code></td>
            <td>Example.vue（父）</td>
            <td>「{{ keyword }}」</td>
            <td>SearchBar 改它（v-model），ResultSummary / ProductList 读它 → 提升到最近的公共父组件</td>
          </tr>
          <tr>
            <td><code>category</code></td>
            <td>Example.vue（父）</td>
            <td>「{{ category === 'all' ? '全部' : category }}」</td>
            <td>CategoryFilter 改它（emit），其余兄弟读它 → 同上</td>
          </tr>
          <tr>
            <td><code>expanded</code></td>
            <td>CategoryFilter.vue（子）</td>
            <td class="muted">
              父组件读不到（也不需要）
            </td>
            <td>只有折叠面板自己关心 → 留在子组件</td>
          </tr>
        </tbody>
      </table>
      <p class="muted">
        为什么不进 Pinia：keyword / category 只有这棵子树在用，切到别的页面就没意义了 ——
        16 题的标准是「跨页面 / 跨互不嵌套组件共享的客户端状态」才进全局 store。全局 store 是把 state 提升到顶的极端形式，
        对只有一棵子树用的状态来说是过度设计：谁都能改、数据流不再一眼可见。React 侧不进 Zustand，理由一字不差。
      </p>
    </div>

    <!-- ---------------- 区块二：兄弟共享 ---------------- -->
    <div class="card stack">
      <h3>区块二：两个兄弟组件共同驱动同一个列表 —— 状态提升</h3>
      <p class="muted">
        搜索框（SearchBar）和分类按钮（CategoryFilter）是兄弟，都不拥有 state，只上报 —— 单向数据流：
        数据向下（props）、事件向上（emit，对应 React 的 callback）。它们共同作用于下面的汇总与列表。
        试试：输入「显示」再选「显示器」；先点「更多」展开分类，再去搜索框打字 ——
        展开态不会被重置（它是 CategoryFilter 自己的 ref，随组件实例存活）。
      </p>

      <!-- v-model = :model-value 向下 + @update:model-value 向上 —— React 侧是 value={keyword} onChange={setKeyword} -->
      <SearchBar v-model="keyword" />
      <!-- 数据向下用 :value，事件向上用 @change —— Vue 在语法上把两者分成两类；React 两者都是普通 props -->
      <CategoryFilter
        :categories="PRODUCT_CATEGORIES"
        :value="category"
        @change="handleCategoryChange"
      />

      <!-- ResultSummary 内联：读的全是本组件的 state，与搜索框、分类按钮同源，所以永远一致 —— 一致性不靠同步，靠只有一份 -->
      <p>
        关键词「<strong>{{ keyword === '' ? '（空）' : keyword }}</strong>」· 分类「<strong>{{ category === 'all' ? '全部' : category }}</strong>」·
        匹配 <strong>{{ visibleProducts.length }}</strong> / {{ PRODUCTS.length }} 件
        <span class="muted">（这一行读的全是 Example.vue 的 state，与搜索框、分类按钮同源，所以永远一致）</span>
      </p>

      <!-- 反面教材开关：勾上后，列表位置换成「自己再存一份 keyword」的版本 -->
      <label class="row">
        <input
          v-model="ownCopyMode"
          type="checkbox"
        >
        <span>让列表组件自己再存一份 keyword（反面教材）</span>
      </label>
      <p class="muted">
        勾上后去搜索框改关键词：上面的「匹配 N 件」变了，列表却停在勾选那一刻的关键词并飘出红字；
        切分类则照样更新（category 走 props）。取消勾选再勾上 = v-if 销毁重建，重新拷贝一次。
      </p>

      <!-- v-if / v-else 换的是不同组件：勾选 / 取消都是「销毁旧的、创建新的」，
           ProductListOwnCopy 的 localKeyword 随销毁一起丢弃，再勾上时重新 ref(props.keyword) 拷一份新的 -->
      <ProductListOwnCopy
        v-if="ownCopyMode"
        :keyword="keyword"
        :category="category"
        :products="PRODUCTS"
      />
      <ProductList
        v-else
        :products="visibleProducts"
      />
    </div>
  </div>
</template>
