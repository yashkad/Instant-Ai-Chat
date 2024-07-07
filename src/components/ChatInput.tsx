import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (text: string) => void;
  toggleListening: () => void;
  isListening: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  handleSendMessage,
  toggleListening,
  isListening,
}) => {
  return (
    <div className="flex space-x-2">
      <Input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Type your message..."
        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
      />
      <Button onClick={() => handleSendMessage(inputText)}>Send</Button>
      <Button onClick={toggleListening} variant={isListening ? "destructive" : "default"}>
        {isListening ? 'Stop' : 'Start'} Listening
      </Button>
    </div>
  );
};

export default ChatInput;