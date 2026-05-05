import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('VITE_GEMINI_API_KEY not found. AI features will be disabled.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function chatWithAI(message: string, context: string) {
  if (!ai) {
    return "⚠️ **IA não configurada.** Por favor, configure a variável VITE_GEMINI_API_KEY no ambiente de deploy para ativar a IA Assistente.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
        You are the AI assistant for "Kernel Barber Shopper", a luxury barber shop management SaaS.
        Your goal is to help the shop manager (the user) with agenda, inventory, and financial insights.
        
        Current Shop Context:
        ${context}
        
        User message: "${message}"
        
        Response guidelines:
        - Be professional, helpful, and concise.
        - Use Markdown for bolding important info.
        - Respond in Brazilian Portuguese.
        - If the user asks for actions (like "schedule a client"), confirm the details but acknowledge this is a simulation for now if specific API calls aren't implemented yet.
      `
    });

    return response.text || "Desculpe, não consegui processar sua mensagem.";
  } catch (error: any) {
    console.error("AI Error:", error);
    
    if (error.message?.includes('API key not valid')) {
      return "⚠️ **API Key inválida.** Verifique se a VITE_GEMINI_API_KEY está correta no ambiente de deploy.";
    }
    
    return "Desculpe, tive um problema ao processar sua solicitação. Tente novamente mais tarde.";
  }
}
