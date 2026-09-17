/**
 * 主题：07. 表单与受控组件
 * 适用版本：React 19.2 · @types/react 19.2 · Vue 3.5
 * 最后核对：2026-09-17
 * 前置主题：03 State 与不可变更新、04 事件处理、06 列表与 key（换 key 重置组件）、09 派生状态、12 useRef
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 本课文件：Example.tsx（讲解 + 三个区块）· ControlledProfileForm.tsx【主线：受控】·
 *          UncontrolledContactForm.tsx【主线：非受控】· TextField.tsx（useId + ref 作为 prop）·
 *          InputEventLab.tsx（onChange 触发时机实验）· Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 受控：value（checkbox / radio 用 checked）+ onChange，state 是唯一的真相源，每次输入都 setState、重新渲染；
 *   非受控：defaultValue / defaultChecked 只给初始值，值由 DOM 保管，提交时 new FormData(表单) 或 ref.current.value 读一次。
 *   两种都是【主流】的基础写法。
 * - 怎么选：输入过程中就要有反应（即时校验、字段联动、格式化、按内容禁用按钮）用受控；只在提交时读、
 *   接第三方 DOM 组件、大表单不想每次输入都重新渲染，用非受控 —— react-hook-form 默认就是非受控 + ref 注册。
 * - 三个坑：value 不配 onChange 打不进字（开发环境报错，只读要写 readOnly）；初始值先是 undefined 后是字符串，
 *   会报「changing an uncontrolled input to be controlled」；defaultValue 改了不生效，要换 key 重新挂载。
 * - useId 给 label、aria-describedby 生成服务端和客户端一致的 id，不能拿来当列表 key；一页有多个 React 根时用 identifierPrefix。
 * - Vue 的 v-model 是「值绑定 + 事件」的语法糖，同样以 JS 状态为真相源；组件上 3.4 起用 defineModel()。
 *   区别：React 每次事件后把 DOM 改回 state，v-model 不会；输入法拼写期间 onChange 会触发，v-model 不更新。
 *
 * 二、核心概念（React）
 * 1. 受控【主流】（react.dev/reference/react-dom/components/input）：「To render a controlled input, pass the value prop to it
 *    (or checked for checkboxes and radios). React will force the input to always have the value you passed.」
 *    - onChange：「Fires immediately when the input's value is changed by the user (for example, it fires on every keystroke).
 *      Behaves like the browser input event.」和文本框的原生 change 事件（值改过之后失焦才触发）不一样。
 *      源码（react-dom 19.2.8）：文本框由原生 input / change 事件驱动、值变了才派发，不区分是否在输入法合成中（:3587）；
 *      <select> 由 change 驱动，checkbox / radio 由 click 驱动（:19605-19625）。
 *    - 「Every controlled input needs an onChange event handler that synchronously updates its backing value.」
 *      异步更新、或者写进 state 的不是 e.target.value（例如 toUpperCase()），光标会乱跳（官方 Troubleshooting）。
 *    - 事件处理结束后，React 把 DOM 的值改回 props 里的 value（:3251-3272 batchedUpdates → restoreStateOfTarget）。
 *      onChange 里不接受的输入（手机号里的字母）因此会被「弹回去」—— ControlledProfileForm.tsx 的手机号字段。
 * 2. 各元素的受控写法【主流】：checkbox / radio 用 checked（「Checkboxes need checked (or defaultChecked), not value」）；
 *    <select value>，多选 multiple 时 value 是数组，「passing a selected attribute to <option> is not supported」；
 *    <textarea value>，不支持把初始文字写成 children；e.target.value 是字符串，type="number" 也一样，要 Number()，空串单独处理。
 * 3. 非受控【主流】：「your JSX only specifies the initial value. It does not control what the value should be right now.」
 *    - 提交时 new FormData(e.currentTarget)（官方示例写 e.target）读全部字段：「Give a name to every <input>」；
 *      没勾选的 checkbox 不在 FormData 里；FormData.get() 返回 string | File | null，要先收窄；
 *    - 单个字段用 ref.current.value 读（12 题）；
 *    - e.currentTarget 在事件处理函数返回后被置为 null（:19120 executeDispatch），async 处理函数要在第一个 await 之前取出表单节点。
 * 4. 表单 state 的组织【主流】：一个对象 state + 按 name 分发的 handleChange + 函数式不可变更新（03 / 21 题）；
 *    校验错误作为派生值从 state 算出来（09 题）；切换编辑另一条记录时给表单 key={record.id}（官方 preserving-and-resetting-state），
 *    不要在 effect 里把 props 同步进 state：「ProfilePage and its children will first render with the stale value, and then render again」。
 * 5. useId【主流·18.0 起】：「a React Hook for generating unique IDs that can be passed to accessibility attributes」。
 *    - 为什么不用计数器 / Math.random()：「The primary benefit of useId is that React ensures that it works with server rendering」，
 *      服务端 HTML 里的 id 和客户端 hydration 时的 id 必须一致，useId「is generated from the "parent path" of the calling component」；
 *    - 一个组件要多个 id：调一次 useId，用后缀派生（TextField.tsx 的 -hint / -error）；
 *    - 「useId should not be used to generate keys in a list」，也「should not be used to generate cache keys for use()」；
 *    - 一页有多个独立的 React 应用：createRoot / hydrateRoot 传 identifierPrefix，避免 id 冲突；
 *    - 默认前缀【较新·19.2 起】是 _r_（19.0 是 :r:，19.1 是 «r»），为了能用作 view-transition-name 和 XML 名称
 *      （react.dev/blog/2025/10/01/react-19-2）。不要依赖它的格式。
 * 6. 受控和非受控不能中途切换【主流】：「An input cannot switch between being controlled or uncontrolled over its lifetime」；
 *    「A controlled component should always receive a string value, not null or undefined」。value={user?.name} 在 user 为空时
 *    就是 undefined，开发环境报「A component is changing an uncontrolled input to be controlled」（:20855）。
 * 7. 自定义输入组件【主流】：和原生 <input> 一样收 value + onChange；React 19 起 ref 是函数组件的普通 prop（TextField.tsx），
 *    父组件传 ref 直接拿到里面的 <input>。
 * 8. 提交【主流】：<form onSubmit> + e.preventDefault()；在输入框按回车、点 <button type="submit"> 都会触发；
 *    <form> 里的 <button> 默认就是 submit。提交中的状态、防重复、失败提示见 19 题。
 *    并排【主流·19.0 起】：<form action={fn}>（react.dev/reference/react-dom/components/form）：
 *    「the function will handle the form submission in a Transition」，fn 收到 FormData，「calling e.preventDefault() isn't needed」，
 *    「After the action function succeeds, all uncontrolled field elements in the form are reset」—— 受控字段不会被重置，
 *    要自己清 state（Example.test.tsx 有断言）。配合 useActionState / useFormStatus 的写法在 31 题（待新增）。
 *    官方 form 页的第一个用法仍是「Handle form submission with an event handler」，两种写法是并列关系。
 * 9. 事件类型【主流】：onChange 用 ChangeEvent<HTMLInputElement>；onSubmit 用 SubmitEvent<HTMLFormElement>。
 *    @types/react 19.2.18 已把 FormEvent 标成 @deprecated：「FormEvent doesn't actually exist」（index.d.ts:2086-2091）（28 题）。
 * 10. 无障碍【主流】（这里只做引用，完整内容在 35 题，待新增）：<label htmlFor={id}> 或把输入框包在 <label> 里；
 *    提示和错误信息用 aria-describedby 关联，出错时 aria-invalid；一组 radio 用 fieldset + legend；placeholder 不能代替 label；
 *    提交失败时把焦点移到第一个出错的字段。
 * 11. 大表单的重新渲染【主流】：官方「Optimizing re-rendering on every keystroke」建议把输入的 state 放进更小的组件，
 *    避免不了时用 useDeferredValue（32 题，待新增）；或者改用非受控。react-hook-form（react-hook-form.com/faqs，本课不安装）：
 *    「React Hook Form relies on an uncontrolled form, which is why the register function captures a ref directly instead of
 *    value/onChange」；必须受控的字段用 Controller / useController，「isolate re-renders to just that field」；
 *    watch 订阅的字段变化时照样会重新渲染。
 *
 * 三、Vue 对照
 * - v-model【主流】按元素展开成「属性 + 事件」（vuejs.org/guide/essentials/forms）：文本框和 textarea 是 value + input，
 *   checkbox / radio 是 checked + change，<select> 是 value + change ↔ React 手写 value / checked + onChange。
 * - 「v-model will ignore the initial value, checked or selected attributes ... It will always treat the current bound JavaScript
 *   state as the source of truth」↔ 受控组件以 state 为真相源。所以 v-model 就是 Vue 里的受控写法；不用 v-model、
 *   写静态 value 属性、提交时读 FormData，就是 Vue 里的非受控写法。两种模式两边都有，差别在下面「四」。
 * - 修饰符 .lazy（改为 change 后同步）、.number（parseFloat，解析不了就保留原字符串；type="number" 自动加上）、.trim
 *   ↔ React 没有修饰符，在 onChange 或提交时自己转换。
 * - 输入法：「v-model doesn't get updated during IME composition」（vue 3.5.42 的 vModelText：compositionstart 时置 composing，
 *   input 监听里 composing 为真就直接返回，runtime-dom.cjs.js:1533-1545）↔ React 的 onChange 合成期间照样触发。
 * - 组件 v-model：「Starting in Vue 3.4, the recommended approach to achieve this is using the defineModel() macro」，
 *   编译成 modelValue prop + update:modelValue 事件（vue/TextField.vue）↔ 自定义输入组件收 value + onChange。
 * - useId()【主流·Vue 3.5 起】：「unique-per-application IDs」「stable across the server and client renders」，
 *   多个 Vue 应用用 app.config.idPrefix（vuejs.org/api/composition-api-helpers，runtime-core.cjs.js:1704）↔ useId + identifierPrefix。
 * - @submit.prevent ↔ e.preventDefault()；:key 重置表单 ↔ key={id}；useTemplateRef / 模板 ref ↔ useRef；
 *   组件上的 ref 拿到的是组件实例（要 defineExpose 暴露方法）↔ React 19 的 ref prop 由子组件决定转给谁。
 * - React 19 的 <form action> / useActionState：Vue 没有内置对应物，照常在 @submit 里手写（31 题，待新增）。
 *
 * 四、关键区别（每条写明适用范围）
 * 1. 「受控」的强度（React 19.2 / Vue 3.5，两边都有测试）：React 在每次事件处理结束后把 DOM 改回 state，
 *    onChange 没有更新 state 时输入会被弹回；Vue 的 v-model 只在组件重新渲染时把 JS 值写回 DOM（vModelText.beforeUpdate，
 *    runtime-dom.cjs.js:1559-1576），写入被拒绝（例如 computed 的 setter 不接受）时组件不重新渲染，非法字符留在输入框里。
 *    Vue 里要做输入过滤，写 :value + @input，拒绝时手动把 el.value 改回去（vue/InputEventLab.vue）。
 * 2. 每次输入的更新范围：React 从持有 state 的组件开始重新执行，默认连同子组件一起（memo 可以跳过）；
 *    Vue 重新执行读过这个值的组件的渲染函数，props 没变的子组件不跟着重新渲染。「大表单为了性能改成非受控」主要是 React 生态的话题。
 * 3. defaultValue 与 :value：React 的 defaultValue 只在挂载时写一次，用户改过之后与它脱钩；Vue 的静态 value 属性也只写一次，
 *    和 defaultValue 对应；Vue 的 :value 是持续绑定，组件每次重新渲染都会把绑定值写回 DOM、冲掉用户输入
 *    （runtime-core.cjs.js:5897 对 value 每次都 patch，runtime-dom.cjs.js:591-601 与 DOM 当前值不同就覆盖）。长得像，语义相反。
 * 4. 只写值不写事件：React 的 value 不配 onChange，开发环境报错、输入框打不进字；Vue 的 :value 不配 @input，
 *    不报错、能输入，但下一次重新渲染时被冲掉。
 * 5. 输入法：React 的 onChange 合成期间触发（react-dom 19.2.8）；Vue 的 v-model 等合成结束才更新（vue 3.5.42）。
 * 6. 受控 ↔ 非受控切换：React 规定一个输入框在生命周期里不能切换，否则开发环境报错；Vue 没有这个约束。
 * 7. 提交：两边都是「提交事件处理器 + 阻止默认行为 + 手写提交状态」，逐行对应（19 题）；
 *    React 19 的 <form action> 在 Vue 没有内置对应物。
 *
 * 五、常见追问与回答要点
 * - value 不配 onChange 会怎样？打不进字，开发环境报错；本来就只读就写 readOnly，错误消失。
 * - 受控组件的 onChange 里不 setState 会怎样？React 在事件结束后把 DOM 改回 state，输入被弹回 —— 输入过滤就是这么做的。
 * - 初始值给 undefined 会怎样？变成字符串那一刻报「changing an uncontrolled input to be controlled」；受控字段初始值用 ''。
 * - onChange 和原生 change 一样吗？不一样，它像原生 input 事件，每次输入都触发，输入法拼写期间也触发。
 * - useId 为什么不用自增计数器？服务端和客户端算出的 id 要一致才能 hydration。能当 key 吗？不能。多个 React 根？identifierPrefix。
 * - type="number" 的 value 是数字吗？不是，是字符串；state 存字符串、提交时 Number()，空串单独处理（半截小数的细节见 19 题）。
 * - 切换编辑另一条记录时表单里残留旧值？给表单 key={record.id}；不要在 effect 里同步 props 到 state
 *   （先用旧值渲染一次再渲染一次，还会被 react-hooks/set-state-in-effect 规则拦下）。
 * - react-hook-form 为什么快？默认非受控，register 拿 ref 而不是 value / onChange；需要受控的字段用 Controller 把重新渲染限制在该字段内。
 * - Vue 的 v-model 和受控组件是一回事吗？都以 JS 状态为真相源；但 v-model 不会在写入被拒时改回 DOM，输入法期间也不更新（见「四」1、5）。
 * - React 19 的 <form action> 成功后表单会怎样？非受控字段重置成默认值，受控字段保持 state 里的值。
 *
 * 六、易错点
 * - 漏写 name：FormData 读不到这个字段；没勾选的 checkbox 不在 FormData 里，勾选了但没写 value 时是 'on'。
 * - async 提交函数在 await 之后读 e.currentTarget，得到 null。
 * - <form> 里的普通按钮忘了写 type="button"，一点就提交。
 * - 以为改 defaultValue 就能更新输入框：用户改过之后不会变，要换 key 或改成受控。
 * - 给 <option> 写 selected、把初始文字写成 <textarea> 的 children：React 不支持，开发环境报错。
 * - 受控字段初始值是 undefined，或者 value={user?.name}。
 * - onChange 里 await 之后再 setState，或者写进去的不是 e.target.value：光标乱跳。
 * - 用 useId 当列表 key；拼 querySelector('#' + id) 依赖它的格式。
 * - 用 placeholder 代替 label；错误信息只改颜色、没有用 aria-describedby 关联。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：校验是手写的 if。生产用 schema（如 zod）描述规则，提交时统一校验，FormData 里的 File 也要处理；
 *   前端校验只影响体验，后端必须再校验一遍（35 题，待新增）。
 * - 演示简化：保存只写进本地 state / 等一个定时器。真实提交要处理 loading、防重复、接口错误（19 题）；
 *   React 19 项目可以用 <form action> + useActionState / useFormStatus（31 题，待新增），注意受控字段不会自动清空。
 * - 无障碍：TextField 演示了 htmlFor、aria-describedby、aria-invalid、失败后聚焦；完整清单见 35 题（待新增）。
 * - 大表单：把输入的 state 放进小组件；或者非受控 / react-hook-form（表单工程化是可选的 37 题，做不做待定）。
 * - 输入掩码（金额、分段手机号）：在中间敲了被拒绝的字符，值被改回后光标跳到末尾（Chrome 实测），
 *   生产里通常用专门的掩码组件，或者只在失焦 / 提交时格式化。
 * - 编辑不同记录：key={record.id}，不要用 effect 同步。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - 自定义输入组件转发 ref：React 18 要 const TextField = forwardRef((props, ref) => …)；19.0 起 ref 是普通 prop。
 *   官方：「New function components will no longer need forwardRef ... In future versions we will deprecate and remove forwardRef」
 *   （react.dev/blog/2024/12/05/react-19）（02 / 12 题）。
 * - React 18 没有 <form action> / useActionState / useFormStatus，onSubmit + 手写提交状态是唯一写法；
 *   19.0 起两条路并存，手写写法仍是【主流】，不是旧写法。
 * - useActionState 在 Canary 阶段叫 ReactDOM.useFormState：「we've renamed it and deprecated useFormState」；
 *   19.2.8 里调用 useFormState，开发环境会报「ReactDOM.useFormState has been renamed to React.useActionState」
 *   （react-dom-client.development.js:7592）（31 题，待新增）。
 * - 事件类型：存量代码里的 FormEvent<HTMLFormElement>，在 @types/react 19.2 下改成 SubmitEvent<HTMLFormElement>（onSubmit）
 *   或 ChangeEvent（onChange）。
 * - Vue 3.4 之前：组件 v-model 要手写 defineProps(['modelValue']) + defineEmits(['update:modelValue'])；3.4 起 defineModel()。
 * - Vue 3.5 之前没有 useId，要自己拼前缀，并保证服务端和客户端一致。
 *
 * 九、新动向【尝鲜】
 * - SubmitEvent.submitter（点的是哪个提交按钮）：@types/react 19.2.18 的注释写着「`submitter` is available in react@canary」
 *   （index.d.ts:2178），19.2.8 里拿不到；是否已随 React 19.3 发布待核实。
 *
 * 十、动手练习
 * 1. 给 ControlledProfileForm 加一个 initial prop，旁边放一个联系人列表，点谁就编辑谁：
 *    <ControlledProfileForm key={person.id} initial={person} />。可断言：切换联系人后输入框显示新联系人的值，组件里没有 useEffect。
 * 2. 把 INITIAL_PROFILE 的 phone 改成 undefined（类型先放宽），在测试里监听 console.error，输入一个数字。
 *    可断言：出现「changing an uncontrolled input to be controlled」；改回 '' 后不再出现。
 *
 * 参考（2026-09-17 核对）：
 * - react.dev：reference/react-dom/components/input、select、textarea、form；reference/react/useId；
 *   learn/preserving-and-resetting-state；learn/you-might-not-need-an-effect；blog/2024/12/05/react-19；blog/2025/10/01/react-19-2
 * - vuejs.org（Vue 3.5）：guide/essentials/forms、guide/components/v-model、api/composition-api-helpers（useId）；
 *   blog.vuejs.org/posts/vue-3-5
 * - react-hook-form.com/faqs（第三方库自己的官方文档）
 * - 源码：react-dom 19.2.8 cjs/react-dom-client.development.js；@types/react 19.2.18 index.d.ts；
 *   @vue/runtime-dom 3.5.42 dist/runtime-dom.cjs.js；@vue/runtime-core 3.5.42 dist/runtime-core.cjs.js
 */
import { ControlledProfileForm } from './ControlledProfileForm'
import { InputEventLab } from './InputEventLab'
import { UncontrolledContactForm } from './UncontrolledContactForm'

export default function Example() {
  return (
    <div className="stack">
      <ControlledProfileForm />
      <UncontrolledContactForm />
      <InputEventLab />
    </div>
  )
}
