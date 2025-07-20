import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  MessageSquare, 
  QrCode, 
  Settings,
  LogOut,
  Menu,
  X,
  Tag, // New icon for Categories
  Truck, // New icon for Suppliers
  Users // New icon for User Management
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { Logo } from '../common/Logo'
import { supabase } from '../../lib/supabase'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Categories', href: '/categories', icon: Tag }, // New
  { name: 'Suppliers', href: '/suppliers', icon: Truck }, // New
  { name: 'AI Assistant', href: '/ai', icon: MessageSquare },
  { name: 'QR Generator', href: '/qr', icon: QrCode },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Admin-only nav items
const adminNavItems = [
  { name: 'Users', href: '/users', icon: Users },
]

export function Navigation() {
  const location = useLocation()
  const { signOut, user } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [isAdmin, setIsAdmin] = React.useState(false)

  // Check if user is admin
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('business_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single()

        if (!error && data) {
          setIsAdmin(true)
        }
      } catch (err) {
        console.error('Error checking admin status:', err)
      }
    }

    checkAdminStatus()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
  }

  // Combine regular nav items with admin items
  const allNavItems = [...navItems, ...(isAdmin ? adminNavItems : [])]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Logo width={32} height={32} className="shadow-lg" />
            <span className="ml-2 text-lg font-semibold text-gray-100">BizPilot</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-300"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" 
            onClick={() => setMobileMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Fixed Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-dark-900/95 backdrop-blur-sm border-r border-dark-700 transform transition-transform duration-300 overflow-y-auto
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:transform-none`}
      >
        
        {/* Logo */}
        <motion.div 
          className="flex items-center h-16 px-6 border-b border-dark-700 sticky top-0 bg-dark-900/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Logo width={32} height={32} className="shadow-lg" />
          <span className="ml-2 text-lg font-semibold text-gray-100">BizPilot</span>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {allNavItems.map((item, index) => {
            const isActive = location.pathname === item.href
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600/20 to-accent-600/20 text-primary-400 border-r-2 border-primary-500 shadow-lg'
                      : 'text-gray-300 hover:bg-dark-800 hover:text-gray-100'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                  </motion.div>
                  {item.name}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* User info and logout - Sticky bottom */}
        <motion.div 
          className="border-t border-dark-700 p-4 sticky bottom-0 bg-dark-900/95 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center mb-3">
            {user?.user_metadata?.avatar_url ? (
              <motion.img 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                className="h-8 w-8 rounded-full border border-primary-500/30"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              />
            ) : (
              <motion.div 
                className="h-8 w-8 bg-gradient-to-br from-primary-600/30 to-accent-600/30 rounded-full flex items-center justify-center border border-primary-500/30"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span className="text-sm font-medium text-gray-200">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </motion.div>
            )}
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              {user?.user_metadata?.full_name && (
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              )}
            </div>
          </div>
          <motion.button
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-dark-800 hover:text-gray-100 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div whileHover={{ rotate: -5 }}>
              <LogOut className="h-4 w-4 mr-3" />
            </motion.div>
            Sign out
          </motion.button>
        </motion.div>
      </div>
    </>
  )
}