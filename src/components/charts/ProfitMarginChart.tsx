import { Bar } from 'react-chartjs-2'
import { chartTheme, defaultChartOptions } from './ChartRegistry'

interface Product {
  name: string
  profit_margin: number
  selling_price: number
  total_cost: number
}

interface ProfitMarginChartProps {
  products: Product[]
}

export function ProfitMarginChart({ products }: ProfitMarginChartProps) {
  const data = {
    labels: products.map(p => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name),
    datasets: [
      {
        label: 'Profit Margin (%)',
        data: products.map(p => p.profit_margin),
        backgroundColor: `${chartTheme.colors.primary}40`,
        borderColor: chartTheme.colors.primary,
        borderWidth: 2,
        borderRadius: 4,
      }
    ]
  }

  const options = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: 'Profit Margin by Product',
        color: chartTheme.textColor,
        font: {
          size: 16,
          family: 'Inter, sans-serif',
          weight: 600,
        }
      }
    },
    scales: {
      ...defaultChartOptions.scales,
      y: {
        ...defaultChartOptions.scales?.y,
        beginAtZero: true,
        max: Math.max(...products.map(p => p.profit_margin)) + 10,
        ticks: {
          ...defaultChartOptions.scales?.y?.ticks,
          callback: function(value: any) {
            return value + '%'
          }
        }
      }
    }
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}