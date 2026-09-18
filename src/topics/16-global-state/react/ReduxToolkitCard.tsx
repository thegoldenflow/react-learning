/**
 * 区块五【只读】：Redux Toolkit 对照（【主流·存量】）+ 四种方案速查表。
 * 本仓库没有安装 @reduxjs/toolkit / react-redux（AUDIT.md §5.0 的 5.6：RTK 并入 16 题，只讲概念，不装依赖），
 * 下面的代码只是展示给你读，不参与编译。
 */

const RTK_SKETCH = `// store.ts —— Redux Toolkit 2.x + react-redux 9.x（示意，本仓库未安装）
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] as CartItem[], giftWrap: false },
  reducers: {
    // 看起来在「直接改」state：createSlice 内部用 Immer，把这种写法转换成不可变更新
    addToCart(state, action: PayloadAction<Product>) {
      const exists = state.items.find((it) => it.id === action.payload.id)
      if (exists) exists.quantity += 1
      else state.items.push({ ...action.payload, quantity: 1 })
    },
    setGiftWrap(state, action: PayloadAction<boolean>) {
      state.giftWrap = action.payload
    },
  },
})

export const { addToCart, setGiftWrap } = cartSlice.actions  // action creator 自动生成
export const store = configureStore({ reducer: { cart: cartSlice.reducer } })  // 默认带 thunk 与开发期检查
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()

// main.tsx：需要 Provider（Zustand 不需要）
// <Provider store={store}><App /></Provider>

// 组件里：
const count = useAppSelector((s) => s.cart.items.length)  // 默认用 === 比较选出来的值
const dispatch = useAppDispatch()
dispatch(addToCart(product))

// 异步：createAsyncThunk；服务端数据：RTK Query（和 TanStack Query 二选一，见 30 题）`

interface Row {
  name: string
  provider: string
  granularity: string
  update: string
  tooling: string
  fit: string
}

const ROWS: Row[] = [
  {
    name: 'Zustand 5【主流】',
    provider: '不需要（模块级单例）；服务端渲染 / 多实例用 createStore + Context（区块四）',
    granularity: 'selector + Object.is；返回对象 / 数组用 useShallow',
    update: 'set 浅合并，不可变更新（可选 immer 中间件，需另装 immer）',
    tooling: 'devtools / persist / subscribeWithSelector / combine 中间件',
    fit: '新项目里的客户端全局状态（购物车、登录用户、偏好）',
  },
  {
    name: 'Context + useReducer【主流 · React 内置】',
    provider: '需要',
    granularity: '没有 selector：value 变了，读它的组件全部重渲染（memo 挡不住）',
    update: 'reducer 返回新对象',
    tooling: '没有，要自己写',
    fit: '低频的全局值（主题、当前用户、语言）、依赖注入、一棵子树内部共享',
  },
  {
    name: 'Redux Toolkit【主流 · 存量】',
    provider: '需要 <Provider store>',
    granularity: 'useSelector，默认 === 比较；多个字段可传 shallowEqual',
    update: 'createSlice 里「直接改」（Immer 转成不可变）',
    tooling: 'Redux DevTools、中间件、RTK Query；约定强',
    fit: '已有 Redux 的项目、需要强约定和完整工具链的大团队',
  },
  {
    name: 'Pinia 3【主流 · Vue 官方推荐】',
    provider: 'app.use(createPinia())',
    granularity: '依赖追踪自动完成，不需要 selector',
    update: '直接改（可变），$patch 批量改',
    tooling: 'devtools、HMR、插件、服务端渲染支持都在核心里',
    fit: 'Vue 项目的全局状态（Vuex 已进入维护模式）',
  },
]

export function ReduxToolkitCard() {
  return (
    <div className="card stack">
      <h3>区块五：Redux Toolkit 对照与选型速查（只读）</h3>
      <p className="muted">
        RTK 是 Redux 官方的标准写法（「the standard way to write Redux logic」），存量项目和面试里都常见。
        它就是为了减轻经典 Redux「样板代码太多」这类抱怨而做的（官方原文「help address」），样板比经典写法少得多；和 Zustand 比仍然要 Provider、configureStore、带类型的 Hook。
      </p>
      <pre className="log" style={{ whiteSpace: 'pre-wrap', maxHeight: 'none' }}>
        {RTK_SKETCH}
      </pre>
      <table>
        <thead>
          <tr>
            <th>方案</th>
            <th>Provider</th>
            <th>订阅粒度</th>
            <th>更新写法</th>
            <th>工具</th>
            <th>适合</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.provider}</td>
              <td>{row.granularity}</td>
              <td>{row.update}</td>
              <td>{row.tooling}</td>
              <td>{row.fit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
