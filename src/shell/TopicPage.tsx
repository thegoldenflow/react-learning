/**
 * 知识点页面（壳应用基础设施）：并排渲染
 * 左侧「React（学习目标）」+ 右侧「Vue 3（你熟悉的对照）」，
 * 均可展开查看源码。
 */
import { Suspense, lazy, useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { defineAsyncComponent, type Component as VueComponent } from 'vue'
import {
  findTopic,
  loadReactExample,
  loadReactSource,
  loadVueExample,
  loadVueSource,
} from './topicRegistry'
import { VueMount } from '../bridge/VueMount'
import { ReactIsolatedMount } from '../bridge/ReactIsolatedMount'
import { ShellErrorBoundary } from './ShellErrorBoundary'

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
  const topic = findTopic(slug)
  const [showReactSrc, setShowReactSrc] = useState(false)
  const [showVueSrc, setShowVueSrc] = useState(false)

  const isolateReactRoot = topic?.isolateReactRoot ?? false

  // lazy() / defineAsyncComponent() 的结果必须按 slug 缓存：
  // 若在每次渲染时重新创建，示例会被反复卸载重挂。
  const reactLoader = useMemo(() => loadReactExample(slug), [slug])
  const ReactExample = useMemo<ComponentType | null>(() => {
    // 需要独立 React 树的示例（见 topicRegistry 的 isolateReactRoot）不走 lazy，
    // 由 ReactIsolatedMount 自己加载并挂载
    if (!reactLoader || isolateReactRoot) return null
    return lazy(reactLoader)
  }, [reactLoader, isolateReactRoot])

  const vueComponent = useMemo<VueComponent | null>(() => {
    const loader = loadVueExample(slug)
    return loader ? defineAsyncComponent(loader) : null
  }, [slug])

  useEffect(() => {
    setShowReactSrc(false)
    setShowVueSrc(false)
  }, [slug])

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
