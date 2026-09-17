/**
 * safeRedirect —— 校验「登录后跳回哪里」这类来自 URL 的回跳地址（18 题 React / Vue 两侧共用）。
 *
 * 为什么必须校验【主流】：?redirectTo= 是用户可控的输入。攻击者可以发出
 * https://你的站点/login?redirectTo=https://evil.example 这样的链接，用户登录后就被带去钓鱼站，
 * 这类漏洞叫「开放重定向」（OWASP Unvalidated Redirects and Forwards Cheat Sheet，③）。
 * React Router 官方 redirect 文档要求应用自己校验：「the application should validate any
 * user-supplied inputs to redirects」；它在浏览器里遇到跨域的绝对地址会整页跳过去。
 * vue-router 的 router.replace() 同样不替你把关。
 *
 * 规则：只接受站内路径。
 * 1. 必须以 / 开头；
 * 2. 不能以 // 或 /\ 开头：浏览器会把它们当成省略了协议的外部地址（//evil.example）；
 * 3. 最后用 URL 解析再核对一次 origin：WHATWG URL 解析会先删掉制表符和换行
 *    （url.spec.whatwg.org「Remove all ASCII tab or newline from input」，③），
 *    "/\t/evil.example" 这类写法绕过前两条后，解析结果同样会变成外部域名。
 * 任何一条不满足，都返回 fallback。
 *
 * 前端校验不能替代后端：这个函数只防「把用户带去外站」，不做鉴权（35 题，待新增）。
 */
const CHECK_BASE = 'http://safe-redirect.invalid'

export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  fallback = '/',
): string {
  if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('//') || to.startsWith('/\\')) {
    return fallback
  }

  let url: URL
  try {
    url = new URL(to, CHECK_BASE)
  } catch {
    return fallback
  }
  if (url.origin !== CHECK_BASE) {
    return fallback
  }
  // 返回解析后的标准形式（路径 + 查询串 + hash），不把原始字符串原样交出去
  return url.pathname + url.search + url.hash
}
