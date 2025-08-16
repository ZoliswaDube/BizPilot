import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  Platform,
  Share,
} from 'react-native';
import {
  X,
  Upload,
  Download,
  Edit3,
  Trash2,
  Save,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Package,
  Filter,
  Search,
  RefreshCw,
  PlusCircle,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as XLSX from 'xlsx';

// Database schema mapping for inventory table
interface InventoryItem {
  id: string;
  user_id?: string;
  name: string;
  current_quantity: number;
  unit: string;
  low_stock_alert?: number;
  cost_per_unit: number;
  updated_at?: string;
  product_id?: string;
  batch_lot_number?: string;
  expiration_date?: string;
  business_id?: string;
  description?: string;
  supplier?: string;
  location?: string;
  min_order_quantity?: number;
  reorder_point?: number;
  image_url?: string;
}

interface BulkEditData {
  selectedItems: string[];
  field: keyof InventoryItem;
  value: string | number;
}

interface ImportResult {
  success: number;
  errors: string[];
  warnings: string[];
  imported: InventoryItem[];
}

interface BulkInventoryOperationsProps {
  visible: boolean;
  onClose: () => void;
  onInventoryUpdated: () => void;
}

export default function BulkInventoryOperations({
  visible,
  onClose,
  onInventoryUpdated,
}: BulkInventoryOperationsProps) {
  const { user, business } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'bulk_edit' | 'manage'>('import');
  const [loading, setLoading] = useState(false);
  
  // Import/Export
  const [importData, setImportData] = useState<InventoryItem[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  
  // Bulk Edit
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkEditField, setBulkEditField] = useState<keyof InventoryItem>('cost_per_unit');
  const [bulkEditValue, setBulkEditValue] = useState('');
  
  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  
  // CSV/Excel column mapping to match database schema exactly
  const COLUMN_MAPPING = {
    'Name': 'name',
    'Current Quantity': 'current_quantity',
    'Unit': 'unit',
    'Cost Per Unit': 'cost_per_unit',
    'Low Stock Alert': 'low_stock_alert',
    'Batch/Lot Number': 'batch_lot_number',
    'Expiration Date': 'expiration_date',
    'Description': 'description',
    'Supplier': 'supplier',
    'Location': 'location',
    'Min Order Quantity': 'min_order_quantity',
    'Reorder Point': 'reorder_point',
    'Image URL': 'image_url'
  };

  useEffect(() => {
    if (visible) {
      loadInventoryItems();
    }
  }, [visible]);

  const loadInventoryItems = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            id, user_id, name, current_quantity, unit, low_stock_alert,
            cost_per_unit, updated_at, product_id, batch_lot_number,
            expiration_date, business_id, description, supplier,
            location, min_order_quantity, reorder_point, image_url
          FROM inventory 
          WHERE business_id = $1
          ORDER BY name ASC
        `,
        params: [business.id]
      });

      if (result.success) {
        setInventoryItems(result.data || []);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  // Excel/CSV Import Functions
  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;
        
        if (fileName?.endsWith('.csv')) {
          const fileContent = await FileSystem.readAsStringAsync(fileUri);
          await parseCSV(fileContent);
        } else if (fileName?.endsWith('.xlsx') || fileName?.endsWith('.xls')) {
          await parseExcel(fileUri);
        } else {
          Alert.alert('Unsupported Format', 'Please select a CSV or Excel (.xlsx) file.');
        }
      }
    } catch (error) {
      console.error('Error importing file:', error);
      Alert.alert('Error', 'Failed to import file. Please check the format and try again.');
    }
  };

  const parseExcel = async (fileUri: string) => {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const workbook = XLSX.read(fileContent, { type: 'base64' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        Alert.alert('Error', 'Excel file must have at least a header row and one data row');
        return;
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];

      await processImportData(headers, dataRows);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      Alert.alert('Error', 'Failed to parse Excel file. Please check the format.');
    }
  };

  const parseCSV = async (csvContent: string) => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        Alert.alert('Error', 'CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      await processImportData(headers, dataRows);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      Alert.alert('Error', 'Failed to parse CSV file. Please check the format.');
    }
  };

  const processImportData = async (headers: string[], dataRows: any[][]) => {
    const importedItems: InventoryItem[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowIndex = i + 2; // +2 because we start from line 2 (after header)

      try {
        const item: Partial<InventoryItem> = {
          id: '', // Will be generated
          business_id: business?.id,
          user_id: user?.id,
        };

        // Map columns to database fields
        headers.forEach((header, index) => {
          const fieldName = COLUMN_MAPPING[header as keyof typeof COLUMN_MAPPING];
          if (fieldName && row[index] !== undefined && row[index] !== '') {
            const value = row[index];

            // Type conversion based on database schema
            switch (fieldName) {
              case 'current_quantity':
              case 'cost_per_unit':
              case 'low_stock_alert':
              case 'min_order_quantity':
              case 'reorder_point':
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  (item as any)[fieldName] = numValue;
                } else if (fieldName === 'current_quantity' || fieldName === 'cost_per_unit') {
                  errors.push(`Row ${rowIndex}: Invalid ${header} value: ${value}`);
                  return;
                }
                break;
              case 'expiration_date':
                // Validate date format (YYYY-MM-DD)
                if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                  warnings.push(`Row ${rowIndex}: Invalid date format for ${header}: ${value}. Use YYYY-MM-DD`);
                } else {
                  (item as any)[fieldName] = value || null;
                }
                break;
              default:
                (item as any)[fieldName] = value || null;
            }
          }
        });

        // Validate required fields
        if (!item.name) {
          errors.push(`Row ${rowIndex}: Name is required`);
          continue;
        }
        if (item.current_quantity === undefined) {
          errors.push(`Row ${rowIndex}: Current Quantity is required`);
          continue;
        }
        if (!item.unit) {
          item.unit = 'unit'; // Default unit
        }
        if (item.cost_per_unit === undefined) {
          item.cost_per_unit = 0; // Default cost
        }

        importedItems.push(item as InventoryItem);
      } catch (rowError) {
        errors.push(`Row ${rowIndex}: ${rowError}`);
      }
    }

    setImportData(importedItems);
    setImportResult({
      success: importedItems.length,
      errors,
      warnings,
      imported: importedItems
    });

    if (importedItems.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const executeImport = async () => {
    if (!importData.length) return;

    try {
      setLoading(true);
      let successCount = 0;
      const errors: string[] = [];

      for (const item of importData) {
        try {
          await mcp_supabase_execute_sql({
            query: `
              INSERT INTO inventory (
                business_id, user_id, name, current_quantity, unit,
                low_stock_alert, cost_per_unit, batch_lot_number,
                expiration_date, description, supplier, location,
                min_order_quantity, reorder_point, image_url, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `,
            params: [
              business?.id,
              user?.id,
              item.name,
              item.current_quantity,
              item.unit || 'unit',
              item.low_stock_alert || null,
              item.cost_per_unit || 0,
              item.batch_lot_number || null,
              item.expiration_date || null,
              item.description || null,
              item.supplier || null,
              item.location || null,
              item.min_order_quantity || null,
              item.reorder_point || null,
              item.image_url || null,
              new Date().toISOString()
            ]
          });
          successCount++;
        } catch (error) {
          errors.push(`Failed to import "${item.name}": ${error}`);
        }
      }

      if (successCount > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Import Complete',
          `Successfully imported ${successCount} items.${errors.length > 0 ? ` ${errors.length} items failed.` : ''}`
        );
        onInventoryUpdated();
        loadInventoryItems();
        setImportData([]);
        setImportResult(null);
      } else {
        Alert.alert('Import Failed', errors.join('\n'));
      }
    } catch (error) {
      console.error('Error executing import:', error);
      Alert.alert('Error', 'Failed to import inventory items');
    } finally {
      setLoading(false);
    }
  };

  // Excel/CSV Export Functions
  const generateExportData = () => {
    const filteredItems = getFilteredItems();
    return filteredItems.map(item => {
      const exportRow: any = {};
      Object.entries(COLUMN_MAPPING).forEach(([header, field]) => {
        const value = item[field as keyof InventoryItem];
        exportRow[header] = value ?? '';
      });
      return exportRow;
    });
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      const exportData = generateExportData();
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const columnWidths = Object.keys(COLUMN_MAPPING).map(header => ({
        wch: Math.max(header.length + 2, 15)
      }));
      worksheet['!cols'] = columnWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      const fileName = `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(fileUri);
      } else {
        await Share.share({
          url: fileUri,
          title: 'Export Inventory',
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Inventory exported as ${fileName}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Alert.alert('Error', 'Failed to export inventory to Excel');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      setLoading(true);
      const filteredItems = getFilteredItems();
      
      const csvHeaders = Object.keys(COLUMN_MAPPING).join(',');
      const csvRows = filteredItems.map(item => {
        return Object.values(COLUMN_MAPPING).map(field => {
          const value = item[field as keyof InventoryItem];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',');
      });

      const csvData = [csvHeaders, ...csvRows].join('\n');
      const fileName = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvData);
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(fileUri);
      } else {
        await Share.share({
          url: fileUri,
          title: 'Export Inventory',
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Inventory exported as ${fileName}`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export inventory');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const headers = Object.keys(COLUMN_MAPPING);
      const sampleData = [{
        'Name': 'Sample Product',
        'Current Quantity': 100,
        'Unit': 'unit',
        'Cost Per Unit': 10.50,
        'Low Stock Alert': 10,
        'Batch/Lot Number': 'BATCH001',
        'Expiration Date': '2024-12-31',
        'Description': 'Sample product description',
        'Supplier': 'Sample Supplier',
        'Location': 'Warehouse A',
        'Min Order Quantity': 50,
        'Reorder Point': 25,
        'Image URL': ''
      }];

      if (exportFormat === 'xlsx') {
        // Create Excel template
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        
        // Auto-size columns and add formatting
        const columnWidths = headers.map(header => ({
          wch: Math.max(header.length + 2, 15)
        }));
        worksheet['!cols'] = columnWidths;
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Template');
        
        const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
        const fileName = 'inventory_import_template.xlsx';
        const fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(fileUri);
        } else {
          await Share.share({
            url: fileUri,
            title: 'Download Template',
          });
        }
      } else {
        // Create CSV template
        const csvHeaders = headers.join(',');
        const csvRow = Object.values(sampleData[0]).map(value => {
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',');
        
        const csvContent = [csvHeaders, csvRow].join('\n');
        const fileName = 'inventory_import_template.csv';
        const fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        
        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(fileUri);
        } else {
          await Share.share({
            url: fileUri,
            title: 'Download Template',
          });
        }
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', `Template downloaded successfully as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading template:', error);
      Alert.alert('Error', 'Failed to download template');
    }
  };

  // Bulk Edit Functions
  const getFilteredItems = () => {
    return inventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !filterLocation || item.location?.includes(filterLocation);
      const matchesSupplier = !filterSupplier || item.supplier?.includes(filterSupplier);
      const matchesLowStock = !showLowStock || 
                             (item.low_stock_alert && item.current_quantity <= item.low_stock_alert);

      return matchesSearch && matchesLocation && matchesSupplier && matchesLowStock;
    });
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    const filteredItems = getFilteredItems();
    setSelectedItems(filteredItems.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const executeBulkEdit = async () => {
    if (selectedItems.length === 0 || !bulkEditValue.trim()) {
      Alert.alert('Error', 'Please select items and enter a value');
      return;
    }

    try {
      setLoading(true);

      // Prepare the value based on field type
      let processedValue: any = bulkEditValue;
      if (['current_quantity', 'cost_per_unit', 'low_stock_alert', 'min_order_quantity', 'reorder_point'].includes(bulkEditField)) {
        processedValue = parseFloat(bulkEditValue);
        if (isNaN(processedValue)) {
          Alert.alert('Error', 'Please enter a valid number');
          return;
        }
      }

      for (const itemId of selectedItems) {
        await mcp_supabase_execute_sql({
          query: `
            UPDATE inventory 
            SET ${bulkEditField} = $1, updated_at = $2
            WHERE id = $3 AND business_id = $4
          `,
          params: [processedValue, new Date().toISOString(), itemId, business?.id]
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Updated ${selectedItems.length} items`);
      
      onInventoryUpdated();
      loadInventoryItems();
      clearSelection();
      setBulkEditValue('');
    } catch (error) {
      console.error('Error executing bulk edit:', error);
      Alert.alert('Error', 'Failed to update items');
    } finally {
      setLoading(false);
    }
  };

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              for (const itemId of selectedItems) {
                await mcp_supabase_execute_sql({
                  query: 'DELETE FROM inventory WHERE id = $1 AND business_id = $2',
                  params: [itemId, business?.id]
                });
              }

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `Deleted ${selectedItems.length} items`);
              
              onInventoryUpdated();
              loadInventoryItems();
              clearSelection();
            } catch (error) {
              console.error('Error deleting items:', error);
              Alert.alert('Error', 'Failed to delete items');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderImportTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Import from Excel/CSV</Text>
        <Text style={styles.sectionDescription}>
          Import inventory items from a CSV or Excel file. Download the template below to see the required format.
        </Text>

        <View style={styles.buttonGroup}>
          <Button
            title="Download Template"
            onPress={downloadTemplate}
            variant="secondary"
            style={styles.halfButton}
          />
          <Button
            title="Select File"
            onPress={handleImportFile}
            style={styles.halfButton}
          />
        </View>

        {importResult && (
          <Card style={styles.importResult}>
            <View style={styles.resultHeader}>
              <CheckCircle size={20} color="#22c55e" />
              <Text style={styles.resultTitle}>Import Preview</Text>
            </View>
            
            <View style={styles.resultStats}>
              <Text style={styles.successCount}>✓ {importResult.success} items ready to import</Text>
              {importResult.errors.length > 0 && (
                <Text style={styles.errorCount}>✗ {importResult.errors.length} errors</Text>
              )}
              {importResult.warnings.length > 0 && (
                <Text style={styles.warningCount}>⚠ {importResult.warnings.length} warnings</Text>
              )}
            </View>

            {importResult.errors.length > 0 && (
              <View style={styles.errorsList}>
                <Text style={styles.errorsTitle}>Errors:</Text>
                {importResult.errors.slice(0, 5).map((error, index) => (
                  <Text key={index} style={styles.errorText}>• {error}</Text>
                ))}
                {importResult.errors.length > 5 && (
                  <Text style={styles.moreErrors}>... and {importResult.errors.length - 5} more</Text>
                )}
              </View>
            )}

            {importResult.success > 0 && (
              <Button
                title={`Import ${importResult.success} Items`}
                onPress={executeImport}
                loading={loading}
                style={styles.importButton}
              />
            )}
          </Card>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>CSV Format Requirements</Text>
        <Text style={styles.formatText}>
          Required columns: Name, Current Quantity{'\n'}
          Optional columns: Unit, Cost Per Unit, Low Stock Alert, Batch/Lot Number, Expiration Date, Description, Supplier, Location, Min Order Quantity, Reorder Point, Image URL{'\n\n'}
          Date format: YYYY-MM-DD{'\n'}
          Number format: Use decimal point (.) for decimals
        </Text>
      </Card>
    </ScrollView>
  );

  const renderExportTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Export Inventory</Text>
        <Text style={styles.sectionDescription}>
          Export your inventory data to Excel or CSV format for external analysis or backup.
        </Text>

        <View style={styles.exportStats}>
          <Text style={styles.statText}>Total Items: {inventoryItems.length}</Text>
          <Text style={styles.statText}>Filtered Items: {getFilteredItems().length}</Text>
        </View>

        <View style={styles.formatSelector}>
          <Text style={styles.formatLabel}>Export Format:</Text>
          <View style={styles.formatButtons}>
            <TouchableOpacity
              style={[
                styles.formatButton,
                exportFormat === 'xlsx' && styles.activeFormatButton
              ]}
              onPress={() => setExportFormat('xlsx')}
            >
              <FileSpreadsheet size={20} color={exportFormat === 'xlsx' ? '#ffffff' : '#a78bfa'} />
              <Text style={[
                styles.formatButtonText,
                exportFormat === 'xlsx' && styles.activeFormatButtonText
              ]}>
                Excel (.xlsx)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatButton,
                exportFormat === 'csv' && styles.activeFormatButton
              ]}
              onPress={() => setExportFormat('csv')}
            >
              <FileSpreadsheet size={20} color={exportFormat === 'csv' ? '#ffffff' : '#a78bfa'} />
              <Text style={[
                styles.formatButtonText,
                exportFormat === 'csv' && styles.activeFormatButtonText
              ]}>
                CSV (.csv)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title={`Export to ${exportFormat.toUpperCase()}`}
          onPress={exportFormat === 'xlsx' ? exportToExcel : exportToCSV}
          loading={loading}
          style={styles.exportButton}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Export Filters</Text>
        
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search by name, description, or supplier"
          style={styles.filterInput}
        />

        <View style={styles.filterRow}>
          <Input
            value={filterLocation}
            onChangeText={setFilterLocation}
            placeholder="Filter by location"
            style={styles.halfInput}
          />
          <Input
            value={filterSupplier}
            onChangeText={setFilterSupplier}
            placeholder="Filter by supplier"
            style={styles.halfInput}
          />
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setShowLowStock(!showLowStock)}
        >
          <View style={[styles.checkbox, showLowStock && styles.checkedCheckbox]}>
            {showLowStock && <CheckCircle size={16} color="#ffffff" />}
          </View>
          <Text style={styles.checkboxLabel}>Only low stock items</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  const renderBulkEditTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <View style={styles.bulkEditHeader}>
          <Text style={styles.sectionTitle}>Bulk Edit</Text>
          <View style={styles.selectionControls}>
            <TouchableOpacity onPress={selectAllItems} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearSelection} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.selectionCount}>
          {selectedItems.length} items selected
        </Text>

        <View style={styles.bulkEditControls}>
          <Text style={styles.fieldLabel}>Field to edit:</Text>
          <View style={styles.fieldButtons}>
            {['cost_per_unit', 'low_stock_alert', 'supplier', 'location', 'reorder_point'].map(field => (
              <TouchableOpacity
                key={field}
                style={[
                  styles.fieldButton,
                  bulkEditField === field && styles.activeFieldButton
                ]}
                onPress={() => setBulkEditField(field as keyof InventoryItem)}
              >
                <Text style={[
                  styles.fieldButtonText,
                  bulkEditField === field && styles.activeFieldButtonText
                ]}>
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            value={bulkEditValue}
            onChangeText={setBulkEditValue}
            placeholder={`Enter new ${bulkEditField.replace(/_/g, ' ')}`}
            keyboardType={['cost_per_unit', 'low_stock_alert', 'reorder_point'].includes(bulkEditField) ? 'decimal-pad' : 'default'}
            style={styles.bulkEditInput}
          />

          <View style={styles.bulkActionButtons}>
            <Button
              title={`Update ${selectedItems.length} Items`}
              onPress={executeBulkEdit}
              loading={loading}
              disabled={selectedItems.length === 0 || !bulkEditValue.trim()}
              style={styles.bulkEditButton}
            />
            <Button
              title="Delete Selected"
              onPress={deleteSelectedItems}
              variant="danger"
              disabled={selectedItems.length === 0}
              style={styles.deleteButton}
            />
          </View>
        </View>
      </Card>

      {/* Items List */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory Items</Text>
        
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search inventory..."
          style={styles.searchInput}
        />

        <FlatList
          data={getFilteredItems()}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.inventoryItem,
                selectedItems.includes(item.id) && styles.selectedItem
              ]}
              onPress={() => toggleItemSelection(item.id)}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemQuantity}>
                  <Text style={styles.quantityText}>
                    {item.current_quantity} {item.unit}
                  </Text>
                  {item.low_stock_alert && item.current_quantity <= item.low_stock_alert && (
                    <AlertTriangle size={16} color="#ef4444" />
                  )}
                </View>
              </View>
              
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetail}>
                  Cost: ${item.cost_per_unit?.toFixed(2) || '0.00'}
                </Text>
                {item.location && (
                  <Text style={styles.itemDetail}>Location: {item.location}</Text>
                )}
                {item.supplier && (
                  <Text style={styles.itemDetail}>Supplier: {item.supplier}</Text>
                )}
              </View>
              
              {selectedItems.includes(item.id) && (
                <View style={styles.selectedIndicator}>
                  <CheckCircle size={20} color="#22c55e" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </Card>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#a78bfa" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bulk Operations</Text>
          <TouchableOpacity onPress={loadInventoryItems} style={styles.refreshButton}>
            <RefreshCw size={24} color="#a78bfa" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {[
            { key: 'import', icon: Upload, label: 'Import' },
            { key: 'export', icon: Download, label: 'Export' },
            { key: 'bulk_edit', icon: Edit3, label: 'Bulk Edit' },
          ].map(({ key, icon: Icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.activeTab]}
              onPress={() => {
                setActiveTab(key as any);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Icon size={20} color={activeTab === key ? '#a78bfa' : '#9ca3af'} />
              <Text style={[
                styles.tabText,
                activeTab === key && styles.activeTabText
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'import' && renderImportTab()}
        {activeTab === 'export' && renderExportTab()}
        {activeTab === 'bulk_edit' && renderBulkEditTab()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#1e293b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#a78bfa',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  importResult: {
    marginTop: 16,
    backgroundColor: '#1e293b',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  resultStats: {
    marginBottom: 12,
  },
  successCount: {
    fontSize: 14,
    color: '#22c55e',
    marginBottom: 4,
  },
  errorCount: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 4,
  },
  warningCount: {
    fontSize: 14,
    color: '#f59e0b',
    marginBottom: 4,
  },
  errorsList: {
    marginBottom: 16,
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#fca5a5',
    marginBottom: 2,
  },
  moreErrors: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  importButton: {
    marginTop: 8,
  },
  formatText: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  exportStats: {
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 4,
  },
  exportButton: {
    marginBottom: 16,
  },
  filterInput: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9ca3af',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  bulkEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectionControls: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  selectionButtonText: {
    fontSize: 12,
    color: '#d1d5db',
  },
  selectionCount: {
    fontSize: 14,
    color: '#a78bfa',
    marginBottom: 16,
  },
  bulkEditControls: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
  },
  fieldButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  fieldButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFieldButton: {
    backgroundColor: '#a78bfa20',
    borderColor: '#a78bfa',
  },
  fieldButtonText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activeFieldButtonText: {
    color: '#a78bfa',
  },
  bulkEditInput: {
    marginBottom: 16,
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkEditButton: {
    flex: 2,
  },
  deleteButton: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 16,
  },
  inventoryItem: {
    padding: 16,
    backgroundColor: '#1e293b',
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedItem: {
    borderColor: '#a78bfa',
    backgroundColor: '#a78bfa10',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  itemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a78bfa',
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemDetail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  formatSelector: {
    marginBottom: 20,
  },
  formatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 12,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  activeFormatButton: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a78bfa',
  },
  activeFormatButtonText: {
    color: '#ffffff',
  },
}); 