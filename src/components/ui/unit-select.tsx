import React from 'react'

interface UnitSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  required?: boolean
  className?: string
}

// Central list of measurement units. Extend as needed.
export const UNIT_OPTIONS = [
  'unit', // generic count
  'piece',
  'kg',
  'g',
  'lb',
  'oz',
  'l',
  'ml',
  'gal',
  'pack',
  'box',
  'bag'
]

export const UnitSelect: React.FC<UnitSelectProps> = ({
  value,
  onChange,
  disabled = false,
  id = 'unit-select',
  required = false,
  className = 'input-field'
}) => (
  <select
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    required={required}
    className={className}
  >
    <option value="" disabled>
      Select unit
    </option>
    {UNIT_OPTIONS.map((u) => (
      <option key={u} value={u}>
        {u}
      </option>
    ))}
  </select>
)
