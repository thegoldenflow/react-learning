/**
 * 学习主题：派生状态（computed vs 渲染时直接算）
 *
 * React 核心概念：
 * - 派生值的默认写法是「渲染时直接算」：const total = items.reduce(...) 写在组件函数体里，
 *   每次渲染重算——这是 React 默认且正确的做法，不需要任何 API
 * - useMemo 只有两种情况才需要：计算确实昂贵；或需要引用稳定
 *   （结果要传给 React.memo 子组件 / 要进其他 Hook 的依赖数组）
 * - 不要为了模仿 computed 滥用 useMemo：它本身有成本（存依赖、每次渲染对比），默认先不用
 * - 反模式：把派生值放进 useState 再用 useEffect 同步——多一份数据、多一轮渲染、可能不同步
 * - 判断标准：能从现有 state / props 算出来的值，都不该是 state
 *
 * Vue 对应概念：
 * - computed(() => ...)：自动追踪依赖、自动缓存，是 Vue 派生值的唯一惯用写法
 * - Vue 侧的同款反模式：ref + watch 手动同步派生值，同样不要做（该用 computed）
 *
 * 最重要的区别：
 * - Vue 的 setup 只执行一次，派生值必须用 computed 才能「自动跟着变」；
 *   React 组件函数每次渲染整个重跑，普通 const 天然就是最新值，默认不需要任何包装
 * - useMemo ≠ computed：useMemo 要手写依赖数组、不自动追踪、只是性能优化手段，
 *   两者没有一一对应关系
 */
import { useMemo, useState } from 'react'
import type { CartItem } from '@/shared/types'

const INITIAL_CART: CartItem[] = [
  { id: 'c1', name: '降噪耳机', price: 249, quantity: 1 },
  { id: 'c2', name: '蓝牙音箱', price: 129, quantity: 1 },
  { id: 'c3', name: 'USB-C 数据线', price: 29, quantity: 2 },
]

/** 免运费门槛：总金额超过它就免运费 */
const FREE_SHIPPING_THRESHOLD = 500

export default function Example() {
  // 唯一「真正的 state」只有购物车列表本身——下面的件数、金额、满减提示全是它的派生值
  const [items, setItems] = useState<CartItem[]>(INITIAL_CART)

  function changeQuantity(id: string, delta: number) {
    // 不可变更新：map 出新数组；数量下限钳在 1
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it)),
    )
  }

  /**
   * ✅ 派生值的默认写法：在组件函数体里直接算。
   * 组件函数每次渲染都会重新执行，这几个 const 自然拿到最新结果——
   * 不需要任何 API、不用声明依赖、天然不会「忘了更新」。
   * Vue 里这一步是 computed(() => ...)：Vue 的 setup 只执行一次，
   * 必须用 computed 建立「随依赖自动更新」的值；React 函数每次重跑，直接算即可。
   * 面试考点：「React 里 computed 的等价物是什么？」——首选答案就是「渲染时直接算」，
   * 而不是 useMemo。
   */
  const totalCount = items.reduce((sum, it) => sum + it.quantity, 0)
  const totalPrice = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const freeShipping = totalPrice > FREE_SHIPPING_THRESHOLD

  /**
   * useMemo 版本——此处数据量小，useMemo 纯属演示，实际不需要，用上面的直接算即可。
   * useMemo(计算函数, 依赖数组)：依赖（用 Object.is 逐个对比）不变时跳过计算、复用上次结果。
   * 只有两种情况才值得用：
   * 1) 计算确实昂贵（比如上万条数据的过滤 / 排序）；
   * 2) 需要「引用稳定」——结果要传给 React.memo 的子组件、或要进别的 Hook 的依赖数组，
   *    否则每次渲染产生的新引用会让 memo / 依赖对比失效。
   * 不要为了模仿 Vue 的 computed 给每个派生值都套 useMemo：它自己有成本
   * （闭包 + 存依赖 + 每次渲染对比依赖），默认先不用，量测到瓶颈再加。
   * 还要注意：useMemo 的依赖数组是手写的（写漏就拿到过期值），Vue 的 computed
   * 自动追踪依赖且默认缓存——两者语义并不等价，没有一一对应关系。
   */
  const totalPriceMemo = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [items],
  )

  /**
   * ❌ 最典型的反模式：把派生值放进 state，再用 effect 同步——不要这样做！
   *
   *   const [total, setTotal] = useState(0)
   *   useEffect(() => {
   *     setTotal(items.reduce((sum, it) => sum + it.price * it.quantity, 0))
   *   }, [items])
   *
   * 问题：1) 多存一份随时可能过期的数据（两份数据要靠人肉保持一致）；
   * 2) 每次 items 变化多渲染一轮——先用旧 total 渲染，effect 再 setTotal 触发第二次渲染；
   * 3) 哪天忘了同步就是 bug。
   * 判断标准：能从现有 state / props 算出来的值，都不该是 state——直接算。
   * （Vue 侧的同款反模式是 ref + watch 手动同步，同样应该换成 computed。）
   */

  return (
    <div className="stack">
      {items.map(it => (
        <div key={it.id} className="card row">
          <strong>{it.name}</strong>
          <span className="muted">￥{it.price.toFixed(2)}</span>
          <button onClick={() => changeQuantity(it.id, -1)} disabled={it.quantity <= 1}>
            -
          </button>
          <span>{it.quantity}</span>
          <button onClick={() => changeQuantity(it.id, 1)}>+</button>
        </div>
      ))}

      <div className="card stack">
        {/* 下面展示的每个值都是渲染时算出来的，没有一个是 state */}
        <p>总件数：{totalCount} 件</p>
        <p>总金额：￥{totalPrice.toFixed(2)}</p>
        <p className="muted">
          useMemo 版总金额：￥{totalPriceMemo.toFixed(2)}（与上一行完全一致，仅作对比演示）
        </p>
        {freeShipping ? (
          <p className="success-text">总金额已超过 ￥{FREE_SHIPPING_THRESHOLD}，免运费！</p>
        ) : (
          <p className="muted">
            距离免运费还差 ￥{(FREE_SHIPPING_THRESHOLD - totalPrice).toFixed(2)}
            （总金额超过 ￥{FREE_SHIPPING_THRESHOLD} 免运费）
          </p>
        )}
      </div>
    </div>
  )
}
