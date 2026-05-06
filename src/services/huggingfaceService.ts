import { InferenceClient } from '@huggingface/inference';

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || '';

export async function chatWithAI(message: string, context: string) {
  if (!HF_TOKEN) {
    return "⚠️ **IA não configurada.** Por favor, configure a variável VITE_HF_TOKEN no ambiente de deploy para ativar a IA Assistente.";
  }

  try {
    const client = new InferenceClient(HF_TOKEN);
    
    const response = await client.chatCompletion({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages: [
        {
          role: 'system',
          content: `You are the AI assistant for "Kernel Barber Shopper", a luxury barber shop management SaaS.
Your goal is to help the shop manager (the user) with agenda, inventory, and financial insights.

Current Shop Context:
${context}`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 512,
      provider: 'auto' // Uses Hugging Face Inference Providers
    });

    return response.choices?.[0].message?.content || "Desculpe, não consegui processar sua mensagem.";
  } catch (error: any) {
    console.error("Hugging Face API Error:", error);
    
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate')) {
      return `⚠️ **Cota da API excedida.**
      
A chave da API Hugging Face atingiu o limite gratuito. 

**Soluções:**
1. **Aguarde** - A cota renovada em 24 horas
2. **Nova chave** - Crie uma nova em https://huggingface.co/settings/tokens
3. **Pro Plan** - Ative o plano Pro ($9/mês) para limites maiores

Ainda pode usar todo o sistema normalmente, apenas a IA está temporariamente indisponível.`;
    }
    
    if (error.message?.includes('token') || error.message?.includes('auth')) {
      return "⚠️ **Token inválido.** Verifique se a VITE_HF_TOKEN está correta no ambiente de deploy.";
    }
    
    if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
      return "⚠️ **Modelo não encontrado.** Tente novamente mais tarde ou verifique se o modelo 'meta-llama/Llama-3.1-8B-Instruct' está disponível.";
    }
    
    return "Desculpe, tive um problema ao processar sua solicitação. Tente novamente mais tarde.";
  }
}
