
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
    model: "gemini-2.0-flash-exp",
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
  const prompt = `Você é um especialista mundial em hambúrgueres artesanais. Pesquise blends reais e reconhecidos para a categoria: "${query}".
  
  IMPORTANTE: Retorne APENAS um array JSON válido com 8 a 10 objetos, sem texto adicional.
  
  Cada objeto DEVE ter exatamente esta estrutura:
  {
    "name": "Nome do blend ou restaurante famoso",
    "description": "Breve explicação técnica do blend",
    "fatRatio": 0.20,
    "meats": [{"name": "Corte de carne", "ratio": 0.5}, {"name": "Outro corte", "ratio": 0.5}]
  }
  
  Exemplos de blends conhecidos: Shake Shack, In-N-Out, Five Guys, Pat LaFrieda, Z Deli, Madero, etc.
  Retorne APENAS o JSON, começando com [ e terminando com ].`;

  try {
    if (!import.meta.env.VITE_API_KEY) {
      console.error("API Key não configurada!");
      throw new Error("API Key missing");
    }

    console.log("Buscando blends para:", query);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    console.log("Resposta bruta:", response.text);

    const text = cleanJsonString(response.text || "[]");
    console.log("JSON limpo:", text);

    const blends: SuggestedBlend[] = JSON.parse(text);

    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Referência Técnica",
        uri: chunk.web?.uri || ""
      }))
      .filter((c: any) => c.uri) || [];

    console.log("Blends encontrados:", blends.length);
    return blends.map(b => ({ ...b, citations }));

  } catch (error) {
    console.error("Erro na busca de blends:", error);
    return [];
  }
};

