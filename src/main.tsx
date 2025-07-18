import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'
import './components/charts/ChartRegistry' // Initialize Chart.js

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with an error will be recorded
  // Setting this option to true will send default PII data to Sentry.
  sendDefaultPii: true,
  beforeSend(event) {
    // Filter out development errors
    if (import.meta.env.MODE === 'development') {
      console.log('Sentry Event:', event)
      return null // Don't send events in development
    }
    return event
  },
})

// Create the Sentry-wrapped App component
const SentryApp = Sentry.withErrorBoundary(App, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
        <p className="text-gray-300 mb-6">
          We've been notified about this error and will fix it soon.
        </p>
        <button
          onClick={resetError}
          className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
        >
          Try Again
        </button>
        {import.meta.env.MODE === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-gray-400 cursor-pointer">Error Details (Development)</summary>
            <pre className="text-xs text-red-300 mt-2 p-2 bg-dark-900 rounded overflow-auto">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  ),
  beforeCapture: (scope) => {
    scope.setTag('errorBoundary', true)
    scope.setLevel('error')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryApp />
  </React.StrictMode>,
)