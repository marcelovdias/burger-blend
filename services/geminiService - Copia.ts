import { Recipe, SuggestedBlend } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

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
  if (!API_KEY) throw new Error("API Key missing");

  const imageData = base64Image.split(',')[1] || base64Image;

  const response = await fetch(`${BASE_URL}/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: "image/jpeg", data: imageData } },
          { text: "Analise esta imagem de receita de hambúrguer. Extraia o nome, o percentual de gordura ideal (0-1), a lista de carnes utilizadas e suas proporções relativas entre si (soma=1), e o peso por unidade em gramas. Retorne APENAS JSON no formato: {\"name\": string, \"fatRatio\": number, \"meats\": [{\"name\": string, \"ratio\": number}], \"unitWeight\": number, \"grindMethod\": string}" }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  return JSON.parse(cleanJsonString(text));
};

export const searchProfessionalBlends = async (query: string = "clássicos"): Promise<SuggestedBlend[]> => {
  console.log("🚀 Iniciando busca por:", query);

  const prompt = `Você é um especialista em hambúrgueres. Liste exatamente 10 receitas reais de blends de hambúrguer profissionais para: "${query}".
  
  Retorne APENAS um array JSON neste formato exato:
  [
    {
      "name": "Nome do Blend ou Restaurante",
      "description": "Breve descrição técnica",
      "fatRatio": 0.20,
      "meats": [
        {"name": "Nome da Carne", "ratio": 0.5},
        {"name": "Outra Carne", "ratio": 0.5}
      ]
    }
  ]
  
  IMPORTANTE: 
  - fatRatio entre 0.15 e 0.30
  - soma de todos os ratios em meats deve ser 1
  - Retorne APENAS o JSON, sem texto adicional`;

  try {
    if (!API_KEY) {
      console.error("❌ API Key não encontrada! Verifique o .env.");
      throw new Error("API Key missing");
    }

    console.log("📡 Enviando requisição para Gemini API...");
    const response = await fetch(`${BASE_URL}/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      })
    });

    console.log("📥 Status da resposta:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro detalhado da API:", errorText);
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("📦 Dados brutos recebidos:", data);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    console.log("📝 Texto extraído:", text);

    const cleanedText = cleanJsonString(text);
    const blends: SuggestedBlend[] = JSON.parse(cleanedText);
    console.log("✅ Blends parseados com sucesso:", blends);

    return blends;

  } catch (error) {
    console.error("🔥 Falha crítica na busca:", error);
    return [];
  }
};
