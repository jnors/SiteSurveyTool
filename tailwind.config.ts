import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

import { COLORS, GRID_SIZE } from './lib/constants'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './ui/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: COLORS.bg,
        surface: COLORS.surface,
        primary: COLORS.primary,
        success: COLORS.success,
        warning: COLORS.warning,
        error: COLORS.error,
        'text-primary': COLORS.textPrimary,
        status: {
          pending: COLORS.warning,
          uploading: COLORS.primary,
          synced: COLORS.success,
          error: COLORS.error,
          blocked: '#7A7F85',
        },
      },
      spacing: {
        grid: `${GRID_SIZE}px`,
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        surface: '0 20px 60px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
      })
    }),
  ],
}

export default config

