import { useState, useEffect } from 'react'
import { Save, Building, DollarSign, TrendingUp, User, Mail, Loader2, CheckCircle, Camera } from 'lucide-react'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency, formatPercentage } from '../../utils/calculations'

export function UserSettings() {
  const { settings, loading: settingsLoading, error: settingsError, updateSettings } = useUserSettings()
  const { user, userProfile, updateProfile } = useAuth()
  
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    hourly_rate: 15.00,
    default_margin: 40.00
  })
  
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    avatar_url: ''
  })
  
  const [businessFormLoading, setBusinessFormLoading] = useState(false)
  const [profileFormLoading, setProfileFormLoading] = useState(false)
  const [businessFormError, setBusinessFormError] = useState('')
  const [profileFormError, setProfileFormError] = useState('')
  const [businessSuccess, setBusinessSuccess] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [businessHasChanges, setBusinessHasChanges] = useState(false)
  const [profileHasChanges, setProfileHasChanges] = useState(false)

  // Update form data when settings and profile load
  useEffect(() => {
    if (settings) {
      setBusinessFormData({
        business_name: settings.business_name || '',
        hourly_rate: settings.hourly_rate || 15.00,
        default_margin: settings.default_margin || 40.00
      })
    }
  }, [settings])

  useEffect(() => {
    if (userProfile) {
      setProfileFormData({
        full_name: userProfile.full_name || '',
        avatar_url: userProfile.avatar_url || ''
      })
    }
  }, [userProfile])

  const handleBusinessInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setBusinessFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
    setBusinessHasChanges(true)
    setBusinessSuccess(false)
  }

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileFormData(prev => ({ ...prev, [name]: value }))
    setProfileHasChanges(true)
    setProfileSuccess(false)
  }

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusinessFormLoading(true)
    setBusinessFormError('')

    // Validation
    if (businessFormData.hourly_rate < 0) {
      setBusinessFormError('Hourly rate must be positive')
      setBusinessFormLoading(false)
      return
    }
    if (businessFormData.default_margin < 0 || businessFormData.default_margin >= 100) {
      setBusinessFormError('Default margin must be between 0% and 99%')
      setBusinessFormLoading(false)
      return
    }

    const result = await updateSettings(businessFormData)
    
    if (result.error) {
      setBusinessFormError(result.error)
    } else {
      setBusinessSuccess(true)
      setBusinessHasChanges(false)
      setTimeout(() => setBusinessSuccess(false), 3000)
    }
    
    setBusinessFormLoading(false)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileFormLoading(true)
    setProfileFormError('')

    const { error } = await updateProfile(profileFormData)
    
    if (error) {
      setProfileFormError(error)
    } else {
      setProfileSuccess(true)
      setProfileHasChanges(false)
      setTimeout(() => setProfileSuccess(false), 3000)
    }
    
    setProfileFormLoading(false)
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400">Manage your profile and business settings</p>
      </div>

      {settingsError && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {settingsError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center mb-6">
              <User className="h-5 w-5 text-primary-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-100">Profile Information</h2>
            </div>

            {profileFormError && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                {profileFormError}
              </div>
            )}

            {profileSuccess && (
              <div className="bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm mb-4 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="profile_email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="profile_email"
                    type="email"
                    value={userProfile?.email || ''}
                    disabled
                    className="input-field pl-10 bg-dark-800 cursor-not-allowed opacity-60"
                  />
                  <Mail className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={profileFormData.full_name}
                    onChange={handleProfileInputChange}
                    className="input-field pl-10"
                    placeholder="Enter your full name"
                  />
                  <User className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-300 mb-1">
                  Avatar URL
                </label>
                <div className="relative">
                  <input
                    id="avatar_url"
                    name="avatar_url"
                    type="url"
                    value={profileFormData.avatar_url}
                    onChange={handleProfileInputChange}
                    className="input-field pl-10"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <Camera className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Account Provider
                  </label>
                  <p className="text-sm text-gray-400 capitalize bg-dark-800 px-3 py-2 rounded border border-dark-600">
                    {userProfile?.provider === 'email' ? 'Email/Password' : userProfile?.provider || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Verified
                  </label>
                  <p className={`text-sm px-3 py-2 rounded border ${
                    userProfile?.email_verified 
                      ? 'text-green-400 bg-green-900/20 border-green-500/30' 
                      : 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
                  }`}>
                    {userProfile?.email_verified ? 'Verified' : 'Pending'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={profileFormLoading || !profileHasChanges}
                  className="btn-primary group flex items-center"
                >
                  {profileFormLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Profile
                </button>
              </div>
            </form>
          </div>

          {/* Business Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Building className="h-5 w-5 text-primary-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-100">Business Information</h2>
            </div>

            {businessFormError && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                {businessFormError}
              </div>
            )}

            {businessSuccess && (
              <div className="bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm mb-4 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Business settings updated successfully!
              </div>
            )}

            <form onSubmit={handleBusinessSubmit} className="space-y-4">
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-gray-300 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  id="business_name"
                  name="business_name"
                  value={businessFormData.business_name}
                  onChange={handleBusinessInputChange}
                  className="input-field"
                  placeholder="Enter your business name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be used in reports and QR tip generators
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-300 mb-1">
                    Hourly Labor Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      id="hourly_rate"
                      name="hourly_rate"
                      min="0"
                      step="0.50"
                      value={businessFormData.hourly_rate}
                      onChange={handleBusinessInputChange}
                      className="input-field pl-8 number-input"
                      placeholder="15.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Used to calculate labor costs for products
                  </p>
                </div>

                <div>
                  <label htmlFor="default_margin" className="block text-sm font-medium text-gray-300 mb-1">
                    Default Profit Margin
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="default_margin"
                      name="default_margin"
                      min="0"
                      max="99"
                      step="0.1"
                      value={businessFormData.default_margin}
                      onChange={handleBusinessInputChange}
                      className="input-field pr-8 number-input"
                      placeholder="40.0"
                    />
                    <span className="absolute right-3 top-3 text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Default margin for new products
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={businessFormLoading || !businessHasChanges}
                  className="btn-primary group flex items-center"
                >
                  {businessFormLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Business Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          <div className="card bg-gradient-to-br from-primary-900/20 to-accent-900/20 border-primary-700/30">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-primary-400 mr-2" />
              <h3 className="font-semibold text-primary-300">Settings Preview</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                {profileFormData.avatar_url ? (
                  <img 
                    src={profileFormData.avatar_url} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary-500/30"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600/30 to-accent-600/30 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-primary-500/30">
                    <User className="h-8 w-8 text-primary-400" />
                  </div>
                )}
                <p className="font-medium text-gray-100">
                  {profileFormData.full_name || 'Your Name'}
                </p>
                <p className="text-sm text-gray-400">{userProfile?.email}</p>
              </div>

              <div className="border-t border-dark-600 pt-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Business Name</p>
                  <p className="font-medium text-gray-100">
                    {businessFormData.business_name || 'Not set'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Labor Cost</p>
                  <p className="font-medium text-gray-100">
                    {formatCurrency(businessFormData.hourly_rate)}/hour
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Default Margin</p>
                  <p className="font-medium text-gray-100">
                    {formatPercentage(businessFormData.default_margin)}
                  </p>
                </div>

                <div className="pt-3 border-t border-dark-600">
                  <p className="text-xs text-gray-500">
                    Example: 30 min labor = {formatCurrency((businessFormData.hourly_rate / 60) * 30)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-100 mb-3">Quick Tips</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Set your hourly rate based on your desired income and business expenses</p>
              <p>• Profit margins typically range from 20% to 60% depending on your industry</p>
              <p>• You can override these defaults when creating individual products</p>
              <p>• Your profile information is used across the application</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}