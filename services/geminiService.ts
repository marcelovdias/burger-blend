import { Recipe, SuggestedBlend } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Função utilitária para limpar a resposta e garantir JSON válido
const cleanJsonString = (text: string) => {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  const jsonStartBrace = cleaned.indexOf('{');
  const jsonStartBracket = cleaned.indexOf('[');

  let jsonStart = -1;
  if (jsonStartBrace !== -1 && jsonStartBracket !== -1) {
    jsonStart = Math.min(jsonStartBrace, jsonStartBracket);
  } else if (jsonStartBrace !== -1) {
    jsonStart = jsonStartBrace;
  } else {
    jsonStart = jsonStartBracket;
  }

  const jsonEnd = cleaned.lastIndexOf(jsonStartBrace === jsonStart ? '}' : ']');

  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  return cleaned;
};

export const extractRecipeFromImage = async (base64Image: string): Promise<Recipe> => {
  if (!API_KEY) throw new Error("API Key missing");

  const imageData = base64Image.split(',')[1] || base64Image;

  // FIX: Usando a versão ESPECÍFICA 002 (Mais estável que o alias genérico)
  const response = await fetch(`${BASE_URL}/gemini-1.5-flash-002:generateContent?key=${API_KEY}`, {
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

export const searchProfessionalBlends = async (query: string = "tendências"): Promise<SuggestedBlend[]> => {
  console.log("🚀 Iniciando busca com Gemini 1.5 Flash-002 por:", query);

  const prompt = `Atue como um caçador de tendências gastronômicas. Pesquise na web agora por "hambúrgueres tendência ${query} 2025" e "melhores blends de hambúrguer premiados recentes".
  
  Com base nos RESULTADOS DA PESQUISA, monte uma lista técnica de 10 blends reais.
  
  Retorne APENAS o JSON puro com este formato (sem markdown):
  [
    {
      "name": "Nome (ex: Vencedor Burger Fest SP)",
      "description": "Descrição baseada na notícia encontrada",
      "fatRatio": 0.20,
      "meats": [{"name": "Carne A", "ratio": 0.5}, {"name": "Carne B", "ratio": 0.5}]
    }
  ]`;

  try {
    if (!API_KEY) throw new Error("API Key missing");

    // FIX: Alterado para gemini-1.5-flash-002
    const response = await fetch(`${BASE_URL}/gemini-1.5-flash-002:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [
          { google_search: {} }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro API:", errorText);
      throw new Error(errorText);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    return JSON.parse(cleanJsonString(text));

  } catch (error) {
    console.error("🔥 Erro na busca:", error);
    return [];
  }
};