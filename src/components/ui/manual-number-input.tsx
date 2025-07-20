import React from 'react'

interface ManualNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string | number
  onChange: (value: string) => void
  onBlur?: () => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
}

export const ManualNumberInput = React.forwardRef<HTMLInputElement, ManualNumberInputProps>(({
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
      
      // Preserve user-entered decimal precision
      const formattedValue = constrainedValue.toString()
      onChange(formattedValue)
    } else {
      // If not a valid number, clear the field
      onChange('')
    }
    
    onBlur?.()
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  )
})

ManualNumberInput.displayName = 'ManualNumberInput' 