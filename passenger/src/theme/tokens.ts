// ─── Design Tokens ─────────────────────────────────────────────────────────────
// Faithfully ported from Figma prototype UIKit.tsx T object
// These tokens define the entire visual language of the VELO app.
// ────────────────────────────────────────────────────────────────────────────────

export const T = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary: '#0F0F0F',
  white: '#FFFFFF',

  // ── Semantic colors ────────────────────────────────────────────────────────
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenDark: '#15803D',
  blue: '#2563EB',
  blueLight: '#DBEAFE',
  red: '#DC2626',
  redLight: '#FEE2E2',
  amber: '#D97706',
  amberLight: '#FEF3C7',

  // ── Surfaces ───────────────────────────────────────────────────────────────
  surface: '#FFFFFF',
  bg: '#F8F8F8',
  border: '#E8E8E8',

  // ── Text hierarchy (4 levels) ──────────────────────────────────────────────
  text: '#0F0F0F',
  text2: '#374151',
  text3: '#6B7280',
  text4: '#9CA3AF',
  muted: '#9CA3AF',
  mutedDark: '#6B7280',

  // ── Neutral scale ──────────────────────────────────────────────────────────
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray500: '#737373',
  gray700: '#404040',
  gray900: '#171717',

  // ── Border-radius scale ────────────────────────────────────────────────────
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  // ── Spacing scale (4-pt grid) ──────────────────────────────────────────────
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },

  // ── Font-size scale ────────────────────────────────────────────────────────
  font: {
    xs: 11,
    sm: 12,
    md: 13,
    base: 14,
    lg: 15,
    xl: 16,
    '2xl': 18,
    '3xl': 20,
    '4xl': 22,
    '5xl': 24,
  },
} as const;

// ── Shadow styles (React Native compatible) ──────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

// ── Chip color map ───────────────────────────────────────────────────────────
export type ChipVariant = 'default' | 'primary' | 'green' | 'blue' | 'red' | 'amber';

export const chipColors: Record<ChipVariant, { bg: string; text: string }> = {
  default: { bg: T.gray100, text: T.text2 },
  primary: { bg: T.primary, text: T.white },
  green: { bg: T.greenLight, text: T.green },
  blue: { bg: T.blueLight, text: T.blue },
  red: { bg: T.redLight, text: T.red },
  amber: { bg: T.amberLight, text: T.amber },
};

// ── Status pill color map ────────────────────────────────────────────────────
export type StatusPillVariant = 'blue' | 'green' | 'amber' | 'default';

export const statusPillColors: Record<StatusPillVariant, { bg: string; text: string; dot: string }> = {
  blue: { bg: T.blueLight, text: T.blue, dot: T.blue },
  green: { bg: T.greenLight, text: T.green, dot: T.green },
  amber: { bg: T.amberLight, text: T.amber, dot: T.amber },
  default: { bg: T.gray100, text: T.text2, dot: T.text3 },
};

// ── Place type styling ───────────────────────────────────────────────────────
export const placeTypeColor: Record<string, string> = {
  home: T.blue,
  work: T.amber,
  recent: T.text3,
  saved: T.green,
  suggestion: T.text3,
};
