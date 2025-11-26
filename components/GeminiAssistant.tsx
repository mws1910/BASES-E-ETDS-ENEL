import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Zap, MapPin } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { Substation, ChatMessage } from '../types';

interface GeminiAssistantProps {
  stations: Substation[];
  onSelectStation?: (station: Substation) => void;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ stations, onSelectStation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou seu assistente virtual Enel. Pergunte-me sobre localização de subestações, zonas de cobertura ou detalhes das bases.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await sendMessageToGemini(userMsg, stations);

    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to render text with Station Buttons
  const renderMessageContent = (text: string) => {
    // Regex to find {{STATION_ID:xxx}}
    const parts = text.split(/({{STATION_ID:.*?}})/g);
    
    return (
      <div className="space-y-2">
        {parts.map((part, i) => {
          if (part.startsWith('{{STATION_ID:') && part.endsWith('}}')) {
            const id = part.replace('{{STATION_ID:', '').replace('}}', '');
            const station = stations.find(s => s.id === id);
            
            if (station && onSelectStation) {
              return (
                <button 
                  key={i}
                  onClick={() => onSelectStation(station)}
                  className="flex items-center gap-2 bg-white text-enel-brand-brasil-green border border-enel-brand-brasil-green px-3 py-1.5 rounded-full text-xs font-bold hover:bg-enel-brand-brasil-green hover:text-white transition-colors my-1 shadow-sm w-fit"
                >
                  <MapPin size={12} />
                  Ver {station.name} no mapa
                </button>
              );
            }
            return null; // Should not happen if AI is correct
          }
          
          // Regular text processing (links + newlines)
          return (
            <span key={i}>
              {part.split('\n').map((line, lineIdx) => (
                <span key={lineIdx} className="block mb-1 last:mb-0">
                   {line.includes('](') ? (
                    <span dangerouslySetInnerHTML={{
                      __html: line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="underline font-medium hover:text-blue-200">$1</a>')
                    }} />
                  ) : line}
                </span>
              ))}
            </span>
          );
        })}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[1000] bg-enel-brand-brasil-green text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:bg-green-700 transition-all duration-200 flex items-center gap-2 group"
      >
        <span className="bg-white/20 p-1 rounded-full">
           <Zap className="text-white" fill="currentColor" size={20} />
        </span>
        <span className="font-semibold hidden sm:inline text-white">Assistente Enel IA</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[1000] w-[90vw] sm:w-[400px] h-[500px] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-enel-brand-brasil-green p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
           <div className="bg-white/20 p-1.5 rounded-full">
             <Zap className="text-white" fill="currentColor" size={18} />
           </div>
           <h3 className="font-bold text-lg">Assistente Enel IA</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-enel-brand-brasil-green text-white rounded-br-none shadow-md' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              {renderMessageContent(msg.text)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3 rounded-bl-none shadow-sm flex items-center gap-2">
              <Loader2 className="animate-spin text-enel-brand-brasil-green" size={16} />
              <span className="text-xs text-gray-500">Processando consulta...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Onde fica a ETD Barueri?"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-enel-brand-brasil-green focus:border-transparent"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="bg-enel-brand-brasil-green text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default GeminiAssistant;
