import React, { useState } from 'react';
import { Bot, Sparkles, MapPin, GraduationCap, Compass } from 'lucide-react';
import { GeminiChatbot, ChatRole } from './GeminiChatbot';

export const FloatingAIWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<ChatRole>('tutor');

  const handleOpen = (role: ChatRole = 'tutor') => {
    setActiveRole(role);
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Toggle Button Bar */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
          {/* Quick Route/Maps Shortcut Pill */}
          <button
            onClick={() => handleOpen('maps_guide')}
            className="group flex items-center gap-1.5 bg-emerald-950/90 hover:bg-emerald-800 text-emerald-300 hover:text-white px-3 py-1.5 rounded-full shadow-lg border border-emerald-500/40 text-xs font-bold transition-all hover:scale-105"
            title="Ask Google Maps Campus Directions"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Maps & Route AI</span>
          </button>

          {/* Main Gemini Chatbot Floating Button */}
          <button
            onClick={() => handleOpen('tutor')}
            className="group flex items-center gap-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 hover:from-amber-500 hover:to-amber-600 text-white hover:text-slate-950 px-4 py-3 rounded-full shadow-2xl border-2 border-amber-400/80 transition-all duration-300 hover:scale-105 active:scale-95"
            title="Open Gemini AI Chatbot"
          >
            <div className="relative">
              <Bot className="w-6 h-6 text-amber-400 group-hover:text-slate-950 transition-colors" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black font-heading tracking-wide flex items-center gap-1">
                Gemini AI Chatbot
                <Sparkles className="w-3 h-3 text-amber-300 group-hover:text-slate-950" />
              </span>
              <span className="text-[10px] text-slate-300 group-hover:text-slate-900 font-medium leading-none">
                CBSE Tutor & Maps Guide
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Multi-Turn Gemini Chatbot Modal */}
      {isOpen && (
        <GeminiChatbot
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          initialRole={activeRole}
          isWidgetMode={true}
        />
      )}
    </>
  );
};

