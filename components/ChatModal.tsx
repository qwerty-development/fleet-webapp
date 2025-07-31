'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { ChatbotService, ChatMessage } from '@/services/ChatbotService';
import { createClient } from '@/utils/supabase/client';
import { Car } from '@/types';
import ChatResponse from './ChatResponse';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message extends ChatMessage {
  // Extends ChatMessage with any additional UI-specific properties if needed
  from?: 'user' | 'bot';
  text?: string;
  carData?: Car[];
}

export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      from: 'bot' as const,
      text: "Hi there! 👋 I'm your AI car assistant. I'll help you find the perfect vehicle based on your needs, budget, and preferences. What can I help you with today?",
      timestamp: new Date(),
      message: "Hi there! 👋 I'm your AI car assistant. I'll help you find the perfect vehicle based on your needs, budget, and preferences. What can I help you with today?",
      isUser: false,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const supabase = createClient();

  // Function to fetch car data by IDs
  const fetchCarsByIds = async (carIds: number[]): Promise<Car[]> => {
    if (!carIds || carIds.length === 0) return [];
    
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*, dealerships(id, name, logo, phone, location)')
        .in('id', carIds)
        .eq('status', 'available');
        
      if (error) {
        console.error('Error fetching cars:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception fetching cars:', error);
      return [];
    }
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load conversation history when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load from localStorage directly
      try {
        const saved = localStorage.getItem('ai_chat_messages_web');
        if (saved) {
          const parsed = JSON.parse(saved);
          const restored = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          if (restored.length > 0) {
            setMessages(restored);
          }
        }
      } catch (e) {
        console.log('Failed to load chat history:', e);
        // Keep default welcome message
      }
    }
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    if (scrollViewRef.current && isMountedRef.current) {
      try {
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.log('Scroll error (safe to ignore):', error);
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    console.log('🔄 ChatModal: setIsLoading(true)');
    setIsLoading(true);

    // Add user message immediately to the UI
    const userMsg: Message = {
      id: Date.now().toString(),
      from: 'user' as const,
      text: userMessage,
      timestamp: new Date(),
      message: userMessage,
      isUser: true,
    };
    setMessages(prev => {
      const newMessages = [...prev, userMsg];
      // Save to localStorage
      localStorage.setItem('ai_chat_messages_web', JSON.stringify(newMessages));
      return newMessages;
    });

    try {
      console.log('🔍 ChatModal: Sending message:', userMessage);
      
      // Sync our conversation history to ChatbotService using the new sync method
      // This maintains conversation context without clearing existing history
      const messagesToSync = messages.map(msg => ({
        id: msg.id,
        message: msg.text || msg.message || '',
        isUser: msg.isUser,
        timestamp: msg.timestamp,
        car_ids: msg.car_ids
      }));
      ChatbotService.syncConversationHistory(messagesToSync);
      
      // Use ChatbotService.sendMessageWithContext for proper conversation memory
      const result = await ChatbotService.sendMessageWithContext(userMessage);
      
      console.log('🔍 ChatModal: Service response:', result);
      console.log('🔍 ChatModal: isMountedRef.current:', isMountedRef.current);
      
      // Stop loading immediately - ALWAYS, regardless of mount status
      console.log('✅ ChatModal: About to stop loading (FORCED)');
      setIsLoading(false);
      
      // Process the response and add message - ALWAYS
      if (result.success && result.botMessage) {
        console.log('✅ ChatModal: Valid response, using bot message from service');
        
        // Fetch car data if car_ids are provided
        let carData: Car[] = [];
        if (result.botMessage.car_ids && result.botMessage.car_ids.length > 0) {
          console.log('🚗 ChatModal: Fetching car data for IDs:', result.botMessage.car_ids);
          carData = await fetchCarsByIds(result.botMessage.car_ids);
          console.log('🚗 ChatModal: Fetched car data:', carData.length, 'cars');
        }
        
        // Add bot message directly to state
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          from: 'bot' as const,
          text: result.botMessage.message,
          timestamp: new Date(),
          message: result.botMessage.message,
          isUser: false,
          car_ids: result.botMessage.car_ids || [],
          carData: carData,
        };
        
        console.log('🔍 ChatModal: Creating bot message:', botMsg);
        
        setMessages(prev => {
          const newMessages = [...prev, botMsg];
          console.log('🔍 ChatModal: Updating messages, new count:', newMessages.length);
          // Save to localStorage
          localStorage.setItem('ai_chat_messages_web', JSON.stringify(newMessages));
          return newMessages;
        });
        console.log('🔍 ChatModal: Bot message added to state');
      } else {
        console.error('🔍 ChatModal: Invalid response structure:', { 
          success: result.success, 
          hasBotMessage: !!result.botMessage,
          error: result.error
        });
        
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          from: 'bot' as const,
          text: `Error: ${result.error || 'Invalid response structure'}`,
          timestamp: new Date(),
          message: `Error: ${result.error || 'Invalid response structure'}`,
          isUser: false,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      
      // Log mount status for debugging
      if (isMountedRef.current) {
        console.log('✅ ChatModal: Component is mounted');
      } else {
        console.log('⚠️ ChatModal: Component is NOT mounted, but we processed the response anyway');
      }
    } catch (error) {
      console.error('ChatModal: Error sending message:', error);
      if (isMountedRef.current) {
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          from: 'bot' as const,
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isUser: false,
        };
        setMessages(prev => [...prev, errorMessage]);
        // Stop loading on error
        console.log('🔍 ChatModal: Error occurred – stopping loading');
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      from: 'bot' as const,
      text: "Hi there! 👋 I'm your AI car assistant. I'll help you find the perfect vehicle based on your needs, budget, and preferences. What can I help you with today?",
      timestamp: new Date(),
      message: "Hi there! 👋 I'm your AI car assistant. I'll help you find the perfect vehicle based on your needs, budget, and preferences. What can I help you with today?",
      isUser: false,
    };
    
    // Clear the local UI state
    setMessages([welcomeMessage]);
    localStorage.setItem('ai_chat_messages_web', JSON.stringify([welcomeMessage]));
    
    // Clear the ChatbotService conversation history as well
    ChatbotService.clearConversationHistory();
    
    // Stop any loading state
    setIsLoading(false);
    console.log('🔍 ChatModal: Conversation and chat history cleared');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-gray-900 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Assistant
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Here to help you find cars
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Clear Chat Button */}
            <button
              onClick={clearConversation}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div 
          ref={scrollViewRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {message.isUser ? (
                // User message
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-orange-600 text-white rounded-lg px-4 py-2">
                    <p className="text-sm">{message.text || message.message || ''}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                // AI message
                <div className="max-w-full">
                  <ChatResponse
                    aiResponse={{
                      message: message.text || message.message || '',
                      car_ids: message.car_ids || []
                    }}
                    cars={message.carData || []}
                    isLoading={false}
                    onCarPress={(car) => {
                      // Navigate to car detail page
                      window.location.href = `/cars/${car.id}`;
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          ))}
          
          {/* Loading message */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-full">
                <ChatResponse
                  aiResponse={{
                    message: '',
                    car_ids: []
                  }}
                  cars={[]}
                  isLoading={true}
                  onCarPress={() => {}}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className={`flex space-x-2 transition-all duration-200 ${inputFocused ? 'scale-105' : ''}`}>
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask me about cars..."
                className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                rows={inputText.split('\n').length || 1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="flex items-center justify-center w-10 h-10 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {/* Conversation stats */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            {messages.length} messages • Press Enter to send
          </div>
        </div>
      </div>
    </div>
  );
}