import React from 'react'

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string | number
  onChange: (value: string) => void
  onBlur?: () => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
}

/**
 * Reusable numeric input that
 *  - allows decimal inputs properly
 *  - keeps the original styling (forwards className)
 *  - shows + / – buttons to increment / decrement by `step` (default 1)
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(({
  value,
  onChange,
  onBlur,
  min,
  max,
  step = 1,
  placeholder,
  className = '',
  ...rest
}, ref) => {
  const currentVal = typeof value === 'number' ? value : parseFloat(String(value ?? ''))

  const clamp = (val: number) => {
    if (typeof min === 'number') val = Math.max(val, min)
    if (typeof max === 'number') val = Math.min(val, max)
    return val
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Allow empty string, numbers, decimals, and negative numbers
    if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue)
    }
  }

  const handleBlur = () => {
    const numValue = parseFloat(value.toString())
    
    if (!isNaN(numValue)) {
      // Apply min/max constraints
      let constrainedValue = numValue
      if (typeof min === 'number') constrainedValue = Math.max(constrainedValue, min)
      if (typeof max === 'number') constrainedValue = Math.min(constrainedValue, max)
      
      // Format to appropriate decimal places based on step
      const decimalPlaces = step.toString().includes('.') 
        ? step.toString().split('.')[1].length 
        : 0
      
      const formattedValue = constrainedValue.toFixed(decimalPlaces)
      onChange(formattedValue)
    } else {
      // If not a valid number, clear the field
      onChange('')
    }
    
    onBlur?.()
  }

  const inc = () => {
    const newValue = clamp((isNaN(currentVal) ? 0 : currentVal) + step)
    const decimalPlaces = step.toString().includes('.') 
      ? step.toString().split('.')[1].length 
      : 0
    onChange(newValue.toFixed(decimalPlaces))
  }
  
  const dec = () => {
    const newValue = clamp((isNaN(currentVal) ? 0 : currentVal) - step)
    const decimalPlaces = step.toString().includes('.') 
      ? step.toString().split('.')[1].length 
      : 0
    onChange(newValue.toFixed(decimalPlaces))
  }

  return (
    <div className="relative w-full">
      {/* Text input for better decimal handling */}
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} pr-10`} // leave space for buttons
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
