import React from 'react';
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@radix-ui/react-select';

interface ChatSettingsProps {
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    temperature: number;
    setTemperature: (temp: number) => void;
    useGroqVoice: boolean;
    setUseGroqVoice: (use: boolean) => void;
    models: { id: string; name: string }[];
}

const ChatSettings: React.FC<ChatSettingsProps> = ({
    selectedModel,
    setSelectedModel,
    temperature,
    setTemperature,
    useGroqVoice,
    setUseGroqVoice,
    models,
}) => {
    return (
        <div className="flex space-x-2 mb-4 bg-blue-300 ">
            <div className="w-64">
                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 border rounded-md"
                >
                    {models.map((model) => (
                        <option key={model.id} value={model.id}>
                            {model.id}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center space-x-2 ">
                <span>Temperature: {temperature.toFixed(1)}</span>
                <Slider
                    className='w-32'
                    value={[temperature]}
                    onValueChange={([value]) => setTemperature(value)}
                    min={0}
                    max={1}
                    step={0.1}
                />
            </div>
            <Button onClick={() => setUseGroqVoice(!useGroqVoice)}>
                {useGroqVoice ? 'Use Default Voice' : 'Use Groq Voice'}
            </Button>
        </div>
    );
};

export default ChatSettings;