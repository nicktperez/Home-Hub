'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceCommander() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const { addShoppingItem, addNote, addProject } = useDashboard();

    const processCommand = useCallback(async (text: string) => {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('shopping list') || lowerText.includes('add to shopping')) {
            const item = text.replace(/add to shopping list|shopping list|add to shopping/gi, '').trim();
            if (item) {
                await addShoppingItem(item);
                showFeedback(`Added ${item} to shopping list`);
            }
        } else if (lowerText.includes('note') || lowerText.includes('remember')) {
            const content = text.replace(/add to notes|note|remember/gi, '').trim();
            if (content) {
                await addNote(content);
                showFeedback(`Saved note: ${content}`);
            }
        } else if (lowerText.includes('project')) {
            const title = text.replace(/add to projects|new project|project/gi, '').trim();
            if (title) {
                await addProject(title);
                showFeedback(`Started project: ${title}`);
            }
        } else {
            showFeedback("I didn't catch that command.");
        }
    }, [addShoppingItem, addNote, addProject]);

    const showFeedback = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(null), 3000);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const result = event.results[0][0].transcript;
            setTranscript(result);
            processCommand(result);
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
            showFeedback("Voice recognition error.");
        };

        if (isListening) {
            recognition.start();
        } else {
            recognition.stop();
        }

        return () => recognition.stop();
    }, [isListening, processCommand]);

    return (
        <div className="fixed bottom-10 left-10 z-[100] flex items-center gap-4">
            <button
                onClick={() => setIsListening(!isListening)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isListening ? 'bg-rose text-white animate-pulse scale-110' : 'bg-white/80 backdrop-blur-md text-cocoa hover:bg-white hover:scale-105'
                    }`}
            >
                {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6 opacity-40" />}
            </button>

            <AnimatePresence>
                {(transcript || feedback) && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3"
                    >
                        <div className="w-2 h-2 rounded-full bg-rose animate-pulse" />
                        <span className="text-sm font-bold text-cocoa">
                            {feedback || transcript}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
