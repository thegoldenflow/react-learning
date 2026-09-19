/**
 * 区块三：三元两边是同一个组件时，state 不会重置 —— React 看的是「UI 树里的位置」，不是你在 JSX 里写了几个标签。
 * 这是本题最容易出 bug 的地方：切换查看的客户，上一位客户的草稿串到了下一位身上。
 * Vue 对照：vue/PositionDemo.vue（模板里的 v-if / v-else 两个分支即使是同一个组件，没包 <KeepAlive> 时切换也会销毁重建；Vue 的渲染函数里写三元则和 React 一样复用）。
 */
import { useState } from 'react'

/** 带内部 state 的编辑器：草稿存在组件自己的 state 里 */
function DraftEditor({ customer }: { customer: string }) {
  const [draft, setDraft] = useState('')
  return (
    <label className="row">
      给 {customer} 的备注：
      <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={`${customer} 的备注`} />
    </label>
  )
}

export function PositionDemo() {
  const [isTaylor, setIsTaylor] = useState(true)

  return (
    <div className="card stack">
      <h3>区块三：三元两边是同一个组件，state 会被保留</h3>
      <p className="muted">在每一行里各输入一点备注，再点「切换客户」，看哪一行的草稿跟着留下来了。</p>
      <div className="row">
        <button onClick={() => setIsTaylor((v) => !v)}>切换客户（当前：{isTaylor ? 'Taylor' : 'Sarah'}）</button>
      </div>

      {/*
        ❌ 两个分支都是 <DraftEditor>，渲染在同一个位置：React 认为是「同一个编辑器换了 props」，state（草稿）原样保留。
        「Remember that it's the position in the UI tree—not in the JSX markup—that matters to React!」
        「React doesn't know where you place the conditions in your function. All it "sees" is the tree you return.」
      */}
      <div data-testid="same-position">
        <p className="muted">① 三元，两边都是 {'<DraftEditor>'}（同一位置）</p>
        {isTaylor ? <DraftEditor customer="Taylor" /> : <DraftEditor customer="Sarah" />}
      </div>

      {/* ✅【最常用】方法二：给每个分支不同的 key（真实项目里通常是 key={userId}） —— 「Specifying a key tells React to use the key itself as part of the position」，换 key 就是另一个组件实例，state 从头开始（06 题） */}
      <div data-testid="with-key">
        <p className="muted">② 三元，两边给不同的 key【最常用】</p>
        {isTaylor ? <DraftEditor key="Taylor" customer="Taylor" /> : <DraftEditor key="Sarah" customer="Sarah" />}
      </div>

      {/* ✅【少用】方法一：渲染在不同位置（官方示例正好是两个 &&）—— 「Each Counter's state gets destroyed each time it's removed from the DOM.」只适合分支很少的情况，项目里重置 state 基本都用 key */}
      {/* 【少用】取消注释即可运行：删掉这一行和下面的结束行
      <div data-testid="different-positions">
        <p className="muted">③ 两个 &&（渲染到不同位置）【少用】</p>
        {isTaylor && <DraftEditor customer="Taylor" />}
        {!isTaylor && <DraftEditor customer="Sarah" />}
      </div>
      */}
    </div>
  )
}
