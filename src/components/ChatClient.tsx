'use client';

import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatSettings from './ChatSettings';
import { Message, SpeechRecognition } from '@/lib/types';
import { modelList } from '@/lib/models';


interface Model {
  id: string;
  name: string;
}

const ChatClient = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelList[0].id);
  const [temperature, setTemperature] = useState(0.5);
  const [useGroqVoice, setUseGroqVoice] = useState(false);
  const [models, setModels] = useState<any[]>(modelList);
  const recognition = useRef<SpeechRecognition | null>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      synthesis.current = window.speechSynthesis;

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript, true);
      };

      recognition.current.onend = () => setIsListening(false);
    }

  }, []);



  const handleSendMessage = async (text: string, isAudio: boolean = false) => {
    if (text.trim()) {
      const newMessage: Message = { text, isUser: true, isAudio };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputText('');

      const aiResponse = await getGroqResponse(text);
      const aiMessage: Message = { text: aiResponse, isUser: false };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      if (isAudio && useGroqVoice) {
        speakText(aiResponse);
      }
    }
  };

  const getGroqResponse = async (text: string): Promise<string> => {
    try {
      const response = await fetch('/api/groq/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful assistant. respond in very very short sentences." },
            { role: "user", content: text },
          ],
          model: selectedModel,
          temperature: temperature,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("Error getting Groq response:", error);
      return "Error: Unable to get AI response.";
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
    } else {
      if (useGroqVoice) {
        startGroqRecording();
      } else {
        recognition.current?.start();
      }
    }
    setIsListening(!isListening);
  };

  const startGroqRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 64000
        });
        const audioChunks: Blob[] = [];

        mediaRecorder.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          sendAudioToGroq(audioBlob);
        });

        mediaRecorder.start();

        setTimeout(() => {
          mediaRecorder.stop();
        }, 10000);
      });
  };

  const sendAudioToGroq = async (audioBlob: Blob) => {
    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    if (audioBlob.size > MAX_FILE_SIZE) {
      console.error("Audio file too large. Please record a shorter message.");
      setInputText("Error: Audio file too large. Please record a shorter message.");
      return;
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    try {
      const response = await fetch('/api/groq/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      setInputText(data.text);
      handleSendMessage(data.text, true);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setInputText("Error: Unable to transcribe audio. Please try again.");
    }
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    synthesis.current?.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-100 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Groq Chat</h1>

      </div>
      <ChatSettings
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        temperature={temperature}
        setTemperature={setTemperature}
        useGroqVoice={useGroqVoice}
        setUseGroqVoice={setUseGroqVoice}
        models={models}
      />
      <MessageList messages={messages} />
      <div className="p-4 border-t">
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          handleSendMessage={handleSendMessage}
          toggleListening={toggleListening}
          isListening={isListening}
        />
      </div>
    </div>
  );
};

export default ChatClient;