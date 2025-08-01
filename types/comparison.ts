export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  condition: string;
  transmission: string;
  color: string;
  mileage: number;
  drivetrain: string;
  type: string; // Fuel type
  category: string;
  description: string;
  images: string[];
  views: number;
  likes: number;
  features: string[];
  dealership_id: number;
  dealership_name?: string;
  dealership_logo?: string;
  dealership_phone?: string;
  dealership_location?: string;
  dealership_latitude?: number;
  dealership_longitude?: number;
  status: string;
  source?: string;
  dealerships?: {
    name: string;
    logo: string;
    phone: string;
    location: string;
    latitude: number;
    longitude: number;
  };
}

export interface ComparisonData {
  label: string;
  value1: any;
  value2: any;
  better: number;
  icon: string;
  prefix?: string;
  suffix?: string;
  showBar?: boolean;
  maxValue?: number;
  isHigherBetter?: boolean;
}

export interface CostBreakdown {
  total: number;
  breakdown: {
    depreciation: number;
    insurance: number;
    fuel: number;
    maintenance: number;
    registration: number;
    annualMileage: number;
  };
}