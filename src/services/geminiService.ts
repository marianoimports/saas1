import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function chatWithAI(message: string, context: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are the AI assistant for "Kernel Barber Shopper", a luxury barber shop management SaaS.
        Your goal is to help the shop manager (the user) with agenda, inventory, and financial insights.
        
        Current Shop Context:
        ${context}
        
        User message: "${message}"
        
        Response guidelines:
        - Be professional, helpful, and concise.
        - Use Markdown for bolding important info.
        - If the user asks for actions (like "schedule a client"), confirm the details but acknowledge this is a simulation for now if specific API calls aren't implemented yet.
      `
    });

    return response.text || "Desculpe, não consegui processar sua mensagem.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Desculpe, tive um problema ao processar sua solicitação. Tente novamente mais tarde.";
  }
}
