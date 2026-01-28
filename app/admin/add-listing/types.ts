export type ListingType = 'sale' | 'rent' | 'plates';
export type OwnerType = 'dealership' | 'user';

export interface Dealership {
  id: string;
  name: string;
  location: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
}

export interface CarFormData {
  dealership_id: string;
  user_id: string;
  make: string;
  model: string;
  trim: string;
  year: string;
  price: string;
  color: string;
  category: string;
  fuel_type: string;
  source: string;
  description: string;
  mileage: string;
  transmission: string;
  drivetrain: string;
  condition: string;
  features: string[];
  bought_price: string;
  date_bought: string;
  seller_name: string;
  rental_period: string;
}

export interface PlateFormData {
  letter: string;
  digits: string;
  price: string;
  status: string;
}

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  name: string;
}

export interface FormErrors {
  [key: string]: string;
}
