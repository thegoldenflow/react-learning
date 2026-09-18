/**
 * 主题：20. 错误边界（手写 class 主线 · react-error-boundary 并排 · 对照 Vue onErrorCaptured）
 * 适用版本：React 19.2 · react-error-boundary 6.1 · react-router 7.x（只引用）· Vue 3.5
 * 最后核对：2026-09-18
 * 前置主题：06 key（换 key 重置）、10 useEffect、14 useSyncExternalStore（日志面板）、18 路由（路由级错误边界）、19 异步提交（错误分层）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 入口）· ErrorBoundary.tsx【主线：手写 class 边界】· BoundaryBasicsDemo.tsx（区块一）·
 *          CatchScopeDemo.tsx（区块二）· LibraryBoundaryDemo.tsx（区块三 · 并排）· RootOptionsDemo.tsx（区块四）· errorLog.ts ·
 *          Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 错误边界是实现了 static getDerivedStateFromError 的 class 组件：子树渲染出错时把错误转成 state、渲染兜底界面；componentDidCatch 负责上报。
 *   函数组件目前写不了边界，生产项目常用 react-error-boundary【主流】。
 * - 接得住：子树渲染中的错误（渲染、生命周期、构造函数）、lazy 加载失败、use(promise) 被拒绝、useTransition 返回的 startTransition 里抛的错
 *   【主流·19.0 起】；接不住：事件处理函数、setTimeout 等异步回调、服务端渲染、边界自己抛的错【主流】。
 * - 接不住的错误：try / catch 转成 state 显示，或用 react-error-boundary 的 showBoundary 交给最近的边界【主流】。
 * - 没有边界时 React 会移除整棵界面。React 19 起不再重复抛错：被边界接住的交给 console.error，没接住的交给 reportError；
 *   createRoot 的 onCaughtError / onUncaughtError 可以接管上报【主流·19.0 起】。
 * - Vue：任何组件注册 onErrorCaptured 就能当边界，连事件处理函数的错误、以及交回给 Vue 的 Promise 被拒绝（例如模板上的 async 处理函数）都能接；
 *   return false 停止传播；app.config.errorHandler 是全局兜底。
 *
 * 二、核心概念（React）
 * 1. 为什么需要边界【主流】。react.dev Component 页：「By default, if your application throws an error during rendering, React will remove its UI
 *    from the screen. To prevent this, you can wrap a part of your UI into an Error Boundary.」区块四的「没有边界的组件崩溃」按钮能看到整棵小根变空白。
 * 2. 写法【主流】（ErrorBoundary.tsx）：「To implement an Error Boundary component, you need to provide static getDerivedStateFromError ... You can also
 *    optionally implement componentDidCatch」。「static getDerivedStateFromError should be a pure function」，副作用放 componentDidCatch；
 *    info.componentStack 是出错组件和它所有祖先的调用链（生产环境名字会被压缩）。throw 出来的不一定是 Error（「JavaScript allows to throw any value,
 *    including strings or even null」），所以类型写 unknown、用 hasError 标记。为什么必须是 class：「There is currently no way to write an Error Boundary
 *    as a function component. However, you don't have to write the Error Boundary class yourself. For example, you can use react-error-boundary instead.」
 *    class 组件没有被弃用；同一页还说 getSnapshotBeforeUpdate 也没有函数组件的等价写法。
 * 3. 接得住什么【主流】（区块二，每条都有测试）：Component 页列的「do not catch」只有四类 ——「Event handlers」「Server side rendering」「Errors thrown in
 *    the error boundary itself」「Asynchronous code (e.g. setTimeout or requestAnimationFrame callbacks); an exception is the usage of the startTransition
 *    function returned by the useTransition Hook」。其余都进边界：渲染、生命周期、构造函数；useTransition 页「If a function passed to startTransition
 *    throws an error or returns a rejected Promise, you can display an error to your user with an error boundary」（同步、async 都算，19.0 起）；
 *    lazy 页「If the Promise rejects, React will throw the rejection reason for the nearest Error Boundary to handle」；use 页「If the Promise is rejected,
 *    the fallback of the nearest Error Boundary will be displayed」（32 题，待新增）；useActionState 的 action 抛错也会「shows the nearest Error Boundary」
 *    （31 题，待新增）。注意是 useTransition 返回的那个：直接从 react 导入的顶层 startTransition 抛错进不了边界
 *    （useTransition 页「Because the standalone function is not associated with a component, an Error Boundary cannot handle errors from its Transition.」，测试覆盖）。
 * 4. 接不住的错误去了哪（react-dom 19.2.8 实测，测试覆盖）：事件处理函数里的错误被 React 捕获后交给 reportError（executeDispatch 里的 try / catch，
 *    浏览器会派发 window 的 error 事件；其他监听照常执行）；setTimeout 里的是普通未捕获异常（window 的 error 事件）；async 处理函数 await 之后的是
 *    未处理的 Promise 拒绝（unhandledrejection 事件）。处理方法：try / catch 转成 state（19 题的错误分层），或 showBoundary 交给边界（区块三）。
 * 5. 重置【主流】（区块一）：边界接住错误时，React 已经把出错的子树卸载了，重置后子树以全新实例挂载（state 归零）。三种方式：调用 reset；
 *    resetKeys（数组里任何一项变了就自动重置，像「换了一个商品 id」）；在外面换 key 重新挂载整个边界（06 题）。
 *    resetKeys 的实现要跳过「刚捕获错误的那一次更新」，否则导致出错的那次 key 变化会立刻把边界重置掉（react-error-boundary 源码同样的判断）。
 *    坑：lazy 会缓存被拒绝的 Promise（lazy 页「Both the returned Promise and the Promise's resolved value will be cached」），重置边界不会重新下载，
 *    要重试得重新调用 lazy()。
 * 6. 上报【主流·19.0 起】（区块四）：局部上报在 componentDidCatch / onError 里；全局在 createRoot 的回调里 ——「onCaughtError: Callback called when React
 *    catches an error in an Error Boundary」「onUncaughtError: Callback called when an error is thrown and not caught by an Error Boundary」，
 *    onRecoverableError（18.0 起）是 React 自动恢复的错误。默认行为「By default, React will log all errors to the console」：19.2.8 源码里被接住的
 *    console.error、没接住的 reportError（开发环境再加一条建议加边界的 console.warn）。React 19 升级指南「Errors in render are not re-thrown」。
 *    【较新·19.1 起】captureOwnerStack() 能在开发环境拿到 Owner Stack，生产构建里不存在，调用前要判断开发环境。
 * 7. react-error-boundary【主流】（区块三，已安装 6.1.3）：<ErrorBoundary> 的 fallback / fallbackRender / FallbackComponent（优先级 fallbackRender >
 *    FallbackComponent > fallback）、onError、onReset（details.reason 是 'imperative-api' 或 'keys'）、resetKeys；useErrorBoundary() 的 showBoundary /
 *    resetBoundary；withErrorBoundary 高阶组件；getErrorMessage。6.0.0 曾只发 ESM，6.0.1 起又带回 CommonJS 构建，peer 也从 >=16.13.1 收紧为 React 18 或 19；
 *    6.1 起错误类型是 unknown。
 * 8. 粒度与分层【主流】：根边界兜底（不让整页白屏）+ 路由级边界（18 题）+ 局部边界（弹窗、卡片、第三方组件）。边界处理的是「意外」：
 *    React Router 文档「Error boundaries are not intended for rendering form validation errors or error reporting」「It's not recommended to intentionally
 *    throw errors to force the error boundary to render as a means of control flow」；同一页也写了例外：「There are exceptions to the rule in #2,
 *    especially 404s」—— loader 找不到数据时 throw data(..., { status: 404 }) 交给路由级边界（18 题）。可预期的失败转成 state，或像 Actions 那样作为返回值（31 题，待新增）。
 * 9. lint【主流】：eslint-plugin-react-hooks 7 的 recommended 预设里有 error-boundaries 规则（「Validates usage of Error Boundaries instead of try/catch for
 *    errors in child components」）：在组件体的 try 里构造 JSX 会被拦下 ——「Try/catch blocks can't catch errors that happen during React's rendering process」。
 *    事件处理函数里的 try / catch 不受影响（本课区块二就有，lint 通过）。
 *
 * 三、Vue 对照
 * - onErrorCaptured((err, instance, info) => boolean | void)【主流】：「Registers a hook to be called when an error propagating from a descendant component has been
 *   captured」。来源（官方列表）：「Component renders」「Event handlers」「Lifecycle hooks」「setup() function」「Watchers」「Custom directive hooks」
 *   「Transition hooks」。info 在生产环境是短代码。
 * - 传播规则（官方四条）：默认仍会送到 app.config.errorHandler；多个 errorCaptured「will be invoked on the same error, in the order of bottom to top」；
 *   钩子自己抛错时两个错误都送 errorHandler；「An errorCaptured hook can return false to prevent the error from propagating further」—— 也不会再打印
 *   （runtime-core handleError 直接 return）。app.config.errorHandler 的默认行为「will re-throw errors during development and log errors during production」；
 *   【较新·3.5 起】app.config.throwUnhandledErrorInProduction 可以让生产环境也抛出。
 * - 捕获面更宽：模板上的事件处理函数（同步 throw，以及处理函数返回的 Promise 被拒绝 —— runtime-core callWithAsyncErrorHandling
 *   只接住交回给 Vue 的 Promise；在 onMounted 里调一个 async 函数却不 return，它的拒绝 Vue 就看不到）、watch 回调都进 onErrorCaptured，
 *   info 分别是 'native event handler'、'watcher callback'（Vue 侧测试覆盖）；setTimeout 回调、自己 addEventListener 的监听不经过 Vue，照样接不住。
 * - Vue 不替你换界面：钩子只负责通知，兜底界面要自己用 v-if 切（vue/ErrorBoundary.vue）。出错的组件本身 —— 渲染函数里抛错时渲染成一个空注释节点
 *   （runtime-core.cjs.js:4695-4698），computed 在更新前的脏检查里抛错时界面停在上一次的样子（info 是 'component update'），两种情况实例和 state 都还在
 *   （测试覆盖）。官方提醒：「the error state should not render the original content that caused the error; otherwise the component will be thrown into an
 *   infinite render loop」。
 * - 全局兜底【主流】：app.config.errorHandler ↔ createRoot 的 onCaughtError / onUncaughtError —— 都是应用级的上报入口；区别是 Vue 的 errorHandler 还会收到
 *   事件处理函数的错误。生产监控：production-deployment 页「The app-level error handler can be used to report errors to tracking services」。
 * - <Suspense>【尝鲜·实验性】没有自己的错误处理：「you can use the errorCaptured option or the onErrorCaptured() hook to capture and handle async errors in the parent
 *   component of <Suspense>」。
 *
 * 四、关键区别（每条写明前提）
 * 1. 捕获面：React 边界只接渲染流程里的错误（+ 19.0 起 useTransition 的 startTransition）；Vue 3.5 的 onErrorCaptured 接 Vue 负责调用的代码里的错误，包括事件处理函数和交回给 Vue 的被拒绝的 Promise。
 * 2. 形式：React 是专门的 class 组件（目前没有函数写法）；Vue 是任何组件里的一个钩子。
 * 3. 界面：React 卸载整棵出错子树、渲染 fallback；Vue 只通知，界面切换自己写，出错的组件本身留在原地。
 * 4. 传播：React 只交给最近的边界；Vue 自下而上逐级调用，直到某个钩子 return false，最后到 errorHandler。
 * 5. 日志：React 19 被接住的错误默认 console.error（传了 onCaughtError 就由你决定）；Vue 里 return false 之后不再打印。
 *
 * 五、常见追问与回答要点
 * - onClick 里的错误为什么接不住？不在渲染流程里，React 调事件处理函数时自己 try / catch 了，交给 reportError；要显示就 try / catch 转 state，或 showBoundary。
 * - 为什么只能是 class？目前没有对应的 Hook；生产用 react-error-boundary。getDerivedStateFromError 纯函数改 state，componentDidCatch 做副作用。
 * - 怎么重试？reset / resetKeys / 换 key；重试前先消除出错的原因（换 id、清掉坏数据），否则会立刻再崩一次。
 * - React 19 在错误处理上改了什么？不再重复抛错和重复打印；新增 onCaughtError / onUncaughtError；useTransition 的 startTransition 里的错误进边界。
 * - Action 里 throw 会怎样？useActionState 页「React cancels all queued actions and shows the nearest Error Boundary」；可预期的错误作为 state 返回（31 题，待新增）。
 * - 路由里怎么处理错误？React Router 的路由级 ErrorBoundary 接 loader / action / 渲染错误，上报用 RouterProvider 的 onError【较新·7.11 起】（18 题）。
 * - Vue 的 return false 是什么意思？「this error has been handled and should be ignored」：后面的 errorCaptured 和 errorHandler 都不再调用。
 *
 * 六、易错点
 * - 以为「异步错误一律接不住」：useTransition 的 startTransition、lazy、use(promise) 都能进边界；反过来以为顶层 startTransition 也能进（不能）。
 * - 以为边界能接事件处理函数的错误（React 接不住，Vue 能接）。
 * - 只有局部边界、没有根边界：一个没接住的渲染错误就让整页空白。
 * - fallback 里又渲染了出错的内容 → 再次抛错（Vue 文档说会陷入无限渲染）；边界自己的错误只能由外层边界接。
 * - 用边界做表单校验这类流程控制。404 是 React Router 文档点名的例外：loader 里 throw data(..., { status: 404 }) 交给路由级边界（18 题）。
 * - resetKeys 自己实现时忘了跳过刚出错的那次更新；lazy 失败后以为重置边界就会重新下载。
 * - componentDidCatch 里 setState 渲染兜底界面（旧写法，见八）。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：错误是按钮故意触发的；上报只写进页面日志；区块二用 preventDefault 阻止浏览器再打印一遍接不住的错误（真实项目别这样，要上报）。
 * - 根：createRoot 传 onCaughtError / onUncaughtError / onRecoverableError 统一上报（Sentry 等）；createRoot 页提醒开发环境可以去掉这些选项，保留 React 默认的控制台输出。
 * - 每个可能出错的区域一个边界，fallback 带「重试」，resetKeys 跟着路由参数 / 数据 id 走；fallback 里只放不会出错的简单内容。
 * - 手写边界时注意 throw null / throw 字符串：用 hasError 标记（react-error-boundary 6.1.3 在 throw null 时重置不生效，6.1.4 修复）。
 * - 路由项目：路由级 ErrorBoundary 与组件级边界分工，不互相替代（18 题）；服务端渲染的错误由框架处理（33 题，待新增）。
 * - 开发环境看到被边界接住的错误仍打印在控制台，是 React 默认的 onCaughtError，不是边界失效。
 * - Vue：app.config.errorHandler 接监控；生产环境默认只打印，需要抛出时用 throwUnhandledErrorInProduction（3.5 起）。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - React 15 的 unstable_handleError → React 16（2017）的 componentDidCatch。16.0～16.5 常在 componentDidCatch 里 setState 渲染兜底；16.6（2018-10）加了
 *   static getDerivedStateFromError。Component 页：「In the past, it was common to call setState inside componentDidCatch ... This is deprecated in favor of
 *   defining static getDerivedStateFromError.」
 * - React 18 及之前：渲染错误被捕获后还会重新抛出，开发环境重复打印（19 起不再这样）；没有 onCaughtError / onUncaughtError；Transition 里的错误不进边界。
 *   react.dev Component 页 componentDidCatch 的 Caveats 还写着「In development, the errors will bubble up to window」—— React 19.2.8 实测被边界接住的错误
 *   不会触发 window 的 error 事件（测试覆盖），这句描述的是旧版本行为。
 * - react-error-boundary 5 → 6：6.0.0 只发 ESM、peer 仍是 react >=16.13.1；6.0.1 起又带回 CommonJS 构建，peer 改为 React 18 或 19（npm view 逐版本核对）。
 * - 测试里从 react-dom/test-utils 导入 act → 19 起从 react 导入（34 题，待新增）。
 *
 * 九、新动向【尝鲜】
 * - React 19.3（2026-09-09 发布，未满 30 天，本课不用）：发布说明里和错误边界直接相关的是「Don't let errors escape a hidden <Activity>」
 *   （另有服务端组件传输 Error.cause、被拒绝的 Promise 报错更清楚等改动），仍然没有函数组件的边界写法。
 *
 * 十、动手练习
 * 1. 给 ErrorBoundary 加一个 onReset 之外的「resetCount」计数，重置满 3 次后 fallback 改成「请刷新页面」。可断言：连续崩溃、重试 3 次后，第 4 次崩溃出现该文案。
 * 2. 把区块二外层的手写边界换成 react-error-boundary 的 <ErrorBoundary>（useErrorBoundary 只能在它的子树里用，否则渲染时就报
 *    「ErrorBoundaryContext not found」），再把第 4 个按钮改成 try / catch 后调用 showBoundary。可断言：点击后外层边界显示兜底界面。
 *
 * 参考（2026-09-18 核对，react.dev / vuejs.org / reactrouter 文档取自官方仓库原文）：
 * - react.dev：reference/react/Component（Catching rendering errors with an Error Boundary、getSnapshotBeforeUpdate）、reference/react-dom/client/createRoot、
 *   reference/react/useTransition、reference/react/lazy、reference/react/use、reference/react/useActionState、reference/react/captureOwnerStack、
 *   reference/eslint-plugin-react-hooks/lints/error-boundaries、blog/2024/04/25/react-19-upgrade-guide、blog/2024/12/05/react-19（Better error reporting）
 * - legacy.reactjs.org：blog/2017/07/26/error-handling-in-react-16、blog/2018/10/23/react-v-16-6；facebook/react CHANGELOG（16.6.0、19.0.0、19.1.0）
 * - react-error-boundary：README 与 6.1.3 的 dist/react-error-boundary.d.ts、dist/react-error-boundary.js；GitHub releases（6.0.0、6.1.0、6.1.4）
 * - reactrouter.com（7.18.3）：how-to/error-boundary、how-to/error-reporting、api/hooks/useRouteError；react-router CHANGELOG（7.11.0 stabilize onError）
 * - vuejs.org：api/composition-api-lifecycle#onerrorcaptured、api/options-lifecycle#errorcaptured、api/application#app-config-errorhandler、
 *   guide/built-ins/suspense、guide/best-practices/production-deployment
 * - 源码：react-dom 19.2.8 cjs/react-dom-client.development.js（defaultOnCaughtError / defaultOnUncaughtError / reportGlobalError / executeDispatch）；
 *   @vue/runtime-core 3.5.42 dist/runtime-core.cjs.js（callWithAsyncErrorHandling、handleError、renderComponentRoot 的 catch）
 */
import { BoundaryBasicsDemo } from './BoundaryBasicsDemo'
import { CatchScopeDemo } from './CatchScopeDemo'
import { LibraryBoundaryDemo } from './LibraryBoundaryDemo'
import { RootOptionsDemo } from './RootOptionsDemo'

export default function Example() {
  return (
    <div className="stack">
      <BoundaryBasicsDemo />
      <CatchScopeDemo />
      <LibraryBoundaryDemo />
      <RootOptionsDemo />
    </div>
  )
}
