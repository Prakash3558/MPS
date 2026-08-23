import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Sparkles, Send, X, RotateCcw, Copy, Check, Download,
  MapPin, Compass, GraduationCap, School, Code, Zap, Globe,
  Paperclip, Mic, MicOff, Maximize2, Minimize2, ExternalLink,
  ChevronRight, HelpCircle, Layers, Navigation
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../lib/api';

export type ChatRole = 'tutor' | 'maps_guide' | 'admissions' | 'stem_mentor' | 'quick_assistant';
export type ModelTier = 'fast' | 'balanced' | 'complex';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  imageData?: string;
  sources?: Array<{ title?: string; uri?: string }>;
  mapsPlaces?: Array<{ title?: string; uri?: string; reviewSnippets?: string[] }>;
  modelUsed?: string;
}

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: ChatRole;
  isWidgetMode?: boolean;
}

const ROLES_META: Record<ChatRole, {
  name: string;
  shortName: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultModel: ModelTier;
  colorClass: string;
  badgeClass: string;
  starterPrompts: string[];
}> = {
  tutor: {
    name: 'Academic & NCERT Tutor',
    shortName: 'CBSE Tutor',
    tagline: 'Master NCERT concepts, homework solutions, and exam prep',
    icon: GraduationCap,
    defaultModel: 'balanced',
    colorClass: 'from-blue-600 to-indigo-700',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    starterPrompts: [
      'Explain Photosynthesis for Class 10 Biology with key diagrams',
      'Solve quadratic equation: 2x² - 7x + 3 = 0 step by step',
      'Give me 5 important tips for CBSE Class 10 Board exam preparation',
      'Explain the difference between Active and Passive Voice with examples'
    ]
  },
  maps_guide: {
    name: 'Google Maps & Campus Guide',
    shortName: 'Maps & Routes',
    tagline: 'Grounded routes, directions to MPS Sikta, landmarks & transport',
    icon: Compass,
    defaultModel: 'balanced',
    colorClass: 'from-emerald-600 to-teal-700',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    starterPrompts: [
      'How do I reach Model Public School Sikta from Bettiah Bus Stand?',
      'What is the distance and route from Raxaul to MPS Bhawanipur Sikta?',
      'Tell me about Sikta Railway Station and its distance from the school',
      'What educational and transport facilities are near Sikta in West Champaran?'
    ]
  },
  admissions: {
    name: 'Admissions & School Counselor',
    shortName: 'Admissions',
    tagline: 'Inquire about CBSE admissions, fee structure, labs & timings',
    icon: School,
    defaultModel: 'balanced',
    colorClass: 'from-amber-600 to-orange-700',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    starterPrompts: [
      'What is the admission procedure for Class 11 Science (PCM/PCB)?',
      'What documents are required during admission at Model Public School?',
      'Tell me about the school bus routes and transport coverage in Sikta',
      'What are the school timings, office hours, and contact numbers?'
    ]
  },
  stem_mentor: {
    name: 'STEM & Coding Lab Mentor',
    shortName: 'STEM & Code',
    tagline: 'Deep scientific proofs, Python programming, Physics & Math formulas',
    icon: Code,
    defaultModel: 'complex',
    colorClass: 'from-purple-600 to-pink-700',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    starterPrompts: [
      'Write a Python program for students to calculate CBSE percentage with grades',
      'Derive the lens formula (1/f = 1/v - 1/u) with ray diagram explanation',
      'Explain Newton\'s Laws of Motion with real-world sports examples',
      'How do logic gates (AND, OR, NOT) work in computer science?'
    ]
  },
  quick_assistant: {
    name: 'Fast Q&A Assistant',
    shortName: 'Fast Q&A',
    tagline: 'Ultra-low latency instant definitions & quick school facts',
    icon: Zap,
    defaultModel: 'fast',
    colorClass: 'from-amber-500 to-yellow-600',
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    starterPrompts: [
      'What is the CBSE Affiliation number of Model Public School?',
      'Define Archimedes Principle in 2 short bullet points',
      'Give quick meaning and synonyms for the word "Meticulous"',
      'What are the prime numbers between 1 and 50?'
    ]
  }
};

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  isOpen,
  onClose,
  initialRole = 'tutor',
  isWidgetMode = false
}) => {
  const [currentRole, setCurrentRole] = useState<ChatRole>(initialRole);
  const [modelPreference, setModelPreference] = useState<ModelTier>(ROLES_META[initialRole].defaultModel);
  const [enableMaps, setEnableMaps] = useState<boolean>(initialRole === 'maps_guide');
  const [enableSearch, setEnableSearch] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Initial welcome message per role
  const getInitialMessages = (role: ChatRole): ChatMessage[] => [
    {
      id: 'welcome-1',
      role: 'model',
      content: `### 👋 Namaste & Welcome to **${ROLES_META[role].name}**\n\nI am your interactive AI assistant for **Model Public School (MPS Sikta, West Champaran)**. ${ROLES_META[role].tagline}.\n\n*Choose a suggested topic below or type any question to start our conversation!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: role === 'quick_assistant' ? 'gemini-3.1-flash-lite' : (role === 'stem_mentor' ? 'gemini-3.1-pro-preview' : 'gemini-3.7-flash')
    }
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages(initialRole));

  // Switch role handler
  const handleSelectRole = (newRole: ChatRole) => {
    setCurrentRole(newRole);
    setModelPreference(ROLES_META[newRole].defaultModel);
    setEnableMaps(newRole === 'maps_guide');
    setMessages(getInitialMessages(newRole));
  };

  // Auto-scroll to bottom of thread on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setIsListening(false);
    }
  };

  // Image Upload Handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert('Image size exceeds 4MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      setAttachedImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setAttachedImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query && !attachedImage) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query || 'Analyze attached image',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageData: attachedImage || undefined
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    const currentImg = attachedImage;
    removeAttachedImage();
    setIsLoading(true);

    try {
      // Prepare history payload (excluding initial greeting to keep context clean)
      const historyPayload = updatedHistory
        .filter(m => m.id !== 'welcome-1')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await api.sendAIChat({
        message: query,
        history: historyPayload,
        role: currentRole,
        modelPreference,
        enableMaps: enableMaps || currentRole === 'maps_guide',
        enableSearch,
        userLocation,
        imageData: currentImg
      });

      const modelMsgId = `model-${Date.now()}`;
      const modelMsg: ChatMessage = {
        id: modelMsgId,
        role: 'model',
        content: res.reply || 'I received your request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources,
        mapsPlaces: res.mapsPlaces,
        modelUsed: res.modelUsed || (modelPreference === 'fast' ? 'gemini-3.1-flash-lite' : (modelPreference === 'complex' ? 'gemini-3.1-pro-preview' : 'gemini-3.7-flash'))
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Error generating response**: ${err?.message || 'Unable to connect to AI server. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages(getInitialMessages(currentRole));
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .map(m => `[${m.timestamp}] ${m.role === 'user' ? 'You' : 'MPS AI (' + (m.modelUsed || currentRole) + ')'}:\n${m.content}\n`)
      .join('\n---\n\n');

    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MPS-AI-Chat-${currentRole}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const roleMeta = ROLES_META[currentRole];
  const RoleIcon = roleMeta.icon;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isFullscreen
          ? 'inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[480px] md:w-[540px] max-h-[90vh]'
      }`}
    >
      <div
        className={`bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden w-full transition-all ${
          isFullscreen ? 'h-full max-w-5xl' : 'h-[680px] max-h-[85vh]'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${roleMeta.colorClass} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
              <RoleIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate font-heading">
                  MPS Gemini Chatbot
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleMeta.badgeClass} flex items-center gap-1`}>
                  <Sparkles className="w-2.5 h-2.5" />
                  {roleMeta.shortName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {enableMaps ? 'Google Maps Grounded' : 'CBSE & NCERT AI Assistant'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              title="Clear Conversation"
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportTranscript}
              title="Export Transcript"
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Collapse' : 'Expand Fullscreen'}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Close Chat"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Roles & Controls Bar */}
        <div className="bg-slate-950/90 px-3 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto text-xs scrollbar-none">
          {/* Role Pills */}
          <div className="flex items-center gap-1.5 flex-nowrap">
            {(Object.keys(ROLES_META) as ChatRole[]).map((r) => {
              const meta = ROLES_META[r];
              const Icon = meta.icon;
              const isSelected = currentRole === r;
              return (
                <button
                  key={r}
                  onClick={() => handleSelectRole(r)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all ${
                    isSelected
                      ? `bg-gradient-to-r ${meta.colorClass} text-white shadow-md scale-105`
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{meta.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Model Preference & Maps Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Google Maps Grounding Indicator/Toggle */}
            <button
              onClick={() => setEnableMaps(!enableMaps)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                enableMaps
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle Google Maps Grounding"
            >
              <MapPin className="w-3 h-3" />
              <span>Maps</span>
              <span className={`w-1.5 h-1.5 rounded-full ${enableMaps ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            </button>

            {/* Model Speed Selector */}
            <select
              value={modelPreference}
              onChange={(e) => setModelPreference(e.target.value as ModelTier)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:border-blue-500 cursor-pointer"
              title="Select Gemini Model Tier"
            >
              <option value="fast">⚡ Fast (3.1 Lite)</option>
              <option value="balanced">⚖️ Balanced (3.7 Flash)</option>
              <option value="complex">🧠 Deep (3.1 Pro)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-4 shadow-md transition-all ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 text-slate-100 rounded-bl-none border border-slate-700/60'
                }`}
              >
                {/* Attached Image in Message */}
                {msg.imageData && (
                  <div className="mb-3 rounded-xl overflow-hidden max-h-48 border border-white/20">
                    <img src={msg.imageData} alt="Attached homework or map" className="w-full h-auto object-cover" />
                  </div>
                )}

                {/* Markdown Content */}
                <div className="text-xs sm:text-sm leading-relaxed prose prose-invert prose-p:my-1.5 prose-headings:my-2 prose-strong:text-amber-300 prose-code:bg-slate-950 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-950 prose-pre:p-3 prose-pre:rounded-xl">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Google Maps Place Cards (Grounding) */}
                {msg.mapsPlaces && msg.mapsPlaces.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Google Maps Places Grounding:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.mapsPlaces.map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start justify-between gap-2 p-2.5 bg-slate-950/80 hover:bg-slate-950 border border-emerald-500/30 hover:border-emerald-400 rounded-xl transition-all group"
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-white group-hover:text-emerald-300 truncate">
                              {place.title || 'View Map Location'}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              {place.reviewSnippets?.[0] || 'Open directions and full map pin'}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-0.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Web Search Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Globe className="w-3 h-3 text-blue-400" />
                      Sources:
                    </span>
                    {msg.sources.slice(0, 3).map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] bg-slate-950/60 hover:bg-slate-950 text-blue-300 hover:text-blue-200 border border-blue-500/20 px-2 py-0.5 rounded-md truncate max-w-[140px]"
                      >
                        {s.title || s.uri}
                      </a>
                    ))}
                  </div>
                )}

                {/* Footer bar of message */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="text-[9px] bg-slate-950 px-1.5 py-0.2 rounded text-slate-400 font-mono">
                        {msg.modelUsed.replace('gemini-', '')}
                      </span>
                    )}
                  </div>
                  {msg.role === 'model' && (
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="hover:text-white flex items-center gap-1 transition-colors"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-bl-none p-3.5 shadow-md flex items-center gap-2">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  Thinking with {modelPreference === 'fast' ? 'Gemini 3.1 Flash Lite' : (modelPreference === 'complex' ? 'Gemini 3.1 Pro' : 'Gemini 3.7 Flash')}...
                </span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompts Bar (when only welcome message is present or user needs ideas) */}
        {messages.length <= 2 && (
          <div className="p-3 bg-slate-950/60 border-t border-slate-800/60">
            <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Suggested questions for {roleMeta.shortName}:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {roleMeta.starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left text-xs bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700/50 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{prompt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attached Image Preview Bar */}
        {attachedImage && (
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={attachedImage} alt="Attachment" className="w-8 h-8 rounded-lg object-cover border border-blue-500" />
              <span className="text-xs text-slate-300 truncate max-w-xs">{attachedImageName || 'Attached homework image'}</span>
            </div>
            <button
              onClick={removeAttachedImage}
              className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Remove</span>
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Attach Homework Photo / Question Image"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-xl transition-colors ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Click to Speak (Voice Input)'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                currentRole === 'maps_guide'
                  ? 'Ask for route to MPS Sikta, nearby landmarks...'
                  : `Ask ${roleMeta.shortName} any question...`
              }
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || (!inputMessage.trim() && !attachedImage)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-2.5 rounded-xl font-bold transition-all shadow-md flex-shrink-0"
              title="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-2">
            <span>Model: {modelPreference === 'fast' ? 'gemini-3.1-flash-lite' : (modelPreference === 'complex' ? 'gemini-3.1-pro-preview' : 'gemini-3.7-flash')}</span>
            <span>MPS Sikta AI Assistant &copy; 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
