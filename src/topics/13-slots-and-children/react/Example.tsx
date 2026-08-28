/**
 * 学习主题：插槽与 children —— React 用「值」组合 UI
 *
 * React 核心概念：
 * - children：写在组件标签之间的内容，作为名为 children 的 prop 传入，类型 ReactNode —— 就是普通 prop，没有魔法
 * - 「具名插槽」不存在专门概念：再声明几个 ReactNode 类型的 props 即可（header={<...>} footer={<...>}）
 * - render prop：值为函数的 prop（renderItem={(user) => <...>}），组件把内部数据交回给使用者决定怎么渲染
 * - 组件组合（composition）是 React 复用 UI 的主要手段
 *
 * Vue 对应概念：
 * - children ≈ 默认 <slot />；header / footer props ≈ 具名插槽 #header / #footer
 * - render prop ≈ 作用域插槽：<slot :user="u" /> + 使用侧 v-slot="{ user }"
 * - React 判空可选的 footer prop ≈ Vue 用 $slots.footer 判断插槽是否传入
 *
 * 最重要的区别：
 * - Vue 的插槽是模板语法特性，插槽内容只能写在组件标签内部；React 的 JSX 是普通 JS 值，
 *   能赋给变量、存进数组、当参数传、从函数返回 ——「UI 即值」让 React 根本不需要「插槽」这个
 *   专门概念，一切用 props 表达。这是两个框架的本质差异，Vue 模板做不到。
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/shared/types'

/**
 * 可复用的 Card：标题区 + 内容区 + 底部操作区。
 * 注意：Card 和使用它的 Example 写在同一个 .tsx 文件里 —— 组件只是函数，一个文件想放几个放几个；
 * Vue 的 SFC 一个文件一个组件，Card 只能拆成单独的 Card.vue。
 *
 * children 没有任何魔法：<Card>xxx</Card> 标签之间的内容会作为名为 children 的 prop 传进来，
 * 类型是 ReactNode（「一切可渲染之物」：元素、字符串、数字、null、数组…）。对应 Vue 的默认 <slot />。
 *
 * 「具名插槽」在 React 里就是多声明几个 ReactNode 类型的 props：
 * header / footer 对应 Vue 的 #header / #footer。JSX 是值，当然可以作为 prop 传。
 */
interface CardProps {
  header: ReactNode
  children: ReactNode
  /** 可选：不传就不渲染底部操作区（对应 Vue 里用 $slots.footer 判断插槽是否传入） */
  footer?: ReactNode
}

function Card({ header, children, footer }: CardProps) {
  return (
    <div className="card">
      <div className="row">{header}</div>
      <div>{children}</div>
      {/* footer 是可选 prop，判空再渲染 —— Vue 版对应 v-if="$slots.footer" */}
      {footer && <div className="row">{footer}</div>}
    </div>
  )
}

/**
 * UserList：列表的「壳」由组件负责（ul/li、key），「每一项长什么样」交还给使用者。
 *
 * renderItem 就是 render prop —— 值为函数的 prop，签名 (user: User) => ReactNode：
 * 组件内部把数据 u 传给这个函数，使用者返回任意 JSX。
 * 对应 Vue 的作用域插槽：组件里 <slot :user="u" />，使用侧 v-slot="{ user }"。
 * 本质相同：数据在组件内部，渲染方式由外部注入。面试常问「render prop 是什么」——
 * 答「值为函数的 prop，用于反转渲染控制权」即可，作用域插槽是它在 Vue 里的对应物。
 */
interface UserListProps {
  users: User[]
  renderItem: (user: User) => ReactNode
}

function UserList({ users, renderItem }: UserListProps) {
  return (
    <ul>
      {users.map((u) => (
        // key 由列表壳负责；每项内容是一次普通的函数调用 renderItem(u)——
        // Vue 里这一步是 <slot :user="u" />
        <li key={u.id}>{renderItem(u)}</li>
      ))}
    </ul>
  )
}

// 演示数据（不发请求，专注组合本身）
const users: User[] = [
  { id: 'u1', name: '张伟', email: 'zhangwei@example.com', role: 'admin' },
  { id: 'u2', name: '李娜', email: 'lina@example.com', role: 'editor' },
  { id: 'u3', name: '王芳', email: 'wangfang@example.com', role: 'viewer' },
]

export default function Example() {
  const [message, setMessage] = useState('')

  return (
    <div className="stack">
      {/* 第一张卡片：header / footer 都是「值为 JSX 的 props」。
          footer 里的按钮直接闭包引用了父组件的 setMessage —— JSX 在父作用域创建，
          天然能访问父组件的一切；Vue 的插槽内容作用域同样在父组件（编译进父的渲染函数）。 */}
      <Card
        header={
          <>
            <strong>订单 SO-1024</strong>
            <span className="badge badge-pending">待支付</span>
          </>
        }
        footer={
          <>
            <button className="btn-primary" onClick={() => setMessage('订单 SO-1024 支付成功')}>
              去支付
            </button>
            <button className="btn-danger" onClick={() => setMessage('订单 SO-1024 已取消')}>
              取消订单
            </button>
          </>
        }
      >
        {/* 标签之间的这些内容就是 children（对应 Vue 的默认插槽）。
            这里读了父组件的 message —— 父组件每次渲染都会重新创建这段 JSX，显示永远最新 */}
        <p>客户：张伟，金额：￥1024.00</p>
        {message && <p>{message}</p>}
      </Card>

      {/* 第二张卡片：不传 footer（可选 prop），Card 内部判空后不渲染操作区 */}
      <Card header={<strong>团队成员</strong>}>
        <p className="muted">同一份数据、同一个 UserList，两种渲染 —— renderItem 说了算：</p>
        <UserList
          users={users}
          renderItem={(user) => (
            <>
              {user.name}（{user.email}）<span className="badge">{user.role}</span>
            </>
          )}
        />
        <p className="muted">精简版（只要名字 —— 函数返回字符串也是合法的 ReactNode）：</p>
        <UserList users={users} renderItem={(user) => user.name} />
      </Card>
    </div>
  )
}
