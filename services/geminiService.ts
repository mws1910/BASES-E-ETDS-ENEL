import { GoogleGenAI } from "@google/genai";
import { Substation } from "../types";

// Initialize the GoogleGenAI client with the API key from process.env
// The guidelines state: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendMessageToGemini = async (
  message: string,
  currentStations: Substation[]
): Promise<string> => {
  // Create a context string about the current known stations
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
    return "Desculpe, encontrei um erro ao processar sua solicitação. Tente novamente.";
  }
};