import React, { useState, useMemo } from 'react';
import { Substation, Zone } from '../types';
import { MapPin, Search, Filter, ChevronDown, ChevronRight, Zap, Share2 } from 'lucide-react';

interface SidebarProps {
  stations: Substation[];
  onSelectStation: (station: Substation) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  activeFilter: Zone | 'ALL';
  onFilterChange: (filter: Zone | 'ALL') => void;
}

// Enel Brasil Logo Component (Green/Yellow/Blue)
const EnelLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 140 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* e (first) */}
    <path fillRule="evenodd" clipRule="evenodd" d="M16.5 38C22.8513 38 28 32.8513 28 26.5H13.5C13.5 30.35 15.85 32.65 18.95 32.65C22.05 32.65 24.4 30.35 24.4 26.5H28C28 20.1487 22.8513 15 16.5 15C10.1487 15 5 20.1487 5 26.5C5 32.8513 10.1487 38 16.5 38ZM16.5 18.05C20.25 18.05 22.65 18.05 23.5 19.5H16.5V24.2H13.5C13.5 20.35 15.85 18.05 18.95 18.05H16.5Z" fill="#009640"/>
    <path d="M13.5 26.5H24.5V29C24.5 29 22 32.65 18.95 32.65C15.9 32.65 13.5 30.35 13.5 26.5Z" fill="#FFD700" fillOpacity="0.8"/>
    
    {/* n */}
    <path d="M35 38V15.5H43.5V19.5C44.8 16.5 47.5 15 51.5 15C57.5 15 60.5 19.5 60.5 25.5V38H52V26.5C52 22.5 50.5 21 48 21C45.5 21 43.5 23 43.5 26.5V38H35Z" fill="#009640"/>
    <path d="M35 15.5H40L35 25V15.5Z" fill="#004593"/>
    
    {/* e (second) */}
    <path fillRule="evenodd" clipRule="evenodd" d="M76.5 38C82.8513 38 88 32.8513 88 26.5H73.5C73.5 30.35 75.85 32.65 78.95 32.65C82.05 32.65 84.4 30.35 84.4 26.5H88C88 20.1487 82.8513 15 76.5 15C70.1487 15 65 20.1487 65 26.5C65 32.8513 70.1487 38 76.5 38ZM76.5 18.05C80.25 18.05 82.65 18.05 83.5 19.5H76.5V24.2H73.5C73.5 20.35 75.85 18.05 78.95 18.05H76.5Z" fill="#009640"/>
    <path d="M73.5 26.5H84.5V29C84.5 29 82 32.65 78.95 32.65C75.9 32.65 73.5 30.35 73.5 26.5Z" fill="#FFD700" fillOpacity="0.8"/>

    {/* l */}
    <path d="M95 38V13H103.5V38H95Z" fill="#009640"/>
    
    {/* BRASIL */}
    <text x="5" y="47" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="8" letterSpacing="4.5" fill="#009640">BRASIL</text>
  </svg>
);

interface AccordionItemProps {
  title: string;
  count: number;
  colorClass: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ 
  title, 
  count,
  colorClass,
  isOpen, 
  onToggle, 
  children 
}) => {
  return (
    <div className="border-b border-gray-100">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <span className="text-sm font-semibold text-gray-700 uppercase">{title}</span>
        </div>
        <div className="flex items-center gap-2">
           {/* Color Indicator */}
           <div className={`w-3 h-3 rounded-sm ${colorClass}`}></div>
           <span className="text-xs text-gray-400 font-mono">({count})</span>
        </div>
      </button>
      {isOpen && (
        <div className="bg-gray-50/50 pl-4 pr-2 py-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  stations, 
  onSelectStation, 
  isOpen, 
  toggleSidebar,
  activeFilter,
  onFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for accordion sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [Zone.WEST]: true,
    [Zone.NORTH_CENTRAL]: true,
    [Zone.SOUTH_ABC]: true,
    [Zone.EAST]: true,
  });

  const toggleSection = (zone: string) => {
    // Calculate the new open state for the clicked section
    const isOpening = !openSections[zone];
    
    // UI Toggle State
    setOpenSections(prev => ({ ...prev, [zone]: isOpening }));

    // Active Filter Logic:
    // If we are OPENING a section, set it as the active filter to highlight its markers.
    // If we are CLOSING a section and it was the currently active filter, reset to ALL.
    if (isOpening) {
      onFilterChange(zone as Zone);
    } else {
      if (activeFilter === zone) {
        onFilterChange('ALL');
      }
    }
  };

  // Group stations by zone
  const groupedStations = useMemo(() => {
    const groups: Record<string, Substation[]> = {
      [Zone.WEST]: [],
      [Zone.NORTH_CENTRAL]: [],
      [Zone.SOUTH_ABC]: [],
      [Zone.EAST]: [],
    };

    stations.forEach(station => {
      const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            station.code?.toLowerCase().includes(searchTerm.toLowerCase());
      if (matchesSearch) {
        if (groups[station.zone]) {
          groups[station.zone].push(station);
        }
      }
    });

    // Sort: Bases first, then alphabetically
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (a.type === 'BASE' && b.type !== 'BASE') return -1;
        if (a.type !== 'BASE' && b.type === 'BASE') return 1;
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  }, [stations, searchTerm]);

  const zoneConfig = {
    [Zone.WEST]: { label: 'SALA OESTE', color: 'bg-enel-purple' },
    [Zone.NORTH_CENTRAL]: { label: 'SALA NORTE', color: 'bg-enel-red' },
    [Zone.SOUTH_ABC]: { label: 'SALA SUL', color: 'bg-enel-green' },
    [Zone.EAST]: { label: 'SALA LESTE', color: 'bg-enel-olive' },
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-20 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="p-4 bg-white border-b-2 border-enel-brand-brasil-green/20 shadow-sm relative z-10">
        <div className="flex justify-between items-center mb-1">
           <div className="flex items-center gap-2">
            <EnelLogo className="h-10 w-auto" />
            <div className="h-8 w-px bg-gray-200 mx-1"></div>
            <span className="font-light text-lg tracking-wide text-gray-500 uppercase">Viewer</span>
           </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:bg-gray-100 p-1 rounded">
             <Filter size={20}/>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest pl-1 mt-1 font-semibold">Monitoramento de Bases e ETDs</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nome ou sigla..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-enel-brand-brasil-green/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto">
        {(Object.keys(zoneConfig) as Zone[]).map((zone) => {
          const stationsInZone = groupedStations[zone] || [];
          if (stationsInZone.length === 0 && searchTerm) return null;

          return (
            <AccordionItem
              key={zone}
              title={zoneConfig[zone].label}
              count={stationsInZone.length}
              colorClass={zoneConfig[zone].color}
              isOpen={openSections[zone]}
              onToggle={() => toggleSection(zone)}
            >
              {stationsInZone.map(station => (
                <div 
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  className="group flex items-center justify-between p-2 pl-3 rounded-md hover:bg-white hover:shadow-sm cursor-pointer border border-transparent hover:border-gray-200 transition-all"
                >
                   <div className="flex items-center gap-2.5 overflow-hidden">
                      {/* Icon */}
                      {station.type === 'BASE' ? (
                        <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${zoneConfig[zone].color}`}>
                           <Zap size={12} className="text-white" fill="currentColor"/>
                        </div>
                      ) : (
                        <MapPin size={16} className={`shrink-0 ${zoneConfig[zone].color.replace('bg-', 'text-')}`} />
                      )}
                      
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-medium text-gray-700 truncate">{station.name}</span>
                           {station.code && <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1 rounded border border-gray-200 shrink-0">{station.code}</span>}
                        </div>
                        
                        {station.type === 'BASE' && <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Base Operacional</span>}
                        {station.address && <span className="text-[10px] text-gray-400 truncate max-w-[180px]">{station.address}</span>}
                      </div>
                   </div>
                   
                   {/* Action Icon (Visual only) */}
                   <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                      <Share2 size={14} className="text-gray-400" />
                   </div>
                </div>
              ))}
            </AccordionItem>
          );
        })}
        
        {searchTerm && Object.values(groupedStations).every((g: Substation[]) => g.length === 0) && (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nenhuma estação encontrada.
            </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 text-center">
        Dados demonstrativos Enel SP.
      </div>
    </div>
  );
};

export default Sidebar;