import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Share,
} from 'react-native';
import {
  Calendar,
  Download,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Filter,
  RefreshCw,
  Mail,
  Printer,
  Share as ShareIcon,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import * as Haptics from 'expo-haptics';

interface ReportData {
  sales_summary: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    growth_rate: number;
  };
  top_products: Array<{
    name: string;
    quantity_sold: number;
    revenue: number;
    profit_margin: number;
  }>;
  customer_insights: {
    new_customers: number;
    returning_customers: number;
    customer_retention_rate: number;
    average_customer_value: number;
  };
  inventory_analysis: {
    low_stock_items: number;
    out_of_stock_items: number;
    inventory_turnover: number;
    total_inventory_value: number;
  };
  financial_metrics: {
    gross_profit: number;
    net_profit: number;
    profit_margin: number;
    expenses: number;
  };
}

interface DateRange {
  start: string;
  end: string;
  label: string;
}

interface ReportConfig {
  type: 'sales' | 'inventory' | 'customers' | 'financial' | 'comprehensive';
  dateRange: DateRange;
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeDetails: boolean;
}

export default function AdvancedReporting() {
  const { business } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReportConfig, setShowReportConfig] = useState(false);
  
  // Report configuration
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'comprehensive',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 30 Days'
    },
    format: 'excel',
    includeCharts: true,
    includeDetails: true,
  });

  // Date ranges
  const predefinedRanges: DateRange[] = [
    {
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Today'
    },
    {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 7 Days'
    },
    {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 30 Days'
    },
    {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 90 Days'
    },
    {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Year to Date'
    },
  ];

  useEffect(() => {
    loadReportData();
  }, [business, reportConfig.dateRange]);

  const loadReportData = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      
      const [salesData, productsData, customersData, inventoryData, financialData] = await Promise.all([
        loadSalesData(),
        loadTopProducts(),
        loadCustomerInsights(),
        loadInventoryAnalysis(),
        loadFinancialMetrics(),
      ]);

      setReportData({
        sales_summary: salesData,
        top_products: productsData,
        customer_insights: customersData,
        inventory_analysis: inventoryData,
        financial_metrics: financialData,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesData = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          WITH current_period AS (
            SELECT 
              COALESCE(SUM(total_amount), 0) as total_revenue,
              COUNT(*) as total_orders,
              COALESCE(AVG(total_amount), 0) as average_order_value
            FROM orders
            WHERE business_id = $1 
              AND order_date >= $2::date 
              AND order_date <= $3::date
              AND status != 'cancelled'
          ),
          previous_period AS (
            SELECT 
              COALESCE(SUM(total_amount), 0) as prev_revenue
            FROM orders
            WHERE business_id = $1 
              AND order_date >= ($2::date - ($3::date - $2::date))
              AND order_date < $2::date
              AND status != 'cancelled'
          )
          SELECT 
            cp.*,
            CASE 
              WHEN pp.prev_revenue > 0 
              THEN ((cp.total_revenue - pp.prev_revenue) / pp.prev_revenue * 100)
              ELSE 0 
            END as growth_rate
          FROM current_period cp, previous_period pp
        `,
        params: [business?.id, reportConfig.dateRange.start, reportConfig.dateRange.end]
      });

      if (result.success && result.data?.[0]) {
        return result.data[0];
      }
      
      return {
        total_revenue: 0,
        total_orders: 0,
        average_order_value: 0,
        growth_rate: 0,
      };
    } catch (error) {
      console.error('Error loading sales data:', error);
      return {
        total_revenue: 0,
        total_orders: 0,
        average_order_value: 0,
        growth_rate: 0,
      };
    }
  };

  const loadTopProducts = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            p.name,
            SUM(oi.quantity) as quantity_sold,
            SUM(oi.total_price) as revenue,
            COALESCE(p.profit_margin, 0) as profit_margin
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE o.business_id = $1 
            AND o.order_date >= $2::date 
            AND o.order_date <= $3::date
            AND o.status != 'cancelled'
          GROUP BY p.id, p.name, p.profit_margin
          ORDER BY revenue DESC
          LIMIT 10
        `,
        params: [business?.id, reportConfig.dateRange.start, reportConfig.dateRange.end]
      });

      return result.success ? (result.data || []) : [];
    } catch (error) {
      console.error('Error loading top products:', error);
      return [];
    }
  };

  const loadCustomerInsights = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          WITH period_customers AS (
            SELECT DISTINCT customer_id
            FROM orders
            WHERE business_id = $1 
              AND order_date >= $2::date 
              AND order_date <= $3::date
              AND status != 'cancelled'
          ),
          new_customers AS (
            SELECT COUNT(DISTINCT c.id) as count
            FROM customers c
            WHERE c.business_id = $1
              AND c.customer_since >= $2::date
              AND c.customer_since <= $3::date
          ),
          returning_customers AS (
            SELECT COUNT(DISTINCT o.customer_id) as count
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.business_id = $1
              AND o.order_date >= $2::date
              AND o.order_date <= $3::date
              AND c.customer_since < $2::date
              AND o.status != 'cancelled'
          )
          SELECT 
            nc.count as new_customers,
            rc.count as returning_customers,
            CASE 
              WHEN (nc.count + rc.count) > 0 
              THEN (rc.count::float / (nc.count + rc.count) * 100)
              ELSE 0 
            END as customer_retention_rate,
            COALESCE(AVG(o.total_amount), 0) as average_customer_value
          FROM new_customers nc, returning_customers rc, orders o
          WHERE o.business_id = $1
            AND o.order_date >= $2::date
            AND o.order_date <= $3::date
            AND o.status != 'cancelled'
        `,
        params: [business?.id, reportConfig.dateRange.start, reportConfig.dateRange.end]
      });

      if (result.success && result.data?.[0]) {
        return result.data[0];
      }
      
      return {
        new_customers: 0,
        returning_customers: 0,
        customer_retention_rate: 0,
        average_customer_value: 0,
      };
    } catch (error) {
      console.error('Error loading customer insights:', error);
      return {
        new_customers: 0,
        returning_customers: 0,
        customer_retention_rate: 0,
        average_customer_value: 0,
      };
    }
  };

  const loadInventoryAnalysis = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            COUNT(CASE 
              WHEN current_quantity <= COALESCE(low_stock_alert, 0) 
                AND current_quantity > 0 
              THEN 1 
            END) as low_stock_items,
            COUNT(CASE WHEN current_quantity = 0 THEN 1 END) as out_of_stock_items,
            COALESCE(SUM(current_quantity * cost_per_unit), 0) as total_inventory_value
          FROM inventory
          WHERE business_id = $1
        `,
        params: [business?.id]
      });

      if (result.success && result.data?.[0]) {
        return {
          ...result.data[0],
          inventory_turnover: 4.5, // Mock calculation - would need more complex query
        };
      }
      
      return {
        low_stock_items: 0,
        out_of_stock_items: 0,
        inventory_turnover: 0,
        total_inventory_value: 0,
      };
    } catch (error) {
      console.error('Error loading inventory analysis:', error);
      return {
        low_stock_items: 0,
        out_of_stock_items: 0,
        inventory_turnover: 0,
        total_inventory_value: 0,
      };
    }
  };

  const loadFinancialMetrics = async () => {
    try {
      // Mock financial data - in real app would come from expenses and detailed calculations
      const revenue = reportData?.sales_summary?.total_revenue || 0;
      const grossProfit = revenue * 0.6; // 60% gross margin
      const expenses = revenue * 0.3; // 30% expenses
      const netProfit = grossProfit - expenses;
      
      return {
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin: revenue > 0 ? (netProfit / revenue * 100) : 0,
        expenses: expenses,
      };
    } catch (error) {
      console.error('Error loading financial metrics:', error);
      return {
        gross_profit: 0,
        net_profit: 0,
        profit_margin: 0,
        expenses: 0,
      };
    }
  };

  const generateReport = async () => {
    if (!reportData) {
      Alert.alert('Error', 'No data available to generate report');
      return;
    }

    try {
      setLoading(true);
      
      switch (reportConfig.format) {
        case 'excel':
          await generateExcelReport();
          break;
        case 'csv':
          await generateCSVReport();
          break;
        case 'pdf':
          Alert.alert('Coming Soon', 'PDF reports will be available in the next update');
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateExcelReport = async () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Business Report', ''],
        ['Report Period', `${reportConfig.dateRange.start} to ${reportConfig.dateRange.end}`],
        ['Generated On', new Date().toLocaleDateString()],
        ['', ''],
        ['SALES SUMMARY', ''],
        ['Total Revenue', formatCurrency(reportData!.sales_summary.total_revenue)],
        ['Total Orders', reportData!.sales_summary.total_orders],
        ['Average Order Value', formatCurrency(reportData!.sales_summary.average_order_value)],
        ['Growth Rate', `${reportData!.sales_summary.growth_rate.toFixed(1)}%`],
        ['', ''],
        ['CUSTOMER INSIGHTS', ''],
        ['New Customers', reportData!.customer_insights.new_customers],
        ['Returning Customers', reportData!.customer_insights.returning_customers],
        ['Retention Rate', `${reportData!.customer_insights.customer_retention_rate.toFixed(1)}%`],
        ['Average Customer Value', formatCurrency(reportData!.customer_insights.average_customer_value)],
        ['', ''],
        ['INVENTORY ANALYSIS', ''],
        ['Low Stock Items', reportData!.inventory_analysis.low_stock_items],
        ['Out of Stock Items', reportData!.inventory_analysis.out_of_stock_items],
        ['Total Inventory Value', formatCurrency(reportData!.inventory_analysis.total_inventory_value)],
        ['Inventory Turnover', reportData!.inventory_analysis.inventory_turnover.toFixed(1)],
        ['', ''],
        ['FINANCIAL METRICS', ''],
        ['Gross Profit', formatCurrency(reportData!.financial_metrics.gross_profit)],
        ['Net Profit', formatCurrency(reportData!.financial_metrics.net_profit)],
        ['Profit Margin', `${reportData!.financial_metrics.profit_margin.toFixed(1)}%`],
        ['Total Expenses', formatCurrency(reportData!.financial_metrics.expenses)],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Top Products sheet
      if (reportData!.top_products.length > 0) {
        const productsData = [
          ['Product Name', 'Quantity Sold', 'Revenue', 'Profit Margin'],
          ...reportData!.top_products.map(p => [
            p.name,
            p.quantity_sold,
            p.revenue,
            `${p.profit_margin}%`
          ])
        ];
        const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
        XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Products');
      }

      // Generate and save file
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const fileName = `business_report_${reportConfig.dateRange.start}_${reportConfig.dateRange.end}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(fileUri);
      } else {
        await Share.share({
          url: fileUri,
          title: 'Business Report',
        });
      }

      if (Platform.OS !== 'web' && (Haptics as any)?.notificationAsync) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
      Alert.alert('Success', `Report exported as ${fileName}`);
    } catch (error) {
      console.error('Error generating Excel report:', error);
      throw error;
    }
  };

  const generateCSVReport = async () => {
    try {
      const csvData = [
        ['Business Report Summary'],
        ['Report Period', `${reportConfig.dateRange.start} to ${reportConfig.dateRange.end}`],
        ['Generated On', new Date().toLocaleDateString()],
        [''],
        ['Metric', 'Value'],
        ['Total Revenue', formatCurrency(reportData!.sales_summary.total_revenue)],
        ['Total Orders', reportData!.sales_summary.total_orders],
        ['Average Order Value', formatCurrency(reportData!.sales_summary.average_order_value)],
        ['Growth Rate', `${reportData!.sales_summary.growth_rate.toFixed(1)}%`],
        ['New Customers', reportData!.customer_insights.new_customers],
        ['Returning Customers', reportData!.customer_insights.returning_customers],
        ['Customer Retention Rate', `${reportData!.customer_insights.customer_retention_rate.toFixed(1)}%`],
        ['Low Stock Items', reportData!.inventory_analysis.low_stock_items],
        ['Out of Stock Items', reportData!.inventory_analysis.out_of_stock_items],
        ['Gross Profit', formatCurrency(reportData!.financial_metrics.gross_profit)],
        ['Net Profit', formatCurrency(reportData!.financial_metrics.net_profit)],
        ['Profit Margin', `${reportData!.financial_metrics.profit_margin.toFixed(1)}%`],
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const fileName = `business_report_${reportConfig.dateRange.start}_${reportConfig.dateRange.end}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(fileUri);
      } else {
        await Share.share({
          url: fileUri,
          title: 'Business Report',
        });
      }

      if (Platform.OS !== 'web' && (Haptics as any)?.notificationAsync) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
      Alert.alert('Success', `Report exported as ${fileName}`);
    } catch (error) {
      console.error('Error generating CSV report:', error);
      throw error;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const renderDateRangePicker = () => (
    <Modal
      visible={showDatePicker}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Date Range</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
            <Text style={styles.modalSaveButton}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionTitle}>Predefined Ranges</Text>
          {predefinedRanges.map((range, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateRangeOption,
                reportConfig.dateRange.label === range.label && styles.selectedDateRange
              ]}
              onPress={() => {
                setReportConfig(prev => ({ ...prev, dateRange: range }));
                if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                }
              }}
            >
              <Text style={[
                styles.dateRangeText,
                reportConfig.dateRange.label === range.label && styles.selectedDateRangeText
              ]}>
                {range.label}
              </Text>
              <Text style={styles.dateRangeSubtext}>
                {range.start} to {range.end}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Custom Range</Text>
          <View style={styles.customDateRange}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Input
                value={reportConfig.dateRange.start}
                onChangeText={(value) => {
                  setReportConfig(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      start: value,
                      label: 'Custom Range'
                    }
                  }));
                }}
                placeholder="YYYY-MM-DD"
                style={styles.dateInput}
              />
            </View>
            
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>End Date</Text>
              <Input
                value={reportConfig.dateRange.end}
                onChangeText={(value) => {
                  setReportConfig(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      end: value,
                      label: 'Custom Range'
                    }
                  }));
                }}
                placeholder="YYYY-MM-DD"
                style={styles.dateInput}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderReportConfigModal = () => (
    <Modal
      visible={showReportConfig}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowReportConfig(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowReportConfig(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Report Configuration</Text>
          <TouchableOpacity 
            onPress={() => {
              setShowReportConfig(false);
              generateReport();
            }}
          >
            <Text style={styles.modalSaveButton}>Generate</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionTitle}>Report Type</Text>
          <View style={styles.reportTypeOptions}>
            {[
              { key: 'comprehensive', label: 'Comprehensive Report', icon: FileText },
              { key: 'sales', label: 'Sales Report', icon: TrendingUp },
              { key: 'inventory', label: 'Inventory Report', icon: Package },
              { key: 'customers', label: 'Customer Report', icon: Users },
              { key: 'financial', label: 'Financial Report', icon: DollarSign },
            ].map(({ key, label, icon: Icon }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.reportTypeOption,
                  reportConfig.type === key && styles.selectedReportType
                ]}
                onPress={() => {
                  setReportConfig(prev => ({ ...prev, type: key as any }));
                  if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  }
                }}
              >
                <Icon size={20} color={reportConfig.type === key ? '#a78bfa' : '#9ca3af'} />
                <Text style={[
                  styles.reportTypeText,
                  reportConfig.type === key && styles.selectedReportTypeText
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatOptions}>
            {[
              { key: 'excel', label: 'Excel (.xlsx)', icon: FileText },
              { key: 'csv', label: 'CSV (.csv)', icon: FileText },
              { key: 'pdf', label: 'PDF (Coming Soon)', icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.formatOption,
                  reportConfig.format === key && styles.selectedFormat,
                  key === 'pdf' && styles.disabledOption
                ]}
                onPress={() => {
                  if (key !== 'pdf') {
                    setReportConfig(prev => ({ ...prev, format: key as any }));
                    if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                    }
                  }
                }}
                disabled={key === 'pdf'}
              >
                <Icon size={16} color={
                  key === 'pdf' ? '#6b7280' :
                  reportConfig.format === key ? '#a78bfa' : '#9ca3af'
                } />
                <Text style={[
                  styles.formatText,
                  reportConfig.format === key && styles.selectedFormatText,
                  key === 'pdf' && styles.disabledText
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (!reportData) {
    return (
      <View style={styles.loadingContainer}>
        <RefreshCw size={48} color="#a78bfa" />
        <Text style={styles.loadingText}>Loading report data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Controls */}
      <Card style={styles.controlsCard}>
        <View style={styles.controlsHeader}>
          <Text style={styles.sectionTitle}>Advanced Reporting</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadReportData}
          >
            <RefreshCw size={20} color="#a78bfa" />
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={16} color="#a78bfa" />
            <Text style={styles.controlButtonText}>
              {reportConfig.dateRange.label}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowReportConfig(true)}
          >
            <Download size={16} color="#a78bfa" />
            <Text style={styles.controlButtonText}>Export Report</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sales Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Sales Summary</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <DollarSign size={24} color="#22c55e" />
              <Text style={styles.metricValue}>
                {formatCurrency(reportData.sales_summary.total_revenue)}
              </Text>
              <Text style={styles.metricLabel}>Total Revenue</Text>
              <View style={styles.growthIndicator}>
                {reportData.sales_summary.growth_rate >= 0 ? (
                  <TrendingUp size={12} color="#22c55e" />
                ) : (
                  <TrendingDown size={12} color="#ef4444" />
                )}
                <Text style={[
                  styles.growthText,
                  { color: reportData.sales_summary.growth_rate >= 0 ? '#22c55e' : '#ef4444' }
                ]}>
                  {formatPercentage(Math.abs(reportData.sales_summary.growth_rate))}
                </Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <ShoppingCart size={24} color="#3b82f6" />
              <Text style={styles.metricValue}>{reportData.sales_summary.total_orders}</Text>
              <Text style={styles.metricLabel}>Total Orders</Text>
            </View>

            <View style={styles.metricItem}>
              <BarChart3 size={24} color="#f59e0b" />
              <Text style={styles.metricValue}>
                {formatCurrency(reportData.sales_summary.average_order_value)}
              </Text>
              <Text style={styles.metricLabel}>Avg Order Value</Text>
            </View>
          </View>
        </Card>

        {/* Top Products */}
        <Card style={styles.productsCard}>
          <Text style={styles.sectionTitle}>Top Performing Products</Text>
          {reportData.top_products.slice(0, 5).map((product, index) => (
            <View key={index} style={styles.productItem}>
              <View style={styles.productRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productQuantity}>
                  {product.quantity_sold} units sold
                </Text>
              </View>
              <View style={styles.productMetrics}>
                <Text style={styles.productRevenue}>
                  {formatCurrency(product.revenue)}
                </Text>
                <Text style={styles.productMargin}>
                  {formatPercentage(product.profit_margin)} margin
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Customer Insights */}
        <Card style={styles.insightsCard}>
          <Text style={styles.sectionTitle}>Customer Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <Users size={20} color="#a78bfa" />
              <Text style={styles.insightValue}>{reportData.customer_insights.new_customers}</Text>
              <Text style={styles.insightLabel}>New Customers</Text>
            </View>
            
            <View style={styles.insightItem}>
              <TrendingUp size={20} color="#22c55e" />
              <Text style={styles.insightValue}>{reportData.customer_insights.returning_customers}</Text>
              <Text style={styles.insightLabel}>Returning</Text>
            </View>
            
            <View style={styles.insightItem}>
              <Target size={20} color="#3b82f6" />
              <Text style={styles.insightValue}>
                {formatPercentage(reportData.customer_insights.customer_retention_rate)}
              </Text>
              <Text style={styles.insightLabel}>Retention Rate</Text>
            </View>
          </View>
        </Card>

        {/* Financial Metrics */}
        <Card style={styles.financialCard}>
          <Text style={styles.sectionTitle}>Financial Performance</Text>
          <View style={styles.financialMetrics}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Gross Profit</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(reportData.financial_metrics.gross_profit)}
              </Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Net Profit</Text>
              <Text style={[
                styles.financialValue,
                { color: reportData.financial_metrics.net_profit >= 0 ? '#22c55e' : '#ef4444' }
              ]}>
                {formatCurrency(reportData.financial_metrics.net_profit)}
              </Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Profit Margin</Text>
              <Text style={styles.financialValue}>
                {formatPercentage(reportData.financial_metrics.profit_margin)}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Modals */}
      {renderDateRangePicker()}
      {renderReportConfigModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  controlsCard: {
    marginVertical: 16,
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  refreshButton: {
    padding: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    gap: 8,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 8,
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  productsCard: {
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 12,
    color: '#9ca3af',
  },
  productMetrics: {
    alignItems: 'flex-end',
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 2,
  },
  productMargin: {
    fontSize: 12,
    color: '#9ca3af',
  },
  insightsCard: {
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  financialCard: {
    marginBottom: 16,
  },
  financialMetrics: {
    gap: 12,
  },
  financialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  financialLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#9ca3af',
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  dateRangeOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDateRange: {
    borderColor: '#a78bfa',
    backgroundColor: '#a78bfa20',
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  selectedDateRangeText: {
    color: '#a78bfa',
  },
  dateRangeSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  customDateRange: {
    gap: 16,
  },
  dateInputContainer: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
  },
  dateInput: {
    marginBottom: 0,
  },
  reportTypeOptions: {
    gap: 8,
    marginBottom: 24,
  },
  reportTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedReportType: {
    borderColor: '#a78bfa',
    backgroundColor: '#a78bfa20',
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 12,
  },
  selectedReportTypeText: {
    color: '#a78bfa',
  },
  formatOptions: {
    gap: 8,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFormat: {
    borderColor: '#a78bfa',
    backgroundColor: '#a78bfa20',
  },
  disabledOption: {
    backgroundColor: '#374151',
  },
  formatText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 8,
  },
  selectedFormatText: {
    color: '#a78bfa',
  },
  disabledText: {
    color: '#6b7280',
  },
}); 