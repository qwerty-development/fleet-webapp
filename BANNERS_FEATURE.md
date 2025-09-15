# Banners Feature Documentation

## Overview
The banners feature allows administrators to create and manage promotional banners that can redirect users to specific cars or dealerships. Banners are displayed on the home page and can be managed through the admin panel.

## Features

### Admin Panel
- **Banner Management**: Create, edit, and delete banners
- **Image Upload**: Upload banner images to Supabase storage
- **Redirect Configuration**: Set banners to redirect to specific cars or dealerships
- **Search & Filter**: Search banners by title or description
- **Pagination**: Browse through banners with pagination
- **Sorting**: Sort banners by creation date or title

### Frontend Display
- **Home Page Integration**: Banners are displayed on the home page in a "Featured Promotions" section
- **Responsive Design**: Banners adapt to different screen sizes
- **Hover Effects**: Interactive hover effects for better user experience
- **Custom URL Scheme**: Banners use custom URL schemes (`fleet://car/59` or `fleet://dealership/59`) for deep linking

## Database Schema

### Banners Table
```sql
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  image_url text NOT NULL,
  redirect_to text NOT NULL,
  redirect_type text NOT NULL CHECK (redirect_type IN ('car', 'dealership')),
  title text,
  description text,
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);
```

### Fields
- `id`: Unique identifier (UUID)
- `created_at`: Timestamp when banner was created
- `image_url`: URL of the banner image (stored in Supabase storage)
- `redirect_to`: ID of the car or dealership to redirect to
- `redirect_type`: Either 'car' or 'dealership'
- `title`: Optional banner title
- `description`: Optional banner description

## File Structure

```
app/
├── admin/
│   └── banners/
│       └── page.tsx              # Admin banners management page
├── api/
│   └── banners/
│       ├── route.ts              # GET, POST endpoints
│       └── [id]/
│           └── route.ts          # GET, PUT, DELETE endpoints
components/
└── banners/
    ├── BannerCard.tsx            # Individual banner display component
    └── BannerList.tsx            # Banner list component
hooks/
└── useBanners.ts                 # Custom hook for banner data management
```

## Usage

### Admin Panel
1. Navigate to `/admin/banners`
2. Click "Add Banner" to create a new banner
3. Upload an image (stored in `banners` bucket)
4. Select redirect type (Car or Dealership)
5. Choose the specific car or dealership to redirect to
6. Add optional title and description
7. Save the banner

### Frontend Display
Banners are automatically displayed on the home page using the `BannerList` component:

```tsx
import BannerList from "@/components/banners/BannerList";

// Display up to 3 banners
<BannerList limit={3} />
```

### Custom URL Schemes
Banners use custom URL schemes for deep linking:
- **Cars**: `fleet://car/{car_id}` (e.g., `fleet://car/59`)
- **Dealerships**: `fleet://dealership/{dealership_id}` (e.g., `fleet://dealership/59`)

These URLs will trigger your mobile app's deep linking functionality when clicked.

### Custom Hook
Use the `useBanners` hook for custom banner management:

```tsx
import { useBanners } from "@/hooks/useBanners";

const { banners, isLoading, error, refetch } = useBanners({
  limit: 10,
  search: 'promotion',
  sortBy: 'created_at',
  sortOrder: 'desc',
  page: 1
});
```

## API Endpoints

### GET /api/banners
Fetch banners with optional filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for title/description
- `sortBy`: Sort field (default: 'created_at')
- `sortOrder`: Sort direction ('asc' or 'desc')

### POST /api/banners
Create a new banner.

**Body:**
```json
{
  "image_url": "https://...",
  "redirect_to": "123",
  "redirect_type": "car"
}
```

**Note:** The `redirect_to` field should contain the ID of the car or dealership. The system will automatically generate the appropriate custom URL scheme (`fleet://car/123` or `fleet://dealership/123`).

### PUT /api/banners/[id]
Update an existing banner.

### DELETE /api/banners/[id]
Delete a banner.

## Storage Setup

The banners feature uses Supabase storage with a `banners` bucket. Make sure to:

1. Create a `banners` bucket in your Supabase project
2. Set appropriate permissions for the bucket
3. Configure CORS if needed for direct uploads

## Styling

Banners use Tailwind CSS classes and are fully responsive. The design includes:
- Aspect ratio of 16:9 for consistent display
- Hover effects with scale and color transitions
- Gradient overlays for text readability
- Mobile-first responsive design

## Security

- All admin operations require authentication
- Image uploads are validated for file type
- Redirect targets are validated to ensure they exist
- RLS policies can be applied for additional security

## Future Enhancements

Potential improvements for the banners feature:
- Banner scheduling (start/end dates)
- Click tracking and analytics
- A/B testing capabilities
- Banner templates
- Multiple banner positions on the page
- Banner carousel/slider functionality
