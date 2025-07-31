export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  car_ids?: number[];
}

export interface ChatbotAPIResponse {
  success: boolean;
  data?: {
    message: string;
    car_ids: number[];
  };
  error?: string;
  message?: string;
}

/**
 * Service for chatbot communication and message management
 */
export class ChatbotService {
  // Configure your AI backend URL here
  private static readonly API_BASE_URL = 'https://ai-python-ashy.vercel.app';
  private static readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  
  // Store conversation history in memory (in production, you might want to use localStorage)
  private static conversationHistory: ChatMessage[] = [];
  
  // Store current request controller for abortion
  private static currentController: AbortController | null = null;
  
  // Initialize conversation history from localStorage on first use
  private static isInitialized = false;
  
  /**
   * Initialize the service and load conversation history
   */
  private static initialize(): void {
    if (!this.isInitialized) {
      this.loadConversationHistory();
      this.isInitialized = true;
    }
  }
  
  /**
   * Get the full conversation history
   */
  static getConversationHistory(): ChatMessage[] {
    this.initialize(); // Ensure initialized before returning history
    return [...this.conversationHistory];
  }
  
  /**
   * Clear conversation history and abort any ongoing request
   */
  static clearConversationHistory(): void {
    // Abort any ongoing request
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
    
    this.conversationHistory = [];
    // Clear from localStorage too
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_chat_messages');
    }
  }
  
  /**
   * Abort current request if any
   */
  static abortCurrentRequest(): void {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
  }
  
  /**
   * Add a message to conversation history
   */
  static addMessage(message: string, isUser: boolean, car_ids?: number[]): ChatMessage {
    this.initialize(); // Ensure initialized before adding messages
    
    const chatMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      isUser,
      timestamp: new Date(),
      car_ids
    };
    
    this.conversationHistory.push(chatMessage);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_chat_messages', JSON.stringify(this.conversationHistory));
    }
    
    return chatMessage;
  }
  
  /**
   * Load conversation history from localStorage
   */
  static loadConversationHistory(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ai_chat_messages');
        if (saved) {
          const parsed: ChatMessage[] = JSON.parse(saved);
          // Restore Date objects for timestamps
          this.conversationHistory = parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      } catch (e) {
        console.log('Failed to load chat history', e);
      }
    }
  }
  
  /**
   * Send message to chatbot and get response
   */
  static async sendMessage(userMessage: string): Promise<{
    success: boolean;
    userMessage: ChatMessage;
    botMessage?: ChatMessage;
    error?: string;
  }> {
    this.initialize(); // Ensure initialized before sending messages
    
    console.log('🔍 Starting sendMessage function');
    
    // Input validation
    if (!userMessage?.trim()) {
      console.log('❌ Empty message detected');
      return {
        success: false,
        userMessage: this.addMessage(userMessage, true),
        error: 'Empty message'
      };
    }

    console.log('🔍 Message validation passed:', userMessage.trim());
    
    try {
      console.log('🤖 Sending message to chatbot API...');
      console.log('🔍 API URL:', this.API_BASE_URL);
      console.log('🔍 Message:', userMessage.trim());
      
      // Add user message to history first
      const userChatMessage = this.addMessage(userMessage.trim(), true);
      console.log('🔍 User message added to history');
      
      // Prepare request body
      const requestBody = JSON.stringify({
        message: userMessage.trim()
      });
      console.log('🔍 Request body:', requestBody);
      
      // Create abort controller for timeout
      this.currentController = new AbortController();
      const timeoutId = setTimeout(() => {
        if (this.currentController) {
          this.currentController.abort();
        }
      }, this.REQUEST_TIMEOUT);
      
      const response = await fetch(`${this.API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: requestBody,
        signal: this.currentController.signal,
      });
      
      clearTimeout(timeoutId);
      this.currentController = null; // Clear reference after completion
      
      console.log('🔍 Fetch completed, response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      // Check if response is ok
      if (!response.ok) {
        console.log('❌ Response not ok, attempting to read error text...');
        let errorText = 'Unknown error';
        try {
          errorText = await response.text();
          console.log('🔍 Error response text:', errorText);
        } catch (textError) {
          console.log('❌ Failed to read error text:', textError);
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      // Parse JSON response with error handling
      console.log('🔍 About to read response text...');
      const responseText = await response.text();
      console.log('🔍 Response text received, length:', responseText.length);
      console.log('🔍 Response text preview:', responseText.substring(0, 200));
      
      let apiResult: ChatbotAPIResponse;
      try {
        console.log('🔍 About to parse JSON...');
        apiResult = JSON.parse(responseText);
        console.log('🔍 JSON parsed successfully:', apiResult);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('🔍 Raw response that failed to parse:', responseText);
        throw new Error('Invalid JSON response from server');
      }
      
      // Validate API response structure
      console.log('🔍 Validating API response structure...');
      if (!apiResult || typeof apiResult.success !== 'boolean') {
        console.log('❌ Invalid API response format:', apiResult);
        throw new Error('Invalid API response format');
      }
      
      if (!apiResult.success || !apiResult.data) {
        console.log('❌ API returned error:', apiResult.error || apiResult.message);
        throw new Error(apiResult.error || apiResult.message || 'Chatbot API failed');
      }

      // Validate response data
      if (!apiResult.data.message || typeof apiResult.data.message !== 'string') {
        console.log('❌ Invalid message in API response:', apiResult.data);
        throw new Error('Invalid message in API response');
      }

      console.log('✅ Chatbot response received successfully');
      console.log('🔍 Bot message:', apiResult.data.message);

      // Add bot response to history
      const botMessage = this.addMessage(
        apiResult.data.message, 
        false, 
        Array.isArray(apiResult.data.car_ids) ? apiResult.data.car_ids : []
      );

      console.log('🔍 Bot message added to history, returning success');

      return {
        success: true,
        userMessage: userChatMessage,
        botMessage,
      };

    } catch (error) {
      // Clear the controller reference
      this.currentController = null;
      
      console.error('❌ Chatbot API call failed:', error);
      console.log('🔍 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      
      let errorMessage = 'Sorry, I\'m having trouble connecting to the chatbot service. Please try again later.';
      
      // Provide more specific error messages
      if (error instanceof Error) {
        console.log('🔍 Error is instance of Error');
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorMessage = 'The request timed out. Please check your internet connection and try again.';
          console.log('🔍 Timeout error detected');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
          console.log('🔍 Network error detected');
        } else if (error.message.includes('JSON')) {
          errorMessage = 'Received invalid response from server. Please try again.';
          console.log('🔍 JSON error detected');
        }
      }
      
      console.log('🔍 Adding error message to chat:', errorMessage);
      
      // Add error response to history
      const botMessage = this.addMessage(errorMessage, false);
      
      return {
        success: false,
        userMessage: this.addMessage(userMessage.trim(), true),
        botMessage,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Send conversation context to chatbot with dealership-like memory (last 5 messages)
   */
  static async sendMessageWithContext(userMessage: string): Promise<{
    success: boolean;
    userMessage: ChatMessage;
    botMessage?: ChatMessage;
    error?: string;
  }> {
    this.initialize(); // Ensure initialized before sending messages with context
    
    // Input validation
    if (!userMessage?.trim()) {
      return {
        success: false,
        userMessage: this.addMessage(userMessage, true),
        error: 'Empty message'
      };
    }

    try {
      console.log('🤖 Sending message with dealership conversation context...');
      
      // Add user message to history first
      const userChatMessage = this.addMessage(userMessage.trim(), true);
      
      // Get last 5 messages for conversation memory (like a dealership conversation)
      const recentMessages = this.getRecentContext(5)
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.message
        }));
      
      // Create a dealership-focused prompt with conversation context
      let contextualPrompt = `You are a professional car dealership assistant helping customers find their perfect car. You have access to a comprehensive car database and should provide personalized recommendations.

IMPORTANT INSTRUCTIONS:
- Maintain conversation context and remember what the customer mentioned previously
- Ask follow-up questions to understand their specific needs (budget, car type, features, etc.)
- When recommending cars, provide EXACTLY 5-8 car recommendations maximum
- Focus on matching customer preferences from the conversation
- Be friendly, professional, and helpful like a real dealership salesperson
- If asked about specific features, explain how they benefit the customer

`;

      // Add conversation history if available
      if (recentMessages.length > 0) {
        contextualPrompt += `RECENT CONVERSATION CONTEXT:\n`;
        recentMessages.forEach(msg => {
          contextualPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
        });
        contextualPrompt += `\nCURRENT CUSTOMER MESSAGE: ${userMessage.trim()}\n\n`;
      } else {
        contextualPrompt += `CUSTOMER MESSAGE: ${userMessage.trim()}\n\n`;
      }

      contextualPrompt += `Based on the conversation context above, respond as a helpful car dealership assistant. If recommending cars, provide car_ids in your response data.

Your response should be conversational, reference previous messages when relevant, and help guide the customer toward finding their ideal car.`;

      // Use regular fetch for web
      this.currentController = new AbortController();
      const timeoutId = setTimeout(() => {
        if (this.currentController) {
          this.currentController.abort();
        }
      }, this.REQUEST_TIMEOUT);
      
      const response = await fetch(`${this.API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: contextualPrompt
        }),
        signal: this.currentController.signal,
      });

      clearTimeout(timeoutId);
      this.currentController = null; // Clear reference after completion

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      // Parse JSON response with error handling
      let apiResult: ChatbotAPIResponse;
      try {
        const responseText = await response.text();
        apiResult = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }
      
      if (!apiResult || typeof apiResult.success !== 'boolean') {
        throw new Error('Invalid API response format');
      }
      
      if (!apiResult.success || !apiResult.data) {
        throw new Error(apiResult.error || apiResult.message || 'Chatbot API failed');
      }

      if (!apiResult.data.message || typeof apiResult.data.message !== 'string') {
        throw new Error('Invalid message in API response');
      }

      console.log('✅ Contextual dealership response received successfully');

      // Add bot response to history
      const botMessage = this.addMessage(
        apiResult.data.message, 
        false, 
        Array.isArray(apiResult.data.car_ids) ? apiResult.data.car_ids : []
      );

      return {
        success: true,
        userMessage: userChatMessage,
        botMessage,
      };

    } catch (error) {
      // Clear the controller reference
      this.currentController = null;
      
      console.error('❌ Contextual dealership chat failed:', error);
      
      let errorMessage = 'I apologize, but I\'m having trouble connecting to our system right now. Please try again in a moment, and I\'ll be happy to help you find the perfect car.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorMessage = 'The connection is taking longer than usual. Please check your internet connection and try again.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'There was an issue processing the response. Please try again.';
        }
      }
      
      // Add error response to history
      const botMessage = this.addMessage(errorMessage, false);
      
      return {
        success: false,
        userMessage: this.addMessage(userMessage.trim(), true),
        botMessage,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Export conversation history for debugging or saving
   */
  static exportConversation(): string {
    this.initialize(); // Ensure initialized before exporting
    
    const conversation = this.conversationHistory
      .map(msg => {
        const timestamp = msg.timestamp.toLocaleString();
        const sender = msg.isUser ? 'User' : 'Bot';
        const carIds = msg.car_ids && msg.car_ids.length > 0 ? ` [Car IDs: ${msg.car_ids.join(', ')}]` : '';
        return `[${timestamp}] ${sender}: ${msg.message}${carIds}`;
      })
      .join('\n\n');
    
    return conversation;
  }
  
  /**
   * Sync external messages to conversation history without clearing existing history
   * This maintains conversation context while allowing UI to manage its own state
   */
  static syncConversationHistory(messages: ChatMessage[]): void {
    this.initialize(); // Ensure initialized before syncing
    
    // Only add messages that don't already exist (by ID)
    const existingIds = new Set(this.conversationHistory.map(msg => msg.id));
    const newMessages = messages.filter(msg => !existingIds.has(msg.id));
    
    if (newMessages.length > 0) {
      this.conversationHistory.push(...newMessages);
      
      // Sort by timestamp to maintain chronological order
      this.conversationHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_chat_messages', JSON.stringify(this.conversationHistory));
      }
    }
  }
  
  /**
   * Get recent conversation context (last N messages) for context-aware responses
   */
  static getRecentContext(maxMessages: number = 5): ChatMessage[] {
    this.initialize(); // Ensure initialized before getting context
    return this.conversationHistory.slice(-maxMessages);
  }
  
  /**
   * Check if conversation history has any messages
   */
  static hasConversationHistory(): boolean {
    this.initialize(); // Ensure initialized before checking
    return this.conversationHistory.length > 0;
  }
  
  /**
   * Get conversation statistics
   */
  static getConversationStats(): {
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    carsRecommended: number;
    uniqueCarIds: number[];
  } {
    this.initialize(); // Ensure initialized before getting stats
    
    const userMessages = this.conversationHistory.filter(msg => msg.isUser).length;
    const botMessages = this.conversationHistory.filter(msg => !msg.isUser).length;
    
    const allCarIds = this.conversationHistory
      .filter(msg => msg.car_ids && msg.car_ids.length > 0)
      .flatMap(msg => msg.car_ids || []);
    
    const uniqueCarIds = Array.from(new Set(allCarIds));
    
    return {
      totalMessages: this.conversationHistory.length,
      userMessages,
      botMessages,
      carsRecommended: allCarIds.length,
      uniqueCarIds
    };
  }
}