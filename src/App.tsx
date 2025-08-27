import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthInitializer } from './components/AuthInitializer'
import { InactivityWarningModal } from './components/InactivityWarningModal'
import { useAuthStore } from './store/auth'
import { HomePage } from './components/home/HomePage'
import { AuthForm } from './components/auth/AuthForm'
import { AuthCallback } from './components/auth/AuthCallback'
import { AuthErrorPage } from './components/auth/AuthErrorPage'
import { ResetPasswordForm } from './components/auth/ResetPasswordForm'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './components/dashboard/Dashboard'
import { ProductList } from './components/products/ProductList'
import { ProductForm } from './components/products/ProductForm'
import { InventoryList } from './components/inventory/InventoryList' // New import
import { InventoryForm } from './components/inventory/InventoryForm' // New import
import { CategoryManagement } from './components/categories/CategoryManagement' // New import
import { SupplierManagement } from './components/suppliers/SupplierManagement' // New import
import { UserSettings } from './components/settings/UserSettings' // New import
import { AIChat } from './components/ai/AIChat' // New import
import { GlobalAIChat } from './components/ai/GlobalAIChat' // Global AI chat modal
import { QRGenerator } from './components/qr/QRGenerator' // New import
import { PricingPage } from './components/pricing/PricingPage' // New import
import { CheckoutPage } from './components/checkout/CheckoutPage' // New import
import { ContactForm } from './components/contact/ContactForm' // New import
import { BusinessForm } from './components/business/BusinessForm' // New import
import { BusinessOnboarding } from './components/business/BusinessOnboarding' // New import
import { UserManagement } from './components/users/UserManagement' // New import
import { OrderList } from './components/orders/OrderList' // New import
import { OrderForm } from './components/orders/OrderForm' // New import
import { OrderDetail } from './components/orders/OrderDetail' // New import

function App() {
  const { 
    showInactivityWarning, 
    inactivityTimeRemaining, 
    extendSession, 
    handleInactivityTimeout 
  } = useAuthStore()

  return (
    <>
      <AuthInitializer />
      <InactivityWarningModal
        isOpen={showInactivityWarning}
        timeRemaining={inactivityTimeRemaining}
        onExtendSession={extendSession}
        onLogout={handleInactivityTimeout}
      />
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Home page */}
            <Route path="/" element={<HomePage />} />
            
            {/* Pricing page */}
            <Route path="/pricing" element={<PricingPage />} />
            
            {/* Auth route */}
            <Route path="/auth" element={<AuthForm />} />
            
            {/* Auth callback routes */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/error" element={<AuthErrorPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordForm />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/products" element={
              <ProtectedRoute>
                <Layout>
                  <ProductList />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/products/new" element={
              <ProtectedRoute>
                <Layout>
                  <ProductForm />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/products/edit/:id" element={
              <ProtectedRoute>
                <Layout>
                  <ProductForm />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Layout>
                  <InventoryList />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/inventory/new" element={
              <ProtectedRoute>
                <Layout>
                  <InventoryForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/inventory/edit/:id" element={
              <ProtectedRoute>
                <Layout>
                  <InventoryForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/categories" element={
              <ProtectedRoute>
                <Layout>
                  <CategoryManagement />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/suppliers" element={
              <ProtectedRoute>
                <Layout>
                  <SupplierManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/ai" element={
              <ProtectedRoute>
                <Layout>
                  <AIChat />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/qr" element={
              <ProtectedRoute>
                <Layout>
                  <QRGenerator />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <UserSettings />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Business management routes */}
            <Route path="/business/new" element={
              <ProtectedRoute>
                <BusinessOnboarding />
              </ProtectedRoute>
            } />
            
            <Route path="/business/edit/:id" element={
              <ProtectedRoute>
                <BusinessForm />
              </ProtectedRoute>
            } />

            {/* User management routes */}
            <Route path="/users" element={
              <ProtectedRoute>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            } />

            {/* New routes for pricing page actions */}
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Layout>
                  <CheckoutPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/contact" element={
              <ProtectedRoute>
                <Layout>
                  <ContactForm />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Order management routes */}
            <Route path="/orders" element={
              <ProtectedRoute>
                <Layout>
                  <OrderList />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/orders/new" element={
              <ProtectedRoute>
                <Layout>
                  <OrderForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/orders/edit/:id" element={
              <ProtectedRoute>
                <Layout>
                  <OrderForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <Layout>
                  <OrderDetail />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </AnimatePresence>
        <GlobalAIChat />
      </Router>
    </>
  )
}

export default App