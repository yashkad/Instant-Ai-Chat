import { Message } from '@/lib/types';
import React, { useRef, useEffect } from 'react';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`rounded-lg p-2 max-w-[70%] ${message.isUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            {message.text}
            {message.isAudio && <span className="ml-2">🎤</span>}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;