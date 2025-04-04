// components/RandomCarCards.tsx
import React, { useEffect, useState } from 'react';
import CarCard, { Car } from './CarCard';
import { createClient } from '@/utils/supabase/client';

const RandomCarCards: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const supabase = createClient();

  const fetchCars = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cars')
      .select('*,dealerships (name,logo,phone,location,latitude,longitude)')
      .eq('status', 'available');
    if (error) {
      console.error('Error fetching cars:', error);
    } else if (data) {
      // Randomize the array and pick 3 cars
      const randomized = data.sort(() => 0.5 - Math.random()).slice(0, 3);
      setCars(randomized as Car[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const changeSlide = (index: number) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Fade out
    const fadeOut = () => {
      setOpacity(0);
      return new Promise(resolve => setTimeout(resolve, 500)); // 500ms fade-out duration
    };
    
    // Change slide and fade in
    const changeAndFadeIn = () => {
      setCurrentIndex(index);
      setTimeout(() => {
        setOpacity(1);
        setTimeout(() => {
          setIsAnimating(false);
        }, 500); // 500ms fade-in duration
      }, 50); // Small delay between fade-out and fade-in
    };
    
    fadeOut().then(changeAndFadeIn);
  };

  // Set up auto-slide every 5 seconds
  useEffect(() => {
    if (!loading && cars.length > 0) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % cars.length;
        changeSlide(nextIndex);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [loading, cars, currentIndex, isAnimating]);

  const handleDotClick = (index: number) => {
    if (index !== currentIndex) {
      changeSlide(index);
    }
  };

  if (loading) return <div className="text-white">Loading cars...</div>;
  if (!cars.length) return <div className="text-white">No available cars found.</div>;

  return (
    <div className="relative bg-neutral-900 w-full h-full rounded-3xl">
      <div 
        className="transition-opacity duration-500 ease-in-out" 
        style={{ opacity: opacity }}
      >
        {cars.length > 0 && <CarCard car={cars[currentIndex]} />}
      </div>
      
      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
        {cars.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white w-4' : 'bg-gray-500'
            }`}
            onClick={() => handleDotClick(index)}
            aria-label={`View car ${index + 1}`}
            disabled={isAnimating}
          />
        ))}
      </div>
    </div>
  );
};

export default RandomCarCards;