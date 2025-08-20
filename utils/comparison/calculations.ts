import { FEATURE_METADATA, ANNUAL_COST_ESTIMATES, CATEGORY_RETENTION_RATES } from './constants';
import { Car, CostBreakdown } from "@/types/comparison";

export const getBetterValue = (attr: string, value1: any, value2: any): number => {
  if (value1 === null || value1 === undefined) return 2;
  if (value2 === null || value2 === undefined) return 1;

  switch (attr) {
    case 'price':
      return value1 < value2 ? 1 : value1 > value2 ? 2 : 0;
    case 'mileage':
      return value1 < value2 ? 1 : value1 > value2 ? 2 : 0;
    case 'year':
      return value1 > value2 ? 1 : value1 < value2 ? 2 : 0;
    case 'features':
      return (value1?.length || 0) > (value2?.length || 0) ? 1 : (value1?.length || 0) < (value2?.length || 0) ? 2 : 0;
    case 'safety_features':
      const safetyFeatures1 = value1?.filter((f: string) => FEATURE_METADATA[f]?.category === 'safety').length || 0;
      const safetyFeatures2 = value2?.filter((f: string) => FEATURE_METADATA[f]?.category === 'safety').length || 0;
      return safetyFeatures1 > safetyFeatures2 ? 1 : safetyFeatures1 < safetyFeatures2 ? 2 : 0;
    case 'comfort_features':
      const comfortFeatures1 = value1?.filter((f: string) => FEATURE_METADATA[f]?.category === 'comfort').length || 0;
      const comfortFeatures2 = value2?.filter((f: string) => FEATURE_METADATA[f]?.category === 'comfort').length || 0;
      return comfortFeatures1 > comfortFeatures2 ? 1 : comfortFeatures1 < comfortFeatures2 ? 2 : 0;
    case 'tech_features':
      const techFeatures1 = value1?.filter((f: string) => FEATURE_METADATA[f]?.category === 'technology').length || 0;
      const techFeatures2 = value2?.filter((f: string) => FEATURE_METADATA[f]?.category === 'technology').length || 0;
      return techFeatures1 > techFeatures2 ? 1 : techFeatures1 < techFeatures2 ? 2 : 0;
    case 'value_score':
      return value1 > value2 ? 1 : value1 < value2 ? 2 : 0;
    case 'total_cost':
      return value1 < value2 ? 1 : value1 > value2 ? 2 : 0;
    case 'depreciation':
      return value1 < value2 ? 1 : value1 > value2 ? 2 : 0;
    default:
      return 0;
  }
};

export const calculateFutureValue = (currentValue: number, currentAge: number, yearsToProject: number, carCategory = 'Mass-Market'): number => {
  if (!currentValue || isNaN(currentValue) || currentValue <= 0) return 0;
  if (!currentAge || isNaN(currentAge)) currentAge = 0;
  if (!yearsToProject || isNaN(yearsToProject)) yearsToProject = 5;
  
  const retentionRange = CATEGORY_RETENTION_RATES[carCategory as keyof typeof CATEGORY_RETENTION_RATES] || CATEGORY_RETENTION_RATES['Mass-Market'];
  const targetRetentionRate = retentionRange.avg;
  const annualDepreciationRate = 1 - Math.pow(targetRetentionRate, 1/5);
  
  let futureValue = Number(currentValue);
  
  for (let year = 1; year <= yearsToProject; year++) {
    futureValue = futureValue * (1 - annualDepreciationRate);
  }

  return Math.round(futureValue);
};

export const calculateTotalCostOfOwnership = (car: Car): CostBreakdown => {
  if (!car || !car.price) return {
    total: 0,
    breakdown: {
      depreciation: 0,
      insurance: 0,
      fuel: 0,
      maintenance: 0,
      registration: 0,
      annualMileage: 0
    }
  };
  
  const carAge = car.year ? (new Date().getFullYear() - car.year) : 0;
  const category = car.category || 'Mass-Market';
  const fuelType = car.type || 'Benzine';
  const currentValue = car.price;

  // 1. Calculate depreciation
  const futureValue = calculateFutureValue(currentValue, carAge, 5, category);
  const depreciation = currentValue - futureValue;

  // 2. Calculate annual mileage
  let annualMileage = 15000;
  if (car.year && car.mileage) {
    const carAgeYears = Math.max(1, new Date().getFullYear() - car.year);
    annualMileage = car.mileage / carAgeYears;
  }

  // 3. Calculate insurance
  let insuranceMultiplier = 1.0;
  if (annualMileage > 20000) insuranceMultiplier += 0.2;
  else if (annualMileage > 15000) insuranceMultiplier += 0.1;
  if (currentValue > 100000) insuranceMultiplier += 0.3;
  else if (currentValue > 50000) insuranceMultiplier += 0.15;
  
  let annualInsurance = ANNUAL_COST_ESTIMATES.insurance[category]?.avg || 
                        ANNUAL_COST_ESTIMATES.insurance['Mass-Market']?.avg || 1400;
  annualInsurance = annualInsurance * insuranceMultiplier;
  const insuranceCost = annualInsurance * 5;

  // 4. Calculate fuel cost
  let fuelEfficiency = 12;
  switch (category) {
    case 'SUV':
    case 'Truck':
      fuelEfficiency = 8;
      break;
    case 'Sedan':
    case 'Hatchback':
      fuelEfficiency = 14;
      break;
    case 'Coupe':
      fuelEfficiency = 10;
      break;
    case 'Luxury':
      fuelEfficiency = 9;
      break;
    case 'Supercar':
      fuelEfficiency = 6;
      break;
  }
  
  if (fuelType === 'Diesel') fuelEfficiency *= 1.2;
  else if (fuelType === 'Hybrid') fuelEfficiency *= 1.4;
  else if (fuelType === 'Electric') fuelEfficiency = 0;
  
  let annualFuelCost = 0;
  if (fuelType === 'Electric') {
    annualFuelCost = (annualMileage / 100) * 15 * 0.15;
  } else {
    const fuelPricePerLiter = fuelType === 'Diesel' ? 0.90 : 1.0;
    const annualConsumptionLiters = annualMileage / fuelEfficiency;
    annualFuelCost = annualConsumptionLiters * fuelPricePerLiter;
  }
  const fuelCost = annualFuelCost * 5;

  // 5. Calculate maintenance
  let maintenanceMultiplier = 1.0;
  if (annualMileage > 20000) maintenanceMultiplier += 0.3;
  else if (annualMileage > 15000) maintenanceMultiplier += 0.15;
  if (carAge > 5) maintenanceMultiplier += 0.2;
  else if (carAge > 3) maintenanceMultiplier += 0.1;
  
  let annualMaintenance = ANNUAL_COST_ESTIMATES.maintenance[category]?.avg || 
                          ANNUAL_COST_ESTIMATES.maintenance['Mass-Market']?.avg || 750;
  annualMaintenance = annualMaintenance * maintenanceMultiplier;
  const maintenanceCost = annualMaintenance * 5;

  // 6. Registration fee
  const registrationFee = 0.07 * currentValue;

  const totalCost = depreciation + insuranceCost + fuelCost + maintenanceCost + registrationFee;
  
  return {
    total: Math.round(totalCost),
    breakdown: {
      depreciation: Math.round(depreciation),
      insurance: Math.round(insuranceCost),
      fuel: Math.round(fuelCost),
      maintenance: Math.round(maintenanceCost),
      registration: Math.round(registrationFee),
      annualMileage: Math.round(annualMileage)
    }
  };
};

export const calculateValueScore = (car: Car): number => {
  const featureCount = car.features?.length || 0;
  const safetyFeatures = car.features?.filter((f: string) => FEATURE_METADATA[f]?.category === 'safety').length || 0;
  const highImportanceFeatures = car.features?.filter((f: string) => FEATURE_METADATA[f]?.importance === 'high').length || 0;

  const ageInYears = new Date().getFullYear() - car.year;
  const ageFactor = Math.max(0.5, 1 - (ageInYears * 0.05));
  const mileageFactor = Math.max(0.6, 1 - (car.mileage / 200000));
  const featureValue = featureCount * 1 + safetyFeatures * 2 + highImportanceFeatures * 1.5;
  const priceFactor = Math.max(0.5, 1 - (car.price / 150000));

  const rawScore = ((featureValue * 40) + (ageFactor * 25) + (mileageFactor * 20) + (priceFactor * 15));
  return Math.min(100, Math.max(0, rawScore));
};

export const calculateEnvironmentalScore = (car: Car): number => {
  let baseScore = 0;
  switch(car.type?.toLowerCase()) {
    case 'electric':
      baseScore = 90;
      break;
    case 'hybrid':
      baseScore = 70;
      break;
    case 'diesel':
      baseScore = 40;
      break;
    case 'benzine':
    default:
      baseScore = 30;
      break;
  }

  const ageInYears = new Date().getFullYear() - car.year;
  const ageAdjustment = Math.min(0, -1 * (ageInYears * 1.5));

  let categoryAdjustment = 0;
  switch(car.category?.toLowerCase()) {
    case 'coupe':
    case 'compact':
    case 'hatchback':
      categoryAdjustment = 10;
      break;
    case 'sedan':
      categoryAdjustment = 5;
      break;
    case 'suv':
      categoryAdjustment = -5;
      break;
    case 'truck':
      categoryAdjustment = -10;
      break;
  }

  const hasEfficiencyFeatures = car.features?.some((f: string) =>
    ['auto_start_stop', 'eco_mode', 'regenerative_braking'].includes(f)
  );
  const featureAdjustment = hasEfficiencyFeatures ? 5 : 0;

  const finalScore = baseScore + ageAdjustment + categoryAdjustment + featureAdjustment;
  return Math.min(100, Math.max(0, finalScore));
};