import React from 'react'

interface ManualNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
  decimalSeparator?: '.' | ','
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
  decimalSeparator = '.',
  ...rest
}, ref) => {
  // Allow both . and , as decimal separator
  const regex = decimalSeparator === ',' ? /^-?\d*(,\d*)?$/ : /^-?\d*(\.\d*)?$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    // Replace comma with dot for internal consistency if needed
    if (decimalSeparator === ',' && inputValue.includes(',')) {
      inputValue = inputValue.replace(',', '.')
    }
    // Allow empty string, numbers, decimals, and negative numbers
    if (inputValue === '' || regex.test(e.target.value)) {
      onChange(e.target.value)
    }
  }

  const handleBlur = () => {
    // Convert to float and apply min/max constraints
    let numValue = parseFloat(value.replace(',', '.'))
    if (!isNaN(numValue)) {
      if (typeof min === 'number') numValue = Math.max(numValue, min)
      if (typeof max === 'number') numValue = Math.min(numValue, max)
      // Format to appropriate decimal places based on step
      const decimalPlaces = step.toString().includes('.') 
        ? step.toString().split('.')[1].length 
        : 0
      const formattedValue = numValue.toFixed(decimalPlaces)
      onChange(decimalSeparator === ',' ? formattedValue.replace('.', ',') : formattedValue)
    } else {
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