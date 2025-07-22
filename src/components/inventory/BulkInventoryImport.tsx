import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInventory } from '../../hooks/useInventory'
import { useAuthStore } from '../../store/auth'
import { useBusiness } from '../../hooks/useBusiness'
import { supabase } from '../../lib/supabase'
import { FileSpreadsheet, Upload, X, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { INVENTORY_COLUMNS, REQUIRED_INVENTORY_KEYS } from './inventoryColumns'
import type { InventoryRowKeys } from './inventoryColumns'

interface InventoryRow {
  name: string
  unit: string
  current_quantity: number
  cost_per_unit: number
  low_stock_alert?: number | null
  batch_lot_number?: string | null
  expiration_date?: string | null
  image_url?: string | null
  description?: string | null
  supplier?: string | null
  location?: string | null
  min_order_quantity?: number | null
  reorder_point?: number | null
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface BulkInventoryImportProps {
  onClose: () => void
}

export function BulkInventoryImport({ onClose }: BulkInventoryImportProps) {
  const { inventory, fetchInventory } = useInventory()
  const { user } = useAuthStore()
  const { business } = useBusiness()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<InventoryRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importMode, setImportMode] = useState<'add' | 'update'>('update')
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      alert('Please select a CSV or Excel file')
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const parseFile = async (file: File) => {
    setIsProcessing(true)
    setValidationErrors([])
    
    try {
      let headers: string[] = []
      let dataRows: any[][] = []
      
      // Handle both Excel and CSV files
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length < 2) {
          throw new Error('File must contain at least a header row and one data row')
        }
        
        headers = (jsonData[0] as string[]).map(h => 
          h ? h.toString().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : ''
        )
        dataRows = (jsonData.slice(1) as any[][]).filter(row => 
          row && row.some(cell => cell !== null && cell !== undefined && cell.toString().trim())
        )
      } else {
        // Parse CSV file
        const text = await file.text()
        const rows = text.split('\n').map(row => 
          row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
        )
        
        if (rows.length < 2) {
          throw new Error('File must contain at least a header row and one data row')
        }
        
        headers = rows[0].map(h => 
          h ? h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : ''
        )
        dataRows = rows.slice(1).filter(row => row.some(cell => cell && cell.trim()))
      }

      // Define flexible header variations for each canonical field
      // This is the single source of truth for header mapping
      const fieldMappings: Record<string, string[]> = {
        name: ['name', 'product_name', 'item_name'],
        unit: ['unit', 'units', 'measurement_unit'],
        current_quantity: ['current_quantity', 'quantity', 'stock', 'qty'],
        cost_per_unit: ['cost_per_unit', 'cost', 'price', 'unit_cost'],
        low_stock_alert: ['low_stock_alert', 'low_stock', 'minimum_stock', 'min_stock'],
        batch_lot_number: ['batch_lot_number', 'batch', 'lot', 'batch_number', 'lot_number'],
        expiration_date: ['expiration_date', 'expires', 'expiry_date', 'exp_date'],
        image_url: ['image_url', 'image', 'photo_url', 'picture'],
        description: ['description', 'desc', 'details'],
        supplier: ['supplier', 'vendor', 'supplier_name'],
        location: ['location', 'storage_location', 'warehouse'],
        min_order_quantity: ['min_order_quantity', 'min_order', 'moq'],
        reorder_point: ['reorder_point', 'reorder_level', 'reorder']
      }
      
      
      // Map headers to standard field names
      const headerMap: Record<string, string> = {}
      Object.entries(fieldMappings).forEach(([standardField, variations]) => {
        const matchedHeader = headers.find(header => 
          variations.some(variation => header.includes(variation))
        )
        if (matchedHeader) {
          headerMap[matchedHeader] = standardField
        }
      })
      
      // Check for required fields
      const requiredFields: string[] = [...REQUIRED_INVENTORY_KEYS]
      const missingFields = requiredFields.filter(field => 
        !Object.values(headerMap).includes(field)
      )
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required columns. Please ensure your file contains columns for: ${missingFields.join(', ')}. Check that column names match the template.`)
      }

      const parsed: InventoryRow[] = []
      const errors: ValidationError[] = []

      dataRows.forEach((row, index) => {
        const rowData: any = {}
        
        // Process each header using the flexible mapping
        headers.forEach((header, colIndex) => {
          const standardField = String(headerMap[header])
          if (!standardField) return // Skip unmapped columns
          
          const value = row[colIndex] ? row[colIndex].toString().trim() : ''
          
          // Handle different field types
          if (['name', 'unit', 'batch_lot_number', 'description', 'supplier', 'location', 'image_url'].includes(standardField)) {
            // String fields
            rowData[standardField] = value || null
          } else if (['current_quantity', 'cost_per_unit', 'low_stock_alert', 'min_order_quantity', 'reorder_point'].includes(standardField)) {
            // Numeric fields
            if (value) {
              const numValue = parseFloat(value.replace(',', '.'))
              if (isNaN(numValue)) {
                if (requiredFields.includes(standardField)) {
                  errors.push({
                    row: index + 2,
                    field: standardField,
                    message: `Invalid number: ${value}`
                  })
                }
                rowData[standardField] = 0
              } else {
                rowData[standardField] = numValue
              }
            } else if (requiredFields.includes(standardField)) {
              errors.push({
                row: index + 2,
                field: standardField,
                message: `Required field is empty`
              })
              rowData[standardField] = 0
            }
          } else if (standardField === 'expiration_date') {
            // Date field
            if (value) {
              if (!isValidDate(value)) {
                errors.push({
                  row: index + 2,
                  field: standardField,
                  message: `Invalid date format: ${value}. Use YYYY-MM-DD`
                })
              }
              rowData[standardField] = value
            } else {
              rowData[standardField] = null
            }
          }
        })

        // Validate required fields
        if (!rowData.name?.trim()) {
          errors.push({
            row: index + 2,
            field: 'name',
            message: 'Name is required'
          })
        }

        if (!rowData.unit?.trim()) {
          errors.push({
            row: index + 2,
            field: 'unit',
            message: 'Unit is required'
          })
        }

        parsed.push(rowData as InventoryRow)
      })

      setParsedData(parsed)
      setValidationErrors(errors)
    } catch (error) {
      alert(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && !!dateString.match(/^\d{4}-\d{2}-\d{2}$/)
  }

  const processImport = async () => {
    if (!parsedData.length || !business || !user) return
    
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before importing')
      return
    }

    setIsProcessing(true)
    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const item of parsedData) {
      try {
        if (importMode === 'add') {
          // For adding new items, use direct insert without transactions
          const itemData = {
            ...item,
            business_id: business.id,
            created_by: user.id
          }

          const { error } = await supabase
            .from('inventory')
            .insert(itemData)

          if (error) {
            results.failed++
            results.errors.push(`Row ${parsedData.indexOf(item) + 2}: ${error.message}`)
          } else {
            results.success++
          }
        } else {
          // For updating existing items, find by name and update directly
          const existingItem = inventory.find(inv => 
            inv.name.toLowerCase() === item.name.toLowerCase()
          )

          if (!existingItem) {
            results.failed++
            results.errors.push(`Row ${parsedData.indexOf(item) + 2}: Item '${item.name}' not found`)
            continue
          }

          // Update only the fields that are provided in the import
          const updateData: any = {}
          if (item.current_quantity !== undefined) updateData.current_quantity = item.current_quantity
          if (item.cost_per_unit !== undefined) updateData.cost_per_unit = item.cost_per_unit
          if (item.low_stock_alert !== undefined) updateData.low_stock_alert = item.low_stock_alert
          if (item.unit !== undefined) updateData.unit = item.unit
          if (item.batch_lot_number !== undefined) updateData.batch_lot_number = item.batch_lot_number
          if (item.expiration_date !== undefined) updateData.expiration_date = item.expiration_date
          if (item.description !== undefined) updateData.description = item.description
          if (item.supplier !== undefined) updateData.supplier = item.supplier
          if (item.location !== undefined) updateData.location = item.location
          if (item.min_order_quantity !== undefined) updateData.min_order_quantity = item.min_order_quantity
          if (item.reorder_point !== undefined) updateData.reorder_point = item.reorder_point
          if (item.image_url !== undefined) updateData.image_url = item.image_url

          const { error } = await supabase
            .from('inventory')
            .update(updateData)
            .eq('id', existingItem.id)
            .eq('business_id', business.id)

          if (error) {
            results.failed++
            results.errors.push(`Row ${parsedData.indexOf(item) + 2}: ${error.message}`)
          } else {
            results.success++
          }
        }
      } catch (error) {
        results.failed++
        results.errors.push(`Row ${parsedData.indexOf(item) + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    setImportResults(results)
    setIsProcessing(false)
    
    // Refresh inventory data after successful import
    if (results.success > 0) {
      fetchInventory()
    }
    
    // Close modal if all imports were successful
    if (results.failed === 0) {
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }

  const downloadTemplate = () => {
    // Create Excel template with proper headers using canonical column list
    const headers = INVENTORY_COLUMNS.map(col => col.label)

    const sampleData = [
      [
        'Sample Cheese',        // name
        'wheels',               // unit  
        100,                    // current_quantity
        5.50,                   // cost_per_unit
        10,                     // low_stock_alert
        'BATCH001',             // batch_lot_number
        '2024-12-31',           // expiration_date
        'https://example.com/cheese.jpg', // image_url
        'Aged cheddar cheese',  // description
        'Local Dairy Co',       // supplier
        'Cold Storage A',       // location
        50,                     // min_order_quantity
        20                      // reorder_point
      ],
      [
        'Sample Bread',         // name
        'loaves',               // unit
        25,                     // current_quantity
        2.99,                   // cost_per_unit
        5,                      // low_stock_alert
        'BATCH002',             // batch_lot_number
        '2024-07-25',           // expiration_date
        '',                     // image_url
        'Fresh sourdough bread', // description
        'Artisan Bakery',       // supplier
        'Bakery Section',       // location
        10,                     // min_order_quantity
        5                       // reorder_point
      ]
    ]

    // Create Excel workbook
    const workbook = XLSX.utils.book_new()
    
    // Prepare data for Excel (headers + sample data)
    const excelData = [headers, ...sampleData]
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)
    
    // Set column widths for better readability based on canonical columns
    const colWidths = INVENTORY_COLUMNS.map(col => {
      switch (col.key) {
        case 'name': return { wch: 20 }
        case 'unit': return { wch: 10 }
        case 'current_quantity': return { wch: 15 }
        case 'cost_per_unit': return { wch: 12 }
        case 'low_stock_alert': return { wch: 15 }
        case 'batch_lot_number': return { wch: 15 }
        case 'expiration_date': return { wch: 15 }
        case 'image_url': return { wch: 30 }
        case 'description': return { wch: 25 }
        case 'supplier': return { wch: 20 }
        case 'location': return { wch: 15 }
        case 'min_order_quantity': return { wch: 18 }
        case 'reorder_point': return { wch: 15 }
        default: return { wch: 15 }
      }
    })
    worksheet['!cols'] = colWidths
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Template')
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'inventory_import_template.xlsx')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-dark-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6 border-b border-dark-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-100">
                Bulk Inventory Import
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-300 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Import Mode Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Import Mode
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="importMode"
                  value="add"
                  checked={importMode === 'add'}
                  onChange={(e) => setImportMode(e.target.value as 'add' | 'update')}
                  className="mr-2"
                />
                <span className="text-gray-300">Add New Items</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="importMode"
                  value="update"
                  checked={importMode === 'update'}
                  onChange={(e) => setImportMode(e.target.value as 'add' | 'update')}
                  className="mr-2"
                />
                <span className="text-gray-300">Update Existing Items</span>
              </label>
            </div>
          </div>

          {/* Template Download */}
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-100">Download Template</h3>
                <p className="text-sm text-gray-400">
                  Get a CSV template with sample data and required columns
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download Template</span>
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Select File
            </label>
            <div className="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-8 w-8 text-green-400 mx-auto" />
                  <p className="text-gray-300">{file.name}</p>
                  <p className="text-sm text-gray-400">
                    {parsedData.length} rows parsed
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-gray-300">Click to select a CSV or Excel file</p>
                  <p className="text-sm text-gray-400">
                    Supports .csv, .xlsx, and .xls files
                  </p>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-dark-600 text-gray-300 rounded-lg hover:bg-dark-500 transition-colors"
              >
                {file ? 'Change File' : 'Select File'}
              </button>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <h3 className="font-medium text-red-400">Validation Errors</h3>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-sm text-red-300">
                    Row {error.row}, {error.field}: {error.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <h3 className="font-medium text-gray-100">Import Results</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  Successfully imported: <span className="text-green-400 font-medium">{importResults.success}</span>
                </p>
                <p className="text-sm text-gray-300">
                  Failed: <span className="text-red-400 font-medium">{importResults.failed}</span>
                </p>
                {importResults.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-300 mb-2">Errors:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {importResults.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-300">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-dark-600">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={processImport}
              disabled={!file || parsedData.length === 0 || validationErrors.length > 0 || isProcessing}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {isProcessing ? 'Processing...' : `${importMode === 'add' ? 'Import' : 'Update'} Items`}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
