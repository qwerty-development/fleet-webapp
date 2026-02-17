# Banner Scheduling Implementation - Progress Report

## ✅ Completed Components

### 1. Database Migrations (Ready to Apply)
Created 4 migration files in `db/migrations/`:
- ✅ `20260217_add_banner_scheduling.sql` - Adds scheduling fields to `banners` table
- ✅ `20260217_add_ad_banner_scheduling.sql` - Adds scheduling fields to `ad_banners` table  
- ✅ `20260217_create_banner_status_function.sql` - SQL function to calculate active status
- ✅ `20260217_setup_banner_cron_job.sql` - Pg_cron job setup (requires manual configuration)

**New Database Fields:**
- `start_date` (timestamp with time zone, nullable)
- `end_date` (timestamp with time zone, nullable)
- `active` (boolean, added to banners table)
- `manually_deactivated_at` (timestamp with time zone, nullable)

### 2. TypeScript Types
- ✅ Updated `types/index.ts` with full Banner and AdBanner interfaces
- ✅ Added `BannerStatus` type ('scheduled' | 'active' | 'expired' | 'paused' | 'no_schedule')
- ✅ Added `BannerDateRange` interface

### 3. Utility Functions
Created `utils/bannerDateUtils.ts` with functions:
- ✅ `calculateBannerStatus()` - Determines current banner status
- ✅ `isBannerActive()` - Checks if banner should be displayed
- ✅ `getBannerDateRangeText()` - Human-readable date range
- ✅ `validateBannerDates()` - Validates date constraints
- ✅ `localDateTimeToUTC()` / `utcToLocalDateTime()` - Timezone conversion
- ✅ `getBannerStatusColor()` / `getBannerStatusLabel()` - UI helpers

### 4. Reusable Component
- ✅ `components/ui/DateTimeInput.tsx` - Date/time picker with clear button

### 5. Edge Function
- ✅ `supabase/functions/update-banner-status/index.ts` - Auto-updates banner status daily
- ✅ Handles both `banners` and `ad_banners` tables
- ✅ Respects `manually_deactivated_at` (24-hour grace period)
- ✅ Returns detailed execution statistics

### 6. API Routes Updated
**Banners API:**
- ✅ `app/api/banners/route.ts` - GET supports status filtering, POST includes dates
- ✅ `app/api/banners/[id]/route.ts` - PUT/PATCH with date validation and manual deactivation tracking

**Ad Banners API:**
- ✅ `app/api/ad-banners/route.ts` - GET with status/date filtering, POST includes dates
- ✅ `app/api/ad-banners/[id]/route.ts` - PUT/PATCH with date validation

**Admin Trigger:**
- ✅ `app/api/admin/trigger-banner-status-update/route.ts` - Manual cron trigger for testing

### 7. Admin UI - Partial Progress
**In `app/admin/banners/page.tsx`:**
- ✅ Added necessary imports (DateTimeInput, utility functions)
- ✅ Updated Banner interface to use types
- ✅ Added date-related state (`start_date`, `end_date`, `dateError`)
- ✅ Updated `openAddModal()` and `openEditModal()` to handle dates
- ✅ Updated `handleSubmit()` with date validation and UTC conversion

---

## 🔨 Remaining Work

### 8. Complete Admin Banners UI
**File: `app/admin/banners/page.tsx`** (Lines ~700-900)

**Still Need to Add:**

#### A. Date Picker Fields in Modal
Around line 735 (after redirect selection), add:
```tsx
{/* Date Range Section */}
<div className="space-y-4">
  <h4 className="text-sm font-medium text-gray-300">
    Schedule (Optional)
  </h4>
  
  <DateTimeInput
    label="Start Date"
    value={formData.start_date}
    onChange={(value) => setFormData({ ...formData, start_date: value })}
    helperText="Banner will activate at this date/time"
  />
  
  <DateTimeInput
    label="End Date"
    value={formData.end_date}
    onChange={(value) => setFormData({ ...formData, end_date: value })}
    min={formData.start_date}
    helperText="Banner will deactivate at this date/time"
    error={dateError}
  />
</div>

{/* Active Toggle */}
<div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
  <div>
    <h4 className="text-sm font-medium text-white">Active Status</h4>
    <p className="text-xs text-gray-400">Manually control banner visibility</p>
  </div>
  <button
    type="button"
    onClick={() => setFormData({ ...formData, active: !formData.active })}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      formData.active ? 'bg-emerald-500' : 'bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        formData.active ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
</div>
```

#### B. Status Badge in Banner Cards
Around line 547 (in banner card), replace the title section with:
```tsx
<div className="absolute bottom-2 left-2 right-2">
  <div className="flex items-center justify-between">
    <h3 className="text-white font-semibold text-sm truncate">Banner</h3>
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${getBannerStatusColor(
        calculateBannerStatus(banner)
      )}`}
    >
      {getBannerStatusLabel(calculateBannerStatus(banner))}
    </span>
  </div>
  {(banner.start_date || banner.end_date) && (
    <p className="text-xs text-gray-300 mt-1">
      {getBannerDateRangeText(banner.start_date, banner.end_date)}
    </p>
  )}
</div>
```

#### C. Status Filter Dropdown
Around line 475 (after sort buttons), add:
```tsx
{/* Status Filter */}
<select
  value={filterStatus}
  onChange={(e) => {
    setFilterStatus(e.target.value as 'all' | 'scheduled' | 'active' | 'expired');
    setCurrentPage(1);
  }}
  className="px-3 py-1.5 rounded-lg text-sm bg-gray-800/60 text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
>
  <option value="all">All Banners</option>
  <option value="scheduled">Scheduled</option>
  <option value="active">Active</option>
  <option value="expired">Expired</option>
</select>
```

#### D. Toggle Active Handler
Add after `handleDelete()` function (around line 438):
```tsx
// Handle toggle active status
const handleToggleActive = async (banner: Banner) => {
  if (!confirm(`Are you sure you want to ${banner.active ? 'deactivate' : 'activate'} this banner?`)) {
    return;
  }

  setIsActionLoading(true);
  try {
    const { error } = await supabase
      .from('banners')
      .update({
        active: !banner.active,
        manually_deactivated_at: !banner.active ? null : new Date().toISOString(),
      })
      .eq('id', banner.id);

    if (error) throw error;

    await fetchBanners();
    alert(`Banner ${banner.active ? 'deactivated' : 'activated'} successfully!`);
  } catch (err: any) {
    console.error('Error toggling banner status:', err);
    alert(`Failed to toggle banner: ${err.message}`);
  } finally {
    setIsActionLoading(false);
  }
};
```

#### E. Toggle Button in Banner Card
In the action buttons section (around line 625), add before the Edit button:
```tsx
<button
  onClick={() => handleToggleActive(banner)}
  className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors ${
    banner.active
      ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
      : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
  }`}
>
  {banner.active ? 'Pause' : 'Activate'}
</button>
```

### 9. Update Admin Ad-Banners UI
**File: `app/admin/ad-banners/page.tsx`**

Apply the same changes as above:
1. Add imports at top
2. Update AdBanner interface to extend types
3. Add date fields to formData state
4. Update openAddModal/openEditModal
5. Update handleSubmit with date validation
6. Update handleToggleActive to track manually_deactivated_at
7. Add DateTimeInput components to modal
8. Add status badges to cards
9. Add status filter dropdown

### 10. Update Frontend BannerList
**File: `components/banners/BannerList.tsx`**

Modify the query to only fetch active banners:
```tsx
const { data, error } = await supabase
  .from('banners')
  .select('*')
  .eq('active', true)
  .order('created_at', { ascending: false })
  .limit(limit);

// Client-side filter for date range
const activeBanners = data?.filter(banner => isBannerActive(banner)) || [];
```

---

## 🚀 Deployment Steps

### Step 1: Apply Database Migrations
```bash
# Connect to your Supabase database
# Run each migration file in order:

# 1. Add fields to banners table
psql -h [DB_HOST] -U [USER] -d [DB] -f db/migrations/20260217_add_banner_scheduling.sql

# 2. Add fields to ad_banners table
psql -h [DB_HOST] -U [USER] -d [DB] -f db/migrations/20260217_add_ad_banner_scheduling.sql

# 3. Create status calculation function
psql -h [DB_HOST] -U [USER] -d [DB] -f db/migrations/20260217_create_banner_status_function.sql
```

### Step 2: Deploy Edge Function
```bash
cd supabase
supabase functions deploy update-banner-status
```

### Step 3: Setup Cron Job
1. Run the migration file in Supabase SQL Editor:
```bash
# This will:
# - Store service role key securely in Supabase Vault
# - Create the daily cron job at midnight UTC
# - Verify the setup
```

2. Execute in Supabase Dashboard (SQL Editor):
```sql
-- Copy and paste the entire contents of:
db/migrations/20260217_setup_banner_cron_job.sql
```

3. Verify the setup:
```sql
-- Check vault secret
SELECT name, created_at 
FROM vault.secrets 
WHERE name = 'banner_cron_service_role_key';

-- Check cron job
SELECT jobid, jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'update-banner-status-daily';
```

**✅ The service role key is now securely stored in Supabase Vault** (not in your codebase)

### Step 4: Test the System

#### Test 1: Manual Trigger
```bash
curl -X POST https://your-app.com/api/admin/trigger-banner-status-update \
  -H "Cookie: your-auth-cookie"
```

#### Test 2: Create Scheduled Banner
1. Go to admin panel → Banners
2. Click "Add Banner"
3. Upload image
4. Set start_date to tomorrow
5. Set end_date to next week
6. Save → should show "Scheduled" status

#### Test 3: Create Expired Banner
1. Create banner with end_date in the past
2. Should show "Expired" status
3. Call manual trigger endpoint
4. Banner should be automatically deactivated

#### Test 4: Manual Toggle
1. Click "Pause" on an active banner
2. Verify `manually_deactivated_at` is set in database
3. Click "Activate" to reactivate
4. Verify `manually_deactivated_at` is cleared

### Step 5: Monitor Cron Job
Check Supabase logs for the Edge Function executions:
```
Dashboard → Edge Functions → update-banner-status → Logs
```

---

## 📋 Testing Checklist

- [ ] Database migrations applied successfully
- [ ] Edge Function deployed
- [ ] Cron job scheduled and visible in `cron.job` table
- [ ] Admin UI shows date pickers in add/edit modal
- [ ] Date validation prevents end_date before start_date
- [ ] Status badges display correctly (Scheduled, Active, Expired, Paused)
- [ ] Status filter dropdown works
- [ ] Toggle active/inactive button works
- [ ] `manually_deactivated_at` tracked correctly
- [ ] Manual trigger endpoint executes successfully
- [ ] Cron job runs at midnight UTC (wait 24hrs or test manually)
- [ ] Frontend BannerList only shows active banners
- [ ] Timezone conversion works (dates display in local time, store in UTC)

---

## 🐛 Known Issues / Edge Cases

1. **Cron 24-hour grace period**: If admin manually deactivates a banner, auto-activation won't override it for 24 hours
2. **Timezone display**: Dates show in browser's local timezone but store in UTC
3. **No RLS policies**: Currently relying on API-level auth; consider adding RLS for security
4. **5 banner limit**: Hard-coded in UI; ensure this aligns with business requirements

---

## 📚 Architecture Decisions

### Why Daily Cron Instead of Real-Time?
- Reduces database load
- Matches notification pattern consistency
- Banners don't require minute-precision activation
- Admin can manually trigger if needed

### Why Manual Deactivation Tracking?
- Prevents cron from immediately reactivating admin-paused banners
- 24-hour grace period allows time for fixes
- Clear audit trail of admin actions

### Why Optional Dates?
- Backward compatibility with existing banners
- NULL dates mean "always active" (no scheduling)
- Simpler UX for evergreen content

---

## 🔄 Next Enhancement Opportunities

1. **Email notifications** when banners activate/expire
2. **Preview mode** to see upcoming scheduled banners
3. **Duplicate banner** functionality for quick seasonal variations
4. **Analytics dashboard** showing banner performance by date range
5. **Bulk scheduling** for holiday campaigns
6. **A/B testing** support for multiple active banners

---

## 📞 Support

If issues arise:
1. Check Supabase Edge Function logs
2. Verify cron job status: `SELECT * FROM cron.job;`
3. Test SQL function manually: `SELECT calculate_banner_active_status(NOW(), NOW() + INTERVAL '1 day');`
4. Check database constraints: `\d+ banners`
