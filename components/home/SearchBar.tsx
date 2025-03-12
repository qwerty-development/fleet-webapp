'use client';

import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  onFilterPress?: () => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearch,
  onFilterPress,
  className = "",
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Update local state when prop changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting search for:", localQuery);
    onSearch(localQuery);
  };

  const handleClear = () => {
    setLocalQuery('');
    onSearch('');
  };

  return (
    <div className={`flex items-center w-full ${className}`}>
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="relative">
          {/* Search icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          <input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            placeholder="Search..."
            className="w-full py-3 pl-12 pr-12 bg-gray-800 border border-gray-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-accent"
          />
          
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <button 
            type="submit" 
            className="hidden"
          >
            Submit
          </button>
        </div>
      </form>
      
      
    </div>
  );
};

export default SearchBar;