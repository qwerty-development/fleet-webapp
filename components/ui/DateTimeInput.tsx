// components/ui/DateTimeInput.tsx
// Reusable datetime input component with timezone handling and validation

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  min?: string;
  max?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  placeholder?: string;
}

export default function DateTimeInput({
  label,
  value,
  onChange,
  onClear,
  min,
  max,
  error,
  required = false,
  disabled = false,
  helperText,
  placeholder = 'Select date and time',
}: DateTimeInputProps) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-400 mb-1">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 text-white transition-colors ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-gray-600 focus:ring-indigo-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        
        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
            title="Clear date"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Helper text or error message */}
      {(helperText || error) && (
        <p className={`text-xs mt-1 ${error ? 'text-rose-400' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
      
      {/* Timezone note */}
      {!error && !helperText && (
        <p className="text-xs text-gray-500 mt-1">
          Times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
        </p>
      )}
    </div>
  );
}
