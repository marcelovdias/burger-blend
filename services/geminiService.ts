import { Recipe, SuggestedBlend } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const cleanJsonString = (text: string) => {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // Tenta encontrar o início e fim do JSON (objeto ou array) para ignorar textos extras
  const jsonStartBrace = cleaned.indexOf('{');
  const jsonStartBracket = cleaned.indexOf('[');

  // Define onde começa o JSON (seja array ou objeto)
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

  // ATUALIZADO: Usando Gemini 2.5 Flash (Confirmado na sua lista)
  const response = await fetch(`${BASE_URL}/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: "image/jpeg", data: imageData } },
          { text: "Analise esta imagem de receita de hambúrguer. Extraia o nome, o percentual de gordura ideal (0-1), a lista de carnes utilizadas e suas proporções relativas entre si (soma=1), e o peso por unidade em gramas. Retorne APENAS JSON no formato: {\"name\": string, \"fatRatio\": number, \"meats\": [{\"name\": string, \"ratio\": number}], \"unitWeight\": number, \"grindMethod\": string}" }
        ]
      }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(cleanJsonString(text));
};


import { LOCAL_BLENDS } from "../src/data/blends";

export const searchProfessionalBlends = async (query: string = "tendências"): Promise<SuggestedBlend[]> => {
  console.log("🚀 Iniciando busca por:", query);

  // 1. Tenta buscar no banco de dados local primeiro (Curadoria)
  // Normaliza a query para comparar com as chaves (remove acentos, lowercase, etc se necessário)
  // Aqui faremos uma comparação direta por enquanto ou includes
  const localKey = Object.keys(LOCAL_BLENDS).find(key =>
    query.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(query.toLowerCase())
  );

  if (localKey) {
    console.log(`📚 Encontrado no banco local: ${localKey}`);
    // Simula um delay para não parecer "quebrado" de tão rápido, ou retorna instantâneo
    return LOCAL_BLENDS[localKey];
  }

  console.log("🤖 Buscando na IA (Gemini)...");

  const prompt = `Atue como um caçador de tendências gastronômicas. Pesquise na web agora por "hambúrgueres tendência ${query} 2025" e "melhores blends de hambúrguer premiados recentes".
  Com base nos RESULTADOS DA PESQUISA, monte uma lista técnica de 10 blends reais.
  Retorne APENAS o JSON puro com este formato:
  [
    {
      "name": "Nome do Blend",
      "description": "Descrição breve",
      "fatRatio": 0.20,
      "meats": [{"name": "Carne A", "ratio": 0.5}, {"name": "Carne B", "ratio": 0.5}]
    }
  ]`;

  try {
    if (!API_KEY) throw new Error("API Key missing");

    // ATUALIZADO: Usando gemini-2.5-flash com ferramenta de busca
    const response = await fetch(`${BASE_URL}/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Tenta usar a busca. Se der erro no 2.5, removeremos esta parte 'tools'
        tools: [
          { google_search: {} }
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro API:", errorText);
      throw new Error(errorText);
    }
    const data = await response.json();

    // Extração segura do texto
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    console.log("📝 Texto extraído (início):", text.substring(0, 100) + "...");

    const cleanedText = cleanJsonString(text);
    const blends: SuggestedBlend[] = JSON.parse(cleanedText);

    console.log(`✅ ${blends.length} blends encontrados e processados.`);

    return blends;

  } catch (error) {
    console.error("🔥 Falha na busca ou no processamento do JSON:", error);
    // Fallback: Se a API falhar, tenta retornar algo local genérico ou vazio
    const fallback = LOCAL_BLENDS["Clássicos"] || [];
    return fallback;
  }
};
