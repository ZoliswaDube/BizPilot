import { Line } from 'react-chartjs-2'
import { chartTheme, defaultChartOptions } from './ChartRegistry'

interface Product {
  name: string
  selling_price: number
  total_cost: number
  created_at: string
}

interface ProfitTrendChartProps {
  products: Product[]
}

export function ProfitTrendChart({ products }: ProfitTrendChartProps) {
  // Sort products by creation date and calculate cumulative profit
  const sortedProducts = [...products].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  let cumulativeProfit = 0
  const trendData = sortedProducts.map(product => {
    const profit = product.selling_price - product.total_cost
    cumulativeProfit += profit
    return {
      date: new Date(product.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      profit: cumulativeProfit,
      dailyProfit: profit
    }
  })

  const data = {
    labels: trendData.map(d => d.date),
    datasets: [
      {
        label: 'Cumulative Profit Potential',
        data: trendData.map(d => d.profit),
        borderColor: chartTheme.colors.success,
        backgroundColor: `${chartTheme.colors.success}20`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartTheme.colors.success,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
      }
    ]
  }

  const options = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: 'Profit Potential Trend',
        color: chartTheme.textColor,
        font: {
          size: 16,
          family: 'Inter, sans-serif',
          weight: 600,
        }
      },
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          afterLabel: function(context: any) {
            const index = context.dataIndex
            const dailyProfit = trendData[index]?.dailyProfit || 0
            return `Daily Addition: $${dailyProfit.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      ...defaultChartOptions.scales,
      y: {
        ...defaultChartOptions.scales?.y,
        beginAtZero: true,
        ticks: {
          ...defaultChartOptions.scales?.y?.ticks,
          callback: function(value: any) {
            return '$' + value.toFixed(0)
          }
        }
      }
    }
  }

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  )
}