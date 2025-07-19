import { Navigation } from './Navigation'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Fixed Sidebar */}
      <Navigation />
      
      {/* Scrollable Content Area */}
      <div className="flex-1 lg:ml-64">
        <main className="py-8 pt-20 lg:pt-8 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}