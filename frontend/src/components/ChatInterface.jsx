import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { useUserData } from '../contexts/UserDataContext';
import { askQuestion } from '../services/api';

const ChatInterface = () => {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { 
    userProfile, 
    lifestylePlan, 
    chatHistory, 
    addChatMessage 
  } = useUserData();
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim() || isProcessing) return;
    
    // Add user message to chat
    addChatMessage('user', userInput);
    
    // Clear input and set loading state
    setUserInput('');
    setIsProcessing(true);
    
    try {
      // Get response from API
      const result = await askQuestion(userInput, userProfile, lifestylePlan);
      
      if (result.success) {
        addChatMessage('assistant', result.response);
      } else {
        addChatMessage('assistant', "I'm sorry, I encountered an error processing your request. Please try again.");
      }
    } catch (error) {
      console.error("Error asking question:", error);
      addChatMessage('assistant', "I'm sorry, I encountered an error. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {chatHistory.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user' 
                  ? 'bg-primary-100 text-primary-900' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
              <FaSpinner className="animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 flex">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask about your AYUSH lifestyle plan..."
          className="input flex-grow mr-2"
          disabled={isProcessing}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isProcessing || !userInput.trim()}
        >
          {isProcessing ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;