/**
 * 学习主题：组件与 JSX（没有模板 DSL，一切都是 JavaScript）
 *
 * React 核心概念：
 * - 函数组件：组件就是「返回 JSX 的普通函数」，UI = f(props/state)
 * - JSX 是表达式：编译成函数调用，可以赋值给变量、当参数传、被 return；
 *   一次只能返回单个根节点，需要多个平级节点时用 <>...</>（Fragment）
 * - 属性写 camelCase：class → className、for → htmlFor、tabindex → tabIndex
 * - 花括号 { } 里放任意 JS 表达式（取值、三元、函数调用、模板字符串），不能放 if/for 语句
 * - style={{ }} 接收对象：属性名 camelCase，纯数字默认按 px 处理
 *
 * Vue 对应概念：
 * - SFC 单文件组件：<template> + <script setup> + <style scoped>，模板是专门的 DSL
 * - 插值 {{ }}：也只能放表达式，这一点和 JSX 花括号一致
 * - :class 有对象/数组语法，:style 有对象/数组语法（编译器内置支持）
 *
 * 最重要的区别：
 * - Vue 用模板 DSL + 指令（v-bind/v-if/v-for）描述 UI，框架提供专用语法；
 *   React 没有任何模板语法——拼 class 用字符串、条件用三元、循环用 map、
 *   合并样式用对象展开。学 React 的本质是学会「用纯 JavaScript 表达 UI」。
 */
// verbatimModuleSyntax 开启时，只作类型使用的导入必须写 import type
import type { CSSProperties } from 'react'
import type { User } from '@/shared/types'

/** 角色 → 中文文案：就是一个普通 JS 对象，JSX 花括号里直接取值即可 */
const ROLE_TEXT: Record<User['role'], string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '访客',
}

/** 数据用文件内常量 —— 本题只讲「怎么渲染」，让数据动起来的 useState 是 03 题的内容 */
const vipUser: User = { id: 'u1', name: '林小满', email: 'linxiaoman@example.com', role: 'admin' }
const normalUser: User = { id: 'u2', name: '陈北洋', email: 'chenbeiyang@example.com', role: 'viewer' }
const vipOnline = true
const normalOnline = false

/**
 * style 接收的是「对象」而不是字符串：
 * - 属性名必须 camelCase（borderRadius，不是 border-radius）
 * - 纯数字默认按 px 处理（width: 48 → width: 48px），字符串则原样输出
 * Vue 的 :style 对象语法长得几乎一样，但 Vue 不会给数字自动补 px（要写 '48px'）。
 */
const avatarStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
}

/**
 * React 组件 = 返回 JSX 的普通函数。没有 <template>、没有编译期指令。
 *
 * JSX 的本质（面试高频）：JSX 会被编译成函数调用——
 *   <div className="card" /> ≈ jsx('div', { className: 'card' })
 * 正因为它只是函数调用的语法糖，所以：
 * 1) JSX 是「表达式」：能赋值给变量、能当参数传、能被 return。
 *    Vue 的模板片段做不到这一点（想复用只能抽组件或 slot）——没有一一对应关系；
 * 2) 一个组件只能 return 单个根节点（函数只有一个返回值）。需要多个平级节点时
 *    包一层 <>...</> Fragment（不产生真实 DOM）。Vue 3 模板允许多根，编译器自动处理。
 */
export default function Example() {
  // JSX 存进变量：VIP 徽章只在第一张卡出现，先定义好，下面用 {vipTag} 直接插入。
  // 这是「JSX 是表达式」最直观的体现，Vue 模板里没有等价写法。
  const vipTag = <span className="badge badge-paid">VIP</span>

  return (
    <div className="stack">
      <p className="muted">用户资料卡：上为 VIP 卡，下为普通卡，数据来自文件内常量</p>

      {/* JSX 里的注释要像本行一样：花括号包住 JS 块注释；Vue 模板里用 HTML 注释 <!-- --> */}

      {/* ===== VIP 卡片 ===== */}
      {/* style={{ }} 外层花括号表示「这是 JS 表达式」，内层花括号是对象字面量；
          borderWidth: 2 会自动变成 2px（Vue 的 :style 里数字不会自动加 px） */}
      <div className="card" style={{ borderColor: '#d4a017', borderWidth: 2 }}>
        <div className="row">
          {/* 合并样式：React 没有 :style 数组语法，用 JS 对象展开 {...} 自己合并 */}
          <div style={{ ...avatarStyle, background: '#d4a017' }}>{vipUser.name.charAt(0)}</div>
          <div>
            <div className="row">
              {/* 花括号里是任意 JS 表达式：取值、方法调用都行，对应 Vue 的插值 {{ }} */}
              <strong>{vipUser.name}</strong>
              {/* class 必须写 className：class 是 JS 保留字，JSX 属性对齐 DOM property；
                  同理 label 的 for 要写 htmlFor */}
              <span className="badge">{ROLE_TEXT[vipUser.role]}</span>
              {vipTag}
            </div>
            <span className="muted">{vipUser.email}</span>
          </div>
        </div>
        {/* 动态 class：React 没有 :class 对象/数组语法，className 就是普通字符串，
            用三元（或模板字符串、数组 join）自己拼。工业界常用 clsx/classnames
            库简化多条件拼接，本项目不引第三方库。 */}
        <p className={vipOnline ? 'success-text' : 'muted'}>{vipOnline ? '● 在线' : '○ 离线'}</p>
      </div>

      {/* ===== 普通卡片 ===== */}
      <div className="card">
        <div className="row">
          <div style={{ ...avatarStyle, background: '#5b8def' }}>{normalUser.name.charAt(0)}</div>
          <div>
            <div className="row">
              <strong>{normalUser.name}</strong>
              <span className="badge">{ROLE_TEXT[normalUser.role]}</span>
            </div>
            <span className="muted">{normalUser.email}</span>
          </div>
        </div>
        <p className={normalOnline ? 'success-text' : 'muted'}>
          {normalOnline ? '● 在线' : '○ 离线'}
        </p>
      </div>
    </div>
  )
}
