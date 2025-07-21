import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useBusiness } from '../../hooks/useBusiness'
import { useInventory } from '../../hooks/useInventory'

interface InventoryRow {
  name: string
  current_quantity: number
  cost_per_unit: number
  low_stock_alert: number
  unit: string
  batch_lot_number?: string
  expiration_date?: string
  description?: string
  supplier?: string
  location?: string
  min_order_quantity?: number
  reorder_point?: number
  image_url?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

export function BulkInventoryImport({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const { business } = useBusiness()
  const { addInventoryItem, updateInventoryItem } = useInventory()
  
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<InventoryRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importMode, setImportMode] = useState<'add' | 'update'>('add')
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
      const text = await file.text()
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))
      
      if (rows.length < 2) {
        throw new Error('File must contain at least a header row and one data row')
      }

      const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'))
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim()))

      const requiredFields = ['name', 'current_quantity', 'cost_per_unit', 'unit']
      const missingFields = requiredFields.filter(field => !headers.includes(field))
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required columns: ${missingFields.join(', ')}`)
      }

      const parsed: InventoryRow[] = []
      const errors: ValidationError[] = []

      dataRows.forEach((row, index) => {
        const rowData: any = {}
        
        headers.forEach((header, colIndex) => {
          const value = row[colIndex] || ''
          
          switch (header) {
            case 'name':
            case 'unit':
            case 'batch_lot_number':
            case 'description':
            case 'supplier':
            case 'location':
            case 'image_url':
              rowData[header] = value
              break
            case 'current_quantity':
            case 'cost_per_unit':
            case 'low_stock_alert':
            case 'min_order_quantity':
            case 'reorder_point':
              const numValue = parseFloat(value.replace(',', '.'))
              if (isNaN(numValue) && requiredFields.includes(header)) {
                errors.push({
                  row: index + 2,
                  field: header,
                  message: `Invalid number: ${value}`
                })
              }
              rowData[header] = isNaN(numValue) ? 0 : numValue
              break
            case 'expiration_date':
              if (value && !isValidDate(value)) {
                errors.push({
                  row: index + 2,
                  field: header,
                  message: `Invalid date format: ${value}. Use YYYY-MM-DD`
                })
              }
              rowData[header] = value || null
              break
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

  const handleImport = async () => {
    if (!user || !business || parsedData.length === 0) return
    
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before importing')
      return
    }

    setIsProcessing(true)
    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const item of parsedData) {
      try {
        const itemData = {
          ...item,
          business_id: business.id,
          user_id: user.id
        }

        const { error } = importMode === 'add' 
          ? await addInventoryItem(itemData)
          : await updateInventoryItem(item.name, itemData) // Assuming update by name

        if (error) {
          results.failed++
          results.errors.push(`Row ${parsedData.indexOf(item) + 2}: ${error}`)
        } else {
          results.success++
        }
      } catch (error) {
        results.failed++
        results.errors.push(`Row ${parsedData.indexOf(item) + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    setImportResults(results)
    setIsProcessing(false)
  }

  const downloadTemplate = () => {
    const headers = [
      'name',
      'current_quantity',
      'cost_per_unit',
      'low_stock_alert',
      'unit',
      'batch_lot_number',
      'expiration_date',
      'description',
      'supplier',
      'location',
      'min_order_quantity',
      'reorder_point',
      'image_url'
    ]

    const sampleData = [
      'Sample Item,100,5.50,10,pieces,BATCH001,2024-12-31,Sample description,Sample Supplier,Warehouse A,50,20,https://example.com/image.jpg'
    ]

    const csvContent = [headers.join(','), ...sampleData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory_template.csv'
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
              onClick={handleImport}
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
