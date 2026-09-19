/**
 * 带 label、提示、错误信息的文本输入组件。它是受控的：值和变化都交给父组件管。
 *
 * 本课用它演示三件事：
 * 1. useId（18.0 起）：生成 id，再用 htmlFor / aria-describedby 把 label、提示、错误信息和输入框关联起来。
 *    label 用 htmlFor + id【常用】（包在 <label> 里【最常用】，见下面 JSX 的注释）；提示和错误信息不管哪种都要靠 aria-describedby + id；
 * 2. ref 作为普通 prop【主流·19.0 起】：父组件传 ref 就能拿到里面的 <input>（提交失败时用它聚焦）。
 *    React 18 要用 forwardRef 包一层，写法见 Example.tsx「八、旧写法对照」；
 * 3. 自定义输入组件的受控约定：和原生 <input> 一样收 value + onChange，父组件的 handleChange 不用改。
 *
 * Vue 对照：vue/TextField.vue —— defineModel()【较新·3.4 起】代替 value + onChange，useId()（3.5 起）。
 */
import { useId, type ChangeEvent, type HTMLAttributes, type Ref } from 'react'

export interface TextFieldProps {
  label: string
  /** FormData 和通用 handleChange 都靠 name 认字段 */
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  /** 常驻的说明文字，例如格式要求 */
  hint?: string
  /** 校验错误；有值时输入框标记 aria-invalid，并把错误信息读给读屏软件 */
  error?: string
  /** 默认 text。type="number" 时 e.target.value 仍然是字符串（DOM 的 value 属性就是字符串） */
  type?: 'text' | 'number'
  /** 手机上弹出哪种键盘（numeric = 数字键盘），不影响 value 的类型，value 仍是字符串 */
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  /**
   * React 19 起 ref 就是函数组件的普通 prop，直接从参数里解构出来，再转给 <input>。
   * 父组件 <TextField ref={nameRef} /> 拿到的就是这个 <input> 节点。
   */
  ref?: Ref<HTMLInputElement>
}

export function TextField({ label, name, value, onChange, hint, error, type = 'text', inputMode, ref }: TextFieldProps) {
  /**
   * useId 返回的字符串在这个组件实例的整个生命周期里不变，同一组件渲染两份得到两个不同的 id。
   * 一个组件需要多个 id 时，只调一次 useId，其余的用后缀派生（官方「Generating IDs for several related elements」）。
   *
   * 为什么不用自增计数器或 Math.random()：服务端渲染时 HTML 里的 id 和客户端 hydration 算出来的 id 必须一致，
   * 计数器和随机数做不到；useId 按组件在树里的「父路径」生成（官方原文见 Example.tsx 二-5）。
   * 不要用它当列表的 key，也不要拼进 querySelector('#' + id) 依赖它的格式 ——
   * 默认格式在 19.0（:r:）、19.1（«r»）、19.2（_r_）各不相同。
   */
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  // aria-describedby 可以放多个 id（空格分隔），读屏软件读完 label 后接着读这些描述。
  // 一个都没有时传 undefined，React 就不渲染这个属性。
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className="stack" style={{ gap: 4 }}>
      <div className="row">
        {/* htmlFor 对应 HTML 的 for 属性（for 是 JS 关键字）。点 label 会聚焦输入框，读屏软件读输入框时会读出 label。
            也可以把 <input> 包在 <label> 里（隐式关联），但提示和错误信息仍然要靠 aria-describedby 关联。 */}
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          ref={ref}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      </div>
      {hint && (
        <p id={hintId} className="muted" style={{ margin: 0 }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="error-text" style={{ margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  )
}
