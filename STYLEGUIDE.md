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

---

## Code Standards

### Logging

**REQUIRED:** All logging must use the centralized logger utility from `lib/logger.ts`.

#### ✅ Do This
```typescript
import { logger } from '@/lib/logger';

// Debug/info (development only)
logger.debug('User interaction', { action: 'click', element: 'save-button' });
logger.info('Project synced successfully');

// Warnings/errors (all environments)
logger.warn('Slow network detected', { latency: 5000 });
logger.error('Failed to upload photo', error);

// Domain-specific helpers
logger.sync('Uploading photo', projectId, { photoId: '123' });
logger.auth('Sign in successful', { userId: user.id });
logger.drive('Folder created', { folderId: 'abc123' });
```

#### ❌ Don't Do This
```typescript
// Never use console.log directly
console.log('User clicked button'); // ❌ Wrong
console.info('Project synced');     // ❌ Wrong

// Use the logger instead
logger.debug('User clicked button'); // ✅ Correct
logger.info('Project synced');       // ✅ Correct
```

#### Log Levels
- **`logger.debug()`** - Detailed debugging (dev only)
- **`logger.info()`** - General information (dev only)
- **`logger.warn()`** - Potential issues (all environments)
- **`logger.error()`** - Error conditions (all environments)
- **Domain helpers** (`sync`, `auth`, `drive`, `restore`) - Specialized logging (dev only)

#### Why?
- 🔒 **Security:** Prevents sensitive data from leaking in production logs
- 🎯 **Consistency:** Standardized log format across the codebase
- 📊 **Monitoring:** Easy integration with Sentry/LogRocket in the future
- 🧹 **Clean console:** Production builds won't clutter browser console
