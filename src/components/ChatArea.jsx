import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { Loader2 } from 'lucide-react';

const ChatArea = ({ messages, isLoading, onViewMindMap }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-visible">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 overflow-visible">
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onViewMindMap={onViewMindMap}
          />
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
            <div className="text-sm text-light-textSecondary dark:text-dark-textSecondary">Thinking<span className="ml-1 animate-pulse">...</span></div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatArea;
