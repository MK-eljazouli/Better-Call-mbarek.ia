import React from 'react';
import { View } from '../types';
import { ShieldCheck, LayoutDashboard, MessageSquareText } from 'lucide-react';
import { motion } from 'framer-motion';
import AudioPlayer from './AudioPlayer';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  showSplash?: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, showSplash }) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(View.CHAT)}>
            {!showSplash ? (
              <motion.img
                layoutId="main-logo"
                src="/mbarek-logo.png"
                alt="Better Call Mbarek"
                className="h-20 py-1 w-auto object-contain hover:scale-105 transition-transform origin-left"
                transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
              />
            ) : (
              <div className="w-[180px] h-[60px]" />
            )}
          </div>

          <nav className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => onNavigate(View.CHAT)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentView === View.CHAT
                ? 'bg-slate-50 text-slate-700 shadow-sm ring-1 ring-slate-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <MessageSquareText className="w-4 h-4 mr-2" />
              Assistant
            </button>
            <button
              onClick={() => onNavigate(View.DASHBOARD)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentView === View.DASHBOARD
                ? 'bg-slate-50 text-slate-700 shadow-sm ring-1 ring-slate-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Impact
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            <AudioPlayer src="/theme.webm" />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;