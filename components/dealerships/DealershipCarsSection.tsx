import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from "@/utils/supabase/client";

// Define the Car interface if not imported
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  images?: string[];
  dealership_id: number | string;
  status: string;
}

interface DealershipCarsSectionProps {
  dealershipID?: number | string;
  currentCarId?: string;
}

const DealershipCarsSection: React.FC<DealershipCarsSectionProps> = ({ dealershipID, currentCarId }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't attempt to fetch if no dealershipID is provided
    if (dealershipID === undefined || dealershipID === null) {
      console.log("No dealershipID provided to DealershipCarsSection");
      setLoading(false);
      setError("No dealership ID provided");
      return;
    }

    console.log("Fetching cars for dealership ID:", dealershipID, "Type:", typeof dealershipID);
    
    const fetchCars = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        // Use the exact ID as provided, don't convert formats
        let query = supabase
          .from('cars')
          .select('*')
          .eq('dealership_id', dealershipID)
          .eq('status', 'available'); // Only fetch available cars
        
        // Only exclude current car if currentCarId is provided
        if (currentCarId) {
          query = query.neq('id', currentCarId);
        }

        // Limit to a reasonable number to avoid performance issues
        query = query.limit(8);

        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          console.error('Error fetching dealership cars:', supabaseError);
          setError(supabaseError.message);
          setLoading(false);
          return;
        }
        
        console.log(`Found ${data?.length || 0} cars for dealership ID ${dealershipID}`);
        setCars(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Exception when fetching cars:', err);
        setError('Failed to load cars');
        setLoading(false);
      }
    };

    fetchCars();
  }, [dealershipID, currentCarId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        <span className="ml-2 text-white">Loading cars...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 p-4">Error: {error}</p>;
  }

  if (!cars.length) {
    return <p className="mt-8 text-center text-gray-400">No cars available from this dealership at the moment.</p>;
  }

  return (
    <section className="mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cars.map((car) => (
          <Link key={car.id} href={`/cars/${car.id}`}>
            <div className="bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full">
              {/* Car Image */}
              <div className="relative h-40">
                <img
                  src={car.images && car.images.length ? car.images[0] : '/placeholder-car.jpg'}
                  alt={`${car.make} ${car.model}`}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder-car.jpg';
                  }}
                />
              </div>
              {/* Car Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-100">
                  {car.year} {car.make} {car.model}
                </h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-300">
                    {car.mileage > 0 ? `${(car.mileage / 1000).toFixed(1)}k km` : 'New'}
                  </span>
                  <span className="font-semibold text-accent">
                    ${car.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default DealershipCarsSection;