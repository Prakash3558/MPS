import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Bot, Send, Image as ImageIcon, X, RefreshCw, Copy, Check, 
  Volume2, VolumeX, BookOpen, Calculator, Lightbulb, PenTool, HelpCircle, 
  ChevronDown, GraduationCap, ShieldCheck, Minimize2, Maximize2, MessageSquare,
  FileText, Zap
} from 'lucide-react';
import { apiUrl } from '../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string;
  sources?: Array<{ title?: string; uri?: string }>;
  timestamp: string;
}

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: Calculator, color: 'from-amber-500 to-orange-600' },
  { id: 'science', name: 'Science', icon: Lightbulb, color: 'from-emerald-500 to-teal-600' },
  { id: 'english', name: 'English', icon: PenTool, color: 'from-blue-500 to-indigo-600' },
  { id: 'hindi', name: 'Hindi Grammar & Lit', icon: BookOpen, color: 'from-purple-500 to-violet-600' },
  { id: 'social', name: 'Social Studies', icon: FileText, color: 'from-rose-500 to-pink-600' },
  { id: 'computer', name: 'Computer & AI', icon: Zap, color: 'from-cyan-500 to-blue-600' },
];

const MODES = [
  { id: 'step-by-step', name: 'Step-by-Step Solution', desc: 'Detailed breakdown with formulas' },
  { id: 'explain', name: 'Simple Explanation', desc: 'Easy analogies & key points' },
  { id: 'essay', name: 'Essay & Grammar', desc: 'Letter writing & corrections' },
  { id: 'quiz', name: 'Practice Questions', desc: 'Quiz yourself for upcoming exams' },
];

const STARTER_PROMPTS = [
  { text: "Solve this quadratic equation: x² - 5x + 6 = 0 step by step", subject: "Mathematics" },
  { text: "Explain Newton's laws of motion with real-life examples", subject: "Science" },
  { text: "Help me write an application to the Principal requesting 3 days sick leave", subject: "English" },
  { text: "What are the main causes and consequences of the French Revolution?", subject: "Social Studies" },
  { text: "Explain how Photosynthesis works in plants with a quick summary", subject: "Science" },
  { text: "What is the difference between RAM and ROM in computers?", subject: "Computer & AI" }
];

interface AIHomeworkTutorProps {
  isOpen?: boolean;
  onClose?: () => void;
  isWidgetMode?: boolean;
  className?: string;
  classGrade?: string;
  subject?: string;
}

export const AIHomeworkTutor: React.FC<AIHomeworkTutorProps> = ({ 
  isOpen = true, 
  onClose,
  isWidgetMode = false,
  className: initialClassName,
  classGrade,
  subject: initialSubject
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `### 👋 Namaste! I'm **MPS Vidyarthi AI**

Your 24/7 personal CBSE Homework & Study Companion for **Model Public School (MPS Sikta)**.

**How I can help you today:**
- 📐 **Math & Physics**: Step-by-step solutions with NCERT formulas.
- 🔬 **Science**: Clear concept explanations & lab diagram help.
- ✍️ **English & Hindi**: Grammar checks, essay drafts & leave applications.
- 📸 **Homework Photo**: Snap or upload a picture of your homework question!

Select your subject and grade below, or ask me directly!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedGrade, setSelectedGrade] = useState('Class 10');
  const [selectedMode, setSelectedMode] = useState('step-by-step');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() && !attachedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
      image: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setAttachedImage(null);
    setLoading(true);

    try {
      // Prepare history for context
      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await fetch(apiUrl('/api/ai/homework-tutor'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          subject: selectedSubject,
          grade: selectedGrade,
          mode: selectedMode,
          imageData: userMessage.image,
          history
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.reply,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `⚠️ **Unable to connect to AI Assistant.**\n${err.message || 'Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSpeech = (text: string, id: string) => {
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for speech
    const cleanText = text.replace(/[#*`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(id);
    window.speechSynthesis.speak(utterance);
  };

  const renderFormattedMarkdown = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-body">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-amber-600 dark:text-amber-400 font-heading mt-3 mb-1">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-extrabold text-blue-800 dark:text-blue-300 font-heading mt-4 mb-2">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const text = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <span>{renderInlineFormatting(text)}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^\d+/)?.[0];
            const text = line.replace(/^\d+\.\s/, '');
            return (
              <div key={idx} className="flex items-start gap-2 ml-2 font-medium">
                <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-xs px-2 py-0.5 rounded-md flex-shrink-0">
                  {num}
                </span>
                <span>{renderInlineFormatting(text)}</span>
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return <p key={idx}>{renderInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineFormatting = (text: string) => {
    // Basic bold parsing
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900 dark:text-white bg-amber-50 dark:bg-amber-950/40 px-1 rounded">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 ${
      isWidgetMode 
        ? 'fixed bottom-4 right-4 z-50 w-[92vw] sm:w-[420px] max-h-[620px] h-[85vh]' 
        : 'w-full max-w-4xl mx-auto h-[750px]'
    }`}>
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 flex items-center justify-between border-b border-blue-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <Bot className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base font-heading tracking-wide">MPS Vidyarthi AI</h2>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Your 24/7 CBSE Homework & Study Tutor</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isWidgetMode && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Controls Bar: Subject & Grade Selection */}
          <div className="bg-stone-50 dark:bg-slate-800/80 p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Subject:</span>
              {SUBJECTS.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                    selectedSubject === sub.name
                      ? 'bg-blue-900 text-amber-400 shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-amber-400'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1 focus:ring-2 focus:ring-amber-500"
                >
                  {['Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 'Class 1-5', 'Class 11-12'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1 focus:ring-2 focus:ring-amber-500"
              >
                {MODES.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-slate-950/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-800 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-amber-400/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${
                  msg.role === 'user'
                    ? 'bg-blue-900 text-white border-blue-800 rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-tl-none'
                }`}>
                  {msg.image && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 max-h-48">
                      <img src={msg.image} alt="Homework Attachment" className="w-full h-full object-contain bg-black/10" />
                    </div>
                  )}

                  {msg.role === 'user' ? (
                    <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      {renderFormattedMarkdown(msg.content)}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">🔍 Grounded Search Sources:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((s, idx) => (
                              <a
                                key={idx}
                                href={s.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-blue-600 dark:text-blue-400 font-medium truncate max-w-[200px] border border-slate-200 dark:border-slate-700 transition-colors"
                              >
                                🔗 {s.title || s.uri}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex items-center justify-between gap-2 mt-2 pt-2 border-t text-[10px] ${
                    msg.role === 'user' ? 'border-blue-800 text-blue-200' : 'border-slate-100 dark:border-slate-800 text-slate-400'
                  }`}>
                    <span>{msg.timestamp}</span>

                    {msg.role === 'model' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSpeech(msg.content, msg.id)}
                          className="hover:text-amber-500 transition-colors flex items-center gap-1 font-medium"
                          title="Read Solution Out Loud"
                        >
                          {isSpeaking === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          <span>{isSpeaking === msg.id ? 'Stop' : 'Listen'}</span>
                        </button>

                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="hover:text-amber-500 transition-colors flex items-center gap-1 font-medium"
                          title="Copy Answer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 text-xs shadow-sm">
                    YOU
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-800 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-amber-400/30">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping delay-100" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping delay-200" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Solving & formatting step-by-step answer...
                  </span>
                </div>
              </div>
            )}

            {/* Quick Starters if messages count is low */}
            {messages.length <= 2 && !loading && (
              <div className="mt-6 p-4 bg-amber-50/50 dark:bg-slate-800/50 rounded-2xl border border-amber-200/60 dark:border-slate-700/60">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Try asking one of these popular CBSE homework questions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSubject(prompt.subject);
                        handleSend(prompt.text);
                      }}
                      className="text-left p-2.5 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-xs text-slate-700 dark:text-slate-200 font-medium flex items-start gap-2 group"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span>{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview if Attached */}
          {attachedImage && (
            <div className="p-2 px-4 bg-stone-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>Homework Photo Attached</span>
                <img src={attachedImage} alt="Thumb" className="w-8 h-8 rounded object-cover border" />
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bottom Input Form */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 ${
                  attachedImage 
                    ? 'bg-amber-500 text-slate-950 border-amber-400' 
                    : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                }`}
                title="Attach Homework Photo / Formula Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={`Ask ${selectedSubject} question or type your homework problem...`}
                className="flex-1 bg-stone-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <button
                type="submit"
                disabled={loading || (!inputPrompt.trim() && !attachedImage)}
                className="p-2.5 bg-gradient-to-tr from-blue-900 to-indigo-800 hover:from-amber-500 hover:to-amber-600 text-white hover:text-slate-950 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-md flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                MPS Official AI Study Assistant
              </span>
              <span>Model: Gemini 3.7 Flash</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
