import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Platform } from "../types";

// Initialize the Gemini AI client
// Note: In a real production app, ensure your API key is secure.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeChatVibe = async (messages: ChatMessage[]): Promise<string> => {
  if (messages.length === 0) return "Chat vazio. Nada para analisar.";

  const recentMessages = messages.slice(-30).map(m => `[${m.platform}] ${m.user.username}: ${m.content}`).join("\n");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Você é um assistente de moderação para o streamer Gabepeixe.
      Analise as seguintes mensagens recentes do chat (que vem da Twitch e Kick misturados).
      Responda em Português do Brasil.
      
      Tarefa:
      1. Resuma o assunto principal em 1 frase.
      2. Defina o "Vibe" atual (ex: Hype, Tóxico, Engraçado, Spam, Chill).
      3. Se houver muito spam de emotes, mencione qual.
      
      Mensagens:
      ${recentMessages}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over depth
      }
    });

    return response.text || "Não foi possível analisar o chat no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a IA para análise.";
  }
};