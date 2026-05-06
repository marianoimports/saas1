import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function chatWithAI(message: string, context: string) {
  if (!ai) {
    return "⚠️ **IA não configurada.** Por favor, configure a variável VITE_GEMINI_API_KEY no ambiente de deploy para ativar a IA Assistente.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-pro",
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
    
    // Check for quota exceeded error
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota')) {
      return `⚠️ **Cota da API excedida.**

A chave da API Gemini atingiu o limite gratuito. 

**Soluções:**
1. **Aguarde** - A cota renovada em 24 horas
2. **Nova chave** - Crie uma nova em https://aistudio.google.com/apikey
3. **Billing** - Ative o faturamento no Google Cloud para limites maiores

Ainda pode usar todo o sistema normalmente, apenas a IA está temporariamente indisponível.`;
    }
    
    if (error.message?.includes('API key not valid')) {
      return "⚠️ **API Key inválida.** Verifique se a VITE_GEMINI_API_KEY está correta no ambiente de deploy.";
    }
    
    return "Desculpe, tive um problema ao processar sua solicitação. Tente novamente mais tarde.";
  }
}
