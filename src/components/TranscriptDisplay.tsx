
// components/TranscriptDisplay.tsx
import { cn } from '@/lib/utils';
import React from 'react';

interface TranscriptDisplayProps {
    transcript: string;
    className?: string;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcript, className }) => (
    <div className={cn("flex-1 overflow-auto bg-gray-100 p-4 rounded", className)}>
        <h2 className="text-xl font-semibold mb-2">Live Transcript:</h2>
        <p>{transcript}</p>
    </div>
);
