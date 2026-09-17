/**
 * safeRedirect 的测试：每条用例对应一种真实出现过的开放重定向写法。
 */
import { safeRedirect } from './safeRedirect'

describe('safeRedirect：只放行站内路径', () => {
  it('站内路径原样保留查询串和 hash', () => {
    expect(safeRedirect('/settings/profile?tab=email#top')).toBe('/settings/profile?tab=email#top')
  })

  it('缺省值：null / undefined / 非字符串（FormData 里的文件）一律回到 fallback', () => {
    expect(safeRedirect(null)).toBe('/')
    expect(safeRedirect(undefined, '/orders')).toBe('/orders')
    expect(safeRedirect(new File(['x'], 'x.txt'), '/orders')).toBe('/orders')
  })

  it('不以 / 开头的相对路径和带协议的地址被拒绝', () => {
    expect(safeRedirect('settings', '/orders')).toBe('/orders')
    expect(safeRedirect('https://evil.example/login', '/orders')).toBe('/orders')
    expect(safeRedirect('javascript:alert(1)', '/orders')).toBe('/orders')
  })

  it('// 与 /\\ 开头会被浏览器当成外部地址，被拒绝', () => {
    expect(safeRedirect('//evil.example', '/orders')).toBe('/orders')
    expect(safeRedirect('/\\evil.example', '/orders')).toBe('/orders')
  })

  it('制表符 / 换行夹在斜杠之间：URL 解析会删掉它们，结果指向外部域名，也被拒绝', () => {
    // 先证明这种写法确实危险：删掉 \t 之后就成了 //evil.example
    expect(new URL('/\t/evil.example', 'https://shop.example').host).toBe('evil.example')
    expect(safeRedirect('/\t/evil.example', '/orders')).toBe('/orders')
    expect(safeRedirect('/\n/evil.example', '/orders')).toBe('/orders')
  })
})
