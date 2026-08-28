/**
 * 学习主题：全局状态管理（Zustand vs Pinia）
 *
 * React 核心概念：
 * - Zustand：create<T>()((set, get) => ({...})) 创建 store，返回值本身就是 Hook（useCartStore），
 *   不需要任何 Provider，import 即用
 * - selector 用法 useCartStore(s => s.items)：组件只订阅选出来的切片，切片不变（Object.is 对比）
 *   就不重渲染——不传 selector 则订阅整个 store，任何字段变化都会让组件重渲染
 * - set 是浅合并 + 必须不可变更新（和 useState 一样的规矩）
 * - 派生值：store 里放函数（get() 现算，无缓存）或组件内直接算——Zustand 没有 Pinia getter
 *   那种「自动缓存的派生值」概念
 * - 选型：Zustand 是 React 社区目前最主流的轻量方案之一（Redux Toolkit 更重、样板多；
 *   Context + useReducer 无外部库但样板多且有整体重渲染问题）——本项目选 Zustand
 * - 什么时候不用全局状态：只被一个组件树用的状态放局部；服务端数据交给请求层（如 TanStack Query）；
 *   只有跨页面 / 跨互不嵌套组件共享的客户端状态才进全局 store
 *
 * Vue 对应概念：
 * - Pinia defineStore 的 setup store 写法与 composable 完全一致：ref = state、computed = getter、
 *   function = action
 * - 组件里 useCartStore() 拿 store；解构 state/getter 必须 storeToRefs，action 可直接解构
 * - getter（computed）自动依赖追踪 + 自动缓存
 *
 * 最重要的区别：
 * - Pinia 的 store 是响应式对象，组件按「实际读了哪个属性」自动精准订阅；
 *   Zustand 的 store 是不可变快照，订阅粒度靠你手写的 selector 决定——
 *   「订阅粒度自动 vs 手动」是两者最大的心智差异
 * - Pinia 里可以直接改 state（响应式可变更新），Zustand 必须 set + 不可变更新
 */
import type { Product } from '@/shared/types'
import { useCartStore } from './cartStore'

const PRODUCTS: Product[] = [
  { id: 'p1', name: '机械键盘', price: 399, category: '外设', stock: 12 },
  { id: 'p2', name: '无线鼠标', price: 149, category: '外设', stock: 20 },
  { id: 'p3', name: '降噪耳机', price: 899, category: '音频', stock: 8 },
  { id: 'p4', name: '4K 显示器', price: 1999, category: '显示', stock: 5 },
]

/**
 * 商品列表组件：与 CartPanel 互不嵌套、没有任何 props 往来，只通过全局 store 打交道。
 * （React 的多个组件可以写在同一个 .tsx 文件里——组件只是函数；
 * Vue 版的 ProductList / CartPanel 是同目录两个单独的 .vue 文件。）
 */
function ProductList() {
  /**
   * selector 只选 addToCart：本组件完全不读 items，购物车怎么变它都不重渲染。
   * 为什么要 selector？useCartStore() 不传参数会返回整个 store 快照——store 任何字段一变
   * （比如 CartPanel 改了数量），整个快照就是新对象，本组件也被迫重渲染。
   * selector 把订阅收窄成「我真正用到的那一小块」，Zustand 用 Object.is 对比 selector 的
   * 返回值，不变就跳过本组件。action 函数在创建 store 时定义、引用永远稳定，
   * 所以这个订阅永远不会触发更新——这是最「零成本」的取用方式。
   * Pinia 对照：store 是响应式对象，「读了才依赖」是自动的，Vue 侧不存在 selector 这一步。
   */
  const addToCart = useCartStore((s) => s.addToCart)

  return (
    <div className="card stack">
      <strong>商品列表（组件 A）</strong>
      {PRODUCTS.map((p) => (
        <div key={p.id} className="row">
          <span>{p.name}</span>
          <span className="muted">￥{p.price.toFixed(2)}</span>
          <button className="btn-primary" onClick={() => addToCart(p)}>
            加入购物车
          </button>
        </div>
      ))}
    </div>
  )
}

/** 购物车面板组件：与 ProductList 是兄弟组件，同样只通过全局 store 拿数据 */
function CartPanel() {
  // 每个字段各写一个 selector 是 Zustand 的惯用姿势（Pinia 侧对应 storeToRefs 解构）。
  // items 变化时本组件重渲染（应该的——它就是展示 items 的）；
  // 但反过来，store 若还有别的字段，它们的变化影响不到这里。
  const items = useCartStore((s) => s.items)
  const increase = useCartStore((s) => s.increase)
  const decrease = useCartStore((s) => s.decrease)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)

  // 派生值写法一：调用 store 里的函数（get() 现算）。selector 返回的是 number 原始值，
  // Object.is 对比——items 没变时算出来的值相同，不会造成多余重渲染。
  // Pinia 里对应 getter：const { totalPrice } = storeToRefs(cart)，且 computed 有缓存。
  const totalPrice = useCartStore((s) => s.totalPrice())

  // 派生值写法二：组件内直接算（本组件已订阅 items，渲染时直接 reduce，见 09 题「渲染时直接算」）。
  // 两种写法都常见；Pinia 侧统一用 getter（computed），没有这个二选一。
  const totalCount = items.reduce((sum, it) => sum + it.quantity, 0)

  return (
    <div className="card stack">
      <div className="row">
        <strong>购物车面板（组件 B）</strong>
        <button className="btn-danger" onClick={clear} disabled={items.length === 0}>
          清空
        </button>
      </div>

      {items.length === 0 ? (
        <p className="muted">购物车是空的，从上面的商品列表加点什么吧。</p>
      ) : (
        <>
          {items.map((it) => (
            <div key={it.id} className="row">
              <span>{it.name}</span>
              <span className="muted">￥{it.price.toFixed(2)}</span>
              <button onClick={() => decrease(it.id)} disabled={it.quantity <= 1}>
                -
              </button>
              <span>{it.quantity}</span>
              <button onClick={() => increase(it.id)}>+</button>
              <button className="btn-danger" onClick={() => remove(it.id)}>
                移除
              </button>
            </div>
          ))}
          <p>
            共 {totalCount} 件，合计 <strong>￥{totalPrice.toFixed(2)}</strong>
          </p>
        </>
      )}
    </div>
  )
}

export default function Example() {
  // 两个互不嵌套的兄弟组件，零 props 往来——共享状态全走全局 store。
  // 如果没有全局 store，就得把购物车状态提升到这里再层层下发（8 题的方案）；
  // 组件隔得越远，提升方案越痛苦，这正是全局状态管理要解决的问题。
  return (
    <div className="stack">
      <ProductList />
      <CartPanel />
    </div>
  )
}
