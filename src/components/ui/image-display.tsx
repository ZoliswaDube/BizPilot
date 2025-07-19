import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, X, ZoomIn } from 'lucide-react'

interface ImageDisplayProps {
  src?: string | null
  alt?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showZoom?: boolean
  fallbackIcon?: boolean
}

export function ImageDisplay({ 
  src, 
  alt = "Image", 
  className = "", 
  size = "md",
  showZoom = false,
  fallbackIcon = true
}: ImageDisplayProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (!src) {
    if (fallbackIcon) {
      return (
        <div className={`${sizeClasses[size]} bg-dark-800 rounded-lg flex items-center justify-center ${className}`}>
          <ImageIcon className="h-4 w-4 text-gray-500" />
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        <motion.div
          className={`${sizeClasses[size]} bg-dark-800 rounded-lg overflow-hidden border border-dark-700`}
          whileHover={{ scale: showZoom ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"
              />
            </div>
          )}
          
          {hasError ? (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-gray-500" />
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}

          {showZoom && !hasError && (
            <motion.button
              onClick={() => setIsZoomed(true)}
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ZoomIn className="h-4 w-4 text-white" />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              className="relative max-w-4xl max-h-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <motion.button
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 