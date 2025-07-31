// types/index.ts

export interface FilterState {
  searchQuery: string;
  categories: string[];
  priceRange: number[];
  mileageRange: number[];
  yearRange: number[];
  transmission: string[];
  drivetrain: string[];
  color: string[];
  make: string[];
  model: string[];
  dealership: string[];
  dealershipName: string[];
  specialFilter: string | null; // Explicitly allow string value
  sortBy: string | null; // Explicitly allow string value
}

export interface Car {
  features: any;
  likes: number;
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  color: string;
  category: string;
  transmission: string;
  drivetrain: string;
  condition: string;
  type: string;
  images: string[];
  dealership_id: string;
  status: string;
  listed_at: string;
  views: number;
  trim?: string[];
  dealership_name: string;
  dealership_logo: string;
  dealership_phone: string;
  dealership_location: string;
  dealership_latitude: number;
  dealership_longitude: number;
  dealerships: {
    name: string;
    logo: string;
    phone?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface Brand {
  name: string;
  logoUrl: string;
}

// types.ts - Add this to your existing types file

export interface Dealership {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  created_at?: string;
  updated_at?: string;
  status?: "active" | "inactive";
  featured?: boolean;
  rating?: number;
  review_count?: number;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  amenities?: string[];
  specializations?: string[];
  owner_id?: string;
  staff?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    contact?: string;
  }[];
}

// You may also want a simplified version for listing cards
export interface DealershipSummary {
  id: string;
  name: string;
  logo?: string;
  location?: string;
  rating?: number;
  featured?: boolean;
}
