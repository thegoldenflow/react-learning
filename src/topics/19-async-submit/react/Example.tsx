/**
 * 主题：19. 异步提交与防重复
 * 适用版本：React 19.2（并排的 Actions 写法 19.0 起）· @types/react 19.2 · Vue 3.5 · vue-router 5.x
 * 最后核对：2026-09-19
 * 前置主题：07 表单、12 useRef、23 渲染快照、27 异步竞态与取消
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时，按项目里的使用频率标【最常用】【常用】【少用】，并写出依据（官方原文、官方示例的写法；没有出处的写「工程经验」）。
 *          正文和运行中的演示只有【最常用】【常用】的写法；【少用】的写法和只为说全的细节（源码行号）集中在文末「附」。
 *          本题没有需要注释的演示：「去掉 useRef 锁」「同一轮事件里提交两次」「备注故意不回填」是讲机制的实验，不是一种写法。
 *          只有一种正确写法、对照组是 ❌ 时不打频率标签。30 秒速答只用【最常用】。带频率标签的写法，成熟度是【主流】时不再重复标。
 * 本课文件：Example.tsx（讲解 + 两个区块）· ManualSubmitForm.tsx【主线：手写 submitting】·
 *          ActionSubmitForm.tsx【并排：React 19 Actions】· requestLog.tsx（请求日志，演示工具）·
 *          Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 手写写法【主流】：onSubmit + e.preventDefault() + async / await + try / catch / finally；提交前 setSubmitting(true)，
 *   finally 里恢复，否则请求一失败按钮就一直禁用。
 * - 防重复：按钮 disabled={submitting} 挡住用户连点。前端防重复只是体验，服务端要幂等。
 *   坑：state 在一次渲染里不会变，同一轮事件里被调用两次时两次都读到 false（修法见二-3）。
 * - 结果用判别联合建模（成功 / 字段错误 / 网络错误）：成功清空、失败保留输入；可预期的错误放进 state 显示，
 *   不要 throw —— 错误边界接不住事件处理函数里的错误。
 * - 已经用 TanStack Query 的项目：提交写成 useMutation，直接用它的 isPending，不再手写 submitting（30 题）。
 * - Vue：@submit.prevent + ref(false) + try / finally 逐行对应；ref 同步读写，没有渲染快照，守卫本身就够。
 *
 * 二、核心概念（React）
 * 1. 手写骨架【主流】：react.dev/reference/react-dom/components/form 的第一个用法「Handle form submission with an event handler」——
 *    onSubmit + e.preventDefault()；处理函数写成 async；try / catch / finally；事件类型 SubmitEvent<HTMLFormElement>（07 题）。
 *    手写提交状态【最常用】（频率：工程经验 —— React 18 及以前只有这一种写法，19 起 Actions 才并存；React 19 博客也说
 *    「In the past, you would need to handle pending states, errors, optimistic updates, and sequential requests manually.」，
 *    它的「Before Actions」示例就是 useState 的 isPending + disabled）。
 * 2. 状态建模【主流】：submitting 布尔 + 结果判别联合、合成一个 status 联合，两种都常见，按团队约定 ——
 *    react.dev 的 learn 页（reacting-to-input-with-state、choosing-the-state-structure）用一个 status 联合，
 *    React 19 博客「Before Actions」、useTransition 页的手写示例用 isPending 布尔。
 *    本课主线选 submitting 布尔，因为它同时驱动 disabled 和守卫；合成 status 的写法见练习 1（03 题区块五、11 题；联合类型写法见 29 题）。
 *    ❌ successMessage、errorMessage 两个散装 state（可能同时有值）。
 * 3. 防重复三道关【主流】（ManualSubmitForm.tsx）：
 *    - 【最常用】按钮 disabled={submitting}：挡住用户重复点击（官方示例的写法：react.dev 的 pending 示例都是 disabled={pending}，
 *      React 19 博客的「Before Actions」手写版也是 disabled={isPending}）。
 *      点击是离散事件，里面的 setState 在事件结束后的微任务里就完成渲染（源码位置见附 2），用户的第二次点击到来时按钮已经禁用
 *      （Chrome 实测双击只发一个请求）；
 *    - 【常用】处理函数开头 if (submitting) return（频率：工程经验）：提交入口不只提交按钮 —— 代码里调用 form.requestSubmit()、
 *      快捷键的处理函数里再提交一次、测试里直接调处理函数，都绕过了按钮的 disabled。
 *      但这道关只对「上一次提交之后已经重新渲染过」的调用有效（测试覆盖）；
 *    - 【常用】useRef 锁（频率：工程经验。项目里常见的形态是给整个 async 处理函数加锁，从进入一直锁到 finally —— ahooks 的 useLockFn
 *      就是这样一个 useRef(false) 锁；它顺带也拦住了同一轮里的重入）：
 *      「A state variable's value never changes within a render, even if its event handler's code is asynchronous」
 *      （react.dev/learn/state-as-a-snapshot）。同一轮事件里第二次进入处理函数，读到的仍是旧快照 false；
 *      改 ref.current 同步生效、不触发渲染（12 题）。页面实验和测试：去掉锁发出两个请求，加上锁只发一个。
 * 4. 错误分层【主流】：服务端校验错误（本课的 ApiFieldError，相当于带字段信息的 400 / 422）显示在字段旁并聚焦，改了输入再提交；
 *    网络错误、5xx 显示在表单上方并给「重试」。两类都放进 state 渲染：错误边界不捕获事件处理函数里的错误（20 题）。
 * 5. 成功之后【主流】（按需求选，不是互相替代的写法）：受控字段自己清 state；要跳转就 navigate（18 题）；有服务端缓存就让相关查询失效重取（30 题）。
 * 6. 卸载之后请求才回来【主流】：React 18 起去掉了「setState on unmounted component」警告
 *    （react.dev/blog/2022/03/08/react-18-upgrade-guide：「people primarily run into it in scenarios where setting state is fine,
 *    and workarounds make the code worse. We've removed this warning.」），卸载后的 setState 什么也不做（测试有断言）。
 *    提交是写操作，不要为了「清理」而 abort：「aborting the network request doesn't undo the server-side change」
 *    （react.dev/reference/react/useActionState 的 Pitfall）。读操作（搜索、列表）才用 AbortController 取消（27 题）。
 * 7. 并排：React 19 Actions【较新·19.0 起】【常用】（ActionSubmitForm.tsx，完整内容在 31 题，待新增；频率：工程经验 ——
 *    19.0 起才有，存量代码里少，React 19 项目的表单里常见）：
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
 * 8. 不在表单里的按钮【主流】（删除、点赞这类点一下就发请求的操作）：
 *    - 【最常用】手写 loading state：和区块一同一套，区别只是 onClick 代替 onSubmit、不用 preventDefault，本课不单独演示；
 *      已经用 TanStack Query 的项目用 useMutation（30 题区块一表格里的「标记为已支付」按钮）。频率：工程经验。
 *    - 【较新·19.0 起】【常用】const [isPending, startTransition] = useTransition()，startTransition(async () => { … })
 *      （React 19 博客介绍 Actions 的第一个例子就是它；频率：工程经验，19 起才有，存量代码里少）。本课没有演示，细节见附 1。
 * 9. 已经在用数据层时【主流】：TanStack Query 的 useMutation 自带 isPending【最常用】（那类项目里；30 题区块一的「标记为已支付」按钮、区块二的 mutation 状态表）；
 *    React Router Data 模式用 action + useFetcher / useNavigation 拿提交状态（18 题详情页的「星标」就是 useFetcher）。不必再手写一套。
 *
 * 三、Vue 对照（按 Vue 项目里的频率标）
 * - @submit.prevent + const submitting = ref(false) + :disabled + try / finally【最常用】（频率：工程经验），和手写版逐行对应（vue/ManualSubmitForm.vue）；
 *   已经用 @tanstack/vue-query 的项目同样用 useMutation 的 isPending（30 题）。
 * - Vue 的 ref 读写是同步的：同一轮事件里第二次进入处理函数，submitting.value 已经是 true，守卫就能拦住，不需要额外的锁
 *   （测试有断言）。更新 DOM 仍然是在下一个 tick 批量进行（统一措辞「时机」）。
 * - 错误：模板（或渲染函数）里绑定的事件处理函数，同步抛错和返回的 Promise 被拒绝都会进入 Vue 的错误处理（源码位置见附 2），
 *   父组件的 onErrorCaptured、没被拦下时的 app.config.errorHandler 都接得到（两个都有测试）；自己 addEventListener 的监听不经过 Vue。
 *   两边都建议：可预期的错误自己 catch，放进状态显示。
 * - 提交成功后跳转：直接 router.push()【最常用】；要等导航结果（失败处理、导航结束再恢复提交状态）时 await router.push()【常用】（频率：工程经验）。
 *   能 await 的依据：「router.push and all the other navigation methods return a Promise that allows us to wait till the navigation
 *   is finished and to know if it succeeded or failed」（router.vuejs.org）。
 * - React 19 的 useActionState / useFormStatus / useOptimistic：Vue 没有内置对应物，照常手写。
 *
 * 四、关键区别（每条写明适用范围）
 * 1. 渲染快照 vs 同步响应式（React 19.2 / Vue 3.5）：React 的 submitting 在一次渲染里不变，同一轮重入要 useRef 锁；
 *    Vue 的 ref 立刻读到新值。用户正常双击时两边都被 disabled 挡住，差别只在「同一轮里被调用两次」。
 * 2. 主线手写写法：两边逐行对应。
 * 3. React 19.0 起多了 Actions：pending 由 React 维护、重复提交排队、成功后重置非受控字段；Vue 没有对应的内置写法。
 * 4. 错误进哪里：React 的错误边界接不住事件处理函数里的错误（useTransition 返回的 startTransition、<form action> / useActionState 的 action
 *    里抛出的除外；从 react 直接导入的顶层 startTransition 进不了边界，20 题）；
 *    Vue 的 onErrorCaptured 能接到模板（或渲染函数）里绑定的事件处理函数的同步错误和 Promise 拒绝，自己 addEventListener 的不算。
 * 5. 卸载后回写：React 18 起不报警告；Vue 卸载后改 ref 也不报错（组件已经不再渲染）。两边都不需要「是否已卸载」的标记来消警告。
 *
 * 五、常见追问与回答要点
 * - 只靠 disabled 为什么不够？它是界面层的防护：提交入口不只按钮（代码调用 requestSubmit、快捷键、测试直接调处理函数），
 *   而且要等重新渲染才生效。
 * - 为什么同一轮里两次调用都读到 false？渲染快照：本次渲染里的 state 是常量。用 useRef 锁，它不触发重新渲染。
 * - 用户双击会提交两次吗？不会：点击里的 setState 在事件结束后的微任务里完成渲染，第二次点击时按钮已禁用（Chrome 实测）。
 * - 判别联合比多个布尔好在哪？结果用判别联合，不会出现「成功和失败同时显示」。「提交中还挂着上次的成功提示」在 submitting + result 的结构下
 *   仍然表示得出来，要在提交时 setResult(null)（本课的做法），或者合成一个 status 联合（练习 1）让它表示不出来。
 * - 提交错误 throw 给错误边界还是放进 state？事件处理函数里 throw，边界接不住；action 里 throw 会进边界并取消排队的 action；
 *   可预期的错误都放进 state。
 * - useActionState 下重复提交会怎样？排队串行，每次收到上一次的结果，所以按钮仍要按 pending 禁用。
 * - useFormStatus 为什么要放子组件？它只读父级 <form> 的状态，同一个组件里渲染的 <form> 读不到。
 * - 有了 React 19 还要手写 submitting 吗？手写仍是最常用的写法：React 18 项目、不是 <form> 的交互（没用数据层时）、需要精细控制时一般都手写；
 *   19 项目的表单可以用 Actions【常用】；已经用 TanStack Query 就用 useMutation（30 题）。
 * - 前端防住了，服务端还用管吗？要。网络重试、多个标签页、直接调接口都会重复，服务端靠幂等键或唯一约束去重。
 *
 * 六、易错点
 * - setSubmitting(false) 只写在 try 末尾：请求一失败，按钮永久禁用。
 * - 只靠 if (submitting) return 防重复，同一轮重入时失效。
 * - 网络错误和字段错误一样处理，给字段错误也挂「重试」。
 * - 在 catch 里直接 focus 一个还处于 disabled 的输入框：不起作用，要等重新渲染后再聚焦（ManualSubmitForm.tsx 用 effect）。
 * - Actions 版本以为「返回错误就不会重置表单」：非受控字段照样被清空。
 * - useFormStatus 写在渲染 <form> 的组件里：pending 一直是 false。
 * - action（useActionState / <form action>）里 await 之后直接 setState：这次更新不算 Transition，要再包一层 startTransition
 *   （useActionState 页 Caveat：「If you set state after await in the reducerAction you currently need to wrap the state update in an additional startTransition.」）。
 * - 组件卸载时 abort 提交请求，以为「撤销了提交」：服务端可能已经处理完。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：「模拟网络失败」开关、固定延迟、两个字段的校验。真实接口按状态码和错误体区分字段错误与可重试错误。
 * - 服务端幂等：请求里带一个客户端生成的唯一标识（例如打开表单时生成），服务端按它去重；或者用数据库唯一约束。
 * - 无障碍：网络错误 role="alert"，成功提示 role="status"，字段错误 aria-describedby + 聚焦（07 题；35 题，待新增）。
 * - 成功后让相关缓存失效（30 题）或跳转（18 题）。
 * - 提交中禁用输入框是一种取舍：避免请求发出后又改内容；有的产品保留可编辑，成功时只清空提交时的值。两种都常见，按团队约定
 *   （react.dev useFormStatus 页有一个示例连输入框一起禁用，React 19 博客的示例只禁用按钮；频率：工程经验）。
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
 * 附：细节（本题没有注释掉的演示，也没有【少用】的写法；读别人的代码时认得出来就行）
 * 1. 细节：不在表单里的按钮直接用 useTransition（二-8，19.0 起支持 async）：const [isPending, startTransition] = useTransition()，
 *    startTransition(async () => { … })。「isPending … stays true until all Actions complete」；await 之后的 setState
 *    要再包一层 startTransition（「This is a known limitation that we will fix in the future」）；传给 startTransition 的函数
 *    抛错或返回被拒绝的 Promise，会显示最近的错误边界（react.dev/reference/react/useTransition；20 题、31 题待新增）。
 *    多次点击时请求可能乱序完成，官方的说法是「For common use cases, React provides higher-level abstractions like useActionState and <form> actions
 *    that handle ordering for you. For advanced use cases, you'll need to implement your own queuing and abort logic to handle this.」
 *    这句讲的是该用哪个 API（手写 Transition 要自己处理顺序），不是频率。本课没有演示。
 * 2. 细节：源码位置
 *    - 离散事件里的 setState 在事件结束后的微任务里完成渲染：react-dom 19.2.8 cjs/react-dom-client.development.js 的
 *      processRootScheduleInMicrotask（:18825-18856），由 scheduleImmediateRootScheduleTask 排进微任务（:18979-18991）。
 *    - Vue 模板里的事件处理函数经 callWithAsyncErrorHandling 调用，返回的 Promise 被拒绝时 .catch 进 handleError
 *      （@vue/runtime-core 3.5.42 dist/runtime-core.cjs.js:205-213），info 是「native event handler」。
 *
 * 参考（2026-09-19 核对，react.dev / vuejs.org / router.vuejs.org 文档取自官方仓库原文）：
 * - react.dev：reference/react-dom/components/form；learn/state-as-a-snapshot；reference/react/useActionState；
 *   reference/react-dom/hooks/useFormStatus；reference/react/useTransition；blog/2022/03/08/react-18-upgrade-guide；
 *   blog/2024/12/05/react-19
 * - router.vuejs.org/guide/essentials/navigation；vuejs.org/guide/essentials/forms；tanstack.com/query（framework/react/guides/mutations）
 * - alibaba/hooks（ahooks）packages/hooks/src/useLockFn
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
