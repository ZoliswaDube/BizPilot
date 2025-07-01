import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Dark theme configuration for charts
export const chartTheme = {
  backgroundColor: 'rgba(75, 192, 192, 0.2)',
  borderColor: 'rgba(75, 192, 192, 1)',
  gridColor: 'rgba(255, 255, 255, 0.1)',
  textColor: 'rgba(255, 255, 255, 0.8)',
  colors: {
    primary: '#667eea',
    accent: '#764ba2',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  }
}

export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: chartTheme.textColor,
        font: {
          family: 'Inter, sans-serif',
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: chartTheme.textColor,
      bodyColor: chartTheme.textColor,
      borderColor: chartTheme.colors.primary,
      borderWidth: 1,
    }
  },
  scales: {
    x: {
      grid: {
        color: chartTheme.gridColor,
      },
      ticks: {
        color: chartTheme.textColor,
      }
    },
    y: {
      grid: {
        color: chartTheme.gridColor,
      },
      ticks: {
        color: chartTheme.textColor,
      }
    }
  }
}