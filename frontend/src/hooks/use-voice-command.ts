"use client";

import { useState, useCallback } from 'react';

export function useVoiceCommand(onCommand: (text: string) => void) {
    const [isListening, setIsListening] = useState(false);

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Browseringiz ovozli buyruqlarni qo'llab-quvvatlamaydi.");
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'uz-UZ';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onCommand(transcript);
        };

        recognition.start();
    }, [onCommand]);

    return { isListening, startListening };
}
