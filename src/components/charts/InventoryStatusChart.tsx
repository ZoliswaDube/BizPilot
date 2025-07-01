import { Doughnut } from 'react-chartjs-2'
import { chartTheme, defaultChartOptions } from './ChartRegistry'

interface InventoryItem {
  name: string
  current_quantity: number
  low_stock_alert: number
}

interface InventoryStatusChartProps {
  inventory: InventoryItem[]
}

export function InventoryStatusChart({ inventory }: InventoryStatusChartProps) {
  const inStock = inventory.filter(item => 
    item.current_quantity > (item.low_stock_alert || 0)
  ).length
  
  const lowStock = inventory.filter(item => 
    item.current_quantity <= (item.low_stock_alert || 0) && item.current_quantity > 0
  ).length
  
  const outOfStock = inventory.filter(item => 
    item.current_quantity === 0
  ).length

  const data = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        data: [inStock, lowStock, outOfStock],
        backgroundColor: [
          `${chartTheme.colors.success}80`,
          `${chartTheme.colors.warning}80`,
          `${chartTheme.colors.danger}80`,
        ],
        borderColor: [
          chartTheme.colors.success,
          chartTheme.colors.warning,
          chartTheme.colors.danger,
        ],
        borderWidth: 2,
      }
    ]
  }

  const options = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: 'Inventory Status Overview',
        color: chartTheme.textColor,
        font: {
          size: 16,
          family: 'Inter, sans-serif',
          weight: '600' as const,
        }
      },
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed
            const total = inventory.length
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
            return `${context.label}: ${value} items (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <div className="h-80">
      <Doughnut data={data} options={options} />
    </div>
  )
}