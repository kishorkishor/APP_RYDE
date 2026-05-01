// ─── Driver Design Tokens ─────────────────────────────────────────────────────
// Dark-first driver theme — extends base rider tokens
// ─────────────────────────────────────────────────────────────────────────────

// Re-export rider base tokens
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

  // ── Text hierarchy ─────────────────────────────────────────────────────────
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

// ── Driver Dark Theme Tokens ──────────────────────────────────────────────────
export const DT = {
  // Backgrounds
  bg: '#0A0B0F',
  bgDeep: '#060810',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.06)',

  // Glass surfaces
  glass: 'rgba(8,10,18,0.92)',
  glassLight: 'rgba(10,11,15,0.75)',
  glassBorder: 'rgba(255,255,255,0.09)',
  glassBorderLight: 'rgba(255,255,255,0.06)',

  // Text
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.5)',
  textFaint: 'rgba(255,255,255,0.3)',
  textLabel: 'rgba(255,255,255,0.4)',

  // Status colors
  online: '#22C55E',
  onlineBg: 'rgba(34,197,94,0.1)',
  onlineBorder: 'rgba(34,197,94,0.3)',
  onlineGlow: 'rgba(34,197,94,0.4)',

  offline: '#EF4444',
  offlineBg: 'rgba(239,68,68,0.1)',
  offlineBorder: 'rgba(239,68,68,0.3)',

  assigned: '#3B82F6',
  assignedBg: 'rgba(59,130,246,0.12)',
  assignedBorder: 'rgba(59,130,246,0.3)',
  assignedText: '#93C5FD',

  amber: '#F59E0B',
  amberBg: 'rgba(245,158,11,0.12)',
  amberBorder: 'rgba(245,158,11,0.3)',
  amberText: '#FCD34D',

  // Border
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',

  // Radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────
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
  green: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
