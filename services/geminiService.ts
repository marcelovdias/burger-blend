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

  // Prompt ajustado para buscar tendências reais e trazer mais resultados
  const prompt = `Atue como um caçador de tendências gastronômicas e especialista em hambúrgueres. 
  Pesquise na web por "melhores blends de hambúrguer ${query}", "burger blend trends 2024 2025" e receitas de hamburguerias famosas.
  
  Liste as 15 receitas mais relevantes encontradas (tendências atuais ou clássicos famosos).
  Para cada uma, estime a composição técnica do blend baseada nas descrições encontradas na pesquisa.
  
  Retorne APENAS um array JSON puro. Não use Markdown. O formato deve ser EXATAMENTE este:
  [
    {
      "name": "Nome do Burger ou Restaurante",
      "description": "Breve descrição (ex: 'Tendência Smash de NY' ou 'Clássico do restaurante X')",
      "fatRatio": 0.20,
      "meats": [
        {"name": "Peito", "ratio": 0.5},
        {"name": "Acém", "ratio": 0.5}
      ]
    }
  ]
  
  REGRAS:
  1. "fatRatio" deve ser um número entre 0.15 e 0.30.
  2. A soma dos "ratio" dentro de "meats" deve ser SEMPRE 1.0 (ex: 0.5 + 0.5 ou 0.33 + 0.33 + 0.34).
  3. SEM explicações antes ou depois do JSON. Apenas o array cru.`;

  try {
    if (!API_KEY) {
      console.error("❌ API Key não encontrada! Verifique o .env.");
      throw new Error("API Key missing");
    }

    console.log("📡 Enviando requisição com Google Search...");
    
    // ATUALIZADO: Usando gemini-2.5-flash com ferramenta de busca
    const response = await fetch(`${BASE_URL}/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // ATIVANDO O GOOGLE SEARCH
        tools: [
          { google_search: {} }
        ],
        generationConfig: {
          temperature: 0.5, // Equilíbrio entre criatividade e precisão dos dados buscados
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192, // Limite alto para caber a lista de 15+ itens
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
    
    // Extração segura do texto
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    console.log("📝 Texto extraído (início):", text.substring(0, 100) + "...");

    const cleanedText = cleanJsonString(text);
    const blends: SuggestedBlend[] = JSON.parse(cleanedText);
    
    console.log(`✅ ${blends.length} blends encontrados e processados.`);

    return blends;

  } catch (error) {
    console.error("🔥 Falha na busca ou no processamento do JSON:", error);
    // Retorna array vazio para não quebrar a UI
    return [];
  }
};
