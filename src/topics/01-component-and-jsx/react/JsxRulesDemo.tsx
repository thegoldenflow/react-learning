/**
 * 区块二：JSX 编译成什么、几条硬规则 —— 编译结果对照 + style 补 px 实测 + 列表里的 Fragment 要带 key。
 * 使用频率：automatic runtime【最常用】（19 起必须）；classic runtime【旧写法】（面试常问编译结果，照样显示）；列表里一次返回多个节点用 <Fragment key>【常用】。
 * Vue 对照：vue/TemplateRulesDemo.vue。
 *
 * JSX 不是模板，是 JavaScript 的语法扩展，浏览器不认识，要由构建工具编译。React 17 起的「新 JSX 转换」（automatic runtime）
 * 把它编译成对 react/jsx-runtime 里 jsx() / jsxs() 的调用，并由编译器自动加上 import —— 所以组件文件不再需要 import React。
 * 本项目用 Vite + @vitejs/plugin-react，默认就是 automatic runtime（插件 README：「By default, the plugin uses the automatic JSX runtime」）。
 * 下面三栏：源码、automatic 编译结果、classic 编译结果（esbuild 0.28.2 实测，只保留了关键部分）。
 * automatic 这一栏是生产构建的形态；开发环境（vite dev、Vitest）编译成 react/jsx-dev-runtime 的 jsxDEV()，多带源码位置，用来给报错定位。
 */
import { Fragment, useRef, useState } from 'react'

const SOURCE = `const vipTag = <span className="badge">VIP</span>
const card = <div className="card"><strong>{name}</strong>{vipTag}</div>
const frag = <><A /><B /></>`

const AUTOMATIC = `import { Fragment, jsx, jsxs } from "react/jsx-runtime"
const vipTag = jsx("span", { className: "badge", children: "VIP" })
const card = jsxs("div", { className: "card", children: [
  jsx("strong", { children: name }),
  vipTag
] })
const frag = jsxs(Fragment, { children: [jsx(A, {}), jsx(B, {})] })`

const CLASSIC = `// 旧写法：文件里必须有 React 这个变量（import React from 'react'）
const vipTag = React.createElement("span", { className: "badge" }, "VIP")
const card = React.createElement("div", { className: "card" },
  React.createElement("strong", null, name), vipTag)
const frag = React.createElement(React.Fragment, null,
  React.createElement(A, null), React.createElement(B, null))`

/** 同一组 style 数字，渲染后读 DOM 上的 style 属性：哪些补了 px、哪些没补 */
const NUMERIC_STYLE = { width: 48, borderWidth: 2, padding: 0, lineHeight: 1.5, opacity: 0.5, zIndex: 3, fontWeight: 700, flexGrow: 2 }

const TERMS = [
  { term: 'JSX', desc: 'JavaScript 的语法扩展，编译成函数调用' },
  { term: 'Fragment', desc: '把多个节点包成一个返回值，不产生 DOM' },
]

export function JsxRulesDemo() {
  const probeRef = useRef<HTMLDivElement>(null)
  const [renderedStyle, setRenderedStyle] = useState<string | null>(null)

  return (
    <div className="card stack">
      <h3>区块二：JSX 编译成什么 · 几条硬规则</h3>
      <div className="row" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div className="stack" style={{ flex: '1 1 260px', minWidth: 0 }}>
          <strong>源码（JSX）</strong>
          <pre className="source-view" style={{ margin: 0, overflowX: 'auto' }}>{SOURCE}</pre>
        </div>
        <div className="stack" style={{ flex: '1 1 260px', minWidth: 0 }}>
          <strong>automatic runtime【最常用】（React 17 起，19 必须；生产构建，开发环境是 jsxDEV）</strong>
          <pre className="source-view" style={{ margin: 0, overflowX: 'auto' }}>{AUTOMATIC}</pre>
        </div>
        <div className="stack" style={{ flex: '1 1 260px', minWidth: 0 }}>
          <strong>classic runtime【旧写法】</strong>
          <pre className="source-view" style={{ margin: 0, overflowX: 'auto' }}>{CLASSIC}</pre>
        </div>
      </div>
      <p className="muted">
        看编译结果就能回答几个面试追问：小写标签编译成字符串 "span"、大写组件编译成变量 A；多个子节点用 jsxs、children 是数组；
        Fragment 也只是一个特殊的类型。JSX 就是这些调用的返回值（React 元素，一个普通对象），所以能存变量、当参数、被 return。
      </p>

      <div className="stack">
        <strong>style 里的数字：哪些补 px（style 只放依赖数据的值，静态样式走 className，见区块一）</strong>
        {/* 演示用的探针元素：看不见，只为读出 React 写到 DOM 上的 style */}
        <div ref={probeRef} style={NUMERIC_STYLE} hidden />
        <div className="row">
          <code>{JSON.stringify(NUMERIC_STYLE)}</code>
          {/* 读 DOM 放在事件处理函数里：渲染期间不能读 ref.current（12 题） */}
          <button onClick={() => setRenderedStyle(probeRef.current?.getAttribute('style') ?? '')}>读出渲染后的 style 属性</button>
        </div>
        <p aria-label="渲染后的 style">{renderedStyle ?? '（点按钮读取）'}</p>
      </div>

      <div className="stack">
        <strong>【常用】列表里要一次返回多个节点：用 &lt;Fragment key&gt;，简写 &lt;&gt; 不能带 key</strong>
        <dl>
          {TERMS.map((t) => (
            <Fragment key={t.term}>
              <dt>{t.term}</dt>
              <dd>{t.desc}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </div>
  )
}
