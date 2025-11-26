export enum Zone {
  WEST = 'Oeste',
  NORTH_CENTRAL = 'Norte/Centro',
  SOUTH_ABC = 'Sul/ABC',
  EAST = 'Leste',
}

export interface Substation {
  id: string;
  name: string;
  type: 'ETD' | 'BASE' | 'ESD'; // Estação Transformadora de Distribuição, Operational Base, or ESD
  zone: Zone;
  lat: number;
  lng: number;
  description?: string;
  voltage?: string; // e.g., 138kV, 88kV
  address?: string; // Physical address
  code?: string; // Abbreviation / Sigla (e.g., BUE, ALP)
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}