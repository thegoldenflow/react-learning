/**
 * 学习主题：父子组件通信（callback props vs emit）
 *
 * React 核心概念：
 * - 父传子：props 传数据；子通知父：父把「函数」也当 props 传下去（callback props），
 *   子组件在合适时机直接调用它，比如 onDelete(product.id)
 * - 命名约定：props 名用 on 开头（onDelete / onRename），父组件里的实现用 handle 开头
 *   （handleDelete / handleRename）——业界通用，一眼区分「接口」与「实现」
 * - 单向数据流：数据向下（props），事件向上（回调）；列表数据只存在于父组件
 * - 子组件绝不直接修改父状态：props 只读，而且只有父组件自己的 setState
 *   才能让父组件重渲染——子组件改了也白改，React 根本不知道
 * - React 没有独立的「事件系统」：callback props 就是普通的函数参数
 *
 * Vue 对应概念：
 * - defineEmits<{ delete: [id: string] }>() 声明事件，emit('delete', id) 抛出，
 *   父组件模板里 @delete="handleDelete" 监听
 * - Vue 的 props 同样只读、同样单向数据流——理念一致，机制不同
 * - SFC 一文件一组件：子组件 ProductItem 必须是单独的 .vue 文件
 *
 * 最重要的区别：
 * - emit 是 Vue 专门的自定义事件机制（声明、抛出、监听三步）；React 完全没有对应物，
 *   没有一一对应关系——所谓「子传父」只是「父传给子的函数被子调用了」，纯 JavaScript
 * - React 的子组件可以与父组件同文件（组件只是函数）；本题 ProductItem 就写在下面
 * - 本题讲「机制」（callback props vs emit）；「状态该归谁」的设计判断——兄弟组件共享、为什么不能各存一份、
 *   何时留在子组件——见 25 题（状态提升与 state 归属）
 */
import { useState } from 'react'
import type { Product } from '@/shared/types'

/** 初始商品列表：用 Product 类型的常量初始化父组件 state */
const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: '机械键盘', price: 399, category: '外设', stock: 12 },
  { id: 'p2', name: '人体工学椅', price: 1299, category: '家具', stock: 5 },
  { id: 'p3', name: '4K 显示器', price: 1999, category: '外设', stock: 8 },
]

/**
 * 子组件的 props：数据（product）和回调（onDelete / onRename）放在同一个 interface 里。
 * 对 React 来说，函数和数字、字符串没有任何区别，都是普通 props——
 * Vue 则把两者拆成 defineProps 和 defineEmits 两套 API。
 */
interface ProductItemProps {
  product: Product
  onDelete: (id: string) => void
  onRename: (id: string, newName: string) => void
}

/**
 * 子组件 ProductItem，与父组件同文件——React 组件只是函数，一个文件放多个组件很常见；
 * Vue 对照版必须拆成单独的 vue/ProductItem.vue（SFC 一文件一组件）。
 */
function ProductItem({ product, onDelete, onRename }: ProductItemProps) {
  // 行内编辑是子组件自己的「局部 UI 状态」，父组件不关心，所以放在子组件里
  const [editing, setEditing] = useState(false)
  // 注意：useState 的初始值只在首次渲染生效，之后 props 变了它也不会自动同步，
  // 所以每次进入编辑（startEdit）都要手动重置为最新的 props 值
  const [draftName, setDraftName] = useState(product.name)

  function startEdit() {
    setDraftName(product.name)
    setEditing(true)
  }

  function confirmRename() {
    const name = draftName.trim()
    if (name !== '' && name !== product.name) {
      /**
       * 子组件想改名，但列表在父组件手里——绝不能写 product.name = name：
       * 1) props 只读，这是单向数据流的约定；
       * 2) 就算真改了，父组件的 state 引用没变、父组件也没有调 setState，
       *    父组件不会重渲染，UI 与数据源从此对不上。
       * 正确姿势：调用父组件传下来的回调，把「改名意图 + 数据」上报，由父组件 setState。
       * Vue 里这一步是 emit('rename', id, name)；React 没有事件系统，就是普通函数调用。
       * （顺带一提：Vue 里改深层 props 对象甚至会真的生效——响应式会穿透——
       * 但那同样是破坏单向数据流的错误做法，两个框架都应该走「上报」路线。）
       */
      onRename(product.id, name)
    }
    setEditing(false)
  }

  return (
    <div className="card">
      <div className="row">
        {editing ? (
          <>
            <input value={draftName} onChange={e => setDraftName(e.target.value)} />
            <button className="btn-primary" onClick={confirmRename}>
              确认
            </button>
            <button onClick={() => setEditing(false)}>取消</button>
          </>
        ) : (
          <>
            <strong>{product.name}</strong>
            <span className="muted">
              ￥{product.price} · {product.category} · 库存 {product.stock}
            </span>
            <button onClick={startEdit}>编辑</button>
            {/* 删除同理：只上报 id，具体怎么删（filter 出新数组）完全是父组件的事 */}
            <button className="btn-danger" onClick={() => onDelete(product.id)}>
              删除
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Example() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)

  // handle* 是「实现」，传给子组件时对接到 on* 这个「接口」上——命名约定，并非语法强制
  function handleDelete(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  function handleRename(id: string, newName: string) {
    // 不可变更新：map 出新数组，命中的那一项换成新对象；Vue 版直接 target.name = newName
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, name: newName } : p)))
  }

  return (
    <div className="stack">
      <p className="muted">
        数据只存在父组件（共 {products.length} 件）；子组件展示商品并「上报意图」，父组件执行修改
      </p>
      {/* 把函数当 props 传下去——JSX 里函数和别的值写法一致，都是花括号；
          Vue 里数据用 :product、事件用 @delete，语法上就分成了两类 */}
      {products.map(p => (
        <ProductItem key={p.id} product={p} onDelete={handleDelete} onRename={handleRename} />
      ))}
      {products.length === 0 && <p className="muted">商品已全部删除（重新进入本页可复位）</p>}
    </div>
  )
}
