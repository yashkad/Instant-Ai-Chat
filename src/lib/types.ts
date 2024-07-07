
export interface Message {
    text: string;
    isUser: boolean;
    isAudio?: boolean;
  }
  
  export interface Model {
    id: string;
    name: string;
  }
  
  export interface SpeechRecognition extends EventTarget {
    onerror: (event: any) => void;
    interimResults: boolean;
    continuous: boolean;
    start: () => void;
    stop: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    running : boolean
  }
  
  export interface SpeechRecognitionEvent {
    results: {
      transcript: string;
    }[][];
    resultIndex: number;
    
  }
  
  declare global {
    interface Window {
      SpeechRecognition: new () => SpeechRecognition;
      webkitSpeechRecognition: new () => SpeechRecognition;
    }
  }

export interface AIMessages {
  role: string;
  content: string;
}