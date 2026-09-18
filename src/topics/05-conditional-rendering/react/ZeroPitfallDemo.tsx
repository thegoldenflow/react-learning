/**
 * 区块二：&& 的 0 陷阱 —— 左边是假值时，&& 返回的就是左边这个值本身（不是 false）；左边是 0 时整个表达式就是 0，React 把它当文本渲染出来。
 * Vue 对照：vue/ZeroPitfallDemo.vue（v-if 按 truthy 判断，没有这个问题；但插值里写 count && '…' 一样显示 0，false 还会显示成「false」）。
 */
import { useState } from 'react'

const PRICES = [399, 129, 259]

export function ZeroPitfallDemo() {
  const [itemCount, setItemCount] = useState(3)
  const prices = PRICES.slice(0, itemCount)
  // 没有商品时 0 / 0 是 NaN：NaN 也是数字，放在 && 左边同样会被渲染出来
  const average = prices.reduce((sum, p) => sum + p, 0) / prices.length

  return (
    <div className="card stack">
      <h3>区块二：&& 的 0 陷阱</h3>
      <div className="row">
        <button onClick={() => setItemCount(0)}>清空商品（数量设为 0）</button>
        <button onClick={() => setItemCount(3)}>恢复为 3 件</button>
      </div>
      <ul className="stack">
        {/*
          ❌ 官方 Pitfall：「Don't put numbers on the left side of &&.」「if the left side is 0, then the whole expression gets that value (0), and React will happily render 0
          rather than nothing.」清空商品后这一行会凭空多出一个「0」。NaN 同理（下一行显示「NaN」）；true / false / null / undefined / 空字符串不显示任何东西（Example.test.tsx 覆盖）。
        */}
        <li data-testid="wrong-count">❌ {'{itemCount && …}'}：{itemCount && <span>购物车共 {itemCount} 件商品</span>}</li>
        <li data-testid="wrong-average">❌ {'{average && …}'}：{average && <span>均价 ￥{average.toFixed(2)}</span>}</li>
        {/* ✅ 官方修法：「make the left side a boolean: messageCount > 0 && …」。!!itemCount、Boolean(itemCount)、三元 … : null 也行（这几种是补充，不是官方原文） */}
        <li data-testid="right-count">✅ {'{itemCount > 0 && …}'}：{itemCount > 0 && <span>购物车共 {itemCount} 件商品</span>}</li>
        <li data-testid="right-average">
          ✅ {'{Number.isFinite(average) ? … : null}'}：{Number.isFinite(average) ? <span>均价 ￥{average.toFixed(2)}</span> : null}
        </li>
      </ul>
      <p className="muted">
        TypeScript 拦不住：{'{itemCount && <span/>}'} 的结果可能是数字 0，而 ReactNode 本来就包含 number（@types/react index.d.ts:436-449），类型检查照样通过；
        lint 能拦（eslint-plugin-react 的 jsx-no-leaked-render），但本项目没装这个插件。
      </p>
    </div>
  )
}
