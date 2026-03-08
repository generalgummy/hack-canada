// Northern Harvest Design System — React Native Theme
// Matches the Re-designed UI mockups (northernharvest.css)

export const colors = {
  // Core palette
  bg: '#F5E6C8',           // warm cream — app background
  bgCard: '#FAF0DC',       // off-white — cards & inputs
  bgCardAlt: '#FFFFFF',    // pure white — stat tiles

  // Brand greens
  greenDark: '#2A5C2A',    // nav bar, headers, form CTAs
  greenMid: '#3D7A3D',     // hover states, active tabs
  greenLight: '#D4EDDA',   // success badges, chip bg

  // Accents
  yellow: '#F5C200',       // primary CTA — "Continue"
  yellowHover: '#DBA800',
  orange: '#E8834A',       // secondary CTA — "Please Wait"
  orangeHover: '#CC6A32',
  red: '#E05252',          // accent bar (Hunter card)
  blue: '#4A90D9',         // accent bar (Mass Supplier)

  // Typography
  textHeading: '#1A1A1A',
  textBody: '#3A3A3A',
  textMuted: '#7A7A7A',
  textOnDark: '#FFFFFF',

  // Borders
  border: '#D0C4A8',
  borderLight: '#C8B88A',

  // Short aliases for new components
  green:   '#2A5C2A',   // = greenDark
  text:    '#3A3A3A',   // = textBody
  muted:   '#7A7A7A',  // = textMuted
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  pill: 999,
  full: 999,  // alias for pill
};

export const shadows = {
  card: {
    shadowColor: '#2A5C2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  button: {
    shadowColor: '#F5C200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const fonts = {
  displayBold: { fontFamily: 'Nunito_800ExtraBold' },
  heading:     { fontFamily: 'Nunito_700Bold' },
  bodyBold:    { fontFamily: 'Nunito_600SemiBold' },
  body:        { fontFamily: 'Nunito_400Regular' },
  light:       { fontFamily: 'Nunito_300Light' },
};

// Named font family constants for inline use
export const F = {
  light:    'Nunito_300Light',
  regular:  'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold:     'Nunito_700Bold',
  extrabold:'Nunito_800ExtraBold',
  black:    'Nunito_900Black',
};

// Urgency badge colors
export const urgency = {
  low:      { bg: '#D6EAF8', text: '#1A5C8C', label: 'Low' },
  medium:   { bg: '#FFF3CD', text: '#8C5D00', label: 'Medium' },
  critical: { bg: '#FFEBEE', text: '#C62828', label: 'Critical' },
};

export default { colors, spacing, radius, shadows, fonts, F, urgency };
