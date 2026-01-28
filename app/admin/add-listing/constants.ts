export const VEHICLE_COLORS = [
  { name: 'Black', value: 'Black', hex: '#000000' },
  { name: 'White', value: 'White', hex: '#FFFFFF' },
  { name: 'Silver', value: 'Silver', hex: '#C0C0C0' },
  { name: 'Gray', value: 'Gray', hex: '#808080' },
  { name: 'Red', value: 'Red', hex: '#FF0000' },
  { name: 'Blue', value: 'Blue', hex: '#0000FF' },
  { name: 'Brown', value: 'Brown', hex: '#A52A2A' },
  { name: 'Green', value: 'Green', hex: '#008000' },
  { name: 'Beige', value: 'Beige', hex: '#F5F5DC' },
  { name: 'Orange', value: 'Orange', hex: '#FFA500' },
  { name: 'Gold', value: 'Gold', hex: '#FFD700' },
  { name: 'Yellow', value: 'Yellow', hex: '#FFFF00' },
  { name: 'Purple', value: 'Purple', hex: '#800080' },
];

export const CATEGORIES = [
  { value: 'Sedan', label: 'Sedan', icon: '🚗' },
  { value: 'SUV', label: 'SUV', icon: '🚙' },
  { value: 'Truck', label: 'Truck', icon: '🛻' },
  { value: 'Coupe', label: 'Coupe', icon: '🏎️' },
  { value: 'Convertible', label: 'Convertible', icon: '😎' },
  { value: 'Hatchback', label: 'Hatchback', icon: '🚘' },
  { value: 'Wagon', label: 'Wagon', icon: '🚐' },
];

export const FUEL_TYPES = [
  { value: 'Benzine', label: 'Benzine', icon: '⛽' },
  { value: 'Diesel', label: 'Diesel', icon: '🛢️' },
  { value: 'Hybrid', label: 'Hybrid', icon: '🔋' },
  { value: 'Electric', label: 'Electric', icon: '⚡' },
  { value: 'plugin-hybrid', label: 'Plug-in Hybrid', icon: '🔌' },
];

export const TRANSMISSIONS = [
  { value: 'Automatic', label: 'Automatic', icon: '⚙️' },
  { value: 'Manual', label: 'Manual', icon: '🎛️' },
];

export const DRIVE_TRAINS = [
  { value: 'FWD', label: 'FWD', icon: '↘️' },
  { value: 'RWD', label: 'RWD', icon: '↗️' },
  { value: 'AWD', label: 'AWD', icon: '🔼' },
  { value: '4WD', label: '4WD', icon: '🔄' },
];

export const CONDITIONS = [
  { value: 'New', label: 'New', icon: '✨' },
  { value: 'Used', label: 'Used', icon: '👍' },
];

export const SOURCE_OPTIONS = [
  { value: 'Company', label: 'Company Source', icon: '🏢' },
  { value: 'GCC', label: 'GCC', icon: '🌴' },
  { value: 'USA', label: 'USA', icon: '🇺🇸' },
  { value: 'Canada', label: 'Canada', icon: '🇨🇦' },
  { value: 'China', label: 'China', icon: '🇨🇳' },
  { value: 'Europe', label: 'Europe', icon: '🇪🇺' },
];

export const RENTAL_PERIODS = [
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '🗓️' },
  { value: 'monthly', label: 'Monthly', icon: '📆' },
];

export const PLATE_STATUSES = [
  { value: 'available', label: 'Available', icon: '✅' },
  { value: 'pending', label: 'Pending', icon: '⏳' },
  { value: 'sold', label: 'Sold', icon: '🔒' },
];

export const VEHICLE_FEATURES = [
  { id: 'heated_seats', label: 'Heated Seats', category: 'comfort' },
  { id: 'keyless_entry', label: 'Keyless Entry', category: 'convenience' },
  { id: 'keyless_start', label: 'Keyless Start', category: 'convenience' },
  { id: 'power_mirrors', label: 'Power Mirrors', category: 'convenience' },
  { id: 'power_steering', label: 'Power Steering', category: 'convenience' },
  { id: 'power_windows', label: 'Power Windows', category: 'convenience' },
  { id: 'backup_camera', label: 'Backup Camera', category: 'safety' },
  { id: 'bluetooth', label: 'Bluetooth', category: 'technology' },
  { id: 'cruise_control', label: 'Cruise Control', category: 'convenience' },
  { id: 'navigation', label: 'Navigation System', category: 'technology' },
  { id: 'sunroof', label: 'Sunroof', category: 'comfort' },
  { id: 'leather_seats', label: 'Leather Seats', category: 'comfort' },
  { id: 'third_row_seats', label: 'Third Row Seats', category: 'space' },
  { id: 'parking_sensors', label: 'Parking Sensors', category: 'safety' },
  { id: 'lane_assist', label: 'Lane Departure Warning', category: 'safety' },
  { id: 'blind_spot', label: 'Blind Spot Monitoring', category: 'safety' },
  { id: 'apple_carplay', label: 'Apple CarPlay', category: 'technology' },
  { id: 'android_auto', label: 'Android Auto', category: 'technology' },
  { id: 'premium_audio', label: 'Premium Audio', category: 'technology' },
  { id: 'remote_start', label: 'Remote Start', category: 'convenience' },
];
