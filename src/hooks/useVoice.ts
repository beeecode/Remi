'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useVoice(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const finalizeAndSend = useCallback(() => {
    const finalResult = (lastTranscriptRef.current + interimTranscriptRef.current).trim();
    
    if (finalResult.length > 0) {
      console.log("--- DISPATCHING TO BRAIN ---", finalResult);
      onResultRef.current(finalResult);
      lastTranscriptRef.current = "";
      interimTranscriptRef.current = "";
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!isListening && !recognitionRef.current) return;

    console.log("--- MICROPHONE STOPPING ---");
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Recognition might already be stopped by the browser
      }
    }
    
    finalizeAndSend();
    setIsListening(false);
  }, [isListening, finalizeAndSend]);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    
    if (isListening) {
      console.warn("Speech blocked: Microphone is still open.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    // Prioritize en-NG voices
    const nigerianVoice = voices.find(v => v.lang === 'en-NG' || v.name.includes('Nigeria') || v.name.includes('Eka'));
    const femaleVoice = nigerianVoice || voices.find(v => v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha'));
    
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.lang = nigerianVoice ? 'en-NG' : 'en-GB'; // Prefer British English as fallback for Nigerian accent
    
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isListening]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined' || isSpeaking || isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported.");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-NG';

      recognitionRef.current.onresult = (event: any) => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            lastTranscriptRef.current += transcript;
          } else {
            interim += transcript;
          }
        }
        interimTranscriptRef.current = interim;

        const currentText = (lastTranscriptRef.current + interimTranscriptRef.current).trim();
        
        if (currentText) {
          silenceTimerRef.current = setTimeout(() => {
            console.log("Silence detected. Auto-stopping...");
            stopListening();
          }, 1500); 
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        stopListening();
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    try {
      lastTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      recognitionRef.current.start();
      setIsListening(true);
      console.log("--- MICROPHONE OPENED ---");
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsListening(false);
    }
  }, [isSpeaking, isListening, stopListening]);

  return { isListening, isSpeaking, startListening, stopListening, speak, error };
}
