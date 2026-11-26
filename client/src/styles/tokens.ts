export const DESIGN_TOKENS = {
  colors: {
    brandPrimary: '#135D43',
    brandPrimaryHover: '#0E4834',
    brandEmerald: '#1B8A5A',
    brandSoftMint: '#E8F6EE',
    brandSurface: '#F5FBF8',
    brandTealAccent: '#1D6E6B',
    inkPrimary: '#0E2D24',
    inkSecondary: '#47655B',
    inkMuted: '#6A837B',
    borderSubtle: '#DCEAE3',
    dangerSurface: '#FDECEC',
    dangerBorder: '#F6B8B8',
    dangerText: '#C93434',
    infoSurface: '#EAF4FD',
    infoText: '#1D65C1',
  },
  radii: {
    card: '16px',
    button: '12px',
    pill: '9999px',
  },
  shadows: {
    card: '0 6px 24px -6px rgba(17, 56, 42, 0.08)',
    elevated: '0 14px 36px -10px rgba(17, 56, 42, 0.14)',
  },
  fonts: {
    display: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    body: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: "'Caveat', cursive",
  },
} as const;
