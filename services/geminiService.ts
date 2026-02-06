
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, SuggestedBlend } from "../types";

const getApiKey = () => {
  const key = process.env.API_KEY;
  // No Vercel, as variáveis são injetadas. Se falhar, o erro ajudará a diagnosticar.
  if (!key || key === 'undefined' || key === 'null') {
    throw new Error("API_KEY_MISSING");
  }
  return key;
};

const cleanJsonString = (text: string) => {
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      return text.substring(start, end + 1);
    }
    return text.replace(/```json/g, "").replace(/```/g, "").trim();
  } catch (e) {
    return "[]";
  }
};

export const extractRecipeFromImage = async (base64Image: string): Promise<Recipe> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1] || base64Image
          }
        },
        {
          text: "Analise esta imagem de receita de hambúrguer. Extraia o nome, o percentual de gordura ideal (fatRatio, valor entre 0 e 1), a lista de carnes utilizadas (meats) e suas proporções relativas entre si (ratio, soma deve ser 1), além do peso por unidade (unitWeight em gramas). Retorne apenas JSON."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          fatRatio: { type: Type.NUMBER },
          meats: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                ratio: { type: Type.NUMBER }
              }
            }
          },
          unitWeight: { type: Type.NUMBER },
          grindMethod: { type: Type.STRING }
        },
        required: ["name", "fatRatio", "meats", "unitWeight"]
      }
    }
  });

  return JSON.parse(cleanJsonString(response.text || "{}"));
};

export const searchProfessionalBlends = async (category: string = "clássicos"): Promise<SuggestedBlend[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Prompt ultra-específico para trazer os resultados da imagem solicitada
  const prompt = `Atue como um sommelier de carnes e especialista em hambúrgueres. 
  Utilize o Google Search para encontrar os blends de hambúrguer mais icônicos do mundo na categoria: ${category}.
  
  Exemplos OBRIGATÓRIOS de busca para 'Clássicos': Shake Shack Original Blend, Pat LaFrieda's Original Blend, Minetta Tavern Black Label, Peter Luger Steakhouse Blend, Gordon Ramsay's Burger Blend.
  
  Para cada item, retorne:
  1. name: O nome oficial do blend ou do chef/estabelecimento.
  2. description: Uma breve história técnica (ex: 'Recriação do famoso blend da rede de Nova York...').
  3. fatRatio: O percentual de gordura real documentado (ex: 0.22 para 22%).
  4. meats: Lista de cortes (ex: Peito, Acém, Fraldinha) com suas proporções estimadas (ratio).
  
  Retorne EXATAMENTE um array JSON. Não use Markdown fora do JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2, // Baixa temperatura para manter a precisão técnica
      },
    });

    const text = response.text || "[]";
    const jsonOnly = cleanJsonString(text);
    const blends: SuggestedBlend[] = JSON.parse(jsonOnly);

    // Extração das citações reais do Grounding para dar credibilidade
    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Referência Técnica",
        uri: chunk.web?.uri || ""
      }))
      .filter((c: any) => c.uri) || [];

    return blends.map(b => ({ 
      ...b, 
      citations: citations.slice(0, 3) // Limita a 3 citações principais por blend
    }));
  } catch (error: any) {
    console.error("Erro no Gemini Service:", error);
    if (error.message?.includes("API key not valid")) throw new Error("API_KEY_INVALID");
    throw error;
  }
};
