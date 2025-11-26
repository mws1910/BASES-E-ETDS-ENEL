import React, { useState } from 'react';
import LeafletMap from './components/LeafletMap';
import Sidebar from './components/Sidebar';
import GeminiAssistant from './components/GeminiAssistant';
import { STATIONS } from './data/stations';
import { Substation, Zone } from './types';
import { Menu, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<Substation | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Zone | 'ALL'>('ALL');

  const handleSelectStation = (station: Substation) => {
    setSelectedStation(station);
    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 relative">
      {/* Mobile Sidebar Toggle (visible only when sidebar is closed) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-md shadow-md text-gray-700 hover:bg-gray-50 md:hidden"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <Sidebar 
        stations={STATIONS} 
        onSelectStation={handleSelectStation} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Map Area */}
      <main className={`flex-1 relative h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
        <LeafletMap 
          stations={STATIONS} 
          selectedStation={selectedStation} 
          activeFilter={activeFilter}
        />
        
        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 z-[500] bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-200 text-sm hidden sm:block min-w-[200px]">
          <h4 className="font-bold mb-3 text-gray-800 border-b border-gray-100 pb-2">Legenda de Zonas</h4>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-enel-purple shadow-sm ring-1 ring-gray-100"></span>
              <span className="text-gray-700 font-medium">Zona Oeste</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-enel-red shadow-sm ring-1 ring-gray-100"></span>
              <span className="text-gray-700 font-medium">Zona Norte / Centro</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-enel-green shadow-sm ring-1 ring-gray-100"></span>
              <span className="text-gray-700 font-medium">Zona Sul / ABC</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-enel-olive shadow-sm ring-1 ring-gray-100"></span>
              <span className="text-gray-700 font-medium">Zona Leste</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-enel-brand-brasil-blue shadow-sm ring-1 ring-gray-100"></span>
              <span className="text-gray-700 font-medium">ESD</span>
            </div>
            
            <div className="mt-4 pt-2 border-t border-gray-100">
               <div className="flex items-center gap-3">
                 <div className="w-5 h-5 bg-gray-500 border-2 border-white rounded-full shadow-sm flex items-center justify-center">
                    <Zap size={10} fill="#ffffff" className="text-white" />
                 </div>
                 <span className="text-gray-700 font-medium text-xs">Base Operacional (Cor da Zona)</span>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Gemini AI Assistant Chat */}
      <GeminiAssistant stations={STATIONS} onSelectStation={handleSelectStation} />
    </div>
  );
};

export default App;
