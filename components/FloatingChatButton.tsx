'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import ChatModal from './ChatModal';

/**
 * FloatingChatButton
 * ----------------
 * Global floating action button that opens the AI chat assistant in a modal.
 * This component is intended to be rendered once at the root layout
 * so it appears on all pages where needed.
 * Hidden on certain pages to avoid interfering with other interfaces.
 */
export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Check if we should hide the chat button on certain pages
  const shouldHide = () => {
    // Hide on autoclips pages, admin pages, and auth pages
    return (
      pathname.includes('/autoclips') ||
      pathname.includes('/admin') ||
      pathname.includes('/auth') ||
      pathname.includes('/signin') ||
      pathname.includes('/signup')
    );
  };

  // Hide the chat button on certain pages
  if (shouldHide()) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        aria-label="Open AI Chat Assistant"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
        
        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-sm py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          AI Assistant
        </div>
      </button>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}