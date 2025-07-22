// Centralised inventory column definitions.
// These keys must match the column names in the `inventory` database table
// and the fields displayed in the UI table.  Keeping them in one place
// ensures that the UI, import & export utilities, and database remain
// perfectly aligned.

export interface InventoryColumn {
  /** Database/JSON key */
  key: keyof InventoryRowKeys
  /** Human-readable header shown in spreadsheets / UI */
  label: string
  /** When true, column is mandatory for import & export */
  required: boolean
}

// Utility type: union of allowed keys.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface InventoryRowKeys {
  name: string
  unit: string
  current_quantity: number
  cost_per_unit: number
  low_stock_alert: number
  batch_lot_number: string | null
  expiration_date: string | null
  image_url: string | null
}

export const INVENTORY_COLUMNS: InventoryColumn[] = [
  { key: 'name',             label: 'Name',              required: true  },
  { key: 'unit',             label: 'Unit',              required: true  },
  { key: 'current_quantity', label: 'Current Quantity',  required: true  },
  { key: 'cost_per_unit',    label: 'Cost Per Unit',     required: false },
  { key: 'low_stock_alert',  label: 'Low Stock Alert',   required: false },
  { key: 'batch_lot_number', label: 'Batch/Lot Number',  required: false },
  { key: 'expiration_date',  label: 'Expiration Date',   required: false },
  { key: 'image_url',        label: 'Image URL',         required: false },
];

export const REQUIRED_INVENTORY_KEYS = INVENTORY_COLUMNS.filter(c => c.required).map(c => c.key);
