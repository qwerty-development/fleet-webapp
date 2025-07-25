"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  TagIcon,
  ChevronUpDownIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";
import { getLogoUrl } from "@/utils/getLogoUrl";



// Items per page for pagination
const ITEMS_PER_PAGE = 20;

interface CarMakeModelTrim {
  id: string;
  make: string;
  model: string;
  trim: string[] | null;
}

// Enhanced Searchable Select Component for Makes
interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search makes...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [displayValue, setDisplayValue] = useState("");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Update display value when value prop changes
  useEffect(() => {
    setDisplayValue(value || "");
  }, [value]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    const allOptions = ["", ...options]; // Include "All Makes" option
    if (!searchTerm) return allOptions;
    
    return allOptions.filter(option => {
      if (option === "") return "All Makes".toLowerCase().includes(searchTerm.toLowerCase());
      return option.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm]);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case "Tab":
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (option: string) => {
    onChange(option);
    setDisplayValue(option);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setDisplayValue(newValue);
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm(displayValue);
  };

  const handleClear = () => {
    onChange("");
    setDisplayValue("");
    setSearchTerm("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const getDisplayText = (option: string) => {
    return option === "" ? "All Makes" : option;
  };

  const getOptionIcon = (option: string) => {
    if (option === "") {
      return (
        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
          <span className="text-xs text-gray-300">All</span>
        </div>
      );
    }
    
    return (
      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
        <img
          src={getLogoUrl(option, true)}
          alt={`${option} logo`}
          className="w-5 h-5 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-xs text-white font-bold">${option.charAt(0).toUpperCase()}</span>`;
            }
          }}
        />
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`} style={{ zIndex: 1000 }}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (displayValue || "")}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={value ? getDisplayText(value) : placeholder}
          className="w-full px-4 py-2.5 pr-10 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-600 rounded transition-colors"
              title="Clear selection"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-600 rounded transition-colors"
          >
            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-2xl max-h-60 overflow-auto">
          <div ref={optionsRef}>
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-gray-400 text-sm">
                No makes found matching "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option || "all"}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-3 cursor-pointer flex items-center space-x-3 transition-colors ${
                    index === highlightedIndex
                      ? "bg-indigo-600 text-white"
                      : "text-gray-200 hover:bg-gray-600"
                  }`}
                >
                  {getOptionIcon(option)}
                  <span className="flex-1">{getDisplayText(option)}</span>
                  {value === option && (
                    <CheckIcon className="h-4 w-4 text-indigo-400" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Trim Badge Component
const TrimBadge: React.FC<{ trim: string; onRemove?: () => void; isEditable?: boolean }> = ({ 
  trim, 
  onRemove, 
  isEditable = false 
}) => (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
    {trim}
    {isEditable && onRemove && (
      <button
        onClick={onRemove}
        className="ml-1 hover:text-indigo-100 transition-colors"
        type="button"
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    )}
  </span>
);

// Trim Manager Component
const TrimManager: React.FC<{
  trims: string[];
  onChange: (trims: string[]) => void;
  placeholder?: string;
}> = ({ trims, onChange, placeholder = "Add trim..." }) => {
  const [newTrim, setNewTrim] = useState("");

  const handleAddTrim = () => {
    const trimmedValue = newTrim.trim();
    if (trimmedValue && !trims.includes(trimmedValue)) {
      onChange([...trims, trimmedValue]);
      setNewTrim("");
    }
  };

  const handleRemoveTrim = (indexToRemove: number) => {
    onChange(trims.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTrim();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTrim}
          onChange={(e) => setNewTrim(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
        />
        <button
          type="button"
          onClick={handleAddTrim}
          disabled={!newTrim.trim() || trims.includes(newTrim.trim())}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      
      {trims.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trims.map((trim, index) => (
            <TrimBadge
              key={index}
              trim={trim}
              onRemove={() => handleRemoveTrim(index)}
              isEditable
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CarMakesModelsAdmin() {
  const supabase = createClient();
  
  // State variables
  const [carMakesModels, setCarMakesModels] = useState<CarMakeModelTrim[]>([]);
  const [uniqueMakes, setUniqueMakes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("make");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<CarMakeModelTrim | null>(null);
  const [newMake, setNewMake] = useState<string>("");
  const [newModel, setNewModel] = useState<string>("");
  const [newTrims, setNewTrims] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Fetch car makes and models with filters
  const fetchCarMakesModels = useCallback(async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('allcars')
        .select('*', { count: 'exact' });
      
      // Apply make filter
      if (selectedMake) {
        query = query.eq('make', selectedMake);
      }
      
      // Apply search filter
      if (searchQuery) {
        query = query.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, count, error } = await query.range(from, to);
      
      if (error) throw error;
      
      setCarMakesModels(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error: any) {
      console.error("Error fetching car makes/models:", error);
      alert(`Failed to fetch data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMake, searchQuery, sortBy, sortOrder, currentPage, supabase]);
  
  // Fetch unique makes for the filter dropdown with proper pagination
  const fetchUniqueMakes = useCallback(async () => {
    try {
      let allMakes: any[] = [];
      let hasMore = true;
      let offset = 0;
      const limit = 1000;

      // Fetch all makes with pagination to avoid missing any due to default limits
      while (hasMore) {
        const { data, error, count } = await supabase
          .from('allcars')
          .select('make', { count: 'exact' })
          .range(offset, offset + limit - 1)
          .order('make');

        if (error) throw error;

        if (data && data.length > 0) {
          allMakes = [...allMakes, ...data];
          offset += limit;
          hasMore = data.length === limit; // Continue if we got a full batch
        } else {
          hasMore = false;
        }

        // Safety check to prevent infinite loops
        if (offset > 50000) {
          console.warn('Stopped fetching after 50k records to prevent infinite loop');
          break;
        }
      }

      console.log(`Fetched ${allMakes.length} total make records`);

      // Process and clean the makes data
      const uniqueMakes = [...new Set(
        allMakes
          .map(item => item.make)
          .filter(make => make && typeof make === 'string' && make.trim().length > 0) // Filter out null, undefined, empty strings
          .map(make => make.trim()) // Remove leading/trailing spaces
          .filter(make => make.length > 0) // Double-check for empty strings after trimming
      )]
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); // Sort alphabetically, case-insensitive

      console.log(`Processed to ${uniqueMakes.length} unique makes:`, uniqueMakes.slice(0, 10), '...');

      if (uniqueMakes.length === 0) {
        console.warn('No valid makes found in database');
        setUniqueMakes([]);
        return;
      }

      setUniqueMakes(uniqueMakes);
    } catch (error: any) {
      console.error("Error fetching unique makes:", error);
      setUniqueMakes([]);
    }
  }, [supabase]);
  
  useEffect(() => {
    fetchCarMakesModels();
    fetchUniqueMakes();
  }, [fetchCarMakesModels, fetchUniqueMakes]);
  
  // Handle search input changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);
  
  // Handle search form submission
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCarMakesModels();
  }, [fetchCarMakesModels]);
  
  // Handle make filter change
  const handleMakeChange = useCallback((value: string) => {
    setSelectedMake(value);
    setCurrentPage(1);
  }, []);
  
  // Handle sort change
  const handleSortChange = useCallback((field: string) => {
    setSortBy(field);
    setSortOrder(prev => (sortBy === field ? (prev === "asc" ? "desc" : "asc") : "asc"));
    setCurrentPage(1);
  }, [sortBy]);
  
  // Pagination handlers
  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);
  
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);
  
  // Add new make/model/trims
  const handleAddItem = useCallback(async () => {
    if (!newMake || !newModel) {
      alert("Please enter both make and model");
      return;
    }
    
    try {
      const insertData = {
        make: newMake.trim(),
        model: newModel.trim(),
        trim: newTrims.length > 0 ? newTrims : null
      };

      const { data, error } = await supabase
        .from('allcars')
        .insert([insertData])
        .select();
      
      if (error) throw error;
      
      // Refresh data
      fetchCarMakesModels();
      fetchUniqueMakes();
      
      // Reset form
      setNewMake("");
      setNewModel("");
      setNewTrims([]);
      setIsAddModalOpen(false);
      
      alert("Make, model, and trims added successfully!");
    } catch (error: any) {
      console.error("Error adding item:", error);
      alert(`Failed to add item: ${error.message}`);
    }
  }, [newMake, newModel, newTrims, fetchCarMakesModels, fetchUniqueMakes, supabase]);
  
  // Edit make/model/trims
  const handleUpdateItem = useCallback(async () => {
    if (!selectedItem || !newMake || !newModel) {
      alert("Please enter both make and model");
      return;
    }
    
    try {
      const updateData = {
        make: newMake.trim(),
        model: newModel.trim(),
        trim: newTrims.length > 0 ? newTrims : null
      };

      const { error } = await supabase
        .from('allcars')
        .update(updateData)
        .eq('id', selectedItem.id);
      
      if (error) throw error;
      
      // Refresh data
      fetchCarMakesModels();
      fetchUniqueMakes();
      
      // Reset form
      setNewMake("");
      setNewModel("");
      setNewTrims([]);
      setSelectedItem(null);
      setIsEditModalOpen(false);
      
      alert("Make, model, and trims updated successfully!");
    } catch (error: any) {
      console.error("Error updating item:", error);
      alert(`Failed to update item: ${error.message}`);
    }
  }, [selectedItem, newMake, newModel, newTrims, fetchCarMakesModels, fetchUniqueMakes, supabase]);
  
  // Delete make/model
  const handleDeleteItem = useCallback(async (id: string) => {
    if (confirm("Are you sure you want to delete this make/model? This action cannot be undone.")) {
      try {
        const { error } = await supabase
          .from('allcars')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh data
        fetchCarMakesModels();
        fetchUniqueMakes();
        
        alert("Item deleted successfully!");
      } catch (error: any) {
        console.error("Error deleting item:", error);
        alert(`Failed to delete item: ${error.message}`);
      }
    }
  }, [fetchCarMakesModels, fetchUniqueMakes, supabase]);
  
  // Open edit modal
  const openEditModal = useCallback((item: CarMakeModelTrim) => {
    setSelectedItem(item);
    setNewMake(item.make);
    setNewModel(item.model);
    setNewTrims(item.trim || []);
    setIsEditModalOpen(true);
  }, []);
  
  // Export to CSV
  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const allData: CarMakeModelTrim[] = [];
      let hasMore = true;
      let offset = 0;
      const limit = 1000;

      while (hasMore) {
        let query = supabase
          .from('allcars')
          .select('*');
        
        if (selectedMake) {
          query = query.eq('make', selectedMake);
        }
        
        if (searchQuery) {
          query = query.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`);
        }
        
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        
        const { data, error } = await query.range(offset, offset + limit - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData.push(...data);
          offset += limit;
          hasMore = data.length === limit;
        } else {
          hasMore = false;
        }

        // Safety break to prevent infinite loops on unexpected data
        if (offset > 50000) {
          console.warn("Export process stopped after fetching 50,000 records to prevent excessive load.");
          break;
        }
      }
      
      // Convert to CSV
      const headers = ['id', 'make', 'model', 'trims'];
      
      const csvData = allData.map((item: any) => 
        headers.map(header => {
          let value = item[header];
          
          // Handle trim array
          if (header === 'trims') {
            value = item.trim ? item.trim.join('; ') : '';
          }
          
          // Wrap in quotes if necessary
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value !== null && value !== undefined ? value : '';
        }).join(',')
      );
      
      const csv = [headers.join(','), ...csvData].join('\n');
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `car_makes_models_trims_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error exporting data:", error);
      alert(`Failed to export data: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [selectedMake, searchQuery, sortBy, sortOrder, supabase]);
  
  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedMake('');
    setCurrentPage(1);
  }, []);

  // Reset modal state
  const resetModalState = useCallback(() => {
    setNewMake("");
    setNewModel("");
    setNewTrims([]);
    setSelectedItem(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />
      
      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-white">Car Makes, Models & Trims</h1>
              <p className="text-gray-400">Manage the database of car makes, models, and trim levels</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Add Make/Model/Trims
              </button>
              
              <button
                onClick={exportToCSV}
                disabled={isExporting}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 mb-6 relative z-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative md:col-span-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by make or model..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>
              
              {/* Enhanced Searchable Make Filter */}
              <SearchableSelect
                options={uniqueMakes}
                value={selectedMake}
                onChange={handleMakeChange}
                placeholder="Search makes..."
              />
              
              {/* Action Buttons */}
              <div className="flex gap-2 md:col-span-3">
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-1.5" />
                  Search
                </button>
                
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 mr-1.5" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* Current Filter Display */}
          {(selectedMake || searchQuery) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-gray-400 text-sm">Active filters:</span>
              {selectedMake && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-sm border border-indigo-500/30">
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                    <img
                      src={getLogoUrl(selectedMake, true)}
                      alt={`${selectedMake} logo`}
                      className="w-3 h-3 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-xs text-white font-bold">${selectedMake.charAt(0).toUpperCase()}</span>`;
                        }
                      }}
                    />
                  </div>
                  <span>Make: {selectedMake}</span>
                  <button
                    onClick={() => setSelectedMake("")}
                    className="hover:text-indigo-100 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              )}
              {searchQuery && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-600/20 text-emerald-300 rounded-full text-sm border border-emerald-500/30">
                  <MagnifyingGlassIcon className="h-3 w-3" />
                  <span>Search: "{searchQuery}"</span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-emerald-100 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Makes, Models, and Trims Table */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl overflow-hidden mb-6 relative z-10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('make')}
                    >
                      <div className="flex items-center">
                        <span>Make</span>
                        {sortBy === 'make' && (
                          sortOrder === 'asc' ? 
                            <ChevronUpIcon className="ml-1 w-4 h-4" /> : 
                            <ChevronDownIcon className="ml-1 w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('model')}
                    >
                      <div className="flex items-center">
                        <span>Model</span>
                        {sortBy === 'model' && (
                          sortOrder === 'asc' ? 
                            <ChevronUpIcon className="ml-1 w-4 h-4" /> : 
                            <ChevronDownIcon className="ml-1 w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <TagIcon className="h-4 w-4 mr-1" />
                        Trims
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                        <p className="mt-2 text-gray-400">Loading data...</p>
                      </td>
                    </tr>
                  ) : carMakesModels.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-gray-400">No car makes/models found matching your filters.</p>
                        <button
                          onClick={clearFilters}
                          className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    carMakesModels.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-700/40">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-full w-full rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                                {item.make && (
                                  <>
                                    <img
                                      src={getLogoUrl(item.make, true)}
                                      alt={`${item.make} logo`}
                                      className="h-8 w-8 object-contain"
                                      onError={(e) => {
                                        // If logo fails to load, show first letter of make
                                        (e.target as HTMLImageElement).style.display = "none";
                                        const nextSibling = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                        if (nextSibling) {
                                          nextSibling.textContent = item.make?.charAt(0).toUpperCase() || "C";
                                          nextSibling.classList.remove("hidden");
                                        }
                                      }}
                                    />
                                    <span className="hidden text-white text-lg font-bold">
                                      {item.make?.charAt(0).toUpperCase() || "C"}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{item.make}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{item.model}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {item.trim && item.trim.length > 0 ? (
                              item.trim.map((trim, index) => (
                                <TrimBadge key={index} trim={trim} />
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm italic">No trims</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {carMakesModels.length > 0 && (
            <div className="flex justify-between items-center py-4">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-lg text-sm shadow-sm ${
                  currentPage === 1 
                    ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600/90 hover:bg-indigo-600 text-white'
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>
              <span className="text-gray-300 text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center px-4 py-2 rounded-lg text-sm shadow-sm ${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600/90 hover:bg-indigo-600 text-white'
                }`}
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Make/Model/Trims Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add New Make/Model/Trims</h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetModalState();
                }}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label htmlFor="newMake" className="block text-sm font-medium text-gray-300 mb-1">
                    Make*
                  </label>
                  <input
                    type="text"
                    id="newMake"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    placeholder="e.g. Toyota"
                  />
                </div>
                
                <div>
                  <label htmlFor="newModel" className="block text-sm font-medium text-gray-300 mb-1">
                    Model*
                  </label>
                  <input
                    type="text"
                    id="newModel"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    placeholder="e.g. Camry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trims (Optional)
                  </label>
                  <TrimManager
                    trims={newTrims}
                    onChange={setNewTrims}
                    placeholder="e.g. LE, XLE, TRD..."
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Add trim levels for this model. Press Enter or click + to add each trim.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetModalState();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  disabled={!newMake || !newModel}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Make/Model/Trims Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Make/Model/Trims</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetModalState();
                }}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label htmlFor="editMake" className="block text-sm font-medium text-gray-300 mb-1">
                    Make*
                  </label>
                  <input
                    type="text"
                    id="editMake"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    placeholder="e.g. Toyota"
                  />
                </div>
                
                <div>
                  <label htmlFor="editModel" className="block text-sm font-medium text-gray-300 mb-1">
                    Model*
                  </label>
                  <input
                    type="text"
                    id="editModel"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    placeholder="e.g. Camry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trims (Optional)
                  </label>
                  <TrimManager
                    trims={newTrims}
                    onChange={setNewTrims}
                    placeholder="e.g. LE, XLE, TRD..."
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Manage trim levels for this model. Press Enter or click + to add each trim.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    resetModalState();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateItem}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  disabled={!newMake || !newModel}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}