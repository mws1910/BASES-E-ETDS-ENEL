import { GoogleGenAI } from "@google/genai";
import { Substation } from "../types";

// Initialize the client with the API key from process.env as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Função de busca local (Fallback quando não há API Key)
 */
const localSearch = (message: string, currentStations: Substation[]): string => {
  const normalizedMsg = message.toLowerCase();
  
  // Tenta encontrar estações pelo nome ou sigla
  const foundStations = currentStations.filter(s => 
    normalizedMsg.includes(s.name.toLowerCase()) || 
    (s.code && normalizedMsg.includes(s.code.toLowerCase()))
  );

  if (foundStations.length === 0) {
    return "No modo offline, não encontrei nenhuma estação com esse nome na sua mensagem. Tente digitar o nome exato da base ou ETD (ex: 'Barueri').";
  }

  // Monta resposta com a primeira estação encontrada (ou lista se houver poucas)
  const mainStation = foundStations[0];
  let responseText = `Encontrei informações sobre **${mainStation.name}**.\n`;
  
  if (mainStation.type === 'BASE') responseText += `É uma Base Operacional na zona ${mainStation.zone}.\n`;
  else if (mainStation.type === 'ESD') responseText += `É uma ESD na zona ${mainStation.zone}.\n`;
  else responseText += `É uma Subestação (ETD) na zona ${mainStation.zone}.\n`;

  if (mainStation.address) {
    responseText += `📍 Endereço: ${mainStation.address}\n`;
  }

  // Adiciona a TAG mágica para criar o botão
  responseText += `\n{{STATION_ID:${mainStation.id}}}`;

  if (foundStations.length > 1) {
    responseText += `\n\nTambém encontrei outras similares: ${foundStations.slice(1, 4).map(s => s.name).join(', ')}.`;
  }

  return responseText;
};

export const sendMessageToGemini = async (
  message: string,
  currentStations: Substation[]
): Promise<string> => {
  
  // --- MODO LOCAL (SEM API KEY) ---
  // Check if API key is present in process.env
  if (!process.env.API_KEY) {
    // Simula um delay de rede para parecer natural
    await new Promise(resolve => setTimeout(resolve, 600));
    return localSearch(message, currentStations);
  }

  // --- MODO AI (COM API KEY) ---
  const contextData = currentStations.map(s => 
    `- ${s.name} (ID: ${s.id}, Type: ${s.type}) in ${s.zone} zone. Lat: ${s.lat}, Lng: ${s.lng}. Address: ${s.address || 'N/A'}`
  ).join('\n');

  const systemInstruction = `
    You are an intelligent assistant for an Electrical Grid Management App for Enel São Paulo.
    
    You have access to a database of known Substations (ETDs), Operational Bases (BASES) and ESDs.
    The user might ask about specific locations, coverage, or technical details.

    Current known database context:
    ${contextData}

    Rules:
    1. If the user asks about a location that exists in your database, ALWAYS include its ID in the response using this exact format: {{STATION_ID:the_id_here}}. For example: {{STATION_ID:w1}}.
    2. If the user asks for a location NOT in the database, use your Google Maps grounding to find real-world information.
    3. Be concise and professional.
    4. Provide distances if possible.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleMaps: {} }], // Enable grounding
      }
    });

    // Check for grounding chunks (Map results)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let textResponse = response.text || "Encontrei algumas informações.";

    if (groundingChunks && groundingChunks.length > 0) {
      textResponse += "\n\n**Encontrado no Google Maps:**\n";
      groundingChunks.forEach((chunk: any) => {
        if (chunk.maps?.title) {
           textResponse += `- ${chunk.maps.title}: [Ver no Mapa](${chunk.maps.uri})\n`;
        }
      });
    }

    return textResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro na comunicação com a IA. Verifique sua conexão ou a chave de API.";
  }
};