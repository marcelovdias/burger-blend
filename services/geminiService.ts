
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, SuggestedBlend } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const cleanJsonString = (text: string) => {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonStart = cleaned.indexOf('[');
  const jsonEnd = cleaned.lastIndexOf(']');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  return cleaned;
};

export const extractRecipeFromImage = async (base64Image: string): Promise<Recipe> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          },
          {
            text: "Analise esta imagem de receita de hambúrguer. Extraia o nome, o percentual de gordura ideal, a lista de carnes utilizadas e suas proporções relativas entre si, além do peso por unidade. Retorne apenas JSON."
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          fatRatio: { type: Type.NUMBER, description: "Percentual de gordura (0-1)" },
          meats: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                ratio: { type: Type.NUMBER, description: "Proporção relativa entre as carnes (soma deve ser 1)" }
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

export const searchProfessionalBlends = async (query: string = "clássicos"): Promise<SuggestedBlend[]> => {
  const prompt = `Você é um especialista em hambúrgueres. Pesquise o blend real ou fiel para: "${query}".
  Retorne um array JSON com 6 a 10 objetos.
  Cada objeto deve ter:
  - name: Nome do blend ou restaurante.
  - description: Breve explicação técnica.
  - fatRatio: Número entre 0.15 e 0.30.
  - meats: Array de objetos {name: string, ratio: number} onde a soma dos ratios é 1.
  
  Retorne APENAS o JSON puro, sem explicações.`;

  try {
    if (!import.meta.env.VITE_API_KEY) throw new Error("API Key missing");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = cleanJsonString(response.text || "[]");
    const blends: SuggestedBlend[] = JSON.parse(text);

    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Referência Técnica",
        uri: chunk.web?.uri || ""
      }))
      .filter((c: any) => c.uri) || [];

    return blends.map(b => ({ ...b, citations }));

  } catch (error) {
    console.error("Search failed:", error);
    // Fallback para não quebrar a UI caso a busca falhe
    return [];
  }
};
