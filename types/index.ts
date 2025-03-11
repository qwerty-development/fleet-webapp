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

  
  export interface Car  {
    id: number; 
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