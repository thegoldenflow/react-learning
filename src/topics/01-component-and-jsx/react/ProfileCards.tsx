/**
 * 区块一：资料卡 —— 组件就是返回 JSX 的函数，JSX 就是值。
 * Vue 对照：vue/ProfileCards.vue + vue/UserCard.vue。
 *
 * 这一块把 JSX 的日常写法集中演示：组件名大写、className、style、花括号里放表达式、JSX 存进变量再当参数传、Fragment、JSX 注释。
 * UserCard 是一个组件，在下面用了两次 —— 同一个函数渲染两处，React 会创建两个互不相干的实例：每张卡的「关注」按钮各管各的（state 细节见 03 题）。
 * props 的类型、默认值、透传等细节是 02 题的内容，这里只用最简单的解构。
 *
 * 写样式按使用频率（依据见 Example.tsx 二-5）：
 * - 【最常用】静态样式写在样式表里、用 className 挂上（这里用 CSS Modules：ProfileCards.module.css）；
 * - 依赖运行时数据的值【最常用】放 style（这里是 accent 决定的头像底色和边框颜色）。
 */
import { useState, type ReactNode } from 'react'
import type { User } from '@/shared/types'
import styles from './ProfileCards.module.css'

/** 角色 → 中文文案：普通 JS 对象，JSX 花括号里直接取值 */
const ROLE_TEXT: Record<User['role'], string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '访客',
}

/** 演示简化：数据写成文件内常量（让数据动起来的 useState 是 03 题的内容） */
const vipUser: User = { id: 'u1', name: '林小满', email: 'linxiaoman@example.com', role: 'admin' }
const normalUser: User = { id: 'u2', name: '陈北洋', email: 'chenbeiyang@example.com', role: 'viewer' }

interface UserCardProps {
  user: User
  online: boolean
  /** 头像底色：运行时才知道的值，演示「动态值放 style」 */
  accent: string
  /** 是否加粗边框（VIP 卡） */
  highlight?: boolean
  /** 名字后面额外显示的内容：JSX 是值，可以当参数传进来 */
  badge?: ReactNode
}

/**
 * 组件名必须大写开头：JSX 编译时按首字母区分 —— 小写（<div>）编译成字符串 'div'，当作 HTML 标签；
 * 大写（<UserCard>）编译成对函数 UserCard 的引用，React 才会调用它。写成 <userCard /> 会被当成一个叫 usercard 的未知 HTML 标签（测试覆盖）。
 * 组件定义在模块顶层，不要写在别的组件函数里面（区块四）。
 */
function UserCard({ user, online, accent, highlight = false, badge }: UserCardProps) {
  // 每个实例一份自己的 state：点第一张卡的「关注」不影响第二张（state-a-components-memory「each copy will have completely isolated state」）
  const [followed, setFollowed] = useState(false)
  // 多行 JSX 用 () 包起来：return 后面直接换行的话，JS 的自动分号插入会让函数返回 undefined（什么都不渲染）
  return (
    // 【最常用】静态样式走 className：一两个条件用三元 / 模板字符串拼（条件多时项目里一般交给 clsx，本项目没装）
    // 【最常用】依赖数据的值放 style：只有边框颜色取决于 accent；style 接收对象，属性名写 camelCase（borderColor，不是 border-color）
    <div className={highlight ? `card ${styles.vip}` : 'card'} style={highlight ? { borderColor: accent } : undefined}>
      <div className="row">
        <div className={styles.avatar} style={{ background: accent }}>
          {user.name.charAt(0)}
        </div>
        <div>
          <div className="row">
            {/* 花括号里放任意 JS 表达式：取值、方法调用、三元都行；放不了 if / for 这类语句 */}
            <strong>{user.name}</strong>
            {/* class 要写 className、label 的 for 要写 htmlFor：JSX 属性名用的是 DOM property 的名字 */}
            <span className="badge">{ROLE_TEXT[user.role]}</span>
            {badge}
          </div>
          <span className="muted">{user.email}</span>
        </div>
      </div>
      {/* 动态 class：className 就是字符串，用三元自己拼（Vue 的 :class 有对象 / 数组语法） */}
      <div className="row">
        <p className={online ? 'success-text' : 'muted'}>{online ? '● 在线' : '○ 离线'}</p>
        <button className={followed ? 'btn-ghost' : 'btn-primary'} onClick={() => setFollowed((f) => !f)}>
          {followed ? '已关注' : '关注'}
        </button>
      </div>
    </div>
  )
}

export function ProfileCards() {
  // JSX 存进变量：它编译出来就是一个函数调用的返回值（React 元素，一个普通对象），能赋值、能当参数传、能被 return
  const vipTag = <span className="badge badge-paid">VIP</span>

  return (
    // 【最常用】<>…</> 是 Fragment 的简写：把说明文字和两张卡包成一个返回值，但不产生额外的 DOM 节点
    <>
      {/* JSX 里的注释要写成这样：花括号包住 JS 块注释；Vue 模板里用 HTML 注释 */}
      <p className="muted">
        区块一：同一个 UserCard 组件用了两次，是两个独立的实例（点一张卡的「关注」，另一张不变）；VIP 徽章是存在变量里的 JSX，通过 badge 参数传进去。
        写样式：静态样式【最常用】写在样式表里用 className 挂上（这里是 CSS Modules）；依赖数据的值【最常用】放 style（头像底色、VIP 边框颜色）。
      </p>
      <UserCard user={vipUser} online accent="#d4a017" highlight badge={vipTag} />
      <UserCard user={normalUser} online={false} accent="#5b8def" />
    </>
  )
}
