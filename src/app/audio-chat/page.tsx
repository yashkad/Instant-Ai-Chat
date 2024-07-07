'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { StatusIndicator } from '@/components/StatusIndicator';
import { TranscriptDisplay } from '@/components/TranscriptDisplay';
import { toast } from "@/components/ui/use-toast";
import { AIMessages, SpeechRecognition, SpeechRecognitionEvent } from '@/lib/types';
import { systemPrompt } from '@/lib/prompts';
import { modelList as models } from '@/lib/models';
import axios from 'axios';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabsContent } from '@radix-ui/react-tabs';
import { cn, parseMessageContent } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { list } from 'postcss';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AudioChat: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
    const [messages, setMessages] = useState<AIMessages[]>([
        { role: "assistant", content: "hi" }
    ]);
    const [isFetchingResponse, setIsFetchingResponse] = useState(false);
    const [selectedModel, setSelectedModel] = useState(models[3].id);

    const recognition = useRef<SpeechRecognition | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const analyser = useRef<AnalyserNode | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const speakingTimeoutId = useRef<number | null>(null);
    const tabs = ["chat", "history"];
    const [inputText, setInputText] = useState('')
    const toastDuration = 1000;
    const [speakMessage, setSpeakMessage] = useState(true)
    const synthesis = useRef<SpeechSynthesis | null>(null);


    // Ref for the chat container
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Function to scroll to the bottom of the chat container
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // useEffect to scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    const getGroqResponse = useCallback(async (text: string): Promise<string> => {
        try {
            const response = await axios.post('/api/groq/chat', {
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages,
                    { role: "user", content: text }
                ],
                model: selectedModel,
                temperature: 0,
            });

            return (response.data.content);
        } catch (error) {
            console.error("Error getting Groq response:", error);
            return "Error: Unable to get AI response.";
        }
    }, [messages, selectedModel]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            synthesis.current = window.speechSynthesis;

            if (SpeechRecognition) {
                recognition.current = new SpeechRecognition();
                recognition.current.continuous = true;
                recognition.current.interimResults = true;

                recognition.current.onresult = handleRecognitionResult;
                recognition.current.onerror = handleRecognitionError;
                recognition.current.onend = handleRecognitionEnd;

                // Add event listener for spacebar press to toggle listening
                window.addEventListener('keydown', handleSpacebarPress);
            } else {
                toast({
                    title: "Speech Recognition Not Supported",
                    description: "Your browser doesn't support speech recognition. Please try a different browser.",
                    variant: "destructive",
                    duration: toastDuration,
                    className: "fixed top-10 z-[100] flex max-h-screen w-full flex-col-reverse p-4  sm:right-0  sm:flex-col md:max-w-[420px]",
                });
            }
        }

        return () => {
            stopRecognition();
            stopVisualization();
            window.removeEventListener('keydown', handleSpacebarPress); // Clean up event listener
        };
    }, []);

    // Function to handle spacebar press
    const handleSpacebarPress = (event: KeyboardEvent) => {
        event.preventDefault();
        if (event.code === 'Space' && !isListening && !recognition.current?.running) {
            event.preventDefault(); // Prevent default spacebar behavior
            startRecognition();
            setIsListening(true);
            toast({
                title: "Listening Started",
            });
        }
    };


    const speakText = (text: string, lang: string = 'hi-IN', rate: number = 1.2, pitch: number = 1.5) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;  // Set language
        utterance.rate = rate;  // Set speaking rate (1.0 is normal speed)
        utterance.pitch = pitch;  // Set pitch (1.0 is normal pitch)

        synthesis.current?.speak(utterance);
        // Example of how to use speakText with custom parameters
        // speakText("Hello world!", 'en-US', 1.2, 0.8);
    };

    const stopSpeaking = () => {
        if (synthesis.current && synthesis.current.speaking) {
            synthesis.current.cancel();
        }
    };




    const handleRecognitionResult = useCallback(async (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i]?.isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        const newTranscript = finalTranscript + interimTranscript;
        setTranscript(newTranscript);

        if (finalTranscript && !isFetchingResponse) {
            setTranscriptHistory(prev => [...prev, finalTranscript.trim()]);
            setMessages(prev => [...prev, { role: "user", content: finalTranscript.trim() }]);

            setIsFetchingResponse(true);
            const aiResponse = await getGroqResponse(finalTranscript.trim());
            setIsFetchingResponse(false);
            const parsedResponse = JSON.parse(aiResponse);
            setMessages(prev => [...prev, { role: "assistant", content: aiResponse, }]); // Add the AI response to the messages
            if (speakMessage && parsedResponse.content) speakText(parsedResponse.content, parsedResponse?.lang);

        }
    }, [getGroqResponse, isFetchingResponse]);

    useEffect(() => {
        if (recognition.current) {
            recognition.current.onresult = handleRecognitionResult;
        }
    }, [handleRecognitionResult]);

    const handleRecognitionError = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}. Please try again.`,
            variant: "destructive",
            duration: toastDuration,
            className: "fixed top-10 z-[100] flex max-h-screen w-full flex-col-reverse p-4  sm:right-0  sm:flex-col md:max-w-[420px]",

        });
    };

    const handleRecognitionEnd = () => {
        if (isListening) {
            // recognition.current?.start();
        }
    };
    const toggleListening = () => {
        if (isListening) {
            stopRecognition();
        } else {
            startRecognition();
        }
        setIsListening(!isListening);
    };
    const startRecognition = () => {
        if (recognition.current && !recognition.current.running) {
            recognition.current.start();
            recognition.current.running = true;
            startVisualization();
        }
    };


    const stopRecognition = () => {
        if (recognition.current) {
            recognition.current.stop();
            recognition.current.running = false;
            stopVisualization();
            setIsListening(false);
        }
    };

    const startVisualization = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext.current = new (window.AudioContext)();
            analyser.current = audioContext.current.createAnalyser();
            const source = audioContext.current.createMediaStreamSource(stream);
            source.connect(analyser.current);
            analyser.current.fftSize = 2048;
            checkAudioLevel();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast({
                title: "Microphone Access Error",
                description: "Unable to access your microphone. Please check your permissions.",
                variant: "destructive",
                duration: toastDuration,
                className: "fixed top-10 z-[100] flex max-h-screen w-full flex-col-reverse p-4  sm:right-0  sm:flex-col md:max-w-[420px]",
            });
        }
    };

    const stopVisualization = () => {
        if (audioContext.current) {
            audioContext.current.close();
            audioContext.current = null;
        }
        analyser.current = null;
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
    };

    const checkAudioLevel = () => {
        if (!analyser.current) return;

        const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
        analyser.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += Math.abs(dataArray[i] - 128);
        }
        const average = sum / dataArray.length;

        const speaking = average > 10; // Adjust this threshold as needed

        if (speaking) {
            setIsSpeaking(true);
            if (speakingTimeoutId.current) {
                clearTimeout(speakingTimeoutId.current);
            }
            speakingTimeoutId.current = window.setTimeout(() => {
                setIsSpeaking(false);
                stopRecognition();
            }, 2000); // Stop recognition after 2 seconds of silence
        } else {
            setIsSpeaking(false);
        }

        animationFrameId.current = requestAnimationFrame(checkAudioLevel);
    };

    const clearTranscript = () => {
        setTranscript('');
        setTranscriptHistory([]);
        setMessages([]);
        toast({
            title: "Transcript Cleared",
            description: "The transcript has been cleared.",
            duration: toastDuration,
            className: "fixed top-10 z-[100] flex max-h-screen w-full flex-col-reverse p-4  sm:right-0  sm:flex-col md:max-w-[420px]",
        });
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden p-6">
            <div className="flex items-center mb-5 space-x-4">
                <h1 className="text-xl lg:text-3xl font-bold  ">Audio Chat</h1>
                <StatusIndicator isListening={isListening} isSpeaking={isSpeaking} />

            </div>


            <div className="flex flex-col md:flex-row items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex flex-col w-full md:w-auto md:flex-row gap-4 md:space-x-4">
                    <div className="flex w-full md:w-64">
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
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="speak-mode"
                            onCheckedChange={() => { setSpeakMessage(!speakMessage); stopSpeaking() }}
                            checked={speakMessage}
                        />
                        <Label htmlFor="speak-mode">
                            {speakMessage ? "Speak Message" : "Don't Speak Message"}
                        </Label>
                    </div>
                </div>

                <div className="flex w-full md:w-auto justify-center space-x-4">
                    <TooltipProvider>
                        <Tooltip defaultOpen={true}>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={toggleListening}
                                    variant={isListening ? "destructive" : "default"}
                                >
                                    {isListening ? 'Stop Chat' : 'Start Chat'}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Hit <span className='font-bold'>{" space"}</span> to start chat</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button
                        onClick={clearTranscript}
                        variant="outline"
                    >
                        Clear
                    </Button>
                </div>
            </div>

            <div className="flex items-center bg-black text-white rounded-lg mb-3 p-4 justify-center space-x-4">
                <AudioVisualizer className='border-0 m-0' analyser={analyser.current} />
                <p className='text-sm p-4'>{transcript}</p>
            </div>


            <div className="flex justify-center overflow-scroll h-full" ref={chatContainerRef}>
                <Tabs defaultValue={tabs[0]} className="w-full  " >


                    <TabsContent value={tabs[0]} className='bg-black'>
                        <div className="flex flex-col space-y-4 p-4">
                            {messages.map((message, index) => {
                                const { content, lang } = parseMessageContent(message.content);
                                const isUser = message.role === "user";

                                return (
                                    <div
                                        key={index}
                                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                        onDoubleClick={() => speakText(content, lang)}
                                    >
                                        <div
                                            className={`rounded-lg px-4 py-2 max-w-sm ${isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                                                }`}
                                        >
                                            <p className="text-sm">{content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>


                    <TabsContent value={tabs[1]} className='w-full'>
                        <div className="grid grid-cols-2 overflow-scroll">
                            <div className="h-full">

                                <TranscriptDisplay transcript={transcript} className='border-4 h-80' />

                                <div className="overflow-scroll border-4 h-80">
                                    <pre className=''>
                                        <code>
                                            {JSON.stringify(transcriptHistory, null, 2)}
                                        </code>
                                    </pre>
                                </div>
                            </div>

                            <div className="overflow-scroll border-4 p-4">
                                <pre className='overflow-scroll'>
                                    <code>
                                        {JSON.stringify(messages, null, 2)}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsList className="grid w-full grid-cols-2">
                        {tabs.map((tab, index) =>
                            <TabsTrigger value={tab} key={index}>{tab}</TabsTrigger>
                        )}
                    </TabsList>

                </Tabs>
            </div>


        </div>
    );
};

export default AudioChat;
