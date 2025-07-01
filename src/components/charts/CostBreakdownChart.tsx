import { Doughnut } from 'react-chartjs-2'
import { chartTheme, defaultChartOptions } from './ChartRegistry'

interface CostBreakdownData {
  materialCost: number
  laborCost: number
  totalCost: number
}

interface CostBreakdownChartProps {
  data: CostBreakdownData
}

export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const chartData = {
    labels: ['Material Costs', 'Labor Costs'],
    datasets: [
      {
        data: [data.materialCost, data.laborCost],
        backgroundColor: [
          `${chartTheme.colors.info}80`,
          `${chartTheme.colors.accent}80`,
        ],
        borderColor: [
          chartTheme.colors.info,
          chartTheme.colors.accent,
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
        text: 'Average Cost Breakdown',
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
            const total = data.totalCost
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
            return `${context.label}: $${value.toFixed(2)} (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <div className="h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}