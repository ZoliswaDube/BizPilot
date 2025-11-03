import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { storeLanguagePreference, getSouthAfricanLanguages } from '../lib/i18n/locationDetector';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
  { code: 'st', name: 'Sotho', nativeName: 'Sesotho', flag: '🇿🇦' },
  { code: 'nso', name: 'Northern Sotho', nativeName: 'Sepedi', flag: '🇿🇦' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana', flag: '🇿🇦' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga', flag: '🇿🇦' },
  { code: 'ss', name: 'Swati', nativeName: 'siSwati', flag: '🇿🇦' },
  { code: 'nr', name: 'Ndebele', nativeName: 'isiNdebele', flag: '🇿🇦' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenḓa', flag: '🇿🇦' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'dropdown' | 'inline';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showLabel = true,
  variant = 'dropdown',
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    storeLanguagePreference(languageCode);
    setIsOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              i18n.language === lang.code
                ? 'bg-primary-600 text-white'
                : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
            }`}
            title={lang.name}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-all text-gray-200"
        aria-label={t('language.select')}
      >
        <Globe size={18} />
        {showLabel && (
          <>
            <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
            <span className="sm:hidden">{currentLanguage.flag}</span>
          </>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-dark-800 rounded-lg shadow-xl border border-dark-700 z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t('language.select')}
              </div>
              
              {/* Popular Languages */}
              <div className="mb-2">
                <div className="px-3 py-1 text-xs text-gray-500">Popular</div>
                {languages.slice(0, 3).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                      i18n.language === lang.code
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.nativeName}
                    {lang.name !== lang.nativeName && (
                      <span className="text-xs text-gray-500 ml-2">({lang.name})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* South African Languages */}
              <div className="mb-2">
                <div className="px-3 py-1 text-xs text-gray-500">South African Languages</div>
                {languages.filter(l => l.flag === '🇿🇦').map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                      i18n.language === lang.code
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.nativeName}
                    {lang.name !== lang.nativeName && (
                      <span className="text-xs text-gray-500 ml-2">({lang.name})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Other Languages */}
              <div>
                <div className="px-3 py-1 text-xs text-gray-500">Other Languages</div>
                {languages.filter(l => l.flag !== '🇿🇦' && l.code !== 'en').map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                      i18n.language === lang.code
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.nativeName}
                    {lang.name !== lang.nativeName && (
                      <span className="text-xs text-gray-500 ml-2">({lang.name})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
