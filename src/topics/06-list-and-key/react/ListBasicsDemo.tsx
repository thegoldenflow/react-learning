/**
 * 区块一：列表就是 JavaScript 的数组方法 —— 先 filter 再排序再 map；key 写在 map 直接返回的元素上；
 * 一项要渲染多个节点、又不能多包一层元素（表格里一项占两行 <tr>）时用 <Fragment key>。
 * Vue 对照：vue/ListBasicsDemo.vue（v-for + :key、computed 过滤排序、v-if 挪到外层容器、<template v-for> 的 key）。
 */
import { Fragment, useState } from 'react'
import { PRODUCT_CATEGORIES, PRODUCTS } from '@/shared/products'

type SortKey = 'default' | 'price-asc' | 'price-desc'

export function ListBasicsDemo() {
  const [category, setCategory] = useState('全部')
  const [plentyOnly, setPlentyOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('default')

  /**
   * ✅ 派生列表在渲染时算（❌ 另存一份 state 再用 Effect 同步，09 题）：「calculate it during rendering」。
   * 【最常用】先 filter 再 map（rendering-lists「Filtering arrays of items」）。没选筛选条件时直接用原数组 PRODUCTS —— 这样写是为了看出：
   * 这时候如果不拷贝就 sort，改掉的就是模块常量本身，sort 是原地排序（MDN ③「the array is sorted in place, and no copy is made」）。
   * 【最常用】排序前先拷贝 [...arr].sort()：updating-arrays 页的表格把 sort / reverse 列在「avoid (mutates the array)」一栏，做法是「copy the array first」。
   * toSorted() 不改原数组，但本项目 tsconfig 的 lib 是 ES2022，类型里还没有它（ES2023 才有，附 3）。
   * 这点计算量很小，不需要 useMemo（useMemo 的演示在 17 题）；官方的判断标准：「In general, unless you're creating or looping over thousands of objects, it's probably not expensive.」
   */
  const noFilter = category === '全部' && !plentyOnly
  const filtered = noFilter ? PRODUCTS : PRODUCTS.filter((p) => (category === '全部' || p.category === category) && (!plentyOnly || p.stock >= 10))
  const visible =
    sortKey === 'default' ? filtered : [...filtered].sort((a, b) => (sortKey === 'price-asc' ? a.price - b.price : b.price - a.price))

  return (
    <div className="card stack">
      <h3>区块一：列表就是 filter / sort / map</h3>
      <p className="muted">【最常用】先 filter 再 map、排序前先拷贝、key 用数据自带的 id（这里是 p.id）。</p>
      <div className="row">
        <label className="row">
          分类
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="分类">
            {/* 选项列表同样是 map；key 用分类名本身（稳定且唯一） */}
            {['全部', ...PRODUCT_CATEGORIES].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="row">
          <input type="checkbox" checked={plentyOnly} onChange={(e) => setPlentyOnly(e.target.checked)} />
          只看库存 ≥ 10 件
        </label>
        <label className="row">
          排序
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="排序">
            <option value="default">默认</option>
            <option value="price-asc">价格从低到高</option>
            <option value="price-desc">价格从高到低</option>
          </select>
        </label>
      </div>

      {/*
        map 返回 JSX；key 写在 map 直接返回的那个元素上（「JSX elements directly inside a map() call always need keys!」）。
        箭头函数写成块体 => { … } 时必须写 return，否则「nothing gets returned」—— 这一行用的是表达式体，省掉了 return。
      */}
      <ul className="stack" aria-label="商品列表">
        {visible.map((p) => (
          <li key={p.id}>
            {p.name} · ￥{p.price}
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="muted">没有符合条件的商品</p>}

      <p className="muted">
        一项要渲染多个节点：能多包一层元素就包一层（【最常用】，上面每项就是一个 <code>{'<li>'}</code>）；
        表格里一项占两行 <code>{'<tr>'}</code>，外面不能再包 <code>{'<div>'}</code>，这时用 <code>{'<Fragment key>'}</code>【常用】。
      </p>
      {/*
        简写的 <>…</> 不能带 key，要写 <Fragment key={…}>（Fragment 页「you can't use the <>...</> syntax」）。
        Fragment 不产生 DOM，<tbody> 里是平铺的 tr、tr、tr、tr（每项一行名称与价格、一行库存；真实项目里常见的是「主行 + 展开的明细行」）。
      */}
      <table aria-label="库存明细">
        <tbody>
          {visible.map((p) => (
            <Fragment key={p.id}>
              <tr>
                <td>{p.name}</td>
                <td>￥{p.price}</td>
              </tr>
              <tr>
                <td colSpan={2} className="muted">
                  库存 {p.stock} 件
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
