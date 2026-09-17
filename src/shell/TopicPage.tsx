/**
 * 知识点页面（壳应用基础设施）：并排渲染
 * 左侧「React（学习目标）」+ 右侧「Vue 3（你熟悉的对照）」，
 * 均可展开查看源码。
 */
import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react'
import { Link, useParams } from 'react-router'
import { defineAsyncComponent, type Component as VueComponent } from 'vue'
import {
  ALL_TOPICS,
  findTopic,
  loadReactExample,
  loadReactSource,
  loadVueExample,
  loadVueSource,
} from './topicRegistry'
import { VueMount } from '../bridge/VueMount'
import { ReactIsolatedMount } from '../bridge/ReactIsolatedMount'
import { ShellErrorBoundary } from './ShellErrorBoundary'

// 每题的示例组件在模块顶层一次性创建好，渲染时按 slug 直接取：
// - lazy() / defineAsyncComponent() 只登记加载器，渲染到该题时才真正下载对应的代码块；
// - 组件引用必须在多次渲染之间保持不变，否则示例会被反复卸载重挂。
//   React 文档要求 lazy 组件声明在模块顶层；在渲染中调用函数拿到组件再当 JSX 标签用，
//   即使内部做了缓存，也会被 react-hooks/static-components 规则拦下。
const reactExamples: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {}
const vueExamples: Partial<Record<string, VueComponent>> = {}
for (const { slug } of ALL_TOPICS) {
  const reactLoader = loadReactExample(slug)
  if (reactLoader) reactExamples[slug] = lazy(reactLoader)
  const vueLoader = loadVueExample(slug)
  if (vueLoader) vueExamples[slug] = defineAsyncComponent(vueLoader)
}

function SourceViewer({ load }: { load: () => Promise<string> }) {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    load().then((t) => {
      if (!cancelled) setText(t)
    })
    return () => {
      cancelled = true
    }
  }, [load])
  return <pre className="source-view">{text ?? '源码加载中…'}</pre>
}

export default function TopicPage() {
  const { slug = '' } = useParams()
  // key={slug}：切换知识点时整页重新挂载，「查看源码」开关等页面内 state 自动回到初始值。
  // 这是 React 文档推荐的「用 key 重置全部 state」；在 effect 里手动 setState 重置会多渲染一次，
  // 也会被 react-hooks/set-state-in-effect 规则拦下。
  return <TopicPageContent key={slug} slug={slug} />
}

function TopicPageContent({ slug }: { slug: string }) {
  const topic = findTopic(slug)
  const [showReactSrc, setShowReactSrc] = useState(false)
  const [showVueSrc, setShowVueSrc] = useState(false)

  const isolateReactRoot = topic?.isolateReactRoot ?? false
  const reactLoader = loadReactExample(slug)
  // 需要独立 React 树的示例（见 topicRegistry 的 isolateReactRoot）不走 lazy，
  // 由 ReactIsolatedMount 自己加载并挂载
  const ReactExample = isolateReactRoot ? undefined : reactExamples[slug]
  const vueComponent = vueExamples[slug]

  if (!topic) {
    return (
      <div className="topic-missing">
        <p>未找到该知识点。</p>
        <Link to="/">返回目录</Link>
      </div>
    )
  }

  const reactSrcLoader = loadReactSource(slug)
  const vueSrcLoader = loadVueSource(slug)

  return (
    <div className="topic-page">
      <header className="topic-header">
        <h1>
          <span className="topic-num">{slug.slice(0, 2)}</span> {topic.title}
        </h1>
        <p className="muted">{topic.summary}</p>
      </header>

      <div className="pane-grid">
        <section className="pane pane-react">
          <div className="pane-head">
            <div>
              <h2>
                React <span className="pane-tag pane-tag-react">学习目标</span>
              </h2>
              <code className="pane-path">src/topics/{slug}/react/Example.tsx</code>
            </div>
            {reactSrcLoader && (
              <button className="btn-ghost" onClick={() => setShowReactSrc((v) => !v)}>
                {showReactSrc ? '隐藏源码' : '查看源码'}
              </button>
            )}
          </div>
          {showReactSrc && reactSrcLoader && <SourceViewer load={reactSrcLoader} />}
          <div className="pane-body">
            {isolateReactRoot && reactLoader ? (
              <ReactIsolatedMount load={reactLoader} />
            ) : ReactExample ? (
              <ShellErrorBoundary key={`react-${slug}`}>
                <Suspense fallback={<p className="muted">示例加载中…</p>}>
                  <ReactExample />
                </Suspense>
              </ShellErrorBoundary>
            ) : (
              <p className="muted">该示例还没有创建。</p>
            )}
          </div>
        </section>

        <section className="pane pane-vue">
          <div className="pane-head">
            <div>
              <h2>
                Vue 3 <span className="pane-tag pane-tag-vue">你熟悉的对照</span>
              </h2>
              <code className="pane-path">src/topics/{slug}/vue/Example.vue</code>
            </div>
            {vueSrcLoader && (
              <button className="btn-ghost" onClick={() => setShowVueSrc((v) => !v)}>
                {showVueSrc ? '隐藏源码' : '查看源码'}
              </button>
            )}
          </div>
          {showVueSrc && vueSrcLoader && <SourceViewer load={vueSrcLoader} />}
          <div className="pane-body">
            {vueComponent ? (
              <VueMount component={vueComponent} createPlugins={topic.vuePlugins} />
            ) : (
              <p className="muted">该示例还没有创建。</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
