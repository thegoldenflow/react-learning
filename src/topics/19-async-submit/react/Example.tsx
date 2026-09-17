/**
 * 主题：19. 异步提交与防重复
 * 适用版本：React 19.2（并排的 Actions 写法 19.0 起）· @types/react 19.2 · Vue 3.5 · vue-router 5.x
 * 最后核对：2026-09-17
 * 前置主题：07 表单、12 useRef、23 渲染快照、27 异步竞态与取消
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 两个区块）· ManualSubmitForm.tsx【主线：手写 submitting】·
 *          ActionSubmitForm.tsx【并排：React 19 Actions】· requestLog.tsx（请求日志，演示工具）·
 *          Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 手写写法【主流】：onSubmit + e.preventDefault() + async / await + try / catch / finally；提交前 setSubmitting(true)，
 *   finally 里恢复，否则请求一失败按钮就一直禁用。
 * - 防重复：按钮 disabled={submitting} 挡住用户连点；处理函数开头再判断一次，因为入口不只按钮；
 *   state 在一次渲染里不会变，同一轮事件里被调用两次时两次都读到 false，要加 useRef 锁。前端防重复只是体验，服务端要幂等。
 * - 结果用判别联合建模（成功 / 字段错误 / 网络错误）：成功清空、失败保留输入；可预期的错误放进 state 显示，
 *   不要 throw —— 错误边界接不住事件处理函数里的错误。
 * - React 19 起并列的写法【主流·19.0 起】：<form action> + useActionState（isPending，重复提交排队串行）
 *   + useFormStatus（按钮放在子组件里）。action 成功后非受控字段会被重置，返回错误也算成功，失败时要把值放进 state 回填。
 * - Vue：@submit.prevent + ref(false) + try / finally 逐行对应；ref 同步读写，没有渲染快照，守卫本身就够。
 *
 * 二、核心概念（React）
 * 1. 手写骨架【主流】：react.dev/reference/react-dom/components/form 的第一个用法「Handle form submission with an event handler」——
 *    onSubmit + e.preventDefault()；处理函数写成 async；try / catch / finally；事件类型 SubmitEvent<HTMLFormElement>（07 题）。
 * 2. 状态建模【主流】：submitting 布尔 + result 判别联合，或者合成一个 status 联合（29 题）；
 *    不要用 successMessage、errorMessage 两个散装 state（可能同时有值）。
 * 3. 防重复三道关【主流】（ManualSubmitForm.tsx）：
 *    - 按钮 disabled={submitting}：挡住用户重复点击。点击是离散事件，里面的 setState 在事件结束后的微任务里就完成渲染
 *      （react-dom 19.2.8 processRootScheduleInMicrotask，:18825-18856），用户的第二次点击到来时按钮已经禁用（Chrome 实测双击只发一个请求）；
 *    - 处理函数开头 if (submitting) return：提交入口不只提交按钮 —— 代码里调用 form.requestSubmit()、
 *      快捷键的处理函数里再提交一次、测试里直接调处理函数，都绕过了按钮的 disabled。
 *      但这道关只对「上一次提交之后已经重新渲染过」的调用有效；
 *    - useRef 锁：「A state variable's value never changes within a render, even if its event handler's code is asynchronous」
 *      （react.dev/learn/state-as-a-snapshot）。同一轮事件里第二次进入处理函数，读到的仍是旧快照 false；
 *      改 ref.current 同步生效、不触发渲染（12 题）。页面实验和测试：去掉锁发出两个请求，加上锁只发一个。
 * 4. 错误分层【主流】：服务端校验错误（本课的 ApiFieldError，相当于带字段信息的 400 / 422）显示在字段旁并聚焦，改了输入再提交；
 *    网络错误、5xx 显示在表单上方并给「重试」。两类都放进 state 渲染：错误边界不捕获事件处理函数里的错误（20 题）。
 * 5. 成功之后【主流】：受控字段自己清 state；要跳转就 navigate（18 题）；有服务端缓存就让相关查询失效重取（30 题）。
 * 6. 卸载之后请求才回来【主流】：React 18 起去掉了「setState on unmounted component」警告
 *    （react.dev/blog/2022/03/08/react-18-upgrade-guide：「people primarily run into it in scenarios where setting state is fine,
 *    and workarounds make the code worse. We've removed this warning.」），卸载后的 setState 什么也不做（测试有断言）。
 *    提交是写操作，不要为了「清理」而 abort：「aborting the network request doesn't undo the server-side change」
 *    （react.dev/reference/react/useActionState 的 Pitfall）。读操作（搜索、列表）才用 AbortController 取消（27 题）。
 * 7. 并排：React 19 Actions【主流·19.0 起】（ActionSubmitForm.tsx，完整内容在 31 题，待新增）：
 *    - <form action={formAction}>：函数「will handle the form submission in a Transition」，不需要 preventDefault；
 *    - useActionState(action, initialState) 返回 [state, dispatchAction, isPending]；action 的第一个参数是上一次的 state，
 *      「The submitted form data is therefore its second argument instead of its first」；
 *    - 「React queues and executes multiple calls to dispatchAction sequentially. Each call to reducerAction receives the result
 *      of the previous call」：重复提交会排队执行，不会被丢弃（测试：同一轮提交两次，两个请求一个接一个跑完）；
 *    - useFormStatus（从 react-dom 导入）「must be called from a component that is rendered inside a <form>」，所以按钮拆成子组件；
 *    - 「After the action function succeeds, all uncontrolled field elements in the form are reset」：action 返回错误 state、
 *      没有 throw，也算成功，非受控字段照样被清空（测试实测）。失败时要保住输入，把提交的值放进 state，用 defaultValue 回填；
 *    - 可预期的错误 return 成 state；「If dispatchAction throws an error, React cancels all queued actions and shows the nearest
 *      Error Boundary」。
 * 8. 并排：不在表单里的按钮【主流·19.0 起支持 async】：const [isPending, startTransition] = useTransition()，
 *    startTransition(async () => { … })。「isPending … stays true until all Actions complete」；await 之后的 setState
 *    要再包一层 startTransition（「This is a known limitation that we will fix in the future」）；传给 startTransition 的函数
 *    抛错或返回被拒绝的 Promise，会显示最近的错误边界（react.dev/reference/react/useTransition；20 题、31 题待新增）。
 * 9. 已经在用数据层时【主流】：TanStack Query 的 useMutation 自带 isPending（30 题）；React Router Data 模式用 action +
 *    useFetcher / useNavigation 拿提交状态（18 题）。不必再手写一套。
 *
 * 三、Vue 对照
 * - @submit.prevent + const submitting = ref(false) + :disabled + try / finally，和手写版逐行对应（vue/ManualSubmitForm.vue）。
 * - Vue 的 ref 读写是同步的：同一轮事件里第二次进入处理函数，submitting.value 已经是 true，守卫就能拦住，不需要额外的锁
 *   （测试有断言）。更新 DOM 仍然是在下一个 tick 批量进行（统一措辞「时机」）。
 * - 错误：模板里的事件处理函数经 callWithAsyncErrorHandling 调用，返回的 Promise 被拒绝也会进入 handleError
 *   （@vue/runtime-core 3.5.42 dist/runtime-core.cjs.js:205-213），父组件的 onErrorCaptured / app.config.errorHandler 接得到
 *   （测试有断言）。两边都建议：可预期的错误自己 catch，放进状态显示。
 * - 提交成功后跳转：「router.push and all the other navigation methods return a Promise that allows us to wait till the navigation
 *   is finished and to know if it succeeded or failed」（router.vuejs.org），需要时 await router.push() 再结束提交状态。
 * - React 19 的 useActionState / useFormStatus / useOptimistic：Vue 没有内置对应物，照常手写。
 *
 * 四、关键区别（每条写明适用范围）
 * 1. 渲染快照 vs 同步响应式（React 19.2 / Vue 3.5）：React 的 submitting 在一次渲染里不变，同一轮重入要 useRef 锁；
 *    Vue 的 ref 立刻读到新值。用户正常双击时两边都被 disabled 挡住，差别只在「同一轮里被调用两次」。
 * 2. 主线手写写法：两边逐行对应。
 * 3. React 19.0 起多了 Actions：pending 由 React 维护、重复提交排队、成功后重置非受控字段；Vue 没有对应的内置写法。
 * 4. 错误进哪里：React 的错误边界接不住事件处理函数里的错误（startTransition 和 action 里抛出的除外）；
 *    Vue 的 onErrorCaptured 能接到事件处理函数的同步错误和 Promise 拒绝。
 * 5. 卸载后回写：React 18 起不报警告；Vue 卸载后改 ref 也不报错（组件已经不再渲染）。两边都不需要「是否已卸载」的标记来消警告。
 *
 * 五、常见追问与回答要点
 * - 只靠 disabled 为什么不够？它是界面层的防护：提交入口不只按钮（代码调用 requestSubmit、快捷键、测试直接调处理函数），
 *   而且要等重新渲染才生效。
 * - 为什么同一轮里两次调用都读到 false？渲染快照：本次渲染里的 state 是常量。用 useRef 锁，它不触发重新渲染。
 * - 用户双击会提交两次吗？不会：点击里的 setState 在事件结束后的微任务里完成渲染，第二次点击时按钮已禁用（Chrome 实测）。
 * - 判别联合比多个布尔好在哪？不会出现「成功和失败同时显示」「提交中还挂着上次的成功提示」这类组合。
 * - 提交错误 throw 给错误边界还是放进 state？事件处理函数里 throw，边界接不住；action 里 throw 会进边界并取消排队的 action；
 *   可预期的错误都放进 state。
 * - useActionState 下重复提交会怎样？排队串行，每次收到上一次的结果，所以按钮仍要按 pending 禁用。
 * - useFormStatus 为什么要放子组件？它只读父级 <form> 的状态，同一个组件里渲染的 <form> 读不到。
 * - 有了 React 19 还要手写 submitting 吗？两种都是主流：React 18 项目、不是 <form> 的交互、需要精细控制时手写；
 *   19 项目的表单可以用 Actions；已经用 TanStack Query 就用 useMutation（30 题）。
 * - 前端防住了，服务端还用管吗？要。网络重试、多个标签页、直接调接口都会重复，服务端靠幂等键或唯一约束去重。
 *
 * 六、易错点
 * - setSubmitting(false) 只写在 try 末尾：请求一失败，按钮永久禁用。
 * - 只靠 if (submitting) return 防重复，同一轮重入时失效。
 * - 网络错误和字段错误一样处理，给字段错误也挂「重试」。
 * - 在 catch 里直接 focus 一个还处于 disabled 的输入框：不起作用，要等重新渲染后再聚焦（ManualSubmitForm.tsx 用 effect）。
 * - Actions 版本以为「返回错误就不会重置表单」：非受控字段照样被清空。
 * - useFormStatus 写在渲染 <form> 的组件里：pending 一直是 false。
 * - startTransition 的 async 函数里 await 之后直接 setState：这次更新不算 Transition。
 * - 组件卸载时 abort 提交请求，以为「撤销了提交」：服务端可能已经处理完。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：「模拟网络失败」开关、固定延迟、两个字段的校验。真实接口按状态码和错误体区分字段错误与可重试错误。
 * - 服务端幂等：请求里带一个客户端生成的唯一标识（例如打开表单时生成），服务端按它去重；或者用数据库唯一约束。
 * - 无障碍：网络错误 role="alert"，成功提示 role="status"，字段错误 aria-describedby + 聚焦（07 题；35 题，待新增）。
 * - 成功后让相关缓存失效（30 题）或跳转（18 题）。
 * - 提交中禁用输入框是一种取舍：避免请求发出后又改内容；有的产品保留可编辑，成功时只清空提交时的值。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - React 18：没有 <form action> / useActionState / useFormStatus / useOptimistic，startTransition 只接同步函数
 *   （React 19 博客：「In React 19, we're adding support for using async functions in transitions」），
 *   手写 submitting 是唯一写法。19.0 起两条路并存，手写写法仍是【主流】。
 * - React 17 及以前，卸载后 setState 会警告，常见写法是用 isMounted 标记绕开；React 18 起警告已去掉，这类标记不再需要。
 * - ReactDOM.useFormState（Canary 阶段的名字）→ React.useActionState（07 题「八」）。
 * - 事件类型 FormEvent → SubmitEvent（@types/react 19.2）。
 * - Vue：3.x 里这部分写法没有变化。
 *
 * 九、新动向【尝鲜】
 * - 官方在文档里标明的将来变化（没有给出版本号）：startTransition 里 await 之后要再包一层的限制「we will fix in the future」；
 *   多个进行中的 Actions 会被合并（「This is a limitation that may be removed in a future release」）。主线代码不依赖这些变化。
 *
 * 十、动手练习
 * 1. 把手写版改成一个 status 联合（idle / submitting / success / fieldError / networkError），去掉 submitting 布尔。
 *    可断言：「同一轮事件里提交两次」仍然只发一个请求。
 * 2. 给 Actions 版的「备注」也加上回填。可断言：勾选模拟网络失败后提交，备注保持原值。
 *
 * 参考（2026-09-17 核对）：
 * - react.dev：reference/react-dom/components/form；learn/state-as-a-snapshot；reference/react/useActionState；
 *   reference/react-dom/hooks/useFormStatus；reference/react/useTransition；blog/2022/03/08/react-18-upgrade-guide；
 *   blog/2024/12/05/react-19
 * - router.vuejs.org/guide/essentials/navigation；vuejs.org/guide/essentials/forms
 * - 源码：react-dom 19.2.8 cjs/react-dom-client.development.js；@vue/runtime-core 3.5.42 dist/runtime-core.cjs.js
 */
import { ActionSubmitForm } from './ActionSubmitForm'
import { ManualSubmitForm } from './ManualSubmitForm'

export default function Example() {
  return (
    <div className="stack">
      <ManualSubmitForm />
      <ActionSubmitForm />
    </div>
  )
}
