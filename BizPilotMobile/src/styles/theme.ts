// Theme configuration matching the web app's Tailwind theme
export const theme = {
  colors: {
    // Blue - secondary color
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Primary dark theme colors
    primary: {
      50: '#faf7ff',
      100: '#f3f0ff',
      200: '#e9e5ff',
      300: '#d7d0ff',
      400: '#c0b3ff',
      500: '#a78bfa',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    // Purple/pink accent colors
    accent: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },
    // Dark background colors
    dark: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    // Semantic colors
    success: {
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    warning: {
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    danger: {
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    // Grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    // Basic colors
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  lineHeight: {
    xs: 16,
    sm: 18,
    base: 24,
    lg: 26,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 6,
    },
    primary: {
      shadowColor: '#a78bfa',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
  },
} as const;

// Type-safe color accessors
export type Theme = typeof theme;
export type ColorKey = keyof Theme['colors'];
export type ColorShade = keyof Theme['colors']['primary'];

// Helper function to get color values
export const getColor = (colorKey: string, shade?: string | number): string => {
  const keys = colorKey.split('.');
  let value: any = theme.colors;
  
  for (const key of keys) {
    value = value[key];
    if (!value) break;
  }
  
  if (shade && typeof value === 'object') {
    return value[shade] || value['500']; // Default to 500 if shade not found
  }
  
  return typeof value === 'string' ? value : '#000000'; // Fallback
};

// Pre-defined component styles matching web app
export const componentStyles = {
  // Button styles matching web app's btn-primary and btn-secondary
  button: {
    primary: {
      backgroundColor: theme.colors.primary[600],
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      shadowColor: theme.colors.primary[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    secondary: {
      backgroundColor: theme.colors.dark[800] + '80', // 50% opacity
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.dark[600],
      shadowColor: theme.colors.dark[500],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  
  // Input field styles matching web app
  input: {
    default: {
      backgroundColor: theme.colors.dark[800],
      borderColor: theme.colors.dark[600],
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.sm + 4,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.gray[100],
      fontSize: theme.fontSize.base,
    },
    focused: {
      borderColor: theme.colors.primary[500],
      borderWidth: 2,
    },
  },
  
  // Card styles matching web app
  card: {
    default: {
      backgroundColor: theme.colors.dark[900],
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.dark[700] + '80', // 50% opacity
      padding: theme.spacing.lg,
      shadowColor: theme.colors.primary[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    hover: {
      borderColor: theme.colors.primary[500] + '4D', // 30% opacity
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const; 