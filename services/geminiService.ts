import { Recipe, SuggestedBlend } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Função utilitária para limpar a resposta e garantir JSON válido
const cleanJsonString = (text: string) => {
  // Remove marcadores de markdown comuns (```json, ```)
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

  // Remove o header do base64 se existir (data:image/jpeg;base64,...)
  const imageData = base64Image.split(',')[1] || base64Image;

  // ATUALIZADO: Usando gemini-2.5-flash
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

export const searchProfessionalBlends = async (query: string = "tendências"): Promise<SuggestedBlend[]> => {
  console.log("🚀 Iniciando busca REAL na web por:", query);

  const prompt = `Pesquise na web agora por "hambúrgueres tendência ${query} 2025" e "melhores blends de hambúrguer premiados recentes".
  
  Com base nos RESULTADOS DA PESQUISA, monte uma lista técnica de 10 blends.
  
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

    // MUDANÇA 1: Usando gemini-2.0-flash (Mais confiável para Tools/Busca)
    const response = await fetch(`${BASE_URL}/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // MUDANÇA 2: Configuração explícita para FORÇAR a busca (threshold 0.0 obriga a busca)
        tools: [
          {
            google_search_retrieval: {
              dynamic_retrieval_config: {
                mode: "MODE_DYNAMIC",
                dynamic_threshold: 0.0 // 0.0 força a busca sempre que possível
              }
            }
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      // Se der 404 de novo, é sinal que sua API Key não tem acesso a busca ou ao modelo 2.0
      const errorText = await response.text();
      console.error("❌ Erro API:", errorText);
      throw new Error(errorText);
    }

    const data = await response.json();

    // LOG DE DEPURAÇÃO: Verifica se a busca realmente aconteceu
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.searchEntryPoint) {
      console.log("✅ CONFIRMADO: O Google Search foi acionado!");
      console.log("🔍 Fontes consultadas:", groundingMetadata.groundingChunks?.length || 0);
    } else {
      console.warn("⚠️ AVISO: A API retornou resposta, mas NÃO usou o Google Search (Grounding).");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    return JSON.parse(cleanJsonString(text));

  } catch (error) {
    console.error("🔥 Erro:", error);
    return [];
  }
};
