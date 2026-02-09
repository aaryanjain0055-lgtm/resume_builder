import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithAssistant } from '../services/geminiService';
import { Icons } from '../constants';

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', text: 'Hi! I\'m your Career Assistant. Need help with your resume or interview prep?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Format history for Gemini
    const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    try {
        const responseText = await chatWithAssistant(history, userMsg.text);
        
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: responseText || "I'm having trouble answering that right now.",
            timestamp: new Date()
        }]);
    } catch (error) {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: "Sorry, I lost connection. Please try again.",
            timestamp: new Date()
        }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 h-[500px] bg-[#0f0f2d] border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.15)] flex flex-col overflow-hidden animate-fade-in backdrop-blur-md">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 p-4 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                <span className="font-bold text-white tracking-wide">Career Copilot</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#05051e]/80">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                            ? 'bg-cyan-600 text-white rounded-tr-none' 
                            : 'bg-[#1a1a3a] text-gray-200 border border-white/10 rounded-tl-none'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-[#1a1a3a] p-3 rounded-lg rounded-tl-none border border-white/10 flex gap-1">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-[#0f0f2d] border-t border-white/10 flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask career advice..."
                className="flex-1 bg-[#1a1a3a] text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
            <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded-full shadow-[0_0_15px_rgba(8,145,178,0.5)] hover:shadow-[0_0_25px_rgba(8,145,178,0.7)] transition-all duration-300 transform hover:scale-105 group relative"
        >
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
};