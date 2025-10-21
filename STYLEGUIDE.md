# STYLEGUIDE.md — Visual Identity (Dark Mode)

## Core Palette
| Token | Color | Usage |
|--------|--------|--------|
| bg | #121212 | Background |
| surface | #1E1E1E | Card / Panel |
| primary | #8AB4F8 | Active elements / accents |
| success | #34A853 | Synced state |
| warning | #F9AB00 | Pending state |
| error | #EA4335 | Failed state |
| text-primary | #E8EAED | Main text |
| text-secondary | #9AA0A6 | Muted text |

## Typography
- **Font:** Inter (variable)
- **Weights:** 400–700
- **Scale:** 8pt grid (12, 14, 16, 20, 24, 32)

## Motion
- Max duration: 150ms
- Easing: `ease-in-out`
- Subtle glow/pulse for active or syncing state

## Components
### Buttons
- Rounded: 12–16px radius
- Minimum target: 44×44px
- States: default, hover, active, disabled

### Cards
- Surface color: `#1E1E1E`
- Shadow: `0 2px 8px rgba(0,0,0,0.3)`
- Corner radius: 12px

### Indicators
| State | Color | Motion |
|--------|--------|--------|
| Uploading/Active | Blue (#8AB4F8) | spinner |
| Synced | Green (#34A853) | pulse |
| Pending | Yellow (#F9AB00) | glow |
| Failed | Red (#EA4335) | shake |

## Accessibility
- Minimum contrast ratio: 4.5:1
- Touch targets ≥ 44px
- Use motion sparingly for focus / activity only
