/**
 * 主题：06. 列表渲染与 key —— 列表就是 filter / sort / map、key 是身份不是位置、换 key 就是换一个实例
 * 适用版本：React 19.2 · @types/react 19.2 · TypeScript 5.9 · Vue 3.5
 * 最后核对：2026-09-19
 * 前置主题：01、02、03、05（05 题区块三讲「位置决定 state」，本题讲给位置起名字的 key）
 * 成熟度：本课知识点按【主流】【较新】【尝鲜】【旧写法】逐一标注
 * 使用频率：同一件事有几种写法时，按项目里的使用频率标【最常用】【常用】【少用】，并写出依据（官方原文、官方示例的写法；没有出处的写「工程经验」）。
 *          正文和运行中的演示只有【最常用】【常用】的写法；【少用】的写法没有删，讲解集中在文末「附」。本题 React 侧没有需要注释的演示（index、Math.random() 作 key 是 ❌ 反例，照常运行），
 *          Vue 侧【少用】的 v-for 写法拆在 vue/RareVForDemo.vue、页面上注释着（删掉注释块的第一行和最后一行就能运行）。
 *          30 秒速答只用【最常用】。带频率标签的写法，成熟度是【主流】时不再重复标。
 * 本课文件：Example.tsx（讲解 + 入口）· ListBasicsDemo.tsx（区块一）· KeyBugDemo.tsx（区块二）· KeyResetDemo.tsx（区块三）· demoData.ts（订单数据与 createLocalOrder）·
 *          Example.test.tsx（本课结论的自动化测试）
 *
 * 一、30 秒面试速答
 * - 列表就是数组方法：先 filter 再 map 成 JSX，key 写在 map 直接返回的那个元素上；排序前先拷贝 [...list].sort()，sort 会改掉原数组【主流】。
 * - key 是列表项的身份：用数据自带的 id（后端的主键），兄弟之间唯一、不会变；不要在渲染时生成，key={Math.random()} 每次渲染都对不上，整个列表重建、输入全丢【主流】。
 * - 不写 key 时 React 用的就是 index；index 作 key 的列表在开头 / 中间插入、删除开头 / 中间的项、排序之后，下标对上的是别的数据，输入框内容和子组件 state 串到别的行【主流】。
 * - key 不只用于列表：给组件换一个 key 就是换一个实例，state 从头来。prop 变了要重置组件内部的 state 就这样做，不要在 Effect 里 setState【主流】。
 * - Vue 是同一套机制：v-for + :key。不写 :key 是「就地更新」，和 React 用 index 一样，在开头插入、删除、排序时会串行；React 开发环境会报错提示，Vue 运行时不提示、靠 lint【主流】。
 *
 * 二、核心概念（React）
 * 1. 列表就是数组方法【主流】（区块一）：「You will often want to display multiple similar components from a collection of data.」官方用的是 filter() 和 map()。
 *    - 【最常用】map 把数据变成 JSX：items.map(item => <li key={item.id}>…</li>)（频率：官方正文的示例都是 map，工程经验）。「JSX elements directly inside a map() call always need keys!」
 *    - 【最常用】过滤：先 filter 再 map（官方「Filtering arrays of items」一节的写法）；筛选条件有几个就都写进同一个 filter（区块一的分类 + 库存，测试覆盖）。
 *    - 【最常用】排序：先拷贝再排 [...list].sort(…)。「The JavaScript reverse() and sort() methods are mutating the original array, so you can't use them directly.」
 *      updating-arrays 页的表格把 reverse / sort 列在 avoid 一栏，做法是「copy the array first」。区块一在「全部」时拿的就是模块常量 PRODUCTS，拷贝过所以原数组的顺序不变（测试覆盖，练习 3）。
 *      拷贝是浅的：「However, even if you copy an array, you can't mutate existing items inside of it directly.」（改数组里的对象见 03 题区块三）
 *      【少用】toSorted() 见附 3。
 *    - ✅ 派生列表在渲染时算（❌ 存进 state 再用 Effect 同步）：「When something can be calculated from the existing props or state, don't put it in state. Instead, calculate it during rendering.」（09 题）
 *      useMemo 什么时候才需要：「if you're filtering or transforming a large array, or doing some expensive computation, you might want to skip doing it again if data hasn't changed」，
 *      判断标准「In general, unless you're creating or looping over thousands of objects, it's probably not expensive.」区块一只有 8 条，不需要（useMemo 的演示在 17 题）。
 *    - 块体箭头函数要写 return：「However, you must write return explicitly if your => is followed by a { curly brace!」「If you forget it, nothing gets returned!」
 *      实测：什么都不渲染、也不报错；TypeScript 拦得住（map 得到 void[]，报 TS2322「Type 'void[]' is not assignable to type 'ReactNode'」）（测试覆盖）。
 *      本项目的 lint（recommended 预设）拦不住：typescript-eslint 的 recommended 用 @typescript-eslint/no-unused-expressions 换掉了核心规则，默认值沿用核心规则，enforceForJSX 是 false；
 *      ESLint 核心规则 array-callback-return 能拦（报「Array.prototype.map() expects a return value from arrow function.」，实测），它不在 recommended 里，本项目没开。
 *    - 【少用】for 循环往数组里 push JSX：见附 1。
 * 2. key 的规则【主流】
 *    - 兄弟之间唯一、不会变、不在渲染时生成：「Keys must be unique among siblings. However, it's okay to use the same keys for JSX nodes in different arrays.」
 *      「Keys must not change or that defeats their purpose! Don't generate them while rendering.」
 *    - 写在 map 直接返回的那个元素上。把列表项提取成组件后，key 写在 <Row key={…} /> 上，不写在组件内部返回的根元素上：
 *      「Note that the key is specified on the <Recipe> itself rather than on the root <div> returned from Recipe.」
 *    - 组件收不到 key：「Note that your components won't receive key as a prop. It's only used as a hint by React itself.」需要 id 就另传一个 prop：
 *      「If your component needs an ID, you have to pass it as a separate prop: <Profile key={id} userId={id} />.」（02 题「key 不是 prop」）
 *    - 类型：@types/react 19.2.18 的 Key = string | number | bigint（index.d.ts:236，测试覆盖）；文档的说法是「a string or a number」。
 *    - 缺 key、重复 key：开发环境 console.error（原文见附 2，测试覆盖）；生产构建不做这些检查。
 * 3. key 从哪来【主流】（区块二）：官方「Where to get your key」按数据来源分两种 ——
 *    - 【最常用】数据自带的 id：「Data from a database: If your data is coming from a database, you can use the database keys/IDs, which are unique by nature.」
 *      列表数据大多来自接口，项目里的 key 基本就是后端主键（频率是工程经验）。没有 id 字段时，本身在兄弟之间唯一、不会变的字段也可以当 key
 *      （官方挑战题：「its name can serve as a key」；区块一分类下拉的 key 就是分类名）。
 *    - 【常用】前端新建的数据，在创建时生成 id 并存进数据（频率：工程经验）：「Locally generated data: If your data is generated and persisted locally (e.g. notes in a note-taking app), use an incrementing counter,
 *      crypto.randomUUID() or a package like uuid when creating items.」「Rather than generating keys on the fly, you should include them in your data」。
 *      区块二「开头插入 / 末尾追加」的新行由 demoData.ts 的 createLocalOrder 生成 id（crypto.randomUUID()，没有时退回计数器，附 5），之后重渲染 key 不变，新行里的输入留得住（测试覆盖）。
 *    - 【少用】数组下标 index：只在已有项的下标始终不变、或者列表项是纯展示内容时可以（附 4）。
 *    - ❌ 渲染时生成：key={Math.random()}、key={Date.now()}、在 JSX 里调 crypto.randomUUID()（见 4）。
 * 4. 为什么要 key：身份，不是位置【主流】（区块二）：「Keys tell React which array item each component corresponds to, so that it can match them up later.」
 *    「File names in a folder and JSX keys in an array serve a similar purpose.」「A well-chosen key provides more information than the position within the array.」三种 key 的实测（都有测试）：
 *    - order.id：开头插入、删除之后，备注都留在自己那一行。
 *    - ❌ index：「In fact, that's what React will use if you don't specify a key at all.」「Index as a key often leads to subtle and confusing bugs.」开头插入一行，原来第 0 行的 DOM
 *      被当成新的第 0 行复用，备注跑到新行上；删除第一行，它的备注留给了下一个订单；只在末尾追加时已有下标不变，不错位。
 *    - ❌ Math.random()：「This will cause keys to never match up between renders, leading to all your components and DOM being recreated every time. Not only is this slow, but it will also lose
 *      any user input inside the list items.」连一次无关的重渲染都会把所有行重建。lint 的 react-hooks/purity 报「Cannot call impure function during render」（KeyBugDemo.tsx 那一行用 eslint-disable 放行）。
 *    区块二的备注框是非受控的，为的是让「DOM 被错误复用」看得见（七）。
 * 5. 一项要渲染多个节点【主流】（区块一）：官方给了两种办法 ——「either group them into a single <div>, or use the slightly longer and more explicit <Fragment> syntax」。
 *    - 【最常用】多包一层元素：列表项本来就有自己的容器（<li>、卡片的 <div>），大多数列表是这样（工程经验）。
 *    - 【常用】父元素不允许多包一层时写 <Fragment key={id}>（频率：工程经验）。典型的是表格里一项占两行 <tr>（主行 + 明细行），<tr> 的父元素只能是 table / thead / tbody / tfoot，
 *      外面不能包 <div>（区块一的库存明细表）。「The short <>...</> Fragment syntax won't let you pass a key」；Fragment 不产生 DOM，<tbody> 里是平铺的 tr、tr、tr、tr（测试覆盖）。
 *      Fragment 页那句「Usually you won't need this unless you need to pass a key to your Fragment.」说的是什么时候才需要写完整的 <Fragment>（平时写 <> 就行）。
 *      <dl> 不算这种情况：HTML 允许用 <div> 包 <dl> 里的每组 dt / dd（MDN ③）。
 * 6. key 不只用于列表：换 key = 换一个实例【主流】（区块三）：「Keys aren't just for lists!」「You can force a subtree to reset its state by giving it a different key.」
 *    - 【最常用】prop 变了、组件内部 state 要从头来：<OrderNoteEditor key={selectedOrder.id} order={selectedOrder} />（02 题区块三、05 题区块三用的是同一个办法；
 *      频率依据见 05 题二-4 与附 2：官方列的两种重置办法里，项目中基本用 key）。
 *      「React will also re-create the DOM elements instead of reusing them.」不换 key 时，同一位置、同一类型的组件被复用，草稿留着上一个订单的内容（测试覆盖）。
 *    - ❌ 在 Effect 里监听 prop 再 setState 清空：官方「🔴 Avoid: Resetting state on prop change in an Effect」——「This is inefficient because ProfilePage and its children will first render
 *      with the stale value, and then render again.」实测：新 prop 先配着旧草稿渲染一次，Effect 执行后再渲染第二次；换 key 的版本只渲染一次、直接是新草稿（测试覆盖；10 题）。
 *    - key 只在同一个父级里有意义：「Remember that keys are not globally unique. They only specify the position within the parent.」
 *      「A key lets you specify a named position instead of relying on order.」
 *    - 代价：key 一变整棵子树卸载重建，DOM、state、滚动位置、焦点都没了，过渡动画重放，子组件的 Effect 重新执行（比如重新请求）。只在「它确实该变成另一个东西」时用；
 *      能由 props 算出来的干脆不存（09 题），父组件也要读就提升到父组件（25 题）。
 *    - 路由参数 /orders/o1 → /orders/o2 命中同一条路由时，组件实例同样被复用，用 key={id} 或把 id 写进 Effect 依赖（18 题）。
 *    - 【少用】渲染期有条件地 set 自己的 state 来跟着 prop 调整：官方「This pattern is rarely needed」，见 03 题附 2。
 *
 * 三、Vue 对照（Vue 这一侧按 Vue 项目里的频率标；【少用】的 v-for 写法拆在 vue/RareVForDemo.vue，页面上已注释）
 * - 渲染列表：v-for="item in items" + :key="item.id"【最常用】（vue/ListBasicsDemo.vue；频率：API 页 key 一节「The most common use case is combined with v-for」，指南的示例都用 in）。
 *   要下标写 (item, index) in items（「v-for also supports an optional second alias for the index of the current item」）。要不要写 key 的规则：
 *   「It is recommended to provide a key attribute with v-for whenever possible」。
 *   组件上用 v-for 要显式传 props：「However, this won't automatically pass any data to the component, because components have isolated scopes of their own.」和 React 的 <Row key={id} order={order} /> 一样。
 * - 一项多个节点：<template v-for>，key 写在 <template> 上【常用】（频率：工程经验；「When using <template v-for>, the key should be placed on the <template> container」），对应 React 的 <Fragment key>。
 *   Vue 2 的 <template> 不能带 key、要写在子元素上（附 7），eslint-plugin-vue 的 vue/no-v-for-template-key-on-child 会拦这种旧写法。
 * - 过滤排序：computed【最常用】，排序前先拷贝（「Be careful with reverse() and sort() in a computed property!」）。
 *   v-if 与 v-for 写在同一个元素上 ❌：「When they exist on the same node, v-if has a higher priority than v-for. That means the v-if condition will not have access to variables from the scope of the v-for」
 *   —— 编译结果里 v-if 包在 renderList 外面、读的是 _ctx.todo（测试覆盖）；「It's not recommended to use v-if and v-for on the same element due to implicit precedence.」lint 的 vue/no-use-v-if-with-v-for 报错。
 *   按要做的事分开改：
 *   - 过滤列表项：computed【最常用】（「replace users with a new computed property that returns your filtered list」，频率：工程经验）；
 *     把 v-for 挪到外层 <template>、v-if 写在里面【常用】（「This can be fixed by moving v-for to a wrapping <template> tag (which is also more explicit)」，编译后 v-if 在循环里面，测试覆盖）；
 *     嵌套循环里用不了 computed 时改用方法（附 6）。
 *   - 隐藏整个列表：✅ v-if 挪到外层容器（「move the v-if to a container element」，区块一的 <ul v-if> / <p v-else>，测试覆盖）。
 *   React 没有指令优先级的问题：先 filter 再 map。
 * - 不写 :key ❌【主流】（vue/KeyBugDemo.vue）：就地更新（in-place patch），「only suitable when your list render output does not rely on child component state or temporary DOM state (e.g. form input values)」；
 *   按位置复用 DOM，开头插入、删除第一行后备注错位，末尾追加不错位，和 React 用 index 作 key 一样（测试覆盖）。运行时不报警（测试覆盖），模板里靠 eslint-plugin-vue 的 vue/require-v-for-key（本项目 flat/recommended 里是 error）。
 *   :key 用 index、Math.random() 的后果和 React 相同（测试覆盖）。
 * - key 的类型【主流】：API 页「Expects: number | string | symbol」；指南「The key binding expects primitive values - i.e. strings and numbers. Do not use objects as v-for keys.」
 *   重复 key：「Duplicate keys will cause render errors.」3.5.42 开发构建实测：挂载时、末尾追加时都不检查，更新时走到乱序比较那一步才警告一次
 *   「[Vue warn]: Duplicate keys found during update: "a" Make sure keys are unique.」，界面也会出错（4 项数据渲染出 5 个 <li>，测试覆盖）。
 * - 改数组：直接调变更方法 push / unshift / splice【最常用】（「Vue is able to detect when a reactive array's mutation methods are called and trigger necessary updates.」）；
 *   filter / slice 返回新数组时整体替换【常用】（「Vue implements some smart heuristics to maximize DOM element reuse」，不会整表重建）；频率是工程经验。
 *   React 的 state 要造新数组交给 setter（原地改完再传同一个引用会被跳过，03 题区块三）。
 *   ref 装数组时内部用 reactive() 转成 Proxy，Proxy 包的是原数组：初始值是模块常量时要先拷贝，否则 push 改掉的是常量（测试覆盖）。
 *   [...INITIAL_ORDERS] 是浅拷贝：数组是新的，里面的订单对象还是常量里那几个，要改订单字段得先拷贝对象（和 React 那边「拷贝是浅的」同一回事）。
 * - 换 :key【主流】（vue/KeyResetDemo.vue）：「It can also be used to force replacement of an element/component instead of reusing it.」和 React 的 key 同一个机制（测试覆盖）。
 *   官方列的用途是「Properly trigger lifecycle hooks of a component」和「Trigger transitions」：<transition><span :key="text">，text 变了就换一个元素、播放过渡；
 *   <router-view :key="$route.fullPath"> 就是它（18 题）。prop 变了要重置内部状态时，Vue 项目里换 :key 和 watch 手动重置两种都常见（工程经验，演示里两种都有）。
 *   watch 的回调默认在「before the owner component's DOM updates」执行，换订单后子组件只渲染一次、没有「新订单 + 旧草稿」这一帧（测试覆盖）—— 这是它和 React「在 Effect 里 setState」的区别。
 * - 【少用】of 代替 in、遍历对象、整数范围、解构、v-memo：见附 6。
 *
 * 四、关键区别（每条写明前提）
 * 1. 写法：React 任何版本都用 JS 的数组方法，没有遍历对象 / 整数范围的语法糖（要自己写 Object.entries()、Array.from()）；Vue 模板用 v-for 指令，这些都内置。
 * 2. 不写 key：两边默认都按位置复用（React 用 index，Vue 就地更新），在开头 / 中间插入、删除开头 / 中间的项、重排时，都会把输入框内容、子组件 state 串到别的行；
 *    React 开发环境报错提示，Vue 运行时不提示、靠 lint。
 * 3. 改数组：React 要造新数组交给 setter（原地改完再传同一个引用会被跳过，03 题区块三）；Vue 直接调变更方法、整体替换都行。
 * 4. key 的类型：React 允许 bigint，Vue 允许 symbol；两边的类型检查都会拦对象 key（React 的 Key 类型、vue-tsc 报 PropertyKey，复核代理实测），文档也要求用原始值。重复 key：React 挂载时就报（测试覆盖）；Vue 挂载时不查，更新时才可能警告。
 * 5. 换 key 重置：机制一致（key 变了就卸载旧实例、创建新实例），写法可以直接平移；卸载时 React 执行 Effect 清理，Vue 走 onUnmounted。
 *    不换实例的手动重置：Vue 的 watch 在组件更新前执行，一次渲染出正确结果；React 在 Effect 里 setState 会先用旧值渲染一次，官方要避免。
 *
 * 五、常见追问与回答要点
 * - key 是干什么的？为什么不推荐 index？协调时按 key 把新旧列表项对上号；index 在开头插入、删除、排序后对上的是别的数据，输入框和子组件 state 串行（区块二）。
 * - index 什么时候可以？满足其一：已有项的下标始终不变（只在末尾追加、不在开头 / 中间插入、不删中间项、不排序）；或者列表项是纯展示内容、没有自己的 state 和非受控输入
 *   （下标变了也只是就地改文字，本项目的日志面板就是这样）。见附 4。
 * - key={Math.random()} 有什么问题？每次渲染都是新 key，所有列表项卸载重建，又慢又丢输入。本地新建的数据在创建时生成 id、存进数据（区块二的 createLocalOrder）。
 * - key 在什么范围内唯一？兄弟之间；两个列表用同一批 id 不冲突。组件里读不到 key，要另传一个 prop。类型是 string | number | bigint。
 * - key 写在哪？map 直接返回的那个元素上；提取成组件后写在 <Row key> 上，不是组件内部的根元素。
 * - 一项要渲染两个元素，key 怎么写？能包一层就包一层；不能多包一层（表格里一项占两行 <tr>）就用 <Fragment key>，<> 带不了 key。
 * - key 除了列表还能干什么？给组件换 key 重置内部 state，例如切换查看的用户 / 订单时重置表单（区块三）。比在 Effect 里 setState 好在哪：一次渲染出正确结果，不会先配着旧值渲染一次（测试覆盖）。
 * - 路由 /orders/1 → /orders/2，页面里的 state 为什么没重置？同一条路由、同一位置的组件被复用；外层给 key={id}，或把 id 写进 Effect 依赖（18 题）。
 * - Vue 不写 key 和 React 不写 key 一样吗？都按位置复用；区别是 React 开发环境报错，Vue 运行时不提示。Vue 的 key 为什么不能是对象？文档要求原始值（number | string | symbol）。
 *   <template v-for> 的 key 放哪？Vue 3 放在 <template> 上。v-for 和 v-if 谁先？Vue 3 是 v-if 先（Vue 2 相反），所以不要写在同一个元素上，过滤用 computed。
 *
 * 六、易错点
 * - key={index} 的列表在开头插入、删除、排序（区块二）。
 * - key={Math.random()}、key={Date.now()}，或在 JSX 里调 crypto.randomUUID()：每次渲染都是新 key。
 * - key 写在组件内部的根元素上，而不是 map 返回的 <Row> 上（React 照样报缺 key）。
 * - 用 <> 包多个节点，key 加不上 —— 要写 <Fragment key>。
 * - map 的块体箭头函数里忘了 return：什么都不渲染，也不报错（TypeScript 能拦，测试覆盖）。
 * - 在渲染时对 state、props、模块常量直接 sort() / reverse()：改掉了原数组（区块一在「全部」时拿到的就是模块常量）。
 * - 以为组件里能读到 props.key：读到的是 undefined，开发环境报错（02 题）。
 * - map 里写 <Row {...item} />，而 item 里带 key 字段：开发环境报「A props object containing a "key" prop is being spread into JSX …」，key 要直接写 key={item.id}（02 题）。
 * - 拿会频繁变化的值当 key（例如每次保存都变的版本号），整棵子树反复重建，输入和焦点跟着丢。
 * - Vue：v-if 和 v-for 写在同一个元素上；不写 :key 又在列表项里放输入框 / 有状态的子组件；ref(模块常量数组) 之后直接 push，改掉了常量。
 *
 * 七、生产环境注意（本课演示做了哪些简化）
 * - 演示简化：区块二的备注框是非受控的，为了让「DOM 被错误复用」看得见；真实项目里备注是受控的、按 order.id 存在 state 里，就不会这样串 ——
 *   但错误的 key 仍会让列表项组件自己的 state、焦点、动画、非受控的第三方组件跟错行。
 * - key 用后端 id；本地新建的临时项在创建时生成 id（crypto.randomUUID() 只在安全上下文可用，附 5）。后端数据和本地临时项合在一个列表里时给 key 加前缀（server-${id} / local-${uuid}），
 *   免得撞；临时项保存成功、换成后端 id 时这一行会重建一次（key 变了），要保住行内的输入状态，就在数据里另存一个不变的 clientId 当 key（工程经验）。
 * - 过滤、排序在渲染时算，数据多了交给后端分页（或服务端状态库，30 题）；分页、搜索的列表 key 用数据 id，不要用页内下标，否则换页时行内状态串到别的数据上。
 * - 长列表：列表项组件包 memo 时，传进去的对象、回调要保持引用稳定（17 题）；可见行成千上万、一次性渲染确实卡时用虚拟化（只渲染视口里的行），常见的是 TanStack Virtual、react-window 这类库
 *   （工程经验；react.dev 没有推荐具体方案，本项目没装）。
 * - key 重置的代价（DOM、state、滚动、焦点、Effect 重跑）只在「确实变成另一个东西」时付；不要为了「刷新一下」拿自增数字当 key。
 *
 * 八、旧写法对照【旧写法】（只用于读懂存量代码）
 * - Children.map / Children.toArray / cloneElement：react.dev 把它们放在「Legacy React APIs」——「These APIs are exported from the react package, but they are not recommended for use in newly
 *   written code.」Children 页：「Using Children is uncommon and can lead to fragile code.」老组件库里常见「遍历 children、给每个子元素 cloneElement 加 props」的写法。
 *   Children.map 会把返回元素的 key 和原来子元素的 key 合在一起（「the returned elements' keys will be automatically combined with the key of the corresponding original item from children」），
 *   toArray 按原来的 key、嵌套层级和位置重新算 key（「The returned elements' keys will be calculated from the original elements' keys and their level of nesting and position.」）。
 *   现在的替代写法之一就是本题的做法：「Accepting an array of objects as a prop」，组件拿到普通数组再 map（Children API 与 cloneElement 的讲解，13 题改写时补）。
 * - 存量代码里大量的 key={index}：先看这个列表会不会插入、删除、排序，会就换成数据的 id（附 4）。
 * - class 组件时代 key 的规则一样；遍历 this.props.children 同样用 Children.map。
 *
 * 九、新动向【尝鲜】
 * - React 19.3【尝鲜·19.3.0】（2026-09-09 发布，未满 30 天，本课不用）：Fragment Refs 转为稳定 ——「In 19.3, you can use them by passing a ref directly to a <Fragment>. This ref gives you a
 *   FragmentInstance」，可以对一组没有共同父元素的列表项统一加监听；同样不能用 <> 传 ref。本仓库的 react-dom 19.2.8 没有 FragmentInstance，给 <Fragment> 传 key、children 以外的
 *   prop 开发环境报「Invalid prop `ref` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.」（react-dom-client.development.js:6073 的格式串），TypeScript 也报错，ref 一直是 null（测试覆盖）。
 * - React Compiler【较新】：自动记忆化列表项组件和计算，但 key 的规则不变（17 题改写时补 Compiler 小节）。
 * - useMemo 参考页的 Caveats 提到将来可能内置虚拟化列表：「if React adds built-in support for virtualized lists in the future, it would make sense to throw away the cache for items that scroll out of
 *   the virtualized table viewport」—— 只是假设，目前没有这个功能；这条 Caveat 自己的结论是「This should be fine if you rely on useMemo solely as a performance optimization.」
 *
 * 十、动手练习
 * 1. 在区块二选「index」，先在 SO-1001、SO-1002 的备注框里输入「加急」「送礼」，再点「删除第一行」。可断言：第一行（SO-1002）的输入框 value 是「加急」；
 *    换成「order.id」重做一遍，第一行的 value 是「送礼」（Example.test.tsx 区块二的 run() 辅助函数可以直接用）。
 * 2. 给 KeyResetDemo.tsx 的 OrderNoteEditor 加一个 label prop（两个编辑器分别传 without / with）和一个 useEffect：挂载时往一个外部数组里记「with 挂载 SO-xxxx」、清理时记「with 卸载 SO-xxxx」
 *    （订单号用 mountedFor）。在测试里渲染 KeyResetDemo（测试没有 StrictMode；页面包着 StrictMode，新挂载的 Effect 在开发环境会多一轮「清理 → 建立」），清空初始记录后切到 SO-1002。
 *    可断言：没有 without 开头的新记录，with 依次记了「with 卸载 SO-1001」「with 挂载 SO-1002」。
 * 3. 把 ListBasicsDemo.tsx 里的 [...filtered].sort(…) 改成 filtered.sort(…)。可断言：区块一第一条测试失败 —— 在「全部」时 filtered 就是 PRODUCTS，排序把模块常量原地改掉了。
 * 4. 取消 vue/ListBasicsDemo.vue 里 RareVForDemo 的两处【少用】注释（script 里的 import、模板里的用法）。可断言：npm run lint、npm run typecheck 通过，Vue 区块一多出
 *    「【少用】v-for 的其他写法」，vue/Example.test.ts 照样全部通过。
 *
 * 附：少用的写法与细节（Vue 侧对应的演示已注释，删掉注释块的第一行和最后一行就能运行；读别人的代码时认得出来就行）
 * 1. 【少用】for 循环往数组里 push JSX：const rows = []; for (…) rows.push(<Row key={…} />)。数组是这次渲染新建的局部变量，push 属于允许的局部突变（01 题 PurityDemo.tsx 的茶杯例子
 *    就是这样写的），效果和 map 一样，只是多一个变量。官方正文用 map / filter；挑战题「List with a separator」的答案里出现过手写循环（每项要输出多个兄弟节点时，
 *    「You can write a manual loop」），项目里遍历数据基本用 map（工程经验）。
 * 2. 【少用】map 回调里返回 null 来跳过某一项：null 不产生节点（05 题），能用，但过滤条件混进了渲染；官方示范的是先 filter 再 map（频率：工程经验）。细节：
 *    - 缺 key 的报错：文档里展示的是「Warning: Each child in a list should have a unique "key" prop.」，react-dom 19.2.8 实际打出来的没有「Warning:」前缀，带着组件名和链接：
 *      「Each child in a list should have a unique "key" prop.\n\nCheck the render method of `Missing`. See https://react.dev/link/warning-keys for more information.」
 *      重复 key：「Encountered two children with the same key, `a`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be
 *      duplicated and/or omitted — the behavior is unsupported and could change in a future version.」（测试覆盖）
 *    - Fragment 页 Caveats：「React does not reset state when you go from rendering <><Child /></> to [<Child />] or back」，而且只限一层。
 * 3. 【少用】toSorted()：不改原数组，直接返回排好序的新数组（MDN ③「the copying version of the sort() method」），ES2023 起有，2026-01 进入 MDN 的 Baseline widely available。
 *    本项目 tsconfig 的 lib 是 ES2022，类型里没有它（运行时有）；react.dev 和 Vue 文档示范的都是先拷贝再 sort，所以本课用 [...arr].sort()。把 lib 升到 ES2023 以后就可以写。
 * 4. 【少用】index 作 key 的前提：「This is a rare case where index as a key is acceptable because a poem's lines will never reorder.」另一道挑战题的答案同样只在不重排时允许
 *    （「with the caveat that you can't safely reorder ingredients」）。满足下面任意一条就不会出错：
 *    ① 已有项的下标始终不变 —— 只在末尾追加（或只删末尾），不在开头 / 中间插入、不删中间项、不排序、不过滤（官方给的就是这一条；区块二「末尾追加」不错位，测试覆盖，
 *      列表项里有非受控输入也没事）；
 *    ② 列表项是纯展示内容，没有自己的 state、非受控输入、焦点、动画：下标变了 React 也只是就地改文字，结果照样对，只是多几次更新（工程经验）。
 *    本项目的日志面板（03、04、05、26 题的 LogPanel）靠的是 ②：日志超过上限时从头部删旧行，下标是会变的。
 * 5. 细节：key 的来源
 *    - crypto.randomUUID() 的前提（MDN ③）：「This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.」「Documents are secure contexts when their resources are
 *      delivered over an HTTPS connection, or are delivered from a loopback (local) address.」—— http://localhost 可以，用 http + 局域网 IP 打开开发服务器时没有它（demoData.ts 退回计数器，测试覆盖）。
 *    - uuid 包：官方列的第三种办法，本项目没装（randomUUID 够用）。
 * 6. 【少用】Vue 的 v-for 其他写法（vue/RareVForDemo.vue，ListBasicsDemo.vue 里已注释；测试直接挂载它）：of 代替 in（「You can also use of as the delimiter instead of in」）；
 *    遍历对象 (value, key, index)，顺序按 Object.values()；整数范围 n in 10（「Note here n starts with an initial value of 1 instead of 0.」）；解构 { id, name } in items（测试覆盖）；
 *    嵌套 v-for 里用不了 computed 时改用方法（「In situations where computed properties are not feasible (e.g. inside nested v-for loops), you can use a method」）；
 *    也能遍历 Map / Set（「v-for can also work on values that implement the Iterable Protocol, including native Map and Set.」）。
 *    v-memo（3.2+）：「v-memo is provided solely for micro optimizations in performance-critical scenarios and should be rarely needed.」「The most common case where this may prove helpful is when
 *    rendering large v-for lists (where length > 1000)」，要和 v-for 写在同一个元素上。本课没有演示。React 里对应的做法是列表项组件包 memo（17 题）。
 * 7. 细节：Vue 的 key
 *    - 官方允许不写 key 的情况：「unless the iterated DOM content is simple (i.e. contains no components or stateful DOM elements), or you are intentionally relying on the default behavior for
 *      performance gains」。
 *    - 不写 key 时的算法：「Without keys, Vue uses an algorithm that minimizes element movement and tries to patch/reuse elements of the same type in-place as much as possible.」
 *    - 重复 key 的警告在 @vue/runtime-core 3.5.42 runtime-core.cjs.js:6542：patchKeyedChildren 先对齐头尾相同的项，只给剩下「乱序的中间段」建 key → 新下标表时检查，
 *      所以挂载、头尾对得上的追加都不警告（测试覆盖）。
 *    - Vue 2 的 v-if 与 v-for 优先级相反（05 题附 4）；Vue 2 的 <template v-for> 不能带 key：「In Vue 2.x, a <template> tag could not have a key.」（v3 迁移指南）
 *
 * 参考（2026-09-19 核对，react.dev / vuejs.org / MDN 文档取自官方仓库原文）：
 * - react.dev：learn/rendering-lists、learn/preserving-and-resetting-state、learn/you-might-not-need-an-effect、learn/updating-arrays-in-state、reference/react/Fragment、reference/react/Children、
 *   reference/react/legacy、reference/react/useMemo、blog/2026/09/09/react-19-3
 * - vuejs.org：guide/essentials/list、guide/essentials/watchers、guide/essentials/reactivity-fundamentals、api/built-in-special-attributes（key）、api/built-in-directives（v-for、v-memo、v-if）；
 *   v3-migration.vuejs.org：breaking-changes/key-attribute、breaking-changes/v-if-v-for
 * - MDN（③）：Array.prototype.sort、Array.prototype.toSorted、Crypto.randomUUID、Secure contexts、<dl>、<tr>（toSorted 的 Baseline 日期与 randomUUID 的安全上下文提示取自
 *   developer.mozilla.org 的渲染页，其余取自 mdn/content 仓库原文）
 * - 源码 / 工具：react / react-dom 19.2.8、@types/react 19.2.18 index.d.ts、@vue/runtime-core 与 @vue/compiler-sfc 3.5.42、eslint-plugin-react-hooks 7.1.1（purity、set-state-in-effect）、
 *   eslint-plugin-vue 10.10.0（require-v-for-key、no-use-v-if-with-v-for、no-v-for-template-key-on-child）、typescript-eslint 的 no-unused-expressions（enforceForJSX）与 ESLint 核心规则 array-callback-return
 */
import { KeyBugDemo } from './KeyBugDemo'
import { KeyResetDemo } from './KeyResetDemo'
import { ListBasicsDemo } from './ListBasicsDemo'

export default function Example() {
  return (
    <div className="stack">
      <ListBasicsDemo />
      <KeyBugDemo />
      <KeyResetDemo />
    </div>
  )
}
