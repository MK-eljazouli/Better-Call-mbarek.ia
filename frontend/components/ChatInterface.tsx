import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Info, Trash2, Globe, Download, FileText, ChevronRight, Scale } from 'lucide-react';
import { Message } from '../types';
import InteractiveBackground from './InteractiveBackground';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('Auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  // Load history on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      const savedHistory = localStorage.getItem('dalil_chat_history');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          const hydratedMessages = parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(hydratedMessages);
        } catch (e) {
          console.error("Failed to load chat history", e);
        }
      }
      hasLoadedRef.current = true;
    }
  }, [setMessages]);

  // Save history on change
  useEffect(() => {
    if (hasLoadedRef.current && messages.length > 0) {
      localStorage.setItem('dalil_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem('dalil_chat_history');
  };

  const handleExportHistory = () => {
    if (messages.length === 0) return;

    const textContent = messages.map(m => {
      const role = m.role === 'user' ? 'المستخدم' : 'المستشار القانوني';
      const time = m.timestamp.toLocaleString();
      return `[${time}] ${role}:\n${m.content}\n\n${'-'.repeat(40)}\n`;
    }).join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consultation_juridique_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      if (!res.body) throw new Error("No response body");

      // Initialize empty bot message
      const botMessageId = (Date.now() + 1).toString();
      const botMessage: Message = {
        id: botMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Stream reader
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let sourcesFooter = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process clear lines, keep incomplete last line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line);

            if (event.type === 'sources') {
              // Format sources (Top 3, no %)
              const uniqueSources = event.data.slice(0, 3);
              if (uniqueSources.length > 0) {
                const sourcesText = uniqueSources
                  .map((s: any) => `📌 ${s.domain} — ${s.reference}`)
                  .join('\n');
                sourcesFooter = `\n\n📄 **المراجع القانونية:**\n${sourcesText}`;

                // Update message with footer (if text already exists)
                setMessages((prev) =>
                  prev.map(m => m.id === botMessageId
                    ? { ...m, content: accumulatedText + sourcesFooter }
                    : m
                  )
                );
              }
            } else if (event.type === 'content') {
              // Append content chunk
              accumulatedText += event.data;
              setMessages((prev) =>
                prev.map(m => m.id === botMessageId
                  ? { ...m, content: accumulatedText + sourcesFooter }
                  : m
                )
              );
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e);
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.",
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = language === 'Français' ? 'fr-FR' : 'ar-MA';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
    }
  };

  // Helper to detect Arabic characters for RTL support
  const isRTL = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  // Helper to parse **bold** text within a string
  const processBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Enhanced Formatting Function with RTL awareness
  const renderFormattedText = (text: string, isTextRtl: boolean) => {
    return text.split('\n').map((line, i) => {
      const trimmedLine = line.trim();

      // Headers / Section markers
      if (trimmedLine.startsWith('📄') || trimmedLine.startsWith('📌') || trimmedLine.startsWith('💡')) {
        return <div key={i} className={`font-bold text-lg text-slate-800 mt-4 mb-2 ${isTextRtl ? 'text-right' : 'text-left'}`}>{processBold(line)}</div>;
      }

      // Legal reference badges
      if (trimmedLine.startsWith('⚖️') || trimmedLine.startsWith('🏛️')) {
        return (
          <div key={i} className={`inline-block bg-slate-50 border border-slate-200 rounded-md px-3 py-1 my-1 text-slate-900 font-medium text-sm ${isTextRtl ? 'font-sans text-right' : ''}`}>
            {processBold(line)}
          </div>
        );
      }

      // Cost (Code block style - Amber)
      if (trimmedLine.startsWith('💰')) {
        return (
          <div key={i} className={`inline-block bg-amber-50 border border-amber-200 rounded-md px-3 py-1 my-1 text-amber-900 font-medium font-mono text-sm ${isTextRtl ? 'font-sans' : ''}`}>
            {processBold(line)}
          </div>
        );
      }

      // List items
      if (trimmedLine.startsWith('- ')) {
        return (
          <div key={i} className="flex items-start mb-1">
            <span className={`text-slate-500 mt-1 ${isTextRtl ? 'ml-2' : 'mr-2'}`}>•</span>
            <span className="text-gray-700">{processBold(line.replace('- ', ''))}</span>
          </div>
        );
      }

      // Quoted legal text (between « »)
      if (trimmedLine.includes('«') && trimmedLine.includes('»')) {
        return (
          <div key={i} className={`border-r-4 border-slate-400 pr-4 pl-2 my-2 bg-slate-50/50 py-2 rounded-sm text-gray-800 italic ${isTextRtl ? 'border-r-0 border-l-4 pl-4 pr-2 text-right' : 'text-left'}`}>
            {processBold(line)}
          </div>
        );
      }

      // Standard text
      return <div key={i} className={`text-gray-700 leading-relaxed ${trimmedLine === '' ? 'h-2' : ''}`}>{processBold(line)}</div>;
    });
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-white shadow-2xl sm:rounded-2xl sm:my-4 sm:h-[calc(100vh-6rem)] overflow-hidden border border-gray-100 ring-1 ring-slate-100/50">
      <InteractiveBackground />
      {/* Disclaimer / Banner */}
      <div className="relative z-10 bg-slate-50/80 backdrop-blur-sm p-3 border-b border-slate-100 flex justify-between items-center px-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
          <Scale className="w-4 h-4" />
          <span>مساعد قانوني متخصص في القانون المغربي — القانون الجنائي، مدونة الأسرة، الدستور</span>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleExportHistory}
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100/50 p-1.5 rounded-lg transition-all"
              title="تصدير المحادثة"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-slate-700 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
              title="حذف المحادثات"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide bg-gradient-to-b from-transparent to-gray-50/30">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full mt-[-2rem]">
            <div className="bg-slate-100 p-6 rounded-3xl shadow-sm mb-6 animate-pulse-slow">
              <span className="text-5xl">⚖️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">المستشار القانوني</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md" dir="rtl">
              مساعدك الذكي في القانون المغربي. اطرح سؤالك بالعربية أو الدارجة أو الفرنسية.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl px-2">
              {[
                { label: "ما هي عقوبة السرقة في القانون الجنائي؟", icon: "⚖️" },
                { label: "ما هي شروط الزواج في مدونة الأسرة؟", icon: "👪" },
                { label: "ما هي الحقوق الأساسية في الدستور؟", icon: "🏛️" }
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion.label)}
                  className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-slate-500 hover:shadow-md hover:scale-[1.02] transition-all group text-right"
                  dir="rtl"
                >
                  <span className="text-2xl ml-3 bg-gray-50 p-2 rounded-lg group-hover:bg-slate-50 transition-colors">{suggestion.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-slate-700">{suggestion.label}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-slate-500 rotate-180" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isMsgRtl = isRTL(msg.content);
          return (
            <div
              key={msg.id}
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                dir={isMsgRtl ? 'rtl' : 'ltr'}
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-5 py-4 shadow-sm transition-all ${msg.role === 'user'
                  ? 'bg-slate-600 text-white rounded-br-none shadow-slate-200'
                  : 'bg-white/40 backdrop-blur-md text-gray-800 rounded-bl-none border border-gray-200/50'
                  }`}
              >
                {msg.role === 'user' ? (
                  <p className={`text-[15px] leading-relaxed ${isMsgRtl ? 'text-right' : 'text-left'}`}>{msg.content}</p>
                ) : (
                  <div className={`text-[15px] ${isMsgRtl ? 'text-right' : 'text-left'}`}>
                    {renderFormattedText(msg.content, isMsgRtl)}
                  </div>
                )}
                <div className={`text-[10px] mt-2 opacity-70 font-medium tracking-wide ${msg.role === 'user'
                  ? `text-slate-100 ${isMsgRtl ? 'text-left' : 'text-right'}`
                  : `text-gray-400 ${isMsgRtl ? 'text-left' : 'text-right'}`
                  }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/40 backdrop-blur-md rounded-2xl rounded-bl-none px-6 py-4 shadow-sm border border-gray-200/50 flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm font-medium text-gray-500 animate-pulse" dir="rtl">جاري البحث في النصوص القانونية...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-3">

          {/* Language Selector */}
          <div className="relative w-full sm:w-auto min-w-[110px]">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Globe className="h-4 w-4 text-slate-600" />
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 block pl-9 p-2.5 transition-colors cursor-pointer hover:border-slate-300 outline-none"
            >
              <option value="Auto">Auto</option>
              <option value="Darija">الدارجة</option>
              <option value="Français">Français</option>
              <option value="Arabic">العربية</option>
            </select>
          </div>

          {/* Input Box */}
          <div className="relative flex-1 w-full group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اطرح سؤالك القانوني هنا..."
              className="w-full pl-5 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all placeholder:text-gray-400 text-gray-800"
              disabled={isLoading}
              dir="auto"
            />
            <button
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening
                ? 'bg-red-50 text-red-500 ring-2 ring-red-100'
                : 'hover:bg-gray-100 text-gray-400 hover:text-slate-600'
                }`}
              title="استخدم الصوت"
            >
              <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 w-full sm:w-auto bg-gradient-to-r from-slate-600 to-slate-500 text-white rounded-xl hover:shadow-lg hover:shadow-slate-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex justify-center items-center transform active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 text-center">
          <p className="text-[10px] text-gray-400" dir="rtl">
            المستشار القانوني يجيب بناءً على النصوص القانونية فقط. تحقق دائماً من المصادر الرسمية.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;