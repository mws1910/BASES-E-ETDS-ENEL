import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Substation, Zone } from '../types';

// Utility to get color class based on zone and type
const getIconColor = (zone: Zone, type: 'ETD' | 'BASE' | 'ESD') => {
  if (type === 'ESD') return 'bg-enel-brand-brasil-blue border-2 border-white';

  // Base and ETD now share zone color, but Base has distinct shape/icon in `createCustomIcon`
  switch (zone) {
    case Zone.WEST: return 'bg-enel-purple';
    case Zone.NORTH_CENTRAL: return 'bg-enel-red';
    case Zone.SOUTH_ABC: return 'bg-enel-green';
    case Zone.EAST: return 'bg-enel-olive';
    default: return 'bg-gray-500';
  }
};

interface MapProps {
  stations: Substation[];
  selectedStation: Substation | null;
  activeFilter: Zone | 'ALL';
}

// Component to handle map flyTo animations
const MapFlyTo = ({ target }: { target: Substation | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 14, {
        duration: 1.5
      });
    }
  }, [target, map]);
  return null;
};

const LeafletMap: React.FC<MapProps> = ({ stations, selectedStation, activeFilter }) => {
  const mapRef = useRef<L.Map>(null);
  
  // Default center: São Paulo
  const defaultCenter: [number, number] = [-23.5505, -46.6333];

  const createCustomIcon = (station: Substation) => {
    const colorClass = getIconColor(station.zone, station.type);
    
    let sizeClass = '';
    let opacityClass = 'opacity-100';
    let innerContent = '';
    
    // Size logic
    if (activeFilter === 'ALL') {
      // Default sizes
      sizeClass = station.type === 'BASE' ? 'w-8 h-8' : 'w-4 h-4';
    } else if (station.zone === activeFilter) {
      // Active Zone: Larger (Highlight)
      sizeClass = station.type === 'BASE' ? 'w-10 h-10 scale-110' : 'w-6 h-6 scale-125';
    } else {
      // Inactive Zone: Smaller & Faded
      sizeClass = station.type === 'BASE' ? 'w-4 h-4 scale-75' : 'w-2 h-2 scale-75';
      opacityClass = 'opacity-50'; 
    }

    // Icon content logic
    if (station.type === 'BASE') {
      // Lightning bolt SVG - Using Zone Color Background
      // Added white border for Base to make it pop
      innerContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" stroke="none" class="w-3/4 h-3/4 mx-auto my-auto drop-shadow-md"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`;
    } else {
      innerContent = '';
    }

    const borderClass = station.type === 'BASE' ? 'border-2 border-white ring-1 ring-gray-400' : 'border border-white';

    return L.divIcon({
      className: 'custom-icon',
      html: `<div class="${colorClass} ${sizeClass} ${opacityClass} ${borderClass} rounded-full shadow-md flex items-center justify-center transform hover:scale-125 transition-all duration-300">${innerContent}</div>`,
      iconSize: [40, 40], // Canvas size
      iconAnchor: [20, 20], // Center
      popupAnchor: [0, -10],
    });
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={11}
      className="w-full h-full"
      zoomControl={false}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      
      <MapFlyTo target={selectedStation} />

      {stations.map((station) => (
        <Marker 
          key={station.id} 
          position={[station.lat, station.lng]} 
          icon={createCustomIcon(station)}
        >
          {/* Tooltip for Hover Details */}
          <Tooltip direction="top" offset={[0, station.type === 'BASE' ? -25 : -15]} opacity={1}>
            <div className="flex flex-col items-center text-center p-1 min-w-[120px]">
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-white mb-1 shadow-sm ${
                    station.zone === Zone.WEST ? 'bg-enel-purple' :
                    station.zone === Zone.NORTH_CENTRAL ? 'bg-enel-red' :
                    station.zone === Zone.SOUTH_ABC ? 'bg-enel-green' :
                    'bg-enel-olive'
                }`}>
                    {station.zone}
                </span>
                <h3 className="font-bold text-sm text-gray-800 leading-tight">{station.name}</h3>
                {station.code && <span className="text-xs text-gray-500 font-mono font-bold tracking-wide mt-0.5">{station.code}</span>}
                
                {/* Type Badge */}
                {station.type === 'BASE' && (
                    <span className="mt-1 text-[10px] bg-gray-800 text-white px-1.5 rounded flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> BASE
                    </span>
                )}
                {station.type === 'ESD' && (
                     <span className="mt-1 text-[10px] bg-enel-brand-brasil-blue text-white px-1.5 rounded shadow-sm">ESD</span>
                )}
                {/* Short Address for all types on Hover */}
                {station.address && (
                     <span className="text-[9px] text-gray-500 mt-1 max-w-[150px] truncate block italic">{station.address.split(',')[0]}</span>
                 )}
            </div>
          </Tooltip>

          <Popup className="custom-popup">
            <div className="p-1">
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded text-white ${
                station.zone === Zone.WEST ? 'bg-enel-purple' :
                station.zone === Zone.NORTH_CENTRAL ? 'bg-enel-red' :
                station.zone === Zone.SOUTH_ABC ? 'bg-enel-green' :
                'bg-enel-olive'
              }`}>
                {station.zone}
              </span>
              
              <div className="flex items-center justify-between mt-1">
                 <h3 className="font-bold text-lg text-gray-800">{station.name}</h3>
                 {station.code && (
                   <span className="ml-2 bg-gray-200 text-gray-700 text-xs font-mono font-bold px-1.5 py-0.5 rounded border border-gray-300">
                     {station.code}
                   </span>
                 )}
              </div>
              
              <p className="text-sm text-gray-600 mb-1">
                Tipo: {station.type === 'ETD' ? 'Subestação' : station.type === 'BASE' ? 'Base Operacional' : 'ESD'}
              </p>
              
              {station.address && (
                <p className="text-xs text-gray-700 bg-gray-50 border border-gray-200 p-1 rounded mt-1 mb-1 italic">
                  {station.address}
                </p>
              )}

              {station.voltage && (
                <p className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-1 rounded">
                  {station.voltage}
                </p>
              )}
              <div className="mt-2 text-xs text-blue-600 underline cursor-pointer" onClick={() => {
                window.open(`https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`, '_blank');
              }}>
                Abrir no Google Maps
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default LeafletMap;