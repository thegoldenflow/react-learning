/**
 * 工具链冒烟测试（React 侧）——项目基础设施，不是知识点。
 * 课件升级阶段 1 接入 Vitest 时写的，只证明这些依赖在测试环境里能跑通：
 * Vitest + jsdom + @testing-library/react + user-event + jest-dom、react-router（Data 模式 API）、
 * react-error-boundary。34 测试题落地后可以并入或删除；各题的测试与示例放同目录（react/Example.test.tsx）。
 */
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, useParams } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { ErrorBoundary } from 'react-error-boundary'

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount((c) => c + 1)}>
      点击 {count} 次
    </button>
  )
}

function OrderDetail() {
  const { id } = useParams()
  return <h1>订单 {id}</h1>
}

function Boom(): never {
  throw new Error('boom')
}

describe('React 测试工具链', () => {
  it('render + user-event + jest-dom 断言', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('点击 1 次')
  })

  it('react-router：createMemoryRouter + RouterProvider 渲染带参数的路由', async () => {
    // 这条同时守着 vitest.config.ts 里 resolve.conditions 的修复：去掉那一项，useParams() 会读到空对象
    const router = createMemoryRouter([{ path: '/orders/:id', element: <OrderDetail /> }], {
      initialEntries: ['/orders/o1'],
    })
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading')).toHaveTextContent('订单 o1')
  })

  it('react-error-boundary：子树渲染时抛错，显示 fallback', () => {
    // React 19 把被错误边界捕获的错误报告到 console.error，这里静音，免得测试输出里一片红
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={<p role="alert">出错了</p>}>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('出错了')
    consoleError.mockRestore()
  })
})
