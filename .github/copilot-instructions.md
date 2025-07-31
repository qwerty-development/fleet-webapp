# Fleet WebApp - AI Coding Instructions

## Architecture Overview
This is a Next.js 14 car marketplace application with multi-role dashboards (admin, dealer, user) using Supabase as backend, implementing complex subscription management and content approval workflows.

## Core Data Model & Relationships
### Primary Tables
- **users**: Role-based (`user`, `dealer`, `admin`) with integrated guest mode support
- **dealerships**: Subscription-based entities with `subscription_end_date` driving content visibility
- **cars**: Vehicle listings with status (`available`, `pending`, `sold`) tied to dealership subscriptions
- **auto_clips**: Video content for cars with approval workflow (`published`, `archived`)

### Critical Business Rules
- **Subscription Status Impact**: When dealership subscriptions expire, cars become `pending` and autoclips become `archived`
- **Role-Based Access**: Strict middleware enforcement in `middleware.ts` with database role verification
- **Guest Mode**: Anonymous browsing with localStorage-based favorites using UUIDs (`guest_[uuid]`)

## Authentication & Authorization Patterns
### Multi-Client Supabase Setup
```typescript
// Client-side
import { createClient } from '@/utils/supabase/client'

// Server-side (SSR)
import { createClient } from '@/utils/supabase/server'

// Admin operations
import { createAdminClient } from '@/utils/supabase/admin'
```

### Route Protection
- `middleware.ts`: Role verification against database, not just JWT claims
- Protected routes: `/admin/*`, `/dealer/*`, `/profile`, `/favorites`
- Deep link support: `/cars/[id]`, `/clips/[id]` bypass auth for mobile apps

## Component Architecture Patterns
### Context Providers Hierarchy
```typescript
// app/layout.tsx wrapping order
<GuestUserProvider>
  <AuthProvider>
    <FavoritesProvider>
      <QueryClientProvider>
```

### Dynamic Loading Strategy
- Landing page uses dynamic imports for non-critical sections
- Background processes marked with `isBackground: true` in terminal commands
- Splash screen with localStorage `hasSeenSplash` flag

## Database Query Patterns
### Relationship Fetching
```typescript
// Standard pattern with joined data
const { data } = await supabase
  .from('cars')
  .select('*, dealerships(name, logo, phone)')
  .eq('status', 'available')
```

### Subscription-Aware Queries
```typescript
// Always check dealership subscription status
const now = new Date()
const isActive = new Date(dealership.subscription_end_date) > now
```

## File Storage Conventions
### Supabase Storage Structure
- `cars/` bucket: `{dealership_id}/{timestamp}_{index}_{filename}`
- `autoclips/` bucket: `{dealership_id}/{timestamp}_{random}.{ext}`
- Public URLs: Always call `getPublicUrl()` after upload

## Role-Specific Dashboard Patterns
### Admin Dashboard (`/admin/*`)
- Bulk operations with optimistic updates
- Chart.js integration for subscription analytics
- Dealership lifecycle management (create/extend/expire)

### Dealer Dashboard (`/dealer/*`)
- Subscription validation before CRUD operations
- Inventory management with status transitions
- AutoClips creation limited to available cars

### User Experience
- Filter state management across car browsing
- Guest mode with persistent favorites
- Mobile-responsive with navbar state management

## Form Handling Standards
### Validation Pattern
```typescript
const [errors, setErrors] = useState<Record<string, string>>({})
const [isSubmitting, setIsSubmitting] = useState(false)

const validateForm = () => {
  const newErrors: Record<string, string> = {}
  // ... validation logic
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

### File Upload Flow
1. Validate file types/sizes client-side
2. Upload to Supabase Storage with progress tracking
3. Get public URL
4. Store URL in database record
5. Handle cleanup on errors

## Development Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Next.js linting
```

## Common Debugging Patterns
- Check subscription status when cars/clips aren't visible
- Verify role in database vs. JWT when access denied
- Use browser network tab for Supabase RLS policy debugging
- Guest mode issues: clear localStorage and check UUID format

## Integration Points
- **Google One Tap**: OAuth integration with failsafe redirects
- **Apple Sign-in**: Deep link support via `.well-known` routes
- **CSP Headers**: Configured in `next.config.js` for external services
- **Chart.js**: Subscription analytics with responsive design

## State Management Philosophy
- React Query for server state caching
- Context for cross-component user state
- Local component state for UI interactions
- Optimistic updates for better UX with rollback capability
