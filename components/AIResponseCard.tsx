'use client';

import React, { useState } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { LightBulbIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

interface AIResponseCardProps {
  message: string;
  carCount?: number;
  isLoading?: boolean;
}

export default function AIResponseCard({ 
  message, 
  carCount = 0, 
  isLoading = false,
}: AIResponseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse the message for better formatting
  const formatMessage = (text: string) => {
    // Split by common patterns and format
    const lines = text.split('\n').filter(line => line.trim());
    const sections: { type: 'text' | 'list' | 'highlight'; content: string[] }[] = [];
    
    let currentSection: { type: 'text' | 'list' | 'highlight'; content: string[] } = { type: 'text', content: [] };
    
    lines.forEach(line => {
      let trimmedLine = line.trim();

      // Strip markdown bold (**text**)
      trimmedLine = trimmedLine.replace(/\*\*/g, '');
 
      // Detect list items (starts with number, bullet, or dash)
      if (/^(\d+\.|\*|\-|•)/.test(trimmedLine)) {
        if (currentSection.type !== 'list') {
          if (currentSection.content.length > 0) {
            sections.push(currentSection);
          }
          currentSection = { type: 'list', content: [] };
        }
        currentSection.content.push(trimmedLine);
      }
      // Detect highlights (contains certain keywords)
      else if (trimmedLine.toLowerCase().includes('recommend') || 
               trimmedLine.toLowerCase().includes('perfect') ||
               trimmedLine.toLowerCase().includes('ideal')) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        sections.push({ type: 'highlight', content: [trimmedLine] });
        currentSection = { type: 'text', content: [] };
      }
      // Regular text
      else {
        if (currentSection.type !== 'text') {
          if (currentSection.content.length > 0) {
            sections.push(currentSection);
          }
          currentSection = { type: 'text', content: [] };
        }
        currentSection.content.push(trimmedLine);
      }
    });
    
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    return sections.length > 0 ? sections : [{ type: 'text', content: [text.replace(/\*\*/g, '')] }];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#232323] rounded-2xl shadow-lg dark:shadow-xl overflow-hidden border dark:border-[#333] max-w-sm">
        {/* Header */}
        <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border-b dark:border-[#333]">
          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-base font-semibold text-gray-900 dark:text-white flex-1">AI Assistant</span>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        {/* Loading Content */}
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 text-center italic">
            Finding the perfect cars for you...
          </p>
        </div>
      </div>
    );
  }

  // Remove markdown bold markers for display
  const sanitizedMessage = message.replace(/\*\*/g, '');
  const messagePreview = sanitizedMessage.split('\n')[0].slice(0, 120);
  const shouldShowExpand = message.length > 120 || message.includes('\n');
  const displayMessage = isExpanded ? sanitizedMessage : messagePreview;
  const formattedSections = formatMessage(displayMessage);

  return (
    <div className="bg-white dark:bg-[#232323] rounded-2xl shadow-lg dark:shadow-xl overflow-hidden border dark:border-[#333] max-w-sm">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border-b dark:border-[#333]">
        <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-base font-semibold text-gray-900 dark:text-white flex-1">AI Assistant</span>
        {carCount > 0 && (
          <div className="bg-orange-600 dark:bg-orange-500 rounded-xl px-2 py-1">
            <span className="text-white text-xs font-semibold">{carCount} cars found</span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="p-4">
        <div className="space-y-3">
          {formattedSections.map((section, index) => (
            <div key={index}>
              {section.type === 'highlight' ? (
                <div className="flex items-start bg-orange-50 dark:bg-orange-900/20 border-l-3 border-orange-500 p-3 rounded-r-lg">
                  <LightBulbIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-orange-800 dark:text-orange-200 font-medium leading-relaxed">
                    {section.content.join(' ')}
                  </p>
                </div>
              ) : section.type === 'list' ? (
                <div className="ml-2">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start mb-2">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 dark:text-gray-200 leading-relaxed flex-1">
                        {item.replace(/^(\d+\.)?(\*|\-|•)?\s*/, '')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                  {section.content.join(' ')}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Expand/Collapse Button */}
        {shouldShowExpand && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-full mt-3 py-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium text-sm transition-colors"
          >
            <span className="mr-1">
              {isExpanded ? 'Show less' : 'Read more...'}
            </span>
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}