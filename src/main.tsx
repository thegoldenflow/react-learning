/**
 * React 应用入口。
 * StrictMode：开发期会把组件渲染两次、把 effect 挂载→卸载→重挂载一次，
 * 用来暴露不纯的渲染和没写 cleanup 的 effect —— 这是工业界默认开启的保险，
 * 各示例（尤其 10/11 题）的注释会解释它带来的现象。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './shell/App'
import './shared/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
