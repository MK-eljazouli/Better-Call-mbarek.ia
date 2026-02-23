import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import { View, Message } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash after 3.2 seconds (approx 4s total including transition)
    const t = setTimeout(() => setShowSplash(false), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1.02, 0.98] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <motion.img
                layoutId="main-logo"
                src="/mbarek-logo.png"
                alt="Better Call Mbarek"
                className="w-80 md:w-[500px] object-contain drop-shadow-2xl"
                transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
              />
              <div className="mt-12 flex gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        showSplash={showSplash}
      />

      <main className="flex-1 w-full">
        {currentView === View.CHAT ? (
          <ChatInterface messages={messages} setMessages={setMessages} />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
};

export default App;