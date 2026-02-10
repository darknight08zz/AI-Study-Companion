import { useState, useEffect, useCallback } from 'react';

export function useSpeech() {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';
            setRecognition(recognitionInstance);
            setIsSupported(true);
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();

        const cleanText = text
            .replace(/[#*`_]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);


        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const preferredVoice = voices.find(voice => voice.name.includes('Google US English')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    const stopSpeaking = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    const listen = useCallback((onResult: (text: string) => void) => {
        if (!recognition) {
            console.warn("Speech recognition not supported or not initialized");
            return;
        }

        if (isListening) {
            try {
                recognition.stop();
            } catch (e) {
                console.error("Error stopping recognition:", e);
                setIsListening(false);
            }
            return;
        }

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            onResult(text);
        };
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        try {
            recognition.start();
        } catch (e) {
            console.error("Error starting recognition:", e);
            setIsListening(false);
        }
    }, [recognition, isListening]);

    return { speak, stopSpeaking, listen, isListening, isSpeaking, isSupported };
}
