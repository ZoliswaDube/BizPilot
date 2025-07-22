import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileSpreadsheet, X, Loader2, CheckCircle, FileText } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useBusiness } from '../../hooks/useBusiness'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

interface ExportOptions {
  includeImages: boolean
  includeExpired: boolean
  includeOutOfStock: boolean
  selectedFields: string[]
  format: 'csv' | 'excel'
}

import { INVENTORY_COLUMNS } from './inventoryColumns'

// Canonical list of exportable fields. Do not modify in-place; edit inventoryColumns.ts instead.
const AVAILABLE_FIELDS = INVENTORY_COLUMNS

export function BulkInventoryExport({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const { business } = useBusiness()
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeImages: true,
    includeExpired: true,
    includeOutOfStock: true,
    selectedFields: INVENTORY_COLUMNS.map(c => c.key), // include all canonical fields
    format: 'excel'
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)

  const handleFieldToggle = (fieldKey: string) => {
    const field = AVAILABLE_FIELDS.find(f => f.key === fieldKey)
    if (field?.required) return // Can't unselect required fields

    setExportOptions(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(fieldKey)
        ? prev.selectedFields.filter(f => f !== fieldKey)
        : [...prev.selectedFields, fieldKey]
    }))
  }

  const exportInventory = async () => {
    if (!user || !business) return

    setIsExporting(true)
    
    try {
      // Build query based on export options
      let query = supabase
        .from('inventory')
        .select('*')
        .eq('business_id', business.id)

      if (!exportOptions.includeOutOfStock) {
        query = query.gt('current_quantity', 0)
      }

      if (!exportOptions.includeExpired) {
        query = query.or('expiration_date.is.null,expiration_date.gte.' + new Date().toISOString().split('T')[0])
      }

      const { data: inventoryData, error } = await query

      if (error) throw error

      if (!inventoryData || inventoryData.length === 0) {
        alert('No inventory items found matching the selected criteria')
        return
      }

      // Filter data to only include selected fields
      const filteredData = inventoryData.map(item => {
        const filteredItem: any = {}
        exportOptions.selectedFields.forEach(field => {
          filteredItem[field] = item[field] || ''
        })
        return filteredItem
      })

      // Prepare headers
      const headers = exportOptions.selectedFields.map(field => 
        AVAILABLE_FIELDS.find(f => f.key === field)?.label || field
      )

      if (exportOptions.format === 'excel') {
        // Create Excel workbook
        const workbook = XLSX.utils.book_new()
        
        // Prepare data for Excel
        const excelData = [
          headers,
          ...filteredData.map(item => 
            exportOptions.selectedFields.map(field => item[field] || '')
          )
        ]
        
        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(excelData)
        
        // Set column widths
        const colWidths = headers.map(() => ({ wch: 15 }))
        worksheet['!cols'] = colWidths
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory')
        
        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        
        // Create download link
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Create CSV
        const csvRows = [
          headers.join(','),
          ...filteredData.map(item => 
            exportOptions.selectedFields.map(field => {
              const value = item[field]
              // Handle values that might contain commas or quotes
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value || ''
            }).join(',')
          )
        ]

        const csvContent = csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        
        // Create download link
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      setExportComplete(true)
      setTimeout(() => {
        setExportComplete(false)
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Export error:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-dark-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6 border-b border-dark-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Download className="h-6 w-6 text-green-400" />
              <h2 className="text-xl font-semibold text-gray-100">
                Export Inventory
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
          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-100">Export Options</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeOutOfStock}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeOutOfStock: e.target.checked
                  }))}
                  className="mr-3 rounded"
                />
                <span className="text-gray-300">Include out-of-stock items</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeExpired}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeExpired: e.target.checked
                  }))}
                  className="mr-3 rounded"
                />
                <span className="text-gray-300">Include expired items</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeImages}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeImages: e.target.checked
                  }))}
                  className="mr-3 rounded"
                />
                <span className="text-gray-300">Include image URLs</span>
              </label>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-100">Export Format</h3>
            
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={exportOptions.format === 'excel'}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    format: e.target.value as 'csv' | 'excel'
                  }))}
                  className="mr-3"
                />
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-400" />
                <span className="text-gray-300">Excel (.xlsx)</span>
                <span className="text-xs text-gray-500 ml-2">Recommended for editing</span>
              </label>
              
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportOptions.format === 'csv'}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    format: e.target.value as 'csv' | 'excel'
                  }))}
                  className="mr-3"
                />
                <FileText className="h-4 w-4 mr-2 text-blue-400" />
                <span className="text-gray-300">CSV (.csv)</span>
                <span className="text-xs text-gray-500 ml-2">Universal format</span>
              </label>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-100">Select Fields to Export</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_FIELDS.map(field => (
                <label key={field.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.selectedFields.includes(field.key)}
                    onChange={() => handleFieldToggle(field.key)}
                    disabled={field.required}
                    className="mr-3 rounded"
                  />
                  <span className={`text-sm ${field.required ? 'text-gray-400' : 'text-gray-300'}`}>
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </span>
                </label>
              ))}
            </div>
            
            <p className="text-xs text-gray-500">
              * Required fields cannot be deselected
            </p>
          </div>

          {/* Export Summary */}
          <div className="bg-dark-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-100 mb-2">Export Summary</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p>Fields to export: {exportOptions.selectedFields.length}</p>
              <p>Format: CSV</p>
              <p>Filters: {[
                !exportOptions.includeOutOfStock && 'Exclude out-of-stock',
                !exportOptions.includeExpired && 'Exclude expired',
                !exportOptions.includeImages && 'Exclude images'
              ].filter(Boolean).join(', ') || 'None'}</p>
            </div>
          </div>

          {/* Export Complete Message */}
          {exportComplete && (
            <motion.div
              className="bg-green-900/20 border border-green-500/20 rounded-lg p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">Export completed successfully!</span>
              </div>
              <p className="text-sm text-green-300 mt-1">
                Your inventory data has been downloaded as a CSV file.
              </p>
            </motion.div>
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
              onClick={exportInventory}
              disabled={isExporting || exportOptions.selectedFields.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting && <Loader2 className="h-4 w-4 animate-spin" />}
              <FileSpreadsheet className="h-4 w-4" />
              <span>
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
