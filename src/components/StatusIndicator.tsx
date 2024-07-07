// components/StatusIndicator.tsx
import React from 'react';

interface StatusIndicatorProps {
    isListening: boolean;
    isSpeaking: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isListening, isSpeaking }) => (
    <>
        {isListening && (
            <div className="flex items-center">
                <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 mr-4">Listening...</span>
            </div>
        )}
        {isListening && isSpeaking && (
            <div className="flex items-center">
                <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Speaking...</span>
            </div>
        )}
    </>
);