import { Navigation } from './Navigation'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark-950 lg:grid lg:grid-cols-[256px_1fr]">
      <Navigation />
      <div className="lg:overflow-auto">
        <main className="py-8 pt-20 lg:pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}