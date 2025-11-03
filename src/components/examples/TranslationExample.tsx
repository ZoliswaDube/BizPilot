/**
 * Example component demonstrating how to use i18n translations
 * This file shows various ways to use the useTranslation hook
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

export const TranslationExample: React.FC = () => {
  const { t } = useTranslation(); // Default namespace: 'common'
  const { t: tAuth } = useTranslation('auth'); // Specific namespace: 'auth'

  return (
    <div className="p-6 bg-dark-800 rounded-lg">
      <h1 className="text-2xl font-bold text-white mb-4">
        {/* Using translation from common namespace */}
        {t('app.name')}
      </h1>
      
      <p className="text-gray-300 mb-4">
        {/* Using translation with nested key */}
        {t('app.description')}
      </p>

      {/* Example: Action buttons with translations */}
      <div className="flex gap-2 mb-4">
        <button className="px-4 py-2 bg-primary-600 rounded">
          {t('actions.save')}
        </button>
        <button className="px-4 py-2 bg-dark-700 rounded">
          {t('actions.cancel')}
        </button>
      </div>

      {/* Example: Using translations from auth namespace */}
      <div className="border-t border-dark-700 pt-4 mt-4">
        <h2 className="text-xl font-semibold text-white mb-2">
          {tAuth('login.title')}
        </h2>
        <p className="text-gray-400">
          {tAuth('login.subtitle')}
        </p>
      </div>

      {/* Example: Translation with interpolation (when needed) */}
      <div className="border-t border-dark-700 pt-4 mt-4">
        <p className="text-gray-300">
          {t('messages.noData')}
        </p>
      </div>

      {/* Example: Conditional rendering with translations */}
      <div className="border-t border-dark-700 pt-4 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{t('common.status')}:</span>
          <span className="text-green-400">{t('common.success')}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * USAGE GUIDE:
 * 
 * 1. Basic usage:
 *    const { t } = useTranslation();
 *    <h1>{t('app.name')}</h1>
 * 
 * 2. Using specific namespace:
 *    const { t: tAuth } = useTranslation('auth');
 *    <p>{tAuth('login.title')}</p>
 * 
 * 3. With interpolation:
 *    <p>{t('messages.greeting', { name: 'John' })}</p>
 *    // In translation file: "greeting": "Hello, {{name}}!"
 * 
 * 4. With pluralization:
 *    <p>{t('items', { count: 5 })}</p>
 *    // In translation file: "items": "{{count}} item", "items_plural": "{{count}} items"
 * 
 * 5. Changing language programmatically:
 *    const { i18n } = useTranslation();
 *    i18n.changeLanguage('af'); // Change to Afrikaans
 * 
 * 6. Getting current language:
 *    const { i18n } = useTranslation();
 *    console.log(i18n.language); // e.g., 'en'
 */

export default TranslationExample;
