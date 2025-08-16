import React, { useState, useEffect } from 'react'
import { CalendarDays, DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, Download } from 'lucide-react'
import { useFinancialReporting } from '../../hooks/useFinancialReporting'
import type { FinancialReport } from '../../hooks/useFinancialReporting'

export function FinancialDashboard() {
  const { generateFinancialReport, getCurrentMonthSummary, loading } = useFinancialReporting()
  const [currentReport, setCurrentReport] = useState<FinancialReport | null>(null)
  const [customReport, setCustomReport] = useState<FinancialReport | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  // Load current month summary on component mount
  useEffect(() => {
    const loadCurrentMonth = async () => {
      const report = await getCurrentMonthSummary()
      setCurrentReport(report)
    }
    loadCurrentMonth()
  }, [getCurrentMonthSummary])

  // Generate custom report
  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }

    setReportLoading(true)
    try {
      const report = await generateFinancialReport(startDate, endDate)
      setCustomReport(report)
    } finally {
      setReportLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-ZA')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-lg">Loading financial data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Track revenue, expenses, and business performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {reportLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Month Overview */}
      {currentReport && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Current Month Overview</h2>
            <span className="text-sm text-gray-500">
              ({formatDate(currentReport.period.start_date)} - {formatDate(currentReport.period.end_date)})
            </span>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(currentReport.revenue.total_revenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {currentReport.revenue.order_count} orders
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(currentReport.expenses.total_expenses)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {currentReport.expenses.expense_count} expenses
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${
                    currentReport.profit_loss.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(currentReport.profit_loss.net_profit)}
                  </p>
                </div>
                {currentReport.profit_loss.net_profit >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {currentReport.profit_loss.profit_margin.toFixed(1)}% margin
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cash Flow</p>
                  <p className={`text-2xl font-bold ${
                    currentReport.cash_flow.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(currentReport.cash_flow.net_cash_flow)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formatCurrency(currentReport.cash_flow.outstanding_receivables)} outstanding
              </p>
            </div>
          </div>

          {/* Revenue vs Expenses Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Revenue:</span>
                  <span className="font-medium">{formatCurrency(currentReport.revenue.gross_revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Collected:</span>
                  <span className="font-medium">{formatCurrency(currentReport.revenue.tax_collected)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total Revenue:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(currentReport.revenue.total_revenue)}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid:</span>
                    <span className="text-green-600">{formatCurrency(currentReport.revenue.paid_revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending:</span>
                    <span className="text-orange-600">{formatCurrency(currentReport.revenue.pending_revenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown</h3>
              <div className="space-y-2">
                {currentReport.expenses.by_category.map((category, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">{category.category_name}:</span>
                    <div className="text-right">
                      <span className="text-sm font-medium">{formatCurrency(category.total_amount)}</span>
                      <span className="text-xs text-gray-500 ml-2">({category.expense_count} items)</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 mt-3">
                  <span className="font-semibold">Total Expenses:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(currentReport.expenses.total_expenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Report Results */}
      {customReport && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Custom Report</h2>
              <p className="text-sm text-gray-600">
                {formatDate(customReport.period.start_date)} - {formatDate(customReport.period.end_date)}
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>

          {/* Custom Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(customReport.revenue.total_revenue)}
              </p>
              <p className="text-sm text-green-800">Total Revenue</p>
              <p className="text-xs text-gray-600">{customReport.revenue.order_count} orders</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(customReport.expenses.total_expenses)}
              </p>
              <p className="text-sm text-red-800">Total Expenses</p>
              <p className="text-xs text-gray-600">{customReport.expenses.expense_count} expenses</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className={`text-2xl font-bold ${
                customReport.profit_loss.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(customReport.profit_loss.net_profit)}
              </p>
              <p className="text-sm text-blue-800">Net Profit</p>
              <p className="text-xs text-gray-600">
                {customReport.profit_loss.profit_margin.toFixed(1)}% margin
              </p>
            </div>
          </div>

          {/* Detailed Custom Report Data */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Revenue Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Average Order Value:</span>
                  <span>{formatCurrency(customReport.revenue.average_order_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Revenue:</span>
                  <span className="text-green-600">{formatCurrency(customReport.revenue.paid_revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Revenue:</span>
                  <span className="text-orange-600">{formatCurrency(customReport.revenue.pending_revenue)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Cash Flow</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cash In:</span>
                  <span className="text-green-600">{formatCurrency(customReport.cash_flow.cash_in)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Out:</span>
                  <span className="text-red-600">{formatCurrency(customReport.cash_flow.cash_out)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Net Cash Flow:</span>
                  <span className={
                    customReport.cash_flow.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
                  }>
                    {formatCurrency(customReport.cash_flow.net_cash_flow)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Financial Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <PieChart className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium">View Detailed Reports</div>
              <div className="text-sm text-gray-600">Access comprehensive financial analytics</div>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <div className="font-medium">Add Income</div>
              <div className="text-sm text-gray-600">Record additional revenue or income</div>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <div className="text-left">
              <div className="font-medium">Add Expense</div>
              <div className="text-sm text-gray-600">Record business expenses and costs</div>
            </div>
          </button>
        </div>
      </div>

      {/* No Data State */}
      {!currentReport && !customReport && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <PieChart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Financial Data</h3>
          <p className="mt-2 text-gray-600">
            Start by creating orders and recording expenses to see your financial overview.
          </p>
        </div>
      )}
    </div>
  )
}
