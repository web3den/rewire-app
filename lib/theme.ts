// Rewire Design System — Journey meets Studio Ghibli dark theme

export const colors = {
  // Backgrounds
  bg: {
    primary: '#0A0A0F',
    secondary: '#12121A',
    tertiary: '#1A1A25',
    card: '#1E1E2A',
    elevated: '#252535',
  },

  // Primary accent: warm gold
  gold: {
    DEFAULT: '#E8A838',
    light: '#F4C97B',
    dim: '#A07828',
    glow: 'rgba(232, 168, 56, 0.15)',
  },

  // Secondary accent: soft purple
  purple: {
    DEFAULT: '#7B6FE0',
    light: '#9B91F0',
    dim: '#5B50B0',
    glow: 'rgba(123, 111, 224, 0.15)',
  },

  // Text
  text: {
    primary: '#E8E6E3',
    secondary: '#A8A4B0',
    muted: '#6B6777',
    inverse: '#0A0A0F',
  },

  // Stat/domain colors
  domain: {
    vitality: '#E05555',   // Body
    clarity: '#5B8DEF',    // Mind
    connection: '#E8A838', // Heart
    valor: '#D45CFF',      // Courage
    foundation: '#5BEF8D', // Order
    depth: '#7B6FE0',      // Spirit
  },

  // Quest tier colors
  tier: {
    ember: '#FF6B4A',
    flame: '#E8A838',
    blaze: '#D45CFF',
    inferno: '#FF4444',
  },

  // Utility
  error: '#E05555',
  success: '#5BEF8D',
  warning: '#E8A838',
  border: 'rgba(168, 164, 176, 0.12)',
  overlay: 'rgba(10, 10, 15, 0.7)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    color: colors.text.primary,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.text.primary,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: colors.text.primary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.text.primary,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: colors.text.muted,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    color: colors.text.primary,
  },
} as const;

// Domain enum to stat column name mapping
export const domainToStat: Record<string, string> = {
  body: 'vitality',
  mind: 'clarity',
  heart: 'connection',
  courage: 'valor',
  order: 'foundation',
  spirit: 'depth',
};

// Domain display labels
export const domainLabels: Record<string, string> = {
  body: 'Body',
  mind: 'Mind',
  heart: 'Heart',
  courage: 'Courage',
  order: 'Order',
  spirit: 'Spirit',
};

// Stat display labels
export const statLabels: Record<string, string> = {
  vitality: 'Vitality',
  clarity: 'Clarity',
  connection: 'Connection',
  valor: 'Valor',
  foundation: 'Foundation',
  depth: 'Depth',
};

export const TOUCH_MIN = 44;
