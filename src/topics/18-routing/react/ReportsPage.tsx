/**
 * 报表页（/reports）：由 dataRouter.tsx 里的路由级 lazy 按需加载（第一次进入时才下载这个模块）。
 * 它挂在「middleware 守卫」的分组路由下面，loader 用 context.get(userContext) 读 middleware 写入的用户。
 */
import { useLoaderData, type LoaderFunctionArgs } from 'react-router'
import type { DemoLog } from './demoLog'
import { userContext } from './dataRouter'

export interface ReportsLoaderData {
  viewer: string
  generatedAt: string
}

export function createReportsLoader(log: DemoLog, delayMs: number) {
  return async ({ request, context }: LoaderFunctionArgs): Promise<ReportsLoaderData> => {
    const user = context.get(userContext)
    const url = new URL(request.url)
    log.add(`${url.pathname}${url.search} · 报表 loader：执行（middleware 写入的用户：${user?.name ?? '无'}）`)
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return { viewer: user?.name ?? '', generatedAt: '2026-09-17 09:00' }
  }
}

export function ReportsPage() {
  const { viewer, generatedAt } = useLoaderData<ReportsLoaderData>()
  return (
    <div className="card stack">
      <h3>报表</h3>
      <p>
        查看人：{viewer} ｜ 生成时间：{generatedAt}
      </p>
      <p className="muted">
        退出登录后再点「报表」，看日志：守卫 middleware 在调用 loader 之前就 redirect 了，
        报表 loader 一行都没有出现 —— 和「设置」的 loader 守卫对比着看。
      </p>
    </div>
  )
}
