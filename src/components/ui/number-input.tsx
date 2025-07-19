import React from 'react'

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  step?: number
}

/**
 * Reusable numeric input that
 *  - keeps the original styling (forwards className)
 *  - disables mouse-wheel value changes
 *  - shows + / – buttons to increment / decrement by `step` (default 1)
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(({
  step = 1,
  className = '',
  value,
  onChange,
  min,
  max,
  ...rest
}, ref) => {
  const currentVal = typeof value === 'number' ? value : parseFloat(String(value ?? ''))

  const clamp = (val: number) => {
    if (typeof min === 'number') val = Math.max(val, min)
    if (typeof max === 'number') val = Math.min(val, max)
    return val
  }

  const emitChange = (val: number) => {
    if (!onChange) return
    const e = {
      target: { value: String(val) },
      currentTarget: { value: String(val) }
    } as unknown as React.ChangeEvent<HTMLInputElement>
    onChange(e)
  }

  const inc = () => emitChange(clamp((isNaN(currentVal) ? 0 : currentVal) + step))
  const dec = () => emitChange(clamp((isNaN(currentVal) ? 0 : currentVal) - step))

  return (
    <div className="relative w-full">
      {/* Native input */}
      <input
        ref={ref}
        type="number"
        value={value}
        onChange={onChange}
        onWheel={e => (e.target as HTMLInputElement).blur()} // disable wheel increment
        className={`${className} pr-10`} // leave space for buttons
        min={min}
        max={max}
        {...rest}
      />
      {/* Buttons */}
      <div className="absolute inset-y-0 right-1 flex flex-col items-center justify-center gap-[2px]">
        <button
          type="button"
          onClick={inc}
          className="text-gray-400 hover:text-gray-300 leading-3 focus:outline-none"
        >+
        </button>
        <button
          type="button"
          onClick={dec}
          className="text-gray-400 hover:text-gray-300 leading-3 focus:outline-none"
        >−
        </button>
      </div>
    </div>
  )
})

NumberInput.displayName = 'NumberInput'
