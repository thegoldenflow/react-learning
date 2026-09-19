/**
 * 区块六【少用】：onWheel / onTouchStart / onTouchMove 是被动（passive）监听 —— 在里面 preventDefault 不起作用，页面照样滚动。
 * 只有自定义缩放、横向滚动的轮播、拖拽这类要拦滚轮 / 触摸的场景才用得上（工程经验），整块在 Example.tsx 里已注释（取消注释即可运行）；
 * 本文件保留，Example.test.tsx 直接渲染它，结论照样被测试验证。讲解见 Example.tsx 附 3。
 * 要拦住滚轮（自定义缩放、横向滚动的轮播），用 ref + addEventListener('wheel', fn, { passive: false })。
 * Vue 对照：vue/PassiveWheelDemo.vue（@wheel.prevent 可以直接用，因为 Vue 默认不加 passive；.passive 是显式声明）。
 */
import { useEffect, useRef, useState, type WheelEvent } from 'react'

export function PassiveWheelDemo() {
  const [reactResult, setReactResult] = useState('（在左边的框里滚动滚轮）')
  const [zoom, setZoom] = useState(100)
  const nativeBoxRef = useRef<HTMLDivElement>(null)

  /**
   * ❌ React 的 onWheel：react-dom 在 root 容器上用 { passive: true } 注册 wheel / touchstart / touchmove
   * （react-dom-client.development.js:19251-19270，浏览器支持 passive 时）。passive 监听里调用 preventDefault 被浏览器忽略（MDN：「If a passive listener calls
   * preventDefault(), nothing will happen and a console warning may be generated.」），页面照样滚。
   * React 的合成事件对象自己记了一笔（isDefaultPrevented() 为 true），但原生事件的 defaultPrevented 还是 false —— 看后者才知道到底拦没拦住（测试覆盖）。
   * 现行 react.dev 参考页没有写这一点；出处是 React 17 发布说明的 changelog：「Keep onTouchStart, onTouchMove, and onWheel passive.」
   */
  function handleReactWheel(e: WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    setReactResult(`e.isDefaultPrevented() = ${e.isDefaultPrevented()}，e.nativeEvent.defaultPrevented = ${e.nativeEvent.defaultPrevented}（没拦住，页面照样滚）`)
  }

  /**
   * ✅ 原生监听器显式 { passive: false }：preventDefault 生效，滚轮只用来缩放，页面不滚。
   * MDN：浏览器把 window / document / body 上的 wheel、touchstart、touchmove 默认当成 passive，想要 false 就「explicitly set the option to false」。
   * 这是「与 React 之外的系统同步」的正当 Effect（10 题）：挂监听、返回清理函数；setZoom 在监听器里调用，不是在 Effect 体里同步调用。
   */
  useEffect(() => {
    const box = nativeBoxRef.current
    if (!box) return
    const onWheel = (e: globalThis.WheelEvent) => {
      e.preventDefault()
      setZoom((z) => Math.min(200, Math.max(50, z + (e.deltaY < 0 ? 10 : -10))))
    }
    box.addEventListener('wheel', onWheel, { passive: false })
    return () => box.removeEventListener('wheel', onWheel)
  }, [])

  const boxStyle = { height: 80, overflow: 'hidden', border: '1px dashed currentColor', padding: 8, flex: 1 }

  return (
    <div className="card stack">
      <h3>区块六【少用】：onWheel 是被动监听 —— 要拦滚轮用原生监听器</h3>
      <div className="row">
        <div data-testid="react-wheel" style={boxStyle} onWheel={handleReactWheel}>
          ❌ onWheel + preventDefault
        </div>
        <div data-testid="native-wheel" ref={nativeBoxRef} style={boxStyle}>
          ✅ addEventListener(…, {'{ passive: false }'})：缩放 <strong data-testid="zoom">{zoom}%</strong>
        </div>
      </div>
      <p className="muted" data-testid="react-wheel-result">
        {reactResult}
      </p>
    </div>
  )
}
