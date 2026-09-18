/**
 * UiButton：组件库风格的按钮（区块四用）。Vue 对照：vue/UiButton.vue。
 *
 * 要讲的事：React 没有「自动透传」。props 只是函数的参数，没被组件用上的属性就留在这个对象里，不会自己跑到 DOM 上 ——
 * 外面传了 disabled，只要组件没把它交给 <button>，按钮照样能点；传了 onClick 也不会触发。
 * 想让自定义组件接收原生属性，就两步：类型上继承原生 <button> 的全部属性，运行时用 { ...rest } 展开到真实元素上。
 * Vue 这边默认会把没声明成 props 的属性自动落到单根组件的根元素上（fallthrough attributes），见 vue/UiButton.vue。
 */
import type { ComponentPropsWithRef, CSSProperties } from 'react'

/**
 * ComponentPropsWithRef<'button'> = 原生 <button> 能接收的全部 props 类型：onClick / disabled / type / title / aria-* / children，
 * 以及 ref（React 19 起 ref 对函数组件来说就是一个普通 prop）。data-* 不在这个类型里，TypeScript 对 JSX 里带连字符的属性名不做检查，所以照样能传。
 * @types/react 19.2.18 的 JSDoc 建议用 WithRef / WithoutRef 这两个，
 * 「as they let you be explicit about whether or not to include the `ref` prop」；对 DOM 元素来说 ComponentProps<'button'> 是同一个类型。
 * 组件自己的 props 用交叉类型 & 拼上去。和原生属性同名、类型又不兼容的自定义 prop 要先 Omit 掉原生的那个（Example.tsx 二-10，测试里有类型层的例子）。
 */
export type UiButtonProps = ComponentPropsWithRef<'button'> & {
  /** 组件自己的 props：配色 */
  variant?: 'primary' | 'danger'
  /** 组件自己的 props：尺寸（演示「组件内部也有 style 时要和外部 style 合并」） */
  size?: 'sm' | 'md'
}

/** variant → 全局按钮类名：普通 JS 对象 */
const VARIANT_CLASS: Record<NonNullable<UiButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  danger: 'btn-danger',
}

/**
 * size → 组件内部的行内样式。演示简化：真实组件库把尺寸写成 CSS 类（CSS Modules / Tailwind），这里用 style 是为了演示 style 的合并。
 * 查表用的对象放在模块顶层，不用每次渲染重建。
 */
const SIZE_STYLE: Record<NonNullable<UiButtonProps['size']>, CSSProperties> = {
  sm: { fontSize: 12, padding: '2px 8px' },
  md: {},
}

export function UiButton({ variant = 'primary', size = 'md', className, style, ref, children, ...rest }: UiButtonProps) {
  // className 为什么要单独解构出来？不接住的话，外部的 className 和组件自己的只能留一个 —— 谁写在后面谁赢：组件的写在 {...rest} 后面，外部传的被丢掉；
  // 写在前面，组件自己的 btn-primary 被整个覆盖。所以先接住、再合并：真实项目一般用 clsx / cn 这类工具函数拼接（本项目不引入）。Vue 的 class / style 透传时由框架自动合并。
  const mergedClassName = [VARIANT_CLASS[variant], className].filter(Boolean).join(' ')
  // style 同理：组件内部的样式在前、外部传入的在后，外部同名属性覆盖内部的。
  const mergedStyle: CSSProperties = { ...SIZE_STYLE[size], ...style }

  return (
    // {...rest} 的位置决定谁说了算（JSX 属性按书写顺序合并，后写的覆盖先写的）：
    // - type="button" 写在 {...rest} 前面 → 它只是默认值，外部传 type="submit" 能覆盖（表单里没写 type 的 <button> 是提交按钮，点一下就提交，所以组件给默认值 button）；
    // - className / style 写在 {...rest} 后面 → 用的是合并后的值（rest 里本来也没有它们，已经解构走了）。
    // ref 就是普通 prop：解构出来再交给 <button>（不解构的话它也在 rest 里，{...rest} 一样会把它交给 <button>；显式写出来更好读）。
    // React 18 及以前函数组件收不到 ref，要用 forwardRef 包一层（Example.tsx 八）。
    <button type="button" {...rest} ref={ref} className={mergedClassName} style={mergedStyle}>
      {children}
    </button>
  )
}
