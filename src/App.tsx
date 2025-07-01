import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './components/auth/AuthProvider'
import { HomePage } from './components/home/HomePage'
import { AuthForm } from './components/auth/AuthForm'
import { AuthCallback } from './components/auth/AuthCallback'
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
import { QRGenerator } from './components/qr/QRGenerator' // New import
import { PricingPage } from './components/pricing/PricingPage' // New import
import { CheckoutPage } from './components/checkout/CheckoutPage' // New import
import { ContactForm } from './components/contact/ContactForm' // New import

function App() {
  return (
    <AuthProvider>
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
          </Routes>
        </AnimatePresence>
      </Router>
    </AuthProvider>
  )
}

export default App