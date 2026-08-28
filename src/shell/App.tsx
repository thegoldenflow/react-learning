/**
 * 壳应用（基础设施）：左侧知识点目录 + 右侧内容区。
 * 壳本身就是一个真实的 React Router 应用，可以顺便观察路由的实际用法（详见 18 题）。
 */
import { NavLink, Route, Routes, Link } from 'react-router-dom'
import { PHASES } from './topicRegistry'
import TopicPage from './TopicPage'

function Home() {
  return (
    <div className="home">
      <h1>学 React（Vue 3 对照版）</h1>
      <p>
        每个知识点都并排运行两份实现同一业务场景的代码：
        <strong>React 是学习目标</strong>，注释里讲透 React 的思维方式与面试考点；
        Vue 3 版本是你已经熟悉的参照物，帮你快速建立对应关系。
      </p>
      <p className="muted">
        建议在编辑器里打开对应的 <code>Example.tsx</code> / <code>Example.vue</code>{' '}
        逐行阅读（页面里也可以直接「查看源码」），改一改代码，观察两边行为的差异。
      </p>
      {PHASES.map((phase) => (
        <section key={phase.label} className="home-phase">
          <h2>{phase.label}</h2>
          <div className="home-grid">
            {phase.topics.map((t) => (
              <Link key={t.slug} to={`/topic/${t.slug}`} className="home-card">
                <div className="home-card-title">
                  <span className="topic-num">{t.slug.slice(0, 2)}</span> {t.title}
                </div>
                <div className="home-card-summary">{t.summary}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          学 React
          <span>Vue 3 对照版</span>
        </Link>
        <nav>
          {PHASES.map((phase) => (
            <div key={phase.label} className="nav-group">
              <div className="nav-group-label">{phase.label}</div>
              {phase.topics.map((t) => (
                <NavLink key={t.slug} to={`/topic/${t.slug}`} className="nav-item">
                  <span className="nav-num">{t.slug.slice(0, 2)}</span>
                  {t.title}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topic/:slug" element={<TopicPage />} />
        </Routes>
      </main>
    </div>
  )
}
